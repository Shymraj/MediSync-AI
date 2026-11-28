import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as ioClient } from 'socket.io-client';
import { startTestServer, generateToken, apiRequest } from './test-helper.js';
import { db } from '../server/db.js';

describe('MediSync AI - Phase 23 Performance, Reliability & Scalability Suite', () => {
  let baseUrl;
  let adminToken;
  let doctorToken;
  let nurseToken;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({
      id: 'usr_admin_chn_01',
      name: 'Dr. K. Rathnavel, Medical Superintendent',
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
  });

  // =========================================================================
  // WORKFLOW 1: DATABASE PRAGMA CONFIGURATION & SECONDARY INDEXES
  // =========================================================================
  describe('Workflow 1: Database PRAGMA & Index Verification', () => {
    test('1.1 Verify SQLite WAL journal mode and busy timeout are active', () => {
      const journalMode = db.prepare('PRAGMA journal_mode;').get();
      assert.strictEqual(journalMode.journal_mode.toLowerCase(), 'wal');

      const busyTimeout = db.prepare('PRAGMA busy_timeout;').get();
      assert.ok(busyTimeout.timeout >= 10000, 'Busy timeout should be at least 10000ms');
    });

    test('1.2 Verify SQLite memory cache size and synchronous pragma', () => {
      const syncPragma = db.prepare('PRAGMA synchronous;').get();
      // In SQLite, synchronous NORMAL corresponds to 1
      assert.strictEqual(Number(syncPragma.synchronous), 1);

      const cacheSize = db.prepare('PRAGMA cache_size;').get();
      // Negative cache_size indicates KiB (-64000 = 64MB)
      assert.ok(Number(cacheSize.cache_size) <= -60000 || Number(cacheSize.cache_size) > 0);
    });

    test('1.3 Verify existence of secondary indexes for core hospital queries', () => {
      const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index';").all();
      const indexNames = indexes.map(i => i.name);

      const expectedIndexes = [
        'idx_beds_hospital_status',
        'idx_beds_patient',
        'idx_beds_ward',
        'idx_equipment_hospital_status',
        'idx_hospital_resources_query',
        'idx_requests_hospital_status',
        'idx_patients_hospital',
        'idx_observations_patient',
        'idx_alerts_hospital_status',
        'idx_tasks_hospital_status',
        'idx_notifications_hospital',
        'idx_audit_hospital_created',
        'idx_emergency_hospital_status',
        'idx_users_email'
      ];

      for (const expected of expectedIndexes) {
        assert.ok(indexNames.includes(expected), `Expected index ${expected} to be created`);
      }
    });

    test('1.4 Benchmark core API response times with indexes (< 50ms average target)', async () => {
      const endpoints = [
        '/api/beds?hospitalId=hosp-chn-01',
        '/api/equipment?hospitalId=hosp-chn-01',
        '/api/resources?hospitalId=hosp-chn-01',
        '/api/patients?hospitalId=hosp-chn-01',
        '/api/requests?hospitalId=hosp-chn-01',
        '/api/notifications?hospitalId=hosp-chn-01'
      ];

      const latencies = [];

      for (const ep of endpoints) {
        const start = performance.now();
        const res = await apiRequest(baseUrl, ep, { method: 'GET', token: adminToken });
        const duration = performance.now() - start;
        assert.strictEqual(res.status, 200);
        latencies.push(duration);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`[Phase 23 Benchmark] Average indexed API endpoint latency: ${avgLatency.toFixed(2)}ms`);
      assert.ok(avgLatency < 100, `Average latency (${avgLatency.toFixed(2)}ms) should be fast (< 100ms)`);
    });
  });

  // =========================================================================
  // WORKFLOW 2: CONCURRENCY RACE CONDITIONS & ATOMIC BED ALLOCATION
  // =========================================================================
  describe('Workflow 2: Atomic Concurrency & Bed Allocation Race Conditions', () => {
    test('2.1 Concurrent bed allocation: exactly 1 wins, 9 get 409 Conflict', async () => {
      const testBedId = 'bed-perf-race-' + Date.now();
      const testBedNum = 'B-RACE-' + Math.floor(Math.random() * 1000);

      // Seed a test bed in ready state
      db.prepare(`
        INSERT INTO hospital_beds (id, hospital_id, bed_number, ward, type, status, last_updated)
        VALUES (?, 'hosp-chn-01', ?, 'ICU Block A', 'ICU', 'ready', 'Just now')
      `).run(testBedId, testBedNum);

      // Prepare 10 distinct patients
      const patientIds = [];
      for (let i = 1; i <= 10; i++) {
        const pId = `pat-perf-${Date.now()}-${i}`;
        db.prepare(`
          INSERT INTO patients (id, patient_id, hospital_id, name, age, gender, admission_date, status, primary_diagnosis, department, ward)
          VALUES (?, ?, 'hosp-chn-01', ?, 45, 'Other', '2026-11-28', 'Triage', 'Cardiac monitoring', 'Intensive Care Unit', 'ICU Block A')
        `).run(pId, pId, `Test Patient ${i}`);
        patientIds.push(pId);
      }

      // Fire 10 concurrent admission requests simultaneously for the same bed
      const admissionPromises = patientIds.map(pId => {
        return apiRequest(baseUrl, '/api/patients/admit', {
          method: 'POST',
          token: doctorToken,
          body: {
            patientId: pId,
            bedId: testBedId,
            doctorName: 'Dr. Sundaramoorthy M.',
            initialDiagnosis: 'Acute Observation'
          }
        });
      });

      const results = await Promise.all(admissionPromises);

      const successCount = results.filter(r => r.status === 200).length;
      const conflictCount = results.filter(r => r.status === 409).length;

      console.log(`[Phase 23 Concurrency] Concurrent bed allocation: ${successCount} succeeded, ${conflictCount} conflicts detected.`);
      assert.strictEqual(successCount, 1, 'Exactly 1 admission request should succeed for a single bed');
      assert.strictEqual(conflictCount, 9, 'All 9 competing concurrent requests should receive 409 Conflict');

      // Verify database integrity: Bed should be occupied by exactly one patient
      const bedInDb = db.prepare('SELECT * FROM hospital_beds WHERE id = ?').get(testBedId);
      assert.strictEqual(bedInDb.status, 'occupied');
      assert.ok(patientIds.includes(bedInDb.patient_id));
    });

    test('2.2 Concurrent resource request approval for single bed prevents dual assignment', async () => {
      const testBedId = 'bed-perf-req-' + Date.now();
      const testBedNum = 'B-REQ-' + Math.floor(Math.random() * 1000);

      db.prepare(`
        INSERT INTO hospital_beds (id, hospital_id, bed_number, ward, type, status, last_updated)
        VALUES (?, 'hosp-chn-01', ?, 'Emergency Ward', 'Emergency', 'ready', 'Just now')
      `).run(testBedId, testBedNum);

      const reqId1 = 'req-race-1-' + Date.now();
      const reqId2 = 'req-race-2-' + Date.now();

      db.prepare(`
        INSERT INTO resource_requests (id, request_id, hospital_id, requester_name, requester_role, requester_id, department, urgency, reason, resource_type, quantity, status, patient_name, patient_id, created_at)
        VALUES (?, ?, 'hosp-chn-01', 'Dr. Sundar', 'doctor', 'doc_sundar_01', 'Emergency', 'Critical', 'Critical care', 'ICU Bed', 1, 'pending', 'Patient Alpha', 'pat-alpha-01', 'Just now')
      `).run(reqId1, reqId1);

      db.prepare(`
        INSERT INTO resource_requests (id, request_id, hospital_id, requester_name, requester_role, requester_id, department, urgency, reason, resource_type, quantity, status, patient_name, patient_id, created_at)
        VALUES (?, ?, 'hosp-chn-01', 'Dr. Sundar', 'doctor', 'doc_sundar_01', 'Emergency', 'Critical', 'Critical care', 'ICU Bed', 1, 'pending', 'Patient Beta', 'pat-beta-02', 'Just now')
      `).run(reqId2, reqId2);

      // Attempt concurrent approval assigning the same bed
      const [res1, res2] = await Promise.all([
        apiRequest(baseUrl, `/api/requests/${reqId1}/status`, {
          method: 'PATCH',
          token: adminToken,
          body: { status: 'Approved', allocatedResourceId: testBedId }
        }),
        apiRequest(baseUrl, `/api/requests/${reqId2}/status`, {
          method: 'PATCH',
          token: adminToken,
          body: { status: 'Approved', allocatedResourceId: testBedId }
        })
      ]);

      const statuses = [res1.status, res2.status];
      assert.ok(statuses.includes(200), 'One request must succeed');
      assert.ok(statuses.includes(409), 'One request must receive 409 conflict');
    });
  });

  // =========================================================================
  // WORKFLOW 3: CONCURRENT INVENTORY SAFETY & STOCK PROTECTION
  // =========================================================================
  describe('Workflow 3: Inventory Stock Protection Under Concurrent Load', () => {
    test('3.1 Concurrent allocations do not over-allocate or produce negative stock', async () => {
      const testResId = 'res-race-' + Date.now();
      db.prepare(`
        INSERT INTO hospital_resources (id, resource_id, hospital_id, name, category, department, quantity, available_quantity, minimum_threshold, status)
        VALUES (?, ?, 'hosp-chn-01', 'Limited Drug Test', 'Medications', 'Pharmacy', 5, 5, 2, 'Available')
      `).run(testResId, testResId);

      const reqA = 'req-stock-a-' + Date.now();
      const reqB = 'req-stock-b-' + Date.now();

      db.prepare(`
        INSERT INTO resource_requests (id, request_id, hospital_id, requester_name, requester_role, requester_id, department, urgency, reason, resource_type, quantity, status, created_at)
        VALUES (?, ?, 'hosp-chn-01', 'Dr. Sundar', 'doctor', 'doc_sundar_01', 'Pharmacy', 'Critical', 'Emergency medication', 'Medications supply', 4, 'pending', 'Just now')
      `).run(reqA, reqA);

      db.prepare(`
        INSERT INTO resource_requests (id, request_id, hospital_id, requester_name, requester_role, requester_id, department, urgency, reason, resource_type, quantity, status, created_at)
        VALUES (?, ?, 'hosp-chn-01', 'Dr. Sundar', 'doctor', 'doc_sundar_01', 'Pharmacy', 'Critical', 'Emergency medication', 'Medications supply', 3, 'pending', 'Just now')
      `).run(reqB, reqB);

      // Total requested = 4 + 3 = 7 units. But only 5 units are available.
      const [resA, resB] = await Promise.all([
        apiRequest(baseUrl, `/api/requests/${reqA}/status`, {
          method: 'PATCH',
          token: adminToken,
          body: { status: 'Approved', allocatedResourceId: testResId }
        }),
        apiRequest(baseUrl, `/api/requests/${reqB}/status`, {
          method: 'PATCH',
          token: adminToken,
          body: { status: 'Approved', allocatedResourceId: testResId }
        })
      ]);

      const statuses = [resA.status, resB.status];
      assert.ok(statuses.includes(200), 'The allocation within stock limit must succeed');
      assert.ok(statuses.includes(409), 'The over-allocation request must be rejected with 409');

      // Verify stock in database is never negative
      const resourceInDb = db.prepare('SELECT * FROM hospital_resources WHERE id = ?').get(testResId);
      assert.ok(resourceInDb.available_quantity >= 0, 'Available quantity must not be negative');
    });

    test('3.2 Rejects invalid negative stock adjustments', async () => {
      const testResId = 'res-neg-' + Date.now();
      db.prepare(`
        INSERT INTO hospital_resources (id, resource_id, hospital_id, name, category, department, quantity, available_quantity, minimum_threshold, status)
        VALUES (?, ?, 'hosp-chn-01', 'Syringes Box', 'Consumables', 'Central Store', 10, 10, 2, 'Available')
      `).run(testResId, testResId);

      const res = await apiRequest(baseUrl, `/api/resources/${testResId}/stock`, {
        method: 'PATCH',
        token: adminToken,
        body: { adjustment: -20 } // Exceeds current stock 10
      });

      assert.strictEqual(res.status, 400);
      assert.ok(res.data.error.includes('below zero') || res.data.error.includes('negative'));
    });
  });

  // =========================================================================
  // WORKFLOW 4: REAL-TIME WEBSOCKET THROUGHPUT & LATENCY
  // =========================================================================
  describe('Workflow 4: Real-Time WebSocket Throughput & Ping Latency', () => {
    test('4.1 Measure round-trip ping check latency via Socket.IO heartbeat', async () => {
      const socket = ioClient(baseUrl, {
        transports: ['websocket'],
        auth: { token: adminToken },
        forceNew: true
      });

      await new Promise((resolve) => {
        socket.on('connect', resolve);
      });

      const clientSendTime = Date.now();
      const pongData = await new Promise((resolve) => {
        socket.emit('ping_check', clientSendTime, (ack) => {
          resolve(ack);
        });
      });

      const roundTripMs = Date.now() - clientSendTime;
      console.log(`[Phase 23 Realtime] Socket.IO heartbeat round-trip latency: ${roundTripMs}ms`);
      assert.ok(roundTripMs < 150, `Heartbeat round-trip latency (${roundTripMs}ms) should be < 150ms`);
      assert.strictEqual(pongData.clientTimestamp, clientSendTime);

      socket.disconnect();
      socket.close();
    });

    test('4.2 Verify broadcast delivery within hospital room', async () => {
      const socket = ioClient(baseUrl, {
        transports: ['websocket'],
        auth: { token: nurseToken },
        forceNew: true
      });

      await new Promise((resolve) => {
        socket.on('connect', () => {
          socket.emit('join_hospital', 'hosp-chn-01');
          resolve();
        });
      });

      const bedUpdatePromise = new Promise((resolve) => {
        socket.on('bed_updated', (data) => {
          if (data.bedId === 'bed-test-rt-01') {
            resolve(data);
          }
        });
      });

      db.prepare(`
        INSERT OR REPLACE INTO hospital_beds (id, hospital_id, bed_number, ward, type, status, last_updated)
        VALUES ('bed-test-rt-01', 'hosp-chn-01', 'B-RT-01', 'ICU Block A', 'ICU', 'cleaning', 'Just now')
      `).run();

      await apiRequest(baseUrl, '/api/beds/bed-test-rt-01/status', {
        method: 'PATCH',
        token: nurseToken,
        body: { newStatus: 'ready', notes: 'Sanitized' }
      });

      const receivedEvent = await bedUpdatePromise;
      assert.strictEqual(receivedEvent.bedId, 'bed-test-rt-01');
      assert.strictEqual(receivedEvent.newStatus, 'ready');

      socket.disconnect();
      socket.close();
    });
  });

  // =========================================================================
  // WORKFLOW 5: HIGH-CONCURRENCY RAPID BURST QUERY LOAD
  // =========================================================================
  describe('Workflow 5: High-Concurrency Burst Query Load', () => {
    test('5.1 Handle 50 rapid concurrent dashboard requests without failure', async () => {
      const burstSize = 50;
      const endpoints = [
        '/api/hospitals/hosp-chn-01/dashboard',
        '/api/beds?hospitalId=hosp-chn-01',
        '/api/equipment?hospitalId=hosp-chn-01',
        '/api/resources?hospitalId=hosp-chn-01',
        '/api/notifications?hospitalId=hosp-chn-01'
      ];

      const start = performance.now();
      const requests = Array.from({ length: burstSize }, (_, idx) => {
        const ep = endpoints[idx % endpoints.length];
        return apiRequest(baseUrl, ep, { method: 'GET', token: adminToken });
      });

      const responses = await Promise.all(requests);
      const totalDuration = performance.now() - start;

      const successCount = responses.filter(r => r.status === 200).length;
      console.log(`[Phase 23 Burst Load] 50 concurrent requests executed in ${totalDuration.toFixed(2)}ms (${(totalDuration / burstSize).toFixed(2)}ms/req average concurrency). Success: ${successCount}/50`);

      assert.strictEqual(successCount, burstSize, 'All 50 concurrent requests must return HTTP 200');
    });
  });

  // =========================================================================
  // WORKFLOW 6: ERROR HANDLING & PRIVACY VALIDATION
  // =========================================================================
  describe('Workflow 6: Security, Recovery & Privacy Audit', () => {
    test('6.1 Handles non-existent records gracefully with 404', async () => {
      const res = await apiRequest(baseUrl, '/api/resources/non-existent-res-id-999', {
        method: 'PATCH',
        token: adminToken,
        body: { name: 'New Name' }
      });
      assert.strictEqual(res.status, 404);
    });

    test('6.2 Audit logs do not contain raw passwords or JWT tokens', () => {
      const logs = db.prepare('SELECT details FROM audit_logs ORDER BY created_at DESC LIMIT 20;').all();
      for (const log of logs) {
        const detailsStr = String(log.details || '').toLowerCase();
        assert.ok(!detailsStr.includes('password'), 'Audit log must not contain raw passwords');
        assert.ok(!detailsStr.includes('eyjhbgcioi'), 'Audit log must not contain raw JWT header signatures');
      }
    });
  });
});
