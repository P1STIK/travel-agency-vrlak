import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../services/account.service';
import { CustomerProfile } from '../../../services/customer-auth.service';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css',
})
export class AccountProfileComponent implements OnInit {
  private api = inject(AccountService);

  customer = input.required<CustomerProfile>();
  updated = output<CustomerProfile>();

  form = { firstName: '', lastName: '', phone: '', street: '', city: '', zip: '' };

  saving = signal(false);
  error = signal('');
  success = signal(false);

  ngOnInit() {
    const c = this.customer();
    this.form = {
      firstName: c.firstName, lastName: c.lastName,
      phone: c.phone ?? '', street: c.street ?? '', city: c.city ?? '', zip: c.zip ?? '',
    };
  }

  submit() {
    this.error.set('');
    this.success.set(false);
    this.saving.set(true);
    this.api.updateMe(this.form).subscribe({
      next: c => {
        this.saving.set(false);
        this.success.set(true);
        this.updated.emit(c);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Ukladanie sa nepodarilo.');
      },
    });
  }
}
