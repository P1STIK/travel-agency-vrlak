import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-checkout-payment-step',
  standalone: true,
  templateUrl: './checkout-payment-step.component.html',
  styleUrl: './checkout-payment-step.component.css',
})
export class CheckoutPaymentStepComponent {
  bookingId = input<string | null>(null);
  loading = input(false);
  errorMsg = input('');

  pay = output<void>();
}
