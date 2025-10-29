import { UserRole } from '@/enums';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Field } from './field.entity';
import { WorkOrder } from './work-order.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OPERARIO,
  })
  role: UserRole;

  @Column({ select: false })
  passwordHash: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  hourlyRate: number; // Costo por hora para reportes

  @OneToMany(() => WorkOrder, order => order.assignedTo)
  assignedWorkOrders: WorkOrder[];

  @OneToMany(() => Field, field => field.manager)
  managedFields: Field[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
