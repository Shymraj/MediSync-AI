import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Building2, 
  SlidersHorizontal, 
  Bell, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Check, 
  Edit3, 
  Layers, 
  Activity, 
  Bed, 
  Wind, 
  Boxes,
  Info,
  ChevronRight,
  Shield,
  Volume2,
  VolumeX,
  ExternalLink
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEMO_DATA, HospitalInfo } from '../../data/hospitalDemoData';
import { INITIAL_BEDS, BedItem } from '../../data/bedDemoData';
import { INITIAL_EQUIPMENT, EquipmentItem } from '../../data/equipmentDemoData';
import { INITIAL_RESOURCES, ResourceItem } from '../../data/resourceDemoData';

// Storage keys
const SETTINGS_STORAGE_KEY = 'medisync_hospital_settings';
const HOSPITAL_INFO_STORAGE_KEY = 'medisync_hospital_info';
const BEDS_STORAGE_KEY = 'medisync_bed_management_data';
const EQUIPMENT_STORAGE_KEY = 'medisync_equipment_telemetry_data';
const RESOURCES_STORAGE_KEY = 'medisync_resource_registry_data';

// Types
export interface HospitalDetailsForm {
  hospitalName: string;
  hospitalId: string;
  hospitalType: string;
  address: string;
  contactNumber: string;
  officialEmail: string;
  hospitalAdministrator: string;
}

export interface ResourceThresholdItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  minQuantity: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface NotificationPreferences {
  lowResourceAvailability: boolean;
  criticalBedShortage: boolean;
  equipmentOffline: boolean;
  equipmentMaintenance: boolean;
  staffVerificationPending: boolean;
  newResourceRequests: boolean;
  urgentResourceRequests: boolean;
  soundAlerts: boolean;
}

export interface UserAccessSettings {
  sessionTimeout: '15m' | '30m' | '1h' | '4h' | '8h';
  requireStaffVerification: boolean;
  allowStaffProfileUpdates: boolean;
  enforceAdminTwoFactor: boolean;
}

export interface SystemPreferences {
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  timeFormat: '12-hour (AM/PM)' | '24-hour';
  defaultDashboardView: 'Hospital Overview' | 'Bed Master Status' | 'Clinical Wards' | 'Resource Registry' | 'Readiness Reports';
  reportExportFormat: 'CSV (.csv)' | 'JSON (.json)';
  compactTableDensity: boolean;
}

export interface AllHospitalSettings {
  thresholds: ResourceThresholdItem[];
  notifications: NotificationPreferences;
  access: UserAccessSettings;
  system: SystemPreferences;
}

// Sensible defaults
const DEFAULT_HOSPITAL_DETAILS: HospitalDetailsForm = {
  hospitalName: HOSPITAL_DEMO_DATA.hospitalInfo.name,
  hospitalId: HOSPITAL_DEMO_DATA.hospitalInfo.registrationId,
  hospitalType: HOSPITAL_DEMO_DATA.hospitalInfo.category,
  address: HOSPITAL_DEMO_DATA.hospitalInfo.address,
  contactNumber: HOSPITAL_DEMO_DATA.hospitalInfo.emergencyContact,
  officialEmail: 'admin.rgggh@medisync.gov.in',
  hospitalAdministrator: 'Dr. E. Theranirajan (Dean & Medical Superintendent)'
};

