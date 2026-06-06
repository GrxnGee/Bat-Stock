import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  costUnit: number;
}

@Component({
  selector: 'app-stock-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent],
  templateUrl: './stock-adjust.html',
  styleUrl: './stock-adjust.css'
})
export class StockAdjust implements OnInit {

  products: Product[] = [];
  isLoadingProducts: boolean = false;
  isSubmitting: boolean = false;

  searchQuery: string = '';
  selectedProduct: Product | null = null;

  adjustType: 'IN' | 'OUT' = 'OUT';
  adjustQty: number = 1;
  adjustReason: string = 'DAMAGED';
  adjustNote: string = '';

  isAlertOpen: boolean = false;
  alertType: string = '';
  alertMessage: string = '';

  reasons = [
    { code: 'DAMAGED', label: 'สินค้าชำรุด/เสียหาย (Damaged)', type: 'OUT' },
    { code: 'LOST', label: 'สินค้าสูญหาย (Lost)', type: 'OUT' },
    { code: 'EXPIRED', label: 'สินค้าหมดอายุ (Expired)', type: 'OUT' },
    { code: 'STOCK_TAKE_DEFICIT', label: 'ตรวจนับสต็อก: ขาดหาย (Stock Deficit)', type: 'OUT' },
    { code: 'STOCK_TAKE_SURPLUS', label: 'ตรวจนับสต็อก: เกินมา (Stock Surplus)', type: 'IN' },
    { code: 'RETURN_TO_VENDOR', label: 'ส่งคืนผู้จำหน่าย (Return)', type: 'OUT' }
  ];

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  showAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoadingProducts = false;
      },
      error: (err) => {
        console.error('ดึงข้อมูลสินค้าไม่สำเร็จ', err);
        alert('ไม่สามารถดึงข้อมูลสินค้าจากเซิร์ฟเวอร์ได้');
        this.isLoadingProducts = false;
      }
    });
  }

  searchProduct() {
    if (!this.searchQuery) return;

    const found = this.products.find(p =>
      p.barcode === this.searchQuery || p.name.includes(this.searchQuery)
    );
    this.selectedProduct = found || null;

    if (!this.selectedProduct) {
      alert('ไม่พบสินค้าในระบบ');
    }
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.searchQuery = product.barcode;
  }

  getFilteredReasons() {
    return this.reasons.filter(r => r.type === this.adjustType);
  }

  onAdjustTypeChange() {
    const availableReasons = this.getFilteredReasons();
    this.adjustReason = availableReasons.length > 0 ? availableReasons[0].code : '';
  }

  submitAdjustment() {
    if (!this.selectedProduct) return;
    if (this.adjustQty <= 0) {
      alert('กรุณาระบุจำนวนที่ต้องการปรับปรุงให้ถูกต้อง');
      return;
    }

    let newQuantity = this.selectedProduct.quantity;
    if (this.adjustType === 'IN') {
      newQuantity += this.adjustQty;
    } else {
      if (this.adjustQty > this.selectedProduct.quantity) {
        alert('จำนวนที่ต้องการหักออก มีมากกว่าสต็อกคงเหลือ!');
        return;
      }
      newQuantity -= this.adjustQty;
    }

    const totalCostChanged = this.adjustQty * this.selectedProduct.costUnit;

    this.isSubmitting = true;

    const updatePayload = {
      quantity: newQuantity
    };

    this.productService.updateProduct(this.selectedProduct.id, updatePayload).subscribe({
      next: () => {

        console.log(`บันทึกเหตุผล: ${this.adjustReason}, รายละเอียด: ${this.adjustNote}`);

        this.showAlert('payment-success', `ปรับปรุงสต็อกสำเร็จ! สต็อกล่าสุดคือ ${newQuantity} ชิ้น (มูลค่าทุนเปลี่ยนแปลง: ฿${totalCostChanged.toLocaleString()})`);

        this.selectedProduct!.quantity = newQuantity;

        // ล้างฟอร์ม
        this.selectedProduct = null;
        this.searchQuery = '';
        this.adjustQty = 1;
        this.adjustNote = '';
        this.isSubmitting = false;

        this.loadProducts();
        
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('ปรับปรุงสต็อกไม่สำเร็จ', err);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
        this.isSubmitting = false;

        this.cdr.detectChanges();
      }
    });
  }
}