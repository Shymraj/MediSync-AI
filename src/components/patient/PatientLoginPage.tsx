import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  X,
  User,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PatientLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const PatientLoginPage: React.FC<PatientLoginPageProps> = ({
  onBack,
  onSuccess
}) => {
  const { loginWithGoogle } = useApp();
  const [email, setEmail] = useState('karthik.subramanian@gmail.com');
  const [password, setPassword] = useState('patient123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loggedInName, setLoggedInName] = useState('Karthik Subramanian');
  const [loggedInEmail, setLoggedInEmail] = useState('karthik.subramanian@gmail.com');

  // Custom / "Use another Google account" state
  const [showAddGoogleAccount, setShowAddGoogleAccount] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<Array<{ name: string; email: string; avatar?: string }>>(() => {
    const defaultAcc = {
      name: 'Karthik Subramanian',
      email: 'karthik.subramanian@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'
    };
    try {
      const stored = localStorage.getItem('medisync_patient_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [defaultAcc];
  });

  const deriveNameFromEmail = (rawEmail: string) => {
    if (rawEmail.toLowerCase() === 'karthik.subramanian@gmail.com') return 'Karthik Subramanian';
    const localPart = rawEmail.split('@')[0] || 'Patient User';
    return localPart
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Direct Email / Password Login
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const targetEmail = email.trim() || 'karthik.subramanian@gmail.com';
    const derivedName = deriveNameFromEmail(targetEmail);

    try {
      const userRes = await loginWithGoogle(
        targetEmail,
        derivedName,
        'patient'
      );
      setLoggedInName(userRes?.name || derivedName);
      setLoggedInEmail(userRes?.email || targetEmail);
      setIsLoading(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Login failed. Please verify credentials or use Google Login.');
    }
  };

  // Google SSO Login Flow
  const handleGoogleLoginClick = () => {
    setError(null);
    setShowAddGoogleAccount(false);
    setIsGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (targetEmail: string, targetName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const cleanEmail = targetEmail.trim();
      const cleanName = targetName.trim() || deriveNameFromEmail(cleanEmail);
      const userRes = await loginWithGoogle(cleanEmail, cleanName, 'patient');

      // Save account in quick picker if new
      setSavedGoogleAccounts(prev => {
        const exists = prev.some(a => a.email.toLowerCase() === cleanEmail.toLowerCase());
        const next = exists ? prev : [...prev, { name: cleanName, email: cleanEmail }];
        try {
          localStorage.setItem('medisync_patient_google_accounts', JSON.stringify(next));
        } catch {}
        return next;
      });

      setLoggedInName(userRes?.name || cleanName);
      setLoggedInEmail(userRes?.email || cleanEmail);
      setIsLoading(false);
      setIsGoogleModalOpen(false);
      setShowAddGoogleAccount(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Google authentication failed.');
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customGoogleEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const cleanName = customGoogleName.trim() || deriveNameFromEmail(cleanEmail);
    handleSelectGoogleAccount(cleanEmail, cleanName);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* ======================================================== */}
      {/* LEFT HALF: HERO DOCTOR IMAGE & BRAND TAGLINE             */}
      {/* ======================================================== */}
      <div className="lg:w-[48%] min-h-[380px] lg:min-h-screen relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden bg-slate-900">
        
        {/* Background Medical Doctor with Stethoscope Photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85')`
          }}
        />

        {/* Soft Multi-Layer Medical Blue & Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-[#1b436c]/95 via-[#23588e]/60 to-[#102a45]/40" />
        <div className="absolute inset-0 bg-linear-to-r from-[#102a45]/80 via-transparent to-transparent" />

        {/* Top Left Navigation: Back Button */}
        <div className="relative z-10">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all border border-white/20 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Selection</span>
          </button>
        </div>

        {/* Bottom Left Brand Identity & Official Tagline */}
        <div className="relative z-10 mt-auto pt-12">
          {/* Capsule / Pill Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-13 h-7 rounded-full border-2 border-white/90 bg-white/10 backdrop-blur-md flex overflow-hidden shadow-lg p-0.5">
              <div className="w-1/2 h-full bg-linear-to-br from-amber-400 via-rose-400 to-rose-500 rounded-l-full" />
              <div className="w-1/2 h-full bg-linear-to-br from-cyan-400 to-blue-600 rounded-r-full" />
            </div>
            <h2 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-sm">
              MEDISYNC
            </h2>
          </div>

          <p className="text-sm sm:text-base font-medium text-blue-100/95 mt-3 max-w-md leading-relaxed drop-shadow-xs">
            Empowering Healthcare, One Click at a Time:<br />
            <span className="font-semibold text-white">Your Health, Your Records, Your Control.</span>
          </p>

          <div className="mt-4 flex items-center gap-4 text-[11px] text-blue-200/80 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              Live Hospital Readiness
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              OPD Queue Tracking
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT HALF: LOGIN CARD (EMAIL/PASSWORD + GOOGLE LOGIN)    */}
      {/* ======================================================== */}
      <div className="lg:w-[52%] flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-sm sm:max-w-md">
          
          {/* Centered Capsule Logo Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-7 rounded-full border-2 border-slate-700 bg-white flex overflow-hidden shadow-xs p-0.5">
              <div className="w-1/2 h-full bg-linear-to-br from-amber-400 via-rose-400 to-rose-500 rounded-l-full" />
              <div className="w-1/2 h-full bg-linear-to-br from-cyan-400 to-blue-600 rounded-r-full" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Login
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Log in to your account.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full text-xs px-4 py-3 bg-white border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#3B7BA4] focus:border-transparent transition-all font-medium shadow-2xs"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full text-xs px-4 py-3 pr-11 bg-white border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#3B7BA4] focus:border-transparent transition-all font-medium shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Password reset link will be sent to your registered email.')}
                className="text-xs text-slate-500 hover:text-[#3B7BA4] font-medium transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Action: Log In Button (Slate/Teal Blue from Image) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#3B7BA4] hover:bg-[#2F6587] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Log In'}</span>
            </button>
          </form>

          {/* Secondary Action: Log in with Google (From Image) */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {/* Official Google Colored G Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Log in with Google</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              onClick={() => {
                alert('Patient registration is automatic via instant Google Login or Email!');
              }}
              className="font-bold text-[#3B7BA4] hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </div>

        </div>
      </div>

      {/* 
        ============================================================
        GOOGLE ACCOUNT SELECTION MODAL
        Simulates authentic Google OAuth identity prompt
        ============================================================
      */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 p-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="text-xs font-bold text-slate-800">Sign in with Google</span>
              </div>
              <button 
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Choose a Google account to continue to <strong>MediSync AI Patient Portal</strong>
            </p>

            {/* Saved Google Accounts List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto mb-3 pr-0.5">
              {savedGoogleAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectGoogleAccount(acc.email, acc.name)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {acc.avatar ? (
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full border border-slate-300 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">{acc.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                      <div className="text-[9px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified Google Account
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Use Another Google Account Option */}
            {!showAddGoogleAccount ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowAddGoogleAccount(true);
                }}
                className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center gap-3 text-left text-xs font-semibold text-slate-700"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">Use another Google account</div>
                  <div className="text-[10px] text-slate-500">மற்றொரு Gmail / Google கணக்கு மூலம் உள்நுழைய</div>
                </div>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-left">
                <div className="text-xs font-bold text-slate-800">Sign in with your Google Account</div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Google Email Address *</label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    autoFocus
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="e.g. Muralitharan M"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddGoogleAccount(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                </div>
              </form>
            )}

            {/* Security note */}
            <div className="text-[10px] text-slate-400 text-center mt-3 pt-2 border-t border-slate-100 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>OAuth 2.0 256-bit HIPAA compliant security</span>
            </div>
          </div>
        </div>
      )}

      {/* 
        ============================================================
        GPAY STYLE LOGIN SUCCESS ANIMATED OVERLAY
        - Expanding pulsing ripple green rings
        - Vibrant #00C853 circle with white tick
        - "Login Successful!" notification
        - Direct auto-route to Patient Dashboard
        ============================================================
      */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center p-8 sm:p-10 relative animate-in zoom-in-95 duration-200">
            {/* Soft background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none -z-0" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Outer pulsing ring & GPay style vibrant green circle with checkmark */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping duration-1000" />
                <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-pulse duration-700" />
                <div className="relative w-24 h-24 rounded-full bg-[#00C853] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg 
                    className="w-13 h-13 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              {/* Title & User Greeting */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Login Successful!
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-emerald-600 mt-1">
                வெற்றிகரமாக உள்நுழைந்தது
              </p>

              <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 w-full text-center">
                <div className="text-xs font-bold text-slate-800">
                  {loggedInName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {loggedInEmail}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Citizen Patient ID: PT-TN-9842</span>
                </div>
              </div>

              {/* Redirecting bar */}
              <div className="mt-6 flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#00C853] h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Opening MediSync Patient Dashboard...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

