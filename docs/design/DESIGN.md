# Design System Tokens — P10 Sibiu (Farmacii de Gardă și Cabinete Veterinare de Urgență)

> **Document Status:** APPROVED (confirmed and approved by user on 2026-11-21)  
> **Aesthetic Philosophy:** Warm Editorial Minimalist (inspirat din [Originle](https://originle.app/): cald, aerisit, umanist, cu carduri generoase `24px`, nuanțe delicate de șampanie/crem/teracotă, contrast ridicat de accesibilitate WCAG AAA și carduri de accent în contrast inversat).

---

## 1. Aesthetic Foundations & Originle Visual Identity

Sistemul vizual P10 Sibiu adoptă estetica caldă și rafinată a aplicației [Originle](https://originle.app/), adaptată riguros pentru cerințele critice de urgență medicală și veterinară:
- **Canvas cald și odihnitor**: Fundal general alabastru/crem discret (`#FAF7F4`), eliminând răceala clinică sterilă fără a compromite claritatea.
- **Carduri generoase cu geometrie fină**: Rază de rotunjire de `22px–24px`, borduri ultra-fine (`1px solid rgba(226, 218, 208, 0.7)`), gradient interior imperceptibil de la alb pur la șampanie delicată și umbre calde, difuze (`box-shadow: 0 10px 30px -5px rgba(180, 140, 110, 0.08)`).
- **Ierarhie tipografică editorială**: Numere de index mari (`01`, `02`, `029`) în teracotă caldă (`#C25E34`), etichete de categorie stilizate cu punct de accent (`● GHID DE URGENȚĂ`, `● SESIZARE`), titluri clare și cifre tabulare pentru orare și distanțe GPS.
- **Tratament de stare inversată (Inverted Dark Surface)**: Carduri critice sau active redate pe fundal cărbune cald (`#1C1917`) cu strălucire subtilă de margine, asigurând un punct focal instantaneu pentru situații de urgență maximă (ex: apelul 112 sau farmacia de gardă selectată).

---

## 2. Typography Tokens

- **Font Family (Primary):** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Tabular Figures (Numbers, Hours, Distance):** `font-variant-numeric: tabular-nums` (aliniere stabilă pentru orare `08:00 - 20:00`, distanțe GPS `1.4 km` și telefoane).
- **Monospace (Code / ID):** `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

### Scale and Hierarchy

| Token | Size | Line Height | Weight | Typical Usage |
|---|---|---|---|---|
| `--font-size-xs` | 0.75rem (12px) | 1.0rem (16px) | 500 / 600 | Badge-uri status, etichete categorie, timestamps, index tags |
| `--font-size-sm` | 0.875rem (14px) | 1.25rem (20px) | 400 / 500 | Adrese, numere telefon, orare detaliate, distanță km |
| `--font-size-base` | 1.0rem (16px) | 1.5rem (24px) | 400 / 500 | Corp de text general, input căutare, descrieri |
| `--font-size-lg` | 1.125rem (18px) | 1.75rem (28px) | 600 | Titluri carduri de unități, header panouri |
| `--font-size-xl` | 1.25rem (20px) | 1.75rem (28px) | 600 / 700 | Titluri secțiuni, header drawer, numere index mari |
| `--font-size-2xl` | 1.5rem (24px) | 2.0rem (32px) | 700 | Titlu principal pagină (mobile), numere stat hero |
| `--font-size-3xl` | 2.0rem (32px) | 2.5rem (40px) | 700 / 800 | Titlu principal pagină (desktop), cifre mari hero |

### Weights

- `--font-weight-regular`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`
- `--font-weight-extrabold`: `800`

---

## 3. Color Palette Tokens

### 3.1. Neutral Surface & Warm Canvas (Originle Warmth)

| Token | Light Mode (Warm Alabaster) | Dark Mode (Warm Obsidian) | Rol & Utilizare |
|---|---|---|---|
| `--bg-app` | `#FAF7F4` (crem cald) | `#141210` (cărbune obsidian) | Fundal general ecran |
| `--bg-surface` | `#FFFFFF` | `#1C1916` (cărbune cald) | Carduri, panouri, foi plutitoare |
| `--bg-surface-gradient` | `linear-gradient(145deg, #FFFDFB 0%, #FAF5EF 100%)` | `linear-gradient(145deg, #221E1B 0%, #171513 100%)` | Suprafață caldă carduri Originle |
| `--bg-surface-subtle` | `#F4EFEA` (șampanie subtilă) | `#26221E` | Input-uri, fundal hover, cipuri pasive |
| `--bg-surface-inverted` | `#1C1917` (cărbune profund) | `#FFFFFF` | Carduri evidențiate / stare activă (ex. 112) |
| `--text-inverted` | `#FDFBF7` | `#1C1917` | Text pe suprafețe inversate |
| `--text-primary` | `#1C1917` (cărbune profund) | `#FAF7F4` (crem cald) | Titluri mari, conținut primar |
| `--text-secondary` | `#57534E` (stone-600 cald) | `#D6D0C7` | Adrese, telefoane, ore de program |
| `--text-muted` | `#8C827A` (stone-400 cald) | `#A39B92` | Timestamps, etichete secundare, distanțe |
| `--border-subtle` | `rgba(226, 218, 208, 0.75)` | `rgba(255, 255, 255, 0.08)` | Contur fin carduri (stil Originle) |
| `--border-strong` | `#D9CEC2` | `rgba(255, 255, 255, 0.18)` | Borduri de input la hover, separatoare |
| `--border-focus` | `#C25E34` (teracotă caldă) | `#E07A5F` | Inel de focus accesibilitate |

---

### 3.2. Brand & Warm Accent Tokens (Originle Accents)

| Token | Light Mode | Dark Mode | Semnificație |
|---|---|---|---|
| `--accent-terracotta` | `#C25E34` | `#E07A5F` | Accent primar Originle: numere index (`01`, `029`), kicker pills |
| `--accent-terracotta-bg` | `rgba(194, 94, 52, 0.08)` | `rgba(224, 122, 95, 0.15)` | Fundal etichete index și cipuri active |
| `--accent-terracotta-border` | `rgba(194, 94, 52, 0.25)` | `rgba(224, 122, 95, 0.35)` | Bordură etichete index |
| `--accent-apricot` | `#E87A50` | `#F49876` | Gradient cald de evidențiere |
| `--accent-sand` | `#F5EBE1` | `#2D2823` | Fundal subtil capsule și butoane secundare |
| `--accent-coral-alert` | `#D93829` | `#F87171` | Numărul 112, urgențe maxime, erori |

---

### 3.3. Facility Type Domain Colors (Adapted Cleanly)

Diferențiere imediată prin bară laterală pe card (`border-left: 4px solid ...`), pin hartă și badge tematic.

| Facility Type | Token | Light Mode | Dark Mode | Icon & Semnificație |
|---|---|---|---|---|
| **`PHARMACY`** | `--color-pharmacy` | `#0E7465` (herbal teal) | `#2DD4BF` | 💊 Farmacie umană |
| | `--color-pharmacy-bg` | `#F0FDF8` (teal-crem cald) | `rgba(45, 212, 191, 0.12)` | |
| | `--color-pharmacy-border` | `#A7F3D0` | `rgba(45, 212, 191, 0.28)` | |
| | `--color-pharmacy-text` | `#0D6256` | `#5EEAD4` | |
| **`EMERGENCY_VET`** | `--color-vet` | `#5548A8` (royal indigo) | `#9D95FF` | 🐾 Cabinet / Spital veterinar |
| | `--color-vet-bg` | `#F5F3FF` (indigo cald) | `rgba(157, 149, 255, 0.12)` | |
| | `--color-vet-border` | `#DDD6FE` | `rgba(157, 149, 255, 0.28)` | |
| | `--color-vet-text` | `#45378F` | `#C4B5FD` | |

---

### 3.4. Semantic Status Colors (The 5 States of Truth)

Sistem cromatic optimizat conform WCAG AAA, destinat să indice clar starea operațională fără ambiguități.

| Status | Element | Light Mode | Dark Mode | Semnificație |
|---|---|---|---|---|
| **`ON_DUTY`** *(De gardă activă)* | Background | `#FDF4F0` (teracotă-crem) | `rgba(224, 122, 95, 0.16)` | Serviciu activ de noapte / urgență conform rotației |
| | Text | `#A8441F` (teracotă intensă) | `#FDBA74` | |
| | Border | `#FDBA9B` | `rgba(253, 186, 155, 0.35)` | |
| | Solid / Indicator | `#C25E34` (teracotă pulse) | `#E07A5F` | Pulsare lentă (2s) pentru ghidare nocturnă |
| **`OPEN`** *(Deschis)* | Background | `#F0FDF4` (smarald cald) | `rgba(16, 185, 129, 0.15)` | Deschidere confirmată conform orarului standard |
| | Text | `#15803D` | `#86EFAC` | |
| | Border | `#BBF7D0` | `rgba(187, 247, 208, 0.30)` | |
| | Solid / Indicator | `#16A34A` | `#4ADE80` | Punct verde stabil |
| **`CLOSING_SOON`** *(Închide ≤ 30m)* | Background | `#FEFCE8` (chihlimbar cald) | `rgba(245, 158, 11, 0.15)` | Avertizare urgentă că unitatea se închide rapid |
| | Text | `#A16207` | `#FDE047` | |
| | Border | `#FEF08A` | `rgba(254, 240, 138, 0.30)` | |
| | Solid / Indicator | `#D97706` | `#FACC15` | Punct chihlimbar cald |
| **`CLOSED`** *(Închis)* | Background | `#F5F2EE` (stone cald) | `rgba(45, 40, 36, 0.40)` | Închis în afara programului sau sărbătoare |
| | Text | `#78716C` | `#A8A29E` | |
| | Border | `#E7E2DA` | `rgba(231, 226, 218, 0.15)` | |
| | Solid / Indicator | `#A8A29E` | `#78716C` | Punct gri neutru cald |
| **`UNKNOWN`** *(Program nespecificat)* | Background | `#EFECE6` | `rgba(38, 34, 30, 0.50)` | Orar indisponibil sau sesizare neconfirmată |
| | Text | `#57534E` | `#D6D0C7` | |
| | Border | `#D6CEC3` | `rgba(214, 206, 195, 0.25)` | |
| | Solid / Indicator | `#78716C` | `#A8A29E` | Icon discret `?` |

---

## 4. Spacing Scale

Bazată pe grilă standard de 4px, cu spațiere generoasă și aerisită:

| Token | Valoare | Utilizare |
|---|---|---|
| `--space-1` | 4px (0.25rem) | Margini micro, spațiu între status dot și etichetă |
| `--space-2` | 8px (0.5rem) | Padding vertical badge, spațiu între icon și text |
| `--space-3` | 12px (0.75rem) | Padding intern capsule compacte, input padding vertical |
| `--space-4` | 16px (1.0rem) | Padding standard card unitate, gap listă |
| `--space-5` | 20px (1.25rem) | Padding intern panouri laterale |
| `--space-6` | 24px (1.5rem) | Padding carduri mari Originle, header gap |
| `--space-8` | 32px (2.0rem) | Spațiere secțiuni mari |
| `--space-10` | 40px (2.5rem) | Margini exterioare ecran desktop |
| `--space-12` | 48px (3.0rem) | Spațiere generoasă între blocuri editoriale |

---

## 5. Radii Scale (Raze rotunjite Originle)

| Token | Valoare | Utilizare |
|---|---|---|
| `--radius-sm` | 8px | Badge-uri mici de stare, tag-uri orar, micro-chips |
| `--radius-md` | 12px | Câmpuri input căutare, controale secundare |
| `--radius-lg` | 18px | Carduri compacte, popups hartă, dialoguri |
| `--radius-xl` | 24px | **Carduri standard Originle**, hero panels, panouri plutitoare |
| `--radius-2xl` | 32px | Containere mari, modale principale de urgență |
| `--radius-full` | 9999px | Pill badges, butoane de acțiune rapidă (Quick-Call), pill tabs |

---

## 6. Shadows and Warm Elevation

Multi-layered, umbre difuze calde specifice interfeței Originle:

- **Light Mode:**
  - `--shadow-card`: `0 10px 30px -5px rgba(180, 140, 110, 0.08), 0 4px 12px -2px rgba(180, 140, 110, 0.04)`
  - `--shadow-card-hover`: `0 20px 35px -8px rgba(160, 110, 80, 0.12), 0 8px 16px -4px rgba(160, 110, 80, 0.06)`
  - `--shadow-floating`: `0 25px 45px -10px rgba(120, 80, 50, 0.16), 0 12px 20px -6px rgba(120, 80, 50, 0.08)`
  - `--shadow-inverted`: `0 20px 35px -10px rgba(28, 25, 23, 0.35)`
- **Dark Mode:**
  - `--shadow-card`: `0 10px 30px -5px rgba(0, 0, 0, 0.50)`
  - `--shadow-card-hover`: `0 20px 35px -8px rgba(0, 0, 0, 0.65)`
  - `--shadow-floating`: `0 25px 50px -10px rgba(0, 0, 0, 0.80)`
  - `--shadow-inverted`: `0 20px 35px -10px rgba(0, 0, 0, 0.60)`

---

## 7. Component Patterns (Originle Aesthetic)

### 7.1. Hero Stat / Highlight Card (Screenshot 1)
```css
.originle-stat-card {
  background: var(--bg-surface-gradient);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.originle-stat-val {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-terracotta);
  line-height: 1.1;
}
.originle-stat-lbl {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}
```

### 7.2. Numbered Step / Guide Card (Screenshot 2)
```css
.originle-step-card {
  background: var(--bg-surface-gradient);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-base);
}
.originle-step-card.inverted-active {
  background: var(--bg-surface-inverted);
  color: var(--text-inverted);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: var(--shadow-inverted);
}
.originle-step-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-terracotta);
}
```

### 7.3. Catalog Directory Card (Screenshot 3)
```css
.originle-catalog-card {
  background: var(--bg-surface-gradient);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
}
```

### 7.4. Section Kicker Pill & Title Accent Bar
```css
.originle-kicker-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-terracotta);
}
.originle-title-bar {
  width: 40px;
  height: 3px;
  background: var(--accent-terracotta);
  border-radius: var(--radius-full);
  margin: 10px auto 16px auto;
}
```

---

## 8. Motion and Micro-interactions

- `--transition-fast`: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- `--transition-base`: `250ms cubic-bezier(0.4, 0, 0.2, 1)`
- **`ON_DUTY` Pulse Dot:**
  ```css
  @keyframes pulse-duty {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(1.25);
    }
  }
  ```
- **Card Hover Elevation:**
  ```css
  .interactive-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--border-strong);
  }
  ```
