import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Tour, ToursService } from '../../services/tours.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tours',
  imports:  [RouterLink, DecimalPipe, NgOptimizedImage],
  templateUrl: './tours.component.html',
  styleUrl: './tours.component.css'
})
export class ToursComponent {
  private api = inject(ToursService);

    tours = toSignal(this.api.all(), { initialValue: [] as Tour[] });

      /** Najnižšia cena v centoch alebo null */
  minPrice(t: Tour): number | null {
    const deps = t?.departures ?? [];
    const priced = deps.filter(d => typeof d.unitPriceCents === 'number');
    if (!priced.length) return null;
    return Math.min(...priced.map(d => d.unitPriceCents));
  }

  /** Prvý termín – na prefill checkoutu */
  firstDeparture(t: Tour) {
    const deps = t?.departures ?? [];
    return deps.length ? deps[0] : null;
  }

  /** Preferuj thumbImage, inak heroImage */
  thumb(t: Tour): string | undefined {
    return (t as any).thumbImage || t.heroImage;
  }

    /** Popis – ak je len teaser, použijeme ten */
  desc(t: any): string {
    return t?.description ?? t?.teaser ?? '';
  }

}
