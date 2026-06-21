import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion) private promotionsRepository: Repository<Promotion>,) { }

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    try {
      const newPromo = this.promotionsRepository.create(createPromotionDto);
      return await this.promotionsRepository.save(newPromo);
    } catch (error : any) {

      if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT' || error.message.includes('unique')) {
        throw new BadRequestException('รหัสโค้ดส่วนลดนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
      }

      throw new InternalServerErrorException('เกิดข้อผิดพลาดที่ฐานข้อมูล: ' + error.message);
    }
  }
  async findAll(): Promise<Promotion[]> {
    return await this.promotionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Promotion> {
    const promo = await this.promotionsRepository.findOne({ where: { id } });
    if (!promo) throw new NotFoundException(`ไม่พบโปรโมชั่นรหัส ${id}`);
    return promo;
  }

  // ยอดรวม
  async validateCode(code: string, cart: any[]): Promise<any> {
    const promo = await this.promotionsRepository.findOne({ where: { code } });

    if (!promo) throw new BadRequestException('ไม่พบโค้ดส่วนลดนี้ในระบบ');
    if (!promo.isActive) throw new BadRequestException('โค้ดส่วนลดนี้ถูกระงับการใช้งาน');

    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) throw new BadRequestException('โค้ดส่วนลดนี้ยังไม่ถึงเวลาเริ่มใช้งาน');
    if (promo.endDate && new Date(promo.endDate) < now) throw new BadRequestException('โค้ดส่วนลดนี้หมดอายุแล้ว');

    // คำนวณยอดรวมทั้งบิล
    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountableAmount = totalAmount;

    if (promo.applicableProductId) {
      const targetItem = cart.find(item => item.productId === promo.applicableProductId);
      if (!targetItem) {
        throw new BadRequestException('โค้ดส่วนลดนี้ใช้ได้กับสินค้าที่กำหนดเท่านั้น');
      }
      discountableAmount = targetItem.price * targetItem.quantity;
    }

    if (discountableAmount < promo.minimumPurchase) {
      throw new BadRequestException(`ต้องมียอดซื้อขั้นต่ำ ฿${promo.minimumPurchase} จึงจะใช้โค้ดนี้ได้`);
    }

    let discountAmount = 0;
    if (promo.discountType === 'FIXED') {
      discountAmount = Number(promo.discountValue);
    } else if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (discountableAmount * Number(promo.discountValue)) / 100;
    }

    if (discountAmount > totalAmount) discountAmount = totalAmount;

    return {
      success: true,
      code: promo.code,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      applicableProductId: promo.applicableProductId,
      calculatedDiscount: discountAmount,
      netTotal: totalAmount - discountAmount
    };
  }

  async checkAutoPromotions(cart: any[]): Promise<any> {
    if (!cart || cart.length === 0) return null;

    const now = new Date();

    // ดึงเฉพาะโปรโมชั่นที่เปิดใช้งาน และติ๊กเป็น "ทำงานอัตโนมัติ"
    const autoPromos = await this.promotionsRepository.find({
      where: { isActive: true, isAutoApply: true }
    });

    let bestPromo: Promotion | null = null;
    let maxDiscount = 0;

    for (const promo of autoPromos) {
      if (promo.startDate && new Date(promo.startDate) > now) continue;
      if (promo.endDate && new Date(promo.endDate) < now) continue;

      let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let discountableAmount = totalAmount;

      if (promo.applicableProductId) {
        const targetItem = cart.find(item => item.productId === promo.applicableProductId);
        if (!targetItem) continue;
        discountableAmount = targetItem.price * targetItem.quantity;
      }

      if (discountableAmount < promo.minimumPurchase) continue;

      let discountAmount = 0;
      if (promo.discountType === 'FIXED') discountAmount = Number(promo.discountValue);
      else discountAmount = (discountableAmount * Number(promo.discountValue)) / 100;

      if (discountAmount > totalAmount) discountAmount = totalAmount;

      // คัดเลือกโปรโมชั่นที่ให้ส่วนลดสูงที่สุด
      if (discountAmount > maxDiscount) {
        maxDiscount = discountAmount;
        bestPromo = promo;
      }
    }

    if (!bestPromo) return null;

    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      success: true,
      code: bestPromo.code,
      name: bestPromo.name,
      discountType: bestPromo.discountType,
      discountValue: bestPromo.discountValue,
      applicableProductId: bestPromo.applicableProductId,
      calculatedDiscount: maxDiscount,
      netTotal: totalAmount - maxDiscount,
      isAutoApply: true
    };
  }

  async update(id: number, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    const result = await this.promotionsRepository.update(id, updatePromotionDto);
    if (result.affected === 0) throw new NotFoundException('ไม่สามารถอัปเดตได้');
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const result = await this.promotionsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('ไม่สามารถลบได้');
    return { success: true, message: 'ลบโปรโมชั่นสำเร็จ' };
  }
}