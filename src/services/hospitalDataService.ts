// Centralized Hospital-Wide Data Service for MediSync AI
// Connects Hospital Admin, Doctor, Nurse, and Hospital dashboards with unified data,
// consistent IDs, persistent state, and cross-portal event broadcasting.

import { io, Socket } from 'socket.io-client';
import { api } from './api';
import {
  getActiveHospitalScopeId,
  setActiveHospitalScopeId,
  hospitalScopedKey
} from '../utils/hospitalSync';

import { 
  BedItem, 
  INITIAL_BEDS, 
  BedStatusType 
} from '../data/bedDemoData';
import { 
  ResourceRequestItem, 
  INITIAL_REQUESTS, 
  RequestStatus, 
  RequestPriority 
} from '../data/requestDemoData';
import { 
  INITIAL_EQUIPMENT, 
  EquipmentItem 
} from '../data/equipmentDemoData';
import { 
  INITIAL_WARDS, 
  WardItem 
} from '../data/wardDemoData';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin, 
  INITIAL_DOCTOR_NURSE_TASKS, 
  DoctorNurseTaskItem, 
  INITIAL_EARLY_WARNING_ALERTS, 
  EarlyWarningAlertItem 
} from '../data/doctorDemoData';
import { 
  HospitalBed, 
  Equipment, 
  ResourceRequest, 
  NotificationItem, 
  UserRole, 
  BedStatus 
} from '../types';
import {
  INITIAL_INTEROPERABILITY_CONNECTIONS,
  INITIAL_EXCHANGE_TRANSACTIONS,
  INITIAL_ABDM_CONSENTS,
  INITIAL_INBOUND_PATIENT_IMPORTS
} from '../data/interoperabilityDemoData';
import {
  InteroperabilityConnection,
  ExchangeTransaction,
  ABDMConsentArtefact,
  InboundPatientImport
} from '../types/interoperability';

export const BEDS_STORAGE_KEY = 'medisync_bed_registry_data';
export const WARDS_STORAGE_KEY = 'medisync_wards_registry_data';
export const REQUESTS_STORAGE_KEY = 'medisync_resource_requests_data';
export const EQUIPMENT_STORAGE_KEY = 'medisync_equipment_telemetry_data';
export const PATIENTS_STORAGE_KEY = 'medisync_patients_registry_data';
export const TASKS_STORAGE_KEY = 'medisync_doctor_nurse_tasks_data';
export const ALERTS_STORAGE_KEY = 'medisync_clinical_alerts_data';
export const NOTIFICATIONS_STORAGE_KEY = 'medisync_notifications_data';
export const APPOINTMENTS_STORAGE_KEY = 'medisync_appointments_registry_data';
export const LABS_STORAGE_KEY = 'medisync_lab_reports_data';
export const PRESCRIPTIONS_STORAGE_KEY = 'medisync_prescriptions_data';
export const ADMISSIONS_STORAGE_KEY = 'medisync_pending_admissions_data';
export const INTEROP_CONNS_STORAGE_KEY = 'medisync_interoperability_connections';
export const INTEROP_EXCHANGES_STORAGE_KEY = 'medisync_interoperability_exchanges';
export const ABDM_CONSENTS_STORAGE_KEY = 'medisync_abdm_consents';
export const INBOUND_IMPORTS_STORAGE_KEY = 'medisync_inbound_patient_imports';

export const DATA_UPDATED_EVENT = 'medisync_hospital_data_updated';

export interface SharedNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  targetRole: UserRole | 'all';
  category: 'emergency_request' | 'patient_admission' | 'bed_update' | 'clinical_alert' | 'lab_report' | 'doctor_nurse_task' | 'patient_transfer';
  timestamp: string;
  read: boolean;
  patientId?: string;
  bedId?: string;
  requestId?: string;
}

export class HospitalDataService {
  private static instance: HospitalDataService;
  private socket: Socket | null = null;

  private constructor() {
    this.ensureInitialized();
    this.initSocket();
    this.hydrateFromBackend();
  }

  public static getInstance(): HospitalDataService {
    if (!HospitalDataService.instance) {
      HospitalDataService.instance = new HospitalDataService();
    }
    return HospitalDataService.instance;
  }

