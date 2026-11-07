import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-account-delete',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './account-delete.component.html',
  styleUrl: './account-delete.component.css',
})
export class AccountDeleteComponent {
  private api = inject(AccountService);
  private router = inject(Router);

  open = signal(false);
  password = '';
  confirmed = false;

  saving = signal(false);
  error = signal('');

  submit() {
    this.error.set('');
    if (!this.confirmed) {
      this.error.set('Potvrďte, že rozumiete dôsledkom zrušenia účtu.');
      return;
    }
    if (!this.password) return;

    this.saving.set(true);
    this.api.deleteAccount(this.password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.saving.set(false);
        if (e?.status === 400) this.error.set('Nesprávne heslo.');
        else this.error.set(e?.error?.message ?? 'Zrušenie účtu sa nepodarilo.');
      },
    });
  }
}
