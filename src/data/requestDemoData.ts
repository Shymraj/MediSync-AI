// Centralized Demo Data for MediSync AI Hospital Resource Requests
// Resource Requests Module (Synthetic Demo Data)
import { ResourceCategory } from './resourceDemoData';

export type RequestStatus = 
  | 'Pending'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Allocated'
  | 'Completed'
  | 'Cancelled';

export type RequestPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export interface RequestTimelineEntry {
  id: string;
  timestamp: string;
  action: 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected' | 'Allocated' | 'Completed' | 'Cancelled';
  actor: string;
  notes: string;
  date?: string;
  status?: string;
  user?: string;
  note?: string;
}

export interface ResourceRequestItem {
  id: string;
  requestId: string;
  requestedBy: string;
  doctorEmail: string;
  doctorPhone: string;
  department: string;
  ward: string;
  resourceType: ResourceCategory;
  resourceName: string;
  quantity: number;
  unit: string;
  priority: RequestPriority;
  requestDate: string;
  status: RequestStatus;
  reason: string;
  allocatedResourceId?: string;
  allocatedResourceName?: string;
  allocatedQuantity?: number;
  rejectionReason?: string;
  timeline: RequestTimelineEntry[];
  patientId?: string;
  patientName?: string;
  allocatedResourceDetails?: string;
  requesterId?: string;
  requesterRole?: string;
  clinicalJustification?: string;
}

