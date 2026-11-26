import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getFacilityStatus, shouldAutoApproveCorrection } from './status.js';

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
  const normalizedRoles = roles.map(r => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Nu ai permisiunile necesare pentru această acțiune' });
    }
    const userRole = String(req.user.role).toUpperCase();
    if (!normalizedRoles.includes(userRole)) {
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
function isFacilityOnDutyStatus(status) {
  return Boolean(
    status?.isOnCall ||
    status?.code === 'ON_DUTY' ||
    (status?.isOpen && status?.label === 'Deschis Non-Stop')
  );
}

app.get('/api/facilities', async (req, res) => {
  try {
    const { q, type, city, openNow, onCall, onDuty, lat, lng, at } = req.query;
    const moment = at ? new Date(at) : new Date();

    const where = {};
    if (type && (type === 'PHARMACY' || type === 'EMERGENCY_VET')) {
      where.type = type;
    }

    if (city && city.trim() && city.trim().toLowerCase() !== 'all') {
      where.city = city.trim();
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
      const isOnDuty = isFacilityOnDutyStatus(status);
      const distanceKm =
        userLat !== null && !Number.isNaN(userLat) && userLng !== null && !Number.isNaN(userLng)
          ? calculateDistanceKm(userLat, userLng, fac.latitude, fac.longitude)
          : null;

      return {
        ...fac,
        status,
        isOnDuty,
        distanceKm
      };
    });

    if (openNow === 'true') {
      enriched = enriched.filter((f) => f.status.isOpen);
    }

    if (onCall === 'true' || onDuty === 'true') {
      enriched = enriched.filter((f) => f.isOnDuty);
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

    const status = getFacilityStatus(facility, moment);
    res.json({
      ...facility,
      status,
      isOnDuty: isFacilityOnDutyStatus(status)
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

// 5. Corecții de la utilizatori + regula de încredere (D-001: 4/8 voturi) + detecție conflict
async function handleCreateCorrection(facilityId, req, res) {
  try {
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
      const isOverride = Boolean(isClosedOverride ?? sameProposal.isClosedOverride);
      const requiredVotes = isOverride ? 4 : 8; // D-001: 4 pentru pauze/închidere temporară, 8 pentru orar general
      const nextStatus = newCount >= requiredVotes && !hasOtherConflict ? 'APPROVED' : sameProposal.status;

      const updated = await prisma.scheduleCorrection.update({
        where: { id: sameProposal.id },
        data: {
          confirmations: newCount,
          status: nextStatus
        }
      });

      if (nextStatus === 'APPROVED') {
        await prisma.facility.update({
          where: { id: facilityId },
          data: { lastVerifiedAt: new Date() }
        });
      }

      return res.status(200).json({
        message:
          nextStatus === 'APPROVED'
            ? `Corecția a atins pragul de ${requiredVotes} confirmări fără conflict și a fost aplicată automat!`
            : `Confirmarea ta a fost înregistrată (${newCount}/${requiredVotes}).`,
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
}

app.post('/api/facilities/:id/corrections', authenticateToken, async (req, res) => {
  return handleCreateCorrection(req.params.id, req, res);
});

app.post('/api/corrections', authenticateToken, async (req, res) => {
  const facilityId = req.body.facilityId;
  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId este obligatoriu' });
  }
  return handleCreateCorrection(facilityId, req, res);
});

// Confirmare / vot corecție (C-003, D-001: auto-aprobare la 4 voturi pauză / 8 voturi orar)
app.post('/api/corrections/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const correctionId = req.params.id;
    const correction = await prisma.scheduleCorrection.findUnique({
      where: { id: correctionId }
    });

    if (!correction) {
      return res.status(404).json({ error: 'Sesizarea nu a fost găsită' });
    }

    if (['APPROVED', 'REJECTED'].includes(correction.status)) {
      return res.status(400).json({ error: `Sesizarea a fost deja soluționată (${correction.status})` });
    }

    const newCount = correction.confirmations + 1;
    const requiredVotes = correction.isClosedOverride ? 4 : 8;
    const nextStatus = newCount >= requiredVotes && correction.status !== 'CONFLICT' ? 'APPROVED' : correction.status;

    const updated = await prisma.scheduleCorrection.update({
      where: { id: correctionId },
      data: {
        confirmations: newCount,
        status: nextStatus
      }
    });

    if (nextStatus === 'APPROVED') {
      await prisma.facility.update({
        where: { id: correction.facilityId },
        data: { lastVerifiedAt: new Date() }
      });
    }

    res.json({
      message:
        nextStatus === 'APPROVED'
          ? `Sesizarea a atins pragul de ${requiredVotes} confirmări și a fost aprobată automat!`
          : `Confirmarea ta a fost înregistrată (${newCount}/${requiredVotes}).`,
      correction: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Moderare corecții (MODERATOR & ADMIN conform D-003)
app.get('/api/moderation/corrections', authenticateToken, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
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

app.patch('/api/moderation/corrections/:id', authenticateToken, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const { decision, status } = req.body; // 'APPROVED' sau 'REJECTED'
    const finalDecision = decision || status;
    if (!['APPROVED', 'REJECTED'].includes(finalDecision)) {
      return res.status(400).json({ error: 'Decizie invalidă (APPROVED / REJECTED)' });
    }

    const updated = await prisma.scheduleCorrection.update({
      where: { id: req.params.id },
      data: {
        status: finalDecision,
        reviewedById: req.user.id
      }
    });

    if (finalDecision === 'APPROVED') {
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

app.patch('/api/corrections/:id/status', authenticateToken, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const { decision, status } = req.body;
    const finalDecision = decision || status;
    if (!['APPROVED', 'REJECTED'].includes(finalDecision)) {
      return res.status(400).json({ error: 'Decizie invalidă (APPROVED / REJECTED)' });
    }

    const updated = await prisma.scheduleCorrection.update({
      where: { id: req.params.id },
      data: {
        status: finalDecision,
        reviewedById: req.user.id
      }
    });

    if (finalDecision === 'APPROVED') {
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

// 7. Admin: Import idempotent listă de gardă + detecție conflicte (ADMIN Only conform D-003)
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

// Admin: Import CSV rotații de gardă (C-004 - ADMIN Only conform D-003, idempotent)
app.post('/api/rotations/import', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'Datele CSV lipsesc' });
    }

    const rawLines = csvData.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      return res.json({ success: true, importedCount: 0, skippedDuplicates: 0, batchId: `batch-${Date.now()}`, conflicts: [] });
    }

    const headerParts = rawLines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
    const dataLines = rawLines.slice(1);
    const batchId = `import-${new Date().toISOString().slice(0, 10)}`;

    let inserted = 0;
    let skippedDuplicates = 0;
    const conflicts = [];

    for (const line of dataLines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length < 2) continue;

      const row = {};
      headerParts.forEach((header, idx) => {
        row[header] = parts[idx] || '';
      });

      const facilityLookup = row.facilityid || row.id || row.name || parts[0];
      const facility = await prisma.facility.findFirst({
        where: {
          OR: [
            { id: facilityLookup },
            { name: { contains: row.name || facilityLookup } }
          ]
        }
      });

      if (!facility) {
        conflicts.push({ row, reason: `Unitatea "${facilityLookup}" nu a fost găsită` });
        continue;
      }

      let startsAt;
      let endsAt;

      if (row.startsat && row.endsat) {
        startsAt = new Date(row.startsat);
        endsAt = new Date(row.endsat);
      } else if (row.startdate && row.enddate) {
        const startH = row.starthour || '08:00';
        const endH = row.endhour || '08:00';
        startsAt = new Date(`${row.startdate}T${startH}:00+02:00`);
        endsAt = new Date(`${row.enddate}T${endH}:00+02:00`);
      } else if (parts.length >= 3 && !Number.isNaN(Date.parse(parts[1])) && !Number.isNaN(Date.parse(parts[2]))) {
        startsAt = new Date(parts[1]);
        endsAt = new Date(parts[2]);
      } else {
        const now = new Date();
        startsAt = new Date(now.getTime() - 60 * 60 * 1000);
        endsAt = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      }

      // Verificare idempotență (evită dublurile)
      const existing = await prisma.onCallRotation.findFirst({
        where: {
          facilityId: facility.id,
          startsAt,
          endsAt
        }
      });

      if (existing) {
        skippedDuplicates++;
        continue;
      }

      await prisma.onCallRotation.create({
        data: {
          facilityId: facility.id,
          startsAt,
          endsAt,
          importBatch: batchId
        }
      });
      inserted++;
    }

    res.json({
      success: true,
      importedCount: inserted,
      skippedDuplicates,
      batchId,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Ștergere unitate (ADMIN Only conform D-003)
app.delete('/api/admin/facilities/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.facility.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Unitate ștearsă cu succes' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/facilities/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.facility.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Unitate ștearsă cu succes' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { app, prisma, authenticateToken, requireRole, JWT_SECRET };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Serverul backend P10 Sibiu rulează pe http://localhost:${PORT}`);
  });
}
