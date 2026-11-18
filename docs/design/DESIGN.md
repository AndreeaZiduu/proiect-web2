# Design System Tokens — P10 Sibiu (Farmacii de gardă și Cabinete Veterinare de Urgență)

> **Document Status:** APPROVED (approved by user on 2026-11-18)  
> **Aesthetic Philosophy:** Modern Healthcare Minimalist (inspirat din Apple Health & Doctolib: curat, calmant, cu forme rotunjite, contrast de accesibilitate AAA și optimizare pentru căutare de urgență nocturnă).

---

## 1. Typography Tokens

- **Font Family (Primary):** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Tabular Figures (Numbers, Hours, Distance):** `font-variant-numeric: tabular-nums` (asigură aliniere stabilă pentru orare `08:00 - 20:00`, distanțe GPS `1.4 km` și telefoane).
- **Monospace (Code / ID):** `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

### Scale and Hierarchy

| Token | Size | Line Height | Weight | Typical Usage |
|---|---|---|---|---|
| `--font-size-xs` | 0.75rem (12px) | 1.0rem (16px) | 500 / 600 | Badge-uri status, etichete categorie, timestamps |
| `--font-size-sm` | 0.875rem (14px) | 1.25rem (20px) | 400 / 500 | Adrese, numere telefon, orare detaliate, distanță km |
| `--font-size-base` | 1.0rem (16px) | 1.5rem (24px) | 400 / 500 | Corp de text general, input căutare, controale |
| `--font-size-lg` | 1.125rem (18px) | 1.75rem (28px) | 600 | Titluri carduri de facilități, header panouri |
| `--font-size-xl` | 1.25rem (20px) | 1.75rem (28px) | 600 / 700 | Titluri secțiuni, header drawer |
| `--font-size-2xl` | 1.5rem (24px) | 2.0rem (32px) | 700 | Titlu principal pagină (mobile) |
| `--font-size-3xl` | 1.875rem (30px) | 2.25rem (36px) | 700 | Titlu principal pagină (desktop) |

### Weights

- `--font-weight-regular`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`

---

## 2. Color Palette Tokens

### 2.1. Semantic Status Colors (The 5 States of Truth)

Sistem cromatic optimizat conform WCAG AAA, destinat să indice clar starea operațională a unității fără ambiguități.

| Status | Element | Light Mode | Dark Mode (Midnight Slate) | Semnificație |
|---|---|---|---|---|
| **`ON_DUTY`** *(De gardă activă)* | Background | `#EEF2FF` (indigo-50) | `rgba(99, 102, 241, 0.18)` | Serviciu activ de noapte / urgență conform rotației |
| | Text | `#4338CA` (indigo-700) | `#A5B4FC` (indigo-300) | |
| | Border | `#C7D2FE` (indigo-200) | `rgba(165, 180, 252, 0.35)` | |
| | Solid / Indicator | `#6366F1` (indigo-500) | `#818CF8` (indigo-400) | Pulsare lentă (2s) pentru ghidare vizuală nocturnă |
| **`OPEN`** *(Deschis)* | Background | `#ECFDF5` (emerald-50) | `rgba(16, 185, 129, 0.18)` | Deschidere confirmată conform orarului standard |
| | Text | `#047857` (emerald-700) | `#6EE7B7` (emerald-300) | |
| | Border | `#A7F3D0` (emerald-200) | `rgba(110, 231, 183, 0.35)` | |
| | Solid / Indicator | `#10B981` (emerald-500) | `#34D399` (emerald-400) | Punct verde stabil |
| **`CLOSING_SOON`** *(Închide ≤ 30m)* | Background | `#FFFBEB` (amber-50) | `rgba(245, 158, 11, 0.18)` | Avertizare urgentă că unitatea se închide rapid |
| | Text | `#B45309` (amber-700) | `#FCD34D` (amber-300) | |
| | Border | `#FDE68A` (amber-200) | `rgba(252, 211, 77, 0.35)` | |
| | Solid / Indicator | `#F59E0B` (amber-500) | `#FBBF24` (amber-400) | Punct galben-chihlimbar |
| **`CLOSED`** *(Închis)* | Background | `#F8FAFC` (slate-50) | `rgba(51, 65, 85, 0.35)` | Închis în afara orelor de program sau sărbătoare |
| | Text | `#64748B` (slate-500) | `#94A3B8` (slate-400) | |
| | Border | `#E2E8F0` (slate-200) | `rgba(148, 163, 184, 0.20)` | |
| | Solid / Indicator | `#94A3B8` (slate-400) | `#64748B` (slate-500) | Punct gri neutru |
| **`UNKNOWN`** *(Program nespecificat)* | Background | `#F1F5F9` (slate-100) | `rgba(30, 41, 59, 0.50)` | Orar indisponibil sau sesizare neconfirmată |
| | Text | `#475569` (slate-600) | `#94A3B8` (slate-400) | |
| | Border | `#CBD5E1` (slate-300) | `rgba(100, 116, 139, 0.30)` | |
| | Solid / Indicator | `#64748B` (slate-500) | `#94A3B8` (slate-400) | Icon discret `?` |

---

### 2.2. Facility Type Domain Colors

