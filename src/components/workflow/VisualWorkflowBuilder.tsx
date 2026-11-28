import React, { useState } from 'react';
import { 
  Zap, 
  GitBranch, 
  Play, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  X, 
  Info,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { WorkflowRule, WorkflowCategory, WorkflowStepType, WorkflowStepConfig, UserRole } from '../../types';
import { workflowEngine } from '../../services/workflowEngine';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface VisualWorkflowBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCreated: (newRule: WorkflowRule) => void;
  initialRule?: WorkflowRule | null;
}

const CATEGORIES: WorkflowCategory[] = [
  'Resource Requests',
  'Bed Readiness',
  'Equipment Maintenance',
  'Patient Transfer',
  'Clinical Tasks',
  'Discharge',
  'Emergency Coordination'
];

const PREDEFINED_TRIGGERS: Record<WorkflowCategory, string[]> = {
  'Resource Requests': [
    'Doctor submits emergency resource request',
    'ICU bed capacity drops below 15%',
    'Blood bank reserve falls under safety threshold'
  ],
  'Bed Readiness': [
    'Bed marked Cleaning or Unavailable',
    'Patient discharged from acute ward',
    'Isolation patient bed turnaround requested'
  ],
  'Equipment Maintenance': [
    'Equipment telemetry error or fault reported',
    'Class III life-support calibration due',
    'Device battery failure or sensor drift detected'
  ],
  'Patient Transfer': [
    'Attending physician orders ward transfer',
    'Emergency patient stabilized for step-down transfer',
    'Infection control isolation room transfer requested'
  ],
  'Clinical Tasks': [
    'Post-surgical patient admitted or clinical order placed',
    'Recurring observation interval (Q2H/Q4H) reached',
    'Clinical handover milestone reached'
  ],
  'Discharge': [
    'Physician initiates discharge protocol',
    'Post-op recovery milestones cleared',
    'Step-down observation completed'
  ],
  'Emergency Coordination': [
    'Lab system flags critical panic value or MEWS >= 5',
    'Trauma Code Red alert dispatched',
    'Mass casualty triage surge activated'
  ]
};

