import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductLot } from './product-lot.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

@Entity()
export class Product {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column({ default: 0 })
  quantity: number;

  @Column()
  barcode: string;

  @Column({ nullable: true })
  image: string;

  @Column('decimal')
  costUnit: number;

  @Column({ type: 'int', default: 0 })
  safetyStock: number; 

  @Column('decimal', { default: 0 })
  holdingCostPercent: number; 

  @Column({ nullable: true })
  supplierId: number;

  @ManyToOne(() => Supplier, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @OneToMany(() => ProductLot, lot => lot.product, { cascade: true })
  lots: ProductLot[];
}