import { DataSource, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '@/dtos/user.dto';

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
  async create(data: CreateUserDto): Promise<User> {
    const { email, password, name, lastName, role } = data;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('El email ya está en uso.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User();
    newUser.email = email;
    newUser.name = name;
    newUser.lastName = lastName;
    newUser.passwordHash = passwordHash;
    if (role) {
      newUser.role = role;
    }

    return this.userRepository.save(newUser);
  }
}
