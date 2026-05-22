import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { ToursService } from '../../services/tours.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private fb      = inject(FormBuilder);
  private api     = inject(BookingService);
  private toursApi = inject(ToursService);

  step = signal(1);
  readonly STEPS = [
    { n: 1, label: 'Počet miest' },
    { n: 2, label: 'Cestujúci' },
    { n: 3, label: 'Platba' },
  ];

  tourSlug!: string;
  departureId!: string;
  unitPriceCents!: number;

  form!: FormGroup;
  get passengers(): FormArray { return this.form.get('passengers') as FormArray; }

  tour = signal<any>(null);
  quote = signal<any>(null);
  bookingId = signal<string | null>(null);
  loading = signal(false);
  errorMsg = signal('');

  ngOnInit() {
    const p = this.route.snapshot.queryParamMap;
    this.tourSlug      = p.get('tourSlug')    ?? '';
    this.departureId   = p.get('departureId') ?? '';
    this.unitPriceCents = Number(p.get('price') ?? 0);

    if (this.tourSlug) {
      this.toursApi.bySlug(this.tourSlug).subscribe(t => this.tour.set(t));
    }

    this.form = this.fb.group({
      seats: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
      email: ['', [Validators.required, Validators.email]],
      passengers: this.fb.array([]),
    });

    this.syncPassengersToSeats();
    this.recalcQuote();

    this.form.get('seats')!.valueChanges.subscribe(() => {
      this.syncPassengersToSeats();
      this.recalcQuote();
    });
  }

  private syncPassengersToSeats() {
    const seats = this.form.get('seats')!.value ?? 1;
    while (this.passengers.length < seats) {
      this.passengers.push(this.fb.group({
        firstName: ['', Validators.required],
        lastName:  ['', Validators.required],
      }));
    }
    while (this.passengers.length > seats) {
      this.passengers.removeAt(this.passengers.length - 1);
    }
  }

  recalcQuote() {
    const seats = Number(this.form.get('seats')!.value ?? 1);
    this.api.quote({ departureId: this.departureId, seats, unitPriceCents: this.unitPriceCents })
      .subscribe({ next: q => this.quote.set(q) });
  }

  nextStep() {
    if (this.step() === 1) {
      this.form.get('seats')!.markAsTouched();
      if (this.form.get('seats')!.invalid) return;
    }
    if (this.step() < 3) this.step.update(s => s + 1);
  }

  prevStep() {
    if (this.step() > 1) this.step.update(s => s - 1);
  }

  createBooking() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');
    const val = this.form.getRawValue();

    this.api.create({
      departureId:    this.departureId,
      tourSlug:       this.tourSlug,
      email:          val.email,
      seats:          val.seats,
      unitPriceCents: this.unitPriceCents,
      passengers:     val.passengers,
    }).subscribe({
      next: res => {
        this.bookingId.set(res.bookingId);
        this.step.set(3);
        this.loading.set(false);
      },
      error: err => {
        this.errorMsg.set(err?.error?.message ?? 'Rezerváciu sa nepodarilo vytvoriť.');
        this.loading.set(false);
      },
    });
  }

  pay() {
    if (!this.bookingId()) return;
    const returnUrl = window.location.origin + '/thank-you';
    this.loading.set(true);
    this.api.checkoutSession(this.bookingId()!, returnUrl).subscribe({
      next: res => { window.location.href = res.checkoutUrl; },
      error: () => {
        this.errorMsg.set('Nepodarilo sa spustiť platbu.');
        this.loading.set(false);
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  departure() {
    const t = this.tour();
    if (!t) return null;
    return t.departures?.find((d: any) => d.id === this.departureId) ?? t.departures?.[0] ?? null;
  }
}
