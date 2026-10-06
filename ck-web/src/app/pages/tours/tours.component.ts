import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Tour, firstDeparture, minPriceCents } from '../../services/tours.service';
import { ToursStore } from '../../services/tours.store';
import { TOUR_CATEGORIES } from '../../shared/constants/tour-categories';

type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-tours',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './tours.component.html',
  styleUrl: './tours.component.css'
})
export class ToursComponent {
  private store = inject(ToursStore);
  private router = inject(Router);

  private allTours = this.store.tours;
  loading = this.store.loading;

  activeCategory = toSignal(
    inject(ActivatedRoute).queryParams.pipe(
      map((p): string | null => p['category'] ?? null)
    ),
    { initialValue: null as string | null }
  );

  sortOrder = signal<SortOrder>('asc');

  categories = TOUR_CATEGORIES;

  tours = computed(() => {
    const cat = this.activeCategory();
    const result = cat
      ? this.allTours().filter(t => t.category === cat)
      : this.allTours();

    return [...result].sort((a, b) => {
      const aDate = firstDeparture(a)?.date ?? '';
      const bDate = firstDeparture(b)?.date ?? '';
      return this.sortOrder() === 'asc'
        ? aDate.localeCompare(bDate)
        : bDate.localeCompare(aDate);
    });
  });

  readonly PAGE_SIZE = 9;
  visibleCount = signal(this.PAGE_SIZE);

  visibleTours = computed(() => this.tours().slice(0, this.visibleCount()));
  hasMore = computed(() => this.visibleCount() < this.tours().length);
  canShowLess = computed(() => this.visibleCount() > this.PAGE_SIZE);

  constructor() {
    this.store.loadAll();
    effect(() => {
      this.activeCategory();
      this.visibleCount.set(this.PAGE_SIZE);
    });
  }

  loadMore() {
    this.visibleCount.update(c => c + this.PAGE_SIZE);
  }

  showLess() {
    this.visibleCount.set(this.PAGE_SIZE);
  }

  setCategory(cat: string | null) {
    this.router.navigate(['/zajazdy'], { queryParams: { category: cat } });
  }

  toggleSort() { this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc'); }

  categoryLabel(key: string): string {
    return this.categories.find(c => c.key === key)?.label ?? key;
  }

  minPrice(t: Tour) { return minPriceCents(t); }
  departure(t: Tour) { return firstDeparture(t); }
  thumb(t: Tour): string { return (t as any).thumbImage || t.heroImage || ''; }
  desc(t: Tour): string { return t.teaser || t.description || ''; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }
}
