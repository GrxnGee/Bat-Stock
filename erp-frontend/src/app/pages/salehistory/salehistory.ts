import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order';
import { SaleHistoryDetail } from '../../components/sale-history-detail/sale-history-detail';

@Component({
  selector: 'app-salehistory',
  imports: [CommonModule, SaleHistoryDetail],
  standalone: true,
  templateUrl: './salehistory.html',
  styleUrl: './salehistory.css',
})
export class Salehistory implements OnInit {

  orders: Order[] = [];
  isLoadingHistory: boolean = false;
  
  selectedOrder: any = null;
  isDetailModalOpen: boolean = false;

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ดึงข้อมูลประวัติการขายพัง:', err);
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  openOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isDetailModalOpen = true;
    this.cdr.detectChanges();
  }
}