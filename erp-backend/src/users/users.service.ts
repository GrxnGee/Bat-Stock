import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.usersRepository.count();
      if (count === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);

        const initialUsers = [
          {
            username: 'master',
            password: hashedPassword,
            name: 'สมชาย เจ้าของร้าน',
            role: UserRole.MASTER,
          },
          {
            username: 'cashier',
            password: hashedPassword,
            name: 'สมหญิง หน้าร้าน',
            role: UserRole.CASHIER,
          }
        ];
        
        await this.usersRepository.save(this.usersRepository.create(initialUsers));
        console.log('✅ ปั๊มบัญชีผู้ใช้เริ่มต้นสำเร็จ! (username: master, cashier)');
      }
    } catch (error) {
      console.log('⏳ กำลังรอ TypeORM สร้างตาราง Users...');
    }
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOneBy({ username: createUserDto.username });
    if (existingUser) {
      throw new BadRequestException('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
    }
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword
    });
    
    return this.usersRepository.save(newUser);
  }

  async findAll() {
    return this.usersRepository.find({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true }
    });
    
    if (!user) {
      throw new NotFoundException(`ไม่พบพนักงาน ID ${id}`);
    }
    return user;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async update(id: number, updateUserDto: any) {

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id); 
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
    return { success: true, message: `ลบพนักงาน ID ${id} สำเร็จ` };
  }
}