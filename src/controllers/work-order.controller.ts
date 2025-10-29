import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { WorkOrderService } from '@services/work-order.service';
import { WorkOrderFilters } from '@/interfaces/filters.interface';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from '@dtos/work-order.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataSource } from 'typeorm';
import { WorkOrderStatus } from '@/enums';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor(dataSource: DataSource) {
    this.workOrderService = new WorkOrderService(dataSource);
  }

  /**
   * GET /work-orders
   * Obtener todas las órdenes de trabajo con filtros opcionales
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Construir filtros desde query params
      const filters: WorkOrderFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as WorkOrderStatus;
      }

      if (req.query.assignedToId) {
        filters.assignedToId = req.query.assignedToId as string;
      }

      if (req.query.plotId) {
        filters.plotId = req.query.plotId as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Pasar filtros solo si hay al menos uno definido
      const workOrders = await this.workOrderService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: workOrders,
        count: workOrders.length,
        message: 'Órdenes de trabajo obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /work-orders/:id
   * Obtener una orden de trabajo por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const workOrder = await this.workOrderService.findById(id);

      res.status(StatusCodes.OK).json({
        data: workOrder,
        message: 'Orden de trabajo obtenida exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders
   * Crear una nueva orden de trabajo
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workOrderData: CreateWorkOrderDto = req.body;
      const newWorkOrder = await this.workOrderService.create(workOrderData);

      res.status(StatusCodes.CREATED).json({
        data: newWorkOrder,
        message: 'Orden de trabajo creada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /work-orders/:id
   * Actualizar una orden de trabajo por su ID
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const workOrderData: UpdateWorkOrderDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const updatedWorkOrder = await this.workOrderService.update(id, workOrderData);

      res.status(StatusCodes.OK).json({
        data: updatedWorkOrder,
        message: 'Orden de trabajo actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /work-orders/:id
   * Eliminar una orden de trabajo (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const deletedWorkOrder = await this.workOrderService.delete(id);

      res.status(StatusCodes.OK).json({
        data: deletedWorkOrder,
        message: 'Orden de trabajo eliminada exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders/:id/restore
   * Restaurar una orden de trabajo eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const restoredWorkOrder = await this.workOrderService.restore(id);

      res.status(StatusCodes.OK).json({
        data: restoredWorkOrder,
        message: 'Orden de trabajo restaurada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /work-orders/:id/permanent
   * Eliminar permanentemente una orden de trabajo (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const deletedWorkOrder = await this.workOrderService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: deletedWorkOrder,
        message: 'Orden de trabajo eliminada permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
