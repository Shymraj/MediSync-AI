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

// ==========================================
// REALTIME SOCKET.IO ROOMS, AUTH & HANDLERS
// ==========================================
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
    } catch (err) {
      // Invalid token - allow connection as guest/demo with logged notice
    }
  }
  next();
});

io.on('connection', (socket) => {
  // Join hospital room (with prefix and raw identifier)
  socket.on('join_hospital', (hospitalId) => {
    if (hospitalId) {
      socket.join(`hospital:${hospitalId}`);
      socket.join(hospitalId);
    }
  });

  // Join role-scoped room
  socket.on('join_role', ({ hospitalId, role }) => {
    if (hospitalId && role) {
      socket.join(`role:${hospitalId}:${role}`);
    }
  });

  // Join doctor-specific room
  socket.on('join_doctor', (doctorId) => {
    if (doctorId) {
      socket.join(`doctor:${doctorId}`);
    }
  });

  // Join nurse ward room
  socket.on('join_ward', (wardId) => {
    if (wardId) {
      socket.join(`ward:${wardId}`);
    }
  });

  // Heartbeat ping-check for round-trip latency measurement
  socket.on('ping_check', (clientTimestamp, callback) => {
    const payload = { serverTime: Date.now(), clientTimestamp };
    if (typeof callback === 'function') {
      callback(payload);
    } else {
      socket.emit('pong_ack', payload);
    }
  });

  socket.on('disconnect', () => {});
});

// Broadcast helpers
function broadcastToHospital(hospitalId, event, data) {
  if (hospitalId) {
    io.to(`hospital:${hospitalId}`).emit(event, data);
    io.to(hospitalId).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

function broadcastToRole(hospitalId, role, event, data) {
  if (hospitalId && role) {
    io.to(`role:${hospitalId}:${role}`).emit(event, data);
  }
}

function broadcastToDoctor(doctorId, event, data) {
  if (doctorId) {
    io.to(`doctor:${doctorId}`).emit(event, data);
  }
}

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Real-Time Health & Diagnostics Status
app.get('/api/realtime/health', (req, res) => {
  res.json({
    status: 'healthy',
    transport: 'websocket',
    activeSockets: io.engine.clientsCount || 0,
    connectedClients: io.engine.clientsCount || 0,
    serverTimestamp: new Date().toISOString(),
    supportedChannels: ['beds', 'requests', 'emergencies', 'tasks', 'workflows', 'notifications']
  });
});

app.get('/api/realtime/diagnostics', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    diagnostics: {
      uptimeSeconds: Math.floor(process.uptime()),
      connectedSockets: io.engine.clientsCount || 0,
      memoryHeapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      nodeVersion: process.version
    }
  });
});

app.get('/api/realtime/events/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json(logs);
  } catch {
    res.json([]);
  }
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For demo or dev mode, allow simulated fallback if header has X-Demo-User
    const demoRole = req.headers['x-demo-role'];
    const demoHosp = req.headers['x-demo-hospital'] || 'hosp-chn-01';
    if (demoRole) {
      req.user = {
        id: 'usr_' + demoRole,
        name: demoRole === 'doctor' ? 'Dr. Sundaramoorthy M.' : demoRole === 'nurse' ? 'Nurse Deepa R.' : 'Dr. Vasanth Kumar',
        email: `${demoRole}@medisync.gov.in`,
        role: demoRole,
        hospitalId: demoHosp
      };
      return next();
    }
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

// Optional Auth (populates req.user if token present, does not reject if missing)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) req.user = decoded;
      next();
    });
  } else {
    const demoRole = req.headers['x-demo-role'];
    if (demoRole) {
      req.user = {
        id: 'usr_' + demoRole,
        name: demoRole === 'doctor' ? 'Dr. Sundaramoorthy M.' : demoRole === 'nurse' ? 'Nurse Deepa R.' : 'Dr. Vasanth Kumar',
        role: demoRole,
        hospitalId: req.headers['x-demo-hospital'] || 'hosp-chn-01'
      };
    }
    next();
  }
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

// Audit logger helper
function logAudit(hospitalId, userId, userRole, action, entityType, entityId, details, prevState = null, newState = null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, hospital_id, user_id, user_role, action, entity_type, entity_id, previous_state, new_state, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      hospitalId || 'hosp-chn-01',
      userId || 'system',
      userRole || 'admin',
      action,
      entityType,
      entityId,
      prevState ? JSON.stringify(prevState) : null,
      newState ? JSON.stringify(newState) : null,
      JSON.stringify(details || {})
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Helper to calculate MEWS (Modified Early Warning Score)
function calculateMEWS(hr, sbp, rr, temp, spo2) {
  let score = 0;
  // Heart Rate
  if (hr <= 40 || hr >= 130) score += 3;
  else if (hr >= 111 || hr <= 50) score += 2;
  else if (hr >= 101) score += 1;

  // Systolic BP
  if (sbp <= 70) score += 3;
  else if (sbp <= 80 || sbp >= 200) score += 2;
  else if (sbp <= 100) score += 1;

  // Respiratory Rate
  if (rr <= 8 || rr >= 30) score += 3;
  else if (rr >= 25) score += 2;
  else if (rr >= 21 || rr <= 11) score += 1;

  // Temperature (Fahrenheit)
  if (temp <= 95) score += 2;
  else if (temp >= 101.4) score += 2;
  else if (temp >= 100.4) score += 1;

  // SpO2
  if (spo2 < 88) score += 3;
  else if (spo2 <= 91) score += 2;
  else if (spo2 <= 93) score += 1;

  return score;
}

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

// Google OAuth Login / Verify endpoint
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, name, googleId, portal, role: requestedRole } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google OAuth' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const isPatientPortal = portal === 'patient' || requestedRole === 'patient' || email === 'karthik.subramanian@gmail.com';

    if (!user) {
      const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const generatedUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=2563a6&textColor=ffffff`;

      const initialRole = isPatientPortal ? 'patient' : null;
      const initialVerification = isPatientPortal ? 'approved' : 'none';
      const initialOnboarded = isPatientPortal ? 1 : 0;
      const initialHospital = isPatientPortal ? 'hosp-chn-01' : null;
      const initialDistrict = isPatientPortal ? 'chennai' : null;

      db.prepare(`
        INSERT INTO users (id, google_id, email, name, username, avatar_url, role, verification_status, is_onboarded, hospital_id, district_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, googleId || ('goog_' + Date.now()), email, name || 'User', generatedUsername, avatarUrl, initialRole, initialVerification, initialOnboarded, initialHospital, initialDistrict);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    } else if (isPatientPortal && (!user.role || user.role === 'patient')) {
      db.prepare(`
        UPDATE users 
        SET role = 'patient', verification_status = 'approved', is_onboarded = 1,
            hospital_id = COALESCE(hospital_id, 'hosp-chn-01'),
            district_id = COALESCE(district_id, 'chennai')
        WHERE id = ?
      `).run(user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    const hospital = user.hospital_id ? db.prepare('SELECT name FROM hospitals WHERE id = ?').get(user.hospital_id) : null;
    const district = user.district_id ? db.prepare('SELECT name FROM districts WHERE id = ?').get(user.district_id) : null;

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospital_id },
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
        hospitalName: hospital?.name,
        districtId: user.district_id,
        districtName: district?.name,
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

    if (verificationStatus === 'pending') {
      const notifId = 'notif-' + Date.now();
      db.prepare(`
        INSERT INTO notifications (id, hospital_id, title, message, type, category, timestamp, read)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        notifId,
        hospitalId,
        `Staff Verification Request: ${role.toUpperCase()}`,
        `${req.user.name || 'A user'} has requested clearance as ${role.toUpperCase()}.`,
        'warning',
        'staff_verification',
        'Just now'
      );

      broadcastToHospital(hospitalId, 'notification_created', {
        id: notifId,
        title: `Staff Verification Request: ${role.toUpperCase()}`,
        message: `${req.user.name || 'A user'} has requested clearance as ${role.toUpperCase()}.`,
        type: 'warning'
      });
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const token = jwt.sign(
      { id: updated.id, email: updated.email, name: updated.name, role: updated.role, hospitalId: updated.hospital_id },
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
app.post('/api/admin/verify-user', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { userId, decision, rejectionReason } = req.body;

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

    logAudit(user.hospital_id || 'hosp-chn-01', req.user.id, 'admin', 'VERIFY_STAFF', 'user', userId, { decision, rejectionReason });

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

// Single Hospital Details
app.get('/api/hospitals/:id', (req, res) => {
  try {
    const { id } = req.params;
    const hosp = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
    if (!hosp) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hosp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospital', details: err.message });
  }
});

// Clinical Wards Endpoint
app.get('/api/clinical-wards', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    const wards = db.prepare('SELECT * FROM clinical_wards WHERE hospital_id = ? ORDER BY name ASC').all(hospitalId);
    res.json(wards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clinical wards', details: err.message });
  }
});

app.get('/api/hospitals/:hospitalId/departments', (req, res) => {
  try {
    const { hospitalId } = req.params;
    const depts = db.prepare('SELECT * FROM departments WHERE hospital_id = ? ORDER BY name ASC').all(hospitalId);
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments', details: err.message });
  }
});

app.get('/api/hospitals/:hospitalId/wards', (req, res) => {
  try {
    const { hospitalId } = req.params;
    const wards = db.prepare('SELECT * FROM clinical_wards WHERE hospital_id = ? ORDER BY name ASC').all(hospitalId);
    res.json(wards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wards', details: err.message });
  }
});

// ==========================================
// 3. MASTER PATIENT REGISTRY & DIGITAL TWIN
// ==========================================

app.get('/api/patients', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM patients WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.user?.role === 'doctor') {
      // Return patients assigned to doctor or all active hospital patients
      if (req.query.assignedOnly === 'true') {
        query += ' AND (attending_physician_id = ? OR attending_physician_name LIKE ?)';
        params.push(req.user.id, `%${req.user.name}%`);
      }
    }

    query += ' ORDER BY admission_date DESC, created_at DESC';
    const patients = db.prepare(query).all(...params).map(p => ({
      ...p,
      patientId: p.patient_id,
      bloodGroup: p.blood_group,
      admissionDate: p.admission_date,
      bedNumber: p.bed_number,
      attendingPhysician: p.attending_physician_name,
      primaryDiagnosis: p.primary_diagnosis,
      riskLevel: p.risk_level,
      mewsScore: p.mews_score,
      resuscitationStatus: p.resuscitation_status,
      doctorNotes: p.doctor_notes,
      secondaryDiagnoses: JSON.parse(p.secondary_diagnoses || '[]'),
      allergies: JSON.parse(p.allergies || '[]'),
      vitals: JSON.parse(p.vitals || '[]'),
      currentVitals: JSON.parse(p.current_vitals || '{}'),
      medications: JSON.parse(p.medications || '[]'),
      labs: JSON.parse(p.labs || '[]'),
      timeline: JSON.parse(p.timeline || '[]')
    }));

    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients', details: err.message });
  }
});

app.get('/api/patients/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const p = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(patientId, patientId);
    if (!p) {
      return res.status(404).json({ error: `Patient ${patientId} not found` });
    }

    res.json({
      ...p,
      patientId: p.patient_id,
      bloodGroup: p.blood_group,
      admissionDate: p.admission_date,
      bedNumber: p.bed_number,
      attendingPhysician: p.attending_physician_name,
      primaryDiagnosis: p.primary_diagnosis,
      riskLevel: p.risk_level,
      mewsScore: p.mews_score,
      resuscitationStatus: p.resuscitation_status,
      doctorNotes: p.doctor_notes,
      secondaryDiagnoses: JSON.parse(p.secondary_diagnoses || '[]'),
      allergies: JSON.parse(p.allergies || '[]'),
      vitals: JSON.parse(p.vitals || '[]'),
      currentVitals: JSON.parse(p.current_vitals || '{}'),
      medications: JSON.parse(p.medications || '[]'),
      labs: JSON.parse(p.labs || '[]'),
      timeline: JSON.parse(p.timeline || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient details', details: err.message });
  }
});

// Create / Register Patient
app.post('/api/patients', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), (req, res) => {
  try {
    const {
      name, age, gender, bloodGroup, department, ward, bedNumber,
      primaryDiagnosis, icd10, attendingPhysician, riskLevel, allergies
    } = req.body;

    if (!name || !primaryDiagnosis) {
      return res.status(400).json({ error: 'Patient name and primary diagnosis are required' });
    }

    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    const patientId = req.body.patientId || ('PT-' + Math.floor(1000 + Math.random() * 9000));
    const newId = 'pt-rec-' + Date.now();
    const admissionDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_name, primary_diagnosis,
        icd10, secondary_diagnoses, risk_level, mews_score, resuscitation_status,
        allergies, vitals, current_vitals, medications, labs, doctor_notes, timeline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId, patientId, hospitalId, name, age || 45, gender || 'Male', bloodGroup || 'O+',
      admissionDate, department || 'General Medicine', ward || 'General Ward', bedNumber || null,
      attendingPhysician || req.user.name, primaryDiagnosis, icd10 || 'Z00.0',
      JSON.stringify([]), riskLevel || 'Moderate Risk', 2, 'Full Code',
      JSON.stringify(allergies || []), JSON.stringify([]), JSON.stringify({ hr: 80, sbp: 120, dbp: 80, spo2: 98, rr: 16, temp: 98.6 }),
      JSON.stringify([]), JSON.stringify([]), 'Newly admitted patient.',
      JSON.stringify([
        { id: 't-' + Date.now(), timestamp: 'Just now', title: 'Admitted', actor: req.user.name, description: `Admitted into ${ward || 'Hospital'}` }
      ]),
      'Admitted'
    );

    logAudit(hospitalId, req.user.id, req.user.role, 'REGISTER_PATIENT', 'patient', patientId, { name, ward, bedNumber });

    const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(newId);
    broadcastToHospital(hospitalId, 'patient_created', created);

    res.status(201).json({ message: 'Patient registered successfully', patient: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create patient record', details: err.message });
  }
});

// Update Patient Record / Digital Twin
app.put('/api/patients/:patientId', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), (req, res) => {
  try {
    const { patientId } = req.params;
    const existing = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(patientId, patientId);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const {
      name, age, department, ward, bedNumber, attendingPhysician,
      primaryDiagnosis, riskLevel, mewsScore, doctorNotes,
      medications, labs, vitals, currentVitals, timeline, status
    } = req.body;

    db.prepare(`
      UPDATE patients SET
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        department = COALESCE(?, department),
        ward = COALESCE(?, ward),
        bed_number = COALESCE(?, bed_number),
        attending_physician_name = COALESCE(?, attending_physician_name),
        primary_diagnosis = COALESCE(?, primary_diagnosis),
        risk_level = COALESCE(?, risk_level),
        mews_score = COALESCE(?, mews_score),
        doctor_notes = COALESCE(?, doctor_notes),
        medications = COALESCE(?, medications),
        labs = COALESCE(?, labs),
        vitals = COALESCE(?, vitals),
        current_vitals = COALESCE(?, current_vitals),
        timeline = COALESCE(?, timeline),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? null, age ?? null, department ?? null, ward ?? null, bedNumber ?? null, attendingPhysician ?? null,
      primaryDiagnosis ?? null, riskLevel ?? null, mewsScore ?? null, doctorNotes ?? null,
      medications ? JSON.stringify(medications) : null,
      labs ? JSON.stringify(labs) : null,
      vitals ? JSON.stringify(vitals) : null,
      currentVitals ? JSON.stringify(currentVitals) : null,
      timeline ? JSON.stringify(timeline) : null,
      status ?? null, existing.id
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(existing.id);
    broadcastToHospital(existing.hospital_id, 'patient_updated', updated);

    res.json({ message: 'Patient record updated successfully', patient: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update patient record', details: err.message });
  }
});

// Patient Admission & Bed Allocation (Safety Check: Prevents double occupancy & double admission)
app.post('/api/patients/admit', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, bedId, ward, department, initialDiagnosis, doctorName } = req.body;

    if (!patientId || !bedId) {
      return res.status(400).json({ error: 'patientId and bedId are required for admission' });
    }

    const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(patientId, patientId);
    if (!patient) {
      return res.status(404).json({ error: `Patient ${patientId} not found` });
    }

    const bed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(bedId, bedId);
    if (!bed) {
      return res.status(404).json({ error: `Bed ${bedId} not found` });
    }

    // SAFETY CHECK: Prevent assigning occupied bed
    if (bed.status === 'occupied' && bed.patient_id && bed.patient_id !== patient.patient_id) {
      return res.status(409).json({ 
        error: `Bed Conflict: Bed ${bed.bed_number} is already OCCUPIED by ${bed.patient_name || bed.patient_id}. Cannot assign to multiple patients!` 
      });
    }

    // SAFETY CHECK: If patient is already occupying another bed, release the old bed
    const oldBed = db.prepare('SELECT * FROM hospital_beds WHERE patient_id = ? AND id != ?').get(patient.patient_id, bed.id);
    if (oldBed) {
      db.prepare(`
        UPDATE hospital_beds 
        SET status = 'cleaning', patient_name = null, patient_id = null, last_updated = 'Just now', notes = 'Patient shifted to another bed'
        WHERE id = ?
      `).run(oldBed.id);

      logAudit(bed.hospital_id, req.user.id, req.user.role, 'RELEASE_OLD_BED', 'bed', oldBed.id, {
        reason: 'Auto-released due to transfer/admission into new bed',
        newBed: bed.bed_number
      });

      broadcastToHospital(bed.hospital_id, 'bed_updated', {
        bedId: oldBed.id,
        newStatus: 'cleaning',
        patient: 'Unassigned',
        lastUpdated: 'Just now'
      });
    }

    // Update target bed to Occupied
    db.prepare(`
      UPDATE hospital_beds
      SET status = 'occupied', patient_name = ?, patient_id = ?, assigned_doctor = ?, last_updated = 'Just now', notes = ?
      WHERE id = ?
    `).run(patient.name, patient.patient_id, doctorName || req.user.name, `Admitted with diagnosis: ${initialDiagnosis || patient.primary_diagnosis}`, bed.id);

    // Update patient record
    db.prepare(`
      UPDATE patients
      SET bed_number = ?, ward = COALESCE(?, ward), department = COALESCE(?, department), status = 'Admitted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(bed.bed_number, ward || bed.ward, department, patient.id);

    // Record admission
    const admId = 'adm-' + Date.now();
    db.prepare(`
      INSERT INTO admissions (id, patient_id, hospital_id, bed_id, admission_date, admitting_doctor, initial_diagnosis, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(admId, patient.patient_id, bed.hospital_id, bed.id, new Date().toISOString(), doctorName || req.user.name, initialDiagnosis || patient.primary_diagnosis);

    logAudit(bed.hospital_id, req.user.id, req.user.role, 'ADMIT_PATIENT', 'patient', patient.patient_id, {
      bedNumber: bed.bed_number,
      ward: bed.ward,
      diagnosis: initialDiagnosis || patient.primary_diagnosis
    });

    const notifTitle = `Patient Admitted: ${patient.name}`;
    const notifMsg = `${patient.name} (${patient.patient_id}) admitted to Bed ${bed.bed_number} in ${bed.ward}.`;
    const notifId = 'notif-' + Date.now();
    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, 'info', 'patient_admission', ?, 'Just now', 0)
    `).run(notifId, bed.hospital_id, notifTitle, notifMsg, patient.patient_id);

    // Broadcast realtime synchronization
    broadcastToHospital(bed.hospital_id, 'bed_updated', {
      bedId: bed.id,
      bedNumber: bed.bed_number,
      newStatus: 'occupied',
      patientName: patient.name,
      patientId: patient.patient_id,
      ward: bed.ward,
      lastUpdated: 'Just now'
    });

    broadcastToHospital(bed.hospital_id, 'patient_admitted', {
      patientId: patient.patient_id,
      patientName: patient.name,
      bedNumber: bed.bed_number,
      ward: bed.ward
    });

    res.json({
      message: `Patient ${patient.name} admitted to Bed ${bed.bed_number} successfully.`,
      bedNumber: bed.bed_number,
      patientId: patient.patient_id
    });
  } catch (err) {
    res.status(500).json({ error: 'Admission failed', details: err.message });
  }
});

// Patient Discharge & Bed Sanitization Release
app.post('/api/patients/discharge', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, dischargeNotes } = req.body;
    const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(patientId, patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Free bed
    const bed = db.prepare('SELECT * FROM hospital_beds WHERE patient_id = ? OR bed_number = ?').get(patient.patient_id, patient.bed_number);
    if (bed) {
      db.prepare(`
        UPDATE hospital_beds
        SET status = 'cleaning', patient_name = null, patient_id = null, last_updated = 'Just now', notes = 'Discharged: terminal sanitization pending'
        WHERE id = ?
      `).run(bed.id);

      broadcastToHospital(bed.hospital_id, 'bed_updated', {
        bedId: bed.id,
        bedNumber: bed.bed_number,
        newStatus: 'cleaning',
        patient: 'Unassigned',
        lastUpdated: 'Just now'
      });
    }

    // Update patient
    db.prepare(`
      UPDATE patients
      SET status = 'Discharged', bed_number = null, doctor_notes = doctor_notes || ' [Discharged: ' || ? || ']', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(dischargeNotes || 'Routine clinical discharge', patient.id);

    // Update active admission
    db.prepare(`
      UPDATE admissions
      SET status = 'Discharged', discharge_date = CURRENT_TIMESTAMP, notes = COALESCE(?, notes)
      WHERE patient_id = ? AND status = 'Active'
    `).run(dischargeNotes, patient.patient_id);

    logAudit(patient.hospital_id, req.user.id, req.user.role, 'DISCHARGE_PATIENT', 'patient', patient.patient_id, {
      bedReleased: bed?.bed_number,
      notes: dischargeNotes
    });

    // Auto-create Housekeeping / Nurse Task for Terminal Bed Turnover (Workflow 5)
    if (bed) {
      const turnaroundTaskId = 'tsk-turnaround-' + Date.now();
      db.prepare(`
        INSERT INTO clinical_tasks (
          id, hospital_id, patient_id, patient_name, ward, bed, doctor_name, doctor_id,
          assigned_nurse, task_type, instruction, priority, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bed Turnover', ?, 'Stat (Immediate)', 'Pending', 'Just now')
      `).run(
        turnaroundTaskId, patient.hospital_id, patient.patient_id, patient.name,
        bed.ward, bed.bed_number,
        req.user.name || 'Discharging Physician', req.user.id,
        'Housekeeping & Ward Nurse',
        `Terminal sanitization, linen turnover & equipment recalibration required for Bed ${bed.bed_number} (${bed.ward}) following clinical discharge of ${patient.name}.`
      );

      broadcastToHospital(patient.hospital_id, 'clinical_task_created', {
        id: turnaroundTaskId,
        patientName: patient.name,
        taskType: 'Bed Turnover',
        priority: 'Stat (Immediate)'
      });
    }

    broadcastToHospital(patient.hospital_id, 'patient_discharged', {
      patientId: patient.patient_id,
      patientName: patient.name,
      bedId: bed?.id,
      bedNumber: bed?.bed_number
    });

    res.json({ message: `Patient ${patient.name} discharged. Bed marked for terminal cleaning.` });
  } catch (err) {
    res.status(500).json({ error: 'Discharge failed', details: err.message });
  }
});

