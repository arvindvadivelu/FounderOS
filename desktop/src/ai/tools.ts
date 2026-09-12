import { db } from '../db';
import { getCompany } from '../db/services/companyService';
import { getFinancialSummary, getAllTransactions, getAllInvoices, deleteTransaction } from '../db/services/financeService';
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../db/services/customerService';
import { getAllDeals, createDeal, updateDeal, deleteDeal } from '../db/services/dealService';
import { getAllTasks, createTask, updateTask, deleteTask, getAllProjects, createProject, updateProject } from '../db/services/taskProjectService';
import { getAllFeatures, getAllBugs, createFeature, updateFeature, createBug, updateBug } from '../db/services/productEngineeringService';
import { getAllGoals, createGoal, updateGoal, getAllNotes, createNote, updateNote } from '../db/services/goalNoteService';
import { getRecentActivities } from '../db/services/activityService';
import {
  getAllEmployees,
  createEmployee,
  getAllDepartments,
  getCashPositionSummary,
  getBalanceSheetSummary,
} from '../db/services/managementService';
import { runFinancialReconciliation } from './reconciliation';
import {
  getAllIntegrations,
  getExternalSyncItems,
  getOverallIntegrationsHealth,
} from '../integrations/integrationService';
import { onboardClientProject } from '../db/services/onboardingService';
import {
  mitigateCustomerRisk,
  onboardEmployee,
  launchFeatureSprint,
  auditVendorExpense,
  generateInvestorReport,
  reengageStalledDeals,
  recoverOverdueInvoices,
  launchAccountExpansion,
  createScopeChangeOrder,
  runRevenueWarRoom,
} from '../db/services/founderWorkflowsService';
import type { ToolDefinition } from '../types';

