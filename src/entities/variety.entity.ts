import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Plot } from './plot.entity';

@Entity('varieties')
export class Variety {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => Plot, plot => plot.variety)
  plots: Plot[];
}
