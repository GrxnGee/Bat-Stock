import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';
import { CheckoutModalComponent, PaymentData } from '../../components/checkout-modal/checkout-modal';
import { CartService, PosProduct } from '../../services/cart';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent, CheckoutModalComponent],
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Poscomponent implements OnInit {

  constructor(public cartService: CartService, private cdr: ChangeDetectorRef) { }

  get products() { return this.cartService.products; }
  get cart() { return this.cartService.cart; }
  get total() { return this.cartService.total; }

  isCheckoutOpen: boolean = false;
  isAlertOpen: boolean = false;
  alertMessage: string = '';
  alertType: string = '';
  barcodeInput: string = '';

  isLoadingProducts: boolean = false;
  isSubmittingOrder: boolean = false;
  ngOnInit(): void {
    this.loadProducts();
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
        console.error('ดึงข้อมูลสินค้าไม่สำเร็จ', err);
        this.showAlert('warning', 'ไม่สามารถดึงข้อมูลสินค้าจากเซิร์ฟเวอร์ได้');
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  addProduct(product: PosProduct) { this.cartService.addProduct(product); }
  increaseQuantity(productId: number) { this.cartService.increaseQuantity(productId); }
  decreaseQuantity(productId: number) { this.cartService.decreaseQuantity(productId); }
  removeItem(productId: number) { this.cartService.removeItem(productId); }

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

    if (foundProduct) {
      this.addProduct(foundProduct);
      console.log(`✅ สแกนเจอ: ${foundProduct.name} เพิ่มลงตะกร้าแล้ว!`);
    } else {
      this.showAlert('error', 'ไม่พบสินค้าในระบบ');
    }
  }

  processPayment(data: PaymentData): void {
    if (data.receivedAmount < this.total && data.method === 'CASH') {
      this.showAlert('payment-failure', 'กรุณาใส่จำนวนเงินที่รับมาให้ครบถ้วน');
      return;
    }
    if (data.method === 'TRANSFER' && !data.slipReference.trim()) {
      this.showAlert('payment-failure', 'กรุณากรอกเลขอ้างอิงสลิปการโอนเงิน');
      return;
    }

    this.isSubmittingOrder = true;

    this.cartService.submitOrder(data).subscribe({
      next: response => {
        this.isCheckoutOpen = false;
        this.showAlert('payment-success', 'ชำระยอดเงิน ' + this.total + ' บาท เรียบร้อยแล้ว');
        this.cartService.clearCart();
        this.isSubmittingOrder = false;
        this.loadProducts();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('บันทึกออเดอร์ไม่สำเร็จ', err);
        this.showAlert('payment-failure', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
        this.isSubmittingOrder = false;

        this.cdr.detectChanges();
      }
    });
  }

}

