import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'medisync.db');
export const db = new DatabaseSync(dbPath);
db.pragma = (sql) => db.exec(`PRAGMA ${sql};`);

// Enable busy timeout, foreign keys and WAL mode for high concurrency
try {
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 268435456');
} catch (err) {
  // Pragma configuration warning
}

// Safe column adder helper
function ensureColumn(table, column, definition) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasCol = tableInfo.some(col => col.name === column);
    if (!hasCol) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    }
  } catch (err) {
    // column already exists or table not ready
  }
}

export function initDatabase() {
  db.exec(`
    -- 1. Users & Profiles
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      role TEXT CHECK(role IN ('admin', 'doctor', 'nurse', 'patient')),
      hospital_id TEXT,
      district_id TEXT,
      verification_status TEXT CHECK(verification_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
      rejection_reason TEXT,
      is_onboarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Districts
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      headquarters TEXT NOT NULL,
      region TEXT NOT NULL,
      total_hospitals INTEGER DEFAULT 0,
      critical_beds_total INTEGER DEFAULT 0
    );

    -- 3. Hospitals
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL,
      district_name TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      available_departments TEXT NOT NULL, -- JSON string
      status TEXT NOT NULL,
      total_beds INTEGER DEFAULT 0,
      occupied_beds INTEGER DEFAULT 0,
      ready_beds INTEGER DEFAULT 0,
      prep_beds INTEGER DEFAULT 0,
      icu_available INTEGER DEFAULT 0,
      ventilators_available INTEGER DEFAULT 0,
      phone TEXT,
      emergency_contact TEXT,
      FOREIGN KEY (district_id) REFERENCES districts(id)
    );

    -- 3B. Registered Hospitals (Platform Registry for MediSync Super Admin)
    CREATE TABLE IF NOT EXISTS registered_hospitals (
      id TEXT PRIMARY KEY,
      hospital_name TEXT NOT NULL,
      hospital_type TEXT,
      registration_number TEXT UNIQUE NOT NULL,
      ownership TEXT,
      category TEXT,
      year_established TEXT,
      hospital_logo TEXT,
      description TEXT,
      website TEXT,
      district_id TEXT,
      district_name TEXT,
      hospital_address TEXT,
      area_locality TEXT,
      pincode TEXT,
      hospital_phone TEXT,
      hospital_email TEXT,
      emergency_contact TEXT,
      status TEXT DEFAULT 'Verified',
      total_beds INTEGER DEFAULT 250,
      icu_beds INTEGER DEFAULT 35,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      head_of_department TEXT,
      total_wards INTEGER DEFAULT 0,
      total_beds INTEGER DEFAULT 0,
      operational_status TEXT DEFAULT 'Operational',
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 5. Clinical Wards
    CREATE TABLE IF NOT EXISTS clinical_wards (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      department_id TEXT,
      name TEXT NOT NULL,
      floor TEXT NOT NULL,
      ward_type TEXT DEFAULT 'General',
      total_beds INTEGER DEFAULT 0,
      occupied_beds INTEGER DEFAULT 0,
      available_beds INTEGER DEFAULT 0,
      nurse_in_charge TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 6. Doctors (Staff Directory)
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      specialization TEXT,
      license_number TEXT UNIQUE,
      status TEXT DEFAULT 'Active',
      on_duty INTEGER DEFAULT 1,
      assigned_patients_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 7. Nurses (Staff Directory)
    CREATE TABLE IF NOT EXISTS nurses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      ward TEXT NOT NULL,
      shift TEXT DEFAULT 'Day Shift',
      designation TEXT NOT NULL,
      license_number TEXT UNIQUE,
      status TEXT DEFAULT 'Active',
      on_duty INTEGER DEFAULT 1,
      assigned_beds_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 8. Patients (Master Patient Registry)
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      patient_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT,
      admission_date TEXT NOT NULL,
      department TEXT NOT NULL,
      ward TEXT NOT NULL,
      bed_number TEXT,
      attending_physician_id TEXT,
      attending_physician_name TEXT,
      primary_diagnosis TEXT NOT NULL,
      icd10 TEXT,
      secondary_diagnoses TEXT,
      risk_level TEXT DEFAULT 'Moderate Risk',
      mews_score INTEGER DEFAULT 0,
      resuscitation_status TEXT DEFAULT 'Full Code',
      allergies TEXT,
      vitals TEXT,
      current_vitals TEXT,
      medications TEXT,
      labs TEXT,
      doctor_notes TEXT,
      timeline TEXT,
      status TEXT DEFAULT 'Admitted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 9. Hospital Wards & Beds
    CREATE TABLE IF NOT EXISTS hospital_beds (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      ward TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      type TEXT NOT NULL,
      floor TEXT,
      status TEXT NOT NULL,
      patient_name TEXT,
      patient_id TEXT,
      assigned_doctor TEXT,
      assigned_nurse TEXT,
      equipment TEXT,
      last_updated TEXT NOT NULL,
      notes TEXT,
      status_history TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 10. Hospital Equipment
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT,
      department TEXT NOT NULL,
      ward TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL,
      condition TEXT DEFAULT 'Optimal',
      condition_score INTEGER DEFAULT 100,
      last_inspection TEXT NOT NULL,
      last_maintenance_date TEXT,
      next_maintenance_date TEXT,
      serial_number TEXT UNIQUE NOT NULL,
      telemetry TEXT,
      status_history TEXT,
      maintenance_history TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 11. Admissions
    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      ward TEXT,
      bed_id TEXT,
      doctor_id TEXT,
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      admission_type TEXT DEFAULT 'Emergency',
      admitting_doctor TEXT,
      initial_diagnosis TEXT NOT NULL,
      triage_priority TEXT,
      admitted_by TEXT,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 12. Patient Assignments (Doctor & Nurse)
    CREATE TABLE IF NOT EXISTS patient_assignments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      doctor_id TEXT,
      nurse_id TEXT,
      ward TEXT,
      bed_id TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unassigned_at DATETIME,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 13. Resource Requests
    CREATE TABLE IF NOT EXISTS resource_requests (
      id TEXT PRIMARY KEY,
      request_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT NOT NULL,
      doctor_email TEXT,
      doctor_phone TEXT,
      department TEXT NOT NULL,
      ward TEXT,
      resource_type TEXT NOT NULL,
      resource_name TEXT,
      quantity INTEGER DEFAULT 1,
      unit TEXT DEFAULT 'Units',
      urgency TEXT NOT NULL,
      priority TEXT DEFAULT 'Urgent',
      reason TEXT NOT NULL,
      clinical_justification TEXT,
      status TEXT DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT,
      allocated_resource_id TEXT,
      allocated_resource_name TEXT,
      allocated_quantity INTEGER,
      reviewed_by TEXT,
      reviewed_at TEXT,
      rejection_reason TEXT,
      timeline TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 14. Resource Allocations
    CREATE TABLE IF NOT EXISTS resource_allocations (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      hospital_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      resource_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      allocated_to_type TEXT DEFAULT 'patient',
      allocated_to_id TEXT NOT NULL,
      allocated_by TEXT NOT NULL,
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      returned_at DATETIME,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 15. Clinical Alerts
    CREATE TABLE IF NOT EXISTS clinical_alerts (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      ward TEXT NOT NULL,
      bed TEXT,
      alert_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      mews_score INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      acknowledged_by TEXT,
      acknowledged_at TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 16. Patient Observations & Vitals
    CREATE TABLE IF NOT EXISTS patient_observations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      recorded_by_role TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      heart_rate INTEGER,
      systolic_bp INTEGER,
      diastolic_bp INTEGER,
      spo2 INTEGER,
      respiratory_rate INTEGER,
      temperature REAL,
      gcs INTEGER,
      avpu TEXT,
      pain_score INTEGER,
      mews_score INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 17. Lab Reports
    CREATE TABLE IF NOT EXISTS lab_reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      ordered_by TEXT NOT NULL,
      sample_collected_at TEXT,
      reported_at TEXT,
      status TEXT DEFAULT 'Ordered',
      results TEXT,
      critical_flag INTEGER DEFAULT 0,
      doctor_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 18. Prescriptions
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      doctor_id TEXT,
      doctor_name TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      medications TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      instructions TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 19. Clinical Tasks (Doctor <-> Nurse Communication)
    CREATE TABLE IF NOT EXISTS clinical_tasks (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      ward TEXT NOT NULL,
      bed TEXT,
      doctor_name TEXT NOT NULL,
      doctor_id TEXT,
      assigned_nurse TEXT NOT NULL,
      assigned_nurse_id TEXT,
      task_type TEXT NOT NULL,
      instruction TEXT NOT NULL,
      priority TEXT DEFAULT 'Routine (Standard)',
      status TEXT DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      execution_notes TEXT,
      vitals_recorded TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 20. Patient Transfers
    CREATE TABLE IF NOT EXISTS patient_transfers (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      from_ward TEXT NOT NULL,
      to_ward TEXT NOT NULL,
      from_bed_id TEXT,
      to_bed_id TEXT,
      reason TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      approved_by TEXT,
      status TEXT DEFAULT 'Requested',
      transfer_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 21. Patient Appointments
    CREATE TABLE IF NOT EXISTS patient_appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      hospital_name TEXT NOT NULL,
      department TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      token_number INTEGER NOT NULL,
      status TEXT DEFAULT 'Scheduled',
      queue_position INTEGER,
      estimated_wait_minutes INTEGER,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 22. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      target_role TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      reference_id TEXT,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 23. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Emergency Incidents (Intelligent Emergency Command Center)
    CREATE TABLE IF NOT EXISTS emergency_incidents (
      id TEXT PRIMARY KEY,
      incident_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      location TEXT NOT NULL,
      required_resources TEXT NOT NULL,
      assigned_doctor TEXT,
      assigned_nurse TEXT,
      status TEXT CHECK(status IN ('Reported', 'Under Assessment', 'Resource Requested', 'Resources Allocated', 'In Progress', 'Resolved')) DEFAULT 'Reported',
      waiting_minutes INTEGER DEFAULT 0,
      priority_score INTEGER DEFAULT 1,
      priority_justification TEXT,
      shortage_flag INTEGER DEFAULT 0,
      shortage_details TEXT,
      allocated_resources TEXT,
      timeline TEXT NOT NULL,
      resolution_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 25. Predictive Shortage Alerts (Predictive Hospital Intelligence)
    CREATE TABLE IF NOT EXISTS predictive_shortage_alerts (
      id TEXT PRIMARY KEY,
      alert_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_category TEXT NOT NULL,
      ward_or_department TEXT NOT NULL,
      current_available INTEGER NOT NULL,
      forecasted_demand INTEGER NOT NULL,
      expected_shortage INTEGER NOT NULL,
      time_horizon TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      status TEXT CHECK(status IN ('Active', 'Acknowledged', 'Resolved')) DEFAULT 'Active',
      severity TEXT CHECK(severity IN ('Critical', 'Warning', 'Moderate')) DEFAULT 'Critical',
      recommended_actions TEXT NOT NULL,
      acknowledged_by TEXT,
      acknowledged_at DATETIME,
      resolved_by TEXT,
      resolved_at DATETIME,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 26. Workflow Rules (Intelligent Hospital Workflow Automation)
    CREATE TABLE IF NOT EXISTS workflow_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      trigger_event TEXT NOT NULL,
      condition_description TEXT,
      action_description TEXT,
      target_role TEXT DEFAULT 'all',
      approval_required INTEGER DEFAULT 1,
      approver_role TEXT,
      approval_timeout_minutes INTEGER DEFAULT 30,
      steps_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_system_rule INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 27. Workflow Executions (Intelligent Hospital Workflow Automation)
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT CHECK(status IN ('running', 'waiting_approval', 'completed', 'failed', 'paused')) DEFAULT 'running',
      trigger_data_json TEXT NOT NULL,
      current_step_index INTEGER DEFAULT 0,
      total_steps INTEGER NOT NULL,
      steps_json TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      initiated_by TEXT NOT NULL,
      assigned_approver TEXT,
      failure_reason TEXT,
      retry_count INTEGER DEFAULT 0,
      audit_logs_json TEXT NOT NULL,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES workflow_rules(id)
    );

    -- 23. Interoperability Systems & External Connectors
    CREATE TABLE IF NOT EXISTS interoperability_systems (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      system_identifier TEXT NOT NULL,
      system_type TEXT NOT NULL,
      connection_status TEXT NOT NULL,
      is_simulated INTEGER DEFAULT 1,
      endpoint_url TEXT NOT NULL,
      auth_type TEXT NOT NULL,
      auth_credentials_masked TEXT NOT NULL,
      last_sync_time TEXT,
      total_records INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 100,
      error_status TEXT,
      supported_resources TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 24. Health Data Exchange Audit Trail
    CREATE TABLE IF NOT EXISTS health_data_exchanges (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      system_name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      direction TEXT NOT NULL,
      record_count INTEGER DEFAULT 1,
      status TEXT NOT NULL,
      patient_ref TEXT,
      patient_name TEXT,
      abha_id TEXT,
      payload_summary TEXT NOT NULL,
      error_details TEXT,
      retry_count INTEGER DEFAULT 0,
      authorized_by TEXT NOT NULL,
      consent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 25. ABDM Consent Artefacts
    CREATE TABLE IF NOT EXISTS abdm_consents (
      id TEXT PRIMARY KEY,
      consent_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      patient_abha TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      hip_id TEXT NOT NULL,
      hip_name TEXT NOT NULL,
      hiu_id TEXT NOT NULL,
      hiu_name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      purpose_code TEXT NOT NULL,
      hi_types TEXT NOT NULL,
      date_from TEXT NOT NULL,
      date_to TEXT NOT NULL,
      consent_status TEXT NOT NULL,
      granted_at TEXT,
      expires_at TEXT NOT NULL,
      signature_status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 26. Inbound Patient Data Import & Staging
    CREATE TABLE IF NOT EXISTS inbound_patient_imports (
      import_id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      source_system TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      patient_data_json TEXT NOT NULL,
      validation_status TEXT NOT NULL,
      validation_errors_json TEXT,
      duplicate_status TEXT NOT NULL,
      duplicate_candidates_json TEXT,
      staged_status TEXT NOT NULL,
      reviewed_by TEXT,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 27. Medication Administration Records (MAR)
    CREATE TABLE IF NOT EXISTS medication_administrations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      prescription_id TEXT,
      medication_name TEXT NOT NULL,
      dose TEXT NOT NULL,
      route TEXT NOT NULL,
      frequency TEXT,
      scheduled_time TEXT,
      administered_time TEXT NOT NULL,
      status TEXT NOT NULL,
      administered_by TEXT NOT NULL,
      administered_by_role TEXT NOT NULL,
      reason_or_notes TEXT,
      five_rights_verified INTEGER DEFAULT 1,
      witness_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 28. Shift Handovers (SBAR Protocol)
    CREATE TABLE IF NOT EXISTS shift_handovers (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      ward TEXT NOT NULL,
      outgoing_nurse TEXT NOT NULL,
      incoming_nurse TEXT NOT NULL,
      shift_type TEXT NOT NULL,
      patient_count INTEGER,
      critical_patients TEXT,
      situation TEXT,
      background TEXT,
      assessment TEXT,
      recommendation TEXT,
      notes TEXT,
      checklist_completed INTEGER DEFAULT 1,
      narcotics_count_verified INTEGER DEFAULT 1,
      crash_cart_checked INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Pending Acknowledgment',
      acknowledged_by TEXT,
      acknowledged_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 29. Hospital Resource Registry & Medical Supplies
    CREATE TABLE IF NOT EXISTS hospital_resources (
      id TEXT PRIMARY KEY,
      resource_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      available_quantity INTEGER DEFAULT 1,
      minimum_threshold INTEGER DEFAULT 5,
      unit TEXT DEFAULT 'Units',
      status TEXT DEFAULT 'Available',
      location TEXT,
      responsible_staff TEXT,
      expiry_date TEXT,
      description TEXT,
      last_updated TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );
  `);

  // Migrate any existing columns on legacy tables
  ensureColumn('hospital_beds', 'floor', 'TEXT');
  ensureColumn('hospital_beds', 'assigned_doctor', 'TEXT');
  ensureColumn('hospital_beds', 'equipment', 'TEXT');
  ensureColumn('hospital_beds', 'status_history', 'TEXT');
  ensureColumn('hospital_beds', 'turnaround_stage', 'TEXT');
  ensureColumn('hospital_beds', 'turnaround_updated_by', 'TEXT');
  ensureColumn('hospital_beds', 'cleaning_checklist', 'TEXT');
  ensureColumn('hospital_beds', 'biomedical_checklist', 'TEXT');

  ensureColumn('equipment', 'type', 'TEXT');
  ensureColumn('equipment', 'location', 'TEXT');
  ensureColumn('equipment', 'condition', 'TEXT DEFAULT "Optimal"');
  ensureColumn('equipment', 'condition_score', 'INTEGER DEFAULT 100');
  ensureColumn('equipment', 'last_maintenance_date', 'TEXT');
  ensureColumn('equipment', 'next_maintenance_date', 'TEXT');
  ensureColumn('equipment', 'telemetry', 'TEXT');
  ensureColumn('equipment', 'status_history', 'TEXT');
  ensureColumn('equipment', 'maintenance_history', 'TEXT');

  ensureColumn('resource_requests', 'request_id', 'TEXT');
  ensureColumn('resource_requests', 'doctor_email', 'TEXT');
  ensureColumn('resource_requests', 'doctor_phone', 'TEXT');
  ensureColumn('resource_requests', 'ward', 'TEXT');
  ensureColumn('resource_requests', 'resource_name', 'TEXT');
  ensureColumn('resource_requests', 'unit', 'TEXT DEFAULT "Units"');
  ensureColumn('resource_requests', 'priority', 'TEXT DEFAULT "Urgent"');
  ensureColumn('resource_requests', 'clinical_justification', 'TEXT');
  ensureColumn('resource_requests', 'allocated_resource_name', 'TEXT');
  ensureColumn('resource_requests', 'allocated_quantity', 'INTEGER');
  ensureColumn('resource_requests', 'rejection_reason', 'TEXT');
  ensureColumn('resource_requests', 'timeline', 'TEXT');

  ensureColumn('notifications', 'category', 'TEXT');
  ensureColumn('notifications', 'reference_id', 'TEXT');

  ensureColumn('audit_logs', 'previous_state', 'TEXT');
  ensureColumn('audit_logs', 'new_state', 'TEXT');

  ensureColumn('admissions', 'ward', 'TEXT');
  ensureColumn('admissions', 'doctor_id', 'TEXT');
  ensureColumn('admissions', 'triage_priority', 'TEXT');
  ensureColumn('admissions', 'admitted_by', 'TEXT');

  ensureColumn('emergency_incidents', 'is_simulated', 'INTEGER DEFAULT 0');

  // Phase 23: Secondary Performance Indexes for High-Concurrency Hospital Operations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_beds_hospital_status ON hospital_beds (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_beds_patient ON hospital_beds (patient_id);
    CREATE INDEX IF NOT EXISTS idx_beds_ward ON hospital_beds (ward);
    CREATE INDEX IF NOT EXISTS idx_equipment_hospital_status ON equipment (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment (serial_number);
    CREATE INDEX IF NOT EXISTS idx_hospital_resources_query ON hospital_resources (hospital_id, category, status);
    CREATE INDEX IF NOT EXISTS idx_requests_hospital_status ON resource_requests (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_requests_requester ON resource_requests (requester_id);
    CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients (hospital_id, admission_date);
    CREATE INDEX IF NOT EXISTS idx_observations_patient ON patient_observations (patient_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_hospital_status ON clinical_alerts (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_hospital_status ON clinical_tasks (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_notifications_hospital ON notifications (hospital_id, read);
    CREATE INDEX IF NOT EXISTS idx_audit_hospital_created ON audit_logs (hospital_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_emergency_hospital_status ON emergency_incidents (hospital_id, status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_users_hospital_role ON users (hospital_id, role);
    CREATE INDEX IF NOT EXISTS idx_admissions_hospital_patient ON admissions (hospital_id, patient_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_hospital_status ON patient_transfers (hospital_id, status);
  `);

  seedInitialData();
}

function seedInitialData() {
  const districtCount = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
  if (districtCount === 0) {
    console.log('Seeding initial Tamil Nadu healthcare database...');

    // 1. Districts
    const insertDistrict = db.prepare(`
      INSERT INTO districts (id, name, headquarters, region, total_hospitals, critical_beds_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const districts = [
      ['chennai', 'Chennai', 'Chennai', 'North', 14, 580],
      ['coimbatore', 'Coimbatore', 'Coimbatore', 'West', 9, 340],
      ['madurai', 'Madurai', 'Madurai', 'South', 8, 290],
      ['tiruchirappalli', 'Tiruchirappalli', 'Trichy', 'Central', 6, 210],
      ['salem', 'Salem', 'Salem', 'West', 5, 175],
      ['tirunelveli', 'Tirunelveli', 'Tirunelveli', 'South', 5, 160],
      ['vellore', 'Vellore', 'Vellore', 'North', 6, 230],
      ['thanjavur', 'Thanjavur', 'Thanjavur', 'Central', 4, 140],
      ['kanchipuram', 'Kanchipuram', 'Kanchipuram', 'North', 4, 120],
      ['tiruppur', 'Tiruppur', 'Tiruppur', 'West', 5, 150],
      ['erode', 'Erode', 'Erode', 'West', 4, 130],
      ['cuddalore', 'Cuddalore', 'Cuddalore', 'Central', 3, 95]
    ];

    for (const d of districts) {
      insertDistrict.run(...d);
    }
  }

  // 2. Hospitals
  const hospCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get().count;
  if (hospCount === 0) {
    const insertHospital = db.prepare(`
      INSERT INTO hospitals (
        id, district_id, district_name, name, type, location, available_departments,
        status, total_beds, occupied_beds, ready_beds, prep_beds, icu_available,
        ventilators_available, phone, emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const hospitals = [
      [
        'hosp-chn-01', 'chennai', 'Chennai',
        'Rajiv Gandhi Government General Hospital (RGGGH)', 'Apex Super Specialty',
        'EVR Periyar Salai, Park Town, Chennai',
        JSON.stringify(['Critical Care', 'Cardiology', 'Neurology', 'Pulmonology', 'Trauma & Emergency', 'Nephrology', 'Pediatrics']),
        'Operational', 520, 410, 82, 28, 18, 12,
        '+91 44 2530 5000', '044-25305112'
      ],
      [
        'hosp-chn-02', 'chennai', 'Chennai',
        'Government Kilpauk Medical College Hospital', 'Government Medical College Hospital',
        'Poonamallee High Road, Kilpauk, Chennai',
        JSON.stringify(['Burns & Plastic Surgery', 'Critical Care', 'General Medicine', 'Orthopedics', 'Emergency Care']),
        'High Capacity', 340, 285, 42, 13, 9, 7,
        '+91 44 2836 4951', '044-28364955'
      ],
      [
        'hosp-chn-03', 'chennai', 'Chennai',
        'Government Stanley Medical College Hospital', 'Government Medical College Hospital',
        'Old Jail Road, Royapuram, Chennai',
        JSON.stringify(['Gastroenterology', 'Trauma Care', 'Cardiology', 'Pediatrics', 'Critical Care']),
        'Operational', 460, 375, 63, 22, 14, 9,
        '+91 44 2528 0900', '044-25280905'
      ],
      [
        'hosp-cbe-01', 'coimbatore', 'Coimbatore',
        'Coimbatore Medical College Hospital (CMCH)', 'Government Medical College Hospital',
        'Trichy Road, Coimbatore',
        JSON.stringify(['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pulmonology', 'Critical Care']),
        'Operational', 380, 295, 62, 23, 15, 11,
        '+91 422 230 1393', '0422-2301399'
      ],
      [
        'hosp-mdu-01', 'madurai', 'Madurai',
        'Government Rajaji Hospital (GRH)', 'Apex Super Specialty',
        'Panagal Road, Alwarpuram, Madurai',
        JSON.stringify(['Trauma Center', 'Cardiology', 'Neurosurgery', 'Pediatrics', 'Critical Care']),
        'Operational', 440, 360, 58, 22, 16, 10,
        '+91 452 253 2535', '0452-2532540'
      ]
    ];

    for (const h of hospitals) {
      insertHospital.run(...h);
    }
  }

  // 3. Departments
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (deptCount === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (id, hospital_id, name, head_of_department, total_wards, total_beds, operational_status, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const depts = [
      ['dept-01', 'hosp-chn-01', 'Critical Care & ICU Complex', 'Dr. Sundaramoorthy M.', 4, 45, 'Operational', '044-25305120', 'icu.rgggh@medisync.tn.gov.in'],
      ['dept-02', 'hosp-chn-01', 'Trauma & Emergency Care', 'Dr. Alex Rivera', 3, 35, 'Operational', '044-25305112', 'emergency.rgggh@medisync.tn.gov.in'],
      ['dept-03', 'hosp-chn-01', 'Cardiology & Cath Lab', 'Dr. Sundaramoorthy M.', 3, 30, 'Operational', '044-25305125', 'cardio.rgggh@medisync.tn.gov.in'],
      ['dept-04', 'hosp-chn-01', 'Pulmonology & Respiratory Care', 'Dr. Meenakshi S.', 2, 25, 'Operational', '044-25305130', 'pulmo.rgggh@medisync.tn.gov.in'],
      ['dept-05', 'hosp-chn-01', 'General Medicine & Inpatient Ward', 'Dr. Vasanth Kumar', 5, 80, 'Operational', '044-25305140', 'medicine.rgggh@medisync.tn.gov.in'],
      ['dept-06', 'hosp-chn-01', 'Pediatric Intensive Care', 'Dr. K. Annamalai', 2, 20, 'Operational', '044-25305150', 'pediatrics.rgggh@medisync.tn.gov.in']
    ];

    for (const d of depts) {
      insertDept.run(...d);
    }
  }

  // 4. Clinical Wards
  const wardCount = db.prepare('SELECT COUNT(*) as count FROM clinical_wards').get().count;
  if (wardCount === 0) {
    const insertWard = db.prepare(`
      INSERT INTO clinical_wards (id, hospital_id, department_id, name, floor, ward_type, total_beds, occupied_beds, available_beds, nurse_in_charge, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const wards = [
      ['ward-01', 'hosp-chn-01', 'dept-01', 'ICU Block A', '2nd Floor, Critical Care Tower', 'ICU', 15, 12, 3, 'Nurse Deepa R.', 'Active'],
      ['ward-02', 'hosp-chn-01', 'dept-01', 'ICU Block B', '2nd Floor, Critical Care Tower', 'ICU', 15, 11, 4, 'Nurse Anitha T.', 'Active'],
      ['ward-03', 'hosp-chn-01', 'dept-02', 'Emergency Ward', 'Ground Floor (Triage Wing)', 'Emergency', 20, 14, 6, 'Nurse Rajeshwari K.', 'Active'],
      ['ward-04', 'hosp-chn-01', 'dept-03', 'HDU Ward 2', '3rd Floor, Cardiology Wing', 'HDU', 15, 10, 5, 'Nurse Priya M.', 'Active'],
      ['ward-05', 'hosp-chn-01', 'dept-05', 'Step-down Ward 4', '4th Floor, Main Building', 'Step-Down', 25, 18, 7, 'Nurse Revathi S.', 'Active']
    ];

    for (const w of wards) {
      insertWard.run(...w);
    }
  }

  // 5. Doctors Directory
  const docCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  if (docCount === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO doctors (id, user_id, hospital_id, name, email, phone, department, designation, specialization, license_number, status, on_duty, assigned_patients_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const docs = [
      ['doc-01', 'usr_doctor', 'hosp-chn-01', 'Dr. Sundaramoorthy M.', 'dr.sundar@medisync.gov.in', '+91 94440 12345', 'Critical Care & Cardiology', 'Senior Interventional Cardiologist & Attending', 'Cardiology & Critical Care', 'TNMC-10492', 'Active', 1, 4],
      ['doc-02', null, 'hosp-chn-01', 'Dr. Meenakshi S.', 'meenakshi.pulmo@medisync.gov.in', '+91 98401 22334', 'Pulmonology & Critical Care', 'Lead Pulmonologist', 'Mechanical Ventilation & ARDS', 'TNMC-11849', 'Active', 1, 3],
      ['doc-03', null, 'hosp-chn-01', 'Dr. Alex Rivera', 'alex.rivera@medisync.gov.in', '+91 98402 77881', 'Emergency & Trauma', 'Trauma Team Director', 'Emergency Medicine & Resuscitation', 'TNMC-15920', 'Active', 1, 5],
      ['doc-04', 'usr_admin', 'hosp-chn-01', 'Dr. Vasanth Kumar', 'admin.vasanth@medisync.gov.in', '+91 94441 55667', 'Hospital Administration', 'Chief Medical Officer & Administrator', 'Internal Medicine & Hospital Ops', 'TNMC-08492', 'Active', 1, 2]
    ];

    for (const d of docs) {
      insertDoc.run(...d);
    }
  }

  // 6. Nurses Directory
  const nurseCount = db.prepare('SELECT COUNT(*) as count FROM nurses').get().count;
  if (nurseCount === 0) {
    const insertNurse = db.prepare(`
      INSERT INTO nurses (id, user_id, hospital_id, name, email, phone, ward, shift, designation, license_number, status, on_duty, assigned_beds_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nurses = [
      ['nur-01', 'usr_nurse', 'hosp-chn-01', 'Nurse Deepa R.', 'deepa.nurse@medisync.gov.in', '+91 97890 12345', 'ICU Block A', 'Morning Shift (07:00 - 15:00)', 'Senior Critical Care Staff Nurse', 'TNNMC-48192', 'Active', 1, 4],
      ['nur-02', null, 'hosp-chn-01', 'Nurse Priya M.', 'priya.nurse@medisync.gov.in', '+91 97890 23456', 'HDU Ward 2', 'Morning Shift (07:00 - 15:00)', 'Cardiac HDU Specialist Nurse', 'TNNMC-51092', 'Active', 1, 5],
      ['nur-03', null, 'hosp-chn-01', 'Nurse Rajeshwari K.', 'rajeshwari.nurse@medisync.gov.in', '+91 97890 34567', 'Emergency Ward', 'Rotational Shift', 'Triage Emergency Nurse', 'TNNMC-39182', 'Active', 1, 6],
      ['nur-04', null, 'hosp-chn-01', 'Nurse Revathi S.', 'revathi.nurse@medisync.gov.in', '+91 97890 45678', 'Step-down Ward 4', 'Evening Shift (15:00 - 23:00)', 'Inpatient Ward Nurse In-Charge', 'TNNMC-44910', 'Active', 1, 4]
    ];

    for (const n of nurses) {
      insertNurse.run(...n);
    }
  }

  // 7. Master Patients
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  if (patientCount === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        id, patient_id, hospital_id, name, age, gender, blood_group, admission_date,
        department, ward, bed_number, attending_physician_id, attending_physician_name,
        primary_diagnosis, icd10, secondary_diagnoses, risk_level, mews_score,
        resuscitation_status, allergies, vitals, current_vitals, medications, labs,
        doctor_notes, timeline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const pts = [
      [
        'pt-rec-01', 'PT-8941', 'hosp-chn-01', 'Kavitha Ramasamy', 54, 'Female', 'O+', '2026-11-25',
        'Critical Care & Cardiology', 'ICU Block A', 'ICU-04', 'doc-01', 'Dr. Sundaramoorthy M.',
        'Acute Coronary Syndrome with Cardiogenic Shock', 'I21.0',
        JSON.stringify(['Type 2 Diabetes Mellitus', 'Essential Hypertension']),
        'High Risk', 5, 'Full Code', JSON.stringify(['Penicillin']),
        JSON.stringify([
          { timestamp: '08:00 AM', hr: 94, bp: '138/86', spo2: 95, rr: 18, temp: 98.6 },
          { timestamp: '12:00 PM', hr: 98, bp: '142/88', spo2: 94, rr: 20, temp: 98.8 },
          { timestamp: '04:00 PM', hr: 104, bp: '132/82', spo2: 92, rr: 22, temp: 99.1 }
        ]),
        JSON.stringify({ hr: 104, sbp: 132, dbp: 82, spo2: 92, rr: 22, temp: 99.1 }),
        JSON.stringify([
          { id: 'm1', name: 'Norepinephrine Infusion', dose: '0.08 mcg/kg/min', route: 'IV Central Line', frequency: 'Continuous', status: 'Active' },
          { id: 'm2', name: 'Aspirin', dose: '75 mg', route: 'Oral', frequency: 'Once Daily', status: 'Active' },
          { id: 'm3', name: 'Atorvastatin', dose: '40 mg', route: 'Oral', frequency: 'Bedtime', status: 'Active' }
        ]),
        JSON.stringify([
          { id: 'l1', name: 'High-Sensitivity Troponin I', value: '480 ng/L', normalRange: '< 14 ng/L', status: 'Critical', date: '2026-11-26' },
          { id: 'l2', name: 'Serum Creatinine', value: '1.4 mg/dL', normalRange: '0.6 - 1.2 mg/dL', status: 'High', date: '2026-11-26' }
        ]),
        'Patient hemodynamics stabilizing following targeted vasoactive titration. Continue continuous arterial line monitoring.',
        JSON.stringify([
          { id: 'e1', timestamp: 'Today, 10:30 AM', title: 'Cardiology Morning Round', actor: 'Dr. Sundaramoorthy M.', description: 'Echocardiogram demonstrates LVEF 38%. Titrate beta-blocker cautiously.' }
        ]),
        'Admitted'
      ],
      [
        'pt-rec-02', 'PT-8942', 'hosp-chn-01', 'Murugan Selvam', 48, 'Male', 'B+', '2026-11-26',
        'Emergency & Trauma', 'Emergency Ward', 'EMR-02', 'doc-03', 'Dr. Alex Rivera',
        'Acute Non-ST Elevation Myocardial Infarction', 'I21.4',
        JSON.stringify(['Dyslipidemia', 'Tobacco Use Disorder']),
        'Moderate Risk', 3, 'Full Code', JSON.stringify([]),
        JSON.stringify([
          { timestamp: '11:00 AM', hr: 86, bp: '130/80', spo2: 97, rr: 16, temp: 98.4 }
        ]),
        JSON.stringify({ hr: 86, sbp: 130, dbp: 80, spo2: 97, rr: 16, temp: 98.4 }),
        JSON.stringify([
          { id: 'm4', name: 'Enoxaparin', dose: '60 mg', route: 'Subcutaneous', frequency: 'Twice Daily', status: 'Active' }
        ]),
        JSON.stringify([]),
        'Chest discomfort subsided after sublingual nitrates. Plan for early invasive coronary angiography.',
        JSON.stringify([]),
        'Admitted'
      ],
      [
        'pt-rec-03', 'PT-8945', 'hosp-chn-01', 'Subramanian V', 67, 'Male', 'A+', '2026-11-24',
        'Pulmonology & Respiratory Care', 'HDU Ward 2', 'HDU-07', 'doc-02', 'Dr. Meenakshi S.',
        'Acute Exacerbation of Chronic Obstructive Pulmonary Disease', 'J44.1',
        JSON.stringify(['Cor Pulmonale', 'Chronic Respiratory Failure']),
        'High Risk', 4, 'Full Code', JSON.stringify(['Sulfa Drugs']),
        JSON.stringify([
          { timestamp: '09:00 AM', hr: 96, bp: '136/84', spo2: 91, rr: 24, temp: 98.9 }
        ]),
        JSON.stringify({ hr: 96, sbp: 136, dbp: 84, spo2: 91, rr: 24, temp: 98.9 }),
        JSON.stringify([
          { id: 'm5', name: 'Budesonide/Formoterol Nebulization', dose: '0.5mg/20mcg', route: 'Inhalation', frequency: 'Q8H', status: 'Active' }
        ]),
        JSON.stringify([]),
        'On high-flow nasal cannula at 40 L/min, FiO2 45%. Respiratory mechanics stable.',
        JSON.stringify([]),
        'Admitted'
      ],
      [
        'pt-rec-04', 'EMG-8991', 'hosp-chn-01', 'Murugan K. (Code Red Trauma)', 42, 'Male', 'O-', '2026-11-27',
        'Emergency & Critical Care', 'ICU Block A', 'Bed A-101', 'doc-01', 'Dr. Sundaramoorthy M.',
        'Polytrauma with Acute Hemorrhagic Shock and Respiratory Decompensation', 'T07',
        JSON.stringify(['Hypovolemic Shock', 'Flail Chest Right']),
        'Critical', 7, 'Full Code', JSON.stringify([]),
        JSON.stringify([
          { timestamp: '18:15 PM', hr: 128, bp: '82/48', spo2: 87, rr: 30, temp: 97.4 }
        ]),
        JSON.stringify({ hr: 128, sbp: 82, dbp: 48, spo2: 87, rr: 30, temp: 97.4 }),
        JSON.stringify([
          { id: 'm6', name: 'O-Negative Uncrossed PRBCs', dose: '2 Units', route: 'Rapid Infuser', frequency: 'STAT', status: 'Active' },
          { id: 'm7', name: 'Tranexamic Acid', dose: '1 g', route: 'IV Piggyback', frequency: 'STAT', status: 'Active' }
        ]),
        JSON.stringify([
          { id: 'l3', name: 'Arterial Blood Gas pH', value: '7.21', normalRange: '7.35 - 7.45', status: 'Critical', date: '2026-11-27' },
          { id: 'l4', name: 'Serum Lactate', value: '4.8 mmol/L', normalRange: '< 2.0 mmol/L', status: 'Critical', date: '2026-11-27' }
        ]),
        'Emergency scenario code red polytrauma. Successfully resuscitated and docked in Bed A-101. Ventilator online.',
        JSON.stringify([
          { id: 'e2', timestamp: 'Just now', title: 'Emergency Trauma Docking', actor: 'Trauma Code Red Team', description: 'Bed A-101 and Ventilator VEN-01 locked. Massive transfusion protocol phase 1 complete.' }
        ]),
        'Admitted'
      ]
    ];

    for (const p of pts) {
      insertPatient.run(...p);
    }
  }

  // 8. Hospital Beds
  const bedCount = db.prepare('SELECT COUNT(*) as count FROM hospital_beds').get().count;
  if (bedCount === 0) {
    const insertBed = db.prepare(`
      INSERT INTO hospital_beds (
        id, hospital_id, ward, bed_number, type, floor, status, patient_name, patient_id, assigned_doctor, assigned_nurse, equipment, last_updated, notes, status_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const beds = [
      ['bed-01', 'hosp-chn-01', 'ICU Block A', 'Bed A-101', 'ICU', '2nd Floor', 'Occupied', 'Murugan K. (Code Red Trauma)', 'EMG-8991', 'Dr. Sundaramoorthy M.', 'Nurse Deepa R.', 'Hamilton-C6 Ventilator, Wall O2, Defibrillator, Telemetry', 'Just now', 'Occupied by emergency trauma case', JSON.stringify([])],
      ['bed-101', 'hosp-chn-01', 'ICU Block A', 'ICU-04', 'ICU', '2nd Floor', 'occupied', 'Kavitha Ramasamy', 'PT-8941', 'Dr. Sundaramoorthy M.', 'Nurse Deepa R.', 'Crash Cart, Wall O2, Arterial Line Monitor', '10 mins ago', 'Post-op respiratory monitoring in progress', JSON.stringify([])],
      ['bed-102', 'hosp-chn-01', 'ICU Block A', 'ICU-05', 'ICU', '2nd Floor', 'discharged', null, null, null, 'Nurse Priya M.', 'Wall O2, Suction Ready', '25 mins ago', 'Patient shifted to step-down ward. Pending cleaning.', JSON.stringify([])],
      ['bed-103', 'hosp-chn-01', 'ICU Block A', 'ICU-06', 'ICU', '2nd Floor', 'cleaning', null, null, null, 'Nurse Priya M.', 'Wall O2', '15 mins ago', 'Sanitization and terminal cleaning underway', JSON.stringify([])],
      ['bed-104', 'hosp-chn-01', 'ICU Block B', 'ICU-12', 'ICU', '2nd Floor', 'equipment_check', null, null, null, 'Nurse Anitha T.', 'Cardiac Monitor B650', '8 mins ago', 'Cardiac monitor calibration in progress', JSON.stringify([])],
      ['bed-105', 'hosp-chn-01', 'ICU Block B', 'ICU-15', 'ICU', '2nd Floor', 'nurse_confirmation', null, null, null, 'Nurse Deepa R.', 'Ventilator Standby', '4 mins ago', 'Linens ready, ventilator calibrated, awaiting nurse sign-off', JSON.stringify([])],
      ['bed-106', 'hosp-chn-01', 'ICU Block B', 'ICU-18', 'ICU', '2nd Floor', 'ready', null, null, null, 'Nurse Deepa R.', 'Crash Cart, Wall O2, Telemetry', 'Just now', 'Operationally ready for immediate emergency admission', JSON.stringify([])],
      ['bed-107', 'hosp-chn-01', 'Emergency Ward', 'EMR-02', 'Emergency', 'Ground Floor', 'occupied', 'Murugan Selvam', 'PT-8942', 'Dr. Alex Rivera', 'Nurse Rajeshwari K.', 'Wall O2, Defibrillator Ready', '12 mins ago', 'Acute chest pain evaluation', JSON.stringify([])],
      ['bed-108', 'hosp-chn-01', 'Emergency Ward', 'EMR-03', 'Emergency', 'Ground Floor', 'ready', null, null, null, 'Nurse Rajeshwari K.', 'Crash Cart, O2 Flowmeter', '20 mins ago', 'Sterilized and ready with oxygen supply', JSON.stringify([])],
      ['bed-109', 'hosp-chn-01', 'HDU Ward 2', 'HDU-07', 'HDU', '3rd Floor', 'occupied', 'Subramanian V', 'PT-8945', 'Dr. Meenakshi S.', 'Nurse Priya M.', 'High-Flow O2 Machine', '35 mins ago', 'High dependency respiratory support', JSON.stringify([])],
      ['bed-110', 'hosp-chn-01', 'HDU Ward 2', 'HDU-08', 'HDU', '3rd Floor', 'Available', null, null, null, 'Nurse Priya M.', 'Wall O2, Infusion Dock', '5 mins ago', 'Oxygen flow checked; available for ward transfer', JSON.stringify([])],
      ['bed-111', 'hosp-chn-01', 'Emergency Ward', 'EMG-B101', 'Emergency', 'Ground Floor', 'Available', null, null, null, 'Nurse Rajeshwari K.', 'Triage Bed, Monitor Ready', 'Just now', 'Available triage intake bay', JSON.stringify([])]
    ];

    for (const b of beds) {
      insertBed.run(...b);
    }
  }

  // 9. Equipment
  const eqCount = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
  if (eqCount === 0) {
    const insertEq = db.prepare(`
      INSERT INTO equipment (
        id, hospital_id, name, category, type, department, ward, location, status, condition, condition_score,
        last_inspection, last_maintenance_date, next_maintenance_date, serial_number, telemetry, status_history, maintenance_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const equipmentList = [
      ['eq-01', 'hosp-chn-01', 'Hamilton-C6 Mechanical Ventilator', 'Ventilator', 'Ventilators', 'Critical Care', 'ICU Block A', 'Bed A-101', 'In Use', 'Optimal', 98, 'Today, 08:30 AM', '2026-11-20', '2026-12-20', 'HAM-C6-99214', JSON.stringify({ mode: 'PRVC', peep: 8, fio2: 50, tidalVolume: 450, peakPressure: 22 }), JSON.stringify([]), JSON.stringify([])],
      ['eq-02', 'hosp-chn-01', 'Mindray SV300 Invasive Ventilator', 'Ventilator', 'Ventilators', 'Emergency Ward', 'Emergency Ward', 'Bay 2', 'In Use', 'Good', 92, 'Yesterday, 14:00 PM', '2026-11-15', '2026-12-15', 'MDR-SV-10492', JSON.stringify({ mode: 'SIMV', peep: 5, fio2: 40, tidalVolume: 500, peakPressure: 18 }), JSON.stringify([]), JSON.stringify([])],
      ['eq-03', 'hosp-chn-01', 'Philips HeartStart XL+ Defibrillator', 'Defibrillator', 'Defibrillators', 'Trauma & Emergency', 'Emergency Ward', 'Crash Cart Alpha', 'Available', 'Optimal', 100, 'Today, 07:15 AM', '2026-11-25', '2026-12-25', 'PHL-HS-48192', JSON.stringify({ battery: 100, shockCount: 0, dailySelfTest: 'Passed' }), JSON.stringify([]), JSON.stringify([])],
      ['eq-04', 'hosp-chn-01', 'B. Braun Space Infusion Pump System', 'Infusion Pump', 'Infusion Pumps', 'Critical Care', 'ICU Block B', 'Bay 4', 'Available', 'Optimal', 95, 'Today, 09:10 AM', '2026-11-10', '2026-12-10', 'BBR-SP-77123', JSON.stringify({ flowRate: '0.0 mL/h', pressure: 'Normal' }), JSON.stringify([]), JSON.stringify([])],
      ['eq-05', 'hosp-chn-01', 'GE Healthcare Carescape B650 Monitor', 'Cardiac Monitor', 'Cardiac Monitors', 'Critical Care', 'ICU Block B', 'Bay 12', 'Needs Check', 'Fair', 75, '2 days ago', '2026-10-28', '2026-11-28', 'GEH-CS-33819', JSON.stringify({ leadStatus: 'Lead II noisy' }), JSON.stringify([]), JSON.stringify([])]
    ];

    for (const eq of equipmentList) {
      insertEq.run(...eq);
    }
  }

  // 10. Resource Requests
  const reqCount = db.prepare('SELECT COUNT(*) as count FROM resource_requests').get().count;
  if (reqCount === 0) {
    const insertReq = db.prepare(`
      INSERT INTO resource_requests (
        id, request_id, hospital_id, requester_id, requester_name, requester_role,
        doctor_email, doctor_phone, department, ward, resource_type, resource_name,
        quantity, unit, urgency, priority, reason, clinical_justification, status,
        created_at, patient_id, patient_name, allocated_resource_id, allocated_resource_name,
        allocated_quantity, reviewed_by, reviewed_at, rejection_reason, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialReqs = [
      [
        'req-201', 'REQ-2026-001', 'hosp-chn-01', 'doc-01', 'Dr. Sundaramoorthy M.', 'doctor',
        'dr.sundar@medisync.gov.in', '+91 94440 12345', 'Critical Care & Cardiology', 'ICU Block A',
        'ICU Resources', 'ICU Bed with Invasive Hemodynamic Telemetry', 1, 'Units',
        'Critical', 'Urgent', 'Acute myocardial infarction requiring urgent hemodynamic and telemetry monitoring',
        'Severe left ventricular failure with pulmonary congestion. Immediate advanced ICU bed essential.',
        'pending', '12 mins ago', 'PT-8946', 'Ramesh Balan', null, null, null, null, null, null,
        JSON.stringify([
          { id: 't1', action: 'Submitted', actor: 'Dr. Sundaramoorthy M.', notes: 'Requisition submitted for immediate allocation', timestamp: '12 mins ago' }
        ])
      ],
      [
        'req-202', 'REQ-2026-002', 'hosp-chn-01', 'doc-02', 'Dr. Meenakshi S.', 'doctor',
        'meenakshi.pulmo@medisync.gov.in', '+91 98401 22334', 'Pulmonology & Respiratory Care', 'HDU Ward 2',
        'Medical Equipment', 'Mechanical Ventilator (Hamilton-C6)', 1, 'Units',
        'Urgent', 'Urgent', 'Severe COPD exacerbation with impending respiratory muscle exhaustion',
        'Type 2 respiratory failure; pH 7.24, PaCO2 68 mmHg. High non-invasive ventilation failure risk.',
        'allocated', '45 mins ago', 'PT-8947', 'Govindasamy N.', 'eq-01', 'Hamilton-C6 Ventilator (eq-01)',
        1, 'Hospital Administrator', '30 mins ago', null,
        JSON.stringify([
          { id: 't2', action: 'Submitted', actor: 'Dr. Meenakshi S.', notes: 'Requisition submitted', timestamp: '45 mins ago' },
          { id: 't3', action: 'Approved', actor: 'Hospital Administrator', notes: 'Allocated Hamilton-C6 Ventilator from ICU pool', timestamp: '30 mins ago' }
        ])
      ]
    ];

    for (const r of initialReqs) {
      insertReq.run(...r);
    }
  }

  // 11. Clinical Tasks (Doctor <-> Nurse)
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM clinical_tasks').get().count;
  if (taskCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO clinical_tasks (
        id, hospital_id, patient_id, patient_name, ward, bed, doctor_name, doctor_id,
        assigned_nurse, assigned_nurse_id, task_type, instruction, priority, status,
        created_at, completed_at, execution_notes, vitals_recorded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialTasks = [
      [
        'tsk-01', 'hosp-chn-01', 'PT-8941', 'Kavitha Ramasamy', 'ICU Block A', 'ICU-04',
        'Dr. Sundaramoorthy M.', 'doc-01', 'Nurse Deepa R.', 'nur-01',
        'Vitals & ABG', 'STAT: Check arterial blood gas and titrate Norepinephrine if MAP < 65 mmHg.',
        'Stat (Immediate)', 'Pending', '15 mins ago', null, null, null
      ],
      [
        'tsk-02', 'hosp-chn-01', 'PT-8945', 'Subramanian V', 'HDU Ward 2', 'HDU-07',
        'Dr. Meenakshi S.', 'doc-02', 'Nurse Priya M.', 'nur-02',
        'Medication Administration', 'Administer Ipratropium/Albuterol nebulization and record pre/post SpO2.',
        'Urgent (1 Hour)', 'In Progress', '25 mins ago', null, 'Patient placed in high-fowler position. Nebulizer started.', null
      ]
    ];

    for (const t of initialTasks) {
      insertTask.run(...t);
    }
  }

  // 12. Clinical Alerts
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM clinical_alerts').get().count;
  if (alertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO clinical_alerts (
        id, hospital_id, patient_id, patient_name, ward, bed, alert_type, reason, score, mews_score, timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const alerts = [
      ['alt-01', 'hosp-chn-01', 'PT-8941', 'Kavitha Ramasamy', 'ICU Block A', 'ICU-04', 'Deterioration Alert', 'Persistent Tachycardia (HR 104) with declining SpO2 (92%) on 4L O2', 5, 5, '10 mins ago', 'Active'],
      ['alt-02', 'hosp-chn-01', 'EMG-8991', 'Murugan K. (Code Red Trauma)', 'ICU Block A', 'Bed A-101', 'Hemodynamic Collapse Risk', 'Profound hypotension (BP 82/48) and severe lactic acidosis (pH 7.21, Lactate 4.8)', 7, 7, 'Just now', 'Active']
    ];

    for (const a of alerts) {
      insertAlert.run(...a);
    }
  }

  // 13. Notifications
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notifCount === 0) {
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, hospital_id, title, message, type, category, reference_id, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insertNotif.run('notif-1', 'hosp-chn-01', 'Critical Resource Request', 'Dr. Sundaramoorthy requested 1 ICU Bed for Patient PT-8946', 'critical', 'emergency_request', 'req-201', '12 mins ago');
    insertNotif.run('notif-2', 'hosp-chn-01', 'Bed Ready for Admission', 'Bed ICU-18 confirmed ready by Nurse Deepa in ICU Block B', 'success', 'bed_update', 'bed-106', '18 mins ago');
    insertNotif.run('notif-3', 'hosp-chn-01', 'Trauma Code Red Intake', 'Murugan K. (EMG-8991) admitted to Bed A-101 under Dr. Sundaramoorthy M.', 'warning', 'patient_admission', 'EMG-8991', 'Just now');
  }

  // 14. Demo Users for Instant Login
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, google_id, email, name, username, role, hospital_id, district_id, verification_status, is_onboarded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoAccounts = [
      ['usr_admin', 'goog_admin_01', 'admin.vasanth@medisync.gov.in', 'Dr. Vasanth Kumar', 'admin_vasanth', 'admin', 'hosp-chn-01', 'chennai', 'approved', 1],
      ['usr_doctor', 'goog_doctor_01', 'dr.sundar@medisync.gov.in', 'Dr. Sundaramoorthy M.', 'dr_sundar', 'doctor', 'hosp-chn-01', 'chennai', 'approved', 1],
      ['usr_nurse', 'goog_nurse_01', 'deepa.nurse@medisync.gov.in', 'Nurse Deepa R.', 'nurse_deepa', 'nurse', 'hosp-chn-01', 'chennai', 'approved', 1],
      ['usr_patient', 'goog_patient_01', 'karthik.subramanian@gmail.com', 'Karthik Subramanian', 'karthik_s', 'patient', 'hosp-chn-01', 'chennai', 'approved', 1]
    ];

    for (const u of demoAccounts) {
      insertUser.run(...u);
    }
  }

  // 15. Emergency Incidents (Intelligent Emergency Command Center)
  const incidentCount = db.prepare('SELECT COUNT(*) as count FROM emergency_incidents').get().count;
  if (incidentCount === 0) {
    const insertInc = db.prepare(`
      INSERT INTO emergency_incidents (
        id, incident_id, hospital_id, patient_id, patient_name, emergency_type,
        severity, location, required_resources, assigned_doctor, assigned_nurse,
        status, waiting_minutes, priority_score, priority_justification,
        shortage_flag, shortage_details, allocated_resources, timeline, resolution_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialIncidents = [
      [
        'inc-01', 'INC-2026-088', 'hosp-chn-01', 'EMG-8991', 'Murugan K. (Code Red Trauma)',
        'Polytrauma with Acute Hemorrhagic Shock', 'Critical Level 1 - Code Red',
        'Trauma Resuscitation Unit Bay 1',
        JSON.stringify(['ICU Bed', 'Mechanical Ventilator', '2 Units O-Negative PRBCs', 'Trauma Surgeon']),
        'Dr. Sundaramoorthy M.', 'Nurse Deepa R.', 'Resources Allocated', 4, 1,
        'Massive crush injury with multi-organ trauma; MAP 52 mmHg; active blood loss',
        0, null,
        JSON.stringify({
          bed: 'Bed A-101 (ICU Block A)',
          ventilator: 'Hamilton-C6 (HAM-C6-99214)',
          bloodUnits: 'O-Negative PRBCs (Units #8921, #8922)',
          specialist: 'Dr. Sundaramoorthy M. (Interventional Trauma Lead)'
        }),
        JSON.stringify([
          { timestamp: '18:10 PM', action: 'Emergency Reported', actor: '108 Paramedic Dispatch', notes: 'En-route trauma notification code red. ETA 5 minutes.' },
          { timestamp: '18:15 PM', action: 'Doctor Assigned', actor: 'Dr. Sundaramoorthy M.', notes: 'Primary trauma survey initiated. Airway secured.' },
          { timestamp: '18:18 PM', action: 'Resource Request Submitted', actor: 'Dr. Sundaramoorthy M.', notes: 'Requisition REQ-2026-004 submitted for ICU Bed + Ventilator.' },
          { timestamp: '18:22 PM', action: 'Resource Request Approved', actor: 'Hospital Administrator', notes: 'Immediate clearance authorized for Bed A-101 and Hamilton-C6.' },
          { timestamp: '18:25 PM', action: 'Resources Allocated', actor: 'Command Center Coordinator', notes: 'Bed A-101 locked and ventilator connected.' }
        ]),
        null
      ],
      [
        'inc-02', 'INC-2026-089', 'hosp-chn-01', 'PT-8941', 'Kavitha Ramasamy',
        'Acute Massive Anterior STEMI with Cardiogenic Shock', 'Critical Level 1 - Code Red',
        'ER Triage Bay 2',
        JSON.stringify(['Cardiac ICU Bed', 'Intra-Aortic Balloon Pump / Monitor', 'Interventional Cardiologist']),
        'Dr. Sundaramoorthy M.', 'Nurse Deepa R.', 'In Progress', 8, 1,
        'ST elevations V1-V6 with cardiogenic pulmonary edema and refractory hypotension',
        0, null,
        JSON.stringify({
          bed: 'ICU-04 (ICU Block A)',
          monitor: 'Arterial Line Telemetry B650',
          specialist: 'Dr. Sundaramoorthy M.'
        }),
        JSON.stringify([
          { timestamp: '17:45 PM', action: 'Emergency Reported', actor: 'Triage Nurse Deepa R.', notes: 'Crushing retrosternal chest pain with diaphoretic shock.' },
          { timestamp: '17:50 PM', action: 'Assessment Completed', actor: 'Dr. Sundaramoorthy M.', notes: 'Confirmed STEMI; emergency cath lab activation protocol initiated.' },
          { timestamp: '18:00 PM', action: 'Treatment Started', actor: 'Cardiac Cath Lab Team', notes: 'Primary coronary angioplasty underway.' }
        ]),
        null
      ],
      [
        'inc-03', 'INC-2026-090', 'hosp-chn-01', 'PT-8947', 'Govindasamy N.',
        'Severe Acute Respiratory Failure & ARDS', 'Emergent Level 2 - Code Orange',
        'Ambulance Bay Intake 3',
        JSON.stringify(['Invasive Mechanical Ventilator', 'HDU Bay', 'Pulmonologist']),
        'Dr. Meenakshi S.', 'Nurse Priya M.', 'Under Assessment', 14, 2,
        'Severe type 2 respiratory acidosis with PaCO2 68 mmHg; exhausting accessory muscles',
        1, JSON.stringify({
          shortageType: 'HDU Bed Capacity',
          missingResource: 'HDU Bay (Full)',
          recommendation: 'Step-down Ward 4 or ICU Bay 12 overflow buffer',
          notifiedAdmin: true
        }),
        null,
        JSON.stringify([
          { timestamp: '17:30 PM', action: 'Emergency Reported', actor: 'Ambulance Triage Team', notes: 'Severe respiratory distress; SpO2 84% on reservoir mask.' },
          { timestamp: '17:38 PM', action: 'Assessment Completed', actor: 'Dr. Meenakshi S.', notes: 'Impending respiratory arrest. Non-invasive trial failing.' },
          { timestamp: '17:42 PM', action: 'Resource Shortage Flagged', actor: 'Emergency Coordinator', notes: 'HDU beds at 100% capacity. Alternate ICU overflow requested.' }
        ]),
        null
      ]
    ];

    for (const inc of initialIncidents) {
      insertInc.run(...inc);
    }
  }

  // Seed Initial Predictive Shortage Alerts
  const predAlertCount = db.prepare('SELECT COUNT(*) as count FROM predictive_shortage_alerts').get().count;
  if (predAlertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO predictive_shortage_alerts (
        id, alert_id, hospital_id, resource_type, resource_category,
        ward_or_department, current_available, forecasted_demand, expected_shortage,
        time_horizon, confidence_score, status, severity, recommended_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialAlerts = [
      [
        'alt-01', 'ALT-PRED-101', 'hosp-chn-01', 'ICU Beds', 'Beds',
        'ICU Block A / Critical Care', 2, 5, 3,
        '24 Hours', 92.4, 'Active', 'Critical',
        JSON.stringify([
          'Expedite step-down discharge of 2 stable patients in ICU-05 and ICU-06 to HDU',
          'Prepare PACU recovery ward as temporary overflow ICU buffer',
          'Pre-alert on-call intensivist for 22:00 trauma surge'
        ])
      ],
      [
        'alt-02', 'ALT-PRED-102', 'hosp-chn-01', 'Mechanical Ventilators', 'Equipment',
        'Emergency & Pulmonary Medicine', 1, 3, 2,
        '3 Days', 88.0, 'Active', 'Warning',
        JSON.stringify([
          'Recall 2 standby Hamilton-C6 ventilators from biomedical calibration',
          'Verify high-flow nasal cannula (HFNC) units as initial non-invasive bridge',
          'Audit oxygen manifold bank pressures'
        ])
      ],
      [
        'alt-03', 'ALT-PRED-103', 'hosp-chn-01', 'O-Negative PRBC Blood Units', 'Blood Reserve',
        'Apex Blood Bank & Trauma Resuscitation', 4, 10, 6,
        '7 Days', 86.5, 'Active', 'Warning',
        JSON.stringify([
          'Issue scheduled blood donation drive alert to regional network',
          'Confirm reserve holding at State Blood Transfusion Council',
          'Restrict elective surgical blood cross-match hold times'
        ])
      ]
    ];

    for (const alert of initialAlerts) {
      insertAlert.run(...alert);
    }
  }

  // Seed Initial Workflow Rules
  const workflowRuleCount = db.prepare('SELECT COUNT(*) as count FROM workflow_rules').get().count;
  if (workflowRuleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO workflow_rules (
        id, name, description, category, trigger_event, condition_description,
        action_description, target_role, approval_required, approver_role,
        approval_timeout_minutes, steps_json, is_active, is_system_rule, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialRules = [
      [
        'rule-wf-01',
        'Emergency Clinical Requisition Authorization',
        'Automatically validates resource requisitions, checks live bed/equipment telemetry, and routes to Hospital Admin with priority alerts.',
        'Resource Requests',
        'Doctor submits resource requisition',
        'Priority is Critical or High, or requested item is Ventilator / ICU Bed',
        'Validate telemetry, notify on-duty Administrator, track approval state',
        'admin',
        1,
        'admin',
        20,
        JSON.stringify([
          { id: 's1', name: 'Requisition Intake', type: 'trigger', description: 'Doctor files resource requisition', config: {}, order: 1 },
          { id: 's2', name: 'Inventory & Bed Check', type: 'condition', description: 'Verify asset telemetry and availability', config: {}, order: 2 },
          { id: 's3', name: 'Admin Priority Alert', type: 'notification', description: 'Alert Hospital Admin via audible dispatch', config: {}, order: 3 },
          { id: 's4', name: 'Authorized Sign-off', type: 'approval', description: 'Admin verifies and confirms allocation', config: {}, order: 4 },
          { id: 's5', name: 'Fulfillment & Audit', type: 'completion', description: 'Update inventory, notify Doctor, log audit trail', config: {}, order: 5 }
        ]),
        1,
        1,
        'System Clinical Ops'
      ],
      [
        'rule-wf-02',
        'Bed Readiness & Sanitation Verification',
        'Coordinates housekeeping terminal disinfection and nurse clinical check-off before beds transition to Ready.',
        'Bed Readiness',
        'Bed marked Cleaning or Unavailable',
        'Department is Critical Care, ICU, or Emergency Trauma',
        'Dispatch sanitation ticket, notify Floor Supervisor, verify inspection',
        'nurse',
        1,
        'nurse',
        30,
        JSON.stringify([
          { id: 's1', name: 'Bed Status Transition', type: 'trigger', description: 'Bed marked for turnaround', config: {}, order: 1 },
          { id: 's2', name: 'Sterility Criteria Check', type: 'condition', description: 'Department requires pathogen-free clearance', config: {}, order: 2 },
          { id: 's3', name: 'Housekeeping Dispatch', type: 'action', description: 'Queue 6-stage terminal cleaning task', config: {}, order: 3 },
          { id: 's4', name: 'Charge Nurse Inspection', type: 'approval', description: 'Nurse signs off bed readiness verification', config: {}, order: 4 },
          { id: 's5', name: 'Publish Available Bed', type: 'completion', description: 'Update Bed Master, broadcast to Doctor Dashboard', config: {}, order: 5 }
        ]),
        1,
        1,
        'Infection Control Office'
      ],
      [
        'rule-wf-03',
        'Life-Support Equipment Maintenance & Calibration',
        'Monitors device telemetry faults, removes faulty units from service, dispatches Bio-Med engineering, and mandates certified return-to-service.',
        'Equipment Maintenance',
        'Equipment telemetry error or fault reported',
        'Unit is critical life-support (Ventilator, Defibrillator, ECMO, Dialysis)',
        'Flag unit Unavailable, alert Bio-Med engineering, log maintenance order',
        'maintenance',
        1,
        'admin',
        60,
        JSON.stringify([
          { id: 's1', name: 'Telemetry Fault Trigger', type: 'trigger', description: 'Sensor alert or manual fault report', config: {}, order: 1 },
          { id: 's2', name: 'Life-Support Criticality Check', type: 'condition', description: 'Asset categorized as Class III medical device', config: {}, order: 2 },
          { id: 's3', name: 'Lockout & Dispatch', type: 'action', description: 'Set operational status to Maintenance; alert Bio-Med', config: {}, order: 3 },
          { id: 's4', name: 'Biomedical Sign-off', type: 'approval', description: 'Certified technician enters calibration certificate', config: {}, order: 4 },
          { id: 's5', name: 'Return to Telemetry Ready', type: 'completion', description: 'Re-enable unit on live ward inventory', config: {}, order: 5 }
        ]),
        1,
        1,
        'Biomedical Engineering'
      ],
      [
        'rule-wf-04',
        'Inter-Ward Clinical Step-Down & Transfer',
        'Validates patient acuity, verifies destination bed capacity, prevents duplicate transfers, and alerts receiving nurse station.',
        'Patient Transfer',
        'Attending physician orders ward transfer',
        'Destination ward bed is available & no duplicate transfer active',
        'Verify clinical stabilization, notify Receiving Ward, queue nurse transport',
        'all',
        1,
        'doctor',
        45,
        JSON.stringify([
          { id: 's1', name: 'Transfer Order Placed', type: 'trigger', description: 'Doctor requests inter-ward transfer', config: {}, order: 1 },
          { id: 's2', name: 'Duplicate & Bed Check', type: 'condition', description: 'Check destination bed availability & verify no pending transfer', config: {}, order: 2 },
          { id: 's3', name: 'Receiving Nurse Alert', type: 'notification', description: 'Notify destination nurse charge station', config: {}, order: 3 },
          { id: 's4', name: 'Receiving Doctor Sign-off', type: 'approval', description: 'Receiving clinician accepts patient handover', config: {}, order: 4 },
          { id: 's5', name: 'Bed & Chart Realignment', type: 'completion', description: 'Update patient bed assignment, log audit', config: {}, order: 5 }
        ]),
        1,
        1,
        'Chief Medical Officer'
      ],
      [
        'rule-wf-05',
        'Recurring Post-Op Vital Signs & Clinical Observation',
        'Automatically queues scheduled nursing observations (Q2H/Q4H) and alerts clinicians when critical parameters breach safe thresholds.',
        'Clinical Tasks',
        'Post-surgical patient admitted or clinical order placed',
        'Observation interval elapsed or vital sign deviation detected',
        'Generate nursing assessment task, prompt vitals entry',
        'nurse',
        0,
        null,
        15,
        JSON.stringify([
          { id: 's1', name: 'Protocol Schedule Trigger', type: 'trigger', description: 'Recurring observation interval reached', config: {}, order: 1 },
          { id: 's2', name: 'Acuity Level Filter', type: 'condition', description: 'Check patient MEWS score and current vitals', config: {}, order: 2 },
          { id: 's3', name: 'Nurse Task Dispatch', type: 'action', description: 'Create Doctor-Nurse clinical task on Nurse Dashboard', config: {}, order: 3 },
          { id: 's4', name: 'Nurse Observation Entry', type: 'completion', description: 'Nurse logs BP/HR/SpO2; system evaluates trend', config: {}, order: 4 }
        ]),
        1,
        1,
        'Clinical Protocols Committee'
      ],
      [
        'rule-wf-06',
        'Structured Multi-Department Patient Discharge',
        'Orchestrates multi-department clearance (investigations, pharmacy, billing, transport) with mandatory physician sign-off.',
        'Discharge',
        'Physician initiates discharge protocol',
        'All pending lab investigations and consultant notes reconciled',
        'Generate clearance checklist, prepare prescription summary for review, notify billing & transport',
        'all',
        1,
        'doctor',
        90,
        JSON.stringify([
          { id: 's1', name: 'Discharge Order Logged', type: 'trigger', description: 'Doctor opens discharge workflow', config: {}, order: 1 },
          { id: 's2', name: 'Prerequisite Audit', type: 'condition', description: 'Verify zero outstanding emergency labs or unread reports', config: {}, order: 2 },
          { id: 's3', name: 'Department Clearances', type: 'action', description: 'Alert pharmacy, billing, and patient transport', config: {}, order: 3 },
          { id: 's4', name: 'Attending Physician Approval', type: 'approval', description: 'Doctor reviews summary and signs digital discharge clearance', config: {}, order: 4 },
          { id: 's5', name: 'Bed De-allocation & Turnaround', type: 'completion', description: 'Release bed to Cleaning status; archive active inpatient record', config: {}, order: 5 }
        ]),
        1,
        1,
        'Patient Flow Directorate'
      ],
      [
        'rule-wf-07',
        'Critical Lab Value & MEWS Alert Escalation',
        'Immediately flags life-threatening laboratory panics or deteriorating vital signs and alerts the primary physician with 10-minute auto-escalation.',
        'Emergency Coordination',
        'Lab system flags critical panic value or MEWS >= 5',
        'Patient is active inpatient or ED observation',
        'High-priority audio-visual chime on Doctor and Nurse consoles',
        'doctor',
        0,
        null,
        10,
        JSON.stringify([
          { id: 's1', name: 'Panic Value Ingested', type: 'trigger', description: 'Critical biomarker or vital sign threshold breached', config: {}, order: 1 },
          { id: 's2', name: 'Acuity Risk Gate', type: 'condition', description: 'Verify panic threshold criteria (e.g. K+ > 6.5, SpO2 < 85%)', config: {}, order: 2 },
          { id: 's3', name: 'Primary Physician Page', type: 'notification', description: 'Dispatch critical mobile and console alert', config: {}, order: 3 },
          { id: 's4', name: 'Clinical Acknowledgment', type: 'completion', description: 'Doctor confirms review within 10 min; prevents escalation to Code Blue', config: {}, order: 4 }
        ]),
        1,
        1,
        'Emergency Resuscitation Team'
      ]
    ];

    for (const rule of initialRules) {
      insertRule.run(...rule);
    }
  }

  // 18. Seed Lab Reports
  const labCount = db.prepare('SELECT COUNT(*) as count FROM lab_reports').get().count;
  if (labCount === 0) {
    const insertLab = db.prepare(`
      INSERT INTO lab_reports (
        id, patient_id, hospital_id, test_name, category, ordered_by,
        sample_collected_at, reported_at, status, results, critical_flag, doctor_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialLabs = [
      [
        'lab-01', 'PT-8941', 'hosp-chn-01', 'High-Sensitivity Troponin I', 'Cardiac Markers',
        'Dr. Sundaramoorthy M.', '2026-11-27 08:30', '2026-11-27 09:15', 'Completed',
        JSON.stringify({ value: '480', unit: 'ng/L', referenceRange: '< 14 ng/L' }), 1,
        'Markedly elevated troponin consistent with acute myocardial infarction. Serial repeat ordered.', '2026-11-27 09:15:00'
      ],
      [
        'lab-02', 'PT-8941', 'hosp-chn-01', 'Serum Creatinine', 'Biochemistry',
        'Dr. Sundaramoorthy M.', '2026-11-27 08:30', '2026-11-27 09:30', 'Completed',
        JSON.stringify({ value: '1.4', unit: 'mg/dL', referenceRange: '0.6 - 1.2 mg/dL' }), 0,
        'Mild elevation. Monitor renal perfusion and titrate ACE inhibitors.', '2026-11-27 09:30:00'
      ],
      [
        'lab-03', 'EMG-8991', 'hosp-chn-01', 'Arterial Blood Gas pH', 'Blood Gas',
        'Dr. Sundaramoorthy M.', '2026-11-27 18:20', '2026-11-27 18:35', 'Completed',
        JSON.stringify({ value: '7.21', unit: 'pH', referenceRange: '7.35 - 7.45' }), 1,
        'Severe metabolic acidosis secondary to hypovolemic shock. Serum lactate 4.8 mmol/L.', '2026-11-27 18:35:00'
      ],
      [
        'lab-04', 'PT-8945', 'hosp-chn-01', 'Complete Blood Count (CBC)', 'Hematology',
        'Dr. Meenakshi S.', '2026-11-27 10:00', '2026-11-27 11:00', 'Completed',
        JSON.stringify({ value: 'WBC 14.8', unit: '10^3/uL', referenceRange: '4.5 - 11.0 10^3/uL' }), 0,
        'Leukocytosis consistent with acute infectious exacerbation of COPD.', '2026-11-27 11:00:00'
      ],
      [
        'lab-05', 'PT-8941', 'hosp-chn-01', 'Serum Potassium (K+)', 'Biochemistry',
        'Dr. Sundaramoorthy M.', '2026-11-27 14:00', null, 'Pending',
        null, 0,
        'STAT routine electrolyte check following loop diuretic administration.', '2026-11-27 14:00:00'
      ]
    ];

    for (const lab of initialLabs) {
      insertLab.run(...lab);
    }
  }

  // 19. Seed Prescriptions
  const rxCount = db.prepare('SELECT COUNT(*) as count FROM prescriptions').get().count;
  if (rxCount === 0) {
    const insertRx = db.prepare(`
      INSERT INTO prescriptions (
        id, patient_id, hospital_id, doctor_id, doctor_name, diagnosis,
        medications, start_date, end_date, instructions, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialRx = [
      [
        'rx-01', 'PT-8941', 'hosp-chn-01', 'doc-01', 'Dr. Sundaramoorthy M.',
        'Acute Anterior STEMI',
        JSON.stringify([
          { drug: 'Aspirin', dose: '75 mg', route: 'Oral', freq: 'Once Daily', duration: '30 days', instructions: 'Take with or after food' },
          { drug: 'Atorvastatin', dose: '40 mg', route: 'Oral', freq: 'Once daily at bedtime', duration: '30 days', instructions: 'Take at night' },
          { drug: 'Ticagrelor', dose: '90 mg', route: 'Oral', freq: 'Twice daily', duration: '30 days', instructions: 'Do not discontinue without consulting cardiologist' }
        ]),
        '2026-11-26', '2026-12-26',
        'Post-PCI dual antiplatelet and high-intensity statin regimen.',
        'Active', '2026-11-26 11:00:00'
      ],
      [
        'rx-02', 'PT-8945', 'hosp-chn-01', 'doc-02', 'Dr. Meenakshi S.',
        'COPD Exacerbation with Wheeze',
        JSON.stringify([
          { drug: 'Budesonide/Formoterol', dose: '0.5mg/20mcg', route: 'Inhalation', freq: 'Q8H', duration: '14 days', instructions: 'Rinse mouth after inhalation' },
          { drug: 'Ipratropium Bromide', dose: '500 mcg', route: 'Inhalation', freq: 'Q6H PRN', duration: '7 days', instructions: 'Nebulize with 3 mL normal saline' }
        ]),
        '2026-11-24', '2026-12-08',
        'Bronchodilator and inhaled corticosteroid maintenance.',
        'Active', '2026-11-24 14:30:00'
      ],
      [
        'rx-03', 'EMG-8991', 'hosp-chn-01', 'doc-01', 'Dr. Sundaramoorthy M.',
        'Polytrauma Hemorrhagic Shock',
        JSON.stringify([
          { drug: 'Tranexamic Acid', dose: '1 g', route: 'IV', freq: 'STAT then 1g over 8h', duration: '24 hours', instructions: 'Infuse via dedicated central lumen' },
          { drug: 'Cefazolin', dose: '2 g', route: 'IV', freq: 'Q8H', duration: '48 hours', instructions: 'Surgical antimicrobial prophylaxis' }
        ]),
        '2026-11-27', '2026-11-29',
        'Trauma resuscitation and hemorrhage mitigation.',
        'Active', '2026-11-27 18:45:00'
      ]
    ];

    for (const rx of initialRx) {
      insertRx.run(...rx);
    }
  }

  // 20. Seed Patient Appointments
  const aptCount = db.prepare('SELECT COUNT(*) as count FROM patient_appointments').get().count;
  if (aptCount === 0) {
    const insertApt = db.prepare(`
      INSERT INTO patient_appointments (
        id, patient_id, patient_name, hospital_id, hospital_name, department,
        doctor_name, date, time, token_number, status, queue_position, estimated_wait_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialApts = [
      ['APT-101', 'PT-USR-01', 'Karthik Subramanian', 'hosp-chn-01', 'Government General Hospital, Chennai', 'Cardiology & Critical Care', 'Dr. Sundaramoorthy M.', '2026-11-28', '09:30 AM', 1, 'Completed', 0, 0],
      ['APT-102', 'PT-USR-02', 'Anand Kumar', 'hosp-chn-01', 'Government General Hospital, Chennai', 'Cardiology & Critical Care', 'Dr. Sundaramoorthy M.', '2026-11-28', '10:15 AM', 2, 'In Consultation', 1, 0],
      ['APT-103', 'PT-USR-03', 'Lakshmi Narayanan', 'hosp-chn-01', 'Government General Hospital, Chennai', 'Cardiology & Critical Care', 'Dr. Sundaramoorthy M.', '2026-11-28', '11:00 AM', 3, 'Waiting', 2, 15],
      ['APT-104', 'PT-USR-04', 'Praveen Chandran', 'hosp-chn-01', 'Government General Hospital, Chennai', 'Cardiology & Critical Care', 'Dr. Sundaramoorthy M.', '2026-11-28', '11:45 AM', 4, 'Scheduled', 3, 30],
      ['APT-105', 'PT-USR-05', 'Geetha Ramanathan', 'hosp-chn-01', 'Government General Hospital, Chennai', 'Cardiology & Critical Care', 'Dr. Sundaramoorthy M.', '2026-11-28', '02:30 PM', 5, 'Scheduled', 4, 90]
    ];

    for (const apt of initialApts) {
      insertApt.run(...apt);
    }
  }

  // 21. Seed Pending Inpatient Admissions
  const admCount = db.prepare('SELECT COUNT(*) as count FROM admissions').get().count;
  if (admCount === 0) {
    const insertAdm = db.prepare(`
      INSERT INTO admissions (
        id, patient_id, hospital_id, ward, bed_id, doctor_id, admission_date,
        discharge_date, status, initial_diagnosis, triage_priority, admitted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialAdms = [
      ['ADM-401', 'PT-ADM-91', 'hosp-chn-01', 'ICU Block A', null, 'doc-01', '2026-11-27 10:00:00', null, 'Pending', 'Unstable Angina with refractory chest pain (Murugesan K., 62yo M)', 'Red (STAT)', 'Triage Nurse Deepa R.'],
      ['ADM-402', 'PT-ADM-92', 'hosp-chn-01', 'Respiratory HDU', null, 'doc-02', '2026-11-27 10:15:00', null, 'Pending', 'Severe Exacerbation of COPD (Jayanthi S., 48yo F)', 'Orange (Urgent)', 'Triage Nurse Priya M.'],
      ['ADM-403', 'PT-ADM-93', 'hosp-chn-01', 'Nephrology Ward 3', null, 'doc-01', '2026-11-27 10:30:00', null, 'Pending', 'Acute Pyelonephritis with Urosepsis (Venkatesh Rao, 71yo M)', 'Yellow (Standard)', 'ER Triage Officer']
    ];

    for (const adm of initialAdms) {
      insertAdm.run(...adm);
    }
  }

  // 22. Seed Patient Transfers
  const trfCount = db.prepare('SELECT COUNT(*) as count FROM patient_transfers').get().count;
  if (trfCount === 0) {
    const insertTrf = db.prepare(`
      INSERT INTO patient_transfers (
        id, patient_id, hospital_id, from_ward, to_ward, from_bed_id, to_bed_id,
        reason, requested_by, approved_by, status, transfer_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialTrfs = [
      [
        'TRF-101', 'PT-8941', 'hosp-chn-01', 'ICU Block A', 'HDU Ward 2', 'ICU-04', null,
        'Hemodynamically stable post-PCI; step-down indicated for telemetry monitoring',
        'Dr. Sundaramoorthy M.', null, 'Requested', '2026-11-27'
      ],
      [
        'TRF-102', 'PT-8945', 'hosp-chn-01', 'HDU Ward 2', 'Ward 3', 'HDU-07', null,
        'Respiratory mechanics improved on room air; transfer to general medical ward',
        'Dr. Meenakshi S.', null, 'Requested', '2026-11-27'
      ]
    ];

    for (const trf of initialTrfs) {
      insertTrf.run(...trf);
    }
  }

  // 23. Seed Interoperability Connections
  const connCount = db.prepare('SELECT COUNT(*) as count FROM interoperability_systems').get().count;
  if (connCount === 0) {
    const insertConn = db.prepare(`
      INSERT INTO interoperability_systems (
        id, hospital_id, name, system_identifier, system_type, connection_status,
        is_simulated, endpoint_url, auth_type, auth_credentials_masked, last_sync_time,
        total_records, success_rate, error_status, supported_resources, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialConns = [
      [
        'conn-abdm-01', 'hosp-chn-01', 'National Health Exchange (ABDM Gateway)',
        'IN-ABDM-SBX-CHN-91', 'ABDM_M1_M2', 'Configured_Sandbox', 1,
        'https://dev.abdm.gov.in/gateway/v0.5', 'ABDM_Gateway_Token',
        'sbx_abdm_••••••••••••••••3a9f', '2 mins ago', 1428, 98.7, null,
        JSON.stringify(['Patient', 'Encounter', 'DiagnosticReport', 'CarePlan', 'Prescription']),
        'National Digital Health Mission sandbox profile. Milestone 1 and Milestone 2 consent-driven health data exchange.'
      ],
      [
        'conn-apollo-02', 'hosp-chn-01', 'Apollo Integrated Health Network',
        'HL7-FHIR-APOLLO-CHN', 'FHIR_R4', 'Connected', 1,
        'https://fhir.apollohealth-sandbox.in/r4', 'OAuth2',
        'oauth2_token_••••••••••••••••7b12', '14 mins ago', 3290, 99.2, null,
        JSON.stringify(['Patient', 'Practitioner', 'Condition', 'Observation', 'MedicationRequest', 'ServiceRequest']),
        'Inter-hospital emergency clinical transfers and specialist tele-consultation data pipe.'
      ],
      [
        'conn-mmc-lis-03', 'hosp-chn-01', 'State Central Diagnostic & LIS Exchange',
        'LIS-HL7-MMC-402', 'HL7_V2', 'Degraded', 1,
        'mllp://lis.tamilnaduhealth.gov.in:2575', 'Mutual_TLS',
        'mtls_cert_••••••••••••••••09ef', '38 mins ago', 894, 91.5,
        'Intermittent MLLP ACK timeout on batch Troponin reports',
        JSON.stringify(['Observation', 'DiagnosticReport']),
        'Automated bi-directional state reference laboratory sync for critical pathology & microbiology cultures.'
      ],
      [
        'conn-pacs-dicom-04', 'hosp-chn-01', 'Regional PACS & Diagnostic Imaging Hub',
        'DICOM-WADO-CHN-12', 'DICOM_WEB', 'Connected', 1,
        'https://pacs.medisync-sandbox.org/dicom-web', 'API_Key',
        'pacs_key_••••••••••••••••4d88', '1 hour ago', 450, 99.8, null,
        JSON.stringify(['DiagnosticReport', 'ServiceRequest']),
        'DICOMweb (WADO-RS / QIDO-RS) tele-radiology stream for CT Angiography and 12-lead ECG telemetry.'
      ]
    ];

    for (const c of initialConns) {
      insertConn.run(...c);
    }
  }

  // 24. Seed Health Data Exchanges
  const exCount = db.prepare('SELECT COUNT(*) as count FROM health_data_exchanges').get().count;
  if (exCount === 0) {
    const insertEx = db.prepare(`
      INSERT INTO health_data_exchanges (
        id, transaction_id, hospital_id, connection_id, system_name, resource_type,
        direction, record_count, status, patient_ref, patient_name, abha_id,
        payload_summary, error_details, retry_count, authorized_by, consent_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialExchanges = [
      [
        'tx-8001', 'TX-FHIR-20261127-01', 'hosp-chn-01', 'conn-abdm-01',
        'National Health Exchange (ABDM)', 'DiagnosticReport', 'OUTBOUND', 1,
        'SUCCESS', 'PT-8941', 'Murugesan K.', '91-4428-1902-8814',
        'STAT Cardiac Panel (Troponin-I, CPK-MB) shared under Consent Artefact #CNS-ABDM-204',
        null, 0, 'Dr. Sundaramoorthy M. (Attending Cardiologist)', 'CNS-ABDM-204'
      ],
      [
        'tx-8002', 'TX-FHIR-20261127-02', 'hosp-chn-01', 'conn-apollo-02',
        'Apollo Integrated Health Network', 'Patient', 'INBOUND', 1,
        'SUCCESS', 'PT-ADM-91', 'Kavitha R.', '91-3819-5501-4412',
        'Demographics and allergy profile intake for emergency coronary transfer candidate',
        null, 0, 'Triage Desk Nurse Deepa R.', null
      ],
      [
        'tx-8003', 'TX-FHIR-20261127-03', 'hosp-chn-01', 'conn-mmc-lis-03',
        'State Central Diagnostic & LIS Exchange', 'Observation', 'INBOUND', 4,
        'VALIDATION_ERROR', 'PT-8945', 'Anand Kumar', null,
        'ABG Panel blood gas results schema check failed: missing required coding system OID',
        'HL7 OBX-3 Identifier missing LOINC code (got local code "TN-ABG-01" without universal translation).',
        1, 'System Auto-Ingest', null
      ],
      [
        'tx-8004', 'TX-FHIR-20261127-04', 'hosp-chn-01', 'conn-abdm-01',
        'National Health Exchange (ABDM)', 'CarePlan', 'OUTBOUND', 1,
        'SUCCESS', 'PT-8941', 'Murugesan K.', '91-4428-1902-8814',
        'Acute Coronary Protocol & Post-PCI Monitoring Plan exported to ABHA Personal Health Record (PHR)',
        null, 0, 'Dr. Sundaramoorthy M.', 'CNS-ABDM-204'
      ],
      [
        'tx-8005', 'TX-FHIR-20261127-05', 'hosp-chn-01', 'conn-apollo-02',
        'Apollo Integrated Health Network', 'MedicationRequest', 'OUTBOUND', 3,
        'SUCCESS', 'PT-8942', 'Dr. V. Natarajan', null,
        'Verified active anticoagulant and anti-arrhythmic regimen shared for cardiology consult',
        null, 0, 'Dr. Sundaramoorthy M.', null
      ],
      [
        'tx-8006', 'TX-FHIR-20261127-06', 'hosp-chn-01', 'conn-mmc-lis-03',
        'State Central Diagnostic & LIS Exchange', 'Observation', 'INBOUND', 2,
        'RETRYING', 'PT-8946', 'Jayanthi S.', null,
        'Blood culture antibiotic sensitivity panel awaiting re-transmission ACK',
        'Socket read timeout after 15000ms. Queued for scheduled exponential backoff retry #2.',
        2, 'System Auto-Ingest', null
      ]
    ];

    for (const ex of initialExchanges) {
      insertEx.run(...ex);
    }
  }

  // 25. Seed ABDM Consents
  const cnsCount = db.prepare('SELECT COUNT(*) as count FROM abdm_consents').get().count;
  if (cnsCount === 0) {
    const insertCns = db.prepare(`
      INSERT INTO abdm_consents (
        id, consent_id, hospital_id, patient_abha, patient_name, hip_id, hip_name,
        hiu_id, hiu_name, purpose, purpose_code, hi_types, date_from, date_to,
        consent_status, granted_at, expires_at, signature_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialConsents = [
      [
        'cns-01', 'CNS-ABDM-204', 'hosp-chn-01', '91-4428-1902-8814', 'Murugesan K.',
        'IN-TN-CHN-001', 'MediSync Chennai Medical Center', 'IN-APOLLO-04',
        'Apollo Institute of Cardiac Sciences', 'Care Management', 'CAREMGT',
        JSON.stringify(['DiagnosticReport', 'Prescription', 'DischargeSummary']),
        '2026-11-01', '2026-12-31', 'GRANTED', '2026-11-20 14:30:00',
        '2026-12-31 23:59:59', 'Cryptographically Verified (JWS)'
      ],
      [
        'cns-02', 'CNS-ABDM-205', 'hosp-chn-01', '91-3819-5501-4412', 'Kavitha R.',
        'IN-TN-CHN-001', 'MediSync Chennai Medical Center', 'IN-MMC-01',
        'Madras Medical College Health Network', 'Emergency Care', 'EMERGENCY',
        JSON.stringify(['OPConsultation', 'DiagnosticReport', 'Prescription']),
        '2026-11-26', '2026-11-30', 'GRANTED', '2026-11-26 19:15:00',
        '2026-11-30 23:59:59', 'Cryptographically Verified (JWS)'
      ],
      [
        'cns-03', 'CNS-ABDM-206', 'hosp-chn-01', '91-7712-9943-1280', 'Suresh Babu M.',
        'IN-TN-CHN-001', 'MediSync Chennai Medical Center', 'IN-TN-GOV-09',
        'Tamil Nadu Chief Minister Comprehensive Health Insurance', 'Diagnostic Consultation', 'DIAGNOSTIC',
        JSON.stringify(['DischargeSummary', 'DiagnosticReport']),
        '2026-11-15', '2026-11-22', 'EXPIRED', '2026-11-15 09:00:00',
        '2026-11-22 23:59:59', 'Cryptographically Verified (JWS)'
      ]
    ];

    for (const cns of initialConsents) {
      insertCns.run(...cns);
    }
  }

  // 26. Seed Inbound Patient Imports
  const impCount = db.prepare('SELECT COUNT(*) as count FROM inbound_patient_imports').get().count;
  if (impCount === 0) {
    const insertImp = db.prepare(`
      INSERT INTO inbound_patient_imports (
        import_id, hospital_id, source_system, imported_at, patient_data_json,
        validation_status, validation_errors_json, duplicate_status,
        duplicate_candidates_json, staged_status, reviewed_by, review_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialImports = [
      [
        'IMP-20261127-01', 'hosp-chn-01', 'Apollo Integrated Health Network (HL7-FHIR-APOLLO-CHN)',
        '2026-11-27 10:20:00',
        JSON.stringify({
          name: 'Murugesan K.',
          mrn: 'AP-MRN-99412',
          abhaNumber: '91-4428-1902-8814',
          abhaAddress: 'murugesan62@abdm',
          gender: 'male',
          birthDate: '1964-05-12',
          phone: '+91 98401 23456',
          bloodGroup: 'B+',
          address: 'No. 45, Anna Nagar West, Chennai, Tamil Nadu 600040',
          diagnosisSummary: 'Acute Anterior Wall STEMI s/p Primary PTCA to LAD with drug eluting stent',
          allergies: ['Penicillin (Anaphylactoid urticaria)', 'Aspirin (Mild dyspepsia)'],
          medications: ['Ticagrelor 90mg BID', 'Atorvastatin 80mg QHS', 'Ramipril 2.5mg OD'],
          vitals: { bloodPressure: '124/82 mmHg', heartRate: 78, spo2: 98, temperature: 36.9 }
        }),
        'VALID',
        JSON.stringify([]),
        'POTENTIAL_DUPLICATE',
        JSON.stringify([
          {
            existingPatientId: 'PT-8941',
            existingName: 'Murugesan K.',
            existingDob: '1964-05-12',
            existingGender: 'male',
            existingPhone: '+91 98401 23456',
            existingMrn: 'MRN-CHN-008941',
            matchScore: 96,
            matchReasons: [
              'Exact ABHA number match (91-4428-1902-8814)',
              'Exact phone match (+91 98401 23456)',
              'Exact Date of Birth match (1964-05-12)',
              'Identical full name spelling'
            ]
          }
        ]),
        'PENDING_REVIEW', null, null
      ],
      [
        'IMP-20261127-02', 'hosp-chn-01', 'National Health Exchange (ABDM Gateway)',
        '2026-11-27 10:35:00',
        JSON.stringify({
          name: 'Devaki Subramanian',
          mrn: 'NDHM-ABHA-5519',
          abhaNumber: '91-5582-7711-3094',
          abhaAddress: 'devaki_s@abdm',
          gender: 'female',
          birthDate: '1978-08-22',
          phone: '+91 94440 98712',
          bloodGroup: 'O+',
          address: 'Flat 3B, Temple View Apartments, Mylapore, Chennai 600004',
          diagnosisSummary: 'Type 2 Diabetes Mellitus with Diabetic Nephropathy Stage III',
          allergies: ['Sulfonamides'],
          medications: ['Metformin 500mg SR BID', 'Empagliflozin 10mg OD', 'Telmisartan 40mg OD'],
          vitals: { bloodPressure: '138/88 mmHg', heartRate: 74, spo2: 99, temperature: 36.7 }
        }),
        'VALID',
        JSON.stringify([]),
        'CLEAN',
        JSON.stringify([]),
        'PENDING_REVIEW', null, null
      ],
      [
        'IMP-20261127-03', 'hosp-chn-01', 'State Central Diagnostic & LIS Exchange',
        '2026-11-27 09:40:00',
        JSON.stringify({
          name: 'Unknown Male (Trauma Triage)',
          mrn: 'ER-TMP-004',
          gender: 'male',
          birthDate: '1990-01-01',
          phone: '',
          address: 'Brought in by 108 Ambulance from Guindy Flyover accident',
          diagnosisSummary: 'Polytrauma, blunt chest injury, pelvic fracture',
          allergies: [],
          medications: [],
          vitals: { bloodPressure: '88/54 mmHg', heartRate: 122, spo2: 92, temperature: 36.2 }
        }),
        'WARNING',
        JSON.stringify([
          'Missing phone number',
          'Missing ABHA identifier (unverified emergency intake)',
          'Estimated birth date used'
        ]),
        'CLEAN',
        JSON.stringify([]),
        'PENDING_REVIEW', null, null
      ]
    ];

    for (const imp of initialImports) {
      insertImp.run(...imp);
    }
  }

  // 29. Seed Hospital Resources & Medical Supplies
  const resTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='hospital_resources'").get();
  if (resTableExists) {
    const resCount = db.prepare('SELECT COUNT(*) as count FROM hospital_resources').get().count;
    if (resCount === 0) {
      const insertRes = db.prepare(`
        INSERT INTO hospital_resources (
          id, resource_id, hospital_id, name, category, department,
          quantity, available_quantity, minimum_threshold, unit,
          status, location, responsible_staff, expiry_date, description, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const initialResData = [
        ['res-01', 'RES-EQP-101', 'hosp-chn-01', 'Mechanical Ventilator (Dräger Evita V500)', 'Medical Equipment', 'ICU Complex', 14, 10, 3, 'Units', 'Partially Available', 'ICU Block A Bay 3', 'Dr. Sundaramoorthy M.', '2029-12-31', 'High-end invasive & non-invasive ventilator with integrated lung protective telemetry.', 'Today, 11:15 AM'],
        ['res-02', 'RES-EQP-102', 'hosp-chn-01', 'Multipara Vital Signs Monitor (Philips IntelliVue MX750)', 'Medical Equipment', 'Emergency', 28, 22, 5, 'Units', 'Partially Available', 'Triage Bay 1-4', 'Nurse Rajeshwari K.', '2028-06-30', '15-inch bedside touch monitor tracking ECG, SpO2, NIBP, temperature, and EtCO2.', 'Today, 10:45 AM'],
        ['res-03', 'RES-EQP-103', 'hosp-chn-01', 'Biphasic Defibrillator with External Pacing (Zoll R Series)', 'Medical Equipment', 'Cardiology', 8, 6, 2, 'Units', 'Partially Available', 'Cath Lab & Step-down', 'Dr. Sundaramoorthy M.', '2028-10-15', 'Code-ready clinical defibrillator with CPR feedback sensor and pediatric paddle set.', 'Today, 09:30 AM'],
        ['res-04', 'RES-EQP-104', 'hosp-chn-01', 'Mobile Digital Radiography X-Ray Unit (Siemens Mobilett)', 'Medical Equipment', 'Emergency', 3, 1, 1, 'Units', 'Partially Available', 'Radiology Depot', 'Dr. Alex Rivera', '2030-01-01', 'Cordless motorized mobile digital X-Ray system for bedside and trauma imaging.', 'Today, 08:50 AM'],
        ['res-05', 'RES-EQP-105', 'hosp-chn-01', 'Volumetric Infusion Syringe Pump (Fresenius Kabi Injectomat)', 'Medical Equipment', 'ICU Complex', 45, 38, 10, 'Units', 'Partially Available', 'ICU Central Store', 'Nurse Deepa R.', '2028-04-12', 'Micro-dose precision infusion syringe pump for vasoactive and sedative infusions.', 'Today, 11:00 AM'],
        ['res-06', 'RES-EQP-106', 'hosp-chn-01', 'Hemodialysis Machine (Fresenius 4008S Classic)', 'Medical Equipment', 'Cardiology', 6, 0, 1, 'Units', 'In Use', 'Nephrology Suite', 'Dr. Vasanth Kumar', '2029-05-20', 'Dialysis unit with automated volumetric ultrafiltration and bicarbonate dialysis.', 'Today, 07:45 AM'],
        ['res-07', 'RES-EQP-107', 'hosp-chn-01', 'Anesthesia Workstation (Mindray A7)', 'Medical Equipment', 'Bio-Medical Unit', 5, 0, 1, 'Units', 'Under Maintenance', 'OT Biomedical Workshop', 'Lead Biomed Tech', '2027-11-30', 'Integrated digital gas mixer with electronic vaporizer and agent monitoring.', 'Today, 06:30 AM'],
        ['res-08', 'RES-EMG-201', 'hosp-chn-01', 'Rapid Fluid Infusion Trauma Resuscitation Kits', 'Emergency Supplies', 'Emergency', 25, 18, 5, 'Kits', 'Partially Available', 'Trauma Bay Red Zone', 'Nurse Rajeshwari K.', '2027-08-31', 'High-flow pressure infusion sleeves, macro-bore tubing, and rapid blood warming line.', 'Today, 10:20 AM'],
        ['res-09', 'RES-EMG-202', 'hosp-chn-01', 'Medical Grade Oxygen Cylinders (D-Type 47 Liters)', 'Emergency Supplies', 'General Ward', 60, 48, 15, 'Cylinders', 'Available', 'Central Gas Depot', 'Biomedical Ops', '2031-12-31', 'Pressurized O2 cylinders with regulator, pin-index safety system, and flowmeter.', 'Today, 09:15 AM'],
        ['res-10', 'RES-EMG-203', 'hosp-chn-01', 'Emergency Surgical Cricothyrotomy & Airway Sets', 'Emergency Supplies', 'Emergency', 15, 12, 4, 'Kits', 'Available', 'Crash Cart Top Tray', 'Dr. Alex Rivera', '2027-09-15', 'Single-use sterile rapid airway access cannula with dilator and 6.0mm cuffed tube.', 'Today, 10:10 AM'],
        ['res-11', 'RES-EMG-204', 'hosp-chn-01', 'Automated External Defibrillator (AED) Adult Pads', 'Emergency Supplies', 'Emergency', 20, 0, 5, 'Pairs', 'Out of Stock', 'Emergency Supply Closet', 'Nurse Deepa R.', '2026-10-31', 'Pre-gelled disposable defibrillation electrode pads for public access AED units.', 'Today, 08:00 AM'],
        ['res-12', 'RES-ICU-301', 'hosp-chn-01', 'Arterial Blood Gas (ABG) Sensor Cartridges', 'ICU Resources', 'ICU Complex', 50, 35, 10, 'Cartridges', 'Partially Available', 'ICU Point-of-Care Lab', 'Nurse Deepa R.', '2027-03-31', 'Point-of-care ABG cartridges analyzing pH, pCO2, pO2, electrolytes, and lactate.', 'Today, 11:05 AM'],
        ['res-13', 'RES-ICU-302', 'hosp-chn-01', 'Triple-Lumen Central Venous Catheter (CVC) Trays', 'ICU Resources', 'ICU Complex', 30, 24, 6, 'Trays', 'Available', 'ICU Sterile Supply Rm', 'Dr. Sundaramoorthy M.', '2027-12-31', '7 French 20cm antimicrobial polyurethane central line insertion kit with Seldinger wire.', 'Today, 10:35 AM'],
        ['res-14', 'RES-ICU-303', 'hosp-chn-01', 'Intra-Aortic Balloon Pump (IABP) Catheters (8 Fr 40cc)', 'ICU Resources', 'Cardiology', 10, 7, 2, 'Units', 'Partially Available', 'Cath Lab Sterile Room', 'Dr. Sundaramoorthy M.', '2028-02-28', 'Percutaneous counterpulsation balloon catheter for cardiogenic shock support.', 'Today, 09:40 AM'],
        ['res-15', 'RES-ICU-304', 'hosp-chn-01', 'Continuous Renal Replacement Therapy (CRRT) Tubing Sets', 'ICU Resources', 'ICU Complex', 8, 5, 2, 'Sets', 'Partially Available', 'Dialysis Storage Shelf', 'Nurse Priya M.', '2027-06-30', 'Pre-assembled extracorporeal hemofiltration circuit with AN69 membrane.', 'Today, 08:30 AM'],
        ['res-16', 'RES-GEN-401', 'hosp-chn-01', 'Hospital Grade Terminal Disinfectant Solution (5L Canister)', 'General Hospital Supplies', 'Central Pharmacy', 80, 65, 15, 'Canisters', 'Available', 'Housekeeping Depot', 'Housekeeping Lead', '2028-11-30', 'EPA-registered broad-spectrum virucidal and sporicidal sanitizing solution.', 'Today, 07:15 AM'],
        ['res-17', 'RES-GEN-402', 'hosp-chn-01', 'Sterile Surgical Gloves & Clinical PPE Bundles', 'General Hospital Supplies', 'Central Pharmacy', 120, 95, 25, 'Boxes', 'Available', 'Central Pharmacy Shelf A', 'Store Pharmacist', '2028-09-30', 'Powder-free latex-free surgical gloves and Level-3 fluid-resistant barrier gowns.', 'Today, 09:00 AM'],
        ['res-18', 'RES-GEN-403', 'hosp-chn-01', 'Disposable Closed Suction Catheters (14 Fr)', 'General Hospital Supplies', 'General Ward', 150, 110, 30, 'Units', 'Available', 'Ward 4 Clean Utility', 'Nurse Revathi S.', '2028-05-31', '24-hour closed tracheostomy suction system with viral isolation filter sleeve.', 'Today, 10:00 AM'],
        ['res-19', 'RES-PCR-501', 'hosp-chn-01', 'Powered Alternating Pressure Air Mattress (Anti-Decubitus)', 'Patient Care Resources', 'General Ward', 20, 15, 3, 'Units', 'Partially Available', 'General Ward Storage', 'Nurse Rajeshwari K.', '2030-01-01', 'Medical mattress overlay system preventing Stage 1-4 pressure ulcer formation.', 'Today, 10:50 AM'],
        ['res-20', 'RES-PCR-502', 'hosp-chn-01', 'LED Overhead Neonatal Phototherapy System', 'Patient Care Resources', 'Pediatrics', 6, 4, 1, 'Units', 'Partially Available', 'NICU Bay 2', 'Dr. K. Annamalai', '2029-07-31', 'High-intensity blue LED phototherapy unit for neonatal hyperbilirubinemia.', 'Today, 09:25 AM'],
        ['res-21', 'RES-PCR-503', 'hosp-chn-01', 'Heavy-Duty Bariatric Patient Transport Wheelchair', 'Patient Care Resources', 'Emergency', 18, 12, 3, 'Units', 'Partially Available', 'ER Ambulance Bay', 'Patient Transport Lead', '2031-01-01', 'Reinforced steel frame transport wheelchair with swing-away elevating footrests.', 'Today, 08:15 AM']
      ];

      for (const r of initialResData) {
        insertRes.run(...r);
      }
    }
  }

  console.log('Database initialization & seeding complete.');
}
