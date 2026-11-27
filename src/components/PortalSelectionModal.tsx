import React from 'react';
import { 
  Building2, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Calendar, 
  Clock, 
  X,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface PortalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPortal: (portal: 'hospital' | 'patient') => void;
}

export const PortalSelectionModal: React.FC<PortalSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPortal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-[#1E293B] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A56DB] flex items-center justify-center text-white shadow-2xs">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              MediSync <span className="text-[#1A56DB]">AI</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Choose Your Access Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            தொடர விரும்பும் தளத்தைத் தேர்ந்தெடுக்கவும் &bull; Select your portal to continue
          </p>
        </div>

        {/* Portal Options Body */}
        <div className="p-6 space-y-4">
          {/* OPTION 1: Hospital Registration */}
          <div
            onClick={() => onSelectPortal('hospital')}
            className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-[#1A56DB] bg-white hover:bg-blue-50/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1A56DB] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#1A56DB] group-hover:text-white transition-all shadow-2xs">
                  <Building2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1A56DB] transition-colors">
                      Hospital Registration
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                      Staff & Clinical
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    For Medical Officers, Doctors, Ward Nurses & Hospital Administrators
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Register healthcare facility access, affiliate with district hospitals, manage ICU bed turnaround, and submit credentials for institutional clearance.
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Google SSO Verification
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Multi-Step Onboarding
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#1A56DB] group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 2: Patient Portal (kela) */}
          <div
            onClick={() => onSelectPortal('patient')}
            className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                  <User className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Patient Portal
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Direct Public Access
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    For Patients, Family Members & OPD Consultations
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Instant Google sign-in without medical staff clearance. View live hospital bed readiness, check OPD queue tokens, and book specialist consultations directly.
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant Direct Login
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> OPD Queue & Beds
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Official Tamil Nadu Healthcare Resource Network</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Lock className="w-3 h-3 text-slate-400" /> 256-Bit TLS Encryption
          </span>
        </div>
      </div>
    </div>
  );
};
