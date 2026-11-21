# Decisions — proiect-web2

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · 8 Community confirmations for automatic temporary correction approval
- D-002 · Strict boundary: commerce, payments and telemedicine are out of scope
- D-003 · 4-Role hierarchy (ANON, USER, MODERATOR, ADMIN) and server-side RBAC rules
- D-004 · Timezone calculation strictly anchored to Europe/Bucharest
- D-005 · Haversine distance formula with client-side coordinates for sorting
- D-006 · Warm Editorial Minimalist design tokens and semantic status palette

---

## D-001 · 8 Community confirmations for automatic temporary correction approval
- **Status:** approved
- **Confirmed:** 2026-11-19
- **Rule:** Corecțiile de orar raportate de comunitate necesită 8 confirmări de la utilizatori autentificați activi pentru a trece automat în status temporar aprobat (`APPROVED`) până la verificarea și decizia finală a unui moderator sau administrator.
- **Why:** Previne raportările false sau vandalismul menținând în același timp viteza de reacție în timp util dacă o farmacie s-a închis neașteptat.
- **Evidence:** Decis în interviul de cerințe P10 (A3); gestionat în `backend/src/server.js` la `/api/corrections/:id/confirm`.

---

## D-002 · Strict boundary: commerce, payments and telemedicine are out of scope
- **Status:** approved
- **Confirmed:** 2026-11-19
- **Rule:** Comanda online de medicamente, plățile electronice, coșul de cumpărături, telemedicina și chat-ul direct cu personalul medical sunt strict out of scope pentru P10; aplicația este dedicată exclusiv informării de urgență și triajului orarului în timp real.
- **Why:** Delimitarea clară a complexității proiectului academic și alinierea la realitatea operațională (fără integrări bancare și de stocuri farmaceutice).
- **Evidence:** Decis în interviul de cerințe P10 (răspuns la Întrebarea 1).

---

## D-003 · 4-Role hierarchy (ANON, USER, MODERATOR, ADMIN) and server-side RBAC rules
- **Status:** approved
- **Confirmed:** 2026-11-21
- **Rule:** Aplicația implementează o ierarhie strictă cu 4 roluri și control al accesului bazat pe roluri (RBAC) pe server și client:
  1. `ANON` (vizitator neautentificat): acces liber fără cont la căutare, filtrare, vizualizare pe hartă, calcul distanță Haversine și apel direct către unități.
  2. `USER` (utilizator autentificat): include toate permisiunile `ANON` + salvare/ștergere unități la favorite și trimitere sau confirmare (vot) a corecțiilor de orar din comunitate.
  3. `MODERATOR`: include toate permisiunile `USER` + acces la coada de moderare a sesizărilor comunitare de orar (`DS-05` / `ScheduleCorrection`), aprobare (`APPROVED`), respingere (`REJECTED`) și rezolvare a rapoartelor conflictuale (`CONFLICT`). Rutele administrative de import CSV și gestiune facilități sunt restricționate (`403 Forbidden`).
  4. `ADMIN`: include toate permisiunile `MODERATOR` + drepturi depline de administrare: creare, editare și ștergere unități medicale/veterinare (`Facility`) și importul fișierelor CSV lunare pentru rotațiile de gardă (`OnCallRotation`).
  La nivel de backend, middleware-ul `authenticateToken` validează JWT, iar middleware-urile `requireRole(['MODERATOR', 'ADMIN'])` și `requireRole('ADMIN')` impun restricțiile pe rutele protejate.
- **Why:** Respectă cerințele formale din fișa de catalog P10, asigurând acces nocturn fără piedici pentru cetățeni, implicarea comunității cu protecție anti-spam, delegarea moderării sesizărilor către moderatori și rezervarea modificărilor structurale (date facilități, import CSV) exclusiv administratorilor.
- **Evidence:** Definit în fișa de catalog P10 și interviul de cerințe; implementat în middleware-ul RBAC din `backend/src/server.js`, schema Prisma (`Role` enum) și demonstrat în prototipul `docs/design/mocks/full-site-prototype.html`.

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

## D-006 · Warm Editorial Minimalist design tokens and semantic status palette
- **Status:** approved
- **Confirmed:** 2026-11-21
- **Rule:** Aplicația P10 utilizează exclusiv sistemul de design tokens documentat în `docs/design/DESIGN.md` (estetica caldă Warm Editorial Minimalist, inspirată din Originle): fontul `Plus Jakarta Sans` cu cifre tabulare (`tabular-nums`), paletă de culori pe bază de Warm Alabaster (`#FAF7F4`) în Light Mode și Warm Obsidian (`#141210`) în Dark Mode, carduri generoase cu geometrie rotunjită (`24px`), borduri ultra-fine (`1px solid rgba(226, 218, 208, 0.85)`), umbre difuze calde, accente de teracotă caldă (`#C25E34`) pentru numere de index și micro-labels, carduri pe suprafață cărbune inversată (`#1C1917`) pentru atenționare critică în urgențe, diferențiere cromatică de domeniu (Herbal Teal `#0E7465` pentru `PHARMACY` și Royal Indigo `#5548A8` pentru `EMERGENCY_VET`) și semnalistică pentru cele 5 stări de status (`ON_DUTY` cu pulse dot teracotă, `OPEN`, `CLOSING_SOON`, `CLOSED`, `UNKNOWN`).
- **Why:** Asigură consecvență vizuală, un ton calmant și umanist pentru cetățeni în situații nocturne de alertă, lizibilitate optimă și contrast de accesibilitate WCAG AAA, permițând diferențierea imediată a tipului și disponibilității unităților medicale din județul Sibiu.
- **Evidence:** Decis în interviul de stil și revizuirea vizuală Originle aprobată formal de utilizator la 2026-11-21; documentat în `docs/design/DESIGN.md` și prototipat în `docs/design/mocks/full-site-prototype.html`.
