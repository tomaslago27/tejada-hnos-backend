import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { PlotService } from '@services/plot.service';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';

export class PlotController {
  private plotService: PlotService;

  constructor(dataSource: DataSource) {
    this.plotService = new PlotService(dataSource);
  }

  public createPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fieldId } = req.params;
      if (!fieldId) {
        return res.status(400).json({ message: 'Field ID is required' });
      }

      // Agregar fieldId al cuerpo de la solicitud
      req.body.fieldId = fieldId;

      const plotData: CreatePlotDto = req.body;
      const newPlot = await this.plotService.createPlot(plotData);
      return res.status(201).json(newPlot);
    } catch (error) {
      next(error); // Pasa el error al manejador de errores de Express
    }
  };

  public getPlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldId = req.params.fieldId || (req.query.fieldId as string);
      const plots = await this.plotService.getAllPlots(fieldId);
      return res.status(200).json(plots);
    } catch (error) {
      next(error);
    }
  };

  public getPlotById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plot = await this.plotService.getPlotById(req.params.id as string);
      if (!plot) {
        return res.status(404).json({ message: 'Plot not found' });
      }
      return res.status(200).json(plot);
    } catch (error) {
      next(error);
    }
  };

  public updatePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // El body ya está validado como UpdatePlotDto
      const updateData: UpdatePlotDto = req.body;
      const updatedPlot = await this.plotService.updatePlot(req.params.id as string, updateData);

      if (!updatedPlot) {
        return res.status(404).json({ message: 'Plot not found' });
      }
      return res.status(200).json(updatedPlot);
    } catch (error) {
      next(error);
    }
  };

  public deletePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.plotService.deletePlot(req.params.id as string);
      return res.status(204).send(); // 204 No Content para borrado exitoso
    } catch (error) {
      // Si el error es de "Plot not found", lo manejas aquí con 404
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: 'Plot not found' });
      }
      next(error);
    }
  };
}
