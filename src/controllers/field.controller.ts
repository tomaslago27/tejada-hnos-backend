import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FieldService } from '@services/field.service';
import { CreateFieldDto, UpdateFieldDto } from '@dtos/field.dto';
import { HttpException } from '../exceptions/HttpException';
import { DataSource } from 'typeorm';

export class FieldController {
  private fieldService: FieldService;

  constructor(dataSource: DataSource) {
    this.fieldService = new FieldService(dataSource);
  }

  public createField = async (req: Request, res: Response) => {
    try {
      const fieldData: CreateFieldDto = req.body;
      const newField = await this.fieldService.create(fieldData);

      res.status(StatusCodes.CREATED).json({
        data: newField,
        message: 'Campo creado exitosamente.',
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: error instanceof Error ? error.message : 'Error al crear el campo',
      });
    }
  };

  /**
   * Obtiene todos los campos.
   */
  public getFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allFields = await this.fieldService.findAll();

      res.status(StatusCodes.OK).json({
        data: allFields,
        message: 'Campos obtenidos exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un campo específico por su ID.
   */
  public getFieldById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldId = req.params.id;
      if (!fieldId) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
    }
      const field = await this.fieldService.findById(fieldId);

      res.status(StatusCodes.OK).json({
        data: field,
        message: 'Campo obtenido exitosamente.',
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza un campo existente por su ID.
   */
  public updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldId = req.params.id;
      const fieldData: UpdateFieldDto = req.body;
    
      if (!fieldId) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
    }
      const updatedField = await this.fieldService.update(fieldId, fieldData);

      res.status(StatusCodes.OK).json({
        data: updatedField,
        message: 'Campo actualizado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina un campo por su ID.
   */
  public deleteField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldId = req.params.id;
    if (!fieldId) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es requerido.');
    }
      await this.fieldService.delete(fieldId);

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
