# Contracts — projet-web2

<!-- graffino-agentic:begin v1 -->
> Promises across a boundary. **Provided:** this repo owns the contract; the text
> lives here only. **Consumed:** a link to the provider's entry plus the fields this
> repo relies on. **External:** what we rely on from a third-party service.
> Changing a provided contract is a PROPOSAL (AGENTS.md → The gate) and the plan
> lists the consumers' files too. Status: `approved` · `proposed` · `superseded-by`.
<!-- graffino-agentic:end -->

## Index
- C-001 · Facilities Query and Status API (/api/facilities) · provided
- C-002 · Real-time Facility Status Engine Interface · provided
- C-003 · Community Schedule Corrections API (/api/corrections) · provided
- C-004 · On-Call Rotation CSV Import API (/api/rotations/import) · provided

## Provided

### C-001 · Facilities Query and Status API (/api/facilities)
- **Status:** approved
- **Confirmed:** 2026-11-18
- **Interface:** `GET /api/facilities?type={PHARMACY|EMERGENCY_VET}&city={city}&openNow={boolean}&onCall={boolean}&lat={float}&lng={float}&search={string}` -> returns `Array<{ id, name, type, address, city, latitude, longitude, phone, services, status: { isOpen, code, label, source, isOnCall }, distanceKm?: number }>`. Client lifecycle: local status re-evaluation every 60 seconds (local `Europe/Bucharest` timer) and server `refetch` every 5 minutes.
- **Evidence:** Implemented in `backend/src/server.js` (lines 104-180); consumed by frontend explorer views.

### C-002 · Real-time Facility Status Engine Interface
- **Status:** approved
- **Confirmed:** 2026-11-18
- **Interface:** `getFacilityStatus(facility: FacilityWithSchedules, moment?: Date | string): { isOpen: boolean, code: 'OPEN' | 'CLOSED' | 'CLOSING_SOON', label: string, source: 'APPROVED_CORRECTION' | 'ON_CALL_ROTATION' | 'HOLIDAY_SCHEDULE' | 'REGULAR_SCHEDULE', isOnCall: boolean }` evaluated strictly in `Europe/Bucharest` timezone.
- **Evidence:** Implemented in `backend/src/status.js`; verified by 19 automated tests in `backend/tests/status.test.js`.

### C-003 · Community Schedule Corrections API (/api/corrections)
- **Status:** approved
- **Interface:** `POST /api/corrections` (JWT auth required, body: `{ facilityId, proposedNote, proposedOpenMin?, proposedCloseMin?, isClosedOverride?, validFrom, validUntil }`), `POST /api/corrections/:id/confirm` (JWT auth, increments confirmations and auto-approves at 8 confirmations), `PATCH /api/corrections/:id/status` (ADMIN auth).
- **Evidence:** Implemented in `backend/src/server.js` (lines 310-440); obeys decision D-001 and D-003.

### C-004 · On-Call Rotation CSV Import API (/api/rotations/import)
- **Status:** approved
- **Interface:** `POST /api/rotations/import` (ADMIN auth required, body: `{ csvData: string }` formatted as `facilityId,name,type,city,startDate,endDate,startHour,endHour,onCallPhone,notes`) -> returns `{ importedCount, batchId }`.
- **Evidence:** Defined in `DATA.md` Section 2.3; implemented in `backend/src/server.js` (lines 450-515).

## Consumed
None established.

## External
- CartoDB Leaflet Tile Service (Modern Healthcare Minimalist per DESIGN.md):
  - Light mode (Voyager): `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
  - Dark mode (Dark Matter): `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - Attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>`
- External navigation deep links: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
