# Architecture — proiect-web2

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
`proiect-web2` (P10) este o aplicație web dedicată cetățenilor și deținătorilor de animale din județul Sibiu pentru căutarea și verificarea disponibilității în timp real a farmaciilor (`PHARMACY`) și cabinetelor veterinare de urgență (`EMERGENCY_VET`).

```text
[ Browser / Client (React 19 + Leaflet) ]
                |
                | HTTP / REST (JSON)
                v
[ Backend API (Node.js Express) ]
       |                 \
       | Status Engine    \ Prisma ORM
       v                   v
[ Europe/Bucharest ]   [ MySQL 8.0 (Docker :3307) ]
(5 Surse de Adevăr)    (65 unități, orare, rotații, corecții)
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Frontend Client | `frontend/` | Interfață React (Vite, Leaflet, CSS) cu vizualizare split-screen desktop și comutator hartă/listă pe mobil | Backend API via `fetch`/`axios` |
| Backend Server | `backend/src/server.js` | REST API (autentificare JWT, filtrare facilități, calcul distanță Haversine, favorite, moderare) | MySQL via Prisma, Client Frontend |
| Status Engine | `backend/src/status.js` | Algoritm deterministic de evaluare a statusului în timp real pe baza a 5 surse de adevăr în fusul orar `Europe/Bucharest` | Backend Server |
| Database Layer | `backend/prisma/` | Schemă relațională Prisma, migrări și scripturi de populare (`seed.js`) din `sibiu-facilities.json` | MySQL 8.0 Engine |
| Automated Tests | `backend/tests/status.test.js` | Suită Vitest (19 teste) care acoperă orare normale, ture de noapte, sărbători legale, rotații de gardă și corecții | Status Engine |

## Data flow
1. **Descoperire și căutare unități**: Utilizatorul accesează interfața -> Frontend trimite `GET /api/facilities` cu filtre (tip, oraș, deschis acum, de gardă, coordonate GPS) -> Backend interoghează MySQL prin Prisma -> Pentru fiecare unitate se rulează `getFacilityStatus(facility, now)` în fusul orar `Europe/Bucharest` -> Se calculează distanța Haversine dacă există coordonate client -> Răspuns JSON cu lista ordonată.
2. **Crowdsourcing corecții program**: Utilizator autentificat trimite `POST /api/corrections` -> Alți utilizatori trimit `POST /api/corrections/:id/confirm` -> La atingerea a 8 confirmări (D-001) statusul devine automat `APPROVED` temporar -> Administratorul poate aproba sau respinge definitiv din panoul de administrare.
3. **Import rotații de gardă**: Administratorul trimite `POST /api/rotations/import` cu fișierul CSV lunar -> Datele sunt validate și inserate în tabela `OnCallRotation`.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| Unități medicale și veterinare | `Facility`, `FacilityService` | Backend / DB | 65 unități validate din județul Sibiu |
| Programe săptămânale standard | `RegularSchedule` | Backend / DB | Intervale orare deschidere/închidere pe zile (0..6), suport ture peste miezul nopții |
| Excepții de sărbători legale | `HolidaySchedule` | Backend / DB | Zile libere legale și orare speciale |
| Rotații de gardă oficiale | `OnCallRotation` | Backend / DB | Intervale exacte de gardă nocturnă și de sărbători |
| Corecții comunitare | `ScheduleCorrection` | Backend / DB | Propuneri utilizatori, contor confirmări, status PENDING/APPROVED/REJECTED |
| Utilizatori și roluri | `User` | Backend / DB | Conturi locale securizate cu bcrypt (`USER`, `ADMIN`) |
| Favorite utilizator | `Favorite` | Backend / DB | Cheie compusă `(userId, facilityId)` |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `PORT` | `backend/.env` | `backend/src/server.js` | Portul serverului HTTP (default: 4000) |
| `DATABASE_URL` | `backend/.env` | Prisma Client | String conexiune MySQL 8.0 (default port 3307) |
| `JWT_SECRET` | `backend/.env` | Auth Middleware | Cheie secretă semnare token-uri JWT |
| `APP_TIMEZONE` | `backend/.env` | Status Engine | Fusul orar oficial al aplicației (`Europe/Bucharest`) |

## Build, deploy, runtime
- **Backend:** Node.js (v20+), `npm test` (Vitest), `npx prisma db push`, `npm run seed`, `npm start` (port 4000).
- **Frontend:** React 19, Vite, Leaflet, `npm run dev` (port 5173), `npm run build`.
- **Database:** MySQL 8.0 containerizat prin `docker-compose.yml` pe portul 3307.

## Boundaries
Contractele API sunt documentate în [CONTRACTS.md](./CONTRACTS.md):
- `C-001`: Facilities Query & Status API
- `C-002`: Real-time Status Calculation Engine
- `C-003`: Community Corrections API
- `C-004`: On-Call Rotation CSV Import API
