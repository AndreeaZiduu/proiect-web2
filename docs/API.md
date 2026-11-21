# API Documentation — P10 Sibiu

Aplicația oferă o suită completă de servicii REST pentru interogarea în timp real a disponibilității farmaciilor și unităților veterinare de urgență din Județul Sibiu, calcul deterministic al statusului operațional ancorat în fusul orar `Europe/Bucharest`, colectare de corecții de la cetățeni și panou de moderare/administrare securizat prin RBAC pe 4 roluri.

---

## 1. Ierarhia celor 4 Roluri (Decizia D-003)

| Rol | Descriere | Permisiuni |
|---|---|---|
| **ANON** | Vizitator neautentificat | Căutare, filtrare pe orașe, vizualizare hartă, calcul distanță Haversine, apel telefonic direct către unități |
| **USER** | Utilizator înregistrat | Toate permisiunile ANON + salvare/ștergere favorite, trimitere sesizări orar, confirmare sesizări (+1 vot) |
| **MODERATOR** | Moderator comunitar | Toate permisiunile USER + vizualizare coadă sesizări (`DS-05`), aprobare (`APPROVED`), respingere (`REJECTED`) și rezolvare conflicte. **Blocat la import CSV și ștergere unități (403 Forbidden)** |
| **ADMIN** | Administrator de sistem | Toate permisiunile MODERATOR + adăugare/editare/ștergere unități (`Facility`), import CSV rotații de gardă lunare (`OnCallRotation`) |

Autentificarea se realizează prin header-ul HTTP standard:
```http
Authorization: Bearer <jwt_token>
```

---

## 2. Autentificare & Utilizatori

### `POST /api/auth/register`
Înregistrare cont nou utilizator.
- **Acces:** ANON
- **Body JSON:**
  ```json
  {
    "email": "cetatean@exemplu.ro",
    "password": "ParolaSigura123!",
    "name": "Ioan Popa"
  }
  ```
- **Răspuns 201 Created:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "cuid123",
      "email": "cetatean@exemplu.ro",
      "name": "Ioan Popa",
      "role": "USER"
    }
  }
  ```

### `POST /api/auth/login`
Autentificare cont existent.
- **Acces:** ANON
- **Body JSON:**
  ```json
  {
    "email": "user@sibiu.ro",
    "password": "Parola123!"
  }
  ```
- **Răspuns 200 OK:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "cuid456",
      "email": "user@sibiu.ro",
      "name": "Utilizator Test",
      "role": "USER"
    }
  }
  ```

---

## 3. Catalog Unități & Motor de Status (Contractele C-001 & C-002)

### `GET /api/facilities`
Interoghează catalogul de farmacii și cabinete veterinare, calculând în timp real statusul fiecărei unități conform motorului de status determinat pe ora României (`Europe/Bucharest`).
- **Acces:** ANON, USER, MODERATOR, ADMIN
- **Parametri Query opționali:**
  - `q`: căutare liberă după nume, stradă, oraș sau serviciu medical (ex: `urgent`, `non-stop`, `Polisano`, `Bălcescu`).
  - `type`: `PHARMACY` sau `EMERGENCY_VET`.
  - `city`: filtrare oraș (ex: `Sibiu`, `Mediaș`, `Cisnădie`, `Șelimbăr`, `Avrig` sau `all`).
  - `openNow`: `true` pentru a returna exclusiv unitățile deschise în acest moment.
  - `onCall`: `true` pentru a returna exclusiv unitățile care efectuează serviciul de gardă.
  - `lat`, `lng`: coordonatele GPS ale utilizatorului (pentru calcul distanță Haversine în km și sortare de la cea mai apropiată).
  - `at`: timestamp ISO opțional pentru simulare sau verificare status la un anumit moment (implicit: momentul curent).
- **Răspuns 200 OK:**
  ```json
  {
    "evaluatedAt": "2026-11-21T18:00:00.000Z",
    "count": 65,
    "facilities": [
      {
        "id": "fac_polisano_mv",
        "name": "Farmacia Polisano Pharma Non-Stop — Mihai Viteazu",
        "type": "PHARMACY",
        "address": "B-dul Mihai Viteazu nr. 11",
        "city": "Sibiu",
        "latitude": 45.7824,
        "longitude": 24.1481,
        "phone": "0269420162",
        "distanceKm": 0.42,
        "status": {
          "isOpen": true,
          "code": "OPEN",
          "label": "Deschis acum (De gardă)",
          "source": "ON_CALL_ROTATION",
          "isOnCall": true
        },
        "services": [{ "serviceName": "Gărzi de Noapte" }, { "serviceName": "Rețete Compensate" }]
      }
    ]
  }
  ```