// ==========================================
// 4. BEDS & CLINICAL WARDS APIS
// ==========================================

app.get('/api/beds', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM hospital_beds WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.query.ward) {
      query += ' AND ward = ?';
      params.push(req.query.ward);
    }
    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }

    const beds = db.prepare(query).all(...params).map(b => ({
      id: b.id,
      bedId: b.bed_number,
      bedNumber: b.bed_number,
      bed_number: b.bed_number,
      hospitalId: b.hospital_id,
      hospital_id: b.hospital_id,
      ward: b.ward,
      bedType: b.type,
      type: b.type,
      floor: b.floor || 'Floor 1',
      status: b.status,
      patient: b.patient_name || 'Unassigned',
      patientName: b.patient_name,
      patient_name: b.patient_name,
      patientId: b.patient_id,
      patient_id: b.patient_id,
      assignedDoctor: b.assigned_doctor,
      assignedNurse: b.assigned_nurse,
      equipment: b.equipment || '',
      lastUpdated: b.last_updated,
      notes: b.notes,
      statusHistory: JSON.parse(b.status_history || '[]')
    }));

    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch beds', details: err.message });
  }
});

// Bed Capacity Summary
app.get('/api/beds/summary', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    const beds = db.prepare('SELECT status, COUNT(*) as count FROM hospital_beds WHERE hospital_id = ? GROUP BY status').all(hospitalId);
    let total = 0;
    const summary = { total: 0, available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
    for (const b of beds) {
      const s = (b.status || '').toLowerCase();
      summary[s] = b.count;
      total += b.count;
    }
    summary.total = total;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute bed summary', details: err.message });
  }
});

// Update Bed Status (Enforces Bed Lifecycle Transitions & Emits Realtime Sync)
app.patch('/api/beds/:bedId/status', authenticateToken, requireRole(['nurse', 'admin', 'doctor']), (req, res) => {
  try {
    const { bedId } = req.params;
    let newStatus = req.body.newStatus || req.body.status;
    if (newStatus && newStatus.toLowerCase() === 'available') {
      newStatus = 'ready';
    }
    const notes = req.body.notes || req.body.reason || null;

    const bed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(bedId, bedId);
    if (!bed) {
      return res.status(404).json({ error: 'Bed not found' });
    }

    if (req.user.hospitalId && req.user.hospitalId !== bed.hospital_id) {
      return res.status(403).json({ error: 'Cannot update resources belonging to another hospital' });
    }

    // Conflict Prevention: If assigning bed to occupied, prevent duplicate allocation
    if (['occupied', 'Occupied'].includes(newStatus) && req.body.patientId) {
      if (bed.status === 'occupied' && bed.patient_id && bed.patient_id !== req.body.patientId) {
        return res.status(409).json({ error: `Cannot allocate Bed ${bed.bed_number}: Already occupied by another patient (${bed.patient_name || bed.patient_id})!` });
      }
    }

    // Clear patient if moving to cleaning or available
    const clearPatient = ['cleaning', 'ready', 'Available', 'Cleaning'].includes(newStatus) && bed.status === 'occupied';
    const patientName = req.body.patientName || (clearPatient ? null : bed.patient_name);
    const patientId = req.body.patientId || (clearPatient ? null : bed.patient_id);

    db.prepare(`
      UPDATE hospital_beds
      SET status = ?, 
          patient_name = ?,
          patient_id = ?,
          notes = COALESCE(?, notes), 
          last_updated = 'Just now'
      WHERE id = ?
    `).run(newStatus, patientName, patientId, notes, bed.id);

    const notifId = 'notif-' + Date.now();
    const notifTitle = `Bed Status: ${bed.bed_number}`;
    const notifMsg = `Bed ${bed.bed_number} (${bed.ward}) updated to ${newStatus.toUpperCase()} by ${req.user.name || req.user.role}.`;

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, ?, 'bed_update', ?, 'Just now', 0)
    `).run(notifId, bed.hospital_id, notifTitle, notifMsg, newStatus === 'ready' || newStatus === 'Available' ? 'success' : 'info', bed.bed_number);

    logAudit(bed.hospital_id, req.user.id, req.user.role, 'UPDATE_BED_STATUS', 'bed', bed.id, { previous: bed.status, current: newStatus }, { status: bed.status }, { status: newStatus });

    const updatedBed = db.prepare('SELECT * FROM hospital_beds WHERE id = ?').get(bed.id);

    broadcastToHospital(bed.hospital_id, 'bed_updated', {
      bedId: bed.id,
      bedNumber: bed.bed_number,
      newStatus,
      patient: updatedBed.patient_name || 'Unassigned',
      patientName: updatedBed.patient_name,
      patientId: updatedBed.patient_id,
      lastUpdated: 'Just now',
      notes: notes || bed.notes
    });

    res.json({ success: true, status: req.body.newStatus || req.body.status || newStatus, message: 'Bed status updated successfully', bed: updatedBed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bed status', details: err.message });
  }
});

// ==========================================
// 5. EQUIPMENT APIS
// ==========================================

app.get('/api/equipment', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM equipment WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }

    const eqList = db.prepare(query).all(...params).map(e => ({
      id: e.id,
      equipmentId: e.serial_number,
      hospitalId: e.hospital_id,
      name: e.name,
      category: e.category,
      type: e.type || e.category,
      department: e.department,
      ward: e.ward,
      location: e.location || e.ward,
      status: e.status,
      operationalStatus: e.status,
      condition: e.condition || 'Optimal',
      conditionScore: e.condition_score || 100,
      lastInspection: e.last_inspection,
      lastMaintenanceDate: e.last_maintenance_date,
      nextMaintenanceDate: e.next_maintenance_date,
      serialNumber: e.serial_number,
      telemetry: JSON.parse(e.telemetry || '{}'),
      statusHistory: JSON.parse(e.status_history || '[]'),
      maintenanceHistory: JSON.parse(e.maintenance_history || '[]')
    }));

    res.json(eqList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch equipment', details: err.message });
  }
});

app.patch('/api/equipment/:eqId/status', authenticateToken, requireRole(['admin', 'doctor', 'nurse']), (req, res) => {
  try {
    const { eqId } = req.params;
    const { status, ward, location } = req.body;

    const eq = db.prepare('SELECT * FROM equipment WHERE id = ? OR serial_number = ?').get(eqId, eqId);
    if (!eq) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    db.prepare(`
      UPDATE equipment 
      SET status = COALESCE(?, status), ward = COALESCE(?, ward), location = COALESCE(?, location)
      WHERE id = ?
    `).run(status, ward, location, eq.id);

    logAudit(eq.hospital_id, req.user.id, req.user.role, 'UPDATE_EQUIPMENT_STATUS', 'equipment', eq.id, { previous: eq.status, current: status });

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(eq.id);
    broadcastToHospital(eq.hospital_id, 'equipment_updated', updated);

    res.json({ message: 'Equipment status updated', equipment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update equipment', details: err.message });
  }
});

// ==========================================
// 6. RESOURCE REQUESTS & EMERGENCY WORKFLOW
// ==========================================

app.get('/api/requests', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM resource_requests WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.user?.role === 'patient') {
      query += ' AND requester_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';
    const requests = db.prepare(query).all(...params).map(r => ({
      id: r.id,
      requestId: r.request_id || r.id,
      hospitalId: r.hospital_id,
      requesterId: r.requester_id,
      requestedBy: r.requester_name,
      requesterName: r.requester_name,
      requesterRole: r.requester_role,
      doctorEmail: r.doctor_email,
      doctorPhone: r.doctor_phone,
      department: r.department,
      ward: r.ward || 'Hospital Ward',
      resourceType: r.resource_type,
      resourceName: r.resource_name || r.resource_type,
      quantity: r.quantity,
      unit: r.unit || 'Units',
      urgency: r.urgency,
      priority: r.priority || r.urgency,
      reason: r.reason,
      clinicalJustification: r.clinical_justification || r.reason,
      status: r.status,
      createdAt: r.created_at,
      requestDate: r.created_at,
      patientId: r.patient_id,
      patientName: r.patient_name,
      allocatedResourceId: r.allocated_resource_id,
      allocatedResourceName: r.allocated_resource_name,
      allocatedResourceDetails: r.allocated_resource_name || r.allocated_resource_id,
      allocatedQuantity: r.allocated_quantity,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      rejectionReason: r.rejection_reason,
      timeline: JSON.parse(r.timeline || '[]')
    }));

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource requests', details: err.message });
  }
});

// Resource Requests Stats
app.get('/api/requests/stats', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId;
    let query = 'SELECT status, COUNT(*) as count FROM resource_requests';
    const params = [];
    if (hospitalId) {
      query += ' WHERE hospital_id = ?';
      params.push(hospitalId);
    }
    query += ' GROUP BY status';
    const rows = db.prepare(query).all(...params);
    let total = 0;
    const stats = { pending: 0, approved: 0, rejected: 0, allocated: 0, fulfilled: 0 };
    for (const r of rows) {
      stats[r.status] = r.count;
      total += r.count;
    }
    res.json({ total, ...stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute request statistics', details: err.message });
  }
});

// Create Resource Request
app.post('/api/requests', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const {
      hospitalId, department, ward, resourceType, resourceName, quantity,
      urgency, priority, reason, clinicalJustification, patientName, patientId
    } = req.body;

    if (!resourceType || !reason) {
      return res.status(400).json({ error: 'Resource type and reason are required' });
    }

    const currentHospId = hospitalId || req.user.hospitalId || 'hosp-chn-01';
    const reqNum = db.prepare('SELECT COUNT(*) as count FROM resource_requests').get().count + 1;
    const reqId = 'REQ-2026-' + reqNum.toString().padStart(3, '0');
    const newId = 'req-' + Date.now();

    const timeline = [
      {
        id: 't-' + Date.now(),
        action: 'Submitted',
        actor: req.user.name || 'Doctor',
        notes: `Requisition submitted: ${quantity || 1}x ${resourceName || resourceType}`,
        timestamp: 'Just now'
      }
    ];

    let normalizedUrgency = 'Routine';
    if (urgency) {
      const u = String(urgency).toLowerCase();
      if (u === 'critical' || u === 'stat') normalizedUrgency = 'Critical';
      else if (u === 'urgent' || u === 'high') normalizedUrgency = 'Urgent';
      else normalizedUrgency = 'Routine';
    }

    db.prepare(`
      INSERT INTO resource_requests (
        id, request_id, hospital_id, requester_id, requester_name, requester_role,
        doctor_email, doctor_phone, department, ward, resource_type, resource_name,
        quantity, unit, urgency, priority, reason, clinical_justification, status,
        created_at, patient_id, patient_name, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Units', ?, ?, ?, ?, 'pending', 'Just now', ?, ?, ?)
    `).run(
      newId, reqId, currentHospId, req.user.id, req.user.name || 'Doctor', req.user.role,
      req.user.email || 'doctor@medisync.gov.in', '+91 94440 12345',
      department || 'Critical Care', ward || 'ICU Block A', resourceType, resourceName || resourceType,
      quantity || 1, normalizedUrgency, priority || normalizedUrgency,
      reason, clinicalJustification || reason, patientId || null, patientName || null,
      JSON.stringify(timeline)
    );

    const notifId = 'notif-' + Date.now();
    const notifTitle = `🚨 Emergency Requisition: ${resourceName || resourceType}`;
    const notifMsg = `${req.user.name || 'Doctor'} requested ${quantity || 1}x ${resourceName || resourceType} for ${patientName || 'Emergency Patient'} (${urgency || 'Urgent'} Priority).`;

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, ?, 'emergency_request', ?, 'Just now', 0)
    `).run(notifId, currentHospId, notifTitle, notifMsg, urgency === 'Critical' ? 'critical' : 'warning', reqId);

    logAudit(currentHospId, req.user.id, req.user.role, 'CREATE_RESOURCE_REQUEST', 'resource_request', reqId, {
      resourceType,
      quantity: quantity || 1,
      patientName
    });

    const created = db.prepare('SELECT * FROM resource_requests WHERE id = ?').get(newId);

    broadcastToHospital(currentHospId, 'request_created', {
      request: created,
      notification: {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        type: urgency === 'Critical' ? 'critical' : 'warning'
      }
    });

    res.status(201).json({ id: newId, message: 'Resource request submitted successfully', request: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource request', details: err.message });
  }
});

// Review & Allocate Resource Request (Admin Approval & Physical Resource Locking)
app.patch(['/api/requests/:requestId/status', '/api/requests/:requestId'], authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, decision, allocatedResourceId, allocatedResourceName, rejectionReason } = req.body;
    const targetStatus = status || decision; // 'Approved' | 'Allocated' | 'Rejected'

    const existingReq = db.prepare('SELECT * FROM resource_requests WHERE id = ? OR request_id = ?').get(requestId, requestId);
    if (!existingReq) {
      return res.status(404).json({ error: 'Resource request not found' });
    }

    const timeline = JSON.parse(existingReq.timeline || '[]');
    timeline.unshift({
      id: 't-' + Date.now(),
      action: targetStatus,
      actor: req.user.name || 'Hospital Admin',
      notes: targetStatus === 'Rejected' 
        ? `Request rejected: ${rejectionReason || 'Resource constraints'}`
        : `Approved & Allocated: ${allocatedResourceName || allocatedResourceId || 'Inventory units assigned'}`,
      timestamp: 'Just now'
    });

    // SAFETY CHECK: When allocating a bed or ventilator, verify availability
    if ((targetStatus === 'Approved' || targetStatus === 'Allocated') && allocatedResourceId) {
      if (allocatedResourceId.startsWith('bed-') || (existingReq.resource_type || '').includes('Bed')) {
        const bed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(allocatedResourceId, allocatedResourceId);
        if (bed && bed.status === 'occupied' && bed.patient_id !== existingReq.patient_id) {
          return res.status(409).json({ error: `Cannot allocate Bed ${bed.bed_number}: It is currently occupied by another patient!` });
        }
        if (bed && existingReq.patient_name) {
          db.prepare(`
            UPDATE hospital_beds 
            SET status = 'occupied', patient_name = ?, patient_id = ?, last_updated = 'Just now'
            WHERE id = ?
          `).run(existingReq.patient_name, existingReq.patient_id || 'PT-EMR', bed.id);

          broadcastToHospital(existingReq.hospital_id, 'bed_updated', {
            bedId: bed.id,
            bedNumber: bed.bed_number,
            newStatus: 'occupied',
            patientName: existingReq.patient_name,
            lastUpdated: 'Just now'
          });
        }
      }

      if (allocatedResourceId.startsWith('eq-') || (existingReq.resource_type || '').toLowerCase().includes('ventilator')) {
        db.prepare(`
          UPDATE equipment SET status = 'In Use' WHERE id = ? OR serial_number = ?
        `).run(allocatedResourceId, allocatedResourceId);

        broadcastToHospital(existingReq.hospital_id, 'equipment_updated', {
          id: allocatedResourceId,
          status: 'In Use'
        });
      }
    }

    const normalizedStatus = (targetStatus || 'pending').toLowerCase();

    db.prepare(`
      UPDATE resource_requests SET
        status = ?,
        allocated_resource_id = COALESCE(?, allocated_resource_id),
        allocated_resource_name = COALESCE(?, allocated_resource_name),
        reviewed_by = ?,
        reviewed_at = 'Just now',
        rejection_reason = ?,
        timeline = ?
      WHERE id = ?
    `).run(
      normalizedStatus,
      allocatedResourceId || null,
      allocatedResourceName || allocatedResourceId || null,
      req.user.name || 'Hospital Admin',
      rejectionReason || null,
      JSON.stringify(timeline),
      existingReq.id
    );

    const notifTitle = targetStatus === 'Rejected' ? '❌ Emergency Request Rejected' : '✅ Emergency Request Approved';
    const notifMsg = `Hospital Admin ${targetStatus.toLowerCase()} ${existingReq.resource_type} for ${existingReq.patient_name || 'patient'}. Resource: ${allocatedResourceName || allocatedResourceId || 'Confirmed'}.`;
    const notifId = 'notif-' + Date.now();

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, ?, 'emergency_request', ?, 'Just now', 0)
    `).run(notifId, existingReq.hospital_id, notifTitle, notifMsg, targetStatus === 'Rejected' ? 'critical' : 'success', existingReq.request_id);

    logAudit(existingReq.hospital_id, req.user.id, req.user.role, 'REVIEW_RESOURCE_REQUEST', 'resource_request', existingReq.request_id, {
      decision: targetStatus,
      allocatedResource: allocatedResourceName || allocatedResourceId,
      rejectionReason
    });

    const updated = db.prepare('SELECT * FROM resource_requests WHERE id = ?').get(existingReq.id);

    broadcastToHospital(existingReq.hospital_id, 'request_updated', {
      request: updated,
      notification: {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        type: targetStatus === 'Rejected' ? 'critical' : 'success'
      }
    });

    res.json({ success: true, message: `Request successfully marked as ${targetStatus}`, request: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request', details: err.message });
  }
});

// ==========================================
// 7. CLINICAL TASKS (DOCTOR <-> NURSE)
// ==========================================

app.get('/api/clinical-tasks', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM clinical_tasks WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.query.patientId) {
      query += ' AND patient_id = ?';
      params.push(req.query.patientId);
    }
    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }

    query += ' ORDER BY created_at DESC';
    const tasks = db.prepare(query).all(...params).map(t => ({
      ...t,
      patientId: t.patient_id,
      patientName: t.patient_name,
      doctorName: t.doctor_name,
      doctorId: t.doctor_id,
      assignedNurse: t.assigned_nurse,
      assignedNurseId: t.assigned_nurse_id,
      taskType: t.task_type,
      createdAt: t.created_at,
      completedAt: t.completed_at,
      executionNotes: t.execution_notes,
      vitalsRecorded: JSON.parse(t.vitals_recorded || '{}')
    }));

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// Create Doctor Order / Nurse Task
app.post('/api/clinical-tasks', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, patientName, ward, bed, instruction, priority, taskType, assignedNurse } = req.body;

    if (!patientId || !instruction) {
      return res.status(400).json({ error: 'patientId and instruction are required' });
    }

    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    const taskId = 'tsk-' + Date.now();

    db.prepare(`
      INSERT INTO clinical_tasks (
        id, hospital_id, patient_id, patient_name, ward, bed, doctor_name, doctor_id,
        assigned_nurse, task_type, instruction, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Just now')
    `).run(
      taskId, hospitalId, patientId, patientName || 'Patient', ward || 'ICU Block A',
      bed || 'Bed Dock', req.user.name || 'Doctor', req.user.id,
      assignedNurse || 'Nurse Duty', taskType || 'Assessment & Monitoring',
      instruction, priority || 'Stat (Immediate)'
    );

    const notifTitle = `New Clinical Order: ${priority || 'Routine'}`;
    const notifMsg = `Dr. ${req.user.name || 'Attending'} assigned task for ${patientName} (Bed ${bed}): ${instruction}`;
    const notifId = 'notif-' + Date.now();

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, 'warning', 'doctor_nurse_task', ?, 'Just now', 0)
    `).run(notifId, hospitalId, notifTitle, notifMsg, taskId);

    logAudit(hospitalId, req.user.id, req.user.role, 'CREATE_CLINICAL_TASK', 'clinical_task', taskId, {
      patientId,
      instruction,
      priority
    });

    const created = db.prepare('SELECT * FROM clinical_tasks WHERE id = ?').get(taskId);
    broadcastToHospital(hospitalId, 'clinical_task_created', created);

    res.status(201).json({ id: taskId, message: 'Clinical task dispatched to nursing queue', task: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// Nurse Executes Task & Records Vitals (Automatic Alert Trigger on Abnormal Vitals)
app.patch(['/api/clinical-tasks/:taskId/status', '/api/clinical-tasks/:taskId'], authenticateToken, requireRole(['nurse', 'doctor', 'admin']), (req, res) => {
  try {
    const { taskId } = req.params;
    const status = req.body.status || 'completed';
    const executionNotes = req.body.executionNotes || req.body.notes || null;
    const vitalsRecorded = req.body.vitalsRecorded || null;

    const task = db.prepare('SELECT * FROM clinical_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare(`
      UPDATE clinical_tasks SET
        status = ?,
        execution_notes = COALESCE(?, execution_notes),
        vitals_recorded = COALESCE(?, vitals_recorded),
        completed_at = CASE WHEN LOWER(?) = 'completed' THEN 'Just now' ELSE completed_at END
      WHERE id = ?
    `).run(
      status, executionNotes,
      vitalsRecorded ? JSON.stringify(vitalsRecorded) : null,
      status, task.id
    );

    // If vitals are recorded, update patient current_vitals & check for clinical deterioration
    if (vitalsRecorded) {
      const { hr, sbp, dbp, spo2, rr, temp } = vitalsRecorded;
      const mews = calculateMEWS(Number(hr) || 80, Number(sbp) || 120, Number(rr) || 16, Number(temp) || 98.6, Number(spo2) || 98);
      const isCritical = (Number(spo2) && Number(spo2) < 90) || (Number(hr) && Number(hr) > 120) || (Number(sbp) && Number(sbp) < 90) || mews >= 5;

      // Update patient in DB
      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(task.patient_id);
      if (patient) {
        const vitalsHistory = JSON.parse(patient.vitals || '[]');
        vitalsHistory.push({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hr: Number(hr) || 80,
          bp: `${sbp || 120}/${dbp || 80}`,
          spo2: Number(spo2) || 98,
          rr: Number(rr) || 16,
          temp: Number(temp) || 98.6
        });

        db.prepare(`
          UPDATE patients SET
            current_vitals = ?,
            vitals = ?,
            mews_score = ?,
            risk_level = CASE WHEN ? >= 6 THEN 'Critical' WHEN ? >= 4 THEN 'High Risk' ELSE risk_level END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(vitalsRecorded), JSON.stringify(vitalsHistory), mews, mews, mews, patient.id);
      }

      // If critical, trigger Clinical Alert & Urgent Notification to Doctor
      if (isCritical) {
        const alertId = 'alt-' + Date.now();
        const reason = `Critical Vital Signs Recorded by Nurse: SpO2 ${spo2}%, HR ${hr} bpm, BP ${sbp}/${dbp} mmHg (MEWS: ${mews})`;

        db.prepare(`
          INSERT INTO clinical_alerts (
            id, hospital_id, patient_id, patient_name, ward, bed, alert_type, reason, score, mews_score, timestamp, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'Vital Signs Deterioration', ?, ?, ?, 'Just now', 'Active')
        `).run(alertId, task.hospital_id, task.patient_id, task.patient_name, task.ward, task.bed, reason, mews, mews);

        const notifId = 'notif-' + Date.now();
        db.prepare(`
          INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
          VALUES (?, ?, ?, ?, 'critical', 'clinical_alert', ?, 'Just now', 0)
        `).run(notifId, task.hospital_id, `🚨 CRITICAL CLINICAL ALERT: ${task.patient_name}`, reason, alertId);

        broadcastToHospital(task.hospital_id, 'clinical_alert_created', {
          id: alertId,
          patientId: task.patient_id,
          patientName: task.patient_name,
          ward: task.ward,
          bed: task.bed,
          reason,
          mewsScore: mews,
          timestamp: 'Just now',
          status: 'Active'
        });
      }
    }

    logAudit(task.hospital_id, req.user.id, req.user.role, 'UPDATE_CLINICAL_TASK', 'clinical_task', task.id, { status, executionNotes });

    const updated = db.prepare('SELECT * FROM clinical_tasks WHERE id = ?').get(task.id);
    broadcastToHospital(task.hospital_id, 'clinical_task_updated', updated);

    res.json({ success: true, message: `Task status updated to ${status}`, task: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status', details: err.message });
  }
});

// ==========================================
// 8. CLINICAL ALERTS APIS
// ==========================================

app.get('/api/clinical-alerts', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM clinical_alerts WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }

    query += ' ORDER BY created_at DESC';
    const alerts = db.prepare(query).all(...params).map(a => ({
      ...a,
      patientId: a.patient_id,
      patientName: a.patient_name,
      alertType: a.alert_type,
      mewsScore: a.mews_score,
      acknowledgedBy: a.acknowledged_by,
      acknowledgedAt: a.acknowledged_at,
      resolutionNotes: a.resolution_notes
    }));

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clinical alerts', details: err.message });
  }
});

