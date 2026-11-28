import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RotateCw, 
  Filter, 
  FilterX, 
  ChevronDown, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Building2, 
  Bed, 
  Users, 
  Activity, 
  Package, 
  Clock, 
  ArrowRight, 
  Info, 
  Check, 
  Ban, 
  Boxes, 
  TrendingUp, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { INITIAL_BEDS, BedItem } from '../../data/bedDemoData';
import { INITIAL_WARDS, WardItem } from '../../data/wardDemoData';
import { hospitalScopedKey } from '../../utils/hospitalSync';
import { INITIAL_EQUIPMENT, EquipmentItem } from '../../data/equipmentDemoData';
import { INITIAL_RESOURCES, ResourceItem } from '../../data/resourceDemoData';
import { INITIAL_STAFF, StaffMember } from '../../data/staffDemoData';
import { INITIAL_REQUESTS, ResourceRequestItem } from '../../data/requestDemoData';
import { INITIAL_DEPARTMENTS, DepartmentItem } from '../../data/departmentDemoData';

// Shared Storage Keys matching all other modules
const BEDS_STORAGE_KEY = 'medisync_bed_management_data';
const WARDS_STORAGE_KEY = 'medisync_clinical_wards_data';
const EQUIPMENT_STORAGE_KEY = 'medisync_equipment_telemetry_data';
const RESOURCES_STORAGE_KEY = 'medisync_resource_registry_data';
const STAFF_STORAGE_KEY = 'medisync_staff_verification_data';
const REQUESTS_STORAGE_KEY = 'medisync_resource_requests_data';
const DEPARTMENTS_STORAGE_KEY = 'medisync_departments_data';

interface ReadinessReportsPageProps {
  onSelectTab?: (tab: string) => void;
}

export interface ReadinessCategoryMetric {
  id: string;
  category: string;
  total: number;
  ready: number;
  inUse: number;
  unavailable: number;
  readinessPercentage: number;
  status: 'Optimal' | 'Moderate' | 'Critical';
  unit: string;
  description: string;
}

export interface ReadinessBlockerItem {
  id: string;
  issue: string;
  department: string;
  ward: string;
  severity: 'Critical' | 'High' | 'Medium';
  status: string;
  suggestedAction: string;
  targetTab: string;
  actionButtonLabel: string;
}

