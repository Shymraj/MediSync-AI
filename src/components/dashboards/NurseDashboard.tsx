import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Bed, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  CheckSquare, 
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { BedStatus } from '../../types';

export const NurseDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { user, beds, updateBedStatus, equipment } = useApp();

  // The 6-stage lifecycle progression
  const lifecycleStages: { status: BedStatus; label: string; nextStatus?: BedStatus; actionName?: string; desc: string }[] = [
    { status: 'occupied', label: 'Occupied', nextStatus: 'discharged', actionName: 'Process Discharge', desc: 'Patient undergoing clinical care' },
    { status: 'discharged', label: 'Discharged', nextStatus: 'cleaning', actionName: 'Start Terminal Cleaning', desc: 'Bed vacated, awaiting housekeeping' },
    { status: 'cleaning', label: 'Cleaning', nextStatus: 'equipment_check', actionName: 'Mark Cleaning Done', desc: 'Sanitization & linen turnover in progress' },
    { status: 'equipment_check', label: 'Equipment Check', nextStatus: 'nurse_confirmation', actionName: 'Equipment Calibrated', desc: 'Ventilator & monitor diagnostic test' },
    { status: 'nurse_confirmation', label: 'Nurse Confirmation', nextStatus: 'ready', actionName: 'Sign Off Ready', desc: 'Awaiting primary nurse sign-off' },
    { status: 'ready', label: 'Ready', desc: 'Operationally ready for incoming admission' }
  ];

  const handleAdvanceLifecycle = (bedId: string, currentStatus: BedStatus) => {
    const stage = lifecycleStages.find(s => s.status === currentStatus);
    if (stage && stage.nextStatus) {
      updateBedStatus(bedId, stage.nextStatus);
    }
  };

  const myWardBeds = beds.filter(b => b.ward.includes('ICU') || b.ward.includes('HDU'));
  const readyCount = myWardBeds.filter(b => b.status === 'ready').length;
  const inTurnaroundCount = myWardBeds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation'].includes(b.status)).length;
  const occupiedCount = myWardBeds.filter(b => b.status === 'occupied').length;

  return (
    <div className="space-y-6">
      {/* Ward Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Operationally Ready</span>
            <span className="p-1.5 rounded-md bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#15803D] mt-2">{readyCount}</div>
          <div className="text-[11px] text-[#15803D] mt-1 font-semibold">Immediate admission ready</div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Active Turnaround</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-[#D97706]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#D97706] mt-2">{inTurnaroundCount}</div>
          <div className="text-[11px] text-[#D97706] mt-1">Cleaning & equipment check</div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Occupied Beds</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-[#475569]">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-2">{occupiedCount}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Inpatients under ward care</div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Assigned Ward</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-[#2563A6]">
              <HeartHandshake className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm font-bold text-[#1E293B] mt-2">ICU Block A & B</div>
          <div className="text-[11px] text-[#64748B] mt-1">Duty Nurse: {user?.name}</div>
        </Card>
      </div>

      {/* 6-Stage Bed Lifecycle Explainer Bar */}
      <Card title="Institutional 6-Stage Bed Lifecycle" subtitle="Every bed must pass all 6 stages before operational readiness is broadcast to admissions" noPadding>
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {lifecycleStages.map((st, idx) => (
              <div key={st.status} className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold text-slate-400">STAGE 0{idx + 1}</span>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">{st.label}</div>
                <div className="text-[10px] text-[#64748B] mt-1 line-clamp-2 leading-tight">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Interactive Turnaround Table */}
      <Card
        title="Interactive Ward Bed Turnaround Management"
        subtitle="Advance beds step-by-step through terminal cleaning, telemetry calibration, and primary sign-off"
        noPadding
      >
        <div className="divide-y divide-[#E2E8F0]">
          {myWardBeds.map(bed => {
            const currentStage = lifecycleStages.find(s => s.status === bed.status);
            const isReady = bed.status === 'ready';

            return (
              <div key={bed.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1E293B]">{bed.bedNumber}</span>
                      <span className="text-xs text-[#64748B]">({bed.ward} &middot; {bed.type})</span>
                      <Badge 
                        variant={
                          bed.status === 'ready' ? 'success' :
                          bed.status === 'occupied' ? 'secondary' :
                          bed.status === 'nurse_confirmation' ? 'primary' : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {bed.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-slate-400">Updated: {bed.lastUpdated}</span>
                    </div>

                    <p className="text-xs text-[#64748B] mt-1">
                      {bed.notes || 'Routine protocols active'}
                    </p>

                    {bed.patientName && (
                      <div className="text-xs text-[#1E293B] font-semibold mt-1">
                        Active Patient: {bed.patientName} ({bed.patientId})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentStage?.nextStatus ? (
                      <Button
                        variant={bed.status === 'nurse_confirmation' ? 'success' : 'primary'}
                        size="sm"
                        onClick={() => handleAdvanceLifecycle(bed.id, bed.status)}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {currentStage.actionName || 'Advance Stage'}
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm">
                        Ready for Admission
                      </Badge>
                    )}

                    {bed.status === 'ready' && (
                      <button
                        onClick={() => updateBedStatus(bed.id, 'occupied', 'Admitted emergency patient')}
                        className="text-xs font-semibold text-[#2563A6] hover:underline cursor-pointer ml-2"
                      >
                        Simulate Intake
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Routine Nursing Tasks & Equipment Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Ward Equipment Calibration Checklist" subtitle="Life-support pre-intake checks" noPadding>
          <div className="divide-y divide-[#E2E8F0] text-xs">
            {equipment.map(eq => (
              <div key={eq.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1E293B]">{eq.name}</div>
                  <div className="text-[11px] text-[#64748B]">{eq.ward} &middot; SN: {eq.serialNumber}</div>
                </div>
                <Badge variant={eq.status === 'Available' ? 'success' : 'warning'} size="sm">
                  {eq.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Shift Handover Tasks" subtitle="Nursing transition notes for ICU shift" noPadding>
          <div className="p-4 space-y-3 text-xs text-[#64748B]">
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
              <div className="font-bold text-[#1E293B]">ICU Block B - Bed Turnaround Priority</div>
              <p className="text-[11px] mt-1">Bed ICU-15 completed sterilization. Nurse sign-off required prior to 21:00 admission transfer.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
              <div className="font-bold text-[#1E293B]">Ventilator Circuit Replacement</div>
              <p className="text-[11px] mt-1">Check expiratory valve filter for Mindray SV300 in Emergency Bay before oncoming shift.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
