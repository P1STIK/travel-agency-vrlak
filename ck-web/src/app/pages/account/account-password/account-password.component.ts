import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-account-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './account-password.component.html',
  styleUrl: './account-password.component.css',
})
export class AccountPasswordComponent {
  private api = inject(AccountService);

  form = { currentPassword: '', newPassword: '', confirmPassword: '' };

  saving = signal(false);
  error = signal('');
  success = signal(false);

  submit() {
    this.error.set('');
    this.success.set(false);

    if (this.form.newPassword !== this.form.confirmPassword) {
      this.error.set('Nové heslá sa nezhodujú.');
      return;
    }
    if (this.form.newPassword.length < 8) {
      this.error.set('Nové heslo musí mať aspoň 8 znakov.');
      return;
    }

    this.saving.set(true);
    this.api.changePassword({
      currentPassword: this.form.currentPassword,
      newPassword: this.form.newPassword,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.form = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (e) => {
        this.saving.set(false);
        if (e?.status === 400) this.error.set('Súčasné heslo nie je správne.');
        else this.error.set(e?.error?.message ?? 'Zmena hesla sa nepodarila.');
      },
    });
  }
}
