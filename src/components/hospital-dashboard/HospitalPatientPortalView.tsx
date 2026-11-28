import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Siren,
  X,
  Search,
  Building2,
  Stethoscope,
  Phone,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  UserCheck,
  XCircle,
  Plus,
  PhoneCall,
  Bed,
  Flame,
  RotateCcw,
  FileText,
  Sparkles,
  Ticket,
  Send,
  Volume2,
  Bell,
  Filter,
  Eye,
  Check
} from 'lucide-react';
import { Hospital } from '../../types';
import {
  isMatchingHospital,
  OPD_REQUESTS_STORAGE_KEY,
  OPD_UPDATE_EVENT,
  generateHospitalPatientToken
} from '../../utils/hospitalSync';

export interface HospitalOPDRequestItem {
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
  patientAge?: string;
  bloodGroup?: string;
  symptomsDescription?: string;
  patientAgeGender?: string;
  counterNumber?: string;
  queuePosition?: number;
  currentServingToken?: string;
  estimatedWaitMinutes?: number;
  status: 'Pending' | 'In Queue' | 'Called' | 'Completed' | 'Cancelled' | 'Declined';
  declineReason?: string;
  bookedAt?: string;
  reviewedAt?: string;
  aiPriority?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  emergencyAlert?: boolean;
  confidenceScore?: number;
  safetyFlags?: string[];
  priorityReason?: string;
  recommendedAction?: string;
  staffConfirmedPriority?: string;
  staffOverrideReason?: string;
  vitals?: {
    temp?: number;
    heartRate?: number;
    spo2?: number;
    painLevel?: number;
    breathingDifficulty?: string;
    consciousness?: string;
  };
}

interface HospitalPatientPortalViewProps {
  hospital: Hospital;
  onSelectTab?: (tab: string) => void;
}

