import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PurchaseOrder } from "./purchase-order.entity";

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => PurchaseOrder, order => order.supplier)
  purchaseOrders: PurchaseOrder[];
}
