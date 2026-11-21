# Plan — Schemă Bază de Date MySQL & Roluri RBAC (User, Moderator, Admin)

> **Status:** APPROVED (aprobat de utilizator pe 2026-11-21)  
> **Document:** `docs/plans/02-db-schema.md`  
> **Proiect:** P10 — Farmacii și Cabinete Veterinare de Urgență Sibiu

---

## Size
**S** — Actualizarea enum-ului de roluri în schema Prisma, migrarea bazei de date MySQL 8.0, middleware-ul RBAC pe server și testele de integrare pentru permisiuni.

---

## Approach
* Actualizăm modelul `User` și enum-ul `Role` din schema Prisma pentru a include explicit cele 3 roluri persistate: `USER`, `MODERATOR`, `ADMIN` (cu `ANON` ca vizitator neautentificat la nivel de middleware).
* Configurăm middleware-ul de autorizare server-side `authenticateToken` și `requireRole` în Express.
* Implementăm verificarea ierarhică: `MODERATOR` are acces la coada de corecții și rezolvare de conflicte (`200 OK`), dar primește `403 Forbidden` pe rutele rezervate exclusiv administratorilor (import CSV și operații de scriere/ștergere facilități).
* Adăugăm teste de integrare automate pentru validarea codurilor HTTP de stare (`200`, `401`, `403`).

---

## Files

| Acțiune | Cale fișier | Ce conține |
|---|---|---|
| modificare | `backend/prisma/schema.prisma` | Adăugare `MODERATOR` în `enum Role { USER, MODERATOR, ADMIN }` |
| modificare | `backend/src/server.js` | Extindere middleware RBAC `requireRole` (`['MODERATOR', 'ADMIN']` vs `['ADMIN']`) |
| creare | `backend/tests/rbac.test.js` | Teste automate de integrare RBAC pentru permisiunile fiecărui rol |

---

## Tests

| # | Ce verificăm | Cum testăm | Tip |
|---|---|---|---|
| 1 | `MODERATOR` poate revizui și aproba/respinge o corecție de orar (`200 OK`) | Test integrare `PATCH /api/corrections/:id/status` cu token de `MODERATOR` | Automat |
| 2 | `MODERATOR` este blocat la importul de rotații CSV (`403 Forbidden`) | Test integrare `POST /api/rotations/import` cu token de `MODERATOR` | Automat |
| 3 | `MODERATOR` este blocat la ștergerea unei unități medicale (`403 Forbidden`) | Test integrare `DELETE /api/facilities/:id` cu token de `MODERATOR` | Automat |
| 4 | `ADMIN` are acces complet la moderare, import CSV și ștergere unități (`200 OK`) | Test integrare pe toate rutele protejate cu token de `ADMIN` | Automat |
| 5 | `USER` nu poate accesa rutele de moderare sau administrare (`403 Forbidden`) | Test integrare pe rutele de moderare/admin cu token de `USER` | Automat |
| 6 | Vizitatorul `ANON` este respins la orice rută protejată (`401 Unauthorized`) | Test integrare fără header de autorizare | Automat |

---

## Schema & RBAC Architecture

### 1. Prisma Enum & Model `User`
```prisma
enum Role {
  USER
  MODERATOR
  ADMIN
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())

  favorites            Favorite[]
  submittedCorrections ScheduleCorrection[] @relation("SubmittedBy")
  reviewedCorrections  ScheduleCorrection[] @relation("ReviewedBy")
}
```

### 2. Matricea de Permisiuni RBAC (Conform D-003)

| Rută API | Metodă HTTP | `ANON` | `USER` | `MODERATOR` | `ADMIN` |
|---|---|---|---|---|---|
| `/api/facilities` | GET | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/facilities/:id` | GET | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/favorites` | GET / POST | 401 Unauth | 200 OK | 200 OK | 200 OK |
| `/api/favorites/:id` | DELETE | 401 Unauth | 200 OK | 200 OK | 200 OK |
| `/api/corrections` | POST | 401 Unauth | 200 OK | 200 OK | 200 OK |
| `/api/corrections/:id/confirm` | POST | 401 Unauth | 200 OK | 200 OK | 200 OK |
| `/api/corrections/:id/status` | PATCH | 401 Unauth | 403 Forbidden | **200 OK** | **200 OK** |
| `/api/rotations/import` | POST | 401 Unauth | 403 Forbidden | **403 Forbidden** | **200 OK** |
| `/api/facilities/:id` | DELETE | 401 Unauth | 403 Forbidden | **403 Forbidden** | **200 OK** |

---

## Risks
* **Incompatibilitate date existente:** `npx prisma db push` păstrează datele existente și adaugă noua valoare `MODERATOR` în tipul `ENUM('USER','MODERATOR','ADMIN')`.
* **Tokenuri JWT expirate sau vechi:** Middleware-ul `authenticateToken` citește câmpul `role` direct din payload-ul JWT validat criptografic cu `JWT_SECRET`.

---

## Out of scope
* Înregistrare publică directă cu rol de `MODERATOR` sau `ADMIN` (înregistrarea publică creează strict utilizatori `USER`; rolurile avansate se atribuie prin seed sau de către administratori).
* Sistem multinivel ierarhic dinamic (permisiuni granulare pe tabele); cele 4 roluri fixe acoperă integral cerințele catalogului P10.

---

## Knowledge used

| Notă | Ce prevede | De ce se aplică | Decizie |
|---|---|---|---|
| `D-001` | Pragul de 8 confirmări comunitare | Modul de aprobare automată temporară înainte de decizia moderatorului/adminului | confirmat |
| `D-002` | Delimitare out-of-scope (fără comerț) | Menține schema curată, fără tabele de plăți sau comenzi | confirmat |
| `D-003` | Ierarhia celor 4 roluri (ANON, USER, MODERATOR, ADMIN) | Baza arhitecturală a regulilor RBAC din schema Prisma | confirmat |
| `C-003` | Contract API pentru corecțiile de orar | Specifică endpoint-urile `/api/corrections` și `/status` | confirmat |
| `C-004` | Contract API pentru importul rotațiilor CSV | Specifică endpoint-ul securizat `/api/rotations/import` (doar ADMIN) | confirmat |
| `Q-007` | Roluri distincte MODERATOR și ADMIN | Stabilește separarea drepturilor de moderare de cele administrative | confirmat |
