import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  Stethoscope, 
  HeartHandshake, 
  Home,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  PhoneCall,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmergencyWorkflowController } from '../common/EmergencyWorkflowController';
import { RealtimeConnectionIndicator } from '../common/RealtimeConnectionIndicator';
import { RealtimeEmergencyBanner } from '../common/RealtimeEmergencyBanner';

export interface PortalSwitcherConfig {
  activeRole: 'overview' | 'doctor' | 'nurse' | 'admin' | string;
  onSelectPortal: (role: 'overview' | 'doctor' | 'nurse' | 'admin') => void;
  isAdminUnlocked: boolean;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  activeRole?: string;
  children?: React.ReactNode;
  onNavigateHome?: () => void;
  portalSwitcher?: PortalSwitcherConfig;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  activeRole, 
  onNavigateHome,
  portalSwitcher
}) => {
  const { user, logout, notifications, markNotificationAsRead, clearAllNotifications, setUser, tempOnboarding } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [showEmergencyScenarioModal, setShowEmergencyScenarioModal] = useState(false);

  // Fallback internal admin authentication if portalSwitcher is not supplied
  const [localAdminUnlocked, setLocalAdminUnlocked] = useState(false);
  const [showLocalAdminModal, setShowLocalAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('Admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const displayRole = activeRole || user?.role || 'admin';
  const unreadCount = notifications.filter(n => !n.read).length;
  const isPatient = displayRole === 'patient';

  // Effective admin unlocked status
  const effectiveAdminUnlocked = portalSwitcher 
    ? portalSwitcher.isAdminUnlocked 
    : localAdminUnlocked;

  const handlePortalClick = (targetRole: 'overview' | 'doctor' | 'nurse' | 'admin') => {
    if (portalSwitcher) {
      portalSwitcher.onSelectPortal(targetRole);
      return;
    }

    if (targetRole === 'overview') {
      window.location.hash = '#/hospital-dashboard';
      return;
    }

    // Fallback behavior when portalSwitcher prop is not directly supplied
    if (targetRole === 'admin') {
      if (localAdminUnlocked) {
        if (user) {
          setUser({ ...user, role: 'admin' });
          window.location.hash = '#/dashboard/admin';
        }
      } else {
        setAdminError(null);
        setShowLocalAdminModal(true);
      }
    } else {
      if (user) {
        setUser({ ...user, role: targetRole });
        window.location.hash = `#/dashboard/${targetRole}`;
      }
    }
  };

  const handleLocalAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = adminUsername.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (cleanUsername === 'admin' && cleanPassword === 'admin123') {
      setLocalAdminUnlocked(true);
      setShowLocalAdminModal(false);
      setAdminError(null);
      setAdminPassword('');
      if (user) {
        setUser({ ...user, role: 'admin' });
        window.location.hash = '#/dashboard/admin';
      }
    } else {
      setAdminError('Invalid credentials. Use Username: Admin and Password: admin123');
    }
  };

  const handleLogout = () => {
    logout();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.hash = '#/';
    }
  };

  const activePortalRole = portalSwitcher ? portalSwitcher.activeRole : displayRole;
  const emergencyPhone = tempOnboarding.emergencyContact || '044-25305112';

  return (
    <>
      <RealtimeEmergencyBanner />
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs">
        
        {/* ======================================================== */}
        {/* LEFT: TITLE, SUBTITLE & ROLE BADGE                      */}
        {/* ======================================================== */}
        <div className="min-w-0 flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Return to MediSync AI Landing Page"
              className="p-1.5 rounded-xl text-slate-400 hover:text-[#1A56DB] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-[#1E293B] truncate">
                {title}
              </h1>
              <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                displayRole === 'doctor'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : displayRole === 'nurse'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : displayRole === 'patient'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-blue-50 text-[#1A56DB] border border-blue-200'
              }`}>
                {displayRole} portal
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-[#64748B] mt-0.5 truncate hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT: PORTAL SWITCHERS, PROFILE SYMBOL & LOGOUT         */}
        {/* ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* 
            --------------------------------------------------------
            THE 3 PORTAL BUTTONS (Doctor, Nurse, Hospital Admin)
            Placed directly in line near profile and exit symbols
            --------------------------------------------------------
          */}
          {!isPatient && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              {/* 0. Hospital Dashboard Button */}
              <button
                type="button"
                onClick={() => handlePortalClick('overview')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortalRole === 'overview' || activePortalRole === 'hospital'
                    ? 'bg-white text-[#1A56DB] shadow-2xs ring-1 ring-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Hospital Facility Command Dashboard"
              >
                <Building2 className="w-3.5 h-3.5 text-[#1A56DB] shrink-0" />
                <span>Hospital</span>
              </button>

              {/* 1. Doctor Portal */}
              <button
                type="button"
                onClick={() => handlePortalClick('doctor')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortalRole === 'doctor'
                    ? 'bg-white text-emerald-700 shadow-2xs ring-1 ring-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Doctor Portal"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Doctor</span>
              </button>

              {/* 2. Nurse Portal */}
              <button
                type="button"
                onClick={() => handlePortalClick('nurse')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortalRole === 'nurse'
                    ? 'bg-white text-amber-700 shadow-2xs ring-1 ring-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Nurse Portal"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Nurse</span>
              </button>

              {/* 3. Hospital Admin Portal (Restricted: Username: Admin | Password: admin123) */}
              <button
                type="button"
                onClick={() => handlePortalClick('admin')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortalRole === 'admin'
                    ? 'bg-[#1A56DB] text-white shadow-2xs font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Hospital Admin Command Center"
              >
                <Building2 className={`w-3.5 h-3.5 shrink-0 ${activePortalRole === 'admin' ? 'text-white' : 'text-[#1A56DB]'}`} />
                <span className="hidden sm:inline">Hospital Admin</span>
                <span className="sm:hidden">Admin</span>
                {effectiveAdminUnlocked ? (
                  <Unlock className={`w-3 h-3 ${activePortalRole === 'admin' ? 'text-emerald-300' : 'text-emerald-600'}`} />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>
          )}

          {/* Emergency Workflow Demonstration Trigger */}
          <button
            type="button"
            onClick={() => setShowEmergencyScenarioModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-sm transition-all cursor-pointer"
            title="Run Hospital-Wide Emergency Workflow Demonstration (10 Steps)"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse text-amber-200" />
            <span className="hidden sm:inline">Emergency Demo</span>
          </button>

          {/* Optional Emergency 24x7 helpline pill */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
            <PhoneCall className="w-3 h-3 animate-pulse" />
            <span>24x7: {emergencyPhone}</span>
          </div>

          {/* Realtime Live Socket Indicator */}
          <RealtimeConnectionIndicator />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] relative cursor-pointer transition-colors"
              title="Hospital Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden z-50 animate-in fade-in zoom-in-95 text-slate-800">
                <div className="px-4 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1E293B]">Live Alerts & Notifications</span>
                    <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-semibold">{unreadCount} unread</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Read all
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100/60 border-b border-slate-100 text-[11px]">
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${notifFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${notifFilter === 'unread' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    onClick={() => setNotifFilter('critical')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${notifFilter === 'critical' ? 'bg-white shadow-xs text-red-700 font-bold' : 'text-slate-500'}`}
                  >
                    Critical ({notifications.filter(n => n.type === 'critical').length})
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {notifications.filter(n => notifFilter === 'all' ? true : notifFilter === 'unread' ? !n.read : n.type === 'critical').length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">No notifications matching filter</div>
                  ) : (
                    notifications.filter(n => notifFilter === 'all' ? true : notifFilter === 'unread' ? !n.read : n.type === 'critical').map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer ${n.read ? 'opacity-70' : 'bg-blue-50/20'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${n.type === 'critical' ? 'bg-red-500 animate-ping' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <span className="font-semibold text-[#1E293B] line-clamp-1">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-[#64748B] shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 
            --------------------------------------------------------
            PROFILE SYMBOL & IDENTITY (Avatar, Name, Username)
            --------------------------------------------------------
          */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=MS&backgroundColor=2563a6'}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-slate-200 ring-1 ring-slate-100 object-cover shrink-0"
            />
            <div className="hidden lg:block text-left text-xs">
              <div className="font-bold text-[#1E293B] truncate max-w-[120px]">
                {user?.name || 'Staff User'}
              </div>
              <div className="text-[10px] text-[#64748B]">
                @{user?.username || (isPatient ? 'patient' : 'dr_sundar')}
              </div>
            </div>
          </div>

          {/* 
            --------------------------------------------------------
            LOGOUT / EXIT SYMBOL
            - Accessible in every portal
            - Clears session and returns to landing page
            --------------------------------------------------------
          */}
          <button
            onClick={handleLogout}
            title="Log out of portal to Landing Page"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-xs font-bold hidden sm:inline text-slate-700 hover:text-red-600">
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* 
        ============================================================
        LOCAL HOSPITAL ADMIN LOGIN MODAL
        Used as fallback when portalSwitcher modal is not handled by parent
        - Username: Admin
        - Password: admin123
        ============================================================
      */}
      {showLocalAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-[#1E293B] animate-in zoom-in-95 duration-150">
            <div className="relative p-6 border-b border-slate-100 bg-linear-to-b from-blue-50/50 to-white">
              <button
                type="button"
                onClick={() => { setShowLocalAdminModal(false); setAdminError(null); }}
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

            <form onSubmit={handleLocalAdminLogin} className="p-6 space-y-4">
              {adminError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

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

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800">
                  Configured Credentials:
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Username: <strong className="text-blue-700">Admin</strong></span>
                  <span>&bull;</span>
                  <span>Password: <strong className="text-blue-700">admin123</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLocalAdminModal(false); setAdminError(null); }}
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
      {/* Emergency Workflow Demonstration Controller */}
      <EmergencyWorkflowController
        isOpen={showEmergencyScenarioModal}
        onClose={() => setShowEmergencyScenarioModal(false)}
        onSwitchPortal={handlePortalClick}
      />
    </>
  );
};
