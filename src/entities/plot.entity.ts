import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, OneToMany } from 'typeorm';
import { Field } from './field.entity';
import { GeoJSONPolygon } from '@/types';
import { HarvestLot } from './harvest-lot.entity';
import { WorkOrder } from './work-order.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  area: number;

  @Column({ nullable: true })
  variety: string;

  @Column({ type: 'int', nullable: true })
  yearPlanted: number;
  
  @Column('jsonb')
  location: GeoJSONPolygon;

  @ManyToOne(() => Field, field => field.plots)
  field: Field;

  @ManyToMany(() => WorkOrder, order => order.plots)
  workOrders: WorkOrder[];

  @OneToMany(() => HarvestLot, lot => lot.plot)
  harvestLots: HarvestLot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt: Date | null;
}
