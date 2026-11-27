export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient';

export type RoleVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  // Permanent completed institutional affiliations:
  districtId?: string;
  districtName?: string;
  hospitalId?: string;
  hospitalName?: string;
  role?: UserRole;
  roleVerificationStatus: RoleVerificationStatus;
  rejectionReason?: string;
  requestedAt?: string;
  approvedAt?: string;
  isOnboarded: boolean; // TRUE only once verification is approved/completed!
}

// Temporary in-memory onboarding session data (NOT persisted until approved/completed!)
export interface TemporaryOnboardingState {
  name: string;
  username: string;
  districtId: string;
  districtName: string;
  hospitalId: string;
  hospitalName: string;
  role: UserRole | null;
  requestedAt?: string;
}

export interface District {
  id: string;
  name: string;
  headquarters: string;
  region: 'North' | 'South' | 'Central' | 'West';
  totalHospitals: number;
  criticalBedsTotal: number;
}

export interface Hospital {
  id: string;
  districtId: string;
  districtName: string;
  name: string;
  type: 'Government Medical College Hospital' | 'District Headquarters Hospital' | 'Multispecialty Healthcare' | 'Apex Super Specialty';
  location: string;
  availableDepartments: string[];
  status: 'Operational' | 'High Capacity' | 'Critical Load';
  totalBeds: number;
  occupiedBeds: number;
  readyBeds: number;
  prepBeds: number;
  icuAvailable: number;
  ventilatorsAvailable: number;
  phone: string;
  emergencyContact: string;
}

export type BedStatus = 'occupied' | 'discharged' | 'cleaning' | 'equipment_check' | 'nurse_confirmation' | 'ready';

export interface HospitalBed {
  id: string;
  hospitalId: string;
  ward: string;
  bedNumber: string;
  type: 'General' | 'ICU' | 'HDU' | 'Emergency' | 'Pediatric';
  status: BedStatus;
  patientName?: string;
  patientId?: string;
  assignedNurse?: string;
  lastUpdated: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  hospitalId: string;
  name: string;
  category: 'Ventilator' | 'Defibrillator' | 'Infusion Pump' | 'Dialysis Unit' | 'Cardiac Monitor';
  ward: string;
  status: 'Available' | 'In Use' | 'Under Maintenance' | 'Needs Check';
  lastInspection: string;
  serialNumber: string;
}

export type ResourceRequestStatus = 'pending' | 'approved' | 'allocated' | 'rejected' | 'fulfilled';

export interface ResourceRequest {
  id: string;
  hospitalId: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  department: string;
  resourceType: 'ICU Bed' | 'Ventilator' | 'HDU Bed' | 'Infusion Pump' | 'Emergency Bed';
  quantity: number;
  urgency: 'Routine' | 'Urgent' | 'Critical';
  reason: string;
  status: ResourceRequestStatus;
  createdAt: string;
  patientId?: string;
  patientName?: string;
  allocatedResourceId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PatientAppointment {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  date: string;
  time: string;
  tokenNumber: number;
  status: 'Scheduled' | 'In Queue' | 'Completed' | 'Cancelled';
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: UserRole;
  hospitalId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
}
