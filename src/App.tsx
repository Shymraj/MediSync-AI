import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { ProfileSetupPage } from './components/onboarding/ProfileSetupPage';
import { DistrictSelectionPage } from './components/onboarding/DistrictSelectionPage';
import { HospitalSelectionPage } from './components/onboarding/HospitalSelectionPage';
import { RoleSelectionPage } from './components/onboarding/RoleSelectionPage';
import { RoleVerificationPage } from './components/onboarding/RoleVerificationPage';
import { DashboardLoading } from './components/common/DashboardLoading';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { NurseDashboard } from './components/dashboards/NurseDashboard';
import { PatientDashboard } from './components/dashboards/PatientDashboard';

export const AppContent: React.FC = () => {
  const { user, tempOnboarding, resetTempOnboarding, completeVerificationApproval } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // URL hash / path tracking
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      return hash.replace('#', '');
    }
    const path = window.location.pathname;
    return path;
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
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        setCurrentPath(hash.replace('#', ''));
      } else {
        setCurrentPath(window.location.pathname);
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

  // 1. ROOT LANDING PAGE:
  // Root URL ('/', '#/', or '') ALWAYS displays the MediSync AI Landing Page!
  const isRootRoute = currentPath === '/' || currentPath === '' || currentPath === '/landing';

  if (isRootRoute) {
    return (
      <LandingPage
        onGetStarted={() => {
          // Requirement 2: GET STARTED BUTTON BEHAVIOR:
          if (!user) {
            // New user / unauthenticated -> Google Authentication
            navigateTo('/auth');
          } else if (user.isOnboarded && user.roleVerificationStatus === 'approved') {
            // Completed approved returning user -> assigned dashboard directly
            navigateTo(`/dashboard/${user.role || 'admin'}`);
          } else if (user.roleVerificationStatus === 'pending') {
            // Pending returning user -> Access Pending
            navigateTo('/verification');
          } else {
            // Authenticated but incomplete onboarding -> start fresh from User Profile Setup!
            resetTempOnboarding();
            navigateTo('/profile');
          }
        }}
      />
    );
  }

  // 2. AUTHENTICATION ROUTE:
  if (currentPath === '/auth') {
    return (
      <AuthPage
        onBack={() => navigateTo('/')}
        onSuccess={() => {
          // Returning approved user:
          if (user?.isOnboarded && user?.roleVerificationStatus === 'approved') {
            navigateTo(`/dashboard/${user?.role || 'admin'}`);
          } else if (user?.roleVerificationStatus === 'pending') {
            navigateTo('/verification');
          } else {
            // New user or incomplete onboarding: start from User Profile Setup
            resetTempOnboarding();
            navigateTo('/profile');
          }
        }}
      />
    );
  }

  // 3. ROUTE GUARDS:
  // If not authenticated at all and trying to access internal routes, guide to auth
  if (!user) {
    return (
      <AuthPage
        onBack={() => navigateTo('/')}
        onSuccess={() => {
          navigateTo('/profile');
        }}
      />
    );
  }

  // 4. ONBOARDING SEQUENCE (Stateless temporary session until completed):

  // Step 1: User Profile Setup
  if (currentPath === '/profile') {
    return (
      <ProfileSetupPage 
        onComplete={() => navigateTo('/district')} 
        onBack={() => navigateTo('/auth')}
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

  // Step 3: Hospital Selection
  if (currentPath === '/hospital') {
    return (
      <HospitalSelectionPage 
        onComplete={() => navigateTo('/role')} 
        onBack={() => navigateTo('/district')} 
      />
    );
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
