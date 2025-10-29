// Ejemplo de cómo actualizar las rutas para usar mergeParamsToBody

import { Router } from 'express';
import { PlotController } from '@controllers/plot.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { mergeParamsToBody } from '@middlewares/merge-params.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';

export const createPlotRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const plotController = new PlotController(dataSource);

  router.use(authenticate);

  /**
   * @route   POST /fields/:fieldId/plots
   * @desc    Crear una nueva parcela dentro de un campo
   * @access  Admin only
   * 
   * NOTA: mergeParamsToBody(['fieldId']) debe ir ANTES de validateData
   * para que el fieldId de la URL se agregue al body antes de validar
   */
  router.post(
    '/fields/:fieldId/plots',
    authorize(UserRole.ADMIN),
    mergeParamsToBody(['fieldId']), // ← Fusionar params antes de validar
    validateData(CreatePlotDto),     // ← Ahora valida con fieldId incluido
    plotController.createPlot
  );

  /**
   * @route   GET /plots
   * @desc    Obtener todas las parcelas
   * @access  Logged-in users
   */
  router.get('/', plotController.getPlots);

  /**
   * @route   GET /fields/:fieldId/plots
   * @desc    Obtener todas las parcelas de un campo específico
   * @access  Logged-in users
   */
  router.get('/fields/:fieldId/plots', plotController.getPlots);

  /**
   * @route   GET /plots/:id
   * @desc    Obtener una parcela por su ID
   * @access  Logged-in users
   */
  router.get('/:id', plotController.getPlotById);

  /**
   * @route   PUT /plots/:id
   * @desc    Actualizar una parcela por su ID
   * @access  Admin only
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN),
    validateData(UpdatePlotDto),
    plotController.updatePlot
  );

  /**
   * @route   DELETE /plots/:id
   * @desc    Eliminar una parcela por su ID
   * @access  Admin only
   */
  router.delete('/:id', authorize(UserRole.ADMIN), plotController.deletePlot);

  return router;
};

// ============================================================================
// EJEMPLO 2: Work Orders con Activities anidadas
// ============================================================================

import { WorkOrderController } from '@controllers/work-order.controller';
import { ActivityController } from '@controllers/activity.controller';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from '@dtos/work-order.dto';
import { CreateActivityDto, UpdateActivityDto } from '@dtos/activity.dto';

export const createWorkOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const workOrderController = new WorkOrderController(dataSource);
  const activityController = new ActivityController(dataSource);

  router.use(authenticate);

  /**
   * @route   POST /work-orders
   * @desc    Crear una nueva orden de trabajo
   * @access  Admin/Manager
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.ENCARGADO),
    validateData(CreateWorkOrderDto),
    workOrderController.create
  );

  /**
   * @route   POST /work-orders/:workOrderId/activities
   * @desc    Crear una actividad dentro de una orden de trabajo
   * @access  Admin/Manager
   * 
   * El workOrderId viene en la URL y se fusiona al body antes de validar
   */
  router.post(
    '/:workOrderId/activities',
    authorize(UserRole.ADMIN, UserRole.ENCARGADO),
    mergeParamsToBody(['workOrderId']), // ← Fusionar antes de validar
    validateData(CreateActivityDto),
    activityController.create
  );

  /**
   * @route   GET /work-orders/:workOrderId/activities
   * @desc    Obtener todas las actividades de una orden de trabajo
   * @access  Logged-in users
   */
  router.get('/:workOrderId/activities', activityController.getByWorkOrder);

  /**
   * @route   PUT /work-orders/:id
   * @desc    Actualizar una orden de trabajo
   * @access  Admin/Manager
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.ENCARGADO),
    validateData(UpdateWorkOrderDto),
    workOrderController.update
  );

  return router;
};

// ============================================================================
// EJEMPLO 3: Sales Orders con Shipments anidados
// ============================================================================

import { SalesOrderController } from '@controllers/sales-order.controller';
import { ShipmentController } from '@controllers/shipment.controller';
import { CreateSalesOrderDto } from '@dtos/sales-order.dto';
import { CreateShipmentDto } from '@dtos/shipment.dto';

export const createSalesOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const salesOrderController = new SalesOrderController(dataSource);
  const shipmentController = new ShipmentController(dataSource);

  router.use(authenticate);

  /**
   * @route   POST /sales-orders
   * @desc    Crear una nueva orden de venta
   * @access  Admin/Manager
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.ENCARGADO),
    validateData(CreateSalesOrderDto),
    salesOrderController.create
  );

  /**
   * @route   POST /sales-orders/:salesOrderId/shipments
   * @desc    Crear un envío para una orden de venta
   * @access  Admin/Manager
   */
  router.post(
    '/:salesOrderId/shipments',
    authorize(UserRole.ADMIN, UserRole.ENCARGADO),
    mergeParamsToBody(['salesOrderId']), // ← Fusionar antes de validar
    validateData(CreateShipmentDto),
    shipmentController.create
  );

  /**
   * @route   GET /sales-orders/:salesOrderId/shipments
   * @desc    Obtener todos los envíos de una orden de venta
   * @access  Logged-in users
   */
  router.get('/:salesOrderId/shipments', shipmentController.getBySalesOrder);

  return router;
};
