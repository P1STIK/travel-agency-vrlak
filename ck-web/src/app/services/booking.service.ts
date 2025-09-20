import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  quote(body: { departureId: string; seats: number; unitPriceCents: number; addons?: any[] }) {
    return this.http.post<any>(`${this.baseUrl}/booking/quote`, body);
  }

  create(body: {
    departureId: string; tourSlug: string; email: string;
    seats: number; unitPriceCents: number;
    passengers: { firstName: string; lastName: string }[];
    addons?: any[];
  }) {
    return this.http.post<any>(`${this.baseUrl}/booking`, body);
  }

  checkoutSession(bookingId: string, returnUrl: string) {
    return this.http.post<any>(`${this.baseUrl}/booking/checkout/session`, { bookingId, returnUrl });
  }

  getBooking(id: string) {
    return this.http.get<any>(`${this.baseUrl}/booking/${id}`);
  }
}