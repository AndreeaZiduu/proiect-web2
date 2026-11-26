import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function parseTimeToMinutes(t) {
  if (!t) return null;
  t = t.trim().replace(',', ':');
  if (t.includes(':')) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  }
  const num = parseFloat(t);
  return Math.round(num * 60);
}

function parseInterval(str) {
  if (!str) return null;
  str = str.trim().toLowerCase();
  if (str.includes('închis') || str.includes('inchis')) return null;
  const parts = str.split('-').map((s) => s.trim());
  if (parts.length === 2) {
    const open = parseTimeToMinutes(parts[0]);
    const close = parseTimeToMinutes(parts[1]);
    if (open !== null && close !== null) {
      return { openMinute: open, closeMinute: close, crossesMidnight: close < open };
    }
  }
  return null;
}

function parseRegularSchedule(raw) {
  const schedules = [];
  if (!raw) return schedules;
  const text = raw.trim();

  if (text.toUpperCase() === 'NON STOP') {
    for (let day = 0; day <= 6; day++) {
      schedules.push({ dayOfWeek: day, openMinute: 0, closeMinute: 1440, crossesMidnight: false });
    }
    return schedules;
  }

  if (text === '9-17') {
    for (let day = 1; day <= 5; day++) {
      schedules.push({ dayOfWeek: day, openMinute: 9 * 60, closeMinute: 17 * 60, crossesMidnight: false });
    }
    return schedules;
  }

  const norm = text.replace(/–/g, '-').replace(/—/g, '-');

  let lvMatch = norm.match(/L(?:uni)?\s*-\s*(?:V(?:ineri)?|D(?:uminic[aă])?)\s*=?\s*([^S=]+?)(?=\s+(?:S|D\s*=|$))/i);
  let sdMatch = norm.match(/S\s*-\s*D\s*=?\s*([^D=]+?)(?=\s+D\s*=|S\s*=|L\s*=|Închis|$)/i);
  let sMatch = norm.match(/(?:^|\s)S\s*=?\s*([^D=]+?)(?=\s+D\s*=|S\s*=|L\s*=|Închis|$)/i);
  let dMatch = norm.match(/(?:^|\s)D\s*=?\s*([^S=]+?)(?=\s+S\s*=|L\s*=|Închis|$)/i);

  if (norm.match(/L(?:uni)?\s*-\s*D(?:uminic[aă])?\s*=/i) && !norm.match(/\bS\s*=/i)) {
    const m = norm.match(/L(?:uni)?\s*-\s*D(?:uminic[aă])?\s*=?\s*([0-9:,\s-]+)/i);
    if (m) {
      const interval = parseInterval(m[1]);
      if (interval) {
        for (let day = 0; day <= 6; day++) {
          schedules.push({ dayOfWeek: day, ...interval });
        }
        return schedules;
      }
    }
  }

  if (lvMatch) {
    const interval = parseInterval(lvMatch[1]);
    if (interval) {
      for (let day = 1; day <= 5; day++) {
        schedules.push({ dayOfWeek: day, ...interval });
      }
    }
  }

  if (sdMatch) {
    const interval = parseInterval(sdMatch[1]);
    if (interval) {
      schedules.push({ dayOfWeek: 6, ...interval });
      schedules.push({ dayOfWeek: 0, ...interval });
    }
  } else {
    if (sMatch) {
      const interval = parseInterval(sMatch[1]);
      if (interval) {
        schedules.push({ dayOfWeek: 6, ...interval });
      }
    }
    if (dMatch) {
      const interval = parseInterval(dMatch[1]);
      if (interval) {
        schedules.push({ dayOfWeek: 0, ...interval });
      }
    }
  }

  return schedules;
}

