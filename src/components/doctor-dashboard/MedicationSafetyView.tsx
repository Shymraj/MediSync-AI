import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Filter, 
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  KNOWN_DRUG_INTERACTIONS, 
  DrugInteractionAlert, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';

interface MedicationSafetyViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const MedicationSafetyView: React.FC<MedicationSafetyViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  // Detect active drug interactions for the selected patient
  const patientMedNames = currentPatient.medications.map(m => m.name.toLowerCase());

  const detectedInteractions = KNOWN_DRUG_INTERACTIONS.filter(interaction => {
    const drug1 = interaction.drugs[0].toLowerCase();
    const drug2 = interaction.drugs[1].toLowerCase();
    const hasDrug1 = patientMedNames.some(m => m.includes(drug1) || drug1.includes(m.split(' ')[0]));
    const hasDrug2 = patientMedNames.some(m => m.includes(drug2) || drug2.includes(m.split(' ')[0]));
    return hasDrug1 && hasDrug2;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/40 flex items-center justify-center shrink-0 border border-amber-400/30">
            <ShieldAlert className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Medication Safety & Pharmacological Interaction Radar</h3>
              <span className="bg-amber-500/30 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                E-MAR SAFETY ENGINE
              </span>
            </div>
            <p className="text-xs text-amber-100/80 mt-0.5">
              Continuous cross-referencing of active prescriptions against allergy profiles and drug-drug contraindication libraries.
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-200 font-semibold whitespace-nowrap">Target Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs border border-amber-400/40 rounded-lg px-3 py-2 bg-slate-900 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Allergies Verification Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        currentPatient.allergies.length > 0 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : 'bg-green-50 border-green-200 text-[#15803D]'
      }`}>
        <div className="flex items-center gap-3">
          {currentPatient.allergies.length > 0 ? (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
          )}
          <div className="text-xs">
            <span className="font-bold block">
              {currentPatient.allergies.length > 0 ? 'Documented Patient Allergies Flagged' : 'No Known Drug Allergies (NKDA)'}
            </span>
            <span className="text-[11px] mt-0.5 block">
              {currentPatient.allergies.length > 0 
                ? currentPatient.allergies.map(a => `${a.allergen} (${a.reaction} - ${a.severity})`).join('; ')
                : 'Verified against national electronic health registry records.'}
            </span>
          </div>
        </div>
      </div>

      {/* Detected Interactions Radar */}
      <Card
        title={`Potential Drug-Drug Synergism & Interactions (${detectedInteractions.length} Flagged)`}
        subtitle="Automated analysis between currently prescribed medications"
        noPadding
      >
        {detectedInteractions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#15803D] font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            No major drug-drug interactions detected among currently active inpatient prescriptions.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {detectedInteractions.map(inter => (
              <div key={inter.id} className="p-4 space-y-2 bg-amber-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1E293B]">
                      {inter.drugs[0]} &harr; {inter.drugs[1]}
                    </span>
                    <Badge variant={inter.severity === 'Major' ? 'critical' : 'warning'} size="sm">
                      {inter.severity.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-slate-700">
                  <strong>Physiological Effect:</strong> {inter.effect}
                </div>
                <div className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                  <strong>Clinical Mitigation:</strong> {inter.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Prescriptions Table */}
      <Card
        title={`Active Scheduled Prescriptions (${currentPatient.medications.length})`}
        subtitle="Current inpatient pharmacological therapy"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Medication Name</th>
                <th className="px-4 py-3">Dose & Route</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Indication</th>
                <th className="px-4 py-3">Prescribing Doctor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {currentPatient.medications.map(med => (
                <tr key={med.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#1E293B]">{med.name}</div>
                    <div className="text-[10px] text-slate-400">Initiated: {med.startDate}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#2563A6]">{med.dosage} ({med.route})</td>
                  <td className="px-4 py-3 text-[#475569]">{med.frequency}</td>
                  <td className="px-4 py-3 text-[#64748B]">{med.indication}</td>
                  <td className="px-4 py-3 text-slate-600">{med.prescribingDoctor}</td>
                  <td className="px-4 py-3">
                    <Badge variant={med.status === 'Active' ? 'success' : 'warning'} size="sm">
                      {med.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
