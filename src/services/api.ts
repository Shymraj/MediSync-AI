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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `API request failed with status ${response.status}`);
  }

  return data;
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

  updateBedStatus: (bedId: string, newStatus: string, notes?: string) => 
    request(`/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ newStatus, notes }) }),

  createRequest: (payload: any) => 
    request('/requests', { method: 'POST', body: JSON.stringify(payload) }),

  updateRequestStatus: (requestId: string, status: string, allocatedResourceId?: string) => 
    request(`/requests/${requestId}/status`, { method: 'PATCH', body: JSON.stringify({ status, allocatedResourceId }) }),

  bookAppointment: (payload: any) => 
    request('/appointments', { method: 'POST', body: JSON.stringify(payload) })
};
