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
  category?: string;
}

interface MenuGroup {
  name: string;
  items: MenuItem[];
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
    { title: 'แดชบอร์ด', route: '/dashboard', icon: 'DB', roles: ['MASTER', 'SUPER_ADMIN'], category: 'ภาพรวมระบบ' },

    { title: 'ขายสินค้า (POS)', route: '/pos', icon: 'POS', roles: ['CASHIER'], category: 'ระบบหน้าร้าน' },

    { title: 'ปรับปรุงสต็อก', route: '/stock-adjust', icon: 'STK', roles: ['MASTER', 'STOCK_ADMIN'], category: 'คลังสินค้าและจัดซื้อ' },
    { title: 'สั่งซื้อสินค้า (PO)', route: '/purchase-orders', icon: 'PO', roles: ['MASTER', 'STOCK_ADMIN'], category: 'คลังสินค้าและจัดซื้อ' },

    { title: 'บัญชีเจ้าหนี้ (AP)', route: '/accounts-payable', icon: 'AP', roles: ['MASTER', 'ACCOUNTANT'], category: 'ระบบบัญชีและการเงิน' },
    { title: 'สมุดรายวัน (Income/Expense)', route: '/accounting', icon: 'GL', roles: ['MASTER', 'ACCOUNTANT'], category: 'ระบบบัญชีและการเงิน' },
    { title: 'ปิดงวดบัญชี (Close Period)', route: '/period-closing', icon: 'LOCK', roles: ['MASTER', 'ACCOUNTANT'], category: 'ระบบบัญชีและการเงิน' },

    { title: 'โปรโมชั่น', route: '/promotions', icon: 'PRO', roles: ['MASTER'], category: 'ตั้งค่าระบบ' },
    { title: 'จัดการพนักงาน', route: '/users', icon: 'USR', roles: ['MASTER'], category: 'ตั้งค่าระบบ' },
  ];
  constructor(public authService: AuthService) { }

  ngOnInit(): void { }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  hasAccess(allowedRoles: string[]): boolean {
    const userRole = this.authService.getUserRole();
    return userRole ? allowedRoles.includes(userRole) : false;
  }

  get isMaster(): boolean {
    return this.authService.getUserRole() === 'MASTER';
  }

  get masterMenuGroups(): MenuGroup[] {
    const groups: { [key: string]: MenuItem[] } = {};


    const order = ['ภาพรวมระบบ', 'ระบบหน้าร้าน', 'คลังสินค้าและจัดซื้อ', 'ระบบบัญชีและการเงิน', 'ตั้งค่าระบบ'];

    this.menuItems.forEach(item => {
      if (this.hasAccess(item.roles)) {
        const cat = item.category || 'อื่นๆ';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
    });

    return order.filter(key => groups[key]).map(key => ({
      name: key,
      items: groups[key]
    }));
  }

  get flatAccessibleMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => this.hasAccess(item.roles));
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