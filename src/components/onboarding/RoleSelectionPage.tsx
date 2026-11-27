import React, { useState } from 'react';
import { Shield, Stethoscope, HeartHandshake, User, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface RoleSelectionProps {
  onComplete: () => void;
  onBack: () => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionProps> = ({ onComplete, onBack }) => {
  const { tempOnboarding, updateTempRole, clearTempRole } = useApp();
  // Start with clean state: user must explicitly choose their role!
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(tempOnboarding.role || null);
  const [error, setError] = useState<string | null>(null);

  const rolesConfig: {
    role: UserRole;
    title: string;
    icon: React.ReactNode;
    description: string;
    requiresApproval: boolean;
    responsibilities: string[];
  }[] = [
    {
      role: 'admin',
      title: 'Hospital Admin',
      icon: <Shield className="w-6 h-6 text-[#2563A6]" />,
      description: 'Superintendents & resource coordinators with facility-wide allocation control.',
      requiresApproval: true,
      responsibilities: ['Bed & equipment master control', 'Staff access authorization', 'Resource requisition approval']
    },
    {
      role: 'doctor',
      title: 'Doctor',
      icon: <Stethoscope className="w-6 h-6 text-[#15803D]" />,
      description: 'Attending physicians managing patient admissions, ICU beds, and ventilator requests.',
      requiresApproval: true,
      responsibilities: ['Patient-resource matching', 'Emergency ICU requisitions', 'Clinical transfer orders']
    },
    {
      role: 'nurse',
      title: 'Nurse',
      icon: <HeartHandshake className="w-6 h-6 text-[#D97706]" />,
      description: 'Ward nurses maintaining the 6-stage bed turnover and equipment calibration.',
      requiresApproval: true,
      responsibilities: ['6-stage bed turnaround sign-off', 'Sanitization verification', 'Equipment telemetry check']
    },
    {
      role: 'patient',
      title: 'Patient',
      icon: <User className="w-6 h-6 text-[#64748B]" />,
      description: 'Patients and caregivers tracking real-time hospital readiness and appointments.',
      requiresApproval: false,
      responsibilities: ['Queue tracking & appointments', 'Operational readiness view', 'Caregiver request portal']
    }
  ];

  const handleContinue = () => {
    if (!selectedRole) {
      setError('Please select a healthcare role before proceeding.');
      return;
    }
    setError(null);
    updateTempRole(selectedRole);
    onComplete();
  };

  const handleBackClick = () => {
    // When going back, clear previous role selection!
    clearTempRole();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8">
      {/* Onboarding Step Indicator */}
      <OnboardingProgressBar currentStep="role" />

      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hospital Selection
        </button>

        <div className="text-center mb-8">
          <Badge variant="primary" size="md" className="mb-2">Credential Mapping</Badge>
          <h2 className="text-2xl font-bold text-[#1E293B]">Select Your Role at {tempOnboarding.hospitalName || 'Hospital'}</h2>
          <p className="mt-1 text-xs text-[#64748B] max-w-lg mx-auto">
            Clinical and administrative roles enforce verified institutional authorization before granting operational privileges.
          </p>
        </div>

        {error && (
          <div className="mb-4 max-w-md mx-auto p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] text-center">
            {error}
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {rolesConfig.map(item => {
            const isSelected = selectedRole === item.role;
            return (
              <div
                key={item.role}
                onClick={() => {
                  setSelectedRole(item.role);
                  setError(null);
                }}
                className={`p-5 rounded-xl border bg-white cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2563A6] ring-2 ring-[#2563A6]/20 shadow-xs'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1E293B]">{item.title}</h4>
                        {item.requiresApproval ? (
                          <Badge variant="warning" size="sm">Verification Required</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Standard Access</Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#2563A6]" />}
                  </div>

                  <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Authorized Scope:
                  </div>
                  <ul className="space-y-1">
                    {item.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-xs text-[#475569] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#2563A6]" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action with Back & Continue */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="md" onClick={handleBackClick} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="text-xs text-[#64748B]">
              Selected Role: <span className="font-bold text-[#1E293B] capitalize">{selectedRole || 'None selected'}</span>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={handleContinue} icon={<ArrowRight className="w-4 h-4" />}>
            Proceed to Verification Check
          </Button>
        </div>
      </div>
    </div>
  );
};