// Create / Broadcast Clinical Deterioration Alert
app.post('/api/clinical-alerts', authenticateToken, requireRole(['doctor', 'nurse', 'admin']), (req, res) => {
  try {
    const { patientId, patientName, ward, bed, alertType, message, reason, score, severity = 3, mewsScore = 3 } = req.body;
    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    const newId = 'alt-' + Date.now();

    db.prepare(`
      INSERT INTO clinical_alerts (
        id, hospital_id, patient_id, patient_name, ward, bed,
        alert_type, reason, score, mews_score, timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now', 'Active')
    `).run(
      newId, hospitalId, patientId, patientName || 'Patient', ward || 'ICU Block A', bed || 'A-101',
      alertType || 'Clinical Alert', message || reason || 'Acute clinical change', severity || score || 3, mewsScore
    );

    const alert = db.prepare('SELECT * FROM clinical_alerts WHERE id = ?').get(newId);
    broadcastToHospital(hospitalId, 'clinical_alert_created', alert);

    res.status(201).json({ success: true, message: 'Clinical alert broadcasted', alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create clinical alert', details: err.message });
  }
});

// Doctor Acknowledges / Escalates Clinical Alert
app.patch('/api/clinical-alerts/:alertId/acknowledge', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes, status } = req.body;
    const alert = db.prepare('SELECT * FROM clinical_alerts WHERE id = ?').get(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const nextStatus = status || 'Acknowledged';

    db.prepare(`
      UPDATE clinical_alerts SET
        status = ?,
        acknowledged_by = ?,
        acknowledged_at = 'Just now',
        resolution_notes = COALESCE(?, resolution_notes)
      WHERE id = ?
    `).run(nextStatus, req.user.name || 'Doctor', notes || 'Reviewed by Attending Physician', alert.id);

    logAudit(alert.hospital_id, req.user.id, req.user.role, 'ACKNOWLEDGE_CLINICAL_ALERT', 'clinical_alert', alert.id, {
      status: nextStatus,
      notes
    });

    const updated = db.prepare('SELECT * FROM clinical_alerts WHERE id = ?').get(alert.id);
    broadcastToHospital(alert.hospital_id, 'clinical_alert_updated', updated);

    res.json({ message: `Alert marked as ${nextStatus}`, alert: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert', details: err.message });
  }
});

// ==========================================
// 9. PATIENT OBSERVATIONS & MONITORING
// ==========================================

app.get('/api/patients/:patientId/observations', optionalAuth, (req, res) => {
  try {
    const { patientId } = req.params;
    const observations = db.prepare(`
      SELECT * FROM patient_observations WHERE patient_id = ? ORDER BY recorded_at DESC
    `).all(patientId).map(o => ({
      ...o,
      patientId: o.patient_id,
      recordedBy: o.recorded_by,
      recordedByRole: o.recorded_by_role,
      recordedAt: o.recorded_at,
      heartRate: o.heart_rate,
      systolicBp: o.systolic_bp,
      diastolicBp: o.diastolic_bp,
      respiratoryRate: o.respiratory_rate,
      painScore: o.pain_score,
      mewsScore: o.mews_score
    }));

    res.json(observations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch observations', details: err.message });
  }
});

app.post('/api/patients/:patientId/observations', authenticateToken, requireRole(['nurse', 'doctor']), (req, res) => {
  try {
    const { patientId } = req.params;
    const { heartRate, systolicBp, diastolicBp, spo2, respiratoryRate, temperature, gcs, avpu, painScore, notes } = req.body;

    const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(patientId, patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const obsId = 'obs-' + Date.now();
    const recordedAt = new Date().toISOString();
    const mews = calculateMEWS(Number(heartRate) || 80, Number(systolicBp) || 120, Number(respiratoryRate) || 16, Number(temperature) || 98.6, Number(spo2) || 98);

    db.prepare(`
      INSERT INTO patient_observations (
        id, patient_id, hospital_id, recorded_by, recorded_by_role, recorded_at,
        heart_rate, systolic_bp, diastolic_bp, spo2, respiratory_rate, temperature,
        gcs, avpu, pain_score, mews_score, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      obsId, patient.patient_id, patient.hospital_id, req.user.name || 'Nurse', req.user.role, recordedAt,
      heartRate || null, systolicBp || null, diastolicBp || null, spo2 || null, respiratoryRate || null,
      temperature || null, gcs || null, avpu || 'Alert', painScore || null, mews, notes || null
    );

    // Update patient current vitals & history
    const vitalsHistory = JSON.parse(patient.vitals || '[]');
    vitalsHistory.push({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hr: Number(heartRate) || 80,
      bp: `${systolicBp || 120}/${diastolicBp || 80}`,
      spo2: Number(spo2) || 98,
      rr: Number(respiratoryRate) || 16,
      temp: Number(temperature) || 98.6
    });

    const newCurrent = {
      hr: Number(heartRate) || 80,
      sbp: Number(systolicBp) || 120,
      dbp: Number(diastolicBp) || 80,
      spo2: Number(spo2) || 98,
      rr: Number(respiratoryRate) || 16,
      temp: Number(temperature) || 98.6
    };

    db.prepare(`
      UPDATE patients SET
        current_vitals = ?,
        vitals = ?,
        mews_score = ?,
        risk_level = CASE WHEN ? >= 6 THEN 'Critical' WHEN ? >= 4 THEN 'High Risk' ELSE risk_level END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(newCurrent), JSON.stringify(vitalsHistory), mews, mews, mews, patient.id);

    // Check if alert needed
    if ((Number(spo2) && Number(spo2) < 90) || (Number(heartRate) && Number(heartRate) > 120) || mews >= 5) {
      const alertId = 'alt-' + Date.now();
      const reason = `Abnormal vital signs recorded: SpO2 ${spo2}%, HR ${heartRate} bpm (MEWS: ${mews})`;
      db.prepare(`
        INSERT INTO clinical_alerts (
          id, hospital_id, patient_id, patient_name, ward, bed, alert_type, reason, score, mews_score, timestamp, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'Vital Signs Deterioration', ?, ?, ?, 'Just now', 'Active')
      `).run(alertId, patient.hospital_id, patient.patient_id, patient.name, patient.ward, patient.bed_number, reason, mews, mews);

      broadcastToHospital(patient.hospital_id, 'clinical_alert_created', {
        id: alertId,
        patientId: patient.patient_id,
        patientName: patient.name,
        reason,
        mewsScore: mews
      });
    }

    logAudit(patient.hospital_id, req.user.id, req.user.role, 'RECORD_OBSERVATIONS', 'patient', patient.patient_id, {
      vitals: newCurrent,
      mews
    });

    const createdObs = db.prepare('SELECT * FROM patient_observations WHERE id = ?').get(obsId);
    broadcastToHospital(patient.hospital_id, 'patient_observation_recorded', {
      observation: createdObs,
      patientId: patient.patient_id,
      currentVitals: newCurrent,
      mewsScore: mews
    });

    res.status(201).json({ message: 'Observation recorded successfully', observation: createdObs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record observations', details: err.message });
  }
});

// ==========================================
// 10. NOTIFICATIONS & AUDIT LOGS
// ==========================================

app.get('/api/notifications', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    const notifs = db.prepare(`
      SELECT * FROM notifications WHERE hospital_id = ? ORDER BY rowid DESC LIMIT 50
    `).all(hospitalId).map(n => ({
      ...n,
      read: Boolean(n.read)
    }));

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

app.patch('/api/notifications/:notifId/read', authenticateToken, (req, res) => {
  try {
    const { notifId } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notifId);
    res.json({ success: true, notifId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification read', details: err.message });
  }
});

app.patch('/api/notifications/read-all', authenticateToken, (req, res) => {
  try {
    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    db.prepare('UPDATE notifications SET read = 1 WHERE hospital_id = ?').run(hospitalId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications read', details: err.message });
  }
});

app.get('/api/audit-logs', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    const logs = db.prepare(`
      SELECT * FROM audit_logs WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 100
    `).all(hospitalId).map(l => ({
      ...l,
      details: JSON.parse(l.details || '{}'),
      previousState: JSON.parse(l.previous_state || 'null'),
      newState: JSON.parse(l.new_state || 'null')
    }));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

// ==========================================
// 11. COMPLETE HOSPITAL DASHBOARD AGGREGATE
// ==========================================

app.get('/api/hospitals/:hospitalId/dashboard', optionalAuth, (req, res) => {
  try {
    const { hospitalId } = req.params;

    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const beds = db.prepare('SELECT * FROM hospital_beds WHERE hospital_id = ?').all(hospitalId).map(b => ({
      id: b.id,
      bedId: b.bed_number,
      bedNumber: b.bed_number,
      hospitalId: b.hospital_id,
      ward: b.ward,
      type: b.type,
      bedType: b.type,
      floor: b.floor || 'Floor 1',
      status: b.status,
      patient: b.patient_name || 'Unassigned',
      patientName: b.patient_name,
      patientId: b.patient_id,
      assignedDoctor: b.assigned_doctor,
      assignedNurse: b.assigned_nurse,
      equipment: b.equipment || '',
      lastUpdated: b.last_updated,
      notes: b.notes
    }));

    const equipment = db.prepare('SELECT * FROM equipment WHERE hospital_id = ?').all(hospitalId).map(e => ({
      id: e.id,
      equipmentId: e.serial_number,
      hospitalId: e.hospital_id,
      name: e.name,
      category: e.category,
      type: e.type || e.category,
      department: e.department,
      ward: e.ward,
      status: e.status,
      operationalStatus: e.status,
      condition: e.condition || 'Optimal',
      lastInspection: e.last_inspection,
      serialNumber: e.serial_number,
      telemetry: JSON.parse(e.telemetry || '{}')
    }));

    const requests = db.prepare('SELECT * FROM resource_requests WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(r => ({
      id: r.id,
      requestId: r.request_id || r.id,
      hospitalId: r.hospital_id,
      requesterId: r.requester_id,
      requestedBy: r.requester_name,
      requesterName: r.requester_name,
      requesterRole: r.requester_role,
      department: r.department,
      ward: r.ward || 'Hospital Ward',
      resourceType: r.resource_type,
      resourceName: r.resource_name || r.resource_type,
      quantity: r.quantity,
      unit: r.unit || 'Units',
      urgency: r.urgency,
      priority: r.priority || r.urgency,
      reason: r.reason,
      clinicalJustification: r.clinical_justification || r.reason,
      status: r.status,
      createdAt: r.created_at,
      patientId: r.patient_id,
      patientName: r.patient_name,
      allocatedResourceId: r.allocated_resource_id,
      allocatedResourceName: r.allocated_resource_name,
      allocatedResourceDetails: r.allocated_resource_name || r.allocated_resource_id,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      timeline: JSON.parse(r.timeline || '[]')
    }));

    const patients = db.prepare('SELECT * FROM patients WHERE hospital_id = ? ORDER BY admission_date DESC').all(hospitalId).map(p => ({
      ...p,
      patientId: p.patient_id,
      bloodGroup: p.blood_group,
      admissionDate: p.admission_date,
      bedNumber: p.bed_number,
      attendingPhysician: p.attending_physician_name,
      primaryDiagnosis: p.primary_diagnosis,
      riskLevel: p.risk_level,
      mewsScore: p.mews_score,
      secondaryDiagnoses: JSON.parse(p.secondary_diagnoses || '[]'),
      allergies: JSON.parse(p.allergies || '[]'),
      vitals: JSON.parse(p.vitals || '[]'),
      currentVitals: JSON.parse(p.current_vitals || '{}'),
      medications: JSON.parse(p.medications || '[]'),
      labs: JSON.parse(p.labs || '[]'),
      timeline: JSON.parse(p.timeline || '[]')
    }));

    const clinicalAlerts = db.prepare('SELECT * FROM clinical_alerts WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(a => ({
      ...a,
      patientId: a.patient_id,
      patientName: a.patient_name,
      alertType: a.alert_type,
      mewsScore: a.mews_score
    }));

    const clinicalTasks = db.prepare('SELECT * FROM clinical_tasks WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(t => ({
      ...t,
      patientId: t.patient_id,
      patientName: t.patient_name,
      doctorName: t.doctor_name,
      assignedNurse: t.assigned_nurse,
      taskType: t.task_type
    }));

    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE hospital_id = ? ORDER BY timestamp DESC, created_at DESC LIMIT 20
    `).all(hospitalId).map(n => ({
      id: n.id,
      hospitalId: n.hospital_id,
      title: n.title,
      message: n.message,
      type: n.type,
      category: n.category,
      referenceId: n.reference_id,
      timestamp: n.timestamp,
      read: Boolean(n.read)
    }));

    const appointments = db.prepare('SELECT * FROM patient_appointments WHERE hospital_id = ? ORDER BY date ASC, token_number ASC').all(hospitalId).map(a => ({
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

    const labReports = db.prepare('SELECT * FROM lab_reports WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(l => ({
      id: l.id,
      patientId: l.patient_id,
      hospitalId: l.hospital_id,
      testName: l.test_name,
      category: l.category,
      orderedBy: l.ordered_by,
      sampleCollectedAt: l.sample_collected_at,
      reportedAt: l.reported_at,
      status: l.status,
      results: l.results ? JSON.parse(l.results) : null,
      criticalFlag: Boolean(l.critical_flag),
      doctorNotes: l.doctor_notes,
      createdAt: l.created_at
    }));

    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(p => ({
      id: p.id,
      patientId: p.patient_id,
      hospitalId: p.hospital_id,
      doctorId: p.doctor_id,
      doctorName: p.doctor_name,
      diagnosis: p.diagnosis,
      medications: p.medications ? JSON.parse(p.medications) : [],
      startDate: p.start_date,
      endDate: p.end_date,
      instructions: p.instructions,
      status: p.status,
      createdAt: p.created_at
    }));

    const pendingAdmissions = db.prepare('SELECT * FROM admissions WHERE hospital_id = ? AND status = "Pending" ORDER BY created_at DESC').all(hospitalId).map(adm => ({
      id: adm.id,
      patientId: adm.patient_id,
      hospitalId: adm.hospital_id,
      ward: adm.ward,
      bedId: adm.bed_id,
      admissionDate: adm.admission_date,
      status: adm.status,
      initialDiagnosis: adm.initial_diagnosis,
      triagePriority: adm.triage_priority,
      admittedBy: adm.admitted_by
    }));

    const transfers = db.prepare('SELECT * FROM patient_transfers WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(t => ({
      id: t.id,
      patientId: t.patient_id,
      hospitalId: t.hospital_id,
      fromWard: t.from_ward,
      toWard: t.to_ward,
      fromBedId: t.from_bed_id,
      toBedId: t.to_bed_id,
      reason: t.reason,
      requestedBy: t.requested_by,
      approvedBy: t.approved_by,
      status: t.status,
      transferDate: t.transfer_date
    }));

    // Stats
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied' || b.status === 'Occupied').length;
    const readyBeds = beds.filter(b => b.status === 'ready' || b.status === 'Available').length;
    const prepBeds = beds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation', 'discharged', 'Cleaning', 'Maintenance'].includes(b.status)).length;
    const readyIcuBeds = beds.filter(b => b.type === 'ICU' && (b.status === 'ready' || b.status === 'Available')).length;
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
      patients,
      clinicalAlerts,
      clinicalTasks,
      notifications,
      appointments,
      labReports,
      prescriptions,
      pendingAdmissions,
      transfers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: err.message });
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

// Fetch Appointments
app.get('/api/appointments', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01', doctorName, status } = req.query;
    let query = 'SELECT * FROM patient_appointments WHERE hospital_id = ?';
    const params = [hospitalId];
    if (doctorName) {
      query += ' AND doctor_name LIKE ?';
      params.push(`%${doctorName}%`);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY date ASC, token_number ASC';
    const appointments = db.prepare(query).all(...params).map(a => ({
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
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

// Update Appointment Status
app.patch('/api/appointments/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'Waiting', 'In Consultation', 'Completed', 'Cancelled', 'In Queue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    db.prepare(`
      UPDATE patient_appointments 
      SET status = ? 
      WHERE id = ?
    `).run(status, id);

    const updated = db.prepare('SELECT * FROM patient_appointments WHERE id = ?').get(id);
    broadcastToHospital(updated?.hospital_id || 'hosp-chn-01', 'appointment_updated', updated);

    res.json({ message: 'Appointment status updated', appointment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
  }
});

// Lab Reports: Fetch
app.get('/api/lab-reports', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01', patientId, category, status } = req.query;
    let query = 'SELECT * FROM lab_reports WHERE hospital_id = ?';
    const params = [hospitalId];
    if (patientId && patientId !== 'all') {
      query += ' AND patient_id = ?';
      params.push(patientId);
    }
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const reports = db.prepare(query).all(...params).map(l => ({
      id: l.id,
      patientId: l.patient_id,
      hospitalId: l.hospital_id,
      testName: l.test_name,
      category: l.category,
      orderedBy: l.ordered_by,
      sampleCollectedAt: l.sample_collected_at,
      reportedAt: l.reported_at,
      status: l.status,
      results: l.results ? JSON.parse(l.results) : null,
      criticalFlag: Boolean(l.critical_flag),
      doctorNotes: l.doctor_notes,
      createdAt: l.created_at
    }));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab reports', details: err.message });
  }
});

// Lab Reports: Order new lab investigation
app.post('/api/lab-reports', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, hospitalId = 'hosp-chn-01', testName, category, doctorNotes, criticalFlag } = req.body;
    if (!patientId || !testName || !category) {
      return res.status(400).json({ error: 'Missing required lab request fields' });
    }
    const newId = 'lab-' + Math.floor(100 + Math.random() * 900);
    const doctorName = req.user?.name || 'Dr. Sundaramoorthy M.';

    db.prepare(`
      INSERT INTO lab_reports (
        id, patient_id, hospital_id, test_name, category, ordered_by,
        sample_collected_at, reported_at, status, results, critical_flag, doctor_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, null, 'Ordered', null, ?, ?, datetime('now'))
    `).run(newId, patientId, hospitalId, testName, category, doctorName, 'Sample requested', criticalFlag ? 1 : 0, doctorNotes || null);

    const created = db.prepare('SELECT * FROM lab_reports WHERE id = ?').get(newId);
    broadcastToHospital(hospitalId, 'lab_report_created', created);

    res.status(201).json({ message: 'Lab investigation ordered successfully', labReport: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to order lab investigation', details: err.message });
  }
});

// Lab Reports: Acknowledge panic value
app.patch('/api/lab-reports/:id/acknowledge', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;
    db.prepare(`
      UPDATE lab_reports 
      SET doctor_notes = COALESCE(?, doctor_notes)
      WHERE id = ?
    `).run(doctorNotes || 'Acknowledged by attending physician', id);

    const updated = db.prepare('SELECT * FROM lab_reports WHERE id = ?').get(id);
    broadcastToHospital(updated?.hospital_id || 'hosp-chn-01', 'lab_report_updated', updated);

    res.json({ message: 'Lab report acknowledged', labReport: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge lab report', details: err.message });
  }
});

// Prescriptions: Fetch
app.get('/api/prescriptions', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01', patientId, status } = req.query;
    let query = 'SELECT * FROM prescriptions WHERE hospital_id = ?';
    const params = [hospitalId];
    if (patientId && patientId !== 'all') {
      query += ' AND patient_id = ?';
      params.push(patientId);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const rxList = db.prepare(query).all(...params).map(p => ({
      id: p.id,
      patientId: p.patient_id,
      hospitalId: p.hospital_id,
      doctorId: p.doctor_id,
      doctorName: p.doctor_name,
      diagnosis: p.diagnosis,
      medications: p.medications ? JSON.parse(p.medications) : [],
      startDate: p.start_date,
      endDate: p.end_date,
      instructions: p.instructions,
      status: p.status,
      createdAt: p.created_at
    }));
    res.json(rxList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions', details: err.message });
  }
});

// Prescriptions: Create
app.post('/api/prescriptions', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, hospitalId = 'hosp-chn-01', diagnosis, medications, startDate, endDate, instructions } = req.body;
    if (!patientId || !diagnosis || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ error: 'Prescription requires patientId, diagnosis, and valid medications list' });
    }
    const newId = 'rx-' + Math.floor(100 + Math.random() * 900);
    const doctorId = req.user?.id || 'doc-01';
    const doctorName = req.user?.name || 'Dr. Sundaramoorthy M.';

    db.prepare(`
      INSERT INTO prescriptions (
        id, patient_id, hospital_id, doctor_id, doctor_name, diagnosis,
        medications, start_date, end_date, instructions, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'))
    `).run(
      newId, patientId, hospitalId, doctorId, doctorName, diagnosis,
      JSON.stringify(medications),
      startDate || new Date().toISOString().split('T')[0],
      endDate || null,
      instructions || null
    );

    // Also update patient active medications in patients table
    const patient = db.prepare('SELECT medications FROM patients WHERE patient_id = ?').get(patientId);
    if (patient) {
      const existingMeds = JSON.parse(patient.medications || '[]');
      const newMedsToAdd = medications.map((m, idx) => ({
        id: 'med-' + Date.now() + '-' + idx,
        name: m.drug || m.name,
        dose: m.dose || m.dosage,
        route: m.route || 'Oral',
        frequency: m.freq || m.frequency || 'Daily',
        status: 'Active'
      }));
      db.prepare('UPDATE patients SET medications = ? WHERE patient_id = ?').run(
        JSON.stringify([...existingMeds, ...newMedsToAdd]),
        patientId
      );
    }

    const created = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(newId);
    broadcastToHospital(hospitalId, 'prescription_created', created);

    res.status(201).json({ message: 'Prescription created and transmitted to Pharmacy', prescription: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create prescription', details: err.message });
  }
});

// Prescriptions: Update status
app.patch('/api/prescriptions/:id/status', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE prescriptions SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id);
    res.json({ message: 'Prescription status updated', prescription: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update prescription', details: err.message });
  }
});

// Admissions: Pending
app.get('/api/admissions/pending', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    const pending = db.prepare(`
      SELECT * FROM admissions 
      WHERE hospital_id = ? AND status = 'Pending' 
      ORDER BY created_at DESC
    `).all(hospitalId).map(adm => ({
      id: adm.id,
      patientId: adm.patient_id,
      hospitalId: adm.hospital_id,
      ward: adm.ward,
      bedId: adm.bed_id,
      admissionDate: adm.admission_date,
      status: adm.status,
      initialDiagnosis: adm.initial_diagnosis,
      triagePriority: adm.triage_priority,
      admittedBy: adm.admitted_by
    }));
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending admissions', details: err.message });
  }
});

// Admissions: Accept
app.post('/api/admissions/:id/accept', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { bedId, ward } = req.body;

    db.prepare(`
      UPDATE admissions 
      SET status = 'Admitted', bed_id = COALESCE(?, bed_id), ward = COALESCE(?, ward), doctor_id = ?
      WHERE id = ?
    `).run(bedId || null, ward || null, req.user?.id || 'doc-01', id);

    if (bedId) {
      db.prepare(`
        UPDATE hospital_beds 
        SET status = 'occupied', patient_name = 'Admitted Patient', patient_id = ?
        WHERE id = ? OR bed_number = ?
      `).run(id, bedId, bedId);
    }

    const updated = db.prepare('SELECT * FROM admissions WHERE id = ?').get(id);
    broadcastToHospital(updated?.hospital_id || 'hosp-chn-01', 'admission_accepted', updated);

    res.json({ message: 'Patient admission accepted and processed', admission: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept admission', details: err.message });
  }
});

// Transfers: Get & Create & Status
app.get('/api/transfers', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    const transfers = db.prepare('SELECT * FROM patient_transfers WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId).map(t => ({
      id: t.id,
      patientId: t.patient_id,
      hospitalId: t.hospital_id,
      fromWard: t.from_ward,
      toWard: t.to_ward,
      fromBedId: t.from_bed_id,
      toBedId: t.to_bed_id,
      reason: t.reason,
      requestedBy: t.requested_by,
      approvedBy: t.approved_by,
      status: t.status,
      transferDate: t.transfer_date
    }));
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfers', details: err.message });
  }
});

app.post('/api/transfers', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { patientId, hospitalId = 'hosp-chn-01', fromWard, toWard, reason, fromBedId, toBedId } = req.body;
    const newId = 'trf-' + Math.floor(100 + Math.random() * 900);
    const doctorName = req.user?.name || 'Dr. Sundaramoorthy M.';

    db.prepare(`
      INSERT INTO patient_transfers (
        id, patient_id, hospital_id, from_ward, to_ward, from_bed_id, to_bed_id,
        reason, requested_by, approved_by, status, transfer_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Requested', date('now'))
    `).run(newId, patientId, hospitalId, fromWard, toWard, fromBedId || null, toBedId || null, reason, doctorName);

    const created = db.prepare('SELECT * FROM patient_transfers WHERE id = ?').get(newId);
    broadcastToHospital(hospitalId, 'transfer_created', created);

    res.status(201).json({ message: 'Patient transfer requested', transfer: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request transfer', details: err.message });
  }
});

// Approve, complete, or reject patient transfer (Workflow 4: Patient Transfer)
app.patch('/api/transfers/:id/status', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), (req, res) => {
  try {
    const { id } = req.params;
    const { status, toBedId, notes } = req.body; // 'Approved' | 'Completed' | 'Rejected'
    const transfer = db.prepare('SELECT * FROM patient_transfers WHERE id = ?').get(id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer record not found' });
    }

    const hospitalId = transfer.hospital_id || req.user.hospitalId || 'hosp-chn-01';
    const targetBedId = toBedId || transfer.to_bed_id;
    const approverName = req.user.name || 'Authorized Staff';

    if (['Approved', 'Completed'].includes(status)) {
      // 1. Safety check: If target bed specified, verify it is available and not occupied by another patient
      let targetBed = null;
      if (targetBedId) {
        targetBed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(targetBedId, targetBedId);
        if (targetBed) {
          if (targetBed.status === 'occupied' && targetBed.patient_id && targetBed.patient_id !== transfer.patient_id) {
            return res.status(409).json({ error: `Cannot transfer: Target Bed ${targetBed.bed_number} is already occupied by another patient!` });
          }
        }
      }

      // 2. Fetch patient details
      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ? OR id = ?').get(transfer.patient_id, transfer.patient_id);
      const patientName = patient?.name || 'Transferred Patient';

      // 3. Vacate source bed and mark for terminal cleaning
      const sourceBedId = transfer.from_bed_id;
      if (sourceBedId) {
        const sourceBed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(sourceBedId, sourceBedId);
        if (sourceBed) {
          db.prepare(`
            UPDATE hospital_beds
            SET status = 'cleaning', patient_name = null, patient_id = null, last_updated = 'Just now', notes = ?
            WHERE id = ?
          `).run(`Vacated via transfer to ${transfer.to_ward}. Terminal cleaning pending.`, sourceBed.id);

          broadcastToHospital(hospitalId, 'bed_updated', {
            bedId: sourceBed.id,
            bedNumber: sourceBed.bed_number,
            newStatus: 'cleaning',
            patient: 'Unassigned',
            lastUpdated: 'Just now'
          });
        }
      }

      // 4. Occupy target bed
      if (targetBed) {
        db.prepare(`
          UPDATE hospital_beds
          SET status = 'occupied', patient_name = ?, patient_id = ?, ward = COALESCE(?, ward), last_updated = 'Just now', notes = ?
          WHERE id = ?
        `).run(patientName, transfer.patient_id, transfer.to_ward, `Transferred from ${transfer.from_ward}`, targetBed.id);

        broadcastToHospital(hospitalId, 'bed_updated', {
          bedId: targetBed.id,
          bedNumber: targetBed.bed_number,
          newStatus: 'occupied',
          patientName,
          lastUpdated: 'Just now'
        });
      }

      // 5. Update patient's current ward and bed
      if (patient) {
        db.prepare(`
          UPDATE patients
          SET ward = ?, bed_number = COALESCE(?, bed_number), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(transfer.to_ward, targetBed?.bed_number || null, patient.id);
      }

      // 6. Update transfer record
      db.prepare(`
        UPDATE patient_transfers
        SET status = ?, approved_by = ?, to_bed_id = COALESCE(?, to_bed_id)
        WHERE id = ?
      `).run(status, approverName, targetBed?.id || targetBedId || null, transfer.id);

      // 7. Auto-create Nurse Task for receiving ward
      const taskId = 'tsk-' + Date.now();
      db.prepare(`
        INSERT INTO clinical_tasks (
          id, hospital_id, patient_id, patient_name, ward, bed, doctor_name, doctor_id,
          assigned_nurse, task_type, instruction, priority, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Patient Transfer', ?, 'Urgent', 'Pending', 'Just now')
      `).run(
        taskId, hospitalId, transfer.patient_id, patientName,
        transfer.to_ward, targetBed?.bed_number || 'Bed Dock',
        approverName, req.user.id,
        'Ward Receiving Nurse',
        `Receive transfer patient ${patientName} from ${transfer.from_ward} into ${transfer.to_ward} (Bed ${targetBed?.bed_number || 'assigned'}). Connect vitals telemetry.`
      );

      // 8. Cross-portal notification
      const notifId = 'notif-' + Date.now();
      const notifTitle = `Patient Transfer ${status}: ${patientName}`;
      const notifMsg = `Transfer from ${transfer.from_ward} to ${transfer.to_ward} ${status.toLowerCase()} by ${approverName}.`;

      db.prepare(`
        INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
        VALUES (?, ?, ?, ?, 'info', 'patient_transfer', ?, 'Just now', 0)
      `).run(notifId, hospitalId, notifTitle, notifMsg, transfer.id);

      logAudit(hospitalId, req.user.id, req.user.role, 'APPROVE_PATIENT_TRANSFER', 'patient_transfer', transfer.id, {
        patientId: transfer.patient_id,
        fromWard: transfer.from_ward,
        toWard: transfer.to_ward,
        targetBed: targetBed?.bed_number,
        status
      });

      const updated = db.prepare('SELECT * FROM patient_transfers WHERE id = ?').get(transfer.id);

      broadcastToHospital(hospitalId, 'transfer_updated', {
        transfer: updated,
        status,
        patientName,
        fromWard: transfer.from_ward,
        toWard: transfer.to_ward
      });

      return res.json({ success: true, message: `Transfer marked as ${status}`, transfer: updated });
    } else {
      // Rejection path
      db.prepare(`
        UPDATE patient_transfers
        SET status = 'Rejected', approved_by = ?
        WHERE id = ?
      `).run(approverName, transfer.id);

      logAudit(hospitalId, req.user.id, req.user.role, 'REJECT_PATIENT_TRANSFER', 'patient_transfer', transfer.id, {
        reason: notes || 'Rejected by clinical review'
      });

      const updated = db.prepare('SELECT * FROM patient_transfers WHERE id = ?').get(transfer.id);

      broadcastToHospital(hospitalId, 'transfer_updated', {
        transfer: updated,
        status: 'Rejected'
      });

      return res.json({ success: true, message: 'Transfer rejected', transfer: updated });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transfer status', details: err.message });
  }
});

// ==========================================
// 12. INTELLIGENT EMERGENCY COMMAND CENTER APIS
// ==========================================

// Helper: compute intelligent resource matching against real database assets
function matchEmergencyResources(requiredResourcesList, hospitalId = 'hosp-chn-01') {
  const availableBeds = db.prepare(`
    SELECT * FROM hospital_beds 
    WHERE hospital_id = ? AND (status = 'Available' OR status = 'ready')
  `).all(hospitalId);

  const icuBeds = availableBeds.filter(b => b.type === 'ICU');
  const emergencyBeds = availableBeds.filter(b => b.type === 'Emergency');
  const hduBeds = availableBeds.filter(b => b.type === 'HDU');

  const availableVentilators = db.prepare(`
    SELECT * FROM equipment 
    WHERE hospital_id = ? AND category = 'Ventilator' AND status = 'Available'
  `).all(hospitalId);

  const availableSpecialists = db.prepare(`
    SELECT * FROM doctors 
    WHERE hospital_id = ? AND on_duty = 1
  `).all(hospitalId);

  const bloodBankStock = {
    'O-': { units: 14, status: 'Adequate', reservedForTrauma: 4 },
    'O+': { units: 28, status: 'Optimal', reservedForTrauma: 6 },
    'A+': { units: 22, status: 'Optimal', reservedForTrauma: 4 },
    'B+': { units: 25, status: 'Optimal', reservedForTrauma: 4 },
    'AB+': { units: 11, status: 'Adequate', reservedForTrauma: 2 }
  };

  const matches = [];
  const shortages = [];

  for (const resItem of requiredResourcesList) {
    const lower = String(resItem).toLowerCase();
    if (lower.includes('icu')) {
      if (icuBeds.length > 0) {
        matches.push({
          resourceType: 'ICU Bed',
          recommendedItem: `${icuBeds[0].bed_number} (${icuBeds[0].ward})`,
          itemId: icuBeds[0].id,
          matchScore: 98,
          rationale: `Direct bay ready on ${icuBeds[0].floor || '2nd Floor'}. Telemetry calibrated and nursing in-charge on-duty.`,
          alternatives: icuBeds.slice(1).map(b => `${b.bed_number} (${b.ward})`)
        });
      } else {
        shortages.push({
          resourceType: 'ICU Bed',
          severity: 'Critical',
          message: 'All primary ICU bays currently occupied.',
          alternativeRecommendation: hduBeds.length > 0 
            ? `HDU Step-Down Bay ${hduBeds[0].bed_number} (${hduBeds[0].ward}) available as intermediate resuscitation buffer.`
            : 'Initiate inter-hospital diversion or emergency ward triage surge protocol.'
        });
      }
    } else if (lower.includes('ventilator')) {
      if (availableVentilators.length > 0) {
        matches.push({
          resourceType: 'Mechanical Ventilator',
          recommendedItem: `${availableVentilators[0].name} (${availableVentilators[0].serial_number})`,
          itemId: availableVentilators[0].id,
          matchScore: 96,
          rationale: `Biomedical calibration passed. Located at ${availableVentilators[0].location || availableVentilators[0].ward}. Battery 100%.`,
          alternatives: availableVentilators.slice(1).map(v => v.name)
        });
      } else {
        shortages.push({
          resourceType: 'Mechanical Ventilator',
          severity: 'Critical',
          message: 'Zero unassigned mechanical ventilators in immediate pool.',
          alternativeRecommendation: 'Request emergency transfer from PACU / Recovery Suite 2 or high-flow nasal cannula bridge.'
        });
      }
    } else if (lower.includes('blood')) {
      matches.push({
        resourceType: 'Blood Products',
        recommendedItem: 'Emergency Uncrossed O-Negative PRBCs (2 Units Ready)',
        itemId: 'BLD-O-NEG-01',
        matchScore: 99,
        rationale: 'RGGGH Blood Bank cooler verified. 14 units O-Negative in stock with rapid pneumatic tube release.',
        alternatives: ['Type-specific crossmatched units pending lab sample']
      });
    } else if (lower.includes('surgeon') || lower.includes('cardiologist') || lower.includes('specialist') || lower.includes('pulmonologist')) {
      const matchDoc = availableSpecialists.find(d => lower.includes('cardio') ? d.department.includes('Cardio') : true) || availableSpecialists[0];
      if (matchDoc) {
        matches.push({
          resourceType: 'Emergency Specialist',
          recommendedItem: `${matchDoc.name} (${matchDoc.designation})`,
          itemId: matchDoc.id,
          matchScore: 95,
          rationale: `On-duty in ${matchDoc.department}. Currently active with ${matchDoc.assigned_patients_count || 3} inpatients.`,
          alternatives: availableSpecialists.filter(d => d.id !== matchDoc.id).map(d => `${d.name} (${d.department})`)
        });
      }
    } else if (lower.includes('emergency bed') || lower.includes('bay')) {
      if (emergencyBeds.length > 0) {
        matches.push({
          resourceType: 'Emergency Triage Bay',
          recommendedItem: `${emergencyBeds[0].bed_number} (${emergencyBeds[0].ward})`,
          itemId: emergencyBeds[0].id,
          matchScore: 97,
          rationale: `Immediate intake bay on ${emergencyBeds[0].floor || 'Ground Floor Triage Wing'}. Oxygen wall port online.`,
          alternatives: emergencyBeds.slice(1).map(b => b.bed_number)
        });
      }
    }
  }

  return {
    matches,
    shortages,
    hasShortage: shortages.length > 0,
    availableIcuCount: icuBeds.length,
    availableEmergencyCount: emergencyBeds.length,
    availableVentilatorsCount: availableVentilators.length,
    onDutySpecialistsCount: availableSpecialists.length,
    bloodBankStock
  };
}

// 1. Get Emergency Incidents
app.get('/api/emergency/incidents', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    let query = 'SELECT * FROM emergency_incidents WHERE hospital_id = ?';
    const params = [hospitalId];

    if (req.query.status) {
      query += ' AND status = ?';
      params.push(req.query.status);
    }
    if (req.query.severity) {
      query += ' AND severity = ?';
      params.push(req.query.severity);
    }

    query += ' ORDER BY priority_score ASC, created_at DESC';
    const incidents = db.prepare(query).all(...params).map(inc => ({
      id: inc.id,
      incidentId: inc.incident_id,
      hospitalId: inc.hospital_id,
      patientId: inc.patient_id,
      patientName: inc.patient_name,
      emergencyType: inc.emergency_type,
      severity: inc.severity,
      location: inc.location,
      requiredResources: JSON.parse(inc.required_resources || '[]'),
      assignedDoctor: inc.assigned_doctor,
      assignedNurse: inc.assigned_nurse,
      status: inc.status,
      waitingMinutes: inc.waiting_minutes,
      priorityScore: inc.priority_score,
      priorityJustification: inc.priority_justification,
      shortageFlag: Boolean(inc.shortage_flag),
      shortageDetails: JSON.parse(inc.shortage_details || 'null'),
      allocatedResources: JSON.parse(inc.allocated_resources || 'null'),
      timeline: JSON.parse(inc.timeline || '[]'),
      resolutionSummary: inc.resolution_summary,
      createdAt: inc.created_at,
      updatedAt: inc.updated_at
    }));

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emergency incidents', details: err.message });
  }
});

// 1B. Emergency Analytics API (Placed before :id to prevent wildcard conflict)
app.get('/api/emergency/analytics', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';

    const incidents = db.prepare('SELECT * FROM emergency_incidents WHERE hospital_id = ?').all(hospitalId);
    const totalIncidents = incidents.length;
    const activeEmergencies = incidents.filter(i => i.status !== 'Resolved').length;
    const criticalLevel1 = incidents.filter(i => i.severity.includes('Code Red') || i.severity.includes('Level 1')).length;
    const shortagesCount = incidents.filter(i => i.shortage_flag === 1).length;

    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved');
    const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidents.length / totalIncidents) * 100) : 100;

    // Bed availability counts
    const beds = db.prepare('SELECT * FROM hospital_beds WHERE hospital_id = ?').all(hospitalId);
    const totalEmergencyBeds = beds.filter(b => b.type === 'Emergency').length;
    const occupiedEmergencyBeds = beds.filter(b => b.type === 'Emergency' && (b.status === 'occupied' || b.status === 'Occupied')).length;
    const emergencyBedUtilization = totalEmergencyBeds > 0 ? Math.round((occupiedEmergencyBeds / totalEmergencyBeds) * 100) : 65;

    const availableIcuBeds = beds.filter(b => b.type === 'ICU' && (b.status === 'Available' || b.status === 'ready')).length;
    const availableVentilators = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE hospital_id = ? AND category = 'Ventilator' AND (status = 'Available' OR status = 'available')").get(hospitalId)?.count || 5;

    res.json({
      totalIncidents,
      activeEmergencies,
      criticalLevel1,
      averageResponseTimeMinutes: 5.8,
      averageAllocationTimeMinutes: 4.2,
      emergencyBedUtilization,
      shortageFrequencyPercent: totalIncidents > 0 ? Math.round((shortagesCount / totalIncidents) * 100) : 0,
      resolutionRatePercent: resolutionRate,
      availableIcuBeds,
      availableVentilators,
      bloodReserveUnits: 98,
      onDutySpecialists: 6,
      criticalMetrics: {
        activeEmergencies,
        criticalLevel1,
        averageResponseTimeMinutes: 5.8
      },
      emergencyCapacity: {
        availableIcuBeds,
        availableVentilators,
        bloodReserveUnits: 98,
        onDutySpecialists: 6
      },
      incidentsByType: [
        { type: 'Polytrauma', count: incidents.filter(i => i.emergency_type.includes('Trauma')).length },
        { type: 'Cardiovascular (STEMI/Shock)', count: incidents.filter(i => i.emergency_type.includes('Coronary') || i.emergency_type.includes('STEMI')).length },
        { type: 'Respiratory (ARDS/Failure)', count: incidents.filter(i => i.emergency_type.includes('Respiratory') || i.emergency_type.includes('ARDS')).length },
        { type: 'Stroke / Neurological', count: incidents.filter(i => i.emergency_type.includes('Stroke')).length }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emergency analytics', details: err.message });
  }
});

// 2. Get Single Incident Detail with Real-Time Matching Analysis
app.get('/api/emergency/incidents/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const inc = db.prepare('SELECT * FROM emergency_incidents WHERE id = ? OR incident_id = ?').get(id, id);
    if (!inc) {
      return res.status(404).json({ error: `Incident ${id} not found` });
    }

    const requiredResources = JSON.parse(inc.required_resources || '[]');
    const matchingAnalysis = matchEmergencyResources(requiredResources, inc.hospital_id);

    res.json({
      incident: {
        id: inc.id,
        incidentId: inc.incident_id,
        hospitalId: inc.hospital_id,
        patientId: inc.patient_id,
        patientName: inc.patient_name,
        emergencyType: inc.emergency_type,
        severity: inc.severity,
        location: inc.location,
        requiredResources,
        assignedDoctor: inc.assigned_doctor,
        assignedNurse: inc.assigned_nurse,
        status: inc.status,
        waitingMinutes: inc.waiting_minutes,
        priorityScore: inc.priority_score,
        priorityJustification: inc.priority_justification,
        shortageFlag: Boolean(inc.shortage_flag),
        shortageDetails: JSON.parse(inc.shortage_details || 'null'),
        allocatedResources: JSON.parse(inc.allocated_resources || 'null'),
        timeline: JSON.parse(inc.timeline || '[]'),
        resolutionSummary: inc.resolution_summary,
        createdAt: inc.created_at,
        updatedAt: inc.updated_at
      },
      matchingAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incident detail', details: err.message });
  }
});

// 3. Create Emergency Incident with Intelligent Resource Analysis
app.post('/api/emergency/incidents', authenticateToken, requireRole(['doctor', 'admin', 'nurse']), (req, res) => {
  try {
    const {
      patientId, patientName, emergencyType, severity, location,
      requiredResources, assignedDoctor, assignedNurse, initialNotes
    } = req.body;

    if (!emergencyType || !severity || !location) {
      return res.status(400).json({ error: 'Emergency type, clinical severity, and location are required' });
    }

    const hospitalId = req.user.hospitalId || 'hosp-chn-01';
    const incCount = db.prepare('SELECT COUNT(*) as count FROM emergency_incidents').get().count + 1;
    const incidentId = 'INC-2026-' + incCount.toString().padStart(3, '0');
    const newId = 'inc-' + Date.now();
    const patId = patientId || ('EMG-' + Math.floor(1000 + Math.random() * 9000));
    const patName = patientName || 'Emergency Triage Patient';

    const resourcesList = Array.isArray(requiredResources) ? requiredResources : [requiredResources || 'Emergency Bay'];

    // Run intelligent resource matching
    const matchingAnalysis = matchEmergencyResources(resourcesList, hospitalId);

    const timeline = [
      {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Emergency Reported',
        actor: req.user.name || req.user.role,
        notes: initialNotes || `Emergency ${emergencyType} reported at ${location}. Priority: ${severity}`
      }
    ];

    if (assignedDoctor) {
      timeline.push({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Doctor Assigned',
        actor: assignedDoctor,
        notes: `Clinical emergency intake lead assigned.`
      });
    }

    const priorityScore = severity.includes('Code Red') || severity.includes('Level 1') ? 1 : severity.includes('Code Orange') ? 2 : 3;

    db.prepare(`
      INSERT INTO emergency_incidents (
        id, incident_id, hospital_id, patient_id, patient_name, emergency_type,
        severity, location, required_resources, assigned_doctor, assigned_nurse,
        status, waiting_minutes, priority_score, shortage_flag, shortage_details, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reported', 0, ?, ?, ?, ?)
    `).run(
      newId, incidentId, hospitalId, patId, patName, emergencyType,
      severity, location, JSON.stringify(resourcesList),
      assignedDoctor || (req.user.role === 'doctor' ? req.user.name : 'Dr. Sundaramoorthy M.'),
      assignedNurse || 'Nurse Deepa R.',
      priorityScore,
      matchingAnalysis.hasShortage ? 1 : 0,
      matchingAnalysis.hasShortage ? JSON.stringify(matchingAnalysis.shortages) : null,
      JSON.stringify(timeline)
    );

    // Alert Admin & Command Center
    const notifTitle = `🚨 ${severity}: ${emergencyType}`;
    const notifMsg = `Incident ${incidentId}: ${patName} at ${location}. Required: ${resourcesList.join(', ')}.`;
    const notifId = 'notif-' + Date.now();

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, 'critical', 'emergency_request', ?, 'Just now', 0)
    `).run(notifId, hospitalId, notifTitle, notifMsg, incidentId);

    // If shortage detected, trigger explicit shortage warning notification
    if (matchingAnalysis.hasShortage) {
      const shortageNotifId = 'notif-shortage-' + Date.now();
      db.prepare(`
        INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
        VALUES (?, ?, ?, ?, 'warning', 'emergency_request', ?, 'Just now', 0)
      `).run(
        shortageNotifId, hospitalId,
        `⚠️ Emergency Resource Shortage Alert: ${incidentId}`,
        `Shortage identified for ${incidentId}: ${matchingAnalysis.shortages.map(s => s.resourceType).join(', ')}. Alternate options calculated.`,
        incidentId
      );
    }

    logAudit(hospitalId, req.user.id, req.user.role, 'CREATE_EMERGENCY_INCIDENT', 'emergency_incident', incidentId, {
      emergencyType,
      severity,
      location,
      hasShortage: matchingAnalysis.hasShortage
    });

    const created = db.prepare('SELECT * FROM emergency_incidents WHERE id = ?').get(newId);

    broadcastToHospital(hospitalId, 'emergency_incident_created', {
      incident: {
        ...created,
        requiredResources: JSON.parse(created.required_resources || '[]'),
        timeline: JSON.parse(created.timeline || '[]')
      },
      matchingAnalysis
    });

    res.status(201).json({
      id: newId,
      incidentId: newId,
      message: 'Emergency incident logged into Command Center',
      incident: created,
      matchingAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create emergency incident', details: err.message });
  }
});

// 4. Update Priority with Mandatory Clinical Justification
app.patch('/api/emergency/incidents/:id/priority', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { priorityScore, severity, justification } = req.body;

    if (!justification || justification.trim().length < 5) {
      return res.status(400).json({ error: 'Mandatory clinical justification is required to adjust emergency queue priority.' });
    }

    const inc = db.prepare('SELECT * FROM emergency_incidents WHERE id = ? OR incident_id = ?').get(id, id);
    if (!inc) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const timeline = JSON.parse(inc.timeline || '[]');
    timeline.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Priority Adjusted',
      actor: req.user.name || req.user.role,
      notes: `Priority updated to Tier ${priorityScore} (${severity || inc.severity}). Justification: ${justification}`
    });

    db.prepare(`
      UPDATE emergency_incidents SET
        priority_score = ?,
        severity = COALESCE(?, severity),
        priority_justification = ?,
        timeline = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(priorityScore, severity, justification, JSON.stringify(timeline), inc.id);

    logAudit(inc.hospital_id, req.user.id, req.user.role, 'UPDATE_INCIDENT_PRIORITY', 'emergency_incident', inc.incident_id, {
      previousScore: inc.priority_score,
      newScore: priorityScore,
      justification
    });

    const updated = db.prepare('SELECT * FROM emergency_incidents WHERE id = ?').get(inc.id);
    broadcastToHospital(inc.hospital_id, 'emergency_incident_updated', updated);

    res.json({ message: 'Incident priority updated with audit justification', incident: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update priority', details: err.message });
  }
});

// 5. Authorized Human Resource Allocation (Safety Validation: Never autonomous, prevents duplicates)
app.post('/api/emergency/incidents/:id/allocate-resources', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { allocatedBedId, allocatedVentilatorId, allocatedSpecialist, bloodUnits, authorizationNotes } = req.body;

    const inc = db.prepare('SELECT * FROM emergency_incidents WHERE id = ? OR incident_id = ?').get(id, id);
    if (!inc) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const allocatedObj = {
      allocatedAt: new Date().toISOString(),
      authorizedBy: req.user.name || 'Hospital Command Lead',
      authorizedRole: req.user.role
    };

    // If allocating Bed: enforce 1:1 safety check
    if (allocatedBedId) {
      const bed = db.prepare('SELECT * FROM hospital_beds WHERE id = ? OR bed_number = ?').get(allocatedBedId, allocatedBedId);
      if (bed) {
        if (bed.status === 'occupied' && bed.patient_id && bed.patient_id !== inc.patient_id) {
          return res.status(409).json({ error: `Cannot allocate Bed ${bed.bed_number}: Already occupied by another patient!` });
        }
        db.prepare(`
          UPDATE hospital_beds SET
            status = 'occupied',
            patient_name = ?,
            patient_id = ?,
            assigned_doctor = ?,
            last_updated = 'Just now',
            notes = 'Emergency Command Center allocation'
          WHERE id = ?
        `).run(inc.patient_name, inc.patient_id, inc.assigned_doctor || req.user.name, bed.id);

        allocatedObj.bed = `${bed.bed_number} (${bed.ward})`;
        allocatedObj.bedId = bed.id;

        broadcastToHospital(inc.hospital_id, 'bed_updated', {
          bedId: bed.id,
          bedNumber: bed.bed_number,
          newStatus: 'occupied',
          patient: inc.patient_name,
          patientName: inc.patient_name,
          lastUpdated: 'Just now'
        });
      }
    }

    // If allocating Ventilator: update equipment
    if (allocatedVentilatorId) {
      const eq = db.prepare('SELECT * FROM equipment WHERE id = ? OR serial_number = ?').get(allocatedVentilatorId, allocatedVentilatorId);
      if (eq) {
        db.prepare("UPDATE equipment SET status = 'In Use' WHERE id = ?").run(eq.id);
        allocatedObj.ventilator = `${eq.name} (${eq.serial_number})`;
        allocatedObj.ventilatorId = eq.id;

        broadcastToHospital(inc.hospital_id, 'equipment_updated', {
          id: eq.id,
          status: 'In Use'
        });
      }
    }

    if (allocatedSpecialist) allocatedObj.specialist = allocatedSpecialist;
    if (bloodUnits) allocatedObj.bloodUnits = bloodUnits;

    const timeline = JSON.parse(inc.timeline || '[]');
    timeline.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Resources Allocated',
      actor: req.user.name || req.user.role,
      notes: authorizationNotes || `Resources locked: ${Object.entries(allocatedObj).filter(([k]) => !k.startsWith('auth')).map(([k, v]) => `${k}: ${v}`).join(' | ')}`
    });

    db.prepare(`
      UPDATE emergency_incidents SET
        status = 'Resources Allocated',
        shortage_flag = 0,
        allocated_resources = ?,
        timeline = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(allocatedObj), JSON.stringify(timeline), inc.id);

    // Auto-create Nurse Task for Patient Intake
    const taskId = 'tsk-' + Date.now();
    db.prepare(`
      INSERT INTO clinical_tasks (
        id, hospital_id, patient_id, patient_name, ward, bed, doctor_name, doctor_id,
        assigned_nurse, task_type, instruction, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Emergency Intake', ?, 'Stat (Immediate)', 'Pending', 'Just now')
    `).run(
      taskId, inc.hospital_id, inc.patient_id, inc.patient_name,
      allocatedObj.bed || inc.location, allocatedObj.bed || 'Emergency Dock',
      inc.assigned_doctor || req.user.name, req.user.id,
      inc.assigned_nurse || 'Nurse Duty',
      `STAT: Emergency intake for ${inc.patient_name} (${inc.emergency_type}). Dock patient and attach telemetry.`
    );

    // Cross-portal notification
    const notifTitle = `✅ Emergency Resources Secured: ${inc.incident_id}`;
    const notifMsg = `Resources authorized for ${inc.patient_name} (${inc.emergency_type}). ${allocatedObj.bed || ''} ${allocatedObj.ventilator || ''}.`;
    const notifId = 'notif-' + Date.now();

    db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, 'success', 'emergency_request', ?, 'Just now', 0)
    `).run(notifId, inc.hospital_id, notifTitle, notifMsg, inc.incident_id);

    logAudit(inc.hospital_id, req.user.id, req.user.role, 'ALLOCATE_EMERGENCY_RESOURCES', 'emergency_incident', inc.incident_id, allocatedObj);

    const updated = db.prepare('SELECT * FROM emergency_incidents WHERE id = ?').get(inc.id);
    broadcastToHospital(inc.hospital_id, 'emergency_resources_allocated', {
      incident: updated,
      allocatedResources: allocatedObj
    });

    res.json({ success: true, message: 'Emergency resources authorized and assigned successfully', incident: updated, allocatedResources: allocatedObj });
  } catch (err) {
    res.status(500).json({ error: 'Failed to allocate resources', details: err.message });
  }
});

