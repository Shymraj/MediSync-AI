import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  ChevronDown, 
  Shield, 
  Stethoscope, 
  HeartHandshake, 
  User as UserIcon, 
  RotateCcw,
  Home
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNavigateHome }) => {
  const { user, logout, notifications, markNotificationAsRead, resetDemoToScenario, setUser } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRoleQuickSwitch = (newRole: 'admin' | 'doctor' | 'nurse' | 'patient') => {
    if (user) {
      setUser({
        ...user,
        role: newRole,
        roleVerificationStatus: 'approved',
        isOnboarded: true
      });
      setShowRoleSwitcher(false);
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Return to MediSync AI Landing Page"
              className="p-1 rounded-md text-slate-400 hover:text-[#1A56DB] hover:bg-slate-100 transition-colors mr-1 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-base font-bold text-[#1E293B]">{title}</h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#2563A6] border border-blue-200">
            {user?.role} portal
          </span>
        </div>
        {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Demo Scenario Switcher for Judges */}
        <div className="relative hidden md:block">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="text-xs text-[#2563A6] font-semibold border-blue-200 hover:bg-blue-50/50"
          >
            Switch Role <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Hackathon Demo Role Switch:
              </div>
              <button
                onClick={() => handleRoleQuickSwitch('admin')}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center gap-2 text-[#1E293B]"
              >
                <Shield className="w-4 h-4 text-[#2563A6]" /> Hospital Admin
              </button>
              <button
                onClick={() => handleRoleQuickSwitch('doctor')}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center gap-2 text-[#1E293B]"
              >
                <Stethoscope className="w-4 h-4 text-[#15803D]" /> Doctor
              </button>
              <button
                onClick={() => handleRoleQuickSwitch('nurse')}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center gap-2 text-[#1E293B]"
              >
                <HeartHandshake className="w-4 h-4 text-[#D97706]" /> Nurse
              </button>
              <button
                onClick={() => handleRoleQuickSwitch('patient')}
                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center gap-2 text-[#1E293B]"
              >
                <UserIcon className="w-4 h-4 text-slate-600" /> Patient
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={resetDemoToScenario}
                className="w-full text-left px-2 py-1 rounded text-[11px] text-[#DC2626] hover:bg-red-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Demo State
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#1E293B] relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-[#1E293B]">Hospital Notifications</span>
                <span className="text-[10px] text-[#64748B]">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#64748B]">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer ${n.read ? 'opacity-70' : 'bg-blue-50/20'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1E293B]">{n.title}</span>
                        <span className="text-[10px] text-[#64748B]">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hospital badge info */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#E2E8F0] text-xs">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-[#1E293B] truncate max-w-[180px]">
            {user?.hospitalName || 'Tamil Nadu General'}
          </span>
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=MS&backgroundColor=2563a6'}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-slate-200"
          />
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-[#1E293B] truncate max-w-[120px]">{user?.name}</div>
            <div className="text-[10px] text-[#64748B]">@{user?.username}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out to Landing Page"
            className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
