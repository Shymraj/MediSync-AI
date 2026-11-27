// Centralized Demo Data for MediSync AI Hospital Equipment Telemetry
// Equipment Telemetry Module (Synthetic Demo Data)
// Note: All readings and telemetry data are simulated for clinical administration demo purposes.

export type EquipmentType = 
  | 'Ventilators'
  | 'Patient Monitors'
  | 'Infusion Pumps'
  | 'ECG Machines'
  | 'Oxygen Concentrators'
  | 'Defibrillators';

export type EquipmentStatus = 
  | 'Operational'
  | 'In Use'
  | 'Standby'
  | 'Maintenance Required'
  | 'Offline';

export type EquipmentCondition = 
  | 'Optimal'
  | 'Good'
  | 'Fair'
  | 'Degraded'
  | 'Critical';

export interface TelemetryReading {
  internalTemp: number; // in Celsius e.g. 36.4
  operatingHours: number;
  batteryLevel: number; // percentage 0 - 100
  powerSource: 'AC Mains (UPS Backed)' | 'Internal Battery' | 'Auxiliary Line';
  signalStrength: number; // percentage 0 - 100
  firmwareVersion: string;
  calibrationDate: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  isSimulated: true;
}

export interface StatusHistoryEntry {
  id: string;
  timestamp: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  note: string;
  updatedBy: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Biomedical Safety Check' | 'Routine Preventive Maintenance' | 'Sensor Calibration' | 'Component Servicing' | 'Battery Replacement';
  technician: string;
  notes: string;
  result: 'Passed' | 'Recalibrated' | 'Pending Parts' | 'Certified';
}

