# Architektúra – Headless WP + Angular SSR + NestJS Booking

```
WordPress (CMS: ACF + WPGraphQL/REST)
       ⇅ (API: public read)
Angular 19 + Universal (SSR)  → SEO-friendly HTML, rýchly TTFB
       ↘ Booking mikroservisa (NestJS + Prisma + Postgres)
        ↘ Platby (Stripe/GoPay) + webhooks
```

## WordPress (CMS)
- **CPT**: `tour`, `departure`
- **ACF** pre `tour`: `summary (text)`, `priceFrom (number)`, `gallery (image[])`
- **ACF** pre `departure`: `tour (post object)`, `startDate`, `endDate`, `busCapacity`, `price`, `currency`, `pickupPoints[]`

### API varianty
- **WP REST** (jednoduché): `/wp-json/wp/v2/tour?per_page=20` atď.
- **WPGraphQL** (čisté typy): `tours { nodes { title slug acf { ... } } }`

> FE si ťahá public dáta priamo z WP. **Rezervácia** ide do **NestJS** mikroservisy.

## Angular 19 + Universal (SSR)
- Stránky: `/`, `/zajazdy`, `/zajazd/:slug`, `/checkout`
- **SSR meta** (Title/Meta) z WP dát.
- **Schema.org**: `Tour`, `Trip`, `Organization`
- **Sitemap** generovaná z WP dát (build/cron).

## Booking mikroservisa (NestJS + Prisma)
- Ukladá **rezervácie** (PENDING→PAID→CONFIRMED), cestujúcich.
- Validačne dôveruje `departureId`/`unitPriceCents` (MVP), neskôr môžeš overovať proti WP/DB.
- **Stripe/GoPay**: checkout session + webhook → update stavu.

## DB (Prisma – minimálny model)
- `Booking(id, code, departureId, email, seats, totalAmount, currency, status)`
- `Passenger(id, firstName, lastName, bookingId)`

## Deploy poznámky
- WP: shared hosting/VPS, len ako CMS (API).
- FE SSR: Vercel/Render/Fly.io (Node runtime).
- API + DB: Fly.io/Hetzner/Render; Postgres (managed alebo docker).
- CDN pre obrázky: Cloudflare/Cloudinary.
