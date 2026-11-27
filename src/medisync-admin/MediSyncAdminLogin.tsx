import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MediSyncAdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const MediSyncAdminLogin: React.FC<MediSyncAdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome
}) => {
  const [username, setUsername] = useState('medisync');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Verify credentials: Username: medisync, Password: medisync123
    if (cleanUser === 'medisync' && cleanPass === 'medisync123') {
      try {
        // Also call backend endpoint if available
        fetch('http://localhost:5000/api/medisync-admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        }).catch(() => {});
      } catch {}

      sessionStorage.setItem('medisync_super_admin_session', 'authenticated');
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 400);
    } else {
      setIsLoading(false);
      setError('Invalid credentials. Required: Username: medisync and Password: medisync123');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#0A192F] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-white">
      
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden relative z-10">
        
        {/* Header accent strip */}
        <div className="h-2 w-full bg-linear-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        <div className="p-8 sm:p-10">
          
          {/* Brand Icon & Platform Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#1A56DB] to-[#1E40AF] flex items-center justify-center text-white shadow-lg ring-4 ring-blue-500/20 mb-4">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-blue-400" /> Platform Super Administration
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              MediSync Admin
            </h1>

            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Statewide hospital oversight, facility registries & centralized operational telemetry
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                  autoFocus
                  className="w-full text-xs px-3.5 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full text-xs px-3.5 py-3 pr-10 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Demo Hint Banner */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[11px] space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Platform Super Admin Credentials:
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300 pt-0.5">
                <span>Username: <strong className="text-blue-400 font-bold">medisync</strong></span>
                <span>&bull;</span>
                <span>Password: <strong className="text-blue-400 font-bold">medisync123</strong></span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Unlock MediSync Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Portal</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
