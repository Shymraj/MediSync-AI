// Centralized Clinical Demo Data for MediSync AI Advanced Doctor Workspace
// Realistic synthetic clinical profiles, telemetry, AI suggestions, and handover logs.

export type ClinicalRiskLevel = 'Stable' | 'Needs Attention' | 'High Risk' | 'Critical';

export interface VitalSignReading {
  timestamp: string;
  heartRate: number; // bpm (60-100)
  systolicBP: number; // mmHg (90-120)
  diastolicBP: number; // mmHg (60-80)
  spO2: number; // % (95-100)
  respiratoryRate: number; // bpm (12-20)
  temperature: number; // °C (36.5 - 37.5)
  gcsScore: number; // 3-15
  isAbnormal?: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: 'Oral' | 'IV' | 'SC' | 'Inhalation' | 'Topical';
  indication: string;
  startDate: string;
  status: 'Active' | 'Discontinued' | 'Pending Review';
  prescribingDoctor: string;
}

export interface AllergyItem {
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Anaphylactic';
}

export interface LabResultItem {
  id: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Blood Gas' | 'Cardiac Markers' | 'Microbiology' | 'Inflammatory';
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'Abnormal' | 'Critical Panic';
  timestamp: string;
  notes?: string;
  acknowledged?: boolean;
}

export interface ClinicalTimelineEvent {
  id: string;
  timestamp: string;
  date: string;
  category: 'Admission' | 'Vitals Alert' | 'Medication' | 'Lab Result' | 'Procedure' | 'Transfer' | 'Physician Note';
  title: string;
  description: string;
  actor: string;
  severity?: 'normal' | 'warning' | 'critical';
}

export interface PatientDigitalTwin {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  admissionDate: string;
  department: string;
  ward: string;
  bedNumber: string;
  attendingPhysician: string;
  primaryDiagnosis: string;
  icd10: string;
  secondaryDiagnoses: string[];
  riskLevel: ClinicalRiskLevel;
  mewsScore: number; // Modified Early Warning Score (0-14)
  resuscitationStatus: 'Full Code' | 'DNR' | 'Modified CPR';
  allergies: AllergyItem[];
  vitals: VitalSignReading[];
  currentVitals: VitalSignReading;
  medications: MedicationItem[];
  labs: LabResultItem[];
  timeline: ClinicalTimelineEvent[];
  medicalHistory: string[];
  surgicalHistory: string[];
  clinicalObservations: string;
  doctorNotes: string;
  dischargeReady: boolean;
  assignedNurse: string;
  isolationProtocol?: string;
}

export interface DrugInteractionAlert {
  id: string;
  drugs: [string, string];
  severity: 'Major' | 'Moderate' | 'Minor';
  effect: string;
  recommendation: string;
}

export interface EarlyWarningAlertItem {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bed: string;
  timestamp: string;
  triggerParam: string;
  triggerValue: string;
  threshold: string;
  mewsScore: number;
  severity: 'Critical' | 'High Risk' | 'Needs Attention';
  status: 'Active' | 'Acknowledged' | 'Nurse Assigned' | 'Escalated';
  reason: string;
  suggestedAction: string;
}

export interface ClinicalHandoverItem {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  ward: string;
  clinicalSummary: string;
  criticalIssues: string[];
  pendingInvestigations: string[];
  outstandingTasks: string[];
  handoverFrom: string;
  handoverTo: string;
  timestamp: string;
  shift: 'Morning -> Evening' | 'Evening -> Night' | 'Night -> Morning';
  status: 'Pending Review' | 'Accepted' | 'Completed';
}

export interface DoctorNurseTaskItem {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bed: string;
  taskType: 'Vital Check' | 'Medication Administration' | 'Lab Collection' | 'Assessment' | 'Wound Dressing';
  instruction: string;
  doctorName: string;
  assignedNurse: string;
  timestamp: string;
  priority: 'Stat (Immediate)' | 'Urgent' | 'Routine';
  status: 'Pending' | 'In Progress' | 'Completed';
  nurseObservation?: string;
  completedAt?: string;
}

export interface OutbreakPatternItem {
  id: string;
  ward: string;
  clusterType: string;
  suspectedPathogen: string;
  patientCount: number;
  patientsInvolved: string[];
  commonSymptoms: string[];
  timePeriod: string;
  riskSeverity: 'High' | 'Moderate' | 'Under Investigation';
  infectionControlStatus: 'Quarantine Recommended' | 'Active Monitoring' | 'Swabs In Process';
  suggestedProtocol: string;
}

