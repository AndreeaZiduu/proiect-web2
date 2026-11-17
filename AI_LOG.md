# Jurnal de Activitate AI (AI_LOG.md)

> **Proiect:** P10 — Farmacii de Gardă și Cabinete Veterinare de Urgență (Județul Sibiu)  
> **Sesiune:** Definirea Cerințelor, Scope-ului și Documentației de Specificații (Partea C)  
> **Data:** 17 noiembrie 2026  
> **Asistent:** Antigravity (Google DeepMind)  
> **Utilizator:** Andreea Zidu (ULBS)

---

## 1. Ce a Cerut Utilizatorul

1. **Analiza Fișierelor Existente:**
   * Citirea și înțelegerea documentelor existente: `AGENTS.md`, `DATA.md`, `FIELD.md`, `docs/brief.md` și `sibiu-facilities.json`.
   * Păstrarea riguroasă a regulilor din `AGENTS.md` (The Gate, linter, fără invenții de cerințe).
2. **Interviu de Produs și Arhitectură („Ask me questions / Interview me”):**
   * Întrebări puse pe rând despre **Scope**, **Roluri & Permisiuni**, **Ecrane UI** și **Out of Scope**.
   * Orice aspect necunoscut sau nehotărât să fie consemnat strict sub formă de întrebare deschisă (`Q-`) în registrul `OPEN-QUESTIONS.md`.
3. **Decizii Stabilite în Interviu:**
   * **Scope & Out of Scope:** Comenzile online, plățile electronice și telemedicina/chat-ul direct sunt excluse definitiv (Out of Scope); căutarea stocurilor în timp real și navigația turn-by-turn proprie au fost marcate ca întrebări deschise `Q-005` și `Q-006`.
   * **Roluri & Permisiuni:** Vizitatorul anonim are acces complet la căutare, hartă, calcul distanță și apel direct; salvarea favoritelor și trimiterea corecțiilor necesită cont (`USER`); utilizatorii pot vota confirmarea corecțiilor altor cetățeni; rolurile de `MODERATOR` vs `ADMIN` au fost trecute ca `Q-007`.
   * **Regulă Crowdsourcing:** Auto-aprobare temporară a modificărilor de program la atingerea a 8 confirmări comunitare înainte de verificarea din panoul de administrare.
   * **Ecrane:** Aprobarea listei complete a celor 6 ecrane (inclusiv secțiunea de Numere Utile / Ghid de Urgență Sibiu).
4. **Scrierea în Fișierele Proiectului:**
   * `README.md`: Scope complet, 65 unități reale Sibiu (`PHARMACY`, `EMERGENCY_VET`), calcul status pe 5 niveluri, import CSV, raportare erori, out of scope, stack tehnologic și variabile de mediu.
   * `CONTEXT.md`: Termenii oficiali ai domeniului cu definiții clare și clauze `_Avoid_`.
   * `docs/agents/OPEN-QUESTIONS.md`: Înregistrarea punctelor neclare (`Q-002` .. `Q-007`).
   * `docs/agents/DECISIONS.md`: Propunerea formală (`PROPOSAL`) pentru minim 4 decizii tehnice `D-`, cu statutul `proposed` în așteptarea aprobării finale.
   * `SPEC.md` / `docs/SPEC.md`: Specificația Cerințelor Software (SRS) cu diagrame Mermaid.
   * `AI_LOG.md`: Jurnalul complet al acestei sesiuni.
5. **Validare Finală:**
   * Rularea instrumentului `python3 docs/agents/tools/ledger-lint.py --fix`.

---

## 2. Ce S-a Livrat

1. **Specificația Cerințelor Software (SRS):**
   * **`SPEC.md`** (și copia sincronizată `docs/SPEC.md`): documentația oficială completă pentru Partea C, incluzând catalogul celor 65 de unități din județul Sibiu, actorii și matricea de drepturi, cele 6 ecrane detaliate, logica motorului de status și 3 diagrame Mermaid (Use Case Diagram, Sequence Diagram, ERD).
