import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-history-detail',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './sale-history-detail.html',
  styleUrl: './sale-history-detail.css',
})
export class SaleHistoryDetail {

  @Input() order: any = null;
  @Input() isOpen: boolean = false;
  
  @Output() closed = new EventEmitter<void>();

  closeModal() {
    this.closed.emit();
  }

}