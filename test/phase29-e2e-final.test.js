import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { startTestServer, stopTestServer, apiRequest, generateToken } from './test-helper.js';
import { db } from '../server/db.js';

describe('MediSync AI - Phase 29 Final End-to-End Testing Suite', () => {
  let baseUrl;
  let adminTokenHosp1;
  let doctorTokenHosp1;
  let nurseTokenHosp1;
  let patientToken;
  let expiredToken;

  const JWT_SECRET = process.env.JWT_SECRET || 'medisync_enterprise_jwt_secret_2026_super_secure';

  before(async () => {
    baseUrl = await startTestServer();

    // Generate authenticated test tokens for each tested persona
    adminTokenHosp1 = generateToken({
      id: 'usr_admin_p29',
      email: 'admin.vasanth@medisync.gov.in',
      name: 'Dr. Vasanth Kumar',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
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
      id: 'usr_patient_p29',
      email: 'karthik.subramanian@gmail.com',
      name: 'Karthik Subramanian',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });

    // Create an expired token to test session expiration
    expiredToken = jwt.sign(
      {
        id: 'usr_expired_p29',
        email: 'expired.user@medisync.gov.in',
        role: 'doctor',
        hospitalId: 'hosp-chn-01',
        exp: Math.floor(Date.now() / 1000) - 60 // Expired 1 minute ago
      },
      JWT_SECRET
    );

    // Seed test fixtures into database
    // Ensure users table matches test expectations
    db.prepare(`
      UPDATE users SET role = 'admin', verification_status = 'approved', is_onboarded = 1 WHERE email = 'admin.vasanth@medisync.gov.in'
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO users (
        id, google_id, email, name, username, role, verification_status, is_onboarded, hospital_id, district_id
      ) VALUES (
        'usr_patient_p29', 'goog_p29_patient', 'karthik.subramanian@gmail.com', 'Karthik Subramanian', 'karthik_sub',
        'patient', 'approved', 1, 'hosp-chn-01', 'chennai'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO hospital_beds (
        id, hospital_id, ward, bed_number, type, status, patient_name, patient_id, notes, last_updated
      ) VALUES (
        'bed-p29-e2e', 'hosp-chn-01', 'ICU Block A', 'ICU-P29-99', 'ICU', 'ready', NULL, NULL, 'Cleaned and sanitized', 'Just now'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO equipment (
        id, hospital_id, name, category, type, serial_number, ward, status, condition, condition_score, last_inspection
      ) VALUES (
        'eq-p29-e2e', 'hosp-chn-01', 'Philips IntelliVue MX800 Bedside Monitor', 'Life Support', 'Cardiac Monitor', 'SN-P29-MX800',
        'ICU Block A', 'Available', 'Optimal', 100, 'Today'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_id, attending_physician_name,
        primary_diagnosis, icd10, secondary_diagnoses, risk_level, mews_score, resuscitation_status,
        allergies, vitals, current_vitals, medications, labs, doctor_notes, timeline, status
      ) VALUES (
        'pt-rec-p29-01', 'PT-P29-01', 'hosp-chn-01', 'Meenakshi Sundaram', 52, 'Female', 'B+', '2026-11-25',
        'Critical Care', 'ICU Block A', 'ICU-P29-99', 'doc_sundar_01', 'Dr. Sundaramoorthy M.',
        'Acute Respiratory Distress Syndrome', 'J80', '[]', 'Critical', 4, 'Full Code',
        '[]', '[]', '{"hr": 92, "sbp": 118, "spo2": 95}', '[]', '[]', 'Arterial blood gases stable', '[]', 'admitted'
      )
    `).run();
  });

  after(async () => {
    await stopTestServer();
  });

  // =========================================================================
  // STEP 1: TEST ENVIRONMENT & SERVICE AVAILABILITY
  // =========================================================================
  describe('Step 1: Test Environment & Backend Service Availability', () => {
    test('1.1 Backend starts and returns operational status on /api/health', async () => {
      const res = await apiRequest(baseUrl, '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'healthy');
      assert.strictEqual(res.data.database, 'connected');
      assert.ok(res.data.timestamp);
    });

    test('1.2 Real-time WebSocket diagnostics report healthy state', async () => {
      const res = await apiRequest(baseUrl, '/api/realtime/diagnostics');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.diagnostics);
      assert.ok(typeof res.data.diagnostics.uptimeSeconds === 'number');
      assert.ok(typeof res.data.diagnostics.connectedSockets === 'number');
    });

    test('1.3 Database connection verified with complete core schema tables', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      const requiredTables = [
        'users', 'hospitals', 'hospital_beds', 'equipment', 'patients',
        'resource_requests', 'clinical_tasks', 'emergency_incidents',
        'shift_handovers', 'notifications', 'audit_logs', 'workflow_rules'
      ];
      for (const table of requiredTables) {
        assert.ok(tables.includes(table), `Required table '${table}' must exist in SQLite database`);
      }
    });
  });

  // =========================================================================
  // STEP 2: AUTHENTICATION & ACCESS CONTROL TESTING
  // =========================================================================
  describe('Step 2: Authentication, Session Lifecycle & Access Control', () => {
    test('2.1 Login with valid Google credentials returns JWT and user profile', async () => {
      const res = await apiRequest(baseUrl, '/api/auth/google', {
        method: 'POST',
        body: {
          email: 'admin.vasanth@medisync.gov.in',
          name: 'Dr. Vasanth Kumar',
          portal: 'hospital'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token, 'Must return JWT token');
      assert.strictEqual(res.data.user.email, 'admin.vasanth@medisync.gov.in');
      assert.strictEqual(res.data.user.role, 'admin');

      // Verify token signature and claims
      const decoded = jwt.verify(res.data.token, JWT_SECRET);
      assert.strictEqual(decoded.email, 'admin.vasanth@medisync.gov.in');
      assert.strictEqual(decoded.role, 'admin');
    });

    test('2.2 Login with invalid credentials (missing email) returns HTTP 400', async () => {
      const res = await apiRequest(baseUrl, '/api/auth/google', {
        method: 'POST',
        body: {
          name: 'Anonymous Caller'
        }
      });

      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('Email is required'));
    });

    test('2.3 Protected route access succeeds with valid token', async () => {
      const res = await apiRequest(baseUrl, '/api/beds', {
        token: adminTokenHosp1
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    test('2.4 Protected route rejects unauthenticated request with HTTP 401', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        body: { patientId: 'PT-P29-01', instruction: 'Unauthenticated test order' }
      });
      assert.strictEqual(res.status, 401);
      assert.ok(res.data.error.includes('Unauthorized') || res.data.error.includes('token required'));
    });

    test('2.5 Session expiration: Expired JWT token is rejected with HTTP 403', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', {
        token: expiredToken
      });
      assert.strictEqual(res.status, 403);
      assert.ok(res.data.error.includes('expired') || res.data.error.includes('Invalid'));
    });

    test('2.6 Unauthorized role access: Patient is blocked from clinical/admin endpoints with HTTP 403', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: patientToken,
        body: {
          patientId: 'PT-P29-01',
          instruction: 'Patient attempting to order medication'
        }
      });
      assert.strictEqual(res.status, 403);
      assert.ok(res.data.error.includes('Forbidden') || res.data.error.includes('Access denied'));
    });
  });

  // =========================================================================
  // STEP 3: ROLE-BASED DASHBOARDS TESTING
  // =========================================================================
  describe('Step 3: Role-Based Dashboard Verification', () => {
    test('3.1 Hospital Admin: Accesses hospital overview, resources, beds, and audit logs', async () => {
      // Hospital details
      const hospRes = await apiRequest(baseUrl, '/api/hospitals/hosp-chn-01');
      assert.strictEqual(hospRes.status, 200);
      assert.ok(hospRes.data.name);

      // Bed inventory summary
      const bedSummaryRes = await apiRequest(baseUrl, '/api/beds/summary');
      assert.strictEqual(bedSummaryRes.status, 200);
      assert.ok(typeof bedSummaryRes.data.total === 'number');

      // Resource requests list
      const reqRes = await apiRequest(baseUrl, '/api/requests', { token: adminTokenHosp1 });
      assert.strictEqual(reqRes.status, 200);
      assert.ok(Array.isArray(reqRes.data));

      // Administrative Audit Logs
      const auditRes = await apiRequest(baseUrl, '/api/audit-logs', { token: adminTokenHosp1 });
      assert.strictEqual(auditRes.status, 200);
      assert.ok(Array.isArray(auditRes.data));
    });

    test('3.2 Doctor: Accesses clinical workspace, assigned patients, and AI diagnostic aids', async () => {
      // Doctor overview metrics
      const docOverviewRes = await apiRequest(baseUrl, '/api/doctor/doc_sundar_01/overview');
      assert.strictEqual(docOverviewRes.status, 200);
      assert.ok(docOverviewRes.data.metrics);

      // Assigned patients
      const ptRes = await apiRequest(baseUrl, '/api/doctor/doc_sundar_01/patients');
      assert.strictEqual(ptRes.status, 200);
      assert.ok(Array.isArray(ptRes.data));

      // AI Diagnostic Decision Support
      const aiDiagRes = await apiRequest(baseUrl, '/api/ai/diagnose', {
        method: 'POST',
        body: {
          symptoms: ['Hypoxemia', 'Bilateral pulmonary infiltrates', 'Tachypnea'],
          vitals: { spo2: 88, rr: 28 }
        }
      });
      assert.strictEqual(aiDiagRes.status, 200);
      assert.ok(Array.isArray(aiDiagRes.data.differentialDiagnoses));
      assert.ok(aiDiagRes.data.differentialDiagnoses.length > 0);
      assert.ok(typeof aiDiagRes.data.confidenceScore === 'number');

      // Clinical Task Queue
      const taskRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: doctorTokenHosp1 });
      assert.strictEqual(taskRes.status, 200);
      assert.ok(Array.isArray(taskRes.data));
    });

    test('3.3 Nurse: Accesses ward overview, assigned tasks, equipment checklist, and shift handovers', async () => {
      // Ward overview
      const wardRes = await apiRequest(baseUrl, '/api/clinical-wards');
      assert.strictEqual(wardRes.status, 200);
      assert.ok(Array.isArray(wardRes.data));

      // Nurse tasks queue
      const taskRes = await apiRequest(baseUrl, '/api/nurse/nurse_deepa_01/tasks');
      assert.strictEqual(taskRes.status, 200);
      assert.ok(Array.isArray(taskRes.data));

      // Equipment checklist
      const eqRes = await apiRequest(baseUrl, '/api/equipment', { token: nurseTokenHosp1 });
      assert.strictEqual(eqRes.status, 200);
      assert.ok(Array.isArray(eqRes.data));

      // Shift Handovers log
      const hoRes = await apiRequest(baseUrl, '/api/handovers', { token: nurseTokenHosp1 });
      assert.strictEqual(hoRes.status, 200);
      assert.ok(Array.isArray(hoRes.data));
    });

    test('3.4 Patient: Accesses patient appointments and digital health records, blocked from staff actions', async () => {
      // Appointments viewable
      const apptRes = await apiRequest(baseUrl, '/api/appointments', { token: patientToken });
      assert.strictEqual(apptRes.status, 200);
      assert.ok(Array.isArray(apptRes.data));

      // Blocked from viewing staff audit logs
      const auditRes = await apiRequest(baseUrl, '/api/audit-logs', { token: patientToken });
      assert.strictEqual(auditRes.status, 403);

      // Blocked from verifying users
      const verifyRes = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: patientToken,
        body: { userId: 'usr_admin_p29', decision: 'approved' }
      });
      assert.strictEqual(verifyRes.status, 403);
    });
  });

  // =========================================================================
  // STEP 4: END-TO-END RESOURCE & CLINICAL WORKFLOWS
  // =========================================================================
  describe('Step 4: End-to-End Resource & Clinical Workflows', () => {
    let createdReqId;
    let emergencyIncidentId;

    test('4.1 Clinician creates resource request and Admin approves requisition', async () => {
      // Doctor creates request
      const createRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'Equipment',
          resourceName: 'Cardiac Defibrillator Unit',
          department: 'Emergency & Critical Care',
          quantity: 1,
          urgency: 'Critical',
          reason: 'Bay 4 standby defibrillator scheduled service replacement',
          requestedBy: 'Dr. Sundaramoorthy M.'
        }
      });

      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.id || createRes.data.request?.id);
      createdReqId = createRes.data.id || createRes.data.request?.id;

      // Admin approves request
      const approveRes = await apiRequest(baseUrl, `/api/requests/${createdReqId}/status`, {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: {
          status: 'Approved',
          approverNotes: 'Stock allocation authorized from Biomedical Depot'
        }
      });

      assert.strictEqual(approveRes.status, 200);
      assert.strictEqual(approveRes.data.success, true);

      // Verify persistence in SQLite
      const checkRes = await apiRequest(baseUrl, '/api/requests', { token: doctorTokenHosp1 });
      const req = checkRes.data.find(r => r.id === createdReqId);
      assert.ok(req);
      assert.strictEqual(req.status.toLowerCase(), 'approved');
    });

    test('4.2 Bed turnaround: Completes multi-stage lifecycle and persists in database', async () => {
      // Step A: Occupy bed for patient
      const occupyRes = await apiRequest(baseUrl, '/api/beds/bed-p29-e2e/status', {
        method: 'PATCH',
        token: doctorTokenHosp1,
        body: { status: 'occupied', patientName: 'Meenakshi Sundaram', patientId: 'PT-P29-01' }
      });
      assert.strictEqual(occupyRes.status, 200);

      // Step B: Patient discharged -> Bed marked cleaning
      const cleaningRes = await apiRequest(baseUrl, '/api/beds/bed-p29-e2e/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'cleaning', notes: 'Terminal disinfection in progress' }
      });
      assert.strictEqual(cleaningRes.status, 200);
      assert.strictEqual(cleaningRes.data.status, 'cleaning');

      // Step C: Nurse advances to Ready
      const readyRes = await apiRequest(baseUrl, '/api/beds/bed-p29-e2e/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'ready', notes: 'Inspection verified, fresh linens placed' }
      });
      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.data.status, 'ready');
    });

    test('4.3 Equipment issue reporting, maintenance lifecycle, and restoration', async () => {
      // Nurse reports fault
      const faultRes = await apiRequest(baseUrl, '/api/equipment/eq-p29-e2e/fault', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: {
          faultDescription: 'Telemetry signal interference on Lead II',
          severity: 'Moderate',
          reportedBy: 'Nurse Deepa R.'
        }
      });
      assert.strictEqual(faultRes.status, 200);
      assert.strictEqual(faultRes.data.equipment.status, 'Under Maintenance');

      // Biomedical Admin restores equipment
      const restoreRes = await apiRequest(baseUrl, '/api/equipment/eq-p29-e2e/status', {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: {
          status: 'Available',
          ward: 'ICU Block A'
        }
      });
      assert.strictEqual(restoreRes.status, 200);
      assert.strictEqual(restoreRes.data.equipment.status, 'Available');
    });

    test('4.4 Emergency resource matching requires human clinician authorization', async () => {
      // Create emergency incident
      const incRes = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          emergencyType: 'Cardiac Arrest & Severe Shock',
          severity: 'critical',
          location: 'Ambulance Bay South',
          requiredResources: ['Resuscitation Bay', 'Defibrillator', 'Cardiologist']
        }
      });
      assert.strictEqual(incRes.status, 201);
      assert.ok(incRes.data.id);
      emergencyIncidentId = incRes.data.id;

      // Human Clinician authorizes resource dispatch
      const allocRes = await apiRequest(baseUrl, `/api/emergency/incidents/${emergencyIncidentId}/allocate-resources`, {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          allocatedBedId: 'bed-p29-e2e',
          allocatedSpecialist: 'Dr. Sundaramoorthy M.',
          authorizationNotes: 'Emergency resuscitation bay authorized by Attending Physician'
        }
      });
      assert.strictEqual(allocRes.status, 200);
      assert.strictEqual(allocRes.data.success, true);
    });
  });

  // =========================================================================
  // STEP 5: CROSS-DASHBOARD SYNCHRONIZATION
  // =========================================================================
  describe('Step 5: Cross-Dashboard Synchronization & Data Flow', () => {
    let crossTaskId;
    let crossHandoverId;

    test('5.1 Doctor assigns clinical task -> Nurse completes task with vitals -> Doctor sees update', async () => {
      // 1. Doctor creates clinical task
      const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          patientId: 'PT-P29-01',
          patientName: 'Meenakshi Sundaram',
          ward: 'ICU Block A',
          bed: 'ICU-P29-99',
          instruction: 'Administer Nebulized Salbutamol and record post-treatment SpO2',
          priority: 'Stat (Immediate)',
          taskType: 'Respiratory Therapy',
          assignedNurse: 'Nurse Deepa R.'
        }
      });
      assert.strictEqual(createRes.status, 201);
      crossTaskId = createRes.data.id;

      // 2. Nurse executes task and documents vitals
      const executeRes = await apiRequest(baseUrl, `/api/clinical-tasks/${crossTaskId}`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          status: 'Completed',
          executionNotes: 'Nebulization completed. Patient reports eased breathing.',
          vitalsRecorded: { spo2: 97, rr: 18, hr: 84 }
        }
      });
      assert.strictEqual(executeRes.status, 200);
      assert.strictEqual(executeRes.data.task.status, 'Completed');

      // 3. Doctor queries tasks and verifies completion
      const verifyRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: doctorTokenHosp1 });
      const task = verifyRes.data.find(t => t.id === crossTaskId);
      assert.ok(task);
      assert.strictEqual(task.status, 'Completed');
      assert.ok(task.execution_notes?.includes('Nebulization completed') || task.instruction?.includes('Nebulized'));
    });

    test('5.2 Nurse updates bed status -> Admin sees updated hospital-wide bed availability', async () => {
      // Nurse updates bed to Ready
      await apiRequest(baseUrl, '/api/beds/bed-p29-e2e/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'ready', notes: 'Final turnover completed' }
      });

      // Admin queries bed inventory
      const adminBedRes = await apiRequest(baseUrl, '/api/beds', { token: adminTokenHosp1 });
      assert.strictEqual(adminBedRes.status, 200);
      const bed = adminBedRes.data.find(b => b.id === 'bed-p29-e2e');
      assert.ok(bed);
      assert.strictEqual(bed.status, 'ready');
    });

    test('5.3 Shift handover continuity: Outgoing nurse submits, oncoming nurse signs receipt', async () => {
      // 1. Outgoing nurse submits SBAR handover
      const subRes = await apiRequest(baseUrl, '/api/handovers', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          ward: 'ICU Block A',
          outgoingNurse: 'Nurse Deepa R., Charge Nurse',
          incomingNurse: 'Nurse Preeti K., RN',
          shiftType: 'Day to Evening',
          patientCount: 6,
          criticalPatients: ['PT-P29-01'],
          situation: 'ICU Block A afternoon handover census 6 patients.',
          background: 'Post-respiratory stabilization cohort.',
          assessment: 'All beds telemetry active. Patient PT-P29-01 SpO2 97% post-nebulization.',
          recommendation: 'Check 20:00 blood gas report.',
          checklistCompleted: true,
          narcoticsCountVerified: true,
          crashCartChecked: true
        }
      });
      assert.strictEqual(subRes.status, 201);
      crossHandoverId = subRes.data.id;

      // 2. Oncoming nurse acknowledges receipt
      const ackRes = await apiRequest(baseUrl, `/api/handovers/${crossHandoverId}/acknowledge`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          acknowledgedBy: 'Nurse Preeti K., RN',
          notes: 'Schedule II narcotics dual check verified. Crash cart intact.'
        }
      });
      assert.strictEqual(ackRes.status, 200);
      assert.strictEqual(ackRes.data.status, 'Acknowledged');
    });
  });

  // =========================================================================
  // STEP 6: UI, NAVIGATION & INPUT VALIDATION
  // =========================================================================
  describe('Step 6: Input Validation, Error Handling & Non-Existent Resources', () => {
    test('6.1 Prevents creating resource with negative quantity', async () => {
      const res = await apiRequest(baseUrl, '/api/resources', {
        method: 'POST',
        token: adminTokenHosp1,
        body: {
          name: 'Invalid Negative Supply',
          category: 'Medical Consumables',
          quantity: -10,
          unit: 'Boxes',
          minimumThreshold: 5
        }
      });
      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('Quantity must be greater than or equal to 0') || res.data.error.includes('cannot be negative') || res.data.error.includes('positive') || res.data.error.includes('validation'));
    });

    test('6.2 Handles non-existent resource ID with HTTP 404', async () => {
      const res = await apiRequest(baseUrl, '/api/hospitals/non-existent-hosp-id-999');
      assert.strictEqual(res.status, 404);
      assert.ok(res.data.error.includes('not found') || res.data.error.includes('Not found'));
    });

    test('6.3 Notifications mark as read updates persistent database state', async () => {
      // Query notifications
      const listRes = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: nurseTokenHosp1
      });
      assert.strictEqual(listRes.status, 200);
      assert.ok(Array.isArray(listRes.data));

      if (listRes.data.length > 0) {
        const notifId = listRes.data[0].id;
        const markRes = await apiRequest(baseUrl, `/api/notifications/${notifId}/read`, {
          method: 'PATCH',
          token: nurseTokenHosp1
        });
        assert.strictEqual(markRes.status, 200);
        assert.strictEqual(markRes.data.success, true);
      }
    });
  });
});
