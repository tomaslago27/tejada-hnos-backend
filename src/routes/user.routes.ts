import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@enums/index';
import { DataSource } from 'typeorm';
import { validateData } from '@/middlewares/validation.middleware';
import { CreateUserDto } from '@/dtos/user.dto';

export const createUserRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const userController = new UserController(dataSource);

  // Proteger todas las rutas de usuario con autenticación
  router.use(authenticate);

  /**
   * @route   GET /users
   * @desc    Obtener todos los usuarios
   * @access  Admin only
   */
  router.get('/', authorize(UserRole.ADMIN), userController.getAll);

  /**
   * @route   GET /users/:id
   * @desc    Obtener un usuario por su ID
   * @access  Admin only
   */
  router.get('/:id', authorize(UserRole.ADMIN), userController.getById);

  /**
   * @route   POST /users
   * @desc    Crear un nuevo usuario
   * @access  Admin only
   */
  router.post('/', authorize(UserRole.ADMIN), validateData(CreateUserDto), userController.create);

  /**
   * @route   PUT /users/:id
   * @desc    Actualizar un usuario por su ID
   * @access  Admin only
   */
  router.put('/:id', authorize(UserRole.ADMIN), userController.update);

  /**
   * @route   DELETE /users/:id
   * @desc    Eliminar un usuario (soft delete)
   * @access  Admin only
   */
  router.delete('/:id', authorize(UserRole.ADMIN), userController.delete);

  /**
   * @route   PATCH /users/:id/restore
   * @desc    Restaurar un usuario eliminado
   * @access  Admin only
   */
  router.patch('/:id/restore', authorize(UserRole.ADMIN), userController.restore);

  /**
   * @route   DELETE /users/:id/permanent
   * @desc    Eliminar permanentemente un usuario (hard delete)
   * @access  Admin only
   */
  router.delete('/:id/permanent', authorize(UserRole.ADMIN), userController.hardDelete);

  return router;
};

