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

  // Rutas específicas
  router.get('/', authorize(UserRole.ADMIN), userController.getAll);
  router.get('/:id', authorize(UserRole.ADMIN), userController.getById);
  router.post('/', authorize(UserRole.ADMIN), validateData(CreateUserDto), userController.create);

  return router;
};

