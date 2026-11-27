import React, { useEffect, useState } from 'react';
import { 
  Check, 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../common/Button';

interface RegistrationSuccessScreenProps {
  hospitalName: string;
  districtName: string;
  registrationNumber: string;
  emergencyContact: string;
  onProceed: () => void;
}

export const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  hospitalName,
  districtName,
  registrationNumber,
  emergencyContact,
  onProceed
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onProceed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-8 relative animate-in zoom-in-95 duration-200">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* 
          ============================================================
          GPAY STYLE ANIMATED SUCCESS TICK
          - Expanding pulsing green rings
          - Vibrant emerald circular badge
          - Animated stroke checkmark
          ============================================================
        */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            {/* Outer ripple rings */}
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping duration-1000" />
            <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-pulse duration-700" />
            
            {/* GPay Green Circle */}
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

          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 mb-2 flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Registered & Verified
          </span>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Hospital Registered!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            மருத்துவமனை பதிவு வெற்றிகரமாக முடிந்தது &bull; Facility verified and activated in MediSync network
          </p>

          {/* Hospital Certificate Card */}
          <div className="w-full mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Facility Record</span>
              <span className="text-[11px] font-mono font-bold text-emerald-700">{registrationNumber || 'TN-MED-REG-2026'}</span>
            </div>

            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-[#1A56DB] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">{hospitalName}</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" /> {districtName} District Node
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" /> Helpline: {emergencyContact}
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>

          {/* Action button & countdown */}
          <div className="w-full mt-6 space-y-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onProceed}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Hospital Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-[11px] text-slate-400">
              Automatically redirecting in <span className="font-bold text-slate-700">{countdown}s</span>...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
