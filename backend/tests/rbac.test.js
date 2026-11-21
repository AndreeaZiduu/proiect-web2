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
});
