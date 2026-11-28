import { WorkflowRule, WorkflowExecution, SmartNotificationRule, WorkflowStatistics } from '../types';

export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'rule-wf-01',
    name: 'Emergency Clinical Requisition Authorization',
    description: 'Automatically validates resource requisitions, checks live bed/equipment telemetry, and routes to Hospital Admin with priority alerts. Never auto-allocates critical assets without human authorization.',
    category: 'Resource Requests',
    triggerEvent: 'Doctor submits emergency resource request',
    conditionDescription: 'Request severity is Critical or High, or requested item is Ventilator / ICU Bed',
    actionDescription: 'Validate live inventory telemetry, notify on-duty Hospital Administrator, track approval state, notify doctor on completion',
    targetRole: 'admin',
    approvalRequired: true,
    approverRole: 'admin',
    approvalTimeoutMinutes: 20,
    steps: [
      { id: 's1', name: 'Requisition Intake', type: 'trigger', description: 'Doctor files resource requisition', config: {}, order: 1 },
      { id: 's2', name: 'Inventory & Bed Check', type: 'condition', description: 'Validate request information and check telemetry availability', config: {}, order: 2 },
      { id: 's3', name: 'Admin Priority Alert', type: 'notification', description: 'Alert Hospital Admin via audible dispatch & push badge', config: { priority: 'Critical', channel: 'Audio + Console' }, order: 3 },
      { id: 's4', name: 'Authorized Sign-off', type: 'approval', description: 'Admin verifies clinical urgency and confirms resource allocation', config: { approverRole: 'admin' }, order: 4 },
      { id: 's5', name: 'Fulfillment & Audit', type: 'completion', description: 'Update inventory, notify Doctor, log immutable audit record', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'System Clinical Ops',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-02',
    name: 'Bed Readiness & Sanitation Verification',
    description: 'Coordinates housekeeping terminal disinfection and charge nurse clinical check-off before beds transition to Ready. Prevents unverified bed reuse.',
    category: 'Bed Readiness',
    triggerEvent: 'Bed marked Cleaning or Unavailable',
    conditionDescription: 'Bed is in Critical Care, ICU, or Emergency Trauma bay',
    actionDescription: 'Dispatch sanitation ticket, notify Floor Supervisor, verify inspection, update Doctor Dashboard upon verification',
    targetRole: 'nurse',
    approvalRequired: true,
    approverRole: 'nurse',
    approvalTimeoutMinutes: 30,
    steps: [
      { id: 's1', name: 'Bed Status Transition', type: 'trigger', description: 'Bed marked for turnaround by discharge or transfer', config: {}, order: 1 },
      { id: 's2', name: 'Sterility Criteria Check', type: 'condition', description: 'Department requires pathogen-free clinical clearance', config: {}, order: 2 },
      { id: 's3', name: 'Housekeeping Dispatch', type: 'action', description: 'Queue 6-stage terminal cleaning task to environmental services', config: {}, order: 3 },
      { id: 's4', name: 'Charge Nurse Inspection', type: 'approval', description: 'Nurse supervisor inspects and verifies sterile readiness', config: { approverRole: 'nurse' }, order: 4 },
      { id: 's5', name: 'Publish Available Bed', type: 'completion', description: 'Update Bed Master, broadcast availability to Doctor Dashboard', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Infection Control Office',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-03',
    name: 'Life-Support Equipment Maintenance & Calibration',
    description: 'Monitors device telemetry faults, removes faulty units from service, dispatches Bio-Med engineering, and mandates certified return-to-service sign-off.',
    category: 'Equipment Maintenance',
    triggerEvent: 'Equipment telemetry error or fault reported',
    conditionDescription: 'Unit is critical life-support (Ventilator, Defibrillator, ECMO, Dialysis)',
    actionDescription: 'Flag unit Unavailable, alert Bio-Med engineering, log maintenance order, require biomedical verification before return to operation',
    targetRole: 'maintenance',
    approvalRequired: true,
    approverRole: 'admin',
    approvalTimeoutMinutes: 60,
    steps: [
      { id: 's1', name: 'Telemetry Fault Trigger', type: 'trigger', description: 'Sensor alert or manual clinician fault report', config: {}, order: 1 },
      { id: 's2', name: 'Life-Support Criticality Check', type: 'condition', description: 'Asset categorized as Class III life-support medical device', config: {}, order: 2 },
      { id: 's3', name: 'Lockout & Dispatch', type: 'action', description: 'Set operational status to Maintenance; alert Bio-Med engineering', config: {}, order: 3 },
      { id: 's4', name: 'Biomedical Sign-off', type: 'approval', description: 'Certified technician enters calibration certificate and passes safety inspection', config: { approverRole: 'admin' }, order: 4 },
      { id: 's5', name: 'Return to Telemetry Ready', type: 'completion', description: 'Re-enable unit on live ward inventory and notify department head', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Biomedical Engineering',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-04',
    name: 'Inter-Ward Clinical Step-Down & Transfer',
    description: 'Validates patient acuity, verifies destination bed capacity, prevents duplicate active transfers, and alerts receiving nurse station before handover.',
    category: 'Patient Transfer',
    triggerEvent: 'Attending physician orders ward transfer',
    conditionDescription: 'Destination ward bed is available & no duplicate transfer active',
    actionDescription: 'Verify clinical stabilization, notify Receiving Ward, queue nurse transport, update patient assignment after completion',
    targetRole: 'all',
    approvalRequired: true,
    approverRole: 'doctor',
    approvalTimeoutMinutes: 45,
    steps: [
      { id: 's1', name: 'Transfer Order Placed', type: 'trigger', description: 'Doctor requests inter-ward step-down or acute transfer', config: {}, order: 1 },
      { id: 's2', name: 'Duplicate & Bed Check', type: 'condition', description: 'Check destination bed availability & verify no pending transfer for patient', config: {}, order: 2 },
      { id: 's3', name: 'Receiving Nurse Alert', type: 'notification', description: 'Notify destination nurse charge station of inbound patient', config: {}, order: 3 },
      { id: 's4', name: 'Receiving Doctor Sign-off', type: 'approval', description: 'Receiving clinician accepts patient clinical handover', config: { approverRole: 'doctor' }, order: 4 },
      { id: 's5', name: 'Bed & Chart Realignment', type: 'completion', description: 'Update patient bed assignment, release previous bed, log audit', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Chief Medical Officer',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-05',
    name: 'Recurring Post-Op Vital Signs & Clinical Observation',
    description: 'Automatically queues scheduled nursing observations (Q2H/Q4H) and alerts clinicians when critical parameters breach safe thresholds. Does not generate treatment instructions automatically.',
    category: 'Clinical Tasks',
    triggerEvent: 'Post-surgical patient admitted or clinical order placed',
    conditionDescription: 'Observation interval elapsed or vital sign deviation detected',
    actionDescription: 'Generate nursing assessment task, prompt vitals entry, alert doctor if critical thresholds breached',
    targetRole: 'nurse',
    approvalRequired: false,
    approvalTimeoutMinutes: 15,
    steps: [
      { id: 's1', name: 'Protocol Schedule Trigger', type: 'trigger', description: 'Recurring observation interval (Q2H / Q4H) reached', config: {}, order: 1 },
      { id: 's2', name: 'Acuity Level Filter', type: 'condition', description: 'Check patient MEWS score and current vital baseline', config: {}, order: 2 },
      { id: 's3', name: 'Nurse Task Dispatch', type: 'action', description: 'Create Doctor-Nurse clinical task on Nurse Dashboard', config: {}, order: 3 },
      { id: 's4', name: 'Nurse Observation Entry', type: 'completion', description: 'Nurse logs BP/HR/SpO2; system evaluates trend and confirms adherence', config: {}, order: 4 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Clinical Protocols Committee',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-06',
    name: 'Structured Multi-Department Patient Discharge',
    description: 'Orchestrates multi-department clearance (investigations, pharmacy, billing, transport) with mandatory physician sign-off. Never automatically discharges patients.',
    category: 'Discharge',
    triggerEvent: 'Physician initiates discharge protocol',
    conditionDescription: 'All pending lab investigations and consultant notes reconciled',
    actionDescription: 'Generate clearance checklist, prepare prescription summary for review, notify billing & transport, release bed upon doctor authorization',
    targetRole: 'all',
    approvalRequired: true,
    approverRole: 'doctor',
    approvalTimeoutMinutes: 90,
    steps: [
      { id: 's1', name: 'Discharge Order Logged', type: 'trigger', description: 'Doctor opens discharge workflow in Clinical Workspace', config: {}, order: 1 },
      { id: 's2', name: 'Prerequisite Audit', type: 'condition', description: 'Verify zero outstanding emergency labs or unread panic reports', config: {}, order: 2 },
      { id: 's3', name: 'Department Clearances', type: 'action', description: 'Alert pharmacy, billing, and patient transport services', config: {}, order: 3 },
      { id: 's4', name: 'Attending Physician Approval', type: 'approval', description: 'Doctor reviews summary and signs digital discharge clearance', config: { approverRole: 'doctor' }, order: 4 },
      { id: 's5', name: 'Bed De-allocation & Turnaround', type: 'completion', description: 'Release bed to Cleaning status; archive active inpatient record', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Patient Flow Directorate',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-07',
    name: 'Critical Lab Value & MEWS Alert Escalation',
    description: 'Immediately flags life-threatening laboratory panics or deteriorating vital signs and alerts the primary physician with 10-minute auto-escalation.',
    category: 'Emergency Coordination',
    triggerEvent: 'Lab system flags critical panic value or MEWS >= 5',
    conditionDescription: 'Patient is active inpatient or ED observation',
    actionDescription: 'High-priority audio-visual chime on Doctor and Nurse consoles, escalation to Rapid Response Team if unacknowledged within 10 min',
    targetRole: 'doctor',
    approvalRequired: false,
    approvalTimeoutMinutes: 10,
    steps: [
      { id: 's1', name: 'Panic Value Ingested', type: 'trigger', description: 'Critical biomarker or vital sign threshold breached', config: {}, order: 1 },
      { id: 's2', name: 'Acuity Risk Gate', type: 'condition', description: 'Verify panic threshold criteria (e.g. K+ > 6.5, SpO2 < 85%)', config: {}, order: 2 },
      { id: 's3', name: 'Primary Physician Page', type: 'notification', description: 'Dispatch critical mobile and console alert to attending doctor', config: {}, order: 3 },
      { id: 's4', name: 'Clinical Acknowledgment', type: 'completion', description: 'Doctor confirms review within 10 min; prevents escalation to Code Blue', config: {}, order: 4 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Emergency Resuscitation Team',
    createdAt: '2026-11-20T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  },
  {
    id: 'rule-wf-08',
    name: 'Shift Handover Incomplete Assessment Guard',
    description: 'Scans for incomplete clinical tasks, unread lab reports, or unverified orders prior to nurse and resident shift changes.',
    category: 'Clinical Tasks',
    triggerEvent: 'Shift changeover milestone reached (07:00 / 15:00 / 23:00)',
    conditionDescription: 'Assigned inpatients have pending observations or unsigned notes',
    actionDescription: 'Assemble handover checklist, notify outgoing and incoming clinicians',
    targetRole: 'nurse',
    approvalRequired: true,
    approverRole: 'nurse',
    approvalTimeoutMinutes: 20,
    steps: [
      { id: 's1', name: 'Shift Clock Event', type: 'trigger', description: 'Scheduled handover time trigger', config: {}, order: 1 },
      { id: 's2', name: 'Unfinished Task Audit', type: 'condition', description: 'Scan active tasks and verify completion status', config: {}, order: 2 },
      { id: 's3', name: 'Handover Digest', type: 'notification', description: 'Generate ward handover briefing for charge nurse', config: {}, order: 3 },
      { id: 's4', name: 'Outgoing Nurse Sign-off', type: 'approval', description: 'Outgoing nurse signs digital handover declaration', config: { approverRole: 'nurse' }, order: 4 },
      { id: 's5', name: 'Duty Transfer Realignment', type: 'completion', description: 'Transfer active task queue to incoming shift roster', config: {}, order: 5 }
    ],
    isActive: true,
    isSystemRule: true,
    createdBy: 'Nursing Quality Directorate',
    createdAt: '2026-11-22T08:00:00Z',
    updatedAt: '2026-11-27T10:00:00Z'
  }
];

export const INITIAL_WORKFLOW_EXECUTIONS: WorkflowExecution[] = [
  {
    id: 'exec-101',
    ruleId: 'rule-wf-01',
    ruleName: 'Emergency Clinical Requisition Authorization',
    category: 'Resource Requests',
    status: 'waiting_approval',
    triggerData: {
      event: 'Doctor submits emergency resource request',
      entityId: 'req-crit-902',
      entityType: 'request',
      summary: 'Emergency Requisition: 1x Hamilton-C6 Ventilator for Trauma ICU Bed #03',
      urgency: 'Critical',
      department: 'MICU / Trauma Bay'
    },
    currentStepIndex: 3,
    totalSteps: 5,
    steps: [
      { stepId: 's1', name: 'Requisition Intake', type: 'trigger', status: 'completed', details: 'Dr. Sarah Jenkins submitted emergency requisition #REQ-902', timestamp: '2026-11-27T19:45:00Z', actor: 'Dr. Sarah Jenkins' },
      { stepId: 's2', name: 'Inventory & Bed Check', type: 'condition', status: 'completed', details: 'Available Ventilators: 2 ready in Central Bio-Med reserve. Bed #03 verified ready.', timestamp: '2026-11-27T19:45:15Z', actor: 'System Telemetry' },
      { stepId: 's3', name: 'Admin Priority Alert', type: 'notification', status: 'completed', details: 'High-urgency audio dispatch sent to Hospital Administrator', timestamp: '2026-11-27T19:45:20Z', actor: 'Notification Engine' },
      { stepId: 's4', name: 'Authorized Sign-off', type: 'approval', status: 'in_progress', details: 'Awaiting Administrator review and biometric sign-off for asset release', timestamp: '2026-11-27T19:45:22Z', actor: 'Pending Admin Review' },
      { stepId: 's5', name: 'Fulfillment & Audit', type: 'completion', status: 'pending', details: 'Dispatches device to Bed #03 and realigns telemetry' }
    ],
    startedAt: '2026-11-27T19:45:00Z',
    initiatedBy: 'Dr. Sarah Jenkins',
    assignedApprover: 'Hospital Administrator',
    retryCount: 0,
    auditLogs: [
      { id: 'aud-01', executionId: 'exec-101', ruleName: 'Emergency Clinical Requisition Authorization', stepName: 'Requisition Intake', action: 'REQUEST_SUBMITTED', actor: 'Dr. Sarah Jenkins', actorRole: 'doctor', timestamp: '2026-11-27T19:45:00Z', newState: 'Submitted', note: 'Critical patient acute hypoxia' },
      { id: 'aud-02', executionId: 'exec-101', ruleName: 'Emergency Clinical Requisition Authorization', stepName: 'Inventory Check', action: 'TELEMETRY_MATCH', actor: 'Workflow Engine', actorRole: 'system', timestamp: '2026-11-27T19:45:15Z', newState: 'Telemetry Verified', note: 'Unit VENT-HAM-02 online and calibrated' },
      { id: 'aud-03', executionId: 'exec-101', ruleName: 'Emergency Clinical Requisition Authorization', stepName: 'Admin Alert', action: 'ADMIN_NOTIFIED', actor: 'Notification System', actorRole: 'system', timestamp: '2026-11-27T19:45:20Z', newState: 'Alert Dispatched' }
    ],
    isDemo: false
  },
  {
    id: 'exec-102',
    ruleId: 'rule-wf-04',
    ruleName: 'Inter-Ward Clinical Step-Down & Transfer',
    category: 'Patient Transfer',
    status: 'waiting_approval',
    triggerData: {
      event: 'Doctor requests inter-ward transfer',
      entityId: 'pt-502',
      entityType: 'transfer',
      summary: 'Step-Down Transfer: Patient Rajesh Kumar (PT-104) from ICU Bed #02 to Step-Down IMC-04',
      urgency: 'Urgent',
      department: 'Surgical ICU'
    },
    currentStepIndex: 3,
    totalSteps: 5,
    steps: [
      { stepId: 's1', name: 'Transfer Order Placed', type: 'trigger', status: 'completed', details: 'Dr. Rajesh Patel ordered ICU step-down transfer', timestamp: '2026-11-27T19:30:00Z', actor: 'Dr. Rajesh Patel' },
      { stepId: 's2', name: 'Duplicate & Bed Check', type: 'condition', status: 'completed', details: 'Verified no active conflicting transfer. Step-down bed IMC-04 is verified Clean & Ready.', timestamp: '2026-11-27T19:30:30Z', actor: 'Bed Master Telemetry' },
      { stepId: 's3', name: 'Receiving Nurse Alert', type: 'notification', status: 'completed', details: 'Notification sent to IMC Ward Nurse Station (Nurse Priya Nair)', timestamp: '2026-11-27T19:30:45Z', actor: 'Workflow Engine' },
      { stepId: 's4', name: 'Receiving Doctor Sign-off', type: 'approval', status: 'in_progress', details: 'Awaiting receiving physician acceptance of clinical responsibility', timestamp: '2026-11-27T19:31:00Z', actor: 'Pending Doctor Acceptance' },
      { stepId: 's5', name: 'Bed & Chart Realignment', type: 'completion', status: 'pending', details: 'Realignment of active bed sensor and inpatient roster' }
    ],
    startedAt: '2026-11-27T19:30:00Z',
    initiatedBy: 'Dr. Rajesh Patel',
    assignedApprover: 'Dr. Priya Sharma (Receiving Attending)',
    retryCount: 0,
    auditLogs: [
      { id: 'aud-04', executionId: 'exec-102', ruleName: 'Inter-Ward Clinical Step-Down & Transfer', stepName: 'Transfer Order', action: 'TRANSFER_REQUESTED', actor: 'Dr. Rajesh Patel', actorRole: 'doctor', timestamp: '2026-11-27T19:30:00Z', newState: 'Requested', note: 'Patient extubated and stable for HDU/IMC care' },
      { id: 'aud-05', executionId: 'exec-102', ruleName: 'Inter-Ward Clinical Step-Down & Transfer', stepName: 'Bed Availability Check', action: 'BED_RESERVED', actor: 'Workflow Engine', actorRole: 'system', timestamp: '2026-11-27T19:30:30Z', newState: 'Bed Reserved', note: 'Bed IMC-04 tagged for pending arrival' }
    ],
    isDemo: false
  },
  {
    id: 'exec-103',
    ruleId: 'rule-wf-06',
    ruleName: 'Structured Multi-Department Patient Discharge',
    category: 'Discharge',
    status: 'waiting_approval',
    triggerData: {
      event: 'Physician initiates discharge protocol',
      entityId: 'pt-109',
      entityType: 'patient',
      summary: 'Elective Discharge Protocol: Patient Ananya Sen (Bed GEN-08)',
      urgency: 'Routine',
      department: 'General Medicine Floor 3'
    },
    currentStepIndex: 3,
    totalSteps: 5,
    steps: [
      { stepId: 's1', name: 'Discharge Order Logged', type: 'trigger', status: 'completed', details: 'Discharge intent registered in clinical notes', timestamp: '2026-11-27T18:15:00Z', actor: 'Dr. Michael Chen' },
      { stepId: 's2', name: 'Prerequisite Audit', type: 'condition', status: 'completed', details: 'All lab reports finalized; zero pending consultant consults', timestamp: '2026-11-27T18:16:00Z', actor: 'EHR Audit Engine' },
      { stepId: 's3', name: 'Department Clearances', type: 'action', status: 'completed', details: 'Pharmacy reconciled take-home medications; billing clearance received', timestamp: '2026-11-27T18:40:00Z', actor: 'Hospital ERP' },
      { stepId: 's4', name: 'Attending Physician Approval', type: 'approval', status: 'in_progress', details: 'Requires final digital signature by Attending Physician', timestamp: '2026-11-27T18:42:00Z', actor: 'Dr. Michael Chen' },
      { stepId: 's5', name: 'Bed De-allocation & Turnaround', type: 'completion', status: 'pending', details: 'Transitions Bed GEN-08 to Cleaning status and archives record' }
    ],
    startedAt: '2026-11-27T18:15:00Z',
    initiatedBy: 'Dr. Michael Chen',
    assignedApprover: 'Dr. Michael Chen',
    retryCount: 0,
    auditLogs: [
      { id: 'aud-06', executionId: 'exec-103', ruleName: 'Structured Multi-Department Patient Discharge', stepName: 'Discharge Order', action: 'DISCHARGE_INITIATED', actor: 'Dr. Michael Chen', actorRole: 'doctor', timestamp: '2026-11-27T18:15:00Z', newState: 'In Clearance' }
    ],
    isDemo: false
  },
  {
    id: 'exec-104',
    ruleId: 'rule-wf-05',
    ruleName: 'Recurring Post-Op Vital Signs & Clinical Observation',
    category: 'Clinical Tasks',
    status: 'running',
    triggerData: {
      event: 'Recurring observation interval reached',
      entityId: 'pt-203',
      entityType: 'task',
      summary: 'Scheduled Q2H Post-Operative Vitals & Neuro Check (Patient Vikram Malhotra - Bed SICU-02)',
      urgency: 'Urgent',
      department: 'Surgical ICU'
    },
    currentStepIndex: 2,
    totalSteps: 4,
    steps: [
      { stepId: 's1', name: 'Protocol Schedule Trigger', type: 'trigger', status: 'completed', details: 'Post-op observation timer reached (120 min interval)', timestamp: '2026-11-27T19:50:00Z', actor: 'Scheduler Daemon' },
      { stepId: 's2', name: 'Acuity Level Filter', type: 'condition', status: 'completed', details: 'Patient post-craniotomy requires neurological GCS assessment', timestamp: '2026-11-27T19:50:05Z', actor: 'Clinical Engine' },
      { stepId: 's3', name: 'Nurse Task Dispatch', type: 'action', status: 'in_progress', details: 'Clinical task assigned to Nurse Anita Roy on active ward queue', timestamp: '2026-11-27T19:50:10Z', actor: 'Nurse Anita Roy' },
      { stepId: 's4', name: 'Nurse Observation Entry', type: 'completion', status: 'pending', details: 'Logs vitals and verifies MEWS < 3' }
    ],
    startedAt: '2026-11-27T19:50:00Z',
    initiatedBy: 'Automated Clinical Protocol',
    assignedApprover: undefined,
    retryCount: 0,
    auditLogs: [
      { id: 'aud-07', executionId: 'exec-104', ruleName: 'Recurring Post-Op Vital Signs', stepName: 'Schedule Trigger', action: 'TASK_QUEUED', actor: 'Protocol Scheduler', actorRole: 'system', timestamp: '2026-11-27T19:50:00Z', newState: 'Queued', note: 'Q2H neurological observation' }
    ],
    isDemo: false
  },
  {
    id: 'exec-105',
    ruleId: 'rule-wf-02',
    ruleName: 'Bed Readiness & Sanitation Verification',
    category: 'Bed Readiness',
    status: 'completed',
    triggerData: {
      event: 'Bed marked Cleaning',
      entityId: 'bed-icu-05',
      entityType: 'bed',
      summary: 'Bed Sanitation Clearance: ICU Bed #05 following step-down transfer',
      urgency: 'Urgent',
      department: 'MICU Block A'
    },
    currentStepIndex: 5,
    totalSteps: 5,
    steps: [
      { stepId: 's1', name: 'Bed Status Transition', type: 'trigger', status: 'completed', details: 'Bed transitioned to Cleaning by ward discharge clerk', timestamp: '2026-11-27T17:10:00Z', actor: 'Ward Clerk' },
      { stepId: 's2', name: 'Sterility Criteria Check', type: 'condition', status: 'completed', details: 'Pathogen-free isolation disinfection criteria verified', timestamp: '2026-11-27T17:10:15Z', actor: 'Infection Control Service' },
      { stepId: 's3', name: 'Housekeeping Dispatch', type: 'action', status: 'completed', details: 'Environmental Services Team B completed 6-stage UV-C terminal disinfection', timestamp: '2026-11-27T17:40:00Z', actor: 'Sanitation Team B' },
      { stepId: 's4', name: 'Charge Nurse Inspection', type: 'approval', status: 'completed', details: 'Charge Nurse Mary Joseph verified linen, suction, and monitor readiness', timestamp: '2026-11-27T17:45:00Z', actor: 'Charge Nurse Mary Joseph' },
      { stepId: 's5', name: 'Publish Available Bed', type: 'completion', status: 'completed', details: 'Bed Master updated to Ready; broadcast to Doctor and Command Center consoles', timestamp: '2026-11-27T17:46:00Z', actor: 'Workflow Engine' }
    ],
    startedAt: '2026-11-27T17:10:00Z',
    completedAt: '2026-11-27T17:46:00Z',
    durationSeconds: 2160,
    initiatedBy: 'Ward Discharge Event',
    assignedApprover: 'Charge Nurse Mary Joseph',
    retryCount: 0,
    auditLogs: [
      { id: 'aud-08', executionId: 'exec-105', ruleName: 'Bed Readiness & Sanitation Verification', stepName: 'Inspection Sign-off', action: 'VERIFICATION_SIGNED', actor: 'Charge Nurse Mary Joseph', actorRole: 'nurse', timestamp: '2026-11-27T17:45:00Z', previousState: 'Cleaning', newState: 'Ready', note: 'UV-C cycle 42 complete, sterile swab passed' }
    ],
    isDemo: false
  },
  {
    id: 'exec-106',
    ruleId: 'rule-wf-03',
    ruleName: 'Life-Support Equipment Maintenance & Calibration',
    category: 'Equipment Maintenance',
    status: 'failed',
    triggerData: {
      event: 'Equipment telemetry error reported',
      entityId: 'EQ-VENT-04',
      entityType: 'equipment',
      summary: 'Bio-Med Fault: Hamilton-C6 Ventilator (EQ-VENT-04) O2 Sensor Drift > 15%',
      urgency: 'Critical',
      department: 'Emergency & Trauma'
    },
    currentStepIndex: 3,
    totalSteps: 5,
    steps: [
      { stepId: 's1', name: 'Telemetry Fault Trigger', type: 'trigger', status: 'completed', details: 'Internal sensor calibration diagnostic failed high-pressure test', timestamp: '2026-11-27T16:20:00Z', actor: 'Device Telemetry Sensor' },
      { stepId: 's2', name: 'Life-Support Criticality Check', type: 'condition', status: 'completed', details: 'Class III mechanical ventilator quarantined from clinical use', timestamp: '2026-11-27T16:20:10Z', actor: 'Workflow Engine' },
      { stepId: 's3', name: 'Lockout & Dispatch', type: 'action', status: 'failed', details: 'Bio-Med primary engineer off-campus; dispatch acknowledgement timed out', timestamp: '2026-11-27T16:40:00Z', actor: 'Automated Dispatcher', error: 'Dispatch timeout: No on-duty bio-med technician acknowledged within 20 min' },
      { stepId: 's4', name: 'Biomedical Sign-off', type: 'approval', status: 'pending', details: 'Awaiting technician recalibration certification' },
      { stepId: 's5', name: 'Return to Telemetry Ready', type: 'completion', status: 'pending', details: 'Reinstates asset into live inventory' }
    ],
    startedAt: '2026-11-27T16:20:00Z',
    completedAt: '2026-11-27T16:40:00Z',
    durationSeconds: 1200,
    initiatedBy: 'Telemetry Sensor',
    failureReason: 'Dispatch timeout: On-duty bio-med engineering acknowledgement timed out. Escalated to Facilities Manager.',
    retryCount: 0,
    auditLogs: [
      { id: 'aud-09', executionId: 'exec-106', ruleName: 'Life-Support Equipment Maintenance', stepName: 'Lockout', action: 'UNIT_QUARANTINED', actor: 'Safety Watchdog', actorRole: 'system', timestamp: '2026-11-27T16:20:10Z', newState: 'Maintenance Lockout', note: 'O2 FiO2 variance detected' },
      { id: 'aud-10', executionId: 'exec-106', ruleName: 'Life-Support Equipment Maintenance', stepName: 'Dispatch Error', action: 'DISPATCH_TIMEOUT', actor: 'Workflow Engine', actorRole: 'system', timestamp: '2026-11-27T16:40:00Z', newState: 'Failed', note: 'Escalation alert dispatched to Senior Engineer' }
    ],
    isDemo: false
  }
];

export const SMART_NOTIFICATION_RULES: SmartNotificationRule[] = [
  {
    id: 'sn-01',
    name: 'Critical Emergency Resource Requisition',
    eventType: 'Doctor submits emergency resource request',
    condition: 'Urgency == "Critical" OR Resource in ["Ventilator", "ICU Bed", "O-Negative Blood"]',
    targetRole: 'admin',
    priority: 'Critical',
    escalationIntervalMinutes: 15,
    soundAlert: true,
    isActive: true,
    description: 'Immediate audible dispatch to Hospital Admin console. If unreviewed after 15 min, auto-escalates to Chief Medical Officer.'
  },
  {
    id: 'sn-02',
    name: 'Pending Resource Approval Reminder',
    eventType: 'Workflow awaiting administrative sign-off',
    condition: 'Wait time >= 20 minutes',
    targetRole: 'admin',
    priority: 'High',
    escalationIntervalMinutes: 20,
    soundAlert: false,
    isActive: true,
    description: 'Generates persistent header badge reminder for unreviewed requisitions waiting in the queue.'
  },
  {
    id: 'sn-03',
    name: 'Unacknowledged Clinical MEWS Panic Alert',
    eventType: 'Patient early warning score >= 5 or vital panic',
    condition: 'Physician acknowledgement pending > 10 minutes',
    targetRole: 'doctor',
    priority: 'Critical',
    escalationIntervalMinutes: 10,
    soundAlert: true,
    isActive: true,
    description: 'Audible clinical chime. Escalates automatically to Rapid Response / Code Blue Team if unacknowledged within 10 minutes.'
  },
  {
    id: 'sn-04',
    name: 'Life-Support Equipment Maintenance Overdue',
    eventType: 'Equipment maintenance task in progress',
    condition: 'Duration > 60 minutes for Class III Life-Support devices',
    targetRole: 'maintenance',
    priority: 'High',
    escalationIntervalMinutes: 30,
    soundAlert: false,
    isActive: true,
    description: 'Alerts Biomedical Engineering supervisor when ventilator or defibrillator servicing exceeds target turnaround window.'
  },
  {
    id: 'sn-05',
    name: 'Incomplete Clinical Shift Handover Warning',
    eventType: 'Ward handover scheduled',
    condition: 'Uncompleted observations or unsigned orders >= 1 at T-15 minutes',
    targetRole: 'nurse',
    priority: 'High',
    escalationIntervalMinutes: 15,
    soundAlert: false,
    isActive: true,
    description: 'Alerts outgoing and incoming charge nurses about pending patient evaluations before duty turnover.'
  },
  {
    id: 'sn-06',
    name: 'Ready Bed Available in High-Demand Ward',
    eventType: 'Bed status transitioned to Ready',
    condition: 'Ward has pending emergency admissions or transfers waiting',
    targetRole: 'all',
    priority: 'Normal',
    escalationIntervalMinutes: 45,
    soundAlert: false,
    isActive: true,
    description: 'Notifies triage physicians and ED charge nurse that a previously occupied ICU or step-down bed is sterile and ready for intake.'
  }
];

export const INITIAL_WORKFLOW_STATS: WorkflowStatistics = {
  totalExecutions: 48,
  activeExecutions: 2,
  completedExecutions: 42,
  pendingApprovals: 3,
  failedExecutions: 1,
  avgDurationMinutes: 3.8,
  successRatePercent: 97.6,
  manualApprovalsCount: 31
};
