import { Router } from 'express';
import { PlotController } from '@controllers/plot.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';
import { validateData } from '@/middlewares/validation.middleware';
import { UpdatePlotDto } from '@/dtos/plot.dto';

export const createPlotRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const plotController = new PlotController(dataSource);

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
   */
  router.get('/:id', plotController.getPlotById);

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
   * @route   POST /plots/:id/restore
   * @desc    Restaurar una parcela eliminada
   * @access  Admin only
   */
  router.post('/:id/restore', authorize(UserRole.ADMIN), plotController.restorePlot);

  /**
   * @route   DELETE /plots/:id/permanent
   * @desc    Eliminar permanentemente una parcela (hard delete)
   * @access  Admin only
   */
  router.delete('/:id/permanent', authorize(UserRole.ADMIN), plotController.hardDeletePlot);

  return router;
}
