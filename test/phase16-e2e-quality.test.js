import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 16 End-to-End Quality, Workflow & Security Validation Suite', () => {
  let baseUrl;
  let adminToken;
  let doctorToken;
  let nurseToken;
  let patientToken;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({ id: 'adm-01', name: 'Dr. Aravind Swamy', role: 'admin', hospitalId: 'hosp-chn-01' });
    doctorToken = generateToken({ id: 'doc-01', name: 'Dr. Sundaramoorthy M.', role: 'doctor', hospitalId: 'hosp-chn-01' });
    nurseToken = generateToken({ id: 'nur-01', name: 'Nurse Revathi S.', role: 'nurse', hospitalId: 'hosp-chn-01' });
    patientToken = generateToken({ id: 'pat-01', name: 'Karthik Subramanian', role: 'patient', hospitalId: 'hosp-chn-01' });
  });

  after(async () => {
    await stopTestServer();
  });

  // =========================================================================
  // WORKFLOW 1: LOGIN -> ROLE-BASED DASHBOARD -> LOGOUT
  // =========================================================================
  describe('Workflow 1: Authentication & Role-Based Dashboard Access Lifecycle', () => {
    it('1.1 Google OAuth / Authentication creates or validates user session', async () => {
      const authRes = await apiRequest(baseUrl, '/api/auth/google', {
        method: 'POST',
        body: {
          email: 'sundaramoorthy@medisync.ai',
          name: 'Dr. Sundaramoorthy M.',
          googleId: 'goog-doc-test',
          role: 'doctor',
          portal: 'hospital'
        }
      });
      assert.equal(authRes.status, 200);
      assert.ok(authRes.data.token, 'Must return JWT token');
      assert.ok(authRes.data.user, 'Must return user profile');
      assert.equal(authRes.data.user.email, 'sundaramoorthy@medisync.ai');
    });

    it('1.2 Authenticated doctor accesses physician clinical overview dashboard', async () => {
      const overviewRes = await apiRequest(baseUrl, '/api/doctor/doc-01/overview?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(overviewRes.status, 200);
      assert.ok(overviewRes.data.metrics || overviewRes.data.stats, 'Must return doctor statistics/metrics');
    });

    it('1.3 Authenticated nurse accesses bedside task dashboard', async () => {
      const nurseTasksRes = await apiRequest(baseUrl, '/api/nurse/nur-01/tasks?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(nurseTasksRes.status, 200);
      assert.ok(Array.isArray(nurseTasksRes.data));
    });

    it('1.4 Authenticated admin accesses hospital capacity summary', async () => {
      const summaryRes = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01', {
        token: adminToken
      });
      assert.equal(summaryRes.status, 200);
      assert.ok(summaryRes.data.total !== undefined, 'Summary must return total bed count');
    });
  });

  // =========================================================================
  // WORKFLOW 2: ADMIN CREATES/UPDATES PATIENT -> DOCTOR SEES THE PATIENT
  // =========================================================================
  describe('Workflow 2: Patient Creation, Clinical Update & Physician Visibility', () => {
    let createdPatientId;

    it('2.1 Admin registers new inpatient record in database', async () => {
      const createRes = await apiRequest(baseUrl, '/api/patients', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Ramesh Krishnan',
          age: 58,
          gender: 'Male',
          bloodGroup: 'B+',
          department: 'Cardiology',
          ward: 'ICU Block A',
          bedNumber: 'ICU-12',
          attendingPhysician: 'Dr. Sundaramoorthy M.',
          primaryDiagnosis: 'Hypertensive Emergency with Acute Angina',
          icd10: 'I10',
          riskLevel: 'Moderate Risk'
        }
      });
      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.patient);
      createdPatientId = createRes.data.patient.patient_id || createRes.data.patient.patientId;
      assert.ok(createdPatientId, 'Patient must have an assigned patientId');
    });

    it('2.2 Authorized attending doctor queries patients and sees the new intake', async () => {
      const listRes = await apiRequest(baseUrl, '/api/patients?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(listRes.status, 200);
      const found = listRes.data.find(p => (p.patientId || p.patient_id) === createdPatientId);
      assert.ok(found, 'New patient must be visible to attending doctor');
      assert.equal(found.name, 'Ramesh Krishnan');
    });

    it('2.3 Doctor updates clinical observations and digital twin reflects update', async () => {
      const updateRes = await apiRequest(baseUrl, `/api/patients/${createdPatientId}`, {
        method: 'PUT',
        token: doctorToken,
        body: {
          mewsScore: 2,
          riskLevel: 'Moderate Risk',
          doctorNotes: 'BP responded to IV Labetalol; stabilizing nicely'
        }
      });
      assert.equal(updateRes.status, 200);

      const twinRes = await apiRequest(baseUrl, `/api/patients/${createdPatientId}/twin`, {
        token: doctorToken
      });
      assert.equal(twinRes.status, 200);
      assert.equal(twinRes.data.patient.mewsScore || twinRes.data.patient.mews_score, 2);
    });
  });

  // =========================================================================
  // WORKFLOW 3: BED AVAILABILITY UPDATE -> CROSS-DASHBOARD SYNCHRONIZATION
  // =========================================================================
  describe('Workflow 3: Bed Availability Synchronization Across Dashboards', () => {
    const testBedId = 'bed-103';

    it('3.1 Admin marks bed as ready/available', async () => {
      const res = await apiRequest(baseUrl, `/api/beds/${testBedId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'ready',
          notes: 'Terminal disinfection completed by Housekeeping'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.bed.status, 'ready');
    });

    it('3.2 Doctor and Nurse dashboards query beds and both reflect exact state', async () => {
      const docRes = await apiRequest(baseUrl, '/api/beds', { token: doctorToken });
      const nurseRes = await apiRequest(baseUrl, '/api/beds', { token: nurseToken });
      assert.equal(docRes.status, 200);
      assert.equal(nurseRes.status, 200);

      const docBed = docRes.data.find(b => b.id === testBedId);
      const nurseBed = nurseRes.data.find(b => b.id === testBedId);
      assert.equal(docBed.status, 'ready');
      assert.equal(nurseBed.status, 'ready');
    });
  });

  // =========================================================================
  // WORKFLOW 4: DOCTOR RESOURCE REQUEST -> ADMIN APPROVAL -> STATUS UPDATE
  // =========================================================================
  describe('Workflow 4: Clinical Resource Request & Administrative Lifecycle', () => {
    let reqId;

    it('4.1 Doctor creates urgent resource request', async () => {
      const createRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'Equipment',
          department: 'Cardiology',
          quantity: 1,
          urgency: 'Critical',
          priority: 'Urgent',
          reason: 'STAT cardiac monitor standby for Bed ICU-12',
          patientName: 'Ramesh Krishnan'
        }
      });
      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.request);
      reqId = createRes.data.request.id;
    });

    it('4.2 Admin reviews and approves request with resource allocation', async () => {
      const approveRes = await apiRequest(baseUrl, `/api/requests/${reqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'Approved',
          allocatedResourceId: 'eq-05',
          allocatedQuantity: 1
        }
      });
      assert.equal(approveRes.status, 200);
      assert.equal(approveRes.data.request.status.toLowerCase(), 'approved');
    });

    it('4.3 Doctor queries requests and verifies approved status and allocated units', async () => {
      const listRes = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(listRes.status, 200);
      const found = listRes.data.find(r => r.id === reqId);
      assert.ok(found);
      assert.equal(found.status.toLowerCase(), 'approved');
    });
  });

  // =========================================================================
  // WORKFLOW 5: EMERGENCY CASE CREATED -> DOCTOR & NURSE RECEIVE ALERTS
  // =========================================================================
  describe('Workflow 5: Emergency Escalation & Cross-Portal Alert Distribution', () => {
    let alertId;

    it('5.1 Clinical deterioration alert is created for acute case', async () => {
      const createRes = await apiRequest(baseUrl, '/api/clinical-alerts', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8941',
          patientName: 'Kavitha Ramasamy',
          ward: 'ICU Block A',
          bed: 'ICU-04',
          alertType: 'Deterioration Alert',
          message: 'Acute SpO2 drop to 89% on 4L nasal cannula; high MEWS',
          severity: 5,
          mewsScore: 5
        }
      });
      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.alert);
      alertId = createRes.data.alert.id;
    });

    it('5.2 Doctor and Nurse retrieve active clinical alerts', async () => {
      const docAlerts = await apiRequest(baseUrl, '/api/clinical-alerts?hospitalId=hosp-chn-01', { token: doctorToken });
      const nurseAlerts = await apiRequest(baseUrl, '/api/clinical-alerts?hospitalId=hosp-chn-01', { token: nurseToken });

      assert.equal(docAlerts.status, 200);
      assert.equal(nurseAlerts.status, 200);
      assert.ok(Array.isArray(docAlerts.data));
      assert.ok(docAlerts.data.length > 0);
      assert.ok(nurseAlerts.data.length > 0);
    });
  });

  // =========================================================================
  // WORKFLOW 6: PATIENT TRANSFER -> APPROVAL -> BED STATUS & TASK UPDATE
  // =========================================================================
  describe('Workflow 6: Patient Transfer Request & Step-Down Handover', () => {
    let transferId;
    const targetBedId = 'bed-104';

    it('6.1 Doctor initiates patient transfer request', async () => {
      // Ensure target bed is ready
      await apiRequest(baseUrl, `/api/beds/${targetBedId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'ready' }
      });

      const trfRes = await apiRequest(baseUrl, '/api/transfers', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          fromWard: 'Emergency Bay',
          toWard: 'ICU Block B',
          fromBedId: 'bed-107',
          toBedId: targetBedId,
          reason: 'Step-down to ICU for overnight telemetry observation'
        }
      });
      assert.equal(trfRes.status, 201);
      transferId = trfRes.data.transfer.id;
    });

    it('6.2 Approving transfer updates bed state and auto-creates nurse handover task', async () => {
      const approveRes = await apiRequest(baseUrl, `/api/transfers/${transferId}/status`, {
        method: 'PATCH',
        token: doctorToken,
        body: {
          status: 'Approved',
          toBedId: targetBedId,
          notes: 'Physician authorized transfer'
        }
      });
      assert.equal(approveRes.status, 200);

      // Verify target bed is occupied
      const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: adminToken });
      const targetBed = bedsRes.data.find(b => b.id === targetBedId);
      assert.equal(targetBed.status, 'occupied');

      // Verify nurse handover task created
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: nurseToken });
      const transferTask = tasksRes.data.find(t => t.taskType === 'Patient Transfer' || t.task_type === 'Patient Transfer');
      assert.ok(transferTask, 'Nurse transfer intake task must be generated');
    });
  });

  // =========================================================================
  // WORKFLOW 7: DISCHARGE WORKFLOW -> TURNOVER TASK -> BED AVAILABILITY
  // =========================================================================
  describe('Workflow 7: Discharge Recommendation, Terminal Cleaning & Bed Turnover', () => {
    it('7.1 Doctor executes patient discharge, setting bed to cleaning', async () => {
      // Ensure bed-101 is ready first, then assign to patient
      await apiRequest(baseUrl, '/api/beds/bed-101/status', {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'ready' }
      });

      await apiRequest(baseUrl, '/api/beds/bed-101/status', {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'occupied', patientName: 'Kavitha Ramasamy', patientId: 'PT-8941' }
      });

      await apiRequest(baseUrl, '/api/patients/PT-8941', {
        method: 'PUT',
        token: doctorToken,
        body: { bedNumber: 'ICU-04', status: 'Admitted' }
      });

      const dischargeRes = await apiRequest(baseUrl, '/api/patients/discharge', {
        method: 'POST',
        token: doctorToken,
        body: {
          patientId: 'PT-8941',
          dischargeNotes: 'Cardiac recovery criteria met. Safe for home discharge.',
          followUpDate: '2026-12-05'
        }
      });
      assert.equal(dischargeRes.status, 200);

      // Verify bed moved to cleaning
      const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: nurseToken });
      const bed = bedsRes.data.find(b => b.id === 'bed-101');
      assert.equal(bed.status, 'cleaning');

      // Verify automated Bed Turnover task exists
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: nurseToken });
      const turnoverTask = tasksRes.data.find(t => t.taskType === 'Bed Turnover' || t.task_type === 'Bed Turnover');
      assert.ok(turnoverTask, 'Housekeeping & Nurse bed turnover task must be present');
    });

    it('7.2 Nurse advances sanitized bed to ready status', async () => {
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

  // =========================================================================
  // WORKFLOW 8: NURSE COMPLETES TASK -> DOCTOR SEES UPDATED TASK STATUS
  // =========================================================================
  describe('Workflow 8: Doctor-Nurse Closed-Loop Clinical Order Execution', () => {
    let taskId;

    it('8.1 Doctor assigns clinical task to nursing staff', async () => {
      const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: doctorToken,
        body: {
          patientId: 'PT-8942',
          patientName: 'Murugan Selvam',
          ward: 'Emergency Ward',
          bed: 'EMR-02',
          taskType: 'Medication Administration',
          priority: 'Stat (Immediate)',
          instruction: 'Administer IV Metoprolol 5mg slow bolus over 5 minutes and re-check telemetry BP/HR',
          assignedNurse: 'Nurse Revathi S.'
        }
      });
      assert.ok([200, 201].includes(createRes.status));
      assert.ok(createRes.data.task);
      taskId = createRes.data.task.id;
    });

    it('8.2 Nurse executes task and logs clinical observations', async () => {
      const executeRes = await apiRequest(baseUrl, `/api/clinical-tasks/${taskId}`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'Completed',
          executionNotes: 'IV Metoprolol 5mg administered smoothly without adverse rhythm events',
          vitalsRecorded: { hr: 78, sbp: 124, dbp: 80, spo2: 98 }
        }
      });
      assert.equal(executeRes.status, 200);
    });

    it('8.3 Doctor views clinical tasks and verifies closed-loop completion', async () => {
      const listRes = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(listRes.status, 200);
      const completedTask = listRes.data.find(t => t.id === taskId);
      assert.ok(completedTask);
      assert.equal(completedTask.status, 'Completed');
      assert.ok(completedTask.executionNotes || completedTask.execution_notes);
    });
  });

  // =========================================================================
  // WORKFLOW 9: NOTIFICATION GENERATED -> USER RECEIVES IT -> MARK AS READ
  // =========================================================================
  describe('Workflow 9: Notification Delivery, Query & Acknowledgment', () => {
    let notifId;

    it('9.1 User queries notifications and receives active notifications feed', async () => {
      const listRes = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(listRes.status, 200);
      assert.ok(Array.isArray(listRes.data));
      assert.ok(listRes.data.length > 0, 'Must have at least one notification');
      notifId = listRes.data[0].id;
    });

    it('9.2 User marks notification as read and state persists', async () => {
      const markRes = await apiRequest(baseUrl, `/api/notifications/${notifId}/read`, {
        method: 'PATCH',
        token: doctorToken
      });
      assert.equal(markRes.status, 200);
      assert.ok(markRes.data.success);

      // Verify in list
      const listRes = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      const updatedNotif = listRes.data.find(n => n.id === notifId);
      assert.ok(updatedNotif);
      assert.equal(Boolean(updatedNotif.read), true);
    });
  });

  // =========================================================================
  // WORKFLOW 10: WORKFLOW AUTOMATION TRIGGERED -> EXECUTION & AUDIT UPDATED
  // =========================================================================
  describe('Workflow 10: Workflow Automation Trigger, Approval Gate & Audit Record', () => {
    let executionId;

    it('10.1 Trigger an existing workflow automation rule', async () => {
      const triggerRes = await apiRequest(baseUrl, '/api/workflows/trigger', {
        method: 'POST',
        token: adminToken,
        body: {
          ruleId: 'rule-wf-01',
          triggerData: { bedId: 'bed-103', durationMinutes: 45 },
          initiatedBy: 'Quality Assurance E2E Test'
        }
      });
      assert.ok([200, 201].includes(triggerRes.status));
      assert.ok(triggerRes.data.execution);
      executionId = triggerRes.data.execution.id;
    });

    it('10.2 Workflow executions list contains the triggered run', async () => {
      const listRes = await apiRequest(baseUrl, '/api/workflows/executions', {
        token: adminToken
      });
      assert.equal(listRes.status, 200);
      const execution = listRes.data.find(e => e.id === executionId);
      assert.ok(execution, 'Execution record must be present in workflow history');
    });

    it('10.3 Admin verifies workflow execution and checks audit log telemetry', async () => {
      const auditRes = await apiRequest(baseUrl, '/api/realtime/events/recent?hospitalId=hosp-chn-01', {
        token: adminToken
      });
      assert.equal(auditRes.status, 200);
      assert.ok(Array.isArray(auditRes.data), 'Audit logs must be returned as array');
    });
  });

  // =========================================================================
  // SECURITY & ROLE-BASED ACCESS CONTROL (RBAC) SPECIFICATIONS
  // =========================================================================
  describe('Security, RBAC, Multi-Tenancy & Clinical Safety', () => {
    it('S.1 Rejects unauthenticated API calls with 401 Unauthorized', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        body: { instruction: 'Malicious order' }
      });
      assert.equal(res.status, 401);
    });

    it('S.2 Blocks unauthorized role escalation (e.g. Nurse approving staff)', async () => {
      const res = await apiRequest(baseUrl, '/api/admin/verify-user', {
        method: 'POST',
        token: nurseToken,
        body: { userId: 'usr-target', decision: 'approved' }
      });
      assert.equal(res.status, 403);
    });

    it('S.3 Prevents unauthorized cross-hospital data access', async () => {
      const hosp2Token = generateToken({ id: 'doc-02', role: 'doctor', hospitalId: 'hosp-cbe-01' });
      const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: hosp2Token });
      assert.equal(bedsRes.status, 200);
      // Ensure only hosp-cbe-01 records returned
      for (const b of bedsRes.data) {
        assert.equal(b.hospitalId || b.hospital_id, 'hosp-cbe-01');
      }
    });

    it('S.4 Human Confirmation requirement: Emergency resource allocation requires authenticated clinician sign-off', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents/inc-01/allocate-resources', {
        method: 'POST',
        body: { allocatedBedId: 'bed-103' }
      });
      assert.equal(res.status, 401, 'Autonomous unauthenticated allocation must be strictly blocked');
    });
  });
});
