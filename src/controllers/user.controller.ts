import { Request, Response } from 'express';
import { UserService } from '@services/user.service';
import { DataSource } from 'typeorm';

export class UserController {
  private userService: UserService;

  constructor(dataSource: DataSource) {
    this.userService = new UserService(dataSource);
  }

  /**
   * Obtener todos los usuarios
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAll();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al obtener usuarios',
      });
    }
  };

  /**
   * Obtener un usuario por ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Se requiere el ID del usuario' });
        return;
      }
      const user = await this.userService.getById(id);

      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al obtener usuario',
      });
    }
  };

  /**
   * Crear un nuevo usuario
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, lastName } = req.body;
      if (!name || !email || !password || !lastName) {
        res.status(400).json({ error: 'Nombre, apellido, email y contraseña son requeridos' });
        return;
      }

      const newUser = await this.userService.create({ name, email, password, lastName });
      res.status(201).json({ message: 'Usuario creado', user: newUser });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : 'Error al crear usuario',
      });
    }
  };
}
