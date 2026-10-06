import { Injectable, inject, signal } from '@angular/core';
import { Tour, ToursService } from './tours.service';

// Root singleton je tu správne (na rozdiel od BookingStore) — zoznam zájazdov
// je bezpečné zdieľať/cachovať medzi návštevami stránky, nie je to per-session stav.
//
// Stale-while-revalidate: loadAll() sa volá pri každom vstupe na stránku a vždy
// refetchne z BE (nech sa zmeny v admine — obsadenosť, nové termíny — prejavia),
// ale ak už máme z predtým nejaké dáta, zobrazia sa okamžite a obnovia sa na
// pozadí bez loading spinnera — takže to pôsobí rýchlo aj napriek čerstvým datám.
@Injectable({ providedIn: 'root' })
export class ToursStore {
  private api = inject(ToursService);

  readonly tours = signal<Tour[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  loadAll() {
    const hasCachedData = this.tours().length > 0;
    if (!hasCachedData) this.loading.set(true);

    this.api.all().subscribe({
      next: tours => { this.tours.set(tours); this.loading.set(false); },
      error: () => {
        if (!hasCachedData) this.error.set('Zájazdy sa nepodarilo načítať.');
        this.loading.set(false);
      },
    });
  }
}
