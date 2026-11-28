import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Filter, 
  Search, 
  ChevronRight, 
  Heart, 
  Wind, 
  ArrowUpRight,
  Flame,
  Radio
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  INITIAL_CLINICAL_PATIENTS, 
  PatientDigitalTwin, 
  ClinicalRiskLevel 
} from '../../data/doctorDemoData';
import { useApp } from '../../context/AppContext';

interface DeteriorationRadarViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const DeteriorationRadarView: React.FC<DeteriorationRadarViewProps> = ({ onNavigateTab }) => {
  const { patients: contextPatients } = useApp();
  const patients = contextPatients && contextPatients.length > 0 ? contextPatients : INITIAL_CLINICAL_PATIENTS;
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const countCritical = patients.filter(p => p.riskLevel === 'Critical').length;
  const countHigh = patients.filter(p => p.riskLevel === 'High Risk').length;
  const countNeedsAttention = patients.filter(p => p.riskLevel === 'Needs Attention').length;
  const countStable = patients.filter(p => p.riskLevel === 'Stable').length;

  const wards = Array.from(new Set(patients.map(p => p.ward)));

  const filteredPatients = patients.filter(p => {
    const matchesRisk = filterRisk === 'all' || p.riskLevel === filterRisk;
    const matchesWard = filterWard === 'all' || p.ward === filterWard;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesWard && matchesSearch;
  });

