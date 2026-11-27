import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  Activity, 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HOSPITALS } from '../../data/mockData';

export const AdminDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { 
    user, 
    beds, 
    equipment, 
    resourceRequests, 
    updateRequestStatus, 
    updateBedStatus,
    updateEquipmentStatus 
  } = useApp();

  const [selectedRequestToAllocate, setSelectedRequestToAllocate] = useState<string | null>(null);

  // Hospital Stats
  const currentHosp = HOSPITALS.find(h => h.id === (user?.hospitalId || 'hosp-chn-01')) || HOSPITALS[0];
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const readyBeds = beds.filter(b => b.status === 'ready').length;
  const prepBeds = beds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation', 'discharged'].includes(b.status)).length;
  const availableVentilators = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length;
  const pendingRequests = resourceRequests.filter(r => r.status === 'pending');

  const handleApproveRequest = (reqId: string) => {
    // Allocate first available resource or mark allocated
    const req = resourceRequests.find(r => r.id === reqId);
    if (!req) return;

    if (req.resourceType === 'ICU Bed') {
      const readyIcu = beds.find(b => b.type === 'ICU' && b.status === 'ready');
      if (readyIcu) {
        updateBedStatus(readyIcu.id, 'occupied', `Allocated to patient ${req.patientName || 'Emergency'}`);
        updateRequestStatus(reqId, 'allocated', readyIcu.id);
      } else {
        updateRequestStatus(reqId, 'approved');
      }
    } else {
      const availEq = equipment.find(e => e.status === 'Available');
      if (availEq) {
        updateEquipmentStatus(availEq.id, 'In Use');
        updateRequestStatus(reqId, 'allocated', availEq.id);
      } else {
        updateRequestStatus(reqId, 'approved');
      }
    }
  };

  const handleRejectRequest = (reqId: string) => {
    updateRequestStatus(reqId, 'rejected');
  };

  return (
    <div className="space-y-6">
      {/* Top Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Operationally Ready Beds</span>
            <span className="p-1.5 rounded-md bg-green-50 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#15803D] mt-2">{readyBeds}</div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span className="font-semibold text-[#15803D]">Immediate</span> clinical intake
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Occupied Beds</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-[#475569]">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-2">{occupiedBeds}</div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {Math.round((occupiedBeds / (totalBeds || 1)) * 100)}% active census
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Under Prep & Cleaning</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-[#D97706]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#D97706] mt-2">{prepBeds}</div>
          <div className="text-[11px] text-[#D97706] mt-1">
            Nurse turnaround in progress
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Ventilators Ready</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-[#2563A6]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#2563A6] mt-2">{availableVentilators}</div>
          <div className="text-[11px] text-[#2563A6] mt-1">
            Calibrated & telemetry verified
          </div>
        </Card>
      </div>

      {/* Main Content Areas based on selected tab or full overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Requests Coordination Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Pending Clinical Resource Requests"
            subtitle="Actionable requisitions submitted by attending physicians and emergency teams"
            action={
              <Badge variant={pendingRequests.length > 0 ? 'critical' : 'success'} size="sm">
                {pendingRequests.length} Pending
              </Badge>
            }
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0]">
              {resourceRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          req.urgency === 'Critical' ? 'bg-red-50 text-[#DC2626]' : 'bg-blue-50 text-[#2563A6]'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1E293B]">
                              {req.resourceType} &times; {req.quantity}
                            </span>
                            <Badge 
                              variant={req.urgency === 'Critical' ? 'critical' : req.urgency === 'Urgent' ? 'warning' : 'secondary'} 
                              size="sm"
                            >
                              {req.urgency}
                            </Badge>
                            <Badge 
                              variant={
                                req.status === 'allocated' || req.status === 'fulfilled' 
                                  ? 'success' 
                                  : req.status === 'rejected' 
                                  ? 'critical' 
                                  : 'warning'
                              }
                              size="sm"
                              dot
                            >
                              {req.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                            {req.reason}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-3">
                            <span>Req by: <strong className="text-[#1E293B]">{req.requesterName}</strong></span>
                            <span>Dept: {req.department}</span>
                            <span>Time: {req.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {isPending && (
                        <div className="flex items-center gap-2 sm:self-center shrink-0 mt-2 sm:mt-0">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveRequest(req.id)}
                            icon={<Check className="w-3.5 h-3.5" />}
                          >
                            Approve & Allocate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectRequest(req.id)}
                            icon={<X className="w-3.5 h-3.5" />}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Hospital Bed Control Table */}
          <Card
            title="Hospital Bed State Matrix"
            subtitle="Live status across critical care, emergency, and step-down units"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Bed No.</th>
                    <th className="px-4 py-3">Ward / Unit</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3">Assigned / Turnaround</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {beds.map(bed => {
                    const statusBadgeVariant = 
                      bed.status === 'ready' ? 'success' :
                      bed.status === 'occupied' ? 'secondary' :
                      bed.status === 'cleaning' ? 'warning' : 'primary';

                    return (
                      <tr key={bed.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-[#1E293B]">{bed.bedNumber}</td>
                        <td className="px-4 py-3 text-[#64748B]">{bed.ward}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#1E293B]">{bed.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant} size="sm" dot>
                            {bed.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#64748B]">
                          {bed.patientName ? (
                            <span className="font-semibold text-[#1E293B]">{bed.patientName}</span>
                          ) : (
                            <span>{bed.assignedNurse || 'Sanitation Team'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {bed.status === 'occupied' ? (
                            <button
                              onClick={() => updateBedStatus(bed.id, 'discharged')}
                              className="text-[11px] font-semibold text-[#2563A6] hover:underline cursor-pointer"
                            >
                              Discharge
                            </button>
                          ) : bed.status !== 'ready' ? (
                            <button
                              onClick={() => updateBedStatus(bed.id, 'ready', 'Admin emergency override')}
                              className="text-[11px] font-semibold text-[#15803D] hover:underline cursor-pointer"
                            >
                              Force Ready
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Ready</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Info Column: Equipment & Staff Verification */}
        <div className="space-y-6">
          <Card
            title="Critical Equipment Telemetry"
            subtitle="Mechanical ventilators & life-support status"
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0]">
              {equipment.map(eq => (
                <div key={eq.id} className="p-3.5 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#1E293B]">{eq.name}</div>
                      <div className="text-[11px] text-[#64748B]">{eq.ward} &middot; SN: {eq.serialNumber}</div>
                    </div>
                    <Badge 
                      variant={eq.status === 'Available' ? 'success' : eq.status === 'In Use' ? 'secondary' : 'warning'}
                      size="sm"
                    >
                      {eq.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Inspected: {eq.lastInspection}</span>
                    <button 
                      onClick={() => updateEquipmentStatus(eq.id, eq.status === 'Available' ? 'In Use' : 'Available')}
                      className="text-[#2563A6] font-semibold hover:underline cursor-pointer"
                    >
                      Toggle Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Staff Verification & Security Queue"
            subtitle="Hospital clearance requests awaiting review"
            noPadding
          >
            <div className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
                  <span>Dr. K. Radhakrishnan</span>
                  <Badge variant="warning" size="sm">Doctor Verification</Badge>
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">Medical Reg: TN-MC-88190 &middot; Cardiology</div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Button variant="success" size="sm" className="text-xs py-1">Approve Clearance</Button>
                  <Button variant="ghost" size="sm" className="text-xs py-1 text-slate-500">Inspect Credentials</Button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
                  <span>Nurse M. Lavanya</span>
                  <Badge variant="warning" size="sm">Nurse Verification</Badge>
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">Reg: TNNMC-99214 &middot; Emergency Ward</div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Button variant="success" size="sm" className="text-xs py-1">Approve Clearance</Button>
                  <Button variant="ghost" size="sm" className="text-xs py-1 text-slate-500">Inspect Credentials</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
