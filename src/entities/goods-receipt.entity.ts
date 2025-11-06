import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from './user.entity';
import { GoodsReceiptDetail } from './goods-receipt-detail.entity';

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  notes: string;

  // Fecha de recepción - puede ser especificada o usar la fecha actual
  // Se guarda como TIMESTAMP en UTC
  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  receivedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column('uuid')
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, purchaseOrder => purchaseOrder.receipts)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column('uuid')
  receivedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receivedById' })
  receivedBy: User;

  @OneToMany(() => GoodsReceiptDetail, detail => detail.goodsReceipt, { cascade: true })
  details: GoodsReceiptDetail[];
}
