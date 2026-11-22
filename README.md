# P10 — Farmacii de Gardă și Cabinete Veterinare de Urgență (Județul Sibiu)

Aplicație web dedicată cetățenilor și deținătorilor de animale din județul Sibiu pentru căutarea rapidă și verificarea disponibilității în timp real a farmaciilor și serviciilor veterinare de urgență (inclusiv pe timpul nopții, în weekend-uri și de sărbători legale).

---

## 1. Scope-ul Complet al Proiectului

### 1.1. Date și Unitați Reale (Catalog Oficial Sibiu)
Catalogul conține **65 de unități reale** verificate și cartografiate prin coordonate GPS (detaliate în `DATA.md` și `sibiu-facilities.json`):
* **50 Farmacii Comunitare (`PHARMACY`):**
  * Unități cu program Non-Stop 24/7 (Sibiu, Mediaș).
  * Hiper-farmacii și unități din galerii comerciale (Promenada Mall, Shopping City Șelimbăr, Prima Shopping).
  * Farmacii comunitare de proximitate cu receptură și preparate oficinale (Sibiu, Cisnădie, Avrig, Cristian, Șura Mică).
* **15 Unități Medicale Veterinare de Urgență (`EMERGENCY_VET`):**
  * Spitale veterinare cu asistență continuă și linie de gardă 24/7 în sediu (Spitalul Veterinar Transilvania Sibiu & Cisnădie, VetHouse Sibiu).
  * Clinici și cabinete cu permanență telefonică / linie de urgență la apel (PartnerVet, LaVet, Vetcon, Hermann Vet Cisnădie, DanVet Mediaș, Total Vet Avrig).

### 1.2. Funcționalități Principale (În Scope)
1. **Motor Deterministic de Calcul al Statusului în Timp Real:**
   * Evaluare instantanee în fusul orar `Europe/Bucharest` pe baza a **5 niveluri de priorități**:
     1. `APPROVED_CORRECTION` — Corecții temporare aprobate (ex. inventar, pană curent).
     2. `ON_CALL_ROTATION` — Rotații oficiale de gardă (deschis permanent pe durata gărzii).
     3. `HOLIDAY_SCHEDULE` — Program special sau închis de sărbători legale.
     4. `REGULAR_SCHEDULE` — Program standard pe zile, cu suport pentru pauze de prânz și ture peste miezul nopții (`crossesMidnight`).
     5. `CLOSING_SOON` — Avertizare vizuală dacă unitatea se închide în mai puțin de 30 de minute.
2. **Hartă Interactivă și Localizare:**
   * Redare Leaflet cu pini colorați în funcție de status (Deschis, Închis, De gardă, Se închide curând).
   * Calculul distanței terestre prin formula Haversine și sortare după proximitate.
3. **Apel Direct și Rutare Rapidă:**
   * Buton mare de apel telefonic (`tel:<numar>`) și generare automată de link-uri către Google Maps / Waze.
4. **Crowdsourcing & Raportare Erori de Program:**
   * Utilizatorii autentificați pot raporta modificări de orar.
   * Auto-aprobare temporară la atingerea a 8 confirmări din partea comunității, înainte de revizuirea finală de către administratori/moderatori.
5. **Import CSV Listă de Gardă:**
   * Punct final securizat pentru importul lunar al rotațiilor de gardă farmaceutică și veterinară în format CSV standardizat.
6. **Sistem de Favorite:**
   * Salvarea unităților frecvent utilizate pentru acces nocturn instant.
7. **Ghid de Urgență Local:**
   * Panou rapid cu numere de telefon critice (112, Colegiul Farmaciștilor Sibiu, Dispecerat DSVSA Sibiu).

### 1.3. Ce NU Intră în Scope (Limite Explicite)
* **Comenzi online de medicamente și coș de cumpărături:** Aplicația este de informare și triaj, fără vânzare online.
* **Procesare de plăți electronice:** Fără plăți cu cardul sau abonamente.
* **Telemedicină / Consultații online / Chat:** Fără mesagerie integrată; contactul este strict telefonic direct.
* **Monitorizarea stocurilor de medicamente în timp real:** Nu există baze de date publice interoperabile în România pentru stocuri farmaceutice.
* **Navigație turn-by-turn proprie:** Se folosesc deep-link-uri către aplicațiile native de navigație (Google Maps / Waze).

---

## 2. Stack Tehnologic

| Nivel | Tehnologie | Rol / Responsabilitate |
| :--- | :--- | :--- |
| **Backend** | Node.js (v20+), Express | API REST, middleware JWT, calcul Haversine, import rotații |
| **ORM & Bază de Date** | Prisma ORM, MySQL 8.0 | Schemă relațională, migrări automate, indexare GPS și orare |
| **Motor Status** | JavaScript (ESM) | Calcul status 5 surse în `Europe/Bucharest` via `Intl.DateTimeFormat` |
| **Testare Automată** | Vitest (v5.1+) | 45 teste automate pentru orare, gardă, nopți, sărbători, RBAC pe 4 roluri, CSV și geocodare |
| **Frontend** | React 19, Vite, Leaflet, PWA | Interfață split-screen desktop, comutator mobil, rutare OSRM pe hartă, Service Worker offline |
| **Infrastructură Dev** | Docker, Docker Compose | Instanță MySQL 8.0 pe portul 3307 |

---

## 3. Variabile de Mediu și Configurare

Fișierul `backend/.env` conține următoarele variabile:

