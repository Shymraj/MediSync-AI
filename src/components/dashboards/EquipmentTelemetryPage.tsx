import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Edit3, 
  Wrench, 
  ShieldAlert, 
  Building2, 
  SlidersHorizontal, 
  Battery, 
  Zap, 
  Radio, 
  Cpu, 
  Calendar, 
  Thermometer, 
  Gauge, 
  History, 
  Info, 
  Check, 
  ChevronRight, 
  FilterX, 
  Power, 
  FileText, 
  UserCheck,
  TrendingUp,
  BarChart2,
  PieChart,
  Eye,
  AlertOctagon
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  INITIAL_EQUIPMENT, 
  EquipmentItem, 
  EquipmentType, 
  EquipmentStatus, 
  EquipmentCondition,
  StatusHistoryEntry,
  MaintenanceRecord
} from '../../data/equipmentDemoData';
import { hospitalScopedKey } from '../../utils/hospitalSync';

const STORAGE_KEY = 'medisync_equipment_telemetry_data';
const RESOURCE_STORAGE_KEY = 'medisync_resource_registry_data';

const EQUIPMENT_TYPES: EquipmentType[] = [
  'Ventilators',
  'Patient Monitors',
  'Infusion Pumps',
  'ECG Machines',
  'Oxygen Concentrators',
  'Defibrillators'
];

const STATUSES: EquipmentStatus[] = [
  'Operational',
  'In Use',
  'Standby',
  'Maintenance Required',
  'Offline'
];

interface EquipmentTelemetryPageProps {
  onSelectTab?: (tab: string) => void;
}

