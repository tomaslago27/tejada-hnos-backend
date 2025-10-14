import { Router } from 'express';
import { FieldController } from '@controllers/field.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { Routes } from '@interfaces/routes.interface';

export class FieldRoutes implements Routes {
  // Define la ruta base para todos los endpoints de campos.
  public path = '/fields';
  public router = Router();
  private fieldController = new FieldController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Proteger todas las rutas de /fields para que solo los ADMINS puedan acceder.
    this.router.use(this.path, authenticate, authorize(UserRole.ADMIN));

    // Define las rutas específicas y las conecta a los métodos del controlador.
    this.router.get(`${this.path}`, this.fieldController.getFields);
    this.router.get(`${this.path}/:id`, this.fieldController.getFieldById);
    this.router.post(`${this.path}`, this.fieldController.createField);
    this.router.put(`${this.path}/:id`, this.fieldController.updateField);
    this.router.delete(`${this.path}/:id`, this.fieldController.deleteField);
  }
}