import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { startTestServer, stopTestServer, apiRequest, generateToken } from './test-helper.js';
import { db } from '../server/db.js';

describe('MediSync AI - Phase 30 Final Bug Fixes & Regression Test Suite', () => {
  let baseUrl;
  let adminTokenHosp1;
  let adminTokenHosp2;
  let doctorTokenHosp1;
  let nurseTokenHosp1;
  let patientToken;
  let expiredToken;

  const JWT_SECRET = process.env.JWT_SECRET || 'medisync_enterprise_jwt_secret_2026_super_secure';

  before(async () => {
    baseUrl = await startTestServer();

    adminTokenHosp1 = generateToken({
      id: 'usr_admin_p30_1',
      email: 'admin.vasanth@medisync.gov.in',
      name: 'Dr. Vasanth Kumar',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });

    adminTokenHosp2 = generateToken({
      id: 'usr_admin_p30_2',
      email: 'admin.madurai@medisync.gov.in',
      name: 'Dr. Meenakshi Sundaram',
      role: 'admin',
      hospitalId: 'hosp-mdu-01'
    });

    doctorTokenHosp1 = generateToken({
      id: 'doc_sundar_01',
      email: 'dr.sundar@medisync.gov.in',
      name: 'Dr. Sundaramoorthy M.',
      role: 'doctor',
      hospitalId: 'hosp-chn-01'
    });

    nurseTokenHosp1 = generateToken({
      id: 'nurse_deepa_01',
      email: 'deepa.nurse@medisync.gov.in',
      name: 'Nurse Deepa R.',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });

    patientToken = generateToken({
      id: 'usr_patient_p30',
      email: 'karthik.subramanian@gmail.com',
      name: 'Karthik Subramanian',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });

    expiredToken = jwt.sign(
      {
        id: 'usr_expired_p30',
        email: 'expired.user@medisync.gov.in',
        role: 'doctor',
        hospitalId: 'hosp-chn-01',
        exp: Math.floor(Date.now() / 1000) - 120
      },
      JWT_SECRET
    );

    // Seed test fixtures
    db.prepare(`
      INSERT OR IGNORE INTO hospital_beds (
        id, hospital_id, ward, bed_number, type, status, patient_name, patient_id, notes, last_updated
      ) VALUES (
        'bed-p30-reg-01', 'hosp-chn-01', 'ICU Block B', 'ICU-B-01', 'ICU', 'ready', NULL, NULL, 'Cleaned and sanitized', 'Just now'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO equipment (
        id, hospital_id, name, category, type, serial_number, ward, status, condition, condition_score, last_inspection
      ) VALUES (
        'eq-p30-reg-01', 'hosp-chn-01', 'Mindray BeneVision N12 Patient Monitor', 'Monitoring', 'Patient Monitor', 'SN-P30-BV12',
        'ICU Block B', 'Available', 'Optimal', 99, 'Today'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO notifications (
        id, hospital_id, title, message, type, category, timestamp, read
      ) VALUES (
        'notif-p30-hosp1-test', 'hosp-chn-01', 'Hosp 1 Private Alert', 'Confidential bed capacity update', 'info', 'beds', 'Just now', 0
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO notifications (
        id, hospital_id, title, message, type, category, timestamp, read
      ) VALUES (
        'notif-p30-hosp2-test', 'hosp-mdu-01', 'Hosp 2 Private Alert', 'Madurai emergency ward dispatch', 'warning', 'emergency', 'Just now', 0
      )
    `).run();
  });

  after(async () => {
    await stopTestServer();
  });

  // =========================================================================
  // FIX 1: MULTI-TENANT NOTIFICATION BOUNDARY ISOLATION
  // =========================================================================
  describe('Fix 1: Multi-Tenant Notification Scoping & Security', () => {
    test('Hospital 2 Admin cannot query Hospital 1 notifications via query param override', async () => {
      const res = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: adminTokenHosp2
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      // Results must only be from hosp-mdu-02
      const hosp1Notifs = res.data.filter(n => n.hospitalId === 'hosp-chn-01' || n.hospital_id === 'hosp-chn-01');
      assert.strictEqual(hosp1Notifs.length, 0, 'Hospital 2 user must not see any Hospital 1 notifications');
    });

    test('Hospital 1 Admin successfully retrieves Hospital 1 notifications', async () => {
      const res = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: adminTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const hasHosp1 = res.data.some(n => n.id === 'notif-p30-hosp1-test' || n.hospital_id === 'hosp-chn-01');
      assert.strictEqual(hasHosp1, true);
    });
  });

  // =========================================================================
  // FIX 2: SHIFT HANDOVER RESPONSE STRUCTURE COMPATIBILITY
  // =========================================================================
  describe('Fix 2: Shift Handover Acknowledgment Response Shape', () => {
    let handoverId;

    test('Creates SBAR shift handover and verifies both top-level and nested handover payload in acknowledgment', async () => {
      const createRes = await apiRequest(baseUrl, '/api/handovers', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          ward: 'ICU Block B',
          outgoingNurse: 'Nurse Deepa R.',
          incomingNurse: 'Nurse Preeti K.',
          shiftType: 'Night to Morning',
          patientCount: 4,
          criticalPatients: [],
          situation: 'Ward calm. Telemetry normal.',
          background: 'Post-op observation.',
          assessment: 'All vital signs within target.',
          recommendation: 'Continue monitoring.',
          checklistCompleted: true,
          narcoticsCountVerified: true,
          crashCartChecked: true
        }
      });

      assert.strictEqual(createRes.status, 201);
      assert.ok(createRes.data.id);
      handoverId = createRes.data.id;

      // Acknowledge receipt
      const ackRes = await apiRequest(baseUrl, `/api/handovers/${handoverId}/acknowledge`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          acknowledgedBy: 'Nurse Preeti K., RN',
          notes: 'Schedule II narcotics dual check verified.'
        }
      });

      assert.strictEqual(ackRes.status, 200);
      // Verify both root-level status and nested handover object exist
      assert.strictEqual(ackRes.data.status, 'Acknowledged');
      assert.ok(ackRes.data.handover, 'Must include encapsulated handover object for backwards compatibility');
      assert.strictEqual(ackRes.data.handover.status, 'Acknowledged');
      assert.strictEqual(ackRes.data.handover.acknowledgedBy, 'Nurse Preeti K., RN');
    });
  });

  // =========================================================================
  // FIX 3: BED INVENTORY SUMMARY INTEGRITY & SCHEMA CONSISTENCY
  // =========================================================================
  describe('Fix 3: Bed Summary & Equipment Schema Consistency', () => {
    test('GET /api/beds/summary returns comprehensive capacity metrics and total count', async () => {
      const res = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01');
      assert.strictEqual(res.status, 200);
      assert.ok(typeof res.data.total === 'number');
      assert.ok(typeof res.data.available === 'number');
      assert.ok(typeof res.data.occupied === 'number');
      assert.ok(typeof res.data.cleaning === 'number');
    });

    test('Equipment table correctly preserves category, ward, status and lastInspection', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment', { token: nurseTokenHosp1 });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const eq = res.data.find(e => e.id === 'eq-p30-reg-01');
      assert.ok(eq);
      assert.strictEqual(eq.category, 'Monitoring');
      assert.strictEqual(eq.status, 'Available');
    });
  });

  // =========================================================================
  // FIX 4: CLINICAL TASK EXECUTION NOTES & DATABASE PERSISTENCE
  // =========================================================================
  describe('Fix 4: Clinical Task Execution Notes & State Persistence', () => {
    let taskId;

    test('Doctor assigns task, nurse completes with executionNotes, and notes persist in DB', async () => {
      const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          patientId: 'PT-P30-01',
          patientName: 'Kavitha Ramachandran',
          ward: 'ICU Block B',
          bed: 'ICU-B-01',
          instruction: 'Perform 12-lead ECG and repeat troponin level at 18:00',
          priority: 'Urgent',
          taskType: 'Diagnostic',
          assignedNurse: 'Nurse Deepa R.'
        }
      });

      assert.strictEqual(createRes.status, 201);
      assert.ok(createRes.data.id);
      taskId = createRes.data.id;

      // Nurse completes with executionNotes
      const completeRes = await apiRequest(baseUrl, `/api/clinical-tasks/${taskId}`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          status: 'Completed',
          executionNotes: '12-lead ECG completed. Normal sinus rhythm with no ST elevation. Troponin drawn.',
          vitalsRecorded: { hr: 76, bp: '122/80' }
        }
      });

      assert.strictEqual(completeRes.status, 200);
      assert.strictEqual(completeRes.data.task.status, 'Completed');

      // Verify persistence in SQLite
      const getRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: doctorTokenHosp1 });
      const task = getRes.data.find(t => t.id === taskId);
      assert.ok(task);
      assert.strictEqual(task.status, 'Completed');
      assert.ok(task.execution_notes?.includes('12-lead ECG completed'));
    });
  });

  // =========================================================================
  // FIX 5: SECURITY & RBAC PRIVILEGE BOUNDARIES
  // =========================================================================
  describe('Fix 5: Security Gatekeeping & RBAC Boundaries', () => {
    test('Expired JWT token is rejected with HTTP 403 on protected endpoint', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', { token: expiredToken });
      assert.strictEqual(res.status, 403);
      assert.ok(res.data.error.includes('expired') || res.data.error.includes('Invalid'));
    });

    test('Patient role is prevented from accessing administrative or staff verification endpoints', async () => {
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: patientToken,
        body: { userId: 'usr_some_user', decision: 'approved' }
      });
      assert.strictEqual(res.status, 403);
    });

    test('Patient role is blocked from retrieving hospital audit logs', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', { token: patientToken });
      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================================
  // FIX 6: AI DIAGNOSTIC DECISION SUPPORT RESPONSE SCHEMA
  // =========================================================================
  describe('Fix 6: AI Diagnostic Response Schema', () => {
    test('POST /api/ai/diagnose returns differentialDiagnoses, recommendedTests and confidenceScore', async () => {
      const res = await apiRequest(baseUrl, '/api/ai/diagnose', {
        method: 'POST',
        body: {
          symptoms: ['Chest pain radiation to left arm', 'Diaphoresis', 'Dyspnea'],
          vitals: { hr: 104, sbp: 148 }
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.differentialDiagnoses));
      assert.ok(res.data.differentialDiagnoses.length > 0);
      assert.ok(Array.isArray(res.data.recommendedTests));
      assert.ok(typeof res.data.confidenceScore === 'number');
    });
  });
});
