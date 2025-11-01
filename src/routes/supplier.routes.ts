import { Router } from 'express';
import { DataSource } from 'typeorm';
import { SupplierController } from '@controllers/supplier.controller';
import { SupplierService } from '@services/supplier.service';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreateSupplierDto, UpdateSupplierDto } from '@dtos/supplier.dto';
import { UserRole } from '@/enums';

export const createSupplierRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const supplierService = new SupplierService(dataSource);
  const supplierController = new SupplierController(supplierService);

  // Proteger todas las rutas con autenticación
  router.use(authenticate);

  /**
   * @route   GET /suppliers
   * @desc    Obtener todos los proveedores
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    supplierController.getAll
  );

  /**
   * @route   GET /suppliers/:id
   * @desc    Obtener un proveedor por ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    supplierController.getById
  );

  /**
   * @route   POST /suppliers
   * @desc    Crear un nuevo proveedor
   * @access  ADMIN
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN),
    validateData(CreateSupplierDto),
    supplierController.create
  );

  /**
   * @route   PUT /suppliers/:id
   * @desc    Actualizar un proveedor
   * @access  ADMIN
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN),
    validateData(UpdateSupplierDto),
    supplierController.update
  );

  /**
   * @route   DELETE /suppliers/:id
   * @desc    Soft delete de un proveedor
   * @access  ADMIN
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    supplierController.delete
  );

  /**
   * @route   PATCH /suppliers/:id/restore
   * @desc    Restaurar un proveedor eliminado
   * @access  ADMIN
   */
  router.patch(
    '/:id/restore',
    authorize(UserRole.ADMIN),
    supplierController.restore
  );

  /**
   * @route   DELETE /suppliers/:id/permanent
   * @desc    Eliminar permanentemente un proveedor
   * @access  ADMIN
   */
  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    supplierController.hardDelete
  );

  return router;
};
