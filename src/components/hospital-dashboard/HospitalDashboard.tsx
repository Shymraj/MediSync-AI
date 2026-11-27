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
import { HospitalOverviewView } from './HospitalOverviewView';
import { UserRole } from '../../types';

export const HospitalDashboard: React.FC = () => {
  const { 
    user, 
    tempOnboarding
  } = useApp();

  // Active sub-portal within Hospital Dashboard: 'overview' (default) | 'doctor' | 'nurse' | 'admin'
  const [activeRole, setActiveRole] = useState<'overview' | 'doctor' | 'nurse' | 'admin'>('overview');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

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
        return <AdminDashboard activeTab={currentTab} />;
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
        onSelectTab={(tab) => setCurrentTab(tab)}
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
            activeRole === 'overview'
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
