import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { db, initDatabase } from './db.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medisync_enterprise_jwt_secret_2026';

// Initialize DB schema & seed data
initDatabase();

app.use(cors());
app.use(express.json());

// Realtime hospital rooms
io.on('connection', (socket) => {
  socket.on('join_hospital', (hospitalId) => {
    if (hospitalId) {
      socket.join(`hospital:${hospitalId}`);
    }
  });

  socket.on('disconnect', () => {});
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// RBAC Middleware
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Authorized roles: [${allowedRoles.join(', ')}]. Your role: ${req.user?.role || 'None'}` 
      });
    }
    next();
  };
}

// Audit logger
function logAudit(hospitalId, userId, userRole, action, entityType, entityId, details) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, hospital_id, user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('aud_' + Date.now(), hospitalId, userId, userRole, action, entityType, entityId, JSON.stringify(details));
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

// Google OAuth Login / Verify endpoint
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google OAuth' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // New user registration
      const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const generatedUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=2563a6&textColor=ffffff`;

      db.prepare(`
        INSERT INTO users (id, google_id, email, name, username, avatar_url, role, verification_status, is_onboarded)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 'none', 0)
      `).run(newId, googleId || ('goog_' + Date.now()), email, name || 'User', generatedUsername, avatarUrl);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, hospitalId: user.hospital_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
        hospitalId: user.hospital_id,
        districtId: user.district_id,
        roleVerificationStatus: user.verification_status,
        rejectionReason: user.rejection_reason,
        isOnboarded: Boolean(user.is_onboarded)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server authentication error', details: err.message });
  }
});

