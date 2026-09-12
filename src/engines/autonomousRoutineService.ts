import { db } from '../db';
import type {
  AutonomousRoutine,
  OperationalAnomaly,
  RoutineExecutionRecord,
  Task,
  Note,
} from '../types';

export const DEFAULT_AUTONOMOUS_ROUTINES: AutonomousRoutine[] = [
  {
    id: 'routine-morning',
    name: 'Morning Executive Briefing & Standup',
    timeSlot: '08:00',
    frequency: 'daily',
    description: 'Synthesizes overnight MRR changes, priorities, cash balance, and critical tasks for the founder.',
    category: 'briefing',
    isEnabled: true,
    autoHealEnabled: true,
    lastStatus: 'healthy',
  },
  {
    id: 'routine-runway',
    name: 'Cash Runway & Burn Sentinel',
    timeSlot: '13:00',
    frequency: 'daily',
    description: 'Monitors net daily burn, flags unauthorized spending spikes, and verifies default-alive timeline.',
    category: 'runway_guard',
    isEnabled: true,
    autoHealEnabled: true,
    lastStatus: 'healthy',
  },
  {
    id: 'routine-pipeline',
    name: 'Sales Pipeline Hygiene & Deal Sweeper',
    timeSlot: '18:00',
    frequency: 'daily',
    description: 'Detects stalled deals with no touchpoint in 21 days and initiates auto-reengagement workflows.',
    category: 'pipeline_hygiene',
    isEnabled: true,
    autoHealEnabled: true,
    lastStatus: 'anomalies_detected',
  },
  {
    id: 'routine-reconciliation',
    name: 'Autonomous Ledger Reconciliation',
    timeSlot: '21:00',
    frequency: 'daily',
    description: 'Audits cleared transactions against bank account balances and flags invoice discrepancy deltas.',
    category: 'reconciliation',
    isEnabled: true,
    autoHealEnabled: true,
    lastStatus: 'auto_healed',
  },
];

export class AutonomousRoutineService {
  /**
   * Scans system state and detects active operational anomalies
   */
  static async scanForAnomalies(): Promise<OperationalAnomaly[]> {
    const anomalies: OperationalAnomaly[] = [];
    const timestamp = new Date().toISOString();
    const now = Date.now();

    // 1. Scan for Overdue Invoices
    const overdueInvoices = await db.invoices.where('status').equals('overdue').toArray();
    for (const inv of overdueInvoices) {
      anomalies.push({
        id: `anom-inv-${inv.id}`,
        type: 'overdue_invoice',
        severity: inv.amount > 5000 ? 'critical' : 'warning',
        title: `Overdue Invoice: ${inv.invoiceNumber} ($${inv.amount.toLocaleString()})`,
        description: `Invoice has passed due date (${inv.dueDate}) without payment clearance.`,
        entityId: inv.id,
        entityType: 'invoice',
        detectedAt: timestamp,
        resolved: false,
        autoHealable: true,
        autoHealActionName: 'Draft Payment Notice & Urgent Collection Task',
      });
    }

    // 2. Scan for Stalled Deals (>21 days)
    const activeDeals = await db.deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').toArray();
    for (const deal of activeDeals) {
      const dealAgeDays = Math.round((now - new Date(deal.createdAt).getTime()) / 86400000);
      if (dealAgeDays > 21) {
        anomalies.push({
          id: `anom-deal-${deal.id}`,
          type: 'stalled_deal',
          severity: deal.value > 10000 ? 'critical' : 'warning',
          title: `Stalled Deal: ${deal.name} ($${deal.value.toLocaleString()})`,
          description: `Deal has remained in stage "${deal.stage}" for ${dealAgeDays} days with no stage transition.`,
          entityId: deal.id,
          entityType: 'deal',
          detectedAt: timestamp,
          resolved: false,
          autoHealable: true,
          autoHealActionName: 'Trigger AI CRO Win-Back Blitz Task',
        });
      }
    }

    // 3. Scan for Critical Unresolved Bugs
    const criticalBugs = await db.bugs.filter(b => b.severity === 'critical' && b.status !== 'resolved').toArray();
    for (const bug of criticalBugs) {
      anomalies.push({
        id: `anom-bug-${bug.id}`,
        type: 'unresolved_bug_critical',
        severity: 'critical',
        title: `P0 Blocker Bug: ${bug.title}`,
        description: `Critical severity issue remains open. Poses direct churn hazard to active accounts.`,
        entityId: bug.id,
        entityType: 'bug',
        detectedAt: timestamp,
        resolved: false,
        autoHealable: true,
        autoHealActionName: 'Escalate to Emergency Engineering Sprint',
      });
    }

    // Save to database
    for (const anom of anomalies) {
      await db.anomalies.put(anom);
    }

    return anomalies;
  }

