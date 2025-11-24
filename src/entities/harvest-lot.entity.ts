import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { HarvestLotStatus, WalnutCaliber } from '@/enums';
import { ShipmentLotDetail } from './shipment-lot-detail.entity';
import { Transform } from 'class-transformer';

@Entity('harvest_lots')
export class HarvestLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  plotId: string;

  @ManyToOne(() => Plot, plot => plot.harvestLots)
  @JoinColumn({ name: 'plotId' })
  plot: Plot;

  @Column('date')
  harvestDate: Date;

  @Column()
  lotCode: string;

  @Column()
  varietyName: string;

  @Column({
    type: 'enum',
    enum: WalnutCaliber,
    nullable: true
  })
  caliber: WalnutCaliber;

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string | null) => value != null ? parseFloat(value) : value,
  }})
   @Transform(({ value }) => value != null ? parseFloat(value) : value, { toPlainOnly: true })
  grossWeightKg: number; // Peso bruto del campo

  @Column('decimal', { precision: 10, scale: 2, nullable: true, transformer: {
     to: (value: number | null) => value,
    from: (value: string | null) => value != null ? parseFloat(value) : null,
  }})
  @Transform(({ value }) => value != null ? parseFloat(value) : value, { toPlainOnly: true })
  netWeightKg: number; // Peso neto (seco) de planta

  @Column('decimal', { precision: 10, scale: 2, nullable: true, transformer: {
     to: (value: number | null) => value,
    from: (value: string | null) => value != null ? parseFloat(value) : null,
  }})
  @Transform(({ value }) => value != null ? parseFloat(value) : null, { toPlainOnly: true })
  remainingNetWeightKg: number; // Peso neto disponible (decrece con envíos)

  @Column('decimal', { precision: 5, scale: 2, nullable: true, transformer: {
    to: (value: number | null) => value,
    from: (value: string | null) => value != null ? parseFloat(value) : null,
  }})
  @Transform(({ value }) => value != null ? parseFloat(value) : null, { toPlainOnly: true })
  yieldPercentage: number; // (neto / bruto) * 100

  @Column({
    type: 'enum',
    enum: HarvestLotStatus,
    default: HarvestLotStatus.PENDIENTE_PROCESO
  })
  status: HarvestLotStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => ShipmentLotDetail, detail => detail.harvestLot)
  shipmentDetails: ShipmentLotDetail[];
}
