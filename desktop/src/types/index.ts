// ==========================================
// FounderOS — Domain Types & Interfaces
// ==========================================

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'SGD' | 'JPY';

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  description?: string;
  website?: string;
  industry?: string;
  foundedDate?: string;
  currency: Currency;
  country?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned' | 'at_risk';

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  status: CustomerStatus;
  plan?: string;
  monthlyRevenue: number;
  source?: string;
  notes?: string;
  tags: string[];
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'Lead' | 'Qualified' | 'Demo' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Deal {
  id: string;
  customerId?: string;
  customerName?: string;
  name: string;
  value: number;
  currency: Currency;
  stage: DealStage;
  probability: number; // 0 to 100%
  expectedCloseDate?: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'AI API'
  | 'Cloud'
  | 'Software'
  | 'Marketing'
  | 'Hardware'
  | 'Legal'
  | 'Accounting'
  | 'Travel'
  | 'Office'
  | 'Salary'
  | 'Subscription'
  | 'Contractor'
  | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory | string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  vendor?: string;
  customerId?: string;
  recurring: boolean;
  status: 'cleared' | 'pending';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  customerId: string;
  customerName?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  targetDate?: string;
  progress: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type FeatureStatus = 'idea' | 'backlog' | 'planned' | 'in_progress' | 'testing' | 'released' | 'cancelled';

export interface Feature {
  id: string;
  title: string;
  description?: string;
  status: FeatureStatus;
  priority: Priority;
  impact: 'low' | 'medium' | 'high'; // ICE / RICE
  effort: 'low' | 'medium' | 'high';
  source?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'reported' | 'investigating' | 'in_progress' | 'resolved' | 'wont_fix';

export interface Bug {
  id: string;
  title: string;
  description?: string;
  severity: BugSeverity;
  status: BugStatus;
  priority: Priority;
  environment?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual' | 'Monthly';
  target: number;
  currentValue: number;
  unit: string; // '$', 'customers', 'users', '%', etc.
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Management Types & Interfaces
// ==========================================

export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'advisor' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
  role: string;
  employmentType: EmploymentType;
  salary: number;
  salaryPeriod: 'annual' | 'monthly' | 'hourly';
  currency: Currency;
  status: EmployeeStatus;
  startDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  budget: number;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

export type BankAccountType = 'checking' | 'savings' | 'treasury' | 'stripe' | 'paypal' | 'other';

export interface BankAccount {
  id: string;
  accountName: string;
  institution: string;
  accountNumberMask: string;
  accountType: BankAccountType;
  balance: number;
  currency: Currency;
  apy?: number;
  isPrimary: boolean;
  lastReconciledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BalanceSheetCategory =
  | 'current_asset'
  | 'fixed_asset'
  | 'intangible_asset'
  | 'current_liability'
  | 'long_term_liability';

export interface BalanceSheetItem {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  category: BalanceSheetCategory;
  value: number;
  currency: Currency;
  acquisitionDate?: string;
  depreciationRateAnnual?: number;
  interestRateAnnual?: number;
  creditorOrVendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UploadCategory =
  | 'receipt'
  | 'invoice'
  | 'contract'
  | 'nda'
  | 'pitch_deck'
  | 'legal'
  | 'tax'
  | 'other';

export interface UploadedFile {
  id: string;
  name: string;
  fileType: string;
  category: UploadCategory;
  sizeBytes: number;
  mimeType: string;
  dataBase64: string;
  description?: string;
  relatedEntityType?: 'customer' | 'transaction' | 'invoice' | 'employee' | 'project' | 'general';
  relatedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationDiscrepancy {
  id: string;
  type: 'invoice_match' | 'unlinked_payment' | 'mrr_discrepancy' | 'duplicate_risk' | 'subscription_anomaly';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  amount?: number;
  autoFixAvailable?: boolean;
  suggestedAction: string;
  suggestedFixPayload?: Record<string, any>;
  isResolved?: boolean;
}

export interface ReconciliationSummary {
  auditDate: string;
  lastAuditedAt: string;
  healthScore: number;
  totalTransactionsChecked: number;
  totalInvoicesChecked: number;
  totalInvoicesCount: number;
  matchedInvoicesCount: number;
  unlinkedIncomeCount: number;
  unlinkedExpenseCount: number;
  unreconciledAmount: number;
  discrepancies: ReconciliationDiscrepancy[];
  recommendations: string[];
}

export interface Activity {
  id: string;
  action: string;
  entityType: 'customer' | 'deal' | 'transaction' | 'invoice' | 'project' | 'task' | 'feature' | 'bug' | 'goal' | 'note' | 'employee' | 'department' | 'bank_account' | 'balance_sheet' | 'file' | 'system';
  entityId?: string;
  title: string;
  details?: string;
  timestamp: string;
}

export interface AppSettings {
  id: 'singleton';
  theme: 'dark' | 'light';
  currency: Currency;
  timezone: string;
  dateFormat: string;
  defaultAIProvider?: string;
  defaultAIModel?: string;
  lastBackupAt?: string;
  demoLoaded?: boolean;
}

// ==========================================
// AI Types & Interfaces
// ==========================================

export type AIProviderType = 'openrouter' | 'openai-compatible' | 'custom';

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  organizationId?: string;
  temperature: number;
  maxTokens?: number;
  customHeaders?: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  providerId?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: AIToolCall[];
  toolName?: string;
  metadata?: {
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    durationMs?: number;
    estimatedCost?: number;
    dataSources?: string[];
  };
  createdAt: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status?: 'pending_confirmation' | 'approved' | 'rejected' | 'executed' | 'cancelled' | 'error' | 'undone';
  result?: any;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'read' | 'write' | 'destructive';
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  company: Company | null;
  customers: Customer[];
  deals: Deal[];
  transactions: Transaction[];
  invoices: Invoice[];
  projects: Project[];
  tasks: Task[];
  features: Feature[];
  bugs: Bug[];
  goals: Goal[];
  notes: Note[];
  activities: Activity[];
  employees?: Employee[];
  departments?: Department[];
  bankAccounts?: BankAccount[];
  balanceSheetItems?: BalanceSheetItem[];
  uploadedFiles?: UploadedFile[];
  aiProviders?: AIProvider[];
  aiConversations: AIConversation[];
  aiMessages?: AIMessage[];
  settings: AppSettings;
}

// ==========================================
// Data Health & Integrity Types
// ==========================================
export type DataHealthStatus = 'healthy' | 'warning' | 'error';

export interface DataAnomaly {
  id: string;
  type: 'orphan' | 'duplicate' | 'missing_field' | 'invalid_state' | 'invariant_warning';
  entity: string;
  recordId?: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  autoFixable?: boolean;
}

export interface EntityRecordCount {
  entity: string;
  tableName: string;
  count: number;
  category: 'Core' | 'Business' | 'Product' | 'Execution' | 'Management' | 'AI & System';
}

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  persisted: boolean;
}

export interface DataHealthReport {
  status: DataHealthStatus;
  healthScore: number; // 0 - 100
  databaseName: string;
  schemaVersion: number;
  migrationStatus: string;
  totalRecords: number;
  entityCounts: EntityRecordCount[];
  storage: StorageEstimateInfo | null;
  lastBackupAt?: string;
  lastRestoreStatus?: string;
  anomalies: DataAnomaly[];
  checkedAt: string;
}

// ==========================================
// AI Actions & Verification Preview Types
// ==========================================
export interface ActionFieldDiff {
  field: string;
  label: string;
  oldValue?: any;
  newValue: any;
}

export interface ActionPreview {
  actionType: 'create' | 'update' | 'complete' | 'delete';
  displayName: string;
  targetEntity: string;
  targetRecordTitle: string;
  targetRecordId?: string;
  diffs: ActionFieldDiff[];
  isDestructive: boolean;
  exists?: boolean;
  warning?: string;
  affectedTables?: string[];
}

// ==========================================
// Morning Briefing Types
// ==========================================
export interface BriefingDataPoint {
  label: string;
  value: string | number;
  change?: string;
}

export interface BriefingEntityLink {
  entityType: 'task' | 'deal' | 'customer' | 'project' | 'goal' | 'feature' | 'bug' | 'finance';
  entityId?: string;
  label: string;
  route: string;
}

export interface BriefingSection {
  title: string;
  category: 'executive' | 'finance' | 'sales' | 'customers' | 'tasks' | 'goals' | 'product' | 'engineering';
  summary: string;
  dataPoints?: BriefingDataPoint[];
  details?: string[];
  links?: BriefingEntityLink[];
}

export interface BriefingPriority {
  priorityNumber: number;
  title: string;
  rationale: string;
  targetEntity?: string;
  targetId?: string;
  route?: string;
}

export interface BriefingRisk {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  entityRef?: string;
  route?: string;
}

export interface BriefingOpportunity {
  title: string;
  description: string;
  potentialValue?: string;
  entityRef?: string;
  route?: string;
}

export interface BriefingRecommendation {
  id: string;
  title: string;
  description: string;
  suggestedActionTool?: string;
  suggestedActionPayload?: Record<string, any>;
}

export interface MorningBriefing {
  id: string;
  date: string;
  generatedAt: string;
  executiveSummary: string;
  sections: BriefingSection[];
  topPriorities: BriefingPriority[];
  topRisks: BriefingRisk[];
  topOpportunities: BriefingOpportunity[];
  recommendations?: BriefingRecommendation[];
  dataSources: string[];
}

// ==========================================
// External Service Integrations Types (Phase 10)
// ==========================================
export type IntegrationProvider = 'github' | 'google-calendar' | 'gmail' | 'stripe' | 'razorpay';
export type IntegrationCategory = 'development' | 'calendar' | 'email' | 'payments';
export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';
export type AuthType = 'token' | 'oauth2' | 'apikey' | 'sandbox';

export interface IntegrationConfig {
  apiKeyOrToken?: string;
  clientId?: string;
  clientSecret?: string;
  accountEmail?: string;
  accountUsername?: string;
  selectedRepos?: string[];
  syncFrequencyMinutes?: number;
  scopes?: string[];
  options?: Record<string, any>;
}

export interface IntegrationRecord {
  id: string;
  provider: IntegrationProvider;
  name: string;
  category: IntegrationCategory;
  authType: AuthType;
  status: IntegrationStatus;
  requiresBackend: boolean;
  backendNotice?: string;
  description: string;
  capabilities: string[];
  requiredScopes: string[];
  config?: IntegrationConfig;
  accountLabel?: string;
  lastSyncedAt?: string;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress';
  lastError?: string;
  syncStats?: {
    totalItems: number;
    lastItemsSynced: number;
    lastSyncDurationMs?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type ExternalItemType =
  | 'repo'
  | 'issue'
  | 'pull_request'
  | 'commit'
  | 'release'
  | 'meeting'
  | 'deadline'
  | 'email'
  | 'payment'
  | 'subscription'
  | 'refund';

export interface ExternalSyncItem {
  id: string;
  integrationId: string;
  provider: IntegrationProvider;
  itemType: ExternalItemType;
  externalId: string;
  title: string;
  summary?: string;
  status?: string;
  author?: string;
  url?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  lastSyncedAt: string;
  isDeletedExternally?: boolean;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  provider: IntegrationProvider;
  status: 'success' | 'failed' | 'in_progress';
  itemsSynced: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  durationMs: number;
  error?: string;
  createdAt: string;
}

// ==========================================
// Client Deal Intake & Auto-Provisioning Types
// ==========================================
export interface ClientOnboardingMilestone {
  title: string;
  estimatedMinutes?: number;
  priority?: Priority;
}

export interface ClientOnboardingPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  projectTitle: string;
  serviceCategory?: string; // e.g. "Website Development", "Mobile App", "AI Consulting"
  totalDealValue: number;
  depositAmount?: number;
  targetDeliveryDate?: string;
  milestones?: ClientOnboardingMilestone[];
  notes?: string;
}

export interface ClientOnboardingResult {
  success: boolean;
  message: string;
  customer: Customer;
  deal: Deal;
  invoice: Invoice;
  transaction?: Transaction;
  project: Project;
  tasks: Task[];
  note: Note;
  goalUpdated?: { goalId: string; goalTitle: string; previousValue: number; newValue: number };
}

// ==========================================
// AI CEO Founder Bottleneck Workflow Types
// ==========================================

// 1. Customer Churn Risk & Fire Drill
export interface CustomerRiskPayload {
  customerId?: string;
  companyName: string;
  issueDescription: string;
  monthlyRevenue?: number;
  severity?: 'critical' | 'high' | 'medium';
  targetCallDate?: string;
}

export interface CustomerRiskResult {
  success: boolean;
  message: string;
  customer: Customer;
  bug: Bug;
  tasks: Task[];
  note: Note;
}

// 2. Team Hire & Employee Onboarding
export interface EmployeeOnboardingPayload {
  name: string;
  role: string;
  departmentName?: string;
  monthlySalary: number;
  startDate?: string;
  customChecklist?: string[];
}

export interface EmployeeOnboardingResult {
  success: boolean;
  message: string;
  employee: Employee;
  department: Department;
  transaction: Transaction;
  tasks: Task[];
  goal: Goal;
}

// 3. Feature Spec to Engineering Sprint
export interface FeatureSprintPayload {
  title: string;
  description: string;
  projectName?: string;
  priority?: Priority;
  impact?: 'high' | 'medium' | 'low';
  effort?: 'high' | 'medium' | 'low';
  subtasks?: string[];
}

export interface FeatureSprintResult {
  success: boolean;
  message: string;
  feature: Feature;
  project?: Project;
  tasks: Task[];
  note: Note;
}

// 4. Vendor Expense & Runway Shield
export interface VendorExpensePayload {
  vendorName: string;
  monthlyCost: number;
  category?: string;
  renewalCycle?: 'monthly' | 'annual';
  notes?: string;
}

export interface VendorExpenseResult {
  success: boolean;
  message: string;
  transaction: Transaction;
  task: Task;
  note: Note;
  runwayMonthsEstimate: number;
}

// 5. Monthly Investor Update & Board Report
export interface InvestorUpdatePayload {
  monthYear?: string;
  keyWins?: string[];
  keyChallenges?: string[];
  asks?: string[];
}

export interface InvestorUpdateResult {
  success: boolean;
  message: string;
  note: Note;
  metrics: {
    mrr: number;
    netProfit: number;
    cashBalance: number;
    runwayMonths: number;
    activeCustomersCount: number;
    dealsWonCount: number;
    featuresShippedCount: number;
  };
  tasks: Task[];
}

// ==========================================
// 5 New Revenue Booster & Efficiency Types
// ==========================================

// 1. Stalled Deal Re-Engagement & Win-Back
export interface DealWinBackPayload {
  dealIds?: string[];
  daysInactive?: number;
  minValue?: number;
  discountPercent?: number;
  strategy?: 'value_add' | 'discount' | 'new_feature' | 'urgency' | string;
  incentiveType?: 'discount' | 'rush_delivery' | 'extra_features' | string;
  customNote?: string;
}

export interface DealWinBackResult {
  success: boolean;
  message: string;
  reengagedDeals: Deal[];
  tasks: Task[];
  note: Note;
  totalPipelineValue: number;
  revivedDeals?: Deal[];
  tasksCreated?: Task[];
  playbookNote?: Note;
}

// 2. Overdue Invoice Cash Recovery
export interface InvoiceRecoveryPayload {
  invoiceIds?: string[];
  gracePeriodDays?: number;
  reminderTone?: 'gentle' | 'firm' | 'urgent';
  escalationLevel?: 'friendly' | 'firm' | 'urgent';
  minInvoiceAmount?: number;
  paymentPlanOffered?: boolean;
}

export interface InvoiceRecoveryResult {
  success: boolean;
  message: string;
  recoveredInvoices: Invoice[];
  tasks: Task[];
  note: Note;
  totalOverdueAmount: number;
  totalChased?: number;
  invoicesChased?: Invoice[];
  tasksCreated?: Task[];
  customersFlagged?: string[];
  auditNote?: Note;
}

// 3. Existing Customer Upsell & Retainers
export interface AccountExpansionPayload {
  customerId?: string;
  customerName?: string;
  monthlyRetainer?: number;
  serviceTier?: 'starter' | 'growth' | 'enterprise';
  focusAreas?: string[];
  targetPitchDate?: string;
  expansionType?: 'sla_retainer' | 'annual_upgrade' | 'custom_tier' | string;
  proposedValue?: number;
}

export interface AccountExpansionResult {
  success: boolean;
  message: string;
  deal: Deal;
  customer: Customer;
  task: Task;
  note: Note;
  goal?: Goal;
  pitchTask?: Task;
  proposalNote?: Note;
  updatedGoal?: Goal;
}

// 4. Scope-Creep Defense & Paid Change Order
export interface ScopeDefensePayload {
  clientName?: string;
  projectName?: string;
  featureRequested?: string;
  requestedScope?: string;
  additionalFee?: number;
  chargeOrderFee?: number;
  additionalDays?: number;
  estimatedExtraHours?: number;
}

export interface ScopeDefenseResult {
  success: boolean;
  message: string;
  invoice: Invoice;
  tasks: Task[];
  note: Note;
  project?: Project;
  scopeTasks?: Task[];
  counterOfferNote?: Note;
  updatedProject?: Project;
  adjustedDays?: number;
}

// 5. Monday Revenue War Room
export interface RevenueWarRoomPayload {
  sprintRevenueTarget?: number;
  focusArea?: 'closing_pipeline' | 'upsell_existing' | 'debt_recovery' | 'burn_optimization' | string;
  focusAreas?: string[];
}

export interface RevenueWarRoomResult {
  success: boolean;
  message: string;
  tasks: Task[];
  note: Note;
  metrics: {
    closingPipelineValue: number;
    cashRunwayMonths: number;
    atRiskRevenue: number;
    activeSprintsCount: number;
    currentMrr?: number;
    activePipelineValue?: number;
    overdueInvoiceCount?: number;
    activeDeliverablesCount?: number;
    targetSprintRevenue?: number;
  };
  priorityTasks?: Task[];
  warRoomNote?: Note;
}


