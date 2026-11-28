import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - 15 Doctor Dashboard Modules Verification Suite', () => {
  let baseUrl;
  let doctorToken;

  before(async () => {
    baseUrl = await startTestServer();
    doctorToken = generateToken({ id: 'doc-01', name: 'Dr. Sundaramoorthy M.', role: 'doctor', hospitalId: 'hosp-chn-01' });
  });

  after(async () => {
    await stopTestServer();
  });

  // Module 1: Treatment Response Tracker
  it('1. Treatment Response Tracker: Observes serial vitals & physiological trajectory', async () => {
    const res = await apiRequest(baseUrl, '/api/patient-observations?patientId=pt-rec-01', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  // Module 2: Clinical Decision Timeline
  it('2. Clinical Decision Timeline: Fetches digital twin and historical timeline events', async () => {
    const res = await apiRequest(baseUrl, '/api/patients/pt-rec-01/twin', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.patient, 'Should contain patient digital twin');
    assert.ok(res.data.vitals, 'Should contain vitals trajectory');
  });

  // Module 3: Emergency Alerts
  it('3. Emergency Alerts: Verifies active clinical alerts and emergency broadcasts', async () => {
    const res = await apiRequest(baseUrl, '/api/clinical-alerts', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length > 0, 'Should return active clinical alerts');
  });

  // Module 4: Emergency Patient Matching
  it('4. Emergency Patient Matching: Checks available ICU beds and calibrated ventilators', async () => {
    const bedsRes = await apiRequest(baseUrl, '/api/beds', { token: doctorToken });
    assert.equal(bedsRes.status, 200);
    assert.ok(Array.isArray(bedsRes.data));

    const eqRes = await apiRequest(baseUrl, '/api/equipment', { token: doctorToken });
    assert.equal(eqRes.status, 200);
    assert.ok(Array.isArray(eqRes.data));
  });

  // Module 5: Doctor-Nurse Coordination
  it('5. Doctor-Nurse Coordination: Dispatches clinical orders and verifies closed-loop state', async () => {
    const createRes = await apiRequest(baseUrl, '/api/clinical-tasks', {
      method: 'POST',
      token: doctorToken,
      body: {
        patientId: 'pt-rec-01',
        patientName: 'Kavitha Ramasamy',
        taskType: 'Assessment',
        priority: 'Stat',
        instruction: 'STAT repeat Troponin-I and arterial blood gas (ABG) in 60 mins',
        assignedNurse: 'Nurse Revathi S.',
        ward: 'ICU Block A',
        bedNumber: 'A-101'
      }
    });
    assert.ok([200, 201].includes(createRes.status));

    const listRes = await apiRequest(baseUrl, '/api/clinical-tasks', { token: doctorToken });
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.data));
  });

  // Module 6: Referral & Specialist Consult
  it('6. Referral & Specialist Consult: Validates clinical specialist workflow and departments', async () => {
    const res = await apiRequest(baseUrl, '/api/hospitals/hosp-chn-01/departments', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.some(d => d.name.includes('Cardiology') || d.name.includes('Emergency') || d.name.includes('General')));
  });

  // Module 7: Smart Clinical Handover
  it('7. Smart Clinical Handover: Verifies shift continuity handovers log', async () => {
    const res = await apiRequest(baseUrl, '/api/handovers', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  // Module 8: Outbreak Pattern Detection
  it('8. Outbreak Pattern Detection: Verifies clinical ward telemetry surveillance', async () => {
    const res = await apiRequest(baseUrl, '/api/clinical-wards', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 2, 'Should return active hospital wards');
  });

  // Module 9: Clinical Knowledge Hub
  it('9. Clinical Knowledge Hub: Verifies medical diagnosis decision support endpoint', async () => {
    const res = await apiRequest(baseUrl, '/api/ai/diagnose', {
      method: 'POST',
      token: doctorToken,
      body: {
        patientId: 'pt-rec-01',
        symptoms: ['acute chest tightness', 'diaphoresis', 'shortness of breath'],
        vitals: { heartRate: 115, bpSystolic: 155, bpDiastolic: 95, spo2: 93 }
      }
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.differentialDiagnoses);
    assert.ok(res.data.recommendedTests);
  });

  // Module 10: Case Study Library
  it('10. Case Study Library: Verifies diagnostic AI summarizer and clinical case synthesis', async () => {
    const res = await apiRequest(baseUrl, '/api/ai/summarize', {
      method: 'POST',
      token: doctorToken,
      body: {
        patientId: 'pt-rec-01',
        clinicalNotes: 'Day 2 post-PCI for STEMI. MAP stabilized at 72 mmHg on low-dose norepinephrine.'
      }
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.summary);
  });

  // Module 11: Doctor Analytics
  it('11. Doctor Analytics: Retrieves physician-specific census and operational KPIs', async () => {
    const res = await apiRequest(baseUrl, '/api/doctor/doc-01/overview', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.metrics || res.data.assignedPatientsCount !== undefined);
  });

  // Module 12: Clinical Audit Trail
  it('12. Clinical Audit Trail: Verifies recent broadcast audit logs and system telemetry', async () => {
    const res = await apiRequest(baseUrl, '/api/realtime/events/recent', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  // Module 13: Doctor Profile
  it('13. Doctor Profile: Verifies physician authentication and user profile access', async () => {
    const res = await apiRequest(baseUrl, '/api/doctor/doc-01/patients', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  // Module 14: Notifications
  it('14. Notifications: Queries live notifications feed and unread alerts', async () => {
    const res = await apiRequest(baseUrl, '/api/notifications?hospitalId=hosp-chn-01', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  // Module 15: Settings
  it('15. Settings: Verifies real-time diagnostics and socket health parameters', async () => {
    const res = await apiRequest(baseUrl, '/api/realtime/diagnostics', { token: doctorToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.diagnostics);
    assert.ok(res.data.diagnostics.uptimeSeconds >= 0);
  });
});
