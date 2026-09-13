import { db } from '../db';
import type {
  Customer,
  CustomerHealthMetric,
  CustomerHealthQuadrant,
  AccountExpansionOpportunity,
} from '../types';

export class CustomerIntelligenceEngine {
  /**
   * Evaluates all customers in the database and generates updated health metrics & churn risk scores
   */
  static async evaluateAllCustomers(): Promise<CustomerHealthMetric[]> {
    const customers = await db.customers.toArray();
    const invoices = await db.invoices.toArray();
    const bugs = await db.bugs.toArray();

    const results: CustomerHealthMetric[] = [];
    const now = Date.now();

    for (const customer of customers) {
      // 1. Calculate Activity Recency
      let activityRecencyDays = 14;
      if (customer.lastActivityAt) {
        const diffMs = now - new Date(customer.lastActivityAt).getTime();
        activityRecencyDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      // 2. Count Overdue Invoices
      const overdueInvoices = invoices.filter(
        inv => inv.customerId === customer.id && (inv.status === 'overdue' || (inv.status === 'sent' && new Date(inv.dueDate).getTime() < now))
      );

      // 3. Open Critical Bugs associated with this customer
      const cName = customer.companyName.toLowerCase();
      const customerBugs = bugs.filter(
        b => b.status !== 'resolved' && b.severity === 'critical' &&
        (b.title.toLowerCase().includes(cName) || (b.description && b.description.toLowerCase().includes(cName)))
      );
      const openBugsCount = customerBugs.length > 0 ? customerBugs.length : (customer.status === 'at_risk' ? 1 : 0);

      // 4. Calculate Health Score (0 - 100)
      let healthScore = 85;
      const churnRiskFactors: string[] = [];

      // Activity deductions
      if (activityRecencyDays > 30) {
        healthScore -= 30;
        churnRiskFactors.push('No activity recorded in over 30 days');
      } else if (activityRecencyDays > 14) {
        healthScore -= 15;
        churnRiskFactors.push('Engagement dip in the last two weeks');
      }

      // Overdue invoices deductions
      if (overdueInvoices.length > 0) {
        healthScore -= 25 * overdueInvoices.length;
        churnRiskFactors.push(`${overdueInvoices.length} overdue invoice(s) pending payment`);
      }

      // Bug deductions
      if (openBugsCount > 0) {
        healthScore -= 20;
        churnRiskFactors.push('Unresolved critical severity bugs reported');
      }

      if (customer.status === 'churned') {
        healthScore = 5;
        churnRiskFactors.push('Account marked churned');
      }

      healthScore = Math.max(5, Math.min(100, healthScore));
      const churnRiskScore = 100 - healthScore;

      // 5. Quadrant Classification
      let quadrant: CustomerHealthQuadrant = 'loyalist';
      if (healthScore >= 80 && customer.monthlyRevenue >= 2000) {
        quadrant = 'champion';
      } else if (healthScore < 50 || churnRiskScore >= 50) {
        quadrant = 'at_risk';
      } else if (customer.monthlyRevenue >= 3000 && healthScore < 75) {
        quadrant = 'sleeping_giant';
      } else {
        quadrant = 'loyalist';
      }

      // 6. Recommended Intervention
      let recommendedIntervention = 'Maintain standard quarterly executive touchpoint.';
      if (quadrant === 'at_risk') {
        recommendedIntervention = 'Schedule emergency founder 1-on-1 and audit pending payment blockers.';
      } else if (quadrant === 'sleeping_giant') {
        recommendedIntervention = 'Proactively review usage analytics and pitch annual dedicated retainer.';
      } else if (quadrant === 'champion') {
        recommendedIntervention = 'Request case study testimonial and propose multi-seat enterprise upgrade.';
      }

      const metric: CustomerHealthMetric = {
        id: `chm-${customer.id}`,
        customerId: customer.id,
        companyName: customer.companyName,
        mrr: customer.monthlyRevenue || 0,
        plan: customer.plan || 'Standard',
        healthScore,
        churnRiskScore,
        quadrant,
        activityRecencyDays,
        openBugsCount,
        overdueInvoicesCount: overdueInvoices.length,
        npsScore: healthScore > 80 ? 9 : healthScore > 60 ? 7 : 4,
        churnRiskFactors: churnRiskFactors.length > 0 ? churnRiskFactors : ['Healthy steady-state engagement'],
        recommendedIntervention,
        updatedAt: new Date().toISOString(),
      };

      results.push(metric);
      await db.customerHealthScores.put(metric);
    }

    return results;
  }

  /**
   * Discovers top account expansion and upsell opportunities from healthy customer accounts
   */
  static async discoverExpansionOpportunities(): Promise<AccountExpansionOpportunity[]> {
    const healthMetrics = await db.customerHealthScores.toArray();
    const opportunities: AccountExpansionOpportunity[] = [];

    for (const item of healthMetrics) {
      if (item.healthScore >= 70 && item.mrr > 0) {
        const potentialMrr = Math.round(item.mrr * 1.5);
        const upsideArr = (potentialMrr - item.mrr) * 12;

        const opp: AccountExpansionOpportunity = {
          id: `exp-${item.customerId}`,
          customerId: item.customerId,
          companyName: item.companyName,
          currentMrr: item.mrr,
          targetMrr: potentialMrr,
          upsideArr,
          expansionType: item.mrr >= 2500 ? 'retainer' : 'tier_upgrade',
          confidencePct: item.healthScore >= 85 ? 88 : 72,
          strategicAngle: item.mrr >= 2500
            ? 'Account has reached high-volume threshold. Pitch dedicated SLA & engineering sprint retainer.'
            : 'Account is thriving on current tier. Offer 20% savings for annual upfront enterprise commit.',
          suggestedAction: `Draft AI CRO proposal for ${item.companyName} with +$${(potentialMrr - item.mrr).toLocaleString()}/mo upside`,
        };

        opportunities.push(opp);
        await db.expansionOpportunities.put(opp);
      }
    }

    return opportunities;
  }
}
