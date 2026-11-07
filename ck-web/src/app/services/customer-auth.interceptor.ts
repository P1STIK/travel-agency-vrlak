import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../enviroments/enviroments';
import { CustomerAuthService } from './customer-auth.service';

export const customerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  const isMeRequest = req.url.startsWith(`${environment.api}/me`);
  return next(req).pipe(
    catchError(err => {
      if (isMeRequest && err.status === 401) {
        auth.clearSession();
        router.navigate(['/prihlasenie']);
      }
      return throwError(() => err);
    }),
  );
};
