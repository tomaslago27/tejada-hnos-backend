import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderService } from '@services/purchase-order.service';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';

export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const purchaseOrders = await this.purchaseOrderService.findAll();

      res.status(StatusCodes.OK).json({
        data: purchaseOrders,
        count: purchaseOrders.length,
        message: 'Órdenes de compra obtenidas exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const purchaseOrder = await this.purchaseOrderService.findById(id);

      res.status(StatusCodes.OK).json({
        data: purchaseOrder,
        message: 'Orden de compra obtenida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
