import { 
  UserProfile, 
  UserRole, 
  TemporaryOnboardingState,
  HospitalBed, 
  Equipment, 
  ResourceRequest, 
  PatientAppointment, 
  NotificationItem, 
  BedStatus,
  Hospital,
  District
} from '../types';

const API_BASE = 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('medisync_auth_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('medisync_auth_jwt_token', token);
  } else {
    localStorage.removeItem('medisync_auth_jwt_token');
  }
}

async function request(endpoint: string, options: any = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Phase 23: Request timeout protection & graceful recovery
  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });

    // Gracefully handle expired or invalid JWT session
    if (response.status === 401) {
      setAuthToken(null);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `API request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms for ${endpoint}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth & Profile
  loginWithGoogle: (email: string, name: string, googleId?: string, portal?: string) => 
    request('/auth/google', { method: 'POST', body: JSON.stringify({ email, name, googleId, portal }) }),
  
  updateProfile: (name: string, username: string) => 
    request('/users/profile', { method: 'PUT', body: JSON.stringify({ name, username }) }),

  requestRole: (districtId: string, hospitalId: string, role: string) => 
    request('/users/request-role', { method: 'POST', body: JSON.stringify({ districtId, hospitalId, role }) }),

  verifyStaffDecision: (userId: string, decision: string, rejectionReason?: string) =>
    request('/admin/verify-user', { method: 'POST', body: JSON.stringify({ userId, decision, rejectionReason }) }),

  // Districts & Hospitals
  getDistricts: (): Promise<District[]> => 
    request('/districts'),

  getHospitals: (districtId?: string): Promise<Hospital[]> => 
    request(`/hospitals${districtId ? `?districtId=${districtId}` : ''}`),

  // Dashboards & Resources
  getHospitalDashboard: (hospitalId: string) => 
    request(`/hospitals/${hospitalId}/dashboard`),

  getDepartments: (hospitalId: string = 'hosp-chn-01') =>
    request(`/hospitals/${hospitalId}/departments`),

  getClinicalWards: (hospitalId: string = 'hosp-chn-01') =>
    request(`/hospitals/${hospitalId}/wards`),

  // Beds
  getBeds: (params: { hospitalId?: string; ward?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/beds${qs ? `?${qs}` : ''}`);
  },

  getBedsSummary: (hospitalId: string = 'hosp-chn-01') =>
    request(`/beds/summary?hospitalId=${hospitalId}`),

  updateBedStatus: (bedId: string, newStatus: string, notes?: string) => 
    request(`/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ newStatus, notes }) }),

  // Patients
  getPatients: (params: { hospitalId?: string; assignedOnly?: boolean } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/patients${qs ? `?${qs}` : ''}`);
  },

  getPatientById: (patientId: string) =>
    request(`/patients/${patientId}`),

  createPatient: (payload: any) =>
    request('/patients', { method: 'POST', body: JSON.stringify(payload) }),

  updatePatient: (patientId: string, payload: any) =>
    request(`/patients/${patientId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  admitPatient: (payload: { patientId: string; bedId: string; ward?: string; department?: string; initialDiagnosis?: string; doctorName?: string }) =>
    request('/patients/admit', { method: 'POST', body: JSON.stringify(payload) }),

  dischargePatient: (payload: { patientId: string; dischargeNotes?: string }) =>
    request('/patients/discharge', { method: 'POST', body: JSON.stringify(payload) }),

  // Equipment
  getEquipment: (params: { hospitalId?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/equipment${qs ? `?${qs}` : ''}`);
  },

  updateEquipmentStatus: (eqId: string, status: string, ward?: string, location?: string) =>
    request(`/equipment/${eqId}/status`, { method: 'PATCH', body: JSON.stringify({ status, ward, location }) }),

  // Resource Requests
  getRequests: (hospitalId: string = 'hosp-chn-01') =>
    request(`/requests?hospitalId=${hospitalId}`),

  createRequest: (payload: any) => 
    request('/requests', { method: 'POST', body: JSON.stringify(payload) }),

  updateRequestStatus: (requestId: string, status: string, allocatedResourceId?: string, allocatedResourceName?: string, rejectionReason?: string) => 
    request(`/requests/${requestId}/status`, { method: 'PATCH', body: JSON.stringify({ status, allocatedResourceId, allocatedResourceName, rejectionReason }) }),

  returnResource: (requestId: string, payload: { returnNotes?: string } = {}) =>
    request(`/requests/${requestId}/return`, { method: 'POST', body: JSON.stringify(payload) }),

  reportEquipmentFault: (eqId: string, payload: { reportedBy?: string; faultDescription: string; severity?: string }) =>
    request(`/equipment/${eqId}/fault`, { method: 'POST', body: JSON.stringify(payload) }),

  // Hospital Resource Registry & Medical Supplies
  getResources: (params: { hospitalId?: string; category?: string; department?: string; status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/resources${qs ? `?${qs}` : ''}`);
  },

  createResource: (payload: any) =>
    request('/resources', { method: 'POST', body: JSON.stringify(payload) }),

  updateResource: (id: string, payload: any) =>
    request(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  deleteResource: (id: string) =>
    request(`/resources/${id}`, { method: 'DELETE' }),

  adjustResourceStock: (id: string, payload: { adjustment?: number; quantity?: number; availableQuantity?: number; reason?: string }) =>
    request(`/resources/${id}/stock`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getResourceIntelligence: (hospitalId: string = 'hosp-chn-01') =>
    request(`/resources/intelligence?hospitalId=${hospitalId}`),

  // Clinical Tasks (Doctor <-> Nurse Communication)
  getClinicalTasks: (params: { hospitalId?: string; patientId?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/clinical-tasks${qs ? `?${qs}` : ''}`);
  },

  createClinicalTask: (payload: any) =>
    request('/clinical-tasks', { method: 'POST', body: JSON.stringify(payload) }),

  updateClinicalTaskStatus: (taskId: string, payload: { status: string; executionNotes?: string; vitalsRecorded?: any }) =>
    request(`/clinical-tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Clinical Alerts
  getClinicalAlerts: (hospitalId: string = 'hosp-chn-01', status?: string) =>
    request(`/clinical-alerts?hospitalId=${hospitalId}${status ? `&status=${status}` : ''}`),

  acknowledgeClinicalAlert: (alertId: string, payload: { notes?: string; status?: string }) =>
    request(`/clinical-alerts/${alertId}/acknowledge`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Patient Observations
  getObservations: (patientId: string) =>
    request(`/patients/${patientId}/observations`),

  recordObservation: (patientId: string, payload: any) =>
    request(`/patients/${patientId}/observations`, { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications & Audit Logs
  getNotifications: (hospitalId: string = 'hosp-chn-01') =>
    request(`/notifications?hospitalId=${hospitalId}`),

  markNotificationRead: (notifId: string) =>
    request(`/notifications/${notifId}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),

  getAuditLogs: () =>
    request('/audit-logs'),

  // Nursing Handovers
  getHandovers: (hospitalId: string = 'hosp-chn-01', ward?: string) =>
    request(`/handovers?hospitalId=${hospitalId}${ward ? `&ward=${encodeURIComponent(ward)}` : ''}`),

  getHandoverDraft: (hospitalId: string = 'hosp-chn-01', ward?: string) =>
    request(`/handovers/draft?hospitalId=${hospitalId}${ward ? `&ward=${encodeURIComponent(ward)}` : ''}`),

  createHandover: (payload: any) =>
    request('/handovers', { method: 'POST', body: JSON.stringify(payload) }),

  acknowledgeHandover: (handoverId: string, payload: { notes?: string; acknowledgedBy?: string } = {}) =>
    request(`/handovers/${handoverId}/acknowledge`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Medication Administration Records (MAR)
  getMedicationAdministrations: (params: { hospitalId?: string; patientId?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/medication-administrations${qs ? `?${qs}` : ''}`);
  },

  recordMedicationAdministration: (payload: any) =>
    request('/medication-administrations', { method: 'POST', body: JSON.stringify(payload) }),

  bookAppointment: (payload: any) => 
    request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),

  // Intelligent Emergency Command Center
  getEmergencyIncidents: (hospitalId: string = 'hosp-chn-01', includeSimulated: boolean = false) =>
    request(`/emergency/incidents?hospitalId=${hospitalId}${includeSimulated ? '&includeSimulated=true' : ''}`),

  getEmergencyAnalytics: (hospitalId: string = 'hosp-chn-01') =>
    request(`/emergency/analytics?hospitalId=${hospitalId}`),

  getEmergencyIncidentById: (incidentId: string) =>
    request(`/emergency/incidents/${incidentId}`),

  createEmergencyIncident: (payload: any) =>
    request('/emergency/incidents', { method: 'POST', body: JSON.stringify(payload) }),

  updateEmergencyPriority: (incidentId: string, severity: string, justification: string, updatedBy?: string) =>
    request(`/emergency/incidents/${incidentId}/priority`, { 
      method: 'PATCH', 
      body: JSON.stringify({ severity, justification, updatedBy }) 
    }),

  allocateEmergencyResources: (incidentId: string, payload: { bedId?: string; equipmentId?: string; allocatedBy?: string; notes?: string; isSimulated?: boolean }) =>
    request(`/emergency/incidents/${incidentId}/allocate-resources`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }),

  resolveEmergencyIncident: (incidentId: string, payload: { resolvedBy?: string; notes?: string; resolutionSummary?: string; releaseBed?: boolean; releaseVentilator?: boolean; bedId?: string }) =>
    request(`/emergency/incidents/${incidentId}/resolve`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }),

  simulateEmergencyScenario: (scenario: string) =>
    request('/emergency/simulate-scenario', { 
      method: 'POST', 
      body: JSON.stringify({ scenario }) 
    }),

  // Predictive Hospital Intelligence & Forecasting
  getForecastingMetrics: (params: { hospitalId?: string; horizon?: string; ward?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/forecasting/metrics${qs ? `?${qs}` : ''}`);
  },

  getPredictiveShortageAlerts: (hospitalId: string = 'hosp-chn-01') =>
    request(`/forecasting/alerts?hospitalId=${hospitalId}`),

  acknowledgeShortageAlert: (alertId: string, acknowledgedBy?: string) =>
    request(`/forecasting/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledgedBy })
    }),

  resolveShortageAlert: (alertId: string, resolvedBy?: string, notes?: string) =>
    request(`/forecasting/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolvedBy, notes })
    }),

  // Clinical Doctor Services: Appointments, Labs, Prescriptions, Admissions & Transfers
  getAppointments: (params: { hospitalId?: string; doctorName?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },

  updateAppointmentStatus: (id: string, status: string, notes?: string) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),

  getLabReports: (params: { hospitalId?: string; patientId?: string; category?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/lab-reports${qs ? `?${qs}` : ''}`);
  },

  orderLabReport: (payload: { patientId: string; hospitalId?: string; testName: string; category: string; doctorNotes?: string; criticalFlag?: boolean }) =>
    request('/lab-reports', { method: 'POST', body: JSON.stringify(payload) }),

  acknowledgeLabReport: (id: string, doctorNotes?: string) =>
    request(`/lab-reports/${id}/acknowledge`, { method: 'PATCH', body: JSON.stringify({ doctorNotes }) }),

  getPrescriptions: (params: { hospitalId?: string; patientId?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/prescriptions${qs ? `?${qs}` : ''}`);
  },

  createPrescription: (payload: { patientId: string; hospitalId?: string; diagnosis: string; medications: any[]; startDate?: string; endDate?: string; instructions?: string }) =>
    request('/prescriptions', { method: 'POST', body: JSON.stringify(payload) }),

  updatePrescriptionStatus: (id: string, status: string) =>
    request(`/prescriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getPendingAdmissions: (hospitalId: string = 'hosp-chn-01') =>
    request(`/admissions/pending?hospitalId=${hospitalId}`),

  acceptAdmission: (id: string, payload: { bedId?: string; ward?: string } = {}) =>
    request(`/admissions/${id}/accept`, { method: 'POST', body: JSON.stringify(payload) }),

  getTransfers: (hospitalId: string = 'hosp-chn-01') =>
    request(`/transfers?hospitalId=${hospitalId}`),

  createTransfer: (payload: { patientId: string; hospitalId?: string; fromWard: string; toWard: string; reason: string; fromBedId?: string; toBedId?: string }) =>
    request('/transfers', { method: 'POST', body: JSON.stringify(payload) }),

  updateTransferStatus: (transferId: string, payload: { status: string; toBedId?: string; notes?: string }) =>
    request(`/transfers/${transferId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // ==========================================
  // Hospital Interoperability & Health Data Exchange
  // ==========================================
  getInteroperabilityOverview: (hospitalId: string = 'hosp-chn-01') =>
    request(`/interoperability/overview?hospitalId=${hospitalId}`),

  getInteroperabilityConnections: (hospitalId: string = 'hosp-chn-01') =>
    request(`/interoperability/connections?hospitalId=${hospitalId}`),

  createInteroperabilityConnection: (payload: any) =>
    request('/interoperability/connections', { method: 'POST', body: JSON.stringify(payload) }),

  updateInteroperabilityConnection: (id: string, payload: any) =>
    request(`/interoperability/connections/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getInteroperabilityExchanges: (params: { hospitalId?: string; direction?: string; status?: string } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/interoperability/exchanges${qs ? `?${qs}` : ''}`);
  },

  retryExchangeTransaction: (id: string) =>
    request(`/interoperability/exchanges/retry/${id}`, { method: 'POST' }),

  getInboundPatientImports: (hospitalId: string = 'hosp-chn-01') =>
    request(`/interoperability/imports?hospitalId=${hospitalId}`),

  actionInboundPatientImport: (importId: string, payload: { action: 'commit' | 'reject'; resolutionStrategy?: string; reviewNotes?: string }) =>
    request(`/interoperability/imports/${importId}/action`, { method: 'POST', body: JSON.stringify(payload) }),

  getAbdmConsents: (hospitalId: string = 'hosp-chn-01') =>
    request(`/interoperability/abdm/consents?hospitalId=${hospitalId}`),

  createAbdmConsent: (payload: any) =>
    request('/interoperability/abdm/consents', { method: 'POST', body: JSON.stringify(payload) }),

  updateAbdmConsentStatus: (id: string, status: string) =>
    request(`/interoperability/abdm/consents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  validateFhirResource: (resource: any) =>
    request('/interoperability/fhir/validate', { method: 'POST', body: JSON.stringify({ resource }) }),

  // Real-Time Health & Diagnostics
  getRealtimeHealth: () => request('/realtime/health')
};
