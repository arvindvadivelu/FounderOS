import { db } from '../db';
import type {
  ForecastScenario,
  HiringPlanRole,
  MonthlyProjection,
  ScenarioProjectionResult,
} from '../types';

export class FinancialForecastEngine {
  /**
   * Generates a 12-month projection for a given scenario, including active hiring plan costs
   */
  static generateProjection(
    scenario: ForecastScenario,
    currentCash: number,
    currentMrr: number,
    baseMonthlyExpenses: number,
    hiringPlan: HiringPlanRole[] = [],
    monthsCount: number = 12
  ): ScenarioProjectionResult {
    const projections: MonthlyProjection[] = [];
    let cash = currentCash;
    let mrr = currentMrr;
    let breakevenMonth: string | undefined = undefined;
    let totalHiringCostFirst12Mo = 0;

    const now = new Date();

    for (let i = 1; i <= monthsCount; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

      // Calculate new MRR: growth minus churn
      const netGrowthRate = (scenario.mrrGrowthRatePct - scenario.churnRatePct) / 100;
      mrr = Math.round(mrr * (1 + netGrowthRate));

      // Revenue with gross margin applied (if defined)
      const projectedRevenue = Math.round(mrr * (scenario.grossMarginPct / 100));

      // Active hiring additions for this month
      let hiringExpenses = 0;
      for (const hire of hiringPlan) {
        if (hire.status !== 'frozen') {
          // If start date is on or before this projection month
          const hireDate = new Date(hire.startDate);
          if (monthDate >= hireDate) {
            hiringExpenses += hire.monthlySalary;
          }
        }
      }
      totalHiringCostFirst12Mo += hiringExpenses;

      const totalExpenses = (scenario.monthlyBurnOverride || baseMonthlyExpenses) + hiringExpenses;
      const netBurn = totalExpenses - projectedRevenue;

      cash = cash - netBurn;
      const runwayMonthsRemaining = netBurn > 0 ? Number((cash / netBurn).toFixed(1)) : 99;

      if (projectedRevenue >= totalExpenses && !breakevenMonth) {
        breakevenMonth = monthLabel;
      }

      projections.push({
        monthIndex: i,
        monthLabel,
        projectedMrr: mrr,
        projectedRevenue,
        baseExpenses: scenario.monthlyBurnOverride || baseMonthlyExpenses,
        hiringExpenses,
        totalExpenses,
        netBurn,
        endingCash: Math.round(cash),
        runwayMonthsRemaining: Math.max(0, runwayMonthsRemaining),
      });
    }

    const currentNetBurn = (scenario.monthlyBurnOverride || baseMonthlyExpenses) - (currentMrr * (scenario.grossMarginPct / 100));
    const runwayMonths = currentNetBurn > 0 ? Number((currentCash / currentNetBurn).toFixed(1)) : 99;

    let cashExhaustionDate: string | undefined = undefined;
    const zeroCashMonth = projections.find(p => p.endingCash <= 0);
    if (zeroCashMonth) {
      cashExhaustionDate = zeroCashMonth.monthLabel;
    }

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      currentCash,
      currentMrr,
      projections,
      runwayMonths,
      breakevenMonth,
      totalHiringCostFirst12Mo,
      cashExhaustionDate,
    };
  }

  /**
   * Generates comparison across Base, Best, and Worst case scenarios
   */
  static generateScenarioComparison(
    currentCash: number,
    currentMrr: number,
    baseBurn: number,
    hiringPlan: HiringPlanRole[] = []
  ): Record<'base' | 'best' | 'worst', ScenarioProjectionResult> {
    const baseScenario: ForecastScenario = {
      id: 'sc-base',
      name: 'Base Case (Expected)',
      type: 'base',
      description: 'Steady realistic growth matching current pipeline velocity and churn baseline.',
      mrrGrowthRatePct: 8,
      churnRatePct: 2,
      grossMarginPct: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bestScenario: ForecastScenario = {
      id: 'sc-best',
      name: 'Best Case (Aggressive Growth)',
      type: 'best',
      description: 'Accelerated outbound sales conversion, negative net revenue churn, and enterprise upgrades.',
      mrrGrowthRatePct: 15,
      churnRatePct: 0.8,
      grossMarginPct: 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const worstScenario: ForecastScenario = {
      id: 'sc-worst',
      name: 'Worst Case (Bear Market)',
      type: 'worst',
      description: 'Sales cycles lengthen by 50%, increased churn pressure, and higher cost inflation.',
      mrrGrowthRatePct: 3,
      churnRatePct: 4.5,
      grossMarginPct: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      base: this.generateProjection(baseScenario, currentCash, currentMrr, baseBurn, hiringPlan),
      best: this.generateProjection(bestScenario, currentCash, currentMrr, baseBurn, hiringPlan),
      worst: this.generateProjection(worstScenario, currentCash, currentMrr, baseBurn, hiringPlan),
    };
  }

  /**
   * Calculates hiring sensitivity: how adding a specific role impacts runway
   */
  static calculateHiringImpact(
    currentCash: number,
    currentBurn: number,
    monthlySalary: number
  ): { runwayWithoutHire: number; runwayWithHire: number; runwayDeltaMonths: number } {
    const runwayWithoutHire = currentBurn > 0 ? currentCash / currentBurn : 99;
    const newBurn = currentBurn + monthlySalary;
    const runwayWithHire = newBurn > 0 ? currentCash / newBurn : 99;
    const delta = runwayWithoutHire - runwayWithHire;

    return {
      runwayWithoutHire: Number(runwayWithoutHire.toFixed(1)),
      runwayWithHire: Number(runwayWithHire.toFixed(1)),
      runwayDeltaMonths: Number(delta.toFixed(1)),
    };
  }
}