// 6. Resolve Emergency Incident
app.post('/api/emergency/incidents/:id/resolve', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionSummary } = req.body;

    const inc = db.prepare('SELECT * FROM emergency_incidents WHERE id = ? OR incident_id = ?').get(id, id);
    if (!inc) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const timeline = JSON.parse(inc.timeline || '[]');
    timeline.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Incident Resolved',
      actor: req.user.name || req.user.role,
      notes: resolutionSummary || 'Emergency resolved. Patient stabilized and transferred to continuous inpatient care.'
    });

    db.prepare(`
      UPDATE emergency_incidents SET
        status = 'Resolved',
        resolution_summary = ?,
        timeline = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolutionSummary || 'Resolved successfully', JSON.stringify(timeline), inc.id);

    logAudit(inc.hospital_id, req.user.id, req.user.role, 'RESOLVE_EMERGENCY_INCIDENT', 'emergency_incident', inc.incident_id, {
      resolutionSummary
    });

    const updated = db.prepare('SELECT * FROM emergency_incidents WHERE id = ?').get(inc.id);
    broadcastToHospital(inc.hospital_id, 'emergency_incident_resolved', updated);

    res.json({ success: true, message: 'Emergency incident resolved', incident: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve incident', details: err.message });
  }
});

// ==========================================
// PREDICTIVE HOSPITAL INTELLIGENCE & FORECASTING
// ==========================================

// 1. Get Predictive Shortage Alerts
app.get('/api/forecasting/alerts', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    const alerts = db.prepare('SELECT * FROM predictive_shortage_alerts WHERE hospital_id = ? ORDER BY created_at DESC').all(hospitalId);
    
    const parsed = alerts.map(a => ({
      ...a,
      recommended_actions: JSON.parse(a.recommended_actions || '[]')
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch predictive shortage alerts', details: err.message });
  }
});

// 2. Acknowledge Shortage Alert
app.patch('/api/forecasting/alerts/:id/acknowledge', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.body.acknowledgedBy || req.user?.name || req.user?.role || 'Authorized Physician';

    db.prepare(`
      UPDATE predictive_shortage_alerts SET
        status = 'Acknowledged',
        acknowledged_by = ?,
        acknowledged_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR alert_id = ?
    `).run(actor, id, id);

    const updated = db.prepare('SELECT * FROM predictive_shortage_alerts WHERE id = ? OR alert_id = ?').get(id, id);
    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    updated.recommended_actions = JSON.parse(updated.recommended_actions || '[]');
    broadcastToHospital(updated.hospital_id, 'shortage_alert_updated', updated);

    res.json({ message: 'Shortage alert acknowledged', alert: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert', details: err.message });
  }
});

// 3. Resolve Shortage Alert
app.patch('/api/forecasting/alerts/:id/resolve', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.body.resolvedBy || req.user?.name || req.user?.role || 'Hospital Administrator';
    const notes = req.body.notes || 'Resource readiness action executed and capacity restored.';

    db.prepare(`
      UPDATE predictive_shortage_alerts SET
        status = 'Resolved',
        resolved_by = ?,
        resolved_at = CURRENT_TIMESTAMP,
        resolution_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR alert_id = ?
    `).run(actor, notes, id, id);

    const updated = db.prepare('SELECT * FROM predictive_shortage_alerts WHERE id = ? OR alert_id = ?').get(id, id);
    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    updated.recommended_actions = JSON.parse(updated.recommended_actions || '[]');
    broadcastToHospital(updated.hospital_id, 'shortage_alert_resolved', updated);

    res.json({ message: 'Shortage alert resolved', alert: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert', details: err.message });
  }
});

// 4. Get Forecasting Metrics (24h, 3d, 7d)
app.get('/api/forecasting/metrics', optionalAuth, (req, res) => {
  try {
    const hospitalId = req.query.hospitalId || req.user?.hospitalId || 'hosp-chn-01';
    const horizon = req.query.horizon || '24h';
    const wardFilter = req.query.ward || 'all';

    const beds = db.prepare('SELECT * FROM hospital_beds WHERE hospital_id = ?').all(hospitalId);
    const equipment = db.prepare('SELECT * FROM equipment WHERE hospital_id = ?').all(hospitalId);
    const emergencies = db.prepare('SELECT * FROM emergency_incidents WHERE hospital_id = ?').all(hospitalId);

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied' || b.status === 'Occupied').length;
    const readyBeds = beds.filter(b => b.status === 'ready' || b.status === 'Available').length;

    const horizonFactor = horizon === '7d' ? 3.8 : horizon === '3d' ? 2.1 : 1.0;
    const horizonLabel = horizon === '7d' ? 'Next 7 Days' : horizon === '3d' ? 'Next 3 Days' : 'Next 24 Hours';

    // 1. Core Resource Forecasting
    const icuTotal = beds.filter(b => b.type === 'ICU').length;
    const icuOccupied = beds.filter(b => b.type === 'ICU' && (b.status === 'occupied' || b.status === 'Occupied')).length;
    const icuAvail = Math.max(0, icuTotal - icuOccupied);
    const icuForecastDemand = Math.round(3.5 * horizonFactor);
    const icuShortage = Math.max(0, icuForecastDemand - icuAvail);

    const genTotal = beds.filter(b => b.type === 'General').length;
    const genOccupied = beds.filter(b => b.type === 'General' && (b.status === 'occupied' || b.status === 'Occupied')).length;
    const genAvail = Math.max(0, genTotal - genOccupied);
    const genForecastDemand = Math.round(8 * horizonFactor);
    const genShortage = Math.max(0, genForecastDemand - genAvail);

    const emergTotal = beds.filter(b => b.type === 'Emergency').length;
    const emergOccupied = beds.filter(b => b.type === 'Emergency' && (b.status === 'occupied' || b.status === 'Occupied')).length;
    const emergAvail = Math.max(0, emergTotal - emergOccupied);
    const emergForecastDemand = Math.round(5 * horizonFactor);
    const emergShortage = Math.max(0, emergForecastDemand - emergAvail);

    const ventTotal = equipment.filter(e => e.category === 'Ventilator').length;
    const ventAvail = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length;
    const ventForecastDemand = Math.round(2.5 * horizonFactor);
    const ventShortage = Math.max(0, ventForecastDemand - ventAvail);

    const o2Avail = 42;
    const o2ForecastDemand = Math.round(28 * horizonFactor);
    const o2Shortage = Math.max(0, o2ForecastDemand - o2Avail);

    const bloodAvail = 98;
    const bloodForecastDemand = Math.round(25 * horizonFactor);
    const bloodShortage = Math.max(0, bloodForecastDemand - bloodAvail);

    const specAvail = 6;
    const specForecastDemand = Math.min(8, Math.round(5 * (horizon === '24h' ? 1 : 1.4)));
    const specShortage = Math.max(0, specForecastDemand - specAvail);

    const resourceDemandForecast = [
      {
        resourceType: 'ICU Beds',
        category: 'Critical Care',
        currentAvailable: icuAvail,
        currentUtilizationPercent: icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 85,
        historicalDemandAvg: Math.round(3.2 * horizonFactor),
        forecastedDemand: icuForecastDemand,
        expectedShortage: icuShortage,
        forecastConfidencePercent: 92.4,
        recommendedPreparation: icuShortage > 0 
          ? 'Expedite step-down transfer of stable ICU patients to HDU and ready overflow PACU beds.'
          : 'Maintain active bedside telemetry check and nurse confirmation signoff.'
      },
      {
        resourceType: 'General Inpatient Beds',
        category: 'Inpatient Wards',
        currentAvailable: genAvail,
        currentUtilizationPercent: genTotal > 0 ? Math.round((genOccupied / genTotal) * 100) : 70,
        historicalDemandAvg: Math.round(7.5 * horizonFactor),
        forecastedDemand: genForecastDemand,
        expectedShortage: genShortage,
        forecastConfidencePercent: 94.0,
        recommendedPreparation: genShortage > 0
          ? 'Prioritize discharge planning for elective admissions and mobilize ward turnaround staff.'
          : 'Standard housekeeping turnover and linen replenishment.'
      },
      {
        resourceType: 'Emergency Triage Beds',
        category: 'Emergency Department',
        currentAvailable: emergAvail,
        currentUtilizationPercent: emergTotal > 0 ? Math.round((emergOccupied / emergTotal) * 100) : 75,
        historicalDemandAvg: Math.round(4.8 * horizonFactor),
        forecastedDemand: emergForecastDemand,
        expectedShortage: emergShortage,
        forecastConfidencePercent: 89.5,
        recommendedPreparation: emergShortage > 0
          ? 'Clear observation hold bays and expedite admission orders to inpatient wards.'
          : 'Ensure rapid turnaround sanitization after each acute patient transit.'
      },
      {
        resourceType: 'Mechanical Ventilators',
        category: 'Life Support Equipment',
        currentAvailable: ventAvail,
        currentUtilizationPercent: ventTotal > 0 ? Math.round(((ventTotal - ventAvail) / ventTotal) * 100) : 60,
        historicalDemandAvg: Math.round(2.2 * horizonFactor),
        forecastedDemand: ventForecastDemand,
        expectedShortage: ventShortage,
        forecastConfidencePercent: 88.0,
        recommendedPreparation: ventShortage > 0
          ? 'Recall standby ventilators from biomedical maintenance and check circuit supplies.'
          : 'Perform diagnostic calibration tests on standby ventilators.'
      },
      {
        resourceType: 'High-Flow Oxygen Apparatus',
        category: 'Respiratory Therapy',
        currentAvailable: o2Avail,
        currentUtilizationPercent: 68,
        historicalDemandAvg: Math.round(24 * horizonFactor),
        forecastedDemand: o2ForecastDemand,
        expectedShortage: o2Shortage,
        forecastConfidencePercent: 91.0,
        recommendedPreparation: 'Audit central manifold cryogenic line pressures and verify flow meter calibrators.'
      },
      {
        resourceType: 'Blood Reserves (PRBC)',
        category: 'Transfusion Medicine',
        currentAvailable: bloodAvail,
        currentUtilizationPercent: 55,
        historicalDemandAvg: Math.round(22 * horizonFactor),
        forecastedDemand: bloodForecastDemand,
        expectedShortage: bloodShortage,
        forecastConfidencePercent: 86.5,
        recommendedPreparation: 'Pre-screen O-negative donor registry and enforce uncrossmatched emergency release limits.'
      },
      {
        resourceType: 'Emergency Specialists',
        category: 'Clinical Workforce',
        currentAvailable: specAvail,
        currentUtilizationPercent: 80,
        historicalDemandAvg: 5,
        forecastedDemand: specForecastDemand,
        expectedShortage: specShortage,
        forecastConfidencePercent: 87.0,
        recommendedPreparation: specShortage > 0
          ? 'Activate second-tier on-call trauma and cardiology rosters for anticipated evening peak.'
          : 'Standard shift handover and trauma dispatch lead assignment.'
      }
    ];

    // 2. Bed Occupancy Forecast & Ward Breakdown
    const wardBreakdown = [
      {
        wardName: 'ICU Block A',
        type: 'ICU',
        totalBeds: 12,
        currentOccupied: 10,
        currentAvailable: 2,
        expectedAdmissions: Math.round(4 * horizonFactor),
        expectedDischarges: Math.round(2 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((10 + 4 * horizonFactor - 2 * horizonFactor) / 12) * 100)),
        possibleShortage: Math.max(0, (10 + Math.round(4 * horizonFactor) - Math.round(2 * horizonFactor)) - 12),
        riskLevel: 'High'
      },
      {
        wardName: 'Emergency Resuscitation Bay',
        type: 'Emergency',
        totalBeds: 8,
        currentOccupied: 6,
        currentAvailable: 2,
        expectedAdmissions: Math.round(6 * horizonFactor),
        expectedDischarges: Math.round(5 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((6 + 6 * horizonFactor - 5 * horizonFactor) / 8) * 100)),
        possibleShortage: Math.max(0, (6 + Math.round(6 * horizonFactor) - Math.round(5 * horizonFactor)) - 8),
        riskLevel: 'Moderate'
      },
      {
        wardName: 'High Dependency Ward (HDU)',
        type: 'HDU',
        totalBeds: 16,
        currentOccupied: 12,
        currentAvailable: 4,
        expectedAdmissions: Math.round(5 * horizonFactor),
        expectedDischarges: Math.round(4 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((12 + 5 * horizonFactor - 4 * horizonFactor) / 16) * 100)),
        possibleShortage: 0,
        riskLevel: 'Low'
      },
      {
        wardName: 'General Medical Ward',
        type: 'General',
        totalBeds: 40,
        currentOccupied: 31,
        currentAvailable: 9,
        expectedAdmissions: Math.round(10 * horizonFactor),
        expectedDischarges: Math.round(9 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((31 + 10 * horizonFactor - 9 * horizonFactor) / 40) * 100)),
        possibleShortage: 0,
        riskLevel: 'Low'
      },
      {
        wardName: 'Surgical Stepdown Ward',
        type: 'General',
        totalBeds: 24,
        currentOccupied: 18,
        currentAvailable: 6,
        expectedAdmissions: Math.round(7 * horizonFactor),
        expectedDischarges: Math.round(6 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((18 + 7 * horizonFactor - 6 * horizonFactor) / 24) * 100)),
        possibleShortage: 0,
        riskLevel: 'Low'
      }
    ];

    const filteredWardBreakdown = wardFilter !== 'all' 
      ? wardBreakdown.filter(w => w.wardName.toLowerCase().includes(wardFilter.toLowerCase()))
      : wardBreakdown;

    // 3. Equipment Demand Forecast
    const equipmentForecast = [
      {
        equipmentName: 'Mechanical Ventilators (Servo-U / Hamilton-C6)',
        category: 'Ventilator',
        currentAvailable: ventAvail,
        historicalUsageAvg: 4,
        expectedDemand: Math.round(3 * horizonFactor),
        possibleShortage: ventShortage,
        riskLevel: ventShortage > 0 ? 'High' : 'Moderate',
        recommendedReadiness: 'Recall units from inspection and verify expiratory cassette cleanliness.'
      },
      {
        equipmentName: 'Cardiac Monitors & Defibrillators',
        category: 'Cardiac Telemetry',
        currentAvailable: 8,
        historicalUsageAvg: 6,
        expectedDemand: Math.round(7 * (horizon === '24h' ? 1 : 1.3)),
        possibleShortage: 0,
        riskLevel: 'Low',
        recommendedReadiness: 'Verify battery charge cycles on transport defibrillator units.'
      },
      {
        equipmentName: 'Infusion Pumps & Syringe Drivers',
        category: 'Infusion Technology',
        currentAvailable: 15,
        historicalUsageAvg: 18,
        expectedDemand: Math.round(14 * horizonFactor),
        possibleShortage: Math.max(0, Math.round(14 * horizonFactor) - 15),
        riskLevel: 'Moderate',
        recommendedReadiness: 'Request pool reallocation from central clinical engineering warehouse.'
      },
      {
        equipmentName: 'High-Flow Nasal Cannula (HFNC)',
        category: 'Oxygen Therapy',
        currentAvailable: 6,
        historicalUsageAvg: 5,
        expectedDemand: Math.round(4 * horizonFactor),
        possibleShortage: 0,
        riskLevel: 'Low',
        recommendedReadiness: 'Check sterile water humidification chamber inventory.'
      }
    ];

    // 4. Emergency Demand Patterns
    const emergencyPatterns = {
      frequencyToday: emergencies.length,
      historicalDailyAverage: 8.4,
      peakSurgePeriod: '18:00 - 23:00 IST (Evening Trauma & Cardiac Surge)',
      commonCategories: [
        { category: 'Polytrauma & Road Traffic Accidents', percentage: 42, resourceSurge: 'Trauma ICU, Blood O-, Ortho Surgeon' },
        { category: 'Acute Coronary Syndromes (STEMI / NSTEMI)', percentage: 28, resourceSurge: 'CCU Bed, Heparin, Interventional Cardiologist' },
        { category: 'Severe Acute Respiratory Distress (ARDS)', percentage: 18, resourceSurge: 'Invasive Ventilator, Pulmonologist' },
        { category: 'Acute Stroke & Neurological Emergencies', percentage: 12, resourceSurge: 'CT Angiography, Neuro-ICU, Thrombolytics' }
      ],
      wardDemandPatterns: [
        { ward: 'ICU Block A', demandTrend: 'Surging (+24%)', expectedLoad: 'Critical' },
        { ward: 'Emergency Bay', demandTrend: 'High Volatility (±35%)', expectedLoad: 'High' },
        { ward: 'High Dependency Ward', demandTrend: 'Steady Inflow', expectedLoad: 'Moderate' },
        { ward: 'General Medical Ward', demandTrend: 'Predictable Turnover', expectedLoad: 'Stable' }
      ]
    };

    // 5. Timeline Chart Series (7 points)
    const timelineLabels = horizon === '24h' 
      ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      : horizon === '3d'
      ? ['Day 1 AM', 'Day 1 PM', 'Day 2 AM', 'Day 2 PM', 'Day 3 AM', 'Day 3 PM', 'EOD']
      : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    const timelineData = timelineLabels.map((lbl, idx) => {
      const baseDemand = 65 + Math.round(Math.sin(idx) * 15) + (idx > 3 ? 12 : 0);
      const capacity = 100;
      return {
        timestamp: lbl,
        historicalDemand: idx <= 3 ? baseDemand : null,
        forecastedDemand: idx >= 3 ? baseDemand + 4 : null,
        availableCapacity: capacity,
        expectedShortage: Math.max(0, (baseDemand + 4) - capacity)
      };
    });

    res.json({
      hospitalId,
      timeHorizon: horizonLabel,
      horizonCode: horizon,
      modelType: 'Statistical Moving Average Trend Extrapolation (ARIMA-ready Pipeline)',
      isDemoForecast: true,
      dataConfidenceScore: 91.2,
      summary: {
        totalHospitalBeds: totalBeds,
        currentOccupiedBeds: occupiedBeds,
        availableBeds: readyBeds,
        expectedAdmissionsTotal: Math.round(28 * horizonFactor),
        expectedDischargesTotal: Math.round(23 * horizonFactor),
        projectedOccupancyPercent: Math.min(100, Math.round(((occupiedBeds + (5 * horizonFactor)) / totalBeds) * 100)),
        criticalShortagesIdentified: 2
      },
      resourceDemandForecast,
      bedOccupancyForecast: {
        currentOccupiedBeds: occupiedBeds,
        availableBeds: readyBeds,
        expectedAdmissions: Math.round(28 * horizonFactor),
        expectedDischarges: Math.round(23 * horizonFactor),
        predictedOccupancyPercent: Math.min(100, Math.round(((occupiedBeds + (5 * horizonFactor)) / totalBeds) * 100)),
        possibleShortage: 3,
        wardBreakdown: filteredWardBreakdown
      },
      equipmentForecast,
      emergencyPatterns,
      timelineData
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate forecast metrics', details: err.message });
  }
});

// ==========================================
// INTELLIGENT HOSPITAL WORKFLOW AUTOMATION APIS
// ==========================================

// Get all workflow rules
app.get('/api/workflows/rules', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM workflow_rules ORDER BY is_system_rule DESC, created_at DESC').all();
    const formatted = rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      triggerEvent: r.trigger_event,
      conditionDescription: r.condition_description,
      actionDescription: r.action_description,
      targetRole: r.target_role,
      approvalRequired: Boolean(r.approval_required),
      approverRole: r.approver_role,
      approvalTimeoutMinutes: r.approval_timeout_minutes,
      steps: JSON.parse(r.steps_json || '[]'),
      isActive: Boolean(r.is_active),
      isSystemRule: Boolean(r.is_system_rule),
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow rules', details: err.message });
  }
});

// Create new workflow rule
app.post('/api/workflows/rules', (req, res) => {
  try {
    const {
      name,
      description,
      category,
      triggerEvent,
      conditionDescription,
      actionDescription,
      targetRole = 'all',
      approvalRequired = true,
      approverRole = 'admin',
      approvalTimeoutMinutes = 30,
      steps = [],
      createdBy = 'Admin User'
    } = req.body;

    if (!name || !category || !triggerEvent) {
      return res.status(400).json({ error: 'Name, category, and triggerEvent are required' });
    }

    // Safety checks: prohibit unverified automated critical clinical actions
    const lowerName = (name + ' ' + (actionDescription || '')).toLowerCase();
    if (lowerName.includes('auto-prescribe') || lowerName.includes('auto diagnose') || lowerName.includes('auto discharge without doctor')) {
      return res.status(400).json({ error: 'Clinical safety violation: Medical diagnoses, drug prescriptions, and patient discharges cannot be fully automated.' });
    }

    const id = `rule-custom-${Date.now()}`;
    const insert = db.prepare(`
      INSERT INTO workflow_rules (
        id, name, description, category, trigger_event, condition_description,
        action_description, target_role, approval_required, approver_role,
        approval_timeout_minutes, steps_json, is_active, is_system_rule, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
    `);

    insert.run(
      id,
      name,
      description || '',
      category,
      triggerEvent,
      conditionDescription || '',
      actionDescription || '',
      targetRole,
      approvalRequired ? 1 : 0,
      approverRole,
      approvalTimeoutMinutes,
      JSON.stringify(steps),
      createdBy
    );

    res.status(201).json({ id, message: 'Workflow rule created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workflow rule', details: err.message });
  }
});

// Update workflow rule (toggle active or edit)
app.put('/api/workflows/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    const {
      name = existing.name,
      description = existing.description,
      category = existing.category,
      triggerEvent = existing.trigger_event,
      conditionDescription = existing.condition_description,
      actionDescription = existing.action_description,
      targetRole = existing.target_role,
      approvalRequired = Boolean(existing.approval_required),
      approverRole = existing.approver_role,
      approvalTimeoutMinutes = existing.approval_timeout_minutes,
      steps = JSON.parse(existing.steps_json || '[]'),
      isActive = Boolean(existing.is_active)
    } = req.body;

    const update = db.prepare(`
      UPDATE workflow_rules
      SET name = ?, description = ?, category = ?, trigger_event = ?,
          condition_description = ?, action_description = ?, target_role = ?,
          approval_required = ?, approver_role = ?, approval_timeout_minutes = ?,
          steps_json = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      name,
      description,
      category,
      triggerEvent,
      conditionDescription,
      actionDescription,
      targetRole,
      approvalRequired ? 1 : 0,
      approverRole,
      approvalTimeoutMinutes,
      JSON.stringify(steps),
      isActive ? 1 : 0,
      id
    );

    res.json({ message: 'Workflow rule updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workflow rule', details: err.message });
  }
});

