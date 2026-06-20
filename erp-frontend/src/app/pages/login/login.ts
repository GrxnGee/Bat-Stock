import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  usernameInput: string = '';
  passwordInput: string = '';
  
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    if (this.authService.isLoggedIn()) {
      this.redirectByUserRole();
    }
  }

  onSubmitLogin() {
    if (!this.usernameInput.trim() || !this.passwordInput.trim()) {
      this.errorMessage = '❌ กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.login(this.usernameInput, this.passwordInput).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.redirectByUserRole();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || '❌ เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
         this.cdr.detectChanges();
      }
    });
  }

  private redirectByUserRole() {
    const role = this.authService.getUserRole();
    
    if (role === 'CASHIER') {
      this.router.navigate(['/pos']);
    } else if (role === 'MASTER' || role === 'SUPER_ADMIN') {
      this.router.navigate(['/dashboard']); 
    } else if (role === 'STOCK_ADMIN') {
      this.router.navigate(['/stock-adjust']);
    } else if (role === 'ACCOUNTANT') {

      this.router.navigate(['/accounting']); 
    } else {

      this.router.navigate(['/dashboard']);
    }
  }
}