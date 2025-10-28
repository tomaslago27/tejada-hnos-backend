import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ShipmentLotDetail } from './shipment-lot-detail.entity';
import { SalesOrder } from './sale-order.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  salesOrderId: string;

  @ManyToOne(() => SalesOrder, so => so.shipments)
  @JoinColumn({ name: 'salesOrderId' })
  salesOrder: SalesOrder;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  shipmentDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ShipmentLotDetail, lotDetail => lotDetail.shipment)
  lotDetails: ShipmentLotDetail[];
}
