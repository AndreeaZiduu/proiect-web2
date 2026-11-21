import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, prisma, JWT_SECRET } from '../src/server.js';

describe('CSV Guard-Duty Import & Idempotency (C-004)', () => {
  const adminToken = jwt.sign(
    { id: 'adm-1', email: 'admin@sibiu-urgente.ro', role: 'ADMIN' },
    JWT_SECRET
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Imports valid CSV on-call rotations', async () => {
    vi.spyOn(prisma.facility, 'findFirst').mockResolvedValue({
      id: 'FAC-PHARM-002',
      name: 'Farmacia 2 Sibiu'
    });
    vi.spyOn(prisma.onCallRotation, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.onCallRotation, 'create').mockResolvedValue({
      id: 'rot-101',
      facilityId: 'FAC-PHARM-002'
    });

    const csvData = 'facilityId,name,type,city,startDate,endDate,startHour,endHour,onCallPhone,notes\nFAC-PHARM-002,Farmacia 2,PHARMACY,Sibiu,2026-11-21,2026-11-23,08:00,08:00,0269123456,Gardă weekend';
    const res = await request(app)
      .post('/api/rotations/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvData });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.importedCount).toBe(1);
    expect(res.body.skippedDuplicates).toBe(0);
  });

  it('2. Re-importing identical CSV skips duplicate rows (idempotent)', async () => {
    vi.spyOn(prisma.facility, 'findFirst').mockResolvedValue({
      id: 'FAC-PHARM-002',
      name: 'Farmacia 2 Sibiu'
    });
    // Already in database
    vi.spyOn(prisma.onCallRotation, 'findFirst').mockResolvedValue({
      id: 'rot-101',
      facilityId: 'FAC-PHARM-002'
    });

    const csvData = 'facilityId,startDate,endDate,startHour,endHour\nFAC-PHARM-002,2026-11-21,2026-11-23,08:00,08:00';
    const res = await request(app)
      .post('/api/rotations/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvData });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.importedCount).toBe(0);
    expect(res.body.skippedDuplicates).toBe(1);
  });

  it('3. Reports conflict when facility in CSV is not found in database', async () => {
    vi.spyOn(prisma.facility, 'findFirst').mockResolvedValue(null);

    const csvData = 'facilityId,startDate,endDate\nUNKNOWN-FAC,2026-11-21,2026-11-23';
    const res = await request(app)
      .post('/api/rotations/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvData });

    expect(res.status).toBe(200);
    expect(res.body.importedCount).toBe(0);
    expect(res.body.conflicts.length).toBe(1);
    expect(res.body.conflicts[0].reason).toContain('nu a fost găsită');
  });
});
