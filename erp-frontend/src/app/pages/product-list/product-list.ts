import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProductService } from '../../services/product';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) { }

  products: any[] = [];
  isLoadingProducts: boolean = false;

  editingId: number | null = null;
  editForm: any = {};
  isEditing: boolean = false;
  productToDelete: number | null = null;
  isAlertOpen: boolean = false;
  alertType: string = '';
  alertMessage: string = '';

  newProduct = {
    name: '',
    price: null,
    quantity: null,
    barcode: '',
    image: '',
    costUnit: null,
  };

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoadingProducts = true;

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('โหลดข้อมูลสินค้าไม่สำเร็จ:', err);
        this.isLoadingProducts = false;
      }
    });
  }

  get lowStockProducts() {
    return this.products.filter(p => p.quantity <= 5);
  }

  addProduct() {
    if (!this.newProduct.name === null || !this.newProduct.price === null || !this.newProduct.barcode === null || this.newProduct.costUnit === null || !this.newProduct.quantity === null) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    this.productService.createProduct(this.newProduct).subscribe({
      next: (res) => {
        alert('✅ เพิ่มสินค้าเข้าคลังสำเร็จ!');
        this.loadProducts();
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาด:', err);
        alert('ไม่สามารถเพิ่มสินค้าได้');
      }
    });
  }

  resetForm() {
    this.newProduct = { name: '', price: null, quantity: null, barcode: '', costUnit: null, image: '' };
  }

  editProduct(product: any) {
    this.editingId = product.id;
    this.editForm = { ...product };
    this.isEditing = true;
  }

  saveInlineEdit() {
    if (!this.editForm.name || !this.editForm.price || !this.editForm.barcode || !this.editForm.quantity || !this.editForm.costUnit) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    this.productService.updateProduct(this.editingId!, this.editForm).subscribe({
      next: () => {
        alert('✅ อัปเดตสินค้าสำเร็จ!');
        this.loadProducts();
        this.cancelEdit();
        this.isEditing = false;
        this.cdr.detectChanges()
      },
      error: (err) => console.error('อัปเดตไม่สำเร็จ:', err)
    });
  }

  deleteProduct(id: number) {
    this.productToDelete = id;
    this.alertType = 'confirm-delete';
    this.alertMessage = 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้ารหัสนี้? การกระทำนี้ไม่สามารถย้อนกลับได้';
    this.isAlertOpen = true; // สั่งเปิด Modal
  }

  // 👇 สร้างฟังก์ชันใหม่ สำหรับลบจริงๆ (เมื่อกดปุ่มสีแดงใน Modal)
  executeDelete() {
    if (this.productToDelete !== null) {
      this.productService.deleteProduct(this.productToDelete).subscribe({
        next: () => {
          this.loadProducts();
          this.closeAlert();
        },
        error: (err) => console.error('ลบไม่สำเร็จ:', err)
      });
    }
  }

  closeAlert() {
    this.isAlertOpen = false;
    this.productToDelete = null;
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm = {};
    this.isEditing = false;
  }

}
