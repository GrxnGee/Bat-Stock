import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
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
        console.log('📦 กำลังปั๊มข้อมูลสินค้าเริ่มต้น...');
        const initialProducts = [
          { name: 'กาแฟคั่วกลาง', price: 65, quantity: 50, barcode: '8850001', image: 'https://picsum.photos/200' },
          { name: 'ชาเขียวมัทฉะ', price: 75, quantity: 30, barcode: '8850002', image: 'https://picsum.photos/201' },
        ];
        await this.productsRepository.save(initialProducts);
        console.log('✅ ปั๊มข้อมูลสำเร็จ!');
      }
    } catch (error) {
      // ถ้าหาตารางไม่เจอ ให้ปริ้นท์บอกเฉยๆ แต่อย่าทำให้เซิร์ฟเวอร์ดับ
      console.log('⏳ กำลังรอ TypeORM สร้างตาราง Product...');
    }
  }


  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
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

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
