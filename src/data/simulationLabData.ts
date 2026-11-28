import { 
  DepartmentDigitalTwin, 
  SimulationScenarioParameters 
} from '../types';

export const SIMULATION_SANDBOX_DISCLAIMER = 
  'SIMULATION LAB SANDBOX: All resource modeling, hypothetical reallocations, and patient influx scenarios are strictly isolated in-memory computations. Live hospital records, bed occupancy, and real alerts remain unaltered.';

export const INITIAL_HOSPITAL_DIGITAL_TWIN: DepartmentDigitalTwin[] = [
  {
    id: 'dt-dept-01',
    name: 'Emergency Department & Triage Resuscitation',
    code: 'ER-BAY',
    floor: 'Ground Floor, North Wing',
    type: 'Emergency',
    totalBeds: 8,
    occupiedBeds: 6,
    readyBeds: 2,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Crash Carts / Defibrillators', available: 4, total: 4 },
      { name: 'Transport Ventilators', available: 2, total: 2 },
      { name: 'Arterial Blood Gas Analyzers', available: 1, total: 1 }
    ],
    onDutyStaff: { doctors: 4, nurses: 8 },
    readinessScore: 78,
    status: 'High Load'
  },
  {
    id: 'dt-dept-02',
    name: 'Intensive Care Unit (ICU Block A)',
    code: 'ICU-A',
    floor: '1st Floor, Critical Wing',
    type: 'ICU',
    totalBeds: 12,
    occupiedBeds: 10,
    readyBeds: 2,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Hamilton-C6 Ventilators', available: 1, total: 6 },
      { name: 'Multi-parameter Telemetry Monitors', available: 2, total: 12 },
      { name: 'Syringe Infusion Pumps', available: 4, total: 24 }
    ],
    onDutyStaff: { doctors: 3, nurses: 6 },
    readinessScore: 72,
    status: 'Critical Strain'
  },
  {
    id: 'dt-dept-03',
    name: 'Coronary Care Unit & Cardiac Telemetry (CCU)',
    code: 'CCU-01',
    floor: '1st Floor, South Wing',
    type: 'ICU',
    totalBeds: 8,
    occupiedBeds: 5,
    readyBeds: 3,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Intra-Aortic Balloon Pumps', available: 1, total: 2 },
      { name: 'Cardiac Output Monitors', available: 3, total: 8 },
      { name: 'Defibrillator Telemetry', available: 2, total: 2 }
    ],
    onDutyStaff: { doctors: 2, nurses: 4 },
    readinessScore: 88,
    status: 'Operational'
  },
  {
    id: 'dt-dept-04',
    name: 'High Dependency Ward (HDU Step-Down)',
    code: 'HDU-01',
    floor: '2nd Floor, West Wing',
    type: 'Stepdown',
    totalBeds: 16,
    occupiedBeds: 12,
    readyBeds: 4,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'High-Flow Nasal Cannula (HFNC)', available: 4, total: 8 },
      { name: 'Vital Sign Monitors', available: 4, total: 16 },
      { name: 'Infusion Drivers', available: 6, total: 16 }
    ],
    onDutyStaff: { doctors: 2, nurses: 5 },
    readinessScore: 84,
    status: 'Operational'
  },
  {
    id: 'dt-dept-05',
    name: 'Post-Anesthesia Care Unit (PACU Overflow)',
    code: 'PACU-OVF',
    floor: '2nd Floor, Surgical Wing',
    type: 'Surgical',
    totalBeds: 6,
    occupiedBeds: 2,
    readyBeds: 4,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Servo-U Ventilators (Standby)', available: 2, total: 2 },
      { name: 'Anesthesia Monitors', available: 4, total: 6 }
    ],
    onDutyStaff: { doctors: 1, nurses: 3 },
    readinessScore: 92,
    status: 'Operational'
  },
  {
    id: 'dt-dept-06',
    name: 'General Medical Inpatient Ward',
    code: 'GEN-MED',
    floor: '3rd Floor, Central Wing',
    type: 'Inpatient',
    totalBeds: 40,
    occupiedBeds: 31,
    readyBeds: 9,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Pulse Oximeter Hubs', available: 9, total: 40 },
      { name: 'Nebulizer Stations', available: 6, total: 10 }
    ],
    onDutyStaff: { doctors: 3, nurses: 8 },
    readinessScore: 85,
    status: 'Operational'
  },
  {
    id: 'dt-dept-07',
    name: 'Surgical Stepdown & Orthopedics Ward',
    code: 'SURG-STP',
    floor: '4th Floor, East Wing',
    type: 'Inpatient',
    totalBeds: 24,
    occupiedBeds: 18,
    readyBeds: 6,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'Traction Assemblies', available: 6, total: 12 },
      { name: 'Sequential Compression Devices', available: 8, total: 16 }
    ],
    onDutyStaff: { doctors: 2, nurses: 5 },
    readinessScore: 82,
    status: 'Operational'
  },
  {
    id: 'dt-dept-08',
    name: 'Central Blood Bank & Cryo-Oxygen Reserves',
    code: 'UTIL-BB',
    floor: 'Ground Floor, Utility Basement',
    type: 'Diagnostics',
    totalBeds: 0,
    occupiedBeds: 0,
    readyBeds: 0,
    maintenanceBeds: 0,
    equipmentSummary: [
      { name: 'O-Negative PRBC Reserve Units', available: 8, total: 20 },
      { name: 'Cryogenic Liquid O2 Pressure (Bar)', available: 4, total: 4 }
    ],
    onDutyStaff: { doctors: 2, nurses: 4 },
    readinessScore: 94,
    status: 'Operational'
  }
];

