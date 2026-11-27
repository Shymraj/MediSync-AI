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
    if (hash && hash.startsWith('#/')) {
      return hash.replace('#', '');
    }
    if (hash && hash.startsWith('#')) {
      return '/' + hash.replace('#', '');
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
    const handlePopState = () => {
      setCurrentPath(getNormalizedRoute());
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
  if (user && (user as any).role === 'patient' && ['/profile', '/district', '/hospital', '/role', '/verification'].includes(currentPath)) {
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

  // Hospital Dashboard Route (Directly entered after Register Hospital)
  if (currentPath === '/hospital-dashboard') {
    return <HospitalDashboard />;
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

  // Step 7: Role-Based Dashboard (handles /dashboard and /dashboard/:role)
  if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard/')) {
    // Check if user is approved for dashboard access
    if (!user.isOnboarded || user.roleVerificationStatus !== 'approved') {
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
      : (user.role || 'admin');

    const renderDashboardByRole = () => {
      switch (activeRole) {
        case 'admin':
          return <AdminDashboard activeTab={currentTab} />;
        case 'doctor':
          return <DoctorDashboard activeTab={currentTab} />;
        case 'nurse':
          return <NurseDashboard activeTab={currentTab} />;
        case 'patient':
          return <PatientDashboard activeTab={currentTab} />;
        default:
          return <AdminDashboard activeTab={currentTab} />;
      }
    };

    const getDashboardSubtitle = () => {
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

    return (
      <div className="min-h-screen bg-[#F5F7FA] flex text-[#1E293B]">
        {/* Fixed Left Sidebar */}
        <Sidebar 
          currentTab={currentTab} 
          onSelectTab={(tab) => setCurrentTab(tab)} 
          activeRole={activeRole}
        />

        {/* Main Layout */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            title={
              currentTab === 'dashboard' 
                ? `${activeRole.toUpperCase()} OVERVIEW` 
                : currentTab.toUpperCase()
            } 
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
