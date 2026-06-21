import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductLot } from './entities/product-lot.entity';

@Injectable()
export class ProductsService {

  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(ProductLot) private productLotRepository: Repository<ProductLot>,
    private dataSource: DataSource
  ) { }

  async onModuleInit() {
    try {
      const count = await this.productsRepository.count();
      if (count === 0) {
        console.log('✅ ฐานข้อมูล Product ว่างเปล่า');
      }
    } catch (error) {
      console.log('⏳ กำลังรอตาราง Product');
    }
  }

 async getSmartPurchasingSuggestions() {
    console.log('⏳ กำลังประมวลผล (EOQ & ROP)');

    const products = await this.productsRepository.find({ relations: { supplier: true } });
    const suggestions: any[] = [];

    for (const product of products) {
      if (!product.supplierId || !product.supplier) continue;

      const leadTimeDays = product.supplier.leadTimeDays || 0; 
      const orderingCost = product.supplier.orderingCost || 0;   
      const safetyStock = product.safetyStock || 0;          
      const holdingCostPercent = product.holdingCostPercent || 0;


      const holdingCostPerUnit = (product.costUnit * holdingCostPercent) / 100;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const soldData = await this.dataSource.manager
        .createQueryBuilder('order_item', 'item')
        .innerJoin('item.order', 'order')
        .where('item.productId = :id', { id: product.id })
        .andWhere('order.createdAt >= :date', { date: thirtyDaysAgo })
        .select('SUM(item.quantity)', 'totalSold')
        .getRawOne();

      const soldIn30Days = Number(soldData?.totalSold) || 0;
      const dailyDemand = soldIn30Days / 30; 
      const annualDemand = dailyDemand * 365;

      const ROP = Math.ceil((dailyDemand * leadTimeDays) + safetyStock);

      let EOQ = 0;
      if (holdingCostPerUnit > 0 && annualDemand > 0 && orderingCost > 0) {
        EOQ = Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit));
      }

      let status = 'NORMAL'; 
      if (product.quantity <= ROP) {
        status = 'REORDER_NOW'; 
      } else if (product.quantity <= ROP + (ROP * 0.2)) {
        status = 'WARNING'; 
      }

      suggestions.push({
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        currentStock: product.quantity,
        supplierName: product.supplier.name,
        dailyDemand: dailyDemand.toFixed(2),
        rop: ROP,
        eoq: EOQ,
        status: status
      });
    }

    return {
      success: true,
      totalAnalyzed: suggestions.length,
      data: suggestions
    };
  }

  async create(productData: Partial<Product>) {
    const product = this.productsRepository.create(productData);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {

    return await this.productsRepository.find({ relations: { lots: true } });
  }

  async findOneByBarcode(barcode: string): Promise<Product | null> {

    return await this.productsRepository.findOne({
      where: { barcode },
      relations: { lots: true }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async update(id: number, updateProductDto: any) {

    if (updateProductDto.adjustLotId && updateProductDto.adjustQty !== undefined) {
      const lot = await this.productLotRepository.findOneBy({ id: updateProductDto.adjustLotId });
      if (lot) {
        lot.quantity += updateProductDto.adjustQty;
        await this.productLotRepository.save(lot);
      }

      delete updateProductDto.adjustLotId;
      delete updateProductDto.adjustQty;
    }

    await this.productsRepository.update(id, updateProductDto);

    return this.productsRepository.findOne({
      where: { id },
      relations: { lots: true }
    });
  }

  async remove(id: number) {
    await this.productsRepository.delete(id);
    return { success: true, message: `ลบสินค้า ID ${id} เรียบร้อย` };
  }
}