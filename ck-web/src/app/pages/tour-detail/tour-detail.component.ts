import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ToursService, Tour } from '../../services/tours.service';
import { map, switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, NgOptimizedImage],
  templateUrl: './tour-detail.component.html',
  styleUrls: ['./tour-detail.component.css']
})
export class TourDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ToursService);

  // Signal, ktorý drží načítaný Tour (alebo null, kým sa načítava)
  tour = toSignal<Tour | null>(
    this.route.paramMap.pipe(
      map(p => p.get('slug')!),             
      switchMap(slug => this.api.bySlug(slug)) 
    ),
    { initialValue: null }
  );
}