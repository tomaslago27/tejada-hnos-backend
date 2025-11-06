import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGoodsReceiptDetailDto {
  @IsUUID()
  purchaseOrderDetailId: string;

  @IsNumber()
  @Min(0.01, { message: 'La cantidad recibida debe ser mayor a 0' })
  quantityReceived: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GoodsReceiptDetailResponseDto {
  id: string;
  goodsReceiptId: string;
  purchaseOrderDetailId: string;
  quantityReceived: number;
  notes?: string;
  
  // Información del insumo (expandida desde PurchaseOrderDetail)
  input?: {
    id: string;
    name: string;
    unit: string;
  };
  
  // Información de la orden (expandida desde PurchaseOrderDetail)
  orderDetail?: {
    quantityOrdered: number;
    unitPrice: number;
    totalReceived: number; // Total recibido hasta ahora (todas las recepciones)
    pending: number; // Cantidad pendiente
  };
}
