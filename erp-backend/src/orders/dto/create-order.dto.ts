import { IsNumber, IsArray, IsString, ValidateNested, IsNotEmpty, IsPositive, ArrayNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';


export class OrderItemDto {
    @IsNumber()
    @IsPositive()
    productId?: number;

    @IsNumber()
    @IsPositive()
    quantity?: number;

    @IsNumber()
    price?: number;
}

export class PaymentDto {
    @IsString()
    @IsNotEmpty()
    method?: string;

    @IsNumber()
    receivedAmount?: number;

    @IsString()
    slipReference?: string;


}

export class CreateOrderDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items?: OrderItemDto[];

    @ValidateNested()
    @Type(() => PaymentDto)
    payment?: PaymentDto;

    @IsNumber()
    @Min(1)
    totalAmount?: number;
}