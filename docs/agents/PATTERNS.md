# Patterns — proiect-web2

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Responsive split-screen desktop and toggle mobile view · candidate
- PATTERN-002 · Modern Healthcare Minimalist styling and semantic status palette · candidate

---

## PATTERN-001 · Responsive split-screen desktop and toggle mobile view
- **Status:** candidate
- **Confirmed:** 2026-11-18
- **How:** Display an interactive Leaflet map and scrollable facility card list side-by-side on desktop viewports; on mobile devices (<1024px), provide a sticky toggle switch between Map view and List view for fast emergency access.
- **Example:** `frontend/src/App.jsx` layout state toggling between map and cards list on small screens while rendering both in a grid on desktop.

---

## PATTERN-002 · Modern Healthcare Minimalist styling and semantic status palette
- **Status:** candidate
- **Confirmed:** 2026-11-18
- **How:** Adopt a clean, reassuring Modern Healthcare Minimalist aesthetic (Apple Health / Doctolib inspired) using Plus Jakarta Sans typography, rounded card geometry, full Light/Dark theme support, and CartoDB Voyager/Positron map tiles. Distinct color-coding separates facility types (Emerald/Teal for PHARMACY 💊 vs Indigo/Violet for EMERGENCY_VET 🐾), while real-time status follows a rich 4-state indicator (Green for OPEN, Indigo/Violet for ON_DUTY, Amber for CLOSING_SOON, Muted Red/Gray for CLOSED).
- **Example:** `frontend/src/index.css` defining CSS custom properties (`--font-main: 'Plus Jakarta Sans'`, `--color-pharmacy`, `--color-vet`, `--status-open`, `--status-oncall`, `--status-closing`, `--status-closed`) with dual `@media (prefers-color-scheme)` or `[data-theme]` tokens.