export const INITIAL_CLINICAL_PATIENTS: PatientDigitalTwin[] = [
  {
    id: 'pt-01',
    patientId: 'PT-8941',
    name: 'Kavitha Ramasamy',
    age: 58,
    gender: 'Female',
    bloodGroup: 'B Positive',
    admissionDate: '2026-11-25 (Day 3)',
    department: 'Critical Care & Cardiology',
    ward: 'ICU Complex',
    bedNumber: 'ICU-04',
    attendingPhysician: 'Dr. Sundaramoorthy M. (Sr. Consultant)',
    primaryDiagnosis: 'Acute Coronary Syndrome (NSTEMI) post-PCI with mild pulmonary congestion',
    icd10: 'I21.4',
    secondaryDiagnoses: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Mild CKD Stage 2'],
    riskLevel: 'Needs Attention',
    mewsScore: 4,
    resuscitationStatus: 'Full Code',
    allergies: [
      { allergen: 'Penicillin', reaction: 'Urticaria & Bronchospasm', severity: 'Severe' },
      { allergen: 'NSAIDs (Diclofenac)', reaction: 'Gastric hemorrhage / Epigastric distress', severity: 'Moderate' }
    ],
    vitals: [
      { timestamp: '06:00 AM', heartRate: 88, systolicBP: 138, diastolicBP: 84, spO2: 97, respiratoryRate: 18, temperature: 36.8, gcsScore: 15 },
      { timestamp: '09:00 AM', heartRate: 94, systolicBP: 142, diastolicBP: 88, spO2: 96, respiratoryRate: 20, temperature: 37.1, gcsScore: 15 },
      { timestamp: '12:00 PM', heartRate: 104, systolicBP: 148, diastolicBP: 92, spO2: 94, respiratoryRate: 22, temperature: 37.4, gcsScore: 15, isAbnormal: true },
      { timestamp: '03:00 PM', heartRate: 98, systolicBP: 136, diastolicBP: 82, spO2: 96, respiratoryRate: 19, temperature: 37.0, gcsScore: 15 }
    ],
    currentVitals: {
      timestamp: 'Just now (03:15 PM)',
      heartRate: 98,
      systolicBP: 136,
      diastolicBP: 82,
      spO2: 96,
      respiratoryRate: 19,
      temperature: 37.0,
      gcsScore: 15
    },
    medications: [
      { id: 'm-1', name: 'Aspirin (Ecosprin)', dosage: '75 mg', frequency: 'OD (Morning)', route: 'Oral', indication: 'Antiplatelet', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' },
      { id: 'm-2', name: 'Ticagrelor (Brilinta)', dosage: '90 mg', frequency: 'BD (1-0-1)', route: 'Oral', indication: 'DAPT for Drug-Eluting Stent', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' },
      { id: 'm-3', name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS (Night)', route: 'Oral', indication: 'Lipid lowering / Plaque stabilization', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' },
      { id: 'm-4', name: 'Metoprolol Succinate', dosage: '25 mg', frequency: 'OD', route: 'Oral', indication: 'Rate control & Post-MI cardioprotection', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' },
      { id: 'm-5', name: 'Furosemide (Lasix)', dosage: '20 mg', frequency: 'BD', route: 'IV', indication: 'Pulmonary decongestion', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' }
    ],
    labs: [
      { id: 'l-1', testName: 'High-Sensitivity Troponin I', category: 'Cardiac Markers', value: '420.5', unit: 'ng/L', referenceRange: '< 14 ng/L', status: 'Critical Panic', timestamp: 'Today, 08:30 AM', notes: 'Downtrending from 1,250 ng/L post-angioplasty.' },
      { id: 'l-2', testName: 'Serum Creatinine', category: 'Biochemistry', value: '1.24', unit: 'mg/dL', referenceRange: '0.6 - 1.1 mg/dL', status: 'Abnormal', timestamp: 'Today, 08:30 AM', notes: 'Baseline stable at 1.15 mg/dL.' },
      { id: 'l-3', testName: 'Hemoglobin', category: 'Hematology', value: '11.8', unit: 'g/dL', referenceRange: '12.0 - 15.5 g/dL', status: 'Normal', timestamp: 'Today, 08:30 AM' },
      { id: 'l-4', testName: 'Serum Potassium (K+)', category: 'Biochemistry', value: '4.2', unit: 'mmol/L', referenceRange: '3.5 - 5.0 mmol/L', status: 'Normal', timestamp: 'Today, 08:30 AM' },
      { id: 'l-5', testName: 'C-Reactive Protein (hs-CRP)', category: 'Inflammatory', value: '14.2', unit: 'mg/L', referenceRange: '< 3.0 mg/L', status: 'Abnormal', timestamp: 'Today, 08:30 AM', notes: 'Post-intervention systemic inflammation.' }
    ],
    timeline: [
      { id: 't-1', timestamp: '11:45 AM', date: '2026-11-25', category: 'Admission', title: 'Admitted from Emergency Triage', description: 'Presented with crushing substernal chest discomfort radiating to left arm. ECG showed ST depressions in V4-V6.', actor: 'Dr. Alex Rivera (ER)', severity: 'critical' },
      { id: 't-2', timestamp: '02:30 PM', date: '2026-11-25', category: 'Procedure', title: 'Emergency Coronary Angiogram & PCI', description: 'Successful DES deployment to 95% proximal LAD lesion with TIMI 3 flow restored.', actor: 'Dr. S. Narayanan (Cath Lab)', severity: 'normal' },
      { id: 't-3', timestamp: '12:15 PM', date: '2026-11-27', category: 'Vitals Alert', title: 'Transient Tachycardia & Tachypnea', description: 'SpO2 dipped to 94% on room air with HR 104 bpm. Administered low-flow O2 via nasal cannula (2 L/min) and IV Lasix 20mg.', actor: 'Nurse Lavanya M. (ICU)', severity: 'warning' },
      { id: 't-4', timestamp: '03:15 PM', date: '2026-11-27', category: 'Physician Note', title: 'Post-Round Clinical Assessment', description: 'Chest clear bilaterally on auscultation. Stable telemetry rhythms. Plan to transfer to Step-down HDU tomorrow morning if troponin continues downward trajectory.', actor: 'Dr. Sundaramoorthy M.', severity: 'normal' }
    ],
    medicalHistory: ['Hypertension x 8 years', 'Type 2 Diabetes x 5 years (HbA1c 7.6%)', 'Hyperlipidemia'],
    surgicalHistory: ['Laparoscopic Cholecystectomy (2018)'],
    clinicalObservations: 'Patient is conscious, oriented x 3. Peripheral perfusion warm. No bilateral pedal edema. Surgical groin puncture site clean and dry without hematoma.',
    doctorNotes: 'Monitor continuous ECG for reperfusion arrhythmias. Maintain strict intake/output chart. Target BP < 130/80 mmHg.',
    dischargeReady: false,
    assignedNurse: 'Sr. Nurse Lavanya M.',
    isolationProtocol: 'None Required'
  },
  {
    id: 'pt-02',
    patientId: 'PT-8942',
    name: 'Murugan Selvam',
    age: 64,
    gender: 'Male',
    bloodGroup: 'O Positive',
    admissionDate: '2026-11-24 (Day 4)',
    department: 'Critical Care & Pulmonology',
    ward: 'ICU Complex',
    bedNumber: 'ICU-08',
    attendingPhysician: 'Dr. Radhakrishnan K. (Critical Care Lead)',
    primaryDiagnosis: 'Severe Community-Acquired Pneumonia with early septic shock & Type 1 Respiratory Failure',
    icd10: 'J18.9 / R65.21',
    secondaryDiagnoses: ['COPD Gold Stage II', 'Chronic Cor Pulmonale'],
    riskLevel: 'Critical',
    mewsScore: 7,
    resuscitationStatus: 'Full Code',
    allergies: [
      { allergen: 'Sulfa Drugs', reaction: 'Exanthematous skin rash', severity: 'Moderate' }
    ],
    vitals: [
      { timestamp: '06:00 AM', heartRate: 112, systolicBP: 92, diastolicBP: 58, spO2: 91, respiratoryRate: 28, temperature: 38.6, gcsScore: 13, isAbnormal: true },
      { timestamp: '09:00 AM', heartRate: 118, systolicBP: 88, diastolicBP: 54, spO2: 90, respiratoryRate: 30, temperature: 38.8, gcsScore: 13, isAbnormal: true },
      { timestamp: '12:00 PM', heartRate: 114, systolicBP: 96, diastolicBP: 60, spO2: 93, respiratoryRate: 26, temperature: 38.3, gcsScore: 13, isAbnormal: true },
      { timestamp: '03:00 PM', heartRate: 108, systolicBP: 102, diastolicBP: 64, spO2: 94, respiratoryRate: 24, temperature: 37.9, gcsScore: 14, isAbnormal: true }
    ],
    currentVitals: {
      timestamp: 'Just now (03:20 PM)',
      heartRate: 108,
      systolicBP: 102,
      diastolicBP: 64,
      spO2: 94,
      respiratoryRate: 24,
      temperature: 37.9,
      gcsScore: 14,
      isAbnormal: true
    },
    medications: [
      { id: 'm-6', name: 'Meropenem', dosage: '1 g', frequency: 'TDS (q8h)', route: 'IV', indication: 'Broad-spectrum sepsis coverage', startDate: '2026-11-24', status: 'Active', prescribingDoctor: 'Dr. Radhakrishnan K.' },
      { id: 'm-7', name: 'Vancomycin', dosage: '1 g', frequency: 'BD (q12h)', route: 'IV', indication: 'MRSA coverage', startDate: '2026-11-24', status: 'Active', prescribingDoctor: 'Dr. Radhakrishnan K.' },
      { id: 'm-8', name: 'Noradrenaline (Norepinephrine)', dosage: '0.08 mcg/kg/min', frequency: 'Continuous Infusion', route: 'IV', indication: 'Septic shock vasopressor support', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Radhakrishnan K.' },
      { id: 'm-9', name: 'Hydrocortisone', dosage: '100 mg', frequency: 'TDS', route: 'IV', indication: 'Refractory septic shock adrenal support', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Radhakrishnan K.' },
      { id: 'm-10', name: 'Enoxaparin (Clexane)', dosage: '40 mg', frequency: 'OD', route: 'SC', indication: 'DVT Prophylaxis', startDate: '2026-11-25', status: 'Active', prescribingDoctor: 'Dr. Radhakrishnan K.' }
    ],
    labs: [
      { id: 'l-6', testName: 'Blood Lactate', category: 'Blood Gas', value: '3.8', unit: 'mmol/L', referenceRange: '0.5 - 2.0 mmol/L', status: 'Critical Panic', timestamp: 'Today, 11:00 AM', notes: 'Tissue hypoperfusion marker. Was 4.9 mmol/L at dawn.' },
      { id: 'l-7', testName: 'Total Leukocyte Count (WBC)', category: 'Hematology', value: '19,800', unit: '/mcL', referenceRange: '4,000 - 11,000 /mcL', status: 'Abnormal', timestamp: 'Today, 07:30 AM', notes: 'Severe leukocytosis with 88% neutrophilia.' },
      { id: 'l-8', testName: 'Procalcitonin', category: 'Inflammatory', value: '6.4', unit: 'ng/mL', referenceRange: '< 0.5 ng/mL', status: 'Critical Panic', timestamp: 'Today, 07:30 AM' },
      { id: 'l-9', testName: 'PaO2/FiO2 Ratio', category: 'Blood Gas', value: '185', unit: 'mmHg', referenceRange: '> 300 mmHg', status: 'Critical Panic', timestamp: 'Today, 11:00 AM', notes: 'Moderate ARDS threshold on 50% High-Flow Nasal Cannula.' }
    ],
    timeline: [
      { id: 't-5', timestamp: '04:10 AM', date: '2026-11-24', category: 'Admission', title: 'Emergency Intubation Consideration', description: 'Admitted from casualty in severe respiratory distress and hypotension (MAP 58 mmHg). Started on fluid resuscitation and empirical carbapenems.', actor: 'Dr. Alex Rivera (ER)', severity: 'critical' },
      { id: 't-6', timestamp: '08:00 AM', date: '2026-11-26', category: 'Procedure', title: 'Central Line Insertion', description: 'Right internal jugular triple-lumen catheter placed under ultrasound guidance. Commenced Noradrenaline.', actor: 'Dr. Radhakrishnan K.', severity: 'normal' },
      { id: 't-7', timestamp: '11:15 AM', date: '2026-11-27', category: 'Vitals Alert', title: 'Deterioration Warning: Lactate Spike', description: 'Lactate remained elevated at 3.8 mmol/L despite fluid boluses. Noradrenaline titrated up to maintain MAP > 65.', actor: 'Nurse Anitha (ICU)', severity: 'critical' }
    ],
    medicalHistory: ['40 pack-year smoking history', 'Chronic Bronchitis', 'Coronary artery disease (medically managed)'],
    surgicalHistory: ['Appendectomy (1985)'],
    clinicalObservations: 'Coarse crackles over bilateral lower zones. Using accessory muscles of respiration. High-Flow Nasal Cannula (HFNC) delivering 50 L/min at 50% FiO2. Peripheral cyanosis improving.',
    doctorNotes: 'Keep invasive mechanical ventilator on standby in bay. If PaO2/FiO2 drops below 150, perform endotracheal intubation. Target MAP > 65 mmHg.',
    dischargeReady: false,
    assignedNurse: 'Nurse Anitha R.',
    isolationProtocol: 'Droplet & Contact Precautions'
  },
  {
    id: 'pt-03',
    patientId: 'PT-8945',
    name: 'Subramanian V',
    age: 71,
    gender: 'Male',
    bloodGroup: 'A Positive',
    admissionDate: '2026-11-26 (Day 2)',
    department: 'General Medicine',
    ward: 'General Ward Block A',
    bedNumber: 'GEN-12',
    attendingPhysician: 'Dr. Bala Subramanian (Emergency & Internal Med)',
    primaryDiagnosis: 'Acute Exacerbation of Bronchial Asthma with Type 2 Respiratory Acidosis',
    icd10: 'J45.901',
    secondaryDiagnoses: ['Benign Prostatic Hyperplasia', 'Osteoarthritis knees'],
    riskLevel: 'Needs Attention',
    mewsScore: 3,
    resuscitationStatus: 'Full Code',
    allergies: [
      { allergen: 'Aspirin', reaction: 'Bronchospasm (Aspirin-exacerbated respiratory disease)', severity: 'Severe' }
    ],
    vitals: [
      { timestamp: '06:00 AM', heartRate: 92, systolicBP: 130, diastolicBP: 80, spO2: 95, respiratoryRate: 22, temperature: 37.0, gcsScore: 15 },
      { timestamp: '12:00 PM', heartRate: 96, systolicBP: 134, diastolicBP: 82, spO2: 94, respiratoryRate: 24, temperature: 37.2, gcsScore: 15 }
    ],
    currentVitals: {
      timestamp: 'Today, 02:45 PM',
      heartRate: 96,
      systolicBP: 134,
      diastolicBP: 82,
      spO2: 94,
      respiratoryRate: 24,
      temperature: 37.2,
      gcsScore: 15
    },
    medications: [
      { id: 'm-11', name: 'Salbutamol + Ipratropium (Duolin)', dosage: '2.5 ml', frequency: 'Q4H', route: 'Inhalation', indication: 'Bronchodilator nebulization', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Bala Subramanian' },
      { id: 'm-12', name: 'Methylprednisolone', dosage: '40 mg', frequency: 'BD', route: 'IV', indication: 'Anti-inflammatory steroid', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Bala Subramanian' },
      { id: 'm-13', name: 'Budesonide (Budecort)', dosage: '0.5 mg', frequency: 'BD', route: 'Inhalation', indication: 'Inhaled corticosteroid', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Bala Subramanian' }
    ],
    labs: [
      { id: 'l-10', testName: 'Arterial Blood Gas (ABG) pH', category: 'Blood Gas', value: '7.32', unit: 'pH', referenceRange: '7.35 - 7.45', status: 'Abnormal', timestamp: 'Today, 10:00 AM', notes: 'Mild respiratory acidosis.' },
      { id: 'l-11', testName: 'pCO2', category: 'Blood Gas', value: '48.5', unit: 'mmHg', referenceRange: '35 - 45 mmHg', status: 'Abnormal', timestamp: 'Today, 10:00 AM' }
    ],
    timeline: [
      { id: 't-8', timestamp: '09:30 AM', date: '2026-11-26', category: 'Admission', title: 'Admitted from OPD', description: 'Wheezing and chest tightness triggered by environmental dust exposure.', actor: 'Dr. Bala Subramanian', severity: 'warning' }
    ],
    medicalHistory: ['Asthma x 20 years', 'BPH on Tamsulosin'],
    surgicalHistory: ['None'],
    clinicalObservations: 'Bilateral expiratory polyphonic wheezes audible across lung fields. Speaking in full sentences with mild effort.',
    doctorNotes: 'Continue nebulization round-the-clock. If pCO2 > 52 mmHg, consider BiPAP non-invasive ventilation.',
    dischargeReady: false,
    assignedNurse: 'Nurse Jaya K.'
  },
  {
    id: 'pt-04',
    patientId: 'PT-8946',
    name: 'Ramesh Balan',
    age: 34,
    gender: 'Male',
    bloodGroup: 'AB Positive',
    admissionDate: '2026-11-27 (Today)',
    department: 'Orthopedics & Trauma',
    ward: 'Emergency Triage',
    bedNumber: 'EMG-02',
    attendingPhysician: 'Dr. Alex Rivera (Emergency Head)',
    primaryDiagnosis: 'Polytrauma secondary to high-speed road collision: Right femur fracture, closed head injury, multiple rib fractures (R 4-6)',
    icd10: 'S72.301A / S06.0X0A',
    secondaryDiagnoses: ['Right hemopneumothorax', 'Traumatic shock'],
    riskLevel: 'Critical',
    mewsScore: 8,
    resuscitationStatus: 'Full Code',
    allergies: [],
    vitals: [
      { timestamp: '11:30 AM', heartRate: 126, systolicBP: 88, diastolicBP: 52, spO2: 89, respiratoryRate: 32, temperature: 36.1, gcsScore: 12, isAbnormal: true },
      { timestamp: '01:00 PM', heartRate: 116, systolicBP: 104, diastolicBP: 66, spO2: 95, respiratoryRate: 24, temperature: 36.6, gcsScore: 13, isAbnormal: true }
    ],
    currentVitals: {
      timestamp: 'Today, 01:15 PM',
      heartRate: 116,
      systolicBP: 104,
      diastolicBP: 66,
      spO2: 95,
      respiratoryRate: 24,
      temperature: 36.6,
      gcsScore: 13,
      isAbnormal: true
    },
    medications: [
      { id: 'm-14', name: 'Fentanyl', dosage: '50 mcg', frequency: 'PRN', route: 'IV', indication: 'Analgesia for severe trauma', startDate: '2026-11-27', status: 'Active', prescribingDoctor: 'Dr. Alex Rivera' },
      { id: 'm-15', name: 'Tranexamic Acid (TXA)', dosage: '1 g', frequency: 'Stat (Over 10m)', route: 'IV', indication: 'Trauma hemorrhage protocol', startDate: '2026-11-27', status: 'Active', prescribingDoctor: 'Dr. Alex Rivera' },
      { id: 'm-16', name: 'Cefazolin', dosage: '2 g', frequency: 'Stat', route: 'IV', indication: 'Open injury surgical prophylaxis', startDate: '2026-11-27', status: 'Active', prescribingDoctor: 'Dr. Alex Rivera' }
    ],
    labs: [
      { id: 'l-12', testName: 'Hemoglobin', category: 'Hematology', value: '8.4', unit: 'g/dL', referenceRange: '13.0 - 17.5 g/dL', status: 'Critical Panic', timestamp: 'Today, 11:45 AM', notes: 'Severe acute blood loss anemia. 2 units PRBC cross-matched.' },
      { id: 'l-13', testName: 'Arterial Blood Gas (pH)', category: 'Blood Gas', value: '7.28', unit: 'pH', referenceRange: '7.35 - 7.45', status: 'Critical Panic', timestamp: 'Today, 11:45 AM' }
    ],
    timeline: [
      { id: 't-9', timestamp: '11:30 AM', date: '2026-11-27', category: 'Admission', title: 'Direct Trauma Arrival via 108 Ambulance', description: 'Patient immobilized on spinal backboard with Thomas splint on right lower extremity.', actor: '108 Paramedic Team', severity: 'critical' },
      { id: 't-10', timestamp: '12:05 PM', date: '2026-11-27', category: 'Procedure', title: 'Right Intercostal Tube (Chest Drain) Insertion', description: '28 Fr chest tube placed in 5th intercostal space anterior axillary line. Drained 450 mL dark blood immediately with lung re-expansion confirmed.', actor: 'Dr. Alex Rivera', severity: 'critical' }
    ],
    medicalHistory: ['Nil significant'],
    surgicalHistory: ['Nil'],
    clinicalObservations: 'Chest drain underwater seal oscillating freely. Right pupil 3mm reactive, left pupil 3mm reactive. Right lower limb traction maintained.',
    doctorNotes: 'Urgent transfer to Emergency OR for external fixation of femur once hemodynamics stabilize. Cross-match 4 units Packed Red Cells.',
    dischargeReady: false,
    assignedNurse: 'Nurse Karthik R.'
  },
  {
    id: 'pt-05',
    patientId: 'PT-8947',
    name: 'Govindasamy N.',
    age: 62,
    gender: 'Male',
    bloodGroup: 'B Positive',
    admissionDate: '2026-11-26 (Day 2)',
    department: 'Endocrinology & Nephrology',
    ward: 'ICU Complex',
    bedNumber: 'ICU-10',
    attendingPhysician: 'Dr. Priya Sundaram (Endocrinology)',
    primaryDiagnosis: 'Diabetic Ketoacidosis (DKA) with severe hyperkalemia & metabolic encephalopathy',
    icd10: 'E11.10',
    secondaryDiagnoses: ['Diabetic Nephropathy Stage 3', 'Peripheral Neuropathy'],
    riskLevel: 'High Risk',
    mewsScore: 5,
    resuscitationStatus: 'Full Code',
    allergies: [],
    vitals: [
      { timestamp: '08:00 AM', heartRate: 102, systolicBP: 110, diastolicBP: 70, spO2: 97, respiratoryRate: 26, temperature: 37.0, gcsScore: 14 }
    ],
    currentVitals: {
      timestamp: 'Today, 02:00 PM',
      heartRate: 88,
      systolicBP: 118,
      diastolicBP: 74,
      spO2: 98,
      respiratoryRate: 18,
      temperature: 36.9,
      gcsScore: 15
    },
    medications: [
      { id: 'm-17', name: 'Regular Insulin (Actrapid)', dosage: '4 Units/hr', frequency: 'Continuous Infusion', route: 'IV', indication: 'DKA correction', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Priya Sundaram' },
      { id: 'm-18', name: 'Normal Saline (0.9% NaCl)', dosage: '150 mL/hr', frequency: 'Continuous Infusion', route: 'IV', indication: 'Volume rehydration', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Priya Sundaram' },
      { id: 'm-19', name: 'Potassium Chloride (KCl)', dosage: '20 mEq/L', frequency: 'IV additive', route: 'IV', indication: 'Hypokalemia prevention during insulin therapy', startDate: '2026-11-26', status: 'Active', prescribingDoctor: 'Dr. Priya Sundaram' }
    ],
    labs: [
      { id: 'l-14', testName: 'Random Blood Glucose (RBS)', category: 'Biochemistry', value: '238', unit: 'mg/dL', referenceRange: '70 - 140 mg/dL', status: 'Abnormal', timestamp: 'Today, 01:30 PM', notes: 'Downtrending from 480 mg/dL upon admission.' },
      { id: 'l-15', testName: 'Serum Beta-Hydroxybutyrate (Ketones)', category: 'Biochemistry', value: '1.4', unit: 'mmol/L', referenceRange: '< 0.6 mmol/L', status: 'Abnormal', timestamp: 'Today, 01:30 PM', notes: 'Was 5.8 mmol/L at presentation.' },
      { id: 'l-16', testName: 'Arterial Blood Gas (HCO3)', category: 'Blood Gas', value: '18.2', unit: 'mmol/L', referenceRange: '22 - 28 mmol/L', status: 'Abnormal', timestamp: 'Today, 01:30 PM', notes: 'Anion gap closing.' }
    ],
    timeline: [
      { id: 't-11', timestamp: '07:20 PM', date: '2026-11-26', category: 'Admission', title: 'Admitted in DKA Semicoma', description: 'Patient missed insulin doses for 4 days due to acute viral gastroenteritis.', actor: 'Dr. Priya Sundaram', severity: 'critical' }
    ],
    medicalHistory: ['Type 2 Diabetes x 16 years', 'Diabetic Retinopathy'],
    surgicalHistory: ['Cataract surgery bilateral'],
    clinicalObservations: 'Sensorium clear. Kussmaul deep breathing resolved. Capillary refill < 2 seconds.',
    doctorNotes: 'Switch to subcutaneous basal-bolus insulin regimen once oral diet is tolerated and bicarbonate > 18.',
    dischargeReady: false,
    assignedNurse: 'Nurse Sandhiya P.'
  },
  {
    id: 'pt-06',
    patientId: 'PT-8940',
    name: 'Devi Saravanan',
    age: 46,
    gender: 'Female',
    bloodGroup: 'O Negative',
    admissionDate: '2026-11-23 (Day 5)',
    department: 'Gastroenterology & Surgery',
    ward: 'General Ward Block A',
    bedNumber: 'GEN-04',
    attendingPhysician: 'Dr. Sundaramoorthy M.',
    primaryDiagnosis: 'Resolving Acute Biliary Pancreatitis (Mild, BISAP 1)',
    icd10: 'K85.10',
    secondaryDiagnoses: ['Cholelithiasis with biliary colic'],
    riskLevel: 'Stable',
    mewsScore: 1,
    resuscitationStatus: 'Full Code',
    allergies: [
      { allergen: 'Ciprofloxacin', reaction: 'Tendon tenderness & nausea', severity: 'Mild' }
    ],
    vitals: [
      { timestamp: '08:00 AM', heartRate: 74, systolicBP: 122, diastolicBP: 78, spO2: 99, respiratoryRate: 16, temperature: 36.7, gcsScore: 15 }
    ],
    currentVitals: {
      timestamp: 'Today, 02:30 PM',
      heartRate: 74,
      systolicBP: 122,
      diastolicBP: 78,
      spO2: 99,
      respiratoryRate: 16,
      temperature: 36.7,
      gcsScore: 15
    },
    medications: [
      { id: 'm-20', name: 'Pantoprazole', dosage: '40 mg', frequency: 'OD (Empty Stomach)', route: 'Oral', indication: 'PPI gastroprotection', startDate: '2026-11-23', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' },
      { id: 'm-21', name: 'Paracetamol (Acetaminophen)', dosage: '650 mg', frequency: 'TDS (PRN)', route: 'Oral', indication: 'Analgesia', startDate: '2026-11-23', status: 'Active', prescribingDoctor: 'Dr. Sundaramoorthy M.' }
    ],
    labs: [
      { id: 'l-17', testName: 'Serum Amylase', category: 'Biochemistry', value: '72', unit: 'U/L', referenceRange: '30 - 110 U/L', status: 'Normal', timestamp: 'Today, 09:00 AM', notes: 'Normalized from 890 U/L at admission.' },
      { id: 'l-18', testName: 'Serum Lipase', category: 'Biochemistry', value: '54', unit: 'U/L', referenceRange: '10 - 60 U/L', status: 'Normal', timestamp: 'Today, 09:00 AM', notes: 'Normalized from 1,240 U/L.' },
      { id: 'l-19', testName: 'Serum Bilirubin Total', category: 'Biochemistry', value: '0.9', unit: 'mg/dL', referenceRange: '0.2 - 1.2 mg/dL', status: 'Normal', timestamp: 'Today, 09:00 AM' }
    ],
    timeline: [
      { id: 't-12', timestamp: '10:00 AM', date: '2026-11-27', category: 'Physician Note', title: 'Discharge Readiness Evaluation', description: 'Patient has tolerated oral low-fat soft diet for 48 hours without pain recurrence. All enzymes normalized.', actor: 'Dr. Sundaramoorthy M.', severity: 'normal' }
    ],
    medicalHistory: ['Gallstones discovered 2024'],
    surgicalHistory: ['None'],
    clinicalObservations: 'Abdomen soft, non-tender, bowel sounds active in all 4 quadrants. Ambulatory without assistance.',
    doctorNotes: 'Eligible for planned elective laparoscopic cholecystectomy in 4 weeks. Fit for discharge today.',
    dischargeReady: true,
    assignedNurse: 'Staff Nurse Deepa'
  }
];

export const INITIAL_EARLY_WARNING_ALERTS: EarlyWarningAlertItem[] = [
  {
    id: 'ewa-01',
    patientId: 'PT-8942',
    patientName: 'Murugan Selvam',
    ward: 'ICU Complex',
    bed: 'ICU-08',
    timestamp: '15 mins ago',
    triggerParam: 'Blood Lactate & MAP',
    triggerValue: 'Lactate 3.8 mmol/L, MAP 64 mmHg',
    threshold: 'Lactate > 2.0 mmol/L, MAP < 65',
    mewsScore: 7,
    severity: 'Critical',
    status: 'Active',
    reason: 'Persistent hyperlactatemia in septic shock indicating cellular hypoperfusion despite vasopressor support.',
    suggestedAction: 'Titrate Noradrenaline infusion, check repeated blood gas, consider invasive arterial line transducer zeroing.'
  },
  {
    id: 'ewa-02',
    patientId: 'PT-8946',
    patientName: 'Ramesh Balan',
    ward: 'Emergency Triage',
    bed: 'EMG-02',
    timestamp: '30 mins ago',
    triggerParam: 'Heart Rate & Hemoglobin',
    triggerValue: 'HR 116 bpm, Hb 8.4 g/dL',
    threshold: 'HR > 110, Acute drop in Hb > 2 g/dL',
    mewsScore: 8,
    severity: 'Critical',
    status: 'Nurse Assigned',
    reason: 'Post-traumatic hemorrhagic shock compensatory tachycardia with intercostal drainage continuing.',
    suggestedAction: 'Accelerate blood cross-matching, infuse 2nd unit PRBC under pressure infusor, prep for OR theater call.'
  },
  {
    id: 'ewa-03',
    patientId: 'PT-8941',
    patientName: 'Kavitha Ramasamy',
    ward: 'ICU Complex',
    bed: 'ICU-04',
    timestamp: '45 mins ago',
    triggerParam: 'Respiratory Rate & SpO2',
    triggerValue: 'RR 22, SpO2 94%',
    threshold: 'SpO2 < 95% on room air',
    mewsScore: 4,
    severity: 'Needs Attention',
    status: 'Acknowledged',
    reason: 'Mild pulmonary congestion post-PCI with fluid retention.',
    suggestedAction: 'Low-flow nasal prongs (2 L/min) active. Recheck chest sounds and response to IV Lasix.'
  }
];

export const INITIAL_HANDOVERS: ClinicalHandoverItem[] = [
  {
    id: 'hnd-01',
    patientId: 'PT-8942',
    patientName: 'Murugan Selvam',
    bedNumber: 'ICU-08',
    ward: 'ICU Complex',
    clinicalSummary: '64M with Severe CAP and Septic Shock on HFNC 50% FiO2 and Noradrenaline infusion 0.08 mcg/kg/min.',
    criticalIssues: ['Blood lactate elevated at 3.8 mmol/L', 'SpO2 hovering 93-94% on HFNC', 'Urine output 25 mL/hr over last 2 hours'],
    pendingInvestigations: ['Repeat ABG and lactate at 16:00', 'Blood culture bottle #2 aerobic incubation check', 'Serum Creatinine repeat'],
    outstandingTasks: ['Maintain MAP > 65 mmHg', 'Notify ICU attending immediately if PaO2/FiO2 ratio falls < 150 (intubation threshold)'],
    handoverFrom: 'Dr. Sundaramoorthy M.',
    handoverTo: 'Dr. Radhakrishnan K. (Night Lead)',
    timestamp: 'Today, 02:00 PM',
    shift: 'Morning -> Evening',
    status: 'Completed'
  },
  {
    id: 'hnd-02',
    patientId: 'PT-8946',
    patientName: 'Ramesh Balan',
    bedNumber: 'EMG-02',
    ward: 'Emergency Triage',
    clinicalSummary: '34M polytrauma after RTA: Right femur fracture, multiple rib fractures, right hemopneumothorax post-chest drain.',
    criticalIssues: ['Chest tube drained 450 mL dark blood (slowed down to 30 mL/hr)', 'Tachycardic at 116 bpm', 'Hemoglobin 8.4 g/dL'],
    pendingInvestigations: ['Repeat cross-match for 2 additional units PRBC', 'Post-procedure chest X-ray reading for tube placement confirmation'],
    outstandingTasks: ['Ensure OR team is ready for emergent femur ex-fix at 17:00', 'Monitor chest tube output hourly'],
    handoverFrom: 'Dr. Alex Rivera',
    handoverTo: 'Dr. S. Narayanan (Trauma On-Call)',
    timestamp: 'Today, 01:30 PM',
    shift: 'Morning -> Evening',
    status: 'Pending Review'
  }
];

export const INITIAL_DOCTOR_NURSE_TASKS: DoctorNurseTaskItem[] = [
  {
    id: 'dnt-01',
    patientId: 'PT-8942',
    patientName: 'Murugan Selvam',
    ward: 'ICU Complex',
    bed: 'ICU-08',
    taskType: 'Vital Check',
    instruction: 'Record hourly Mean Arterial Pressure (MAP) and notify if MAP drops below 65 mmHg.',
    doctorName: 'Dr. Radhakrishnan K.',
    assignedNurse: 'Nurse Anitha R.',
    timestamp: 'Today, 01:00 PM',
    priority: 'Stat (Immediate)',
    status: 'In Progress',
    nurseObservation: 'MAP current 68 mmHg on 0.08 mcg Noradrenaline. Patient resting.'
  },
  {
    id: 'dnt-02',
    patientId: 'PT-8941',
    patientName: 'Kavitha Ramasamy',
    ward: 'ICU Complex',
    bed: 'ICU-04',
    taskType: 'Medication Administration',
    instruction: 'Administer IV Furosemide (Lasix) 20 mg slow push. Measure 2-hour urinary output.',
    doctorName: 'Dr. Sundaramoorthy M.',
    assignedNurse: 'Sr. Nurse Lavanya M.',
    timestamp: 'Today, 12:20 PM',
    priority: 'Urgent',
    status: 'Completed',
    nurseObservation: 'Given at 12:25 PM. 2-hour urine volume: 380 mL clear amber urine. Patient reports relief from breathlessness.',
    completedAt: '02:30 PM'
  },
  {
    id: 'dnt-03',
    patientId: 'PT-8946',
    patientName: 'Ramesh Balan',
    ward: 'Emergency Triage',
    bed: 'EMG-02',
    taskType: 'Assessment',
    instruction: 'Inspect right chest drain canister hourly. Alert if continuous bubbling appears in water seal or blood > 100 mL/hr.',
    doctorName: 'Dr. Alex Rivera',
    assignedNurse: 'Nurse Karthik R.',
    timestamp: 'Today, 12:15 PM',
    priority: 'Stat (Immediate)',
    status: 'In Progress',
    nurseObservation: 'Last hour drainage: 25 mL. Water seal level swinging with ventilation. No air leak.'
  },
  {
    id: 'dnt-04',
    patientId: 'PT-8947',
    patientName: 'Govindasamy N.',
    ward: 'ICU Complex',
    bed: 'ICU-10',
    taskType: 'Lab Collection',
    instruction: 'Check bedside point-of-care capillary blood glucose (CBG) hourly and titrate Regular Insulin per sliding protocol.',
    doctorName: 'Dr. Priya Sundaram',
    assignedNurse: 'Nurse Sandhiya P.',
    timestamp: 'Today, 11:00 AM',
    priority: 'Urgent',
    status: 'In Progress',
    nurseObservation: 'Current CBG 238 mg/dL (was 290 mg/dL). Infusion running at 4 Units/hr.'
  }
];

export const KNOWN_DRUG_INTERACTIONS: DrugInteractionAlert[] = [
  {
    id: 'di-01',
    drugs: ['Aspirin (Ecosprin)', 'Ticagrelor (Brilinta)'],
    severity: 'Moderate',
    effect: 'Increased bleeding risk with dual antiplatelet therapy (DAPT).',
    recommendation: 'Standard post-PCI therapy. Monitor for GI bleeding, hematuria, or puncture site oozing. Routine PPI co-prescription indicated.'
  },
  {
    id: 'di-02',
    drugs: ['Vancomycin', 'Furosemide (Lasix)'],
    severity: 'Major',
    effect: 'Synergistic nephrotoxicity and potential ototoxicity.',
    recommendation: 'Monitor serum trough Vancomycin levels and daily serum Creatinine / eGFR.'
  },
  {
    id: 'di-03',
    drugs: ['Metoprolol', 'Noradrenaline'],
    severity: 'Moderate',
    effect: 'Beta-blockade may antagonize positive inotropic effect of adrenergic agonists and cause unopposed alpha-mediated vasoconstriction.',
    recommendation: 'Use caution in cardiogenic shock. Titrate vasopressor according to continuous arterial line telemetry.'
  }
];

export const OUTBREAK_CLUSTERS: OutbreakPatternItem[] = [
  {
    id: 'ob-01',
    ward: 'General Ward Block A',
    clusterType: 'Acute Febrile Gastroenteritis Cluster',
    suspectedPathogen: 'Norovirus / Enteric Salmonella',
    patientCount: 4,
    patientsInvolved: ['PT-8940 (Devi Saravanan)', 'PT-8945 (Subramanian V)', 'PT-8933 (Ganesh T.)', 'PT-8936 (Malarvizhi R.)'],
    commonSymptoms: ['Watery diarrhea', 'Low-grade pyrexia (37.8-38.2°C)', 'Nausea & abdominal cramping'],
    timePeriod: 'Last 36 hours (Cluster detected 2026-11-26 to 2026-11-27)',
    riskSeverity: 'High',
    infectionControlStatus: 'Quarantine Recommended',
    suggestedProtocol: 'Initiate cohort isolation of affected bay. Send stool viral PCR and bacterial culture. Enforce bleach-based surface disinfection and strict contact isolation for ward staff.'
  },
  {
    id: 'ob-02',
    ward: 'Pediatric Ward Block C',
    clusterType: 'Acute Viral Bronchiolitis Surge',
    suspectedPathogen: 'Respiratory Syncytial Virus (RSV)',
    patientCount: 6,
    patientsInvolved: ['PT-8951', 'PT-8952', 'PT-8954', 'PT-8955', 'PT-8958', 'PT-8960'],
    commonSymptoms: ['Tachypnea', 'Subcostal retractions', 'Bilateral fine crackles', 'Rhinorrhea'],
    timePeriod: 'Last 72 hours',
    riskSeverity: 'Moderate',
    infectionControlStatus: 'Active Monitoring',
    suggestedProtocol: 'Cohort infants with RSV. Ensure dedicated pulse oximeter probes per bed. Nebulizer sanitization audit.'
  }
];

export const DOCTOR_ANALYTICS_METRICS = {
  activeInpatientsCount: 6,
  criticalPatientsCount: 2,
  averageLengthOfStay: '4.2 Days',
  pendingInvestigationsCount: 7,
  pendingAdmissionsCount: 3,
  handoverComplianceRate: '100%',
  clinicalAlertResponseTime: '3.4 Minutes',
  opdConsultationsToday: 18,
  departmentCensus: [
    { department: 'Critical Care (ICU)', count: 3, percentage: 50 },
    { department: 'General Medicine', count: 1, percentage: 17 },
    { department: 'Trauma & Emergency', count: 1, percentage: 17 },
    { department: 'Gastroenterology', count: 1, percentage: 16 }
  ],
  mewsDistribution: [
    { tier: 'Stable (0-2)', count: 2, color: '#15803D' },
    { tier: 'Needs Attention (3-4)', count: 2, color: '#D97706' },
    { tier: 'High Risk (5-6)', count: 1, color: '#EA580C' },
    { tier: 'Critical (>= 7)', count: 1, color: '#DC2626' }
  ]
};
