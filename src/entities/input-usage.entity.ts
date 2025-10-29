import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { Input } from './input.entity';

@Entity('input_usages')
export class InputUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityUsed: number;

  @Column('uuid')
  activityId: string;

  @ManyToOne(() => Activity, activity => activity.inputsUsed)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column('uuid')
  inputId: string;

  @ManyToOne(() => Input, input => input.usages)
  @JoinColumn({ name: 'inputId' })
  input: Input;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
