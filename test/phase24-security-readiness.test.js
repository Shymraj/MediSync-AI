import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';
import { db } from '../server/db.js';

describe('MediSync AI - Phase 24 Final Security Audit & Release Readiness Suite', () => {
  let baseUrl;
  let adminTokenHosp1;
  let adminTokenHosp2;
  let doctorTokenHosp1;
  let nurseTokenHosp1;
  let patientToken1;
  let patientToken2;

  before(async () => {
    baseUrl = await startTestServer();

    // Ensure baseline users & test patients exist for reproducible assertions
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, username, email, role, hospital_id, verification_status, is_onboarded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('doc_sundar_01', 'Dr. Sundaramoorthy M.', 'doc_sundar_01', 'sundar@medisync.gov.in', 'doctor', 'hosp-chn-01', 'approved', 1);

    db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_id, attending_physician_name,
        primary_diagnosis, icd10, secondary_diagnoses, risk_level, mews_score, resuscitation_status,
        allergies, vitals, current_vitals, medications, labs, doctor_notes, timeline, status
      ) VALUES (
        'pt-rec-test-1001', 'PT-1001', 'hosp-chn-01', 'Priya Sharma', 32, 'Female', 'O+', '2026-11-01',
        'Emergency', 'ICU', 'ICU-01', 'doc_sundar_01', 'Dr. Sundaramoorthy M.',
        'Acute Respiratory Distress', 'J80', '[]', 'Critical', 5, 'Full Code',
        '[]', '[]', '{"heartRate": 115, "bp": "138/88"}', '[]', '[]', 'Stable on oxygen', '[]', 'admitted'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_id, attending_physician_name,
        primary_diagnosis, icd10, secondary_diagnoses, risk_level, mews_score, resuscitation_status,
        allergies, vitals, current_vitals, medications, labs, doctor_notes, timeline, status
      ) VALUES (
        'pt-rec-test-1002', 'PT-1002', 'hosp-chn-01', 'Ravi Kumar', 45, 'Male', 'B+', '2026-11-02',
        'Internal Medicine', 'General Ward', 'GEN-04', 'doc_sundar_01', 'Dr. Sundaramoorthy M.',
        'Type 2 Diabetes Flare', 'E11.9', '[]', 'Moderate', 2, 'Full Code',
        '[]', '[]', '{"heartRate": 82, "bp": "124/80"}', '[]', '[]', 'Oral metformin ongoing', '[]', 'admitted'
      )
    `).run();

    adminTokenHosp1 = generateToken({
      id: 'usr_admin_chn_01',
      name: 'Dr. K. Rathnavel, Medical Superintendent',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });
    adminTokenHosp2 = generateToken({
      id: 'usr_admin_cbe_02',
      name: 'Dr. Coimbatore Admin',
      role: 'admin',
      hospitalId: 'hosp-cbe-02'
    });
    doctorTokenHosp1 = generateToken({
      id: 'doc_sundar_01',
      name: 'Dr. Sundaramoorthy M., Clinical Director',
      role: 'doctor',
      hospitalId: 'hosp-chn-01'
    });
    nurseTokenHosp1 = generateToken({
      id: 'nurse_deepa_01',
      name: 'Nurse Deepa R., Charge Nurse',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });
    patientToken1 = generateToken({
      id: 'PT-1001',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });
    patientToken2 = generateToken({
      id: 'PT-1002',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });
  });

  // =========================================================================
  // WORKFLOW 1: AUTHENTICATION, TOKENS & PRODUCTION GATEKEEPING
  // =========================================================================
  describe('Workflow 1: Authentication & Production Gatekeeping', () => {
    test('1.1 Rejects unauthenticated API calls to protected routes with HTTP 401', async () => {
      const res = await apiRequest(baseUrl, '/api/patients/PT-1001');
      assert.strictEqual(res.status, 401);
      assert.ok(res.data.error.includes('Authentication') || res.data.error.includes('token'));
    });

    test('1.2 Rejects forged or malformed JWT token with HTTP 403', async () => {
      const res = await apiRequest(baseUrl, '/api/patients/PT-1001', {
        headers: { Authorization: 'Bearer invalid.tampered.token' }
      });
      assert.strictEqual(res.status, 403);
    });

    test('1.3 Rejects expired JWT token with HTTP 403', async () => {
      const expiredToken = generateToken({ exp: Math.floor(Date.now() / 1000) - 100 });
      const res = await apiRequest(baseUrl, '/api/patients/PT-1001', {
        token: expiredToken
      });
      assert.strictEqual(res.status, 403);
    });

    test('1.4 In production mode (NODE_ENV=production), rejects X-Demo-Role auth bypass attempt', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await apiRequest(baseUrl, '/api/patients/PT-1001', {
          headers: { 'X-Demo-Role': 'admin', 'X-Demo-Hospital': 'hosp-chn-01' }
        });
        // Must reject unauthenticated request in production mode!
        assert.strictEqual(res.status, 401, 'Production mode must strictly prohibit demo header authentication bypass');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // =========================================================================
  // WORKFLOW 2: ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE BOUNDARIES
  // =========================================================================
  describe('Workflow 2: Role-Based Access Control & Privilege Boundaries', () => {
    test('2.1 Blocks Nurse from verifying staff credentials (requires Admin)', async () => {
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: { userId: 'usr_test_1', decision: 'approved' }
      });
      assert.strictEqual(res.status, 403);
    });

    test('2.2 Blocks Doctor from configuring hospital system rules (requires Admin)', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/rules', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          name: 'Doctor Custom Rule',
          category: 'Surge',
          triggerEvent: 'BED_CAPACITY_EXCEEDED'
        }
      });
      assert.strictEqual(res.status, 403);
    });

    test('2.3 Blocks Patient from approving workflow execution gates', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/executions/exec-01/approve', {
        method: 'POST',
        token: patientToken1,
        body: { comments: 'Patient approving workflow' }
      });
      assert.strictEqual(res.status, 403);
    });

    test('2.4 Prevents unauthorized role escalation via profile update', async () => {
      const res = await apiRequest(baseUrl, '/api/users/profile', {
        method: 'PUT',
        token: doctorTokenHosp1,
        body: {
          name: 'Dr. Sundaramoorthy M.',
          username: 'drsundar_test_' + Date.now(),
          role: 'admin' // Attempted role escalation payload
        }
      });
      assert.strictEqual(res.status, 200);

      // Verify in DB that role was NOT escalated to admin
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get('doc_sundar_01');
      if (user) {
        assert.notStrictEqual(user.role, 'admin', 'User role must not be modified by user profile updates');
      }
    });
  });

  // =========================================================================
  // WORKFLOW 3: DATA PRIVACY & MULTI-TENANT HOSPITAL ISOLATION
  // =========================================================================
  describe('Workflow 3: Patient Privacy & Multi-Tenant Hospital Isolation', () => {
    test('3.1 Patient cannot access another patient clinical record (Privacy Boundary)', async () => {
      // Patient 1 (Priya Sharma, PT-1001) attempts to query Patient 2 (PT-1002)
      const res = await apiRequest(baseUrl, '/api/patients/PT-1002', {
        token: patientToken1
      });
      assert.strictEqual(res.status, 403);
      assert.ok(res.data.error.includes('Access denied') || res.data.error.includes('Patients may only access their own'));
    });

    test('3.2 Patient queries their own clinical record successfully (Self-Service Access)', async () => {
      const res = await apiRequest(baseUrl, '/api/patients/PT-1001', {
        token: patientToken1
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.patientId, 'PT-1001');
    });

    test('3.3 Staff from Hospital 2 cannot access patient records from Hospital 1 (Multi-Tenancy)', async () => {
      // Admin from hosp-cbe-02 attempts to fetch patient from hosp-chn-01
      const res = await apiRequest(baseUrl, '/api/patients/PT-1001', {
        token: adminTokenHosp2
      });
      assert.strictEqual(res.status, 403);
      assert.ok(res.data.error.includes('another hospital') || res.data.error.includes('Access denied'));
    });
  });

  // =========================================================================
  // WORKFLOW 4: CLINICAL SAFETY & HUMAN-IN-THE-LOOP SAFEGUARDS
  // =========================================================================
  describe('Workflow 4: Clinical Safety & Autonomous Decision Prohibitions', () => {
    test('4.1 Rejects creation of fully automated prescribing or autonomous discharge rules', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/rules', {
        method: 'POST',
        token: adminTokenHosp1,
        body: {
          name: 'Auto-Prescribe Narcotics Rule',
          category: 'Pharmacy',
          triggerEvent: 'PAIN_REPORTED',
          actionDescription: 'System will auto-prescribe morphine without doctor sign-off'
        }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('Clinical safety violation'));
    });

    test('4.2 Rejects emergency resource allocation without clinician role', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents/inc-test-dummy/allocate-resources', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: { bedId: 'bed-01' }
      });
      assert.strictEqual(res.status, 403);
    });
  });

  // =========================================================================
  // WORKFLOW 5: DATABASE SECURITY, INJECTION IMMUNITY & CONFIGURATION
  // =========================================================================
  describe('Workflow 5: Database Security & Configuration Verification', () => {
    test('5.1 Prepared statements prevent SQL injection in hospital lookup', async () => {
      const maliciousPayload = "hosp-chn-01' OR '1'='1";
      const res = await apiRequest(baseUrl, `/api/hospitals/${encodeURIComponent(maliciousPayload)}`);
      assert.strictEqual(res.status, 404);
    });

    test('5.2 .env.example exists and contains placeholders only (no raw secrets)', () => {
      assert.ok(fs.existsSync('.env.example'), '.env.example file must exist');
      const exampleContent = fs.readFileSync('.env.example', 'utf8');
      assert.ok(exampleContent.includes('your_jwt_secret'), 'Must contain placeholder for JWT_SECRET');
      assert.ok(!exampleContent.includes('medisync_enterprise_jwt_secret_2026_super_secure'), 'Must NOT contain live secret key');
    });

    test('5.3 .gitignore excludes .env files and SQLite journals', () => {
      assert.ok(fs.existsSync('.gitignore'), '.gitignore file must exist');
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      assert.ok(gitignore.includes('.env'), '.gitignore must exclude .env');
      assert.ok(gitignore.includes('*.db-shm') || gitignore.includes('.db-shm'), '.gitignore must exclude db-shm');
      assert.ok(gitignore.includes('*.db-wal') || gitignore.includes('.db-wal'), '.gitignore must exclude db-wal');
    });
  });
});
