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
  AlertCircle
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
    <div className="min-h-screen bg-linear-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0A2568] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      
      {/* SPLIT CARD CONTAINER */}
      <div className="w-full max-w-5xl bg-[#1A56DB] rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col lg:flex-row min-h-[600px]">
        
        {/* LEFT PANEL: BLUE BRAND HERO SECTION */}
        <div className="lg:w-[35%] bg-linear-to-b from-[#1A56DB] via-[#1E40AF] to-[#0D2259] p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="w-16 h-16 rounded-2xl bg-white text-[#1A56DB] flex items-center justify-center shadow-lg relative z-10">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="w-2.5 h-8 bg-[#1A56DB] rounded-xs absolute" />
                <div className="w-8 h-2.5 bg-[#1A56DB] rounded-xs absolute" />
              </div>
            </div>

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
                <span>Unique Hospital ID (Hos_Id-XXX)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Live ICU & Oxygen Resource Registry</span>
              </div>
            </div>
          </div>

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

        {/* RIGHT PANEL: SWEEPING WHITE CURVED CARD */}
        <div className="lg:w-[65%] bg-white rounded-t-[36px] lg:rounded-t-none lg:rounded-l-[54px] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative shadow-xl text-slate-800">
          
          <div>
            {/* TOP RIGHT SWITCHER PILL (Hospital | Patient) */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex items-center p-1 rounded-full border-2 border-[#1A56DB] bg-slate-50 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPortal('hospital');
                    setLoginError(null);
                  }}
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
                  onClick={() => {
                    setSelectedPortal('patient');
                    setLoginError(null);
                  }}
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
            <div className="text-center mb-6 sm:mb-7">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedPortal === 'hospital' ? 'Hospital Access Portal' : 'Patient Login'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {selectedPortal === 'hospital'
                  ? 'புதிய மருத்துவமனை பதிவு அல்லது Hospital ID நுழைவு • New Registration & Existing Hospital Login'
                  : 'நோயாளி உள்நுழைவு • Citizen Care & OPD Queue Portal Login'}
              </p>
            </div>

            {/* HOSPITAL SIDE: 2 OPTIONS (New Hospital Registration + Hospital Login) */}
            {selectedPortal === 'hospital' ? (
              <div className="space-y-4">
                
                {/* Option 1: New Hospital Registration */}
                <div
                  onClick={() => {
                    setHospitalMode('register');
                    setLoginError(null);
                  }}
                  onDoubleClick={onSelectHospital}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    hospitalMode === 'register'
                      ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                        hospitalMode === 'register'
                          ? 'bg-[#1A56DB] text-white'
                          : 'bg-blue-50 text-[#1A56DB]'
                      }`}>
                        <Building2 className="w-5 h-5 stroke-[2.2]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            New Hospital Registration
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                            Generates Hos_Id-XXX
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          Onboard a new hospital facility &amp; generate your official Hospital ID
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Registers facility in MediSync Admin, saves your unique Hospital ID in Hospital Settings, and activates clinical dashboards.
                        </p>
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors mt-1 ${
                      hospitalMode === 'register'
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Option 2: Hospital Login (For Already Registered Hospitals) */}
                <div
                  onClick={() => setHospitalMode('login')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    hospitalMode === 'login'
                      ? 'border-[#1A56DB] bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                        hospitalMode === 'login'
                          ? 'bg-[#1A56DB] text-white'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <LogIn className="w-5 h-5 stroke-[2.2]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            Hospital Login
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Already Registered
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          Already registered and logged out? Sign back in with your Hospital ID
                        </p>

                        {/* Expanded Hospital ID Login Form */}
                        {hospitalMode === 'login' && (
                          <form
                            onSubmit={(e) => handleHospitalIdLogin(e)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-4 pt-3 border-t border-blue-200/70 space-y-3"
                          >
                            {loginError && (
                              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{loginError}</span>
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Enter Hospital ID <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={hospitalIdInput}
                                  onChange={(e) => setHospitalIdInput(e.target.value)}
                                  placeholder="e.g. Hos_Id-345"
                                  autoFocus
                                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                                />
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Secured verification: Check your Hospital ID in Hospital Settings or MediSync Admin.</span>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors mt-1 ${
                      hospitalMode === 'login'
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* PATIENT SIDE (2nd Image): Touching Patient shows Patient Login cleanly */
              <div className="space-y-4">
                <div
                  onClick={onSelectPatient}
                  className="p-6 rounded-2xl border-2 border-[#1A56DB] bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20 cursor-pointer hover:bg-blue-50/70 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900">
                            Patient Login (நோயாளி நுழைவு)
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700">
                            Citizens &amp; Patients
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          Sign in with Google or Email to access Find Hospitals, Appointments, Queue &amp; Medical History
                        </p>

                        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-purple-700">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Supports Personal Google Login &amp; Multiple Accounts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ROW: SECURITY NOTE & ACTION BUTTON */}
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
              disabled={isLoggingIn}
              className="px-8 py-3 rounded-full bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
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
  );
};
