import React from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  Activity, 
  Stethoscope, 
  HeartHandshake, 
  Users, 
  ClipboardList, 
  FileText, 
  Settings, 
  Calendar, 
  Building2, 
  Share2, 
  Clock, 
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  activeRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, activeRole }) => {
  const { user } = useApp();
  const role: UserRole = activeRole || user?.role || 'admin';

  // Specific role navigation items as defined in spec
  const adminNav = [
    { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'resources', label: 'Resource Registry', icon: <Activity className="w-4 h-4" /> },
    { id: 'beds', label: 'Bed Master Control', icon: <Bed className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment Telemetry', icon: <Activity className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Verification', icon: <Users className="w-4 h-4" /> },
    { id: 'requests', label: 'Resource Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'reports', label: 'Readiness Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Hospital Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const doctorNav = [
    { id: 'dashboard', label: 'Clinical Workspace', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'patients', label: 'Assigned Patients', icon: <Users className="w-4 h-4" /> },
    { id: 'admissions', label: 'Pending Admissions', icon: <Clock className="w-4 h-4" /> },
    { id: 'requests', label: 'Resource Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'transfers', label: 'Inter-Ward Transfers', icon: <Share2 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Clinical Alerts', icon: <Activity className="w-4 h-4" /> }
  ];

  const nurseNav = [
    { id: 'dashboard', label: 'Ward Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'ward', label: 'My Ward (ICU Block A/B)', icon: <Building2 className="w-4 h-4" /> },
    { id: 'turnaround', label: 'Bed Turnaround (6-Stage)', icon: <Bed className="w-4 h-4" /> },
    { id: 'tasks', label: 'Clinical & Cleaning Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment Checklist', icon: <Activity className="w-4 h-4" /> },
    { id: 'handover', label: 'Shift Handover Log', icon: <ClipboardList className="w-4 h-4" /> }
  ];

  const patientNav = [
    { id: 'dashboard', label: 'My Care Portal', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
    { id: 'queue', label: 'OPD Queue Status', icon: <Clock className="w-4 h-4" /> },
    { id: 'requests', label: 'My Service Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'hospital', label: 'Hospital Information', icon: <Building2 className="w-4 h-4" /> },
    { id: 'profile', label: 'Patient Record', icon: <Users className="w-4 h-4" /> }
  ];

  const navItems = {
    admin: adminNav,
    doctor: doctorNav,
    nurse: nurseNav,
    patient: patientNav
  }[role];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#2563A6] flex items-center justify-center text-white">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-bold text-[#1E293B]">MediSync AI</div>
          <div className="text-[10px] text-[#64748B]">Operational Readiness</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-1 flex-1">
        <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
          {role} Menu
        </div>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-[#2563A6] font-bold'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <span className={isActive ? 'text-[#2563A6]' : 'text-[#64748B]'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Hospital Footer in Sidebar */}
      <div className="p-4 border-t border-[#E2E8F0] bg-slate-50/50">
        <div className="text-[10px] text-[#64748B] flex items-center gap-1 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
          Verified Affiliation
        </div>
        <div className="text-xs font-bold text-[#1E293B] mt-1 truncate">
          {user?.hospitalName || 'Rajiv Gandhi GH'}
        </div>
        <div className="text-[11px] text-[#64748B] mt-0.5">
          District: {user?.districtName || 'Chennai'}
        </div>
      </div>
    </aside>
  );
};
