import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Plot } from "./plot.entity";
import { Activity } from "./activity.entity";
import { WorkOrderStatus } from "@/enums";

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('timestamp')
  scheduledDate: Date;

  @Column('timestamp')
  dueDate: Date;

  @Column('timestamp', { nullable: true })
  completedDate: Date | null;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status: WorkOrderStatus;

  @ManyToOne(() => User, user => user.assignedWorkOrders, { nullable: true })
  assignedTo: User | null;

  @ManyToMany(() => Plot, plot => plot.workOrders)
  @JoinTable({ name: 'work_order_plots' })
  plots: Plot[];

  @OneToMany(() => Activity, activity => activity.workOrder, { cascade: true })
  activities: Activity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
