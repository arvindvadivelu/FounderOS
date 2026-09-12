import Dexie, { type Table } from 'dexie';
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
  AIConversation,
  AIMessage,
  Employee,
  Department,
  BankAccount,
  BalanceSheetItem,
  UploadedFile,
  IntegrationRecord,
  ExternalSyncItem,
  SyncLog,
  WorkflowRule,
  WorkflowExecutionLog,
  AgentDebateSession,
  ForecastScenario,
  HiringPlanRole,
  CustomerHealthMetric,
  AccountExpansionOpportunity,
  ProductRiceScore,
  FeedbackCluster,
  AutonomousRoutine,
  OperationalAnomaly,
  RoutineExecutionRecord,
  WebhookEventRecord,
} from '../types';

export class FounderOSDatabase extends Dexie {
  companies!: Table<Company, string>;
  customers!: Table<Customer, string>;
  deals!: Table<Deal, string>;
  transactions!: Table<Transaction, string>;
  invoices!: Table<Invoice, string>;
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  features!: Table<Feature, string>;
  bugs!: Table<Bug, string>;
  goals!: Table<Goal, string>;
  notes!: Table<Note, string>;
  activities!: Table<Activity, string>;
  settings!: Table<AppSettings, string>;
  aiProviders!: Table<AIProvider, string>;
  aiConversations!: Table<AIConversation, string>;
  aiMessages!: Table<AIMessage, string>;
  employees!: Table<Employee, string>;
  departments!: Table<Department, string>;
  bankAccounts!: Table<BankAccount, string>;
  balanceSheetItems!: Table<BalanceSheetItem, string>;
  uploadedFiles!: Table<UploadedFile, string>;
  integrations!: Table<IntegrationRecord, string>;
  externalSyncItems!: Table<ExternalSyncItem, string>;
  syncLogs!: Table<SyncLog, string>;
  workflows!: Table<WorkflowRule, string>;
  workflowLogs!: Table<WorkflowExecutionLog, string>;
  agentDebates!: Table<AgentDebateSession, string>;
  forecastScenarios!: Table<ForecastScenario, string>;
  hiringPlans!: Table<HiringPlanRole, string>;
  customerHealthScores!: Table<CustomerHealthMetric, string>;
  expansionOpportunities!: Table<AccountExpansionOpportunity, string>;
  productPriorities!: Table<ProductRiceScore, string>;
  feedbackClusters!: Table<FeedbackCluster, string>;
  autonomousRoutines!: Table<AutonomousRoutine, string>;
  anomalies!: Table<OperationalAnomaly, string>;
  routineLogs!: Table<RoutineExecutionRecord, string>;
  webhookEvents!: Table<WebhookEventRecord, string>;

