import { Request, Response } from 'express';
import { AuthService } from '@services/auth.service';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '@interfaces/auth.interface';

import { DataSource } from 'typeorm';

export class AuthController {
  private authService: AuthService;

  constructor(dataSource: DataSource) {
    this.authService = new AuthService(dataSource);
  }

  /**
   * Registrar un nuevo usuario
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: RegisterRequest = req.body;

      // Validar datos requeridos
      if (!data.email || !data.password || !data.name || !data.lastName) {
        res.status(400).json({ 
          message: 'Faltan datos requeridos: email, password, name, lastName' 
        });
        return;
      }

      const result = await this.authService.register(data);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error al registrar usuario',
      });
    }
  };

  /**
   * Iniciar sesión
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: LoginRequest = req.body;

      // Validar datos requeridos
      if (!data.email || !data.password) {
        res.status(400).json({ 
          message: 'Faltan datos requeridos: email, password' 
        });
        return;
      }

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
      const data: RefreshTokenRequest = req.body;

      // Validar que se proporcione el refresh token
      if (!data.refreshToken) {
        res.status(400).json({ 
          message: 'Se requiere el refresh token' 
        });
        return;
      }

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

  /**
   * Cerrar sesión
   * El cliente debe eliminar los tokens de su almacenamiento
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.authService.logout();

      res.status(200).json({
        message: 'Sesión cerrada exitosamente. Por favor elimina los tokens del cliente.',
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error al cerrar sesión',
      });
    }
  };

  /**
   * Obtener información del usuario autenticado
   */
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          message: 'Usuario no autenticado' 
        });
        return;
      }

      res.status(200).json({
        message: 'Usuario autenticado',
        data: req.user,
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error al obtener usuario',
      });
    }
  };
}
