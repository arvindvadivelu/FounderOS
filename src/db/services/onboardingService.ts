import { db } from '../db';
import { logActivity } from './activityService';
import type {
  ClientOnboardingPayload,
  ClientOnboardingResult,
  Customer,
  Deal,
  Invoice,
  Transaction,
  Project,
  Task,
  Note,
  Goal,
  Priority,
} from '../../types';

export function getDefaultMilestones(serviceCategory?: string, projectTitle?: string): Array<{ title: string; priority: Priority; estimatedMinutes: number }> {
  const text = `${serviceCategory || ''} ${projectTitle || ''}`.toLowerCase();

  if (text.includes('web') || text.includes('site') || text.includes('landing') || text.includes('portfolio')) {
    return [
      { title: 'Project Scope, Sitemap & Asset Discovery', priority: 'high', estimatedMinutes: 90 },
      { title: 'Wireframes & UI/UX Visual Prototype', priority: 'high', estimatedMinutes: 180 },
      { title: 'Frontend Implementation & Responsive Layouts', priority: 'critical', estimatedMinutes: 360 },
      { title: 'Content Population, SEO Tags & Cross-Device QA', priority: 'medium', estimatedMinutes: 120 },
      { title: 'Custom Domain Setup, SSL & Production Launch', priority: 'high', estimatedMinutes: 60 },
    ];
  }

  if (text.includes('app') || text.includes('mobile') || text.includes('software')) {
    return [
      { title: 'Architecture Planning & Schema Design', priority: 'high', estimatedMinutes: 120 },
      { title: 'Core Business Logic & API Endpoints', priority: 'critical', estimatedMinutes: 300 },
      { title: 'Client Feedback Walkthrough & Iteration', priority: 'high', estimatedMinutes: 90 },
      { title: 'App Store / Production Deployment', priority: 'critical', estimatedMinutes: 90 },
    ];
  }

  if (text.includes('consult') || text.includes('audit') || text.includes('advisory')) {
    return [
      { title: 'Initial Stakeholder Discovery Session', priority: 'high', estimatedMinutes: 60 },
      { title: 'Deep Technical & Operational Audit', priority: 'high', estimatedMinutes: 240 },
      { title: 'Executive Findings Deck & Recommendations', priority: 'critical', estimatedMinutes: 180 },
    ];
  }

  // General service default
  return [
    { title: 'Kickoff Call & Requirements Gathering', priority: 'high', estimatedMinutes: 60 },
    { title: 'Core Deliverable Draft & Initial Delivery', priority: 'critical', estimatedMinutes: 240 },
    { title: 'Client Review & Feedback Revisions', priority: 'medium', estimatedMinutes: 90 },
    { title: 'Final Handover & Completion Sign-off', priority: 'high', estimatedMinutes: 60 },
  ];
}