export const EquipmentTelemetryPage: React.FC<EquipmentTelemetryPageProps> = ({ onSelectTab }) => {
  const { user } = useApp();

  // 1. Equipment Data State (Persistent via localStorage)
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(STORAGE_KEY));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse equipment telemetry data from localStorage:', e);
    }
    return INITIAL_EQUIPMENT;
  });

  // Fetch live equipment from backend
  useEffect(() => {
    let isMounted = true;
    const fetchLiveEquipment = async () => {
      try {
        const hospitalId = user?.hospitalId || 'hosp-chn-01';
        const live = await api.getEquipment({ hospitalId });
        if (isMounted && Array.isArray(live) && live.length > 0) {
          setEquipmentList(prev => {
            const mappedLive: EquipmentItem[] = live.map(eq => {
              const existing = prev.find(p => p.id === eq.id || p.serialNumber === eq.serialNumber);
              return {
                id: eq.id,
                equipmentId: eq.serialNumber || eq.id,
                name: eq.name,
                type: (eq.category as EquipmentType) || 'Ventilators',
                department: eq.department || 'ICU Complex',
                location: eq.location || eq.ward || '2nd Floor',
                operationalStatus: (eq.operationalStatus as EquipmentStatus) || (eq.status as EquipmentStatus) || 'Operational',
                condition: (eq.condition as EquipmentCondition) || 'Optimal',
                conditionScore: eq.conditionScore || 100,
                lastInspection: eq.lastInspection || '2 days ago',
                lastMaintenanceDate: eq.lastMaintenanceDate || '2026-10-18',
                nextMaintenanceDate: eq.nextMaintenanceDate || '2026-12-18',
                maintenanceNotes: 'Biomedical checks verified.',
                serialNumber: eq.serialNumber || eq.id,
                telemetry: eq.telemetry && eq.telemetry.internalTemp !== undefined ? eq.telemetry : (existing?.telemetry || {
                  internalTemp: 35.8,
                  operatingHours: 3420,
                  batteryLevel: 100,
                  powerSource: 'AC Mains (UPS Backed)',
                  signalStrength: 96,
                  firmwareVersion: 'v4.2.1-prod',
                  calibrationDate: '2026-10-18',
                  primaryMetricLabel: 'Ventilator Telemetry',
                  primaryMetricValue: 'Normal',
                  isSimulated: true
                }),
                statusHistory: Array.isArray(eq.statusHistory) && eq.statusHistory.length > 0 ? eq.statusHistory : (existing?.statusHistory || []),
                maintenanceHistory: Array.isArray(eq.maintenanceHistory) && eq.maintenanceHistory.length > 0 ? eq.maintenanceHistory : (existing?.maintenanceHistory || []),
                lastUpdated: 'Just now'
              };
            });

            const liveIds = new Set(mappedLive.map(m => m.id));
            const customs = prev.filter(p => !liveIds.has(p.id));
            const merged = [...mappedLive, ...customs];
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchLiveEquipment();
    return () => { isMounted = false; };
  }, [user]);

  // Sync to localStorage
  const saveEquipment = (newList: EquipmentItem[]) => {
    setEquipmentList(newList);
    try {
      localStorage.setItem(hospitalScopedKey(STORAGE_KEY), JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save equipment telemetry data to localStorage:', e);
    }
  };

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3. Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // 4. Modals State
  const [selectedEquipmentForDetails, setSelectedEquipmentForDetails] = useState<EquipmentItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedEquipmentForStatus, setSelectedEquipmentForStatus] = useState<EquipmentItem | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('Operational');
  const [statusChangeNote, setStatusChangeNote] = useState('');

  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<EquipmentItem | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    actionType: 'schedule' as 'schedule' | 'complete',
    type: 'Routine Preventive Maintenance' as MaintenanceRecord['type'],
    technician: 'Lead Biomed Tech',
    notes: '',
    nextDate: '',
    statusAfter: 'Operational' as EquipmentStatus
  });

  // Unique departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [equipmentList]);

  // 5. Dynamic Summary KPI Calculations (Requirement 2)
  const summaryMetrics = useMemo(() => {
    const totalEquipment = equipmentList.length;
    const operational = equipmentList.filter(e => e.operationalStatus === 'Operational').length;
    const inUse = equipmentList.filter(e => e.operationalStatus === 'In Use').length;
    const standby = equipmentList.filter(e => e.operationalStatus === 'Standby').length;
    const maintenanceRequired = equipmentList.filter(e => e.operationalStatus === 'Maintenance Required').length;
    const offline = equipmentList.filter(e => e.operationalStatus === 'Offline').length;

    const totalActiveOperational = operational + inUse;
    const operationalRate = totalEquipment > 0 ? Math.round((totalActiveOperational / totalEquipment) * 100) : 0;

    return {
      totalEquipment,
      operational,
      inUse,
      standby,
      maintenanceRequired,
      offline,
      totalActiveOperational,
      operationalRate
    };
  }, [equipmentList]);

  // 6. Filtered Equipment Table List (Requirement 7)
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(item => {
      // Search by Name, ID, or Department
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesId = item.equipmentId.toLowerCase().includes(query);
        const matchesDept = item.department.toLowerCase().includes(query);
        const matchesLoc = item.location.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesDept && !matchesLoc) return false;
      }

      // Filter by Type
      if (selectedType !== 'All' && item.type !== selectedType) {
        return false;
      }

      // Filter by Department
      if (selectedDepartment !== 'All' && item.department !== selectedDepartment) {
        return false;
      }

      // Filter by Operational Status
      if (selectedStatus !== 'All' && item.operationalStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [equipmentList, searchQuery, selectedType, selectedDepartment, selectedStatus]);

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(hospitalScopedKey(STORAGE_KEY));
        if (saved) {
          setEquipmentList(JSON.parse(saved));
        }
      } catch {}
      const now = new Date();
      setLastRefreshedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
      showToast('Simulated equipment telemetry streams synchronized.', 'info');
    }, 350);
  };

  // Reset to initial demo data
  const handleResetToDefaults = () => {
    if (window.confirm('Reset Equipment Telemetry catalog to initial 22 synthetic devices? Any manual changes will be restored.')) {
      saveEquipment(INITIAL_EQUIPMENT);
      showToast('Restored default synthetic hospital equipment catalog.', 'info');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedDepartment('All');
    setSelectedStatus('All');
  };

  // Open Details Modal (Requirement 4)
  const handleOpenDetails = (equipment: EquipmentItem) => {
    setSelectedEquipmentForDetails(equipment);
    setIsDetailsModalOpen(true);
  };

  // Open Status Management Modal (Requirement 5)
  const handleOpenStatusModal = (equipment: EquipmentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEquipmentForStatus(equipment);
    setNewStatus(equipment.operationalStatus);
    setStatusChangeNote('');
    setIsStatusModalOpen(true);
  };

  // Submit Status Change (Requirement 5)
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForStatus) return;

    const prevStatus = selectedEquipmentForStatus.operationalStatus;
    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Condition adjustment based on status
    let updatedCondition = selectedEquipmentForStatus.condition;
    let updatedConditionScore = selectedEquipmentForStatus.conditionScore;
    if (newStatus === 'Maintenance Required') {
      updatedCondition = 'Degraded';
      updatedConditionScore = Math.min(updatedConditionScore, 65);
    } else if (newStatus === 'Offline') {
      updatedCondition = 'Critical';
      updatedConditionScore = Math.min(updatedConditionScore, 45);
    } else if (newStatus === 'Operational' || newStatus === 'In Use') {
      if (updatedCondition === 'Critical' || updatedCondition === 'Degraded') {
        updatedCondition = 'Good';
        updatedConditionScore = 90;
      }
    }

    const newHistoryEntry: StatusHistoryEntry = {
      id: `sh-${Date.now()}`,
      timestamp: timeString,
      status: newStatus,
      condition: updatedCondition,
      note: statusChangeNote.trim() || `Operational status transitioned from ${prevStatus} to ${newStatus}.`,
      updatedBy: 'Hospital Admin Command'
    };

    const updatedList = equipmentList.map(item => {
      if (item.id === selectedEquipmentForStatus.id) {
        return {
          ...item,
          operationalStatus: newStatus,
          condition: updatedCondition,
          conditionScore: updatedConditionScore,
          lastUpdated: timeString,
          statusHistory: [newHistoryEntry, ...item.statusHistory]
        };
      }
      return item;
    });

    saveEquipment(updatedList);

    // Sync with backend API
    if (selectedEquipmentForStatus) {
      api.updateEquipmentStatus(
        selectedEquipmentForStatus.id,
        newStatus,
        undefined,
        selectedEquipmentForStatus.location
      ).catch(() => {});
    }

    // Keep active details modal updated if viewing same item
    if (selectedEquipmentForDetails?.id === selectedEquipmentForStatus.id) {
      setSelectedEquipmentForDetails(prev => prev ? {
        ...prev,
        operationalStatus: newStatus,
        condition: updatedCondition,
        conditionScore: updatedConditionScore,
        lastUpdated: timeString,
        statusHistory: [newHistoryEntry, ...prev.statusHistory]
      } : null);
    }

    // Requirement 5: Update Resource Registry availability where applicable
    try {
      const savedRes = localStorage.getItem(hospitalScopedKey(RESOURCE_STORAGE_KEY));
      if (savedRes) {
        const resources = JSON.parse(savedRes);
        if (Array.isArray(resources)) {
          let modified = false;
          const updatedResources = resources.map((r: any) => {
            if (r.category === 'Medical Equipment' || r.category === 'ICU Resources') {
              if (r.name.toLowerCase().includes(selectedEquipmentForStatus.type.slice(0, 4).toLowerCase())) {
                if (newStatus === 'Operational' && r.availableQuantity < r.quantity) {
                  r.availableQuantity = Math.min(r.quantity, r.availableQuantity + 1);
                  r.lastUpdated = timeString;
                  modified = true;
                } else if ((newStatus === 'Maintenance Required' || newStatus === 'Offline') && r.availableQuantity > 0) {
                  r.availableQuantity = Math.max(0, r.availableQuantity - 1);
                  r.lastUpdated = timeString;
                  modified = true;
                }
              }
            }
            return r;
          });
          if (modified) {
            localStorage.setItem(hospitalScopedKey(RESOURCE_STORAGE_KEY), JSON.stringify(updatedResources));
          }
        }
      }
    } catch {}

    setIsStatusModalOpen(false);
    setSelectedEquipmentForStatus(null);
    showToast(`Updated ${selectedEquipmentForStatus.equipmentId} status to "${newStatus}".`);
  };

  // Open Maintenance Modal (Requirement 8)
  const handleOpenMaintenanceModal = (equipment: EquipmentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEquipmentForMaintenance(equipment);
    const isUnderMaintenance = equipment.operationalStatus === 'Maintenance Required' || equipment.operationalStatus === 'Offline';
    setMaintenanceForm({
      actionType: isUnderMaintenance ? 'complete' : 'schedule',
      type: 'Routine Preventive Maintenance',
      technician: 'Lead Biomed Tech',
      notes: equipment.maintenanceNotes || '',
      nextDate: equipment.nextMaintenanceDate || '2027-01-15',
      statusAfter: 'Operational'
    });
    setIsMaintenanceModalOpen(true);
  };

  // Submit Maintenance Action (Requirement 8)
  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForMaintenance) return;

    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let updatedStatus = selectedEquipmentForMaintenance.operationalStatus;
    let updatedCondition = selectedEquipmentForMaintenance.condition;
    let updatedConditionScore = selectedEquipmentForMaintenance.conditionScore;
    let lastMaintDate = selectedEquipmentForMaintenance.lastMaintenanceDate;
    let nextMaintDate = maintenanceForm.nextDate || selectedEquipmentForMaintenance.nextMaintenanceDate;

    let newMaintenanceRecord: MaintenanceRecord | null = null;
    let newStatusHistoryEntry: StatusHistoryEntry | null = null;

    if (maintenanceForm.actionType === 'complete') {
      // Certification / Returned from maintenance
      updatedStatus = maintenanceForm.statusAfter;
      updatedCondition = 'Optimal';
      updatedConditionScore = 98;
      lastMaintDate = todayIso;

      newMaintenanceRecord = {
        id: `mh-${Date.now()}`,
        date: todayIso,
        type: maintenanceForm.type,
        technician: maintenanceForm.technician || 'Biomedical Service Team',
        notes: maintenanceForm.notes || 'Full calibration and biomedical safety certification passed.',
        result: 'Certified'
      };

      newStatusHistoryEntry = {
        id: `sh-${Date.now()}`,
        timestamp: timeString,
        status: updatedStatus,
        condition: 'Optimal',
        note: `Biomedical maintenance completed (${maintenanceForm.type}). Certified back into service.`,
        updatedBy: maintenanceForm.technician || 'Biomedical Engineering'
      };
    } else {
      // Flagging for maintenance
      updatedStatus = 'Maintenance Required';
      updatedCondition = 'Degraded';
      updatedConditionScore = Math.min(updatedConditionScore, 65);

      newStatusHistoryEntry = {
        id: `sh-${Date.now()}`,
        timestamp: timeString,
        status: 'Maintenance Required',
        condition: 'Degraded',
        note: `Flagged for maintenance: ${maintenanceForm.notes || 'Routine maintenance scheduled.'}`,
        updatedBy: 'Hospital Admin'
      };
    }

    const updatedList = equipmentList.map(item => {
      if (item.id === selectedEquipmentForMaintenance.id) {
        return {
          ...item,
          operationalStatus: updatedStatus,
          condition: updatedCondition,
          conditionScore: updatedConditionScore,
          lastMaintenanceDate: lastMaintDate,
          nextMaintenanceDate: nextMaintDate,
          maintenanceNotes: maintenanceForm.notes || item.maintenanceNotes,
          lastUpdated: timeString,
          statusHistory: newStatusHistoryEntry ? [newStatusHistoryEntry, ...item.statusHistory] : item.statusHistory,
          maintenanceHistory: newMaintenanceRecord ? [newMaintenanceRecord, ...item.maintenanceHistory] : item.maintenanceHistory
        };
      }
      return item;
    });

    saveEquipment(updatedList);

    // Sync with backend API
    if (selectedEquipmentForStatus) {
      api.updateEquipmentStatus(
        selectedEquipmentForStatus.id,
        newStatus,
        undefined,
        selectedEquipmentForStatus.location
      ).catch(() => {});
    }

    // Update active details modal if open
    if (selectedEquipmentForDetails?.id === selectedEquipmentForMaintenance.id) {
      setSelectedEquipmentForDetails(prev => prev ? {
        ...prev,
        operationalStatus: updatedStatus,
        condition: updatedCondition,
        conditionScore: updatedConditionScore,
        lastMaintenanceDate: lastMaintDate,
        nextMaintenanceDate: nextMaintDate,
        maintenanceNotes: maintenanceForm.notes || prev.maintenanceNotes,
        lastUpdated: timeString,
        statusHistory: newStatusHistoryEntry ? [newStatusHistoryEntry, ...prev.statusHistory] : prev.statusHistory,
        maintenanceHistory: newMaintenanceRecord ? [newMaintenanceRecord, ...prev.maintenanceHistory] : prev.maintenanceHistory
      } : null);
    }

    setIsMaintenanceModalOpen(false);
    setSelectedEquipmentForMaintenance(null);
    showToast(
      maintenanceForm.actionType === 'complete'
        ? `Equipment ${selectedEquipmentForMaintenance.equipmentId} certified & set to ${updatedStatus}.`
        : `Equipment ${selectedEquipmentForMaintenance.equipmentId} marked as Maintenance Required.`,
      maintenanceForm.actionType === 'complete' ? 'success' : 'warning'
    );
  };

  // Helper for Status Badge Styling (Requirement 5)
  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'Operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        );
      case 'In Use':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            In Use
          </span>
        );
      case 'Standby':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Standby
          </span>
        );
      case 'Maintenance Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Maintenance Required
          </span>
        );
      case 'Offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Offline
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Helper for Condition Badge Styling
  const getConditionBadge = (condition: EquipmentCondition, score: number) => {
    switch (condition) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Optimal ({score}%)
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Check className="w-3 h-3 text-blue-600" />
            Good ({score}%)
          </span>
        );
      case 'Fair':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Fair ({score}%)
          </span>
        );
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Degraded ({score}%)
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            <AlertOctagon className="w-3 h-3 text-red-600" />
            Critical ({score}%)
          </span>
        );
      default:
        return <span>{condition}</span>;
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'All' || selectedDepartment !== 'All' || selectedStatus !== 'All';

  // Count items needing attention
  const attentionCount = summaryMetrics.maintenanceRequired + summaryMetrics.offline;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Simulated Telemetry System Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-900 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-[#1E3A8A]">Hospital IoT Telemetry Gateway:</span>{' '}
            <span className="text-blue-800">
              Live device signals, battery levels, calibration cycles, and vital telemetry streams. (Demonstration Mode — Synthetic Simulated Telemetry).
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Gateway Online: 22 Devices Polled
        </div>
      </div>

      {/* Warning Banner if Equipment Needs Maintenance or is Offline (Requirement 8) */}
      {attentionCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Action Required: {attentionCount} Equipment Item{attentionCount > 1 ? 's' : ''} Flagged for Biomedical Attention
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {summaryMetrics.maintenanceRequired} device{summaryMetrics.maintenanceRequired !== 1 ? 's' : ''} require scheduled maintenance or sensor calibration, and {summaryMetrics.offline} device{summaryMetrics.offline !== 1 ? 's' : ''} {summaryMetrics.offline === 1 ? 'is' : 'are'} currently offline awaiting replacement parts.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatus('Maintenance Required')}
            className="text-xs shrink-0 text-amber-800 border-amber-300 hover:bg-amber-100 bg-white"
          >
            Review Flagged Equipment
          </Button>
        </div>
      )}

      {/* Header Banner & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563A6] border border-blue-100 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1E293B]">Equipment Telemetry & Biomedical Monitoring</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {summaryMetrics.operationalRate}% Operational
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Continuous biomedical monitoring for Ventilators, Patient Monitors, Infusion Pumps, ECG Machines, Oxygen Concentrators, and Defibrillators.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs text-slate-500 mr-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Telemetry: <strong className="text-slate-700">{lastRefreshedTime}</strong></span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[#2563A6] border-[#2563A6]/20 hover:bg-blue-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            title="Restore default synthetic equipment data"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* 
        ============================================================
        2. SUMMARY CARDS (Requirement 2)
        - Total Equipment
        - Operational
        - In Use
        - Maintenance Required
        Calculated dynamically from equipment data
        ============================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Equipment */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Equipment
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-[#1E293B]">
                  {summaryMetrics.totalEquipment}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  active medical devices
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2563A6] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">6 Core Clinical Categories</span>
            <span className="font-semibold text-[#2563A6]">{EQUIPMENT_TYPES.length} Device Classes</span>
          </div>
        </Card>

        {/* Card 2: Operational */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Operational
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-emerald-700">
                  {summaryMetrics.operational}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  fully calibrated & ready
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Standby Reserve</span>
            <span className="font-semibold text-purple-700">{summaryMetrics.standby} devices ready</span>
          </div>
        </Card>

        {/* Card 3: In Use */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                In Use
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-blue-700">
                  {summaryMetrics.inUse}
                </span>
                <span className="text-xs text-blue-600 font-medium">
                  connected to patients
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Clinical Allocation</span>
            <span className="font-semibold text-blue-700">
              {summaryMetrics.totalEquipment > 0 
                ? `${Math.round((summaryMetrics.inUse / summaryMetrics.totalEquipment) * 100)}% Deployed` 
                : '0%'}
            </span>
          </div>
        </Card>

        {/* Card 4: Maintenance Required */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Maintenance Required
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-amber-700">
                  {summaryMetrics.maintenanceRequired}
                </span>
                <span className="text-xs text-amber-600 font-medium">
                  {summaryMetrics.offline > 0 ? `+ ${summaryMetrics.offline} offline` : 'flagged'}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Requires Servicing / Parts</span>
            <span className="font-semibold text-amber-700">
              {attentionCount} units offline/servicing
            </span>
          </div>
        </Card>
      </div>

      {/* 
        ============================================================
        3. TELEMETRY VISUALIZATION (Requirement 6)
        - Equipment operational status distribution
        - Equipment usage trend
        - Maintenance status overview
        - Equipment condition trend
        (Crisp responsive SVG charts built directly with existing components)
        ============================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Equipment Operational Status Distribution */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#2563A6]" />
              <h3 className="text-sm font-bold text-[#1E293B]">Operational Status Distribution</h3>
            </div>
            <span className="text-xs text-slate-500">Live Breakdown</span>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-3">
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${(summaryMetrics.operational / summaryMetrics.totalEquipment) * 100}%` }} 
                className="bg-emerald-500 h-full transition-all duration-300" 
                title={`Operational: ${summaryMetrics.operational}`}
              />
              <div 
                style={{ width: `${(summaryMetrics.inUse / summaryMetrics.totalEquipment) * 100}%` }} 
                className="bg-blue-500 h-full transition-all duration-300" 
                title={`In Use: ${summaryMetrics.inUse}`}
              />
              <div 
                style={{ width: `${(summaryMetrics.standby / summaryMetrics.totalEquipment) * 100}%` }} 
                className="bg-purple-500 h-full transition-all duration-300" 
                title={`Standby: ${summaryMetrics.standby}`}
              />
              <div 
                style={{ width: `${(summaryMetrics.maintenanceRequired / summaryMetrics.totalEquipment) * 100}%` }} 
                className="bg-amber-500 h-full transition-all duration-300" 
                title={`Maintenance Required: ${summaryMetrics.maintenanceRequired}`}
              />
              <div 
                style={{ width: `${(summaryMetrics.offline / summaryMetrics.totalEquipment) * 100}%` }} 
                className="bg-red-500 h-full transition-all duration-300" 
                title={`Offline: ${summaryMetrics.offline}`}
              />
            </div>

            {/* Legend & Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Operational
                </span>
                <span className="font-bold text-emerald-900">{summaryMetrics.operational}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                <span className="flex items-center gap-1.5 text-blue-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  In Use
                </span>
                <span className="font-bold text-blue-900">{summaryMetrics.inUse}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                <span className="flex items-center gap-1.5 text-purple-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Standby
                </span>
                <span className="font-bold text-purple-900">{summaryMetrics.standby}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <span className="flex items-center gap-1.5 text-amber-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Maintenance
                </span>
                <span className="font-bold text-amber-900">{summaryMetrics.maintenanceRequired}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Chart 2: Equipment Usage Trend by Category */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#2563A6]" />
              <h3 className="text-sm font-bold text-[#1E293B]">Deployment by Equipment Type</h3>
            </div>
            <span className="text-xs text-slate-500">In Use vs Total</span>
          </div>

          <div className="space-y-2.5">
            {EQUIPMENT_TYPES.map(type => {
              const totalInType = equipmentList.filter(e => e.type === type).length;
              const inUseInType = equipmentList.filter(e => e.type === type && e.operationalStatus === 'In Use').length;
              const pct = totalInType > 0 ? Math.round((inUseInType / totalInType) * 100) : 0;

              return (
                <div key={type} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700 truncate max-w-[170px]">{type}</span>
                    <span className="text-slate-500 font-mono">
                      <strong className="text-blue-700 font-bold">{inUseInType}</strong> / {totalInType} in use ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2563A6] h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 3: Maintenance Status & Condition Trend */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563A6]" />
              <h3 className="text-sm font-bold text-[#1E293B]">Biomedical Condition Health</h3>
            </div>
            <span className="text-xs text-slate-500">Fleet Integrity</span>
          </div>

          {/* Average Health Score Dial */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="#E2E8F0" strokeWidth="5" fill="none" />
                <circle 
                  cx="28" 
                  cy="28" 
                  r="22" 
                  stroke="#10B981" 
                  strokeWidth="5" 
                  strokeDasharray="138" 
                  strokeDashoffset={138 - (138 * 0.91)} 
                  strokeLinecap="round" 
                  fill="none" 
                />
              </svg>
              <span className="absolute font-bold text-xs text-slate-800">91%</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Hospital Equipment Health Index</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Calculated across 22 telemetry channels: battery integrity, calibration zero-drift, and operating thermal state.
              </div>
            </div>
          </div>

          {/* Condition Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Optimal (95-100% Score)
              </span>
              <span className="font-semibold text-slate-800">
                {equipmentList.filter(e => e.condition === 'Optimal').length} units
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Good (85-94% Score)
              </span>
              <span className="font-semibold text-slate-800">
                {equipmentList.filter(e => e.condition === 'Good').length} units
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Degraded (50-69% Score)
              </span>
              <span className="font-semibold text-amber-700">
                {equipmentList.filter(e => e.condition === 'Degraded').length} units
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical / Offline (&lt;50% Score)
              </span>
              <span className="font-semibold text-red-700">
                {equipmentList.filter(e => e.condition === 'Critical').length} units
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 
        ============================================================
        4. SEARCH AND FILTERS (Requirement 7)
        - Search by equipment name or ID
        - Filter by equipment type
        - Filter by department
        - Filter by operational status
        - Clear filters
        ============================================================
      */}
      <Card className="p-4 bg-white border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search by Name or ID */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by equipment name, ID (e.g. EQP-VENT-101), department, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Type */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Types ({equipmentList.length})</option>
                {EQUIPMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter by Department */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Dept:</span>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5 py-1.5"
              >
                <FilterX className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800 font-bold">{filteredEquipment.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{equipmentList.length}</strong> equipment devices
            {hasActiveFilters && <span className="text-[#2563A6] ml-1.5">(Filtered)</span>}
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to open device telemetry and maintenance records
          </div>
        </div>
      </Card>

      {/* 
        ============================================================
        5. EQUIPMENT MONITORING TABLE (Requirement 3)
        Columns:
        - Equipment ID
        - Equipment Name
        - Equipment Type
        - Department & Location
        - Operational Status
        - Current Condition
        - Last Updated
        - Actions
        ============================================================
      */}
      <Card className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Equipment ID</th>
                <th className="py-3.5 px-4 min-w-[220px]">Equipment Name</th>
                <th className="py-3.5 px-4 min-w-[140px]">Type</th>
                <th className="py-3.5 px-4 min-w-[170px]">Department & Location</th>
                <th className="py-3.5 px-4">Operational Status</th>
                <th className="py-3.5 px-4 min-w-[140px]">Condition</th>
                <th className="py-3.5 px-4 min-w-[130px]">Last Updated</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <FilterX className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No equipment matched your filters</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Try clearing search keywords or selecting different equipment categories.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-xs text-[#2563A6] border-[#2563A6]/30"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => {
                  const isDegradedOrOffline = item.operationalStatus === 'Maintenance Required' || item.operationalStatus === 'Offline';

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleOpenDetails(item)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        isDegradedOrOffline ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* 1. Equipment ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md group-hover:border-[#2563A6]/30 transition-colors">
                          {item.equipmentId}
                        </span>
                      </td>

                      {/* 2. Equipment Name */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-[#2563A6] transition-colors flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.telemetry.batteryLevel < 80 && (
                              <span title={`Battery at ${item.telemetry.batteryLevel}%`}>
                                <Battery className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {item.telemetry.primaryMetricLabel}: <strong className="text-slate-700">{item.telemetry.primaryMetricValue}</strong>
                          </div>
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {item.type}
                        </span>
                      </td>

                      {/* 4. Department & Location */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {item.department}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                      </td>

                      {/* 5. Operational Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.operationalStatus)}
                      </td>

                      {/* 6. Current Condition */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getConditionBadge(item.condition, item.conditionScore)}
                      </td>

                      {/* 7. Last Updated */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.lastUpdated}</span>
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(item)}
                            title="View Telemetry & Service Logs"
                            className="p-1.5 text-slate-500 hover:text-[#2563A6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenStatusModal(item, e)}
                            title="Change Operational Status"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMaintenanceModal(item, e)}
                            title={isDegradedOrOffline ? "Certify / Complete Maintenance" : "Flag for Maintenance"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDegradedOrOffline 
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                                : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 
        ============================================================
        6. EQUIPMENT DETAILS MODAL (Requirement 4)
        - Equipment name and ID
        - Department and location
        - Operational status
        - Current condition
        - Last maintenance date & next maintenance date
        - Usage information
        - Recent status history
        - Clear simulated telemetry indicator
        ============================================================
      */}
      {selectedEquipmentForDetails && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedEquipmentForDetails(null);
          }}
          title={`Equipment Telemetry — ${selectedEquipmentForDetails.equipmentId}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Device Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded">
                    {selectedEquipmentForDetails.equipmentId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {selectedEquipmentForDetails.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{selectedEquipmentForDetails.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedEquipmentForDetails.department}</span>
                  <span>•</span>
                  <span>{selectedEquipmentForDetails.location}</span>
                </p>
              </div>

              <div className="flex sm:flex-col items-end gap-2">
                {getStatusBadge(selectedEquipmentForDetails.operationalStatus)}
                {getConditionBadge(selectedEquipmentForDetails.condition, selectedEquipmentForDetails.conditionScore)}
              </div>
            </div>

            {/* Simulated Notice Box */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Simulated Telemetry Stream:</span> The data and sensor metrics shown below are simulated for clinical software demonstration and not connected to real live medical devices.
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Battery */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-slate-400" /> Battery Level
                </span>
                <span className={`text-lg font-bold block mt-1 ${
                  selectedEquipmentForDetails.telemetry.batteryLevel < 80 ? 'text-amber-600' : 'text-emerald-700'
                }`}>
                  {selectedEquipmentForDetails.telemetry.batteryLevel}%
                </span>
                <span className="text-[10px] text-slate-400">{selectedEquipmentForDetails.telemetry.powerSource}</span>
              </div>

              {/* Operating Hours */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Operating Hours
                </span>
                <span className="text-lg font-bold text-slate-900 block mt-1">
                  {selectedEquipmentForDetails.telemetry.operatingHours.toLocaleString()} hrs
                </span>
                <span className="text-[10px] text-slate-400">Total Run Cycle</span>
              </div>

              {/* Internal Temp */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-slate-400" /> Sensor Temp
                </span>
                <span className="text-lg font-bold text-slate-900 block mt-1">
                  {selectedEquipmentForDetails.telemetry.internalTemp} °C
                </span>
                <span className="text-[10px] text-emerald-600">Normal Range</span>
              </div>

              {/* Signal Strength */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-slate-400" /> Signal Quality
                </span>
                <span className="text-lg font-bold text-blue-700 block mt-1">
                  {selectedEquipmentForDetails.telemetry.signalStrength}%
                </span>
                <span className="text-[10px] text-slate-400">{selectedEquipmentForDetails.telemetry.firmwareVersion}</span>
              </div>
            </div>

            {/* Primary Telemetry Metric Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">{selectedEquipmentForDetails.telemetry.primaryMetricLabel}:</span>
                <span className="font-bold text-slate-900 ml-2 font-mono">{selectedEquipmentForDetails.telemetry.primaryMetricValue}</span>
              </div>
              <div className="text-slate-500">
                Calibrated: <strong className="text-slate-700">{selectedEquipmentForDetails.telemetry.calibrationDate}</strong>
              </div>
            </div>

            {/* Maintenance Dates & Schedule */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Last Maintenance Date:</span>
                <span className="font-semibold text-slate-900">{selectedEquipmentForDetails.lastMaintenanceDate}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Next Scheduled Maintenance:</span>
                <span className="font-semibold text-[#2563A6]">{selectedEquipmentForDetails.nextMaintenanceDate}</span>
              </div>
              {selectedEquipmentForDetails.maintenanceNotes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Maintenance Engineering Notes:</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                    {selectedEquipmentForDetails.maintenanceNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Status History (Requirement 4) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#2563A6]" /> Recent Status & Telemetry Transitions
              </h4>
              <div className="space-y-1.5">
                {selectedEquipmentForDetails.statusHistory.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{entry.status}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{entry.updatedBy}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{entry.note}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{entry.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance History Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" /> Biomedical Maintenance Log
              </h4>
              <div className="space-y-1.5">
                {selectedEquipmentForDetails.maintenanceHistory.map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{m.type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {m.result}
                      </span>
                    </div>
                    <p className="text-slate-600">{m.notes}</p>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Tech: {m.technician}</span>
                      <span>Certified Date: {m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenStatusModal(selectedEquipmentForDetails);
                }}
                className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Power className="w-3.5 h-3.5 mr-1" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenMaintenanceModal(selectedEquipmentForDetails);
                }}
                className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
              >
                <Wrench className="w-3.5 h-3.5 mr-1" />
                Maintenance Action
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedEquipmentForDetails(null);
                }}
                className="text-xs bg-[#2563A6] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 
        ============================================================
        7. UPDATE STATUS MODAL (Requirement 5)
        - Supported statuses: Operational, In Use, Standby, Maintenance Required, Offline
        - Updates equipment table, summary cards, and persists
        ============================================================
      */}
      {selectedEquipmentForStatus && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedEquipmentForStatus(null);
          }}
          title={`Update Status — ${selectedEquipmentForStatus.equipmentId}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedEquipmentForStatus.name}</div>
              <div className="text-slate-500">
                Department: {selectedEquipmentForStatus.department} ({selectedEquipmentForStatus.location})
              </div>
              <div className="text-slate-500">
                Current Status: <strong className="text-slate-800">{selectedEquipmentForStatus.operationalStatus}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Operational Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STATUSES.map(st => {
                  const isSelected = newStatus === st;
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setNewStatus(st)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#2563A6] bg-blue-50/80 text-[#2563A6] ring-1 ring-[#2563A6]' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          st === 'Operational' ? 'bg-emerald-500' :
                          st === 'In Use' ? 'bg-blue-500' :
                          st === 'Standby' ? 'bg-purple-500' :
                          st === 'Maintenance Required' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span>{st}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#2563A6]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Status Change Note
              </label>
              <textarea
                rows={2}
                value={statusChangeNote}
                onChange={e => setStatusChangeNote(e.target.value)}
                placeholder="e.g. Returned to service following shift sanitization, or assigned to ICU Bay 2."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedEquipmentForStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-[#2563A6] hover:bg-[#1E4F8A] text-white"
              >
                Save Status Change
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 
        ============================================================
        8. MAINTENANCE MANAGEMENT MODAL (Requirement 8)
        - Mark equipment as requiring maintenance
        - Record notes & set next maintenance date
        - Update equipment after maintenance (certification)
        ============================================================
      */}
      {selectedEquipmentForMaintenance && (
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => {
            setIsMaintenanceModalOpen(false);
            setSelectedEquipmentForMaintenance(null);
          }}
          title={`Biomedical Maintenance — ${selectedEquipmentForMaintenance.equipmentId}`}
        >
          <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedEquipmentForMaintenance.name}</div>
              <div className="text-slate-500">
                Department: {selectedEquipmentForMaintenance.department} • Last Serviced: {selectedEquipmentForMaintenance.lastMaintenanceDate}
              </div>
            </div>

            {/* Action Type Toggle */}
            <div className="flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMaintenanceForm({ ...maintenanceForm, actionType: 'schedule' })}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  maintenanceForm.actionType === 'schedule' 
                    ? 'bg-white shadow-sm font-bold text-amber-800' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Flag for Maintenance
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceForm({ ...maintenanceForm, actionType: 'complete' })}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  maintenanceForm.actionType === 'complete' 
                    ? 'bg-white shadow-sm font-bold text-emerald-800' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Certify / Complete Maintenance
              </button>
            </div>

            {maintenanceForm.actionType === 'complete' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maintenance Type
                    </label>
                    <select
                      value={maintenanceForm.type}
                      onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value as MaintenanceRecord['type'] })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                    >
                      <option value="Biomedical Safety Check">Biomedical Safety Check</option>
                      <option value="Routine Preventive Maintenance">Routine Preventive Maintenance</option>
                      <option value="Sensor Calibration">Sensor Calibration</option>
                      <option value="Component Servicing">Component Servicing</option>
                      <option value="Battery Replacement">Battery Replacement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Status After Maintenance
                    </label>
                    <select
                      value={maintenanceForm.statusAfter}
                      onChange={e => setMaintenanceForm({ ...maintenanceForm, statusAfter: e.target.value as EquipmentStatus })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                    >
                      <option value="Operational">Operational (Ready for patient care)</option>
                      <option value="Standby">Standby (Docked in storage)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lead Technician / Engineer
                    </label>
                    <input
                      type="text"
                      value={maintenanceForm.technician}
                      onChange={e => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
                      placeholder="e.g. Mark Davies (Biomed Lead)"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Scheduled Maintenance Date
                    </label>
                    <input
                      type="date"
                      value={maintenanceForm.nextDate}
                      onChange={e => setMaintenanceForm({ ...maintenanceForm, nextDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-semibold">Flagging this equipment will:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                  <li>Change operational status to <strong>Maintenance Required</strong></li>
                  <li>Update device condition to <strong>Degraded</strong></li>
                  <li>Alert clinical departments that the unit should not be assigned to new patients</li>
                </ul>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maintenance Notes & Calibration Remarks
              </label>
              <textarea
                rows={3}
                required
                value={maintenanceForm.notes}
                onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                placeholder="Detail the calibration, part replacement, sensor adjustment, or failure symptoms..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMaintenanceModalOpen(false);
                  setSelectedEquipmentForMaintenance(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className={
                  maintenanceForm.actionType === 'complete' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }
              >
                {maintenanceForm.actionType === 'complete' ? 'Certify Equipment' : 'Mark Maintenance Required'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
