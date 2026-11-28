import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Save, 
  Heart, 
  Wind, 
  Thermometer, 
  Droplet,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';

interface TreatmentResponseViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const TreatmentResponseView: React.FC<TreatmentResponseViewProps> = ({ onNavigateTab }) => {
  const [patients] = useState<PatientDigitalTwin[]>(INITIAL_CLINICAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);
  const [physicianVerdict, setPhysicianVerdict] = useState<'Significant Improvement' | 'Partial Response' | 'No Significant Change' | 'Deterioration'>('Significant Improvement');
  const [verdictNotes, setVerdictNotes] = useState('Patient displays marked hemodynamic stabilization following aggressive volume resuscitation and targeted pharmacotherapy. Oxygen requirements successfully down-titrated.');
  const [savedVerdictNotice, setSavedVerdictNotice] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '48h' | '72h'>('24h');

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  const earliestVitals = currentPatient.vitals[currentPatient.vitals.length - 1] || currentPatient.currentVitals;
  const latestVitals = currentPatient.currentVitals;

  const handleSaveVerdict = () => {
    setSavedVerdictNotice(true);
    setTimeout(() => setSavedVerdictNotice(false), 3500);
  };

  // Mock serial trajectory checkpoints
  const trajectoryMilestones = [
    {
      time: 'T0 (Admission Baseline)',
      intervention: 'Emergency triage presentation. Fluid resuscitation 30 mL/kg commenced.',
      status: 'Completed',
      mews: 7,
      hr: earliestVitals.heartRate,
      map: Math.round((earliestVitals.systolicBP + 2 * earliestVitals.diastolicBP) / 3)
    },
    {
      time: 'T+2 Hours',
      intervention: 'STAT Blood cultures, broad-spectrum IV Piperacillin-Tazobactam initiated.',
      status: 'Completed',
      mews: 5,
      hr: earliestVitals.heartRate - 12,
      map: 64
    },
    {
      time: 'T+6 Hours',
      intervention: 'Low-dose Norepinephrine infusion titrated to target MAP > 65 mmHg.',
      status: 'Stabilized',
      mews: 3,
      hr: latestVitals.heartRate + 8,
      map: 68
    },
    {
      time: 'T+12 Hours (Current)',
      intervention: 'Vasopressor weaned down by 50%. Oxygen stepped down to 2L nasal cannula.',
      status: 'Favorable',
      mews: 2,
      hr: latestVitals.heartRate,
      map: Math.round((latestVitals.systolicBP + 2 * latestVitals.diastolicBP) / 3)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/40 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Treatment Response Tracker & Trajectory Analytics</h3>
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                OUTCOME MONITORING
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL TRAJECTORY DEMO
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Continuous baseline vs. current physiological comparison assessing therapeutic efficacy.
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-200 font-semibold whitespace-nowrap">Target Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs border border-emerald-400/40 rounded-lg px-3 py-2 bg-slate-900 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} — {p.name} ({p.bedNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card noPadding>
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#2563A6] font-bold flex items-center justify-center">
              {currentPatient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="font-bold text-sm text-[#1E293B]">{currentPatient.name} ({currentPatient.age}y &middot; {currentPatient.gender})</div>
              <div className="text-slate-500">
                Primary Diagnosis: <strong className="text-slate-700">{currentPatient.primaryDiagnosis}</strong> &middot; Ward: <strong>{currentPatient.ward}</strong> &middot; Bed: <strong>{currentPatient.bedNumber}</strong>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('digital_twin', currentPatient.patientId)}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open Digital Twin
              </Button>
            )}
            <Badge variant="primary" size="sm">
              Attending: Dr. Sundaramoorthy M.
            </Badge>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">MEWS Delta</span>
            <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> 7 &rarr; 2 (-5 pts)
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Resolved from Urgent Risk</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Mean Arterial Pressure</span>
            <div className="text-lg font-bold text-emerald-600 mt-1">
              74 mmHg
            </div>
            <span className="text-[10px] text-green-600 font-semibold mt-0.5 block">+18 mmHg from Triage</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">SpO2 Stability</span>
            <div className="text-lg font-bold text-blue-600 mt-1">
              {latestVitals.spO2}% (Room Air)
            </div>
            <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">FiO2 weaned down to 21%</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lactate Clearance</span>
            <div className="text-lg font-bold text-emerald-600 mt-1">
              1.6 mmol/L
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Baseline was 3.8 mmol/L</span>
          </div>
        </div>
      </Card>

