import { Router } from 'express';
import { FieldController } from '@controllers/field.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';
import { validateData } from '@/middlewares/validation.middleware';
import { CreateFieldDto, UpdateFieldDto } from '@/dtos/field.dto';
import { CreatePlotDto } from '@/dtos/plot.dto';
import { PlotController } from '@/controllers/plot.controller';
import { mergeParamsToBody } from '@/middlewares/merge-params.middleware';

export const createFieldRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const fieldController = new FieldController(dataSource);
  const plotController = new PlotController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /fields
   * @desc    Obtener todos los campos
   * @access  Logged-in users
   */
  router.get('/', fieldController.getFields);

  /**
   * @route   GET /fields/:id
   * @desc    Obtener un campo por su ID
   * @access  Logged-in users
   */
  router.get('/:id', fieldController.getFieldById);

  /**
   * @route   POST /fields
   * @desc    Crear un nuevo campo
   * @access  Admin only
   */
  router.post('/', authorize(UserRole.ADMIN), validateData(CreateFieldDto), fieldController.createField);

  /**
   * @route   PUT /fields/:id
   * @desc    Actualizar un campo por su ID
   * @access  Admin only
   */
  router.put('/:id', authorize(UserRole.ADMIN), validateData(UpdateFieldDto), fieldController.updateField);

  /**
   * @route   DELETE /fields/:id
   * @desc    Eliminar un campo por su ID
   * @access  Admin only
   */
  router.delete('/:id', authorize(UserRole.ADMIN), fieldController.deleteField);

  // -----------------------------------------------------------------
  // --- SUB-ROUTER para PLOTS ANIDADAS: /fields/:fieldId/plots ---
  // -----------------------------------------------------------------
  // NOTA: { mergeParams: true } es CRUCIAL para que PlotController pueda leer :fieldId
  const nestedPlotRouter = Router({ mergeParams: true });
  
  nestedPlotRouter.use(authenticate);

  /**
   * @route   POST /fields/:fieldId/plots
   * @desc    Crear una nueva parcela en el campo especificado
   * @access  Admin only
   */
  nestedPlotRouter.post(
    '/', 
    authorize(UserRole.ADMIN),
    mergeParamsToBody(['fieldId']),
    validateData(CreatePlotDto), 
    plotController.createPlot
  );

  /**
   * @route   GET /fields/:fieldId/plots
   * @desc    Obtener todas las parcelas de un campo
   * @access  Logged-in users
   */
  nestedPlotRouter.get('/', plotController.getPlots);
  
  // Montar el sub-router de Plots en la ruta de Field
  router.use('/:fieldId/plots', nestedPlotRouter);

  return router;
}
