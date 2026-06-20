import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource, EntityManager, MoreThan } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductLot } from '../products/entities/product-lot.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OmiseService } from '../omise/omise.service';

// 🌟 Import บัญชี
import { AccountingService } from '../accounting/accounting.service';
import { LedgerType } from '../accounting/entities/ledger.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private ordersRepository: Repository<Order>, 
    @InjectRepository(Product) private productsRepository: Repository<Product>, 
    private omiseService: OmiseService, 
    private dataSource: DataSource,
    private accountingService: AccountingService 
  ) { }

  async createPromptPayCharge(amount: number) {
    return this.omiseService.createPromptPayCharge(amount);
  }

  async checkChargeStatus(chargeId: string) {
    return this.omiseService.checkChargeStatus(chargeId);
  }

  private async generateOrderNumber(manager: EntityManager): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;

    const currentCount = await manager.count(Order, {
      where: { orderNumber: Like(`INV-${dateString}%`) },
    });
    const nextNumber = currentCount + 1;
    const runningString = String(nextNumber).padStart(4, '0');
    return `INV-${dateString}-${runningString}`;
  }

  async create(createOrderDto: CreateOrderDto) {

    await this.accountingService.validatePeriodIsOpen(new Date());

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of createOrderDto.items!) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: item.productId } });
        if (!product) throw new BadRequestException(`ไม่พบสินค้ารหัส ${item.productId} ในคลังสินค้า`);
        if (product.quantity < item.quantity!) throw new BadRequestException(`สินค้า "${product.name}" หมดหรือสต็อกไม่พอ`);
      }

      for (const item of createOrderDto.items!) {
        const updateResult = await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({ quantity: () => `quantity - ${item.quantity}` }) 
          .where('id = :id AND quantity >= :reqQty', { id: item.productId, reqQty: item.quantity }) 
          .execute();

        if (updateResult.affected === 0) {
          const p = await this.productsRepository.findOne({ where: { id: item.productId } });
          throw new BadRequestException(`ขออภัย! สินค้า "${p?.name || 'รหัส ' + item.productId}" เพิ่งถูกทำรายการไป สต็อกไม่พอ`);
        }

        const availableLots = await queryRunner.manager.find(ProductLot, {
            where: { productId: item.productId, quantity: MoreThan(0) }, 
            order: { expirationDate: { direction: 'ASC', nulls: 'LAST' }, receivedAt: 'ASC' }
        });

        let remainingQty = item.quantity!;
        for (const lot of availableLots) {
            if (remainingQty <= 0) break; 
            if (lot.quantity >= remainingQty) {
                lot.quantity -= remainingQty;
                remainingQty = 0;
            } else {
                remainingQty -= lot.quantity;
                lot.quantity = 0;
            }
            await queryRunner.manager.save(ProductLot, lot);
        }
      }

      // 🌟 คำนวณ VAT (ใช้ || 0 เพื่อแก้ Error undefined ของ TypeScript)
      const vatRate = Number(process.env.DEFAULT_VAT_RATE) || 7;
      const totalAmount = createOrderDto.totalAmount || 0; 
      const vatAmount = Number((totalAmount * vatRate / (100 + vatRate)).toFixed(2));
      const subTotal = Number((totalAmount - vatAmount).toFixed(2));
      
      const newOrderNumber = await this.generateOrderNumber(queryRunner.manager);

      const orderToSave = queryRunner.manager.create(Order, {
        orderNumber: newOrderNumber,
        totalAmount: totalAmount,
        subTotal: subTotal,
        vatAmount: vatAmount,
        paymentMethod: createOrderDto.payment!.method,
        items: createOrderDto.items!.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      const savedOrder = await queryRunner.manager.save(Order, orderToSave);

      await this.accountingService.recordTransactionDirect(
        queryRunner.manager,
        LedgerType.INCOME,
        new Date(),
        savedOrder.orderNumber,
        subTotal,
        vatAmount,
        0, 
        totalAmount,
        'รายรับจากการขาย POS'
      );

      await queryRunner.commitTransaction();
      console.log(`✅ บันทึกบิล ${savedOrder.orderNumber} ตัดสต็อก และลงสมุดบัญชีสำเร็จ!`);
      return { success: true, message: 'ชำระเงินและลงบัญชีสำเร็จ', order: savedOrder };

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาด! ทำการ Rollback ยกเลิกบิลและคืนสต็อกทั้งหมด...');
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const orders = await this.ordersRepository.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
    return { success: true, totalOrders: orders.length, data: orders };
  }

  findOne(id: number) { return `This action returns a #${id} order`; }
  update(id: number, updateOrderDto: UpdateOrderDto) { return `This action updates a #${id} order`; }
  async remove(id: number) { return this.ordersRepository.delete(id); }
}