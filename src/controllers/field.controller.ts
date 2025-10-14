import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FieldService } from '@services/field.service';
import { CreateFieldDto, UpdateFieldDto } from '@interfaces/field.interface';
import { HttpException } from '../exceptions/HttpException';
import { TokenPayload } from '@interfaces/auth.interface';

export class FieldController {
  private fieldService = new FieldService();

  public createField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenPayload = req.user as TokenPayload;
      if (!tokenPayload) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'Se requiere autenticación');
      }

      const fieldData: CreateFieldDto = req.body;
      const newField = await this.fieldService.create(fieldData, tokenPayload.userId);

      res.status(StatusCodes.CREATED).json({
        data: newField,
        message: 'Campo creado exitosamente.',
      });
    } catch (error) {
      next(error);
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