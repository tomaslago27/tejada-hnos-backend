import { DataSource } from "typeorm";
import { VarietyService } from "@/services/variety.service";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HttpException } from "@/exceptions/HttpException";
import { CreateVarietyDto, UpdateVarietyDto } from "@/dtos/variety.dto";
import { isValidUUID } from "@/utils/validation.utils";

export class VarietyController {
  private varietyService: VarietyService;

  constructor(dataSource: DataSource) {
    this.varietyService = new VarietyService(dataSource);
  }

  /**
   * GET /varieties
   * Obtener todas las variedades
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const varieties = await this.varietyService.findAll();
      res.status(StatusCodes.OK).json({
        data: varieties,
        count: varieties.length,
        message: "Variedades obtenidas exitosamente",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /varieties/:id
   * Obtener una variedad por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, "El ID de la variedad es requerido");
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID de la variedad no es un UUID válido'
        );
      }

      const variety = await this.varietyService.findById(id);
      
      res.status(StatusCodes.OK).json({
        message: "Variedad obtenida exitosamente",
        data: variety,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   *  POST /varieties
   *  Crear una nueva variedad
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const varietyData: CreateVarietyDto = req.body;
      const newVariety = await this.varietyService.create(varietyData);
      
      res.status(StatusCodes.CREATED).json({
        message: "Variedad creada exitosamente",
        data: newVariety,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /varieties/:id
   * Actualizar una variedad por su ID
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, "El ID de la variedad es requerido");
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID de la variedad no es un UUID válido'
        );
      }
      
      const varietyData: UpdateVarietyDto = req.body;
      const updatedVariety = await this.varietyService.update(id, varietyData);

      res.status(StatusCodes.OK).json({
        message: "Variedad actualizada exitosamente",
        data: updatedVariety,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /varieties/:id
   * Eliminar una variedad por su ID (permanente)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, "El ID de la variedad es requerido");
      }

      if (!isValidUUID(id)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'El ID de la variedad no es un UUID válido'
        );
      }

      const deletedVariety = await this.varietyService.delete(id);

      res.status(StatusCodes.OK).json({
        message: "Variedad eliminada exitosamente",
        data: deletedVariety,
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  }
}
