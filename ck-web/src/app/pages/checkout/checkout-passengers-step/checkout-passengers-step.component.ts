import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-passengers-step',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-passengers-step.component.html',
  styleUrl: './checkout-passengers-step.component.css',
})
export class CheckoutPassengersStepComponent {
  form = input.required<FormGroup>();
  loading = input(false);
  errorMsg = input('');
  isLoggedIn = input(false);
  loginReturnUrl = input('/checkout');

  back = output<void>();
  submit = output<void>();
  fileSelected = output<{ index: number; event: Event }>();

  get passengers(): FormArray { return this.form().get('passengers') as FormArray; }

  onFileChange(index: number, event: Event) {
    this.fileSelected.emit({ index, event });
  }
}
