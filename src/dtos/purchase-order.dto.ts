import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PurchaseOrderStatus } from "@/enums";

export class PurchaseOrderDetailDto {
  @IsUUID('4', { message: 'El ID del insumo debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del insumo no puede estar vacío' })
  inputId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad debe ser un número válido' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad no puede estar vacía' })
  quantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser un número válido' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  unitPrice?: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del proveedor no puede estar vacío' })
  supplierId: string;

  @IsArray({ message: 'Los detalles deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details: PurchaseOrderDetailDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  supplierId?: string;

  @IsOptional()
  @IsArray({ message: 'Los detalles deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details?: PurchaseOrderDetailDto[];
}

export class PurchaseOrderDetailPriceDto {
  @IsUUID('4', { message: 'El ID del insumo debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del insumo no puede estar vacío' })
  inputId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser un número válido' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio unitario no puede estar vacío' })
  unitPrice: number;
}

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus, { message: 'El estado debe ser un valor válido del enum PurchaseOrderStatus' })
  @IsNotEmpty({ message: 'El estado no puede estar vacío' })
  status: PurchaseOrderStatus;

  @IsOptional()
  @IsArray({ message: 'Los precios deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailPriceDto)
  details?: PurchaseOrderDetailPriceDto[];
}
