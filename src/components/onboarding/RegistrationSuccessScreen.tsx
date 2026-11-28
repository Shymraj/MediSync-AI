import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  KeyRound
} from 'lucide-react';
import { Button } from '../common/Button';

interface RegistrationSuccessScreenProps {
  hospitalId: string;
  hospitalName: string;
  districtName: string;
  registrationNumber: string;
  emergencyContact: string;
  onProceed: () => void;
}

export const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  hospitalId,
  hospitalName,
  districtName,
  registrationNumber,
  emergencyContact,
  onProceed
}) => {
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);

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

  const handleCopyId = () => {
    try {
      navigator.clipboard.writeText(hospitalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2568]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden text-center p-8 relative animate-in zoom-in-95 duration-200">
        
        {/* MediSync Top Gradient Glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#1A56DB] via-[#00C853] to-[#1A56DB]" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-52 h-52 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* 
          ============================================================
          MEDISYNC x GPAY STYLE ANIMATED SUCCESS TICK
          ============================================================
        */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-5 mt-1">
            {/* Expanding MediSync Blue + Emerald Ripple Rings */}
            <div className="absolute -inset-3 rounded-full bg-blue-400/20 animate-ping duration-1000" />
            <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-pulse duration-700" />
            
            {/* Signature GPay-style Animated Check Circle */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#00C853] to-[#059669] flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-white">
              <svg 
                className="w-12 h-12 text-white drop-shadow-xs animate-in zoom-in-50 duration-300" 
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

          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-[#1A56DB] border border-blue-200 mb-2 flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#1A56DB]" /> MediSync AI &bull; Facility Verified
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Hospital Registered!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            மருத்துவமனை பதிவு வெற்றிகரமாக முடிந்தது
          </p>

          {/* Prominent Generated Hospital ID Box */}
          <div className="w-full mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFC] to-[#ECFDF5] border-2 border-[#1A56DB]/30 shadow-xs space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#1A56DB] flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Your Official Hospital ID</span>
            </div>

            <div className="flex items-center justify-center gap-2.5">
              <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                {hospitalId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-[#1A56DB] transition-colors cursor-pointer shadow-2xs"
                title="Copy Hospital ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[10px] text-slate-500 font-semibold">
              Saved in <strong className="text-slate-700">Hospital Settings</strong> &amp; <strong className="text-slate-700">MediSync Admin</strong> &bull; Use this ID for future Hospital Login
            </div>
          </div>

          {/* Hospital Details Card */}
          <div className="w-full mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reg No</span>
              <span className="text-[11px] font-mono font-bold text-[#1A56DB]">{registrationNumber || 'TN-MED-REG-2026'}</span>
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
              className="w-full bg-[#1A56DB] hover:bg-blue-700 text-white font-bold py-3.5 shadow-md flex items-center justify-center gap-2 cursor-pointer rounded-2xl"
            >
              <span>Enter Hospital Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-[11px] text-slate-400">
              Opening Hospital Dashboard in <span className="font-bold text-[#1A56DB]">{countdown}s</span>...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
