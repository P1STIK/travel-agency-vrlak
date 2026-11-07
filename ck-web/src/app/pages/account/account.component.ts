import { Component, OnInit, inject, signal } from '@angular/core';
import { CustomerAuthService, CustomerProfile } from '../../services/customer-auth.service';
import { AccountService } from '../../services/account.service';
import { AccountProfileComponent } from './account-profile/account-profile.component';
import { AccountPasswordComponent } from './account-password/account-password.component';
import { AccountBookingsComponent } from './account-bookings/account-bookings.component';
import { AccountDeleteComponent } from './account-delete/account-delete.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AccountProfileComponent, AccountPasswordComponent, AccountBookingsComponent, AccountDeleteComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  private api = inject(AccountService);
  readonly auth = inject(CustomerAuthService);

  customer = signal<CustomerProfile | null>(this.auth.customer());

  ngOnInit() {
    this.api.getMe().subscribe({
      next: c => this.customer.set(c),
      error: () => {},
    });
  }
}
