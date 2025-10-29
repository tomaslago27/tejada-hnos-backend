import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PurchaseOrderDetailDto {
  @IsUUID('4', { message: 'El ID del insumo debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del insumo no puede estar vacío' })
  inputId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad debe ser un número válido' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad no puede estar vacía' })
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser un número válido' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio unitario no puede estar vacío' })
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del proveedor no puede estar vacío' })
  supplierId: string;

  @IsString({ message: 'El estado debe ser texto' })
  @IsNotEmpty({ message: 'El estado no puede estar vacío' })
  status: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto total debe ser un número válido' })
  @Min(0, { message: 'El monto total no puede ser negativo' })
  @IsNotEmpty({ message: 'El monto total no puede estar vacío' })
  totalAmount: number;

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
  @IsString({ message: 'El estado debe ser texto' })
  status?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto total debe ser un número válido' })
  @Min(0, { message: 'El monto total no puede ser negativo' })
  totalAmount?: number;

  @IsOptional()
  @IsArray({ message: 'Los detalles deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details?: PurchaseOrderDetailDto[];
}