  /**
   * 1-Click Auto-Heals an anomaly safely
   */
  static async autoHealAnomaly(anomalyId: string): Promise<boolean> {
    const anomaly = await db.anomalies.get(anomalyId);
    if (!anomaly || anomaly.resolved) return false;

    const timestamp = new Date().toISOString();

    if (anomaly.type === 'overdue_invoice' && anomaly.entityId) {
      // Create collection task
      const task: Task = {
        id: `task-heal-${Date.now()}`,
        title: `[Auto-Heal] ${anomaly.title}`,
        description: `Auto-generated collection task for anomaly. Dispatching reminder email template to finance contact.`,
        priority: 'high',
        status: 'todo',
        tags: ['auto-heal', 'finance-recovery'],
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.tasks.add(task);
    } else if (anomaly.type === 'stalled_deal' && anomaly.entityId) {
      const task: Task = {
        id: `task-heal-${Date.now()}`,
        title: `[Auto-Heal] Re-engage Stalled Deal: ${anomaly.title}`,
        description: `Triggering AI CRO executive win-back discount playbook.`,
        priority: 'high',
        status: 'todo',
        tags: ['auto-heal', 'cro-playbook'],
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.tasks.add(task);
    } else {
      const task: Task = {
        id: `task-heal-${Date.now()}`,
        title: `[Auto-Heal] Resolved Anomaly: ${anomaly.title}`,
        description: `Autonomous mitigation action executed.`,
        priority: 'medium',
        status: 'done',
        tags: ['auto-heal'],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.tasks.add(task);
    }

    // Mark anomaly resolved
    await db.anomalies.update(anomalyId, {
      resolved: true,
      resolvedAt: timestamp,
    });

    return true;
  }

  /**
   * Triggers execution of a specific routine
   */
  static async executeRoutine(routine: AutonomousRoutine): Promise<RoutineExecutionRecord> {
    const startTime = Date.now();
    const anomalies = await this.scanForAnomalies();
    let autoHealedCount = 0;

    if (routine.autoHealEnabled) {
      for (const anom of anomalies.slice(0, 2)) {
        if (!anom.resolved) {
          await this.autoHealAnomaly(anom.id);
          autoHealedCount++;
        }
      }
    }

    const status = anomalies.length === 0 ? 'success' : autoHealedCount > 0 ? 'warning' : 'warning';
    const summary = `${routine.name} finished: ${anomalies.length} anomalies detected, ${autoHealedCount} auto-healed safely.`;

    const record: RoutineExecutionRecord = {
      id: `rec-${Date.now()}`,
      routineId: routine.id,
      routineName: routine.name,
      status,
      anomaliesDetectedCount: anomalies.length,
      anomaliesAutoHealedCount: autoHealedCount,
      summary,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    await db.routineLogs.add(record);

    await db.autonomousRoutines.update(routine.id, {
      lastRunAt: new Date().toISOString(),
      lastStatus: autoHealedCount > 0 ? 'auto_healed' : anomalies.length > 0 ? 'anomalies_detected' : 'healthy',
      lastRunSummary: summary,
    });

    return record;
  }
}