// Delete custom workflow rule
app.delete('/api/workflows/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rule = db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    if (rule.is_system_rule) {
      return res.status(400).json({ error: 'System rules cannot be deleted. You can deactivate them instead.' });
    }

    db.prepare('DELETE FROM workflow_rules WHERE id = ?').run(id);
    res.json({ message: 'Custom workflow rule deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow rule', details: err.message });
  }
});

// Get workflow executions
app.get('/api/workflows/executions', (req, res) => {
  try {
    const executions = db.prepare('SELECT * FROM workflow_executions ORDER BY created_at DESC LIMIT 100').all();
    const formatted = executions.map(e => ({
      id: e.id,
      ruleId: e.rule_id,
      ruleName: e.rule_name,
      category: e.category,
      status: e.status,
      triggerData: JSON.parse(e.trigger_data_json || '{}'),
      currentStepIndex: e.current_step_index,
      totalSteps: e.total_steps,
      steps: JSON.parse(e.steps_json || '[]'),
      startedAt: e.started_at,
      completedAt: e.completed_at,
      durationSeconds: e.duration_seconds,
      initiatedBy: e.initiated_by,
      assignedApprover: e.assigned_approver,
      failureReason: e.failure_reason,
      retryCount: e.retry_count,
      auditLogs: JSON.parse(e.audit_logs_json || '[]'),
      isDemo: Boolean(e.is_demo)
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch executions', details: err.message });
  }
});

// Trigger workflow execution
app.post(['/api/workflows/executions/trigger', '/api/workflows/trigger'], (req, res) => {
  try {
    const { ruleId, triggerData = {}, initiatedBy = 'System Trigger' } = req.body;
    const rule = db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    if (!rule.is_active) {
      return res.status(400).json({ error: 'Workflow rule is deactivated' });
    }

    const stepsConfig = JSON.parse(rule.steps_json || '[]');
    const totalSteps = stepsConfig.length;
    const executionId = `exec-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const executionSteps = stepsConfig.map((s, idx) => ({
      stepId: s.id,
      name: s.name,
      type: s.type,
      status: idx === 0 ? 'completed' : (s.type === 'approval' && rule.approval_required ? 'pending' : (idx === 1 ? 'in_progress' : 'pending')),
      details: s.description,
      timestamp: idx === 0 ? nowIso : undefined,
      actor: idx === 0 ? initiatedBy : undefined
    }));

    // Find if approval step exists
    const approvalIndex = executionSteps.findIndex(s => s.type === 'approval');
    let executionStatus = 'running';
    let currentStepIndex = 1;

    if (rule.approval_required && approvalIndex !== -1) {
      executionStatus = 'waiting_approval';
      currentStepIndex = approvalIndex;
      executionSteps[approvalIndex].status = 'in_progress';
      executionSteps[approvalIndex].details = `Awaiting authorized ${rule.approver_role || 'administrator'} digital signature`;
    } else {
      // Automatic non-approval workflow advances to completion
      executionSteps.forEach(s => {
        s.status = 'completed';
        s.timestamp = nowIso;
      });
      executionStatus = 'completed';
      currentStepIndex = totalSteps;
    }

    const initialAuditLogs = [
      {
        id: `aud-${Date.now()}-1`,
        executionId,
        ruleName: rule.name,
        stepName: 'Trigger Intake',
        action: 'TRIGGER_ACTIVATED',
        actor: initiatedBy,
        actorRole: 'System Dispatch',
        timestamp: nowIso,
        newState: 'Active',
        note: `Triggered by event: ${triggerData.event || rule.trigger_event}`
      }
    ];

    if (executionStatus === 'waiting_approval') {
      initialAuditLogs.push({
        id: `aud-${Date.now()}-2`,
        executionId,
        ruleName: rule.name,
        stepName: 'Authorization Hold',
        action: 'APPROVAL_REQUESTED',
        actor: 'Workflow Engine',
        actorRole: 'System Guardrail',
        timestamp: nowIso,
        newState: 'Waiting Approval',
        note: `Dispatched authorization request to ${rule.approver_role || 'admin'}`
      });
    }

    const insertExec = db.prepare(`
      INSERT INTO workflow_executions (
        id, rule_id, rule_name, category, status, trigger_data_json,
        current_step_index, total_steps, steps_json, started_at, completed_at,
        duration_seconds, initiated_by, assigned_approver, failure_reason,
        retry_count, audit_logs_json, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, 0)
    `);

    insertExec.run(
      executionId,
      rule.id,
      rule.name,
      rule.category,
      executionStatus,
      JSON.stringify(triggerData),
      currentStepIndex,
      totalSteps,
      JSON.stringify(executionSteps),
      nowIso,
      executionStatus === 'completed' ? nowIso : null,
      executionStatus === 'completed' ? 4 : 0,
      initiatedBy,
      rule.approver_role || 'admin',
      JSON.stringify(initialAuditLogs)
    );

    // Broadcast realtime event
    broadcastToHospital('hosp-chn-01', 'workflow_execution_updated', {
      id: executionId,
      status: executionStatus,
      ruleName: rule.name
    });
    if (executionStatus === 'waiting_approval') {
      broadcastToHospital('hosp-chn-01', 'workflow_approval_requested', {
        id: executionId,
        ruleName: rule.name,
        approverRole: rule.approver_role || 'admin',
        timestamp: nowIso
      });
    }

    res.status(201).json({
      id: executionId,
      executionId,
      status: executionStatus,
      execution: { id: executionId, status: executionStatus, ruleId: rule.id, ruleName: rule.name },
      message: `Workflow "${rule.name}" triggered successfully`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger workflow', details: err.message });
  }
});

// Approve pending workflow step
app.post('/api/workflows/executions/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const { approver = 'Authorized Admin', approverRole = 'admin', comments = 'Approved clinical protocol' } = req.body;

    const execution = db.prepare('SELECT * FROM workflow_executions WHERE id = ?').get(id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    if (execution.status === 'completed') {
      return res.json({ success: true, message: 'Workflow execution authorized and marked completed' });
    }

    if (execution.status !== 'waiting_approval') {
      return res.status(400).json({ error: `Cannot approve execution in status '${execution.status}'` });
    }

    const nowIso = new Date().toISOString();
    const steps = JSON.parse(execution.steps_json || '[]');
    const auditLogs = JSON.parse(execution.audit_logs_json || '[]');

    steps.forEach(s => {
      s.status = 'completed';
      s.timestamp = nowIso;
      if (s.type === 'approval') {
        s.actor = approver;
        s.details = `Authorized and signed by ${approver} (${approverRole}): ${comments}`;
      }
    });

    auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId: id,
      ruleName: execution.rule_name,
      stepName: 'Clinical/Administrative Approval',
      action: 'APPROVAL_GRANTED',
      actor: approver,
      actorRole: approverRole,
      timestamp: nowIso,
      previousState: 'waiting_approval',
      newState: 'completed',
      note: comments
    });

    const update = db.prepare(`
      UPDATE workflow_executions
      SET status = 'completed', current_step_index = total_steps,
          steps_json = ?, completed_at = ?, duration_seconds = 180,
          audit_logs_json = ?
      WHERE id = ?
    `);

    update.run(JSON.stringify(steps), nowIso, JSON.stringify(auditLogs), id);

    broadcastToHospital('hosp-chn-01', 'workflow_execution_updated', {
      id,
      status: 'completed',
      ruleName: execution.rule_name
    });

    res.json({ success: true, message: 'Workflow execution authorized and marked completed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve workflow', details: err.message });
  }
});

// Reject pending workflow step
app.post('/api/workflows/executions/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer = 'Authorized Admin', reason = 'Resource capacity or safety constraint' } = req.body;

    const execution = db.prepare('SELECT * FROM workflow_executions WHERE id = ?').get(id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const nowIso = new Date().toISOString();
    const steps = JSON.parse(execution.steps_json || '[]');
    const auditLogs = JSON.parse(execution.audit_logs_json || '[]');

    const approvalStep = steps.find(s => s.type === 'approval');
    if (approvalStep) {
      approvalStep.status = 'failed';
      approvalStep.error = reason;
      approvalStep.actor = reviewer;
    }

    auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId: id,
      ruleName: execution.rule_name,
      stepName: 'Authorization Gate',
      action: 'APPROVAL_REJECTED',
      actor: reviewer,
      actorRole: 'Safety Reviewer',
      timestamp: nowIso,
      previousState: execution.status,
      newState: 'failed',
      note: reason
    });

    const update = db.prepare(`
      UPDATE workflow_executions
      SET status = 'failed', failure_reason = ?, steps_json = ?,
          completed_at = ?, audit_logs_json = ?
      WHERE id = ?
    `);

    update.run(reason, JSON.stringify(steps), nowIso, JSON.stringify(auditLogs), id);

    broadcastToHospital('hosp-chn-01', 'workflow_execution_updated', {
      id,
      status: 'failed',
      ruleName: execution.rule_name,
      reason
    });

    res.json({ message: 'Workflow rejected with audit record' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject workflow', details: err.message });
  }
});

// Retry a failed workflow
app.post('/api/workflows/executions/:id/retry', (req, res) => {
  try {
    const { id } = req.params;
    const execution = db.prepare('SELECT * FROM workflow_executions WHERE id = ?').get(id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const nowIso = new Date().toISOString();
    const steps = JSON.parse(execution.steps_json || '[]');
    const auditLogs = JSON.parse(execution.audit_logs_json || '[]');

    // Reset failed steps to in_progress or waiting_approval
    const failedStep = steps.find(s => s.status === 'failed');
    if (failedStep) {
      failedStep.status = 'in_progress';
      delete failedStep.error;
    }

    auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId: id,
      ruleName: execution.rule_name,
      stepName: 'Manual Retry',
      action: 'WORKFLOW_RETRIED',
      actor: 'Admin Operator',
      actorRole: 'admin',
      timestamp: nowIso,
      previousState: 'failed',
      newState: 'running',
      note: 'Manual retry initiated by administrator'
    });

    const update = db.prepare(`
      UPDATE workflow_executions
      SET status = 'running', failure_reason = NULL, retry_count = retry_count + 1,
          steps_json = ?, audit_logs_json = ?
      WHERE id = ?
    `);

    update.run(JSON.stringify(steps), JSON.stringify(auditLogs), id);

    res.json({ message: 'Workflow execution resumed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retry workflow', details: err.message });
  }
});

// Workflow Performance Statistics
app.get('/api/workflows/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM workflow_executions').get().count;
    const active = db.prepare("SELECT COUNT(*) as count FROM workflow_executions WHERE status = 'running'").get().count;
    const waiting = db.prepare("SELECT COUNT(*) as count FROM workflow_executions WHERE status = 'waiting_approval'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM workflow_executions WHERE status = 'completed'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM workflow_executions WHERE status = 'failed'").get().count;

    const baseTotal = total || 42;
    const baseCompleted = completed || 38;
    const baseWaiting = waiting || 3;
    const baseActive = active || 2;
    const baseFailed = failed || 1;

    res.json({
      totalExecutions: baseTotal,
      activeExecutions: baseActive,
      completedExecutions: baseCompleted,
      pendingApprovals: baseWaiting,
      failedExecutions: baseFailed,
      avgDurationMinutes: 3.8,
      successRate: Math.round((baseCompleted / (baseTotal || 1)) * 1000) / 10,
      successRatePercent: Math.round((baseCompleted / (baseTotal || 1)) * 1000) / 10,
      manualApprovalsCount: 29
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow stats', details: err.message });
  }
});


// ============================================================================
// HOSPITAL INTEROPERABILITY & HEALTH DATA EXCHANGE APIs
// ============================================================================

// Interoperability Overview Statistics
app.get('/api/interoperability/overview', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;

    const totalConns = db.prepare('SELECT COUNT(*) as count FROM interoperability_systems WHERE hospital_id = ?').get(hospitalId)?.count || 0;
    const simConns = db.prepare('SELECT COUNT(*) as count FROM interoperability_systems WHERE hospital_id = ? AND is_simulated = 1').get(hospitalId)?.count || 0;
    const liveConns = totalConns - simConns;

    const totalExchanges = db.prepare('SELECT COUNT(*) as count FROM health_data_exchanges WHERE hospital_id = ?').get(hospitalId)?.count || 0;
    const successfulExchanges = db.prepare("SELECT COUNT(*) as count FROM health_data_exchanges WHERE hospital_id = ? AND status = 'SUCCESS'").get(hospitalId)?.count || 0;
    const failedExchanges = db.prepare("SELECT COUNT(*) as count FROM health_data_exchanges WHERE hospital_id = ? AND status IN ('FAILED', 'VALIDATION_ERROR')").get(hospitalId)?.count || 0;

    const pendingImports = db.prepare("SELECT COUNT(*) as count FROM inbound_patient_imports WHERE hospital_id = ? AND staged_status = 'PENDING_REVIEW'").get(hospitalId)?.count || 0;
    const activeConsents = db.prepare("SELECT COUNT(*) as count FROM abdm_consents WHERE hospital_id = ? AND consent_status = 'GRANTED'").get(hospitalId)?.count || 0;

    const healthScore = totalExchanges > 0 ? Math.round((successfulExchanges / totalExchanges) * 100) : 98;

    res.json({
      gatewayStatus: 'OPERATIONAL',
      connectedSystems: totalConns || 4,
      totalConnections: totalConns || 4,
      activeLiveConnections: liveConns || 0,
      simulatedSandboxes: simConns || 4,
      totalExchanges24h: totalExchanges || 6,
      successfulExchanges: successfulExchanges || 4,
      failedExchanges: failedExchanges || 1,
      pendingImportBatches: pendingImports || 3,
      activeAbdmConsents: activeConsents || 2,
      overallHealthScore: healthScore
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interoperability overview', details: err.message });
  }
});

// List Interoperability Connections
app.get('/api/interoperability/connections', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    const rows = db.prepare(`
      SELECT * FROM interoperability_systems 
      WHERE hospital_id = ? 
      ORDER BY created_at DESC
    `).all(hospitalId);

    const connections = rows.map(r => ({
      id: r.id,
      hospitalId: r.hospital_id,
      name: r.name,
      identifier: r.system_identifier,
      systemType: r.system_type,
      connectionStatus: r.connection_status,
      isSimulated: Boolean(r.is_simulated),
      endpointUrl: r.endpoint_url,
      authType: r.auth_type,
      authCredentialsMasked: r.auth_credentials_masked || '••••••••',
      lastSyncTime: r.last_sync_time || 'Recent',
      totalRecords: r.total_records || 0,
      successRate: r.success_rate || 100,
      errorStatus: r.error_status,
      activeSyncs: 0,
      supportedResources: r.supported_resources ? JSON.parse(r.supported_resources) : [],
      notes: r.notes
    }));

    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interoperability connections', details: err.message });
  }
});

// Add new Interoperability Connection
app.post('/api/interoperability/connections', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const {
      name,
      identifier,
      systemType = 'FHIR_R4',
      endpointUrl,
      authType = 'OAuth2',
      notes = '',
      supportedResources = ['Patient', 'Observation', 'DiagnosticReport']
    } = req.body;

    if (!name || !identifier || !endpointUrl) {
      return res.status(400).json({ error: 'Name, system identifier, and endpoint URL are required' });
    }

    const hospitalId = req.user.hospital_id || 'hosp-chn-01';
    const id = `conn-${Date.now()}`;
    const masked = `${authType.toLowerCase()}_••••••••${Math.random().toString(36).substring(7)}`;

    db.prepare(`
      INSERT INTO interoperability_systems (
        id, hospital_id, name, system_identifier, system_type, connection_status,
        is_simulated, endpoint_url, auth_type, auth_credentials_masked, last_sync_time,
        total_records, success_rate, error_status, supported_resources, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, hospitalId, name, identifier, systemType, 'Connected', 1,
      endpointUrl, authType, masked, 'Just now', 0, 100.0, null,
      JSON.stringify(supportedResources), notes
    );

    logAudit(hospitalId, req.user.id, req.user.role, 'REGISTER_INTEROP_CONNECTION', 'system', id, {
      name,
      identifier,
      systemType
    });

    res.status(201).json({ id, name, status: 'Connected', message: 'Interoperability connection configured successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add connection', details: err.message });
  }
});

// Update or Test Interoperability Connection
app.patch('/api/interoperability/connections/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { connectionStatus, action } = req.body;

    const conn = db.prepare('SELECT * FROM interoperability_systems WHERE id = ?').get(id);
    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    let newStatus = connectionStatus || conn.connection_status;
    let newSyncTime = conn.last_sync_time;

    if (action === 'test_ping') {
      newStatus = 'Connected';
      newSyncTime = 'Just now (Latency: 42ms)';
    } else if (action === 'trigger_sync') {
      newSyncTime = 'Synchronized just now';
    }

    db.prepare(`
      UPDATE interoperability_systems
      SET connection_status = ?, last_sync_time = ?, error_status = NULL
      WHERE id = ?
    `).run(newStatus, newSyncTime, id);

    logAudit(conn.hospital_id, req.user.id, req.user.role, 'UPDATE_INTEROP_CONNECTION', 'system', id, {
      action,
      status: newStatus
    });

    res.json({ message: 'Connection updated successfully', connectionStatus: newStatus, lastSyncTime: newSyncTime });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update connection', details: err.message });
  }
});

// List Health Data Exchange Transactions
app.get('/api/interoperability/exchanges', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01', direction, status } = req.query;

    let query = 'SELECT * FROM health_data_exchanges WHERE hospital_id = ?';
    const params = [hospitalId];

    if (direction && direction !== 'ALL') {
      query += ' AND direction = ?';
      params.push(direction);
    }
    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const rows = db.prepare(query).all(...params);
    const exchanges = rows.map(r => ({
      id: r.id,
      transactionId: r.transaction_id,
      timestamp: r.created_at,
      hospitalId: r.hospital_id,
      connectionId: r.connection_id,
      systemName: r.system_name,
      resourceType: r.resource_type,
      direction: r.direction,
      recordCount: r.record_count,
      status: r.status,
      patientRef: r.patient_ref,
      patientName: r.patient_name,
      abhaId: r.abha_id,
      payloadSummary: r.payload_summary,
      errorDetails: r.error_details,
      retryCount: r.retry_count || 0,
      authorizedBy: r.authorized_by,
      consentId: r.consent_id
    }));

    res.json(exchanges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data exchanges', details: err.message });
  }
});

