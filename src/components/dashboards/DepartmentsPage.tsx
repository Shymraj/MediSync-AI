import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  Check, 
  FilterX, 
  Eye, 
  Boxes, 
  Layers, 
  Wrench, 
  Bed, 
  Users, 
  Phone, 
  MapPin, 
  Activity, 
  ChevronRight, 
  ArrowUpDown, 
  SlidersHorizontal,
  Info,
  ShieldAlert,
  Share2,
  FolderPlus,
  Stethoscope
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { 
  INITIAL_DEPARTMENTS, 
  DepartmentItem, 
  DepartmentStatus 
} from '../../data/departmentDemoData';
import { INITIAL_WARDS, WardItem } from '../../data/wardDemoData';
import { hospitalScopedKey } from '../../utils/hospitalSync';
import { INITIAL_BEDS, BedItem } from '../../data/bedDemoData';
import { INITIAL_EQUIPMENT, EquipmentItem } from '../../data/equipmentDemoData';
import { INITIAL_RESOURCES, ResourceItem } from '../../data/resourceDemoData';

const DEPARTMENTS_STORAGE_KEY = 'medisync_departments_data';
const WARDS_STORAGE_KEY = 'medisync_wards_registry_data';
const BEDS_STORAGE_KEY = 'medisync_bed_registry_data';
const EQUIPMENT_STORAGE_KEY = 'medisync_equipment_telemetry_data';
const RESOURCES_STORAGE_KEY = 'medisync_resource_registry_data';

const STATUS_OPTIONS: DepartmentStatus[] = ['Operational', 'Active', 'Under Review', 'Inactive'];

