import React, { useState } from 'react';
import { ClinicalWorkspaceView } from '../doctor-dashboard/ClinicalWorkspaceView';
import { PatientDigitalTwinView } from '../doctor-dashboard/PatientDigitalTwinView';
import { DeteriorationRadarView } from '../doctor-dashboard/DeteriorationRadarView';
import { EarlyWarningSystemView } from '../doctor-dashboard/EarlyWarningSystemView';
import { AiClinicalAssistantView } from '../doctor-dashboard/AiClinicalAssistantView';
import { AiCaseSummarizerView } from '../doctor-dashboard/AiCaseSummarizerView';
import { ClinicalHandoverView } from '../doctor-dashboard/ClinicalHandoverView';
import { EmergencyPatientMatchingView } from '../doctor-dashboard/EmergencyPatientMatchingView';
import { LabIntelligenceView } from '../doctor-dashboard/LabIntelligenceView';
import { MedicationSafetyView } from '../doctor-dashboard/MedicationSafetyView';
import { TreatmentResponseView } from '../doctor-dashboard/TreatmentResponseView';
import { DischargeIntelligenceView } from '../doctor-dashboard/DischargeIntelligenceView';
import { DoctorNurseCoordinationView } from '../doctor-dashboard/DoctorNurseCoordinationView';
import { OutbreakDetectionView } from '../doctor-dashboard/OutbreakDetectionView';
import { DoctorAnalyticsView } from '../doctor-dashboard/DoctorAnalyticsView';
import { EmergencyCommandCenter } from '../emergency/EmergencyCommandCenter';
import { PredictiveIntelligencePage } from '../forecasting/PredictiveIntelligencePage';
import { HospitalDigitalTwinLab } from '../simulation/HospitalDigitalTwinLab';
import { WorkflowAutomationCenter } from '../workflow/WorkflowAutomationCenter';
import { InteroperabilityCenter } from '../interoperability/InteroperabilityCenter';
import {
  DoctorAppointmentsView,
  DoctorPendingAdmissionsView,
  DoctorClinicalWardsView,
  DoctorPatientMonitoringView,
  DoctorDigitalPrescriptionView,
  DoctorCarePlanView,
  DoctorSmartDiagnosisView,
  DoctorDecisionTimelineView,
  DoctorTransfersView,
  DoctorEmergencyAlertsView,
  DoctorReferralConsultView,
  DoctorKnowledgeHubView,
  DoctorCaseStudiesView,
  DoctorAuditTrailView,
  DoctorProfileView,
  DoctorNotificationsView,
  DoctorSettingsView
} from '../doctor-dashboard/DoctorSupportingViews';

