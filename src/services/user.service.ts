import { DataSource, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { RegisterRequest } from '@interfaces/auth.interface';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Obtener todos los usuarios
   */
  async getAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Obtener un usuario por su ID
   */
  async getById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Crear un nuevo usuario
   * Nota: La contraseña se hashea.
   */
  async create(data: Omit<RegisterRequest, 'role'> & { role?: string }): Promise<User> {
    const { email, password, name, lastName, role } = data;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('El email ya está en uso.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      name,
      lastName,
      passwordHash,
      role: role as any, // Ajustar si es necesario
    });

    return this.userRepository.save(newUser);
  }
}
