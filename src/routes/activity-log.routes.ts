import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityLogController } from '@controllers/activity-log.controller';

export const createActivityLogRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const controller = new ActivityLogController(dataSource);

    // Cuando llegue una petición POST a la raíz ('/'), se ejecutará el método 'create' del controlador
    router.post('/', controller.create);
    // Cuando llegue una petición GET a la raíz ('/'), se ejecutará el método 'getAll'.
    router.get('/', controller.getAll);
    // El ':id' le dice a Express que esta parte de la URL es un parámetro variable.
    router.get('/:id', controller.getById);

    return router;
}