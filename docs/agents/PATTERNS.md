# Patterns — proiect-web2

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Responsive split-screen desktop and toggle mobile view · candidate
- PATTERN-002 · Warm Editorial Minimalist styling and semantic status palette · candidate
- PATTERN-003 · Integrated OSRM road routing on interactive map with external app fallback · candidate
- PATTERN-004 · Session-scoped Welcome Gate with Visitor Bypass and Header Account Menu · candidate
- PATTERN-005 · Accent-insensitive catalog autocomplete and matched-pill highlighting · candidate
- PATTERN-006 · In-app location consent prompt with sessionStorage persistence and live OSRM origin · candidate

---

## PATTERN-001 · Responsive split-screen desktop and toggle mobile view
- **Status:** candidate
- **Confirmed:** 2026-11-18
- **How:** Display an interactive Leaflet map and scrollable facility card list side-by-side on desktop viewports; on mobile devices (<1024px), provide a sticky toggle switch between Map view and List view for fast emergency access.
- **Example:** `frontend/src/App.jsx` layout state toggling between map and cards list on small screens while rendering both in a grid on desktop.

---

## PATTERN-002 · Warm Editorial Minimalist styling and semantic status palette
- **Status:** candidate
- **Confirmed:** 2026-11-21
- **How:** Adopt a warm, reassuring Warm Editorial Minimalist aesthetic (Originle inspired) using Plus Jakarta Sans typography, tabular figures, 24px rounded card geometry with subtle warm gradients (Warm Alabaster #FAF7F4 and Warm Obsidian #141210), soft diffuse shadows, terracotta (#C25E34) accents for numbers/badges, and inverted dark surface cards (#1C1917) for high-urgency focal points (112, emergency hotlines). Color-coding separates facility types (Herbal Teal #0E7465 for PHARMACY 💊 vs Royal Indigo #5548A8 for EMERGENCY_VET 🐾), while real-time operational status follows a 5-state WCAG AAA indicator system (ON_DUTY with pulse dot, OPEN, CLOSING_SOON, CLOSED, UNKNOWN).
- **Example:** `frontend/src/index.css` defining CSS custom properties (`--font-family-primary: 'Plus Jakarta Sans'`, `--color-pharmacy: #0E7465`, `--color-vet: #5548A8`, `--accent-terracotta: #C25E34`, `--bg-app`, `--bg-surface-gradient`, `--status-duty-bg`, `--status-open-bg`, `--status-closing-bg`, `--status-closed-bg`) with dual `[data-theme="light"]` and `[data-theme="dark"]` tokens.

---

## PATTERN-003 · Integrated OSRM road routing on interactive map with external app fallback
- **Status:** candidate
- **How:** Query public OSRM routing endpoint for driving directions between user coordinates (or Piața Mare fallback) and the target facility to draw an interactive polyline on the Leaflet map with estimated duration and distance in kilometers, while providing deep links for external launch into Google Maps and Waze.
- **Example:** `frontend/src/services/api.js` (`getOsrmRoute`) and `frontend/src/components/ds01-explorer/SibiuMap.jsx` rendering the terracotta route polyline and floating travel summary.

---

## PATTERN-004 · Session-scoped Welcome Gate with Visitor Bypass and Header Account Menu
- **Status:** candidate
- **How:** Gate application entry behind `AuthWelcomeScreen` until the user selects a role/account or clicks "Continuă ca Vizitator (fără cont)", persisting entry in `sessionStorage` so page refreshes remain inside the app while allowing return via a top-header account menu ("Deconectare / Schimbă contul").
- **Example:** `frontend/src/context/AuthContext.jsx` (`hasEnteredApp`, `continueAsVisitor`, `returnToWelcomeScreen`), `frontend/src/components/auth/AuthWelcomeScreen.jsx`, and `frontend/src/components/common/Header.jsx`.

---

## PATTERN-005 · Accent-insensitive catalog autocomplete and matched-pill highlighting
- **Status:** candidate
- **How:** Derive unique catalog tags (official services and clean medication labels) from loaded facilities, rank live autocomplete matches using diacritic-stripped `normalizeSearchText` (prefix matches first, then substring/token matches with facility counts), and highlight matched substrings inline inside `✓` pills on facility cards without using stock-availability wording.
- **Example:** `frontend/src/components/ds01-explorer/ExplorerView.jsx` (`normalizeSearchText`, `getAutocompleteSuggestions`, `getMatchingServices`) and `frontend/src/components/ds01-explorer/FacilityCard.jsx` (`highlightServiceMatch`).

---

## PATTERN-006 · In-app location consent prompt with sessionStorage persistence and live OSRM origin
- **Status:** candidate
- **How:** Never call `navigator.geolocation.getCurrentPosition` silently on page load; check `sessionStorage` for a prior decision and present an explicit in-app consent modal (`LocationConsentModal`) with allow and central Sibiu (`45.7983, 24.1256`) fallback buttons, keep a `"📍 Locația mea"` chip in the Explorer bar for opting in later, and render the detected coordinates as a `"Tu ești aici"` map marker and OSRM route starting point.
- **Example:** `frontend/src/components/ds01-explorer/LocationConsentModal.jsx`, `frontend/src/components/ds01-explorer/ExplorerView.jsx`, and `frontend/src/components/ds01-explorer/SibiuMap.jsx`.
