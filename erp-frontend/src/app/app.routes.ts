import { Routes } from '@angular/router';

export const routes: Routes = [
{path:'', redirectTo: 'pos', pathMatch: 'full'},
{path: 'pos', loadComponent: () => import('./pages/pos/pos').then(m => m.Poscomponent)},
{ path: 'stock-adjust', loadComponent: () => import('./pages/adminpages/stock-adjust/stock-adjust').then(m => m.StockAdjust),},
{ path: 'dashboard', loadComponent: () => import('./pages/adminpages/dashboard/dashboard').then(m => m.Dashboard) }
];