interface DepartmentsPageProps {
  onSelectTab?: (tab: string, filter?: string) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ onSelectTab }) => {
  // 1. Departments State (Persistent via localStorage)
  const [departments, setDepartments] = useState<DepartmentItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(DEPARTMENTS_STORAGE_KEY));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse departments from localStorage:', e);
    }
    return INITIAL_DEPARTMENTS;
  });

  const saveDepartments = (newList: DepartmentItem[]) => {
    setDepartments(newList);
    try {
      localStorage.setItem(hospitalScopedKey(DEPARTMENTS_STORAGE_KEY), JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save departments to localStorage:', e);
    }
  };

  // 2. Shared Wards & Beds State (Synchronized across modules)
  const [wards, setWards] = useState<WardItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(WARDS_STORAGE_KEY));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_WARDS;
  });

  const saveWards = (newWards: WardItem[]) => {
    setWards(newWards);
    try {
      localStorage.setItem(hospitalScopedKey(WARDS_STORAGE_KEY), JSON.stringify(newWards));
    } catch {}
  };

  const [beds, setBeds] = useState<BedItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BEDS;
  });

  // Equipment & Resources (Read-only integration for Department Details)
  const [equipmentList] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY));
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EQUIPMENT;
  });

  const [resourceList] = useState<ResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(RESOURCES_STORAGE_KEY));
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RESOURCES;
  });

  // 3. UI, Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'beds_desc' | 'wards_desc'>('name_asc');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 4. Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // 5. Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isWardsModalOpen, setIsWardsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddWardToDeptModalOpen, setIsAddWardToDeptModalOpen] = useState(false);

  const [activeDepartment, setActiveDepartment] = useState<DepartmentItem | null>(null);

  // Add Department Form
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    departmentHead: '',
    contactExtension: '',
    floor: '1st Floor (Medical Complex)',
    description: '',
    status: 'Operational' as DepartmentStatus
  });
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Edit Department Form
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    departmentHead: '',
    contactExtension: '',
    floor: '',
    description: '',
    status: 'Operational' as DepartmentStatus
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Add Ward to Department Form
  const [addWardForm, setAddWardForm] = useState({
    wardId: '',
    name: '',
    wardType: 'General In-Patient Care',
    floor: '2nd Floor (Ward Block)',
    assignedDoctor: '',
    assignedNurse: '',
    contact: '',
    description: '',
    initialBedCapacity: 4
  });
  const [addWardError, setAddWardError] = useState<string | null>(null);

  // Helper to get wards belonging to a department
  const getDepartmentWards = (dep: DepartmentItem): WardItem[] => {
    return wards.filter(w => {
      if (w.departmentCode && w.departmentCode === dep.code) return true;
      if (w.departmentName && w.departmentName.toLowerCase() === dep.name.toLowerCase()) return true;
      if (dep.wardIds && dep.wardIds.includes(w.wardId)) return true;
      // Fallback matching by keyword
      const keyword = dep.name.toLowerCase().split(' ')[0];
      return w.name.toLowerCase().includes(keyword) || w.bedMatchingKey.toLowerCase().includes(keyword);
    });
  };

  // Helper to get beds belonging to a ward
  const getWardBeds = (ward: WardItem): BedItem[] => {
    return beds.filter(b => 
      b.ward === ward.bedMatchingKey || 
      b.ward.toLowerCase().includes(ward.name.toLowerCase()) ||
      ward.name.toLowerCase().includes(b.ward.toLowerCase())
    );
  };

  // Helper to calculate aggregated bed metrics for a department
  const getDepartmentBedMetrics = (dep: DepartmentItem) => {
    const depWards = getDepartmentWards(dep);
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;

    depWards.forEach(w => {
      const wardBeds = getWardBeds(w);
      if (wardBeds.length > 0) {
        totalBeds += wardBeds.length;
        occupiedBeds += wardBeds.filter(b => b.status === 'Occupied').length;
        availableBeds += wardBeds.filter(b => b.status === 'Available').length;
      } else {
        // Fallback default capacity estimate if no beds logged yet
        totalBeds += 4;
        occupiedBeds += 2;
        availableBeds += 2;
      }
    });

    return {
      wardsCount: depWards.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    };
  };

  // 6. Summary Cards Calculations (Requirement 2)
  const summaryMetrics = useMemo(() => {
    const totalDepartments = departments.length;
    const totalWards = wards.length;
    const totalBeds = beds.length;
    const departmentsOperational = departments.filter(
      d => d.status === 'Operational' || d.status === 'Active'
    ).length;

    return {
      totalDepartments,
      totalWards,
      totalBeds,
      departmentsOperational
    };
  }, [departments, wards, beds]);

  // 7. Filtered & Sorted Department List
  const filteredDepartments = useMemo(() => {
    return departments
      .filter(item => {
        // Search by Name or Code
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = item.name.toLowerCase().includes(query);
          const matchesCode = item.code.toLowerCase().includes(query);
          const matchesHead = item.departmentHead.toLowerCase().includes(query);
          if (!matchesName && !matchesCode && !matchesHead) return false;
        }

        // Filter by Status
        if (statusFilter !== 'All' && item.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'beds_desc') {
          return getDepartmentBedMetrics(b).totalBeds - getDepartmentBedMetrics(a).totalBeds;
        }
        if (sortBy === 'wards_desc') {
          return getDepartmentBedMetrics(b).wardsCount - getDepartmentBedMetrics(a).wardsCount;
        }
        return 0;
      });
  }, [departments, searchQuery, statusFilter, sortBy, wards, beds]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const savedDeps = localStorage.getItem(hospitalScopedKey(DEPARTMENTS_STORAGE_KEY));
        if (savedDeps) setDepartments(JSON.parse(savedDeps));
        const savedWards = localStorage.getItem(hospitalScopedKey(WARDS_STORAGE_KEY));
        if (savedWards) setWards(JSON.parse(savedWards));
        const savedBeds = localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY));
        if (savedBeds) setBeds(JSON.parse(savedBeds));
      } catch {}
      const now = new Date();
      setLastRefreshedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
      showToast('Departments and ward bed capacities synchronized.', 'info');
    }, 350);
  };

  // Reset to initial demo catalog
  const handleResetToDefaults = () => {
    if (window.confirm('Reset Departments registry to default 9 clinical divisions?')) {
      saveDepartments(INITIAL_DEPARTMENTS);
      saveWards(INITIAL_WARDS);
      showToast('Restored default clinical departments catalog.', 'info');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSortBy('name_asc');
  };

  // Open Add Department Modal
  const handleOpenAddModal = () => {
    const nextNum = departments.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setAddForm({
      name: '',
      code: `DEP-NEW-${padded}`,
      departmentHead: '',
      contactExtension: 'Ext. 2800 · Desk',
      floor: '2nd Floor (Medical Pavilion)',
      description: '',
      status: 'Operational'
    });
    setAddFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Add Department
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    const cleanName = addForm.name.trim();
    const cleanCode = addForm.code.trim().toUpperCase();
    const cleanHead = addForm.departmentHead.trim();

    if (!cleanName) {
      setAddFormError('Department Name is required.');
      return;
    }
    if (!cleanCode) {
      setAddFormError('Department Code is required.');
      return;
    }
    if (!cleanHead) {
      setAddFormError('Department Head is required.');
      return;
    }

    // Uniqueness validation on Department Code
    const codeExists = departments.some(
      d => d.code.toUpperCase() === cleanCode
    );
    if (codeExists) {
      setAddFormError(`Department Code "${cleanCode}" already exists. Please choose a unique identifier.`);
      return;
    }

    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];

    const newDepartment: DepartmentItem = {
      id: `dep-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      departmentHead: cleanHead,
      contactExtension: addForm.contactExtension.trim() || 'Ext. 2000 · Desk',
      floor: addForm.floor.trim() || 'Medical Block',
      description: addForm.description.trim() || 'Specialized clinical hospital department.',
      status: addForm.status,
      wardIds: [],
      createdDate: todayIso
    };

    const updatedList = [...departments, newDepartment];
    saveDepartments(updatedList);
    setIsAddModalOpen(false);
    showToast(`Added Department "${newDepartment.name}" (${newDepartment.code}) to hospital registry.`);
  };

  // Open Edit Department Modal
  const handleOpenEditModal = (dep: DepartmentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDepartment(dep);
    setEditForm({
      name: dep.name,
      code: dep.code,
      departmentHead: dep.departmentHead,
      contactExtension: dep.contactExtension,
      floor: dep.floor,
      description: dep.description,
      status: dep.status
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Department
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepartment) return;
    setEditFormError(null);

    const cleanName = editForm.name.trim();
    const cleanHead = editForm.departmentHead.trim();

    if (!cleanName) {
      setEditFormError('Department Name is required.');
      return;
    }
    if (!cleanHead) {
      setEditFormError('Department Head is required.');
      return;
    }

    const updatedList = departments.map(d => {
      if (d.id === activeDepartment.id) {
        return {
          ...d,
          name: cleanName,
          departmentHead: cleanHead,
          contactExtension: editForm.contactExtension.trim(),
          floor: editForm.floor.trim(),
          description: editForm.description.trim(),
          status: editForm.status
        };
      }
      return d;
    });

    saveDepartments(updatedList);
    setIsEditModalOpen(false);
    setActiveDepartment(null);
    showToast(`Updated Department "${cleanName}" (${activeDepartment.code}).`);
  };

  // Open Delete Modal with safety check (Requirement 5)
  const handleOpenDeleteModal = (dep: DepartmentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDepartment(dep);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Department
  const handleConfirmDelete = () => {
    if (!activeDepartment) return;

    const metrics = getDepartmentBedMetrics(activeDepartment);

    // Prevent deletion if the department contains active wards or beds
    if (metrics.wardsCount > 0 || metrics.totalBeds > 0) {
      showToast(
        `Cannot delete "${activeDepartment.name}". Please reassign its ${metrics.wardsCount} ward(s) and beds first.`,
        'error'
      );
      return;
    }

    const deletedName = activeDepartment.name;
    const deletedCode = activeDepartment.code;
    const updatedList = departments.filter(d => d.id !== activeDepartment.id);

    saveDepartments(updatedList);
    setIsDeleteModalOpen(false);
    setActiveDepartment(null);
    showToast(`Department "${deletedName}" (${deletedCode}) deleted successfully.`, 'info');
  };

  // Open Details Modal (Requirement 7)
  const handleOpenDetails = (dep: DepartmentItem) => {
    setActiveDepartment(dep);
    setIsDetailsModalOpen(true);
  };

  // Open Wards Management Modal (Requirement 6)
  const handleOpenWardsModal = (dep: DepartmentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDepartment(dep);
    setIsWardsModalOpen(true);
  };

  // Open Add Ward to Department Modal
  const handleOpenAddWardToDept = (dep: DepartmentItem) => {
    setActiveDepartment(dep);
    const nextNum = wards.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setAddWardForm({
      wardId: `WRD-${dep.code.split('-')[1] || 'GEN'}-${padded}`,
      name: `${dep.name} Ward B`,
      wardType: 'In-Patient Clinical Care',
      floor: dep.floor || '2nd Floor',
      assignedDoctor: dep.departmentHead,
      assignedNurse: 'Staff Nurse In-Charge',
      contact: dep.contactExtension,
      description: `Associated clinical ward for ${dep.name}.`,
      initialBedCapacity: 4
    });
    setAddWardError(null);
    setIsAddWardToDeptModalOpen(true);
  };

  // Submit Add Ward to Department
  const handleAddWardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepartment) return;
    setAddWardError(null);

    const cleanWardId = addWardForm.wardId.trim().toUpperCase();
    const cleanName = addWardForm.name.trim();

    if (!cleanWardId || !cleanName) {
      setAddWardError('Ward ID and Ward Name are required.');
      return;
    }

    const wardExists = wards.some(w => w.wardId.toUpperCase() === cleanWardId);
    if (wardExists) {
      setAddWardError(`Ward ID "${cleanWardId}" already exists. Please choose a unique ward code.`);
      return;
    }

    const newWard: WardItem = {
      id: `ward-${Date.now()}`,
      wardId: cleanWardId,
      name: cleanName,
      wardType: addWardForm.wardType,
      floor: addWardForm.floor,
      assignedDoctor: addWardForm.assignedDoctor || activeDepartment.departmentHead,
      assignedNurse: addWardForm.assignedNurse || 'Nurse In-Charge',
      contact: addWardForm.contact || activeDepartment.contactExtension,
      operationalStatus: 'Active',
      description: addWardForm.description,
      bedMatchingKey: cleanName,
      departmentName: activeDepartment.name,
      departmentCode: activeDepartment.code
    };

    const updatedWards = [...wards, newWard];
    saveWards(updatedWards);

    // Update department wardIds reference
    const updatedDepartments = departments.map(d => {
      if (d.id === activeDepartment.id) {
        return {
          ...d,
          wardIds: Array.from(new Set([...(d.wardIds || []), newWard.wardId]))
        };
      }
      return d;
    });
    saveDepartments(updatedDepartments);

    // Generate initial beds for this ward to ensure bed continuity
    const newBeds: BedItem[] = [];
    const capacity = Math.max(1, addWardForm.initialBedCapacity || 4);
    for (let i = 1; i <= capacity; i++) {
      const bedSuffix = i < 10 ? `0${i}` : `${i}`;
      newBeds.push({
        id: `bed-${Date.now()}-${i}`,
        bedId: `${cleanWardId.split('-')[1] || 'B'}-${bedSuffix}`,
        ward: cleanName as any,
        bedType: 'General',
        floor: addWardForm.floor,
        status: i === 1 ? 'Available' : i === 2 ? 'Available' : 'Occupied',
        patient: i === 3 ? 'P-New · In-Patient Admitted' : 'Unassigned',
        equipment: 'Standard Bedside Console, Vital Signs Monitor',
        lastUpdated: 'Just now',
        statusHistory: [
          {
            id: `h-init-${i}`,
            timestamp: 'Just now',
            fromStatus: 'Available',
            toStatus: i === 3 ? 'Occupied' : 'Available',
            updatedBy: 'Ward Setup Provisioning'
          }
        ]
      });
    }

    const updatedBeds = [...beds, ...newBeds];
    setBeds(updatedBeds);
    try {
      localStorage.setItem(hospitalScopedKey(BEDS_STORAGE_KEY), JSON.stringify(updatedBeds));
    } catch {}

    setIsAddWardToDeptModalOpen(false);
    showToast(`Added "${newWard.name}" (${newWard.wardId}) with ${capacity} bed(s) to ${activeDepartment.name}.`);
  };

  // Helper for Status Badge
  const getStatusBadge = (status: DepartmentStatus) => {
    switch (status) {
      case 'Operational':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Active
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Under Review
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactive
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || sortBy !== 'name_asc';

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* Header Banner & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563A6] border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1E293B]">Clinical Departments Management</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563A6] border border-blue-200">
                {departments.length} Divisions
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Comprehensive institutional divisions, clinical ward mappings, doctor in-charge governance, and live bed capacities.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs text-slate-500 mr-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Synced: <strong className="text-slate-700">{lastRefreshedTime}</strong></span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[#2563A6] border-[#2563A6]/20 hover:bg-blue-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            title="Restore default 9 departments catalog"
          >
            Reset Demo Data
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 text-xs bg-[#2563A6] hover:bg-[#1E4F8A] text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* 
        ============================================================
        2. SUMMARY CARDS (Requirement 2)
        - Total Departments
        - Total Wards
        - Total Beds
        - Departments Operational
        Calculated dynamically from department and ward data
        ============================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Departments */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Departments
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-[#1E293B]">
                  {summaryMetrics.totalDepartments}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  specialty clinical wings
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2563A6] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active Operational Divisions</span>
            <span className="font-semibold text-emerald-700">{summaryMetrics.departmentsOperational} Active</span>
          </div>
        </Card>

        {/* Card 2: Total Wards */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Wards
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-blue-700">
                  {summaryMetrics.totalWards}
                </span>
                <span className="text-xs text-blue-600 font-medium">
                  clinical ward units
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Cross-Department Wards</span>
            <span className="font-semibold text-blue-700">{summaryMetrics.totalWards} Units Logged</span>
          </div>
        </Card>

        {/* Card 3: Total Beds */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Beds
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-indigo-700">
                  {summaryMetrics.totalBeds}
                </span>
                <span className="text-xs text-indigo-600 font-medium">
                  registered institutional beds
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bed className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Live Bed Registry Sync</span>
            <span className="font-semibold text-indigo-700">100% Realtime</span>
          </div>
        </Card>

        {/* Card 4: Departments Operational */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Departments Operational
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-emerald-700">
                  {summaryMetrics.departmentsOperational}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  of {summaryMetrics.totalDepartments} ({summaryMetrics.totalDepartments > 0 ? Math.round((summaryMetrics.departmentsOperational / summaryMetrics.totalDepartments) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hospital Operational Health</span>
            <span className="font-semibold text-emerald-700">All Wings Certified</span>
          </div>
        </Card>
      </div>

      {/* 
        ============================================================
        3. SEARCH, FILTER & SORTING (Requirement 8)
        - Search by department name or code
        - Filter by department status
        - Sort by department name or capacity
        - Clear filters
        ============================================================
      */}
      <Card className="p-4 bg-white border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments by name, code (e.g. DEP-EMG-01), or department head..."
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

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Statuses ({departments.length})</option>
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="beds_desc">Total Beds (Highest)</option>
                <option value="wards_desc">Wards Count (Most)</option>
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
            Showing <strong className="text-slate-800 font-bold">{filteredDepartments.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{departments.length}</strong> clinical departments
            {hasActiveFilters && <span className="text-[#2563A6] ml-1.5">(Filtered)</span>}
          </div>
          <div className="text-[11px] text-slate-400">
            Click any department row or "View Wards" to manage clinical bed allocations
          </div>
        </div>
      </Card>

      {/* 
        ============================================================
        4. DEPARTMENT LIST (Requirement 3)
        Columns:
        - Department ID / Code
        - Department Name & Description
        - Department Head
        - Number of Wards
        - Total Bed Capacity
        - Occupied Beds
        - Available Beds
        - Department Status
        - Actions
        ============================================================
      */}
      <Card className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Dept ID</th>
                <th className="py-3.5 px-4 min-w-[200px]">Department Name</th>
                <th className="py-3.5 px-4 min-w-[190px]">Department Head</th>
                <th className="py-3.5 px-4 text-center">Wards</th>
                <th className="py-3.5 px-4 text-center">Bed Capacity</th>
                <th className="py-3.5 px-4 text-center">Occupied</th>
                <th className="py-3.5 px-4 min-w-[140px]">Available Beds</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <FilterX className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No departments match your search</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Try modifying your search keywords or clear your active filters.
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
                filteredDepartments.map((item) => {
                  const metrics = getDepartmentBedMetrics(item);
                  const availPct = metrics.totalBeds > 0 
                    ? Math.round((metrics.availableBeds / metrics.totalBeds) * 100) 
                    : 0;

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleOpenDetails(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* 1. Department ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md group-hover:border-[#2563A6]/30 transition-colors">
                          {item.code}
                        </span>
                      </td>

                      {/* 2. Department Name & Description */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-[#2563A6] transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[260px] mt-0.5" title={item.description}>
                            {item.floor} • {item.description}
                          </div>
                        </div>
                      </td>

                      {/* 3. Department Head & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.departmentHead}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.contactExtension}</span>
                        </div>
                      </td>

                      {/* 4. Number of Wards */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => handleOpenWardsModal(item, e)}
                          title="View & manage assigned clinical wards"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563A6] border border-blue-200/80 hover:bg-blue-100 transition-colors text-xs font-bold"
                        >
                          <Layers className="w-3 h-3" />
                          <span>{metrics.wardsCount} Ward{metrics.wardsCount !== 1 ? 's' : ''}</span>
                        </button>
                      </td>

                      {/* 5. Total Bed Capacity */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-sm">
                          {metrics.totalBeds}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">beds</span>
                      </td>

                      {/* 6. Occupied Beds */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-blue-700 text-sm">
                          {metrics.occupiedBeds}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">({metrics.occupancyRate}%)</span>
                      </td>

                      {/* 7. Available Beds & Progress Bar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-full max-w-[130px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-emerald-700">
                              {metrics.availableBeds} Ready
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {availPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                metrics.availableBeds === 0 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, availPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 8. Department Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(item)}
                            title="View Department Details"
                            className="p-1.5 text-slate-400 hover:text-[#2563A6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenWardsModal(item, e)}
                            title="View & Manage Wards"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEditModal(item, e)}
                            title="Edit Department"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(item, e)}
                            title="Delete Department"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
        5. ADD DEPARTMENT MODAL (Requirement 4)
        ============================================================
      */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital Clinical Department"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {addFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{addFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. Oncology & Chemotherapy"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.code}
                onChange={e => setAddForm({ ...addForm, code: e.target.value })}
                placeholder="e.g. DEP-ONCO-10"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6] font-mono"
              />
              <span className="text-[10px] text-slate-400">Unique identifier across hospital wings.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Head / Chief Physician <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.departmentHead}
                onChange={e => setAddForm({ ...addForm, departmentHead: e.target.value })}
                placeholder="e.g. Dr. Priya Raman (Sr. Consultant)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Extension <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.contactExtension}
                onChange={e => setAddForm({ ...addForm, contactExtension: e.target.value })}
                placeholder="e.g. Ext. 2800 · Desk"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor / Wing Location
              </label>
              <input
                type="text"
                value={addForm.floor}
                onChange={e => setAddForm({ ...addForm, floor: e.target.value })}
                placeholder="e.g. 2nd Floor (Pavilion B)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Operational Status
              </label>
              <select
                value={addForm.status}
                onChange={e => setAddForm({ ...addForm, status: e.target.value as DepartmentStatus })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              >
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department Clinical Scope & Description
            </label>
            <textarea
              rows={2}
              value={addForm.description}
              onChange={e => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Clinical scope, sub-specialty care, treatment profiles, or admission policies..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-[#2563A6] hover:bg-[#1E4F8A] text-white"
            >
              Save Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* 
        ============================================================
        6. EDIT DEPARTMENT MODAL (Requirement 5)
        ============================================================
      */}
      {activeDepartment && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActiveDepartment(null);
          }}
          title={`Edit Department — ${activeDepartment.code}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{editFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Code (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={editForm.code}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value as DepartmentStatus })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Head <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.departmentHead}
                  onChange={e => setEditForm({ ...editForm, departmentHead: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Extension <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.contactExtension}
                  onChange={e => setEditForm({ ...editForm, contactExtension: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor / Wing Location
              </label>
              <input
                type="text"
                value={editForm.floor}
                onChange={e => setEditForm({ ...editForm, floor: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Clinical Responsibilities
              </label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setActiveDepartment(null);
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
                Update Department
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 
        ============================================================
        7. DELETE MODAL WITH SAFETY VALIDATION (Requirement 5)
        Prevent deletion if active wards/beds exist
        ============================================================
      */}
      {activeDepartment && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setActiveDepartment(null);
          }}
          title="Delete Department Confirmation"
        >
          <div className="space-y-4">
            {(() => {
              const metrics = getDepartmentBedMetrics(activeDepartment);
              const hasActiveAssociations = metrics.wardsCount > 0 || metrics.totalBeds > 0;

              if (hasActiveAssociations) {
                return (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-950">
                          Deletion Prevented: Active Clinical Wards & Beds Assigned
                        </h4>
                        <p className="text-xs text-amber-800 mt-1">
                          This department currently manages <strong>{metrics.wardsCount} clinical ward(s)</strong> and <strong>{metrics.totalBeds} hospital bed(s)</strong>. To protect hospital operations and patient continuity, active clinical departments cannot be deleted.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                      <span className="font-semibold text-slate-800 block">Actions Required to Resolve:</span>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                        <li>Navigate to <strong>View Wards</strong> and reassign or archive all associated wards.</li>
                        <li>Ensure all patient bed allocations are transferred to another department.</li>
                      </ul>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          handleOpenWardsModal(activeDepartment);
                        }}
                        className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        Manage Wards
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          setActiveDepartment(null);
                        }}
                        className="text-xs bg-slate-800 text-white"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-950">
                        Confirm Permanent Deletion
                      </h4>
                      <p className="text-xs text-red-800 mt-1">
                        Are you sure you want to permanently delete <strong>{activeDepartment.name}</strong> ({activeDepartment.code})? This department currently has 0 active wards and can be safely removed.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setActiveDepartment(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleConfirmDelete}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Delete Department
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* 
        ============================================================
        8. WARD MANAGEMENT MODAL (Requirement 6)
        View wards belonging to department, add ward, view capacities
        ============================================================
      */}
      {activeDepartment && (
        <Modal
          isOpen={isWardsModalOpen}
          onClose={() => {
            setIsWardsModalOpen(false);
            setActiveDepartment(null);
          }}
          title={`Clinical Wards Management — ${activeDepartment.name}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header summary */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {activeDepartment.code}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{activeDepartment.name}</h4>
                <p className="text-xs text-slate-500">{activeDepartment.departmentHead} • {activeDepartment.floor}</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddWardToDept(activeDepartment)}
                className="text-xs bg-[#2563A6] hover:bg-[#1E4F8A] text-white flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ward to Dept
              </Button>
            </div>

            {/* Wards List */}
            {(() => {
              const deptWards = getDepartmentWards(activeDepartment);

              if (deptWards.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h5 className="text-sm font-bold text-slate-800">No Wards Currently Assigned</h5>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      This department has no registered clinical wards. Add a ward to configure bed capacities.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddWardToDept(activeDepartment)}
                      className="text-xs text-[#2563A6] border-[#2563A6]/30"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add First Ward
                    </Button>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Assigned Wards ({deptWards.length})</span>
                    <span className="text-[11px] text-slate-500 font-normal">Connected to Bed Registry</span>
                  </div>

                  {deptWards.map(w => {
                    const wardBeds = getWardBeds(w);
                    const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
                    const available = wardBeds.filter(b => b.status === 'Available').length;
                    const total = wardBeds.length || 4;

                    return (
                      <div key={w.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm hover:border-[#2563A6]/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                {w.wardId}
                              </span>
                              <h5 className="font-bold text-slate-900 text-sm">{w.name}</h5>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{w.wardType} • {w.floor}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            w.operationalStatus === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {w.operationalStatus}
                          </span>
                        </div>

                        {/* Bed metrics pill */}
                        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg text-xs text-center border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Total Beds</span>
                            <span className="font-bold text-slate-800">{total}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Occupied</span>
                            <span className="font-bold text-blue-700">{occupied}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Available</span>
                            <span className="font-bold text-emerald-700">{available}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Doctor: <strong className="text-slate-700">{w.assignedDoctor}</strong></span>
                          <span>Contact: <strong className="text-slate-700">{w.contact}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWardsModalOpen(false);
                    onSelectTab('wards');
                  }}
                  className="text-xs text-[#2563A6] hover:underline font-semibold flex items-center gap-1"
                >
                  Open Clinical Wards Workspace <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsWardsModalOpen(false);
                  setActiveDepartment(null);
                }}
                className="text-xs bg-[#2563A6] text-white ml-auto"
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 
        ============================================================
        9. ADD WARD TO DEPARTMENT MODAL
        ============================================================
      */}
      {activeDepartment && (
        <Modal
          isOpen={isAddWardToDeptModalOpen}
          onClose={() => setIsAddWardToDeptModalOpen(false)}
          title={`Add Ward to ${activeDepartment.name}`}
        >
          <form onSubmit={handleAddWardSubmit} className="space-y-4">
            {addWardError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{addWardError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward ID Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addWardForm.wardId}
                  onChange={e => setAddWardForm({ ...addWardForm, wardId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addWardForm.name}
                  onChange={e => setAddWardForm({ ...addWardForm, name: e.target.value })}
                  placeholder="e.g. Surgical Stepdown Ward"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward Type / Care Level
                </label>
                <input
                  type="text"
                  value={addWardForm.wardType}
                  onChange={e => setAddWardForm({ ...addWardForm, wardType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Bed Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addWardForm.initialBedCapacity}
                  onChange={e => setAddWardForm({ ...addWardForm, initialBedCapacity: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Doctor
                </label>
                <input
                  type="text"
                  value={addWardForm.assignedDoctor}
                  onChange={e => setAddWardForm({ ...addWardForm, assignedDoctor: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Nurse In-Charge
                </label>
                <input
                  type="text"
                  value={addWardForm.assignedNurse}
                  onChange={e => setAddWardForm({ ...addWardForm, assignedNurse: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ward Description & Clinical Notes
              </label>
              <textarea
                rows={2}
                value={addWardForm.description}
                onChange={e => setAddWardForm({ ...addWardForm, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddWardToDeptModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-[#2563A6] hover:bg-[#1E4F8A] text-white"
              >
                Provision Ward
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 
        ============================================================
        10. DEPARTMENT DETAILS MODAL (Requirement 7)
        - Department info & head
        - Associated wards
        - Bed capacity, occupancy & availability
        - Assigned equipment from Equipment Telemetry
        - Resource summary from Resource Registry
        ============================================================
      */}
      {activeDepartment && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setActiveDepartment(null);
          }}
          title={`Department Profile — ${activeDepartment.name}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded">
                    {activeDepartment.code}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Created {activeDepartment.createdDate}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeDepartment.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeDepartment.floor}</span>
                </p>
              </div>

              <div>
                {getStatusBadge(activeDepartment.status)}
              </div>
            </div>

            {/* Department Head & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block font-medium flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-[#2563A6]" /> Department Head
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {activeDepartment.departmentHead}
                </span>
                <span className="text-slate-400">Chief Clinical Authority</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#2563A6]" /> Contact Extension
                </span>
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {activeDepartment.contactExtension}
                </span>
                <span className="text-slate-400">Hospital Internal Intercom</span>
              </div>
            </div>

            {/* Clinical Scope Description */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-slate-800 block">Scope of Practice & Clinical Responsibilities:</span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {activeDepartment.description}
              </p>
            </div>

            {/* Bed Capacity & Occupancy Breakdown */}
            {(() => {
              const metrics = getDepartmentBedMetrics(activeDepartment);
              const deptWards = getDepartmentWards(activeDepartment);

              return (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-[#2563A6]" /> Bed Capacity & Ward Allocations
                    </span>
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleOpenWardsModal(activeDepartment);
                      }}
                      className="text-xs text-[#2563A6] hover:underline font-semibold"
                    >
                      Manage Wards ({deptWards.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Capacity</span>
                      <span className="text-lg font-bold text-slate-900">{metrics.totalBeds} Beds</span>
                    </div>
                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                      <span className="text-[10px] text-blue-700 uppercase block font-semibold">Occupied</span>
                      <span className="text-lg font-bold text-blue-800">{metrics.occupiedBeds} ({metrics.occupancyRate}%)</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                      <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Available</span>
                      <span className="text-lg font-bold text-emerald-800">{metrics.availableBeds} Ready</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Assigned Equipment Telemetry Summary (Requirement 7) */}
            {(() => {
              const keyword = activeDepartment.name.toLowerCase().split(' ')[0];
              const matchingEquipment = equipmentList.filter(e => 
                e.department.toLowerCase().includes(keyword) || 
                activeDepartment.name.toLowerCase().includes(e.department.toLowerCase())
              );

              return (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#2563A6]" /> Connected Equipment Telemetry
                    </span>
                    <span className="text-xs text-slate-500">
                      {matchingEquipment.length} Devices Mapped
                    </span>
                  </div>

                  {matchingEquipment.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      No telemetry equipment currently logged under this department.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {matchingEquipment.slice(0, 3).map(eq => (
                        <div key={eq.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{eq.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 ml-2">({eq.equipmentId})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            eq.operationalStatus === 'In Use' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {eq.operationalStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assigned Resource Summary (Requirement 7) */}
            {(() => {
              const keyword = activeDepartment.name.toLowerCase().split(' ')[0];
              const matchingResources = resourceList.filter(r => 
                r.department.toLowerCase().includes(keyword) || 
                activeDepartment.name.toLowerCase().includes(r.department.toLowerCase())
              );

              return (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-[#2563A6]" /> Department Resource Inventory
                    </span>
                    <span className="text-xs text-slate-500">
                      {matchingResources.length} Catalog Items
                    </span>
                  </div>

                  {matchingResources.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      Standard hospital general supplies allocated.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {matchingResources.slice(0, 3).map(res => (
                        <div key={res.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{res.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({res.category})</span>
                          </div>
                          <span className="font-bold text-slate-700">
                            {res.availableQuantity} / {res.quantity} {res.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenEditModal(activeDepartment);
                }}
                className="text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit Department
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setActiveDepartment(null);
                }}
                className="text-xs bg-[#2563A6] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
