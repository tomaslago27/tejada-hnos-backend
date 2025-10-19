import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from '@entities/user.entity';
import { JwtUtils } from '@utils/jwt.utils';
import { 
  LoginRequest, 
  AuthResponse, 
  TokenPayload 
} from '@interfaces/auth.interface';

export class AuthService {
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Iniciar sesión
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Buscar usuario con password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: data.email })
      .getOne();

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

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
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verificar el refresh token
      const payload = JwtUtils.verifyRefreshToken(token);

      // Buscar el usuario para generar nuevos tokens
      const user = await this.userRepository.findOne({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevos tokens
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  /**
   * Generar access token y refresh token
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
   */
  verifyAccessToken(token: string): TokenPayload {
    return JwtUtils.verifyAccessToken(token);
  }
}
