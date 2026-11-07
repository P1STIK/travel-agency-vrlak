import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AdminAuthService);
  const router = inject(Router);
  return auth.getToken() ? true : router.createUrlTree(['/admin/login']);
};

export const adminRoleGuard: CanActivateFn = () => {
  const auth   = inject(AdminAuthService);
  const router = inject(Router);
  return auth.isAdmin() ? true : router.createUrlTree(['/admin/kalendar']);
};

export const adminHomeGuard: CanActivateFn = () => {
  const auth   = inject(AdminAuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.isAdmin() ? '/admin/zajazdy' : '/admin/kalendar']);
};
