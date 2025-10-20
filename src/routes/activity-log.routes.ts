import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityLogController } from '@/controllers/activity-log.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validateData } from '@/middlewares/validation.middleware';
import { CreateActivityLogDto, UpdateActivityLogDto } from '@/dtos/activity-log.dto';

export const createActivityLogRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const controller = new ActivityLogController(dataSource);

    // Endpoint para crear un nuevo registro de actividad
    router.post(
        '/',
        authenticate,
        validateData(CreateActivityLogDto),
        controller.create
    );
    // Endpoint para obtener todos los registros de actividad
    router.get('/', authenticate, controller.getAll);
    // Endpoint para obtener un registro de actividad por ID
    router.get('/:id', authenticate, controller.getById);
    // Endpoint para actualizar un registro de actividad por ID
    router.put(
        '/:id',
        authenticate,
        validateData(UpdateActivityLogDto),
        controller.update
    );
    // Endpoint para eliminar un registro de actividad por ID
    router.delete('/:id', authenticate, controller.delete);

    return router;
}