const DEFAULT_THRESHOLDS: ResourceThresholdItem[] = [
  {
    id: 'general-beds',
    name: 'General Beds',
    category: 'Inpatient Beds',
    unit: 'Beds',
    minQuantity: 10,
    warningThreshold: 8,
    criticalThreshold: 3
  },
  {
    id: 'icu-beds',
    name: 'ICU Beds',
    category: 'Critical Care',
    unit: 'Beds',
    minQuantity: 6,
    warningThreshold: 4,
    criticalThreshold: 2
  },
  {
    id: 'ventilators',
    name: 'Mechanical Ventilators',
    category: 'Biomedical Telemetry',
    unit: 'Units',
    minQuantity: 8,
    warningThreshold: 5,
    criticalThreshold: 2
  },
  {
    id: 'oxygen-equipment',
    name: 'Oxygen Concentrators',
    category: 'Respiratory Support',
    unit: 'Units',
    minQuantity: 10,
    warningThreshold: 6,
    criticalThreshold: 3
  },
  {
    id: 'wheelchairs',
    name: 'Hospital Wheelchairs',
    category: 'Patient Care Equipment',
    unit: 'Units',
    minQuantity: 12,
    warningThreshold: 8,
    criticalThreshold: 4
  },
  {
    id: 'emergency-supplies',
    name: 'Emergency Supplies',
    category: 'Clinical Consumables',
    unit: 'Packs / Kits',
    minQuantity: 25,
    warningThreshold: 15,
    criticalThreshold: 5
  }
];

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  lowResourceAvailability: true,
  criticalBedShortage: true,
  equipmentOffline: true,
  equipmentMaintenance: true,
  staffVerificationPending: true,
  newResourceRequests: true,
  urgentResourceRequests: true,
  soundAlerts: false
};

const DEFAULT_ACCESS: UserAccessSettings = {
  sessionTimeout: '1h',
  requireStaffVerification: true,
  allowStaffProfileUpdates: true,
  enforceAdminTwoFactor: true
};

const DEFAULT_SYSTEM: SystemPreferences = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12-hour (AM/PM)',
  defaultDashboardView: 'Hospital Overview',
  reportExportFormat: 'CSV (.csv)',
  compactTableDensity: false
};

interface HospitalSettingsPageProps {
  onSelectTab?: (tab: string) => void;
}

