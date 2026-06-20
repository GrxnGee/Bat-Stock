import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; 

  @Column({ nullable: true })
  contactPerson: string; 

  @Column({ nullable: true })
  phone: string; 

  @Column({ nullable: true })
  email: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ nullable: true })
  taxId: string; 

  @Column({ type: 'int', default: 0 })
  leadTimeDays: number; 

  @Column('decimal', { default: 0 })
  orderingCost: number;

  @Column({ type: 'int', default: 0 })
  creditDays: number; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}