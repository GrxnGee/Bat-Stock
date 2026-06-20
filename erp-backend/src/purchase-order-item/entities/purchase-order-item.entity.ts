import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, po => po.items, { onDelete: 'CASCADE' })
  purchaseOrder: PurchaseOrder;

  @Column()
  productId: number;

  @Column()
  quantity: number;

  @Column('decimal')
  unitCost: number; 

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;
}