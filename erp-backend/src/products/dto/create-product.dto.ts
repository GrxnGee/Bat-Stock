import { IsNumber, IsNotEmpty, IsString } from 'class-validator';


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
    @IsString()
    image?: string;

    @IsNotEmpty()
    @IsNumber()
    costUnit: number;

}
