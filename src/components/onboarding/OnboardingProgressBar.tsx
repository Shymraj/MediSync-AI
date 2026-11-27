import React from 'react';
import { Check } from 'lucide-react';

export type OnboardingStepId = 'profile' | 'district' | 'hospital' | 'role' | 'verification';

interface StepItem {
  id: OnboardingStepId;
  label: string;
}

const STEPS: StepItem[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'district', label: 'District' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'role', label: 'Role' },
  { id: 'verification', label: 'Verification' },
];

interface OnboardingProgressBarProps {
  currentStep: OnboardingStepId;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#E2E8F0] -z-0" />
        
        {/* Active progress colored line */}
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#2563A6] transition-all duration-300 -z-0"
          style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * (100 - (100 / STEPS.length))}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                  isDone
                    ? 'bg-[#15803D] text-white ring-4 ring-green-50'
                    : isCurrent
                    ? 'bg-[#2563A6] text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium tracking-tight ${
                  isCurrent ? 'font-bold text-[#1E293B]' : isDone ? 'text-[#15803D]' : 'text-[#64748B]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
