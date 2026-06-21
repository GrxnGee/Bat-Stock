import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'pos', loadComponent: () => import('./pages/pos/pos').then(m => m.Poscomponent) },
  { path: 'stock-adjust', loadComponent: () => import('./pages/adminpages/stock-adjust/stock-adjust').then(m => m.StockAdjust) },
  { path: 'dashboard', loadComponent: () => import('./pages/adminpages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'promotions', loadComponent: () => import('./pages/adminpages/promotions/promotions').then(m => m.Promotions) },
  { path: 'purchase-orders', loadComponent: () => import('./pages/adminpages/purchase-orders/purchase-orders').then(m => m.PurchaseOrdersComponent) },
  { path: 'accounts-payable', loadComponent: () => import('./pages/adminpages/accounts-payable/accounts-payable').then(m => m.AccountsPayableComponent) },
  { path: 'users', loadComponent: () => import('./pages/adminpages/users/users').then(m => m.UsersComponent) },
  { path: 'accounting', loadComponent: () => import('./pages/adminpages/accounting/accounting').then(m => m.AccountingComponent) },
  { path: 'period-closing', loadComponent: () => import('./pages/adminpages/period-closing/period-closing').then(m => m.PeriodClosing) },
];