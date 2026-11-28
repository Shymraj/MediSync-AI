import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList,
  Search, 
  Filter, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Package, 
  Check, 
  FilterX, 
  Eye, 
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Send,
  UserCheck,
  Ban,
  Boxes,
  ArrowRight,
  TrendingUp,
  History,
  Phone,
  Mail,
  Calendar,
  Layers,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { 
  INITIAL_REQUESTS, 
  ResourceRequestItem, 
  RequestStatus, 
  RequestPriority, 
  RequestTimelineEntry 
} from '../../data/requestDemoData';
import { 
  INITIAL_RESOURCES, 
  ResourceItem, 
  ResourceCategory 
} from '../../data/resourceDemoData';

const REQUESTS_STORAGE_KEY = 'medisync_resource_requests_data';
const RESOURCES_STORAGE_KEY = 'medisync_resource_registry_data';

const STATUS_LIST: RequestStatus[] = [
  'Pending',
  'Under Review',
  'Approved',
  'Allocated',
  'Completed',
  'Rejected',
  'Cancelled'
];

const PRIORITY_LIST: RequestPriority[] = ['Urgent', 'High', 'Normal', 'Low'];

const DEPARTMENTS_LIST = [
  'Emergency',
  'ICU Complex',
  'Cardiology',
  'General Medicine',
  'Surgery',
  'Pediatrics',
  'Neurology',
  'Orthopedics'
];

const CATEGORIES_LIST: ResourceCategory[] = [
  'Medical Equipment',
  'Emergency Supplies',
  'ICU Resources',
  'General Hospital Supplies',
  'Patient Care Resources'
];

interface ResourceRequestsPageProps {
  onSelectTab?: (tab: string) => void;
}

