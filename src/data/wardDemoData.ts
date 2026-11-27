// Centralized Demo Data for MediSync AI Clinical Wards Management
// Step 3: Clinical Wards Management (Synthetic Demo Data)

export interface WardItem {
  id: string;
  wardId: string;
  name: string;
  wardType: string;
  floor: string;
  assignedDoctor: string;
  assignedNurse: string;
  additionalNurses?: string[];
  contact: string;
  operationalStatus: 'Active' | 'High Occupancy' | 'Full Capacity' | 'Under Sanitization';
  description: string;
  bedMatchingKey: string; // Used to filter beds from shared bed registry
  departmentName?: string;
  departmentCode?: string;
}

export const INITIAL_WARDS: WardItem[] = [
  {
    id: 'ward-01',
    wardId: 'WRD-GEN-01',
    name: 'General Ward',
    wardType: 'General In-Patient Care',
    floor: '1st Floor (Ward Block A)',
    assignedDoctor: 'Dr. Sundaramoorthy M. (Sr. Consultant)',
    assignedNurse: 'Nurse In-Charge Jaya K.',
    additionalNurses: ['Staff Nurse Deepa', 'Staff Nurse Anbarasu', 'Nurse Revathi'],
    contact: 'Ext. 2101 · Station A',
    operationalStatus: 'Active',
    description: 'Post-operative recovery, medical stabilization, and routine sub-acute inpatient care.',
    bedMatchingKey: 'General Ward',
    departmentName: 'General Medicine',
    departmentCode: 'DEP-GEN-06'
  },
  {
    id: 'ward-02',
    wardId: 'WRD-ICU-02',
    name: 'ICU Complex',
    wardType: 'Critical Care & Life Support',
    floor: '4th Floor (ICU Complex)',
    assignedDoctor: 'Dr. Radhakrishnan K. (Critical Care Lead)',
    assignedNurse: 'Sr. Nurse Lavanya M. (Nurse Superintendent)',
    additionalNurses: ['Nurse Karthik R.', 'Nurse Sandhiya P.', 'Nurse Gokulnath'],
    contact: 'Ext. 4102 · ICU Command Desk',
    operationalStatus: 'High Occupancy',
    description: 'Advanced invasive ventilation, hemodynamic telemetry, and 1:1 round-the-clock nursing ratio.',
    bedMatchingKey: 'ICU',
    departmentName: 'Intensive Care Unit (ICU)',
    departmentCode: 'DEP-ICU-02'
  },
  {
    id: 'ward-03',
    wardId: 'WRD-EMG-03',
    name: 'Emergency Ward',
    wardType: 'Trauma & Triage Resuscitation',
    floor: 'Ground Floor (Triage Wing)',
    assignedDoctor: 'Dr. Bala Subramanian (Emergency Head)',
    assignedNurse: 'Nurse In-Charge Priya S.',
    additionalNurses: ['Triage Nurse Vinoth', 'Nurse Saravanan', 'Nurse Kavitha'],
    contact: 'Ext. 1104 · 24x7 Triage Hotline',
    operationalStatus: 'Active',
    description: '24x7 emergency resuscitation, rapid triage evaluation, and acute trauma admission stabilization.',
    bedMatchingKey: 'Emergency',
    departmentName: 'Emergency',
    departmentCode: 'DEP-EMG-01'
  },
  {
    id: 'ward-04',
    wardId: 'WRD-CARD-04',
    name: 'Cardiology Ward',
    wardType: 'Cardiac Care & Stepdown',
    floor: '3rd Floor (Heart Center)',
    assignedDoctor: 'Dr. S. Narayanan (Cardiologist)',
    assignedNurse: 'Nurse In-Charge Anitha R.',
    additionalNurses: ['Cardiac Nurse Malathi', 'Nurse Praveen K.'],
    contact: 'Ext. 3201 · CCU Central Desk',
    operationalStatus: 'Active',
    description: 'Post-angioplasty telemetry monitoring, cardiac rhythm tracking, and coronary care beds.',
    bedMatchingKey: 'Cardiology',
    departmentName: 'Cardiology',
    departmentCode: 'DEP-CARD-03'
  },
  {
    id: 'ward-05',
    wardId: 'WRD-NEURO-05',
    name: 'Neurology Ward',
    wardType: 'Neuro Critical & Stroke Care',
    floor: '3rd Floor (Neuro Wing)',
    assignedDoctor: 'Dr. V. Chandran (Neuro Specialist)',
    assignedNurse: 'Nurse Saranya M.',
    additionalNurses: ['Neuro Tech Vignesh', 'Nurse Pavithra S.'],
    contact: 'Ext. 3302 · Neuro Station',
    operationalStatus: 'Active',
    description: 'Acute stroke response beds, ICP intracranial monitoring, and continuous neuro-vital observation.',
    bedMatchingKey: 'Neurology',
    departmentName: 'Neurology',
    departmentCode: 'DEP-NEURO-04'
  },
  {
    id: 'ward-06',
    wardId: 'WRD-PEDI-06',
    name: 'Pediatrics Ward',
    wardType: 'Neonatal & Child Healthcare',
    floor: '2nd Floor (NICU/PICU)',
    assignedDoctor: 'Dr. Meena Swaminathan (Pediatrician)',
    assignedNurse: 'Nurse Revathi S.',
    additionalNurses: ['Neonatal Nurse Geetha', 'Nurse Shalini'],
    contact: 'Ext. 2205 · Pediatric Desk',
    operationalStatus: 'Active',
    description: 'Child-safe monitored cots, phototherapy units, neonatal incubators, and family-assisted pediatric bays.',
    bedMatchingKey: 'Pediatrics',
    departmentName: 'Pediatrics',
    departmentCode: 'DEP-PEDI-07'
  },
  {
    id: 'ward-07',
    wardId: 'WRD-ORTHO-07',
    name: 'Orthopedic & Trauma Ward',
    wardType: 'Musculoskeletal Convalescence',
    floor: '2nd Floor (Surgical Block B)',
    assignedDoctor: 'Dr. Rajeshwari Sundaram (Sr. Ortho Surgeon)',
    assignedNurse: 'Nurse In-Charge Manimegalai T.',
    additionalNurses: ['Nurse Vignesh M.', 'Nurse Anandhi'],
    contact: 'Ext. 2402 · Ortho Station',
    operationalStatus: 'Active',
    description: 'Traction beds, post-arthroplasty recovery bays, mobility monitoring, and orthopedic clinical care.',
    bedMatchingKey: 'Orthopedics',
    departmentName: 'Orthopedics',
    departmentCode: 'DEP-ORTHO-05'
  },
  {
    id: 'ward-08',
    wardId: 'WRD-SURG-08',
    name: 'Surgical Post-Op Ward',
    wardType: 'Post-Surgical Stabilization',
    floor: '3rd Floor (OR Suite Wing)',
    assignedDoctor: 'Dr. Anand Kumar (Chief Surgeon)',
    assignedNurse: 'Nurse In-Charge Sangeetha K.',
    additionalNurses: ['Nurse Divya P.', 'Nurse Murugan'],
    contact: 'Ext. 3502 · Post-Op Desk',
    operationalStatus: 'Active',
    description: 'Specialized post-operative monitoring, wound drainage tracking, and surgical stepdown convalescence.',
    bedMatchingKey: 'Surgery',
    departmentName: 'Surgery',
    departmentCode: 'DEP-SURG-08'
  },
  {
    id: 'ward-09',
    wardId: 'WRD-OBGYN-09',
    name: 'Maternity & Postnatal Ward',
    wardType: 'Maternal & Neonatal Care',
    floor: '2nd Floor (Women\'s Health Pavilion)',
    assignedDoctor: 'Dr. Kalpana Ramesh (Head of Ob/Gyn)',
    assignedNurse: 'Nurse In-Charge Vasanthi R.',
    additionalNurses: ['Midwife Nurse Latha', 'Nurse Gomathi'],
    contact: 'Ext. 2602 · Maternity Station',
    operationalStatus: 'Active',
    description: 'Post-delivery mother & child rooming-in suites, fetal heart rate monitoring, and neonatal assessment beds.',
    bedMatchingKey: 'Obstetrics & Gynecology',
    departmentName: 'Obstetrics & Gynecology',
    departmentCode: 'DEP-OBGYN-09'
  }
];
