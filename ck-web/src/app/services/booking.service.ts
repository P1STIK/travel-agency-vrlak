import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CustomerAuthService } from './customer-auth.service';

export interface PassengerInput {
  firstName: string; lastName: string;
  birthDate?: string; nationalId?: string;
  street?: string; city?: string; zip?: string;
  phone?: string; email?: string;
}

export interface CreateBookingPayload {
  departureId: string; tourSlug: string; email: string;
  seats: number; unitPriceCents: number;
  passengers: PassengerInput[];
  addons?: any[];
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private baseUrl = '/api';
  private customerAuth = inject(CustomerAuthService);

  constructor(private http: HttpClient) {}

  quote(body: { departureId: string; seats: number; unitPriceCents: number; addons?: any[] }) {
    return this.http.post<any>(`${this.baseUrl}/booking/quote`, body);
  }

  create(body: CreateBookingPayload) {
    const token = this.customerAuth.getToken();
    const headers = token ? this.customerAuth.authHeaders() : undefined;
    return this.http.post<any>(`${this.baseUrl}/booking`, body, headers ? { headers } : {});
  }

  uploadInsuranceDocument(bookingId: string, passengerId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/booking/${bookingId}/passengers/${passengerId}/insurance-document`, form);
  }

  checkoutSession(bookingId: string, returnUrl: string) {
    return this.http.post<any>(`${this.baseUrl}/booking/checkout/session`, { bookingId, returnUrl });
  }

  getBooking(id: string) {
    return this.http.get<any>(`${this.baseUrl}/booking/${id}`);
  }
}