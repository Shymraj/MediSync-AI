import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 15 Cross-Dashboard Integration Test Suite', () => {
  let baseUrl;
  let adminToken;
  let doctorToken;
  let nurseToken;
  let readyBedId;
  let testBedForWorkflow2;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({ id: 'adm-01', name: 'Dr. Aravind Swamy', role: 'admin', hospitalId: 'hosp-chn-01' });
    doctorToken = generateToken({ id: 'doc-01', name: 'Dr. Sundaramoorthy M.', role: 'doctor', hospitalId: 'hosp-chn-01' });
    nurseToken = generateToken({ id: 'nurse-01', name: 'Nurse Revathi S.', role: 'nurse', hospitalId: 'hosp-chn-01' });

    // Discover live beds
    const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: adminToken });
    assert.equal(bedsRes.status, 200);
    assert.ok(bedsRes.data.length >= 3, 'Must have at least 3 beds');
    
    // Pick designated test beds
    readyBedId = 'bed-106';
    testBedForWorkflow2 = 'bed-108';
  });

  after(async () => {
    await stopTestServer();
  });

  // ==========================================
  // WORKFLOW 1: EMERGENCY PATIENT END-TO-END
  // ==========================================
  describe('Workflow 1: Emergency Patient Flow', () => {
    let incidentId;

    it('1.1 Should list existing emergency incidents or create a test incident', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', { token: adminToken });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      if (res.data.length > 0) {
        incidentId = res.data[0].id || res.data[0].incident_id;
      }
      assert.ok(incidentId, 'Emergency incident ID should exist');
    });

    it('1.2 Should allocate bed and ventilator to emergency incident with safety checks', async () => {
      const allocRes = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        token: adminToken,
        body: {
          allocatedBedId: readyBedId,
          allocatedVentilatorId: 'eq-01',
          allocatedSpecialist: 'Dr. Sundaramoorthy M.',
          bloodUnits: '2 Units O-Negative PRBC',
          authorizationNotes: 'STAT emergency intake approved by Medical Command'
        }
      });

      assert.equal(allocRes.status, 200);
      assert.ok(allocRes.data.incident, 'Should return updated emergency incident');

      // Verify Bed status changed to occupied
      const verifyBedRes = await apiRequest(baseUrl, '/api/beds', { token: doctorToken });
      const updatedBed = verifyBedRes.data.find(b => b.id === readyBedId);
      assert.equal(updatedBed.status, 'occupied');

      // Verify Nurse Task was automatically generated
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: nurseToken });
      assert.equal(tasksRes.status, 200);
      const emergencyTask = tasksRes.data.find(t => t.taskType === 'Emergency Intake' || t.task_type === 'Emergency Intake');
      assert.ok(emergencyTask, 'Nurse task for emergency intake should be auto-created');
    });
  });

  // ==========================================
  // WORKFLOW 2: BED MANAGEMENT & CONFLICT AVOIDANCE
  // ==========================================
  describe('Workflow 2: Bed Management Synchronization & Conflict Prevention', () => {
    it('2.1 Should update bed status and reflect across Doctor & Nurse queries', async () => {
      // Ensure test bed is in ready state before occupancy
      await apiRequest(baseUrl, `/api/beds/${testBedForWorkflow2}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'ready' }
      });

      const updateRes = await apiRequest(baseUrl, `/api/beds/${testBedForWorkflow2}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'occupied',
          patientName: 'Subramanian V.',
          patientId: 'PT-8945',
          notes: 'Post-op cardiac telemetry'
        }
      });
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.data.bed.status, 'occupied');

      // Query from Doctor token
      const doctorBedRes = await apiRequest(baseUrl, '/api/beds', { token: doctorToken });
      const docBed = doctorBedRes.data.find(b => b.id === testBedForWorkflow2);
      assert.equal(docBed.status, 'occupied');
      assert.equal(docBed.patientName || docBed.patient_name, 'Subramanian V.');
    });

    it('2.2 Should block concurrent duplicate allocation on already occupied bed with 409 Conflict', async () => {
      const conflictRes = await apiRequest(baseUrl, `/api/beds/${testBedForWorkflow2}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'occupied',
          patientName: 'Duplicate Patient X',
          patientId: 'PT-TEST-002',
          notes: 'Attempted concurrent booking'
        }
      });
      assert.equal(conflictRes.status, 409, 'Must prevent duplicate bed occupancy');
      assert.ok(conflictRes.data.error.includes('Already occupied'));
    });

    it('2.3 Should allow changing bed status to cleaning and advancing to ready', async () => {
      const cleaningRes = await apiRequest(baseUrl, `/api/beds/${testBedForWorkflow2}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'cleaning',
          patientName: null,
          patientId: null,
          notes: 'Nurse terminal disinfection underway'
        }
      });
      assert.equal(cleaningRes.status, 200);
      assert.equal(cleaningRes.data.bed.status, 'cleaning');

      const readyRes = await apiRequest(baseUrl, `/api/beds/${testBedForWorkflow2}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'ready',
          notes: 'Turnover complete. Sanitized & calibrated.'
        }
      });
      assert.equal(readyRes.status, 200);
      assert.equal(readyRes.data.bed.status, 'ready');
    });
  });

  // ==========================================
  // WORKFLOW 3: RESOURCE REQUEST & APPROVAL FLOW
  // ==========================================
  describe('Workflow 3: Resource Request & Administrative Allocation Flow', () => {
    let requestId;

    it('3.1 Doctor creates a critical resource request', async () => {
      const createRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'Equipment',
          department: 'ICU Block A',
          quantity: 1,
          priority: 'Urgent',
          urgency: 'Critical',
          reason: 'STAT cardiac defibrillator required for Bed A-102',
          patientId: 'PT-8941',
          patientName: 'Kavitha Ramasamy'
        }
      });
      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.request, 'Should return created request object');
      requestId = createRes.data.request.id;
    });

    it('3.2 Admin reviews and approves the resource request', async () => {
      const approveRes = await apiRequest(baseUrl, `/api/requests/${requestId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'Approved',
          allocatedResourceId: 'eq-04',
          allocatedQuantity: 1
        }
      });
      assert.equal(approveRes.status, 200);
      assert.equal(approveRes.data.request.status.toLowerCase(), 'approved');

      // Verify request in shared list
      const listRes = await apiRequest(baseUrl, '/api/requests', { token: nurseToken });
      assert.equal(listRes.status, 200);
      const req = listRes.data.find(r => r.id === requestId);
      assert.ok(req);
      assert.equal(req.status.toLowerCase(), 'approved');
    });
  });

  // ==========================================
  // WORKFLOW 4: INTER-WARD PATIENT TRANSFER
  // ==========================================
  describe('Workflow 4: Patient Transfer & Nurse Receiving Handover Flow', () => {
    let transferId;
    let targetBedId = 'bed-105';

    it('4.1 Doctor initiates inter-ward patient transfer request', async () => {
      // Ensure target bed is ready
      await apiRequest(baseUrl, `/api/beds/${targetBedId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'ready' }
      });

      const createRes = await apiRequest(baseUrl, '/api/transfers', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8945',
          fromWard: 'HDU Ward 2',
          toWard: 'ICU Block B',
          fromBedId: 'bed-109',
          toBedId: targetBedId,
          reason: 'Acute escalation requiring invasive monitoring'
        }
      });
      assert.equal(createRes.status, 201);
      assert.ok(createRes.data.transfer);
      transferId = createRes.data.transfer.id;
    });

    it('4.2 Approving transfer updates bed states, vacates source bed, and creates nurse task', async () => {
      const approveRes = await apiRequest(baseUrl, `/api/transfers/${transferId}/status`, {
        method: 'PATCH',
        token: doctorToken,
        body: {
          status: 'Approved',
          toBedId: targetBedId,
          notes: 'Physician sign-off completed'
        }
      });
      assert.equal(approveRes.status, 200);
      assert.equal(approveRes.data.transfer.status, 'Approved');

      // Verify target bed is now occupied
      const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: adminToken });
      const targetBed = bedsRes.data.find(b => b.id === targetBedId);
      assert.equal(targetBed.status, 'occupied');

      // Verify Nurse Receiving Handover Task was auto-created
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: nurseToken });
      const handoverTask = tasksRes.data.find(t => t.taskType === 'Patient Transfer' || t.task_type === 'Patient Transfer');
      assert.ok(handoverTask, 'Receiving nurse handover task should be created');
    });

    it('4.3 Should block transfer to already occupied target bed with 409 Conflict', async () => {
      const tr2Res = await apiRequest(baseUrl, '/api/transfers', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          fromWard: 'Emergency Bay',
          toWard: 'ICU Block B',
          toBedId: targetBedId,
          reason: 'Transfer conflict test'
        }
      });
      assert.equal(tr2Res.status, 201);
      const tr2Id = tr2Res.data.transfer.id;

      const conflictRes = await apiRequest(baseUrl, `/api/transfers/${tr2Id}/status`, {
        method: 'PATCH',
        token: doctorToken,
        body: {
          status: 'Approved',
          toBedId: targetBedId
        }
      });
      assert.equal(conflictRes.status, 409, 'Must prevent transfer to already occupied bed');
      assert.ok(conflictRes.data.error.includes('occupied'));
    });
  });

  // ==========================================
  // WORKFLOW 5: DISCHARGE & 6-STAGE BED TURNOVER
  // ==========================================
  describe('Workflow 5: Patient Discharge & Bed Turnover Flow', () => {
    it('5.1 Doctor discharges patient, setting bed to cleaning and dispatching nurse turnover task', async () => {
      // Ensure bed-101 is occupied by PT-8941 so discharge has an explicit baseline
      await apiRequest(baseUrl, '/api/beds/bed-101/status', {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'occupied',
          patientName: 'Kavitha Ramasamy',
          patientId: 'PT-8941'
        }
      });

      const dischargeRes = await apiRequest(baseUrl, '/api/patients/discharge', {
        method: 'POST',
        token: doctorToken,
        body: {
          patientId: 'PT-8941',
          dischargeNotes: 'Patient hemodynamically stable. Discharged to outpatient follow-up.',
          followUpDate: '2026-12-10',
          prescriptions: 'Tab Aspirin 75mg OD'
        }
      });
      assert.equal(dischargeRes.status, 200);
      assert.ok(dischargeRes.data.message.includes('discharged'));

      // Verify discharged bed-101 status is cleaning
      const verifyBedsRes = await apiRequest(baseUrl, '/api/beds', { token: nurseToken });
      const releasedBed = verifyBedsRes.data.find(b => b.id === 'bed-101');
      assert.equal(releasedBed.status, 'cleaning');

      // Verify automated Bed Turnover Task was added to clinical_tasks
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: nurseToken });
      const turnoverTask = tasksRes.data.find(t => t.taskType === 'Bed Turnover' || t.task_type === 'Bed Turnover');
      assert.ok(turnoverTask, 'Automated Bed Turnover task should be dispatched to nursing team');
    });

    it('5.2 Nurse advances sanitized bed to ready status', async () => {
      const readyRes = await apiRequest(baseUrl, '/api/beds/bed-101/status', {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'ready',
          notes: 'Terminal disinfection completed by Nurse Duty'
        }
      });
      assert.equal(readyRes.status, 200);
      assert.equal(readyRes.data.bed.status, 'ready');
    });
  });

  // ==========================================
  // SECURITY & RBAC VALIDATION
  // ==========================================
  describe('Security & Role-Based Access Control (RBAC)', () => {
    it('6.1 Should reject unauthorized requests with 401 Unauthorized', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        body: { instruction: 'Unauthorized order' }
      });
      assert.equal(res.status, 401);
    });

    it('6.2 Should reject requests with invalid/tampered tokens', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: 'invalid.jwt.token.string',
        body: { instruction: 'Tampered order' }
      });
      assert.equal(res.status, 403);
    });
  });
});
