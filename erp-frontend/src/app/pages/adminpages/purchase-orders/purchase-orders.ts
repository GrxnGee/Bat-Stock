import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../../services/purchase-order';
import { SupplierService, Supplier } from '../../../services/supplier';
import { ProductService } from '../../../services/product';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css'
})
export class PurchaseOrdersComponent implements OnInit {
  activeTab: 'LIST' | 'CREATE' = 'LIST';

  purchaseOrders: any[] = [];
  suppliers: Supplier[] = [];
  products: any[] = [];

  newPO: any = {
    supplierId: null,
    expectedDeliveryDate: '',
    paymentType: 'CASH',
    supplierTaxInvoiceNo: '', 
    supplierTaxInvoiceDate: '', 
    whtRate: 0, 
    items: []
  };

  isAlertOpen = false;
  alertType = '';
  alertMessage = '';
  actionTargetId: number | null = null;
  actionTargetStatus: string = '';

  constructor(
    private poService: PurchaseOrderService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadSuppliers();
    this.loadPOs();
    this.loadProducts();
    this.cdr.detectChanges();
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }

  switchTab(tab: 'LIST' | 'CREATE') {
    this.activeTab = tab;
    if (tab === 'CREATE' && this.newPO.items.length === 0) {
      this.addItemRow();
    }
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(res => {
      this.suppliers = res;
      this.loadPOs();
    });
  }

  loadPOs() {
    this.poService.getPOs().subscribe(res => {
      this.purchaseOrders = res.map(po => ({
        ...po,
        supplierName: this.suppliers.find(s => s.id === po.supplierId)?.name || 'ไม่ทราบชื่อ'
      }));
      this.cdr.detectChanges();
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => this.products = res);
  }

  get filteredProducts() {
    if (!this.newPO.supplierId) return [];
    return this.products.filter(p => p.supplierId === this.newPO.supplierId);
  }

  onSupplierChange() {
    this.newPO.items = [];
    this.addItemRow(); 

    const selectedSupplier = this.suppliers.find(s => s.id === this.newPO.supplierId);
    
    if (selectedSupplier && selectedSupplier.leadTimeDays) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + selectedSupplier.leadTimeDays);
      this.newPO.expectedDeliveryDate = expectedDate.toISOString().split('T')[0];
    } else {
      this.newPO.expectedDeliveryDate = '';
    }
  }

  addItemRow() {
    this.newPO.items.push({ productId: null, quantity: 1, unitCost: 0, lotNumber: '', expirationDate: '' });
  }

  removeItemRow(index: number) {
    this.newPO.items.splice(index, 1);
  }

  onProductSelect(item: any) {
    const prod = this.products.find(p => p.id === item.productId);
    if (prod) {
      item.unitCost = prod.costUnit || 0;
    }
  }

  calculateTotal(): number {
    return this.newPO.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);
  }

  submitPO() {
    if (!this.newPO.supplierId) {
      this.showAlert('warning', 'กรุณาเลือกผู้จัดจำหน่าย (Supplier)');
      return;
    }
    if (this.newPO.items.length === 0 || this.newPO.items.some((i: any) => !i.productId || i.quantity < 1)) {
      this.showAlert('warning', 'กรุณาเลือกสินค้าและระบุจำนวนให้ถูกต้อง');
      return;
    }

    const cleanedItems = this.newPO.items.map((item: any) => ({
      ...item,
      lotNumber: item.lotNumber && item.lotNumber.trim() !== '' ? item.lotNumber : undefined,
      expirationDate: item.expirationDate && item.expirationDate.trim() !== '' ? item.expirationDate : undefined
    }));

    const payload = {
      supplierId: this.newPO.supplierId,
      expectedDeliveryDate: this.newPO.expectedDeliveryDate || null,
      paymentType: this.newPO.paymentType,
      supplierTaxInvoiceNo: this.newPO.supplierTaxInvoiceNo || null, 
      supplierTaxInvoiceDate: this.newPO.supplierTaxInvoiceDate || null, 
      whtRate: Number(this.newPO.whtRate) || 0,
      totalAmount: this.calculateTotal(),
      items: cleanedItems
    };

    this.poService.createPO(payload).subscribe({
      next: () => {
        this.showAlert('payment-success', 'สร้างใบสั่งซื้อสำเร็จ!');
        this.newPO = { supplierId: null, expectedDeliveryDate: '', paymentType: 'CASH', supplierTaxInvoiceNo: '', supplierTaxInvoiceDate: '', whtRate: 0, items: [] };
        this.switchTab('LIST');
        this.loadPOs();
      },
      error: () => this.showAlert('error', 'ไม่สามารถสร้างใบสั่งซื้อได้')
    });
  }

  confirmStatusUpdate(id: number, status: string, title: string) {
    this.actionTargetId = id;
    this.actionTargetStatus = status;

    const modalType = status === 'COMPLETED' ? 'confirm-receive' : 'confirm-cancel-po';
    this.showAlert(modalType, `คุณแน่ใจหรือไม่ที่จะ ${title} ?`);
  }

  confirmAlertAction() {
    if (this.actionTargetId && (this.alertType === 'confirm-receive' || this.alertType === 'confirm-cancel-po')) {
      this.poService.updateStatus(this.actionTargetId, this.actionTargetStatus).subscribe({
        next: (res) => {
          this.isAlertOpen = false;
          this.showAlert('payment-success', res.message || 'ทำรายการสำเร็จ');
          this.loadPOs();
          this.actionTargetId = null;
        },
        error: (err) => {
          this.isAlertOpen = false;
          this.showAlert('error', err.error?.message || 'เกิดข้อผิดพลาด');
        }
      });
    } else {
      this.isAlertOpen = false;
    }
  }

  printPO(poNumber: string) {
    const url = `http://localhost:3000/api/purchase-orders/pdf/${poNumber}`;
    window.open(url, '_blank');
  }

  printWHT(poNumber: string) {
    const url = `http://localhost:3000/api/taxes/wht-pdf/${poNumber}`;
    window.open(url, '_blank');
  }
}