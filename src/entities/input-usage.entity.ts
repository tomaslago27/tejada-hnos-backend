import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { Input } from './input.entity';
import { Transform } from 'class-transformer';

@Entity('input_usages')
export class InputUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  quantityUsed: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  historicCostPerUnit: number; // Precio del insumo al momento de la transacción (para precisión histórica)

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
