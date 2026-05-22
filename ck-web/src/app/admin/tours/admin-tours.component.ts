import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService, AdminTour, CreateTourPayload } from '../admin-api.service';
import { TOUR_CATEGORIES } from '../../shared/constants/tour-categories';

@Component({
  selector: 'app-admin-tours',
  imports: [DecimalPipe, FormsModule, RouterLink],
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

  form: CreateTourPayload = this.emptyForm();

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getTours().subscribe({
      next: t => { this.tours.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyForm(): CreateTourPayload {
    return {
      slug: '', title: '', category: '', teaser: '',
      description: '', currency: 'EUR', heroImage: '', thumbImage: '',
      departures: [{ date: '', unitPriceCents: 0, capacity: 50 }],
    };
  }

  addDeparture() {
    this.form.departures!.push({ date: '', unitPriceCents: 0, capacity: 50 });
  }

  removeDeparture(i: number) {
    this.form.departures!.splice(i, 1);
  }

  submit() {
    this.saving.set(true);
    this.error.set('');
    const payload = {
      ...this.form,
      departures: this.form.departures?.filter(d => d.date),
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

  categories = TOUR_CATEGORIES;
}
