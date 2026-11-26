import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../src/server.js';
import { buildOnCallRotations } from '../prisma/seed.js';

describe('Facilities On-Duty / De Gardă Filter (GET /api/facilities)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const mockFacilities = [
    {
      id: 'FAC-ONCALL-1',
      name: 'Farmacia Gardă Activă',
      type: 'PHARMACY',
      address: 'Str. Mihai Viteazu 1',
      city: 'Sibiu',
      latitude: 45.79,
      longitude: 24.15,
      phone: '0269111111',
      services: [],
      regularSchedules: [],
      holidaySchedules: [],
      onCallRotations: [{ startsAt: oneHourAgo, endsAt: sixHoursLater }],
      corrections: []
    },
    {
      id: 'FAC-NONSTOP-1',
      name: 'Spital Vet Non-Stop',
      type: 'EMERGENCY_VET',
      address: 'Str. Vasile Cârlova 19',
      city: 'Sibiu',
      latitude: 45.78,
      longitude: 24.14,
      phone: '0369991',
      services: [],
      regularSchedules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        openMinute: 0,
        closeMinute: 1440,
        crossesMidnight: false
      })),
      holidaySchedules: [],
      onCallRotations: [],
      corrections: []
    },
    {
      id: 'FAC-CLOSED-1',
      name: 'Farmacia Închisă',
      type: 'PHARMACY',
      address: 'Str. Test 2',
      city: 'Sibiu',
      latitude: 45.77,
      longitude: 24.13,
      phone: '0269222222',
      services: [],
      regularSchedules: [],
      holidaySchedules: [],
      onCallRotations: [],
      corrections: []
    }
  ];

  it('1. GET /api/facilities?onCall=true returns active on-call and 24/7 Non-Stop facilities', async () => {
    vi.spyOn(prisma.facility, 'findMany').mockResolvedValue(mockFacilities);

    const res = await request(app).get('/api/facilities?onCall=true');

    expect(res.status).toBe(200);
    const ids = res.body.facilities.map((f) => f.id);
    expect(ids).toContain('FAC-ONCALL-1');
    expect(ids).toContain('FAC-NONSTOP-1');
    expect(ids).not.toContain('FAC-CLOSED-1');
  });

  it('2. GET /api/facilities?onDuty=true works as alias and exposes isOnDuty flag', async () => {
    vi.spyOn(prisma.facility, 'findMany').mockResolvedValue(mockFacilities);

    const res = await request(app).get('/api/facilities?onDuty=true');

    expect(res.status).toBe(200);
    expect(res.body.facilities.length).toBe(2);
    expect(res.body.facilities.every((f) => f.isOnDuty === true)).toBe(true);
  });

  it('3. buildOnCallRotations generates active guard-duty rotations covering current Date()', () => {
    const referenceNow = new Date();
    const rotations = buildOnCallRotations(referenceNow);

    const activeNow = rotations.filter(
      (r) => r.startsAt.getTime() <= referenceNow.getTime() && referenceNow.getTime() < r.endsAt.getTime()
    );
    const activePharm = activeNow.filter((r) => r.facilityId.startsWith('FAC-PHARM-'));
    const activeVet = activeNow.filter((r) => r.facilityId.startsWith('FAC-VET-'));

    expect(activePharm.length).toBeGreaterThanOrEqual(4);
    expect(activeVet.length).toBeGreaterThanOrEqual(2);
  });
});
