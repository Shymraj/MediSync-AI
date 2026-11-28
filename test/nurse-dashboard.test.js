import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Nurse Dashboard 9 Modules & Clinical Integration Suite', () => {
  let baseUrl;
  let nurseToken;
  let adminToken;

  before(async () => {
    baseUrl = await startTestServer();
    nurseToken = generateToken({
      id: 'nurse-revathi-01',
      name: 'Nurse Revathi S., Senior RN',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });
    adminToken = generateToken({
      id: 'admin-01',
      name: 'Hospital Administrator',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });
  });

  // MODULE 1: WARD OVERVIEW
  test('1. Ward Overview: Retrieves ward status, bed capacities and pending clinical tasks', async () => {
    const bedsRes = await apiRequest(baseUrl, '/api/beds/summary', { token: nurseToken });
    assert.equal(bedsRes.status, 200);
    assert.ok(typeof bedsRes.data === 'object');

    const tasksRes = await apiRequest(baseUrl, '/api/nurse/nurse-revathi-01/tasks', { token: nurseToken });
    assert.equal(tasksRes.status, 200);
    assert.ok(Array.isArray(tasksRes.data));

    const alertsRes = await apiRequest(baseUrl, '/api/clinical-alerts?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(alertsRes.status, 200);
    assert.ok(Array.isArray(alertsRes.data));
  });

  // MODULE 2: EMERGENCY COMMAND CENTER
  test('2. Emergency Command Center: Verifies emergency triage capacity and active code alerts', async () => {
    const emergRes = await apiRequest(baseUrl, '/api/emergency/overview', { token: nurseToken });
    assert.equal(emergRes.status, 200);
    assert.ok(emergRes.data.totalIncidents !== undefined || emergRes.data.activeEmergencies !== undefined || emergRes.data.availableIcuBeds !== undefined);

    const incRes = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(incRes.status, 200);
    assert.ok(Array.isArray(incRes.data));
  });

  // MODULE 3: DIGITAL TWIN & WARD PREP
  test('3. Digital Twin & Ward Prep: Verifies ICU ward bed inventory and pre-intake readiness', async () => {
    const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(bedsRes.status, 200);
    assert.ok(Array.isArray(bedsRes.data));
    const icuBeds = bedsRes.data.filter(b => b.ward && (b.ward.includes('ICU') || b.ward.includes('HDU')));
    assert.ok(icuBeds.length > 0, 'Should find ICU beds for ward preparation');
  });

  // MODULE 4: AUTOMATED TASKS & WORKFLOWS
  test('4. Automated Tasks & Workflows: Queries nursing escalation rules and workflow execution logs', async () => {
    const rulesRes = await apiRequest(baseUrl, '/api/workflows/definitions', { token: nurseToken });
    assert.equal(rulesRes.status, 200);
    assert.ok(Array.isArray(rulesRes.data));

    const execRes = await apiRequest(baseUrl, '/api/workflows/executions', { token: nurseToken });
    assert.equal(execRes.status, 200);
    assert.ok(Array.isArray(execRes.data));
  });

  // MODULE 5: MY WARD (ICU BLOCK A/B)
  test('5. My Ward: Retrieves assigned inpatients with vital telemetry and attending physician', async () => {
    const ptsRes = await apiRequest(baseUrl, '/api/patients?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(ptsRes.status, 200);
    assert.ok(Array.isArray(ptsRes.data));
    assert.ok(ptsRes.data.length > 0, 'Inpatient census must return patients');

    const firstPt = ptsRes.data[0];
    assert.ok(firstPt.name, 'Patient should have a name');
    assert.ok(firstPt.id || firstPt.patient_id, 'Patient should have an ID');
  });

  // MODULE 6: BED TURNAROUND (6-STAGE LIFECYCLE)
  test('6. Bed Turnaround: Advances bed through sanitization and nurse confirmation lifecycle', async () => {
    const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: nurseToken });
    const targetBed = bedsRes.data.find(b => b.ward && b.ward.includes('ICU')) || bedsRes.data[0];
    assert.ok(targetBed, 'Must have a bed to test turnaround');

    // Advance to cleaning
    const patchCleaning = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'cleaning', notes: 'Housekeeping terminal cleaning started' }
    });
    assert.equal(patchCleaning.status, 200);
    assert.equal(patchCleaning.data.status, 'cleaning');

    // Advance to nurse_confirmation
    const patchConfirm = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'nurse_confirmation', notes: 'Biomedical checks verified by Primary Nurse' }
    });
    assert.equal(patchConfirm.status, 200);
    assert.equal(patchConfirm.data.status, 'nurse_confirmation');

    // Sign off ready
    const patchReady = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'ready', notes: 'Nurse signed off ready for admission' }
    });
    assert.equal(patchReady.status, 200);
    assert.equal(patchReady.data.status, 'ready');
  });

  // MODULE 7: CLINICAL & CLEANING TASKS (CLOSED LOOP)
  test('7. Clinical Tasks: Creates closed-loop task and executes with documented vitals', async () => {
    // Doctor creates task
    const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
      method: 'POST',
      token: adminToken,
      body: {
        hospitalId: 'hosp-chn-01',
        patientId: 'PT-8942',
        patientName: 'Murugan Selvam',
        ward: 'ICU Block A',
        bed: 'ICU-08',
        taskType: 'Medication Administration',
        instruction: 'Administer IV Ceftriaxone 1g STAT post-blood culture.',
        priority: 'Stat - Emergency',
        assignedNurse: 'Nurse Revathi S.'
      }
    });
    assert.equal(createRes.status, 201);
    const createdTask = createRes.data;
    assert.ok(createdTask.id);

    // Nurse executes order with vitals telemetry
    const executeRes = await apiRequest(baseUrl, `/api/clinical-tasks/${createdTask.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: {
        status: 'Completed',
        executionNotes: '5-Rights verified. IV Ceftriaxone 1g infused over 30 mins. No allergic reaction.',
        vitalsRecorded: {
          heartRate: 84,
          systolicBP: 120,
          spO2: 98,
          respiratoryRate: 16,
          temperature: 37.0
        }
      }
    });
    assert.equal(executeRes.status, 200);
    assert.ok(executeRes.data.success);
    assert.equal(executeRes.data.task.status, 'Completed');
  });

  // MODULE 8: EQUIPMENT CHECKLIST & FAULT REQUISITION
  test('8. Equipment Checklist: Retrieves device telemetry and logs replacement requisition', async () => {
    const eqRes = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(eqRes.status, 200);
    assert.ok(Array.isArray(eqRes.data));

    // Requisition faulty replacement
    const reqRes = await apiRequest(baseUrl, '/api/requests', {
      method: 'POST',
      token: nurseToken,
      body: {
        hospitalId: 'hosp-chn-01',
        type: 'equipment',
        item: 'Mechanical Ventilator (Mindray SV300)',
        quantity: 1,
        urgency: 'Emergency',
        department: 'ICU Nursing',
        reason: 'Expiratory flow transducer error. Immediate replacement requisitioned by bedside nurse.',
        requestedBy: 'Nurse Revathi S., Senior RN'
      }
    });
    assert.equal(reqRes.status, 201);
    assert.ok(reqRes.data.id);
    assert.equal(reqRes.data.request.status, 'pending');
  });

  // MODULE 9: SHIFT HANDOVER LOG (SBAR PROTOCOL)
  test('9. Shift Handover Log: Submits structured SBAR handover and retrieves historical records', async () => {
    const newHandover = {
      hospitalId: 'hosp-chn-01',
      ward: 'ICU Block A',
      outgoingNurse: 'Nurse Revathi S., Senior RN',
      incomingNurse: 'Nurse Priya M., BSN',
      shiftType: 'Day to Evening (14:00 - 22:00)',
      patientCount: 8,
      criticalPatients: ['pt-rec-01', 'pt-rec-02'],
      situation: 'ICU Block A census 8/10 beds. 2 patients on mechanical ventilation.',
      background: '1 emergent laparotomy intake from Trauma Bay at 11:30. Post-op stable.',
      assessment: 'All patients NSR on telemetry. Bed 08 completed IV Ceftriaxone.',
      recommendation: 'Check repeat Troponin for Bed 02 at 18:00. Maintain weaning O2 protocol.',
      checklistCompleted: true,
      narcoticsCountVerified: true,
      crashCartChecked: true
    };

    const postRes = await apiRequest(baseUrl, '/api/handovers', {
      method: 'POST',
      token: nurseToken,
      body: newHandover
    });
    assert.equal(postRes.status, 201);
    assert.ok(postRes.data.id);
    assert.equal(postRes.data.ward, 'ICU Block A');
    assert.equal(postRes.data.outgoingNurse, 'Nurse Revathi S., Senior RN');

    // Retrieve handovers
    const getRes = await apiRequest(baseUrl, '/api/handovers?hospitalId=hosp-chn-01', { token: nurseToken });
    assert.equal(getRes.status, 200);
    assert.ok(Array.isArray(getRes.data));
    const found = getRes.data.find(h => h.id === postRes.data.id);
    assert.ok(found, 'Created handover must be found in retrieved handovers list');
    assert.equal(found.situation, newHandover.situation);
  });
});
