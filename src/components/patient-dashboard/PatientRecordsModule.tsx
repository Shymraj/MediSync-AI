import React, { useState } from 'react';
import {
  User,
  FileText,
  Activity,
  Calendar,
  Pill,
  FlaskConical,
  Bed,
  Search,
  Printer,
  Download,
  ChevronRight,
  Clock,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Stethoscope,
  X,
  Eye,
  FileCheck,
  Building2,
  Droplet,
  Shield,
  ArrowRight
} from 'lucide-react';

export interface PatientProfileRecord {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  address: string;
  allergies: Array<{ allergen: string; severity: 'High' | 'Moderate' | 'Mild'; reaction: string }>;
  currentStatus: {
    badge: string;
    type: 'outpatient' | 'inpatient' | 'emergency';
    activeToken?: string;
    assignedDoctor: string;
    department: string;
    lastVisitDate: string;
    vitals: {
      bp: string;
      pulse: number;
      spo2: number;
      sugar: string;
      temp: string;
    };
  };
  medicalHistory: {
    chronicConditions: Array<{ name: string; diagnosedYear: string; status: string; notes: string }>;
    pastSurgeries: Array<{ procedure: string; date: string; surgeon: string; hospital: string; outcome: string }>;
    existingHealthIssues: Array<{ issue: string; duration: string; severity: string }>;
    familyHistory: Array<{ relation: string; condition: string }>;
  };
  visitHistory: Array<{
    id: string;
    visitDate: string;
    doctorName: string;
    doctorSpecialty: string;
    department: string;
    hospitalName: string;
    visitReason: string;
    diagnosis: string;
    treatmentAdvice: string;
    tokenNumber?: string;
  }>;
  prescriptions: Array<{
    id: string;
    prescribedDate: string;
    doctorName: string;
    department: string;
    medications: Array<{
      name: string;
      genericName: string;
      dosage: string;
      frequency: string;
      timing: string;
      duration: string;
      instructions: string;
      status: 'Active' | 'Completed';
    }>;
  }>;
  labReports: Array<{
    id: string;
    testName: string;
    category: 'Blood Test' | 'Imaging / Scan' | 'Cardiac' | 'Pathology';
    testDate: string;
    labName: string;
    doctorName: string;
    status: 'Normal' | 'Abnormal' | 'Borderline';
    summary: string;
    details: Array<{ parameter: string; result: string; unit: string; referenceRange: string; status: 'normal' | 'high' | 'low' }>;
  }>;
  admissions: Array<{
    id: string;
    admissionDate: string;
    dischargeDate: string;
    durationDays: number;
    ward: string;
    bedNumber: string;
    hospitalName: string;
    admittingDiagnosis: string;
    treatingDoctor: string;
    proceduresDone: string;
    dischargeSummary: string;
    followupAdvice: string;
    status: 'Discharged' | 'Active Inpatient';
  }>;
}

