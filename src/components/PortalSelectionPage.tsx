import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';

interface PortalSelectionPageProps {
  onSelectHospital: () => void;
  onSelectPatient: () => void;
  onBackToHome: () => void;
}

export const PortalSelectionPage: React.FC<PortalSelectionPageProps> = ({
  onSelectHospital,
  onSelectPatient,
  onBackToHome
}) => {
  const [selectedPortal, setSelectedPortal] = useState<'hospital' | 'patient'>('hospital');

  const handleProceed = () => {
    if (selectedPortal === 'hospital') {
      onSelectHospital();
    } else {
      onSelectPatient();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0A2568] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      
      {/* 
        ============================================================
        SPLIT CARD CONTAINER
        - Left: Blue Gradient Brand section with Cross Icon & Tagline
        - Right: Sweeping White Curved Card with Toggle & Portals
        ============================================================
      */}
      <div className="w-full max-w-5xl bg-[#1A56DB] rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col lg:flex-row min-h-[600px]">
        
        {/* ======================================================== */}
        {/* LEFT PANEL: BLUE BRAND HERO SECTION                      */}
        {/* ======================================================== */}
        <div className="lg:w-[35%] bg-linear-to-b from-[#1A56DB] via-[#1E40AF] to-[#0D2259] p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          
          {/* Subtle background glow circle */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Square Logo with Medical Cross */}
            <div className="w-16 h-16 rounded-2xl bg-white text-[#1A56DB] flex items-center justify-center shadow-lg relative z-10">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="w-2.5 h-8 bg-[#1A56DB] rounded-xs absolute" />
                <div className="w-8 h-2.5 bg-[#1A56DB] rounded-xs absolute" />
              </div>
            </div>

            {/* Title & Tagline */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-10 leading-tight">
              Welcome to<br />
              <span className="text-blue-200">MediSync AI</span>
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 mt-4 leading-relaxed font-medium">
              A way to Digital Transformation of HealthCare Providers & Operational Readiness
            </p>

            <div className="mt-8 space-y-2 hidden sm:block text-[11px] text-blue-200/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Government & Multi-Speciality Network</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Live ICU & Oxygen Resource Registry</span>
              </div>
            </div>
          </div>

          {/* Bottom Button (Login / Back to Home) */}
          <div className="mt-8 lg:mt-auto pt-4 relative z-10">
            <button
              onClick={onBackToHome}
              className="px-7 py-2.5 rounded-full bg-white text-[#1A56DB] font-extrabold text-xs shadow-md hover:bg-blue-50 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: SWEEPING WHITE CURVED CARD                  */}
        {/* ======================================================== */}
        <div className="lg:w-[65%] bg-white rounded-t-[36px] lg:rounded-t-none lg:rounded-l-[54px] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative shadow-xl text-slate-800">
          
          <div>
            {/* 
              --------------------------------------------------------
              TOP RIGHT SWITCHER PILL (Hospital | Patient)
              --------------------------------------------------------
            */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex items-center p-1 rounded-full border-2 border-[#1A56DB] bg-slate-50 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedPortal('hospital')}
                  className={`px-5 sm:px-6 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedPortal === 'hospital'
                      ? 'bg-[#1A56DB] text-white shadow-xs'
                      : 'text-[#1A56DB] hover:bg-blue-50'
                  }`}
                >
                  Hospital
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPortal('patient')}
                  className={`px-5 sm:px-6 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedPortal === 'patient'
                      ? 'bg-[#1A56DB] text-white shadow-xs'
                      : 'text-[#1A56DB] hover:bg-blue-50'
                  }`}
                >
                  Patient
                </button>
              </div>
            </div>

            {/* Dynamic Center Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedPortal === 'hospital' ? 'Apply as a Hospital' : 'Patient Care Portal'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {selectedPortal === 'hospital'
                  ? 'மருத்துவமனை பதிவு மற்றும் பணியாளர் நுழைவு • Institutional Registration & Staff Portal'
                  : 'நோயாளி பராமரிப்பு மற்றும் அப்பாயிண்ட்மெண்ட் • Citizen Care & Emergency OPD Portal'}
              </p>
            </div>

            {/* 
              --------------------------------------------------------
              OUR MEDISYNC LAYOUT CARDS ("matha padi nama layout")
              --------------------------------------------------------
            */}
            <div className="space-y-4">
              {/* 1. Hospital Registration Card */}
              <div
                onClick={() => {
                  setSelectedPortal('hospital');
                }}
                onDoubleClick={onSelectHospital}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedPortal === 'hospital'
                    ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                      selectedPortal === 'hospital'
                        ? 'bg-[#1A56DB] text-white'
                        : 'bg-blue-50 text-[#1A56DB]'
                    }`}>
                      <Building2 className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          Hospital Registration
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                          Staff & Clinical
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Doctors, Nurses & Hospital Administrators
                      </p>

                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Facility onboarding, district hospital network affiliation, ICU bed control, and role clearance.
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[10px] font-semibold text-blue-700">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Institutional Google SSO Verification
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors mt-1 ${
                    selectedPortal === 'hospital'
                      ? 'bg-[#1A56DB] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 2. Patient Portal Card */}
              <div
                onClick={() => {
                  setSelectedPortal('patient');
                }}
                onDoubleClick={onSelectPatient}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedPortal === 'patient'
                    ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                      selectedPortal === 'patient'
                        ? 'bg-[#1A56DB] text-white'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      <User className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          Patient Care Portal
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700">
                          Citizens & Patients
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Instant Access & Family Caregivers
                      </p>

                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Verified hospital readiness, live OPD token tracking, appointments, and trauma center hotline.
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[10px] font-semibold text-purple-700">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Direct Single-Click Google Login (Zero Onboarding)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors mt-1 ${
                    selectedPortal === 'patient'
                      ? 'bg-[#1A56DB] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 
            --------------------------------------------------------
            BOTTOM ROW: SECURITY NOTE & VIBRANT REGISTER BUTTON
            --------------------------------------------------------
          */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>OAuth 2.0 Institutional Security</span>
              <a
                href="#/admin-login"
                className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors ml-2 font-semibold"
                title="MediSync Super Admin Platform Login"
              >
                &bull; MediSync Admin
              </a>
            </div>

            <button
              onClick={handleProceed}
              className="px-8 py-3 rounded-full bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>
                {selectedPortal === 'hospital' ? 'Register Hospital' : 'Enter Patient Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