export const INITIAL_REQUESTS: ResourceRequestItem[] = [
  {
    id: 'req-01',
    requestId: 'REQ-2026-081',
    requestedBy: 'Dr. Alex Rivera',
    doctorEmail: 'alex.rivera.trauma@emergency.gov.in',
    doctorPhone: '+91 98402 77881',
    department: 'Emergency',
    ward: 'Emergency Ward',
    resourceType: 'Medical Equipment',
    resourceName: 'Mechanical Ventilator (Dräger Evita V500)',
    quantity: 2,
    unit: 'Units',
    priority: 'Urgent',
    requestDate: 'Today, 11:30 AM',
    status: 'Pending',
    reason: 'Multi-casualty highway collision arrival. 2 incoming patients require immediate invasive mechanical ventilation with PEEP telemetry.',
    timeline: [
      { id: 't-1', timestamp: 'Today, 11:30 AM', action: 'Submitted', actor: 'Dr. Alex Rivera (Emergency Head)', notes: 'Submitted urgent equipment requisition for trauma triage stabilization.' }
    ]
  },
  {
    id: 'req-02',
    requestId: 'REQ-2026-082',
    requestedBy: 'Dr. Radhakrishnan K.',
    doctorEmail: 'dr.radhakrishnan@rgggh.edu.in',
    doctorPhone: '+91 98841 87654',
    department: 'ICU Complex',
    ward: 'ICU Complex',
    resourceType: 'ICU Resources',
    resourceName: 'Arterial Blood Gas (ABG) Cartridges (Siemens RAPIDPoint)',
    quantity: 50,
    unit: 'Tests',
    priority: 'Urgent',
    requestDate: 'Today, 10:15 AM',
    status: 'Under Review',
    reason: 'Current ICU cartridge reserve dropped below critical safety threshold of 15 tests. Expected demand of 40+ tests across high-dependency ventilators today.',
    timeline: [
      { id: 't-2', timestamp: 'Today, 10:15 AM', action: 'Submitted', actor: 'Dr. Radhakrishnan K. (Critical Care Lead)', notes: 'Submitted priority reorder for central pathology inventory.' },
      { id: 't-3', timestamp: 'Today, 10:45 AM', action: 'Reviewed', actor: 'Hospital Admin Command', notes: 'Cross-verifying central pharmacy reserves and batch expiry.' }
    ]
  },
  {
    id: 'req-03',
    requestId: 'REQ-2026-083',
    requestedBy: 'Dr. Sarah Mitchell',
    doctorEmail: 's.mitchell.cardio@medisync.net',
    doctorPhone: '+91 97910 33445',
    department: 'Cardiology',
    ward: 'Cardiology Ward',
    resourceType: 'Emergency Supplies',
    resourceName: 'Automated External Defibrillator (AED) Pads (Adult/Pediatric)',
    quantity: 6,
    unit: 'Packs',
    priority: 'High',
    requestDate: 'Today, 09:20 AM',
    status: 'Approved',
    reason: 'Coronary care unit (CCU) defibrillator readiness audit identified 2 expired electrode sets on Mobile Crash Cart 2.',
    timeline: [
      { id: 't-4', timestamp: 'Today, 09:20 AM', action: 'Submitted', actor: 'Dr. Sarah Mitchell', notes: 'Safety audit replacement request for CCU carts.' },
      { id: 't-5', timestamp: 'Today, 09:50 AM', action: 'Approved', actor: 'Hospital Admin Command', notes: 'Approved for direct central medical store issuance.' }
    ]
  },
  {
    id: 'req-04',
    requestId: 'REQ-2026-084',
    requestedBy: 'Dr. Sundaramoorthy M.',
    doctorEmail: 'dr.sundar@medisync.gov.in',
    doctorPhone: '+91 94440 12345',
    department: 'General Medicine',
    ward: 'General Ward',
    resourceType: 'General Hospital Supplies',
    resourceName: 'N95 Respirator Masks (3M 1860)',
    quantity: 100,
    unit: 'Boxes',
    priority: 'Normal',
    requestDate: 'Yesterday, 04:30 PM',
    status: 'Allocated',
    reason: 'Routine sub-acute ward inventory replenishment for aerosol precaution protocols.',
    allocatedResourceId: 'res-14',
    allocatedResourceName: 'N95 Respirator Masks (3M 1860)',
    allocatedQuantity: 100,
    timeline: [
      { id: 't-6', timestamp: 'Yesterday, 04:30 PM', action: 'Submitted', actor: 'Dr. Sundaramoorthy M.', notes: 'Weekly replenishment request.' },
      { id: 't-7', timestamp: 'Yesterday, 05:15 PM', action: 'Approved', actor: 'Hospital Admin Command', notes: 'Approved by materials management.' },
      { id: 't-8', timestamp: 'Yesterday, 06:00 PM', action: 'Allocated', actor: 'Central Store Manager', notes: 'Dispatched 100 boxes from Warehouse Shelf A-14.' }
    ]
  },
  {
    id: 'req-05',
    requestId: 'REQ-2026-085',
    requestedBy: 'Dr. Anand Kumar',
    doctorEmail: 'anand.surgery@rgggh.gov.in',
    doctorPhone: '+91 98411 22334',
    department: 'Surgery',
    ward: 'Surgical Post-Op Ward',
    resourceType: 'Medical Equipment',
    resourceName: 'Infusion Pump (BD Alaris GH Plus)',
    quantity: 3,
    unit: 'Units',
    priority: 'High',
    requestDate: 'Yesterday, 02:15 PM',
    status: 'Completed',
    reason: 'Scheduled elective vascular bypass surgeries for post-anesthesia recovery room.',
    allocatedResourceId: 'res-04',
    allocatedResourceName: 'Volumetric Infusion Pump (B. Braun Infusomat Space)',
    allocatedQuantity: 3,
    timeline: [
      { id: 't-9', timestamp: 'Yesterday, 02:15 PM', action: 'Submitted', actor: 'Dr. Anand Kumar (Chief Surgeon)', notes: 'Surgical suite requisition.' },
      { id: 't-10', timestamp: 'Yesterday, 03:00 PM', action: 'Approved', actor: 'Hospital Admin Command', notes: 'Approved.' },
      { id: 't-11', timestamp: 'Yesterday, 03:30 PM', action: 'Allocated', actor: 'Biomedical Inventory', notes: '3 calibrated infusion pumps allocated.' },
      { id: 't-12', timestamp: 'Yesterday, 05:00 PM', action: 'Completed', actor: 'Nurse In-Charge Sangeetha', notes: 'Pumps delivered and bedside calibrated in PACU.' }
    ]
  },
  {
    id: 'req-06',
    requestId: 'REQ-2026-086',
    requestedBy: 'Dr. Meena Swaminathan',
    doctorEmail: 'meena.pedi@rgggh.gov.in',
    doctorPhone: '+91 94445 66778',
    department: 'Pediatrics',
    ward: 'Pediatrics Ward',
    resourceType: 'Patient Care Resources',
    resourceName: 'Non-Invasive Positive Pressure Ventilation (NIV) Mask',
    quantity: 8,
    unit: 'Kits',
    priority: 'Normal',
    requestDate: '2026-11-25',
    status: 'Completed',
    reason: 'Seasonal RSV broncho-pulmonary pediatric admissions requiring infant-sized non-invasive interfaces.',
    allocatedResourceId: 'res-17',
    allocatedResourceName: 'Non-Invasive Positive Pressure Ventilation (NIV) Mask',
    allocatedQuantity: 8,
    timeline: [
      { id: 't-13', timestamp: '2026-11-25, 10:00 AM', action: 'Submitted', actor: 'Dr. Meena Swaminathan', notes: 'Submitted for pediatric bay.' },
      { id: 't-14', timestamp: '2026-11-25, 11:30 AM', action: 'Approved', actor: 'Hospital Admin Command', notes: 'Approved.' },
      { id: 't-15', timestamp: '2026-11-25, 02:00 PM', action: 'Completed', actor: 'Store Officer', notes: 'Issued and received by pediatric nurse in-charge.' }
    ]
  },
  {
    id: 'req-07',
    requestId: 'REQ-2026-087',
    requestedBy: 'Dr. V. Chandran',
    doctorEmail: 'chandran.neuro@rgggh.gov.in',
    doctorPhone: '+91 98840 99001',
    department: 'Neurology',
    ward: 'Neurology Ward',
    resourceType: 'Medical Equipment',
    resourceName: 'Multipara Vital Signs Monitor (Philips IntelliVue MX750)',
    quantity: 12,
    unit: 'Units',
    priority: 'Low',
    requestDate: '2026-11-24',
    status: 'Rejected',
    reason: 'Requesting 12 bedside monitors for general stroke sub-ward.',
    rejectionReason: 'Exceeds standard neurology step-down allocation limits. Please requisition through annual institutional budget expansion committee.',
    timeline: [
      { id: 't-16', timestamp: '2026-11-24, 09:00 AM', action: 'Submitted', actor: 'Dr. V. Chandran', notes: 'Bulk equipment request.' },
      { id: 't-17', timestamp: '2026-11-24, 01:30 PM', action: 'Rejected', actor: 'Hospital Admin Command', notes: 'Rejected: Exceeds non-emergency allocation thresholds.' }
    ]
  },
  {
    id: 'req-08',
    requestId: 'REQ-2026-088',
    requestedBy: 'Dr. Rajeshwari Sundaram',
    doctorEmail: 'rajeshwari.ortho@rgggh.gov.in',
    doctorPhone: '+91 97910 88990',
    department: 'Orthopedics',
    ward: 'Orthopedic & Trauma Ward',
    resourceType: 'General Hospital Supplies',
    resourceName: 'Sterile Surgical Gloves (Powder-Free, Size 7.5)',
    quantity: 40,
    unit: 'Boxes',
    priority: 'Normal',
    requestDate: '2026-11-25',
    status: 'Cancelled',
    reason: 'Anticipated joint replacement camp supplies.',
    timeline: [
      { id: 't-18', timestamp: '2026-11-25, 08:30 AM', action: 'Submitted', actor: 'Dr. Rajeshwari Sundaram', notes: 'Camp supply buffer.' },
      { id: 't-19', timestamp: '2026-11-25, 11:00 AM', action: 'Cancelled', actor: 'Dr. Rajeshwari Sundaram', notes: 'Cancelled by clinician: Central surgical store already replenished ward buffer.' }
    ]
  }
];
