import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from '@entities/user.entity';
import { JwtUtils } from '@utils/jwt.utils';
import { 
  LoginRequest, 
  AuthResponse, 
  TokenPayload 
} from '@interfaces/auth.interface';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class AuthService {
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Iniciar sesión
   * @param data LoginRequest
   * @returns Promise<AuthResponse>
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Buscar usuario con password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: data.email })
      .getOne();

    if (!user) 
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Credenciales inválidas');

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) 
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Credenciales inválidas');

    // Generar tokens
    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refrescar el access token usando el refresh token
   * @param token string
   * @returns Promise<{ accessToken: string; refreshToken: string }>
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verificar el refresh token
      const payload = JwtUtils.verifyRefreshToken(token);

      // Buscar el usuario para generar nuevos tokens
      const user = await this.userRepository.findOne({
        where: { id: payload.userId }
      });

      if (!user) 
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'Token inválido');

      // Generar nuevos tokens
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Refresh token inválido o expirado');
    }
  }

  /**
   * Generar access token y refresh token
   * @param user User
   * @returns { accessToken: string; refreshToken: string }
   */
  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      lastName: user.lastName,
    };

    // Generar access token (duración corta: 15 minutos por defecto)
    const accessToken = JwtUtils.generateAccessToken(payload);

    // Generar refresh token (duración más larga: hasta 12 horas)
    const refreshToken = JwtUtils.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Verificar access token
   * @param token string
   * @returns TokenPayload
   */
  verifyAccessToken(token: string): TokenPayload {
    return JwtUtils.verifyAccessToken(token);
  }
}
