import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GoodsReceiptService } from '@services/goods-receipt.service';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes as HttpStatus } from 'http-status-codes';

export class GoodsReceiptController {
  constructor(private readonly goodsReceiptService: GoodsReceiptService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateGoodsReceiptDto = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new HttpException(HttpStatus.UNAUTHORIZED, 'Usuario no autenticado');
      }

      const goodsReceipt = await this.goodsReceiptService.create(data, userId);

      res.status(StatusCodes.CREATED).json({
        data: goodsReceipt,
        message: 'Recepción registrada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
