import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToursService, Tour } from '../../services/tours.service';
import { BookingStore } from '../../services/booking.store';
import { CheckoutStepperComponent, CheckoutStep } from './checkout-stepper/checkout-stepper.component';
import { CheckoutSummaryComponent } from './checkout-summary/checkout-summary.component';
import { CheckoutSeatsStepComponent } from './checkout-seats-step/checkout-seats-step.component';
import { CheckoutPassengersStepComponent } from './checkout-passengers-step/checkout-passengers-step.component';
import { CheckoutPaymentStepComponent } from './checkout-payment-step/checkout-payment-step.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CheckoutStepperComponent,
    CheckoutSummaryComponent,
    CheckoutSeatsStepComponent,
    CheckoutPassengersStepComponent,
    CheckoutPaymentStepComponent,
  ],
  providers: [BookingStore], // vlastná instancia na životnosť komponentu, nie root singleton
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private fb       = inject(FormBuilder);
  private toursApi = inject(ToursService);
  readonly store   = inject(BookingStore);

  step = signal(1);
  readonly STEPS: CheckoutStep[] = [
    { n: 1, label: 'Počet miest' },
    { n: 2, label: 'Cestujúci' },
    { n: 3, label: 'Platba' },
  ];

  tourSlug!: string;
  departureId!: string;
  unitPriceCents!: number;

  form!: FormGroup;
  get passengers(): FormArray { return this.form.get('passengers') as FormArray; }

  tour = signal<Tour | null>(null);
  insuranceFiles = signal<(File | null)[]>([]);

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
        firstName:  ['', Validators.required],
        lastName:   ['', Validators.required],
        birthDate:  [''],
        nationalId: [''],
        street:     [''],
        city:       [''],
        zip:        [''],
        phone:      [''],
        email:      [''],
      }));
      this.insuranceFiles.update(files => [...files, null]);
    }
    while (this.passengers.length > seats) {
      this.passengers.removeAt(this.passengers.length - 1);
      this.insuranceFiles.update(files => files.slice(0, -1));
    }
  }

  onInsuranceFileSelected({ index, event }: { index: number; event: Event }) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.insuranceFiles.update(files => {
      const copy = [...files];
      copy[index] = file;
      return copy;
    });
  }

  recalcQuote() {
    const seats = Number(this.form.get('seats')!.value ?? 1);
    this.store.fetchQuote(this.departureId, seats, this.unitPriceCents);
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

    const val = this.form.getRawValue();
    this.store.createBooking({
      departureId:    this.departureId,
      tourSlug:       this.tourSlug,
      email:          val.email,
      seats:          val.seats,
      unitPriceCents: this.unitPriceCents,
      passengers:     val.passengers,
    }, this.insuranceFiles()).subscribe({
      next: () => this.step.set(3),
      error: () => {}, // chybová správa je už nastavená v store-i
    });
  }

  pay() {
    if (!this.store.bookingId()) return;
    const returnUrl = window.location.origin + '/thank-you';
    this.store.pay(returnUrl).subscribe({
      next: res => { window.location.href = res.checkoutUrl; },
      error: () => {}, // chybová správa je už nastavená v store-i
    });
  }
}
