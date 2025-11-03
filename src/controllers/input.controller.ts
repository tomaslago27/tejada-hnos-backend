import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InputService } from '@services/input.service';
import { CreateInputDto } from '@dtos/input.dto';

export class InputController {
  constructor(private readonly inputService: InputService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateInputDto = req.body;
      const input = await this.inputService.create(data);

      res.status(StatusCodes.CREATED).json({
        data: input,
        message: 'Insumo creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inputs = await this.inputService.findAll();

      res.status(StatusCodes.OK).json({
        data: inputs,
        count: inputs.length,
        message: 'Insumos obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
