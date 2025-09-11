import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent {
  // krokový stav
  step = 1;

  // parametre zájazdu
  tourSlug!: string;
  departureId!: string;
  unitPriceCents!: number;

  // formulár
  form!: FormGroup;
  get passengers(): FormArray { return this.form.get('passengers') as FormArray; }

  // stav
  quote: any;
  bookingId: string | null = null;
  loading = false;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private api: BookingService,
  ) {}

  ngOnInit() {
    // načítaj query parametre (alebo defaulty)
    const p = this.route.snapshot.queryParamMap;
    this.tourSlug = p.get('tourSlug') ?? 'pariz-na-vikend';
    this.departureId = p.get('departureId') ?? 'wp-001';
    this.unitPriceCents = Number(p.get('price') ?? 12900);

    // vytvor form až teraz (v DI kontexte)
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
        lastName: ['', Validators.required],
      }));
    }
    while (this.passengers.length > seats) {
      this.passengers.removeAt(this.passengers.length - 1);
    }
  }

  next() { if (this.step < 3) this.step++; }
  back() { if (this.step > 1) this.step--; }

  recalcQuote() {
  const seats = Number(this.form.get('seats')!.value ?? 1);
  this.api.quote({ departureId: this.departureId, seats, unitPriceCents: this.unitPriceCents })
    .subscribe({
      next: q => this.quote = q,
      error: () => this.errorMsg = 'Nepodarilo sa vypočítať cenu.',
    });
}

createBooking() {
  this.form.updateValueAndValidity();
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }

  this.loading = true; this.errorMsg = '';
  const val = this.form.getRawValue();
  console.log('Creating booking with:', val); // pomôže v DevTools

  this.api.create({
    departureId: this.departureId,
    tourSlug: this.tourSlug,
    email: val.email,
    seats: val.seats,
    unitPriceCents: this.unitPriceCents,
    passengers: val.passengers
  }).subscribe({
    next: res => { this.bookingId = res.bookingId; this.step = 3; this.loading = false; },
    error: err => { console.error(err); this.errorMsg = 'Rezerváciu sa nepodarilo vytvoriť.'; this.loading = false; }
  });
}

  pay() {
    if (!this.bookingId) return;
    const returnUrl = window.location.origin + '/thank-you';
    this.api.checkoutSession(this.bookingId, returnUrl).subscribe({
      next: res => window.location.href = res.checkoutUrl,
      error: () => this.errorMsg = 'Nepodarilo sa spustiť platbu.',
    });
  }
}