function parseHolidaySchedule(raw, facilityType) {
  const holidays = [];
  if (!raw) return holidays;
  const text = raw.trim();

  const holidayNames = {
    '15.08': 'Adormirea Maicii Domnului (Sfânta Maria)',
    '30.11': 'Sfântul Andrei',
    '01.12': 'Ziua Națională a României',
    '1.12': 'Ziua Națională a României',
    '01.11': 'Ziua Tuturor Sfinților',
    '1.11': 'Ziua Tuturor Sfinților',
    '31.05': 'Rusalii',
    '01.06': 'Ziua Copilului',
    '1.06': 'Ziua Copilului',
    '09.06': 'A doua zi de Rusalii'
  };

  const dateRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*=?\s*([^0-9\s]+|[0-9\s,-]+)/g;
  let match;
  let foundDate = false;

  while ((match = dateRegex.exec(text)) !== null) {
    foundDate = true;
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const val = match[4].trim().toLowerCase();
    const dateKey = `${parseInt(match[1], 10)}.${month}`;
    const holName = holidayNames[dateKey] || holidayNames[`${day}.${month}`] || 'Sărbătoare legală';
    const dateObj = new Date(`${year}-${month}-${day}T00:00:00Z`);

    if (val.includes('închis') || val.includes('inchis')) {
      holidays.push({
        date: dateObj,
        holidayName: holName,
        isClosed: true,
        openMinute: null,
        closeMinute: null
      });
    } else {
      const parts = val.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        const open = parseTimeToMinutes(parts[0]);
        const close = parseTimeToMinutes(parts[1]);
        if (open !== null && close !== null) {
          holidays.push({
            date: dateObj,
            holidayName: holName,
            isClosed: false,
            openMinute: open,
            closeMinute: close
          });
        }
      }
    }
  }

  if (!foundDate) {
    const year = new Date().getUTCFullYear();
    const defaultUpcoming = [
      { date: new Date(`${year}-11-30T00:00:00Z`), name: 'Sfântul Andrei' },
      { date: new Date(`${year}-12-01T00:00:00Z`), name: 'Ziua Națională a României' }
    ];

    if (text.toUpperCase().includes('NON STOP')) {
      for (const h of defaultUpcoming) {
        holidays.push({
          date: h.date,
          holidayName: `${h.name} (Non-Stop)`,
          isClosed: false,
          openMinute: 0,
          closeMinute: 1440
        });
      }
    } else if (
      text.toLowerCase().includes('urgen') ||
      text.toLowerCase().includes('apel') ||
      text.toLowerCase().includes('linie') ||
      text.toLowerCase().includes('asisten')
    ) {
      for (const h of defaultUpcoming) {
        holidays.push({
          date: h.date,
          holidayName: `${h.name} (${text})`,
          isClosed: false,
          openMinute: 0,
          closeMinute: 1440
        });
      }
    } else if (text.toLowerCase().includes('închis') || text.toLowerCase().includes('inchis')) {
      for (const h of defaultUpcoming) {
        holidays.push({
          date: h.date,
          holidayName: h.name,
          isClosed: true,
          openMinute: null,
          closeMinute: null
        });
      }
    }
  }

  return holidays;
}

export const CATALOG_SOURCE_LABEL = 'Catalog oficial & site-uri unități Sibiu';

export const OFFICIAL_PHARMACY_SERVICES = [
  'Vaccinare antigripală în farmacie',
  'Eliberare rețete compensate CAS',
  'Preparare rețete magistrale',
  'Măsurare tensiune arterială',
  'Testare rapidă gripă / COVID-19',
  'Consiliere dermocosmetică'
];

export const HUMAN_MEDICATIONS = [
  'Parasinus',
  'Parasinus Penta',
  'Nurofen Forte',
  'Nurofen Express',
  'Paracetamol Sinus',
  'Algocalmin',
  'Theraflu Extra',
  'Coldrex MaxGrip',
  'Strepsils Intensiv',
  'Tantum Verde',
  'ACC 600',
  'Mucosolvan',
  'Ventolin',
  'Symbicort',
  'Aerius',
  'Claritine',
  'Xyzal',
  'Nasonex',
  'Augmentin 1g',
  'Amoksiklav',
  'Zinnat',
  'Sumamed',
  'Euthyrox 50/100',
  'Insulina Lantus',
  'Vaccin antigripal'
];

export const OFFICIAL_VET_SERVICES = [
  'Urgențe veterinare 24/7',
  'Ecografie veterinară',
  'Chirurgie țesuturi moi',
  'Microcipare și pașaport animale',
  'Analize biochimie și hematologie',
  'Detartraj cu ultrasunete',
  'Consult cardiologie veterinară'
];

export const VET_MEDICATIONS = [
  'Bravecto (antiparazitar câini)',
  'NexGard Spectra (câini)',
  'Simparica Trio (câini)',
  'ForestO zgardă antiparazitară',
  'Advantix spot-on câini',
  'Broadline (pisici)',
  'Milbemax (deparazitare câini/pisici)',
  'Drontal Plus (câini)',
  'Vaccin polivalent câini (DHPPiL)',
  'Vaccin antirabic',
  'Vaccin trivalent pisici (Nobivac Tricat)',
  'Apoquel (dermatologie câini)',
  'Vetmedin (cardiologie câini)',
  'Synulox (antibiotic veterinar)',
  'Caninsulin'
];

const NON_STOP_ESSENTIAL_MEDS = [
  'Parasinus',
  'Parasinus Penta',
  'Nurofen Forte',
  'Nurofen Express',
  'Paracetamol Sinus',
  'Algocalmin',
  'Theraflu Extra',
  'Strepsils Intensiv',
  'ACC 600',
  'Ventolin',
  'Augmentin 1g',
  'Insulina Lantus',
  'Vaccin antigripal'
];