export const AI_TOOL_DEFINITIONS: Array<{ type: 'function'; function: ToolDefinition }> = [
  // ==========================================
  // COMPANY & FINANCE READ TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getCompanyOverview',
      description: 'Get an executive high-level summary of company health: MRR, ARR, cash balance, runway, expenses, customers, open deals, and task counts.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRevenue',
      description: 'Retrieve revenue analytics, customer subscriptions, and total income.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Period filter, e.g. "this_month", "all_time"' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getExpenses',
      description: 'Retrieve detailed company expenses broken down by category (e.g. AI API, Cloud, Software, Marketing, Legal, etc.).',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Specific category to filter by (e.g. "AI API", "Cloud")' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProfit',
      description: 'Calculate net profit, profit margin percentage, total income vs expenses, and profitability status.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRunway',
      description: 'Calculate cash runway in months, monthly burn rate, cash reserves, and estimated runway exhaustion date.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCashPosition',
      description: 'Retrieve real-time cash balances across all connected bank and treasury accounts, liquid checking funds, and treasury yield.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRecentActivity',
      description: 'Retrieve recent company audit log events and operational changes.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of activity events to retrieve (max 50)' },
        },
      },
    },
  },

  // ==========================================
  // SALES & CUSTOMERS READ TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getCustomers',
      description: 'List company customers with filtering by status (active, lead, prospect, inactive, churned).',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'lead', 'prospect', 'inactive', 'churned', 'all'], description: 'Customer status filter' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCustomer',
      description: 'Get deep details for a specific customer including their deals and invoices.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Customer ID' },
          companyName: { type: 'string', description: 'Name of customer company' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCustomerHealth',
      description: 'Analyze customer accounts for health scores, churn risk, MRR concentration, and overdue payment status.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSalesPipeline',
      description: 'Retrieve sales pipeline breakdown by stages (Lead, Qualified, Demo, Proposal, Negotiation, Won, Lost), total pipeline value, and weighted expected revenue.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSalesForecast',
      description: 'Generate weighted sales forecast with expected close dates, high-confidence deals, and revenue projections.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // ==========================================
  // WORK, PROJECTS & GOALS READ TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getTasks',
      description: 'Retrieve tasks with optional status (todo, in_progress, done, blocked) or priority filters.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'done', 'all'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical', 'all'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getOverdueTasks',
      description: 'Get all active tasks that have passed their target due date.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProjects',
      description: 'Retrieve all strategic initiatives, progress percentages, priorities, and deadlines.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGoals',
      description: 'Retrieve company OKRs, targets, current progress, status, and deadlines.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDeadlines',
      description: 'Aggregate upcoming task, project, and goal deadlines chronologically for the next N days.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Number of days to look ahead (default: 14)' },
        },
      },
    },
  },

  // ==========================================
  // PRODUCT & ENGINEERING READ TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getFeatures',
      description: 'Retrieve product backlog features, status, and impact/effort scores.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBugs',
      description: 'Retrieve reported engineering bugs, severity levels, and resolution status.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductPriorities',
      description: 'Analyze feature backlog (high-impact / low-effort) and critical engineering bugs to recommend immediate build priorities.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProjectStatus',
      description: 'Get deep status and linked tasks, features, and bugs for a specific project.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          projectName: { type: 'string', description: 'Project Name' },
        },
      },
    },
  },

  // ==========================================
  // MANAGEMENT READ TOOLS
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getEmployees',
      description: 'List company team members, roles, salaries, and department assignments.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {
          departmentId: { type: 'string', description: 'Filter by department ID' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDepartments',
      description: 'List all company departments and their allocated budgets.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBalanceSheet',
      description: 'Retrieve assets, liabilities, and calculated company Net Worth.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reconcileFinances',
      description: 'Execute deep financial reconciliation: cross-audit invoices vs bank deposits, verify active customer MRR contracts vs ledger income, and detect duplicate charges or subscription anomalies.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // ==========================================
  // WRITE ACTIONS (EXPLICIT CONFIRMATION REQUIRED)
  // ==========================================
  // 1. createTask
  {
    type: 'function',
    function: {
      name: 'createTask',
      description: 'Create a new task in the local database. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Detailed task description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          estimatedMinutes: { type: 'number', description: 'Estimated time in minutes' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
  },
  // 2. updateTask
  {
    type: 'function',
    function: {
      name: 'updateTask',
      description: 'Update details or status of an existing task. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        },
        required: ['id'],
      },
    },
  },
  // 3. completeTask
  {
    type: 'function',
    function: {
      name: 'completeTask',
      description: 'Mark an existing task as completed (done). Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID to complete' },
        },
        required: ['id'],
      },
    },
  },
  // 4. createNote
  {
    type: 'function',
    function: {
      name: 'createNote',
      description: 'Save a strategy note or document. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          content: { type: 'string', description: 'Markdown body' },
          category: { type: 'string', description: 'Category' },
        },
        required: ['title', 'content'],
      },
    },
  },
  // 5. createProject
  {
    type: 'function',
    function: {
      name: 'createProject',
      description: 'Create a new strategic initiative/project. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          targetDate: { type: 'string', description: 'Target completion date in YYYY-MM-DD format' },
        },
        required: ['name'],
      },
    },
  },
  // 6. updateProject
  {
    type: 'function',
    function: {
      name: 'updateProject',
      description: 'Update project status, progress %, priority, or target date. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Project ID' },
          name: { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          status: { type: 'string', enum: ['planning', 'in_progress', 'paused', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          progress: { type: 'number', description: 'Progress percentage (0-100)' },
          targetDate: { type: 'string', description: 'Target date in YYYY-MM-DD format' },
        },
        required: ['id'],
      },
    },
  },
  // 7. createDeal
  {
    type: 'function',
    function: {
      name: 'createDeal',
      description: 'Create a new sales pipeline deal. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Deal name' },
          value: { type: 'number', description: 'Deal value in USD' },
          stage: { type: 'string', enum: ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
          probability: { type: 'number', description: 'Win probability percentage (0-100)' },
          customerId: { type: 'string', description: 'Associated customer ID' },
        },
        required: ['name', 'value'],
      },
    },
  },
  // 8. updateDeal
  {
    type: 'function',
    function: {
      name: 'updateDeal',
      description: 'Update stage, value, or probability of a deal. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Deal ID' },
          name: { type: 'string', description: 'Deal name' },
          value: { type: 'number', description: 'Deal value' },
          stage: { type: 'string', enum: ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
          probability: { type: 'number', description: 'Win probability percentage (0-100)' },
          expectedCloseDate: { type: 'string', description: 'Expected close date in YYYY-MM-DD format' },
        },
        required: ['id'],
      },
    },
  },
  // 9. updateCustomer
  {
    type: 'function',
    function: {
      name: 'updateCustomer',
      description: 'Update customer status, contact, plan, or MRR. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Customer ID' },
          companyName: { type: 'string', description: 'Company name' },
          contactName: { type: 'string', description: 'Contact name' },
          email: { type: 'string', description: 'Contact email' },
          status: { type: 'string', enum: ['lead', 'prospect', 'active', 'inactive', 'churned'] },
          monthlyRevenue: { type: 'number', description: 'Monthly revenue' },
          plan: { type: 'string', description: 'Plan tier' },
        },
        required: ['id'],
      },
    },
  },
  // 10. createGoal
  {
    type: 'function',
    function: {
      name: 'createGoal',
      description: 'Create a new company goal / OKR. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Goal title' },
          target: { type: 'number', description: 'Numeric target' },
          unit: { type: 'string', description: 'Target unit (e.g. $, customers, %)' },
          deadline: { type: 'string', description: 'Target deadline in YYYY-MM-DD format' },
        },
        required: ['title', 'target'],
      },
    },
  },
  // 11. updateGoal
  {
    type: 'function',
    function: {
      name: 'updateGoal',
      description: 'Update company goal progress, status, or target value. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Goal ID' },
          title: { type: 'string', description: 'Goal title' },
          currentValue: { type: 'number', description: 'Current achieved value' },
          target: { type: 'number', description: 'Target value' },
          status: { type: 'string', enum: ['on_track', 'at_risk', 'achieved', 'missed'] },
          deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format' },
        },
        required: ['id'],
      },
    },
  },
  // 12. createFeature
  {
    type: 'function',
    function: {
      name: 'createFeature',
      description: 'Add a new product feature idea to the backlog. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Feature title' },
          description: { type: 'string', description: 'Feature description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['title'],
      },
    },
  },
  // 13. updateFeature
  {
    type: 'function',
    function: {
      name: 'updateFeature',
      description: 'Update feature status (backlog, planned, in_progress, released), priority, or impact/effort. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Feature ID' },
          title: { type: 'string', description: 'Feature title' },
          status: { type: 'string', enum: ['backlog', 'planned', 'in_progress', 'released'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['id'],
      },
    },
  },
  // 14. createBug
  {
    type: 'function',
    function: {
      name: 'createBug',
      description: 'Report an engineering bug. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Bug title' },
          description: { type: 'string', description: 'Detailed bug description' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        },
        required: ['title'],
      },
    },
  },
  // 15. updateBug
  {
    type: 'function',
    function: {
      name: 'updateBug',
      description: 'Update bug status (reported, investigating, in_progress, resolved), severity, or priority. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bug ID' },
          title: { type: 'string', description: 'Bug title' },
          status: { type: 'string', enum: ['reported', 'investigating', 'in_progress', 'resolved'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        },
        required: ['id'],
      },
    },
  },
  // Additional safe write actions supported by system
  {
    type: 'function',
    function: {
      name: 'createCustomer',
      description: 'Add a new customer or lead to CRM. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Company name' },
          contactName: { type: 'string', description: 'Primary contact name' },
          email: { type: 'string', description: 'Email address' },
          status: { type: 'string', enum: ['lead', 'prospect', 'active', 'inactive', 'churned'] },
          monthlyRevenue: { type: 'number', description: 'Monthly revenue in USD' },
          plan: { type: 'string', description: 'Subscription plan tier' },
        },
        required: ['companyName', 'contactName', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateTaskStatus',
      description: 'Quickly change the execution status of a task. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'done'], description: 'New task status' },
        },
        required: ['id', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createEmployee',
      description: 'Add a new employee or contractor to company headcount. Requires user confirmation.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name' },
          email: { type: 'string', description: 'Work email' },
          role: { type: 'string', description: 'Job title / role' },
          salary: { type: 'number', description: 'Compensation amount' },
          employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contractor', 'advisor', 'intern'], description: 'Employment type' },
          departmentId: { type: 'string', description: 'Assigned department ID' },
        },
        required: ['name', 'email', 'role', 'salary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'onboardClientProject',
      description: 'Instant Client Deal Intake: Atomically provisions records across Customers CRM, Won Sales Deal, Finance Invoice, Deposit Transaction, Project Workspace, Milestone Tasks, Strategic Project Brief Note, and updates Revenue OKR Goal progress.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Client company or individual name' },
          contactName: { type: 'string', description: 'Primary client contact name' },
          email: { type: 'string', description: 'Contact email' },
          phone: { type: 'string', description: 'Phone number' },
          projectTitle: { type: 'string', description: 'Project or deliverable name (e.g. Website Design & Development)' },
          serviceCategory: { type: 'string', description: 'Category (e.g. Website Development, Mobile App, Consulting)' },
          totalDealValue: { type: 'number', description: 'Total agreed contract value in USD' },
          depositAmount: { type: 'number', description: 'Upfront deposit amount received or billed in USD' },
          targetDeliveryDate: { type: 'string', description: 'Target delivery deadline (YYYY-MM-DD)' },
          notes: { type: 'string', description: 'Scope summary and client requirements' },
        },
        required: ['companyName', 'projectTitle', 'totalDealValue'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mitigateCustomerRisk',
      description: 'Customer Churn Fire Drill: Atomically sets customer to at_risk, creates P0 Critical bug, schedules retention & tech hotfix tasks, and creates customer retention brief memo.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Customer company name' },
          customerId: { type: 'string', description: 'Optional customer ID' },
          issueDescription: { type: 'string', description: 'Summary of the blocker or complaint threatening churn' },
          monthlyRevenue: { type: 'number', description: 'Account MRR at risk in USD' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium'], description: 'Risk severity' },
          targetCallDate: { type: 'string', description: 'Target date for retention crisis call' },
        },
        required: ['companyName', 'issueDescription'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'onboardEmployee',
      description: 'Team Hire & Onboarding: Atomically creates employee directory profile, recurring monthly payroll expense, 5 onboarding checklist tasks, and 90-day role ramp goal.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Employee or contractor full name' },
          role: { type: 'string', description: 'Role / title (e.g. Full-Stack Engineer, Product Designer)' },
          departmentName: { type: 'string', description: 'Department name (e.g. Engineering, Sales, Product)' },
          monthlySalary: { type: 'number', description: 'Monthly compensation / salary in USD' },
          startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          customChecklist: { type: 'array', items: { type: 'string' }, description: 'Custom onboarding checklist items' },
        },
        required: ['name', 'role', 'monthlySalary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'launchFeatureSprint',
      description: 'Feature Spec to Sprint: Atomically adds roadmap feature, generates 4 technical subtasks, creates Mini-PRD with acceptance criteria in Notes, and links to target project.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Feature or capability name' },
          description: { type: 'string', description: 'User story or feature rationale' },
          projectName: { type: 'string', description: 'Target project name' },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          effort: { type: 'string', enum: ['high', 'medium', 'low'] },
          subtasks: { type: 'array', items: { type: 'string' }, description: 'Specific engineering subtask titles' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'auditVendorExpense',
      description: 'Vendor Expense & Runway Shield: Atomically logs recurring expense transaction, schedules 30-day renewal audit task, saves vendor record in Notes, and updates runway.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string', description: 'Vendor or SaaS product name (e.g. AWS, Figma, Google Workspace)' },
          monthlyCost: { type: 'number', description: 'Monthly subscription cost in USD' },
          category: { type: 'string', description: 'Expense category (e.g. software, cloud_hosting, legal)' },
          renewalCycle: { type: 'string', enum: ['monthly', 'annual'] },
          notes: { type: 'string', description: 'Contract details, seat count, or cancellation terms' },
        },
        required: ['vendorName', 'monthlyCost'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generateInvestorReport',
      description: 'Monthly Investor Update: Computes ground-truth MRR, Net Profit, Runway, Won Deals, and Shipped Features from IndexedDB, creates executive Investor Memo, and schedules follow-up tasks.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          monthYear: { type: 'string', description: 'Period label (e.g. September 2026)' },
          keyWins: { type: 'array', items: { type: 'string' }, description: 'Top accomplishments and milestones' },
          keyChallenges: { type: 'array', items: { type: 'string' }, description: 'Current obstacles or bottlenecks' },
          asks: { type: 'array', items: { type: 'string' }, description: 'Requests for investor introductions or advice' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reengageStalledDeals',
      description: 'Stalled Deal Win-Back: Re-activates dead/cold pipeline deals over a minimum value threshold, updates deal stages to Negotiation, schedules 48-hour follow-up tasks, and generates Win-Back Playbook.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          minValue: { type: 'number', description: 'Minimum deal value to target (default $1,500)' },
          incentiveType: { type: 'string', enum: ['discount', 'rush_delivery', 'extra_features'] },
          customNote: { type: 'string', description: 'Custom angle or offer' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recoverOverdueInvoices',
      description: 'Overdue Invoice Cash Recovery: Dispatches collection notices for unpaid invoices, updates customer payment tags, schedules bank wire verification tasks, and generates Receivables Recovery Audit.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          escalationLevel: { type: 'string', enum: ['friendly', 'firm', 'urgent'] },
          paymentPlanOffered: { type: 'boolean', description: 'Whether to propose 2-part installment plan' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'launchAccountExpansion',
      description: 'Customer Upsell & Expansion: Spawns high-margin expansion deal in Sales, creates 1-page Executive Retainer Proposal in Notes, tags customer for expansion, and sets founder pitch task.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Client name' },
          customerId: { type: 'string', description: 'Client ID' },
          proposedValue: { type: 'number', description: 'Proposed annual contract expansion value' },
          expansionType: { type: 'string', enum: ['sla_retainer', 'annual_upgrade', 'custom_tier'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createScopeChangeOrder',
      description: 'Scope-Creep Defense & Change Order: Generates formal Change Order Invoice, adjusts project timeline, freezes new scope in backlog pending sign-off, and writes 3-option counter-offer memo.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          requestedScope: { type: 'string', description: 'Client requested addition or change outside original contract' },
          chargeOrderFee: { type: 'number', description: 'Add-on fee in USD' },
          projectName: { type: 'string', description: 'Target project name' },
        },
        required: ['requestedScope'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'runRevenueWarRoom',
      description: 'Monday Revenue War Room: Synthesizes 360-degree company financial and operational health, pins Top 3 Founder Priority tasks with strict deadlines, and publishes executive brief.',
      category: 'write',
      parameters: {
        type: 'object',
        properties: {
          focusAreas: { type: 'array', items: { type: 'string' }, description: 'Specific areas of emphasis' },
        },
      },
    },
  },

  // ==========================================
  // DESTRUCTIVE TOOLS (REQUIRES STRONG CONFIRMATION)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'deleteCustomer',
      description: 'Delete a customer from CRM. High-risk destructive action requiring explicit confirmation.',
      category: 'destructive',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Customer ID to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteTask',
      description: 'Delete a task from task manager. High-risk destructive action requiring explicit confirmation.',
      category: 'destructive',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deleteTransaction',
      description: 'Delete a ledger transaction. High-risk destructive action requiring explicit confirmation.',
      category: 'destructive',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Transaction ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  // ==========================================
  // EXTERNAL INTEGRATIONS READ TOOLS (PHASE 10)
  // ==========================================
  {
    type: 'function',
    function: {
      name: 'getIntegrationStatus',
      description: 'Get status of external service integrations (GitHub, Google Calendar, Gmail, Stripe, Razorpay), connection health, and last sync timestamps.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGitHubActivity',
      description: 'Retrieve synchronized GitHub engineering activity: repositories, active pull requests, open issues, and recent commits. Distinguishes local vs synchronized external data.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCalendarSchedule',
      description: 'Retrieve synchronized Google Calendar schedule: today’s agenda, upcoming meetings, customer demos, and deadlines.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRecentEmails',
      description: 'Retrieve synchronized Gmail read-only inbox activity: recent important emails, senders, subjects, and dates.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPaymentSync',
      description: 'Retrieve synchronized payment records, customer subscription charges, and refund status from Stripe / Razorpay.',
      category: 'read',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// Helper to sanitize inputs
function sanitizeString(val: any): string {
  if (typeof val !== 'string') return '';
  return val.trim();
}

function sanitizeNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

// Local DB Tool Execution Handler with Strict Validation & Data Minimization
export async function executeLocalTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
  switch (toolName) {
    // ----------------------------------------------------
    // COMPANY & FINANCE READ
    // ----------------------------------------------------
    case 'getCompanyOverview': {
      const [company, finSummary, customers, deals, tasks, bugs] = await Promise.all([
        getCompany(),
        getFinancialSummary(),
        getAllCustomers(),
        getAllDeals(),
        getAllTasks(),
        getAllBugs(),
      ]);

      const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
      const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const openTasks = tasks.filter((t) => t.status !== 'done');
      const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'resolved');

      return {
        companyName: company?.name || 'My Startup',
        currency: company?.currency || 'USD',
        mrr: finSummary.mrr,
        arr: finSummary.arr,
        totalIncome: finSummary.totalIncome,
        totalExpenses: finSummary.totalExpenses,
        netProfit: finSummary.netProfit,
        estimatedCash: finSummary.estimatedCash,
        runwayMonths: finSummary.runwayMonths,
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c) => c.status === 'active').length,
        openDealsCount: openDeals.length,
        pipelineValue,
        openTasksCount: openTasks.length,
        criticalBugsCount: criticalBugs.length,
      };
    }

    case 'getRevenue': {
      const fin = await getFinancialSummary();
      const customers = await getAllCustomers();
      const activeCustomers = customers.filter((c) => c.status === 'active');
      return {
        mrr: fin.mrr,
        arr: fin.arr,
        totalIncome: fin.totalIncome,
        activeCustomersCount: activeCustomers.length,
        breakdownByCustomer: activeCustomers.map((c) => ({
          companyName: c.companyName,
          plan: c.plan,
          monthlyRevenue: c.monthlyRevenue,
        })),
      };
    }

    case 'getExpenses': {
      const fin = await getFinancialSummary();
      const txs = await getAllTransactions();
      const expenseTxs = txs.filter((t) => t.type === 'expense');

      const categoryFilter = sanitizeString(args?.category);
      if (categoryFilter) {
        const filtered = expenseTxs.filter((t) => t.category.toLowerCase() === categoryFilter.toLowerCase());
        const total = filtered.reduce((s, t) => s + t.amount, 0);
        return {
          category: categoryFilter,
          totalSpend: total,
          transactionCount: filtered.length,
          transactions: filtered.map((t) => ({ description: t.description, amount: t.amount, date: t.date, vendor: t.vendor })),
        };
      }

      return {
        totalExpenses: fin.totalExpenses,
        expensesByCategory: fin.expensesByCategory,
        recentExpenses: expenseTxs.slice(0, 10).map((t) => ({
          category: t.category,
          description: t.description,
          amount: t.amount,
          date: t.date,
          vendor: t.vendor,
        })),
      };
    }

    case 'getProfit': {
      const fin = await getFinancialSummary();
      const totalIncome = fin.totalIncome;
      const totalExpenses = fin.totalExpenses;
      const netProfit = fin.netProfit;
      const profitMarginPct = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 1000) / 10 : (netProfit > 0 ? 100 : 0);
      const isProfitable = netProfit > 0;

      return {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMarginPct,
        mrr: fin.mrr,
        status: isProfitable ? 'profitable' : netProfit === 0 ? 'breakeven' : 'operating_at_loss',
        monthlyBurn: Math.max(0, totalExpenses - fin.mrr),
      };
    }

    case 'getRunway': {
      const fin = await getFinancialSummary();
      const netMonthlyBurn = Math.max(0, fin.totalExpenses - fin.mrr);
      let zeroCashDate: string | null = null;
      if (netMonthlyBurn > 0 && fin.estimatedCash > 0) {
        const days = Math.round((fin.estimatedCash / netMonthlyBurn) * 30.4);
        const target = new Date();
        target.setDate(target.getDate() + days);
        zeroCashDate = target.toISOString().split('T')[0];
      }

      return {
        runwayMonths: fin.runwayMonths,
        estimatedCashBalance: fin.estimatedCash,
        monthlyExpenses: fin.totalExpenses,
        mrr: fin.mrr,
        netMonthlyBurn,
        projectedZeroCashDate: zeroCashDate,
        isInfiniteRunway: netMonthlyBurn === 0 && fin.estimatedCash > 0,
      };
    }

    case 'getCashPosition': {
      const cash = await getCashPositionSummary();
      return cash;
    }

    case 'getRecentActivity': {
      const limit = Math.min(50, Math.max(1, sanitizeNumber(args?.limit, 15)));
      const acts = await getRecentActivities(limit);
      return { activities: acts };
    }

    // ----------------------------------------------------
    // SALES & CUSTOMERS READ
    // ----------------------------------------------------
    case 'getCustomers': {
      let customers = await getAllCustomers();
      const statusFilter = sanitizeString(args?.status);
      if (statusFilter && statusFilter !== 'all') {
        customers = customers.filter((c) => c.status === statusFilter);
      }
      return {
        count: customers.length,
        customers: customers.map((c) => ({
          id: c.id,
          companyName: c.companyName,
          contactName: c.contactName,
          email: c.email,
          status: c.status,
          plan: c.plan,
          monthlyRevenue: c.monthlyRevenue,
          tags: c.tags,
        })),
      };
    }

    case 'getCustomer': {
      const customers = await getAllCustomers();
      const targetId = sanitizeString(args?.id);
      const targetName = sanitizeString(args?.companyName).toLowerCase();

      let customer = targetId ? customers.find((c) => c.id === targetId) : undefined;
      if (!customer && targetName) {
        customer = customers.find((c) => c.companyName.toLowerCase().includes(targetName));
      }
      if (!customer) return { error: `Customer not found matching query: ${JSON.stringify(args)}` };

      const [deals, invoices] = await Promise.all([
        db.deals.where('customerId').equals(customer.id).toArray(),
        db.invoices.where('customerId').equals(customer.id).toArray(),
      ]);

      return {
        customer,
        associatedDeals: deals,
        associatedInvoices: invoices,
      };
    }

    case 'getCustomerHealth': {
      const [customers, invoices] = await Promise.all([
        getAllCustomers(),
        getAllInvoices(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const overdueInvoices = invoices.filter((i) => i.status === 'sent' && i.dueDate < today);
      const overdueCustomerIds = new Set(overdueInvoices.map((i) => i.customerId).filter(Boolean));

      const totalMRR = customers.reduce((s, c) => s + (c.status === 'active' ? c.monthlyRevenue : 0), 0);

      const highRiskAccounts: any[] = [];
      const healthyAccounts: any[] = [];

      for (const c of customers) {
        const isOverdue = overdueCustomerIds.has(c.id);
        const mrrSharePct = totalMRR > 0 ? Math.round((c.monthlyRevenue / totalMRR) * 100) : 0;
        
        let riskScore = 0;
        const reasons: string[] = [];

        if (c.status === 'churned' || c.status === 'inactive') {
          riskScore += 50;
          reasons.push(`Account is marked as ${c.status}`);
        }
        if (isOverdue) {
          riskScore += 40;
          reasons.push('Has overdue outstanding invoice(s)');
        }
        if (mrrSharePct > 40) {
          reasons.push(`High MRR concentration risk (${mrrSharePct}% of total MRR)`);
        }

        const summary = {
          id: c.id,
          companyName: c.companyName,
          status: c.status,
          monthlyRevenue: c.monthlyRevenue,
          mrrSharePct,
          riskLevel: riskScore >= 40 ? 'high' : riskScore > 0 ? 'medium' : 'low',
          reasons,
        };

        if (summary.riskLevel !== 'low') {
          highRiskAccounts.push(summary);
        } else if (c.status === 'active') {
          healthyAccounts.push(summary);
        }
      }

      return {
        totalCustomers: customers.length,
        activeCustomersCount: customers.filter((c) => c.status === 'active').length,
        totalMRR,
        highRiskCount: highRiskAccounts.length,
        highRiskAccounts,
        healthyAccountsCount: healthyAccounts.length,
        overdueInvoicesCount: overdueInvoices.length,
      };
    }

    case 'getSalesPipeline': {
      const deals = await getAllDeals();
      const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
      const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedValue = Math.round(
        openDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0)) / 100, 0)
      );

      const stageBreakdown: Record<string, { count: number; totalValue: number }> = {};
      for (const d of deals) {
        if (!stageBreakdown[d.stage]) stageBreakdown[d.stage] = { count: 0, totalValue: 0 };
        stageBreakdown[d.stage].count += 1;
        stageBreakdown[d.stage].totalValue += d.value;
      }

      return {
        openDealsCount: openDeals.length,
        totalPipelineValue,
        weightedExpectedRevenue: weightedValue,
        stageBreakdown,
        deals: deals.map((d) => ({
          id: d.id,
          name: d.name,
          customerName: d.customerName,
          value: d.value,
          stage: d.stage,
          probability: d.probability,
          expectedCloseDate: d.expectedCloseDate,
        })),
      };
    }

    case 'getSalesForecast': {
      const deals = await getAllDeals();
      const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
      const wonDeals = deals.filter((d) => d.stage === 'Won');

      const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedForecast = Math.round(
        openDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0)) / 100, 0)
      );

      const highConfidenceDeals = openDeals.filter((d) => (d.probability || 0) >= 70);
      const negotiationDeals = openDeals.filter((d) => d.stage === 'Negotiation' || d.stage === 'Proposal');

      return {
        totalOpenDeals: openDeals.length,
        totalPipelineValue,
        weightedExpectedForecast: weightedForecast,
        wonRevenueToDate: wonDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        highConfidenceDeals: highConfidenceDeals.map((d) => ({
          id: d.id,
          name: d.name,
          customerName: d.customerName,
          value: d.value,
          probability: d.probability,
          expectedCloseDate: d.expectedCloseDate,
        })),
        dealsInClosingStages: negotiationDeals.map((d) => ({
          id: d.id,
          name: d.name,
          value: d.value,
          stage: d.stage,
          probability: d.probability,
        })),
      };
    }

    // ----------------------------------------------------
    // WORK, PROJECTS & GOALS READ
    // ----------------------------------------------------
    case 'getTasks': {
      let tasks = await getAllTasks();
      const statusFilter = sanitizeString(args?.status);
      const priorityFilter = sanitizeString(args?.priority);

      if (statusFilter && statusFilter !== 'all') {
        tasks = tasks.filter((t) => t.status === statusFilter);
      }
      if (priorityFilter && priorityFilter !== 'all') {
        tasks = tasks.filter((t) => t.priority === priorityFilter);
      }
      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          projectName: t.projectName,
          tags: t.tags,
        })),
      };
    }

    case 'getOverdueTasks': {
      const today = new Date().toISOString().split('T')[0];
      const tasks = await getAllTasks();
      const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today);
      return {
        count: overdue.length,
        overdueTasks: overdue.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          projectName: t.projectName,
        })),
      };
    }

    case 'getProjects': {
      const projects = await getAllProjects();
      return {
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          priority: p.priority,
          progress: p.progress,
          targetDate: p.targetDate,
        })),
      };
    }

    case 'getGoals': {
      const goals = await getAllGoals();
      return {
        count: goals.length,
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          target: g.target,
          currentValue: g.currentValue,
          unit: g.unit,
          status: g.status,
          deadline: g.deadline,
        })),
      };
    }

    case 'getDeadlines': {
      const daysAhead = Math.min(90, Math.max(1, sanitizeNumber(args?.daysAhead, 14)));
      const today = new Date();
      const cutoff = new Date();
      cutoff.setDate(today.getDate() + daysAhead);

      const todayStr = today.toISOString().split('T')[0];
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const [tasks, projects, goals] = await Promise.all([
        getAllTasks(),
        getAllProjects(),
        getAllGoals(),
      ]);

      const upcomingDeadlines: any[] = [];

      for (const t of tasks) {
        if (t.status !== 'done' && t.dueDate && t.dueDate >= todayStr && t.dueDate <= cutoffStr) {
          upcomingDeadlines.push({
            type: 'task',
            id: t.id,
            title: t.title,
            deadline: t.dueDate,
            priority: t.priority,
            status: t.status,
          });
        }
      }

      for (const p of projects) {
        if (p.status !== 'completed' && p.targetDate && p.targetDate >= todayStr && p.targetDate <= cutoffStr) {
          upcomingDeadlines.push({
            type: 'project',
            id: p.id,
            title: p.name,
            deadline: p.targetDate,
            priority: p.priority,
            status: p.status,
          });
        }
      }

      for (const g of goals) {
        if (g.status !== 'achieved' && g.deadline && g.deadline >= todayStr && g.deadline <= cutoffStr) {
          upcomingDeadlines.push({
            type: 'goal',
            id: g.id,
            title: g.title,
            deadline: g.deadline,
            progress: `${g.currentValue} / ${g.target} ${g.unit}`,
            status: g.status,
          });
        }
      }

      upcomingDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));

      return {
        lookaheadDays: daysAhead,
        totalUpcomingDeadlines: upcomingDeadlines.length,
        deadlines: upcomingDeadlines,
      };
    }

    // ----------------------------------------------------
    // PRODUCT & ENGINEERING READ
    // ----------------------------------------------------
    case 'getFeatures': {
      const features = await getAllFeatures();
      return {
        count: features.length,
        features: features.map((f) => ({
          id: f.id,
          title: f.title,
          status: f.status,
          priority: f.priority,
          impact: f.impact,
          effort: f.effort,
        })),
      };
    }

    case 'getBugs': {
      const bugs = await getAllBugs();
      return {
        count: bugs.length,
        bugs: bugs.map((b) => ({
          id: b.id,
          title: b.title,
          severity: b.severity,
          status: b.status,
          priority: b.priority,
        })),
      };
    }

    case 'getProductPriorities': {
      const [features, bugs] = await Promise.all([
        getAllFeatures(),
        getAllBugs(),
      ]);

      const openBugs = bugs.filter((b) => b.status !== 'resolved');
      const criticalBugs = openBugs.filter((b) => b.severity === 'critical');
      const highBugs = openBugs.filter((b) => b.severity === 'high');

      const backlogFeatures = features.filter((f) => f.status !== 'released');
      const quickWins = backlogFeatures.filter((f) => f.impact === 'high' && f.effort === 'low');
      const highImpactFeatures = backlogFeatures.filter((f) => f.impact === 'high' && f.effort !== 'low');

      return {
        criticalBugsCount: criticalBugs.length,
        criticalBugs: criticalBugs.map((b) => ({ id: b.id, title: b.title, severity: b.severity, status: b.status })),
        highBugsCount: highBugs.length,
        quickWinFeaturesCount: quickWins.length,
        quickWinFeatures: quickWins.map((f) => ({ id: f.id, title: f.title, impact: f.impact, effort: f.effort, priority: f.priority })),
        highImpactFeatures: highImpactFeatures.slice(0, 5).map((f) => ({ id: f.id, title: f.title, impact: f.impact, effort: f.effort })),
      };
    }

    case 'getProjectStatus': {
      const projects = await getAllProjects();
      const pId = sanitizeString(args?.projectId);
      const pName = sanitizeString(args?.projectName).toLowerCase();

      let project = pId ? projects.find((p) => p.id === pId) : undefined;
      if (!project && pName) {
        project = projects.find((p) => p.name.toLowerCase().includes(pName));
      }
      if (!project) return { error: `Project not found matching query: ${JSON.stringify(args)}` };

      const [tasks, features, bugs] = await Promise.all([
        db.tasks.where('projectId').equals(project.id).toArray(),
        db.features.where('projectId').equals(project.id).toArray(),
        db.bugs.where('projectId').equals(project.id).toArray(),
      ]);

      const completedTasks = tasks.filter((t) => t.status === 'done').length;
      const progressCalculated = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : project.progress;

      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          priority: project.priority,
          targetDate: project.targetDate,
          progress: progressCalculated,
        },
        linkedTasksCount: tasks.length,
        tasksCompleted: completedTasks,
        linkedFeaturesCount: features.length,
        linkedBugsCount: bugs.length,
        openBugs: bugs.filter((b) => b.status !== 'resolved').map((b) => ({ id: b.id, title: b.title, severity: b.severity })),
      };
    }

    // ----------------------------------------------------
    // MANAGEMENT READ
    // ----------------------------------------------------
    case 'getEmployees': {
      const employees = await getAllEmployees();
      const deptId = sanitizeString(args?.departmentId);
      const filtered = deptId ? employees.filter((e) => e.departmentId === deptId) : employees;
      return {
        totalHeadcount: filtered.length,
        employees: filtered.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
          departmentName: e.departmentName,
          salary: e.salary,
          salaryPeriod: e.salaryPeriod,
          status: e.status,
          employmentType: e.employmentType,
        })),
      };
    }

    case 'getDepartments': {
      const departments = await getAllDepartments();
      return {
        departmentsCount: departments.length,
        departments,
      };
    }

    case 'getBalanceSheet': {
      const balanceSheet = await getBalanceSheetSummary();
      return balanceSheet;
    }

    case 'reconcileFinances': {
      const summary = await runFinancialReconciliation();
      return summary;
    }

    // ----------------------------------------------------
    // WRITE ACTIONS (CONFIRMATION GATED)
    // ----------------------------------------------------
    // 1. createTask
    case 'createTask': {
      const title = sanitizeString(args.title);
      if (!title) throw new Error('Task title is required.');

      const task = await createTask({
        title,
        description: sanitizeString(args.description),
        priority: args.priority || 'medium',
        status: 'todo',
        dueDate: sanitizeString(args.dueDate) || undefined,
        estimatedMinutes: sanitizeNumber(args.estimatedMinutes) || undefined,
        tags: Array.isArray(args.tags) ? args.tags.map(sanitizeString).filter(Boolean) : [],
      });
      return { success: true, message: `Task "${task.title}" created successfully.`, task };
    }

    // 2. updateTask
    case 'updateTask': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Task ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.title) payload.title = sanitizeString(args.title);
      if (args.description !== undefined) payload.description = sanitizeString(args.description);
      if (args.status) payload.status = args.status;
      if (args.priority) payload.priority = args.priority;
      if (args.dueDate !== undefined) payload.dueDate = sanitizeString(args.dueDate);

      const updated = await updateTask(id, payload);
      return { success: true, message: `Task "${updated.title}" updated successfully.`, task: updated };
    }

    // 3. completeTask
    case 'completeTask': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Task ID is required to complete task.');

      const updated = await updateTask(id, { status: 'done' });
      return { success: true, message: `Task "${updated.title}" marked as completed.`, task: updated };
    }

    // 4. createNote
    case 'createNote': {
      const title = sanitizeString(args.title);
      const content = sanitizeString(args.content);
      if (!title || !content) throw new Error('Note title and content are required.');

      const note = await createNote({
        title,
        content,
        category: sanitizeString(args.category) || 'General',
        tags: [],
      });
      return { success: true, message: `Note "${note.title}" saved.`, note };
    }

    // 5. createProject
    case 'createProject': {
      const name = sanitizeString(args.name);
      if (!name) throw new Error('Project name is required.');

      const project = await createProject({
        name,
        description: sanitizeString(args.description),
        priority: args.priority || 'medium',
        status: 'planning',
        progress: 0,
        targetDate: sanitizeString(args.targetDate) || undefined,
      });
      return { success: true, message: `Project "${project.name}" created.`, project };
    }

    // 6. updateProject
    case 'updateProject': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Project ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.name) payload.name = sanitizeString(args.name);
      if (args.description !== undefined) payload.description = sanitizeString(args.description);
      if (args.status) payload.status = args.status;
      if (args.priority) payload.priority = args.priority;
      if (args.progress !== undefined) payload.progress = Math.min(100, Math.max(0, sanitizeNumber(args.progress)));
      if (args.targetDate !== undefined) payload.targetDate = sanitizeString(args.targetDate);

      const updated = await updateProject(id, payload);
      return { success: true, message: `Project "${updated.name}" updated.`, project: updated };
    }

    // 7. createDeal
    case 'createDeal': {
      const name = sanitizeString(args.name);
      const value = sanitizeNumber(args.value, 0);
      if (!name) throw new Error('Deal name is required.');

      const deal = await createDeal({
        name,
        value,
        currency: 'USD',
        stage: args.stage || 'Lead',
        probability: sanitizeNumber(args.probability, 50),
        customerId: sanitizeString(args.customerId) || undefined,
      });
      return { success: true, message: `Deal "${deal.name}" ($${deal.value}) created successfully.`, deal };
    }

    // 8. updateDeal
    case 'updateDeal': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Deal ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.name) payload.name = sanitizeString(args.name);
      if (args.value !== undefined) payload.value = sanitizeNumber(args.value);
      if (args.stage) payload.stage = args.stage;
      if (args.probability !== undefined) payload.probability = sanitizeNumber(args.probability);
      if (args.expectedCloseDate !== undefined) payload.expectedCloseDate = sanitizeString(args.expectedCloseDate);

      const updated = await updateDeal(id, payload);
      return { success: true, message: `Deal "${updated.name}" updated.`, deal: updated };
    }

    // 9. updateCustomer
    case 'updateCustomer': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Customer ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.companyName) payload.companyName = sanitizeString(args.companyName);
      if (args.contactName) payload.contactName = sanitizeString(args.contactName);
      if (args.email) payload.email = sanitizeString(args.email);
      if (args.status) payload.status = args.status;
      if (args.monthlyRevenue !== undefined) payload.monthlyRevenue = sanitizeNumber(args.monthlyRevenue);
      if (args.plan) payload.plan = sanitizeString(args.plan);

      const updated = await updateCustomer(id, payload);
      return { success: true, message: `Customer "${updated.companyName}" updated.`, customer: updated };
    }

    // 10. createGoal
    case 'createGoal': {
      const title = sanitizeString(args.title);
      const target = sanitizeNumber(args.target, 0);
      if (!title) throw new Error('Goal title is required.');

      const goal = await createGoal({
        title,
        target,
        currentValue: sanitizeNumber(args.currentValue, 0),
        unit: sanitizeString(args.unit) || '',
        period: (args.period || 'Q3') as any,
        status: 'on_track',
        deadline: sanitizeString(args.deadline) || undefined,
      });
      return { success: true, message: `Goal "${goal.title}" created.`, goal };
    }

    // 11. updateGoal
    case 'updateGoal': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Goal ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.title) payload.title = sanitizeString(args.title);
      if (args.target !== undefined) payload.target = sanitizeNumber(args.target);
      if (args.currentValue !== undefined) payload.currentValue = sanitizeNumber(args.currentValue);
      if (args.unit !== undefined) payload.unit = sanitizeString(args.unit);
      if (args.status) payload.status = args.status;
      if (args.deadline !== undefined) payload.deadline = sanitizeString(args.deadline);

      const updated = await updateGoal(id, payload);
      return { success: true, message: `Goal "${updated.title}" updated.`, goal: updated };
    }

    // 12. createFeature
    case 'createFeature': {
      const title = sanitizeString(args.title);
      if (!title) throw new Error('Feature title is required.');

      const feat = await createFeature({
        title,
        description: sanitizeString(args.description),
        status: 'backlog',
        priority: args.priority || 'medium',
        impact: args.impact || 'medium',
        effort: args.effort || 'medium',
      });
      return { success: true, message: `Feature "${feat.title}" added to backlog.`, feature: feat };
    }

    // 13. updateFeature
    case 'updateFeature': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Feature ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.title) payload.title = sanitizeString(args.title);
      if (args.description !== undefined) payload.description = sanitizeString(args.description);
      if (args.status) payload.status = args.status;
      if (args.priority) payload.priority = args.priority;
      if (args.impact) payload.impact = args.impact;
      if (args.effort) payload.effort = args.effort;

      const updated = await updateFeature(id, payload);
      return { success: true, message: `Feature "${updated.title}" updated.`, feature: updated };
    }

    // 14. createBug
    case 'createBug': {
      const title = sanitizeString(args.title);
      if (!title) throw new Error('Bug title is required.');

      const bug = await createBug({
        title,
        description: sanitizeString(args.description),
        status: 'reported',
        severity: args.severity || 'medium',
        priority: args.priority || 'medium',
      });
      return { success: true, message: `Bug "${bug.title}" reported.`, bug };
    }

    // 15. updateBug
    case 'updateBug': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Bug ID is required for update.');

      const payload: Record<string, any> = {};
      if (args.title) payload.title = sanitizeString(args.title);
      if (args.description !== undefined) payload.description = sanitizeString(args.description);
      if (args.status) payload.status = args.status;
      if (args.severity) payload.severity = args.severity;
      if (args.priority) payload.priority = args.priority;

      const updated = await updateBug(id, payload);
      return { success: true, message: `Bug "${updated.title}" updated.`, bug: updated };
    }

    // Additional write actions
    case 'updateTaskStatus': {
      const id = sanitizeString(args.id);
      const status = sanitizeString(args.status);
      if (!id || !status) throw new Error('Task ID and new status are required.');

      const updated = await updateTask(id, { status: status as any });
      return { success: true, message: `Task status updated to "${status}".`, task: updated };
    }

    case 'createCustomer': {
      const companyName = sanitizeString(args.companyName);
      const contactName = sanitizeString(args.contactName);
      const email = sanitizeString(args.email);
      if (!companyName || !contactName || !email) {
        throw new Error('companyName, contactName, and email are required to create a customer.');
      }

      const cust = await createCustomer({
        companyName,
        contactName,
        email,
        status: args.status || 'lead',
        monthlyRevenue: sanitizeNumber(args.monthlyRevenue, 0),
        plan: sanitizeString(args.plan) || 'Standard',
        tags: [],
      });
      return { success: true, message: `Customer "${cust.companyName}" created successfully.`, customer: cust };
    }

    case 'createEmployee': {
      const name = sanitizeString(args.name);
      const email = sanitizeString(args.email);
      const role = sanitizeString(args.role);
      const salary = sanitizeNumber(args.salary, 0);
      if (!name || !email || !role) throw new Error('Employee name, email, and role are required.');

      const emp = await createEmployee({
        name,
        email,
        role,
        salary,
        salaryPeriod: 'annual',
        currency: 'USD',
        status: 'active',
        employmentType: args.employmentType || 'full_time',
        departmentId: sanitizeString(args.departmentId) || undefined,
        startDate: new Date().toISOString().split('T')[0],
      });
      return { success: true, message: `Employee "${emp.name}" (${emp.role}) created.`, employee: emp };
    }

    // ----------------------------------------------------
    // DESTRUCTIVE TOOLS
    // ----------------------------------------------------
    case 'deleteCustomer': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Customer ID is required for deletion.');
      await deleteCustomer(id);
      return { success: true, message: `Customer permanently deleted.` };
    }

    case 'deleteTask': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Task ID is required for deletion.');
      await deleteTask(id);
      return { success: true, message: `Task permanently deleted.` };
    }

    case 'deleteTransaction': {
      const id = sanitizeString(args.id);
      if (!id) throw new Error('Transaction ID is required for deletion.');
      await deleteTransaction(id);
      return { success: true, message: `Transaction permanently deleted.` };
    }

    // ----------------------------------------------------
    // EXTERNAL INTEGRATIONS READ TOOLS (PHASE 10)
    // ----------------------------------------------------
    case 'getIntegrationStatus': {
      const health = await getOverallIntegrationsHealth();
      const list = await getAllIntegrations();
      return {
        source: 'LOCAL_INTEGRATION_REGISTRY',
        totalConfigured: health.totalCount,
        connectedIntegrationsCount: health.connectedCount,
        errorCount: health.errorCount,
        lastSyncTimestamp: health.lastSyncAt || 'Never',
        integrations: list.map((i) => ({
          name: i.name,
          provider: i.provider,
          status: i.status,
          requiresBackend: i.requiresBackend,
          accountLabel: i.accountLabel || 'None',
          lastSyncedAt: i.lastSyncedAt || 'Never',
          lastSyncStatus: i.lastSyncStatus || 'idle',
          itemsSyncedCount: i.syncStats?.totalItems || 0,
        })),
      };
    }

    case 'getGitHubActivity': {
      const ghIntegration = await db.integrations.get('github');
      const isConnected = ghIntegration?.status === 'connected';
      const items = await getExternalSyncItems({ provider: 'github' });
      const repos = items.filter((i) => i.itemType === 'repo');
      const issues = items.filter((i) => i.itemType === 'issue');
      const prs = items.filter((i) => i.itemType === 'pull_request');
      const commits = items.filter((i) => i.itemType === 'commit');

      return {
        source: 'SYNCHRONIZED_EXTERNAL_GITHUB',
        isConnected,
        lastSyncedAt: ghIntegration?.lastSyncedAt || 'Never',
        totalRepositories: repos.length,
        repositories: repos.map((r) => ({ name: r.title, description: r.summary, stars: r.metadata?.stars })),
        openPullRequestsCount: prs.filter((p) => p.status === 'open').length,
        pullRequests: prs.slice(0, 8).map((p) => ({ title: p.title, status: p.status, author: p.author, repo: p.metadata?.repo })),
        openIssuesCount: issues.filter((i) => i.status === 'open').length,
        issues: issues.slice(0, 8).map((i) => ({ title: i.title, status: i.status, author: i.author, repo: i.metadata?.repo })),
        recentCommitsCount: commits.length,
        recentCommits: commits.slice(0, 6).map((c) => ({ message: c.title, author: c.author, timestamp: c.timestamp })),
      };
    }

    case 'getCalendarSchedule': {
      const gcalIntegration = await db.integrations.get('google-calendar');
      const isConnected = gcalIntegration?.status === 'connected';
      const items = await getExternalSyncItems({ provider: 'google-calendar' });
      const todayStr = new Date().toISOString().split('T')[0];

      const todayEvents = items.filter((i) => i.timestamp && i.timestamp.startsWith(todayStr));
      const upcomingEvents = items.filter((i) => i.timestamp && i.timestamp > todayStr);

      return {
        source: 'SYNCHRONIZED_EXTERNAL_GOOGLE_CALENDAR',
        isConnected,
        lastSyncedAt: gcalIntegration?.lastSyncedAt || 'Never',
        todayMeetingsCount: todayEvents.length,
        todaySchedule: todayEvents.map((e) => ({
          title: e.title,
          startTime: e.metadata?.start,
          endTime: e.metadata?.end,
          meetLink: e.metadata?.meetLink || 'None',
          attendeesCount: e.metadata?.attendeesCount || 0,
        })),
        upcomingMeetings: upcomingEvents.slice(0, 6).map((e) => ({
          title: e.title,
          dateTime: e.timestamp,
        })),
      };
    }

    case 'getRecentEmails': {
      const gmailIntegration = await db.integrations.get('gmail');
      const isConnected = gmailIntegration?.status === 'connected';
      const items = await getExternalSyncItems({ provider: 'gmail' });

      const unread = items.filter((i) => i.status === 'unread' || i.metadata?.isUnread);
      const important = items.filter((i) => i.metadata?.isImportant);

      return {
        source: 'SYNCHRONIZED_EXTERNAL_GMAIL (READ_ONLY)',
        isConnected,
        lastSyncedAt: gmailIntegration?.lastSyncedAt || 'Never',
        totalRecentEmails: items.length,
        unreadEmailsCount: unread.length,
        importantEmailsCount: important.length,
        recentEmails: items.slice(0, 10).map((e) => ({
          subject: e.title,
          from: e.author,
          snippet: e.summary,
          timestamp: e.timestamp,
          isUnread: e.status === 'unread',
          isImportant: e.metadata?.isImportant || false,
        })),
      };
    }

    case 'getPaymentSync': {
      const stripe = await db.integrations.get('stripe');
      const razorpay = await db.integrations.get('razorpay');
      const isConnected = stripe?.status === 'connected' || razorpay?.status === 'connected';
      const payItems = await getExternalSyncItems({ itemType: 'payment' });
      const subItems = await getExternalSyncItems({ itemType: 'subscription' });
      const refundItems = await getExternalSyncItems({ itemType: 'refund' });

      const totalPaymentInflow = [...payItems, ...subItems].reduce((sum, i) => sum + (i.metadata?.amount || 0), 0);
      const totalRefunds = refundItems.reduce((sum, i) => sum + (i.metadata?.amount || 0), 0);

      return {
        source: 'SYNCHRONIZED_EXTERNAL_PAYMENTS',
        isConnected,
        stripeStatus: stripe?.status || 'disconnected',
        razorpayStatus: razorpay?.status || 'disconnected',
        totalPaymentInflow,
        totalRefunds,
        recentPayments: [...payItems, ...subItems].slice(0, 8).map((p) => ({
          title: p.title,
          amount: p.metadata?.amount,
          customer: p.author,
          timestamp: p.timestamp,
          status: p.status,
        })),
        recentRefunds: refundItems.map((r) => ({
          title: r.title,
          amount: r.metadata?.amount,
          customer: r.author,
          timestamp: r.timestamp,
        })),
      };
    }

    case 'onboardClientProject':
      return await onboardClientProject(args as any);

    case 'mitigateCustomerRisk':
      return await mitigateCustomerRisk(args as any);

    case 'onboardEmployee':
      return await onboardEmployee(args as any);

    case 'launchFeatureSprint':
      return await launchFeatureSprint(args as any);

    case 'auditVendorExpense':
      return await auditVendorExpense(args as any);

    case 'generateInvestorReport':
      return await generateInvestorReport(args as any);

    case 'reengageStalledDeals':
      return await reengageStalledDeals(args as any);

    case 'recoverOverdueInvoices':
      return await recoverOverdueInvoices(args as any);

    case 'launchAccountExpansion':
      return await launchAccountExpansion(args as any);

    case 'createScopeChangeOrder':
      return await createScopeChangeOrder(args as any);

    case 'runRevenueWarRoom':
      return await runRevenueWarRoom(args as any);

    default:
      throw new Error(`Tool "${toolName}" is not registered in the approved tool whitelist.`);
  }
}
