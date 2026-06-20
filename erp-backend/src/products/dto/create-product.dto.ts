import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateProductDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    barcode: string;
    
    @IsOptional()
    @IsString()
    image?: string;

    @IsNotEmpty()
    @IsNumber()
    costUnit: number;

    @IsNotEmpty()
    @IsNumber()
    safetyStock: number;

    @IsNotEmpty()
    @IsNumber()
    holdingCostPercent: number;

    @IsOptional()
    @IsNumber()
    supplierId?: number;

}