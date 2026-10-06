# FE unifikácia — tracking

Živý dokument. Aktualizuje sa pri každej práci na tomto refaktore. Čítaj na začiatku, keď sa vracame k "zjednoteniu projektu".

## Fázy (dohodnuté 2026-10-06)

1. **Štýly na jedno miesto** ⏳ IN PROGRESS
2. **Centralizácia API/store** — čaká
3. **Rozbitie veľkých komponentov na menšie (+ parent/smart komponenty)** — čaká
4. **Zjednotenie admin sekcie podľa rovnakého vzoru** — čaká

---

## Fáza 1 — Štýly

### Hotovo
- [x] `:root` CSS premenné pre farby v `ck-web/src/styles.css` (24 tokenov: `--color-primary`, `--color-ink`, `--color-gray-*`, `--color-danger-*`, `--color-success-*`...)
- [x] 370 výskytov hardkódovaných hex farieb nahradených za `var(--token)` v 15 komponentoch (žiadna vizuálna zmena, build overený)

### Hotovo (pokračovanie, 2026-10-06)
- [x] `.btn` + `.btn--primary/--ghost/--danger/--outline/--sm/--lg` presunuté do globálneho `styles.css`. Odstránené duplicitné lokálne definície z: `admin/tours`, `admin/bookings`, `admin/tour-detail`, `pages/checkout`, `pages/contact`, `pages/tours`, `pages/tour-detail`, `pages/home` (8 súborov). Komponenty si nechali len skutočné lokálne odchýlky (napr. `gap` pre ikonu v checkout/tour-detail).
  - `tour-detail.component.html` CTA tlačidlo dostalo `btn--lg` (predtým malo vlastný veľký padding natvrdo, teraz zdieľa `--lg` modifikátor).
  - Build (`ng build`) prešiel čisto, bundle o niečo menší.
  - **Vizuálne neoverené v prehliadači** (nemám tu nástroj na screenshot) — pár tlačidiel (napr. na `/zajazdy` kartách, kontakt CTA) mohlo dostať o 1-2px iný padding/font-size než predtým, keďže sa zjednotila veľkostná škála. Odporúčam preletieť stránky po `ng serve` a skontrolovať, že to vyzerá OK.

### Vedome NEzlúčené (zámerne, nie zabudnuté)
- **`admin-calendar.component.css`** — má vlastnú hustejšiu škálu (border-radius 6px, font-weight 500 namiesto 600), lebo kalendár má veľa malých tlačidiel natesno. Zlúčenie by zmenilo vizuál výraznejšie, treba to robiť samostatne a vizuálne overiť.
- **`shared/header.component.css`** — používa Tailwind `@apply` (iný systém ako plain CSS premenné), font-weight 500. Treba samostatný prevod.
- **`.card`** — ešte nezlúčené, 9 komponentov má vlastnú verziu. Ďalší krok.

### Hotovo (pokračovanie, 2026-10-06, bod 2)
- [x] `.card` + `.card--success` presunuté do globálneho `styles.css`. Zjednotené: `pages/skibus`, `pages/tour-detail`, `pages/contact`, `pages/checkout` (identický vzor: biely panel, shadow, padding).
- [x] Build overený, čistý.

### Vedome NEzlúčené (zámerne, nie zabudnuté) — doplnenie
- **`admin/tours`, `admin/bookings`, `admin/tour-detail` `.card`** — admin má vlastnú denšiu verziu (menší shadow blur 8px/0.07, menší padding, `margin-bottom`). Podobný dôvod ako pri `admin-calendar` btn — nechcem meniť vizuál admin sekcie bez vizuálnej kontroly.
- **`pages/tours` `.card`** — toto NIE JE duplikát, je to produktová karta s obrázkom a hover efektom, len náhodou rovnaký názov triedy. Netrieba zlučovať.
- **`pages/thank-you` `.card`** — zámerne iný štýl (orámovaný "účtovný" box bez shadow), nie bug.

