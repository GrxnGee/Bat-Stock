import { Routes } from '@angular/router';

export const routes: Routes = [
{path:'', redirectTo: 'pos', pathMatch: 'full'},
{path: 'pos', loadComponent: () => import('./pages/pos/pos').then(m => m.Poscomponent)},
{path: 'history', loadComponent: () => import('./pages/salehistory/salehistory').then(m => m.Salehistory),},
{ path: 'product-list', loadComponent: () => import('./pages/product-list/product-list').then(m => m.ProductList),},
{ path: 'stock-adjust', loadComponent: () => import('./pages/adminpages/stock-adjust/stock-adjust').then(m => m.StockAdjust),}
];