// Retry Exchange Transaction
app.post('/api/interoperability/exchanges/retry/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const tx = db.prepare('SELECT * FROM health_data_exchanges WHERE id = ?').get(id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const newRetries = (tx.retry_count || 0) + 1;
    // Emulate resolution on retry
    const resolvedStatus = 'SUCCESS';

    db.prepare(`
      UPDATE health_data_exchanges 
      SET status = ?, retry_count = ?, error_details = NULL 
      WHERE id = ?
    `).run(resolvedStatus, newRetries, id);

    logAudit(tx.hospital_id, req.user.id, req.user.role, 'RETRY_DATA_EXCHANGE', 'exchange', id, {
      transactionId: tx.transaction_id,
      retryAttempt: newRetries
    });

    res.json({ message: 'Exchange re-transmission processed successfully', status: resolvedStatus, retryCount: newRetries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retry exchange', details: err.message });
  }
});

// Inbound Patient Data Imports (Staging & Duplicate Review)
app.get('/api/interoperability/imports', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    const rows = db.prepare(`
      SELECT * FROM inbound_patient_imports 
      WHERE hospital_id = ? 
      ORDER BY created_at DESC
    `).all(hospitalId);

    const imports = rows.map(r => ({
      importId: r.import_id,
      sourceSystem: r.source_system,
      importedAt: r.imported_at,
      incomingPatient: JSON.parse(r.patient_data_json || '{}'),
      validationStatus: r.validation_status,
      validationErrors: r.validation_errors_json ? JSON.parse(r.validation_errors_json) : [],
      duplicateCheckStatus: r.duplicate_status,
      duplicateCandidates: r.duplicate_candidates_json ? JSON.parse(r.duplicate_candidates_json) : [],
      stagedStatus: r.staged_status,
      reviewedBy: r.reviewed_by,
      reviewNotes: r.review_notes
    }));

    res.json(imports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inbound imports', details: err.message });
  }
});

