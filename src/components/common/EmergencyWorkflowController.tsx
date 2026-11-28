import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCw, 
  Users, 
  Bed, 
  Activity, 
  ShieldAlert, 
  FileText, 
  AlertTriangle,
  Flame,
  Check,
  Building2,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { hospitalDataService } from '../../services/hospitalDataService';
import { useApp } from '../../context/AppContext';

interface EmergencyWorkflowControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchPortal?: (role: 'admin' | 'doctor' | 'nurse') => void;
}

export const EmergencyWorkflowController: React.FC<EmergencyWorkflowControllerProps> = ({ 
  isOpen, 
  onClose,
  onSwitchPortal 
}) => {
  const { user, setUser } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const scenarioPatient = {
    patientId: 'EMG-8991',
    name: 'Murugan K. (Code Red Trauma)',
    age: 54,
    gender: 'Male' as const,
    bloodGroup: 'O+',
    primaryDiagnosis: 'Acute Hypoxemic Respiratory Failure & Flail Chest post-MVA',
    ward: 'ICU Block A',
    bedNumber: 'A-101',
    attendingPhysician: 'Dr. Sundaramoorthy M.',
    assignedNurse: 'Nurse Revathi S.'
  };

  const steps = [
    {
      step: 1,
      title: 'Emergency Arrival in Triage',
      portal: 'doctor' as const,
      description: 'Patient Murugan K. arrives via 108 Emergency Ambulance with severe thoracic trauma and respiratory distress.',
      action: () => {
        hospitalDataService.admitOrUpdatePatient({
          ...scenarioPatient,
          admissionDate: new Date().toISOString().split('T')[0],
          riskLevel: 'Critical',
          mewsScore: 7,
          currentVitals: {
            timestamp: 'Triage Entry',
            heartRate: 118,
            systolicBP: 94,
            diastolicBP: 58,
            spO2: 88,
            respiratoryRate: 28,
            temperature: 36.8,
            gcsScore: 13,
            isAbnormal: true
          }
        });
        return 'Patient record EMG-8991 created in Hospital Patient Registry with Critical triage status.';
      }
    },
    {
      step: 2,
      title: 'Doctor Identifies ICU & Ventilator Need',
      portal: 'doctor' as const,
      description: 'Attending physician Dr. Sundaramoorthy examines patient in Resuscitation Bay and determines mechanical ventilation and ICU bed are mandatory.',
      action: () => {
        hospitalDataService.addNotification({
          title: 'Emergency Triage Identification',
          message: 'Dr. Sundaramoorthy evaluated Murugan K. (EMG-8991): Acute hypoxemia requires immediate invasive mechanical ventilation.',
          type: 'warning',
          targetRole: 'doctor',
          category: 'emergency_request',
          patientId: scenarioPatient.patientId
        });
        return 'Doctor clinical indication documented: Invasive ventilation & continuous arterial line monitoring required.';
      }
    },
    {
      step: 3,
      title: 'Doctor Submits Emergency Resource Request',
      portal: 'doctor' as const,
      description: 'Doctor dispatches STAT Requisition for 1x ICU Bed and 1x Mechanical Ventilator to Hospital Command Center.',
      action: () => {
        const req = hospitalDataService.submitEmergencyRequisition({
          patientName: scenarioPatient.name,
          patientId: scenarioPatient.patientId,
          resourceType: 'ICU Bed & Mechanical Ventilator',
          quantity: 1,
          urgency: 'Urgent',
          reason: 'Severe hypoxemic respiratory failure with bilateral pneumothorax stabilization.',
          requesterName: scenarioPatient.attendingPhysician,
          requesterRole: 'Doctor',
          department: 'Emergency & Critical Care',
          ward: scenarioPatient.ward
        });
        return `Requisition ${req.requestId} dispatched to Hospital Admin with STAT urgency.`;
      }
    },
    {
      step: 4,
      title: 'Hospital Admin Receives Requisition',
      portal: 'admin' as const,
      description: 'Hospital Administrator receives high-priority audio-visual alert and reviews available ICU capacity in Bed Master Status.',
      action: () => {
        hospitalDataService.addNotification({
          title: '🚨 Admin Review: Emergency Requisition',
          message: `Requisition for Murugan K. under review in Command Center. Checking Bed Master Status and Equipment Telemetry.`,
          type: 'critical',
          targetRole: 'admin',
          category: 'emergency_request',
          patientId: scenarioPatient.patientId
        });
        return 'Hospital Admin opens Resource Requests queue: Bed A-101 verified Ready and Ventilator VEN-01 Standby.';
      }
    },
    {
      step: 5,
      title: 'Admin Approves & Allocates Bed & Ventilator',
      portal: 'admin' as const,
      description: 'Hospital Admin authorizes requisition, locks Bed A-101 in ICU Block A, and reserves Ventilator VEN-01.',
      action: () => {
        const requests = hospitalDataService.getResourceRequests();
        const activeReq = requests.find(r => r.patientId === scenarioPatient.patientId) || requests[0];
        
        hospitalDataService.reviewEmergencyRequisition({
          requestId: activeReq.id,
          decision: 'Allocated',
          allocatedResourceId: 'Bed A-101 + Ventilator VEN-01',
          reviewerName: 'Hospital Administrator'
        });

        hospitalDataService.assignPatientToBed(
          'bed-01', // Bed A-101
          scenarioPatient.name,
          scenarioPatient.patientId,
          scenarioPatient.attendingPhysician,
          scenarioPatient.assignedNurse
        );

        hospitalDataService.updateEquipmentStatus('eqp-01', 'In Use', scenarioPatient.ward);
        return 'Bed A-101 marked OCCUPIED. Ventilator VEN-01 marked IN USE. No other patient can be double-assigned.';
      }
    },
    {
      step: 6,
      title: 'Doctor Receives Confirmation & Bed Dock',
      portal: 'doctor' as const,
      description: 'Doctor receives real-time approval broadcast. Patient is transferred from Emergency Bay to Bed A-101.',
      action: () => {
        hospitalDataService.addNotification({
          title: '✅ Allocation Confirmed: Bed A-101',
          message: `Murugan K. transferred and docked in ICU Block A (Bed A-101). Bedside telemetry streaming online.`,
          type: 'success',
          targetRole: 'doctor',
          category: 'patient_admission',
          patientId: scenarioPatient.patientId,
          bedId: 'A-101'
        });
        return 'Patient Digital Twin and Clinical Workspace updated with Bed A-101 telemetry feed.';
      }
    },
    {
      step: 7,
      title: 'Nurse Receives Patient Assignment & Task',
      portal: 'nurse' as const,
      description: 'Bedside nurse Revathi receives assignment notification and STAT order: "Connect mechanical ventilator and record baseline vitals".',
      action: () => {
        const task = hospitalDataService.createDoctorNurseTask({
          patientName: scenarioPatient.name,
          patientId: scenarioPatient.patientId,
          ward: scenarioPatient.ward,
          bed: 'A-101',
          taskType: 'Assessment',
          instruction: 'STAT: Dock mechanical ventilator VEN-01, set PEEP 8, FiO2 60%, and record continuous arterial telemetry.',
          priority: 'Stat (Immediate)',
          doctorName: scenarioPatient.attendingPhysician,
          assignedNurse: scenarioPatient.assignedNurse
        });
        return `Closed-loop order ${task.id} active on Nurse Console.`;
      }
    },
    {
      step: 8,
      title: 'Nurse Records Vitals → MEWS Alert Triggered',
      portal: 'nurse' as const,
      description: 'Nurse records initial bedside vitals: SpO2 86%, Heart Rate 126 bpm, BP 84/52 mmHg. Physiological decompensation automatically triggers MEWS 9/14 alert.',
      action: () => {
        const tasks = hospitalDataService.getDoctorNurseTasks();
        const activeTask = tasks.find(t => t.patientId === scenarioPatient.patientId) || tasks[0];

        hospitalDataService.updateNurseTaskStatus({
          taskId: activeTask.id,
          status: 'In Progress',
          nurseObservation: 'Severe dyspnea and paradoxical chest excursion observed. SpO2 critical at 86%.',
          nurseName: scenarioPatient.assignedNurse,
          recordedVitals: {
            heartRate: 126,
            systolicBP: 84,
            spO2: 86,
            respiratoryRate: 30,
            temperature: 37.4
          }
        });
        return 'Critical Clinical Alert generated: SpO2 86% desaturation, HR 126 bpm tachycardia, MEWS score 9/14.';
      }
    },
    {
      step: 9,
      title: 'Doctor Receives Clinical Alert & Titrates Care',
      portal: 'doctor' as const,
      description: 'Doctor receives STAT Clinical Alert on Doctor Dashboard, acknowledges the alert, and orders IV Norepinephrine titration and FiO2 increase.',
      action: () => {
        const alerts = hospitalDataService.getClinicalAlerts();
        const alertItem = alerts.find(a => a.patientId === scenarioPatient.patientId) || alerts[0];
        hospitalDataService.acknowledgeAlert(alertItem.id, scenarioPatient.attendingPhysician);

        hospitalDataService.createDoctorNurseTask({
          patientName: scenarioPatient.name,
          patientId: scenarioPatient.patientId,
          ward: scenarioPatient.ward,
          bed: 'A-101',
          taskType: 'Medication Administration',
          instruction: 'STAT: Initiate IV Norepinephrine infusion at 0.1 mcg/kg/min; increase Ventilator FiO2 to 80%; target MAP > 65 mmHg.',
          priority: 'Stat (Immediate)',
          doctorName: scenarioPatient.attendingPhysician,
          assignedNurse: scenarioPatient.assignedNurse
        });
        return 'Doctor acknowledged alert; therapeutic titration order transmitted to bedside nurse.';
      }
    },
    {
      step: 10,
      title: 'Patient Stabilizes & Handover Logged',
      portal: 'doctor' as const,
      description: 'Patient responds to vasopressors and ventilator support. SpO2 rises to 96%, MAP reaches 72 mmHg. Doctor logs clinical progress note and SBAR handover.',
      action: () => {
        hospitalDataService.admitOrUpdatePatient({
          ...scenarioPatient,
          riskLevel: 'Needs Attention',
          mewsScore: 3,
          currentVitals: {
            timestamp: 'Stabilized',
            heartRate: 84,
            systolicBP: 118,
            diastolicBP: 76,
            spO2: 96,
            respiratoryRate: 16,
            temperature: 37.0,
            gcsScore: 15,
            isAbnormal: false
          },
          clinicalObservations: 'Marked hemodynamic stabilization following targeted vasopressor titration and mechanical ventilation.',
          doctorNotes: 'Patient stabilized in Bed A-101. MEWS normalized from 9 to 3. SBAR handover logged for oncoming night shift.'
        });

        hospitalDataService.addNotification({
          title: '🎉 Patient Stabilized: Murugan K.',
          message: 'Telemetry confirmed stable (SpO2 96%, HR 84 bpm). SBAR clinical shift handover signed by Dr. Sundaramoorthy.',
          type: 'success',
          targetRole: 'all',
          category: 'clinical_alert',
          patientId: scenarioPatient.patientId
        });
        return 'Full hospital emergency cycle completed! Bed management, requests, nurse tasks, and clinical records synchronized.';
      }
    }
  ];

  const handleExecuteStep = (index: number) => {
    const targetStep = steps[index];
    if (!targetStep) return;

    const resultMessage = targetStep.action();
    setExecutionLog(prev => [
      `[${new Date().toLocaleTimeString()}] Step ${targetStep.step}: ${resultMessage}`,
      ...prev
    ]);
    setCurrentStepIndex(index + 1);
  };

  const handleRunAllSteps = () => {
    setIsAutoPlaying(true);
    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        const step = steps[current];
        const res = step.action();
        setExecutionLog(prev => [
          `[${new Date().toLocaleTimeString()}] Step ${step.step}: ${res}`,
          ...prev
        ]);
        current++;
        setCurrentStepIndex(current);
      } else {
        clearInterval(interval);
        setIsAutoPlaying(false);
      }
    }, 1200);
  };

  const handleResetScenario = () => {
    setCurrentStepIndex(0);
    setExecutionLog([`[${new Date().toLocaleTimeString()}] Scenario reset to baseline initial state.`]);
    hospitalDataService.updateBedStatus('bed-01', 'Available');
    hospitalDataService.updateEquipmentStatus('eqp-01', 'Operational');
  };

  const handlePortalSwitch = (role: 'admin' | 'doctor' | 'nurse') => {
    if (user) {
      setUser({
        ...user,
        role,
        roleVerificationStatus: 'approved',
        isOnboarded: true
      });
    }
    window.location.hash = `#/dashboard/${role}`;
    if (onSwitchPortal) {
      onSwitchPortal(role);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hospital-Wide Emergency Workflow Demonstration (10 Steps)"
      description="Interactive end-to-end verification linking Doctor, Admin, Nurse, and Bed Management portals."
      maxWidth="xl"
    >
      <div className="space-y-5 text-xs">
        {/* Banner with Portal Quick-Jump buttons */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-red-600 text-white font-bold text-[10px] animate-pulse">
                SCENARIO ACTIVE
              </span>
              <h4 className="font-bold text-sm text-white">Code Red Patient: Murugan K. (54y Male)</h4>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Acute Respiratory Failure & Trauma &rarr; Requisition &rarr; Admin Allocation &rarr; Nurse Orders &rarr; Clinical Alert &rarr; Handover
            </p>
          </div>

          {/* Quick-switch portal buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">Switch Active Portal:</span>
            <button
              onClick={() => handlePortalSwitch('doctor')}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5" /> Doctor
            </button>
            <button
              onClick={() => handlePortalSwitch('admin')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" /> Admin
            </button>
            <button
              onClick={() => handlePortalSwitch('nurse')}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5" /> Nurse
            </button>
          </div>
        </div>

        {/* Steps Progress Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={st.step}
                className={`p-3 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-green-50/60 border-green-300 text-slate-800' 
                    : isCurrent 
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400' 
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isCompleted ? <Check className="w-3 h-3" /> : st.step}
                    </span>
                    <strong className="text-xs font-bold text-[#1E293B]">{st.title}</strong>
                  </div>
                  <Badge 
                    variant={st.portal === 'admin' ? 'secondary' : st.portal === 'nurse' ? 'success' : 'primary'} 
                    size="sm"
                  >
                    {st.portal.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {st.description}
                </p>
                {isCurrent && (
                  <div className="mt-2 pt-2 border-t border-blue-200 flex justify-end">
                    <button
                      onClick={() => handleExecuteStep(idx)}
                      disabled={isAutoPlaying}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      Execute Step {st.step} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Execution Logs */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[#1E293B] text-xs">Live Cross-Dashboard Audit Trail:</span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time local state broadcast</span>
          </div>
          <div className="bg-slate-900 text-green-400 p-3 rounded-lg font-mono text-[11px] h-28 overflow-y-auto space-y-1">
            {executionLog.length === 0 ? (
              <span className="text-slate-500">Ready to execute scenario. Click "Execute Step 1" or "Run All Steps".</span>
            ) : (
              executionLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetScenario}
              icon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Reset to Baseline
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunAllSteps}
              disabled={isAutoPlaying || currentStepIndex >= steps.length}
              icon={<Zap className="w-3.5 h-3.5 text-amber-600" />}
            >
              {isAutoPlaying ? 'Executing Scenario...' : 'Run All 10 Steps Automatically'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Done / Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
