// Centralized Demo Data for MediSync AI Staff Verification Module
// Synthetic demo records for professional credential verification and role access governance.
// Note: All records, registration numbers, and credentials are simulated demo data.

export type StaffRole = 'Doctor' | 'Nurse' | 'Hospital Administrator' | 'Other Hospital Staff';

export type StaffVerificationStatus = 
  | 'Pending' 
  | 'Verified' 
  | 'Rejected' 
  | 'Requires Additional Information';

export interface StaffAuditEntry {
  id: string;
  timestamp: string;
  action: 'Submitted' | 'Verified' | 'Rejected' | 'Requested Info' | 'Updated';
  actor: string;
  notes: string;
}

export interface StaffSubmittedDocument {
  id: string;
  title: string;
  documentType: 'Medical Council License' | 'Nursing Registration' | 'Institutional Identity' | 'Postgraduate Degree' | 'Government Photo ID';
  referenceNumber: string;
  issueDate: string;
  status: 'Attached' | 'Verified' | 'Resubmission Required';
}

export interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  requestedRole: StaffRole;
  department: string;
  specialization: string;
  registrationNumber: string; // e.g. Medical Council Number or Nursing Registration Number
  licensingAuthority: string;
  submittedDate: string;
  verificationStatus: StaffVerificationStatus;
  rejectionReason?: string;
  additionalInfoRequired?: string;
  hospitalName: string;
  district: string;
  documents: StaffSubmittedDocument[];
  auditHistory: StaffAuditEntry[];
}

