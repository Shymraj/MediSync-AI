import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  AlertTriangle, 
  Bed, 
  Wind, 
  Activity, 
  Users, 
  Droplet, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  ChevronRight, 
  Check, 
  X, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  Stethoscope, 
  FileText, 
  Info,
  Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  ForecastingHorizon, 
  PredictiveForecastingData, 
  PredictiveShortageAlert 
} from '../../types';
import { 
  getMockForecastingData, 
  INITIAL_PREDICTIVE_ALERTS, 
  DEMO_FORECAST_DISCLAIMER 
} from '../../data/forecastingDemoData';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface PredictiveIntelligencePageProps {
  onSelectTab?: (tabId: string) => void;
}

export const PredictiveIntelligencePage: React.FC<PredictiveIntelligencePageProps> = ({
  onSelectTab
}) => {
  const { user, beds, equipment } = useApp();

  // Filters state
  const [horizon, setHorizon] = useState<ForecastingHorizon>('24h');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [activeSectionTab, setActiveSectionTab] = useState<'overview' | 'beds' | 'equipment' | 'emergency'>('overview');

  // Forecasting data state
  const [forecastData, setForecastData] = useState<PredictiveForecastingData>(() => 
    getMockForecastingData('24h', 'all')
  );
  const [alerts, setAlerts] = useState<PredictiveShortageAlert[]>(INITIAL_PREDICTIVE_ALERTS);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Preparation checklist state (interactive)
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({});

  // Resolve Alert Modal State
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<PredictiveShortageAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Fetch forecast data and shortage alerts
  const loadForecastData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getForecastingMetrics({
        hospitalId: 'hosp-chn-01',
        horizon,
        ward: selectedWard
      });
      if (data && data.resourceDemandForecast) {
        setForecastData(data);
      } else {
        setForecastData(getMockForecastingData(horizon, selectedWard));
      }
    } catch (err) {
      // Fallback to local forecast simulation
      setForecastData(getMockForecastingData(horizon, selectedWard));
    }

    try {
      const alertsData = await api.getPredictiveShortageAlerts('hosp-chn-01');
      if (Array.isArray(alertsData) && alertsData.length > 0) {
        setAlerts(alertsData);
      }
    } catch (err) {
      // keep initial
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadForecastData();
  }, [horizon, selectedWard]);

  // Auto-dismiss toast
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 6000);
      return () => clearInterval(timer);
    }
  }, [feedbackMsg]);

  // Handle Acknowledge Alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    const actor = user?.name || 'Authorized Hospital Officer';
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId || a.alert_id === alertId) {
        return {
          ...a,
          status: 'Acknowledged',
          acknowledged_by: actor,
          acknowledged_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return a;
    }));

    try {
      await api.acknowledgeShortageAlert(alertId, actor);
    } catch (err) {}

    setFeedbackMsg(`Alert ${alertId} acknowledged by ${actor}. Recommended preparation actions logged.`);
  };

  // Handle Resolve Alert
  const handleConfirmResolveAlert = async () => {
    if (!selectedAlertForResolve) return;
    const actor = user?.name || 'Hospital Administrator';

    setAlerts(prev => prev.map(a => {
      if (a.id === selectedAlertForResolve.id || a.alert_id === selectedAlertForResolve.alert_id) {
        return {
          ...a,
          status: 'Resolved',
          resolved_by: actor,
          resolved_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          resolution_notes: resolutionNotes || 'Preparation actions executed. Capacity restored.'
        };
      }
      return a;
    }));

    try {
      await api.resolveShortageAlert(selectedAlertForResolve.id, actor, resolutionNotes);
    } catch (err) {}

    setSelectedAlertForResolve(null);
    setResolutionNotes('');
    setFeedbackMsg(`Shortage Alert ${selectedAlertForResolve.alert_id} resolved. Operational readiness confirmed.`);
  };

  // Toggle checklist item
  const handleToggleChecklist = (itemKey: string) => {
    setCompletedChecklist(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Active alerts count
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => a.status === 'Active' || a.status === 'Acknowledged');
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{feedbackMsg}</p>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & FORECAST CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                Hospital Intelligence Engine
              </span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md">
                Confidence: <strong className="text-slate-800">{forecastData.dataConfidenceScore}%</strong>
              </span>
              <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md font-semibold">
                ARIMA & Trend Extrapolation Pipeline
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              Predictive Hospital Intelligence & Resource Forecasting
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Analyzes historical admission cycles, emergency surges, and real-time telemetry to project bed occupancy, equipment demand, and proactive shortage prevention.
            </p>
          </div>

          {/* Time Horizon & Ward Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Horizon Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              {(['24h', '3d', '7d'] as ForecastingHorizon[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    horizon === h
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {h === '24h' ? 'Next 24 Hours' : h === '3d' ? 'Next 3 Days' : 'Next 7 Days'}
                </button>
              ))}
            </div>

            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedWard}
                onChange={e => setSelectedWard(e.target.value)}
                className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Hospital Wards</option>
                <option value="ICU Block A">ICU Block A</option>
                <option value="Emergency">Emergency Resuscitation Bay</option>
                <option value="High Dependency">High Dependency Ward (HDU)</option>
                <option value="General Medical">General Medical Ward</option>
                <option value="Surgical Stepdown">Surgical Stepdown</option>
              </select>
            </div>

            <button
              onClick={loadForecastData}
              disabled={isLoading}
              title="Refresh Forecast"
              className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* PROMINENT DEMO FORECAST NOTICE */}
        <div className="mt-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-bold uppercase tracking-wider text-amber-800">Demo Forecast Notice:</strong>{' '}
            {DEMO_FORECAST_DISCLAIMER}{' '}
            Predictions are generated via statistical trend extrapolation based on simulated hospital inflow/outflow patterns. Designed for operational resource preparation and capacity planning.
          </div>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Projected Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Projected Peak Occupancy</span>
            <Bed className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {forecastData.summary.projectedOccupancyPercent}%
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            +7% increase from baseline ({forecastData.summary.currentOccupiedBeds} beds occupied)
          </div>
        </div>

        {/* 2. Expected Shortages */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Forecasted Shortages</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600">
            {activeAlerts.length} Shortages Expected
          </div>
          <div className="text-xs text-red-600 font-semibold mt-1">
            ICU Beds & Mechanical Ventilators at risk
          </div>
        </div>

        {/* 3. Inflow vs Outflow Net Flow */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Projected Patient Inflow</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            +{forecastData.summary.expectedAdmissionsTotal} Adm / -{forecastData.summary.expectedDischargesTotal} Dis
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Net delta: <strong className="text-slate-800">+{forecastData.summary.expectedAdmissionsTotal - forecastData.summary.expectedDischargesTotal} bed demand</strong>
          </div>
        </div>

        {/* 4. Forecast Model Confidence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Forecast Accuracy</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {forecastData.dataConfidenceScore}%
          </div>
          <div className="text-xs text-purple-600 font-semibold mt-1">
            Mean Absolute Error (MAE): ±0.8 beds
          </div>
        </div>
      </div>

      {/* ACTIVE INTELLIGENT SHORTAGE WARNINGS BANNER & CARDS */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                  Active Intelligent Shortage Warnings ({activeAlerts.length})
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                    Immediate Action Recommended
                  </span>
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Algorithmic prediction indicates impending capacity deficits. Early mitigation actions recommended below.
                </p>
              </div>
            </div>

            <span className="text-xs text-red-800 font-semibold bg-white/80 px-3 py-1.5 rounded-lg border border-red-200">
              Target Horizon: <strong>{forecastData.timeHorizon}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {activeAlerts.map((alert) => (
              <div 
                key={alert.id || alert.alert_id} 
                className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{alert.alert_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.severity === 'Critical' 
                        ? 'bg-red-600 text-white' 
                        : alert.severity === 'Warning' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-yellow-400 text-slate-900'
                    }`}>
                      {alert.severity} Shortage
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {alert.resource_type}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {alert.ward_or_department}
                  </div>

                  {/* Deficit Stats */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Ready</div>
                      <div className="text-xs font-extrabold text-slate-800">{alert.current_available}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Demand</div>
                      <div className="text-xs font-extrabold text-blue-700">{alert.forecasted_demand}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-red-600 font-bold uppercase">Deficit</div>
                      <div className="text-xs font-extrabold text-red-600">-{alert.expected_shortage}</div>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Recommended Preparation:
                    </span>
                    {alert.recommended_actions?.map((act, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Status: <strong className={alert.status === 'Acknowledged' ? 'text-amber-700' : 'text-red-700'}>
                      {alert.status}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.alert_id || alert.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedAlertForResolve(alert);
                        setResolutionNotes('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION TABS */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSectionTab('overview')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeSectionTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Resource Demand Forecast (7 Categories)
          </button>

          <button
            onClick={() => setActiveSectionTab('beds')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeSectionTab === 'beds'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Bed className="w-4 h-4" />
            Bed Occupancy & Ward Breakdown
          </button>

          <button
            onClick={() => setActiveSectionTab('equipment')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeSectionTab === 'equipment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Wind className="w-4 h-4" />
            Equipment Demand Forecast
          </button>

          <button
            onClick={() => setActiveSectionTab('emergency')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeSectionTab === 'emergency'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Emergency Demand Patterns
          </button>
        </div>
      </div>

      {/* SECTION TAB 1: 7 CORE RESOURCE DEMAND FORECASTING TABLE */}
      {activeSectionTab === 'overview' && (
        <div className="space-y-6">
          {/* Resource Forecast Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Resource Demand Projections ({forecastData.timeHorizon})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-horizon trend projection covering beds, life-support equipment, blood supply, and staffing.
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                Horizon: <strong className="text-blue-700">{forecastData.timeHorizon}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Resource & Category</th>
                    <th className="py-3 px-4">Current Available</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4">Historical Avg</th>
                    <th className="py-3 px-4">Forecasted Demand</th>
                    <th className="py-3 px-4">Expected Deficit</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Recommended Preparation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {forecastData.resourceDemandForecast.map((item, idx) => {
                    const hasShortage = item.expectedShortage > 0;
                    return (
                      <tr 
                        key={idx}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          hasShortage ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{item.resourceType}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{item.category}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          <span className={`px-2 py-0.5 rounded ${
                            item.currentAvailable <= 2 ? 'bg-red-100 text-red-800 font-extrabold' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.currentAvailable}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.currentUtilizationPercent > 80 ? 'bg-red-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${item.currentUtilizationPercent}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">{item.currentUtilizationPercent}%</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {item.historicalDemandAvg}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-sm">
                          {item.forecastedDemand}
                        </td>

                        <td className="py-3.5 px-4">
                          {hasShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-extrabold bg-red-600 text-white shadow-xs">
                              <AlertTriangle className="w-3 h-3" />
                              -{item.expectedShortage} Deficit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> Adequate Buffer
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                          {item.forecastConfidencePercent}%
                        </td>

                        <td className="py-3.5 px-4 max-w-xs text-slate-600 leading-snug">
                          {item.recommendedPreparation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* VISUAL FORECAST CHART & TIMELINE PROJECTION */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Demand Projection vs. Maximum Hospital Capacity Curve
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical moving averages extrapolated against total available hospital operational capacity.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-slate-400" /> Historical Demand
                </span>
                <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" /> Forecasted Demand
                </span>
                <span className="flex items-center gap-1.5 text-red-600 font-bold">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500" /> Capacity Limit
                </span>
              </div>
            </div>

            {/* Responsive Chart Bars */}
            <div className="grid grid-cols-7 gap-3 pt-6 pb-2 items-end min-h-[220px] border-b border-slate-200">
              {forecastData.timelineData.map((pt, i) => {
                const heightPercent = pt.historicalDemand 
                  ? pt.historicalDemand 
                  : (pt.forecastedDemand || 50);
                const isOverCapacity = pt.expectedShortage > 0;

                return (
                  <div key={i} className="flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded shadow-md pointer-events-none z-10 whitespace-nowrap">
                      <div>Time: {pt.timestamp}</div>
                      <div>Demand: {pt.historicalDemand || pt.forecastedDemand} Units</div>
                      {isOverCapacity && <div className="text-red-400 font-bold">Deficit: -{pt.expectedShortage}</div>}
                    </div>

                    <div className="w-full flex items-end justify-center h-40">
                      <div 
                        className={`w-full max-w-[42px] rounded-t-lg transition-all ${
                          pt.historicalDemand 
                            ? 'bg-slate-300 hover:bg-slate-400' 
                            : isOverCapacity 
                              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                              : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-600 font-semibold mt-1">
                      {pt.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION TAB 2: BED OCCUPANCY & WARD-WISE BREAKDOWN */}
      {activeSectionTab === 'beds' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Ward-Wise Bed Occupancy & Admission Inflow Analysis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic projection analyzing anticipated admissions, step-downs, discharges, and potential ward shortages.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Ward / Clinical Division</th>
                    <th className="py-3 px-4">Total Beds</th>
                    <th className="py-3 px-4">Current Occupied</th>
                    <th className="py-3 px-4">Available Now</th>
                    <th className="py-3 px-4">Expected Inflow</th>
                    <th className="py-3 px-4">Expected Outflow</th>
                    <th className="py-3 px-4">Predicted Occupancy</th>
                    <th className="py-3 px-4">Shortage Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {forecastData.bedOccupancyForecast.wardBreakdown.map((ward, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ward.wardName}
                        <span className="ml-2 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {ward.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {ward.totalBeds}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {ward.currentOccupied}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          ward.currentAvailable <= 2 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ward.currentAvailable}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-blue-700 font-bold">
                        +{ward.expectedAdmissions}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                        -{ward.expectedDischarges}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                ward.predictedOccupancyPercent >= 90 ? 'bg-red-600' : ward.predictedOccupancyPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${ward.predictedOccupancyPercent}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{ward.predictedOccupancyPercent}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          ward.riskLevel === 'Critical' 
                            ? 'bg-red-600 text-white' 
                            : ward.riskLevel === 'High' 
                              ? 'bg-amber-500 text-white' 
                              : ward.riskLevel === 'Moderate' 
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                                : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ward.riskLevel}
                        </span>
                        {ward.possibleShortage > 0 && (
                          <div className="text-[10px] text-red-600 font-bold mt-0.5">
                            Deficit: -{ward.possibleShortage}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION TAB 3: EQUIPMENT DEMAND FORECAST */}
      {activeSectionTab === 'equipment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecastData.equipmentForecast.map((eq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {eq.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      eq.riskLevel === 'High' 
                        ? 'bg-red-600 text-white' 
                        : eq.riskLevel === 'Moderate' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {eq.riskLevel} Risk
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">{eq.equipmentName}</h4>

                  <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Ready Available</div>
                      <div className="text-lg font-extrabold text-slate-800 mt-0.5">{eq.currentAvailable}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Expected Demand</div>
                      <div className="text-lg font-extrabold text-blue-700 mt-0.5">{eq.expectedDemand}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Potential Deficit</div>
                      <div className={`text-lg font-extrabold mt-0.5 ${
                        eq.possibleShortage > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {eq.possibleShortage > 0 ? `-${eq.possibleShortage}` : 'None'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 leading-snug">
                  <strong>Recommended Readiness Action:</strong> {eq.recommendedReadiness}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION TAB 4: EMERGENCY DEMAND PATTERNS */}
      {activeSectionTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Category Surge Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Historical Emergency Incident Classifications
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Relative frequency of acute emergency triage presentations and associated critical resource spikes.
            </p>

            <div className="space-y-4">
              {forecastData.emergencyPatterns.commonCategories.map((cat, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{cat.category}</span>
                    <span className="font-mono font-bold text-blue-700">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-700">Surge Requirement:</strong> {cat.resourceSurge}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours & Ward Volatility */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Peak Demand Operating Hours
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Historical peak temporal window for acute triage arrivals requiring surge staffing.
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <Clock className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-extrabold text-red-900">
                    {forecastData.emergencyPatterns.peakSurgePeriod}
                  </div>
                  <div className="text-xs text-red-700 mt-0.5">
                    Pre-alert emergency department senior registrars and blood bank crossmatch desk.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ward Demand Volatility Patterns
              </h4>
              <div className="space-y-2">
                {forecastData.emergencyPatterns.wardDemandPatterns.map((wp, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800">{wp.ward}</span>
                    <span className="text-blue-700 font-semibold">{wp.demandTrend}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      wp.expectedLoad === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {wp.expectedLoad} Load
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: OPERATIONAL RESOURCE PREPARATION CHECKLIST */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Operational Resource Preparation Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolized clinical & engineering actions generated from predictive capacity forecasts.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {Object.values(completedChecklist).filter(Boolean).length} of 6 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'chk-01',
              title: 'Expedite Step-Down Discharges in ICU Block A',
              desc: 'Coordinate with attending intensivist to transfer stable patients in ICU-05 and ICU-06 to HDU to release critical care beds.'
            },
            {
              id: 'chk-02',
              title: 'Prepare PACU Recovery Ward as ICU Overflow Buffer',
              desc: 'Confirm 2 standby telemetry monitors and suction apparatus in Post-Anesthesia Care Unit for potential surge diversion.'
            },
            {
              id: 'chk-03',
              title: 'Recall Standby Mechanical Ventilators from Biomedical Eng',
              desc: 'Verify circuit diagnostic checks on 2 Hamilton-C6 ventilators and transport to respiratory therapy clean storage.'
            },
            {
              id: 'chk-04',
              title: 'Audit Cryogenic Liquid Oxygen Central Tank Pressure',
              desc: 'Confirm manifold line pressure registers at 4.2 bar and verify secondary cylinder bank readiness.'
            },
            {
              id: 'chk-05',
              title: 'Audit Emergency Blood Reserves (O-Negative PRBC)',
              desc: 'Verify 4 units O-negative blood quarantined for uncrossmatched trauma resuscitation at central blood bank.'
            },
            {
              id: 'chk-06',
              title: 'Confirm On-Call Specialist Trauma Lead for 18:00 Surge',
              desc: 'Verify second-tier trauma surgeon and interventional cardiologist presence on call board for evening peak.'
            }
          ].map((task) => {
            const isDone = Boolean(completedChecklist[task.id]);
            return (
              <div
                key={task.id}
                onClick={() => handleToggleChecklist(task.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isDone 
                    ? 'bg-emerald-50/60 border-emerald-300' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors ${
                  isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {task.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: RESOLVE SHORTAGE ALERT */}
      <Modal
        isOpen={Boolean(selectedAlertForResolve)}
        onClose={() => setSelectedAlertForResolve(null)}
        title="Resolve Resource Shortage Alert"
      >
        {selectedAlertForResolve && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-mono">{selectedAlertForResolve.alert_id}</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {selectedAlertForResolve.resource_type} ({selectedAlertForResolve.ward_or_department})
              </div>
              <div className="text-xs text-red-600 font-semibold mt-1">
                Expected Shortage: -{selectedAlertForResolve.expected_shortage} units in {selectedAlertForResolve.time_horizon}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resolution & Mitigation Notes *
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="e.g., Prepared 2 overflow beds in PACU, dispatched standby ventilator from biomedical storage, and confirmed clinical coverage..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedAlertForResolve(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolveAlert}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Resolution
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
