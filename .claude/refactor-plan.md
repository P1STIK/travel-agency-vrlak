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

## Fáza 3 — Rozbitie veľkých komponentov

### Hotovo (2026-10-06) — `checkout`
Rozbité na 5 malých komponentov, každý vo svojom vlastnom priečinku v `ck-web/src/app/pages/checkout/` (napr. `checkout-passengers-step/checkout-passengers-step.component.{ts,html,css}`):
- `checkout-stepper` — čisto prezentačný (progress indikátor)
- `checkout-summary` — sidebar so súhrnom objednávky (používa `.card` z global)
- `checkout-seats-step` — krok 1
- `checkout-passengers-step` — krok 2 (najväčší kus, formArray + upload poistky)
- `checkout-payment-step` — krok 3
- `checkout.component.*` ostal len ako orchestrátor (route params, FormGroup, step signál, delegovanie na `BookingStore`) — žiadna UI logika krokov.
- Reactive forms (`FormGroup`/`FormArray`) sa odovzdávajú child komponentom cez `input()`, akcie idú naspäť cez `output()` (signal-based API, prvé použitie v projekte — predtým sa `@Input`/`@Output` nikde nepoužívalo, lebo neboli žiadne child komponenty).

**Bonusové zjednotenie štýlov (nutné pre túto fázu, nie scope creep):** aby child komponenty nemuseli znova duplikovať `.field*`/`.card__heading`/`.card__text`/`.card__actions*`/`.form-error`, tieto sa presunuli do globálneho `styles.css` (boli už aj predtým duplikované v `contact`, `skibus`, `tour-detail`, `admin/*` — fixnuté teraz, nie len pre checkout).
- `.card__heading`/`.card__text` majú globálnu "compact form" verziu (contact + checkout-rodina). `skibus`/`tour-detail` majú zámerne odlišnú "hero s accent border" verziu — nezlúčené, zdokumentované.
- `.field*` globálne zjednotené pre public stránky (contact + checkout). Admin formuláre (`admin/tours`, `admin/bookings`, `admin/login`) majú vlastnú denšiu verziu — rovnaký dôvod ako admin `.btn`/`.card`, nezlúčené.

Overené: `tsc --noEmit`, `ng build`, `ng serve` (kompiluje čisto), `curl` na `/checkout` vrátil 200.
**Nemám tu nástroj na screenshot/prehliadač** — nebolo vizuálne overené, že layout vyzerá rovnako. Odporúčam preletieť checkout flow v browseri.

### Hotovo (2026-10-06) — `admin-calendar`
Rozbité na 6 komponentov (bolo pôvodne 1542 riadkov v 3 súboroch, teraz 1945 v ~21 súboroch naprieč komponentmi — nárast je boilerplate z rozdelenia, akceptovateľný tradeoff):
- `admin-calendar-toolbar/` — taby, navigácia dátumu, mesiac/týždeň prepínač
- `admin-calendar-grid-view/` — kalendárová mriežka (mesiac/týždeň)
- `admin-calendar-drivers-view/` — tabuľka rozvrhu šoférov
- `admin-calendar-timeline-view/` — denný timeline s jazdami
- `admin-calendar-ride-panel/` — edit + nová jazda panel (zdieľané cez `type` rozlíšenie)
- `admin-calendar-legend/` — **nové, skutočne zdieľané** (nie len "nezlúčiť"): legend pásik sa opakoval identicky v grid/drivers/timeline tiab, takže namiesto kopírovania vznikol jeden komponent s `variant` inputom (`'calendar' | 'drivers' | 'timeline'`), ktorý rozhoduje čo sa dorenderuje za zoznamom šoférov.
- `admin-calendar.component.*` ostal orchestrátor: vlastní všetky signály (`activeTab`, `viewMode`, `currentDate`, `calendarData`, `drivers`, `buses`, `loading`, `saving`, `editState`, `newRideState`), date-range fetch logiku (`loadCalendar`), a API volania (save/delete). Taby-špecifické computed transformácie (`dayMap`, `driverSchedule`, `timelineRows`) sa presunuli priamo do príslušných view komponentov — každý dostáva len surové `calendarData`+`drivers` a počíta si vlastné zobrazenie sám.

**Nové: `shared/utils/calendar-date.utils.ts`** — čisté funkcie (`toDateKey`, `weekStart`, `buildWeekDays`, `buildMonthDays`, `isToday`, `hexToRgba`) + konštanty `WEEK_DAYS`/`MONTHS`/`DAY_NAMES`, predtým duplikované v rámci jedného súboru, teraz zdieľané naprieč všetkými kalendárovými komponentmi aj orchestrátorom. Toto je presne ten "utils priečinok" typ, čo bol pôvodne požadovaný.

**Vedomá duplicita (zdokumentovaná v kóde aj tu):** `.btn` (admin-calendar škála, 6px radius/500 weight) je duplikovaný v `admin-calendar-toolbar` a `admin-calendar-ride-panel` CSS — len tieto dva komponenty ho potrebujú, vytvárať kvôli 15 riadkom CSS siedmy zdieľaný komponent/importný mechanizmus sa nejavilo ako hodnota.

