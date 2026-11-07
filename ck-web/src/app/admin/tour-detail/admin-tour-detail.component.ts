import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService, AdminDetailDeparture, AdminTourDetail, BookingStatus } from '../admin-api.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { formatDateRange } from '../../shared/utils/date-range.utils';

@Component({
  selector: 'app-admin-tour-detail',
  imports: [PricePipe, RouterLink],
  templateUrl: './admin-tour-detail.component.html',
  styleUrl: './admin-tour-detail.component.css',
})
export class AdminTourDetailComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);

  tour = signal<AdminTourDetail | null>(null);
  loading = signal(true);
  error = signal('');

  stats = computed(() => {
    const t = this.tour();
    if (!t) return null;
    const allBookings = t.departures.flatMap(d => d.bookings);
    const active = allBookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REFUNDED');
    return {
      totalBookings: allBookings.length,
      activeBookings: active.length,
      totalSeats: active.reduce((s, b) => s + b.seats, 0),
      totalRevenue: active.reduce((s, b) => s + b.totalAmount, 0),
    };
  });

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getTourDetail(slug).subscribe({
      next: t => { this.tour.set(t); this.loading.set(false); },
      error: () => { this.error.set('Zájazd sa nepodarilo načítať.'); this.loading.set(false); },
    });
  }

  occupancyPct(dep: AdminDetailDeparture): number {
    return dep.capacity ? Math.round((dep.bookedSeats / dep.capacity) * 100) : 0;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK');
  }

  formatDepartureRange(dep: AdminDetailDeparture): string {
    return formatDateRange(dep.date, dep.returnDate, {});
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' });
  }

  statusLabel(s: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      PENDING: 'Čaká', PAID: 'Zaplatená', CONFIRMED: 'Potvrdená',
      CANCELLED: 'Zrušená', REFUNDED: 'Vrátená',
    };
    return map[s] ?? s;
  }

  statusClass(s: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      PENDING: 'badge--yellow', PAID: 'badge--green', CONFIRMED: 'badge--blue',
      CANCELLED: 'badge--red', REFUNDED: 'badge--gray',
    };
    return map[s] ?? '';
  }
}
