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
  RotateCw,
  Send,
  Plus,
  Flame,
  ShieldAlert,
  Users,
  Building2,
  FileText,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { BedStatus } from '../../types';
import { DoctorNurseTaskItem } from '../../data/doctorDemoData';
import { EmergencyCommandCenter } from '../emergency/EmergencyCommandCenter';
import { HospitalDigitalTwinLab } from '../simulation/HospitalDigitalTwinLab';
import { WorkflowAutomationCenter } from '../workflow/WorkflowAutomationCenter';

export const NurseDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { 
    user, 
    beds, 
    updateBedStatus, 
    equipment, 
    doctorNurseTasks, 
    updateNurseTaskStatus, 
    patients 
  } = useApp();

  const [selectedTaskForExecution, setSelectedTaskForExecution] = useState<DoctorNurseTaskItem | null>(null);
  const [nurseNotes, setNurseNotes] = useState('');
  const [heartRate, setHeartRate] = useState<number>(115);
  const [systolicBP, setSystolicBP] = useState<number>(95);
  const [spO2, setSpO2] = useState<number>(88);
  const [respRate, setRespRate] = useState<number>(26);
  const [temp, setTemp] = useState<number>(37.2);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

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

  const handleExecuteOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForExecution) return;

    updateNurseTaskStatus({
      taskId: selectedTaskForExecution.id,
      status: 'Completed',
      nurseObservation: nurseNotes.trim() || 'Bedside telemetry checked. Vital signs documented.',
      nurseName: user?.name || 'Nurse Revathi S.',
      recordedVitals: {
        heartRate,
        systolicBP,
        spO2,
        respiratoryRate: respRate,
        temperature: temp
      }
    });

    const isAbnormal = spO2 < 90 || heartRate > 120;
    setRecordFeedback(
      isAbnormal 
        ? `Task completed! Abnormal vitals (SpO2 ${spO2}%, HR ${heartRate}) triggered automated Clinical Alert to attending physician.`
        : `Task completed and bedside observations logged successfully!`
    );

    setTimeout(() => {
      setRecordFeedback(null);
      setSelectedTaskForExecution(null);
      setNurseNotes('');
    }, 3000);
  };

  const myWardBeds = beds.filter(b => b.ward.includes('ICU') || b.ward.includes('HDU'));
  const readyCount = myWardBeds.filter(b => b.status === 'ready').length;
  const inTurnaroundCount = myWardBeds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation'].includes(b.status)).length;
  const occupiedCount = myWardBeds.filter(b => b.status === 'occupied').length;

  if (activeTab === 'command_center' || activeTab === 'command-center') {
    return <EmergencyCommandCenter />;
  }

  if (activeTab === 'simulation_lab' || activeTab === 'simulation-lab') {
    return <HospitalDigitalTwinLab activeRole="nurse" />;
  }

  if (activeTab === 'workflow_automation' || activeTab === 'workflows' || activeTab === 'workflow-automation') {
    return <WorkflowAutomationCenter activeRole="nurse" />;
  }

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
            <span>Doctor Direct Orders</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-[#2563A6]">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#2563A6] mt-2">
            {doctorNurseTasks.filter(t => t.status !== 'Completed').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold">Pending execution</div>
        </Card>
      </div>

      {recordFeedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{recordFeedback}</span>
        </div>
      )}

      {/* Primary Tab: Tasks or Ward Overview */}
      {(activeTab === 'tasks' || activeTab === 'dashboard') && (
        <Card
          title={`Doctor Clinical Directives & Nursing Order Feed (${doctorNurseTasks.length})`}
          subtitle="Closed-loop execution tracker connected directly with Doctor Dashboard"
          noPadding
        >
          <div className="divide-y divide-[#E2E8F0]">
            {doctorNurseTasks.map(task => {
              const isStat = task.priority.includes('Stat');
              const isCompleted = task.status === 'Completed';

              return (
                <div key={task.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#1E293B]">{task.patientName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({task.patientId} &middot; Bed {task.bed})</span>
                      <span className="text-xs text-slate-600">{task.ward}</span>
                      <Badge variant={isStat ? 'critical' : task.priority === 'Urgent' ? 'warning' : 'primary'} size="sm">
                        {task.priority}
                      </Badge>
                      <Badge 
                        variant={isCompleted ? 'success' : task.status === 'In Progress' ? 'warning' : 'neutral'} 
                        size="sm"
                      >
                        {task.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedTaskForExecution(task)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Execute & Record Vitals
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#1E293B] font-semibold bg-slate-50 p-2.5 rounded border border-slate-200">
                    {task.instruction}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                    <span>Ordered by: <strong>{task.doctorName}</strong> ({task.timestamp})</span>
                    <span>Assigned Nurse: <strong>{task.assignedNurse}</strong></span>
                    {task.nurseObservation && (
                      <span className="text-blue-700 block w-full mt-1">
                        Nurse Observation: {task.nurseObservation} {task.completedAt ? `(${task.completedAt})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 6-Stage Bed Lifecycle Explainer Bar */}
      {(activeTab === 'turnaround' || activeTab === 'dashboard') && (
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

          {/* Interactive Turnaround Table */}
          <div className="divide-y divide-[#E2E8F0]">
            {myWardBeds.map(bed => {
              const currentStage = lifecycleStages.find(s => s.status === bed.status);

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
                          Active Inpatient: {bed.patientName} ({bed.patientId})
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
                          onClick={() => updateBedStatus(bed.id, 'occupied', 'Emergency intake assigned')}
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
      )}

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

      {/* Nurse Order Execution Modal */}
      <Modal
        isOpen={!!selectedTaskForExecution}
        onClose={() => setSelectedTaskForExecution(null)}
        title="Execute Clinical Order & Document Bedside Vitals"
        description="Record nursing observations and vital signs. Abnormal parameters trigger automated Doctor Clinical Alerts."
        maxWidth="md"
      >
        <form onSubmit={handleExecuteOrderSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-800">
            <strong>Order:</strong> {selectedTaskForExecution?.instruction}
            <div className="text-[11px] text-slate-600 mt-1">
              Patient: <strong>{selectedTaskForExecution?.patientName}</strong> &middot; Bed {selectedTaskForExecution?.bed} &middot; Ordered by {selectedTaskForExecution?.doctorName}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Bedside Nursing Observation Notes</label>
            <textarea
              value={nurseNotes}
              onChange={(e) => setNurseNotes(e.target.value)}
              rows={3}
              placeholder="Record clinical response, ventilator synchrony, infusion rate, or pain level..."
              required
              className="w-full p-2.5 border border-[#CBD5E1] rounded-lg"
            />
          </div>

          {/* Vitals Input Grid */}
          <div>
            <label className="block font-semibold text-[#1E293B] mb-2">Record Current Bedside Telemetry</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block">Heart Rate (bpm)</span>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg font-bold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Systolic BP (mmHg)</span>
                <input
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(Number(e.target.value))}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg font-bold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">SpO2 Oxygen (%)</span>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  className={`w-full p-2 border rounded-lg font-bold ${spO2 < 90 ? 'border-red-400 bg-red-50 text-red-700' : 'border-[#CBD5E1]'}`}
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Resp. Rate (/min)</span>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(Number(e.target.value))}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg font-bold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Temp (&deg;C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg font-bold"
                />
              </div>
            </div>

            {spO2 < 90 && (
              <div className="mt-2 text-[11px] text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                SpO2 &lt; 90% triggers automated STAT MEWS Alert to Doctor Dashboard.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" type="button" onClick={() => setSelectedTaskForExecution(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
              Complete Order & Transmit Telemetry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
