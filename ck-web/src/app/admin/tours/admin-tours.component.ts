import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminTour, CreateTourPayload } from '../admin-api.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { TOUR_CATEGORIES } from '../../shared/constants/tour-categories';
import { formatDateRange } from '../../shared/utils/date-range.utils';

interface DepartureFormRow {
  date: string;
  returnDate: string;
  priceEur: number | null;
  capacity: number;
}

interface TourFormModel extends Omit<CreateTourPayload, 'departures'> {
  departures: DepartureFormRow[];
}

@Component({
  selector: 'app-admin-tours',
  imports: [PricePipe, FormsModule, RouterLink],
  templateUrl: './admin-tours.component.html',
  styleUrl: './admin-tours.component.css',
})
export class AdminToursComponent implements OnInit {
  private api = inject(AdminApiService);

  tours  = signal<AdminTour[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving   = signal(false);
  error    = signal('');

  form: TourFormModel = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getTours().subscribe({
      next: t => { this.tours.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyForm(): TourFormModel {
    return {
      slug: '', title: '', category: '', teaser: '',
      description: '', currency: 'EUR', heroImage: '', thumbImage: '',
      departures: [{ date: '', returnDate: '', priceEur: null, capacity: 50 }],
    };
  }

  addDeparture() {
    this.form.departures.push({ date: '', returnDate: '', priceEur: null, capacity: 50 });
  }

  removeDeparture(i: number) {
    this.form.departures.splice(i, 1);
  }

  submit() {
    this.error.set('');

    const activeRows = this.form.departures.filter(d => d.date);
    const hasInvalidPrice = activeRows.some(
      d => d.priceEur === null || Number.isNaN(d.priceEur) || d.priceEur < 0,
    );
    if (hasInvalidPrice) {
      this.error.set('Zadajte platnú cenu v eurách pre každý odchod');
      return;
    }

    this.saving.set(true);
    const payload: CreateTourPayload = {
      ...this.form,
      departures: activeRows.map(d => ({
        date: d.date,
        returnDate: d.returnDate || null,
        unitPriceCents: Math.round(d.priceEur! * 100),
        capacity: d.capacity,
      })),
    };
    this.api.createTour(payload).subscribe({
      next: () => {
        this.showForm.set(false);
        this.form = this.emptyForm();
        this.load();
        this.saving.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Chyba pri ukladaní');
        this.saving.set(false);
      },
    });
  }

  occupancyPct(dep: AdminTour['departures'][0]): number {
    return dep.capacity ? Math.round((dep.bookedSeats / dep.capacity) * 100) : 0;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK');
  }

  formatDepartureRange(dep: AdminTour['departures'][0]): string {
    return formatDateRange(dep.date, dep.returnDate, {});
  }

  categories = TOUR_CATEGORIES;
}
