import React from 'react';
import { Flame, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';

export const RealtimeEmergencyBanner: React.FC = () => {
  const { activeEmergencyModal, closeEmergencyModal } = useApp();

  if (!activeEmergencyModal) return null;

  const title = activeEmergencyModal.title || 'ACUTE HOSPITAL EMERGENCY';
  const message = activeEmergencyModal.message || activeEmergencyModal.description || 'Stat clinical assistance requested.';
  const location = activeEmergencyModal.location || activeEmergencyModal.ward || 'Hospital Critical Zone';
  const patient = activeEmergencyModal.patientName ? `Patient: ${activeEmergencyModal.patientName}` : null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-200">
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-400 flex items-start justify-between gap-3 relative overflow-hidden">
        {/* Pulsing background effect */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 blur-xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0 animate-bounce">
            <Flame className="w-6 h-6 text-yellow-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                Live Broadcast
              </span>
              <span className="text-xs font-bold text-yellow-200">{location}</span>
            </div>

            <h4 className="text-sm font-black text-white mt-1 leading-snug">
              {title}
            </h4>

            <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
              {message} {patient && <span className="font-semibold text-white">({patient})</span>}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={closeEmergencyModal}
                className="bg-white text-red-700 hover:bg-red-50 border-0 font-bold text-xs h-7 px-3"
              >
                Acknowledge Alert
              </Button>
            </div>
          </div>
        </div>

        <button
          onClick={closeEmergencyModal}
          className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors relative z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
