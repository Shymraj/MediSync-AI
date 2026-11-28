import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Security, RBAC & Multi-Tenant Isolation Suite', () => {
  let baseUrl;
  let adminTokenHosp1;
  let adminTokenHosp2;
  let doctorToken;
  let nurseToken;

  before(async () => {
    baseUrl = await startTestServer();
    adminTokenHosp1 = generateToken({ role: 'admin', hospitalId: 'hosp-chn-01' });
    adminTokenHosp2 = generateToken({ role: 'admin', hospitalId: 'hosp-chn-02' });
    doctorToken = generateToken({ id: 'doc-01', role: 'doctor', hospitalId: 'hosp-chn-01' });
    nurseToken = generateToken({ id: 'nur-01', role: 'nurse', hospitalId: 'hosp-chn-01' });
  });

  after(async () => {
    await stopTestServer();
  });

  describe('1. Authentication Gatekeeping', () => {
    it('Rejects unauthenticated requests with HTTP 401', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        body: { reason: 'Unauthorized access test' }
      });
      assert.equal(res.status, 401);
      assert.ok(res.data.error.includes('Authentication') || res.data.error.includes('token'));
    });

    it('Rejects forged / malformed JWT with HTTP 403', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        headers: { Authorization: 'Bearer forged.token.signature' },
        body: { reason: 'Forged token test' }
      });
      assert.equal(res.status, 403);
      assert.ok(res.data.error.includes('Invalid') || res.data.error.includes('expired'));
    });

    it('Rejects expired JWT token with HTTP 403', async () => {
      // Create a token that expired 1 hour ago
      const expiredToken = generateToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${expiredToken}` },
        body: { reason: 'Expired token test' }
      });
      assert.equal(res.status, 403);
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('Allows doctor to raise resource requests', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
        body: {
          hospitalId: 'hosp-chn-01',
          department: 'Cardiology',
          ward: 'CCU',
          resourceType: 'equipment',
          resourceName: 'Defibrillator Unit',
          quantity: 1,
          urgency: 'high',
          priority: 'urgent',
          reason: 'CCU replacement backup',
          clinicalJustification: 'Cardiac care readiness',
          patientName: 'Murugan Selvam',
          patientId: 'pt-rec-02'
        }
      });
      assert.equal(res.status, 201);
    });

    it('Prevents unauthorized roles from administrative configurations', async () => {
      // Attempting to trigger an emergency allocation with a nurse token
      const res = await apiRequest(baseUrl, '/api/emergency/incidents/inc-test/allocate-resources', {
        method: 'POST',
        headers: { Authorization: `Bearer ${nurseToken}` },
        body: { allocatedBedId: 'bed-101' }
      });
      // Should be 403 Forbidden or 404 if incident not found, but NOT 200
      assert.ok(res.status === 403 || res.status === 404);
    });
  });

  describe('3. Multi-Tenant Hospital Data Isolation', () => {
    it('Hospital 1 queries strictly return Hospital 1 beds without data bleeding', async () => {
      const res = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminTokenHosp1}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      for (const bed of res.data) {
        assert.equal(bed.hospital_id, 'hosp-chn-01', 'Every bed record must belong to hosp-chn-01');
      }
    });

    it('Hospital 2 queries strictly return Hospital 2 beds without data bleeding', async () => {
      const res = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-02', {
        headers: { Authorization: `Bearer ${adminTokenHosp2}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      for (const bed of res.data) {
        assert.equal(bed.hospital_id, 'hosp-chn-02', 'Every bed record must belong to hosp-chn-02');
      }
    });
  });

  describe('4. SQL Injection Resistance & Input Sanitization', () => {
    it('Neutralizes malicious SQL injection strings in URL parameters', async () => {
      const maliciousId = "hosp-chn-01' OR '1'='1";
      const res = await apiRequest(baseUrl, `/api/hospitals/${encodeURIComponent(maliciousId)}`);
      // SQLite parameter binding treats this as a literal string, returning 404
      assert.equal(res.status, 404);
    });

    it('Neutralizes malicious payload in query parameters without leakage', async () => {
      const res = await apiRequest(baseUrl, `/api/beds?hospitalId=${encodeURIComponent("hosp-chn-01' UNION SELECT * FROM users --")}`, {
        headers: { Authorization: `Bearer ${adminTokenHosp1}` }
      });
      // Should safely return empty array or 200 with 0 items, not execute arbitrary union query
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.equal(res.data.length, 0);
    });
  });

  describe('5. Audit Trail Persistence', () => {
    it('Records administrative operations into audit log history', async () => {
      const res = await apiRequest(baseUrl, '/api/realtime/events/recent');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      // Should have audit events logged from the operations above
      assert.ok(res.data.length > 0);
    });
  });
});
