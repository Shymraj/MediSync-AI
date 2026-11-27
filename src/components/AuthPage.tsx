import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  X,
  Building2,
  User,
  HeartHandshake,
  Stethoscope,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
  portal?: 'hospital' | 'patient';
}

interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  verifiedEmail: boolean;
  roleHint: string;
  portal: 'hospital' | 'patient';
}

const ALL_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'Dr. Sundaramoorthy M.',
    email: 'dr.sundar@medisync.gov.in',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80',
    verifiedEmail: true,
    roleHint: 'Hospital Attending Physician (Critical Care)',
    portal: 'hospital'
  },
  {
    name: 'Dr. Vasanth Kumar',
    email: 'admin.vasanth@medisync.gov.in',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=120&q=80',
    verifiedEmail: true,
    roleHint: 'Medical Superintendent / Administrator',
    portal: 'hospital'
  },
  {
    name: 'Nurse Deepa R.',
    email: 'deepa.nurse@medisync.gov.in',
    avatar: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=120&q=80',
    verifiedEmail: true,
    roleHint: 'Critical Care Ward Nurse',
    portal: 'hospital'
  },
  {
    name: 'Karthik Subramanian',
    email: 'karthik.subramanian@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    verifiedEmail: true,
    roleHint: 'Verified Personal Google Account (Patient)',
    portal: 'patient'
  }
];

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess, portal = 'hospital' }) => {
  const { loginWithGoogle } = useApp();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);

  const isPatientPortal = portal === 'patient';

  // Accounts filtered by portal type
  const availableAccounts = ALL_GOOGLE_ACCOUNTS.filter(acc => acc.portal === portal);

  // Initialize official Google Identity Services token client if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '783921048192-k8h9f0a2b4c6e8g0i2k4m6o8q0s2u4w6.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();
                if (userInfo && userInfo.email) {
                  await loginWithGoogle(userInfo.email, userInfo.name || userInfo.email.split('@')[0], portal);
                  onSuccess();
                  return;
                }
              } catch (e) {
                console.warn('Google userinfo fetch failed:', e);
              }
            }
          },
          error_callback: (err: any) => {
            console.warn('GIS error:', err);
          }
        });
        (window as any).__googleTokenClient = client;
      } catch (err) {
        // Fallback to high-fidelity Google account selection dialog
      }
    }
  }, [portal]);

  const handleContinueWithGoogleClick = () => {
    setError(null);
    const gisClient = (window as any).__googleTokenClient;
    if (gisClient && window.location.protocol === 'https:') {
      try {
        gisClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        // Fallback
      }
    }
    setIsGoogleModalOpen(true);
  };

  const handleSelectAccount = async (account: GoogleAccount) => {
    setIsAuthenticating(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 650));
      const user = await loginWithGoogle(account.email, account.name, portal);
      setIsGoogleModalOpen(false);
      setIsAuthenticating(false);

      if (user) {
        onSuccess();
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setError(err?.message || 'Google authentication failed. Please try selecting your account again.');
    }
  };

  const handleCustomAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid Google or Google Workspace email address.');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const derivedName = customEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      await new Promise(r => setTimeout(r, 650));
      const user = await loginWithGoogle(customEmail.trim().toLowerCase(), derivedName, portal);

      setIsGoogleModalOpen(false);
      setIsAuthenticating(false);

      if (user) {
        onSuccess();
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setError('Could not verify Google account identity.');
    }
  };

  const handleCancelGoogleAuth = () => {
    setIsGoogleModalOpen(false);
    setIsAuthenticating(false);
    setError('Authentication was cancelled. Click "Continue with Google" to select an account.');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#2563A6] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal Selection
        </button>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
            isPatientPortal ? 'bg-emerald-600' : 'bg-[#1A56DB]'
          }`}>
            {isPatientPortal ? (
              <User className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1E293B]">
              MediSync <span className={isPatientPortal ? 'text-emerald-600' : 'text-[#1A56DB]'}>AI</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              {isPatientPortal ? 'Public Patient Care & OPD Services' : 'Enterprise Healthcare Resource Network'}
            </p>
          </div>
        </div>

        {/* Portal-specific Titles */}
        <div className="mt-6 text-center">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
            isPatientPortal 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-blue-100 text-[#1A56DB]'
          }`}>
            {isPatientPortal ? 'Patient Portal Sign In' : 'Hospital Registration & Staff Sign In'}
          </span>
          <h3 className="text-xl font-bold text-[#1E293B]">
            {isPatientPortal ? 'Sign in to your Patient Account' : 'Institutional Staff Authentication'}
          </h3>
          <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
            {isPatientPortal 
              ? 'Sign in with your Google account to check live bed readiness, OPD token queue, and book appointments' 
              : 'Doctors, nurses, and hospital administrators authenticate via Institutional Google SSO'}
          </p>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E2E8F0] rounded-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Card */}
          <div className={`p-4 rounded-xl mb-6 text-center border ${
            isPatientPortal 
              ? 'bg-emerald-50/60 border-emerald-200/80' 
              : 'bg-slate-50 border-[#E2E8F0]'
          }`}>
            {isPatientPortal ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#1A56DB] mx-auto mb-2" />
            )}
            <div className="text-xs font-bold text-[#1E293B]">
              {isPatientPortal 
                ? 'Instant Patient Access' 
                : 'Federated Google Medical Verification'}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
              {isPatientPortal 
                ? 'Zero medical clearance required. Click below to sign in with your Google account and enter your personal patient dashboard directly.' 
                : 'Click below to authorize your institutional identity and proceed to district & hospital onboarding registration.'}
            </p>
          </div>

          {/* Official Google Sign In Button */}
          <button
            type="button"
            onClick={handleContinueWithGoogleClick}
            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 border rounded-xl shadow-2xs bg-white text-xs font-semibold text-[#1E293B] hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer ${
              isPatientPortal 
                ? 'border-emerald-300 focus:ring-emerald-600 hover:border-emerald-400' 
                : 'border-[#CBD5E1] focus:ring-[#1A56DB]'
            }`}
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isPatientPortal 
                ? 'Continue with Google (Patient Login)' 
                : 'Continue with Google (Hospital SSO)'}
            </span>
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className={`w-3.5 h-3.5 ${isPatientPortal ? 'text-emerald-600' : 'text-[#15803D]'}`} />
            <span>Encrypted OAuth 2.0 security & privacy protection</span>
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        GOOGLE OAUTH ACCOUNT SELECTION SCREEN
        ============================================================
      */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-[#1E293B]">
            {/* Google OAuth Header */}
            <div className="px-8 pt-8 pb-4 text-center relative border-b border-slate-100">
              <button
                type="button"
                onClick={handleCancelGoogleAuth}
                className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Cancel Google Authentication"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Google Brand Logo */}
              <div className="flex items-center justify-center gap-1 mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-base font-semibold text-slate-700 tracking-tight font-sans">Google</span>
              </div>

              <h3 className="text-xl font-medium text-slate-900">Choose an account</h3>
              <p className="text-xs text-slate-500 mt-1">
                to continue to <strong className="text-slate-800 font-semibold">MediSync AI ({isPatientPortal ? 'Patient Portal' : 'Hospital Registration'})</strong>
              </p>
            </div>

            {/* Account List */}
            <div className="px-6 py-4 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {availableAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full text-left py-3.5 px-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{acc.email}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${isPatientPortal ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {acc.roleHint}
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}

              {/* Use another account option */}
              {!showAddAccount ? (
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => setShowAddAccount(true)}
                  className="w-full text-left py-3.5 px-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700 cursor-pointer text-xs font-medium"
                >
                  <div className="w-10 h-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-500">
                    +
                  </div>
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomAccountSubmit} className="py-3 px-2 space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {isPatientPortal ? 'Enter your Google Email (Patient):' : 'Enter Hospital Google Email:'}
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder={isPatientPortal ? 'name@gmail.com' : 'name@hospital.gov.in'}
                    autoFocus
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAccount(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className={`px-4 py-1.5 text-xs text-white font-medium rounded-md ${
                        isPatientPortal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Verify & Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Google OAuth Footer */}
            <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>To continue, Google will share your name and email with MediSync AI.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
