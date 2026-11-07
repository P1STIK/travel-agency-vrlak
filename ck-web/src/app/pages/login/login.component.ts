import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';

function safeReturnUrl(url: string | null): string {
  if (url && url.startsWith('/') && !url.startsWith('//')) return url;
  return '/moj-ucet';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth = inject(CustomerAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: (e) => {
        this.loading.set(false);
        if (e?.status === 401) this.error.set('Nesprávny e-mail alebo heslo.');
        else if (e?.status === 429) this.error.set('Príliš veľa pokusov o prihlásenie. Skúste to neskôr.');
        else this.error.set(e?.error?.message ?? 'Prihlásenie sa nepodarilo.');
      },
    });
  }
}
