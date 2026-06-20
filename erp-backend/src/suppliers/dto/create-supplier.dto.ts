import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @IsNumber()
  @IsOptional()
  orderingCost?: number;

  @IsNumber()
  @IsOptional()
  creditDays?: number;
}