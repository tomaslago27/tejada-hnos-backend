import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { Plot } from './plot.entity';

@Entity('harvest_lots')
export class HarvestLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plot, plot => plot.harvestLots)
  plot: Plot;

  @Column('date')
  harvestDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  grossWeightKg: number; // Peso bruto del campo

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  netWeightKg: number; // Peso neto (seco) de planta

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  yieldPercentage: number; // (neto / bruto) * 100

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
