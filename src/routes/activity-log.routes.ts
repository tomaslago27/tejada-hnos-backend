import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ActivityLogController } from '@controllers/activity-log.controller';

export const createActivityLogRoutes = (dataSource: DataSource): Router => {
    const router = Router();
    const controller = new ActivityLogController(dataSource);

    // Ejemplo de cómo será una ruta
    // router.post('/', controller.create);

    return router;
}