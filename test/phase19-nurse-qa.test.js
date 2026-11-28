import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 19 Nurse Dashboard QA & Final Validation Suite', () => {
  let baseUrl;
  let nurseToken;
  let doctorToken;
  let adminToken;
  let otherHospitalNurseToken;

  before(async () => {
    baseUrl = await startTestServer();
    nurseToken = generateToken({
      id: 'nurse-revathi-01',
      name: 'Nurse Revathi S., Senior RN',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });
    doctorToken = generateToken({
      id: 'doc-rivera-01',
      name: 'Dr. Alex Rivera, MD',
      role: 'doctor',
      hospitalId: 'hosp-chn-01'
    });
    adminToken = generateToken({
      id: 'admin-01',
      name: 'Hospital Administrator',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });
    otherHospitalNurseToken = generateToken({
      id: 'nurse-other-99',
      name: 'Nurse External, RN',
      role: 'nurse',
      hospitalId: 'hosp-cbe-02'
    });
  });

  // =========================================================================
  // STEP 1 & 2: NURSE DASHBOARD 9 MODULES AUDIT & FUNCTIONAL HEALTH
  // =========================================================================
  describe('Part 1: Nurse Dashboard 9 Modules Audit & Functional Health', () => {
    test('1.1 Ward Overview: Verifies ward census, bed summary capacities and telemetry', async () => {
      const summaryRes = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(summaryRes.status, 200);
      assert.ok(summaryRes.data);
      assert.ok(typeof summaryRes.data.totalBeds === 'number' || typeof summaryRes.data.total === 'number');

      const patientsRes = await apiRequest(baseUrl, '/api/nurse/nurse-revathi-01/patients', {
        token: nurseToken
      });
      assert.equal(patientsRes.status, 200);
      assert.ok(Array.isArray(patientsRes.data));
    });

    test('1.2 Emergency Command Center: Verifies emergency triage incidents and triage status', async () => {
      const emOverview = await apiRequest(baseUrl, '/api/emergency/overview?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(emOverview.status, 200);
      assert.ok(emOverview.data.totalIncidents !== undefined || emOverview.data.activeEmergencies !== undefined);

      const incidentsRes = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(incidentsRes.status, 200);
      assert.ok(Array.isArray(incidentsRes.data));
    });

    test('1.3 Digital Twin & Ward Prep: Retrieves room equipment readiness and telemetry', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(bedsRes.status, 200);
      assert.ok(Array.isArray(bedsRes.data));
      assert.ok(bedsRes.data.length > 0);

      // Verify digital twin for inpatient
      const twinRes = await apiRequest(baseUrl, '/api/patients/PT-8942/twin', {
        token: nurseToken
      });
      assert.equal(twinRes.status, 200);
      assert.ok(twinRes.data.vitals || twinRes.data.organSystems);
    });

    test('1.4 Automated Tasks & Workflows: Queries automated nursing rules and execution logs', async () => {
      const rulesRes = await apiRequest(baseUrl, '/api/workflows/definitions?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(rulesRes.status, 200);
      assert.ok(Array.isArray(rulesRes.data));

      const execRes = await apiRequest(baseUrl, '/api/workflows/executions?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(execRes.status, 200);
      assert.ok(Array.isArray(execRes.data));
    });

    test('1.5 My Ward: Retrieves assigned inpatients with vital signs and attending physician', async () => {
      const patientsRes = await apiRequest(baseUrl, '/api/patients?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(patientsRes.status, 200);
      assert.ok(Array.isArray(patientsRes.data));
      const pt = patientsRes.data.find(p => p.id === 'PT-8942' || p.patient_id === 'PT-8942');
      assert.ok(pt, 'Inpatient PT-8942 should exist in ward census');
      assert.ok(pt.name);
    });

    test('1.6 Bed Turnaround: Advances bed status through 6-stage lifecycle', async () => {
      const bedId = 'bed-103';
      const stageRes = await apiRequest(baseUrl, `/api/beds/${bedId}/turnaround`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'cleaning',
          notes: 'Terminal cleaning underway by housekeeping'
        }
      });
      assert.equal(stageRes.status, 200);
      assert.ok(stageRes.data.success);
      assert.equal(stageRes.data.bed.turnaround_stage, 'cleaning');
      assert.equal(stageRes.data.bed.turnaround_updated_by, 'Nurse Revathi S., Senior RN');
    });

    test('1.7 Clinical Tasks & MAR: Retrieves orders and medication records', async () => {
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(tasksRes.status, 200);
      assert.ok(Array.isArray(tasksRes.data));

      const marRes = await apiRequest(baseUrl, '/api/medication-administrations?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(marRes.status, 200);
      assert.ok(Array.isArray(marRes.data));
    });

    test('1.8 Equipment Checklist: Retrieves device inventory and creates biomedical requisition', async () => {
      const eqRes = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(eqRes.status, 200);
      assert.ok(Array.isArray(eqRes.data));

      const reqRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'equipment',
          resourceName: 'Syringe Infusion Pump',
          quantity: 2,
          urgency: 'Urgent',
          department: 'ICU Nursing',
          reason: 'Replacement for faulty pump in ICU Bay 4'
        }
      });
      assert.equal(reqRes.status, 201);
      assert.ok(reqRes.data.id);
    });

    test('1.9 Shift Handover Log: Retrieves auto-draft and queries handover archive', async () => {
      const draftRes = await apiRequest(baseUrl, '/api/handovers/draft?hospitalId=hosp-chn-01&ward=ICU%20Block%20A', {
        token: nurseToken
      });
      assert.equal(draftRes.status, 200);
      assert.ok(draftRes.data.situation);
      assert.ok(draftRes.data.recommendation);

      const hoRes = await apiRequest(baseUrl, '/api/handovers?hospitalId=hosp-chn-01', {
        token: nurseToken
      });
      assert.equal(hoRes.status, 200);
      assert.ok(Array.isArray(hoRes.data));
    });
  });

  // =========================================================================
  // STEP 3: END-TO-END NURSING WORKFLOWS (A THROUGH F)
  // =========================================================================
  describe('Part 2: End-to-End Nursing Workflows (A through F)', () => {
    // WORKFLOW A – NURSING TASK
    test('WORKFLOW A: Doctor creates task -> Nurse receives -> Nurse completes -> Doctor verifies', async () => {
      // 1. Doctor creates directive
      const taskRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          patientName: 'Murugan Selvam',
          ward: 'ICU Block A',
          bed: 'ICU-08',
          taskType: 'Lab Collection',
          instruction: 'STAT Arterial Blood Gas (ABG) post-extubation weaning trial.',
          priority: 'Urgent',
          assignedNurse: 'Nurse Revathi S., Senior RN'
        }
      });
      assert.equal(taskRes.status, 201);
      const taskId = taskRes.data.id;

      // 2. Nurse receives task
      const getRes = await apiRequest(baseUrl, `/api/clinical-tasks?hospitalId=hosp-chn-01`, {
        token: nurseToken
      });
      assert.equal(getRes.status, 200);
      const assigned = getRes.data.find(t => t.id === taskId);
      assert.ok(assigned);
      assert.equal(assigned.status, 'Pending');

      // 3. Nurse executes task
      const patchRes = await apiRequest(baseUrl, `/api/clinical-tasks/${taskId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          status: 'Completed',
          executionNotes: 'ABG collected via radial arterial line, heparinized syringe delivered to lab on ice.',
          vitalsRecorded: { hr: 76, spo2: 98 }
        }
      });
      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.data.task.status, 'Completed');

      // 4. Doctor verifies task status
      const verifyRes = await apiRequest(baseUrl, `/api/clinical-tasks?hospitalId=hosp-chn-01`, {
        token: doctorToken
      });
      assert.equal(verifyRes.status, 200);
      const completedTask = verifyRes.data.find(t => t.id === taskId);
      assert.equal(completedTask.status, 'Completed');
      assert.ok(completedTask.nurseObservation.includes('ABG collected'));
    });

    // WORKFLOW B – VITAL SIGNS
    test('WORKFLOW B: Nurse records observation -> Backend updates EMR & MEWS -> Doctor Dashboard displays update', async () => {
      const patientId = 'PT-8942';

      // 1. Nurse submits bedside observation
      const obsRes = await apiRequest(baseUrl, `/api/patients/${patientId}/observations`, {
        method: 'POST',
        token: nurseToken,
        body: {
          heartRate: 88,
          systolicBp: 122,
          diastolicBp: 78,
          spo2: 97,
          respiratoryRate: 18,
          temperature: 98.4,
          gcs: 15,
          painScore: 2,
          notes: 'Patient stable, tolerating high-flow nasal cannula at 30L/min.'
        }
      });
      assert.equal(obsRes.status, 201);
      assert.ok(obsRes.data.observationId);
      assert.ok(obsRes.data.mewsScore !== undefined);

      // 2. Doctor Dashboard retrieves patient observation history
      const docObsRes = await apiRequest(baseUrl, `/api/patient-observations?patientId=${patientId}`, {
        token: doctorToken
      });
      assert.equal(docObsRes.status, 200);
      assert.ok(Array.isArray(docObsRes.data));
      const latest = docObsRes.data[0];
      assert.equal(latest.patientId, patientId);
      assert.ok(latest.notes.includes('high-flow nasal cannula'));

      // 3. Verify Patient Digital Twin reflects updated vitals
      const twinRes = await apiRequest(baseUrl, `/api/patients/${patientId}/twin`, {
        token: doctorToken
      });
      assert.equal(twinRes.status, 200);
      assert.ok(twinRes.data.vitals || twinRes.data.mewsScore !== undefined);
    });

    // WORKFLOW C – BED TURNAROUND
    test('WORKFLOW C: Bed becomes occupied -> Discharged -> Cleaning -> Equipment Check -> Nurse Confirmation -> Ready', async () => {
      const bedId = 'bed-102';

      // 0. Ensure bed is in ready state before starting turnaround lifecycle
      await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: { newStatus: 'ready' }
      });

      // 1. Bed occupied
      const occRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'occupied',
          patientName: 'Kavitha R.',
          patientId: 'PT-9901',
          notes: 'Admitted from post-anesthesia recovery'
        }
      });
      assert.equal(occRes.status, 200);
      assert.equal(occRes.data.bed.status, 'occupied');

      // 2. Conflict prevention: another patient cannot occupy simultaneously
      const conflictRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'occupied',
          patientName: 'Ramesh P.',
          patientId: 'PT-9902'
        }
      });
      assert.equal(conflictRes.status, 409);

      // 3. Discharge process completes
      const disRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'discharged',
          notes: 'Patient successfully discharged home'
        }
      });
      assert.equal(disRes.status, 200);
      assert.equal(disRes.data.bed.status, 'discharged');

      // 4. Cleaning stage progresses
      const cleanRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'cleaning',
          notes: 'Terminal decontamination and linen turnover'
        }
      });
      assert.equal(cleanRes.status, 200);
      assert.equal(cleanRes.data.bed.status, 'cleaning');

      // 5. Equipment check stage
      const eqCheckRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'equipment_check',
          notes: 'Ventilator pre-use self-test completed'
        }
      });
      assert.equal(eqCheckRes.status, 200);
      assert.equal(eqCheckRes.data.bed.status, 'equipment_check');

      // 6. Nurse confirmation
      const confRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'nurse_confirmation',
          notes: 'Bedside suction, sterile tubing, and monitor leads verified'
        }
      });
      assert.equal(confRes.status, 200);
      assert.equal(confRes.data.bed.status, 'nurse_confirmation');

      // 7. Ready / Available for new admission
      const readyRes = await apiRequest(baseUrl, `/api/beds/${bedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'ready',
          notes: 'Operationally ready for next emergency admission'
        }
      });
      assert.equal(readyRes.status, 200);
      assert.equal(readyRes.data.bed.status, 'ready');
    });

    // WORKFLOW D – EQUIPMENT FAULT REPORTING
    test('WORKFLOW D: Nurse checklist -> Faulty reported -> Admin receives requisition & notification', async () => {
      // 1. Nurse identifies faulty device and requisitions replacement
      const reportRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          resourceType: 'equipment',
          resourceName: 'BiPAP Non-Invasive Ventilator',
          quantity: 1,
          urgency: 'Emergency',
          department: 'ICU Step-Down',
          reason: 'Pressure transducer calibration failure detected during morning checklist.'
        }
      });
      assert.equal(reportRes.status, 201);
      const reqId = reportRes.data.id;
      assert.ok(reqId);

      // 2. Admin inspects requests queue
      const adminReqRes = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        token: adminToken
      });
      assert.equal(adminReqRes.status, 200);
      const reqItem = adminReqRes.data.find(r => r.id === reqId);
      assert.ok(reqItem);
      assert.equal(reqItem.urgency, 'Critical');

      // 3. Admin receives notification
      const notifRes = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', {
        token: adminToken
      });
      assert.equal(notifRes.status, 200);
      assert.ok(Array.isArray(notifRes.data));
    });

    // WORKFLOW E – SHIFT HANDOVER
    test('WORKFLOW E: SBAR auto-draft -> Narcotics & crash cart verification -> Submission -> Relieving nurse acknowledgment', async () => {
      // 1. Auto-draft SBAR from telemetry
      const draftRes = await apiRequest(baseUrl, '/api/handovers/draft?hospitalId=hosp-chn-01&ward=ICU%20Block%20A', {
        token: nurseToken
      });
      assert.equal(draftRes.status, 200);
      assert.ok(draftRes.data.situation);
      assert.ok(draftRes.data.background);
      assert.ok(draftRes.data.assessment);
      assert.ok(draftRes.data.recommendation);

      // 2. Submit SBAR handover document
      const submitRes = await apiRequest(baseUrl, '/api/handovers', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          ward: 'ICU Block A',
          outgoingNurse: 'Nurse Revathi S., Senior RN',
          incomingNurse: 'Nurse Priya M., BSN',
          shiftType: 'Day to Evening (14:00 - 22:00)',
          patientCount: draftRes.data.censusCount || 4,
          criticalPatients: ['PT-8942'],
          situation: draftRes.data.situation,
          background: draftRes.data.background,
          assessment: draftRes.data.assessment,
          recommendation: draftRes.data.recommendation,
          notes: 'Narcotics count double-checked with incoming staff.',
          checklistCompleted: true,
          narcoticsCountVerified: true,
          crashCartChecked: true
        }
      });
      assert.equal(submitRes.status, 201);
      const handoverId = submitRes.data.id;
      assert.ok(handoverId);

      // 3. Receiving nurse acknowledges receipt
      const ackRes = await apiRequest(baseUrl, `/api/handovers/${handoverId}/acknowledge`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          acknowledgedBy: 'Nurse Priya M., BSN',
          notes: 'Handover received. Controlled substance cabinet verified.'
        }
      });
      assert.equal(ackRes.status, 200);
      assert.equal(ackRes.data.status, 'Acknowledged');
      assert.ok((ackRes.data.acknowledgedBy || ackRes.data.acknowledged_by || '').includes('Nurse Priya M.'));
    });

    // WORKFLOW F – EMERGENCY INCIDENT & RESOURCE DISPATCH
    test('WORKFLOW F: Emergency alert created -> Clinician allocates resources -> Ward beds & staff synchronized', async () => {
      // 1. Emergency incident created
      const incRes = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          hospitalId: 'hosp-chn-01',
          incidentType: 'Trauma Code Red',
          severity: 'Critical',
          location: 'Highway Collision Sector 4',
          patientCount: 1,
          description: 'Polytrauma with bilateral chest contusions and severe hypovolemic shock.'
        }
      });
      assert.equal(incRes.status, 201);
      const incidentId = incRes.data.id;
      assert.ok(incidentId);

      // 2. Ensure target bed is ready and allocate emergency bed & ventilator
      await apiRequest(baseUrl, '/api/beds/bed-102/status', {
        method: 'PATCH',
        token: nurseToken,
        body: { newStatus: 'ready' }
      });

      const allocRes = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        token: doctorToken,
        body: {
          bedId: 'bed-102',
          ventilatorId: 'vent-01',
          notes: 'STAT ICU trauma admission'
        }
      });
      assert.equal(allocRes.status, 200);
      assert.ok(allocRes.data.success);

      // 3. Nurse views updated active emergencies
      const nurseIncRes = await apiRequest(baseUrl, `/api/emergency/incidents?hospitalId=hosp-chn-01`, {
        token: nurseToken
      });
      assert.equal(nurseIncRes.status, 200);
      const targetInc = nurseIncRes.data.find(i => i.id === incidentId);
      assert.ok(targetInc);
      assert.equal(targetInc.allocated_bed_id, 'bed-102');
    });
  });

  // =========================================================================
  // STEP 4: SECURITY & RBAC TESTING
  // =========================================================================
  describe('Part 3: Security, RBAC & Multi-Tenant Isolation', () => {
    test('Security 1: Nurses strictly blocked from creating or modifying doctor prescriptions (HTTP 403)', async () => {
      const rxRes = await apiRequest(baseUrl, '/api/prescriptions', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          diagnosis: 'Sepsis',
          medications: [{ name: 'Meropenem', dose: '1g IV Q8H' }]
        }
      });
      assert.equal(rxRes.status, 403, 'Nurse must receive 403 Forbidden on prescription creation');
    });

    test('Security 2: Nurses blocked from finalizing clinical discharge summaries (HTTP 403)', async () => {
      const disRes = await apiRequest(baseUrl, '/api/discharge-summaries', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          summary: 'Unauthorized discharge attempt'
        }
      });
      assert.equal(disRes.status, 403, 'Nurse must receive 403 Forbidden on discharge summaries');
    });

    test('Security 3: Cross-hospital isolation prevents nurse from updating resources at other hospital (HTTP 403)', async () => {
      const crossRes = await apiRequest(baseUrl, '/api/beds/bed-101/status', {
        method: 'PATCH',
        token: otherHospitalNurseToken,
        body: {
          newStatus: 'ready'
        }
      });
      assert.equal(crossRes.status, 403, 'Cross-hospital resource update must return 403 Forbidden');
    });

    test('Security 4: Rejects unphysiological vital observations (HTTP 400)', async () => {
      // Non-physiological SpO2
      const badSpo2 = await apiRequest(baseUrl, '/api/patients/PT-8942/observations', {
        method: 'POST',
        token: nurseToken,
        body: { spo2: 125 }
      });
      assert.equal(badSpo2.status, 400);

      // Non-physiological SBP
      const badSbp = await apiRequest(baseUrl, '/api/patients/PT-8942/observations', {
        method: 'POST',
        token: nurseToken,
        body: { systolicBp: 15 }
      });
      assert.equal(badSbp.status, 400);
    });

    test('Security 5: Electronic MAR enforces 5-Rights check for administered doses', async () => {
      const unverifiedMedRes = await apiRequest(baseUrl, '/api/medication-administrations', {
        method: 'POST',
        token: nurseToken,
        body: {
          hospitalId: 'hosp-chn-01',
          patientId: 'PT-8942',
          medicationName: 'Gentamicin IV',
          dose: '240mg IV',
          route: 'IV Infusion',
          status: 'Administered',
          fiveRightsVerified: false
        }
      });
      assert.equal(unverifiedMedRes.status, 400);
      assert.ok(unverifiedMedRes.data.error.includes('5-Rights'));
    });

    test('Security 6: Rejects unauthenticated requests to nurse endpoints with HTTP 401', async () => {
      const unauthRes = await apiRequest(baseUrl, '/api/medication-administrations', {
        method: 'POST',
        body: {}
      });
      assert.equal(unauthRes.status, 401);
    });
  });
});
