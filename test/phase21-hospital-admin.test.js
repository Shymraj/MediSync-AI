import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 21 Hospital Admin Dashboard Completion Suite', () => {
  let baseUrl;
  let adminToken;
  let doctorToken;
  let nurseToken;
  let patientToken;
  let externalAdminToken;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({
      id: 'usr_admin_chn_01',
      name: 'Dr. K. Rathnavel, Medical Superintendent & Hospital Admin',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });
    doctorToken = generateToken({
      id: 'doc_sundar_01',
      name: 'Dr. Sundaramoorthy M., Clinical Director',
      role: 'doctor',
      hospitalId: 'hosp-chn-01'
    });
    nurseToken = generateToken({
      id: 'nurse_deepa_01',
      name: 'Nurse Deepa R., Charge Nurse',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });
    patientToken = generateToken({
      id: 'pat_test_01',
      name: 'Aarav Patel',
      role: 'patient',
      hospitalId: 'hosp-chn-01'
    });
    externalAdminToken = generateToken({
      id: 'usr_admin_cbe_02',
      name: 'Admin CBE Hospital',
      role: 'admin',
      hospitalId: 'hosp-cbe-02'
    });
  });

  // =========================================================================
  // WORKFLOW 1: HOSPITAL OPERATIONS & CAPACITY TELEMETRY
  // =========================================================================
  describe('Workflow 1: Hospital Operations & Capacity Telemetry', () => {
    test('1.1 Fetch hospital profile and verify institutional data', async () => {
      const res = await apiRequest(baseUrl, '/api/hospitals?districtId=chennai', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const targetHospital = res.data.find(h => h.id === 'hosp-chn-01');
      assert.ok(targetHospital, 'Target hospital hosp-chn-01 must exist');
      assert.ok(targetHospital.name);
      assert.ok(targetHospital.total_beds >= 0);
    });

    test('1.2 Fetch comprehensive bed capacity summary for live census calculation', async () => {
      const res = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.total !== undefined || res.data.totalBeds !== undefined);
      assert.ok(res.data.available !== undefined || res.data.ready !== undefined);
      assert.ok(res.data.occupied !== undefined);
    });

    test('1.3 Fetch bed master status inventory across clinical wards', async () => {
      const res = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0);
      const bed = res.data[0];
      assert.ok(bed.bedNumber || bed.bed_number);
      assert.ok(bed.ward);
      assert.ok(bed.status);
    });

    test('1.4 Fetch complete hospital operational dashboard telemetry', async () => {
      const res = await apiRequest(baseUrl, '/api/hospitals/hosp-chn-01/dashboard', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.hospital);
      assert.strictEqual(res.data.hospital.id, 'hosp-chn-01');
      assert.ok(Array.isArray(res.data.beds));
      assert.ok(Array.isArray(res.data.equipment));
      assert.ok(res.data.stats);
      assert.ok(res.data.stats.totalBeds >= 0);
    });
  });

  // =========================================================================
  // WORKFLOW 2: RESOURCE MANAGEMENT, EQUIPMENT TELEMETRY & CONFLICT PREVENTION
  // =========================================================================
  describe('Workflow 2: Resource Management, Equipment Telemetry & Conflict Prevention', () => {
    let testReqId;

    test('2.1 Fetch equipment telemetry inventory with operational status', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0);
      const eq = res.data[0];
      assert.ok(eq.id);
      assert.ok(eq.name);
      assert.ok(eq.status);
    });

    test('2.2 Admin updates equipment operational status to maintenance and back to available', async () => {
      const listRes = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const eqItem = listRes.data[0];

      const res = await apiRequest(baseUrl, `/api/equipment/${eqItem.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'maintenance',
          location: 'Biomedical Workshop Bay 2'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.equipment.status === 'Under Maintenance' || res.data.equipment.status === 'maintenance');

      // Restore to available/operational
      const restoreRes = await apiRequest(baseUrl, `/api/equipment/${eqItem.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'available',
          location: eqItem.location || 'Ward Floor 2'
        }
      });
      assert.strictEqual(restoreRes.status, 200);
      assert.ok(restoreRes.data.equipment.status === 'Available' || restoreRes.data.equipment.status === 'available');
    });

    test('2.3 Doctor requests critical emergency resource', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          resourceType: 'equipment',
          resourceName: 'Mechanical Ventilator High-Flow',
          category: 'Ventilator',
          urgency: 'critical',
          priority: 'critical',
          ward: 'ICU Block A',
          patientName: 'Kavitha S. (P-2026-ADM)',
          reason: 'Required immediately for acute ARDS patient in Bay 4'
        }
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.request);
      assert.ok(res.data.request.id);
      testReqId = res.data.request.id;
    });

    test('2.4 Admin reviews and approves resource request', async () => {
      assert.ok(testReqId, 'testReqId must be present');
      const res = await apiRequest(baseUrl, `/api/requests/${testReqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'approved',
          allocatedResourceId: 'vent-01',
          notes: 'Approved and dispatched from Central Equipment Depot'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.request.status, 'approved');
    });

    test('2.5 Admin rejects an invalid/unserviceable resource request with rationale', async () => {
      // Create request to reject
      const reqRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          resourceType: 'equipment',
          resourceName: 'ECMO Unit',
          urgency: 'low',
          ward: 'General Ward B',
          reason: 'Elective support evaluation'
        }
      });
      assert.strictEqual(reqRes.status, 201);
      const rejectReqId = reqRes.data.request.id;

      const res = await apiRequest(baseUrl, `/api/requests/${rejectReqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'rejected',
          notes: 'Unit unavailable for non-critical elective general ward indication.'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.request.status, 'rejected');
    });

    test('2.6 Resource conflict prevention: assigning occupied bed returns 409 conflict', async () => {
      // Fetch beds and patients
      const [bedsRes, patientsRes] = await Promise.all([
        apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { method: 'GET', token: adminToken }),
        apiRequest(baseUrl, '/api/patients?hospitalId=hosp-chn-01', { method: 'GET', token: adminToken })
      ]);
      assert.ok(bedsRes.data.length > 0);
      assert.ok(patientsRes.data.length >= 2);

      const targetBed = bedsRes.data[0];
      const occupantPatient = patientsRes.data[0];
      const competingPatient = patientsRes.data[1];

      // Ensure targetBed is occupied by occupantPatient
      await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'occupied',
          patientName: occupantPatient.name,
          patientId: occupantPatient.patient_id || occupantPatient.id
        }
      });

      // Attempt to admit competingPatient into the occupied bed
      const admitRes = await apiRequest(baseUrl, '/api/patients/admit', {
        method: 'POST',
        token: adminToken,
        body: {
          patientId: competingPatient.patient_id || competingPatient.id,
          bedId: targetBed.id,
          ward: targetBed.ward,
          initialDiagnosis: 'Test conflict prevention'
        }
      });
      // Server must reject with 409 Conflict
      assert.strictEqual(admitRes.status, 409);
    });
  });

  // =========================================================================
  // WORKFLOW 3: PATIENT OPERATIONS & CROSS-DASHBOARD BED COORDINATION
  // =========================================================================
  describe('Workflow 3: Patient Operations & Bed Turnaround Coordination', () => {
    test('3.1 Admin manages bed turnaround cycle (cleaning -> ready)', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const targetBed = bedsRes.data.find(b => b.status !== 'occupied') || bedsRes.data[2];

      // Transition to cleaning
      const cleaningRes = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'cleaning',
          turnaroundStage: 'Terminal Cleaning & Sanitization'
        }
      });
      assert.strictEqual(cleaningRes.status, 200);
      assert.strictEqual(cleaningRes.data.bed.status, 'cleaning');

      // Transition to ready
      const readyRes = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'ready',
          turnaroundStage: 'Clinical Ready for Intake'
        }
      });
      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.data.bed.status, 'ready');
    });

    test('3.2 Cross-dashboard sync: bed status change is immediately reflected in doctor & nurse views', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const bed = bedsRes.data[1];

      // Admin updates bed
      await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'ready'
        }
      });

      // Doctor queries beds
      const docViewRes = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: doctorToken
      });
      const docBed = docViewRes.data.find(b => b.id === bed.id);
      assert.strictEqual(docBed.status, 'ready');

      // Nurse queries beds
      const nurseViewRes = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: nurseToken
      });
      const nurseBed = nurseViewRes.data.find(b => b.id === bed.id);
      assert.strictEqual(nurseBed.status, 'ready');
    });

    test('3.3 Patient transfer coordination across wards', async () => {
      const res = await apiRequest(baseUrl, '/api/transfers', {
        method: 'POST',
        token: adminToken,
        body: {
          patientId: 'PT-8941',
          patientName: 'Murugesan K.',
          fromWard: 'Emergency Triage',
          toWard: 'Cardiology Step-Down',
          reason: 'Post-stabilization recovery',
          priority: 'urgent'
        }
      });
      // Accepts or creates transfer record
      assert.ok([200, 201].includes(res.status));
      assert.ok(res.data.transfer || res.data.message);
    });
  });

  // =========================================================================
  // WORKFLOW 4: STAFF CREDENTIAL VERIFICATION & WORKFLOW AUTOMATION
  // =========================================================================
  describe('Workflow 4: Staff Credential Verification & Administrative Approvals', () => {
    let applicantUserId;
    let applicantUserToken;

    test('4.1 Staff role request creates pending verification status', async () => {
      const applicantEmail = `applicant_${Date.now()}@medisync.gov.in`;
      const regRes = await apiRequest(baseUrl, '/api/auth/google', {
        method: 'POST',
        body: {
          email: applicantEmail,
          name: 'Nurse Applicant Priya',
          googleId: `goog_${Date.now()}`
        }
      });
      assert.strictEqual(regRes.status, 200);
      applicantUserId = regRes.data.user.id;
      applicantUserToken = regRes.data.token;

      const res = await apiRequest(baseUrl, '/api/users/request-role', {
        method: 'POST',
        token: applicantUserToken,
        body: {
          role: 'nurse',
          hospitalId: 'hosp-chn-01',
          districtId: 'chennai'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.roleVerificationStatus, 'pending');
    });

    test('4.2 Admin approves staff credential verification', async () => {
      assert.ok(applicantUserId, 'applicantUserId must be set');
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: adminToken,
        body: {
          userId: applicantUserId,
          decision: 'approved'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.verification_status, 'approved');
      assert.strictEqual(res.data.user.is_onboarded, 1);
    });

    test('4.3 Admin rejects unauthorized staff credential verification with reason', async () => {
      const rejectEmail = `impostor_${Date.now()}@medisync.gov.in`;
      const regRes = await apiRequest(baseUrl, '/api/auth/google', {
        method: 'POST',
        body: {
          email: rejectEmail,
          name: 'Unverified Impostor',
          googleId: `goog_${Date.now()}`
        }
      });
      assert.strictEqual(regRes.status, 200);
      const rejectUserId = regRes.data.user.id;

      await apiRequest(baseUrl, '/api/users/request-role', {
        method: 'POST',
        token: regRes.data.token,
        body: {
          role: 'doctor',
          hospitalId: 'hosp-chn-01',
          districtId: 'chennai'
        }
      });

      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: adminToken,
        body: {
          userId: rejectUserId,
          decision: 'rejected',
          rejectionReason: 'Medical council registration number could not be authenticated.'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.verification_status, 'rejected');
      assert.strictEqual(res.data.user.rejection_reason, 'Medical council registration number could not be authenticated.');
    });

    test('4.4 Invalid verification decision returns 400 bad request', async () => {
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: adminToken,
        body: {
          userId: applicantUserId,
          decision: 'maybe'
        }
      });
      assert.strictEqual(res.status, 400);
    });
  });

  // =========================================================================
  // WORKFLOW 5: SECURITY, RBAC & MULTI-HOSPITAL DATA ISOLATION
  // =========================================================================
  describe('Workflow 5: Security, RBAC & Multi-Hospital Isolation', () => {
    test('5.1 Non-admin (doctor, nurse, patient) is blocked (403) from staff verification', async () => {
      // Doctor attempt
      const docRes = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: doctorToken,
        body: { userId: 'some-user', decision: 'approved' }
      });
      assert.strictEqual(docRes.status, 403);

      // Nurse attempt
      const nurseRes = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: nurseToken,
        body: { userId: 'some-user', decision: 'approved' }
      });
      assert.strictEqual(nurseRes.status, 403);

      // Patient attempt
      const patRes = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: patientToken,
        body: { userId: 'some-user', decision: 'approved' }
      });
      assert.strictEqual(patRes.status, 403);
    });

    test('5.2 Non-admin is blocked (403) from retrieving system audit logs', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', {
        method: 'GET',
        token: doctorToken
      });
      assert.strictEqual(res.status, 403);
    });

    test('5.3 Unauthenticated caller is blocked (401) from admin endpoints', async () => {
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        body: { userId: 'some-user', decision: 'approved' }
      });
      assert.strictEqual(res.status, 401);
    });

    test('5.4 Admin retrieves audit log containing recent administrative decisions', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0);
      const verifyLog = res.data.find(l => l.action === 'VERIFY_STAFF');
      assert.ok(verifyLog, 'Audit log must record staff verification actions');
      assert.ok(verifyLog.user_role === 'admin' || verifyLog.role === 'admin');
    });

    test('5.5 Multi-hospital data isolation: Hospital A requests do not leak to Hospital B', async () => {
      const resHospitalA = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const resHospitalB = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-cbe-02', {
        method: 'GET',
        token: externalAdminToken
      });
      assert.strictEqual(resHospitalA.status, 200);
      assert.strictEqual(resHospitalB.status, 200);

      // All returned items for Hospital A belong strictly to Hospital A
      for (const item of resHospitalA.data) {
        assert.strictEqual(item.hospital_id || item.hospitalId, 'hosp-chn-01');
      }
    });
  });

  // =========================================================================
  // WORKFLOW 6: CROSS-DASHBOARD COHESION & AUDIT SAFETY
  // =========================================================================
  describe('Workflow 6: Cross-Dashboard End-to-End Cohesion', () => {
    test('6.1 End-to-End: Doctor requests resource -> Admin approves -> Nurse observes state', async () => {
      // 1. Doctor creates request
      const createRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          resourceType: 'equipment',
          resourceName: 'Defibrillator Unit',
          urgency: 'high',
          ward: 'Emergency Triage',
          reason: 'Cardiac monitor and biphasic defibrillator requisition'
        }
      });
      assert.strictEqual(createRes.status, 201);
      const reqId = createRes.data.request.id;

      // 2. Admin reviews and approves
      const approveRes = await apiRequest(baseUrl, `/api/requests/${reqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'approved',
          notes: 'Dispatched from central reserve'
        }
      });
      assert.strictEqual(approveRes.status, 200);

      // 3. Nurse verifies the request is approved in nursing view
      const nurseListRes = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: nurseToken
      });
      const targetReq = nurseListRes.data.find(r => r.id === reqId);
      assert.ok(targetReq, 'Nurse must be able to view updated request');
      assert.strictEqual(targetReq.status, 'approved');
    });

    test('6.2 Admin bed update is synchronized to Emergency Command Center bed inventory', async () => {
      const beds = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const bed = beds.data[0];

      // Admin marks ready
      await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'ready',
          turnaroundStage: 'Available for Intake'
        }
      });

      // Command center summary reflects availability
      const summaryRes = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(summaryRes.status, 200);
      assert.ok((summaryRes.data.available || summaryRes.data.ready) > 0);
    });
  });
});