export const INITIAL_STAFF: StaffMember[] = [
  // 1. DOCTORS (Pending & Verified)
  {
    id: 'stf-01',
    staffId: 'STF-DOC-101',
    name: 'Dr. Sundaramoorthy M.',
    email: 'dr.sundar@medisync.gov.in',
    phone: '+91 94440 12345',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'General Medicine',
    specialization: 'Internal Medicine & Critical Stabilization',
    registrationNumber: 'TMC-2012-78421',
    licensingAuthority: 'Tamil Nadu Medical Council (TNMC)',
    submittedDate: '2026-11-20',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-1', title: 'TNMC Medical Registration Certificate', documentType: 'Medical Council License', referenceNumber: 'TMC-2012-78421', issueDate: '2012-06-15', status: 'Verified' },
      { id: 'doc-2', title: 'MD Internal Medicine Postgrad Degree', documentType: 'Postgraduate Degree', referenceNumber: 'MGR-MD-2016-410', issueDate: '2016-04-10', status: 'Verified' },
      { id: 'doc-3', title: 'Institutional Faculty ID', documentType: 'Institutional Identity', referenceNumber: 'RGGGH-FAC-084', issueDate: '2024-01-01', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-1', timestamp: '2026-11-20, 09:30 AM', action: 'Submitted', actor: 'Dr. Sundaramoorthy M.', notes: 'Submitted medical credentials for senior physician clearance.' },
      { id: 'aud-2', timestamp: '2026-11-21, 11:15 AM', action: 'Verified', actor: 'Hospital Admin Command', notes: 'TNMC council credentials verified against institutional faculty registry.' }
    ]
  },
  {
    id: 'stf-02',
    staffId: 'STF-DOC-102',
    name: 'Dr. Radhakrishnan K.',
    email: 'dr.radhakrishnan@rgggh.edu.in',
    phone: '+91 98841 87654',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'Intensive Care Unit (ICU)',
    specialization: 'Critical Care Medicine & Anesthesia',
    registrationNumber: 'TMC-2010-44912',
    licensingAuthority: 'Tamil Nadu Medical Council (TNMC)',
    submittedDate: '2026-11-22',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-4', title: 'TNMC Specialist Registration', documentType: 'Medical Council License', referenceNumber: 'TMC-2010-44912', issueDate: '2010-08-20', status: 'Verified' },
      { id: 'doc-5', title: 'DM Critical Care Fellowship', documentType: 'Postgraduate Degree', referenceNumber: 'NBE-DM-2015-102', issueDate: '2015-11-12', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-3', timestamp: '2026-11-22, 10:00 AM', action: 'Submitted', actor: 'Dr. Radhakrishnan K.', notes: 'Application for ICU Critical Care Lead clearance.' },
      { id: 'aud-4', timestamp: '2026-11-22, 02:45 PM', action: 'Verified', actor: 'Chief Medical Superintendent', notes: 'Credentials approved for Tier-1 ICU command privileges.' }
    ]
  },
  {
    id: 'stf-03',
    staffId: 'STF-DOC-103',
    name: 'Dr. Sarah Mitchell',
    email: 's.mitchell.cardio@medisync.net',
    phone: '+91 97910 33445',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-9807573f5ff2?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'Cardiology',
    specialization: 'Interventional Cardiology',
    registrationNumber: 'NMC-IN-2019-91823',
    licensingAuthority: 'National Medical Commission (NMC)',
    submittedDate: '2026-11-26',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-6', title: 'National Medical Council License', documentType: 'Medical Council License', referenceNumber: 'NMC-IN-2019-91823', issueDate: '2019-03-14', status: 'Attached' },
      { id: 'doc-7', title: 'Cath Lab Fellowship Credential', documentType: 'Postgraduate Degree', referenceNumber: 'FSCAI-2022-771', issueDate: '2022-09-01', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-5', timestamp: 'Yesterday, 03:15 PM', action: 'Submitted', actor: 'Dr. Sarah Mitchell', notes: 'Submitted clinical transfer application from inter-state teaching institute.' }
    ]
  },
  {
    id: 'stf-04',
    staffId: 'STF-DOC-104',
    name: 'Dr. Alex Rivera',
    email: 'alex.rivera.trauma@emergency.gov.in',
    phone: '+91 98402 77881',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'Emergency',
    specialization: 'Emergency Medicine & Resuscitation',
    registrationNumber: 'TMC-2021-39901',
    licensingAuthority: 'Tamil Nadu Medical Council (TNMC)',
    submittedDate: 'Today',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-8', title: 'TNMC Provisional Registration', documentType: 'Medical Council License', referenceNumber: 'TMC-2021-39901', issueDate: '2021-07-22', status: 'Attached' },
      { id: 'doc-9', title: 'ATLS / ACLS Advanced Trauma Instructor Card', documentType: 'Postgraduate Degree', referenceNumber: 'AHA-ATLS-2024-88', issueDate: '2024-02-18', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-6', timestamp: 'Today, 08:45 AM', action: 'Submitted', actor: 'Dr. Alex Rivera', notes: 'Emergency department triage physician registration submitted.' }
    ]
  },
  {
    id: 'stf-05',
    staffId: 'STF-DOC-105',
    name: 'Dr. Vikramaditya Joshi',
    email: 'v.joshi.ortho@apollohosp.org',
    phone: '+91 94451 90901',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'Orthopedics',
    specialization: 'Joint Replacement & Arthroscopy',
    registrationNumber: 'MMC-2015-81203',
    licensingAuthority: 'Maharashtra Medical Council (MMC Transfer Pending)',
    submittedDate: '2026-11-24',
    verificationStatus: 'Requires Additional Information',
    additionalInfoRequired: 'State medical council reciprocal NOC and verified certificate of good standing required from MMC before credentialing.',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-10', title: 'MMC State License Copy', documentType: 'Medical Council License', referenceNumber: 'MMC-2015-81203', issueDate: '2015-05-10', status: 'Resubmission Required' },
      { id: 'doc-11', title: 'MS Orthopedics Degree', documentType: 'Postgraduate Degree', referenceNumber: 'MUHS-MS-2019-214', issueDate: '2019-06-30', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-7', timestamp: '2026-11-24, 11:00 AM', action: 'Submitted', actor: 'Dr. Vikramaditya Joshi', notes: 'Applied for visiting orthopedic consultant privileges.' },
      { id: 'aud-8', timestamp: '2026-11-25, 04:20 PM', action: 'Requested Info', actor: 'Hospital Admin Command', notes: 'Requested reciprocal TNMC registration certificate.' }
    ]
  },
  {
    id: 'stf-06',
    staffId: 'STF-DOC-106',
    name: 'Dr. Kevin Sterling',
    email: 'ksterling.clinical@fakehealthmail.com',
    phone: '+91 98840 00112',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Doctor',
    department: 'Surgery',
    specialization: 'General Surgery',
    registrationNumber: 'INVALID-REG-000',
    licensingAuthority: 'Unrecognized Licensing Board',
    submittedDate: '2026-11-18',
    verificationStatus: 'Rejected',
    rejectionReason: 'Registration number not found in statutory National Medical Commission registry. Verification failed on security audit.',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-12', title: 'Submitted Certificate Copy', documentType: 'Medical Council License', referenceNumber: 'INVALID-REG-000', issueDate: '2023-01-01', status: 'Resubmission Required' }
    ],
    auditHistory: [
      { id: 'aud-9', timestamp: '2026-11-18, 02:00 PM', action: 'Submitted', actor: 'Applicant', notes: 'Submitted unverified digital diploma.' },
      { id: 'aud-10', timestamp: '2026-11-19, 10:30 AM', action: 'Rejected', actor: 'Hospital Security & Credential Board', notes: 'Verification failed against NMC master council database.' }
    ]
  },

  // 2. NURSES (Pending, Verified, Additional Info)
  {
    id: 'stf-07',
    staffId: 'STF-NUR-201',
    name: 'Nurse In-Charge Priya S.',
    email: 'priya.nurse@rgggh.gov.in',
    phone: '+91 98401 55667',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Nurse',
    department: 'Emergency',
    specialization: 'Trauma Triage & Acute Resuscitation',
    registrationNumber: 'TNC-RN-2018-91024',
    licensingAuthority: 'Tamil Nadu Nurses and Midwives Council (TNC)',
    submittedDate: '2026-11-15',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-13', title: 'TNC Registered Nurse & Midwife Certificate', documentType: 'Nursing Registration', referenceNumber: 'TNC-RN-2018-91024', issueDate: '2018-04-12', status: 'Verified' },
      { id: 'doc-14', title: 'B.Sc Nursing Degree', documentType: 'Postgraduate Degree', referenceNumber: 'DRMGR-BSCN-2018', issueDate: '2018-05-18', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-11', timestamp: '2026-11-15, 08:30 AM', action: 'Submitted', actor: 'Nurse In-Charge Priya S.', notes: 'Submitted shift supervisor credentialing.' },
      { id: 'aud-12', timestamp: '2026-11-16, 03:00 PM', action: 'Verified', actor: 'Nursing Superintendent Office', notes: 'Confirmed registered nurse license in good standing.' }
    ]
  },
  {
    id: 'stf-08',
    staffId: 'STF-NUR-202',
    name: 'Nurse Emily Vance',
    email: 'emily.vance.icu@medisync.net',
    phone: '+91 97909 44332',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Nurse',
    department: 'Intensive Care Unit (ICU)',
    specialization: 'Invasive Ventilation & Hemodynamic Monitoring',
    registrationNumber: 'TNC-RN-2019-33821',
    licensingAuthority: 'Tamil Nadu Nurses and Midwives Council (TNC)',
    submittedDate: '2026-11-25',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-15', title: 'Critical Care Nursing License', documentType: 'Nursing Registration', referenceNumber: 'TNC-RN-2019-33821', issueDate: '2019-09-20', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-13', timestamp: '2026-11-25, 09:15 AM', action: 'Submitted', actor: 'Nurse Emily Vance', notes: 'Applied for ICU Bed Turnaround & Telemetry workflow access.' },
      { id: 'aud-14', timestamp: '2026-11-25, 01:10 PM', action: 'Verified', actor: 'Hospital Admin Command', notes: 'Approved for ICU ward nurse dashboard privileges.' }
    ]
  },
  {
    id: 'stf-09',
    staffId: 'STF-NUR-203',
    name: 'Nurse Anita Roy',
    email: 'anita.roy.ccu@rgggh.edu.in',
    phone: '+91 98842 11990',
    avatarUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Nurse',
    department: 'Cardiology',
    specialization: 'Cardiac Step-Down & ECG Monitoring',
    registrationNumber: 'TNC-RN-2022-78119',
    licensingAuthority: 'Tamil Nadu Nurses and Midwives Council (TNC)',
    submittedDate: 'Today',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-16', title: 'Registered Nurse Council ID', documentType: 'Nursing Registration', referenceNumber: 'TNC-RN-2022-78119', issueDate: '2022-11-05', status: 'Attached' },
      { id: 'doc-17', title: 'Govt Aadhaar ID Copy', documentType: 'Government Photo ID', referenceNumber: 'XXXX-XXXX-9421', issueDate: '2020-01-10', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-15', timestamp: 'Today, 09:10 AM', action: 'Submitted', actor: 'Nurse Anita Roy', notes: 'Submitted shift rotation registration for cardiology step-down ward.' }
    ]
  },
  {
    id: 'stf-10',
    staffId: 'STF-NUR-204',
    name: 'Nurse Manimegalai T.',
    email: 'manimegalai.ortho@rgggh.gov.in',
    phone: '+91 94443 66778',
    avatarUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Nurse',
    department: 'Orthopedics',
    specialization: 'Musculoskeletal Rehabilitation',
    registrationNumber: 'TNC-RN-2017-55091',
    licensingAuthority: 'Tamil Nadu Nurses and Midwives Council (TNC)',
    submittedDate: '2026-11-23',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-18', title: 'Senior Staff Nurse Credential', documentType: 'Nursing Registration', referenceNumber: 'TNC-RN-2017-55091', issueDate: '2017-08-14', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-16', timestamp: '2026-11-23, 04:00 PM', action: 'Submitted', actor: 'Nurse Manimegalai T.', notes: 'Transferred from suburban district hospital.' }
    ]
  },

  // 3. HOSPITAL ADMINISTRATORS
  {
    id: 'stf-11',
    staffId: 'STF-ADM-301',
    name: 'Karthik Subramanian',
    email: 'karthik.admin@medisync.gov.in',
    phone: '+91 98410 99881',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Hospital Administrator',
    department: 'Hospital Administration',
    specialization: 'Healthcare Operations & Bed Allocations Command',
    registrationNumber: 'HOSP-ADM-TN-2024-001',
    licensingAuthority: 'Directorate of Medical Services, Govt of Tamil Nadu',
    submittedDate: '2026-11-10',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-19', title: 'Hospital Executive Gazette Appointment', documentType: 'Institutional Identity', referenceNumber: 'GO-MS-2024-912', issueDate: '2024-01-15', status: 'Verified' },
      { id: 'doc-20', title: 'Masters in Hospital Administration (MHA)', documentType: 'Postgraduate Degree', referenceNumber: 'TISS-MHA-2018-50', issueDate: '2018-05-30', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-17', timestamp: '2026-11-10, 09:00 AM', action: 'Submitted', actor: 'Karthik Subramanian', notes: 'Initial Hospital Admin command clearance request.' },
      { id: 'aud-18', timestamp: '2026-11-10, 11:30 AM', action: 'Verified', actor: 'State Health Command Secretariat', notes: 'Permanent super-admin authorization granted.' }
    ]
  },
  {
    id: 'stf-12',
    staffId: 'STF-ADM-302',
    name: 'Devika Krishnan',
    email: 'devika.krishnan@apollohealth.org',
    phone: '+91 99403 22119',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Hospital Administrator',
    department: 'Hospital Administration',
    specialization: 'Biomedical Resource Procurement & Ward Inventory',
    registrationNumber: 'ADM-PRC-2025-104',
    licensingAuthority: 'Institutional Executive Board',
    submittedDate: 'Yesterday',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-21', title: 'Institutional Employment Contract', documentType: 'Institutional Identity', referenceNumber: 'HR-OFF-2026-104', issueDate: '2026-10-01', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-19', timestamp: 'Yesterday, 02:30 PM', action: 'Submitted', actor: 'Devika Krishnan', notes: 'Requested administrator clearance for equipment inventory & resource registry module.' }
    ]
  },

  // 4. OTHER HOSPITAL STAFF
  {
    id: 'stf-13',
    staffId: 'STF-OTH-401',
    name: 'Mark Davies',
    email: 'mark.davies.biomed@medisync.net',
    phone: '+91 98844 77665',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Other Hospital Staff',
    department: 'Biomedical Engineering',
    specialization: 'Lead Biomedical Equipment Calibration Engineer',
    registrationNumber: 'BMET-CBET-2020-891',
    licensingAuthority: 'Association for the Advancement of Medical Instrumentation (AAMI)',
    submittedDate: '2026-11-14',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-22', title: 'Certified Biomedical Equipment Technician (CBET)', documentType: 'Institutional Identity', referenceNumber: 'AAMI-CBET-891', issueDate: '2020-09-12', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-20', timestamp: '2026-11-14, 10:00 AM', action: 'Submitted', actor: 'Mark Davies', notes: 'Telemetry calibration lead access request.' },
      { id: 'aud-21', timestamp: '2026-11-14, 01:45 PM', action: 'Verified', actor: 'Chief Medical Engineer', notes: 'Biomedical lead clearance certified.' }
    ]
  },
  {
    id: 'stf-14',
    staffId: 'STF-OTH-402',
    name: 'Elena Gomez',
    email: 'elena.gomez.biomed@medisync.net',
    phone: '+91 97911 88223',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Other Hospital Staff',
    department: 'Biomedical Engineering',
    specialization: 'Medical Device Telemetry & Safety Certification',
    registrationNumber: 'BMET-2022-4412',
    licensingAuthority: 'Clinical Engineering Certification Board',
    submittedDate: 'Today',
    verificationStatus: 'Pending',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-23', title: 'Biomedical Certification Card', documentType: 'Institutional Identity', referenceNumber: 'CE-BMET-2022-4412', issueDate: '2022-04-18', status: 'Attached' }
    ],
    auditHistory: [
      { id: 'aud-22', timestamp: 'Today, 10:15 AM', action: 'Submitted', actor: 'Elena Gomez', notes: 'Submitted credentials for medical device telemetry maintenance access.' }
    ]
  },
  {
    id: 'stf-15',
    staffId: 'STF-OTH-403',
    name: 'Suresh Kumar V.',
    email: 'suresh.pharmacy@rgggh.gov.in',
    phone: '+91 94441 55002',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    requestedRole: 'Other Hospital Staff',
    department: 'Central Pharmacy',
    specialization: 'Chief Pharmacist & Critical Reserves Manager',
    registrationNumber: 'TN-PHARM-2016-1892',
    licensingAuthority: 'Tamil Nadu State Pharmacy Council',
    submittedDate: '2026-11-21',
    verificationStatus: 'Verified',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    district: 'Chennai',
    documents: [
      { id: 'doc-24', title: 'State Pharmacy Council Registered Pharmacist', documentType: 'Institutional Identity', referenceNumber: 'TN-PHARM-2016-1892', issueDate: '2016-08-22', status: 'Verified' }
    ],
    auditHistory: [
      { id: 'aud-23', timestamp: '2026-11-21, 11:30 AM', action: 'Submitted', actor: 'Suresh Kumar V.', notes: 'Central pharmacy manager credentialing submitted.' },
      { id: 'aud-24', timestamp: '2026-11-22, 09:00 AM', action: 'Verified', actor: 'Hospital Admin Command', notes: 'Approved for institutional resource registry management.' }
    ]
  }
];
