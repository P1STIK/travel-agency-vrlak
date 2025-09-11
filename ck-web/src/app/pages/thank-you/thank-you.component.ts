import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-thank-you',
  standalone: true,
  templateUrl: './thank-you.component.html',
  styleUrl: './thank-you.component.css',
  imports: [DecimalPipe],
})
export class ThankYouComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  status = this.route.snapshot.queryParamMap.get('status');
  bookingId = this.route.snapshot.queryParamMap.get('bookingId');
  booking: any;

  ngOnInit() {
    if (this.bookingId) {
      this.http.get<any>(`http://localhost:3333/booking/${this.bookingId}`)
        .subscribe(b => this.booking = b);
    }
  }
}