import { Controller, Get, Post, Body, Patch, Param, Res } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { POStatus } from './entities/purchase-order.entity';
import { Response } from 'express';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) { }

  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.poService.create(createPurchaseOrderDto);
  }

  @Get('pdf/:poNumber')
  async downloadPOPdf(@Param('poNumber') poNumber: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.poService.generatePOPdf(poNumber);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${poNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  @Get('ap/debts')
  getAccountsPayable() {
    return this.poService.getAccountsPayable();
  }

  @Get()
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.poService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: POStatus) {
    return this.poService.updateStatus(+id, status);
  }

  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string) {
    return this.poService.markAsPaid(+id);
  }
}