import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field } from './field.entity';

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
  
  @Column('jsonb')
  location: { type: 'Polygon', coordinates: number[][][] };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @ManyToOne(() => Field, field => field.plots)
  field: Field;
}
