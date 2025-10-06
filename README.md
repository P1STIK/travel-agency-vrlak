# Travel CK Starter (Headless WP + Angular SSR + NestJS Booking)

## Čo tu je
- **/api/booking-api** – NestJS API s Prisma schémou (Booking/Passenger), endpointmi: `POST /booking/quote`, `POST /booking`, `POST /booking/checkout/session`, `POST /payments/webhook`.
- **/ops/docker-compose.yml** – Postgres na lokál.
- **/docs** – architektúra a postup nastavenia.
- **/web/README.md** – presné kroky na vytvorenie Angular SSR app s Tailwind + napojenie na WP.

> WordPress (headless) nenasadzujeme v tomto balíku. Potrebuješ vlastnú WP inštaláciu (ACF + WPGraphQL/REST) – viď dokumentácia v **/docs/ARCHITECTURE.md**.

## Rýchly štart (lokálne)
1) Spusti DB:
```bash
docker compose -f ops/docker-compose.yml up -d
```
2) BE:
```bash
cd api/booking-api
npm install
npm run prisma:migrate
npm run start:dev
```
3) FE (Angular SSR): viď **/web/README.md** – použiješ Angular CLI.
4) Nastav WordPress (CPT/ACF) podľa **/docs/ARCHITECTURE.md** a napoj FE.