### Fáza 1 — zostáva (keď sa k tomu vrátime)
- [ ] Rozhodnúť čo s admin-calendar/header btn a admin card trio — zjednotiť na rovnakú škálu neskôr, alebo nechať zámerne odlišné natrvalo a len zdokumentovať v CLAUDE.md
- [ ] Vizuálne overiť v browseri (nemám tu nástroj na screenshot) — skontrolovať /zajazdy, /kontakt, /zajazdy/:slug, /checkout, /ski-bus

## STATUS: Fáza 1 (štýly) — jadro hotové, pripravení na Fázu 2
Zjednotenie farieb + `.btn` + `.card` pre všetky komponenty mimo zámerne odlíšenej admin/header škály je dokončené a overené buildom. Zvyšné veci vo Fáze 1 (vizuálna kontrola, prípadné zjednotenie admin-calendar) nie sú blokujúce — môžeme prejsť na **Fázu 2 (store/API centralizácia)**.

---

## Fáza 2 — Store / API centralizácia

### Hotovo (2026-10-06)
- [x] `BookingStore` (`ck-web/src/app/services/booking.store.ts`) — prevzal `quote`/`bookingId`/`loading`/`error` signály a všetky HTTP volania (`quote`, `create` + upload poistných dokumentov, `checkoutSession`) z `checkout.component.ts`. Komponent teraz len zostavuje formulár a volá store metódy.
  - **Dôležité:** `BookingStore` je `@Injectable()` **bez** `providedIn: 'root'`, poskytovaný cez `providers: [BookingStore]` priamo v `CheckoutComponent` — musí byť per-komponent (nový pri každom vstupe do checkoutu), nie root singleton, inak by `bookingId`/`error` z predošlej rezervácie "pretiekli" do ďalšej návštevy.
  - `booking.service.ts` zostal čistý HTTP klient (žiadny state), pridaný typ `CreateBookingPayload`/`PassengerInput`.
- [x] `ToursStore` (`ck-web/src/app/services/tours.store.ts`) — `tours.component.ts` už nevolá `api.all()` priamo cez `toSignal`, ale cez store, ktorý zoznam zájazdov cachuje (načíta sa raz, zdieľané medzi návštevami stránky). Tento store je naopak **root singleton zámerne** (zoznam zájazdov je bezpečné cachovať, nie je to per-session stav ako booking).
  - Pribudol `loading` signál a "Načítavam zájazdy..." stav v šablóne (predtým chýbal, krátko sa mihlo "Žiadne zájazdy" pri prvom načítaní).
  - **2026-10-06 dodatok:** `loadAll()` teraz vždy refetchne (stale-while-revalidate) — ak už sú dáta v cache, zobrazia sa okamžite a obnovia sa na pozadí bez loading spinnera, takže zmeny v admine (obsadenosť, nové termíny) sa prejavia pri návrate na stránku bez straty pocitu rýchlosti.
- [x] Build + `ng serve` overené, žiadne chyby.

### Zatiaľ nedotknuté (mimo scope tejto fázy, podľa pôvodného zadania)
- `admin-api.service.ts` a admin komponenty (admin-tours, admin-bookings, admin-calendar) — majú podobný "ad-hoc HttpClient v komponente" vzor, ale ich zjednotenie je vyhradené na **Fázu 4** (admin sekcia), nerobiť teraz nabok od plánu.
- `tour-detail.component.ts` — používa `toSignal` + `switchMap` priamo na route params, žiadne manuálne loading/error signály, nebol identifikovaný ako problém → nechané ako je.

## Fáza 3 — Rozbitie veľkých komponentov (čaká, len poznámky)
- `checkout.component.ts` (3 kroky v jednom súbore), `admin-calendar.component.ts` (3 taby + edit panel) sú hlavní kandidáti.

