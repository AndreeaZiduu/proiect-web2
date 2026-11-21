# Plan — Master Plan Unificat P10 Sibiu

> **Status:** APPROVED (aprobat de utilizator pe 2026-11-21)  
> **Document:** `docs/plans/01-master-plan.md`  
> **Aplicație:** P10 — Farmacii și Cabinete Veterinare de Urgență Sibiu

---

## Size
**L** — Construcția completă a aplicației integrate: bază de date MySQL în Docker, server Node.js cu 4 roluri, motor de status în timp real, interfață React cu 5 ecrane, rutare stradală integrată prin OSRM, suport offline PWA și teste automate.

---

## Approach
Construim o aplicație web simplă și rapidă care ajută cetățenii din județul Sibiu să găsească imediat o farmacie sau un veterinar deschis, mai ales noaptea și de sărbători.
- Folosim MySQL 8.0 în Docker cu 9 tabele relaționale și geocodare Nominatim salvată o singură dată în cache (cu pauză de 1 secundă).
- Calculăm disponibilitatea printr-o funcție pură pe ora României (`Europe/Bucharest`), care combină orarul normal, gărzile lunare din CSV, sărbătorile și sesizările comunității (cu 4 sau 8 voturi).
- Protejăm serverul cu 4 roluri clare (`vizitator`, `utilizator`, `moderator`, `admin`) verificate prin token JWT pe fiecare rută protejată.
- Realizăm interfața în React 19 cu cele 5 ecrane aprobate, stilizată cald și curat după ghidul vizual `docs/design/DESIGN.md`, desenăm traseul stradal direct pe hartă prin OSRM (cu timp și distanță) alături de lansarea externă Google Maps / Waze, plus Service Worker PWA ca favoritele să meargă și fără internet.
- Am respins librăriile grele de componente grafice pentru ca pagina să se deschidă instantaneu pe telefon în caz de urgență.

---

## Files

| Acțiune | Cale fișier | Ce conține |
|---|---|---|
| **modificare** | `backend/prisma/schema.prisma` | Baza de date: 9 tabele (`facilities`, `weekly_schedules`, `holiday_exceptions`, `guard_rotations`, `status_reports`, `report_confirmations`, `users`, `favorites`, `geocode_cache`) |
| **modificare** | `backend/src/server.js` | Server Express cu rute REST, verificare RBAC pe 4 roluri și import CSV fără duplicate |
| **modificare** | `backend/src/status.js` | Funcție pură `getFacilityStatus` pe ora României cu orare de noapte, gardă și sărbători |
| **creare** | `backend/src/geocode.js` | Modul geocodare Nominatim cu cache în tabelă și limitare la o cerere pe secundă |
| **creare** | `docs/API.md` | Documentația simplă a rutelor REST pentru cele 4 roluri |
| **modificare** | `frontend/src/index.css` | Stiluri CSS calde conform `docs/design/DESIGN.md` (culori Light/Dark, font Plus Jakarta Sans) |
| **creare** | `frontend/src/services/api.js` | Serviciu apelare server backend cu atașare automată de token |
| **creare** | `frontend/src/context/AuthContext.jsx` | Gestionare rol curent și butoane de conectare rapidă demo 1-click |
| **creare** | `frontend/src/components/common/Header.jsx` | Antet cu logo, comutator temă și meniu adaptat pe roluri (ascuns pentru vizitatori) |
| **creare** | `frontend/src/components/common/AuthModal.jsx` | Fereastră conectare cu 1-click pentru Utilizator, Moderator sau Admin |
| **creare** | `frontend/src/components/ds01-explorer/ExplorerView.jsx` | Ecran DS-01: hartă interactivă, listă unități, căutare text și filtru pe orașe |
| **creare** | `frontend/src/components/ds01-explorer/SibiuMap.jsx` | Hartă Leaflet cu pini, desenare traseu stradal OSRM (timp estimat, km) și buton extern Google Maps/Waze |
| **creare** | `frontend/src/components/ds01-explorer/FacilityCard.jsx` | Card unitate cu stare clară, buton traseu pe hartă, apel direct și buton favorit |
| **creare** | `frontend/src/components/ds02-details/FacilityDetailModal.jsx` | Ecran DS-02: orar săptămânal detaliat, pauze de masă, traseu OSRM și sesizare orar greșit |
| **creare** | `frontend/src/components/ds03-emergency/EmergencyGuideView.jsx` | Ecran DS-03: numere vitale chiar sus pe ecran (112, spital veterinar, dispecerat) |
| **creare** | `frontend/src/components/ds04-favorites/FavoritesView.jsx` | Ecran DS-04: lista unităților salvate cu disponibilitate live, accesibilă și offline |
| **creare** | `frontend/src/components/ds05-admin/AdminPanel.jsx` | Ecran DS-05: moderare sesizări (moderator/admin), gestiune unități și import CSV (doar admin) |
| **creare** | `frontend/public/sw.js` | Service Worker PWA pentru salvare cache și funcționare fără internet |
| **creare** | `frontend/public/manifest.webmanifest` | Fișier manifest PWA pentru instalare pe ecranul telefonului |
| **modificare** | `frontend/src/App.jsx` | Legarea ecranelor, rutare și bară demonstrativă de testare rapidă |

