import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PurchaseOrderItem } from '../../purchase-order-item/entities/purchase-order-item.entity';

export enum POStatus { PENDING = 'PENDING', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export enum PaymentType { CASH = 'CASH', CREDIT = 'CREDIT' }
export enum PaymentStatus { UNPAID = 'UNPAID', PARTIAL = 'PARTIAL', PAID = 'PAID' }

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  poNumber: string; 

  @Column()
  supplierId: number; 

  @Column({ type: 'varchar', default: POStatus.PENDING })
  status: POStatus;

  @Column('decimal', { default: 0 })
  subTotal: number;

  @Column('decimal', { default: 0 })
  vatAmount: number;

  // 🌟 เพิ่มคอลัมน์เก็บอัตราหัก ณ ที่จ่าย (%)
  @Column('decimal', { default: 0 })
  whtRate: number;

  @Column('decimal', { default: 0 })
  whtAmount: number;

  @Column('decimal')
  totalAmount: number;

  @Column({ nullable: true })
  expectedDeliveryDate: Date; 

  @Column({ type: 'varchar', default: PaymentType.CASH })
  paymentType: PaymentType;

  @Column({ type: 'varchar', default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  dueDate: Date; 

  @Column({ nullable: true })
  supplierTaxInvoiceNo: string;

  @Column({ nullable: true })
  supplierTaxInvoiceDate: Date;

  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}