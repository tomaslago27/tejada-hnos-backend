import { Entity, PrimaryGeneratedColumn,ManyToOne , Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { User } from './user.entity';

@Entity('fields')
export class Field {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Plot, plot => plot.field)
  plots: Plot[];
  //PREGUNTAR SI ESTE CAMBIO ES NECESARIO -- SE MODIFICA EL MODELO DE USER TAMBIEN
    @ManyToOne(() => User, user => user.fields)
  user: User
}
