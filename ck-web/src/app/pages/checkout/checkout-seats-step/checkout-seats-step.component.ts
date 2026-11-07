import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-seats-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout-seats-step.component.html',
  styleUrl: './checkout-seats-step.component.css',
})
export class CheckoutSeatsStepComponent {
  form = input.required<FormGroup>();
  next = output<void>();

  get seatsControl() { return this.form().get('seats')!; }

  decrement() { this.seatsControl.setValue(this.seatsControl.value - 1); }
  increment() { this.seatsControl.setValue(this.seatsControl.value + 1); }
}
