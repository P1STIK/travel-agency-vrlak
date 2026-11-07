import { PricePipe } from '../../shared/pipes/price.pipe';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Departure, Tour, ToursService, firstDeparture, minPriceCents } from '../../services/tours.service';
import { formatDateRange } from '../../shared/utils/date-range.utils';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PricePipe],
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

  formatDate(dep: Departure): string {
    return formatDateRange(dep.date, dep.returnDate, { day: 'numeric', month: 'numeric', year: 'numeric' });
  }

  thumb(t: Tour): string {
    return (t as any).thumbImage || t.heroImage || '/assets/images/pariz.jpg';
  }
}
