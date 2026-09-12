import { db } from '../db';
import type {
  ProductRiceScore,
  RiceQuadrant,
  FeedbackCluster,
  Feature,
  Bug,
} from '../types';

export class ProductIntelligenceEngine {
  /**
   * Computes RICE scores and matrix classification for features
   */
  static calculateRice(
    reach: number,
    impact: number,
    confidence: number,
    effort: number
  ): { riceScore: number; quadrant: RiceQuadrant } {
    const safeEffort = Math.max(0.5, effort);
    // Standard RICE formula: (Reach * Impact * (Confidence / 100)) / Effort
    const score = Math.round((reach * impact * (confidence / 100)) / safeEffort * 10);

    let quadrant: RiceQuadrant = 'fill_in';
    if (impact >= 3 && effort <= 3) {
      quadrant = 'quick_win';
    } else if (impact >= 3 && effort > 3) {
      quadrant = 'major_bet';
    } else if (impact < 3 && effort <= 3) {
      quadrant = 'fill_in';
    } else {
      quadrant = 'time_sink';
    }

    return { riceScore: score, quadrant };
  }

  /**
   * Analyzes current product backlog and syncs RICE prioritizations
   */
  static async syncBacklogPriorities(): Promise<ProductRiceScore[]> {
    const features = await db.features.toArray();
    const priorities: ProductRiceScore[] = [];

    // Pre-calculated or baseline values for demo roadmap
    const sampleFeatures = [
      {
        title: 'One-Click Stripe Billing & Auto-Receipts',
        category: 'core' as const,
        reach: 8,
        impact: 5,
        confidence: 90,
        effort: 2,
        arrInfluenceEstimate: 48000,
        engineeringEffortDays: 6,
        status: 'in_progress' as const,
        suggestedQuarter: 'Q1',
      },
      {
        title: 'Multi-Seat Role-Based Access Controls (RBAC)',
        category: 'growth' as const,
        reach: 9,
        impact: 4,
        confidence: 85,
        effort: 4,
        arrInfluenceEstimate: 72000,
        engineeringEffortDays: 12,
        status: 'planned' as const,
        suggestedQuarter: 'Q2',
      },
      {
        title: 'Autonomous Webhook Notification Dispatcher',
        category: 'infrastructure' as const,
        reach: 6,
        impact: 3,
        confidence: 95,
        effort: 1.5,
        arrInfluenceEstimate: 24000,
        engineeringEffortDays: 4,
        status: 'backlog' as const,
        suggestedQuarter: 'Q1',
      },
      {
        title: 'AI Executive Boardroom Audio Synthesis',
        category: 'growth' as const,
        reach: 5,
        impact: 4,
        confidence: 70,
        effort: 6,
        arrInfluenceEstimate: 36000,
        engineeringEffortDays: 18,
        status: 'idea' as const,
        suggestedQuarter: 'Q3',
      },
      {
        title: 'Custom CSV Bulk Exporter & Importer',
        category: 'retention' as const,
        reach: 7,
        impact: 2,
        confidence: 90,
        effort: 1,
        arrInfluenceEstimate: 12000,
        engineeringEffortDays: 3,
        status: 'released' as const,
        suggestedQuarter: 'Q1',
      },
    ];

    for (let i = 0; i < sampleFeatures.length; i++) {
      const item = sampleFeatures[i];
      const { riceScore, quadrant } = this.calculateRice(item.reach, item.impact, item.confidence, item.effort);

      const riceItem: ProductRiceScore = {
        id: `rice-${i + 1}`,
        title: item.title,
        category: item.category,
        reach: item.reach,
        impact: item.impact,
        confidence: item.confidence,
        effort: item.effort,
        riceScore,
        quadrant,
        arrInfluenceEstimate: item.arrInfluenceEstimate,
        engineeringEffortDays: item.engineeringEffortDays,
        status: item.status,
        suggestedQuarter: item.suggestedQuarter,
      };

      priorities.push(riceItem);
      await db.productPriorities.put(riceItem);
    }

    return priorities.sort((a, b) => b.riceScore - a.riceScore);
  }

  /**
   * Retrieves synthesized customer feedback clusters
   */
  static getFeedbackClusters(): FeedbackCluster[] {
    return [
      {
        id: 'fc-1',
        topic: 'Real-time Payment Webhook Reliability',
        customerMentionsCount: 14,
        associatedArr: 54000,
        sentiment: 'frustrated',
        sampleQuotes: [
          '"We need immediate alerts when customer subscription fails to charge."',
          '"Auto-retrying failed invoices would save us 5 hours a week."',
        ],
        suggestedRoadmapAction: 'Fast-track Automated Webhook Notification & Retry Engine',
        priority: 'critical',
      },
      {
        id: 'fc-2',
        topic: 'Executive Boardroom Scenario Simulations',
        customerMentionsCount: 9,
        associatedArr: 38000,
        sentiment: 'positive',
        sampleQuotes: [
          '"Being able to see CFO and CRO debate our runway tradeoff is a gamechanger."',
          '"Need exportable hiring impact graphs for our seed board meeting."',
        ],
        suggestedRoadmapAction: 'Add 1-click PDF/CSV export to Financial Scenario Modeling',
        priority: 'high',
      },
      {
        id: 'fc-3',
        topic: 'Dark Mode Contrast & Mobile Usability',
        customerMentionsCount: 6,
        associatedArr: 16000,
        sentiment: 'neutral',
        sampleQuotes: [
          '"Looks great on desktop, sidebar requires better drawer sliding on iPhone."',
        ],
        suggestedRoadmapAction: 'Refine responsive touch target spacing in AppShell',
        priority: 'medium',
      },
    ];
  }
}
