import { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthService } from '@services/auth.service';
import { UserLoginDto, UserTokenRefreshDto } from '@/dtos/user.dto';
import { StatusCodes } from 'http-status-codes';

export class AuthController {
  private authService: AuthService;

  constructor(dataSource: DataSource) {
    this.authService = new AuthService(dataSource);
  }

  /**
   * Iniciar sesión
   * POST /auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UserLoginDto = req.body;

      const result = await this.authService.login(data);

      res.status(StatusCodes.OK).json({
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refrescar el access token
   * POST /auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UserTokenRefreshDto = req.body;

      const result = await this.authService.refreshToken(data.refreshToken);

      res.status(StatusCodes.OK).json({
        message: 'Token refrescado exitosamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
