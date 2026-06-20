import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>, private configService: ConfigService) { }


async onModuleInit() {
    try {
      const count = await this.usersRepository.count();
      if (count === 0) {

        const adminUsername = this.configService.get<string>('INITIAL_ADMIN_USER') || 'master';
        const adminPassword = this.configService.get<string>('INITIAL_ADMIN_PASS') || 'SuperSecret@Default123!';
        
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const initialUsers = [
          {
            username: adminUsername,
            password: hashedPassword,
            name: 'ผู้ดูแลระบบสูงสุด',
            role: UserRole.MASTER,
          }
        ];
        
        await this.usersRepository.save(this.usersRepository.create(initialUsers));
        console.log(`สร้างบัญชีเริ่มต้นสำเร็จ! (Admin: ${adminUsername})`);
      }
    } catch (error) {
      console.log('⏳ กำลังรอ TypeORM สร้างตาราง Users...');
    }
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOneBy({ username: createUserDto.username });
    if (existingUser) {
      throw new BadRequestException('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword
    });

    const savedUser = await this.usersRepository.save(newUser);

    delete (savedUser as any).password;

    return savedUser;
  }

  async findAll() {
    return this.usersRepository.find({
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true }
    });
    if (!user) throw new NotFoundException(`ไม่พบพนักงาน ID ${id}`);
    return user;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async update(id: number, updateUserDto: any) {

    if (updateUserDto.username) {
      const exist = await this.usersRepository.findOne({ where: { username: updateUserDto.username } });
      if (exist && exist.id !== id) throw new BadRequestException('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว');
    }

    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password;
    }

    await this.usersRepository.update(id, updateUserDto);
    return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
    return { success: true, message: `ลบพนักงาน ID ${id} สำเร็จ` };
  }
}