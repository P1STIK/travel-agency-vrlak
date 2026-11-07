import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../admin-api.service';

@Component({
  selector: 'app-admin-account',
  imports: [FormsModule],
  templateUrl: './admin-account.component.html',
  styleUrl: './admin-account.component.css',
})
export class AdminAccountComponent {
  private api = inject(AdminApiService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  saving  = signal(false);
  error   = signal('');
  success = signal(false);

  submit() {
    this.error.set('');
    this.success.set(false);

    if (this.newPassword.length < 8) {
      this.error.set('Nové heslo musí mať aspoň 8 znakov');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Heslá sa nezhodujú');
      return;
    }

    this.saving.set(true);
    this.api.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Chyba pri zmene hesla');
      },
    });
  }
}
