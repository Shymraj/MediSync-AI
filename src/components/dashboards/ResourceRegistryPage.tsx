import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Package, 
  Edit3, 
  Trash2, 
  Check, 
  FilterX, 
  Eye, 
  Boxes, 
  Layers, 
  Wrench, 
  ShieldAlert, 
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { 
  INITIAL_RESOURCES, 
  ResourceItem, 
  ResourceCategory, 
  ResourceStatus 
} from '../../data/resourceDemoData';
import { hospitalScopedKey } from '../../utils/hospitalSync';

const STORAGE_KEY = 'medisync_resource_registry_data';

const CATEGORIES: ResourceCategory[] = [
  'Medical Equipment',
  'Emergency Supplies',
  'ICU Resources',
  'General Hospital Supplies',
  'Patient Care Resources'
];

const STATUSES: ResourceStatus[] = [
  'Available',
  'In Use',
  'Partially Available',
  'Under Maintenance',
  'Out of Stock'
];

interface ResourceRegistryPageProps {
  onSelectTab?: (tab: string) => void;
}

export const ResourceRegistryPage: React.FC<ResourceRegistryPageProps> = ({ onSelectTab }) => {
  // 1. Data State (Persistent with localStorage)
  const [resources, setResources] = useState<ResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey(STORAGE_KEY));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse resources from localStorage:', e);
    }
    return INITIAL_RESOURCES;
  });

  // Sync back to localStorage
  const saveResources = (newResources: ResourceItem[]) => {
    setResources(newResources);
    try {
      localStorage.setItem(hospitalScopedKey(STORAGE_KEY), JSON.stringify(newResources));
    } catch (e) {
      console.error('Failed to save resources to localStorage:', e);
    }
  };

  // 2. Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3. Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 4. Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [activeResource, setActiveResource] = useState<ResourceItem | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState({
    resourceId: '',
    name: '',
    category: 'Medical Equipment' as ResourceCategory,
    department: 'ICU Complex',
    quantity: 10,
    availableQuantity: 10,
    status: 'Available' as ResourceStatus,
    unit: 'Units',
    description: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    resourceId: '',
    name: '',
    category: 'Medical Equipment' as ResourceCategory,
    department: 'ICU Complex',
    quantity: 10,
    availableQuantity: 10,
    status: 'Available' as ResourceStatus,
    unit: 'Units',
    description: ''
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Unique departments list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    resources.forEach(r => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set).sort();
  }, [resources]);

  // Dynamic KPI Summary calculations (Requirement 2)
  const summaryMetrics = useMemo(() => {
    const totalResources = resources.length;
    const availableResources = resources.filter(r => r.status === 'Available').length;
    const inUse = resources.filter(r => r.status === 'In Use').length;
    const underMaintenance = resources.filter(r => r.status === 'Under Maintenance').length;
    const partiallyAvailable = resources.filter(r => r.status === 'Partially Available').length;
    const outOfStock = resources.filter(r => r.status === 'Out of Stock').length;

    const totalQty = resources.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalAvailableQty = resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0);

    return {
      totalResources,
      availableResources,
      inUse,
      underMaintenance,
      partiallyAvailable,
      outOfStock,
      totalQty,
      totalAvailableQty
    };
  }, [resources]);

  // Filtered resources list (Requirement 9)
  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      // Search query (matches name or resource ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesId = item.resourceId.toLowerCase().includes(query);
        const matchesDept = item.department.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Department filter
      if (selectedDepartment !== 'All' && item.department !== selectedDepartment) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedCategory, selectedDepartment, selectedStatus]);

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(hospitalScopedKey(STORAGE_KEY));
        if (saved) {
          setResources(JSON.parse(saved));
        }
      } catch {}
      const now = new Date();
      setLastRefreshedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
      showToast('Resource Registry synchronized with hospital inventory.', 'info');
    }, 400);
  };

  // Reset to initial demo data
  const handleResetToDefaults = () => {
    if (window.confirm('Reset resource registry to initial demo catalog? This will overwrite manual changes.')) {
      saveResources(INITIAL_RESOURCES);
      showToast('Restored default 21 synthetic hospital resources catalog.', 'info');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDepartment('All');
    setSelectedStatus('All');
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    // Generate next unique ID suggestion
    const nextNum = resources.length + 101;
    setAddForm({
      resourceId: `RES-NEW-${nextNum}`,
      name: '',
      category: 'Medical Equipment',
      department: 'Emergency',
      quantity: 10,
      availableQuantity: 10,
      status: 'Available',
      unit: 'Units',
      description: ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Add Resource
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanId = addForm.resourceId.trim();
    const cleanName = addForm.name.trim();

    if (!cleanId) {
      setFormError('Resource ID is required.');
      return;
    }
    if (!cleanName) {
      setFormError('Resource Name is required.');
      return;
    }

    // Uniqueness check
    const idExists = resources.some(
      r => r.resourceId.toLowerCase() === cleanId.toLowerCase()
    );
    if (idExists) {
      setFormError(`Resource ID "${cleanId}" already exists. Please choose a unique identifier.`);
      return;
    }

    const qty = Number(addForm.quantity);
    const availQty = Number(addForm.availableQuantity);

    if (isNaN(qty) || qty < 0) {
      setFormError('Total Quantity must be a non-negative number.');
      return;
    }
    if (isNaN(availQty) || availQty < 0) {
      setFormError('Available Quantity must be a non-negative number.');
      return;
    }
    if (availQty > qty) {
      setFormError('Available Quantity cannot exceed Total Quantity.');
      return;
    }

    // Auto-align status if out of stock
    let finalStatus = addForm.status;
    if (availQty === 0 && finalStatus === 'Available') {
      finalStatus = 'Out of Stock';
    } else if (availQty > 0 && availQty < qty && finalStatus === 'Available') {
      finalStatus = 'Partially Available';
    }

    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newResource: ResourceItem = {
      id: `res-${Date.now()}`,
      resourceId: cleanId,
      name: cleanName,
      category: addForm.category,
      department: addForm.department || 'General Administration',
      quantity: qty,
      availableQuantity: availQty,
      status: finalStatus,
      unit: addForm.unit || 'Units',
      description: addForm.description || 'Standard institutional healthcare inventory item.',
      lastUpdated: timeString
    };

    const updatedList = [newResource, ...resources];
    saveResources(updatedList);
    setIsAddModalOpen(false);
    showToast(`Added resource "${newResource.name}" (${newResource.resourceId}) to registry.`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (resource: ResourceItem) => {
    setActiveResource(resource);
    setEditForm({
      resourceId: resource.resourceId,
      name: resource.name,
      category: resource.category,
      department: resource.department,
      quantity: resource.quantity,
      availableQuantity: resource.availableQuantity,
      status: resource.status,
      unit: resource.unit,
      description: resource.description
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Resource
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResource) return;
    setEditFormError(null);

    const cleanName = editForm.name.trim();
    if (!cleanName) {
      setEditFormError('Resource Name is required.');
      return;
    }

    const qty = Number(editForm.quantity);
    const availQty = Number(editForm.availableQuantity);

    if (isNaN(qty) || qty < 0) {
      setEditFormError('Total Quantity must be a non-negative number.');
      return;
    }
    if (isNaN(availQty) || availQty < 0) {
      setEditFormError('Available Quantity must be a non-negative number.');
      return;
    }
    if (availQty > qty) {
      setEditFormError('Available Quantity cannot exceed Total Quantity.');
      return;
    }

    let finalStatus = editForm.status;
    if (availQty === 0 && (finalStatus === 'Available' || finalStatus === 'Partially Available')) {
      finalStatus = 'Out of Stock';
    } else if (availQty > 0 && availQty < qty && finalStatus === 'Available') {
      finalStatus = 'Partially Available';
    }

    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const updatedList = resources.map(item => {
      if (item.id === activeResource.id) {
        return {
          ...item,
          name: cleanName,
          category: editForm.category,
          department: editForm.department,
          quantity: qty,
          availableQuantity: availQty,
          status: finalStatus,
          unit: editForm.unit,
          description: editForm.description,
          lastUpdated: timeString
        };
      }
      return item;
    });

    saveResources(updatedList);
    setIsEditModalOpen(false);
    setActiveResource(null);
    showToast(`Updated "${cleanName}" (${activeResource.resourceId}) specifications.`);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (resource: ResourceItem) => {
    setActiveResource(resource);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!activeResource) return;
    const deletedName = activeResource.name;
    const deletedId = activeResource.resourceId;

    const updatedList = resources.filter(item => item.id !== activeResource.id);
    saveResources(updatedList);
    setIsDeleteModalOpen(false);
    setActiveResource(null);
    showToast(`Resource "${deletedName}" (${deletedId}) removed from registry.`, 'info');
  };

  // Open View Details
  const handleOpenViewModal = (resource: ResourceItem) => {
    setActiveResource(resource);
    setIsViewModalOpen(true);
  };

  // Helper for status badge styling (Requirement 5)
  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Available
          </span>
        );
      case 'In Use':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            In Use
          </span>
        );
      case 'Partially Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Partially Available
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Under Maintenance
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Out of Stock
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

  // Helper for category badge styling
  const getCategoryBadge = (category: ResourceCategory) => {
    switch (category) {
      case 'Medical Equipment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Emergency Supplies':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ICU Resources':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'General Hospital Supplies':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Patient Care Resources':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedDepartment !== 'All' || selectedStatus !== 'All';

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
            <Boxes className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1E293B]">Resource Registry Master Catalog</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563A6] border border-blue-200">
                {resources.length} Tracked Items
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Institutional equipment, pharmaceutical reserves, critical ICU supplies, and ward inventories.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs text-slate-500 mr-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: <strong className="text-slate-700">{lastRefreshedTime}</strong></span>
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
            title="Restore default synthetic data catalog"
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
            Add Resource
          </Button>
        </div>
      </div>

      {/* 
        ============================================================
        2. RESOURCE SUMMARY CARDS (Requirement 2)
        - Total Resources
        - Available Resources
        - In Use
        - Under Maintenance
        Calculated dynamically from resource data
        ============================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Resources */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Resources
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-[#1E293B]">
                  {summaryMetrics.totalResources}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  catalog types ({summaryMetrics.totalQty.toLocaleString()} total units)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2563A6] flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total units logged</span>
            <span className="font-semibold text-[#2563A6]">{summaryMetrics.totalQty.toLocaleString()} units</span>
          </div>
        </Card>

        {/* Card 2: Available Resources */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Available Resources
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-emerald-700">
                  {summaryMetrics.availableResources}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  fully ready ({summaryMetrics.totalAvailableQty.toLocaleString()} avail units)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Partially available items</span>
            <span className="font-semibold text-purple-600">{summaryMetrics.partiallyAvailable} types</span>
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
                  active allocation ({Math.max(0, summaryMetrics.totalQty - summaryMetrics.totalAvailableQty).toLocaleString()} units deployed)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Utilization Rate</span>
            <span className="font-semibold text-blue-700">
              {summaryMetrics.totalQty > 0 
                ? `${Math.round(((summaryMetrics.totalQty - summaryMetrics.totalAvailableQty) / summaryMetrics.totalQty) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </Card>

        {/* Card 4: Under Maintenance */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Under Maintenance
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-amber-700">
                  {summaryMetrics.underMaintenance}
                </span>
                <span className="text-xs text-amber-600 font-medium">
                  biomed servicing ({summaryMetrics.outOfStock} out of stock)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Requires Inspection / Calibration</span>
            <span className="font-semibold text-amber-700">{summaryMetrics.underMaintenance} items</span>
          </div>
        </Card>
      </div>

      {/* 
        ============================================================
        3. REAL-TIME SEARCH & MULTI-FILTER CONTROLS (Requirement 9)
        ============================================================
      */}
      <Card className="p-4 bg-white border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search by Name or ID */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resources by name, ID (e.g., RES-EQP-101), or department..."
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

          {/* Multi-Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter (Requirement 4) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Categories ({resources.length})</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
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
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (Requirement 5) */}
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
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5 py-1.5"
              >
                <FilterX className="w-3.5 h-3.5" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filter Summary Pill Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800 font-bold">{filteredResources.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{resources.length}</strong> resources
            {hasActiveFilters && <span className="text-[#2563A6] ml-1.5">(Filtered)</span>}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Available
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-1"></span> In Use
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 ml-1"></span> Partial
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-1"></span> Maintenance
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1"></span> Out of Stock
          </div>
        </div>
      </Card>

      {/* 
        ============================================================
        4. RESOURCE TABLE (Requirement 3)
        Columns:
        - Resource ID
        - Resource Name
        - Category
        - Department
        - Quantity (Total)
        - Available Quantity
        - Resource Status
        - Last Updated
        - Actions (Edit, Delete, Details)
        ============================================================
      */}
      <Card className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Resource ID</th>
                <th className="py-3.5 px-4 min-w-[220px]">Resource Name</th>
                <th className="py-3.5 px-4 min-w-[150px]">Category</th>
                <th className="py-3.5 px-4 min-w-[130px]">Department</th>
                <th className="py-3.5 px-4 text-center">Total Qty</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Available Qty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 min-w-[130px]">Last Updated</th>
                <th className="py-3.5 px-4 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <FilterX className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No resources matched your criteria</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Try modifying your search keywords or reset active filters to view all hospital resources.
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
                filteredResources.map((item) => {
                  const availabilityPct = item.quantity > 0 
                    ? Math.round((item.availableQuantity / item.quantity) * 100) 
                    : 0;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* 1. Resource ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                          {item.resourceId}
                        </span>
                      </td>

                      {/* 2. Resource Name & Description */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-[#2563A6] transition-colors">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-xs text-slate-500 line-clamp-1 max-w-[320px] mt-0.5" title={item.description}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadge(item.category)}`}>
                          {item.category}
                        </span>
                      </td>

                      {/* 4. Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.department}</span>
                        </div>
                      </td>

                      {/* 5. Total Quantity */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-sm">
                          {item.quantity}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          {item.unit || 'Units'}
                        </span>
                      </td>

                      {/* 6. Available Quantity & Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="w-full max-w-[130px] mx-auto">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-bold ${
                              item.availableQuantity === 0 
                                ? 'text-red-600' 
                                : item.availableQuantity < item.quantity 
                                ? 'text-purple-700' 
                                : 'text-emerald-700'
                            }`}>
                              {item.availableQuantity} {item.unit || 'Units'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {availabilityPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                item.availableQuantity === 0 
                                  ? 'bg-red-500' 
                                  : item.availableQuantity < item.quantity 
                                  ? 'bg-purple-500' 
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, availabilityPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7. Resource Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* 8. Last Updated */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.lastUpdated}</span>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            title="View Full Resource Details"
                            className="p-1.5 text-slate-400 hover:text-[#2563A6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Resource"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(item)}
                            title="Delete Resource"
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
        5. ADD RESOURCE MODAL (Requirement 6)
        - Form validation
        - Unique ID check
        - Available Qty <= Total Qty
        - Saves to localStorage & updates state
        ============================================================
      */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital Resource to Catalog"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.resourceId}
                onChange={e => setAddForm({ ...addForm, resourceId: e.target.value })}
                placeholder="e.g. RES-EQP-105"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
              <span className="text-[10px] text-slate-400">Must be unique across hospital resources.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={addForm.category}
                onChange={e => setAddForm({ ...addForm, category: e.target.value as ResourceCategory })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addForm.name}
              onChange={e => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Portable Ultrasound Scanner (GE Venue Fit)"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Allocated Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.department}
                onChange={e => setAddForm({ ...addForm, department: e.target.value })}
                placeholder="e.g. ICU Complex, Emergency, Pharmacy"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={addForm.unit}
                onChange={e => setAddForm({ ...addForm, unit: e.target.value })}
                placeholder="e.g. Units, Cylinders, Vials, Boxes"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={addForm.quantity}
                onChange={e => setAddForm({ ...addForm, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={addForm.quantity}
                required
                value={addForm.availableQuantity}
                onChange={e => setAddForm({ ...addForm, availableQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={addForm.status}
                onChange={e => setAddForm({ ...addForm, status: e.target.value as ResourceStatus })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Specifications / Serial Info
            </label>
            <textarea
              rows={2}
              value={addForm.description}
              onChange={e => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Clinical specifications, manufacturer model, or calibration instructions..."
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
              Save Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* 
        ============================================================
        6. EDIT RESOURCE MODAL (Requirement 7)
        - Prefills selected resource details
        - Validates input (Available <= Total)
        - Updates state & localStorage
        ============================================================
      */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveResource(null);
        }}
        title={`Edit Resource — ${activeResource?.resourceId || ''}`}
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
                Resource ID (Immutable)
              </label>
              <input
                type="text"
                disabled
                value={editForm.resourceId}
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.category}
                onChange={e => setEditForm({ ...editForm, category: e.target.value as ResourceCategory })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Name <span className="text-red-500">*</span>
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
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.department}
                onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={editForm.unit}
                onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={editForm.quantity}
                onChange={e => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={editForm.quantity}
                required
                value={editForm.availableQuantity}
                onChange={e => setEditForm({ ...editForm, availableQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value as ResourceStatus })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Specifications
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
                setActiveResource(null);
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
              Update Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* 
        ============================================================
        7. DELETE CONFIRMATION MODAL (Requirement 8)
        - Explicit confirmation dialog
        - Shows item details before permanent removal
        - Updates state & localStorage
        ============================================================
      */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveResource(null);
        }}
        title="Confirm Resource Deletion"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">
                Are you sure you want to delete this resource?
              </h4>
              <p className="text-xs text-red-700 mt-1">
                This action will permanently remove this item from the active MediSync AI hospital resource registry.
              </p>
            </div>
          </div>

          {activeResource && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Resource ID:</span>
                <span className="font-mono font-bold text-slate-800">{activeResource.resourceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-800">{activeResource.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-800">{activeResource.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-800">{activeResource.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory:</span>
                <span className="font-medium text-slate-800">{activeResource.quantity} {activeResource.unit} ({activeResource.availableQuantity} available)</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setActiveResource(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Resource
            </Button>
          </div>
        </div>
      </Modal>

      {/* 
        ============================================================
        8. VIEW DETAILS MODAL
        ============================================================
      */}
      {activeResource && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setActiveResource(null);
          }}
          title="Resource Details & Inventory Profile"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {activeResource.resourceId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeResource.name}</h3>
                <p className="text-xs text-slate-500">{activeResource.department} • {activeResource.category}</p>
              </div>
              <div>
                {getStatusBadge(activeResource.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Total Quantity</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {activeResource.quantity} {activeResource.unit}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block">Available Quantity</span>
                <span className={`text-xl font-bold mt-0.5 block ${
                  activeResource.availableQuantity === 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {activeResource.availableQuantity} {activeResource.unit}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Clinical Specifications & Notes:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeResource.description || 'No additional notes logged.'}
                </p>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-500">
                <span>Last Telemetry Sync:</span>
                <span className="font-medium text-slate-700">{activeResource.lastUpdated}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(activeResource);
                }}
                className="text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit Resource
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setActiveResource(null);
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
