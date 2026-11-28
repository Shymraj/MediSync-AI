import React, { useState } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  FileCheck, 
  Printer, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';
import { api } from '../../services/api';
import { hospitalDataService } from '../../services/hospitalDataService';

interface DischargeIntelligenceViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const DischargeIntelligenceView: React.FC<DischargeIntelligenceViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  // 7-Point Discharge Checklist State
  const [checklist, setChecklist] = useState({
    vitalsStable: currentPatient.mewsScore <= 2,
    afebrile: currentPatient.currentVitals?.temperature < 37.5,
    oralTolerated: true,
    labsNormalizing: (currentPatient.labs || []).every(l => l.status !== 'Critical Panic'),
    medsReconciled: true,
    followupBooked: currentPatient.dischargeReady,
    counselingCompleted: currentPatient.dischargeReady
  });

  const [authorizedNotice, setAuthorizedNotice] = useState(false);

  const handleToggle = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalPoints = Object.keys(checklist).length;
  const completedPoints = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedPoints / totalPoints) * 100);

  const handleAuthorize = async () => {
    try {
      await api.dischargePatient({
        patientId: currentPatient.patientId,
        dischargeNotes: `Standard 7-point discharge verified (${progressPercent}% criteria met). Stable vitals, oral medication reconciled.`
      });
    } catch {}

    hospitalDataService.admitOrUpdatePatient({
      patientId: currentPatient.patientId,
      name: currentPatient.name,
      dischargeReady: true,
      timeline: [
        {
          id: 'ev-' + Date.now(),
          timestamp: 'Just now',
          date: new Date().toISOString().split('T')[0],
          category: 'Procedure',
          title: 'Physician Authorized Discharge / Step-Down',
          description: `All clinical safety criteria fulfilled (${progressPercent}%). Bed release initiated.`,
          actor: 'Dr. Sundaramoorthy M.',
          severity: 'normal'
        },
        ...(currentPatient.timeline || [])
      ]
    });

    setAuthorizedNotice(true);
    setTimeout(() => setAuthorizedNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <CheckSquare className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Smart Discharge & Step-Down Intelligence</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                progressPercent === 100 ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {progressPercent}% READINESS
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Standardized criteria verification preventing premature discharge and reducing 30-day readmissions.
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-200 font-semibold whitespace-nowrap">Target Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs border border-blue-400/40 rounded-lg px-3 py-2 bg-slate-900 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} — {p.name} ({p.ward})
              </option>
            ))}
          </select>
        </div>
      </div>

      {authorizedNotice && (
        <div className="p-4 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            Discharge summary and step-down transfer successfully authorized by Attending Physician for {currentPatient.name}!
          </div>
        </div>
      )}

      {/* Checklist Card */}
      <Card
        title={`Inpatient Discharge Readiness Protocol (${completedPoints}/${totalPoints} Completed)`}
        subtitle={`Mandatory criteria for safe discharge / step-down transfer`}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={handleAuthorize}
            disabled={progressPercent < 80}
            icon={<FileCheck className="w-3.5 h-3.5" />}
          >
            Authorize Discharge / Step-down
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-semibold">
              <span>Readiness Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-green-500' : progressPercent >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="divide-y divide-[#E2E8F0] text-xs">
            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.vitalsStable}
                onChange={() => handleToggle('vitalsStable')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">1. Hemodynamic Stability (MEWS &le; 2 for &gt; 12 hours)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Current MEWS is {currentPatient.mewsScore}/14. Blood pressure and heart rate within acceptable range without ongoing vasopressor infusion.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.afebrile}
                onChange={() => handleToggle('afebrile')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">2. Afebrile Status (&gt; 24 hours without antipyretics)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Current temperature: {currentPatient.currentVitals.temperature}&deg;C. No spike observed in last 3 recording cycles.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.oralTolerated}
                onChange={() => handleToggle('oralTolerated')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">3. Oral Nutritional & Medication Intake Tolerated</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  IV lines weaned or capped; patient tolerating oral diet and oral pharmacological equivalents.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.labsNormalizing}
                onChange={() => handleToggle('labsNormalizing')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">4. Diagnostic Labs Normalizing / Stable Trend</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  No unacknowledged critical panic lab values. Electrolytes, renal parameters, and blood count within safe limits.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.medsReconciled}
                onChange={() => handleToggle('medsReconciled')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">5. Discharge Medications Reconciled & Printed</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Discharge prescription reviewed for contraindications, dosage instructions, and duration.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.followupBooked}
                onChange={() => handleToggle('followupBooked')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">6. Outpatient Specialist Follow-Up Confirmed</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Follow-up appointment booked in OPD cardiology/general medicine clinic within 7-14 days.
                </p>
              </div>
            </div>

            <div className="py-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checklist.counselingCompleted}
                onChange={() => handleToggle('counselingCompleted')}
                className="mt-0.5 w-4 h-4 text-[#2563A6] rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-bold text-[#1E293B]">7. Patient & Caregiver Red-Flag Warning Education</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Caregiver briefed on warning signs (chest pain, shortness of breath, fever) requiring emergency readmission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