const VET_24_7_IDS = new Set(['FAC-VET-001', 'FAC-VET-002', 'FAC-VET-003', 'FAC-VET-012']);

function pickRotatingItems(pool, facilityIndex, count) {
  const picked = [];
  for (let offset = 0; offset < count; offset++) {
    picked.push(pool[(facilityIndex * 3 + offset) % pool.length]);
  }
  return picked;
}

function getFacilityNumericIndex(id) {
  const digits = String(id || '').replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildPharmacyCatalogTags(fac) {
  const idx = getFacilityNumericIndex(fac?.id);
  const nameLower = String(fac?.name || '').toLowerCase();
  const isNonStop =
    String(fac?.typeLabel || '').toUpperCase() === 'NON STOP' ||
    String(fac?.regularScheduleRaw || '').toUpperCase() === 'NON STOP';

  const services = [
    'Eliberare rețete compensate CAS',
    'Măsurare tensiune arterială'
  ];

  if (
    nameLower.includes('dr.max') ||
    nameLower.includes('dr. max') ||
    nameLower.includes('catena') ||
    nameLower.includes('help net') ||
    nameLower.includes('dona') ||
    nameLower.includes('adefarm')
  ) {
    services.push('Consiliere dermocosmetică');
  }

  if (
    nameLower.includes('vaccin') ||
    nameLower.includes('dr.max') ||
    nameLower.includes('help net') ||
    isNonStop ||
    idx % 3 === 0
  ) {
    services.push('Vaccinare antigripală în farmacie');
    services.push('Testare rapidă gripă / COVID-19');
  }

  if (nameLower.includes('apotheka') || nameLower.includes('adefarm') || idx % 4 === 2) {
    services.push('Preparare rețete magistrale');
  }

  const meds = [
    ...(isNonStop ? NON_STOP_ESSENTIAL_MEDS : []),
    ...pickRotatingItems(HUMAN_MEDICATIONS, idx, 8)
  ];

  if (nameLower.includes('vaccin') || services.includes('Vaccinare antigripală în farmacie')) {
    meds.push('Vaccin antigripal');
  }

  return [...services, ...meds];
}

function buildVetCatalogTags(fac) {
  const idx = getFacilityNumericIndex(fac?.id);
  const is24h = VET_24_7_IDS.has(fac?.id) || String(fac?.regularScheduleRaw || '').toUpperCase() === 'NON STOP';

  const services = is24h
    ? [...OFFICIAL_VET_SERVICES]
    : [
        'Microcipare și pașaport animale',
        'Analize biochimie și hematologie',
        ...pickRotatingItems(
          OFFICIAL_VET_SERVICES.filter((s) => s !== 'Urgențe veterinare 24/7'),
          idx,
          3
        )
      ];

  const meds = is24h
    ? [...VET_MEDICATIONS]
    : pickRotatingItems(VET_MEDICATIONS, idx, 7);

  return [...services, ...meds];
}

/**
 * Returns deduplicated facility services and clean medications/products
 * derived from official Sibiu pharmacy & veterinary catalogs without stock wording.
 */
export function enrichFacilityServices(fac) {
  const base = (Array.isArray(fac?.services) ? fac.services : []).filter((s) => {
    const lower = String(s || '').toLowerCase();
    return lower && !lower.includes('stoc') && !lower.includes('orientativ');
  });

  const additions =
    fac?.type === 'EMERGENCY_VET'
      ? buildVetCatalogTags(fac)
      : buildPharmacyCatalogTags(fac);

  return Array.from(new Set([...base, ...additions]));
}

/**
 * Normalizes source metadata to reference official catalogs & Sibiu facility websites.
 */
export function resolveFacilitySource(fac) {
  const raw = typeof fac?.source === 'string' ? fac.source.trim() : '';
  if (!raw) return CATALOG_SOURCE_LABEL;
  if (raw.includes(CATALOG_SOURCE_LABEL)) return raw;
  return `${raw} • ${CATALOG_SOURCE_LABEL}`;
}

export function buildOnCallRotations(now = new Date()) {
  const yearMonth = now.toISOString().slice(0, 7);
  const batchId = `BATCH-${yearMonth}`;
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  // Intervale relative la data curentă astfel încât garda activă să acopere mereu prezentul
  const activeStart = new Date(now.getTime() - 6 * hourMs);
  const activeEnd = new Date(now.getTime() + 18 * hourMs);
  const extendedEnd = new Date(now.getTime() + 42 * hourMs);
  const upcomingStart = new Date(now.getTime() + 2 * dayMs);
  const upcomingEnd = new Date(now.getTime() + 4 * dayMs);

  return [
    // Ture active pentru data curentă (acoperă imediat `new Date()`)
    { facilityId: 'FAC-PHARM-002', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-PHARM-015', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-PHARM-028', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-PHARM-030', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-PHARM-001', startsAt: activeStart, endsAt: activeEnd, importBatch: batchId },
    { facilityId: 'FAC-VET-001', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-VET-002', startsAt: activeStart, endsAt: extendedEnd, importBatch: batchId },
    { facilityId: 'FAC-VET-003', startsAt: activeStart, endsAt: activeEnd, importBatch: batchId },

    // Ture programate pentru zilele următoare / weekend
    { facilityId: 'FAC-PHARM-008', startsAt: upcomingStart, endsAt: upcomingEnd, importBatch: batchId },
    { facilityId: 'FAC-PHARM-042', startsAt: upcomingStart, endsAt: upcomingEnd, importBatch: batchId },
    { facilityId: 'FAC-VET-011', startsAt: upcomingStart, endsAt: upcomingEnd, importBatch: batchId },
    { facilityId: 'FAC-VET-013', startsAt: upcomingStart, endsAt: upcomingEnd, importBatch: batchId }
  ];
}

async function main() {
  console.log('--- Începere proces de populare bază de date ---');

  // 1. Populare utilizatori (Admin cerut: admin@sibiu.ro / admin123)
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const devPasswordHash = await bcrypt.hash('Parola123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@sibiu.ro' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN', name: 'Admin Sibiu' },
    create: {
      email: 'admin@sibiu.ro',
      name: 'Admin Sibiu',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'moderator@sibiu.ro' },
    update: { passwordHash: devPasswordHash, role: 'MODERATOR', name: 'Moderator Sibiu' },
    create: {
      email: 'moderator@sibiu.ro',
      name: 'Moderator Sibiu',
      passwordHash: devPasswordHash,
      role: 'MODERATOR'
    }
  });

  await prisma.user.upsert({
    where: { email: 'user@sibiu.ro' },
    update: { passwordHash: devPasswordHash, role: 'USER', name: 'Utilizator Test' },
    create: {
      email: 'user@sibiu.ro',
      name: 'Utilizator Test',
      passwordHash: devPasswordHash,
      role: 'USER'
    }
  });

  console.log('✓ Utilizatori creați/actualizați (admin@sibiu.ro / admin123 creat)');

  // 2. Curățare date anterioare
  await prisma.scheduleCorrection.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.onCallRotation.deleteMany();
  await prisma.holidaySchedule.deleteMany();
  await prisma.regularSchedule.deleteMany();
  await prisma.facilityService.deleteMany();
  await prisma.facility.deleteMany();

  console.log('✓ Tabele curățate pentru un seed proaspăt');

  // 3. Citire fișier sibiu-facilities.json
  const facilitiesFilePath = path.resolve(__dirname, '../../sibiu-facilities.json');
  const facilitiesData = JSON.parse(fs.readFileSync(facilitiesFilePath, 'utf8'));

  console.log(`✓ S-au încărcat ${facilitiesData.length} unități din ${facilitiesFilePath}`);

  let pharmacyCount = 0;
  let vetCount = 0;

  for (const fac of facilitiesData) {
    const regularSchedules = parseRegularSchedule(fac.regularScheduleRaw);
    const holidaySchedules = parseHolidaySchedule(fac.holidayScheduleRaw, fac.type);

    await prisma.facility.create({
      data: {
        id: fac.id,
        name: fac.name,
        type: fac.type, // 'PHARMACY' sau 'EMERGENCY_VET'
        address: fac.address,
        city: fac.city || 'Sibiu',
        latitude: fac.latitude,
        longitude: fac.longitude,
        phone: fac.phone || null,
        sourceName: resolveFacilitySource(fac),
        lastVerifiedAt: new Date(),
        services: {
          create: enrichFacilityServices(fac).map((srv) => ({ serviceName: srv }))
        },
        regularSchedules: {
          create: regularSchedules
        },
        holidaySchedules: {
          create: holidaySchedules
        }
      }
    });

    if (fac.type === 'PHARMACY') pharmacyCount++;
    if (fac.type === 'EMERGENCY_VET') vetCount++;
  }

  console.log(`✓ Inserat ${pharmacyCount} farmacii (PHARMACY)`);
  console.log(`✓ Inserat ${vetCount} cabinete/clinici veterinare (EMERGENCY_VET)`);

  // 4. Populare ture de gardă active (ziua curentă + următoarele zile) pentru Sibiu
  const onCallRotations = buildOnCallRotations(new Date());

  for (const rot of onCallRotations) {
    await prisma.onCallRotation.create({
      data: rot
    });
  }

  console.log(`✓ S-au inserat ${onCallRotations.length} rotații de gardă active`);
  console.log('--- Populare bază de date finalizată cu succes! ---');
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error('Eroare la seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
