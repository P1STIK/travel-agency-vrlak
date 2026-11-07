import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroments';

const TOKEN_KEY = 'admin_token';
const STAFF_KEY = 'admin_staff';

export type StaffRole = 'ADMIN' | 'DRIVER';

export interface StaffSession {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  driverId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  staff = signal<StaffSession | null>(this.readStaff());
  isAdmin = computed(() => this.staff()?.role === 'ADMIN');
  driverId = computed(() => this.staff()?.driverId ?? null);

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string; staff: StaffSession }>(`${environment.api}/auth/staff/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          localStorage.setItem(STAFF_KEY, JSON.stringify(res.staff));
          this.staff.set(res.staff);
        }),
      );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STAFF_KEY);
    this.staff.set(null);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setStaff(staff: StaffSession) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
    this.staff.set(staff);
  }

  private readStaff(): StaffSession | null {
    const raw = localStorage.getItem(STAFF_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffSession;
    } catch {
      return null;
    }
  }
}
