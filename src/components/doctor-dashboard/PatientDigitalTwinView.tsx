import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Pill, 
  ShieldAlert, 
  Save, 
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Stethoscope,
  Info,
  Search
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  PatientDigitalTwin, 
  INITIAL_CLINICAL_PATIENTS,
  ClinicalRiskLevel 
} from '../../data/doctorDemoData';
import { useApp } from '../../context/AppContext';
import { hospitalDataService } from '../../services/hospitalDataService';

interface PatientDigitalTwinViewProps {
  onNavigateTab?: (tabId: string) => void;
  initialPatientId?: string;
}

export const PatientDigitalTwinView: React.FC<PatientDigitalTwinViewProps> = ({ 
  onNavigateTab, 
  initialPatientId 
}) => {
  const { patients: contextPatients, user } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.patientId || 'PT-8941'
  );
  const [viewMode, setViewMode] = useState<'twin' | 'directory'>('twin');
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [assignedOnly, setAssignedOnly] = useState(false);

  React.useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
      setViewMode('twin');
    }
  }, [initialPatientId]);
  const [activeTab, setActiveTab] = useState<'vitals' | 'profile' | 'meds' | 'labs' | 'timeline' | 'notes'>('vitals');
  const [editableNotes, setEditableNotes] = useState<string>('');
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  React.useEffect(() => {
    if (currentPatient) {
      setEditableNotes(currentPatient.doctorNotes || '');
    }
  }, [currentPatient?.patientId]);

  const handleSaveNotes = () => {
    if (!currentPatient) return;
    hospitalDataService.admitOrUpdatePatient({
      patientId: currentPatient.patientId,
      name: currentPatient.name,
      doctorNotes: editableNotes,
      timeline: [
        {
          id: 'ev-' + Date.now(),
          timestamp: 'Just now',
          date: new Date().toISOString().split('T')[0],
          category: 'Physician Note',
          title: 'Clinical Progress Note Updated',
          description: editableNotes.slice(0, 80) + '...',
          actor: user?.name || 'Dr. Sundaramoorthy M. (Attending)',
          severity: 'normal'
        },
        ...(currentPatient.timeline || [])
      ]
    });
    setNotesSavedNotice(true);
    setTimeout(() => setNotesSavedNotice(false), 3000);
  };

  const getRiskBadgeVariant = (level: ClinicalRiskLevel): 'critical' | 'warning' | 'primary' | 'success' => {
    switch (level) {
      case 'Critical': return 'critical';
      case 'High Risk': return 'warning';
      case 'Needs Attention': return 'primary';
      case 'Stable': return 'success';
      default: return 'primary';
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWard = wardFilter === 'all' || p.ward.toLowerCase().includes(wardFilter.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    const matchesAssigned = !assignedOnly || (p.attendingPhysician?.includes('Sundar') || p.attendingPhysician === user?.name);
    return matchesSearch && matchesWard && matchesRisk && matchesAssigned;
  });

  return (
    <div className="space-y-6">
      {/* Top Mode Toggle & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-[#CBD5E1] rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('twin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'twin'
                ? 'bg-[#2563A6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Digital Twin Dossier
          </button>
          <button
            onClick={() => setViewMode('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'directory'
                ? 'bg-[#2563A6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Patients Directory ({patients.length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, ID, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="all">All Wards</option>
            <option value="ICU">ICU Blocks</option>
            <option value="HDU">HDU</option>
            <option value="Ward 3">Ward 3</option>
            <option value="Emergency">Emergency</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="all">All Acuities</option>
            <option value="Critical">Critical</option>
            <option value="High Risk">High Risk</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Stable">Stable</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={assignedOnly}
              onChange={(e) => setAssignedOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span>Assigned to Me</span>
          </label>
        </div>
      </div>

      {/* Directory View Mode */}
      {viewMode === 'directory' ? (
        <Card title="Patient Registry & Electronic Medical Dossiers" subtitle="Inpatients and emergency admissions under clinical supervision" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Patient Name & ID</th>
                  <th className="px-4 py-3">Ward & Bed</th>
                  <th className="px-4 py-3">Acuity / MEWS</th>
                  <th className="px-4 py-3">Primary Diagnosis</th>
                  <th className="px-4 py-3">Vitals (HR / SpO2 / BP)</th>
                  <th className="px-4 py-3">Attending Doctor</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No patients match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(p => (
                    <tr key={p.patientId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#1E293B]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.patientId} &middot; {p.age}y {p.gender} &middot; {p.bloodGroup}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">{p.ward}</span>
                        <span className="text-[10px] text-slate-500 block">Bed {p.bedNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getRiskBadgeVariant(p.riskLevel)} size="sm">
                            {p.riskLevel}
                          </Badge>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                            MEWS {p.mewsScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium truncate max-w-xs" title={p.primaryDiagnosis}>
                          {p.primaryDiagnosis}
                        </div>
                        <span className="text-[10px] text-blue-600 font-mono">{p.icd10}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="text-slate-700">{p.currentVitals?.heartRate} bpm</span> &middot;{' '}
                        <span className={p.currentVitals?.spO2 < 93 ? 'text-red-600 font-bold' : 'text-blue-600'}>{p.currentVitals?.spO2}%</span> &middot;{' '}
                        <span className="text-slate-600">{p.currentVitals?.systolicBP}/{p.currentVitals?.diastolicBP}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.attendingPhysician}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedPatientId(p.patientId);
                            setViewMode('twin');
                          }}
                        >
                          View Dossier &rarr;
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Digital Twin Dossier View */
        <>
      {/* Patient Header & Selector */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563A6] flex items-center justify-center font-bold text-lg border-2 border-blue-200">
              {currentPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-[#1E293B]">{currentPatient.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                  {currentPatient.patientId}
                </span>
                <Badge variant={getRiskBadgeVariant(currentPatient.riskLevel)} size="sm">
                  {currentPatient.riskLevel.toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  MEWS: {currentPatient.mewsScore} / 14
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentPatient.resuscitationStatus}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {currentPatient.age} yrs &middot; {currentPatient.gender} &middot; Blood {currentPatient.bloodGroup} &middot; 
                Admitted: {currentPatient.admissionDate} &middot; <strong>{currentPatient.ward}</strong> (Bed {currentPatient.bedNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[#64748B] whitespace-nowrap">Switch Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-2 bg-white text-[#1E293B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
            >
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientId} — {p.name} ({p.riskLevel} - {p.ward})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diagnostic Snapshot Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Primary Clinical Diagnosis</span>
            <span className="font-bold text-[#1E293B] mt-0.5 block truncate" title={currentPatient.primaryDiagnosis}>
              {currentPatient.primaryDiagnosis}
            </span>
            <span className="text-[10px] font-mono text-blue-600 font-semibold">{currentPatient.icd10}</span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[11px]">Attending Physician</span>
            <span className="font-bold text-[#1E293B] mt-0.5 block">{currentPatient.attendingPhysician}</span>
            <span className="text-[10px] text-slate-500">Nurse: {currentPatient.assignedNurse}</span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[11px]">Documented Allergies</span>
            {currentPatient.allergies.length > 0 ? (
              <span className="font-bold text-red-600 mt-0.5 block truncate">
                {currentPatient.allergies.map(a => a.allergen).join(', ')}
              </span>
            ) : (
              <span className="font-bold text-[#15803D] mt-0.5 block">No Known Allergies (NKDA)</span>
            )}
            <span className="text-[10px] text-slate-500">{currentPatient.allergies.length} recorded flags</span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[11px]">Discharge Readiness</span>
            <span className={`font-bold mt-0.5 block ${currentPatient.dischargeReady ? 'text-[#15803D]' : 'text-amber-600'}`}>
              {currentPatient.dischargeReady ? 'Ready for Step-Down / Discharge' : 'Requires Inpatient Critical Care'}
            </span>
            {onNavigateTab && (
              <button 
                onClick={() => onNavigateTab('discharge_intelligence')}
                className="text-[10px] text-[#2563A6] hover:underline font-semibold"
              >
                Open Checklist &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Digital Twin Sub-navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'vitals' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Physiological Telemetry & Vitals
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'profile' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Medical History & Diagnoses
        </button>

        <button
          onClick={() => setActiveTab('meds')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'meds' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Pill className="w-4 h-4" />
          Active Medications ({currentPatient.medications.length})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'labs' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Droplet className="w-4 h-4" />
          Diagnostic Labs ({currentPatient.labs.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'timeline' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Clinical Journey Timeline
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'notes' 
              ? 'border-[#2563A6] text-[#2563A6] font-bold bg-blue-50/50' 
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Physician Notes & CDS
        </button>
      </div>

      {/* Tab 1: Vitals Telemetry */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Heart Rate */}
            <div className={`p-4 rounded-xl border ${
              currentPatient.currentVitals.heartRate > 100 || currentPatient.currentVitals.heartRate < 60
                ? 'bg-red-50/80 border-red-200'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Heart Rate</span>
                <Heart className={`w-4 h-4 ${
                  currentPatient.currentVitals.heartRate > 100 ? 'text-red-600 animate-pulse' : 'text-slate-400'
                }`} />
              </div>
              <div className="text-2xl font-extrabold text-[#1E293B] mt-2">
                {currentPatient.currentVitals.heartRate} <span className="text-xs font-normal text-slate-500">bpm</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Normal: 60-100</div>
            </div>

            {/* Blood Pressure */}
            <div className={`p-4 rounded-xl border ${
              currentPatient.currentVitals.systolicBP > 140 || currentPatient.currentVitals.systolicBP < 90
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Blood Pressure</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-[#1E293B] mt-2">
                {currentPatient.currentVitals.systolicBP}/{currentPatient.currentVitals.diastolicBP}
                <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Target: 120/80</div>
            </div>

            {/* SpO2 */}
            <div className={`p-4 rounded-xl border ${
              currentPatient.currentVitals.spO2 < 92
                ? 'bg-red-50/80 border-red-200'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>SpO2 Oxygen</span>
                <Wind className={`w-4 h-4 ${
                  currentPatient.currentVitals.spO2 < 92 ? 'text-red-600' : 'text-blue-500'
                }`} />
              </div>
              <div className={`text-2xl font-extrabold mt-2 ${
                currentPatient.currentVitals.spO2 < 92 ? 'text-red-600' : 'text-[#1E293B]'
              }`}>
                {currentPatient.currentVitals.spO2}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Target: &ge; 95%</div>
            </div>

            {/* Respiratory Rate */}
            <div className={`p-4 rounded-xl border ${
              currentPatient.currentVitals.respiratoryRate > 22 || currentPatient.currentVitals.respiratoryRate < 10
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Resp. Rate</span>
                <Wind className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-[#1E293B] mt-2">
                {currentPatient.currentVitals.respiratoryRate} <span className="text-xs font-normal text-slate-500">/min</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Normal: 12-20</div>
            </div>

            {/* Temperature */}
            <div className={`p-4 rounded-xl border ${
              currentPatient.currentVitals.temperature > 38.0
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Temperature</span>
                <Thermometer className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-[#1E293B] mt-2">
                {currentPatient.currentVitals.temperature}&deg;C
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Normal: 36.5 - 37.5</div>
            </div>

            {/* GCS */}
            <div className="p-4 rounded-xl border bg-white border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Glasgow Coma</span>
                <BrainCircuit className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-[#1E293B] mt-2">
                {currentPatient.currentVitals.gcsScore} <span className="text-xs font-normal text-slate-500">/ 15</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {currentPatient.currentVitals.gcsScore === 15 ? 'Fully Alert' : 'Altered Sensorium'}
              </div>
            </div>
          </div>

          {/* Vitals History Log Table */}
          <Card
            title="Telemetry Trend Stream (Last 24 Hours)"
            subtitle="Continuous bedside monitor telemetry synchronized every 4 hours"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">HR (bpm)</th>
                    <th className="px-4 py-3">BP (mmHg)</th>
                    <th className="px-4 py-3">SpO2 (%)</th>
                    <th className="px-4 py-3">RR (/min)</th>
                    <th className="px-4 py-3">Temp (&deg;C)</th>
                    <th className="px-4 py-3">GCS</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {currentPatient.vitals.map((v, idx) => (
                    <tr key={idx} className={v.isAbnormal ? 'bg-red-50/40' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">{v.timestamp}</td>
                      <td className={`px-4 py-3 ${v.heartRate > 100 || v.heartRate < 60 ? 'font-bold text-red-600' : ''}`}>
                        {v.heartRate}
                      </td>
                      <td className={`px-4 py-3 ${v.systolicBP > 140 || v.systolicBP < 90 ? 'font-bold text-amber-600' : ''}`}>
                        {v.systolicBP}/{v.diastolicBP}
                      </td>
                      <td className={`px-4 py-3 ${v.spO2 < 92 ? 'font-bold text-red-600' : ''}`}>
                        {v.spO2}%
                      </td>
                      <td className="px-4 py-3">{v.respiratoryRate}</td>
                      <td className="px-4 py-3">{v.temperature}&deg;C</td>
                      <td className="px-4 py-3">{v.gcsScore}/15</td>
                      <td className="px-4 py-3">
                        {v.isAbnormal ? (
                          <Badge variant="critical" size="sm">Abnormal Flag</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Stable</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Profile & History */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Clinical Diagnoses & Problem List" noPadding>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Primary Diagnosis:</span>
                <div className="text-sm font-bold text-[#1E293B] mt-1 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                  {currentPatient.primaryDiagnosis} ({currentPatient.icd10})
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Secondary / Comorbid Diagnoses:</span>
                <ul className="mt-1.5 space-y-1.5">
                  {currentPatient.secondaryDiagnoses.map((sec, i) => (
                    <li key={i} className="flex items-center gap-2 text-[#334155] p-2 bg-slate-50 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6]" />
                      <span>{sec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Nursing & Clinical Observations:</span>
                <p className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[#475569] leading-relaxed">
                  {currentPatient.clinicalObservations}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Medical, Surgical History & Allergies" noPadding>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Known Drug / Food Allergies:</span>
                {currentPatient.allergies.length > 0 ? (
                  <div className="mt-1.5 space-y-2">
                    {currentPatient.allergies.map((a, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                        <div>
                          <strong className="text-red-700">{a.allergen}</strong>
                          <span className="text-red-600 block text-[11px]">Reaction: {a.reaction}</span>
                        </div>
                        <Badge variant="critical" size="sm">{a.severity.toUpperCase()}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 p-2.5 bg-green-50 text-[#15803D] rounded border border-green-200 font-semibold">
                    No documented allergies (NKDA)
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Past Medical History:</span>
                <ul className="mt-1.5 space-y-1 text-slate-700">
                  {currentPatient.medicalHistory.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase">Past Surgical History:</span>
                <ul className="mt-1.5 space-y-1 text-slate-700">
                  {currentPatient.surgicalHistory.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Medications */}
      {activeTab === 'meds' && (
        <Card
          title="Active Medication Administration Record (e-MAR)"
          subtitle="Currently scheduled inpatient pharmacological therapy"
          action={
            onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('medication_safety')}
                icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
              >
                Check Drug Interactions
              </Button>
            )
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Medication Name</th>
                  <th className="px-4 py-3">Dosage & Route</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Indication</th>
                  <th className="px-4 py-3">Prescriber</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {currentPatient.medications.map(med => (
                  <tr key={med.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1E293B]">{med.name}</div>
                      <div className="text-[10px] text-slate-400">Started: {med.startDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#2563A6]">{med.dosage}</span> ({med.route})
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{med.frequency}</td>
                    <td className="px-4 py-3 text-[#64748B]">{med.indication}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{med.prescribingDoctor}</td>
                    <td className="px-4 py-3">
                      <Badge variant={med.status === 'Active' ? 'success' : 'warning'} size="sm">
                        {med.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Labs */}
      {activeTab === 'labs' && (
        <Card
          title="Diagnostic Laboratory Findings & Panic Alerts"
          subtitle="Hematology, biochemistry, ABG, and cardiac biomarkers"
          action={
            onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('lab_intelligence')}
                icon={<Droplet className="w-3.5 h-3.5 text-blue-600" />}
              >
                Open Full Lab Intelligence
              </Button>
            )
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Test Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Result Value</th>
                  <th className="px-4 py-3">Reference Range</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {currentPatient.labs.map(lab => (
                  <tr key={lab.id} className={lab.status === 'Critical Panic' ? 'bg-red-50/60' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1E293B]">{lab.testName}</div>
                      {lab.notes && <div className="text-[10px] text-slate-500">{lab.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{lab.category}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${
                      lab.status === 'Critical Panic' ? 'text-red-700 text-sm' :
                      lab.status === 'Abnormal' ? 'text-amber-700' : 'text-[#1E293B]'
                    }`}>
                      {lab.value} {lab.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{lab.referenceRange}</td>
                    <td className="px-4 py-3 text-slate-500">{lab.timestamp}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={
                          lab.status === 'Critical Panic' ? 'critical' :
                          lab.status === 'Abnormal' ? 'warning' : 'success'
                        } 
                        size="sm"
                      >
                        {lab.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <Card
          title="Clinical Journey Timeline"
          subtitle="Chronological audit of admissions, alerts, medications, and procedure milestones"
          noPadding
        >
          <div className="p-6">
            <div className="relative border-l-2 border-blue-200 ml-4 space-y-6">
              {currentPatient.timeline.map((event) => (
                <div key={event.id} className="relative pl-6">
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                  }`} />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#1E293B]">{event.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {event.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{event.timestamp} &middot; {event.date}</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    {event.description}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1">Logged by: {event.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tab 6: Notes & CDS */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <Card
            title="Attending Physician Progress Notes & Directives"
            subtitle="Editable clinical impressions and inpatient treatment plan"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNotes}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Notes
              </Button>
            }
          >
            {notesSavedNotice && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-[#15803D] rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Physician progress note successfully saved to clinical record and timeline!
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#1E293B]">Clinical Impression & Plan</label>
              <textarea
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                rows={8}
                className="w-full text-xs p-3 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] font-mono leading-relaxed bg-[#F8FAFC]"
                placeholder="Document clinical findings, assessments, plan changes, and step-down directives..."
              />
            </div>
          </Card>

          {/* AI Clinical Assistant Recommendation Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-2 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#1E293B]">AI Clinical Assistant Insight & Recommendations</h4>
                  <span className="text-[10px] bg-blue-100 text-[#2563A6] px-2 py-0.5 rounded font-mono font-semibold">
                    CONFIDENCE 94%
                  </span>
                </div>
                <p className="text-[#334155] leading-relaxed">
                  Patient exhibits elevated MEWS score ({currentPatient.mewsScore}/14) driven by tachycardia and abnormal lab indices.
                  Target MAP &gt; 65 mmHg with IV fluid maintenance. Monitor serial cardiac enzymes and repeat ABG in 2 hours.
                </p>
                {onNavigateTab && (
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => onNavigateTab('ai_assistant')}
                      className="text-xs text-[#2563A6] font-bold hover:underline flex items-center gap-1"
                    >
                      Open AI Clinical Assistant &rarr;
                    </button>
                    <button
                      onClick={() => onNavigateTab('ai_summarizer')}
                      className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Generate 9-Point Case Summary &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