---

## Tests

| # | Ce verificăm | Test (fișier · tip) | Nu e automat? De ce |
|---|---|---|---|
| 1 | Calcul status orar normal, ture de noapte (22:00-06:00) și sărbători pe ora României | `backend/tests/status.test.js` · Automat (Vitest) | — |
| 2 | Verificare rotație gardă din CSV și avertizare când se închide în sub 30 de minute | `backend/tests/status.test.js` · Automat (Vitest) | — |
| 3 | Corecții utilizatori: auto-aprobare la 4 voturi (pauză) și 8 voturi (orar general) | `backend/tests/status.test.js` · Automat (Vitest) | — |
| 4 | Securitate roluri: vizitatorul primește 401, utilizatorul primește 403 pe panoul admin | `backend/tests/rbac.test.js` · Automat (Vitest) | — |
| 5 | Moderatorul poate aproba sesizări (200), dar e blocat la import CSV (403 Forbidden) | `backend/tests/rbac.test.js` · Automat (Vitest) | — |
| 6 | Administratorul are acces complet la toate operațiile (200 OK) | `backend/tests/rbac.test.js` · Automat (Vitest) | — |
| 7 | Import CSV gardă fără duplicate (idempotent): reîncărcarea aceluiași fișier nu multiplică rotațiile | `backend/tests/csv-import.test.js` · Automat (Vitest) | — |
| 8 | Geocodare cu cache: interogarea aceleiași adrese nu reapelează serviciul Nominatim | `backend/tests/geocode.test.js` · Automat (Vitest) | — |
| 9 | Verificare sintaxă și erori cod frontend | `npm run lint --prefix frontend` · Automat | — |
| 10 | Compilare completă pachet frontend pentru producție | `npm run build --prefix frontend` · Automat | — |
| 11 | Afișare split-screen pe calculator și buton comutare Listă/Hartă pe mobil (DS-01) | Test manual în browser | Verificare vizuală layout responsive |
| 12 | Desenare traseu stradal OSRM pe hartă la selectarea unei unități, cu timp și km | Test manual în browser pe hartă | Verificare interacțiune grafică Leaflet/OSRM |
| 13 | Deschidere apel direct la apăsarea butonului de telefon | Test manual pe telefon/browser | Declanșează apelatorul nativ |
| 14 | Salvare favorite și consultare în mod offline cu rețeaua oprită (PWA) | Test manual în browser (tab Network Offline) | Verificare comportament Service Worker |

---

## Design

### 1. Baza de date relațională (Docker Compose)
- Conține 9 tabele: `facilities` (unități), `weekly_schedules` (orar săptămânal), `holiday_exceptions` (sărbători), `guard_rotations` (gărzi lunare), `status_reports` (sesizări orar), `report_confirmations` (voturi unice utilizatori), `users` (conturi), `favorites` (salvări utilizator), `geocode_cache` (coordonate GPS salvate).
- Geocodarea adreselor folosește Nominatim doar la adăugarea sau importul inițial al unităților, cu pauză de 1 secundă și salvare în cache. Căutările utilizatorilor nu apelează niciodată geocodarea externă.

