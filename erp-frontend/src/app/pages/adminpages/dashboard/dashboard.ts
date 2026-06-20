import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../services/order';
import { ProductService } from '../../../services/product';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';
import { SaleHistoryDetail } from '../../../components/sale-history-detail/sale-history-detail';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  costUnit: number;
}

interface TopProduct extends Product {
  soldQuantity: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AlertModalComponent, SaleHistoryDetail, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  constructor(
    private productService: ProductService, 
    private orderService: OrderService, 
    private cdr: ChangeDetectorRef
  ) { }

  products: Product[] = [];
  isLoadingData: boolean = false;
  isAlertOpen: boolean = false;
  alertType: string = '';
  alertMessage: string = '';
  todaySales: number = 0;
  todayOrders: number = 0;
  lowStockCount: number = 0;
  topProducts: TopProduct[] = [];
  maxSoldQuantity: number = 0;
  orders: Order[] = [];
  selectedOrder: any = null;
  isDetailModalOpen: boolean = false;
  filteredOrders: Order[] = [];
  searchDate: string = ''; 

  suggestions: any[] = [];
  isLoadingSuggestions: boolean = true;

  ngOnInit(): void {

    this.loadDashboardData();
    this.loadSmartSuggestions();
  }

  showAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  isToday(dateString: string | Date): boolean {
    const today = new Date();
    const targetDate = new Date(dateString);
    return targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear();
  }

  loadDashboardData(): void {
    this.isLoadingData = true;

    this.productService.getProducts().subscribe({
      next: (productsData) => {
        this.products = productsData;
        this.lowStockCount = this.products.filter(p => p.quantity <= 10).length;

        this.orderService.getOrders().subscribe({
          next: (orderResponse) => {
            const allOrders: Order[] = orderResponse;
            this.orders = allOrders;
            this.filteredOrders = allOrders;
            this.processSalesData(allOrders);

            this.isLoadingData = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('ดึงข้อมูลออเดอร์ไม่สำเร็จ', err);
            this.showAlert('error', 'ไม่สามารถดึงข้อมูลประวัติการขายได้');
            this.isLoadingData = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('ดึงข้อมูลสินค้าไม่สำเร็จ', err);
        this.showAlert('error', 'ไม่สามารถดึงข้อมูลสินค้าจากเซิร์ฟเวอร์ได้');
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  processSalesData(allOrders: Order[]): void {
    const todaysOrders = allOrders.filter(order => this.isToday(order.createdAt));

    this.todayOrders = todaysOrders.length;
    this.todaySales = todaysOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const productSalesMap = new Map<number, { soldQuantity: number, revenue: number }>();

    todaysOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const currentData = productSalesMap.get(item.productId) || { soldQuantity: 0, revenue: 0 };
          currentData.soldQuantity += Number(item.quantity);
          currentData.revenue += (Number(item.quantity) * Number(item.price));
          productSalesMap.set(item.productId, currentData);
        });
      }
    });

    const topProductsTemp: TopProduct[] = [];
    productSalesMap.forEach((salesData, productId) => {
      const productDetail = this.products.find(p => p.id === productId);
      if (productDetail) {
        topProductsTemp.push({
          ...productDetail,
          soldQuantity: salesData.soldQuantity,
          revenue: salesData.revenue
        });
      }
    });

    topProductsTemp.sort((a, b) => b.soldQuantity - a.soldQuantity);
    this.topProducts = topProductsTemp.slice(0, 5);

    if (this.topProducts.length > 0) {
      this.maxSoldQuantity = Math.max(...this.topProducts.map(p => p.soldQuantity));
    } else {
      this.maxSoldQuantity = 0;
    }
  }

  calculateBarWidth(sold: number): string {
    if (this.maxSoldQuantity === 0) return '0%';
    const percent = (sold / this.maxSoldQuantity) * 100;
    return `${percent}%`;
  }

  filterOrdersByDate(): void {
    if (!this.searchDate) {
      this.filteredOrders = [...this.orders]; 
      return;
    }

    this.filteredOrders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const formattedOrderDate = `${year}-${month}-${day}`;
      return formattedOrderDate === this.searchDate;
    });
  }

  clearFilter(): void {
    this.searchDate = '';
    this.filteredOrders = [...this.orders];
  }

  openOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isDetailModalOpen = true;
    this.cdr.detectChanges();
  }

  loadSmartSuggestions() {
    this.isLoadingSuggestions = true;
    this.productService.getSmartSuggestions().subscribe({
      next: (res) => {
        this.suggestions = res.data || [];
        this.isLoadingSuggestions = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ไม่สามารถโหลดข้อมูลคำนวณได้:', err);
        this.isLoadingSuggestions = false;
        this.cdr.detectChanges();
      }
    });
  }

  get reorderItems() {
    return this.suggestions.filter(s => s.status === 'REORDER_NOW');
  }

  get warningItems() {
    return this.suggestions.filter(s => s.status === 'WARNING');
  }
}