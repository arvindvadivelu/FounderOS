import { db } from './db';
import type {
  Company,
  Customer,
  Deal,
  Transaction,
  Invoice,
  Project,
  Task,
  Feature,
  Bug,
  Goal,
  Note,
  Activity,
  AppSettings,
  AIProvider,
  Employee,
  Department,
  BankAccount,
  BalanceSheetItem,
  UploadedFile,
} from '../types';

export async function seedDemoData(): Promise<void> {
  const now = new Date();
  const isoNow = now.toISOString();

  // 1. Company
  const company: Company = {
    id: 'comp_default',
    name: 'Solvst AI',
    legalName: 'Solvst Technologies Inc.',
    description: 'Autonomous enterprise search & AI workflow orchestration platform.',
    website: 'https://solvst.ai',
    industry: 'Artificial Intelligence & SaaS',
    foundedDate: '2025-01-15',
    currency: 'USD',
    country: 'United States',
    timezone: 'America/New_York',
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 2. Customers
  const customers: Customer[] = [
    {
      id: 'cust_1',
      companyName: 'Acme Global Corp',
      contactName: 'Sarah Jenkins',
      email: 'sarah.j@acmeglobal.com',
      phone: '+1 (555) 234-5678',
      website: 'https://acmeglobal.com',
      status: 'active',
      plan: 'Enterprise Tier',
      monthlyRevenue: 4800,
      source: 'Inbound Demo',
      notes: 'Key enterprise account. Looking to expand seats next quarter.',
      tags: ['Enterprise', 'High-Touch', 'Multi-Region'],
      lastActivityAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'cust_2',
      companyName: 'Nexus BioHealth',
      contactName: 'Dr. Marcus Vance',
      email: 'mvance@nexusbio.io',
      phone: '+1 (555) 876-5432',
      website: 'https://nexusbio.io',
      status: 'active',
      plan: 'Growth Pro',
      monthlyRevenue: 2400,
      source: 'Referral',
      notes: 'HIPAA compliant deployment. Very satisfied with response latency.',
      tags: ['Healthcare', 'Security-Sensitive'],
      lastActivityAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'cust_3',
      companyName: 'HyperScale Labs',
      contactName: 'Elena Rostova',
      email: 'elena@hyperscalelabs.ai',
      status: 'active',
      plan: 'Growth Pro',
      monthlyRevenue: 2400,
      source: 'Product Hunt',
      tags: ['AI-Native', 'Fast Growth'],
      lastActivityAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'cust_4',
      companyName: 'FinVantage Group',
      contactName: 'David Chen',
      email: 'dchen@finvantage.co',
      status: 'prospect',
      plan: 'Enterprise Tier',
      monthlyRevenue: 0,
      source: 'Outbound',
      notes: 'Finalizing security questionnaire.',
      tags: ['Fintech', 'Pipeline'],
      lastActivityAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'cust_5',
      companyName: 'Veloce Logistics',
      contactName: 'Antonio Silva',
      email: 'antonio@velocelog.com',
      status: 'lead',
      monthlyRevenue: 0,
      source: 'LinkedIn Ad',
      tags: ['Logistics', 'Inbound'],
      lastActivityAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'cust_6',
      companyName: 'Krono Analytics',
      contactName: 'Rachel Green',
      email: 'rachel@krono.dev',
      status: 'inactive',
      plan: 'Starter Tier',
      monthlyRevenue: 490,
      source: 'Organic Search',
      notes: 'Needs feature parity with legacy tooling before renewing.',
      tags: ['At-Risk', 'Analytics'],
      lastActivityAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      updatedAt: isoNow,
    }
  ];

  // 3. Deals
  const deals: Deal[] = [
    {
      id: 'deal_1',
      customerId: 'cust_4',
      customerName: 'FinVantage Group',
      name: 'Enterprise Annual Pilot',
      value: 48000,
      currency: 'USD',
      stage: 'Negotiation',
      probability: 80,
      expectedCloseDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      source: 'Outbound',
      notes: 'Contract sent to legal team.',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'deal_2',
      customerId: 'cust_5',
      customerName: 'Veloce Logistics',
      name: 'Operations Copilot Integration',
      value: 18000,
      currency: 'USD',
      stage: 'Demo',
      probability: 50,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      source: 'LinkedIn Ad',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'deal_3',
      customerId: 'cust_1',
      customerName: 'Acme Global Corp',
      name: 'Acme Multi-Team Expansion',
      value: 36000,
      currency: 'USD',
      stage: 'Proposal',
      probability: 70,
      expectedCloseDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      source: 'Account Expansion',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'deal_4',
      name: 'Starlight Media Workflow',
      value: 12000,
      currency: 'USD',
      stage: 'Lead',
      probability: 20,
      expectedCloseDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      source: 'Website Contact',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'deal_5',
      customerId: 'cust_2',
      customerName: 'Nexus BioHealth',
      name: 'Initial BioHealth Deployment',
      value: 28800,
      currency: 'USD',
      stage: 'Won',
      probability: 100,
      source: 'Referral',
      createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    }
  ];

  // 4. Transactions (Income & Expenses)
  const transactions: Transaction[] = [
    // Income
    {
      id: 'tx_inc_1',
      type: 'income',
      category: 'Subscription',
      description: 'Acme Global Corp — Monthly Enterprise Retainer',
      amount: 4800,
      currency: 'USD',
      date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      customerId: 'cust_1',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_inc_2',
      type: 'income',
      category: 'Subscription',
      description: 'Nexus BioHealth — Growth Tier Monthly',
      amount: 2400,
      currency: 'USD',
      date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      customerId: 'cust_2',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_inc_3',
      type: 'income',
      category: 'Subscription',
      description: 'HyperScale Labs — Monthly Growth Plan',
      amount: 2400,
      currency: 'USD',
      date: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
      customerId: 'cust_3',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    // Expenses
    {
      id: 'tx_exp_1',
      type: 'expense',
      category: 'AI API',
      description: 'OpenRouter & Claude 3.7 Inference Tokens',
      amount: 1420,
      currency: 'USD',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      vendor: 'OpenRouter.ai',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_exp_2',
      type: 'expense',
      category: 'Cloud',
      description: 'AWS GPU Cluster & Aurora Vector DB',
      amount: 1850,
      currency: 'USD',
      date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      vendor: 'Amazon Web Services',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_exp_3',
      type: 'expense',
      category: 'Software',
      description: 'GitHub Enterprise, Vercel, Linear, Figma',
      amount: 320,
      currency: 'USD',
      date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      vendor: 'SaaS Tooling',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_exp_4',
      type: 'expense',
      category: 'Marketing',
      description: 'Sponsored Technical Deep Dives & Search Ads',
      amount: 850,
      currency: 'USD',
      date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      vendor: 'Google & Substack Ads',
      recurring: false,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'tx_exp_5',
      type: 'expense',
      category: 'Accounting',
      description: 'Pilot.com Monthly Bookkeeping & Tax Prep',
      amount: 450,
      currency: 'USD',
      date: new Date(Date.now() - 22 * 86400000).toISOString().split('T')[0],
      vendor: 'Pilot Inc.',
      recurring: true,
      status: 'cleared',
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 5. Invoices
  const invoices: Invoice[] = [
    {
      id: 'inv_101',
      customerId: 'cust_1',
      customerName: 'Acme Global Corp',
      invoiceNumber: 'INV-2026-001',
      issueDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      amount: 4800,
      currency: 'USD',
      status: 'paid',
      description: 'Enterprise Search Retainer (Month of August)',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'inv_102',
      customerId: 'cust_2',
      customerName: 'Nexus BioHealth',
      invoiceNumber: 'INV-2026-002',
      issueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      amount: 2400,
      currency: 'USD',
      status: 'sent',
      description: 'Growth Tier Platform Licensing',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'inv_103',
      customerId: 'cust_6',
      customerName: 'Krono Analytics',
      invoiceNumber: 'INV-2026-003',
      issueDate: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      amount: 490,
      currency: 'USD',
      status: 'overdue',
      description: 'Starter Platform Subscription',
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 6. Projects
  const projects: Project[] = [
    {
      id: 'proj_1',
      name: 'Agentic Workflow Orchestrator V2',
      description: 'Multi-step autonomous agent execution engine with tool-calling sandbox.',
      status: 'in_progress',
      priority: 'critical',
      startDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
      progress: 68,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'proj_2',
      name: 'SOC2 Type II Compliance & Audit',
      description: 'Security controls, audit logs, and vendor risk assessments for enterprise tier.',
      status: 'in_progress',
      priority: 'high',
      startDate: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      progress: 45,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'proj_3',
      name: 'Self-Serve Billing & Usage Metering',
      description: 'Stripe usage-based token metering and automatic threshold notifications.',
      status: 'planning',
      priority: 'medium',
      startDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 40 * 86400000).toISOString().split('T')[0],
      progress: 10,
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 7. Tasks
  const tasks: Task[] = [
    {
      id: 'task_1',
      title: 'Review and sign FinVantage Master Services Agreement',
      description: 'Coordinate with outside legal counsel on indemnification clause.',
      projectId: 'proj_2',
      projectName: 'SOC2 Type II Compliance',
      priority: 'critical',
      status: 'todo',
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      estimatedMinutes: 60,
      actualMinutes: 0,
      tags: ['Sales', 'Legal', 'High-Priority'],
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'task_2',
      title: 'Implement streaming tool execution response in Copilot',
      description: 'Stream intermediate tool call notifications while reasoning is running.',
      projectId: 'proj_1',
      projectName: 'Agentic Workflow Orchestrator V2',
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      estimatedMinutes: 180,
      actualMinutes: 90,
      tags: ['Engineering', 'AI'],
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'task_3',
      title: 'Follow up with Krono Analytics on overdue invoice',
      description: 'Send friendly reminder email to Rachel Green regarding INV-2026-003.',
      priority: 'medium',
      status: 'todo',
      dueDate: new Date(Date.now()).toISOString().split('T')[0],
      estimatedMinutes: 15,
      actualMinutes: 0,
      tags: ['Finance', 'Accounts Receivable'],
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'task_4',
      title: 'Fix token counting discrepancy for OpenRouter custom models',
      description: 'When usage metadata is omitted by provider, fallback to heuristic token estimation.',
      projectId: 'proj_1',
      projectName: 'Agentic Workflow Orchestrator V2',
      priority: 'high',
      status: 'done',
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      estimatedMinutes: 45,
      actualMinutes: 40,
      tags: ['Bugfix', 'AI'],
      createdAt: isoNow,
      updatedAt: isoNow,
      completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'task_5',
      title: 'Set up weekly automatic database backup reminder toast',
      description: 'Alert user if last backup was more than 7 days ago.',
      priority: 'low',
      status: 'done',
      estimatedMinutes: 30,
      actualMinutes: 25,
      tags: ['UX', 'Data Integrity'],
      createdAt: isoNow,
      updatedAt: isoNow,
      completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    }
  ];

  // 8. Features
  const features: Feature[] = [
    {
      id: 'feat_1',
      title: 'Real-time WebSocket event streaming',
      description: 'Push updates immediately when tasks or status transitions occur.',
      status: 'in_progress',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      projectId: 'proj_1',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'feat_2',
      title: 'Interactive RICE Prioritization Matrix',
      description: 'Dynamic scatter plot for feature scoring based on reach, impact, and effort.',
      status: 'planned',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'feat_3',
      title: 'Custom API Header Injection Sandbox',
      description: 'Allows founder to test enterprise proxy authorization headers in browser.',
      status: 'released',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 9. Bugs
  const bugs: Bug[] = [
    {
      id: 'bug_1',
      title: 'CORS rejection on non-compliant custom endpoints',
      description: 'UI should display clear diagnostic warning explaining browser CORS boundaries.',
      severity: 'medium',
      status: 'resolved',
      priority: 'high',
      environment: 'Browser / Frontend-Only',
      createdAt: isoNow,
      updatedAt: isoNow,
      resolvedAt: isoNow,
    },
    {
      id: 'bug_2',
      title: 'Kanban drag stutter on high-density task boards',
      description: 'Optimize React state updates when moving cards across columns.',
      severity: 'low',
      status: 'investigating',
      priority: 'medium',
      environment: 'Production UI',
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 10. Goals (OKRs)
  const goals: Goal[] = [
    {
      id: 'goal_1',
      title: 'Reach $25,000 Monthly Recurring Revenue',
      description: 'Scale from existing customer base and close enterprise pipeline.',
      period: 'Q1',
      target: 25000,
      currentValue: 10090,
      unit: '$',
      status: 'on_track',
      deadline: '2026-03-31',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'goal_2',
      title: 'Acquire 10 Active Enterprise Customers',
      description: 'Focus on high-ACV healthcare & fintech organizations.',
      period: 'Annual',
      target: 10,
      currentValue: 3,
      unit: 'customers',
      status: 'on_track',
      deadline: '2026-12-31',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'goal_3',
      title: 'Keep AI Inference Cost Under 20% of MRR',
      description: 'Optimize prompt caching and route simple queries to smaller models.',
      period: 'Monthly',
      target: 20,
      currentValue: 14,
      unit: '%',
      status: 'achieved',
      deadline: '2026-04-30',
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 11. Notes
  const notes: Note[] = [
    {
      id: 'note_1',
      title: 'Founder Strategy & 2026 Focus Areas',
      content: `# 2026 Operating Principles\n\n1. **High Leverage via Autonomous Systems**: Automate manual company reporting, triage, and task tracking.\n2. **Extreme Product Quality**: Prioritize polish and zero latency over speculative features.\n3. **Financial Discipline**: Maintain a minimum of 18 months runway at all times.\n\n### Key Milestones\n- Close FinVantage Enterprise Pilot ($48k ACV)\n- Ship Orchestrator V2\n- Complete SOC2 compliance`,
      category: 'Strategy',
      tags: ['Vision', 'Founder', 'Priorities'],
      isPinned: true,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'note_2',
      title: 'Enterprise Security FAQs for Prospects',
      content: `# Security & Data Privacy Guidelines\n\n- All data is encrypted in transit and at rest.\n- No customer proprietary data is used for model training.\n- Local-first architecture guarantees zero server-side credential leakage.\n- Single-tenant on-prem or private VPC deployments available.`,
      category: 'Sales',
      tags: ['Sales-Enablement', 'Security'],
      isPinned: false,
      createdAt: isoNow,
      updatedAt: isoNow,
    }
  ];

  // 12. Activities
  const activities: Activity[] = [
    {
      id: 'act_1',
      action: 'created_task',
      entityType: 'task',
      entityId: 'task_1',
      title: 'Created critical task "Review and sign FinVantage MSA"',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: 'act_2',
      action: 'received_payment',
      entityType: 'invoice',
      entityId: 'inv_101',
      title: 'Marked invoice INV-2026-001 ($4,800) as paid by Acme Global Corp',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'act_3',
      action: 'updated_deal',
      entityType: 'deal',
      entityId: 'deal_1',
      title: 'Moved deal "FinVantage Enterprise Pilot" to Negotiation stage (80% probability)',
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: 'act_4',
      action: 'completed_task',
      entityType: 'task',
      entityId: 'task_4',
      title: 'Completed task "Fix token counting discrepancy for OpenRouter custom models"',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    }
  ];

  // 13. Settings
  const settings: AppSettings = {
    id: 'singleton',
    theme: 'dark',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'YYYY-MM-DD',
    defaultAIProvider: 'provider_openrouter',
    defaultAIModel: 'anthropic/claude-3.7-sonnet',
    lastBackupAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    demoLoaded: true,
  };

  // 14. Default AI Provider (Template)
  const defaultProvider: AIProvider = {
    id: 'provider_openrouter',
    name: 'OpenRouter (Default)',
    type: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '', // User will enter their key
    model: 'anthropic/claude-3.7-sonnet',
    temperature: 0.2,
    maxTokens: 4096,
    isDefault: true,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 14. Departments
  const departments: Department[] = [
    {
      id: 'dept_eng',
      name: 'Engineering & Infrastructure',
      description: 'Core product architecture, AI function calling pipelines, and distributed vector database indexing.',
      headEmployeeName: 'Alex Mercer',
      budget: 180000,
      currency: 'USD',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'dept_prod',
      name: 'Product & Design',
      description: 'UX/UI design system, customer feedback loops, and feature roadmap execution.',
      headEmployeeName: 'Sophia Lin',
      budget: 120000,
      currency: 'USD',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'dept_gtm',
      name: 'Sales & Growth',
      description: 'Enterprise pipeline, customer success, partner integrations, and developer marketing.',
      headEmployeeName: 'David K.',
      budget: 150000,
      currency: 'USD',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
  ];

  // 15. Employees
  const employees: Employee[] = [
    {
      id: 'emp_1',
      name: 'Alex Mercer',
      email: 'alex.mercer@solvst.ai',
      phone: '+1 (555) 321-7890',
      departmentId: 'dept_eng',
      departmentName: 'Engineering & Infrastructure',
      role: 'Founding AI Engineer',
      employmentType: 'full_time',
      salary: 145000,
      salaryPeriod: 'annual',
      currency: 'USD',
      status: 'active',
      startDate: '2025-01-15',
      notes: 'Key engineer leading function calling runtime and local Dexie persistence.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'emp_2',
      name: 'Sophia Lin',
      email: 'sophia.lin@solvst.ai',
      phone: '+1 (555) 432-8901',
      departmentId: 'dept_prod',
      departmentName: 'Product & Design',
      role: 'Staff Product Designer',
      employmentType: 'full_time',
      salary: 130000,
      salaryPeriod: 'annual',
      currency: 'USD',
      status: 'active',
      startDate: '2025-02-01',
      notes: 'Lead designer behind the Solvst Dark Canvas glassmorphic design language.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'emp_3',
      name: 'David K.',
      email: 'david.k@solvst.ai',
      phone: '+1 (555) 654-0987',
      departmentId: 'dept_gtm',
      departmentName: 'Sales & Growth',
      role: 'GTM & Enterprise Account Lead',
      employmentType: 'full_time',
      salary: 110000,
      salaryPeriod: 'annual',
      currency: 'USD',
      status: 'active',
      startDate: '2025-03-01',
      notes: 'Closed Acme Global and managing active pilot negotiations.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'emp_4',
      name: 'Liam Gallagher',
      email: 'liam@cloudscale.consulting',
      departmentId: 'dept_eng',
      departmentName: 'Engineering & Infrastructure',
      role: 'DevOps & SRE Specialist',
      employmentType: 'contractor',
      salary: 6500,
      salaryPeriod: 'monthly',
      currency: 'USD',
      status: 'active',
      startDate: '2025-04-10',
      notes: '20 hrs/week contractor managing cloud security and Netlify CI/CD pipelines.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
  ];

  // 16. Bank & Treasury Accounts
  const bankAccounts: BankAccount[] = [
    {
      id: 'acc_svb',
      accountName: 'Operating Checking',
      institution: 'Silicon Valley Bank (First Citizens)',
      accountNumberMask: '•••• 4821',
      accountType: 'checking',
      balance: 94500,
      currency: 'USD',
      isPrimary: true,
      lastReconciledAt: isoNow,
      notes: 'Main payroll and operational clearing account.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'acc_mercury',
      accountName: 'Treasury Reserves',
      institution: 'Mercury Bank (Apex Clearing)',
      accountNumberMask: '•••• 9102',
      accountType: 'treasury',
      balance: 55000,
      currency: 'USD',
      apy: 5.15,
      isPrimary: false,
      lastReconciledAt: isoNow,
      notes: 'Short-term US Treasury Bills yielding 5.15% APY.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'acc_stripe',
      accountName: 'Stripe Settlement Escrow',
      institution: 'Stripe Inc.',
      accountNumberMask: 'acct_19Xk82',
      accountType: 'stripe',
      balance: 4710,
      currency: 'USD',
      isPrimary: false,
      lastReconciledAt: isoNow,
      notes: 'Automated 2-day rolling customer subscription payouts.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
  ];

  // 17. Balance Sheet Items (Assets & Liabilities)
  const balanceSheetItems: BalanceSheetItem[] = [
    {
      id: 'bs_ar',
      name: 'Accounts Receivable (Open Customer Invoices)',
      type: 'asset',
      category: 'current_asset',
      value: 8400,
      currency: 'USD',
      acquisitionDate: '2025-09-01',
      notes: 'Outstanding billed receivables from enterprise pilots.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'bs_hardware',
      name: 'MacBook Pro M3 Max Fleet & GPU Hardware',
      type: 'asset',
      category: 'fixed_asset',
      value: 18500,
      currency: 'USD',
      acquisitionDate: '2025-01-20',
      depreciationRateAnnual: 20,
      notes: 'Development workstations and edge inference test rigs.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'bs_ip',
      name: 'Core AI Search Intellectual Property & Copyright',
      type: 'asset',
      category: 'intangible_asset',
      value: 250000,
      currency: 'USD',
      acquisitionDate: '2025-01-15',
      notes: 'Registered proprietary software algorithms and brand trademarks.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'bs_ap',
      name: 'Accounts Payable (Cloud & Tooling Accruals)',
      type: 'liability',
      category: 'current_liability',
      value: 4890,
      currency: 'USD',
      creditorOrVendor: 'Various SaaS Providers',
      notes: 'Current month accrued SaaS and API balances.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'bs_safe',
      name: 'Founder Pre-Seed SAFE (Post-Money)',
      type: 'liability',
      category: 'long_term_liability',
      value: 100000,
      currency: 'USD',
      creditorOrVendor: 'Angel Syndicate Partners',
      notes: 'Post-money SAFE at $8M valuation cap.',
      createdAt: isoNow,
      updatedAt: isoNow,
    },
  ];

  // 18. Sample Uploaded Files (Local-first Base64 documents)
  const uploadedFiles: UploadedFile[] = [
    {
      id: 'file_1',
      name: 'Delaware_Certificate_of_Incorporation.pdf',
      fileType: 'pdf',
      category: 'legal',
      sizeBytes: 245760,
      mimeType: 'application/pdf',
      dataBase64: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKENlcnRpZmljYXRlIG9mIEluY29ycG9yYXRpb24pCi9Qcm9kdWNlciAoU29sdnN0IEFJKQo+PgplbmRvYmoK',
      description: 'Official State of Delaware Certificate of Incorporation for Solvst Technologies Inc.',
      relatedEntityType: 'general',
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'file_2',
      name: 'Acme_Global_Signed_Enterprise_MSA.pdf',
      fileType: 'pdf',
      category: 'contract',
      sizeBytes: 512000,
      mimeType: 'application/pdf',
      dataBase64: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKE1hc3RlciBTZXJ2aWNlcyBBZ3JlZW1lbnQpCj4+CmVuZG9iago=',
      description: 'Fully executed 12-month Enterprise MSA with Acme Global Corp ($4,800/mo).',
      relatedEntityType: 'customer',
      relatedEntityId: 'cust_1',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
    {
      id: 'file_3',
      name: 'Solvst_Seed_Deck_v4_Confidential.pdf',
      fileType: 'pdf',
      category: 'pitch_deck',
      sizeBytes: 1820000,
      mimeType: 'application/pdf',
      dataBase64: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKFNvbHZzdCBTZWVkIERlY2spCj4+CmVuZG9iago=',
      description: 'Confidential founder pitch deck detailing AI agentic company automation.',
      relatedEntityType: 'general',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: isoNow,
    },
  ];

  // Perform transaction insertion into Dexie
  await db.transaction('rw', db.tables, async () => {
    await db.companies.clear();
    await db.customers.clear();
    await db.deals.clear();
    await db.transactions.clear();
    await db.invoices.clear();
    await db.projects.clear();
    await db.tasks.clear();
    await db.features.clear();
    await db.bugs.clear();
    await db.goals.clear();
    await db.notes.clear();
    await db.activities.clear();
    await db.settings.clear();
    await db.aiProviders.clear();
    await db.employees.clear();
    await db.departments.clear();
    await db.bankAccounts.clear();
    await db.balanceSheetItems.clear();
    await db.uploadedFiles.clear();

    await db.companies.put(company);
    await db.customers.bulkPut(customers);
    await db.deals.bulkPut(deals);
    await db.transactions.bulkPut(transactions);
    await db.invoices.bulkPut(invoices);
    await db.projects.bulkPut(projects);
    await db.tasks.bulkPut(tasks);
    await db.features.bulkPut(features);
    await db.bugs.bulkPut(bugs);
    await db.goals.bulkPut(goals);
    await db.notes.bulkPut(notes);
    await db.activities.bulkPut(activities);
    await db.settings.put(settings);
    await db.aiProviders.put(defaultProvider);
    await db.departments.bulkPut(departments);
    await db.employees.bulkPut(employees);
    await db.bankAccounts.bulkPut(bankAccounts);
    await db.balanceSheetItems.bulkPut(balanceSheetItems);
    await db.uploadedFiles.bulkPut(uploadedFiles);
  });
}

export async function clearAllCompanyData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await db.companies.clear();
    await db.customers.clear();
    await db.deals.clear();
    await db.transactions.clear();
    await db.invoices.clear();
    await db.projects.clear();
    await db.tasks.clear();
    await db.features.clear();
    await db.bugs.clear();
    await db.goals.clear();
    await db.notes.clear();
    await db.activities.clear();
    await db.aiConversations.clear();
    await db.aiMessages.clear();
    await db.employees.clear();
    await db.departments.clear();
    await db.bankAccounts.clear();
    await db.balanceSheetItems.clear();
    await db.uploadedFiles.clear();
    
    // Reset settings to fresh clean singleton
    await db.settings.clear();
    await db.settings.put({
      id: 'singleton',
      theme: 'dark',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      demoLoaded: false,
    });
  });
}

/**
 * Initializes a clean, empty workspace for fresh users.
 * Does NOT populate any demo company, customers, deals, tasks, or transactions.
 */
export async function initFreshDatabase(): Promise<void> {
  // Purge any legacy pre-loaded demo company records or unpurged demo data
  const demoCompany = await db.companies.get('comp_default');
  const hasPurgedFlag = typeof localStorage !== 'undefined' ? localStorage.getItem('founderos_preloaded_purged_v2') : 'true';

  if (demoCompany || !hasPurgedFlag) {
    await clearAllCompanyData();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('founderos_preloaded_purged_v2', 'true');
    }
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({
      id: 'singleton',
      theme: 'dark',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      demoLoaded: false,
    });
  }

  const providersCount = await db.aiProviders.count();
  if (providersCount === 0) {
    await db.aiProviders.put({
      id: 'provider_openrouter',
      name: 'OpenRouter (Default)',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
      maxTokens: 4096,
      customHeaders: {},
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
