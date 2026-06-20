import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { AccountingPeriod } from './entities/accounting-period.entity';
import { GeneralLedger } from './entities/ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingPeriod, GeneralLedger])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService], 
})
export class AccountingModule {}