import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Search, 
  Filter, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  Stethoscope, 
  HeartHandshake, 
  Phone, 
  MapPin, 
  Eye, 
  AlertTriangle, 
  X, 
  Users, 
  Layers, 
  Activity, 
  FilterX, 
  Check, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { INITIAL_WARDS, WardItem } from '../../data/wardDemoData';
import { INITIAL_BEDS, BedItem, BedStatusType } from '../../data/bedDemoData';
import { HOSPITAL_DEMO_DATA } from '../../data/hospitalDemoData';

interface ClinicalWardsPageProps {
  onSelectTab?: (tab: string, wardFilter?: string) => void;
}

export const ClinicalWardsPage: React.FC<ClinicalWardsPageProps> = ({ onSelectTab }) => {
  // Shared Bed Data Source (Requirement 6)
  const [beds, setBeds] = useState<BedItem[]>(() => {
    try {
      const saved = localStorage.getItem('medisync_bed_registry_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BEDS;
  });

  // Wards Registry State
  const [wards, setWards] = useState<WardItem[]>(() => {
    try {
      const saved = localStorage.getItem('medisync_wards_registry_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WARDS;
  });

  // UI & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals State
  const [selectedWardForDetails, setSelectedWardForDetails] = useState<WardItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);

  // Add Ward Form State
  const [addWardForm, setAddWardForm] = useState({
    wardId: '',
    name: '',
    wardType: 'General In-Patient Care',
    floor: '1st Floor (Ward Block A)',
    initialBedCapacity: 4,
    assignedDoctor: '',
    assignedNurse: '',
    contact: '',
    description: '',
    operationalStatus: 'Active' as WardItem['operationalStatus']
  });
  const [addWardError, setAddWardError] = useState<string | null>(null);

  // Refresh beds from shared localStorage whenever refreshed or mounted
  const reloadBedData = () => {
    try {
      const saved = localStorage.getItem('medisync_bed_registry_data');
      if (saved) setBeds(JSON.parse(saved));
    } catch {}
  };

  useEffect(() => {
    reloadBedData();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      reloadBedData();
      setIsRefreshing(false);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Clinical wards and telemetry synchronized.', 'info');
    }, 600);
  };

  // Helper: calculate dynamic bed metrics for a specific ward (Requirement 6)
  const getWardBedStats = (wardKey: string) => {
    const keyLower = wardKey.toLowerCase();
    const wardBeds = beds.filter(b => {
      const bWard = b.ward.toLowerCase();
      return bWard.includes(keyLower) || keyLower.includes(bWard);
    });

    const total = wardBeds.length;
    const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
    const available = wardBeds.filter(b => b.status === 'Available').length;
    const cleaning = wardBeds.filter(b => b.status === 'Cleaning').length;
    const reserved = wardBeds.filter(b => b.status === 'Reserved').length;
    const maintenance = wardBeds.filter(b => b.status === 'Maintenance').length;
    const occupancyPercentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, cleaning, reserved, maintenance, occupancyPercentage };
  };

  // Dynamic Overall Summary Calculations (Requirement 4)
  const overallSummary = useMemo(() => {
    const totalWards = wards.length;
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    const availableBeds = beds.filter(b => b.status === 'Available').length;
    const bedsUnderPrep = beds.filter(b => b.status === 'Cleaning' || b.status === 'Maintenance').length;

    return { totalWards, totalBeds, occupiedBeds, availableBeds, bedsUnderPrep };
  }, [wards, beds]);

  // Filtered Wards List (Requirement 8)
  const filteredWards = useMemo(() => {
    return wards.filter(ward => {
      // Status Filter
      if (selectedStatusFilter !== 'All' && ward.operationalStatus !== selectedStatusFilter) {
        return false;
      }
      // Ward Type Filter
      if (selectedTypeFilter !== 'All') {
        const typeMatch = ward.wardType.toLowerCase().includes(selectedTypeFilter.toLowerCase());
        if (!typeMatch) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ward.name.toLowerCase().includes(q);
        const matchId = ward.wardId.toLowerCase().includes(q);
        const matchFloor = ward.floor.toLowerCase().includes(q);
        const matchDoctor = ward.assignedDoctor.toLowerCase().includes(q);
        const matchNurse = ward.assignedNurse.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchFloor && !matchDoctor && !matchNurse) {
          return false;
        }
      }
      return true;
    });
  }, [wards, selectedStatusFilter, selectedTypeFilter, searchQuery]);

  // Navigate to Bed Management filtered by this ward (Requirement 7)
  const handleNavigateToWardBeds = (wardMatchingKey: string) => {
    sessionStorage.setItem('medisync_selected_ward_filter', wardMatchingKey);
    setIsDetailsModalOpen(false);

    if (onSelectTab) {
      onSelectTab('beds', wardMatchingKey);
    } else {
      window.location.hash = '#/hospital/beds';
    }
  };

  // Open Ward Details Modal
  const handleOpenWardDetails = (ward: WardItem) => {
    setSelectedWardForDetails(ward);
    setIsDetailsModalOpen(true);
  };

  // Add Ward Form Submission (Requirement 9)
  const handleAddWardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddWardError(null);

    const cleanWardId = addWardForm.wardId.trim().toUpperCase();
    const cleanName = addWardForm.name.trim();

    if (!cleanWardId || !cleanName) {
      setAddWardError('Please enter a valid Ward ID and Ward Name.');
      return;
    }

    // Validation: Unique Ward ID
    const exists = wards.some(w => w.wardId.toLowerCase() === cleanWardId.toLowerCase());
    if (exists) {
      setAddWardError(`Ward ID "${cleanWardId}" already exists. Each ward ID must be unique.`);
      return;
    }

    const newWardItem: WardItem = {
      id: 'ward-' + Date.now(),
      wardId: cleanWardId,
      name: cleanName,
      wardType: addWardForm.wardType,
      floor: addWardForm.floor || '1st Floor',
      assignedDoctor: addWardForm.assignedDoctor.trim() || 'Attending Clinical Staff',
      assignedNurse: addWardForm.assignedNurse.trim() || 'Ward Nurse In-Charge',
      contact: addWardForm.contact.trim() || 'Station Internal Ext.',
      operationalStatus: addWardForm.operationalStatus,
      description: addWardForm.description.trim() || 'Commissioned in-patient clinical ward.',
      bedMatchingKey: cleanName
    };

    // Also generate initial beds in the shared bed registry
    const initialBedsCount = Math.max(1, Number(addWardForm.initialBedCapacity) || 4);
    const prefix = cleanWardId.replace('WRD-', '');
    const newBeds: BedItem[] = [];

    for (let i = 1; i <= initialBedsCount; i++) {
      newBeds.push({
        id: `bed-${Date.now()}-${i}`,
        bedId: `${prefix}-B${100 + i}`,
        ward: cleanName as any,
        bedType: addWardForm.wardType.includes('Critical') || addWardForm.wardType.includes('ICU') ? 'ICU' : 'General',
        floor: addWardForm.floor || '1st Floor',
        status: i === 1 ? 'Occupied' : 'Available',
        patient: i === 1 ? 'Admitted Patient' : 'Unassigned',
        equipment: 'Standard Clinical Unit, Wall Oxygen Port',
        lastUpdated: 'Just now',
        statusHistory: [
          {
            id: `hist-init-${Date.now()}-${i}`,
            timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fromStatus: 'Available',
            toStatus: i === 1 ? 'Occupied' : 'Available',
            updatedBy: 'Facility Medical Superintendent',
            notes: `Commissioned with ${cleanName}`
          }
        ]
      });
    }

    const updatedWards = [...wards, newWardItem];
    const updatedBeds = [...beds, ...newBeds];

    setWards(updatedWards);
    setBeds(updatedBeds);

    try {
      localStorage.setItem('medisync_wards_registry_data', JSON.stringify(updatedWards));
      localStorage.setItem('medisync_bed_registry_data', JSON.stringify(updatedBeds));
    } catch {}

    setIsAddWardModalOpen(false);
    showToast(`Ward ${cleanName} (${cleanWardId}) commissioned with ${initialBedsCount} initial beds.`);

    // Reset Form
    setAddWardForm({
      wardId: '',
      name: '',
      wardType: 'General In-Patient Care',
      floor: '1st Floor (Ward Block A)',
      initialBedCapacity: 4,
      assignedDoctor: '',
      assignedNurse: '',
      contact: '',
      description: '',
      operationalStatus: 'Active'
    });
  };

  const getOperationalStatusBadge = (status: WardItem['operationalStatus']) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" size="sm" dot>Active Operations</Badge>;
      case 'High Occupancy':
        return <Badge variant="warning" size="sm" dot>High Occupancy</Badge>;
      case 'Full Capacity':
        return <Badge variant="critical" size="sm" dot>Full Capacity</Badge>;
      case 'Under Sanitization':
        return <Badge variant="secondary" size="sm" dot>Sanitization</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
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
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                    Clinical Wards
                  </h1>
                  <Badge variant="primary" size="sm">
                    Inpatient Units Control
                  </Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Monitor ward capacity, patient occupancy, bed readiness, and clinical staff assignments.
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
                Live Ward Synchronization
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
                setAddWardError(null);
                setIsAddWardModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Ward
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. WARD SUMMARY CARDS (Requirement 4)                         */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Wards */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Total Wards</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E293B] mt-2">
            {overallSummary.totalWards}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 truncate">
            Clinical inpatient units
          </div>
        </div>

        {/* Total Beds */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Total Beds</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563A6]">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E293B] mt-2">
            {overallSummary.totalBeds}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 truncate">
            Across all active wards
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#2563A6]">
            <span className="font-semibold">Occupied Beds</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563A6]">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#2563A6] mt-2">
            {overallSummary.occupiedBeds}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 truncate">
            Active in-patient care
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-white border border-green-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#15803D]">
            <span className="font-semibold">Available Beds</span>
            <span className="p-1.5 rounded-lg bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#15803D] mt-2">
            {overallSummary.availableBeds}
          </div>
          <div className="text-[11px] text-[#15803D] font-medium mt-1 truncate">
            Ready for instant intake
          </div>
        </div>

        {/* Beds Under Preparation */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#D97706]">
            <span className="font-semibold">Under Preparation</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#D97706] mt-2">
            {overallSummary.bedsUnderPrep}
          </div>
          <div className="text-[11px] text-[#D97706] mt-1 truncate">
            Sanitization & service
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH AND FILTERS (Requirement 8)                          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ward Name, Ward ID, Floor, or Doctor..."
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

          {/* Operational Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] shrink-0">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563A6] cursor-pointer"
            >
              <option value="All">All Statuses ({wards.length})</option>
              <option value="Active">Active Operations</option>
              <option value="High Occupancy">High Occupancy</option>
              <option value="Full Capacity">Full Capacity</option>
              <option value="Under Sanitization">Under Sanitization</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#64748B] mr-1">Classification:</span>
            {['All', 'General', 'Critical', 'Emergency', 'Cardiology', 'Neurology', 'Pediatric'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedTypeFilter === type 
                    ? 'bg-[#2563A6] text-white shadow-xs' 
                    : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] border border-slate-200'
                }`}
              >
                {type === 'All' ? 'All Wards' : type}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#64748B] flex items-center gap-2">
            <span>Showing <strong>{filteredWards.length}</strong> of {wards.length} wards</span>
            {(selectedStatusFilter !== 'All' || selectedTypeFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('All');
                  setSelectedTypeFilter('All');
                }}
                className="text-xs font-semibold text-[#2563A6] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. WARD OVERVIEW CARDS (Requirement 5 & 6)                    */}
      {/* ============================================================== */}
      {filteredWards.length === 0 ? (
        <Card className="py-12 text-center bg-white border border-[#E2E8F0]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FilterX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]">No clinical wards match your criteria</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or classification filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatusFilter('All');
              setSelectedTypeFilter('All');
            }}
            className="mt-3 text-xs font-semibold text-[#2563A6] hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWards.map(ward => {
            const stats = getWardBedStats(ward.bedMatchingKey);

            return (
              <div
                key={ward.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[#2563A6]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Ward Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2563A6] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1E293B]">
                          {ward.name}
                        </h3>
                        <span className="font-mono text-[11px] text-slate-500 font-medium">
                          {ward.wardId}
                        </span>
                      </div>
                    </div>
                    {getOperationalStatusBadge(ward.operationalStatus)}
                  </div>

                  <p className="text-xs text-[#64748B] flex items-center gap-1.5 mb-3.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ward.floor}</span>
                  </p>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#64748B]">Occupancy Rate:</span>
                      <span className="font-black text-[#1E293B]">{stats.occupancyPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          stats.occupancyPercentage >= 90 ? 'bg-[#DC2626]' :
                          stats.occupancyPercentage >= 70 ? 'bg-[#D97706]' : 'bg-[#2563A6]'
                        }`}
                        style={{ width: `${Math.min(100, stats.occupancyPercentage)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>{stats.occupied} occupied</span>
                      <span>{stats.total} total capacity</span>
                    </div>
                  </div>

                  {/* Dynamic Bed Stats Grid (Requirement 6) */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-green-50/70 border border-green-200/70 rounded-lg">
                      <div className="text-[10px] font-bold text-[#15803D] uppercase">Ready</div>
                      <div className="text-base font-black text-[#15803D] mt-0.5">{stats.available}</div>
                      <div className="text-[9px] text-[#15803D]">Beds</div>
                    </div>

                    <div className="p-2 bg-blue-50/70 border border-blue-200/70 rounded-lg">
                      <div className="text-[10px] font-bold text-[#2563A6] uppercase">Occupied</div>
                      <div className="text-base font-black text-[#2563A6] mt-0.5">{stats.occupied}</div>
                      <div className="text-[9px] text-[#2563A6]">Beds</div>
                    </div>

                    <div className="p-2 bg-amber-50/70 border border-amber-200/70 rounded-lg">
                      <div className="text-[10px] font-bold text-[#D97706] uppercase">Cleaning</div>
                      <div className="text-base font-black text-[#D97706] mt-0.5">{stats.cleaning}</div>
                      <div className="text-[9px] text-[#D97706]">Turnover</div>
                    </div>
                  </div>

                  {/* Clinical Staff Assignments */}
                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-[#1E293B]">
                      <Stethoscope className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      <span className="text-[#64748B]">Physician:</span>
                      <span className="font-semibold truncate">{ward.assignedDoctor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1E293B]">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#2563A6] shrink-0" />
                      <span className="text-[#64748B]">Nurse:</span>
                      <span className="font-semibold truncate">{ward.assignedNurse}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => handleOpenWardDetails(ward)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => handleNavigateToWardBeds(ward.bedMatchingKey)}
                    icon={<Bed className="w-3.5 h-3.5" />}
                  >
                    Ward Beds
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. WARD DETAILS MODAL (Requirement 7)                          */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedWardForDetails ? `${selectedWardForDetails.name} (${selectedWardForDetails.wardId})` : 'Ward Details'}
        description={selectedWardForDetails ? `${selectedWardForDetails.wardType} &middot; ${selectedWardForDetails.floor}` : ''}
        maxWidth="lg"
      >
        {selectedWardForDetails && (() => {
          const stats = getWardBedStats(selectedWardForDetails.bedMatchingKey);

          return (
            <div className="space-y-6">
              {/* Top Highlights Banner */}
              <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Operational Status
                  </span>
                  <div className="mt-1">
                    {getOperationalStatusBadge(selectedWardForDetails.operationalStatus)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Occupancy Rate
                  </span>
                  <div className="text-sm font-black text-[#1E293B] mt-1">
                    {stats.occupancyPercentage}% ({stats.occupied} / {stats.total} beds)
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ward Extension
                  </span>
                  <div className="text-xs font-bold text-[#2563A6] mt-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {selectedWardForDetails.contact}
                  </div>
                </div>
              </div>

              {/* Dynamic Bed Status Breakdown (Requirement 6) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#1E293B]">
                  Live Bed Capacity & Turnaround Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-[10px] font-bold text-[#15803D]">AVAILABLE</div>
                    <div className="text-xl font-black text-[#15803D] mt-1">{stats.available}</div>
                    <div className="text-[10px] text-[#15803D]">Ready intake</div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-[10px] font-bold text-[#2563A6]">OCCUPIED</div>
                    <div className="text-xl font-black text-[#2563A6] mt-1">{stats.occupied}</div>
                    <div className="text-[10px] text-[#2563A6]">Inpatients</div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-[10px] font-bold text-[#D97706]">CLEANING</div>
                    <div className="text-xl font-black text-[#D97706] mt-1">{stats.cleaning}</div>
                    <div className="text-[10px] text-[#D97706]">Turnover</div>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-[10px] font-bold text-[#7E22CE]">RESERVED</div>
                    <div className="text-xl font-black text-[#7E22CE] mt-1">{stats.reserved}</div>
                    <div className="text-[10px] text-[#7E22CE]">Pre-op / Triage</div>
                  </div>

                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-[10px] font-bold text-[#DC2626]">MAINTENANCE</div>
                    <div className="text-xl font-black text-[#DC2626] mt-1">{stats.maintenance}</div>
                    <div className="text-[10px] text-[#DC2626]">Bio-Med check</div>
                  </div>
                </div>
              </div>

              {/* Structured Ward Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Ward Identifier:</span>
                  <span className="font-mono font-bold text-[#1E293B]">{selectedWardForDetails.wardId}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Classification / Specialty:</span>
                  <span className="font-semibold text-[#1E293B]">{selectedWardForDetails.wardType}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Floor / Wing:</span>
                  <span className="font-semibold text-[#1E293B]">{selectedWardForDetails.floor}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Internal Contact Extension:</span>
                  <span className="font-semibold text-[#1E293B]">{selectedWardForDetails.contact}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Attending Senior Physician:</span>
                  <span className="font-semibold text-[#15803D] flex items-center gap-1 mt-0.5">
                    <Stethoscope className="w-3.5 h-3.5" /> {selectedWardForDetails.assignedDoctor}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <span className="text-[#64748B] block text-[11px]">Primary Nurse In-Charge:</span>
                  <span className="font-semibold text-[#2563A6] flex items-center gap-1 mt-0.5">
                    <HeartHandshake className="w-3.5 h-3.5" /> {selectedWardForDetails.assignedNurse}
                  </span>
                </div>
              </div>

              {/* Additional Nursing Staff */}
              {selectedWardForDetails.additionalNurses && selectedWardForDetails.additionalNurses.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">
                    Shift Nursing Staff Roster:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWardForDetails.additionalNurses.map((nurse, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 text-[11px]">
                        {nurse}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: View Ward Beds in Bed Management (Requirement 7) */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#1E293B]">
                    Manage Clinical Bays in {selectedWardForDetails.name}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Navigate directly to Bed Master Control with {selectedWardForDetails.name} filter applied.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleNavigateToWardBeds(selectedWardForDetails.bedMatchingKey)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  View Ward Beds ({stats.total})
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ============================================================== */}
      {/* 6. ADD WARD MODAL (Requirement 9)                              */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddWardModalOpen}
        onClose={() => setIsAddWardModalOpen(false)}
        title="Commission New Clinical Ward"
        description="Register a new inpatient department into the hospital organizational hierarchy."
        maxWidth="md"
      >
        <form onSubmit={handleAddWardSubmit} className="space-y-4">
          {addWardError && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{addWardError}</span>
            </div>
          )}

          {/* Ward ID & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Ward Identifier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addWardForm.wardId}
                onChange={(e) => setAddWardForm({ ...addWardForm, wardId: e.target.value.toUpperCase() })}
                placeholder="e.g. WRD-ONCO-07"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Ward Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addWardForm.name}
                onChange={(e) => setAddWardForm({ ...addWardForm, name: e.target.value })}
                placeholder="e.g. Oncology Ward"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>
          </div>

          {/* Ward Type & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Clinical Classification
              </label>
              <select
                value={addWardForm.wardType}
                onChange={(e) => setAddWardForm({ ...addWardForm, wardType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
              >
                <option value="General In-Patient Care">General In-Patient Care</option>
                <option value="Critical Care & Life Support">Critical Care & Life Support</option>
                <option value="Trauma & Triage Resuscitation">Trauma & Triage Resuscitation</option>
                <option value="Speciality Medical Ward">Speciality Medical Ward</option>
                <option value="Neonatal & Child Healthcare">Neonatal & Child Healthcare</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                required
                value={addWardForm.floor}
                onChange={(e) => setAddWardForm({ ...addWardForm, floor: e.target.value })}
                placeholder="e.g. 2nd Floor (West Wing)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>
          </div>

          {/* Initial Capacity & Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Initial Bed Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={addWardForm.initialBedCapacity}
                onChange={(e) => setAddWardForm({ ...addWardForm, initialBedCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Beds will be registered in Bed Master.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Intercom Extension / Contact
              </label>
              <input
                type="text"
                required
                value={addWardForm.contact}
                onChange={(e) => setAddWardForm({ ...addWardForm, contact: e.target.value })}
                placeholder="e.g. Ext. 2304 · Station 3"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>
          </div>

          {/* Staff Assignments */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Assigned Attending Doctor
              </label>
              <input
                type="text"
                required
                value={addWardForm.assignedDoctor}
                onChange={(e) => setAddWardForm({ ...addWardForm, assignedDoctor: e.target.value })}
                placeholder="e.g. Dr. K. Swaminathan"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Assigned Nurse In-Charge
              </label>
              <input
                type="text"
                required
                value={addWardForm.assignedNurse}
                onChange={(e) => setAddWardForm({ ...addWardForm, assignedNurse: e.target.value })}
                placeholder="e.g. Sr. Nurse Kavitha"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6] focus:bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddWardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Commission Ward
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
