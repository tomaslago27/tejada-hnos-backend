import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { User } from './user.entity';
import { ActivityType } from '@/enums';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column('text')
  description: string;
  
  @Column('timestamp')
  executionDate: Date;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Plot)
  plot: Plot;

  @ManyToOne(() => User)
  createdByUser: User;
}
