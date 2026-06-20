import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';


export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MASTER = 'MASTER',
  CASHIER = 'CASHIER',
  STOCK_ADMIN = 'STOCK_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; 

  @Column()
  name: string; 

  @Column({
    type: 'varchar',
    default: UserRole.CASHIER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}