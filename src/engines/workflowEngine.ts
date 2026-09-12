import { db } from '../db';
import type {
  WorkflowRule,
  WorkflowExecutionLog,
  WorkflowActionConfig,
  Task,
  Note,
  Customer,
} from '../types';

export const FOUNDER_WORKFLOW_RECIPES: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'lastRunAt'>[] = [
  {
    name: 'Overdue Invoice Sentinel',
    description: 'Flags overdue invoices (>7 days), creates urgent collection tasks, and logs reminder notes.',
    category: 'finance',
    triggerType: 'invoice_overdue',
    triggerConfig: { daysOverdue: 7 },
    conditions: [
      { field: 'amount', operator: 'greater_than', value: 1000 },
    ],
    actions: [
      {
        type: 'create_task',
        params: { title: 'Chase overdue payment from client', priority: 'high' },
        description: 'Auto-create high-priority founder collection task',
      },
      {
        type: 'generate_note',
        params: { title: 'Payment Collection Notice Drafted', category: 'Finance' },
        description: 'Auto-draft formal invoice follow-up note',
      },
    ],
    isActive: true,
  },
  {
    name: 'Churn Preemption Shield',
    description: 'Triggers executive check-in when customer health drops below 50 or activity goes cold.',
    category: 'retention',
    triggerType: 'churn_risk_high',
    triggerConfig: { minHealthScore: 50 },
    conditions: [
      { field: 'healthScore', operator: 'less_than', value: 50 },
    ],
    actions: [
      {
        type: 'create_task',
        params: { title: 'Conduct founder VIP check-in call with at-risk account', priority: 'critical' },
        description: 'Schedule founder VIP intervention call',
      },
      {
        type: 'update_customer_status',
        params: { status: 'at_risk' },
        description: 'Update customer status to At-Risk',
      },
    ],
    isActive: true,
  },
  {
    name: 'VIP Deal Won Concierge',
    description: 'When a deal over $10,000 is marked Won, kickstarts customer onboarding and creates project sprint.',
    category: 'sales',
    triggerType: 'deal_won',
    triggerConfig: { minValue: 10000 },
    conditions: [
      { field: 'value', operator: 'greater_than', value: 9999 },
    ],
    actions: [
      {
        type: 'create_task',
        params: { title: 'Send VIP Welcome Kit & Schedule Kickoff', priority: 'high' },
        description: 'Spawn executive onboarding tasks',
      },
      {
        type: 'generate_note',
        params: { title: 'Won Deal Briefing & SLA Commitments', category: 'Sales' },
        description: 'Log executive deal dossier',
      },
    ],
    isActive: true,
  },
  {
    name: 'Runway Guard Alert',
    description: 'Evaluates monthly burn. If runway drops under 6 months, triggers expense audit and investor alert draft.',
    category: 'finance',
    triggerType: 'runway_alert',
    triggerConfig: { minRunwayMonths: 6 },
    conditions: [
      { field: 'runwayMonths', operator: 'less_than', value: 6 },
    ],
    actions: [
      {
        type: 'create_task',
        params: { title: 'Conduct Emergency SaaS & Contractor Cost Audit', priority: 'critical' },
        description: 'Create cost-cutting review task',
      },
      {
        type: 'trigger_ai_audit',
        params: { agentRole: 'cfo', auditType: 'runway_conservation' },
        description: 'Dispatch AI CFO Runway Conservation Audit',
      },
    ],
    isActive: true,
  },
  {
    name: 'Stale Bug Auto-Escalation',
    description: 'Escalates critical unresolved bugs that have been in open status for more than 48 hours.',
    category: 'engineering',
    triggerType: 'task_blocked',
    triggerConfig: { hoursBlocked: 48 },
    conditions: [
      { field: 'severity', operator: 'equals', value: 'critical' },
    ],
    actions: [
      {
        type: 'create_task',
        params: { title: 'Unblock Critical Customer P0 Bug Sprint', priority: 'critical' },
        description: 'Create unblock sprint task',
      },
    ],
    isActive: true,
  },
];

