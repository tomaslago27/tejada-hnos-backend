import { Router } from 'express';
import { DataSource } from 'typeorm';
import { CustomerController } from '@controllers/customer.controller';
import { CustomerService } from '@services/customer.service';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { validateData } from '@middlewares/validation.middleware';
import { CreateCustomerDto, UpdateCustomerDto } from '@dtos/customer.dto';
import { UserRole } from '@/enums';

export const createCustomerRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const customerService = new CustomerService(dataSource);
  const customerController = new CustomerController(customerService);

  // Proteger todas las rutas con autenticación
  router.use(authenticate);

  /**
   * @route   GET /customers
   * @desc    Obtener todos los clientes
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    customerController.getAll
  );

  /**
   * @route   GET /customers/:id
   * @desc    Obtener un cliente por ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    customerController.getById
  );

  /**
   * @route   POST /customers
   * @desc    Crear un nuevo cliente
   * @access  ADMIN
   */
  router.post(
    '/',
    authorize(UserRole.ADMIN),
    validateData(CreateCustomerDto),
    customerController.create
  );

  /**
   * @route   PUT /customers/:id
   * @desc    Actualizar un cliente
   * @access  ADMIN
   */
  router.put(
    '/:id',
    authorize(UserRole.ADMIN),
    validateData(UpdateCustomerDto),
    customerController.update
  );

  /**
   * @route   DELETE /customers/:id
   * @desc    Soft delete de un cliente
   * @access  ADMIN
   */
  router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    customerController.delete
  );

  /**
   * @route   PATCH /customers/:id/restore
   * @desc    Restaurar un cliente eliminado
   * @access  ADMIN
   */
  router.patch(
    '/:id/restore',
    authorize(UserRole.ADMIN),
    customerController.restore
  );

  /**
   * @route   DELETE /customers/:id/permanent
   * @desc    Eliminar permanentemente un cliente
   * @access  ADMIN
   */
  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    customerController.hardDelete
  );

  return router;
};
