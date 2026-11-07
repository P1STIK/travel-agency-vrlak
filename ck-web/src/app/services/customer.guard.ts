import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerAuthService } from './customer-auth.service';

export const customerGuard: CanActivateFn = (route, state) => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/prihlasenie'], { queryParams: { returnUrl: state.url } });
};

/** Redirects an already logged-in customer away from the login/register pages. */
export const guestOnlyGuard: CanActivateFn = () => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/moj-ucet']) : true;
};
