export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient' | 'hospital' | 'overview';

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

export interface HospitalRegistrationDetails {
  hospitalName: string;
  hospitalType: string;
  registrationNumber: string;
  ownership: 'Government' | 'Private' | 'Trust';
  category: 'General' | 'Multispeciality' | 'Super speciality';
  yearEstablished: string;
  hospitalLogo?: string;
  description: string;
  website?: string;
}

export interface HospitalLocationContactDetails {
  hospitalAddress: string;
  areaLocality: string;
  pincode: string;
  hospitalPhone: string;
  hospitalEmail: string;
  emergencyContact: string;
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
  // Hospital Registration details (Step 1)
  hospitalType?: string;
  registrationNumber?: string;
  ownership?: 'Government' | 'Private' | 'Trust';
  category?: 'General' | 'Multispeciality' | 'Super speciality';
  yearEstablished?: string;
  hospitalLogo?: string;
  hospitalDescription?: string;
  website?: string;
  // Step 3 Location & Contact details (Section 1 & 2)
  hospitalAddress?: string;
  areaLocality?: string;
  pincode?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  emergencyContact?: string;
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

// ==========================================
// EMERGENCY COMMAND CENTER TYPES
// ==========================================

export type EmergencySeverity = 'Level 1' | 'Level 2' | 'Level 3';
export type EmergencyStatus = 'Reported' | 'Under Assessment' | 'Resource Requested' | 'Resources Allocated' | 'In Progress' | 'Resolved';

export interface EmergencyTimelineEvent {
  stage: string;
  timestamp: string;
  actor: string;
  notes: string;
}

export interface EmergencyMatchedResources {
  score?: number;
  rationale?: string;
  recommendedBed?: {
    id: string;
    bedNumber: string;
    ward: string;
    type: string;
    status: string;
  } | null;
  recommendedVentilator?: {
    id: string;
    name: string;
    ward: string;
    status: string;
  } | null;
  bloodAvailable?: {
    bloodGroup: string;
    units: number;
    available: boolean;
  };
  assignedDoctor?: string;
  alternatives?: Array<{
    type: string;
    ward: string;
    suggestion: string;
  }>;
  shortages?: string[];
}

export interface EmergencyIncident {
  id: string;
  hospitalId: string;
  patientId?: string;
  patientName: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyType: string;
  severity: EmergencySeverity;
  location: string;
  requiredResources: string[];
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedNurseName?: string;
  status: EmergencyStatus;
  allocatedBedId?: string;
  allocatedBedNumber?: string;
  allocatedEquipmentId?: string;
  allocatedEquipmentName?: string;
  priorityJustification?: string;
  reportedAt: string;
  updatedAt: string;
  isSimulated?: boolean;
  resolutionSummary?: string;
  timeline: EmergencyTimelineEvent[];
  matchedResources?: EmergencyMatchedResources;
}

export interface EmergencyAnalytics {
  activeCount: number;
  criticalCount: number;
  averageResponseMinutes: number;
  averageAllocationMinutes: number;
  bedUtilizationPercent: number;
  shortageCount: number;
  resolutionRatePercent: number;
  severityBreakdown: {
    level1: number;
    level2: number;
    level3: number;
  };
  recentTrends: Array<{
    time: string;
    active: number;
    resolved: number;
  }>;
}

// ==========================================
// PREDICTIVE HOSPITAL INTELLIGENCE & FORECASTING
// ==========================================

export type ForecastingHorizon = '24h' | '3d' | '7d';

export interface PredictiveShortageAlert {
  id: string;
  alert_id: string;
  hospital_id: string;
  resource_type: string;
  resource_category: string;
  ward_or_department: string;
  current_available: number;
  forecasted_demand: number;
  expected_shortage: number;
  time_horizon: string; // e.g. '24 Hours', '3 Days', '7 Days'
  confidence_score: number;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  severity: 'Critical' | 'Warning' | 'Moderate';
  recommended_actions: string[];
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceDemandForecastItem {
  resourceType: string;
  category: string;
  currentAvailable: number;
  currentUtilizationPercent: number;
  historicalDemandAvg: number;
  forecastedDemand: number;
  expectedShortage: number;
  forecastConfidencePercent: number;
  recommendedPreparation: string;
}

export interface WardOccupancyForecastItem {
  wardName: string;
  type: string;
  totalBeds: number;
  currentOccupied: number;
  currentAvailable: number;
  expectedAdmissions: number;
  expectedDischarges: number;
  predictedOccupancyPercent: number;
  possibleShortage: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
}

export interface BedOccupancyForecast {
  currentOccupiedBeds: number;
  availableBeds: number;
  expectedAdmissions: number;
  expectedDischarges: number;
  predictedOccupancyPercent: number;
  possibleShortage: number;
  wardBreakdown: WardOccupancyForecastItem[];
}

export interface EquipmentForecastItem {
  equipmentName: string;
  category: string;
  currentAvailable: number;
  historicalUsageAvg: number;
  expectedDemand: number;
  possibleShortage: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  recommendedReadiness: string;
}

export interface EmergencyCategoryPattern {
  category: string;
  percentage: number;
  resourceSurge: string;
}

export interface EmergencyDemandPatterns {
  frequencyToday: number;
  historicalDailyAverage: number;
  peakSurgePeriod: string;
  commonCategories: EmergencyCategoryPattern[];
  wardDemandPatterns: Array<{
    ward: string;
    demandTrend: string;
    expectedLoad: string;
  }>;
}

export interface TimelineForecastPoint {
  timestamp: string;
  historicalDemand: number | null;
  forecastedDemand: number | null;
  availableCapacity: number;
  expectedShortage: number;
}

export interface PredictiveForecastingData {
  hospitalId: string;
  timeHorizon: string;
  horizonCode: ForecastingHorizon;
  modelType: string;
  isDemoForecast: boolean;
  dataConfidenceScore: number;
  summary: {
    totalHospitalBeds: number;
    currentOccupiedBeds: number;
    availableBeds: number;
    expectedAdmissionsTotal: number;
    expectedDischargesTotal: number;
    projectedOccupancyPercent: number;
    criticalShortagesIdentified: number;
  };
  resourceDemandForecast: ResourceDemandForecastItem[];
  bedOccupancyForecast: BedOccupancyForecast;
  equipmentForecast: EquipmentForecastItem[];
  emergencyPatterns: EmergencyDemandPatterns;
  timelineData: TimelineForecastPoint[];
}

// ==========================================
// HOSPITAL DIGITAL TWIN & SIMULATION LAB
// ==========================================

export interface DepartmentDigitalTwin {
  id: string;
  name: string;
  code: string;
  floor: string;
  type: 'ICU' | 'Emergency' | 'Inpatient' | 'Stepdown' | 'Surgical' | 'Diagnostics';
  totalBeds: number;
  occupiedBeds: number;
  readyBeds: number;
  maintenanceBeds: number;
  equipmentSummary: Array<{ name: string; available: number; total: number }>;
  onDutyStaff: { doctors: number; nurses: number };
  readinessScore: number; // 0 - 100%
  status: 'Operational' | 'High Load' | 'Critical Strain' | 'Evacuated';
}

export interface SimulationScenarioParameters {
  id: string;
  title: string;
  description: string;
  emergencyType: string;
  patientCount: number;
  severityDistribution: {
    level1Percent: number; // Code Red
    level2Percent: number; // Code Orange
    level3Percent: number; // Code Yellow
  };
  durationHours: number;
  resourceRequirements: {
    icuBeds: number;
    emergencyBeds: number;
    generalBeds: number;
    ventilators: number;
    oxygenUnits: number;
    bloodUnits: number;
    specialists: number;
  };
  isPreset?: boolean;
}

export interface SimulationResourceImpact {
  resourceName: string;
  category: string;
  initialAvailable: number;
  additionalDemand: number;
  expectedShortage: number;
  simulatedOccupancyPercent: number;
  severity: 'Critical' | 'Warning' | 'Manageable';
  mitigationRecommendation: string;
}

export interface SimulationReallocationStrategy {
  strategyId: string;
  name: string;
  description: string;
  reallocations: string[];
  bedCoveragePercent: number;
  ventilatorCoveragePercent: number;
  overallCoverageScore: number; // 0 - 100%
  unmetDemandCount: number;
  feasibilityRating: 'Optimal' | 'Viable with Risk' | 'Overloaded';
}

export interface SimulationPreparationPlan {
  resourcesToPrepare: string[];
  departmentsAttention: string[];
  equipmentVerification: string[];
  suggestedTransfers: string[];
  adminTasks: string[];
  doctorTasks: string[];
  nurseTasks: string[];
}

export interface SimulationRunResult {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: string;
  simulatedBy: string;
  readinessScore: number; // 0 - 100%
  responseDifficulty: 'Low' | 'Moderate' | 'High' | 'Critical Surge';
  overallBedCapacityImpact: {
    baselineOccupancyPercent: number;
    simulatedOccupancyPercent: number;
    deficitCount: number;
  };
  resourceImpacts: SimulationResourceImpact[];
  departmentImpacts: Array<{
    departmentName: string;
    impactLevel: 'Critical' | 'Severe' | 'Moderate' | 'Low';
    notes: string;
  }>;
  strategies: SimulationReallocationStrategy[];
  recommendedStrategyId: string;
  preparationPlan: SimulationPreparationPlan;
  majorWeaknesses: string[];
  isSimulation: true;
}

// ==========================================
// INTELLIGENT HOSPITAL WORKFLOW AUTOMATION
// ==========================================

export type WorkflowCategory = 
  | 'Resource Requests'
  | 'Bed Readiness'
  | 'Equipment Maintenance'
  | 'Patient Transfer'
  | 'Clinical Tasks'
  | 'Discharge'
  | 'Emergency Coordination';

export type WorkflowExecutionStatus = 
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'paused';

export type WorkflowStepType = 
  | 'trigger'
  | 'condition'
  | 'action'
  | 'notification'
  | 'approval'
  | 'completion';

export type WorkflowStepStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WorkflowStepConfig {
  id: string;
  name: string;
  type: WorkflowStepType;
  description: string;
  config: Record<string, any>;
  order: number;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerEvent: string;
  conditionDescription: string;
  actionDescription: string;
  targetRole: UserRole | 'maintenance' | 'bio-med' | 'all';
  approvalRequired: boolean;
  approverRole?: UserRole | 'medical_director' | 'supervisor';
  approvalTimeoutMinutes?: number;
  steps: WorkflowStepConfig[];
  isActive: boolean;
  isSystemRule: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionStep {
  stepId: string;
  name: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  details: string;
  timestamp?: string;
  actor?: string;
  error?: string;
}

export interface WorkflowAuditLog {
  id: string;
  executionId: string;
  ruleName: string;
  stepName: string;
  action: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  note?: string;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  category: WorkflowCategory;
  status: WorkflowExecutionStatus;
  triggerData: {
    event: string;
    entityId?: string;
    entityType?: 'patient' | 'bed' | 'equipment' | 'request' | 'alert' | 'transfer' | 'task';
    summary: string;
    urgency: 'Routine' | 'Urgent' | 'Critical';
    department?: string;
  };
  currentStepIndex: number;
  totalSteps: number;
  steps: WorkflowExecutionStep[];
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  initiatedBy: string;
  assignedApprover?: string;
  failureReason?: string;
  retryCount: number;
  auditLogs: WorkflowAuditLog[];
  isDemo?: boolean;
}

export interface WorkflowStatistics {
  totalExecutions: number;
  activeExecutions: number;
  completedExecutions: number;
  pendingApprovals: number;
  failedExecutions: number;
  avgDurationMinutes: number;
  successRatePercent: number;
  manualApprovalsCount: number;
}

export interface SmartNotificationRule {
  id: string;
  name: string;
  eventType: string;
  condition: string;
  targetRole: UserRole | 'maintenance' | 'bio-med' | 'all';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  escalationIntervalMinutes: number;
  soundAlert: boolean;
  isActive: boolean;
  description: string;
}




