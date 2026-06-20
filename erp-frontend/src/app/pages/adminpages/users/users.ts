import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user';
import { AlertModalComponent } from '../../../components/alert-modal/alert-modal';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertModalComponent],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit {
  users: any[] = [];

  isFormVisible = false;
  isEditing = false;
  userForm: any = { name: '', username: '', password: '', role: 'CASHIER' };

  isAlertOpen = false;
  alertType = '';
  alertMessage = '';
  userToDeleteId: number | null = null;

  roles = [
    { value: 'MASTER', label: 'เจ้าของร้าน (Master)' },
    { value: 'STOCK_ADMIN', label: 'พนักงานคลังสินค้า (Stock Admin)' },
    { value: 'CASHIER', label: 'พนักงานขาย (Cashier)' },
    { value: 'ACCOUNTANT', label: 'พนักงานบัญชี (Accountant)' }
  ];

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('โหลดข้อมูลพนักงานไม่สำเร็จ:', err);
      }
    });
  }

  openAddForm() {
    this.isEditing = false;
    this.userForm = { name: '', username: '', password: '', role: 'CASHIER' };
    this.isFormVisible = true;
  }

  openEditForm(user: any) {
    this.isEditing = true;
    this.userForm = { ...user, password: '' };
    this.isFormVisible = true;
  }

  cancelForm() {
    this.isFormVisible = false;
  }

  saveUser() {
    if (!this.userForm.name || !this.userForm.username || (!this.isEditing && !this.userForm.password)) {
      this.showAlert('warning', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (this.isEditing) {
      const payload = { ...this.userForm };
      if (!payload.password) delete payload.password;

      this.userService.updateUser(this.userForm.id, payload).subscribe({
        next: () => {
          this.showAlert('payment-success', 'อัปเดตข้อมูลพนักงานสำเร็จ');
          this.isFormVisible = false;
          this.loadUsers();
        },
        error: (err) => this.showAlert('error', err.error?.message || 'เกิดข้อผิดพลาด')
      });
    } else {
      this.userService.createUser(this.userForm).subscribe({
        next: () => {
          this.showAlert('payment-success', 'เพิ่มพนักงานใหม่สำเร็จ');
          this.isFormVisible = false;
          this.loadUsers();
        },
        error: (err) => this.showAlert('error', err.error?.message || 'เกิดข้อผิดพลาด')
      });
    }
  }

  confirmDelete(id: number, name: string) {
    this.userToDeleteId = id;
    this.showAlert('confirm-delete', `คุณแน่ใจหรือไม่ว่าต้องการลบสิทธิ์พนักงาน: ${name}?`);
  }

  confirmAlertAction() {
    if (this.alertType === 'confirm-delete' && this.userToDeleteId) {
      this.userService.deleteUser(this.userToDeleteId).subscribe({
        next: () => {
          this.isAlertOpen = false;
          this.showAlert('payment-success', 'ลบพนักงานออกจากระบบแล้ว');
          this.loadUsers();
        },
        error: (err) => {
          this.isAlertOpen = false;
          this.showAlert('error', err.error?.message || 'ไม่สามารถลบข้อมูลได้');
        }
      });
    } else {
      this.isAlertOpen = false;
    }
  }

  showAlert(type: string, message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.isAlertOpen = true;
  }
}