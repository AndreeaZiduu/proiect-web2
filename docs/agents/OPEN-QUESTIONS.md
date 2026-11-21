# Open questions — proiect-web2

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · What is this project's purpose and intended stack? · _answered_
- Q-002 · How should user location be determined for distance calculation? · _answered_
- Q-003 · How to distinguish 24/7 physical emergency vets from on-call vet clinics in the UI? · _answered_
- Q-004 · How should the monthly on-call rotation CSV be imported? · _answered_
- Q-005 · Should the application support real-time medicine stock tracking or search? · _answered_
- Q-006 · Should the application implement turn-by-turn navigation or rely on external map links? · _answered_
- Q-007 · Should the management system distinguish between MODERATOR and ADMIN roles or collapse into a single ADMIN role? · _answered_
- Q-008 · How should direct action buttons (call and navigation) be presented on facility cards? · _answered_

---

## Q-001 · What is this project's purpose and intended stack?
- **Status:** answered
- **Blocks:** Project vocabulary, architecture, and runnable commands.
- **Who answers:** Project owner
- **Answer:** Web application (P10) for real-time status and search of pharmacies (PHARMACY) and emergency veterinary clinics (EMERGENCY_VET) in Sibiu County. Stack: Node.js (Express), Prisma ORM, MySQL 8.0, Vitest, React, Vite, Leaflet. (Answered: 2026-11-17)

---

## Q-002 · How should user location be determined for distance calculation?
- **Status:** answered
- **Confirmed:** 2026-11-18
- **Blocks:** Geolocation and distance-based sorting in the frontend.
- **Who answers:** Project owner
- **Answer:** Geolocation API in browser (`navigator.geolocation`) with Piața Mare (Sibiu, `45.7983, 24.1503`) fallback and manual city dropdown selector. (Answered: 2026-11-18)

---

## Q-003 · How to distinguish 24/7 physical emergency vets from on-call vet clinics in the UI?
- **Status:** answered
- **Confirmed:** 2026-11-18
- **Blocks:** Visual status badges and facility card presentation for veterinary emergencies.
- **Who answers:** Project owner
- **Answer:** Distinct visual badges: Emerald Green `DESCHIS 24/7 (NON-STOP)` for 24/7 physical presence vs Indigo/Violet `GARDĂ LA APEL TELEFONIC` with pulse dot indicator for on-call phone response outside normal hours. (Answered: 2026-11-18)

---

## Q-004 · How should the monthly on-call rotation CSV be imported?
- **Status:** answered
- **Confirmed:** 2026-11-19
- **Blocks:** On-call schedule management interface and admin tooling.
- **Who answers:** Project owner
- **Answer:** Secure Admin/Moderator dashboard with CSV file upload (dropzone), column validation preview, and import confirmation to `POST /api/rotations/import` (C-004). (Answered: 2026-11-19)

---

## Q-005 · Should the application support real-time medicine stock tracking or search?
- **Status:** answered
- **Blocks:** Medicine inventory database models, search inputs, and pharmacy API integrations.
- **Who answers:** Project owner
- **Answer:** Out of scope. The platform is strictly for emergency triage and availability, without live medicine stock tracking; public real-time pharmacy inventory APIs do not exist in Romania (D-002). (Answered: 2026-11-18)

---

## Q-006 · Should the application implement turn-by-turn navigation or rely on external map links?
- **Status:** answered
- **Blocks:** Map routing engine, GPS tracking services, and navigation buttons in the UI.
- **Who answers:** Project owner
- **Answer:** External deep links to Google Maps / Waze / Apple Maps using facility latitude and longitude (`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`). (Answered: 2026-11-18)

---

## Q-007 · Should the management system distinguish between MODERATOR and ADMIN roles or collapse into a single ADMIN role?
- **Status:** answered
- **Confirmed:** 2026-11-21
- **Blocks:** RBAC schema simplification, user management views, and route protection guards.
- **Who answers:** Project owner
- **Answer:** Se disting cele 4 roluri cerute de fișa de catalog P10 conform deciziei D-003: `ANON` (vizitator liber), `USER` (favorite și raportări comunitare), `MODERATOR` (moderare/aprobare sesizări orar și conflicte) și `ADMIN` (gestiune facilități și import CSV rotații gardă). (Answered: 2026-11-21)

---

## Q-008 · How should direct action buttons (call and navigation) be presented on facility cards?
- **Status:** answered
- **Confirmed:** 2026-11-18
- **Blocks:** Facility card action layout and visual prominence for emergency actions.
- **Who answers:** Project owner
- **Answer:** Single prominent direct quick-call pill button (`[ 📞 Apelează direct: ... ]`) on each facility card for immediate 1-tap emergency dialer access; GPS navigation route deep link is provided in the interactive map tooltip and in the full facility detail modal (DS-02). (Answered: 2026-11-18)
