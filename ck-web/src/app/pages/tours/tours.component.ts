import { AsyncPipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
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

}
