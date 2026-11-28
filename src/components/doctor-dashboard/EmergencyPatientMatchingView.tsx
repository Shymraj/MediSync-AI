import React, { useState } from 'react';
import { 
  Zap, 
  Bed, 
  Activity, 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Filter,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

interface EmergencyPatientMatchingViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const EmergencyPatientMatchingView: React.FC<EmergencyPatientMatchingViewProps> = ({ onNavigateTab }) => {
  const { 
    beds, 
    equipment, 
    resourceRequests, 
    createResourceRequest, 
    updateRequestStatus,
    assignPatientToBed,
    user 
  } = useApp();

  const [patientName, setPatientName] = useState('');
  const [triageCategory, setTriageCategory] = useState<'Red - Resuscitation' | 'Orange - Emergent' | 'Yellow - Urgent'>('Red - Resuscitation');
  const [requiredResource, setRequiredResource] = useState<'ICU Bed' | 'Ventilator' | 'HDU Bed' | 'Emergency Bed'>('ICU Bed');
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [allocationSuccess, setAllocationSuccess] = useState<string | null>(null);

  // Safety confirmation modal state
  const [pendingResource, setPendingResource] = useState<{ id: string; name: string; type: 'bed' | 'equipment' } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const availableIcuBeds = beds.filter(b => b.type === 'ICU' && b.status === 'ready');
  const availableGeneralBeds = beds.filter(b => b.status === 'ready');
  const availableVentilators = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available');

  const initiateMatch = (resourceId: string, resourceName: string, type: 'bed' | 'equipment') => {
    if (!patientName.trim()) {
      alert('Please enter patient identifier before confirming allocation.');
      return;
    }
    setPendingResource({ id: resourceId, name: resourceName, type });
    setIsConfirmModalOpen(true);
  };

  const confirmAllocation = () => {
    if (!pendingResource) return;

    const { id: resourceId, name: resourceName } = pendingResource;
    const generatedPatientId = 'EMG-' + Math.floor(1000 + Math.random() * 9000);

    // If matching a bed, dock patient in bed
    if (requiredResource.includes('Bed')) {
      const result = assignPatientToBed(
        resourceId,
        patientName.trim(),
        generatedPatientId,
        user?.name || 'Dr. Sundaramoorthy M.',
        'Nurse Revathi S.'
      );
      if (!result.success) {
        alert(result.message);
        setIsConfirmModalOpen(false);
        return;
      }
    }

    // Create and auto-fulfill request
    createResourceRequest({
      requesterId: user?.id || 'doc-sundar',
      requesterName: user?.name || 'Dr. Sundaramoorthy M.',
      requesterRole: 'doctor',
      department: 'Emergency & Critical Care',
      resourceType: requiredResource,
      quantity: 1,
      urgency: 'Critical',
      reason: `Immediate emergency intake [${triageCategory}]: ` + (clinicalJustification || 'Acute stabilization'),
      patientName: patientName.trim(),
      patientId: generatedPatientId
    });

    setAllocationSuccess(`Matched & Allocated: ${resourceName} (${resourceId}) for patient ${patientName}! Bedside handover alert dispatched.`);
    setIsConfirmModalOpen(false);
    setPendingResource(null);

    setTimeout(() => {
      setAllocationSuccess(null);
      setPatientName('');
      setClinicalJustification('');
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-700/60 flex items-center justify-center shrink-0 border border-red-500/30">
            <Zap className="w-5 h-5 text-red-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Emergency Patient Intake & Instant Resource Matching</h3>
              <span className="bg-red-500/30 text-red-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                ONE-CLICK ALLOCATION
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-red-200/80 mt-0.5">
              Live matching engine linking triage arrivals directly with verified empty ICU beds and calibrated mechanical ventilators.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Ready ICU Beds:</span>
            <span className="font-extrabold text-blue-400 text-lg">{availableIcuBeds.length}</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Free Ventilators:</span>
            <span className="font-extrabold text-emerald-400 text-lg">{availableVentilators.length}</span>
          </div>
        </div>
      </div>

      {allocationSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>{allocationSuccess}</div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#2563A6] shrink-0" />
        <span>
          <strong>Human-In-The-Loop Safety Gate:</strong> Emergency allocations require mandatory attending physician confirmation. Bed docking and ventilator attachments are logged in the immutable institutional audit trail.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Intake Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Emergency Patient Intake Details" subtitle="Enter triage criteria to trigger real-time bed matchmaking" noPadding>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Patient Name / Trauma Tag</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Murugan K. (or Trauma Code Red #4)"
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Triage Acuity Level</label>
                <select
                  value={triageCategory}
                  onChange={(e) => setTriageCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
                >
                  <option value="Red - Resuscitation">Red - Category 1 (Resuscitation / Immediate)</option>
                  <option value="Orange - Emergent">Orange - Category 2 (Emergent / 15 mins)</option>
                  <option value="Yellow - Urgent">Yellow - Category 3 (Urgent / 30 mins)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Intervention Required</label>
                <select
                  value={requiredResource}
                  onChange={(e) => setRequiredResource(e.target.value as any)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
                >
                  <option value="ICU Bed">Critical Care ICU Bed</option>
                  <option value="Ventilator">Mechanical Ventilator</option>
                  <option value="HDU Bed">High Dependency (HDU) Bed</option>
                  <option value="Emergency Bed">Emergency Resuscitation Bay</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Clinical Indication & Presentation</label>
                <textarea
                  value={clinicalJustification}
                  onChange={(e) => setClinicalJustification(e.target.value)}
                  rows={3}
                  placeholder="e.g. Acute pulmonary edema with severe hypoxemia refractory to non-invasive ventilation..."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <span className="font-bold text-[#2563A6] block mb-1">Matching Protocol:</span>
                Select a verified available resource on the right. An attending physician confirmation prompt will appear before locking allocation.
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Matchable Resources */}
        <div className="lg:col-span-7 space-y-6">
          {/* Available ICU Beds */}
          <Card
            title={`Verified Ready ICU Beds (${availableIcuBeds.length} Available)`}
            subtitle="Inspected, sanitized, and ready for critical dock"
            noPadding
          >
            {availableIcuBeds.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No ICU beds currently in Ready status. All units occupied.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {availableIcuBeds.map(bed => (
                  <div key={bed.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                        <span>{bed.bedNumber}</span>
                        <span className="font-normal text-slate-500">({bed.type})</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {bed.ward} &middot; Sanitized &middot; Direct telemetry active
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => initiateMatch(bed.id, bed.bedNumber, 'bed')}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Instant Dock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Available Mechanical Ventilators */}
          <Card
            title={`Calibrated Mechanical Ventilators (${availableVentilators.length} Available)`}
            subtitle="Biomedical certified units in standby inventory"
            noPadding
          >
            {availableVentilators.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                All mechanical ventilators currently deployed.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {availableVentilators.map(eq => (
                  <div key={eq.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{eq.name}</span>
                        <span className="font-mono text-slate-500 text-[10px]">({eq.id})</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Location: {eq.ward || 'ICU Block A'} &middot; Calibrated
                      </div>
                    </div>

                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => initiateMatch(eq.id, eq.name, 'equipment')}
                      icon={<Activity className="w-3.5 h-3.5" />}
                    >
                      Allocate Ventilator
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {isConfirmModalOpen && pendingResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
                <span>Physician Allocation Confirmation</span>
              </div>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-700">
                You are authorizing the emergency admission and resource lock for:
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div><span className="text-slate-500">Patient:</span> <strong className="text-slate-800">{patientName}</strong></div>
                <div><span className="text-slate-500">Acuity Level:</span> <strong className="text-red-700">{triageCategory}</strong></div>
                <div><span className="text-slate-500">Target Resource:</span> <strong className="text-blue-700">{pendingResource.name} ({pendingResource.id})</strong></div>
                <div><span className="text-slate-500">Authorizing Physician:</span> <strong className="text-slate-800">{user?.name || 'Dr. Sundaramoorthy M.'}</strong></div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                Upon confirmation, bedside telemetry activates and notification is dispatched to Ward Nursing Station.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsConfirmModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={confirmAllocation}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Authorize Allocation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
