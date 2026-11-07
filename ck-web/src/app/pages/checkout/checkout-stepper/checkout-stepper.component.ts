import { Component, input } from '@angular/core';

export interface CheckoutStep {
  n: number;
  label: string;
}

@Component({
  selector: 'app-checkout-stepper',
  standalone: true,
  templateUrl: './checkout-stepper.component.html',
  styleUrl: './checkout-stepper.component.css',
})
export class CheckoutStepperComponent {
  steps = input.required<CheckoutStep[]>();
  current = input.required<number>();
}
