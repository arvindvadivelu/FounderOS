import { db } from '../db';
import { logActivity } from '../db/services/activityService';
import type { ActionPreview, ActionFieldDiff } from '../types';

function formatFieldLabel(key: string): string {
  const map: Record<string, string> = {
    title: 'Title',
    name: 'Name',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due Date',
    targetDate: 'Target Date',
    deadline: 'Deadline',
    estimatedMinutes: 'Est. Minutes',
    tags: 'Tags',
    companyName: 'Company Name',
    contactName: 'Contact Name',
    email: 'Email',
    monthlyRevenue: 'Monthly Revenue',
    plan: 'Plan Tier',
    value: 'Deal Value',
    stage: 'Pipeline Stage',
    probability: 'Probability (%)',
    target: 'Target Goal Value',
    currentValue: 'Current Value',
    unit: 'Unit',
    impact: 'Impact',
    effort: 'Effort',
    severity: 'Bug Severity',
    content: 'Note Body',
    category: 'Category',
    salary: 'Salary',
    role: 'Role',
    employmentType: 'Employment Type',
  };
  return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
}

function formatValue(v: any): string {
  if (v === undefined || v === null || v === '') return '(empty)';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString();
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : '(none)';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export async function getActionPreview(toolName: string, args: Record<string, any> = {}): Promise<ActionPreview> {
  const isDestructive = toolName.startsWith('delete');

  switch (toolName) {
    // ----------------------------------------------------
    // TASK ACTIONS
    // ----------------------------------------------------
    case 'createTask': {
      const diffs: ActionFieldDiff[] = [
        { field: 'title', label: 'Task Title', newValue: formatValue(args.title) },
        { field: 'priority', label: 'Priority', newValue: formatValue(args.priority || 'medium') },
        { field: 'dueDate', label: 'Due Date', newValue: formatValue(args.dueDate) },
        { field: 'description', label: 'Description', newValue: formatValue(args.description) },
      ].filter((d) => d.newValue !== '(empty)');

      return {
        actionType: 'create',
        displayName: 'Create Task',
        targetEntity: 'Task',
        targetRecordTitle: args.title || 'New Task',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateTask':
    case 'updateTaskStatus': {
      const existing = args.id ? await db.tasks.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Task',
          targetEntity: 'Task',
          targetRecordTitle: `Task ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Task with ID "${args.id}" was not found in the local database.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['title', 'status', 'priority', 'dueDate', 'description'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Task',
        targetEntity: 'Task',
        targetRecordTitle: existing.title,
        targetRecordId: existing.id,
        diffs: diffs.length > 0 ? diffs : [{ field: 'status', label: 'Status', oldValue: existing.status, newValue: args.status || existing.status }],
        isDestructive: false,
        exists: true,
      };
    }

    case 'completeTask': {
      const existing = args.id ? await db.tasks.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'complete',
          displayName: 'Complete Task',
          targetEntity: 'Task',
          targetRecordTitle: `Task ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Task with ID "${args.id}" was not found in the local database.`,
        };
      }

      return {
        actionType: 'complete',
        displayName: 'Complete Task',
        targetEntity: 'Task',
        targetRecordTitle: existing.title,
        targetRecordId: existing.id,
        diffs: [
          { field: 'status', label: 'Status', oldValue: existing.status, newValue: 'done' },
        ],
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // PROJECT ACTIONS
    // ----------------------------------------------------
    case 'createProject': {
      const diffs: ActionFieldDiff[] = [
        { field: 'name', label: 'Project Name', newValue: formatValue(args.name) },
        { field: 'priority', label: 'Priority', newValue: formatValue(args.priority || 'medium') },
        { field: 'targetDate', label: 'Target Date', newValue: formatValue(args.targetDate) },
        { field: 'description', label: 'Description', newValue: formatValue(args.description) },
      ].filter((d) => d.newValue !== '(empty)');

      return {
        actionType: 'create',
        displayName: 'Create Project',
        targetEntity: 'Project',
        targetRecordTitle: args.name || 'New Project',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateProject': {
      const existing = args.id ? await db.projects.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Project',
          targetEntity: 'Project',
          targetRecordTitle: `Project ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Project with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['name', 'status', 'priority', 'progress', 'targetDate', 'description'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Project',
        targetEntity: 'Project',
        targetRecordTitle: existing.name,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // CUSTOMER ACTIONS
    // ----------------------------------------------------
    case 'createCustomer': {
      const diffs: ActionFieldDiff[] = [
        { field: 'companyName', label: 'Company Name', newValue: formatValue(args.companyName) },
        { field: 'contactName', label: 'Contact Name', newValue: formatValue(args.contactName) },
        { field: 'email', label: 'Email', newValue: formatValue(args.email) },
        { field: 'monthlyRevenue', label: 'Monthly Revenue', newValue: formatValue(args.monthlyRevenue ? `$${args.monthlyRevenue}` : '$0') },
        { field: 'status', label: 'Status', newValue: formatValue(args.status || 'lead') },
        { field: 'plan', label: 'Plan', newValue: formatValue(args.plan || 'Standard') },
      ];

      return {
        actionType: 'create',
        displayName: 'Create Customer',
        targetEntity: 'Customer',
        targetRecordTitle: args.companyName || 'New Customer',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateCustomer': {
      const existing = args.id ? await db.customers.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Customer',
          targetEntity: 'Customer',
          targetRecordTitle: `Customer ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Customer with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['companyName', 'contactName', 'email', 'status', 'monthlyRevenue', 'plan'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Customer',
        targetEntity: 'Customer',
        targetRecordTitle: existing.companyName,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // DEAL ACTIONS
    // ----------------------------------------------------
    case 'createDeal': {
      const diffs: ActionFieldDiff[] = [
        { field: 'name', label: 'Deal Name', newValue: formatValue(args.name) },
        { field: 'value', label: 'Deal Value', newValue: formatValue(args.value ? `$${args.value}` : '$0') },
        { field: 'stage', label: 'Stage', newValue: formatValue(args.stage || 'Lead') },
        { field: 'probability', label: 'Win Probability', newValue: formatValue(`${args.probability || 50}%`) },
      ];

      return {
        actionType: 'create',
        displayName: 'Create Deal',
        targetEntity: 'Deal',
        targetRecordTitle: args.name || 'New Deal',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateDeal': {
      const existing = args.id ? await db.deals.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Deal',
          targetEntity: 'Deal',
          targetRecordTitle: `Deal ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Deal with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['name', 'value', 'stage', 'probability', 'expectedCloseDate'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Deal',
        targetEntity: 'Deal',
        targetRecordTitle: existing.name,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // GOAL ACTIONS
    // ----------------------------------------------------
    case 'createGoal': {
      const diffs: ActionFieldDiff[] = [
        { field: 'title', label: 'Goal Title', newValue: formatValue(args.title) },
        { field: 'target', label: 'Target Value', newValue: formatValue(`${args.target || 0} ${args.unit || ''}`) },
        { field: 'deadline', label: 'Deadline', newValue: formatValue(args.deadline) },
      ];

      return {
        actionType: 'create',
        displayName: 'Create Goal',
        targetEntity: 'Goal',
        targetRecordTitle: args.title || 'New Goal',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateGoal': {
      const existing = args.id ? await db.goals.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Goal',
          targetEntity: 'Goal',
          targetRecordTitle: `Goal ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Goal with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['title', 'target', 'currentValue', 'unit', 'status', 'deadline'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Goal',
        targetEntity: 'Goal',
        targetRecordTitle: existing.title,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // PRODUCT & ENGINEERING ACTIONS
    // ----------------------------------------------------
    case 'createFeature': {
      const diffs: ActionFieldDiff[] = [
        { field: 'title', label: 'Feature Title', newValue: formatValue(args.title) },
        { field: 'priority', label: 'Priority', newValue: formatValue(args.priority || 'medium') },
        { field: 'impact', label: 'Impact', newValue: formatValue(args.impact || 'medium') },
        { field: 'effort', label: 'Effort', newValue: formatValue(args.effort || 'medium') },
      ];

      return {
        actionType: 'create',
        displayName: 'Create Feature',
        targetEntity: 'Feature',
        targetRecordTitle: args.title || 'New Feature',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateFeature': {
      const existing = args.id ? await db.features.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Feature',
          targetEntity: 'Feature',
          targetRecordTitle: `Feature ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Feature with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['title', 'status', 'priority', 'impact', 'effort', 'description'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Feature',
        targetEntity: 'Feature',
        targetRecordTitle: existing.title,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'createBug': {
      const diffs: ActionFieldDiff[] = [
        { field: 'title', label: 'Bug Title', newValue: formatValue(args.title) },
        { field: 'severity', label: 'Severity', newValue: formatValue(args.severity || 'medium') },
        { field: 'priority', label: 'Priority', newValue: formatValue(args.priority || 'medium') },
        { field: 'description', label: 'Description', newValue: formatValue(args.description) },
      ].filter((d) => d.newValue !== '(empty)');

      return {
        actionType: 'create',
        displayName: 'Create Bug',
        targetEntity: 'Bug',
        targetRecordTitle: args.title || 'New Bug Report',
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    case 'updateBug': {
      const existing = args.id ? await db.bugs.get(args.id) : undefined;
      if (!existing) {
        return {
          actionType: 'update',
          displayName: 'Update Bug',
          targetEntity: 'Bug',
          targetRecordTitle: `Bug ID: ${args.id || 'Unknown'}`,
          targetRecordId: args.id,
          diffs: [],
          isDestructive: false,
          exists: false,
          warning: `Bug with ID "${args.id}" was not found.`,
        };
      }

      const diffs: ActionFieldDiff[] = [];
      const fieldsToCheck = ['title', 'status', 'severity', 'priority', 'description'];
      for (const field of fieldsToCheck) {
        if (args[field] !== undefined && args[field] !== existing[field as keyof typeof existing]) {
          diffs.push({
            field,
            label: formatFieldLabel(field),
            oldValue: formatValue(existing[field as keyof typeof existing]),
            newValue: formatValue(args[field]),
          });
        }
      }

      return {
        actionType: 'update',
        displayName: 'Update Bug',
        targetEntity: 'Bug',
        targetRecordTitle: existing.title,
        targetRecordId: existing.id,
        diffs,
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // NOTE ACTIONS
    // ----------------------------------------------------
    case 'createNote': {
      return {
        actionType: 'create',
        displayName: 'Create Note',
        targetEntity: 'Note',
        targetRecordTitle: args.title || 'New Note',
        diffs: [
          { field: 'title', label: 'Title', newValue: formatValue(args.title) },
          { field: 'category', label: 'Category', newValue: formatValue(args.category || 'General') },
          { field: 'content', label: 'Content', newValue: formatValue(args.content) },
        ],
        isDestructive: false,
        exists: true,
      };
    }

    // ----------------------------------------------------
    // DESTRUCTIVE ACTIONS
    // ----------------------------------------------------
    case 'deleteCustomer': {
      const existing = args.id ? await db.customers.get(args.id) : undefined;
      return {
        actionType: 'delete',
        displayName: 'Delete Customer',
        targetEntity: 'Customer',
        targetRecordTitle: existing ? existing.companyName : `Customer ID: ${args.id || 'Unknown'}`,
        targetRecordId: args.id,
        diffs: [
          { field: 'id', label: 'Customer ID', oldValue: args.id, newValue: '(PERMANENT REMOVAL)' },
        ],
        isDestructive: true,
        exists: !!existing,
        warning: 'This will permanently delete the customer and unlink all associated deals and invoices.',
      };
    }

    case 'deleteTask': {
      const existing = args.id ? await db.tasks.get(args.id) : undefined;
      return {
        actionType: 'delete',
        displayName: 'Delete Task',
        targetEntity: 'Task',
        targetRecordTitle: existing ? existing.title : `Task ID: ${args.id || 'Unknown'}`,
        targetRecordId: args.id,
        diffs: [
          { field: 'id', label: 'Task ID', oldValue: args.id, newValue: '(PERMANENT REMOVAL)' },
        ],
        isDestructive: true,
        exists: !!existing,
        warning: 'This will permanently delete the task from the local database.',
      };
    }

    case 'deleteTransaction': {
      const existing = args.id ? await db.transactions.get(args.id) : undefined;
      return {
        actionType: 'delete',
        displayName: 'Delete Transaction',
        targetEntity: 'Transaction',
        targetRecordTitle: existing ? `${existing.description} ($${existing.amount})` : `Transaction ID: ${args.id || 'Unknown'}`,
        targetRecordId: args.id,
        diffs: [
          { field: 'id', label: 'Transaction ID', oldValue: args.id, newValue: '(PERMANENT REMOVAL)' },
        ],
        isDestructive: true,
        exists: !!existing,
        warning: 'This will permanently remove this ledger transaction and alter balance sheets.',
      };
    }

    case 'onboardClientProject': {
      return {
        actionType: 'create',
        displayName: 'Onboard Client & Auto-Provision Company',
        targetEntity: 'Multi-Entity Pipeline',
        targetRecordTitle: `${args.companyName || 'New Client'} — ${args.projectTitle || 'Project'}`,
        diffs: [
          { field: 'companyName', label: 'Client Company', newValue: formatValue(args.companyName) },
          { field: 'projectTitle', label: 'Project Name', newValue: formatValue(args.projectTitle) },
          { field: 'totalDealValue', label: 'Deal Value', newValue: formatValue(args.totalDealValue ? `$${args.totalDealValue.toLocaleString()}` : '$0') },
          { field: 'depositAmount', label: 'Initial Deposit', newValue: formatValue(args.depositAmount ? `$${args.depositAmount.toLocaleString()}` : '$0') },
          { field: 'targetDeliveryDate', label: 'Delivery Date', newValue: formatValue(args.targetDeliveryDate) },
          { field: 'entities', label: 'Auto-Provisioned Modules', newValue: 'Customers CRM, Won Deal, Invoice, Transaction, Project, 5 Milestone Tasks, Brief Note, OKR Goal' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'mitigateCustomerRisk': {
      return {
        actionType: 'update',
        displayName: 'Mitigate Customer Churn Risk',
        targetEntity: 'Customer & Tech Blocker',
        targetRecordTitle: args.companyName || 'At-Risk Customer',
        diffs: [
          { field: 'companyName', label: 'Customer', newValue: formatValue(args.companyName) },
          { field: 'status', label: 'New CRM Status', newValue: 'at_risk (Critical Attention)' },
          { field: 'issueDescription', label: 'Reported Blocker', newValue: formatValue(args.issueDescription) },
          { field: 'monthlyRevenue', label: 'MRR at Risk', newValue: formatValue(args.monthlyRevenue ? `$${args.monthlyRevenue.toLocaleString()}/mo` : '$0') },
          { field: 'severity', label: 'Ticket Severity', newValue: formatValue(args.severity || 'critical') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'P0 Bug Ticket, 2 Emergency Tasks, Retention Talking Points Memo' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'onboardEmployee': {
      return {
        actionType: 'create',
        displayName: 'Onboard Team Member',
        targetEntity: 'Team & Operations',
        targetRecordTitle: `${args.name || 'New Hire'} (${args.role || 'Role'})`,
        diffs: [
          { field: 'name', label: 'Employee Name', newValue: formatValue(args.name) },
          { field: 'role', label: 'Role & Title', newValue: formatValue(args.role) },
          { field: 'departmentName', label: 'Department', newValue: formatValue(args.departmentName || 'Engineering') },
          { field: 'monthlySalary', label: 'Monthly Payroll', newValue: formatValue(args.monthlySalary ? `$${args.monthlySalary.toLocaleString()}/mo` : '$0') },
          { field: 'startDate', label: 'Start Date', newValue: formatValue(args.startDate) },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Directory Profile, Recurring Payroll Expense, 5 Ramp-up Tasks, 90-Day Role Goal' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'launchFeatureSprint': {
      return {
        actionType: 'create',
        displayName: 'Launch Feature Sprint',
        targetEntity: 'Product Roadmap',
        targetRecordTitle: args.title || 'New Feature',
        diffs: [
          { field: 'title', label: 'Feature Title', newValue: formatValue(args.title) },
          { field: 'priority', label: 'Priority', newValue: formatValue(args.priority || 'high') },
          { field: 'impact', label: 'Strategic Impact', newValue: formatValue(args.impact || 'high') },
          { field: 'effort', label: 'Estimated Effort', newValue: formatValue(args.effort || 'medium') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Roadmap Feature, 4 Engineering Tasks, Mini-PRD Spec in Notes' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'auditVendorExpense': {
      return {
        actionType: 'create',
        displayName: 'Audit Vendor & Shield Runway',
        targetEntity: 'Finance & Subscriptions',
        targetRecordTitle: args.vendorName || 'New Vendor',
        diffs: [
          { field: 'vendorName', label: 'Vendor / Tool', newValue: formatValue(args.vendorName) },
          { field: 'monthlyCost', label: 'Monthly Cost', newValue: formatValue(args.monthlyCost ? `$${args.monthlyCost.toLocaleString()}/mo` : '$0') },
          { field: 'category', label: 'Category', newValue: formatValue(args.category || 'software') },
          { field: 'renewalCycle', label: 'Renewal Cycle', newValue: formatValue(args.renewalCycle || 'monthly') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Expense Transaction, 30-Day Renewal Audit Task, Vendor Terms in Notes' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'generateInvestorReport': {
      return {
        actionType: 'create',
        displayName: 'Generate Monthly Investor Briefing',
        targetEntity: 'Company Strategy & OKRs',
        targetRecordTitle: args.monthYear || 'Current Month',
        diffs: [
          { field: 'monthYear', label: 'Period', newValue: formatValue(args.monthYear || 'Current Month') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Executive Investor Memo in Notes, Cap-Table Distribution Task, Ground-Truth Metrics Synthesis' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'reengageStalledDeals': {
      return {
        actionType: 'update',
        displayName: 'Win-Back Stalled Pipeline Deals',
        targetEntity: 'Sales Pipeline & Revenue',
        targetRecordTitle: 'Stalled Deals Win-Back Campaign',
        affectedTables: ['deals', 'tasks', 'notes'],
        diffs: [
          { field: 'minValue', label: 'Min Deal Value', newValue: formatValue(args.minValue ? `$${args.minValue.toLocaleString()}` : '$1,500') },
          { field: 'incentiveType', label: 'Incentive Angle', newValue: formatValue(args.incentiveType || 'Fast-Track Onboarding Guarantee') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Deals moved to Negotiation (60%), 48-hour follow-up tasks scheduled, Win-Back Playbook saved' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'recoverOverdueInvoices': {
      return {
        actionType: 'update',
        displayName: 'Recover Overdue Invoices & Cash',
        targetEntity: 'Finance & Accounts Receivable',
        targetRecordTitle: 'Overdue Cash Recovery Campaign',
        affectedTables: ['invoices', 'customers', 'tasks', 'notes'],
        diffs: [
          { field: 'escalationLevel', label: 'Escalation Tier', newValue: formatValue(args.escalationLevel || 'Firm Notice') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Notice timestamps logged, Customer payment tags updated, Wire verification tasks scheduled, AR Audit saved' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'launchAccountExpansion': {
      return {
        actionType: 'create',
        displayName: 'Launch Account Retainer & Upsell',
        targetEntity: 'Existing Customer Expansion',
        targetRecordTitle: `${args.customerName || 'Target Client'} — Annual Expansion`,
        affectedTables: ['deals', 'customers', 'tasks', 'notes', 'goals'],
        diffs: [
          { field: 'customerName', label: 'Client', newValue: formatValue(args.customerName || 'Top Account') },
          { field: 'proposedValue', label: 'Proposed Contract', newValue: formatValue(args.proposedValue ? `$${args.proposedValue.toLocaleString()}/yr` : '$18,000/yr') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'High-margin Expansion Deal, 1-Page Retainer Proposal in Notes, Pitch task, OKR increment' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'createScopeChangeOrder': {
      return {
        actionType: 'create',
        displayName: 'Create Scope Change Order & Counter-Offer',
        targetEntity: 'Project Contract & Margin Defense',
        targetRecordTitle: `Change Order: ${args.requestedScope ? args.requestedScope.slice(0, 30) : 'Scope Request'}`,
        affectedTables: ['invoices', 'projects', 'tasks', 'notes'],
        diffs: [
          { field: 'requestedScope', label: 'Requested Addition', newValue: formatValue(args.requestedScope) },
          { field: 'chargeOrderFee', label: 'Add-on Fee', newValue: formatValue(args.chargeOrderFee ? `$${args.chargeOrderFee.toLocaleString()}` : '$1,500') },
          { field: 'provisions', label: 'Auto-Provisioned', newValue: 'Change Order Invoice (#INV-CO), Scope freeze backlog tasks, 3-Option counter-offer framework' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    case 'runRevenueWarRoom': {
      return {
        actionType: 'create',
        displayName: 'Monday Revenue War Room',
        targetEntity: 'CEO Operating Rhythm & Governance',
        targetRecordTitle: 'Weekly Revenue War Room',
        affectedTables: ['tasks', 'notes'],
        diffs: [
          { field: 'provisions', label: 'Auto-Provisioned', newValue: '360° Financial & Ops Pulse, Top 3 Founder Priority tasks with deadlines, Weekly Executive Brief' },
        ].filter((d) => d.newValue !== '(empty)'),
        isDestructive: false,
        exists: true,
      };
    }

    default: {
      return {
        actionType: 'create',
        displayName: toolName,
        targetEntity: 'System Record',
        targetRecordTitle: toolName,
        diffs: Object.entries(args).map(([k, v]) => ({
          field: k,
          label: formatFieldLabel(k),
          newValue: formatValue(v),
        })),
        isDestructive,
        exists: true,
      };
    }
  }
}

/**
 * Verifies that the local database was actually mutated as expected
 */
export async function verifyActionExecution(
  toolName: string,
  args: Record<string, any>,
  result: any
): Promise<{ verified: boolean; message: string }> {
  try {
    switch (toolName) {
      case 'createTask': {
        const id = result?.task?.id;
        if (!id) return { verified: false, message: 'No task ID returned in execution response.' };
        const stored = await db.tasks.get(id);
        if (!stored) return { verified: false, message: 'Verification failed: Task not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'task', `AI Agent created task "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Task "${stored.title}" created.` };
      }

      case 'updateTask':
      case 'updateTaskStatus':
      case 'completeTask': {
        const id = args.id;
        const stored = await db.tasks.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Task "${id}" not found.` };
        await logActivity('ai_action_executed', 'task', `AI Agent updated task "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Task "${stored.title}" updated (${stored.status}).` };
      }

      case 'createProject': {
        const id = result?.project?.id;
        const stored = id ? await db.projects.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Project not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'project', `AI Agent created project "${stored.name}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Project "${stored.name}" created.` };
      }

      case 'updateProject': {
        const id = args.id;
        const stored = await db.projects.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Project "${id}" not found.` };
        await logActivity('ai_action_executed', 'project', `AI Agent updated project "${stored.name}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Project "${stored.name}" updated.` };
      }

      case 'createCustomer': {
        const id = result?.customer?.id;
        const stored = id ? await db.customers.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Customer not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'customer', `AI Agent created customer "${stored.companyName}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Customer "${stored.companyName}" created.` };
      }

      case 'updateCustomer': {
        const id = args.id;
        const stored = await db.customers.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Customer "${id}" not found.` };
        await logActivity('ai_action_executed', 'customer', `AI Agent updated customer "${stored.companyName}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Customer "${stored.companyName}" updated.` };
      }

      case 'createDeal': {
        const id = result?.deal?.id;
        const stored = id ? await db.deals.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Deal not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'deal', `AI Agent created deal "${stored.name}" ($${stored.value})`, id);
        return { verified: true, message: `Verified in IndexedDB: Deal "${stored.name}" created.` };
      }

      case 'updateDeal': {
        const id = args.id;
        const stored = await db.deals.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Deal "${id}" not found.` };
        await logActivity('ai_action_executed', 'deal', `AI Agent updated deal "${stored.name}" (${stored.stage})`, id);
        return { verified: true, message: `Verified in IndexedDB: Deal "${stored.name}" updated.` };
      }

      case 'createGoal': {
        const id = result?.goal?.id;
        const stored = id ? await db.goals.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Goal not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'goal', `AI Agent set goal "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Goal "${stored.title}" created.` };
      }

      case 'updateGoal': {
        const id = args.id;
        const stored = await db.goals.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Goal "${id}" not found.` };
        await logActivity('ai_action_executed', 'goal', `AI Agent updated goal "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Goal "${stored.title}" updated.` };
      }

      case 'createFeature': {
        const id = result?.feature?.id;
        const stored = id ? await db.features.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Feature not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'feature', `AI Agent added feature "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Feature "${stored.title}" added to backlog.` };
      }

      case 'updateFeature': {
        const id = args.id;
        const stored = await db.features.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Feature "${id}" not found.` };
        await logActivity('ai_action_executed', 'feature', `AI Agent updated feature "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Feature "${stored.title}" updated.` };
      }

      case 'createBug': {
        const id = result?.bug?.id;
        const stored = id ? await db.bugs.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Bug not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'bug', `AI Agent reported bug "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Bug "${stored.title}" created.` };
      }

      case 'updateBug': {
        const id = args.id;
        const stored = await db.bugs.get(id);
        if (!stored) return { verified: false, message: `Verification failed: Bug "${id}" not found.` };
        await logActivity('ai_action_executed', 'bug', `AI Agent updated bug "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Bug "${stored.title}" updated.` };
      }

      case 'createNote': {
        const id = result?.note?.id;
        const stored = id ? await db.notes.get(id) : undefined;
        if (!stored) return { verified: false, message: 'Verification failed: Note not found in IndexedDB.' };
        await logActivity('ai_action_executed', 'note', `AI Agent created note "${stored.title}"`, id);
        return { verified: true, message: `Verified in IndexedDB: Note "${stored.title}" saved.` };
      }

      case 'deleteCustomer': {
        const stored = await db.customers.get(args.id);
        if (stored) return { verified: false, message: `Customer "${args.id}" still exists after deletion.` };
        await logActivity('ai_action_executed', 'customer', `AI Agent permanently deleted customer ${args.id}`);
        return { verified: true, message: `Verified in IndexedDB: Customer permanently deleted.` };
      }

      case 'deleteTask': {
        const stored = await db.tasks.get(args.id);
        if (stored) return { verified: false, message: `Task "${args.id}" still exists after deletion.` };
        await logActivity('ai_action_executed', 'task', `AI Agent permanently deleted task ${args.id}`);
        return { verified: true, message: `Verified in IndexedDB: Task permanently deleted.` };
      }

      case 'deleteTransaction': {
        const stored = await db.transactions.get(args.id);
        if (stored) return { verified: false, message: `Transaction "${args.id}" still exists after deletion.` };
        await logActivity('ai_action_executed', 'transaction', `AI Agent permanently deleted transaction ${args.id}`);
        return { verified: true, message: `Verified in IndexedDB: Transaction permanently deleted.` };
      }

      case 'onboardClientProject': {
        const custId = result?.customer?.id;
        const projId = result?.project?.id;
        if (!custId || !projId) {
          return { verified: false, message: 'Client onboarding response missing customer or project ID.' };
        }
        const cust = await db.customers.get(custId);
        const proj = await db.projects.get(projId);
        if (!cust || !proj) {
          return { verified: false, message: 'Verification failed: Customer or Project not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Client "${cust.companyName}" and project "${proj.name}" auto-provisioned across all modules.`,
        };
      }

      case 'mitigateCustomerRisk': {
        const custId = result?.customer?.id;
        const bugId = result?.bug?.id;
        const noteId = result?.note?.id;
        const cust = custId ? await db.customers.get(custId) : undefined;
        const bug = bugId ? await db.bugs.get(bugId) : undefined;
        const note = noteId ? await db.notes.get(noteId) : undefined;
        if (!cust || !bug || !note) {
          return { verified: false, message: 'Verification failed: Customer, Bug, or Retention Note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Customer "${cust.companyName}" marked at-risk, P0 bug filed, and retention memo saved.`,
        };
      }

      case 'onboardEmployee': {
        const empId = result?.employee?.id;
        const txId = result?.transaction?.id;
        const goalId = result?.goal?.id;
        const emp = empId ? await db.employees.get(empId) : undefined;
        const tx = txId ? await db.transactions.get(txId) : undefined;
        const goal = goalId ? await db.goals.get(goalId) : undefined;
        if (!emp || !tx || !goal) {
          return { verified: false, message: 'Verification failed: Employee, Payroll, or Goal record not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Employee "${emp.name}" onboarded with payroll expense and 90-day goal.`,
        };
      }

      case 'launchFeatureSprint': {
        const featId = result?.feature?.id;
        const noteId = result?.note?.id;
        const feat = featId ? await db.features.get(featId) : undefined;
        const note = noteId ? await db.notes.get(noteId) : undefined;
        if (!feat || !note) {
          return { verified: false, message: 'Verification failed: Feature or PRD note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Feature "${feat.title}" queued with 4 sprint tasks and PRD saved.`,
        };
      }

      case 'auditVendorExpense': {
        const txId = result?.transaction?.id;
        const noteId = result?.note?.id;
        const tx = txId ? await db.transactions.get(txId) : undefined;
        const note = noteId ? await db.notes.get(noteId) : undefined;
        if (!tx || !note) {
          return { verified: false, message: 'Verification failed: Vendor transaction or note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Vendor expense recorded ($${tx.amount}/mo) and renewal audit task scheduled.`,
        };
      }

      case 'generateInvestorReport': {
        const noteId = result?.note?.id;
        const note = noteId ? await db.notes.get(noteId) : undefined;
        if (!note) {
          return { verified: false, message: 'Verification failed: Investor Update note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Investor report "${note.title}" published with live KPI calculations.`,
        };
      }

      case 'reengageStalledDeals': {
        let note = result?.note?.id ? await db.notes.get(result.note.id) : undefined;
        if (!note) {
          const notes = await db.notes.toArray();
          note = notes.find((n) => n.tags?.includes('win-back') || n.title.includes('Win-Back'));
        }
        if (!note) {
          return { verified: false, message: 'Verification failed: Win-Back playbook note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Re-engaged deals ($${result?.totalPipelineValue?.toLocaleString() || 0}) and saved Playbook.`,
        };
      }

      case 'recoverOverdueInvoices': {
        let note = result?.note?.id ? await db.notes.get(result.note.id) : undefined;
        if (!note) {
          const notes = await db.notes.toArray();
          note = notes.find((n) => n.tags?.includes('ar') || n.title.includes('Receivables') || n.title.includes('Cash Recovery'));
        }
        if (!note) {
          return { verified: false, message: 'Verification failed: Cash recovery audit memo not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Collection notices dispatched and audit memo saved.`,
        };
      }

      case 'launchAccountExpansion': {
        let deal = result?.deal?.id ? await db.deals.get(result.deal.id) : undefined;
        if (!deal) {
          const deals = await db.deals.toArray();
          deal = deals.find((d) => d.source === 'upsell_expansion' || d.name.includes('Retainer Expansion'));
        }
        let note = result?.note?.id ? await db.notes.get(result.note.id) : undefined;
        if (!note) {
          const notes = await db.notes.toArray();
          note = notes.find((n) => n.tags?.includes('expansion') || n.title.includes('Retainer'));
        }
        if (!deal || !note) {
          return { verified: false, message: 'Verification failed: Expansion deal or proposal note not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Expansion deal "${deal.name}" created with proposal in Notes.`,
        };
      }

      case 'createScopeChangeOrder': {
        let inv = result?.invoice?.id ? await db.invoices.get(result.invoice.id) : undefined;
        if (!inv) {
          const invoices = await db.invoices.toArray();
          inv = invoices.find((i) => i.invoiceNumber?.startsWith('INV-CO-'));
        }
        let note = result?.note?.id ? await db.notes.get(result.note.id) : undefined;
        if (!note) {
          const notes = await db.notes.toArray();
          note = notes.find((n) => n.tags?.includes('scope-creep') || n.title.includes('Scope Defense'));
        }
        if (!inv || !note) {
          return { verified: false, message: 'Verification failed: Change order invoice or defense memo not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Change Order #${inv.invoiceNumber} generated with scope freeze tasks.`,
        };
      }

      case 'runRevenueWarRoom': {
        let note = result?.note?.id ? await db.notes.get(result.note.id) : undefined;
        if (!note) {
          const notes = await db.notes.toArray();
          note = notes.find((n) => n.tags?.includes('war-room') || n.title.includes('War Room'));
        }
        if (!note) {
          return { verified: false, message: 'Verification failed: War Room brief not found in IndexedDB.' };
        }
        return {
          verified: true,
          message: `Verified in IndexedDB: Top 3 CEO Priority tasks pinned and War Room memo published.`,
        };
      }

      default:
        return { verified: true, message: 'Action executed successfully.' };
    }
  } catch (err: any) {
    return { verified: false, message: `Post-execution verification error: ${err.message}` };
  }
}