### `GET /api/facilities/:id`
Preia detaliile complete ale unei unități medicale/veterinare, incluzând orarul săptămânal complet, excepțiile de sărbători legale, gărzile programate și istoricul sesizărilor comunitare.
- **Acces:** ANON, USER, MODERATOR, ADMIN

---

## 4. Favorite Utilizator (DS-04)

### `GET /api/favorites`
Returnează unitățile salvate de utilizatorul curent, însoțite de statusul live și de notificări de alertă dacă programul a suferit corecții recente după salvare.
- **Acces:** USER, MODERATOR, ADMIN

### `POST /api/favorites/:facilityId`
Comută starea de favorit pentru o unitate (adaugă dacă nu există, șterge dacă există).
- **Acces:** USER, MODERATOR, ADMIN
- **Răspuns 200 / 201:**
  ```json
  { "favorited": true }
  ```

---

## 5. Sesizări Comunitare de Orar (Contract C-003 & Decizia D-001)

### `POST /api/corrections` (sau `POST /api/facilities/:id/corrections`)
Trimite o propunere de corecție de orar sau semnalare de închidere neanunțată pentru o unitate.
- **Acces:** USER, MODERATOR, ADMIN
- **Body JSON:**
  ```json
  {
    "facilityId": "fac_polisano_mv",
    "proposedNote": "Închis pentru inventar între 14:00 și 16:00",
    "isClosedOverride": true,
    "validFrom": "2026-11-21T14:00:00+02:00",
    "validUntil": "2026-11-21T16:00:00+02:00"
  }
  ```
- **Răspuns 201 Created:** Sesizarea este înregistrată în starea `PENDING` (sau `CONFLICT` dacă există alte propuneri concurente).

### `POST /api/corrections/:id/confirm`
Permite utilizatorilor să voteze/confirme o sesizare existentă.
- **Acces:** USER, MODERATOR, ADMIN
- **Regula D-001:** 
  - La atingerea a **4 confirmări** pentru închideri temporare / pauze (`isClosedOverride: true`), sau
  - La atingerea a **8 confirmări** pentru orar general,
  sesizarea trece automat în starea `APPROVED` și modifică statusul live al unității în catalog, până la verificarea unui moderator.
- **Răspuns 200 OK:**
  ```json
  {
    "message": "Confirmarea ta a fost înregistrată (5/8).",
    "correction": { "id": "corr123", "confirmations": 5, "status": "PENDING" }
  }
  ```

---

## 6. Panou de Moderare (Contract C-003 & Rol MODERATOR / ADMIN)

### `GET /api/moderation/corrections`
Livrează coada tuturor sesizărilor aflate în așteptare (`PENDING` sau `CONFLICT`).
- **Acces:** MODERATOR, ADMIN (ANON primește `401`, USER primește `403`)

### `PATCH /api/moderation/corrections/:id` (sau `PATCH /api/corrections/:id/status`)
Aprobă sau respinge definitiv o sesizare comunitară.
- **Acces:** MODERATOR, ADMIN
- **Body JSON:**
  ```json
  {
    "decision": "APPROVED"
  }
  ```
  *(Opțiuni valide: `APPROVED`, `REJECTED`)*

---

## 7. Administrare Unități & Rotații CSV (Contract C-004 & Rol ADMIN Only)

### `POST /api/admin/facilities`
Creează o nouă unitate medicală sau veterinară în catalog.
- **Acces:** Doar ADMIN (MODERATOR primește `403 Forbidden`)

### `PUT /api/admin/facilities/:id`
Actualizează datele unei unități existente.
- **Acces:** Doar ADMIN (MODERATOR primește `403 Forbidden`)

### `DELETE /api/admin/facilities/:id` (sau `DELETE /api/facilities/:id`)
Șterge o unitate din catalog.
- **Acces:** Doar ADMIN (MODERATOR primește `403 Forbidden`)

### `POST /api/rotations/import`
Importă un calup de rotații de gardă lunare dintr-un fișier sau text CSV, în mod strict idempotent (reimportarea aceluiași fișier nu generează duplicate).
- **Acces:** Doar ADMIN (MODERATOR primește `403 Forbidden`)
- **Format CSV conform C-004:**
  ```csv
  facilityId,name,type,city,startDate,endDate,startHour,endHour,onCallPhone,notes
  fac_polisano_mv,Farmacia Polisano Pharma,PHARMACY,Sibiu,2026-11-21,2026-11-22,08:00,08:00,0269420162,Gardă oficială noapte
  ```
- **Răspuns 200 OK:**
  ```json
  {
    "success": true,
    "importedCount": 1,
    "skippedDuplicates": 0,
    "batchId": "import-2026-11-21",
    "conflicts": []
  }
  ```
