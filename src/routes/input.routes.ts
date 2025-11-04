import { Router } from 'express';
import { DataSource } from 'typeorm';
import { InputController } from '@controllers/input.controller';
import { InputService } from '@services/input.service';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreateInputDto } from '@dtos/input.dto';
import { UserRole } from '@/enums';

export const createInputRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const inputService = new InputService(dataSource);
  const inputController = new InputController(inputService);

  router.use(authenticate);

  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreateInputDto),
    inputController.create
  );

  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    inputController.getAll
  );

  return router;
};
