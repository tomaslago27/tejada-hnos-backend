import { Router } from 'express';
import { DataSource } from 'typeorm';
import { GoodsReceiptController } from '@controllers/goods-receipt.controller';
import { GoodsReceiptService } from '@services/goods-receipt.service';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { UserRole } from '@/enums';

export const createGoodsReceiptRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const goodsReceiptService = new GoodsReceiptService(dataSource);
  const goodsReceiptController = new GoodsReceiptController(goodsReceiptService);

  router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreateGoodsReceiptDto),
    goodsReceiptController.create
  );

  return router;
};
