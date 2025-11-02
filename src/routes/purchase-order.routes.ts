import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PurchaseOrderController } from '@controllers/purchase-order.controller';
import { PurchaseOrderService } from '@services/purchase-order.service';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';
import { validateData } from '@middlewares/validation.middleware';
import { CreatePurchaseOrderDto } from '@dtos/purchase-order.dto';

export const createPurchaseOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const purchaseOrderService = new PurchaseOrderService(dataSource);
  const purchaseOrderController = new PurchaseOrderController(purchaseOrderService);

  router.use(authenticate);

  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.getAll
  );

  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.getById
  );

  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreatePurchaseOrderDto),
    purchaseOrderController.create
  );

  return router;
};
