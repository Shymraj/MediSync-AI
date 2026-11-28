// MediSync AI - Hospital Interoperability & Health Data Exchange Types
// Standardized for HL7 FHIR Release 4 (R4) and ABDM (Ayushman Bharat Digital Mission)

// ==========================================
// 1. HL7 FHIR R4 RESOURCES
// ==========================================

export type FHIRResourceType = 
  | 'Patient'
  | 'Practitioner'
  | 'Organization'
  | 'Encounter'
  | 'Observation'
  | 'Condition'
  | 'MedicationRequest'
  | 'ServiceRequest'
  | 'DiagnosticReport'
  | 'CarePlan'
  | 'Appointment';

export interface FHIRCoding {
  system: string;
  code: string;
  display: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary';
  type?: FHIRCodeableConcept;
  system: string;
  value: string;
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

// 1.1 Patient
export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: FHIRIdentifier[];
  active: boolean;
  name: Array<{
    use: string;
    family: string;
    given: string[];
    prefix?: string[];
  }>;
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
    use: 'home' | 'work' | 'mobile';
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  address?: Array<{
    use: string;
    line: string[];
    city: string;
    district?: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  managingOrganization?: FHIRReference;
}

// 1.2 Practitioner
export interface FHIRPractitioner {
  resourceType: 'Practitioner';
  id: string;
  identifier: FHIRIdentifier[];
  active: boolean;
  name: Array<{
    family: string;
    given: string[];
    prefix?: string[];
  }>;
  qualification: Array<{
    code: FHIRCodeableConcept;
    issuer?: FHIRReference;
  }>;
  telecom: Array<{
    system: string;
    value: string;
  }>;
}

// 1.3 Organization
export interface FHIROrganization {
  resourceType: 'Organization';
  id: string;
  identifier: FHIRIdentifier[];
  active: boolean;
  type: FHIRCodeableConcept[];
  name: string;
  telecom: Array<{
    system: string;
    value: string;
  }>;
  address: Array<{
    line: string[];
    city: string;
    state: string;
    postalCode: string;
  }>;
}

// 1.4 Encounter
export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: FHIRCoding;
  type: FHIRCodeableConcept[];
  subject: FHIRReference;
  participant: Array<{
    individual: FHIRReference;
  }>;
  period: FHIRPeriod;
  reasonCode?: FHIRCodeableConcept[];
  hospitalization?: {
    admitSource?: FHIRCodeableConcept;
    dischargeDisposition?: FHIRCodeableConcept;
  };
  serviceProvider?: FHIRReference;
}

// 1.5 Observation
export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected';
  category: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  interpretation?: FHIRCodeableConcept[];
  referenceRange?: Array<{
    low?: { value: number; unit: string };
    high?: { value: number; unit: string };
    text?: string;
  }>;
}

// 1.6 Condition
export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: FHIRCodeableConcept;
  verificationStatus?: FHIRCodeableConcept;
  category: FHIRCodeableConcept[];
  severity?: FHIRCodeableConcept;
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  onsetDateTime?: string;
  recordedDate?: string;
}

// 1.7 MedicationRequest
export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft';
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order';
  medicationCodeableConcept: FHIRCodeableConcept;
  subject: FHIRReference;
  authoredOn: string;
  requester?: FHIRReference;
  dosageInstruction: Array<{
    text: string;
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } };
    route?: FHIRCodeableConcept;
    doseAndRate?: Array<{ doseQuantity?: { value: number; unit: string } }>;
  }>;
}

// 1.8 ServiceRequest
export interface FHIRServiceRequest {
  resourceType: 'ServiceRequest';
  id: string;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed';
  intent: 'order' | 'proposal' | 'plan';
  category?: FHIRCodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  occurrenceDateTime?: string;
  requester?: FHIRReference;
  reasonCode?: FHIRCodeableConcept[];
}

// 1.9 DiagnosticReport
export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended';
  category: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  effectiveDateTime: string;
  issued: string;
  performer?: FHIRReference[];
  result?: FHIRReference[];
  conclusion?: string;
}

// 1.10 CarePlan
export interface FHIRCarePlan {
  resourceType: 'CarePlan';
  id: string;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed';
  intent: 'proposal' | 'plan' | 'order';
  title?: string;
  description?: string;
  subject: FHIRReference;
  period?: FHIRPeriod;
  activity: Array<{
    detail?: {
      code?: FHIRCodeableConcept;
      status: string;
      description?: string;
    };
  }>;
}

// 1.11 Appointment
export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  serviceCategory?: FHIRCodeableConcept[];
  appointmentType?: FHIRCodeableConcept;
  description?: string;
  start: string;
  end: string;
  participant: Array<{
    actor?: FHIRReference;
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
}

// FHIR Bundle Wrapper
export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'message' | 'transaction' | 'collection' | 'searchset';
  timestamp: string;
  total?: number;
  entry: Array<{
    fullUrl?: string;
    resource: any;
  }>;
}

