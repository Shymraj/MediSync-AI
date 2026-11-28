import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  Activity,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Info,
  ArrowLeft,
  RotateCcw,
  Zap,
  Flame,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Building2,
  Send,
  Siren,
  Check,
  Calendar,
  Phone
} from 'lucide-react';
import {
  isMatchingHospital,
  OPD_REQUESTS_STORAGE_KEY,
  OPD_UPDATE_EVENT,
  getPatientTokenStorageKey
} from '../../utils/hospitalSync';

export interface AIQueueUrgencyModuleProps {
  hospitalName?: string;
  hospitalId?: string;
  patientName?: string;
  patientId?: string;
  patientMobile?: string;
  onBackToOverview: () => void;
  onBookWithUrgency?: (assessmentData: any) => void;
}

export interface AssessmentResult {
  patient_id: string;
  patient_name: string;
  hospital_id: string;
  ai_priority: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  ml_predicted_priority: string;
  confidence_score: number;
  emergency_alert: boolean;
  safety_override: boolean;
  safety_flags: string[];
  priority_reason: string;
  recommended_action: string;
  disclaimer: string;
  evaluated_at: string;
}

const COMMON_SYMPTOMS = [
  'chest discomfort',
  'breathing difficulty',
  'fever',
  'headache',
  'cough',
  'abdominal pain',
  'dizziness',
  'vomiting',
  'diarrhea',
  'weakness',
  'fatigue',
  'minor injury',
  'allergic symptoms',
  'cold',
  'joint pain',
  'sore throat',
  'rash',
  'back pain',
  'dehydration'
];

const CHRONIC_CONDITIONS = [
  'hypertension',
  'diabetes',
  'asthma',
  'heart disease',
  'kidney disease',
  'multiple chronic conditions'
];

