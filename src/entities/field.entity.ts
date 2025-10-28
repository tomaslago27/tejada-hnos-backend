import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { User } from './user.entity';
import { GeoJSONPolygon } from '@/types';

@Entity('fields')
export class Field {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  area: number;

  @Column()
  address: string;

  @Column('jsonb')
  location: GeoJSONPolygon;
  
  @OneToMany(() => Plot, plot => plot.field)
  plots: Plot[];

  @Column('uuid', { nullable: true })
  managerId: string | null;

  @ManyToOne(() => User, user => user.managedFields, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
