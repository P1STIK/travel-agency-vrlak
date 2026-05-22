import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) auth.logout();
      return throwError(() => err);
    }),
  );
};
