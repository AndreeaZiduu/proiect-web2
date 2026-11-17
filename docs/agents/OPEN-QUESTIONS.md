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
- Q-002 · How should user location be determined for distance calculation?
- Q-003 · How to distinguish 24/7 physical emergency vets from on-call vet clinics in the UI?
- Q-004 · How should the monthly on-call rotation CSV be imported?
- Q-005 · Should the application support real-time medicine stock tracking or search?
- Q-006 · Should the application implement turn-by-turn navigation or rely on external map links?
- Q-007 · Should the management system distinguish between MODERATOR and ADMIN roles or collapse into a single ADMIN role?

---

## Q-001 · What is this project's purpose and intended stack?
- **Status:** answered
- **Blocks:** Project vocabulary, architecture, and runnable commands.
- **Who answers:** Project owner
- **Answer:** Web application (P10) for real-time status and search of pharmacies (PHARMACY) and emergency veterinary clinics (EMERGENCY_VET) in Sibiu County. Stack: Node.js (Express), Prisma ORM, MySQL 8.0, Vitest, React, Vite, Leaflet. (Answered: 2026-11-17)

---

## Q-002 · How should user location be determined for distance calculation?
- **Status:** open
- **Blocks:** Geolocation and distance-based sorting in the frontend.
- **Who answers:** Project owner
- **Proposed answer:** Geolocation API in browser with Piața Mare (Sibiu) fallback and a manual city selector dropdown.

---

## Q-003 · How to distinguish 24/7 physical emergency vets from on-call vet clinics in the UI?
- **Status:** open
- **Blocks:** Visual status badges and facility card presentation for veterinary emergencies.
- **Who answers:** Project owner
- **Proposed answer:** Distinct visual badges: Green for 24/7 physical presence vs Orange with a call icon for on-call phone response.

---

## Q-004 · How should the monthly on-call rotation CSV be imported?
- **Status:** open
- **Blocks:** On-call schedule management interface and admin tooling.
- **Who answers:** Project owner
- **Proposed answer:** Secure Admin/Moderator dashboard with CSV file upload, preview validation, and import confirmation.

---

## Q-005 · Should the application support real-time medicine stock tracking or search?
- **Status:** open
- **Blocks:** Medicine inventory database models, search inputs, and pharmacy API integrations.
- **Who answers:** Project owner
- **Proposed answer:** Out of scope; public real-time pharmacy inventory APIs do not exist in Romania.

---

## Q-006 · Should the application implement turn-by-turn navigation or rely on external map links?
- **Status:** open
- **Blocks:** Map routing engine, GPS tracking services, and navigation buttons in the UI.
- **Who answers:** Project owner
- **Proposed answer:** External deep links to Google Maps / Waze / Apple Maps using facility latitude and longitude.

---

## Q-007 · Should the management system distinguish between MODERATOR and ADMIN roles or collapse into a single ADMIN role?
- **Status:** open
- **Blocks:** RBAC schema simplification, user management views, and route protection guards.
- **Who answers:** Project owner
- **Proposed answer:** Keep separate roles (MODERATOR for queue approval, ADMIN for facilities, CSV roster imports, and user management) as already defined in Prisma schema.