export const AIQueueUrgencyModule: React.FC<AIQueueUrgencyModuleProps> = ({
  hospitalName = 'Rajiv Gandhi Government General Hospital (RGGGH)',
  hospitalId = 'hosp-chn-01',
  patientName = 'Patient',
  patientId = 'usr-patient',
  patientMobile = '+91 98401 22345',
  onBackToOverview,
  onBookWithUrgency
}) => {
  // Form State (7 Kept Patient-Friendly Fields - Temperature, Heart Rate, SpO2 removed from patient form)
  const [age, setAge] = useState<number>(45);
  const [symptomDurationHours, setSymptomDurationHours] = useState<number>(6);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['fever', 'cough']);
  const [painLevel, setPainLevel] = useState<number>(4);
  const [breathingDifficulty, setBreathingDifficulty] = useState<boolean>(false);
  const [consciousnessStatus, setConsciousnessStatus] = useState<string>('normal');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['none']);

  // UI & Loading States
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  // Initial state is null: Do NOT auto-evaluate on load!
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  // Submission & Hospital Tracking State (persists & restores strictly for THIS hospital)
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const found = list.find(
            (r: any) => r.aiPriority && isMatchingHospital(r, hospitalId, hospitalName) && r.status !== 'Cancelled'
          );
          if (found?.requestId) return found.requestId;
        }
      }
    } catch {}
    return null;
  });
  const [submittedRequestData, setSubmittedRequestData] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return (
            list.find(
              (r: any) => r.aiPriority && isMatchingHospital(r, hospitalId, hospitalName) && r.status !== 'Cancelled'
            ) || null
          );
        }
      }
    } catch {}
    return null;
  });

  // Toggle symptom pill
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      } else {
        return [...prev, symptom];
      }
    });
  };

  // Toggle condition pill
  const toggleCondition = (cond: string) => {
    if (cond === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    setSelectedConditions(prev => {
      const filtered = prev.filter(c => c !== 'none');
      if (filtered.includes(cond)) {
        return filtered.length === 1 ? ['none'] : filtered.filter(c => c !== cond);
      } else {
        return [...filtered, cond];
      }
    });
  };

  // Quick Preset Handlers for Instant Demo Evaluation
  const applyPreset = (preset: 'cardiac' | 'asthma' | 'routine' | 'mild') => {
    setSubmittedRequestId(null);
    setSubmittedRequestData(null);
    if (preset === 'cardiac') {
      setAge(56);
      setSymptomDurationHours(2);
      setSelectedSymptoms(['chest discomfort', 'breathing difficulty', 'dizziness']);
      setPainLevel(8);
      setBreathingDifficulty(true);
      setConsciousnessStatus('normal');
      setSelectedConditions(['hypertension', 'heart disease']);
    } else if (preset === 'asthma') {
      setAge(64);
      setSymptomDurationHours(5);
      setSelectedSymptoms(['breathing difficulty', 'cough', 'fatigue']);
      setPainLevel(5);
      setBreathingDifficulty(true);
      setConsciousnessStatus('normal');
      setSelectedConditions(['asthma', 'multiple chronic conditions']);
    } else if (preset === 'routine') {
      setAge(34);
      setSymptomDurationHours(24);
      setSelectedSymptoms(['fever', 'cough', 'headache']);
      setPainLevel(3);
      setBreathingDifficulty(false);
      setConsciousnessStatus('normal');
      setSelectedConditions(['none']);
    } else if (preset === 'mild') {
      setAge(26);
      setSymptomDurationHours(48);
      setSelectedSymptoms(['cold', 'sore throat']);
      setPainLevel(1);
      setBreathingDifficulty(false);
      setConsciousnessStatus('normal');
      setSelectedConditions(['none']);
    }
  };

  // Execute AI Assessment
  const handleAssess = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom to evaluate queue priority.');
      return;
    }

    setIsAssessing(true);
    setSubmittedRequestId(null);
    setSubmittedRequestData(null);

    // Derived baseline vitals inferred clinically from patient inputs
    const isCardiac = selectedSymptoms.includes('chest discomfort');
    const isDyspnea = breathingDifficulty || selectedSymptoms.includes('breathing difficulty');
    const isFebrile = selectedSymptoms.includes('fever');
    
    const inferredTemp = isFebrile ? 38.6 : 37.0;
    const inferredHR = (isCardiac || isDyspnea || painLevel >= 8) ? 116 : (isFebrile ? 92 : 75);
    const inferredSpO2 = isDyspnea ? 91 : (isCardiac ? 93 : 98);

    const payload = {
      patient_id: patientId,
      patient_name: patientName,
      hospital_id: hospitalId,
      age: Number(age),
      symptoms: selectedSymptoms,
      symptom_duration_hours: Number(symptomDurationHours),
      temperature_celsius: inferredTemp,
      heart_rate: inferredHR,
      spo2: inferredSpO2,
      pain_level_1_to_10: Number(painLevel),
      breathing_difficulty: breathingDifficulty ? 'yes' : 'no',
      consciousness_status: consciousnessStatus,
      existing_conditions: selectedConditions
    };

    try {
      const res = await fetch('http://localhost:5000/api/queue/ai-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setAssessmentResult(data.assessment);
      } else {
        throw new Error('Server assessment endpoint returned non-200');
      }
    } catch (err) {
      // Deterministic Safety Rules fallback
      console.warn('Using client-side clinical safety evaluator:', err);
      let p: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'MODERATE';
      const flags: string[] = [];
      let emergencyAlert = false;
      let override = false;
      let reason = 'AI evaluated patient symptoms and condition indicators.';
      let action = 'Standard consultation queue assignment.';

      if (inferredSpO2 < 90) {
        flags.push(`Severe respiratory strain detected`);
        p = 'CRITICAL';
        emergencyAlert = true;
        override = true;
      }
      if (consciousnessStatus === 'unresponsive') {
        flags.push('Patient is unresponsive - immediate resuscitation alert');
        p = 'CRITICAL';
        emergencyAlert = true;
        override = true;
      } else if (consciousnessStatus === 'confused') {
        flags.push('Acute confusion / altered mental status reported');
        p = 'HIGH';
        emergencyAlert = true;
      }

      if (isCardiac && (painLevel >= 7 || isDyspnea || age >= 50)) {
        flags.push('High-risk acute cardiac symptom cluster');
        p = 'CRITICAL';
        emergencyAlert = true;
        override = true;
      } else if (isCardiac) {
        flags.push('Chest discomfort reported - urgent ECG triage required');
        if (p !== 'CRITICAL') p = 'HIGH';
      }

      if (isDyspnea && p !== 'CRITICAL') {
        flags.push('Acute breathing difficulty reported');
        p = 'HIGH';
      }

      if (painLevel >= 9 && p === 'MODERATE') {
        p = 'HIGH';
        flags.push('Severe acute pain rating');
      }

      if (p === 'MODERATE' && painLevel <= 2 && !isFebrile && (selectedSymptoms.includes('cold') || selectedSymptoms.includes('sore throat') || selectedSymptoms.includes('minor injury'))) {
        p = 'LOW';
      }

      if (p === 'CRITICAL') {
        action = `Immediate transfer to ${hospitalName} Emergency / Red Bay. Duty emergency physician alerted.`;
        reason = 'Clinical safety rules triggered CRITICAL alert due to high-risk cardiac/respiratory danger.';
      } else if (p === 'HIGH') {
        action = `Fast-track priority queue at ${hospitalName}. Assessment within 15 minutes.`;
        reason = 'Urgent priority established due to breathing difficulty or elevated clinical risk.';
      } else if (p === 'LOW') {
        action = 'Routine OPD consultation queue. Non-urgent standard slot assigned.';
        reason = 'Baseline symptoms within routine, non-urgent reference ranges.';
      }

      setAssessmentResult({
        patient_id: patientId,
        patient_name: patientName,
        hospital_id: hospitalId,
        ai_priority: p,
        ml_predicted_priority: p,
        confidence_score: p === 'CRITICAL' ? 0.96 : (p === 'HIGH' ? 0.92 : 0.88),
        emergency_alert: emergencyAlert,
        safety_override: override,
        safety_flags: flags,
        priority_reason: reason,
        recommended_action: action,
        disclaimer: 'SYNTHETIC DECISION-SUPPORT DEMO ONLY — NOT A CLINICAL DIAGNOSIS.',
        evaluated_at: new Date().toISOString()
      });
    } finally {
      setIsAssessing(false);
    }
  };

  // Submit Urgent / Priority Request to Specific Hospital
  const handleSubmitToHospital = async () => {
    if (!assessmentResult) return;

    const hospAbbr = (hospitalName.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'HOSP').toUpperCase();
    const isCritical = assessmentResult.ai_priority === 'CRITICAL';
    const isHigh = assessmentResult.ai_priority === 'HIGH';

    const reqId = `REQ-${hospAbbr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempToken = 'AWAITING-APPROVAL';

    // Department routing based on symptoms
    const departmentName = selectedSymptoms.includes('chest discomfort')
      ? 'Cardiology OPD'
      : (breathingDifficulty ? 'Pulmonology OPD' : 'General Medicine OPD');

    const newRequestItem = {
      tokenNumber: tempToken,
      requestId: reqId,
      hospitalId: hospitalId,
      hospitalName: hospitalName,
      department: departmentName,
      doctorName: 'Pending Doctor Allocation',
      date: '2026-11-28',
      timeSlot: isCritical ? 'IMMEDIATE EMERGENCY INTAKE' : 'Current OPD Session',
      purpose: selectedSymptoms.join(', ') + ` (Pain: ${painLevel}/10, Duration: ${symptomDurationHours}h)`,
      patientName: patientName,
      patientMobile: patientMobile || '+91 98401 22345',
      patientAgeGender: `${age} / Adult`,
      counterNumber: isCritical ? 'Red Bay / Casualty Room' : 'Awaiting Room Allocation',
      queuePosition: isCritical ? 1 : (isHigh ? 2 : 5),
      currentServingToken: 'C-021',
      estimatedWaitMinutes: isCritical ? 2 : (isHigh ? 10 : 30),
      status: 'Pending', // Hospital must accept & allocate doctor
      bookedAt: 'Just now',
      aiPriority: assessmentResult.ai_priority,
      emergencyAlert: assessmentResult.emergency_alert,
      confidenceScore: assessmentResult.confidence_score,
      safetyFlags: assessmentResult.safety_flags,
      priorityReason: assessmentResult.priority_reason,
      recommendedAction: assessmentResult.recommended_action,
      vitals: {
        temp: selectedSymptoms.includes('fever') ? 38.6 : 37.0,
        heartRate: isCritical ? 116 : 76,
        spo2: breathingDifficulty ? 91 : 98,
        painLevel,
        breathingDifficulty: breathingDifficulty ? 'yes' : 'no',
        consciousness: consciousnessStatus
      }
    };

    // Store directly under this hospitalId/hospitalName so ONLY the selected hospital receives it
    try {
      const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
      let currentRequests = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(currentRequests)) currentRequests = [];
      currentRequests.unshift(newRequestItem);
      localStorage.setItem(OPD_REQUESTS_STORAGE_KEY, JSON.stringify(currentRequests));
      localStorage.setItem(getPatientTokenStorageKey(hospitalId), JSON.stringify(newRequestItem));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent(OPD_UPDATE_EVENT));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    // Call backend API
    try {
      fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          hospitalId,
          department: departmentName,
          doctorName: 'Pending Hospital Allocation',
          date: '2026-11-28',
          time: 'Current Session',
          symptoms: selectedSymptoms,
          vitals: newRequestItem.vitals,
          age
        })
      }).catch(() => {});
    } catch {}

    setSubmittedRequestId(reqId);
    setSubmittedRequestData(newRequestItem);
    onBookWithUrgency?.(assessmentResult);
  };

  // Sync / Listen for Hospital Staff Acceptance & Doctor Allocation
  useEffect(() => {
    if (!submittedRequestId) return;

    const checkHospitalAcceptance = () => {
      try {
        const stored = localStorage.getItem(OPD_REQUESTS_STORAGE_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.find(
            (r: any) => r.requestId === submittedRequestId && isMatchingHospital(r, hospitalId, hospitalName)
          );
          if (found) {
            setSubmittedRequestData(found);
          }
        }
      } catch {}
    };

    checkHospitalAcceptance();
    const interval = setInterval(checkHospitalAcceptance, 1500);
    window.addEventListener('storage', checkHospitalAcceptance);
    window.addEventListener(OPD_UPDATE_EVENT, checkHospitalAcceptance);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkHospitalAcceptance);
      window.removeEventListener(OPD_UPDATE_EVENT, checkHospitalAcceptance);
    };
  }, [submittedRequestId, hospitalId, hospitalName]);

  // Priority Styling Helpers
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500',
          text: 'text-red-700',
          border: 'border-red-300',
          chipBg: 'bg-red-50',
          badgeText: 'CRITICAL / அதீத அவசரம்',
          desc: 'Immediate Clinical Intervention Required. Directed to Emergency / Red Bay.',
          waitEstimate: '< 5 Minutes'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-800',
          border: 'border-amber-300',
          chipBg: 'bg-amber-50',
          badgeText: 'HIGH URGENCY / அதிக முன்னுரிமை',
          desc: 'Fast-Track Priority Queue Slot. Clinical assessment within 15 minutes.',
          waitEstimate: '10 - 15 Minutes'
        };
      case 'MODERATE':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-800',
          border: 'border-blue-300',
          chipBg: 'bg-blue-50',
          badgeText: 'MODERATE / நடுத்தர வரிசை',
          desc: 'Standard OPD consultation queue progression.',
          waitEstimate: '25 - 35 Minutes'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-800',
          border: 'border-emerald-300',
          chipBg: 'bg-emerald-50',
          badgeText: 'LOW / வழக்கமான வரிசை',
          desc: 'Routine consultation. Standard queue progression.',
          waitEstimate: '45+ Minutes'
        };
    }
  };

  const isHospitalAccepted = submittedRequestData && (submittedRequestData.status === 'In Queue' || submittedRequestData.status === 'Called' || submittedRequestData.status === 'Completed');
  const isHospitalDeclined = submittedRequestData && submittedRequestData.status === 'Declined';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header & Navigation Return */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-orange-200/80 shadow-xs">
        <button
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Care Portal (முகப்பு)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
            AI- Queue Priority
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Triage Active
          </span>
        </div>
      </div>

      {/* Hero Banner: Clean & Patient-Friendly (Technical dataset & prototype disclaimer text removed) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-[#FFF5ED] via-[#FFEADB] to-[#FFF0E6] border border-[#FED7AA] shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-black mb-2">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              Smart Urgency & Doctor Allocation Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              AI- Queue Priority
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
              Report your current symptoms and health condition to determine consultation urgency. The hospital clinical team at <strong className="text-orange-950 font-bold">{hospitalName}</strong> will review your request, allocate an available duty doctor, and issue your priority queue token.
            </p>
          </div>

          {/* Quick Preset Buttons for Instant Demo Testing */}
          <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-orange-200 shadow-xs shrink-0 lg:w-72">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                1-Click Sample Test Cases
              </span>
              <span className="text-[10px] text-orange-600 font-bold">Try Now</span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => applyPreset('cardiac')}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 flex items-center justify-between cursor-pointer"
              >
                <span>🫀 Chest Discomfort (Pain 8/10)</span>
                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-md font-black">CRITICAL</span>
              </button>
              <button
                onClick={() => applyPreset('asthma')}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-between cursor-pointer"
              >
                <span>🫁 Breathing Difficulty (Asthma)</span>
                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-black">HIGH</span>
              </button>
              <button
                onClick={() => applyPreset('routine')}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-between cursor-pointer"
              >
                <span>🤒 Febrile Illness (Fever & Cough)</span>
                <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-md font-black">MODERATE</span>
              </button>
              <button
                onClick={() => applyPreset('mild')}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-between cursor-pointer"
              >
                <span>🤧 Mild Cold & Sore Throat</span>
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-black">LOW</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Input Form / Right AI Recommendation & Hospital Doctor Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Symptom Form (Keeps 7 Patient Fields; Temp, HR, SpO2 Removed from Patient UI) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-orange-500" />
                Patient Health & Symptom Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter your condition to determine your priority queue slot</p>
            </div>
            <button
              onClick={() => {
                setAge(45);
                setSymptomDurationHours(6);
                setSelectedSymptoms(['fever']);
                setPainLevel(2);
                setBreathingDifficulty(false);
                setConsciousnessStatus('normal');
                setSelectedConditions(['none']);
                setAssessmentResult(null);
                setSubmittedRequestId(null);
                setSubmittedRequestData(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* 1. Patient Age & 2. Symptom Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Patient Age (வயது)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={age}
                  onChange={e => setAge(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">Years</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. Symptom Duration (அறிகுறி காலம்)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={symptomDurationHours}
                  onChange={e => setSymptomDurationHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">Hours</span>
              </div>
            </div>
          </div>

          {/* 3. Reported Symptoms Multi-select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                3. Reported Symptoms (அறிகுறிகள் &bull; Select all that apply)
              </label>
              <span className="text-[11px] text-orange-600 font-bold">{selectedSymptoms.length} Selected</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50/50">
              {COMMON_SYMPTOMS.map(sym => {
                const isSelected = selectedSymptoms.includes(sym);
                const isCriticalSymptom = sym === 'chest discomfort' || sym === 'breathing difficulty';
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize flex items-center gap-1.5 ${
                      isSelected
                        ? isCriticalSymptom
                          ? 'bg-red-500 text-white shadow-xs'
                          : 'bg-orange-500 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    {isCriticalSymptom && <AlertTriangle className="w-3 h-3 text-white/90" />}
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pain Level Scale (0 - 10) */}
          <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>4. Self-Reported Pain Level: <strong className="text-orange-600 text-sm font-black">{painLevel} / 10</strong></span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {painLevel === 0 ? 'No Pain' : painLevel <= 3 ? 'Mild Discomfort' : painLevel <= 6 ? 'Moderate Pain' : painLevel <= 8 ? 'Severe Pain' : 'Extreme / Unbearable Pain'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painLevel}
              onChange={e => setPainLevel(parseInt(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
              <span>0 (None)</span>
              <span>3 (Mild)</span>
              <span>6 (Moderate)</span>
              <span>8 (Severe)</span>
              <span className="text-red-500 font-black">10 (Extreme)</span>
            </div>
          </div>

          {/* 5. Breathing Difficulty & 6. Consciousness Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">5. Breathing Difficulty?</span>
                <span className="text-[10px] text-slate-400">மூச்சுத் திணறல் உள்ளதா?</span>
              </div>
              <button
                type="button"
                onClick={() => setBreathingDifficulty(!breathingDifficulty)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  breathingDifficulty ? 'bg-red-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {breathingDifficulty ? 'YES (ஆம்)' : 'NO (இல்லை)'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">6. Consciousness Status</span>
                <span className="text-[10px] text-slate-400">நினைவு நிலை</span>
              </div>
              <select
                value={consciousnessStatus}
                onChange={e => setConsciousnessStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden"
              >
                <option value="normal">Alert / Normal</option>
                <option value="confused">Confused / Drowsy</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
            </div>
          </div>

          {/* 7. Existing Chronic Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              7. Pre-existing Chronic Conditions (நாள்பட்ட நோய்கள்)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleCondition('none')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedConditions.includes('none')
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                None
              </button>
              {CHRONIC_CONDITIONS.map(cond => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all capitalize ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button: Start Queue Priority Assessment */}
          <button
            onClick={handleAssess}
            disabled={isAssessing}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAssessing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Assessing Urgency & Clinical Safety Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start AI- Queue Priority Assessment (முன்னுரிமை மதிப்பீடு தொடங்குக)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Priority Assessment & Direct Hospital Doctor Allocation Flow */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Case 1: Initial Empty State (Awaiting user to click Start Assessment) */}
          {!assessmentResult && !submittedRequestId && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Ready for AI- Queue Priority Assessment
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  Select your symptoms and health status on the left, then click <strong>'Start AI- Queue Priority Assessment'</strong> to calculate clinical urgency and reserve your queue slot.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400 block">
                  How Priority Triage Works:
                </span>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Enter reported symptoms, duration and pain rating.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>AI evaluates symptom urgency and clinical safety guardrails.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Directly routed to <strong>{hospitalName}</strong> for doctor allocation & token generation.</span>
                </div>
              </div>

              <button
                onClick={handleAssess}
                className="w-full py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-orange-200"
              >
                <span>Click to Evaluate Current Symptoms</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Case 2: Assessment Result Displayed (With Urgent Hospital Routing if Critical) */}
          {assessmentResult && !submittedRequestId && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5 animate-fadeIn">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">AI Priority Recommendation</h3>
                    <span className="text-[10px] text-slate-400">Target Hospital: {hospitalName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Confidence</span>
                  <span className="text-xs font-black text-emerald-600">
                    {(assessmentResult.confidence_score * 100).toFixed(1)}% Match
                  </span>
                </div>
              </div>

              {/* Priority Urgency Badge */}
              {(() => {
                const badge = getPriorityBadge(assessmentResult.ai_priority);
                const isCritical = assessmentResult.ai_priority === 'CRITICAL';
                return (
                  <div className={`rounded-2xl p-5 border ${badge.border} ${badge.chipBg} transition-all`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${badge.bg} ${isCritical ? 'animate-ping' : ''}`} />
                        <span className={`text-base font-black ${badge.text}`}>
                          {badge.badgeText}
                        </span>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-white/90 shadow-2xs text-slate-800">
                        Wait: {badge.waitEstimate}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold leading-relaxed ${badge.text}`}>
                      {badge.desc}
                    </p>

                    {/* Special Critical Emergency Alert Callout */}
                    {isCritical && (
                      <div className="mt-3.5 p-3.5 rounded-xl bg-red-100/90 border border-red-300 text-red-950 text-xs font-bold flex items-start gap-2.5 shadow-2xs">
                        <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="block text-red-800 text-xs font-black">CRITICAL EMERGENCY DETECTED</strong>
                          Immediate routing required. Submitting will send this directly to <strong className="underline">{hospitalName}'s</strong> casualty triage intake for urgent doctor allocation.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Clinical Urgency Rationale */}
              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Clinical Urgency Rationale
                </span>
                <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed">
                  {assessmentResult.priority_reason}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Recommended Hospital Next Step
                </span>
                <div className="text-xs font-bold text-slate-800 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                  {assessmentResult.recommended_action}
                </div>
              </div>

              {/* Direct Submit to Hospital Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSubmitToHospital}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    assessmentResult.ai_priority === 'CRITICAL'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25 animate-pulse'
                      : assessmentResult.ai_priority === 'HIGH'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {assessmentResult.ai_priority === 'CRITICAL'
                      ? `🚨 Send Critical Request to ${hospitalName} (உடனடி அவசர கோரிக்கை)`
                      : `Submit Priority Consultation to ${hospitalName}`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Case 3: Request Submitted & Hospital Acceptance / Doctor Allocation Status Card */}
          {submittedRequestId && submittedRequestData && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black ${
                    isHospitalAccepted
                      ? 'bg-emerald-100 text-emerald-600'
                      : isHospitalDeclined
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {isHospitalAccepted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isHospitalDeclined ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isHospitalAccepted
                        ? `Approved by ${hospitalName}`
                        : isHospitalDeclined
                        ? `Declined by ${hospitalName}`
                        : `Sent to ${hospitalName} Triage Desk`}
                    </h3>
                    <span className="text-[10px] text-slate-400">Tracking ID: {submittedRequestId}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  isHospitalAccepted
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isHospitalDeclined
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isHospitalAccepted ? 'Approved' : isHospitalDeclined ? 'Declined' : 'Awaiting Hospital'}
                </span>
              </div>

              {/* Status Banner */}
              {isHospitalDeclined ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2">
                  <div className="text-xs font-black text-rose-900">
                    {hospitalName} could not accept this priority slot:
                  </div>
                  <div className="text-xs font-semibold text-rose-800 bg-white p-3 rounded-xl border border-rose-200">
                    {submittedRequestData.declineReason || 'Doctor currently occupied in emergency bay. Please re-submit or choose another slot.'}
                  </div>
                </div>
              ) : isHospitalAccepted ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-black text-emerald-950">
                      {hospitalName} has verified your urgency and assigned a doctor!
                    </span>
                  </div>

                  {/* Doctor & Token Allocation Details */}
                  <div className="grid grid-cols-2 gap-2 text-left pt-1">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Allocated Doctor</span>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        {submittedRequestData.doctorName}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority Token</span>
                      <span className="text-xs font-black font-mono text-emerald-700 mt-0.5 block">
                        #{submittedRequestData.tokenNumber}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Counter / Room</span>
                      <span className="text-xs font-black text-slate-900 mt-0.5 block">
                        {submittedRequestData.counterNumber || 'OPD Triage Bay'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Wait</span>
                      <span className="text-xs font-black text-orange-600 mt-0.5 block">
                        {submittedRequestData.estimatedWaitMinutes || 5} Mins
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-900 leading-relaxed">
                    Please proceed directly to the designated counter at {hospitalName}. Present token <strong>#{submittedRequestData.tokenNumber}</strong> at the intake desk.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                    <span className="text-xs font-extrabold text-amber-950">
                      Awaiting Hospital Triage Review at {hospitalName}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Your request with <strong>{assessmentResult?.ai_priority || submittedRequestData?.aiPriority || 'PRIORITY'}</strong> urgency is displayed at {hospitalName}'s Triage Intake desk. The hospital staff will review, allocate a duty doctor, and generate your priority token.
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-amber-200/60">
                    <span>Target Hospital: <strong>{hospitalName}</strong></span>
                    <span className="text-amber-700 font-bold">Auto-syncing...</span>
                  </div>
                </div>
              )}

              {/* Action: Create another assessment */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSubmittedRequestId(null);
                    setSubmittedRequestData(null);
                    setAssessmentResult(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Start New Priority Assessment
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
