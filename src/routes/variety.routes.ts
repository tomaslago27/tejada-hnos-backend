import { Router } from "express";
import { DataSource } from "typeorm";
import { VarietyController } from "@/controllers/variety.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/authorize.middleware";
import { validateData } from "@/middlewares/validation.middleware";
import { CreateVarietyDto, UpdateVarietyDto } from "@/dtos/variety.dto";
import { UserRole } from "@/enums";

export const createVarietyRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const varietyController = new VarietyController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /varieties
   * @desc    Obtener todas las variedades
   * @access  Logged-in users
   */
  router.get('/', varietyController.getAll);

  /**
   * @route   GET /varieties/:id
   * @desc    Obtener una variedad por su ID
   * @access  Logged-in users
   */
  router.get('/:id', varietyController.getById);

  /**
   * @route   POST /varieties
   * @desc    Crear una nueva variedad
   * @access  Logged-in users
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN),
    validateData(CreateVarietyDto),
    varietyController.create
  );

  /**
   * @route   PUT /varieties/:id
   * @desc    Actualizar una variedad por su ID
   * @access  Logged-in users
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN),
    validateData(UpdateVarietyDto),
    varietyController.update
  );

  /**
   * @route   DELETE /varieties/:id
   * @desc    Eliminar una variedad por su ID
   * @access  Admin users
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    varietyController.delete
  );

  return router;
};