### 2. Motorul de status (`getFacilityStatus(unitate, moment)`)
- Funcție pură evaluată exclusiv pe fusul orar oficial `Europe/Bucharest` (gestionează automat și trecerea la ora de vară/iarnă).
- Ordine de prioritate:
  1. Sesizări comunitare aprobate (ex. închis temporar sau pauză).
  2. Rotație oficială de gardă (deschis continuu pe durata gărzii).
  3. Sărbători legale (închis sau program scurt).
  4. Program normal de lucru (inclusiv ture peste miezul nopții `22:00-06:00` și pauze de prânz).
  5. Semnalizare `CLOSING_SOON` dacă se închide în 30 de minute sau mai puțin.
- Sesizările expiră automat după data limită (`validUntil`), necesită 4 voturi pentru pauze scurte și 8 voturi pentru modificări mari, iar rapoartele contradictorii intră în `CONFLICT` pentru decizia moderatorului.

### 3. API Backend și cele 4 Roluri
- `vizitator` (ANON): căutare liberă, filtrare pe orașe, vizualizare pe hartă, calcul distanță în km și apelare telefonică directă.
- `utilizator` (USER): include drepturile de vizitator + salvare unități la favorite și trimitere sau confirmare sesizări orar.
- `moderator` (MODERATOR): include drepturile de utilizator + acces la coada de moderare sesizări, aprobare/respingere și soluționare conflicte. Primește `403 Forbidden` la modificarea unităților sau importul CSV.
- `admin` (ADMIN): drepturi depline de administrare: adăugare/editare/ștergere unități și importul fișierului CSV lunar de gardă.
- Rutele sunt documentate complet în `docs/API.md` și `docs/agents/CONTRACTS.md`.

### 4. Interfața React, Hartă cu Traseu OSRM și PWA
- **DS-01 (Explorer):** Split-screen pe ecran mare (hartă pe dreapta, listă derulabilă pe stânga) și buton simplu de comutare pe telefon. La selectarea oricărei unități, traseul stradal real este desenat direct pe hartă prin serviciul gratuit OSRM (cu afișarea duratei estimate în minute și a distanței rutiere), alături de un buton de deschidere a traseului în Google Maps sau Waze.
- **DS-02 (Detalii Unitate):** Program săptămânal detaliat, servicii oferite, buton apel direct, buton desenare traseu direct pe hartă și link extern Google Maps / Waze, plus formular de sesizare orar.
- **DS-03 (Ghid de Urgență):** Numerele vitale (112, Spital Veterinar 24/7, Colegiul Farmaciștilor, DSVSA) afișate imediat sus fără derulare, urmate de 6 pași clari de triaj.
- **DS-04 (Favorite & Conectare):** Lista farmaciilor utile salvate și butoane de conectare rapidă 1-click pentru demonstrație.
- **DS-05 (Panou Moderare & Admin):** Meniu complet ascuns pentru vizitatori și utilizatori simpli. Arată coada de sesizări pentru moderatori și taburile de unități/CSV pentru administratori.
- **PWA Offline:** Service Worker salvează fișierele aplicației și ultimele unități căutate; lista de favorite este salvată local, astfel încât utilizatorul poate vedea numărul de telefon chiar dacă pică internetul noaptea.

---

## Sequencing
`one builder` — Construcție pas cu pas:
1. Actualizare schemă Prisma (`geocode_cache`, `report_confirmations`) și rute backend cu geocodare Nominatim și import CSV idempotent.
2. Servicii frontend (`api.js`, `AuthContext.jsx`), stiluri calde conform `docs/design/DESIGN.md`, modul desenare traseu OSRM pe hartă și configurare PWA (`manifest`, `sw.js`).
3. Componente comune (`Header.jsx`, `AuthModal.jsx`) cu navigare ascunsă pentru roluri neautorizate.
4. Ecranele `DS-01` .. `DS-05`.
5. Rulare teste backend, teste frontend și verificare finală.

---

## Risks
- **Diferențe de oră între telefon și server:** Rezolvat prin calcularea stării strict pe fusul orar al României (`Europe/Bucharest`).
- **Disponibilitate serviciu OSRM:** Serviciul public OSRM este utilizat pentru calculul traseului și timpului estimat pe hartă; dacă serviciul nu răspunde, harta afișează linia directă și butonul de rezervă pentru deschiderea în Google Maps sau Waze.
- **Blocare la geocodare externă:** Nominatim are limită de 1 cerere/secundă; rezolvat prin pauză forțată de 1s și salvare permanentă în cache, fără apeluri externe la navigarea utilizatorilor.
- **Lipsă conexiune la internet în caz de criză nocturnă:** Rezolvat prin Service Worker și salvarea locală a favoritelor în telefon.

