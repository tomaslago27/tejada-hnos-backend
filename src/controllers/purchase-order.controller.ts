import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderService } from '@services/purchase-order.service';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@dtos/purchase-order.dto';

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

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreatePurchaseOrderDto = req.body;
      const purchaseOrder = await this.purchaseOrderService.create(data);

      res.status(StatusCodes.CREATED).json({
        data: purchaseOrder,
        message: 'Orden de compra creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const data: UpdatePurchaseOrderDto = req.body;
      const purchaseOrder = await this.purchaseOrderService.update(id, data);

      res.status(StatusCodes.OK).json({
        data: purchaseOrder,
        message: 'Orden de compra actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      await this.purchaseOrderService.delete(id);

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
