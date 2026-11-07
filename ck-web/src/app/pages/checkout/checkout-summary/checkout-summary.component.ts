import { Component, input } from '@angular/core';
import { Tour, Departure, firstDeparture } from '../../../services/tours.service';
import { formatDateRange } from '../../../shared/utils/date-range.utils';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [PricePipe],
  templateUrl: './checkout-summary.component.html',
  styleUrl: './checkout-summary.component.css',
})
export class CheckoutSummaryComponent {
  tour = input<Tour | null>(null);
  departureId = input<string>('');
  unitPriceCents = input(0);
  seats = input(1);
  quote = input<any>(null);

  departure(): Departure | null {
    const t = this.tour();
    if (!t) return null;
    return t.departures?.find(d => d.id === this.departureId()) ?? firstDeparture(t);
  }

  formatDate(d: Departure): string {
    return formatDateRange(d.date, d.returnDate, { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