export class WorkflowEngine {
  /**
   * Evaluates and executes a single workflow rule
   */
  static async executeWorkflow(
    workflow: WorkflowRule,
    triggerContext?: Record<string, any>
  ): Promise<WorkflowExecutionLog> {
    const startTime = Date.now();
    let actionsExecuted = 0;
    const actionSummaries: string[] = [];

    try {
      // 1. Evaluate Conditions if context is provided
      let passedConditions = true;
      if (triggerContext && workflow.conditions.length > 0) {
        for (const cond of workflow.conditions) {
          const val = triggerContext[cond.field];
          if (cond.operator === 'equals' && val !== cond.value) passedConditions = false;
          if (cond.operator === 'greater_than' && !(Number(val) > Number(cond.value))) passedConditions = false;
          if (cond.operator === 'less_than' && !(Number(val) < Number(cond.value))) passedConditions = false;
        }
      }

      if (!passedConditions) {
        const log: WorkflowExecutionLog = {
          id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: 'warning',
          triggerSource: triggerContext?.source || 'manual_test',
          actionsExecuted: 0,
          summary: 'Conditions not met during evaluation. Execution skipped safely.',
          executedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        };
        await db.workflowLogs.add(log);
        return log;
      }

      // 2. Execute configured actions
      for (const action of workflow.actions) {
        await this.executeAction(action, triggerContext);
        actionsExecuted++;
        actionSummaries.push(action.description);
      }

      // 3. Update workflow metadata
      await db.workflows.update(workflow.id, {
        runCount: (workflow.runCount || 0) + 1,
        lastRunAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const log: WorkflowExecutionLog = {
        id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'success',
        triggerSource: triggerContext?.source || 'manual_trigger',
        actionsExecuted,
        summary: `Successfully executed ${actionsExecuted} actions: ${actionSummaries.join(', ')}`,
        details: { executedActions: actionSummaries, context: triggerContext },
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };

      await db.workflowLogs.add(log);
      return log;
    } catch (err: any) {
      const log: WorkflowExecutionLog = {
        id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'failed',
        triggerSource: triggerContext?.source || 'manual_test',
        actionsExecuted,
        summary: `Workflow execution failed: ${err.message || String(err)}`,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
      await db.workflowLogs.add(log);
      return log;
    }
  }

  /**
   * Dispatches an individual action config
   */
  private static async executeAction(
    action: WorkflowActionConfig,
    context?: Record<string, any>
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    switch (action.type) {
      case 'create_task': {
        const newTask: Task = {
          id: `task-wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: action.params.title || 'Automated Workflow Action',
          description: `Generated by automated workflow engine. Context: ${context ? JSON.stringify(context) : 'System Trigger'}`,
          priority: action.params.priority || 'high',
          status: 'todo',
          tags: ['automated-workflow', 'v2-ops'],
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await db.tasks.add(newTask);
        break;
      }

      case 'generate_note': {
        const newNote: Note = {
          id: `note-wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: action.params.title || 'Workflow Audit Dossier',
          content: `# Automated Workflow Report\n\n**Generated:** ${new Date().toLocaleString()}\n**Trigger:** ${context?.source || 'Automated Rule'}\n\n### Action Items\n- Review automated task\n- Confirm resolution with executive team`,
          category: action.params.category || 'Operations',
          tags: ['automated', 'workflow-engine'],
          isPinned: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await db.notes.add(newNote);
        break;
      }

      case 'update_customer_status': {
        if (context?.customerId) {
          await db.customers.update(context.customerId, {
            status: action.params.status || 'at_risk',
            updatedAt: timestamp,
          });
        }
        break;
      }

      case 'trigger_ai_audit': {
        // Record an activity and notification task for the AI executive persona
        const task: Task = {
          id: `task-audit-${Date.now()}`,
          title: `AI ${action.params.agentRole?.toUpperCase() || 'CFO'} Audit: ${action.params.auditType || 'Strategic Review'}`,
          description: `Autonomous audit triggered by workflow engine. Prioritize immediate action review.`,
          priority: 'critical',
          status: 'in_progress',
          tags: ['ai-agent', 'cfo-audit'],
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await db.tasks.add(task);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Run all active workflows against current database state
   */
  static async runAllActiveWorkflows(): Promise<WorkflowExecutionLog[]> {
    const activeRules = await db.workflows.where('isActive').equals(1).toArray();
    const logs: WorkflowExecutionLog[] = [];

    // Preload system state
    const overdueInvoices = await db.invoices.where('status').equals('overdue').toArray();
    const highRiskCustomers = await db.customerHealthScores.where('quadrant').equals('at_risk').toArray();

    for (const rule of activeRules) {
      if (rule.triggerType === 'invoice_overdue' && overdueInvoices.length > 0) {
        const topOverdue = overdueInvoices[0];
        const log = await this.executeWorkflow(rule, {
          source: 'overdue_invoice_sweep',
          amount: topOverdue.amount,
          invoiceId: topOverdue.id,
          customerId: topOverdue.customerId,
        });
        logs.push(log);
      } else if (rule.triggerType === 'churn_risk_high' && highRiskCustomers.length > 0) {
        const atRisk = highRiskCustomers[0];
        const log = await this.executeWorkflow(rule, {
          source: 'churn_radar_sweep',
          healthScore: atRisk.healthScore,
          customerId: atRisk.customerId,
          companyName: atRisk.companyName,
        });
        logs.push(log);
      } else {
        // Run test/heartbeat trigger
        const log = await this.executeWorkflow(rule, {
          source: 'routine_scheduled_check',
          amount: 5000,
          healthScore: 45,
          runwayMonths: 5.2,
        });
        logs.push(log);
      }
    }

    return logs;
  }
}
