import { DataSource, Repository } from 'typeorm';
import { Plot } from '@entities/plot.entity';
import { Field } from '@entities/field.entity';
import { Variety } from '@entities/variety.entity';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { PlotFilters } from '@/interfaces/filters.interface';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class PlotService {
  private plotRepository: Repository<Plot>;
  private fieldRepository: Repository<Field>;
  private varietyRepository: Repository<Variety>;

  constructor(dataSource: DataSource) {
    this.plotRepository = dataSource.getRepository(Plot);
    this.fieldRepository = dataSource.getRepository(Field);
    this.varietyRepository = dataSource.getRepository(Variety);
  }

  /**
   * Crear una nueva parcela
   * @param createPlotDto Datos de la parcela a crear
   * @returns Promise<Plot>
   */
  async createPlot(createPlotDto: CreatePlotDto): Promise<Plot> {
    const { fieldId, varietyId, ...plotFields } = createPlotDto;

    if (!fieldId) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'El ID del campo es obligatorio.'
      );
    }

    const field = await this.fieldRepository.findOneBy({ id: fieldId });
    if (!field) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        `El campo con ID ${fieldId} no fue encontrado.`
      );
    }

    if (varietyId) {
      const variety = await this.varietyRepository.findOneBy({ id: varietyId });
      if (!variety) {
        throw new HttpException(
          StatusCodes.NOT_FOUND,
          `La variedad con ID ${varietyId} no fue encontrada.`
        );
      }
    }

    const plotData: Partial<Plot> = {
      ...plotFields,
      field: { id: fieldId } as any,
    };

    if (varietyId) {
      plotData.variety = { id: varietyId } as any;
    }

    const plot = this.plotRepository.create(plotData);

    return await this.plotRepository.save(plot);
  }

  /**
   * Obtener todas las parcelas con filtros opcionales
   * @param filters Filtros opcionales para la búsqueda
   * @returns Promise<Plot[]>
   * 
   * Ejemplos de uso:
   * - getAllPlots() → Todas las parcelas
   * - getAllPlots({ fieldId: '123' }) → Parcelas de un campo específico
   * - getAllPlots({ varietyId: '456' }) → Parcelas de una variedad específica
   * - getAllPlots({ minArea: 50, maxArea: 200 }) → Parcelas por rango de área
   */
  async getAllPlots(filters?: PlotFilters): Promise<Plot[]> {
    const queryBuilder = this.plotRepository
      .createQueryBuilder('plot')
      .leftJoinAndSelect('plot.field', 'field')
      .leftJoinAndSelect('plot.variety', 'variety');

    if (filters) {
      if (filters.fieldId) {
        queryBuilder.andWhere('plot.fieldId = :fieldId', {
          fieldId: filters.fieldId
        });
      }

      if (filters.varietyId) {
        queryBuilder.andWhere('plot.varietyId = :varietyId', {
          varietyId: filters.varietyId
        });
      }

      if (filters.minArea) {
        queryBuilder.andWhere('plot.area >= :minArea', {
          minArea: filters.minArea
        });
      }

      if (filters.maxArea) {
        queryBuilder.andWhere('plot.area <= :maxArea', {
          maxArea: filters.maxArea
        });
      }

      // Filtro especial para CAPATAZ: Solo parcelas de campos gestionados
      if (filters.managedFieldIds && filters.managedFieldIds.length > 0) {
        queryBuilder.andWhere('plot.fieldId IN (:...managedFieldIds)', {
          managedFieldIds: filters.managedFieldIds
        });
      }
    }

    queryBuilder.orderBy('plot.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar una parcela por su ID
   * @param id ID de la parcela
   * @returns Promise<Plot>
   */
  async getPlotById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({
      where: { id },
      relations: ['field', 'variety'],
    });

    if (!plot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'La parcela no fue encontrada.'
      );
    }

    return plot;
  }

  /**
   * Actualizar una parcela por su ID
   * @param id ID de la parcela
   * @param updatePlotDto Datos a actualizar
   * @returns Promise<Plot>
   */
  async updatePlot(id: string, updatePlotDto: UpdatePlotDto): Promise<Plot> {
    const plot = await this.getPlotById(id);
    const { varietyId, ...plotFields } = updatePlotDto;

    this.plotRepository.merge(plot, plotFields);

    if (varietyId) {
      const variety = await this.varietyRepository.findOneBy({ id: varietyId });
      if (!variety) {
        throw new HttpException(
          StatusCodes.NOT_FOUND,
          `La variedad con ID ${varietyId} no fue encontrada.`
        );
      }
      plot.variety = variety;
    }

    return await this.plotRepository.save(plot);
  }

  /**
   * Eliminar una parcela por su ID (soft delete)
   * @param id ID de la parcela
   * @returns Promise<Plot> La parcela eliminada
   */
  async deletePlot(id: string): Promise<Plot> {
    const plot = await this.getPlotById(id);
    return await this.plotRepository.softRemove(plot);
  }

  /**
   * Restaurar una parcela por su ID
   * @param id ID de la parcela a restaurar
   * @returns Promise<Plot> La parcela restaurada
   */
  async restorePlot(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!plot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'La parcela no fue encontrada.'
      );
    }

    return await this.plotRepository.recover(plot);
  }

  /**
   * Eliminar una parcela por su ID (hard delete)
   * @param id ID de la parcela a eliminar de la base de datos
   * @returns Promise<Plot> La parcela eliminada permanentemente
   */
  async hardDeletePlot(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!plot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'La parcela no fue encontrada.'
      );
    }

    return await this.plotRepository.remove(plot);
  }
}
