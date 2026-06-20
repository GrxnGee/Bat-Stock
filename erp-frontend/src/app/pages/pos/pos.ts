// (ก๊อปปี้ไปวางทับคลาส Poscomponent เดิมได้เลยครับ)
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';
import { CheckoutModalComponent, PaymentData } from '../../components/checkout-modal/checkout-modal';
import { CartService, PosProduct } from '../../services/cart';
import { PromotionService, Promotion } from '../../services/promotion';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent, CheckoutModalComponent],
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Poscomponent implements OnInit {

  constructor(
    public cartService: CartService,
    private cdr: ChangeDetectorRef,
    private promoService: PromotionService
  ) { }

  get products() { return this.cartService.products; }
  get cart() { return this.cartService.cart; }
  get total() { return this.cartService.total; }

  promoCodeInput: string = '';
  appliedPromo: any = null;
  discountAmount: number = 0;
  autoPromos: Promotion[] = [];

  get netTotal() {
    const net = this.total - this.discountAmount;
    return net > 0 ? net : 0;
  }

  isCheckoutOpen: boolean = false;
  isAlertOpen: boolean = false;
  alertMessage: string = '';
  alertType: string = '';
  barcodeInput: string = '';

  today: Date = new Date();
  lastPaymentData: PaymentData | null = null;
  isLoadingProducts: boolean = false;
  isSubmittingOrder: boolean = false;
  
  completedOrder: any = null; 

  ngOnInit(): void {
    this.loadProducts();
    this.loadAutoPromotions();
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.cartService.fetchProducts().subscribe({
      next: data => {
        this.cartService.products = data;
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.showAlert('warning', 'ไม่สามารถดึงข้อมูลสินค้าจากเซิร์ฟเวอร์ได้');
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAutoPromotions() {
    this.promoService.getPromotions().subscribe(res => {
      this.autoPromos = res.filter(p => p.isActive && p.isAutoApply);
    });
  }

  getPromoBadge(productId: number): string | null {
    const promo = this.autoPromos.find(p => p.applicableProductId === productId);
    if (!promo) return null;
    return promo.discountType === 'PERCENTAGE' ? `🔥 ลด ${promo.discountValue}%` : `🔥 ลด ฿${promo.discountValue}`;
  }

  addProduct(product: PosProduct) {
    const existingItem = this.cart.find(item => item.id === product.id);
    if (existingItem && existingItem.selectedQuantity >= product.quantity) {
      this.showAlert('warning', `ไม่สามารถเพิ่มได้ "${product.name}" มีจำนวนคงเหลือเพียง ${product.quantity} ชิ้น`);
      return;
    }
    if (!existingItem && product.quantity <= 0) {
      this.showAlert('warning', `สินค้า "${product.name}" หมดสต็อกแล้ว`);
      return;
    }
    this.cartService.addProduct(product);
    this.recalculatePromo();
  }

  increaseQuantity(productId: number) { this.cartService.increaseQuantity(productId); this.recalculatePromo(); }
  decreaseQuantity(productId: number) { this.cartService.decreaseQuantity(productId); this.recalculatePromo(); }
  removeItem(productId: number) { this.cartService.removeItem(productId); this.recalculatePromo(); }

  showAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  openCheckout() {
    if (this.cart.length === 0) {
      this.showAlert('warning', 'กรุณาเลือกสินค้าลงตะกร้าก่อนทำรายการชำระเงิน');
      return;
    }
    this.isCheckoutOpen = true;
  }

  onScanBarcode(barcode: string) {
    if (!barcode) return;
    const foundProduct = this.products.find(pro => pro.barcode === barcode);
    if (foundProduct) this.addProduct(foundProduct);
    else this.showAlert('error', 'ไม่พบสินค้าในระบบ');
    this.barcodeInput = '';
  }

  getTotalQuantity(): number {
    return this.cart.reduce((sum, item) => sum + item.selectedQuantity, 0);
  }

  onQuantityChange(item: any) {
    if (item.selectedQuantity == null || item.selectedQuantity < 1) item.selectedQuantity = 1;
    else if (item.selectedQuantity > item.quantity) {
      item.selectedQuantity = item.quantity;
      this.showAlert('warning', `สต็อกสินค้า "${item.name}" มีจำนวนคงเหลือเพียง ${item.quantity} ชิ้น`);
    }
    this.recalculatePromo();
  }

  applyPromoCode() {
    if (!this.promoCodeInput.trim()) return;
    this.promoService.validatePromoCode(this.promoCodeInput, this.cart).subscribe({
      next: (result) => {
        this.appliedPromo = result;
        this.discountAmount = result.calculatedDiscount;
        this.showAlert('payment-success', `ใช้โค้ดสำเร็จ! ได้รับส่วนลด ฿${this.discountAmount}`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showAlert('warning', err.error?.message || 'โค้ดส่วนลดไม่ถูกต้อง');
        this.removePromo();
        this.cdr.detectChanges();
      }
    });
  }

  removePromo() {
    this.promoCodeInput = '';
    this.appliedPromo = null;
    this.discountAmount = 0;
    this.recalculatePromo();
  }

  recalculatePromo() {
    if (this.cart.length === 0) {
      this.appliedPromo = null; this.discountAmount = 0; this.promoCodeInput = ''; return;
    }
    if (this.appliedPromo && !this.appliedPromo.isAutoApply) {
      this.promoCodeInput = this.appliedPromo.code;
      this.promoService.validatePromoCode(this.promoCodeInput, this.cart).subscribe({
        next: (result) => { this.appliedPromo = result; this.discountAmount = result.calculatedDiscount; },
        error: () => {
          this.appliedPromo = null; this.discountAmount = 0; this.promoCodeInput = '';
          this.showAlert('warning', 'ยอดเงินไม่ถึงขั้นต่ำของส่วนลด ระบบจึงยกเลิกโค้ดอัตโนมัติ');
          this.recalculatePromo();
        }
      });
    } else {
      this.promoService.checkAutoPromotion(this.cart).subscribe({
        next: (result) => {
          if (result) { this.appliedPromo = result; this.discountAmount = result.calculatedDiscount; this.promoCodeInput = ''; } 
          else { this.appliedPromo = null; this.discountAmount = 0; this.promoCodeInput = ''; }
        },
        error: () => { this.appliedPromo = null; this.discountAmount = 0; this.promoCodeInput = ''; }
      });
    }
  }

  generateReceiptNumber(): string {
    const d = this.today;
    const dateStr = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    return `ABB-${dateStr}-0001`;
  }

  printReceipt() {
    this.today = new Date();
    this.cdr.detectChanges();
    window.print();
  }

  downloadETaxPdf() {
    if (!this.completedOrder) return;
    const url = `http://localhost:3000/api/taxes/e-tax-pdf/${this.completedOrder.orderNumber}`;
    window.open(url, '_blank');
  }

  downloadETaxXml() {
    if (!this.completedOrder) return;
    const url = `http://localhost:3000/api/taxes/e-tax/${this.completedOrder.orderNumber}`;
    window.open(url, '_blank');
  }

  startNewSale() {
    this.completedOrder = null;
    this.cartService.clearCart();
    this.appliedPromo = null;
    this.discountAmount = 0;
    this.promoCodeInput = '';
    this.loadProducts();
    this.cdr.detectChanges();
  }

  processPayment(data: PaymentData): void {
    if (data.receivedAmount < this.netTotal && data.method === 'CASH') {
      this.showAlert('payment-failure', 'กรุณาใส่จำนวนเงินที่รับมาให้ครบถ้วน'); return;
    }
    if (data.method === 'TRANSFER' && !data.slipReference.trim()) {
      this.showAlert('payment-failure', 'กรุณาโอนเงินให้เรียบร้อย'); return;
    }

    const outOfStockItems = this.cart.filter(item => item.quantity < item.selectedQuantity);
    if (outOfStockItems.length > 0) {
      this.showAlert('warning', `สต็อกสินค้าไม่เพียงพอ: ${outOfStockItems.map(i => i.name).join(', ')}`); return;
    }

    this.isSubmittingOrder = true;
    this.lastPaymentData = data;
    this.cdr.detectChanges();

    const payload = {
      ...data, totalAmount: this.netTotal, discountAmount: this.discountAmount, promoCode: this.appliedPromo?.code || null
    };

    this.cartService.submitOrder(payload).subscribe({
      next: response => {
        this.isCheckoutOpen = false;
        this.isSubmittingOrder = false;
        
        this.completedOrder = response.order; 
        
        this.showAlert('payment-success', 'ชำระยอดสุทธิ ' + this.netTotal.toLocaleString() + ' บาท เรียบร้อยแล้ว');
        this.cdr.detectChanges();
      },
      error: err => {
        const errorMessage = err.error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง';
        this.showAlert('payment-failure', errorMessage);
        this.isSubmittingOrder = false;
        this.cdr.detectChanges();
      }
    });
  }
}