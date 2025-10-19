import { DataSource, Repository } from 'typeorm';
import { Plot } from '@entities/plot.entity';
import { Field } from '@entities/field.entity';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { instanceToPlain } from 'class-transformer';

export class PlotService {
  private plotRepository: Repository<Plot>;
  private fieldRepository: Repository<Field>;

  constructor(dataSource: DataSource) {
    this.plotRepository = dataSource.getRepository(Plot);
    this.fieldRepository = dataSource.getRepository(Field);
  }

  async createPlot(createPlotDto: CreatePlotDto): Promise<Plot> {
    const field = await this.fieldRepository.findOneBy({ id: createPlotDto.fieldId });
    if (!field) {
      throw new Error('Field not found');
    }

    const plainData = instanceToPlain(createPlotDto);

    delete plainData.fieldId;

    const plot = this.plotRepository.create({
      ...plainData,
      field,
    });

    return this.plotRepository.save(plot);
  }

  async updatePlot(id: string, updatePlotDto: UpdatePlotDto): Promise<Plot> {
    const plot = await this.plotRepository.findOneBy({ id });
    if (!plot) {
      throw new Error('Plot not found');
    }

    Object.assign(plot, updatePlotDto);
    return this.plotRepository.save(plot);
  }

  async getAllPlots(fieldId?: string): Promise<Plot[]> {
    const where = fieldId ? { field: { id: fieldId } } : {};
    return this.plotRepository.find({
        where: where,
    });
  }

  async getPlotById(id: string): Promise<Plot | null> {
    return this.plotRepository.findOneBy({ id });
  }

  async deletePlot(id: string): Promise<void> {
    await this.plotRepository.delete(id);
  }
}
