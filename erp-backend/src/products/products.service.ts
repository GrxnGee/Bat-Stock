import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) { }

async onModuleInit() {
    try {
      const count = await this.productsRepository.count();
      if (count === 0) {
        console.log('✅ ฐานข้อมูล Product ว่างเปล่า (พร้อมสำหรับเพิ่มข้อมูลจริง)');
      }
    } catch (error) {
      console.log('⏳ กำลังรอ TypeORM สร้างตาราง Product...');
    }
  }


  async create(productData: Partial<Product>) {
    const product = this.productsRepository.create(productData);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productsRepository.find();
  }

  async findOneByBarcode(barcode: string): Promise<Product | null> {
    return await this.productsRepository.findOneBy({ barcode: barcode });
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.productsRepository.update(id, updateProductDto);
    return this.productsRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.productsRepository.delete(id);
    return { success: true, message: `ลบสินค้า ID ${id} เรียบร้อย` };
  }
}
