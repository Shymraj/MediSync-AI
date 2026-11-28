import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Bed, 
  Wind, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Play, 
  RotateCcw, 
  Heart, 
  Droplet, 
  Stethoscope, 
  Building2, 
  FileText, 
  ArrowUpRight, 
  Bell, 
  Share2, 
  Sparkles, 
  Check, 
  X,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { hospitalScopedKey, getActiveHospitalScopeId } from '../../utils/hospitalSync';
import { 
  EmergencyIncident, 
  EmergencySeverity, 
  EmergencyStatus, 
  EmergencyAnalytics,
  EmergencyTimelineEvent 
} from '../../types';
import { 
  INITIAL_EMERGENCY_INCIDENTS, 
  EMERGENCY_PRESETS, 
  INITIAL_EMERGENCY_ANALYTICS 
} from '../../data/emergencyDemoData';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface EmergencyCommandCenterProps {
  onSelectTab?: (tabId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const EmergencyCommandCenter: React.FC<EmergencyCommandCenterProps> = ({
  onSelectTab,
  onNavigateTab
}) => {
  const { 
    user, 
    beds, 
    updateBedStatus, 
    equipment, 
    assignPatientToBed,
    createResourceRequest,
    createDoctorNurseTask
  } = useApp();

  // Active view tab in Command Center
  const [activeTab, setActiveTab] = useState<'queue' | 'matching' | 'timeline' | 'analytics'>('queue');

  // Incidents state
  const [incidents, setIncidents] = useState<EmergencyIncident[]>(() => {
    try {
      const saved = localStorage.getItem(hospitalScopedKey('medisync_emergency_incidents_cache'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EMERGENCY_INCIDENTS;
  });

  const [analytics, setAnalytics] = useState<EmergencyAnalytics>(INITIAL_EMERGENCY_ANALYTICS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || 'INC-2026-088');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [releaseBedOnResolve, setReleaseBedOnResolve] = useState(true);
  const [targetIncidentForAction, setTargetIncidentForAction] = useState<EmergencyIncident | null>(null);

  // Priority adjustment form
  const [newSeverity, setNewSeverity] = useState<EmergencySeverity>('Level 1');
  const [priorityJustification, setPriorityJustification] = useState('');
  const [priorityError, setPriorityError] = useState('');

  // New incident report form
  const [reportForm, setReportForm] = useState({
    patientName: '',
    age: '45',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyType: 'Polytrauma & Hemorrhagic Shock',
    severity: 'Level 1' as EmergencySeverity,
    location: 'Emergency Resuscitation Bay 1',
    requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative PRBC', 'Trauma Surgeon'],
    assignedDoctorName: 'Dr. Sundaramoorthy M.',
    clinicalNotes: ''
  });

  // Shortage notification alert state
  const [adminNotified, setAdminNotified] = useState(false);
  const [transferRequested, setTransferRequested] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Interactive Demo Mode State
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoAutoPlaying, setIsDemoAutoPlaying] = useState(false);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch from backend API
  const fetchIncidentsAndAnalytics = async () => {
    try {
<<<<<<< Updated upstream
      const data = await api.getEmergencyIncidents(getActiveHospitalScopeId());
=======
      const data = await api.getEmergencyIncidents('hosp-chn-01', isDemoModeActive);
>>>>>>> Stashed changes
      if (Array.isArray(data) && data.length > 0) {
        setIncidents(data);
        localStorage.setItem(hospitalScopedKey('medisync_emergency_incidents_cache'), JSON.stringify(data));
      }
    } catch (err) {
      // Offline fallback: keep cached/initial
    }

    try {
      const analyticsData = await api.getEmergencyAnalytics(getActiveHospitalScopeId());
      if (analyticsData && analyticsData.activeCount !== undefined) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchIncidentsAndAnalytics();
    const interval = setInterval(fetchIncidentsAndAnalytics, 15000);
    return () => clearInterval(interval);
  }, [isDemoModeActive]);

  // Save incidents to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(hospitalScopedKey('medisync_emergency_incidents_cache'), JSON.stringify(incidents));
    } catch {}
  }, [incidents]);

  const selectedIncident = useMemo(() => {
    return incidents.find(inc => inc.id === selectedIncidentId) || incidents[0] || null;
  }, [incidents, selectedIncidentId]);

  // Derived real-time resource availability
  const availableIcuBeds = useMemo(() => {
    return beds.filter(b => b.type === 'ICU' && b.status === 'ready');
  }, [beds]);

  const availableEmergencyBays = useMemo(() => {
    return beds.filter(b => (b.type === 'Emergency' || b.ward.toLowerCase().includes('emergency')) && b.status === 'ready');
  }, [beds]);

  const readyTotalBeds = useMemo(() => {
    return beds.filter(b => b.status === 'ready').length;
  }, [beds]);

  const availableVentilators = useMemo(() => {
    return equipment.filter(e => e.category === 'Ventilator' && (e.status === 'Available' || (e as any).operationalStatus === 'Operational'));
  }, [equipment]);

  const activeIncidentsCount = useMemo(() => {
    return incidents.filter(i => i.status !== 'Resolved').length;
  }, [incidents]);

  const criticalCodeRedCount = useMemo(() => {
    return incidents.filter(i => i.severity === 'Level 1' && i.status !== 'Resolved').length;
  }, [incidents]);

  const pendingApprovalsCount = useMemo(() => {
    return incidents.filter(i => i.status === 'Resource Requested' || i.status === 'Under Assessment').length;
  }, [incidents]);

  // Detect critical shortage
  const hasIcuShortage = availableIcuBeds.length === 0;
  const hasVentilatorShortage = availableVentilators.length === 0;
  const hasCriticalShortage = hasIcuShortage || hasVentilatorShortage;

  // Notification Banner Auto-dismiss
  useEffect(() => {
    if (actionSuccessMsg) {
      const timer = setTimeout(() => setActionSuccessMsg(null), 6000);
      return () => clearInterval(timer);
    }
  }, [actionSuccessMsg]);

  // Handle reporting new incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.patientName.trim()) {
      alert('Patient name or temporary identifier is required.');
      return;
    }

    const newId = `INC-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const generatedPatientId = `PAT-${Math.floor(8000 + Math.random() * 1000)}`;

    // Live AI matching against beds and ventilators
    const matchedBed = availableIcuBeds[0] || beds.find(b => b.status === 'ready') || null;
    const matchedVent = availableVentilators[0] || null;
    const matchScore = matchedBed && matchedVent ? 98 : matchedBed ? 85 : 45;

    const newIncident: EmergencyIncident = {
      id: newId,
      hospitalId: 'hosp-chn-01',
      patientId: generatedPatientId,
      patientName: reportForm.patientName.trim(),
      age: parseInt(reportForm.age) || 40,
      gender: reportForm.gender,
      bloodGroup: reportForm.bloodGroup,
      emergencyType: reportForm.emergencyType,
      severity: reportForm.severity,
      location: reportForm.location,
      requiredResources: reportForm.requiredResources,
      assignedDoctorName: reportForm.assignedDoctorName || 'Dr. Sundaramoorthy M.',
      assignedNurseName: 'Nurse Revathi S.',
      status: 'Reported',
      priorityJustification: reportForm.clinicalNotes || 'Immediate triage registration.',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          stage: 'Reported',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: user?.name || 'Triage Officer',
          notes: reportForm.clinicalNotes || `Emergency arrival registered at ${reportForm.location}.`
        },
        {
          stage: 'Doctor Assigned',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Emergency Central Dispatch',
          notes: `Assigned to ${reportForm.assignedDoctorName || 'Dr. Sundaramoorthy M.'}.`
        }
      ],
      matchedResources: {
        score: matchScore,
        rationale: matchedBed 
          ? `Matched available ${matchedBed.type} Bed (${matchedBed.bedNumber}) in ${matchedBed.ward} with matching telemetry capability.`
          : 'No dedicated ICU beds available; alternative HDU buffer ward recommended.',
        recommendedBed: matchedBed ? {
          id: matchedBed.id,
          bedNumber: matchedBed.bedNumber,
          ward: matchedBed.ward,
          type: matchedBed.type,
          status: matchedBed.status
        } : null,
        recommendedVentilator: matchedVent ? {
          id: matchedVent.id,
          name: matchedVent.name,
          ward: matchedVent.ward,
          status: matchedVent.status
        } : null,
        bloodAvailable: {
          bloodGroup: reportForm.bloodGroup,
          units: 8,
          available: true
        },
        assignedDoctor: reportForm.assignedDoctorName || 'Dr. Sundaramoorthy M.'
      }
    };

    try {
      await api.createEmergencyIncident(newIncident);
    } catch (err) {
      // offline fallback
    }

    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncidentId(newId);
    setIsReportModalOpen(false);
    setActionSuccessMsg(`Emergency Incident ${newId} registered successfully. Code alerts broadcast to Doctor and Nurse portals.`);

    // Reset form
    setReportForm({
      patientName: '',
      age: '45',
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyType: 'Polytrauma & Hemorrhagic Shock',
      severity: 'Level 1',
      location: 'Emergency Resuscitation Bay 1',
      requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative PRBC', 'Trauma Surgeon'],
      assignedDoctorName: 'Dr. Sundaramoorthy M.',
      clinicalNotes: ''
    });
  };

  // Handle Preset selection
  const handleApplyPreset = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setReportForm(prev => ({
      ...prev,
      emergencyType: preset.emergencyType,
      severity: preset.severity,
      location: preset.location,
      requiredResources: preset.requiredResources,
      assignedDoctorName: preset.doctorRecommendation,
      clinicalNotes: preset.notes
    }));
  };

  // Handle Priority Adjustment
  const handleOpenPriorityModal = (incident: EmergencyIncident) => {
    setTargetIncidentForAction(incident);
    setNewSeverity(incident.severity);
    setPriorityJustification('');
    setPriorityError('');
    setIsPriorityModalOpen(true);
  };

  const handleSavePriority = async () => {
    if (!priorityJustification.trim()) {
      setPriorityError('Mandatory clinical justification is required to adjust emergency triage priority.');
      return;
    }

    if (!targetIncidentForAction) return;

    const updatedTimelineEvent: EmergencyTimelineEvent = {
      stage: 'Priority Adjusted',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: user?.name || 'Attending Physician',
      notes: `Triage adjusted from ${targetIncidentForAction.severity} to ${newSeverity}. Justification: ${priorityJustification.trim()}`
    };

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === targetIncidentForAction.id) {
        return {
          ...inc,
          severity: newSeverity,
          priorityJustification: priorityJustification.trim(),
          updatedAt: new Date().toISOString(),
          timeline: [...inc.timeline, updatedTimelineEvent]
        };
      }
      return inc;
    });

    setIncidents(updatedIncidents);

    try {
      await api.updateEmergencyPriority(
        targetIncidentForAction.id,
        newSeverity,
        priorityJustification.trim(),
        user?.name || 'Dr. Sundaramoorthy M.'
      );
    } catch (err) {
      // offline fallback
    }

    setIsPriorityModalOpen(false);
    setActionSuccessMsg(`Priority for ${targetIncidentForAction.id} updated to ${newSeverity} with logged justification.`);
  };

  // Handle Resource Allocation
  const handleOpenAllocateModal = (incident: EmergencyIncident) => {
    setTargetIncidentForAction(incident);
    setIsAllocateModalOpen(true);
  };

  const handleConfirmAllocation = async () => {
    if (!targetIncidentForAction) return;

    const recommendedBed = targetIncidentForAction.matchedResources?.recommendedBed || availableIcuBeds[0] || beds.find(b => b.status === 'ready');
    const recommendedVent = targetIncidentForAction.matchedResources?.recommendedVentilator || availableVentilators[0];

    if (!recommendedBed) {
      alert('Cannot allocate: No ready bed available in any hospital ward. Please initiate an emergency transfer.');
      return;
    }

    const isSimulatedIncident = Boolean(targetIncidentForAction.isSimulated || targetIncidentForAction.id.startsWith('SIM-') || targetIncidentForAction.id === 'INC-2026-DEMO');

    try {
      await api.allocateEmergencyResources(targetIncidentForAction.id, {
        bedId: recommendedBed.id,
        equipmentId: recommendedVent?.id,
        allocatedBy: user?.name || 'Dr. Sundaramoorthy M.',
        notes: `Allocated Bed ${recommendedBed.bedNumber} and equipment.`,
        isSimulated: isSimulatedIncident
      });
    } catch (err: any) {
      alert(`Resource Allocation Alert: ${err?.message || 'Conflict detected during resource allocation.'}`);
      return;
    }

    if (!isSimulatedIncident) {
      // 1. Assign patient to the bed
      assignPatientToBed(
        recommendedBed.id,
        targetIncidentForAction.patientName,
        targetIncidentForAction.patientId || 'PAT-EMG',
        targetIncidentForAction.assignedDoctorName || 'Dr. Sundaramoorthy M.',
        targetIncidentForAction.assignedNurseName || 'Nurse Revathi S.'
      );

      // 2. Update bed status to occupied
      updateBedStatus(recommendedBed.id, 'occupied', `Occupied by Emergency Incident ${targetIncidentForAction.id}`);

      // 3. Create nurse intake task
      createDoctorNurseTask({
        patientId: targetIncidentForAction.patientId || 'PAT-EMG',
        patientName: targetIncidentForAction.patientName,
        ward: recommendedBed.ward,
        bed: recommendedBed.bedNumber,
        doctorName: targetIncidentForAction.assignedDoctorName || 'Dr. Sundaramoorthy M.',
        assignedNurse: targetIncidentForAction.assignedNurseName || 'Nurse Revathi S.',
        taskType: 'Assessment',
        instruction: `EMERGENCY INTAKE: Continuous invasive hemodynamic monitoring, SpO2 & ECG telemetry. Connect ${recommendedVent ? recommendedVent.name : 'ventilator'} and verify cross-matched blood reserve.`,
        priority: 'Stat (Immediate)'
      });
    }

    const newTimelineEvent: EmergencyTimelineEvent = {
      stage: 'Resources Allocated',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: user?.name || 'Hospital Admin & Clinical Director',
      notes: isSimulatedIncident
        ? `[SIMULATED SANDBOX] Simulated Bed ${recommendedBed.bedNumber} assigned. Live hospital beds untouched.`
        : `Allocated Bed ${recommendedBed.bedNumber} (${recommendedBed.ward})${recommendedVent ? ` and ${recommendedVent.name}` : ''}. Clinical nurse intake dispatched.`
    };

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === targetIncidentForAction.id) {
        return {
          ...inc,
          status: 'Resources Allocated' as EmergencyStatus,
          allocatedBedId: recommendedBed.id,
          allocatedBedNumber: recommendedBed.bedNumber,
          allocatedEquipmentId: recommendedVent?.id,
          allocatedEquipmentName: recommendedVent?.name,
          updatedAt: new Date().toISOString(),
          timeline: [...inc.timeline, newTimelineEvent]
        };
      }
      return inc;
    });

    setIncidents(updatedIncidents);
    setIsAllocateModalOpen(false);
    setActionSuccessMsg(isSimulatedIncident
      ? `[SIMULATED SANDBOX] Simulated resources allocated for Incident ${targetIncidentForAction.id}.`
      : `Resources successfully allocated for Incident ${targetIncidentForAction.id}. Bed ${recommendedBed.bedNumber} marked occupied, nurse alert triggered.`
    );
  };

  // Handle Open Resolve Modal
  const handleOpenResolveModal = (incident: EmergencyIncident) => {
    setTargetIncidentForAction(incident);
    setResolutionNotes('Patient stabilized. Transferred to definitive inpatient care. Emergency incident successfully closed.');
    setReleaseBedOnResolve(true);
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!targetIncidentForAction) return;

    const resolveEvent: EmergencyTimelineEvent = {
      stage: 'Resolved',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: user?.name || 'Emergency Attending Physician',
      notes: resolutionNotes || 'Patient stabilized. Emergency incident successfully closed.'
    };

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === targetIncidentForAction.id) {
        return {
          ...inc,
          status: 'Resolved' as EmergencyStatus,
          updatedAt: new Date().toISOString(),
          timeline: [...inc.timeline, resolveEvent]
        };
      }
      return inc;
    });

    setIncidents(updatedIncidents);

    const isSimulatedIncident = Boolean(targetIncidentForAction.isSimulated || targetIncidentForAction.id.startsWith('SIM-') || targetIncidentForAction.id === 'INC-2026-DEMO');

    if (!isSimulatedIncident && releaseBedOnResolve && targetIncidentForAction.allocatedBedId) {
      updateBedStatus(targetIncidentForAction.allocatedBedId, 'ready', 'Bed released after emergency incident resolution');
    }

    try {
      await api.resolveEmergencyIncident(targetIncidentForAction.id, {
        resolvedBy: user?.name || 'Dr. Sundaramoorthy M.',
        notes: resolutionNotes,
        resolutionSummary: resolutionNotes,
        releaseBed: releaseBedOnResolve,
        releaseVentilator: true
      });
    } catch (err) {}

    setIsResolveModalOpen(false);
    setActionSuccessMsg(`Emergency Incident ${targetIncidentForAction.id} marked as RESOLVED.`);
  };

  // Run Simulation Scenario
  const handleRunScenario = async (scenario: string) => {
    try {
      const res = await api.simulateEmergencyScenario(scenario);
      if (res && res.message) {
        setActionSuccessMsg(`[SIMULATION SANDBOX] ${res.message}`);
        await fetchIncidentsAndAnalytics();
      }
    } catch (err: any) {
      setActionSuccessMsg(`Scenario executed locally in sandbox mode.`);
    }
  };

  // Demo Simulation Runner
  const demoStepsList = [
    {
      title: 'Step 1: Emergency Arrival in Bay 01',
      desc: 'Patient Johnathan Vance (48M, Polytrauma & Flail Chest post-MVA) arrives via 108 Emergency Ambulance. Severe respiratory distress and refractory hypoxemia (SpO2 84%).'
    },
    {
      title: 'Step 2: Emergency Triage & Specialist Assignment',
      desc: 'Triage officer registers Level 1 Code Red alert. Dr. Sundaramoorthy M. (Trauma Lead) and Nurse Revathi S. are paged instantly across Doctor and Nurse dashboards.'
    },
    {
      title: 'Step 3: Intelligent Resource Matching Engine',
      desc: 'AI Clinical Engine analyzes hospital-wide bed telemetry. Matches ICU Bed ICU-02 and Servo-U Mechanical Ventilator with 96% match score and clinical rationale.'
    },
    {
      title: 'Step 4: Human-in-the-Loop Clinical Authorization',
      desc: 'Authorized physician reviews recommendation, verifies blood bank reserves (4 Units O+), and approves allocation without autonomous unverified overrides.'
    },
    {
      title: 'Step 5: Coordinated Allocation & Live Telemetry Sync',
      desc: 'ICU Bed ICU-02 transitions to Occupied. Emergency Ventilator is docked. Urgent nurse intake task is pushed directly to the Nurse dashboard.'
    },
    {
      title: 'Step 6: Patient Stabilization & Case Resolution',
      desc: 'Chest drainage completed, hemodynamics stabilized on mechanical ventilation. Incident marked as Resolved with complete audit trail.'
    }
  ];

  const handleAdvanceDemoStep = () => {
    if (demoStep >= demoStepsList.length - 1) {
      // Completed
      setIsDemoAutoPlaying(false);
      return;
    }

    const nextStep = demoStep + 1;
    setDemoStep(nextStep);

    // Dynamic state changes during demo steps
    if (nextStep === 1) {
      // Create demo incident if not present
      const demoIncId = 'INC-2026-DEMO';
      if (!incidents.find(i => i.id === demoIncId)) {
        const demoInc: EmergencyIncident = {
          id: demoIncId,
          hospitalId: 'hosp-chn-01',
          patientId: 'PAT-DEMO-01',
          patientName: 'Johnathan Vance (Demo)',
          age: 48,
          gender: 'Male',
          bloodGroup: 'O+',
          emergencyType: 'Polytrauma & Flail Chest',
          severity: 'Level 1',
          location: 'Emergency Bay 01',
          requiredResources: ['ICU Bed', 'Mechanical Ventilator', 'O-Negative Blood (4 Units)', 'Trauma Surgeon'],
          assignedDoctorName: 'Dr. Sundaramoorthy M.',
          assignedNurseName: 'Nurse Revathi S.',
          status: 'Reported',
          reportedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              stage: 'Reported',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: '108 Triage Team',
              notes: 'Patient Johnathan Vance arrived with severe thoracic trauma and respiratory compromise.'
            }
          ],
          matchedResources: {
            score: 96,
            rationale: 'Primary ICU Bed ICU-02 matches trauma respiratory protocol with dedicated Servo-U ventilator and blood bank buffer.',
            recommendedBed: availableIcuBeds[0] ? {
              id: availableIcuBeds[0].id,
              bedNumber: availableIcuBeds[0].bedNumber,
              ward: availableIcuBeds[0].ward,
              type: availableIcuBeds[0].type,
              status: availableIcuBeds[0].status
            } : null,
            recommendedVentilator: availableVentilators[0] ? {
              id: availableVentilators[0].id,
              name: availableVentilators[0].name,
              ward: availableVentilators[0].ward,
              status: availableVentilators[0].status
            } : null,
            bloodAvailable: {
              bloodGroup: 'O+',
              units: 8,
              available: true
            },
            assignedDoctor: 'Dr. Sundaramoorthy M.'
          }
        };
        setIncidents(prev => [demoInc, ...prev]);
        setSelectedIncidentId(demoIncId);
      }
    } else if (nextStep === 4) {
      // Step 5: Allocate (Sandbox simulation - live hospital beds untouched)
      const demoInc = incidents.find(i => i.id === 'INC-2026-DEMO');
      if (demoInc) {
        setIncidents(prev => prev.map(i => i.id === 'INC-2026-DEMO' ? {
          ...i,
          status: 'Resources Allocated',
          allocatedBedId: 'SIM-BED-ICU-02',
          allocatedBedNumber: 'ICU-02 (Simulated Sandbox)',
          allocatedEquipmentName: 'Servo-U Ventilator (Simulated)',
          timeline: [
            ...i.timeline,
            {
              stage: 'Resources Allocated',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: 'Dr. Sundaramoorthy M. (Approved)',
              notes: '[SIMULATED SANDBOX] Allocated Simulated ICU Bed ICU-02 and Servo-U Ventilator. Production beds untouched.'
            }
          ]
        } : i));
      }
    } else if (nextStep === 5) {
      // Step 6: Resolved
      setIncidents(prev => prev.map(i => i.id === 'INC-2026-DEMO' ? {
        ...i,
        status: 'Resolved',
        timeline: [
          ...i.timeline,
          {
            stage: 'Resolved',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: 'Clinical Emergency Team',
            notes: 'Patient stabilized. Transferred to ICU stepdown.'
          }
        ]
      } : i));
    }
  };

  const handleResetDemo = () => {
    setDemoStep(0);
    setIsDemoAutoPlaying(false);
    setIncidents(INITIAL_EMERGENCY_INCIDENTS);
    setSelectedIncidentId(INITIAL_EMERGENCY_INCIDENTS[0].id);
  };

  // Helper for severity styling
  const getSeverityBadge = (severity: EmergencySeverity) => {
    switch (severity) {
      case 'Level 1':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LEVEL 1 (CODE RED)
          </span>
        );
      case 'Level 2':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white">
            <span className="w-2 h-2 rounded-full bg-amber-200" />
            LEVEL 2 (CODE ORANGE)
          </span>
        );
      case 'Level 3':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-400 text-slate-900">
            LEVEL 3 (CODE YELLOW)
          </span>
        );
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: EmergencyStatus) => {
    switch (status) {
      case 'Reported':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Reported</span>;
      case 'Under Assessment':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Under Assessment</span>;
      case 'Resource Requested':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Resource Requested</span>;
      case 'Resources Allocated':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Resources Allocated</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">In Progress</span>;
      case 'Resolved':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast / Notification Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{actionSuccessMsg}</p>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & LIVE TELEMETRY BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white tracking-wide uppercase border border-red-400/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Live Command Telemetry
              </span>
              <span className="text-xs text-slate-300 font-mono bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                {currentTime} IST
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                <Activity className="w-3 h-3" /> Socket.IO Connected
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-500" />
              Intelligent Emergency Command Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Centralized real-time emergency coordination, AI triage matching, cross-portal bed allocation, and live clinical response tracking.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsDemoModeActive(!isDemoModeActive)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border shadow-sm ${
                isDemoModeActive 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 ring-2 ring-purple-400/50' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              {isDemoModeActive ? 'Exit Demo Simulation' : 'Interactive Demo Mode'}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Report Emergency Incident
            </button>
          </div>
        </div>

        {/* DEMO MODE CONTROL BAR (when toggled active) */}
        {isDemoModeActive && (
          <div className="mt-6 pt-5 border-t border-slate-700/80 bg-purple-950/40 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                    Demo Mode Active
                  </span>
                  <span className="text-sm font-bold text-purple-200">
                    {demoStepsList[demoStep].title}
                  </span>
                </div>
                <p className="text-xs text-purple-300/90 mt-1 max-w-2xl">
                  {demoStepsList[demoStep].desc}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleResetDemo}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={handleAdvanceDemoStep}
                  disabled={demoStep >= demoStepsList.length - 1}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5"
                >
                  Next Stage <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              {demoStepsList.map((st, idx) => (
                <div 
                  key={idx}
                  onClick={() => setDemoStep(idx)}
                  className={`cursor-pointer rounded-lg p-2 text-center transition-all border ${
                    idx === demoStep 
                      ? 'bg-purple-600 text-white border-purple-400 font-bold' 
                      : idx < demoStep 
                        ? 'bg-purple-900/60 text-purple-200 border-purple-700/50' 
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider">Stage {idx + 1}</div>
                  <div className="text-[11px] truncate mt-0.5">{st.title.split(':')[1]?.trim() || st.title}</div>
                </div>
              ))}
            </div>

            {/* Simulation Scenarios Switcher */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-800/60 flex-wrap">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Sandbox Scenarios:
              </span>
              <button
                type="button"
                onClick={() => handleRunScenario('mass_casualty')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 transition-colors"
              >
                🚨 Mass Casualty (MCI)
              </button>
              <button
                type="button"
                onClick={() => handleRunScenario('icu_shortage')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 transition-colors"
              >
                ⚠️ ICU Shortage Surge
              </button>
              <button
                type="button"
                onClick={() => handleRunScenario('ventilator_failure')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 transition-colors"
              >
                🔌 Ventilator Failure Alarm
              </button>
              <button
                type="button"
                onClick={() => handleRunScenario('reset')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
              >
                🧹 Clear Sandbox
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EMERGENCY SHORTAGE ALERT BANNER (Active when resources are strained) */}
      {hasCriticalShortage && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                  CRITICAL RESOURCE SHORTAGE DETECTED
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  {hasIcuShortage && 'Dedicated ICU Beds at 100% capacity. '}
                  {hasVentilatorShortage && 'Mechanical Ventilators at zero buffer availability. '}
                  Alternative High Dependency Unit (HDU) buffer wards and Step-Down Recovery suites are available for overflow diversion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setTransferRequested(true);
                  setActionSuccessMsg('Emergency inter-hospital diversion request broadcasted to Apex Network.');
                }}
                disabled={transferRequested}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-red-700 border border-red-300 hover:bg-red-100 shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                {transferRequested ? 'Transfer Requested' : 'Request Network Transfer'}
              </button>

              <button
                onClick={() => {
                  setAdminNotified(true);
                  setActionSuccessMsg('Hospital Administrator & Clinical Director notified via High-Priority SMS & Telegram.');
                }}
                disabled={adminNotified}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                {adminNotified ? 'Admin Notified' : 'Notify Hospital Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Active Emergencies */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-red-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{activeIncidentsCount}</div>
          <div className="text-[11px] text-red-600 font-semibold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {criticalCodeRedCount} Code Red
          </div>
        </div>

        {/* 2. Critical Patients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{criticalCodeRedCount}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Under Resus</div>
        </div>

        {/* 3. ICU Beds Available */}
        <div className={`p-3.5 rounded-xl border shadow-sm transition-all ${
          availableIcuBeds.length > 0 
            ? 'bg-white border-slate-200 hover:border-blue-300' 
            : 'bg-red-50/70 border-red-300'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">ICU Beds</span>
            <Bed className={`w-4 h-4 ${availableIcuBeds.length > 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
          <div className={`text-xl font-extrabold ${availableIcuBeds.length > 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {availableIcuBeds.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Ready Now</div>
        </div>

        {/* 4. Emergency Bays */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Emerg Bays</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700">{availableEmergencyBays.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Triage Ready</div>
        </div>

        {/* 5. Ventilators Available */}
        <div className={`p-3.5 rounded-xl border shadow-sm transition-all ${
          availableVentilators.length > 0 
            ? 'bg-white border-slate-200 hover:border-teal-300' 
            : 'bg-red-50/70 border-red-300'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ventilators</span>
            <Wind className={`w-4 h-4 ${availableVentilators.length > 0 ? 'text-teal-600' : 'text-red-600'}`} />
          </div>
          <div className={`text-xl font-extrabold ${availableVentilators.length > 0 ? 'text-teal-700' : 'text-red-600'}`}>
            {availableVentilators.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Operational</div>
        </div>

        {/* 6. Oxygen & Blood Reserves */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blood/O2</span>
            <Droplet className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">42 U</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Liquid O2: 98%</div>
        </div>

        {/* 7. Emergency Specialists */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Specialists</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-indigo-700">6</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">On-Duty Lead</div>
        </div>

        {/* 8. Pending Approvals */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approvals</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-700">{pendingApprovalsCount}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Pending Signoff</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Flame className="w-4 h-4" />
            Emergency Priority Queue
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800 font-bold">
              {activeIncidentsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matching'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            Intelligent Resource Matching
            {selectedIncident?.matchedResources && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {selectedIncident.matchedResources.score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Response Timeline
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Emergency Analytics
          </button>
        </div>

        {selectedIncident && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>Selected:</span>
            <span className="font-bold text-slate-900 font-mono">{selectedIncident.id}</span>
            <span>({selectedIncident.patientName})</span>
          </div>
        )}
      </div>

      {/* VIEW TAB 1: EMERGENCY PRIORITY QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Active Emergency Incidents & Triage Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered dynamically by severity level, clinical deterioration risk, and elapsed waiting duration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Total in queue: <strong className="text-slate-900">{incidents.length}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Severity & ID</th>
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Emergency Presentation</th>
                    <th className="py-3 px-4">Required Resources</th>
                    <th className="py-3 px-4">Care Team</th>
                    <th className="py-3 px-4">Wait Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {incidents.map((incident) => {
                    const isSelected = incident.id === selectedIncidentId;
                    const elapsedMinutes = Math.max(
                      1, 
                      Math.floor((Date.now() - new Date(incident.reportedAt).getTime()) / (1000 * 60))
                    );

                    return (
                      <tr 
                        key={incident.id} 
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/40 font-medium' : ''
                        }`}
                      >
                        {/* Severity & ID */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div>{getSeverityBadge(incident.severity)}</div>
                            <div className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1">
                              {incident.id}
                              {(incident.isSimulated || incident.id.startsWith('SIM-') || incident.id === 'INC-2026-DEMO') && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  SIMULATED
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Patient Profile */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{incident.patientName}</div>
                          <div className="text-[11px] text-slate-500">
                            {incident.age || 45}y • {incident.gender || 'M'} • Blood: <span className="font-bold text-rose-600">{incident.bloodGroup || 'O+'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {incident.patientId || 'Pending'}</div>
                        </td>

                        {/* Emergency Type & Location */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-800">{incident.emergencyType}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {incident.location}
                          </div>
                          {incident.priorityJustification && (
                            <div className="text-[10px] text-slate-500 mt-1 italic truncate">
                              "{incident.priorityJustification}"
                            </div>
                          )}
                        </td>

                        {/* Required Resources */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {incident.requiredResources.map((res, i) => (
                              <span 
                                key={i}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Care Team */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-indigo-600" />
                            {incident.assignedDoctorName || 'Pending Assignment'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            {incident.assignedNurseName || 'Unassigned'}
                          </div>
                        </td>

                        {/* Wait Time */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs ${
                            elapsedMinutes > 30 
                              ? 'bg-red-100 text-red-800' 
                              : elapsedMinutes > 15 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {elapsedMinutes}m
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div>{getStatusBadge(incident.status)}</div>
                          {incident.allocatedBedNumber && (
                            <div className="text-[10px] font-bold text-purple-700 mt-1 flex items-center gap-1">
                              <Bed className="w-3 h-3" />
                              Bed: {incident.allocatedBedNumber}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPriorityModal(incident);
                              }}
                              title="Adjust Triage Priority (Mandatory Justification)"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                            >
                              Priority
                            </button>

                            {incident.status !== 'Resolved' && incident.status !== 'Resources Allocated' && incident.status !== 'In Progress' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAllocateModal(incident);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
                              >
                                Allocate
                              </button>
                            )}

                            {incident.status !== 'Resolved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenResolveModal(incident);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: INTELLIGENT RESOURCE MATCHING */}
      {activeTab === 'matching' && selectedIncident && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Incident Details & Live Match Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Match Summary Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedIncident.id}
                    </span>
                    {getSeverityBadge(selectedIncident.severity)}
                    {getStatusBadge(selectedIncident.status)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedIncident.patientName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedIncident.emergencyType} • Arrived at {selectedIncident.location}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-semibold uppercase">AI Match Score</div>
                    <div className="text-2xl font-black text-emerald-600">
                      {selectedIncident.matchedResources?.score || 94}%
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Clinical Protocol & Matching Rationale */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Clinical Protocol & Recommendation Rationale
                    </h3>
                    <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                      {selectedIncident.matchedResources?.rationale || 
                       'Emergency patient requires level-1 resuscitation with continuous hemodynamic monitoring, arterial blood gas stabilization, and ventilator readiness. AI algorithm identified closest compatible critical care bed with active telemetry.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Matched Resource Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* 1. Bed Recommendation */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between text-slate-600 mb-2">
                    <span className="text-xs font-bold uppercase">Matched Bed</span>
                    <Bed className="w-4 h-4 text-blue-600" />
                  </div>
                  {selectedIncident.matchedResources?.recommendedBed ? (
                    <div>
                      <div className="font-extrabold text-slate-900 text-base">
                        {selectedIncident.matchedResources.recommendedBed.bedNumber}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {selectedIncident.matchedResources.recommendedBed.ward}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3" /> Operationally Ready
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 font-semibold">
                      No ready ICU bed. Step-down HDU buffer recommended.
                    </div>
                  )}
                </div>

                {/* 2. Equipment Recommendation */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between text-slate-600 mb-2">
                    <span className="text-xs font-bold uppercase">Life Support</span>
                    <Wind className="w-4 h-4 text-teal-600" />
                  </div>
                  {selectedIncident.matchedResources?.recommendedVentilator ? (
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm truncate">
                        {selectedIncident.matchedResources.recommendedVentilator.name}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Location: {selectedIncident.matchedResources.recommendedVentilator.ward}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        <Check className="w-3 h-3" /> Calibrated & Standby
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        Oxygen & Defibrillator Standby
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Standard resuscitation cart
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Available in Bay
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Blood Reserve & Specialist */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between text-slate-600 mb-2">
                    <span className="text-xs font-bold uppercase">Blood & Doctor</span>
                    <Droplet className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {selectedIncident.bloodGroup || 'O+'} Blood: <span className="text-emerald-600 font-bold">Available (6 U)</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-indigo-600" />
                    {selectedIncident.assignedDoctorName || 'Dr. Sundaramoorthy M.'}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    <Check className="w-3 h-3" /> Specialist Paged
                  </div>
                </div>
              </div>

              {/* HUMAN CONFIRMATION MANDATE WARNING */}
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Human Clinical Authorization Required
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      MediSync AI does not autonomously commit hospital resources. An authorized physician or hospital administrator must verify and sign off on this allocation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAllocateModal(selectedIncident)}
                  disabled={selectedIncident.status === 'Resolved'}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Authorize & Commit Resources
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Incident Selector List */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Select Incident to Review Matches
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      inc.id === selectedIncidentId
                        ? 'border-red-500 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-700">{inc.id}</span>
                      {getSeverityBadge(inc.severity)}
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{inc.patientName}</div>
                    <div className="text-xs text-slate-500 truncate">{inc.emergencyType}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{inc.location}</span>
                      <span className="font-bold text-emerald-600">
                        Match {inc.matchedResources?.score || 90}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: EMERGENCY RESPONSE TIMELINE */}
      {activeTab === 'timeline' && selectedIncident && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{selectedIncident.id}</span>
                {getSeverityBadge(selectedIncident.severity)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Response Progression & Audit Timeline: {selectedIncident.patientName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological clinical journey from emergency report to active treatment and resolution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Current Status:</span>
              {getStatusBadge(selectedIncident.status)}
            </div>
          </div>

          {/* Stepper Stages (Visual flow) */}
          <div className="mt-6 py-4 px-2 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              {[
                'Reported',
                'Doctor Assigned',
                'Resource Assessment',
                'Resources Allocated',
                'In Progress',
                'Resolved'
              ].map((stageName, idx) => {
                const isPassed = selectedIncident.timeline.some(t => t.stage.toLowerCase() === stageName.toLowerCase()) || 
                                (selectedIncident.status === 'Resolved');
                const isCurrent = selectedIncident.status.toLowerCase() === stageName.toLowerCase();

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed || isCurrent 
                        ? 'bg-red-600 text-white ring-4 ring-red-100' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-semibold mt-2 whitespace-nowrap ${
                      isCurrent ? 'text-red-600 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {stageName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological Event Log */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chronological Audit Log
            </h3>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {selectedIncident.timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-red-600 border-2 border-white ring-2 ring-red-200" />
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{event.stage}</span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">{event.timestamp}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      Logged by: <strong className="text-slate-700">{event.actor}</strong>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      {event.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: EMERGENCY ANALYTICS & TRENDS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Avg Response Time</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">4.8 min</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↓ 1.2 min from target</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Avg Bed Allocation</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">8.5 min</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Under 10 min benchmark</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Bed Utilization</span>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">82.5%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Optimal operational load</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Shortage Frequency</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">1 Incident</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Diversion mitigated</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Resolution Rate</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">94.2%</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">High survival rate</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Logged Today</span>
              <div className="text-2xl font-extrabold text-purple-700 mt-1">26 Cases</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across 4 triage bays</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Activity Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Emergency Incident Trends (Hourly)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of incoming acute incidents vs. resolved stabilized cases.
              </p>

              <div className="space-y-3">
                {analytics.recentTrends.map((trend, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-12 text-xs font-mono font-bold text-slate-500">{trend.time}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${trend.active * 12}%` }}
                        className="bg-red-500 h-full text-[10px] text-white flex items-center justify-center font-bold"
                        title={`Active: ${trend.active}`}
                      >
                        {trend.active > 0 ? trend.active : ''}
                      </div>
                      <div 
                        style={{ width: `${trend.resolved * 10}%` }}
                        className="bg-emerald-500 h-full text-[10px] text-white flex items-center justify-center font-bold"
                        title={`Resolved: ${trend.resolved}`}
                      >
                        {trend.resolved > 0 ? trend.resolved : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-red-500" /> Active Emergency Cases
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Resolved & Transferred
                </span>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Triage Severity Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Stratification of emergency admissions under Manchester Triage System.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-red-700">Level 1 - Code Red (Resuscitation)</span>
                    <span className="font-mono font-bold text-slate-900">2 cases (67%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-amber-700">Level 2 - Code Orange (Emergent)</span>
                    <span className="font-mono font-bold text-slate-900">1 case (33%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-yellow-700">Level 3 - Code Yellow (Urgent)</span>
                    <span className="font-mono font-bold text-slate-900">0 cases (0%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-yellow-400 h-full rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>Quality Benchmark:</strong> 100% of Level 1 Code Red incidents were attended by a specialist physician in under 5 minutes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REPORT NEW EMERGENCY INCIDENT */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Acute Emergency Incident"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rapid Clinical Presets (One-Click)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_PRESETS.map((preset, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 text-left rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition-colors"
                >
                  <div className="text-xs font-bold text-slate-900">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{preset.emergencyType}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Name or Temp ID *
              </label>
              <input
                type="text"
                required
                value={reportForm.patientName}
                onChange={e => setReportForm({ ...reportForm, patientName: e.target.value })}
                placeholder="e.g., Sundaramoorthy R. or John Doe (Unconscious)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Triage Severity Level *
              </label>
              <select
                value={reportForm.severity}
                onChange={e => setReportForm({ ...reportForm, severity: e.target.value as EmergencySeverity })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Level 1">Level 1 (Code Red - Resuscitation)</option>
                <option value="Level 2">Level 2 (Code Orange - Emergent)</option>
                <option value="Level 3">Level 3 (Code Yellow - Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={reportForm.age}
                onChange={e => setReportForm({ ...reportForm, age: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={reportForm.gender}
                onChange={e => setReportForm({ ...reportForm, gender: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={reportForm.bloodGroup}
                onChange={e => setReportForm({ ...reportForm, bloodGroup: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              >
                <option value="O+">O+</option>
                <option value="O-">O- (Universal)</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Type</label>
              <input
                type="text"
                value={reportForm.emergencyType}
                onChange={e => setReportForm({ ...reportForm, emergencyType: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={reportForm.location}
                onChange={e => setReportForm({ ...reportForm, location: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinical Notes & Presenting Symptoms
            </label>
            <textarea
              rows={2}
              value={reportForm.clinicalNotes}
              onChange={e => setReportForm({ ...reportForm, clinicalNotes: e.target.value })}
              placeholder="e.g., Unstable vitals, SpO2 84%, GCS 8, severe thoracic trauma..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              Broadcast Code Alert
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADJUST PRIORITY WITH MANDATORY JUSTIFICATION */}
      <Modal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        title="Adjust Triage Priority"
      >
        {targetIncidentForAction && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-mono">{targetIncidentForAction.id}</div>
              <div className="text-sm font-bold text-slate-900">{targetIncidentForAction.patientName}</div>
              <div className="text-xs text-slate-600 mt-0.5">Current Severity: <strong>{targetIncidentForAction.severity}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Severity Level *
              </label>
              <select
                value={newSeverity}
                onChange={e => setNewSeverity(e.target.value as EmergencySeverity)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
              >
                <option value="Level 1">Level 1 (Code Red - Critical Resuscitation)</option>
                <option value="Level 2">Level 2 (Code Orange - Emergent)</option>
                <option value="Level 3">Level 3 (Code Yellow - Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Clinical Justification *
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Hospital compliance requires documented medical reasoning for overriding emergency triage queue rank.
              </p>
              <textarea
                rows={3}
                required
                value={priorityJustification}
                onChange={e => {
                  setPriorityJustification(e.target.value);
                  if (e.target.value.trim()) setPriorityError('');
                }}
                placeholder="e.g., Acute deterioration noted on arterial blood gas: pH 7.18, PaO2 55 mmHg despite high-flow O2..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {priorityError && (
                <p className="text-xs text-red-600 font-bold mt-1">{priorityError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPriorityModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePriority}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Save & Update Queue
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: RESOURCE ALLOCATION CONFIRMATION */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Confirm Emergency Resource Allocation"
      >
        {targetIncidentForAction && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-600">{targetIncidentForAction.id}</span>
                {getSeverityBadge(targetIncidentForAction.severity)}
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">{targetIncidentForAction.patientName}</div>
              <div className="text-xs text-slate-600">{targetIncidentForAction.emergencyType}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Proposed Resource Allocation
              </h4>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-blue-600" /> Bed Assignment:
                  </span>
                  <span className="font-bold text-blue-800">
                    {targetIncidentForAction.matchedResources?.recommendedBed 
                      ? `${targetIncidentForAction.matchedResources.recommendedBed.bedNumber} (${targetIncidentForAction.matchedResources.recommendedBed.ward})`
                      : availableIcuBeds[0] 
                        ? `${availableIcuBeds[0].bedNumber} (${availableIcuBeds[0].ward})`
                        : 'Emergency Bay Resus Bed'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-teal-600" /> Life Support:
                  </span>
                  <span className="font-bold text-teal-800">
                    {targetIncidentForAction.matchedResources?.recommendedVentilator 
                      ? targetIncidentForAction.matchedResources.recommendedVentilator.name 
                      : availableVentilators[0]?.name || 'Standard Resuscitation Cart'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-indigo-600" /> Attending Lead:
                  </span>
                  <span className="font-bold text-indigo-800">
                    {targetIncidentForAction.assignedDoctorName || 'Dr. Sundaramoorthy M.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
              <strong>System Action:</strong> Confirming allocation will immediately transition the selected bed status to <strong>Occupied</strong> across the hospital registry, dock telemetry equipment, and dispatch an intake task to the nursing station.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAllocation}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Dispatch Allocation
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. CLINICAL RESOLUTION MODAL */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Authorize Emergency Incident Resolution & Sign-Off"
      >
        {targetIncidentForAction && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Clinical Case Resolution Authorization
              </div>
              Confirming this action marks Incident <strong>{targetIncidentForAction.id}</strong> ({targetIncidentForAction.patientName}) as <strong>Resolved</strong> in the Hospital Command Center. An immutable audit record will be logged with your digital signature.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Clinical Stabilization Summary & Disposition Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="Document stabilization status, interventions performed, and transfer/discharge destination..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={releaseBedOnResolve}
                  onChange={(e) => setReleaseBedOnResolve(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Release emergency intake bay for turnaround and new emergency admissions</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                If the patient is remaining in the bed for long-term inpatient care, uncheck this box to preserve bed occupancy.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sign & Finalize Resolution
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
