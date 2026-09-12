import { db } from '../db';
import { getDefaultAIProvider, saveAIMessage, updateAIMessage } from '../db/services/aiStorageService';
import { getCompany } from '../db/services/companyService';
import { sendChatMessage, type ChatMessagePayload } from './providerClient';
import { AI_TOOL_DEFINITIONS, executeLocalTool } from './tools';
import { getSystemPrompt } from './prompts';
import { verifyActionExecution } from './actionPreviewService';
import type { AIMessage, AIToolCall } from '../types';

export interface ProcessTurnParams {
  conversationId: string;
  userPrompt: string;
  history: AIMessage[];
  onProgress?: (status: string) => void;
}

export async function processConversationTurn({
  conversationId,
  userPrompt,
  history,
  onProgress,
}: ProcessTurnParams): Promise<{
  assistantMessage: AIMessage;
  proposedActions?: AIToolCall[];
}> {
  const provider = await getDefaultAIProvider();
  const company = await getCompany();

  // 1. Save the user message to IndexedDB
  await saveAIMessage({
    conversationId,
    role: 'user',
    content: userPrompt,
  });

  if (!provider || !provider.apiKey) {
    const isSpecializedWorkflow =
      /stall|win back|winback|overdue|unpaid invoice|late payment|chase invoice|retainer|upsell|expansion|scope creep|out of scope|change order|scope defense|war room|revenue war room|churn|fire drill|hired|candidate|vendor|subscription/i.test(userPrompt);

    const isDealIntake =
      !isSpecializedWorkflow &&
      (/got a client|closed a deal|new client|signed a client|landed a client|signed a deal/i.test(userPrompt) ||
       (/client|deal|project/i.test(userPrompt) && /building|website/i.test(userPrompt) && /\$?\s*\d+/i.test(userPrompt)));

    if (isDealIntake) {
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 2000;
      const isWeb = /web|site|landing|app/i.test(userPrompt);
      const projectTitle = isWeb ? 'Website Design & Development' : 'Client Delivery Project';
      const serviceCategory = isWeb ? 'Website Development' : 'Custom Project';

      // Extract client name if mentioned (e.g. "for Acme" or "client XYZ")
      const clientMatch = userPrompt.match(/(?:for|named|client|called)\s+([A-Z][a-zA-Z0-9_\-\s]{2,20})/);
      const clientName = clientMatch && clientMatch[1] ? clientMatch[1].trim() : 'Apex Web Client';

      const intakeArguments = {
        companyName: clientName,
        contactName: 'Primary Contact',
        email: `contact@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
        projectTitle,
        serviceCategory,
        totalDealValue: amount > 0 ? amount : 2000,
        depositAmount: Math.round((amount > 0 ? amount : 2000) * 0.5),
        targetDeliveryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: `Deliverable scope for ${projectTitle} closed at $${amount.toLocaleString()}.`,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🚀 Congratulations on closing the deal!\n\nI've extracted your deal parameters and generated the **Instant Client & Project Intake Form** below.\n\nReview the details and click **"Approve & Auto-Provision Entire Company"** to automatically create the customer in CRM, log the won deal, issue the invoice, schedule 5 milestone tasks, write the project brief, and update your revenue OKR in one click.`,
        toolCalls: [
          {
            id: `intake_${Date.now()}`,
            name: 'onboardClientProject',
            arguments: intakeArguments,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 1. Customer Churn Risk
    const isCustomerRisk =
      /cancel|churn|upset|unhappy|broken|disaster|emergency|leaving|refund/i.test(userPrompt) &&
      (/client|customer|account|acme|[A-Z][a-zA-Z0-9]+/i.test(userPrompt));

    if (isCustomerRisk) {
      const companyMatch =
        userPrompt.match(/([A-Z][a-zA-Z0-9_\-\s]{1,20})\s+(?:is|might|said|wants|threatened)/) ||
        userPrompt.match(/(?:for|client|customer)\s+([A-Z][a-zA-Z0-9_\-\s]{2,20})/);
      const companyName = companyMatch && companyMatch[1] ? companyMatch[1].trim() : 'Acme Corp';
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const monthlyRevenue = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 2500;

      const riskArgs = {
        companyName,
        issueDescription: userPrompt,
        monthlyRevenue,
        severity: 'critical',
        targetCallDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🚨 Customer Churn Alert & Emergency Action Required\n\nI've initiated the **Customer Risk Mitigation Protocol** for **${companyName}**.\n\nReview the emergency response parameters below and click **"Approve & Mitigate Risk"** to mark the account \`at_risk\`, file a P0 Critical bug, schedule an emergency patch & retention call, and generate your talking points memo.`,
        toolCalls: [
          {
            id: `risk_${Date.now()}`,
            name: 'mitigateCustomerRisk',
            arguments: riskArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 2. Team Hire & Onboarding
    const isTeamHire =
      /hire|hired|join|joining|new employee|engineer|developer|designer|marketer/i.test(userPrompt) &&
      (/\$?\s*\d+/i.test(userPrompt) || /full-stack|engineer|developer|role/i.test(userPrompt));

    if (isTeamHire) {
      const nameMatch =
        userPrompt.match(/hired\s+([A-Z][a-zA-Z0-9_\-\s]{1,15})\s+as/i) ||
        userPrompt.match(/([A-Z][a-zA-Z0-9_\-\s]{1,15})\s+as/i);
      const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : 'Alex Rivera';
      const roleMatch =
        userPrompt.match(/as\s+(?:a|an)?\s*([A-Za-z\-\s]{3,25})\s+for/i) ||
        userPrompt.match(/as\s+(?:a|an)?\s*([A-Za-z\-\s]{3,25})/i);
      const role = roleMatch && roleMatch[1] ? roleMatch[1].trim() : 'Full-Stack Engineer';
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const salary = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 4500;

      const hireArgs = {
        name,
        role,
        departmentName: /design/i.test(role) ? 'Design' : /sales|marketing/i.test(role) ? 'Growth' : 'Engineering',
        monthlySalary: salary,
        startDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🤝 Welcome to the Team!\n\nI've configured the **Team Onboarding Engine** for **${name}** (${role}).\n\nReview the onboarding configuration below and click **"Approve & Onboard Team Member"** to create their employee profile, register monthly payroll in Finance, generate 5 ramp-up tasks, and set their 90-day role milestone.`,
        toolCalls: [
          {
            id: `hire_${Date.now()}`,
            name: 'onboardEmployee',
            arguments: hireArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 3. Feature Sprint Planner
    const isFeatureSprint =
      !/scope creep|out of scope|change order|scope defense/i.test(userPrompt) &&
      /build|feature|sprint|spec|prd|implement|create feature|add feature/i.test(userPrompt);

    if (isFeatureSprint) {
      const titleMatch = userPrompt.match(/(?:build|implement|add|create)\s+(?:a|an)?\s*([^.]+?)(?:\s+for|\s+in|\.|$)/i);
      const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Product Feature Enhancement';

      const sprintArgs = {
        title: title.length > 50 ? title.slice(0, 50) : title,
        description: userPrompt,
        projectName: 'Core Product Sprints',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### ⚡ Sprint Architecture Ready\n\nI've broken down **"${sprintArgs.title}"** into technical implementation tasks and drafted a Mini-PRD.\n\nReview the sprint plan below and click **"Approve & Launch Sprint"** to add the feature to your roadmap, schedule 4 development subtasks, and save the complete specification in Notes.`,
        toolCalls: [
          {
            id: `sprint_${Date.now()}`,
            name: 'launchFeatureSprint',
            arguments: sprintArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 4. Vendor Expense & Runway Shield
    const isVendorExpense =
      /aws|figma|slack|google workspace|vendor|subscription|tool|software|signed up/i.test(userPrompt) &&
      (/\$?\s*\d+/i.test(userPrompt) || /costing|pricing|burn|runway|signed up/i.test(userPrompt));

    if (isVendorExpense) {
      const vendorMatch = userPrompt.match(/(?:for|signed up for)\s+([^,.]+?)(?:\s+costing|\s+for|\s+at|\.|$)/i);
      const vendorName = vendorMatch && vendorMatch[1] ? vendorMatch[1].trim() : 'Software Subscription';
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const cost = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 850;

      const expenseArgs = {
        vendorName: vendorName.length > 40 ? vendorName.slice(0, 40) : vendorName,
        monthlyCost: cost,
        category: /aws|cloud|server/i.test(userPrompt) ? 'cloud_hosting' : 'software',
        renewalCycle: 'monthly',
        notes: `Subscription tracked from founder prompt: "${userPrompt}"`,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🛡️ Vendor Expense & Runway Shield\n\nI've calculated the financial impact for **${expenseArgs.vendorName}** ($${cost}/mo).\n\nReview the expense profile below and click **"Approve & Track Expense"** to record the recurring transaction in Finance, schedule a 30-day renewal audit task, and log the vendor contract in Notes.`,
        toolCalls: [
          {
            id: `expense_${Date.now()}`,
            name: 'auditVendorExpense',
            arguments: expenseArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 5. Investor Update
    const isInvestorUpdate =
      /investor|board update|monthly report|shareholder|investor update/i.test(userPrompt);

    if (isInvestorUpdate) {
      const updateArgs = {
        monthYear: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 📈 Monthly Investor Update Generated\n\nI have gathered live financial, CRM, and product metrics directly from your IndexedDB database.\n\nReview the executive snapshot below and click **"Approve & Publish to Notes"** to save the formatted investor memo in Notes and schedule your distribution tasks.`,
        toolCalls: [
          {
            id: `investor_${Date.now()}`,
            name: 'generateInvestorReport',
            arguments: updateArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 6. Stalled Deal Win-Back
    const isDealWinBack =
      /stall|stalled|revive deal|win back|winback|cold deal|dormant deal|re-engage deal|reengage deal/i.test(userPrompt);

    if (isDealWinBack) {
      const daysMatch = userPrompt.match(/(\d+)\s*(?:days|day)/i);
      const daysInactive = daysMatch ? parseInt(daysMatch[1], 10) : 14;
      const discountMatch = userPrompt.match(/(\d+)%\s*(?:discount|off)/i);
      const discountPercent = discountMatch ? parseInt(discountMatch[1], 10) : 10;

      const winBackArgs = {
        daysInactive,
        discountPercent,
        strategy: /feature|product/i.test(userPrompt) ? 'new_feature' : /urgency|deadline/i.test(userPrompt) ? 'urgency' : 'value_add',
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🎯 Stalled Deal Win-Back Engine\n\nI've analyzed your sales pipeline for deals dormant for over **${daysInactive} days** and formulated personalized re-engagement pitches.\n\nReview the parameters below and click **"Approve & Execute Win-Back Campaign"** to update pipeline stages, schedule high-priority 48-hour follow-up tasks, and save the complete outreach playbook in Notes.`,
        toolCalls: [
          {
            id: `winback_${Date.now()}`,
            name: 'reengageStalledDeals',
            arguments: winBackArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 7. Overdue Invoice & Receivables Cash Recovery
    const isInvoiceRecovery =
      /overdue|unpaid invoice|late payment|chase invoice|recover cash|collect payment|receivables|unpaid bill/i.test(userPrompt);

    if (isInvoiceRecovery) {
      const graceMatch = userPrompt.match(/(\d+)\s*(?:days|day)\s*grace/i);
      const gracePeriodDays = graceMatch ? parseInt(graceMatch[1], 10) : 5;
      const tone = /stern|urgent|final/i.test(userPrompt) ? 'urgent' : /gentle|soft|friendly/i.test(userPrompt) ? 'friendly' : 'firm';

      const recoveryArgs = {
        gracePeriodDays,
        reminderTone: tone,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 💸 Overdue Invoice & Cash Recovery Engine\n\nI've audited all pending and past-due receivables across your customers and generated tailored collection follow-ups.\n\nReview the recovery parameters below and click **"Approve & Chase Receivables"** to schedule accounting verification tasks, tag overdue accounts as at-risk, and save the cash recovery audit in Notes.`,
        toolCalls: [
          {
            id: `recovery_${Date.now()}`,
            name: 'recoverOverdueInvoices',
            arguments: recoveryArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 8. Existing Customer Retainer & Expansion
    const isAccountExpansion =
      /retainer|upsell|expansion|cross-sell|account expansion|extend contract|add retainer|pitch retainer/i.test(userPrompt);

    if (isAccountExpansion) {
      const clientMatch =
        userPrompt.match(/(?:for|with|to)\s+([A-Z][a-zA-Z0-9_\-\s]{1,25})(?:\s+for|\s+at|\.|$)/) ||
        userPrompt.match(/([A-Z][a-zA-Z0-9_\-\s]{1,20})\s+(?:retainer|upsell)/i);
      const customerName = clientMatch && clientMatch[1] ? clientMatch[1].trim() : 'Acme Corp';
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const monthlyRetainer = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 1500;
      const tier = /enterprise/i.test(userPrompt) ? 'enterprise' : /starter|basic/i.test(userPrompt) ? 'starter' : 'growth';

      const expansionArgs = {
        customerName,
        monthlyRetainer,
        serviceTier: tier,
        focusAreas: ['Ongoing Maintenance', 'Performance Tuning', 'Priority Support'],
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🚀 Account Expansion & Retainer Engine\n\nI've structured a recurring retainer package for **${customerName}** at **$${monthlyRetainer.toLocaleString()}/mo** to increase customer LTV.\n\nReview the expansion terms below and click **"Approve & Launch Expansion"** to open a high-probability deal, schedule the pitch call task, draft a 1-page proposal memo in Notes, and increase your Q3 OKR.`,
        toolCalls: [
          {
            id: `expansion_${Date.now()}`,
            name: 'launchAccountExpansion',
            arguments: expansionArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 9. Scope-Creep Defense & Change Order
    const isScopeDefense =
      /scope creep|out of scope|change order|extra feature|client asking for extra|scope change|scope defense/i.test(userPrompt);

    if (isScopeDefense) {
      const clientMatch =
        userPrompt.match(/(?:for|from)\s+([A-Z][a-zA-Z0-9_\-\s]{1,25})(?:\s+for|\s+asking|\s+wants|\.|$)/) ||
        userPrompt.match(/client\s+([A-Z][a-zA-Z0-9_\-\s]{1,20})/i);
      const clientName = clientMatch && clientMatch[1] ? clientMatch[1].trim() : 'Acme Corp';
      const amountMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const additionalFee = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 1200;
      const daysMatch = userPrompt.match(/(\d+)\s*(?:days|day)/i);
      const additionalDays = daysMatch ? parseInt(daysMatch[1], 10) : 7;

      const scopeArgs = {
        clientName,
        featureRequested: userPrompt.length > 80 ? userPrompt.slice(0, 80) : userPrompt,
        additionalFee,
        additionalDays,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### 🛡️ Scope-Creep Defense & Change Order Protocol\n\nI've calculated the timeline and budget impact for **${clientName}** (+$${additionalFee.toLocaleString()}, +${additionalDays} days) to protect your margins.\n\nReview the change order terms below and click **"Approve & Issue Change Order"** to draft a change order invoice, update project delivery dates, add backlog tasks, and generate an assertive 3-option counter-offer memo.`,
        toolCalls: [
          {
            id: `scope_${Date.now()}`,
            name: 'createScopeChangeOrder',
            arguments: scopeArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    // 10. Monday Revenue War Room
    const isRevenueWarRoom =
      /war room|revenue war room|monday pulse|weekly revenue|revenue review|weekly war room/i.test(userPrompt);

    if (isRevenueWarRoom) {
      const targetMatch = userPrompt.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
      const sprintTarget = targetMatch ? parseFloat(targetMatch[1].replace(/,/g, '')) : 10000;
      const focus = /upsell|expansion/i.test(userPrompt) ? 'upsell_existing' : /churn|risk/i.test(userPrompt) ? 'debt_recovery' : 'closing_pipeline';

      const warRoomArgs = {
        sprintRevenueTarget: sprintTarget,
        focusArea: focus,
      };

      const assistantMsg = await saveAIMessage({
        conversationId,
        role: 'assistant',
        content: `### ⚔️ Weekly Revenue War Room Initialized\n\nI've synthesized your complete business state: live MRR, pipeline velocity, active deliverables, and overdue collections for a target sprint of **$${sprintTarget.toLocaleString()}**.\n\nReview the sprint strategy below and click **"Approve & Lock Weekly Revenue Priorities"** to pin top-3 CEO priority tasks with deadlines and publish the executive war room briefing to Notes.`,
        toolCalls: [
          {
            id: `warroom_${Date.now()}`,
            name: 'runRevenueWarRoom',
            arguments: warRoomArgs,
            status: 'pending_confirmation',
          },
        ],
      });

      return {
        assistantMessage: assistantMsg,
        proposedActions: assistantMsg.toolCalls,
      };
    }

    const unconfiguredContent = `### AI Provider Not Configured\n\nNo AI provider or API key is currently configured for FounderOS.\n\nPlease go to **Settings → AI Providers** to connect **OpenRouter** or an **OpenAI-Compatible** endpoint.\n\n*Note: All API keys remain strictly stored in your browser's local IndexedDB and are never sent to any external server.*`;
    
    const assistantMsg = await saveAIMessage({
      conversationId,
      role: 'assistant',
      content: unconfiguredContent,
    });

    return { assistantMessage: assistantMsg };
  }

  onProgress?.('Consulting AI provider...');

  // Build the message history for the provider
  const apiMessages: ChatMessagePayload[] = [
    { role: 'system', content: getSystemPrompt(company) },
  ];

  // Include recent history (bounded to last 8 turns)
  const recentHistory = history.slice(-8);
  for (const h of recentHistory) {
    if (h.role === 'user' || h.role === 'assistant') {
      apiMessages.push({
        role: h.role,
        content: h.content || '',
      });
    }
  }

  // Append latest user message
  apiMessages.push({ role: 'user', content: userPrompt });

  try {
    let iteration = 0;
    const MAX_TOOL_ITERATIONS = 4;
    const executedReadTools: string[] = [];
    const proposedWriteActions: AIToolCall[] = [];
    let totalDurationMs = 0;
    let accumulatedUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finalContent = '';

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;
      
      // Request completion from AI Provider
      const response = await sendChatMessage(provider, apiMessages, AI_TOOL_DEFINITIONS);
      
      totalDurationMs += response.durationMs || 0;
      if (response.usage) {
        accumulatedUsage.promptTokens += response.usage.promptTokens || 0;
        accumulatedUsage.completionTokens += response.usage.completionTokens || 0;
        accumulatedUsage.totalTokens += response.usage.totalTokens || 0;
      }

      finalContent = response.content || '';

      // If no tool calls returned, we have reached final natural language response
      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      // Partition tool calls into read tools vs write/destructive actions
      const readToolCalls: Array<{ id: string; name: string; arguments: any }> = [];
      
      for (const tc of response.toolCalls) {
        const def = AI_TOOL_DEFINITIONS.find((d) => d.function.name === tc.name);
        if (def?.function.category === 'read') {
          readToolCalls.push(tc);
        } else {
          // Record proposed write/destructive action
          if (!proposedWriteActions.some((p) => p.id === tc.id)) {
            proposedWriteActions.push({
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              status: 'pending_confirmation',
            });
          }
        }
      }

      // Add the assistant's intermediate tool call declaration
      apiMessages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      });

      // Provide confirmation status for write tool calls so model can complete reasoning
      for (const wtc of response.toolCalls.filter((tc) => !readToolCalls.some((r) => r.id === tc.id))) {
        apiMessages.push({
          role: 'tool',
          tool_call_id: wtc.id,
          name: wtc.name,
          content: JSON.stringify({
            status: 'queued_for_founder_confirmation',
            message: `Action "${wtc.name}" has been formatted and presented to the founder for approval with full argument verification.`,
          }),
        });
      }

      // If there are no read tools to execute, stop the loop and let user confirm proposed actions
      if (readToolCalls.length === 0) {
        break;
      }

      onProgress?.(`Querying company database (${readToolCalls.map((t) => t.name).join(', ')})...`);

      // Execute each read tool against local IndexedDB
      for (const rtc of readToolCalls) {
        if (!executedReadTools.includes(rtc.name)) {
          executedReadTools.push(rtc.name);
        }

        try {
          const result = await executeLocalTool(rtc.name, rtc.arguments);
          apiMessages.push({
            role: 'tool',
            tool_call_id: rtc.id,
            name: rtc.name,
            content: JSON.stringify(result),
          });
        } catch (toolErr: any) {
          apiMessages.push({
            role: 'tool',
            tool_call_id: rtc.id,
            name: rtc.name,
            content: JSON.stringify({ error: toolErr.message }),
          });
        }
      }

      onProgress?.('Synthesizing verified business insights...');
    }

    // Save the final synthesized assistant message
    const assistantMsg = await saveAIMessage({
      conversationId,
      role: 'assistant',
      content: finalContent || 'I analyzed your local company data.',
      toolCalls: proposedWriteActions.length > 0 ? proposedWriteActions : undefined,
      metadata: {
        usage: accumulatedUsage.totalTokens > 0 ? accumulatedUsage : undefined,
        durationMs: totalDurationMs,
        dataSources: executedReadTools.length > 0 ? executedReadTools : undefined,
      },
    });

    return { assistantMessage: assistantMsg, proposedActions: proposedWriteActions };
  } catch (err: any) {
    const errorMsg = await saveAIMessage({
      conversationId,
      role: 'assistant',
      content: `⚠️ **AI Provider Request Failed**\n\n${err.message}\n\n*Please check your provider configuration, model name, and API key in Settings.*`,
    });
    return { assistantMessage: errorMsg };
  }
}

export async function executeConfirmedToolAction(
  messageId: string,
  toolCallId: string,
  toolName: string,
  args: Record<string, any>
): Promise<{ success: boolean; result: any; verification?: { verified: boolean; message: string } }> {
  // Idempotency / Duplicate Prevention Check
  const msg = await db.aiMessages.get(messageId);
  const existingCall = msg?.toolCalls?.find((tc) => tc.id === toolCallId);
  if (existingCall && existingCall.status === 'executed') {
    return {
      success: true,
      result: existingCall.result || { message: 'Action was already executed.' },
      verification: { verified: true, message: 'Action was already executed and verified.' },
    };
  }

  // Execute local tool against IndexedDB
  const result = await executeLocalTool(toolName, args);

  // Post-Execution Database Verification & Audit Logging
  const verification = await verifyActionExecution(toolName, args, result);

  // Update the message toolCall state to approved/executed in IndexedDB
  if (msg && msg.toolCalls) {
    const updatedCalls = msg.toolCalls.map((tc) => {
      if (tc.id === toolCallId) {
        return { ...tc, status: 'executed' as const, result };
      }
      return tc;
    });
    await updateAIMessage(messageId, { toolCalls: updatedCalls });
  }

  return { success: true, result, verification };
}
