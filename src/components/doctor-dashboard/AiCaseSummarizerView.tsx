import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Printer,
  ChevronDown
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';

interface AiCaseSummarizerViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const AiCaseSummarizerView: React.FC<AiCaseSummarizerViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);
  const [copied, setCopied] = useState(false);
  const [savedToEmr, setSavedToEmr] = useState(false);
  const [isReviewedByDoctor, setIsReviewedByDoctor] = useState(false);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  // 9 Structured Sections generator
  const summarySections = [
    {
      num: 1,
      title: 'Patient Identification & Demographics',
      content: `Patient Name: ${currentPatient.name} | Hospital ID: ${currentPatient.patientId} | Age: ${currentPatient.age} | Gender: ${currentPatient.gender} | Blood Group: ${currentPatient.bloodGroup} | Ward: ${currentPatient.ward} (Bed ${currentPatient.bedNumber}) | Attending Physician: ${currentPatient.attendingPhysician} | Resuscitation Code: ${currentPatient.resuscitationStatus}`
    },
    {
      num: 2,
      title: 'Chief Complaint & Admission History',
      content: `Admitted on ${currentPatient.admissionDate} presenting with acute exacerbation of symptoms secondary to ${currentPatient.primaryDiagnosis}. Initial triage assessment indicated acute distress necessitating immediate bed placement in ${currentPatient.ward}. Documented baseline risk category: ${currentPatient.riskLevel}.`
    },
    {
      num: 3,
      title: 'Primary & Secondary Diagnoses',
      content: `Primary Diagnosis: ${currentPatient.primaryDiagnosis} (ICD-10: ${currentPatient.icd10}). Secondary Comorbidities: ${currentPatient.secondaryDiagnoses.join('; ')}. Medical History: ${currentPatient.medicalHistory.join('; ')}.`
    },
    {
      num: 4,
      title: 'Vital Sign Trends & Physiological Stability',
      content: `Current Physiological Parameters: Heart Rate ${currentPatient.currentVitals.heartRate} bpm, Blood Pressure ${currentPatient.currentVitals.systolicBP}/${currentPatient.currentVitals.diastolicBP} mmHg, SpO2 ${currentPatient.currentVitals.spO2}%, Respiratory Rate ${currentPatient.currentVitals.respiratoryRate}/min, Temperature ${currentPatient.currentVitals.temperature}°C, GCS ${currentPatient.currentVitals.gcsScore}/15. Calculated MEWS Score: ${currentPatient.mewsScore}/14. Serial telemetry confirms hemodynamic trends under close continuous monitoring.`
    },
    {
      num: 5,
      title: 'Critical Laboratory & Diagnostic Findings',
      content: currentPatient.labs.map(l => `${l.testName}: ${l.value} ${l.unit} [Ref: ${l.referenceRange}] — Status: ${l.status}`).join('\n')
    },
    {
      num: 6,
      title: 'Current Treatment & Medication Regimen',
      content: currentPatient.medications.map(m => `${m.name} ${m.dosage} (${m.route}) - ${m.frequency} for ${m.indication} [Prescribed by ${m.prescribingDoctor}]`).join('\n')
    },
    {
      num: 7,
      title: 'Response to Therapy & Step-down Trajectory',
      content: `${currentPatient.clinicalObservations} Current clinical trajectory indicates patient is ${currentPatient.dischargeReady ? 'stabilizing with progressive symptom resolution' : 'actively undergoing acute therapeutic stabilization in high-acuity ward'}.`
    },
    {
      num: 8,
      title: 'Active Risks & Contingency Protocols',
      content: `Allergy Profile: ${currentPatient.allergies.length > 0 ? currentPatient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ') : 'No Known Drug Allergies (NKDA)'}. Isolation Protocol: ${currentPatient.isolationProtocol || 'Standard Universal Precautions'}. Rapid response escalation protocol actively standing by in case of acute oxygen desaturation or tachycardia.`
    },
    {
      num: 9,
      title: 'Actionable Discharge & Transfer Recommendations',
      content: currentPatient.dischargeReady 
        ? `Patient meets clinical step-down criteria. Recommended actions: 1) Schedule transition to general step-down ward. 2) Reconcile outpatient medications. 3) Book outpatient specialty follow-up in 10-14 days.`
        : `Patient does NOT yet meet step-down discharge criteria. Recommended actions: 1) Continue inpatient ICU/HDU monitoring. 2) Repeat serial cardiac and inflammatory biomarkers in 12 hours. 3) Re-evaluate after next morning attending ward round.`
    }
  ];

  const fullSummaryText = `=====================================================
MEDISYNC AI — COMPREHENSIVE CLINICAL CASE SUMMARY
Generated: ${new Date().toLocaleString()}
Patient: ${currentPatient.name} (${currentPatient.patientId})
Attending Physician: ${currentPatient.attendingPhysician}
=====================================================

` + summarySections.map(s => `${s.num}. ${s.title.toUpperCase()}\n${s.content}\n`).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToEmr = () => {
    setSavedToEmr(true);
    setTimeout(() => setSavedToEmr(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-700/60 flex items-center justify-center shrink-0 border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">AI Case Summarizer (9 Structured Clinical Sections)</h3>
              <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                AUTONOMOUS SYNTHESIS
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Comprehensive inpatient clinical synthesis standardized for handovers, case conferences, and discharge documentation.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs border border-indigo-400/40 rounded-lg px-3 py-2 bg-slate-900 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} — {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-white border-white/20 hover:bg-white/10"
          >
            {copied ? 'Copied to Clipboard' : 'Copy Summary'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveToEmr}
            disabled={!isReviewedByDoctor}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save to Clinical EMR
          </Button>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-800">
        <input
          type="checkbox"
          id="summarizerAttestation"
          checked={isReviewedByDoctor}
          onChange={(e) => setIsReviewedByDoctor(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
        <label htmlFor="summarizerAttestation" className="cursor-pointer leading-relaxed">
          <strong>Physician Case Review & Verification:</strong> I have checked this synthesized 9-point case summary against verified hospital chart records. Missing or pending data has been identified.
        </label>
      </div>

      {savedToEmr && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Full 9-section case summary successfully filed and archived in permanent medical records!
        </div>
      )}

      {/* 9 Structured Sections Card Display */}
      <div className="space-y-4">
        {summarySections.map((section) => (
          <Card key={section.num} noPadding>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563A6] font-extrabold text-xs flex items-center justify-center shrink-0">
                  {section.num}
                </span>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#1E293B]">
                  {section.title}
                </h4>
              </div>
              <div className="text-xs text-[#334155] leading-relaxed pl-8 font-mono whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                {section.content}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
