import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Check, 
  FilterX, 
  Eye, 
  Building2, 
  SlidersHorizontal, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  History, 
  Info, 
  UserCheck, 
  UserX, 
  HelpCircle, 
  Phone, 
  Mail, 
  Stethoscope, 
  Award, 
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { 
  INITIAL_STAFF, 
  StaffMember, 
  StaffRole, 
  StaffVerificationStatus,
  StaffAuditEntry
} from '../../data/staffDemoData';

const STORAGE_KEY = 'medisync_staff_verification_data';

const ROLE_OPTIONS: StaffRole[] = [
  'Doctor',
  'Nurse',
  'Hospital Administrator',
  'Other Hospital Staff'
];

const STATUS_OPTIONS: StaffVerificationStatus[] = [
  'Pending',
  'Verified',
  'Rejected',
  'Requires Additional Information'
];

interface StaffVerificationPageProps {
  onSelectTab?: (tab: string) => void;
}

export const StaffVerificationPage: React.FC<StaffVerificationPageProps> = ({ onSelectTab }) => {
  const { user, setUser } = useApp();

  // 1. Staff Records State (Persistent via localStorage)
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse staff verification data from localStorage:', e);
    }
    return INITIAL_STAFF;
  });

  const saveStaffList = (newList: StaffMember[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save staff verification data to localStorage:', e);
    }
  };

  // 2. Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3. Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // 4. Modals State
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<StaffMember | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedStaffForVerify, setSelectedStaffForVerify] = useState<StaffMember | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const [selectedStaffForReject, setSelectedStaffForReject] = useState<StaffMember | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const [selectedStaffForReqInfo, setSelectedStaffForReqInfo] = useState<StaffMember | null>(null);
  const [isReqInfoModalOpen, setIsReqInfoModalOpen] = useState(false);
  const [additionalInfoNotes, setAdditionalInfoNotes] = useState('');
  const [reqInfoError, setReqInfoError] = useState<string | null>(null);

  // Unique departments extracted dynamically
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staffList]);

  // 5. Dynamic Summary KPI Calculations (Requirement 2)
  const summaryMetrics = useMemo(() => {
    const totalStaff = staffList.length;
    const verifiedStaff = staffList.filter(s => s.verificationStatus === 'Verified').length;
    const pendingVerification = staffList.filter(s => s.verificationStatus === 'Pending').length;
    const rejectedApplications = staffList.filter(s => s.verificationStatus === 'Rejected').length;
    const requiresInfo = staffList.filter(s => s.verificationStatus === 'Requires Additional Information').length;

    return {
      totalStaff,
      verifiedStaff,
      pendingVerification,
      rejectedApplications,
      requiresInfo
    };
  }, [staffList]);

  // 6. Filtered Staff List (Requirement 9)
  const filteredStaff = useMemo(() => {
    return staffList.filter(item => {
      // Search by Name, Staff ID, or Email
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesId = item.staffId.toLowerCase().includes(query);
        const matchesEmail = item.email.toLowerCase().includes(query);
        const matchesReg = item.registrationNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail && !matchesReg) return false;
      }

      // Filter by Role
      if (selectedRole !== 'All' && item.requestedRole !== selectedRole) {
        return false;
      }

      // Filter by Department
      if (selectedDepartment !== 'All' && item.department !== selectedDepartment) {
        return false;
      }

      // Filter by Status
      if (selectedStatus !== 'All' && item.verificationStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [staffList, searchQuery, selectedRole, selectedDepartment, selectedStatus]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setStaffList(JSON.parse(saved));
      } catch {}
      const now = new Date();
      setLastRefreshedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
      showToast('Staff credentials and role access requests synchronized.', 'info');
    }, 350);
  };

  // Reset to initial demo catalog
  const handleResetToDefaults = () => {
    if (window.confirm('Reset Staff Verification catalog to initial 15 synthetic credential records?')) {
      saveStaffList(INITIAL_STAFF);
      showToast('Restored default staff verification catalog.', 'info');
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRole('All');
    setSelectedDepartment('All');
    setSelectedStatus('All');
  };

  // Check if current user is attempting self-approval (Requirement 10)
  const isSelfApproval = (staff: StaffMember): boolean => {
    if (!user) return false;
    return Boolean(
      (user.email && user.email.toLowerCase() === staff.email.toLowerCase()) ||
      (user.id && user.id === staff.id)
    );
  };

  // Open Details Modal (Requirement 5)
  const handleOpenDetails = (staff: StaffMember) => {
    setSelectedStaffForDetails(staff);
    setIsDetailsModalOpen(true);
  };

  // Open Verify Confirmation Modal (Requirement 6)
  const handleOpenVerifyModal = (staff: StaffMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSelfApproval(staff)) {
      showToast('Conflict of Interest: Administrators cannot approve their own staff applications.', 'warning');
      return;
    }
    setSelectedStaffForVerify(staff);
    setIsVerifyModalOpen(true);
  };

  // Confirm Staff Verification
  const handleConfirmVerify = async () => {
    if (!selectedStaffForVerify) return;

    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newAuditEntry: StaffAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: timeString,
      action: 'Verified',
      actor: user?.name ? `${user.name} (Hospital Admin)` : 'Hospital Admin Command',
      notes: `Approved ${selectedStaffForVerify.requestedRole} clinical role access following statutory credential check.`
    };

    const updatedList = staffList.map(s => {
      if (s.id === selectedStaffForVerify.id) {
        return {
          ...s,
          verificationStatus: 'Verified' as StaffVerificationStatus,
          rejectionReason: undefined,
          additionalInfoRequired: undefined,
          auditHistory: [newAuditEntry, ...s.auditHistory]
        };
      }
      return s;
    });

    saveStaffList(updatedList);

    // Call backend API if available
    try {
      await api.verifyStaffDecision(selectedStaffForVerify.id, 'approved');
    } catch {}

    // Update active details modal if open
    if (selectedStaffForDetails?.id === selectedStaffForVerify.id) {
      setSelectedStaffForDetails(prev => prev ? {
        ...prev,
        verificationStatus: 'Verified',
        auditHistory: [newAuditEntry, ...prev.auditHistory]
      } : null);
    }

    setIsVerifyModalOpen(false);
    showToast(`Staff member "${selectedStaffForVerify.name}" approved as ${selectedStaffForVerify.requestedRole}.`, 'success');
    setSelectedStaffForVerify(null);
  };

  // Open Reject Modal (Requirement 7)
  const handleOpenRejectModal = (staff: StaffMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSelfApproval(staff)) {
      showToast('Administrators cannot reject their own active credentials.', 'warning');
      return;
    }
    setSelectedStaffForReject(staff);
    setRejectionReason('');
    setRejectionError(null);
    setIsRejectModalOpen(true);
  };

  // Confirm Staff Rejection
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForReject) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectionError('Please specify the clinical or credential grounds for rejection.');
      return;
    }

    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newAuditEntry: StaffAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: timeString,
      action: 'Rejected',
      actor: user?.name ? `${user.name} (Hospital Admin)` : 'Hospital Admin Command',
      notes: `Rejected application: ${cleanReason}`
    };

    const updatedList = staffList.map(s => {
      if (s.id === selectedStaffForReject.id) {
        return {
          ...s,
          verificationStatus: 'Rejected' as StaffVerificationStatus,
          rejectionReason: cleanReason,
          auditHistory: [newAuditEntry, ...s.auditHistory]
        };
      }
      return s;
    });

    saveStaffList(updatedList);

    // Call backend API if available
    try {
      await api.verifyStaffDecision(selectedStaffForReject.id, 'rejected', cleanReason);
    } catch {}

    // Update active details modal if open
    if (selectedStaffForDetails?.id === selectedStaffForReject.id) {
      setSelectedStaffForDetails(prev => prev ? {
        ...prev,
        verificationStatus: 'Rejected',
        rejectionReason: cleanReason,
        auditHistory: [newAuditEntry, ...prev.auditHistory]
      } : null);
    }

    setIsRejectModalOpen(false);
    showToast(`Application for "${selectedStaffForReject.name}" marked as Rejected.`, 'info');
    setSelectedStaffForReject(null);
  };

  // Open Request Additional Information Modal (Requirement 8)
  const handleOpenReqInfoModal = (staff: StaffMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedStaffForReqInfo(staff);
    setAdditionalInfoNotes(staff.additionalInfoRequired || '');
    setReqInfoError(null);
    setIsReqInfoModalOpen(true);
  };

  // Confirm Request Additional Info
  const handleConfirmReqInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForReqInfo) return;

    const cleanNotes = additionalInfoNotes.trim();
    if (!cleanNotes) {
      setReqInfoError('Please enter what specific information, NOC, or certificate is required.');
      return;
    }

    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newAuditEntry: StaffAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: timeString,
      action: 'Requested Info',
      actor: user?.name ? `${user.name} (Hospital Admin)` : 'Hospital Admin Command',
      notes: `Additional information requested: ${cleanNotes}`
    };

    const updatedList = staffList.map(s => {
      if (s.id === selectedStaffForReqInfo.id) {
        return {
          ...s,
          verificationStatus: 'Requires Additional Information' as StaffVerificationStatus,
          additionalInfoRequired: cleanNotes,
          auditHistory: [newAuditEntry, ...s.auditHistory]
        };
      }
      return s;
    });

    saveStaffList(updatedList);

    // Update active details modal if open
    if (selectedStaffForDetails?.id === selectedStaffForReqInfo.id) {
      setSelectedStaffForDetails(prev => prev ? {
        ...prev,
        verificationStatus: 'Requires Additional Information',
        additionalInfoRequired: cleanNotes,
        auditHistory: [newAuditEntry, ...prev.auditHistory]
      } : null);
    }

    setIsReqInfoModalOpen(false);
    showToast(`Requested additional information from "${selectedStaffForReqInfo.name}".`, 'info');
    setSelectedStaffForReqInfo(null);
  };

  // Helper for Status Badge Styling (Requirement 4)
  const getStatusBadge = (status: StaffVerificationStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <UserX className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      case 'Requires Additional Information':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Requires Info
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Helper for Role Tag Styling
  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'Doctor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Nurse':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Hospital Administrator':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Other Hospital Staff':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedRole !== 'All' || selectedDepartment !== 'All' || selectedStatus !== 'All';

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
              <UserX className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* Header Banner & Global Actions (Requirement 1) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563A6] border border-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1E293B]">Staff Verification</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563A6] border border-blue-200">
                {summaryMetrics.pendingVerification} Awaiting Review
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review staff credentials, verify professional details, and manage hospital role access.
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
            title="Restore default synthetic staff records"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* 
        ============================================================
        2. SUMMARY CARDS (Requirement 2)
        - Total Staff
        - Verified Staff
        - Pending Verification
        - Rejected Applications
        Calculated dynamically from staff records
        ============================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Staff */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Staff
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-[#1E293B]">
                  {summaryMetrics.totalStaff}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  registered applicants
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2563A6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Clinical & Admin Staff</span>
            <span className="font-semibold text-[#2563A6]">4 Professional Roles</span>
          </div>
        </Card>

        {/* Card 2: Verified Staff */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Verified Staff
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-emerald-700">
                  {summaryMetrics.verifiedStaff}
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  active clearance ({summaryMetrics.totalStaff > 0 ? Math.round((summaryMetrics.verifiedStaff / summaryMetrics.totalStaff) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Authorized Dashboard Access</span>
            <span className="font-semibold text-emerald-700">{summaryMetrics.verifiedStaff} Cleared</span>
          </div>
        </Card>

        {/* Card 3: Pending Verification */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Pending Verification
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-amber-700">
                  {summaryMetrics.pendingVerification}
                </span>
                <span className="text-xs text-amber-600 font-medium">
                  in review queue
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Action Required</span>
            <span className="font-semibold text-amber-700">{summaryMetrics.pendingVerification} Pending</span>
          </div>
        </Card>

        {/* Card 4: Rejected Applications */}
        <Card className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Rejected Applications
              </p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-bold text-red-700">
                  {summaryMetrics.rejectedApplications}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {summaryMetrics.requiresInfo > 0 ? `+ ${summaryMetrics.requiresInfo} need info` : 'declined'}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Failed / Unverified</span>
            <span className="font-semibold text-red-700">{summaryMetrics.rejectedApplications} Rejected</span>
          </div>
        </Card>
      </div>

      {/* 
        ============================================================
        3. SEARCH & FILTERS (Requirement 9)
        - Search by staff name or staff ID
        - Filter by role
        - Filter by department
        - Filter by verification status
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
              placeholder="Search staff by name, staff ID (e.g. STF-DOC-101), registration #, or email..."
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
            {/* Filter by Role */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Role:</span>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Roles ({staffList.length})</option>
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
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
                {STATUS_OPTIONS.map(st => (
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
            Showing <strong className="text-slate-800 font-bold">{filteredStaff.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{staffList.length}</strong> staff credential profiles
            {hasActiveFilters && <span className="text-[#2563A6] ml-1.5">(Filtered)</span>}
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to inspect submitted certificates and review credentials
          </div>
        </div>
      </Card>

      {/* 
        ============================================================
        4. STAFF VERIFICATION TABLE (Requirement 3)
        Columns:
        - Staff ID
        - Staff Name
        - Email
        - Requested Role
        - Department
        - Professional Registration Number
        - Verification Status
        - Submitted Date
        - Actions (View Details, Verify, Reject, Request Info)
        ============================================================
      */}
      <Card className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff ID</th>
                <th className="py-3.5 px-4 min-w-[210px]">Staff Name</th>
                <th className="py-3.5 px-4 min-w-[190px]">Email</th>
                <th className="py-3.5 px-4 min-w-[140px]">Requested Role</th>
                <th className="py-3.5 px-4 min-w-[150px]">Department</th>
                <th className="py-3.5 px-4 min-w-[170px]">Registration #</th>
                <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                <th className="py-3.5 px-4 min-w-[110px]">Submitted</th>
                <th className="py-3.5 px-4 text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <FilterX className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No staff records match your criteria</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Try adjusting your search keywords, role filters, or department parameters.
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
                filteredStaff.map((item) => {
                  const selfApprove = isSelfApproval(item);

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => handleOpenDetails(item)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        item.verificationStatus === 'Pending' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* 1. Staff ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md group-hover:border-[#2563A6]/30 transition-colors">
                          {item.staffId}
                        </span>
                      </td>

                      {/* 2. Staff Name with Avatar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatarUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              // Fallback if image fails
                              (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}&backgroundColor=2563a6&textColor=ffffff`;
                            }}
                          />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-[#2563A6] transition-colors flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {selfApprove && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-[#2563A6]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.specialization}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.email}</span>
                        </div>
                      </td>

                      {/* 4. Requested Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(item.requestedRole)}`}>
                          {item.requestedRole}
                        </span>
                      </td>

                      {/* 5. Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.department}</span>
                        </div>
                      </td>

                      {/* 6. Professional Registration Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {item.registrationNumber}
                          </span>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {item.licensingAuthority}
                          </div>
                        </div>
                      </td>

                      {/* 7. Verification Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.verificationStatus)}
                      </td>

                      {/* 8. Submitted Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {item.submittedDate}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(item)}
                            title="View Complete Credential Dossier"
                            className="p-1.5 text-slate-400 hover:text-[#2563A6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.verificationStatus !== 'Verified' && (
                            <button
                              onClick={(e) => handleOpenVerifyModal(item, e)}
                              disabled={selfApprove}
                              title={selfApprove ? "Cannot self-approve own profile" : "Approve & Grant Role Clearance"}
                              className={`p-1.5 rounded-lg transition-colors ${
                                selfApprove 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {item.verificationStatus !== 'Rejected' && (
                            <button
                              onClick={(e) => handleOpenRejectModal(item, e)}
                              disabled={selfApprove}
                              title={selfApprove ? "Cannot reject own profile" : "Reject Application"}
                              className={`p-1.5 rounded-lg transition-colors ${
                                selfApprove 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleOpenReqInfoModal(item, e)}
                            title="Request Additional Information"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
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
        5. STAFF DETAILS MODAL (Requirement 5)
        ============================================================
      */}
      {selectedStaffForDetails && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedStaffForDetails(null);
          }}
          title={`Staff Credential Dossier — ${selectedStaffForDetails.staffId}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedStaffForDetails.avatarUrl}
                  alt={selectedStaffForDetails.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedStaffForDetails.name)}&backgroundColor=2563a6&textColor=ffffff`;
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedStaffForDetails.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(selectedStaffForDetails.requestedRole)}`}>
                      {selectedStaffForDetails.requestedRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedStaffForDetails.specialization}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedStaffForDetails.email}</span>
                    <span>•</span>
                    <span>{selectedStaffForDetails.phone}</span>
                  </p>
                </div>
              </div>

              <div>
                {getStatusBadge(selectedStaffForDetails.verificationStatus)}
              </div>
            </div>

            {/* Synthetic notice indicator */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Synthetic Demo Records:</span> Credential data and registration numbers are generated for clinical platform demonstration and not connected to live statutory licensing authorities.
              </div>
            </div>

            {/* Hospital & Department Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#2563A6]" /> Hospital Affiliation
                </span>
                <span className="font-bold text-slate-900 block">{selectedStaffForDetails.hospitalName}</span>
                <span className="text-slate-400">District: {selectedStaffForDetails.district}</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block font-medium flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-[#2563A6]" /> Clinical Department
                </span>
                <span className="font-bold text-slate-900 block">{selectedStaffForDetails.department}</span>
                <span className="text-slate-400">Specialty: {selectedStaffForDetails.specialization}</span>
              </div>
            </div>

            {/* Professional Registration Details */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Statutory Registration Number:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {selectedStaffForDetails.registrationNumber}
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Licensing Authority / State Council:</span>
                <span className="font-semibold text-slate-800">{selectedStaffForDetails.licensingAuthority}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Application Submitted Date:</span>
                <span className="font-mono text-slate-700">{selectedStaffForDetails.submittedDate}</span>
              </div>
            </div>

            {/* Rejection or Required Info Banner */}
            {selectedStaffForDetails.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-red-900 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-red-600" /> Grounds for Rejection:
                </span>
                <p className="text-red-800 bg-white/70 p-2 rounded border border-red-100">
                  {selectedStaffForDetails.rejectionReason}
                </p>
              </div>
            )}

            {selectedStaffForDetails.additionalInfoRequired && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" /> Additional Requirements Pending:
                </span>
                <p className="text-blue-800 bg-white/70 p-2 rounded border border-blue-100">
                  {selectedStaffForDetails.additionalInfoRequired}
                </p>
              </div>
            )}

            {/* Submitted Documents Dossier */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#2563A6]" /> Submitted Credentials & Certificates ({selectedStaffForDetails.documents.length})
              </h4>
              <div className="space-y-1.5">
                {selectedStaffForDetails.documents.map(doc => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Ref: {doc.referenceNumber} • Issued {doc.issueDate}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'Resubmission Required' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit History Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#2563A6]" /> Role Access Verification History
              </h4>
              <div className="space-y-1.5">
                {selectedStaffForDetails.auditHistory.map(item => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.action} by {item.actor}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-600">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedStaffForDetails.verificationStatus !== 'Verified' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSelfApproval(selectedStaffForDetails)}
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleOpenVerifyModal(selectedStaffForDetails);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Verify Staff
                  </Button>
                )}
                {selectedStaffForDetails.verificationStatus !== 'Rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSelfApproval(selectedStaffForDetails)}
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleOpenRejectModal(selectedStaffForDetails);
                    }}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleOpenReqInfoModal(selectedStaffForDetails);
                  }}
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  Request Info
                </Button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedStaffForDetails(null);
                }}
                className="text-xs bg-slate-800 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 
        ============================================================
        6. VERIFY CONFIRMATION DIALOG (Requirement 6)
        ============================================================
      */}
      {selectedStaffForVerify && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setSelectedStaffForVerify(null);
          }}
          title="Confirm Staff Credential Clearance"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Approve and Authorize Role Membership?
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  You are granting authorized institutional access to <strong>{selectedStaffForVerify.name}</strong> as an authenticated <strong>{selectedStaffForVerify.requestedRole}</strong> in the {selectedStaffForVerify.department} department.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Staff Member:</span>
                <span className="font-bold text-slate-800">{selectedStaffForVerify.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Council Registration:</span>
                <span className="font-mono font-bold text-slate-800">{selectedStaffForVerify.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Role:</span>
                <span className="font-semibold text-emerald-700">{selectedStaffForVerify.requestedRole} Dashboard Access</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedStaffForVerify(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmVerify}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Confirm & Approve Staff
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 
        ============================================================
        7. REJECT CONFIRMATION DIALOG (Requirement 7)
        ============================================================
      */}
      {selectedStaffForReject && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setSelectedStaffForReject(null);
          }}
          title={`Reject Application — ${selectedStaffForReject.name}`}
        >
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
              <span className="font-bold block">Declining Role Clearance:</span>
              <p className="text-red-800 mt-0.5">
                Rejecting this application will restrict <strong>{selectedStaffForReject.name}</strong> from accessing clinical or admin dashboard portals.
              </p>
            </div>

            {rejectionError && (
              <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{rejectionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Statutory council registration could not be verified, or expired state medical council license."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedStaffForReject(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 
        ============================================================
        8. REQUEST ADDITIONAL INFORMATION DIALOG (Requirement 8)
        ============================================================
      */}
      {selectedStaffForReqInfo && (
        <Modal
          isOpen={isReqInfoModalOpen}
          onClose={() => {
            setIsReqInfoModalOpen(false);
            setSelectedStaffForReqInfo(null);
          }}
          title={`Request Additional Info — ${selectedStaffForReqInfo.name}`}
        >
          <form onSubmit={handleConfirmReqInfo} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <span className="font-bold block">Request Specific Documentation:</span>
              <p className="text-blue-800 mt-0.5">
                Specify what state council certificate, renewed registration, or institutional ID is required before clearance can proceed.
              </p>
            </div>

            {reqInfoError && (
              <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{reqInfoError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Information & Document Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={additionalInfoNotes}
                onChange={e => setAdditionalInfoNotes(e.target.value)}
                placeholder="e.g. Please upload your renewed 2026 State Medical Council certificate and faculty appointment order."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A6]/20 focus:border-[#2563A6]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReqInfoModalOpen(false);
                  setSelectedStaffForReqInfo(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-[#2563A6] hover:bg-[#1E4F8A] text-white font-semibold"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
