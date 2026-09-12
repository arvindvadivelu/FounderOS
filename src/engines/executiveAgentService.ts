import { db } from '../db';
import type {
  ExecutiveAgent,
  ExecutiveAgentRole,
  AgentDebateSession,
  DebateMessage,
  ConsensusDecision,
} from '../types';

export const EXECUTIVE_AGENTS: Record<ExecutiveAgentRole, ExecutiveAgent> = {
  ceo: {
    id: 'agent-ceo',
    role: 'ceo',
    name: 'Marcus Vance',
    title: 'Chief Executive Officer',
    avatarColor: '#3b82f6',
    accentBadge: 'Strategy & Capital',
    focusAreas: ['Company Vision', 'Capital Allocation', 'Market Positioning', 'Executive Alignment'],
    keyMetrics: ['Enterprise Valuation', 'Net Burn Multiple', 'Revenue Growth %', 'Runway Runway Months'],
    systemTone: 'Decisive, macro-strategic, focused on asymmetric upside and high-conviction bets.',
  },
  cfo: {
    id: 'agent-cfo',
    role: 'cfo',
    name: 'Elena Rostova',
    title: 'Chief Financial Officer',
    avatarColor: '#10b981',
    accentBadge: 'Treasury & Runway',
    focusAreas: ['Cash Runway', 'Gross Margin', 'Burn Multiple', 'Debt Collection', 'Unit Economics'],
    keyMetrics: ['Cash Balance', 'Default Alive Date', 'CAC Payback Period', 'Overdue AR'],
    systemTone: 'Pragmatic, defensive of cash reserves, skeptical of vanity metrics, ROI-obsessed.',
  },
  cro: {
    id: 'agent-cro',
    role: 'cro',
    name: 'Damian Sterling',
    title: 'Chief Revenue Officer',
    avatarColor: '#f59e0b',
    accentBadge: 'Deals & Velocity',
    focusAreas: ['Pipeline Velocity', 'Contract Expansion', 'Win-Backs', 'Pricing Power', 'Sales Conversion'],
    keyMetrics: ['Weighted Pipeline', 'Quota Attainment', 'Net Dollar Retention', 'Average Deal Size'],
    systemTone: 'Aggressive, commercially driven, customer urgency builder, expansion-oriented.',
  },
  cpo: {
    id: 'agent-cpo',
    role: 'cpo',
    name: 'Aria Chen',
    title: 'Chief Product Officer',
    avatarColor: '#8b5cf6',
    accentBadge: 'Roadmap & RICE',
    focusAreas: ['Product-Market Fit', 'RICE Scoring', 'Feature Adoption', 'User Retention', 'Tech Debt'],
    keyMetrics: ['Feature Adoption %', 'NPS Score', 'Sprint Velocity', 'Churn Due to Product Gaps'],
    systemTone: 'Customer-centric, deeply analytical about engineering leverage and product stickiness.',
  },
  coo: {
    id: 'agent-coo',
    role: 'coo',
    name: 'Julian Thorne',
    title: 'Chief Operating Officer',
    avatarColor: '#ec4899',
    accentBadge: 'Rhythm & Execution',
    focusAreas: ['Operational Cadence', 'Cross-functional Sprints', 'Risk Mitigation', 'Team Bandwidth'],
    keyMetrics: ['Cycle Time', 'Blocked Tasks Count', 'Process Automation Rate', 'Compliance'],
    systemTone: 'Process-disciplined, relentless blocker remover, focused on repeatable operational execution.',
  },
};

export class ExecutiveAgentService {
  /**
   * Retrieves all executive personas
   */
  static getAllAgents(): ExecutiveAgent[] {
    return Object.values(EXECUTIVE_AGENTS);
  }

