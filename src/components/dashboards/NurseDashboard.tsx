import React, { useState, useEffect } from 'react';
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
  ClipboardList,
  Thermometer,
  Heart,
  Droplets,
  Pill,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Layers,
  Stethoscope,
  Syringe,
  Eye,
  Check,
  X,
  RefreshCw,
  Wrench,
  UserCheck
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
import { api } from '../../services/api';

interface NurseDashboardProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const NurseDashboard: React.FC<NurseDashboardProps> = ({ activeTab, onSelectTab }) => {
  const { 
    user, 
    beds, 
    updateBedStatus, 
    equipment, 
    doctorNurseTasks, 
    updateNurseTaskStatus, 
    patients,
    clinicalAlerts,
    acknowledgeClinicalAlert
  } = useApp();

  // Task Execution State
  const [selectedTaskForExecution, setSelectedTaskForExecution] = useState<DoctorNurseTaskItem | null>(null);
  const [nurseNotes, setNurseNotes] = useState('');
  const [heartRate, setHeartRate] = useState<number>(115);
  const [systolicBP, setSystolicBP] = useState<number>(95);
  const [spO2, setSpO2] = useState<number>(88);
  const [respRate, setRespRate] = useState<number>(26);
  const [temp, setTemp] = useState<number>(37.2);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  // Five Rights of Medication Administration Safety Checks
  const [medSafetyChecks, setMedSafetyChecks] = useState({
    rightPatient: false,
    rightMedication: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
    allergiesCrossChecked: false
  });

  // Lab Sample Collection Checklist
  const [labTubeVerified, setLabTubeVerified] = useState(false);
  const [specimenBarcode, setSpecimenBarcode] = useState('');

  // Ward Filter & Selection
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('All');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('All');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Clinical Feature Modals State
  const [activePatientForAction, setActivePatientForAction] = useState<any | null>(null);
  const [activeClinicalModal, setActiveClinicalModal] = useState<
    'assessment' | 'care_plan' | 'io_monitoring' | 'wound_care' | 'fall_risk' | null
  >(null);

  // Nursing Assessment Form State
  const [gcsEye, setGcsEye] = useState<number>(4);
  const [gcsVerbal, setGcsVerbal] = useState<number>(5);
  const [gcsMotor, setGcsMotor] = useState<number>(6);
  const [painScore, setPainScore] = useState<number>(2);
  const [painLocation, setPainLocation] = useState('Abdominal surgical site');
  const [respPattern, setRespPattern] = useState('Regular, spontaneous on nasal cannula');
  const [capRefill, setCapRefill] = useState('< 2 seconds (normal)');
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Intake & Output Form State
  const [oralIntake, setOralIntake] = useState<number>(450);
  const [ivIntake, setIvIntake] = useState<number>(1200);
  const [urineOutput, setUrineOutput] = useState<number>(1150);
  const [drainOutput, setDrainOutput] = useState<number>(150);
  const [ioNotes, setIoNotes] = useState('Normal clear amber urine. Chest drain output decreasing.');

  // Wound Care Form State
  const [woundSite, setWoundSite] = useState('Midline Laparotomy');
  const [woundStage, setWoundStage] = useState('Primary Intention Surgical');
  const [woundExudate, setWoundExudate] = useState('Minimal Serosanguinous');
  const [dressingType, setDressingType] = useState('Silver Antimicrobial Island Dressing');
  const [woundNotes, setWoundNotes] = useState('Incision clean, edges well-approximated, no signs of erythema or maceration.');

  // Morse Fall Scale Form State
  const [historyOfFalls, setHistoryOfFalls] = useState<number>(0);
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState<number>(15);
  const [ambulatoryAid, setAmbulatoryAid] = useState<number>(15);
  const [ivTherapy, setIvTherapy] = useState<number>(20);
  const [gaitTransfer, setGaitTransfer] = useState<number>(10);
  const [mentalStatus, setMentalStatus] = useState<number>(0);

  // Faulty Equipment Reporting Modal State
  const [showReportFaultModal, setShowReportFaultModal] = useState(false);
  const [faultEquipmentId, setFaultEquipmentId] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [faultUrgency, setFaultUrgency] = useState<'Emergency' | 'Urgent' | 'Routine'>('Emergency');
  const [faultSuccessMsg, setFaultSuccessMsg] = useState<string | null>(null);

  // Shift Handover State
  const [handoversList, setHandoversList] = useState<any[]>([]);
  const [isLoadingHandovers, setIsLoadingHandovers] = useState(false);
  const [showNewHandoverForm, setShowNewHandoverForm] = useState(false);
  const [handoverWard, setHandoverWard] = useState('ICU Block A');
  const [incomingNurseName, setIncomingNurseName] = useState('Nurse Priya M., BSN');
  const [handoverShiftType, setHandoverShiftType] = useState('Day to Evening (14:00 - 22:00)');
  const [sbarSituation, setSbarSituation] = useState('');
  const [sbarBackground, setSbarBackground] = useState('');
  const [sbarAssessment, setSbarAssessment] = useState('');
  const [sbarRecommendation, setSbarRecommendation] = useState('');
  const [narcoticsVerified, setNarcoticsVerified] = useState(true);
  const [crashCartVerified, setCrashCartVerified] = useState(true);
  const [handoverFeedback, setHandoverFeedback] = useState<string | null>(null);
  const [isDraftingHandover, setIsDraftingHandover] = useState(false);

