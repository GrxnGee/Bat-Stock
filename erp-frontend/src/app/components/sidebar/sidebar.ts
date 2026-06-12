import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { AlertModalComponent } from '../alert-modal/alert-modal';

interface MenuItem {
  title: string;
  route: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, AlertModalComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isCollapsed = false;

  isAlertOpen = false;
  alertMessage = '';
  alertType = '';

  menuItems: MenuItem[] = [
    { title: 'แดชบอร์ด', route: '/dashboard', icon: '📊', roles: ['MASTER', 'SUPER_ADMIN'] },
    { title: 'ขายสินค้า (POS)', route: '/pos', icon: '🛒', roles: ['CASHIER'] },
    { title: 'ปรับปรุงสต็อก', route: '/stock-adjust', icon: '🔧', roles: ['MASTER', 'STOCK_ADMIN'] },
    { title: 'โปรโมชั่น', route: '/promotions', icon: '🏷️', roles: ['MASTER'] },
    { title: 'จัดการพนักงาน', route: '/users', icon: '👥', roles: ['MASTER'] }, 
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  hasAccess(allowedRoles: string[]): boolean {
    const userRole = this.authService.getUserRole();
    return userRole ? allowedRoles.includes(userRole) : false;
  }

  onLogout(): void {
    this.alertType = 'confirm-logout';
    this.alertMessage = 'คุณต้องการออกจากระบบใช่หรือไม่?';
    this.isAlertOpen = true;
  }

  confirmLogout(): void {
    this.isAlertOpen = false;
    this.authService.logout();
  }
}