      {/* Comparison Grid: Admission Baseline vs Current Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline at Admission */}
        <Card title="Admission Baseline (Triage Vitals)" subtitle={`Recorded on ${currentPatient.admissionDate}`} noPadding>
          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Baseline HR</span>
                <span className="text-lg font-bold text-slate-800">{earliestVitals.heartRate} bpm</span>
                <span className="text-[10px] text-red-500 font-semibold block mt-0.5">Tachycardic</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Baseline BP</span>
                <span className="text-lg font-bold text-slate-800">{earliestVitals.systolicBP}/{earliestVitals.diastolicBP}</span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Hypotensive</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Baseline SpO2</span>
                <span className="text-lg font-bold text-slate-800">{earliestVitals.spO2}%</span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Hypoxemic</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Respiratory Rate & Temp</span>
              <span className="text-sm font-semibold text-slate-800">
                {earliestVitals.respiratoryRate} /min &middot; {earliestVitals.temperature}&deg;C &middot; GCS {earliestVitals.gcsScore}/15
              </span>
            </div>
          </div>
        </Card>

        {/* Current Post-Intervention Telemetry */}
        <Card title="Current Status Post-Intervention" subtitle="Latest bedside telemetry" noPadding>
          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-[#2563A6] block">Current HR</span>
                <span className="text-lg font-bold text-[#1E293B]">{latestVitals.heartRate} bpm</span>
                <span className="text-[10px] text-green-600 font-semibold block mt-0.5">
                  {latestVitals.heartRate < earliestVitals.heartRate ? 'Normalized' : 'Elevated'}
                </span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-[#2563A6] block">Current BP</span>
                <span className="text-lg font-bold text-[#1E293B]">{latestVitals.systolicBP}/{latestVitals.diastolicBP}</span>
                <span className="text-[10px] text-green-600 font-semibold block mt-0.5">Target MAP reached</span>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-[#2563A6] block">Current SpO2</span>
                <span className="text-lg font-bold text-[#1E293B]">{latestVitals.spO2}%</span>
                <span className="text-[10px] text-green-600 font-semibold block mt-0.5">
                  +{latestVitals.spO2 - earliestVitals.spO2}% improvement
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <span className="text-[10px] text-[#2563A6] block">Respiratory Rate & Temp</span>
              <span className="text-sm font-semibold text-slate-800">
                {latestVitals.respiratoryRate} /min &middot; {latestVitals.temperature}&deg;C &middot; GCS {latestVitals.gcsScore}/15
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Clinical Response Trajectory Milestones */}
      <Card title="Intervention Timeline & Clinical Milestones" subtitle="Stepwise therapeutic progression and physiological response" noPadding>
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {trajectoryMilestones.map((m, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
                    <span>{m.time}</span>
                    <Badge variant={m.mews > 4 ? 'warning' : 'success'} size="sm">
                      MEWS {m.mews}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-1">{m.intervention}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500 shrink-0">
                <div>
                  <span className="text-[10px] block">HR:</span>
                  <strong className="text-slate-700">{m.hr} bpm</strong>
                </div>
                <div>
                  <span className="text-[10px] block">MAP:</span>
                  <strong className="text-slate-700">{m.map} mmHg</strong>
                </div>
                <Badge variant="primary" size="sm">
                  {m.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Attending Verdict & Assessment Form */}
      <Card
        title="Physician Trajectory Verdict & Documentation"
        subtitle="Formal assessment of inpatient recovery progress"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveVerdict}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Record Clinical Verdict
          </Button>
        }
      >
        {savedVerdictNotice && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Treatment response trajectory verdict recorded and digitally countersigned!
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Response Trajectory Classification</label>
            <select
              value={physicianVerdict}
              onChange={(e) => setPhysicianVerdict(e.target.value as any)}
              className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
            >
              <option value="Significant Improvement">Significant Improvement (Hemodynamically Stable & Weaning)</option>
              <option value="Partial Response">Partial Response (Ongoing Monitoring Required)</option>
              <option value="No Significant Change">No Significant Change (Equivocal)</option>
              <option value="Deterioration">Deterioration (Escalation Protocol Triggered)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Clinical Evaluation Summary & Recommendations</label>
            <textarea
              value={verdictNotes}
              onChange={(e) => setVerdictNotes(e.target.value)}
              rows={4}
              className="w-full p-3 border border-[#CBD5E1] rounded-lg font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Clinical Safety Mandate:</strong> AI Trajectory tracking serves as clinical decision support. Prescription alterations, vasopressor weaning, and transfer decisions require attending physician countersignature.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
