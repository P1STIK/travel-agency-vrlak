import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../enviroments/enviroments';
import { AdminAuthService } from './admin-auth.service';

export type BookingStatus = 'PENDING' | 'PAID' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  color: string;
}

export interface Bus {
  id: string;
  name: string;
  licensePlate: string;
  color: string;
  imageUrl: string | null;
}

export interface CalendarDeparture {
  id: string;
  date: string;
  time: string | null;
  timeTo: string | null;
  tourId: string;
  unitPriceCents: number;
  capacity: number;
  bookedSeats: number;
  driverId: string | null;
  driver: Driver | null;
  busId: string | null;
  bus: Bus | null;
  tour: { slug: string; title: string };
}

export interface CalendarScheduledRide {
  id: string;
  date: string;
  time: string | null;
  timeTo: string | null;
  label: string;
  note: string | null;
  driverId: string | null;
  driver: Driver | null;
  busId: string | null;
  bus: Bus | null;
}

export interface CalendarData {
  departures: CalendarDeparture[];
  scheduledRides: CalendarScheduledRide[];
}

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

  getDrivers() {
    return this.http.get<Driver[]>(`${this.base}/drivers`, { headers: this.headers() });
  }

  getBuses() {
    return this.http.get<Bus[]>(`${this.base}/buses`, { headers: this.headers() });
  }

  getCalendar(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<CalendarData>(`${this.base}/calendar`, { headers: this.headers(), params });
  }

  assignDepartureDriver(id: string, payload: { driverId: string | null; time?: string | null; timeTo?: string | null; busId?: string | null }) {
    return this.http.patch<CalendarDeparture>(
      `${this.base}/departures/${id}/driver`, payload, { headers: this.headers() }
    );
  }

  createScheduledRide(payload: { date: string; time?: string; timeTo?: string; label: string; note?: string; driverId?: string; busId?: string }) {
    return this.http.post<CalendarScheduledRide>(`${this.base}/scheduled-rides`, payload, { headers: this.headers() });
  }

  updateScheduledRide(id: string, payload: { time?: string | null; timeTo?: string | null; label?: string; note?: string | null; driverId?: string | null; busId?: string | null }) {
    return this.http.patch<CalendarScheduledRide>(`${this.base}/scheduled-rides/${id}`, payload, { headers: this.headers() });
  }

  deleteScheduledRide(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/scheduled-rides/${id}`, { headers: this.headers() });
  }
}
