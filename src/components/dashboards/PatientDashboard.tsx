import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  PhoneCall, 
  Activity, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Ticket, 
  ArrowRight, 
  Stethoscope, 
  Ambulance, 
  Bed, 
  Wind, 
  Check, 
  Share2, 
  HeartPulse, 
  Droplet, 
  FileText, 
  Users, 
  Plus, 
  Printer, 
  Search, 
  Award, 
  HelpCircle,
  Microscope,
  Pill,
  Baby,
  Heart,
  ChevronRight,
  ExternalLink,
  Info,
  X,
  User,
  ArrowDown,
  Accessibility,
  FlaskConical,
  Star,
  ClipboardList,
  Bell,
  Settings,
  ArrowLeft,
  RotateCcw,
  History,
  XCircle,
  CalendarClock,
  RefreshCw,
  Volume2,
  Pause,
  Play,
  BellRing,
  Wrench,
  DoorOpen,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Hospital } from '../../types';
import { PatientRecordsModule } from '../patient-dashboard/PatientRecordsModule';
import { AIQueueUrgencyModule } from '../patient-dashboard/AIQueueUrgencyModule';

export interface PatientDashboardProps {
  activeTab?: string;
  selectedHospital?: Hospital;
  onBack?: () => void;
  onSelectTab?: (tab: string) => void;
}

export interface ActiveOPDToken {
  tokenNumber: string;
  requestId?: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  patientName: string;
  patientMobile: string;
  patientAgeGender: string;
  counterNumber: string;
  queuePosition: number;
  currentServingToken: string;
  estimatedWaitMinutes: number;
  status: 'Pending' | 'In Queue' | 'Called' | 'Completed' | 'Cancelled' | 'Declined';
  declineReason?: string;
  bookedAt: string;
  reviewedAt?: string;
}

export interface PastHospitalAppointment {
  id: string;
  tokenNumber: string;
  doctorName: string;
  doctorQualification: string;
  department: string;
  room: string;
  date: string;
  timeSlot: string;
  complaint: string;
  diagnosis: string;
  prescriptions: string[];
  doctorAdvice: string;
  status: 'Completed';
}

export interface CancelledAppointmentRecord {
  id: string;
  tokenNumber: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  originalDate: string;
  originalTime: string;
  cancelledAt: string;
  reason: string;
  patientName: string;
}

export interface QueueNotificationItem {
  id: string;
  type: 'approaching' | 'called' | 'delayed' | 'paused' | 'completed' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  tag: string;
}

export type VisualBedStatus = 'available' | 'occupied' | 'cleaning' | 'discharging' | 'maintenance';

export interface VisualBedMatrixItem {
  id: string;
  bedNumber: string;
  ward: 'General Ward' | 'ICU' | 'Emergency Ward' | 'Private Ward' | 'Pediatrics';
  status: VisualBedStatus;
  patientName?: string;
  patientInitials?: string;
  hoursStay?: string;
  diagnosis?: string;
  expectedDischarge?: string;
  evsMinutes?: string;
  equipment?: string[];
  floor: string;
  oxygenReady: boolean;
  notes?: string;
}

export type EquipmentCategory = 'Respiratory' | 'Monitoring' | 'Treatment' | 'Emergency' | 'Mobility' | 'Diagnostic';

export interface PatientEquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  categoryLabel: string;
  total: number;
  inUse: number;
  maintenance: number;
  available: number; // formula: total - inUse - maintenance
  lastUpdated: string;
  location: string;
  description: string;
  iconType: 'respiratory' | 'monitoring' | 'treatment' | 'emergency' | 'mobility' | 'diagnostic';
}

