import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroments';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${environment.api}/auth/login`, { username, password })
      .pipe(
        tap(res => localStorage.setItem(TOKEN_KEY, res.access_token)),
      );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
