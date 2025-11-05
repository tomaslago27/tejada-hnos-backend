import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PurchaseOrderController } from '@controllers/purchase-order.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';
import { validateData } from '@middlewares/validation.middleware';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@dtos/purchase-order.dto';

export const createPurchaseOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const purchaseOrderController = new PurchaseOrderController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /purchase-orders
   * @desc    Obtener todas las órdenes de compra
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.getAll
  );

  /**
   * @route   GET /purchase-orders/:id
   * @desc    Obtener una orden de compra por su ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.getById
  );

  /**
   * @route   POST /purchase-orders
   * @desc    Crear una nueva orden de compra
   * @access  ADMIN, CAPATAZ
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreatePurchaseOrderDto),
    purchaseOrderController.create
  );

  /**
   * @route   PUT /purchase-orders/:id
   * @desc    Actualizar una orden de compra por su ID
   * @access  ADMIN, CAPATAZ
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(UpdatePurchaseOrderDto),
    purchaseOrderController.update
  );

  /**
   * @route   DELETE /purchase-orders/:id
   * @desc    Eliminar una orden de compra (soft delete)
   * @access  ADMIN, CAPATAZ
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.delete
  );

  /**
   * @route   PATCH /purchase-orders/:id/restore
   * @desc    Restaurar una orden de compra eliminada
   * @access  ADMIN, CAPATAZ
   */
  router.patch(
    '/:id/restore',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    purchaseOrderController.restore
  );

  /**
   * @route   DELETE /purchase-orders/:id/permanent
   * @desc    Eliminar permanentemente una orden de compra (hard delete)
   * @access  ADMIN only
   */
  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    purchaseOrderController.hardDelete
  );

  return router;
};
