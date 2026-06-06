import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

// 👇 1. นำเข้า OmiseService 
import { OmiseService } from '../omise/omise.service';

@Injectable()
export class OrdersService {

  constructor(
    @InjectRepository(Order) private ordersRepository: Repository<Order>, @InjectRepository(Product) private productsRepository: Repository<Product>, private omiseService: OmiseService,) { }

  async createPromptPayCharge(amount: number) {
    return this.omiseService.createPromptPayCharge(amount);
  }

  async checkChargeStatus(chargeId: string) {
    return this.omiseService.checkChargeStatus(chargeId);
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const dateString = `${year}${month}${day}`;

    const currentCount = await this.ordersRepository.count({
      where: {
        orderNumber: Like(`INV-${dateString}%`),
      },
    });

    const nextNumber = currentCount + 1;
    const runningString = String(nextNumber).padStart(4, '0');

    return `INV-${dateString}-${runningString}`;
  }

  async create(createOrderDto: CreateOrderDto) {
    console.log('🔍 กำลังตรวจสอบสต็อกสินค้า...');

    for (const item of createOrderDto.items!) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId }
      });

      if (!product) {
        console.log('ไม่พบสินค้ารหัส', item.productId, 'ในคลังสินค้า');
        throw new BadRequestException(`ไม่พบสินค้ารหัส ${item.productId} ในคลังสินค้า`);
      }

      if (product.quantity < item.quantity!) {
        console.log('สินค้า', product.name, 'มีสต็อกไม่พอ (คงเหลือ', product.quantity, 'ชิ้น แต่สั่งซื้อ', item.quantity, 'ชิ้น)');
        throw new BadRequestException(`สินค้า ${product.name} มีสต็อกไม่พอ (คงเหลือ ${product.quantity} ชิ้น แต่สั่งซื้อ ${item.quantity} ชิ้น)`);
      }
    }


    console.log('🛒 ได้รับออเดอร์ใหม่:', createOrderDto);

    const newOrderNumber = await this.generateOrderNumber();

    const orderToSave = this.ordersRepository.create({
      orderNumber: newOrderNumber,
      totalAmount: createOrderDto.totalAmount,
      paymentMethod: createOrderDto.payment!.method,
      items: createOrderDto.items!.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    const savedOrder = await this.ordersRepository.save(orderToSave);

    console.log(`✅ บันทึกบิล ${savedOrder.orderNumber} สำเร็จ!`);

    console.log('📦 กำลังเริ่มตัดสต็อกสินค้า...');

    for (const item of savedOrder.items) {
      const product = await this.productsRepository.findOne({ where: { id: item.productId }, });

      if (product) {
        product.quantity = product.quantity - item.quantity;
        await this.productsRepository.save(product);
        console.log(`✅ ตัดสต็อกรหัส ${product.id} เหลือ ${product.quantity} ชิ้น`);
      }

    }

    return {
      success: true,
      message: 'ชำระเงินสำเร็จ',
      order: savedOrder,
    };
  }

  async findAll() {
    console.log('📊 กำลังดึงประวัติการขายทั้งหมด...');

    const orders = await this.ordersRepository.find({

      relations: { items: true, },

      order: {
        createdAt: 'DESC',
      },
    });

    return {
      success: true,
      totalOrders: orders.length,
      data: orders,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  async remove(id: number) {
    return this.ordersRepository.delete(id);
  }
}