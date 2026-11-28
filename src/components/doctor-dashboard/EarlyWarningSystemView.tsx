import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Flame, 
  PhoneCall, 
  Plus, 
  Users,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { 
  INITIAL_EARLY_WARNING_ALERTS, 
  EarlyWarningAlertItem 
} from '../../data/doctorDemoData';
import { useApp } from '../../context/AppContext';

interface EarlyWarningSystemViewProps {
  onNavigateTab?: (tabId: string, patientId?: string) => void;
}

export const EarlyWarningSystemView: React.FC<EarlyWarningSystemViewProps> = ({ onNavigateTab }) => {
  const { clinicalAlerts, acknowledgeClinicalAlert, user } = useApp();
  const alerts = clinicalAlerts && clinicalAlerts.length > 0 ? clinicalAlerts : INITIAL_EARLY_WARNING_ALERTS;
  const [selectedAlertForEscalation, setSelectedAlertForEscalation] = useState<EarlyWarningAlertItem | null>(null);
  const [escalationTeam, setEscalationTeam] = useState('Medical ICU Rapid Response Team');
  const [escalationNote, setEscalationNote] = useState('');
  const [escalationSuccess, setEscalationSuccess] = useState(false);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeClinicalAlert(alertId, user?.name || 'Dr. Sundaramoorthy M.');
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForEscalation) return;

    acknowledgeClinicalAlert(
      selectedAlertForEscalation.id, 
      `${user?.name || 'Dr. Sundaramoorthy M.'} Escalated to ${escalationTeam}${escalationNote ? `: ${escalationNote}` : ''}`
    );
    setEscalationSuccess(true);
    setTimeout(() => {
      setEscalationSuccess(false);
      setSelectedAlertForEscalation(null);
      setEscalationNote('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-red-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-800 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-red-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Modified Early Warning System (MEWS) Command Feed</h3>
              <span className="bg-red-700 text-red-100 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                CRITICAL MONITORING
              </span>
            </div>
            <p className="text-xs text-red-200/90 mt-0.5">
              Automated scoring based on heart rate, systolic blood pressure, respiratory rate, temperature, and GCS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-red-800/80 px-3 py-1.5 rounded-lg border border-red-700">
            <span className="text-red-200 block text-[10px]">Active Unacknowledged Alerts:</span>
            <span className="font-extrabold text-white text-base">
              {alerts.filter(a => a.status === 'Active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-4">
        {alerts.map(alert => {
          const isCritical = alert.severity === 'Critical';
          const isHigh = alert.severity === 'High Risk';
          const isActive = alert.status === 'Active';

          return (
            <Card
              key={alert.id}
              noPadding
              className={`border-l-4 ${
                isCritical ? 'border-l-red-600 bg-red-50/20' :
                isHigh ? 'border-l-amber-500 bg-amber-50/20' : 'border-l-blue-500'
              }`}
            >
              <div className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-[#1E293B]">{alert.patientName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {alert.patientId}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{alert.ward} &middot; Bed {alert.bed}</span>
                    <Badge variant={isCritical ? 'critical' : isHigh ? 'warning' : 'primary'} size="sm">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      MEWS: {alert.mewsScore} / 14
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {alert.timestamp}
                    </span>
                    <Badge 
                      variant={
                        alert.status === 'Active' ? 'critical' :
                        alert.status === 'Acknowledged' ? 'warning' : 'success'
                      } 
                      size="sm"
                    >
                      {alert.status}
                    </Badge>
                  </div>
                </div>

                {/* Vital Trigger and Nurse Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B] block font-semibold text-[11px]">Decompensation Trigger:</span>
                    <span className="font-bold text-red-600 mt-0.5 block">
                      {alert.triggerParam}: {alert.triggerValue} (Threshold: {alert.threshold})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block font-semibold text-[11px]">Clinical Assessment:</span>
                    <span className="text-slate-700 mt-0.5 block">{alert.reason}</span>
                  </div>
                </div>

                {/* Recommended Clinical Action */}
                <div className="flex items-center justify-between gap-4 pt-1 flex-wrap text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span><strong>Recommended Protocol:</strong> {alert.suggestedAction}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateTab('digital_twin', alert.patientId)}
                      >
                        Digital Twin
                      </Button>
                    )}

                    {isActive && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Acknowledge
                      </Button>
                    )}

                    <Button
                      variant={isCritical ? 'danger' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAlertForEscalation(alert)}
                      icon={<Flame className="w-3.5 h-3.5" />}
                    >
                      Rapid Response Team
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Rapid Response Escalation Modal */}
      <Modal
        isOpen={!!selectedAlertForEscalation}
        onClose={() => setSelectedAlertForEscalation(null)}
        title="Activate Rapid Response & Emergency Escalation"
        description="Dispatch critical care response team to patient bedside immediately."
        maxWidth="md"
      >
        {escalationSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#1E293B]">Emergency Escalation Dispatched!</h4>
            <p className="text-xs text-slate-600">
              {escalationTeam} has been paged with high priority STAT beacon to Bed {selectedAlertForEscalation?.bed} ({selectedAlertForEscalation?.ward}).
            </p>
          </div>
        ) : (
          <form onSubmit={handleEscalateSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <strong>Patient:</strong> {selectedAlertForEscalation?.patientName} ({selectedAlertForEscalation?.patientId}) &middot; Bed {selectedAlertForEscalation?.bed}
              <div className="text-[11px] mt-1">
                MEWS: {selectedAlertForEscalation?.mewsScore} &middot; {selectedAlertForEscalation?.triggerParam}: {selectedAlertForEscalation?.triggerValue}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Target Response Team</label>
              <select
                value={escalationTeam}
                onChange={(e) => setEscalationTeam(e.target.value)}
                className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white"
              >
                <option value="Medical ICU Rapid Response Team">Medical ICU Rapid Response Team (RRT)</option>
                <option value="Cardiology Code Blue Team">Cardiology Code Blue Team</option>
                <option value="Anesthesia Critical Airway Team">Anesthesia Critical Airway Team</option>
                <option value="Surgical Crash Team">Surgical Crash Team</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Physician Urgent Directive / Reason</label>
              <textarea
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                rows={3}
                placeholder="e.g. Acute respiratory decompensation and hypoxemic distress. Airway evaluation and possible mechanical ventilation required..."
                required
                className="w-full p-2 border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedAlertForEscalation(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit" icon={<Flame className="w-3.5 h-3.5" />}>
                Confirm STAT Dispatch
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
