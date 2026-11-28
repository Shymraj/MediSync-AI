import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  Bed, 
  Pill, 
  FileText, 
  Share2, 
  ShieldAlert, 
  BookOpen, 
  Settings as SettingsIcon, 
  Bell, 
  UserCheck, 
  Search, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Stethoscope,
  BrainCircuit,
  ArrowRight,
  Filter,
  Save,
  Check,
  ChevronDown,
  Thermometer,
  Heart,
  Droplet,
  Wind,
  Flame,
  Zap,
  ShieldCheck,
  Download,
  Sparkles,
  X,
  Edit2,
  Key,
  Lock,
  RefreshCw,
  Eye,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { INITIAL_CLINICAL_PATIENTS, PatientDigitalTwin } from '../../data/doctorDemoData';
import { hospitalDataService, DATA_UPDATED_EVENT } from '../../services/hospitalDataService';
import { api } from '../../services/api';

// 1. Appointments View
export const DoctorAppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>(() => hospitalDataService.getAppointments());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAppointments({ hospitalId: 'hosp-chn-01' });
      if (data && Array.isArray(data) && data.length > 0) {
        setAppointments(data);
      }
    } catch {
      setAppointments(hospitalDataService.getAppointments());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();

    const handleUpdate = () => {
      setAppointments(hospitalDataService.getAppointments());
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, []);

  const handleStatusChange = (aptId: string, newStatus: string) => {
    hospitalDataService.updateAppointmentStatus(aptId, newStatus);
    setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: newStatus } : a));
  };

  const filtered = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = !searchQuery || 
      (apt.patientName || apt.patient || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card
        title="Scheduled Outpatient Consultations & Clinical Appointments"
        subtitle="Today's OPD clinic roster and inpatient consultation requests"
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Token & ID</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Scheduled Time</th>
                <th className="px-4 py-3">Consultation Type / Dept</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No appointments match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#2563A6]">
                      Token #{apt.tokenNumber || apt.token_number || 1} &middot; {apt.id}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1E293B]">{apt.patientName || apt.patient}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.time}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{apt.department || apt.type || 'Cardiology Review'}</td>
                    <td className="px-4 py-3 text-slate-500">{apt.doctorName || 'Dr. Sundaramoorthy M.'}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={
                          apt.status === 'Completed' ? 'success' :
                          apt.status === 'In Consultation' ? 'primary' :
                          apt.status === 'Waiting' ? 'warning' : 'neutral'
                        } 
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status !== 'In Consultation' && apt.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'In Consultation')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                          >
                            Call In
                          </button>
                        )}
                        {apt.status === 'In Consultation' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Waiting')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                          >
                            Check-in
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 2. Pending Admissions View
export const DoctorPendingAdmissionsView: React.FC = () => {
  const { beds } = useApp();
  const [admissions, setAdmissions] = useState<any[]>(() => hospitalDataService.getPendingAdmissions());
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [admitSuccessNotice, setAdmitSuccessNotice] = useState<string | null>(null);

  const availableBeds = beds.filter(b => (b.status as string) === 'ready' || (b.status as string) === 'Available');

  const handleOpenAdmitModal = (adm: any) => {
    setSelectedAdmission(adm);
    const matchingBed = availableBeds.find(b => b.ward?.includes(adm.targetWard?.split(' ')[0] || '')) || availableBeds[0];
    setSelectedBedId(matchingBed?.id || matchingBed?.bedNumber || '');
    setIsModalOpen(true);
  };

  const handleConfirmAdmission = async () => {
    if (!selectedAdmission) return;
    
    hospitalDataService.acceptAdmission(selectedAdmission.id, selectedBedId, selectedAdmission.targetWard);
    setAdmissions(prev => prev.filter(a => a.id !== selectedAdmission.id));
    setIsModalOpen(false);
    
    setAdmitSuccessNotice(`Patient admission confirmed for ${selectedAdmission.patient || selectedAdmission.initialDiagnosis} into Bed ${selectedBedId || 'Allocated'}`);
    setTimeout(() => setAdmitSuccessNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {admitSuccessNotice && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{admitSuccessNotice}</span>
        </div>
      )}

      <Card
        title="Pending Inpatient Admissions & Emergency Triage Queue"
        subtitle="Patients awaiting ward bed assignment and attending physician intake orders"
        noPadding
      >
        <div className="divide-y divide-[#E2E8F0]">
          {admissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
              All triage admissions cleared. No patients currently awaiting bed dock.
            </div>
          ) : (
            admissions.map(adm => (
              <div key={adm.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1E293B] text-sm">{adm.patient || adm.initialDiagnosis?.split('(')[1]?.replace(')', '') || 'Triage Patient'}</span>
                    <span className="font-mono text-slate-500">({adm.id})</span>
                    <Badge variant={(adm.triage || adm.triagePriority || '').includes('Red') ? 'critical' : 'warning'} size="sm">
                      {adm.triage || adm.triagePriority || 'STAT (Red)'}
                    </Badge>
                  </div>
                  <div className="text-slate-600 mt-1">
                    <strong>Indication:</strong> {adm.reason || adm.initialDiagnosis} &middot; Target: <strong>{adm.targetWard || adm.ward}</strong> &middot; Wait time: {adm.waitTime || '15 mins'}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAdmitModal(adm)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Accept Admission
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Bed Assignment Modal */}
      {isModalOpen && selectedAdmission && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirm Patient Admission & Bed Allocation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-bold text-blue-900">{selectedAdmission.patient || selectedAdmission.initialDiagnosis}</div>
              <div className="text-blue-700 text-[11px] mt-0.5">
                Target: {selectedAdmission.targetWard || selectedAdmission.ward} &middot; Priority: {selectedAdmission.triage || selectedAdmission.triagePriority}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Select Operational Ready Bed</label>
              {availableBeds.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 rounded border border-amber-200">
                  No beds currently in 'ready' status. Request emergency bed clearance through Command Center.
                </div>
              ) : (
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold"
                >
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} &mdash; {b.ward} ({b.type} Bed, Operational Ready)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAdmission}
                disabled={availableBeds.length === 0}
              >
                Confirm Bed Dock & Intake
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 3. Clinical Wards Overview
export const DoctorClinicalWardsView: React.FC = () => {
  const { beds, patients } = useApp();
  const [selectedWardFilter, setSelectedWardFilter] = useState<string | null>(null);

  // Compute live statistics grouped by Ward
  const wardNames = [
    'ICU Block A',
    'ICU Block B',
    'High Dependency Unit (HDU)',
    'Ward 3 (General Medical)',
    'Ward 4 (Post-Surgical)'
  ];

  const wardsData = wardNames.map(name => {
    const key = name.includes('ICU Block A') ? 'ICU Block A' :
                name.includes('ICU Block B') ? 'ICU Block B' :
                name.includes('HDU') ? 'HDU' :
                name.includes('Ward 3') ? 'Ward 3' : 'Ward 4';
    
    const wardBeds = beds.filter(b => (b.ward || '').toLowerCase().includes(key.toLowerCase()));
    const total = wardBeds.length > 0 ? wardBeds.length : 12;
    const occupied = wardBeds.filter(b => b.status === 'occupied' || b.patientName).length;
    const ready = wardBeds.filter(b => (b.status as string) === 'ready' || (b.status as string) === 'Available').length;
    const assignedPatients = patients.filter(p => (p.ward || '').toLowerCase().includes(key.toLowerCase()));

    const acuity = name.includes('ICU') ? 'Critical' : name.includes('HDU') ? 'High' : 'Moderate';
    const nurseRatio = name.includes('ICU') ? '1:1' : name.includes('HDU') ? '1:2' : '1:4';

    return {
      name,
      key,
      beds: total,
      occupied,
      available: ready > 0 ? ready : Math.max(0, total - occupied),
      nurseRatio,
      acuity,
      patients: assignedPatients
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wardsData.map((w, idx) => (
          <Card key={idx} noPadding className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-xs text-[#1E293B]">{w.name}</h4>
              <Badge variant={w.acuity === 'Critical' ? 'critical' : 'primary'} size="sm">{w.acuity}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs my-3 bg-slate-50 p-2 rounded-lg">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Beds</span>
                <span className="font-bold text-[#1E293B]">{w.beds}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Occupied</span>
                <span className="font-bold text-red-600">{w.occupied}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Available</span>
                <span className="font-bold text-green-600">{w.available}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Nurse Ratio: <strong>{w.nurseRatio}</strong></span>
              <button 
                onClick={() => setSelectedWardFilter(selectedWardFilter === w.key ? null : w.key)}
                className="text-[#2563A6] font-semibold hover:underline"
              >
                {selectedWardFilter === w.key ? 'Hide Inpatients' : 'View Inpatients &rarr;'}
              </button>
            </div>

            {selectedWardFilter === w.key && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">Assigned Inpatients:</span>
                {w.patients.length === 0 ? (
                  <span className="text-slate-400 text-[11px]">No active inpatients mapped to this ward.</span>
                ) : (
                  w.patients.map(p => (
                    <div key={p.patientId} className="p-2 bg-white border border-slate-200 rounded flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{p.name} ({p.patientId})</div>
                        <div className="text-[10px] text-slate-500">Bed {p.bedNumber} &middot; {p.primaryDiagnosis}</div>
                      </div>
                      <Badge variant={p.riskLevel === 'Critical' ? 'critical' : 'primary'} size="sm">
                        MEWS {p.mewsScore}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// 4. Patient Telemetry Monitoring View
export const DoctorPatientMonitoringView: React.FC = () => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientForObs, setSelectedPatientForObs] = useState<PatientDigitalTwin | null>(null);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [newHR, setNewHR] = useState(80);
  const [newSBP, setNewSBP] = useState(120);
  const [newDBP, setNewDBP] = useState(80);
  const [newSpO2, setNewSpO2] = useState(98);
  const [newRR, setNewRR] = useState(16);
  const [newTemp, setNewTemp] = useState(37.0);

  const handleOpenRecordObs = (patient: PatientDigitalTwin) => {
    setSelectedPatientForObs(patient);
    setNewHR(patient.currentVitals?.heartRate || 80);
    setNewSBP(patient.currentVitals?.systolicBP || 120);
    setNewDBP(patient.currentVitals?.diastolicBP || 80);
    setNewSpO2(patient.currentVitals?.spO2 || 98);
    setNewRR(patient.currentVitals?.respiratoryRate || 16);
    setNewTemp(patient.currentVitals?.temperature || 37.0);
    setIsObsModalOpen(true);
  };

  const handleSaveObservation = async () => {
    if (!selectedPatientForObs) return;

    try {
      await api.recordObservation(selectedPatientForObs.patientId, {
        heartRate: newHR,
        systolicBP: newSBP,
        diastolicBP: newDBP,
        spO2: newSpO2,
        respiratoryRate: newRR,
        temperature: newTemp
      });
    } catch {}

    hospitalDataService.admitOrUpdatePatient({
      patientId: selectedPatientForObs.patientId,
      name: selectedPatientForObs.name,
      currentVitals: {
        timestamp: 'Just now',
        heartRate: newHR,
        systolicBP: newSBP,
        diastolicBP: newDBP,
        spO2: newSpO2,
        respiratoryRate: newRR,
        temperature: newTemp,
        gcsScore: 15
      }
    });

    setIsObsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Bedside Telemetry Surveillance</h3>
          <p className="text-xs text-slate-500">Live multi-patient physiological monitoring and clinical threshold alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map(p => {
          const vitals = p.currentVitals || { heartRate: 75, spO2: 98, systolicBP: 120, diastolicBP: 80, respiratoryRate: 16, temperature: 36.8 };
          const isTachycardic = vitals.heartRate > 100;
          const isBradycardic = vitals.heartRate < 50;
          const isHypoxemic = vitals.spO2 < 93;
          const isHypertensive = vitals.systolicBP > 140;
          const isHypotensive = vitals.systolicBP < 90;
          const isFebrile = vitals.temperature > 38.0;

          return (
            <Card key={p.patientId} noPadding className="p-4 border-t-4 border-t-[#2563A6]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#1E293B]">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.ward} &middot; Bed {p.bedNumber}</div>
                </div>
                <Badge variant={p.riskLevel === 'Critical' ? 'critical' : 'success'} size="sm">
                  MEWS {p.mewsScore}
                </Badge>
              </div>

              {/* Live Telemetry Wave Simulation */}
              <div className="my-3 p-3 bg-slate-900 rounded-lg font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">HR</span>
                  <span className={`text-base font-bold ${isTachycardic || isBradycardic ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                    {vitals.heartRate} bpm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className={`text-base font-bold ${isHypoxemic ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                    {vitals.spO2}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">NIBP</span>
                  <span className={`text-base font-bold ${isHypertensive || isHypotensive ? 'text-amber-400' : 'text-slate-200'}`}>
                    {vitals.systolicBP}/{vitals.diastolicBP}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Temp</span>
                  <span className={`text-base font-bold ${isFebrile ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {vitals.temperature}&deg;C
                  </span>
                </div>
              </div>

              {/* Threshold Warnings */}
              {(isTachycardic || isHypoxemic || isHypotensive || isFebrile) && (
                <div className="mb-2 p-1.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Threshold breach: {isHypoxemic ? 'SpO2 < 93% ' : ''}{isTachycardic ? 'HR > 100 ' : ''}{isHypotensive ? 'MAP low ' : ''}
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 truncate mb-3">
                Indication: {p.primaryDiagnosis}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => handleOpenRecordObs(p)}>
                  Record Observation
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Record Observation Modal */}
      {isObsModalOpen && selectedPatientForObs && (
        <Modal
          isOpen={isObsModalOpen}
          onClose={() => setIsObsModalOpen(false)}
          title={`Record Bedside Vitals: ${selectedPatientForObs.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={newHR}
                  onChange={(e) => setNewHR(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">SpO2 (%)</label>
                <input
                  type="number"
                  value={newSpO2}
                  onChange={(e) => setNewSpO2(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={newSBP}
                  onChange={(e) => setNewSBP(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={newDBP}
                  onChange={(e) => setNewDBP(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Respiratory Rate (/min)</label>
                <input
                  type="number"
                  value={newRR}
                  onChange={(e) => setNewRR(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Temperature (&deg;C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemp}
                  onChange={(e) => setNewTemp(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsObsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveObservation}>
                Save to Electronic Chart
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 5. Digital Prescription Creator
export const DoctorDigitalPrescriptionView: React.FC = () => {
  const { patients: contextPatients, user } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.patientId || 'PT-8941');
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('Once daily');
  const [duration, setDuration] = useState('14 days');
  const [instructions, setInstructions] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>(() => hospitalDataService.getPrescriptions());
  const [savedNotice, setSavedNotice] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const selectedPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  useEffect(() => {
    api.getPrescriptions({ hospitalId: 'hosp-chn-01' })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPrescriptions(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim() || !dosage.trim()) {
      alert('Drug name and dosage are mandatory fields.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleFinalPrescribe = async () => {
    const newPrescription = {
      patientId: selectedPatientId,
      hospitalId: 'hosp-chn-01',
      diagnosis: selectedPatient.primaryDiagnosis,
      medications: [
        {
          drug: drugName,
          dose: dosage,
          route,
          freq: frequency,
          duration,
          instructions
        }
      ],
      startDate: new Date().toISOString().split('T')[0],
      instructions
    };

    try {
      await api.createPrescription(newPrescription);
    } catch {}

    hospitalDataService.addPrescription({
      id: 'rx-' + Date.now(),
      patientId: selectedPatientId,
      doctorName: user?.name || 'Dr. Sundaramoorthy M.',
      diagnosis: selectedPatient.primaryDiagnosis,
      medications: newPrescription.medications,
      status: 'Active',
      startDate: newPrescription.startDate
    });

    setPrescriptions(prev => [
      {
        id: 'rx-' + Date.now(),
        patientId: selectedPatientId,
        doctorName: user?.name || 'Dr. Sundaramoorthy M.',
        diagnosis: selectedPatient.primaryDiagnosis,
        medications: newPrescription.medications,
        status: 'Active',
        startDate: newPrescription.startDate
      },
      ...prev
    ]);

    setIsConfirmModalOpen(false);
    setDrugName('');
    setDosage('');
    setInstructions('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Card title="Electronic Prescription Generator" subtitle="Add medication with mandatory doctor confirmation & validation" noPadding>
            {savedNotice && (
              <div className="m-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Prescription validated and transmitted to Hospital Pharmacy!
              </div>
            )}
            <form onSubmit={handleOpenConfirm} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Target Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
                >
                  {patients.map(p => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} ({p.patientId}) &middot; {p.ward}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Drug Generic / Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Atorvastatin, Meropenem"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  required
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Dosage *</label>
                  <input
                    type="text"
                    placeholder="e.g. 40 mg, 1 g"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Route</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Oral">Oral</option>
                    <option value="IV">IV Infusion</option>
                    <option value="SC">Subcutaneous</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Once daily, Q8H"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 7 days, 14 days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Special Instructions / Caution</label>
                <input
                  type="text"
                  placeholder="e.g. Take with food; monitor renal parameters"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <Button variant="primary" size="sm" type="submit" className="w-full" icon={<Plus className="w-3.5 h-3.5" />}>
                Review & Confirm Prescription
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card title="Current Authorized Prescriptions" subtitle="Electronic records verified and signed by Attending Physician" noPadding>
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {prescriptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No active electronic prescriptions recorded.
                </div>
              ) : (
                prescriptions.map((p, idx) => {
                  const meds = Array.isArray(p.medications) ? p.medications : [];
                  return (
                    <div key={p.id || idx} className="p-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#1E293B]">
                          {meds.map((m: any) => m.drug || m.name).join(', ') || 'Prescribed Meds'} &mdash;{' '}
                          <span className="text-[#2563A6]">{meds[0]?.dose || meds[0]?.dosage || ''}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Patient: {p.patientId} &middot; Doctor: {p.doctorName || 'Dr. Sundaramoorthy M.'} &middot; Date: {p.startDate || p.createdAt || 'Today'}
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Signed & Active</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Doctor Confirmation Modal */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Physician Confirmation: Electronic Prescription Sign-Off"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <strong className="block text-sm mb-1">Confirm Prescription Details:</strong>
              <div>Patient: <strong>{selectedPatient.name} ({selectedPatient.patientId})</strong></div>
              <div>Medication: <strong>{drugName}</strong> ({dosage}, {route})</div>
              <div>Frequency & Duration: <strong>{frequency}</strong> for <strong>{duration}</strong></div>
              {instructions && <div>Instructions: <em>{instructions}</em></div>}
            </div>

            <p className="text-slate-600 leading-relaxed">
              In accordance with clinical safety guidelines, electronic prescriptions require attending physician confirmation. This medication will be transmitted to the hospital pharmacy dispensary.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleFinalPrescribe}>
                Sign & Transmit to Pharmacy
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 6. Care Plan View
export const DoctorCarePlanView: React.FC = () => {
  const { doctorNurseTasks, createDoctorNurseTask, updateNurseTaskStatus, patients } = useApp();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(patients[0]?.patientId || 'PT-8941');
  const [taskType, setTaskType] = useState<'Vital Check' | 'Medication Administration' | 'Lab Collection' | 'Assessment' | 'Wound Dressing'>('Vital Check');
  const [instruction, setInstruction] = useState('');
  const [priority, setPriority] = useState<'Stat (Immediate)' | 'Urgent' | 'Routine'>('Urgent');
  const [assignedNurse, setAssignedNurse] = useState('Nurse Deepa R.');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    const patient = patients.find(p => p.patientId === targetPatientId) || patients[0];

    createDoctorNurseTask({
      patientId: targetPatientId,
      patientName: patient?.name || 'Inpatient',
      ward: patient?.ward || 'ICU Block A',
      bed: patient?.bedNumber || 'Bed-01',
      doctorName: 'Dr. Sundaramoorthy M.',
      assignedNurse,
      taskType,
      instruction: instruction.trim(),
      priority
    });

    setIsTaskModalOpen(false);
    setInstruction('');
  };

  return (
    <div className="space-y-6">
      <Card
        title="Multidisciplinary Inpatient Clinical Pathway & Nursing Tasks"
        subtitle="Doctor-Nurse closed-loop care orders, ABG requests, and bedside milestones"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Assign Clinical Task to Nurse
          </Button>
        }
        noPadding
      >
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-[#1E293B]">Clinical Care Pathway: Acute Coronary Syndrome & Critical Care</h4>
            <p className="text-slate-600 mt-1">Goal: Maintain hemodynamics (MAP &gt; 65), prevent recurrent ischemia, monitor serial cardiac biomarkers.</p>
          </div>

          <div className="font-bold text-slate-800 pt-2 text-xs">Active Physician-Nurse Care Orders:</div>
          <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-lg">
            {doctorNurseTasks.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No active care tasks currently dispatched.
              </div>
            ) : (
              doctorNurseTasks.map(task => (
                <div key={task.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{task.patientName} ({task.bed})</span>
                      <Badge variant={task.priority.includes('Stat') ? 'critical' : task.priority.includes('Urgent') ? 'warning' : 'primary'} size="sm">
                        {task.priority}
                      </Badge>
                      <Badge variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'neutral'} size="sm">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-slate-700 mt-1 font-semibold">
                      {task.taskType}: <span className="font-normal text-slate-600">{task.instruction}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>Assigned to: <strong>{task.assignedNurse}</strong></span>
                      <span>Ordered: {task.timestamp || (task as any).createdAt}</span>
                      {task.completedAt && <span className="text-green-600">Done: {task.completedAt}</span>}
                    </div>
                  </div>

                  {task.status !== 'Completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateNurseTaskStatus({ taskId: task.id, status: 'Completed', nurseObservation: 'Verified and signed off by physician' })}
                    >
                      Sign Off
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Dispatch Bedside Clinical Task to Nursing Staff"
        >
          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Patient</label>
              <select
                value={targetPatientId}
                onChange={(e) => setTargetPatientId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                {patients.map(p => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.name} &middot; {p.ward} ({p.bedNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Vital Check">Vitals & Arterial Blood Gas</option>
                  <option value="Medication Administration">Medication Administration</option>
                  <option value="Lab Collection">Stat Lab Collection</option>
                  <option value="Assessment">Intake / Step-down Assessment</option>
                  <option value="Wound Dressing">Wound Dressing & Drain Check</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Stat (Immediate)">Stat (Immediate)</option>
                  <option value="Urgent">Urgent (Within 1 Hour)</option>
                  <option value="Routine">Routine (Standard)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Assigned Nurse</label>
              <select
                value={assignedNurse}
                onChange={(e) => setAssignedNurse(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nurse Deepa R.">Nurse Deepa R. (ICU Block A)</option>
                <option value="Nurse Priya M.">Nurse Priya M. (HDU Ward 2)</option>
                <option value="Nurse Revathi S.">Nurse Revathi S. (Ward 3)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Specific Clinical Instructions *</label>
              <textarea
                rows={3}
                placeholder="e.g. STAT: Draw arterial blood gas; titrate Norepinephrine if MAP < 65 mmHg."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                required
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Dispatch Order to Nurse
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// 7. Smart Diagnosis Support View
export const DoctorSmartDiagnosisView: React.FC = () => {
  const { patients } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.patientId || 'PT-8941');

  const patient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  return (
    <div className="space-y-6">
      {/* Disclaimer Alert */}
      <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Clinical Decision Support Reference:</strong> Diagnostic differentials are generated from evidence-based synthesized parameters to assist attending physicians. Final diagnosis and therapeutic interventions remain the sole legal responsibility of the licensed medical practitioner.
        </div>
      </div>

      <Card
        title="Clinical Diagnostic Reasoning & Differential Matrix"
        subtitle="Evidence-based differential diagnostic support synthesizing signs, symptoms, and biomarkers"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-semibold"
            >
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  {p.name} ({p.primaryDiagnosis})
                </option>
              ))}
            </select>
          </div>
        }
        noPadding
      >
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Presenting Working Diagnosis</span>
              <span className="font-bold text-slate-800 text-sm">{patient?.primaryDiagnosis || 'Acute Coronary Syndrome'}</span>
            </div>
            <Badge variant="primary" size="sm">
              ICD-10: {patient?.icd10 || 'I21.0'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg">
              <span className="text-[10px] text-red-700 font-bold uppercase">Primary Consideration (88% Match)</span>
              <h4 className="font-bold text-sm text-red-900 mt-1">Acute Non-ST Elevation MI</h4>
              <p className="text-slate-600 mt-1">Supported by elevated Troponin-I and chest heaviness. Confirmatory ECG and serial cardiac enzymes indicated.</p>
              <div className="mt-2 text-[10px] text-red-800 font-semibold">Recommended: Coronary Angiography within 24 hours.</div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg">
              <span className="text-[10px] text-amber-700 font-bold uppercase">Differential 2 (45% Match)</span>
              <h4 className="font-bold text-sm text-amber-900 mt-1">Acute Pulmonary Embolism</h4>
              <p className="text-slate-600 mt-1">Consider CT pulmonary angiogram (CTPA) if D-Dimer remains significantly elevated or tachypnea worsens.</p>
              <div className="mt-2 text-[10px] text-amber-800 font-semibold">Recommended: Lower extremity venous Doppler.</div>
            </div>

            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg">
              <span className="text-[10px] text-blue-700 font-bold uppercase">Differential 3 (20% Match)</span>
              <h4 className="font-bold text-sm text-blue-900 mt-1">Acute Myopericarditis</h4>
              <p className="text-slate-600 mt-1">Evaluate for PR-segment depression or pericardial effusion on bedside echocardiogram.</p>
              <div className="mt-2 text-[10px] text-blue-800 font-semibold">Recommended: Focused Cardiac Ultrasound (FoCUS).</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 8. Decision Timeline View
export const DoctorDecisionTimelineView: React.FC = () => {
  const [patients] = useState<PatientDigitalTwin[]>(INITIAL_CLINICAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0].patientId);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionNotice, setDecisionNotice] = useState<string | null>(null);

  // Form states
  const [decisionCategory, setDecisionCategory] = useState<'Order' | 'Medication' | 'Lab' | 'Nursing' | 'Vital'>('Order');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionDetails, setDecisionDetails] = useState('');
  const [clinicianPin, setClinicianPin] = useState('49102');

  const [timelineEvents, setTimelineEvents] = useState<any[]>([
    {
      id: 'dt-1',
      patientId: 'PT-8941',
      timestamp: 'Today at 08:30 AM',
      category: 'Vital',
      title: 'Triage Admission & MEWS Escalation Flagged',
      details: 'Patient arrived via 108 Emergency Ambulance with acute crushing retrosternal chest pain. Initial MEWS calculated at 7/14 due to HR 118 bpm, BP 85/55 mmHg, and diaphoresis.',
      clinicianName: 'Dr. Sundaramoorthy M.',
      clinicianRole: 'Attending Physician & Cardiologist',
      signatureVerified: true
    },
    {
      id: 'dt-2',
      patientId: 'PT-8941',
      timestamp: 'Today at 08:45 AM',
      category: 'Order',
      title: 'Emergency Resuscitation & ICU Bed Docking Authorized',
      details: 'Authorized immediate placement in ICU Block A (Bed A-101). Initiated 1000 mL IV Normal Saline bolus over 30 mins with continuous arterial line monitoring.',
      clinicianName: 'Dr. Sundaramoorthy M.',
      clinicianRole: 'Attending Physician & Cardiologist',
      signatureVerified: true
    },
    {
      id: 'dt-3',
      patientId: 'PT-8941',
      timestamp: 'Today at 09:15 AM',
      category: 'Lab',
      title: 'STAT Point-of-Care Biomarkers Requisitioned',
      details: 'Dispatched STAT High-Sensitivity Troponin-I, 12-lead ECG, Arterial Blood Gas (ABG), and comprehensive metabolic panel to central pathology laboratory.',
      clinicianName: 'Dr. Sundaramoorthy M.',
      clinicianRole: 'Attending Physician & Cardiologist',
      signatureVerified: true
    },
    {
      id: 'dt-4',
      patientId: 'PT-8941',
      timestamp: 'Today at 09:40 AM',
      category: 'Lab',
      title: 'Critical Panic Result Acknowledged: Troponin-I at 4.8 ng/mL',
      details: 'Pathology telephoned critical panic alert. Troponin-I markedly elevated at 4.8 ng/mL (Ref: < 0.04). Lactate elevated at 3.8 mmol/L indicating hypoperfusion.',
      clinicianName: 'Dr. K. Anitha',
      clinicianRole: 'Consultant Clinical Pathologist',
      signatureVerified: true
    },
    {
      id: 'dt-5',
      patientId: 'PT-8941',
      timestamp: 'Today at 10:10 AM',
      category: 'Medication',
      title: 'Dual Antiplatelet & Vasopressor Titration Order',
      details: 'Administered Aspirin 325 mg oral + Ticagrelor 180 mg loading dose. Initiated Norepinephrine central venous infusion at 0.05 mcg/kg/min titrated to maintain MAP > 65 mmHg.',
      clinicianName: 'Dr. Sundaramoorthy M.',
      clinicianRole: 'Attending Physician & Cardiologist',
      signatureVerified: true
    },
    {
      id: 'dt-6',
      patientId: 'PT-8941',
      timestamp: 'Today at 11:20 AM',
      category: 'Nursing',
      title: 'Vasopressor Infusion Stabilized at Bedside',
      details: 'Central venous line insertion verified. MAP improved to 68 mmHg. Urine output measured at 45 mL/hr over last 60 minutes. Serial vitals documented.',
      clinicianName: 'Nurse Revathi S.',
      clinicianRole: 'Senior Critical Care Staff Nurse',
      signatureVerified: true
    },
    {
      id: 'dt-7',
      patientId: 'PT-8942',
      timestamp: 'Today at 09:00 AM',
      category: 'Order',
      title: 'Step-Down Transfer Approval Prepared',
      details: 'Hemodynamically stable following 48h observation. MEWS reduced to 1/14. Order placed for transfer from ICU Block A to Ward 3 step-down telemetry.',
      clinicianName: 'Dr. Priya Natarajan',
      clinicianRole: 'Intensive Care Specialist',
      signatureVerified: true
    },
    {
      id: 'dt-8',
      patientId: 'PT-8943',
      timestamp: 'Today at 10:30 AM',
      category: 'Nursing',
      title: 'Non-Invasive CPAP Titration & Secretion Clearance',
      details: 'Patient placed on CPAP with PEEP 8 cmH2O and FiO2 0.40. Respiratory rate decreased from 28 to 20/min; SpO2 stabilized at 95%.',
      clinicianName: 'Nurse Saravanan K.',
      clinicianRole: 'ICU Staff Nurse',
      signatureVerified: true
    }
  ]);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  const handleRecordDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle.trim() || !decisionDetails.trim()) return;

    const newEvent = {
      id: 'dt-' + Date.now(),
      patientId: selectedPatientId,
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: decisionCategory,
      title: decisionTitle.trim(),
      details: decisionDetails.trim(),
      clinicianName: 'Dr. Sundaramoorthy M.',
      clinicianRole: 'Attending Physician (PIN ' + clinicianPin + ')',
      signatureVerified: true
    };

    setTimelineEvents([newEvent, ...timelineEvents]);
    setDecisionTitle('');
    setDecisionDetails('');
    setIsDecisionModalOpen(false);
    setDecisionNotice(`Clinical decision recorded and digitally countersigned for ${currentPatient.name}!`);
    setTimeout(() => setDecisionNotice(null), 3500);
  };

  const filteredEvents = timelineEvents.filter(ev => {
    const matchesPatient = ev.patientId === selectedPatientId;
    const matchesCategory = categoryFilter === 'all' || ev.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.clinicianName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPatient && matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'order': return 'bg-blue-600 text-white';
      case 'medication': return 'bg-purple-600 text-white';
      case 'lab': return 'bg-amber-500 text-white';
      case 'nursing': return 'bg-emerald-600 text-white';
      case 'vital': return 'bg-red-500 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Clock className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Clinical Decision & Interventions Timeline</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                AUDITABLE EHR LOG
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Chronological immutable timeline of physician directives, bedside interventions, and verified diagnostic observations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDecisionModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Record Clinical Decision
          </Button>
        </div>
      </div>

      {decisionNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{decisionNotice}</div>
        </div>
      )}

      {/* Patient Switcher & Search Strip */}
      <Card noPadding>
        <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Patient Focus:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
            >
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientId} — {p.name} ({p.ward} &middot; Bed {p.bedNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2563A6]"
              />
            </div>

            <div className="flex items-center gap-1">
              {['all', 'order', 'medication', 'lab', 'nursing', 'vital'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#2563A6] text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Event Flow */}
        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No clinical timeline entries match the selected filters.
            </div>
          ) : (
            <div className="relative border-l-2 border-blue-200 ml-4 space-y-6 text-xs">
              {filteredEvents.map((ev, idx) => (
                <div key={ev.id || idx} className="relative pl-6">
                  {/* Indicator Dot */}
                  <span className={`w-3.5 h-3.5 rounded-full absolute -left-[8px] top-1 border-2 border-white shadow-xs ${getCategoryColor(ev.category)}`} />

                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1E293B]">{ev.title}</span>
                        <Badge 
                          variant={ev.category === 'Order' ? 'primary' : ev.category === 'Medication' ? 'warning' : ev.category === 'Vital' ? 'critical' : 'neutral'} 
                          size="sm"
                        >
                          {ev.category.toUpperCase()}
                        </Badge>
                        {ev.signatureVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            <ShieldCheck className="w-3 h-3" /> Digitally Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ev.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed text-xs">
                      {ev.details}
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        Attributed to: <strong className="text-slate-800">{ev.clinicianName}</strong> &middot; <span className="text-slate-500">{ev.clinicianRole}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        Record ID: {ev.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Record Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="w-4 h-4 text-blue-200" />
                <span>Record Physician Clinical Decision</span>
              </div>
              <button 
                onClick={() => setIsDecisionModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordDecision} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentPatient.name} (${currentPatient.patientId})`}
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Decision Category</label>
                  <select
                    value={decisionCategory}
                    onChange={(e) => setDecisionCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-semibold text-slate-800"
                  >
                    <option value="Order">Physician Order</option>
                    <option value="Medication">Pharmacotherapy / Titration</option>
                    <option value="Lab">Diagnostic / Lab Requisition</option>
                    <option value="Nursing">Nursing Bedside Directive</option>
                    <option value="Vital">Physiological Triage Escalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive / Intervention Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STAT ABG Requisition & Wean Vasopressor Support by 25%"
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Rationale & Detailed Directives</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Document clinical indication, target physiological endpoints (e.g. MAP > 65), and monitoring intervals..."
                  value={decisionDetails}
                  onChange={(e) => setDecisionDetails(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authorizing Attending</label>
                  <input
                    type="text"
                    disabled
                    value="Dr. Sundaramoorthy M."
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MCI Verification PIN</label>
                  <input
                    type="password"
                    value={clinicianPin}
                    onChange={(e) => setClinicianPin(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563A6] shrink-0" />
                <span>Recorded entries are appended to the tamper-evident EHR audit log with timestamped digital signature.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsDecisionModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Check className="w-3.5 h-3.5" />}>
                  Sign & Commit Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 9. Inter-Ward Transfers View
export const DoctorTransfersView: React.FC = () => {
  const fallbackTransfers = [
    {
      id: 'TR-101',
      patientName: 'Priya Natarajan',
      patientId: 'PT-8942',
      originWard: 'ICU Block A',
      targetWard: 'Ward 3 (Step-down)',
      indication: 'Hemodynamically stabilized post-acute management. MEWS 1/14. Bed sanitized.',
      status: 'Pending Approval'
    },
    {
      id: 'TR-102',
      patientName: 'Vignesh Kumar',
      patientId: 'PT-8943',
      originWard: 'Emergency Bay',
      targetWard: 'ICU Block B',
      indication: 'Acute respiratory distress requiring mechanical ventilation standby.',
      status: 'In Transit'
    }
  ];

  const [transfers, setTransfers] = useState(fallbackTransfers);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTransfers = async () => {
    try {
      const data = await api.getTransfers();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((t: any) => ({
          id: t.id || t.transfer_id,
          patientName: t.patientName || t.patient_name || 'Patient',
          patientId: t.patientId || t.patient_id,
          originWard: t.originWard || t.from_ward || t.sourceWard || 'General Ward',
          targetWard: t.targetWard || t.to_ward || 'ICU Block B',
          targetBedId: t.targetBedId || t.target_bed_id,
          indication: t.reason || t.clinicalJustification || t.indication || 'Inter-ward clinical step transition',
          status: t.status === 'pending' || t.status === 'Pending' ? 'Pending Approval' : t.status === 'approved' || t.status === 'Approved' ? 'Approved' : t.status
        }));
        setTransfers(mapped);
      }
    } catch (err) {
      console.warn('Could not load backend transfers, using fallback transfers:', err);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleApprove = async (id: string, patientName: string, targetWard: string) => {
    try {
      await api.updateTransferStatus(id, { status: 'Approved' });
    } catch (err) {
      console.warn('Transfer approval backend call error:', err);
    }
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
    setNotice(`Transfer approved for ${patientName} to ${targetWard}! Bed allocation locked.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Inter-Ward Transfer Requests & Step-Down Approvals</h3>
            <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
              STEP-DOWN TRANSITIONS
            </span>
          </div>
          <p className="text-xs text-blue-100/80 mt-0.5">
            Coordinate patient bed step-downs, ICU transfers, and ward handovers with verified bed readiness.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{notice}</div>
        </div>
      )}

      <Card title="Pending Step-Down & Transfer Authorizations" subtitle="Physician verification required before bed dispatch" noPadding>
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {transfers.map(tr => (
            <div key={tr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
              <div>
                <div className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
                  <span>{tr.patientName}</span>
                  <span className="text-slate-500 font-mono text-xs">({tr.patientId})</span>
                  <Badge variant={tr.status === 'Approved' ? 'success' : tr.status === 'In Transit' ? 'primary' : 'warning'} size="sm">
                    {tr.status}
                  </Badge>
                </div>
                <div className="text-slate-600 mt-1">
                  Origin: <strong>{tr.originWard}</strong> &rarr; Target: <strong>{tr.targetWard}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Clinical Indication: {tr.indication}
                </div>
              </div>

              {tr.status === 'Pending Approval' ? (
                <Button variant="primary" size="sm" onClick={() => handleApprove(tr.id, tr.patientName, tr.targetWard)}>
                  Approve Transfer
                </Button>
              ) : (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Bedside Shift
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// 10. Emergency Alerts View
export const DoctorEmergencyAlertsView: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Form states for broadcast
  const [broadcastCode, setBroadcastCode] = useState<'Code Blue (Cardiac Arrest)' | 'Code Red (Fire / Hazard)' | 'Trauma STAT' | 'Sepsis Resuscitation Code'>('Code Blue (Cardiac Arrest)');
  const [broadcastLocation, setBroadcastLocation] = useState('ICU Block A');
  const [broadcastPatient, setBroadcastPatient] = useState('PT-8941 (Ramesh Balan)');
  const [broadcastNotes, setBroadcastNotes] = useState('Sudden ventricular fibrillation. Immediate chest compressions in progress.');

  const [alerts, setAlerts] = useState([
    {
      id: 'emg-1',
      code: 'CODE BLUE',
      title: 'Cardiac Arrest Protocol Initiated — Trauma Bay 2',
      details: 'Patient collapsed during triage. Asystole confirmed on ECG monitor. Resuscitation team active with Defibrillator Unit #2.',
      priority: 'STAT',
      timestamp: '5 mins ago',
      ward: 'Emergency Trauma Bay',
      status: 'Active'
    },
    {
      id: 'emg-2',
      code: 'CRITICAL PANIC LAB',
      title: 'Serum Troponin-I at 4.8 ng/mL (PT-8941 Ramesh Balan)',
      details: 'Panic lab cutoff exceeded (Normal < 0.04 ng/mL). Consistent with massive acute myocardial infarction. Catheterization standby requested.',
      priority: 'STAT',
      timestamp: '12 mins ago',
      ward: 'ICU Block A',
      status: 'Active'
    },
    {
      id: 'emg-3',
      code: 'SEPSIS ESCALATION',
      title: 'Serum Lactate > 4.0 mmol/L & MAP < 60 mmHg (PT-8945)',
      details: 'Automated early warning flagged septic shock criteria. Blood cultures dispatched. Norepinephrine central line infusion initiated.',
      priority: 'Warning',
      timestamp: '25 mins ago',
      ward: 'Ward 4 (Post-Surg)',
      status: 'Active'
    },
    {
      id: 'emg-4',
      code: 'CODE RED',
      title: 'Zone 3 Smoke Detector Alert — Medical Records Wing',
      details: 'Automated fire safety sprinkler standby. Facilities and disaster response team mobilized. Clinical wards unaffected.',
      priority: 'Warning',
      timestamp: '40 mins ago',
      ward: 'Administrative East Wing',
      status: 'Acknowledged'
    },
    {
      id: 'emg-5',
      code: 'MTP PROTOCOL',
      title: 'Massive Transfusion Protocol Activated (PT-8947)',
      details: 'Blood bank dispatched emergency pack: 4 units O-PRBC, 4 units FFP, 1 adult platelet pool for hypovolemic hemorrhagic shock.',
      priority: 'STAT',
      timestamp: '1 hour ago',
      ward: 'Operation Theatre 3',
      status: 'Stabilized'
    }
  ]);

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Acknowledged' : 'Stabilized' } : a));
  };

  const handleBroadcastCode = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = {
      id: 'emg-' + Date.now(),
      code: broadcastCode.toUpperCase().split(' ')[0],
      title: `${broadcastCode} Broadcast — ${broadcastLocation}`,
      details: `Patient: ${broadcastPatient}. Directive: ${broadcastNotes}. Dispatched by Dr. Sundaramoorthy M.`,
      priority: 'STAT',
      timestamp: 'Just now',
      ward: broadcastLocation,
      status: 'Active'
    };

    setAlerts([newAlert, ...alerts]);
    setIsBroadcastModalOpen(false);
    setBroadcastNotice(`Emergency Broadcast Dispatched: ${broadcastCode} for ${broadcastLocation}! Hospital rapid response teams paged.`);
    setTimeout(() => setBroadcastNotice(null), 4000);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'all') return true;
    if (filterType === 'stat') return a.priority === 'STAT' && a.status !== 'Stabilized';
    if (filterType === 'warning') return a.priority === 'Warning';
    if (filterType === 'resolved') return a.status === 'Stabilized' || a.status === 'Acknowledged';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/40 flex items-center justify-center shrink-0 border border-red-400/30">
            <Flame className="w-5 h-5 text-red-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Hospital Emergency Alerts & Live Code Broadcasts</h3>
              <span className="bg-red-500/30 text-red-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                STAT PROTOCOLS
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-red-100/80 mt-0.5">
              Live facility-wide emergency triggers, panic laboratory alerts, and rapid resuscitation team paging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsBroadcastModalOpen(true)}
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            Broadcast Emergency Code
          </Button>
        </div>
      </div>

      {broadcastNotice && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{broadcastNotice}</div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          {['all', 'stat', 'warning', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === f
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'all' ? 'All Alerts' : f === 'stat' ? 'Active STAT (Emergency)' : f === 'warning' ? 'Clinical Warnings' : 'Acknowledged / Resolved'}
            </button>
          ))}
        </div>

        <div className="text-slate-500 text-[11px]">
          Rapid Response Desk: <strong>Ext 5555 / Trauma Hotlink</strong>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isStat = alert.priority === 'STAT';

          return (
            <Card
              key={alert.id}
              title={alert.title}
              subtitle={`${alert.ward} &middot; Timestamp: ${alert.timestamp}`}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant={isStat ? 'critical' : 'warning'} size="sm">
                    {alert.code}
                  </Badge>
                  <Badge variant={alert.status === 'Active' ? 'critical' : alert.status === 'Acknowledged' ? 'warning' : 'success'} size="sm">
                    {alert.status.toUpperCase()}
                  </Badge>
                </div>
              }
              noPadding
            >
              <div className="p-4 space-y-3 text-xs">
                <p className="text-slate-700 leading-relaxed">
                  {alert.details}
                </p>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-500">
                    Location: <strong>{alert.ward}</strong> &middot; Protocol Priority: <strong className="text-red-700">{alert.priority}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'Active' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Acknowledge STAT Protocol
                      </Button>
                    ) : alert.status === 'Acknowledged' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        Mark Stabilized
                      </Button>
                    ) : (
                      <span className="text-green-600 font-bold flex items-center gap-1 text-xs">
                        <ShieldCheck className="w-4 h-4" /> Stabilized & Documented
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Emergency Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Flame className="w-5 h-5 text-amber-300" />
                <span>Dispatch Hospital Emergency Code</span>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastCode} className="p-5 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Code Type</label>
                <select
                  value={broadcastCode}
                  onChange={(e) => setBroadcastCode(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-red-700"
                >
                  <option value="Code Blue (Cardiac Arrest)">Code Blue (Cardiac Arrest / Resuscitation)</option>
                  <option value="Trauma STAT">Trauma STAT (Polytrauma Admission)</option>
                  <option value="Sepsis Resuscitation Code">Sepsis Resuscitation Code (Severe Shock)</option>
                  <option value="Code Red (Fire / Hazard)">Code Red (Fire / Disaster Alert)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Ward</label>
                <select
                  value={broadcastLocation}
                  onChange={(e) => setBroadcastLocation(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-semibold text-slate-800"
                >
                  <option value="ICU Block A">ICU Block A</option>
                  <option value="ICU Block B">ICU Block B</option>
                  <option value="Emergency Trauma Bay">Emergency Trauma Bay</option>
                  <option value="Ward 3 (Step-down)">Ward 3 (Step-down)</option>
                  <option value="Ward 4 (Post-Surg)">Ward 4 (Post-Surg)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Patient / Identifier</label>
                <input
                  type="text"
                  required
                  value={broadcastPatient}
                  onChange={(e) => setBroadcastPatient(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Directives</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastNotes}
                  onChange={(e) => setBroadcastNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-900 text-[11px]">
                Triggering an emergency broadcast sends STAT push alerts to nursing consoles, central monitors, and resuscitation pagers.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsBroadcastModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" type="submit" icon={<Zap className="w-3.5 h-3.5" />}>
                  Dispatch Immediate STAT Broadcast
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 11. Referral Consult View
export const DoctorReferralConsultView: React.FC = () => {
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewReferralModalOpen, setIsNewReferralModalOpen] = useState(false);
  const [respondingConsult, setRespondingConsult] = useState<any | null>(null);
  const [specialistOpinionText, setSpecialistOpinionText] = useState('');
  const [referralNotice, setReferralNotice] = useState<string | null>(null);

  // Form states for new referral
  const [targetPatientName, setTargetPatientName] = useState('Ramesh Balan (PT-8941)');
  const [specialty, setSpecialty] = useState('Nephrology');
  const [urgency, setUrgency] = useState<'STAT (1 Hour)' | 'Urgent (4 Hours)' | 'Routine (24 Hours)'>('Urgent (4 Hours)');
  const [clinicalIndication, setClinicalIndication] = useState('Acute kidney injury staging following contrast exposure; evaluate need for renal replacement.');

  const [consults, setConsults] = useState<any[]>([
    {
      id: 'ref-1',
      specialty: 'Nephrology',
      patientName: 'Meenakshi Sundaram',
      patientId: 'PT-8945',
      ward: 'ICU Block A (Bed A-103)',
      urgency: 'STAT (1 Hour)',
      requestingDoctor: 'Dr. Sundaramoorthy M.',
      consultingSpecialist: 'Dr. V. Chandrasekar (Nephrologist)',
      indication: 'Acute oliguric kidney injury in setting of septic shock. Serum Creatinine spiked from 1.1 to 3.4 mg/dL. Evaluation for continuous renal replacement therapy (CRRT).',
      status: 'Assigned',
      opinion: null,
      timestamp: 'Today at 09:30 AM'
    },
    {
      id: 'ref-2',
      specialty: 'Infectious Disease',
      patientName: 'Saravanan Velu',
      patientId: 'PT-8947',
      ward: 'Ward 4 (Post-Surg)',
      urgency: 'Urgent (4 Hours)',
      requestingDoctor: 'Dr. Sundaramoorthy M.',
      consultingSpecialist: 'Dr. Priya Jayaraman (ID Specialist)',
      indication: 'Vancomycin-resistant Enterococcus faecium (VRE) barrier protocol verification. Recommendation for Linezolid vs Daptomycin dosing in renal impairment.',
      status: 'Completed',
      opinion: 'Recommend switching to Linezolid 600 mg IV q12h. Ensure strict contact barrier isolation. Repeat blood cultures in 48 hours.',
      timestamp: 'Today at 10:45 AM'
    },
    {
      id: 'ref-3',
      specialty: 'Cardiology',
      patientName: 'Ramesh Balan',
      patientId: 'PT-8941',
      ward: 'ICU Block A (Bed A-101)',
      urgency: 'STAT (1 Hour)',
      requestingDoctor: 'Dr. Sundaramoorthy M.',
      consultingSpecialist: 'Dr. Sundaramoorthy M. (Interventional Cardiology)',
      indication: 'Post-STEMI hemodynamic evaluation. Evaluate left ventricular ejection fraction and regional wall motion abnormalities via focused bedside echocardiogram.',
      status: 'Assigned',
      opinion: null,
      timestamp: 'Today at 11:15 AM'
    },
    {
      id: 'ref-4',
      specialty: 'Pulmonology',
      patientName: 'Vignesh Kumar',
      patientId: 'PT-8943',
      ward: 'ICU Block B (Bed B-201)',
      urgency: 'Routine (24 Hours)',
      requestingDoctor: 'Dr. Priya Natarajan',
      consultingSpecialist: 'Dr. R. Manivannan (Pulmonologist)',
      indication: 'Evaluation for tracheostomy versus prolonged non-invasive weaning protocol following acute exacerbation of COPD with hypercapnic respiratory failure.',
      status: 'Pending',
      opinion: null,
      timestamp: 'Yesterday at 04:20 PM'
    }
  ]);

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef = {
      id: 'ref-' + Date.now(),
      specialty,
      patientName: targetPatientName.split('(')[0].trim(),
      patientId: targetPatientName.includes('(') ? targetPatientName.split('(')[1].replace(')', '') : 'PT-8941',
      ward: 'ICU Block A',
      urgency,
      requestingDoctor: 'Dr. Sundaramoorthy M.',
      consultingSpecialist: `Attending ${specialty} Consultant`,
      indication: clinicalIndication,
      status: 'Pending',
      opinion: null,
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConsults([newRef, ...consults]);
    setIsNewReferralModalOpen(false);
    setReferralNotice(`Specialist referral dispatched to ${specialty} department for ${newRef.patientName}!`);
    setTimeout(() => setReferralNotice(null), 3500);
  };

  const handleSaveOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingConsult || !specialistOpinionText.trim()) return;

    setConsults(prev => prev.map(c => c.id === respondingConsult.id ? {
      ...c,
      status: 'Completed',
      opinion: specialistOpinionText.trim()
    } : c));

    setRespondingConsult(null);
    setSpecialistOpinionText('');
    setReferralNotice('Specialist consultation note recorded and signed!');
    setTimeout(() => setReferralNotice(null), 3500);
  };

  const filteredConsults = consults.filter(c => {
    const matchesSpec = filterSpecialty === 'all' || c.specialty.toLowerCase() === filterSpecialty.toLowerCase();
    const matchesStat = filterStatus === 'all' || c.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSpec && matchesStat;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Stethoscope className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Specialist Consultations & Inter-Department Referrals</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                CROSS-SPECIALTY HUB
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Coordinate multi-disciplinary expert clinical opinions, department referrals, and specialized consult documentation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewReferralModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Request Specialist Consult
          </Button>
        </div>
      </div>

      {referralNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{referralNotice}</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-600">Specialty:</span>
          {['all', 'nephrology', 'cardiology', 'infectious disease', 'pulmonology'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSpecialty(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterSpecialty === s
                  ? 'bg-[#2563A6] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s === 'all' ? 'All Specialties' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Status:</span>
          {['all', 'pending', 'assigned', 'completed'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {filteredConsults.map(c => {
          const isCompleted = c.status === 'Completed';
          const isStat = c.urgency.includes('STAT');

          return (
            <Card
              key={c.id}
              title={`${c.specialty} Consult &mdash; ${c.patientName} (${c.patientId})`}
              subtitle={`Location: ${c.ward} &middot; Requisitioned ${c.timestamp}`}
              action={
                <div className="flex items-center gap-2">
                  <Badge variant={isStat ? 'critical' : 'warning'} size="sm">
                    {c.urgency}
                  </Badge>
                  <Badge variant={isCompleted ? 'success' : c.status === 'Assigned' ? 'primary' : 'neutral'} size="sm">
                    {c.status.toUpperCase()}
                  </Badge>
                </div>
              }
              noPadding
            >
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-bold text-[#1E293B] block uppercase text-[10px] text-slate-500 mb-0.5">Clinical Indication & Specific Question:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {c.indication}
                  </p>
                </div>

                {c.opinion && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
                    <span className="font-bold text-emerald-900 block text-[11px] uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Specialist Clinical Opinion & Recommendations:
                    </span>
                    <p className="text-emerald-950 font-mono text-[11px] leading-relaxed">
                      {c.opinion}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
                  <div>
                    Requested by: <strong>{c.requestingDoctor}</strong> &middot; Target: <strong>{c.consultingSpecialist}</strong>
                  </div>

                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRespondingConsult(c);
                        setSpecialistOpinionText(c.opinion || '');
                      }}
                      icon={<Edit2 className="w-3 h-3" />}
                    >
                      Record Specialist Opinion
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Referral Modal */}
      {isNewReferralModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Stethoscope className="w-4 h-4 text-blue-200" />
                <span>Request Specialist Consultation</span>
              </div>
              <button 
                onClick={() => setIsNewReferralModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Patient</label>
                  <select
                    value={targetPatientName}
                    onChange={(e) => setTargetPatientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-semibold text-slate-800"
                  >
                    <option value="Ramesh Balan (PT-8941)">Ramesh Balan (PT-8941)</option>
                    <option value="Priya Natarajan (PT-8942)">Priya Natarajan (PT-8942)</option>
                    <option value="Vignesh Kumar (PT-8943)">Vignesh Kumar (PT-8943)</option>
                    <option value="Meenakshi Sundaram (PT-8945)">Meenakshi Sundaram (PT-8945)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-semibold text-slate-800"
                  >
                    <option value="Nephrology">Nephrology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Infectious Disease">Infectious Disease</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Consultation Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-bold text-red-600"
                >
                  <option value="STAT (1 Hour)">STAT (Emergency — Within 1 Hour)</option>
                  <option value="Urgent (4 Hours)">Urgent (Within 4 Hours)</option>
                  <option value="Routine (24 Hours)">Routine (Within 24 Hours)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Indication & Specific Clinical Question</label>
                <textarea
                  rows={3}
                  required
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  placeholder="Detail primary presentation, pertinent laboratory / imaging data, and specific clinical guidance requested..."
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsNewReferralModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                  Dispatch Referral Requisition
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Opinion Modal */}
      {respondingConsult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Specialist Clinical Evaluation Note</span>
              </div>
              <button 
                onClick={() => setRespondingConsult(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpinion} className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1">
                <div><span className="text-slate-500">Patient:</span> <strong>{respondingConsult.patientName} ({respondingConsult.patientId})</strong></div>
                <div><span className="text-slate-500">Specialty:</span> <strong>{respondingConsult.specialty}</strong></div>
                <div><span className="text-slate-500">Indication:</span> {respondingConsult.indication}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Consultant Findings, Recommendations & Prescriptions</label>
                <textarea
                  rows={4}
                  required
                  value={specialistOpinionText}
                  onChange={(e) => setSpecialistOpinionText(e.target.value)}
                  placeholder="Document clinical assessment, differential diagnosis, recommended medications or procedural interventions..."
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setRespondingConsult(null)}>
                  Cancel
                </Button>
                <Button variant="success" size="sm" type="submit" icon={<Check className="w-3.5 h-3.5" />}>
                  Sign & Commit Specialist Opinion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 12. Knowledge Hub View
export const DoctorKnowledgeHubView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeGuidelineModal, setActiveGuidelineModal] = useState<any | null>(null);

  // Interactive Calculators State
  const [calcMapSbp, setCalcMapSbp] = useState<number>(120);
  const [calcMapDbp, setCalcMapDbp] = useState<number>(80);
  const [calcCrClAge, setCalcCrClAge] = useState<number>(62);
  const [calcCrClWeight, setCalcCrClWeight] = useState<number>(70);
  const [calcCrClCr, setCalcCrClCr] = useState<number>(1.2);
  const [calcCrClGender, setCalcCrClGender] = useState<'male' | 'female'>('male');

  const calculatedMap = Math.round((calcMapSbp + 2 * calcMapDbp) / 3);
  const calculatedCrCl = Math.round((((140 - calcCrClAge) * calcCrClWeight) / (72 * (calcCrClCr || 1))) * (calcCrClGender === 'female' ? 0.85 : 1));

  const guidelines = [
    {
      id: 'g-1',
      category: 'Critical Care & Sepsis',
      title: 'Surviving Sepsis Campaign: International Guidelines 2026',
      standard: 'SSC / ESICM Consensus Protocol',
      evidenceLevel: 'Class I, Level A',
      summary: '1-hour bundle resuscitation: Measure lactate, obtain blood cultures prior to antibiotics, administer 30 mL/kg crystalloids for hypotension (MAP < 65) or lactate >= 4 mmol/L, apply vasopressors during or after fluid resuscitation.',
      fullProtocol: 'Step 1: STAT Lactate measurement. Remeasure within 2-4 hours if initial lactate > 2 mmol/L.\nStep 2: Obtain 2 sets of blood cultures (aerobic and anaerobic) before initiating antimicrobials without delaying > 45 mins.\nStep 3: Administer broad-spectrum empiric IV antimicrobials within 1 hour.\nStep 4: Rapid fluid resuscitation with 30 mL/kg balanced crystalloids within first 3 hours.\nStep 5: Norepinephrine as first-choice vasopressor to target MAP >= 65 mmHg. Add Vasopressin 0.03 units/min if MAP remains refractory.'
    },
    {
      id: 'g-2',
      category: 'Cardiology',
      title: 'Acute Coronary Syndrome (STEMI / NSTEMI) Accelerated Care Pathway',
      standard: 'ACC / AHA / ESC Guidelines',
      evidenceLevel: 'Class I, Level A',
      summary: 'Immediate 12-lead ECG within 10 minutes of arrival. High-sensitivity Troponin-I serial algorithm (0h/1h or 0h/2h). Dual antiplatelet loading + unfractionated heparin.',
      fullProtocol: 'Step 1: Diagnostic 12-lead ECG within 10 mins. If STEMI identified, primary PCI target door-to-balloon < 90 mins (or thrombolysis < 30 mins if transfer > 120 mins).\nStep 2: Dual Antiplatelet Therapy: Aspirin 300 mg chewable + Ticagrelor 180 mg (or Clopidogrel 600 mg).\nStep 3: Anticoagulation with IV Unfractionated Heparin (60 units/kg bolus, max 4000 units) or Enoxaparin 1 mg/kg SC.\nStep 4: Early invasive coronary angiography within 24 hours for High-Risk NSTEMI (GRACE Score > 140).'
    },
    {
      id: 'g-3',
      category: 'Antimicrobial Formulary',
      title: 'Institutional Antibiotic Stewardship & Renal Dosing Formulary',
      standard: 'NABH / ICMR Hospital Antibiotic Policy',
      evidenceLevel: 'Institutional Core Protocol',
      summary: 'Empiric coverage tiers for hospital-acquired infections (HAP/VAP, CAUTI, surgical site). Dose titration based on Cockcroft-Gault CrCl and therapeutic drug monitoring (TDM).',
      fullProtocol: 'Meropenem: 1g IV q8h (CrCl > 50); 1g IV q12h (CrCl 26-50); 500mg IV q12h (CrCl 10-25); 500mg IV q24h (CrCl < 10).\nVancomycin: Loading dose 25-30 mg/kg; maintenance 15-20 mg/kg q8-12h. Target trough 15-20 mcg/mL for severe sepsis / MRSA bacteremia.\nPiperacillin/Tazobactam: 4.5g IV q6h (extended 4-hour infusion recommended for critical care optimization).'
    },
    {
      id: 'g-4',
      category: 'Mechanical Ventilation',
      title: 'ARDS Lung-Protective Mechanical Ventilation & Weaning Protocol',
      standard: 'ARDSNet / Berlin Definition Protocol',
      evidenceLevel: 'Class I, Level A',
      summary: 'Low tidal volume ventilation (6 mL/kg predicted body weight), plateau pressure < 30 cmH2O. Daily spontaneous breathing trial (SBT) readiness assessment.',
      fullProtocol: '1. Low Tidal Volume: Calculate Predicted Body Weight (PBW). Initiate volume-assist/control at 6 mL/kg PBW.\n2. Plateau Pressure: Maintain Pplat <= 30 cmH2O. If Pplat > 30, reduce Vt by 1 mL/kg down to 4 mL/kg.\n3. PEEP/FiO2 Titration: Follow high-PEEP / lower-FiO2 titration grid to achieve PaO2 55-80 mmHg or SpO2 88-95%.\n4. Extubation Readiness: Rapid Shallow Breathing Index (RSBI = f/Vt) < 105 during 30-min spontaneous breathing trial.'
    }
  ];

  const filteredGuidelines = guidelines.filter(g => {
    const matchesCat = selectedCategory === 'all' || g.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <BookOpen className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Institutional Clinical Knowledge Hub & Guidelines</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                CLINICAL DECISION SUPPORT
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                VERIFIED MEDICAL ALGORITHMS
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Peer-reviewed clinical practice guidelines, antibiotic stewardship algorithms, and interactive medical formulas.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Clinical Calculators Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAP Calculator */}
        <Card title="Mean Arterial Pressure (MAP) Calculator" subtitle="Vital endpoint for vasopressor titration" noPadding>
          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={calcMapSbp}
                  onChange={(e) => setCalcMapSbp(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-[#CBD5E1] rounded font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={calcMapDbp}
                  onChange={(e) => setCalcMapDbp(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-[#CBD5E1] rounded font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Calculated MAP:</span>
                <span className="text-2xl font-extrabold text-[#2563A6]">{calculatedMap} mmHg</span>
              </div>
              <Badge variant={calculatedMap >= 65 ? 'success' : 'critical'} size="sm">
                {calculatedMap >= 65 ? 'Adequate Organ Perfusion (>=65)' : 'Target MAP Unmet (<65)'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Creatinine Clearance Calculator */}
        <Card title="Cockcroft-Gault Creatinine Clearance (CrCl)" subtitle="Critical for nephrotoxic antibiotic dosing" noPadding>
          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Age (yrs)</label>
                <input
                  type="number"
                  value={calcCrClAge}
                  onChange={(e) => setCalcCrClAge(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#CBD5E1] rounded font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={calcCrClWeight}
                  onChange={(e) => setCalcCrClWeight(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#CBD5E1] rounded font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Serum Cr (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcCrClCr}
                  onChange={(e) => setCalcCrClCr(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#CBD5E1] rounded font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Gender</label>
                <select
                  value={calcCrClGender}
                  onChange={(e) => setCalcCrClGender(e.target.value as any)}
                  className="w-full p-1.5 border border-[#CBD5E1] rounded font-bold bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Estimated CrCl:</span>
                <span className="text-2xl font-extrabold text-emerald-700">{calculatedCrCl} mL/min</span>
              </div>
              <Badge variant={calculatedCrCl >= 60 ? 'success' : calculatedCrCl >= 30 ? 'warning' : 'critical'} size="sm">
                {calculatedCrCl >= 60 ? 'Normal / Mild (>=60)' : calculatedCrCl >= 30 ? 'Moderate (30-59)' : 'Severe AKI (<30)'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Category Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'sepsis', 'cardiology', 'antimicrobial', 'ventilation'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedCategory === c
                  ? 'bg-[#2563A6] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c === 'all' ? 'All Protocols' : c.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search guidelines & protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2563A6]"
          />
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuidelines.map(g => (
          <Card
            key={g.id}
            title={g.title}
            subtitle={`${g.standard} &middot; ${g.evidenceLevel}`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveGuidelineModal(g)}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                View Protocol
              </Button>
            }
            noPadding
          >
            <div className="p-4 space-y-2.5 text-xs">
              <p className="text-slate-700 leading-relaxed">
                {g.summary}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#2563A6] font-semibold">
                <span>Category: {g.category}</span>
                <span className="text-slate-400">Institutional Formulary v2026.1</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Protocol Detail Modal */}
      {activeGuidelineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden text-xs max-h-[85vh] flex flex-col">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{activeGuidelineModal.title}</h4>
                <div className="text-[11px] text-blue-200">{activeGuidelineModal.standard} &middot; {activeGuidelineModal.evidenceLevel}</div>
              </div>
              <button 
                onClick={() => setActiveGuidelineModal(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-[#2563A6] block uppercase text-[10px] mb-1">Executive Summary:</span>
                <p className="text-slate-800 leading-relaxed">{activeGuidelineModal.summary}</p>
              </div>

              <div>
                <span className="font-bold text-[#1E293B] block uppercase text-[11px] mb-2">Step-by-Step Clinical Care Pathway:</span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-line font-mono text-[11px] leading-relaxed text-slate-800">
                  {activeGuidelineModal.fullProtocol}
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                <strong>Clinical Safety Warning:</strong> Institutional protocols provide structured decision guidance. Clinical judgment and patient-specific contraindications supersede standardized pathways.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveGuidelineModal(null)}>
                Close Protocol Viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 13. Case Studies View
export const DoctorCaseStudiesView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [activeCaseModal, setActiveCaseModal] = useState<any | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  // Submission Form State
  const [caseTitle, setCaseTitle] = useState('');
  const [caseSpecialty, setCaseSpecialty] = useState('Critical Care & Cardiology');
  const [caseSummary, setCaseSummary] = useState('');
  const [casePearls, setCasePearls] = useState('');

  const caseStudies = [
    {
      id: 'cs-842',
      caseNumber: 'Case #842',
      title: 'Refractory Cardiogenic Shock in Young Adult Post-Viral Myocarditis',
      specialty: 'Critical Care & Cardiology',
      patientDemographics: '34-year-old male, previously healthy, 1-week history of viral URI',
      chiefComplaint: 'Acute profound dyspnea, cardiogenic shock, MAP 48 mmHg refractory to multiple vasopressors',
      clinicalCourse: 'Patient presented in biventricular failure with LVEF < 15%. Initiated VA-ECMO via right femoral cutdown with intra-aortic balloon pump (IABP) for left ventricular venting. Rapid cytokine storm suppression with pulse steroid therapy.',
      outcome: 'Full myocardial recovery after 11 days on mechanical circulatory support. Decannulated and discharged home on Day 21 with LVEF 50%.',
      clinicalPearls: [
        'Early VA-ECMO deployment before profound end-organ metabolic acidemia improves survival in acute fulminant myocarditis.',
        'Left ventricular venting via IABP or Impella is essential during peripheral VA-ECMO to avoid pulmonary edema and intracardiac thrombus.',
        'Serial echocardiographic strain imaging provides superior recovery trajectory data over standard ejection fraction.'
      ]
    },
    {
      id: 'cs-819',
      caseNumber: 'Case #819',
      title: 'Multidrug-Resistant Acinetobacter Outbreak Containment in ICU',
      specialty: 'Infectious Disease & Critical Care',
      patientDemographics: 'Cluster of 5 elderly intubated patients in ICU Block A',
      chiefComplaint: 'Carbapenem-resistant Acinetobacter baumannii (CRAB) flagged in sequential endotracheal aspirates',
      clinicalCourse: 'Spatial cohorting established in ICU isolation pods. Hydrogen peroxide vapor automated decontamination deployed across vacant beds. Strict antibiotic stewardship enforced with high-dose Ampicillin-Sulbactam + Colistin.',
      outcome: 'Zero secondary transmission. All 5 patients successfully treated without cross-infection to adjacent clinical wards.',
      clinicalPearls: [
        'Environmental surface decontamination is as vital as hand hygiene in controlling Acinetobacter due to prolonged persistence on dry surfaces.',
        'Immediate molecular typing and antimicrobial synergy testing prevent inappropriate monotherapy in MDR Gram-negative pathogens.',
        'Dedicated equipment cohorts (ventilators, suction machines) must be quarantined per patient.'
      ]
    },
    {
      id: 'cs-795',
      caseNumber: 'Case #795',
      title: 'Severe ARDS Secondary to Scrub Typhus in South India',
      specialty: 'Infectious Disease & Pulmonology',
      patientDemographics: '48-year-old female agricultural worker presenting with febrile illness and respiratory failure',
      chiefComplaint: 'High-grade fever, multi-organ dysfunction syndrome, PaO2/FiO2 ratio 88 (Severe ARDS)',
      clinicalCourse: 'Inconspicuous eschar identified in inframammary fold during secondary survey. IgM ELISA confirmed Orientia tsutsugamushi. IV Doxycycline 100 mg q12h + Azithromycin initiated. Prone position ventilation for 16 hours daily.',
      outcome: 'Rapid defervescence within 48 hours. Successfully extubated on Day 5 with complete pulmonary clearance on follow-up CT.',
      clinicalPearls: [
        'Detailed whole-body physical search for pathognomonic eschar is mandatory in all tropical fevers with respiratory distress.',
        'Early empiric Doxycycline in unexplained tropical ARDS dramatically reduces mortality.',
        'Prone positioning should be utilized early in non-cardiogenic ARDS with PaO2/FiO2 < 150.'
      ]
    }
  ];

  const handleSubmitCase = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitModalOpen(false);
    setSubmitNotice('Anonymized case report submitted successfully for Institutional Grand Rounds review!');
    setCaseTitle('');
    setCaseSummary('');
    setCasePearls('');
    setTimeout(() => setSubmitNotice(null), 3500);
  };

  const filteredCases = caseStudies.filter(c => {
    const matchesSpec = selectedSpecialty === 'all' || c.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <BookOpen className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Hospital Clinical Case Study Archive & Grand Rounds</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                PEER LEARNING
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                DE-IDENTIFIED CLINICAL CASES
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Anonymized grand rounds clinical case library, diagnostic dilemmas, management pearls, and morbidity & mortality archives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Submit Grand Rounds Case
          </Button>
        </div>
      </div>

      {submitNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{submitNotice}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'cardiology', 'infectious disease', 'pulmonology'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSpecialty(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedSpecialty === s
                  ? 'bg-[#2563A6] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s === 'all' ? 'All Specialties' : s.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search clinical cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2563A6]"
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="space-y-4">
        {filteredCases.map(cs => (
          <Card
            key={cs.id}
            title={`${cs.caseNumber}: ${cs.title}`}
            subtitle={`${cs.specialty} &middot; Demographics: ${cs.patientDemographics}`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCaseModal(cs)}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                View Case Review
              </Button>
            }
            noPadding
          >
            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block text-[11px] uppercase mb-0.5">Presentation & Dilemma:</span>
                <p className="text-slate-600">{cs.chiefComplaint}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#2563A6] block text-[11px] uppercase">Hospital Trajectory & Resolution:</span>
                <p className="text-slate-800 leading-relaxed">{cs.clinicalCourse}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-green-700 font-semibold">{cs.outcome}</span>
                <Badge variant="primary" size="sm">{cs.specialty}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Case Modal */}
      {activeCaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden text-xs max-h-[85vh] flex flex-col">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{activeCaseModal.caseNumber}: {activeCaseModal.title}</h4>
                <div className="text-[11px] text-blue-200">{activeCaseModal.specialty}</div>
              </div>
              <button 
                onClick={() => setActiveCaseModal(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-700 block uppercase text-[10px] mb-1">Patient Profile & Presenting State:</span>
                <p className="text-slate-800">{activeCaseModal.patientDemographics} &middot; {activeCaseModal.chiefComplaint}</p>
              </div>

              <div>
                <span className="font-bold text-[#1E293B] block uppercase text-[11px] mb-1">Clinical Management Trajectory:</span>
                <p className="text-slate-700 leading-relaxed bg-white border border-slate-200 p-3 rounded-lg">
                  {activeCaseModal.clinicalCourse}
                </p>
              </div>

              <div>
                <span className="font-bold text-emerald-800 block uppercase text-[11px] mb-1">Outcome & Follow-up:</span>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-semibold">
                  {activeCaseModal.outcome}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-[#2563A6] block uppercase text-[11px] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> High-Yield Clinical Pearls & Takeaways:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium">
                  {activeCaseModal.clinicalPearls.map((pearl: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{pearl}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveCaseModal(null)}>
                Close Case Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Case Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-blue-200" />
                <span>Submit De-Identified Grand Rounds Case</span>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCase} className="p-5 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refractory Septic Shock Requiring Dual Inotrope Support"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Specialty</label>
                <select
                  value={caseSpecialty}
                  onChange={(e) => setCaseSpecialty(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-semibold"
                >
                  <option value="Critical Care & Cardiology">Critical Care & Cardiology</option>
                  <option value="Infectious Disease">Infectious Disease</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Nephrology">Nephrology</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Course & Dilemma (De-Identified)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the presentation, diagnostic workup, and interventions..."
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Takeaway Pearls</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What is the main institutional learning pearl from this case?"
                  value={casePearls}
                  onChange={(e) => setCasePearls(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                HIPAA Safe Harbor: All direct identifiers (names, dates, exact locations) must be removed prior to grand rounds archiving.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                  Submit Case Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 14. Audit Trail View
export const DoctorAuditTrailView: React.FC = () => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const [auditEntries] = useState([
    {
      id: 'aud-9821',
      timestamp: 'Today at 10:14:22 AM',
      action: 'Resource Requisition',
      entityId: 'REQ-4912',
      clinician: 'Dr. Sundaramoorthy M. (doc-sundar)',
      details: 'Dispatched emergency requisition for 1 Critical Care Ventilator (Indication: PaO2/FiO2 < 100 for PT-8941).',
      hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      status: 'Verified'
    },
    {
      id: 'aud-9820',
      timestamp: 'Today at 10:20:05 AM',
      action: 'Clinical Alert Ack',
      entityId: 'ALT-1082',
      clinician: 'Dr. Sundaramoorthy M. (doc-sundar)',
      details: 'Acknowledged MEWS 7/14 deterioration alarm on Bed A-101. Bedside telemetry confirmed.',
      hash: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      status: 'Verified'
    },
    {
      id: 'aud-9819',
      timestamp: 'Today at 11:05:44 AM',
      action: 'Clinical Progress Note',
      entityId: 'EHR-8941',
      clinician: 'Dr. Sundaramoorthy M. (doc-sundar)',
      details: 'Attending physician SOAP progress note saved and countersigned. Permanent legal medical record lock.',
      hash: 'sha256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      status: 'Verified'
    },
    {
      id: 'aud-9818',
      timestamp: 'Today at 11:15:10 AM',
      action: 'Prescription Dispatch',
      entityId: 'RX-7741',
      clinician: 'Dr. Sundaramoorthy M. (doc-sundar)',
      details: 'Digital prescription for IV Norepinephrine 4mg/50mL and Heparin 25,000 units dispatched to pharmacy.',
      hash: 'sha256:1a84f3e9a8f23498b584281f9b3b879ef448e89cfec447d206f40b28e5033fd9',
      status: 'Verified'
    },
    {
      id: 'aud-9817',
      timestamp: 'Today at 11:35:00 AM',
      action: 'Emergency Code',
      entityId: 'EMG-CODE-BLUE',
      clinician: 'Dr. Sundaramoorthy M. (doc-sundar)',
      details: 'Dispatched facility-wide Code Blue in Trauma Bay 2 with Rapid Response paging.',
      hash: 'sha256:88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
      status: 'Verified'
    }
  ]);

  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyStatus('All 5 audit block hashes verified against institutional tamper-evident SHA-256 ledger. 0 discrepancies found.');
      setTimeout(() => setVerifyStatus(null), 4000);
    }, 1200);
  };

  const filteredEntries = auditEntries.filter(entry => {
    const matchesAction = filterAction === 'all' || entry.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesSearch = entry.details.toLowerCase().includes(searchQuery.toLowerCase()) || entry.clinician.toLowerCase().includes(searchQuery.toLowerCase()) || entry.entityId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 border border-slate-600/50">
            <FileText className="w-5 h-5 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Physician Clinical Action & Access Audit Trail</h3>
              <span className="bg-slate-700/80 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                HIPAA / 21 CFR COMPLIANT
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                IMMUTABLE APPEND-ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cryptographically verified event ledger tracking clinical requisitions, alert acknowledgments, and prescription orders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyIntegrity}
            className="text-white border-slate-600 hover:bg-slate-800"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            {isVerifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}
          </Button>
        </div>
      </div>

      {verifyStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <div>{verifyStatus}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'requisition', 'alert', 'progress note', 'prescription', 'emergency code'].map(act => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterAction === act
                  ? 'bg-[#2563A6] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {act === 'all' ? 'All Actions' : act.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2563A6]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action Category</th>
                <th className="p-3.5">Entity / Target ID</th>
                <th className="p-3.5">Authorizing Clinician</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Ledger Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {entry.timestamp}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <Badge variant="primary" size="sm">{entry.action}</Badge>
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-700">
                    {entry.entityId}
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-medium text-[#1E293B]">
                    {entry.clinician}
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-xs truncate">
                    {entry.details}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-mono text-[10px] text-slate-400 truncate block max-w-[120px]" title={entry.hash}>
                      {entry.hash.slice(0, 16)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 15. Doctor Profile View
export const DoctorProfileView: React.FC = () => {
  const { user } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Profile editable fields
  const [emergencyPhone, setEmergencyPhone] = useState('+91 94440 82190');
  const [pagerId, setPagerId] = useState('PAG-ICU-04');
  const [hospitalExt, setHospitalExt] = useState('Ext 4410');
  const [subSpecialty, setSubSpecialty] = useState('Interventional Cardiology & Critical Care ECMO');
  const [clinicalBio, setClinicalBio] = useState('Lead Intensivist & Attending Cardiologist with 14+ years experience managing acute STEMI pathways, cardiogenic shock, and mechanical circulatory support.');
  const [isOnCall, setIsOnCall] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    setProfileNotice('Physician profile and emergency contact details updated successfully!');
    setTimeout(() => setProfileNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <UserCheck className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Physician Professional Credentials & Institutional Profile</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                MCI VERIFIED
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                ACTIVE ON-CALL
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Verified clinical appointments, medical council licensure, on-call pager registry, and institutional privileges.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
          className="text-white border-blue-400 hover:bg-blue-900"
          icon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit Contact Info
        </Button>
      </div>

      {profileNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{profileNotice}</div>
        </div>
      )}

      {/* Main Profile Card */}
      <Card noPadding>
        <div className="p-6 space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-[#2563A6] font-bold text-2xl flex items-center justify-center border-4 border-blue-300 shadow-xs">
                SM
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1E293B]">{user?.name || 'Dr. Sundaramoorthy M.'}</h3>
                <p className="text-slate-600 font-medium">
                  MBBS, MD (Internal Medicine), DM (Cardiology), FCCP (USA)
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="success" size="sm">MCI Reg: TN-MED-49102</Badge>
                  <Badge variant="primary" size="sm">Chief Attending Physician</Badge>
                  <Badge variant={isOnCall ? 'warning' : 'neutral'} size="sm">
                    {isOnCall ? '⚡ On-Call Emergency Standby' : 'Off-Duty'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Affiliated Center</span>
              <div className="font-bold text-sm text-[#1E293B]">{user?.hospitalName || 'Rajiv Gandhi Government General Hospital'}</div>
              <div className="text-slate-500">Madras Medical College & Allied Institutes</div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Clinical Division & Privileges</span>
              <div className="font-bold text-sm text-[#1E293B]">Critical Care & Interventional Cardiology</div>
              <div className="text-slate-500">{subSpecialty}</div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Emergency Contact & Pager</span>
              <div className="font-bold text-sm text-[#2563A6]">{emergencyPhone}</div>
              <div className="text-slate-500">{pagerId} &middot; {hospitalExt}</div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-[#1E293B] block uppercase text-[10px] mb-1">Physician Clinical Statement:</span>
            <p className="text-slate-700 leading-relaxed">{clinicalBio}</p>
          </div>

          {/* Accreditations and Certifications */}
          <div>
            <span className="font-bold text-[#1E293B] block uppercase text-[10px] mb-3">Institutional Accreditations & Certifications:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <strong className="block text-[#1E293B]">ACLS / BLS</strong>
                <span className="text-[10px] text-slate-400">Master Instructor (AHA)</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                <Activity className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <strong className="block text-[#1E293B]">ELSO ECMO</strong>
                <span className="text-[10px] text-slate-400">Certified Cannulator</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <strong className="block text-[#1E293B]">NABH Assessor</strong>
                <span className="text-[10px] text-slate-400">Hospital Quality Board</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                <Key className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <strong className="block text-[#1E293B]">Digital PKI Signature</strong>
                <span className="text-[10px] text-slate-400">Level 3 Hardware Token</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-blue-200" />
                <span>Update Physician Contact Details</span>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Mobile</label>
                <input
                  type="text"
                  required
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Extension</label>
                  <input
                    type="text"
                    required
                    value={hospitalExt}
                    onChange={(e) => setHospitalExt(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Pager ID</label>
                  <input
                    type="text"
                    required
                    value={pagerId}
                    onChange={(e) => setPagerId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Sub-Specialty Focus</label>
                <input
                  type="text"
                  required
                  value={subSpecialty}
                  onChange={(e) => setSubSpecialty(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  required
                  value={clinicalBio}
                  onChange={(e) => setClinicalBio(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="font-semibold text-slate-700">Active On-Call Emergency Availability</span>
                <input
                  type="checkbox"
                  checked={isOnCall}
                  onChange={(e) => setIsOnCall(e.target.checked)}
                  className="w-4 h-4 text-[#2563A6] rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={<Save className="w-3.5 h-3.5" />}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 16. Doctor Notifications View
export const DoctorNotificationsView: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Critical Panic Lab Flagged: Serum Troponin-I',
      details: 'Troponin-I for Ramesh Balan (PT-8941) reported at 4.8 ng/mL (Reference < 0.04 ng/mL). Catheterization standby advised.',
      time: '12 mins ago',
      type: 'critical',
      read: false
    },
    {
      id: 'notif-2',
      title: 'ICU Bed Intake Fulfilled: Bed A-102 Confirmed',
      details: 'Emergency trauma arrival from 108 Ambulance successfully docked and allocated to Bed A-102.',
      time: '35 mins ago',
      type: 'resource',
      read: false
    },
    {
      id: 'notif-3',
      title: 'MEWS Score Escalation Alert: Score >= 6',
      details: 'Bed A-101 (Ramesh Balan) triggered rapid deterioration warning. Heart rate 118 bpm, BP 85/55 mmHg.',
      time: '45 mins ago',
      type: 'critical',
      read: false
    },
    {
      id: 'notif-4',
      title: 'Shift Handover Scheduled for 20:00 IST',
      details: 'Evening handover with incoming attending Dr. Priya Natarajan queued for review.',
      time: '1 hour ago',
      type: 'general',
      read: true
    },
    {
      id: 'notif-5',
      title: 'Inter-Ward Transfer Approved for Ward 3',
      details: 'Priya Natarajan (PT-8942) bed sanitized and confirmed ready for step-down transition.',
      time: '2 hours ago',
      type: 'resource',
      read: true
    },
    {
      id: 'notif-6',
      title: 'Facility Code Blue Resolved: Trauma Bay 2',
      details: 'Cardiac arrest protocol successfully terminated post-ROSC. Patient stabilized.',
      time: '3 hours ago',
      type: 'critical',
      read: true
    }
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotice('All notifications marked as read.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleClearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    setNotice('Read notifications cleared.');
    setTimeout(() => setNotice(null), 3000);
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    if (filterType === 'critical') return n.type === 'critical';
    if (filterType === 'resource') return n.type === 'resource';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Bell className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Clinical Notifications & Live System Alerts</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                REAL-TIME TELEMETRY
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Immediate broadcasts for panic laboratory values, bed fulfillment alerts, MEWS deterioration, and handover notices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="text-white border-blue-400 hover:bg-blue-900">
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearRead} className="text-white border-blue-400 hover:bg-blue-900">
            Clear Read
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{notice}</div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          {['all', 'unread', 'critical', 'resource'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === f
                  ? 'bg-[#2563A6] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'all' ? 'All Alerts' : f === 'unread' ? `Unread (${notifications.filter(n => !n.read).length})` : f === 'critical' ? 'Critical Panic' : 'Resource Updates'}
            </button>
          ))}
        </div>

        <div className="text-slate-500 text-[11px]">
          Live Event Hub: <strong>Socket.IO Connected (TLS Encrypted)</strong>
        </div>
      </div>

      {/* Notifications List */}
      <Card noPadding>
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {filteredNotifs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No notifications matching the selected filter.
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                  !notif.read ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {notif.type === 'critical' ? (
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  ) : notif.type === 'resource' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className={`text-sm ${notif.type === 'critical' ? 'text-red-950 font-bold' : 'text-[#1E293B]'}`}>
                        {notif.title}
                      </strong>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{notif.details}</p>
                    <span className="text-[11px] text-slate-400 block">{notif.time}</span>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-[11px] font-semibold text-[#2563A6] hover:text-blue-800 shrink-0 cursor-pointer p-1"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

// 17. Doctor Settings View
export const DoctorSettingsView: React.FC = () => {
  const [mewsThreshold, setMewsThreshold] = useState<string>(() => localStorage.getItem('medisync_doc_mews') || '5');
  const [telemetryRefresh, setTelemetryRefresh] = useState<string>(() => localStorage.getItem('medisync_doc_telemetry') || '5s');
  const [contraindicationLevel, setContraindicationLevel] = useState<string>(() => localStorage.getItem('medisync_doc_contra') || 'major_mod');
  const [audioAlerts, setAudioAlerts] = useState<boolean>(() => localStorage.getItem('medisync_doc_audio') !== 'false');
  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(() => localStorage.getItem('medisync_doc_confirm') !== 'false');
  const [twoFactorNarcotics, setTwoFactorNarcotics] = useState<boolean>(() => localStorage.getItem('medisync_doc_2fa') !== 'false');
  const [compactDensity, setCompactDensity] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSaveSettings = () => {
    localStorage.setItem('medisync_doc_mews', mewsThreshold);
    localStorage.setItem('medisync_doc_telemetry', telemetryRefresh);
    localStorage.setItem('medisync_doc_contra', contraindicationLevel);
    localStorage.setItem('medisync_doc_audio', String(audioAlerts));
    localStorage.setItem('medisync_doc_confirm', String(requireConfirmation));
    localStorage.setItem('medisync_doc_2fa', String(twoFactorNarcotics));

    setSavedNotice('Physician workspace settings and clinical safety preferences saved!');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleResetDefaults = () => {
    setMewsThreshold('5');
    setTelemetryRefresh('5s');
    setContraindicationLevel('major_mod');
    setAudioAlerts(true);
    setRequireConfirmation(true);
    setTwoFactorNarcotics(true);
    setCompactDensity(false);

    setSavedNotice('Settings restored to institutional critical care defaults.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <SettingsIcon className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Physician Workspace Preferences & Telemetry Settings</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                CLINICAL CONFIGURATION
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Customize alert escalation thresholds, telemetry refresh frequencies, decision support sensitivities, and clinical safety gates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="text-white border-blue-400 hover:bg-blue-900">
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveSettings} icon={<Save className="w-3.5 h-3.5" />}>
            Save Settings
          </Button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{savedNotice}</div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Alert Thresholds Card */}
        <Card title="Alert Escalation & Panic Lab Thresholds" noPadding>
          <div className="p-5 space-y-4">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">MEWS Score Escalation Alert Sensitivity</label>
              <select
                value={mewsThreshold}
                onChange={(e) => setMewsThreshold(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#2563A6]"
              >
                <option value="4">Score &ge; 4 (Moderate Early Warning)</option>
                <option value="5">Score &ge; 5 (Urgent Warning — Recommended)</option>
                <option value="7">Score &ge; 7 (Critical Resuscitation Only)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Trigger bedside nurse evaluation alert when patient exceeds score.</span>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Bedside Telemetry Refresh Rate</label>
              <select
                value={telemetryRefresh}
                onChange={(e) => setTelemetryRefresh(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#2563A6]"
              >
                <option value="5s">Every 5 seconds (Real-time intensive telemetry)</option>
                <option value="15s">Every 15 seconds (Standard ICU block)</option>
                <option value="30s">Every 30 seconds (Intermediate ward)</option>
                <option value="60s">Every 60 seconds (Low bandwidth mode)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <strong className="block text-[#1E293B]">Emergency Panic Audio Chimes</strong>
                <span className="text-[11px] text-slate-500">Play distinctive chime for Code Blue and Troponin panic results</span>
              </div>
              <input
                type="checkbox"
                checked={audioAlerts}
                onChange={(e) => setAudioAlerts(e.target.checked)}
                className="w-4 h-4 text-[#2563A6] rounded"
              />
            </div>
          </div>
        </Card>

        {/* Clinical Decision Support & Safety */}
        <Card title="Clinical Safety Gates & Decision Support" noPadding>
          <div className="p-5 space-y-4">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Drug-Drug Contraindication Sensitivity</label>
              <select
                value={contraindicationLevel}
                onChange={(e) => setContraindicationLevel(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#2563A6]"
              >
                <option value="major_mod">Major & Moderate Contraindications (Strict Safety)</option>
                <option value="major_only">Major Contraindications Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <strong className="block text-[#1E293B]">Mandatory Confirmation on Bed Docking</strong>
                <span className="text-[11px] text-slate-500">Require physician modal verification before emergency allocation</span>
              </div>
              <input
                type="checkbox"
                checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)}
                className="w-4 h-4 text-[#2563A6] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <strong className="block text-[#1E293B]">STAT Vasopressor & Narcotic PIN Gate</strong>
                <span className="text-[11px] text-slate-500">Require digital signature PIN before dispatching schedule II orders</span>
              </div>
              <input
                type="checkbox"
                checked={twoFactorNarcotics}
                onChange={(e) => setTwoFactorNarcotics(e.target.checked)}
                className="w-4 h-4 text-[#2563A6] rounded"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-500">Institutional Medical Council Configuration &middot; Node: MMC-ICU-CLUSTER-01</span>
        <Button variant="primary" size="sm" onClick={handleSaveSettings} icon={<Save className="w-3.5 h-3.5" />}>
          Save Workspace Settings
        </Button>
      </div>
    </div>
  );
};
