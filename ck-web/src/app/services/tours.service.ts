import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';

export interface Departure { id: string; date: string; unitPriceCents: number; }
export interface Tour {
  slug: string; title: string; teaser?: string; heroImage?: string;
  description?: string; currency: string; departures: Departure[];
}

@Injectable({ providedIn: 'root' })
export class ToursService {
  private http = inject(HttpClient);


  all() {
  return this.http.get<Tour[]>('/assets/tours.json').pipe(shareReplay(1));
}
  bySlug(slug: string) {
    return this.all().pipe(map(list => list.find(t => t.slug === slug)!));
  }
}