import { StatusCodes } from "http-status-codes";
import { Field } from "@entities/field.entity";
import { CreateFieldDto, UpdateFieldDto } from "@dtos/field.dto";
import { HttpException } from "../exceptions/HttpException";
import { DataSource, Repository } from "typeorm";

export class FieldService {
  private fieldRepository: Repository<Field>;

  constructor(dataSource: DataSource) {
    this.fieldRepository = dataSource.getRepository(Field);
  }

  /**
   * Crea un nuevo campo y lo asocia a un usuario.
   * @param fieldData Datos para crear el campo (ej: { name: 'Campo Norte' })
   */
  public async create(fieldData: CreateFieldDto): Promise<Field> {
    // 2. Creamos la nueva entidad Field.
    const newField = this.fieldRepository.create({ ...fieldData });

    // 3. Guardamos el nuevo campo en la base de datos.
    return this.fieldRepository.save(newField);
  }

  /**
   * Devuelve todos los campos de la base de datos.
   */
  public async findAll(): Promise<Field[]> {
    const fields = await this.fieldRepository.find();
    return fields;
  }
  
  /**
   * Busca un campo por su ID.
   * @param fieldId El ID del campo a buscar.
   */
  public async findById(fieldId: string): Promise<Field> {
    const findField = await this.fieldRepository.findOne({ where: { id: fieldId } });
    if (!findField) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }
    return findField;
  }

  /**
   * Actualiza un campo por su ID.
   * @param fieldId El ID del campo a actualizar.
   * @param fieldData Los datos a actualizar.
   */
  public async update(fieldId: string, fieldData: UpdateFieldDto): Promise<Field> {
    const findField = await this.findById(fieldId); // Reutilizamos findById para verificar que exista.

    // Actualizamos el campo con los nuevos datos y lo guardamos.
    this.fieldRepository.merge(findField, fieldData);
    await this.fieldRepository.save(findField);

    return findField;
  }

  /**
   * Elimina un campo por su ID.
   * @param fieldId El ID del campo a eliminar.
   */
  public async delete(fieldId: string): Promise<void> {
    const findField = await this.findById(fieldId); // Verificamos que exista.
    await this.fieldRepository.remove(findField);
  }
}
