import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderService } from '@services/purchase-order.service';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@dtos/purchase-order.dto';
import { DataSource } from 'typeorm';

export class PurchaseOrderController {
  private purchaseOrderService: PurchaseOrderService;

  constructor(private dataSource: DataSource) {
    this.purchaseOrderService = new PurchaseOrderService(this.dataSource);
  }

  /**
   * Transforma una orden de compra para incluir los campos calculados
   * de cantidades recibidas y pendientes
   */
  private transformPurchaseOrder(purchaseOrder: any) {
    return {
      ...purchaseOrder,
      details: purchaseOrder.details?.map((detail: any) => ({
        id: detail.id,
        purchaseOrderId: detail.purchaseOrderId,
        input: detail.input,
        quantity: Number(detail.quantity),
        unitPrice: Number(detail.unitPrice),
        subtotal: Number(detail.quantity) * Number(detail.unitPrice),
        // Campos calculados usando los getters de la entidad
        quantityReceived: detail.quantityReceived,
        quantityPending: detail.quantityPending,
        isFullyReceived: detail.isFullyReceived,
        percentageReceived: detail.quantity > 0 
          ? Math.round((detail.quantityReceived / Number(detail.quantity)) * 100) 
          : 0,
        // Historial de recepciones
        receiptHistory: detail.receiptDetails?.map((rd: any) => ({
          receiptId: rd.goodsReceiptId,
          quantityReceived: Number(rd.quantityReceived),
          receivedAt: rd.goodsReceipt?.receivedAt,
          notes: rd.notes,
        })) || [],
      })) || [],
    };
  }


  /**
   * GET /purchase-orders
   * Obtener todas las órdenes de compra
   */
  public getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const purchaseOrders = await this.purchaseOrderService.findAll();
      
      // Transformar todas las órdenes para incluir campos calculados
      const transformedOrders = purchaseOrders.map(order => this.transformPurchaseOrder(order));

      res.status(StatusCodes.OK).json({
        data: transformedOrders,
        count: transformedOrders.length,
        message: 'Órdenes de compra obtenidas exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /purchase-orders/:id
   * Obtener una orden de compra por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const purchaseOrder = await this.purchaseOrderService.findById(id);
      
      // Transformar la orden para incluir campos calculados
      const transformedOrder = this.transformPurchaseOrder(purchaseOrder);

      res.status(StatusCodes.OK).json({
        data: transformedOrder,
        message: 'Orden de compra obtenida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /purchase-orders
   * Crear una nueva orden de compra 
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
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

  /**
   * PUT /purchase-orders/:id
   * Actualizar una orden de compra por su ID
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
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

  /**
   * DELETE /purchase-orders/:id
   * Eliminar una orden de compra (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const purchaseOrder = await this.purchaseOrderService.delete(id);

      res.status(StatusCodes.OK).json({
        data: purchaseOrder,
        message: 'Orden de compra eliminada exitosamente',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /purchase-orders/:id/restore
   * Restaurar una orden de compra eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const purchaseOrder = await this.purchaseOrderService.restore(id);

      res.status(StatusCodes.OK).json({
        data: purchaseOrder,
        message: 'Orden de compra restaurada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /purchase-orders/:id/permanent
   * Eliminar permanentemente una orden de compra (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de compra no es un UUID válido');
      }

      const deletedPurchaseOrder = await this.purchaseOrderService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: deletedPurchaseOrder,
        message: 'Orden de compra eliminada permanentemente',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  }
}
