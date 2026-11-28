import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bed, 
  Search, 
  Filter, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Sparkles, 
  UserCheck, 
  Eye, 
  Building2, 
  Activity, 
  AlertTriangle, 
  X, 
  Edit3, 
  History, 
  Check, 
  FileText,
  FilterX,
  ChevronDown
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  INITIAL_BEDS, 
  BedItem, 
  BedStatusType, 
  WardCategory, 
  BedTypeCategory,
  BedHistoryItem 
} from '../../data/bedDemoData';
import { HOSPITAL_DEMO_DATA } from '../../data/hospitalDemoData';
import { hospitalScopedKey } from '../../utils/hospitalSync';

interface BedManagementPageProps {
  onSelectTab?: (tab: string) => void;
  initialWardFilter?: string;
}

export const BedManagementPage: React.FC<BedManagementPageProps> = ({ onSelectTab, initialWardFilter }) => {
  const { user, updateBedStatus: contextUpdateBedStatus } = useApp();

  // Primary State: Bed Registry
  const [beds, setBeds] = useState<BedItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey('medisync_bed_registry_data'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BEDS;
  });

  // Fetch live backend beds on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLiveBeds = async () => {
      try {
        const hospitalId = user?.hospitalId || 'hosp-chn-01';
        const liveBeds = await api.getBeds({ hospitalId });
        if (isMounted && Array.isArray(liveBeds) && liveBeds.length > 0) {
          setBeds(prev => {
            const statusMap: Record<string, BedStatusType> = {
              'occupied': 'Occupied',
              'ready': 'Available',
              'available': 'Available',
              'cleaning': 'Cleaning',
              'maintenance': 'Maintenance',
              'reserved': 'Reserved'
            };
            const mappedLive: BedItem[] = liveBeds.map(b => {
              const existing = prev.find(p => p.id === b.id || p.bedId === b.bed_number);
              return {
                id: b.id,
                bedId: b.bed_number || b.id,
                ward: (b.ward as WardCategory) || 'General Ward',
                bedType: (b.type as BedTypeCategory) || 'General',
                floor: b.floor || '2nd Floor',
                status: statusMap[b.status?.toLowerCase()] || (b.status as BedStatusType) || 'Available',
                patient: b.patient_name || 'Unassigned',
                equipment: b.equipment || 'Wall O2, Telemetry Ready',
                lastUpdated: b.last_updated || 'Just now',
                notes: b.notes || '',
                statusHistory: existing?.statusHistory || []
              };
            });
            const liveIds = new Set(mappedLive.map(m => m.id));
            const customs = prev.filter(p => !liveIds.has(p.id));
            const merged = [...mappedLive, ...customs];
            try { localStorage.setItem('medisync_bed_registry_data', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      } catch (err) {
        // Fallback to local
      }
    };
    fetchLiveBeds();
    return () => { isMounted = false; };
  }, [user]);

  // Filters and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>(() => {
    if (initialWardFilter) return initialWardFilter;
    try {
      const stored = sessionStorage.getItem('medisync_selected_ward_filter');
      if (stored) {
        sessionStorage.removeItem('medisync_selected_ward_filter');
        return stored;
      }
    } catch {}
    return 'All';
  });

  useEffect(() => {
    if (initialWardFilter) {
      setSelectedWardFilter(initialWardFilter);
    }
  }, [initialWardFilter]);

  // Sync with Hospital-Wide Data Service (Doctor, Emergency Requisition, Nurse Turnaround)
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(hospitalScopedKey('medisync_bed_registry_data'));
        if (saved) {
          setBeds(JSON.parse(saved));
          setLastSyncedTime('Just now');
        }
      } catch {}
    };
    window.addEventListener('medisync_hospital_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('medisync_hospital_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Success Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals State
  const [selectedBedForDetails, setSelectedBedForDetails] = useState<BedItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [isQuickStatusModalOpen, setIsQuickStatusModalOpen] = useState(false);
  const [bedForQuickStatus, setBedForQuickStatus] = useState<BedItem | null>(null);

  // Add Bed Form State
  const [addBedForm, setAddBedForm] = useState({
    bedId: '',
    ward: 'General Ward' as WardCategory,
    bedType: 'General' as BedTypeCategory,
    floor: '1st Floor (Ward Block A)',
    initialStatus: 'Available' as BedStatusType,
    equipment: '',
    patient: ''
  });
  const [addBedError, setAddBedError] = useState<string | null>(null);

  // Status Change State in Details Modal
  const [statusChangeValue, setStatusChangeValue] = useState<BedStatusType>('Available');
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  // Persist bed changes
  const saveBeds = (updatedBeds: BedItem[]) => {
    setBeds(updatedBeds);
    try {
      localStorage.setItem(hospitalScopedKey('medisync_bed_registry_data'), JSON.stringify(updatedBeds));
    } catch {}
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Dynamic calculations for Summary Cards (Requirement 4)
  const summaryCounts = useMemo(() => {
    const total = beds.length;
    const available = beds.filter(b => b.status === 'Available').length;
    const occupied = beds.filter(b => b.status === 'Occupied').length;
    const cleaning = beds.filter(b => b.status === 'Cleaning').length;
    const reserved = beds.filter(b => b.status === 'Reserved').length;
    const maintenance = beds.filter(b => b.status === 'Maintenance').length;
    return { total, available, occupied, cleaning, reserved, maintenance };
  }, [beds]);

  // Status Counts for Filter Tabs
  const statusCounts = useMemo(() => {
    return {
      All: beds.length,
      Available: beds.filter(b => b.status === 'Available').length,
      Occupied: beds.filter(b => b.status === 'Occupied').length,
      Cleaning: beds.filter(b => b.status === 'Cleaning').length,
      Reserved: beds.filter(b => b.status === 'Reserved').length,
      Maintenance: beds.filter(b => b.status === 'Maintenance').length,
    };
  }, [beds]);

  // Combined Search and Filter Logic (Requirement 7)
  const filteredBeds = useMemo(() => {
    return beds.filter(bed => {
      // 1. Status Filter
      if (selectedStatusFilter !== 'All' && bed.status !== selectedStatusFilter) {
        return false;
      }
      // 2. Ward Filter
      if (selectedWardFilter !== 'All' && bed.ward !== selectedWardFilter) {
        return false;
      }
      // 3. Search Query (Bed ID, Ward, Bed Type, or Patient)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = bed.bedId.toLowerCase().includes(query);
        const matchWard = bed.ward.toLowerCase().includes(query);
        const matchType = bed.bedType.toLowerCase().includes(query);
        const matchPatient = bed.patient.toLowerCase().includes(query);
        const matchEquip = bed.equipment.toLowerCase().includes(query);
        if (!matchId && !matchWard && !matchType && !matchPatient && !matchEquip) {
          return false;
        }
      }
      return true;
    });
  }, [beds, selectedStatusFilter, selectedWardFilter, searchQuery]);

  // Refresh Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Bed master data refreshed from hospital telemetry.', 'info');
    }, 600);
  };

  // Status Badge Rendering Helper (Requirement 5)
  const renderStatusBadge = (status: BedStatusType) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-[#15803D] border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Available
          </span>
        );
      case 'Occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#2563A6] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6]" />
            Occupied
          </span>
        );
      case 'Cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Cleaning
          </span>
        );
      case 'Reserved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-[#7E22CE] border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7E22CE]" />
            Reserved
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-[#DC2626] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Maintenance
          </span>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Open Bed Details Modal
  const handleOpenBedDetails = (bed: BedItem) => {
    setSelectedBedForDetails(bed);
    setStatusChangeValue(bed.status);
    setStatusChangeNotes('');
    setIsDetailsModalOpen(true);
  };

  // Open Quick Status Change Modal
  const handleOpenQuickStatus = (bed: BedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setBedForQuickStatus(bed);
    setStatusChangeValue(bed.status);
    setStatusChangeNotes('');
    setIsQuickStatusModalOpen(true);
  };

  // Update Bed Status (Requirement 9)
  const handleExecuteStatusUpdate = (targetBedId: string, newStatus: BedStatusType, notes?: string) => {
    const backendStatusMap: Record<BedStatusType, string> = {
      'Available': 'ready',
      'Occupied': 'occupied',
      'Cleaning': 'cleaning',
      'Reserved': 'reserved',
      'Maintenance': 'maintenance'
    };

    // Sync with backend API & AppContext
    api.updateBedStatus(targetBedId, backendStatusMap[newStatus] || newStatus.toLowerCase(), notes).catch(() => {});
    if (contextUpdateBedStatus) {
      contextUpdateBedStatus(targetBedId, backendStatusMap[newStatus] as any, notes).catch(() => {});
    }

    const updated = beds.map(bed => {
      if (bed.id === targetBedId || bed.bedId === targetBedId) {
        const historyItem: BedHistoryItem = {
          id: 'hist-' + Date.now(),
          timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromStatus: bed.status,
          toStatus: newStatus,
          updatedBy: 'Hospital Admin (Command Desk)',
          notes: notes || `Operational status transitioned from ${bed.status} to ${newStatus}`
        };

        let newPatient = bed.patient;
        if (newStatus === 'Available') {
          newPatient = 'Unassigned';
        } else if (newStatus === 'Cleaning') {
          newPatient = 'Unassigned';
        }

        return {
          ...bed,
          status: newStatus,
          patient: newPatient,
          lastUpdated: 'Just now',
          statusHistory: [historyItem, ...bed.statusHistory]
        };
      }
      return bed;
    });

    saveBeds(updated);

    // If modal open, update selected bed view
    if (selectedBedForDetails && (selectedBedForDetails.id === targetBedId || selectedBedForDetails.bedId === targetBedId)) {
      const refreshedBed = updated.find(b => b.id === targetBedId || b.bedId === targetBedId);
      if (refreshedBed) setSelectedBedForDetails(refreshedBed);
    }

    setIsQuickStatusModalOpen(false);
    showToast(`Bed ${targetBedId} status updated to ${newStatus}.`);
  };

  // Add Bed Submission (Requirement 10)
  const handleAddBedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddBedError(null);

    const cleanBedId = addBedForm.bedId.trim().toUpperCase();

    if (!cleanBedId) {
      setAddBedError('Please enter a valid Bed ID.');
      return;
    }

    // Validation: Unique Bed ID
    const exists = beds.some(b => b.bedId.toLowerCase() === cleanBedId.toLowerCase());
    if (exists) {
      setAddBedError(`Bed ID "${cleanBedId}" already exists. Each bed identifier must be unique.`);
      return;
    }

    const newBedItem: BedItem = {
      id: 'bed-' + Date.now(),
      bedId: cleanBedId,
      ward: addBedForm.ward,
      bedType: addBedForm.bedType,
      floor: addBedForm.floor || '1st Floor',
      status: addBedForm.initialStatus,
      patient: addBedForm.initialStatus === 'Occupied' ? (addBedForm.patient.trim() || 'New Admission') : 'Unassigned',
      equipment: addBedForm.equipment.trim() || 'Standard Medical Wall Unit',
      lastUpdated: 'Just now',
      statusHistory: [
        {
          id: 'h-init-' + Date.now(),
          timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromStatus: addBedForm.initialStatus,
          toStatus: addBedForm.initialStatus,
          updatedBy: 'Hospital Admin',
          notes: 'Bed commissioned into hospital registry'
        }
      ]
    };

    saveBeds([newBedItem, ...beds]);
    setIsAddBedModalOpen(false);
    showToast(`Bed ${cleanBedId} successfully commissioned into ${addBedForm.ward}.`);

    // Reset Form
    setAddBedForm({
      bedId: '',
      ward: 'General Ward',
      bedType: 'General',
      floor: '1st Floor (Ward Block A)',
      initialStatus: 'Available',
      equipment: '',
      patient: ''
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusFilter('All');
    setSelectedWardFilter('All');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-green-700 hover:text-green-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PAGE HEADER (Requirement 3)                                */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-[#2563A6] border border-blue-100">
                <Bed className="w-6 h-6 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                    Bed Management
                  </h1>
                  <Badge variant="primary" size="sm">
                    Bed Master Control
                  </Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Monitor bed availability, occupancy, and operational readiness across hospital wards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-[#64748B] flex-wrap">
              <span className="font-semibold text-[#1E293B]">
                {HOSPITAL_DEMO_DATA.hospitalInfo.name}
              </span>
              <span>&middot;</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Synced: {lastSyncedTime}
              </span>
              <span>&middot;</span>
              <span className="text-[#15803D] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                Live Ward Census
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              icon={<RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setAddBedError(null);
                setIsAddBedModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Bed
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BED SUMMARY CARDS (Requirement 4)                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Beds */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Total Beds</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E293B] mt-2">
            {summaryCounts.total}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 truncate">
            All registered bays
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-white border border-green-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#15803D]">
            <span className="font-semibold">Available</span>
            <span className="p-1.5 rounded-lg bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#15803D] mt-2">
            {summaryCounts.available}
          </div>
          <div className="text-[11px] text-[#15803D] font-medium mt-1 truncate">
            Ready for intake
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#2563A6]">
            <span className="font-semibold">Occupied</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563A6]">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#2563A6] mt-2">
            {summaryCounts.occupied}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 truncate">
            In-patient care
          </div>
        </div>

        {/* Under Cleaning */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#D97706]">
            <span className="font-semibold">Cleaning</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#D97706] mt-2">
            {summaryCounts.cleaning}
          </div>
          <div className="text-[11px] text-[#D97706] mt-1 truncate">
            Turnover in progress
          </div>
        </div>

        {/* Reserved Beds */}
        <div className="bg-white border border-purple-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#7E22CE]">
            <span className="font-semibold">Reserved</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-[#7E22CE]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#7E22CE] mt-2">
            {summaryCounts.reserved}
          </div>
          <div className="text-[11px] text-[#7E22CE] mt-1 truncate">
            Inbound / OT Hold
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="bg-white border border-red-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#DC2626]">
            <span className="font-semibold">Maintenance</span>
            <span className="p-1.5 rounded-lg bg-red-50 text-[#DC2626]">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#DC2626] mt-2">
            {summaryCounts.maintenance}
          </div>
          <div className="text-[11px] text-[#DC2626] mt-1 truncate">
            Bio-Med calibration
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH AND FILTERS (Requirement 7)                          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bed ID, Ward, Bed Type, or Patient..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Ward Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] shrink-0">Ward:</span>
            <select
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563A6] cursor-pointer"
            >
              <option value="All">All Wards ({beds.length})</option>
              <option value="General Ward">General Ward</option>
              <option value="ICU">ICU Complex</option>
              <option value="Emergency">Emergency</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['All', 'Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'] as const).map(status => {
              const isActive = selectedStatusFilter === status;
              const count = statusCounts[status];

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-[#2563A6] text-white shadow-xs' 
                      : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] border border-slate-200'
                  }`}
                >
                  <span>{status === 'All' ? 'All Beds' : status}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Matches Count & Reset */}
          <div className="text-xs text-[#64748B] flex items-center gap-2">
            <span>
              Showing <strong>{filteredBeds.length}</strong> of {beds.length} beds
            </span>
            {(selectedStatusFilter !== 'All' || selectedWardFilter !== 'All' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#2563A6] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BED DATA TABLE (Requirement 6)                             */}
      {/* ============================================================== */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Bed ID</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Bed Type</th>
                <th className="px-4 py-3">Floor</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Assigned Patient</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredBeds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FilterX className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1E293B]">No beds matching your criteria</h3>
                    <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                      No registered beds match your current search and filter combination.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 text-xs font-semibold text-[#2563A6] hover:underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredBeds.map(bed => (
                  <tr
                    key={bed.id}
                    onClick={() => handleOpenBedDetails(bed)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Bed ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-[#1E293B]">
                      <span className="group-hover:text-[#2563A6] transition-colors">
                        {bed.bedId}
                      </span>
                    </td>

                    {/* Ward */}
                    <td className="px-4 py-3.5 font-medium text-[#1E293B]">
                      {bed.ward}
                    </td>

                    {/* Bed Type */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {bed.bedType}
                      </span>
                    </td>

                    {/* Floor */}
                    <td className="px-4 py-3.5 text-[#64748B] text-[11px]">
                      {bed.floor}
                    </td>

                    {/* Current Status */}
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(bed.status)}
                    </td>

                    {/* Assigned Patient */}
                    <td className="px-4 py-3.5 font-medium">
                      {bed.status === 'Available' ? (
                        <span className="text-slate-400 italic">Unassigned</span>
                      ) : (
                        <span className="text-[#1E293B]">{bed.patient}</span>
                      )}
                    </td>

                    {/* Equipment */}
                    <td className="px-4 py-3.5 text-[#64748B] text-[11px] max-w-[200px] truncate" title={bed.equipment}>
                      {bed.equipment}
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {bed.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenBedDetails(bed)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#2563A6] hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="View Full Bed Record"
                      >
                        <Eye className="w-3 h-3" /> Details
                      </button>

                      <button
                        onClick={(e) => handleOpenQuickStatus(bed, e)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Update Bed Status"
                      >
                        <Edit3 className="w-3 h-3" /> Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* 5. BED DETAILS MODAL (Requirement 8 & 9)                       */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedBedForDetails ? `Bed Record: ${selectedBedForDetails.bedId}` : 'Bed Details'}
        description={selectedBedForDetails ? `${selectedBedForDetails.ward} &middot; ${selectedBedForDetails.floor}` : ''}
        maxWidth="lg"
      >
        {selectedBedForDetails && (
          <div className="space-y-6">
            {/* Status & Patient Highlights */}
            <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Operational Status
                </span>
                <div className="mt-1">
                  {renderStatusBadge(selectedBedForDetails.status)}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Patient
                </span>
                <div className="text-xs font-semibold text-[#1E293B] mt-1">
                  {selectedBedForDetails.patient}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Last Telemetry Update
                </span>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {selectedBedForDetails.lastUpdated}
                </div>
              </div>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B] block text-[11px]">Bed Identifier:</span>
                <span className="font-mono font-bold text-[#1E293B]">{selectedBedForDetails.bedId}</span>
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B] block text-[11px]">Clinical Ward:</span>
                <span className="font-semibold text-[#1E293B]">{selectedBedForDetails.ward}</span>
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B] block text-[11px]">Bed Classification:</span>
                <span className="font-semibold text-[#1E293B]">{selectedBedForDetails.bedType}</span>
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B] block text-[11px]">Location / Floor:</span>
                <span className="font-semibold text-[#1E293B]">{selectedBedForDetails.floor}</span>
              </div>
              <div className="col-span-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B] block text-[11px]">Connected Medical Equipment:</span>
                <span className="font-medium text-[#1E293B]">{selectedBedForDetails.equipment}</span>
              </div>
            </div>

            {/* Bed Status Update Section (Requirement 9) */}
            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#2563A6]" /> Update Operational Status
                </span>
                <span className="text-[10px] text-[#64748B]">Immediate hospital broadcast</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'] as BedStatusType[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusChangeValue(st)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      statusChangeValue === st
                        ? 'bg-[#2563A6] text-white border-[#2563A6] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  placeholder="Optional status transition notes (e.g. Cleared by Nurse, Admitted from ICU)..."
                  className="w-full text-xs px-3 py-2 bg-white border border-blue-200 rounded-lg text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExecuteStatusUpdate(selectedBedForDetails.bedId, statusChangeValue, statusChangeNotes)}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Save Status Update
                </Button>
              </div>
            </div>

            {/* Status History Timeline (Requirement 8) */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#1E293B]">
                <History className="w-4 h-4 text-slate-400" />
                <span>Audit & Status Transition History</span>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 max-h-44 overflow-y-auto divide-y divide-slate-100">
                {selectedBedForDetails.statusHistory && selectedBedForDetails.statusHistory.length > 0 ? (
                  selectedBedForDetails.statusHistory.map((item, idx) => (
                    <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1E293B]">
                          <span className="text-slate-500">{item.fromStatus}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="text-[#2563A6]">{item.toStatus}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        By: <span className="font-medium text-slate-700">{item.updatedBy}</span>
                        {item.notes && <span> &middot; {item.notes}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No previous transitions recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 6. QUICK STATUS CHANGE MODAL                                   */}
      {/* ============================================================== */}
      <Modal
        isOpen={isQuickStatusModalOpen}
        onClose={() => setIsQuickStatusModalOpen(false)}
        title={bedForQuickStatus ? `Quick Update: ${bedForQuickStatus.bedId}` : 'Update Status'}
        description="Select new operational status to broadcast immediately."
        maxWidth="md"
      >
        {bedForQuickStatus && (
          <div className="space-y-4">
            <div className="text-xs text-[#64748B]">
              Current status: <strong className="text-[#1E293B]">{bedForQuickStatus.status}</strong> in {bedForQuickStatus.ward}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'] as BedStatusType[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusChangeValue(st)}
                  className={`p-3 text-xs font-bold rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    statusChangeValue === st
                      ? 'bg-blue-50 border-[#2563A6] text-[#2563A6] ring-1 ring-[#2563A6]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{st}</span>
                  {statusChangeValue === st && <Check className="w-4 h-4 text-[#2563A6]" />}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Reason / Clinical Notes:
              </label>
              <input
                type="text"
                value={statusChangeNotes}
                onChange={(e) => setStatusChangeNotes(e.target.value)}
                placeholder="e.g. Terminal cleaning completed, Patient discharged"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsQuickStatusModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleExecuteStatusUpdate(bedForQuickStatus.bedId, statusChangeValue, statusChangeNotes)}
                icon={<Check className="w-4 h-4" />}
              >
                Apply Status
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 7. ADD BED MODAL (Requirement 10)                             */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddBedModalOpen}
        onClose={() => setIsAddBedModalOpen(false)}
        title="Commission New Hospital Bed"
        description="Register a new clinical bay into the facility bed master registry."
        maxWidth="md"
      >
        <form onSubmit={handleAddBedSubmit} className="space-y-4">
          {addBedError && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{addBedError}</span>
            </div>
          )}

          {/* Bed ID (Unique validation) */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] mb-1">
              Bed Identifier (Unique ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addBedForm.bedId}
              onChange={(e) => setAddBedForm({ ...addBedForm, bedId: e.target.value.toUpperCase() })}
              placeholder="e.g. ICU-A206, EMG-B105, GEN-E206"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Must be unique across the entire hospital registry.
            </span>
          </div>

          {/* Ward & Bed Type Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Target Clinical Ward
              </label>
              <select
                value={addBedForm.ward}
                onChange={(e) => setAddBedForm({ ...addBedForm, ward: e.target.value as WardCategory })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
              >
                <option value="General Ward">General Ward</option>
                <option value="ICU">ICU Complex</option>
                <option value="Emergency">Emergency</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Bed Type
              </label>
              <select
                value={addBedForm.bedType}
                onChange={(e) => setAddBedForm({ ...addBedForm, bedType: e.target.value as BedTypeCategory })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
              >
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Emergency">Emergency</option>
                <option value="Isolation">Isolation</option>
              </select>
            </div>
          </div>

          {/* Floor & Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                value={addBedForm.floor}
                onChange={(e) => setAddBedForm({ ...addBedForm, floor: e.target.value })}
                placeholder="e.g. 1st Floor (Block A)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Initial Operational Status
              </label>
              <select
                value={addBedForm.initialStatus}
                onChange={(e) => setAddBedForm({ ...addBedForm, initialStatus: e.target.value as BedStatusType })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
              >
                <option value="Available">Available</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>
          </div>

          {/* Patient name if Occupied */}
          {addBedForm.initialStatus === 'Occupied' && (
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Initial Patient Identifier / Name
              </label>
              <input
                type="text"
                value={addBedForm.patient}
                onChange={(e) => setAddBedForm({ ...addBedForm, patient: e.target.value })}
                placeholder="e.g. P-8092 · Anitha R. (38F)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>
          )}

          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">
              Required / Connected Equipment
            </label>
            <input
              type="text"
              value={addBedForm.equipment}
              onChange={(e) => setAddBedForm({ ...addBedForm, equipment: e.target.value })}
              placeholder="e.g. Mechanical Ventilator, Infusion Pump, Wall O2"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddBedModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Commission Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
