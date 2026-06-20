import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_lots')
export class ProductLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'varchar', length: 100 })
  lotNumber: string;

  @Column()
  quantity: number;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date; 

  @CreateDateColumn()
  receivedAt: Date;
}