import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('statement')
  getStatement(@Query('year') year: string, @Query('month') month: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    return this.accountingService.getStatement(currentYear, currentMonth);
  }

  @Get('periods')
  getClosedPeriods() {
    return this.accountingService.getClosedPeriods();
  }

  @Post('periods/close')
  closePeriod(@Body() body: { year: number, month: number, closedBy: string }) {
    return this.accountingService.closePeriod(body.year, body.month, body.closedBy);
  }
}