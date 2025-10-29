import { SalesOrderDetailStatus, SalesOrderStatus } from "@/enums";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class SalesOrderDetailDto {
  @IsString({ message: 'El calibre debe ser texto' })
  @IsNotEmpty({ message: 'El calibre no puede estar vacío' })
  caliber: string;

  @IsString({ message: 'La variedad debe ser texto' })
  @IsNotEmpty({ message: 'La variedad no puede estar vacía' })
  variety: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser un número válido' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio unitario no puede estar vacío' })
  unitPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad debe ser un número válido' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad no puede estar vacía' })
  quantityKg: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad enviada debe ser un número válido' })
  @Min(0, { message: 'La cantidad enviada no puede ser negativa' })
  quantityShipped?: number;

  @IsOptional()
  @IsEnum(SalesOrderDetailStatus, { message: 'El estado del detalle no es válido' })
  status?: SalesOrderDetailStatus;
}

export class CreateSalesOrderDto {
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del cliente no puede estar vacío' })
  customerId: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus, { message: 'El estado no es válido' })
  status?: SalesOrderStatus;

  @IsArray({ message: 'Los detalles deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => SalesOrderDetailDto)
  details: SalesOrderDetailDto[];
}

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  customerId?: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus, { message: 'El estado no es válido' })
  status?: SalesOrderStatus;

  @IsOptional()
  @IsArray({ message: 'Los detalles deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => SalesOrderDetailDto)
  details?: SalesOrderDetailDto[];
}
