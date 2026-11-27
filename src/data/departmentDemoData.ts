// Centralized Demo Data for MediSync AI Hospital Departments
// Departments Module (Synthetic Demo Data)

export type DepartmentStatus = 'Operational' | 'Active' | 'Under Review' | 'Inactive';

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  departmentHead: string;
  contactExtension: string;
  floor: string;
  description: string;
  status: DepartmentStatus;
  wardIds: string[];
  createdDate: string;
}

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'dep-01',
    code: 'DEP-EMG-01',
    name: 'Emergency',
    departmentHead: 'Dr. Bala Subramanian (Emergency Head)',
    contactExtension: 'Ext. 1100 · ER Command Desk',
    floor: 'Ground Floor (Triage & Trauma Wing)',
    description: '24x7 acute trauma resuscitation, rapid clinical triage, stabilization bays, and urgent critical admissions.',
    status: 'Operational',
    wardIds: ['WRD-EMG-03'],
    createdDate: '2026-01-15'
  },
  {
    id: 'dep-02',
    code: 'DEP-ICU-02',
    name: 'Intensive Care Unit (ICU)',
    departmentHead: 'Dr. Radhakrishnan K. (Critical Care Lead)',
    contactExtension: 'Ext. 4100 · ICU Central Station',
    floor: '4th Floor (ICU Complex)',
    description: 'Advanced tertiary life support, invasive ventilation, multi-organ failure management, and round-the-clock 1:1 nursing.',
    status: 'Operational',
    wardIds: ['WRD-ICU-02'],
    createdDate: '2026-01-15'
  },
  {
    id: 'dep-03',
    code: 'DEP-CARD-03',
    name: 'Cardiology',
    departmentHead: 'Dr. S. Narayanan (Chief of Cardiology)',
    contactExtension: 'Ext. 3200 · Heart Center Desk',
    floor: '3rd Floor (Cardiovascular Complex)',
    description: 'Coronary care unit (CCU), post-angioplasty telemetry tracking, arrhythmia management, and cardiac catheterization recovery.',
    status: 'Operational',
    wardIds: ['WRD-CARD-04'],
    createdDate: '2026-01-20'
  },
  {
    id: 'dep-04',
    code: 'DEP-NEURO-04',
    name: 'Neurology',
    departmentHead: 'Dr. V. Chandran (Head of Neurology)',
    contactExtension: 'Ext. 3300 · Neuro Science Desk',
    floor: '3rd Floor (Neuro Wing)',
    description: 'Comprehensive acute stroke care, intracranial pressure monitoring, post-neurosurgical stabilization, and EEG telemetry.',
    status: 'Operational',
    wardIds: ['WRD-NEURO-05'],
    createdDate: '2026-02-01'
  },
  {
    id: 'dep-05',
    code: 'DEP-ORTHO-05',
    name: 'Orthopedics',
    departmentHead: 'Dr. Rajeshwari Sundaram (Lead Orthopedic Surgeon)',
    contactExtension: 'Ext. 2400 · Ortho Station',
    floor: '2nd Floor (Surgical Block B)',
    description: 'Joint replacement recovery, musculoskeletal trauma management, spinal traction beds, and post-op orthopedic rehabilitation.',
    status: 'Operational',
    wardIds: ['WRD-ORTHO-07'],
    createdDate: '2026-02-10'
  },
  {
    id: 'dep-06',
    code: 'DEP-GEN-06',
    name: 'General Medicine',
    departmentHead: 'Dr. Sundaramoorthy M. (Sr. Consultant Physician)',
    contactExtension: 'Ext. 2100 · Station A',
    floor: '1st Floor (Ward Block A)',
    description: 'Sub-acute in-patient stabilization, infectious disease management, geriatric internal medicine, and post-procedural care.',
    status: 'Operational',
    wardIds: ['WRD-GEN-01'],
    createdDate: '2026-01-10'
  },
  {
    id: 'dep-07',
    code: 'DEP-PEDI-07',
    name: 'Pediatrics',
    departmentHead: 'Dr. Meena Swaminathan (Lead Pediatrician)',
    contactExtension: 'Ext. 2200 · Child Care Desk',
    floor: '2nd Floor (Maternal & Child Wing)',
    description: 'Pediatric high-dependency care, neonatal monitoring, phototherapy nurseries, and child-safe inpatient medical bays.',
    status: 'Operational',
    wardIds: ['WRD-PEDI-06'],
    createdDate: '2026-02-15'
  },
  {
    id: 'dep-08',
    code: 'DEP-SURG-08',
    name: 'Surgery',
    departmentHead: 'Dr. Anand Kumar (Chief of Surgical Services)',
    contactExtension: 'Ext. 3500 · Surgical Command',
    floor: '3rd Floor (OR Suite Complex)',
    description: 'Pre-operative preparation bays, post-anesthesia recovery units (PACU), and elective inpatient surgical convalescence.',
    status: 'Operational',
    wardIds: ['WRD-SURG-08'],
    createdDate: '2026-03-01'
  },
  {
    id: 'dep-09',
    code: 'DEP-OBGYN-09',
    name: 'Obstetrics & Gynecology',
    departmentHead: 'Dr. Kalpana Ramesh (Head of Ob/Gyn)',
    contactExtension: 'Ext. 2600 · Maternity Center',
    floor: '2nd Floor (Women\'s Health Pavilion)',
    description: 'Labor and delivery suites, high-risk antenatal observation, post-cesarean recovery, and gynecological surgical care.',
    status: 'Operational',
    wardIds: ['WRD-OBGYN-09'],
    createdDate: '2026-03-05'
  }
];
