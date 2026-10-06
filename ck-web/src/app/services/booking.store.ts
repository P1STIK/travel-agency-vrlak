import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { BookingService, CreateBookingPayload } from './booking.service';

// Provided per-component (checkout.component.ts), NOT root — bookingId/quote/error
// must reset when the user starts a fresh checkout, not persist across navigations.
@Injectable()
export class BookingStore {
  private api = inject(BookingService);

  readonly quote = signal<any>(null);
  readonly bookingId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  fetchQuote(departureId: string, seats: number, unitPriceCents: number) {
    this.api.quote({ departureId, seats, unitPriceCents }).subscribe({
      next: q => this.quote.set(q),
    });
  }

  createBooking(payload: CreateBookingPayload, insuranceFiles: (File | null)[]): Observable<void> {
    this.loading.set(true);
    this.error.set('');

    return this.api.create(payload).pipe(
      switchMap(res => {
        this.bookingId.set(res.bookingId);
        return this.uploadInsuranceDocuments(res.bookingId, res.passengers ?? [], insuranceFiles);
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Rezerváciu sa nepodarilo vytvoriť.');
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  private uploadInsuranceDocuments(
    bookingId: string,
    createdPassengers: { id: string }[],
    files: (File | null)[],
  ): Observable<void> {
    const uploads = createdPassengers.map((p, i) =>
      files[i] ? this.api.uploadInsuranceDocument(bookingId, p.id, files[i]!) : of(null)
    );
    if (!uploads.length) return of(void 0);

    return forkJoin(uploads).pipe(
      switchMap(() => of(void 0)),
      // Rezervácia je už vytvorená — upload zlyhania nemajú zrušiť celý flow, len upozorniť.
      catchError(() => {
        this.error.set('Rezervácia bola vytvorená, ale nepodarilo sa nahrať niektorý poistný dokument.');
        return of(void 0);
      }),
    );
  }

  pay(returnUrl: string): Observable<{ checkoutUrl: string }> {
    this.loading.set(true);
    this.error.set('');
    return this.api.checkoutSession(this.bookingId()!, returnUrl).pipe(
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.error.set('Nepodarilo sa spustiť platbu.');
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }
}
