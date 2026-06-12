import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product';
import { SupplierService, Supplier } from '../../../services/supplier';
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

  constructor(private productService: ProductService, private supplierService: SupplierService, private cdr: ChangeDetectorRef) { }

  activeTab: 'PRODUCT' | 'STOCK' | 'SUPPLIER' = 'PRODUCT';


  editingProductId: number | null = null;
  editProductForm: any = {};
  productToDeleteId: number | null = null;
  newProduct = { name: '', price: null as number | null, quantity: null as number | null, barcode: '', image: '', costUnit: null as number | null };

  products: Product[] = [];
  isLoadingProducts: boolean = false;
  isSubmitting: boolean = false;
  searchQuery: string = '';
  selectedProduct: Product | null = null;
  adjustType: 'IN' | 'OUT' = 'OUT';
  adjustQty: number = 1;
  adjustReason: string = 'DAMAGED';
  adjustNote: string = '';

  reasons = [
    { code: 'DAMAGED', label: 'สินค้าชำรุด/เสียหาย (Damaged)', type: 'OUT' },
    { code: 'LOST', label: 'สินค้าสูญหาย (Lost)', type: 'OUT' },
    { code: 'EXPIRED', label: 'สินค้าหมดอายุ (Expired)', type: 'OUT' },
    { code: 'STOCK_TAKE_DEFICIT', label: 'ตรวจนับสต็อก: ขาดหาย (Stock Deficit)', type: 'OUT' },
    { code: 'STOCK_TAKE_SURPLUS', label: 'ตรวจนับสต็อก: เกินมา (Stock Surplus)', type: 'IN' },
    { code: 'RETURN_TO_VENDOR', label: 'ส่งคืนผู้จำหน่าย (Return)', type: 'OUT' }
  ];

  suppliers: Supplier[] = [];
  isSupplierFormVisible: boolean = false;
  isEditingSupplier: boolean = false;
  supplierForm: Supplier = { name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '' };
  supplierToDeleteId: number | null = null;

  isAlertOpen: boolean = false;
  alertType: string = '';
  alertMessage: string = '';
  deleteTarget: 'PRODUCT' | 'SUPPLIER' | null = null;

  isAddProductFormVisible: boolean = false;

  openAddProductForm() {
    this.newProduct = { name: '', price: null, quantity: null, barcode: '', costUnit: null, image: '' };
    this.isAddProductFormVisible = true;
  }

  cancelAddProductForm() {
    this.isAddProductFormVisible = false;
  }

  ngOnInit(): void {
    this.loadProducts();
  }


  switchTab(tab: 'PRODUCT' | 'STOCK' | 'SUPPLIER') {
    this.activeTab = tab;
    if (tab === 'SUPPLIER' && this.suppliers.length === 0) {
      this.loadSuppliers();
    }
  }

  showAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }


  get lowStockProducts() {
    return this.products.filter(p => p.quantity <= 5);
  }

  addProduct() {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.barcode || this.newProduct.costUnit === null || this.newProduct.quantity === null) {
      this.showAlert('warning', 'กรุณากรอกข้อมูลสินค้าให้ครบถ้วน');
      return;
    }

    this.productService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.showAlert('payment-success', 'เพิ่มสินค้าเข้าคลังสำเร็จ!');
        this.loadProducts();
        this.newProduct = { name: '', price: null, quantity: null, barcode: '', costUnit: null, image: '' };
        this.cdr.detectChanges();
      },
      error: () => this.showAlert('error', 'ไม่สามารถเพิ่มสินค้าได้')
    });
  }

  editProductData(product: Product) {
    this.editingProductId = product.id;
    this.editProductForm = { ...product };
  }

  saveInlineEditProduct() {
    if (!this.editProductForm.name || !this.editProductForm.price || !this.editProductForm.barcode || this.editProductForm.quantity === null || this.editProductForm.costUnit === null) {
      this.showAlert('warning', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    this.productService.updateProduct(this.editingProductId!, this.editProductForm).subscribe({
      next: () => {
        this.showAlert('payment-success', 'อัปเดตสินค้าสำเร็จ!');
        this.loadProducts();
        this.editingProductId = null;
        this.cdr.detectChanges();
      },
      error: () => this.showAlert('error', 'อัปเดตไม่สำเร็จ')
    });
  }

  cancelEditProduct() {
    this.editingProductId = null;
    this.editProductForm = {};
  }

  confirmDeleteProduct(id: number, name: string) {
    this.deleteTarget = 'PRODUCT';
    this.productToDeleteId = id;
    this.showAlert('confirm-delete', `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า: ${name}?`);
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProducts = false;
      }
    });
  }

  searchProduct() {
    const found = this.products.find(p => p.barcode === this.searchQuery || p.name.includes(this.searchQuery));
    this.selectedProduct = found || null;
    if (!this.selectedProduct) this.showAlert('warning', 'ไม่พบสินค้าในระบบ');
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.searchQuery = product.barcode;
  }

  getFilteredReasons() { return this.reasons.filter(r => r.type === this.adjustType); }

  onAdjustTypeChange() {
    const availableReasons = this.getFilteredReasons();
    this.adjustReason = availableReasons.length > 0 ? availableReasons[0].code : '';
  }

  submitAdjustment() {
    if (!this.selectedProduct) return;
    if (this.adjustQty <= 0) { this.showAlert('warning', 'กรุณาระบุจำนวนที่ต้องการปรับปรุงให้ถูกต้อง'); return; }

    let newQuantity = this.selectedProduct.quantity;
    if (this.adjustType === 'IN') newQuantity += this.adjustQty;
    else {
      if (this.adjustQty > this.selectedProduct.quantity) { this.showAlert('warning', 'จำนวนที่ต้องการหักออก มีมากกว่าสต็อกคงเหลือ!'); return; }
      newQuantity -= this.adjustQty;
    }

    const totalCostChanged = this.adjustQty * this.selectedProduct.costUnit;
    this.isSubmitting = true;

    this.productService.updateProduct(this.selectedProduct.id, { quantity: newQuantity }).subscribe({
      next: () => {
        this.showAlert('payment-success', `ปรับปรุงสต็อกสำเร็จ! สต็อกล่าสุดคือ ${newQuantity} ชิ้น (มูลค่าทุนเปลี่ยนแปลง: ฿${totalCostChanged.toLocaleString()})`);
        this.selectedProduct!.quantity = newQuantity;
        this.selectedProduct = null; this.searchQuery = ''; this.adjustQty = 1; this.adjustNote = ''; this.isSubmitting = false;
        this.loadProducts();
      },
      error: () => { this.showAlert('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'); this.isSubmitting = false; }
    });
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe({
      next: (data) => { this.suppliers = data; this.cdr.detectChanges(); }
    });
  }

  openAddSupplierForm() {
    this.isEditingSupplier = false;
    this.supplierForm = { name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '' };
    this.isSupplierFormVisible = true;
  }

  openEditSupplierForm(supplier: Supplier) {
    this.isEditingSupplier = true;
    this.supplierForm = { ...supplier };
    this.isSupplierFormVisible = true;
  }

  cancelSupplierForm() { this.isSupplierFormVisible = false; }

  saveSupplier() {
    if (!this.supplierForm.name.trim()) { this.showAlert('warning', 'กรุณากรอกชื่อบริษัท/ผู้จัดจำหน่าย'); return; }

    if (this.isEditingSupplier && this.supplierForm.id) {
      this.supplierService.updateSupplier(this.supplierForm.id, this.supplierForm).subscribe({
        next: () => { this.showAlert('payment-success', 'อัปเดตข้อมูลสำเร็จ'); this.isSupplierFormVisible = false; this.loadSuppliers(); }
      });
    } else {
      this.supplierService.addSupplier(this.supplierForm).subscribe({
        next: () => { this.showAlert('payment-success', 'เพิ่มผู้จัดจำหน่ายใหม่สำเร็จ'); this.isSupplierFormVisible = false; this.loadSuppliers(); }
      });
    }
  }

  confirmDeleteSupplier(id: number, name: string) {
    this.deleteTarget = 'SUPPLIER';
    this.supplierToDeleteId = id;
    this.showAlert('confirm-delete', `คุณแน่ใจหรือไม่ว่าต้องการลบผู้จัดจำหน่าย: ${name}?`);
  }

  confirmAlertAction() {
    if (this.alertType === 'confirm-delete') {
      if (this.deleteTarget === 'SUPPLIER' && this.supplierToDeleteId) {
        this.supplierService.deleteSupplier(this.supplierToDeleteId).subscribe({
          next: () => { this.isAlertOpen = false; this.showAlert('payment-success', 'ลบผู้จัดจำหน่ายเรียบร้อยแล้ว'); this.loadSuppliers(); },
          error: () => this.showAlert('error', 'ไม่สามารถลบข้อมูลได้')
        });
      } else if (this.deleteTarget === 'PRODUCT' && this.productToDeleteId) {
        this.productService.deleteProduct(this.productToDeleteId).subscribe({
          next: () => { this.isAlertOpen = false; this.showAlert('payment-success', 'ลบสินค้าเรียบร้อยแล้ว'); this.loadProducts(); },
          error: () => this.showAlert('error', 'ไม่สามารถลบข้อมูลได้')
        });
      }
    }
  }
}