2. **Documentația de Prezentare a Proiectului:**
   * **`README.md`**: fișierul principal de documentare a proiectului, cuprinzând scope-ul detaliat, tehnologiile utilizate (Node.js/Express, Prisma, MySQL 8.0, Vitest, React 19, Leaflet), configurarea mediului (`.env`) și ghidul pas cu pas de pornire și rulare a testelor.
3. **Vocabularul Aprobat:**
   * **`CONTEXT.md`**: adăugarea termenilor ceruți:
     * `Unități veterinare de urgență / EMERGENCY_VET`
     * `Gardă activă / ON_DUTY`
     * `Program peste miezul nopții / Crosses Midnight`
     * `Excepție sărbători legale / Holiday Schedule`
     * `Închidere în curând / CLOSING_SOON`
     * `Facility`, `FacilityType`, `ScheduleCorrection`, `Status Engine`.
4. **Registrul Întrebărilor Deschise:**
   * **`docs/agents/OPEN-QUESTIONS.md`**:
     * `Q-001` (rezolvat — scopul și stack-ul proiectului).
     * `Q-002` (deschis — metoda de obținere a locației utilizatorului).
     * `Q-003` (deschis — diferențierea vizuală a spitalelor 24/7 de cabinetele cu gardă la apel).
     * `Q-004` (deschis — mecanismul de import al rotațiilor CSV de gardă).
     * `Q-005` (deschis — oportunitatea urmăririi stocurilor de medicamente).
     * `Q-006` (deschis — navigație proprie vs link-uri externe Google Maps/Waze).
     * `Q-007` (deschis — unificarea sau separarea rolurilor MODERATOR și ADMIN).
5. **Registrul Deciziilor Tehnice (Aprobate):**
   * **`docs/agents/DECISIONS.md`**: conține 5 decizii tehnice aprobate formal de utilizator:
     * `D-001`: Pragul de 8 confirmări pentru auto-aprobarea temporară a corecțiilor de orar (`approved`).
     * `D-002`: Delimitarea strictă Out of Scope — fără comenzi, plăți, telemedicină/chat (`approved`).
     * `D-003`: Necesitatea autentificării pentru favorite și raportări de orar (`approved`).
     * `D-004`: Ancorarea strictă a calculului statusului în fusul orar `Europe/Bucharest` (`approved`).
     * `D-005`: Calculul distanței prin formula Haversine pe baza coordonatelor GPS (`approved`).
6. **Arhitectură și Contracte API:**
   * **`docs/agents/ARCHITECTURE.md`**: reflectă arhitectura reală a proiectului.
   * **`docs/agents/CONTRACTS.md`**: specifică rutele API `C-001`, `C-002`, `C-003`, `C-004`.
   * **`docs/agents/PATTERNS.md`**: înregistrează modelul `PATTERN-001` (split-screen desktop / toggle mobil).

---

## 3. Cum S-a Verificat

1. **Testare Automată Backend:**
   * Comandă: `cd backend && npm test` (Vitest).
   * Rezultat: **19 teste trecute din 19** (`Test Files: 1 passed, Tests: 19 passed`), verificând programul normal, pauzele de prânz, alertele de închidere sub 30 min, turele peste noapte, sărbătorile legale, rotațiile de gardă, auto-aprobarea la 8 confirmări, corecțiile expirate și unitățile veterinare de urgență.
2. **Validarea Integrității Registrului (Linter Agentic):**
   * Comandă: `python3 docs/agents/tools/ledger-lint.py --fix`
   * Rezultat: **`✓ ledger ok`** (toate indexurile pentru `DECISIONS.md`, `PATTERNS.md`, `CONTRACTS.md`, `OPEN-QUESTIONS.md` au fost reconstruite și validate fără erori).
3. **Controlul Versiunilor:**
   * Comandă: `git status`
   * Rezultat: Fișiere modificate și adăugate conform instrucțiunilor, fără modificări nedorite în codul sursă.
