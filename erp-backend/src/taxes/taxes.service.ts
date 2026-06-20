import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // 🌟 ดึง DataSource มาใช้
import { Order } from '../orders/entities/order.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity'; // 🌟
import { Supplier } from '../suppliers/entities/supplier.entity'; // 🌟
import { create } from 'xmlbuilder2';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    private dataSource: DataSource 
  ) { }

  async generateETaxXml(orderNumber: string) {
    const order = await this.ordersRepo.findOne({
      where: { orderNumber },
      relations: { items: true }
    });

    if (!order) throw new NotFoundException('ไม่พบใบเสร็จรับเงินนี้ในระบบ');

    const compName = process.env.COMPANY_NAME || 'บริษัท มายสโตร์ จำกัด';
    const compTaxId = process.env.COMPANY_TAX_ID || '0105500000000';

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('TaxInvoice', { xmlns: 'urn:etda:teda:data:TaxInvoice' })
      .ele('Header')
      .ele('DocumentNo').txt(order.orderNumber).up()
      .ele('DocumentDate').txt(order.createdAt.toISOString()).up()
      .ele('DocumentType').txt('T01').up() 
      .up()
      .ele('Seller')
      .ele('Name').txt(compName).up()
      .ele('TaxId').txt(compTaxId).up()
      .up()
      .ele('Buyer')
      .ele('Name').txt(order.customerName || 'ลูกค้าเงินสด (Cash Customer)').up()
      .ele('TaxId').txt(order.customerTaxId || '').up()
      .up()
      .ele('Items');

    order.items.forEach((item, index) => {
      root.ele('Item')
        .ele('Sequence').txt((index + 1).toString()).up()
        .ele('ProductId').txt(item.productId.toString()).up()
        .ele('Quantity').txt(item.quantity.toString()).up()
        .ele('Price').txt(item.price.toString()).up()
        .up();
    });

    root.up()
      .ele('Summary')
      .ele('SubTotal').txt(order.subTotal?.toString() || '0').up()
      .ele('VatAmount').txt(order.vatAmount?.toString() || '0').up()
      .ele('TotalAmount').txt(order.totalAmount.toString()).up()
      .up()
      .up();

    return root.end({ prettyPrint: true });
  }

  async generateETaxPdf(orderNumber: string): Promise<Buffer> {
    const order = await this.ordersRepo.findOne({
      where: { orderNumber },
      relations: { items: true }
    });

    if (!order) throw new NotFoundException('ไม่พบใบเสร็จรับเงินนี้ในระบบ');

    const compName = 'My Store Co., Ltd.';
    const compTaxId = process.env.COMPANY_TAX_ID || '0105500000000';
    const compAddress = '123 Mittraphap Rd., Nakhon Ratchasima 30000';

    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        doc.font('Helvetica-Bold').fontSize(20).text('TAX INVOICE / RECEIPT', { align: 'center' });
        doc.moveDown(2);

        const topY = doc.y;
        
        doc.font('Helvetica-Bold').fontSize(12).text('Seller:', 50, topY);
        doc.font('Helvetica').fontSize(10)
           .text(compName, 50, topY + 18)
           .text(compAddress, 50, topY + 33)
           .text(`Tax ID: ${compTaxId}`, 50, topY + 48);

        doc.font('Helvetica-Bold').fontSize(12).text('Buyer:', 300, topY);
        doc.font('Helvetica').fontSize(10)
           .text(`Name: ${order.customerName ? 'Customer' : 'Cash Customer'}`, 300, topY + 18)
           .text(`Tax ID: ${order.customerTaxId || '-'}`, 300, topY + 33)
           .text(`Date: ${order.createdAt.toLocaleDateString('en-US')}`, 300, topY + 58)
           .text(`Doc No.: ${order.orderNumber}`, 300, topY + 73);

        doc.y = topY + 110;
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('No.', 50, tableTop);
        doc.text('Description', 100, tableTop);
        doc.text('Qty', 350, tableTop, { width: 50, align: 'center' });
        doc.text('Unit Price', 400, tableTop, { width: 70, align: 'right' });
        doc.text('Amount', 470, tableTop, { width: 70, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(10);
        
        order.items.forEach((item, index) => {
          doc.text((index + 1).toString(), 50, currentY);
          doc.text(`Product ID: ${item.productId}`, 100, currentY);
          doc.text(item.quantity.toString(), 350, currentY, { width: 50, align: 'center' });
          doc.text(item.price.toFixed(2), 400, currentY, { width: 70, align: 'right' });
          doc.text((item.quantity * item.price).toFixed(2), 470, currentY, { width: 70, align: 'right' });
          currentY += 20;
        });

        doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
        currentY += 15;

        doc.font('Helvetica-Bold');
        doc.text('Sub Total', 300, currentY, { width: 170, align: 'right' });
        doc.text(order.subTotal?.toFixed(2) || '0.00', 470, currentY, { width: 70, align: 'right' });
        currentY += 20;

        doc.text('VAT Amount (7%)', 300, currentY, { width: 170, align: 'right' });
        doc.text(order.vatAmount?.toFixed(2) || '0.00', 470, currentY, { width: 70, align: 'right' });
        currentY += 20;

        doc.text('Grand Total', 300, currentY, { width: 170, align: 'right' });
        doc.text(order.totalAmount.toFixed(2), 470, currentY, { width: 70, align: 'right' });

        const signY = currentY + 60;
        doc.font('Helvetica').text('...................................................', 100, signY);
        doc.text('( Collector )', 100, signY + 15, { width: 150, align: 'center' });

        doc.text('...................................................', 350, signY);
        doc.text('( Receiver )', 350, signY + 15, { width: 150, align: 'center' });

        doc.end();
      } catch (error) {
        reject(new InternalServerErrorException('เกิดข้อผิดพลาดในการสร้าง PDF ด้วย PDFKit'));
      }
    });
  }

  async generateWhtPdf(poNumber: string): Promise<Buffer> {
    const po = await this.dataSource.getRepository(PurchaseOrder).findOne({ where: { poNumber } });
    if (!po) throw new NotFoundException('ไม่พบใบสั่งซื้อนี้');
    if (!po.whtAmount || po.whtAmount <= 0) throw new NotFoundException('ใบสั่งซื้อนี้ไม่มีการหักภาษี ณ ที่จ่าย');

    const supplier = await this.dataSource.getRepository(Supplier).findOne({ where: { id: po.supplierId } });

    const compName = 'My Store Co., Ltd.';
    const compTaxId = process.env.COMPANY_TAX_ID || '0105500000000';
    const compAddress = '123 Mittraphap Rd., Nakhon Ratchasima 30000';

    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        doc.font('Helvetica-Bold').fontSize(16).text('WITHHOLDING TAX CERTIFICATE', { align: 'center' });
        doc.font('Helvetica').fontSize(12).text('(Section 50 Bis of the Revenue Code)', { align: 'center' });
        doc.moveDown(2);

        const topY = doc.y;

        doc.font('Helvetica-Bold').fontSize(12).text('1. Withholding Tax Payer:', 50, topY);
        doc.font('Helvetica').fontSize(10)
           .text(`Name: ${compName}`, 50, topY + 20)
           .text(`Tax ID: ${compTaxId}`, 50, topY + 35)
           .text(`Address: ${compAddress}`, 50, topY + 50);

        doc.font('Helvetica-Bold').fontSize(12).text('2. Payee (Supplier):', 320, topY);
        doc.font('Helvetica').fontSize(10)
           .text(`Name: ${supplier?.name ? 'Supplier Company' : 'Unknown'}`, 320, topY + 20)
           .text(`Tax ID: -`, 320, topY + 35)
           .text(`PO Ref: ${po.poNumber}`, 320, topY + 50);

        doc.moveDown(3);

        doc.y = topY + 100;
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Income Type', 50, tableTop);
        doc.text('Date', 200, tableTop);
        doc.text('Amount Paid', 280, tableTop, { width: 100, align: 'right' });
        doc.text('Tax Rate', 390, tableTop, { width: 60, align: 'right' });
        doc.text('Tax Deducted', 460, tableTop, { width: 80, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

        let incomeType = 'Other';
        if (po.whtRate == 1) incomeType = 'Transportation (1%)';
        else if (po.whtRate == 3) incomeType = 'Service / Contract (3%)';
        else if (po.whtRate == 5) incomeType = 'Rent (5%)';

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(10);
        doc.text(incomeType, 50, currentY);
        doc.text(po.updatedAt ? po.updatedAt.toLocaleDateString('en-US') : po.createdAt.toLocaleDateString('en-US'), 200, currentY);
        doc.text(po.subTotal?.toFixed(2) || '0.00', 280, currentY, { width: 100, align: 'right' });
        doc.text(`${po.whtRate}%`, 390, currentY, { width: 60, align: 'right' });
        doc.text(po.whtAmount?.toFixed(2) || '0.00', 460, currentY, { width: 80, align: 'right' });

        currentY += 20;
        doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
        currentY += 15;

        doc.font('Helvetica-Bold');
        doc.text('Total', 200, currentY);
        doc.text(po.subTotal?.toFixed(2) || '0.00', 280, currentY, { width: 100, align: 'right' });
        doc.text(po.whtAmount?.toFixed(2) || '0.00', 460, currentY, { width: 80, align: 'right' });

        const signY = currentY + 80;
        doc.font('Helvetica').text('...................................................', 300, signY);
        doc.text('Signature of Payer', 300, signY + 15, { width: 150, align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 300, signY + 35, { width: 150, align: 'center' });

        doc.end();
      } catch (error) {
        reject(new InternalServerErrorException('Error generating WHT PDF'));
      }
    });
  }
}