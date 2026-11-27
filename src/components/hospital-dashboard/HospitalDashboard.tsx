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
import { HospitalOverviewView } from './HospitalOverviewView';
import { UserRole } from '../../types';

interface HospitalDashboardProps {
  initialTab?: string;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ initialTab }) => {
  const { 
    user, 
    tempOnboarding
  } = useApp();

  // Active sub-portal within Hospital Dashboard: 'overview' (default) | 'doctor' | 'nurse' | 'admin'
  const [activeRole, setActiveRole] = useState<'overview' | 'doctor' | 'nurse' | 'admin'>('overview');
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    const hash = window.location.hash;
    if (hash === '#/hospital/beds') return 'beds';
    if (hash === '#/hospital/wards') return 'wards';
    if (hash === '#/hospital/departments') return 'departments';
    if (hash === '#/hospital/resources') return 'resources';
    if (hash === '#/hospital/equipment') return 'equipment';
    if (hash === '#/hospital/staff') return 'staff';
    if (hash === '#/hospital/resource-requests' || hash === '#/hospital/requests') return 'requests';
    if (hash === '#/hospital/readiness-reports' || hash === '#/hospital/reports') return 'reports';
    if (hash === '#/hospital/settings') return 'settings';
    return 'dashboard';
  });

  // Sync tab with URL hash
  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash;
      if (hash === '#/hospital/beds') {
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

  // Handle portal switching
  const handleSelectPortal = (targetRole: 'overview' | 'doctor' | 'nurse' | 'admin') => {
    if (targetRole === 'admin') {
      if (isAdminUnlocked) {
        setActiveRole('admin');
        setCurrentTab('dashboard');
      } else {
        // Prompt for Admin credentials (Username: Admin, Password: admin123)
        setAdminError(null);
        setShowAdminLoginModal(true);
      }
    } else {
      setActiveRole(targetRole);
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

    switch (activeRole) {
      case 'overview':
        return (
          <HospitalOverviewView 
            onSelectRole={handleSelectPortal} 
            isAdminUnlocked={isAdminUnlocked} 
            activeTab={currentTab} 
          />
        );
      case 'doctor':
        return <DoctorDashboard activeTab={currentTab} />;
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
    switch (activeRole) {
      case 'overview':
        return 'Institutional facility command & operations overview';
      case 'doctor':
        return 'Physician workspace — Emergency patient intake and clinical resource matching';
      case 'nurse':
        return 'Ward operations — 6-stage bed turnover, sanitization, and equipment calibration';
      case 'admin':
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
              : activeRole === 'overview'
              ? 'HOSPITAL DASHBOARD'
              : currentTab === 'dashboard' 
              ? `${activeRole.toUpperCase()} OVERVIEW` 
              : currentTab.toUpperCase()
          } 
          subtitle={getRoleSubtitle()} 
          activeRole={activeRole}
          onNavigateHome={() => { window.location.hash = '#/'; }}
          portalSwitcher={{
            activeRole,
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
                <div className="text-[11px] text-emerald-100 mt-0.5">
                  மருத்துவமனை பதிவு முடிந்தது &bull; {tempOnboarding.hospitalName || user?.hospitalName || 'Institutional Facility'} verified and active in MediSync network.
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
