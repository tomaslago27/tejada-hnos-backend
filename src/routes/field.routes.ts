import { Router } from 'express';
import { FieldController } from '@controllers/field.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums/index';
import { Routes } from '@interfaces/routes.interface';

export class FieldRoutes implements Routes {
  // Define la ruta base para todos los endpoints de campos.
  public path = "/fields";
  public router = Router();
  private fieldController = new FieldController();

  constructor() {
     this.initializeRoutes();
     console.log('✅ ¡Las rutas de Fields se están cargando correctamente!');
    }

  private initializeRoutes() {
    // Proteger todas las rutas de /fields para que solo los ADMINS puedan acceder.
    this.router.use("/", authenticate, authorize(UserRole.ADMIN));

    // Define las rutas específicas y las conecta a los métodos del controlador.
    this.router.get(`/`, this.fieldController.getFields);
    this.router.get(`/:id`, this.fieldController.getFieldById);
    this.router.post(`/`, this.fieldController.createField);
    this.router.put(`/:id`, this.fieldController.updateField);
    this.router.delete(`/:id`, this.fieldController.deleteField);
  }
}