export const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  isOpen,
  onClose,
  onRuleCreated,
  initialRule
}) => {
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [category, setCategory] = useState<WorkflowCategory>(initialRule?.category || 'Resource Requests');
  const [triggerEvent, setTriggerEvent] = useState(initialRule?.triggerEvent || PREDEFINED_TRIGGERS['Resource Requests'][0]);
  const [conditionDesc, setConditionDesc] = useState(initialRule?.conditionDescription || 'Priority is Critical or High, or asset is Life-Support');
  const [actionDesc, setActionDesc] = useState(initialRule?.actionDescription || 'Validate live telemetry, queue dispatch, alert primary team');
  const [targetRole, setTargetRole] = useState<UserRole | 'all'>(initialRule?.targetRole === 'maintenance' || initialRule?.targetRole === 'bio-med' ? 'all' : (initialRule?.targetRole || 'admin'));
  const [approvalRequired, setApprovalRequired] = useState(initialRule ? initialRule.approvalRequired : true);
  const [approverRole, setApproverRole] = useState<UserRole>(initialRule?.approverRole === 'doctor' ? 'doctor' : (initialRule?.approverRole === 'nurse' ? 'nurse' : 'admin'));
  const [approvalTimeout, setApprovalTimeout] = useState(initialRule?.approvalTimeoutMinutes || 30);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: WorkflowCategory) => {
    setCategory(newCat);
    if (PREDEFINED_TRIGGERS[newCat]?.length > 0) {
      setTriggerEvent(PREDEFINED_TRIGGERS[newCat][0]);
    }
    // Safety auto-adjustments
    if (newCat === 'Discharge') {
      setApprovalRequired(true);
      setApproverRole('doctor');
      setConditionDesc('All pending lab investigations finalized and consultant notes reconciled');
      setActionDesc('Reconcile medications, notify billing and patient transport');
    } else if (newCat === 'Bed Readiness') {
      setApprovalRequired(true);
      setApproverRole('nurse');
      setConditionDesc('Terminal disinfection complete and sterile swab test passed');
      setActionDesc('Update Bed Master to Ready and broadcast availability');
    } else if (newCat === 'Resource Requests') {
      setApprovalRequired(true);
      setApproverRole('admin');
      setConditionDesc('Urgency is Critical or High; verified live inventory availability');
      setActionDesc('Dispatch asset, update hospital allocation logs');
    }
  };

  const validateDraft = () => {
    const draftSteps: WorkflowStepConfig[] = [
      { id: 's1', name: 'Trigger Intake', type: 'trigger', description: triggerEvent, config: {}, order: 1 },
      { id: 's2', name: 'Safety & Rule Gate', type: 'condition', description: conditionDesc, config: {}, order: 2 },
      { id: 's3', name: 'Operational Dispatch', type: 'action', description: actionDesc, config: {}, order: 3 },
      { id: 's4', name: 'Role Notification', type: 'notification', description: `Notify ${targetRole}`, config: {}, order: 4 }
    ];

    if (approvalRequired) {
      draftSteps.push({
        id: 's5',
        name: 'Authorized Verification',
        type: 'approval',
        description: `Mandatory digital sign-off by ${approverRole}`,
        config: { approverRole },
        order: 5
      });
    }

    draftSteps.push({
      id: 's6',
      name: 'System Realignment',
      type: 'completion',
      description: 'Audit logging and database update',
      config: {},
      order: approvalRequired ? 6 : 5
    });

    const result = workflowEngine.validateWorkflowRule({
      name,
      description,
      category,
      triggerEvent,
      conditionDescription: conditionDesc,
      actionDescription: actionDesc,
      targetRole,
      approvalRequired,
      approverRole: approvalRequired ? approverRole : undefined,
      approvalTimeoutMinutes: approvalTimeout,
      steps: draftSteps
    });

    setErrors(result.errors);
    setWarnings(result.warnings);
    return result;
  };

  const handleSave = () => {
    const val = validateDraft();
    if (!val.isValid) return;

    const draftSteps: WorkflowStepConfig[] = [
      { id: 's1', name: 'Trigger Intake', type: 'trigger', description: triggerEvent, config: {}, order: 1 },
      { id: 's2', name: 'Safety & Rule Gate', type: 'condition', description: conditionDesc, config: {}, order: 2 },
      { id: 's3', name: 'Operational Dispatch', type: 'action', description: actionDesc, config: {}, order: 3 },
      { id: 's4', name: 'Role Notification', type: 'notification', description: `Notify ${targetRole}`, config: {}, order: 4 }
    ];

    if (approvalRequired) {
      draftSteps.push({
        id: 's5',
        name: 'Authorized Verification',
        type: 'approval',
        description: `Mandatory digital sign-off by ${approverRole}`,
        config: { approverRole },
        order: 5
      });
    }

    draftSteps.push({
      id: 's6',
      name: 'System Realignment',
      type: 'completion',
      description: 'Audit logging and status transition',
      config: {},
      order: approvalRequired ? 6 : 5
    });

    if (initialRule) {
      const res = workflowEngine.updateRule(initialRule.id, {
        name,
        description,
        category,
        triggerEvent,
        conditionDescription: conditionDesc,
        actionDescription: actionDesc,
        targetRole,
        approvalRequired,
        approverRole: approvalRequired ? approverRole : undefined,
        approvalTimeoutMinutes: approvalTimeout,
        steps: draftSteps
      });
      if (res.success && res.rule) {
        onRuleCreated(res.rule);
        onClose();
      }
    } else {
      const res = workflowEngine.createRule({
        name,
        description,
        category,
        triggerEvent,
        conditionDescription: conditionDesc,
        actionDescription: actionDesc,
        targetRole,
        approvalRequired,
        approverRole: approvalRequired ? approverRole : undefined,
        approvalTimeoutMinutes: approvalTimeout,
        steps: draftSteps,
        isActive: true,
        createdBy: 'Administrator'
      });
      if (res.success && res.rule) {
        onRuleCreated(res.rule);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <GitBranch className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {initialRule ? 'Edit Hospital Automation Workflow' : 'Visual Hospital Workflow Builder'}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  Stage-Pipeline
                </span>
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Configurable trigger-condition-action pipeline with automated clinical guardrails
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Visual Pipeline Stepper Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Workflow Pipeline Topology (Sequential Stages)
              </label>
              <span className="text-xs text-gray-500">6 Configurable Node Blocks</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {/* Node 1: Trigger */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-xs mb-1">
                  <Zap className="w-3 h-3 text-blue-600" /> 1. Trigger
                </div>
                <p className="text-[10px] text-blue-900 font-medium truncate" title={triggerEvent}>
                  {triggerEvent}
                </p>
                <span className="text-[9px] bg-blue-100 text-blue-700 rounded px-1 mt-1 font-semibold">Event Ingestion</span>
              </div>

              {/* Node 2: Condition */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                <div className="flex items-center justify-center gap-1 text-amber-700 font-bold text-xs mb-1">
                  <GitBranch className="w-3 h-3 text-amber-600" /> 2. Condition
                </div>
                <p className="text-[10px] text-amber-900 font-medium truncate" title={conditionDesc}>
                  {conditionDesc}
                </p>
                <span className="text-[9px] bg-amber-100 text-amber-700 rounded px-1 mt-1 font-semibold">Safety Gate</span>
              </div>

              {/* Node 3: Action */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-xs mb-1">
                  <Play className="w-3 h-3 text-emerald-600" /> 3. Action
                </div>
                <p className="text-[10px] text-emerald-900 font-medium truncate" title={actionDesc}>
                  {actionDesc}
                </p>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded px-1 mt-1 font-semibold">Auto-Dispatch</span>
              </div>

              {/* Node 4: Notification */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                <div className="flex items-center justify-center gap-1 text-purple-700 font-bold text-xs mb-1">
                  <Bell className="w-3 h-3 text-purple-600" /> 4. Notify
                </div>
                <p className="text-[10px] text-purple-900 font-medium capitalize">
                  {targetRole} Consoles
                </p>
                <span className="text-[9px] bg-purple-100 text-purple-700 rounded px-1 mt-1 font-semibold">Audio & Push</span>
              </div>

              {/* Node 5: Approval */}
              <div className={`border rounded-lg p-2.5 text-center flex flex-col justify-between ${
                approvalRequired ? 'bg-orange-50 border-orange-200' : 'bg-gray-100 border-gray-200 opacity-60'
              }`}>
                <div className={`flex items-center justify-center gap-1 font-bold text-xs mb-1 ${
                  approvalRequired ? 'text-orange-700' : 'text-gray-500'
                }`}>
                  <ShieldCheck className="w-3 h-3" /> 5. Approval
                </div>
                <p className={`text-[10px] font-medium capitalize ${
                  approvalRequired ? 'text-orange-900' : 'text-gray-500'
                }`}>
                  {approvalRequired ? `${approverRole} Sign-off` : 'Not Required'}
                </p>
                <span className={`text-[9px] rounded px-1 mt-1 font-semibold ${
                  approvalRequired ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {approvalRequired ? 'Human In The Loop' : 'Direct Pass'}
                </span>
              </div>

              {/* Node 6: Completion */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 text-center flex flex-col justify-between">
                <div className="flex items-center justify-center gap-1 text-teal-700 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" /> 6. Complete
                </div>
                <p className="text-[10px] text-teal-900 font-medium">
                  Audit Log & Sync
                </p>
                <span className="text-[9px] bg-teal-100 text-teal-700 rounded px-1 mt-1 font-semibold">Immutable Record</span>
              </div>
            </div>
          </div>

          {/* Form Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Workflow Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. ICU Step-Down Transfer Protocol"
                className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hospital Workflow Category *
              </label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value as WorkflowCategory)}
                className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Clinical & Operational Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of what this automation governs and accomplishes..."
              className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Trigger & Condition Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Trigger Event */}
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Step 1: Event Trigger *
              </label>
              <select
                value={triggerEvent}
                onChange={e => setTriggerEvent(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white mb-2"
              >
                {PREDEFINED_TRIGGERS[category]?.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                value={triggerEvent}
                onChange={e => setTriggerEvent(e.target.value)}
                placeholder="Or type custom event trigger..."
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Condition Gate */}
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                Step 2: Rule & Safety Condition *
              </label>
              <textarea
                rows={3}
                value={conditionDesc}
                onChange={e => setConditionDesc(e.target.value)}
                placeholder="Condition logic (e.g. Severity == 'Critical' AND Destination ward capacity > 0)"
                className="w-full text-xs px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Action & Notification Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Action Description */}
            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                Step 3: Automated Action Dispatch *
              </label>
              <textarea
                rows={3}
                value={actionDesc}
                onChange={e => setActionDesc(e.target.value)}
                placeholder="Operational action (e.g. Dispatch housekeeping cleaning task; reserve equipment serial number)"
                className="w-full text-xs px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>

            {/* Notification Target */}
            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-purple-600" />
                Step 4: Target Notification Recipient *
              </label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white mb-2"
              >
                <option value="admin">Hospital Admin & Operations Center</option>
                <option value="doctor">Attending & Primary Care Doctors</option>
                <option value="nurse">Ward Charge Nurses & Clinical Stations</option>
                <option value="all">Broadcast to All Clinical & Admin Consoles</option>
              </select>
              <p className="text-[11px] text-gray-500 italic">
                Dispatches high-urgency notifications with audio chime and status badge.
              </p>
            </div>
          </div>

          {/* Human-in-the-Loop Approval Gate */}
          <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                    Step 5: Mandatory Human Authorization (Clinical Safety Gate)
                  </h4>
                  <p className="text-[11px] text-orange-800">
                    Mandatory sign-off prevents fully autonomous allocation of life-critical beds or medications.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={e => setApprovalRequired(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {approvalRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-orange-200/80">
                <div>
                  <label className="block text-xs font-semibold text-orange-950 mb-1">
                    Required Approver Role
                  </label>
                  <select
                    value={approverRole}
                    onChange={e => setApproverRole(e.target.value as any)}
                    className="w-full text-xs px-3 py-1.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="admin">Hospital Administrator / Incident Commander</option>
                    <option value="doctor">Attending Physician / Chief Medical Officer</option>
                    <option value="nurse">Nurse Supervisor / Charge Nurse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-950 mb-1">
                    Auto-Escalation Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={approvalTimeout}
                    onChange={e => setApprovalTimeout(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Safety & Validation Violations ({errors.length}):
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Advisory Recommendations ({warnings.length}):
              </div>
              <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={validateDraft}
            type="button"
            className="text-xs text-gray-600 hover:text-gray-900 font-semibold underline"
          >
            Run Clinical Guardrail Check
          </button>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {initialRule ? 'Save Changes' : 'Activate Automation Rule'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
