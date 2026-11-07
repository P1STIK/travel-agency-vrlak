import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroments';
import { BookingStatus } from '../admin/admin-api.service';
import { CustomerAuthService, CustomerProfile } from './customer-auth.service';

export interface UpdateMePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  zip?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface MyBooking {
  id: string;
  code: string;
  status: BookingStatus;
  seats: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  tour: { slug: string; title: string } | null;
  departure: { date: string; returnDate: string | null; time: string | null } | null;
  passengers: { firstName: string; lastName: string }[];
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private auth = inject(CustomerAuthService);
  private base = environment.api;

  getMe() {
    return this.http.get<CustomerProfile>(`${this.base}/me`, { headers: this.auth.authHeaders() })
      .pipe(tap(customer => this.auth.setCustomer(customer)));
  }

  updateMe(payload: UpdateMePayload) {
    return this.http.patch<CustomerProfile>(`${this.base}/me`, payload, { headers: this.auth.authHeaders() })
      .pipe(tap(customer => this.auth.setCustomer(customer)));
  }

  changePassword(payload: ChangePasswordPayload) {
    return this.http.patch<{ ok: boolean }>(`${this.base}/me/password`, payload, { headers: this.auth.authHeaders() });
  }

  getMyBookings() {
    return this.http.get<MyBooking[]>(`${this.base}/me/bookings`, { headers: this.auth.authHeaders() });
  }

  deleteAccount(password: string) {
    return this.http
      .delete<{ ok: boolean }>(`${this.base}/me`, { body: { password }, headers: this.auth.authHeaders() })
      .pipe(tap(() => this.auth.clearSession()));
  }
}
