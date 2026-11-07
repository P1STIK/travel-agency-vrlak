import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService, MyBooking } from '../../../services/account.service';
import { BookingStatus } from '../../../admin/admin-api.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { formatDateRange } from '../../../shared/utils/date-range.utils';

@Component({
  selector: 'app-account-bookings',
  standalone: true,
  imports: [RouterLink, PricePipe],
  templateUrl: './account-bookings.component.html',
  styleUrl: './account-bookings.component.css',
})
export class AccountBookingsComponent implements OnInit {
  private api = inject(AccountService);

  bookings = signal<MyBooking[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.api.getMyBookings().subscribe({
      next: b => { this.bookings.set(b); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.error.set('Objednávky sa nepodarilo načítať.');
      },
    });
  }

  dateRange(b: MyBooking): string {
    if (!b.departure) return '';
    return formatDateRange(b.departure.date, b.departure.returnDate, { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  statusLabel(s: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      PENDING: 'Čaká', PAID: 'Zaplatená', CONFIRMED: 'Potvrdená',
      CANCELLED: 'Zrušená', REFUNDED: 'Vrátená',
    };
    return map[s] ?? s;
  }

  statusClass(s: BookingStatus): string {
    if (s === 'PAID' || s === 'CONFIRMED') return 'badge--green';
    if (s === 'CANCELLED' || s === 'REFUNDED') return 'badge--red';
    return 'badge--yellow';
  }

  passengerNames(b: MyBooking): string {
    return b.passengers.map(p => `${p.firstName} ${p.lastName}`).join(', ');
  }
}
