import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';

import { ToursService, Tour, Departure, minPriceCents } from '../../services/tours.service';
import { TOUR_CATEGORIES } from '../../shared/constants/tour-categories';
import { formatDateRange } from '../../shared/utils/date-range.utils';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [RouterLink, PricePipe, NgOptimizedImage],
  templateUrl: './tour-detail.component.html',
  styleUrls: ['./tour-detail.component.css'],
})
export class TourDetailComponent {
  /* ------------ DI ------------ */
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ToursService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  public readonly location = window.location;

  readonly selected = signal<string | null>(null);

  readonly tour = toSignal<Tour | null>(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''), 
      switchMap((slug) =>
        this.api.bySlug(slug).pipe(
          map((t) => t ?? null),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly thumbs = computed<string[]>(() => {
    const t = this.tour();
    if (!t) return [];
    const all = [
      ...(t.heroImage ? [t.heroImage] : []),
      ...(t.gallery ?? []),
    ].filter(Boolean);
    return Array.from(new Set(all));
  });

  readonly minPrice = computed<number | null>(() => {
    const t = this.tour();
    return t ? minPriceCents(t) : null;
  });

  /* ------------ Effects ------------ */
  constructor() {
    effect(() => {
      const t = this.tour();
      if (!t) return;
      const first = this.thumbs()[0] ?? null;
      if (first) this.selected.set(first);
    });

    effect(() => {
      const t = this.tour();
      if (!t) return;
      this.updateSeo(t);
    });
  }
  select(img: string): void {
    this.selected.set(img);
  }

  categoryLabel(key: string): string {
    return TOUR_CATEGORIES.find(c => c.key === key)?.label ?? key;
  }

  formatDepartureRange(d: Departure): string {
    return formatDateRange(d.date, d.returnDate, { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  private updateSeo(t: Tour): void {
    const pageTitle = `${t.title} – v-trans`;
    const desc =
      t.teaser ||
      (t.description ?? '').slice(0, 160) ||
      'Autobusové zájazdy od v-trans.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: desc });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: desc });

    if (t.heroImage) {
      this.meta.updateTag({ property: 'og:image', content: t.heroImage });
    }
  }
}
