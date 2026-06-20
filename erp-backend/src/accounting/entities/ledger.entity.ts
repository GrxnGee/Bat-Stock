import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum LedgerType {
  INCOME = 'INCOME',  
  EXPENSE = 'EXPENSE'
}

@Entity('general_ledger')
export class GeneralLedger {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  type: LedgerType;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column()
  referenceDocument: string;

  @Column('decimal')
  subTotal: number; 

  @Column('decimal', { default: 0 })
  vatAmount: number; 

  @Column('decimal', { default: 0 })
  whtAmount: number;

  @Column('decimal')
  netAmount: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}