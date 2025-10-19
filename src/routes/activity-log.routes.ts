import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityLogController } from '@controllers/activity-log.controller';

export const createActivityLogRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const controller = new ActivityLogController(dataSource);

    // Cuando llegue una petición POST a la raíz ('/'), se ejecutará el método 'create' del controlador
    router.post('/', controller.create);

    return router;
}