import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Input } from "./input.entity";
import { PurchaseOrder } from "./purchase-order.entity";

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
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number; // Precio de compra
}