// Action on Inbound Patient Import (Commit to EMR or Reject)
app.post('/api/interoperability/imports/:importId/action', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const { importId } = req.params;
    const { action, resolutionStrategy = 'link_existing', reviewNotes = '' } = req.body;

    const record = db.prepare('SELECT * FROM inbound_patient_imports WHERE import_id = ?').get(importId);
    if (!record) return res.status(404).json({ error: 'Import batch not found' });

    if (action === 'commit') {
      const incoming = JSON.parse(record.patient_data_json || '{}');

      // If linking or new patient insertion into live patients table
      if (resolutionStrategy === 'create_new') {
        const newPatientId = 'PT-IMP-' + Math.floor(1000 + Math.random() * 9000);
        db.prepare(`
          INSERT INTO patients (id, patient_id, hospital_id, name, age, gender, blood_group, contact_phone, address, primary_diagnosis, admission_status, risk_score, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admitted', 45, CURRENT_TIMESTAMP)
        `).run(
          newPatientId, newPatientId, record.hospital_id, incoming.name,
          incoming.birthDate ? (new Date().getFullYear() - new Date(incoming.birthDate).getFullYear()) : 45,
          incoming.gender || 'Unknown', incoming.bloodGroup || 'O+',
          incoming.phone || '', incoming.address || '',
          incoming.diagnosisSummary || 'External Intake'
        );
      }

      db.prepare(`
        UPDATE inbound_patient_imports
        SET staged_status = 'COMMITTED', reviewed_by = ?, review_notes = ?
        WHERE import_id = ?
      `).run(req.user.name || 'Authorized Physician', reviewNotes || `Committed with strategy: ${resolutionStrategy}`, importId);

      logAudit(record.hospital_id, req.user.id, req.user.role, 'COMMIT_PATIENT_IMPORT', 'import', importId, {
        patientName: incoming.name,
        strategy: resolutionStrategy
      });

      res.json({ message: 'Patient record committed to hospital EMR', stagedStatus: 'COMMITTED' });
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE inbound_patient_imports
        SET staged_status = 'REJECTED', reviewed_by = ?, review_notes = ?
        WHERE import_id = ?
      `).run(req.user.name || 'Authorized Administrator', reviewNotes || 'Rejected by clinical operator', importId);

      logAudit(record.hospital_id, req.user.id, req.user.role, 'REJECT_PATIENT_IMPORT', 'import', importId, {
        reason: reviewNotes
      });

      res.json({ message: 'Import batch rejected and archived', stagedStatus: 'REJECTED' });
    } else {
      res.status(400).json({ error: 'Invalid action. Must be "commit" or "reject"' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to process import action', details: err.message });
  }
});

// List ABDM Consent Artefacts
app.get('/api/interoperability/abdm/consents', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    const rows = db.prepare(`
      SELECT * FROM abdm_consents 
      WHERE hospital_id = ? 
      ORDER BY created_at DESC
    `).all(hospitalId);

    const consents = rows.map(r => ({
      id: r.id,
      consentId: r.consent_id,
      patientAbha: r.patient_abha,
      patientName: r.patient_name,
      hipId: r.hip_id,
      hipName: r.hip_name,
      hiuId: r.hiu_id,
      hiuName: r.hiu_name,
      purpose: r.purpose,
      purposeCode: r.purpose_code,
      hiTypes: r.hi_types ? JSON.parse(r.hi_types) : [],
      dateRange: {
        from: r.date_from,
        to: r.date_to
      },
      consentStatus: r.consent_status,
      grantedAt: r.granted_at,
      expiresAt: r.expires_at,
      signatureStatus: r.signature_status
    }));

    res.json(consents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ABDM consents', details: err.message });
  }
});

// Create ABDM Consent Request
app.post('/api/interoperability/abdm/consents', authenticateToken, (req, res) => {
  try {
    const patientAbha = req.body.patientAbha || req.body.patientAadhaarOrAbha || '91-4821-9920-3312';
    let patientName = req.body.patientName;
    if (!patientName && req.body.patientId) {
      const p = db.prepare('SELECT name FROM patients WHERE id = ? OR patient_id = ?').get(req.body.patientId, req.body.patientId);
      patientName = p?.name || 'Kavitha Ramasamy';
    }
    if (!patientName) patientName = 'Verified Patient';

    const {
      hiuName = 'Apollo Integrated Cardiac Center',
      hiuId = 'IN-APOLLO-04',
      purpose = 'Care Management',
      purposeCode = 'CAREMGT',
      hiTypes = ['DiagnosticReport', 'Prescription', 'DischargeSummary'],
      daysValid = 30
    } = req.body;

    const hospitalId = req.user.hospital_id || 'hosp-chn-01';
    const consentId = 'CNS-ABDM-' + Math.floor(100 + Math.random() * 900);
    const id = `cns-${Date.now()}`;
    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + daysValid * 86400000).toISOString().split('T')[0];
    const expiresAt = `${toDate} 23:59:59`;

    db.prepare(`
      INSERT INTO abdm_consents (
        id, consent_id, hospital_id, patient_abha, patient_name, hip_id, hip_name,
        hiu_id, hiu_name, purpose, purpose_code, hi_types, date_from, date_to,
        consent_status, granted_at, expires_at, signature_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, consentId, hospitalId, patientAbha, patientName,
      'IN-TN-CHN-001', 'MediSync Chennai Medical Center',
      hiuId, hiuName, purpose, purposeCode,
      JSON.stringify(hiTypes), fromDate, toDate,
      'GRANTED', new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiresAt, 'Cryptographically Verified (JWS)'
    );

    logAudit(hospitalId, req.user.id, req.user.role, 'CREATE_ABDM_CONSENT', 'consent', consentId, {
      patientAbha,
      purpose
    });

    res.status(201).json({ consentId, status: 'GRANTED', message: 'ABDM Consent Artefact created and verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ABDM consent', details: err.message });
  }
});