```env
PORT=4000
DATABASE_URL="mysql://root:rootpassword@localhost:3307/sibiu_facilities"
JWT_SECRET="dev-secret-farmacii-sibiu"
APP_TIMEZONE="Europe/Bucharest"
```

* `PORT`: Portul pe care ascultă serverul Express (implicit `4000`).
* `DATABASE_URL`: Stringul de conexiune către instanța MySQL 8.0.
* `JWT_SECRET`: Cheia secretă folosită la semnarea token-urilor de autentificare.
* `APP_TIMEZONE`: Fusul orar obligatoriu al aplicației (`Europe/Bucharest`).

---

## 4. Instalare și Rulare

### 4.1. Pornire Bază de Date (Docker)
```bash
docker compose up -d
```

### 4.2. Configurare și Pornire Backend
```bash
cd backend
npm install
npx prisma db push
npm run seed       # Populează cele 65 de unități din sibiu-facilities.json
npm test           # Rulează suita completă de 45 teste Vitest
npm start          # Pornește serverul pe http://localhost:4000
```

### 4.3. Pornire Frontend
```bash
cd frontend
npm install
npm run dev        # Pornește interfața pe http://localhost:5173
```

### 4.4. Cele 4 Roluri & Conectare Demo 1-Click (Decizia D-003)
Aplicația implementează o ierarhie clară de 4 roluri pe client și server:
* **`ANON` (Vizitator anonim):** Acces liber fără autentificare la căutare, filtrare pe orașe/domenii, vizualizare hartă, calcul distanță Haversine și apel direct către unități.
* **`USER` (Utilizator înregistrat):** Include toate drepturile `ANON` + salvare favorite persistente pe cont și trimitere/confirmare sesizări orar (auto-aprobare la 4 sau 8 voturi).
  * *Cont demo:* `andreea.zidu@ulbsibiu.ro` / `Parola123!`
* **`MODERATOR` (Moderator comunitate):** Include toate drepturile `USER` + acces la coada de moderare a sesizărilor de orar (`/api/moderation/corrections`), aprobare, respingere și rezolvare conflicte. Modificarea structurală a unităților și importul CSV sunt restricționate (`403 Forbidden`).
  * *Cont demo:* `moderator@sibiu.ro` / `Moderator123!`
* **`ADMIN` (Administrator complet):** Drepturi depline de administrare: creare, editare și ștergere unități medicale/veterinare (`Facility`) și importul fișierelor CSV lunare pentru rotațiile de gardă (`OnCallRotation`).
  * *Cont demo:* `admin@sibiu.ro` / `Admin123!`

> **Comutare rapidă demo:** Butonul plutitor `⚙️ Testează Rolurile` (dreapta-jos) deschide DemoDrawer-ul ce permite comutarea instantanee cu un singur click între oricare dintre cele 4 roluri, precum și simularea stărilor de încărcare, catalog gol sau eroare de conexiune.

### 4.5. Suport PWA & Funcționare Offline
* **Service Worker (`frontend/public/sw.js`) & Manifest (`manifest.json`):** Aplicația este instalabilă ca Progressive Web App.
* **Acces Offline în Urgențe:** În cazul în care conexiunea la internet sau server este indisponibilă:
  * Ghidul de Urgență (`DS-03`) cu numerele vitale (112, UPU Sibiu, Pediatrie, etc.) se încarcă instantaneu offline.
  * Ultimul catalog descărcat de unități (`DS-01`) și lista de favorite a utilizatorului (`DS-04`) sunt servite direct din memoria locală a dispozitivului, însoțite de un banner discret: `Mod offline — date salvate local`.
  * Datele de contact și numerele de telefon rămân complet funcționale pentru apelare directă.

### 4.6. Comenzi de Verificare și Testare Automată
* **Backend Vitest (45 teste automate):**
  ```bash
  cd backend && npm test
  ```
  Verifică motorul de status (22 teste), matricea RBAC pe 4 roluri (18 teste), importul CSV idempotent (3 teste) și geocodarea Nominatim cu cache (2 teste).
* **Frontend Linting & Verificare Statică:**
  ```bash
  cd frontend && npm run lint
  ```
  Rulează `oxlint` pe toate fișierele frontend (0 erori, 0 avertismente).
* **Compilare Pachet Producție Frontend:**
  ```bash
  cd frontend && npm run build
  ```
  Compilează curat bundle-ul optimizat de producție în `frontend/dist/`.
* **Integritate Registru Agentic:**
  ```bash
  python3 docs/agents/tools/ledger-lint.py
  ```
  Validează indexurile și consistența deciziilor (`DECISIONS.md`), modelelor (`PATTERNS.md`) și contractelor (`CONTRACTS.md`).

---

## 5. Structura Proiectului

* `DATA.md` — Registrul oficial al celor 65 de unități din județul Sibiu și formatul CSV de gardă.
* `FIELD.md` — Raportul de audit și verificările practice din teren/telefonice.
* `SPEC.md` — Specificația completă a cerințelor software (SRS) și diagramele Mermaid.
* `sibiu-facilities.json` — Catalogul brut structurat JSON cu toate cele 65 de unități.
* `backend/` — Server Express, modele Prisma, motor status și suită teste Vitest.
* `frontend/` — Interfață React, hartă Leaflet și stiluri CSS.
* `docs/agents/` — Registru decizional decizii (`DECISIONS.md`), contracte API (`CONTRACTS.md`), întrebări deschise (`OPEN-QUESTIONS.md`) și vocabular (`CONTEXT.md`).
