import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '@services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from '@dtos/customer.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { CustomerFilters } from '@/interfaces/filters.interface';
import { isValidUUID } from '@/utils/validation.utils';

export class CustomerController {
  constructor(private customerService: CustomerService) {}

  /**
   * GET /api/customers
   * Obtener todos los clientes con filtros opcionales
   * Query params:
   * - searchTerm: Buscar por nombre
   * - minTotalPurchases: Total mínimo gastado
   * - maxTotalPurchases: Total máximo gastado
   * - withDeleted: Incluir clientes eliminados
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: CustomerFilters = {};
      
      if (req.query.searchTerm) {
        filters.searchTerm = req.query.searchTerm as string;
      }
      
      if (req.query.minTotalPurchases) {
        filters.minTotalPurchases = Number(req.query.minTotalPurchases);
      }
      
      if (req.query.maxTotalPurchases) {
        filters.maxTotalPurchases = Number(req.query.maxTotalPurchases);
      }
      
      if (req.query.withDeleted === 'true') {
        filters.withDeleted = true;
      }

      const customers = await this.customerService.findAll(filters);

      res.status(StatusCodes.OK).json({
        data: customers,
        count: customers.length,
        message: 'Clientes obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/customers/:id
   * Obtener un cliente por ID
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del cliente es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del cliente no es un UUID válido'
        );
      }

      const customer = await this.customerService.findById(id);

      res.status(StatusCodes.OK).json({
        message: 'Cliente obtenido exitosamente',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/customers
   * Crear un nuevo cliente
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateCustomerDto = req.body;
      const customer = await this.customerService.create(data);

      res.status(StatusCodes.CREATED).json({
        message: 'Cliente creado exitosamente',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/customers/:id
   * Actualizar un cliente
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del cliente es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del cliente no es un UUID válido'
        );
      }

      const data: UpdateCustomerDto = req.body;
      const customer = await this.customerService.update(id, data);

      res.status(StatusCodes.OK).json({
        message: 'Cliente actualizado exitosamente',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/customers/:id
   * Soft delete de un cliente
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del cliente es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del cliente no es un UUID válido'
        );
      }

      const customer = await this.customerService.delete(id);

      res.status(StatusCodes.OK).json({
        message: 'Cliente eliminado exitosamente',
        data: customer,
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/customers/:id/restore
   * Restaurar un cliente eliminado
   */
  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del cliente es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del cliente no es un UUID válido'
        );
      }

      const customer = await this.customerService.restore(id);

      res.status(StatusCodes.OK).json({
        message: 'Cliente restaurado exitosamente',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/customers/:id/permanent
   * Eliminar permanentemente un cliente
   */
  hardDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del cliente es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del cliente no es un UUID válido'
        );
      }

      const customer =await this.customerService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        message: 'Cliente eliminado permanentemente',
        data: customer,
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
