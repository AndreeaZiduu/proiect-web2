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

---

# Sesiune: Definirea Sistemului de Design, Interviu de Stil și Tokens Vizuale (DESIGN.md)

> **Proiect:** P10 — Farmacii de Gardă și Cabinete Veterinare de Urgență (Județul Sibiu)  
> **Sesiune:** Sistem de Design, Tokens Vizuale și Stil UI  
> **Data:** 18 noiembrie 2026  
> **Asistent:** Antigravity (Google DeepMind)  
> **Utilizator:** Andreea Zidu (ULBS)

---

## 1. Ce a Cerut Utilizatorul

1. **Interviu de Stil („Interview me”):**
   * Întrebări scurte despre culori, fonturi, ton vizual pentru aplicația P10 (urgențe medicale și veterinare în județul Sibiu).
   * Stabilirea precisă a culorilor semantice pentru cele 5 stări de status: `ON_DUTY`, `OPEN`, `CLOSING_SOON`, `CLOSED`, `UNKNOWN`.
   * Păstrarea riguroasă a regulii de a nu modifica fișiere prematur și a nu scrie cod React înainte de aprobare.
2. **Înregistrarea Necunoscutelor:**
   * Trecerea chestiunii legate de stilul și proeminența butoanelor CTA de acțiune directă (Apel și Navigație) pe carduri ca întrebare deschisă `Q-008` în `OPEN-QUESTIONS.md`.
3. **Propunere Formală de Tokens (PROPOSAL):**
   * Crearea fișierului `docs/design/DESIGN.md` cu specificația completă de design tokens (Light Mode, Dark Mode - Midnight Slate, tipografie Plus Jakarta Sans cu cifre tabulare, raze rotunjite, spațieri, umbre și animații de gardă).
   * Supunerea spre aprobare conform regulilor The Gate din `AGENTS.md`.
4. **Aprobare și Integrare în Registru:**
   * Salvarea `docs/design/DESIGN.md` cu status `APPROVED`.
   * Înregistrarea deciziei tehnice `D-006` în `docs/agents/DECISIONS.md`.
   * Actualizarea jurnalului `AI_LOG.md`.
   * Rularea instrumentului de validare `python3 docs/agents/tools/ledger-lint.py --fix`.

---

## 2. Ce S-a Livrat

1. **Documentația de Design Tokens (`docs/design/DESIGN.md`):**
   * **Stil & Ton:** *Modern Healthcare Minimalist* (calmant, aerisit, inspirat din Apple Health & Doctolib).
   * **Tipografie:** *Plus Jakarta Sans* (400, 500, 600, 700) cu `font-variant-numeric: tabular-nums` pentru orare, distanțe GPS și telefoane.
   * **Diferențiere de domeniu:**
     * `PHARMACY` 💊: Teal/Verde medical (`#0D9488` light / `#2DD4BF` dark) cu bordură de accent 4px.
     * `EMERGENCY_VET` 🐾: Indigo/Violet cald (`#6366F1` light / `#818CF8` dark) cu bordură de accent 4px.
   * **Cele 5 niveluri de status:**
     * `ON_DUTY`: Indigo/Violet (`#6366F1` / `#8B5CF6`) cu animație subtilă `pulse-duty` de 2s pentru urgențe nocturne.
     * `OPEN`: Verde smarald vibrant (`#10B981` light / `#34D399` dark).
     * `CLOSING_SOON` (≤ 30 min): Amber cald (`#F59E0B` light / `#FBBF24` dark).
     * `CLOSED`: Slate neutru / Gri (`#64748B` light / `#94A3B8` dark).
     * `UNKNOWN`: Slate neutru (`#475569` light / `#94A3B8` dark) cu icon de verificare.
   * **Paletă fundal & suprafețe:**
     * Light: Slate-50 canvas (`#F8FAFC`), alb pur carduri (`#FFFFFF`).
     * Dark (Midnight Slate): Slate-950 (`#0B0F19`), carduri Slate-900 (`#111827`), contrast AAA fără efect obositor noaptea.
   * **Spațieri și Raze:** Grilă de 4px (`--space-1` la `--space-12`), raze rotunjite generoase (`--radius-sm` 6px la `--radius-2xl` 24px și `--radius-full` 9999px).
2. **Actualizarea Registrului de Cunoștințe (Ledger):**
   * **`docs/agents/DECISIONS.md`**: Adăugată decizia `D-006` (aprobată).
   * **`docs/agents/PATTERNS.md`**: Adăugat modelul `PATTERN-002` (candidate).
   * **`docs/agents/OPEN-QUESTIONS.md`**: Adăugată întrebarea deschisă `Q-008` (deschisă).
3. **Statutul Documentelor:**
   * `docs/design/DESIGN.md`: Trecut în status **APPROVED** (2026-11-18).
   * `docs/design/registry.yaml`: Înregistrat și aprobat (**APPROVED**) lista completă a ecranelor `DS-01` .. `DS-05` (Explorer, Detalii & Sesizare, Admin & Import CSV, Auth & Favorite, Ghid Urgențe Sibiu).
   * `docs/design/mocks/ds-01-home.html`: Creat și actualizat mock interactiv cu status **`draft`**, utilizând strict token-urile din `DESIGN.md` (fără culori/fonturi hardcodate în regulile CSS). Include cele 4 ajustări aprobate: 1) Header compactat pe un singur rând cu bandă ultra-subțire de urgențe fără overflow; 2) Carduri aerisite cu orar pe un singur rând și exact 2 butoane principale (Apel și Traseu); 3) Hartă realistă a Sibiului cu Râul Cibin, străzi principale, 6 pini colorați semantic și tooltip/mini-card activ; 4) Script JS local de filtrare în timp real și sincronizare bidirecțională card ⟷ pin.

---

## 3. Cum S-a Verificat

1. **Validarea Integrității Registrului (Linter Agentic):**
   * Comandă: `python3 docs/agents/tools/ledger-lint.py --fix`
   * Rezultat: **`✓ ledger ok`** (toate indexurile pentru `DECISIONS.md`, `PATTERNS.md`, `CONTRACTS.md`, `OPEN-QUESTIONS.md` au fost reconstruite și validate fără erori).
2. **Integritatea Fișierelor:**
   * Fără modificări neautorizate în codul React sau backend.
