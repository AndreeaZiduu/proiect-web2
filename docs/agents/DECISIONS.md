# Decisions — proiect-web2

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · 8 Community confirmations for automatic temporary correction approval
- D-002 · Strict boundary: commerce, payments and telemedicine are out of scope
- D-003 · Authentication requirement for favorites and crowd reporting
- D-004 · Timezone calculation strictly anchored to Europe/Bucharest
- D-005 · Haversine distance formula with client-side coordinates for sorting
- D-006 · Modern Healthcare Minimalist design tokens and semantic status palette

---

## D-001 · 8 Community confirmations for automatic temporary correction approval
- **Status:** approved
- **Rule:** Corecțiile de orar raportate de comunitate necesită 8 confirmări de la utilizatori autentificați activi pentru a trece automat în status temporar aprobat (`APPROVED`) până la verificarea și decizia finală a unui moderator sau administrator.
- **Why:** Previne raportările false sau vandalismul menținând în același timp viteza de reacție în timp util dacă o farmacie s-a închis neașteptat.
- **Evidence:** Decis în interviul de cerințe P10 (A3); gestionat în `backend/src/server.js` la `/api/corrections/:id/confirm`.

---

## D-002 · Strict boundary: commerce, payments and telemedicine are out of scope
- **Status:** approved
- **Rule:** Comanda online de medicamente, plățile electronice, coșul de cumpărături, telemedicina și chat-ul direct cu personalul medical sunt strict out of scope pentru P10; aplicația este dedicată exclusiv informării de urgență și triajului orarului în timp real.
- **Why:** Delimitarea clară a complexității proiectului academic și alinierea la realitatea operațională (fără integrări bancare și de stocuri farmaceutice).
- **Evidence:** Decis în interviul de cerințe P10 (răspuns la Întrebarea 1).

---

## D-003 · Authentication requirement for favorites and crowd reporting
- **Status:** approved
- **Rule:** Căutarea, filtrarea, vizualizarea pe hartă și apelul direct sunt accesibile liber fără cont; salvarea unităților favorite și trimiterea sau confirmarea modificărilor de program necesită cont autentificat (`USER`).
- **Why:** Asigură acces instant în caz de urgență nocturnă oricărui cetățean fără fricțiune, protejând în același timp baza de date împotriva spam-ului.
- **Evidence:** Decis în interviul de cerințe P10 (răspuns la Întrebarea 2); implementat prin middleware-ul `authenticateToken` din `backend/src/server.js`.

---

## D-004 · Timezone calculation strictly anchored to Europe/Bucharest
- **Status:** approved
- **Confirmed:** 2026-11-18
- **Rule:** Calculul statusului unităților (deschis/închis, pauză, de gardă, sărbători) se realizează deterministic exclusiv în fusul orar `Europe/Bucharest`, indiferent de fusul orar al mașinii client sau al serverului containerizat.
- **Why:** Previne erorile critice cauzate de serverele rulate în UTC sau utilizatori care accesează aplicația de pe dispozitive cu alt timezone; garantează consecvența rotațiilor de gardă și a sărbătorilor legale românești.
- **Evidence:** Implementat în `backend/src/status.js` (`getBucharestParts`, `Intl.DateTimeFormat`) și testat prin `backend/tests/status.test.js` (testul 16).

---

## D-005 · Haversine distance formula with client-side coordinates for sorting
- **Status:** approved
- **Confirmed:** 2026-11-18
- **Rule:** Distanța terestră dintre utilizator și fiecare unitate se calculează prin formula Haversine în backend/frontend pe baza coordonatelor GPS `(latitude, longitude)`, iar dacă permisiunea de locație lipsește, se folosește un punct de referință implicit (Sibiu Centru - Piața Mare).
- **Why:** Permite sortarea directă a farmaciilor și clinicilor veterinare de la cea mai apropiată la cea mai depărtată în caz de urgență, fără dependențe externe de geocoding plătite.
- **Evidence:** Implementat în `backend/src/server.js` (`calculateDistanceKm`).

---

## D-006 · Modern Healthcare Minimalist design tokens and semantic status palette
- **Status:** approved
- **Confirmed:** 2026-11-18
- **Rule:** Aplicația P10 utilizează exclusiv sistemul de design tokens documentat în `docs/design/DESIGN.md`: fontul `Plus Jakarta Sans` cu cifre tabulare (`tabular-nums`), temă duală Light și Dark (Midnight Slate `#0B0F19`), diferențiere cromatică de domeniu (Verde Teal `#0D9488` pentru `PHARMACY` și Indigo `#6366F1` pentru `EMERGENCY_VET` cu bordură de accent 4px) și semnalistică pentru cele 5 stări de status (`ON_DUTY` cu pulse dot, `OPEN`, `CLOSING_SOON`, `CLOSED`, `UNKNOWN`).
- **Why:** Asigură consecvență vizuală, lizibilitate optimă în situații nocturne de urgență (contrast WCAG AAA) și diferențiere imediată a tipului și disponibilității unităților medicale din județul Sibiu.
- **Evidence:** Decis în interviul de stil P10 și aprobat formal de utilizator; documentat în `docs/design/DESIGN.md`.
