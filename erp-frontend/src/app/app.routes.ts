import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'pos', loadComponent: () => import('./pages/pos/pos').then(m => m.Poscomponent) },
  { path: 'stock-adjust', loadComponent: () => import('./pages/adminpages/stock-adjust/stock-adjust').then(m => m.StockAdjust) },
  { path: 'dashboard', loadComponent: () => import('./pages/adminpages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'promotions', loadComponent: () => import('./pages/adminpages/promotions/promotions').then(m => m.Promotions) }
];