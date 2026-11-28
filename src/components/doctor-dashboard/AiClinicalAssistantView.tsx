import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  Send, 
  Save, 
  AlertTriangle,
  Lightbulb,
  Stethoscope,
  Info
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';

interface AiClinicalAssistantViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const AiClinicalAssistantView: React.FC<AiClinicalAssistantViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: 'MediSync AI Clinical Intelligence ready. Select a patient to review automated differential diagnoses, laboratory trend explanations, and generated draft SOAP notes. How can I assist you with clinical evaluation today?',
      time: 'Just now'
    }
  ]);
  const [hasDoctorReviewed, setHasDoctorReviewed] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  // AI Generated SOAP Note template tailored to current patient
  const [draftNote, setDraftNote] = useState<string>(
`SUBJECTIVE:
Patient ${currentPatient.name} (${currentPatient.patientId}), ${currentPatient.age}yo ${currentPatient.gender}, admitted on ${currentPatient.admissionDate}.
Chief Complaint: Acute decompensation associated with ${currentPatient.primaryDiagnosis}.
Current state: Patient reports persistent fatigue, dyspnea on minimal exertion, and localized pain.

OBJECTIVE:
Vitals: HR ${currentPatient.currentVitals.heartRate} bpm, BP ${currentPatient.currentVitals.systolicBP}/${currentPatient.currentVitals.diastolicBP} mmHg, SpO2 ${currentPatient.currentVitals.spO2}% on supplemental O2, RR ${currentPatient.currentVitals.respiratoryRate}/min, Temp ${currentPatient.currentVitals.temperature}°C, GCS ${currentPatient.currentVitals.gcsScore}/15.
MEWS Score: ${currentPatient.mewsScore}/14.
Pertinent Labs: ${currentPatient.labs.slice(0, 3).map(l => `${l.testName}: ${l.value} ${l.unit} (${l.status})`).join('; ')}.

ASSESSMENT:
1. ${currentPatient.primaryDiagnosis} - ${currentPatient.riskLevel === 'Critical' ? 'Unstable, high risk decompensation' : 'Progressing under observation'}.
2. Secondary factors: ${currentPatient.secondaryDiagnoses.join(', ')}.
3. Hemodynamic status: Responding to active inpatient therapy, strict fluid balance required.

PLAN:
1. Continue scheduled pharmacotherapy (${currentPatient.medications.slice(0, 3).map(m => m.name).join(', ')}).
2. Maintain telemetry monitoring; alert bedside nurse if SpO2 < 92% or HR > 110.
3. Repeat lab biomarkers in 6 hours.
4. Step-down transfer evaluation conditional on 24-hour hemodynamic stability.`
  );

  React.useEffect(() => {
    // Refresh draft note when patient changes
    setDraftNote(
`SUBJECTIVE:
Patient ${currentPatient.name} (${currentPatient.patientId}), ${currentPatient.age}yo ${currentPatient.gender}, admitted on ${currentPatient.admissionDate}.
Chief Complaint: Acute decompensation associated with ${currentPatient.primaryDiagnosis}.
Current state: Patient reports persistent fatigue, dyspnea on minimal exertion, and localized pain.

OBJECTIVE:
Vitals: HR ${currentPatient.currentVitals.heartRate} bpm, BP ${currentPatient.currentVitals.systolicBP}/${currentPatient.currentVitals.diastolicBP} mmHg, SpO2 ${currentPatient.currentVitals.spO2}% on supplemental O2, RR ${currentPatient.currentVitals.respiratoryRate}/min, Temp ${currentPatient.currentVitals.temperature}°C, GCS ${currentPatient.currentVitals.gcsScore}/15.
MEWS Score: ${currentPatient.mewsScore}/14.
Pertinent Labs: ${currentPatient.labs.slice(0, 3).map(l => `${l.testName}: ${l.value} ${l.unit} (${l.status})`).join('; ')}.

ASSESSMENT:
1. ${currentPatient.primaryDiagnosis} - ${currentPatient.riskLevel === 'Critical' ? 'Unstable, high risk decompensation' : 'Progressing under observation'}.
2. Secondary factors: ${currentPatient.secondaryDiagnoses.join(', ')}.
3. Hemodynamic status: Responding to active inpatient therapy, strict fluid balance required.

PLAN:
1. Continue scheduled pharmacotherapy (${currentPatient.medications.slice(0, 3).map(m => m.name).join(', ')}).
2. Maintain telemetry monitoring; alert bedside nurse if SpO2 < 92% or HR > 110.
3. Repeat lab biomarkers in 6 hours.
4. Step-down transfer evaluation conditional on 24-hour hemodynamic stability.`
    );
    setHasDoctorReviewed(false);
  }, [currentPatient.patientId]);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const newQuestion = userQuestion;
    setUserQuestion('');
    setChatLog(prev => [
      ...prev,
      { sender: 'user', text: newQuestion, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    setTimeout(() => {
      let aiReply = `Based on ${currentPatient.name}'s telemetry and lab records: current MEWS is ${currentPatient.mewsScore}/14. For ${currentPatient.primaryDiagnosis}, institutional protocols recommend close arterial blood gas monitoring, maintaining SpO2 > 94%, and titrating vasoactive support to mean arterial pressure > 65 mmHg.`;
      if (newQuestion.toLowerCase().includes('dose') || newQuestion.toLowerCase().includes('antibiotic')) {
        aiReply = `For renal considerations in ${currentPatient.name}: review creatinine clearance prior to next dose. Ensure peak and trough serum levels are drawn 30 mins before the 3rd dose.`;
      } else if (newQuestion.toLowerCase().includes('discharge') || newQuestion.toLowerCase().includes('step-down')) {
        aiReply = `Step-down eligibility criteria: MEWS < 2 for at least 12 hours, afebrile without antipyretics > 24 hours, and weaning from high-flow oxygen. Current status: ${currentPatient.dischargeReady ? 'Ready for transfer' : 'Requires further observation'}.`;
      }

      setChatLog(prev => [
        ...prev,
        { sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 600);
  };

  const handleSaveToEmr = () => {
    if (!hasDoctorReviewed) {
      alert('Please check the verification box confirming you have reviewed and approved this clinical note.');
      return;
    }
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Sparkles className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">AI Clinical Assistant & Decision Support</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-400/30 font-semibold">
                DOCTOR VERIFICATION MANDATORY
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Synthesis of EHR history, real-time telemetry, lab explanations, and draft progress notes.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Clinical Synthesis & Diagnostic Insights */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Clinical Synthesis & Key Findings" noPadding>
            <div className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B]">{currentPatient.name}</span>
                  <Badge variant={currentPatient.riskLevel === 'Critical' ? 'critical' : 'warning'} size="sm">
                    {currentPatient.riskLevel}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Primary: <strong>{currentPatient.primaryDiagnosis}</strong> &middot; Ward: {currentPatient.ward}
                </div>
              </div>

              {/* Lab Insights */}
              <div>
                <span className="font-bold text-[#1E293B] block text-[11px] uppercase tracking-wider text-slate-500">
                  Critical Lab Indices & Physiological Interpretation:
                </span>
                <div className="mt-1.5 space-y-2">
                  {currentPatient.labs.slice(0, 3).map(lab => (
                    <div key={lab.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">{lab.testName}</strong>
                        <span className={`font-mono font-bold ${
                          lab.status === 'Critical Panic' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {lab.value} {lab.unit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Ref: {lab.referenceRange} &middot; {lab.notes || 'Values require physician trend analysis.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication Alert */}
              <div>
                <span className="font-bold text-[#1E293B] block text-[11px] uppercase tracking-wider text-slate-500">
                  Pharmacological Safety Check:
                </span>
                <p className="mt-1 text-slate-600 p-2.5 bg-amber-50 border border-amber-200 rounded-lg leading-relaxed">
                  Active medications count: {currentPatient.medications.length}. Monitor for potential drug-drug synergism, particularly fluid-electrolyte balance and blood pressure variations.
                </p>
              </div>
            </div>
          </Card>

          {/* Ask AI Copilot Interactive Box */}
          <Card title="Ask AI Clinical Copilot" subtitle="Query clinical protocols, guidelines, and patient data" noPadding>
            <div className="p-4 flex flex-col h-80">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg max-w-[88%] ${
                      msg.sender === 'user'
                        ? 'ml-auto bg-[#2563A6] text-white'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] opacity-75 mb-0.5">{msg.sender === 'user' ? 'Doctor' : 'AI Copilot'} &middot; {msg.time}</div>
                    <div className="leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAskQuestion} className="mt-3 flex gap-2 pt-2 border-t border-[#E2E8F0]">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask a clinical question (e.g. antibiotic dosing, step-down criteria)..."
                  className="flex-1 text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
                />
                <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                  Ask
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column: AI-Drafted Progress Note & Doctor Review */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="AI-Drafted Clinical Progress Note (SOAP)"
            subtitle="Review, edit, and authorize note before saving into permanent medical records"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToEmr}
                disabled={!hasDoctorReviewed}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Sign & Save to EMR
              </Button>
            }
          >
            {noteSavedFeedback && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Clinical progress note successfully signed and committed to EHR for {currentPatient.name}!
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#1E293B]">Clinical Note Content (Editable):</label>
                  <span className="text-[11px] text-slate-500 font-mono">Format: Structured SOAP</span>
                </div>
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={14}
                  className="w-full p-3 font-mono text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-[#F8FAFC] leading-relaxed text-[#1E293B]"
                />
              </div>

              {/* Mandatory Doctor Verification Checkbox */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <input
                  type="checkbox"
                  id="doctorVerifyCheckbox"
                  checked={hasDoctorReviewed}
                  onChange={(e) => setHasDoctorReviewed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#2563A6] rounded border-[#CBD5E1] focus:ring-[#2563A6] cursor-pointer"
                />
                <label htmlFor="doctorVerifyCheckbox" className="text-xs text-[#1E293B] cursor-pointer leading-relaxed">
                  <strong>Attending Physician Attestation:</strong> I have clinically examined the patient and reviewed the AI-generated synthesis. I confirm that this progress note accurately reflects the current status and diagnostic treatment plan.
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
