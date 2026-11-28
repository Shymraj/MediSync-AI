import React, { useState } from 'react';
import { 
  ClipboardList, 
  Users, 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  INITIAL_HANDOVERS, 
  ClinicalHandoverItem 
} from '../../data/doctorDemoData';

interface ClinicalHandoverViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const ClinicalHandoverView: React.FC<ClinicalHandoverViewProps> = ({ onNavigateTab }) => {
  const [handovers, setHandovers] = useState<ClinicalHandoverItem[]>(INITIAL_HANDOVERS);
  const [patientId, setPatientId] = useState('PT-8941');
  const [patientName, setPatientName] = useState('Ramesh Balan');
  const [bedNumber, setBedNumber] = useState('A-101');
  const [ward, setWard] = useState('ICU Block A');
  const [handoverFrom, setHandoverFrom] = useState('Dr. Sundaramoorthy M.');
  const [handoverTo, setHandoverTo] = useState('Dr. Priya Natarajan (Night Shift)');
  const [shift, setShift] = useState<'Morning -> Evening' | 'Evening -> Night' | 'Night -> Morning'>('Evening -> Night');
  const [clinicalSummary, setClinicalSummary] = useState('Day 2 post-PCI for acute anterior STEMI. Hemodynamically stabilized on low-dose norepinephrine.');
  const [criticalIssuesInput, setCriticalIssuesInput] = useState('Elevated Troponin-I; transient sinus tachycardia; monitor fluid balance');
  const [pendingTasksInput, setPendingTasksInput] = useState('Check repeat Troponin at 20:00; evaluate ABG on Bed 4; confirm ICU step-down for Bed 6');
  const [pendingLabsInput, setPendingLabsInput] = useState('Arterial blood gas at 22:00; repeat serum potassium');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [filterShift, setFilterShift] = useState<string>('all');
  const [signOffModalHandover, setSignOffModalHandover] = useState<ClinicalHandoverItem | null>(null);

  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const newHandover: ClinicalHandoverItem = {
      id: 'HO-' + Date.now().toString().slice(-4),
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientId,
      patientName,
      bedNumber,
      ward,
      handoverFrom,
      handoverTo,
      shift,
      clinicalSummary,
      criticalIssues: criticalIssuesInput.split(';').map(s => s.trim()).filter(Boolean),
      pendingInvestigations: pendingLabsInput.split(';').map(s => s.trim()).filter(Boolean),
      outstandingTasks: pendingTasksInput.split(';').map(s => s.trim()).filter(Boolean),
      status: 'Pending Review'
    };

