import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Tour, ToursService, firstDeparture, minPriceCents } from '../../services/tours.service';

type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-tours',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './tours.component.html',
  styleUrl: './tours.component.css'
})
export class ToursComponent {
  private api = inject(ToursService);
  private router = inject(Router);

  private allTours = toSignal(this.api.all(), { initialValue: [] as Tour[] });

  activeCategory = toSignal(
    inject(ActivatedRoute).queryParams.pipe(
      map((p): string | null => p['category'] ?? null)
    ),
    { initialValue: null as string | null }
  );

  sortOrder = signal<SortOrder>('asc');

  categories = [
    { key: 'letne',      label: 'Letné dovolenky' },
    { key: 'jednodnove', label: 'Jednodňové výlety' },
    { key: 'silvester',  label: 'Silvester' },
    { key: 'lyzovacky',  label: 'Lyžovačky' },
    { key: 'pute',       label: 'Púte' },
  ];

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
