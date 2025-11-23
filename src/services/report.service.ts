import { DataSource, Repository } from 'typeorm';
import { Plot } from '@entities/plot.entity';
import { Activity } from '@entities/activity.entity';
import { HarvestLot } from '@entities/harvest-lot.entity';
import { WorkOrder } from '@entities/work-order.entity';
import { PlotFinancialReportDto, ActivityReportItemDto, CostsBreakdownDto } from '@dtos/plot-report.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

/**
 * Servicio de Reportes - Business Intelligence
 * 
 * Este servicio implementa el endpoint más importante del sistema:
 * GET /api/reports/plot-summary/:plotId
 * 
 * Calcula:
 * - Costos de RRHH (Activities × hoursWorked × User.hourlyRate)
 * - Costos de Insumos (InputUsage × quantityUsed × historicCostPerUnit)
 * - Ingresos (ShipmentLotDetail × quantityTakenKg × SalesOrderDetail.unitPrice)
 */
export class ReportService {
  private plotRepository: Repository<Plot>;
  private activityRepository: Repository<Activity>;
  private harvestLotRepository: Repository<HarvestLot>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.plotRepository = dataSource.getRepository(Plot);
    this.activityRepository = dataSource.getRepository(Activity);
    this.harvestLotRepository = dataSource.getRepository(HarvestLot);
  }

  /**
   * Obtener el reporte financiero completo de una parcela
   * 
   * @param plotId ID de la parcela
   * @returns PlotFinancialReportDto con todos los cálculos de costos, ingresos y margen
   */
  public async getPlotFinancialReport(plotId: string): Promise<PlotFinancialReportDto> {
    // 1. Validar que la parcela existe y obtener información básica
    const plot = await this.plotRepository.findOne({
      where: { id: plotId },
      relations: ['field', 'variety']
    });

    if (!plot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        `La parcela con ID ${plotId} no fue encontrada.`
      );
    }

    // 2. CALCULAR COSTOS DE RRHH (Mano de Obra)
    // Obtener todas las actividades relacionadas a esta parcela a través de WorkOrders
    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.workOrder', 'workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'user')
      .leftJoinAndSelect('workOrder.plots', 'plots')
      .leftJoinAndSelect('activity.inputsUsed', 'inputsUsed')
      .leftJoinAndSelect('inputsUsed.input', 'input')
      .where('plots.id = :plotId', { plotId })
      .orderBy('activity.executionDate', 'DESC')
      .getMany();

    let totalLaborCost = 0;
    let totalInputsCost = 0;
    const activityDetails: ActivityReportItemDto[] = [];

    // Procesar cada actividad para calcular costos
    for (const activity of activities) {
      // Calcular costo de mano de obra para esta actividad
      const hourlyRate = Number(activity.workOrder.assignedTo?.hourlyRate || 0);
      const hoursWorked = Number(activity.hoursWorked || 0);
      const laborCost = hoursWorked * hourlyRate;

      // Calcular costo de insumos para esta actividad
      let activityInputsCost = 0;
      for (const inputUsage of activity.inputsUsed) {
        const historicCost = Number(inputUsage.historicCostPerUnit || 0);
        const quantityUsed = Number(inputUsage.quantityUsed || 0);
        const inputCost = quantityUsed * historicCost;
        activityInputsCost += inputCost;
      }

      // Acumular totales
      totalLaborCost += laborCost;
      totalInputsCost += activityInputsCost;

      // Crear detalle de la actividad para el array
      const workerName = activity.workOrder.assignedTo
        ? `${activity.workOrder.assignedTo.name} ${activity.workOrder.assignedTo.lastName}`
        : 'Sin asignar';

      activityDetails.push({
        id: activity.id,
        date: activity.executionDate.toISOString(),
        type: activity.type,
        description: `${activity.type} - ${hoursWorked}h @ $${hourlyRate.toFixed(2)}/h${
          activityInputsCost > 0 ? ` + Insumos: $${activityInputsCost.toFixed(2)}` : ''
        }`,
        cost: laborCost + activityInputsCost,
        // Campos opcionales para desglose detallado
        laborCost: laborCost,
        inputsCost: activityInputsCost,
        hoursWorked: hoursWorked,
        hourlyRate: hourlyRate,
        workerName: workerName,
      });
    }

    // 3. CALCULAR INGRESOS (Revenue)
    // Obtener todos los lotes de cosecha de esta parcela con sus envíos
    const harvestLots = await this.harvestLotRepository
      .createQueryBuilder('harvestLot')
      .leftJoinAndSelect('harvestLot.shipmentDetails', 'shipmentDetails')
      .leftJoinAndSelect('shipmentDetails.salesOrderDetail', 'salesOrderDetail')
      .where('harvestLot.plotId = :plotId', { plotId })
      .getMany();

    let totalRevenue = 0;
    let totalHarvestKg = 0;
    let totalShippedKg = 0;

    for (const lot of harvestLots) {
      // Acumular peso cosechado
      totalHarvestKg += Number(lot.grossWeightKg || 0);

      // Calcular ingresos por envíos de este lote
      for (const shipmentDetail of lot.shipmentDetails) {
        const quantityKg = Number(shipmentDetail.quantityTakenKg || 0);
        const unitPrice = Number(shipmentDetail.salesOrderDetail?.unitPrice || 0);
        const revenue = quantityKg * unitPrice;

        totalRevenue += revenue;
        totalShippedKg += quantityKg;
      }
    }

    // 4. CALCULAR TOTALES Y MARGEN
    const totalCosts = totalLaborCost + totalInputsCost;
    const margin = totalRevenue - totalCosts;
    const marginPercentage = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    // Calcular métricas por hectárea si hay área definida
    const plotArea = Number(plot.area || 0);
    const costPerHectare = plotArea > 0 ? totalCosts / plotArea : 0;
    const revenuePerHectare = plotArea > 0 ? totalRevenue / plotArea : 0;

    // 5. CONSTRUIR Y RETORNAR REPORTE
    const report: PlotFinancialReportDto = {
      // Campos obligatorios (solicitados por frontend)
      plotName: plot.name,
      totalCosts: Number(totalCosts.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      margin: Number(margin.toFixed(2)),
      
      // Desglose de costos para gráfico de torta
      costsBreakdown: {
        labor: Number(totalLaborCost.toFixed(2)),
        inputs: Number(totalInputsCost.toFixed(2)),
      },
      
      // Array de actividades para tabla de detalles
      activities: activityDetails,

      // Campos opcionales para extensibilidad futura
      plotId: plot.id,
      fieldName: plot.field?.name,
      plotArea: plotArea,
      varietyName: plot.variety?.name,
      costPerHectare: Number(costPerHectare.toFixed(2)),
      revenuePerHectare: Number(revenuePerHectare.toFixed(2)),
      marginPercentage: Number(marginPercentage.toFixed(2)),
      totalHarvestKg: Number(totalHarvestKg.toFixed(2)),
      totalShippedKg: Number(totalShippedKg.toFixed(2)),
      reportGeneratedAt: new Date().toISOString(),
      currency: 'USD', // Puedes hacer esto configurable
    };

    return report;
  }

  /**
   * Método auxiliar para validar UUID
   * @param uuid String a validar
   * @returns boolean indicando si es un UUID válido
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
