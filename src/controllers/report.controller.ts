import { DataSource } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { ReportService } from '@services/report.service';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

/**
 * Controlador de Reportes - Business Intelligence
 * 
 * Maneja los endpoints relacionados con reportes financieros y análisis de datos.
 * Actualmente implementa:
 * - GET /reports/plot-summary/:plotId - Reporte financiero de una parcela
 */
export class ReportController {
  private reportService: ReportService;

  constructor(dataSource: DataSource) {
    this.reportService = new ReportService(dataSource);
  }

  /**
   * GET /reports/plot-summary/:plotId
   * 
   * Obtener el reporte financiero completo de una parcela específica.
   * Incluye costos de RRHH, costos de insumos, ingresos por ventas y margen.
   * 
   * @access ADMIN, CAPATAZ (con filtro de campos gestionados)
   * @param req.params.plotId - ID de la parcela (UUID)
   * @returns PlotFinancialReportDto con todos los datos calculados
   */
  public getPlotSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { plotId } = req.params;

      // Validar que el plotId existe
      if (!plotId) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'El ID de la parcela es requerido.'
        );
      }

      // Validar formato UUID
      if (!this.isValidUUID(plotId)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'El ID de la parcela no es un UUID válido.'
        );
      }

      // Obtener el reporte del servicio
      const report = await this.reportService.getPlotFinancialReport(plotId);

      // Retornar respuesta exitosa
      res.status(StatusCodes.OK).json(report);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Método auxiliar para validar UUID
   * @param uuid String a validar
   * @returns boolean indicando si es un UUID válido
   */
  private isValidUUID(uuid: string): boolean {
    // Usamos una validación más permissiva para aceptar UUIDs como 00000000-0000-0000-0000-000000000000
    // De esta manera el endpoint delegará en el servicio la decisión de "no encontrado" (404)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