// ==========================================
// 2. ABDM (Ayushman Bharat Digital Mission)
// ==========================================

export interface ABHAPatientProfile {
  abhaNumber: string;        // 14 digits format: 91-4428-1902-8814
  abhaAddress: string;       // username@abdm
  name: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth?: string;
  yearOfBirth: number;
  mobile: string;
  address?: string;
  district?: string;
  state?: string;
  kycVerified: boolean;
  hipId: string;             // Health Information Provider ID
}

export interface ABDMConsentArtefact {
  id: string;
  consentId: string;
  patientAbha: string;
  patientName: string;
  hipId: string;
  hipName: string;
  hiuId: string;
  hiuName: string;
  purpose: 'Care Management' | 'Emergency Care' | 'Referral / Second Opinion' | 'Diagnostic Consultation';
  purposeCode: 'CAREMGT' | 'EMERGENCY' | 'REFERRAL' | 'DIAGNOSTIC';
  hiTypes: Array<'DiagnosticReport' | 'Prescription' | 'DischargeSummary' | 'OPConsultation' | 'ImmunizationRecord'>;
  dateRange: {
    from: string;
    to: string;
  };
  consentStatus: 'REQUESTED' | 'GRANTED' | 'REVOKED' | 'EXPIRED';
  grantedAt?: string;
  expiresAt: string;
  signatureStatus: 'Cryptographically Verified (JWS)' | 'Pending Signature' | 'Invalid';
}

// ==========================================
// 3. INTEGRATION SYSTEMS & CONNECTIONS
// ==========================================

export type IntegrationSystemType = 'FHIR_R4' | 'ABDM_M1_M2' | 'HL7_V2' | 'DICOM_WEB';
export type ConnectionStatus = 'Connected' | 'Degraded' | 'Disconnected' | 'Syncing' | 'Configured_Sandbox';

export interface InteroperabilityConnection {
  id: string;
  hospitalId: string;
  name: string;
  identifier: string;
  systemType: IntegrationSystemType;
  connectionStatus: ConnectionStatus;
  isSimulated: boolean;       // Distinctly tags simulated vs live connected systems
  endpointUrl: string;
  authType: 'OAuth2' | 'Mutual_TLS' | 'API_Key' | 'ABDM_Gateway_Token';
  authCredentialsMasked: string;
  lastSyncTime: string;
  totalRecords: number;
  successRate: number;        // e.g. 98.4%
  errorStatus: string | null;
  activeSyncs: number;
  supportedResources: string[];
  notes?: string;
}

// ==========================================
// 4. DATA EXCHANGE TRANSACTION & AUDIT
// ==========================================

export interface ExchangeTransaction {
  id: string;
  transactionId: string;
  timestamp: string;
  hospitalId: string;
  connectionId: string;
  systemName: string;
  resourceType: FHIRResourceType | 'Bundle' | 'ABDM_Consent' | 'DischargeSummary';
  direction: 'INBOUND' | 'OUTBOUND';
  recordCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'VALIDATION_ERROR' | 'RETRYING';
  patientRef?: string;
  patientName?: string;
  abhaId?: string;
  payloadSummary: string;
  errorDetails?: string;
  retryCount: number;
  authorizedBy: string;
  consentId?: string;
}

// ==========================================
// 5. INBOUND IMPORT & DUPLICATE DETECTION
// ==========================================

export interface DuplicateMatchCandidate {
  existingPatientId: string;
  existingName: string;
  existingDob: string;
  existingGender: string;
  existingPhone: string;
  existingMrn: string;
  matchScore: number;         // 0 - 100%
  matchReasons: string[];
}

export interface InboundPatientImport {
  importId: string;
  sourceSystem: string;
  importedAt: string;
  incomingPatient: {
    name: string;
    mrn: string;
    abhaNumber?: string;
    abhaAddress?: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    phone: string;
    bloodGroup?: string;
    address: string;
    diagnosisSummary: string;
    allergies: string[];
    medications: string[];
    vitals?: {
      bloodPressure?: string;
      heartRate?: number;
      spo2?: number;
      temperature?: number;
    };
  };
  validationStatus: 'VALID' | 'WARNING' | 'INVALID';
  validationErrors: string[];
  duplicateCheckStatus: 'CLEAN' | 'EXACT_MATCH' | 'POTENTIAL_DUPLICATE';
  duplicateCandidates: DuplicateMatchCandidate[];
  stagedStatus: 'PENDING_REVIEW' | 'COMMITTED' | 'REJECTED';
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface InteroperabilityOverviewStats {
  totalConnections: number;
  activeLiveConnections: number;
  simulatedSandboxes: number;
  totalExchanges24h: number;
  successfulExchanges: number;
  failedExchanges: number;
  pendingImportBatches: number;
  activeAbdmConsents: number;
  overallHealthScore: number;
}
