import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()

export class SuppliersService {

  constructor(
    @InjectRepository(Supplier) private suppliersRepository: Repository<Supplier>,) { }

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const newSupplier = this.suppliersRepository.create(createSupplierDto);
    const savedSupplier = await this.suppliersRepository.save(newSupplier);
    console.log(`✅ เพิ่ม Supplier ใหม่สำเร็จ: ${savedSupplier.name}`);
    return savedSupplier;
  }

  async findAll(): Promise<Supplier[]> {
    return await this.suppliersRepository.find({
      order: {
        createdAt: 'DESC', 
      },
    });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`ไม่พบข้อมูล Supplier รหัส ${id} ในระบบ`);
    }

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {

    const updateResult = await this.suppliersRepository.update(id, updateSupplierDto);

    if (updateResult.affected === 0) {
      throw new NotFoundException(`ไม่สามารถอัปเดตได้เนื่องจากไม่พบ Supplier รหัส ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const deleteResult = await this.suppliersRepository.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(`ไม่สามารถลบได้เนื่องจากไม่พบ Supplier รหัส ${id}`);
    }

    console.log(`🗑️ ลบข้อมูล Supplier รหัส ${id} สำเร็จ`);
    return {
      success: true,
      message: `ลบข้อมูล Supplier รหัส ${id} สำเร็จเรียบร้อยแล้ว`,
    };
  }
}
