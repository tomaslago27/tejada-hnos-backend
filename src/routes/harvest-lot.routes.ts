import { Router } from 'express';
import { HarvestLotController } from '@controllers/harvest-lot.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';
import { validateData } from '@/middlewares/validation.middleware';
import { CreateHarvestLotDto, UpdateHarvestLotDto } from '@/dtos/harvest-lot.dto';

export const createHarvestLotRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const harvestLotController = new HarvestLotController(dataSource);

  // Todas las rutas requieren autenticación
  router.use(authenticate);

  /**
   * @route   POST /harvest-lots
   * @desc    Crear un nuevo lote de cosecha (registro de peso bruto)
   * @access  ADMIN, CAPATAZ
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreateHarvestLotDto),
    harvestLotController.createHarvestLot
  );

  /**
   * @route   GET /harvest-lots
   * @desc    Obtener todos los lotes de cosecha
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    harvestLotController.getHarvestLots
  );

  /**
   * @route   GET /harvest-lots/:id
   * @desc    Obtener un lote de cosecha por su ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    harvestLotController.getHarvestLotById
  );

  /**
   * @route   PUT /harvest-lots/:id
   * @desc    Actualizar un lote de cosecha (actualizar peso neto y calcular rendimiento)
   * @access  ADMIN (solo ADMIN puede actualizar peso neto)
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN),
    validateData(UpdateHarvestLotDto),
    harvestLotController.updateHarvestLot
  );

  /**
   * @route   DELETE /harvest-lots/:id
   * @desc    Eliminar un lote de cosecha (soft delete)
   * @access  ADMIN only
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    harvestLotController.deleteHarvestLot
  );

  /**
   * @route   POST /harvest-lots/:id/restore
   * @desc    Restaurar un lote de cosecha eliminado
   * @access  ADMIN only
   */
  router.post(
    '/:id/restore',
    authorize(UserRole.ADMIN),
    harvestLotController.restoreHarvestLot
  );

  /**
   * @route   DELETE /harvest-lots/:id/permanent
   * @desc    Eliminar permanentemente un lote de cosecha (hard delete)
   * @access  ADMIN only
   */
  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    harvestLotController.hardDeleteHarvestLot
  );

  return router;
};