interface DoctorDashboardProps {
  activeTab: string;
  onSelectTab?: (tabId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ activeTab, onSelectTab }) => {
  const [internalTab, setInternalTab] = useState<string>(activeTab || 'dashboard');
  const [targetPatientId, setTargetPatientId] = useState<string | undefined>(undefined);

  // Sync internal tab if activeTab prop changes
  React.useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const handleNavigate = (tabId: string, patientId?: string) => {
    if (patientId) {
      setTargetPatientId(patientId);
    }
    setInternalTab(tabId);
    if (onSelectTab) {
      onSelectTab(tabId);
    }
  };

  const renderActiveView = () => {
    const normTab = (internalTab || 'dashboard').replace(/-/g, '_');
    switch (normTab) {
      // 1. DOCTOR DASHBOARD / WORKSPACE
      case 'dashboard':
      case 'overview':
      case 'doctor_overview':
        return <ClinicalWorkspaceView onNavigateTab={handleNavigate} />;
      case 'patients':
      case 'my_patients':
        return <PatientDigitalTwinView onNavigateTab={handleNavigate} initialPatientId={targetPatientId} />;
      case 'appointments':
        return <DoctorAppointmentsView />;
      case 'admissions':
      case 'pending_admissions':
        return <DoctorPendingAdmissionsView />;
      case 'wards':
      case 'clinical_wards':
        return <DoctorClinicalWardsView />;

      // 2. PATIENT CARE
      case 'digital_twin':
        return <PatientDigitalTwinView onNavigateTab={handleNavigate} initialPatientId={targetPatientId} />;
      case 'patient_monitoring':
        return <DoctorPatientMonitoringView />;
      case 'lab_intelligence':
        return <LabIntelligenceView onNavigateTab={handleNavigate} />;
      case 'digital_prescription':
        return <DoctorDigitalPrescriptionView />;
      case 'care_plan':
        return <DoctorCarePlanView />;
      case 'discharge_intelligence':
        return <DischargeIntelligenceView onNavigateTab={handleNavigate} />;

      // 3. AI CLINICAL INTELLIGENCE
      case 'ai_assistant':
        return <AiClinicalAssistantView onNavigateTab={handleNavigate} />;
      case 'early_warning':
        return <EarlyWarningSystemView onNavigateTab={handleNavigate} />;
      case 'deterioration_radar':
        return <DeteriorationRadarView onNavigateTab={handleNavigate} />;
      case 'smart_diagnosis':
        return <DoctorSmartDiagnosisView />;
      case 'medication_safety':
        return <MedicationSafetyView onNavigateTab={handleNavigate} />;
      case 'ai_summarizer':
        return <AiCaseSummarizerView onNavigateTab={handleNavigate} />;
      case 'treatment_response':
        return <TreatmentResponseView onNavigateTab={handleNavigate} />;
      case 'decision_timeline':
        return <DoctorDecisionTimelineView />;

      // 4. EMERGENCY & COORDINATION
      case 'command_center':
        return <EmergencyCommandCenter onNavigateTab={handleNavigate} />;
      case 'simulation_lab':
        return <HospitalDigitalTwinLab onNavigateTab={handleNavigate} activeRole="doctor" />;
      case 'workflow_automation':
      case 'workflows':
        return <WorkflowAutomationCenter onNavigateTab={handleNavigate} activeRole="doctor" />;
      case 'forecasting':
      case 'predictive_intelligence':
        return <PredictiveIntelligencePage onSelectTab={handleNavigate} />;
      case 'requests':
      case 'resource_requests':
        return <ClinicalWorkspaceView onNavigateTab={handleNavigate} />;
      case 'transfers':
        return <DoctorTransfersView />;
      case 'interoperability':
      case 'health_data_exchange':
        return <InteroperabilityCenter onSelectTab={handleNavigate} activeRole="doctor" />;
      case 'emergency_alerts':
        return <DoctorEmergencyAlertsView />;
      case 'emergency_matching':
        return <EmergencyPatientMatchingView onNavigateTab={handleNavigate} />;
      case 'doctor_nurse_coord':
        return <DoctorNurseCoordinationView onNavigateTab={handleNavigate} />;
      case 'referral_consult':
        return <DoctorReferralConsultView />;
      case 'clinical_handover':
        return <ClinicalHandoverView onNavigateTab={handleNavigate} />;
      case 'outbreak_detection':
        return <OutbreakDetectionView onNavigateTab={handleNavigate} />;

      // 5. CLINICAL INSIGHTS
      case 'knowledge_hub':
        return <DoctorKnowledgeHubView />;
      case 'case_studies':
        return <DoctorCaseStudiesView />;
      case 'doctor_analytics':
        return <DoctorAnalyticsView />;
      case 'audit_trail':
        return <DoctorAuditTrailView />;

      // 6. ACCOUNT
      case 'profile':
        return <DoctorProfileView />;
      case 'notifications':
        return <DoctorNotificationsView />;
      case 'settings':
        return <DoctorSettingsView />;

      default:
        return <ClinicalWorkspaceView onNavigateTab={handleNavigate} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderActiveView()}
    </div>
  );
};
