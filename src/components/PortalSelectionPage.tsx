import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  LogIn,
  KeyRound,
  AlertCircle,
  Activity,
  HeartPulse,
  Lock,
  Layers,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SEED_HOSPITALS as MEDI_ADMIN_SEED_HOSPITALS, LOCAL_STORAGE_KEY as MEDI_ADMIN_CACHE_KEY } from '../medisync-admin/MediSyncAdminDashboard';

interface PortalSelectionPageProps {
  onSelectHospital: () => void;
  onHospitalLoginSuccess?: () => void;
  onSelectPatient: () => void;
  onBackToHome: () => void;
}

export const PortalSelectionPage: React.FC<PortalSelectionPageProps> = ({
  onSelectHospital,
  onHospitalLoginSuccess,
  onSelectPatient,
  onBackToHome
}) => {
  const { loginRegisteredHospital } = useApp();
  const [selectedPortal, setSelectedPortal] = useState<'hospital' | 'patient'>('hospital');
  const [hospitalMode, setHospitalMode] = useState<'register' | 'login'>('register');
  const [hospitalIdInput, setHospitalIdInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Private lookup against registered hospitals (never exposed publicly on UI)
  const registeredHospitals = useMemo(() => {
    try {
      const cached = localStorage.getItem(MEDI_ADMIN_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MEDI_ADMIN_SEED_HOSPITALS;
  }, []);

  const handleHospitalIdLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const cleanId = hospitalIdInput.trim().toLowerCase();

    if (!cleanId) {
      setLoginError('Please enter your Hospital ID (e.g. Hos_Id-345).');
      return;
    }

    const targetRec = registeredHospitals.find((h: any) => {
      return (
        (h.hospitalId && h.hospitalId.toLowerCase() === cleanId) ||
        (h.id && h.id.toLowerCase() === cleanId)
      );
    });

    if (!targetRec) {
      setLoginError('Invalid Hospital ID. Please check your Hos_Id-XXX or register a new hospital.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginRegisteredHospital(targetRec);
      setIsLoggingIn(false);
      if (onHospitalLoginSuccess) {
        onHospitalLoginSuccess();
      } else {
        window.location.hash = '#/hospital-dashboard';
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError(err?.message || 'Hospital login failed. Please try again.');
    }
  };

  const handleProceed = () => {
    if (selectedPortal === 'patient') {
      onSelectPatient();
    } else if (hospitalMode === 'register') {
      onSelectHospital();
    } else {
      handleHospitalIdLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#0F172A] font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-100 selection:text-blue-900">
      
      {/* Subtle Background Ambiance (Parity with Landing Page) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-6xl relative z-10 my-auto">
        
        {/* Top Navbar Bar Strip */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 px-1">
          {/* Logo & Return Link */}
          <button
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2.5 text-xs font-bold text-slate-600 hover:text-[#1A56DB] transition-colors cursor-pointer bg-white/80 hover:bg-white backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#1A56DB] group-hover:-translate-x-0.5 transition-all" />
            <span>Back to Public Portal</span>
          </button>

          {/* Institutional Trust Badge */}
          <div className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MediSync Clinical Node: <strong className="text-slate-800">Statewide Active</strong></span>
          </div>
        </div>

        {/* COMPREHENSIVE CARD (TWO-COLUMN EDITORIAL COMPOSITION) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN: BRAND & HEALTHCARE PLATFORM SHOWCASE */}
          <div className="lg:w-[38%] bg-linear-to-b from-[#F8FAFC] via-[#F1F5F9] to-blue-50/30 p-8 sm:p-10 lg:p-11 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between relative overflow-hidden">
            
            {/* Subtle decorative mesh watermark */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Brand Logo & Platform Pill */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1A56DB] text-white flex items-center justify-center shadow-md shadow-blue-600/20 ring-4 ring-blue-100">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <div className="w-2 h-6 bg-white rounded-xs absolute" />
                    <div className="w-6 h-2 bg-white rounded-xs absolute" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight text-[#0F172A] leading-tight flex items-center gap-1.5">
                    MediSync <span className="text-[#1A56DB]">AI</span>
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#1A56DB]">
                    Institutional Portal
                  </div>
                </div>
              </div>

              {/* Editorial Welcome Title */}
              <div className="mt-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1A56DB] border border-blue-200/80 mb-3 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#1A56DB]" /> Verified Healthcare Gateway
                </span>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
                  Welcome to <br className="hidden sm:inline" />
                  <span className="text-[#1A56DB]">MediSync AI</span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-3 leading-relaxed">
                  A way to Digital Transformation of HealthCare Providers &amp; Operational Readiness.
                </p>
              </div>

              {/* Healthcare Platform Value Pillars */}
              <div className="mt-7 space-y-3.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Unique Hospital ID (Hos_Id-XXX)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Persistent credential registered with statewide telemetry oversight.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Live ICU &amp; Oxygen Resource Registry</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Real-time bedside sync, ventilator matching, and 6-stage ward turnaround.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">OAuth 2.0 Institutional Security</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Encrypted role isolation adhering to clinical governance protocols.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Footnote */}
            <div className="mt-8 pt-5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> 50+ Connected Facilities
              </span>
              <span className="font-semibold text-slate-700">99.98% Telemetry Uptime</span>
            </div>
          </div>

          {/* RIGHT COLUMN: ACCESS INTERFACE & SELECTION */}
          <div className="lg:w-[62%] p-6 sm:p-9 lg:p-11 flex flex-col justify-between bg-white">
            
            <div>
              {/* TOP ROW: PORTAL SWITCHER (HOSPITAL vs PATIENT) */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 flex-wrap">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Authentication Gate
                  </span>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    Select your access domain
                  </div>
                </div>

                {/* Elegant Segmented Switcher */}
                <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPortal('hospital');
                      setLoginError(null);
                    }}
                    className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedPortal === 'hospital'
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Hospital</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPortal('patient');
                      setLoginError(null);
                    }}
                    className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedPortal === 'patient'
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Patient</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC SECTION HEADER */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {selectedPortal === 'hospital' ? 'Hospital Access Portal' : 'Patient Login'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedPortal === 'hospital'
                    ? 'புதிய மருத்துவமனை பதிவு அல்லது Hospital ID நுழைவு • New Registration & Existing Hospital Login'
                    : 'நோயாளி உள்நுழைவு • Citizen Care & OPD Queue Portal Login'}
                </p>
              </div>

              {/* HOSPITAL SIDE: INTERACTIVE CARDS */}
              {selectedPortal === 'hospital' ? (
                <div className="space-y-4">
                  
                  {/* OPTION 1: NEW HOSPITAL REGISTRATION */}
                  <div
                    onClick={() => {
                      setHospitalMode('register');
                      setLoginError(null);
                    }}
                    onDoubleClick={onSelectHospital}
                    className={`p-5 sm:p-5.5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      hospitalMode === 'register'
                        ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-2xs ${
                          hospitalMode === 'register'
                            ? 'bg-[#1A56DB] text-white ring-4 ring-blue-100'
                            : 'bg-blue-50 text-[#1A56DB] group-hover:bg-blue-100/70'
                        }`}>
                          <Building2 className="w-6 h-6 stroke-[2.2]" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#0F172A]">
                              New Hospital Registration
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100/80 text-[#1A56DB] border border-blue-200/80">
                              Generates Hos_Id-XXX
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-semibold mt-1">
                            Onboard a new hospital facility &amp; generate your official Hospital ID
                          </p>

                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Registers facility in MediSync Admin, saves your unique Hospital ID in Hospital Settings, and activates clinical dashboards.
                          </p>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all mt-1 ${
                        hospitalMode === 'register'
                          ? 'bg-[#1A56DB] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* OPTION 2: HOSPITAL LOGIN (ALREADY REGISTERED) */}
                  <div
                    onClick={() => setHospitalMode('login')}
                    className={`p-5 sm:p-5.5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      hospitalMode === 'login'
                        ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-2xs ${
                          hospitalMode === 'login'
                            ? 'bg-[#1A56DB] text-white ring-4 ring-blue-100'
                            : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100/70'
                        }`}>
                          <LogIn className="w-6 h-6 stroke-[2.2]" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#0F172A]">
                              Hospital Login
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-200/80">
                              Already Registered
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-semibold mt-1">
                            Already registered and logged out? Sign back in with your Hospital ID
                          </p>

                          {/* EXPANDED HOSPITAL ID LOGIN FORM */}
                          {hospitalMode === 'login' && (
                            <form
                              onSubmit={(e) => handleHospitalIdLogin(e)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-4 pt-3.5 border-t border-blue-200/70 space-y-3"
                            >
                              {loginError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                                  <span>{loginError}</span>
                                </div>
                              )}

                              <div>
                                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                                  Enter Hospital ID <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="text"
                                    value={hospitalIdInput}
                                    onChange={(e) => setHospitalIdInput(e.target.value)}
                                    placeholder="e.g. Hos_Id-345"
                                    autoFocus
                                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl font-mono font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-[#1A56DB] transition-all"
                                  />
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Secured verification: Check your Hospital ID in Hospital Settings or MediSync Admin.</span>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all mt-1 ${
                        hospitalMode === 'login'
                          ? 'bg-[#1A56DB] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* PATIENT SIDE: INTERACTIVE CARD */
                <div className="space-y-4">
                  <div
                    onClick={onSelectPatient}
                    className="p-6 sm:p-7 rounded-2xl border-2 border-[#1A56DB] bg-blue-50/40 shadow-sm ring-2 ring-blue-500/10 cursor-pointer hover:bg-blue-50/70 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 ring-4 ring-blue-100">
                          <User className="w-7 h-7 stroke-[2.2]" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-[#0F172A]">
                              Patient Login (நோயாளி நுழைவு)
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-100/90 text-purple-700 border border-purple-200">
                              Citizens &amp; Patients
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed">
                            Sign in with Google or Email to access Find Hospitals, Appointments, Queue &amp; Medical History
                          </p>

                          <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800 bg-purple-50/80 px-3 py-1 rounded-lg border border-purple-200/60">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Supports Personal Google Login &amp; Multiple Accounts</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs mt-1 group-hover:scale-105 transition-transform">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM ROW: SECURITY CREDITS & PRIMARY CTA */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#1A56DB]" />
                <span>OAuth 2.0 Institutional Security</span>
                <span className="text-slate-300">&bull;</span>
                <a
                  href="#/admin-login"
                  className="text-xs font-semibold text-slate-500 hover:text-[#1A56DB] transition-colors"
                  title="MediSync Super Admin Platform Login"
                >
                  MediSync Admin
                </a>
              </div>

              <button
                onClick={handleProceed}
                disabled={isLoggingIn}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#1A56DB] hover:bg-[#1648B8] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <span>
                  {selectedPortal === 'patient'
                    ? 'Go to Patient Login'
                    : hospitalMode === 'register'
                    ? 'Register Hospital'
                    : isLoggingIn
                    ? 'Logging In...'
                    : 'Login to Hospital'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
