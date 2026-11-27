import React, { useState } from 'react';
import { User, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface ProfileSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

const RESERVED_TAKEN_USERNAMES = ['admin', 'root', 'doctor', 'superuser', 'medisync', 'system'];

export const ProfileSetupPage: React.FC<ProfileSetupProps> = ({ onComplete, onBack }) => {
  const { user, tempOnboarding, updateTempProfile } = useApp();
  const [name, setName] = useState(tempOnboarding.name || user?.name || '');
  const [username, setUsername] = useState(tempOnboarding.username || user?.username || '');
  const email = user?.email || '';
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full legal or official name (minimum 2 characters).');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long and contain only letters, numbers, or underscores.');
      return;
    }

    // Check unique username constraint
    if (RESERVED_TAKEN_USERNAMES.includes(cleanUsername)) {
      setError(`The username "@${cleanUsername}" is reserved or already taken by another healthcare staff member. Please choose a unique one.`);
      return;
    }

    setError(null);
    // Save to temporary session state only
    updateTempProfile(trimmedName, cleanUsername);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Onboarding Step Indicator */}
      <OnboardingProgressBar currentStep="profile" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Authentication
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-[#2563A6] mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            Complete Your Hospital Profile
          </h2>
          <p className="mt-1 text-xs text-[#64748B]">
            MediSync AI binds your institutional credentials to your assigned healthcare role.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E2E8F0] rounded-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  placeholder="e.g. Dr. Sundaramoorthy M."
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Unique Hospital Username <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                    if (error) setError(null);
                  }}
                  required
                  placeholder="dr_sundar"
                  className="w-full text-xs pl-7 pr-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
                />
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Must be unique across Tamil Nadu Health Network</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Institutional Google Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-2 text-[11px] text-[#2563A6]">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Assigned MediSync ID: <code className="font-mono font-semibold">{user?.id || 'TN-MED-USER'}</code></span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="md" 
                onClick={onBack}
                className="w-1/3"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                className="w-2/3"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to District Selection
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
