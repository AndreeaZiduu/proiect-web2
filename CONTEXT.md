# CONTEXT — projet-web2 vocabulary

<!-- graffino-agentic:begin v1 -->
> The approved terms for this project. Use each term exactly as defined, in the part
> of speech given. Never swap in a synonym; never use a word on an _Avoid_ line.
<!-- graffino-agentic:end -->

### Facility (noun)
A verified physical medical location in Sibiu County registered in the catalog (`sibiu-facilities.json`), of type `PHARMACY` or `EMERGENCY_VET`.
- _Avoid_: store, shop, punct de lucru.

### FacilityType (noun)
The official classification enum for medical facilities: `PHARMACY` (community pharmacy) or `EMERGENCY_VET` (emergency veterinary clinic or hospital).
- _Avoid_: category, kind, domeniu.

### Unități veterinare de urgență / EMERGENCY_VET (noun)
Medical veterinary facilities in Sibiu County equipped for emergency triage, surgery, intensive care, or 24/7 on-call availability for companion animals.
- _Avoid_: pet shop, frizerie canină, dispensar veterinar general.

### Gardă activă / ON_DUTY (noun)
The operational state and schedule window (`OnCallRotation`) designated by the College of Pharmacists or veterinary boards where a facility is actively serving emergency night, weekend, or holiday duties outside standard hours.
- _Avoid_: tură liberă, permanență oarecare, shift generic.

### Program peste miezul nopții / Crosses Midnight (noun)
A working schedule interval where the closing minute is numerically smaller than the opening minute, crossing into the following calendar day (e.g. 22:00 to 06:00).
- _Avoid_: tură spartă, program rotativ, orar mixt.

### Excepție sărbători legale / Holiday Schedule (noun)
A date-specific operational override (`HolidaySchedule`) for statutory Romanian public holidays (e.g. Crăciun, Anul Nou, Paște, Sf. Maria) that replaces the standard regular schedule with closed status or reduced hours.
- _Avoid_: zi liberă oarecare, program de weekend, vacanță.

### Închidere în curând / CLOSING_SOON (adjective)
The active status indicator triggered when a facility is currently open but will close in 30 minutes or less from the current time in `Europe/Bucharest`.
- _Avoid_: almost closed, pe terminate, aproape închis.

### ScheduleCorrection (noun)
A community-reported schedule adjustment (e.g. temporary closure for inventory or modified emergency hours) requiring 8 user confirmations for automatic temporary approval before moderator review.
- _Avoid_: report, sesizare generică, feedback.

### Status Engine (noun)
The deterministic status calculation algorithm evaluating 5 sources of truth in strict priority order under the `Europe/Bucharest` timezone.
- _Avoid_: status calculator, status checker.
