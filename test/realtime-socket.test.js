import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as ClientIO } from 'socket.io-client';
import { startTestServer, stopTestServer, generateToken, apiRequest } from './test-helper.js';

describe('MediSync AI - Real-Time Communication & Live Updates Suite', () => {
  let baseUrl;
  let adminToken;
  let clientSocket;

  before(async () => {
    baseUrl = await startTestServer();
    adminToken = generateToken({ role: 'admin', hospitalId: 'hosp-chn-01' });
  });

  after(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await stopTestServer();
  });

  it('1. Connects to Socket.IO server with JWT authentication handshake', async () => {
    return new Promise((resolve, reject) => {
      clientSocket = ClientIO(baseUrl, {
        auth: { token: adminToken },
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000
      });

      clientSocket.on('connect', () => {
        assert.ok(clientSocket.connected, 'Socket should be connected');
        assert.ok(clientSocket.id, 'Socket must have an ID');
        resolve();
      });

      clientSocket.on('connect_error', (err) => {
        reject(err);
      });
    });
  });

  it('2. Heartbeat ping_check measures round-trip latency', async () => {
    return new Promise((resolve, reject) => {
      const clientStart = Date.now();
      clientSocket.emit('ping_check', clientStart, (response) => {
        const rtt = Date.now() - clientStart;
        assert.ok(response, 'Should return ping response');
        assert.ok(response.serverTime, 'Should include server timestamp');
        assert.equal(response.clientTimestamp, clientStart);
        assert.ok(rtt >= 0 && rtt < 1000, `RTT should be reasonable, got ${rtt}ms`);
        resolve();
      });

      setTimeout(() => reject(new Error('Heartbeat ping_check timed out')), 4000);
    });
  });

  it('3. Subscribes to hospital, role, doctor, and ward rooms cleanly', async () => {
    // Rooms are joined without throwing
    clientSocket.emit('join_hospital', 'hosp-chn-01');
    clientSocket.emit('join_role', { hospitalId: 'hosp-chn-01', role: 'admin' });
    clientSocket.emit('join_doctor', 'doc-01');
    clientSocket.emit('join_ward', 'ward-icu-01');

    // Wait 100ms for server room assignments to register
    await new Promise((res) => setTimeout(res, 100));
    assert.ok(clientSocket.connected);
  });

  it('4. Receives real-time broadcast on resource request creation', async () => {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Did not receive request_created event within 5s'));
      }, 5000);

      clientSocket.once('request_created', (data) => {
        clearTimeout(timer);
        assert.ok(data, 'Event payload must exist');
        assert.ok(data.request, 'Must contain created request details');
        assert.equal(data.request.hospital_id, 'hosp-chn-01');
        resolve();
      });

      // Trigger mutation via REST
      const res = await apiRequest(baseUrl, '/api/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          hospitalId: 'hosp-chn-01',
          department: 'Emergency Medicine',
          ward: 'Trauma Bay',
          resourceType: 'blood',
          resourceName: 'O-Negative Packed RBCs',
          quantity: 2,
          urgency: 'critical',
          priority: 'urgent',
          reason: 'Severe hemorrhagic shock resuscitation',
          clinicalJustification: 'Hemoglobin 5.2 g/dL with active bleeding',
          patientName: 'Kavitha Ramasamy',
          patientId: 'pt-rec-01'
        }
      });
      assert.equal(res.status, 201);
    });
  });

  it('5. Receives real-time broadcast on bed status mutation', async () => {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Did not receive bed_updated event within 5s'));
      }, 5000);

      clientSocket.once('bed_updated', (data) => {
        clearTimeout(timer);
        assert.ok(data);
        assert.ok(data.bedId);
        resolve();
      });

      // Find a bed
      const beds = await apiRequest(baseUrl, '/api/beds?hospitalId=hosp-chn-01', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bed = beds.data[0];

      // Mutate status
      await apiRequest(baseUrl, `/api/beds/${bed.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { newStatus: 'available', reason: 'Socket testing verification' }
      });
    });
  });

  it('6. Disconnects and reconnects smoothly', async () => {
    clientSocket.disconnect();
    assert.equal(clientSocket.connected, false);

    await new Promise((resolve, reject) => {
      clientSocket.connect();
      clientSocket.on('connect', () => {
        assert.equal(clientSocket.connected, true);
        resolve();
      });
      clientSocket.on('connect_error', reject);
    });
  });
});
