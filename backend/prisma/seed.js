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
    const defaultUpcoming = [
      { date: new Date('2026-11-30T00:00:00Z'), name: 'Sfântul Andrei' },
      { date: new Date('2026-12-01T00:00:00Z'), name: 'Ziua Națională a României' }
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
        sourceName: fac.source,
        lastVerifiedAt: new Date('2026-11-17T12:00:00Z'),
        services: {
          create: (fac.services || []).map((srv) => ({ serviceName: srv }))
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

  // 4. Populare ture de gardă active (ziua curentă + weekend) pentru Sibiu
  const batchId = 'BATCH-2026-11';
  const onCallRotations = [
    // Ture active pentru ZIUA CURENTĂ (17.11.2026 - 18.11.2026)
    {
      facilityId: 'FAC-PHARM-002', // Adefarm Plus B-dul M.Viteazu 11 (Non-Stop)
      startsAt: new Date('2026-11-17T08:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-PHARM-028', // Polisano Pharma B-dul M.Viteazu 1 (Non-Stop)
      startsAt: new Date('2026-11-17T08:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-PHARM-001', // Adefarm Plus str. Tribunei 1
      startsAt: new Date('2026-11-17T20:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-001', // Spitalul Veterinar Universitar USAMV Sibiu (24/7)
      startsAt: new Date('2026-11-17T08:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-002', // Fan Vet Sibiu (24/7)
      startsAt: new Date('2026-11-17T08:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-003', // Vet Care Sibiu
      startsAt: new Date('2026-11-17T20:00:00+02:00'),
      endsAt: new Date('2026-11-18T08:00:00+02:00'),
      importBatch: batchId
    },

    // Ture active pentru WEEKEND (21.11.2026 - 23.11.2026)
    {
      facilityId: 'FAC-PHARM-002',
      startsAt: new Date('2026-11-21T08:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-PHARM-028',
      startsAt: new Date('2026-11-21T08:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-PHARM-008', // Centrul Farmaceutic Coposu
      startsAt: new Date('2026-11-21T14:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-PHARM-042', // San Marco Mediaș
      startsAt: new Date('2026-11-21T14:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-001',
      startsAt: new Date('2026-11-21T08:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-002',
      startsAt: new Date('2026-11-21T08:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-011', // Dr. Popa Sibiu
      startsAt: new Date('2026-11-21T14:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    },
    {
      facilityId: 'FAC-VET-013', // PrimaVet Mediaș
      startsAt: new Date('2026-11-21T13:00:00+02:00'),
      endsAt: new Date('2026-11-23T08:00:00+02:00'),
      importBatch: batchId
    }
  ];

  for (const rot of onCallRotations) {
    await prisma.onCallRotation.create({
      data: rot
    });
  }

  console.log(`✓ S-au inserat ${onCallRotations.length} rotații de gardă active`);
  console.log('--- Populare bază de date finalizată cu succes! ---');
}

main()
  .catch((e) => {
    console.error('Eroare la seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