export const HospitalSettingsPage: React.FC<HospitalSettingsPageProps> = ({ onSelectTab }) => {
  const { user } = useApp();

  // Active sub-tab within settings: 'hospital' | 'thresholds' | 'notifications' | 'access' | 'system'
  const [activeSubTab, setActiveSubTab] = useState<'hospital' | 'thresholds' | 'notifications' | 'access' | 'system'>('hospital');

  // 1. Hospital Details State (Persisted)
  const [hospitalDetails, setHospitalDetails] = useState<HospitalDetailsForm>(() => {
    try {
      const saved = localStorage.getItem(HOSPITAL_INFO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_HOSPITAL_DETAILS;
  });

  const [isEditingHospital, setIsEditingHospital] = useState(false);
  const [editHospitalForm, setEditHospitalForm] = useState<HospitalDetailsForm>(hospitalDetails);
  const [hospitalErrors, setHospitalErrors] = useState<Record<string, string>>({});

  // 2. Settings State (Persisted)
  const [settings, setSettings] = useState<AllHospitalSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          thresholds: parsed.thresholds || DEFAULT_THRESHOLDS,
          notifications: { ...DEFAULT_NOTIFICATIONS, ...(parsed.notifications || {}) },
          access: { ...DEFAULT_ACCESS, ...(parsed.access || {}) },
          system: { ...DEFAULT_SYSTEM, ...(parsed.system || {}) }
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      thresholds: DEFAULT_THRESHOLDS,
      notifications: DEFAULT_NOTIFICATIONS,
      access: DEFAULT_ACCESS,
      system: DEFAULT_SYSTEM
    };
  });

  // Resource thresholds editable copy & error tracking
  const [thresholdsForm, setThresholdsForm] = useState<ResourceThresholdItem[]>(settings.thresholds);
  const [thresholdErrors, setThresholdErrors] = useState<Record<string, string>>({});
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);

  // Notifications editable copy
  const [notificationsForm, setNotificationsForm] = useState<NotificationPreferences>(settings.notifications);

  // Access settings editable copy
  const [accessForm, setAccessForm] = useState<UserAccessSettings>(settings.access);

  // System preferences editable copy
  const [systemForm, setSystemForm] = useState<SystemPreferences>(settings.system);

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // 3. Live Resource Availability Data from Shared Stores
  const liveAvailability = useMemo(() => {
    // A. Beds
    let bedsList: BedItem[] = INITIAL_BEDS;
    try {
      const s = localStorage.getItem(BEDS_STORAGE_KEY);
      if (s) bedsList = JSON.parse(s);
    } catch (e) {
      console.error(e);
    }
    const generalAvailable = bedsList.filter(b => b.bedType === 'General' && b.status === 'Available').length;
    const icuAvailable = bedsList.filter(b => b.bedType === 'ICU' && b.status === 'Available').length;

    // B. Equipment
    let equipList: EquipmentItem[] = INITIAL_EQUIPMENT;
    try {
      const s = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
      if (s) equipList = JSON.parse(s);
    } catch (e) {
      console.error(e);
    }
    const ventilatorsOperational = equipList.filter(e => 
      e.type === 'Ventilators' && (e.operationalStatus === 'Operational' || e.operationalStatus === 'Standby')
    ).length;
    const oxygenOperational = equipList.filter(e => 
      e.type === 'Oxygen Concentrators' && (e.operationalStatus === 'Operational' || e.operationalStatus === 'Standby')
    ).length;

    // C. Resource Registry
    let resList: ResourceItem[] = INITIAL_RESOURCES;
    try {
      const s = localStorage.getItem(RESOURCES_STORAGE_KEY);
      if (s) resList = JSON.parse(s);
    } catch (e) {
      console.error(e);
    }
    const wheelchairsItem = resList.find(r => r.name.toLowerCase().includes('wheelchair'));
    const wheelchairsAvailable = wheelchairsItem ? wheelchairsItem.availableQuantity : 14;

    const emergencySuppliesSum = resList
      .filter(r => r.category === 'Emergency Supplies')
      .reduce((acc, curr) => acc + curr.availableQuantity, 0);

    return {
      'general-beds': generalAvailable,
      'icu-beds': icuAvailable,
      'ventilators': ventilatorsOperational,
      'oxygen-equipment': oxygenOperational,
      'wheelchairs': wheelchairsAvailable,
      'emergency-supplies': emergencySuppliesSum
    };
  }, []);

  // Sync edits when state updates
  useEffect(() => {
    setEditHospitalForm(hospitalDetails);
  }, [hospitalDetails]);

  useEffect(() => {
    setThresholdsForm(settings.thresholds);
    setNotificationsForm(settings.notifications);
    setAccessForm(settings.access);
    setSystemForm(settings.system);
  }, [settings]);

  // Save Settings Helper to localStorage
  const persistSettings = (newSettings: AllHospitalSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  // 1. HOSPITAL DETAILS HANDLERS
  const handleSaveHospitalDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!editHospitalForm.hospitalName.trim()) {
      errors.hospitalName = 'Hospital Name is mandatory.';
    }
    if (!editHospitalForm.hospitalId.trim()) {
      errors.hospitalId = 'Hospital ID / Registration ID is mandatory.';
    }
    if (!editHospitalForm.address.trim()) {
      errors.address = 'Hospital Address is mandatory.';
    }
    if (!editHospitalForm.contactNumber.trim()) {
      errors.contactNumber = 'Contact Number is mandatory.';
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(editHospitalForm.contactNumber.trim())) {
      errors.contactNumber = 'Please enter a valid official telephone format (e.g. 044-25305112).';
    }
    if (!editHospitalForm.officialEmail.trim()) {
      errors.officialEmail = 'Official Email is mandatory.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editHospitalForm.officialEmail.trim())) {
      errors.officialEmail = 'Please provide a valid official email address.';
    }
    if (!editHospitalForm.hospitalAdministrator.trim()) {
      errors.hospitalAdministrator = 'Hospital Administrator name is mandatory.';
    }

    if (Object.keys(errors).length > 0) {
      setHospitalErrors(errors);
      return;
    }

    setHospitalErrors({});
    setHospitalDetails(editHospitalForm);
    try {
      localStorage.setItem(HOSPITAL_INFO_STORAGE_KEY, JSON.stringify(editHospitalForm));
    } catch (e) {
      console.error(e);
    }
    setIsEditingHospital(false);
    showToast('Hospital Facility Information saved successfully.');
  };

  const handleCancelHospitalEdit = () => {
    setEditHospitalForm(hospitalDetails);
    setHospitalErrors({});
    setIsEditingHospital(false);
  };

  // 2. RESOURCE THRESHOLDS HANDLERS
  const handleThresholdChange = (id: string, field: 'minQuantity' | 'warningThreshold' | 'criticalThreshold', val: number) => {
    setThresholdsForm(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleSaveThresholds = () => {
    setIsSavingThresholds(true);
    const errors: Record<string, string> = {};

    thresholdsForm.forEach(item => {
      if (item.minQuantity < 0 || item.warningThreshold < 0 || item.criticalThreshold < 0) {
        errors[item.id] = `Thresholds for ${item.name} cannot be negative.`;
      } else if (item.criticalThreshold > item.warningThreshold) {
        errors[item.id] = `Critical threshold (${item.criticalThreshold}) cannot exceed Warning threshold (${item.warningThreshold}) for ${item.name}.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setThresholdErrors(errors);
      setIsSavingThresholds(false);
      showToast('Validation failed. Please correct threshold values.');
      return;
    }

    setThresholdErrors({});
    const updated: AllHospitalSettings = {
      ...settings,
      thresholds: thresholdsForm
    };
    persistSettings(updated);
    setIsSavingThresholds(false);
    showToast('Resource availability thresholds updated successfully.');
  };

  // 3. NOTIFICATION PREFERENCES HANDLERS
  const handleToggleNotification = (key: keyof NotificationPreferences) => {
    setNotificationsForm(prev => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const handleSaveNotifications = () => {
    const updated: AllHospitalSettings = {
      ...settings,
      notifications: notificationsForm
    };
    persistSettings(updated);
    showToast('In-app notification preferences saved.');
  };

  // 4. USER ACCESS SETTINGS HANDLERS
  const handleSaveAccess = () => {
    const updated: AllHospitalSettings = {
      ...settings,
      access: accessForm
    };
    persistSettings(updated);
    showToast('User security & access preferences saved.');
  };

  // 5. SYSTEM PREFERENCES HANDLERS
  const handleSaveSystem = () => {
    const updated: AllHospitalSettings = {
      ...settings,
      system: systemForm
    };
    persistSettings(updated);
    showToast('System configuration & display preferences saved.');
  };

  // 6. RESET ALL TO DEFAULTS
  const handleConfirmReset = () => {
    setHospitalDetails(DEFAULT_HOSPITAL_DETAILS);
    setEditHospitalForm(DEFAULT_HOSPITAL_DETAILS);
    setThresholdsForm(DEFAULT_THRESHOLDS);
    setNotificationsForm(DEFAULT_NOTIFICATIONS);
    setAccessForm(DEFAULT_ACCESS);
    setSystemForm(DEFAULT_SYSTEM);

    const defaultAll: AllHospitalSettings = {
      thresholds: DEFAULT_THRESHOLDS,
      notifications: DEFAULT_NOTIFICATIONS,
      access: DEFAULT_ACCESS,
      system: DEFAULT_SYSTEM
    };

    persistSettings(defaultAll);
    try {
      localStorage.setItem(HOSPITAL_INFO_STORAGE_KEY, JSON.stringify(DEFAULT_HOSPITAL_DETAILS));
    } catch (e) {
      console.error(e);
    }
    setShowResetModal(false);
    showToast('All hospital settings restored to factory defaults.');
  };

  // Threshold status indicator helper
  const getThresholdStatus = (id: string, warning: number, critical: number) => {
    const live = liveAvailability[id as keyof typeof liveAvailability] ?? 0;
    if (live < critical) {
      return {
        level: 'critical',
        badge: 'Critical Shortage',
        badgeColor: 'bg-red-50 text-red-700 border-red-200',
        textColor: 'text-red-700',
        live
      };
    }
    if (live < warning) {
      return {
        level: 'warning',
        badge: 'Warning: Low Stock',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        textColor: 'text-amber-700',
        live
      };
    }
    return {
      level: 'optimal',
      badge: 'Adequate Availability',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      textColor: 'text-emerald-700',
      live
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HEADER & ACTION CONTROLS                                    */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Hospital Settings</h1>
            <Badge variant="primary" size="sm">
              Configuration Command
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Configure institutional profile, resource warning thresholds, notification rules, security policies, and system preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetModal(true)}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUB-NAVIGATION TABS                                         */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveSubTab('hospital')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'hospital'
              ? 'bg-[#2563A6] text-white shadow-xs'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#1E293B]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Information</span>
        </button>

        <button
          onClick={() => setActiveSubTab('thresholds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'thresholds'
              ? 'bg-[#2563A6] text-white shadow-xs'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#1E293B]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Resource Thresholds</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'bg-[#2563A6] text-white shadow-xs'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#1E293B]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveSubTab('access')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'access'
              ? 'bg-[#2563A6] text-white shadow-xs'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#1E293B]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>User & Access Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'system'
              ? 'bg-[#2563A6] text-white shadow-xs'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#1E293B]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Preferences</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. TAB 1: HOSPITAL INFORMATION (Requirement 2)                */}
      {/* ============================================================== */}
      {activeSubTab === 'hospital' && (
        <Card
          title="Hospital Information & Facility Profile"
          subtitle="Official institutional credentials, facility classification, address, and statutory leadership"
          action={
            !isEditingHospital ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingHospital(true)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Information
              </Button>
            ) : null
          }
        >
          {!isEditingHospital ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Hospital Name
                  </span>
                  <div className="text-sm font-bold text-[#1E293B]">
                    {hospitalDetails.hospitalName}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Hospital ID / Registration
                  </span>
                  <div className="text-sm font-bold font-mono text-[#2563A6]">
                    {hospitalDetails.hospitalId}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Hospital Type / Classification
                  </span>
                  <div className="text-sm font-bold text-[#1E293B]">
                    {hospitalDetails.hospitalType}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Medical Administrator / Dean
                  </span>
                  <div className="text-sm font-bold text-[#1E293B]">
                    {hospitalDetails.hospitalAdministrator}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Emergency Contact Number
                  </span>
                  <div className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hospitalDetails.contactNumber}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Official Institutional Email
                  </span>
                  <div className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hospitalDetails.officialEmail}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Official Address & Physical Location
                </span>
                <div className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{hospitalDetails.address}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-[#2563A6]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                  <span>Verified Affiliation: Madras Medical College (MMC) & Govt. of Tamil Nadu</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">Registry Code: RGGGH-CHN</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveHospitalDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hospital Name */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editHospitalForm.hospitalName}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, hospitalName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                  {hospitalErrors.hospitalName && (
                    <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.hospitalName}</p>
                  )}
                </div>

                {/* Hospital ID */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Hospital ID / Registration Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editHospitalForm.hospitalId}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, hospitalId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 font-mono text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                  {hospitalErrors.hospitalId && (
                    <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.hospitalId}</p>
                  )}
                </div>

                {/* Hospital Type */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Hospital Classification / Type
                  </label>
                  <input
                    type="text"
                    value={editHospitalForm.hospitalType}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, hospitalType: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Administrator */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Hospital Administrator / Dean <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editHospitalForm.hospitalAdministrator}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, hospitalAdministrator: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                  {hospitalErrors.hospitalAdministrator && (
                    <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.hospitalAdministrator}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Emergency Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editHospitalForm.contactNumber}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, contactNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                  {hospitalErrors.contactNumber && (
                    <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.contactNumber}</p>
                  )}
                </div>

                {/* Official Email */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">
                    Official Institutional Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editHospitalForm.officialEmail}
                    onChange={(e) => setEditHospitalForm({ ...editHospitalForm, officialEmail: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                  />
                  {hospitalErrors.officialEmail && (
                    <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.officialEmail}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">
                  Physical Hospital Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editHospitalForm.address}
                  onChange={(e) => setEditHospitalForm({ ...editHospitalForm, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                />
                {hospitalErrors.address && (
                  <p className="text-[11px] text-red-600 mt-1">{hospitalErrors.address}</p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleCancelHospitalEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* 4. TAB 2: RESOURCE THRESHOLDS (Requirement 3 & 8)              */}
      {/* ============================================================== */}
      {activeSubTab === 'thresholds' && (
        <Card
          title="Hospital Resource & Bed Thresholds"
          subtitle="Define statutory minimum reserves, warning triggers, and critical alert limits based on live inventory."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveThresholds}
              disabled={isSavingThresholds}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              {isSavingThresholds ? 'Saving...' : 'Save Thresholds'}
            </Button>
          }
          noPadding
        >
          <div className="p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#2563A6]" />
              <span>
                <strong>Threshold Logic:</strong> Critical threshold triggers red emergency alerts; Warning threshold triggers amber early notification.
              </span>
            </div>
            <span className="font-semibold text-slate-700">Validated: Critical &le; Warning</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-3">Live Stock</th>
                  <th className="py-3 px-3">Status Indicator</th>
                  <th className="py-3 px-3">Min. Expected Base</th>
                  <th className="py-3 px-3">Warning Limit</th>
                  <th className="py-3 px-3">Critical Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {thresholdsForm.map(item => {
                  const status = getThresholdStatus(item.id, item.warningThreshold, item.criticalThreshold);
                  const error = thresholdErrors[item.id];

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1E293B]">{item.name}</div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{item.category}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`text-sm font-extrabold ${status.textColor}`}>
                            {status.live}
                          </span>{' '}
                          <span className="text-[11px] text-[#64748B]">{item.unit}</span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badgeColor}`}>
                            {status.level === 'critical' ? (
                              <AlertCircle className="w-3 h-3 text-red-600" />
                            ) : status.level === 'warning' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {status.badge}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.minQuantity}
                              onChange={(e) => handleThresholdChange(item.id, 'minQuantity', Number(e.target.value))}
                              className="w-20 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 font-bold text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:bg-white focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500">{item.unit}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.warningThreshold}
                              onChange={(e) => handleThresholdChange(item.id, 'warningThreshold', Number(e.target.value))}
                              className="w-20 text-xs bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1.5 font-bold text-amber-800 focus:ring-1 focus:ring-amber-500 focus:bg-white focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500">&lt; warn</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.criticalThreshold}
                              onChange={(e) => handleThresholdChange(item.id, 'criticalThreshold', Number(e.target.value))}
                              className="w-20 text-xs bg-red-50/70 border border-red-200 rounded-lg px-2.5 py-1.5 font-bold text-red-800 focus:ring-1 focus:ring-red-500 focus:bg-white focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500">&lt; alert</span>
                          </div>
                        </td>
                      </tr>

                      {error && (
                        <tr className="bg-red-50/50">
                          <td colSpan={6} className="py-2 px-4 text-xs font-semibold text-red-700">
                            &bull; {error}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>
              Real-time synchronization connected to Bed Master, Resource Registry, and Telemetry data stores.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveThresholds}
              disabled={isSavingThresholds}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Threshold Settings
            </Button>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 5. TAB 3: NOTIFICATION PREFERENCES (Requirement 4)             */}
      {/* ============================================================== */}
      {activeSubTab === 'notifications' && (
        <Card
          title="In-App Notification & Operational Alert Preferences"
          subtitle="Configure real-time dashboard notifications for clinical events, critical shortages, and pending approvals."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNotifications}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Notifications
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> MediSync AI operates dedicated in-app alerts, interactive notification banners, and status pills. External email/SMS dispatch channels are not simulated in this demo deployment.
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
              {/* 1. Low resource availability */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Low Resource Availability Warning</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Trigger an alert when any hospital stock or emergency supply drops below the warning threshold.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.lowResourceAvailability}
                  onChange={() => handleToggleNotification('lowResourceAvailability')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 2. Critical bed shortage */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Critical Bed Shortage Escalation</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Immediate notification when General, Emergency, or ICU available bed counts hit the critical threshold.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.criticalBedShortage}
                  onChange={() => handleToggleNotification('criticalBedShortage')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 3. Equipment offline */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Biomedical Equipment Offline Alert</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Alert the engineering desk when any telemetry device loses AC power, battery drops below 15%, or disconnects.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.equipmentOffline}
                  onChange={() => handleToggleNotification('equipmentOffline')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 4. Equipment maintenance */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Scheduled Maintenance & Calibration Reminders</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Periodic reminders for biomedical recalibration, filter servicing, and electrical safety certificates.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.equipmentMaintenance}
                  onChange={() => handleToggleNotification('equipmentMaintenance')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 5. Staff verification pending */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Staff Credential Verification Pending</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Notify hospital admin whenever newly registered doctors or nurses submit statutory licenses for validation.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.staffVerificationPending}
                  onChange={() => handleToggleNotification('staffVerificationPending')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 6. New resource requests */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">New Clinical Resource Requisitions</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Notify the warehouse dispatch desk when ward physicians log new general equipment requests.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.newResourceRequests}
                  onChange={() => handleToggleNotification('newResourceRequests')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 7. Urgent resource requests */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">High Priority / Urgent Clinical Requisitions</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Priority flash alerts for acute trauma requisitions, emergency ventilators, and life-support supplies.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.urgentResourceRequests}
                  onChange={() => handleToggleNotification('urgentResourceRequests')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* 8. Sound alerts */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors bg-slate-50/50">
                <div className="flex items-center gap-2">
                  {notificationsForm.soundAlerts ? <Volume2 className="w-4 h-4 text-[#2563A6]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <div className="text-xs font-bold text-[#1E293B]">Audible Dashboard Chime for Urgent Incidents</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Play an acoustic cue when critical bed shortages or urgent requisitions are detected.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.soundAlerts}
                  onChange={() => handleToggleNotification('soundAlerts')}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNotifications}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Notification Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 6. TAB 4: USER & ACCESS SETTINGS (Requirement 5)               */}
      {/* ============================================================== */}
      {activeSubTab === 'access' && (
        <Card
          title="User & Administrative Access Controls"
          subtitle="Hospital administrator profile, credential governance policies, and session lifecycle rules."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAccess}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Access Policies
            </Button>
          }
        >
          <div className="space-y-6">
            {/* Current Admin Account Card */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2563A6] text-white flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1E293B]">{user?.name || 'Institutional Administrator'}</span>
                    <Badge variant="primary" size="sm">
                      Hospital Admin
                    </Badge>
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">{user?.email || 'admin@medisync.gov.in'}</div>
                </div>
              </div>

              <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#15803D]" />
                <span>Statutory Role Verified: Full Hospital Command</span>
              </div>
            </div>

            {/* Access Policies Form */}
            <div className="space-y-4">
              {/* Session Timeout */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Session Inactivity Timeout</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Automatically terminate inactive administrative sessions to comply with clinical data governance.
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={accessForm.sessionTimeout}
                    onChange={(e) => setAccessForm({ ...accessForm, sessionTimeout: e.target.value as any })}
                    className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-bold focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
                  >
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour (Recommended)</option>
                    <option value="4h">4 Hours</option>
                    <option value="8h">8 Hours (Full Shift)</option>
                  </select>
                </div>
              </div>

              {/* Require verification for new staff */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Mandate Verification for Newly Registered Staff</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Prevent doctors and nurses from accessing clinical patient modules until credentials are confirmed by admin.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={accessForm.requireStaffVerification}
                  onChange={(e) => setAccessForm({ ...accessForm, requireStaffVerification: e.target.checked })}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* Allow staff profile updates */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Allow Staff Self-Service Profile Updates</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Allow registered hospital staff to update their contact phone and email without re-triggering full verification.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={accessForm.allowStaffProfileUpdates}
                  onChange={(e) => setAccessForm({ ...accessForm, allowStaffProfileUpdates: e.target.checked })}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>

              {/* Two Factor for admin actions */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Enforce Admin Authentication for High-Impact Actions</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Prompt password confirmation before rejecting staff licenses, purging ward telemetry, or resetting thresholds.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={accessForm.enforceAdminTwoFactor}
                  onChange={(e) => setAccessForm({ ...accessForm, enforceAdminTwoFactor: e.target.checked })}
                  className="w-4 h-4 accent-[#2563A6] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAccess}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Access Policies
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 7. TAB 5: SYSTEM PREFERENCES (Requirement 6)                   */}
      {/* ============================================================== */}
      {activeSubTab === 'system' && (
        <Card
          title="System Preferences & Regional Formatting"
          subtitle="Configure default dashboard landing view, report export standards, date formats, and layout density."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSystem}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Preferences
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Default Dashboard View */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Default Hospital Dashboard Landing Tab
                </label>
                <select
                  value={systemForm.defaultDashboardView}
                  onChange={(e) => setSystemForm({ ...systemForm, defaultDashboardView: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
                >
                  <option value="Hospital Overview">Hospital Overview</option>
                  <option value="Bed Master Status">Bed Master Status</option>
                  <option value="Clinical Wards">Clinical Wards</option>
                  <option value="Resource Registry">Resource Registry</option>
                  <option value="Readiness Reports">Readiness Reports</option>
                </select>
                <p className="text-[11px] text-[#64748B]">
                  Tab opened immediately upon logging into the Hospital Admin portal.
                </p>
              </div>

              {/* Report Export Format */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Default Report Export Format
                </label>
                <select
                  value={systemForm.reportExportFormat}
                  onChange={(e) => setSystemForm({ ...systemForm, reportExportFormat: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
                >
                  <option value="CSV (.csv)">CSV (.csv) — Standard Spreadsheet</option>
                  <option value="JSON (.json)">JSON (.json) — Machine Telemetry</option>
                </select>
                <p className="text-[11px] text-[#64748B]">
                  Default format when clicking Export in Readiness Reports.
                </p>
              </div>

              {/* Date Format */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Regional Date Display Format
                </label>
                <select
                  value={systemForm.dateFormat}
                  onChange={(e) => setSystemForm({ ...systemForm, dateFormat: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO International)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                </select>
                <p className="text-[11px] text-[#64748B]">
                  Applied across telemetry timestamps and audit history.
                </p>
              </div>

              {/* Time Format */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Regional Time Display Format
                </label>
                <select
                  value={systemForm.timeFormat}
                  onChange={(e) => setSystemForm({ ...systemForm, timeFormat: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
                >
                  <option value="12-hour (AM/PM)">12-hour (AM/PM e.g. 11:30 AM)</option>
                  <option value="24-hour">24-hour (Standard Military e.g. 23:30)</option>
                </select>
                <p className="text-[11px] text-[#64748B]">
                  Applied to bed turnaround logs and equipment telemetry.
                </p>
              </div>
            </div>

            {/* Compact Table Density */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#1E293B]">Compact Table Layout Density</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Reduce table padding to fit more data on clinical workstation screens.
                </div>
              </div>
              <input
                type="checkbox"
                checked={systemForm.compactTableDensity}
                onChange={(e) => setSystemForm({ ...systemForm, compactTableDensity: e.target.checked })}
                className="w-4 h-4 accent-[#2563A6] cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSystem}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save System Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 8. RESET TO DEFAULTS CONFIRMATION MODAL                        */}
      {/* ============================================================== */}
      {showResetModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowResetModal(false)}
          title="Reset All Hospital Settings to Factory Defaults?"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Irreversible Action
              </div>
              <p className="mt-1">
                This will reset all hospital details, resource availability thresholds, in-app notification toggles, and system preferences back to their factory demo defaults.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to proceed with resetting the configuration?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmReset}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Yes, Reset All Settings
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
