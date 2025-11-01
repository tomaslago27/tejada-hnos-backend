import { Variety } from "@/entities/variety.entity";
import { HttpException } from "@/exceptions/HttpException";
import { StatusCodes } from "http-status-codes";
import { DataSource, Repository } from "typeorm";

export class VarietyService {
  private varietyRepository: Repository<Variety>;

  constructor(dataSource: DataSource) {
    this.varietyRepository = dataSource.getRepository(Variety);
  }

  /**
   * Obtener todas las variedades
   */
  async findAll(): Promise<Variety[]> {
    return await this.varietyRepository.find();
  }

  /**
   * Obtener una variedad por su ID
   */
  async findById(id: string): Promise<Variety> {
    const variety = await this.varietyRepository.findOne({ where: { id } });
    
    if (!variety) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Variedad no encontrada');
    }
    
    return variety;
  }

  /**
   * Crear una nueva variedad
   */
  async create(varietyData: Partial<Variety>): Promise<Variety> {
    // Validar que no exista una variedad con el mismo nombre
    if (varietyData.name) {
      const existingVariety = await this.varietyRepository.findOne({
        where: { name: varietyData.name },
      });

      if (existingVariety) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe una variedad con ese nombre'
        );
      }
    }

    const newVariety = this.varietyRepository.create(varietyData);
    return await this.varietyRepository.save(newVariety);
  }

  /**
   * Actualizar una variedad existente
   */
  async update(id: string, varietyData: Partial<Variety>): Promise<Variety> {
    const variety = await this.findById(id);

    // Validar que no exista otra variedad con el mismo nombre
    if (varietyData.name && varietyData.name !== variety.name) {
      const existingVariety = await this.varietyRepository.findOne({
        where: { name: varietyData.name },
      });

      if (existingVariety && existingVariety.id !== id) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe otra variedad con ese nombre'
        );
      }
    }

    this.varietyRepository.merge(variety, varietyData);
    return await this.varietyRepository.save(variety);
  }

  /**
   * Eliminar una variedad por su ID (hard delete)
   */
  async delete(id: string): Promise<Variety> {
    const variety = await this.findById(id);
    return await this.varietyRepository.remove(variety);
  }
}
