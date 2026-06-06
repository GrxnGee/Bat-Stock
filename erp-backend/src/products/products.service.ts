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
        const initialProducts = [
          { name: 'กาแฟคั่วกลาง', price: 65, quantity: 50, barcode: '8850001', image: 'https://picsum.photos/200', costUnit: 15 },
          { name: 'ชาเขียวมัทฉะ', price: 75, quantity: 30, barcode: '8850002', image: 'https://picsum.photos/201', costUnit: 15 },
        ];
        await this.productsRepository.save(initialProducts);
        console.log('✅ ปั๊มข้อมูลสำเร็จ!');
      }
    } catch (error) {
      // ถ้าหาตารางไม่เจอ ให้ปริ้นท์บอกเฉยๆ แต่อย่าทำให้เซิร์ฟเวอร์ดับ
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
