import { 
  WorkflowRule, 
  WorkflowExecution, 
  WorkflowExecutionStep,
  WorkflowAuditLog,
  SmartNotificationRule, 
  WorkflowStatistics,
  UserRole
} from '../types';
import { 
  DEFAULT_WORKFLOW_RULES, 
  INITIAL_WORKFLOW_EXECUTIONS, 
  SMART_NOTIFICATION_RULES, 
  INITIAL_WORKFLOW_STATS 
} from '../data/workflowDemoData';
import { hospitalDataService } from './hospitalDataService';

const RULES_STORAGE_KEY = 'medisync_workflow_rules_v1';
const EXECUTIONS_STORAGE_KEY = 'medisync_workflow_executions_v1';
const NOTIFICATIONS_RULES_KEY = 'medisync_smart_notification_rules_v1';
export const WORKFLOW_UPDATED_EVENT = 'medisync_workflow_updated';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private rules: WorkflowRule[] = [];
  private executions: WorkflowExecution[] = [];
  private notificationRules: SmartNotificationRule[] = [];
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  private initialize() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined') {
      try {
        const storedRules = localStorage.getItem(RULES_STORAGE_KEY);
        this.rules = storedRules ? JSON.parse(storedRules) : [...DEFAULT_WORKFLOW_RULES];

        const storedExecutions = localStorage.getItem(EXECUTIONS_STORAGE_KEY);
        this.executions = storedExecutions ? JSON.parse(storedExecutions) : [...INITIAL_WORKFLOW_EXECUTIONS];

        const storedNotifs = localStorage.getItem(NOTIFICATIONS_RULES_KEY);
        this.notificationRules = storedNotifs ? JSON.parse(storedNotifs) : [...SMART_NOTIFICATION_RULES];
      } catch (e) {
        console.warn('Failed to load workflow state from localStorage:', e);
        this.rules = [...DEFAULT_WORKFLOW_RULES];
        this.executions = [...INITIAL_WORKFLOW_EXECUTIONS];
        this.notificationRules = [...SMART_NOTIFICATION_RULES];
      }
    } else {
      this.rules = [...DEFAULT_WORKFLOW_RULES];
      this.executions = [...INITIAL_WORKFLOW_EXECUTIONS];
      this.notificationRules = [...SMART_NOTIFICATION_RULES];
    }

    this.isInitialized = true;
    this.hydrateFromBackend();
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(this.rules));
      localStorage.setItem(EXECUTIONS_STORAGE_KEY, JSON.stringify(this.executions));
      localStorage.setItem(NOTIFICATIONS_RULES_KEY, JSON.stringify(this.notificationRules));
      window.dispatchEvent(new CustomEvent(WORKFLOW_UPDATED_EVENT, { detail: { timestamp: Date.now() } }));
    } catch (e) {
      console.warn('Failed to persist workflow state:', e);
    }
  }

  public async hydrateFromBackend() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('http://localhost:5000/api/workflows/rules');
      if (res.ok) {
        const backendRules = await res.json();
        if (Array.isArray(backendRules) && backendRules.length > 0) {
          this.rules = backendRules;
        }
      }

      const execRes = await fetch('http://localhost:5000/api/workflows/executions');
      if (execRes.ok) {
        const backendExecs = await res.json();
        if (Array.isArray(backendExecs) && backendExecs.length > 0) {
          this.executions = backendExecs;
        }
      }
      this.persist();
    } catch {
      // Backend offline, fallback gracefully to persisted local state
    }
  }

  // ==========================================
  // RULES MANAGEMENT
  // ==========================================

  public getRules(): WorkflowRule[] {
    return [...this.rules];
  }

  public getRuleById(id: string): WorkflowRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  public validateWorkflowRule(rule: Partial<WorkflowRule>): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!rule.name || rule.name.trim().length < 3) {
      errors.push('Workflow name must be at least 3 characters.');
    }
    if (!rule.category) {
      errors.push('Workflow category is required.');
    }
    if (!rule.triggerEvent || rule.triggerEvent.trim().length === 0) {
      errors.push('A valid trigger event is required.');
    }
    if (!rule.steps || rule.steps.length < 2) {
      errors.push('Workflow must contain at least 2 steps (Trigger and Action or Completion).');
    }

    // Safety Validations
    const ruleContent = `${rule.name || ''} ${rule.description || ''} ${rule.actionDescription || ''} ${JSON.stringify(rule.steps || [])}`.toLowerCase();

    if (ruleContent.includes('auto-prescribe') || ruleContent.includes('prescribe medication automatically')) {
      errors.push('SAFETY VIOLATION: Automated prescription of medication is strictly prohibited.');
    }

    if (ruleContent.includes('auto-diagnose') || ruleContent.includes('automate medical diagnosis')) {
      errors.push('SAFETY VIOLATION: Clinical medical diagnosis cannot be automated.');
    }

    if (rule.category === 'Discharge' && !rule.approvalRequired) {
      errors.push('SAFETY VIOLATION: Patient discharge workflows must mandate Attending Physician authorization.');
    }

    if (rule.category === 'Resource Requests' && !rule.approvalRequired) {
      warnings.push('CAUTION: Critical resources (Ventilators, ICU Beds) require Hospital Administrator approval.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  public createRule(ruleData: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'isSystemRule'>): { success: boolean; rule?: WorkflowRule; errors?: string[] } {
    const validation = this.validateWorkflowRule(ruleData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newRule: WorkflowRule = {
      ...ruleData,
      id: `rule-custom-${Date.now()}`,
      isSystemRule: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.rules.unshift(newRule);
    this.persist();

    // Sync to backend if available
    if (typeof window !== 'undefined') {
      fetch('http://localhost:5000/api/workflows/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      }).catch(() => {});
    }

    return { success: true, rule: newRule };
  }

  public updateRule(id: string, updates: Partial<WorkflowRule>): { success: boolean; rule?: WorkflowRule; errors?: string[] } {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, errors: ['Workflow rule not found'] };
    }

    const targetRule = this.rules[index];
    const merged = { ...targetRule, ...updates, updatedAt: new Date().toISOString() };
    const validation = this.validateWorkflowRule(merged);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    this.rules[index] = merged;
    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      }).catch(() => {});
    }

    return { success: true, rule: merged };
  }

  public toggleRuleActive(id: string): boolean {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return false;
    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date().toISOString();
    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: rule.isActive })
      }).catch(() => {});
    }

    return true;
  }

  public deleteRule(id: string): { success: boolean; error?: string } {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) {
      return { success: false, error: 'Rule not found' };
    }
    if (rule.isSystemRule) {
      return { success: false, error: 'System rules cannot be deleted. Deactivate them instead.' };
    }

    this.rules = this.rules.filter(r => r.id !== id);
    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/rules/${id}`, { method: 'DELETE' }).catch(() => {});
    }

    return { success: true };
  }

  // ==========================================
  // EXECUTIONS MANAGEMENT
  // ==========================================

  public getExecutions(filter?: { status?: string; category?: string }): WorkflowExecution[] {
    let list = [...this.executions];
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(e => e.status === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      list = list.filter(e => e.category === filter.category);
    }
    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public getExecutionById(id: string): WorkflowExecution | undefined {
    return this.executions.find(e => e.id === id);
  }

  public triggerWorkflow(params: {
    ruleId: string;
    triggerData: WorkflowExecution['triggerData'];
    initiatedBy: string;
    isDemo?: boolean;
  }): WorkflowExecution {
    const rule = this.rules.find(r => r.id === params.ruleId);
    if (!rule) {
      throw new Error('Workflow rule not found');
    }

    const nowIso = new Date().toISOString();
    const executionId = `exec-${Date.now()}`;
    const totalSteps = rule.steps.length;

    const steps: WorkflowExecutionStep[] = rule.steps.map((s, idx) => ({
      stepId: s.id,
      name: s.name,
      type: s.type,
      status: idx === 0 ? 'completed' : 'pending',
      details: s.description,
      timestamp: idx === 0 ? nowIso : undefined,
      actor: idx === 0 ? params.initiatedBy : undefined
    }));

    // Evaluate steps
    const hasApproval = rule.approvalRequired && steps.some(s => s.type === 'approval');
    const approvalIndex = steps.findIndex(s => s.type === 'approval');

    let currentStepIndex = 1;
    let status: WorkflowExecution['status'] = 'running';

    if (hasApproval && approvalIndex !== -1) {
      for (let i = 0; i < approvalIndex; i++) {
        steps[i].status = 'completed';
        steps[i].timestamp = nowIso;
      }
      steps[approvalIndex].status = 'in_progress';
      steps[approvalIndex].details = `Awaiting authorized ${rule.approverRole || 'administrator'} digital sign-off`;
      currentStepIndex = approvalIndex;
      status = 'waiting_approval';
    } else {
      steps.forEach(s => {
        s.status = 'completed';
        s.timestamp = nowIso;
      });
      currentStepIndex = totalSteps;
      status = 'completed';
    }

    const initialAudit: WorkflowAuditLog[] = [
      {
        id: `aud-${Date.now()}-1`,
        executionId,
        ruleName: rule.name,
        stepName: steps[0].name,
        action: 'TRIGGER_ACTIVATED',
        actor: params.initiatedBy,
        actorRole: 'Clinician / System Dispatch',
        timestamp: nowIso,
        newState: 'Active',
        note: `Trigger event: ${params.triggerData.summary}`
      }
    ];

    if (status === 'waiting_approval' && approvalIndex !== -1) {
      initialAudit.push({
        id: `aud-${Date.now()}-2`,
        executionId,
        ruleName: rule.name,
        stepName: steps[approvalIndex].name,
        action: 'APPROVAL_REQUESTED',
        actor: 'Workflow Engine',
        actorRole: 'System Guardrail',
        timestamp: nowIso,
        newState: 'Waiting Approval',
        note: `Holding execution for ${rule.approverRole || 'administrator'} authorization`
      });

      // Dispatch shared notification
      hospitalDataService.addNotification({
        title: `Workflow Approval Required: ${rule.name}`,
        message: `${params.triggerData.summary}. Awaiting authorization from ${rule.approverRole || 'admin'}.`,
        type: params.triggerData.urgency === 'Critical' ? 'critical' : 'info',
        targetRole: (rule.approverRole as UserRole) || 'admin',
        category: 'emergency_request',
        requestId: executionId
      });
    }

    const newExecution: WorkflowExecution = {
      id: executionId,
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      status,
      triggerData: params.triggerData,
      currentStepIndex,
      totalSteps,
      steps,
      startedAt: nowIso,
      completedAt: status === 'completed' ? nowIso : undefined,
      durationSeconds: status === 'completed' ? 4 : 0,
      initiatedBy: params.initiatedBy,
      assignedApprover: rule.approverRole ? `${rule.approverRole.toUpperCase()} On-Duty` : undefined,
      retryCount: 0,
      auditLogs: initialAudit,
      isDemo: params.isDemo || false
    };

    this.executions.unshift(newExecution);
    this.persist();

    return newExecution;
  }

  public async approveExecution(
    executionId: string, 
    approver: string, 
    approverRole: string, 
    comments?: string
  ): Promise<WorkflowExecution> {
    const execution = this.executions.find(e => e.id === executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }
    if (execution.status !== 'waiting_approval') {
      throw new Error(`Execution is not in waiting_approval status (current: ${execution.status})`);
    }

    const nowIso = new Date().toISOString();

    execution.steps.forEach(s => {
      s.status = 'completed';
      s.timestamp = nowIso;
      if (s.type === 'approval') {
        s.actor = approver;
        s.details = `Authorized by ${approver} (${approverRole}): ${comments || 'Verified and approved'}`;
      }
    });

    execution.status = 'completed';
    execution.currentStepIndex = execution.totalSteps;
    execution.completedAt = nowIso;
    execution.durationSeconds = Math.max(12, Math.floor((new Date(nowIso).getTime() - new Date(execution.startedAt).getTime()) / 1000));

    execution.auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId,
      ruleName: execution.ruleName,
      stepName: 'Authorization Sign-off',
      action: 'APPROVAL_GRANTED',
      actor: approver,
      actorRole: approverRole,
      timestamp: nowIso,
      previousState: 'waiting_approval',
      newState: 'completed',
      note: comments || 'Authorized and digitally signed'
    });

    // Side-effects on real hospital systems
    if (execution.category === 'Bed Readiness' && execution.triggerData.entityId) {
      hospitalDataService.updateBedStatus(execution.triggerData.entityId, 'Available', `Sterile readiness verified by ${approver}`);
    } else if (execution.category === 'Equipment Maintenance' && execution.triggerData.entityId) {
      hospitalDataService.updateEquipmentStatus(execution.triggerData.entityId, 'Operational');
    }

    // Notify requester
    hospitalDataService.addNotification({
      title: `Workflow Completed: ${execution.ruleName}`,
      message: `${execution.triggerData.summary} has been verified and authorized by ${approver}.`,
      type: 'success',
      targetRole: 'doctor',
      category: 'emergency_request',
      requestId: executionId
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/executions/${executionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver, approverRole, comments })
      }).catch(() => {});
    }

    return execution;
  }

  public async rejectExecution(
    executionId: string, 
    reviewer: string, 
    reason: string
  ): Promise<WorkflowExecution> {
    const execution = this.executions.find(e => e.id === executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const nowIso = new Date().toISOString();
    const approvalStep = execution.steps.find(s => s.type === 'approval');
    if (approvalStep) {
      approvalStep.status = 'failed';
      approvalStep.error = reason;
      approvalStep.actor = reviewer;
    }

    execution.status = 'failed';
    execution.failureReason = reason;
    execution.completedAt = nowIso;

    execution.auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId,
      ruleName: execution.ruleName,
      stepName: 'Authorization Gate',
      action: 'APPROVAL_REJECTED',
      actor: reviewer,
      actorRole: 'Reviewer',
      timestamp: nowIso,
      previousState: 'waiting_approval',
      newState: 'failed',
      note: reason
    });

    hospitalDataService.addNotification({
      title: `Workflow Action Rejected: ${execution.ruleName}`,
      message: `${execution.triggerData.summary} was rejected by ${reviewer}. Reason: ${reason}`,
      type: 'warning',
      targetRole: 'doctor',
      category: 'emergency_request',
      requestId: executionId
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/executions/${executionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer, reason })
      }).catch(() => {});
    }

    return execution;
  }

  public async retryExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = this.executions.find(e => e.id === executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const nowIso = new Date().toISOString();
    const failedStep = execution.steps.find(s => s.status === 'failed');
    if (failedStep) {
      failedStep.status = failedStep.type === 'approval' ? 'in_progress' : 'pending';
      delete failedStep.error;
    }

    execution.status = failedStep?.type === 'approval' ? 'waiting_approval' : 'running';
    execution.failureReason = undefined;
    execution.retryCount += 1;

    execution.auditLogs.push({
      id: `aud-${Date.now()}`,
      executionId,
      ruleName: execution.ruleName,
      stepName: 'Manual Operator Retry',
      action: 'WORKFLOW_RETRIED',
      actor: 'System Operator',
      actorRole: 'admin',
      timestamp: nowIso,
      previousState: 'failed',
      newState: execution.status,
      note: `Retry attempt #${execution.retryCount}`
    });

    this.persist();

    if (typeof window !== 'undefined') {
      fetch(`http://localhost:5000/api/workflows/executions/${executionId}/retry`, {
        method: 'POST'
      }).catch(() => {});
    }

    return execution;
  }

  // ==========================================
  // SMART NOTIFICATIONS
  // ==========================================

  public getSmartNotificationRules(): SmartNotificationRule[] {
    return [...this.notificationRules];
  }

  public toggleNotificationRule(id: string): boolean {
    const rule = this.notificationRules.find(r => r.id === id);
    if (!rule) return false;
    rule.isActive = !rule.isActive;
    this.persist();
    return true;
  }

  public updateNotificationRule(id: string, updates: Partial<SmartNotificationRule>): SmartNotificationRule | null {
    const rule = this.notificationRules.find(r => r.id === id);
    if (!rule) return null;
    Object.assign(rule, updates);
    this.persist();
    return rule;
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  public getStatistics(): WorkflowStatistics {
    const total = this.executions.length;
    const active = this.executions.filter(e => e.status === 'running').length;
    const waiting = this.executions.filter(e => e.status === 'waiting_approval').length;
    const completed = this.executions.filter(e => e.status === 'completed').length;
    const failed = this.executions.filter(e => e.status === 'failed').length;

    const completedWithDuration = this.executions.filter(e => e.status === 'completed' && e.durationSeconds);
    const avgDurationSeconds = completedWithDuration.length > 0 
      ? completedWithDuration.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / completedWithDuration.length 
      : 228;

    return {
      totalExecutions: total || INITIAL_WORKFLOW_STATS.totalExecutions,
      activeExecutions: active,
      completedExecutions: completed,
      pendingApprovals: waiting,
      failedExecutions: failed,
      avgDurationMinutes: Math.round((avgDurationSeconds / 60) * 10) / 10,
      successRatePercent: total > 0 ? Math.round((completed / total) * 1000) / 10 : 97.6,
      manualApprovalsCount: this.executions.filter(e => e.steps.some(s => s.type === 'approval' && s.status === 'completed')).length + 29
    };
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
