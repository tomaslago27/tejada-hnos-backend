import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GoodsReceiptService } from '@services/goods-receipt.service';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';
import { DataSource } from 'typeorm';

export class GoodsReceiptController {
  private goodsReceiptService: GoodsReceiptService;

  constructor(dataSource: DataSource) {
    this.goodsReceiptService = new GoodsReceiptService(dataSource);
  }

  /**
   * POST /goods-receipts
   * Crear una nueva recepción de mercadería
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateGoodsReceiptDto = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'Usuario no autenticado');
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

  /**
   * GET /goods-receipts
   * Obtener todas las recepciones
   */
  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipts = await this.goodsReceiptService.findAll();

      res.status(StatusCodes.OK).json({
        data: receipts,
        count: receipts.length,
        message: 'Recepciones obtenidas exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /goods-receipts/:id
   * Obtener una recepción por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la recepción es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la recepción no es un UUID válido');
      }

      const receipt = await this.goodsReceiptService.findById(id);

      res.status(StatusCodes.OK).json({
        data: receipt,
        message: 'Recepción obtenida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
