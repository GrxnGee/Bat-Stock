import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService, Promotion } from '../../../services/promotion';
import { ProductService } from '../../../services/product';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal'; // 🌟 Import Modal

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent], // 🌟 เพิ่มลงใน Imports
  templateUrl: './promotions.html',
  styleUrl: './promotions.css'
})
export class Promotions implements OnInit {

  constructor(private promoService: PromotionService, private productService: ProductService, private cdr: ChangeDetectorRef) { }

  promotions: Promotion[] = [];
  products: any[] = [];
  isFormOpen = false;

  promoForm: Promotion = {
    code: '', name: '', discountType: 'FIXED', discountValue: 0, minimumPurchase: 0, isActive: true, applicableProductId: null, isAutoApply: false
  };

  isAlertOpen: boolean = false;
  alertType: string = '';
  alertMessage: string = '';
  promoToDeleteId: number | null = null;

  ngOnInit() {
    this.loadPromotions();
    this.loadProducts();

    this.confirmAlertAction
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  loadPromotions() {
    this.promoService.getPromotions().subscribe({
      next: (data) => {
        this.promotions = data;
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
      this.cdr.detectChanges();
    });
  }

  getProductName(productId: number | null | undefined): string {
    if (!productId) return '🛒 ยอดรวมทั้งบิล';
    const product = this.products.find(p => p.id === productId);
    return product ? `📦 ${product.name}` : '❓ ไม่พบสินค้า';
  }

  openForm() {
    this.promoForm = { code: '', name: '', discountType: 'FIXED', discountValue: 0, minimumPurchase: 0, isActive: true, applicableProductId: null, isAutoApply: false };
    this.isFormOpen = true;
  }

  savePromotion() {
    if (!this.promoForm.code || !this.promoForm.name || this.promoForm.discountValue <= 0) {
      this.showAlert('warning', 'กรุณากรอกข้อมูลโค้ดและส่วนลดให้ถูกต้อง');
      return;
    }

    this.promoForm.code = this.promoForm.code.toUpperCase();

    if (this.promoForm.id) {
      this.promoService.updatePromotion(this.promoForm.id, this.promoForm).subscribe({
        next: () => {
          this.isFormOpen = false;
          this.showAlert('payment-success', 'อัปเดตโปรโมชั่นสำเร็จ');
          this.loadPromotions();
        },
        error: (err) => this.showAlert('warning', err.error?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล')
      });
    } else {
      this.promoService.createPromotion(this.promoForm).subscribe({
        next: () => {
          this.isFormOpen = false;
          this.showAlert('payment-success', 'สร้างโปรโมชั่นใหม่สำเร็จ');
          this.loadPromotions();
        },
        error: (err) => this.showAlert('warning', err.error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      });
    }
  }

  toggleActive(promo: Promotion) {
    this.promoService.updatePromotion(promo.id!, { isActive: !promo.isActive }).subscribe(() => {
      this.loadPromotions();
    });
  }

  deletePromo(id: number) {
    this.promoToDeleteId = id;
    this.showAlert('confirm-delete', 'คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่นนี้?');
  }

  confirmAlertAction() {
    if (this.alertType === 'confirm-delete' && this.promoToDeleteId !== null) {
      this.promoService.deletePromotion(this.promoToDeleteId).subscribe({
        next: () => {
          this.isAlertOpen = false;
          this.showAlert('payment-success', 'ลบโปรโมชั่นสำเร็จเรียบร้อย');
          this.loadPromotions();
        },
        error: () => this.showAlert('warning', 'ไม่สามารถลบโปรโมชั่นได้')
      });
    } else {
      this.isAlertOpen = false;
    }
  }
}