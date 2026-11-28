import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - API Health & Endpoint Verification Suite', () => {
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

  // 1. System Health & Realtime Diagnostics
  describe('1. Core System Health Endpoints', () => {
    it('GET /api/health returns operational status', async () => {
      const res = await apiRequest(baseUrl, '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'healthy');
      assert.ok(res.data.uptime !== undefined);
      assert.ok(res.data.database === 'connected');
    });

    it('GET /api/realtime/health returns websocket metrics', async () => {
      const res = await apiRequest(baseUrl, '/api/realtime/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'healthy');
      assert.ok(typeof res.data.activeSockets === 'number');
    });

    it('GET /api/realtime/diagnostics returns latency and memory stats', async () => {
      const res = await apiRequest(baseUrl, '/api/realtime/diagnostics');
      assert.equal(res.status, 200);
      assert.ok(res.data.diagnostics);
      assert.ok(res.data.diagnostics.uptimeSeconds >= 0);
    });

    it('GET /api/realtime/events/recent returns recent broadcast audit log', async () => {
      const res = await apiRequest(baseUrl, '/api/realtime/events/recent');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });
  });

  // 2. Hospital & Bed Management Endpoints
  describe('2. Hospital & Bed Management Endpoints', () => {
    it('GET /api/hospitals returns list of active medical centers', async () => {
      const res = await apiRequest(baseUrl, '/api/hospitals');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0);
      const rgggh = res.data.find(h => h.id === 'hosp-chn-01');
      assert.ok(rgggh, 'hosp-chn-01 must be present');
    });

    it('GET /api/hospitals/:id returns hospital details', async () => {
      const res = await apiRequest(baseUrl, '/api/hospitals/hosp-chn-01');
      assert.equal(res.status, 200);
      assert.equal(res.data.id, 'hosp-chn-01');
    });

    it('GET /api/beds returns bed inventory for hospital', async () => {
      const res = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length > 0);
      assert.ok(res.data[0].bed_number !== undefined);
    });

    it('GET /api/beds/summary returns aggregated bed capacities', async () => {
      const res = await apiRequest(baseUrl, '/api/beds/summary?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.total !== undefined);
    });

    it('PATCH /api/beds/:id/status updates bed status with realtime broadcast', async () => {
      // Find a valid bed id first
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const targetBed = bedsRes.data[0];
      assert.ok(targetBed, 'Should have at least one bed in DB');

      const originalStatus = targetBed.status;
      const testStatus = originalStatus === 'available' ? 'cleaning' : 'available';

      const patchRes = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { newStatus: testStatus, reason: 'Automated QA test transition' }
      });
      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.data.success, true);
      assert.equal(patchRes.data.status, testStatus);

      // Revert status
      await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { newStatus: originalStatus, reason: 'Reverting QA state' }
      });
    });
  });

  // 3. Resource Requests & Equipment Endpoints
  describe('3. Resource Requests & Equipment Endpoints', () => {
    it('GET /api/requests returns list of resource requests', async () => {
      const res = await apiRequest(baseUrl, '/api/requests?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/requests/stats returns request metrics', async () => {
      const res = await apiRequest(baseUrl, '/api/requests/stats?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.total !== undefined);
    });

    it('GET /api/equipment returns hospital equipment inventory', async () => {
      const res = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });
  });

  // 4. Doctor Dashboard - 16 Clinical Views & APIs
  describe('4. Doctor Dashboard Clinical APIs', () => {
    it('GET /api/doctor/:id/overview returns doctor-specific clinical metrics', async () => {
      const res = await apiRequest(baseUrl, '/api/doctor/doc-01/overview', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.doctor);
      assert.ok(res.data.metrics);
      assert.ok(typeof res.data.metrics.assignedPatientsCount === 'number');
    });

    it('GET /api/doctor/:id/patients returns assigned patients', async () => {
      const res = await apiRequest(baseUrl, '/api/doctor/doc-01/patients', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/appointments returns patient appointments', async () => {
      const res = await apiRequest(baseUrl, '/api/appointments?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/clinical-wards returns list of hospital wards', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-wards?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/patients/:id/twin returns Patient Digital Twin data model', async () => {
      const res = await apiRequest(baseUrl, '/api/patients/pt-rec-01/twin', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.patient);
      assert.ok(res.data.organSystems);
      assert.ok(res.data.vitals);
      assert.ok(typeof res.data.deteriorationRisk === 'number');
    });

    it('GET /api/patient-observations returns patient vital telemetry', async () => {
      const res = await apiRequest(baseUrl, '/api/patient-observations?patientId=pt-rec-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/lab-orders returns diagnostic laboratory reports', async () => {
      const res = await apiRequest(baseUrl, '/api/lab-orders?patientId=pt-rec-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/prescriptions returns digital prescriptions', async () => {
      const res = await apiRequest(baseUrl, '/api/prescriptions?patientId=pt-rec-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/care-plans returns patient clinical care pathways', async () => {
      const res = await apiRequest(baseUrl, '/api/care-plans?patientId=pt-rec-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/discharge-summaries returns discharge protocols', async () => {
      const res = await apiRequest(baseUrl, '/api/discharge-summaries?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/clinical-tasks returns doctor-ordered clinical tasks', async () => {
      const res = await apiRequest(baseUrl, '/api/clinical-tasks?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/patients/:id/radar returns Deterioration Radar telemetry', async () => {
      const res = await apiRequest(baseUrl, '/api/patients/pt-rec-01/radar', {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.radarAxes);
      assert.ok(typeof res.data.overallRiskScore === 'number');
    });

    it('POST /api/ai/diagnose provides AI-driven differential diagnostic suggestions', async () => {
      const res = await apiRequest(baseUrl, '/api/ai/diagnose', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
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

    it('POST /api/ai/medication-check screens for adverse drug-drug interactions', async () => {
      const res = await apiRequest(baseUrl, '/api/ai/medication-check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
        body: {
          patientId: 'pt-rec-01',
          newMedication: 'Warfarin 5mg',
          currentMedications: ['Aspirin 75mg', 'Atorvastatin 20mg']
        }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.interactions);
      assert.ok(typeof res.data.severity === 'string');
    });

    it('POST /api/ai/summarize synthesizes clinical timeline into structured summary', async () => {
      const res = await apiRequest(baseUrl, '/api/ai/summarize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${doctorToken}` },
        body: {
          patientId: 'pt-rec-01',
          clinicalNotes: ['Patient presented with STEMI. Underwent PCI with DES to LAD. Hemodynamically stable on dual antiplatelet therapy.']
        }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.summary);
      assert.ok(res.data.keyFindings);
    });
  });

  // 5. Nurse Dashboard Endpoints
  describe('5. Nurse Dashboard Endpoints', () => {
    it('GET /api/nurse/:id/patients returns nurse assigned patients', async () => {
      const res = await apiRequest(baseUrl, '/api/nurse/nur-01/patients', {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/nurse/:id/tasks returns nursing tasks', async () => {
      const res = await apiRequest(baseUrl, '/api/nurse/nur-01/tasks', {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/handovers returns shift handover logs', async () => {
      const res = await apiRequest(baseUrl, '/api/handovers?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${nurseToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });
  });

  // 6. Emergency Command Center Endpoints
  describe('6. Emergency Command Center Endpoints', () => {
    it('GET /api/emergency/overview returns emergency capacity snapshot', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/overview?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.criticalMetrics);
      assert.ok(res.data.emergencyCapacity);
    });

    it('GET /api/emergency/incidents returns active emergency incidents', async () => {
      const res = await apiRequest(baseUrl, '/api/emergency/incidents?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });
  });

  // 7. Workflow Automation Center Endpoints
  describe('7. Workflow Automation Center Endpoints', () => {
    it('GET /api/workflows/definitions returns configurable rules', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/definitions?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/workflows/executions returns automation execution history', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/executions?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('GET /api/workflows/stats returns execution metrics & pass rate', async () => {
      const res = await apiRequest(baseUrl, '/api/workflows/stats?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.totalExecutions !== undefined);
      assert.ok(res.data.successRate !== undefined);
    });
  });

  // 8. Hospital Interoperability & Health Data Exchange (FHIR & ABDM)
  describe('8. Hospital Interoperability & FHIR Endpoints', () => {
    it('GET /api/interop/overview returns FHIR gateway health and connected nodes', async () => {
      const res = await apiRequest(baseUrl, '/api/interop/overview?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.gatewayStatus);
      assert.ok(res.data.connectedSystems);
    });

    it('GET /api/interop/fhir/Patient returns standardized HL7 FHIR R4 Patient Bundle', async () => {
      const res = await apiRequest(baseUrl, '/api/interop/fhir/Patient?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.resourceType, 'Bundle');
      assert.equal(res.data.type, 'searchset');
      assert.ok(Array.isArray(res.data.entry));
    });

    it('GET /api/interop/abdm/consents returns ABDM consent artefacts', async () => {
      const res = await apiRequest(baseUrl, '/api/interop/abdm/consents?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data));
    });

    it('POST /api/interop/fhir-validate validates HL7 FHIR schema constraints', async () => {
      const validPatient = {
        resourceType: 'Patient',
        name: [{ use: 'official', family: 'Ramasamy', given: ['Kavitha'] }],
        gender: 'female',
        birthDate: '1985-06-12'
      };

      const res = await apiRequest(baseUrl, '/api/interop/fhir-validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { resource: validPatient }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.valid, true);
      assert.equal(res.data.errorCount, 0);
    });

    it('POST /api/interop/fhir-validate flags invalid FHIR resources', async () => {
      const invalidPatient = {
        resourceType: 'Patient'
        // Missing name and gender
      };

      const res = await apiRequest(baseUrl, '/api/interop/fhir-validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { resource: invalidPatient }
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.valid, false);
      assert.ok(res.data.errors.length > 0);
    });
  });
});
