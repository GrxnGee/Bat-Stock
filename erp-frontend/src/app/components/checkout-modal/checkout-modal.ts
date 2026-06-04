import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


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
  @Input() total: number = 0;

  @Output() canceled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<PaymentData>();

  paymentMethod: 'CASH' | 'TRANSFER' = 'CASH';
  receivedAmount: number = 0;
  slipReference: string = '';

  @Input() isProcessing: boolean = false;


  get changeAmount(): number {
    return this.receivedAmount - this.total;
  }

  closeCheckout(): void {
    this.paymentMethod = 'CASH';
    this.receivedAmount = 0;
    this.slipReference = '';
    this.isProcessing = false;
    this.canceled.emit();
  }

  confirmPayment(): void {
    this.confirmed.emit({
      method: this.paymentMethod,
      receivedAmount: this.receivedAmount,
      slipReference: this.slipReference,
      changeAmount: this.changeAmount,
    });
  }

}