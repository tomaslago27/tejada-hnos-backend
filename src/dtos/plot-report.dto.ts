import { IsString, IsNumber, IsISO8601, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para representar el detalle de una actividad en el reporte financiero
 */
export class ActivityReportItemDto {
  @IsString()
  id: string;

  @IsISO8601()
  date: string; // ISO String - Fecha de ejecución de la actividad

  @IsString()
  type: string; // Tipo de actividad (PODA, RIEGO, APLICACION, etc.)

  @IsString()
  description: string; // Descripción de la actividad

  @IsNumber()
  cost: number; // Costo total de la actividad (labor + insumos)

  // Campos opcionales para desglose detallado (compatibilidad futura con frontend)
  @IsOptional()
  @IsNumber()
  laborCost?: number; // Costo de mano de obra (hoursWorked × hourlyRate)

  @IsOptional()
  @IsNumber()
  inputsCost?: number; // Costo de insumos utilizados en esta actividad

  @IsOptional()
  @IsNumber()
  hoursWorked?: number; // Horas trabajadas en la actividad

  @IsOptional()
  @IsNumber()
  hourlyRate?: number; // Tarifa por hora del trabajador

  @IsOptional()
  @IsString()
  workerName?: string; // Nombre del trabajador asignado
}

/**
 * DTO para el desglose de costos en el reporte financiero
 */
export class CostsBreakdownDto {
  @IsNumber()
  labor: number; // Costo total de mano de obra (RRHH)

  @IsNumber()
  inputs: number; // Costo total de insumos
}

/**
 * DTO principal para la respuesta del reporte financiero de una parcela
 * 
 * Este DTO cumple con la estructura solicitada por el frontend:
 * - plotName: Nombre de la parcela
 * - totalCosts: Costos totales (labor + inputs)
 * - totalRevenue: Ingresos totales por ventas
 * - margin: Margen (ingresos - costos)
 * - costsBreakdown: Desglose de costos para gráfico de torta
 * - activities: Array de actividades para tabla de detalles
 */
export class PlotFinancialReportDto {
  @IsString()
  plotName: string; // Nombre de la parcela

  @IsNumber()
  totalCosts: number; // Costos totales (labor + insumos)

  @IsNumber()
  totalRevenue: number; // Ingresos totales por ventas

  @IsNumber()
  margin: number; // Margen de ganancia (totalRevenue - totalCosts)

  @ValidateNested()
  @Type(() => CostsBreakdownDto)
  costsBreakdown: CostsBreakdownDto; // Desglose de costos para gráfico

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityReportItemDto)
  activities: ActivityReportItemDto[]; // Lista de actividades con sus costos

  // Campos opcionales para futuras extensiones del reporte
  @IsOptional()
  @IsString()
  plotId?: string; // ID de la parcela

  @IsOptional()
  @IsString()
  fieldName?: string; // Nombre del campo al que pertenece la parcela

  @IsOptional()
  @IsNumber()
  plotArea?: number; // Área de la parcela (hectáreas)

  @IsOptional()
  @IsString()
  varietyName?: string; // Variedad cultivada en la parcela

  @IsOptional()
  @IsNumber()
  costPerHectare?: number; // Costo por hectárea (totalCosts / plotArea)

  @IsOptional()
  @IsNumber()
  revenuePerHectare?: number; // Ingreso por hectárea (totalRevenue / plotArea)

  @IsOptional()
  @IsNumber()
  marginPercentage?: number; // Margen porcentual ((margin / totalRevenue) * 100)

  @IsOptional()
  @IsNumber()
  totalHarvestKg?: number; // Total cosechado en kg

  @IsOptional()
  @IsNumber()
  totalShippedKg?: number; // Total enviado/vendido en kg

  @IsOptional()
  @IsString()
  reportGeneratedAt?: string; // Fecha de generación del reporte (ISO)

  @IsOptional()
  @IsString()
  currency?: string; // Moneda (ej: "USD", "ARS")
}
