import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmiseModule } from './omise/omise.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PromotionsModule } from './promotions/promotions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, }),
  TypeOrmModule.forRoot({ type: 'better-sqlite3', database: 'pos.sqlite', autoLoadEntities: true, synchronize: true, }),
    ProductsModule,
    OrdersModule,
    OmiseModule,
    SuppliersModule,
    PromotionsModule,
    UsersModule,
    AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
