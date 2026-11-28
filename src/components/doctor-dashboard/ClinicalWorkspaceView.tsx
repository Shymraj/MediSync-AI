import React, { useState } from 'react';
import { 
  Bed, 
  Activity, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  Users, 
  ChevronRight,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { hospitalDataService } from '../../services/hospitalDataService';

interface ClinicalWorkspaceViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const ClinicalWorkspaceView: React.FC<ClinicalWorkspaceViewProps> = ({ onNavigateTab }) => {
  const { 
    user, 
    beds, 
    equipment, 
    resourceRequests, 
    createResourceRequest,
    updateRequestStatus,
    patients,
    clinicalAlerts,
    acknowledgeClinicalAlert
  } = useApp();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState<'ICU Bed' | 'Ventilator' | 'HDU Bed' | 'Emergency Bed'>('ICU Bed');
  const [urgency, setUrgency] = useState<'Critical' | 'Urgent' | 'Routine'>('Critical');
  const [reason, setReason] = useState('');
  const [patientName, setPatientName] = useState('');
  const [department, setDepartment] = useState('Critical Care & Cardiology');

  const readyIcuBeds = beds.filter(b => b.type === 'ICU' && ((b.status as string) === 'ready' || (b.status as string) === 'Available')).length;
  const readyGeneralBeds = beds.filter(b => (b.status as string) === 'ready' || (b.status as string) === 'Available').length;
  const availableVentilators = equipment.filter(e => e.category === 'Ventilator' && e.status === 'Available').length;
  const myRequests = resourceRequests.filter(r => r.requesterId.includes('doc') || r.requesterName === user?.name);
  const activeAlerts = clinicalAlerts.filter(a => a.status === 'Active');
  const appointments = hospitalDataService.getAppointments();
  const pendingAdmissions = hospitalDataService.getPendingAdmissions();
  const assignedInpatients = patients.filter(p => p.attendingPhysician?.includes('Sundar') || p.attendingPhysician === user?.name || true);

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
      {/* Predictive Capacity Warnings for Doctors (Operational Resource Alerts) */}
      {(readyIcuBeds <= 2 || availableVentilators <= 1) && (
        <div className="bg-amber-50/90 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  Clinical Capacity Warning (Predictive Intelligence)
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                    Operational Alert
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  {readyIcuBeds <= 2 && `ICU Beds at critical threshold (${readyIcuBeds} available). Forecasted evening deficit of -3 beds. `}
                  {availableVentilators <= 1 && `Ventilator buffer low (${availableVentilators} unit available). Standby units recalled from biomedical calibration. `}
                  Peak trauma surge anticipated 18:00 – 23:00 IST.
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('forecasting')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
              >
                View Capacity Forecast <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Clinical Readiness Overview - 6 Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">ICU Ready</span>
            <span className="p-1 rounded bg-blue-50 text-[#2563A6]">
              <Bed className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#2563A6] mt-1.5">{readyIcuBeds}</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">Critical beds ready</div>
        </Card>

        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">Ventilators</span>
            <span className="p-1 rounded bg-green-50 text-[#15803D]">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#15803D] mt-1.5">{availableVentilators}</div>
          <div className="text-[10px] text-[#15803D] mt-0.5">Calibrated units</div>
        </Card>

        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">Assigned Inpatients</span>
            <span className="p-1 rounded bg-purple-50 text-purple-700">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-purple-900 mt-1.5">{assignedInpatients.length}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Under direct care</div>
        </Card>

        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">Appointments</span>
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#1E293B] mt-1.5">{appointments.length}</div>
          <div className="text-[10px] text-[#64748B] mt-0.5">Today's OPD clinic</div>
        </Card>

        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">Active Alerts</span>
            <span className="p-1 rounded bg-red-50 text-red-600">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-red-600 mt-1.5">{activeAlerts.length}</div>
          <div className="text-[10px] text-red-700 mt-0.5">Physiological MEWS</div>
        </Card>

        <Card noPadding className="p-3.5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium text-[11px]">Requisitions</span>
            <span className="p-1 rounded bg-amber-50 text-[#D97706]">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#D97706] mt-1.5">{myRequests.length}</div>
          <div className="text-[10px] text-[#D97706] mt-0.5">Active resource track</div>
        </Card>
      </div>

      {/* Quick Access Action Bar for Advanced Clinical Features */}
      {onNavigateTab && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                MediSync AI Clinical Intelligence Active
                <span className="bg-blue-400/20 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                  REAL-TIME CDS
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                AI Early Warning System surveillance active across {patients.length} inpatients.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('early_warning')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              View EWS Alerts ({activeAlerts.length})
            </button>
            <button
              onClick={() => onNavigateTab('patients')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
            >
              <Users className="w-3.5 h-3.5" />
              My Patients
            </button>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Appointments
            </button>
          </div>
        </div>
      )}

      {/* Main Doctor Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Clinical Alerts Section */}
          {activeAlerts.length > 0 && (
            <Card
              title="Active Clinical Deterioration Alerts"
              subtitle="Physiological anomalies tracked by Early Warning System"
              action={
                onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('early_warning')}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    All EWS Alerts &rarr;
                  </button>
                )
              }
              noPadding
            >
              <div className="divide-y divide-red-100 bg-red-50/20">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-900">{alert.patientName}</span>
                        <Badge variant="critical" size="sm">MEWS {alert.mewsScore}</Badge>
                        <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-red-800 text-[11px] mt-1 font-medium">{alert.reason}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledgeClinicalAlert(alert.id, user?.name || 'Dr. Sundaramoorthy M.')}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
                const canConfirm = req.status === 'allocated';

                return (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-colors">
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
                    {onNavigateTab && <th className="px-4 py-3 text-right">Action</th>}
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
                      {onNavigateTab && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onNavigateTab('digital_twin', bed.patientId)}
                            className="text-[#2563A6] hover:text-[#1D4ED8] font-semibold inline-flex items-center gap-0.5 text-[11px]"
                          >
                            Twin <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Appointments, Admissions & Readiness Matrix */}
        <div className="space-y-6">
          {/* Today's Appointments Mini-Card */}
          <Card
            title="Today's OPD Consultations"
            subtitle={`${appointments.length} patients scheduled`}
            action={
              onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('appointments')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  View All &rarr;
                </button>
              )
            }
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {appointments.slice(0, 3).map(apt => (
                <div key={apt.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{apt.patientName || apt.patient}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" /> {apt.time} &middot; Token #{apt.tokenNumber || apt.token_number || 1}
                    </div>
                  </div>
                  <Badge variant={apt.status === 'Completed' ? 'success' : apt.status === 'In Consultation' ? 'primary' : 'warning'} size="sm">
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Triage Admissions Mini-Card */}
          <Card
            title="Pending Triage Admissions"
            subtitle={`${pendingAdmissions.length} patients in queue`}
            action={
              onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('admissions')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Manage &rarr;
                </button>
              )
            }
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {pendingAdmissions.slice(0, 3).map(adm => (
                <div key={adm.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{adm.patient || adm.initialDiagnosis?.split('(')[1]?.replace(')', '') || 'Triage Intake'}</div>
                    <div className="text-[10px] text-slate-500">Target: {adm.targetWard || adm.ward} &middot; {adm.waitTime || '15m'}</div>
                  </div>
                  <Badge variant={(adm.triage || adm.triagePriority || '').includes('Red') ? 'critical' : 'warning'} size="sm">
                    {adm.triage || adm.triagePriority || 'STAT'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Real-Time Bed Readiness Matrix */}
          <Card
            title="Real-Time Bed Readiness Matrix"
            subtitle="Verified beds awaiting clinical assignment"
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
              {beds.filter(b => (b.status as string) === 'ready' || (b.status as string) === 'Available').map(bed => (
                <div key={bed.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
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
        maxWidth="md"
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
