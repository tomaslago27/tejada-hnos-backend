import { Router } from 'express';
import { WorkOrderController } from '@controllers/work-order.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { authorizeFieldAccess } from '@middlewares/authorize-field-access.middleware';
import { validateData } from '@/middlewares/validation.middleware';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from '@dtos/work-order.dto';
import { UserRole } from '@/enums';
import { DataSource } from 'typeorm';
import { ActivityController } from '@/controllers/activity.controller';
import { CreateActivityDto } from '@/dtos/activity.dto';
import { mergeParamsToBody } from '@/middlewares/merge-params.middleware';

export const createWorkOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const workOrderController = new WorkOrderController(dataSource);
  const activityController = new ActivityController(dataSource);

  // Proteger todas las rutas con autenticación
  router.use(authenticate);

  /**
   * @route   GET /work-orders
   * @desc    Obtener todas las órdenes de trabajo (con filtros opcionales)
   * @query   ?status=PENDING&assignedToId=123&plotId=456&startDate=2025-01-01&endDate=2025-12-31
   * @access  Logged-in users
   * @security Aplica filtros según rol (ADMIN: todo, CAPATAZ: managedFields, OPERARIO: assignedToId)
   */
  router.get('/', authorizeFieldAccess(dataSource), workOrderController.getAll);

  /**
   * @route   GET /work-orders/:id
   * @desc    Obtener una orden de trabajo por su ID
   * @access  Logged-in users
   * @security Valida acceso según rol y campos gestionados
   */
  router.get('/:id', authorizeFieldAccess(dataSource), workOrderController.getById);

  /**
   * @route   POST /work-orders
   * @desc    Crear una nueva orden de trabajo
   * @access  Admin y Capataz
   * @security Valida que las parcelas pertenezcan a campos gestionados (CAPATAZ)
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    validateData(CreateWorkOrderDto),
    workOrderController.create
  );

  /**
   * @route   PUT /work-orders/:id
   * @desc    Actualizar una orden de trabajo por su ID
   * @access  Admin y Capataz
   * @security Valida que el usuario tenga acceso a esta OT
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    validateData(UpdateWorkOrderDto),
    workOrderController.update
  );

  /**
   * @route   DELETE /work-orders/:id
   * @desc    Eliminar una orden de trabajo (soft delete)
   * @access  Admin y Capataz
   * @security Valida que el usuario tenga acceso a esta OT
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    workOrderController.delete
  );

  /**
   * @route   PATCH /work-orders/:id/restore
   * @desc    Restaurar una orden de trabajo eliminada
   * @access  Admin y Capataz
   * @security Valida que el usuario tenga acceso a esta OT
   */
  router.patch(
    '/:id/restore',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    workOrderController.restore
  );

  /**
   * @route   DELETE /work-orders/:id/permanent
   * @desc    Eliminar permanentemente una orden de trabajo (hard delete)
   * @access  Solo Admin
   */
  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    workOrderController.hardDelete
  );


  const nestedActivitiesRouter = Router({ mergeParams: true });

  nestedActivitiesRouter.use(authenticate);

  /**
   * @route   POST /work-orders/:workOrderId/activities
   * @desc    Crear una nueva actividad asociada a una orden de trabajo
   * @access  Logged-in users
   * @security Valida que el usuario tenga acceso a la WorkOrder (OPERARIO: solo sus OTs, CAPATAZ: sus campos)
   */
  nestedActivitiesRouter.post(
    '/',
    authorizeFieldAccess(dataSource),
    mergeParamsToBody(['workOrderId']),
    validateData(CreateActivityDto),
    activityController.create
  );

  /**
   * @route   GET /work-orders/:workOrderId/activities
   * @desc    Obtener todas las actividades asociadas a una orden de trabajo
   * @access  Logged-in users
   * @security Valida que el usuario tenga acceso a la WorkOrder
   */
  nestedActivitiesRouter.get(
    '/',
    authorizeFieldAccess(dataSource),
    activityController.getAll
  );

  // Montar el sub-router de actividades bajo /work-orders/:workOrderId/activities
  router.use('/:workOrderId/activities', nestedActivitiesRouter);

  return router;
};
