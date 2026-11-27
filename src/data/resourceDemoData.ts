// Centralized Demo Data for MediSync AI Hospital Resource Registry
// Resource Registry Module (Synthetic Demo Data)

export type ResourceCategory = 
  | 'Medical Equipment'
  | 'Emergency Supplies'
  | 'ICU Resources'
  | 'General Hospital Supplies'
  | 'Patient Care Resources';

export type ResourceStatus = 
  | 'Available'
  | 'In Use'
  | 'Partially Available'
  | 'Under Maintenance'
  | 'Out of Stock';

export interface ResourceItem {
  id: string;
  resourceId: string;
  name: string;
  category: ResourceCategory;
  department: string;
  quantity: number;
  availableQuantity: number;
  status: ResourceStatus;
  description: string;
  lastUpdated: string;
  unit: string;
}

export const INITIAL_RESOURCES: ResourceItem[] = [
  // 1. Medical Equipment
  {
    id: 'res-01',
    resourceId: 'RES-EQP-101',
    name: 'Mechanical Ventilator (Dräger Evita V500)',
    category: 'Medical Equipment',
    department: 'ICU Complex',
    quantity: 14,
    availableQuantity: 10,
    status: 'Partially Available',
    description: 'High-end invasive & non-invasive ventilator with integrated lung protective telemetry.',
    lastUpdated: 'Today, 11:15 AM',
    unit: 'Units'
  },
  {
    id: 'res-02',
    resourceId: 'RES-EQP-102',
    name: 'Multipara Vital Signs Monitor (Philips IntelliVue MX750)',
    category: 'Medical Equipment',
    department: 'Emergency',
    quantity: 28,
    availableQuantity: 22,
    status: 'Partially Available',
    description: '15-inch bedside touch monitor tracking ECG, SpO2, NIBP, temperature, and EtCO2.',
    lastUpdated: 'Today, 10:45 AM',
    unit: 'Units'
  },
  {
    id: 'res-03',
    resourceId: 'RES-EQP-103',
    name: 'Biphasic Defibrillator with External Pacing (Zoll R Series)',
    category: 'Medical Equipment',
    department: 'Cardiology',
    quantity: 8,
    availableQuantity: 6,
    status: 'Partially Available',
    description: 'Code-ready clinical defibrillator with CPR feedback sensor and pediatric paddle set.',
    lastUpdated: 'Today, 09:30 AM',
    unit: 'Units'
  },
  {
    id: 'res-04',
    resourceId: 'RES-EQP-104',
    name: 'Mobile Digital Radiography X-Ray Unit (Siemens Mobilett)',
    category: 'Medical Equipment',
    department: 'Emergency',
    quantity: 3,
    availableQuantity: 1,
    status: 'Partially Available',
    description: 'Cordless motorized mobile digital X-Ray system for bedside and trauma imaging.',
    lastUpdated: 'Today, 08:50 AM',
    unit: 'Units'
  },
  {
    id: 'res-05',
    resourceId: 'RES-EQP-105',
    name: 'Volumetric Infusion Syringe Pump (Fresenius Kabi Injectomat)',
    category: 'Medical Equipment',
    department: 'ICU Complex',
    quantity: 45,
    availableQuantity: 38,
    status: 'Partially Available',
    description: 'Micro-dose precision infusion syringe pump for vasoactive and sedative infusions.',
    lastUpdated: 'Today, 11:00 AM',
    unit: 'Units'
  },
  {
    id: 'res-06',
    resourceId: 'RES-EQP-106',
    name: 'Hemodialysis Machine (Fresenius 4008S Classic)',
    category: 'Medical Equipment',
    department: 'Cardiology',
    quantity: 6,
    availableQuantity: 0,
    status: 'In Use',
    description: 'Dialysis unit with automated volumetric ultrafiltration and bicarbonate dialysis.',
    lastUpdated: 'Today, 07:45 AM',
    unit: 'Units'
  },
  {
    id: 'res-07',
    resourceId: 'RES-EQP-107',
    name: 'Anesthesia Workstation (Mindray A7)',
    category: 'Medical Equipment',
    department: 'Bio-Medical Unit',
    quantity: 5,
    availableQuantity: 0,
    status: 'Under Maintenance',
    description: 'Integrated digital gas mixer with electronic vaporizer and agent monitoring.',
    lastUpdated: 'Today, 06:30 AM',
    unit: 'Units'
  },

  // 2. Emergency Supplies
  {
    id: 'res-08',
    resourceId: 'RES-EMG-201',
    name: 'Rapid Fluid Infusion Trauma Resuscitation Kits',
    category: 'Emergency Supplies',
    department: 'Emergency',
    quantity: 25,
    availableQuantity: 18,
    status: 'Partially Available',
    description: 'High-flow pressure infusion sleeves, macro-bore tubing, and rapid blood warming line.',
    lastUpdated: 'Today, 10:20 AM',
    unit: 'Kits'
  },
  {
    id: 'res-09',
    resourceId: 'RES-EMG-202',
    name: 'Medical Grade Oxygen Cylinders (D-Type 47 Liters)',
    category: 'Emergency Supplies',
    department: 'General Ward',
    quantity: 60,
    availableQuantity: 48,
    status: 'Available',
    description: 'Pressurized O2 cylinders with regulator, pin-index safety system, and flowmeter.',
    lastUpdated: 'Today, 09:15 AM',
    unit: 'Cylinders'
  },
  {
    id: 'res-10',
    resourceId: 'RES-EMG-203',
    name: 'Emergency Surgical Cricothyrotomy & Airway Sets',
    category: 'Emergency Supplies',
    department: 'Emergency',
    quantity: 15,
    availableQuantity: 12,
    status: 'Available',
    description: 'Single-use sterile rapid airway access cannula with dilator and 6.0mm cuffed tube.',
    lastUpdated: 'Today, 10:10 AM',
    unit: 'Kits'
  },
  {
    id: 'res-11',
    resourceId: 'RES-EMG-204',
    name: 'Automated External Defibrillator (AED) Adult Pads',
    category: 'Emergency Supplies',
    department: 'Emergency',
    quantity: 0,
    availableQuantity: 0,
    status: 'Out of Stock',
    description: 'Pre-gelled disposable defibrillation electrode pads for public access AED units.',
    lastUpdated: 'Today, 08:00 AM',
    unit: 'Pairs'
  },

  // 3. ICU Resources
  {
    id: 'res-12',
    resourceId: 'RES-ICU-301',
    name: 'Arterial Blood Gas (ABG) Sensor Cartridges',
    category: 'ICU Resources',
    department: 'ICU Complex',
    quantity: 50,
    availableQuantity: 35,
    status: 'Partially Available',
    description: 'Point-of-care ABG cartridges analyzing pH, pCO2, pO2, electrolytes, and lactate.',
    lastUpdated: 'Today, 11:05 AM',
    unit: 'Cartridges'
  },
  {
    id: 'res-13',
    resourceId: 'RES-ICU-302',
    name: 'Triple-Lumen Central Venous Catheter (CVC) Trays',
    category: 'ICU Resources',
    department: 'ICU Complex',
    quantity: 30,
    availableQuantity: 24,
    status: 'Available',
    description: '7 French 20cm antimicrobial polyurethane central line insertion kit with Seldinger wire.',
    lastUpdated: 'Today, 10:35 AM',
    unit: 'Trays'
  },
  {
    id: 'res-14',
    resourceId: 'RES-ICU-303',
    name: 'Intra-Aortic Balloon Pump (IABP) Catheters (8 Fr 40cc)',
    category: 'ICU Resources',
    department: 'Cardiology',
    quantity: 10,
    availableQuantity: 7,
    status: 'Partially Available',
    description: 'Percutaneous counterpulsation balloon catheter for cardiogenic shock support.',
    lastUpdated: 'Today, 09:40 AM',
    unit: 'Units'
  },
  {
    id: 'res-15',
    resourceId: 'RES-ICU-304',
    name: 'Continuous Renal Replacement Therapy (CRRT) Tubing Sets',
    category: 'ICU Resources',
    department: 'ICU Complex',
    quantity: 8,
    availableQuantity: 5,
    status: 'Partially Available',
    description: 'Pre-assembled extracorporeal hemofiltration circuit with AN69 membrane.',
    lastUpdated: 'Today, 08:30 AM',
    unit: 'Sets'
  },

  // 4. General Hospital Supplies
  {
    id: 'res-16',
    resourceId: 'RES-GEN-401',
    name: 'Hospital Grade Terminal Disinfectant Solution (5L Canister)',
    category: 'General Hospital Supplies',
    department: 'Central Pharmacy',
    quantity: 80,
    availableQuantity: 65,
    status: 'Available',
    description: 'EPA-registered broad-spectrum virucidal and sporicidal sanitizing solution.',
    lastUpdated: 'Today, 07:15 AM',
    unit: 'Canisters'
  },
  {
    id: 'res-17',
    resourceId: 'RES-GEN-402',
    name: 'Sterile Surgical Gloves & Clinical PPE Bundles',
    category: 'General Hospital Supplies',
    department: 'Central Pharmacy',
    quantity: 120,
    availableQuantity: 95,
    status: 'Available',
    description: 'Powder-free latex-free surgical gloves and Level-3 fluid-resistant barrier gowns.',
    lastUpdated: 'Today, 09:00 AM',
    unit: 'Boxes'
  },
  {
    id: 'res-18',
    resourceId: 'RES-GEN-403',
    name: 'Disposable Closed Suction Catheters (14 Fr)',
    category: 'General Hospital Supplies',
    department: 'General Ward',
    quantity: 150,
    availableQuantity: 110,
    status: 'Available',
    description: '24-hour closed tracheostomy suction system with viral isolation filter sleeve.',
    lastUpdated: 'Today, 10:00 AM',
    unit: 'Units'
  },

  // 5. Patient Care Resources
  {
    id: 'res-19',
    resourceId: 'RES-PCR-501',
    name: 'Powered Alternating Pressure Air Mattress (Anti-Decubitus)',
    category: 'Patient Care Resources',
    department: 'General Ward',
    quantity: 20,
    availableQuantity: 15,
    status: 'Partially Available',
    description: 'Medical mattress overlay system preventing Stage 1-4 pressure ulcer formation.',
    lastUpdated: 'Today, 10:50 AM',
    unit: 'Units'
  },
  {
    id: 'res-20',
    resourceId: 'RES-PCR-502',
    name: 'LED Overhead Neonatal Phototherapy System',
    category: 'Patient Care Resources',
    department: 'Pediatrics',
    quantity: 6,
    availableQuantity: 4,
    status: 'Partially Available',
    description: 'High-intensity blue LED phototherapy unit for neonatal hyperbilirubinemia.',
    lastUpdated: 'Today, 09:25 AM',
    unit: 'Units'
  },
  {
    id: 'res-21',
    resourceId: 'RES-PCR-503',
    name: 'Heavy-Duty Bariatric Patient Transport Wheelchair',
    category: 'Patient Care Resources',
    department: 'Emergency',
    quantity: 18,
    availableQuantity: 12,
    status: 'Partially Available',
    description: 'Reinforced steel frame transport wheelchair with swing-away elevating footrests.',
    lastUpdated: 'Today, 08:15 AM',
    unit: 'Units'
  }
];
