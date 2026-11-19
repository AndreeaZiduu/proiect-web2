# Plan — Design UI/UX pentru cele 5 Ecrane (DS-01 .. DS-05)

> **Status:** APPROVED (aprobat de utilizator pe 2026-11-19)  
> **Document:** `docs/plans/01-design-screens.md`  
> **Proiect:** P10 — Farmacii și Cabinete Veterinare de Urgență Sibiu

---

## Size
**M** — Acoperă strict interfața vizuală a celor 5 ecrane (`DS-01` .. `DS-05`), preluând structura din prototipul funcțional `docs/design/mocks/full-site-prototype.html`.

---

## Approach
* Preluăm ecran cu ecran soluțiile vizuale gata testate din prototipul HTML/CSS.
* Construim componente React simple, curate și responsive (telefon și calculator).
* Folosim paleta de culori și fontul stabilite în `docs/design/DESIGN.md`.
* Nu adăugăm librării externe grele sau funcționalități necerute.

---

## Files

| Acțiune | Cale fișier | Ce conține |
|---|---|---|
| modificare | `docs/design/registry.yaml` | Actualizare registru pentru cele 5 ecrane aprobate |
| creare | `docs/design/mocks/DS-02.md` .. `DS-05.md` | Fișe scurte de prezentare pentru fiecare ecran |
| modificare | `frontend/src/index.css` | Culori semantice, temă zi/noapte și stiluri de bază |
| creare | `frontend/src/components/common/` | Antet responsive (`Header.jsx`) și fereastră autentificare (`AuthModal.jsx`) |
| creare | `frontend/src/components/ds01-explorer/` | Hartă interactivă și listă de farmacii/veterinari |
| creare | `frontend/src/components/ds02-details/` | Detalii orar și formular raportare cu voturi |
| creare | `frontend/src/components/ds03-emergency/` | Butoane apel direct 112, veterinar, dispecerat |
| creare | `frontend/src/components/ds04-favorites/` | Listă unități salvate de utilizator |
| creare | `frontend/src/components/ds05-admin/` | Panou moderare sesizări și încărcare fișier CSV |
| modificare | `frontend/src/App.jsx` | Legarea ecranelor și comutarea între ele |

---

## Tests

| # | Ce verificăm | Cum testăm | Tip |
|---|---|---|---|
| 1 | Afișare corectă split-screen pe calculator și buton comutare pe mobil | Test automat componentă explorer | Automat |
| 2 | Culori clare de stare (Verde = Deschis, Indigo = Gardă, Gri = Închis) | Test unitar pe cardul unității | Automat |
| 3 | Număr de voturi adaptiv (4 voturi pauză scurtă vs 8 voturi orar general) | Test automat pe formularul de sesizare | Automat |
| 4 | Apel telefonic direct la apăsarea butonului mare de apel | Test interacțiune buton apel | Automat |
| 5 | Protecție cont: vizitatorii pot doar căuta, utilizatorii pot salva favorite | Test flux autentificare și favorite | Automat |

---

## Design

### DS-01: Explorer Hartă și Listă (`/`)
* **Scop:** Găsirea rapidă a celei mai apropiate farmacii sau clinici veterinare deschise.
* **Pe calculator:** Ecran împărțit în două: lista în stânga (40%), harta interactivă în dreapta (60%).
* **Pe mobil:** O singură coloană curată, cu un comutator simplu între `Listă` și `Hartă`.
* **Cardul de unitate:** Nume, distanță în km, stare clară colorată și buton mare verde de apelare directă.

### DS-02: Detalii Unitate și Raportare Orar (`/facility/:id`)
* **Scop:** Afișează programul complet și permite comunității să anunțe modificări neprevăzute.
* **Orar complet:** Program pe zile (Luni–Duminică), pauze de masă și excepții de sărbători legale.
* **Voturi comunitate:** Doar **4 voturi** pentru pauze scurte (30–60 min); **8 voturi** pentru modificări mari de orar.
* **Acțiuni rapide:** Buton de apel direct, deschidere traseu în Google Maps și salvare la favorite.

### DS-03: Ghid de Urgență (`/urgente`)
* **Scop:** Numere de telefon vitale cu apelare imediată la o singură atingere.
* **4 numere critice:** 112 (Urgențe generale), Spital Veterinar 24/7, Dispecerat DSVSA și Colegiul Farmaciștilor.
* **Sfaturi rapide:** Pași clari pentru triaj uman și veterinar înainte de plecarea spre unitate.
* **Acces rapid:** Buton vizibil colorat în antet pentru acces instant în caz de criză.

### DS-04: Autentificare și Favorite (`/favorites` & `/auth`)
* **Scop:** Salvarea farmaciilor utile pentru noapte și intrarea în cont.
* **Pentru utilizatori conectați:** Afișează direct lista unităților salvate cu starea lor actualizată pe loc.
* **Pentru vizitatori:** Mesaj prietenos care explică de ce este util contul și buton rapid de conectare.
* **Conectare ușoară:** Butoane demonstrative de intrare cu 1-click (`USER` sau `ADMIN`).

### DS-05: Panou Administrator (`/admin`)
* **Scop:** Verificarea sesizărilor primite și actualizarea programului oficial de gardă.
* **Coadă de moderare:** Administratorul vede sesizările votate de comunitate și le aprobă sau respinge.
* **Încărcare CSV:** Zonă simplă unde se trage fișierul lunar cu gărzile farmaciilor, cu previzualizare tabelară.
* **Acces restrâns:** Vizibil doar pentru contul de administrator.

---

## Risks
* **Diferențe de oră între dispozitive:** Rezolvat prin calcularea stării strict pe ora oficială a României.
* **Elemente înghesuite pe telefoane mici:** Rezolvat prin așezarea elementelor pe un singur rând vertical.
* **Pierderea selecției la logare:** Rezolvat prin salvarea automată a favoritului imediat după conectare.

---

## Out of scope
* Vânzare online de medicamente, coș de cumpărături sau plăți cu cardul (`D-002`).
* Consultații medicale la distanță sau mesagerie tip chat (`D-002`).
* Verificarea stocurilor din farmacii (nu există date publice în România, `Q-005`).
* Sistem propriu de navigație pe hartă (deschidem direct aplicația Google Maps sau Waze, `Q-006`).

---

## Knowledge used

> 17 reguli confirmate anterior (`D-001` .. `D-006`, `PATTERN-001`, `PATTERN-002`, `C-001` .. `C-004`, `Q-002` .. `Q-008`).

| Notă | Ce prevede | De ce se aplică | Decizie |
|---|---|---|---|
| `D-001` | Auto-aprobare la 8 voturi (adaptat la 4 pentru pauze scurte) | Stabilește pragul de vot pe ecranul `DS-02` și `DS-05` | confirmat |
| `D-002` | Fără comerț, plăți sau telemedicină | Păstrează aplicația simplă, strict de informare | confirmat |
| `D-003` | Căutare liberă pentru oricine, cont cerut doar la favorite | Permite oricui să caute rapid noaptea fără cont | confirmat |
| `C-003` | Format sesizări de program din comunitate | Folosit la trimiterea și confirmarea sesizărilor | confirmat |
| `C-004` | Format fișier CSV pentru gărzile lunare | Folosit la încărcarea rotațiilor în panoul admin | confirmat |
| `Q-004` | Încărcare CSV prin panou admin securizat | Stabilește ecranul de import din `DS-05` | confirmat |
| `Q-007` | Rol unic de administrator (comasat cu moderator) | Simplifică panoul de administrare `DS-05` | confirmat |
