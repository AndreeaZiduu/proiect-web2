import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, prisma, JWT_SECRET } from '../src/server.js';
import * as seedModule from '../prisma/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Service Search Seed & Favorite Schedule-Change Notifications', () => {
  const userToken = jwt.sign(
    { id: 'usr-fav-1', email: 'user@sibiu.ro', role: 'USER' },
    JWT_SECRET
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. seed enrichFacilityServices guarantees all required realistic pharmacy & vet services', () => {
    expect(typeof seedModule.enrichFacilityServices).toBe('function');

    const facilitiesPath = path.resolve(__dirname, '../../sibiu-facilities.json');
    const rawFacilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    const allPharmacyServices = new Set();
    const allVetServices = new Set();

    for (const fac of rawFacilities) {
      const services = seedModule.enrichFacilityServices(fac);
      if (fac.type === 'PHARMACY') {
        services.forEach((s) => allPharmacyServices.add(s));
      } else if (fac.type === 'EMERGENCY_VET') {
        services.forEach((s) => allVetServices.add(s));
      }
    }

    expect(allPharmacyServices.has('Vaccin antigripal')).toBe(true);
    expect(allPharmacyServices.has('Ventolin')).toBe(true);
    expect(allPharmacyServices.has('Eliberare rețete compensate CAS')).toBe(true);
    expect(allPharmacyServices.has('Măsurare tensiune arterială')).toBe(true);
    expect(allPharmacyServices.has('Preparare rețete magistrale')).toBe(true);

    expect(allVetServices.has('Urgențe veterinare 24/7')).toBe(true);
    expect(allVetServices.has('Ecografie veterinară')).toBe(true);
  });

  it('2. GET /api/facilities?q=ventolin queries serviceName and returns matching facilities', async () => {
    const findManySpy = vi.spyOn(prisma.facility, 'findMany').mockResolvedValue([
      {
        id: 'FAC-PHARM-002',
        name: 'Adefarm Plus',
        type: 'PHARMACY',
        address: 'B-dul M.Viteazu nr.11',
        city: 'Sibiu',
        latitude: 45.7824,
        longitude: 24.1481,
        phone: '0269420162',
        services: [{ serviceName: 'Ventolin' }],
        regularSchedules: [],
        holidaySchedules: [],
        onCallRotations: [],
        corrections: []
      }
    ]);

    const res = await request(app).get('/api/facilities?q=ventolin');

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledTimes(1);
    const whereArg = findManySpy.mock.calls[0][0].where;
    expect(whereArg.OR).toEqual(
      expect.arrayContaining([
        { services: { some: { serviceName: { contains: 'ventolin' } } } }
      ])
    );
    expect(res.body.facilities).toHaveLength(1);
    expect(res.body.facilities[0].services[0].serviceName).toBe('Ventolin');
  });

  it('3. GET /api/favorites flags active APPROVED schedule override even if created before favorite was saved', async () => {
    const now = Date.now();
    const savedAt = new Date(now - 60 * 60 * 1000); // 1h ago
    const createdEarlier = new Date(now - 3 * 60 * 60 * 1000); // 3h ago (before favorite)
    const validFrom = new Date(now - 30 * 60 * 1000);
    const validUntil = new Date(now + 4 * 60 * 60 * 1000);

    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([
      {
        userId: 'usr-fav-1',
        facilityId: 'FAC-PHARM-001',
        createdAt: savedAt,
        facility: {
          id: 'FAC-PHARM-001',
          name: 'Adefarm Plus',
          type: 'PHARMACY',
          address: 'str.Tribunei nr.1',
          city: 'Sibiu',
          latitude: 45.7931,
          longitude: 24.1486,
          phone: '0269708067',
          services: [],
          regularSchedules: [],
          holidaySchedules: [],
          onCallRotations: [],
          corrections: [
            {
              id: 'corr-active-1',
              status: 'APPROVED',
              proposedNote: 'Închis temporar pentru inventar 14:00-16:00',
              isClosedOverride: true,
              validFrom,
              validUntil,
              createdAt: createdEarlier
            }
          ]
        }
      }
    ]);

    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].hasScheduleChangeNotification).toBe(true);
    expect(res.body[0].notificationNote).toBe('Închis temporar pentru inventar 14:00-16:00');
  });

  it('4. GET /api/favorites does not flag expired older corrections', async () => {
    const now = Date.now();
    const savedAt = new Date(now - 60 * 60 * 1000);
    const createdEarlier = new Date(now - 10 * 60 * 60 * 1000);
    const validFrom = new Date(now - 8 * 60 * 60 * 1000);
    const validUntil = new Date(now - 2 * 60 * 60 * 1000); // expired

    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([
      {
        userId: 'usr-fav-1',
        facilityId: 'FAC-PHARM-003',
        createdAt: savedAt,
        facility: {
          id: 'FAC-PHARM-003',
          name: 'Adefarm Plus Cedonia',
          type: 'PHARMACY',
          address: 'str.N.Iorga',
          city: 'Sibiu',
          latitude: 45.7795,
          longitude: 24.1558,
          phone: '0269255130',
          services: [],
          regularSchedules: [],
          holidaySchedules: [],
          onCallRotations: [],
          corrections: [
            {
              id: 'corr-expired-1',
              status: 'APPROVED',
              proposedNote: 'Orar vechi expirat',
              isClosedOverride: false,
              validFrom,
              validUntil,
              createdAt: createdEarlier
            }
          ]
        }
      }
    ]);

    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].hasScheduleChangeNotification).toBe(false);
    expect(res.body[0].notificationNote).toBeNull();
  });
});
