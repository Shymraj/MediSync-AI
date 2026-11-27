import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'medisync.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

    -- 4. Hospital Wards & Beds
    CREATE TABLE IF NOT EXISTS hospital_beds (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      ward TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('occupied', 'discharged', 'cleaning', 'equipment_check', 'nurse_confirmation', 'ready', 'reserved')),
      patient_name TEXT,
      patient_id TEXT,
      assigned_nurse TEXT,
      last_updated TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 5. Hospital Equipment
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      ward TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Available', 'In Use', 'Under Maintenance', 'Needs Check')),
      last_inspection TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 6. Resource Requests
    CREATE TABLE IF NOT EXISTS resource_requests (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_role TEXT NOT NULL,
      department TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      urgency TEXT CHECK(urgency IN ('Routine', 'Urgent', 'Critical')) NOT NULL,
      reason TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'allocated', 'rejected', 'fulfilled')) DEFAULT 'pending',
      created_at TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT,
      allocated_resource_id TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 7. Patient Appointments & OPD Queue
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
      status TEXT CHECK(status IN ('Scheduled', 'In Queue', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
      queue_position INTEGER,
      estimated_wait_minutes INTEGER,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 8. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      target_role TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('info', 'success', 'warning', 'critical')) NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    -- 9. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const districtCount = db.prepare('SELECT COUNT(*) as count FROM districts').get().count;
  if (districtCount > 0) return;

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

  // 2. Hospitals
  const insertHospital = db.prepare(`
    INSERT INTO hospitals (
      id, district_id, district_name, name, type, location, available_departments,
      status, total_beds, occupied_beds, ready_beds, prep_beds, icu_available,
      ventilators_available, phone, emergency_contact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hospitals = [
    [
      'hosp-chn-01',
      'chennai',
      'Chennai',
      'Rajiv Gandhi Government General Hospital (RGGGH)',
      'Apex Super Specialty',
      'EVR Periyar Salai, Park Town, Chennai',
      JSON.stringify(['Critical Care', 'Cardiology', 'Neurology', 'Pulmonology', 'Trauma & Emergency', 'Nephrology', 'Pediatrics']),
      'Operational',
      520, 410, 82, 28, 18, 12,
      '+91 44 2530 5000', '044-25305112'
    ],
    [
      'hosp-chn-02',
      'chennai',
      'Chennai',
      'Government Kilpauk Medical College Hospital',
      'Government Medical College Hospital',
      'Poonamallee High Road, Kilpauk, Chennai',
      JSON.stringify(['Burns & Plastic Surgery', 'Critical Care', 'General Medicine', 'Orthopedics', 'Emergency Care']),
      'High Capacity',
      340, 285, 42, 13, 9, 7,
      '+91 44 2836 4951', '044-28364955'
    ],
    [
      'hosp-chn-03',
      'chennai',
      'Chennai',
      'Government Stanley Medical College Hospital',
      'Government Medical College Hospital',
      'Old Jail Road, Royapuram, Chennai',
      JSON.stringify(['Gastroenterology', 'Trauma Care', 'Cardiology', 'Pediatrics', 'Critical Care']),
      'Operational',
      460, 375, 63, 22, 14, 9,
      '+91 44 2528 0900', '044-25280905'
    ],
    [
      'hosp-cbe-01',
      'coimbatore',
      'Coimbatore',
      'Coimbatore Medical College Hospital (CMCH)',
      'Government Medical College Hospital',
      'Trichy Road, Coimbatore',
      JSON.stringify(['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pulmonology', 'Critical Care']),
      'Operational',
      380, 295, 62, 23, 15, 11,
      '+91 422 230 1393', '0422-2301399'
    ],
    [
      'hosp-mdu-01',
      'madurai',
      'Madurai',
      'Government Rajaji Hospital (GRH)',
      'Apex Super Specialty',
      'Panagal Road, Alwarpuram, Madurai',
      JSON.stringify(['Trauma Center', 'Cardiology', 'Neurosurgery', 'Pediatrics', 'Critical Care']),
      'Operational',
      440, 360, 58, 22, 16, 10,
      '+91 452 253 2535', '0452-2532540'
    ]
  ];

  for (const h of hospitals) {
    insertHospital.run(...h);
  }

  // 3. Beds
  const insertBed = db.prepare(`
    INSERT INTO hospital_beds (
      id, hospital_id, ward, bed_number, type, status, patient_name, patient_id, assigned_nurse, last_updated, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const beds = [
    ['bed-101', 'hosp-chn-01', 'ICU Block A', 'ICU-04', 'ICU', 'occupied', 'Kavitha Ramasamy', 'PT-8941', 'Nurse Deepa', '10 mins ago', 'Post-op respiratory monitoring in progress'],
    ['bed-102', 'hosp-chn-01', 'ICU Block A', 'ICU-05', 'ICU', 'discharged', null, null, 'Nurse Priya', '25 mins ago', 'Patient shifted to step-down ward. Pending cleaning.'],
    ['bed-103', 'hosp-chn-01', 'ICU Block A', 'ICU-06', 'ICU', 'cleaning', null, null, 'Nurse Priya', '15 mins ago', 'Sanitization and terminal cleaning underway'],
    ['bed-104', 'hosp-chn-01', 'ICU Block B', 'ICU-12', 'ICU', 'equipment_check', null, null, 'Nurse Anitha', '8 mins ago', 'Cardiac monitor calibration in progress'],
    ['bed-105', 'hosp-chn-01', 'ICU Block B', 'ICU-15', 'ICU', 'nurse_confirmation', null, null, 'Nurse Deepa', '4 mins ago', 'Linens ready, ventilator calibrated, awaiting nurse sign-off'],
    ['bed-106', 'hosp-chn-01', 'ICU Block B', 'ICU-18', 'ICU', 'ready', null, null, 'Nurse Deepa', 'Just now', 'Operationally ready for immediate emergency admission'],
    ['bed-107', 'hosp-chn-01', 'Emergency Ward', 'EMR-02', 'Emergency', 'occupied', 'Murugan Selvam', 'PT-8942', 'Nurse Rajeshwari', '12 mins ago', 'Acute chest pain evaluation'],
    ['bed-108', 'hosp-chn-01', 'Emergency Ward', 'EMR-03', 'Emergency', 'ready', null, null, 'Nurse Rajeshwari', '20 mins ago', 'Sterilized and ready with oxygen supply'],
    ['bed-109', 'hosp-chn-01', 'HDU Ward 2', 'HDU-07', 'HDU', 'occupied', 'Subramanian V', 'PT-8945', 'Nurse Priya', '35 mins ago', 'High dependency respiratory support'],
    ['bed-110', 'hosp-chn-01', 'HDU Ward 2', 'HDU-08', 'HDU', 'nurse_confirmation', null, null, 'Nurse Priya', '5 mins ago', 'Oxygen flow checked; nurse sign-off required']
  ];

  for (const b of beds) {
    insertBed.run(...b);
  }

  // 4. Equipment
  const insertEquipment = db.prepare(`
    INSERT INTO equipment (
      id, hospital_id, name, category, ward, status, last_inspection, serial_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const eqList = [
    ['eq-01', 'hosp-chn-01', 'Hamilton-C6 Mechanical Ventilator', 'Ventilator', 'ICU Block A', 'Available', 'Today, 08:30 AM', 'HAM-C6-99214'],
    ['eq-02', 'hosp-chn-01', 'Mindray SV300 Invasive Ventilator', 'Ventilator', 'Emergency Ward', 'In Use', 'Yesterday, 14:00 PM', 'MDR-SV-10492'],
    ['eq-03', 'hosp-chn-01', 'Philips HeartStart XL+ Defibrillator', 'Defibrillator', 'Trauma & Emergency', 'Available', 'Today, 07:15 AM', 'PHL-HS-48192'],
    ['eq-04', 'hosp-chn-01', 'B. Braun Space Infusion Pump System', 'Infusion Pump', 'ICU Block B', 'Available', 'Today, 09:10 AM', 'BBR-SP-77123'],
    ['eq-05', 'hosp-chn-01', 'GE Healthcare Carescape B650 Monitor', 'Cardiac Monitor', 'ICU Block B', 'Needs Check', '2 days ago', 'GEH-CS-33819']
  ];

  for (const e of eqList) {
    insertEquipment.run(...e);
  }

  // 5. Initial Resource Requests
  const insertRequest = db.prepare(`
    INSERT INTO resource_requests (
      id, hospital_id, requester_id, requester_name, requester_role, department,
      resource_type, quantity, urgency, reason, status, created_at, patient_id, patient_name,
      allocated_resource_id, reviewed_by, reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const requests = [
    [
      'req-201', 'hosp-chn-01', 'doc-sundar', 'Dr. Sundaramoorthy M.', 'doctor',
      'Critical Care / Cardiology', 'ICU Bed', 1, 'Critical',
      'Acute myocardial infarction requiring urgent hemodynamic and telemetry monitoring',
      'pending', '12 mins ago', 'PT-8946', 'Ramesh Balan', null, null, null
    ],
    [
      'req-202', 'hosp-chn-01', 'doc-meena', 'Dr. Meenakshi S.', 'doctor',
      'Pulmonology', 'Ventilator', 1, 'Urgent',
      'Severe COPD exacerbation with impending respiratory muscle exhaustion',
      'allocated', '45 mins ago', 'PT-8947', 'Govindasamy N.', 'eq-01', 'Admin Dr. Vasanth', '30 mins ago'
    ]
  ];

  for (const r of requests) {
    insertRequest.run(...r);
  }

  // 6. Patient Appointments
  const insertApt = db.prepare(`
    INSERT INTO patient_appointments (
      id, patient_id, patient_name, hospital_id, hospital_name, department,
      doctor_name, date, time, token_number, status, queue_position, estimated_wait_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApt.run(
    'apt-501', 'usr-patient-demo', 'Karthik Subramanian', 'hosp-chn-01',
    'Rajiv Gandhi Government General Hospital (RGGGH)', 'Cardiology OPD',
    'Dr. Sundaramoorthy M.', '2026-11-28', '10:30 AM', 14, 'In Queue', 3, 25
  );

  // 7. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, hospital_id, title, message, type, timestamp, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run('notif-1', 'hosp-chn-01', 'Critical Resource Request', 'Dr. Sundaramoorthy requested 1 ICU Bed for Patient PT-8946', 'critical', '12 mins ago', 0);
  insertNotif.run('notif-2', 'hosp-chn-01', 'Bed Ready for Admission', 'Bed ICU-18 confirmed ready by Nurse Deepa in ICU Block B', 'success', '18 mins ago', 0);

  // 8. Seed Default Approved Accounts for Instant Demo Login
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

  console.log('Database initialization & seeding complete.');
}
