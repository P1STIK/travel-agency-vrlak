import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Tour, ToursService, firstDeparture, minPriceCents } from '../../services/tours.service';

type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-tours',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './tours.component.html',
  styleUrl: './tours.component.css'
})
export class ToursComponent implements OnInit {
  private api = inject(ToursService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private allTours = toSignal(this.api.all(), { initialValue: [] as Tour[] });

  activeCategory = signal<string | null>(null);
  sortOrder = signal<SortOrder>('asc');

  categories = [
    { key: 'letne',      label: 'Letné dovolenky' },
    { key: 'jednodnove', label: 'Jednodňové výlety' },
    { key: 'silvestr',   label: 'Silvestr' },
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

  ngOnInit() {
    const cat = this.route.snapshot.queryParamMap.get('category');
    if (cat) this.activeCategory.set(cat);
  }

  setCategory(cat: string | null) {
    this.activeCategory.set(cat);
    this.router.navigate([], {
      queryParams: { category: cat ?? undefined },
      queryParamsHandling: 'merge',
    });
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
