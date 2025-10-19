import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { DataSource } from 'typeorm';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@enums/index';
import { validateData } from '@/middlewares/validation.middleware';
import { UserLoginDto, UserTokenRefreshDto } from '@/dtos/user.dto';

export const createAuthRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const authController = new AuthController(dataSource);

  /** TO-DO: Delete this route, users only can be created via admin user
   * @route   POST /auth/register
   * @desc    Registrar un nuevo usuario
   * @access  Public
   */
  router.post('/register', authController.register);

  /**
   * @route   POST /auth/login
   * @desc    Iniciar sesión
   * @access  Public
   */
  router.post('/login', validateData(UserLoginDto), authController.login);

  /**
   * @route   POST /auth/refresh-token
   * @desc    Refrescar el token de acceso
   * @access  Public (requiere un refresh token válido)
   */
  router.post('/refresh-token', validateData(UserTokenRefreshDto), authController.refreshToken);

  /**
   * @route   GET /auth/profile
   * @desc    Obtener el perfil del usuario autenticado
   * @access  Private
   */
  router.get('/profile', authenticate, (req, res) => {
    // El middleware 'authenticate' ya ha puesto la información del usuario en req.user
    res.status(200).json(req.user);
  });

  /**
   * @route   GET /auth/admin-test
   * @desc    Ruta de prueba solo para administradores
   * @access  Private (Admin only)
   */
  router.get(
    '/admin-test',
    authenticate,
    authorize(UserRole.ADMIN),
    (req, res) => {
      res.status(200).json({
        message: `Welcome, Admin ${req.user?.name}! This is a protected route.`,
      });
    }
  );

  return router;
};
