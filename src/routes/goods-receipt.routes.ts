import { Router } from 'express';
import { DataSource } from 'typeorm';
import { GoodsReceiptController } from '@controllers/goods-receipt.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { UserRole } from '@/enums';

export const createGoodsReceiptRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const goodsReceiptController = new GoodsReceiptController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /goods-receipts
   * @desc    Obtener todas las recepciones
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    goodsReceiptController.getAll
  );

  /**
   * @route   GET /goods-receipts/:id
   * @desc    Obtener una recepción por su ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    goodsReceiptController.getById
  );

  /**
   * @route   POST /goods-receipts
   * @desc    Crear una nueva recepción de mercadería
   * @access  ADMIN, CAPATAZ
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreateGoodsReceiptDto),
    goodsReceiptController.create
  );

  return router;
};