// Pre-populated Comprehensive Medical Records for Citizens
const PATIENTS_DATA: PatientProfileRecord[] = [
  {
    id: 'PID-TN-2026-8841',
    uhid: 'CMCHIS-TN-98401288',
    name: 'Muralitharan M',
    age: 32,
    gender: 'Male',
    phone: '+91 98401 22345',
    bloodGroup: 'O+ Positive',
    emergencyContact: {
      name: 'Suresh M',
      relationship: 'Brother',
      phone: '+91 98402 33456'
    },
    address: 'No. 42, Bharathiyar Street, Anna Nagar, Chennai - 600040',
    allergies: [
      { allergen: 'Penicillin & Amoxicillin', severity: 'High', reaction: 'Severe skin erythema, urticaria & facial swelling' },
      { allergen: 'Ibuprofen (NSAIDs)', severity: 'Moderate', reaction: 'Acute dyspepsia and mild bronchospasm' },
      { allergen: 'Shellfish / Prawns', severity: 'Mild', reaction: 'Localized pruritus (itching) on palms' }
    ],
    currentStatus: {
      badge: 'Active OPD Token Registered',
      type: 'outpatient',
      activeToken: 'TK-COIM-274',
      assignedDoctor: 'Dr. Sundaramoorthy M., MD',
      department: 'General Medicine (Counter 1)',
      lastVisitDate: '27 Nov 2026',
      vitals: {
        bp: '120/80 mmHg',
        pulse: 74,
        spo2: 99,
        sugar: '96 mg/dL',
        temp: '98.4 °F'
      }
    },
    medicalHistory: {
      chronicConditions: [
        { name: 'Type 2 Diabetes Mellitus', diagnosedYear: '2022', status: 'Well Controlled on Oral Hypoglycemics', notes: 'Maintained with Metformin 500mg SR and dietary regulation.' },
        { name: 'Mild Essential Hypertension', diagnosedYear: '2023', status: 'Normotensive on Telmisartan 40mg', notes: 'Regular morning home monitoring 120/80 mmHg.' },
        { name: 'Seasonal Bronchial Allergy', diagnosedYear: '2020', status: 'Intermittent SOS', notes: 'Aggravated during cold climate & construction dust exposure.' }
      ],
      pastSurgeries: [
        { procedure: 'Laparoscopic Appendectomy', date: '15 Jun 2021', surgeon: 'Dr. K. Venkatraman, MS, MCh', hospital: 'Rajiv Gandhi Govt General Hospital (RGGGH)', outcome: 'Uneventful recovery. Sutures removed on POD 7.' },
        { procedure: 'Diagnostic Upper GI Endoscopy', date: '04 Mar 2023', surgeon: 'Dr. S. Meenakshisundaram, MD, DM', hospital: 'Government Rajaji Hospital, Madurai', outcome: 'Mild antral gastritis; H. pylori negative. Managed medically.' }
      ],
      existingHealthIssues: [
        { issue: 'Mild Lumbar Strain', duration: '3 months', severity: 'Mild' },
        { issue: 'Recurrent Seasonal Pharyngitis', duration: '2 years', severity: 'Mild-Moderate' }
      ],
      familyHistory: [
        { relation: 'Father (68 Yrs)', condition: 'Hypertension and Ischemic Heart Disease' },
        { relation: 'Mother (62 Yrs)', condition: 'Type 2 Diabetes Mellitus' }
      ]
    },
    visitHistory: [
      {
        id: 'VIS-2026-1127',
        visitDate: '27 Nov 2026 • 09:30 AM',
        doctorName: 'Dr. Sundaramoorthy M., MD',
        doctorSpecialty: 'Senior Civil Surgeon, General Medicine',
        department: 'General Medicine',
        hospitalName: 'Coimbatore Medical College Hospital (CMCH)',
        visitReason: 'High fever, persistent dry cough and throat irritation for 2 days',
        diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with pharyngitis',
        treatmentAdvice: 'Advised warm saline gargling, hydration, oral antibiotics and review after 3 days if fever persists.',
        tokenNumber: 'TK-COIM-274'
      },
      {
        id: 'VIS-2026-1014',
        visitDate: '14 Oct 2026 • 11:15 AM',
        doctorName: 'Dr. Arun Kumar, MD, DM',
        doctorSpecialty: 'Associate Professor, Cardiology',
        department: 'Cardiology OPD',
        hospitalName: 'Rajiv Gandhi Govt General Hospital (RGGGH)',
        visitReason: 'Routine annual hypertension & cardiac risk checkup',
        diagnosis: 'Well-controlled Essential Hypertension, normal resting 12-lead ECG',
        treatmentAdvice: 'Continue Telmisartan 40mg 1-0-0. Annual lipid profile recommended in next visit.',
        tokenNumber: 'TC-RAJ-757'
      },
      {
        id: 'VIS-2026-0805',
        visitDate: '05 Aug 2026 • 02:40 PM',
        doctorName: 'Dr. Priya Dharshini, MS',
        doctorSpecialty: 'Assistant Surgeon, ENT',
        department: 'Otolaryngology (ENT)',
        hospitalName: 'Government Rajaji Hospital, Madurai',
        visitReason: 'Bilateral ear fullness and seasonal nasal congestion',
        diagnosis: 'Allergic Rhinosinusitis with Eustachian Tube dysfunction',
        treatmentAdvice: 'Steam inhalation twice daily, Nasal steroid spray for 10 days, Levocetirizine at bedtime.',
        tokenNumber: 'TK-MADU-653'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-8841-A',
        prescribedDate: '27 Nov 2026',
        doctorName: 'Dr. Sundaramoorthy M., MD (General Medicine)',
        department: 'General Medicine OPD • Counter 1',
        medications: [
          {
            name: 'Paracetamol Tablets IP 650mg',
            genericName: 'Paracetamol / Acetaminophen',
            dosage: '650mg',
            frequency: '1-0-1 (காலை, இரவு)',
            timing: 'After Food (உணவுக்குப் பின்)',
            duration: '3 Days',
            instructions: 'Take 1 tablet every 8 hours SOS if oral temperature > 99.5°F.',
            status: 'Active'
          },
          {
            name: 'Azithromycin Tablets IP 500mg',
            genericName: 'Azithromycin Dihydrate',
            dosage: '500mg',
            frequency: '1-0-0 (காலை மட்டும்)',
            timing: '1 Hour Before Food (உணவுக்கு 1 மணி நேரத்திற்கு முன்)',
            duration: '5 Days',
            instructions: 'Complete full 5-day course without skipping any dose.',
            status: 'Active'
          },
          {
            name: 'Metformin Hydrochloride Prolonged-Release IP 500mg',
            genericName: 'Metformin HCl (SR)',
            dosage: '500mg',
            frequency: '0-0-1 (இரவு)',
            timing: 'With / Immediately After Dinner (இரவு உணவோடு)',
            duration: '30 Days',
            instructions: 'Regular chronic medication for glycemic maintenance.',
            status: 'Active'
          },
          {
            name: 'Telmisartan Tablets IP 40mg',
            genericName: 'Telmisartan',
            dosage: '40mg',
            frequency: '1-0-0 (காலை)',
            timing: 'Morning After Breakfast (காலை உணவுக்குப் பின்)',
            duration: '30 Days',
            instructions: 'Daily early morning dose. Check blood pressure fortnightly.',
            status: 'Active'
          },
          {
            name: 'Levocetirizine Hydrochloride 5mg',
            genericName: 'Levocetirizine HCl',
            dosage: '5mg',
            frequency: '0-0-1 (இரவு)',
            timing: 'At Bedtime (தூங்கும் முன்)',
            duration: '5 Days',
            instructions: 'For allergic rhinitis and dry cough relief.',
            status: 'Active'
          }
        ]
      },
      {
        id: 'RX-2026-8841-B',
        prescribedDate: '14 Oct 2026',
        doctorName: 'Dr. Arun Kumar, MD, DM (Cardiology)',
        department: 'Cardiology OPD • Room 204',
        medications: [
          {
            name: 'Telmisartan Tablets IP 40mg',
            genericName: 'Telmisartan',
            dosage: '40mg',
            frequency: '1-0-0',
            timing: 'Morning',
            duration: '30 Days',
            instructions: 'Refilled for hypertension management.',
            status: 'Completed'
          },
          {
            name: 'Rosuvastatin Tablets IP 10mg',
            genericName: 'Rosuvastatin Calcium',
            dosage: '10mg',
            frequency: '0-0-1',
            timing: 'Bedtime',
            duration: '30 Days',
            instructions: 'For lipid and plaque stabilization.',
            status: 'Completed'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'LAB-2026-8841-CBC',
        testName: 'Complete Blood Count (CBC) with Automated Differential',
        category: 'Blood Test',
        testDate: '27 Nov 2026 • 10:45 AM',
        labName: 'Central Clinical Biochemistry & Hematology Lab, CMCH',
        doctorName: 'Dr. Sundaramoorthy M.',
        status: 'Normal',
        summary: 'All hematological indices within expected adult reference parameters.',
        details: [
          { parameter: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal' },
          { parameter: 'Total WBC Count', result: '8,400', unit: '/mcL', referenceRange: '4,000 - 11,000', status: 'normal' },
          { parameter: 'Platelet Count', result: '2.6', unit: 'Lakhs/mcL', referenceRange: '1.5 - 4.5', status: 'normal' },
          { parameter: 'Neutrophils', result: '62', unit: '%', referenceRange: '40 - 75', status: 'normal' },
          { parameter: 'Lymphocytes', result: '30', unit: '%', referenceRange: '20 - 45', status: 'normal' },
          { parameter: 'Erythrocyte Sedimentation Rate (ESR)', result: '12', unit: 'mm/1st hr', referenceRange: '0 - 15', status: 'normal' }
        ]
      },
      {
        id: 'LAB-2026-8841-GLU',
        testName: 'Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose',
        category: 'Blood Test',
        testDate: '12 Nov 2026 • 08:30 AM',
        labName: 'Apex Diagnostic Biochemistry Center, RGGGH Chennai',
        doctorName: 'Dr. Arun Kumar',
        status: 'Normal',
        summary: 'Good glycemic control maintained over preceding 90 days.',
        details: [
          { parameter: 'HbA1c (Glycosylated Hemoglobin)', result: '6.4', unit: '%', referenceRange: '< 6.5 (Controlled)', status: 'normal' },
          { parameter: 'Estimated Average Glucose (eAG)', result: '137', unit: 'mg/dL', referenceRange: '100 - 140', status: 'normal' },
          { parameter: 'Fasting Blood Sugar (FBS)', result: '96', unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal' },
          { parameter: 'Post-Prandial Blood Sugar (PPBS)', result: '132', unit: 'mg/dL', referenceRange: '< 140', status: 'normal' }
        ]
      },
      {
        id: 'LAB-2026-8841-CXR',
        testName: 'Digital Chest X-Ray (Postero-Anterior PA View)',
        category: 'Imaging / Scan',
        testDate: '15 Oct 2026 • 12:15 PM',
        labName: 'Department of Radiodiagnosis & Imaging, RGGGH',
        doctorName: 'Dr. R. Kannan, MD (Radiology)',
        status: 'Normal',
        summary: 'Bilateral lung fields clear. Trachea midline. Normal cardiothoracic ratio. Both costophrenic angles sharp. No acute pleuro-parenchymal lesion.',
        details: [
          { parameter: 'Bilateral Lung Fields', result: 'Clear & Well Aerated', unit: '-', referenceRange: 'Clear', status: 'normal' },
          { parameter: 'Cardiothoracic Ratio (CTR)', result: '46%', unit: '%', referenceRange: '< 50%', status: 'normal' },
          { parameter: 'Costophrenic & Cardiophrenic Angles', result: 'Sharp & Free', unit: '-', referenceRange: 'Free', status: 'normal' },
          { parameter: 'Bony Thorax & Soft Tissues', result: 'Normal Unremarkable', unit: '-', referenceRange: 'Normal', status: 'normal' }
        ]
      },
      {
        id: 'LAB-2026-8841-ECG',
        testName: '12-Lead Resting Electrocardiogram (ECG)',
        category: 'Cardiac',
        testDate: '14 Oct 2026 • 11:30 AM',
        labName: 'Non-Invasive Cardiac Lab, Cardiology Dept, RGGGH',
        doctorName: 'Dr. Arun Kumar, MD, DM',
        status: 'Normal',
        summary: 'Normal Sinus Rhythm. Heart rate 72 bpm. PR interval 158 ms. QRS duration 86 ms. QTc 412 ms. No ST-T changes or signs of ischemia.',
        details: [
          { parameter: 'Ventricular Heart Rate', result: '72', unit: 'bpm', referenceRange: '60 - 100', status: 'normal' },
          { parameter: 'Cardiac Rhythm', result: 'Normal Sinus Rhythm', unit: '-', referenceRange: 'Sinus', status: 'normal' },
          { parameter: 'PR Interval', result: '158', unit: 'ms', referenceRange: '120 - 200', status: 'normal' },
          { parameter: 'QRS Axis & Duration', result: '86', unit: 'ms', referenceRange: '70 - 110', status: 'normal' }
        ]
      }
    ],
    admissions: [
      {
        id: 'ADM-2021-0614',
        admissionDate: '14 Jun 2021 • 10:15 AM',
        dischargeDate: '18 Jun 2021 • 04:00 PM',
        durationDays: 4,
        ward: 'Surgical Inpatient Ward Block C (Floor 2)',
        bedNumber: 'Bed #SW-24',
        hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
        admittingDiagnosis: 'Acute Appendicitis with Localized Peritoneal Signs',
        treatingDoctor: 'Dr. K. Venkatraman, MS, MCh (Professor of Surgery)',
        proceduresDone: 'Emergency Laparoscopic Appendectomy under General Anesthesia on 14 Jun 2021',
        dischargeSummary: 'Patient tolerated laparoscopic surgery well. Post-operative period uneventful. Oral liquids commenced POD 1 followed by soft diet. Afebrile at discharge. Minimal port-site serous ooze, sutures clean and intact.',
        followupAdvice: 'Advised oral Cefixime 200mg BD for 5 days. High protein diet. Wound inspection & suture removal scheduled on 21 Jun 2021.',
        status: 'Discharged'
      }
    ]
  },
  {
    id: 'PID-TN-2026-9214',
    uhid: 'CMCHIS-TN-22345109',
    name: 'Karthik Subramanian',
    age: 28,
    gender: 'Male',
    phone: '+91 98401 22345',
    bloodGroup: 'B+ Positive',
    emergencyContact: {
      name: 'Muralitharan M',
      relationship: 'Brother',
      phone: '+91 98401 22345'
    },
    address: 'No. 42, Bharathiyar Street, Anna Nagar, Chennai - 600040',
    allergies: [
      { allergen: 'Sulfa Drugs (Sulfonamides)', severity: 'Moderate', reaction: 'Maculopapular cutaneous rash' }
    ],
    currentStatus: {
      badge: 'Active Token #TK-COIM-274',
      type: 'outpatient',
      activeToken: 'TK-COIM-274',
      assignedDoctor: 'Dr. Sundaramoorthy M.',
      department: 'General Medicine',
      lastVisitDate: '27 Nov 2026',
      vitals: {
        bp: '118/76 mmHg',
        pulse: 78,
        spo2: 99,
        sugar: '92 mg/dL',
        temp: '98.6 °F'
      }
    },
    medicalHistory: {
      chronicConditions: [
        { name: 'Mild Allergic Sinusitis', diagnosedYear: '2024', status: 'Intermittent', notes: 'Symptomatic during rainy weather.' }
      ],
      pastSurgeries: [],
      existingHealthIssues: [
        { issue: 'Seasonal Cold & Sneezing', duration: '1 week', severity: 'Mild' }
      ],
      familyHistory: [
        { relation: 'Paternal Grandfather', condition: 'Type 2 Diabetes' }
      ]
    },
    visitHistory: [
      {
        id: 'VIS-2026-0910',
        visitDate: '10 Sep 2026 • 10:00 AM',
        doctorName: 'Dr. Sundaramoorthy M.',
        doctorSpecialty: 'General Medicine',
        department: 'General Medicine',
        hospitalName: 'Coimbatore Medical College Hospital',
        visitReason: 'General fitness checkup and vaccination booster review',
        diagnosis: 'Healthy adult; vitals normal',
        treatmentAdvice: 'Maintain active lifestyle and routine hydration.',
        tokenNumber: 'TK-COIM-102'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-9214-A',
        prescribedDate: '10 Sep 2026',
        doctorName: 'Dr. Sundaramoorthy M.',
        department: 'General Medicine',
        medications: [
          {
            name: 'Multivitamin with Zinc Tablets',
            genericName: 'Multivitamins & Minerals',
            dosage: '1 Tablet',
            frequency: '1-0-0',
            timing: 'After Breakfast',
            duration: '15 Days',
            instructions: 'Nutritional supplement.',
            status: 'Completed'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'LAB-2026-9214-CBC',
        testName: 'Complete Blood Count (Routine Screen)',
        category: 'Blood Test',
        testDate: '10 Sep 2026 • 11:00 AM',
        labName: 'Central Lab CMCH',
        doctorName: 'Dr. Sundaramoorthy M.',
        status: 'Normal',
        summary: 'Normal blood count parameters.',
        details: [
          { parameter: 'Hemoglobin', result: '15.1', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal' },
          { parameter: 'Total WBC', result: '7,200', unit: '/mcL', referenceRange: '4,000 - 11,000', status: 'normal' },
          { parameter: 'Platelets', result: '2.8', unit: 'Lakhs/mcL', referenceRange: '1.5 - 4.5', status: 'normal' }
        ]
      }
    ],
    admissions: []
  },
  {
    id: 'PID-TN-2026-4402',
    uhid: 'CMCHIS-TN-44021980',
    name: 'Meenakshi Sundaram',
    age: 61,
    gender: 'Female',
    phone: '+91 98401 22345',
    bloodGroup: 'A+ Positive',
    emergencyContact: {
      name: 'Muralitharan M',
      relationship: 'Son',
      phone: '+91 98401 22345'
    },
    address: 'No. 42, Bharathiyar Street, Anna Nagar, Chennai - 600040',
    allergies: [
      { allergen: 'Ciprofloxacin', severity: 'Moderate', reaction: 'Nausea & generalized itchiness' }
    ],
    currentStatus: {
      badge: 'Senior Citizen Care Registered',
      type: 'outpatient',
      assignedDoctor: 'Dr. Arun Kumar, MD, DM',
      department: 'Geriatric & Cardiology',
      lastVisitDate: '18 Oct 2026',
      vitals: {
        bp: '132/84 mmHg',
        pulse: 76,
        spo2: 98,
        sugar: '118 mg/dL',
        temp: '98.2 °F'
      }
    },
    medicalHistory: {
      chronicConditions: [
        { name: 'Osteoarthritis (Bilateral Knees)', diagnosedYear: '2019', status: 'Grade II Managed with Physio', notes: 'Advised quad strengthening exercises.' },
        { name: 'Primary Hypertension', diagnosedYear: '2015', status: 'Controlled on Amlodipine 5mg', notes: 'Daily morning pill.' }
      ],
      pastSurgeries: [
        { procedure: 'Cataract Surgery with IOL (Right Eye)', date: '12 Jan 2022', surgeon: 'Dr. R. Shanthi', hospital: 'Regional Institute of Ophthalmology, Chennai', outcome: 'Visual acuity restored to 6/6.' }
      ],
      existingHealthIssues: [
        { issue: 'Joint stiffness in morning', duration: '3 years', severity: 'Moderate' }
      ],
      familyHistory: []
    },
    visitHistory: [
      {
        id: 'VIS-2026-1018',
        visitDate: '18 Oct 2026 • 11:00 AM',
        doctorName: 'Dr. Arun Kumar, MD, DM',
        doctorSpecialty: 'Cardiologist',
        department: 'Cardiology & Geriatrics',
        hospitalName: 'Rajiv Gandhi Govt General Hospital',
        visitReason: 'Senior citizen quarterly cardiac checkup',
        diagnosis: 'Stable hypertension, no signs of heart failure',
        treatmentAdvice: 'Continue present medications. Daily 20 min morning walk recommended.',
        tokenNumber: 'TC-RAJ-412'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-4402-A',
        prescribedDate: '18 Oct 2026',
        doctorName: 'Dr. Arun Kumar',
        department: 'Geriatric Clinic',
        medications: [
          {
            name: 'Amlodipine Besylate 5mg',
            genericName: 'Amlodipine',
            dosage: '5mg',
            frequency: '1-0-0',
            timing: 'Morning',
            duration: '30 Days',
            instructions: 'BP maintenance.',
            status: 'Active'
          },
          {
            name: 'Calcium Carbonate with Vitamin D3',
            genericName: 'Calcium + Vit D3',
            dosage: '500mg',
            frequency: '0-1-0',
            timing: 'After Lunch',
            duration: '30 Days',
            instructions: 'Bone density support.',
            status: 'Active'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'LAB-2026-4402-LIP',
        testName: 'Lipid Profile & Serum Creatinine',
        category: 'Blood Test',
        testDate: '18 Oct 2026 • 11:30 AM',
        labName: 'Central Lab RGGGH',
        doctorName: 'Dr. Arun Kumar',
        status: 'Normal',
        summary: 'Creatinine 0.8 mg/dL (Normal). Lipid levels in target zone.',
        details: [
          { parameter: 'Serum Creatinine', result: '0.8', unit: 'mg/dL', referenceRange: '0.6 - 1.1', status: 'normal' },
          { parameter: 'Total Cholesterol', result: '172', unit: 'mg/dL', referenceRange: '< 200', status: 'normal' },
          { parameter: 'eGFR', result: '88', unit: 'mL/min', referenceRange: '> 60', status: 'normal' }
        ]
      }
    ],
    admissions: []
  }
];

export type RecordTabType = 'overview' | 'medical_history' | 'visits' | 'prescriptions' | 'lab_reports' | 'admissions';

interface PatientRecordsModuleProps {
  hospitalName?: string;
  onNavigateToBooking?: () => void;
  onNavigateToQueue?: () => void;
}

export const PatientRecordsModule: React.FC<PatientRecordsModuleProps> = ({
  hospitalName = 'Rajiv Gandhi Government General Hospital (RGGGH)',
  onNavigateToBooking,
  onNavigateToQueue
}) => {
  // Selected Patient from directory
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PID-TN-2026-8841');
  
  // Selected Tab inside the full profile matching User Images 1 & 2:
  // 1. Overview
  // 2. Medical History
  // 3. Visits
  // 4. Prescriptions
  // 5. Lab Reports
  // 6. Admissions
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTabType>('overview');

  // Search filter across records
  const [searchQuery, setSearchQuery] = useState('');
  
  // Report viewer modal state
  const [selectedLabReport, setSelectedLabReport] = useState<any | null>(null);

  // Active patient object
  const currentPatient = PATIENTS_DATA.find(p => p.id === selectedPatientId) || PATIENTS_DATA[0];

  // Tab definitions matching User Images 1 & 2
  const tabsList = [
    { id: 'overview', label: 'Overview', labelTamil: 'கண்ணோட்டம்', icon: User, desc: 'Basic patient details & current status' },
    { id: 'medical_history', label: 'Medical History', labelTamil: 'மருத்துவ வரலாறு', icon: Activity, desc: 'Past illness, allergies, surgeries' },
    { id: 'visits', label: 'Visits', labelTamil: 'வருகை வரலாறு', icon: Calendar, desc: 'Previous consultation & diagnosis' },
    { id: 'prescriptions', label: 'Prescriptions', labelTamil: 'மருந்து சீட்டுகள்', icon: Pill, desc: 'Medicines prescribed' },
    { id: 'lab_reports', label: 'Lab Reports', labelTamil: 'ஆய்வக அறிக்கைகள்', icon: FlaskConical, desc: 'Test results & reports' },
    { id: 'admissions', label: 'Admissions', labelTamil: 'அனுமதி வரலாறு', icon: Bed, desc: 'Ward, bed, admission & discharge details' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER & PATIENT SELECTOR DIRECTORY               */}
      {/* ======================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-orange-100/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-orange-100/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 text-[#EA580C] border border-orange-200/80 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                GOVERNMENT DIGITAL HEALTH DOSSIER (EHR)
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">• ABDM / CMCHIS Compliant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Patient Medical Records (நோயாளி மருத்துவ ஆவணங்கள்)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Hospital Node: <strong className="text-slate-800">{hospitalName}</strong> • Real-time clinical telemetry & consultation archives
            </p>
          </div>

          {/* Quick Actions: Print Record & Share */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50/50 hover:border-orange-200 text-slate-700 hover:text-[#EA580C] font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Print Complete Patient Medical Dossier"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={() => alert(`Medical Dossier for ${currentPatient.name} downloaded successfully as authenticated PDF under CMCHIS ID: ${currentPatient.uhid}.`)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export PDF (E-Record)</span>
            </button>
          </div>
        </div>

        {/* Patient Switcher Directory (Patient-ah click panna full profile open aaganum) */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <User className="w-4 h-4 text-[#EA580C]" />
            <span>Select Citizen Profile (நோயாளி தேர்வு):</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {PATIENTS_DATA.map((patient) => {
              const isSelected = patient.id === selectedPatientId;
              return (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? 'bg-[#FFF8F2] border-orange-300 text-[#EA580C] shadow-2xs ring-2 ring-orange-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-orange-50/40 hover:text-slate-900'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    isSelected ? 'bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-slate-900 leading-tight">{patient.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight">{patient.bloodGroup} • {patient.age}Y</div>
                  </div>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PATIENT PROFILE BANNER CARD                           */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#FFF5EC] via-[#FFF1E6] to-[#FFE8D6] p-6 rounded-3xl border border-orange-200/90 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Patient Bio & Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 border-2 border-white">
              {currentPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentPatient.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-white/90 text-[#EA580C] border border-orange-200 shadow-2xs">
                  {currentPatient.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentPatient.currentStatus.badge}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap pt-0.5">
                <span>{currentPatient.age} Yrs &bull; {currentPatient.gender}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-bold text-rose-600">
                  <Droplet className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  {currentPatient.bloodGroup}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Phone className="w-3 h-3 text-[#EA580C]" />
                  {currentPatient.phone}
                </span>
                <span>&bull;</span>
                <span className="text-[11px] font-mono text-slate-500">
                  UHID: {currentPatient.uhid}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Emergency Contact: <strong>{currentPatient.emergencyContact.name} ({currentPatient.emergencyContact.relationship})</strong> &bull; {currentPatient.emergencyContact.phone}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Vitals Pill Box */}
          <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-orange-200/80 shadow-2xs shrink-0 grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
            <div className="px-2 py-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{currentPatient.currentStatus.vitals.bp}</div>
              <div className="text-[9px] text-emerald-600 font-bold">Normal</div>
            </div>
            <div className="px-2 py-1 border-l border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Pulse Rate</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{currentPatient.currentStatus.vitals.pulse} bpm</div>
              <div className="text-[9px] text-emerald-600 font-bold">Regular</div>
            </div>
            <div className="px-2 py-1 border-l border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">SpO2 Oxygen</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{currentPatient.currentStatus.vitals.spo2}%</div>
              <div className="text-[9px] text-emerald-600 font-bold">Optimal</div>
            </div>
            <div className="px-2 py-1 border-l border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Fasting Sugar</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{currentPatient.currentStatus.vitals.sugar}</div>
              <div className="text-[9px] text-emerald-600 font-bold">Controlled</div>
            </div>
            <div className="px-2 py-1 border-l border-slate-100 col-span-3 sm:col-span-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Temp</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">{currentPatient.currentStatus.vitals.temp}</div>
              <div className="text-[9px] text-emerald-600 font-bold">Afebrile</div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. THE 6 RECORD TABS (MATCHING USER IMAGES 1 & 2)        */}
      {/* ======================================================== */}
      <div className="bg-white p-1.5 rounded-2xl border border-orange-100/90 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {tabsList.map((tab) => {
          const isActive = activeRecordTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveRecordTab(tab.id as RecordTabType)}
              className={`flex-1 min-w-[155px] py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 font-black'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <TabIcon className="w-3.5 h-3.5" />
                <span className="text-xs">{tab.label}</span>
              </div>
              <span className={`text-[10px] ${isActive ? 'text-orange-100 font-medium' : 'text-slate-400'}`}>
                {tab.labelTamil}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. TAB CONTENTS RENDERING                                */}
      {/* ======================================================== */}

      {/* -------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW (Basic patient details & current status) */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Basic Patient Identity Dossier */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs md:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Demographic & Government ID Details</h4>
                    <p className="text-[11px] text-slate-400">ABDM Health ID & CMCHIS Verified Citizen Information</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Verified Citizen
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Full Name</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{currentPatient.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Patient ID</div>
                  <div className="font-mono font-bold text-[#EA580C] mt-0.5">{currentPatient.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Age / Gender</div>
                  <div className="font-bold text-slate-800 mt-0.5">{currentPatient.age} Years &bull; {currentPatient.gender}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Blood Group</div>
                  <div className="font-extrabold text-rose-600 mt-0.5">{currentPatient.bloodGroup}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Primary Phone</div>
                  <div className="font-bold text-slate-800 mt-0.5">{currentPatient.phone}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</div>
                  <div className="font-bold text-slate-800 mt-0.5">{currentPatient.emergencyContact.name} ({currentPatient.emergencyContact.phone})</div>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Permanent Residential Address</div>
                  <div className="font-medium text-slate-700 mt-0.5">{currentPatient.address}</div>
                </div>
              </div>
            </div>

            {/* Card 2: Current Status & Primary Doctor */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Current Hospital Care Status</h4>
                      <p className="text-[11px] text-slate-400">Active OPD / Triage Information</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Assigned Consulting Doctor</div>
                    <div className="font-black text-slate-900 text-sm mt-0.5">{currentPatient.currentStatus.assignedDoctor}</div>
                    <div className="text-[11px] text-[#EA580C] font-semibold">{currentPatient.currentStatus.department}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Active OPD Token:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800">
                        {currentPatient.currentStatus.activeToken || 'No Active Token'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Last Visit Date:</span>
                      <span className="font-bold">{currentPatient.currentStatus.lastVisitDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onNavigateToBooking}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FFF5ED] hover:bg-[#FFE8D6] text-[#EA580C] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book New OPD Token</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Snapshot of Allergies & Chronic Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Allergies Alert Box */}
            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Documented Medical Allergies (ஒவ்வாமைகள்)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                  {currentPatient.allergies.length} Flagged
                </span>
              </div>

              <div className="space-y-2">
                {currentPatient.allergies.map((allergy, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{allergy.allergen}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{allergy.reaction}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                      allergy.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {allergy.severity} Severity
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Chronic Conditions */}
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#EA580C] font-extrabold text-xs">
                  <Activity className="w-4 h-4 text-[#EA580C]" />
                  <span>Chronic Conditions (நாள்பட்ட நோய்கள்)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-[#EA580C] border border-orange-200">
                  {currentPatient.medicalHistory.chronicConditions.length} Active
                </span>
              </div>

              <div className="space-y-2">
                {currentPatient.medicalHistory.chronicConditions.map((cond, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{cond.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{cond.notes}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Since {cond.diagnosedYear}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 2: MEDICAL HISTORY (Past illness, allergies, surgeries) */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'medical_history' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Section A: Past Surgeries & Procedures */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Past Surgeries & Clinical Procedures (முந்தைய அறுவை சிகிச்சைகள்)</h4>
                  <p className="text-[11px] text-slate-400">Operative summaries & surgical intervention history</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">{currentPatient.medicalHistory.pastSurgeries.length} Recorded</span>
            </div>

            {currentPatient.medicalHistory.pastSurgeries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPatient.medicalHistory.pastSurgeries.map((surg, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{surg.procedure}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {surg.date}
                      </span>
                    </div>
                    <div className="text-slate-600 space-y-1 text-[11px]">
                      <div><strong>Lead Surgeon:</strong> {surg.surgeon}</div>
                      <div><strong>Hospital:</strong> {surg.hospital}</div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                        <strong>Outcome:</strong> {surg.outcome}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No major past surgical procedures recorded.</div>
            )}
          </div>

          {/* Section B: Documented Allergies & Drug Reactions */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Drug, Food & Environmental Allergies (ஒவ்வாமைகள்)</h4>
                  <p className="text-[11px] text-slate-400">Critical safety alerts for attending physicians & nurses</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                CRITICAL WARNINGS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentPatient.allergies.map((allergy, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{allergy.allergen}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      allergy.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {allergy.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{allergy.reaction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Chronic Conditions & Family Medical History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chronic Conditions */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Chronic Diseases & Management Plans
              </h4>
              <div className="space-y-3">
                {currentPatient.medicalHistory.chronicConditions.map((cond, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cond.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Diagnosed: {cond.diagnosedYear}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">{cond.status}</div>
                    <div className="text-[11px] text-slate-500">{cond.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Family Medical History */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Hereditary & Family Health History (குடும்ப மருத்துவ வரலாறு)
              </h4>
              <div className="space-y-3">
                {currentPatient.medicalHistory.familyHistory.length > 0 ? (
                  currentPatient.medicalHistory.familyHistory.map((fam, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{fam.relation}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{fam.condition}</div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Genetic Factor
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">No significant family history recorded.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 3: VISITS (Previous consultation & diagnosis)        */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'visits' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Hospital Consultation & Visit Archive (வருகை வரலாறு)</h4>
                  <p className="text-[11px] text-slate-400">Doctor consultations, chief symptoms, diagnosis & clinical advice</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#EA580C]">{currentPatient.visitHistory.length} Consultations Recorded</span>
            </div>

            {/* Visits Timeline */}
            <div className="space-y-4">
              {currentPatient.visitHistory.map((visit, index) => (
                <div 
                  key={visit.id}
                  className="p-5 rounded-2xl bg-[#FFFDFB] border border-orange-200/70 hover:border-orange-300 transition-all space-y-3.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{visit.doctorName}</div>
                        <div className="text-xs text-[#EA580C] font-semibold">{visit.doctorSpecialty} &bull; {visit.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                        {visit.visitDate}
                      </span>
                      {visit.tokenNumber && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800">
                          {visit.tokenNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visit Clinical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Chief Symptoms & Reason for Visit</div>
                      <div className="font-semibold text-slate-800 leading-relaxed">{visit.visitReason}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-100 space-y-1">
                      <div className="text-[10px] text-[#EA580C] font-bold uppercase">Clinical Diagnosis (நோய் கண்டறிதல்)</div>
                      <div className="font-black text-slate-900 leading-relaxed">{visit.diagnosis}</div>
                    </div>
                  </div>

                  {/* Doctor Advice */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Doctor Treatment Advice:</strong> {visit.treatmentAdvice}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {visit.hospitalName}
                    </span>
                    <button
                      onClick={() => alert(`Consultation summary for visit ${visit.id} exported.`)}
                      className="text-xs font-bold text-[#EA580C] hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Download Consultation Slip</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 4: PRESCRIPTIONS (Medicines prescribed)              */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'prescriptions' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <Pill className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">E-Prescriptions & Medication Schedules (மருந்து சீட்டுகள்)</h4>
                  <p className="text-[11px] text-slate-400">Doctor prescribed medicines, dosage, frequency, duration and timing instructions</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Free Govt Pharmacy Supply
              </span>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-6">
              {currentPatient.prescriptions.map((rx) => (
                <div key={rx.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#EA580C]">{rx.department}</div>
                      <div className="text-sm font-extrabold text-slate-900">Prescribed by {rx.doctorName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                        Date: {rx.prescribedDate}
                      </span>
                      <button
                        onClick={() => alert(`Prescription ${rx.id} downloaded for counter dispensing.`)}
                        className="px-3 py-1 rounded-full bg-[#EA580C] text-white text-xs font-bold hover:bg-orange-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Rx</span>
                      </button>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="pb-2.5">#</th>
                          <th className="pb-2.5">Medicine Name & Formulation</th>
                          <th className="pb-2.5">Dosage</th>
                          <th className="pb-2.5">Frequency (முறை)</th>
                          <th className="pb-2.5">Timing & Instructions</th>
                          <th className="pb-2.5">Duration</th>
                          <th className="pb-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.medications.map((med, mIdx) => (
                          <tr key={mIdx} className="hover:bg-white/80 transition-colors">
                            <td className="py-3 font-bold text-slate-400">{mIdx + 1}</td>
                            <td className="py-3 pr-2">
                              <div className="font-black text-slate-900">{med.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{med.genericName}</div>
                            </td>
                            <td className="py-3 pr-2 font-mono font-bold text-slate-700">{med.dosage}</td>
                            <td className="py-3 pr-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                {med.frequency}
                              </span>
                            </td>
                            <td className="py-3 pr-2">
                              <div className="text-slate-800 font-medium">{med.timing}</div>
                              <div className="text-[10px] text-slate-500">{med.instructions}</div>
                            </td>
                            <td className="py-3 pr-2 font-bold text-slate-700">{med.duration}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                med.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {med.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 5: LAB REPORTS (Test results & reports)              */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'lab_reports' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <FlaskConical className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Laboratory Diagnostics & Imaging Reports (ஆய்வக அறிக்கைகள்)</h4>
                  <p className="text-[11px] text-slate-400">Blood tests, digital radiology scans, ECG & pathology investigations</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#EA580C]">{currentPatient.labReports.length} Reports Archived</span>
            </div>

            {/* Reports Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPatient.labReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-5 rounded-2xl bg-[#FFFDFB] border border-orange-200/80 hover:border-orange-300 transition-all space-y-3.5 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-orange-50 text-[#EA580C] border border-orange-200">
                          {report.category}
                        </span>
                        <h5 className="font-black text-slate-900 text-sm mt-1">{report.testName}</h5>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {report.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <div><strong>Date:</strong> {report.testDate}</div>
                      <div><strong>Facility:</strong> {report.labName}</div>
                      <div><strong>Requested by:</strong> {report.doctorName}</div>
                    </div>

                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                      <strong>Impression:</strong> {report.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-orange-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Report Ref: {report.id}</span>
                    <button
                      onClick={() => setSelectedLabReport(report)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FFF5ED] hover:bg-[#FFE8D6] text-[#EA580C] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Test Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 6: ADMISSIONS (Ward, bed, admission & discharge)     */}
      {/* -------------------------------------------------------- */}
      {activeRecordTab === 'admissions' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <Bed className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Hospital Inpatient Admission History (மருத்துவமனை அனுமதி வரலாறு)</h4>
                  <p className="text-[11px] text-slate-400">Ward, bed number, admitting diagnosis, procedures & discharge summaries</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">{currentPatient.admissions.length} Hospitalizations</span>
            </div>

            {currentPatient.admissions.length > 0 ? (
              <div className="space-y-5">
                {currentPatient.admissions.map((adm) => (
                  <div key={adm.id} className="p-5 sm:p-6 rounded-3xl bg-[#FFFDFB] border border-orange-200/90 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-slate-900 text-base">{adm.hospitalName}</h5>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                            {adm.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#EA580C] font-semibold mt-0.5">
                          {adm.ward} &bull; <strong className="font-mono text-slate-900">{adm.bedNumber}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-xs text-slate-600">
                        <div><strong>Duration:</strong> {adm.durationDays} Days Inpatient Stay</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {adm.admissionDate.split('•')[0]} to {adm.dischargeDate.split('•')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Admission Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-100 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Admitting Diagnosis & Complaint</div>
                        <div className="font-bold text-slate-900">{adm.admittingDiagnosis}</div>
                        <div className="text-[11px] text-slate-500 pt-1"><strong>Treating Physician:</strong> {adm.treatingDoctor}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-slate-100 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Procedures / Surgery Performed</div>
                        <div className="font-bold text-slate-900">{adm.proceduresDone}</div>
                      </div>
                    </div>

                    {/* Discharge Summary Box */}
                    <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-orange-200/80 space-y-2 text-xs">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#EA580C]" />
                        <span>Official Discharge Summary & Course in Hospital</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{adm.dischargeSummary}</p>
                      <div className="pt-2 border-t border-orange-200/60 text-slate-800">
                        <strong>Follow-up & Post-Discharge Medication:</strong> {adm.followupAdvice}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-400">Admission Dossier ID: {adm.id}</span>
                      <button
                        onClick={() => alert(`Discharge Summary for ${adm.id} exported successfully.`)}
                        className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Discharge Summary PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Bed className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No previous hospital inpatient admissions recorded for this citizen profile.</p>
                <p className="text-[11px]">All outpatient visits and consultations remain archived in the Visits tab.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: DETAILED LAB REPORT DOSSIER VIEWER             */}
      {/* ======================================================== */}
      {selectedLabReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-orange-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedLabReport.testName}</h3>
                  <p className="text-xs text-slate-500">{selectedLabReport.labName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLabReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-orange-200/80 text-xs text-slate-800 leading-relaxed">
              <strong>Clinical Impression:</strong> {selectedLabReport.summary}
            </div>

            {/* Detailed Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="pb-2.5">Biological Parameter</th>
                    <th className="pb-2.5">Observed Result</th>
                    <th className="pb-2.5">Units</th>
                    <th className="pb-2.5">Reference Range</th>
                    <th className="pb-2.5 text-right">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLabReport.details.map((param: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{param.parameter}</td>
                      <td className="py-2.5 font-mono font-black text-slate-900">{param.result}</td>
                      <td className="py-2.5 font-mono text-slate-500">{param.unit}</td>
                      <td className="py-2.5 font-mono text-slate-500">{param.referenceRange}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {param.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">Verified by Senior Biochemist / Pathologist</span>
              <button
                onClick={() => {
                  alert(`Report ${selectedLabReport.id} printed.`);
                  setSelectedLabReport(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Report</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
