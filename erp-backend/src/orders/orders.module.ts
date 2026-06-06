import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { OmiseModule } from '../omise/omise.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), TypeOrmModule.forFeature([Product]), OmiseModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
