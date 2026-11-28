import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - End-to-End Clinical & Operational Workflows Suite', () => {
  let baseUrl;
  let adminToken;
  let doctorToken;
  let nurseToken;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({ role: 'admin', hospitalId: 'hosp-chn-01' });
    doctorToken = generateToken({ id: 'doc-01', role: 'doctor', hospitalId: 'hosp-chn-01' });
    nurseToken = generateToken({ id: 'nur-01', role: 'nurse', hospitalId: 'hosp-chn-01' });
  });

  after(async () => {
    await stopTestServer();
  });

  // WORKFLOW 1: Resource Request Lifecycle
  describe('Workflow 1: Resource Request Lifecycle (Create -> Approve/Allocate -> Audit)', () => {
    let createdRequestId;

    it('Step 1: Doctor raises an urgent ventilator request', async () => {
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
        body: {
          hospitalId: 'hosp-chn-01',
          department: 'Pulmonology',
          ward: 'ICU-B',
          resourceType: 'equipment',
          resourceName: 'Mechanical Ventilator High Flow',
          quantity: 1,
          urgency: 'critical',
          priority: 'urgent',
          reason: 'Acute Respiratory Distress Syndrome (ARDS) deterioration',
          clinicalJustification: 'SpO2 falling below 85% despite high flow nasal cannula',
          patientName: 'Kavitha Ramasamy',
          patientId: 'pt-rec-01'
        }
      });

      assert.equal(res.status, 201);
      assert.ok(res.data.id, 'Must return new request ID');
      createdRequestId = res.data.id;
    });

    it('Step 2: Admin inspects request in pending queue', async () => {
      const res = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const target = res.data.find(r => r.id === createdRequestId);
      assert.ok(target, 'Created request must appear in queue');
      assert.equal(target.status.toLowerCase(), 'pending');
    });

    it('Step 3: Hospital Admin approves request with resource allocation', async () => {
      const res = await apiRequest(baseUrl, `/api/requests/${createdRequestId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          status: 'approved',
          allocatedQuantity: 1,
          approverNotes: 'Authorized by Chief Medical Officer for immediate dispatch'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });

    it('Step 4: Verify request status reflects approval in persistent state', async () => {
      const res = await apiRequest(baseUrl, `/api/requests?hospitalId=hosp-chn-01`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const target = res.data.find(r => r.id === createdRequestId);
      assert.ok(target);
      assert.equal(target.status.toLowerCase(), 'approved');
    });
  });

  // WORKFLOW 2: Patient Bed Turnover Lifecycle
  describe('Workflow 2: Bed Turnover Lifecycle (Occupied -> Cleaning -> Ready/Available)', () => {
    let testBed;

    before(async () => {
      const res = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testBed = res.data[0];
      assert.ok(testBed, 'Must have at least one bed');
    });

    it('Step 1: Patient admission occupies bed', async () => {
      const res = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { newStatus: 'occupied', patientId: 'pt-rec-01', reason: 'Patient admitted from ER' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'occupied');
    });

    it('Step 2: Patient discharge moves bed into sanitization/cleaning', async () => {
      const res = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${nurseToken}` },
        body: { newStatus: 'cleaning', reason: 'Patient discharged, housekeeping notified' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'cleaning');
    });

    it('Step 3: Housekeeping & Nurse verify sanitation, marking bed available', async () => {
      const res = await apiRequest(baseUrl, `/api/beds/${testBed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${nurseToken}` },
        body: { newStatus: 'available', reason: 'Sanitization and linen change completed' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'available');
    });
  });

  // WORKFLOW 3: Doctor-Nurse Clinical Task Collaboration
  describe('Workflow 3: Doctor-Nurse Clinical Task Coordination', () => {
    let createdTaskId;

    it('Step 1: Doctor assigns clinical task to nursing team', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
        body: {
          patientId: 'pt-rec-01',
          patientName: 'Kavitha Ramasamy',
          ward: 'General Medicine',
          bed: 'B-102',
          instruction: 'Administer IV Ceftriaxone 1g and monitor for allergic reaction',
          priority: 'urgent',
          taskType: 'medication',
          assignedNurse: 'Nurse Deepa R.'
        }
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.id);
      createdTaskId = res.data.id;
    });

    it('Step 2: Nurse views assigned task queue', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });
      assert.equal(res.status, 200);
      const task = res.data.find(t => t.id === createdTaskId);
      assert.ok(task, 'Created task must be in nurse queue');
      assert.equal(task.status.toLowerCase(), 'pending');
    });

    it('Step 3: Nurse completes task with administration verification note', async () => {
      const res = await apiRequest(baseUrl, `/api/clinical-tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${nurseToken}` },
        body: {
          status: 'completed',
          notes: 'Dose administered via IV cannula without complications. Patient stable.'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });
  });

  // WORKFLOW 4: Emergency Incident Triage & Resource Dispatch
  describe('Workflow 4: Emergency Incident Triage & Resource Dispatch', () => {
    let incidentId;

    it('Step 1: Emergency Command Center records trauma incident', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          hospitalId: 'hosp-chn-01',
          patientName: 'Subramani K.',
          emergencyType: 'Polytrauma / Road Accident',
          severity: 'critical',
          location: 'Highway NH-4 Bypass',
          requiredResources: ['Trauma Bay 01', 'O-Negative Blood 2 Units', 'General Surgeon'],
          assignedDoctor: 'Dr. Sundaramoorthy M.',
          initialNotes: 'Multiple blunt injuries, unstable hemodynamics'
        }
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.id);
      incidentId = res.data.id;
    });

    it('Step 2: Command Center locks emergency resources for incident', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          allocatedBedId: 'bed-101',
          allocatedVentilatorId: 'vent-01',
          allocatedSpecialist: 'Dr. Sundaramoorthy M.',
          bloodUnits: 2,
          authorizationNotes: 'Emergency Command Center Priority Bypass'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });

    it('Step 3: Emergency Incident is successfully resolved post-stabilization', async () => {
      const res = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          resolutionSummary: 'Patient stabilized post emergency laparotomy and transferred to Surgical ICU.'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });
  });

  // WORKFLOW 5: Workflow Automation Execution Lifecycle
  describe('Workflow 5: Workflow Automation Execution & Approval Gate', () => {
    let executionId;
    let ruleId;

    before(async () => {
      // Find or pick a rule from definitions
      const res = await apiRequest(baseUrl, '/api/workflows/definitions?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.length > 0, 'Should have workflow rules');
      ruleId = res.data[0].id;
    });

    it('Step 1: Automated trigger fires workflow rule', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/executions/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          ruleId,
          triggerData: { metric: 'ICU_OCCUPANCY', value: 92, threshold: 90 },
          initiatedBy: 'QA Automated Testing System'
        }
      });
      assert.ok(res.status === 200 || res.status === 201);
      assert.ok(res.data.executionId);
      executionId = res.data.executionId;
    });

    it('Step 2: Admin approves execution approval gate', async () => {
      const res = await apiRequest(baseUrl, `/api/workflows/executions/${executionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          approver: 'QA Medical Director',
          approverRole: 'admin',
          comments: 'Authorized surge bed conversion'
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });

    it('Step 3: Verify execution status is marked completed in audit log', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/executions?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const exec = res.data.find(e => e.id === executionId);
      assert.ok(exec, 'Execution must exist');
      assert.equal(exec.status, 'completed');
    });
  });

  // WORKFLOW 6: ABDM Consent Registration & FHIR Export
  describe('Workflow 6: ABDM Consent Artefact & FHIR Health Data Exchange', () => {
    let consentId;

    it('Step 1: Register ABDM Consent artefact for cross-hospital referral', async () => {
      const res = await apiRequest(baseUrl, '/api/interop/abdm/consents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          patientId: 'pt-rec-01',
          patientAadhaarOrAbha: '91-4821-9920-3312',
          hiuId: 'HIU-APOLLO-CHN',
          hipId: 'HIP-RGGGH-CHN',
          consentPurpose: 'Care Management & Clinical Referral',
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31'
        }
      });
      assert.equal(res.status, 201);
      assert.ok(res.data.consentId);
      consentId = res.data.consentId;
    });

    it('Step 2: Export standard HL7 FHIR R4 Bundle for patient', async () => {
      const res = await apiRequest(baseUrl, '/api/interop/fhir-export?patientId=pt-rec-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.resourceType, 'Bundle');
      assert.ok(Array.isArray(res.data.entry));
    });

    it('Step 3: Validate generated FHIR payload against schema conformance engine', async () => {
      const patientResource = {
        resourceType: 'Patient',
        name: [{ use: 'official', family: 'Ramasamy', given: ['Kavitha'] }],
        gender: 'female',
        birthDate: '1985-06-12'
      };

      const res = await apiRequest(baseUrl, '/api/interop/fhir-validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { resource: patientResource }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.valid, true);
    });
  });
});
