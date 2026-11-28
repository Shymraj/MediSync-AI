import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { PortalSelectionPage } from './components/PortalSelectionPage';
import { AuthPage } from './components/AuthPage';
import { HospitalRegistrationDetailsPage } from './components/onboarding/HospitalRegistrationDetailsPage';
import { HospitalDashboard } from './components/hospital-dashboard';
import { DistrictSelectionPage } from './components/onboarding/DistrictSelectionPage';
import { HospitalLocationContactPage } from './components/onboarding/HospitalLocationContactPage';
import { RoleSelectionPage } from './components/onboarding/RoleSelectionPage';
import { RoleVerificationPage } from './components/onboarding/RoleVerificationPage';
import { DashboardLoading } from './components/common/DashboardLoading';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { NurseDashboard } from './components/dashboards/NurseDashboard';
import { PatientDashboard } from './components/dashboards/PatientDashboard';
import { MediSyncAdminLogin, MediSyncAdminDashboard } from './medisync-admin';
import { PatientLoginPage } from './components/patient/PatientLoginPage';
import { PatientPortalDashboard } from './components/patient-dashboard';

export const AppContent: React.FC = () => {
  const { user, tempOnboarding, resetTempOnboarding, completeVerificationApproval, logout } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // URL hash / path tracking (handles '#/route', '#route', and pathname)
  const getNormalizedRoute = () => {
    if (typeof window === 'undefined') return '/';
    const href = (window.location.href || '').toLowerCase();

    // Direct priority match if admin-login or medisync-admin is anywhere in URL
    if (href.includes('admin-login')) {
      return '/admin-login';
    }
    if (href.includes('medisync-admin')) {
      return '/medisync-admin';
    }

    const hash = window.location.hash;
    const cleanHash = hash ? hash.split('?')[0] : '';
    if (cleanHash && cleanHash.startsWith('#/')) {
      return cleanHash.replace('#', '');
    }
    if (cleanHash && cleanHash.startsWith('#')) {
      return '/' + cleanHash.replace('#', '');
    }
    const path = window.location.pathname;
    return path;
  };

  const [currentPath, setCurrentPath] = useState<string>(getNormalizedRoute);

  const [selectedPortal, setSelectedPortal] = useState<'hospital' | 'patient'>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('patient')) return 'patient';
    return 'hospital';
  });

  // Strict Page Refresh Reset for Incomplete Onboarding (Requirement 5)
  // When user is on any incomplete onboarding screen and refreshes the browser,
  // reset temporary selections and reset route to Profile Setup.
  useEffect(() => {
    const hash = window.location.hash;
    const currentRoute = hash && hash.startsWith('#/') ? hash.replace('#', '') : window.location.pathname;

    const onboardingRoutes = ['/district', '/hospital', '/role', '/verification'];
    if (onboardingRoutes.includes(currentRoute)) {
      if (!user || !user.isOnboarded) {
        // User is uncompleted / in-progress -> reset onboarding to Profile Setup!
        resetTempOnboarding();
        window.location.hash = '#/profile';
        setCurrentPath('/profile');
      }
    }
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams((window.location.hash.split('?')[1] || ''));
    const queryTab = hashParams.get('tab');
    if (queryTab) {
      setCurrentTab(queryTab);
    }

    const handlePopState = () => {
      setCurrentPath(getNormalizedRoute());
      const updatedHashParams = new URLSearchParams((window.location.hash.split('?')[1] || ''));
      const updatedQueryTab = updatedHashParams.get('tab');
      if (updatedQueryTab) {
        setCurrentTab(updatedQueryTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = '#' + path;
    setCurrentPath(path);
  };

  const isAuthRoute = currentPath === '/auth' || currentPath.startsWith('/auth/');
  const activeAuthPortal: 'hospital' | 'patient' = currentPath.includes('patient') ? 'patient' : selectedPortal;

  // 0. MEDISYNC SUPER ADMIN ROUTES:
  // Access via URL '#/admin-login', 'admin-login', etc.
  // Credentials: Username: medisync, Password: medisync123
  if (currentPath === '/admin-login' || currentPath === 'admin-login' || currentPath.includes('admin-login')) {
    return (
      <MediSyncAdminLogin
        onLoginSuccess={() => navigateTo('/medisync-admin')}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  if (currentPath === '/medisync-admin' || currentPath === 'medisync-admin' || currentPath.includes('medisync-admin')) {
    return (
      <MediSyncAdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('medisync_super_admin_session');
          navigateTo('/');
        }}
      />
    );
  }

  // 1. ROOT LANDING PAGE:
  // Root URL ('/', '#/', or '') ALWAYS displays the MediSync AI Landing Page!
  const isRootRoute = currentPath === '/' || currentPath === '' || currentPath === '/landing';

  if (isRootRoute) {
    return (
      <LandingPage
        onGetStarted={() => {
          // User clicks Get Started -> navigate directly to Portal Selection screen!
          navigateTo('/portal-select');
        }}
        onSelectPortal={(portal: 'hospital' | 'patient') => {
          setSelectedPortal(portal);
          if (portal === 'patient') {
            navigateTo('/auth/patient');
          } else {
            navigateTo('/auth/hospital');
          }
        }}
      />
    );
  }

  // 2. PORTAL SELECTION ROUTE:
  // Right after clicking Get Started: Hospital Registration (Top) and Patient Portal (Bottom)
  if (currentPath === '/portal-select') {
    return (
      <PortalSelectionPage
        onSelectHospital={() => {
          setSelectedPortal('hospital');
          // Hospital Registration: Always go to Google verification first, then the 5 onboarding flows!
          navigateTo('/auth/hospital');
        }}
        onHospitalLoginSuccess={() => {
          setSelectedPortal('hospital');
          navigateTo('/hospital-dashboard');
        }}
        onSelectPatient={() => {
          setSelectedPortal('patient');
          if (user?.role === 'patient') {
            navigateTo('/dashboard/patient');
          } else {
            navigateTo('/auth/patient');
          }
        }}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  // 3. AUTHENTICATION ROUTE (Hospital Staff or Patient Portal):
  if (isAuthRoute) {
    // Dedicated Patient Portal Login matching user's custom design (Google login + Email)
    if (activeAuthPortal === 'patient' || currentPath === '/auth/patient' || currentPath.includes('patient')) {
      return (
        <PatientLoginPage
          onBack={() => navigateTo('/portal-select')}
          onSuccess={() => navigateTo('/dashboard/patient')}
        />
      );
    }

    return (
      <AuthPage
        portal={activeAuthPortal}
        onBack={() => navigateTo('/portal-select')}
        onSuccess={() => {
          // Hospital Registration: Google verify panitu antha 5 flows varanum!
          // Step 1: /profile -> Step 2: /district -> Step 3: /hospital -> Step 4: /role -> Step 5: /verification
          resetTempOnboarding();
          navigateTo('/profile');
        }}
      />
    );
  }

  // 3. ROUTE GUARDS:
  // If not authenticated at all and trying to access internal routes, guide to auth
  if (!user) {
    if (activeAuthPortal === 'patient' || currentPath.includes('patient')) {
      return (
        <PatientLoginPage
          onBack={() => navigateTo('/portal-select')}
          onSuccess={() => navigateTo('/dashboard/patient')}
        />
      );
    }

    return (
      <AuthPage
        portal={activeAuthPortal}
        onBack={() => navigateTo('/')}
        onSuccess={() => {
          navigateTo('/profile');
        }}
      />
    );
  }

  // Guard: Patients do NOT need staff onboarding sequence -> redirect directly to Patient Dashboard
  if (user && (user as any).role === 'patient' && ['/profile', '/district', '/hospital', '/role', '/verification', '/hospital/beds', '/hospital/wards', '/hospital/departments'].includes(currentPath)) {
    navigateTo('/dashboard/patient');
    return null;
  }

  // 4. ONBOARDING SEQUENCE (Stateless temporary session until completed):

  // Step 1: User Profile Setup
  if (currentPath === '/profile') {
    return (
      <HospitalRegistrationDetailsPage 
        onComplete={() => navigateTo('/district')} 
        onBack={() => navigateTo('/auth/hospital')}
      />
    );
  }

  // Step 2: District Selection
  if (currentPath === '/district') {
    return (
      <DistrictSelectionPage 
        onComplete={() => navigateTo('/hospital')} 
        onBack={() => navigateTo('/profile')} 
      />
    );
  }

  // Step 3: Hospital Details (Location & Contact Information)
  if (currentPath === '/hospital' || currentPath === '/hospital-details-contact') {
    return (
      <HospitalLocationContactPage 
        onComplete={() => navigateTo('/hospital-dashboard')} 
        onBack={() => navigateTo('/district')} 
      />
    );
  }

  // Hospital Dashboard Routes (Directly entered after Register Hospital or via Bed Management / Wards navigation)
  if (
    currentPath === '/hospital-dashboard' || 
    currentPath === '/hospital/patient-portal' || 
    currentPath === '/hospital/patient' || 
    currentPath === '/hospital/beds' || 
    currentPath === '/hospital/wards' || 
    currentPath === '/hospital/departments' || 
    currentPath === '/hospital/resources' || 
    currentPath === '/hospital/equipment' || 
    currentPath === '/hospital/staff' || 
    currentPath === '/hospital/requests' || 
    currentPath === '/hospital/resource-requests' || 
    currentPath === '/hospital/reports' || 
    currentPath === '/hospital/readiness-reports' || 
    currentPath === '/hospital/settings' || 
    currentPath === '/hospital/command-center' ||
    currentPath === '/command-center' ||
    currentPath === '/emergency' ||
    currentPath === '/hospital/simulation-lab' ||
    currentPath === '/dashboard/simulation-lab' ||
    currentPath === '/hospital/digital-twin' ||
    currentPath === '/dashboard/digital-twin' ||
    currentPath === '/hospital/workflows' ||
    currentPath === '/dashboard/workflows' ||
    currentPath === '/hospital/workflow-automation' ||
    currentPath === '/workflows' ||
    currentPath === '/hospital/forecasting' ||
    currentPath === '/dashboard/forecasting' ||
    currentPath === '/hospital/predictive-intelligence' ||
    currentPath === '/hospital/interoperability' ||
    currentPath === '/dashboard/interoperability' ||
    currentPath === '/interoperability' ||
    currentPath === '/health-data-exchange' ||
    currentPath === '/hospital/overview'
  ) {
    const initialTab = (currentPath === '/hospital/patient-portal' || currentPath === '/hospital/patient')
      ? 'patient_portal'
      : currentPath === '/hospital/beds' 
      ? 'beds' 
      : currentPath === '/hospital/wards' 
      ? 'wards' 
      : currentPath === '/hospital/departments'
      ? 'departments'
      : currentPath === '/hospital/resources'
      ? 'resources'
      : currentPath === '/hospital/equipment'
      ? 'equipment'
      : currentPath === '/hospital/staff'
      ? 'staff'
      : (currentPath === '/hospital/requests' || currentPath === '/hospital/resource-requests')
      ? 'requests'
      : (currentPath === '/hospital/reports' || currentPath === '/hospital/readiness-reports')
      ? 'reports'
      : currentPath === '/hospital/settings'
      ? 'settings'
      : (currentPath === '/hospital/command-center' || currentPath === '/command-center' || currentPath === '/emergency')
      ? 'command_center'
      : (currentPath === '/hospital/simulation-lab' || currentPath === '/dashboard/simulation-lab' || currentPath === '/hospital/digital-twin' || currentPath === '/dashboard/digital-twin')
      ? 'simulation_lab'
      : (currentPath === '/hospital/workflows' || currentPath === '/dashboard/workflows' || currentPath === '/hospital/workflow-automation' || currentPath === '/workflows')
      ? 'workflow_automation'
      : (currentPath === '/hospital/forecasting' || currentPath === '/dashboard/forecasting' || currentPath === '/hospital/predictive-intelligence')
      ? 'forecasting'
      : (currentPath === '/hospital/interoperability' || currentPath === '/dashboard/interoperability' || currentPath === '/interoperability' || currentPath === '/health-data-exchange')
      ? 'interoperability'
      : 'dashboard';
    return <HospitalDashboard initialTab={initialTab} />;
  }

  // Step 4: Role Selection
  if (currentPath === '/role') {
    return (
      <RoleSelectionPage 
        onComplete={() => navigateTo('/verification')} 
        onBack={() => navigateTo('/hospital')} 
      />
    );
  }

  // Step 5: Credential & Role Verification
  if (currentPath === '/verification') {
    return (
      <RoleVerificationPage
        onApproved={() => {
          setIsLoadingDashboard(true);
        }}
        onBack={() => navigateTo('/role')}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  // Step 6: Dashboard Loading Transition
  if (isLoadingDashboard) {
    return (
      <DashboardLoading
        roleName={user?.role || tempOnboarding.role || 'Staff'}
        hospitalName={user?.hospitalName || tempOnboarding.hospitalName || 'Institutional Hospital'}
        onFinished={() => {
          setIsLoadingDashboard(false);
          const targetRole = user?.role || tempOnboarding.role || 'admin';
          navigateTo(`/dashboard/${targetRole}`);
        }}
      />
    );
  }

  // Dedicated Patient Care Dashboard Route (Find out Hospital, OPD Tokens, Emergency SOS)
  if (
    currentPath === '/patient-dashboard' ||
    currentPath === '/dashboard/patient' ||
    (user && (user as any).role === 'patient' && (currentPath.startsWith('/dashboard') || currentPath === '/patient-dashboard'))
  ) {
    return (
      <PatientPortalDashboard
        onLogout={() => {
          logout();
          navigateTo('/portal-select');
        }}
        onBackHome={() => navigateTo('/')}
      />
    );
  }

  // Step 7: Role-Based Dashboard (handles /dashboard, /dashboard/:role, /hospital/beds, /hospital/wards, /hospital/departments, /hospital/resources, /hospital/equipment, and /hospital/staff)
  const isHospitalBedsRoute = currentPath === '/hospital/beds' || currentPath === '/dashboard/beds';
  const isHospitalWardsRoute = currentPath === '/hospital/wards' || currentPath === '/dashboard/wards';
  const isHospitalDepartmentsRoute = currentPath === '/hospital/departments' || currentPath === '/dashboard/departments';
  const isHospitalResourcesRoute = currentPath === '/hospital/resources' || currentPath === '/dashboard/resources';
  const isHospitalEquipmentRoute = currentPath === '/hospital/equipment' || currentPath === '/dashboard/equipment';
  const isHospitalStaffRoute = currentPath === '/hospital/staff' || currentPath === '/dashboard/staff';
  const isHospitalRequestsRoute = 
    currentPath === '/hospital/resource-requests' || 
    currentPath === '/hospital/requests' || 
    currentPath === '/dashboard/resource-requests' || 
    currentPath === '/dashboard/requests';
  const isHospitalReportsRoute = 
    currentPath === '/hospital/readiness-reports' || 
    currentPath === '/hospital/reports' || 
    currentPath === '/dashboard/readiness-reports' || 
    currentPath === '/dashboard/reports';
  const isHospitalSettingsRoute = currentPath === '/hospital/settings' || currentPath === '/dashboard/settings';
  const isHospitalCommandCenterRoute = 
    currentPath === '/hospital/command-center' || 
    currentPath === '/dashboard/command-center' ||
    currentPath === '/hospital/emergency' ||
    currentPath === '/dashboard/emergency';
  const isHospitalSimulationLabRoute = 
    currentPath === '/hospital/simulation-lab' || 
    currentPath === '/dashboard/simulation-lab' ||
    currentPath === '/hospital/digital-twin' || 
    currentPath === '/dashboard/digital-twin';
  const isHospitalWorkflowsRoute =
    currentPath === '/hospital/workflows' ||
    currentPath === '/dashboard/workflows' ||
    currentPath === '/hospital/workflow-automation' ||
    currentPath === '/workflows';
  const isHospitalForecastingRoute = 
    currentPath === '/hospital/forecasting' || 
    currentPath === '/dashboard/forecasting' ||
    currentPath === '/hospital/predictive-intelligence' ||
    currentPath === '/dashboard/predictive-intelligence';
  const isHospitalInteropRoute =
    currentPath === '/hospital/interoperability' ||
    currentPath === '/dashboard/interoperability' ||
    currentPath === '/interoperability' ||
    currentPath === '/health-data-exchange';
  const isDashboardRoute = currentPath === '/dashboard' || 
                           currentPath.startsWith('/dashboard/') || 
                           currentPath.startsWith('/hospital/') ||
                           currentPath === '/doctor' ||
                           currentPath.startsWith('/doctor/');

  if (isDashboardRoute) {
    // Check if user is explicitly rejected
    if (user && user.roleVerificationStatus === 'rejected') {
      // Prevent unauthorized dashboard access
      return (
        <RoleVerificationPage
          onApproved={() => {
            setIsLoadingDashboard(true);
          }}
          onBack={() => navigateTo('/role')}
          onBackToHome={() => navigateTo('/')}
        />
      );
    }

    // Determine target role from URL or user profile
    const pathParts = currentPath.split('/');
    const urlRole = pathParts[2] as any;
    const activeRole: any = (urlRole && ['admin', 'doctor', 'nurse', 'patient'].includes(urlRole))
      ? urlRole
      : (currentPath.startsWith('/doctor') ? 'doctor' : (user?.role || 'admin'));

    let effectiveTab = currentTab;
    if (activeRole === 'doctor') {
      const hashParams = typeof window !== 'undefined' ? new URLSearchParams((window.location.hash.split('?')[1] || '')) : null;
      const queryTab = hashParams?.get('tab');
      if (queryTab) {
        effectiveTab = queryTab;
      } else if (currentPath.startsWith('/doctor/')) {
        const subRoute = currentPath.replace('/doctor/', '').replace(/-/g, '_');
        effectiveTab = subRoute || 'dashboard';
      } else {
        effectiveTab = currentTab || 'dashboard';
      }
    } else {
      effectiveTab = isHospitalSimulationLabRoute
        ? 'simulation_lab'
        : isHospitalWorkflowsRoute
        ? 'workflow_automation'
        : isHospitalForecastingRoute
        ? 'forecasting'
        : isHospitalInteropRoute
        ? 'interoperability'
        : isHospitalCommandCenterRoute
        ? 'command_center'
        : isHospitalBedsRoute 
        ? 'beds' 
        : isHospitalWardsRoute 
        ? 'wards' 
        : isHospitalDepartmentsRoute 
        ? 'departments' 
        : isHospitalResourcesRoute 
        ? 'resources' 
        : isHospitalEquipmentRoute 
        ? 'equipment' 
        : isHospitalStaffRoute 
        ? 'staff' 
        : isHospitalRequestsRoute
        ? 'requests'
        : isHospitalReportsRoute
        ? 'reports'
        : isHospitalSettingsRoute
        ? 'settings'
        : currentTab;
    }

    const renderDashboardByRole = () => {
      switch (activeRole) {
        case 'admin':
          return <AdminDashboard activeTab={effectiveTab} onSelectTab={setCurrentTab} />;
        case 'doctor':
          return <DoctorDashboard activeTab={effectiveTab} onSelectTab={setCurrentTab} />;
        case 'nurse':
          return <NurseDashboard activeTab={effectiveTab} />;
        case 'patient':
          return <PatientDashboard activeTab={effectiveTab} onSelectTab={setCurrentTab} />;
        default:
          return <AdminDashboard activeTab={effectiveTab} onSelectTab={setCurrentTab} />;
      }
    };

    const getDashboardSubtitle = () => {
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
          decision_timeline: 'Chronological audit of diagnostic milestones, clinical orders, and therapeutic interventions.',
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
        if (doctorSubtitles[effectiveTab]) {
          return doctorSubtitles[effectiveTab];
        }
      }

      if (effectiveTab === 'beds') {
        return 'Monitor bed availability, occupancy, and operational readiness across hospital wards.';
      }
      if (effectiveTab === 'wards') {
        return 'Monitor ward capacity, patient occupancy, bed readiness, and clinical staff assignments.';
      }
      if (effectiveTab === 'departments') {
        return 'Specialty clinical divisions, ward mappings, physician heads, and institutional bed capacities.';
      }
      if (effectiveTab === 'resources') {
        return 'Institutional equipment, pharmaceutical reserves, and critical healthcare resources catalog.';
      }
      if (effectiveTab === 'equipment') {
        return 'Real-time telemetry, operational status, biomedical calibration, and device maintenance tracking.';
      }
      if (effectiveTab === 'staff') {
        return 'Review staff credentials, verify professional details, and manage hospital role access.';
      }
      if (effectiveTab === 'requests' || effectiveTab === 'resource-requests') {
        return 'Review clinical requisitions, manage department allocations, and coordinate resource fulfillment.';
      }
      if (effectiveTab === 'reports' || effectiveTab === 'readiness-reports') {
        return 'Hospital readiness intelligence, bed availability metrics, telemetry diagnostics, and operational blockers.';
      }
      if (effectiveTab === 'settings') {
        return 'Institutional credentials, resource threshold parameters, alert rules, and administrative preferences.';
      }
      switch (activeRole) {
        case 'admin':
          return 'Hospital command center — Live bed control, staff authorization, and equipment allocation';
        case 'doctor':
          return 'Physician workspace — Emergency patient intake and clinical resource matching';
        case 'nurse':
          return 'Ward operations — 6-stage bed turnover, sanitization, and equipment calibration';
        case 'patient':
          return 'Patient portal — Verified hospital operational readiness, appointments, and token status';
        default:
          return 'Healthcare resource operations';
      }
    };

    const getHeaderTitle = () => {
      if (activeRole === 'doctor') {
        const doctorTitles: Record<string, string> = {
          dashboard: 'Doctor Overview',
          overview: 'Doctor Overview',
          doctor_overview: 'Doctor Overview',
          patients: 'My Patients',
          my_patients: 'My Patients',
          appointments: 'Appointments',
          admissions: 'Pending Admissions',
          wards: 'Clinical Wards',
          digital_twin: 'Patient Digital Twin',
          patient_monitoring: 'Patient Monitoring',
          lab_intelligence: 'Lab Intelligence',
          digital_prescription: 'Digital Prescription',
          care_plan: 'Care Plan',
          discharge_intelligence: 'Discharge Intelligence',
          ai_assistant: 'AI Clinical Assistant',
          early_warning: 'Early Warning System',
          deterioration_radar: 'Patient Deterioration Radar',
          smart_diagnosis: 'Smart Diagnosis Support',
          medication_safety: 'Medication Safety',
          ai_summarizer: 'AI Case Summarizer',
          treatment_response: 'Treatment Response Tracker',
          decision_timeline: 'Clinical Decision Timeline',
          command_center: 'Emergency Command Center',
          simulation_lab: 'Emergency Simulation Lab',
          workflow_automation: 'Clinical Workflows',
          forecasting: 'Capacity Forecasting & Alerts',
          requests: 'Resource Requests',
          'resource-requests': 'Resource Requests',
          transfers: 'Inter-Ward Transfers',
          interoperability: 'Hospital Interoperability & Health Data Exchange',
          emergency_alerts: 'Emergency Alerts',
          emergency_matching: 'Emergency Patient Matching',
          doctor_nurse_coord: 'Doctor–Nurse Coordination',
          referral_consult: 'Referral & Specialist Consult',
          clinical_handover: 'Smart Clinical Handover',
          outbreak_detection: 'Outbreak Pattern Detection',
          knowledge_hub: 'Clinical Knowledge Hub',
          case_studies: 'Case Study Library',
          doctor_analytics: 'Doctor Analytics',
          audit_trail: 'Clinical Audit Trail',
          profile: 'Doctor Profile',
          notifications: 'Notifications',
          settings: 'Settings'
        };
        const norm = (effectiveTab || '').replace(/-/g, '_');
        if (doctorTitles[norm]) {
          return doctorTitles[norm];
        }
        if (doctorTitles[effectiveTab]) {
          return doctorTitles[effectiveTab];
        }
      }

      return effectiveTab === 'beds'
        ? 'Bed Management'
        : effectiveTab === 'wards'
        ? 'Clinical Wards'
        : effectiveTab === 'departments'
        ? 'Departments'
        : effectiveTab === 'resources'
        ? 'Resource Registry'
        : effectiveTab === 'equipment'
        ? 'Equipment Telemetry'
        : effectiveTab === 'staff'
        ? 'Staff Verification'
        : effectiveTab === 'requests' || effectiveTab === 'resource-requests'
        ? 'Resource Requests'
        : effectiveTab === 'reports' || effectiveTab === 'readiness-reports'
        ? 'Readiness Reports'
        : effectiveTab === 'settings'
        ? 'Hospital Settings'
        : effectiveTab === 'interoperability' || effectiveTab === 'health-data-exchange'
        ? 'Hospital Interoperability & Health Data Exchange'
        : effectiveTab === 'dashboard' 
        ? `${activeRole.toUpperCase()} OVERVIEW` 
        : effectiveTab.toUpperCase();
    };

    return (
      <div className={`flex text-[#1E293B] ${activeRole === 'patient' ? 'h-screen overflow-hidden bg-[#FFF8F3]' : 'min-h-screen bg-[#F5F7FA]'}`}>
        {/* Fixed Left Sidebar */}
        <Sidebar 
          currentTab={effectiveTab} 
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
            if (activeRole === 'patient') {
              setCurrentTab(tab);
              if (tab === 'find_hospitals' || tab === 'hospital_search') {
                navigateTo('/patient-dashboard');
              } else {
                navigateTo('/dashboard/patient');
              }
              return;
            }
            if (tab === 'beds') {
              navigateTo('/hospital/beds');
            } else if (tab === 'wards') {
              navigateTo('/hospital/wards');
            } else if (tab === 'departments') {
              navigateTo('/hospital/departments');
            } else if (tab === 'resources') {
              navigateTo('/hospital/resources');
            } else if (tab === 'equipment') {
              navigateTo('/hospital/equipment');
            } else if (tab === 'staff') {
              navigateTo('/hospital/staff');
            } else if (tab === 'requests' || tab === 'resource-requests') {
              navigateTo('/hospital/resource-requests');
            } else if (tab === 'reports' || tab === 'readiness-reports') {
              navigateTo('/hospital/readiness-reports');
            } else if (tab === 'settings') {
              navigateTo('/hospital/settings');
            } else if (tab === 'dashboard') {
              navigateTo('/hospital/overview');
            }
          }} 
          activeRole={activeRole}
        />

        {/* Main Layout */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeRole === 'patient' ? 'h-screen overflow-hidden' : ''}`}>
          <Header 
            title={getHeaderTitle()} 
            subtitle={getDashboardSubtitle()} 
            activeRole={activeRole}
            onNavigateHome={() => navigateTo('/')}
          />
          <main className="flex-1 p-6 overflow-y-auto">
            {renderDashboardByRole()}
          </main>
        </div>
      </div>
    );
  }

  // Default fallback: show landing page
  return <LandingPage onGetStarted={() => navigateTo('/auth')} />;
};

export default function App() {
  return <AppContent />;
}
