import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, OneToMany, JoinColumn } from 'typeorm';
import { Field } from './field.entity';
import { GeoJSONPolygon } from '@/types';
import { HarvestLot } from './harvest-lot.entity';
import { WorkOrder } from './work-order.entity';
import { Variety } from './variety.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  area: number;

  @Column('uuid', { nullable: true })
  varietyId: string;

  @ManyToOne(() => Variety, variety => variety.plots)
  @JoinColumn({ name: 'varietyId' })
  variety: Variety;

  @Column({ type: 'date', nullable: true })
  datePlanted: Date;

  @Column('jsonb')
  location: GeoJSONPolygon;

  @Column('uuid')
  fieldId: string;

  @ManyToOne(() => Field, field => field.plots)
  @JoinColumn({ name: 'fieldId' })
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
