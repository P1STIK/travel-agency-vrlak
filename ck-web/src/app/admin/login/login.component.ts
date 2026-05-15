import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth   = inject(AdminAuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  submit() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.error.set('Nesprávne meno alebo heslo');
        this.loading.set(false);
      },
    });
  }
}
