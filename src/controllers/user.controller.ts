import { NextFunction, Request, Response } from 'express';
import { UserService } from '@services/user.service';
import { CreateUserDto, UpdateUserDto } from '@/dtos/user.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { DataSource } from 'typeorm';

export class UserController {
  private userService: UserService;

  constructor(dataSource: DataSource) {
    this.userService = new UserService(dataSource);
  }

  /**
   * GET /users
   * Obtener todos los usuarios
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAll();

      res.status(StatusCodes.OK).json({
        data: users,
        count: users.length,
        message: 'Usuarios obtenidos exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/:id
   * Obtener un usuario por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del usuario es requerido.');
      }

      const user = await this.userService.getById(id);

      res.status(StatusCodes.OK).json({
        data: user,
        message: 'Usuario obtenido exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /users
   * Crear un nuevo usuario
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const newUser = await this.userService.create(userData);

      res.status(StatusCodes.CREATED).json({
        data: newUser,
        message: 'Usuario creado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /users/:id
   * Actualizar un usuario por su ID
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userData: UpdateUserDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del usuario es requerido.');
      }

      const updatedUser = await this.userService.update(id, userData);

      res.status(StatusCodes.OK).json({
        data: updatedUser,
        message: 'Usuario actualizado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /users/:id
   * Eliminar un usuario (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del usuario es requerido.');
      }

      const deletedUser = await this.userService.delete(id);

      res.status(StatusCodes.OK).json({
        data: deletedUser,
        message: 'Usuario eliminado exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /users/:id/restore
   * Restaurar un usuario eliminado
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del usuario es requerido.');
      }

      const restoredUser = await this.userService.restore(id);

      res.status(StatusCodes.OK).json({
        data: restoredUser,
        message: 'Usuario restaurado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /users/:id/permanent
   * Eliminar permanentemente un usuario (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del usuario es requerido.');
      }

      const deletedUser = await this.userService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: deletedUser,
        message: 'Usuario eliminado permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
