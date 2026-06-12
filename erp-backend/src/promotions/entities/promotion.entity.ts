import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  discountType: 'PERCENTAGE' | 'FIXED';

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number; 

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  minimumPurchase: number;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date; 

  @Column({ type: 'datetime', nullable: true })
  endDate: Date; 

  @Column({ default: true })
  isActive: boolean; 

  @Column({ type: 'int', nullable: true })
  applicableProductId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isAutoApply: boolean;
}