  const getRiskColor = (level: ClinicalRiskLevel) => {
    switch (level) {
      case 'Critical': return 'border-red-500 bg-red-50/40 text-red-700';
      case 'High Risk': return 'border-amber-500 bg-amber-50/40 text-amber-700';
      case 'Needs Attention': return 'border-blue-500 bg-blue-50/40 text-blue-700';
      case 'Stable': return 'border-emerald-500 bg-emerald-50/40 text-emerald-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Radar Pulse Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Patient Deterioration Radar</h3>
                <span className="bg-red-500/30 text-red-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-red-500/40">
                  AI TELEMETRY RADAR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Multi-parameter MEWS physiological tracking detecting acute inpatient decompensation
              </p>
            </div>
          </div>

          {/* Radar Metric Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterRisk('Critical')}
              className="px-3 py-1.5 rounded-lg bg-red-600/30 border border-red-500/40 text-red-200 text-xs font-bold hover:bg-red-600/40 transition-colors"
            >
              Critical: {countCritical}
            </button>
            <button
              onClick={() => setFilterRisk('High Risk')}
              className="px-3 py-1.5 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold hover:bg-amber-600/40 transition-colors"
            >
              High Risk: {countHigh}
            </button>
            <button
              onClick={() => setFilterRisk('Needs Attention')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold hover:bg-blue-600/40 transition-colors"
            >
              Attention: {countNeedsAttention}
            </button>
            <button
              onClick={() => setFilterRisk('Stable')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold hover:bg-emerald-600/40 transition-colors"
            >
              Stable: {countStable}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, ID, or diagnosis..."
              className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
          >
            <option value="all">All Risk Levels ({patients.length})</option>
            <option value="Critical">Critical Tier ({countCritical})</option>
            <option value="High Risk">High Risk ({countHigh})</option>
            <option value="Needs Attention">Needs Attention ({countNeedsAttention})</option>
            <option value="Stable">Stable ({countStable})</option>
          </select>

          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white font-semibold text-[#1E293B]"
          >
            <option value="all">All Wards</option>
            {wards.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Deterioration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(patient => {
          const isCritical = patient.riskLevel === 'Critical';
          const isHigh = patient.riskLevel === 'High Risk';

          return (
            <div
              key={patient.patientId}
              className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
                isCritical ? 'border-red-400' :
                isHigh ? 'border-amber-400' :
                patient.riskLevel === 'Needs Attention' ? 'border-blue-300' : 'border-slate-200'
              }`}
            >
              {/* Top Accent Strip */}
              <div className={`h-1.5 w-full absolute top-0 left-0 ${
                isCritical ? 'bg-red-500' :
                isHigh ? 'bg-amber-500' :
                patient.riskLevel === 'Needs Attention' ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />

              <div className="flex items-start justify-between gap-2 mt-1">
                <div>
                  <h4 className="font-bold text-sm text-[#1E293B]">{patient.name}</h4>
                  <div className="text-[11px] text-slate-500">
                    {patient.patientId} &middot; {patient.age}y {patient.gender} &middot; {patient.bloodGroup}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={
                      isCritical ? 'critical' :
                      isHigh ? 'warning' :
                      patient.riskLevel === 'Needs Attention' ? 'primary' : 'success'
                    }
                    size="sm"
                  >
                    {patient.riskLevel}
                  </Badge>
                  <div className="text-[10px] font-mono font-bold text-purple-700 mt-1">
                    MEWS: {patient.mewsScore}/14
                  </div>
                </div>
              </div>

              {/* Location & Diagnosis */}
              <div className="my-3 py-2 px-3 bg-slate-50 rounded-lg text-xs">
                <div className="font-semibold text-[#1E293B] flex items-center justify-between">
                  <span>{patient.ward}</span>
                  <span className="text-[#2563A6] font-mono">Bed {patient.bedNumber}</span>
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5 truncate" title={patient.primaryDiagnosis}>
                  {patient.primaryDiagnosis}
                </div>
              </div>

              {/* Vitals Telemetry Box */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 border-t border-b border-[#E2E8F0] my-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">HR</span>
                  <span className={`font-extrabold ${patient.currentVitals.heartRate > 100 ? 'text-red-600' : 'text-[#1E293B]'}`}>
                    {patient.currentVitals.heartRate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">BP</span>
                  <span className={`font-bold ${patient.currentVitals.systolicBP > 140 || patient.currentVitals.systolicBP < 90 ? 'text-amber-600' : 'text-[#1E293B]'}`}>
                    {patient.currentVitals.systolicBP}/{patient.currentVitals.diastolicBP}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className={`font-extrabold ${patient.currentVitals.spO2 < 92 ? 'text-red-600' : 'text-blue-600'}`}>
                    {patient.currentVitals.spO2}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">GCS</span>
                  <span className="font-bold text-purple-700">
                    {patient.currentVitals.gcsScore}/15
                  </span>
                </div>
              </div>

              {/* Data Contribution Explanation */}
              <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 leading-tight">
                <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">Contributing Clinical Factors:</span>
                {patient.currentVitals.spO2 < 93 && <span className="text-red-700 font-semibold block">&bull; SpO2 {patient.currentVitals.spO2}% below 93% threshold</span>}
                {patient.currentVitals.heartRate > 100 && <span className="text-red-700 font-semibold block">&bull; Tachycardia (HR {patient.currentVitals.heartRate} bpm)</span>}
                {(patient.currentVitals.systolicBP > 140 || patient.currentVitals.systolicBP < 90) && (
                  <span className="text-amber-700 font-semibold block">&bull; Hemodynamic deviation (BP {patient.currentVitals.systolicBP}/{patient.currentVitals.diastolicBP})</span>
                )}
                {patient.mewsScore >= 4 && <span className="text-purple-700 font-semibold block">&bull; High acuity MEWS score ({patient.mewsScore}/14)</span>}
                {patient.currentVitals.spO2 >= 93 && patient.currentVitals.heartRate <= 100 && patient.mewsScore < 4 && (
                  <span className="text-emerald-700 font-semibold block">&bull; Baseline stable vitals within normal clinical limits</span>
                )}
              </div>

              {/* Direct Actions */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('digital_twin', patient.patientId)}
                  className="text-[#2563A6] hover:underline font-bold flex items-center gap-1"
                >
                  Digital Twin &rarr;
                </button>

                {isCritical && (
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('early_warning')}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    Escalate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