export const HospitalPatientPortalView: React.FC<HospitalPatientPortalViewProps> = ({
  hospital,
  onSelectTab
}) => {
  // Sub-tabs within this hospital's patient portal:
  // 1. 'requests': Citizen OPD & Emergency Consultation Requests Desk
  // 2. 'transparency': Hospital Public Facing Transparency & Resource Preview
  // 3. 'live_queue': Live Counter & Queue Dispatch Room
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'transparency' | 'live_queue'>('requests');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('all');
  const [requestSourceFilter, setRequestSourceFilter] = useState<'all' | 'opd' | 'ai_emergency'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_queue' | 'called' | 'completed' | 'declined'>('all');

  // Requests Data from localStorage (synchronized across patient & hospital portals)
  const [requests, setRequests] = useState<HospitalOPDRequestItem[]>([]);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');

  // Modal States
  const [selectedRequestForDoctorAllocation, setSelectedRequestForDoctorAllocation] = useState<HospitalOPDRequestItem | null>(null);
  const [allocatedDoctorChoice, setAllocatedDoctorChoice] = useState('Dr. Sundaramoorthy M. (Senior Consultant)');
  const [allocatedRoomChoice, setAllocatedRoomChoice] = useState('Red Bay 1 (Emergency Resuscitation)');
  const [allocatedTokenPreview, setAllocatedTokenPreview] = useState('TK-CRIT-901');

  const [selectedRequestForDecline, setSelectedRequestForDecline] = useState<HospitalOPDRequestItem | null>(null);
  const [declineReasonPreset, setDeclineReasonPreset] = useState('Doctor is currently called for emergency surgery in OT. Please choose an afternoon session.');
  const [customDeclineNotes, setCustomDeclineNotes] = useState('');

  // Queue Dispatch Live State
  const [currentServingIndex, setCurrentServingIndex] = useState(0);
  const [queueCallNotification, setQueueCallNotification] = useState<string | null>(null);

  // Initial Seed Data strictly scoped to RGGGH (Hos_Id-101) so other hospitals start clean
  const getInitialRequests = (): HospitalOPDRequestItem[] => {
    const seedHospitalId = 'Hos_Id-101';
    const seedHospitalName = 'Rajiv Gandhi Government General Hospital (RGGGH)';
    return [
      {
        tokenNumber: 'TK-CRIT-4821',
        requestId: 'REQ-RGGGH-9102',
        hospitalId: seedHospitalId,
        hospitalName: seedHospitalName,
        department: 'Emergency & Cardiology Triage',
        doctorName: 'Pending Doctor Allocation',
        date: '2026-11-28',
        timeSlot: 'IMMEDIATE EMERGENCY INTAKE',
        purpose: 'Acute Chest Discomfort, Radiating Pain (8/10), Dyspnea, Dizziness',
        patientName: 'Karthik Subramanian',
        patientMobile: '+91 98401 22345',
        patientAgeGender: '56 / Male',
        counterNumber: 'Red Bay 1 (Casualty Intake)',
        queuePosition: 1,
        currentServingToken: 'C-021',
        estimatedWaitMinutes: 2,
        status: 'Pending',
        bookedAt: '4 mins ago',
        aiPriority: 'CRITICAL',
        emergencyAlert: true,
        confidenceScore: 0.96,
        safetyFlags: ['Severe chest discomfort with dyspnea', 'Clinical safety red-line triggered'],
        priorityReason: 'High-risk acute cardiac symptom cluster with acute breathing difficulty. Requires immediate resuscitation triage.',
        recommendedAction: `Immediate transfer to ${seedHospitalName} Emergency / Red Bay. Duty emergency physician alerted.`,
        vitals: { temp: 37.0, heartRate: 118, spo2: 92, painLevel: 8, breathingDifficulty: 'yes', consciousness: 'normal' }
      },
      {
        tokenNumber: 'TK-PRIO-6184',
        requestId: 'REQ-RGGGH-8841',
        hospitalId: seedHospitalId,
        hospitalName: seedHospitalName,
        department: 'Pulmonology OPD',
        doctorName: 'Dr. Shalini R. (Pulmonology Specialist)',
        date: '2026-11-28',
        timeSlot: 'Morning Priority Slot (10:15 AM - 10:45 AM)',
        purpose: 'Acute wheezing, respiratory distress, persistent dry cough',
        patientName: 'Meenakshi Ramanathan',
        patientMobile: '+91 94441 55678',
        patientAgeGender: '64 / Female',
        counterNumber: 'Triage Counter 2 (Pulmonary)',
        queuePosition: 2,
        currentServingToken: 'C-021',
        estimatedWaitMinutes: 10,
        status: 'In Queue',
        bookedAt: '18 mins ago',
        aiPriority: 'HIGH',
        emergencyAlert: false,
        confidenceScore: 0.91,
        safetyFlags: ['Acute bronchospasm and dyspnea on exertion'],
        priorityReason: 'Prioritized due to severe chronic asthma exacerbation requiring fast-track spirometry/nebulization.',
        recommendedAction: 'Fast-track priority queue slot. Clinical assessment within 15 minutes.',
        vitals: { temp: 37.2, heartRate: 98, spo2: 93, painLevel: 5, breathingDifficulty: 'yes', consciousness: 'normal' }
      },
      {
        tokenNumber: 'TC-RAJ-757',
        requestId: 'REQ-RGGGH-5532',
        hospitalId: seedHospitalId,
        hospitalName: seedHospitalName,
        department: 'General Medicine OPD',
        doctorName: 'Dr. Sundaramoorthy M.',
        date: '2026-11-28',
        timeSlot: 'Morning OPD Session (09:00 AM - 12:30 PM)',
        purpose: 'Fever, Body aches, Chills for 3 days',
        patientName: 'Aravind Swaminathan',
        patientMobile: '+91 97890 12345',
        patientAgeGender: '42 / Male',
        counterNumber: 'Counter 3 - Room 104',
        queuePosition: 4,
        currentServingToken: 'C-021',
        estimatedWaitMinutes: 25,
        status: 'In Queue',
        bookedAt: '35 mins ago',
        aiPriority: 'MODERATE',
        emergencyAlert: false,
        confidenceScore: 0.88,
        priorityReason: 'Febrile illness with stable vitals. Standard outpatient queue progression assigned.',
        recommendedAction: 'Standard consultation queue assignment. Routine CBC and clinical assessment.',
        vitals: { temp: 38.6, heartRate: 92, spo2: 98, painLevel: 3, breathingDifficulty: 'no', consciousness: 'normal' }
      }
    ];
  };

  // Load and listen strictly for requests belonging ONLY to this hospital
  const loadRequests = () => {
    try {
      const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const forThisHospital = parsed.filter((r: HospitalOPDRequestItem) =>
            isMatchingHospital(r, hospital.id, hospital.name)
          );
          setRequests(forThisHospital);
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          return;
        }
      }
    } catch {}

    const defaults = getInitialRequests();
    try {
      localStorage.setItem(OPD_REQUESTS_STORAGE_KEY, JSON.stringify(defaults));
    } catch {}
    setRequests(defaults.filter((r) => isMatchingHospital(r, hospital.id, hospital.name)));
    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  useEffect(() => {
    loadRequests();
    const handleStorageChange = () => loadRequests();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(OPD_UPDATE_EVENT, handleStorageChange);

    const interval = setInterval(loadRequests, 3000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(OPD_UPDATE_EVENT, handleStorageChange);
      clearInterval(interval);
    };
  }, [hospital.id, hospital.name]);

  // Sync back to storage (keeping every other hospital's requests isolated & intact)
  const saveRequests = (updatedList: HospitalOPDRequestItem[]) => {
    setRequests(updatedList);
    try {
      const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
      const allStored = stored ? JSON.parse(stored) : [];
      const others = Array.isArray(allStored)
        ? allStored.filter((r: any) => !isMatchingHospital(r, hospital.id, hospital.name))
        : [];
      const combined = [...updatedList, ...others];
      localStorage.setItem(OPD_REQUESTS_STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent(OPD_UPDATE_EVENT));
    } catch {}
  };

  // Open Approve & Doctor Allocation Modal (generates official <INITIALS>_PAT_XX token)
  const handleOpenDoctorAllocationModal = (req: HospitalOPDRequestItem) => {
    setSelectedRequestForDoctorAllocation(req);
    const isCrit = req.aiPriority === 'CRITICAL';
    const isHigh = req.aiPriority === 'HIGH';
    const officialPatToken = generateHospitalPatientToken(hospital.name, requests, hospital.id);
    setAllocatedTokenPreview(officialPatToken);

    if (isCrit) {
      setAllocatedDoctorChoice('Dr. Arun Kumar (Emergency Casualty Lead)');
      setAllocatedRoomChoice('Red Bay 1 (Emergency Resuscitation & ICU Bay)');
    } else if (isHigh) {
      setAllocatedDoctorChoice('Dr. Shalini R. (Pulmonology Specialist)');
      setAllocatedRoomChoice('Priority Triage Counter 1 (Fast-Track)');
    } else {
      setAllocatedDoctorChoice(
        req.doctorName && !req.doctorName.includes('Pending')
          ? req.doctorName
          : 'Dr. Sundaramoorthy M. (Senior Consultant - General Medicine)'
      );
      setAllocatedRoomChoice(req.counterNumber || 'OPD Counter 3 (General Consultation)');
    }
  };

  // Confirm Doctor & Room Allocation
  const handleConfirmDoctorAllocation = () => {
    if (!selectedRequestForDoctorAllocation) return;

    const targetToken = selectedRequestForDoctorAllocation.tokenNumber;
    const targetRequestId = selectedRequestForDoctorAllocation.requestId;

    const updated = requests.map(r => {
      if ((targetRequestId && r.requestId === targetRequestId) || (targetToken && targetToken !== 'AWAITING-APPROVAL' && r.tokenNumber === targetToken)) {
        return {
          ...r,
          tokenNumber: allocatedTokenPreview,
          doctorName: allocatedDoctorChoice,
          counterNumber: allocatedRoomChoice,
          status: 'In Queue' as const,
          queuePosition: r.aiPriority === 'CRITICAL' ? 1 : 3,
          estimatedWaitMinutes: r.aiPriority === 'CRITICAL' ? 2 : 12,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveRequests(updated);
    setSelectedRequestForDoctorAllocation(null);

    // Call backend API if possible
    fetch('http://localhost:5000/api/queue/staff-override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenNumber: allocatedTokenPreview,
        confirmedPriority: selectedRequestForDoctorAllocation.aiPriority || 'HIGH',
        reason: `Allocated Doctor: ${allocatedDoctorChoice} at ${allocatedRoomChoice}`
      })
    }).catch(() => {});
  };

  // Confirm Decline
  const handleConfirmDecline = () => {
    if (!selectedRequestForDecline) return;

    const finalReason = customDeclineNotes.trim() || declineReasonPreset;
    const targetToken = selectedRequestForDecline.tokenNumber;
    const targetReqId = selectedRequestForDecline.requestId;

    const updated = requests.map(r => {
      if ((targetReqId && r.requestId === targetReqId) || (targetToken && targetToken !== 'AWAITING-APPROVAL' && r.tokenNumber === targetToken)) {
        return {
          ...r,
          tokenNumber: 'DECLINED',
          status: 'Declined' as const,
          declineReason: finalReason,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveRequests(updated);
    setSelectedRequestForDecline(null);
    setCustomDeclineNotes('');
  };

  // Call Patient to Counter
  const handleCallPatient = (req: HospitalOPDRequestItem) => {
    const updated = requests.map(r => {
      if (r.tokenNumber === req.tokenNumber) {
        return { ...r, status: 'Called' as const };
      }
      return r;
    });
    saveRequests(updated);
    setQueueCallNotification(`Token #${req.tokenNumber} (${req.patientName}) called to ${req.counterNumber || 'Counter 1'}`);
    setTimeout(() => setQueueCallNotification(null), 5000);
  };

  // Complete Consultation
  const handleCompleteConsultation = (req: HospitalOPDRequestItem) => {
    const updated = requests.map(r => {
      if (r.tokenNumber === req.tokenNumber) {
        return { ...r, status: 'Completed' as const };
      }
      return r;
    });
    saveRequests(updated);
  };

  // Filtered List
  const filteredRequests = requests.filter(req => {
    // Source filter (OPD Appointments vs Emergency AI Queue)
    if (requestSourceFilter === 'opd' && req.aiPriority) return false;
    if (requestSourceFilter === 'ai_emergency' && !req.aiPriority) return false;

    // Priority filter
    if (priorityFilter !== 'all' && req.aiPriority !== priorityFilter) return false;

    // Status filter
    if (statusFilter === 'pending' && req.status !== 'Pending') return false;
    if (statusFilter === 'in_queue' && req.status !== 'In Queue') return false;
    if (statusFilter === 'called' && req.status !== 'Called') return false;
    if (statusFilter === 'completed' && req.status !== 'Completed') return false;
    if (statusFilter === 'declined' && req.status !== 'Declined') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchToken = req.tokenNumber?.toLowerCase().includes(q);
      const matchName = req.patientName?.toLowerCase().includes(q);
      const matchMobile = req.patientMobile?.includes(q);
      const matchDept = req.department?.toLowerCase().includes(q);
      const matchPurpose = req.purpose?.toLowerCase().includes(q);
      if (!matchToken && !matchName && !matchMobile && !matchDept && !matchPurpose) return false;
    }

    return true;
  });

  // Key Counts
  const criticalCount = requests.filter(r => r.aiPriority === 'CRITICAL' && r.status !== 'Completed' && r.status !== 'Declined').length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const inQueueCount = requests.filter(r => r.status === 'In Queue' || r.status === 'Called').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 
        ============================================================
        1. HOSPITAL PATIENT PORTAL HEADER BANNER
        Dedicated Hospital-Specific Citizen Intake & Transparency Desk
        ============================================================
      */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Hospital Patient Portal (பொதுமக்கள் சேவை தளம்)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Citizen Intake Active &bull; {lastSyncedTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {hospital.name} &mdash; Patient Portal Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              இந்த மருத்துவமனைக்கு பொதுமக்கள் அனுப்பும் OPD முன்பதிவுகள், AI- Queue Priority அவசர கோரிக்கைகள், மருத்துவர் ஒதுக்கீடு மற்றும் நேரலை வெளிப்படைத்தன்மை கண்காணிப்பு மையம்.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className={`p-3.5 rounded-2xl border text-center transition-all ${
              criticalCount > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                {criticalCount > 0 && <Siren className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
                Critical Urgency
              </div>
              <div className={`text-xl font-black mt-0.5 ${criticalCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                {criticalCount}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                Pending Intake
              </div>
              <div className="text-xl font-black text-amber-800 mt-0.5">
                {pendingCount}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                In Consultation
              </div>
              <div className="text-xl font-black text-blue-800 mt-0.5">
                {inQueueCount}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-2 pt-5 mt-5 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'requests'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments ({requests.length})</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('transparency')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'transparency'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Hospital Public Transparency Preview (பொதுமக்கள் பார்வை)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('live_queue')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'live_queue'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>OPD Counter &amp; Token Dispatch Desk</span>
          </button>
        </div>
      </div>

      {/* Audio / Announcement Toast */}
      {queueCallNotification && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span>{queueCallNotification}</span>
          </div>
          <button
            onClick={() => setQueueCallNotification(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 
        ============================================================
        SUB-TAB 1: CITIZEN OPD & EMERGENCY REQUESTS INTAKE DESK
        ============================================================
      */}
      {activeSubTab === 'requests' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Search & Filters Strip */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search citizen requests by token, name, phone, symptom..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Source Type + Urgency Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All Bookings' },
                { id: 'opd', label: 'OPD Appointments' },
                { id: 'ai_emergency', label: '🚨 AI Emergency Queue' }
              ].map(src => (
                <button
                  key={src.id}
                  onClick={() => setRequestSourceFilter(src.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                    requestSourceFilter === src.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {src.label}
                </button>
              ))}
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Urgency:
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'CRITICAL', label: '🚨 Critical' },
                { id: 'HIGH', label: 'High Urgency' },
                { id: 'MODERATE', label: 'Moderate' },
                { id: 'LOW', label: 'Low' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setPriorityFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    priorityFilter === f.id
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-3.5">
              {filteredRequests.map(req => {
                const isCrit = req.aiPriority === 'CRITICAL';
                const isHigh = req.aiPriority === 'HIGH';
                const isPending = req.status === 'Pending';
                const isInQueue = req.status === 'In Queue';
                const isCalled = req.status === 'Called';
                const isCompleted = req.status === 'Completed';
                const isDeclined = req.status === 'Declined';

                return (
                  <div
                    key={req.tokenNumber || req.requestId}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs hover:shadow-xs ${
                      isCrit && isPending
                        ? 'border-red-300 ring-2 ring-red-400/20 bg-gradient-to-r from-red-50/40 via-white to-white'
                        : isHigh && isPending
                        ? 'border-amber-300 bg-amber-50/20'
                        : isDeclined
                        ? 'border-rose-200/80 opacity-80'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Patient & Request Information */}
                      <div className="space-y-2 flex-1">
                        
                        {/* Token & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPending || !req.tokenNumber || req.tokenNumber.startsWith('AWAITING') || req.tokenNumber.startsWith('PENDING') ? (
                            <span className="px-3 py-1 rounded-xl font-mono text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              {req.requestId || 'Awaiting Approval (No Token Yet)'}
                            </span>
                          ) : isDeclined || req.tokenNumber === 'DECLINED' ? (
                            <span className="px-3 py-1 rounded-xl font-mono text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              Declined (No Token)
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-xl font-mono text-xs font-black shadow-2xs ${
                              isCrit
                                ? 'bg-red-600 text-white'
                                : isHigh
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-700 text-white'
                            }`}>
                              Token: {req.tokenNumber}
                            </span>
                          )}

                          {/* Urgency Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                            isCrit
                              ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : req.aiPriority === 'MODERATE'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isCrit && <Siren className="w-3 h-3 text-red-600" />}
                            {req.aiPriority || 'ROUTINE'} URGENCIES
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isInQueue
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isCalled
                              ? 'bg-purple-100 text-purple-800 border border-purple-300 font-extrabold animate-bounce'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {req.status}
                          </span>

                          <span className="text-xs text-slate-400 font-medium ml-auto sm:ml-0">
                            Booked: {req.bookedAt || 'Recently'}
                          </span>
                        </div>

                        {/* Patient Name & Details */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-black text-slate-900">
                            {req.patientName}
                          </h3>
                          <span className="text-xs text-slate-500 font-bold">
                            &bull; {req.patientAge ? `Age: ${req.patientAge}` : (req.patientAgeGender || 'Adult')}
                          </span>
                          {req.bloodGroup && (
                            <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              🩸 {req.bloodGroup}
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {req.patientMobile}
                          </span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                            {req.department}
                          </span>
                        </div>

                        {/* Date, Time Slot & Symptoms / Purpose filled by Patient */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center gap-3 flex-wrap text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200/70">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              Date: {req.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              Slot: {req.timeSlot}
                            </span>
                          </div>
                          <div className="text-slate-800 font-semibold flex items-start gap-1.5">
                            <span className="font-bold text-slate-400 shrink-0">Purpose:</span>
                            <span>{req.purpose}</span>
                          </div>
                          {req.symptomsDescription && (
                            <div className="text-slate-700 flex items-start gap-1.5">
                              <span className="font-bold text-slate-400 shrink-0">Symptoms:</span>
                              <span>{req.symptomsDescription}</span>
                            </div>
                          )}

                          {req.vitals && (
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 flex-wrap pt-0.5">
                              {req.vitals.temp && (
                                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  Temp: <strong className="text-slate-800">{req.vitals.temp}°C</strong>
                                </span>
                              )}
                              {req.vitals.heartRate && (
                                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  HR: <strong className="text-slate-800">{req.vitals.heartRate} bpm</strong>
                                </span>
                              )}
                              {req.vitals.spo2 && (
                                <span className={`px-2 py-0.5 rounded-md border ${
                                  req.vitals.spo2 < 94 ? 'bg-red-50 border-red-200 text-red-800 font-black' : 'bg-white border-slate-200 text-slate-800'
                                }`}>
                                  SpO2: <strong>{req.vitals.spo2}%</strong>
                                </span>
                              )}
                              {req.vitals.painLevel !== undefined && (
                                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  Pain: <strong className="text-orange-600">{req.vitals.painLevel}/10</strong>
                                </span>
                              )}
                              {req.vitals.breathingDifficulty === 'yes' && (
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-black">
                                  Dyspnea: YES
                                </span>
                              )}
                            </div>
                          )}

                          {/* Allocated Physician Strip if available */}
                          {req.doctorName && req.doctorName !== 'Pending Doctor Allocation' && (
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1 border-t border-slate-200/60">
                              <span className="flex items-center gap-1 text-blue-700">
                                <Stethoscope className="w-3.5 h-3.5" />
                                {req.doctorName}
                              </span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {req.counterNumber || 'OPD Desk'}
                              </span>
                            </div>
                          )}

                          {/* Decline Reason Callout */}
                          {req.declineReason && (
                            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>Decline Reason: <strong>{req.declineReason}</strong></span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right: Hospital Staff Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenDoctorAllocationModal(req)}
                              className={`px-4 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isCrit
                                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/25 animate-pulse'
                                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                              }`}
                            >
                              <UserCheck className="w-4 h-4 stroke-[2.5]" />
                              <span>{isCrit ? 'Approve & Issue Token (அவசரம்)' : 'Approve & Issue Token'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRequestForDecline(req);
                                setCustomDeclineNotes('');
                              }}
                              className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline Request</span>
                            </button>
                          </>
                        )}

                        {isInQueue && (
                          <>
                            <button
                              onClick={() => handleCallPatient(req)}
                              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Volume2 className="w-4 h-4" />
                              <span>Call Patient (அழைக்க)</span>
                            </button>

                            <button
                              onClick={() => handleCompleteConsultation(req)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Complete Consultation</span>
                            </button>
                          </>
                        )}

                        {isCalled && (
                          <button
                            onClick={() => handleCompleteConsultation(req)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Completed (முடிந்தது)</span>
                          </button>
                        )}

                        {isCompleted && (
                          <div className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Consultation Done</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No Citizen Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No appointment or emergency queue requests match your current filters for {hospital.name}.
              </p>
            </div>
          )}

        </div>
      )}

      {/* 
        ============================================================
        SUB-TAB 2: HOSPITAL PUBLIC TRANSPARENCY PREVIEW
        What citizens see specifically when browsing this hospital
        ============================================================
      */}
      {activeSubTab === 'transparency' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                Live Citizen Transparency Dashboard for {hospital.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                பொதுமக்கள் பார்வைக்கான நேரலை படுக்கைகள், மருத்துவர்கள் மற்றும் அவசர சேவை விவரங்கள்.
              </p>
            </div>

            {/* Live Beds Matrix Preview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Total Beds</span>
                  <Bed className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-950 mt-1">
                  {hospital.totalBeds || 1750}
                </div>
                <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                  &bull; {hospital.readyBeds || (hospital as any).availableBeds || 432} Available Now
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>ICU Ready Beds</span>
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-950 mt-1">
                  {hospital.icuAvailable || 54}
                </div>
                <div className="text-[11px] font-bold text-purple-700 mt-0.5">
                  &bull; 24x7 Critical Care Ready
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <span>Ventilators</span>
                  <Activity className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-teal-950 mt-1">
                  {hospital.ventilatorsAvailable || 40}
                </div>
                <div className="text-[11px] font-bold text-teal-700 mt-0.5">
                  &bull; Calibrated &amp; Online
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                <div className="flex items-center justify-between text-xs font-bold text-orange-900">
                  <span>OPD Queue Wait</span>
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-black text-orange-950 mt-1">
                  ~14 Mins
                </div>
                <div className="text-[11px] font-bold text-orange-700 mt-0.5">
                  &bull; Avg consult time 6 mins
                </div>
              </div>
            </div>

            {/* Doctors on Duty Today */}
            <div className="space-y-3 pt-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Specialist Physicians on Duty Today:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Dr. Sundaramoorthy M.', spec: 'Senior Consultant - General Medicine', exp: '18 Yrs Exp', status: 'Available in OPD Room 104' },
                  { name: 'Dr. Arun Kumar', spec: 'Emergency Casualty Lead', exp: '12 Yrs Exp', status: 'On Red Bay Triage' },
                  { name: 'Dr. Shalini R.', spec: 'Pulmonology Specialist', exp: '14 Yrs Exp', status: 'Pulmonary Counter 2' },
                  { name: 'Dr. Rajesh K.', spec: 'Orthopedic Surgeon', exp: '15 Yrs Exp', status: 'OPD Room 202' },
                  { name: 'Dr. Vasanth Kumar', spec: 'Chief Medical Officer', exp: '22 Yrs Exp', status: 'Clinical Operations' },
                  { name: 'Dr. Priya D.', spec: 'Pediatric Care Specialist', exp: '10 Yrs Exp', status: 'Maternity & Child Bay' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-black text-xs text-slate-900">{doc.name}</div>
                    <div className="text-[11px] font-bold text-purple-700">{doc.spec}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{doc.exp}</span>
                      <span className="text-emerald-700 font-bold">{doc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helplines & Emergency Support Strip */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Government Hospital Transparency Registry
                </span>
                <div className="text-xs font-bold text-slate-300">
                  All OPD consultation slips &amp; doctor prescriptions verified under Chief Minister's Comprehensive Health Insurance (CMCHIS).
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-black flex items-center gap-1.5 border border-white/15">
                  <PhoneCall className="w-3.5 h-3.5 text-orange-400" />
                  <span>24x7 Casualty: {hospital.emergencyContact || '044-25305112'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ============================================================
        SUB-TAB 3: OPD COUNTER & TOKEN DISPATCH DESK
        ============================================================
      */}
      {activeSubTab === 'live_queue' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                Live OPD Token Dispatch &amp; Counter Display
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                மருத்துவமனை கவுண்டர் ஒலிபெருக்கி அழைப்பு மற்றும் டோக்கன் முன்னேற்றப் பலகை.
              </p>
            </div>

            {/* Counter Big Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-3xl bg-slate-900 text-white text-center space-y-3 shadow-lg">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
                  NOW SERVING AT COUNTER (தற்போதைய டோக்கன்)
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white py-2">
                  C-021
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Patient: Murugesan P. &bull; Room 104 (General Medicine)
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-purple-50 border border-purple-200 text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-purple-700 block">
                  NEXT IN LINE (அடுத்த டோக்கன்)
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-purple-950 py-2">
                  {requests.find(r => r.status === 'In Queue')?.tokenNumber || 'TK-022'}
                </div>
                <div className="text-xs font-bold text-purple-800">
                  {requests.find(r => r.status === 'In Queue')?.patientName || 'Waiting in Queue Area'}
                </div>
              </div>

            </div>

            {/* Quick Advance Button */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => {
                  const nextInQueue = requests.find(r => r.status === 'In Queue');
                  if (nextInQueue) {
                    handleCallPatient(nextInQueue);
                  } else {
                    alert('No patients currently waiting in queue.');
                  }
                }}
                className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>Call Next Token to Desk (அடுத்த டோக்கனை அழைக்க)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ============================================================
        DOCTOR & ROOM ALLOCATION MODAL (Image / User requirement)
        ============================================================
      */}
      {selectedRequestForDoctorAllocation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                  selectedRequestForDoctorAllocation.aiPriority === 'CRITICAL'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {selectedRequestForDoctorAllocation.aiPriority === 'CRITICAL' ? (
                    <Siren className="w-5 h-5 animate-pulse" />
                  ) : (
                    <UserCheck className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedRequestForDoctorAllocation.aiPriority === 'CRITICAL'
                      ? 'Critical Emergency Intake & Doctor Allocation'
                      : 'Accept Request & Allocate Doctor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hospital: <strong>{hospital.name}</strong> &bull; Patient: <strong>{selectedRequestForDoctorAllocation.patientName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForDoctorAllocation(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Urgency Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Urgency Level:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black text-white ${
                  selectedRequestForDoctorAllocation.aiPriority === 'CRITICAL'
                    ? 'bg-red-600 animate-pulse'
                    : selectedRequestForDoctorAllocation.aiPriority === 'HIGH'
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}>
                  {selectedRequestForDoctorAllocation.aiPriority || 'MODERATE'}
                </span>
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-bold">Reported Symptoms: </span>
                <span>{selectedRequestForDoctorAllocation.purpose}</span>
              </div>
            </div>

            {/* Select Duty Doctor */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Select Duty Doctor (மருத்துவரைத் தேர்ந்தெடுக்கவும்):
              </label>
              <select
                value={allocatedDoctorChoice}
                onChange={e => setAllocatedDoctorChoice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="Dr. Sundaramoorthy M. (Senior Consultant)">Dr. Sundaramoorthy M. (Senior Consultant - Cardiology/Medicine)</option>
                <option value="Dr. Arun Kumar (Emergency Casualty Lead)">Dr. Arun Kumar (Emergency Casualty Lead)</option>
                <option value="Dr. Shalini R. (Pulmonology Specialist)">Dr. Shalini R. (Pulmonology Specialist)</option>
                <option value="Dr. Rajesh K. (General Medicine Duty Head)">Dr. Rajesh K. (General Medicine Duty Head)</option>
                <option value="Dr. Vasanth Kumar (Chief Medical Officer)">Dr. Vasanth Kumar (Chief Medical Officer)</option>
              </select>
            </div>

            {/* Select Room / Bay */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-orange-600" />
                Assign Triage Room / Bay (அறை / பிரிவு):
              </label>
              <select
                value={allocatedRoomChoice}
                onChange={e => setAllocatedRoomChoice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="Red Bay 1 (Emergency Resuscitation)">Red Bay 1 (Emergency Resuscitation & ICU Bay)</option>
                <option value="Casualty Room 4 (Acute Assessment)">Casualty Room 4 (Acute Assessment)</option>
                <option value="Priority Triage Counter 1">Priority Triage Counter 1 (Fast-Track)</option>
                <option value="OPD Counter 3 (General Consultation)">OPD Counter 3 (General Consultation)</option>
              </select>
            </div>

            {/* Generated Token Preview */}
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-purple-800 font-extrabold uppercase block">Official Approved Patient Token:</span>
                <span className="text-base font-black font-mono text-purple-950">{allocatedTokenPreview}</span>
              </div>
              <span className="px-2 py-1 rounded-lg bg-white text-[10px] font-black text-purple-700 border border-purple-200">
                Hospital Assigned
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestForDoctorAllocation(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDoctorAllocation}
                className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md cursor-pointer transition-colors flex items-center gap-2 ${
                  selectedRequestForDoctorAllocation.aiPriority === 'CRITICAL'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Approve &amp; Issue {allocatedTokenPreview}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 
        ============================================================
        HOSPITAL DECLINE REASON MODAL
        ============================================================
      */}
      {selectedRequestForDecline && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Decline Appointment Request
                  </h3>
                  <div className="text-xs text-slate-500">
                    {hospital.name} &bull; {selectedRequestForDecline.requestId || selectedRequestForDecline.patientName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForDecline(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                Select Decline Reason (காரணம் தேர்வு செய்யவும்):
              </label>

              <div className="space-y-2">
                {[
                  'Doctor is currently called for emergency surgery in OT. Please choose an afternoon session.',
                  'Specialty OPD consultation capacity is full for the selected morning session.',
                  'Selected duty physician is on emergency leave / ICU rounds. Please re-apply for Dr. Sundaramoorthy M.',
                  'Department outpatient triage recommends preliminary clinical evaluation first.'
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDeclineReasonPreset(reason);
                      setCustomDeclineNotes('');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer flex items-start gap-2.5 ${
                      declineReasonPreset === reason && !customDeclineNotes
                        ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-rose-400 flex items-center justify-center mt-0.5 shrink-0 text-[10px]">
                      {declineReasonPreset === reason && !customDeclineNotes ? '●' : ''}
                    </span>
                    <span>{reason}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Or enter specific instructions for patient:
                </label>
                <textarea
                  rows={2}
                  value={customDeclineNotes}
                  onChange={e => setCustomDeclineNotes(e.target.value)}
                  placeholder="Type specific guidance or rescheduling recommendation..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestForDecline(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Confirm Decline (நிராகரிப்பை உறுதிசெய்)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
