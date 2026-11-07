import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroments';

const TOKEN_KEY = 'customer_token';
const PROFILE_KEY = 'customer_profile';

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  createdAt: string;
}

export interface RegisterCustomerPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  street?: string;
  city?: string;
  zip?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.api;

  customer = signal<CustomerProfile | null>(this.readProfile());
  isLoggedIn = computed(() => !!this.customer());

  register(payload: RegisterCustomerPayload) {
    return this.http
      .post<{ access_token: string; customer: CustomerProfile }>(`${this.base}/auth/customer/register`, payload)
      .pipe(tap(res => this.storeSession(res.access_token, res.customer)));
  }

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string; customer: CustomerProfile }>(`${this.base}/auth/customer/login`, { email, password })
      .pipe(tap(res => this.storeSession(res.access_token, res.customer)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.customer.set(null);
    this.router.navigate(['/']);
  }

  /** Clears the local session without navigating — used by the 401 interceptor, which does its own navigation. */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.customer.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setCustomer(customer: CustomerProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(customer));
    this.customer.set(customer);
  }

  authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  private storeSession(token: string, customer: CustomerProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    this.setCustomer(customer);
  }

  private readProfile(): CustomerProfile | null {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CustomerProfile;
    } catch {
      return null;
    }
  }
}
