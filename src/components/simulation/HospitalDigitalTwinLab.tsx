import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Play, 
  RotateCcw, 
  Activity, 
  Bed, 
  Wind, 
  Users, 
  Droplet, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  Download, 
  Copy, 
  Sliders, 
  Sparkles, 
  Layers, 
  BrainCircuit, 
  HelpCircle, 
  Save, 
  FolderOpen, 
  ArrowRight, 
  FileText, 
  Share2, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  X,
  Stethoscope,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  DepartmentDigitalTwin, 
  SimulationScenarioParameters, 
  SimulationRunResult,
  UserRole 
} from '../../types';
import { 
  INITIAL_HOSPITAL_DIGITAL_TWIN, 
  PREDEFINED_SIMULATION_SCENARIOS, 
  PRESET_WHAT_IF_QUERIES, 
  SIMULATION_SANDBOX_DISCLAIMER 
} from '../../data/simulationLabData';
import { SimulationEngine } from '../../services/simulationEngine';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface HospitalDigitalTwinLabProps {
  onSelectTab?: (tabId: string) => void;
  onNavigateTab?: (tabId: string) => void;
  activeRole?: UserRole;
}

export const HospitalDigitalTwinLab: React.FC<HospitalDigitalTwinLabProps> = ({
  onSelectTab,
  onNavigateTab,
  activeRole
}) => {
  const { user, beds, equipment } = useApp();
  const role: UserRole = activeRole || user?.role || 'admin';

  // Active view tab inside Digital Twin Lab
  const [activeTab, setActiveTab] = useState<'twin' | 'builder' | 'impact' | 'strategies' | 'readiness' | 'library'>('twin');

  // Digital Twin departments state
  const [departments, setDepartments] = useState<DepartmentDigitalTwin[]>(INITIAL_HOSPITAL_DIGITAL_TWIN);

  // Active scenario for simulation
  const [activeScenario, setActiveScenario] = useState<SimulationScenarioParameters>(PREDEFINED_SIMULATION_SCENARIOS[0]);

  // Current simulation run results
  const [simulationResult, setSimulationResult] = useState<SimulationRunResult>(() => 
    SimulationEngine.runSimulation(PREDEFINED_SIMULATION_SCENARIOS[0], INITIAL_HOSPITAL_DIGITAL_TWIN, beds, equipment)
  );

  // Historical saved simulations library
  const [savedSimulations, setSavedSimulations] = useState<Array<{ id: string; title: string; date: string; scenario: SimulationScenarioParameters; result: SimulationRunResult }>>([
    {
      id: 'SAVED-001',
      title: 'Mass Casualty Highway Collision (Baseline Drill)',
      date: 'Today, 10:30 AM',
      scenario: PREDEFINED_SIMULATION_SCENARIOS[0],
      result: SimulationEngine.runSimulation(PREDEFINED_SIMULATION_SCENARIOS[0], INITIAL_HOSPITAL_DIGITAL_TWIN, beds, equipment)
    },
    {
      id: 'SAVED-002',
      title: 'Toxic Vapor Influx (Drill A)',
      date: 'Yesterday, 16:45 PM',
      scenario: PREDEFINED_SIMULATION_SCENARIOS[1],
      result: SimulationEngine.runSimulation(PREDEFINED_SIMULATION_SCENARIOS[1], INITIAL_HOSPITAL_DIGITAL_TWIN, beds, equipment)
    }
  ]);

  // Export report modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Trigger simulation run
  const handleExecuteSimulation = (scenarioToRun: SimulationScenarioParameters = activeScenario) => {
    const res = SimulationEngine.runSimulation(scenarioToRun, departments, beds, equipment);
    setSimulationResult(res);
    setToastMsg(`Simulation "${scenarioToRun.title}" executed. Readiness Score: ${res.readinessScore}%.`);
    setActiveTab('impact');
  };

  // Quick preset loader
  const handleSelectPreset = (preset: SimulationScenarioParameters) => {
    setActiveScenario(preset);
    const res = SimulationEngine.runSimulation(preset, departments, beds, equipment);
    setSimulationResult(res);
    setToastMsg(`Loaded scenario "${preset.title}". Simulation updated.`);
  };

  // Quick What-If question handler
  const handleSelectWhatIf = (scenarioId: string) => {
    const matched = PREDEFINED_SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (matched) {
      handleSelectPreset(matched);
      setActiveTab('impact');
    }
  };

  // Reset to live baseline
  const handleResetToBaseline = () => {
    setDepartments(INITIAL_HOSPITAL_DIGITAL_TWIN);
    const baseScenario = PREDEFINED_SIMULATION_SCENARIOS[0];
    setActiveScenario(baseScenario);
    const res = SimulationEngine.runSimulation(baseScenario, INITIAL_HOSPITAL_DIGITAL_TWIN, beds, equipment);
    setSimulationResult(res);
    setToastMsg('Reset simulation state to real-time hospital baseline.');
  };

  // Save current simulation to library
  const handleSaveToLibrary = () => {
    const newEntry = {
      id: `SAVED-${Date.now()}`,
      title: activeScenario.title,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scenario: activeScenario,
      result: simulationResult
    };
    setSavedSimulations(prev => [newEntry, ...prev]);
    setToastMsg(`Simulation "${activeScenario.title}" saved to library.`);
  };

  // Open Export Modal
  const handleOpenExportModal = () => {
    const report = SimulationEngine.generateExportReport(simulationResult, activeScenario);
    setExportContent(report);
    setIsExportModalOpen(true);
  };

  // Download Report
  const handleDownloadReport = () => {
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediSync_Simulation_${activeScenario.id}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMsg('Simulation report downloaded successfully.');
  };

  // Copy to clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(exportContent);
    setToastMsg('Simulation report copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{toastMsg}</p>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & DIGITAL TWIN SANDBOX CONTROLLER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/90 text-white uppercase tracking-wider border border-indigo-400/30">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-200" />
                Hospital Digital Twin Sandbox
              </span>
              <span className="text-xs text-indigo-300 font-mono bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                Live Data Decoupled: Safe Simulation Mode
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Real Hospital Records Protected
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Hospital Digital Twin & Emergency Simulation Lab
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Virtual digital twin topology of hospital beds, ventilators, and staff. Run multi-variable stress tests, what-if emergency surges, and test resource reallocations without impacting live operations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleResetToBaseline}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Baseline
            </button>

            <button
              onClick={handleOpenExportModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>

            {role === 'admin' && (
              <button
                onClick={() => handleExecuteSimulation()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Stress Test
              </button>
            )}
          </div>
        </div>

        {/* ISOLATION DISCLAIMER NOTICE */}
        <div className="mt-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <span>{SIMULATION_SANDBOX_DISCLAIMER}</span>
        </div>
      </div>

      {/* QUICK WHAT-IF PROMPT SELECTOR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Instant What-If Questions (One-Click Crisis Simulation)
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRESET_WHAT_IF_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectWhatIf(q.scenarioId)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors whitespace-nowrap text-left"
            >
              "{q.label}"
            </button>
          ))}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('twin')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'twin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Hospital Digital Twin Overview
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'builder'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Scenario Builder & Stress Test
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'impact'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Resource Impact Analysis
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              simulationResult.readinessScore < 70 ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {simulationResult.readinessScore}% Ready
            </span>
          </button>

          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'strategies'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Reallocation Simulator (3 Strategies)
          </button>

          <button
            onClick={() => setActiveTab('readiness')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'readiness'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Emergency Preparation Plan
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'library'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Saved Scenarios ({savedSimulations.length})
          </button>
        </div>

        {/* Current Scenario Title Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <span>Active Simulation:</span>
          <span className="font-bold text-slate-900 truncate max-w-xs">{activeScenario.title}</span>
        </div>
      </div>

      {/* VIEW 1: DIGITAL TWIN HOSPITAL OVERVIEW */}
      {activeTab === 'twin' && (
        <div className="space-y-6">
          {/* Top Topology Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Total Digital Twin Beds</span>
                <Bed className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {departments.reduce((acc, d) => acc + d.totalBeds, 0)} Beds
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {departments.reduce((acc, d) => acc + d.occupiedBeds, 0)} Occupied • {departments.reduce((acc, d) => acc + d.readyBeds, 0)} Ready
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Simulated Demand Influx</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-700">
                +{activeScenario.patientCount} Patients
              </div>
              <div className="text-xs text-indigo-600 mt-0.5 font-semibold">
                +{activeScenario.resourceRequirements.icuBeds} ICU • +{activeScenario.resourceRequirements.emergencyBeds} ER Beds
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Simulated Readiness Score</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-purple-700">
                {simulationResult.readinessScore}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Rating: <strong className="text-purple-700">{simulationResult.responseDifficulty}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Staff Telemetry (On-Duty)</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">
                {departments.reduce((acc, d) => acc + d.onDutyStaff.doctors, 0)} Docs / {departments.reduce((acc, d) => acc + d.onDutyStaff.nurses, 0)} Nurses
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Across 8 digital departments</div>
            </div>
          </div>

          {/* Department Digital Twin Blocks (Visual Floorplan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map((dept) => {
              const occPercent = dept.totalBeds > 0 ? Math.round((dept.occupiedBeds / dept.totalBeds) * 100) : 0;
              return (
                <div 
                  key={dept.id} 
                  className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-all ${
                    dept.status === 'Critical Strain' ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dept.status === 'Critical Strain' 
                          ? 'bg-red-600 text-white' 
                          : dept.status === 'High Load' 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dept.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{dept.name}</h4>
                    <div className="text-[11px] text-slate-500 mt-0.5">{dept.floor}</div>

                    {dept.totalBeds > 0 ? (
                      <div className="my-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Bed Capacity:</span>
                          <span className="font-bold text-slate-800">
                            {dept.occupiedBeds} / {dept.totalBeds} ({occPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              occPercent >= 85 ? 'bg-red-600' : occPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${occPercent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {dept.readyBeds} Ready Beds Available
                        </div>
                      </div>
                    ) : (
                      <div className="my-3 p-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                        Operational Utility & Cryogenic Reserve Hub
                      </div>
                    )}

                    {/* Equipment summary tags */}
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telemetry:</span>
                      {dept.equipmentSummary.map((eq, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-700">
                          <span className="truncate max-w-[150px]">{eq.name}</span>
                          <span className="font-mono font-bold text-slate-900">{eq.available}/{eq.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Readiness:</span>
                    <span className="font-bold text-indigo-700">{dept.readinessScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SCENARIO BUILDER & STRESS TEST CONFIG */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Predefined Scenarios Catalog */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Predefined Crisis Scenarios (One-Click)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Select an institutional mass emergency scenario to populate simulation parameters.
              </p>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {PREDEFINED_SIMULATION_SCENARIOS.map((scn) => (
                  <div
                    key={scn.id}
                    onClick={() => handleSelectPreset(scn)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      scn.id === activeScenario.id
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{scn.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {scn.patientCount} Patients
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{scn.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {scn.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 Cols: Custom Scenario Parameter Config */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Scenario Parameter Controls
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjust surge scale, patient severity distribution, and required life-support infrastructure.
                  </p>
                </div>

                <button
                  onClick={() => handleExecuteSimulation()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Execute What-If Stress Test
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scenario Title</label>
                  <input
                    type="text"
                    value={activeScenario.title}
                    onChange={e => setActiveScenario({ ...activeScenario, title: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Category</label>
                  <input
                    type="text"
                    value={activeScenario.emergencyType}
                    onChange={e => setActiveScenario({ ...activeScenario, emergencyType: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Patient Count & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Incoming Acute Patients</span>
                    <span className="font-mono text-indigo-700 text-sm font-black">{activeScenario.patientCount} Patients</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={activeScenario.patientCount}
                    onChange={e => setActiveScenario({ ...activeScenario, patientCount: parseInt(e.target.value) || 10 })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Scenario Duration Window</span>
                    <span className="font-mono text-indigo-700 text-sm font-black">{activeScenario.durationHours} Hours</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="48"
                    step="1"
                    value={activeScenario.durationHours}
                    onChange={e => setActiveScenario({ ...activeScenario, durationHours: parseInt(e.target.value) || 4 })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Resource Requirements Controls */}
              <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Simulated Resource Demand Requirements
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ICU Beds Needed</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={activeScenario.resourceRequirements.icuBeds}
                      onChange={e => setActiveScenario({
                        ...activeScenario,
                        resourceRequirements: {
                          ...activeScenario.resourceRequirements,
                          icuBeds: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full text-xs font-bold p-1.5 rounded-md border border-slate-300"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ER Beds Needed</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={activeScenario.resourceRequirements.emergencyBeds}
                      onChange={e => setActiveScenario({
                        ...activeScenario,
                        resourceRequirements: {
                          ...activeScenario.resourceRequirements,
                          emergencyBeds: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full text-xs font-bold p-1.5 rounded-md border border-slate-300"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ventilators Needed</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={activeScenario.resourceRequirements.ventilators}
                      onChange={e => setActiveScenario({
                        ...activeScenario,
                        resourceRequirements: {
                          ...activeScenario.resourceRequirements,
                          ventilators: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full text-xs font-bold p-1.5 rounded-md border border-slate-300"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Units (PRBC)</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={activeScenario.resourceRequirements.bloodUnits}
                      onChange={e => setActiveScenario({
                        ...activeScenario,
                        resourceRequirements: {
                          ...activeScenario.resourceRequirements,
                          bloodUnits: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full text-xs font-bold p-1.5 rounded-md border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Scenario to Library
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSimulation()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Simulation Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: RESOURCE IMPACT ANALYSIS */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          {/* Top Impact Summary Banner */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Simulation Result Analysis
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {simulationResult.scenarioTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Computed impact of influx against current live digital twin baseline.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Readiness Score</div>
                  <div className="text-2xl font-black text-purple-700">{simulationResult.readinessScore}%</div>
                </div>
                <div className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  simulationResult.responseDifficulty === 'Critical Surge' 
                    ? 'bg-red-600 text-white' 
                    : simulationResult.responseDifficulty === 'High' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-emerald-600 text-white'
                }`}>
                  {simulationResult.responseDifficulty}
                </div>
              </div>
            </div>

            {/* Major Weaknesses Flagged */}
            <div className="mt-4 p-4 rounded-xl bg-red-50/70 border border-red-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                    Identified Operational Weaknesses:
                  </h4>
                  <div className="mt-1 space-y-1">
                    {simulationResult.majorWeaknesses.map((w, i) => (
                      <div key={i} className="text-xs text-red-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Impact Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">
                Resource Deficit & Capacity Analysis Table
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Resource Category</th>
                    <th className="py-3 px-4">Live Ready Available</th>
                    <th className="py-3 px-4">Simulated Demand</th>
                    <th className="py-3 px-4">Simulated Deficit</th>
                    <th className="py-3 px-4">Simulated Occupancy</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Mitigation Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {simulationResult.resourceImpacts.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.resourceName}
                        <div className="text-[10px] text-slate-500 font-normal">{r.category}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {r.initialAvailable}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-blue-700 font-bold">
                        +{r.additionalDemand}
                      </td>

                      <td className="py-3.5 px-4">
                        {r.expectedShortage > 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-red-600 text-white">
                            -{r.expectedShortage} Deficit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Adequate Buffer
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {r.simulatedOccupancyPercent}%
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === 'Critical' ? 'bg-red-600 text-white' : r.severity === 'Warning' ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-600 leading-snug">
                        {r.mitigationRecommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: REALLOCATION SIMULATOR & STRATEGY COMPARISON */}
      {activeTab === 'strategies' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Resource Reallocation Strategy Comparison
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Compare 3 hypothetical mitigation strategies side-by-side to determine which operational reallocation maximizes patient coverage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {simulationResult.strategies.map((strat) => {
                const isRecommended = strat.strategyId === simulationResult.recommendedStrategyId;
                return (
                  <div 
                    key={strat.strategyId}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                      isRecommended 
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-300' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{strat.strategyId}</span>
                        {isRecommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                            Recommended Strategy
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{strat.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{strat.description}</p>

                      {/* Coverage Scores */}
                      <div className="my-4 p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Overall Coverage Score:</span>
                          <span className="font-black text-indigo-700 text-sm">{strat.overallCoverageScore}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Bed Coverage:</span>
                          <span className="font-bold text-slate-800">{strat.bedCoveragePercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Ventilator Coverage:</span>
                          <span className="font-bold text-slate-800">{strat.ventilatorCoveragePercent}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Unmet Demand:</span>
                          <span className={`font-bold ${strat.unmetDemandCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {strat.unmetDemandCount > 0 ? `${strat.unmetDemandCount} Units Short` : '0 Deficit (100% Covered)'}
                          </span>
                        </div>
                      </div>

                      {/* Key Reallocations */}
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Key Reallocations:
                        </span>
                        {strat.reallocations.map((re, idx) => (
                          <div key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                            <span>{re}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Feasibility:</span>
                      <span className={`font-bold ${
                        strat.feasibilityRating === 'Optimal' ? 'text-emerald-700' : strat.feasibilityRating === 'Overloaded' ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        {strat.feasibilityRating}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: EMERGENCY PREPARATION PLAN & READINESS REPORT */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Role-Based Operational Preparation Plan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protocolized action items dispatched across Hospital Admin, Doctor, and Nurse stations.
                </p>
              </div>

              <button
                onClick={handleOpenExportModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" /> Export Action Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Admin Tasks */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-blue-900">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Hospital Administration
                </div>
                <div className="space-y-2.5">
                  {simulationResult.preparationPlan.adminTasks.map((t, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-snug">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Doctor Tasks */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Physicians & Specialists
                </div>
                <div className="space-y-2.5">
                  {simulationResult.preparationPlan.doctorTasks.map((t, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-snug">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Nurse Tasks */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Nursing Staff & Ward Leads
                </div>
                <div className="space-y-2.5">
                  {simulationResult.preparationPlan.nurseTasks.map((t, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-snug">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: HISTORICAL SCENARIO LIBRARY */}
      {activeTab === 'library' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Historical Simulation Runs Library</h3>
              <p className="text-xs text-slate-500 mt-0.5">Archive of previous stress tests and preparedness drills.</p>
            </div>
            <button
              onClick={handleSaveToLibrary}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Current Run
            </button>
          </div>

          <div className="space-y-3">
            {savedSimulations.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">{item.id}</span>
                    <span className="text-xs text-slate-400">• {item.date}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      Readiness: {item.result.readinessScore}%
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.scenario.patientCount} Patients • {item.scenario.durationHours} Hours • {item.scenario.emergencyType}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveScenario(item.scenario);
                      setSimulationResult(item.result);
                      setActiveTab('impact');
                      setToastMsg(`Loaded saved simulation "${item.title}".`);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    Load Simulation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPORT REPORT MODAL */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Hospital Digital Twin Simulation Report"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Review the generated preparedness summary before exporting. Report captures configuration parameters, resource impact metrics, and role-specific action plans.
          </p>

          <textarea
            readOnly
            rows={14}
            value={exportContent}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Text
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download (.md)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
