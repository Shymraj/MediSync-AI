import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  X,
  KeyRound,
  Eye,
  EyeOff,
  Unlock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from '../layout/Sidebar';
import { Header } from '../layout/Header';
import { AdminDashboard } from '../dashboards/AdminDashboard';
import { DoctorDashboard } from '../dashboards/DoctorDashboard';
import { NurseDashboard } from '../dashboards/NurseDashboard';
import { BedManagementPage } from '../dashboards/BedManagementPage';
import { ClinicalWardsPage } from '../dashboards/ClinicalWardsPage';
import { ResourceRegistryPage } from '../dashboards/ResourceRegistryPage';
import { EquipmentTelemetryPage } from '../dashboards/EquipmentTelemetryPage';
import { DepartmentsPage } from '../dashboards/DepartmentsPage';
import { StaffVerificationPage } from '../dashboards/StaffVerificationPage';
import { ResourceRequestsPage } from '../dashboards/ResourceRequestsPage';
import { ReadinessReportsPage } from '../dashboards/ReadinessReportsPage';
import { HospitalSettingsPage } from '../dashboards/HospitalSettingsPage';
import { EmergencyCommandCenter } from '../emergency/EmergencyCommandCenter';
import { PredictiveIntelligencePage } from '../forecasting/PredictiveIntelligencePage';
import { HospitalDigitalTwinLab } from '../simulation/HospitalDigitalTwinLab';
import { WorkflowAutomationCenter } from '../workflow/WorkflowAutomationCenter';
import { InteroperabilityCenter } from '../interoperability/InteroperabilityCenter';
import { HospitalOverviewView } from './HospitalOverviewView';
import { HospitalPatientPortalView } from './HospitalPatientPortalView';
import { UserRole } from '../../types';
import { setActiveHospitalScopeId } from '../../utils/hospitalSync';

