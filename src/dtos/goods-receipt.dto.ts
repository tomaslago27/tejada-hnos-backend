import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateGoodsReceiptDto {
  @IsUUID('4', { message: 'El ID de la orden de compra debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la orden de compra no puede estar vacío' })
  purchaseOrderId: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;

  // receivedById se tomará del usuario autenticado
}

export class UpdateGoodsReceiptDto {
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;
}