---

## Out of scope
- Comenzi online de medicamente și plăți electronice (aplicația este strict de triaj și informare de urgență).
- Consultații medicale online sau chat direct cu medicii.
- Urmărirea stocurilor de medicamente (nu există date publice deschise în farmacii).

---

## Knowledge used

> 17 reguli confirmate anterior, neschimbate: `D-001`, `D-002`, `D-003`, `D-004`, `D-005`, `D-006`, `PATTERN-001`, `PATTERN-002`, `C-001`, `C-002`, `C-003`, `C-004`, `Q-001`, `Q-002`, `Q-003`, `Q-004`, `Q-005`, `Q-006`, `Q-007`, `Q-008`.

| Intrare | Ce prevede | De ce se aplică în acest plan | Apel |
|---|---|---|---|
| `D-001` | Pragul de 8 voturi (adaptat la 4 pentru pauze scurte) pentru aprobarea sesizărilor | Folosit în ecranul DS-02, DS-05 și în motorul de status | confirm |
| `D-002` | Fără comerț, plăți sau telemedicină | Menține proiectul axat strict pe urgențe | confirm |
| `D-003` | Ierarhia celor 4 roluri (vizitator, utilizator, moderator, admin) | Stabilește permisiunile pe server și vizibilitatea panourilor | confirm |
| `D-004` | Calculul statusului strict ancorat pe Europe/Bucharest | Garantează corectitudinea orarelor și a sărbătorilor legale | confirm |
| `D-005` | Distanța calculată prin formula Haversine cu reper Piața Mare | Permite ordonarea unităților de la cea mai apropiată | confirm |
| `D-006` | Sistemul de design tokens calde (Warm Editorial Minimalist) | Definește culorile, fontul Plus Jakarta Sans și cardurile rotunjite | confirm |
| `PATTERN-001` | Split-screen pe desktop și buton comutare Listă/Hartă pe mobil | Structurează ecranul principal DS-01 | confirm |
| `PATTERN-002` | Culori semantice (verde deschis, indigo gardă, gri închis) | Asigură claritatea stării operaționale a unităților | confirm |
| `C-001` | Contractul API facilități (`GET /api/facilities`) | Furnizează lista unităților către ecranul DS-01 | confirm |
| `C-002` | Interfața motorului de calcul status | Standardizează verificarea disponibilității | confirm |
| `C-003` | Contractul API pentru sesizări de orar (`/api/corrections`) | Folosit la trimiterea și confirmarea sesizărilor | confirm |
| `C-004` | Contractul API pentru importul rotațiilor CSV (`/api/rotations/import`) | Folosit de administrator pentru încărcarea gărzilor lunare | confirm |
| `Q-002` | Locație utilizator prin GPS sau selecție oraș | Permite sortarea distanței fără geocodare costisitoare | confirm |
| `Q-003` | Distincție vizuală spital 24/7 fizic vs gardă la apel | Asigură etichete clare pentru urgențele veterinare | confirm |
| `Q-004` | Import CSV securizat prin panoul de administrare | Definește modulul de import din DS-05 | confirm |
| `Q-006` | Navigație pe hartă (traseu OSRM integrat + fallback Google Maps/Waze) | Definește randarea traseului stradal și butonul extern | confirm |
| `Q-007` | Distincție clară între rolul MODERATOR și rolul ADMIN | Separă moderarea sesizărilor de gestiunea structurală a unităților | confirm |
| `Q-008` | Buton de apel direct 1-tap pe card | Permite apelarea imediată a unității fără pași suplimentari | confirm |

### Considered, not applied
- **Biblioteci complexe de componente UI (MUI, Tailwind, Bootstrap):** Respinse pentru a păstra dimensiunea mică a codului și viteza maximă pe mobil.
- **Geocodare la căutările utilizatorilor:** Respinsă categoric; coordonatele sunt salvate în baza de date o singură dată la import pentru a nu bloca aplicația.

### Assumptions (no entry behind them)
- Toate cerințele din catalogul P10 sunt acoperite fără presupuneri suplimentare.
