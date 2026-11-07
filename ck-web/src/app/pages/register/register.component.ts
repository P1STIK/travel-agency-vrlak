import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';

function safeReturnUrl(url: string | null): string {
  if (url && url.startsWith('/') && !url.startsWith('//')) return url;
  return '/moj-ucet';
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private auth = inject(CustomerAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  form = {
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '',
    phone: '', street: '', city: '', zip: '',
  };

  loading = signal(false);
  error = signal('');

  submit() {
    this.error.set('');

    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('Heslá sa nezhodujú.');
      return;
    }
    if (this.form.password.length < 8) {
      this.error.set('Heslo musí mať aspoň 8 znakov.');
      return;
    }

    this.loading.set(true);
    const { confirmPassword, ...payload } = this.form;

    this.auth.register(payload).subscribe({
      next: () => {
        const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: (e) => {
        this.loading.set(false);
        if (e?.status === 409) this.error.set('Účet s týmto e-mailom už existuje.');
        else if (e?.status === 429) this.error.set('Príliš veľa pokusov. Skúste to neskôr.');
        else this.error.set(e?.error?.message ?? 'Registrácia sa nepodarila.');
      },
    });
  }
}