export interface EquipmentItem {
  id: string;
  equipmentId: string;
  name: string;
  type: EquipmentType;
  department: string;
  location: string;
  operationalStatus: EquipmentStatus;
  condition: EquipmentCondition;
  conditionScore: number; // percentage 0-100
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceNotes: string;
  lastUpdated: string;
  telemetry: TelemetryReading;
  statusHistory: StatusHistoryEntry[];
  maintenanceHistory: MaintenanceRecord[];
}

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  // 1. VENTILATORS
  {
    id: 'eqp-01',
    equipmentId: 'EQP-VENT-101',
    name: 'Dräger Evita V500 Mechanical Ventilator',
    type: 'Ventilators',
    department: 'ICU Complex',
    location: 'ICU Bay 1 - Bed B-101',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 98,
    lastMaintenanceDate: '2026-10-18',
    nextMaintenanceDate: '2026-12-18',
    maintenanceNotes: 'Full biomedical calibration completed. Turbine and O2 blender validated.',
    lastUpdated: 'Today, 11:42 AM',
    telemetry: {
      internalTemp: 35.8,
      operatingHours: 3420,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 96,
      firmwareVersion: 'v4.18.2-LTS',
      calibrationDate: '2026-10-18',
      primaryMetricLabel: 'PEEP / Insp Flow',
      primaryMetricValue: '8 cmH2O / 45 L/min',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-1', timestamp: 'Today, 08:00 AM', status: 'In Use', condition: 'Optimal', note: 'Allocated to post-cardiac surgical patient in Bed B-101.', updatedBy: 'Dr. Sarah Mitchell' },
      { id: 'sh-2', timestamp: 'Yesterday, 04:30 PM', status: 'Operational', condition: 'Optimal', note: 'Pre-use circuit sterilization and leak test passed.', updatedBy: 'Nurse Emily Vance' }
    ],
    maintenanceHistory: [
      { id: 'mh-1', date: '2026-10-18', type: 'Routine Preventive Maintenance', technician: 'Mark Davies (Lead Biomed)', notes: 'Flow sensor replaced, leak check negative, battery endurance 140 min test passed.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-02',
    equipmentId: 'EQP-VENT-102',
    name: 'Hamilton-G5 Intensive Care Ventilator',
    type: 'Ventilators',
    department: 'ICU Complex',
    location: 'ICU Bay 3 - Bed B-103',
    operationalStatus: 'Operational',
    condition: 'Good',
    conditionScore: 92,
    lastMaintenanceDate: '2026-09-24',
    nextMaintenanceDate: '2026-11-28',
    maintenanceNotes: 'Upcoming 60-day filter check due tomorrow.',
    lastUpdated: 'Today, 10:15 AM',
    telemetry: {
      internalTemp: 36.2,
      operatingHours: 5120,
      batteryLevel: 98,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 92,
      firmwareVersion: 'v3.9.1',
      calibrationDate: '2026-09-24',
      primaryMetricLabel: 'Standby Pressure',
      primaryMetricValue: '5.2 cmH2O (Ready)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-3', timestamp: 'Today, 06:15 AM', status: 'Operational', condition: 'Good', note: 'Placed in ready standby mode after turnaround.', updatedBy: 'Nurse Rajesh Kumar' }
    ],
    maintenanceHistory: [
      { id: 'mh-2', date: '2026-09-24', type: 'Sensor Calibration', technician: 'Elena Gomez', notes: 'Proximal flow sensor calibrated with zero-drift accuracy.', result: 'Passed' }
    ]
  },
  {
    id: 'eqp-03',
    equipmentId: 'EQP-VENT-103',
    name: 'Medtronic Puritan Bennett 980',
    type: 'Ventilators',
    department: 'Emergency',
    location: 'Trauma Resuscitation Bay 1',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 96,
    lastMaintenanceDate: '2026-10-02',
    nextMaintenanceDate: '2027-01-02',
    maintenanceNotes: 'Compressor check passed. Oxygen cell at 100% sensitivity.',
    lastUpdated: 'Today, 11:20 AM',
    telemetry: {
      internalTemp: 37.1,
      operatingHours: 2880,
      batteryLevel: 94,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 98,
      firmwareVersion: 'v5.0.4',
      calibrationDate: '2026-10-02',
      primaryMetricLabel: 'Minute Ventilation',
      primaryMetricValue: '7.8 L/min active',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-4', timestamp: 'Today, 09:30 AM', status: 'In Use', condition: 'Optimal', note: 'Active mechanical ventilation in Trauma Bay 1.', updatedBy: 'Dr. Alex Rivera' }
    ],
    maintenanceHistory: [
      { id: 'mh-3', date: '2026-10-02', type: 'Biomedical Safety Check', technician: 'Mark Davies', notes: 'Safety valve relief threshold confirmed within tolerances.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-04',
    equipmentId: 'EQP-VENT-104',
    name: 'Getinge Servo-u Invasive Ventilator',
    type: 'Ventilators',
    department: 'Pulmonary Medicine',
    location: 'Biomedical Storage B',
    operationalStatus: 'Maintenance Required',
    condition: 'Degraded',
    conditionScore: 62,
    lastMaintenanceDate: '2026-08-14',
    nextMaintenanceDate: '2026-11-20',
    maintenanceNotes: 'Expiratory cassette pressure transducer sensor warning flagged during self-test.',
    lastUpdated: 'Today, 07:45 AM',
    telemetry: {
      internalTemp: 38.6,
      operatingHours: 6740,
      batteryLevel: 82,
      powerSource: 'Auxiliary Line',
      signalStrength: 78,
      firmwareVersion: 'v4.2.0',
      calibrationDate: '2026-08-14',
      primaryMetricLabel: 'Sensor Delta',
      primaryMetricValue: '+14% drift (Flagged)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-5', timestamp: 'Today, 07:45 AM', status: 'Maintenance Required', condition: 'Degraded', note: 'Self-test warning on expiratory membrane. Tagged for biomed review.', updatedBy: 'Biomed Dept' }
    ],
    maintenanceHistory: [
      { id: 'mh-4', date: '2026-08-14', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'Cassette gasket replaced.', result: 'Passed' }
    ]
  },

  // 2. PATIENT MONITORS
  {
    id: 'eqp-05',
    equipmentId: 'EQP-MON-201',
    name: 'Philips IntelliVue MX750 Bedside Monitor',
    type: 'Patient Monitors',
    department: 'ICU Complex',
    location: 'ICU Bay 2 - Bed B-102',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 99,
    lastMaintenanceDate: '2026-11-01',
    nextMaintenanceDate: '2027-02-01',
    maintenanceNotes: 'Touch screen calibrated, NIBP transducer zero-check certified.',
    lastUpdated: 'Today, 11:55 AM',
    telemetry: {
      internalTemp: 34.9,
      operatingHours: 4120,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 99,
      firmwareVersion: 'v7.1.0',
      calibrationDate: '2026-11-01',
      primaryMetricLabel: 'Telemetry Link',
      primaryMetricValue: 'ECG/SpO2/NIBP/EtCO2 Sync',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-6', timestamp: 'Today, 07:00 AM', status: 'In Use', condition: 'Optimal', note: 'Bed B-102 vital sign telemetry streaming live.', updatedBy: 'Nurse Emily Vance' }
    ],
    maintenanceHistory: [
      { id: 'mh-5', date: '2026-11-01', type: 'Biomedical Safety Check', technician: 'Elena Gomez', notes: 'Electrical safety leakage test passed at 12 µA.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-06',
    equipmentId: 'EQP-MON-202',
    name: 'GE CARESCAPE B650 Multi-Parameter Monitor',
    type: 'Patient Monitors',
    department: 'Emergency',
    location: 'Emergency Observation Ward Bed 4',
    operationalStatus: 'In Use',
    condition: 'Good',
    conditionScore: 91,
    lastMaintenanceDate: '2026-10-10',
    nextMaintenanceDate: '2027-01-10',
    maintenanceNotes: 'SpO2 cable replaced with original Masimo sensor.',
    lastUpdated: 'Today, 11:38 AM',
    telemetry: {
      internalTemp: 35.5,
      operatingHours: 3790,
      batteryLevel: 95,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 94,
      firmwareVersion: 'v6.4.2',
      calibrationDate: '2026-10-10',
      primaryMetricLabel: 'Patient Heart Rate / SpO2',
      primaryMetricValue: '78 bpm / 98%',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-7', timestamp: 'Today, 08:30 AM', status: 'In Use', condition: 'Good', note: 'Monitoring acute observation patient.', updatedBy: 'Nurse Anita Roy' }
    ],
    maintenanceHistory: [
      { id: 'mh-6', date: '2026-10-10', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'SpO2 optical calibration check completed.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-07',
    equipmentId: 'EQP-MON-203',
    name: 'Mindray BeneVision N12 Patient Monitor',
    type: 'Patient Monitors',
    department: 'Cardiology Department',
    location: 'Cardiac Step-Down Unit Room 3',
    operationalStatus: 'Standby',
    condition: 'Good',
    conditionScore: 88,
    lastMaintenanceDate: '2026-09-19',
    nextMaintenanceDate: '2026-12-19',
    maintenanceNotes: 'Battery capacity test 91% of factory specification.',
    lastUpdated: 'Today, 09:50 AM',
    telemetry: {
      internalTemp: 35.1,
      operatingHours: 2940,
      batteryLevel: 91,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 89,
      firmwareVersion: 'v5.3.1',
      calibrationDate: '2026-09-19',
      primaryMetricLabel: 'System Status',
      primaryMetricValue: 'Standby / Ready',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-8', timestamp: 'Today, 09:50 AM', status: 'Standby', condition: 'Good', note: 'Cleaned and sanitized, placed on docking bracket.', updatedBy: 'Nurse Anita Roy' }
    ],
    maintenanceHistory: [
      { id: 'mh-7', date: '2026-09-19', type: 'Routine Preventive Maintenance', technician: 'Mark Davies', notes: 'NIBP cuff pressure verification passed.', result: 'Passed' }
    ]
  },
  {
    id: 'eqp-08',
    equipmentId: 'EQP-MON-204',
    name: 'Nihon Kohden Life Scope BSM-6701',
    type: 'Patient Monitors',
    department: 'General In-Patient Care',
    location: 'Biomedical Service Bay',
    operationalStatus: 'Offline',
    condition: 'Critical',
    conditionScore: 42,
    lastMaintenanceDate: '2026-07-30',
    nextMaintenanceDate: '2026-10-30',
    maintenanceNotes: 'Internal power supply board failure. Awaiting OEM replacement board.',
    lastUpdated: 'Yesterday, 05:15 PM',
    telemetry: {
      internalTemp: 21.0,
      operatingHours: 8450,
      batteryLevel: 0,
      powerSource: 'Auxiliary Line',
      signalStrength: 0,
      firmwareVersion: 'v3.2.0',
      calibrationDate: '2026-07-30',
      primaryMetricLabel: 'Telemetry Status',
      primaryMetricValue: 'Offline / Hardware Error',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-9', timestamp: 'Yesterday, 05:15 PM', status: 'Offline', condition: 'Critical', note: 'Power supply board capacitor failed during surge test.', updatedBy: 'Lead Biomed Tech' }
    ],
    maintenanceHistory: [
      { id: 'mh-8', date: '2026-07-30', type: 'Component Servicing', technician: 'Elena Gomez', notes: 'Diagnostic confirmed short on 12V rail.', result: 'Pending Parts' }
    ]
  },

  // 3. INFUSION PUMPS
  {
    id: 'eqp-09',
    equipmentId: 'EQP-PUMP-301',
    name: 'BD Alaris GH Plus Syringe Pump',
    type: 'Infusion Pumps',
    department: 'ICU Complex',
    location: 'ICU Bay 1 Infusion Tree',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 97,
    lastMaintenanceDate: '2026-10-25',
    nextMaintenanceDate: '2027-01-25',
    maintenanceNotes: 'Rate accuracy tested to +/- 1.2% using micro-gravimetric balance.',
    lastUpdated: 'Today, 11:10 AM',
    telemetry: {
      internalTemp: 33.8,
      operatingHours: 2180,
      batteryLevel: 99,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 95,
      firmwareVersion: 'v9.33',
      calibrationDate: '2026-10-25',
      primaryMetricLabel: 'Delivery Rate',
      primaryMetricValue: '4.5 mL/hr (Norepinephrine)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-10', timestamp: 'Today, 08:15 AM', status: 'In Use', condition: 'Optimal', note: 'Infusing critical vasopressor under guarded dose limits.', updatedBy: 'Nurse Emily Vance' }
    ],
    maintenanceHistory: [
      { id: 'mh-9', date: '2026-10-25', type: 'Biomedical Safety Check', technician: 'David Kim', notes: 'Syringe barrel clamp sensor calibrated.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-10',
    equipmentId: 'EQP-PUMP-302',
    name: 'Fresenius Kabi Volumat MC Agilia Volumetric Pump',
    type: 'Infusion Pumps',
    department: 'Oncology & Chemotherapy',
    location: 'Chemo Infusion Suite 4',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 95,
    lastMaintenanceDate: '2026-10-12',
    nextMaintenanceDate: '2027-01-12',
    maintenanceNotes: 'Occlusion pressure sensitivity certified at 350 mmHg.',
    lastUpdated: 'Today, 11:05 AM',
    telemetry: {
      internalTemp: 34.2,
      operatingHours: 3100,
      batteryLevel: 96,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 91,
      firmwareVersion: 'v4.0.8',
      calibrationDate: '2026-10-12',
      primaryMetricLabel: 'Delivery Rate',
      primaryMetricValue: '125 mL/hr Normal Saline',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-11', timestamp: 'Today, 09:00 AM', status: 'In Use', condition: 'Optimal', note: 'Hydration therapy protocol running.', updatedBy: 'Nurse Anita Roy' }
    ],
    maintenanceHistory: [
      { id: 'mh-10', date: '2026-10-12', type: 'Routine Preventive Maintenance', technician: 'Mark Davies', notes: 'Air-in-line ultrasonic detector cleaned & calibrated.', result: 'Passed' }
    ]
  },
  {
    id: 'eqp-11',
    equipmentId: 'EQP-PUMP-303',
    name: 'B. Braun Space Perfusor Infusion Unit',
    type: 'Infusion Pumps',
    department: 'Surgical Suite',
    location: 'OR Prep Station 2',
    operationalStatus: 'Operational',
    condition: 'Good',
    conditionScore: 90,
    lastMaintenanceDate: '2026-09-10',
    nextMaintenanceDate: '2026-12-10',
    maintenanceNotes: 'Internal lithium-ion battery replaced in September 2026.',
    lastUpdated: 'Today, 10:30 AM',
    telemetry: {
      internalTemp: 33.1,
      operatingHours: 1940,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 97,
      firmwareVersion: 'v6.1.1',
      calibrationDate: '2026-09-10',
      primaryMetricLabel: 'Pump Status',
      primaryMetricValue: 'Standby / Primed',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-12', timestamp: 'Today, 10:30 AM', status: 'Operational', condition: 'Good', note: 'Loaded into rack for afternoon surgical roster.', updatedBy: 'Nurse Rajesh Kumar' }
    ],
    maintenanceHistory: [
      { id: 'mh-11', date: '2026-09-10', type: 'Battery Replacement', technician: 'Elena Gomez', notes: 'New battery installed; capacity measured 102%.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-12',
    equipmentId: 'EQP-PUMP-304',
    name: 'Baxter Colleague CX Volumetric Infusion Pump',
    type: 'Infusion Pumps',
    department: 'Emergency',
    location: 'Equipment Maintenance Room',
    operationalStatus: 'Maintenance Required',
    condition: 'Degraded',
    conditionScore: 68,
    lastMaintenanceDate: '2026-08-01',
    nextMaintenanceDate: '2026-11-01',
    maintenanceNotes: 'Upstream occlusion alarm triggering intermittently.',
    lastUpdated: 'Yesterday, 03:20 PM',
    telemetry: {
      internalTemp: 36.5,
      operatingHours: 7200,
      batteryLevel: 75,
      powerSource: 'Auxiliary Line',
      signalStrength: 70,
      firmwareVersion: 'v5.22',
      calibrationDate: '2026-08-01',
      primaryMetricLabel: 'Alarm State',
      primaryMetricValue: 'Upstream Sensor Warning',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-13', timestamp: 'Yesterday, 03:20 PM', status: 'Maintenance Required', condition: 'Degraded', note: 'Marked for pressure sensor recalibration.', updatedBy: 'Biomed Dept' }
    ],
    maintenanceHistory: [
      { id: 'mh-12', date: '2026-08-01', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'Drive screw lubricated, motor tested.', result: 'Passed' }
    ]
  },

  // 4. ECG MACHINES
  {
    id: 'eqp-13',
    equipmentId: 'EQP-ECG-401',
    name: 'GE MAC 2000 12-Lead Diagnostic ECG System',
    type: 'ECG Machines',
    department: 'Cardiology Department',
    location: 'Cardiology Diagnostics Room 102',
    operationalStatus: 'Operational',
    condition: 'Optimal',
    conditionScore: 97,
    lastMaintenanceDate: '2026-10-05',
    nextMaintenanceDate: '2027-01-05',
    maintenanceNotes: 'Marquette 12SL ECG analysis program validated.',
    lastUpdated: 'Today, 11:30 AM',
    telemetry: {
      internalTemp: 34.0,
      operatingHours: 1560,
      batteryLevel: 98,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 98,
      firmwareVersion: 'v2.0.4',
      calibrationDate: '2026-10-05',
      primaryMetricLabel: 'Signal Fidelity',
      primaryMetricValue: '12-Lead Pristine (0.05-150Hz)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-14', timestamp: 'Today, 11:30 AM', status: 'Operational', condition: 'Optimal', note: 'Completed 6 outpatient diagnostic ECGs today.', updatedBy: 'Cardiology Tech' }
    ],
    maintenanceHistory: [
      { id: 'mh-13', date: '2026-10-05', type: 'Sensor Calibration', technician: 'Elena Gomez', notes: 'Patient cable continuity and impedance tested within 0.1 ohms.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-14',
    equipmentId: 'EQP-ECG-402',
    name: 'Philips PageWriter TC70 High-Performance Cardiograph',
    type: 'ECG Machines',
    department: 'Emergency',
    location: 'Emergency Mobile Cart 2',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 94,
    lastMaintenanceDate: '2026-10-22',
    nextMaintenanceDate: '2027-01-22',
    maintenanceNotes: 'Wireless DICOM transfer integration verified with PACS.',
    lastUpdated: 'Today, 11:48 AM',
    telemetry: {
      internalTemp: 34.7,
      operatingHours: 2340,
      batteryLevel: 93,
      powerSource: 'Internal Battery',
      signalStrength: 92,
      firmwareVersion: 'v3.1.2',
      calibrationDate: '2026-10-22',
      primaryMetricLabel: 'Network Sync',
      primaryMetricValue: 'PACS Hospital Cloud Sync OK',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-15', timestamp: 'Today, 11:45 AM', status: 'In Use', condition: 'Optimal', note: 'Emergency chest pain triage recording in progress.', updatedBy: 'Dr. Alex Rivera' }
    ],
    maintenanceHistory: [
      { id: 'mh-14', date: '2026-10-22', type: 'Biomedical Safety Check', technician: 'Mark Davies', notes: 'Defibrillator protection on patient leads verified.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-15',
    equipmentId: 'EQP-ECG-403',
    name: 'Schiller Cardiovit AT-102 G2 Electrocardiograph',
    type: 'ECG Machines',
    department: 'Outpatient Department',
    location: 'OPD Screening Room 4',
    operationalStatus: 'Standby',
    condition: 'Good',
    conditionScore: 89,
    lastMaintenanceDate: '2026-09-08',
    nextMaintenanceDate: '2026-12-08',
    maintenanceNotes: 'Thermal printhead cleaned and contrast calibrated.',
    lastUpdated: 'Today, 09:15 AM',
    telemetry: {
      internalTemp: 33.5,
      operatingHours: 1810,
      batteryLevel: 96,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 88,
      firmwareVersion: 'v2.4.0',
      calibrationDate: '2026-09-08',
      primaryMetricLabel: 'Thermal Printhead',
      primaryMetricValue: 'Ready / Paper 85%',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-16', timestamp: 'Today, 09:15 AM', status: 'Standby', condition: 'Good', note: 'Routine morning initialization passed.', updatedBy: 'OPD Nurse' }
    ],
    maintenanceHistory: [
      { id: 'mh-15', date: '2026-09-08', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'Lead wires tested for micro-fractures.', result: 'Passed' }
    ]
  },

  // 5. OXYGEN CONCENTRATORS
  {
    id: 'eqp-16',
    equipmentId: 'EQP-OXY-501',
    name: 'DeVilbiss 10L High-Flow Medical Oxygen Concentrator',
    type: 'Oxygen Concentrators',
    department: 'Pulmonary Medicine',
    location: 'Ward Block B - Room 204',
    operationalStatus: 'In Use',
    condition: 'Optimal',
    conditionScore: 96,
    lastMaintenanceDate: '2026-10-15',
    nextMaintenanceDate: '2027-01-15',
    maintenanceNotes: 'O2 purity output measured at 95.4% at 8 LPM.',
    lastUpdated: 'Today, 11:25 AM',
    telemetry: {
      internalTemp: 39.2,
      operatingHours: 4950,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 91,
      firmwareVersion: 'v3.0.1',
      calibrationDate: '2026-10-15',
      primaryMetricLabel: 'O2 Purity / Flow',
      primaryMetricValue: '95.2% Purity @ 6.0 L/min',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-17', timestamp: 'Today, 08:30 AM', status: 'In Use', condition: 'Optimal', note: 'Continuous supplemental O2 for COPD recovery patient.', updatedBy: 'Nurse Rajesh Kumar' }
    ],
    maintenanceHistory: [
      { id: 'mh-16', date: '2026-10-15', type: 'Routine Preventive Maintenance', technician: 'Mark Davies', notes: 'Intake HEPA filter replaced, molecular sieve bed regenerated.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-17',
    equipmentId: 'EQP-OXY-502',
    name: 'Philips Respironics EverFlo 5L Concentrator',
    type: 'Oxygen Concentrators',
    department: 'General In-Patient Care',
    location: 'Ward Block A - Room 108',
    operationalStatus: 'Operational',
    condition: 'Good',
    conditionScore: 91,
    lastMaintenanceDate: '2026-09-30',
    nextMaintenanceDate: '2026-12-30',
    maintenanceNotes: 'Compressor sound level 43 dBA (within quiet ward threshold).',
    lastUpdated: 'Today, 10:40 AM',
    telemetry: {
      internalTemp: 38.0,
      operatingHours: 3200,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 90,
      firmwareVersion: 'v2.8.0',
      calibrationDate: '2026-09-30',
      primaryMetricLabel: 'O2 Purity Output',
      primaryMetricValue: '93.8% Ready Standby',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-18', timestamp: 'Today, 10:40 AM', status: 'Operational', condition: 'Good', note: 'Disinfected and held in reserve for ward admissions.', updatedBy: 'Nurse Rajesh Kumar' }
    ],
    maintenanceHistory: [
      { id: 'mh-17', date: '2026-09-30', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'Particle filter cleansed, sieve pressure balanced.', result: 'Passed' }
    ]
  },
  {
    id: 'eqp-18',
    equipmentId: 'EQP-OXY-503',
    name: 'Inogen One G5 Portable Oxygen System',
    type: 'Oxygen Concentrators',
    department: 'Emergency',
    location: 'Ambulance Unit 01',
    operationalStatus: 'Standby',
    condition: 'Good',
    conditionScore: 88,
    lastMaintenanceDate: '2026-10-08',
    nextMaintenanceDate: '2027-01-08',
    maintenanceNotes: 'Dual battery pack endurance tested to 8.5 hours.',
    lastUpdated: 'Today, 09:05 AM',
    telemetry: {
      internalTemp: 34.5,
      operatingHours: 890,
      batteryLevel: 98,
      powerSource: 'Internal Battery',
      signalStrength: 95,
      firmwareVersion: 'v1.4.2',
      calibrationDate: '2026-10-08',
      primaryMetricLabel: 'Pulse-Dose Level',
      primaryMetricValue: 'Ready (Setting 1-6)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-19', timestamp: 'Today, 09:05 AM', status: 'Standby', condition: 'Good', note: 'Docked in Ambulance 01 rapid response kit.', updatedBy: 'EMT Lead' }
    ],
    maintenanceHistory: [
      { id: 'mh-18', date: '2026-10-08', type: 'Battery Replacement', technician: 'Elena Gomez', notes: 'Column sieve cartridges replaced.', result: 'Certified' }
    ]
  },

  // 6. DEFIBRILLATORS
  {
    id: 'eqp-19',
    equipmentId: 'EQP-DEF-601',
    name: 'Zoll R Series ALS Clinical Defibrillator',
    type: 'Defibrillators',
    department: 'ICU Complex',
    location: 'ICU Central Crash Cart A',
    operationalStatus: 'Operational',
    condition: 'Optimal',
    conditionScore: 100,
    lastMaintenanceDate: '2026-11-15',
    nextMaintenanceDate: '2027-02-15',
    maintenanceNotes: 'Automated 30-joule self-test passed at 03:00 AM. Real CPR Help calibrated.',
    lastUpdated: 'Today, 11:58 AM',
    telemetry: {
      internalTemp: 33.2,
      operatingHours: 620,
      batteryLevel: 100,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 99,
      firmwareVersion: 'v5.12.0',
      calibrationDate: '2026-11-15',
      primaryMetricLabel: 'Discharge Readiness',
      primaryMetricValue: '200J Biphasic Ready (0.0 ms)',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-20', timestamp: 'Today, 06:00 AM', status: 'Operational', condition: 'Optimal', note: 'Daily 06:00 defibrillator checklist verified and signed.', updatedBy: 'Nurse Emily Vance' }
    ],
    maintenanceHistory: [
      { id: 'mh-19', date: '2026-11-15', type: 'Biomedical Safety Check', technician: 'Mark Davies', notes: 'Energy discharge measured on 50-ohm test load across 50J-200J. 100% compliant.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-20',
    equipmentId: 'EQP-DEF-602',
    name: 'Physio-Control LIFEPAK 15 Defibrillator / Monitor',
    type: 'Defibrillators',
    department: 'Emergency',
    location: 'Emergency Trauma Cart 1',
    operationalStatus: 'Operational',
    condition: 'Optimal',
    conditionScore: 98,
    lastMaintenanceDate: '2026-10-28',
    nextMaintenanceDate: '2027-01-28',
    maintenanceNotes: 'Biphasic 360J pacing & shock capability tested. Pacer rate calibrated.',
    lastUpdated: 'Today, 11:35 AM',
    telemetry: {
      internalTemp: 34.1,
      operatingHours: 1140,
      batteryLevel: 97,
      powerSource: 'Internal Battery',
      signalStrength: 97,
      firmwareVersion: 'v4.2.0',
      calibrationDate: '2026-10-28',
      primaryMetricLabel: 'Pacer & Shock Ready',
      primaryMetricValue: '360J Cap Charge < 5s',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-21', timestamp: 'Today, 07:15 AM', status: 'Operational', condition: 'Optimal', note: 'Shift handover defib self-test printout verified.', updatedBy: 'Nurse Anita Roy' }
    ],
    maintenanceHistory: [
      { id: 'mh-20', date: '2026-10-28', type: 'Biomedical Safety Check', technician: 'Elena Gomez', notes: 'Pacer impulse shape and rate precision within 1%.', result: 'Certified' }
    ]
  },
  {
    id: 'eqp-21',
    equipmentId: 'EQP-DEF-603',
    name: 'Philips HeartStart MRx Critical Care Defibrillator',
    type: 'Defibrillators',
    department: 'Surgical Suite',
    location: 'Operating Room 3 Crash Cart',
    operationalStatus: 'Standby',
    condition: 'Good',
    conditionScore: 92,
    lastMaintenanceDate: '2026-09-15',
    nextMaintenanceDate: '2026-12-15',
    maintenanceNotes: 'Paddles and multifunctional adult/pediatric hands-free pads verified.',
    lastUpdated: 'Today, 10:10 AM',
    telemetry: {
      internalTemp: 33.6,
      operatingHours: 980,
      batteryLevel: 99,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 93,
      firmwareVersion: 'v3.5.0',
      calibrationDate: '2026-09-15',
      primaryMetricLabel: 'Crash Cart Readiness',
      primaryMetricValue: 'SMART Biphasic Ready',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-22', timestamp: 'Today, 08:00 AM', status: 'Standby', condition: 'Good', note: 'Checked and sealed on OR 3 cart.', updatedBy: 'Surgical Charge Nurse' }
    ],
    maintenanceHistory: [
      { id: 'mh-21', date: '2026-09-15', type: 'Routine Preventive Maintenance', technician: 'David Kim', notes: 'Synchronized cardioversion response latency tested.', result: 'Passed' }
    ]
  },
  {
    id: 'eqp-22',
    equipmentId: 'EQP-DEF-604',
    name: 'Mindray BeneHeart D6 Defibrillator',
    type: 'Defibrillators',
    department: 'Cardiology Department',
    location: 'Cath Lab Prep Bay',
    operationalStatus: 'Maintenance Required',
    condition: 'Degraded',
    conditionScore: 65,
    lastMaintenanceDate: '2026-08-10',
    nextMaintenanceDate: '2026-11-10',
    maintenanceNotes: 'Auxiliary battery pack 2 capacity dropped below 70%. Needs battery replacement.',
    lastUpdated: 'Yesterday, 04:40 PM',
    telemetry: {
      internalTemp: 35.8,
      operatingHours: 2450,
      batteryLevel: 68,
      powerSource: 'AC Mains (UPS Backed)',
      signalStrength: 85,
      firmwareVersion: 'v2.1.8',
      calibrationDate: '2026-08-10',
      primaryMetricLabel: 'Battery Alert',
      primaryMetricValue: 'Batt 2 Capacity Fault',
      isSimulated: true
    },
    statusHistory: [
      { id: 'sh-23', timestamp: 'Yesterday, 04:40 PM', status: 'Maintenance Required', condition: 'Degraded', note: 'Flagged for auxiliary battery pack replacement.', updatedBy: 'Biomed Dept' }
    ],
    maintenanceHistory: [
      { id: 'mh-22', date: '2026-08-10', type: 'Routine Preventive Maintenance', technician: 'Elena Gomez', notes: 'Discharge test passed, battery age flagged.', result: 'Recalibrated' }
    ]
  }
];
