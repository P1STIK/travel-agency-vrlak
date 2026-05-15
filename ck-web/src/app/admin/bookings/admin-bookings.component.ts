import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminBooking, AdminTour, ManualBookingPayload } from '../admin-api.service';

@Component({
  selector: 'app-admin-bookings',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.css',
})
export class AdminBookingsComponent implements OnInit {
  private api = inject(AdminApiService);

  bookings  = signal<AdminBooking[]>([]);
  tours     = signal<AdminTour[]>([]);
  loading   = signal(true);
  showForm  = signal(false);
  saving    = signal(false);
  error     = signal('');
  filterSlug = signal('');

  form: ManualBookingPayload = this.emptyForm();

  ngOnInit() {
    this.api.getTours().subscribe(t => this.tours.set(t));
    this.loadBookings();
  }

  loadBookings() {
    this.loading.set(true);
    this.api.getBookings(this.filterSlug() || undefined).subscribe({
      next: b => { this.bookings.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyForm(): ManualBookingPayload {
    return { departureId: '', tourSlug: '', email: '', seats: 1, passengers: [{ firstName: '', lastName: '' }] };
  }

  get selectedTour(): AdminTour | undefined {
    return this.tours().find(t => t.slug === this.form.tourSlug);
  }

  addPassenger() { this.form.passengers.push({ firstName: '', lastName: '' }); }
  removePassenger(i: number) { this.form.passengers.splice(i, 1); }

  submit() {
    this.saving.set(true);
    this.error.set('');
    this.api.createManualBooking(this.form).subscribe({
      next: () => {
        this.showForm.set(false);
        this.form = this.emptyForm();
        this.loadBookings();
        this.saving.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Chyba pri ukladaní');
        this.saving.set(false);
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK');
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'Čaká', PAID: 'Zaplatená', CONFIRMED: 'Potvrdená',
      CANCELLED: 'Zrušená', REFUNDED: 'Vrátená',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    if (s === 'PAID' || s === 'CONFIRMED') return 'badge--green';
    if (s === 'CANCELLED' || s === 'REFUNDED') return 'badge--red';
    return 'badge--yellow';
  }
}
