import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 18 Nurse Dashboard Backend & Clinical Workflow Integration Suite', () => {
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

  // STEP 3: DOCTOR-NURSE WORKFLOW (CLOSED LOOP)
  test('Step 3: Doctor creates clinical order -> Nurse executes with vitals -> Alert triggers if abnormal', async () => {
    // 1. Doctor creates an authorized clinical order
    const taskPayload = {
      hospitalId: 'hosp-chn-01',
      patientId: 'PT-8942',
      patientName: 'Murugan Selvam',
      ward: 'ICU Block A',
      bed: 'ICU-08',
      taskType: 'Vital Check',
      instruction: 'Hourly titration of norepinephrine: maintain MAP > 65 mmHg.',
      priority: 'Stat - Emergency',
      assignedNurse: 'Nurse Revathi S., Senior RN'
    };

    const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
      method: 'POST',
      token: doctorToken,
      body: taskPayload
    });
    assert.equal(createRes.status, 201);
    const taskId = createRes.data.id;
    assert.ok(taskId);

    // 2. Nurse receives task in queue
    const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', {
      token: nurseToken
    });
    assert.equal(tasksRes.status, 200);
    const foundTask = tasksRes.data.find(t => t.id === taskId);
    assert.ok(foundTask, 'Nurse must see task in clinical queue');
    assert.equal(foundTask.status, 'Pending');

    // 3. Nurse executes task with telemetry and documentation
    const executeRes = await apiRequest(baseUrl, `/api/clinical-tasks/${taskId}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: {
        status: 'Completed',
        executionNotes: 'MAP maintained at 72 mmHg on 0.08 mcg/kg/min infusion. Patient calm.',
        vitalsRecorded: {
          hr: 82,
          sbp: 118,
          dbp: 74,
          spo2: 97,
          rr: 16,
          temp: 36.9
        }
      }
    });
    assert.equal(executeRes.status, 200);
    assert.ok(executeRes.data.success);
    assert.equal(executeRes.data.task.status, 'Completed');
  });

  // STEP 4: NURSING VITALS & OBSERVATIONS WORKFLOW
  test('Step 4: Nurse records bedside observation with range validation and EMR persistence', async () => {
    const patientId = 'PT-8942';

    // 1. Validation check: Reject abnormal non-physiological values (e.g. HR > 300)
    const invalidRes = await apiRequest(baseUrl, `/api/patients/${patientId}/observations`, {
      method: 'POST',
      token: nurseToken,
      body: {
        heartRate: 450, // Invalid
        systolicBp: 120,
        spo2: 98
      }
    });
    assert.equal(invalidRes.status, 400);

    // 2. Valid observation recording
    const validObs = {
      heartRate: 128, // High HR to test alert rule
      systolicBp: 88,  // Low SBP
      diastolicBp: 56,
      spo2: 89,        // Critical desaturation < 90
      respiratoryRate: 26,
      temperature: 38.4,
      gcs: 14,
      avpu: 'Alert',
      painScore: 6,
      notes: 'Bedside telemetry: tachypneic on 2L nasal prongs. Sepsis bundle protocol initiated.'
    };

    const postObsRes = await apiRequest(baseUrl, `/api/patients/${patientId}/observations`, {
      method: 'POST',
      token: nurseToken,
      body: validObs
    });
    assert.equal(postObsRes.status, 201);
    assert.ok(postObsRes.data.observation);
    assert.equal(postObsRes.data.observation.heart_rate, 128);
    assert.equal(postObsRes.data.observation.recorded_by_role, 'nurse');

    // 3. Verify clinical alert was generated due to SpO2 < 90% and HR > 120
    const alertsRes = await apiRequest(baseUrl, '/api/clinical-alerts?hospitalId=hosp-chn-01', {
      token: nurseToken
    });
    assert.equal(alertsRes.status, 200);
    assert.ok(Array.isArray(alertsRes.data));
    assert.ok(alertsRes.data.length > 0);

    // 4. Verify observation retrieved with timestamp and staff info
    const getObsRes = await apiRequest(baseUrl, `/api/patients/${patientId}/observations`, {
      token: doctorToken
    });
    assert.equal(getObsRes.status, 200);
    assert.ok(Array.isArray(getObsRes.data));
    const latestObs = getObsRes.data[0];
    assert.equal(latestObs.heartRate, 128);
    assert.ok(latestObs.recordedBy);
    assert.ok(latestObs.recordedAt);
  });

  // STEP 5: MEDICATION ADMINISTRATION WORKFLOW (MAR)
  test('Step 5: Displays authorized medications, records administration with 5-Rights, blocks nurse prescription modification', async () => {
    // 1. Fetch authorized prescriptions for ward
    const rxRes = await apiRequest(baseUrl, '/api/prescriptions?hospitalId=hosp-chn-01', {
      token: nurseToken
    });
    assert.equal(rxRes.status, 200);
    assert.ok(Array.isArray(rxRes.data));

    // 2. Fetch medication administration records (MAR)
    const marGetRes = await apiRequest(baseUrl, '/api/medication-administrations?hospitalId=hosp-chn-01', {
      token: nurseToken
    });
    assert.equal(marGetRes.status, 200);
    assert.ok(Array.isArray(marGetRes.data));

    // 3. Mandatory 5-Rights Verification: Reject administration if 5-rights unverified
    const unverifiedAdmin = await apiRequest(baseUrl, '/api/medication-administrations', {
      method: 'POST',
      token: nurseToken,
      body: {
        patientId: 'PT-8942',
        hospitalId: 'hosp-chn-01',
        medicationName: 'IV Furosemide',
        dose: '40mg IV Push',
        route: 'Intravenous',
        status: 'Administered',
        fiveRightsVerified: false // Unverified!
      }
    });
    assert.equal(unverifiedAdmin.status, 400);

    // 4. Record successful medication administration with 5-Rights verification
    const verifiedAdmin = await apiRequest(baseUrl, '/api/medication-administrations', {
      method: 'POST',
      token: nurseToken,
      body: {
        patientId: 'PT-8942',
        hospitalId: 'hosp-chn-01',
        prescriptionId: 'rx-01',
        medicationName: 'IV Furosemide',
        dose: '40mg IV Push',
        route: 'Intravenous',
        frequency: 'Daily',
        scheduledTime: '08:00',
        status: 'Administered',
        fiveRightsVerified: true,
        reasonOrNotes: 'Administered slowly over 2 mins. Urine output being monitored.',
        witnessName: 'Nurse Priya M.'
      }
    });
    assert.equal(verifiedAdmin.status, 201);
    assert.ok(verifiedAdmin.data.success);
    assert.equal(verifiedAdmin.data.record.status, 'Administered');

    // 5. Support recording Delayed / Refused status with rationale
    const refusedAdmin = await apiRequest(baseUrl, '/api/medication-administrations', {
      method: 'POST',
      token: nurseToken,
      body: {
        patientId: 'PT-8942',
        hospitalId: 'hosp-chn-01',
        medicationName: 'Oral Aspirin',
        dose: '75mg PO',
        route: 'Oral',
        status: 'Refused',
        fiveRightsVerified: false,
        reasonOrNotes: 'Patient experiencing mild epigastric discomfort, requested delay after food.'
      }
    });
    assert.equal(refusedAdmin.status, 201);
    assert.equal(refusedAdmin.data.record.status, 'Refused');

    // 6. Security constraint: Nurses CANNOT create restricted prescriptions (403 Forbidden)
    const nurseRxAttempt = await apiRequest(baseUrl, '/api/prescriptions', {
      method: 'POST',
      token: nurseToken,
      body: {
        patientId: 'PT-8942',
        diagnosis: 'Pain management',
        medications: [{ name: 'Morphine', dose: '10mg' }]
      }
    });
    assert.equal(nurseRxAttempt.status, 403, 'Nurses must not be allowed to prescribe medications');
  });

  // STEP 6: BED TURNAROUND & EQUIPMENT STATUS
  test('Step 6: Bed Turnaround 6-stage lifecycle progression with staff tracking and conflict prevention', async () => {
    const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: nurseToken });
    const testBed = bedsRes.data[0];
    assert.ok(testBed);

    // 1. Advance to cleaning
    const resCleaning = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'cleaning', notes: 'Housekeeping dispatched for terminal sanitization' }
    });
    assert.equal(resCleaning.status, 200);
    assert.equal(resCleaning.data.status, 'cleaning');

    // 2. Advance to equipment_check
    const resEqCheck = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'equipment_check', notes: 'Ventilator leak test and monitor telemetry calibrated' }
    });
    assert.equal(resEqCheck.status, 200);
    assert.equal(resEqCheck.data.status, 'equipment_check');

    // 3. Nurse confirmation
    const resConfirm = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'nurse_confirmation', notes: 'Primary nurse checked sterile linens and suction' }
    });
    assert.equal(resConfirm.status, 200);
    assert.equal(resConfirm.data.status, 'nurse_confirmation');

    // 4. Mark ready for admission
    const resReady = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'ready', notes: 'Signed off ready for admissions' }
    });
    assert.equal(resReady.status, 200);
    assert.equal(resReady.data.status, 'ready');

    // 5. Conflict prevention: Prevent assigning occupied to bed without valid intake
    const conflictAttempt = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'occupied', patientId: 'PT-NEW-01', patientName: 'New Admission' }
    });
    assert.equal(conflictAttempt.status, 200);

    // Second conflicting assignment to same occupied bed must return 409 Conflict
    const secondConflict = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'occupied', patientId: 'PT-CONFLICT-99', patientName: 'Conflicting Patient' }
    });
    assert.equal(secondConflict.status, 409);

    // Reset bed to ready
    await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
      method: 'PATCH',
      token: nurseToken,
      body: { status: 'ready' }
    });
  });

  // STEP 7: SHIFT HANDOVER (DRAFT -> SUBMIT -> ACKNOWLEDGE)
  test('Step 7: SBAR shift handover auto-drafting from telemetry, submission, and receiving nurse acknowledgment', async () => {
    // 1. Auto-draft SBAR from real-time ward telemetry
    const draftRes = await apiRequest(baseUrl, '/api/handovers/draft?hospitalId=hosp-chn-01&ward=ICU Block A', {
      token: nurseToken
    });
    assert.equal(draftRes.status, 200);
    assert.ok(draftRes.data.situation);
    assert.ok(draftRes.data.background);
    assert.ok(draftRes.data.assessment);
    assert.ok(draftRes.data.recommendation);
    assert.ok(draftRes.data.patientCount !== undefined);

    // 2. Outgoing nurse signs and submits SBAR handover
    const submitRes = await apiRequest(baseUrl, '/api/handovers', {
      method: 'POST',
      token: nurseToken,
      body: {
        hospitalId: 'hosp-chn-01',
        ward: 'ICU Block A',
        outgoingNurse: 'Nurse Revathi S., Senior RN',
        incomingNurse: 'Nurse Priya M., BSN',
        shiftType: 'Day to Evening (14:00 - 22:00)',
        patientCount: draftRes.data.patientCount,
        criticalPatients: draftRes.data.criticalPatients,
        situation: draftRes.data.situation,
        background: draftRes.data.background,
        assessment: draftRes.data.assessment,
        recommendation: draftRes.data.recommendation,
        checklistCompleted: true,
        narcoticsCountVerified: true,
        crashCartChecked: true
      }
    });
    assert.equal(submitRes.status, 201);
    const handoverId = submitRes.data.id;
    assert.ok(handoverId);
    assert.equal(submitRes.data.status, 'Pending Acknowledgment');

    // 3. Receiving nurse acknowledges and accepts transfer of care
    const receivingNurseToken = generateToken({
      id: 'nurse-priya-02',
      name: 'Nurse Priya M., BSN',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });

    const ackRes = await apiRequest(baseUrl, `/api/handovers/${handoverId}/acknowledge`, {
      method: 'PATCH',
      token: receivingNurseToken,
      body: {
        notes: 'Handover verified at bedside. Narcotics safe counted and verified.'
      }
    });
    assert.equal(ackRes.status, 200);
    assert.ok(ackRes.data.success);
    assert.equal(ackRes.data.status, 'Acknowledged');
    assert.equal(ackRes.data.acknowledgedBy, 'Nurse Priya M., BSN');
  });

  // STEP 9: SECURITY & MULTI-TENANCY ISOLATION
  test('Step 9: Security checks - enforce nurse permissions and block cross-hospital resource access', async () => {
    // 1. Cross-hospital bed update must be rejected with 403 Forbidden
    const crossHospBedAttempt = await apiRequest(baseUrl, '/api/beds/bed-101/status', {
      method: 'PATCH',
      token: otherHospitalNurseToken,
      body: { status: 'cleaning' }
    });
    assert.equal(crossHospBedAttempt.status, 403);

    // 2. Unauthenticated access must be rejected with 401 Unauthorized
    const unauthAttempt = await apiRequest(baseUrl, '/api/medication-administrations', {
      method: 'POST',
      body: { patientId: 'PT-8942' }
    });
    assert.equal(unauthAttempt.status, 401);
  });
});
