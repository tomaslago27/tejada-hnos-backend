import { Router } from 'express';
import { PlotController } from '@controllers/plot.controller';
import { HarvestLotController } from '@controllers/harvest-lot.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { authorizeFieldAccess } from '@middlewares/authorize-field-access.middleware';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';
import { validateData } from '@/middlewares/validation.middleware';
import { UpdatePlotDto } from '@/dtos/plot.dto';

export const createPlotRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const plotController = new PlotController(dataSource);
  const harvestLotController = new HarvestLotController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /plots
   * @desc    Obtener todas las parcelas
   * @access  Logged-in users
   */
  router.get('/', plotController.getPlots);

  /**
   * @route   GET /plots/:id
   * @desc    Obtener una parcela por su ID
   * @access  Logged-in users
   * @security Valida acceso según campos gestionados
   */
  router.get('/:id', authorizeFieldAccess(dataSource), plotController.getPlotById);

  /**
   * @route   GET /plots/:id/harvest-lots
   * @desc    Obtener todos los lotes de cosecha de una parcela específica
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id/harvest-lots',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    harvestLotController.getHarvestLotsByPlot
  );

  /**
   * @route   PUT /plots/:id
   * @desc    Actualizar una parcela por su ID
   * @access  Admin only
   */
  router.put('/:id', authorize(UserRole.ADMIN), validateData(UpdatePlotDto), plotController.updatePlot);

  /**
   * @route   DELETE /plots/:id
   * @desc    Eliminar una parcela por su ID (soft delete)
   * @access  Admin only
   */
  router.delete('/:id', authorize(UserRole.ADMIN), plotController.deletePlot);

  /**
   * @route   PATCH /plots/:id/restore
   * @desc    Restaurar una parcela eliminada
   * @access  Admin only
   */
  router.patch('/:id/restore', authorize(UserRole.ADMIN), plotController.restorePlot);

  /**
   * @route   DELETE /plots/:id/permanent
   * @desc    Eliminar permanentemente una parcela (hard delete)
   * @access  Admin only
   */
  router.delete('/:id/permanent', authorize(UserRole.ADMIN), plotController.hardDeletePlot);

  return router;
}