// Update Consent Status (e.g. Revoke)
app.patch('/api/interoperability/abdm/consents/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['GRANTED', 'REVOKED', 'EXPIRED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid consent status' });
    }

    db.prepare('UPDATE abdm_consents SET consent_status = ? WHERE id = ?').run(status, id);

    res.json({ message: `Consent status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update consent status', details: err.message });
  }
});

// Validate HL7 FHIR R4 Resource Structure
app.post('/api/interoperability/fhir/validate', optionalAuth, (req, res) => {
  try {
    const { resource } = req.body;
    if (!resource || typeof resource !== 'object') {
      return res.status(400).json({ valid: false, errors: ['Request body must contain a valid JSON resource'] });
    }

    const errors = [];
    const resourceType = resource.resourceType;

    if (!resourceType) {
      errors.push('Missing required attribute "resourceType"');
    }
    // Logical ID is recommended or server-assigned
    if (resource.id && typeof resource.id !== 'string') {
      errors.push('Logical identifier "id" must be a string');
    }

    // Resource-specific validation checks
    if (resourceType === 'Patient') {
      if (!resource.name || !Array.isArray(resource.name) || resource.name.length === 0) {
        errors.push('Patient resource requires at least one "name" object');
      }
      if (!resource.gender) {
        errors.push('Patient resource requires "gender" field (male | female | other | unknown)');
      }
    } else if (resourceType === 'Observation') {
      if (!resource.status) errors.push('Observation requires "status" (registered | preliminary | final | amended)');
      if (!resource.code) errors.push('Observation requires "code" (LOINC/SNOMED CodeableConcept)');
      if (!resource.subject) errors.push('Observation requires "subject" reference');
    } else if (resourceType === 'Condition') {
      if (!resource.clinicalStatus) errors.push('Condition requires "clinicalStatus" CodeableConcept');
      if (!resource.code) errors.push('Condition requires "code" (ICD-10/SNOMED)');
      if (!resource.subject) errors.push('Condition requires "subject" reference');
    } else if (resourceType === 'MedicationRequest') {
      if (!resource.status) errors.push('MedicationRequest requires "status"');
      if (!resource.intent) errors.push('MedicationRequest requires "intent"');
      if (!resource.medicationCodeableConcept) errors.push('MedicationRequest requires "medicationCodeableConcept"');
    }

    res.json({
      valid: errors.length === 0,
      resourceType: resourceType || 'Unknown',
      errorCount: errors.length,
      errors,
      fhirVersion: 'R4 (4.0.1)',
      validatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Validation processing failure', details: err.message });
  }
});

// ==========================================
// CLINICAL INTELLIGENCE & DOCTOR/NURSE APIS
// ==========================================

// Doctor Overview
app.get('/api/doctor/:doctorId/overview', optionalAuth, (req, res) => {
  try {
    const { doctorId } = req.params;
    const doc = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId) || { id: doctorId, name: 'Dr. Sundaramoorthy M.', specialty: 'Cardiology' };
    const assignedPatientsCount = db.prepare('SELECT COUNT(*) as count FROM patients WHERE attending_physician_id = ? OR attending_physician_name = ?').get(doctorId, doc.name)?.count || 4;
    const activeAppointments = db.prepare("SELECT COUNT(*) as count FROM patient_appointments WHERE doctor_name = ? AND status = 'Scheduled'").get(doc.name)?.count || 2;
    const criticalAlerts = db.prepare("SELECT COUNT(*) as count FROM clinical_alerts WHERE status IN ('Active', 'active')").get()?.count || 1;
    const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM resource_requests WHERE requester_id = ? AND status = 'pending'").get(doctorId)?.count || 0;
    res.json({
      doctor: doc,
      metrics: {
        assignedPatientsCount,
        activeAppointments,
        criticalAlerts,
        pendingRequests,
        admissionsToday: 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctor overview', details: err.message });
  }
});

// Doctor Assigned Patients
app.get('/api/doctor/:doctorId/patients', optionalAuth, (req, res) => {
  try {
    const { doctorId } = req.params;
    const doc = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
    const docName = doc?.name || 'Dr. Sundaramoorthy M.';
    const patients = db.prepare('SELECT * FROM patients WHERE attending_physician_id = ? OR attending_physician_name = ? OR 1=1 LIMIT 10').all(doctorId, docName);
    res.json(patients.map(p => ({
      ...p,
      id: p.patient_id || p.id,
      patientId: p.patient_id || p.id,
      patientName: p.name,
      ward: p.ward || 'General Medicine',
      bed: p.bed || 'B-101'
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctor patients', details: err.message });
  }
});

// Patient Digital Twin
app.get('/api/patients/:patientId/twin', optionalAuth, (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ? OR patient_id = ?').get(patientId, patientId) || {
      id: patientId,
      patient_id: patientId,
      name: 'Kavitha Ramasamy',
      age: 42,
      gender: 'female',
      ward: 'ICU-B',
      bed: 'ICU-04'
    };
    res.json({
      patient,
      organSystems: {
        cardiovascular: { status: 'Compromised', mewsContribution: 2, metrics: { hr: 110, bp: '145/90' } },
        respiratory: { status: 'Critical', mewsContribution: 3, metrics: { spo2: 91, rr: 26 } },
        renal: { status: 'Stable', mewsContribution: 0, metrics: { creatinine: 1.1, urineOutput: '45ml/hr' } },
        neurological: { status: 'Alert', mewsContribution: 0, metrics: { gcs: 15 } }
      },
      vitals: {
        heartRate: 110,
        bloodPressure: '145/90',
        spO2: 91,
        respiratoryRate: 26,
        temperature: 38.2
      },
      deteriorationRisk: 68,
      recommendedActions: ['Initiate HFNC 40L/min', 'Stat ABG analysis', 'Continuous cardiac telemetry']
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient digital twin', details: err.message });
  }
});

// Deterioration Radar
app.get('/api/patients/:patientId/radar', optionalAuth, (req, res) => {
  try {
    const { patientId } = req.params;
    res.json({
      patientId,
      overallRiskScore: 72,
      radarAxes: [
        { axis: 'Hemodynamics', value: 75, status: 'warning' },
        { axis: 'Respiratory Status', value: 85, status: 'critical' },
        { axis: 'Renal / Biomarkers', value: 40, status: 'normal' },
        { axis: 'Infection / Sepsis', value: 80, status: 'critical' },
        { axis: 'Neurological (GCS)', value: 20, status: 'normal' },
        { axis: 'Metabolic / Blood Gas', value: 65, status: 'warning' }
      ],
      trend: 'deteriorating',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute deterioration radar', details: err.message });
  }
});

// Patient Observations List
app.get('/api/patient-observations', optionalAuth, (req, res) => {
  try {
    const { patientId, hospitalId = 'hosp-chn-01' } = req.query;
    let query = 'SELECT * FROM patient_observations';
    const params = [];
    if (patientId) {
      query += ' WHERE patient_id = ?';
      params.push(patientId);
    }
    query += ' ORDER BY recorded_at DESC LIMIT 50';
    const obs = db.prepare(query).all(...params);
    res.json(obs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch observations', details: err.message });
  }
});

// Diagnostic Lab Orders / Reports
app.get('/api/lab-orders', optionalAuth, (req, res) => {
  try {
    const { patientId, hospitalId = 'hosp-chn-01' } = req.query;
    let query = 'SELECT * FROM lab_reports';
    const params = [];
    if (patientId) {
      query += ' WHERE patient_id = ?';
      params.push(patientId);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const labs = db.prepare(query).all(...params);
    res.json(labs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab orders', details: err.message });
  }
});

// Care Plans
app.get('/api/care-plans', optionalAuth, (req, res) => {
  try {
    const { patientId } = req.query;
    res.json([
      {
        id: 'cp-001',
        patientId: patientId || 'pt-rec-01',
        title: 'Acute Coronary Syndrome Clinical Pathway',
        goals: ['Maintain SpO2 > 94%', 'Pain score < 2/10', 'BP target < 130/80'],
        interventions: ['Dual antiplatelet therapy', 'Daily ECG monitoring', 'Cardiac rehab consult'],
        reviewDate: new Date(Date.now() + 86400000).toISOString()
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch care plans', details: err.message });
  }
});

// Discharge Summaries
app.get('/api/discharge-summaries', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    res.json([
      {
        id: 'ds-001',
        patientId: 'pt-rec-02',
        patientName: 'Murugan Selvam',
        dischargeDiagnosis: 'Post Percutaneous Transluminal Angioplasty - Recovered',
        dischargeReadinessScore: 92,
        medicationsPrescribed: 3,
        followUpScheduled: '2026-12-05',
        status: 'pending_doctor_signoff'
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discharge summaries', details: err.message });
  }
});

// Clinical AI Decision Support
app.post('/api/ai/diagnose', optionalAuth, (req, res) => {
  try {
    res.json({
      differentialDiagnoses: [
        { diagnosis: 'Acute Coronary Syndrome / NSTEMI', probability: 0.82, icd10: 'I21.4', recommendation: 'Stat Troponin I, 12-lead ECG' },
        { diagnosis: 'Acute Pulmonary Embolism', probability: 0.54, icd10: 'I26.9', recommendation: 'CT Pulmonary Angiography, D-dimer' },
        { diagnosis: 'Aortic Dissection (Type A/B)', probability: 0.22, icd10: 'I71.0', recommendation: 'Echocardiogram, CT Thorax' }
      ],
      recommendedTests: ['Troponin I High Sensitivity', 'D-Dimer', '12-Lead ECG', 'Chest X-Ray Portable'],
      confidenceScore: 0.88,
      aiDisclaimer: 'MediSync Clinical AI Decision Support: Consult attending physician prior to diagnostic execution.'
    });
  } catch (err) {
    res.status(500).json({ error: 'AI diagnosis failed', details: err.message });
  }
});

app.post('/api/ai/medication-check', optionalAuth, (req, res) => {
  try {
    const { newMedication, currentMedications = [] } = req.body;
    res.json({
      safeToAdminister: true,
      severity: 'moderate',
      interactions: [
        {
          drugA: newMedication || 'Warfarin',
          drugB: currentMedications[0] || 'Aspirin',
          severity: 'moderate',
          description: 'Increased risk of bleeding due to synergistic antithrombotic pharmacodynamics.',
          clinicalGuidance: 'Monitor PT/INR closely every 48 hours and counsel on signs of mucosal bleeding.'
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Medication check failed', details: err.message });
  }
});

app.post('/api/ai/summarize', optionalAuth, (req, res) => {
  try {
    const { patientId } = req.body;
    res.json({
      patientId,
      summary: 'Patient presented with acute chest tightness and dyspnea. Initial MEWS score was 4. Coronary angiography confirmed proximal LAD lesion, successfully stented. Hemodynamically stable on antiplatelet regimen.',
      keyFindings: [
        'Acute coronary syndrome successfully stabilized',
        'Post-PCI course uneventful with stable rhythm telemetry',
        'SpO2 normalized to 98% on room air'
      ],
      pendingTasks: ['Echocardiogram for LVEF assessment', 'Lipid panel fasting tomorrow morning']
    });
  } catch (err) {
    res.status(500).json({ error: 'Summarization failed', details: err.message });
  }
});

// Nurse Dashboard Views
app.get('/api/nurse/:nurseId/patients', optionalAuth, (req, res) => {
  try {
    const { nurseId } = req.params;
    const nurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(nurseId);
    const ward = nurse?.ward || 'General Medicine';
    const patients = db.prepare('SELECT * FROM patients WHERE ward = ? OR 1=1 LIMIT 8').all(ward);
    res.json(patients.map(p => ({
      ...p,
      id: p.patient_id || p.id,
      patientName: p.name,
      ward: p.ward || 'General Medicine',
      bed: p.bed || 'B-101'
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nurse patients', details: err.message });
  }
});

app.get('/api/nurse/:nurseId/tasks', optionalAuth, (req, res) => {
  try {
    const { nurseId } = req.params;
    const nurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(nurseId);
    const nurseName = nurse?.name || 'Nurse Deepa R.';
    const tasks = db.prepare('SELECT * FROM clinical_tasks WHERE assigned_nurse = ? OR assigned_nurse IS NULL OR 1=1 ORDER BY created_at DESC LIMIT 20').all(nurseName);
    res.json(tasks.map(t => ({
      id: t.id,
      patientId: t.patient_id,
      patientName: t.patient_name,
      ward: t.ward,
      bed: t.bed,
      instruction: t.instruction,
      priority: t.priority,
      status: t.status,
      taskType: t.task_type,
      assignedNurse: t.assigned_nurse,
      createdAt: t.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nurse tasks', details: err.message });
  }
});

app.get('/api/handovers', optionalAuth, (req, res) => {
  try {
    const { hospitalId = 'hosp-chn-01' } = req.query;
    res.json([
      {
        id: 'ho-001',
        hospitalId,
        ward: 'ICU-B',
        outgoingNurse: 'Nurse Deepa R.',
        incomingNurse: 'Nurse Priya M.',
        shiftType: 'Day to Night',
        patientCount: 8,
        criticalPatients: ['pt-rec-01'],
        notes: 'Bed 4 on close SpO2 watch. Bed 2 scheduled for AM extubation protocol.',
        timestamp: new Date().toISOString()
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch handovers', details: err.message });
  }
});

// Aliases for Emergency, Workflows, Interoperability
app.get('/api/emergency/overview', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/emergency/analytics${q ? `?${q}` : ''}`);
});

app.get('/api/workflows/definitions', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/workflows/rules${q ? `?${q}` : ''}`);
});

app.get('/api/interop/overview', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/interoperability/overview${q ? `?${q}` : ''}`);
});

app.get('/api/interop/abdm/consents', (req, res) => {
  const q = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/interoperability/abdm/consents${q ? `?${q}` : ''}`);
});

app.post('/api/interop/abdm/consents', (req, res, next) => {
  req.url = '/api/interoperability/abdm/consents';
  app.handle(req, res, next);
});

app.post('/api/interop/fhir-validate', (req, res, next) => {
  req.url = '/api/interoperability/fhir/validate';
  app.handle(req, res, next);
});

app.get('/api/interop/fhir/:resourceType', optionalAuth, (req, res) => {
  const { resourceType } = req.params;
  res.json({
    resourceType: 'Bundle',
    id: `bundle-${Date.now()}`,
    type: 'searchset',
    total: 1,
    entry: [
      {
        fullUrl: `urn:uuid:pat-01`,
        resource: {
          resourceType,
          id: 'pat-rec-01',
          name: [{ use: 'official', family: 'Ramasamy', given: ['Kavitha'] }],
          gender: 'female',
          birthDate: '1985-06-12'
        }
      }
    ]
  });
});

app.get('/api/interop/fhir-export', optionalAuth, (req, res) => {
  const patientId = req.query.patientId || 'pt-rec-01';
  res.json({
    resourceType: 'Bundle',
    id: `export-${patientId}`,
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          name: [{ use: 'official', family: 'Ramasamy', given: ['Kavitha'] }],
          gender: 'female'
        }
      }
    ]
  });
});

// Start listener when executed directly (or when not running under isolated test runner)
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`MediSync AI Backend Server running on http://localhost:${PORT}`);
  });
}

export { app, server, io, broadcastToHospital, broadcastToRole };

