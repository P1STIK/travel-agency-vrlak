# Angular 19 + Universal (SSR) – setup

## 1) Vytvor projekt
```bash
npm i -g @angular/cli
ng new ck-web --routing --style=css
cd ck-web
ng add @nguniversal/express-engine
npm i tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: [],
};
```

**src/styles.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 2) Služba pre WordPress API (REST príklad)
**src/app/services/cms.service.ts**
```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CmsService {
  private http = inject(HttpClient);
  private base = 'https://YOUR-WP.tld/wp-json/wp/v2';

  getTours() { return this.http.get(`${this.base}/tour?per_page=20&_embed`); }
  getTour(slug: string) { return this.http.get(`${this.base}/tour?slug=${slug}&_embed`); }
}
```

## 3) Stránky
- `/` – výber top zájazdov
- `/zajazdy` – listing s filtrami
- `/zajazd/:slug` – detail s termínmi a CTA „Rezervovať“ (otvorí checkout wizard)

## 4) Prepojenie na Booking API
**env.ts**: `BOOKING_API_URL`
- `POST /booking/quote` → ukáž cenu
- `POST /booking` → vytvor rezerváciu (PENDING)
- `POST /booking/checkout/session` → získaj `checkoutUrl` a presmeruj

## 5) SSR meta & SEO
Použi Angular `Title`, `Meta` a resolver, ktorý načíta dáta ešte pred renderom na serveri.
