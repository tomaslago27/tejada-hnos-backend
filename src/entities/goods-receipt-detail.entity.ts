import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { GoodsReceipt } from "./goods-receipt.entity";
import { PurchaseOrderDetail } from "./purchase-order-detail.entity";

@Entity('goods_receipt_details')
export class GoodsReceiptDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  goodsReceiptId: string;

  @ManyToOne(() => GoodsReceipt, receipt => receipt.details)
  @JoinColumn({ name: 'goodsReceiptId' })
  goodsReceipt: GoodsReceipt;

  @Column('uuid')
  purchaseOrderDetailId: string;

  @ManyToOne(() => PurchaseOrderDetail, detail => detail.receiptDetails)
  @JoinColumn({ name: 'purchaseOrderDetailId' })
  purchaseOrderDetail: PurchaseOrderDetail;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityReceived: number; // Cantidad recibida en este remito

  @Column('text', { nullable: true })
  notes: string; // Notas específicas de este insumo (ej: "Llegó con embalaje dañado")
}
