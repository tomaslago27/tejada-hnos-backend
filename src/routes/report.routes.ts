import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ReportController } from '@controllers/report.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { authorizeFieldAccess } from '@middlewares/authorize-field-access.middleware';
import { UserRole } from '@/enums';

/**
 * Rutas de Reportes - Business Intelligence
 * 
 * Endpoints para generación de reportes financieros y análisis de datos.
 * Todos los endpoints requieren autenticación y roles específicos.
 */
export const createReportRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const reportController = new ReportController(dataSource);

  // Todos los endpoints de reportes requieren autenticación
  router.use(authenticate);

  /**
   * @route   GET /reports/plot-summary/:plotId
   * @desc    Obtener reporte financiero completo de una parcela
   * @access  ADMIN, CAPATAZ (con filtro de campos gestionados)
   * 
   * Retorna:
   * - Costos totales (RRHH + Insumos)
   * - Ingresos totales por ventas
   * - Margen de ganancia
   * - Desglose de costos para gráficos
   * - Lista detallada de actividades con sus costos
   * 
   * Seguridad:
   * - ADMIN: Puede ver reportes de cualquier parcela
   * - CAPATAZ: Solo puede ver reportes de parcelas en sus campos gestionados
   */
  router.get(
    '/plot-summary/:plotId',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    authorizeFieldAccess(dataSource),
    reportController.getPlotSummary
  );

  return router;
};
