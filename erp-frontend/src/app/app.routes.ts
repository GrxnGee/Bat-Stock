import { Routes } from '@angular/router';

export const routes: Routes = [
{path:'', redirectTo: 'pos', pathMatch: 'full'},
{path: 'pos', loadComponent: () => import('./pages/pos/pos').then(m => m.Poscomponent)},
{path: 'history', loadComponent: () => import('./pages/salehistory/salehistory').then(m => m.Salehistory),}
];
