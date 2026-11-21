import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, prisma, JWT_SECRET } from '../src/server.js';

describe('RBAC Middleware & Route Permissions (D-003: 4-Role Hierarchy)', () => {
  // Generate signed JWT tokens for each role
  const userToken = jwt.sign(
    { id: 'usr-1', email: 'andreea.zidu@ulbsibiu.ro', role: 'USER' },
    JWT_SECRET
  );
  const moderatorToken = jwt.sign(
    { id: 'mod-1', email: 'tudor.moderator@sibiu-urgente.ro', role: 'MODERATOR' },
    JWT_SECRET
  );
  const adminToken = jwt.sign(
    { id: 'adm-1', email: 'admin@sibiu-urgente.ro', role: 'ADMIN' },
    JWT_SECRET
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. MODERATOR Role Permissions', () => {
    it('MODERATOR gets 200 OK on report moderation (PATCH /api/corrections/:id/status)', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'update').mockResolvedValue({
        id: 'corr-101',
        facilityId: 'fac-1',
        status: 'APPROVED',
        reviewedById: 'mod-1'
      });
      vi.spyOn(prisma.facility, 'update').mockResolvedValue({
        id: 'fac-1',
        lastVerifiedAt: new Date()
      });

      const res = await request(app)
        .patch('/api/corrections/corr-101/status')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'APPROVED');
    });

    it('MODERATOR gets 200 OK on report moderation (PATCH /api/moderation/corrections/:id)', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'update').mockResolvedValue({
        id: 'corr-102',
        facilityId: 'fac-2',
        status: 'REJECTED',
        reviewedById: 'mod-1'
      });

      const res = await request(app)
        .patch('/api/moderation/corrections/corr-102')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ decision: 'REJECTED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'REJECTED');
    });

    it('MODERATOR gets 403 Forbidden on CSV guard-duty import (POST /api/rotations/import)', async () => {
      const res = await request(app)
        .post('/api/rotations/import')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ csvData: 'facilityId,name,type\nfac-1,Farmacia Test,PHARMACY' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Nu ai permisiunile necesare pentru această acțiune');
    });

    it('MODERATOR gets 403 Forbidden on CSV on-call batch import (POST /api/admin/on-call/import)', async () => {
      const res = await request(app)
        .post('/api/admin/on-call/import')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ importBatch: 'batch-1', entries: [{ facilityId: 'fac-1' }] });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Nu ai permisiunile necesare pentru această acțiune');
    });

    it('MODERATOR gets 403 Forbidden on facility deletion (DELETE /api/facilities/:id)', async () => {
      const res = await request(app)
        .delete('/api/facilities/fac-1')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Nu ai permisiunile necesare pentru această acțiune');
    });

    it('MODERATOR gets 403 Forbidden on facility deletion (DELETE /api/admin/facilities/:id)', async () => {
      const res = await request(app)
        .delete('/api/admin/facilities/fac-1')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Nu ai permisiunile necesare pentru această acțiune');
    });
  });

  describe('2. ADMIN Role Full Access', () => {
    it('ADMIN gets 200 OK on report moderation', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'update').mockResolvedValue({
        id: 'corr-103',
        facilityId: 'fac-1',
        status: 'APPROVED',
        reviewedById: 'adm-1'
      });
      vi.spyOn(prisma.facility, 'update').mockResolvedValue({
        id: 'fac-1',
        lastVerifiedAt: new Date()
      });

      const res = await request(app)
        .patch('/api/corrections/corr-103/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'APPROVED');
    });

    it('ADMIN gets 200 OK on CSV guard-duty import', async () => {
      vi.spyOn(prisma.facility, 'findFirst').mockResolvedValue({
        id: 'fac-1',
        name: 'Farmacia Test'
      });
      vi.spyOn(prisma.onCallRotation, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.onCallRotation, 'create').mockResolvedValue({
        id: 'rot-1',
        facilityId: 'fac-1'
      });

      const res = await request(app)
        .post('/api/rotations/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ csvData: 'facilityId,name,type\nfac-1,Farmacia Test,PHARMACY' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('ADMIN gets 200 OK on facility deletion', async () => {
      vi.spyOn(prisma.facility, 'delete').mockResolvedValue({ id: 'fac-1' });

      const res = await request(app)
        .delete('/api/facilities/fac-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('3. USER & ANON Restrictions', () => {
    it('USER gets 403 Forbidden on report moderation', async () => {
      const res = await request(app)
        .patch('/api/corrections/corr-101/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Nu ai permisiunile necesare pentru această acțiune');
    });

    it('USER gets 403 Forbidden on CSV import', async () => {
      const res = await request(app)
        .post('/api/rotations/import')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ csvData: 'header\nrow' });

      expect(res.status).toBe(403);
    });

    it('USER gets 403 Forbidden on facility deletion', async () => {
      const res = await request(app)
        .delete('/api/facilities/fac-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('ANON gets 401 Unauthorized without auth token', async () => {
      const res = await request(app)
        .patch('/api/corrections/corr-101/status')
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Autentificare necesară');
    });
  });

  describe('4. Community Schedule Corrections & 8-Confirmation Rule (D-001 & C-003)', () => {
    it('USER can submit schedule correction (POST /api/facilities/:id/corrections)', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.scheduleCorrection, 'create').mockResolvedValue({
        id: 'corr-new',
        facilityId: 'fac-1',
        submittedById: 'usr-1',
        proposedNote: 'Închis pentru renovare',
        isClosedOverride: true,
        validFrom: new Date('2026-11-21T08:00:00Z'),
        validUntil: new Date('2026-11-21T20:00:00Z'),
        status: 'PENDING',
        confirmations: 1
      });

      const res = await request(app)
        .post('/api/facilities/fac-1/corrections')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          proposedNote: 'Închis pentru renovare',
          isClosedOverride: true,
          validFrom: '2026-11-21T08:00:00Z',
          validUntil: '2026-11-21T20:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('correction');
      expect(res.body.correction.status).toBe('PENDING');
    });

    it('USER can confirm existing correction (POST /api/corrections/:id/confirm) and auto-approve at 4 votes for temporary closure', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'findUnique').mockResolvedValue({
        id: 'corr-pause',
        facilityId: 'fac-1',
        isClosedOverride: true,
        confirmations: 3,
        status: 'PENDING'
      });
      vi.spyOn(prisma.scheduleCorrection, 'update').mockResolvedValue({
        id: 'corr-pause',
        facilityId: 'fac-1',
        confirmations: 4,
        status: 'APPROVED'
      });
      vi.spyOn(prisma.facility, 'update').mockResolvedValue({
        id: 'fac-1',
        lastVerifiedAt: new Date()
      });

      const res = await request(app)
        .post('/api/corrections/corr-pause/confirm')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.correction.status).toBe('APPROVED');
      expect(res.body.correction.confirmations).toBe(4);
      expect(res.body.message).toContain('aprobată automat');
    });

    it('USER confirmation auto-approves general schedule change when reaching 8 votes', async () => {
      vi.spyOn(prisma.scheduleCorrection, 'findUnique').mockResolvedValue({
        id: 'corr-general',
        facilityId: 'fac-1',
        isClosedOverride: false,
        confirmations: 7,
        status: 'PENDING'
      });
      vi.spyOn(prisma.scheduleCorrection, 'update').mockResolvedValue({
        id: 'corr-general',
        facilityId: 'fac-1',
        confirmations: 8,
        status: 'APPROVED'
      });
      vi.spyOn(prisma.facility, 'update').mockResolvedValue({
        id: 'fac-1',
        lastVerifiedAt: new Date()
      });

      const res = await request(app)
        .post('/api/corrections/corr-general/confirm')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.correction.status).toBe('APPROVED');
      expect(res.body.correction.confirmations).toBe(8);
    });

    it('ANON gets 401 Unauthorized when attempting to confirm a correction', async () => {
      const res = await request(app).post('/api/corrections/corr-1/confirm');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Autentificare necesară');
    });
  });

  describe('5. Idempotent CSV Guard-Duty Import (C-004 & Master Plan)', () => {
    it('ADMIN CSV import skips duplicates when re-importing identical rotation (idempotent)', async () => {
      vi.spyOn(prisma.facility, 'findFirst').mockResolvedValue({
        id: 'FAC-PHARM-001',
        name: 'Farmacia 1 Sibiu'
      });
      // First row already exists
      vi.spyOn(prisma.onCallRotation, 'findFirst').mockResolvedValue({
        id: 'rot-1',
        facilityId: 'FAC-PHARM-001'
      });

      const csvData = 'facilityId,startDate,endDate,startHour,endHour\nFAC-PHARM-001,2026-11-21,2026-11-22,08:00,08:00';
      const res = await request(app)
        .post('/api/rotations/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ csvData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skippedDuplicates).toBe(1);
      expect(res.body.importedCount).toBe(0);
    });
  });
});
