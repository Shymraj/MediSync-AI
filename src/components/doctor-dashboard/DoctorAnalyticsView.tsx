import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Bed, 
  Zap, 
  BarChart3, 
  Calendar,
  Award,
  Download,
  Filter,
  Check
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DOCTOR_ANALYTICS_METRICS } from '../../data/doctorDemoData';

export const DoctorAnalyticsView: React.FC = () => {
  const [metrics] = useState(DOCTOR_ANALYTICS_METRICS);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'ytd'>('month');
  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center shrink-0 border border-blue-400/30">
            <BarChart3 className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Physician Clinical Performance & Census Analytics</h3>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                INSTITUTIONAL METRICS
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                CLINICAL AUDIT DEMO
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Comprehensive institutional metrics covering patient throughput, emergency response, and diagnostic efficiency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 rounded-lg p-1 border border-slate-700 flex text-xs">
            {(['today', 'week', 'month', 'ytd'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectedTimeframe === tf ? 'bg-[#2563A6] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'YTD'}
              </button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="text-white border-slate-700 hover:bg-slate-800 text-xs"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          Clinical performance report exported successfully for Medical Audit Board!
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Active Inpatients</span>
            <Users className="w-4 h-4 text-[#2563A6]" />
          </div>
          <div className="text-2xl font-extrabold text-[#2563A6] mt-2">{metrics.activeInpatientsCount}</div>
          <div className="text-[11px] text-green-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> Critical under direct care: {metrics.criticalPatientsCount}
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Average Length of Stay</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{metrics.averageLengthOfStay}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            Target benchmark: &lt; 5.0 days
          </div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Handover Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2">{metrics.handoverComplianceRate}</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero missed shift handovers</div>
        </Card>

        <Card noPadding className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-medium">Alert Response Speed</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{metrics.clinicalAlertResponseTime}</div>
          <div className="text-[11px] text-green-600 mt-1 font-semibold">
            Industry top 5% benchmark
          </div>
        </Card>
      </div>

      {/* Clinical Quality & Benchmark Strip */}
      <Card title="Clinical Quality & Safety Indicators" subtitle="Accreditation benchmarks (NABH / JCI Standards)" noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Door-to-Antibiotic in Sepsis</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">38 minutes</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Standard: &lt; 60 mins (Surviving Sepsis)</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Unplanned 48h ICU Readmissions</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">1.8%</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Target: &lt; 3.0% institutional ceiling</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Diagnostic Concordance Rate</span>
            <div className="text-xl font-bold text-[#2563A6] mt-1">96.4%</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Emergency admission vs discharge ICD-10</span>
          </div>
        </div>
      </Card>

      {/* Department Breakdown & Monthly Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Active Inpatient Census by Division" subtitle="Distribution across intensive and intermediate wards" noPadding>
          <div className="p-4 space-y-3 text-xs">
            {metrics.departmentCensus.map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[#1E293B]">{dept.department}</span>
                  <span className="text-[#2563A6]">{dept.count} Inpatients ({dept.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563A6] rounded-full"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Patient MEWS Risk Distribution" subtitle="Physiological acuity across active census" noPadding>
          <div className="p-4 space-y-3 text-xs">
            {metrics.mewsDistribution.map((mews, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[#1E293B] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mews.color }} />
                    {mews.tier}
                  </span>
                  <span className="font-bold">{mews.count} Patients</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(mews.count / metrics.activeInpatientsCount) * 100}%`, backgroundColor: mews.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