interface HospitalDashboardProps {
  initialTab?: string;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ initialTab }) => {
  const { 
    user, 
    tempOnboarding
  } = useApp();

  // Active sub-portal within Hospital Dashboard: 'overview' (default) | 'doctor' | 'nurse' | 'admin'
  const [activeRole, setActiveRole] = useState<'overview' | 'doctor' | 'nurse' | 'admin'>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('doctor')) return 'doctor';
    if (hash.includes('nurse')) return 'nurse';
    if (hash.includes('admin') && !hash.includes('admin-login')) return 'admin';
    return 'overview';
  });
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.split('?')[1] || '');
    const queryTab = hashParams.get('tab');
    if (queryTab) return queryTab;

    if (hash === '#/hospital/patient-portal' || hash === '#/hospital/patient') return 'patient_portal';
    if (hash === '#/hospital/beds') return 'beds';
    if (hash === '#/hospital/wards') return 'wards';
    if (hash === '#/hospital/departments') return 'departments';
    if (hash === '#/hospital/resources') return 'resources';
    if (hash === '#/hospital/equipment') return 'equipment';
    if (hash === '#/hospital/staff') return 'staff';
    if (hash === '#/hospital/resource-requests' || hash === '#/hospital/requests') return 'requests';
    if (hash === '#/hospital/readiness-reports' || hash === '#/hospital/reports') return 'reports';
    if (hash === '#/hospital/settings') return 'settings';
    if (hash === '#/hospital/command-center' || hash === '#/command-center' || hash === '#/emergency') return 'command_center';
    if (hash === '#/hospital/simulation-lab' || hash === '#/hospital/digital-twin' || hash === '#/simulation-lab') return 'simulation_lab';
    if (hash === '#/hospital/workflows' || hash === '#/hospital/workflow-automation' || hash === '#/workflows') return 'workflow_automation';
    if (hash === '#/hospital/forecasting' || hash === '#/hospital/predictive-intelligence') return 'forecasting';
    if (hash === '#/hospital/interoperability' || hash === '#/interoperability' || hash === '#/health-data-exchange') return 'interoperability';
    return 'dashboard';
  });

  useEffect(() => {
    if (initialTab) setCurrentTab(initialTab);
  }, [initialTab]);

  // Sync tab with URL hash
  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      const queryTab = hashParams.get('tab');
      if (queryTab) {
        setCurrentTab(queryTab);
        if (hash.includes('doctor')) {
          setActiveRole('doctor');
        } else if (hash.includes('nurse')) {
          setActiveRole('nurse');
        }
        return;
      }

      if (hash === '#/hospital/patient-portal' || hash === '#/hospital/patient') {
        setCurrentTab('patient_portal');
        setActiveRole('overview');
        return;
      }

      if (hash.includes('doctor')) {
        setActiveRole('doctor');
      } else if (hash.includes('nurse')) {
        setActiveRole('nurse');
      }

      if (hash === '#/hospital/command-center' || hash === '#/command-center' || hash === '#/emergency') {
        setCurrentTab('command_center');
      } else if (hash === '#/hospital/simulation-lab' || hash === '#/hospital/digital-twin' || hash === '#/simulation-lab') {
        setCurrentTab('simulation_lab');
      } else if (hash === '#/hospital/workflows' || hash === '#/hospital/workflow-automation' || hash === '#/workflows') {
        setCurrentTab('workflow_automation');
      } else if (hash === '#/hospital/forecasting' || hash === '#/hospital/predictive-intelligence') {
        setCurrentTab('forecasting');
      } else if (hash === '#/hospital/interoperability' || hash === '#/interoperability' || hash === '#/health-data-exchange') {
        setCurrentTab('interoperability');
      } else if (hash === '#/hospital/beds') {
        setCurrentTab('beds');
      } else if (hash === '#/hospital/wards') {
        setCurrentTab('wards');
      } else if (hash === '#/hospital/departments') {
        setCurrentTab('departments');
      } else if (hash === '#/hospital/resources') {
        setCurrentTab('resources');
      } else if (hash === '#/hospital/equipment') {
        setCurrentTab('equipment');
      } else if (hash === '#/hospital/staff') {
        setCurrentTab('staff');
      } else if (hash === '#/hospital/resource-requests' || hash === '#/hospital/requests') {
        setCurrentTab('requests');
      } else if (hash === '#/hospital/readiness-reports' || hash === '#/hospital/reports') {
        setCurrentTab('reports');
      } else if (hash === '#/hospital/settings') {
        setCurrentTab('settings');
      } else if (hash === '#/hospital/overview' || hash === '#/hospital-dashboard') {
        setCurrentTab('dashboard');
      }
    };
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  // Quick celebration banner if arriving right after registration
  const [showCelebration, setShowCelebration] = useState(() => {
    try {
      return sessionStorage.getItem('medisync_just_registered') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (showCelebration) {
      sessionStorage.removeItem('medisync_just_registered');
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  // Admin authentication state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('Admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Current hospital details
  const currentHospital = {
    id: tempOnboarding.hospitalId || user?.hospitalId || tempOnboarding.registrationNumber || 'Hos_Id-101',
    districtId: (tempOnboarding.districtId || user?.districtId || 'chennai').toLowerCase(),
    districtName: tempOnboarding.districtName || user?.districtName || 'Chennai',
    name: tempOnboarding.hospitalName || user?.hospitalName || 'Rajiv Gandhi Government General Hospital (RGGGH)',
    type: 'Government Medical College Hospital' as const,
    location: tempOnboarding.hospitalAddress || 'EVR Periyar Salai, Park Town, Chennai',
    availableDepartments: ['Cardiology', 'General Medicine', 'Pulmonology', 'Emergency & Casualty', 'Pediatrics', 'Orthopedics'],
    status: 'Operational' as const,
    totalBeds: 1750,
    occupiedBeds: 1318,
    readyBeds: 432,
    prepBeds: 42,
    icuAvailable: 180,
    ventilatorsAvailable: 108,
    phone: tempOnboarding.hospitalPhone || '+91 44 2530 5000',
    emergencyContact: tempOnboarding.emergencyContact || '044-25305112'
  };

  useEffect(() => {
    if (currentHospital.id) {
      setActiveHospitalScopeId(currentHospital.id);
    }
  }, [currentHospital.id]);

  // Handle portal switching
  const handleSelectPortal = (targetRole: 'overview' | 'doctor' | 'nurse' | 'admin' | 'patient' | string) => {
    if (targetRole === 'admin') {
      if (isAdminUnlocked) {
        setActiveRole('admin');
        setCurrentTab('dashboard');
      } else {
        // Prompt for Admin credentials (Username: Admin, Password: admin123)
        setAdminError(null);
        setShowAdminLoginModal(true);
      }
    } else if (targetRole === 'patient') {
      setActiveRole('overview');
      setCurrentTab('patient_portal');
      window.location.hash = '#/hospital/patient-portal';
    } else {
      if (targetRole === 'doctor' || targetRole === 'nurse' || targetRole === 'admin') {
        setActiveRole(targetRole);
      } else {
        setActiveRole('overview');
      }
      setCurrentTab('dashboard');
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = adminUsername.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    // Verify credentials: Username: Admin / Password: admin123
    if (cleanUsername === 'admin' && cleanPassword === 'admin123') {
      setIsAdminUnlocked(true);
      setShowAdminLoginModal(false);
      setAdminError(null);
      setAdminPassword('');
      setActiveRole('admin');
      setCurrentTab('dashboard');
    } else {
      setAdminError('Invalid credentials. Use Username: Admin and Password: admin123');
    }
  };

  const renderDashboardContent = () => {
    // When in Doctor portal, delegate directly to DoctorDashboard
    if (activeRole === 'doctor') {
      return <DoctorDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
    }

    // When in Nurse portal, delegate directly to NurseDashboard
    if (activeRole === 'nurse') {
      return <NurseDashboard activeTab={currentTab} />;
    }

    // When Emergency Command Center is selected in sidebar, render EmergencyCommandCenter
    if (currentTab === 'command_center' || currentTab === 'command-center') {
      return <EmergencyCommandCenter onSelectTab={setCurrentTab} />;
    }

    // When Hospital Digital Twin & Simulation Lab is selected in sidebar, render HospitalDigitalTwinLab
    if (currentTab === 'simulation_lab' || currentTab === 'simulation-lab' || currentTab === 'digital-twin') {
      return <HospitalDigitalTwinLab onSelectTab={setCurrentTab} />;
    }

    // When Intelligent Hospital Workflow Automation is selected in sidebar, render WorkflowAutomationCenter
    if (currentTab === 'workflow_automation' || currentTab === 'workflows' || currentTab === 'workflow-automation') {
      return <WorkflowAutomationCenter onNavigateTab={setCurrentTab} activeRole="admin" />;
    }

    // When Predictive Intelligence is selected in sidebar, render PredictiveIntelligencePage
    if (currentTab === 'forecasting' || currentTab === 'predictive-intelligence') {
      return <PredictiveIntelligencePage onSelectTab={setCurrentTab} />;
    }

    // When Hospital Interoperability & Health Data Exchange is selected in sidebar, render InteroperabilityCenter
    if (currentTab === 'interoperability' || currentTab === 'health-data-exchange' || currentTab === 'data-exchange') {
      return <InteroperabilityCenter onSelectTab={setCurrentTab} />;
    }

    // When Bed Master Status is selected in sidebar, render BedManagementPage
    if (currentTab === 'beds') {
      return <BedManagementPage onSelectTab={setCurrentTab} />;
    }

    // When Clinical Wards is selected in sidebar, render ClinicalWardsPage
    if (currentTab === 'wards') {
      return (
        <ClinicalWardsPage 
          onSelectTab={(tab, wardFilter) => {
            setCurrentTab(tab);
            if (tab === 'beds') {
              window.location.hash = '#/hospital/beds';
            } else if (tab === 'resources') {
              window.location.hash = '#/hospital/resources';
            } else if (tab === 'departments') {
              window.location.hash = '#/hospital/departments';
            }
          }} 
        />
      );
    }

    // When Departments is selected in sidebar, render DepartmentsPage
    if (currentTab === 'departments') {
      return (
        <DepartmentsPage 
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.location.hash = '#/hospital/' + tab;
          }} 
        />
      );
    }

    // When Resource Registry is selected in sidebar, render ResourceRegistryPage
    if (currentTab === 'resources') {
      return <ResourceRegistryPage onSelectTab={setCurrentTab} />;
    }

    // When Equipment Telemetry is selected in sidebar, render EquipmentTelemetryPage
    if (currentTab === 'equipment') {
      return <EquipmentTelemetryPage onSelectTab={setCurrentTab} />;
    }

    // When Staff Verification is selected in sidebar, render StaffVerificationPage
    if (currentTab === 'staff') {
      return <StaffVerificationPage onSelectTab={setCurrentTab} />;
    }

    // When Resource Requests is selected in sidebar, render ResourceRequestsPage
    if (currentTab === 'requests' || currentTab === 'resource-requests') {
      return <ResourceRequestsPage onSelectTab={setCurrentTab} />;
    }

    // When Readiness Reports is selected in sidebar, render ReadinessReportsPage
    if (currentTab === 'reports' || currentTab === 'readiness-reports') {
      return <ReadinessReportsPage onSelectTab={setCurrentTab} />;
    }

    // When Hospital Settings is selected in sidebar, render HospitalSettingsPage
    if (currentTab === 'settings') {
      return <HospitalSettingsPage onSelectTab={setCurrentTab} />;
    }

    // When Patient Portal (பொதுமக்கள் பார்வை) is selected in sidebar or header
    if (currentTab === 'patient_portal') {
      return (
        <HospitalPatientPortalView
          hospital={currentHospital}
          onSelectTab={setCurrentTab}
        />
      );
    }

    switch (activeRole as string) {
      case 'overview':
        return (
          <HospitalOverviewView 
            onSelectRole={handleSelectPortal} 
            isAdminUnlocked={isAdminUnlocked} 
            activeTab={currentTab} 
          />
        );
      case 'doctor':
        return <DoctorDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
      case 'nurse':
        return <NurseDashboard activeTab={currentTab} />;
      case 'admin':
        return <AdminDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
      default:
        return (
          <HospitalOverviewView 
            onSelectRole={handleSelectPortal} 
            isAdminUnlocked={isAdminUnlocked} 
            activeTab={currentTab} 
          />
        );
    }
  };

  const getRoleSubtitle = () => {
    if (currentTab === 'patient_portal') {
      return 'Hospital Patient Portal — Manage live citizen OPD intake, allocate duty doctors, and monitor public transparency.';
    }

    if (activeRole === 'doctor') {
      const doctorSubtitles: Record<string, string> = {
        dashboard: 'Physician clinical workspace — emergency patient intake, bed readiness, and clinical requisitions.',
        patients: 'Comprehensive electronic medical records, digital twin telemetry, and journey milestones.',
        appointments: 'Outpatient clinics, scheduled patient reviews, and diagnostic consultations.',
        admissions: 'Triage arrivals awaiting bed allocation, attending intake orders, and clinical clearance.',
        wards: 'Inpatient wards capacity, nurse-to-patient staffing ratios, and clinical ward rounds.',
        digital_twin: 'Holistic clinical profile, dynamic physiological telemetry stream, and laboratory indices.',
        patient_monitoring: 'Continuous multi-patient bedside telemetry monitoring and vital trend surveillance.',
        lab_intelligence: 'Central laboratory diagnostic feed, automated panic alerts, and critical value acknowledgments.',
        digital_prescription: 'Electronic prescribing engine with integrated allergy and contraindication safety checks.',
        care_plan: 'Multidisciplinary care pathway, clinical recovery milestones, and step-down targets.',
        discharge_intelligence: 'Standardized 7-point readiness checklist preventing premature discharge and readmissions.',
        ai_assistant: 'Clinical reasoning engine with differential diagnostic support, lab explanations, and draft progress notes.',
        early_warning: 'Modified Early Warning System (MEWS) tracking acute physiological decompensation.',
        deterioration_radar: 'Automated 4-tier risk stratification radar identifying high-acuity deterioration.',
        smart_diagnosis: 'Evidence-based differential diagnosis matrix synthesizing signs, symptoms, and biomarkers.',
        medication_safety: 'Continuous prescription cross-referencing against contraindications and drug interactions.',
        ai_summarizer: 'Autonomous 9-point structured clinical case summary for handovers and EMR archiving.',
        treatment_response: 'Admission baseline vs. current physiological comparison tracking therapeutic efficacy.',
        decision_timeline: 'Clinical decision timeline tracking diagnostic milestones and interventions.',
        command_center: 'Real-time emergency command telemetry, triage matching, and coordinated live resus response.',
        simulation_lab: 'Hospital digital twin stress testing, emergency surge modeling, and resource buffer simulation.',
        workflow_automation: 'Intelligent hospital workflows, event-driven task routing, and clinical authorization gates.',
        forecasting: 'Operational capacity forecasts, projected bed occupancy, and critical shortage alerts.',
        requests: 'Clinical resource requisitions for ICU beds, mechanical ventilation, and emergency bays.',
        transfers: 'Inter-ward transfer coordination, step-down approvals, and bed booking.',
        emergency_alerts: 'Code Blue, rapid response triggers, and hospital critical emergency broadcasts.',
        emergency_matching: 'Live matching engine linking emergency triage patients with verified ready ICU beds and ventilators.',
        doctor_nurse_coord: 'Closed-loop physician-nurse order communications, observations, and execution timestamps.',
        referral_consult: 'Specialist opinion requests, inter-department referrals, and consultation notes.',
        clinical_handover: 'Structured SBAR shift handover protocol ensuring seamless continuity of care.',
        outbreak_detection: 'Spatial-temporal nosocomial cluster surveillance flagging hospital-acquired infections.',
        knowledge_hub: 'Institutional clinical guidelines, antibiotic stewardship algorithms, and medical calculators.',
        case_studies: 'Anonymized institutional clinical case archive and grand rounds library.',
        doctor_analytics: 'Physician performance metrics, inpatient census trends, and response time benchmarks.',
        audit_trail: 'HIPAA-compliant timestamped clinical action log and physician event audit.',
        profile: 'Physician credentials, medical council registration, and institutional on-call roster.',
        notifications: 'Real-time critical panic alerts, bed dock fulfillments, and shift updates.',
        settings: 'Clinical alert notification thresholds, telemetry refresh parameters, and safety preferences.'
      };
      const norm = (currentTab || '').replace(/-/g, '_');
      if (doctorSubtitles[norm]) return doctorSubtitles[norm];
      if (doctorSubtitles[currentTab]) return doctorSubtitles[currentTab];
      return 'Physician workspace — Emergency patient intake and clinical resource matching';
    }

    if (currentTab === 'command_center' || currentTab === 'command-center') {
      return 'Centralized acute emergency command telemetry, triage matching, and coordinated live resus response.';
    }
    if (currentTab === 'simulation_lab' || currentTab === 'simulation-lab' || currentTab === 'digital-twin') {
      return 'Digital twin operational modeling, hypothetical emergency stress tests, and resource reallocation simulation.';
    }
    if (currentTab === 'workflow_automation' || currentTab === 'workflows' || currentTab === 'workflow-automation') {
      return 'Automated clinical workflows, event-driven task routing, and administrative authorization gates.';
    }
    if (currentTab === 'forecasting' || currentTab === 'predictive-intelligence') {
      return 'Statistical demand forecasting, bed occupancy projections, and proactive resource shortage mitigation.';
    }
    if (currentTab === 'interoperability' || currentTab === 'health-data-exchange' || currentTab === 'data-exchange') {
      return 'HL7 FHIR R4 and ABDM standardized healthcare data exchange, duplicate patient detection, and secure external network integration.';
    }
    if (currentTab === 'beds') {
      return 'Monitor bed availability, occupancy, and operational readiness across hospital wards.';
    }
    if (currentTab === 'wards') {
      return 'Monitor ward capacity, patient occupancy, bed readiness, and clinical staff assignments.';
    }
    if (currentTab === 'departments') {
      return 'Specialty clinical divisions, ward mappings, physician heads, and institutional bed capacities.';
    }
    if (currentTab === 'resources') {
      return 'Institutional equipment, pharmaceutical reserves, and critical healthcare resources catalog.';
    }
    if (currentTab === 'equipment') {
      return 'Real-time telemetry, operational status, biomedical calibration, and device maintenance tracking.';
    }
    if (currentTab === 'staff') {
      return 'Review staff credentials, verify professional details, and manage hospital role access.';
    }
    if (currentTab === 'requests' || currentTab === 'resource-requests') {
      return 'Review clinical requisitions, manage department allocations, and coordinate resource fulfillment.';
    }
    if (currentTab === 'reports' || currentTab === 'readiness-reports') {
      return 'Hospital readiness intelligence, bed availability metrics, telemetry diagnostics, and operational blockers.';
    }
    if (currentTab === 'settings') {
      return 'Institutional credentials, resource threshold parameters, alert rules, and administrative preferences.';
    }
    switch (activeRole as string) {
      case 'overview':
        return 'Institutional facility command & operations overview';
      case 'doctor':
        return 'Physician workspace — Emergency patient intake and clinical resource matching';
      case 'nurse':
        return 'Ward operations — 6-stage bed turnover, sanitization, and equipment calibration';
      case 'admin':
      default:
        return 'Hospital command center — Live bed control, staff authorization, and equipment allocation';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1E293B] flex font-sans">
      {/* 
        ============================================================
        1. FIXED LEFT SIDEBAR
        Customized to active role (overview / doctor / nurse / admin)
        Includes dedicated Logout button at the bottom
        ============================================================
      */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (activeRole === 'doctor') {
            window.location.hash = `#/dashboard/doctor?tab=${tab}`;
            return;
          }
          if (activeRole === 'nurse') {
            window.location.hash = `#/dashboard/nurse?tab=${tab}`;
            return;
          }
          if ((activeRole as any) === 'patient' || user?.role === 'patient') {
            if (tab === 'find_hospitals') {
              window.location.hash = '#/patient-dashboard';
            } else {
              window.location.hash = '#/dashboard/patient';
            }
            return;
          }
          if (tab === 'beds') {
            window.location.hash = '#/hospital/beds';
          } else if (tab === 'wards') {
            window.location.hash = '#/hospital/wards';
          } else if (tab === 'departments') {
            window.location.hash = '#/hospital/departments';
          } else if (tab === 'resources') {
            window.location.hash = '#/hospital/resources';
          } else if (tab === 'equipment') {
            window.location.hash = '#/hospital/equipment';
          } else if (tab === 'staff') {
            window.location.hash = '#/hospital/staff';
          } else if (tab === 'requests' || tab === 'resource-requests') {
            window.location.hash = '#/hospital/resource-requests';
          } else if (tab === 'reports' || tab === 'readiness-reports') {
            window.location.hash = '#/hospital/readiness-reports';
          } else if (tab === 'settings') {
            window.location.hash = '#/hospital/settings';
          } else if (tab === 'patient_portal') {
            window.location.hash = '#/hospital/patient-portal';
          } else if (tab === 'dashboard') {
            window.location.hash = '#/hospital/overview';
          }
        }}
        activeRole={activeRole as UserRole}
      />

      {/* 
        ============================================================
        2. MAIN CONTENT AREA
        Unified single Header with 3 portals in line + Logout
        ============================================================
      */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={
            activeRole === 'doctor'
              ? (
                currentTab === 'dashboard' || currentTab === 'overview' ? 'Doctor Overview' :
                currentTab === 'patients' || currentTab === 'my_patients' ? 'My Patients' :
                currentTab === 'appointments' ? 'Appointments' :
                currentTab === 'wards' || currentTab === 'clinical_wards' ? 'Clinical Wards' :
                currentTab === 'admissions' || currentTab === 'pending_admissions' ? 'Pending Admissions' :
                currentTab === 'digital_twin' || currentTab === 'digital-twin' ? 'Patient Digital Twin' :
                currentTab === 'patient_monitoring' || currentTab === 'patient-monitoring' ? 'Patient Monitoring' :
                currentTab === 'lab_intelligence' || currentTab === 'lab-intelligence' ? 'Lab Intelligence' :
                currentTab === 'digital_prescription' || currentTab === 'digital-prescription' ? 'Digital Prescription' :
                currentTab === 'care_plan' || currentTab === 'care-plan' ? 'Care Plan' :
                currentTab === 'discharge_intelligence' || currentTab === 'discharge-intelligence' ? 'Discharge Intelligence' :
                currentTab === 'ai_assistant' || currentTab === 'ai-assistant' ? 'AI Clinical Assistant' :
                currentTab === 'early_warning' || currentTab === 'early-warning' ? 'Early Warning System' :
                currentTab === 'deterioration_radar' || currentTab === 'deterioration-radar' ? 'Patient Deterioration Radar' :
                currentTab === 'smart_diagnosis' || currentTab === 'smart-diagnosis' ? 'Smart Diagnosis Support' :
                currentTab === 'medication_safety' || currentTab === 'medication-safety' ? 'Medication Safety' :
                currentTab === 'ai_summarizer' || currentTab === 'ai-summarizer' ? 'AI Case Summarizer' :
                currentTab === 'treatment_response' || currentTab === 'treatment-response' ? 'Treatment Response Tracker' :
                currentTab === 'decision_timeline' || currentTab === 'decision-timeline' ? 'Clinical Decision Timeline' :
                currentTab === 'command_center' || currentTab === 'command-center' ? 'Emergency Command Center' :
                currentTab === 'simulation_lab' || currentTab === 'simulation-lab' ? 'Emergency Simulation Lab' :
                currentTab === 'workflow_automation' || currentTab === 'workflows' ? 'Clinical Workflows' :
                currentTab === 'forecasting' || currentTab === 'predictive-intelligence' ? 'Capacity Forecasting & Alerts' :
                currentTab === 'interoperability' || currentTab === 'health-data-exchange' ? 'Hospital Interoperability & Health Data Exchange' :
                currentTab === 'requests' || currentTab === 'resource-requests' ? 'Resource Requests' :
                currentTab === 'transfers' ? 'Inter-Ward Transfers' :
                currentTab === 'emergency_alerts' ? 'Emergency Alerts' :
                currentTab === 'emergency_matching' ? 'Emergency Patient Matching' :
                currentTab === 'doctor_nurse_coord' ? 'Doctor–Nurse Coordination' :
                currentTab === 'referral_consult' ? 'Referral & Specialist Consult' :
                currentTab === 'clinical_handover' ? 'Smart Clinical Handover' :
                currentTab === 'outbreak_detection' ? 'Outbreak Pattern Detection' :
                currentTab === 'knowledge_hub' ? 'Clinical Knowledge Hub' :
                currentTab === 'case_studies' ? 'Case Study Library' :
                currentTab === 'doctor_analytics' ? 'Doctor Analytics' :
                currentTab === 'audit_trail' ? 'Clinical Audit Trail' :
                currentTab === 'profile' ? 'Doctor Profile' :
                currentTab === 'notifications' ? 'Notifications' :
                currentTab === 'settings' ? 'Settings' :
                currentTab.toUpperCase()
              )
              : (
                currentTab === 'beds'
                  ? 'Bed Management'
                  : currentTab === 'wards'
                  ? 'Clinical Wards'
                  : currentTab === 'departments'
                  ? 'Departments'
                  : currentTab === 'resources'
                  ? 'Resource Registry'
                  : currentTab === 'equipment'
                  ? 'Equipment Telemetry'
                  : currentTab === 'staff'
                  ? 'Staff Verification'
                  : currentTab === 'requests' || currentTab === 'resource-requests'
                  ? 'Resource Requests'
                  : currentTab === 'reports' || currentTab === 'readiness-reports'
                  ? 'Readiness Reports'
                  : currentTab === 'settings'
                  ? 'Hospital Settings'
                  : currentTab === 'patient_portal'
                  ? 'Patient Portal — Appointments'
                  : activeRole === 'overview'
                  ? 'HOSPITAL DASHBOARD'
                  : currentTab === 'dashboard' 
                  ? `${activeRole.toUpperCase()} OVERVIEW` 
                  : currentTab.toUpperCase()
              )
          } 
          subtitle={getRoleSubtitle()} 
          activeRole={activeRole}
          onNavigateHome={() => { window.location.hash = '#/'; }}
          portalSwitcher={{
            activeRole: currentTab === 'patient_portal' ? 'overview' : activeRole,
            onSelectPortal: handleSelectPortal,
            isAdminUnlocked
          }}
        />

        {/* Rapid GPay-style success registration toast banner */}
        {showCelebration && (
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.8]" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>Hospital Registration Successful!</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/40 border border-emerald-300/40 text-white font-extrabold">
                    Facility Active
                  </span>
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>மருத்துவமனை பதிவு முடிந்தது &bull; <strong>{tempOnboarding.hospitalName || user?.hospitalName || 'Institutional Facility'}</strong></span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono font-black text-[11px]">
                    Hospital ID: {tempOnboarding.hospitalId || user?.hospitalId || sessionStorage.getItem('medisync_generated_hospital_id') || 'Hos_Id-345'}
                  </span>
                  <span>(Save this ID for Hospital Login &amp; Settings)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 cursor-pointer ml-3 shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {renderDashboardContent()}
        </main>
      </div>

      {/* 
        ============================================================
        3. HOSPITAL ADMIN LOGIN MODAL
        - Requires Username: Admin
        - Requires Password: admin123
        ============================================================
      */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-[#1E293B] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-slate-100 bg-linear-to-b from-blue-50/50 to-white">
              <button
                type="button"
                onClick={() => { setShowAdminLoginModal(false); setAdminError(null); }}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1A56DB] text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                    Restricted Access
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Hospital Admin Login
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter administrator credentials to unlock command control
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdminLoginSubmit} className="p-6 space-y-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                  autoFocus
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all font-medium"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Hint Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Configured Credentials:
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Username: <strong className="text-blue-700">Admin</strong></span>
                  <span>&bull;</span>
                  <span>Password: <strong className="text-blue-700">admin123</strong></span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdminLoginModal(false); setAdminError(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Verify & Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
