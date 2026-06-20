import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

@Entity('accounting_periods')
export class AccountingPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  year: number; // ปี ค.ศ. เช่น 2026

  @Column({ type: 'int' })
  month: number; // เดือน 1-12

  @Column({ type: 'varchar', default: PeriodStatus.OPEN })
  status: PeriodStatus;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}