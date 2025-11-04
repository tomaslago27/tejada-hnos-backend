import { DataSource } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ActivityService } from "@/services/activity.service";
import { HttpException } from "@/exceptions/HttpException";
import { StatusCodes } from "http-status-codes";
import { CreateActivityDto, UpdateActivityDto } from "@/dtos/activity.dto";
import { ActivityFilters } from "@/interfaces/filters.interface";
import { ActivityType, ActivityStatus, UserRole } from "@/enums";

export class ActivityController {
  private activityService: ActivityService;

  constructor(dataSource: DataSource) {
    this.activityService = new ActivityService(dataSource);
  }

  /**
   * GET /activities
   * GET /work-orders/:workOrderId/activities
   * Obtener todas las actividades con filtros opcionales
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: ActivityFilters = {};

      if (req.query.workOrderId) {
        filters.workOrderId = req.query.workOrderId as string;
      }

      if (req.query.type) {
        filters.type = req.query.type as ActivityType;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Priorizar requiredAssignedToId (forzado por middleware) sobre query param
      if (req.requiredAssignedToId) {
        filters.assignedToId = req.requiredAssignedToId;
      } else if (req.query.assignedToId) {
        filters.assignedToId = req.query.assignedToId as string;
      }

      // Agregar managedFieldIds desde el middleware de autorización (para CAPATAZ)
      if (req.managedFieldIds && req.managedFieldIds.length > 0) {
        filters.managedFieldIds = req.managedFieldIds;
        
        // Si NO hay filtro de assignedToId en query, incluir al CAPATAZ también
        // Si HAY filtro de assignedToId, respetarlo (para que el CAPATAZ pueda supervisar a otros)
        if (!req.query.assignedToId && req.user?.userId) {
          filters.assignedToId = req.user.userId;
        }
      }

      const activities = await this.activityService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: activities,
        count: activities.length,
        message: 'Actividades obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:id
   * Obtener una actividad por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const activity = await this.activityService.findById(id);

      res.status(StatusCodes.OK).json({
        data: activity,
        message: 'Actividad obtenida exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders/:workOrderId/activities
   * Crear una nueva actividad
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workOrderId } = req.params;
      if (!workOrderId) 
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido para crear una actividad.');
    
      const activityData: CreateActivityDto = req.body;
      
      // Establecer status según el rol del usuario
      // OPERARIO: siempre PENDING (requiere aprobación)
      // CAPATAZ/ADMIN: pueden crear directamente como APPROVED o especificar el status
      if (req.user?.role === UserRole.OPERARIO) {
        activityData.status = ActivityStatus.PENDING; // Forzar PENDING para operarios
      } else if (!activityData.status) {
        // Si CAPATAZ/ADMIN no especifica status, usar APPROVED por defecto
        activityData.status = ActivityStatus.APPROVED;
      }
      
      const newActivity = await this.activityService.create(activityData);

      res.status(StatusCodes.CREATED).json({
        data: newActivity,
        message: 'Actividad creada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /activities/:id
   * Actualizar una actividad por su ID
   * 
   * FLUJO DE ESTADOS PARA OPERARIO:
   * 1. Crea actividad → Status: PENDING (automático)
   * 2. CAPATAZ aprueba → Status: APPROVED
   * 3. OPERARIO modifica → Status: PENDING (requiere nueva aprobación)
   * 
   * REGLAS:
   * - OPERARIO no puede modificar actividades PENDING (debe esperar aprobación)
   * - OPERARIO puede modificar actividades APPROVED/REJECTED (vuelven a PENDING)
   * - OPERARIO no puede cambiar el status manualmente
   * - CAPATAZ/ADMIN pueden modificar cualquier actividad y cambiar su status
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const activityData: UpdateActivityDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      // Obtener la actividad actual para validar su estado
      const currentActivity = await this.activityService.findById(id);

      // OPERARIO: validaciones especiales
      if (req.user?.role === UserRole.OPERARIO) {
        // 1. No puede cambiar el status (solo CAPATAZ/ADMIN pueden aprobar/rechazar)
        if (activityData.status !== undefined) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'Un operario no puede cambiar el estado de una actividad. Solo un capataz o administrador puede aprobar o rechazar actividades.'
          );
        }

        // 2. No puede modificar una actividad que está PENDING
        if (currentActivity.status === ActivityStatus.PENDING) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'No puedes modificar una actividad que está pendiente de aprobación. Espera a que un capataz o administrador la apruebe.'
          );
        }

        // 3. Si la actividad está APPROVED o REJECTED, al modificarla vuelve a PENDING
        // (para que un capataz revise los cambios)
        activityData.status = ActivityStatus.PENDING;
      }

      const updatedActivity = await this.activityService.update(id, activityData);

      res.status(StatusCodes.OK).json({
        data: updatedActivity,
        message: 'Actividad actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:id
   * Eliminar una actividad (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const deletedActivity = await this.activityService.delete(id);

      res.status(StatusCodes.OK).json({
        data: deletedActivity,
        message: 'Actividad eliminada exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activities/:id/restore
   * Restaurar una actividad eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const restoredActivity = await this.activityService.restore(id);

      res.status(StatusCodes.OK).json({
        data: restoredActivity,
        message: 'Actividad restaurada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:id/permanent
   * Eliminar permanentemente una actividad (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const deletedActivity = await this.activityService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: deletedActivity,
        message: 'Actividad eliminada permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
