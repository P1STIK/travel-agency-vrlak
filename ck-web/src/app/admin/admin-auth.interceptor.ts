import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../enviroments/enviroments';
import { AdminAuthService } from './admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);
  const isAdminRequest = req.url.startsWith(`${environment.api}/admin`);
  return next(req).pipe(
    catchError(err => {
      if (isAdminRequest && err.status === 401) auth.logout();
      return throwError(() => err);
    }),
  );
};
