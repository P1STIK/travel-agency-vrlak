 import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'zajazdy', loadComponent: () => import('./pages/tours/tours.component').then(m => m.ToursComponent) },
  { path: 'zajazdy/:slug', loadComponent: () => import('./pages/tour-detail/tour-detail.component').then(m => m.TourDetailComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'thank-you', loadComponent: () => import('./pages/thank-you/thank-you.component').then(m => m.ThankYouComponent) },
  { path: '', redirectTo: 'zajazdy', pathMatch: 'full' },
  { path: '**', redirectTo: 'zajazdy' }
];