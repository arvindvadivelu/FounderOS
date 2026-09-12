import { db } from '../db';
import { executeLocalTool } from './tools';
import { formatCurrency } from '../utils/formatters';
import type {
  MorningBriefing,
  BriefingSection,
  BriefingPriority,
  BriefingRisk,
  BriefingOpportunity,
  BriefingRecommendation,
  Company,
} from '../types';

const BRIEFING_STORAGE_KEY = 'founderos_cached_morning_briefing';

export async function getPersistedBriefing(): Promise<MorningBriefing | null> {
  try {
    const settings = await db.settings.get('general');
    if (settings && (settings as any).cachedBriefing) {
      return (settings as any).cachedBriefing;
    }
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(BRIEFING_STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    }
  } catch (err) {
    console.warn('Failed to read persisted morning briefing:', err);
  }
  return null;
}

export async function savePersistedBriefing(briefing: MorningBriefing): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BRIEFING_STORAGE_KEY, JSON.stringify(briefing));
    }
    const current = (await db.settings.get('general')) || { id: 'general', theme: 'dark', currency: 'USD', aiProvider: 'openrouter' };
    await db.settings.put({
      ...current,
      cachedBriefing: briefing,
    } as any);
  } catch (err) {
    console.warn('Failed to persist morning briefing:', err);
  }
}

