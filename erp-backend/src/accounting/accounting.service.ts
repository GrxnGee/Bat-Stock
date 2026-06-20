import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between } from 'typeorm';
import { AccountingPeriod, PeriodStatus } from './entities/accounting-period.entity';
import { GeneralLedger, LedgerType } from './entities/ledger.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountingPeriod) private periodRepo: Repository<AccountingPeriod>,
    @InjectRepository(GeneralLedger) private ledgerRepo: Repository<GeneralLedger>, 
  ) {}


  async validatePeriodIsOpen(date: Date, manager?: EntityManager) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; 
    

    const repo = manager ? manager.getRepository(AccountingPeriod) : this.periodRepo;
    const period = await repo.findOne({ where: { year, month } });
    
    if (period && period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException(`ไม่อนุมัติ! งวดบัญชีประจำเดือน ${month}/${year} ถูกปิดไปแล้ว`);
    }
  }

  async recordTransactionDirect(
    manager: EntityManager, type: LedgerType, transactionDate: Date,
    referenceDocument: string, subTotal: number, vatAmount: number,
    whtAmount: number, netAmount: number, description: string
  ) {
 
    await this.validatePeriodIsOpen(transactionDate, manager);
    
    const ledger = manager.create(GeneralLedger, {
      type, transactionDate, referenceDocument, subTotal, vatAmount, whtAmount, netAmount, description
    });
    await manager.save(GeneralLedger, ledger);
  }

  async getStatement(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.ledgerRepo.find({
      where: { transactionDate: Between(startDate, endDate) },
      order: { transactionDate: 'DESC' }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === LedgerType.INCOME) totalIncome += Number(t.netAmount);
      if (t.type === LedgerType.EXPENSE) totalExpense += Number(t.netAmount);
    });

    return { year, month, totalIncome, totalExpense, netProfit: totalIncome - totalExpense, transactions };
  }

  async getClosedPeriods() {
    return await this.periodRepo.find({ order: { year: 'DESC', month: 'DESC' } });
  }

  async closePeriod(year: number, month: number, closedBy: string) {
    let period = await this.periodRepo.findOne({ where: { year, month } });
    if (period) {
      if (period.status === PeriodStatus.CLOSED) throw new BadRequestException('งวดบัญชีนี้ถูกปิดไปแล้ว');
      period.status = PeriodStatus.CLOSED;
      period.closedBy = closedBy;
      period.closedAt = new Date();
    } else {
      period = this.periodRepo.create({ year, month, status: PeriodStatus.CLOSED, closedBy, closedAt: new Date() });
    }
    await this.periodRepo.save(period);
    return { success: true, message: `ล็อกงวดบัญชีเดือน ${month}/${year} สำเร็จ!` };
  }
}