  constructor() {
    super('FounderOS');
    
    // DB_VERSION = 1
    this.version(1).stores({
      companies: 'id, name, currency, createdAt',
      customers: 'id, companyName, status, plan, monthlyRevenue, lastActivityAt, createdAt',
      deals: 'id, customerId, stage, value, probability, expectedCloseDate, createdAt',
      transactions: 'id, type, category, date, amount, customerId, status, createdAt',
      invoices: 'id, customerId, invoiceNumber, status, issueDate, dueDate, createdAt',
      projects: 'id, status, priority, progress, targetDate, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, completedAt, createdAt',
      features: 'id, projectId, status, priority, impact, effort, createdAt',
      bugs: 'id, projectId, severity, status, priority, resolvedAt, createdAt',
      goals: 'id, period, status, target, currentValue, deadline, createdAt',
      notes: 'id, category, isPinned, createdAt, updatedAt',
      activities: 'id, entityType, entityId, timestamp',
      settings: 'id',
      aiProviders: 'id, type, isDefault, createdAt',
      aiConversations: 'id, providerId, createdAt, updatedAt',
      aiMessages: 'id, conversationId, role, createdAt',
    });

    // DB_VERSION = 2: Management Tables
    this.version(2).stores({
      companies: 'id, name, currency, createdAt',
      customers: 'id, companyName, status, plan, monthlyRevenue, lastActivityAt, createdAt',
      deals: 'id, customerId, stage, value, probability, expectedCloseDate, createdAt',
      transactions: 'id, type, category, date, amount, customerId, status, createdAt',
      invoices: 'id, customerId, invoiceNumber, status, issueDate, dueDate, createdAt',
      projects: 'id, status, priority, progress, targetDate, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, completedAt, createdAt',
      features: 'id, projectId, status, priority, impact, effort, createdAt',
      bugs: 'id, projectId, severity, status, priority, resolvedAt, createdAt',
      goals: 'id, period, status, target, currentValue, deadline, createdAt',
      notes: 'id, category, isPinned, createdAt, updatedAt',
      activities: 'id, entityType, entityId, timestamp',
      settings: 'id',
      aiProviders: 'id, type, isDefault, createdAt',
      aiConversations: 'id, providerId, createdAt, updatedAt',
      aiMessages: 'id, conversationId, role, createdAt',
      employees: 'id, departmentId, role, employmentType, status, startDate, createdAt',
      departments: 'id, name, headEmployeeId, createdAt',
      bankAccounts: 'id, accountName, institution, accountType, isPrimary, createdAt',
      balanceSheetItems: 'id, name, type, category, value, createdAt',
      uploadedFiles: 'id, name, fileType, category, sizeBytes, relatedEntityType, relatedEntityId, createdAt',
    });

    // DB_VERSION = 3: External Integrations & Sync Tables
    this.version(3).stores({
      companies: 'id, name, currency, createdAt',
      customers: 'id, companyName, status, plan, monthlyRevenue, lastActivityAt, createdAt',
      deals: 'id, customerId, stage, value, probability, expectedCloseDate, createdAt',
      transactions: 'id, type, category, date, amount, customerId, status, createdAt',
      invoices: 'id, customerId, invoiceNumber, status, issueDate, dueDate, createdAt',
      projects: 'id, status, priority, progress, targetDate, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, completedAt, createdAt',
      features: 'id, projectId, status, priority, impact, effort, createdAt',
      bugs: 'id, projectId, severity, status, priority, resolvedAt, createdAt',
      goals: 'id, period, status, target, currentValue, deadline, createdAt',
      notes: 'id, category, isPinned, createdAt, updatedAt',
      activities: 'id, entityType, entityId, timestamp',
      settings: 'id',
      aiProviders: 'id, type, isDefault, createdAt',
      aiConversations: 'id, providerId, createdAt, updatedAt',
      aiMessages: 'id, conversationId, role, createdAt',
      employees: 'id, departmentId, role, employmentType, status, startDate, createdAt',
      departments: 'id, name, headEmployeeId, createdAt',
      bankAccounts: 'id, accountName, institution, accountType, isPrimary, createdAt',
      balanceSheetItems: 'id, name, type, category, value, createdAt',
      uploadedFiles: 'id, name, fileType, category, sizeBytes, relatedEntityType, relatedEntityId, createdAt',
      integrations: 'id, provider, status, lastSyncedAt, createdAt',
      externalSyncItems: 'id, integrationId, provider, itemType, externalId, status, timestamp, lastSyncedAt',
      syncLogs: 'id, integrationId, provider, status, createdAt',
    });

    // DB_VERSION = 4: FounderOS V2 Core Systems
    this.version(4).stores({
      companies: 'id, name, currency, createdAt',
      customers: 'id, companyName, status, plan, monthlyRevenue, lastActivityAt, createdAt',
      deals: 'id, customerId, stage, value, probability, expectedCloseDate, createdAt',
      transactions: 'id, type, category, date, amount, customerId, status, createdAt',
      invoices: 'id, customerId, invoiceNumber, status, issueDate, dueDate, createdAt',
      projects: 'id, status, priority, progress, targetDate, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, completedAt, createdAt',
      features: 'id, projectId, status, priority, impact, effort, createdAt',
      bugs: 'id, projectId, severity, status, priority, resolvedAt, createdAt',
      goals: 'id, period, status, target, currentValue, deadline, createdAt',
      notes: 'id, category, isPinned, createdAt, updatedAt',
      activities: 'id, entityType, entityId, timestamp',
      settings: 'id',
      aiProviders: 'id, type, isDefault, createdAt',
      aiConversations: 'id, providerId, createdAt, updatedAt',
      aiMessages: 'id, conversationId, role, createdAt',
      employees: 'id, departmentId, role, employmentType, status, startDate, createdAt',
      departments: 'id, name, headEmployeeId, createdAt',
      bankAccounts: 'id, accountName, institution, accountType, isPrimary, createdAt',
      balanceSheetItems: 'id, name, type, category, value, createdAt',
      uploadedFiles: 'id, name, fileType, category, sizeBytes, relatedEntityType, relatedEntityId, createdAt',
      integrations: 'id, provider, status, lastSyncedAt, createdAt',
      externalSyncItems: 'id, integrationId, provider, itemType, externalId, status, timestamp, lastSyncedAt',
      syncLogs: 'id, integrationId, provider, status, createdAt',
      workflows: 'id, category, triggerType, isActive, createdAt',
      workflowLogs: 'id, workflowId, status, executedAt',
      agentDebates: 'id, status, createdAt',
      forecastScenarios: 'id, type, isDefault, createdAt',
      hiringPlans: 'id, department, status, priority, createdAt',
      customerHealthScores: 'id, customerId, quadrant, healthScore, churnRiskScore, updatedAt',
      expansionOpportunities: 'id, customerId, expansionType, confidencePct',
      productPriorities: 'id, featureId, quadrant, riceScore, status',
      feedbackClusters: 'id, topic, priority, sentiment',
      autonomousRoutines: 'id, category, timeSlot, isEnabled, lastStatus',
      anomalies: 'id, type, severity, resolved, detectedAt',
      routineLogs: 'id, routineId, status, executedAt',
      webhookEvents: 'id, provider, eventType, processed, receivedAt',
    });
  }
}

export const db = new FounderOSDatabase();
