// Centralized Demo Data for MediSync AI Hospital Bed Management
// Step 2: Bed Management / Bed Master Status

export type BedStatusType = 'Available' | 'Occupied' | 'Cleaning' | 'Reserved' | 'Maintenance';
export type BedTypeCategory = 'General' | 'ICU' | 'Emergency' | 'Isolation';
export type WardCategory = 'General Ward' | 'ICU' | 'Emergency' | 'Cardiology' | 'Neurology' | 'Pediatrics' | 'Orthopedics' | 'Surgery' | 'Obstetrics & Gynecology';

export interface BedHistoryItem {
  id: string;
  timestamp: string;
  fromStatus: BedStatusType;
  toStatus: BedStatusType;
  updatedBy: string;
  notes?: string;
}

export interface BedItem {
  id: string;
  bedId: string;
  ward: WardCategory;
  bedType: BedTypeCategory;
  floor: string;
  status: BedStatusType;
  patient: string; // "Unassigned" for available, or patient name/ID
  equipment: string;
  lastUpdated: string;
  statusHistory: BedHistoryItem[];
  notes?: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  history?: any[];
}

export const INITIAL_BEDS: BedItem[] = [
  {
    id: 'bed-01',
    bedId: 'EMG-B101',
    ward: 'Emergency',
    bedType: 'Emergency',
    floor: 'Ground Floor (Triage)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Crash Cart, Wall O2, Defibrillator Ready',
    lastUpdated: '10 mins ago',
    statusHistory: [
      {
        id: 'h-1',
        timestamp: 'Today, 10:45 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Nurse In-Charge Priya',
        notes: 'Terminal sanitization & triage readiness sign-off'
      }
    ]
  },
  {
    id: 'bed-02',
    bedId: 'EMG-B102',
    ward: 'Emergency',
    bedType: 'Emergency',
    floor: 'Ground Floor (Triage)',
    status: 'Occupied',
    patient: 'P-1042 · Rajesh Kumar (48M)',
    equipment: 'Multipara Monitor, High-Flow O2',
    lastUpdated: '25 mins ago',
    statusHistory: [
      {
        id: 'h-2',
        timestamp: 'Today, 10:30 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. Sundaramoorthy',
        notes: 'Acute respiratory distress intake'
      }
    ]
  },
  {
    id: 'bed-03',
    bedId: 'EMG-B103',
    ward: 'Emergency',
    bedType: 'Emergency',
    floor: 'Ground Floor (Triage)',
    status: 'Cleaning',
    patient: 'Unassigned',
    equipment: 'Wall O2, Suction Port',
    lastUpdated: '12 mins ago',
    statusHistory: [
      {
        id: 'h-3',
        timestamp: 'Today, 10:43 AM',
        fromStatus: 'Occupied',
        toStatus: 'Cleaning',
        updatedBy: 'Staff Nurse Kavitha',
        notes: 'Patient transferred to Stepdown; sanitization in progress'
      }
    ]
  },
  {
    id: 'bed-04',
    bedId: 'EMG-B104',
    ward: 'Emergency',
    bedType: 'Emergency',
    floor: 'Ground Floor (Triage)',
    status: 'Reserved',
    patient: 'Reserved · Inbound Ambulance 108 (ETA 8m)',
    equipment: 'Ventilator Standby, Infusion Pump',
    lastUpdated: '5 mins ago',
    statusHistory: [
      {
        id: 'h-4',
        timestamp: 'Today, 10:50 AM',
        fromStatus: 'Available',
        toStatus: 'Reserved',
        updatedBy: 'Emergency Command Desk',
        notes: 'Pre-reserved for polytrauma inbound'
      }
    ]
  },
  {
    id: 'bed-05',
    bedId: 'ICU-A201',
    ward: 'ICU',
    bedType: 'ICU',
    floor: '4th Floor (ICU Complex)',
    status: 'Occupied',
    patient: 'P-1089 · Meenakshi Sundaram (56F)',
    equipment: 'Mechanical Ventilator (Dräger Evita), Arterial Line Monitor',
    lastUpdated: '1 hour ago',
    statusHistory: [
      {
        id: 'h-5',
        timestamp: 'Today, 09:55 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. Radhakrishnan K.',
        notes: 'Post-CABG intensive monitoring'
      }
    ]
  },
  {
    id: 'bed-06',
    bedId: 'ICU-A202',
    ward: 'ICU',
    bedType: 'ICU',
    floor: '4th Floor (ICU Complex)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Mechanical Ventilator, Calibrated Multi-Parameter',
    lastUpdated: '18 mins ago',
    statusHistory: [
      {
        id: 'h-6',
        timestamp: 'Today, 10:37 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Senior Nurse Lavanya M.',
        notes: 'Nurse sign-off complete. Ready for instant critical admission'
      }
    ]
  },
  {
    id: 'bed-07',
    bedId: 'ICU-A203',
    ward: 'ICU',
    bedType: 'ICU',
    floor: '4th Floor (ICU Complex)',
    status: 'Cleaning',
    patient: 'Unassigned',
    equipment: 'Mechanical Ventilator (HEPA Sanitized), Infusion Stand',
    lastUpdated: '30 mins ago',
    statusHistory: [
      {
        id: 'h-7',
        timestamp: 'Today, 10:25 AM',
        fromStatus: 'Occupied',
        toStatus: 'Cleaning',
        updatedBy: 'Sanitation Team Block A',
        notes: 'Terminal disinfection protocol stage 2'
      }
    ]
  },
  {
    id: 'bed-08',
    bedId: 'ICU-A204',
    ward: 'ICU',
    bedType: 'Isolation',
    floor: '4th Floor (ICU Complex)',
    status: 'Occupied',
    patient: 'P-2015 · Anandhi Natarajan (34F)',
    equipment: 'Negative Pressure Isolation, Servo-u Ventilator',
    lastUpdated: '45 mins ago',
    statusHistory: [
      {
        id: 'h-8',
        timestamp: 'Today, 10:10 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. Sundaramoorthy',
        notes: 'Severe sepsis with isolation protocol'
      }
    ]
  },
  {
    id: 'bed-09',
    bedId: 'ICU-A205',
    ward: 'ICU',
    bedType: 'ICU',
    floor: '4th Floor (ICU Complex)',
    status: 'Maintenance',
    patient: 'Unassigned',
    equipment: 'Dialysis Port Repair, Bio-Med Inspection',
    lastUpdated: '2 hours ago',
    statusHistory: [
      {
        id: 'h-9',
        timestamp: 'Today, 08:50 AM',
        fromStatus: 'Available',
        toStatus: 'Maintenance',
        updatedBy: 'Bio-Medical Engineering',
        notes: 'Hydraulic bed motor replacement & telemetry recalibration'
      }
    ]
  },
  {
    id: 'bed-10',
    bedId: 'CARD-B301',
    ward: 'Cardiology',
    bedType: 'ICU',
    floor: '3rd Floor (Heart Center)',
    status: 'Occupied',
    patient: 'P-3102 · Vigneshwaran S. (29M)',
    equipment: '12-Lead Telemetry, Intra-Aortic Balloon Pump Port',
    lastUpdated: '15 mins ago',
    statusHistory: [
      {
        id: 'h-10',
        timestamp: 'Today, 10:40 AM',
        fromStatus: 'Reserved',
        toStatus: 'Occupied',
        updatedBy: 'Dr. K. Radhakrishnan',
        notes: 'Admitted from Cath Lab'
      }
    ]
  },
  {
    id: 'bed-11',
    bedId: 'CARD-B302',
    ward: 'Cardiology',
    bedType: 'General',
    floor: '3rd Floor (Heart Center)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Continuous Wireless ECG Monitor, Oxygen Port',
    lastUpdated: '50 mins ago',
    statusHistory: [
      {
        id: 'h-11',
        timestamp: 'Today, 10:05 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Nurse In-Charge Anitha',
        notes: 'Sanitized and prepared for post-angioplasty recovery'
      }
    ]
  },
  {
    id: 'bed-12',
    bedId: 'CARD-B303',
    ward: 'Cardiology',
    bedType: 'General',
    floor: '3rd Floor (Heart Center)',
    status: 'Occupied',
    patient: 'P-4051 · Fatima Begum (62F)',
    equipment: 'Cardiac Rhythm Monitor, IV Pole',
    lastUpdated: '1 hour ago',
    statusHistory: [
      {
        id: 'h-12',
        timestamp: 'Today, 09:50 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. S. Narayanan',
        notes: 'Heart failure stabilization'
      }
    ]
  },
  {
    id: 'bed-13',
    bedId: 'CARD-B304',
    ward: 'Cardiology',
    bedType: 'Isolation',
    floor: '3rd Floor (Heart Center)',
    status: 'Reserved',
    patient: 'Reserved · Post-Op Cath Lab 2 (ETA 20m)',
    equipment: 'Defibrillator Unit, Syringe Driver',
    lastUpdated: '8 mins ago',
    statusHistory: [
      {
        id: 'h-13',
        timestamp: 'Today, 10:47 AM',
        fromStatus: 'Available',
        toStatus: 'Reserved',
        updatedBy: 'Cardiology Ward Desk',
        notes: 'Pre-op hold for primary angioplasty'
      }
    ]
  },
  {
    id: 'bed-14',
    bedId: 'NEURO-C401',
    ward: 'Neurology',
    bedType: 'ICU',
    floor: '3rd Floor (Neuro Wing)',
    status: 'Occupied',
    patient: 'P-5190 · Karthik R. (41M)',
    equipment: 'ICP Monitor, EEG Telemetry, Mechanical Vent',
    lastUpdated: '35 mins ago',
    statusHistory: [
      {
        id: 'h-14',
        timestamp: 'Today, 10:20 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. V. Chandran',
        notes: 'Post-thrombectomy neuro-critical care'
      }
    ]
  },
  {
    id: 'bed-15',
    bedId: 'NEURO-C402',
    ward: 'Neurology',
    bedType: 'General',
    floor: '3rd Floor (Neuro Wing)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Neuro Vital Monitor, Anti-Embolism Pump',
    lastUpdated: '40 mins ago',
    statusHistory: [
      {
        id: 'h-15',
        timestamp: 'Today, 10:15 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Nurse Saranya M.',
        notes: 'Inspected and certified for neuro intake'
      }
    ]
  },
  {
    id: 'bed-16',
    bedId: 'NEURO-C403',
    ward: 'Neurology',
    bedType: 'General',
    floor: '3rd Floor (Neuro Wing)',
    status: 'Maintenance',
    patient: 'Unassigned',
    equipment: 'EEG telemetry harness check required',
    lastUpdated: '3 hours ago',
    statusHistory: [
      {
        id: 'h-16',
        timestamp: 'Today, 07:55 AM',
        fromStatus: 'Available',
        toStatus: 'Maintenance',
        updatedBy: 'Bio-Medical Unit',
        notes: 'Wall oxygen flow meter recalibration'
      }
    ]
  },
  {
    id: 'bed-17',
    bedId: 'PEDI-D101',
    ward: 'Pediatrics',
    bedType: 'ICU',
    floor: '2nd Floor (NICU/PICU)',
    status: 'Occupied',
    patient: 'P-6012 · Baby Aarav (5M)',
    equipment: 'Neonatal Incubator, Micro-Ventilator, Phototherapy',
    lastUpdated: '20 mins ago',
    statusHistory: [
      {
        id: 'h-17',
        timestamp: 'Today, 10:35 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. Meena Swaminathan',
        notes: 'Neonatal respiratory support'
      }
    ]
  },
  {
    id: 'bed-18',
    bedId: 'PEDI-D102',
    ward: 'Pediatrics',
    bedType: 'General',
    floor: '2nd Floor (Pediatric Ward)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Pediatric Cot, Wall O2, Low-Dose Infusion Pump',
    lastUpdated: '1 hour ago',
    statusHistory: [
      {
        id: 'h-18',
        timestamp: 'Today, 09:55 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Nurse Revathi S.',
        notes: 'Child-safe sanitization complete'
      }
    ]
  },
  {
    id: 'bed-19',
    bedId: 'PEDI-D103',
    ward: 'Pediatrics',
    bedType: 'Isolation',
    floor: '2nd Floor (Pediatric Ward)',
    status: 'Cleaning',
    patient: 'Unassigned',
    equipment: 'Pediatric Isolation Canopy, HEPA Filter',
    lastUpdated: '25 mins ago',
    statusHistory: [
      {
        id: 'h-19',
        timestamp: 'Today, 10:30 AM',
        fromStatus: 'Occupied',
        toStatus: 'Cleaning',
        updatedBy: 'Pediatric Ward Staff',
        notes: 'Disinfection following discharge'
      }
    ]
  },
  {
    id: 'bed-20',
    bedId: 'GEN-E201',
    ward: 'General Ward',
    bedType: 'General',
    floor: '1st Floor (Ward Block A)',
    status: 'Occupied',
    patient: 'P-7120 · Subramanian T. (71M)',
    equipment: 'Standard Wall O2, Suction Port',
    lastUpdated: '50 mins ago',
    statusHistory: [
      {
        id: 'h-20',
        timestamp: 'Today, 10:05 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Dr. Sundaramoorthy',
        notes: 'Post-operative recovery monitoring'
      }
    ]
  },
  {
    id: 'bed-21',
    bedId: 'GEN-E202',
    ward: 'General Ward',
    bedType: 'General',
    floor: '1st Floor (Ward Block A)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Standard Hospital Bed, IV Stand',
    lastUpdated: '15 mins ago',
    statusHistory: [
      {
        id: 'h-21',
        timestamp: 'Today, 10:40 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Housekeeping Supervisor',
        notes: 'Linen changed, sanitized, certified ready'
      }
    ]
  },
  {
    id: 'bed-22',
    bedId: 'GEN-E203',
    ward: 'General Ward',
    bedType: 'General',
    floor: '1st Floor (Ward Block A)',
    status: 'Occupied',
    patient: 'P-7235 · Deepa Chandran (44F)',
    equipment: 'IV Infusion Pole, O2 Mask',
    lastUpdated: '2 hours ago',
    statusHistory: [
      {
        id: 'h-22',
        timestamp: 'Today, 08:55 AM',
        fromStatus: 'Available',
        toStatus: 'Occupied',
        updatedBy: 'Duty Physician Dr. Bala',
        notes: 'Gastroenterology inpatient care'
      }
    ]
  },
  {
    id: 'bed-23',
    bedId: 'GEN-E204',
    ward: 'General Ward',
    bedType: 'General',
    floor: '1st Floor (Ward Block A)',
    status: 'Cleaning',
    patient: 'Unassigned',
    equipment: 'Standard Hospital Bed',
    lastUpdated: '10 mins ago',
    statusHistory: [
      {
        id: 'h-23',
        timestamp: 'Today, 10:45 AM',
        fromStatus: 'Occupied',
        toStatus: 'Cleaning',
        updatedBy: 'Ward Nurse Jaya',
        notes: 'Discharged this morning, turnover in progress'
      }
    ]
  },
  {
    id: 'bed-24',
    bedId: 'GEN-E205',
    ward: 'General Ward',
    bedType: 'Isolation',
    floor: '1st Floor (Isolation Wing)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Negative Pressure Filter, Dedicated Vitals Monitor',
    lastUpdated: '35 mins ago',
    statusHistory: [
      {
        id: 'h-24',
        timestamp: 'Today, 10:20 AM',
        fromStatus: 'Cleaning',
        toStatus: 'Available',
        updatedBy: 'Infection Control Unit',
        notes: 'Isolation room airborne clearance granted'
      }
    ]
  },
  // Orthopedics beds
  {
    id: 'bed-25',
    bedId: 'ORT-A101',
    ward: 'Orthopedics',
    bedType: 'General',
    floor: '2nd Floor (Surgical Block B)',
    status: 'Occupied',
    patient: 'P-1120 · Ramesh Babu (52M)',
    equipment: 'Orthopedic Traction Frame, Vital Signs Monitor',
    lastUpdated: '20 mins ago',
    statusHistory: [
      { id: 'h-25', timestamp: 'Today, 08:30 AM', fromStatus: 'Available', toStatus: 'Occupied', updatedBy: 'Nurse In-Charge Manimegalai', notes: 'Admitted for knee arthroplasty post-op care' }
    ]
  },
  {
    id: 'bed-26',
    bedId: 'ORT-A102',
    ward: 'Orthopedics',
    bedType: 'General',
    floor: '2nd Floor (Surgical Block B)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Standard Orthopedic Bed, Call Bell Ready',
    lastUpdated: '1 hour ago',
    statusHistory: [
      { id: 'h-26', timestamp: 'Today, 09:15 AM', fromStatus: 'Cleaning', toStatus: 'Available', updatedBy: 'Nurse Anandhi', notes: 'Sanitized and prepared for elective admission' }
    ]
  },
  // Surgery beds
  {
    id: 'bed-27',
    bedId: 'SUR-B201',
    ward: 'Surgery',
    bedType: 'General',
    floor: '3rd Floor (OR Suite Wing)',
    status: 'Occupied',
    patient: 'P-1144 · Meenakshi Sundaram (45F)',
    equipment: 'PACU Vitals Monitor, IV Infusion Tree, O2 Flowmeter',
    lastUpdated: '15 mins ago',
    statusHistory: [
      { id: 'h-27', timestamp: 'Today, 10:00 AM', fromStatus: 'Available', toStatus: 'Occupied', updatedBy: 'Nurse In-Charge Sangeetha', notes: 'Post-laparoscopic recovery monitoring' }
    ]
  },
  {
    id: 'bed-28',
    bedId: 'SUR-B202',
    ward: 'Surgery',
    bedType: 'General',
    floor: '3rd Floor (OR Suite Wing)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Surgical Recovery Bed, Suction Unit',
    lastUpdated: '45 mins ago',
    statusHistory: [
      { id: 'h-28', timestamp: 'Today, 10:10 AM', fromStatus: 'Cleaning', toStatus: 'Available', updatedBy: 'Nurse Divya P.', notes: 'Cleaned and ready for afternoon surgery roster' }
    ]
  },
  // Obstetrics & Gynecology beds
  {
    id: 'bed-29',
    bedId: 'OBG-C301',
    ward: 'Obstetrics & Gynecology',
    bedType: 'General',
    floor: '2nd Floor (Women\'s Health Pavilion)',
    status: 'Occupied',
    patient: 'P-1158 · Divya Bharathi (28F)',
    equipment: 'Fetal Doppler, Postnatal Bed, Neonatal Bassinet',
    lastUpdated: '30 mins ago',
    statusHistory: [
      { id: 'h-29', timestamp: 'Today, 07:45 AM', fromStatus: 'Available', toStatus: 'Occupied', updatedBy: 'Nurse In-Charge Vasanthi', notes: 'Post-cesarean rooming-in suite' }
    ]
  },
  {
    id: 'bed-30',
    bedId: 'OBG-C302',
    ward: 'Obstetrics & Gynecology',
    bedType: 'General',
    floor: '2nd Floor (Women\'s Health Pavilion)',
    status: 'Available',
    patient: 'Unassigned',
    equipment: 'Electric Maternity Bed, Infant Warmer Ready',
    lastUpdated: '15 mins ago',
    statusHistory: [
      { id: 'h-30', timestamp: 'Today, 11:00 AM', fromStatus: 'Cleaning', toStatus: 'Available', updatedBy: 'Midwife Nurse Latha', notes: 'Ready for scheduled delivery intake' }
    ]
  }
];
