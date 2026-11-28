import { EmergencyIncident, EmergencyAnalytics } from '../types';

export const INITIAL_EMERGENCY_INCIDENTS: EmergencyIncident[] = [
  {
    id: 'INC-2026-088',
    hospitalId: 'hosp-chn-01',
    patientId: 'PAT-8801',
    patientName: 'Karthik Subramanian',
    age: 46,
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyType: 'Polytrauma & Flail Chest',
    severity: 'Level 1',
    location: 'Emergency Bay 01',
    requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative Blood (4 Units)', 'Trauma Surgeon'],
    assignedDoctorId: 'DOC-001',
    assignedDoctorName: 'Dr. Sundaramoorthy M.',
    assignedNurseName: 'Nurse Revathi S.',
    status: 'In Progress',
    allocatedBedId: 'b-icu-01',
    allocatedBedNumber: 'ICU-01',
    allocatedEquipmentId: 'eq-vent-01',
    allocatedEquipmentName: 'Servo-U Mechanical Ventilator',
    priorityJustification: 'Unstable blunt polytrauma with multiple rib fractures and refractory hypoxemia (SpO2 84%).',
    reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    timeline: [
      {
        stage: 'Reported',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: '108 Triage Team',
        notes: 'High-speed highway collision. Severe respiratory distress and chest wall paradox.'
      },
      {
        stage: 'Doctor Assigned',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Emergency Central Dispatch',
        notes: 'Assigned to Dr. Sundaramoorthy M. (Trauma Lead) and Nurse Revathi S.'
      },
      {
        stage: 'Resource Assessment',
        timestamp: new Date(Date.now() - 28 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'AI Clinical Engine',
        notes: 'Identified immediate requirement for Level 1 Trauma ICU bed and Servo-U Ventilator.'
      },
      {
        stage: 'Resources Allocated',
        timestamp: new Date(Date.now() - 22 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Hospital Admin & Dr. Sundaramoorthy M.',
        notes: 'Bed ICU-01 and Ventilator EQ-VENT-01 allocated with 4 units O+ PRBC verified.'
      },
      {
        stage: 'In Progress',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Trauma Surgical Team',
        notes: 'Intercostal drainage tube placed. Patient mechanically ventilated in ICU-01.'
      }
    ],
    matchedResources: {
      score: 96,
      rationale: 'Primary ICU Bed ICU-01 matches trauma respiratory protocol with dedicated Servo-U ventilator and blood bank buffer.',
      recommendedBed: {
        id: 'b-icu-01',
        bedNumber: 'ICU-01',
        ward: 'ICU Block A',
        type: 'ICU',
        status: 'occupied'
      },
      recommendedVentilator: {
        id: 'eq-vent-01',
        name: 'Servo-U Mechanical Ventilator',
        ward: 'ICU Block A',
        status: 'In Use'
      },
      bloodAvailable: {
        bloodGroup: 'O+',
        units: 8,
        available: true
      },
      assignedDoctor: 'Dr. Sundaramoorthy M.'
    }
  },
  {
    id: 'INC-2026-089',
    hospitalId: 'hosp-chn-01',
    patientId: 'PAT-8802',
    patientName: 'Meenakshi Ammal',
    age: 62,
    gender: 'Female',
    bloodGroup: 'B+',
    emergencyType: 'Acute STEMI & Cardiogenic Shock',
    severity: 'Level 1',
    location: 'Triage Resuscitation Bay 2',
    requiredResources: ['CCU / ICU Bed', 'Defibrillator', 'Cardiac Monitor', 'Interventional Cardiologist'],
    assignedDoctorId: 'DOC-002',
    assignedDoctorName: 'Dr. Priya V. (Cardiology)',
    assignedNurseName: 'Nurse David K.',
    status: 'Under Assessment',
    reportedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    timeline: [
      {
        stage: 'Reported',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Emergency Reception',
        notes: 'Sudden onset severe crushing retrosternal chest pain with diaphoresis and hypotension.'
      },
      {
        stage: 'Doctor Assigned',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Emergency Central Dispatch',
        notes: 'Dr. Priya V. paged for emergent primary PCI consideration.'
      },
      {
        stage: 'Assessment',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Dr. Priya V.',
        notes: 'ECG shows hyperacute ST elevations in V1-V4. Troponin I elevated.'
      }
    ],
    matchedResources: {
      score: 92,
      rationale: 'Optimal match for CCU / ICU Bed ICU-02 with GE Solar 8000i Multi-parameter cardiac monitor.',
      recommendedBed: {
        id: 'b-icu-02',
        bedNumber: 'ICU-02',
        ward: 'ICU Block A',
        type: 'ICU',
        status: 'ready'
      },
      recommendedVentilator: null,
      bloodAvailable: {
        bloodGroup: 'B+',
        units: 6,
        available: true
      },
      assignedDoctor: 'Dr. Priya V. (Cardiology)'
    }
  },
  {
    id: 'INC-2026-090',
    hospitalId: 'hosp-chn-01',
    patientId: 'PAT-8803',
    patientName: 'Gopinath R.',
    age: 38,
    gender: 'Male',
    bloodGroup: 'A+',
    emergencyType: 'Acute Severe Asthma & Status Asthmaticus',
    severity: 'Level 2',
    location: 'Emergency Bay 04',
    requiredResources: ['HDU / Emergency Bed', 'High-Flow Oxygen Unit', 'Nebulization Unit', 'Pulmonologist'],
    assignedDoctorId: 'DOC-003',
    assignedDoctorName: 'Dr. Arvind Nathan',
    assignedNurseName: 'Nurse Sneha R.',
    status: 'Resource Requested',
    reportedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    timeline: [
      {
        stage: 'Reported',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Triage Nurse',
        notes: 'Severe wheezing, silent chest features, unable to speak full sentences.'
      },
      {
        stage: 'Doctor Assigned',
        timestamp: new Date(Date.now() - 9 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Triage Lead',
        notes: 'Assigned to Dr. Arvind Nathan. Continuous nebulization initiated.'
      },
      {
        stage: 'Resource Requested',
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Dr. Arvind Nathan',
        notes: 'Requested urgent Step-down HDU Bed and High-Flow Oxygen delivery apparatus.'
      }
    ],
    matchedResources: {
      score: 88,
      rationale: 'HDU Bed HDU-01 ready in Step-down Ward with High-flow nasal cannula and O2 concentrator standby.',
      recommendedBed: {
        id: 'b-hdu-01',
        bedNumber: 'HDU-01',
        ward: 'High Dependency Ward',
        type: 'HDU',
        status: 'ready'
      },
      recommendedVentilator: null,
      bloodAvailable: {
        bloodGroup: 'A+',
        units: 12,
        available: true
      },
      assignedDoctor: 'Dr. Arvind Nathan'
    }
  }
];

export const EMERGENCY_PRESETS = [
  {
    name: 'Code Red - Polytrauma & Shock',
    emergencyType: 'Polytrauma & Hemorrhagic Shock',
    severity: 'Level 1' as const,
    location: 'Emergency Resuscitation Bay 1',
    requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative PRBC', 'Trauma Surgeon'],
    doctorRecommendation: 'Dr. Sundaramoorthy M.',
    notes: 'Severe multi-site trauma, unstable hemodynamics, GCS < 9, requires immediate surgical airway & resus.'
  },
  {
    name: 'Code Red - Massive STEMI',
    emergencyType: 'Acute STEMI & Cardiogenic Shock',
    severity: 'Level 1' as const,
    location: 'Cardiac Resuscitation Bay 2',
    requiredResources: ['ICU Bed', 'Defibrillator', 'Cardiac Monitor', 'Interventional Cardiologist'],
    doctorRecommendation: 'Dr. Priya V. (Cardiology)',
    notes: 'Anterior STEMI with refractory hypotension and severe angina, emergent catheterization required.'
  },
  {
    name: 'Code Red - Acute ARDS / Respiratory Failure',
    emergencyType: 'Acute ARDS & Hypercapnic Failure',
    severity: 'Level 1' as const,
    location: 'Respiratory Isolation Bay 3',
    requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'High-Flow Oxygen', 'Pulmonologist / Intensivist'],
    doctorRecommendation: 'Dr. Arvind Nathan',
    notes: 'Severe bilateral infiltrates, PaO2/FiO2 < 120, requiring lung-protective mechanical ventilation.'
  },
  {
    name: 'Code Orange - Refractory Septic Shock',
    emergencyType: 'Severe Septic Shock & Organ Failure',
    severity: 'Level 2' as const,
    location: 'Stepdown Triage Bay 4',
    requiredResources: ['HDU Bed', 'Infusion Pump', 'Central Venous Line', 'Intensivist'],
    doctorRecommendation: 'Dr. Sundaramoorthy M.',
    notes: 'Septic focus with persistent MAP < 65 despite fluid resuscitation, requires inotropic support.'
  }
];

export const INITIAL_EMERGENCY_ANALYTICS: EmergencyAnalytics = {
  activeCount: 3,
  criticalCount: 2,
  averageResponseMinutes: 4.8,
  averageAllocationMinutes: 8.5,
  bedUtilizationPercent: 82.5,
  shortageCount: 1,
  resolutionRatePercent: 94.2,
  severityBreakdown: {
    level1: 2,
    level2: 1,
    level3: 0
  },
  recentTrends: [
    { time: '08:00', active: 2, resolved: 3 },
    { time: '11:00', active: 4, resolved: 5 },
    { time: '14:00', active: 3, resolved: 4 },
    { time: '17:00', active: 5, resolved: 6 },
    { time: '20:00', active: 3, resolved: 7 }
  ]
};
