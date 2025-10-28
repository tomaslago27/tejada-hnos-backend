import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from './user.entity';

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
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
}
