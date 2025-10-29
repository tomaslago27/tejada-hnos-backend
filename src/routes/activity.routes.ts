import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityController } from '@/controllers/activity.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validateData } from '@/middlewares/validation.middleware';
import { UpdateActivityDto } from '@/dtos/activity.dto';
import { authorize } from '@/middlewares/authorize.middleware';
import { UserRole } from '@/enums';

export const createActivityRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const activityController = new ActivityController(dataSource);

    router.use(authenticate);

    /**
     * @route   GET /actiivities
     * @desc    Obtener todas las actividades
     * @access  Logged-in users
     */
    router.get('/', activityController.getAll);

    /**
     * @route   GET /activities/:id
     * @desc    Obtener una actividad por su ID
     * @access  Logged-in users
     */
    router.get('/:id', activityController.getById);

    /**
     * @route   PUT /activities/:id
     * @desc    Actualizar una actividad por su ID
     * @access  Logged-in users
     */
    router.put('/:id', validateData(UpdateActivityDto), activityController.update);

    /**
     * @route   DELETE /activities/:id
     * @desc    Eliminar una actividad por su ID
     * @access  Admin y Capataz
     */
    router.delete(
        '/:id',
        authorize(UserRole.ADMIN, UserRole.CAPATAZ),
        activityController.delete
    );

    /**
     * @route   POST /activities/:id/restore
     * @desc    Restaurar una actividad eliminada por su ID
     * @access  Admin
     */
    router.post(
        '/:id/restore',
        authorize(UserRole.ADMIN),
        activityController.restore
    );

    /**
     * @route   DELETE /activities/:id/permanent
     * @desc    Eliminar permanentemente una actividad por su ID
     * @access  Admin
     */
    router.delete(
        '/:id/permanent',
        authorize(UserRole.ADMIN),
        activityController.hardDelete
    );

    return router;
}
