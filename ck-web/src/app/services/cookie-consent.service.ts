import { Injectable, signal } from '@angular/core';

export type CookieConsent = 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';

// Momentálne appka nenačíta žiadne neesenciálne cookies/skripty (žiadna analytika,
// pixel a pod.) — tento service len uchováva rozhodnutie návštevníka vopred, aby
// bolo pripravené pre budúce skripty (napr. Google Analytics), ktoré sa pred
// načítaním musia najprv opýtať `consent() === 'accepted'`.
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  readonly consent = signal<CookieConsent | null>(this.readStored());

  private readStored(): CookieConsent | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'accepted' || v === 'rejected' ? v : null;
    } catch {
      return null;
    }
  }

  accept() { this.set('accepted'); }
  reject() { this.set('rejected'); }

  private set(value: CookieConsent) {
    this.consent.set(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* súkromné okno a pod. — nič sa nezapamätá, banner sa ukáže nabudúce znova */ }
  }
}
