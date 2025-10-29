import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ShipmentLotDetailDto {
  @IsUUID('4', { message: 'El ID del lote de cosecha debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del lote de cosecha no puede estar vacío' })
  harvestLotId: string;

  @IsUUID('4', { message: 'El ID del detalle de orden de venta debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del detalle de orden de venta no puede estar vacío' })
  salesOrderDetailId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad tomada debe ser un número válido' })
  @Min(0.01, { message: 'La cantidad tomada debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad tomada no puede estar vacía' })
  quantityTakenKg: number;
}

export class CreateShipmentDto {
  // salesOrderId puede venir de la URL o del body dependiendo del endpoint
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden de venta debe ser un UUID válido' })
  salesOrderId?: string;

  @IsOptional()
  @IsString({ message: 'El número de seguimiento debe ser texto' })
  trackingNumber?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;

  @IsArray({ message: 'Los detalles de lotes deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ShipmentLotDetailDto)
  lotDetails: ShipmentLotDetailDto[];
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden de venta debe ser un UUID válido' })
  salesOrderId?: string;

  @IsOptional()
  @IsString({ message: 'El número de seguimiento debe ser texto' })
  trackingNumber?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los detalles de lotes deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ShipmentLotDetailDto)
  lotDetails?: ShipmentLotDetailDto[];
}
