// src/app/services/tours.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface Departure {
  id: string;
  date: string;            // ISO date string
  unitPriceCents: number;
}

export interface TourExtras {
  note?: string;
  difficulty?: string;
}

export interface Tour {
  slug: string;
  title: string;
  teaser?: string;

  description?: string;
  currency: string;
  departures: Departure[];

  heroImage?: string;
  thumbImage?: string;

  duration?: string;            
  pickupPoints?: string[];      
  extras?: TourExtras;   
  
  gallery?: string[];
}

@Injectable({ providedIn: 'root' })
export class ToursService {
  private http = inject(HttpClient);

  /** Zoznam zájazdov (kešované) */
  all(): Observable<Tour[]> {
    return this.http.get<Tour[]>('/assets/tours.json').pipe(shareReplay(1));
  }

  /** Nájde zájazd podľa slug */
  bySlug(slug: string): Observable<Tour | undefined> {
    return this.all().pipe(map(list => list.find(t => t.slug === slug)));
  }

  /** Ak chceš verziu, ktorá vyhodí chybu, keď sa nenašlo */
  bySlugStrict(slug: string): Observable<Tour> {
    return this.bySlug(slug).pipe(
      map(t => {
        if (!t) throw new Error(`Tour not found: ${slug}`);
        return t;
      })
    );
  }
}

/* --- Pomocné funkcie (nepovinné) ------------------------------ */

export function minPriceCents(t: Tour): number | null {
  if (!t.departures?.length) return null;
  return Math.min(...t.departures.map(d => d.unitPriceCents));
}

export function firstDeparture(t: Tour): Departure | null {
  if (!t.departures?.length) return null;
  // ak potrebuješ podľa dátumu:
  return [...t.departures].sort((a, b) => a.date.localeCompare(b.date))[0];
}