import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Flame, 
  ShieldCheck, 
  FileCheck,
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  OUTBREAK_CLUSTERS, 
  OutbreakPatternItem 
} from '../../data/doctorDemoData';

interface OutbreakDetectionViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const OutbreakDetectionView: React.FC<OutbreakDetectionViewProps> = ({ onNavigateTab }) => {
  const [clusters, setClusters] = useState<OutbreakPatternItem[]>(OUTBREAK_CLUSTERS);
  const [acknowledgedClusters, setAcknowledgedClusters] = useState<Record<string, boolean>>({});
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [sterilizationAlert, setSterilizationAlert] = useState<string | null>(null);

  const handleAcknowledge = (id: string) => {
    setAcknowledgedClusters(prev => ({ ...prev, [id]: true }));
  };

  const handleOrderSterilization = (wardName: string) => {
    setSterilizationAlert(`Environmental Bio-Decontamination & UV-C Sterilization dispatched for ${wardName}. Housekeeping notified.`);
    setTimeout(() => setSterilizationAlert(null), 4000);
  };

  const filteredClusters = clusters.filter(c => {
    if (selectedWardFilter === 'all') return true;
    return c.ward.toLowerCase().includes(selectedWardFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/40 flex items-center justify-center shrink-0 border border-red-400/30">
            <Flame className="w-5 h-5 text-red-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">Nosocomial Outbreak & Ward Cluster Surveillance</h3>
              <span className="bg-red-500/30 text-red-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                AI EPIDEMIOLOGICAL RADAR
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                SIMULATION & DEMO MODE
              </span>
            </div>
            <p className="text-xs text-red-100/80 mt-0.5">
              Automated spatial-temporal cluster pattern detection flagging hospital-acquired infection spikes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-red-800/80 px-3 py-1.5 rounded-lg border border-red-700">
            <span className="text-red-200 block text-[10px]">Active Ward Clusters:</span>
            <span className="font-extrabold text-white text-base">{clusters.length}</span>
          </div>
        </div>
      </div>

      {sterilizationAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>{sterilizationAlert}</div>
        </div>
      )}

      {/* Filter and Overview */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold mr-1">Filter Ward:</span>
          {['all', 'icu block a', 'ward 3', 'ward 4'].map(w => (
            <button
              key={w}
              onClick={() => setSelectedWardFilter(w)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedWardFilter === w
                  ? 'bg-[#2563A6] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {w === 'all' ? 'All Wards' : w.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="text-slate-500 text-[11px]">
          Surveillance Engine: <strong>CDC NHSN / WHO Nosocomial Framework</strong>
        </div>
      </div>

      {/* Clusters List */}
      <div className="space-y-4">
        {filteredClusters.map(cluster => {
          const isAck = acknowledgedClusters[cluster.id];

          return (
            <Card
              key={cluster.id}
              title={cluster.clusterType}
              subtitle={`Detected in ${cluster.ward} &middot; Period: ${cluster.timePeriod}`}
              action={
                <Badge variant={cluster.riskSeverity === 'High' ? 'critical' : 'warning'} size="sm">
                  {cluster.riskSeverity.toUpperCase()} RISK
                </Badge>
              }
              noPadding
            >
              <div className="p-5 space-y-4 text-xs">
                {/* Cluster Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Affected Inpatients</span>
                    <span className="text-base font-extrabold text-[#1E293B]">{cluster.patientCount} Inpatients</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Infection Status</span>
                    <span className="text-sm font-bold text-red-600">{cluster.infectionControlStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Identified Pathogen</span>
                    <span className="text-base font-extrabold text-[#2563A6]">{cluster.suspectedPathogen}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Patients Involved</span>
                    <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                      {cluster.patientsInvolved.join(', ')}
                    </span>
                  </div>
                </div>

                {/* HIC Protocol Recommendations */}
                <div>
                  <span className="font-bold text-[#1E293B] block uppercase tracking-wider text-[11px] mb-1.5">
                    Hospital Infection Control (HIC) Protocol Directive:
                  </span>
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563A6] shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium leading-relaxed">{cluster.suggestedProtocol}</span>
                  </div>
                </div>

                {/* Common Symptoms */}
                <div className="text-[11px] text-slate-600">
                  <strong>Common Symptoms:</strong> {cluster.commonSymptoms.join(', ')}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOrderSterilization(cluster.ward)}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Deploy UV Decontamination
                    </Button>
                  </div>

                  <div>
                    {isAck ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Enhanced Precautions Active
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(cluster.id)}
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                      >
                        Enforce Cohort & Isolation Barrier
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