export async function generateMorningBriefing(options: { force?: boolean } = {}): Promise<MorningBriefing> {
  const todayStr = new Date().toISOString().split('T')[0];

  // If not forcing regeneration, check if we have a fresh briefing from today
  if (!options.force) {
    const existing = await getPersistedBriefing();
    if (existing && existing.date === todayStr) {
      return existing;
    }
  }

  // 1. Gather real data from all approved read tools (Local DB + External Integrations)
  const [
    overview,
    revenue,
    expenses,
    profit,
    runway,
    cash,
    pipeline,
    forecast,
    customerHealth,
    tasks,
    overdue,
    deadlines,
    productPriorities,
    goals,
    integrationStatus,
    githubActivity,
    calendarSchedule,
    recentEmails,
    paymentSync,
  ] = await Promise.all([
    executeLocalTool('getCompanyOverview'),
    executeLocalTool('getRevenue'),
    executeLocalTool('getExpenses'),
    executeLocalTool('getProfit'),
    executeLocalTool('getRunway'),
    executeLocalTool('getCashPosition'),
    executeLocalTool('getSalesPipeline'),
    executeLocalTool('getSalesForecast'),
    executeLocalTool('getCustomerHealth'),
    executeLocalTool('getTasks', { status: 'todo' }),
    executeLocalTool('getOverdueTasks'),
    executeLocalTool('getDeadlines', { daysAhead: 14 }),
    executeLocalTool('getProductPriorities'),
    executeLocalTool('getGoals'),
    executeLocalTool('getIntegrationStatus'),
    executeLocalTool('getGitHubActivity'),
    executeLocalTool('getCalendarSchedule'),
    executeLocalTool('getRecentEmails'),
    executeLocalTool('getPaymentSync'),
  ]);

  const currency = overview.currency || 'USD';
  const companyName = overview.companyName || 'My Startup';

  // Build external data sources list
  const dataSources: string[] = ['Local IndexedDB (Transactions, Customers, Deals, Tasks, Bugs, Goals)'];
  if (githubActivity?.isConnected) dataSources.push(`GitHub Sync (${githubActivity.totalRepositories} repos, ${githubActivity.openPullRequestsCount} open PRs)`);
  if (calendarSchedule?.isConnected) dataSources.push(`Google Calendar Sync (${calendarSchedule.todayMeetingsCount} meetings today)`);
  if (recentEmails?.isConnected) dataSources.push(`Gmail Read-Only Sync (${recentEmails.unreadEmailsCount} unread)`);
  if (paymentSync?.isConnected) dataSources.push(`Payment Gateway Sync`);

  // 2. Compute Sections & Findings
  const sections: BriefingSection[] = [];

  // --- Executive Summary ---
  let execSummary = `FounderOS Executive Daily Intelligence for **${companyName}**. The business is operating with **${formatCurrency(overview.mrr, currency)} MRR** (${overview.activeCustomers} active clients) and approximately **${overview.runwayMonths} months** of cash runway. There are **${overview.openTasksCount} open tasks** (${overdue.count} overdue) and **${pipeline.openDealsCount} active sales deals** worth **${formatCurrency(pipeline.totalPipelineValue, currency)}** in pipeline.`;

  if (calendarSchedule?.isConnected && calendarSchedule.todayMeetingsCount > 0) {
    execSummary += ` You have **${calendarSchedule.todayMeetingsCount} meeting(s)** scheduled on Google Calendar today.`;
  }
  if (githubActivity?.isConnected && githubActivity.openPullRequestsCount > 0) {
    execSummary += ` Engineering has **${githubActivity.openPullRequestsCount} active PR(s)** on GitHub.`;
  }

  // --- Section 1: Finance ---
  const financeDataPoints = [
    { label: 'MRR / ARR', value: `${formatCurrency(overview.mrr, currency)} / ${formatCurrency(overview.arr, currency)}` },
    { label: 'Monthly Spend', value: formatCurrency(overview.totalExpenses, currency) },
    { label: 'Net Profit', value: formatCurrency(profit.netProfit, currency) },
    { label: 'Runway', value: `${overview.runwayMonths} months` },
    { label: 'Cash Balance', value: formatCurrency(overview.estimatedCash, currency) },
  ];
  if (paymentSync?.isConnected && paymentSync.totalPaymentInflow > 0) {
    financeDataPoints.push({ label: 'Gateway Inflow', value: formatCurrency(paymentSync.totalPaymentInflow, currency) });
  }

  sections.push({
    title: 'Financial & Cash Reserves',
    category: 'finance',
    summary: profit.status === 'profitable'
      ? `Operating profitably with ${formatCurrency(profit.netProfit, currency)} net profit (${profit.profitMarginPct}% margin).`
      : profit.status === 'breakeven'
      ? 'Operating at breakeven.'
      : `Operating with net monthly burn of ${formatCurrency(profit.monthlyBurn, currency)}.`,
    dataPoints: financeDataPoints,
    details: [
      runway.projectedZeroCashDate ? `Zero-cash horizon estimated at ${runway.projectedZeroCashDate}.` : 'No immediate cash exhaustion risk identified.',
      `Liquid checking reserves: ${formatCurrency(cash.liquidCash || overview.estimatedCash, currency)}.`,
      ...(paymentSync?.isConnected && paymentSync.recentPayments?.length ? [`Synchronized ${paymentSync.recentPayments.length} payment transactions from payment gateways.`] : []),
    ],
    links: [{ entityType: 'finance', label: 'View Ledger & Transactions', route: '#/finance' }],
  });

  // --- Section 2: Sales & Pipeline ---
  const highConfCount = forecast.highConfidenceDeals?.length || 0;
  sections.push({
    title: 'Sales, Pipeline & Forecast',
    category: 'sales',
    summary: pipeline.openDealsCount > 0
      ? `${pipeline.openDealsCount} active deals in pipeline representing ${formatCurrency(pipeline.totalPipelineValue, currency)} in total potential revenue (weighted: ${formatCurrency(pipeline.weightedExpectedRevenue, currency)}).`
      : 'No active deals currently in pipeline.',
    dataPoints: [
      { label: 'Open Deals', value: pipeline.openDealsCount },
      { label: 'Pipeline Value', value: formatCurrency(pipeline.totalPipelineValue, currency) },
      { label: 'Weighted Value', value: formatCurrency(pipeline.weightedExpectedRevenue, currency) },
      { label: 'High Confidence', value: `${highConfCount} deals` },
    ],
    details: forecast.dealsInClosingStages?.map((d: any) => `Deal in ${d.stage}: "${d.name}" ($${d.value?.toLocaleString()}) - ${d.probability}% probability`) || [],
    links: [{ entityType: 'deal', label: 'View Sales Pipeline', route: '#/sales' }],
  });

  // --- Section 3: Customers & Health ---
  const custDataPoints = [
    { label: 'Active Clients', value: customerHealth.activeCustomersCount },
    { label: 'Total MRR', value: formatCurrency(customerHealth.totalMRR, currency) },
    { label: 'At-Risk Accounts', value: customerHealth.highRiskCount },
    { label: 'Overdue Invoices', value: customerHealth.overdueInvoicesCount },
  ];
  if (recentEmails?.isConnected) {
    custDataPoints.push({ label: 'Unread (Gmail)', value: recentEmails.unreadEmailsCount });
  }

  const custDetails = [
    ...(customerHealth.highRiskAccounts?.slice(0, 3).map((a: any) => `⚠️ ${a.companyName}: ${a.reasons.join(', ')} ($${a.monthlyRevenue}/mo)`) || []),
    ...(recentEmails?.isConnected && recentEmails.recentEmails?.length ? recentEmails.recentEmails.slice(0, 2).map((e: any) => `📧 [Gmail] ${e.from}: "${e.subject}"`) : []),
  ];

  sections.push({
    title: 'Customers & Retention Risk',
    category: 'customers',
    summary: customerHealth.highRiskCount > 0
      ? `${customerHealth.activeCustomersCount} active accounts. ${customerHealth.highRiskCount} account(s) flagged for attention or churn risk.`
      : `${customerHealth.activeCustomersCount} active accounts operating in good standing with 0 overdue payment flags.`,
    dataPoints: custDataPoints,
    details: custDetails,
    links: [{ entityType: 'customer', label: 'View Customers Directory', route: '#/customers' }],
  });

  // --- Section 4: Tasks & Execution ---
  const taskDataPoints = [
    { label: 'Todo Tasks', value: tasks.count },
    { label: 'Overdue Tasks', value: overdue.count },
    { label: 'Next 14 Days', value: `${deadlines.totalUpcomingDeadlines} deadlines` },
  ];
  if (calendarSchedule?.isConnected) {
    taskDataPoints.push({ label: 'Today Meetings', value: calendarSchedule.todayMeetingsCount });
  }

  const taskDetails = [
    ...(overdue.overdueTasks?.slice(0, 3).map((t: any) => `Overdue (${t.dueDate}): "${t.title}" [${t.priority}]`) || []),
    ...(calendarSchedule?.isConnected && calendarSchedule.todaySchedule?.length ? calendarSchedule.todaySchedule.map((s: any) => `📅 [Calendar] ${s.title} (${s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'})`) : []),
  ];

  sections.push({
    title: 'Work, Tasks & Deadlines',
    category: 'tasks',
    summary: overdue.count > 0
      ? `🚨 ${overdue.count} task(s) are currently OVERDUE. ${tasks.count} tasks queued for execution.`
      : `All tasks on schedule. ${tasks.count} task(s) in todo backlog.`,
    dataPoints: taskDataPoints,
    details: taskDetails,
    links: [{ entityType: 'task', label: 'Open Task Manager', route: '#/tasks' }],
  });

  // --- Section 5: Goals & OKRs ---
  const goalsList = goals.goals || [];
  const atRiskGoals = goalsList.filter((g: any) => g.status === 'at_risk');
  sections.push({
    title: 'Company Goals & Trajectory',
    category: 'goals',
    summary: goalsList.length > 0
      ? `${goalsList.length} active OKR(s) tracked. ${atRiskGoals.length} goal(s) currently marked at risk.`
      : 'No active strategic goals set for this quarter.',
    dataPoints: [
      { label: 'Active Goals', value: goalsList.length },
      { label: 'On Track', value: goalsList.filter((g: any) => g.status === 'on_track').length },
      { label: 'At Risk', value: atRiskGoals.length },
    ],
    details: goalsList.slice(0, 3).map((g: any) => `🎯 ${g.title}: ${g.currentValue}/${g.target} ${g.unit} (${g.status.replace('_', ' ')})`),
    links: [{ entityType: 'goal', label: 'View Strategic Goals', route: '#/goals' }],
  });

  // --- Section 6: Product & Engineering ---
  const engDataPoints = [
    { label: 'Critical Bugs', value: productPriorities.criticalBugsCount },
    { label: 'High Bugs', value: productPriorities.highBugsCount },
    { label: 'Quick Wins', value: productPriorities.quickWinFeaturesCount },
  ];
  if (githubActivity?.isConnected) {
    engDataPoints.push({ label: 'GitHub PRs / Commits', value: `${githubActivity.openPullRequestsCount} / ${githubActivity.recentCommitsCount}` });
  }

  const engDetails = [
    ...productPriorities.criticalBugs?.map((b: any) => `Critical Bug: "${b.title}" (${b.status})`),
    ...productPriorities.quickWinFeatures?.slice(0, 2).map((f: any) => `Quick Win: "${f.title}" (High Impact, Low Effort)`),
    ...(githubActivity?.isConnected && githubActivity.pullRequests?.length ? githubActivity.pullRequests.slice(0, 2).map((p: any) => `🐙 [GitHub PR] ${p.title} (${p.status}) by @${p.author}`) : []),
  ];

  sections.push({
    title: 'Product & Engineering Quality',
    category: 'engineering',
    summary: productPriorities.criticalBugsCount > 0
      ? `⚠️ ${productPriorities.criticalBugsCount} CRITICAL engineering bug(s) require immediate triage. ${productPriorities.quickWinFeaturesCount} quick-win feature(s) identified.`
      : `0 critical bugs reported. Engineering health nominal with ${productPriorities.quickWinFeaturesCount} high-impact quick-win feature(s) in backlog.`,
    dataPoints: engDataPoints,
    details: engDetails,
    links: [
      { entityType: 'bug', label: 'Triage Bugs', route: '#/engineering' },
      { entityType: 'feature', label: 'Product Backlog', route: '#/product' },
    ],
  });

  // 3. Synthesize Top 3 Priorities for Today
  const topPriorities: BriefingPriority[] = [];
  let priorityIdx = 1;

  // Priority A: Overdue tasks or critical bugs
  if (overdue.count > 0) {
    const firstOverdue = overdue.overdueTasks[0];
    topPriorities.push({
      priorityNumber: priorityIdx++,
      title: `Resolve Overdue Task: "${firstOverdue.title}"`,
      rationale: `This task was due on ${firstOverdue.dueDate} and remains incomplete. Clearing overdue items prevents operational debt.`,
      targetEntity: 'Task',
      targetId: firstOverdue.id,
      route: '#/tasks',
    });
  } else if (productPriorities.criticalBugsCount > 0) {
    const firstBug = productPriorities.criticalBugs[0];
    topPriorities.push({
      priorityNumber: priorityIdx++,
      title: `Fix Critical Bug: "${firstBug.title}"`,
      rationale: 'Critical severity issue reported in production. Urgent fix required to prevent user churn.',
      targetEntity: 'Bug',
      targetId: firstBug.id,
      route: '#/engineering',
    });
  }

  // Priority B: High-value closing sales deal
  const topClosingDeal = forecast.dealsInClosingStages?.[0] || forecast.highConfidenceDeals?.[0];
  if (topClosingDeal && priorityIdx <= 3) {
    topPriorities.push({
      priorityNumber: priorityIdx++,
      title: `Advance Deal: "${topClosingDeal.name}" ($${topClosingDeal.value?.toLocaleString()})`,
      rationale: `Deal is in ${topClosingDeal.stage || 'high confidence'} stage (${topClosingDeal.probability}% probability). Closing this increases pipeline conversion.`,
      targetEntity: 'Deal',
      targetId: topClosingDeal.id,
      route: '#/sales',
    });
  }

  // Priority C: Quick win feature or at-risk customer
  if (customerHealth.highRiskCount > 0 && priorityIdx <= 3) {
    const riskCust = customerHealth.highRiskAccounts[0];
    topPriorities.push({
      priorityNumber: priorityIdx++,
      title: `Follow Up With At-Risk Customer: "${riskCust.companyName}"`,
      rationale: `Account generates $${riskCust.monthlyRevenue}/mo and has flags: ${riskCust.reasons[0]}. Direct founder touchpoint reduces churn risk.`,
      targetEntity: 'Customer',
      targetId: riskCust.id,
      route: '#/customers',
    });
  } else if (productPriorities.quickWinFeaturesCount > 0 && priorityIdx <= 3) {
    const topFeat = productPriorities.quickWinFeatures[0];
    topPriorities.push({
      priorityNumber: priorityIdx++,
      title: `Implement Quick-Win Feature: "${topFeat.title}"`,
      rationale: 'Scored as High Impact and Low Effort in product roadmap. Fast ROI for user delight.',
      targetEntity: 'Feature',
      targetId: topFeat.id,
      route: '#/product',
    });
  }

  // Fill up to 3 if less than 3
  if (topPriorities.length < 3) {
    const todoTasks = tasks.tasks || [];
    for (const t of todoTasks) {
      if (!topPriorities.some((p) => p.targetId === t.id) && topPriorities.length < 3) {
        topPriorities.push({
          priorityNumber: priorityIdx++,
          title: `Complete Backlog Task: "${t.title}"`,
          rationale: `Queued execution item [Priority: ${t.priority}].`,
          targetEntity: 'Task',
          targetId: t.id,
          route: '#/tasks',
        });
      }
    }
  }

  // If still empty (brand new database)
  if (topPriorities.length === 0) {
    topPriorities.push({
      priorityNumber: 1,
      title: 'Configure Company Profile & Initial Roadmap',
      rationale: 'Set up your company details, add first customer accounts, and define core quarterly OKRs.',
      route: '#/settings',
    });
  }

  // 4. Synthesize Top Risks
  const topRisks: BriefingRisk[] = [];
  if (overview.runwayMonths < 4 && overview.runwayMonths > 0) {
    topRisks.push({
      title: 'Short Runway Alert',
      description: `Current cash runway is ${overview.runwayMonths} months. Plan fundraising or reduce monthly spend.`,
      severity: 'high',
      route: '#/finance',
    });
  }
  if (customerHealth.overdueInvoicesCount > 0) {
    topRisks.push({
      title: 'Uncollected Invoices Outstanding',
      description: `${customerHealth.overdueInvoicesCount} invoice(s) are overdue past payment deadlines.`,
      severity: 'high',
      route: '#/finance',
    });
  }
  if (productPriorities.criticalBugsCount > 0) {
    topRisks.push({
      title: 'Unresolved Production Bugs',
      description: `${productPriorities.criticalBugsCount} critical engineering defect(s) pending resolution.`,
      severity: 'high',
      route: '#/engineering',
    });
  }
  if (overdue.count > 0) {
    topRisks.push({
      title: 'Execution Backlog Delay',
      description: `${overdue.count} task(s) past scheduled due dates.`,
      severity: 'medium',
      route: '#/tasks',
    });
  }
  if (topRisks.length === 0) {
    topRisks.push({
      title: 'Zero High-Severity Operational Risks',
      description: 'Runway is healthy, zero overdue invoices or critical defects detected.',
      severity: 'low',
    });
  }

  // 5. Synthesize Top Opportunities
  const topOpportunities: BriefingOpportunity[] = [];
  if (pipeline.totalPipelineValue > 0) {
    topOpportunities.push({
      title: 'Pipeline Revenue Conversion',
      description: `Closing active deals can add up to ${formatCurrency(pipeline.totalPipelineValue, currency)} in new company bookings.`,
      potentialValue: formatCurrency(pipeline.weightedExpectedRevenue, currency),
      route: '#/sales',
    });
  }
  if (productPriorities.quickWinFeaturesCount > 0) {
    topOpportunities.push({
      title: 'Rapid Feature Deployment',
      description: `${productPriorities.quickWinFeaturesCount} high-impact, low-effort feature(s) ready for development.`,
      route: '#/product',
    });
  }
  if (topOpportunities.length === 0) {
    topOpportunities.push({
      title: 'Outbound Prospecting & Expansion',
      description: 'Expand outbound sales leads and test customer acquisition channels.',
      route: '#/sales',
    });
  }

  // 6. Actionable Recommendations (1-Click Proposable Actions)
  const recommendations: BriefingRecommendation[] = [];
  if (customerHealth.highRiskCount > 0) {
    const cust = customerHealth.highRiskAccounts[0];
    recommendations.push({
      id: `rec_cust_${cust.id}`,
      title: `Follow up with ${cust.companyName}`,
      description: `Schedule a customer success check-in regarding ${cust.reasons[0]}.`,
      suggestedActionTool: 'createTask',
      suggestedActionPayload: {
        title: `Customer retention check-in: ${cust.companyName}`,
        priority: 'high',
        dueDate: todayStr,
        description: `Follow up on outstanding issues: ${cust.reasons.join(', ')}`,
      },
    });
  }
  if (productPriorities.criticalBugsCount > 0) {
    const bug = productPriorities.criticalBugs[0];
    recommendations.push({
      id: `rec_bug_${bug.id}`,
      title: `Triage Bug: ${bug.title}`,
      description: 'Create high-priority engineering task to deploy patch.',
      suggestedActionTool: 'createTask',
      suggestedActionPayload: {
        title: `Fix bug: ${bug.title}`,
        priority: 'critical',
        dueDate: todayStr,
        description: `Investigate and resolve critical engineering defect.`,
      },
    });
  }

  const briefing: MorningBriefing = {
    id: `briefing_${todayStr}_${Date.now()}`,
    date: todayStr,
    generatedAt: new Date().toISOString(),
    executiveSummary: execSummary,
    sections,
    topPriorities,
    topRisks,
    topOpportunities,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
    dataSources: [
      ...dataSources,
      'getCompanyOverview',
      'getRevenue',
      'getExpenses',
      'getProfit',
      'getRunway',
      'getCashPosition',
      'getSalesPipeline',
      'getSalesForecast',
      'getCustomerHealth',
      'getTasks',
      'getOverdueTasks',
      'getDeadlines',
      'getProductPriorities',
      'getGoals',
      'getIntegrationStatus',
      'getGitHubActivity',
      'getCalendarSchedule',
      'getRecentEmails',
      'getPaymentSync',
    ],
  };

  await savePersistedBriefing(briefing);
  return briefing;
}
