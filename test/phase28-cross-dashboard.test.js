import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';
import { db } from '../server/db.js';

describe('MediSync AI - Phase 28 Final Cross-Dashboard Integration Suite', () => {
  let baseUrl;
  let adminTokenHosp1;
  let adminTokenHosp2;
  let doctorTokenHosp1;
  let nurseTokenHosp1;
  let patientTokenHosp1;

  before(async () => {
    baseUrl = await startTestServer();

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

    patientTokenHosp1 = generateToken({
      id: 'PT-8941',
      name: 'Priya Sharma',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });

    // Ensure baseline patient & bed exist for reproducible testing
    db.prepare(`
      INSERT OR IGNORE INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_id, attending_physician_name,
        primary_diagnosis, icd10, secondary_diagnoses, risk_level, mews_score, resuscitation_status,
        allergies, vitals, current_vitals, medications, labs, doctor_notes, timeline, status
      ) VALUES (
        'pt-rec-p28-01', 'PT-P28-01', 'hosp-chn-01', 'Anand Kumar', 48, 'Male', 'O+', '2026-11-20',
        'Cardiology', 'ICU Block A', 'ICU-P28-01', 'doc_sundar_01', 'Dr. Sundaramoorthy M.',
        'Acute Coronary Syndrome', 'I20.0', '[]', 'Moderate', 2, 'Full Code',
        '[]', '[]', '{"hr": 78, "sbp": 124}', '[]', '[]', 'Cardiac telemetry ongoing', '[]', 'admitted'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO hospital_beds (
        id, hospital_id, ward, bed_number, type, status, patient_name, patient_id, notes, last_updated
      ) VALUES (
        'bed-p28-01', 'hosp-chn-01', 'ICU Block A', 'ICU-P28-01', 'ICU', 'ready', NULL, NULL, 'Cleaned and ready', 'Just now'
      )
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO equipment (
        id, hospital_id, name, type, serial_number, ward, status, condition, condition_score, last_inspection
      ) VALUES (
        'eq-p28-01', 'hosp-chn-01', 'Hamilton C6 Mechanical Ventilator', 'Ventilator', 'SN-P28-VENT-01',
        'ICU Block A', 'Available', 'Excellent', 98, 'Today'
      )
    `).run();
  });

  after(async () => {
    await stopTestServer();
  });

  // =========================================================================
  // WORKFLOW A: DOCTOR AND NURSE COORDINATION
  // =========================================================================
  describe('Workflow A: Doctor and Nurse Coordination', () => {
    let taskId;

    test('A.1 Doctor assigns clinical directive to nursing team', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          patientId: 'PT-P28-01',
          patientName: 'Anand Kumar',
          ward: 'ICU Block A',
          bed: 'ICU-P28-01',
          instruction: 'Administer IV Metoprolol 5mg and monitor continuous ECG rhythm',
          priority: 'Stat (Immediate)',
          taskType: 'Medication Administration',
          assignedNurse: 'Nurse Deepa R.'
        }
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.data.id);
      taskId = res.data.id;
    });

    test('A.2 Nurse retrieves assigned clinical task from queue', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        token: nurseTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const task = res.data.find(t => t.id === taskId);
      assert.ok(task, 'Task must appear in nurse worklist');
      assert.strictEqual(task.status, 'Pending');
    });

    test('A.3 Nurse executes order, documents bedside telemetry, and marks completed', async () => {
      const res = await apiRequest(baseUrl, `/api/clinical-tasks/${taskId}/status`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          status: 'Completed',
          executionNotes: 'Metoprolol 5mg infused over 5 mins. Sinus rhythm maintained, HR 68 bpm.',
          vitalsRecorded: {
            hr: 68,
            sbp: 118,
            dbp: 76,
            spo2: 98,
            rr: 16,
            temp: 36.8
          }
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    test('A.4 Doctor verifies task is updated to Completed with nurse observation', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        token: doctorTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      const task = res.data.find(t => t.id === taskId);
      assert.ok(task);
      assert.strictEqual(task.status, 'Completed');
      assert.ok(task.executionNotes?.includes('Metoprolol') || task.execution_notes?.includes('Metoprolol'));
    });
  });

  // =========================================================================
  // WORKFLOW B: BED TURNAROUND LIFECYCLE & MULTI-ROLE SYNCHRONIZATION
  // =========================================================================
  describe('Workflow B: Bed Turnaround (6-Stage)', () => {
    test('B.1 Bed transitions from Occupied to Discharged, then into Cleaning', async () => {
      // 1. Mark bed occupied
      await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: doctorTokenHosp1,
        body: { status: 'occupied', patientName: 'Anand Kumar', patientId: 'PT-P28-01' }
      });

      // 2. Patient discharged -> moves to cleaning
      const res = await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'cleaning', notes: 'Patient discharged; terminal sanitization started' }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.bed.status, 'cleaning');
    });

    test('B.2 Non-clinician/patient is blocked from marking cleaning bed as ready', async () => {
      const res = await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: patientTokenHosp1,
        body: { status: 'ready' }
      });

      // Must be blocked with 403 Forbidden
      assert.strictEqual(res.status, 403);
    });

    test('B.3 Nurse advances bed through equipment check and confirmation to Ready', async () => {
      // Advance to equipment_check
      await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'equipment_check', notes: 'Ventilator and telemetry monitor check' }
      });

      // Advance to nurse_confirmation
      await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'nurse_confirmation', notes: 'Primary nurse visual inspection sign-off' }
      });

      // Sign off Ready
      const readyRes = await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'ready', notes: 'Bed sanitized, calibrated, and ready for admission' }
      });

      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.data.bed.status, 'ready');
    });

    test('B.4 Hospital Admin queries bed inventory and verifies updated ready status', async () => {
      const res = await apiRequest(baseUrl, '/api/beds', {
        token: adminTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      const bed = res.data.find(b => b.id === 'bed-p28-01');
      assert.ok(bed);
      assert.strictEqual(bed.status, 'ready');
    });

    test('B.5 Conflict Prevention: Blocks duplicate booking on an occupied bed with HTTP 409', async () => {
      // Temporarily occupy bed
      await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: { status: 'occupied', patientName: 'Original Patient', patientId: 'PT-ORIGINAL' }
      });

      // Attempt second allocation for different patient
      const conflictRes = await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: { status: 'occupied', patientName: 'Conflict Patient', patientId: 'PT-CONFLICT' }
      });

      assert.strictEqual(conflictRes.status, 409);
      assert.ok(conflictRes.data.error.includes('occupied') || conflictRes.data.error.includes('Occupied'));

      // Clean up bed back to ready
      await apiRequest(baseUrl, '/api/beds/bed-p28-01/status', {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: { status: 'ready' }
      });
    });
  });

  // =========================================================================
  // WORKFLOW C: EQUIPMENT ISSUE & REQUISITION LIFECYCLE
  // =========================================================================
  describe('Workflow C: Equipment Issue & Status Synchronization', () => {
    test('C.1 Nurse reports faulty equipment, flagging status Under Maintenance', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment/eq-p28-01/fault', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: {
          faultDescription: 'Expiratory valve leak detected during calibration cycle',
          severity: 'Emergency',
          reportedBy: 'Nurse Deepa R.'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.equipment.status, 'Under Maintenance');
    });

    test('C.2 Admin queries equipment registry and observes degraded status', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment', {
        token: adminTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      const eq = res.data.find(e => e.id === 'eq-p28-01');
      assert.ok(eq);
      assert.strictEqual(eq.status, 'Under Maintenance');
    });

    test('C.3 Biomedical Admin updates equipment status back to Available post-repair', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment/eq-p28-01/status', {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: {
          status: 'Available',
          ward: 'ICU Block A'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.equipment.status, 'Available');
    });

    test('C.4 Nurse retrieves updated equipment list and verifies device is Available', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment', {
        token: nurseTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      const eq = res.data.find(e => e.id === 'eq-p28-01');
      assert.ok(eq);
      assert.strictEqual(eq.status, 'Available');
    });
  });

  // =========================================================================
  // WORKFLOW D: EMERGENCY RESOURCE MATCHING & HUMAN AUTHORIZATION
  // =========================================================================
  describe('Workflow D: Emergency Resource Matching & Human Approval Gate', () => {
    let incidentId;

    test('D.1 Command Center records high-acuity mass-casualty or trauma incident', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: adminTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          patientName: 'Karthik Raja',
          emergencyType: 'High-Impact Trauma / Flail Chest',
          severity: 'critical',
          location: 'GST Road Inbound',
          requiredResources: ['ICU Resus Bay', 'High-Flow Ventilator', 'Trauma Team Lead']
        }
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.data.id);
      incidentId = res.data.id;
    });

    test('D.2 Requires clinician/admin authorization before allocating life-support resources', async () => {
      // Unauthenticated caller is blocked
      const unauthRes = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        body: { allocatedBedId: 'bed-p28-01' }
      });
      assert.strictEqual(unauthRes.status, 401);

      // Authorized clinician approves allocation
      const authRes = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          allocatedBedId: 'bed-p28-01',
          allocatedVentilatorId: 'eq-p28-01',
          allocatedSpecialist: 'Dr. Sundaramoorthy M.',
          bloodUnits: '2 Units O-',
          authorizationNotes: 'Emergency Medical Command human approval granted'
        }
      });

      assert.strictEqual(authRes.status, 200);
      assert.ok(authRes.data.success);

      // Verify bed is locked to occupied
      const bedRes = await apiRequest(baseUrl, '/api/beds', { token: nurseTokenHosp1 });
      const bed = bedRes.data.find(b => b.id === 'bed-p28-01');
      assert.strictEqual(bed.status, 'occupied');
    });
  });

  // =========================================================================
  // WORKFLOW E: RESOURCE REQUEST & APPROVAL LIFECYCLE
  // =========================================================================
  describe('Workflow E: Resource Request & Administrative Decision Lifecycle', () => {
    let reqId;

    test('E.1 Doctor submits urgent requisition for specialized medical supplies', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'Supplies',
          department: 'Emergency & Trauma',
          quantity: 5,
          priority: 'Urgent',
          urgency: 'Critical',
          reason: 'Emergency arterial catheter kits exhausted in bay',
          requestedBy: 'Dr. Sundaramoorthy M.'
        }
      });

      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.request?.id || res.data.id);
      reqId = res.data.request?.id || res.data.id;
    });

    test('E.2 Admin reviews pending requisition and approves it', async () => {
      const res = await apiRequest(baseUrl, `/api/requests/${reqId}/status`, {
        method: 'PATCH',
        token: adminTokenHosp1,
        body: {
          status: 'Approved',
          approverNotes: 'Requisition verified against central supply inventory and authorized for immediate issue.'
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    test('E.3 Nurse views resource request list and verifies status is Approved', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        token: nurseTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      const req = res.data.find(r => r.id === reqId);
      assert.ok(req);
      assert.strictEqual(req.status.toLowerCase(), 'approved');
    });
  });

  // =========================================================================
  // WORKFLOW F: SHIFT HANDOVER CONTINUITY
  // =========================================================================
  describe('Workflow F: Shift Handover Continuity & Receipt Sign-Off', () => {
    let handoverId;

    test('F.1 Outgoing nurse submits telemetric SBAR shift handover with safety protocols', async () => {
      const res = await apiRequest(baseUrl, '/api/handovers', {
        method: 'POST',
        token: nurseTokenHosp1,
        body: {
          hospitalId: 'hosp-chn-01',
          ward: 'ICU Block A',
          outgoingNurse: 'Nurse Deepa R., Charge Nurse',
          incomingNurse: 'Nurse Preeti K., RN',
          shiftType: 'Day to Evening (14:00 - 22:00)',
          patientCount: 6,
          criticalPatients: ['PT-P28-01'],
          situation: 'Shift transition for ICU Block A. Current census 6 patients.',
          background: 'Post-cardiac intervention and trauma recovery cohort.',
          assessment: 'All beds monitored on telemetry. 1 high-MEWS patient in bay 01.',
          recommendation: 'Repeat 18:00 electrolyte panel for bed 01.',
          checklistCompleted: true,
          narcoticsCountVerified: true,
          crashCartChecked: true
        }
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.data.id);
      handoverId = res.data.id;
    });

    test('F.2 Oncoming staff retrieves handover and executes receipt acknowledgment', async () => {
      // 1. Retrieve handovers
      const listRes = await apiRequest(baseUrl, '/api/handovers?ward=ICU+Block+A', {
        token: nurseTokenHosp1
      });
      assert.strictEqual(listRes.status, 200);
      const ho = listRes.data.find(h => h.id === handoverId);
      assert.ok(ho);

      // 2. Acknowledge receipt
      const ackRes = await apiRequest(baseUrl, `/api/handovers/${handoverId}/acknowledge`, {
        method: 'PATCH',
        token: nurseTokenHosp1,
        body: {
          acknowledgedBy: 'Nurse Preeti K., RN',
          notes: 'Schedule II narcotics dual-count verified. Crash cart checked intact.'
        }
      });

      assert.strictEqual(ackRes.status, 200);
      assert.strictEqual(ackRes.data.handover.status, 'Acknowledged');
    });
  });

  // =========================================================================
  // WORKFLOW G: CROSS-DASHBOARD NOTIFICATIONS & AUDIT TRAIL
  // =========================================================================
  describe('Workflow G: Notifications & Multi-Tenant Audit Security', () => {
    let notificationId;

    test('G.1 Important operational updates generate persistent notifications', async () => {
      const res = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: nurseTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0, 'Notifications must exist from clinical operations');
      notificationId = res.data[0].id;
    });

    test('G.2 User marks notification as read', async () => {
      const res = await apiRequest(baseUrl, `/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: nurseTokenHosp1
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
    });

    test('G.3 Multi-tenant separation: Hospital 2 Admin cannot access Hospital 1 notifications', async () => {
      const res = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: adminTokenHosp2
      });

      // Hospital 2 user querying Hospital 1 records must not receive Hospital 1 notifications
      // Endpoint scopes to hospitalId from token or returns scoped results
      assert.strictEqual(res.status, 200);
      const hosp1Notif = res.data.find(n => n.hospitalId === 'hosp-chn-01' || n.hospital_id === 'hosp-chn-01');
      assert.strictEqual(hosp1Notif, undefined, 'Hospital 2 user must not see Hospital 1 notifications');
    });

    test('G.4 Administrative Audit Trail: Admin can query logs, Non-Admin is blocked with 403', async () => {
      // Admin retrieval
      const adminRes = await apiRequest(baseUrl, '/api/audit-logs', {
        token: adminTokenHosp1
      });
      assert.strictEqual(adminRes.status, 200);
      assert.ok(Array.isArray(adminRes.data));

      // Nurse blocked from audit logs
      const nurseRes = await apiRequest(baseUrl, '/api/audit-logs', {
        token: nurseTokenHosp1
      });
      assert.strictEqual(nurseRes.status, 403);
    });
  });
});

