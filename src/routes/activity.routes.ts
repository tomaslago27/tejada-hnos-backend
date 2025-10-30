import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityController } from '@/controllers/activity.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { authorizeFieldAccess } from '@/middlewares/authorize-field-access.middleware';
import { validateData } from '@/middlewares/validation.middleware';
import { UpdateActivityDto } from '@/dtos/activity.dto';
import { authorize } from '@/middlewares/authorize.middleware';
import { UserRole } from '@/enums';

export const createActivityRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const activityController = new ActivityController(dataSource);

    router.use(authenticate);

    /**
     * @route   GET /activities
     * @desc    Obtener todas las actividades
     * @access  Logged-in users
     * @security Aplica filtros según rol (ADMIN: todo, CAPATAZ: managedFields, OPERARIO: assignedToId)
     */
    router.get('/', authorizeFieldAccess(dataSource), activityController.getAll);

    /**
     * @route   GET /activities/:id
     * @desc    Obtener una actividad por su ID
     * @access  Logged-in users
     * @security Valida acceso según rol
     */
    router.get('/:id', authorizeFieldAccess(dataSource), activityController.getById);

    /**
     * @route   PUT /activities/:id
     * @desc    Actualizar una actividad por su ID
     * @access  Logged-in users
     * @security Valida que el usuario tenga acceso a la WorkOrder de la actividad
     */
    router.put('/:id', authorizeFieldAccess(dataSource), validateData(UpdateActivityDto), activityController.update);

    /**
     * @route   DELETE /activities/:id
     * @desc    Eliminar una actividad por su ID
     * @access  Admin y Capataz
     * @security Valida que el usuario tenga acceso a la WorkOrder de la actividad
     */
    router.delete(
        '/:id',
        authorize(UserRole.ADMIN, UserRole.CAPATAZ),
        authorizeFieldAccess(dataSource),
        activityController.delete
    );

    /**
     * @route   POST /activities/:id/restore
     * @desc    Restaurar una actividad eliminada por su ID
     * @access  Admin y Capataz
     * @security Valida que el usuario tenga acceso a la WorkOrder de la actividad
     */
    router.post(
        '/:id/restore',
        authorize(UserRole.ADMIN, UserRole.CAPATAZ),
        authorizeFieldAccess(dataSource),
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
