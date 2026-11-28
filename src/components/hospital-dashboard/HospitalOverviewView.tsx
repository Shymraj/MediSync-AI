import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  PhoneCall, 
  ShieldCheck, 
  Stethoscope, 
  HeartHandshake, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Activity, 
  Bed, 
  Users, 
  Globe, 
  Calendar, 
  Layers, 
  Clock, 
  ArrowRight,
  Sparkles,
  FileText,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  isMatchingHospital,
  OPD_REQUESTS_STORAGE_KEY,
  OPD_UPDATE_EVENT
} from '../../utils/hospitalSync';

interface HospitalOverviewViewProps {
  onSelectRole: (role: 'doctor' | 'nurse' | 'admin' | 'patient') => void;
  isAdminUnlocked: boolean;
  activeTab?: string;
}

export const HospitalOverviewView: React.FC<HospitalOverviewViewProps> = ({
  onSelectRole,
  isAdminUnlocked,
  activeTab = 'dashboard'
}) => {
  const { user, tempOnboarding } = useApp();

  const hospitalId = tempOnboarding.hospitalId || user?.hospitalId || tempOnboarding.registrationNumber || 'Hos_Id-101';
  const hospitalName = tempOnboarding.hospitalName || user?.hospitalName || 'Rajiv Gandhi Government General Hospital (RGGGH)';

  const [incomingStats, setIncomingStats] = useState({ total: 0, pending: 0, aiCritical: 0 });

  useEffect(() => {
    const syncIncoming = () => {
      try {
        const raw = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const mine = parsed.filter((r: any) => isMatchingHospital(r, hospitalId, hospitalName));
            setIncomingStats({
              total: mine.length,
              pending: mine.filter((r: any) => r.status === 'Pending').length,
              aiCritical: mine.filter((r: any) => r.aiPriority && r.status === 'Pending').length
            });
            return;
          }
        }
      } catch {}
      setIncomingStats({ total: 0, pending: 0, aiCritical: 0 });
    };
    syncIncoming();
    window.addEventListener('storage', syncIncoming);
    window.addEventListener(OPD_UPDATE_EVENT, syncIncoming);
    const interval = setInterval(syncIncoming, 3000);
    return () => {
      window.removeEventListener('storage', syncIncoming);
      window.removeEventListener(OPD_UPDATE_EVENT, syncIncoming);
      clearInterval(interval);
    };
  }, [hospitalId, hospitalName]);
  const registrationNumber = tempOnboarding.registrationNumber || 'TN-MED-REG-2026-8941';
  const hospitalType = tempOnboarding.hospitalType || 'Government Teaching Hospital';
  const ownership = tempOnboarding.ownership || 'Government';
  const category = tempOnboarding.category || 'Super speciality';
  const yearEstablished = tempOnboarding.yearEstablished || '1664';
  const districtName = tempOnboarding.districtName || user?.districtName || 'Chennai';
  const hospitalAddress = tempOnboarding.hospitalAddress || 'EVR Periyar Salai, Park Town';
  const areaLocality = tempOnboarding.areaLocality || 'Park Town';
  const pincode = tempOnboarding.pincode || '600003';
  const hospitalPhone = tempOnboarding.hospitalPhone || '+91 44 2530 5000';
  const hospitalEmail = tempOnboarding.hospitalEmail || 'contact.rgggh@medisync.tn.gov.in';
  const emergencyContact = tempOnboarding.emergencyContact || '044-25305112';
  const description = tempOnboarding.hospitalDescription || 'Premier tertiary care general hospital affiliated to state healthcare resource monitoring network with 24x7 trauma triage.';
  const website = tempOnboarding.website || 'https://rgggh.tn.gov.in';

  return (
    <div className="space-y-6">
      
      {/* 
        ============================================================
        1. HOSPITAL IDENTITY HERO CARD
        ============================================================
      */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        
        {/* Subtle decorative gradient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-br from-[#1A56DB] to-[#1E40AF] text-white flex items-center justify-center shrink-0 shadow-md">
              <Building2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                  {ownership} &bull; {category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified & Active Node
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {hospitalName}
              </h1>

              <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                <span className="flex items-center gap-1 text-slate-700 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                  {registrationNumber}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {areaLocality}, {districtName} - {pincode}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Est. {yearEstablished}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency 24x7 Helpline Box */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                24x7 Emergency Helpline
              </span>
              <span className="text-sm sm:text-base font-black text-red-700 font-mono">
                {emergencyContact}
              </span>
              <span className="text-[10px] text-red-500 block">Trauma & ICU Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        2. HOSPITAL OPERATIONAL METRICS BAR
        ============================================================
      */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Beds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
            <Bed className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bed Capacity</div>
            <div className="text-2xl font-black text-slate-900 font-mono">250</div>
            <div className="text-[11px] text-emerald-600 font-semibold">48 Ready for Intake</div>
          </div>
        </div>

        {/* ICU */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical ICU Beds</div>
            <div className="text-2xl font-black text-slate-900 font-mono">35</div>
            <div className="text-[11px] text-emerald-600 font-semibold">7 Immediate Bays Available</div>
          </div>
        </div>

        {/* Ventilators */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mechanical Ventilators</div>
            <div className="text-2xl font-black text-slate-900 font-mono">12</div>
            <div className="text-[11px] text-purple-600 font-semibold">10 Calibrated & Online</div>
          </div>
        </div>

        {/* Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff On Duty</div>
            <div className="text-2xl font-black text-slate-900 font-mono">60</div>
            <div className="text-[11px] text-slate-500 font-medium">18 Doctors &bull; 42 Nurses</div>
          </div>
        </div>
      </div>

      {/* Live Incoming Citizen OPD & AI Queue Requests strictly for this Hospital */}
      <div className="bg-linear-to-r from-purple-50 via-white to-blue-50 rounded-3xl p-5 sm:p-6 border border-purple-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                Patient Portal &amp; AI Queue Intake &bull; {hospitalName}
              </span>
              {incomingStats.pending > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {incomingStats.pending} Pending Approval
                </span>
              )}
              {incomingStats.aiCritical > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                  {incomingStats.aiCritical} AI Priority Requests
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {incomingStats.total > 0
                ? `${incomingStats.total} patient booking(s) received directly from ${hospitalName}'s Patient Portal.`
                : `No patient OPD or AI Queue requests yet for ${hospitalName}. Bookings made in ${hospitalName}'s Patient Portal appear here exclusively.`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectRole('patient')}
          className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <span>Open Patient Portal Desk ({incomingStats.pending} Pending)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 
        ============================================================
        3. THE 3 PORTAL ACCESS HUBS (Doctor, Nurse, Hospital Admin)
        ============================================================
      */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Hospital Role Portals & Workspaces</h2>
            <p className="text-xs text-slate-500">மருத்துவமனை பிரிவுகள் • Select a portal to enter clinical or administrative workspaces</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Doctor Portal Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
                <Stethoscope className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Doctor Portal</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Physician
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Clinical workspace — Emergency patient triage intake, assigned ward monitoring, and urgent ICU bed requests.
              </p>
            </div>

            <button
              onClick={() => onSelectRole('doctor')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Doctor Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Nurse Portal Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Nurse Portal</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800">
                  Ward Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Ward operations — 6-stage bed turnaround tracking, sanitization checklist, and shift handover logging.
              </p>
            </div>

            <button
              onClick={() => onSelectRole('nurse')}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Nurse Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Hospital Admin Portal Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4 shadow-2xs">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Hospital Admin</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1A56DB] flex items-center gap-1">
                  {isAdminUnlocked ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-blue-600" />}
                  {isAdminUnlocked ? 'Unlocked' : 'Protected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Hospital Command Center — Master bed control, clinical staff verification, resource approval & telemetry.
              </p>
            </div>

            <button
              onClick={() => onSelectRole('admin')}
              className="w-full py-3 px-4 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isAdminUnlocked ? (
                <>
                  <span>Open Admin Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Hospital Admin (admin123)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        4. REGISTERED FACILITY DETAILS & DOSSIER
        ============================================================
      */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Registered Facility Information & Contact Dossier</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Official registration details recorded in the state health resource registry</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
            Node: {districtName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Section 1: Address & Location */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location & Address
            </h4>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Address</span>
              <span className="font-semibold text-slate-800 leading-snug block">{hospitalAddress}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Area / Locality</span>
              <span className="font-semibold text-slate-800">{areaLocality}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Postal PIN Code</span>
              <span className="font-semibold text-slate-800 font-mono">{pincode}</span>
            </div>
          </div>

          {/* Section 2: Contact Numbers */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Information
            </h4>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Phone</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" /> {hospitalPhone}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Email</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3 h-3 text-slate-400" /> {hospitalEmail}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-red-500 font-bold uppercase block">Emergency 24x7</span>
              <span className="font-bold text-red-600 flex items-center gap-1 mt-0.5">
                <PhoneCall className="w-3 h-3" /> {emergencyContact}
              </span>
            </div>
          </div>

          {/* Section 3: Facility Metadata */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Facility Profile
            </h4>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Type</span>
              <span className="font-semibold text-slate-800">{hospitalType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Category & Ownership</span>
              <span className="font-semibold text-slate-800">{category} &bull; {ownership}</span>
            </div>
            {website && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Website</span>
                <a href={website} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-0.5 truncate">
                  <Globe className="w-3 h-3" /> {website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
