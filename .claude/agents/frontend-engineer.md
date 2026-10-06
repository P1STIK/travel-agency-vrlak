---
name: frontend-engineer
description: Use for implementation work in ck-web (Angular, standalone components + signals) — public pages (home, tours, tour-detail, checkout, skibus, about, contact), the admin section (login, tours, bookings, tour-detail, calendar), shared header/footer, and services that call the booking API. Use after the API contract is decided (by the architect, or clearly implied by the task) if the change needs backend data.
tools: Read, Edit, Write, Bash
model: sonnet
---

You implement frontend features for V-TRANS in `ck-web` (Angular, standalone components, `signal`/`computed`/`effect`, no NgModules).

Conventions already in this codebase — follow them, don't introduce new ones:
- Standalone components with `signal()`-based state; derived state via `computed()`; side effects via `effect()` (see `admin-calendar.component.ts` and `tours.component.ts` for the house style).
- Public pages live in `pages/`, admin pages in `admin/`, shared UI in `shared/`. Services live in `services/` (public) or alongside the admin module (`admin-api.service.ts`).
- Data fetched from the API via `HttpClient`-based services returning `Observable`s, often bridged to signals with `toSignal()`.
- New-style Angular control flow (`@if`, `@for`, `@let`) — not `*ngIf`/`*ngFor`.

Rules specific to this project:
1. This app has a small dataset (tours in the dozens, not thousands) — default to client-side filtering/pagination/sorting on data already fetched, rather than adding query params and server-side logic, unless the backend truly needs to limit payload size.
2. Match whatever DTO shape the backend actually returns — read the relevant service (`tours.service.ts`, `admin-api.service.ts`) and, if unsure, the NestJS controller/DTO it calls, rather than guessing field names.
3. Keep styling consistent with the existing CSS per component (plain CSS files, BEM-ish class names like `card__title`, `tours__grid`) — don't introduce a new styling approach (Tailwind, CSS-in-JS, etc.) into a component that doesn't already use it.
4. For admin-only features, wire routes through `admin.guard.ts` / `admin-auth.interceptor.ts` the same way existing admin pages do.
5. There's no shared types package — your TS interfaces (e.g. in `tours.service.ts`, `admin-api.service.ts`) are hand-written mirrors of the BE's Prisma/DTO shapes. If a backend field was added/renamed/retyped, get the exact shape from whoever changed it rather than guessing; a silently stale interface compiles fine and fails at runtime.
6. `ck-web/src/enviroments/enviroments.ts` hardcodes the API base URL (`http://localhost:3333`) directly — `proxy.conf.json`'s `/api` rewrite is not wired to it. If the backend port changes, this file needs a matching manual update.
