import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  Activity, 
  Users, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Stethoscope, 
  HeartHandshake, 
  Shield, 
  Wind, 
  Info, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { HOSPITAL_DEMO_DATA, HospitalKPICard, RolePortal } from '../../data/hospitalDemoData';
import { BedManagementPage } from './BedManagementPage';
import { ClinicalWardsPage } from './ClinicalWardsPage';
import { ResourceRegistryPage } from './ResourceRegistryPage';
import { EquipmentTelemetryPage } from './EquipmentTelemetryPage';
import { DepartmentsPage } from './DepartmentsPage';
import { StaffVerificationPage } from './StaffVerificationPage';
import { ResourceRequestsPage } from './ResourceRequestsPage';
import { ReadinessReportsPage } from './ReadinessReportsPage';
import { HospitalSettingsPage } from './HospitalSettingsPage';

interface AdminDashboardProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, onSelectTab }) => {
  const { user, setUser } = useApp();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const { hospitalInfo, kpis, rolePortals, facilityInformation } = HOSPITAL_DEMO_DATA;

  // Handle direct navigation to role portal dashboards
  const handleNavigateToPortal = (route: string, role: 'doctor' | 'nurse' | 'admin') => {
    if (user) {
      setUser(prev => prev ? {
        ...prev,
        role,
        roleVerificationStatus: 'approved',
        isOnboarded: true
      } : null);
    }
    window.location.hash = '#' + route;
  };

  const handleCopyContact = () => {
    navigator.clipboard?.writeText(hospitalInfo.emergencyContact);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const renderKpiIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bed':
        return <Bed className="w-5 h-5 text-[#2563A6]" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-[#DC2626]" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-[#15803D]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[#475569]" />;
      default:
        return <Building2 className="w-5 h-5 text-[#2563A6]" />;
    }
  };

  const getKpiBadgeColor = (variant: string) => {
    switch (variant) {
      case 'critical':
        return 'bg-red-50 text-[#DC2626] border-red-200';
      case 'success':
        return 'bg-green-50 text-[#15803D] border-green-200';
      case 'secondary':
        return 'bg-slate-100 text-[#475569] border-slate-200';
      case 'primary':
      default:
        return 'bg-blue-50 text-[#2563A6] border-blue-200';
    }
  };

  const getKpiIconContainer = (variant: string) => {
    switch (variant) {
      case 'critical':
        return 'bg-red-50 text-[#DC2626]';
      case 'success':
        return 'bg-green-50 text-[#15803D]';
      case 'secondary':
        return 'bg-slate-100 text-[#475569]';
      case 'primary':
      default:
        return 'bg-blue-50 text-[#2563A6]';
    }
  };

