import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Input } from "./input.entity";
import { PurchaseOrder } from "./purchase-order.entity";
import { GoodsReceiptDetail } from "./goods-receipt-detail.entity";

@Entity('purchase_order_details')
export class PurchaseOrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, po => po.details)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column('uuid')
  inputId: string;

  @ManyToOne(() => Input, input => input.purchaseOrderDetails)
  @JoinColumn({ name: 'inputId' })
  input: Input;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // Cantidad pedida

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number; // Precio de compra

  @OneToMany(() => GoodsReceiptDetail, detail => detail.purchaseOrderDetail)
  receiptDetails: GoodsReceiptDetail[];

  // Método virtual para calcular cantidad recibida
  get quantityReceived(): number {
    if (!this.receiptDetails || this.receiptDetails.length === 0) {
      return 0;
    }
    return this.receiptDetails.reduce((sum, detail) => sum + Number(detail.quantityReceived), 0);
  }

  // Método virtual para calcular cantidad pendiente
  get quantityPending(): number {
    return Number(this.quantity) - this.quantityReceived;
  }

  // Método virtual para verificar si está completamente recibido
  get isFullyReceived(): boolean {
    return this.quantityPending <= 0;
  }
}
