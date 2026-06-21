import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order';

export interface PaymentData {
  method: 'CASH' | 'TRANSFER';
  receivedAmount: number;
  slipReference: string;
  changeAmount: number;
}

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-modal.html',
  styleUrl: './checkout-modal.css'
})

export class CheckoutModalComponent {
  @Input() isOpen: boolean = false;
  @Input() isProcessing: boolean = false;
  @Input() total: number = 0;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<PaymentData>();

  paymentMethod: 'CASH' | 'TRANSFER' = 'CASH';
  receivedAmount: number = 0;
  slipReference: string = '';

  qrCodeUrl: string | null = null;
  chargeId: string | null = null;
  isGeneratingQr: boolean = false;
  pollingInterval: any;

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) { }

  get changeAmount(): number {
    return this.receivedAmount - this.total;
  }


  selectPaymentMethod(method: 'CASH' | 'TRANSFER') {
    this.paymentMethod = method;

    if (method === 'TRANSFER') {
      if (this.qrCodeUrl && this.chargeId) {
        this.startPolling();
      } else {
        this.generateQrCode();
      }
    } else {
      this.stopPolling();
    }
  }

  generateQrCode() {
    this.isGeneratingQr = true;
    this.qrCodeUrl = null;

    this.orderService.generatePromptPayQr(this.total).subscribe({
      next: (res) => {
        this.qrCodeUrl = res.qrCodeUrl;
        this.chargeId = res.chargeId;
        this.isGeneratingQr = false;
        this.startPolling();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('สร้าง QR ไม่สำเร็จ:', err);
        this.isGeneratingQr = false;
        alert('ไม่สามารถเชื่อมต่อระบบจ่ายเงินได้');
      }
    });
  }

  startPolling() {
    this.pollingInterval = setInterval(() => {
      if (this.chargeId) {
        this.orderService.checkPaymentStatus(this.chargeId).subscribe({
          next: (res) => {
            if (res.status === 'successful') {
              this.stopPolling();
              this.receivedAmount = this.total;
              this.slipReference = 'PROMPTPAY-' + this.chargeId;
              this.confirmPayment();
            }
          }
        });
      }
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

  }

  closeCheckout(): void {
    this.stopPolling();

    this.qrCodeUrl = null;
    this.chargeId = null;
    this.isGeneratingQr = false;

    this.paymentMethod = 'CASH';
    this.receivedAmount = 0;
    this.slipReference = '';
    this.isProcessing = false;
    this.closed.emit();
    
  }

  confirmPayment(): void {
    this.confirmed.emit({
      method: this.paymentMethod,
      receivedAmount: this.receivedAmount,
      slipReference: this.slipReference,
      changeAmount: this.changeAmount,
    });

    this.closeCheckout();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

}