// Complete Equipment Data matching User Images 1, 3, & 4
const INITIAL_EQUIPMENT_LIST: PatientEquipmentItem[] = [
  {
    id: 'eq-vent',
    name: 'Ventilator (Advanced Mechanical)',
    category: 'Respiratory',
    categoryLabel: 'Respiratory Equipment',
    total: 10,
    inUse: 6,
    maintenance: 1,
    available: 3,
    lastUpdated: '5 mins ago',
    location: 'Critical Care ICU & Emergency Resuscitation',
    description: 'High-acuity invasive & non-invasive mechanical ventilation with oxygen blender.',
    iconType: 'respiratory'
  },
  {
    id: 'eq-mon',
    name: 'Patient Monitor (Multi-Para Vital)',
    category: 'Monitoring',
    categoryLabel: 'Monitoring Equipment',
    total: 20,
    inUse: 12,
    maintenance: 2,
    available: 6,
    lastUpdated: '12 mins ago',
    location: 'Step-Down & Post-Op Ward',
    description: 'Continuous ECG, SpO2, NIBP, Respiration & Temperature telemetry tracking.',
    iconType: 'monitoring'
  },
  {
    id: 'eq-ecg',
    name: 'ECG Machine (12-Lead Diagnostic)',
    category: 'Monitoring',
    categoryLabel: 'Monitoring Equipment',
    total: 8,
    inUse: 3,
    maintenance: 1,
    available: 4,
    lastUpdated: '18 mins ago',
    location: 'Cardiology OPD & Emergency',
    description: '12-lead digital diagnostic electrocardiograph with instant waveform printout.',
    iconType: 'monitoring'
  },
  {
    id: 'eq-wheel',
    name: 'Wheelchair (Ergonomic Attendant)',
    category: 'Mobility',
    categoryLabel: 'Mobility Equipment',
    total: 30,
    inUse: 12,
    maintenance: 2,
    available: 16,
    lastUpdated: '2 mins ago',
    location: 'OPD Reception, Triage & Entry Ramp',
    description: 'Collapsible padded attendant-propelled wheelchair with safety footrest.',
    iconType: 'mobility'
  },
  {
    id: 'eq-infusion',
    name: 'Infusion Pump (Precision Volumetric)',
    category: 'Treatment',
    categoryLabel: 'Treatment Equipment',
    total: 15,
    inUse: 9,
    maintenance: 1,
    available: 5,
    lastUpdated: '15 mins ago',
    location: 'Oncology, Day Care & General Medicine',
    description: 'Micro-dose accurate IV medication and fluid delivery infusion system.',
    iconType: 'treatment'
  },
  {
    id: 'eq-o2conc',
    name: 'Oxygen Concentrator (10L High-Flow)',
    category: 'Respiratory',
    categoryLabel: 'Respiratory Equipment',
    total: 12,
    inUse: 7,
    maintenance: 1,
    available: 4,
    lastUpdated: '8 mins ago',
    location: 'Pulmonology & General Ward',
    description: 'Continuous medical grade oxygen enrichment up to 95% concentration.',
    iconType: 'respiratory'
  },
  {
    id: 'eq-bipap',
    name: 'BiPAP / CPAP Respiratory Unit',
    category: 'Respiratory',
    categoryLabel: 'Respiratory Equipment',
    total: 10,
    inUse: 6,
    maintenance: 1,
    available: 3,
    lastUpdated: '22 mins ago',
    location: 'Pulmonology & Sleep Disorders Lab',
    description: 'Dual positive airway pressure support device for acute respiratory distress.',
    iconType: 'respiratory'
  },
  {
    id: 'eq-pulseox',
    name: 'Pulse Oximeter (Digital Fingertip)',
    category: 'Monitoring',
    categoryLabel: 'Monitoring Equipment',
    total: 45,
    inUse: 28,
    maintenance: 2,
    available: 15,
    lastUpdated: '1 min ago',
    location: 'All Wards, OPD Counters & Triage',
    description: 'Real-time blood oxygen saturation (SpO2) and pulse rate monitoring probe.',
    iconType: 'monitoring'
  },
  {
    id: 'eq-syringe',
    name: 'Syringe Pump (Target Infusion)',
    category: 'Treatment',
    categoryLabel: 'Treatment Equipment',
    total: 18,
    inUse: 11,
    maintenance: 1,
    available: 6,
    lastUpdated: '14 mins ago',
    location: 'Neonatal & Pediatric Intensive Care',
    description: 'Ultra-low flow precise syringe delivery for critical intravenous medication.',
    iconType: 'treatment'
  },
  {
    id: 'eq-defib',
    name: 'Defibrillator (Biphasic AED)',
    category: 'Emergency',
    categoryLabel: 'Emergency Equipment',
    total: 6,
    inUse: 2,
    maintenance: 1,
    available: 3,
    lastUpdated: '10 mins ago',
    location: 'Emergency Casualty & Cardiac Resuscitation Bay',
    description: 'Biphasic manual defibrillator with external pacing and automated AED protocol.',
    iconType: 'emergency'
  },
  {
    id: 'eq-crash',
    name: 'Crash Cart (Resuscitation Station)',
    category: 'Emergency',
    categoryLabel: 'Emergency Equipment',
    total: 8,
    inUse: 4,
    maintenance: 0,
    available: 4,
    lastUpdated: '30 mins ago',
    location: 'ICU, Trauma Triage & OT Complex',
    description: 'Self-contained mobile resuscitation trolley with emergency drugs and intubation kit.',
    iconType: 'emergency'
  },
  {
    id: 'eq-stretcher',
    name: 'Stretcher / Patient Transport Gurney',
    category: 'Mobility',
    categoryLabel: 'Mobility Equipment',
    total: 22,
    inUse: 14,
    maintenance: 1,
    available: 7,
    lastUpdated: '6 mins ago',
    location: 'Ambulance Entry & Emergency Reception',
    description: 'Hydraulic height-adjustable trolley with IV pole and dual safety side rails.',
    iconType: 'mobility'
  },
  {
    id: 'eq-ultrasound',
    name: 'Portable Point-of-Care Ultrasound',
    category: 'Diagnostic',
    categoryLabel: 'Diagnostic Equipment',
    total: 4,
    inUse: 2,
    maintenance: 1,
    available: 1,
    lastUpdated: '35 mins ago',
    location: 'Emergency FAST Scan & Radiology',
    description: 'Handheld diagnostic imaging scanner for abdominal, cardiac & vascular assessment.',
    iconType: 'diagnostic'
  }
];

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ 
  activeTab = 'overview',
  selectedHospital,
  onBack,
  onSelectTab
}) => {
  const { user, appointments, bookAppointment, beds } = useApp();

  // Fallback hospital defaults
  const currentHospital: Hospital = selectedHospital || {
    id: 'reg-001',
    districtId: 'coimbatore',
    districtName: 'Coimbatore',
    name: 'VVV hospital',
    type: 'Government Medical College Hospital' as any,
    location: 'EVR Periyar Salai, Park Town',
    availableDepartments: ['General Medicine', 'Trauma & Emergency', 'Cardiology OPD', 'Pulmonology', 'ICU', 'Pediatrics OPD'],
    status: 'Operational',
    totalBeds: 1750,
    occupiedBeds: 1225,
    readyBeds: 438,
    prepBeds: 5,
    icuAvailable: 180,
    ventilatorsAvailable: 108,
    phone: '+91 44 2530 5000',
    emergencyContact: '044-25305112'
  };

  // Section anchor references for smooth scrolling
  const appointmentsSectionRef = useRef<HTMLDivElement | null>(null);
  const queueSectionRef = useRef<HTMLDivElement | null>(null);
  const bedsSectionRef = useRef<HTMLDivElement | null>(null);
  const recordsSectionRef = useRef<HTMLDivElement | null>(null);

  // Storage key for persistent active token per hospital
  const STORAGE_TOKEN_KEY = `medisync_patient_token_${currentHospital.id}`;

  // Internal tab state within hospital's patient portal
  const [activeSection, setActiveSection] = useState<'overview' | 'appointments' | 'queue' | 'ai_urgency' | 'beds' | 'facilities' | 'doctors' | 'emergency' | 'records'>(() => {
    if (activeTab === 'appointments') return 'appointments';
    if (activeTab === 'queue') return 'queue';
    if (activeTab === 'ai_urgency') return 'ai_urgency';
    if (activeTab === 'beds') return 'beds';
    if (activeTab === 'facilities' || activeTab === 'hospital') return 'facilities';
    if (activeTab === 'doctors') return 'doctors';
    if (activeTab === 'emergency' || activeTab === 'requests') return 'emergency';
    if (activeTab === 'profile' || activeTab === 'records') return 'records';
    return 'overview';
  });

  // Search input inside Hero banner
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // Sync with activeTab from parent (e.g. left sidebar click on "Appointments", "OPD Queue Status" or "Bed Management")
  useEffect(() => {
    if (activeTab === 'appointments') {
      setActiveSection('appointments');
      setTimeout(() => {
        appointmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activeTab === 'queue') {
      setActiveSection('queue');
      setTimeout(() => {
        queueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activeTab === 'ai_urgency') {
      setActiveSection('ai_urgency');
    } else if (activeTab === 'beds') {
      setActiveSection('beds');
      setResourceSubTab('beds');
      setTimeout(() => {
        bedsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activeTab === 'equipment') {
      setActiveSection('beds');
      setResourceSubTab('equipment');
      setTimeout(() => {
        bedsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activeTab === 'profile' || activeTab === 'records') {
      setActiveSection('records');
      setTimeout(() => {
        recordsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activeTab === 'facilities' || activeTab === 'hospital' || activeTab === 'diagnostics' || activeTab === 'blood_bank' || activeTab === 'pharmacy') {
      setActiveSection('facilities');
    } else if (activeTab === 'doctors') {
      setActiveSection('doctors');
    } else if (activeTab === 'emergency' || activeTab === 'requests') {
      setActiveSection('emergency');
    } else if (activeTab === 'dashboard') {
      setActiveSection('overview');
    }
  }, [activeTab]);

  // Active OPD Token state (Detects if user has already applied)
  const [activeToken, setActiveToken] = useState<ActiveOPDToken | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.tokenNumber) return parsed;
      }
    } catch {}

    // Check if an existing appointment exists in AppContext for this hospital & user
    const existing = appointments.find(a => 
      (a.patientId === user?.id || a.patientName === user?.name || a.patientId === 'usr-patient-demo') &&
      (!a.hospitalName || a.hospitalName.toLowerCase().includes(currentHospital.name.toLowerCase()) || currentHospital.name.toLowerCase().includes(a.hospitalName.toLowerCase()))
    );

    if (existing) {
      return {
        tokenNumber: `TK-${(currentHospital.name.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'HOSP').toUpperCase()}-${existing.tokenNumber || '169'}`,
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        department: existing.department || 'Cardiology OPD',
        doctorName: existing.doctorName || 'Dr. Arun Kumar',
        date: existing.date || '2026-11-28',
        timeSlot: existing.time || '10:30 AM - 12:00 PM',
        purpose: 'Routine consultation & general health check',
        patientName: user?.name || 'Muralitharan',
        patientMobile: '+91 98401 22345',
        patientAgeGender: '28 / Male',
        counterNumber: 'Counter 2 (OPD Bay A)',
        queuePosition: existing.queuePosition || 3,
        currentServingToken: 'C-021',
        estimatedWaitMinutes: existing.estimatedWaitMinutes || 15,
        status: 'In Queue',
        bookedAt: new Date().toISOString()
      };
    }

    return null;
  });

  // Success celebration banner after booking
  const [showBookingCelebration, setShowBookingCelebration] = useState(false);

  // Sub-tabs within Appointments module (Upcoming Appointments | Appointment History | Cancelled Appointments)
  const [appointmentSubTab, setAppointmentSubTab] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-29');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('10:30 AM - 12:00 PM');
  const [rescheduleToast, setRescheduleToast] = useState<string | null>(null);

  // Hospital OPD Triage Decline Modal State (Requested by user)
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('Doctor is currently called for emergency surgery in OT. Please choose an afternoon session.');
  const [customDeclineText, setCustomDeclineText] = useState('');

  // Past Visit Detail Modal
  const [selectedPastVisit, setSelectedPastVisit] = useState<PastHospitalAppointment | null>(null);

  // 3rd Module: OPD Queue Status & Notifications State (User Images 1 & 2)
  const [queueOperationalStatus, setQueueOperationalStatus] = useState<'running' | 'paused' | 'delayed'>('running');
  const [patientCurrentStage, setPatientCurrentStage] = useState<number>(3); // 1: Token Issued, 2: Triage Cleared, 3: Waiting in Line, 4: Consulting Doctor, 5: Pharmacy & Discharge
  const [latestQueueAlert, setLatestQueueAlert] = useState<QueueNotificationItem | null>({
    id: 'init-alert-1',
    type: 'approaching',
    title: '🔔 Your turn is approaching',
    message: 'Few patients remaining ahead. Current position: #3 in line at Counter 1.',
    timestamp: '2 mins ago',
    read: false,
    tag: 'Queue Alert'
  });

  // Real-time synchronization of OPD token status across portals and tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_TOKEN_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.tokenNumber) {
            setActiveToken(parsed);
          }
        } else {
          setActiveToken(null);
        }
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('medisync_opd_update', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('medisync_opd_update', handleSync);
    };
  }, [STORAGE_TOKEN_KEY]);

  const [queueNotifications, setQueueNotifications] = useState<QueueNotificationItem[]>([
    {
      id: 'notif-1',
      type: 'approaching',
      title: '🔔 Your turn is approaching',
      message: 'Few patients remaining. Please be seated near Counter 1 / OPD Room 104.',
      timestamp: '2 mins ago',
      read: false,
      tag: 'Turn Approaching'
    },
    {
      id: 'notif-2',
      type: 'info',
      title: 'Triage & Vital Signs Cleared',
      message: 'Blood pressure (124/82), SpO2 (99%) and temperature (98.4°F) recorded by nurse.',
      timestamp: '8 mins ago',
      read: true,
      tag: 'Triage Completed'
    },
    {
      id: 'notif-3',
      type: 'info',
      title: 'OPD Token Assigned',
      message: 'Token #TK-VVVH-169 assigned for Dr. Arun Kumar at Counter 1 (General OPD).',
      timestamp: '15 mins ago',
      read: true,
      tag: 'Booking Confirmed'
    }
  ]);

  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  // Interactive Dr. MediSync Assistant Modal State (triggered by clicking doctor character)
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // 4th Module: Bed Management States & Matrix (User Images 1, 2, & 3)
  const [selectedWardFilter, setSelectedWardFilter] = useState<'All Wards' | 'General Ward' | 'ICU' | 'Emergency Ward' | 'Private Ward' | 'Pediatrics'>('All Wards');
  const [selectedBedStatusFilter, setSelectedBedStatusFilter] = useState<'all' | 'available' | 'occupied' | 'cleaning' | 'discharging' | 'maintenance'>('all');
  const [selectedBedForModal, setSelectedBedForModal] = useState<VisualBedMatrixItem | null>(null);
  const [hoveredBedId, setHoveredBedId] = useState<string | null>(null);
  const [bedSearchQuery, setBedSearchQuery] = useState('');
  const [bedAdmissionRequestSent, setBedAdmissionRequestSent] = useState<string | null>(null);

  // Sub-Tab inside Bed & Resource Management: 'beds' vs 'equipment' (User Image 2 request)
  const [resourceSubTab, setResourceSubTab] = useState<'beds' | 'equipment'>('beds');
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState<'All' | 'Respiratory' | 'Monitoring' | 'Treatment' | 'Emergency' | 'Mobility' | 'Diagnostic'>('All');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<'all' | 'available' | 'in_use' | 'maintenance'>('all');
  const [selectedEquipmentForEnquiry, setSelectedEquipmentForEnquiry] = useState<PatientEquipmentItem | null>(null);
  const [equipmentEnquirySuccess, setEquipmentEnquirySuccess] = useState<string | null>(null);
  const [equipmentUrgency, setEquipmentUrgency] = useState<'Immediate' | 'Routine' | 'Transfer'>('Immediate');
  const [equipmentDepartment, setEquipmentDepartment] = useState('Critical Care ICU');
  const [equipmentNotes, setEquipmentNotes] = useState('');

  // Filtered Equipment List for Citizen View (Images 1, 3, & 4)
  const filteredEquipment = INITIAL_EQUIPMENT_LIST
    .filter(eq => (selectedEquipmentCategory === 'All' ? true : eq.category === selectedEquipmentCategory))
    .filter(eq => {
      if (equipmentStatusFilter === 'available') return eq.available > 0;
      if (equipmentStatusFilter === 'in_use') return eq.inUse > 0;
      if (equipmentStatusFilter === 'maintenance') return eq.maintenance > 0;
      return true;
    })
    .filter(eq => {
      if (!equipmentSearchQuery) return true;
      const q = equipmentSearchQuery.toLowerCase();
      return (
        eq.name.toLowerCase().includes(q) ||
        eq.category.toLowerCase().includes(q) ||
        eq.location.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q)
      );
    });

  // 36 Interactive Bed Matrix Items matching user reference layout
  const [visualBedList, setVisualBedList] = useState<VisualBedMatrixItem[]>([
    {
      id: 'bed-101',
      bedNumber: 'Bed 101',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 Supply', 'Nurse Call Bell', 'IV Stand']
    },
    {
      id: 'bed-jd-48',
      bedNumber: 'J.D.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Jane Doe',
      patientInitials: 'J.D.',
      hoursStay: '48h',
      diagnosis: 'Acute Community-Acquired Pneumonia',
      expectedDischarge: 'Today, 2:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 (3 L/min)', 'Multipara Monitor']
    },
    {
      id: 'bed-as-48',
      bedNumber: 'A.S.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Anand Sundaram',
      patientInitials: 'A.S.',
      hoursStay: '48h',
      diagnosis: 'Type 2 Diabetes with Cellulitis',
      expectedDischarge: 'Tomorrow, 11:00 AM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['IV Infusion Pump', 'Glucose Monitor']
    },
    {
      id: 'bed-jd2-48',
      bedNumber: 'J.D.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'John Daniel',
      patientInitials: 'J.D.',
      hoursStay: '48h',
      diagnosis: 'Post-Op Appendectomy Recovery',
      expectedDischarge: '29 Nov 2026',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Wound Drain Bag', 'Pain Relief Infuser']
    },
    {
      id: 'bed-108',
      bedNumber: 'Bed 108',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 Supply', 'Call Bell']
    },
    {
      id: 'bed-102',
      bedNumber: 'Bed 102',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 Supply', 'Emergency Defib Standby']
    },
    {
      id: 'bed-104',
      bedNumber: 'Bed 104',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Standard Fowler Bed', 'Wall O2']
    },
    {
      id: 'bed-109',
      bedNumber: 'Bed 108',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 Supply', 'Sanitized Bedding']
    },
    {
      id: 'bed-as-24',
      bedNumber: 'A.S.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Arunachalam S.',
      patientInitials: 'A.S.',
      hoursStay: '24h',
      diagnosis: 'Hypertensive Urgency Review',
      expectedDischarge: 'Today, 6:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['NIBP Monitor', 'ECG Holter']
    },
    {
      id: 'bed-ja-24',
      bedNumber: 'J.A.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Joseph Antony',
      patientInitials: 'J.A.',
      hoursStay: '24h',
      diagnosis: 'Viral Gastroenteritis Dehydration',
      expectedDischarge: 'Today, 4:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Saline Infusion', 'Electrolyte Infuser']
    },
    {
      id: 'bed-fh-24',
      bedNumber: 'F.H.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Fatima Hameed',
      patientInitials: 'F.H.',
      hoursStay: '24h',
      diagnosis: 'Bronchial Asthma Exacerbation',
      expectedDischarge: 'Tomorrow, 09:30 AM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Nebulizer Port', 'SpO2 Sensor']
    },
    {
      id: 'bed-as2-24',
      bedNumber: 'A.S.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Aishwarya Saravanan',
      patientInitials: 'A.S.',
      hoursStay: '24h',
      diagnosis: 'Dengue Fever with Low Platelets',
      expectedDischarge: '30 Nov 2026',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Platelet Infusion Stand', 'Vitals Monitor']
    },
    {
      id: 'bed-jr-48',
      bedNumber: 'J.R.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'James Robert',
      patientInitials: 'J.R.',
      hoursStay: '48h',
      diagnosis: 'Unstable Angina Monitoring',
      expectedDischarge: 'Today, 5:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Cardiac Telemetry Unit', 'Wall O2']
    },
    {
      id: 'bed-08',
      bedNumber: 'Bed 08',
      ward: 'General Ward',
      status: 'cleaning',
      evsMinutes: '15m',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['EVS Sanitization Protocol Active', 'UV Sterilization Pending']
    },
    {
      id: 'bed-115',
      bedNumber: 'Bed 115',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Ready for Intake', 'Wall O2', 'Nurse Call']
    },
    {
      id: 'bed-jd3-24',
      bedNumber: 'J.D.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Jayakumar D.',
      patientInitials: 'J.D.',
      hoursStay: '24h',
      diagnosis: 'Acute Pyelonephritis',
      expectedDischarge: 'Tomorrow, 12:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['IV Antibiotic Pump']
    },
    {
      id: 'bed-md-24',
      bedNumber: 'M.D.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Mohamed Dawood',
      patientInitials: 'M.D.',
      hoursStay: '24h',
      diagnosis: 'Deep Vein Thrombosis Heparinization',
      expectedDischarge: '01 Dec 2026',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Pneumatic Compression Boots', 'Infusion Pump']
    },
    {
      id: 'bed-25',
      bedNumber: 'Bed 25',
      ward: 'General Ward',
      status: 'discharging',
      patientName: 'Rajesh Manickam',
      diagnosis: 'Recovered Dengue Fever',
      expectedDischarge: 'Within 1 hour',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      notes: 'Doctor discharge summary signed. Discharge billing in progress.',
      equipment: ['Bed liberating shortly for incoming emergency']
    },
    {
      id: 'bed-as3-24',
      bedNumber: 'A.S.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Amudha Selvan',
      patientInitials: 'A.S.',
      hoursStay: '24h',
      diagnosis: 'Severe Migraine with Dehydration',
      expectedDischarge: 'Today, 3:30 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['IV Stand']
    },
    {
      id: 'bed-84',
      bedNumber: 'Bed 84',
      ward: 'General Ward',
      status: 'cleaning',
      evsMinutes: '15m',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Hospital Grade Sanitization', 'Fresh Linen Being Dressed']
    },
    {
      id: 'bed-112',
      bedNumber: 'Bed 112',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Disinfected & Certified Ready']
    },
    {
      id: 'bed-66',
      bedNumber: 'Bed 66',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Full Fowler Bed Ready']
    },
    {
      id: 'bed-do-24',
      bedNumber: 'D.O.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'David O\'Connor',
      patientInitials: 'D.O.',
      hoursStay: '24h',
      diagnosis: 'Acute Food Poisoning & Hypokalemia',
      expectedDischarge: 'Today, 7:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Electrolyte Monitor']
    },
    {
      id: 'bed-78-48',
      bedNumber: 'Bed 78',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Murugesan K.',
      hoursStay: '48h',
      diagnosis: 'Chronic Bronchitis Flare-up',
      expectedDischarge: 'Tomorrow, 10:00 AM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 (2 L/min)', 'Incentive Spirometer']
    },
    {
      id: 'bed-jd4-24',
      bedNumber: 'J.D.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Jeevan Das',
      patientInitials: 'J.D.',
      hoursStay: '24h',
      diagnosis: 'Fracture Left Tibia Post-POP Care',
      expectedDischarge: '29 Nov 2026',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Traction Frame', 'Pain Management Pump']
    },
    {
      id: 'bed-114',
      bedNumber: 'Bed 114',
      ward: 'General Ward',
      status: 'available',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Wall O2 Supply', 'Suction Line Active']
    },
    {
      id: 'bed-36-24',
      bedNumber: 'Bed 36',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Kavitha R.',
      hoursStay: '24h',
      diagnosis: 'Cholecystectomy Post-Op Day 1',
      expectedDischarge: 'Today, 8:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Vital Monitor', 'Abdominal Binder']
    },
    {
      id: 'bed-37-24',
      bedNumber: 'Bed 37',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Suresh Babu',
      hoursStay: '24h',
      diagnosis: 'Mild Stroke TIA Stabilization',
      expectedDischarge: 'Tomorrow, 02:00 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Neuro-Vitals Monitor', 'O2 Mask']
    },
    {
      id: 'bed-90',
      bedNumber: 'Bed 90',
      ward: 'General Ward',
      status: 'cleaning',
      evsMinutes: '08m',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['EVS Sanitization Ending in 8m']
    },
    {
      id: 'bed-as4-24',
      bedNumber: 'A.S.',
      ward: 'General Ward',
      status: 'occupied',
      patientName: 'Antony Samy',
      patientInitials: 'A.S.',
      hoursStay: '24h',
      diagnosis: 'Acute Gout Arthritis Flare',
      expectedDischarge: 'Today, 6:30 PM',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      equipment: ['Analgesic Infusion']
    },
    {
      id: 'bed-92',
      bedNumber: 'Bed 92',
      ward: 'General Ward',
      status: 'cleaning',
      evsMinutes: '08m',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Mattress Disinfection Ready']
    },
    {
      id: 'bed-93',
      bedNumber: 'Bed 93',
      ward: 'General Ward',
      status: 'cleaning',
      evsMinutes: '08m',
      floor: 'Floor 1 (Block B)',
      oxygenReady: true,
      equipment: ['Terminal Cleaning 8m Remaining']
    },
    {
      id: 'bed-52',
      bedNumber: 'Bed 52',
      ward: 'ICU',
      status: 'discharging',
      patientName: 'Venkatesan T.',
      diagnosis: 'Post-CABG Heart Surgery Step Down',
      expectedDischarge: 'Step Down to Ward in 2h',
      floor: 'Floor 2 (ICU Wing)',
      oxygenReady: true,
      equipment: ['Transfer to General Ward In Progress']
    },
    {
      id: 'bed-71',
      bedNumber: 'Bed 71',
      ward: 'Emergency Ward',
      status: 'discharging',
      patientName: 'Praveen Kumar',
      diagnosis: 'Road Accident Observation - Normal CT',
      expectedDischarge: 'Discharge in 45m',
      floor: 'Ground Floor',
      oxygenReady: true,
      equipment: ['Ready for Home Discharge']
    },
    {
      id: 'bed-116',
      bedNumber: 'Bed 116',
      ward: 'General Ward',
      status: 'maintenance',
      floor: 'Floor 1 (Block B)',
      oxygenReady: false,
      notes: 'Motorized backrest hydraulic repair & electrical calibration',
      equipment: ['Biomedical Engineering Tagged']
    },
    {
      id: 'bed-120',
      bedNumber: 'Bed 120',
      ward: 'ICU',
      status: 'maintenance',
      floor: 'Floor 2 (ICU Wing)',
      oxygenReady: false,
      notes: 'Central pipeline O2 flowmeter nozzle replacement in progress',
      equipment: ['Maintenance Underway - Ready in 2h']
    }
  ]);

  // Hospital Abbreviation for token codes
  const hospAbbr = (currentHospital.name.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'HOSP').toUpperCase();

  // Past Consultations History at THIS hospital ("antha hospitalaye ithuku munadi vanthu pathurukagala nudrathu")
  const [pastHistoryList, setPastHistoryList] = useState<PastHospitalAppointment[]>([
    {
      id: 'hist-1',
      tokenNumber: `TK-${hospAbbr}-108`,
      doctorName: 'Dr. Arun Kumar',
      doctorQualification: 'MD, DM (Cardiology), FACC',
      department: 'Cardiology OPD',
      room: 'OPD Room 104 (Block A)',
      date: '14 Oct 2026',
      timeSlot: '10:00 AM - 11:30 AM',
      complaint: 'Routine hypertension follow-up & mild exertion chest heaviness',
      diagnosis: 'Stage 1 Essential Hypertension (Stable). Normal 12-lead ECG, SpO2 99%.',
      prescriptions: [
        'Tab. Amlodipine 5mg (1-0-0) x 30 days',
        'Tab. Telmisartan 40mg (0-0-1) x 30 days',
        'Tab. Ecosprin 75mg (0-1-0) x 30 days'
      ],
      doctorAdvice: 'Blood pressure stabilized at 124/82 mmHg. Maintain moderate sodium reduction and brisk walking 30 mins daily. Review in 6 weeks.',
      status: 'Completed'
    },
    {
      id: 'hist-2',
      tokenNumber: `TK-${hospAbbr}-042`,
      doctorName: 'Dr. Sundaramoorthy M.',
      doctorQualification: 'MD (General Medicine), DNB',
      department: 'General Medicine',
      room: 'OPD Room 108 (Block A)',
      date: '05 Aug 2026',
      timeSlot: '09:30 AM - 11:00 AM',
      complaint: 'Seasonal viral fever, dry persistent cough & acute throat soreness',
      diagnosis: 'Acute Upper Respiratory Tract Viral Infection. Chest clear bilateral.',
      prescriptions: [
        'Tab. Paracetamol 650mg (SOS after food) x 5 days',
        'Tab. Vitamin C + Zinc (1-0-0) x 10 days',
        'Warm Saline Gargle thrice daily'
      ],
      doctorAdvice: 'Adequate hydration and bed rest. Fever subsided. Patient recovered completely without complications.',
      status: 'Completed'
    }
  ]);

  // Cancelled Appointments Archive (Persisted per hospital in localStorage)
  const [cancelledList, setCancelledList] = useState<CancelledAppointmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`medisync_cancelled_${currentHospital.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'canc-init-1',
        tokenNumber: `TK-${hospAbbr}-019`,
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        department: 'General Medicine',
        doctorName: 'Dr. Sundaramoorthy M.',
        originalDate: '2026-11-20',
        originalTime: '09:00 AM - 10:30 AM',
        cancelledAt: '20 Nov 2026, 08:15 AM',
        reason: 'Cancelled by patient due to urgent schedule conflict',
        patientName: user?.name || 'Karthik Subramanian'
      }
    ];
  });

  // Booking Form Fields
  const [department, setDepartment] = useState('Cardiology OPD');
  const [doctorName, setDoctorName] = useState('Dr. Arun Kumar');
  const [date, setDate] = useState('2026-11-28');
  const [timeSlot, setTimeSlot] = useState('10:30 AM - 12:00 PM');
  const [purpose, setPurpose] = useState('Routine consultation & general health check');
  const [patientName, setPatientName] = useState(user?.name || 'Muralitharan');
  const [patientMobile, setPatientMobile] = useState('+91 98401 22345');
  const [patientAgeGender, setPatientAgeGender] = useState('28 / Male');

  // Aggregated operational telemetry (Defaults closely matching reference mockup: 284 beds, 42 ICU, 18 Vents)
  const totalBeds = currentHospital.totalBeds || 1750;
  const readyBedsCount = currentHospital.readyBeds ?? 438;
  const occupiedBedsCount = currentHospital.occupiedBeds ?? Math.max(0, totalBeds - readyBedsCount);
  const icuBedsCount = currentHospital.icuAvailable ?? 180;
  const icuReadyCount = Math.round(icuBedsCount * 0.3) || 54;
  const ventilatorsCount = currentHospital.ventilatorsAvailable ?? 108;
  const ventilatorsReadyCount = Math.round(ventilatorsCount * 0.45) || 49;
  const occupancyPercentage = Math.min(100, Math.round((occupiedBedsCount / totalBeds) * 100));

  // Doctors on duty list
  const doctorsList = [
    {
      id: 'doc-1',
      name: 'Dr. Arun Kumar',
      qualification: 'MD, DM (Cardiology), FACC',
      department: 'Cardiology OPD',
      specialty: 'Interventional Cardiology & Critical Care',
      room: 'OPD Room 104 (Block A)',
      timings: '09:00 AM - 01:30 PM',
      tokensWaiting: 3
    },
    {
      id: 'doc-2',
      name: 'Dr. Sundaramoorthy M.',
      qualification: 'MD (General Medicine), DNB',
      department: 'General Medicine',
      specialty: 'Acute Illness & Internal Medicine',
      room: 'OPD Room 108 (Block A)',
      timings: '09:30 AM - 02:00 PM',
      tokensWaiting: 4
    },
    {
      id: 'doc-3',
      name: 'Dr. Meenakshi S.',
      qualification: 'MD (Pulmonology), FCCP',
      department: 'Pulmonology Consultation',
      specialty: 'Respiratory Critical Care & Asthma',
      room: 'OPD Room 208 (Block B)',
      timings: '10:00 AM - 02:00 PM',
      tokensWaiting: 2
    },
    {
      id: 'doc-4',
      name: 'Dr. Priya Dharshini',
      qualification: 'MD (Pediatrics), DNB',
      department: 'Pediatrics OPD',
      specialty: 'Child Wellness, Immunization & NICU',
      room: 'OPD Room 112 (Maternity Wing)',
      timings: '09:30 AM - 01:00 PM',
      tokensWaiting: 2
    },
    {
      id: 'doc-5',
      name: 'Dr. R. Rajeshwaran',
      qualification: 'MS (Orthopedics), MCh',
      department: 'Orthopedics & Joint Care',
      specialty: 'Trauma Fracture & Joint Replacement',
      room: 'OPD Room 118 (Block A)',
      timings: '10:30 AM - 02:30 PM',
      tokensWaiting: 5
    }
  ];

  // Quick purpose selection pills
  const commonPurposes = [
    'Chest Discomfort / Palpitation Checkup',
    'Fever, Cough & Cold Evaluation',
    'Orthopedic Joint / Back Pain',
    'Blood Pressure & Diabetes Regular Review',
    'General Health Wellness Check',
    'Post-Treatment Clinical Follow-up'
  ];

  // When department changes, automatically align consulting doctor
  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    if (dept.includes('Cardio')) setDoctorName('Dr. Arun Kumar');
    else if (dept.includes('Pulmo')) setDoctorName('Dr. Meenakshi S.');
    else if (dept.includes('General')) setDoctorName('Dr. Sundaramoorthy M.');
    else if (dept.includes('Pediatric')) setDoctorName('Dr. Priya Dharshini');
    else if (dept.includes('Ortho')) setDoctorName('Dr. R. Rajeshwaran');
    else setDoctorName('Dr. Arun Kumar');
  };

  // Submit OPD Application Form -> Generates Request IN Appointments Page -> Form Disappears & Status Appears!
  const handleApplyOPD = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Call context bookAppointment
    bookAppointment(department, doctorName, date, timeSlot);

    // 2. Generate clean token number (e.g. TK-VVVH-169) & Request ID (e.g. REQ-VVVH-284)
    const hospAbbr = (currentHospital.name.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'HOSP').toUpperCase();
    const tokenRand = Math.floor(100 + Math.random() * 899);
    const generatedTokenNumber = `TK-${hospAbbr}-${tokenRand}`;
    const reqRand = Math.floor(1000 + Math.random() * 9000);
    const generatedRequestId = `REQ-${hospAbbr}-${reqRand}`;

    // 3. Construct Request Object with status 'Pending' (Sent directly to current hospital)
    const newRequest: ActiveOPDToken = {
      tokenNumber: generatedTokenNumber,
      requestId: generatedRequestId,
      hospitalId: currentHospital.id,
      hospitalName: currentHospital.name,
      department,
      doctorName,
      date,
      timeSlot,
      purpose: purpose.trim() || 'General Medical Consultation',
      patientName: patientName.trim() || user?.name || 'Muralitharan',
      patientMobile: patientMobile.trim() || '+91 98401 22345',
      patientAgeGender: patientAgeGender.trim() || '28 / Male',
      counterNumber: department.includes('Cardio') ? 'Counter 2 (OPD Bay A)' : department.includes('Pulmo') ? 'Counter 3 (OPD Bay B)' : 'Counter 1 (General OPD)',
      queuePosition: 3,
      currentServingToken: `C-021`,
      estimatedWaitMinutes: 14,
      status: 'Pending',
      bookedAt: new Date().toISOString()
    };

    // 4. Save to localStorage & state
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(newRequest));
      // Register into global hospital OPD requests registry so Hospital Dashboard sees it
      const stored = localStorage.getItem('medisync_hospital_opd_requests');
      const existingList = stored ? JSON.parse(stored) : [];
      const updatedList = [newRequest, ...existingList.filter((item: any) => item.tokenNumber !== newRequest.tokenNumber && item.requestId !== newRequest.requestId)];
      localStorage.setItem('medisync_hospital_opd_requests', JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('medisync_opd_update'));
    } catch {}

    setActiveToken(newRequest);
    setShowBookingCelebration(false);

    // Stay right on the APPOINTMENTS page so application form goes away and "My Appointments" appears!
    setActiveSection('appointments');
    onSelectTab?.('appointments');

    // Smooth scroll into view
    setTimeout(() => {
      appointmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Hospital OPD Triage: Accept Request & Issue Token
  const handleAcceptRequest = () => {
    if (!activeToken) return;
    const confirmedToken: ActiveOPDToken = {
      ...activeToken,
      status: 'In Queue',
      reviewedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(confirmedToken));
      const stored = localStorage.getItem('medisync_hospital_opd_requests');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((item: any) => 
          item.tokenNumber === activeToken.tokenNumber || item.requestId === activeToken.requestId
            ? { ...item, status: 'In Queue', reviewedAt: new Date().toISOString() }
            : item
        );
        localStorage.setItem('medisync_hospital_opd_requests', JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('medisync_opd_update'));
    } catch {}

    setActiveToken(confirmedToken);
    setShowBookingCelebration(true);
    setLatestQueueAlert({
      id: `alert-${Date.now()}`,
      type: 'info',
      title: '✅ OPD Token Confirmed by Hospital!',
      message: `${currentHospital.name} triage approved your consultation. Token #${activeToken.tokenNumber} is now active at ${activeToken.counterNumber}.`,
      timestamp: 'Just now',
      read: false,
      tag: 'Booking Confirmed'
    });
  };

  // Hospital OPD Triage: Decline Request with Reason
  const handleDeclineRequest = (reason: string) => {
    if (!activeToken) return;
    const declinedToken: ActiveOPDToken = {
      ...activeToken,
      status: 'Declined',
      declineReason: reason,
      reviewedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(declinedToken));
      const stored = localStorage.getItem('medisync_hospital_opd_requests');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((item: any) => 
          item.tokenNumber === activeToken.tokenNumber || item.requestId === activeToken.requestId
            ? { ...item, status: 'Declined', declineReason: reason, reviewedAt: new Date().toISOString() }
            : item
        );
        localStorage.setItem('medisync_hospital_opd_requests', JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('medisync_opd_update'));
    } catch {}

    setActiveToken(declinedToken);
    setShowDeclineModal(false);
  };

  // Re-apply after decline (Opens application form again)
  const handleReapplyBooking = () => {
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('medisync_opd_update'));
    } catch {}
    setActiveToken(null);
  };

  // Open Reschedule Modal with current values
  const handleOpenReschedule = () => {
    if (activeToken) {
      setRescheduleDate(activeToken.date);
      setRescheduleTimeSlot(activeToken.timeSlot);
    }
    setShowRescheduleModal(true);
  };

  // Confirm Reschedule Date & Time
  const handleConfirmReschedule = (newDateVal?: string, newTimeVal?: string) => {
    if (!activeToken) return;
    const dateToApply = newDateVal || rescheduleDate || '2026-11-29';
    const timeToApply = newTimeVal || rescheduleTimeSlot || '10:30 AM - 12:00 PM';

    const updatedToken: ActiveOPDToken = {
      ...activeToken,
      date: dateToApply,
      timeSlot: timeToApply
    };

    setActiveToken(updatedToken);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(updatedToken));
    } catch {}

    setShowRescheduleModal(false);
    setRescheduleToast(`Appointment rescheduled successfully to ${dateToApply} (${timeToApply})!`);
    setTimeout(() => setRescheduleToast(null), 6000);
  };

  // Cancel Active Token -> Archives to Cancelled list and allows re-booking
  const handleCancelToken = () => {
    if (activeToken) {
      const cancelledItem: CancelledAppointmentRecord = {
        id: `canc-${Date.now()}`,
        tokenNumber: activeToken.tokenNumber,
        hospitalId: activeToken.hospitalId,
        hospitalName: activeToken.hospitalName,
        department: activeToken.department,
        doctorName: activeToken.doctorName,
        originalDate: activeToken.date,
        originalTime: activeToken.timeSlot,
        cancelledAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: 'Cancelled by patient request',
        patientName: activeToken.patientName
      };

      const updated = [cancelledItem, ...cancelledList];
      setCancelledList(updated);
      try {
        localStorage.setItem(`medisync_cancelled_${currentHospital.id}`, JSON.stringify(updated));
      } catch {}
    }

    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
    setActiveToken(null);
    setShowBookingCelebration(false);
    setActiveSection('appointments');
    setAppointmentSubTab('cancelled');
    onSelectTab?.('appointments');
  };

  // Book Follow-up Consultation from History
  const handleBookFollowup = (item: PastHospitalAppointment) => {
    setDepartment(item.department);
    setDoctorName(item.doctorName);
    setActiveToken(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
    setAppointmentSubTab('upcoming');
  };

  // Re-book from Cancelled appointment record
  const handleRebookFromCancelled = (item: CancelledAppointmentRecord) => {
    setDepartment(item.department);
    setDoctorName(item.doctorName);
    setActiveToken(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
    setAppointmentSubTab('upcoming');
  };

  // Navigate to Appointments view (Book OPD)
  const handleGoToAppointments = () => {
    setActiveSection('appointments');
    onSelectTab?.('appointments');
    setTimeout(() => {
      appointmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Navigate to Live Queue view
  const handleGoToQueue = () => {
    setActiveSection('queue');
    onSelectTab?.('queue');
    setTimeout(() => {
      queueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Navigate to Bed Management view (4th module)
  const handleGoToBeds = () => {
    setActiveSection('beds');
    onSelectTab?.('beds');
    setTimeout(() => {
      bedsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // ============================================================
  // QUEUE NOTIFICATIONS & SIMULATION HANDLERS (IMAGES 1 & 2)
  // ============================================================
  const triggerQueueNotification = (
    type: 'approaching' | 'called' | 'delayed' | 'paused' | 'completed' | 'info',
    title: string,
    message: string,
    tag: string
  ) => {
    const newNotif: QueueNotificationItem = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      tag
    };
    setQueueNotifications(prev => [newNotif, ...prev]);
    setLatestQueueAlert(newNotif);
    setTimeout(() => {
      setLatestQueueAlert(curr => (curr?.id === newNotif.id ? null : curr));
    }, 8000);
  };

  // 1. Advance Queue: Token called / position update (Feature 7 & Notification 1, 2)
  const handleCallNextToken = () => {
    if (!activeToken) return;

    const currentPos = activeToken.queuePosition;
    if (currentPos <= 0) {
      handleCompleteConsultation();
      return;
    }

    const nextPos = currentPos - 1;
    const servingNum = parseInt(activeToken.currentServingToken.replace(/[^0-9]/g, '') || '21', 10) + 1;
    const nextServingToken = `C-${String(servingNum).padStart(3, '0')}`;
    const nextWait = Math.max(0, nextPos * 5);

    const updatedToken: ActiveOPDToken = {
      ...activeToken,
      queuePosition: nextPos,
      currentServingToken: nextPos === 0 ? activeToken.tokenNumber : nextServingToken,
      estimatedWaitMinutes: nextWait,
      status: nextPos === 0 ? 'Called' : 'In Queue'
    };

    setActiveToken(updatedToken);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(updatedToken));
    } catch {}

    if (nextPos === 1) {
      setPatientCurrentStage(3);
      triggerQueueNotification(
        'approaching',
        '🔔 Your turn is approaching',
        `Few patients remaining! You are now #1 in line. Please move outside ${activeToken.counterNumber}.`,
        'Urgent Notice'
      );
    } else if (nextPos === 0) {
      setPatientCurrentStage(4);
      triggerQueueNotification(
        'called',
        '🔔 Your token is called',
        `Doctor / Counter has called your token #${activeToken.tokenNumber}! Please enter consultation chamber now.`,
        'Now Calling'
      );
    } else {
      triggerQueueNotification(
        'info',
        `Now Serving ${nextServingToken}`,
        `Queue moved forward. Your updated position is #${nextPos} in line (~${nextWait}m wait).`,
        'Position Updated'
      );
    }
  };

  // 2. Pause / Resume Queue (Notification 4)
  const handleToggleQueuePause = () => {
    if (queueOperationalStatus === 'paused') {
      setQueueOperationalStatus('running');
      triggerQueueNotification(
        'info',
        '🟢 Queue Resumed',
        'Doctor has resumed OPD consultations. Live token calls are actively in progress.',
        'Queue Active'
      );
    } else {
      setQueueOperationalStatus('paused');
      triggerQueueNotification(
        'paused',
        '🔔 Queue paused',
        'Doctor temporarily unavailable due to emergency triage assessment. Expected resumption shortly.',
        'Temporary Pause'
      );
    }
  };

  // 3. Queue Delayed (Notification 3)
  const handleSimulateDelay = () => {
    setQueueOperationalStatus('delayed');
    if (activeToken) {
      const updatedWait = activeToken.estimatedWaitMinutes + 10;
      const updatedToken = { ...activeToken, estimatedWaitMinutes: updatedWait };
      setActiveToken(updatedToken);
      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(updatedToken));
      } catch {}
    }
    triggerQueueNotification(
      'delayed',
      '🔔 Queue delayed',
      'Waiting time increased by ~10 minutes due to acute emergency patient evaluation. Thank you for your patience.',
      'Schedule Delayed'
    );
  };

  // 4. Consultation Completed (Notification 5)
  const handleCompleteConsultation = () => {
    setPatientCurrentStage(5);
    if (activeToken) {
      const updatedToken: ActiveOPDToken = {
        ...activeToken,
        queuePosition: 0,
        estimatedWaitMinutes: 0,
        status: 'Completed'
      };
      setActiveToken(updatedToken);
      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(updatedToken));
      } catch {}
    }
    triggerQueueNotification(
      'completed',
      '🔔 Consultation completed',
      `Consultation process with ${activeToken?.doctorName || 'Doctor'} finished! Please proceed to Counter 8 for CMCHIS free pharmacy dispensation.`,
      'Visit Concluded'
    );
  };

  // 5. Reset Queue to initial testing state
  const handleResetQueue = () => {
    setQueueOperationalStatus('running');
    setPatientCurrentStage(3);
    if (activeToken) {
      const resetToken: ActiveOPDToken = {
        ...activeToken,
        queuePosition: 3,
        currentServingToken: 'C-021',
        estimatedWaitMinutes: 14,
        status: 'In Queue'
      };
      setActiveToken(resetToken);
      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(resetToken));
      } catch {}
    }
    triggerQueueNotification(
      'info',
      'Queue Telemetry Reset',
      'Queue position reset to #3 in line (~14m wait) for testing simulation.',
      'Reset Complete'
    );
  };

  // Pre-fill doctor from Doctor directory and navigate to Appointments booking
  const handleSelectDoctorFromDirectory = (doc: typeof doctorsList[0]) => {
    setDoctorName(doc.name);
    setDepartment(doc.department);
    setActiveSection('appointments');
    onSelectTab?.('appointments');
    setTimeout(() => {
      appointmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className="space-y-6">

      {/* 
        ============================================================
        OVERVIEW SECTION (MATCHING USER REFERENCE DESIGN)
        Visible ONLY when activeSection === 'overview'
        Contains:
        1. Clean Light Hero Banner with Live Animated Doctor
        2. Sub-Portal Section Tabs (Overview, Book OPD, Queue, etc.)
        3. Real-Time Telemetry & 4 Metric Cards
        4. Central Action Row (Book OPD card + Resource Finder)
        5. Bottom Row (Upcoming Appointments + My OPD Token + Notifications)
        ============================================================
      */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 
            ============================================================
            1. CLEAN LIGHT HERO BANNER (MATCHING USER REFERENCE DESIGN)
            "Welcome to [Hospital Name]!"
            With "Stay Healthy Stay Safe" and 3D Doctor Illustration
            ============================================================
          */}
          <div className="bg-gradient-to-r from-[#FFF5EC] via-[#FFF0E4] to-[#FFE7D4] text-slate-800 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden border border-orange-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Concentric curved warm ribbons in background matching reference image */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none overflow-hidden select-none -z-0">
              <div className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full border-[45px] border-orange-200/30" />
              <div className="absolute -right-8 -top-8 w-[420px] h-[420px] rounded-full border-[35px] border-orange-300/25" />
              <div className="absolute 4 4 w-[340px] h-[340px] rounded-full border-[25px] border-amber-200/20" />
            </div>

            {/* Left Side: Welcome Text & In-Banner Search */}
            <div className="flex-1 max-w-xl z-10">
              
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Welcome to <span className="text-[#EA580C]">{currentHospital.name}</span>! 👋
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-5">
                Your health, our priority. Find hospitals, check resources and manage your appointments easily.
              </p>

              {/* Search Bar inside Hero Banner */}
              <div className="flex items-center bg-white rounded-full p-1.5 pl-4 border border-orange-200 shadow-xs max-w-lg">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input 
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder="Search hospitals, departments or resources..."
                  className="w-full text-xs text-slate-800 bg-transparent outline-none font-medium placeholder-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveSection('facilities');
                    }
                  }}
                />
                <button 
                  onClick={() => setActiveSection('facilities')}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>

              {/* District & 24x7 Helpline Subtext */}
              <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium mt-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>{currentHospital.location}, {currentHospital.districtName}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>24x7 Helpline: <strong>{currentHospital.emergencyContact}</strong></span>
                </span>
              </div>

            </div>

            {/* Right Side: Stay Healthy Stay Happy + 3D Animated Doctor Character */}
            <div className="relative shrink-0 flex items-center justify-end z-10 -my-6 sm:-my-8 md:-my-12 group">
              {/* Subtle Ambient Warm Peach/Orange Pulse Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

              {/* Decorative "Stay Healthy Stay Happy" Text with Sparkles */}
              <div className="hidden xl:flex flex-col items-end mr-2 select-none pointer-events-none z-10">
                <div className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold animate-pulse">
                  <span>✦</span>
                  <span className="font-serif italic text-sm text-orange-600/90 tracking-wide font-bold">Stay Healthy</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-serif italic text-base font-extrabold tracking-wide text-orange-700/90 -mt-1">
                  <span>Stay Happy</span>
                  <span className="text-xs">✨</span>
                </div>
              </div>

              {/* Animated Doctor Character Container - Large, Crystal-Clear & Clickable */}
              <div 
                onClick={() => setShowDoctorModal(true)}
                className="relative cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group/doc"
                title="Click Dr. MediSync to Book OPD, Check Queue or Bed Status!"
              >
                {/* Floating Interactive Speech Bubble - Prompts Patient to Click for OPD */}
                <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg border border-orange-200/90 flex items-center gap-2 transition-transform z-20 group-hover/doc:scale-110 whitespace-nowrap animate-bounce duration-1000">
                  <span className="text-sm">👋</span>
                  <div className="text-left">
                    <div className="text-[11px] font-black text-slate-900 flex items-center gap-1.5 leading-tight">
                      <span>Need Consultation?</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <div className="text-[10px] text-[#EA580C] font-extrabold flex items-center gap-1 leading-tight">
                      <span>Click me to Book OPD Token</span>
                      <span className="text-xs transition-transform group-hover/doc:translate-x-0.5">→</span>
                    </div>
                  </div>
                  {/* Speech bubble tail pointer */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-orange-200/90 rotate-45" />
                </div>

                {/* Crystal-Clear 3D Animated Doctor Character */}
                <picture>
                  <source type="image/webp" srcSet="/doctor-thumbs-up.webp" />
                  <img 
                    src="/doctor-thumbs-up.gif" 
                    alt="Dr. Friendly - MediSync AI Care Guide" 
                    className="h-56 sm:h-64 md:h-76 lg:h-84 w-auto object-contain select-none drop-shadow-xl"
                  />
                </picture>

                {/* Interactive Live Floating Badge */}
                <div className="absolute top-6 sm:top-8 -right-1 sm:right-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-orange-200 flex items-center gap-1.5 text-[10px] font-extrabold text-[#EA580C] select-none shadow-orange-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>24x7 Live Care</span>
                </div>
              </div>

            </div>

          </div>

          {/* 
            ============================================================
            2. SUB-PORTAL SECTION TABS
            ============================================================
          */}
          <div className="bg-white p-1.5 rounded-2xl border border-orange-100 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            
            {/* 1. Dashboard Overview */}
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 font-black"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard Overview</span>
            </button>

            {/* 2. Appointments / Book OPD */}
            <button
              onClick={handleGoToAppointments}
              className="flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>
                {activeToken ? `My Appointments (${activeToken.tokenNumber})` : 'My Appointments'}
              </span>
              {activeToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            {/* 3. OPD Queue Status */}
            <button
              onClick={handleGoToQueue}
              className="flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>OPD Queue Status</span>
            </button>

            {/* 4. AI Queue Urgency (User-requested 4th module) */}
            <button
              onClick={() => {
                setActiveSection('ai_urgency');
                onSelectTab?.('ai_urgency');
              }}
              className={`flex-1 min-w-[175px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                false
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-black'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>AI Queue Urgency</span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-orange-100 text-orange-800 border border-orange-200">
                AI Triage
              </span>
            </button>

            {/* 5. Bed Management */}
            <button
              onClick={handleGoToBeds}
              className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <Bed className="w-3.5 h-3.5 text-blue-500" />
              <span>Bed Management</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                78 Ready
              </span>
            </button>

            {/* 5. Equipment Availability */}
            <button
              onClick={() => {
                setActiveSection('beds');
                setResourceSubTab('equipment');
                onSelectTab?.('equipment');
              }}
              className="flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              <span>Equipment Availability</span>
            </button>

            {/* 6. Patient Medical Record (User Images 1 & 2 Request) */}
            <button
              onClick={() => {
                setActiveSection('records');
                onSelectTab?.('profile');
              }}
              className="flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Patient Record (மருத்துவம்)</span>
            </button>

            {/* 6. Diagnostics & Lab */}
            <button
              onClick={() => {
                setActiveSection('facilities');
                onSelectTab?.('hospital');
              }}
              className="flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
              <span>Diagnostics &amp; Lab</span>
            </button>

            {/* 7. Blood Bank */}
            <button
              onClick={() => {
                setActiveSection('facilities');
                onSelectTab?.('hospital');
              }}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]"
            >
              <Droplet className="w-3.5 h-3.5 text-rose-500" />
              <span>Blood Bank</span>
            </button>
          </div>
          
          {/* 
            ROW 1: 4 KEY REAL-TIME READINESS METRICS
            Total Beds | ICU Beds | Ventilators | OPD Queue
          */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Total Beds */}
            <div 
              onClick={handleGoToBeds}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group"
              title="Click to view detailed Bed Management & Ward Matrix"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1A56DB] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Bed className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {totalBeds}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Total Beds</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {readyBedsCount} Available
              </span>
            </div>

            {/* 2. ICU Beds */}
            <div className="bg-white p-4.5 rounded-2xl border border-orange-100/60 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {icuBedsCount}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">ICU Beds</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {icuReadyCount} Available
              </span>
            </div>

            {/* 3. Ventilators */}
            <div className="bg-white p-4.5 rounded-2xl border border-orange-100/60 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
                  <Wind className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {ventilatorsCount}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Ventilators</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {ventilatorsReadyCount} Available
              </span>
            </div>

            {/* 4. OPD Queue */}
            <div className="bg-white p-4.5 rounded-2xl border border-orange-100/60 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {activeToken ? '1' : '1'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">OPD Queue</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-orange-500" />
                ~{activeToken ? activeToken.estimatedWaitMinutes : 14} min
              </span>
            </div>

          </div>

          {/* 
            ROW 2: MIDDLE SECTION CARDS MATCHING REFERENCE DESIGN
            1. Your Next Appointment Card (Left)
            2. Hospital Resources Card (Right)
          */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Card 1: Your Next Appointment matching reference layout */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Your Next Appointment</h3>
                  </div>
                  <button 
                    onClick={handleGoToAppointments}
                    className="text-xs font-bold text-[#EA580C] hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activeToken && activeToken.status === 'In Queue' ? (
                  <div 
                    onClick={handleGoToAppointments}
                    className="p-4 rounded-2xl bg-[#FFF8F2] border border-orange-200/80 cursor-pointer hover:border-orange-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center">
                          {activeToken.doctorName.replace(/^Dr\.\s*/, '').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{activeToken.doctorName}</div>
                          <div className="text-[10px] text-slate-500">{activeToken.department}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Token #{activeToken.tokenNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-200/60 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        {activeToken.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        {activeToken.timeSlot}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    {/* Orange Calendar Clock Vector Illustration */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3 shadow-2xs relative">
                      <Calendar className="w-10 h-10 text-[#EA580C]" />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-xs border border-orange-200 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[#EA580C]" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">No Upcoming Appointments</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Book an appointment to consult with a doctor</p>

                    <button
                      onClick={handleGoToAppointments}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Hospital Resources matching reference layout */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-amber-500">⭐</span>
                    <h3 className="text-sm font-bold text-slate-900">Hospital Resources</h3>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Status
                  </span>
                </div>

                {/* 4 Resource Cards in 2x2 grid */}
                <div className="grid grid-cols-2 gap-3 my-2">
                  <div 
                    onClick={handleGoToBeds}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-orange-200 hover:bg-[#FFF9F5] transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Bed className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Beds</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{readyBedsCount} Available</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveSection('beds');
                      setResourceSubTab('equipment');
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-orange-200 hover:bg-[#FFF9F5] transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
                      <Wind className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Ventilators</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{ventilatorsReadyCount} Available</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveSection('facilities')}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-orange-200 hover:bg-[#FFF9F5] transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Accessibility className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Wheelchairs</div>
                      <div className="text-[10px] text-purple-600 font-semibold">16 Available</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveSection('facilities')}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-orange-200 hover:bg-[#FFF9F5] transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Lab Services</div>
                      <div className="text-[10px] text-teal-600 font-semibold">Available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 
        ============================================================
        4. DEDICATED APPOINTMENTS PAGE (Book OPD & My Appointments)
        Visible when activeSection === 'appointments'
        - If NOT booked: Shows OPD Consultation & Token Application Form
        - If BOOKED: Form disappears and "My Appointments" appears!
        ============================================================
      */}
      {activeSection === 'appointments' && (
        <div ref={appointmentsSectionRef} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-orange-100/90 shadow-2xs">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#FFF5ED] text-slate-700 hover:text-[#EA580C] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 group-hover:text-[#EA580C] transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#EA580C] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* 
            ============================================================
            APPOINTMENTS SUB-TABS (MATCHING USER WORKFLOW TABLE)
            1. Upcoming Appointments: Future-la attend panna bookings
            2. Appointment History: Already attend panna past appointments
            3. Cancelled Appointments: Patient cancel pannina bookings
            ============================================================
          */}
          <div className="bg-white p-1.5 rounded-2xl border border-orange-100/90 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
            
            {/* Tab 1: Upcoming Appointments */}
            <button
              onClick={() => setAppointmentSubTab('upcoming')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                appointmentSubTab === 'upcoming'
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 font-extrabold'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming Appointments</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                appointmentSubTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#EA580C]'
              }`}>
                {activeToken ? '1 Active' : '0'}
              </span>
            </button>

            {/* Tab 2: Appointment History */}
            <button
              onClick={() => setAppointmentSubTab('history')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                appointmentSubTab === 'history'
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 font-extrabold'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Appointment History</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                appointmentSubTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {pastHistoryList.length} Visits
              </span>
            </button>

            {/* Tab 3: Cancelled Appointments */}
            <button
              onClick={() => setAppointmentSubTab('cancelled')}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                appointmentSubTab === 'cancelled'
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 font-extrabold'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED]'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled Appointments</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                appointmentSubTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
              }`}>
                {cancelledList.length}
              </span>
            </button>

          </div>

          {/* Reschedule Success Toast Banner */}
          {rescheduleToast && (
            <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-blue-200">OPD Appointment Rescheduled!</div>
                  <div className="text-sm font-bold text-white">{rescheduleToast}</div>
                </div>
              </div>
              <button 
                onClick={() => setRescheduleToast(null)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Celebration Toast banner on newly generated token */}
          {showBookingCelebration && activeToken && (
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-100 flex items-center gap-2">
                    <span>OPD Token Successfully Generated in Appointments!</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 border border-white/20 text-white font-extrabold">
                      Active in Queue
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Your Appointment with Token <strong className="font-mono text-amber-200">#{activeToken.tokenNumber}</strong> is confirmed for {activeToken.doctorName} on {activeToken.date} ({activeToken.timeSlot}).
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBookingCelebration(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 
            ============================================================
            SUB-TAB 1: UPCOMING APPOINTMENTS
            Future-la attend panna bookings & Active consultation pass
            ============================================================
          */}
          {appointmentSubTab === 'upcoming' && (
            <>
              {/* 
                CONDITION 1: USER HAS AN APPOINTMENT RECORD (PENDING, DECLINED OR CONFIRMED)
                The application form is hidden, and the corresponding Pass is shown!
              */}
              {activeToken ? (
                activeToken.status === 'Pending' ? (
                  /* 
                    ============================================================
                    1. PENDING APPROVAL VIEW (மருத்துவமனை ஆய்வில் உள்ளது)
                    Submitted request forwarded directly to current hospital
                    ============================================================
                  */
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Top Status Header */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            Awaiting Hospital Triage Approval (மருத்துவமனை ஆய்வில் உள்ளது)
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                          OPD Consultation Request Submitted
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          முன்பதிவு கோரிக்கை அனுப்பப்பட்டுள்ளது &bull; Forwarded to {currentHospital.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleCancelToken}
                          className="px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancel Request</span>
                        </button>
                      </div>
                    </div>

                    {/* Pending Request Details Card & Hospital Action Simulator */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left 2 Cols: Amber / Gold Pending Pass */}
                      <div className="lg:col-span-2 bg-linear-to-br from-[#78350F] via-[#92400E] to-[#451A03] text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10 border-b border-amber-600/50 pb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-300 animate-spin duration-3000" />
                            <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                              OPD Verification Queue &bull; {currentHospital.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-amber-500/30 px-3 py-1 rounded-full border border-amber-400/40 text-amber-100">
                            Request #{activeToken.requestId || 'REQ-8941'}
                          </span>
                        </div>

                        {/* Center Stage: Under Review Notice */}
                        <div className="relative z-10 text-center py-2 space-y-2">
                          <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                            Requested Doctor &amp; Clinical Slot
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-amber-50">
                            {activeToken.doctorName}
                          </div>
                          <div className="text-sm font-bold text-amber-200">
                            {activeToken.department} &bull; {activeToken.date} ({activeToken.timeSlot})
                          </div>
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 text-amber-100 text-xs font-semibold mt-2 border border-amber-500/30">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>Hospital OPD Triage verifying doctor availability...</span>
                          </div>
                        </div>

                        {/* Patient & Complaint Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-amber-600/50 text-xs relative z-10">
                          <div>
                            <span className="text-amber-300/80 text-[10px] uppercase font-bold block">Patient Name</span>
                            <span className="font-bold text-white text-xs">{activeToken.patientName}</span>
                          </div>
                          <div>
                            <span className="text-amber-300/80 text-[10px] uppercase font-bold block">Age / Gender</span>
                            <span className="font-bold text-white text-xs">{activeToken.patientAgeGender}</span>
                          </div>
                          <div>
                            <span className="text-amber-300/80 text-[10px] uppercase font-bold block">Registered Mobile</span>
                            <span className="font-bold text-white text-xs">{activeToken.patientMobile}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-amber-300/80 text-[10px] uppercase font-bold block">Chief Complaint / Purpose</span>
                            <span className="font-medium text-amber-100 text-xs">{activeToken.purpose}</span>
                          </div>
                        </div>

                        {/* Quick Interactive Hospital Simulator (Requested: hospital pathtu accept panuvaga ila na decline panuvaga) */}
                        <div className="relative z-10 p-3.5 bg-black/35 rounded-2xl border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                              <span>🏥 {currentHospital.name} — OPD Triage Action:</span>
                            </div>
                            <div className="text-[10px] text-amber-300/80">
                              Hospital staff verifies schedule and accepts or declines request.
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={handleAcceptRequest}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept &amp; Issue Token</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowDeclineModal(true)}
                              className="px-3 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Right Col: Timeline & Attender Instructions */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                          <h4 className="text-sm font-black text-slate-900">
                            Request Progress Status
                          </h4>

                          <div className="space-y-4 text-xs">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                                ✓
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">Application Submitted</div>
                                <div className="text-[11px] text-slate-500">Forwarded to {currentHospital.name}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold animate-pulse">
                                ⌛
                              </div>
                              <div>
                                <div className="font-bold text-amber-900">Hospital Triage Review</div>
                                <div className="text-[11px] text-amber-700">Verifying on-duty doctor schedule</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 opacity-50">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 font-bold">
                                3
                              </div>
                              <div>
                                <div className="font-bold text-slate-600">Token Pass Generation</div>
                                <div className="text-[11px] text-slate-400">Assigned upon hospital acceptance</div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>Casualty Helpdesk: {currentHospital.emergencyContact}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Emergency cases do not require an online token. Please directly report to the 24x7 Casualty Triage bay.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : activeToken.status === 'Declined' ? (
                  /* 
                    ============================================================
                    2. DECLINED APPROVAL VIEW (முன்பதிவு நிராகரிக்கப்பட்டது)
                    Shows clear reason provided by the hospital triage
                    ============================================================
                  */
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Top Status Header */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            Appointment Request Declined (முன்பதிவு நிராகரிக்கப்பட்டது)
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                          OPD Consultation Request Declined by {currentHospital.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          முன்பதிவு மருத்துவமனையால் ஏற்றுக்கொள்ளப்படவில்லை &bull; Please see reason below and select another slot
                        </p>
                      </div>

                      <button
                        onClick={handleReapplyBooking}
                        className="px-4 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Book Alternative Slot / Doctor</span>
                      </button>
                    </div>

                    {/* Red / Rose Declined Pass Card */}
                    <div className="bg-linear-to-br from-[#7F1D1D] via-[#991B1B] to-[#450A0A] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden space-y-6">
                      <div className="flex items-center justify-between border-b border-rose-700/60 pb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-300" />
                          <span className="text-xs font-black uppercase tracking-wider text-rose-200">
                            Decline Notice &bull; {currentHospital.name}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-rose-900/60 px-3 py-1 rounded-full border border-rose-400/40 text-rose-100">
                          Request #{activeToken.requestId || 'REQ-8941'}
                        </span>
                      </div>

                      {/* Hospital Decline Reason Callout Box (Exactly what the user asked for!) */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-rose-400/40 space-y-2">
                        <div className="text-[11px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                          <span>⚠️ Hospital Triage Decline Reason (மருத்துவமனை அளித்த காரணம்):</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-rose-50 leading-relaxed">
                          "{activeToken.declineReason || 'Doctor on emergency OT duty / critical resuscitation. Specialty consultation slot fully allocated for this session.'}"
                        </div>
                        <div className="text-xs text-rose-200/90 pt-1">
                          Reviewed and declined by {currentHospital.name} Chief OPD Medical Officer.
                        </div>
                      </div>

                      {/* Previous Requested Booking Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-rose-300/80 text-[10px] uppercase font-bold block">Requested Doctor</span>
                          <span className="font-bold text-white text-xs">{activeToken.doctorName}</span>
                        </div>
                        <div>
                          <span className="text-rose-300/80 text-[10px] uppercase font-bold block">Department</span>
                          <span className="font-bold text-white text-xs">{activeToken.department}</span>
                        </div>
                        <div>
                          <span className="text-rose-300/80 text-[10px] uppercase font-bold block">Requested Date</span>
                          <span className="font-bold text-white text-xs">{activeToken.date}</span>
                        </div>
                        <div>
                          <span className="text-rose-300/80 text-[10px] uppercase font-bold block">Requested Slot</span>
                          <span className="font-bold text-white text-xs">{activeToken.timeSlot}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-4 border-t border-rose-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-rose-200 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-rose-300" />
                          <span>For emergency queries, call hospital directly: <strong>{currentHospital.emergencyContact}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleReapplyBooking}
                            className="px-5 py-2.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Select Alternative Doctor / Time</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* 
                    ============================================================
                    3. CONFIRMED CONSULTATION PASS (In Queue / Approved)
                    ============================================================
                  */
                <div className="space-y-6">
                  
                  {/* Top Navigation & Status Bar */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Confirmed Active Appointment
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                        My Appointments & Consultation Pass
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        உங்கள் மருத்துவ ஆலோசனை முன்பதிவு & டோக்கன் பாஸ் &bull; {currentHospital.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Track Live Queue Button */}
                      <button
                        onClick={handleGoToQueue}
                        className="px-3.5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track Live Queue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Reschedule Appointment Button */}
                      <button
                        onClick={handleOpenReschedule}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                        title="Reschedule appointment date or time slot"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Reschedule</span>
                      </button>

                      {/* Print Slip Button */}
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Print Appointment Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print Slip</span>
                      </button>

                      {/* Cancel Appointment Button */}
                      <button
                        onClick={handleCancelToken}
                        className="px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                        title="Cancel appointment and move to Cancelled archive"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel Appointment</span>
                      </button>
                    </div>
                  </div>

              {/* Confirmed Appointment Card & Token Pass */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Main Appointment Pass */}
                <div className="lg:col-span-2 bg-linear-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0A2568] text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

                  <div>
                    {/* Header Strip */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4 text-cyan-200" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm tracking-wide uppercase text-white">
                            CONFIRMED OPD CONSULTATION PASS
                          </div>
                          <div className="text-[10px] text-blue-200 font-medium">Government Hospital Readiness Network</div>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        CONFIRMED
                      </span>
                    </div>

                    {/* Compact Sleek Token Number Display */}
                    <div className="my-3.5 py-2.5 px-4 rounded-2xl bg-white/10 border border-white/15 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                        Assigned OPD Queue Token
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight mt-0.5 drop-shadow-xs">
                        {activeToken.tokenNumber}
                      </div>
                      <div className="text-xs font-semibold text-emerald-300 mt-0.5">
                        {activeToken.counterNumber}
                      </div>
                    </div>

                    {/* Consultation Dossier Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-blue-100 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Consulting Doctor:</span>
                        <strong className="text-white text-sm">{activeToken.doctorName}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Specialty / Department:</span>
                        <strong className="text-white text-sm">{activeToken.department}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Date & Time Session:</span>
                        <strong className="text-amber-200 text-sm">{activeToken.date} ({activeToken.timeSlot})</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Hospital Node:</span>
                        <strong className="text-white text-sm">{activeToken.hospitalName}</strong>
                      </div>

                      <div className="sm:col-span-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px]">Patient: </span>
                          <strong className="text-white">{activeToken.patientName}</strong> ({activeToken.patientAgeGender})
                        </div>
                        <div className="text-slate-300 font-mono text-[11px]">
                          📱 {activeToken.patientMobile}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-400 text-[11px]">Chief Purpose / Symptoms: </span>
                        <span className="text-blue-100 font-medium">{activeToken.purpose}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification & Action Footer with Reschedule & Cancel Buttons */}
                  <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-blue-200 text-[11px]">
                      <span className="font-mono text-[10px] text-slate-300">
                        PASS-ID: {activeToken.tokenNumber}-SEC-2026
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-emerald-300 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        CMCHIS Free Care
                      </span>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleOpenReschedule}
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 hover:text-slate-900 text-amber-200 border border-amber-300/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        title="Reschedule your appointment"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={handleCancelToken}
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-400/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        title="Cancel active appointment"
                      >
                        <X className="w-3.5 h-3.5 text-rose-200" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Col: Live Queue Status & Quick Actions */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#1A56DB]" />
                        <h3 className="text-sm font-extrabold text-slate-900">Live OPD Queue Status</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Tracking</span>
                      </span>
                    </div>

                    {/* Dual Status Cards: Now Serving vs Your Position */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Now Serving</div>
                        <div className="text-xl sm:text-2xl font-black text-[#1A56DB] font-mono mt-0.5">
                          {activeToken.currentServingToken || 'C-021'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {activeToken.counterNumber}
                        </div>
                      </div>

                      <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200 text-center">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Your Position</div>
                        <div className="text-xl sm:text-2xl font-black text-blue-800 font-mono mt-0.5">
                          #{activeToken.queuePosition} in Line
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          ~{activeToken.estimatedWaitMinutes}m wait
                        </div>
                      </div>
                    </div>

                    {/* Live Status Indicators (Ena ena status nu theliva katanum) */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold">Token Status:</span>
                        </div>
                        <span className="font-mono font-black text-emerald-700">#{activeToken.tokenNumber} (Confirmed)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="font-semibold">Patients Ahead:</span>
                        </div>
                        <span className="font-bold text-slate-900">{Math.max(0, activeToken.queuePosition - 1)} Patients</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-[#1A56DB] shrink-0" />
                          <span className="font-semibold">Duty Doctor:</span>
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[130px]">{activeToken.doctorName}</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-semibold">Consultation Room:</span>
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[130px]">{activeToken.counterNumber}</span>
                      </div>
                    </div>

                  </div>

                  {/* Action Buttons: View Queue Status, Reschedule & Cancel Appointment */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleGoToQueue}
                      className="w-full py-3 px-4 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Clock className="w-4 h-4 text-blue-200" />
                      <span>View Queue Status (வரிசை நிலை காண்க)</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={handleOpenReschedule}
                      className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Reschedule Appointment (தேதி / நேரம் மாற்று)</span>
                    </button>

                    <button
                      onClick={handleCancelToken}
                      className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel Appointment</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
                )
              ) : (
            /* 
              CONDITION 2: USER HAS NOT APPLIED YET -> SHOW APPLICATION FORM IN APPOINTMENTS!
            */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              
              {/* Header of the Form */}
              <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Book OPD Consultation Appointment
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    நேரடி மருத்துவ ஆலோசனை முன்பதிவு & டோக்கன் பெறுதல் &bull; {currentHospital.name}
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  Instant Automatic Token Generation
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleApplyOPD} className="space-y-5">
                
                {/* Row 1: Department & Doctor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. Select Clinical Specialty / Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] bg-white font-semibold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      <option value="Cardiology OPD">Cardiology OPD (Heart, Chest Pain & Vascular)</option>
                      <option value="General Medicine">General Medicine (Fever, Acute Illness & General Review)</option>
                      <option value="Pulmonology Consultation">Pulmonology Consultation (Asthma, Cough & Respiratory)</option>
                      <option value="Orthopedics & Joint Care">Orthopedics & Joint Care (Fracture, Spine & Bone)</option>
                      <option value="Pediatrics OPD">Pediatrics OPD (Child Care & Vaccination)</option>
                      <option value="Emergency & Trauma Bay">Emergency & Trauma Bay (Acute Emergency Intake)</option>
                    </select>
                  </div>

                  {/* Consulting Doctor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. Consulting Duty Physician <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] bg-white font-semibold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      <option value="Dr. Arun Kumar">Dr. Arun Kumar (Interventional Cardiology & Critical Care)</option>
                      <option value="Dr. Sundaramoorthy M.">Dr. Sundaramoorthy M. (General Medicine & Diabetology)</option>
                      <option value="Dr. Meenakshi S.">Dr. Meenakshi S. (Pulmonology Specialist & Asthma Care)</option>
                      <option value="Dr. Priya Dharshini">Dr. Priya Dharshini (Pediatrics & Child Wellness)</option>
                      <option value="Dr. R. Rajeshwaran">Dr. R. Rajeshwaran (Orthopedic Surgeon & Joint Care)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Date & Time Slot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Consultation Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] font-semibold text-slate-800 shadow-2xs"
                      required
                    />
                    {/* Quick Date Pills */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setDate('2026-11-27')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          date === '2026-11-27' ? 'bg-[#1A56DB] text-white border-[#1A56DB]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Today (Nov 27)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDate('2026-11-28')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          date === '2026-11-28' ? 'bg-[#1A56DB] text-white border-[#1A56DB]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Tomorrow (Nov 28)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDate('2026-11-30')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          date === '2026-11-30' ? 'bg-[#1A56DB] text-white border-[#1A56DB]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Monday (Nov 30)
                      </button>
                    </div>
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      4. Preferred OPD Time Session <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] bg-white font-semibold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      <option value="09:00 AM - 10:30 AM">Morning Session (09:00 AM - 10:30 AM)</option>
                      <option value="10:30 AM - 12:00 PM">Late Morning (10:30 AM - 12:00 PM)</option>
                      <option value="12:00 PM - 01:30 PM">Afternoon Slot (12:00 PM - 01:30 PM)</option>
                      <option value="02:30 PM - 04:30 PM">Evening Clinic (02:30 PM - 04:30 PM)</option>
                    </select>

                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Average consultation window: ~15 minutes per token</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Purpose of Visit / Symptoms */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. Purpose of Consultation / Medical Complaint <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Quick Selection Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {commonPurposes.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPurpose(p)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          purpose === p 
                            ? 'bg-blue-100 text-[#1A56DB] border-blue-300 font-bold' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Chest pain with shortness of breath, blood pressure review, etc."
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] font-semibold text-slate-800 shadow-2xs"
                    required
                  />
                </div>

                {/* Row 4: Patient Details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold text-slate-700">6. Patient Verification Details:</div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patient Full Name</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age & Gender</label>
                      <input
                        type="text"
                        value={patientAgeGender}
                        onChange={(e) => setPatientAgeGender(e.target.value)}
                        placeholder="e.g. 28 / Male"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile (SMS Token Updates)</label>
                      <input
                        type="tel"
                        value={patientMobile}
                        onChange={(e) => setPatientMobile(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Free consultation & token slip verified under CMCHIS</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1A56DB] hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <Ticket className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                    <span>Submit Application & Generate OPD Token</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </form>

            </div>
          )}
        </>
      )}

      {/* 
        ============================================================
        SUB-TAB 2: APPOINTMENT HISTORY
        Already attend panna past appointments at THIS hospital
        ("antha hospitalaye ithuku munadi vanthu pathurukagala nudrathu")
        ============================================================
      */}
      {appointmentSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Verified Patient Medical History
                </span>
                <span className="text-xs text-slate-400 font-medium">இம்மருத்துவமனை வருகைப் பதிவுகள்</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Consultation History at {currentHospital.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                இந்த மருத்துவமனையில் நீங்கள் இதற்கு முன் பெற்ற சிகிச்சை, மருத்துவர் ஆலோசனை & மருந்துகள் விவரம்
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Visits</div>
                <div className="text-xl font-black text-[#1A56DB]">{pastHistoryList.length} Completed</div>
              </div>

              <button
                onClick={() => setAppointmentSubTab('upcoming')}
                className="px-4 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book New OPD</span>
              </button>
            </div>
          </div>

          {/* Past Visits List */}
          {pastHistoryList.length > 0 ? (
            <div className="space-y-4">
              {pastHistoryList.map((visit) => (
                <div 
                  key={visit.id} 
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#1A56DB] font-mono font-black text-xs border border-blue-200">
                        {visit.tokenNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{visit.date}</span>
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{visit.timeSlot}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {visit.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Completed Visit
                      </span>
                    </div>
                  </div>

                  {/* Doctor & Room Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Attending Doctor:</span>
                      <strong className="text-slate-900 font-extrabold text-sm">{visit.doctorName}</strong>
                      <span className="text-[11px] text-slate-500 block">{visit.doctorQualification}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">OPD Room / Chamber:</span>
                      <strong className="text-slate-800 font-bold">{visit.room}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Hospital Facility:</span>
                      <strong className="text-slate-800 font-bold">{currentHospital.name}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Patient Registered:</span>
                      <strong className="text-slate-800 font-bold">{patientName} ({patientAgeGender})</strong>
                    </div>
                  </div>

                  {/* Clinical Dossier */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Complaint & Diagnosis */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Chief Complaint / Symptoms:</span>
                        <p className="text-slate-800 font-medium mt-0.5">{visit.complaint}</p>
                      </div>
                      <div className="pt-2 border-t border-blue-100/80">
                        <span className="text-[10px] font-bold uppercase text-blue-600 block">Clinical Assessment & Diagnosis:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{visit.diagnosis}</p>
                      </div>
                    </div>

                    {/* Prescriptions */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Prescribed Medicines:</span>
                      </span>
                      <div className="space-y-1 mt-1">
                        {visit.prescriptions.map((med, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{med}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Doctor's Advice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold">Physician Advice & Plan: </span>
                      <span className="font-medium">{visit.doctorAdvice}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setSelectedPastVisit(visit)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Full Clinical Record (மருத்துவ அறிக்கை)</span>
                    </button>

                    <button
                      onClick={() => handleBookFollowup(visit)}
                      className="px-4 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                      <span>Book Follow-up Consultation with {visit.doctorName}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No Past Consultations Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have not attended any OPD consultations at {currentHospital.name} yet. Book your first appointment to build your health record.
              </p>
              <button
                onClick={() => setAppointmentSubTab('upcoming')}
                className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Book First Consultation
              </button>
            </div>
          )}

        </div>
      )}
        </div>
      )}

      {/* 
        ============================================================
        5. DEDICATED OPD QUEUE STATUS VIEW
        Visible when activeSection === 'queue'
        ============================================================
      */}
      {activeSection === 'queue' && (
        <div ref={queueSectionRef} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#1A56DB] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          
          {activeToken ? (
            <div className="space-y-6">
              
              {/* 
                ============================================================
                IMAGE 2: LIVE QUEUE NOTIFICATION TOAST BANNER
                Displays real-time queue update notification triggers:
                - Your turn is approaching
                - Your token is called
                - Queue delayed
                - Queue paused
                - Consultation completed
                ============================================================
              */}
              {latestQueueAlert && (
                <div className={`p-4 sm:p-5 rounded-3xl shadow-lg text-white flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 ${
                  latestQueueAlert.type === 'called'
                    ? 'bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700'
                    : latestQueueAlert.type === 'approaching'
                    ? 'bg-linear-to-r from-amber-600 via-orange-600 to-amber-700'
                    : latestQueueAlert.type === 'delayed'
                    ? 'bg-linear-to-r from-purple-600 via-indigo-600 to-purple-700'
                    : latestQueueAlert.type === 'paused'
                    ? 'bg-linear-to-r from-rose-600 via-red-600 to-rose-700'
                    : 'bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shrink-0 relative">
                      <BellRing className="w-5 h-5 text-white animate-bounce" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-white/90 flex items-center gap-2">
                        <span>{latestQueueAlert.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 font-extrabold">
                          {latestQueueAlert.tag}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {latestQueueAlert.message}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setLatestQueueAlert(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Main Queue Management Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                
                {/* 
                  1. LIVE QUEUE STATUS HEADER (IMAGE 1: FEATURE 1)
                  Shows if Queue is currently Running, Paused, or Delayed
                */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Live Queue Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        queueOperationalStatus === 'running'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : queueOperationalStatus === 'paused'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          queueOperationalStatus === 'running'
                            ? 'bg-emerald-500 animate-pulse'
                            : queueOperationalStatus === 'paused'
                            ? 'bg-rose-500'
                            : 'bg-amber-500 animate-ping'
                        }`} />
                        <span>
                          {queueOperationalStatus === 'running'
                            ? 'Live Queue Running (வரிசை சீராக இயங்குகிறது)'
                            : queueOperationalStatus === 'paused'
                            ? 'Queue Paused (தற்காலிகமாக நிறுத்தப்பட்டுள்ளது)'
                            : 'Queue Delayed (வரிசை தாமதமாகிறது)'}
                        </span>
                      </span>

                      <span className="text-xs text-slate-400 font-medium">Auto-synced</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                      OPD Queue Status & Live Telemetry
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      நேரடி வரிசை நிலை & காத்திருப்பு விவரங்கள் &bull; {currentHospital.name} &bull; {activeToken.counterNumber}
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={handleGoToAppointments}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-[#1A56DB] font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>View Appointment Pass</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Print Queue Token Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Print Slip</span>
                    </button>

                    <button
                      onClick={handleCancelToken}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Cancel Appointment"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>

                {/* 
                  ============================================================
                  IMAGE 1: 6 CORE TELEMETRY METRIC CARDS
                  1. Live Queue Status
                  2. Now Serving
                  3. Your Token
                  4. Your Position
                  5. Patients Ahead
                  6. Estimated Waiting Time
                  ============================================================
                */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Metric 1: Live Queue Status */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Queue Status</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          queueOperationalStatus === 'running' ? 'bg-emerald-500 animate-pulse' : queueOperationalStatus === 'paused' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-sm font-black text-slate-900 truncate">
                          {queueOperationalStatus === 'running' ? 'Running' : queueOperationalStatus === 'paused' ? 'Paused' : 'Delayed'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 truncate">
                      {queueOperationalStatus === 'running' ? '🟢 Normal flow' : queueOperationalStatus === 'paused' ? '⏸️ Doc standby' : '⏳ +10m added'}
                    </div>
                  </div>

                  {/* Metric 2: Now Serving */}
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">2. Now Serving</div>
                      <div className="text-2xl font-black text-[#1A56DB] font-mono mt-0.5 tracking-tight">
                        {activeToken.currentServingToken || 'C-021'}
                      </div>
                    </div>
                    <div className="text-[10px] text-blue-800 font-semibold truncate mt-2">
                      Inside with Doctor
                    </div>
                  </div>

                  {/* Metric 3: Your Token */}
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">3. Your Token</div>
                      <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono mt-0.5 tracking-tight truncate">
                        {activeToken.tokenNumber}
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-900 font-semibold truncate mt-2">
                      {activeToken.patientName}
                    </div>
                  </div>

                  {/* Metric 4: Your Position */}
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">4. Your Position</div>
                      <div className="text-2xl font-black text-indigo-900 font-mono mt-0.5">
                        {activeToken.queuePosition === 0 ? 'CALLED' : `#${activeToken.queuePosition} in Line`}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold truncate mt-2 text-indigo-700">
                      {activeToken.queuePosition === 0 ? '🔊 Inside Room' : activeToken.queuePosition === 1 ? '⚡ Next Up!' : 'In Waiting Batch'}
                    </div>
                  </div>

                  {/* Metric 5: Patients Ahead */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">5. Patients Ahead</div>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                        {Math.max(0, activeToken.queuePosition - 1)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-2">
                      {Math.max(0, activeToken.queuePosition - 1) === 0 ? 'No patients ahead!' : 'Waiting ahead'}
                    </div>
                  </div>

                  {/* Metric 6: Estimated Waiting Time */}
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">6. Estimated Wait</div>
                      <div className="text-2xl font-black text-emerald-800 font-mono mt-0.5">
                        ~{activeToken.estimatedWaitMinutes}m
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold truncate mt-2">
                      ~5m per consultation
                    </div>
                  </div>

                </div>

                {/* 
                  ============================================================
                  IMAGE 1: FEATURE 7 - QUEUE PROGRESS VISUALIZER
                  Token call aagumbodhu patient position update aaganum
                  ============================================================
                */}
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1A56DB]" />
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        7. Live Queue Lane Progression (வரிசை நகர்வு முன்னேற்றம்)
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[#1A56DB]">
                      Position #{activeToken.queuePosition} &bull; ~{activeToken.estimatedWaitMinutes} mins remaining
                    </span>
                  </div>

                  {/* Horizontal Sequential Queue Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center text-xs">
                    
                    {/* Station 1: Serving */}
                    <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase text-blue-600 block">Now with Doctor 🩺</span>
                      <strong className="text-sm font-mono font-black text-slate-900 block mt-0.5">
                        {activeToken.currentServingToken}
                      </strong>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">In Room 104</span>
                    </div>

                    {/* Station 2 */}
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs opacity-80">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Waiting Hall 🪑</span>
                      <strong className="text-sm font-mono font-bold text-slate-700 block mt-0.5">
                        C-022
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Triage Done</span>
                    </div>

                    {/* Station 3 */}
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs opacity-80">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Doorstep 🚪</span>
                      <strong className="text-sm font-mono font-bold text-slate-700 block mt-0.5">
                        C-023
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Ready to enter</span>
                    </div>

                    {/* Station 4: YOUR TOKEN */}
                    <div className={`p-3 rounded-2xl border-2 shadow-sm transition-all ${
                      activeToken.queuePosition === 0
                        ? 'bg-emerald-50 border-emerald-500 scale-105'
                        : activeToken.queuePosition === 1
                        ? 'bg-amber-50 border-amber-400 scale-105'
                        : 'bg-blue-50 border-[#1A56DB]'
                    }`}>
                      <span className="text-[9px] font-black uppercase text-[#1A56DB] flex items-center justify-center gap-1">
                        <span>YOUR TOKEN ⭐</span>
                      </span>
                      <strong className="text-sm font-mono font-black text-slate-900 block mt-0.5">
                        {activeToken.tokenNumber}
                      </strong>
                      <span className="text-[10px] font-extrabold text-[#1A56DB] block mt-0.5">
                        {activeToken.queuePosition === 0 ? '🔊 Called Now!' : activeToken.queuePosition === 1 ? '⚡ Next in Line!' : `#${activeToken.queuePosition} in Line`}
                      </span>
                    </div>

                    {/* Station 5 */}
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs opacity-60">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Behind You</span>
                      <strong className="text-sm font-mono font-bold text-slate-600 block mt-0.5">
                        C-025
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">In Queue</span>
                    </div>

                  </div>

                  {/* Progress Line */}
                  <div className="pt-1">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.max(20, Math.min(100, Math.round(((4 - activeToken.queuePosition) / 4) * 100)))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 
                  ============================================================
                  IMAGE 1: FEATURE 8 - CURRENT STAGE TRACKER
                  Patient ippo endha stage-la irukanga
                  ============================================================
                */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-700">
                      8. Patient Current Stage (நோயாளி தற்போது இருக்கும் நிலை):
                    </div>
                    <span className="text-[11px] font-extrabold text-[#1A56DB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Stage {patientCurrentStage} of 5 Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Stage 1 */}
                    <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl border transition-all ${
                      patientCurrentStage >= 1
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                    }`}>
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-900">1. Token Issued</strong>
                        <span className="text-[10px] text-emerald-700">Pass Confirmed</span>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl border transition-all ${
                      patientCurrentStage >= 2
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                    }`}>
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-900">2. Triage Cleared</strong>
                        <span className="text-[10px] text-emerald-700">Vitals Recorded</span>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl border transition-all ${
                      patientCurrentStage === 3
                        ? 'bg-blue-50 border-[#1A56DB] text-blue-900 shadow-xs ring-2 ring-blue-200'
                        : patientCurrentStage > 3
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        patientCurrentStage === 3
                          ? 'bg-[#1A56DB] text-white animate-pulse'
                          : patientCurrentStage > 3
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {patientCurrentStage > 3 ? '✓' : '3'}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-900">3. In Queue Line</strong>
                        <span className="text-[10px] text-[#1A56DB] font-extrabold">
                          {patientCurrentStage === 3 ? 'Current Stage' : 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Stage 4 */}
                    <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl border transition-all ${
                      patientCurrentStage === 4
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs ring-2 ring-amber-200'
                        : patientCurrentStage > 4
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        patientCurrentStage === 4
                          ? 'bg-amber-500 text-white animate-bounce'
                          : patientCurrentStage > 4
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {patientCurrentStage > 4 ? '✓' : '4'}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-900">4. Doctor Review</strong>
                        <span className="text-[10px] text-amber-800 font-extrabold">
                          {patientCurrentStage === 4 ? 'Now Consulting!' : 'Room 104'}
                        </span>
                      </div>
                    </div>

                    {/* Stage 5 */}
                    <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl border transition-all ${
                      patientCurrentStage === 5
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        patientCurrentStage === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {patientCurrentStage === 5 ? '✓' : '5'}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-900">5. Pharmacy & Exit</strong>
                        <span className="text-[10px] text-emerald-700">
                          {patientCurrentStage === 5 ? 'Dispensary Bay' : 'Counter 8'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 
                  ============================================================
                  IMAGE 2: 3. QUEUE NOTIFICATIONS PANEL
                  Live list of all 5 queue notifications:
                  1. Your turn is approaching - Few patients remaining.
                  2. Your token is called - Doctor/counter patient-ai call pannitaanga.
                  3. Queue delayed - Waiting time increase aana.
                  4. Queue paused - Doctor temporarily unavailable.
                  5. Consultation completed - Consultation process finish aachu.
                  ============================================================
                */}
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Live Queue Notifications (வரிசை அறிவிப்புகள்)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#1A56DB]">
                        {queueNotifications.length} Alerts
                      </span>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setNotificationFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                          notificationFilter === 'all' ? 'bg-[#1A56DB] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Alerts ({queueNotifications.length})
                      </button>
                      <button
                        onClick={() => setNotificationFilter('unread')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                          notificationFilter === 'unread' ? 'bg-[#1A56DB] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Unread ({queueNotifications.filter(n => !n.read).length})
                      </button>
                    </div>
                  </div>

                  {/* Notifications Stream */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {queueNotifications
                      .filter(n => (notificationFilter === 'unread' ? !n.read : true))
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 transition-all ${
                            item.type === 'called'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                              : item.type === 'approaching'
                              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                              : item.type === 'delayed'
                              ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                              : item.type === 'paused'
                              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-base shrink-0 mt-0.5">
                              {item.type === 'called' ? '📢' : item.type === 'approaching' ? '🔔' : item.type === 'delayed' ? '⏳' : item.type === 'paused' ? '⏸️' : item.type === 'completed' ? '✅' : 'ℹ️'}
                            </span>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-2">
                                <span>{item.title}</span>
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                                  item.type === 'called' ? 'bg-emerald-200 text-emerald-900' : item.type === 'approaching' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {item.tag}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">
                                {item.message}
                              </p>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                            {item.timestamp}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 
                  ============================================================
                  INTERACTIVE QUEUE SIMULATOR & TESTING ACTION BAR
                  Allows the user to easily trigger all 5 notification conditions:
                  1. Advance queue (calls next token, triggers approaching/called)
                  2. Pause / Resume queue (triggers queue paused)
                  3. Simulate delay (triggers queue delayed)
                  4. Complete consultation (triggers consultation completed)
                  5. Reset queue
                  ============================================================
                */}
                <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                        Interactive Live Queue Testing & Simulation Bar
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300">
                      Click buttons below to test each live notification & status!
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {/* 1. Call Next Token */}
                    <button
                      onClick={handleCallNextToken}
                      className="py-2.5 px-3 rounded-xl bg-[#1A56DB] hover:bg-blue-600 text-white font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      title="Advance Queue (Decrements position & triggers Approaching / Called notifications)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Call Next Token</span>
                    </button>

                    {/* 2. Pause / Resume Queue */}
                    <button
                      onClick={handleToggleQueuePause}
                      className={`py-2.5 px-3 rounded-xl font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        queueOperationalStatus === 'paused'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600/30 hover:bg-rose-600 border border-rose-400 text-rose-200 hover:text-white'
                      }`}
                      title="Pause or Resume Queue"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{queueOperationalStatus === 'paused' ? 'Resume Queue' : 'Pause Queue'}</span>
                    </button>

                    {/* 3. Simulate Delay */}
                    <button
                      onClick={handleSimulateDelay}
                      className="py-2.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-400 text-purple-200 hover:text-white font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      title="Simulate Queue Delay (+10m waiting time notification)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Queue Delay (+10m)</span>
                    </button>

                    {/* 4. Complete Consultation */}
                    <button
                      onClick={handleCompleteConsultation}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-400 text-emerald-200 hover:text-white font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      title="Mark consultation completed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Visit</span>
                    </button>

                    {/* 5. Reset Queue */}
                    <button
                      onClick={handleResetQueue}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      title="Reset simulation to initial state"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Queue</span>
                    </button>
                  </div>
                </div>

                {/* Attender Notice */}
                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#1A56DB] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Queue Attender Notice:</strong> Patient tokens are called via public display counter speakers and SMS. Please keep your Token Slip ready when approaching <strong>{activeToken.counterNumber}</strong>. Free consultation is verified under CMCHIS.
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* EMPTY QUEUE STATE */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-slate-900">
                No Active OPD Queue Token for Today
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                You do not have a queue token in progress at {currentHospital.name}. Please book an OPD appointment first to automatically generate your live consultation token.
              </p>

              <div className="pt-2">
                <button
                  onClick={handleGoToAppointments}
                  className="px-6 py-3.5 rounded-2xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>+ Book OPD Appointment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 
            ============================================================
            EQUIPMENT CONTACT / ENQUIRY MODAL (Image 1 Requirement)
            "patient-ku equipment list matum ka... contact / enquiry matum kodukalam"
            ============================================================
          */}
          {selectedEquipmentForEnquiry && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Equipment Contact &amp; Enquiry
                      </h3>
                      <div className="text-xs text-slate-500">
                        மருத்துவ உபகரண உதவி &bull; {currentHospital.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedEquipmentForEnquiry(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Equipment Snapshot Card */}
                <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedEquipmentForEnquiry.name}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedEquipmentForEnquiry.available} Available Now
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed">
                    {selectedEquipmentForEnquiry.description}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-blue-100/80 text-[11px] text-slate-500">
                    <span>Category: <strong>{selectedEquipmentForEnquiry.categoryLabel}</strong></span>
                    <span>Location: <strong>{selectedEquipmentForEnquiry.location}</strong></span>
                  </div>
                </div>

                {/* Patient Information (Pre-filled) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Patient / Enquirer Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Karthik Subramanian (28 / Male)"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Contact Mobile
                      </label>
                      <input
                        type="text"
                        defaultValue="+91 98401 22345"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Urgency Level (முன்னுரிமை)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Immediate', label: '🚨 Immediate Need' },
                        { id: 'Routine', label: '🏥 In-Patient Care' },
                        { id: 'Transfer', label: '🚑 Transport Aid' }
                      ].map(urg => (
                        <button
                          key={urg.id}
                          type="button"
                          onClick={() => setEquipmentUrgency(urg.id as any)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                            equipmentUrgency === urg.id
                              ? 'bg-[#1A56DB] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {urg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Clinical Specialty / Target Ward
                    </label>
                    <select
                      value={equipmentDepartment}
                      onChange={(e) => setEquipmentDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Critical Care ICU">Critical Care ICU</option>
                      <option value="Trauma & Emergency">Trauma &amp; Emergency Casualty</option>
                      <option value="General Ward (Block B)">General Ward (Floor 1)</option>
                      <option value="Pulmonology Ward">Pulmonology &amp; Respiratory Care</option>
                      <option value="Cardiology Care Unit">Cardiology Care Unit (CCU)</option>
                      <option value="Pediatrics Ward">Pediatrics &amp; Neonatal Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Specific Medical Note or Attender Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={equipmentNotes}
                      onChange={(e) => setEquipmentNotes(e.target.value)}
                      placeholder="e.g. Patient requires oxygen support during transfer, or requesting wheelchair at gate..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Direct Biomedical Helpline Option */}
                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold block">Biomedical Engineering Desk:</span>
                      <span className="text-[11px] text-amber-800 font-medium">Casualty Direct Line: {currentHospital.emergencyContact} (Ext: 204)</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${currentHospital.emergencyContact}`}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Call Desk</span>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEquipmentForEnquiry(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEquipmentEnquirySuccess(`Enquiry for ${selectedEquipmentForEnquiry.name} submitted to ${equipmentDepartment} triage desk. Attender assistance confirmed.`);
                      setSelectedEquipmentForEnquiry(null);
                      setEquipmentNotes('');
                      setTimeout(() => setEquipmentEnquirySuccess(null), 6000);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Enquiry (உபகரண உதவி கோரிக்கை)</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 
        ============================================================
        AI-POWERED PATIENT PRIORITY & QUEUE URGENCY MODULE
        Visible when activeSection === 'ai_urgency'
        ============================================================
      */}
      {activeSection === 'ai_urgency' && (
        <AIQueueUrgencyModule
          hospitalName={currentHospital.name}
          hospitalId={currentHospital.id}
          patientName="Karthik Subramanian"
          patientId="usr-patient-demo"
          onBackToOverview={() => {
            setActiveSection('overview');
            onSelectTab?.('dashboard');
          }}
          onBookWithUrgency={(ass) => {
            triggerQueueNotification(
              'info',
              `AI Priority Assigned: ${ass.ai_priority}`,
              `Your consultation request has been prioritized with ${ass.ai_priority} triage recommendation.`,
              'AI Triage'
            );
          }}
        />
      )}

      {/* 
        ============================================================
        4. DEDICATED BED MANAGEMENT & WARD MATRIX VIEW
        Visible when activeSection === 'beds'
        (Images 1, 2, & 3: Bed Overview + Ward Availability + Matrix Grid)
        ============================================================
      */}
      {activeSection === 'beds' && (
        <div ref={bedsSectionRef} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#1A56DB] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {resourceSubTab === 'beds' ? 'Live Bed Telemetry' : 'Live Equipment Telemetry'}
              </span>
            </div>
          </div>

          {/* 
            ============================================================
            2 TOGGLE BUTTONS REQUESTED BY USER (Image 2):
            [ Bed Availability ]  [ Equipment Availability ]
            "2nd image la 2 button marii vaiyu bed availability equipment availabilty seriya"
            ============================================================
          */}
          <div className="bg-white p-1.5 rounded-2xl border border-orange-100/90 shadow-2xs flex items-center gap-1.5">
            <button
              onClick={() => setResourceSubTab('beds')}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
                resourceSubTab === 'beds'
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED] bg-transparent'
              }`}
            >
              <Bed className={`w-4 h-4 ${resourceSubTab === 'beds' ? 'text-white' : 'text-[#EA580C]'}`} />
              <span>Bed Availability (படுக்கைகள் விபரம்)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                resourceSubTab === 'beds'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                78 Ready
              </span>
            </button>

            <button
              onClick={() => setResourceSubTab('equipment')}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
                resourceSubTab === 'equipment'
                  ? 'bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-[#EA580C] hover:bg-[#FFF5ED] bg-transparent'
              }`}
            >
              <Stethoscope className={`w-4 h-4 ${resourceSubTab === 'equipment' ? 'text-white' : 'text-[#EA580C]'}`} />
              <span>Equipment Availability (மருத்துவ உபகரணங்கள்)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                resourceSubTab === 'equipment'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                68 Ready
              </span>
            </button>
          </div>

          {/* Admission Request Notification Banner */}
          {bedAdmissionRequestSent && (
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-emerald-200">Bed Admission Request Submitted</div>
                  <div className="text-sm font-bold text-white">{bedAdmissionRequestSent}</div>
                </div>
              </div>
              <button 
                onClick={() => setBedAdmissionRequestSent(null)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Equipment Enquiry Request Notification Banner */}
          {equipmentEnquirySuccess && (
            <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-blue-200">Equipment Enquiry Logged</div>
                  <div className="text-sm font-bold text-white">{equipmentEnquirySuccess}</div>
                </div>
              </div>
              <button 
                onClick={() => setEquipmentEnquirySuccess(null)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 
            ============================================================
            SUB-TAB 1: BED AVAILABILITY
            ============================================================
          */}
          {resourceSubTab === 'beds' && (
            <div className="space-y-6 animate-in fade-in duration-150">

          {/* 
            ============================================================
            IMAGE 2: 1. BED OVERVIEW (TOP SUMMARY CARDS)
            Top-la summary cards:
            - Total Beds
            - Available Beds
            - Occupied Beds
            - Cleaning (EVS)
            - Reserved / Discharging Soon (discharge aga poranga)
            - Maintenance / Blocked
            "Hospital-ku overall capacity and current status ore glance-la theriyanum."
            ============================================================
          */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    1. Bed Overview & Capacity Telemetry
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hospital-ku overall capacity and current status ore glance-la theriyanum &bull; {currentHospital.name}
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Census Auto-Refreshed: Just Now</span>
              </div>
            </div>

            {/* 6 Top Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              {/* Total Beds */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Beds</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">284</div>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold">Institutional Capacity</div>
              </div>

              {/* Available Beds */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available Beds</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">78</div>
                <div className="text-[10px] text-emerald-800 mt-1 font-extrabold flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sanitized & Ready</span>
                </div>
              </div>

              {/* Occupied Beds */}
              <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Occupied Beds</div>
                <div className="text-2xl sm:text-3xl font-black text-[#1A56DB] font-mono mt-1">176</div>
                <div className="text-[10px] text-blue-800 mt-1 font-semibold">In-Patient Care</div>
              </div>

              {/* Cleaning Beds (EVS Sanitizing) */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Cleaning (EVS)</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-1">14</div>
                <div className="text-[10px] text-amber-800 mt-1 font-bold">Sanitization Active</div>
              </div>

              {/* Discharging Soon (discharge aga poranga) */}
              <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Discharging Soon</div>
                <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono mt-1">10</div>
                <div className="text-[10px] text-purple-800 mt-1 font-bold">Liberating Today</div>
              </div>

              {/* Maintenance / Blocked */}
              <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-2xs flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Maintenance</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono mt-1">6</div>
                <div className="text-[10px] text-rose-800 mt-1 font-semibold">Biomedical Tagged</div>
              </div>
            </div>
          </div>

          {/* 
            ============================================================
            IMAGE 2: 2. WARD-WISE AVAILABILITY
            Shows:
            - General Ward: 18 Available (62 Occupied · 80 Total)
            - ICU: 4 Available (15 Occupied · 20 Total)
            - Emergency Ward: 5 Available (10 Occupied · 15 Total)
            - Private Ward: 8 Available (32 Occupied · 40 Total)
            ============================================================
          */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    2. Ward-wise Availability
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Departmental bed capacity, occupancy percentage & real-time intake readiness
                  </p>
                </div>
              </div>
            </div>

            {/* Ward List Matching User Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Ward 1: General Ward */}
              <div 
                onClick={() => setSelectedWardFilter('General Ward')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedWardFilter === 'General Ward' 
                    ? 'bg-blue-50 border-[#1A56DB] shadow-xs ring-2 ring-blue-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">General Ward</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                    18 Available
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  62 Occupied &bull; 80 Total
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A56DB] rounded-full" style={{ width: '77%' }} />
                </div>
              </div>

              {/* Ward 2: ICU */}
              <div 
                onClick={() => setSelectedWardFilter('ICU')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedWardFilter === 'ICU' 
                    ? 'bg-blue-50 border-[#1A56DB] shadow-xs ring-2 ring-blue-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">ICU (Critical Care)</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                    4 Available
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  15 Occupied &bull; 20 Total
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>

              {/* Ward 3: Emergency Ward */}
              <div 
                onClick={() => setSelectedWardFilter('Emergency Ward')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedWardFilter === 'Emergency Ward' 
                    ? 'bg-blue-50 border-[#1A56DB] shadow-xs ring-2 ring-blue-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">Emergency Ward</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                    5 Available
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  10 Occupied &bull; 15 Total
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '66%' }} />
                </div>
              </div>

              {/* Ward 4: Private Ward */}
              <div 
                onClick={() => setSelectedWardFilter('Private Ward')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedWardFilter === 'Private Ward' 
                    ? 'bg-blue-50 border-[#1A56DB] shadow-xs ring-2 ring-blue-200' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">Private Ward</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                    8 Available
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  32 Occupied &bull; 40 Total
                </div>
                <div className="mt-2.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>

            </div>
          </div>

          {/* 
            ============================================================
            IMAGE 3: VISUAL BED LAYOUT MATRIX GRID
            - Green: Available (8)
            - Blue: Occupied (16)
            - Yellow: EVS Cleaning (6) (aprem cleaning nu irutha athuku thani color intha marii varanum)
            - Purple: Discharging Soon (4) (discharge aga poragana athuku onu inthamari varanum)
            - Red: Maintenance (2)
            Hover tooltip showing Patient Name, Diagnosis, Expected Discharge!
            ============================================================
          */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>3. Visual Bed Layout Matrix Grid</span>
                  <span className="text-xs text-slate-400 font-normal hidden sm:inline">(நேரடி படுக்கை வரைபடம்)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click or hover any bed to inspect clinical equipment, patient status & discharge details
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <button
                  onClick={() => setSelectedBedStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedBedStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Beds ({visualBedList.length})
                </button>

                <button
                  onClick={() => setSelectedBedStatusFilter('available')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBedStatusFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Available ({visualBedList.filter(b => b.status === 'available').length})</span>
                </button>

                <button
                  onClick={() => setSelectedBedStatusFilter('occupied')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBedStatusFilter === 'occupied'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Occupied ({visualBedList.filter(b => b.status === 'occupied').length})</span>
                </button>

                <button
                  onClick={() => setSelectedBedStatusFilter('cleaning')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBedStatusFilter === 'cleaning'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Cleaning ({visualBedList.filter(b => b.status === 'cleaning').length})</span>
                </button>

                <button
                  onClick={() => setSelectedBedStatusFilter('discharging')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBedStatusFilter === 'discharging'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Discharging ({visualBedList.filter(b => b.status === 'discharging').length})</span>
                </button>

                <button
                  onClick={() => setSelectedBedStatusFilter('maintenance')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBedStatusFilter === 'maintenance'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Blocked ({visualBedList.filter(b => b.status === 'maintenance').length})</span>
                </button>
              </div>
            </div>

            {/* Filter Sub-Bar: Ward Select & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-400 font-bold whitespace-nowrap">Filter Ward:</span>
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                >
                  <option value="All Wards">All Wards (முழு வார்டுகள்)</option>
                  <option value="General Ward">General Ward (பொது வார்டு)</option>
                  <option value="ICU">ICU (தீவிர சிகிச்சைப் பிரிவு)</option>
                  <option value="Emergency Ward">Emergency Ward (அவசர சிகிச்சை)</option>
                  <option value="Private Ward">Private Ward (தனி வார்டு)</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bed ID or patient..."
                  value={bedSearchQuery}
                  onChange={(e) => setBedSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                />
              </div>
            </div>

            {/* 
              THE INTERACTIVE BED MATRIX GRID (EXACTLY MATCHING IMAGE 3)
              Renders color-coded bed cards:
              - Green (Available): Bed 101, Bed 108...
              - Blue (Occupied): J.D. 48h, A.S. 24h... (with hover tooltip)
              - Yellow (EVS Cleaning): Bed 08, Bed 84, Bed 90, Bed 92, Bed 93...
              - Purple (Discharging Soon): Bed 25, Bed 52, Bed 71...
              - Red (Maintenance): Bed 116, Bed 120...
            */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {visualBedList
                .filter(b => (selectedBedStatusFilter === 'all' ? true : b.status === selectedBedStatusFilter))
                .filter(b => (selectedWardFilter === 'All Wards' ? true : b.ward === selectedWardFilter))
                .filter(b => {
                  if (!bedSearchQuery) return true;
                  const q = bedSearchQuery.toLowerCase();
                  return (
                    b.bedNumber.toLowerCase().includes(q) ||
                    (b.patientName && b.patientName.toLowerCase().includes(q)) ||
                    (b.diagnosis && b.diagnosis.toLowerCase().includes(q))
                  );
                })
                .map((bed) => {
                  const isHovered = hoveredBedId === bed.id;

                  return (
                    <div
                      key={bed.id}
                      onClick={() => setSelectedBedForModal(bed)}
                      onMouseEnter={() => setHoveredBedId(bed.id)}
                      onMouseLeave={() => setHoveredBedId(null)}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left select-none group shadow-2xs hover:shadow-md ${
                        bed.status === 'available'
                          ? 'bg-[#EAFBF3] border-[#86E4B6] hover:border-emerald-500 text-emerald-950'
                          : bed.status === 'occupied'
                          ? 'bg-[#EBF3FE] border-[#A8CEFD] hover:border-blue-500 text-blue-950'
                          : bed.status === 'cleaning'
                          ? 'bg-[#FEF8E7] border-[#FCE19B] hover:border-amber-500 text-amber-950'
                          : bed.status === 'discharging'
                          ? 'bg-[#F5EDFE] border-[#D6AEFD] hover:border-purple-500 text-purple-950'
                          : 'bg-[#FEECEC] border-[#FCA5A5] hover:border-rose-500 text-rose-950'
                      }`}
                    >
                      {/* Top Header inside Bed Card */}
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-sm font-black font-mono tracking-tight block truncate">
                          {bed.bedNumber}
                        </strong>

                        {/* Stay Duration / ETA Pill */}
                        {bed.status === 'occupied' && bed.hoursStay && (
                          <span className="text-[10px] font-black text-blue-700 bg-white/60 px-1.5 py-0.2 rounded-md">
                            {bed.hoursStay}
                          </span>
                        )}

                        {bed.status === 'discharging' && (
                          <span className="text-[10px] font-black text-purple-700 bg-white/70 px-1.5 py-0.2 rounded-md">
                            Discharge
                          </span>
                        )}

                        {bed.status === 'cleaning' && (
                          <span className="text-[10px] font-black text-amber-800 bg-white/70 px-1.5 py-0.2 rounded-md">
                            EVS
                          </span>
                        )}
                      </div>

                      {/* Status Descriptor with Icon Matching User Image 3 */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        {bed.status === 'available' && (
                          <>
                            <Bed className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-bold text-emerald-800">Available</span>
                          </>
                        )}

                        {bed.status === 'occupied' && (
                          <>
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-[11px] font-semibold text-blue-900 truncate">
                              {bed.patientName || 'Occupied'}
                            </span>
                          </>
                        )}

                        {bed.status === 'cleaning' && (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[11px] font-extrabold text-amber-900">
                              EVS: {bed.evsMinutes || '15m'}
                            </span>
                          </>
                        )}

                        {bed.status === 'discharging' && (
                          <>
                            <DoorOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="text-[11px] font-extrabold text-purple-900">
                              Discharge: 1h
                            </span>
                          </>
                        )}

                        {bed.status === 'maintenance' && (
                          <>
                            <Wrench className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-[11px] font-extrabold text-rose-900">Maintenance</span>
                          </>
                        )}
                      </div>

                      {/* 
                        IMAGE 3: HOVER TOOLTIP POPOVER
                        Shows: Patient: Jane Doe, Diagnosis: Pneumonia, Expected Discharge: Today, 2 PM
                      */}
                      {isHovered && (bed.status === 'occupied' || bed.status === 'discharging') && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-900/95 text-white rounded-2xl shadow-xl z-30 pointer-events-none text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          <div className="text-[10px] font-black uppercase text-blue-300">
                            {bed.bedNumber} &bull; {bed.ward}
                          </div>
                          <div className="font-extrabold text-white">
                            Patient: {bed.patientName}
                          </div>
                          {bed.diagnosis && (
                            <div className="text-slate-300 text-[11px]">
                              Diagnosis: {bed.diagnosis}
                            </div>
                          )}
                          {bed.expectedDischarge && (
                            <div className="text-emerald-300 font-bold text-[11px] pt-1 border-t border-white/10 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Expected Discharge: {bed.expectedDischarge}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* 
              IMAGE 3: COLOR LEGEND FOOTER (BOTTOM RIGHT STRIP)
              Green: Available (8) | Blue: Occupied (16) | Yellow: EVS Cleaning (6) | Purple: Discharging (4) | Red: Maintenance (2)
            */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                Live Bed Map &bull; Total {visualBedList.length} Beds Monitored
              </div>

              <div className="flex items-center gap-3.5 flex-wrap font-bold text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded-md bg-[#86E4B6] border border-emerald-400 inline-block" />
                  <span>Green: Available (8)</span>
                </div>

                <div className="flex items-center gap-1.5 text-blue-900">
                  <span className="w-3 h-3 rounded-md bg-[#A8CEFD] border border-blue-400 inline-block" />
                  <span>Blue: Occupied (16)</span>
                </div>

                <div className="flex items-center gap-1.5 text-amber-900">
                  <span className="w-3 h-3 rounded-md bg-[#FCE19B] border border-amber-400 inline-block" />
                  <span>Yellow: EVS Cleaning (6)</span>
                </div>

                <div className="flex items-center gap-1.5 text-purple-900">
                  <span className="w-3 h-3 rounded-md bg-[#D6AEFD] border border-purple-400 inline-block" />
                  <span>Purple: Discharging Soon (4)</span>
                </div>

                <div className="flex items-center gap-1.5 text-rose-900">
                  <span className="w-3 h-3 rounded-md bg-[#FCA5A5] border border-rose-400 inline-block" />
                  <span>Red: Maintenance (2)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

          {/* ======================================================== */}
          {/* SUB-TAB 2: EQUIPMENT AVAILABILITY VIEW                   */}
          {/* (User Images 1, 3, & 4: Formula, Summary, List & Contact)*/}
          {/* ======================================================== */}
          {resourceSubTab === 'equipment' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 1. Header Card with Title & Green Formula Banner (Image 3) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        Hospital Equipment Availability &amp; Readiness
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        மருத்துவ உபகரணங்கள் இருப்பு &bull; Real-time tracking of ventilators, monitors &amp; critical clinical devices
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      Live Telemetry Synced
                    </span>
                  </div>
                </div>

                {/* Formula Highlight Banner (Image 3: Available = Total - In Use - Maintenance) */}
                <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      Σ
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-900 tracking-wide">
                        FORMULA: <span className="text-emerald-700 font-mono text-sm font-black">Available = Total &minus; In Use &minus; Maintenance</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        நேரடி சிகிச்சையில் உள்ளவை மற்றும் பராமரிப்பில் உள்ளவை நீங்கலாக, தற்போது தயார் நிலையில் உள்ள உபகரணங்கள்
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-xs font-extrabold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>68 Units Immediately Ready</span>
                  </div>
                </div>

                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {/* Total Equipment */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Equipment</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">198</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-semibold">Registered Devices</div>
                  </div>

                  {/* Available Equipment */}
                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available Equipment</div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">68</div>
                    <div className="text-[10px] text-emerald-800 mt-1 font-extrabold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready for Intake</span>
                    </div>
                  </div>

                  {/* In Use Equipment */}
                  <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">In Use (Active)</div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1A56DB] font-mono mt-1">114</div>
                    <div className="text-[10px] text-blue-800 mt-1 font-semibold">Assigned to Patients</div>
                  </div>

                  {/* Under Maintenance */}
                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Under Maintenance</div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-1">16</div>
                    <div className="text-[10px] text-amber-800 mt-1 font-bold">Calibration / Tagged</div>
                  </div>
                </div>

              </div>

              {/* 2. Category Filters (Image 4: Respiratory, Monitoring, Treatment, Emergency, Mobility, Diagnostic) */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Filter by Equipment Category:
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Showing {filteredEquipment.length} Devices
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                  {[
                    { id: 'All', label: 'All Equipment', count: INITIAL_EQUIPMENT_LIST.length },
                    { id: 'Respiratory', label: '🫁 Respiratory', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Respiratory').length },
                    { id: 'Monitoring', label: '📊 Monitoring', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Monitoring').length },
                    { id: 'Treatment', label: '💉 Treatment', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Treatment').length },
                    { id: 'Emergency', label: '🚨 Emergency', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Emergency').length },
                    { id: 'Mobility', label: '♿ Mobility', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Mobility').length },
                    { id: 'Diagnostic', label: '🔬 Diagnostic', count: INITIAL_EQUIPMENT_LIST.filter(e => e.category === 'Diagnostic').length }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedEquipmentCategory(cat.id as any)}
                      className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                        selectedEquipmentCategory === cat.id
                          ? 'bg-[#1A56DB] text-white shadow-xs font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        selectedEquipmentCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search & Status Filters */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={equipmentSearchQuery}
                      onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                      placeholder="Search equipment (Ventilator, Monitor, Wheelchair...)"
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {equipmentSearchQuery && (
                      <button
                        onClick={() => setEquipmentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All Status' },
                      { id: 'available', label: 'Available Only (>0)' },
                      { id: 'in_use', label: 'High Demand' },
                      { id: 'maintenance', label: 'In Maintenance' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setEquipmentStatusFilter(st.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          equipmentStatusFilter === st.id
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. Equipment Table & Cards (Fields from Image 1: Equipment name, Total quantity, Available, In use, Under maintenance, Last updated, Contact/Enquiry action) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>Equipments Inventory Dossier (உபகரணங்கள் பட்டியல்)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#1A56DB]">
                        Citizen View
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      கீழே உள்ள பட்டன் மூலம் உபகரண இருப்பு குறித்து விசாரிக்கலாம் அல்லது உதவி கோரலாம்
                    </p>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-bold text-slate-400">Total Rows:</span>
                    <strong className="text-xs font-black text-slate-800 ml-1">{filteredEquipment.length}</strong>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Equipment Name</th>
                        <th className="py-3 px-3 text-center">Total</th>
                        <th className="py-3 px-3 text-center">In Use</th>
                        <th className="py-3 px-3 text-center">Maintenance</th>
                        <th className="py-3 px-3 text-center">Available</th>
                        <th className="py-3 px-3">Live Ratio</th>
                        <th className="py-3 px-3">Last Updated</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEquipment.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                            No medical equipment matches your current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEquipment.map(eq => {
                          const availPercent = Math.round((eq.available / eq.total) * 100);
                          const inUsePercent = Math.round((eq.inUse / eq.total) * 100);
                          const maintPercent = Math.max(0, 100 - availPercent - inUsePercent);

                          return (
                            <tr key={eq.id} className="hover:bg-blue-50/40 transition-colors">
                              {/* 1. Equipment Name & Category */}
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {eq.name}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1A56DB] border border-blue-200">
                                    {eq.categoryLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    📍 {eq.location}
                                  </span>
                                </div>
                              </td>

                              {/* 2. Total Quantity */}
                              <td className="py-3.5 px-3 text-center">
                                <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  {eq.total}
                                </span>
                              </td>

                              {/* 3. In Use */}
                              <td className="py-3.5 px-3 text-center">
                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                                  {eq.inUse}
                                </span>
                              </td>

                              {/* 4. Under Maintenance */}
                              <td className="py-3.5 px-3 text-center">
                                <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                  eq.maintenance > 0 
                                    ? 'text-amber-800 bg-amber-50 border-amber-200' 
                                    : 'text-slate-400 bg-slate-50 border-slate-200'
                                }`}>
                                  {eq.maintenance}
                                </span>
                              </td>

                              {/* 5. Available */}
                              <td className="py-3.5 px-3 text-center">
                                <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  {eq.available} Ready
                                </span>
                              </td>

                              {/* 6. Live Ratio Bar */}
                              <td className="py-3.5 px-3 min-w-[120px]">
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                                  <div style={{ width: `${availPercent}%` }} className="bg-emerald-500 h-full" title={`Available: ${availPercent}%`} />
                                  <div style={{ width: `${inUsePercent}%` }} className="bg-blue-500 h-full" title={`In Use: ${inUsePercent}%`} />
                                  <div style={{ width: `${maintPercent}%` }} className="bg-amber-400 h-full" title={`Maintenance: ${maintPercent}%`} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-semibold">
                                  <span>{availPercent}% Avail</span>
                                  <span>{inUsePercent}% Use</span>
                                </div>
                              </td>

                              {/* 7. Last Updated */}
                              <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{eq.lastUpdated}</span>
                                </div>
                              </td>

                              {/* 8. Contact / Enquiry Action (Requested in Image 1) */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedEquipmentForEnquiry(eq)}
                                  className="px-3.5 py-2 rounded-xl bg-linear-to-r from-[#1A56DB] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                                  title="Contact hospital or enquire about this equipment"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Contact / Enquiry</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Guidance */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Equipments are tagged with RFID &amp; biomedical calibration certification.
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    Hospital Node: <span className="text-[#1A56DB]">{currentHospital.name}</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 
            ============================================================
            DR. MEDISYNC QUICK ASSISTANT & OPD BOOKING POPUP MODAL
            Triggered when patient clicks the doctor character
            ============================================================
          */}
          {showDoctorModal && (
            <div 
              onClick={() => setShowDoctorModal(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-orange-100 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
              >
                {/* Top decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100/80 border border-orange-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      <img 
                        src="/doctor-thumbs-up.png" 
                        alt="Dr. MediSync" 
                        className="w-12 h-12 object-contain scale-110"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">Dr. MediSync Guide</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{currentHospital.name} • Virtual Assistant</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDoctorModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Friendly Greeting Message */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-orange-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">வணக்கம் Muralitharan! 👋</p>
                  <p className="text-slate-600">
                    நான் உங்கள் மருத்துவ உதவி வழிகாட்டி. இன்று உங்களுக்கு என்ன உதவி தேவைப்படுகிறது? நேரடி OPD முன்பதிவு அல்லது லைவ் வரிசை நிலையை உடனே தெரிந்து கொள்ளுங்கள்.
                  </p>
                </div>

                {/* 4 Instant Action Cards */}
                <div className="space-y-2.5">
                  
                  {/* Option 1: Book OPD Consultation (Highlighted Primary) */}
                  <button
                    onClick={() => {
                      setShowDoctorModal(false);
                      handleGoToAppointments();
                    }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-between cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold flex items-center gap-2">
                          <span>Book OPD Consultation</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                            INSTANT TOKEN
                          </span>
                        </div>
                        <div className="text-xs text-orange-100 font-medium">
                          மருத்துவ ஆலோசனையை உடனே முன்பதிவு செய்யவும்
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 2: Live OPD Queue Status */}
                  <button
                    onClick={() => {
                      setShowDoctorModal(false);
                      handleGoToQueue();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 text-slate-900 transition-all flex items-center justify-between cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                          Live Queue Status (வரிசை நிலை)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Current Token Calling & உங்கள் வரிசை எண் கண்காணிக்கவும்
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 3: Bed & Ward Availability */}
                  <button
                    onClick={() => {
                      setShowDoctorModal(false);
                      handleGoToBeds();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 text-slate-900 transition-all flex items-center justify-between cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Bed className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                          Bed & Equipment Availability (படுக்கைகள்)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ICU, வென்டிலேட்டர், ஆக்சிஜன் படுக்கைகள் விபரம்
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 4: Emergency Casualty */}
                  <a
                    href={`tel:${currentHospital.emergencyContact}`}
                    className="w-full p-3.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-slate-900 transition-all flex items-center justify-between cursor-pointer group text-left block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-rose-900">
                          24x7 Casualty & Emergency Helpline
                        </div>
                        <div className="text-[11px] text-rose-700">
                          Call {currentHospital.emergencyContact} / 108 Ambulance
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 px-2.5 py-1 rounded-full bg-white border border-rose-200 shadow-2xs">
                      Call Now 📞
                    </span>
                  </a>

                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Govt CMCHIS Scheme 100% Free
                  </span>
                  <button
                    onClick={() => setShowDoctorModal(false)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Close (மூடு)
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* 
            ============================================================
            BED DETAILS & ADMISSION INQUIRY MODAL
            Opens when patient clicks on any bed card
            ============================================================
          */}
          {selectedBedForModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      selectedBedForModal.status === 'available'
                        ? 'bg-emerald-50 text-emerald-600'
                        : selectedBedForModal.status === 'occupied'
                        ? 'bg-blue-50 text-[#1A56DB]'
                        : selectedBedForModal.status === 'cleaning'
                        ? 'bg-amber-50 text-amber-600'
                        : selectedBedForModal.status === 'discharging'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedBedForModal.bedNumber} &mdash; Bed Telemetry Dossier
                      </h3>
                      <div className="text-xs text-slate-500">
                        {selectedBedForModal.ward} &bull; {selectedBedForModal.floor} &bull; {currentHospital.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBedForModal(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Strip */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Status:</span>
                    <strong className="text-sm font-extrabold capitalize text-slate-900">
                      {selectedBedForModal.status === 'available' ? 'Available for Admission' : selectedBedForModal.status === 'occupied' ? 'Occupied (In-Patient)' : selectedBedForModal.status === 'cleaning' ? 'EVS Sanitization' : selectedBedForModal.status === 'discharging' ? 'Discharge Clearance Signed' : 'Under Maintenance'}
                    </strong>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    selectedBedForModal.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedBedForModal.status === 'occupied'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedBedForModal.status === 'cleaning'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedBedForModal.status === 'discharging'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedBedForModal.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-xs">
                  {selectedBedForModal.patientName && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-blue-700 block">Admitted Patient:</span>
                      <strong className="text-sm text-slate-900 block">{selectedBedForModal.patientName}</strong>
                      {selectedBedForModal.diagnosis && (
                        <div className="text-slate-600 text-[11px]">
                          Diagnosis: {selectedBedForModal.diagnosis}
                        </div>
                      )}
                      {selectedBedForModal.expectedDischarge && (
                        <div className="text-emerald-700 font-bold text-[11px]">
                          Expected Discharge: {selectedBedForModal.expectedDischarge}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedBedForModal.equipment && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Attached Equipment & Life Support:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBedForModal.equipment.map((eq, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-[11px]">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBedForModal.notes && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <strong>Nurse / Tech Notes:</strong> {selectedBedForModal.notes}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedBedForModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedBedForModal.status === 'available' ? (
                    <button
                      onClick={() => {
                        setBedAdmissionRequestSent(`Admission inquiry for ${selectedBedForModal.bedNumber} (${selectedBedForModal.ward}) submitted to admissions triage!`);
                        setSelectedBedForModal(null);
                        setTimeout(() => setBedAdmissionRequestSent(null), 6000);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Bed className="w-4 h-4" />
                      <span>Request Bed Admission / Hold</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setBedAdmissionRequestSent(`Inpatient waitlist alert logged for ${selectedBedForModal.ward}. You will be notified when a bed liberates.`);
                        setSelectedBedForModal(null);
                        setTimeout(() => setBedAdmissionRequestSent(null), 6000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Join Bed Waitlist Alert</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 
            ============================================================
            EQUIPMENT CONTACT / ENQUIRY MODAL (Image 1 Requirement)
            "patient-ku equipment list matum ka... contact / enquiry matum kodukalam"
            ============================================================
          */}
          {selectedEquipmentForEnquiry && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Equipment Contact &amp; Enquiry
                      </h3>
                      <div className="text-xs text-slate-500">
                        மருத்துவ உபகரண உதவி &bull; {currentHospital.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedEquipmentForEnquiry(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Equipment Snapshot Card */}
                <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedEquipmentForEnquiry.name}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedEquipmentForEnquiry.available} Available Now
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed">
                    {selectedEquipmentForEnquiry.description}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-blue-100/80 text-[11px] text-slate-500">
                    <span>Category: <strong>{selectedEquipmentForEnquiry.categoryLabel}</strong></span>
                    <span>Location: <strong>{selectedEquipmentForEnquiry.location}</strong></span>
                  </div>
                </div>

                {/* Patient Information (Pre-filled) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Patient / Enquirer Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Karthik Subramanian (28 / Male)"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Contact Mobile
                      </label>
                      <input
                        type="text"
                        defaultValue="+91 98401 22345"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Urgency Level (முன்னுரிமை)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Immediate', label: '🚨 Immediate Need' },
                        { id: 'Routine', label: '🏥 In-Patient Care' },
                        { id: 'Transfer', label: '🚑 Transport Aid' }
                      ].map(urg => (
                        <button
                          key={urg.id}
                          type="button"
                          onClick={() => setEquipmentUrgency(urg.id as any)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                            equipmentUrgency === urg.id
                              ? 'bg-[#1A56DB] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {urg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Clinical Specialty / Target Ward
                    </label>
                    <select
                      value={equipmentDepartment}
                      onChange={(e) => setEquipmentDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Critical Care ICU">Critical Care ICU</option>
                      <option value="Trauma & Emergency">Trauma &amp; Emergency Casualty</option>
                      <option value="General Ward (Block B)">General Ward (Floor 1)</option>
                      <option value="Pulmonology Ward">Pulmonology &amp; Respiratory Care</option>
                      <option value="Cardiology Care Unit">Cardiology Care Unit (CCU)</option>
                      <option value="Pediatrics Ward">Pediatrics &amp; Neonatal Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Specific Medical Note or Attender Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={equipmentNotes}
                      onChange={(e) => setEquipmentNotes(e.target.value)}
                      placeholder="e.g. Patient requires oxygen support during transfer, or requesting wheelchair at gate..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Direct Biomedical Helpline Option */}
                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold block">Biomedical Engineering Desk:</span>
                      <span className="text-[11px] text-amber-800 font-medium">Casualty Direct Line: {currentHospital.emergencyContact} (Ext: 204)</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${currentHospital.emergencyContact}`}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Call Desk</span>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEquipmentForEnquiry(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEquipmentEnquirySuccess(`Enquiry for ${selectedEquipmentForEnquiry.name} submitted to ${equipmentDepartment} triage desk. Attender assistance confirmed.`);
                      setSelectedEquipmentForEnquiry(null);
                      setEquipmentNotes('');
                      setTimeout(() => setEquipmentEnquirySuccess(null), 6000);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Enquiry (உபகரண உதவி கோரிக்கை)</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 
        6. FACILITIES & SERVICES DIRECTORY (Facilities tab)
        ============================================================
      */}
      {activeSection === 'facilities' && (
        <div className="space-y-4 pt-2">
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-2">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#1A56DB] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Clinical Infrastructure & Patient Facilities &mdash; {currentHospital.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified clinical infrastructure, tertiary treatment wings, diagnostic suites and support services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Trauma & Resuscitation */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-red-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                <Ambulance className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">24/7 Trauma & Emergency Triage</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dedicated acute triage bay with cardiac defibs, crash carts, rapid CT imaging access, and direct ambulance ramp.
              </p>
              <div className="mt-3 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 36 Triage Bays Ready
              </div>
            </div>

            {/* 2. Cardiology & Cath Lab */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cardiology & Cardiac ICU</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                24x7 primary angioplasty, flat-panel digital catheterization laboratory, echocardiography, and ICCU monitoring.
              </p>
              <div className="mt-3 text-[11px] font-bold text-[#1A56DB] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Cath Lab 24x7 Standby
              </div>
            </div>

            {/* 3. Central Diagnostic Lab */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Microscope className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Central Pathology & Diagnostic Lab</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Automated clinical biochemistry, hematology, microbiology, histopathology, with digital test reports uploaded directly.
              </p>
              <div className="mt-3 text-[11px] font-bold text-purple-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> NABL Accredited Testing
              </div>
            </div>

            {/* 4. Radiology & Imaging */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Radiology & CT / MRI Imaging</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                128-Slice High Speed CT, 3.0 Tesla Silent MRI, Digital X-Ray, Color Doppler and ultrasound scanning suites.
              </p>
              <div className="mt-3 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 24x7 Imaging Availability
              </div>
            </div>

            {/* 5. Free Drug Dispensary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Free Medicine Dispensary / Pharmacy</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Free dispensing of essential life-saving pharmaceuticals, antibiotics, diabetes and cardiovascular medicines for all registered citizens.
              </p>
              <div className="mt-3 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Free Essential Meds
              </div>
            </div>

            {/* 6. Certified Blood Bank */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Droplet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">State Certified Blood Component Bank</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Whole blood, packed red cells, platelet apheresis units, and fresh frozen plasma with computerized compatibility matching.
              </p>
              <div className="mt-3 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Immediate Cross-match
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 
        ============================================================
        7. DUTY SPECIALISTS & DOCTORS DIRECTORY (Doctors tab)
        ============================================================
      */}
      {activeSection === 'doctors' && (
        <div className="space-y-4 pt-2">
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-2">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#1A56DB] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Specialists & Physicians on Duty &mdash; {currentHospital.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Qualified medical officers currently consulting at outpatient clinics and critical wards.
              </p>
            </div>

            <button
              onClick={handleGoToAppointments}
              className="px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{activeToken ? 'View My Appointments' : 'Schedule with Any Doctor'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorsList.map(doc => (
              <div 
                key={doc.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1A56DB] border border-blue-100">
                      {doc.department}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{doc.name}</h4>
                  <div className="text-xs font-medium text-slate-500">{doc.qualification}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">{doc.specialty}</div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.timings}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.room}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-600">
                    {doc.tokensWaiting} in queue
                  </span>

                  <button
                    onClick={() => handleSelectDoctorFromDirectory(doc)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-[#1A56DB] text-[#1A56DB] hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Book with Doctor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 
        ============================================================
        8. EMERGENCY DESK & HELPLINES (Emergency tab)
        ============================================================
      */}
      {activeSection === 'emergency' && (
        <div className="space-y-4 pt-2">
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-2">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#1A56DB] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Emergency & Patient Support Desks &mdash; {currentHospital.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant contact lines for emergency response, ambulance transport, hospital helpdesks and welfare officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 1. Casualty Desk */}
            <div className="bg-red-50/80 border-2 border-red-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center mb-3 shadow-xs">
                  <PhoneCall className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-black text-red-900">24/7 Casualty & Triage Hotline</h4>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  Immediate dispatch line for incoming critical ambulances, acute heart attacks, stroke triage, and emergency trauma intake.
                </p>
              </div>

              <a
                href={`tel:${currentHospital.emergencyContact}`}
                className="mt-5 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Call Emergency: {currentHospital.emergencyContact}</span>
              </a>
            </div>

            {/* 2. Ambulance (108) */}
            <div className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-3 shadow-xs">
                  <Ambulance className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">Tamil Nadu 108 Emergency Ambulance</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Free emergency ambulance service across Tamil Nadu with Advanced Life Support (ALS) equipment and GPS tracking.
                </p>
              </div>

              <a
                href="tel:108"
                className="mt-5 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial 108 Emergency Dispatch</span>
              </a>
            </div>

            {/* 3. Reception & Patient Helpdesk */}
            <div className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">Hospital Information & Enquiry Desk</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Patient ward locations, admission formalities, visiting hours, visiting passes, and doctor consultation inquiries.
                </p>
              </div>

              <a
                href={`tel:${currentHospital.phone}`}
                className="mt-5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Call Information: {currentHospital.phone}</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* 
        ============================================================
        9. PATIENT MEDICAL RECORDS MODULE (User Images 1 & 2 Request)
        Includes 6 detailed tabs:
        1. Overview: Basic patient details & current status
        2. Medical History: Past illness, allergies, surgeries
        3. Visits: Previous consultation & diagnosis
        4. Prescriptions: Medicines prescribed
        5. Lab Reports: Test results & reports
        6. Admissions: Ward, bed, admission & discharge details
        ============================================================
      */}
      {activeSection === 'records' && (
        <div ref={recordsSectionRef} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar: Clean Return to Dashboard Overview */}
          <div className="flex items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-orange-100/90 shadow-2xs">
            <button
              onClick={() => {
                setActiveSection('overview');
                onSelectTab?.('dashboard');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#FFF5ED] text-slate-700 hover:text-[#EA580C] text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 group-hover:text-[#EA580C] transition-transform" />
              <span>← Back to Dashboard Overview (முகப்புப் பக்கம்)</span>
            </button>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="hidden sm:inline text-slate-400">Hospital Node:</span>
              <span className="text-[#EA580C] font-extrabold">{currentHospital.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <PatientRecordsModule 
            hospitalName={currentHospital.name}
            onNavigateToBooking={handleGoToAppointments}
            onNavigateToQueue={handleGoToQueue}
          />

        </div>
      )}

    </div>
  );
};
