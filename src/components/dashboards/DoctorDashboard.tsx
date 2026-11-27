import React, { useState } from 'react';
import { 
  Stethoscope, 
  Bed, 
  Activity, 
  Plus, 
  Send, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Users, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const DoctorDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { 
    user, 
    beds, 
    equipment, 
    resourceRequests, 
    createResourceRequest,
    updateRequestStatus 
  } = useApp();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState<'ICU Bed' | 'Ventilator' | 'HDU Bed' | 'Emergency Bed'>('ICU Bed');
  const [urgency, setUrgency] = useState<'Critical' | 'Urgent' | 'Routine'>('Critical');
  const [reason, setReason] = useState('');
  const [patientName, setPatientName] = useState('');
  const [department, setDepartment] = useState('Critical Care & Cardiology');

  const readyIcuBeds = beds.filter(b => b.type === 'ICU' && b.status === 'ready').length;
  const readyGeneralBeds = beds.filter(b => b.status === 'ready').length;
  const availableVentilators = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length;
  const myRequests = resourceRequests.filter(r => r.requesterId.includes('doc') || r.requesterName === user?.name);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    createResourceRequest({
      requesterId: user?.id || 'doc-sundar',
      requesterName: user?.name || 'Dr. Sundaramoorthy M.',
      requesterRole: 'doctor',
      department,
      resourceType,
      quantity: 1,
      urgency,
      reason: reason.trim(),
      patientName: patientName.trim() || 'Emergency Patient',
      patientId: 'PT-' + Math.floor(1000 + Math.random() * 9000)
    });

    setIsRequestModalOpen(false);
    setReason('');
    setPatientName('');
  };

  const handleConfirmAllocation = (reqId: string) => {
    updateRequestStatus(reqId, 'fulfilled');
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Readiness Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>ICU Beds Available</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-[#2563A6]">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#2563A6] mt-2">{readyIcuBeds}</div>
          <div className="text-[11px] text-[#64748B] mt-1">
            Ready for instant critical admission
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Available Ventilators</span>
            <span className="p-1.5 rounded-md bg-green-50 text-[#15803D]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#15803D] mt-2">{availableVentilators}</div>
          <div className="text-[11px] text-[#15803D] mt-1">
            Calibrated mechanical units
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Total Operational Ready Beds</span>
            <span className="p-1.5 rounded-md bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-2">{readyGeneralBeds}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Across all hospital wards</div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>My Active Requisitions</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-[#D97706]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#D97706] mt-2">{myRequests.length}</div>
          <div className="text-[11px] text-[#D97706] mt-1">Clinical resource tracker</div>
        </Card>
      </div>

      {/* Main Doctor Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Requests Management */}
          <Card
            title="Clinical Resource Requests & Admissions"
            subtitle="Request ICU beds, mechanical ventilation, or emergency bays"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRequestModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Resource Request
              </Button>
            }
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0]">
              {resourceRequests.map(req => {
                const isMyReq = req.requesterId.includes('doc') || req.requesterName === user?.name;
                const canConfirm = req.status === 'allocated';

                return (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1E293B]">
                            {req.patientName || 'Emergency Admission'}
                          </span>
                          <span className="text-xs font-mono text-slate-500">({req.patientId || 'PT-PENDING'})</span>
                          <Badge 
                            variant={req.urgency === 'Critical' ? 'critical' : 'warning'} 
                            size="sm"
                          >
                            {req.urgency}
                          </Badge>
                          <Badge 
                            variant={
                              req.status === 'fulfilled' ? 'success' :
                              req.status === 'allocated' ? 'primary' :
                              req.status === 'pending' ? 'warning' : 'critical'
                            }
                            size="sm"
                            dot
                          >
                            {req.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          <strong className="text-[#1E293B]">Required:</strong> {req.resourceType} &times; {req.quantity} — {req.reason}
                        </p>
                        <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-3">
                          <span>Requisitioned by: <strong>{req.requesterName}</strong></span>
                          <span>Time: {req.createdAt}</span>
                          {req.allocatedResourceId && (
                            <span className="text-[#15803D] font-semibold">Allocated: {req.allocatedResourceId}</span>
                          )}
                        </div>
                      </div>

                      {canConfirm && (
                        <div className="shrink-0">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConfirmAllocation(req.id)}
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Confirm Intake
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Assigned Inpatients Table */}
          <Card
            title="Assigned Inpatients & Step-down Monitoring"
            subtitle="Patients under direct care in ICU Block A and HDU"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Bed No.</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Clinical Notes</th>
                    <th className="px-4 py-3">Assigned Nurse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {beds.filter(b => b.patientName).map(bed => (
                    <tr key={bed.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#1E293B]">{bed.patientName}</div>
                        <div className="text-[10px] text-slate-400">{bed.patientId}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#2563A6]">{bed.bedNumber}</td>
                      <td className="px-4 py-3 text-[#64748B]">{bed.ward}</td>
                      <td className="px-4 py-3 text-[#475569]">{bed.notes || 'Routine vitals monitoring'}</td>
                      <td className="px-4 py-3 text-[#64748B]">{bed.assignedNurse || 'Nurse Duty'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Bed & Equipment Availability for Matching */}
        <div className="space-y-6">
          <Card
            title="Real-Time Bed Readiness Matrix"
            subtitle="Verified beds awaiting clinical assignment"
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0]">
              {beds.filter(b => b.status === 'ready').map(bed => (
                <div key={bed.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                      {bed.bedNumber} ({bed.type})
                    </div>
                    <div className="text-[11px] text-[#64748B]">{bed.ward} &middot; Verified ready</div>
                  </div>
                  <Badge variant="success" size="sm">Available</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Hospital Clinical Protocol Guidelines"
            subtitle="Institutional resource matching rules"
            noPadding
          >
            <div className="p-4 space-y-2.5 text-xs text-[#64748B]">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6] shrink-0 mt-1.5" />
                <span>Critical requests require clinical justification and are prioritized in the Command Center queue.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6] shrink-0 mt-1.5" />
                <span>Ventilator allocation requires nurse equipment checklist calibration before patient docking.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6] shrink-0 mt-1.5" />
                <span>Patient transfer to step-down wards automatically triggers sanitization order for ward nurses.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Requisition Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Clinical Resource Requisition"
        description="Requisition ICU beds or equipment based on hospital-defined allocation rules."
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">Patient Name / Identifier</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh Balan (or Emergency Trauma Triage)"
              required
              className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Resource Required</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
              >
                <option value="ICU Bed">ICU Bed</option>
                <option value="Ventilator">Mechanical Ventilator</option>
                <option value="HDU Bed">High Dependency (HDU) Bed</option>
                <option value="Emergency Bed">Emergency Triage Bed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Clinical Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
              >
                <option value="Critical">Critical (Immediate danger)</option>
                <option value="Urgent">Urgent (Within 30 mins)</option>
                <option value="Routine">Routine (Elective / Scheduled)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">Clinical Indication & Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="State clinical reason (e.g. Acute myocardial infarction requiring telemetry monitoring)..."
              required
              className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
              Dispatch Requisition to Command Center
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