export async function onboardClientProject(payload: ClientOnboardingPayload): Promise<ClientOnboardingResult> {
  if (!payload.companyName || !payload.companyName.trim()) {
    throw new Error('Company name is required for client onboarding.');
  }
  if (!payload.projectTitle || !payload.projectTitle.trim()) {
    throw new Error('Project title is required.');
  }
  if (typeof payload.totalDealValue !== 'number' || payload.totalDealValue <= 0) {
    throw new Error('Total deal value must be a positive number.');
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const todayStr = isoNow.split('T')[0];
  const targetDateStr = payload.targetDeliveryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const deposit = payload.depositAmount !== undefined ? payload.depositAmount : Math.round(payload.totalDealValue * 0.5);

  // Generate deterministic entity IDs
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const customerId = `cust_${Date.now()}_${randomSuffix}`;
  const dealId = `deal_${Date.now()}_${randomSuffix}`;
  const invoiceId = `inv_${Date.now()}_${randomSuffix}`;
  const transactionId = `tx_inc_${Date.now()}_${randomSuffix}`;
  const projectId = `proj_${Date.now()}_${randomSuffix}`;
  const noteId = `note_${Date.now()}_${randomSuffix}`;

  // 1. Customer
  const customer: Customer = {
    id: customerId,
    companyName: payload.companyName.trim(),
    contactName: payload.contactName?.trim() || 'Primary Contact',
    email: payload.email?.trim() || `contact@${payload.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    phone: payload.phone?.trim(),
    status: 'active',
    plan: payload.serviceCategory || 'Project Engagement',
    monthlyRevenue: 0,
    tags: ['Client', payload.serviceCategory || 'Web Development'],
    lastActivityAt: isoNow,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 2. Deal
  const deal: Deal = {
    id: dealId,
    customerId: customer.id,
    customerName: customer.companyName,
    name: `${payload.companyName} — ${payload.projectTitle}`,
    value: payload.totalDealValue,
    currency: 'USD',
    stage: 'Won',
    probability: 100,
    expectedCloseDate: todayStr,
    source: 'AI CEO Instant Intake',
    notes: payload.notes || `Closed deal for ${payload.projectTitle}`,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 3. Invoice
  const invoiceNum = `INV-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const invoice: Invoice = {
    id: invoiceId,
    customerId: customer.id,
    customerName: customer.companyName,
    invoiceNumber: invoiceNum,
    issueDate: todayStr,
    dueDate: targetDateStr,
    amount: payload.totalDealValue,
    currency: 'USD',
    status: deposit >= payload.totalDealValue ? 'paid' : 'sent',
    description: `${payload.projectTitle} (Full Project Fee)`,
    notes: deposit > 0 ? `Initial deposit of $${deposit.toLocaleString()} recorded.` : undefined,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 4. Transaction (Deposit or Full Payment)
  let transaction: Transaction | undefined;
  if (deposit > 0) {
    transaction = {
      id: transactionId,
      type: 'income',
      category: 'Subscription',
      description: `${payload.companyName} — Deposit for ${payload.projectTitle}`,
      amount: deposit,
      currency: 'USD',
      date: todayStr,
      customerId: customer.id,
      recurring: false,
      status: 'cleared',
      notes: `Invoice ${invoiceNum} partial payment.`,
      createdAt: isoNow,
      updatedAt: isoNow,
    };
  }

  // 5. Project
  const project: Project = {
    id: projectId,
    name: payload.projectTitle.trim(),
    description: payload.notes || `Client website & digital delivery for ${payload.companyName}.`,
    status: 'in_progress',
    priority: 'high',
    startDate: todayStr,
    targetDate: targetDateStr,
    progress: 10,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // 6. Tasks
  const rawMilestones = payload.milestones && payload.milestones.length > 0
    ? payload.milestones
    : getDefaultMilestones(payload.serviceCategory, payload.projectTitle);

  const tasks: Task[] = rawMilestones.map((m, idx) => {
    // Stagger due dates across the project timeframe
    const dayOffset = Math.max(2, Math.round(((idx + 1) / rawMilestones.length) * 28));
    const taskDueDate = new Date(Date.now() + dayOffset * 86400000).toISOString().split('T')[0];

    return {
      id: `task_${Date.now()}_${idx}_${randomSuffix}`,
      title: m.title,
      description: `Milestone #${idx + 1} for ${payload.projectTitle} (${payload.companyName}).`,
      projectId: project.id,
      projectName: project.name,
      priority: m.priority || (idx === 0 ? 'high' : 'medium'),
      status: idx === 0 ? 'in_progress' : 'todo',
      dueDate: taskDueDate,
      estimatedMinutes: m.estimatedMinutes || 90,
      actualMinutes: 0,
      tags: ['Deliverable', payload.serviceCategory || 'Client Work'],
      createdAt: isoNow,
      updatedAt: isoNow,
    };
  });

  // 7. Strategy Kick-off Note
  const milestonesListMarkdown = rawMilestones
    .map((m, i) => `${i + 1}. [ ] **${m.title}** (${m.priority || 'Medium'} Priority)`)
    .join('\n');

  const noteContent = `# 🚀 Project Brief: ${payload.projectTitle}

**Client:** ${payload.companyName}  
**Primary Contact:** ${payload.contactName || 'Lead Contact'} (${customer.email})  
**Contract Value:** $${payload.totalDealValue.toLocaleString()} USD  
**Upfront Deposit:** $${deposit.toLocaleString()} USD  
**Target Delivery Date:** ${targetDateStr}  
**Initiated By:** Founder via AI CEO Instant Onboarding  

---

### 📌 Project Scope & Overview
${payload.notes || `Website and product design engagement for ${payload.companyName}. Full delivery scheduled for ${targetDateStr}.`}

---

### 🎯 Execution Milestones
${milestonesListMarkdown}

---

### 💳 Financial & Invoicing Terms
- Total Billed: **$${payload.totalDealValue.toLocaleString()} USD** (${invoiceNum})
- Deposit Received: **$${deposit.toLocaleString()} USD**
- Remaining Balance: **$${Math.max(0, payload.totalDealValue - deposit).toLocaleString()} USD** upon final completion sign-off.
`;

  const note: Note = {
    id: noteId,
    title: `Client Brief: ${payload.companyName} — ${payload.projectTitle}`,
    content: noteContent,
    category: 'Client Brief',
    tags: ['Client', 'Project Brief', 'Onboarding'],
    isPinned: true,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // Perform atomic multi-entity write into Dexie
  let goalUpdatedInfo: { goalId: string; goalTitle: string; previousValue: number; newValue: number } | undefined;

  await db.transaction(
    'rw',
    [
      db.customers,
      db.deals,
      db.invoices,
      db.transactions,
      db.projects,
      db.tasks,
      db.notes,
      db.goals,
      db.activities,
    ],
    async () => {
      await db.customers.put(customer);
      await db.deals.put(deal);
      await db.invoices.put(invoice);
      if (transaction) {
        await db.transactions.put(transaction);
      }
      await db.projects.put(project);
      await db.tasks.bulkPut(tasks);
      await db.notes.put(note);

      // Check if there is an active revenue goal to increment
      const allGoals = await db.goals.toArray();
      const revGoal = allGoals.find(
        (g) =>
          g.status !== 'achieved' &&
          (g.unit === '$' || g.title.toLowerCase().includes('revenue') || g.title.toLowerCase().includes('mrr'))
      );

      if (revGoal) {
        const prev = revGoal.currentValue || 0;
        const nextVal = prev + payload.totalDealValue;
        await db.goals.update(revGoal.id, {
          currentValue: nextVal,
          status: nextVal >= revGoal.target ? 'achieved' : revGoal.status,
          updatedAt: isoNow,
        });
        goalUpdatedInfo = {
          goalId: revGoal.id,
          goalTitle: revGoal.title,
          previousValue: prev,
          newValue: nextVal,
        };
      }

      await logActivity(
        'onboarded_client_project',
        'project',
        `AI CEO onboarded client "${payload.companyName}" with project "${payload.projectTitle}" ($${payload.totalDealValue.toLocaleString()})`,
        project.id
      );
    }
  );

  return {
    success: true,
    message: `Successfully onboarded "${payload.companyName}" and provisioned ${payload.projectTitle} across all 7 company modules!`,
    customer,
    deal,
    invoice,
    transaction,
    project,
    tasks,
    note,
    goalUpdated: goalUpdatedInfo,
  };
}
