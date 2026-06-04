import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, }),
  TypeOrmModule.forRoot({ type: 'better-sqlite3', database: 'pos.sqlite', autoLoadEntities: true, synchronize: true, }),
    ProductsModule,
    OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
