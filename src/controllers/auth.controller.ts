import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthService } from '@services/auth.service';
import { UserLoginDto, UserTokenRefreshDto } from '@/dtos/user.dto';

export class AuthController {
  private authService: AuthService;

  constructor(dataSource: DataSource) {
    this.authService = new AuthService(dataSource);
  }

  /**
   * Iniciar sesión
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: UserLoginDto = req.body;

      const result = await this.authService.login(data);

      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      });
    }
  };

  /**
   * Refrescar el access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: UserTokenRefreshDto = req.body;

      const result = await this.authService.refreshToken(data.refreshToken);

      res.status(200).json({
        message: 'Token refrescado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        message: error instanceof Error ? error.message : 'Error al refrescar token',
      });
    }
  };
}
