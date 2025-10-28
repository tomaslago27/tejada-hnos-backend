import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HarvestLot } from './harvest-lot.entity';
import { Shipment } from './shipment.entity';
import { SalesOrderDetail } from './sale-order-detail.entity';

@Entity('shipment_lot_details')
export class ShipmentLotDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityTakenKg: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column('uuid')
  shipmentId: string;

  @ManyToOne(() => Shipment, shipment => shipment.lotDetails)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column('uuid')
  harvestLotId: string;

  @ManyToOne(() => HarvestLot, harvestLot => harvestLot.shipmentDetails)
  @JoinColumn({ name: 'harvestLotId' })
  harvestLot: HarvestLot;

  @Column('uuid')
  salesOrderDetailId: string;

  @ManyToOne(() => SalesOrderDetail)
  @JoinColumn({ name: 'salesOrderDetailId' })
  salesOrderDetail: SalesOrderDetail
}
