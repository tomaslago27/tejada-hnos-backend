import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { PlotService } from '@services/plot.service';
import { PlotFilters } from '@/interfaces/filters.interface';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class PlotController {
  private plotService: PlotService;

  constructor(dataSource: DataSource) {
    this.plotService = new PlotService(dataSource);
  }

  /**
   * GET /plots
   * Obtener todas las parcelas con filtros opcionales
   */
  public getPlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: PlotFilters = {};

      if (req.query.fieldId) {
        filters.fieldId = req.query.fieldId as string;
      }

      if (req.query.varietyId) {
        filters.varietyId = req.query.varietyId as string;
      }

      if (req.query.minArea) {
        filters.minArea = parseFloat(req.query.minArea as string);
      }

      if (req.query.maxArea) {
        filters.maxArea = parseFloat(req.query.maxArea as string);
      }

      const plots = await this.plotService.getAllPlots(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: plots,
        count: plots.length,
        message: 'Parcelas obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /plots/:id
   * Obtener una parcela por su ID
   */
  public getPlotById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      }

      const plot = await this.plotService.getPlotById(id);

      res.status(StatusCodes.OK).json({
        data: plot,
        message: 'Parcela obtenida exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /plots
   * Crear una nueva parcela
   */
  public createPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotData: CreatePlotDto = req.body;
      const newPlot = await this.plotService.createPlot(plotData);

      res.status(StatusCodes.CREATED).json({
        data: newPlot,
        message: 'Parcela creada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /plots/:id
   * Actualizar una parcela por su ID
   */
  public updatePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const plotData: UpdatePlotDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      }

      const updatedPlot = await this.plotService.updatePlot(id, plotData);

      res.status(StatusCodes.OK).json({
        data: updatedPlot,
        message: 'Parcela actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /plots/:id
   * Eliminar una parcela (soft delete)
   */
  public deletePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      }

      const deletedPlot = await this.plotService.deletePlot(id);

      res.status(StatusCodes.OK).json({
        data: deletedPlot,
        message: 'Parcela eliminada exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /plots/:id/restore
   * Restaurar una parcela eliminada
   */
  public restorePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      }

      const restoredPlot = await this.plotService.restorePlot(id);

      res.status(StatusCodes.OK).json({
        data: restoredPlot,
        message: 'Parcela restaurada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /plots/:id/permanent
   * Eliminar permanentemente una parcela (hard delete)
   */
  public hardDeletePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      }

      const deletedPlot = await this.plotService.hardDeletePlot(id);

      res.status(StatusCodes.OK).json({
        data: deletedPlot,
        message: 'Parcela eliminada permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
