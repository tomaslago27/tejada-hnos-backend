import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '@services/supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from '@dtos/supplier.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { SupplierFilters } from '@/interfaces/filters.interface';
import { isValidUUID } from '@/utils/validation.utils';

export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  /**
   * GET /api/suppliers
   * Obtener todos los proveedores con filtros opcionales
   * Query params:
   * - searchTerm: Buscar por nombre
   * - minTotalSupplied: Total mínimo suministrado
   * - maxTotalSupplied: Total máximo suministrado
   * - withDeleted: Incluir proveedores eliminados
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: SupplierFilters = {};
      
      if (req.query.searchTerm) {
        filters.searchTerm = req.query.searchTerm as string;
      }
      
      if (req.query.minTotalSupplied) {
        filters.minTotalSupplied = Number(req.query.minTotalSupplied);
      }
      
      if (req.query.maxTotalSupplied) {
        filters.maxTotalSupplied = Number(req.query.maxTotalSupplied);
      }
      
      if (req.query.withDeleted === 'true') {
        filters.withDeleted = true;
      }

      const suppliers = await this.supplierService.findAll(filters);

      res.status(StatusCodes.OK).json({
        data: suppliers,
        count: suppliers.length,
        message: 'Proveedores obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/suppliers/:id
   * Obtener un proveedor por ID
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID del proveedor no es un UUID válido'
        );
      }

      const supplier = await this.supplierService.findById(id);

      res.status(StatusCodes.OK).json({
        message: 'Proveedor obtenido exitosamente',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/suppliers
   * Crear un nuevo proveedor
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateSupplierDto = req.body;
      const supplier = await this.supplierService.create(data);

      res.status(StatusCodes.CREATED).json({
        message: 'Proveedor creado exitosamente',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/suppliers/:id
   * Actualizar un proveedor
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor no es un UUID válido');
      }

      const data: UpdateSupplierDto = req.body;
      const supplier = await this.supplierService.update(id, data);

      res.status(StatusCodes.OK).json({
        message: 'Proveedor actualizado exitosamente',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/suppliers/:id
   * Soft delete de un proveedor
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor no es un UUID válido');
      }

      const supplier = await this.supplierService.delete(id);

      res.status(StatusCodes.OK).json({
        message: 'Proveedor eliminado exitosamente',
        data: supplier,
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/suppliers/:id/restore
   * Restaurar un proveedor eliminado
   */
  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor no es un UUID válido');
      }

      const supplier = await this.supplierService.restore(id);

      res.status(StatusCodes.OK).json({
        message: 'Proveedor restaurado exitosamente',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/suppliers/:id/permanent
   * Eliminar permanentemente un proveedor
   */
  hardDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del proveedor no es un UUID válido');
      }

      const supplier = await this.supplierService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        message: 'Proveedor eliminado permanentemente',
        data: supplier,
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
