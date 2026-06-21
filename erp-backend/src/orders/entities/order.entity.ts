import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';


@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderNumber: string;

  @Column('decimal', { default: 0 })
  subTotal: number;

  @Column('decimal', { default: 0 })
  vatAmount: number;

  @Column('decimal', { default: 0 })
  discountAmount: number; 

  @Column({ nullable: true })
  promoCode: string;

  @Column('decimal')
  totalAmount: number;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerTaxId: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column()
  paymentMethod: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];
}