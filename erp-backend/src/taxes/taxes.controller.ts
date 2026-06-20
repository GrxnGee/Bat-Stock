import { Controller, Get, Param, Res } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { Response } from 'express';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get('e-tax/:orderNumber')
  async downloadETaxXml(@Param('orderNumber') orderNumber: string, @Res() res: Response) {
    try {
      const xmlString = await this.taxesService.generateETaxXml(orderNumber);
      res.set({
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="ETAX_${orderNumber}.xml"`,
      });
      res.send(xmlString);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  @Get('e-tax-pdf/:orderNumber')
  async downloadETaxPdf(@Param('orderNumber') orderNumber: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.taxesService.generateETaxPdf(orderNumber);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ETAX_${orderNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  @Get('wht-pdf/:poNumber')
  async downloadWhtPdf(@Param('poNumber') poNumber: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.taxesService.generateWhtPdf(poNumber);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="WHT_50TAWI_${poNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }
}