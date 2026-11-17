import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getFacilityStatus } from './status.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-farmacii-sibiu';

app.use(cors());
app.use(express.json());

// Calcul distanță Haversine (în km) între două coordonate GPS
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Middleware autentificare JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Autentificare necesară' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid sau expirat' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nu ai permisiunile necesare pentru această acțiune' });
    }
    next();
  };
}

// 1. Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timezone: process.env.APP_TIMEZONE || 'Europe/Bucharest'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Autentificare & Înregistrare
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, parolă și nume sunt obligatorii' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Există deja un cont cu acest email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: 'USER' }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email sau parolă incorectă' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email sau parolă incorectă' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Director unități + filtrare + sortare distanță + status calculat
app.get('/api/facilities', async (req, res) => {
  try {
    const { q, type, openNow, lat, lng, at } = req.query;
    const moment = at ? new Date(at) : new Date();

    const where = {};
    if (type && (type === 'PHARMACY' || type === 'EMERGENCY_VET')) {
      where.type = type;
    }

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { name: { contains: term } },
        { address: { contains: term } },
        { city: { contains: term } },
        { services: { some: { serviceName: { contains: term } } } }
      ];
    }

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        services: true,
        regularSchedules: true,
        holidaySchedules: true,
        onCallRotations: true,
        corrections: {
          where: { status: 'APPROVED' }
        }
      }
    });

    const userLat = lat !== undefined ? parseFloat(lat) : null;
    const userLng = lng !== undefined ? parseFloat(lng) : null;

    let enriched = facilities.map((fac) => {
      const status = getFacilityStatus(fac, moment);
      const distanceKm =
        userLat !== null && !Number.isNaN(userLat) && userLng !== null && !Number.isNaN(userLng)
          ? calculateDistanceKm(userLat, userLng, fac.latitude, fac.longitude)
          : null;

      return {
        ...fac,
        status,
        distanceKm
      };
    });

    if (openNow === 'true') {
      enriched = enriched.filter((f) => f.status.isOpen);
    }

    if (userLat !== null && !Number.isNaN(userLat)) {
      enriched.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else {
      enriched.sort((a, b) => Number(b.status.isOpen) - Number(a.status.isOpen) || a.name.localeCompare(b.name));
    }

    res.json({
      evaluatedAt: moment.toISOString(),
      count: enriched.length,
      facilities: enriched
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalii unitate + istoric corecții
app.get('/api/facilities/:id', async (req, res) => {
  try {
    const moment = req.query.at ? new Date(req.query.at) : new Date();
    const facility = await prisma.facility.findUnique({
      where: { id: req.params.id },
      include: {
        services: true,
        regularSchedules: { orderBy: [{ dayOfWeek: 'asc' }, { openMinute: 'asc' }] },
        holidaySchedules: { orderBy: { date: 'asc' } },
        onCallRotations: { orderBy: { startsAt: 'asc' } },
        corrections: {
          include: { submittedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!facility) return res.status(404).json({ error: 'Unitatea nu a fost găsită' });

    res.json({
      ...facility,
      status: getFacilityStatus(facility, moment)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Favorite & Notificări schimbare program
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        facility: {
          include: {
            services: true,
            regularSchedules: true,
            holidaySchedules: true,
            onCallRotations: true,
            corrections: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });

    const now = new Date();
    const result = favs.map((f) => {
      const recentChange = f.facility.corrections.find(
        (c) => new Date(c.createdAt).getTime() > new Date(f.createdAt).getTime()
      );
      return {
        facilityId: f.facilityId,
        savedAt: f.createdAt,
        hasScheduleChangeNotification: Boolean(recentChange),
        notificationNote: recentChange ? recentChange.proposedNote : null,
        facility: {
          ...f.facility,
          status: getFacilityStatus(f.facility, now)
        }
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/favorites/:facilityId', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: { userId_facilityId: { userId: req.user.id, facilityId } }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_facilityId: { userId: req.user.id, facilityId } }
      });
      return res.json({ favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: req.user.id, facilityId }
    });
    res.status(201).json({ favorited: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Corecții de la utilizatori + regula de încredere + detecție conflict
app.post('/api/facilities/:id/corrections', authenticateToken, async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { proposedNote, proposedOpenMin, proposedCloseMin, isClosedOverride, validFrom, validUntil } = req.body;

    if (!proposedNote || !validFrom || !validUntil) {
      return res.status(400).json({ error: 'Nota și perioada de valabilitate sunt obligatorii' });
    }

    // Căutăm corecții active/pending pe aceeași unitate pentru a detecta confirmări sau conflicte
    const existingPending = await prisma.scheduleCorrection.findMany({
      where: {
        facilityId,
        status: { in: ['PENDING', 'CONFLICT'] }
      }
    });

    const sameProposal = existingPending.find(
      (c) =>
        Boolean(c.isClosedOverride) === Boolean(isClosedOverride) &&
        (c.proposedOpenMin ?? null) === (proposedOpenMin ?? null) &&
        (c.proposedCloseMin ?? null) === (proposedCloseMin ?? null)
    );

    if (sameProposal) {
      const newCount = sameProposal.confirmations + 1;
      const hasOtherConflict = existingPending.some((c) => c.id !== sameProposal.id);
      // Regula din brief: minim 3 confirmări independente fără conflict aplică automat
      const nextStatus = newCount >= 3 && !hasOtherConflict ? 'APPROVED' : sameProposal.status;

      const updated = await prisma.scheduleCorrection.update({
        where: { id: sameProposal.id },
        data: {
          confirmations: newCount,
          status: nextStatus
        }
      });

      return res.status(200).json({
        message:
          nextStatus === 'APPROVED'
            ? 'Corecția a atins 3 confirmări fără conflict și a fost aplicată automat!'
            : 'Confirmarea ta a fost înregistrată.',
        correction: updated
      });
    }

    const hasConflict = existingPending.length > 0;
    if (hasConflict) {
      await prisma.scheduleCorrection.updateMany({
        where: { facilityId, status: 'PENDING' },
        data: { status: 'CONFLICT' }
      });
    }

    const created = await prisma.scheduleCorrection.create({
      data: {
        facilityId,
        submittedById: req.user.id,
        proposedNote,
        proposedOpenMin: proposedOpenMin ?? null,
        proposedCloseMin: proposedCloseMin ?? null,
        isClosedOverride: Boolean(isClosedOverride),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        status: hasConflict ? 'CONFLICT' : 'PENDING'
      }
    });

    res.status(201).json({
      message: hasConflict
        ? 'Există deja o altă propunere diferită; ambele variante au fost trimise la moderator.'
        : 'Corecția a fost trimisă spre verificare.',
      correction: created
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Moderare corecții (MODERATOR & ADMIN)
app.get('/api/moderation/corrections', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const items = await prisma.scheduleCorrection.findMany({
      where: { status: { in: ['PENDING', 'CONFLICT'] } },
      include: {
        facility: { select: { id: true, name: true, address: true } },
        submittedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/moderation/corrections/:id', authenticateToken, requireRole('MODERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { decision } = req.body; // 'APPROVED' sau 'REJECTED'
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decizie invalidă (APPROVED / REJECTED)' });
    }

    const updated = await prisma.scheduleCorrection.update({
      where: { id: req.params.id },
      data: {
        status: decision,
        reviewedById: req.user.id
      }
    });

    if (decision === 'APPROVED') {
      await prisma.facility.update({
        where: { id: updated.facilityId },
        data: { lastVerifiedAt: new Date() }
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Admin: Import idempotent listă de gardă + detecție conflicte
app.post('/api/admin/on-call/import', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { importBatch, entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Lista de intrări este goală' });
    }

    const batchName = importBatch || `import-${new Date().toISOString().slice(0, 10)}`;
    let inserted = 0;
    let skippedDuplicates = 0;
    const conflicts = [];

    for (const entry of entries) {
      const facility = await prisma.facility.findFirst({
        where: { name: { contains: entry.facilityName.trim() } }
      });

      if (!facility) {
        conflicts.push({
          entry,
          reason: `Unitatea "${entry.facilityName}" nu a fost găsită în baza de date`
        });
        continue;
      }

      const startsAt = new Date(entry.startsAt);
      const endsAt = new Date(entry.endsAt);

      // Verificăm idempotența (dacă exact aceeași tură există deja)
      const exactSame = await prisma.onCallRotation.findUnique({
        where: {
          facilityId_startsAt_endsAt: {
            facilityId: facility.id,
            startsAt,
            endsAt
          }
        }
      });

      if (exactSame) {
        skippedDuplicates++;
        continue;
      }

      // Verificăm conflicte cu alte gărzi suprapuse
      const overlapping = await prisma.onCallRotation.findMany({
        where: {
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        },
        include: { facility: { select: { name: true } } }
      });

      if (overlapping.length > 0) {
        conflicts.push({
          entry,
          reason: `Suprapunere cu garda existentă: ${overlapping.map((o) => o.facility.name).join(', ')}`
        });
      }

      await prisma.onCallRotation.create({
        data: {
          facilityId: facility.id,
          startsAt,
          endsAt,
          importBatch: batchName
        }
      });
      inserted++;
    }

    res.json({
      importBatch: batchName,
      inserted,
      skippedDuplicates,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Adăugare unitate nouă
app.post('/api/admin/facilities', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, type, address, city, latitude, longitude, phone, sourceName, services, regularSchedules } = req.body;
    const created = await prisma.facility.create({
      data: {
        name,
        type,
        address,
        city: city || 'Sibiu',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone: phone || null,
        sourceName: sourceName || 'Admin manual',
        services: {
          create: (services || []).map((s) => ({ serviceName: s }))
        },
        regularSchedules: {
          create: regularSchedules || []
        }
      },
      include: { services: true, regularSchedules: true }
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serverul backend P10 Sibiu rulează pe http://localhost:${PORT}`);
});
