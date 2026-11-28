import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 20 Emergency Command Center Completion Suite', () => {
  let baseUrl;
  let doctorToken;
  let adminToken;
  let nurseToken;
  let otherHospitalDoctorToken;

  before(async () => {
    baseUrl = await startTestServer();
    doctorToken = generateToken({
      id: 'doc-sundar-01',
      name: 'Dr. Sundaramoorthy M., Clinical Director',
      role: 'doctor',
      hospitalId: 'hosp-chn-01'
    });
    adminToken = generateToken({
      id: 'admin-01',
      name: 'Hospital Command Admin',
      role: 'admin',
      hospitalId: 'hosp-chn-01'
    });
    nurseToken = generateToken({
      id: 'nurse-deepa-01',
      name: 'Nurse Deepa R., Triage RN',
      role: 'nurse',
      hospitalId: 'hosp-chn-01'
    });
    otherHospitalDoctorToken = generateToken({
      id: 'doc-cbe-02',
      name: 'Dr. External Surgeon',
      role: 'doctor',
      hospitalId: 'hosp-cbe-02'
    });
  });

  // =========================================================================
  // WORKFLOW 1: EMERGENCY INCIDENT REPORTING & TRIAGE SCORING
  // =========================================================================
  describe('Workflow 1: Incident Reporting, Severity Scoring & Initial Detection', () => {
    let createdIncidentId;

    test('1.1 Should report emergency trauma incident with severity Level 1 (Code Red)', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          emergencyType: 'Polytrauma & Thoracic Crush',
          severity: 'Level 1 (Code Red)',
          location: 'Resuscitation Bay 01',
          patientName: 'Emergency Trauma Victim 2026',
          requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative Blood'],
          assignedDoctor: 'Dr. Sundaramoorthy M.',
          initialNotes: 'Unrestrained MVA passenger with severe thoracic trauma and respiratory compromise.'
        }
      });

      assert.equal(res.status, 201);
      assert.ok(res.data.incident);
      assert.equal(res.data.incident.emergency_type, 'Polytrauma & Thoracic Crush');
      assert.equal(res.data.incident.severity, 'Level 1 (Code Red)');
      assert.equal(res.data.incident.status, 'Reported');
      assert.equal(res.data.incident.priority_score, 1);
      assert.ok(res.data.matchingAnalysis);

      createdIncidentId = res.data.incident.id || res.data.incident.incident_id;
    });

    test('1.2 Rejects emergency incident without mandatory clinical parameters', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          patientName: 'Incomplete Patient Record'
          // Missing emergencyType, severity, location
        }
      });

      assert.equal(res.status, 400);
      assert.ok(res.data.error);
    });

    test('1.3 Fetches incident queue and verifies active incident is listed', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const found = res.data.find(i => i.id === createdIncidentId || i.incidentId === createdIncidentId);
      assert.ok(found, 'Created emergency incident must appear in the incident queue');
      assert.equal(found.status, 'Reported');
    });
  });

  // =========================================================================
  // WORKFLOW 2: MANDATORY CLINICAL JUSTIFICATION ON PRIORITY ADJUSTMENT
  // =========================================================================
  describe('Workflow 2: Mandatory Clinical Justification on Priority Adjustment', () => {
    let incidentIdForPriority;

    before(async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          emergencyType: 'Acute Coronary Syndrome',
          severity: 'Level 2 (Code Orange)',
          location: 'Triage Bay 02',
          patientName: 'Kavitha S. (Cardiac)',
          requiredResources: ['ICU Bed', 'Cardiologist']
        }
      });
      incidentIdForPriority = res.data.incident.id;
    });

    test('2.1 Rejects priority adjustment when clinical justification is missing or empty', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentIdForPriority}/priority`, {
        method: 'PATCH',
        token: doctorToken,
        body: {
          priorityScore: 1,
          severity: 'Level 1 (Code Red)',
          justification: '' // Blank justification must be rejected
        }
      });

      assert.equal(res.status, 400);
      assert.ok(res.data.error.includes('Mandatory clinical justification is required'));
    });

    test('2.2 Accepts priority adjustment with clinical rationale and logs to audit timeline', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentIdForPriority}/priority`, {
        method: 'PATCH',
        token: doctorToken,
        body: {
          priorityScore: 1,
          severity: 'Level 1 (Code Red)',
          justification: 'Telemetry shows acute anterior STEMI with persistent ST-elevation and hemodynamic instability.'
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.incident.priority_score, 1);
      assert.equal(res.data.incident.severity, 'Level 1 (Code Red)');

      const timeline = JSON.parse(res.data.incident.timeline || '[]');
      const event = timeline.find(e => e.action === 'Priority Adjusted');
      assert.ok(event, 'Timeline must contain Priority Adjusted entry');
      assert.ok(event.notes.includes('acute anterior STEMI'));
    });
  });

  // =========================================================================
  // WORKFLOW 3: INTELLIGENT RESOURCE MATCHING ANALYSIS
  // =========================================================================
  describe('Workflow 3: Intelligent Resource Matching Analysis', () => {
    test('3.1 Fetches single incident detail and validates AI matching analysis recommendations', async () => {
      const listRes = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.ok(listRes.data.length > 0);
      const target = listRes.data[0];

      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${target.id}`, {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.incident);
      assert.ok(res.data.matchingAnalysis);

      const analysis = res.data.matchingAnalysis;
      assert.ok(typeof analysis.availableIcuCount === 'number');
      assert.ok(typeof analysis.availableVentilatorsCount === 'number');
      assert.ok(analysis.bloodBankStock);
      assert.ok(Array.isArray(analysis.matches));
    });

    test('3.2 Emergency analytics snapshot provides capacity metrics and breakdown', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/analytics?hospitalId=hosp-chn-01', {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      assert.ok(typeof res.data.totalIncidents === 'number');
      assert.ok(typeof res.data.activeEmergencies === 'number');
      assert.ok(typeof res.data.availableIcuBeds === 'number');
      assert.ok(typeof res.data.availableVentilators === 'number');
      assert.ok(Array.isArray(res.data.incidentsByType));
    });
  });

  // =========================================================================
  // WORKFLOW 4: HUMAN CLINICAL AUTHORIZATION GATE & CONFLICT PREVENTION
  // =========================================================================
  describe('Workflow 4: Human-in-the-Loop Authorization Gate & Safety Conflict Prevention', () => {
    let incidentForAllocation;

    before(async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          emergencyType: 'Acute Respiratory Failure & ARDS',
          severity: 'Level 1 (Code Red)',
          location: 'Emergency Bay 03',
          patientName: 'Subramanian V. (ARDS)',
          requiredResources: ['ICU Bed', 'Mechanical Ventilator']
        }
      });
      incidentForAllocation = res.data.incident;
    });

    test('4.1 Blocks non-authorized roles (e.g. nurse) from resource allocation gate', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentForAllocation.id}/allocate-resources`, {
        method: 'POST',
        token: nurseToken, // Nurse is not authorized to finalize resource allocation
        body: {
          allocatedBedId: 'bed-102'
        }
      });

      assert.equal(res.status, 403);
    });

    test('4.2 Detects allocation conflict (HTTP 409) if the requested bed is already occupied', async () => {
      // Find a bed that is already occupied
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: doctorToken });
      const occupiedBed = bedsRes.data.find(b => b.status === 'occupied' && b.patient_id);

      if (occupiedBed) {
        const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentForAllocation.id}/allocate-resources`, {
          method: 'POST',
          token: doctorToken,
          body: {
            allocatedBedId: occupiedBed.id,
            authorizationNotes: 'Attempting to allocate occupied bed'
          }
        });

        assert.equal(res.status, 409);
        assert.ok(res.data.error.includes('Already occupied by another patient'));
      }
    });

    test('4.3 Doctor authorizes resource allocation with ready bed, ventilator & generates nurse intake task', async () => {
      // Find ready bed
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: doctorToken });
      let readyBed = bedsRes.data.find(b => b.status === 'ready' || b.status === 'Available');

      if (!readyBed) {
        // Prepare bed-103 as ready
        await apiRequest(baseUrl, '/api/beds/bed-103/status', {
          method: 'PATCH',
          token: adminToken,
          body: { status: 'ready', notes: 'Emergency readiness verified' }
        });
        readyBed = { id: 'bed-103', bed_number: 'ICU-11' };
      }

      // Find ventilator
      const eqRes = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', { token: doctorToken });
      const vent = eqRes.data.find(e => e.category === 'Ventilator') || { id: 'eq-vent-01' };

      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentForAllocation.id}/allocate-resources`, {
        method: 'POST',
        token: doctorToken,
        body: {
          allocatedBedId: readyBed.id,
          allocatedVentilatorId: vent.id,
          authorizationNotes: `Clinician verified allocation of Bed ${readyBed.bed_number} and Servo-U Ventilator.`
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.incident.status, 'Resources Allocated');

      // Verify allocated bed is marked occupied
      const updatedBedRes = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, { token: doctorToken });
      const checkedBed = updatedBedRes.data.find(b => b.id === readyBed.id);
      assert.equal(checkedBed.status, 'occupied');
      assert.equal(checkedBed.patient_name, incidentForAllocation.patient_name);

      // Verify Nurse task was generated
      const tasksRes = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', { token: nurseToken });
      const intakeTask = tasksRes.data.find(t => t.patient_id === incidentForAllocation.patient_id && t.task_type === 'Emergency Intake');
      assert.ok(intakeTask, 'Clinical nurse intake task must be automatically dispatched');
      assert.equal(intakeTask.priority, 'Stat (Immediate)');
    });
  });

  // =========================================================================
  // WORKFLOW 5: CLOSED-LOOP INCIDENT RESOLUTION & BED RELEASE
  // =========================================================================
  describe('Workflow 5: Closed-Loop Incident Resolution & Resource Release', () => {
    let resolvedIncidentId;
    let targetBedId = 'bed-103';

    before(async () => {
      // Create incident and allocate bed
      const incRes = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          emergencyType: 'Anaphylactic Shock & Upper Airway Edema',
          severity: 'Level 1 (Code Red)',
          location: 'Bay 04',
          patientName: 'Ramesh K. (Anaphylaxis)',
          requiredResources: ['Emergency Bay']
        }
      });
      resolvedIncidentId = incRes.data.incident.id;

      await apiRequest(baseUrl, `/api/emergency/incidents/${resolvedIncidentId}/allocate-resources`, {
        method: 'POST',
        token: doctorToken,
        body: {
          allocatedBedId: targetBedId,
          authorizationNotes: 'Emergency Bay locked for epinephrine infusion'
        }
      });
    });

    test('5.1 Resolves incident with clinical stabilization notes and releases bed', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${resolvedIncidentId}/resolve`, {
        method: 'POST',
        token: doctorToken,
        body: {
          resolutionSummary: 'Patient responded to IM Epinephrine & IV Hydrocortisone. Airway edema resolved. Transferred to stepdown monitoring.',
          resolvedBy: 'Dr. Sundaramoorthy M.',
          releaseBed: true,
          bedId: targetBedId
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.incident.status, 'Resolved');
      assert.ok(res.data.incident.resolution_summary.includes('Airway edema resolved'));

      // Verify bed is released to ready status
      const bedRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: doctorToken });
      const releasedBed = bedRes.data.find(b => b.id === targetBedId);
      assert.equal(releasedBed.status, 'ready');
      assert.equal(releasedBed.patient_name, null);
    });

    test('5.2 Resolved incident appears with Resolved status in incident queue', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${resolvedIncidentId}`, {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.incident.status, 'Resolved');
      assert.ok(res.data.incident.timeline.some(e => e.action === 'Incident Resolved'));
    });
  });

  // =========================================================================
  // WORKFLOW 6: SIMULATION SCENARIOS ENGINE & SANDBOX ISOLATION
  // =========================================================================
  describe('Workflow 6: Simulation Scenarios Engine & Sandbox Isolation', () => {
    test('6.1 Triggers Mass Casualty Incident (MCI) simulation scenario', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/simulate-scenario', {
        method: 'POST',
        token: doctorToken,
        body: { scenario: 'mass_casualty' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.scenario, 'mass_casualty');
      assert.ok(res.data.incidents.length >= 3);
      assert.ok(res.data.incidents.every(i => i.isSimulated === true));
    });

    test('6.2 Production incident query filters out simulated incidents by default', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      const simulatedInQueue = res.data.filter(i => i.isSimulated === true || i.incidentId.startsWith('SIM-'));
      assert.equal(simulatedInQueue.length, 0, 'Production query must not include simulated sandbox incidents');
    });

    test('6.3 Query with includeSimulated=true correctly surfaces sandbox incidents', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01&includeSimulated=true', {
        token: doctorToken
      });

      assert.equal(res.status, 200);
      const simulatedInQueue = res.data.filter(i => i.isSimulated === true || i.incidentId.startsWith('SIM-'));
      assert.ok(simulatedInQueue.length >= 3, 'Must surface simulated incidents when includeSimulated=true');
    });

    test('6.4 Simulated resource allocation keeps live hospital beds and equipment untouched', async () => {
      // Get simulated incident
      const simList = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01&includeSimulated=true', { token: doctorToken });
      const simInc = simList.data.find(i => i.isSimulated === true);
      assert.ok(simInc, 'Simulated incident must exist');

      // Check current status of bed-101
      const bedsBefore = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: doctorToken });
      const bed101Before = bedsBefore.data.find(b => b.id === 'bed-101');
      const originalStatus = bed101Before.status;

      // Allocate in simulated sandbox mode
      const allocRes = await apiRequest(baseUrl, `/api/emergency/incidents/${simInc.id}/allocate-resources`, {
        method: 'POST',
        token: doctorToken,
        body: {
          allocatedBedId: 'bed-101',
          isSimulated: true,
          authorizationNotes: 'Simulated sandbox allocation test'
        }
      });

      assert.equal(allocRes.status, 200);
      assert.equal(allocRes.data.simulated, true);

      // Verify live bed status in database was NOT modified
      const bedsAfter = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', { token: doctorToken });
      const bed101After = bedsAfter.data.find(b => b.id === 'bed-101');
      assert.equal(bed101After.status, originalStatus, 'Production bed status must remain unchanged during sandbox simulation');
    });

    test('6.5 Simulation reset clears all sandbox incidents cleanly', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/simulate-scenario', {
        method: 'POST',
        token: adminToken,
        body: { scenario: 'reset' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);

      const simList = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01&includeSimulated=true', { token: doctorToken });
      const remainingSim = simList.data.filter(i => i.isSimulated === true);
      assert.equal(remainingSim.length, 0, 'Reset must clear all simulated incidents');
    });
  });

  // =========================================================================
  // WORKFLOW 7: SECURITY, RBAC & MULTI-TENANT ISOLATION
  // =========================================================================
  describe('Workflow 7: Security, RBAC & Multi-Tenant Hospital Isolation', () => {
    test('7.1 Rejects unauthenticated access to emergency creation with HTTP 401', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        body: { emergencyType: 'Unauthenticated Request' }
      });
      assert.equal(res.status, 401);
    });

    test('7.2 Prevents cross-hospital data access for emergency incident queues', async () => {
      const hosp1Res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        token: doctorToken
      });
      assert.equal(hosp1Res.status, 200);

      const hosp2Res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-cbe-02', {
        token: otherHospitalDoctorToken
      });
      assert.equal(hosp2Res.status, 200);

      // Verify incidents from hospital 1 do not leak into hospital 2
      const hosp1Ids = new Set(hosp1Res.data.map(i => i.id));
      for (const h2Inc of hosp2Res.data) {
        assert.ok(!hosp1Ids.has(h2Inc.id), 'Hospital 1 incident must not bleed into Hospital 2 queue');
      }
    });
  });
});