Overené: `tsc --noEmit`, `ng build`, `ng serve`, curl na `/admin/calendar` (200). **Nemám tu nástroj na screenshot/prehliadač** — logika/štruktúra je 1:1 prenesená zo starého kódu (žiadne prepisovanie správania), ale vizuálne som to neoveril. Odporúčam preletieť všetky 3 taby + edit/new-ride panel v browseri.

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

---

## 🐛 Bugfix: `.hidden` prestalo fungovať na mobile (2026-10-06)

**Príčina:** Fáza 1 pridala `.btn`/`.card`/`.field` ako plain CSS pravidlá do `styles.css` **za** `@tailwind utilities;`. Tailwind generuje `.hidden { display: none }` a `.md:inline-flex { display: inline-flex }` s rovnakou špecifickosťou ako `.btn`. Pri remíze v špecifickosti vyhráva neskorší v súbore → `.btn`-ove `display: inline-flex` prebilo `.hidden`, takže čokoľvek s triedami `btn ... hidden md:inline-flex` (napr. tlačidlo "Kontaktujte nás" v headeri) sa zobrazovalo aj na mobile, hoci malo byť skryté.

**Oprava:** všetky custom triedy (`.btn*`, `.card*`, `.field*`, `.form-error`) presunuté do `@layer components { ... }` v `styles.css` — Tailwindov vrstvový systém garantuje, že `utilities` vrstva vždy vyhrá nad `components`, nezávisle od poradia v súbore. Overené priamo v skompilovanom `dist/.../styles.css` — `.hidden` je teraz až po `.btn`.

**Poučenie pre budúcnosť:** akékoľvek ďalšie custom CSS pridávané do `styles.css` (nie component-scoped CSS, len tento globálny súbor) musí ísť do `@layer components { }` (alebo `@layer utilities` ak má zámerne prebíjať Tailwind utility triedy), nikdy ako "holé" pravidlá mimo vrstiev — inak hrozí rovnaký typ konfliktu nabudúce.

**Nepotvrdené/na overenie:** screenshot, ktorý na tento bug upozornil, ukazoval aj orezaný nadpis "Zájazdy" na `/zajazdy` — to vyzerá ako normálne správanie `position: sticky` headera po miernom scrolli (nie bug), ale keďže nemám prehliadač na overenie, treba to po tomto fixe skontrolovať nanovo na čerstvo načítanej stránke.

---

## Feature: základný cookie consent banner (2026-10-06) ✅ hotové

- `CookieConsentService` (`ck-web/src/app/services/cookie-consent.service.ts`) — signal `consent: 'accepted'|'rejected'|null`, drží v `localStorage`. Appka momentálne nemá žiadnu analytiku/marketing skripty, takže banner zatiaľ len zaznamenáva rozhodnutie návštevníka vopred.
- `CookieConsentComponent` (`shared/cookie-consent/`) — banner dole na stránke, zobrazí sa len kým `consent()` nie je nastavený. Vypnutý na `/admin/*` (rovnako ako header/footer).
- **Pred pridaním akéhokoľvek trackovacieho skriptu (GA, Meta pixel...) treba ten skript načítať podmienene** — `if (cookieConsentService.consent() === 'accepted') { ...načítaj skript... }` — inak banner nemá právny zmysel. Zatiaľ nie je čo takto podmieňovať.
- ~~Link na GDPR/privacy policy stránku v banneri zámerne vynechaný~~ → **hotové 2026-10-06**: Lukas poslal text, vznikli stránky `/gdpr` a `/cookies` (`pages/gdpr/`, `pages/cookies/`), routy pridané do `app.routes.ts`. Banner teraz linkuje na `/cookies`. Footer (`shared/footer/footer.component.html`) na tieto routy už linkoval dávnejšie (`routerLink="/gdpr"`, `routerLink="/cookies"`), boli to predtým mŕtve odkazy — teraz fungujú.
  - Layout/typografia (`.legal__*`) je v globálnom `styles.css`, zdieľané medzi `/gdpr` a `/cookies` (vytvorené spolu, takže sa rovno zdieľalo namiesto kopírovania).
  - Footer linkuje aj na `/obchodne-podmienky` a `/galeria` — tie stránky/routy **neexistujú** (mimo scope tejto úlohy, text na ne som nedostal). Zostávajú mŕtve odkazy, treba doriešiť neskôr.

## Iné otvorené veci (nesúvisiace s FE refaktorom, len si to tu držím nech nezapadne)

- **GDPR / rodné číslo** — Passenger.nationalId sa ukladá ako plain text, bez šifrovania/retenčnej politiky. Lukas to vedome odložil na neskôr (2026-10-06).
- ~~Chýbajúca migrácia pre Driver/Bus/ScheduledRide~~ → **hotové 2026-10-07**: migrácia `20261007000000_add_ride_calendar` to doriešila (súčasť staff-roles práce).
- **Backend nemá žiadny test runner** (žiadny Jest config/test script) — flagnuté `tester` agentom, neriešené.