    setHandovers([newHandover, ...handovers]);
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3500);
  };

  const handleConfirmSignOff = () => {
    if (!signOffModalHandover) return;
    setHandovers(prev => prev.map(h => h.id === signOffModalHandover.id ? { ...h, status: 'Accepted' } : h));
    setSignOffModalHandover(null);
  };

  const filteredHandovers = handovers.filter(h => {
    if (filterShift === 'all') return true;
    return h.shift.toLowerCase().includes(filterShift.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <ClipboardList className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Smart Clinical Handover System (SBAR Framework)</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                SHIFT CONTINUITY
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Structured clinical transfer protocol: Situation, Background, Assessment, Recommendation, and pending tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-blue-950/80 border border-blue-700/50 px-3 py-1.5 rounded-lg">
            <span className="text-blue-300 block text-[10px]">Pending Sign-Off:</span>
            <span className="font-extrabold text-white text-base">{handovers.filter(h => h.status !== 'Accepted').length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Handover Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Initiate New Shift Handover" subtitle="Document critical inpatient status before shift conclusion" noPadding>
            {isSuccessMessage && (
              <div className="m-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Shift handover recorded and queued for incoming physician sign-off!
              </div>
            )}

            <form onSubmit={handleCreateHandover} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Patient ID & Bed</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      required
                      className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                    />
                    <input
                      type="text"
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                      required
                      placeholder="Bed"
                      className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Ward Location</label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="ICU Block A">ICU Block A</option>
                    <option value="ICU Block B">ICU Block B</option>
                    <option value="Ward 3 (Step-down)">Ward 3 (Step-down)</option>
                    <option value="Ward 4 (Post-Surg)">Ward 4 (Post-Surg)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Shift Transition</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#2563A6]"
                  >
                    <option value="Morning -> Evening">Morning &rarr; Evening</option>
                    <option value="Evening -> Night">Evening &rarr; Night</option>
                    <option value="Night -> Morning">Night &rarr; Morning</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Handing Over (Out)</label>
                  <input
                    type="text"
                    value={handoverFrom}
                    onChange={(e) => setHandoverFrom(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Receiving Doctor (In)</label>
                  <input
                    type="text"
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">SBAR: Situation & Background Summary</label>
                <textarea
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  rows={2}
                  required
                  placeholder="Primary diagnosis, interventions performed during shift, current trajectory..."
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">SBAR: Critical Watch-outs (semicolon separated)</label>
                <input
                  type="text"
                  value={criticalIssuesInput}
                  onChange={(e) => setCriticalIssuesInput(e.target.value)}
                  placeholder="e.g. Troponin spike; tachycardic episodes; monitor urine output"
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">SBAR: Pending Labs & Overdue Investigations</label>
                <input
                  type="text"
                  value={pendingLabsInput}
                  onChange={(e) => setPendingLabsInput(e.target.value)}
                  placeholder="e.g. Repeat ABG at 22:00; serum electrolytes"
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">SBAR: Recommendations & Pending Action Items</label>
                <textarea
                  value={pendingTasksInput}
                  onChange={(e) => setPendingTasksInput(e.target.value)}
                  rows={2}
                  placeholder="e.g. Check repeat ECG if chest heaviness recurs; step-down if lactate clears"
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <Button variant="primary" size="sm" type="submit" className="w-full" icon={<Send className="w-3.5 h-3.5" />}>
                Submit SBAR Handover Record
              </Button>
            </form>
          </Card>
        </div>

        {/* Handover Feed */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title={`Clinical Handover Register (${filteredHandovers.length})`}
            subtitle="Verified shift continuity records and pending sign-offs"
            noPadding
          >
            {/* Filter */}
            <div className="p-3 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold mr-1">Shift:</span>
                {['all', 'morning', 'evening', 'night'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterShift(s)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      filterShift === s
                        ? 'bg-[#2563A6] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {filteredHandovers.map(ho => {
                const isAccepted = ho.status === 'Accepted';

                return (
                  <div key={ho.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1E293B]">{ho.patientName}</span>
                          <span className="text-slate-500 text-xs">({ho.patientId} &middot; Bed {ho.bedNumber} &middot; {ho.ward})</span>
                          <Badge variant={isAccepted ? 'success' : 'warning'} size="sm">
                            {ho.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ho.shift} &middot; From: <strong>{ho.handoverFrom}</strong> &rarr; To: <strong>{ho.handoverTo}</strong> &middot; {ho.timestamp}
                        </div>
                      </div>

                      {!isAccepted && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSignOffModalHandover(ho)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Sign-off & Accept
                        </Button>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div>
                        <span className="font-bold text-[#2563A6] block text-[11px] uppercase">Situation & Background:</span>
                        <p className="text-slate-700 mt-0.5">{ho.clinicalSummary}</p>
                      </div>

                      {ho.criticalIssues && ho.criticalIssues.length > 0 && (
                        <div>
                          <span className="font-bold text-red-700 block text-[11px] uppercase">Assessment / Critical Watch-outs:</span>
                          <ul className="list-disc list-inside text-red-900 mt-0.5 space-y-0.5">
                            {ho.criticalIssues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ho.outstandingTasks && ho.outstandingTasks.length > 0 && (
                        <div>
                          <span className="font-bold text-amber-700 block text-[11px] uppercase">Recommendation & Pending Actions:</span>
                          <ul className="list-disc list-inside text-slate-700 mt-0.5 space-y-0.5">
                            {ho.outstandingTasks.map((task, idx) => (
                              <li key={idx}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Sign-off confirmation modal */}
      {signOffModalHandover && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2563A6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>Physician Handover Sign-Off</span>
              </div>
              <button 
                onClick={() => setSignOffModalHandover(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-700">
                You are acknowledging receipt of clinical custody and care responsibility for:
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div><span className="text-slate-500">Patient:</span> <strong className="text-slate-800">{signOffModalHandover.patientName} ({signOffModalHandover.patientId})</strong></div>
                <div><span className="text-slate-500">Location:</span> <strong>{signOffModalHandover.ward} &middot; Bed {signOffModalHandover.bedNumber}</strong></div>
                <div><span className="text-slate-500">Outgoing Clinician:</span> <strong>{signOffModalHandover.handoverFrom}</strong></div>
                <div><span className="text-slate-500">Incoming Attending:</span> <strong>{signOffModalHandover.handoverTo}</strong></div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                By signing, you confirm that SBAR review has been completed and critical pending labs/tasks are verified.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSignOffModalHandover(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleConfirmSignOff}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Countersign & Accept Handover
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
