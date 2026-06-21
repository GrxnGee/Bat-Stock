import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, POStatus, PaymentType, PaymentStatus } from './entities/purchase-order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductLot } from '../products/entities/product-lot.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { AccountingService } from '../accounting/accounting.service';
import { LedgerType } from '../accounting/entities/ledger.entity';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Supplier) private supplierRepository: Repository<Supplier>,
    private dataSource: DataSource,
    private accountingService: AccountingService,
    private configService: ConfigService
  ) { }

  private generatePONumber(): string {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PO-${dateStr}-${randomNum}`;
  }

  async create(createPoDto: any) {
    const newPO = this.poRepository.create({
      poNumber: this.generatePONumber(),
      supplierId: createPoDto.supplierId,
      totalAmount: createPoDto.totalAmount,
      expectedDeliveryDate: createPoDto.expectedDeliveryDate ? new Date(createPoDto.expectedDeliveryDate) : undefined,
      status: POStatus.PENDING,
      paymentType: createPoDto.paymentType || PaymentType.CASH,
      supplierTaxInvoiceNo: createPoDto.supplierTaxInvoiceNo,
      supplierTaxInvoiceDate: createPoDto.supplierTaxInvoiceDate ? new Date(createPoDto.supplierTaxInvoiceDate) : undefined,
      whtRate: createPoDto.whtRate || 0,
      items: createPoDto.items,
    });
    return await this.poRepository.save(newPO);
  }

  async findAll() {
    return await this.poRepository.find({ relations: { items: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    return await this.poRepository.findOne({ where: { id }, relations: { items: true } });
  }

  async updateStatus(id: number, status: POStatus) {
    const po = await this.findOne(id);
    if (!po) throw new BadRequestException('ไม่พบใบสั่งซื้อนี้ในระบบ');
    if (po.status === POStatus.COMPLETED) throw new BadRequestException('ใบสั่งซื้อนี้ถูกรับของเข้าสต็อกไปแล้ว ไม่สามารถทำซ้ำได้');

    if (status === POStatus.CANCELLED) {
      po.status = POStatus.CANCELLED;
      return await this.poRepository.save(po);
    }

    if (status === POStatus.COMPLETED) {
      await this.accountingService.validatePeriodIsOpen(new Date());
      const supplier = await this.supplierRepository.findOne({ where: { id: po.supplierId } });

      const vatRate = Number(process.env.DEFAULT_VAT_RATE) || 7;
      const totalAmount = po.totalAmount;
      const vatAmount = Number((totalAmount * vatRate / (100 + vatRate)).toFixed(2));
      const subTotal = Number((totalAmount - vatAmount).toFixed(2));

      const whtRate = Number(po.whtRate) || 0;
      const whtAmount = Number((subTotal * whtRate / 100).toFixed(2));
      const netPaidAmount = Number((totalAmount - whtAmount).toFixed(2));

      po.subTotal = subTotal;
      po.vatAmount = vatAmount;
      po.whtAmount = whtAmount;

      if (po.paymentType === PaymentType.CREDIT) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (supplier?.creditDays || 0));
        po.dueDate = dueDate;
        po.paymentStatus = PaymentStatus.UNPAID;
      } else {
        po.dueDate = new Date();
        po.paymentStatus = PaymentStatus.PAID;
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const item of po.items) {
          await queryRunner.manager.increment(Product, { id: item.productId }, 'quantity', item.quantity);
          await queryRunner.manager.update(Product, { id: item.productId }, { costUnit: item.unitCost });

          if (item.lotNumber && item.lotNumber.trim() !== '') {
            const existingLot = await queryRunner.manager.findOne(ProductLot, {
              where: { productId: item.productId, lotNumber: item.lotNumber }
            });
            if (existingLot) {
              await queryRunner.manager.increment(ProductLot, { id: existingLot.id }, 'quantity', item.quantity);
            } else {
              const newLot = queryRunner.manager.create(ProductLot, {
                productId: item.productId,
                lotNumber: item.lotNumber,
                quantity: item.quantity,
                expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined
              });
              await queryRunner.manager.save(ProductLot, newLot);
            }
          }
        }

        po.status = POStatus.COMPLETED;
        await queryRunner.manager.save(PurchaseOrder, po);

        await this.accountingService.recordTransactionDirect(
          queryRunner.manager,
          LedgerType.EXPENSE,
          new Date(),
          po.supplierTaxInvoiceNo || po.poNumber,
          subTotal,
          vatAmount,
          whtAmount,
          netPaidAmount,
          `บันทึกรายจ่าย (เจ้าหนี้: ${supplier?.name || 'ไม่ระบุ'})` + (whtAmount > 0 ? ` [หัก ณ ที่จ่าย ${whtRate}%]` : '')
        );

        await queryRunner.commitTransaction();
        return { success: true, message: 'รับของเข้าสต็อก บันทึกล็อต และตั้งหนี้สำเร็จ!', po };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException('เกิดข้อผิดพลาดในการรับของเข้าสต็อกและบันทึกล็อต');
      } finally {
        await queryRunner.release();
      }
    }
  }

  async getAccountsPayable() {
    return await this.poRepository.find({
      where: { paymentType: PaymentType.CREDIT, status: POStatus.COMPLETED },
      order: { dueDate: 'ASC' }
    });
  }

  async markAsPaid(id: number) {
    const po = await this.findOne(id);
    if (!po) throw new BadRequestException('ไม่พบใบสั่งซื้อ');
    if (po.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('บิลนี้ถูกชำระเงินไปแล้ว');

    po.paymentStatus = PaymentStatus.PAID;
    await this.poRepository.save(po);
    return { success: true, message: 'บันทึกการชำระเงินให้คู่ค้าสำเร็จ' };
  }


  // สร้างเอกสารใบสั่งซื้อ PDF (รองรับภาษาไทย)
  async generatePOPdf(poNumber: string): Promise<Buffer> {
    const po = await this.poRepository.findOne({
      where: { poNumber },
      relations: { items: true }
    });

    if (!po) throw new BadRequestException('ไม่พบใบสั่งซื้อนี้');

    const supplier = await this.supplierRepository.findOne({ where: { id: po.supplierId } });

    const compName = process.env.COMPANY_NAME || '[กรุณาตั้งค่าชื่อบริษัทใน .env]';
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

        doc.font('Sarabun-Bold').fontSize(24).text('PURCHASE ORDER / ใบสั่งซื้อ', { align: 'center' });
        doc.moveDown(2);

        const topY = doc.y;

        doc.font('Sarabun-Bold').fontSize(16).text('Buyer (ผู้ซื้อ):', 50, topY);
        doc.font('Sarabun').fontSize(14)
          .text(compName, 50, topY + 18)
          .text(compAddress, 50, topY + 33);

        doc.font('Sarabun-Bold').fontSize(16).text('Vendor (ผู้ขาย):', 300, topY);
        doc.font('Sarabun').fontSize(14)
          .text(`Name: ${supplier?.name ? supplier.name : 'Unknown'}`, 300, topY + 18)
          .text(`Contact: ${supplier?.contactPerson ? supplier.contactPerson : '-'}`, 300, topY + 33)
          .text(`PO No.: ${po.poNumber}`, 300, topY + 58)
          .text(`Date: ${po.createdAt.toLocaleDateString('th-TH')}`, 300, topY + 73);

        doc.y = topY + 110;
        const tableTop = doc.y;
        doc.font('Sarabun-Bold').fontSize(14);
        doc.text('No.', 50, tableTop);
        doc.text('Product ID', 100, tableTop);
        doc.text('Qty', 350, tableTop, { width: 50, align: 'center' });
        doc.text('Unit Cost', 400, tableTop, { width: 70, align: 'right' });
        doc.text('Amount', 470, tableTop, { width: 70, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

        let currentY = tableTop + 25;
        doc.font('Sarabun').fontSize(14);

        po.items.forEach((item, index) => {
          doc.text((index + 1).toString(), 50, currentY);
          doc.text(`รหัสสินค้า: ${item.productId}`, 100, currentY);
          doc.text(item.quantity.toString(), 350, currentY, { width: 50, align: 'center' });
          doc.text(item.unitCost.toFixed(2), 400, currentY, { width: 70, align: 'right' });
          doc.text((item.quantity * item.unitCost).toFixed(2), 470, currentY, { width: 70, align: 'right' });
          currentY += 20;
        });

        doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
        currentY += 15;

        doc.font('Sarabun-Bold');
        doc.text('Total Amount (ยอดรวม)', 250, currentY, { width: 220, align: 'right' });
        doc.text(po.totalAmount.toFixed(2), 470, currentY, { width: 70, align: 'right' });

        const signY = currentY + 60;
        doc.font('Sarabun').text('...................................................', 50, signY);
        doc.text('( Authorized Signature / ผู้อนุมัติ )', 50, signY + 15, { width: 150, align: 'center' });
        doc.text('Date: ____/____/______', 50, signY + 35, { width: 150, align: 'center' });

        doc.end();
      } catch (error: any) {
        console.error("PDF Generation Error: ", error);
        reject(new BadRequestException('เกิดข้อผิดพลาดในการสร้าง PDF: ' + error.message));
      }
    });
  }
}