---

## 🚨 INCIDENT: architekt vymazal celú dev databázu (2026-10-07)

Pri kontrole "sedí schéma s migráciami" spustil `prisma migrate diff` s `--shadow-database-url` postaveným cez `sed` rewrite na dočasnú DB. macOS `sed` nepodporuje `\|`, rewrite ticho zlyhal, shadow URL sa vyhodnotilo na **reálnu dev DB** a Prisma ju pred použitím resetla. Vymazané: všetky tabuľky (Tour, Departure, Booking, StaffUser, Driver, Bus) — 51 departures, 4 staff účty (admin + 3 šoféri), žiadna záloha neexistovala.

**Obnovené v tej istej konverzácii:** `npm run seed` (25 zájazdov, 50 termínov, 5 autobusov) + ručne znova vytvorené 4 staff účty (nové heslá — heslá nie sú zapísané tu, Lukas ich dostal priamo v konverzácii).

**Poistka (urobené):** `.claude/agents/architect.md` a `.claude/agents/backend-engineer.md` teraz majú explicitný zákaz `--shadow-database-url`/string-rewrite DB URL príkazov, s popisom presne tohto incidentu a bezpečnou alternatívou (`migrate diff --from-url "$DATABASE_URL" ... --script`, žiadna shadow DB).

**Čo by sme ešte mohli zvážiť** (nerobené, len nápad): pravidelný `pg_dump` lokálnej dev DB pred rizikovejšími operáciami, keďže momentálne neexistuje žiadna záloha vôbec.

---

## Feature: Zákaznícke účty (registrácia, prihlásenie, profil) — 2026-11-07 ✅ hotové

Samostatný `User` model (nezávislý od `StaffUser` z fázy staff rolí) — email, heslo, meno, telefón, adresa. **Bez** rodného čísla/dátumu narodenia (tie ostávajú len per-cestujúci v `Passenger`, nie duplicitne v profile — rozhodnutie z predošlej diskusie).

**Postavené (BE + FE + tester, cez architekta):**
- `POST /auth/customer/register`, `POST /auth/customer/login` — samostatný token typ (`customer`, 30 dní), oddelený od staff tokenu (8h). Rate limit cez `@nestjs/throttler`.
- `customers/` modul: `GET/PATCH /me`, `PATCH /me/password`, `GET /me/bookings`, `DELETE /me` (rezervácie ostanú, len sa odviažu)
- `POST /booking` — voliteľné prepojenie na účet (guest checkout funguje ďalej bez zmeny)
- `GET /admin/customers` — admin-only zoznam zákazníkov (šofér nemá prístup)
- FE: `/prihlasenie`, `/registracia`, `/moj-ucet` (rozdelené na `account-profile`/`account-password`/`account-bookings`/`account-delete`), login/účet v headeri, predvyplnenie checkoutu z profilu (len prázdne polia, nikdy rodné číslo/dátum narodenia), `admin/zakaznici` stránka
- GDPR stránka doplnená o faktickú sekciu "Zákaznícky účet" — **čaká na právne schválenie** (právny základ spracovania, dátum účinnosti)

**Bug fixnutý po ceste:** `admin-auth.interceptor.ts` predtým odhlasoval aj zákazníkov na admin login pri 401 z akéhokoľvek requestu — teraz reaguje len na 401 z `/admin/*`.

**DB maintenance, ktorú si architekt všimol a opravil:**
- Po incidente z 2026-10-07 chýbala Prisma migračná história (`_prisma_migrations`) — DB bola evidentne obnovená priamo zo schémy, nie prehraním migrácií. Opravené cez `prisma migrate resolve --applied` pre všetkých 9 migrácií (len zápis do histórie, žiadna zmena dát).
- **Prvá reálna záloha dev DB vôbec**: `pg_dump` pred touto prácou, uložený mimo repo (`~/cestovka-db-backups/`). Spomínaný "pravidelný pg_dump" nápad vyššie — toto bol prvý krok tým smerom.

**Testovacie dáta v DB:** demo zákaznícky účet `demo.zakaznik@example.com` (heslo dal Lukasovi priamo v chate, nie v súbore) + pár testovacích rezervácií (teraz guest bookings, keďže testovacie účty sa zmazali) — ponechané na Lukasovo zváženie, či vyčistiť.

**Otvorené:**
- GDPR text — právne schválenie
- `ng build` stále zlyháva na CSS limite (`header.component.css`, 8.09 kB vs 8 kB) — nesúvisí s touto funkciou, existovalo už predtým
- FE má dve cesty k API (`BookingService` cez `/api` proxy, zvyšok cez `environment.api` priamo) — nekonzistencia, nenarobilo problém teraz, treba doriešiť pred nasadením
- Email sa nedá zmeniť (žiadne overovanie emailu) — vedomé, treba email sending najprv
- Deferred ako predtým: overenie emailu, reset hesla, prepojenie starých guest rezervácií na účet