export const PREDEFINED_SIMULATION_SCENARIOS: SimulationScenarioParameters[] = [
  {
    id: 'SCN-PRESET-01',
    title: 'Mass Casualty Highway Collision (25 Casualties)',
    description: 'High-speed multi-vehicle highway pileup resulting in acute polytrauma, crush injuries, flail chests, and severe hypovolemic shock arriving en-route.',
    emergencyType: 'Mass Casualty Incident (Polytrauma)',
    patientCount: 25,
    severityDistribution: {
      level1Percent: 32, // 8 Code Red
      level2Percent: 44, // 11 Code Orange
      level3Percent: 24  // 6 Code Yellow
    },
    durationHours: 4,
    resourceRequirements: {
      icuBeds: 8,
      emergencyBeds: 12,
      generalBeds: 5,
      ventilators: 6,
      oxygenUnits: 18,
      bloodUnits: 16,
      specialists: 5
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-02',
    title: 'Sudden Toxic Chemical / Industrial Vapor Exposure',
    description: 'Industrial chemical plant leak with 35 acute arrivals presenting with toxic pneumonitis, severe bronchospasm, and non-cardiogenic pulmonary edema.',
    emergencyType: 'Toxic Chemical Inhalation Surge',
    patientCount: 35,
    severityDistribution: {
      level1Percent: 20, // 7 Code Red
      level2Percent: 50, // 18 Code Orange
      level3Percent: 30  // 10 Code Yellow
    },
    durationHours: 6,
    resourceRequirements: {
      icuBeds: 6,
      emergencyBeds: 16,
      generalBeds: 13,
      ventilators: 7,
      oxygenUnits: 25,
      bloodUnits: 4,
      specialists: 4
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-03',
    title: 'Acute ICU Capacity Shortage & Post-Surgical Decompensation',
    description: 'Simulates simultaneous decompensation of multiple post-operative inpatients during an influenza outbreak requiring 8 emergency ICU transfers with only 2 beds ready.',
    emergencyType: 'Inpatient Critical Bed Depletion',
    patientCount: 10,
    severityDistribution: {
      level1Percent: 70, // 7 Code Red
      level2Percent: 30, // 3 Code Orange
      level3Percent: 0
    },
    durationHours: 12,
    resourceRequirements: {
      icuBeds: 8,
      emergencyBeds: 2,
      generalBeds: 0,
      ventilators: 5,
      oxygenUnits: 10,
      bloodUnits: 6,
      specialists: 3
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-04',
    title: 'Mechanical Ventilator Hardware & Power Diagnostic Failure',
    description: 'Simulates simultaneous technical downtime of 3 primary mechanical ventilators in ICU Block A due to software calibration alarms during peak respiratory census.',
    emergencyType: 'Critical Equipment Failure',
    patientCount: 6,
    severityDistribution: {
      level1Percent: 80,
      level2Percent: 20,
      level3Percent: 0
    },
    durationHours: 2,
    resourceRequirements: {
      icuBeds: 2,
      emergencyBeds: 2,
      generalBeds: 2,
      ventilators: 4,
      oxygenUnits: 8,
      bloodUnits: 2,
      specialists: 2
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-05',
    title: 'Emergency Resuscitation Unit 100% Saturation',
    description: 'Sudden unannounced influx of 18 ambulance arrivals saturating all triage bays within 45 minutes.',
    emergencyType: 'Emergency Department Saturation',
    patientCount: 18,
    severityDistribution: {
      level1Percent: 28,
      level2Percent: 44,
      level3Percent: 28
    },
    durationHours: 3,
    resourceRequirements: {
      icuBeds: 5,
      emergencyBeds: 10,
      generalBeds: 3,
      ventilators: 4,
      oxygenUnits: 14,
      bloodUnits: 8,
      specialists: 4
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-06',
    title: 'Surgical Stepdown Electrical Fire & Ward Evacuation',
    description: 'Localised electrical fire in East Wing requiring immediate relocation of 18 inpatients into HDU, PACU, and medical wards without interrupting telemetry.',
    emergencyType: 'Internal Ward Evacuation',
    patientCount: 18,
    severityDistribution: {
      level1Percent: 10,
      level2Percent: 40,
      level3Percent: 50
    },
    durationHours: 8,
    resourceRequirements: {
      icuBeds: 2,
      emergencyBeds: 4,
      generalBeds: 12,
      ventilators: 1,
      oxygenUnits: 6,
      bloodUnits: 2,
      specialists: 3
    },
    isPreset: true
  },
  {
    id: 'SCN-PRESET-07',
    title: 'Regional Epidemic Cluster & Specialist Quarantine',
    description: 'Atypical respiratory nosocomial cluster requiring isolation of CCU beds and sudden quarantine of 2 on-call pulmonologists.',
    emergencyType: 'Infectious Nosocomial Surge',
    patientCount: 14,
    severityDistribution: {
      level1Percent: 35,
      level2Percent: 50,
      level3Percent: 15
    },
    durationHours: 24,
    resourceRequirements: {
      icuBeds: 6,
      emergencyBeds: 6,
      generalBeds: 2,
      ventilators: 5,
      oxygenUnits: 16,
      bloodUnits: 4,
      specialists: 4
    },
    isPreset: true
  }
];

export const PRESET_WHAT_IF_QUERIES = [
  {
    label: 'What if 30 emergency patients arrive within 1 hour?',
    scenarioId: 'SCN-PRESET-01',
    description: 'Simulates mass casualty collision intake exceeding primary triage bay capacity by 275%.'
  },
  {
    label: 'What if 5 ICU beds become unavailable simultaneously?',
    scenarioId: 'SCN-PRESET-03',
    description: 'Simulates sudden critical care depletion and tests PACU/HDU buffer overflow feasibility.'
  },
  {
    label: 'What if 3 ventilators fail or require calibration?',
    scenarioId: 'SCN-PRESET-04',
    description: 'Evaluates life-support deficit and standby respiratory apparatus deployment protocols.'
  },
  {
    label: 'What if the Emergency Department reaches 100% capacity?',
    scenarioId: 'SCN-PRESET-05',
    description: 'Assesses diversion protocols and rapid inpatient ward admission clearance times.'
  },
  {
    label: 'What if one entire ward requires immediate emergency evacuation?',
    scenarioId: 'SCN-PRESET-06',
    description: 'Tests intra-hospital bed relocation without degrading critical telemetry.'
  }
];
