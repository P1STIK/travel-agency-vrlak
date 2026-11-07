import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css',
})
export class CookieConsentComponent {
  private store = inject(CookieConsentService);

  visible = computed(() => this.store.consent() === null);

  accept() { this.store.accept(); }
  reject() { this.store.reject(); }
}