export const ResourceRequestsPage: React.FC<ResourceRequestsPageProps> = ({ onSelectTab }) => {
  // 1. Live Requests State with localStorage persistence
  const [requests, setRequests] = useState<ResourceRequestItem[]>(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse requests from localStorage:', e);
    }
    return INITIAL_REQUESTS;
  });

  // 2. Shared Resource Registry State (for stock validation & allocation deduction)
  const [registryResources, setRegistryResources] = useState<ResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(RESOURCES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse resources from localStorage:', e);
    }
    return INITIAL_RESOURCES;
  });

  // Save requests helper
  const saveRequests = (newRequests: ResourceRequestItem[]) => {
    setRequests(newRequests);
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(newRequests));
      window.dispatchEvent(new CustomEvent('medisync_hospital_data_updated', { detail: { type: 'requests_updated' } }));
    } catch (e) {
      console.error('Failed to save requests:', e);
    }
  };

  // Sync with Hospital-Wide Data Service (Doctor Requisitions & Emergency Intake)
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setRequests(parsed);
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

  // Save registry resources helper
  const saveRegistryResources = (newResources: ResourceItem[]) => {
    setRegistryResources(newResources);
    try {
      localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(newResources));
    } catch (e) {
      console.error('Failed to save resources:', e);
    }
  };

  // 3. UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'quantity'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [detailModalRequest, setDetailModalRequest] = useState<ResourceRequestItem | null>(null);
  const [rejectModalRequest, setRejectModalRequest] = useState<ResourceRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [allocateModalRequest, setAllocateModalRequest] = useState<ResourceRequestItem | null>(null);
  const [selectedRegistryResourceId, setSelectedRegistryResourceId] = useState<string>('');
  const [allocateQuantity, setAllocateQuantity] = useState<number>(1);
  const [allocateError, setAllocateError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    requestedBy: 'Dr. Priya Sundaram',
    doctorEmail: 'priya.sundaram@medisync.net',
    doctorPhone: '+91 98401 22334',
    department: 'Emergency',
    ward: 'Emergency Triage',
    resourceType: 'Emergency Supplies' as ResourceCategory,
    resourceName: 'Sterile IV Cannula sets (18G / 20G)',
    quantity: 25,
    unit: 'Sets',
    priority: 'High' as RequestPriority,
    reason: 'Emergency surge in acute trauma arrivals requiring rapid vascular access stabilization.'
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // 4. KPI Calculations
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const underReview = requests.filter(r => r.status === 'Under Review').length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const allocated = requests.filter(r => r.status === 'Allocated').length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    const urgent = requests.filter(r => r.priority === 'Urgent').length;

    return {
      total,
      pending,
      underReview,
      approved,
      allocated,
      completed,
      rejected,
      urgent
    };
  }, [requests]);

  // 5. Filter and Sort logic
  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      // Search
      const matchesSearch = 
        searchQuery === '' ||
        item.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ward.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

      // Priority
      const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;

      // Department
      const matchesDepartment = selectedDepartment === 'All' || item.department === selectedDepartment;

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityScore: Record<RequestPriority, number> = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      // default newest: request IDs descending or natural order
      return b.requestId.localeCompare(a.requestId);
    });
  }, [requests, searchQuery, selectedStatus, selectedPriority, selectedDepartment, sortBy]);

  // Handlers for Admin Actions
  const handleReviewRequest = (item: ResourceRequestItem) => {
    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...item.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Reviewed',
        actor: 'Hospital Admin Command',
        notes: 'Requisition dossier placed under clinical review. Verifying ward priority and central stores inventory.'
      }
    ];

    const updated = requests.map(r => r.id === item.id ? {
      ...r,
      status: 'Under Review' as RequestStatus,
      timeline: updatedTimeline
    } : r);

    saveRequests(updated);
    showToast(`Request ${item.requestId} marked as Under Review.`);
    if (detailModalRequest?.id === item.id) {
      setDetailModalRequest(updated.find(r => r.id === item.id) || null);
    }
  };

  const handleApproveRequest = (item: ResourceRequestItem) => {
    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...item.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Approved',
        actor: 'Hospital Admin Command',
        notes: 'Requisition formally approved by Hospital Administrator. Cleared for warehouse/central stock allocation.'
      }
    ];

    const updated = requests.map(r => r.id === item.id ? {
      ...r,
      status: 'Approved' as RequestStatus,
      timeline: updatedTimeline
    } : r);

    saveRequests(updated);
    showToast(`Request ${item.requestId} approved for allocation.`);
    if (detailModalRequest?.id === item.id) {
      setDetailModalRequest(updated.find(r => r.id === item.id) || null);
    }
  };

  const handleOpenRejectModal = (item: ResourceRequestItem) => {
    setRejectModalRequest(item);
    setRejectReason('');
    setRejectError(null);
  };

  const handleConfirmReject = () => {
    if (!rejectModalRequest) return;
    const cleanReason = rejectReason.trim();
    if (!cleanReason) {
      setRejectError('Please provide an official clinical or inventory justification for rejecting this requisition.');
      return;
    }

    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...rejectModalRequest.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Rejected',
        actor: 'Hospital Admin Command',
        notes: `Requisition rejected. Reason: ${cleanReason}`
      }
    ];

    const updated = requests.map(r => r.id === rejectModalRequest.id ? {
      ...r,
      status: 'Rejected' as RequestStatus,
      rejectionReason: cleanReason,
      timeline: updatedTimeline
    } : r);

    saveRequests(updated);
    showToast(`Request ${rejectModalRequest.requestId} was rejected.`);
    if (detailModalRequest?.id === rejectModalRequest.id) {
      setDetailModalRequest(updated.find(r => r.id === rejectModalRequest.id) || null);
    }
    setRejectModalRequest(null);
  };

  // Open Allocation Modal
  const handleOpenAllocateModal = (item: ResourceRequestItem) => {
    setAllocateModalRequest(item);
    setAllocateError(null);

    // Look for best matching resource in registry
    const matchingResource = registryResources.find(res => 
      res.name.toLowerCase().includes(item.resourceName.toLowerCase()) ||
      item.resourceName.toLowerCase().includes(res.name.toLowerCase()) ||
      res.category === item.resourceType
    );

    if (matchingResource) {
      setSelectedRegistryResourceId(matchingResource.id);
      const defaultQty = Math.min(item.quantity, matchingResource.availableQuantity);
      setAllocateQuantity(defaultQty > 0 ? defaultQty : item.quantity);
    } else if (registryResources.length > 0) {
      setSelectedRegistryResourceId(registryResources[0].id);
      setAllocateQuantity(item.quantity);
    }
  };

  const handleConfirmAllocate = () => {
    if (!allocateModalRequest) return;
    const resource = registryResources.find(r => r.id === selectedRegistryResourceId);

    if (!resource) {
      setAllocateError('Please select a valid inventory resource from the Resource Registry.');
      return;
    }

    if (allocateQuantity <= 0) {
      setAllocateError('Allocation quantity must be at least 1 unit.');
      return;
    }

    if (allocateQuantity > resource.availableQuantity) {
      setAllocateError(
        `Insufficient stock! Only ${resource.availableQuantity} ${resource.unit} available in Resource Registry. Cannot allocate ${allocateQuantity}.`
      );
      return;
    }

    // 1. Deduct allocated quantity from Shared Resource Registry
    const updatedResources = registryResources.map(r => {
      if (r.id === resource.id) {
        const newAvailable = Math.max(0, r.availableQuantity - allocateQuantity);
        const newStatus = newAvailable === 0 
          ? 'In Use' as const 
          : newAvailable < r.quantity 
          ? 'Partially Available' as const 
          : r.status;
        return {
          ...r,
          availableQuantity: newAvailable,
          status: newStatus,
          lastUpdated: 'Just now (Allocated to ' + allocateModalRequest.department + ')'
        };
      }
      return r;
    });

    saveRegistryResources(updatedResources);

    // 2. Update Request Status to Allocated
    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...allocateModalRequest.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Allocated',
        actor: 'Hospital Admin Command',
        notes: `Successfully allocated ${allocateQuantity} ${allocateModalRequest.unit} of "${resource.name}" (ID: ${resource.resourceId}) to ${allocateModalRequest.department} (${allocateModalRequest.ward}). Remaining registry balance: ${resource.availableQuantity - allocateQuantity}.`
      }
    ];

    const updatedRequests = requests.map(r => r.id === allocateModalRequest.id ? {
      ...r,
      status: 'Allocated' as RequestStatus,
      allocatedResourceId: resource.resourceId,
      allocatedResourceName: resource.name,
      allocatedQuantity: allocateQuantity,
      timeline: updatedTimeline
    } : r);

    saveRequests(updatedRequests);
    showToast(`Allocated ${allocateQuantity} ${allocateModalRequest.unit} to ${allocateModalRequest.requestId}. Shared inventory updated!`);
    
    if (detailModalRequest?.id === allocateModalRequest.id) {
      setDetailModalRequest(updatedRequests.find(r => r.id === allocateModalRequest.id) || null);
    }
    setAllocateModalRequest(null);
  };

  const handleCompleteRequest = (item: ResourceRequestItem) => {
    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...item.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Completed',
        actor: 'Hospital Admin Command',
        notes: 'Delivery received and operational setup verified by receiving clinical ward staff. Requisition fulfilled.'
      }
    ];

    const updated = requests.map(r => r.id === item.id ? {
      ...r,
      status: 'Completed' as RequestStatus,
      timeline: updatedTimeline
    } : r);

    saveRequests(updated);
    showToast(`Request ${item.requestId} marked as Completed.`);
    if (detailModalRequest?.id === item.id) {
      setDetailModalRequest(updated.find(r => r.id === item.id) || null);
    }
  };

  const handleCancelRequest = (item: ResourceRequestItem) => {
    const now = 'Just now';
    const updatedTimeline: RequestTimelineEntry[] = [
      ...item.timeline,
      {
        id: `t-${Date.now()}`,
        timestamp: now,
        action: 'Cancelled',
        actor: 'Hospital Admin Command',
        notes: 'Requisition cancelled by request of clinical department.'
      }
    ];

    const updated = requests.map(r => r.id === item.id ? {
      ...r,
      status: 'Cancelled' as RequestStatus,
      timeline: updatedTimeline
    } : r);

    saveRequests(updated);
    showToast(`Request ${item.requestId} cancelled.`);
    if (detailModalRequest?.id === item.id) {
      setDetailModalRequest(updated.find(r => r.id === item.id) || null);
    }
  };

  // Reset demo data handler
  const handleResetDemoData = () => {
    saveRequests(INITIAL_REQUESTS);
    saveRegistryResources(INITIAL_RESOURCES);
    showToast('Resource Requests & Registry stock reset to default demo dataset.');
  };

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Live requisition log synchronized.');
    }, 600);
  };

  // Create new ad-hoc request handler
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newIdNum = requests.length + 80;
    const reqId = `REQ-2026-0${newIdNum}`;

    const newReq: ResourceRequestItem = {
      id: `req-${Date.now()}`,
      requestId: reqId,
      requestedBy: newRequestForm.requestedBy,
      doctorEmail: newRequestForm.doctorEmail,
      doctorPhone: newRequestForm.doctorPhone,
      department: newRequestForm.department,
      ward: newRequestForm.ward,
      resourceType: newRequestForm.resourceType,
      resourceName: newRequestForm.resourceName,
      quantity: Number(newRequestForm.quantity),
      unit: newRequestForm.unit,
      priority: newRequestForm.priority,
      requestDate: 'Today, Just now',
      status: 'Pending',
      reason: newRequestForm.reason,
      timeline: [
        {
          id: `t-${Date.now()}`,
          timestamp: 'Just now',
          action: 'Submitted',
          actor: `${newRequestForm.requestedBy} (${newRequestForm.department})`,
          notes: 'Submitted clinical requisition for department patient care.'
        }
      ]
    };

    saveRequests([newReq, ...requests]);
    setShowCreateModal(false);
    showToast(`Requisition ${reqId} successfully created.`);
  };

  // Helpers for Badges
  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563A6] border border-blue-200">
            <Eye className="w-3 h-3 text-[#2563A6]" />
            Under Review
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            Approved
          </span>
        );
      case 'Allocated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Boxes className="w-3 h-3 text-purple-600" />
            Allocated
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <Check className="w-3 h-3 text-[#15803D]" />
            Completed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <Ban className="w-3 h-3 text-red-600" />
            Rejected
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            Cancelled
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            High
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Normal
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
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
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HEADER & ACTION BAR                                         */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Resource Requests</h1>
            <Badge variant="primary" size="sm">
              Live Requisition Desk
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Review clinical requisitions, manage department allocations, and coordinate real-time equipment and supply fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemoData}
            title="Reset to default synthetic demo requests"
            className="text-slate-600"
          >
            Reset Demo Data
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Raise Request
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUMMARY KPI CARDS (Requirement 1 & 2)                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Total Requests
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563A6] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1E293B]">{stats.total}</span>
            <span className="text-xs text-[#64748B]">logged requisitions</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Active: {stats.pending + stats.underReview + stats.approved}</span>
            <span className="font-semibold text-emerald-600">Fulfilled: {stats.completed}</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Pending Requests
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{stats.pending}</span>
            <span className="text-xs text-[#64748B]">awaiting admin action</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Under Review: {stats.underReview}</span>
            <span className="text-amber-700 font-semibold">{stats.pending > 0 ? 'Requires attention' : 'All cleared'}</span>
          </div>
        </div>

        {/* Approved Requests */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Approved Requests
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700">{stats.approved}</span>
            <span className="text-xs text-[#64748B]">ready to allocate</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>In Allocation: {stats.allocated}</span>
            <span className="text-indigo-600 font-semibold">Warehouse ready</span>
          </div>
        </div>

        {/* Urgent Requests */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Urgent Requests
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#DC2626]">{stats.urgent}</span>
            <span className="text-xs text-[#64748B]">critical priority</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Immediate triage</span>
            <span className="text-red-600 font-semibold">High impact</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SEARCH & MULTI-FILTER BAR (Requirement 7)                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Request ID, doctor name, resource name, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563A6] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Statuses ({requests.length})</option>
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>
                    {st} ({requests.filter(r => r.status === st).length})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Priorities</option>
                {PRIORITY_LIST.map(pr => (
                  <option key={pr} value={pr}>
                    {pr} ({requests.filter(r => r.priority === pr).length})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS_LIST.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="priority">Sort: Urgent Priority</option>
                <option value="quantity">Sort: High Quantity</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedStatus !== 'All' || selectedPriority !== 'All' || selectedDepartment !== 'All') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('All');
                  setSelectedPriority('All');
                  setSelectedDepartment('All');
                }}
                icon={<FilterX className="w-3.5 h-3.5" />}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-[#1E293B]">{filteredRequests.length}</strong> of {requests.length} requisitions</span>
            {selectedStatus !== 'All' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">Status: {selectedStatus}</span>
            )}
            {selectedPriority !== 'All' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">Priority: {selectedPriority}</span>
            )}
            {selectedDepartment !== 'All' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">Dept: {selectedDepartment}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Boxes className="w-3.5 h-3.5" />
            <span>Shared Registry Link: Active</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RESOURCE REQUESTS TABLE (Requirement 1, 3, 6)               */}
      {/* ============================================================== */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Department & Ward</th>
                <th className="py-3 px-4">Resource Requested</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-[#1E293B]">No requisitions found</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        No requests match your current search and filter criteria. Try resetting filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedStatus('All');
                          setSelectedPriority('All');
                          setSelectedDepartment('All');
                        }}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Request ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563A6] whitespace-nowrap">
                      <button
                        onClick={() => setDetailModalRequest(req)}
                        className="hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                      >
                        <span>{req.requestId}</span>
                      </button>
                    </td>

                    {/* Requested By */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1E293B]">{req.requestedBy}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{req.doctorEmail}</span>
                      </div>
                    </td>

                    {/* Department & Ward */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1E293B]">{req.department}</div>
                      <div className="text-[11px] text-[#64748B]">{req.ward}</div>
                    </td>

                    {/* Resource Requested */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="font-semibold text-[#1E293B] truncate" title={req.resourceName}>
                        {req.resourceName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{req.resourceType}</span>
                      </div>
                      {req.allocatedResourceName && (
                        <div className="text-[10px] text-purple-700 font-medium mt-0.5 bg-purple-50 px-1.5 py-0.5 rounded inline-block">
                          Allocated: {req.allocatedQuantity} {req.unit} ({req.allocatedResourceId})
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium text-[#1E293B]">
                      <span className="font-bold text-sm">{req.quantity}</span>{' '}
                      <span className="text-[11px] text-[#64748B]">{req.unit}</span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getPriorityBadge(req.priority)}
                    </td>

                    {/* Request Date */}
                    <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{req.requestDate}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailModalRequest(req)}
                          title="View Request Dossier & Timeline"
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1E293B]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Review Request Button (when Pending) */}
                        {req.status === 'Pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewRequest(req)}
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 text-[11px] py-1 px-2.5 h-7"
                          >
                            Review
                          </Button>
                        )}

                        {/* Approve Request Button (when Pending or Under Review) */}
                        {(req.status === 'Pending' || req.status === 'Under Review') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveRequest(req)}
                            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-[11px] py-1 px-2.5 h-7"
                          >
                            Approve
                          </Button>
                        )}

                        {/* Allocate Resource Button (when Approved) */}
                        {req.status === 'Approved' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAllocateModal(req)}
                            className="text-[11px] py-1 px-2.5 h-7 bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Allocate
                          </Button>
                        )}

                        {/* Complete Request Button (when Allocated) */}
                        {req.status === 'Allocated' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteRequest(req)}
                            className="text-[#15803D] border-green-300 hover:bg-green-50 text-[11px] py-1 px-2.5 h-7"
                          >
                            Complete
                          </Button>
                        )}

                        {/* Reject Request Button (when Pending or Under Review) */}
                        {(req.status === 'Pending' || req.status === 'Under Review') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRejectModal(req)}
                            title="Reject Requisition"
                            className="h-7 px-2 text-red-600 hover:bg-red-50 text-[11px]"
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563A6]" />
            <span>
              Real-time synchronization connected with MediSync Institutional Warehouse and Resource Registry.
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Node: REQ-DISPATCH-01 • Active Store: RGGGH-CHN
          </div>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* 5. REQUEST DETAILS MODAL (Requirement 5)                       */}
      {/* ============================================================== */}
      {detailModalRequest && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalRequest(null)}
          title={`Requisition Dossier — ${detailModalRequest.requestId}`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {/* Top Status & Priority Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#64748B]">Status:</span>
                {getStatusBadge(detailModalRequest.status)}
                <span className="text-xs font-semibold text-[#64748B] ml-2">Priority:</span>
                {getPriorityBadge(detailModalRequest.priority)}
              </div>
              <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Logged: {detailModalRequest.requestDate}</span>
              </div>
            </div>

            {/* Doctor & Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#2563A6]" />
                  Requesting Clinician
                </div>
                <div className="font-bold text-sm text-[#1E293B]">{detailModalRequest.requestedBy}</div>
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{detailModalRequest.doctorEmail}</span>
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{detailModalRequest.doctorPhone}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563A6]" />
                  Department & Ward
                </div>
                <div className="font-bold text-sm text-[#1E293B]">{detailModalRequest.department}</div>
                <div className="text-xs text-[#64748B]">
                  Designated Ward: <strong className="text-slate-700">{detailModalRequest.ward}</strong>
                </div>
                <div className="text-xs text-[#64748B]">
                  Category: <span className="text-[#2563A6] font-medium">{detailModalRequest.resourceType}</span>
                </div>
              </div>
            </div>

            {/* Requisition Spec & Justification */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#2563A6]" />
                Resource Requisition Breakdown
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div>
                  <div className="font-bold text-sm text-[#1E293B]">{detailModalRequest.resourceName}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Category: {detailModalRequest.resourceType}</div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#2563A6]">{detailModalRequest.quantity}</span>{' '}
                  <span className="text-xs font-semibold text-[#64748B]">{detailModalRequest.unit}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#1E293B]">Clinical Justification & Indication:</span>
                <p className="text-xs text-[#475569] mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {detailModalRequest.reason}
                </p>
              </div>

              {/* Allocation Info if present */}
              {detailModalRequest.allocatedResourceName && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    Central Inventory Allocation Details
                  </div>
                  <div className="text-xs text-purple-800 mt-1">
                    Allocated: <strong>{detailModalRequest.allocatedQuantity} {detailModalRequest.unit}</strong> of{' '}
                    <strong>{detailModalRequest.allocatedResourceName}</strong> (ID: {detailModalRequest.allocatedResourceId})
                  </div>
                </div>
              )}

              {/* Rejection Reason if present */}
              {detailModalRequest.rejectionReason && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-red-600" />
                    Rejection Reason
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    {detailModalRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Activity History Timeline */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#2563A6]" />
                Audit Trail & Activity History
              </div>

              <div className="space-y-3 pl-2 border-l-2 border-blue-200 ml-2">
                {detailModalRequest.timeline.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2563A6] absolute -left-[1.35rem] top-1.5 border-2 border-white ring-2 ring-blue-100" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1E293B]">{entry.action}</span>
                      <span className="text-[11px] text-slate-400">{entry.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] font-medium mt-0.5">By: {entry.actor}</div>
                    <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                      {entry.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalRequest(null)}
              >
                Close Dossier
              </Button>

              <div className="flex items-center gap-2">
                {detailModalRequest.status === 'Pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewRequest(detailModalRequest)}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    Mark as Under Review
                  </Button>
                )}

                {(detailModalRequest.status === 'Pending' || detailModalRequest.status === 'Under Review') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveRequest(detailModalRequest)}
                  >
                    Approve Request
                  </Button>
                )}

                {detailModalRequest.status === 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const req = detailModalRequest;
                      setDetailModalRequest(null);
                      handleOpenAllocateModal(req);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Allocate from Registry
                  </Button>
                )}

                {detailModalRequest.status === 'Allocated' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleCompleteRequest(detailModalRequest)}
                  >
                    Mark as Completed
                  </Button>
                )}

                {(detailModalRequest.status === 'Pending' || detailModalRequest.status === 'Under Review') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const req = detailModalRequest;
                      setDetailModalRequest(null);
                      handleOpenRejectModal(req);
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 6. ALLOCATION MODAL (Requirement 6 - Shared Inventory Link)   */}
      {/* ============================================================== */}
      {allocateModalRequest && (
        <Modal
          isOpen={true}
          onClose={() => setAllocateModalRequest(null)}
          title={`Allocate Stock — ${allocateModalRequest.requestId}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
              <div className="font-bold flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-purple-600" />
                Hospital Resource Registry Deduct Protocol
              </div>
              <p className="mt-1 text-purple-800">
                Selecting and allocating items from the central registry will immediately decrement live stock in the Resource Registry module.
              </p>
            </div>

            {/* Requested Summary */}
            <div className="p-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-xs space-y-1">
              <div>Requested Resource: <strong className="text-[#1E293B]">{allocateModalRequest.resourceName}</strong></div>
              <div>Department / Ward: <strong className="text-[#1E293B]">{allocateModalRequest.department} ({allocateModalRequest.ward})</strong></div>
              <div>Requested Quantity: <strong className="text-purple-700">{allocateModalRequest.quantity} {allocateModalRequest.unit}</strong></div>
            </div>

            {/* Resource Selection from Registry */}
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Select Matching Inventory Item in Resource Registry:
              </label>
              <select
                value={selectedRegistryResourceId}
                onChange={(e) => {
                  setSelectedRegistryResourceId(e.target.value);
                  setAllocateError(null);
                }}
                className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                {registryResources.map(res => (
                  <option key={res.id} value={res.id}>
                    [{res.resourceId}] {res.name} — Available: {res.availableQuantity} {res.unit} ({res.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Display Selected Resource Live Available Stock */}
            {(() => {
              const selectedRes = registryResources.find(r => r.id === selectedRegistryResourceId);
              if (!selectedRes) return null;
              const hasEnough = selectedRes.availableQuantity >= allocateQuantity;
              return (
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  hasEnough ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {hasEnough ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    <span>Available Stock in Registry:</span>
                  </div>
                  <strong className="text-sm">
                    {selectedRes.availableQuantity} {selectedRes.unit}
                  </strong>
                </div>
              );
            })()}

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Quantity to Allocate:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={allocateQuantity}
                  onChange={(e) => {
                    setAllocateQuantity(Number(e.target.value));
                    setAllocateError(null);
                  }}
                  className="w-32 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-xs text-[#64748B] font-medium">{allocateModalRequest.unit}</span>
              </div>
            </div>

            {/* Error Display */}
            {allocateError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{allocateError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllocateModalRequest(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAllocate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                icon={<Boxes className="w-3.5 h-3.5" />}
              >
                Confirm Allocation & Deduct Stock
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 7. REJECT REQUEST MODAL (Requirement 6 - Mandatory Reason)     */}
      {/* ============================================================== */}
      {rejectModalRequest && (
        <Modal
          isOpen={true}
          onClose={() => setRejectModalRequest(null)}
          title={`Reject Requisition — ${rejectModalRequest.requestId}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-red-600" />
                Rejection Protocol
              </div>
              <p className="mt-1">
                Please provide an official justification for the requesting doctor ({rejectModalRequest.requestedBy}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Rejection Reason <span className="text-red-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError(null);
                }}
                placeholder="e.g. Current stock reserved for trauma emergency cases. Alternative equipment suggested: Portable Bipap."
                className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg p-2.5 text-[#1E293B] focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {rejectError && (
              <div className="p-2.5 bg-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalRequest(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmReject}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 8. CREATE REQUISITION MODAL (For demo testing)                */}
      {/* ============================================================== */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Raise Clinical Resource Requisition"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Requesting Clinician / Staff:</label>
                <input
                  type="text"
                  required
                  value={newRequestForm.requestedBy}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, requestedBy: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Doctor Email:</label>
                <input
                  type="email"
                  required
                  value={newRequestForm.doctorEmail}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, doctorEmail: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Department:</label>
                <select
                  value={newRequestForm.department}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, department: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                >
                  {DEPARTMENTS_LIST.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Ward Name:</label>
                <input
                  type="text"
                  required
                  value={newRequestForm.ward}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, ward: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Resource Category:</label>
                <select
                  value={newRequestForm.resourceType}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, resourceType: e.target.value as ResourceCategory })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                >
                  {CATEGORIES_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Priority Level:</label>
                <select
                  value={newRequestForm.priority}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, priority: e.target.value as RequestPriority })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                >
                  {PRIORITY_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1">Resource Name:</label>
                <input
                  type="text"
                  required
                  value={newRequestForm.resourceName}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, resourceName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRequestForm.quantity}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, quantity: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">Unit:</label>
                  <input
                    type="text"
                    required
                    value={newRequestForm.unit}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, unit: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">Clinical Justification & Purpose:</label>
              <textarea
                rows={2}
                required
                value={newRequestForm.reason}
                onChange={(e) => setNewRequestForm({ ...newRequestForm, reason: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg p-2 text-[#1E293B] focus:ring-1 focus:ring-[#2563A6] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Requisition
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
