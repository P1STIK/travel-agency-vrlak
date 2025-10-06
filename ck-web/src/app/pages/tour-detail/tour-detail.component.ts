import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';

import { ToursService, Tour } from '../../services/tours.service';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, NgOptimizedImage],
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
