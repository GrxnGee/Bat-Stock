import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { create } from 'xmlbuilder2';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    private dataSource: DataSource,
    private configService: ConfigService
  ) { }

  async generateETaxXml(orderNumber: string) {
    const order = await this.ordersRepo.findOne({
      where: { orderNumber },
      relations: { items: true }
    });

    if (!order) throw new NotFoundException('ไม่พบใบเสร็จรับเงินนี้ในระบบ');

    const compName = process.env.COMPANY_NAME || '[กรุณาตั้งค่าชื่อบริษัทใน .env]';
    const compTaxId = process.env.COMPANY_TAX_ID || '[กรุณาตั้งค่าเลขผู้เสียภาษีใน .env]';

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

  // 2. ฟังก์ชันสร้าง E-Tax PDF (รองรับภาษาไทย)
  async generateETaxPdf(orderNumber: string): Promise<Buffer> {
    const order = await this.ordersRepo.findOne({
      where: { orderNumber },
      relations: { items: true }
    });

    if (!order) throw new NotFoundException('ไม่พบใบเสร็จรับเงินนี้ในระบบ');

    const compName = process.env.COMPANY_NAME || '[กรุณาตั้งค่าชื่อบริษัทใน .env]';
    const compTaxId = process.env.COMPANY_TAX_ID || '[กรุณาตั้งค่าเลขผู้เสียภาษีใน .env]';
    const compAddress = this.configService.get<string>('COMPANY_ADDRESS') || '[กรุณาตั้งค่าที่อยู่ใน .env]';

    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        const fontRegular = path.join(process.cwd(), 'fonts', 'THSarabunNew.ttf');
        const fontBold = path.join(process.cwd(), 'fonts', 'THSarabunNew-Bold.ttf');
        doc.registerFont('Sarabun', fontRegular);
        doc.registerFont('Sarabun-Bold', fontBold);

        // --- หัวกระดาษ ---
        doc.font('Sarabun-Bold').fontSize(24).text('ใบกำกับภาษี / ใบเสร็จรับเงิน', { align: 'center' });
        doc.moveDown(2);

        const topY = doc.y;

        doc.font('Sarabun-Bold').fontSize(16).text('ผู้ขาย (Seller):', 50, topY);
        doc.font('Sarabun').fontSize(14)
          .text(compName, 50, topY + 18)
          .text(compAddress, 50, topY + 33)
          .text(`เลขประจำตัวผู้เสียภาษี: ${compTaxId}`, 50, topY + 48);

        doc.font('Sarabun-Bold').fontSize(16).text('ผู้ซื้อ (Buyer):', 300, topY);
        doc.font('Sarabun').fontSize(14)
          .text(`ชื่อ: ${order.customerName || 'ลูกค้าเงินสด'}`, 300, topY + 18)
          .text(`เลขประจำตัวผู้เสียภาษี: ${order.customerTaxId || '-'}`, 300, topY + 33)
          .text(`วันที่ (Date): ${order.createdAt.toLocaleDateString('th-TH')}`, 300, topY + 58)
          .text(`เลขที่เอกสาร (Doc No.): ${order.orderNumber}`, 300, topY + 73);

        doc.y = topY + 110;
        const tableTop = doc.y;
        doc.font('Sarabun-Bold').fontSize(14);
        doc.text('ลำดับ', 50, tableTop);
        doc.text('รายการสินค้า', 100, tableTop);
        doc.text('จำนวน', 350, tableTop, { width: 50, align: 'center' });
        doc.text('ราคา/หน่วย', 400, tableTop, { width: 70, align: 'right' });
        doc.text('ยอดรวม', 470, tableTop, { width: 70, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

        let currentY = tableTop + 25;
        doc.font('Sarabun').fontSize(14);

        order.items.forEach((item, index) => {
          doc.text((index + 1).toString(), 50, currentY);
          doc.text(`รหัสสินค้า: ${item.productId}`, 100, currentY);
          doc.text(item.quantity.toString(), 350, currentY, { width: 50, align: 'center' });
          doc.text(item.price.toFixed(2), 400, currentY, { width: 70, align: 'right' });
          doc.text((item.quantity * item.price).toFixed(2), 470, currentY, { width: 70, align: 'right' });
          currentY += 20;
        });

        doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
        currentY += 15;

        doc.font('Sarabun-Bold');

        const totalBeforeDiscount = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        if (order.discountAmount && order.discountAmount > 0) {
          doc.text('รวมเป็นเงิน (Gross Total)', 250, currentY, { width: 220, align: 'right' });
          doc.text(totalBeforeDiscount.toFixed(2), 470, currentY, { width: 70, align: 'right' });
          currentY += 20;

          const promoText = order.promoCode ? ` [${order.promoCode}]` : '';
          doc.text(`ส่วนลด (Discount)${promoText}`, 250, currentY, { width: 220, align: 'right' });
          doc.text(`-${Number(order.discountAmount).toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });
          currentY += 20;
        }

        doc.text('มูลค่ายกเว้นภาษี (Sub Total)', 250, currentY, { width: 220, align: 'right' });
        doc.text(Number(order.subTotal || 0).toFixed(2), 470, currentY, { width: 70, align: 'right' });
        currentY += 20;

        doc.text('ภาษีมูลค่าเพิ่ม 7% (VAT Amount)', 250, currentY, { width: 220, align: 'right' });
        doc.text(Number(order.vatAmount || 0).toFixed(2), 470, currentY, { width: 70, align: 'right' });
        currentY += 20;

        doc.text('ยอดชำระสุทธิ (Grand Total)', 250, currentY, { width: 220, align: 'right' });
        doc.text(Number(order.totalAmount).toFixed(2), 470, currentY, { width: 70, align: 'right' });

        const signY = currentY + 60;
        doc.font('Sarabun').text('...................................................', 100, signY);
        doc.text('( ผู้รับเงิน / Collector )', 100, signY + 15, { width: 150, align: 'center' });

        doc.text('...................................................', 350, signY);
        doc.text('( ผู้รับสินค้า / Receiver )', 350, signY + 15, { width: 150, align: 'center' });

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

    const compName = process.env.COMPANY_NAME || '[กรุณาตั้งค่าชื่อบริษัทใน .env]';
    const compTaxId = process.env.COMPANY_TAX_ID || '[กรุณาตั้งค่าเลขผู้เสียภาษีใน .env]';
    const compAddress = this.configService.get<string>('COMPANY_ADDRESS') || '[กรุณาตั้งค่าที่อยู่ใน .env]';

    return new Promise((resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        const fontRegular = path.join(process.cwd(), 'fonts', 'THSarabunNew.ttf');
        const fontBold = path.join(process.cwd(), 'fonts', 'THSarabunNew-Bold.ttf');
        doc.registerFont('Sarabun', fontRegular);
        doc.registerFont('Sarabun-Bold', fontBold);

        doc.font('Sarabun-Bold').fontSize(20).text('หนังสือรับรองการหักภาษี ณ ที่จ่าย', { align: 'center' });
        doc.font('Sarabun').fontSize(14).text('(ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)', { align: 'center' });
        doc.moveDown(2);

        const topY = doc.y;

        doc.font('Sarabun-Bold').fontSize(14).text('1. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย:', 50, topY);
        doc.font('Sarabun').fontSize(14)
          .text(`ชื่อ: ${compName}`, 50, topY + 20)
          .text(`เลขประจำตัวผู้เสียภาษี: ${compTaxId}`, 50, topY + 35)
          .text(`ที่อยู่: ${compAddress}`, 50, topY + 50);

        doc.font('Sarabun-Bold').fontSize(14).text('2. ผู้ถูกหักภาษี ณ ที่จ่าย:', 320, topY);
        doc.font('Sarabun').fontSize(14)
          .text(`ชื่อ: ${supplier?.name ? supplier.name : 'Unknown'}`, 320, topY + 20)
          .text(`เลขประจำตัวผู้เสียภาษี: -`, 320, topY + 35)
          .text(`อ้างอิงใบสั่งซื้อ: ${po.poNumber}`, 320, topY + 50);

        doc.moveDown(3);

        doc.y = topY + 110;
        const tableTop = doc.y;
        doc.font('Sarabun-Bold').fontSize(14);
        doc.text('ประเภทเงินได้', 50, tableTop);
        doc.text('วันเดือนปี', 200, tableTop);
        doc.text('จำนวนเงินที่จ่าย', 280, tableTop, { width: 100, align: 'right' });
        doc.text('อัตราภาษี', 390, tableTop, { width: 60, align: 'right' });
        doc.text('ภาษีที่หักไว้', 460, tableTop, { width: 80, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

        let incomeType = 'อื่นๆ';
        if (po.whtRate == 1) incomeType = 'ค่าขนส่ง (1%)';
        else if (po.whtRate == 3) incomeType = 'ค่าบริการ / จ้างทำของ (3%)';
        else if (po.whtRate == 5) incomeType = 'ค่าเช่า (5%)';

        let currentY = tableTop + 25;
        doc.font('Sarabun').fontSize(14);
        doc.text(incomeType, 50, currentY);
        doc.text(po.updatedAt ? po.updatedAt.toLocaleDateString('th-TH') : po.createdAt.toLocaleDateString('th-TH'), 200, currentY);
        doc.text(po.subTotal?.toFixed(2) || '0.00', 280, currentY, { width: 100, align: 'right' });
        doc.text(`${po.whtRate}%`, 390, currentY, { width: 60, align: 'right' });
        doc.text(po.whtAmount?.toFixed(2) || '0.00', 460, currentY, { width: 80, align: 'right' });

        currentY += 20;
        doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
        currentY += 15;

        doc.font('Sarabun-Bold');
        doc.text('รวมยอด', 200, currentY);
        doc.text(po.subTotal?.toFixed(2) || '0.00', 280, currentY, { width: 100, align: 'right' });
        doc.text(po.whtAmount?.toFixed(2) || '0.00', 460, currentY, { width: 80, align: 'right' });

        const signY = currentY + 80;
        doc.font('Sarabun').text('...................................................', 300, signY);
        doc.text('ลงชื่อผู้จ่ายเงิน', 300, signY + 15, { width: 150, align: 'center' });
        doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 300, signY + 35, { width: 150, align: 'center' });

        doc.end();
      } catch (error) {
        reject(new InternalServerErrorException('Error generating WHT PDF'));
      }
    });
  }
}