  const renderPortalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Stethoscope':
        return <Stethoscope className="w-6 h-6 text-[#15803D]" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-6 h-6 text-[#D97706]" />;
      case 'Shield':
      default:
        return <Shield className="w-6 h-6 text-[#2563A6]" />;
    }
  };

  // Step 2: Bed Management (Bed Master Status)
  if (activeTab === 'beds') {
    return <BedManagementPage onSelectTab={onSelectTab} />;
  }

  // Step 3: Clinical Wards Management
  if (activeTab === 'wards') {
    return <ClinicalWardsPage onSelectTab={onSelectTab} />;
  }

  // Step 3b: Clinical Departments Management
  if (activeTab === 'departments') {
    return <DepartmentsPage onSelectTab={onSelectTab} />;
  }

  // Step 4: Resource Registry
  if (activeTab === 'resources') {
    return <ResourceRegistryPage onSelectTab={onSelectTab} />;
  }

  // Step 5: Equipment Telemetry
  if (activeTab === 'equipment') {
    return <EquipmentTelemetryPage onSelectTab={onSelectTab} />;
  }

  // Step 6: Staff Verification
  if (activeTab === 'staff') {
    return <StaffVerificationPage onSelectTab={onSelectTab} />;
  }

  // Step 7: Resource Requests
  if (activeTab === 'requests' || activeTab === 'resource-requests') {
    return <ResourceRequestsPage onSelectTab={onSelectTab} />;
  }

  // Step 8: Readiness Reports
  if (activeTab === 'reports' || activeTab === 'readiness-reports') {
    return <ReadinessReportsPage onSelectTab={onSelectTab} />;
  }

  // Step 9: Hospital Settings
  if (activeTab === 'settings') {
    return <HospitalSettingsPage onSelectTab={onSelectTab} />;
  }

  // If user navigated to a module tab scheduled for Step 3+
  if (activeTab !== 'dashboard' && activeTab !== 'overview') {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center bg-white border border-[#E2E8F0] shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563A6] flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Clock className="w-7 h-7" />
          </div>
          <Badge variant="primary" size="md" className="mb-2">
            Step 2 Scope Boundary
          </Badge>
          <h2 className="text-xl font-bold text-[#1E293B]">
            {activeTab.toUpperCase().replace('-', ' ')} Module
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto mt-2 leading-relaxed">
            As per current specification, <strong className="text-[#1E293B]">Hospital Overview</strong> (Step 1) and <strong className="text-[#1E293B]">Bed Management / Bed Master Status</strong> (Step 2) are fully active. Clinical Wards, Equipment, and Requests will be implemented sequentially in subsequent steps.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => onSelectTab ? onSelectTab('beds') : null}
              icon={<Bed className="w-4 h-4" />}
            >
              Bed Master Status
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onSelectTab ? onSelectTab('dashboard') : null}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Hospital Overview
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* 1. HOSPITAL INFORMATION HEADER (Requirement 3)                */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-blue-50 text-[#2563A6] border border-blue-100">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                    {hospitalInfo.name}
                  </h1>
                  <Badge variant="success" size="sm" dot>
                    {hospitalInfo.verificationStatus}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-[#64748B] mt-0.5">
                  {hospitalInfo.category} &middot; Institutional Affiliation: {hospitalInfo.affiliation}
                </p>
              </div>
            </div>

            {/* Structured Meta Badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#64748B] pt-1">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563A6]" />
                <span className="font-semibold text-[#1E293B]">Reg ID:</span>
                <span className="font-mono text-slate-700">{hospitalInfo.registrationId}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{hospitalInfo.location}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Established {hospitalInfo.established}</span>
              </div>
            </div>
          </div>

          {/* Right Action: Emergency Hotline & Demo Environment Notice */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="p-3 bg-red-50/80 border border-red-200/70 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100/90 text-[#DC2626] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                  24x7 Emergency Line
                </div>
                <button
                  onClick={handleCopyContact}
                  title="Click to copy contact"
                  className="text-sm font-bold text-[#1E293B] hover:text-[#DC2626] transition-colors cursor-pointer text-left block"
                >
                  {hospitalInfo.emergencyContact}
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyContact}
                className="text-[11px] py-1 px-2 h-auto text-slate-500 hover:text-[#DC2626]"
              >
                {copyFeedback ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{hospitalInfo.demoNotice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. HOSPITAL KPI CARDS (Requirement 4)                         */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
              Hospital Operational Key Performance Indicators
            </h2>
            <p className="text-xs text-[#64748B]">
              Real-time resource capacity metrics calibrated for institutional hospital oversight
            </p>
          </div>
          <Badge variant="primary" size="sm">
            Live Telemetry Online
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi: HospitalKPICard) => (
            <div
              key={kpi.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B] tracking-wide">
                  {kpi.label}
                </span>
                <span className={`p-2 rounded-lg ${getKpiIconContainer(kpi.statusVariant)}`}>
                  {renderKpiIcon(kpi.iconName)}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#1E293B] tracking-tight">
                  {kpi.value}
                </span>
                {kpi.badgeText && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getKpiBadgeColor(kpi.statusVariant)}`}>
                    {kpi.badgeText}
                  </span>
                )}
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1E293B] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                  {kpi.supportingInfo}
                </span>
              </div>

              {kpi.trend && (
                <div className="mt-1 text-[10px] text-[#64748B]">
                  {kpi.trend}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HOSPITAL ROLE PORTALS (Requirement 5)                      */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
              Specialized Hospital Role Portals
            </h2>
            <p className="text-xs text-[#64748B]">
              Role-based workspace access for doctors, clinical ward nurses, and executive administration
            </p>
          </div>
          <span className="text-xs text-[#64748B]">
            3 Active Role Environments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rolePortals.map((portal: RolePortal) => {
            const isDoctor = portal.role === 'doctor';
            const isNurse = portal.role === 'nurse';
            const isAdmin = portal.role === 'admin';

            return (
              <div
                key={portal.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#2563A6]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDoctor ? 'bg-green-50 border border-green-200' :
                      isNurse ? 'bg-amber-50 border border-amber-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      {renderPortalIcon(portal.iconName)}
                    </div>
                    <Badge variant={portal.badgeVariant} size="sm">
                      {portal.badge}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-[#1E293B]">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    variant={isDoctor ? 'success' : isAdmin ? 'primary' : 'outline'}
                    size="md"
                    className="w-full justify-center"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => handleNavigateToPortal(portal.route, portal.role)}
                  >
                    {portal.buttonText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. FACILITY INFORMATION SECTION (Requirement 6)               */}
      {/* ============================================================== */}
      <Card
        title="Comprehensive Facility Information & Institutional Registry"
        subtitle="Verified hospital credentials, statutory affiliation, and institutional metadata"
        action={
          <Badge variant="success" size="sm" dot>
            Verified Institutional Registry
          </Badge>
        }
        noPadding
      >
        <div className="divide-y divide-[#E2E8F0]">
          {facilityInformation.map((item, idx) => (
            <div 
              key={idx} 
              className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <span className="font-semibold text-[#64748B] sm:w-1/3">
                {item.label}
              </span>
              <div className="flex items-center gap-3 sm:w-2/3 justify-between sm:justify-start">
                <span className="font-medium text-[#1E293B]">
                  {item.value}
                </span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'secondary'} size="sm">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Prototype Transparency Notice Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            <span>Hospital security profile authenticated under MediSync AI Healthcare Governance.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Node: RGGGH-CHN-PRK-01
          </span>
        </div>
      </Card>
    </div>
  );
};
