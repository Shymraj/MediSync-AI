import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, setAuthToken } from '../services/api';
import { 
  UserProfile, 
  UserRole, 
  TemporaryOnboardingState,
  HospitalRegistrationDetails,
  HospitalLocationContactDetails,
  HospitalBed, 
  Equipment, 
  ResourceRequest, 
  PatientAppointment, 
  NotificationItem, 
  BedStatus,
  Hospital,
  District
} from '../types';
import { 
  hospitalDataService, 
  DATA_UPDATED_EVENT 
} from '../services/hospitalDataService';
import {
  setActiveHospitalScopeId,
  getActiveHospitalScopeId,
  hospitalScopedKey
} from '../utils/hospitalSync';
import { 
  PatientDigitalTwin, 
  DoctorNurseTaskItem, 
  EarlyWarningAlertItem 
} from '../data/doctorDemoData';
import { BedStatusType } from '../data/bedDemoData';
import { SocketConnectionStatus, ClinicalAudioSynthesizer } from '../types/realtime';

interface AppContextType {
  user: UserProfile | null;
  // Temporary In-Memory Onboarding State
  tempOnboarding: TemporaryOnboardingState;
  resetTempOnboarding: () => void;
  updateTempProfile: (name: string, username: string) => Promise<void>;
  updateHospitalRegistrationDetails: (details: Partial<HospitalRegistrationDetails>) => void;
  updateHospitalLocationContact: (details: Partial<HospitalLocationContactDetails>) => void;
  updateTempDistrict: (districtId: string, districtName: string) => void;
  updateTempHospital: (hospitalId: string, hospitalName: string) => void;
  updateTempRole: (role: UserRole) => void;
  clearTempRole: () => void;
  clearTempHospital: () => void;
  clearTempDistrict: () => void;
  // Finalizing Onboarding via Backend API
  completeVerificationApproval: (targetRole?: UserRole) => Promise<void>;
  simulateAdminDecision: (decision: 'approved' | 'rejected', reason?: string) => Promise<void>;
  requestRoleApproval: () => Promise<void>;
  // Global hospital resources & session
  selectedHospitalId: string;
  districts: District[];
  hospitals: Hospital[];
  beds: HospitalBed[];
  equipment: Equipment[];
  resourceRequests: ResourceRequest[];
  appointments: PatientAppointment[];
  notifications: NotificationItem[];
  // Hospital-Wide Patient, Task & Alert Integration
  patients: PatientDigitalTwin[];
  doctorNurseTasks: DoctorNurseTaskItem[];
  clinicalAlerts: EarlyWarningAlertItem[];
  assignPatientToBed: (bedId: string, patientName: string, patientId: string, doctor?: string, nurse?: string) => { success: boolean; message: string };
  createDoctorNurseTask: (params: Parameters<typeof hospitalDataService.createDoctorNurseTask>[0]) => DoctorNurseTaskItem;
  updateNurseTaskStatus: (params: Parameters<typeof hospitalDataService.updateNurseTaskStatus>[0]) => DoctorNurseTaskItem | null;
  acknowledgeClinicalAlert: (alertId: string, doctorName?: string) => boolean;
  generateClinicalAlert: (alertData: Parameters<typeof hospitalDataService.generateClinicalAlert>[0]) => EarlyWarningAlertItem;
  unreadNotificationsCount: number;
  loginWithGoogle: (email?: string, name?: string, portal?: 'hospital' | 'patient') => Promise<UserProfile>;
  loginRegisteredHospital: (record: any) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  // Resource lifecycle interactions
  updateBedStatus: (bedId: string, newStatus: BedStatus, notes?: string) => Promise<void>;
  createResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => Promise<void>;
  bookAppointment: (department: string, doctorName: string, date: string, time: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  resetDemoToScenario: () => void;
  // Real-Time Communication & Health Updates
  connectionStatus: SocketConnectionStatus;
  connectionLatencyMs: number;
  isAudioMuted: boolean;
  toggleAudioMuted: () => void;
  reconnectSocket: () => void;
  activeEmergencyModal: any | null;
  closeEmergencyModal: () => void;
  acknowledgeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const STORAGE_KEY_USER = 'medisync_authenticated_account_v2';

const initialEmptyOnboarding: TemporaryOnboardingState = {
  name: '',
  username: '',
  districtId: '',
  districtName: '',
  hospitalId: '',
  hospitalName: '',
  role: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [tempOnboarding, setTempOnboarding] = useState<TemporaryOnboardingState>(() => ({
    ...initialEmptyOnboarding,
    name: user?.name || '',
    username: user?.username || '',
  }));

  const [districts, setDistricts] = useState<District[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>(() => hospitalDataService.getHospitalBeds());
  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    return hospitalDataService.getEquipment().map(eq => ({
      id: eq.id,
      hospitalId: 'hosp-chn-01',
      name: eq.name,
      category: eq.type === 'Ventilators' ? ('Ventilator' as const) : eq.type === 'Infusion Pumps' ? ('Infusion Pump' as const) : ('Cardiac Monitor' as const),
      ward: eq.department,
      status: eq.operationalStatus === 'Operational' ? ('Available' as const) : eq.operationalStatus === 'In Use' ? ('In Use' as const) : ('Under Maintenance' as const),
      lastInspection: eq.lastInspection || eq.lastMaintenanceDate,
      serialNumber: eq.serialNumber || eq.equipmentId
    }));
  });
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(() => {
    return hospitalDataService.getResourceRequests().map(r => ({
      id: r.id,
      hospitalId: 'hosp-chn-01',
      requesterId: r.requesterId || r.requestId,
      requesterName: r.requestedBy,
      requesterRole: ((r.requesterRole || 'doctor').toLowerCase() as UserRole) || 'doctor',
      department: r.department,
      resourceType: r.resourceType as any,
      quantity: r.quantity,
      urgency: r.priority === 'Urgent' ? ('Critical' as const) : ('Routine' as const),
      reason: r.clinicalJustification || r.reason,
      status: (r.status.toLowerCase() as any) || 'pending',
      createdAt: r.requestDate,
      patientId: r.patientId,
      patientName: r.patientName,
      allocatedResourceId: r.allocatedResourceDetails || r.allocatedResourceId
    }));
  });
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return hospitalDataService.getNotifications().map(n => ({
      id: n.id,
      hospitalId: 'hosp-chn-01',
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      read: n.read,
      targetRole: n.targetRole === 'all' ? undefined : n.targetRole
    }));
  });

  const [patients, setPatients] = useState<PatientDigitalTwin[]>(() => hospitalDataService.getPatients());
  const [doctorNurseTasks, setDoctorNurseTasks] = useState<DoctorNurseTaskItem[]>(() => hospitalDataService.getDoctorNurseTasks());
  const [clinicalAlerts, setClinicalAlerts] = useState<EarlyWarningAlertItem[]>(() => hospitalDataService.getClinicalAlerts());

  const selectedHospitalId = user?.hospitalId || tempOnboarding.hospitalId || 'Hos_Id-101';

  useEffect(() => {
    if (user?.role !== 'patient' && selectedHospitalId) {
      setActiveHospitalScopeId(selectedHospitalId);
      hospitalDataService.setHospitalContext(selectedHospitalId);
    }
  }, [selectedHospitalId, user?.role]);
  const socketRef = useRef<any>(null);

  // Real-Time Communication States
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected');
  const [connectionLatencyMs, setConnectionLatencyMs] = useState<number>(24);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => ClinicalAudioSynthesizer.getMuted());
  const [activeEmergencyModal, setActiveEmergencyModal] = useState<any | null>(null);

  const toggleAudioMuted = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      ClinicalAudioSynthesizer.setMuted(next);
      return next;
    });
  };

  const reconnectSocket = () => {
    if (socketRef.current) {
      setConnectionStatus('reconnecting');
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const closeEmergencyModal = () => {
    setActiveEmergencyModal(null);
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Sync session
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      setAuthToken(null);
    }
  }, [user]);

  // Real-time synchronization across dashboards & components via hospitalDataService events
  useEffect(() => {
    const syncFromService = () => {
      setBeds(hospitalDataService.getHospitalBeds());
      setPatients(hospitalDataService.getPatients());
      setDoctorNurseTasks(hospitalDataService.getDoctorNurseTasks());
      setClinicalAlerts(hospitalDataService.getClinicalAlerts());

      const activeScopeId = getActiveHospitalScopeId();
      const eqList = hospitalDataService.getEquipment().map(eq => ({
        id: eq.id,
        hospitalId: activeScopeId,
        name: eq.name,
        category: eq.type === 'Ventilators' ? ('Ventilator' as const) : eq.type === 'Infusion Pumps' ? ('Infusion Pump' as const) : ('Cardiac Monitor' as const),
        ward: eq.department,
        status: eq.operationalStatus === 'Operational' ? ('Available' as const) : eq.operationalStatus === 'In Use' ? ('In Use' as const) : ('Under Maintenance' as const),
        lastInspection: eq.lastInspection || eq.lastMaintenanceDate,
        serialNumber: eq.serialNumber || eq.equipmentId
      }));
      setEquipment(eqList);

      const reqs = hospitalDataService.getResourceRequests().map(r => ({
        id: r.id,
        hospitalId: activeScopeId,
        requesterId: r.requesterId || r.requestId,
        requesterName: r.requestedBy,
        requesterRole: ((r.requesterRole || 'doctor').toLowerCase() as UserRole) || 'doctor',
        department: r.department,
        resourceType: r.resourceType as any,
        quantity: r.quantity,
        urgency: r.priority === 'Urgent' ? ('Critical' as const) : ('Routine' as const),
        reason: r.clinicalJustification || r.reason,
        status: (r.status.toLowerCase() as any) || 'pending',
        createdAt: r.requestDate,
        patientId: r.patientId,
        patientName: r.patientName,
        allocatedResourceId: r.allocatedResourceDetails || r.allocatedResourceId
      }));
      setResourceRequests(reqs);

      const notifs: NotificationItem[] = hospitalDataService.getNotifications().map(n => ({
        id: n.id,
        hospitalId: activeScopeId,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: n.timestamp,
        read: n.read,
        targetRole: n.targetRole === 'all' ? undefined : n.targetRole
      }));
      setNotifications(notifs);
    };

    window.addEventListener(DATA_UPDATED_EVENT, syncFromService);
    window.addEventListener('storage', syncFromService);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, syncFromService);
      window.removeEventListener('storage', syncFromService);
    };
  }, []);

  // Initial fetch of districts & hospitals from backend
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const d = await api.getDistricts();
        if (d) setDistricts(d);

        const h = await api.getHospitals();
        if (h) setHospitals(h);
      } catch (err) {
        console.warn('Backend connecting...', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch live dashboard data from Backend whenever user logs in or switches hospital
  const fetchDashboardData = async () => {
    if (!selectedHospitalId) return;
    try {
      const data = await api.getHospitalDashboard(selectedHospitalId);
      if (data) {
        if (data.beds) setBeds(data.beds);
        if (data.equipment) setEquipment(data.equipment);
        if (data.requests) setResourceRequests(data.requests);
        if (data.appointments) setAppointments(data.appointments);
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHospitalId, user?.role, user?.isOnboarded]);

  // Real-Time Socket.IO Communication & Live Data Engine
  useEffect(() => {
    if (!selectedHospitalId) return;

    const token = localStorage.getItem('medisync_jwt_token');
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;
    setConnectionStatus('reconnecting');

    // Socket Connection Lifecycle Handlers
    socket.on('connect', () => {
      setConnectionStatus('connected');
      
      // Join isolated hospital channel
      socket.emit('join_hospital', selectedHospitalId);

      // Join role-specific channels
      if (user?.role) {
        socket.emit('join_role', { hospitalId: selectedHospitalId, role: user.role });
      }

      // Join doctor channel if clinical user
      if (user?.role === 'doctor') {
        socket.emit('join_doctor', user.id || 'doc-01');
      }

      // Join primary ward channel
      socket.emit('join_ward', 'ICU Block A');

      // Resilient Data Consistency: Catch-up sync from backend on reconnect
      fetchDashboardData();
    });

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      setConnectionStatus('connected');
      fetchDashboardData();
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    // Round-trip latency heartbeat (every 8 seconds)
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping_check', start, (res: any) => {
          const rtt = Math.max(8, Date.now() - (res?.clientTimestamp || start));
          setConnectionLatencyMs(rtt);
        });
      }
    }, 8000);

    // 1. Bed Availability & Status Updates
    socket.on('bed_updated', (payload: any) => {
      setBeds(prev => prev.map(b => b.id === payload.bedId ? { 
        ...b, 
        status: payload.newStatus || payload.status, 
        patientName: payload.patientName !== undefined ? payload.patientName : b.patientName,
        patientId: payload.patientId !== undefined ? payload.patientId : b.patientId,
        lastUpdated: payload.lastUpdated || 'Just now', 
        notes: payload.notes || b.notes 
      } : b));

      if (payload.newStatus === 'ready' || payload.status === 'ready') {
        ClinicalAudioSynthesizer.playInfoChime();
      }

      if (payload.notification) {
        setNotifications(prev => prev.some(n => n.id === payload.notification.id) ? prev : [payload.notification, ...prev]);
      }
    });

    socket.on('bed_status_changed', (payload: any) => {
      setBeds(prev => prev.map(b => b.id === payload.bedId ? {
        ...b,
        status: payload.newStatus,
        patientName: payload.patientName,
        patientId: payload.patientId,
        lastUpdated: payload.timestamp || 'Just now'
      } : b));
    });

    // 2. Resource Management Live Sync
    socket.on('request_created', (payload: any) => {
      if (payload.request) {
        setResourceRequests(prev => prev.some(r => r.id === payload.request.id) ? prev : [payload.request, ...prev]);
        if (payload.request.urgency === 'Stat' || payload.request.priority?.includes('Stat')) {
          ClinicalAudioSynthesizer.playCriticalAlert();
        } else {
          ClinicalAudioSynthesizer.playInfoChime();
        }
      }
      if (payload.notification) {
        setNotifications(prev => prev.some(n => n.id === payload.notification.id) ? prev : [payload.notification, ...prev]);
      }
    });

    socket.on('request_updated', (payload: any) => {
      setResourceRequests(prev => prev.map(r => r.id === payload.requestId ? { 
        ...r, 
        status: payload.status, 
        allocatedResourceId: payload.allocatedResourceId || r.allocatedResourceId,
        allocatedQuantity: payload.allocatedQuantity || (r as any).allocatedQuantity
      } : r));
      if (payload.notification) {
        setNotifications(prev => prev.some(n => n.id === payload.notification.id) ? prev : [payload.notification, ...prev]);
      }
      ClinicalAudioSynthesizer.playInfoChime();
    });

    // 3. Doctor-Nurse Coordination Live Updates
    socket.on('clinical_task_created', (task: any) => {
      setDoctorNurseTasks(prev => prev.some(t => t.id === task.id) ? prev : [task, ...prev]);
      if (task.priority?.includes('Stat')) {
        ClinicalAudioSynthesizer.playCriticalAlert();
      } else {
        ClinicalAudioSynthesizer.playInfoChime();
      }
      const notif: NotificationItem = {
        id: `notif-task-${Date.now()}`,
        hospitalId: selectedHospitalId,
        title: `Bedside Order: ${task.patientName}`,
        message: `${task.taskType} assigned by ${task.doctorName}: ${task.instruction}`,
        type: task.priority?.includes('Stat') ? 'critical' : 'warning',
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    });

    socket.on('clinical_task_updated', (task: any) => {
      setDoctorNurseTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
      if (task.status === 'Completed') {
        ClinicalAudioSynthesizer.playInfoChime();
      }
    });

    socket.on('patient_observation_recorded', (payload: any) => {
      if (payload.patientId && payload.vitals) {
        setPatients(prev => prev.map(p => p.patientId === payload.patientId ? {
          ...p,
          vitals: { ...p.vitals, ...payload.vitals }
        } : p));
      }
    });

    // 4. Emergency Alerts & Incidents
    socket.on('emergency_alert_created', (alert: any) => {
      setClinicalAlerts(prev => prev.some(a => a.id === alert.id) ? prev : [alert, ...prev]);
      ClinicalAudioSynthesizer.playCriticalAlert();
      setActiveEmergencyModal(alert);
      const notif: NotificationItem = {
        id: `notif-emerg-${Date.now()}`,
        hospitalId: selectedHospitalId,
        title: `EMERGENCY ALERT: ${alert.patientName || 'Critical Ward'}`,
        message: alert.message || alert.title || 'Acute clinical escalation broadcast',
        type: 'critical',
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    });

    socket.on('emergency_incident_created', (incident: any) => {
      ClinicalAudioSynthesizer.playCriticalAlert();
      setActiveEmergencyModal(incident);
      const notif: NotificationItem = {
        id: `notif-inc-${Date.now()}`,
        hospitalId: selectedHospitalId,
        title: `CODE EMERGENCY: ${incident.title}`,
        message: `${incident.type} in ${incident.location}: ${incident.description}`,
        type: 'critical',
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    });

    socket.on('emergency_incident_updated', (incident: any) => {
      if (incident.status === 'Resolved') {
        ClinicalAudioSynthesizer.playInfoChime();
      }
    });

    socket.on('shortage_alert_updated', (alert: any) => {
      if (alert.severity === 'Critical') {
        ClinicalAudioSynthesizer.playCriticalAlert();
      }
    });

    // 5. Workflow Automation Live Updates
    socket.on('workflow_execution_updated', (data: any) => {
      if (data.status === 'waiting_approval') {
        ClinicalAudioSynthesizer.playInfoChime();
        const notif: NotificationItem = {
          id: `notif-wf-${Date.now()}`,
          hospitalId: selectedHospitalId,
          title: `Workflow Approval Required`,
          message: `Rule "${data.ruleName}" triggered and requires administrative authorization.`,
          type: 'warning',
          timestamp: 'Just now',
          read: false
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

    socket.on('workflow_approval_requested', (data: any) => {
      ClinicalAudioSynthesizer.playCriticalAlert();
      const notif: NotificationItem = {
        id: `notif-wf-appr-${Date.now()}`,
        hospitalId: selectedHospitalId,
        title: `STAT Approval Requested: ${data.ruleName}`,
        message: `Clinical workflow requires ${data.approverRole} sign-off.`,
        type: 'critical',
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    });

    // 6. Generic Notification Broadcast
    socket.on('notification_created', (payload: any) => {
      const notif = payload.notification || payload;
      if (notif && notif.id) {
        setNotifications(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);
        if (notif.type === 'critical') {
          ClinicalAudioSynthesizer.playCriticalAlert();
        } else {
          ClinicalAudioSynthesizer.playInfoChime();
        }
      }
    });

    // 7. Cross-Dashboard Synchronization Listeners
    socket.on('transfer_created', () => {
      fetchDashboardData();
    });

    socket.on('transfer_updated', (data: any) => {
      fetchDashboardData();
      if (data?.notification) {
        setNotifications(prev => prev.some(n => n.id === data.notification.id) ? prev : [data.notification, ...prev]);
      }
    });

    socket.on('patient_discharged', () => {
      fetchDashboardData();
      ClinicalAudioSynthesizer.playInfoChime();
    });

    socket.on('emergency_resources_allocated', () => {
      fetchDashboardData();
      ClinicalAudioSynthesizer.playInfoChime();
    });

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedHospitalId, user?.role]);

  // Temporary Onboarding Handlers
  const resetTempOnboarding = () => {
    setTempOnboarding({
      ...initialEmptyOnboarding,
      name: user?.name || '',
      username: user?.username || '',
    });
  };

  const updateTempProfile = async (name: string, username: string) => {
    setTempOnboarding(prev => ({ ...prev, name, username }));
    if (user) {
      try {
        const res = await api.updateProfile(name, username);
        if (res && res.user) {
          setUser(prev => prev ? { ...prev, name, username } : null);
        }
      } catch (err) {
        console.warn('API updateProfile error:', err);
      }
    }
  };

  const updateTempDistrict = (districtId: string, districtName: string) => {
    setTempOnboarding(prev => ({ ...prev, districtId, districtName }));
  };

  const updateHospitalRegistrationDetails = (details: Partial<HospitalRegistrationDetails>) => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalName: details.hospitalName !== undefined ? details.hospitalName : prev.hospitalName,
      hospitalType: details.hospitalType !== undefined ? details.hospitalType : prev.hospitalType,
      registrationNumber: details.registrationNumber !== undefined ? details.registrationNumber : prev.registrationNumber,
      ownership: details.ownership !== undefined ? details.ownership : prev.ownership,
      category: details.category !== undefined ? details.category : prev.category,
      yearEstablished: details.yearEstablished !== undefined ? details.yearEstablished : prev.yearEstablished,
      hospitalLogo: details.hospitalLogo !== undefined ? details.hospitalLogo : prev.hospitalLogo,
      hospitalDescription: details.description !== undefined ? details.description : prev.hospitalDescription,
      website: details.website !== undefined ? details.website : prev.website,
    }));
  };

  const updateHospitalLocationContact = (details: Partial<HospitalLocationContactDetails>) => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalAddress: details.hospitalAddress !== undefined ? details.hospitalAddress : prev.hospitalAddress,
      areaLocality: details.areaLocality !== undefined ? details.areaLocality : prev.areaLocality,
      pincode: details.pincode !== undefined ? details.pincode : prev.pincode,
      hospitalPhone: details.hospitalPhone !== undefined ? details.hospitalPhone : prev.hospitalPhone,
      hospitalEmail: details.hospitalEmail !== undefined ? details.hospitalEmail : prev.hospitalEmail,
      emergencyContact: details.emergencyContact !== undefined ? details.emergencyContact : prev.emergencyContact,
    }));
  };

  const updateTempHospital = (hospitalId: string, hospitalName: string) => {
    if (hospitalId) {
      setActiveHospitalScopeId(hospitalId);
      hospitalDataService.setHospitalContext(hospitalId);
    }
    setTempOnboarding(prev => ({ ...prev, hospitalId, hospitalName }));
  };

  const updateTempRole = (role: UserRole) => {
    setTempOnboarding(prev => ({
      ...prev,
      role,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const clearTempRole = () => setTempOnboarding(prev => ({ ...prev, role: null }));
  const clearTempHospital = () => setTempOnboarding(prev => ({ ...prev, hospitalId: '', hospitalName: '', role: null }));
  const clearTempDistrict = () => setTempOnboarding(prev => ({ ...prev, districtId: '', districtName: '', hospitalId: '', hospitalName: '', role: null }));

  // Google Login backed by backend verification
  const loginWithGoogle = async (customEmail?: string, customName?: string, portal?: 'hospital' | 'patient'): Promise<UserProfile> => {
    const isPatient = portal === 'patient' || customEmail === 'karthik.subramanian@gmail.com';
    const email = customEmail || (isPatient ? 'karthik.subramanian@gmail.com' : 'dr.sundar@medisync.gov.in');
    const name = customName || (isPatient ? 'Karthik Subramanian' : 'Dr. Sundaramoorthy M.');

    try {
      const res = await api.loginWithGoogle(email, name, undefined, portal);
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        setUser(res.user);
        resetTempOnboarding();
        return res.user;
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Baseline fallback
    const fallbackUser: UserProfile = {
      id: 'usr_' + Date.now(),
      name,
      username: email.split('@')[0],
      email,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563a6&textColor=ffffff`,
      role: isPatient ? 'patient' : undefined,
      hospitalId: undefined,
      hospitalName: isPatient ? 'Rajiv Gandhi Government General Hospital (RGGGH)' : undefined,
      districtId: isPatient ? 'chennai' : undefined,
      districtName: isPatient ? 'Chennai' : undefined,
      roleVerificationStatus: isPatient ? 'approved' : 'none',
      isOnboarded: isPatient ? true : false
    };
    setUser(fallbackUser);
    return fallbackUser;
  };

  // Login an already-registered hospital by its Hos_Id-XXX / record
  const loginRegisteredHospital = async (record: any): Promise<void> => {
    const hId = record.hospitalId || record.id || 'Hos_Id-101';
    setActiveHospitalScopeId(hId);
    hospitalDataService.setHospitalContext(hId);
    const hName = record.hospitalName || record.name || 'Registered Hospital';
    const hEmail = record.hospitalEmail || 'admin@hospital.medisync.in';

    const loggedUser = await loginWithGoogle(hEmail, hName, 'hospital');

    const updatedUser: UserProfile = {
      ...loggedUser,
      name: hName,
      email: hEmail,
      hospitalId: hId,
      hospitalName: hName,
      districtId: record.districtId || 'chennai',
      districtName: record.districtName || 'Chennai',
      role: 'admin',
      roleVerificationStatus: 'approved',
      isOnboarded: true
    };
    setUser(updatedUser);

    setTempOnboarding({
      name: hName,
      username: hEmail.split('@')[0] || 'hospital_admin',
      districtId: record.districtId || 'chennai',
      districtName: record.districtName || 'Chennai',
      hospitalId: hId,
      hospitalName: hName,
      role: 'admin',
      hospitalType: record.hospitalType || 'General Hospital',
      registrationNumber: record.registrationNumber || hId,
      ownership: record.ownership || 'Government',
      category: record.category || 'General',
      yearEstablished: record.yearEstablished || '2026',
      hospitalDescription: record.description || '',
      website: record.website || '',
      hospitalAddress: record.hospitalAddress || '',
      areaLocality: record.areaLocality || '',
      pincode: record.pincode || '',
      hospitalPhone: record.hospitalPhone || '',
      hospitalEmail: hEmail,
      emergencyContact: record.emergencyContact || '044-25305112'
    });

    try {
      localStorage.setItem(hospitalScopedKey('medisync_hospital_info', hId), JSON.stringify({
        hospitalName: hName,
        hospitalId: hId,
        hospitalType: record.hospitalType || 'General Hospital',
        address: record.hospitalAddress ? `${record.hospitalAddress}, ${record.areaLocality || ''} ${record.districtName || ''}`.trim() : 'Tamil Nadu',
        contactNumber: record.emergencyContact || record.hospitalPhone || '044-25305112',
        officialEmail: hEmail,
        hospitalAdministrator: `${hName} Administration`
      }));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    resetTempOnboarding();
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Complete Role Verification via Backend API
  const completeVerificationApproval = async (targetRole?: UserRole) => {
    if (!user) return;
    const finalRole: UserRole = targetRole || tempOnboarding.role || user.role || 'admin';
    const finalDistrictId = tempOnboarding.districtId || user.districtId || 'chennai';
    const finalDistrictName = tempOnboarding.districtName || user.districtName || 'Chennai';
    const finalHospitalId = tempOnboarding.hospitalId || user.hospitalId || 'hosp-chn-01';
    const finalHospitalName = tempOnboarding.hospitalName || user.hospitalName || 'Rajiv Gandhi Government General Hospital';

    // Synchronously commit to local state & storage first to eliminate navigation race conditions
    const updatedUser: UserProfile = {
      ...user,
      districtId: finalDistrictId,
      districtName: finalDistrictName,
      hospitalId: finalHospitalId,
      hospitalName: finalHospitalName,
      role: finalRole,
      roleVerificationStatus: 'approved',
      isOnboarded: true
    };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));

    try {
      const res = await api.requestRole(finalDistrictId, finalHospitalId, finalRole);
      if (res && res.user) {
        if (res.token) setAuthToken(res.token);
        if (finalRole !== 'patient') {
          await api.verifyStaffDecision(res.user.id, 'approved');
        }
        setUser({
          ...res.user,
          districtName: finalDistrictName,
          hospitalName: finalHospitalName,
          role: finalRole,
          roleVerificationStatus: 'approved',
          isOnboarded: true
        });
      }
    } catch (err) {
      console.warn('API completeVerificationApproval error:', err);
    }
    fetchDashboardData();
  };

  const simulateAdminDecision = async (decision: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;
    if (decision === 'approved') {
      await completeVerificationApproval();
    } else {
      try {
        await api.verifyStaffDecision(user.id, 'rejected', reason);
      } catch {}
      const updatedUser: UserProfile = {
        ...user,
        roleVerificationStatus: 'rejected',
        rejectionReason: reason || 'Medical credentials could not be established',
        isOnboarded: false
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };

  const requestRoleApproval = async () => {
    if (!user) return;
    try {
      const res = await api.requestRole(
        tempOnboarding.districtId || 'chennai',
        tempOnboarding.hospitalId || 'hosp-chn-01',
        tempOnboarding.role || 'doctor'
      );
      if (res && res.user) {
        setUser(res.user);
      }
    } catch {}
  };

  // Live Resource Updates via hospitalDataService & REST API / Socket.IO
  const updateBedStatus = async (bedId: string, newStatus: BedStatus, notes?: string) => {
    let bedItemStatus: BedStatusType = 'Available';
    if (newStatus === 'occupied') bedItemStatus = 'Occupied';
    else if (newStatus === 'cleaning') bedItemStatus = 'Cleaning';
    else if (newStatus === 'equipment_check') bedItemStatus = 'Maintenance';
    else if (newStatus === 'nurse_confirmation') bedItemStatus = 'Reserved';
    else if (newStatus === 'discharged') bedItemStatus = 'Cleaning';
    else if (newStatus === 'ready') bedItemStatus = 'Available';

    hospitalDataService.updateBedStatus(bedId, bedItemStatus, notes);

    try {
      await api.updateBedStatus(bedId, newStatus, notes);
    } catch (err) {
      console.warn('API updateBedStatus error:', err);
    }
  };

  const createResourceRequest = async (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => {
    hospitalDataService.submitEmergencyRequisition({
      patientName: req.patientName || 'Emergency Patient',
      patientId: req.patientId || 'PT-PENDING',
      resourceType: req.resourceType,
      quantity: req.quantity,
      urgency: req.urgency === 'Critical' ? 'Urgent' : 'Normal',
      reason: req.reason,
      requesterName: req.requesterName,
      requesterRole: req.requesterRole,
      department: req.department
    });

    try {
      await api.createRequest({
        ...req,
        hospitalId: selectedHospitalId
      });
    } catch (err) {
      console.warn('API createResourceRequest error:', err);
    }
  };

  const updateRequestStatus = async (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => {
    let decision: 'Approved' | 'Allocated' | 'Rejected' = 'Approved';
    if (status === 'allocated' || status === 'fulfilled') decision = 'Allocated';
    else if (status === 'rejected') decision = 'Rejected';

    hospitalDataService.reviewEmergencyRequisition({
      requestId,
      decision,
      allocatedResourceId: allocatedId,
      reviewerName: user?.name || 'Hospital Administrator'
    });

    try {
      await api.updateRequestStatus(requestId, status, allocatedId);
    } catch (err) {
      console.warn('API updateRequestStatus error:', err);
    }
  };

  const assignPatientToBed = (bedId: string, patientName: string, patientId: string, doctor?: string, nurse?: string) => {
    return hospitalDataService.assignPatientToBed(bedId, patientName, patientId, doctor, nurse);
  };

  const createDoctorNurseTask = (params: Parameters<typeof hospitalDataService.createDoctorNurseTask>[0]) => {
    return hospitalDataService.createDoctorNurseTask(params);
  };

  const updateNurseTaskStatus = (params: Parameters<typeof hospitalDataService.updateNurseTaskStatus>[0]) => {
    return hospitalDataService.updateNurseTaskStatus(params);
  };

  const acknowledgeClinicalAlert = (alertId: string, doctorName?: string) => {
    return hospitalDataService.acknowledgeAlert(alertId, doctorName || user?.name || 'Dr. Sundaramoorthy M.');
  };

  const generateClinicalAlert = (alertData: Parameters<typeof hospitalDataService.generateClinicalAlert>[0]) => {
    return hospitalDataService.generateClinicalAlert(alertData);
  };

  const unreadNotificationsCount = user?.role ? hospitalDataService.getUnreadCount(user.role) : 0;

  const bookAppointment = async (department: string, doctorName: string, date: string, time: string) => {
    try {
      const res = await api.bookAppointment({
        hospitalId: selectedHospitalId,
        department,
        doctorName,
        date,
        time
      });
      if (res && res.appointment) {
        setAppointments(prev => [res.appointment, ...prev]);
      }
    } catch (err) {
      console.warn('API bookAppointment error:', err);
    }
  };

  const markNotificationAsRead = (id: string) => {
    hospitalDataService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const resetDemoToScenario = () => {
    fetchDashboardData();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tempOnboarding,
        resetTempOnboarding,
        updateTempProfile,
        updateHospitalRegistrationDetails,
        updateHospitalLocationContact,
        updateTempDistrict,
        updateTempHospital,
        updateTempRole,
        clearTempRole,
        clearTempHospital,
        clearTempDistrict,
        completeVerificationApproval,
        simulateAdminDecision,
        requestRoleApproval,
        selectedHospitalId,
        districts,
        hospitals,
        beds,
        equipment,
        resourceRequests,
        appointments,
        notifications,
        patients,
        doctorNurseTasks,
        clinicalAlerts,
        assignPatientToBed,
        createDoctorNurseTask,
        updateNurseTaskStatus,
        acknowledgeClinicalAlert,
        generateClinicalAlert,
        unreadNotificationsCount,
        loginWithGoogle,
        loginRegisteredHospital,
        logout,
        setUser,
        updateBedStatus,
        createResourceRequest,
        updateRequestStatus,
        bookAppointment,
        markNotificationAsRead,
        resetDemoToScenario,
        connectionStatus,
        connectionLatencyMs,
        isAudioMuted,
        toggleAudioMuted,
        reconnectSocket,
        activeEmergencyModal,
        closeEmergencyModal,
        acknowledgeNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
