import { Request, Response, NextFunction } from 'express';
import { DataSource, In } from 'typeorm';
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
        return next(new HttpException(StatusCodes.UNAUTHORIZED, 'Usuario no autenticado'));
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
        return next(new HttpException(StatusCodes.NOT_FOUND, 'Usuario no encontrado'));
      }

      // Extraer IDs de campos gestionados
      const managedFieldIds = user.managedFields.map(field => field.id);

      // OPERARIO: Solo ve las OTs asignadas a él
      if (role === UserRole.OPERARIO) {
        // Si está filtrando por assignedToId en query params, validar que sea el mismo usuario
        if (req.query.assignedToId && req.query.assignedToId !== userId) {
          return next(new HttpException(
            StatusCodes.FORBIDDEN,
            'Un operario solo puede ver sus propias órdenes de trabajo'
          ));
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
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta orden de trabajo'
            ));
          }
        }

        // Si está accediendo a una actividad específica por ID
        if (req.params.id && (req.originalUrl.includes('/activities/') || req.path.includes('/activities/'))) {
          const activityId = req.params.id;
          const activityRepository = dataSource.getRepository(Activity);
          const activity = await activityRepository.findOne({
            where: { id: activityId },
            relations: ['workOrder'],
            withDeleted: true,
          });

          if (activity && activity.workOrder.assignedToId !== userId) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta actividad'
            ));
          }
        }

        // Si está accediendo a fields o plots, bloquear acceso (OPERARIO no gestiona campos)
        const isAccessingFieldsOrPlots = 
          req.originalUrl.includes('/fields') || 
          req.path.includes('/fields') ||
          req.originalUrl.includes('/plots') || 
          req.path.includes('/plots');
        
        if (isAccessingFieldsOrPlots) {
          // Para listados (GET /fields o GET /plots), permitir pero con array vacío (mapa)
          if ((req.method === 'GET' && req.originalUrl.match(/\/fields\/?(\?.*)?$/)) ||
              (req.method === 'GET' && req.originalUrl.match(/\/plots\/?(\?.*)?$/))) {
            req.requiredManagedFieldIds = []; // Array vacío = no verá ningún field/plot en resultados filtrados
            return next();
          }
          
          // Para acceso individual (GET /fields/:id o GET /plots/:id), bloquear
          const resourceType = req.originalUrl.includes('/fields') || req.path.includes('/fields') ? 'campo' : 'parcela';
          return next(new HttpException(
            StatusCodes.FORBIDDEN,
            `No tienes permisos para ver los detalles de este ${resourceType}`
          ));
        }

        return next();
      }

      // CAPATAZ: Ve sus OTs asignadas + OTs de parcelas en sus campos gestionados
      if (role === UserRole.CAPATAZ) {
        // ============================================================================
        // VALIDACIÓN 1: Si está accediendo a una OT específica por ID (GET, PUT, DELETE, o creando actividades)
        // Validar PRIMERO el acceso a la OT existente (tanto para CAPATAZ con campos como sin campos)
        // ============================================================================
        const workOrderId = req.params.id || req.params.workOrderId;
        if (workOrderId && (req.originalUrl.includes('/work-orders/') || req.path.includes('/work-orders/'))) {
          const workOrderRepository = dataSource.getRepository(WorkOrder);
          const workOrder = await workOrderRepository.findOne({
            where: { id: workOrderId },
            relations: ['plots'],
            withDeleted: true, // Para permitir restore
          });

          if (!workOrder) {
            return next(new HttpException(
              StatusCodes.NOT_FOUND,
              'La orden de trabajo no fue encontrada'
            ));
          }

          // Validar que el CAPATAZ tenga acceso:
          // 1. La OT está asignada a él, O
          // 2. (Si tiene campos gestionados) La OT tiene parcelas en sus campos gestionados
          const isAssignedToHim = workOrder.assignedToId === userId;
          const hasAccessToPlots = managedFieldIds.length > 0 && 
            workOrder.plots?.some(plot => managedFieldIds.includes(plot.fieldId));

          if (!isAssignedToHim && !hasAccessToPlots) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta orden de trabajo'
            ));
          }
        }

        // ============================================================================
        // VALIDACIÓN 2: Si está accediendo a una actividad específica por ID
        // Validar acceso (tanto para CAPATAZ con campos como sin campos)
        // ============================================================================
        if (req.params.id && (req.originalUrl.includes('/activities/') || req.path.includes('/activities/'))) {
          const activityId = req.params.id;
          const activityRepository = dataSource.getRepository(Activity);
          const activity = await activityRepository.findOne({
            where: { id: activityId },
            relations: ['workOrder', 'workOrder.plots'],
            withDeleted: true,
          });

          if (!activity) {
            return next(new HttpException(
              StatusCodes.NOT_FOUND,
              'La actividad no fue encontrada'
            ));
          }

          // Validar que el CAPATAZ tenga acceso a la WorkOrder de esta actividad:
          // 1. La OT está asignada a él, O
          // 2. (Si tiene campos gestionados) La OT tiene parcelas en sus campos gestionados
          const isAssignedToHim = activity.workOrder.assignedToId === userId;
          const hasAccessToPlots = managedFieldIds.length > 0 && 
            activity.workOrder.plots?.some(plot => managedFieldIds.includes(plot.fieldId));

          if (!isAssignedToHim && !hasAccessToPlots) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para acceder a esta actividad'
            ));
          }
        }

        // Si no tiene campos gestionados, solo ve sus OTs asignadas (comportamiento de OPERARIO)
        if (managedFieldIds.length === 0) {
          req.requiredAssignedToId = userId;

          // Para POST: Forzar auto-asignación en creación de WorkOrders
          if (req.method === 'POST' && (req.originalUrl.includes('/work-orders') || req.path.includes('/work-orders'))) {
            if (req.body && !req.body.assignedToUserId) {
              // Auto-asignar al capataz si no especifica usuario
              req.body.assignedToUserId = userId;
            } else if (req.body.assignedToUserId && req.body.assignedToUserId !== userId) {
              return next(new HttpException(
                StatusCodes.FORBIDDEN,
                'Un capataz sin campos gestionados solo puede crear órdenes asignadas a sí mismo'
              ));
            }
          }

          // Si está accediendo a fields o plots, bloquear acceso (no gestiona ningún campo)
          const isAccessingFieldsOrPlots = 
            req.originalUrl.includes('/fields') || 
            req.path.includes('/fields') ||
            req.originalUrl.includes('/plots') || 
            req.path.includes('/plots');
          
          if (isAccessingFieldsOrPlots) {
            // Para listados (GET /fields o GET /plots), permitir pero con array vacío
            if ((req.method === 'GET' && req.originalUrl.match(/\/fields\/?(\?.*)?$/)) ||
                (req.method === 'GET' && req.originalUrl.match(/\/plots\/?(\?.*)?$/))) {
              req.requiredManagedFieldIds = []; // Array vacío = no verá ningún field/plot
              return next();
            }
            
            // Para acceso individual (GET /fields/:id o GET /plots/:id), bloquear
            const resourceType = req.originalUrl.includes('/fields') || req.path.includes('/fields') ? 'campo' : 'parcela';
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              `No tienes permisos para ver los detalles de este ${resourceType}`
            ));
          }

          return next();
        }

        // ============================================================================
        // VALIDACIÓN 3: GET /fields (listado) - NO bloquear, solo aplicar filtros
        // ============================================================================
        if (req.method === 'GET' && req.originalUrl.match(/\/fields\/?(\?.*)?$/)) {
          // Validar que si filtra por managerId, sea su propio ID
          const { managerId } = req.query;
          
          if (managerId && managerId !== userId) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'Solo puedes filtrar por tus propios campos gestionados'
            ));
          }

          // Agregar managedFieldIds para que el servicio filtre automáticamente
          if (managedFieldIds.length > 0) {
            req.requiredManagedFieldIds = managedFieldIds;
          }
          
          return next();
        }

        // ============================================================================
        // VALIDACIÓN 4: GET /plots (listado) - NO bloquear, solo aplicar filtros
        // ============================================================================
        if (req.method === 'GET' && req.originalUrl.match(/\/plots\/?(\?.*)?$/)) {
          // Agregar managedFieldIds para que el servicio filtre automáticamente
          if (managedFieldIds.length > 0) {
            req.requiredManagedFieldIds = managedFieldIds;
          }
          
          return next();
        }

        // ============================================================================
        // VALIDACIÓN 5: Validar plots en POST y PUT de WorkOrders (CAPATAZ con campos gestionados)
        // Esta validación ocurre DESPUÉS de validar acceso a la OT (si aplica)
        // ============================================================================
        if ((req.method === 'POST' || req.method === 'PUT') && 
            (req.originalUrl.includes('/work-orders') || req.path.includes('/work-orders')) && 
            !(req.originalUrl.includes('/activities') || req.path.includes('/activities'))) {
          
          const plotIds = req.body?.plotIds;
          
          if (plotIds && Array.isArray(plotIds) && plotIds.length > 0) {
            const plotRepository = dataSource.getRepository(Plot);
            const plots = await plotRepository.findBy({ id: In(plotIds) });
            
            // Verificar que todas las plots pertenezcan a campos gestionados
            const unauthorizedPlots = plots.filter(plot => !managedFieldIds.includes(plot.fieldId));
            
            if (unauthorizedPlots.length > 0) {
              const plotNames = unauthorizedPlots.map(p => p.name || p.id).join(', ');
              return next(new HttpException(
                StatusCodes.FORBIDDEN,
                `No tienes permisos para asignar las siguientes parcelas: ${plotNames}. Solo puedes asignar parcelas de los campos que gestionas.`
              ));
            }
          }
        }

        // ============================================================================
        // VALIDACIÓN 6: Si está accediendo a una parcela específica (GET /plots/:id)
        // O a un reporte de parcela (GET /reports/plot-summary/:plotId)
        // ============================================================================
        if (req.params.id && (req.originalUrl.includes('/plots/') || req.path.includes('/plots/'))) {
          const plotId = req.params.id;
          const plotRepository = dataSource.getRepository(Plot);
          const plot = await plotRepository.findOne({
            where: { id: plotId },
            withDeleted: true, // Para permitir restore
          });

          if (plot && !managedFieldIds.includes(plot.fieldId)) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para ver los detalles de esta parcela'
            ));
          }
        }

        // Validación específica para reportes de parcelas
        if (req.params.plotId && (req.originalUrl.includes('/reports/plot-summary') || req.path.includes('/reports/plot-summary'))) {
          const plotId = req.params.plotId;
          const plotRepository = dataSource.getRepository(Plot);
          const plot = await plotRepository.findOne({
            where: { id: plotId },
            relations: ['field']
          });

          if (!plot) {
            return next(new HttpException(
              StatusCodes.NOT_FOUND,
              'Parcela no encontrada'
            ));
          }

          if (!managedFieldIds.includes(plot.fieldId)) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para ver reportes de esta parcela. Solo puedes acceder a parcelas de los campos que gestionas.'
            ));
          }
        }

        // ============================================================================
        // VALIDACIÓN 7: Si está accediendo a un campo específico (GET /fields/:id)
        // ============================================================================
        if (req.params.id && (req.originalUrl.includes('/fields/') || req.path.includes('/fields/'))) {
          const fieldId = req.params.id;
          
          if (!managedFieldIds.includes(fieldId)) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para ver los detalles de este campo'
            ));
          }
        }

        // Si está filtrando OTs, validar acceso a las parcelas
        if (req.query.plotId) {
          const plotRepository = dataSource.getRepository(Plot);
          const plot = await plotRepository.findOne({
            where: { id: req.query.plotId as string },
          });

          if (plot && !managedFieldIds.includes(plot.fieldId)) {
            return next(new HttpException(
              StatusCodes.FORBIDDEN,
              'No tienes permisos para ver órdenes de trabajo de esta parcela'
            ));
          }
        }

        // Agregar managedFieldIds al request para que los servicios puedan usarlos
        req.managedFieldIds = managedFieldIds;

        return next();
      }

      // Si llegamos aquí, el rol no está manejado
      return next(new HttpException(
        StatusCodes.FORBIDDEN,
        'Rol de usuario no válido para esta operación'
      ));
    } catch (error) {
      next(error);
    }
  };
};
