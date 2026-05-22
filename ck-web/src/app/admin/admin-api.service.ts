import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../enviroments/enviroments';
import { AdminAuthService } from './admin-auth.service';

export type BookingStatus = 'PENDING' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export interface AdminDeparture {
  id: string;
  date: string;
  unitPriceCents: number;
  capacity: number;
  bookedSeats: number;
  tourId: string;
}

export interface AdminTour {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  teaser: string | null;
  currency: string;
  heroImage: string | null;
  departures: AdminDeparture[];
}

export interface AdminPassenger {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AdminBooking {
  id: string;
  code: string;
  tourSlug: string;
  email: string;
  seats: number;
  unitPriceCents: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  passengers: AdminPassenger[];
  departure: { date: string; unitPriceCents: number; capacity: number } | null;
}

export interface AdminDetailBooking {
  id: string;
  code: string;
  email: string;
  seats: number;
  unitPriceCents: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  passengers: AdminPassenger[];
}

export interface AdminDetailDeparture {
  id: string;
  date: string;
  unitPriceCents: number;
  capacity: number;
  bookedSeats: number;
  bookings: AdminDetailBooking[];
}

export interface AdminTourDetail extends Omit<AdminTour, 'departures'> {
  description: string | null;
  thumbImage: string | null;
  departures: AdminDetailDeparture[];
}

export interface ManualBookingPayload {
  departureId: string;
  tourSlug: string;
  email: string;
  seats: number;
  unitPriceCents?: number;
  passengers: { firstName: string; lastName: string }[];
}

export interface CreateTourPayload {
  slug: string;
  title: string;
  category?: string;
  teaser?: string;
  description?: string;
  currency?: string;
  heroImage?: string;
  thumbImage?: string;
  departures?: { date: string; unitPriceCents: number; capacity: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private auth = inject(AdminAuthService);
  private base = `${environment.api}/admin`;

  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getTours() {
    return this.http.get<AdminTour[]>(`${this.base}/tours`, { headers: this.headers() });
  }

  getTourDetail(slug: string) {
    return this.http.get<AdminTourDetail>(`${this.base}/tours/${slug}`, { headers: this.headers() });
  }

  createTour(payload: CreateTourPayload) {
    return this.http.post<AdminTour>(`${this.base}/tours`, payload, { headers: this.headers() });
  }

  getBookings(tourSlug?: string) {
    const params = tourSlug ? new HttpParams().set('tourSlug', tourSlug) : {};
    return this.http.get<AdminBooking[]>(`${this.base}/bookings`, { headers: this.headers(), params });
  }

  createManualBooking(payload: ManualBookingPayload) {
    return this.http.post<AdminBooking>(`${this.base}/bookings/manual`, payload, { headers: this.headers() });
  }
}
