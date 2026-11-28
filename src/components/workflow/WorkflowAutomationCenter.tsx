import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Filter, 
  Search, 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  RotateCw, 
  Eye, 
  Check, 
  Trash2, 
  Edit3, 
  Activity, 
  FileText, 
  Cpu, 
  Sliders, 
  ChevronRight, 
  ExternalLink,
  Volume2,
  VolumeX,
  Stethoscope,
  Building2,
  Bed,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  WorkflowRule, 
  WorkflowExecution, 
  SmartNotificationRule, 
  WorkflowStatistics,
  WorkflowCategory,
  UserRole
} from '../../types';
import { workflowEngine, WORKFLOW_UPDATED_EVENT } from '../../services/workflowEngine';
import { VisualWorkflowBuilder } from './VisualWorkflowBuilder';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface WorkflowAutomationCenterProps {
  activeRole?: 'admin' | 'doctor' | 'nurse';
  onNavigateTab?: (tabId: string) => void;
}

type MainTab = 'executions' | 'rules' | 'approvals' | 'notifications' | 'audit' | 'safety';

export const WorkflowAutomationCenter: React.FC<WorkflowAutomationCenterProps> = ({
  activeRole = 'admin',
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('executions');
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [notificationRules, setNotificationRules] = useState<SmartNotificationRule[]>([]);
  const [stats, setStats] = useState<WorkflowStatistics>(workflowEngine.getStatistics());
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedRuleToEdit, setSelectedRuleToEdit] = useState<WorkflowRule | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  
  // Feedback alerts
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setRules(workflowEngine.getRules());
    setExecutions(workflowEngine.getExecutions());
    setNotificationRules(workflowEngine.getSmartNotificationRules());
    setStats(workflowEngine.getStatistics());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener(WORKFLOW_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(WORKFLOW_UPDATED_EVENT, handleUpdate);
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionAlert({ type, message });
    setTimeout(() => setActionAlert(null), 5000);
  };

  // Approval handlers
  const handleApprove = async (execId: string, comments?: string) => {
    try {
      const approverName = activeRole === 'admin' 
        ? 'Hospital Administrator' 
        : (activeRole === 'doctor' ? 'Dr. Sarah Jenkins (Attending)' : 'Charge Nurse Mary');
      await workflowEngine.approveExecution(execId, approverName, activeRole, comments);
      loadData();
      showNotification('success', 'Workflow step authorized and execution progressed to completion.');
      if (selectedExecution?.id === execId) {
        setSelectedExecution(workflowEngine.getExecutionById(execId) || null);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to approve workflow');
    }
  };

  const handleReject = async (execId: string, reason: string) => {
    try {
      const reviewerName = activeRole === 'admin' 
        ? 'Hospital Administrator' 
        : (activeRole === 'doctor' ? 'Dr. Sarah Jenkins' : 'Charge Nurse Mary');
      await workflowEngine.rejectExecution(execId, reviewerName, reason);
      loadData();
      showNotification('success', 'Workflow step rejected. Audit record logged.');
      if (selectedExecution?.id === execId) {
        setSelectedExecution(workflowEngine.getExecutionById(execId) || null);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to reject workflow');
    }
  };

  const handleRetry = async (execId: string) => {
    try {
      await workflowEngine.retryExecution(execId);
      loadData();
      showNotification('success', 'Workflow execution resumed from failed step.');
      if (selectedExecution?.id === execId) {
        setSelectedExecution(workflowEngine.getExecutionById(execId) || null);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to retry workflow');
    }
  };

  const handleToggleRule = (ruleId: string) => {
    workflowEngine.toggleRuleActive(ruleId);
    loadData();
    showNotification('success', 'Workflow rule status updated.');
  };

  const handleDeleteRule = (ruleId: string) => {
    const res = workflowEngine.deleteRule(ruleId);
    if (res.success) {
      loadData();
      showNotification('success', 'Custom workflow rule deleted.');
    } else {
      showNotification('error', res.error || 'Failed to delete rule');
    }
  };

  const handleToggleNotification = (id: string) => {
    workflowEngine.toggleNotificationRule(id);
    loadData();
    showNotification('success', 'Notification rule updated.');
  };

  const handleQuickTrigger = (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const triggerData = {
        event: rule.triggerEvent,
        summary: `Simulated trigger for: ${rule.name}`,
        urgency: rule.category === 'Resource Requests' || rule.category === 'Emergency Coordination' ? ('Critical' as const) : ('Urgent' as const),
        department: 'Acute Care / Inpatient'
      };

      const newExec = workflowEngine.triggerWorkflow({
        ruleId,
        triggerData,
        initiatedBy: `Manual Trigger (${activeRole.toUpperCase()})`,
        isDemo: true
      });

      loadData();
      setSelectedExecution(newExec);
      setIsTriggerModalOpen(false);
      setActiveTab('executions');
      showNotification('success', `Workflow "${rule.name}" triggered successfully.`);
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to trigger workflow');
    }
  };

  // Filtered executions
  const filteredExecutions = executions.filter(e => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchQuery = !searchQuery || 
      e.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.triggerData.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchCategory && matchQuery;
  });

  // Filtered rules
  const filteredRules = rules.filter(r => {
    const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchQuery = !searchQuery || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Pending Approvals queue
  const pendingApprovals = executions.filter(e => e.status === 'waiting_approval');

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner Alert */}
      {actionAlert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-sm transition-all ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">{actionAlert.message}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-gray-400 hover:text-gray-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl shadow-md text-white">
              <Workflow className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Intelligent Hospital Workflow Automation
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Autonomous Engine v2.4
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                  Role: {activeRole}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 max-w-3xl">
                Event-driven coordination between Doctors, Nurses, and Hospital Admin. Automates resource requisitions, bed turnover sanitation, device maintenance, and clinical handover guardrails.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTriggerModalOpen(true)}
              className="flex items-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              Test Trigger
            </Button>
            {activeRole === 'admin' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedRuleToEdit(null);
                  setIsBuilderOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Visual Workflow Builder
              </Button>
            )}
          </div>
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">Total Triggered</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">{stats.totalExecutions}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Automated Workflows</div>
          </div>
          <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200">
            <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3" /> Active / In-Flight
            </div>
            <div className="text-xl font-black text-blue-900 mt-0.5">{stats.activeExecutions}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Sequential stages</div>
          </div>
          <div className="bg-orange-50/80 rounded-xl p-3 border border-orange-200">
            <div className="text-xs text-orange-700 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Approvals
            </div>
            <div className="text-xl font-black text-orange-900 mt-0.5">{stats.pendingApprovals}</div>
            <div className="text-[10px] text-orange-700 mt-0.5">Human sign-off required</div>
          </div>
          <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200">
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Success Rate
            </div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.successRatePercent}%</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">{stats.completedExecutions} completed</div>
          </div>
          <div className="bg-purple-50/80 rounded-xl p-3 border border-purple-200">
            <div className="text-xs text-purple-700 font-medium flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Avg Turnaround
            </div>
            <div className="text-xl font-black text-purple-900 mt-0.5">{stats.avgDurationMinutes}m</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Intake to clearance</div>
          </div>
          <div className="bg-teal-50/80 rounded-xl p-3 border border-teal-200">
            <div className="text-xs text-teal-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Human Verified
            </div>
            <div className="text-xl font-black text-teal-900 mt-0.5">{stats.manualApprovalsCount}</div>
            <div className="text-[10px] text-teal-700 mt-0.5">Safety compliant</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-gray-200 overflow-x-auto bg-white p-1 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('executions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'executions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Active & In-Flight Executions
          {stats.activeExecutions > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
              activeTab === 'executions' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {stats.activeExecutions}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'rules'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Automation Rules & Pipelines
          <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
            activeTab === 'rules' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {rules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'approvals'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Approvals Queue
          {pendingApprovals.length > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
              activeTab === 'approvals' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
            }`}>
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Smart Notification Rules
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail & History
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'safety'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          Clinical Guardrails & Safety
        </button>
      </div>

      {/* Filter and Search Bar */}
      {(activeTab === 'executions' || activeTab === 'rules' || activeTab === 'audit') && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search workflows, rules, or IDs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Resource Requests">Resource Requests</option>
              <option value="Bed Readiness">Bed Readiness</option>
              <option value="Equipment Maintenance">Equipment Maintenance</option>
              <option value="Patient Transfer">Patient Transfer</option>
              <option value="Clinical Tasks">Clinical Tasks</option>
              <option value="Discharge">Discharge</option>
              <option value="Emergency Coordination">Emergency Coordination</option>
            </select>

            {activeTab === 'executions' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="running">In Progress (Running)</option>
                <option value="waiting_approval">Waiting Approval</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed / Escalated</option>
              </select>
            )}
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>Showing {activeTab === 'executions' ? filteredExecutions.length : filteredRules.length} items</span>
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-emerald-600 hover:text-emerald-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: EXECUTIONS */}
      {activeTab === 'executions' && (
        <div className="space-y-3">
          {filteredExecutions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No Workflow Executions Found</h3>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or launch a test workflow trigger.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTriggerModalOpen(true)}
                className="mt-4"
              >
                Trigger Sample Workflow
              </Button>
            </div>
          ) : (
            filteredExecutions.map(exec => {
              const currentStep = exec.steps[exec.currentStepIndex - 1] || exec.steps[0];
              const progressPercent = Math.round((exec.currentStepIndex / exec.totalSteps) * 100);

              return (
                <div 
                  key={exec.id} 
                  className={`bg-white rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
                    exec.status === 'waiting_approval' 
                      ? 'border-orange-300 bg-orange-50/20' 
                      : (exec.status === 'failed' ? 'border-red-300 bg-red-50/20' : 'border-gray-200')
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-gray-400">{exec.id}</span>
                        <h3 className="text-base font-bold text-gray-900">{exec.ruleName}</h3>
                        <Badge 
                          variant={
                            exec.category === 'Resource Requests' ? 'critical' :
                            exec.category === 'Bed Readiness' ? 'secondary' :
                            exec.category === 'Equipment Maintenance' ? 'warning' : 'primary'
                          }
                          size="sm"
                        >
                          {exec.category}
                        </Badge>
                        <Badge
                          variant={
                            exec.status === 'completed' ? 'success' :
                            exec.status === 'waiting_approval' ? 'warning' :
                            exec.status === 'failed' ? 'critical' : 'primary'
                          }
                          size="sm"
                        >
                          {exec.status === 'waiting_approval' ? 'Waiting Approval' : exec.status.toUpperCase()}
                        </Badge>
                        {exec.isDemo && (
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            Demo Simulator
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 font-medium">
                        {exec.triggerData.summary}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-gray-500 flex-wrap pt-1">
                        <span>Initiated by: <strong className="text-gray-700">{exec.initiatedBy}</strong></span>
                        <span>Started: <strong className="text-gray-700">{new Date(exec.startedAt).toLocaleTimeString()}</strong></span>
                        {exec.completedAt && (
                          <span>Completed in: <strong className="text-gray-700">{exec.durationSeconds}s</strong></span>
                        )}
                        {exec.assignedApprover && exec.status === 'waiting_approval' && (
                          <span className="text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded">
                            Awaiting: {exec.assignedApprover}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Progress & Actions */}
                    <div className="flex flex-col items-end gap-2 min-w-[260px]">
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 font-medium">
                            Step {exec.currentStepIndex} of {exec.totalSteps}: <strong className="text-gray-800">{currentStep?.name}</strong>
                          </span>
                          <span className="font-bold text-gray-700">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              exec.status === 'completed' ? 'bg-emerald-500' :
                              exec.status === 'failed' ? 'bg-red-500' :
                              exec.status === 'waiting_approval' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {exec.status === 'waiting_approval' && (
                          <>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleApprove(exec.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Authorize
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReject(exec.id, 'Clinical safety review constraint')}
                              className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2.5 py-1"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {exec.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(exec.id)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2.5 py-1"
                          >
                            <RotateCw className="w-3.5 h-3.5 mr-1" />
                            Retry Action
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedExecution(exec)}
                          className="text-xs px-2.5 py-1 text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Pipeline & Logs
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Failure reason callout */}
                  {exec.failureReason && (
                    <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-200 text-xs text-red-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span><strong>Workflow Failure / Escalation:</strong> {exec.failureReason}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-red-700">Retry count: {exec.retryCount}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: RULES */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map(rule => (
            <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {rule.category}
                    </Badge>
                    {rule.isSystemRule && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        System Protocol
                      </span>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={() => handleToggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <h3 className="text-base font-bold text-gray-900">{rule.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{rule.description}</p>

                {/* Pipeline Stages Mini Summary */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-[11px] flex items-center justify-between text-gray-500">
                    <span className="font-semibold text-gray-700">Event Trigger:</span>
                    <span className="font-mono text-blue-700">{rule.triggerEvent}</span>
                  </div>
                  <div className="text-[11px] flex items-center justify-between text-gray-500">
                    <span className="font-semibold text-gray-700">Condition Gate:</span>
                    <span className="truncate max-w-[200px] text-amber-700" title={rule.conditionDescription}>{rule.conditionDescription}</span>
                  </div>
                  <div className="text-[11px] flex items-center justify-between text-gray-500">
                    <span className="font-semibold text-gray-700">Human Approval:</span>
                    <span className="font-semibold text-orange-700">
                      {rule.approvalRequired ? `Mandatory (${rule.approverRole || 'Admin'})` : 'Auto-Proceed'}
                    </span>
                  </div>
                </div>

                {/* Step blocks preview */}
                <div className="flex items-center gap-1 mt-3 overflow-x-auto py-1">
                  {rule.steps.map((st, i) => (
                    <div key={st.id} className="flex items-center flex-shrink-0">
                      <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded border border-gray-200">
                        {i + 1}. {st.name}
                      </span>
                      {i < rule.steps.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-gray-400 mx-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickTrigger(rule.id)}
                  disabled={!rule.isActive}
                  className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Test Run
                </Button>

                <div className="flex items-center gap-1.5">
                  {activeRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRuleToEdit(rule);
                        setIsBuilderOpen(true);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Configure
                    </Button>
                  )}
                  {!rule.isSystemRule && activeRole === 'admin' && (
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                      title="Delete custom rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PENDING APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-950">
                  Clinical & Administrative Authorization Gate
                </h3>
                <p className="text-xs text-orange-800 mt-0.5">
                  High-risk clinical decisions (bed turnaround, critical resource allocation, patient discharge) cannot be finalized without human sign-off.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-orange-200 text-orange-900 px-3 py-1 rounded-full">
              {pendingApprovals.length} Action Items
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">All Approvals Up To Date</h3>
              <p className="text-xs text-gray-500 mt-1">There are no pending workflows waiting for authorization.</p>
            </div>
          ) : (
            pendingApprovals.map(exec => (
              <div key={exec.id} className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">{exec.id}</span>
                      <h4 className="text-base font-bold text-gray-900">{exec.ruleName}</h4>
                      <Badge variant="warning" size="sm">Awaiting Authorization</Badge>
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {exec.triggerData.urgency} Urgency
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 font-medium">{exec.triggerData.summary}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                      <span>Department: <strong>{exec.triggerData.department || 'Clinical Wards'}</strong></span>
                      <span>Initiated by: <strong>{exec.initiatedBy}</strong></span>
                      <span>Waiting since: <strong>{new Date(exec.startedAt).toLocaleTimeString()}</strong></span>
                      <span>Assigned to: <strong className="text-orange-700">{exec.assignedApprover}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(exec.id, 'Verified clinical parameters and safety compliance')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Authorize & Sign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(exec.id, 'Declined due to clinical bed capacity or maintenance conflict')}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExecution(exec)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Inspect Audit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SMART NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Configurable Smart Notification & Escalation Protocols
            </h3>
            <p className="text-xs text-gray-600">
              Dispatches multi-channel audio alerts, dashboard badges, and automated escalations when critical alerts remain unacknowledged.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationRules.map(nr => (
              <div key={nr.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          nr.priority === 'Critical' ? 'critical' :
                          nr.priority === 'High' ? 'warning' : 'primary'
                        }
                        size="sm"
                      >
                        {nr.priority}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Target: {nr.targetRole}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mt-1">{nr.name}</h4>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nr.isActive}
                      onChange={() => handleToggleNotification(nr.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p className="text-xs text-gray-600">{nr.description}</p>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {nr.soundAlert ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                    {nr.soundAlert ? 'Audible Chime Enabled' : 'Silent Push Badge'}
                  </span>
                  <span className="font-semibold text-gray-700">
                    Escalates in: {nr.escalationIntervalMinutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Immutable Workflow Execution Audit Ledger
            </h3>
            <span className="text-xs text-gray-500">Logged with microsecond precision & actor IDs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Workflow & ID</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">State Transition</th>
                  <th className="px-4 py-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {executions.flatMap(e => e.auditLogs).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <div>{log.ruleName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{log.executionId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.actor}</div>
                      <div className="text-[10px] text-gray-500 capitalize">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      {log.previousState ? (
                        <span className="text-gray-500">
                          {log.previousState} <ArrowRight className="w-3 h-3 inline text-gray-400" /> <strong className="text-gray-900">{log.newState}</strong>
                        </span>
                      ) : (
                        <span className="text-gray-900 font-medium">{log.newState || 'Executed'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.note}>
                      {log.note || 'Workflow step processed according to protocol.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SAFETY & CLINICAL GUARDRAILS */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-700 to-rose-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-200 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold">Non-Negotiable Clinical Safety Guardrails</h3>
                <p className="text-xs text-rose-100 mt-1">
                  MediSync AI Workflow Engine enforces strict safety constraints to protect patient life and uphold regulatory compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5" /> 1. No Automated Medical Diagnosis
              </div>
              <p className="text-xs text-gray-600">
                The workflow engine ingests telemetry and clinical parameters to streamline administrative routing, but <strong>never generates autonomous diagnostic determinations</strong>. All clinical diagnoses remain the exclusive responsibility of licensed physicians.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5" /> 2. No Automated Medication Prescriptions
              </div>
              <p className="text-xs text-gray-600">
                Workflows may prepare pharmacy reconciliation forms or prompt clinicians regarding scheduled medication administration, but <strong>cannot automatically dispense, alter, or prescribe drugs</strong>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5" /> 3. Mandatory Doctor Discharge Approval
              </div>
              <p className="text-xs text-gray-600">
                Discharge workflows coordinate multi-department prerequisite checklists (labs, billing, pharmacy), but <strong>cannot automatically discharge an inpatient</strong> without the verified digital authorization of the attending physician.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5" /> 4. Critical Asset Authorization Guard
              </div>
              <p className="text-xs text-gray-600">
                Life-support machinery (mechanical ventilators, ECMO, dialysis) and critical beds (ICU, trauma bay) <strong>cannot be auto-allocated without explicit administrator or medical director sign-off</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Detail Drawer / Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{selectedExecution.id}</span>
                  <Badge variant="primary" size="sm">{selectedExecution.status.toUpperCase()}</Badge>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedExecution.ruleName}</h3>
              </div>
              <button 
                onClick={() => setSelectedExecution(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Trigger Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Execution Ingestion Context
                </h4>
                <p className="text-sm font-semibold text-gray-900">{selectedExecution.triggerData.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                  <div>Department: <strong className="text-gray-800">{selectedExecution.triggerData.department || 'Clinical Wards'}</strong></div>
                  <div>Urgency: <strong className="text-gray-800">{selectedExecution.triggerData.urgency}</strong></div>
                  <div>Initiated By: <strong className="text-gray-800">{selectedExecution.initiatedBy}</strong></div>
                  <div>Duration: <strong className="text-gray-800">{selectedExecution.durationSeconds ? `${selectedExecution.durationSeconds}s` : 'In Progress'}</strong></div>
                </div>
              </div>

              {/* Step Pipeline Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Sequential Execution Steps ({selectedExecution.steps.length})
                </h4>
                <div className="space-y-3">
                  {selectedExecution.steps.map((st, idx) => (
                    <div 
                      key={st.stepId} 
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                        st.status === 'completed' ? 'bg-emerald-50/60 border-emerald-200' :
                        st.status === 'in_progress' ? 'bg-blue-50/60 border-blue-200' :
                        st.status === 'failed' ? 'bg-red-50/60 border-red-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full mt-0.5 ${
                          st.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          st.status === 'in_progress' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                          st.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {st.status === 'completed' ? <Check className="w-3.5 h-3.5" /> : 
                           st.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : 
                           <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{idx + 1}. {st.name}</span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                              {st.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{st.details}</p>
                          {st.error && (
                            <p className="text-xs text-red-600 font-semibold mt-1">Error: {st.error}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-gray-500 whitespace-nowrap">
                        <div>{st.timestamp ? new Date(st.timestamp).toLocaleTimeString() : 'Pending'}</div>
                        {st.actor && <div className="text-gray-700 font-medium">{st.actor}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Audit Trail */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Audit History Logs
                </h4>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  {selectedExecution.auditLogs.map(a => (
                    <div key={a.id} className="text-xs flex items-start justify-between gap-2 border-b border-gray-200 pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <span className="font-mono text-blue-700 font-semibold">[{a.action}]</span>{' '}
                        <span className="text-gray-900">{a.stepName}</span> —{' '}
                        <span className="text-gray-600">{a.note}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Workflow ID: <strong className="font-mono">{selectedExecution.id}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedExecution.status === 'waiting_approval' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedExecution.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Authorize Step
                  </Button>
                )}
                {selectedExecution.status === 'failed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRetry(selectedExecution.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Retry Step
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedExecution(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Trigger Modal */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold">Simulate Workflow Event Trigger</h3>
              </div>
              <button onClick={() => setIsTriggerModalOpen(false)} className="text-white/80 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                Select an institutional workflow rule to execute in the live automation sandbox. The system will process conditions, evaluate gates, and dispatch task reminders.
              </p>

              <div className="space-y-2">
                {rules.filter(r => r.isActive).map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleQuickTrigger(r.id)}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">{r.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{r.category} • {r.triggerEvent}</div>
                    </div>
                    <Play className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
              <Button variant="outline" size="sm" onClick={() => setIsTriggerModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Workflow Builder Modal */}
      <VisualWorkflowBuilder
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setSelectedRuleToEdit(null);
        }}
        onRuleCreated={() => {
          loadData();
          showNotification('success', 'Workflow automation rule configured and registered.');
        }}
        initialRule={selectedRuleToEdit}
      />
    </div>
  );
};
