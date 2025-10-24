import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { Input } from './input.entity';

@Entity('input_usages')
export class InputUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityUsed: number;

  @ManyToOne(() => Activity, activity => activity.inputsUsed)
  activity: Activity;

  @ManyToOne(() => Input, input => input.usages)
  input: Input;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
