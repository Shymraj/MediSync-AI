import React, { useState } from 'react';
import { Activity, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './common/Button';
import { useApp } from '../context/AppContext';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const { loginWithGoogle } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick preset accounts for realistic testing during demo
  const [selectedDemoUser, setSelectedDemoUser] = useState<'doctor' | 'admin' | 'nurse' | 'patient'>('doctor');

  const demoAccounts = {
    doctor: {
      name: 'Dr. Sundaramoorthy M.',
      email: 'dr.sundar@medisync.gov.in',
      roleHint: 'Attending Physician & Critical Care'
    },
    admin: {
      name: 'Dr. Vasanth Kumar',
      email: 'admin.vasanth@medisync.gov.in',
      roleHint: 'Medical Superintendent / Hospital Admin'
    },
    nurse: {
      name: 'Nurse Deepa R.',
      email: 'deepa.nurse@medisync.gov.in',
      roleHint: 'ICU Head Nurse'
    },
    patient: {
      name: 'Karthik Subramanian',
      email: 'karthik.subramanian@gmail.com',
      roleHint: 'Patient / Family Caregiver'
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const account = demoAccounts[selectedDemoUser];
      await new Promise(resolve => setTimeout(resolve, 600)); // realistic OAuth latency
      await loginWithGoogle(account.email, account.name);
      onSuccess();
    } catch {
      setError('Google OAuth provider authentication was interrupted. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#2563A6] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </button>

        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563A6] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1E293B]">MediSync AI</h2>
            <p className="text-xs text-[#64748B]">Enterprise Healthcare Resource Network</p>
          </div>
        </div>

        <h3 className="mt-6 text-center text-xl font-bold text-[#1E293B]">
          Sign in to your Institutional Account
        </h3>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Hospital staff, clinicians, and patients authenticate via Google SSO
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E2E8F0] rounded-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Persona Selector for seamless hackathon walkthrough */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#1E293B] mb-2">
              Select Demo Identity for Google Authentication:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(demoAccounts) as (keyof typeof demoAccounts)[]).map(key => {
                const acc = demoAccounts[key];
                const isSelected = selectedDemoUser === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDemoUser(key)}
                    className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-[#2563A6] bg-blue-50/70 ring-1 ring-[#2563A6]'
                        : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold capitalize text-[#1E293B] flex items-center justify-between">
                      {key}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563A6]" />}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">{acc.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg mb-6">
            <div className="text-[11px] font-medium text-[#64748B]">Authenticating as:</div>
            <div className="text-xs font-semibold text-[#1E293B] mt-0.5">{demoAccounts[selectedDemoUser].name}</div>
            <div className="text-[11px] text-[#2563A6] font-mono">{demoAccounts[selectedDemoUser].email}</div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#CBD5E1] rounded-lg shadow-2xs bg-white text-xs font-semibold text-[#1E293B] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563A6] disabled:opacity-50 transition-all cursor-pointer"
          >
            {/* Real Google SVG Icon */}
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
            {isLoading ? 'Verifying with Google OAuth...' : 'Continue with Google'}
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Encrypted OAuth 2.0 institutional token exchange</span>
          </div>
        </div>
      </div>
    </div>
  );
};
