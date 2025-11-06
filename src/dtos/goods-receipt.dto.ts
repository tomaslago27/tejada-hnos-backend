import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class GoodsReceiptDetailDto {
  @IsUUID('4', { message: 'El detalle de la orden debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El detalle de la orden es obligatorio' })
  purchaseOrderDetailId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad recibida debe ser numérica' })
  @Min(0.01, { message: 'La cantidad recibida debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad recibida es obligatoria' })
  quantityReceived: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;
}

export class CreateGoodsReceiptDto {
  @IsUUID('4', { message: 'La orden de compra debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La orden de compra es obligatoria' })
  purchaseOrderId: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;

  @IsArray({ message: 'Los detalles deben ser un arreglo' })
  @ValidateNested({ each: true, message: 'Los detalles deben ser válidos' })
  @Type(() => GoodsReceiptDetailDto)
  details: GoodsReceiptDetailDto[];
}
