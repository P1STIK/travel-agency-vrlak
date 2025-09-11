 import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'thank-you', loadComponent: () => import('./pages/thank-you/thank-you.component').then(m => m.ThankYouComponent) },
  { path: '', redirectTo: 'checkout', pathMatch: 'full' },  // ⬅️ presmeruj domov na checkout
  { path: '**', redirectTo: 'checkout' },
];