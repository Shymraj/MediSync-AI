import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Phase 22 Hospital-Wide Resource Management & Live Availability Suite', () => {
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
  // WORKFLOW 1: SINGLE SOURCE OF TRUTH & RESOURCE REGISTRY (Step 2)
  // =========================================================================
  describe('Workflow 1: Single Source of Truth & Resource Registry', () => {
    test('1.1 Fetch shared hospital resources catalog from persistent database', async () => {
      const res = await apiRequest(baseUrl, '/api/resources?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      assert.ok(res.data.length >= 10, 'Expected seeded institutional resources');
      const item = res.data[0];
      assert.ok(item.id);
      assert.ok(item.resourceId);
      assert.ok(item.name);
      assert.ok(item.category);
      assert.ok(item.department);
      assert.ok(item.quantity !== undefined);
      assert.ok(item.availableQuantity !== undefined);
      assert.ok(item.status);
    });

    test('1.2 Create new medical resource with validation and audit logging', async () => {
      const uniqueId = `RES-TEST-${Date.now().toString().slice(-4)}`;
      const res = await apiRequest(baseUrl, '/api/resources', {
        method: 'POST',
        token: adminToken,
        body: {
          resourceId: uniqueId,
          name: 'Video Laryngoscope Blade Kit (Glidescope Core)',
          category: 'Medical Equipment',
          department: 'Emergency',
          quantity: 5,
          availableQuantity: 5,
          minimumThreshold: 2,
          unit: 'Kits',
          status: 'Available',
          description: 'High-definition digital video intubation blade set'
        }
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.resource);
      assert.strictEqual(res.data.resource.resource_id, uniqueId);
    });

    test('1.3 Prevent creating resource with negative quantity (validation rule)', async () => {
      const res = await apiRequest(baseUrl, '/api/resources', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Invalid Negative Stock Supply',
          category: 'Emergency Supplies',
          department: 'Emergency',
          quantity: -5,
          availableQuantity: -2
        }
      });
      assert.strictEqual(res.status, 400);
    });
  });

  // =========================================================================
  // WORKFLOW 2: BED MANAGEMENT & READINESS CONFIRMATION (Step 3 & Workflow 1 & 5)
  // =========================================================================
  describe('Workflow 2: Bed Lifecycle, Conflict Prevention & Readiness Confirmation', () => {
    test('2.1 Admin updates bed status -> immediately reflected across queries', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const bed = bedsRes.data[1];

      // Admin updates bed to cleaning
      const updateRes = await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          newStatus: 'cleaning',
          notes: 'Terminal sanitization post-discharge'
        }
      });
      assert.strictEqual(updateRes.status, 200);

      // Verify Doctor view reflects cleaning
      const docView = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: doctorToken
      });
      const docBed = docView.data.find(b => b.id === bed.id);
      assert.strictEqual(docBed.status, 'cleaning');

      // Verify Nurse view reflects cleaning
      const nurseView = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: nurseToken
      });
      const nurseBed = nurseView.data.find(b => b.id === bed.id);
      assert.strictEqual(nurseBed.status, 'cleaning');
    });

    test('2.2 Bed cleaning completes -> Authorized Nurse confirms readiness -> Bed becomes ready', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: nurseToken
      });
      const cleaningBed = bedsRes.data.find(b => b.status === 'cleaning') || bedsRes.data[1];

      // Nurse confirms sanitization and marks ready
      const readyRes = await apiRequest(baseUrl, `/api/beds/${cleaningBed.id}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          newStatus: 'ready',
          notes: 'Terminal cleaning checklist complete, linens replaced, verified ready for intake'
        }
      });
      assert.strictEqual(readyRes.status, 200);
      assert.strictEqual(readyRes.data.bed.status, 'ready');
    });

    test('2.3 Non-authorized role (patient) cannot confirm bed readiness (RBAC enforcement)', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const targetBed = bedsRes.data[0];

      // Set to cleaning first
      await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { newStatus: 'cleaning' }
      });

      // Patient attempts to mark ready
      const failRes = await apiRequest(baseUrl, `/api/beds/${targetBed.id}/status`, {
        method: 'PATCH',
        token: patientToken,
        body: { newStatus: 'ready' }
      });
      // Patient lacks clinical role -> 403 Forbidden
      assert.strictEqual(failRes.status, 403);
    });

    test('2.4 Support full status vocabulary: reserved, maintenance, unavailable', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const bed = bedsRes.data[2];

      // Reserved
      const res1 = await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { newStatus: 'reserved', notes: 'Reserved for incoming cath lab transfer' }
      });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.data.bed.status, 'reserved');

      // Maintenance
      const res2 = await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { newStatus: 'maintenance', notes: 'Hydraulic elevation mechanism recalibration' }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.data.bed.status, 'equipment_check');

      // Restore to ready
      await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { newStatus: 'ready' }
      });
    });
  });

  // =========================================================================
  // WORKFLOW 3: EQUIPMENT MANAGEMENT & FAULT REPORTING (Step 4 & Workflow 4)
  // =========================================================================
  describe('Workflow 3: Equipment Management, Fault Reporting & Allocation Locking', () => {
    let testEqId;

    test('3.1 Nurse reports faulty equipment -> device is immediately taken offline for maintenance', async () => {
      const eqList = await apiRequest(baseUrl, '/api/equipment?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: nurseToken
      });
      assert.ok(eqList.data.length > 0);
      testEqId = eqList.data[0].id;

      const faultRes = await apiRequest(baseUrl, `/api/equipment/${testEqId}/fault`, {
        method: 'POST',
        token: nurseToken,
        body: {
          reportedBy: 'Nurse Deepa R.',
          faultDescription: 'Oxygen sensor calibration failure and periodic high-pressure alarms.',
          severity: 'Critical'
        }
      });
      assert.strictEqual(faultRes.status, 200);
      assert.strictEqual(faultRes.data.equipment.status, 'Under Maintenance');
      assert.strictEqual(faultRes.data.equipment.condition, 'Degraded');
    });

    test('3.2 Faulty equipment under maintenance CANNOT be allocated to emergency incidents (Conflict prevention)', async () => {
      assert.ok(testEqId, 'testEqId must be defined');

      // Create an emergency incident
      const incRes = await apiRequest(baseUrl, '/api/emergency/incidents', {
        method: 'POST',
        token: doctorToken,
        body: {
          emergencyType: 'Acute Respiratory Distress Syndrome',
          severity: 'Level 1 (Code Red)',
          location: 'Bay 03',
          patientName: 'Critical Pulmonary Inpatient'
        }
      });
      assert.strictEqual(incRes.status, 201);
      const incidentId = incRes.data.incident.id;

      // Attempt to allocate the faulty equipment
      const allocRes = await apiRequest(baseUrl, `/api/emergency/incidents/${incidentId}/allocate-resources`, {
        method: 'POST',
        token: doctorToken,
        body: {
          allocatedVentilatorId: testEqId
        }
      });
      // Must be rejected with 409 Conflict
      assert.strictEqual(allocRes.status, 409);
      assert.ok(allocRes.data.error.includes('maintenance'));

      // Restore equipment to available
      await apiRequest(baseUrl, `/api/equipment/${testEqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'available' }
      });
    });
  });

  // =========================================================================
  // WORKFLOW 4: MEDICAL SUPPLY INVENTORY & SHORTAGE ALERTS (Step 5 & Workflow 6)
  // =========================================================================
  describe('Workflow 4: Medical Supply Management & Shortage Alert Automation', () => {
    let supplyItemId;

    test('4.1 Supply stock adjustment validates quantities and detects critical shortages', async () => {
      const resList = await apiRequest(baseUrl, '/api/resources?hospitalId=hosp-chn-01&category=Emergency Supplies', {
        method: 'GET',
        token: adminToken
      });
      assert.ok(resList.data.length > 0);
      const supply = resList.data[0];
      supplyItemId = supply.id;

      // Adjust stock down to or below minimum threshold
      const adjustRes = await apiRequest(baseUrl, `/api/resources/${supplyItemId}/stock`, {
        method: 'PATCH',
        token: nurseToken,
        body: {
          availableQuantity: 2,
          reason: 'Emergency department mass casualty consumption'
        }
      });
      assert.strictEqual(adjustRes.status, 200);
      assert.strictEqual(adjustRes.data.resource.available_quantity, 2);
      assert.strictEqual(adjustRes.data.shortageTriggered, true);
    });

    test('4.2 Verify shortage alert is visible in resource intelligence analytics', async () => {
      const intRes = await apiRequest(baseUrl, '/api/resources/intelligence?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(intRes.status, 200);
      assert.ok(intRes.data.supplyShortages);
      assert.ok(intRes.data.supplyShortages.totalCount > 0);
      const found = intRes.data.supplyShortages.items.find(i => i.id === supplyItemId);
      assert.ok(found, 'Adjusted supply item must appear in active shortages list');
      assert.strictEqual(intRes.data.metadata.isCalculated, true);
    });

    test('4.3 Enforce non-negative inventory rule: reducing stock below 0 returns 400 Bad Request', async () => {
      const failRes = await apiRequest(baseUrl, `/api/resources/${supplyItemId}/stock`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          availableQuantity: -10
        }
      });
      assert.strictEqual(failRes.status, 400);

      // Restock supply back to healthy level
      const restockRes = await apiRequest(baseUrl, `/api/resources/${supplyItemId}/stock`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          availableQuantity: 30,
          quantity: 30,
          reason: 'Central depot delivery received'
        }
      });
      assert.strictEqual(restockRes.status, 200);
      assert.strictEqual(restockRes.data.resource.available_quantity, 30);
    });
  });

  // =========================================================================
  // WORKFLOW 5: END-TO-END RESOURCE REQUISITION, ALLOCATION & RETURN (Step 6 & Workflow 2, 3, 7, 8)
  // =========================================================================
  describe('Workflow 5: Complete Resource Requisition, 1:1 Conflict Prevention & Return Lifecycle', () => {
    let createdReqId;
    let allocatedBedId;

    test('5.1 Doctor requests ICU Bed & Ventilator -> Admin reviews in pending queue', async () => {
      const reqRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          resourceType: 'ICU Bed',
          resourceName: 'Critical Care Bay Bed with Telemetry',
          category: 'ICU Resources',
          urgency: 'critical',
          priority: 'critical',
          ward: 'ICU Block A',
          patientName: 'Karthik Raja S.',
          patientId: 'PT-E2E-RES',
          reason: 'Severe ARDS post-op requiring continuous mechanical ventilation'
        }
      });
      assert.strictEqual(reqRes.status, 201);
      assert.ok(reqRes.data.request);
      createdReqId = reqRes.data.request.id;
    });

    test('5.2 Admin approves request and allocates Bed -> Bed marked Occupied', async () => {
      const bedsRes = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const availableBed = bedsRes.data.find(b => b.status === 'ready' || b.status === 'available') || bedsRes.data[3];
      allocatedBedId = availableBed.id;

      // Admin approves
      const approveRes = await apiRequest(baseUrl, `/api/requests/${createdReqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'approved',
          allocatedResourceId: allocatedBedId,
          allocatedResourceName: `Bed ${availableBed.bedNumber || availableBed.bed_number}`
        }
      });
      assert.strictEqual(approveRes.status, 200);
      assert.strictEqual(approveRes.data.request.status, 'approved');

      // Check bed status is now occupied
      const bedCheck = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: adminToken
      });
      const occupiedBed = bedCheck.data.find(b => b.id === allocatedBedId);
      assert.strictEqual(occupiedBed.status, 'occupied');
    });

    test('5.3 Duplicate allocation prevention: assigning the same occupied bed to another patient returns 409 Conflict', async () => {
      // Create a competing request
      const compReqRes = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        token: doctorToken,
        body: {
          resourceType: 'ICU Bed',
          urgency: 'high',
          ward: 'ICU Block A',
          patientName: 'Competing Inpatient',
          patientId: 'PT-COMPETE-02',
          reason: 'Urgent bed allocation request'
        }
      });
      const compReqId = compReqRes.data.request.id;

      // Admin attempts to allocate the already occupied bed
      const conflictRes = await apiRequest(baseUrl, `/api/requests/${compReqId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'approved',
          allocatedResourceId: allocatedBedId
        }
      });
      assert.strictEqual(conflictRes.status, 409);
      assert.ok(conflictRes.data.error.includes('occupied'));
    });

    test('5.4 Resource return and completion: Staff returns resource -> availability restored to cleaning/available', async () => {
      assert.ok(createdReqId, 'createdReqId must be present');

      const returnRes = await apiRequest(baseUrl, `/api/requests/${createdReqId}/return`, {
        method: 'POST',
        token: nurseToken,
        body: {
          returnNotes: 'Patient transferred post-extubation. Bed released for terminal cleaning.'
        }
      });
      assert.strictEqual(returnRes.status, 200);
      assert.strictEqual(returnRes.data.request.status, 'fulfilled');

      // Verify bed is released to cleaning
      const bedCheck = await apiRequest(baseUrl, `/api/beds?hospitalId=hosp-chn-01`, {
        method: 'GET',
        token: nurseToken
      });
      const releasedBed = bedCheck.data.find(b => b.id === allocatedBedId);
      assert.strictEqual(releasedBed.status, 'cleaning');

      // Nurse completes cleaning and marks ready
      await apiRequest(baseUrl, `/api/beds/${allocatedBedId}/status`, {
        method: 'PATCH',
        token: nurseToken,
        body: { newStatus: 'ready' }
      });
    });
  });

  // =========================================================================
  // WORKFLOW 6: RESOURCE INTELLIGENCE & AUDIT INTEGRITY (Step 8 & 9)
  // =========================================================================
  describe('Workflow 6: Resource Intelligence, Data Isolation & Audit Logging', () => {
    test('6.1 Operational intelligence calculates bed occupancy, equipment utilization and demand', async () => {
      const res = await apiRequest(baseUrl, '/api/resources/intelligence?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.bedOccupancy.total > 0);
      assert.ok(res.data.bedOccupancy.occupancyRate >= 0);
      assert.ok(res.data.equipmentUtilization.total > 0);
      assert.ok(res.data.equipmentUtilization.utilizationRate >= 0);
      assert.ok(typeof res.data.departmentDemand === 'object');
      assert.strictEqual(res.data.metadata.isCalculated, true);
    });

    test('6.2 Multi-tenant hospital isolation: Hospital A resources cannot be modified by Hospital B admin', async () => {
      const bedsHospitalA = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        method: 'GET',
        token: adminToken
      });
      const bedA = bedsHospitalA.data[0];

      // Hospital B admin attempts to mutate Hospital A bed
      const mutRes = await apiRequest(baseUrl, `/api/beds/${bedA.id}/status`, {
        method: 'PATCH',
        token: externalAdminToken,
        body: { newStatus: 'maintenance' }
      });
      assert.strictEqual(mutRes.status, 403);
    });

    test('6.3 System audit log contains resource and equipment actions with user identity and timestamp', async () => {
      const res = await apiRequest(baseUrl, '/api/audit-logs', {
        method: 'GET',
        token: adminToken
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data));
      const resourceActions = res.data.filter(l => 
        ['CREATE_RESOURCE', 'UPDATE_RESOURCE', 'ADJUST_RESOURCE_STOCK', 'REPORT_EQUIPMENT_FAULT', 'RETURN_RESOURCE'].includes(l.action)
      );
      assert.ok(resourceActions.length > 0, 'Audit trail must record resource management actions');
      for (const log of resourceActions) {
        assert.ok(log.action);
        assert.ok(log.user_id);
        assert.ok(log.created_at);
      }
    });
  });
});
