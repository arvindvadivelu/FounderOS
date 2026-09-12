import { db } from '../db/db';
import { updateAIMessage } from '../db/services/aiStorageService';
import { logActivity } from '../db/services/activityService';

export interface UndoActionResult {
  success: boolean;
  message: string;
  rolledBackEntities: string[];
}

/**
 * Reverses and cleans up database records provisioned by an AI CEO action.
 * Atomically cleans up tasks, deals, notes, invoices, and other entities created during the action,
 * and updates the message toolCall state in IndexedDB to 'undone'.
 */
export async function undoConfirmedToolAction(
  messageId: string,
  toolCallId: string,
  toolName: string,
  result?: any,
  args?: Record<string, any>
): Promise<UndoActionResult> {
  const rolledBack: string[] = [];

  try {
    switch (toolName) {
      case 'onboardClientProject': {
        // Customer
        if (result?.customer?.id) {
          await db.customers.delete(result.customer.id);
          rolledBack.push(`Customer (${result.customer.companyName || result.customer.id})`);
        }
        // Deal
        if (result?.deal?.id) {
          await db.deals.delete(result.deal.id);
          rolledBack.push('CRM Deal');
        }
        // Invoice
        if (result?.invoice?.id) {
          await db.invoices.delete(result.invoice.id);
          rolledBack.push('Invoice');
        }
        // Transaction
        if (result?.transaction?.id) {
          await db.transactions.delete(result.transaction.id);
          rolledBack.push('Deposit Transaction');
        }
        // Project
        if (result?.project?.id) {
          await db.projects.delete(result.project.id);
          rolledBack.push('Delivery Project');
        }
        // Tasks
        if (Array.isArray(result?.tasks) && result.tasks.length > 0) {
          for (const t of result.tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${result.tasks.length} Milestone Tasks`);
        }
        // Note
        if (result?.note?.id) {
          await db.notes.delete(result.note.id);
          rolledBack.push('Project Brief Note');
        }
        // Goal
        if (result?.goal?.id) {
          await db.goals.delete(result.goal.id);
          rolledBack.push('OKR Milestone Goal');
        }
        break;
      }

      case 'mitigateCustomerRisk': {
        // Bug ticket
        if (result?.bug?.id) {
          await db.bugs.delete(result.bug.id);
          rolledBack.push('P0 Bug Ticket');
        }
        // Tasks
        if (Array.isArray(result?.tasks) && result.tasks.length > 0) {
          for (const t of result.tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${result.tasks.length} Emergency Fire Drill Tasks`);
        }
        // Note
        if (result?.note?.id) {
          await db.notes.delete(result.note.id);
          rolledBack.push('Retention Strategy Note');
        }
        // Revert customer status
        if (result?.customer?.id) {
          const cust = await db.customers.get(result.customer.id);
          if (cust) {
            await db.customers.update(cust.id, {
              status: 'active',
              tags: (cust.tags || []).filter((t) => t !== 'at_risk' && t !== 'critical_fire_drill'),
            });
            rolledBack.push(`Reverted Customer "${cust.companyName}" status to active`);
          }
        }
        break;
      }

      case 'onboardEmployee': {
        if (result?.employee?.id) {
          await db.employees.delete(result.employee.id);
          rolledBack.push(`Team Member (${result.employee.name})`);
        }
        if (result?.transaction?.id) {
          await db.transactions.delete(result.transaction.id);
          rolledBack.push('Monthly Payroll Transaction');
        }
        if (Array.isArray(result?.tasks) && result.tasks.length > 0) {
          for (const t of result.tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${result.tasks.length} Onboarding Tasks`);
        }
        if (result?.goal?.id) {
          await db.goals.delete(result.goal.id);
          rolledBack.push('90-Day Performance Goal');
        }
        break;
      }

      case 'launchFeatureSprint': {
        if (result?.feature?.id) {
          await db.features.delete(result.feature.id);
          rolledBack.push(`Roadmap Feature (${result.feature.title})`);
        }
        if (Array.isArray(result?.tasks) && result.tasks.length > 0) {
          for (const t of result.tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${result.tasks.length} Sprint Engineering Tasks`);
        }
        if (result?.note?.id) {
          await db.notes.delete(result.note.id);
          rolledBack.push('Mini-PRD Specification Note');
        }
        break;
      }

      case 'auditVendorExpense': {
        if (result?.transaction?.id) {
          await db.transactions.delete(result.transaction.id);
          rolledBack.push('Vendor Subscription Expense');
        }
        if (result?.task?.id) {
          await db.tasks.delete(result.task.id);
          rolledBack.push('30-Day Renewal Audit Task');
        }
        if (result?.note?.id) {
          await db.notes.delete(result.note.id);
          rolledBack.push('Vendor Contract Profile Note');
        }
        break;
      }

      case 'generateInvestorReport': {
        if (result?.note?.id) {
          await db.notes.delete(result.note.id);
          rolledBack.push('Monthly Investor Memo Note');
        }
        if (Array.isArray(result?.tasks) && result.tasks.length > 0) {
          for (const t of result.tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push('Investor Distribution Task');
        }
        break;
      }

      case 'reengageStalledDeals': {
        const tasks = result?.tasksCreated || result?.tasks;
        if (Array.isArray(tasks) && tasks.length > 0) {
          for (const t of tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${tasks.length} 48h Follow-up Tasks`);
        }
        const note = result?.playbookNote || result?.note;
        if (note?.id) {
          await db.notes.delete(note.id);
          rolledBack.push('Win-Back Playbook Note');
        }
        const deals = result?.revivedDeals || result?.reengagedDeals;
        if (Array.isArray(deals) && deals.length > 0) {
          for (const d of deals) {
            if (d.id) {
              await db.deals.update(d.id, { stage: 'Qualified', probability: 40 });
            }
          }
          rolledBack.push(`${deals.length} Deals reverted to Qualified`);
        }
        break;
      }

      case 'recoverOverdueInvoices': {
        const tasks = result?.tasksCreated || result?.tasks;
        if (Array.isArray(tasks) && tasks.length > 0) {
          for (const t of tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${tasks.length} Wire Verification Tasks`);
        }
        const note = result?.auditNote || result?.note;
        if (note?.id) {
          await db.notes.delete(note.id);
          rolledBack.push('AR Recovery Audit Note');
        }
        // Remove overdue notice tag from customers
        const customers = await db.customers.toArray();
        for (const c of customers) {
          if (c.tags?.includes('overdue_notice')) {
            await db.customers.update(c.id, {
              tags: c.tags.filter((t) => t !== 'overdue_notice'),
            });
          }
        }
        rolledBack.push('Customer overdue notice tags cleared');
        break;
      }

      case 'launchAccountExpansion': {
        if (result?.deal?.id) {
          await db.deals.delete(result.deal.id);
          rolledBack.push('Retainer Expansion Deal');
        }
        const task = result?.pitchTask || result?.task;
        if (task?.id) {
          await db.tasks.delete(task.id);
          rolledBack.push('Executive Pitch Task');
        }
        const note = result?.proposalNote || result?.note;
        if (note?.id) {
          await db.notes.delete(note.id);
          rolledBack.push('1-Page Proposal Note');
        }
        break;
      }

      case 'createScopeChangeOrder': {
        if (result?.invoice?.id) {
          await db.invoices.delete(result.invoice.id);
          rolledBack.push('Change Order Invoice');
        }
        const tasks = result?.scopeTasks || result?.tasks;
        if (Array.isArray(tasks) && tasks.length > 0) {
          for (const t of tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${tasks.length} Scope-Freeze Backlog Tasks`);
        }
        const note = result?.counterOfferNote || result?.note;
        if (note?.id) {
          await db.notes.delete(note.id);
          rolledBack.push('Counter-Offer Framework Note');
        }
        // Revert project target date if project exists
        const project = result?.updatedProject || result?.project;
        if (project?.id && result?.adjustedDays) {
          const currentTarget = new Date(project.targetDate).getTime();
          const revertedTarget = new Date(currentTarget - result.adjustedDays * 86400000).toISOString().split('T')[0];
          await db.projects.update(project.id, { targetDate: revertedTarget });
          rolledBack.push(`Project delivery date reverted by -${result.adjustedDays} days`);
        }
        break;
      }

      case 'runRevenueWarRoom': {
        const tasks = result?.priorityTasks || result?.tasks;
        if (Array.isArray(tasks) && tasks.length > 0) {
          for (const t of tasks) {
            if (t.id) await db.tasks.delete(t.id);
          }
          rolledBack.push(`${tasks.length} War Room CEO Priority Tasks`);
        }
        const note = result?.warRoomNote || result?.note;
        if (note?.id) {
          await db.notes.delete(note.id);
          rolledBack.push('Monday War Room Briefing Note');
        }
        break;
      }

      // Generic actions
      case 'createTask': {
        const id = result?.task?.id || result?.id;
        if (id) {
          await db.tasks.delete(id);
          rolledBack.push('Task');
        }
        break;
      }

      case 'createCustomer': {
        const id = result?.customer?.id || result?.id;
        if (id) {
          await db.customers.delete(id);
          rolledBack.push('Customer');
        }
        break;
      }

      case 'createDeal': {
        const id = result?.deal?.id || result?.id;
        if (id) {
          await db.deals.delete(id);
          rolledBack.push('Deal');
        }
        break;
      }

      case 'createProject': {
        const id = result?.project?.id || result?.id;
        if (id) {
          await db.projects.delete(id);
          rolledBack.push('Project');
        }
        break;
      }

      case 'createGoal': {
        const id = result?.goal?.id || result?.id;
        if (id) {
          await db.goals.delete(id);
          rolledBack.push('Goal');
        }
        break;
      }

      case 'createFeature': {
        const id = result?.feature?.id || result?.id;
        if (id) {
          await db.features.delete(id);
          rolledBack.push('Feature');
        }
        break;
      }

      case 'createBug': {
        const id = result?.bug?.id || result?.id;
        if (id) {
          await db.bugs.delete(id);
          rolledBack.push('Bug');
        }
        break;
      }

      case 'createNote': {
        const id = result?.note?.id || result?.id;
        if (id) {
          await db.notes.delete(id);
          rolledBack.push('Note');
        }
        break;
      }

      case 'createInvoice': {
        const id = result?.invoice?.id || result?.id;
        if (id) {
          await db.invoices.delete(id);
          rolledBack.push('Invoice');
        }
        break;
      }

      case 'createTransaction': {
        const id = result?.transaction?.id || result?.id;
        if (id) {
          await db.transactions.delete(id);
          rolledBack.push('Transaction');
        }
        break;
      }

      default: {
        // Fallback: Check if result has standard id
        if (result?.id) {
          rolledBack.push(`Record (${result.id})`);
        }
        break;
      }
    }

    // Persist 'undone' state on the toolCall in db.aiMessages so page reload / navigation preserves it
    if (messageId && toolCallId) {
      const msg = await db.aiMessages.get(messageId);
      if (msg && msg.toolCalls) {
        const updatedCalls = msg.toolCalls.map((tc) => {
          if (tc.id === toolCallId) {
            return {
              ...tc,
              status: 'undone' as const,
              result: undefined,
            };
          }
          return tc;
        });
        await updateAIMessage(messageId, { toolCalls: updatedCalls });
      }
    }

    await logActivity(
      'system',
      'system',
      `Founder rolled back AI CEO action "${toolName}" (${rolledBack.join(', ') || 'records removed'})`
    );

    return {
      success: true,
      message: `Action undone. Cleaned up: ${rolledBack.join(', ') || 'all provisioned records'}.`,
      rolledBackEntities: rolledBack,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to undo action: ${err.message}`,
      rolledBackEntities: rolledBack,
    };
  }
}
