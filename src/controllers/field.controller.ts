import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FieldService } from '@services/field.service';
import { FieldFilters } from '@/interfaces/filters.interface';
import { CreateFieldDto, UpdateFieldDto } from '@dtos/field.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataSource } from 'typeorm';

export class FieldController {
  private fieldService: FieldService;

  constructor(dataSource: DataSource) {
    this.fieldService = new FieldService(dataSource);
  }

  /**
   * GET /fields
   * Obtener todos los campos con filtros opcionales
   */
  public getFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: FieldFilters = {};

      if (req.query.managerId) {
        filters.managerId = req.query.managerId as string;
      }

      if (req.query.minArea) {
        filters.minArea = parseFloat(req.query.minArea as string);
      }

      if (req.query.maxArea) {
        filters.maxArea = parseFloat(req.query.maxArea as string);
      }

      const fields = await this.fieldService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: fields,
        count: fields.length,
        message: 'Campos obtenidos exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /fields/:id
   * Obtener un campo por su ID
   */
  public getFieldById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
      }

      const field = await this.fieldService.findById(id);

      res.status(StatusCodes.OK).json({
        data: field,
        message: 'Campo obtenido exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /fields
   * Crear un nuevo campo
   */
  public createField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldData: CreateFieldDto = req.body;
      const newField = await this.fieldService.create(fieldData);

      res.status(StatusCodes.CREATED).json({
        data: newField,
        message: 'Campo creado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /fields/:id
   * Actualizar un campo por su ID
   */
  public updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const fieldData: UpdateFieldDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
      }

      const updatedField = await this.fieldService.update(id, fieldData);

      res.status(StatusCodes.OK).json({
        data: updatedField,
        message: 'Campo actualizado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /fields/:id
   * Eliminar un campo (soft delete)
   */
  public deleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
      }

      const deletedField = await this.fieldService.delete(id);

      res.status(StatusCodes.OK).json({
        data: deletedField,
        message: 'Campo eliminado exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /fields/:id/restore
   * Restaurar un campo eliminado
   */
  public restoreField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
      }

      const restoredField = await this.fieldService.restore(id);

      res.status(StatusCodes.OK).json({
        data: restoredField,
        message: 'Campo restaurado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /fields/:id/permanent
   * Eliminar permanentemente un campo (hard delete)
   */
  public hardDeleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
      }

      const deletedField = await this.fieldService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: deletedField,
        message: 'Campo eliminado permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
