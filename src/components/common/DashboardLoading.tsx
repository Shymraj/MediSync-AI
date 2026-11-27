import React, { useEffect } from 'react';
import { Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DashboardLoadingProps {
  roleName: string;
  hospitalName: string;
  onFinished: () => void;
}

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  roleName,
  hospitalName,
  onFinished,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-[#2563A6] text-white flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h3 className="text-base font-bold text-[#1E293B]">Loading {roleName.toUpperCase()} Workspace</h3>
        <p className="text-xs text-[#64748B] mt-1 truncate">
          Connecting to {hospitalName}
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#2563A6] h-full rounded-full animate-pulse w-3/4" />
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" /> Establishing secure telemetry session...
          </span>
        </div>
      </div>
    </div>
  );
};