  private broadcastUpdate(type: string, payload?: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT, { detail: { type, payload } }));
    }
  }

  private initSocket() {
    if (typeof window === 'undefined') return;
    try {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.socket?.emit('join_hospital', getActiveHospitalScopeId());
      });

      this.socket.on('bed_updated', (data) => {
        this.handleRealtimeBedUpdate(data);
      });

      this.socket.on('patient_admitted', () => {
        this.hydrateFromBackend();
      });

      this.socket.on('patient_updated', (data) => {
        this.handleRealtimePatientUpdate(data);
      });

      this.socket.on('request_created', (data) => {
        this.handleRealtimeRequestCreate(data.request || data);
      });

      this.socket.on('request_updated', (data) => {
        this.handleRealtimeRequestUpdate(data.request || data);
      });

      this.socket.on('clinical_task_created', (data) => {
        this.handleRealtimeTaskCreate(data);
      });

      this.socket.on('clinical_task_updated', (data) => {
        this.handleRealtimeTaskUpdate(data);
      });

      this.socket.on('clinical_alert_created', (data) => {
        this.handleRealtimeAlertCreate(data);
      });

      this.socket.on('clinical_alert_updated', (data) => {
        this.handleRealtimeAlertUpdate(data);
      });

      this.socket.on('notification_created', (data) => {
        if (data && data.notification) {
          this.addNotification(data.notification);
        }
      });

      this.socket.on('transfer_created', () => {
        this.hydrateFromBackend();
        this.broadcastUpdate('transfer_created');
      });

      this.socket.on('transfer_updated', () => {
        this.hydrateFromBackend();
        this.broadcastUpdate('transfer_updated');
      });

      this.socket.on('patient_discharged', () => {
        this.hydrateFromBackend();
        this.broadcastUpdate('patient_discharged');
      });

      this.socket.on('emergency_resources_allocated', () => {
        this.hydrateFromBackend();
        this.broadcastUpdate('emergency_resources_allocated');
      });
    } catch {}
  }

  public setHospitalContext(hospitalId: string) {
    if (!hospitalId) return;
    setActiveHospitalScopeId(hospitalId);
    try {
      this.socket?.emit('join_hospital', hospitalId);
    } catch {}
    this.ensureInitialized();
    this.broadcastUpdate('hospital_context_switched', { hospitalId });
  }

  public async hydrateFromBackend() {
    if (typeof window === 'undefined') return;
    try {
      const activeId = getActiveHospitalScopeId();
      if (activeId !== 'hosp-chn-01' && activeId !== 'Hos_Id-101') return;
      const data = await api.getHospitalDashboard(activeId);
      if (data) {
        if (data.beds && data.beds.length > 0) {
          localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(data.beds));
        }
        if (data.patients && data.patients.length > 0) {
          localStorage.setItem(hospitalScopedKey(PATIENTS_STORAGE_KEY), JSON.stringify(data.patients));
        }
        if (data.requests && data.requests.length > 0) {
          localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(data.requests));
        }
        if (data.equipment && data.equipment.length > 0) {
          localStorage.setItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY), JSON.stringify(data.equipment));
        }
        if (data.clinicalTasks && data.clinicalTasks.length > 0) {
          localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(data.clinicalTasks));
        }
        if (data.clinicalAlerts && data.clinicalAlerts.length > 0) {
          localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(data.clinicalAlerts));
        }
        if (data.appointments && data.appointments.length > 0) {
          localStorage.setItem(hospitalScopedKey(APPOINTMENTS_STORAGE_KEY), JSON.stringify(data.appointments));
        }
        if (data.labReports && data.labReports.length > 0) {
          localStorage.setItem(hospitalScopedKey(LABS_STORAGE_KEY), JSON.stringify(data.labReports));
        }
        if (data.prescriptions && data.prescriptions.length > 0) {
          localStorage.setItem(hospitalScopedKey(PRESCRIPTIONS_STORAGE_KEY), JSON.stringify(data.prescriptions));
        }
        if (data.pendingAdmissions && data.pendingAdmissions.length > 0) {
          localStorage.setItem(hospitalScopedKey(ADMISSIONS_STORAGE_KEY), JSON.stringify(data.pendingAdmissions));
        }
        this.broadcastUpdate('backend_hydrated');
      }
    } catch {}
  }

  private handleRealtimeBedUpdate(data: any) {
    const beds = this.getBeds();
    const bed = beds.find(b => b.id === data.bedId || b.bedId === data.bedNumber);
    if (bed) {
      bed.status = data.newStatus;
      if (data.patient !== undefined) bed.patient = data.patient;
      if (data.patientName !== undefined) bed.patient = data.patientName;
      bed.lastUpdated = data.lastUpdated || 'Just now';
      localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(beds));
      this.broadcastUpdate('bed_updated', bed);
    }
  }

  private handleRealtimePatientUpdate(data: any) {
    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.patientId === data.patient_id || p.patientId === data.patientId);
    if (idx >= 0) {
      patients[idx] = { ...patients[idx], ...data };
      localStorage.setItem(hospitalScopedKey(PATIENTS_STORAGE_KEY), JSON.stringify(patients));
      this.broadcastUpdate('patient_updated', patients[idx]);
    }
  }

  private handleRealtimeRequestCreate(req: any) {
    const requests = this.getResourceRequests();
    if (!requests.some(r => r.id === req.id || r.requestId === req.request_id)) {
      requests.unshift(req);
      localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(requests));
      this.broadcastUpdate('request_created', req);
    }
  }

  private handleRealtimeRequestUpdate(req: any) {
    const requests = this.getResourceRequests();
    const idx = requests.findIndex(r => r.id === req.id || r.requestId === req.request_id);
    if (idx >= 0) {
      requests[idx] = { ...requests[idx], ...req };
      localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(requests));
      this.broadcastUpdate('request_updated', requests[idx]);
    }
  }

  private handleRealtimeTaskCreate(task: any) {
    const tasks = this.getDoctorNurseTasks();
    if (!tasks.some(t => t.id === task.id)) {
      tasks.unshift(task);
      localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(tasks));
      this.broadcastUpdate('doctor_nurse_task_created', task);
    }
  }

  private handleRealtimeTaskUpdate(task: any) {
    const tasks = this.getDoctorNurseTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...task };
      localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(tasks));
      this.broadcastUpdate('doctor_nurse_task_updated', tasks[idx]);
    }
  }

  private handleRealtimeAlertCreate(alert: any) {
    const alerts = this.getClinicalAlerts();
    if (!alerts.some(a => a.id === alert.id)) {
      alerts.unshift(alert);
      localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(alerts));
      this.broadcastUpdate('clinical_alert_created', alert);
    }
  }

  private handleRealtimeAlertUpdate(alert: any) {
    const alerts = this.getClinicalAlerts();
    const idx = alerts.findIndex(a => a.id === alert.id);
    if (idx >= 0) {
      alerts[idx] = { ...alerts[idx], ...alert };
      localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(alerts));
      this.broadcastUpdate('clinical_alert_updated', alerts[idx]);
    }
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(INITIAL_BEDS));
    }
    if (!localStorage.getItem(hospitalScopedKey(WARDS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(WARDS_STORAGE_KEY), JSON.stringify(INITIAL_WARDS));
    }
    if (!localStorage.getItem(hospitalScopedKey(REQUESTS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(INITIAL_REQUESTS));
    }
    if (!localStorage.getItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY), JSON.stringify(INITIAL_EQUIPMENT));
    }
    if (!localStorage.getItem(hospitalScopedKey(PATIENTS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(PATIENTS_STORAGE_KEY), JSON.stringify(INITIAL_CLINICAL_PATIENTS));
    }
    if (!localStorage.getItem(hospitalScopedKey(TASKS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(INITIAL_DOCTOR_NURSE_TASKS));
    }
    if (!localStorage.getItem(hospitalScopedKey(ALERTS_STORAGE_KEY))) {
      localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(INITIAL_EARLY_WARNING_ALERTS));
    }
    if (!localStorage.getItem(hospitalScopedKey(NOTIFICATIONS_STORAGE_KEY))) {
      const defaultNotifications: SharedNotification[] = [
        {
          id: 'notif-01',
          title: 'ICU Telemetry Active',
          message: 'Real-time telemetry and Bed Master Status synchronized across all hospital wards.',
          type: 'info',
          targetRole: 'all',
          category: 'bed_update',
          timestamp: '10:00 AM',
          read: false
        },
        {
          id: 'notif-02',
          title: 'Critical Decompensation Alert',
          message: 'Ramesh Balan (PT-8941) flagged in ICU Block A: MEWS 6/14 (HR 118 bpm, SpO2 89%).',
          type: 'critical',
          targetRole: 'doctor',
          category: 'clinical_alert',
          timestamp: '10:14 AM',
          read: false,
          patientId: 'PT-8941'
        }
      ];
      localStorage.setItem(hospitalScopedKey(NOTIFICATIONS_STORAGE_KEY), JSON.stringify(defaultNotifications));
    }
  }

  // 1. PATIENT REGISTRY INTEGRATION
  public getPatients(): PatientDigitalTwin[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(PATIENTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_CLINICAL_PATIENTS;
  }

  public getPatientById(patientId: string): PatientDigitalTwin | undefined {
    return this.getPatients().find(p => p.patientId === patientId || p.id === patientId);
  }

  public admitOrUpdatePatient(patientData: Partial<PatientDigitalTwin> & { patientId: string; name: string }): PatientDigitalTwin {
    const patients = this.getPatients();
    const existingIndex = patients.findIndex(p => p.patientId === patientData.patientId);

    let updatedPatient: PatientDigitalTwin;

    if (existingIndex >= 0) {
      updatedPatient = {
        ...patients[existingIndex],
        ...patientData
      };
      patients[existingIndex] = updatedPatient;
    } else {
      // New admission
      updatedPatient = {
        id: 'pt-' + Date.now(),
        patientId: patientData.patientId,
        name: patientData.name,
        age: patientData.age || 50,
        gender: patientData.gender || 'Male',
        bloodGroup: patientData.bloodGroup || 'O+',
        admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0],
        department: patientData.department || 'Emergency & Critical Care',
        ward: patientData.ward || 'ICU Block A',
        bedNumber: patientData.bedNumber || 'A-101',
        attendingPhysician: patientData.attendingPhysician || 'Dr. Sundaramoorthy M.',
        primaryDiagnosis: patientData.primaryDiagnosis || 'Acute Clinical Emergency',
        icd10: patientData.icd10 || 'I21.0',
        secondaryDiagnoses: patientData.secondaryDiagnoses || ['Hypertension'],
        riskLevel: patientData.riskLevel || 'High Risk',
        mewsScore: patientData.mewsScore !== undefined ? patientData.mewsScore : 5,
        resuscitationStatus: patientData.resuscitationStatus || 'Full Code',
        allergies: patientData.allergies || [],
        vitals: patientData.vitals || [
          {
            timestamp: 'Admission',
            heartRate: 110,
            systolicBP: 95,
            diastolicBP: 60,
            spO2: 90,
            respiratoryRate: 24,
            temperature: 37.2,
            gcsScore: 14,
            isAbnormal: true
          }
        ],
        currentVitals: patientData.currentVitals || {
          timestamp: 'Just now',
          heartRate: 110,
          systolicBP: 95,
          diastolicBP: 60,
          spO2: 90,
          respiratoryRate: 24,
          temperature: 37.2,
          gcsScore: 14,
          isAbnormal: true
        },
        medications: patientData.medications || [],
        labs: patientData.labs || [],
        timeline: [
          {
            id: 'ev-' + Date.now(),
            timestamp: 'Just now',
            date: new Date().toISOString().split('T')[0],
            category: 'Admission',
            title: 'Admitted into ' + (patientData.ward || 'Hospital Ward'),
            description: `Emergency intake admitted by ${patientData.attendingPhysician || 'Attending Physician'}. Bed ${patientData.bedNumber || 'TBD'} assigned.`,
            actor: patientData.attendingPhysician || 'Attending Physician',
            severity: 'normal'
          }
        ],
        medicalHistory: patientData.medicalHistory || ['Cardiovascular history'],
        surgicalHistory: patientData.surgicalHistory || ['None'],
        clinicalObservations: patientData.clinicalObservations || 'Under close observation.',
        doctorNotes: patientData.doctorNotes || 'Emergency clinical intake confirmed.',
        dischargeReady: false,
        assignedNurse: patientData.assignedNurse || 'Nurse Duty'
      };
      patients.unshift(updatedPatient);
    }

    localStorage.setItem(hospitalScopedKey(PATIENTS_STORAGE_KEY), JSON.stringify(patients));

    this.addNotification({
      title: 'Patient Intake Admitted',
      message: `${updatedPatient.name} (${updatedPatient.patientId}) assigned to ${updatedPatient.ward} Bed ${updatedPatient.bedNumber}.`,
      type: 'info',
      targetRole: 'all',
      category: 'patient_admission',
      patientId: updatedPatient.patientId
    });

    this.broadcastUpdate('patient_updated', updatedPatient);
    api.updatePatient(updatedPatient.patientId, updatedPatient).catch(() => {});
    return updatedPatient;
  }

  // 2. BED & WARD INTEGRATION WITH PREVENTING DOUBLE ASSIGNMENT
  public getBeds(): BedItem[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_BEDS;
  }

  public getHospitalBeds(): HospitalBed[] {
    const rawBeds = this.getBeds();
    return rawBeds.map(b => {
      let status: BedStatus = 'ready';
      if (b.status === 'Occupied') status = 'occupied';
      else if (b.status === 'Cleaning') status = 'cleaning';
      else if (b.status === 'Maintenance') status = 'equipment_check';
      else if (b.status === 'Reserved') status = 'nurse_confirmation';
      else if (b.status === 'Available') status = 'ready';

      let type: HospitalBed['type'] = 'General';
      if (b.bedType === 'ICU') type = 'ICU';
      else if (b.bedType === 'Emergency') type = 'Emergency';
      else if (b.bedType === 'Isolation') type = 'General';
      else if (b.bedType === 'General') type = 'General';

      return {
        id: b.id,
        hospitalId: getActiveHospitalScopeId(),
        ward: b.ward,
        bedNumber: b.bedId,
        type,
        status,
        patientName: b.patient || undefined,
        patientId: b.patient ? 'PT-' + b.id.replace(/\D/g, '').padEnd(4, '0') : undefined,
        assignedNurse: b.assignedNurse || 'Nurse Duty',
        lastUpdated: b.lastUpdated || 'Just now',
        notes: (b.equipment ? `Equipment: ${b.equipment}` : '')
      };
    });
  }

  public assignPatientToBed(
    bedIdentifier: string, 
    patientName: string, 
    patientId: string, 
    assignedDoctor?: string, 
    assignedNurse?: string
  ): { success: boolean; message: string; bed?: BedItem } {
    const beds = this.getBeds();
    const bed = beds.find(b => b.id === bedIdentifier || b.bedId === bedIdentifier);

    if (!bed) {
      return { success: false, message: `Bed ${bedIdentifier} not found in hospital inventory.` };
    }

    // STRICT CHECK: Do not allow two patients to be assigned to the same bed
    if (bed.status === 'Occupied' && bed.patient && bed.patient !== patientName) {
      return { 
        success: false, 
        message: `Conflict: Bed ${bed.bedId} is already occupied by patient ${bed.patient}. Please select an empty or ready bed.` 
      };
    }

    // Release any previously held bed by this patient to maintain 1:1 invariant
    beds.forEach(b => {
      if (b.id !== bed.id && b.patient === patientName) {
        b.patient = '';
        b.status = 'Cleaning';
        b.lastUpdated = 'Just now';
      }
    });

    // Update target bed
    bed.status = 'Occupied';
    bed.patient = patientName;
    if (assignedDoctor) bed.assignedDoctor = assignedDoctor;
    if (assignedNurse) bed.assignedNurse = assignedNurse;
    bed.lastUpdated = 'Just now';

    // Log history
    if (!bed.statusHistory) bed.statusHistory = [];
    bed.statusHistory.unshift({
      id: 'h-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fromStatus: 'Available',
      toStatus: 'Occupied',
      updatedBy: assignedDoctor || 'Hospital Command Center',
      notes: `Bed assigned to ${patientName} (${patientId})`
    });

    localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(beds));

    // Update patient record
    this.admitOrUpdatePatient({
      patientId,
      name: patientName,
      bedNumber: bed.bedId,
      ward: bed.ward,
      attendingPhysician: assignedDoctor || 'Dr. Sundaramoorthy M.',
      assignedNurse: assignedNurse || 'Nurse Duty'
    });

    // Notify Nurse and Doctor
    this.addNotification({
      title: 'Bed Allocation Updated',
      message: `Bed ${bed.bedId} (${bed.ward}) is now OCCUPIED by ${patientName}.`,
      type: 'success',
      targetRole: 'all',
      category: 'bed_update',
      bedId: bed.bedId,
      patientId
    });

    this.broadcastUpdate('bed_updated', bed);

    api.admitPatient({
      patientId,
      bedId: bed.id,
      ward: bed.ward,
      doctorName: assignedDoctor
    }).catch(() => {});

    return { success: true, message: `Patient ${patientName} successfully docked in Bed ${bed.bedId}.`, bed };
  }

  public updateBedStatus(bedIdentifier: string, newStatus: BedStatusType, notes?: string): BedItem | null {
    const beds = this.getBeds();
    const bed = beds.find(b => b.id === bedIdentifier || b.bedId === bedIdentifier);
    if (!bed) return null;

    const oldStatus = bed.status;
    bed.status = newStatus;
    bed.lastUpdated = 'Just now';
    if (newStatus === 'Available' || (newStatus as any) === 'Ready' || newStatus === 'Cleaning') {
      if (oldStatus === 'Occupied') {
        bed.patient = '';
      }
    }

    if (!bed.statusHistory) bed.statusHistory = [];
    bed.statusHistory.unshift({
      id: 'h-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fromStatus: oldStatus,
      toStatus: newStatus,
      updatedBy: 'Ward Nursing Staff',
      notes: notes || `Bed status progressed from ${oldStatus} to ${newStatus}`
    });

    localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(beds));

    this.addNotification({
      title: 'Bed Status Transition',
      message: `Bed ${bed.bedId} (${bed.ward}) transitioned to ${newStatus.toUpperCase()}.`,
      type: newStatus === 'Available' || (newStatus as any) === 'Ready' ? 'success' : 'info',
      targetRole: 'all',
      category: 'bed_update',
      bedId: bed.bedId
    });

    this.broadcastUpdate('bed_updated', bed);
    api.updateBedStatus(bed.id, newStatus, notes).catch(() => {});
    return bed;
  }

  // 3. EMERGENCY RESOURCE COORDINATION WORKFLOW
  public getResourceRequests(): ResourceRequestItem[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(REQUESTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_REQUESTS;
  }

  public submitEmergencyRequisition(params: {
    patientName: string;
    patientId: string;
    resourceType: string;
    quantity: number;
    urgency: RequestPriority;
    reason: string;
    requesterName: string;
    requesterRole?: string;
    department?: string;
    ward?: string;
  }): ResourceRequestItem {
    const requests = this.getResourceRequests();
    const reqIdNumber = requests.length + 1;
    const newReqId = 'REQ-2026-' + reqIdNumber.toString().padStart(3, '0');

    const newRequest: ResourceRequestItem = {
      id: 'req-' + Date.now(),
      requestId: newReqId,
      requestedBy: params.requesterName,
      requesterRole: params.requesterRole || 'Doctor',
      requesterId: 'doc-sundar',
      department: params.department || 'Critical Care & Cardiology',
      ward: params.ward || 'ICU Block A',
      resourceType: (params.resourceType.includes('Bed') ? 'ICU Resources' : 'Medical Equipment') as any,
      resourceName: params.resourceType,
      quantity: params.quantity || 1,
      unit: 'Units',
      doctorEmail: 'dr.sundar@hospital.gov.in',
      doctorPhone: '+91 94440 12345',
      reason: params.reason,
      priority: params.urgency || 'Urgent',
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      patientName: params.patientName,
      patientId: params.patientId,
      clinicalJustification: params.reason,
      timeline: [
        {
          id: 't-' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Submitted',
          actor: params.requesterName,
          notes: `Requisition submitted: ${params.quantity}x ${params.resourceType} for ${params.patientName}`,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          user: params.requesterName,
          note: `Requisition submitted: ${params.quantity}x ${params.resourceType} for ${params.patientName}`
        }
      ]
    };

    requests.unshift(newRequest);
    localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(requests));

    // Notify Hospital Admin
    this.addNotification({
      title: '🚨 Emergency Requisition Submitted',
      message: `${params.requesterName} requested ${params.quantity}x ${params.resourceType} for ${params.patientName} (${params.urgency} Priority).`,
      type: params.urgency === 'Urgent' ? 'critical' : 'warning',
      targetRole: 'admin',
      category: 'emergency_request',
      requestId: newRequest.requestId,
      patientId: params.patientId
    });

    this.broadcastUpdate('request_created', newRequest);

    api.createRequest({
      resourceType: newRequest.resourceType,
      resourceName: newRequest.resourceName,
      quantity: newRequest.quantity,
      urgency: newRequest.priority === 'Urgent' ? 'Critical' : 'Routine',
      priority: newRequest.priority,
      reason: newRequest.reason,
      clinicalJustification: newRequest.clinicalJustification,
      patientName: newRequest.patientName,
      patientId: newRequest.patientId,
      department: newRequest.department,
      ward: newRequest.ward
    }).catch(() => {});

    return newRequest;
  }

  public reviewEmergencyRequisition(params: {
    requestId: string;
    decision: 'Approved' | 'Allocated' | 'Rejected';
    allocatedResourceId?: string;
    reviewerName: string;
    rejectionReason?: string;
  }): { success: boolean; message: string; request?: ResourceRequestItem } {
    const requests = this.getResourceRequests();
    const req = requests.find(r => r.id === params.requestId || r.requestId === params.requestId);
    if (!req) {
      return { success: false, message: `Requisition ${params.requestId} not found.` };
    }

    req.status = params.decision;
    if (params.allocatedResourceId) {
      req.allocatedResourceDetails = params.allocatedResourceId;
      req.allocatedResourceName = params.allocatedResourceId;
    }

    req.timeline.unshift({
      id: 't-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: params.decision,
      actor: params.reviewerName,
      notes: params.decision === 'Rejected' 
        ? `Request rejected by Hospital Admin: ${params.rejectionReason || 'Resource unavailable'}`
        : `Approved & Allocated: ${params.allocatedResourceId || 'Inventory units assigned'}`,
      date: new Date().toISOString().split('T')[0],
      status: params.decision,
      user: params.reviewerName,
      note: params.decision === 'Rejected' 
        ? `Request rejected by Hospital Admin: ${params.rejectionReason || 'Resource unavailable'}`
        : `Approved & Allocated: ${params.allocatedResourceId || 'Inventory units assigned'}`
    });

    localStorage.setItem(hospitalScopedKey(REQUESTS_STORAGE_KEY), JSON.stringify(requests));

    // Handle physical allocation if approved
    if (params.decision === 'Approved' || params.decision === 'Allocated') {
      // If Bed allocation
      if ((req.resourceName || '').includes('Bed') || (req.resourceType as string).includes('Bed')) {
        // Find matching available bed or use allocated ID
        const beds = this.getBeds();
        const candidateBed = params.allocatedResourceId 
          ? beds.find(b => b.bedId === params.allocatedResourceId || b.id === params.allocatedResourceId)
          : beds.find(b => b.status === 'Available' && ((req.resourceName || '').includes('ICU') ? b.bedType === 'ICU' : true));

        if (candidateBed && req.patientName && req.patientId) {
          this.assignPatientToBed(candidateBed.id, req.patientName, req.patientId, req.requestedBy, 'Nurse Revathi S.');
          req.allocatedResourceDetails = `${candidateBed.bedId} (${candidateBed.ward})`;
        }
      }

      // If Ventilator allocation
      if (req.resourceType.toLowerCase().includes('ventilator')) {
        this.updateEquipmentStatus(params.allocatedResourceId || 'eqp-01', 'In Use', req.ward);
      }

      // Notify Doctor
      this.addNotification({
        title: '✅ Emergency Request Approved',
        message: `Hospital Admin (${params.reviewerName}) approved ${req.resourceType} for ${req.patientName || 'patient'}. Resource: ${req.allocatedResourceDetails || 'Allocated'}.`,
        type: 'success',
        targetRole: 'doctor',
        category: 'emergency_request',
        requestId: req.requestId,
        patientId: req.patientId
      });

      // Create Nurse intake task
      this.createDoctorNurseTask({
        patientName: req.patientName || 'Emergency Patient',
        patientId: req.patientId || 'PT-PENDING',
        ward: req.ward || 'ICU Block A',
        bed: req.allocatedResourceDetails || 'Bed Dock',
        taskType: 'Assessment',
        instruction: `STAT: Perform intake assessment for emergency patient ${req.patientName}. Connect to bedside telemetry and verify oxygenation.`,
        priority: 'Stat (Immediate)',
        doctorName: req.requestedBy,
        assignedNurse: 'Nurse Revathi S.'
      });
    } else {
      // Rejection notification
      this.addNotification({
        title: '❌ Emergency Request Rejected',
        message: `Requisition for ${req.patientName} was rejected: ${params.rejectionReason || 'Resource constraints'}.`,
        type: 'critical',
        targetRole: 'doctor',
        category: 'emergency_request',
        requestId: req.requestId,
        patientId: req.patientId
      });
    }

    this.broadcastUpdate('request_updated', req);

    api.updateRequestStatus(
      params.requestId,
      params.decision,
      params.allocatedResourceId,
      params.allocatedResourceId,
      params.rejectionReason
    ).catch(() => {});

    return { 
      success: true, 
      message: `Requisition ${req.requestId} marked as ${params.decision}. Hospital state synchronized.`, 
      request: req 
    };
  }

  // 4. DOCTOR–NURSE COMMUNICATION & CLOSED-LOOP TASKS
  public getDoctorNurseTasks(): DoctorNurseTaskItem[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(TASKS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_DOCTOR_NURSE_TASKS;
  }

  public createDoctorNurseTask(params: {
    patientName: string;
    patientId: string;
    ward: string;
    bed: string;
    taskType: 'Vital Check' | 'Medication Administration' | 'Lab Collection' | 'Assessment' | 'Wound Dressing';
    instruction: string;
    priority: 'Stat (Immediate)' | 'Urgent' | 'Routine';
    doctorName: string;
    assignedNurse?: string;
  }): DoctorNurseTaskItem {
    const tasks = this.getDoctorNurseTasks();
    const newTask: DoctorNurseTaskItem = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      patientName: params.patientName,
      patientId: params.patientId,
      ward: params.ward,
      bed: params.bed,
      taskType: params.taskType,
      instruction: params.instruction,
      doctorName: params.doctorName,
      assignedNurse: params.assignedNurse || 'Nurse Revathi S.',
      timestamp: 'Just now',
      priority: params.priority,
      status: 'Pending'
    };

    tasks.unshift(newTask);
    localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(tasks));

    // Notify Nurse
    this.addNotification({
      title: `🔔 ${params.priority} Order from ${params.doctorName}`,
      message: `New task for ${params.patientName} (Bed ${params.bed}): ${params.instruction}`,
      type: params.priority === 'Stat (Immediate)' ? 'critical' : 'warning',
      targetRole: 'nurse',
      category: 'doctor_nurse_task',
      patientId: params.patientId
    });

    this.broadcastUpdate('task_created', newTask);

    api.createClinicalTask({
      patientId: newTask.patientId,
      patientName: newTask.patientName,
      ward: newTask.ward,
      bed: newTask.bed,
      taskType: newTask.taskType,
      instruction: newTask.instruction,
      priority: newTask.priority,
      assignedNurse: newTask.assignedNurse
    }).catch(() => {});

    return newTask;
  }

  public updateNurseTaskStatus(params: {
    taskId: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    nurseObservation?: string;
    nurseName?: string;
    recordedVitals?: {
      heartRate: number;
      systolicBP: number;
      spO2: number;
      respiratoryRate: number;
      temperature: number;
    };
  }): DoctorNurseTaskItem | null {
    const tasks = this.getDoctorNurseTasks();
    const task = tasks.find(t => t.id === params.taskId);
    if (!task) return null;

    task.status = params.status;
    if (params.nurseObservation) {
      task.nurseObservation = params.nurseObservation;
    }
    if (params.status === 'Completed') {
      task.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    localStorage.setItem(hospitalScopedKey(TASKS_STORAGE_KEY), JSON.stringify(tasks));

    // If vitals were recorded and indicate decompensation, generate Clinical Alert
    if (params.recordedVitals) {
      const v = params.recordedVitals;
      const isCriticalSpO2 = v.spO2 < 90;
      const isCriticalHR = v.heartRate > 120 || v.heartRate < 50;
      const isCriticalBP = v.systolicBP < 90 || v.systolicBP > 180;

      if (isCriticalSpO2 || isCriticalHR || isCriticalBP) {
        let trigger = '';
        if (isCriticalSpO2) trigger = `SpO2 ${v.spO2}% (Critical Desaturation)`;
        else if (isCriticalHR) trigger = `Heart Rate ${v.heartRate} bpm (Tachycardia)`;
        else trigger = `Blood Pressure ${v.systolicBP} mmHg (Hypotension)`;

        this.generateClinicalAlert({
          patientId: task.patientId,
          patientName: task.patientName,
          ward: task.ward,
          bed: task.bed,
          triggerParam: isCriticalSpO2 ? 'Oxygen Saturation (SpO2)' : isCriticalHR ? 'Heart Rate' : 'Blood Pressure',
          triggerValue: isCriticalSpO2 ? `${v.spO2}%` : isCriticalHR ? `${v.heartRate} bpm` : `${v.systolicBP} mmHg`,
          threshold: isCriticalSpO2 ? '< 92%' : isCriticalHR ? '> 110 bpm' : '< 90 mmHg',
          mewsScore: isCriticalSpO2 ? 8 : 6,
          severity: 'Critical',
          reason: `Nurse reported acute vital decompensation during execution of order "${task.instruction}". ${params.nurseObservation || ''}`,
          suggestedAction: 'Immediate attending physician bedside evaluation and arterial blood gas re-evaluation.'
        });
      }
    }

    // Notify Doctor that order was updated
    this.addNotification({
      title: `Task ${params.status}: ${task.patientName}`,
      message: `${params.nurseName || 'Bedside nurse'} marked order as ${params.status}. Observation: ${params.nurseObservation || 'No abnormalities.'}`,
      type: params.status === 'Completed' ? 'success' : 'info',
      targetRole: 'doctor',
      category: 'doctor_nurse_task',
      patientId: task.patientId
    });

    this.broadcastUpdate('task_updated', task);

    api.updateClinicalTaskStatus(params.taskId, {
      status: params.status,
      executionNotes: params.nurseObservation,
      vitalsRecorded: params.recordedVitals ? {
        hr: params.recordedVitals.heartRate,
        sbp: params.recordedVitals.systolicBP,
        spo2: params.recordedVitals.spO2,
        rr: params.recordedVitals.respiratoryRate,
        temp: params.recordedVitals.temperature
      } : undefined
    }).catch(() => {});

    return task;
  }

  // 5. CLINICAL ALERT INTEGRATION
  public getClinicalAlerts(): EarlyWarningAlertItem[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(ALERTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_EARLY_WARNING_ALERTS;
  }

  public generateClinicalAlert(alertData: Omit<EarlyWarningAlertItem, 'id' | 'timestamp' | 'status'>): EarlyWarningAlertItem {
    const alerts = this.getClinicalAlerts();
    const newAlert: EarlyWarningAlertItem = {
      ...alertData,
      id: 'EWS-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Active'
    };

    alerts.unshift(newAlert);
    localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(alerts));

    // Update patient MEWS and risk level in registry
    const patients = this.getPatients();
    const p = patients.find(pt => pt.patientId === alertData.patientId);
    if (p) {
      p.mewsScore = alertData.mewsScore;
      p.riskLevel = alertData.severity;
      p.timeline.unshift({
        id: 'ev-' + Date.now(),
        timestamp: 'Just now',
        date: new Date().toISOString().split('T')[0],
        category: 'Vitals Alert',
        title: `MEWS Alert Triggered: ${alertData.triggerParam}`,
        description: alertData.reason,
        actor: 'Bedside Telemetry Radar',
        severity: 'critical'
      });
      localStorage.setItem(hospitalScopedKey(PATIENTS_STORAGE_KEY), JSON.stringify(patients));
    }

    this.addNotification({
      title: `🚨 CRITICAL CLINICAL ALERT: ${alertData.patientName}`,
      message: `${alertData.triggerParam} (${alertData.triggerValue}) in ${alertData.ward} Bed ${alertData.bed}. MEWS: ${alertData.mewsScore}/14.`,
      type: 'critical',
      targetRole: 'doctor',
      category: 'clinical_alert',
      patientId: alertData.patientId
    });

    this.broadcastUpdate('alert_generated', newAlert);
    return newAlert;
  }

  public acknowledgeAlert(alertId: string, doctorName: string): boolean {
    const alerts = this.getClinicalAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'Acknowledged';
    alert.reason += ` [Acknowledged by ${doctorName}]`;
    localStorage.setItem(hospitalScopedKey(ALERTS_STORAGE_KEY), JSON.stringify(alerts));

    this.broadcastUpdate('alert_acknowledged', alert);
    api.acknowledgeClinicalAlert(alertId, { notes: `Acknowledged by ${doctorName}`, status: 'Acknowledged' }).catch(() => {});
    return true;
  }

  // 6. SHARED NOTIFICATION SYSTEM
  public getNotifications(): SharedNotification[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(NOTIFICATIONS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public addNotification(notification: Omit<SharedNotification, 'id' | 'timestamp' | 'read'>): SharedNotification {
    const notifications = this.getNotifications();
    const newNotif: SharedNotification = {
      ...notification,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    notifications.unshift(newNotif);
    localStorage.setItem(hospitalScopedKey(NOTIFICATIONS_STORAGE_KEY), JSON.stringify(notifications.slice(0, 50)));
    this.broadcastUpdate('notification_added', newNotif);
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      localStorage.setItem(hospitalScopedKey(NOTIFICATIONS_STORAGE_KEY), JSON.stringify(notifications));
      this.broadcastUpdate('notification_read', id);
    }
  }

  public getUnreadCount(role: UserRole): number {
    const notifications = this.getNotifications();
    return notifications.filter(n => !n.read && (n.targetRole === 'all' || n.targetRole === role)).length;
  }

  // 7. EQUIPMENT INTEGRATION
  public getEquipment(): EquipmentItem[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_EQUIPMENT;
  }

  public updateEquipmentStatus(eqId: string, newStatus: EquipmentItem['operationalStatus'], department?: string): EquipmentItem | null {
    const equipmentList = this.getEquipment();
    const eq = equipmentList.find(e => e.id === eqId || e.equipmentId === eqId);
    if (!eq) return null;

    eq.operationalStatus = newStatus;
    if (department) eq.department = department;
    eq.lastUpdated = 'Just now';

    localStorage.setItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY), JSON.stringify(equipmentList));
    this.broadcastUpdate('equipment_updated', eq);
    return eq;
  }

  // 8. APPOINTMENTS INTEGRATION
  public getAppointments(): any[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(APPOINTMENTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return [
      { id: 'APT-101', patientName: 'Karthik Subramanian', time: '09:30 AM', date: '2026-11-28', department: 'Cardiology & Critical Care', doctorName: 'Dr. Sundaramoorthy M.', status: 'Completed', tokenNumber: 1 },
      { id: 'APT-102', patientName: 'Anand Kumar', time: '10:15 AM', date: '2026-11-28', department: 'Cardiology & Critical Care', doctorName: 'Dr. Sundaramoorthy M.', status: 'In Consultation', tokenNumber: 2 },
      { id: 'APT-103', patientName: 'Lakshmi Narayanan', time: '11:00 AM', date: '2026-11-28', department: 'Cardiology & Critical Care', doctorName: 'Dr. Sundaramoorthy M.', status: 'Waiting', tokenNumber: 3 },
      { id: 'APT-104', patientName: 'Praveen Chandran', time: '11:45 AM', date: '2026-11-28', department: 'Cardiology & Critical Care', doctorName: 'Dr. Sundaramoorthy M.', status: 'Scheduled', tokenNumber: 4 },
      { id: 'APT-105', patientName: 'Geetha Ramanathan', time: '02:30 PM', date: '2026-11-28', department: 'Cardiology & Critical Care', doctorName: 'Dr. Sundaramoorthy M.', status: 'Scheduled', tokenNumber: 5 }
    ];
  }

  public updateAppointmentStatus(aptId: string, newStatus: string): void {
    const list = this.getAppointments();
    const item = list.find(a => a.id === aptId);
    if (item) {
      item.status = newStatus;
      localStorage.setItem(hospitalScopedKey(APPOINTMENTS_STORAGE_KEY), JSON.stringify(list));
      this.broadcastUpdate('appointment_updated', item);
    }
    // Also attempt remote update in background
    api.updateAppointmentStatus(aptId, newStatus).catch(() => {});
  }

  // 9. LAB REPORTS INTEGRATION
  public getLabReports(): any[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(LABS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public addLabReport(report: any): void {
    const list = this.getLabReports();
    list.unshift(report);
    localStorage.setItem(hospitalScopedKey(LABS_STORAGE_KEY), JSON.stringify(list));
    this.broadcastUpdate('lab_report_created', report);
  }

  // 10. PRESCRIPTIONS INTEGRATION
  public getPrescriptions(): any[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(PRESCRIPTIONS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  public addPrescription(rx: any): void {
    const list = this.getPrescriptions();
    list.unshift(rx);
    localStorage.setItem(hospitalScopedKey(PRESCRIPTIONS_STORAGE_KEY), JSON.stringify(list));
    this.broadcastUpdate('prescription_created', rx);
  }

  // 11. PENDING ADMISSIONS INTEGRATION
  public getPendingAdmissions(): any[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(ADMISSIONS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return [
      { id: 'ADM-401', patient: 'Murugesan K.', age: 62, gender: 'Male', reason: 'Unstable Angina with refractory chest pain', triage: 'Red (STAT)', targetWard: 'ICU Block A', waitTime: '12 mins', status: 'Pending' },
      { id: 'ADM-402', patient: 'Jayanthi S.', age: 48, gender: 'Female', reason: 'Severe Exacerbation of COPD', triage: 'Orange (Urgent)', targetWard: 'Respiratory HDU', waitTime: '28 mins', status: 'Pending' },
      { id: 'ADM-403', patient: 'Venkatesh Rao', age: 71, gender: 'Male', reason: 'Acute Pyelonephritis with Urosepsis', triage: 'Yellow (Standard)', targetWard: 'Nephrology Ward 3', waitTime: '45 mins', status: 'Pending' }
    ];
  }

  public acceptAdmission(admId: string, bedId?: string, ward?: string): void {
    const list = this.getPendingAdmissions();
    const item = list.find(a => a.id === admId);
    if (item) {
      item.status = 'Admitted';
      localStorage.setItem(hospitalScopedKey(ADMISSIONS_STORAGE_KEY), JSON.stringify(list.filter(a => a.id !== admId)));
      this.broadcastUpdate('admission_accepted', item);
    }
    // Also attempt remote update
    api.acceptAdmission(admId, { bedId, ward }).catch(() => {});
  }

  // 12. INTEROPERABILITY & HEALTH DATA EXCHANGE
  public getInteroperabilityConnections(): InteroperabilityConnection[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(INTEROP_CONNS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_INTEROPERABILITY_CONNECTIONS;
  }

  public saveInteroperabilityConnections(conns: InteroperabilityConnection[]): void {
    localStorage.setItem(hospitalScopedKey(INTEROP_CONNS_STORAGE_KEY), JSON.stringify(conns));
    this.broadcastUpdate('interop_connections_updated', conns);
  }

  public getExchangeTransactions(): ExchangeTransaction[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(INTEROP_EXCHANGES_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_EXCHANGE_TRANSACTIONS;
  }

  public addExchangeTransaction(tx: ExchangeTransaction): void {
    const list = this.getExchangeTransactions();
    list.unshift(tx);
    localStorage.setItem(hospitalScopedKey(INTEROP_EXCHANGES_STORAGE_KEY), JSON.stringify(list));
    this.broadcastUpdate('interop_exchange_added', tx);
  }

  public getAbdmConsents(): ABDMConsentArtefact[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(ABDM_CONSENTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_ABDM_CONSENTS;
  }

  public saveAbdmConsents(consents: ABDMConsentArtefact[]): void {
    localStorage.setItem(hospitalScopedKey(ABDM_CONSENTS_STORAGE_KEY), JSON.stringify(consents));
    this.broadcastUpdate('abdm_consents_updated', consents);
  }

  public getInboundPatientImports(): InboundPatientImport[] {
    try {
      const data = localStorage.getItem(hospitalScopedKey(INBOUND_IMPORTS_STORAGE_KEY));
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_INBOUND_PATIENT_IMPORTS;
  }

  public updateInboundPatientImport(importId: string, status: 'COMMITTED' | 'REJECTED', notes?: string, reviewer?: string): void {
    const list = this.getInboundPatientImports();
    const item = list.find(i => i.importId === importId);
    if (item) {
      item.stagedStatus = status;
      item.reviewNotes = notes;
      item.reviewedBy = reviewer || 'Dr. Sundaramoorthy M.';
      localStorage.setItem(hospitalScopedKey(INBOUND_IMPORTS_STORAGE_KEY), JSON.stringify(list));
      this.broadcastUpdate('inbound_import_updated', item);
    }
  }
}

export const hospitalDataService = HospitalDataService.getInstance();