// Update Profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
  try {
    const { name, username } = req.body;

    if (!name || !username) {
      return res.status(400).json({ error: 'Name and unique username are required' });
    }

    // Check username uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
    if (existing) {
      return res.status(400).json({ error: `Username @${username} is already taken across the health network.` });
    }

    db.prepare(`
      UPDATE users SET name = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, username, req.user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        avatarUrl: updated.avatar_url,
        role: updated.role,
        hospitalId: updated.hospital_id,
        districtId: updated.district_id,
        roleVerificationStatus: updated.verification_status,
        isOnboarded: Boolean(updated.is_onboarded)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// Submit Role & Hospital Affiliation Request
app.post('/api/users/request-role', authenticateToken, (req, res) => {
  try {
    const { districtId, hospitalId, role } = req.body;

    if (!districtId || !hospitalId || !role) {
      return res.status(400).json({ error: 'District, hospital, and role are required' });
    }

    const verificationStatus = role === 'patient' ? 'approved' : 'pending';
    const isOnboarded = role === 'patient' ? 1 : 0;

    db.prepare(`
      UPDATE users 
      SET district_id = ?, hospital_id = ?, role = ?, verification_status = ?, is_onboarded = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(districtId, hospitalId, role, verificationStatus, isOnboarded, req.user.id);

    // Notify Hospital Admin
    const hospital = db.prepare('SELECT name FROM hospitals WHERE id = ?').get(hospitalId);
    if (verificationStatus === 'pending') {
      const notifId = 'notif-' + Date.now();
      db.prepare(`
        INSERT INTO notifications (id, hospital_id, title, message, type, timestamp, read)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(
        notifId,
        hospitalId,
        `Staff Verification Request: ${role.toUpperCase()}`,
        `${req.user.name || 'A user'} has requested clearance as ${role.toUpperCase()} for ${hospital?.name || 'hospital'}.`,
        'warning',
        'Just now'
      );

      io.to(`hospital:${hospitalId}`).emit('notification_created', {
        id: notifId,
        title: `Staff Verification Request: ${role.toUpperCase()}`,
        message: `${req.user.name || 'A user'} has requested clearance as ${role.toUpperCase()}.`,
        type: 'warning'
      });
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const token = jwt.sign(
      { id: updated.id, email: updated.email, role: updated.role, hospitalId: updated.hospital_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        hospitalId: updated.hospital_id,
        districtId: updated.district_id,
        roleVerificationStatus: updated.verification_status,
        isOnboarded: Boolean(updated.is_onboarded)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit role request', details: err.message });
  }
});

// Admin Review Decision on User Role
app.post('/api/admin/verify-user', authenticateToken, (req, res) => {
  try {
    const { userId, decision, rejectionReason } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }

    const isOnboarded = decision === 'approved' ? 1 : 0;
    db.prepare(`
      UPDATE users 
      SET verification_status = ?, is_onboarded = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(decision, isOnboarded, decision === 'rejected' ? (rejectionReason || 'Affiliation could not be established') : null, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    logAudit(user.hospital_id || 'hosp-chn-01', req.user.id, 'admin', 'VERIFY_STAFF', 'user', userId, { decision });

    res.json({ message: `User role has been marked as ${decision}`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify staff', details: err.message });
  }
});

// ==========================================
// 2. DISTRICTS & HOSPITALS APIS
// ==========================================

app.get('/api/districts', (req, res) => {
  try {
    const districts = db.prepare('SELECT * FROM districts ORDER BY name ASC').all();
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch districts', details: err.message });
  }
});

app.get('/api/hospitals', (req, res) => {
  try {
    const { districtId } = req.query;
    let query = 'SELECT * FROM hospitals';
    const params = [];

    if (districtId) {
      query += ' WHERE district_id = ?';
      params.push(districtId);
    }

    query += ' ORDER BY name ASC';
    const hospitals = db.prepare(query).all(...params).map(h => ({
      ...h,
      availableDepartments: JSON.parse(h.available_departments || '[]')
    }));

    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospitals', details: err.message });
  }
});

// ==========================================
// 3. DASHBOARDS & RESOURCE MANAGEMENT
// ==========================================

// Get all hospital resources & stats for authorized dashboard
app.get('/api/hospitals/:hospitalId/dashboard', authenticateToken, (req, res) => {
  try {
    const { hospitalId } = req.params;

    // Hospital info
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Beds
    const beds = db.prepare('SELECT * FROM hospital_beds WHERE hospital_id = ?').all(hospitalId).map(b => ({
      id: b.id,
      hospitalId: b.hospital_id,
      ward: b.ward,
      bedNumber: b.bed_number,
      type: b.type,
      status: b.status,
      patientName: b.patient_name,
      patientId: b.patient_id,
      assignedNurse: b.assigned_nurse,
      lastUpdated: b.last_updated,
      notes: b.notes
    }));

    // Equipment
    const equipment = db.prepare('SELECT * FROM equipment WHERE hospital_id = ?').all(hospitalId).map(e => ({
      id: e.id,
      hospitalId: e.hospital_id,
      name: e.name,
      category: e.category,
      ward: e.ward,
      status: e.status,
      lastInspection: e.last_inspection,
      serialNumber: e.serial_number
    }));

    // Requests (Patients only see their own requests; clinicians/admin see all hospital requests)
    let requestQuery = 'SELECT * FROM resource_requests WHERE hospital_id = ?';
    const requestParams = [hospitalId];

    if (req.user.role === 'patient') {
      requestQuery += ' AND requester_id = ?';
      requestParams.push(req.user.id);
    }
    requestQuery += ' ORDER BY created_at DESC';

    const requests = db.prepare(requestQuery).all(...requestParams).map(r => ({
      id: r.id,
      hospitalId: r.hospital_id,
      requesterId: r.requester_id,
      requesterName: r.requester_name,
      requesterRole: r.requester_role,
      department: r.department,
      resourceType: r.resource_type,
      quantity: r.quantity,
      urgency: r.urgency,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      patientId: r.patient_id,
      patientName: r.patient_name,
      allocatedResourceId: r.allocated_resource_id,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at
    }));

    // Appointments (Patients only see their own appointments)
    let aptQuery = 'SELECT * FROM patient_appointments WHERE hospital_id = ?';
    const aptParams = [hospitalId];
    if (req.user.role === 'patient') {
      aptQuery += ' AND (patient_id = ? OR patient_id = "usr-patient-demo")';
      aptParams.push(req.user.id);
    }
    const appointments = db.prepare(aptQuery).all(...aptParams).map(a => ({
      id: a.id,
      patientId: a.patient_id,
      patientName: a.patient_name,
      hospitalId: a.hospital_id,
      hospitalName: a.hospital_name,
      department: a.department,
      doctorName: a.doctor_name,
      date: a.date,
      time: a.time,
      tokenNumber: a.token_number,
      status: a.status,
      queuePosition: a.queue_position,
      estimatedWaitMinutes: a.estimated_wait_minutes
    }));

    // Notifications
    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT 20
    `).all(hospitalId).map(n => ({
      id: n.id,
      hospitalId: n.hospital_id,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      read: Boolean(n.read)
    }));

    // Metrics calculation
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const readyBeds = beds.filter(b => b.status === 'ready').length;
    const prepBeds = beds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation', 'discharged'].includes(b.status)).length;
    const readyIcuBeds = beds.filter(b => b.type === 'ICU' && b.status === 'ready').length;
    const availableVentilators = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length;

    res.json({
      hospital: {
        ...hospital,
        availableDepartments: JSON.parse(hospital.available_departments || '[]')
      },
      stats: {
        totalBeds,
        occupiedBeds,
        readyBeds,
        prepBeds,
        readyIcuBeds,
        availableVentilators
      },
      beds,
      equipment,
      requests,
      appointments,
      notifications
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: err.message });
  }
});

// Update Bed Status (Enforces Bed Lifecycle & Emits Realtime Sync)
app.patch('/api/beds/:bedId/status', authenticateToken, requireRole(['nurse', 'admin', 'doctor']), (req, res) => {
  try {
    const { bedId } = req.params;
    const { newStatus, notes } = req.body;

    // Valid statuses: occupied, discharged, cleaning, equipment_check, nurse_confirmation, ready, reserved
    const validTransitions = {
      occupied: ['discharged', 'occupied'],
      discharged: ['cleaning'],
      cleaning: ['equipment_check'],
      equipment_check: ['nurse_confirmation'],
      nurse_confirmation: ['ready'],
      ready: ['occupied', 'reserved'],
      reserved: ['occupied', 'ready']
    };

    const bed = db.prepare('SELECT * FROM hospital_beds WHERE id = ?').get(bedId);
    if (!bed) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    // Hospital data boundary check
    if (req.user.hospitalId && req.user.hospitalId !== bed.hospital_id) {
      return res.status(403).json({ error: 'Cannot update resources belonging to another hospital' });
    }

    db.prepare(`
      UPDATE hospital_beds
      SET status = ?, notes = COALESCE(?, notes), last_updated = 'Just now'
      WHERE id = ?
    `).run(newStatus, notes, bedId);

    // Create notification
    const notifId = 'notif-' + Date.now();
    const notifTitle = `Bed Status Update: ${bed.bed_number}`;
    const notifMsg = `Bed ${bed.bed_number} in ${bed.ward} transitioned to [${newStatus.toUpperCase().replace('_', ' ')}] by ${req.user.role}.`;

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(notifId, bed.hospital_id, notifTitle, notifMsg, newStatus === 'ready' ? 'success' : 'info', 'Just now');

    logAudit(bed.hospital_id, req.user.id, req.user.role, 'UPDATE_BED_STATUS', 'bed', bedId, { previous: bed.status, current: newStatus });

    const updatedBed = db.prepare('SELECT * FROM hospital_beds WHERE id = ?').get(bedId);

    // Broadcast Realtime Event to Hospital Room
    io.to(`hospital:${bed.hospital_id}`).emit('bed_updated', {
      bedId,
      newStatus,
      lastUpdated: 'Just now',
      notes: notes || bed.notes,
      notification: {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        type: newStatus === 'ready' ? 'success' : 'info'
      }
    });

    res.json({ message: 'Bed status updated successfully', bed: updatedBed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bed status', details: err.message });
  }
});

// Create Resource Request (Doctor Requisition)
app.post('/api/requests', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { hospitalId, department, resourceType, quantity, urgency, reason, patientName, patientId } = req.body;

    if (!resourceType || !urgency || !reason) {
      return res.status(400).json({ error: 'Resource type, clinical urgency, and reason are required' });
    }

    const currentHospId = hospitalId || req.user.hospitalId || 'hosp-chn-01';
    const newId = 'req-' + Math.floor(100 + Math.random() * 900);

    db.prepare(`
      INSERT INTO resource_requests (
        id, hospital_id, requester_id, requester_name, requester_role, department,
        resource_type, quantity, urgency, reason, status, created_at, patient_id, patient_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Just now', ?, ?)
    `).run(
      newId, currentHospId, req.user.id, req.user.name || 'Doctor', req.user.role,
      department || 'Critical Care', resourceType, quantity || 1, urgency, reason,
      patientId || ('PT-' + Math.floor(1000 + Math.random() * 9000)),
      patientName || 'Emergency Admission'
    );

    // Notification for Command Center
    const notifId = 'notif-' + Date.now();
    const notifTitle = `New Clinical Request: ${resourceType}`;
    const notifMsg = `${req.user.name || 'Doctor'} requested 1 ${resourceType} for ${patientName || 'Emergency Patient'} (Urgency: ${urgency})`;

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(notifId, currentHospId, notifTitle, notifMsg, urgency === 'Critical' ? 'critical' : 'warning', 'Just now');

    logAudit(currentHospId, req.user.id, req.user.role, 'CREATE_RESOURCE_REQUEST', 'resource_request', newId, { resourceType, urgency });

    const newRequest = db.prepare('SELECT * FROM resource_requests WHERE id = ?').get(newId);

    // Realtime Broadcast
    io.to(`hospital:${currentHospId}`).emit('request_created', {
      request: newRequest,
      notification: {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        type: urgency === 'Critical' ? 'critical' : 'warning'
      }
    });

    res.status(201).json({ message: 'Resource request submitted to Hospital Command', request: newRequest });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource request', details: err.message });
  }
});

// Update Request Status (Admin Allocation / Doctor Confirmation)
app.patch('/api/requests/:requestId/status', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, allocatedResourceId } = req.body; // 'approved', 'allocated', 'fulfilled', 'rejected'

    const existingReq = db.prepare('SELECT * FROM resource_requests WHERE id = ?').get(requestId);
    if (!existingReq) {
      return res.status(404).json({ error: 'Resource request not found' });
    }

    db.prepare(`
      UPDATE resource_requests
      SET status = ?, allocated_resource_id = COALESCE(?, allocated_resource_id), reviewed_by = ?, reviewed_at = 'Just now'
      WHERE id = ?
    `).run(status, allocatedResourceId, req.user.name || 'Hospital Admin', requestId);

    // If allocated with an ICU bed, mark bed occupied
    if (status === 'allocated' && allocatedResourceId && allocatedResourceId.startsWith('bed-')) {
      db.prepare(`
        UPDATE hospital_beds SET status = 'occupied', patient_name = ?, patient_id = ? WHERE id = ?
      `).run(existingReq.patient_name || 'Emergency Intake', existingReq.patient_id || 'PT-EMR', allocatedResourceId);
    }

    const notifId = 'notif-' + Date.now();
    const notifTitle = `Request ${status.toUpperCase()}: ${existingReq.resource_type}`;
    const notifMsg = `Requisition for ${existingReq.patient_name || existingReq.department} has been marked as ${status}.`;

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(notifId, existingReq.hospital_id, notifTitle, notifMsg, status === 'rejected' ? 'critical' : 'success', 'Just now');

    logAudit(existingReq.hospital_id, req.user.id, req.user.role, 'UPDATE_REQUEST_STATUS', 'resource_request', requestId, { status, allocatedResourceId });

    const updated = db.prepare('SELECT * FROM resource_requests WHERE id = ?').get(requestId);

    // Realtime Broadcast
    io.to(`hospital:${existingReq.hospital_id}`).emit('request_updated', {
      requestId,
      status,
      allocatedResourceId,
      notification: {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        type: status === 'rejected' ? 'critical' : 'success'
      }
    });

    res.json({ message: `Request successfully marked as ${status}`, request: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request', details: err.message });
  }
});

// Book OPD Consultation
app.post('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { hospitalId, department, doctorName, date, time } = req.body;
    const currentHosp = db.prepare('SELECT name FROM hospitals WHERE id = ?').get(hospitalId || 'hosp-chn-01');

    const newId = 'apt-' + Math.floor(100 + Math.random() * 900);
    const tokenNumber = Math.floor(15 + Math.random() * 20);

    db.prepare(`
      INSERT INTO patient_appointments (
        id, patient_id, patient_name, hospital_id, hospital_name, department,
        doctor_name, date, time, token_number, status, queue_position, estimated_wait_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Queue', 3, 25)
    `).run(
      newId, req.user.id, req.user.name || 'Patient', hospitalId || 'hosp-chn-01',
      currentHosp?.name || 'General Hospital', department, doctorName, date, time, tokenNumber
    );

    const appointment = db.prepare('SELECT * FROM patient_appointments WHERE id = ?').get(newId);
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to book appointment', details: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`MediSync AI Backend Server running on http://localhost:${PORT}`);
});