Diferențiere imediată prin bară laterală pe card (`border-left: 4px solid ...`), pin hartă și badge tematic.

| Facility Type | Token | Light Mode | Dark Mode | Icon & Semnificație |
|---|---|---|---|---|
| **`PHARMACY`** | `--color-pharmacy` | `#0D9488` (teal-600) | `#2DD4BF` (teal-400) | 💊 Farmacie umană |
| | `--color-pharmacy-bg` | `#F0FDFA` (teal-50) | `rgba(45, 212, 191, 0.15)` | |
| | `--color-pharmacy-border` | `#99F6E4` (teal-200) | `rgba(45, 212, 191, 0.30)` | |
| | `--color-pharmacy-text` | `#0F766E` (teal-700) | `#5EEAD4` (teal-300) | |
| **`EMERGENCY_VET`** | `--color-vet` | `#6366F1` (indigo-500) | `#818CF8` (indigo-400) | 🐾 Cabinet / Spital veterinar urgență |
| | `--color-vet-bg` | `#EEF2FF` (indigo-50) | `rgba(129, 140, 248, 0.15)` | |
| | `--color-vet-border` | `#C7D2FE` (indigo-200) | `rgba(129, 140, 248, 0.30)` | |
| | `--color-vet-text` | `#4338CA` (indigo-700) | `#A5B4FC` (indigo-300) | |

---

### 2.3. Neutral Surface & Text Palette

| Token | Light Mode | Dark Mode (Midnight Slate) | Descriere |
|---|---|---|---|
| `--bg-app` | `#F8FAFC` (slate-50) | `#0B0F19` (slate-950) | Fundal general aplicație |
| `--bg-surface` | `#FFFFFF` | `#111827` (slate-900) | Carduri, panouri, modal, sheets |
| `--bg-surface-subtle` | `#F1F5F9` (slate-100) | `#1E293B` (slate-800) | Câmpuri de căutare, butoane pasive, hover |
| `--text-primary` | `#0F172A` (slate-900) | `#F8FAFC` (slate-50) | Titluri, conținut cu prioritate mare |
| `--text-secondary` | `#475569` (slate-600) | `#CBD5E1` (slate-300) | Adrese, telefoane, ore de program |
| `--text-muted` | `#64748B` (slate-500) | `#94A3B8` (slate-400) | Timestamps, etichete secundare, distanțe |
| `--border-subtle` | `#E2E8F0` (slate-200) | `#1E293B` (slate-800) | Separatoare și contur fin carduri |
| `--border-focus` | `#0D9488` (teal-600) | `#2DD4BF` (teal-400) | Focus ring pentru accesibilitate |

---

## 3. Spacing Scale

Bazată pe grilă standard de 4px:

| Token | Valoare | Utilizare |
|---|---|---|
| `--space-1` | 4px (0.25rem) | Margini micro, spațiu între status dot și etichetă |
| `--space-2` | 8px (0.5rem) | Padding vertical badge, spațiu între icon și text |
| `--space-3` | 12px (0.75rem) | Padding intern card compact, input padding vertical |
| `--space-4` | 16px (1.0rem) | Padding standard card unitate, gap listă |
| `--space-5` | 20px (1.25rem) | Padding intern panouri laterale |
| `--space-6` | 24px (1.5rem) | Spațiere container pe desktop, header gap |
| `--space-8` | 32px (2.0rem) | Spațiere secțiuni mari |
| `--space-10` | 40px (2.5rem) | Margini exterioare ecran desktop |
| `--space-12` | 48px (3.0rem) | Distanță maximă layout |

---

## 4. Radii Scale (Raze rotunjite Modern Healthcare)

| Token | Valoare | Utilizare |
|---|---|---|
| `--radius-sm` | 6px | Badge-uri mici de stare, tag-uri orar |
| `--radius-md` | 10px | Câmpuri input căutare, butoane acțiuni secundare |
| `--radius-lg` | 14px | Carduri de unități medicale, popups hartă |
| `--radius-xl` | 18px | Panouri plutitoare, toggle listă/hartă |
| `--radius-2xl` | 24px | Modale de urgență, carduri evidențiate |
| `--radius-full` | 9999px | Pill badges, butoane rotunde de apelare rapidă |

---

## 5. Shadows and Elevation

- **Light Mode:**
  - `--shadow-card`: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`
  - `--shadow-card-hover`: `0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)`
  - `--shadow-floating`: `0 20px 25px -5px rgba(15, 23, 42, 0.10), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`
- **Dark Mode:**
  - `--shadow-card`: `0 1px 3px rgba(0, 0, 0, 0.40)`
  - `--shadow-card-hover`: `0 10px 15px -3px rgba(0, 0, 0, 0.50)`
  - `--shadow-floating`: `0 20px 25px -5px rgba(0, 0, 0, 0.70)`

---

## 6. Motion and Visual Cues

- `--transition-fast`: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- `--transition-base`: `250ms cubic-bezier(0.4, 0, 0.2, 1)`
- **`ON_DUTY` Pulse Indicator:**
  ```css
  @keyframes pulse-duty {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.15);
    }
  }
  ```
  *(Activ doar pe indicatorul de gardă pentru atragerea atenției în urgențe nocturne, fără a încărca vizual ecranul).*
