import { DataSource, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@/dtos/user.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Obtener todos los usuarios
   * @returns Promise<User[]>
   */
  async getAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['assignedWorkOrders', 'managedFields'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Buscar un usuario por su ID
   * @param id ID del usuario
   * @returns Promise<User>
   */
  async getById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['assignedWorkOrders', 'managedFields']
    });

    if (!user) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'Usuario no encontrado.'
      );
    }

    return user;
  }

  /**
   * Crear un nuevo usuario
   * @param data CreateUserDto
   * @returns Promise<User>
   */
  async create(data: CreateUserDto): Promise<User> {
    const { email, password, name, lastName, role, hourlyRate } = data;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        'El email ya está en uso.'
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      name,
      lastName,
      passwordHash,
      ...(role && { role }),
      hourlyRate: hourlyRate || 0,
    });

    return await this.userRepository.save(newUser);
  }

  /**
   * Actualizar un usuario por su ID
   * @param id ID del usuario
   * @param data UpdateUserDto
   * @returns Promise<User>
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.getById(id);
    const { email, password, ...userData } = data;

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'El email ya está en uso.'
        );
      }
      user.email = email;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    this.userRepository.merge(user, userData);
    return await this.userRepository.save(user);
  }

  /**
   * Eliminar un usuario por su ID (soft delete)
   * @param id ID del usuario
   * @returns Promise<User> El usuario eliminado
   */
  async delete(id: string): Promise<User> {
    const user = await this.getById(id);
    return await this.userRepository.softRemove(user);
  }

  /**
   * Restaurar un usuario por su ID
   * @param id ID del usuario a restaurar
   * @returns Promise<User> El usuario restaurado
   */
  async restore(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'Usuario no encontrado.'
      );
    }

    return await this.userRepository.recover(user);
  }

  /**
   * Eliminar un usuario por su ID (hard delete)
   * @param id ID del usuario a eliminar de la base de datos
   * @returns Promise<User> El usuario eliminado permanentemente
   */
  async hardDelete(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'Usuario no encontrado.'
      );
    }

    return await this.userRepository.remove(user);
  }
}
