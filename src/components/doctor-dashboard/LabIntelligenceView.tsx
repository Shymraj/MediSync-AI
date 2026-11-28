import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  FileCheck, 
  Check,
  Info,
  Flame,
  Plus
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  LabResultItem, 
  PatientDigitalTwin 
} from '../../data/doctorDemoData';
import { api } from '../../services/api';

interface LabIntelligenceViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const LabIntelligenceView: React.FC<LabIntelligenceViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [acknowledgedLabs, setAcknowledgedLabs] = useState<Record<string, boolean>>({});
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderPatientId, setOrderPatientId] = useState(patients[0]?.patientId || 'PT-8941');
  const [orderTestName, setOrderTestName] = useState('');
  const [orderCategory, setOrderCategory] = useState('Biochemistry');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderCriticalFlag, setOrderCriticalFlag] = useState(false);
  const [orderSuccessNotice, setOrderSuccessNotice] = useState(false);

  // Flatten all labs with patient context
  const allLabsWithPatient = patients.flatMap(p => 
    (p.labs || []).map(l => ({
      ...l,
      patientName: p.name,
      patientId: p.patientId,
      ward: p.ward,
      bedNumber: p.bedNumber
    }))
  );

  const categories = Array.from(new Set(allLabsWithPatient.map(l => l.category)));

  const filteredLabs = allLabsWithPatient.filter(l => {
    const matchesCat = selectedCategory === 'all' || l.category === selectedCategory;
    const matchesPatient = selectedPatientId === 'all' || l.patientId === selectedPatientId;
    return matchesCat && matchesPatient;
  });

  const panicCount = allLabsWithPatient.filter(l => l.status === 'Critical Panic').length;
  const abnormalCount = allLabsWithPatient.filter(l => l.status === 'Abnormal').length;

  const handleAcknowledge = async (labId: string) => {
    try {
      await api.acknowledgeLabReport(labId, 'Acknowledged by Attending Physician');
    } catch {}
    setAcknowledgedLabs(prev => ({ ...prev, [labId]: true }));
  };

  const handleOrderLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTestName.trim()) return;

    try {
      await api.orderLabReport({
        patientId: orderPatientId,
        testName: orderTestName.trim(),
        category: orderCategory,
        doctorNotes: orderNotes.trim(),
        criticalFlag: orderCriticalFlag
      });
    } catch {}

    setIsOrderModalOpen(false);
    setOrderTestName('');
    setOrderNotes('');
    setOrderSuccessNotice(true);
    setTimeout(() => setOrderSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {orderSuccessNotice && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>Laboratory investigation request dispatched to Central Hospital Lab.</span>
        </div>
      )}
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Droplet className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Diagnostic Lab Intelligence & Critical Panic Alerts</h3>
              <span className="bg-red-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                {panicCount} PANIC ALERTS
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Automated telemetry from central laboratory analyzers flagging critical life-threatening biochemical abnormalities.
            </p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-red-600/30 border border-red-500/40 px-3 py-1.5 rounded-lg text-red-200 font-bold">
            Critical Panic: {panicCount}
          </div>
          <div className="bg-amber-600/30 border border-amber-500/40 px-3 py-1.5 rounded-lg text-amber-200 font-bold">
            Abnormal: {abnormalCount}
          </div>
          <div className="bg-blue-600/30 border border-blue-500/40 px-3 py-1.5 rounded-lg text-blue-200 font-bold">
            Total Analyzed: {allLabsWithPatient.length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
          >
            <option value="all">All Diagnostic Categories ({allLabsWithPatient.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
          >
            <option value="all">All Inpatients</option>
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientId} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Critical Panic Highlights Carousel / Card */}
      {panicCount > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wide">
            <Flame className="w-4 h-4 text-red-600" />
            <span>Immediate Attention Required — Critical Panic Lab Findings</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allLabsWithPatient.filter(l => l.status === 'Critical Panic').map(panic => (
              <div key={panic.id} className="bg-white p-3 rounded-lg border border-red-200 text-xs shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B]">{panic.patientName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{panic.patientId} (Bed {panic.bedNumber})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{panic.testName}</span>
                  <span className="font-mono font-extrabold text-red-600">{panic.value} {panic.unit}</span>
                </div>
                <div className="text-[11px] text-slate-500">Reference: {panic.referenceRange}</div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{panic.timestamp}</span>
                  {acknowledgedLabs[panic.id] ? (
                    <span className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(panic.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold"
                    >
                      Acknowledge Panic
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Master Table */}
      <Card
        title="Diagnostic Telemetry Feed"
        subtitle="All ordered, verified, and panic results"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOrderModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Order Investigation
          </Button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Test Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Result Value</th>
                <th className="px-4 py-3">Reference Range</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLabs.map(lab => {
                const isPanic = lab.status === 'Critical Panic';
                const isAbnormal = lab.status === 'Abnormal';
                const isAck = acknowledgedLabs[lab.id];

                return (
                  <tr key={lab.id} className={isPanic ? 'bg-red-50/40' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1E293B]">{lab.patientName}</div>
                      <div className="text-[10px] text-slate-400">{lab.patientId} &middot; Bed {lab.bedNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1E293B]">{lab.testName}</div>
                      {lab.notes && <div className="text-[10px] text-slate-500">{lab.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{lab.category}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${
                      isPanic ? 'text-red-700 text-sm' :
                      isAbnormal ? 'text-amber-700' : 'text-[#1E293B]'
                    }`}>
                      {lab.value} {lab.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{lab.referenceRange}</td>
                    <td className="px-4 py-3 text-slate-500">{lab.timestamp}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={isPanic ? 'critical' : isAbnormal ? 'warning' : 'success'} 
                        size="sm"
                      >
                        {lab.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPanic && !isAck ? (
                        <button
                          onClick={() => handleAcknowledge(lab.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Ack
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Verified</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Lab Investigation Modal */}
      {isOrderModalOpen && (
        <Modal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          title="Order Laboratory Investigation"
        >
          <form onSubmit={handleOrderLab} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Patient</label>
              <select
                value={orderPatientId}
                onChange={(e) => setOrderPatientId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                {patients.map(p => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.name} ({p.patientId}) &middot; {p.ward} (Bed {p.bedNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Investigation / Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Serum Potassium (K+), D-Dimer"
                  value={orderTestName}
                  onChange={(e) => setOrderTestName(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Category</label>
                <select
                  value={orderCategory}
                  onChange={(e) => setOrderCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Cardiac Markers">Cardiac Markers</option>
                  <option value="Blood Gas">Blood Gas (ABG)</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Inflammatory">Inflammatory Markers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Doctor Notes & Indication</label>
              <input
                type="text"
                placeholder="e.g. Serial monitoring post-thrombolysis"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={orderCriticalFlag}
                onChange={(e) => setOrderCriticalFlag(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-red-700">Flag as STAT / Critical Priority (Immediate Analyzer Queue)</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Order to Lab
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
