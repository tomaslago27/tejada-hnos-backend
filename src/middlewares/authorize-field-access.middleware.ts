import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { UserRole } from '@/enums';
import { User } from '@/entities/user.entity';
import { Plot } from '@/entities/plot.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware para autorizar acceso basado en campos gestionados (managedFields).
 * 
 * Lógica de seguridad:
 * - ADMIN: Acceso total (sin filtros)
 * - CAPATAZ: Solo ve OTs asignadas a él, y OTs de parcelas dentro de sus campos gestionados
 * - OPERARIO: Solo ve OTs asignadas a él
 * 
 * @param dataSource Fuente de datos de TypeORM para acceder a los repositorios
 */
export const authorizeFieldAccess = (dataSource: DataSource) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'Usuario no autenticado');
      }

      const { role, userId } = req.user;

      // ADMIN tiene acceso total - sin filtros
      if (role === UserRole.ADMIN) {
        return next();
      }

      // Obtener el usuario con sus managedFields
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['managedFields'],
      });

      if (!user) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Usuario no encontrado');
      }

      // Extraer IDs de campos gestionados
      const managedFieldIds = user.managedFields.map(field => field.id);

      // OPERARIO: Solo ve las OTs asignadas a él
      if (role === UserRole.OPERARIO) {
        // Si está filtrando por assignedToId en query params, validar que sea el mismo usuario
        if (req.query.assignedToId && req.query.assignedToId !== userId) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'Un operario solo puede ver sus propias órdenes de trabajo'
          );
        }

        // Forzar filtro de assignedToId usando una propiedad personalizada del request
        req.requiredAssignedToId = userId;

        // Si está accediendo a una OT específica por ID (o creando actividades en una OT)
        const workOrderId = req.params.id || req.params.workOrderId;
        if (workOrderId) {
          const workOrderRepository = dataSource.getRepository(WorkOrder);
          const workOrder = await workOrderRepository.findOne({
            where: { id: workOrderId },
          });

          if (workOrder && workOrder.assignedToId !== userId) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta orden de trabajo'
            );
          }
        }

        // Si está accediendo a una actividad específica por ID
        if (req.params.id && req.path.includes('/activities/')) {
          const activityId = req.params.id;
          const activityRepository = dataSource.getRepository(Activity);
          const activity = await activityRepository.findOne({
            where: { id: activityId },
            relations: ['workOrder'],
            withDeleted: true,
          });

          if (activity && activity.workOrder.assignedToId !== userId) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta actividad'
            );
          }
        }

        return next();
      }

      // CAPATAZ: Ve sus OTs asignadas + OTs de parcelas en sus campos gestionados
      if (role === UserRole.CAPATAZ) {
        // Si no tiene campos gestionados, solo ve sus OTs asignadas (comportamiento de OPERARIO)
        if (managedFieldIds.length === 0) {
          req.requiredAssignedToId = userId;
          return next();
        }

        // Si está accediendo a una OT específica por ID (GET, PUT, DELETE, o creando actividades)
        const workOrderId = req.params.id || req.params.workOrderId;
        if (workOrderId && req.path.includes('/work-orders/')) {
          const workOrderRepository = dataSource.getRepository(WorkOrder);
          const workOrder = await workOrderRepository.findOne({
            where: { id: workOrderId },
            relations: ['plots'],
            withDeleted: true, // Para permitir restore
          });

          if (!workOrder) {
            throw new HttpException(
              StatusCodes.NOT_FOUND,
              'La orden de trabajo no fue encontrada'
            );
          }

          // Validar que el CAPATAZ tenga acceso:
          // 1. La OT está asignada a él, O
          // 2. La OT tiene parcelas en sus campos gestionados
          const isAssignedToHim = workOrder.assignedToId === userId;
          const hasAccessToPlots = workOrder.plots?.some(plot => 
            managedFieldIds.includes(plot.fieldId)
          );

          if (!isAssignedToHim && !hasAccessToPlots) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta orden de trabajo'
            );
          }
        }

        // Si está accediendo a una actividad específica por ID
        if (req.params.id && req.path.includes('/activities/')) {
          const activityId = req.params.id;
          const activityRepository = dataSource.getRepository(Activity);
          const activity = await activityRepository.findOne({
            where: { id: activityId },
            relations: ['workOrder', 'workOrder.plots'],
            withDeleted: true,
          });

          if (!activity) {
            throw new HttpException(
              StatusCodes.NOT_FOUND,
              'La actividad no fue encontrada'
            );
          }

          // Validar que el CAPATAZ tenga acceso a la WorkOrder de esta actividad
          const isAssignedToHim = activity.workOrder.assignedToId === userId;
          const hasAccessToPlots = activity.workOrder.plots?.some(plot => 
            managedFieldIds.includes(plot.fieldId)
          );

          if (!isAssignedToHim && !hasAccessToPlots) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta actividad'
            );
          }
        }

        // Si está accediendo a una parcela específica, validar que pertenezca a sus campos
        if (req.params.id && req.path.includes('/plots/')) {
          const plotId = req.params.id;
          const plotRepository = dataSource.getRepository(Plot);
          const plot = await plotRepository.findOne({
            where: { id: plotId },
            withDeleted: true, // Para permitir restore
          });

          if (plot && !managedFieldIds.includes(plot.fieldId)) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta parcela'
            );
          }
        }

        // Si está accediendo a un campo específico por ID, validar que lo gestione
        if (req.params.id && req.path.includes('/fields/')) {
          const fieldId = req.params.id;
          
          if (!managedFieldIds.includes(fieldId)) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a este campo'
            );
          }
        }

        // Si está filtrando OTs, validar acceso a las parcelas
        if (req.query.plotId) {
          const plotRepository = dataSource.getRepository(Plot);
          const plot = await plotRepository.findOne({
            where: { id: req.query.plotId as string },
          });

          if (plot && !managedFieldIds.includes(plot.fieldId)) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para ver órdenes de trabajo de esta parcela'
            );
          }
        }

        // Agregar managedFieldIds al request para que los servicios puedan usarlos
        req.managedFieldIds = managedFieldIds;

        return next();
      }

      // Si llegamos aquí, el rol no está manejado
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        'Rol de usuario no válido para esta operación'
      );
    } catch (error) {
      next(error);
    }
  };
};