export const ReadinessReportsPage: React.FC<ReadinessReportsPageProps> = ({ onSelectTab }) => {
  // 1. Shared Data State loaded from localStorage or INITIAL_* fallbacks
  const [beds, setBeds] = useState<BedItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BEDS;
  });

  const [wards, setWards] = useState<WardItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(WARDS_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WARDS;
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EQUIPMENT;
  });

  const [resources, setResources] = useState<ResourceItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(RESOURCES_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RESOURCES;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(STAFF_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  const [requests, setRequests] = useState<ResourceRequestItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(REQUESTS_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REQUESTS;
  });

  const [departments, setDepartments] = useState<DepartmentItem[]>(() => {
    try {
      const s = localStorage.getItem(hospitalScopedKey(DEPARTMENTS_STORAGE_KEY));
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DEPARTMENTS;
  });

  // 2. UI and Filter State
  const [selectedDateRange, setSelectedDateRange] = useState<string>('Today (Live Telemetry)');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedReadinessStatus, setSelectedReadinessStatus] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Refresh handler to re-pull live data from localStorage
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const sBeds = localStorage.getItem(hospitalScopedKey(BEDS_STORAGE_KEY));
        if (sBeds) setBeds(JSON.parse(sBeds));

        const sWards = localStorage.getItem(hospitalScopedKey(WARDS_STORAGE_KEY));
        if (sWards) setWards(JSON.parse(sWards));

        const sEq = localStorage.getItem(hospitalScopedKey(EQUIPMENT_STORAGE_KEY));
        if (sEq) setEquipment(JSON.parse(sEq));

        const sRes = localStorage.getItem(hospitalScopedKey(RESOURCES_STORAGE_KEY));
        if (sRes) setResources(JSON.parse(sRes));

        const sStaff = localStorage.getItem(hospitalScopedKey(STAFF_STORAGE_KEY));
        if (sStaff) setStaff(JSON.parse(sStaff));

        const sReq = localStorage.getItem(hospitalScopedKey(REQUESTS_STORAGE_KEY));
        if (sReq) setRequests(JSON.parse(sReq));

        const sDep = localStorage.getItem(hospitalScopedKey(DEPARTMENTS_STORAGE_KEY));
        if (sDep) setDepartments(JSON.parse(sDep));
      } catch (e) {
        console.error(e);
      }
      setIsRefreshing(false);
      showToast('Readiness telemetry synchronized with live hospital data stores.');
    }, 600);
  };

  // Helper: Available wards for ward filter dropdown (filtered by selected department if applicable)
  const availableWards = useMemo(() => {
    if (selectedDepartment === 'All') {
      return Array.from(new Set(wards.map(w => w.name)));
    }
    const matching = wards.filter(w => 
      w.departmentName?.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
      selectedDepartment.toLowerCase().includes(w.departmentName?.toLowerCase() || '') ||
      w.name.toLowerCase().includes(selectedDepartment.toLowerCase())
    );
    if (matching.length > 0) {
      return Array.from(new Set(matching.map(w => w.name)));
    }
    return Array.from(new Set(wards.map(w => w.name)));
  }, [wards, selectedDepartment]);

  // 3. Filtered Datasets Based on Selected Filters
  const filteredData = useMemo(() => {
    // A. Filter Beds
    let fBeds = beds;
    if (selectedWard !== 'All') {
      fBeds = fBeds.filter(b => b.ward.toLowerCase().includes(selectedWard.toLowerCase()));
    } else if (selectedDepartment !== 'All') {
      fBeds = fBeds.filter(b => 
        b.ward.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
        selectedDepartment.toLowerCase().includes(b.ward.toLowerCase())
      );
    }

    // B. Filter Equipment
    let fEquipment = equipment;
    if (selectedDepartment !== 'All') {
      fEquipment = fEquipment.filter(eq => 
        eq.department.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
        selectedDepartment.toLowerCase().includes(eq.department.toLowerCase())
      );
    }
    if (selectedWard !== 'All') {
      fEquipment = fEquipment.filter(eq => 
        eq.location.toLowerCase().includes(selectedWard.toLowerCase())
      );
    }

    // C. Filter Staff
    let fStaff = staff;
    if (selectedDepartment !== 'All') {
      fStaff = fStaff.filter(s => 
        s.department.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
        selectedDepartment.toLowerCase().includes(s.department.toLowerCase())
      );
    }

    // D. Filter Resources
    let fResources = resources;
    if (selectedDepartment !== 'All') {
      fResources = fResources.filter(r => 
        r.department.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
        selectedDepartment.toLowerCase().includes(r.department.toLowerCase())
      );
    }

    // E. Filter Wards
    let fWards = wards;
    if (selectedDepartment !== 'All') {
      fWards = fWards.filter(w => 
        (w.departmentName && w.departmentName.toLowerCase().includes(selectedDepartment.toLowerCase())) ||
        w.name.toLowerCase().includes(selectedDepartment.toLowerCase())
      );
    }
    if (selectedWard !== 'All') {
      fWards = fWards.filter(w => w.name.toLowerCase().includes(selectedWard.toLowerCase()));
    }

    return {
      beds: fBeds,
      equipment: fEquipment,
      staff: fStaff,
      resources: fResources,
      wards: fWards
    };
  }, [beds, equipment, staff, resources, wards, selectedDepartment, selectedWard]);

  // 4. Dynamic Calculations for Bed Readiness (Requirement 3)
  const bedMetrics = useMemo(() => {
    const list = filteredData.beds;
    const total = list.length;
    const vacantReady = list.filter(b => b.status === 'Available').length;
    const occupied = list.filter(b => b.status === 'Occupied').length;
    const cleaning = list.filter(b => b.status === 'Cleaning').length;
    const maintenance = list.filter(b => b.status === 'Maintenance').length;
    const reserved = list.filter(b => b.status === 'Reserved').length;
    const blockedTotal = cleaning + maintenance + reserved;

    // Strict Rule: Do not count occupied or blocked beds as immediately available
    const readinessPercentage = total > 0 ? Math.round((vacantReady / total) * 100) : 0;

    return {
      total,
      vacantReady,
      occupied,
      cleaning,
      maintenance,
      reserved,
      blockedTotal,
      readinessPercentage
    };
  }, [filteredData.beds]);

  // 5. Dynamic Calculations for Equipment Readiness (Requirement 4)
  const equipmentMetrics = useMemo(() => {
    const list = filteredData.equipment;
    const total = list.length;
    // Operational + Standby are ready
    const operational = list.filter(e => e.operationalStatus === 'Operational' || e.operationalStatus === 'Standby').length;
    const inUse = list.filter(e => e.operationalStatus === 'In Use').length;
    const maintenanceRequired = list.filter(e => e.operationalStatus === 'Maintenance Required').length;
    const offline = list.filter(e => e.operationalStatus === 'Offline').length;
    const attentionRequired = list.filter(e => e.condition === 'Degraded' || e.condition === 'Critical').length;
    
    // Strict Rule: Do not count equipment under maintenance or offline as ready
    const unavailable = maintenanceRequired + offline;
    const readinessPercentage = total > 0 ? Math.round((operational / total) * 100) : 0;

    return {
      total,
      operational,
      inUse,
      maintenanceRequired,
      offline,
      attentionRequired,
      unavailable,
      readinessPercentage
    };
  }, [filteredData.equipment]);

  // 6. Dynamic Calculations for Staff Readiness (Requirement 5)
  const staffMetrics = useMemo(() => {
    const list = filteredData.staff;
    const total = list.length;
    // Strict Rule: Do not count unverified staff as available for operational readiness
    const verified = list.filter(s => s.verificationStatus === 'Verified').length;
    const pending = list.filter(s => s.verificationStatus === 'Pending' || s.verificationStatus === 'Requires Additional Information').length;
    const rejected = list.filter(s => s.verificationStatus === 'Rejected').length;
    
    // On duty: verified staff active in institution
    const onDuty = verified;
    const unavailable = pending + rejected;
    const readinessPercentage = total > 0 ? Math.round((verified / total) * 100) : 0;

    return {
      total,
      verified,
      onDuty,
      pending,
      rejected,
      unavailable,
      readinessPercentage
    };
  }, [filteredData.staff]);

  // 7. Dynamic Calculations for Resource/Supplies Readiness
  const resourceMetrics = useMemo(() => {
    const list = filteredData.resources;
    const total = list.length;
    const available = list.filter(r => r.status === 'Available').length;
    const inUse = list.filter(r => r.status === 'In Use' || r.status === 'Partially Available').length;
    const outOfStock = list.filter(r => r.status === 'Out of Stock' || r.availableQuantity === 0).length;
    const underMaintenance = list.filter(r => r.status === 'Under Maintenance').length;
    const unavailable = outOfStock + underMaintenance;
    const readinessPercentage = total > 0 ? Math.round((available / total) * 100) : 0;

    return {
      total,
      available,
      inUse,
      outOfStock,
      underMaintenance,
      unavailable,
      readinessPercentage
    };
  }, [filteredData.resources]);

  // 8. Dynamic Calculations for Clinical Wards Readiness
  const wardMetrics = useMemo(() => {
    const list = filteredData.wards;
    const total = list.length;
    const active = list.filter(w => w.operationalStatus === 'Active').length;
    const highOccupancy = list.filter(w => w.operationalStatus === 'High Occupancy' || w.operationalStatus === 'Full Capacity').length;
    const sanitizing = list.filter(w => w.operationalStatus === 'Under Sanitization').length;
    const readinessPercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      total,
      active,
      highOccupancy,
      sanitizing,
      readinessPercentage
    };
  }, [filteredData.wards]);

  // 9. Overall Hospital Readiness (Requirement 1)
  const overallReadiness = useMemo(() => {
    // Weighted Composite Readiness: Beds (30%), Equipment (25%), Staff (25%), Resources (20%)
    const weighted = Math.round(
      bedMetrics.readinessPercentage * 0.30 +
      equipmentMetrics.readinessPercentage * 0.25 +
      staffMetrics.readinessPercentage * 0.25 +
      resourceMetrics.readinessPercentage * 0.20
    );
    return Math.min(100, Math.max(0, weighted));
  }, [bedMetrics, equipmentMetrics, staffMetrics, resourceMetrics]);

  // 10. Five Category Breakdown Cards (Requirement 2)
  const categoryBreakdownList: ReadinessCategoryMetric[] = useMemo(() => {
    const categories: ReadinessCategoryMetric[] = [
      {
        id: 'beds',
        category: 'Bed Readiness',
        total: bedMetrics.total,
        ready: bedMetrics.vacantReady,
        inUse: bedMetrics.occupied,
        unavailable: bedMetrics.blockedTotal,
        readinessPercentage: bedMetrics.readinessPercentage,
        status: bedMetrics.readinessPercentage >= 85 ? 'Optimal' : bedMetrics.readinessPercentage >= 65 ? 'Moderate' : 'Critical',
        unit: 'Beds',
        description: 'Sanitized, unassigned beds available for immediate emergency triage or admission.'
      },
      {
        id: 'wards',
        category: 'Clinical Ward Readiness',
        total: wardMetrics.total,
        ready: wardMetrics.active,
        inUse: wardMetrics.highOccupancy,
        unavailable: wardMetrics.sanitizing,
        readinessPercentage: wardMetrics.readinessPercentage,
        status: wardMetrics.readinessPercentage >= 80 ? 'Optimal' : wardMetrics.readinessPercentage >= 60 ? 'Moderate' : 'Critical',
        unit: 'Wards',
        description: 'Inpatient wards currently active with normal nurse-to-patient ratio and open beds.'
      },
      {
        id: 'equipment',
        category: 'Equipment Readiness',
        total: equipmentMetrics.total,
        ready: equipmentMetrics.operational,
        inUse: equipmentMetrics.inUse,
        unavailable: equipmentMetrics.unavailable,
        readinessPercentage: equipmentMetrics.readinessPercentage,
        status: equipmentMetrics.readinessPercentage >= 80 ? 'Optimal' : equipmentMetrics.readinessPercentage >= 60 ? 'Moderate' : 'Critical',
        unit: 'Devices',
        description: 'Biomedically verified ventilators, monitors, and infusion pumps on active standby.'
      },
      {
        id: 'staff',
        category: 'Staff Readiness',
        total: staffMetrics.total,
        ready: staffMetrics.verified,
        inUse: staffMetrics.onDuty,
        unavailable: staffMetrics.unavailable,
        readinessPercentage: staffMetrics.readinessPercentage,
        status: staffMetrics.readinessPercentage >= 85 ? 'Optimal' : staffMetrics.readinessPercentage >= 65 ? 'Moderate' : 'Critical',
        unit: 'Personnel',
        description: 'Credential-verified physicians, nurses, and administrative healthcare staff.'
      },
      {
        id: 'resources',
        category: 'Resource & Consumables Availability',
        total: resourceMetrics.total,
        ready: resourceMetrics.available,
        inUse: resourceMetrics.inUse,
        unavailable: resourceMetrics.unavailable,
        readinessPercentage: resourceMetrics.readinessPercentage,
        status: resourceMetrics.readinessPercentage >= 80 ? 'Optimal' : resourceMetrics.readinessPercentage >= 60 ? 'Moderate' : 'Critical',
        unit: 'Catalog Items',
        description: 'Institutional pharmaceutical supplies, emergency kits, and ICU disposable cartridges.'
      }
    ];

    // Category filter
    let res = categories;
    if (selectedCategory !== 'All') {
      res = res.filter(c => {
        if (selectedCategory === 'Beds') return c.id === 'beds';
        if (selectedCategory === 'Equipment') return c.id === 'equipment';
        if (selectedCategory === 'Staff') return c.id === 'staff';
        if (selectedCategory === 'Clinical Supplies & Resources') return c.id === 'resources';
        return true;
      });
    }

    // Readiness status filter
    if (selectedReadinessStatus !== 'All') {
      if (selectedReadinessStatus.startsWith('Optimal')) {
        res = res.filter(c => c.readinessPercentage >= 90);
      } else if (selectedReadinessStatus.startsWith('Moderate')) {
        res = res.filter(c => c.readinessPercentage >= 70 && c.readinessPercentage < 90);
      } else if (selectedReadinessStatus.startsWith('Critical')) {
        res = res.filter(c => c.readinessPercentage < 70);
      }
    }

    return res;
  }, [bedMetrics, wardMetrics, equipmentMetrics, staffMetrics, resourceMetrics, selectedCategory, selectedReadinessStatus]);

  // 11. Dynamic Readiness Blockers (Requirement 6)
  const readinessBlockers: ReadinessBlockerItem[] = useMemo(() => {
    const blockers: ReadinessBlockerItem[] = [];

    // 1. Beds in Cleaning
    const cleaningBeds = beds.filter(b => b.status === 'Cleaning');
    if (cleaningBeds.length > 0) {
      blockers.push({
        id: 'blk-clean-beds',
        issue: `${cleaningBeds.length} bed${cleaningBeds.length > 1 ? 's' : ''} awaiting terminal sanitization / turnaround`,
        department: 'Emergency & Inpatient',
        ward: cleaningBeds.map(b => b.ward).slice(0, 2).join(', ') + (cleaningBeds.length > 2 ? '...' : ''),
        severity: cleaningBeds.length >= 3 ? 'High' : 'Medium',
        status: 'Sanitization In Progress',
        suggestedAction: 'Dispatch housekeeping team to complete 6-stage disinfection protocol and sign off readiness.',
        targetTab: 'beds',
        actionButtonLabel: 'View in Bed Master'
      });
    }

    // 2. Beds in Maintenance
    const maintBeds = beds.filter(b => b.status === 'Maintenance');
    if (maintBeds.length > 0) {
      blockers.push({
        id: 'blk-maint-beds',
        issue: `${maintBeds.length} bed${maintBeds.length > 1 ? 's' : ''} out of service for mechanical/hydraulic repair`,
        department: 'Biomedical Engineering',
        ward: maintBeds.map(b => b.ward).join(', '),
        severity: 'High',
        status: 'Maintenance Locked',
        suggestedAction: 'Complete physical inspection of bed frame, electric actuators, and wall oxygen connection.',
        targetTab: 'beds',
        actionButtonLabel: 'Resolve in Bed Master'
      });
    }

    // 3. Equipment requiring Maintenance or Offline
    const maintEquip = equipment.filter(e => e.operationalStatus === 'Maintenance Required');
    if (maintEquip.length > 0) {
      blockers.push({
        id: 'blk-maint-equip',
        issue: `${maintEquip.length} critical device${maintEquip.length > 1 ? 's' : ''} due for biomedical sensor calibration`,
        department: maintEquip.map(e => e.department).slice(0, 2).join(', '),
        ward: maintEquip.map(e => e.location).slice(0, 1).join(', '),
        severity: 'High',
        status: 'Calibration Required',
        suggestedAction: 'Deploy certified biomedical engineer to recalibrate turbine sensors and replace filters.',
        targetTab: 'equipment',
        actionButtonLabel: 'Go to Equipment Telemetry'
      });
    }

    const offlineEquip = equipment.filter(e => e.operationalStatus === 'Offline');
    if (offlineEquip.length > 0) {
      blockers.push({
        id: 'blk-offline-equip',
        issue: `${offlineEquip.length} telemetry device${offlineEquip.length > 1 ? 's' : ''} disconnected or offline`,
        department: offlineEquip.map(e => e.department).join(', '),
        ward: offlineEquip.map(e => e.location).join(', '),
        severity: 'Critical',
        status: 'Offline Telemetry',
        suggestedAction: 'Inspect auxiliary line, battery backup status, and IoT Wi-Fi gateway connection.',
        targetTab: 'equipment',
        actionButtonLabel: 'Inspect Telemetry'
      });
    }

    // 4. Staff Verification Pending
    const pendingStaff = staff.filter(s => s.verificationStatus === 'Pending' || s.verificationStatus === 'Requires Additional Information');
    if (pendingStaff.length > 0) {
      blockers.push({
        id: 'blk-pending-staff',
        issue: `${pendingStaff.length} clinician credential${pendingStaff.length > 1 ? 's' : ''} pending statutory verification`,
        department: pendingStaff.map(s => s.department).slice(0, 2).join(', '),
        ward: 'Central Administration',
        severity: 'Medium',
        status: 'Credential Review',
        suggestedAction: 'Cross-verify Medical Council / Nursing Registration numbers and grant operational access.',
        targetTab: 'staff',
        actionButtonLabel: 'Verify Staff Credentials'
      });
    }

    // 5. Depleted Resources in Registry
    const depletedResources = resources.filter(r => r.status === 'Out of Stock' || r.availableQuantity === 0);
    if (depletedResources.length > 0) {
      blockers.push({
        id: 'blk-depleted-res',
        issue: `${depletedResources.length} clinical inventory item${depletedResources.length > 1 ? 's' : ''} out of stock in registry`,
        department: depletedResources.map(r => r.department).slice(0, 2).join(', '),
        ward: 'Central Medical Stores',
        severity: 'Critical',
        status: 'Stock Depleted',
        suggestedAction: 'Initiate expedited reorder from state medical procurement pool.',
        targetTab: 'resources',
        actionButtonLabel: 'Manage Registry Stock'
      });
    }

    // 6. Urgent Pending Requests
    const urgentRequests = requests.filter(r => r.priority === 'Urgent' && r.status === 'Pending');
    if (urgentRequests.length > 0) {
      blockers.push({
        id: 'blk-urgent-reqs',
        issue: `${urgentRequests.length} urgent resource requisition${urgentRequests.length > 1 ? 's' : ''} awaiting approval`,
        department: urgentRequests.map(r => r.department).join(', '),
        ward: urgentRequests.map(r => r.ward).join(', '),
        severity: 'Critical',
        status: 'Urgent Pending',
        suggestedAction: 'Review clinical justification and allocate reserve stock to emergency wards.',
        targetTab: 'requests',
        actionButtonLabel: 'Allocate Requisition'
      });
    }

    // 7. Wards under Sanitization
    const sanitizingWards = wards.filter(w => w.operationalStatus === 'Under Sanitization');
    if (sanitizingWards.length > 0) {
      blockers.push({
        id: 'blk-sanit-wards',
        issue: `${sanitizingWards.map(w => w.name).join(', ')} under clinical sanitization quarantine`,
        department: sanitizingWards.map(w => w.departmentName || 'Inpatient').join(', '),
        ward: sanitizingWards.map(w => w.name).join(', '),
        severity: 'High',
        status: 'Ward Quarantined',
        suggestedAction: 'Verify environmental air scrubbers and complete pathogen swabs before reopening admissions.',
        targetTab: 'wards',
        actionButtonLabel: 'Open Clinical Wards'
      });
    }

    // Apply department filter to blockers if set
    if (selectedDepartment !== 'All') {
      return blockers.filter(b => 
        b.department.toLowerCase().includes(selectedDepartment.toLowerCase()) ||
        b.ward.toLowerCase().includes(selectedDepartment.toLowerCase())
      );
    }

    return blockers;
  }, [beds, equipment, staff, resources, requests, wards, selectedDepartment]);

  // 12. Functional CSV Export (Requirement 8)
  const handleExportCSV = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString();

      const csvRows: string[] = [];

      // Header Meta
      csvRows.push('MEDISYNC AI — INSTITUTIONAL HOSPITAL READINESS REPORT');
      csvRows.push(`Report Generated:,"${dateStr} ${timeStr}"`);
      csvRows.push(`Facility:,"Rajiv Gandhi Government General Hospital (RGGGH)"`);
      csvRows.push(`District:,"Chennai, Tamil Nadu"`);
      csvRows.push(`Applied Filters:,"Date Range: ${selectedDateRange} | Dept: ${selectedDepartment} | Ward: ${selectedWard} | Category: ${selectedCategory}"`);
      csvRows.push(`Overall Hospital Readiness:,"${overallReadiness}%"`);
      csvRows.push(''); // Blank line

      // 1. Category Summary Table
      csvRows.push('RESOURCE CATEGORY BREAKDOWN');
      csvRows.push('Category,Total Quantity,Ready Quantity,In-Use Quantity,Unavailable Quantity,Readiness Percentage,Readiness Status,Unit,Description');

      categoryBreakdownList.forEach(item => {
        csvRows.push(
          `"${item.category}",${item.total},${item.ready},${item.inUse},${item.unavailable},${item.readinessPercentage}%,` +
          `"${item.status}","${item.unit}","${item.description.replace(/"/g, '""')}"`
        );
      });

      csvRows.push(''); // Blank line

      // 2. Bed Readiness Details
      csvRows.push('BED READINESS SPECIFICATIONS');
      csvRows.push('Status Category,Bed Count,Percentage of Total,Description');
      csvRows.push(`"Vacant and Ready",${bedMetrics.vacantReady},${bedMetrics.total > 0 ? Math.round((bedMetrics.vacantReady / bedMetrics.total) * 100) : 0}%,"Sanitized beds ready for immediate patient admission"`);
      csvRows.push(`"Occupied",${bedMetrics.occupied},${bedMetrics.total > 0 ? Math.round((bedMetrics.occupied / bedMetrics.total) * 100) : 0}%,"Beds currently assigned to active admitted patients"`);
      csvRows.push(`"Cleaning Required",${bedMetrics.cleaning},${bedMetrics.total > 0 ? Math.round((bedMetrics.cleaning / bedMetrics.total) * 100) : 0}%,"Beds currently undergoing terminal sanitization & housekeeping"`);
      csvRows.push(`"Maintenance Required",${bedMetrics.maintenance},${bedMetrics.total > 0 ? Math.round((bedMetrics.maintenance / bedMetrics.total) * 100) : 0}%,"Beds locked for biomedical or mechanical servicing"`);
      csvRows.push(`"Reserved",${bedMetrics.reserved},${bedMetrics.total > 0 ? Math.round((bedMetrics.reserved / bedMetrics.total) * 100) : 0}%,"Beds reserved for incoming transfers or emergency admissions"`);

      csvRows.push(''); // Blank line

      // 3. Equipment Readiness Details
      csvRows.push('EQUIPMENT READINESS SPECIFICATIONS');
      csvRows.push('Status Category,Equipment Count,Percentage of Total,Description');
      csvRows.push(`"Operational & Standby",${equipmentMetrics.operational},${equipmentMetrics.total > 0 ? Math.round((equipmentMetrics.operational / equipmentMetrics.total) * 100) : 0}%,"Devices verified and ready for deployment"`);
      csvRows.push(`"In Use",${equipmentMetrics.inUse},${equipmentMetrics.total > 0 ? Math.round((equipmentMetrics.inUse / equipmentMetrics.total) * 100) : 0}%,"Devices currently connected to patients"`);
      csvRows.push(`"Maintenance Required",${equipmentMetrics.maintenanceRequired},${equipmentMetrics.total > 0 ? Math.round((equipmentMetrics.maintenanceRequired / equipmentMetrics.total) * 100) : 0}%,"Devices awaiting scheduled calibration or servicing"`);
      csvRows.push(`"Offline",${equipmentMetrics.offline},${equipmentMetrics.total > 0 ? Math.round((equipmentMetrics.offline / equipmentMetrics.total) * 100) : 0}%,"Devices powered down or disconnected from telemetry"`);

      csvRows.push(''); // Blank line

      // 4. Staff Readiness Details
      csvRows.push('STAFF READINESS SPECIFICATIONS');
      csvRows.push('Status Category,Staff Count,Percentage of Total,Description');
      csvRows.push(`"Verified Staff Ready",${staffMetrics.verified},${staffMetrics.total > 0 ? Math.round((staffMetrics.verified / staffMetrics.total) * 100) : 0}%,"Statutory Medical & Nursing Council verified personnel"`);
      csvRows.push(`"Staff On Duty",${staffMetrics.onDuty},${staffMetrics.total > 0 ? Math.round((staffMetrics.onDuty / staffMetrics.total) * 100) : 0}%,"Active clinical staff on current institutional shift"`);
      csvRows.push(`"Pending Verification",${staffMetrics.pending},${staffMetrics.total > 0 ? Math.round((staffMetrics.pending / staffMetrics.total) * 100) : 0}%,"Staff awaiting identity/credential validation"`);
      csvRows.push(`"Unavailable / Rejected",${staffMetrics.rejected},${staffMetrics.total > 0 ? Math.round((staffMetrics.rejected / staffMetrics.total) * 100) : 0}%,"Rejected or unapproved applicants"`);

      csvRows.push(''); // Blank line

      // 5. Readiness Blockers Table
      csvRows.push('ACTIVE READINESS BLOCKERS & ACTION PROTOCOLS');
      csvRows.push('Issue Description,Department,Ward,Severity,Current Status,Suggested Action');

      readinessBlockers.forEach(b => {
        csvRows.push(
          `"${b.issue.replace(/"/g, '""')}","${b.department}","${b.ward}","${b.severity}","${b.status}","${b.suggestedAction.replace(/"/g, '""')}"`
        );
      });

      // Assemble CSV string with BOM for Excel compatibility
      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MediSync_Readiness_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Report exported successfully: MediSync_Readiness_Report_${dateStr}.csv`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('Error exporting report. Please try again.');
    }
  };

  // Safe navigation handler
  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
    window.location.hash = `#/hospital/${tab}`;
  };

  // Helper for progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-[#15803D]'; // Green
    if (percentage >= 65) return 'bg-[#D97706]'; // Amber
    return 'bg-[#DC2626]'; // Red
  };

  const getStatusBadge = (status: 'Optimal' | 'Moderate' | 'Critical') => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
            Optimal Readiness
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Moderate Capacity
          </span>
        );
      case 'Critical':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Critical Bottleneck
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: 'Critical' | 'High' | 'Medium') => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3 h-3 text-red-600" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            High Priority
          </span>
        );
      case 'Medium':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Medium
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
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Readiness Reports</h1>
            <Badge variant="primary" size="sm">
              Live Readiness Intelligence
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Comprehensive hospital capacity, bed availability, biomedical equipment status, and staffing operational readiness.
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
            {isRefreshing ? 'Syncing...' : 'Sync Telemetry'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Report (CSV)
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SUMMARY KPI OVERVIEW CARDS (Requirement 1)                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Hospital Readiness */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Hospital Readiness
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563A6] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${
                overallReadiness >= 85 ? 'text-emerald-600' : overallReadiness >= 65 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {overallReadiness}%
              </span>
              <span className="text-xs font-medium text-[#64748B]">composite</span>
            </div>
            {/* Mini Progress */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${getProgressColor(overallReadiness)} transition-all duration-500`}
                style={{ width: `${overallReadiness}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Active Target: &gt;80%</span>
            <span className="font-semibold text-slate-700">All 4 Pillars</span>
          </div>
        </div>

        {/* Ready Beds */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Ready Beds
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#15803D] flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-700">{bedMetrics.vacantReady}</span>
              <span className="text-xs text-[#64748B]">/ {bedMetrics.total} total</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-[#15803D] transition-all duration-500"
                style={{ width: `${bedMetrics.readinessPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Vacant & Sanitized</span>
            <span className="font-semibold text-emerald-700">{bedMetrics.readinessPercentage}% Ready</span>
          </div>
        </div>

        {/* Blocked Beds */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Blocked Beds
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{bedMetrics.blockedTotal}</span>
              <span className="text-xs text-[#64748B]">unavailable</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${bedMetrics.total > 0 ? Math.round((bedMetrics.blockedTotal / bedMetrics.total) * 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Clean: {bedMetrics.cleaning}</span>
            <span>Maint: {bedMetrics.maintenance}</span>
          </div>
        </div>

        {/* Operational Equipment */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Operational Equipment
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-700">{equipmentMetrics.operational}</span>
              <span className="text-xs text-[#64748B]">/ {equipmentMetrics.total} devices</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${equipmentMetrics.readinessPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>In Use: {equipmentMetrics.inUse}</span>
            <span className="font-semibold text-slate-700">{equipmentMetrics.readinessPercentage}% Ready</span>
          </div>
        </div>

        {/* Staff Availability */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Staff Availability
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563A6] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#2563A6]">{staffMetrics.verified}</span>
              <span className="text-xs text-[#64748B]">verified on duty</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="h-2 rounded-full bg-[#2563A6] transition-all duration-500"
                style={{ width: `${staffMetrics.readinessPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Pending: {staffMetrics.pending}</span>
            <span className="font-semibold text-emerald-600">{staffMetrics.readinessPercentage}% Certified</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MULTI-FILTER BAR (Requirement 7)                            */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#2563A6]" />
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Filter Readiness Dimensions:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="Today (Live Telemetry)">Today (Live Telemetry)</option>
                <option value="Last 24 Hours">Last 24 Hours</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedWard('All'); // Reset ward if department changes
                }}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Ward Filter */}
            <div className="relative">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Wards</option>
                {availableWards.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Resource Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Resource Categories</option>
                <option value="Beds">Beds</option>
                <option value="Equipment">Equipment</option>
                <option value="Staff">Staff</option>
                <option value="Clinical Supplies & Resources">Clinical Supplies & Resources</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Readiness Status Filter */}
            <div className="relative">
              <select
                value={selectedReadinessStatus}
                onChange={(e) => setSelectedReadinessStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 text-[#1E293B] font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563A6] cursor-pointer"
              >
                <option value="All">All Readiness Statuses</option>
                <option value="Optimal (>= 90%)">Optimal (&ge; 90%)</option>
                <option value="Moderate (70% - 89%)">Moderate (70% - 89%)</option>
                <option value="Critical (< 70%)">Critical (&lt; 70%)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear All Filters */}
            {(selectedDepartment !== 'All' || selectedWard !== 'All' || selectedCategory !== 'All' || selectedReadinessStatus !== 'All' || selectedDateRange !== 'Today (Live Telemetry)') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDateRange('Today (Live Telemetry)');
                  setSelectedDepartment('All');
                  setSelectedWard('All');
                  setSelectedCategory('All');
                  setSelectedReadinessStatus('All');
                }}
                icon={<FilterX className="w-3.5 h-3.5" />}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Filtering: <strong className="text-[#1E293B]">{selectedDepartment}</strong> dept • <strong className="text-[#1E293B]">{selectedWard}</strong> ward</span>
            {selectedCategory !== 'All' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Category: {selectedCategory}</span>
            )}
            {selectedReadinessStatus !== 'All' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{selectedReadinessStatus}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Validated Against Shared Data Store</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RESOURCE READINESS BREAKDOWN (Requirement 2)               */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
              Operational Resource Readiness Breakdown
            </h2>
            <p className="text-xs text-[#64748B]">
              Detailed readiness quantification across beds, wards, medical equipment, clinical staff, and inventory reserves.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2563A6]">
            {categoryBreakdownList.length} Categories Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdownList.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#1E293B]">{cat.category}</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">{cat.description}</p>
                  </div>
                  {getStatusBadge(cat.status)}
                </div>

                {/* Big Percentage & Progress */}
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B]">
                    {cat.readinessPercentage}%
                  </span>
                  <span className="text-xs font-bold text-[#64748B]">
                    {cat.ready} / {cat.total} {cat.unit} Ready
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${getProgressColor(cat.readinessPercentage)} transition-all duration-500`}
                    style={{ width: `${cat.readinessPercentage}%` }}
                  />
                </div>

                {/* 4-way Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-green-50/70 border border-green-100">
                    <span className="text-[10px] uppercase font-bold text-green-800">Ready</span>
                    <div className="text-sm font-bold text-green-900 mt-0.5">{cat.ready}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-800">In Use</span>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">{cat.inUse}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50/70 border border-red-100">
                    <span className="text-[10px] uppercase font-bold text-red-800">Unavailable</span>
                    <div className="text-sm font-bold text-red-900 mt-0.5">{cat.unavailable}</div>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#64748B]">Total: {cat.total} {cat.unit}</span>
                <button
                  onClick={() => handleNavigate(cat.id === 'resources' ? 'resources' : cat.id)}
                  className="font-bold text-[#2563A6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. READINESS BLOCKERS & ACTIONS SECTION (Requirement 6)        */}
      {/* ============================================================== */}
      <Card
        title="Readiness Blockers & Operational Action Protocols"
        subtitle="Identified bottlenecks preventing 100% capacity readiness with recommended administrative remediations."
        action={
          <Badge variant={readinessBlockers.length === 0 ? 'success' : 'critical'} size="sm">
            {readinessBlockers.length} Active {readinessBlockers.length === 1 ? 'Blocker' : 'Blockers'}
          </Badge>
        }
        noPadding
      >
        {readinessBlockers.length === 0 ? (
          <div className="py-12 px-6 text-center text-[#64748B]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1E293B]">Zero Operational Blockers Detected</p>
            <p className="text-xs text-[#64748B] mt-1">
              All beds, biomedical devices, clinical personnel, and pharmaceutical supplies meet optimal readiness criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {readinessBlockers.map(blocker => (
              <div 
                key={blocker.id} 
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(blocker.severity)}
                    <span className="font-bold text-sm text-[#1E293B]">{blocker.issue}</span>
                    <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Status: {blocker.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Department: <strong className="text-slate-700">{blocker.department}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      Ward/Unit: <strong className="text-slate-700">{blocker.ward}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                    <strong className="text-slate-800">Recommended Remediation:</strong> {blocker.suggestedAction}
                  </p>
                </div>

                <div className="shrink-0 flex items-center lg:self-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleNavigate(blocker.targetTab)}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {blocker.actionButtonLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2563A6]" />
            <span>
              Resolving these blockers immediately updates live readiness telemetry across the entire MediSync platform.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Node: RPT-READINESS-01 • Engine: Dynamic Evaluator
          </span>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* 6. DETAILED SPECIFICATIONS: BEDS, EQUIPMENT & STAFF (3, 4, 5)  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bed Readiness Specifications (Requirement 3) */}
        <Card
          title="Bed Readiness Status"
          subtitle="Real-time breakdown of all hospital inpatient and triage beds"
          noPadding
        >
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-700">{bedMetrics.vacantReady}</span>
              <span className="text-xs text-[#64748B]"> of {bedMetrics.total} beds ready</span>
            </div>
            <Badge variant="success" size="sm">
              {bedMetrics.readinessPercentage}% Readiness
            </Badge>
          </div>

          <div className="divide-y divide-[#E2E8F0] text-xs">
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Vacant and Ready
              </span>
              <strong className="text-emerald-700">{bedMetrics.vacantReady} Beds</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Occupied (Admitted Patients)
              </span>
              <strong className="text-blue-700">{bedMetrics.occupied} Beds</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Cleaning Required (Turnaround)
              </span>
              <strong className="text-amber-700">{bedMetrics.cleaning} Beds</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Maintenance Required (Out of Service)
              </span>
              <strong className="text-red-700">{bedMetrics.maintenance} Beds</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Reserved for Emergency Transfers
              </span>
              <strong className="text-slate-700">{bedMetrics.reserved} Beds</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] text-right">
            <button
              onClick={() => handleNavigate('beds')}
              className="text-xs font-bold text-[#2563A6] hover:underline cursor-pointer"
            >
              Open Bed Master Status &rarr;
            </button>
          </div>
        </Card>

        {/* Equipment Readiness Specifications (Requirement 4) */}
        <Card
          title="Equipment Readiness Status"
          subtitle="Biomedical calibration, operational status, and telemetry condition"
          noPadding
        >
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-indigo-700">{equipmentMetrics.operational}</span>
              <span className="text-xs text-[#64748B]"> of {equipmentMetrics.total} devices ready</span>
            </div>
            <Badge variant="primary" size="sm">
              {equipmentMetrics.readinessPercentage}% Operational
            </Badge>
          </div>

          <div className="divide-y divide-[#E2E8F0] text-xs">
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Operational & Standby
              </span>
              <strong className="text-emerald-700">{equipmentMetrics.operational} Devices</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Currently in Use (Active Patient)
              </span>
              <strong className="text-blue-700">{equipmentMetrics.inUse} Devices</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Maintenance Required (Biomedical)
              </span>
              <strong className="text-amber-700">{equipmentMetrics.maintenanceRequired} Devices</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Offline (Disconnected Telemetry)
              </span>
              <strong className="text-red-700">{equipmentMetrics.offline} Devices</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Condition Requiring Attention
              </span>
              <strong className="text-purple-700">{equipmentMetrics.attentionRequired} Devices</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] text-right">
            <button
              onClick={() => handleNavigate('equipment')}
              className="text-xs font-bold text-[#2563A6] hover:underline cursor-pointer"
            >
              Open Equipment Telemetry &rarr;
            </button>
          </div>
        </Card>

        {/* Staff Readiness Specifications (Requirement 5) */}
        <Card
          title="Staff Readiness Status"
          subtitle="Credential verification and clinical duty roster availability"
          noPadding
        >
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2563A6]">{staffMetrics.verified}</span>
              <span className="text-xs text-[#64748B]"> of {staffMetrics.total} staff certified</span>
            </div>
            <Badge variant="primary" size="sm">
              {staffMetrics.readinessPercentage}% Certified
            </Badge>
          </div>

          <div className="divide-y divide-[#E2E8F0] text-xs">
            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Verified Clinical Staff
              </span>
              <strong className="text-emerald-700">{staffMetrics.verified} Staff</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Staff Currently on Duty
              </span>
              <strong className="text-blue-700">{staffMetrics.onDuty} Active</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending Identity/License Verification
              </span>
              <strong className="text-amber-700">{staffMetrics.pending} Applicants</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Staff Unavailable / Rejected
              </span>
              <strong className="text-red-700">{staffMetrics.rejected} Records</strong>
            </div>

            <div className="p-3 flex items-center justify-between hover:bg-slate-50/50">
              <span className="font-medium text-[#1E293B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Statutory Regulatory Ratio
              </span>
              <strong className="text-slate-700">100% Audit Compliant</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] text-right">
            <button
              onClick={() => handleNavigate('staff')}
              className="text-xs font-bold text-[#2563A6] hover:underline cursor-pointer"
            >
              Open Staff Verification &rarr;
            </button>
          </div>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* 7. INSTITUTIONAL METADATA & SYNTHETIC DATA DISCLOSURE          */}
      {/* ============================================================== */}
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          <span>
            <strong>Institutional Governance:</strong> Readiness values are dynamically recalculated using shared data stores from Bed Master, Clinical Wards, Resource Registry, Equipment Telemetry, and Staff Verification.
          </span>
        </div>
        <Badge variant="secondary" size="sm">
          Synthetic Demo Dataset Active
        </Badge>
      </div>
    </div>
  );
};
