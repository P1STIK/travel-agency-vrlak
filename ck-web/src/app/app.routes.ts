import { Routes } from '@angular/router';
import { adminGuard, adminHomeGuard, adminRoleGuard } from './admin/admin.guard';
import { customerGuard, guestOnlyGuard } from './services/customer.guard';

export const routes: Routes = [
  // Public
  { path: 'o-nas',      loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'prihlasenie', canActivate: [guestOnlyGuard], loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registracia', canActivate: [guestOnlyGuard], loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'moj-ucet',   canActivate: [customerGuard],   loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent) },
  { path: 'kontakt',    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'ski-bus',    loadComponent: () => import('./pages/skibus/skibus.component').then(m => m.SkibusComponent) },
  { path: 'zajazdy',    loadComponent: () => import('./pages/tours/tours.component').then(m => m.ToursComponent) },
  { path: 'zajazdy/:slug', loadComponent: () => import('./pages/tour-detail/tour-detail.component').then(m => m.TourDetailComponent) },
  { path: 'checkout',   loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'thank-you',  loadComponent: () => import('./pages/thank-you/thank-you.component').then(m => m.ThankYouComponent) },
  { path: 'gdpr',       loadComponent: () => import('./pages/gdpr/gdpr.component').then(m => m.GdprComponent) },
  { path: 'cookies',    loadComponent: () => import('./pages/cookies/cookies.component').then(m => m.CookiesComponent) },
  { path: '',           loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },

  // Admin
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: 'zajazdy',         canActivate: [adminRoleGuard], loadComponent: () => import('./admin/tours/admin-tours.component').then(m => m.AdminToursComponent) },
          { path: 'zajazdy/:slug',   canActivate: [adminRoleGuard], loadComponent: () => import('./admin/tour-detail/admin-tour-detail.component').then(m => m.AdminTourDetailComponent) },
          { path: 'rezervacie',      canActivate: [adminRoleGuard], loadComponent: () => import('./admin/bookings/admin-bookings.component').then(m => m.AdminBookingsComponent) },
          { path: 'zamestnanci',     canActivate: [adminRoleGuard], loadComponent: () => import('./admin/staff/admin-staff.component').then(m => m.AdminStaffComponent) },
          { path: 'zakaznici',       canActivate: [adminRoleGuard], loadComponent: () => import('./admin/customers/admin-customers.component').then(m => m.AdminCustomersComponent) },
          { path: 'kalendar',        loadComponent: () => import('./admin/calendar/admin-calendar.component').then(m => m.AdminCalendarComponent) },
          { path: 'ucet',            loadComponent: () => import('./admin/account/admin-account.component').then(m => m.AdminAccountComponent) },
          { path: '', canActivate: [adminHomeGuard], children: [] },
        ],
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
