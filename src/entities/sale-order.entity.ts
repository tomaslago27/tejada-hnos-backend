import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Shipment } from './shipment.entity';
import { SalesOrderDetail } from './sale-order-detail.entity';
import { SalesOrderStatus } from '@/enums';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.PENDIENTE,
  })
  status: SalesOrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.salesOrders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => SalesOrderDetail, detail => detail.salesOrder, { cascade: true })
  details: SalesOrderDetail[];

  @OneToMany(() => Shipment, shipment => shipment.salesOrder)
  shipments: Shipment[];
}
