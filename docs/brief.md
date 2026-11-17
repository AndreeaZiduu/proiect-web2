# Brief Proiect — Farmacii și Cabinete Veterinare de Urgență Sibiu

## 1. Scopul Proiectului
Aplicație web dedicată cetățenilor și deținătorilor de animale din județul Sibiu pentru identificarea rapidă și sigură a unităților medicale și farmaceutice deschise sau de gardă în orice moment (inclusiv nopți, weekend-uri și sărbători legale).

## 2. Tipuri de Unități Suportate (`FacilityType`)
1. **`PHARMACY` (Farmacii comunitare)**:
   - Rețea de 50 de farmacii din municipiul Sibiu, Șelimbăr, Cisnădie, Mediaș, Avrig etc.
   - Oferă eliberare de medicamente (inclusiv rețete compensate/gratuite), produse de prim ajutor și asistență farmaceutică.
   - Include unități Non-Stop și rotații oficiale de gardă pe timp de noapte sau sărbători legale.

2. **`EMERGENCY_VET` (Cabinete și Clinici Veterinare de Urgență)**:
   - Rețea de 15 unități veterinare din județul Sibiu dotate cu servicii de urgență 24/7 sau linii telefonice de permanență/gardă pentru cazuri critice.
   - Asigură triaj, intervenții chirurgicale de urgență, terapie intensivă veterinară și asistență medicală în regim de gardă.

## 3. Motorul de Calcul al Statusului
Statusul fiecărei unități este determinat în timp real în fusul orar `Europe/Bucharest`, pe baza ierarhiei celor 5 surse de adevăr:
1. **Corecții aprobate de comunitate/moderatori (`APPROVED_CORRECTION`)**: au prioritate maximă pentru modificări neprevăzute sau temporare (ex. inventar, pană de curent).
2. **Rotații oficiale de gardă (`ON_CALL_ROTATION`)**: activează statusul **`ON_DUTY`** chiar și în afara orelor normale de funcționare sau pe durata sărbătorilor.
3. **Excepții de sărbători legale (`HOLIDAY_SCHEDULE`)**: suprascriu orarul săptămânal standard pentru zile libere legale (închis sau program special).
4. **Program săptămânal standard (`REGULAR_SCHEDULE`)**: intervale pe zile (0=Duminică..6=Sâmbătă), cu suport pentru pauze de prânz și ture peste miezul nopții.
5. **Avertizare închidere iminentă (`CLOSING_SOON`)**: dacă unitatea se închide în mai puțin de 30 de minute.

## 4. Date și Surse Oficiale
- **Farmacii**: Colegiul Farmaciștilor Sibiu și paginile oficiale ale lanțurilor farmaceutice.
- **Urgențe Veterinare**: Colegiul Medicilor Veterinari Sibiu și evidențele publice ale clinicilor veterinare din județul Sibiu.
- Fișier centralizator de date: `sibiu-facilities.json` (65 unități verificate cu coordonate GPS reale).
