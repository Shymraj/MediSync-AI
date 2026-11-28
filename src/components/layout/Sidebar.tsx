import React, { useState } from 'react';
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
  CheckSquare,
  LogOut,
  MapPin,
  Sparkles,
  Radio,
  BrainCircuit,
  Droplet,
  Pill,
  Flame,
  Zap,
  BookOpen,
  UserCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  Workflow,
  Network
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  activeRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, activeRole }) => {
  const { user, logout } = useApp();
  const role: UserRole = activeRole || user?.role || 'admin';

  // Specific role navigation items as defined in spec
  const adminNav = [
    { id: 'dashboard', label: 'Hospital Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'command_center', label: 'Emergency Command Center', icon: <Flame className="w-4 h-4 text-red-500" /> },
    { id: 'simulation_lab', label: 'Hospital Digital Twin Lab', icon: <Building2 className="w-4 h-4 text-indigo-500" /> },
    { id: 'workflow_automation', label: 'Workflow Automation', icon: <Workflow className="w-4 h-4 text-emerald-500" /> },
    { id: 'forecasting', label: 'Predictive Intelligence', icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
    { id: 'interoperability', label: 'Health Data Exchange', icon: <Network className="w-4 h-4 text-cyan-500" /> },
    { id: 'beds', label: 'Bed Master Status', icon: <Bed className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'wards', label: 'Clinical Wards', icon: <Activity className="w-4 h-4" /> },
    { id: 'resources', label: 'Resource Registry', icon: <Activity className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment Telemetry', icon: <Activity className="w-4 h-4" /> },
    { id: 'requests', label: 'Resource Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Verification', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Readiness Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Hospital Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  // Advanced Doctor Navigation Groups
  const doctorNavGroups = [
    {
      title: 'DOCTOR DASHBOARD',
      items: [
        { id: 'dashboard', label: 'Doctor Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'patients', label: 'My Patients', icon: <Users className="w-4 h-4" /> },
        { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
        { id: 'wards', label: 'Clinical Wards', icon: <Building2 className="w-4 h-4" /> },
        { id: 'admissions', label: 'Pending Admissions', icon: <Clock className="w-4 h-4" /> }
      ]
    },
    {
      title: 'PATIENT CARE',
      items: [
        { id: 'digital_twin', label: 'Patient Digital Twin', icon: <Users className="w-4 h-4" /> },
        { id: 'patient_monitoring', label: 'Patient Monitoring', icon: <Activity className="w-4 h-4" /> },
        { id: 'lab_intelligence', label: 'Lab Intelligence', icon: <Droplet className="w-4 h-4" /> },
        { id: 'digital_prescription', label: 'Digital Prescription', icon: <Pill className="w-4 h-4" /> },
        { id: 'care_plan', label: 'Care Plan', icon: <FileText className="w-4 h-4" /> },
        { id: 'discharge_intelligence', label: 'Discharge Intelligence', icon: <CheckSquare className="w-4 h-4" /> }
      ]
    },
    {
      title: 'AI CLINICAL INTELLIGENCE',
      items: [
        { id: 'ai_assistant', label: 'AI Clinical Assistant', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'early_warning', label: 'Early Warning System', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'deterioration_radar', label: 'Patient Deterioration Radar', icon: <Radio className="w-4 h-4" /> },
        { id: 'smart_diagnosis', label: 'Smart Diagnosis Support', icon: <BrainCircuit className="w-4 h-4" /> },
        { id: 'medication_safety', label: 'Medication Safety', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'ai_summarizer', label: 'AI Case Summarizer', icon: <FileCheck className="w-4 h-4" /> },
        { id: 'treatment_response', label: 'Treatment Response Tracker', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'decision_timeline', label: 'Clinical Decision Timeline', icon: <Clock className="w-4 h-4" /> }
      ]
    },
    {
      title: 'EMERGENCY & COORDINATION',
      items: [
        { id: 'command_center', label: 'Emergency Command Center', icon: <Flame className="w-4 h-4 text-red-500" /> },
        { id: 'simulation_lab', label: 'Emergency Simulation Lab', icon: <Building2 className="w-4 h-4 text-indigo-500" /> },
        { id: 'workflow_automation', label: 'Clinical Workflows', icon: <Workflow className="w-4 h-4 text-emerald-500" /> },
        { id: 'forecasting', label: 'Capacity Forecasting & Alerts', icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
        { id: 'requests', label: 'Resource Requests', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'transfers', label: 'Inter-Ward Transfers', icon: <Share2 className="w-4 h-4" /> },
        { id: 'interoperability', label: 'Health Data Exchange', icon: <Network className="w-4 h-4 text-cyan-500" /> },
        { id: 'emergency_alerts', label: 'Emergency Alerts', icon: <Flame className="w-4 h-4" /> },
        { id: 'emergency_matching', label: 'Emergency Patient Matching', icon: <Zap className="w-4 h-4" /> },
        { id: 'doctor_nurse_coord', label: 'Doctor–Nurse Coordination', icon: <Users className="w-4 h-4" /> },
        { id: 'referral_consult', label: 'Referral & Specialist Consult', icon: <Stethoscope className="w-4 h-4" /> },
        { id: 'clinical_handover', label: 'Smart Clinical Handover', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'outbreak_detection', label: 'Outbreak Pattern Detection', icon: <ShieldAlert className="w-4 h-4" /> }
      ]
    },
    {
      title: 'CLINICAL INSIGHTS',
      items: [
        { id: 'knowledge_hub', label: 'Clinical Knowledge Hub', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'case_studies', label: 'Case Study Library', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'doctor_analytics', label: 'Doctor Analytics', icon: <Activity className="w-4 h-4" /> },
        { id: 'audit_trail', label: 'Clinical Audit Trail', icon: <FileText className="w-4 h-4" /> }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Doctor Profile', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
      ]
    }
  ];

  const nurseNav = [
    { id: 'dashboard', label: 'Ward Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'command_center', label: 'Emergency Command Center', icon: <Flame className="w-4 h-4 text-red-500" /> },
    { id: 'simulation_lab', label: 'Digital Twin & Ward Prep', icon: <Building2 className="w-4 h-4 text-indigo-500" /> },
    { id: 'workflow_automation', label: 'Automated Tasks & Workflows', icon: <Workflow className="w-4 h-4 text-emerald-500" /> },
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
    { id: 'profile', label: 'Patient Record', icon: <Users className="w-4 h-4" /> },
    { id: 'find_hospitals', label: 'Find Hospitals (தேடல்)', icon: <MapPin className="w-4 h-4" /> }
  ];

  const hospitalNav = [
    { id: 'dashboard', label: 'Hospital Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'facility_info', label: 'Facility Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'location_contact', label: 'Location & Helplines', icon: <MapPin className="w-4 h-4" /> },
    { id: 'bed_readiness', label: 'Bed Master Status', icon: <Bed className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'wards', label: 'Clinical Wards', icon: <Activity className="w-4 h-4" /> },
    { id: 'resources', label: 'Resource Registry', icon: <Activity className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment Telemetry', icon: <Activity className="w-4 h-4" /> },
    { id: 'requests', label: 'Resource Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'staff', label: 'Staff Verification', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Readiness Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Hospital Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const navItems = ({
    overview: hospitalNav,
    hospital: hospitalNav,
    admin: adminNav,
    nurse: nurseNav,
    patient: patientNav
  } as Record<string, typeof hospitalNav>)[role] || hospitalNav;

  const handleLogout = () => {
    logout();
    window.location.hash = '#/';
  };

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
      <nav className="p-3 space-y-3 flex-1 overflow-y-auto">
        {role === 'doctor' ? (
          // Doctor Expandable Groups Navigation
          <div className="space-y-4">
            {doctorNavGroups.map(group => {
              const isCollapsed = collapsedGroups[group.title];

              return (
                <div key={group.title} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>{group.title}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-0.5">
                      {group.items.map(item => {
                        const normalizedTab = (currentTab || '').replace(/-/g, '_');
                        const normalizedId = item.id.replace(/-/g, '_');
                        const isActive = 
                          currentTab === item.id ||
                          normalizedTab === normalizedId ||
                          (item.id === 'requests' && (normalizedTab === 'requests' || normalizedTab === 'resource_requests')) ||
                          (item.id === 'dashboard' && (normalizedTab === 'dashboard' || normalizedTab === 'overview')) ||
                          (item.id === 'patients' && (normalizedTab === 'patients' || normalizedTab === 'my_patients')) ||
                          (item.id === 'wards' && (normalizedTab === 'wards' || normalizedTab === 'clinical_wards'));

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onSelectTab(item.id);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                              isActive
                                ? 'bg-blue-50 text-[#2563A6] font-bold shadow-2xs'
                                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                            }`}
                          >
                            <span className={isActive ? 'text-[#2563A6]' : 'text-[#64748B]'}>
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Standard Navigation for Admin, Nurse, Patient, Hospital
          <div>
            <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
              {role} Menu
            </div>
            {navItems.map(item => {
              const isActive = 
                currentTab === item.id ||
                (item.id === 'requests' && (currentTab === 'requests' || currentTab === 'resource-requests')) ||
                (item.id === 'reports' && (currentTab === 'reports' || currentTab === 'readiness-reports')) ||
                (item.id === 'beds' && (currentTab === 'beds' || currentTab === 'bed_readiness')) ||
                (item.id === 'bed_readiness' && (currentTab === 'beds' || currentTab === 'bed_readiness'));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (item.id === 'beds' || item.id === 'bed_readiness') {
                      window.location.hash = '#/hospital/beds';
                    } else if (item.id === 'wards') {
                      window.location.hash = '#/hospital/wards';
                    } else if (item.id === 'departments') {
                      window.location.hash = '#/hospital/departments';
                    } else if (item.id === 'resources') {
                      window.location.hash = '#/hospital/resources';
                    } else if (item.id === 'equipment') {
                      window.location.hash = '#/hospital/equipment';
                    } else if (item.id === 'staff') {
                      window.location.hash = '#/hospital/staff';
                    } else if (item.id === 'requests' || item.id === 'resource-requests') {
                      window.location.hash = '#/hospital/resource-requests';
                    } else if (item.id === 'reports' || item.id === 'readiness-reports') {
                      window.location.hash = '#/hospital/readiness-reports';
                    } else if (item.id === 'settings') {
                      window.location.hash = '#/hospital/settings';
                    } else if (item.id === 'dashboard') {
                      window.location.hash = '#/hospital/overview';
                    }
                  }}
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
          </div>
        )}
      </nav>

      {/* Hospital Footer & Logout in Sidebar */}
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

        {/* Dedicated Sidebar Logout Button */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            title="Log out of MediSync"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
