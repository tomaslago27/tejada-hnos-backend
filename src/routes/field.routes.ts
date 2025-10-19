import { Router } from 'express';
import { FieldController } from '@controllers/field.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { DataSource } from 'typeorm';

export const createFieldRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const fieldController = new FieldController(dataSource);

  /**
   * @route   GET /fields
   * @desc    Obtener todos los campos
   * @access  Logged-in users
   */
  router.get('/', authenticate, fieldController.getFields);

  /**
   * @route   GET /fields/:id
   * @desc    Obtener un campo por su ID
   * @access  Logged-in users
   */
  router.get('/:id', authenticate, fieldController.getFieldById);

  /**
   * @route   POST /fields
   * @desc    Crear un nuevo campo
   * @access  Admin only
   */
  router.post('/', authenticate, authorize(UserRole.ADMIN), fieldController.createField);

  /**
   * @route   PUT /fields/:id
   * @desc    Actualizar un campo por su ID
   * @access  Admin only
   */
  router.put('/:id', authenticate, authorize(UserRole.ADMIN), fieldController.updateField);

  /**
   * @route   DELETE /fields/:id
   * @desc    Eliminar un campo por su ID
   * @access  Admin only
   */
  router.delete('/:id', authenticate, authorize(UserRole.ADMIN), fieldController.deleteField);

  return router;
}
