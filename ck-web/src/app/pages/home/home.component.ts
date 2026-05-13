import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Tour, ToursService, firstDeparture, minPriceCents } from '../../services/tours.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private api = inject(ToursService);

  featuredTours = toSignal(
    this.api.all().pipe(map(tours => tours.slice(0, 3))),
    { initialValue: [] as Tour[] }
  );

  minPrice(t: Tour) { return minPriceCents(t); }
  departure(t: Tour) { return firstDeparture(t); }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  thumb(t: Tour): string {
    return (t as any).thumbImage || t.heroImage || '/assets/images/pariz.jpg';
  }
}
