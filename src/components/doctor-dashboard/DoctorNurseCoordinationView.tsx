import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  Clock, 
  Send, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  Filter,
  Search
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  INITIAL_DOCTOR_NURSE_TASKS, 
  DoctorNurseTaskItem 
} from '../../data/doctorDemoData';
import { useApp } from '../../context/AppContext';

interface DoctorNurseCoordinationViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const DoctorNurseCoordinationView: React.FC<DoctorNurseCoordinationViewProps> = ({ onNavigateTab }) => {
  const { doctorNurseTasks, createDoctorNurseTask, updateNurseTaskStatus, user } = useApp();
  const tasks = doctorNurseTasks && doctorNurseTasks.length > 0 ? doctorNurseTasks : INITIAL_DOCTOR_NURSE_TASKS;
  const [newOrderText, setNewOrderText] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('PT-8941');
  const [selectedPatientName, setSelectedPatientName] = useState('Ramesh Balan');
  const [selectedWard, setSelectedWard] = useState('ICU Block A');
  const [selectedBed, setSelectedBed] = useState('A-101');
  const [taskType, setTaskType] = useState<'Vital Check' | 'Medication Administration' | 'Lab Collection' | 'Assessment' | 'Wound Dressing'>('Assessment');
  const [priority, setPriority] = useState<'Stat (Immediate)' | 'Urgent' | 'Routine'>('Stat (Immediate)');
  const [assignedNurse, setAssignedNurse] = useState('Nurse Revathi S.');
  const [orderAddedNotice, setOrderAddedNotice] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderText.trim()) return;

    createDoctorNurseTask({
      instruction: newOrderText.trim(),
      patientName: selectedPatientName,
      patientId: selectedPatientId,
      ward: selectedWard,
      bed: selectedBed,
      taskType,
      priority,
      doctorName: user?.name || 'Dr. Sundaramoorthy M.',
      assignedNurse
    });

    setNewOrderText('');
    setOrderAddedNotice(true);
    setTimeout(() => setOrderAddedNotice(false), 3500);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const nextStatus = target.status === 'Pending' ? 'In Progress' : target.status === 'In Progress' ? 'Completed' : 'Pending';
    updateNurseTaskStatus({
      taskId,
      status: nextStatus,
      nurseObservation: nextStatus === 'Completed' ? 'Task verified and completed at bedside.' : undefined
    });
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'pending' ? t.status === 'Pending' :
      filterStatus === 'in_progress' ? t.status === 'In Progress' :
      filterStatus === 'completed' ? t.status === 'Completed' :
      filterStatus === 'stat' ? t.priority.includes('Stat') : true;

    const matchesSearch = 
      t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.instruction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bed.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <Users className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Doctor–Nurse Coordination & Clinical Order Communications</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                CLOSED-LOOP ORDERS
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL DEMO MODE
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Real-time physician orders, nurse acknowledgments, and bedside execution timestamps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-blue-950/80 border border-blue-700/50 px-3 py-1.5 rounded-lg">
            <span className="text-blue-300 block text-[10px]">Active Orders:</span>
            <span className="font-extrabold text-white text-base">{tasks.filter(t => t.status !== 'Completed').length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Entry Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Direct Physician Clinical Order" subtitle="Dispatch STAT, urgent, or routine bedside directives" noPadding>
            {orderAddedNotice && (
              <div className="m-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Physician order dispatched and notified on ward nurse console!
              </div>
            )}

            <form onSubmit={handleAddOrder} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={selectedPatientName}
                    onChange={(e) => setSelectedPatientName(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Patient ID & Bed</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                      className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                    />
                    <input
                      type="text"
                      value={selectedBed}
                      onChange={(e) => setSelectedBed(e.target.value)}
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
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="ICU Block A">ICU Block A</option>
                    <option value="ICU Block B">ICU Block B</option>
                    <option value="Ward 3 (Step-down)">Ward 3 (Step-down)</option>
                    <option value="Ward 4 (Post-Surg)">Ward 4 (Post-Surg)</option>
                    <option value="Emergency Bay">Emergency Bay</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Order Category</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as any)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Assessment">Assessment & Telemetry</option>
                    <option value="Vital Check">Serial Vital Check</option>
                    <option value="Medication Administration">Medication Administration</option>
                    <option value="Lab Collection">Lab Collection</option>
                    <option value="Wound Dressing">Wound Dressing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Priority / Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-bold text-red-600"
                  >
                    <option value="Stat (Immediate)">STAT (Immediate)</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Assigned Bedside Nurse</label>
                  <input
                    type="text"
                    value={assignedNurse}
                    onChange={(e) => setAssignedNurse(e.target.value)}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Direct Physician Clinical Order</label>
                <textarea
                  value={newOrderText}
                  onChange={(e) => setNewOrderText(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g. Draw repeat arterial blood gas (ABG) in 60 mins; record MAP every 15 mins; titrate Noradrenaline infusion..."
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <Button variant="primary" size="sm" type="submit" className="w-full" icon={<Send className="w-3.5 h-3.5" />}>
                Transmit Order to Nurse Station
              </Button>
            </form>
          </Card>
        </div>

        {/* Task Board / Table */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title={`Active Clinical Orders Feed (${filteredTasks.length})`}
            subtitle="Closed-loop physician-nurse coordination tracker"
            noPadding
          >
            {/* Filter and Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'pending', 'in_progress', 'completed', 'stat'].map(filterKey => (
                  <button
                    key={filterKey}
                    onClick={() => setFilterStatus(filterKey)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      filterStatus === filterKey
                        ? 'bg-[#2563A6] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {filterKey === 'all' ? 'All Orders' :
                     filterKey === 'pending' ? 'Pending' :
                     filterKey === 'in_progress' ? 'In Progress' :
                     filterKey === 'completed' ? 'Completed' : 'STAT Only'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2563A6]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {filteredTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No orders match current filter criteria.
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isStat = task.priority.includes('Stat');
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div key={task.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#1E293B]">{task.patientName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({task.patientId} &middot; Bed {task.bed})</span>
                          <span className="text-xs text-slate-600">{task.ward}</span>
                          <Badge variant={isStat ? 'critical' : task.priority === 'Urgent' ? 'warning' : 'primary'} size="sm">
                            {task.priority}
                          </Badge>
                          <Badge 
                            variant={isCompleted ? 'success' : task.status === 'In Progress' ? 'warning' : 'neutral'} 
                            size="sm"
                          >
                            {task.status}
                          </Badge>
                        </div>

                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`text-xs px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                            isCompleted 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-blue-50 text-[#2563A6] hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : task.status === 'In Progress' ? 'Mark Completed' : 'Acknowledge Order'}
                        </button>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800">
                        {task.instruction}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div>
                          Ordered by <strong>{task.doctorName}</strong> &rarr; Assigned to <strong>{task.assignedNurse}</strong>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{task.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