## Fáza 4 — Admin sekcia (čaká)

---

---

## Feature backlog — "Stránka" (nápady od Lukasa, 2026-10-06, nesúvisí s FE refaktorom)

Nerozpracované, len zapísané nech nezapadnú. Netreba robiť v poradí, žiadne priority zatiaľ určené.

- [x] Formulár na objednávky — pridať osobné údaje ✅ hotové 2026-10-06 (pozri commit/zmeny v `bookings`, `checkout`)
- [ ] GDPR (súvisí s rodným číslom, pozri nižšie "Iné otvorené veci")
- [x] Dokumenty na poistenie (upload) ✅ hotové 2026-10-06
- [ ] Obrázky — rozsah nejasný (galéria k zájazdu? viac fotiek? treba upresniť)
- [ ] Registrácia (užívateľské účty? momentálne appka nemá registráciu klientov, len admin login)
- [ ] Recenzie (hodnotenia zájazdov od klientov)
- [ ] Zájazdy na kalendár — zobraziť zájazdy/odchody v kalendári (čiastočne sa prekrýva s `admin-calendar`, ktorý už existuje pre admin — overiť či ide o to isté, alebo o verejne viditeľný kalendár)
- [ ] Autobusy — aké sú už zaplnené (obsadenosť autobusu/zájazdu, admin prehľad)
- [ ] Hodiny, kedy sa ide (čas odchodu — čiastočne pokryté `time`/`timeTo` v `admin-calendar`, overiť či treba aj na verejnej strane)
- [ ] Kalendár zájazdov (pozri vyššie, možno duplicitné s "Zájazdy na kalendár")
- [ ] Šofér — aký mal deň (čiastočne pokryté `admin-calendar` tabmi "Šoféri"/"Denný prehľad", overiť či to stačí alebo treba viac)
- [ ] Cancelation (zrušenie rezervácie klientom alebo adminom)
- [ ] Upraviť detail zájazdov (admin editácia obsahu/popisu zájazdu)
- [ ] Možnosť platby — kartou aj prevodom na účet (momentálne je len Stripe/demo fallback v `payments`)

---

## Feature: skryť zájazdy po termíne z vyhľadávania (2026-10-06) ✅ hotové

`api/booking-api/src/tours/tours.service.ts` — verejné `GET /tours` a `GET /tours/:slug` teraz filtrujú len budúce termíny (`Departure.date >= dnešný deň`); zájazd bez žiadneho budúceho termínu sa vo verejnom zozname nezobrazí. Dáta sa **nemažú** — história ostáva v DB, admin modul (`admin.service.ts`) ide priamo cez Prisma mimo `ToursService`, takže vidí všetko ďalej (minulé termíny, bookingy...).

Odskúšané naživo: DB má 25 zájazdov, verejné API vracia 15 (len s budúcimi termínmi).

## Iné otvorené veci (nesúvisiace s FE refaktorom, len si to tu držím nech nezapadne)

- **GDPR / rodné číslo** — Passenger.nationalId sa ukladá ako plain text, bez šifrovania/retenčnej politiky. Lukas to vedome odložil na neskôr (2026-10-06).
- **Chýbajúca migrácia pre Driver/Bus/ScheduledRide** — tieto modely už sú v `schema.prisma` aj reálne v dev DB (pravdepodobne pridané cez `prisma db push`), ale v `prisma/migrations/` pre ne nie je samostatný záznam. Pri nasadení na čistú DB (`prisma migrate deploy`) by tieto tabuľky chýbali. Treba dorobiť migráciu, ktorá ich vytvorí (podobne ako sa to riešilo pre Passenger 2026-10-06 — `prisma migrate diff` + manuálne vytvorenie migration.sql, pretože `migrate dev` v tomto prostredí nejde neinteraktívne).
- **Backend nemá žiadny test runner** (žiadny Jest config/test script) — flagnuté `tester` agentom, neriešené.
