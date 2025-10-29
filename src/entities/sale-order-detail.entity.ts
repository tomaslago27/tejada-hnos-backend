import { SalesOrderDetailStatus } from '@/enums';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesOrder } from './sale-order.entity';

@Entity('sales_order_details')
export class SalesOrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  salesOrderId: string;

  @ManyToOne(() => SalesOrder, so => so.details)
  @JoinColumn({ name: 'salesOrderId' })
  salesOrder: SalesOrder;

  @Column()
  caliber: string;

  @Column()
  variety: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityKg: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  quantityShipped: number; // Cantidad Ya Enviada (Ej: 300kg)
  
  @Column({
    type: 'enum',
    enum: SalesOrderDetailStatus,
    default: SalesOrderDetailStatus.PENDIENTE
  })
  status: SalesOrderDetailStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