  /**
   * Deliberates on a strategic question across selected executive personas
   */
  static async startBoardroomDeliberation(
    topic: string,
    question: string,
    participants: ExecutiveAgentRole[] = ['ceo', 'cfo', 'cro', 'cpo', 'coo']
  ): Promise<AgentDebateSession> {
    const timestamp = new Date().toISOString();
    const sessionId = `debate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Read live context from Dexie to ground the agents' deliberation
    const company = await db.companies.toCollection().first();
    const customers = await db.customers.toArray();
    const transactions = await db.transactions.toArray();
    const activeDeals = await db.deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').toArray();

    const mrr = customers.reduce((acc, c) => acc + (c.monthlyRevenue || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const pipelineValue = activeDeals.reduce((acc, d) => acc + d.value, 0);

    const messages: DebateMessage[] = [];

    // 1. CFO Stance
    if (participants.includes('cfo')) {
      const cfoAgent = EXECUTIVE_AGENTS.cfo;
      messages.push({
        id: `msg-cfo-${Date.now()}`,
        role: 'cfo',
        agentName: cfoAgent.name,
        avatarColor: cfoAgent.avatarColor,
        content: `From a balance sheet perspective, our monthly revenue stands at $${mrr.toLocaleString()} while pipeline is $${pipelineValue.toLocaleString()}. Every strategic initiative must be evaluated against our cash runway buffer. If this expansion does not pay back within 90 days, we risk shortening our default-alive horizon.`,
        stance: 'caution',
        keyArguments: [
          'Maintain at least 12 months minimum runway safety net',
          'Strict requirement for positive gross margin on all deliverables',
          'Accelerate invoice receivables before committing to new expenditure',
        ],
        proposedAction: 'Require milestone-based budget releases tied directly to closed ARR milestones.',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. CRO Stance
    if (participants.includes('cro')) {
      const croAgent = EXECUTIVE_AGENTS.cro;
      messages.push({
        id: `msg-cro-${Date.now() + 1}`,
        role: 'cro',
        agentName: croAgent.name,
        avatarColor: croAgent.avatarColor,
        content: `Speed in closing deals is our highest leverage point. We have $${pipelineValue.toLocaleString()} active in pipeline. We need to empower sales to close enterprise tiers with annual prepayment discounts. Reluctance to invest now means ceding market territory to faster competitors.`,
        stance: 'support',
        keyArguments: [
          'Uncap sales velocity with annual upfront cash incentives',
          'Target our top 20% accounts for immediate retainer expansion',
          'Offer high-priority SLA guarantees to unblock enterprise prospects',
        ],
        proposedAction: 'Launch a 14-day pipeline acceleration blitz targeting stalled qualified deals.',
        timestamp: new Date().toISOString(),
      });
    }

    // 3. CPO Stance
    if (participants.includes('cpo')) {
      const cpoAgent = EXECUTIVE_AGENTS.cpo;
      messages.push({
        id: `msg-cpo-${Date.now() + 2}`,
        role: 'cpo',
        agentName: cpoAgent.name,
        avatarColor: cpoAgent.avatarColor,
        content: `We cannot let sales outpace product reality without risking delivery debt and churn. The roadmap must remain anchored to our RICE prioritization. Let us only ship features that directly influence ARR or plug critical churn leakage.`,
        stance: 'neutral',
        keyArguments: [
          'Prioritize top RICE scored features with minimal engineering debt',
          'Fix core retention blockers before opening top-of-funnel floodgates',
          'Validate customer willingness-to-pay before engineering commits',
        ],
        proposedAction: 'Lock Q2 roadmap to the top 3 highest RICE score features with signed customer intent.',
        timestamp: new Date().toISOString(),
      });
    }

    // 4. COO Stance
    if (participants.includes('coo')) {
      const cooAgent = EXECUTIVE_AGENTS.coo;
      messages.push({
        id: `msg-coo-${Date.now() + 3}`,
        role: 'coo',
        agentName: cooAgent.name,
        avatarColor: cooAgent.avatarColor,
        content: `Execution discipline is what translates strategy into EBITDA. Our sprint cycle times are healthy, but context switching across unprioritized ad-hoc requests is hurting throughput. We need clean SLAs between Sales, Product, and Delivery.`,
        stance: 'support',
        keyArguments: [
          'Standardize weekly operating review cadence',
          'Automate routine collection and client check-in workflows',
          'Protect deep engineering focus blocks from ad-hoc sales interruptions',
        ],
        proposedAction: 'Institute automated workflow triggers for deal onboarding and bug escalation.',
        timestamp: new Date().toISOString(),
      });
    }

    // 5. CEO Synthesis & Decision
    const ceoAgent = EXECUTIVE_AGENTS.ceo;
    messages.push({
      id: `msg-ceo-${Date.now() + 4}`,
      role: 'ceo',
      agentName: ceoAgent.name,
      avatarColor: ceoAgent.avatarColor,
      content: `I have listened to CFO's runway guardrails, CRO's pipeline urgency, CPO's product integrity, and COO's execution reality. We will take the aggressive path on revenue while honoring the CFO's cash constraint: upfront annual collections only, no speculative hiring without verified pipeline conversion.`,
      stance: 'support',
      keyArguments: [
        'Aligned executive conviction around capital-efficient ARR expansion',
        'Balanced risk appetite: growth funded by customer cash flow, not runway burn',
        'Unified 30-day cross-functional execution sprint',
      ],
      proposedAction: 'Adopt the hybrid expansion plan with weekly C-suite review check-ins.',
      timestamp: new Date().toISOString(),
    });

    // Synthesize Executive Consensus
    const consensus: ConsensusDecision = {
      summary: `The executive team reached 84% strategic alignment on "${topic}". Growth initiatives will proceed with mandatory annual cash prepayments to protect runway integrity.`,
      alignmentScore: 84,
      unanimousRecommendations: [
        'Mandate annual upfront prepayment on all enterprise expansion contracts',
        'Tie product delivery sprints strictly to ARR-backed RICE priority features',
        'Automate overdue invoice collection and at-risk customer check-ins',
      ],
      risksIdentified: [
        'Sales pipeline slippage could impact monthly cash flow if deals take >45 days',
        'Engineering bandwidth saturation if ad-hoc custom requests bypass the CPO',
      ],
      actionChecklist: [
        { taskTitle: 'Implement annual upfront discount tier (15% discount for 100% upfront cash)', ownerRole: 'cro', priority: 'high' },
        { taskTitle: 'Set automated 7-day invoice chase workflows in motion', ownerRole: 'cfo', priority: 'high' },
        { taskTitle: 'Finalize RICE prioritization sprint for top 3 ARR-generating features', ownerRole: 'cpo', priority: 'medium' },
        { taskTitle: 'Establish weekly Tuesday executive alignment standup', ownerRole: 'coo', priority: 'medium' },
      ],
      cfoVote: 'Approve with cash flow contingency',
      croVote: 'Strong Approve',
      cpoVote: 'Approve with RICE lock',
      cooVote: 'Approve with process SLA',
    };

    const session: AgentDebateSession = {
      id: sessionId,
      topic,
      contextQuestion: question,
      participants,
      status: 'consensus_reached',
      messages,
      consensus,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.agentDebates.add(session);
    return session;
  }
}
