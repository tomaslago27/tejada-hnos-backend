import { StatusCodes } from "http-status-codes";
import { Field } from "@entities/field.entity";
import { User } from "@entities/user.entity";
import { CreateFieldDto, UpdateFieldDto } from "@dtos/field.dto";
import { FieldFilters } from "@/interfaces/filters.interface";
import { HttpException } from "../exceptions/HttpException";
import { DataSource, Repository } from "typeorm";
import { UserRole } from "@/enums";

export class FieldService {
  private fieldRepository: Repository<Field>;
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.fieldRepository = dataSource.getRepository(Field);
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Crear un nuevo campo
   * @param fieldData CreateFieldDto
   * @returns Promise<Field>
   */
  public async create(fieldData: CreateFieldDto): Promise<Field> {
    const { managerId, ...fieldFields } = fieldData;

    const newField = this.fieldRepository.create(fieldFields);

    if (managerId) {
      const manager = await this.userRepository.findOne({ where: { id: managerId } });
      if (!manager) {
        throw new HttpException(StatusCodes.NOT_FOUND, "El usuario encargado no fue encontrado.");
      }

      if (manager.role !== UserRole.CAPATAZ) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El usuario asignado como encargado no tiene el rol de CAPATAZ."
        );
      }

      newField.managerId = managerId;
      newField.manager = manager;
    }

    return await this.fieldRepository.save(newField);
  }

  /**
   * Obtener todos los campos con filtros opcionales
   * @param filters Filtros opcionales para la búsqueda
   * @returns Promise<Field[]>
   * 
   * Ejemplos de uso:
   * - findAll() → Todos los campos
   * - findAll({ managerId: '123' }) → Campos de un encargado específico
   * - findAll({ minArea: 100, maxArea: 500 }) → Campos por rango de área
   */
  public async findAll(filters?: FieldFilters): Promise<Field[]> {
    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field')
      .leftJoinAndSelect('field.manager', 'manager')
      .leftJoinAndSelect('field.plots', 'plots');

    if (filters) {
      if (filters.managerId) {
        queryBuilder.andWhere('field.managerId = :managerId', {
          managerId: filters.managerId
        });
      }

      if (filters.minArea) {
        queryBuilder.andWhere('field.area >= :minArea', {
          minArea: filters.minArea
        });
      }

      if (filters.maxArea) {
        queryBuilder.andWhere('field.area <= :maxArea', {
          maxArea: filters.maxArea
        });
      }

      // Filtro especial para CAPATAZ: Solo campos gestionados por él
      if (filters.managedFieldIds && filters.managedFieldIds.length > 0) {
        queryBuilder.andWhere('field.id IN (:...managedFieldIds)', {
          managedFieldIds: filters.managedFieldIds
        });
      }
    }

    queryBuilder.orderBy('field.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }
  
  /**
   * Buscar un campo por su ID
   * @param fieldId El ID del campo a buscar
   * @returns Promise<Field>
   */
  public async findById(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({ 
      where: { id: fieldId }, 
      relations: ['manager', 'plots', 'plots.variety'] 
    });
    
    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }
    
    return field;
  }

  /**
   * Actualizar un campo por su ID
   * @param fieldId El ID del campo a actualizar
   * @param fieldData Los datos a actualizar
   * @returns Promise<Field>
   */
  public async update(fieldId: string, fieldData: UpdateFieldDto): Promise<Field> {
    const field = await this.findById(fieldId);
    const { managerId, ...fieldFields } = fieldData;

    this.fieldRepository.merge(field, fieldFields);

    if (managerId !== undefined) {
      if (managerId === null) {
        field.managerId = null;
        field.manager = null as any;
      } else {
        const manager = await this.userRepository.findOne({ where: { id: managerId } });
        if (!manager) {
          throw new HttpException(StatusCodes.NOT_FOUND, "El usuario encargado no fue encontrado.");
        }

        if (manager.role !== UserRole.CAPATAZ) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            "El usuario asignado como encargado no tiene el rol de CAPATAZ."
          );
        }

        field.managerId = managerId;
        field.manager = manager;
      }
    }

    return await this.fieldRepository.save(field);
  }

  /**
   * Eliminar un campo por su ID (soft delete)
   * @param fieldId El ID del campo a eliminar
   * @returns Promise<Field> El campo eliminado
   */
  public async delete(fieldId: string): Promise<Field> {
    const field = await this.findById(fieldId);
    return await this.fieldRepository.softRemove(field);
  }

  /**
   * Restaurar un campo por su ID
   * @param fieldId El ID del campo a restaurar
   * @returns Promise<Field> El campo restaurado
   */
  public async restore(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      withDeleted: true,
    });

    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }

    return await this.fieldRepository.recover(field);
  }

  /**
   * Eliminar un campo por su ID (hard delete)
   * @param fieldId El ID del campo a eliminar de la base de datos
   * @returns Promise<Field> El campo eliminado permanentemente
   */
  public async hardDelete(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      withDeleted: true,
    });

    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }

    return await this.fieldRepository.remove(field);
  }
}