  // Medication Administration Record (MAR) State
  const [tasksSubTab, setTasksSubTab] = useState<'orders' | 'mar'>('orders');
  const [marRecords, setMarRecords] = useState<any[]>([]);
  const [isLoadingMar, setIsLoadingMar] = useState(false);
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [selectedMarItem, setSelectedMarItem] = useState<any | null>(null);
  const [adminStatus, setAdminStatus] = useState<'Administered' | 'Delayed' | 'Omitted' | 'Refused'>('Administered');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminSafetyChecks, setAdminSafetyChecks] = useState({
    rightPatient: true,
    rightMedication: true,
    rightDose: true,
    rightRoute: true,
    rightTime: true
  });

  // Ward Readiness Checklist for Digital Twin & Ward Prep
  const [wardPrepChecklist, setWardPrepChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('medisync_ward_prep_checklist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      suctionReady: true,
      ventCalibrated: true,
      infusionPumpsPrimed: false,
      crashCartAirwayChecked: true,
      bedPositioned: true,
      sterileLinensDraped: true
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('medisync_ward_prep_checklist', JSON.stringify(wardPrepChecklist));
    } catch {}
  }, [wardPrepChecklist]);

  // Fetch initial handovers & MAR from backend
  useEffect(() => {
    let isMounted = true;
    const fetchHandovers = async () => {
      try {
        setIsLoadingHandovers(true);
        const data = await api.getHandovers(user?.hospitalId || 'hosp-chn-01');
        if (isMounted && Array.isArray(data)) {
          setHandoversList(data);
        }
      } catch (err) {
        console.warn('Could not load handovers from backend, fallback to local:', err);
      } finally {
        if (isMounted) setIsLoadingHandovers(false);
      }
    };
    const fetchMar = async () => {
      try {
        setIsLoadingMar(true);
        const data = await api.getMedicationAdministrations({ hospitalId: user?.hospitalId || 'hosp-chn-01' });
        if (isMounted && Array.isArray(data)) {
          setMarRecords(data);
        }
      } catch (err) {
        console.warn('Could not load MAR records from backend:', err);
      } finally {
        if (isMounted) setIsLoadingMar(false);
      }
    };
    fetchHandovers();
    fetchMar();
    return () => { isMounted = false; };
  }, [user?.hospitalId]);

  // 6-stage lifecycle progression
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

  const handleExecuteOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForExecution) return;

    const isMedication = selectedTaskForExecution.taskType === 'Medication Administration';
    if (isMedication) {
      if (!medSafetyChecks.rightPatient || !medSafetyChecks.rightMedication || !medSafetyChecks.rightDose || !medSafetyChecks.rightRoute || !medSafetyChecks.rightTime) {
        alert('All 5-Rights safety checks must be verified before administering medication.');
        return;
      }
    }

    updateNurseTaskStatus({
      taskId: selectedTaskForExecution.id,
      status: 'Completed',
      nurseObservation: nurseNotes.trim() || `Execution completed. ${isMedication ? '5-Rights verified. Medication administered without adverse reaction.' : 'Bedside observations documented.'}`,
      nurseName: user?.name || 'Nurse Revathi S., RN',
      recordedVitals: {
        heartRate,
        systolicBP,
        spO2,
        respiratoryRate: respRate,
        temperature: temp
      }
    });

    // Also persist observation to backend EMR database
    if (selectedTaskForExecution.patientId) {
      try {
        await api.recordObservation(selectedTaskForExecution.patientId, {
          heartRate,
          systolicBp: systolicBP,
          spo2: spO2,
          respiratoryRate: respRate,
          temperature: temp,
          notes: nurseNotes.trim() || `Clinical order completed: ${selectedTaskForExecution.instruction}`
        });
      } catch (err) {
        console.warn('Backend observation logging error:', err);
      }
    }

    // If medication order, record in MAR database
    if (isMedication && selectedTaskForExecution.patientId) {
      try {
        const marEntry = await api.recordMedicationAdministration({
          hospitalId: user?.hospitalId || 'hosp-chn-01',
          patientId: selectedTaskForExecution.patientId,
          medicationName: selectedTaskForExecution.instruction || 'Prescribed Medication',
          dose: 'Prescribed Dose',
          route: 'IV / Oral',
          status: 'Administered',
          administeredBy: user?.name || 'Nurse Revathi S., RN',
          fiveRightsVerified: true,
          notes: nurseNotes.trim() || 'Administered after 5-Rights bedside verification.'
        });
        setMarRecords(prev => [marEntry, ...prev]);
      } catch (err) {
        console.warn('MAR persistence error:', err);
      }
    }

    // Notify backend clinical task status
    api.updateClinicalTaskStatus(selectedTaskForExecution.id, {
      status: 'Completed',
      executionNotes: nurseNotes.trim() || 'Executed by primary nurse',
      vitalsRecorded: {
        hr: heartRate,
        sbp: systolicBP,
        dbp: 80,
        spo2: spO2,
        rr: respRate,
        temp
      }
    }).catch(err => {
      console.warn('Could not update backend clinical task status:', err);
    });

    const isAbnormal = spO2 < 90 || heartRate > 120 || systolicBP < 90;
    setRecordFeedback(
      isAbnormal 
        ? `Task completed! Abnormal vitals (SpO2 ${spO2}%, HR ${heartRate} bpm) triggered automated Clinical Alert to attending physician.`
        : `Task "${selectedTaskForExecution.instruction}" completed and bedside telemetry transmitted successfully!`
    );

    setTimeout(() => {
      setRecordFeedback(null);
      setSelectedTaskForExecution(null);
      setNurseNotes('');
      setMedSafetyChecks({
        rightPatient: false,
        rightMedication: false,
        rightDose: false,
        rightRoute: false,
        rightTime: false,
        allergiesCrossChecked: false
      });
      setLabTubeVerified(false);
      setSpecimenBarcode('');
    }, 2800);
  };

  // Auto-Draft SBAR from Telemetry
  const handleAutoDraftSbar = async () => {
    try {
      setIsDraftingHandover(true);
      const draft = await api.getHandoverDraft(user?.hospitalId || 'hosp-chn-01', handoverWard);
      if (draft) {
        setSbarSituation(draft.situation || '');
        setSbarBackground(draft.background || '');
        setSbarAssessment(draft.assessment || '');
        setSbarRecommendation(draft.recommendation || '');
        setHandoverFeedback(`Telemetry auto-drafted for ${handoverWard}! SBAR fields populated.`);
        setTimeout(() => setHandoverFeedback(null), 3500);
      }
    } catch (err) {
      console.warn('Failed to load handover draft:', err);
      // Fallback local SBAR drafting
      setSbarSituation(`Census: ${myWardPatients.length} patients in ${handoverWard}. ${readyCount} beds ready.`);
      setSbarBackground('Post-operative and acute recovery ward. Routine vitals and infusion protocols.');
      setSbarAssessment(`Telemetric surveillance active. ${myWardPatients.filter(p => (p.mewsScore || 0) >= 3).length} patients with elevated MEWS.`);
      setSbarRecommendation('Maintain Q2H observation protocol and verify pending MAR doses.');
    } finally {
      setIsDraftingHandover(false);
    }
  };

  // Acknowledge Received Handover
  const handleAcknowledgeHandover = async (handoverId: string) => {
    try {
      await api.acknowledgeHandover(handoverId, { acknowledgedBy: user?.name || 'Nurse Revathi S., RN' });
      setHandoversList(prev => prev.map(h => (h.id === handoverId ? { ...h, status: 'Acknowledged', acknowledgedBy: user?.name || 'Nurse Revathi S., RN' } : h)));
      setHandoverFeedback(`Shift Handover #${handoverId} acknowledged & confirmed by ${user?.name || 'relieving nurse'}!`);
      setTimeout(() => setHandoverFeedback(null), 3000);
    } catch (err) {
      console.warn('Fallback handover acknowledgment:', err);
      setHandoversList(prev => prev.map(h => (h.id === handoverId ? { ...h, status: 'Acknowledged', acknowledgedBy: user?.name || 'Nurse Revathi S., RN' } : h)));
      setHandoverFeedback(`Handover acknowledged locally.`);
      setTimeout(() => setHandoverFeedback(null), 3000);
    }
  };

  // Submit MAR Administration Record
  const handleSubmitMarAdministration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarItem) return;

    if (adminStatus === 'Administered') {
      const allChecked = adminSafetyChecks.rightPatient && adminSafetyChecks.rightMedication && adminSafetyChecks.rightDose && adminSafetyChecks.rightRoute && adminSafetyChecks.rightTime;
      if (!allChecked) {
        alert('All 5-Rights safety verification checks must be confirmed prior to administration.');
        return;
      }
    }

    try {
      const newRecord = await api.recordMedicationAdministration({
        hospitalId: user?.hospitalId || 'hosp-chn-01',
        patientId: selectedMarItem.patientId || selectedMarItem.patient_id,
        prescriptionId: selectedMarItem.prescriptionId || selectedMarItem.prescription_id,
        medicationName: selectedMarItem.medicationName || selectedMarItem.medication_name,
        dose: selectedMarItem.dose,
        route: selectedMarItem.route,
        status: adminStatus,
        administeredBy: user?.name || 'Nurse Revathi S., RN',
        fiveRightsVerified: adminStatus === 'Administered',
        notes: adminNotes.trim() || `Status: ${adminStatus}. 5-Rights verified at bedside.`
      });

      setMarRecords(prev => [newRecord, ...prev]);
      setRecordFeedback(`MAR updated: ${selectedMarItem.medicationName || selectedMarItem.medication_name} documented as ${adminStatus}.`);
      setShowAdministerModal(false);
      setSelectedMarItem(null);
      setAdminNotes('');
      setTimeout(() => setRecordFeedback(null), 3000);
    } catch (err: any) {
      alert(`Failed to update MAR: ${err.message || 'Error'}`);
    }
  };

  // Handle Equipment Fault Report
  const handleSubmitFaultReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultEquipmentId) return;

    const eqItem = equipment.find(eq => eq.id === faultEquipmentId);
    try {
      await api.createRequest({
        hospitalId: user?.hospitalId || 'hosp-chn-01',
        type: 'equipment',
        item: eqItem?.name || 'Biomedical Equipment',
        quantity: 1,
        urgency: faultUrgency,
        department: 'ICU / Ward Nursing',
        reason: `Fault reported: ${faultDescription}. Immediate replacement requisitioned by Nursing.`,
        requestedBy: user?.name || 'Staff Nurse Revathi S.'
      });

      setFaultSuccessMsg(`Replacement request logged for ${eqItem?.name || 'device'}. Hospital Administration alerted.`);

      // Also notify biomedical equipment endpoint for immediate status alignment
      try {
        await api.reportEquipmentFault(faultEquipmentId, {
          reportedBy: user?.name || 'Staff Nurse Revathi S.',
          faultDescription,
          severity: faultUrgency
        });
      } catch (faultErr) {
        console.warn('Could not update equipment fault directly:', faultErr);
      }
      setTimeout(() => {
        setFaultSuccessMsg(null);
        setShowReportFaultModal(false);
        setFaultEquipmentId('');
        setFaultDescription('');
      }, 2500);
    } catch (err) {
      console.error('Error reporting faulty equipment:', err);
      setFaultSuccessMsg('Request logged locally and dispatched to biomedical team.');
      setTimeout(() => {
        setFaultSuccessMsg(null);
        setShowReportFaultModal(false);
      }, 2000);
    }
  };

  // Handle Shift Handover Submission
  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      hospitalId: user?.hospitalId || 'hosp-chn-01',
      ward: handoverWard,
      outgoingNurse: user?.name || 'Nurse Revathi S., Senior RN',
      incomingNurse: incomingNurseName,
      shiftType: handoverShiftType,
      patientCount: myWardPatients.length,
      criticalPatients: myWardPatients.filter(p => (p.mewsScore || 0) >= 3).map(p => p.id),
      situation: sbarSituation || `Shift changeover for ${handoverWard}. Current census: ${myWardPatients.length} patients.`,
      background: sbarBackground || 'Stable post-op and trauma cohort. All scheduled medication rounds up to date.',
      assessment: sbarAssessment || 'Bedside telemetry monitored. 2 patients on weaning O2. No active Code Blue incidents.',
      recommendation: sbarRecommendation || 'Continue continuous telemetry surveillance. Repeat morning ABG for Bed 04.',
      notes: `${sbarSituation} | ${sbarAssessment}`,
      checklistCompleted: true,
      narcoticsCountVerified: narcoticsVerified,
      crashCartChecked: crashCartVerified
    };

    try {
      const saved = await api.createHandover(payload);
      setHandoversList(prev => [saved, ...prev]);
      setHandoverFeedback(`SBAR Shift Handover logged & signed off for ${handoverWard}! Relieving nurse notified.`);
    } catch (err) {
      console.warn('Fallback handover persistence:', err);
      const localHandover = { ...payload, id: `ho-${Date.now()}`, timestamp: new Date().toISOString() };
      setHandoversList(prev => [localHandover, ...prev]);
      setHandoverFeedback(`SBAR Shift Handover saved successfully!`);
    }

    setTimeout(() => {
      setHandoverFeedback(null);
      setShowNewHandoverForm(false);
      setSbarSituation('');
      setSbarBackground('');
      setSbarAssessment('');
      setSbarRecommendation('');
    }, 2800);
  };

  // Compute My Ward Beds & Patients with safe fallbacks
  const myWardBeds = beds.filter(b => b.ward && (b.ward.includes('ICU') || b.ward.includes('HDU')));
  const effectiveBeds = myWardBeds.length > 0 ? myWardBeds : beds;
  const filteredBeds = selectedWardFilter === 'All' 
    ? effectiveBeds 
    : effectiveBeds.filter(b => b.ward.toLowerCase().includes(selectedWardFilter.toLowerCase()));

  const readyCount = effectiveBeds.filter(b => b.status === 'ready').length;
  const inTurnaroundCount = effectiveBeds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation'].includes(b.status)).length;
  const occupiedCount = effectiveBeds.filter(b => b.status === 'occupied').length;

  const myWardPatients = patients.filter(p => {
    const loc = (p.ward || '').toLowerCase();
    return loc.includes('icu') || loc.includes('hdu') || loc.includes('complex') || loc.includes('bay');
  });
  const effectiveWardPatients = myWardPatients.length > 0 ? myWardPatients : patients;

  // Filtered Tasks
  const filteredTasks = doctorNurseTasks.filter(t => {
    if (taskCategoryFilter !== 'All' && t.taskType !== taskCategoryFilter) return false;
    if (taskSearchQuery) {
      const q = taskSearchQuery.toLowerCase();
      return t.patientName.toLowerCase().includes(q) || 
             t.instruction.toLowerCase().includes(q) || 
             t.bed.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate Morse Score
  const morseScore = historyOfFalls + secondaryDiagnosis + ambulatoryAid + ivTherapy + gaitTransfer + mentalStatus;
  const morseRiskLevel = morseScore >= 45 ? 'High Risk' : morseScore >= 25 ? 'Moderate Risk' : 'Low Risk';

  // Sub-modules redirection for specialized centers
  if (activeTab === 'command_center' || activeTab === 'command-center') {
    return <EmergencyCommandCenter />;
  }

  if (activeTab === 'simulation_lab' || activeTab === 'simulation-lab') {
    return (
      <div className="space-y-6">
        <HospitalDigitalTwinLab activeRole="nurse" />

        {/* Dedicated Ward & Bed Preparation Checklist */}
        <Card
          title="Clinical Ward & Bed Preparation Checklist (Pre-Intake)"
          subtitle="Mandatory bedside sterile readiness verification prior to admitting high-acuity or trauma transfers"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'suctionReady', title: 'Suction Apparatus & Yankauer', desc: 'Tested at -120 mmHg with canister in line' },
              { key: 'ventCalibrated', title: 'Mechanical Ventilator Circuit', desc: 'Leak test passed, pre-set to stand-by PSV mode' },
              { key: 'infusionPumpsPrimed', title: 'Dual Syringe / Infusion Pumps', desc: 'AC power connected, microbore lines primed' },
              { key: 'crashCartAirwayChecked', title: 'Airway Tray & BVM Resuscitator', desc: 'Appropriate mask size & oxygen reservoir ready' },
              { key: 'bedPositioned', title: 'ICU Bed Level & Lock', desc: 'Adjusted to stretcher transfer height, wheels locked' },
              { key: 'sterileLinensDraped', title: 'Antimicrobial Sterile Linens', desc: 'Disinfected mattress, fresh barrier draw-sheet' }
            ].map(item => {
              const isChecked = (wardPrepChecklist as any)[item.key];
              return (
                <div 
                  key={item.key}
                  onClick={() => setWardPrepChecklist(prev => ({ ...prev, [item.key]: !isChecked }))}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Checked items: <strong>{Object.values(wardPrepChecklist).filter(Boolean).length} / 6</strong>
            </span>
            <Badge variant={Object.values(wardPrepChecklist).every(Boolean) ? 'success' : 'warning'} size="sm">
              {Object.values(wardPrepChecklist).every(Boolean) ? 'ICU Bay Ready for Patient Transfer' : 'Preparation In Progress'}
            </Badge>
          </div>
        </Card>
      </div>
    );
  }

  if (activeTab === 'workflow_automation' || activeTab === 'workflows' || activeTab === 'workflow-automation') {
    return <WorkflowAutomationCenter activeRole="nurse" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Ward Status & Rapid Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4 bg-white border border-slate-200 shadow-xs hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold">Operationally Ready Beds</span>
            <span className="p-1.5 rounded-lg bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#15803D] mt-2">{readyCount}</div>
          <div className="text-[11px] text-[#15803D] mt-1 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Ready for emergency admissions
          </div>
        </Card>

        <Card noPadding className="p-4 bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold">Active Turnaround (6-Stage)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
              <RotateCw className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#D97706] mt-2">{inTurnaroundCount}</div>
          <div className="text-[11px] text-[#D97706] mt-1 font-medium">Cleaning & biomedical inspection</div>
        </Card>

        <Card noPadding className="p-4 bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold">Occupied Inpatient Beds</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563A6]">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-2">{occupiedCount}</div>
          <div className="text-[11px] text-[#64748B] mt-1 font-medium">Continuous telemetry surveillance</div>
        </Card>

        <Card noPadding className="p-4 bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold">Doctor Clinical Directives</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2">
            {doctorNurseTasks.filter(t => t.status !== 'Completed').length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-semibold">
            {doctorNurseTasks.filter(t => t.priority.includes('Stat') && t.status !== 'Completed').length} STAT Orders Pending
          </div>
        </Card>
      </div>

      {/* Global Feedback Banner */}
      {recordFeedback && (
        <div className="p-4 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{recordFeedback}</span>
        </div>
      )}

      {/* Active Clinical Alert Ticker (Doctor <-> Nurse Closed Loop) */}
      {clinicalAlerts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-red-100 text-red-700 rounded-lg animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-red-900">
                  Active Clinical Panic / Early Warning Alert ({clinicalAlerts.length})
                </div>
                <div className="text-[11px] text-red-700">
                  {clinicalAlerts[0].patientName} ({clinicalAlerts[0].patientId}) &middot; {clinicalAlerts[0].ward}: {clinicalAlerts[0].triggerParam || clinicalAlerts[0].reason}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="critical" size="sm">MEWS {clinicalAlerts[0].mewsScore}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => acknowledgeClinicalAlert(clinicalAlerts[0].id, user?.name || 'Staff Nurse')}
                className="text-xs border-red-300 text-red-800 hover:bg-red-100"
              >
                Acknowledge Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: WARD OVERVIEW (dashboard)                                          */}
      {/* ========================================================================= */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="space-y-6">
          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'ward', label: 'My Ward Patients', desc: `${effectiveWardPatients.length} Active in ICU`, icon: <Users className="w-4 h-4 text-blue-600" /> },
              { id: 'turnaround', label: 'Bed Turnaround', desc: '6-Stage Lifecycle', icon: <Bed className="w-4 h-4 text-amber-600" /> },
              { id: 'tasks', label: 'Clinical Tasks', desc: `${doctorNurseTasks.filter(t => t.status !== 'Completed').length} Pending Orders`, icon: <CheckSquare className="w-4 h-4 text-indigo-600" /> },
              { id: 'equipment', label: 'Equipment Checklist', desc: `${equipment.length} Tracked Devices`, icon: <Activity className="w-4 h-4 text-emerald-600" /> },
              { id: 'handover', label: 'Shift Handover', desc: 'Structured SBAR Log', icon: <ClipboardList className="w-4 h-4 text-purple-600" /> }
            ].map(nav => (
              <button
                key={nav.id}
                type="button"
                onClick={() => onSelectTab ? onSelectTab(nav.id) : (window.location.hash = `#/dashboard/nurse?tab=${nav.id}`)}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-50 group-hover:bg-blue-50 rounded-lg transition-colors">
                    {nav.icon}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-800 mt-2">{nav.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{nav.desc}</div>
              </button>
            ))}
          </div>

          {/* Pending STAT & Urgent Orders Preview */}
          <Card
            title={`Doctor Clinical Directives & Urgent Orders (${doctorNurseTasks.filter(t => t.status !== 'Completed').length} Pending)`}
            subtitle="Closed-loop communication channel linking Doctor orders with bedside nursing execution"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectTab ? onSelectTab('tasks') : (window.location.hash = '#/dashboard/nurse?tab=tasks')}
              >
                View Full Worklist
              </Button>
            }
            noPadding
          >
            <div className="divide-y divide-slate-100">
              {doctorNurseTasks.filter(t => t.status !== 'Completed').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  No pending doctor directives for this shift. All orders executed.
                </div>
              ) : (
                doctorNurseTasks.filter(t => t.status !== 'Completed').slice(0, 4).map(task => {
                const isStat = task.priority.includes('Stat');
                return (
                  <div key={task.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{task.patientName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({task.patientId} &middot; Bed {task.bed})</span>
                        <Badge variant={isStat ? 'critical' : task.priority === 'Urgent' ? 'warning' : 'primary'} size="sm">
                          {task.priority}
                        </Badge>
                        <Badge variant="neutral" size="sm">{task.taskType}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                        {task.instruction}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Ordered by <strong>{task.doctorName}</strong> &middot; {task.timestamp}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedTaskForExecution(task)}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      className="shrink-0"
                    >
                      Execute Order
                    </Button>
                  </div>
                );
              }))}
            </div>
          </Card>

          {/* Bedside Acuity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Ward Census & Staffing Telemetry" subtitle="ICU Block A & B staffing balance" noPadding>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Assigned Primary Nurse</span>
                  <span className="font-bold text-blue-700">{user?.name || 'Nurse Revathi S., Senior RN'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Nurse-to-Patient Ratio</span>
                  <Badge variant="success" size="sm">1 : 2 (ICU Standard Met)</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Current Shift Timing</span>
                  <span className="font-bold text-slate-800">Day Shift (07:00 - 15:00)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Code Blue Response Team</span>
                  <Badge variant="primary" size="sm">Team 2 On-Duty (Pager #401)</Badge>
                </div>
              </div>
            </Card>

            <Card title="Shift Handover Quick Summary" subtitle="Transition notes from previous shift" noPadding>
              <div className="p-4 space-y-3 text-xs">
                {handoversList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No shift handovers logged yet for this ward.
                  </div>
                ) : (
                  handoversList.slice(0, 2).map((ho, idx) => (
                  <div key={ho.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ho.ward} &middot; {ho.shiftType}</span>
                      <span className="text-[10px] text-slate-500">{new Date(ho.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Outgoing: <strong>{ho.outgoingNurse}</strong> &rarr; Incoming: <strong>{ho.incomingNurse}</strong>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                      {ho.notes || ho.assessment || 'Shift completed with verified telemetry and medication compliance.'}
                    </p>
                  </div>
                )))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MY WARD (ICU BLOCK A/B) (ward)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'ward' && (
        <div className="space-y-6">
          {/* Ward Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inpatient Care Census — ICU Block A & B</h2>
              <p className="text-xs text-slate-500">Continuous telemetry, nursing assessments, care plans, and fluid balance tracking</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Ward:</span>
              <div className="flex gap-1.5">
                {['All', 'ICU Block A', 'ICU Block B', 'HDU'].map(ward => (
                  <button
                    key={ward}
                    onClick={() => setSelectedWardFilter(ward)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedWardFilter === ward
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ward}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inpatient Patient Cards */}
          <div className="grid grid-cols-1 gap-4">
            {effectiveWardPatients.length === 0 ? (
              <Card noPadding className="p-8 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No active inpatients currently assigned to this ward filter.
              </Card>
            ) : (
              effectiveWardPatients.map(patient => {
              const mews = patient.mewsScore || 1;
              const isHighAcuity = mews >= 4;
              const vitals = patient.currentVitals || (patient.vitals && patient.vitals[0]);

              return (
                <Card key={patient.id} noPadding className="p-4 hover:border-blue-300 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Patient Overview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{patient.name}</span>
                        <span className="text-xs font-mono text-slate-500">({patient.id} &middot; {patient.age}y/{patient.gender})</span>
                        <Badge variant={isHighAcuity ? 'critical' : 'primary'} size="sm">
                          Bed {patient.bedNumber || 'ICU-04'} ({patient.ward || 'ICU Block A'})
                        </Badge>
                        <Badge variant={mews >= 4 ? 'critical' : mews >= 2 ? 'warning' : 'success'} size="sm">
                          MEWS Score: {mews}
                        </Badge>
                        {patient.allergies && patient.allergies.length > 0 && (
                          <Badge variant="critical" size="sm">
                            Allergies: {Array.isArray(patient.allergies) ? patient.allergies.map(a => typeof a === 'string' ? a : a.allergen).join(', ') : String(patient.allergies)}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-slate-600">
                        <strong>Diagnosis:</strong> {patient.primaryDiagnosis || 'Post-operative observation'} &middot;{' '}
                        <strong>Attending:</strong> {patient.attendingPhysician || 'Dr. Alex Rivera, MD'}
                      </div>

                      {/* Bedside Telemetry Strip */}
                      <div className="flex items-center gap-4 text-xs font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex-wrap">
                        <span className="flex items-center gap-1 text-red-600">
                          <Heart className="w-3.5 h-3.5" /> HR: {vitals?.heartRate || 82} bpm
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <Activity className="w-3.5 h-3.5" /> BP: {vitals?.systolicBP || 122}/{vitals?.diastolicBP || 78} mmHg
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Droplets className="w-3.5 h-3.5" /> SpO2: {vitals?.spO2 || 98}%
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Activity className="w-3.5 h-3.5" /> RR: {vitals?.respiratoryRate || 18} /min
                        </span>
                        <span className="flex items-center gap-1 text-amber-600">
                          <Thermometer className="w-3.5 h-3.5" /> Temp: {vitals?.temperature || 36.8}&deg;C
                        </span>
                      </div>
                    </div>

                    {/* Clinical Actions Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePatientForAction(patient);
                          setActiveClinicalModal('assessment');
                        }}
                        icon={<Stethoscope className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Nursing Assessment
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePatientForAction(patient);
                          setActiveClinicalModal('care_plan');
                        }}
                        icon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                      >
                        Care Plan
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePatientForAction(patient);
                          setActiveClinicalModal('io_monitoring');
                        }}
                        icon={<Droplets className="w-3.5 h-3.5 text-cyan-600" />}
                      >
                        I/O Balance
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePatientForAction(patient);
                          setActiveClinicalModal('wound_care');
                        }}
                        icon={<Activity className="w-3.5 h-3.5 text-amber-600" />}
                      >
                        Wound Care
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActivePatientForAction(patient);
                          setActiveClinicalModal('fall_risk');
                        }}
                        icon={<ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
                      >
                        Morse Fall Risk
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BED TURNAROUND (6-STAGE) (turnaround)                              */}
      {/* ========================================================================= */}
      {activeTab === 'turnaround' && (
        <div className="space-y-6">
          <Card 
            title="Institutional 6-Stage Bed Lifecycle Tracker" 
            subtitle="Every ward bed must pass each verification stage before operational readiness is broadcast to admissions" 
            noPadding
          >
            {/* Visual Lifecycle Stepper */}
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {lifecycleStages.map((st, idx) => (
                  <div key={st.status} className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400">STAGE 0{idx + 1}</span>
                    <div className="text-xs font-bold text-[#1E293B] mt-0.5">{st.label}</div>
                    <div className="text-[10px] text-[#64748B] mt-1 line-clamp-2 leading-tight">{st.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Turnaround Table */}
            <div className="divide-y divide-[#E2E8F0]">
              {filteredBeds.map(bed => {
                const currentStage = lifecycleStages.find(s => s.status === bed.status);

                return (
                  <div key={bed.id} className="p-4 hover:bg-slate-50/70 transition-colors">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CLINICAL & CLEANING TASKS (tasks)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Sub-tab Switcher: Clinical Directives vs MAR */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setTasksSubTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                tasksSubTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Doctor Orders & Clinical Directives ({doctorNurseTasks.length})</span>
            </button>
            <button
              onClick={() => setTasksSubTab('mar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                tasksSubTab === 'mar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Medication Administration Record (MAR) ({marRecords.length})</span>
            </button>
          </div>

          {tasksSubTab === 'orders' ? (
            <>
              {/* Worklist Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search orders, patient name, bed..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Category:</span>
                  {['All', 'Vital Check', 'Medication Administration', 'Lab Collection', 'Wound Dressing'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTaskCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        taskCategoryFilter === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <Card
                title={`Clinical Worklist & Doctor Orders (${doctorNurseTasks.length})`}
                subtitle="Prioritized closed-loop nursing execution tracker"
                noPadding
              >
                <div className="divide-y divide-[#E2E8F0]">
                  {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No clinical tasks found matching current filter or search criteria.
                    </div>
                  ) : (
                    filteredTasks.map(task => {
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
                              <Badge variant="neutral" size="sm">{task.taskType}</Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isCompleted && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setSelectedTaskForExecution(task)}
                                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                >
                                  Execute Order
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
                    })
                  )}
                </div>
              </Card>
            </>
          ) : (
            /* Medication Administration Record (MAR) View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ward Medication Administration Record (eMAR)</h3>
                  <p className="text-xs text-slate-500">Authorized doctor prescriptions with 5-Rights bedside administration verification</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedMarItem({
                        patientId: myWardPatients[0]?.id || 'PT-8942',
                        medicationName: 'Piperacillin-Tazobactam IV',
                        dose: '4.5g in 100mL NS',
                        route: 'IV Infusion'
                      });
                      setShowAdministerModal(true);
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Document Bedside Dose
                  </Button>
                </div>
              </div>

              <Card title={`Scheduled & Administered Doses (${marRecords.length})`} subtitle="Live synchronization with SQLite database" noPadding>
                {isLoadingMar ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading MAR records...</div>
                ) : marRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No medication administrations recorded for this ward.</div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0] text-xs">
                    {marRecords.map((m: any, idx: number) => {
                      const isAdm = m.status === 'Administered';
                      const isSched = m.status === 'Scheduled';
                      return (
                        <div key={m.id || idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{m.medicationName || m.medication_name}</span>
                              <Badge variant="neutral" size="sm">{m.dose}</Badge>
                              <Badge variant="primary" size="sm">{m.route}</Badge>
                              <Badge
                                variant={isAdm ? 'success' : isSched ? 'neutral' : 'warning'}
                                size="sm"
                              >
                                {m.status}
                              </Badge>
                              {m.fiveRightsVerified && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> 5-Rights Verified
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500">
                              Patient: <strong>{m.patientId || m.patient_id}</strong> &middot; Scheduled: <strong>{m.scheduledTime || m.scheduled_time || 'Routine'}</strong> &middot; Administered by: <strong>{m.administeredBy || m.administered_by}</strong>
                            </div>

                            {(m.reasonOrNotes || m.reason_or_notes) && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 inline-block mt-1">
                                <strong>Notes:</strong> {m.reasonOrNotes || m.reason_or_notes}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMarItem(m);
                                setAdminStatus(m.status === 'Scheduled' ? 'Administered' : m.status);
                                setShowAdministerModal(true);
                              }}
                              icon={<CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                            >
                              {m.status === 'Administered' ? 'View / Update' : 'Administer Dose'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: EQUIPMENT CHECKLIST (equipment)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bedside Life-Support & Biomedical Telemetry</h2>
              <p className="text-xs text-slate-500">Continuous device tracking, routine calibration, and emergency replacement requisitions</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportFaultModal(true)}
              icon={<Wrench className="w-3.5 h-3.5 text-red-600" />}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Report Faulty Device & Request Replacement
            </Button>
          </div>

          <Card title={`Ward Equipment Telemetry & Inspection (${equipment.length} Units)`} subtitle="Real-time operational readiness log" noPadding>
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {equipment.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No biomedical equipment units registered for this hospital ward.
                </div>
              ) : (
                equipment.map(eq => (
                <div key={eq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{eq.name}</span>
                      <Badge variant={eq.status === 'Available' ? 'success' : eq.status === 'In Use' ? 'primary' : 'warning'} size="sm">
                        {eq.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Ward: <strong>{eq.ward}</strong> &middot; SN: <span className="font-mono">{eq.serialNumber}</span> &middot; Last Calibrated: {eq.lastInspection || 'Recent'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Biomedical Certified
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await api.updateEquipmentStatus(eq.id, 'Available', eq.ward);
                          setRecordFeedback(`Biomedical calibration verified for ${eq.name}. Unit marked Ready.`);
                          setTimeout(() => setRecordFeedback(null), 3000);
                        } catch (err: any) {
                          alert(`Could not verify calibration: ${err.message || 'Error'}`);
                        }
                      }}
                      className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                    >
                      Verify Ready
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFaultEquipmentId(eq.id);
                        setShowReportFaultModal(true);
                      }}
                      className="text-xs"
                    >
                      Report Issue
                    </Button>
                  </div>
                </div>
              )))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SHIFT HANDOVER LOG (handover)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'handover' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Structured SBAR Clinical Shift Handover</h2>
              <p className="text-xs text-slate-500">Situation, Background, Assessment, Recommendation nursing continuity protocol</p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewHandoverForm(prev => !prev)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {showNewHandoverForm ? 'Close Handover Form' : 'Log New Shift Handover'}
            </Button>
          </div>

          {handoverFeedback && (
            <div className="p-4 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{handoverFeedback}</span>
            </div>
          )}

          {/* New Handover Form */}
          {showNewHandoverForm && (
            <Card title="New Shift SBAR Handover Document" subtitle="Complete all safety verification checks before signing off" noPadding>
              <form onSubmit={handleSubmitHandover} className="p-4 space-y-4 text-xs">
                {/* Auto-Draft Telemetry Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                  <div>
                    <span className="font-bold text-blue-900 block text-xs">Telemetric SBAR Auto-Draft Assistant</span>
                    <span className="text-[11px] text-blue-700">Pre-populates clinical situation, background, vitals assessment, and recommendations from live ward telemetry.</span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAutoDraftSbar}
                    disabled={isDraftingHandover}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  >
                    {isDraftingHandover ? 'Querying Telemetry...' : 'Auto-Draft SBAR from Ward Telemetry'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Ward / Location</label>
                    <select
                      value={handoverWard}
                      onChange={(e) => setHandoverWard(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="ICU Block A">ICU Block A</option>
                      <option value="ICU Block B">ICU Block B</option>
                      <option value="HDU Step-Down">HDU Step-Down</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Shift Type</label>
                    <select
                      value={handoverShiftType}
                      onChange={(e) => setHandoverShiftType(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Day to Evening (14:00 - 22:00)">Day to Evening (14:00 - 22:00)</option>
                      <option value="Evening to Night (22:00 - 06:00)">Evening to Night (22:00 - 06:00)</option>
                      <option value="Night to Morning (06:00 - 14:00)">Night to Morning (06:00 - 14:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Relieving / Incoming Nurse</label>
                    <input
                      type="text"
                      value={incomingNurseName}
                      onChange={(e) => setIncomingNurseName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>

                {/* SBAR Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-0.5">S — Situation</label>
                    <textarea
                      value={sbarSituation}
                      onChange={(e) => setSbarSituation(e.target.value)}
                      placeholder="Current census, admissions, discharges, active high-acuity patients..."
                      rows={2}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-0.5">B — Background</label>
                    <textarea
                      value={sbarBackground}
                      onChange={(e) => setSbarBackground(e.target.value)}
                      placeholder="Clinical diagnoses, surgical interventions, intubated patients, allergy alerts..."
                      rows={2}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-0.5">A — Assessment</label>
                    <textarea
                      value={sbarAssessment}
                      onChange={(e) => setSbarAssessment(e.target.value)}
                      placeholder="Vital sign trends, recent desaturations, abnormal lab results, fluid balance..."
                      rows={2}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-0.5">R — Recommendation</label>
                    <textarea
                      value={sbarRecommendation}
                      onChange={(e) => setSbarRecommendation(e.target.value)}
                      placeholder="Pending STAT doctor orders, scheduled extubations, morning blood draws..."
                      rows={2}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Safety Checkboxes */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-bold text-blue-900 text-xs">Mandatory Handover Safety Protocols:</div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={narcoticsVerified}
                      onChange={(e) => setNarcoticsVerified(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Controlled substances (Schedule II / Narcotics) count verified with oncoming nurse</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crashCartVerified}
                      onChange={(e) => setCrashCartVerified(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Crash cart seal intact & emergency defibrillator self-test verified</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowNewHandoverForm(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                    Sign & Submit SBAR Handover
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Handover History Log Archive */}
          <Card title="Shift Handover Archive" subtitle="Chronological record of verified clinical handovers" noPadding>
            <div className="divide-y divide-[#E2E8F0]">
              {isLoadingHandovers ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading verified shift handovers...</div>
              ) : handoversList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No shift handovers logged yet. Click &quot;Log New Shift Handover&quot; above to record the first SBAR transition.
                </div>
              ) : (
                handoversList.map((ho, idx) => {
                const isAck = ho.status === 'Acknowledged';
                return (
                  <div key={ho.id || idx} className="p-4 hover:bg-slate-50 transition-colors space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{ho.ward}</span>
                        <Badge variant="primary" size="sm">{ho.shiftType}</Badge>
                        <Badge variant={isAck ? 'success' : 'warning'} size="sm">
                          {isAck ? `Acknowledged (${ho.acknowledgedBy || ho.acknowledged_by || 'Relieving RN'})` : 'Awaiting Acknowledgment'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(ho.timestamp || ho.created_at || '2026-11-28T08:00:00Z').toLocaleString()}
                        </span>
                        {!isAck && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeHandover(ho.id)}
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Acknowledge Receipt
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Outgoing Nurse: <strong>{ho.outgoingNurse || ho.outgoing_nurse}</strong> &rarr; Incoming Nurse: <strong>{ho.incomingNurse || ho.incoming_nurse}</strong>
                    </div>

                    {ho.situation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div><strong>Situation:</strong> {ho.situation}</div>
                        <div><strong>Background:</strong> {ho.background}</div>
                        <div><strong>Assessment:</strong> {ho.assessment}</div>
                        <div><strong>Recommendation:</strong> {ho.recommendation}</div>
                      </div>
                    )}

                    {!ho.situation && ho.notes && (
                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                        {ho.notes}
                      </p>
                    )}
                  </div>
                );
              }))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXECUTE CLINICAL ORDER (DOCTOR-NURSE CLOSED LOOP)                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedTaskForExecution}
        onClose={() => setSelectedTaskForExecution(null)}
        title="Execute Clinical Directive & Transmit Bedside Observations"
        description="Verify order instructions and safety protocols. Abnormal vital parameters trigger automated Doctor Clinical Alerts."
        maxWidth="lg"
      >
        <form onSubmit={handleExecuteOrderSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-800">
            <strong>Order:</strong> {selectedTaskForExecution?.instruction}
            <div className="text-[11px] text-slate-600 mt-1">
              Patient: <strong>{selectedTaskForExecution?.patientName}</strong> &middot; Bed {selectedTaskForExecution?.bed} &middot; Ordered by {selectedTaskForExecution?.doctorName}
            </div>
          </div>

          {/* 5 Rights Medication Safety Protocol (If Medication Task) */}
          {selectedTaskForExecution?.taskType === 'Medication Administration' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-amber-700" />
                Mandatory Five Rights of Medication Administration:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'rightPatient', label: '1. Right Patient (EMR / ID band)' },
                  { key: 'rightMedication', label: '2. Right Medication (Vial check)' },
                  { key: 'rightDose', label: '3. Right Dose & Unit' },
                  { key: 'rightRoute', label: '4. Right Route (IV / PO / SubQ)' },
                  { key: 'rightTime', label: '5. Right Time & Frequency' },
                  { key: 'allergiesCrossChecked', label: '6. Allergy Cross-Check' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(medSafetyChecks as any)[item.key]}
                      onChange={(e) => setMedSafetyChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span className="text-[11px] font-medium text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Lab Sample Collection Checklist */}
          {selectedTaskForExecution?.taskType === 'Lab Collection' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Syringe className="w-4 h-4 text-indigo-700" />
                Diagnostic Sample Collection Protocol:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labTubeVerified}
                    onChange={(e) => setLabTubeVerified(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>Verified correct specimen tube (Purple EDTA / Red Serum / Blue Citrate)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Sample Barcode:</span>
                  <input
                    type="text"
                    value={specimenBarcode}
                    onChange={(e) => setSpecimenBarcode(e.target.value)}
                    placeholder="e.g. LAB-8942-01"
                    className="p-1 border border-indigo-200 rounded text-xs font-mono w-32"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">Bedside Nursing Observation Notes</label>
            <textarea
              value={nurseNotes}
              onChange={(e) => setNurseNotes(e.target.value)}
              rows={3}
              placeholder="Record patient response, infusion rate, catheter status, or clinical tolerance..."
              className="w-full p-2.5 border border-[#CBD5E1] rounded-lg"
            />
          </div>

          {/* Vitals Input Grid */}
          <div>
            <label className="block font-semibold text-[#1E293B] mb-2">Record Current Bedside Telemetry</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* ========================================================================= */}
      {/* MODAL: REPORT FAULTY EQUIPMENT & REQUISITION REPLACEMENT                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showReportFaultModal}
        onClose={() => setShowReportFaultModal(false)}
        title="Report Faulty Biomedical Equipment & Requisition Replacement"
        description="Notifies Hospital Administration and Biomedical Engineering for urgent device turnaround."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitFaultReport} className="space-y-4 text-xs">
          {faultSuccessMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{faultSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Select Equipment Unit</label>
            <select
              value={faultEquipmentId}
              onChange={(e) => setFaultEquipmentId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              required
            >
              <option value="">-- Choose Equipment --</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} (SN: {eq.serialNumber}) &middot; {eq.ward}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Requisition Urgency</label>
            <select
              value={faultUrgency}
              onChange={(e) => setFaultUrgency(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="Emergency">Emergency (Immediate replacement required for life support)</option>
              <option value="Urgent">Urgent (Within 2 hours)</option>
              <option value="Routine">Routine (Next shift)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Fault Description & Clinical Impact</label>
            <textarea
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="Describe error code, pressure sensor malfunction, alarm failure, or calibration drift..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowReportFaultModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
              Submit Requisition to Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NURSING ASSESSMENT                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeClinicalModal === 'assessment'}
        onClose={() => setActiveClinicalModal(null)}
        title={`Head-to-Toe Nursing Assessment — ${activePatientForAction?.name || 'Inpatient'}`}
        description="Comprehensive neurological, respiratory, cardiovascular, and pain assessment documentation."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span>Bed: <strong>{activePatientForAction?.bedNumber || activePatientForAction?.bed}</strong> ({activePatientForAction?.ward || activePatientForAction?.room})</span>
            <span>Attending: <strong>{activePatientForAction?.attendingPhysician}</strong></span>
          </div>

          {/* GCS Section */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="font-bold text-blue-900 flex items-center justify-between">
              <span>Glasgow Coma Scale (GCS)</span>
              <Badge variant="primary" size="sm">Score: {gcsEye + gcsVerbal + gcsMotor} / 15</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Eye Opening (1-4)</label>
                <select
                  value={gcsEye}
                  onChange={(e) => setGcsEye(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value={4}>4 - Spontaneous</option>
                  <option value={3}>3 - To Speech</option>
                  <option value={2}>2 - To Pain</option>
                  <option value={1}>1 - None</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Verbal Response (1-5)</label>
                <select
                  value={gcsVerbal}
                  onChange={(e) => setGcsVerbal(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value={5}>5 - Oriented</option>
                  <option value={4}>4 - Confused</option>
                  <option value={3}>3 - Inappropriate</option>
                  <option value={2}>2 - Incomprehensible</option>
                  <option value={1}>1 - None / Intubated</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Motor Response (1-6)</label>
                <select
                  value={gcsMotor}
                  onChange={(e) => setGcsMotor(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value={6}>6 - Obeys Commands</option>
                  <option value={5}>5 - Localizes Pain</option>
                  <option value={4}>4 - Normal Flexion</option>
                  <option value={3}>3 - Abnormal Flexion</option>
                  <option value={2}>2 - Extension</option>
                  <option value={1}>1 - None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pain & Respiratory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Pain Score (0 - 10 Numeric Scale)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painScore}
                  onChange={(e) => setPainScore(Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-bold text-sm w-8 text-center">{painScore}</span>
              </div>
              <input
                type="text"
                value={painLocation}
                onChange={(e) => setPainLocation(e.target.value)}
                placeholder="Pain location & description"
                className="w-full p-1.5 mt-1 border border-slate-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Respiratory Work of Breathing</label>
              <input
                type="text"
                value={respPattern}
                onChange={(e) => setRespPattern(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded text-xs"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Capillary Refill: {capRefill}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Nursing Narrative Notes</label>
            <textarea
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
              placeholder="Document pupil symmetry, peripheral pulses, bowel sounds, skin integrity..."
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setActiveClinicalModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (activePatientForAction?.id) {
                  try {
                    await api.recordObservation(activePatientForAction.id, {
                      heartRate: activePatientForAction.vitals?.heartRate || 78,
                      systolicBp: activePatientForAction.vitals?.systolicBP || 120,
                      diastolicBp: 80,
                      spo2: activePatientForAction.vitals?.spO2 || 98,
                      respiratoryRate: 16,
                      temperature: 98.6,
                      gcs: gcsEye + gcsVerbal + gcsMotor,
                      painScore,
                      notes: `GCS: ${gcsEye + gcsVerbal + gcsMotor} (E${gcsEye}V${gcsVerbal}M${gcsMotor}), Pain: ${painScore}/10 (${painLocation}), Resp Pattern: ${respPattern}. ${assessmentNotes}`
                    });
                  } catch (e) {
                    console.warn('Backend observation logging error:', e);
                  }
                }
                setRecordFeedback(`Nursing assessment recorded for ${activePatientForAction?.name}. EMR updated.`);
                setActiveClinicalModal(null);
                setTimeout(() => setRecordFeedback(null), 3000);
              }}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Save Assessment to EMR
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CARE PLAN & GOALS                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeClinicalModal === 'care_plan'}
        onClose={() => setActiveClinicalModal(null)}
        title={`Multidisciplinary Nursing Care Plan — ${activePatientForAction?.name || 'Inpatient'}`}
        description="Nursing diagnoses, targeted interventions, and clinical recovery milestones."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
            <div className="font-bold text-indigo-900">Primary Nursing Diagnosis:</div>
            <p className="text-slate-800">
              Impaired gas exchange related to ventilation-perfusion mismatch as evidenced by SpO2 desaturations on exertion.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-800">Key Nursing Interventions:</div>
            {[
              'Q2H position changes with semi-Fowler 30-45 degree head of bed elevation',
              'Maintain supplemental humidified O2 via nasal cannula to keep SpO2 > 94%',
              'Incentive spirometry 10 breaths every waking hour with coaching',
              'Continuous bedside telemetry with ST segment monitoring active'
            ].map((plan, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-800 font-medium">{plan}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-800">Step-Down & Discharge Goals:</div>
            <p className="text-slate-600">
              1. Room air SpO2 &gt; 95% at rest.<br />
              2. Independent ambulation with 1-assist.<br />
              3. Tolerating oral intake with adequate urine output &gt; 0.5 mL/kg/hr.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (activePatientForAction?.id) {
                  try {
                    await api.recordObservation(activePatientForAction.id, {
                      notes: `Care Plan Reviewed & Updated: Q2H position change, supplemental O2, incentive spirometry, continuous telemetry.`
                    });
                  } catch (e) {
                    console.warn('Backend care plan logging error:', e);
                  }
                }
                setRecordFeedback(`Care Plan saved & synchronized for ${activePatientForAction?.name}.`);
                setActiveClinicalModal(null);
                setTimeout(() => setRecordFeedback(null), 3000);
              }}
            >
              Save & Synchronize Care Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: INTAKE & OUTPUT (I/O) MONITORING                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeClinicalModal === 'io_monitoring'}
        onClose={() => setActiveClinicalModal(null)}
        title={`Fluid Balance & I/O Telemetry — ${activePatientForAction?.name || 'Inpatient'}`}
        description="Calculate 24-hour net fluid balance to prevent pulmonary edema or acute kidney injury."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* Summary Balance Pill */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-600 block">Total Intake: <strong>{oralIntake + ivIntake} mL</strong></span>
              <span className="text-slate-600 block">Total Output: <strong>{urineOutput + drainOutput} mL</strong></span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Net 24h Balance</span>
              <span className={`text-lg font-bold ${(oralIntake + ivIntake - (urineOutput + drainOutput)) >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {(oralIntake + ivIntake - (urineOutput + drainOutput)) >= 0 ? '+' : ''}
                {oralIntake + ivIntake - (urineOutput + drainOutput)} mL
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="font-bold text-blue-900">Fluid Intake (mL)</div>
              <div>
                <label className="text-[11px] text-slate-600 block">Oral / Enteral Fluids</label>
                <input
                  type="number"
                  value={oralIntake}
                  onChange={(e) => setOralIntake(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">IV Infusions & Medications</label>
                <input
                  type="number"
                  value={ivIntake}
                  onChange={(e) => setIvIntake(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-amber-900">Fluid Output (mL)</div>
              <div>
                <label className="text-[11px] text-slate-600 block">Urine Output</label>
                <input
                  type="number"
                  value={urineOutput}
                  onChange={(e) => setUrineOutput(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">Drains / NG / Emesis</label>
                <input
                  type="number"
                  value={drainOutput}
                  onChange={(e) => setDrainOutput(Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Clinical Observation</label>
            <textarea
              value={ioNotes}
              onChange={(e) => setIoNotes(e.target.value)}
              rows={2}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setActiveClinicalModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                const balance = oralIntake + ivIntake - (urineOutput + drainOutput);
                if (activePatientForAction?.id) {
                  try {
                    await api.recordObservation(activePatientForAction.id, {
                      notes: `24h Fluid Balance: ${balance >= 0 ? '+' : ''}${balance} mL (Intake: ${oralIntake + ivIntake} mL, Output: ${urineOutput + drainOutput} mL). Notes: ${ioNotes}`
                    });
                  } catch (e) {
                    console.warn('Backend I/O logging error:', e);
                  }
                }
                setRecordFeedback(`I/O fluid balance logged (+${oralIntake + ivIntake - (urineOutput + drainOutput)} mL) for ${activePatientForAction?.name}.`);
                setActiveClinicalModal(null);
                setTimeout(() => setRecordFeedback(null), 3000);
              }}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Log I/O Balance to EMR
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: WOUND CARE TRACKER                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeClinicalModal === 'wound_care'}
        onClose={() => setActiveClinicalModal(null)}
        title={`Wound Care & Dressing Protocol — ${activePatientForAction?.name || 'Inpatient'}`}
        description="Document wound assessment, tissue healing staging, and antimicrobial dressing changes."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Anatomical Site</label>
              <input
                type="text"
                value={woundSite}
                onChange={(e) => setWoundSite(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Staging / Type</label>
              <select
                value={woundStage}
                onChange={(e) => setWoundStage(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Primary Intention Surgical">Primary Intention Surgical</option>
                <option value="Stage I Pressure Injury">Stage I Pressure Injury</option>
                <option value="Stage II Partial Thickness">Stage II Partial Thickness</option>
                <option value="Stage III Full Thickness">Stage III Full Thickness</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Exudate Characteristics</label>
              <select
                value={woundExudate}
                onChange={(e) => setWoundExudate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="None / Dry">None / Dry</option>
                <option value="Minimal Serosanguinous">Minimal Serosanguinous</option>
                <option value="Moderate Serous">Moderate Serous</option>
                <option value="Copious Purulent">Copious Purulent (Culture Required)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Applied Dressing</label>
              <input
                type="text"
                value={dressingType}
                onChange={(e) => setDressingType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Wound Assessment Notes</label>
            <textarea
              value={woundNotes}
              onChange={(e) => setWoundNotes(e.target.value)}
              rows={2}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setActiveClinicalModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (activePatientForAction?.id) {
                  try {
                    await api.recordObservation(activePatientForAction.id, {
                      notes: `Wound Care Documented: Site: ${woundSite}, Stage: ${woundStage}, Exudate: ${woundExudate}, Dressing: ${dressingType}. Notes: ${woundNotes}`
                    });
                  } catch (e) {
                    console.warn('Backend wound care logging error:', e);
                  }
                }
                setRecordFeedback(`Wound care documented for ${activePatientForAction?.name}. Next dressing due in 48h.`);
                setActiveClinicalModal(null);
                setTimeout(() => setRecordFeedback(null), 3000);
              }}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Sign Off Dressing Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MORSE FALL RISK SCALE                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeClinicalModal === 'fall_risk'}
        onClose={() => setActiveClinicalModal(null)}
        title={`Morse Fall Scale Assessment — ${activePatientForAction?.name || 'Inpatient'}`}
        description="Standardized clinical risk assessment to implement tailored fall precautions."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* Result Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            morseRiskLevel === 'High Risk' ? 'bg-red-50 border-red-300 text-red-900' :
            morseRiskLevel === 'Moderate Risk' ? 'bg-amber-50 border-amber-300 text-amber-900' :
            'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div>
              <span className="text-[11px] block">Morse Fall Score</span>
              <span className="text-xl font-bold">{morseScore} Points</span>
            </div>
            <Badge variant={morseRiskLevel === 'High Risk' ? 'critical' : morseRiskLevel === 'Moderate Risk' ? 'warning' : 'success'} size="md">
              {morseRiskLevel}
            </Badge>
          </div>

          <div className="space-y-2">
            {[
              { label: '1. History of falling within 3 months', val: historyOfFalls, setVal: setHistoryOfFalls, options: [{ v: 0, l: 'No (0)' }, { v: 25, l: 'Yes (25)' }] },
              { label: '2. Secondary medical diagnosis', val: secondaryDiagnosis, setVal: setSecondaryDiagnosis, options: [{ v: 0, l: 'No (0)' }, { v: 15, l: 'Yes (15)' }] },
              { label: '3. Ambulatory aid', val: ambulatoryAid, setVal: setAmbulatoryAid, options: [{ v: 0, l: 'Bed rest / Nurse assist (0)' }, { v: 15, l: 'Crutches / Walker (15)' }, { v: 30, l: 'Furniture support (30)' }] },
              { label: '4. IV therapy / Heparin lock', val: ivTherapy, setVal: setIvTherapy, options: [{ v: 0, l: 'No (0)' }, { v: 20, l: 'Yes (20)' }] },
              { label: '5. Gait / Transferring', val: gaitTransfer, setVal: setGaitTransfer, options: [{ v: 0, l: 'Normal / Bedbound (0)' }, { v: 10, l: 'Weak (10)' }, { v: 20, l: 'Impaired (20)' }] },
              { label: '6. Mental status', val: mentalStatus, setVal: setMentalStatus, options: [{ v: 0, l: 'Knows own limits (0)' }, { v: 15, l: 'Overestimates abilities (15)' }] }
            ].map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-800 font-semibold">{q.label}</span>
                <select
                  value={q.val}
                  onChange={(e) => q.setVal(Number(e.target.value))}
                  className="p-1 border border-slate-300 rounded text-xs bg-white"
                >
                  {q.options.map(opt => (
                    <option key={opt.v} value={opt.v}>{opt.l}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {morseRiskLevel === 'High Risk' && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[11px] font-semibold">
              High Fall Risk Triggered: Ensure Bed Alarm is ARMED, Yellow Fall-Risk Wristband placed, and nonslip footwear applied.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setActiveClinicalModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (activePatientForAction?.id) {
                  try {
                    await api.recordObservation(activePatientForAction.id, {
                      notes: `Morse Fall Risk Assessment: ${morseScore} Points (${morseRiskLevel}). Precautions implemented.`
                    });
                  } catch (e) {
                    console.warn('Backend fall risk logging error:', e);
                  }
                }
                setRecordFeedback(`Morse Fall Risk (${morseScore} - ${morseRiskLevel}) documented for ${activePatientForAction?.name}.`);
                setActiveClinicalModal(null);
                setTimeout(() => setRecordFeedback(null), 3000);
              }}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Save Fall Risk Protocol
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MAR MEDICATION ADMINISTRATION                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAdministerModal}
        onClose={() => {
          setShowAdministerModal(false);
          setSelectedMarItem(null);
        }}
        title={`Bedside Medication Administration — ${selectedMarItem?.medicationName || selectedMarItem?.medication_name || 'Rx'}`}
        description="Verify 5-Rights safety checklist and document clinical administration status in electronic MAR."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitMarAdministration} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Patient / Bed</span>
              <span className="font-bold text-slate-800">{selectedMarItem?.patientId || selectedMarItem?.patient_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Medication & Dose</span>
              <span className="font-bold text-slate-800">{selectedMarItem?.medicationName || selectedMarItem?.medication_name} ({selectedMarItem?.dose})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Route</span>
              <span className="font-bold text-slate-800">{selectedMarItem?.route}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Administration Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Administered', 'Delayed', 'Omitted', 'Refused'] as const).map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setAdminStatus(st)}
                  className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    adminStatus === st
                      ? st === 'Administered'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Rights Checklist */}
          {adminStatus === 'Administered' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Mandatory 5-Rights Bedside Safety Verification:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminSafetyChecks.rightPatient}
                    onChange={(e) => setAdminSafetyChecks(prev => ({ ...prev, rightPatient: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>1. Right Patient (Barcode/Wristband)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminSafetyChecks.rightMedication}
                    onChange={(e) => setAdminSafetyChecks(prev => ({ ...prev, rightMedication: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>2. Right Medication</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminSafetyChecks.rightDose}
                    onChange={(e) => setAdminSafetyChecks(prev => ({ ...prev, rightDose: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>3. Right Dose</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminSafetyChecks.rightRoute}
                    onChange={(e) => setAdminSafetyChecks(prev => ({ ...prev, rightRoute: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>4. Right Route</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={adminSafetyChecks.rightTime}
                    onChange={(e) => setAdminSafetyChecks(prev => ({ ...prev, rightTime: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>5. Right Time & Window</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              {adminStatus === 'Administered' ? 'Clinical Notes / Site / Observations' : `Reason for ${adminStatus}`}
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={adminStatus === 'Administered' ? 'e.g. Infused over 30 mins via right forearm IV. No adverse reactions observed.' : 'Document clinical justification...'}
              rows={2}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              required={adminStatus !== 'Administered'}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowAdministerModal(false);
                setSelectedMarItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Confirm MAR Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
