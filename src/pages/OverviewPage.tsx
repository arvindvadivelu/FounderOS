import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Flame,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Plus,
  Clock,
  Briefcase,
  Sun,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { db } from '../db';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { updateTask } from '../db/services/taskProjectService';
import type { Company } from '../types';

interface OverviewPageProps {
  onNavigate: (route: string) => void;
  onOpenAiBriefing: () => void;
  onCreateTask: () => void;
}

/* ------------------------------------------------------------------ */
/* Naturalist Vintage Scientific Plate Illustration (Warm Sepia/Ink) */
/* ------------------------------------------------------------------ */
const NaturalistScientificPlate: React.FC = () => (
  <svg
    width="210"
    height="170"
    viewBox="0 0 210 170"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* Specimen Frame Border */}
    <rect x="6" y="6" width="198" height="158" rx="10" stroke="#cccbc8" strokeWidth="1" strokeDasharray="3 3" />
    <rect x="10" y="10" width="190" height="150" rx="8" stroke="#87867f" strokeWidth="0.75" />

    {/* Botanical Stems & Leaves */}
    <path d="M40 145C45 110 35 75 75 45" stroke="#87867f" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M50 115C65 110 70 120 70 120C65 130 50 125 50 115Z" fill="#e3dacc" stroke="#87867f" strokeWidth="1" />
    <path d="M44 85C30 80 25 90 25 90C30 100 45 95 44 85Z" fill="#e3dacc" stroke="#87867f" strokeWidth="1" />

    {/* Naturalist Specimen Moth / Butterfly */}
    <g transform="translate(105, 80)">
      {/* Upper Wings */}
      <path
        d="M0 -4C14 -32 48 -44 68 -24C78 -12 70 14 36 10C16 8 0 0 0 -4Z"
        fill="#faf9f5"
        stroke="#141413"
        strokeWidth="1.4"
      />
      <path
        d="M0 -4C-14 -32 -48 -44 -68 -24C-78 -12 -70 14 -36 10C-16 8 0 0 0 -4Z"
        fill="#faf9f5"
        stroke="#141413"
        strokeWidth="1.4"
      />
      {/* Lower Wings */}
      <path
        d="M0 4C18 10 44 22 42 42C40 56 22 58 8 40C2 32 0 16 0 4Z"
        fill="#e3dacc"
        stroke="#141413"
        strokeWidth="1.2"
      />
      <path
        d="M0 4C-18 10 -44 22 -42 42C-40 56 -22 58 -8 40C-2 32 0 16 0 4Z"
        fill="#e3dacc"
        stroke="#141413"
        strokeWidth="1.2"
      />
      {/* Wing Patterns */}
      <circle cx="44" cy="-14" r="5" stroke="#141413" strokeWidth="1" fill="#f5e3c7" />
      <circle cx="-44" cy="-14" r="5" stroke="#141413" strokeWidth="1" fill="#f5e3c7" />
      <circle cx="22" cy="34" r="3" stroke="#141413" strokeWidth="0.8" fill="#faf9f5" />
      <circle cx="-22" cy="34" r="3" stroke="#141413" strokeWidth="0.8" fill="#faf9f5" />
      {/* Specimen Body */}
      <ellipse cx="0" cy="5" rx="3.5" ry="24" fill="#141413" />
      {/* Antennae */}
      <path d="M-2 -18C-10 -32 -22 -36 -28 -34" stroke="#141413" strokeWidth="1" strokeLinecap="round" />
      <path d="M2 -18C10 -32 22 -36 28 -34" stroke="#141413" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Taxonomic Field Plate Notation */}
    <text x="18" y="152" fontFamily="Georgia, serif" fontSize="9" fill="#87867f" fontStyle="italic">
      Fig. 1 — FounderOS Autonomous Core (Anthropic Journal)
    </text>
  </svg>
);

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onOpenAiBriefing,
  onCreateTask,
}) => {
  const company = useLiveQuery<Company | undefined>(async () => {
    const list = await db.companies.toArray();
    return list[0];
  }, []);

  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), []) || [];
  const transactions = useLiveQuery(async () => await db.transactions.toArray(), []) || [];
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];
  const bugs = useLiveQuery(async () => await db.bugs.toArray(), []) || [];
  const features = useLiveQuery(async () => await db.features.toArray(), []) || [];
  const activities = useLiveQuery(
    async () => {
      const list = await db.activities.toArray();
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
    },
    []
  ) || [];

  const defaultProvider = useLiveQuery(async () => {
    const providers = await db.aiProviders.toArray();
    return providers.find((p) => p.isDefault) || providers[0];
  }, []);

  // Compute key metrics
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const mrr = activeCustomers.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const arr = mrr * 12;

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }

  const netProfit = totalIncome - totalExpenses;
  const hasData = transactions.length > 0 || mrr > 0;
  const estimatedCash = hasData ? Math.max(0, 150000 + netProfit) : 0;
  const monthlyBurn = totalExpenses;
  let runwayMonths = 0;
  if (hasData && monthlyBurn > 0 && estimatedCash > 0) {
    runwayMonths = Math.round((estimatedCash / monthlyBurn) * 10) / 10;
  } else if (hasData && monthlyBurn === 0 && estimatedCash > 0) {
    runwayMonths = 99;
  }

  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const todayTasks = openTasks.filter((t) => t.dueDate === today || t.priority === 'critical' || t.priority === 'high');

  const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'resolved');
  const inProgressFeatures = features.filter((f) => f.status === 'in_progress');

  const currency = company?.currency || 'USD';

  const handleToggleTask = async (task: any) => {
    await updateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
    });
  };

  return (
    <div
      style={{
        backgroundColor: '#f0eee6', // Ivory Medium (Page Canvas)
        margin: '-24px',
        padding: '40px 48px 100px',
        minHeight: '100vh',
        color: '#141413', // Slate Dark
        fontFamily: "'Anthropic Sans', 'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '56px' }}>
        {/* ========================================================== */}
        {/* HERO HEADING BLOCK (Asymmetric Two-Column Composition)     */}
        {/* ========================================================== */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'end',
            paddingTop: '16px',
          }}
        >
          {/* Left Column: Declarative Sans Display Heading */}
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '-0.24px',
                textTransform: 'uppercase',
                color: '#87867f', // Cloud Dark
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Volume IV &bull; Executive Dispatch</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d97757' }} />
              <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <h1
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#141413', // Slate Dark
                lineHeight: 1.08,
                letterSpacing: '-0.12px',
                margin: 0,
              }}
            >
              Autonomous intelligence for{' '}
              <a
                href="#/settings"
                style={{
                  color: '#141413',
                  textDecoration: 'underline',
                  textUnderlineOffset: '6px',
                  textDecorationThickness: '1.5px',
                }}
              >
                {company?.name || 'Your Company'}
              </a>
              .
            </h1>
          </div>

          {/* Right Column: Editorial Serif Voice & Single Clay CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p
              style={{
                fontFamily: "'Anthropic Serif', Georgia, Cambria, 'Times New Roman', serif",
                fontSize: '20px',
                lineHeight: 1.45,
                color: '#141413',
                margin: 0,
              }}
            >
              The enterprise is operating across active customer contracts, pipeline opportunities, and cloud systems.
              Review the day's synthesis or command autonomous operations below.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Canonical Single Clay CTA */}
              <button
                type="button"
                onClick={onOpenAiBriefing}
                style={{
                  backgroundColor: '#d97757', // Clay
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 30px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c6613f')} // Clay Deep
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d97757')}
              >
                <Sparkles size={16} /> Open AI CEO Briefing
              </button>

              {/* Filled Ivory Button with signature bottom-only 8px radius */}
              <button
                type="button"
                onClick={() => onNavigate('/morning-intelligence')}
                style={{
                  backgroundColor: '#faf9f5', // Ivory Light
                  color: '#141413',
                  border: '1px solid #cccbc8',
                  borderRadius: '0px 0px 8px 8px', // Signature bottom-only radius
                  padding: '12px 26px',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5e3c7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#faf9f5')}
              >
                <Sun size={15} color="#87867f" /> Morning Journal &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* FEATURED HERO CARD (Manilla Paper Tone #f5e3c7)           */}
        {/* ========================================================== */}
        <section
          style={{
            backgroundColor: '#f5e3c7', // Manilla
            borderRadius: '24px',
            padding: '40px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '-0.24px',
                textTransform: 'uppercase',
                color: '#87867f',
                marginBottom: '12px',
              }}
            >
              <BookOpen size={14} /> Field Monograph &bull; Executive Status
            </div>

            <h2
              style={{
                fontFamily: "'Anthropic Serif', Georgia, serif",
                fontSize: '32px',
                fontWeight: 600,
                color: '#141413',
                lineHeight: 1.25,
                margin: '0 0 16px',
              }}
            >
              Enterprise Health: Operating at {formatCurrency(mrr, currency)} monthly recurring revenue
            </h2>

            <p
              style={{
                fontFamily: "'Anthropic Serif', Georgia, serif",
                fontSize: '18px',
                lineHeight: 1.5,
                color: '#141413',
                maxWidth: '680px',
                margin: '0 0 24px',
              }}
            >
              With approximately <strong>{runwayMonths} months</strong> of estimated cash runway and{' '}
              <strong>{activeCustomers.length} active enterprise client(s)</strong>, current capital reserves are{' '}
              <a
                href="#/finance"
                style={{
                  color: '#141413',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                {runwayMonths > 12 ? 'stable and well-provisioned' : 'approaching active re-capitalization'}
              </a>
              . Pipeline velocity tracks <strong>{openDeals.length} active opportunities</strong> valued at{' '}
              <strong>{formatCurrency(pipelineValue, currency)}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <a
                href="#/finance"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#141413',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                Inspect Cash & Ledgers &rarr;
              </a>
              <a
                href="#/kpis"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#141413',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                KPI Ratio Analysis &rarr;
              </a>
            </div>
          </div>

          {/* Naturalist Scientific Plate Illustration */}
          <NaturalistScientificPlate />
        </section>

        {/* ========================================================== */}
        {/* PRIMARY METRICS MATRIX (Ivory Light Cards, 24px Radius)   */}
        {/* ========================================================== */}
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: '1px solid #cccbc8', // Stone divider
              paddingBottom: '12px',
              marginBottom: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '-0.24px',
                textTransform: 'uppercase',
                color: '#87867f',
                margin: 0,
              }}
            >
              Table I &bull; Vital Signs & Capital Flux
            </h3>
            <span style={{ fontSize: '13px', color: '#87867f' }}>
              Reporting Unit: <strong style={{ color: '#141413' }}>{currency}</strong>
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Card 1: MRR */}
            <div
              style={{
                backgroundColor: '#faf9f5', // Ivory Light
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid #cccbc8',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#87867f', textTransform: 'uppercase', letterSpacing: '-0.24px' }}>
                  Contracted MRR
                </div>
                <div style={{ fontSize: '38px', fontWeight: 700, color: '#141413', margin: '10px 0 4px', letterSpacing: '-0.05px' }}>
                  {formatCurrency(mrr, currency)}
                </div>
                <div style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '16px', color: '#87867f' }}>
                  Annualized Run-Rate: {formatCurrency(arr, currency)}
                </div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cccbc8', fontSize: '13px' }}>
                <a href="#/customers" style={{ color: '#141413', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  {activeCustomers.length} active client accounts &rarr;
                </a>
              </div>
            </div>

            {/* Card 2: Monthly Burn */}
            <div
              style={{
                backgroundColor: '#faf9f5',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid #cccbc8',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#87867f', textTransform: 'uppercase', letterSpacing: '-0.24px' }}>
                  Monthly Outflows
                </div>
                <div style={{ fontSize: '38px', fontWeight: 700, color: '#141413', margin: '10px 0 4px', letterSpacing: '-0.05px' }}>
                  {formatCurrency(totalExpenses, currency)}
                </div>
                <div style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '16px', color: '#87867f' }}>
                  Cloud, inference APIs, operating costs
                </div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cccbc8', fontSize: '13px' }}>
                <a href="#/finance" style={{ color: '#141413', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Breakdown expense accounts &rarr;
                </a>
              </div>
            </div>

            {/* Card 3: Cash Runway */}
            <div
              style={{
                backgroundColor: '#faf9f5',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid #cccbc8',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#87867f', textTransform: 'uppercase', letterSpacing: '-0.24px' }}>
                  Cash Runway
                </div>
                <div style={{ fontSize: '38px', fontWeight: 700, color: '#141413', margin: '10px 0 4px', letterSpacing: '-0.05px' }}>
                  {runwayMonths} Months
                </div>
                <div style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '16px', color: '#87867f' }}>
                  Available Reserves: {formatCurrency(estimatedCash, currency)}
                </div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cccbc8', fontSize: '13px' }}>
                <span style={{ color: runwayMonths > 12 ? '#141413' : '#d97757', fontWeight: 600 }}>
                  {runwayMonths > 12 ? '● Adequate Horizon' : '▲ Action Recommended'}
                </span>
              </div>
            </div>

            {/* Card 4: Sales Pipeline */}
            <div
              style={{
                backgroundColor: '#faf9f5',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid #cccbc8',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#87867f', textTransform: 'uppercase', letterSpacing: '-0.24px' }}>
                  Active Deals Flow
                </div>
                <div style={{ fontSize: '38px', fontWeight: 700, color: '#141413', margin: '10px 0 4px', letterSpacing: '-0.05px' }}>
                  {formatCurrency(pipelineValue, currency)}
                </div>
                <div style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '16px', color: '#87867f' }}>
                  {openDeals.length} opportunities under negotiation
                </div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cccbc8', fontSize: '13px' }}>
                <a href="#/sales" style={{ color: '#141413', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Open pipeline kanban &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* TWO-COLUMN EDITORIAL SECTIONS: TASKS & OPERATIONS          */}
        {/* ========================================================== */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Left Column: Priority Focus Journal */}
          <div
            style={{
              backgroundColor: '#faf9f5', // Ivory Light
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid #cccbc8',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1px solid #cccbc8',
                paddingBottom: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#141413', margin: 0 }}>
                  Immediate Directives ({todayTasks.length})
                </h3>
                <span style={{ fontSize: '12px', color: '#87867f' }}>High-leverage operations for today</span>
              </div>
              <button
                type="button"
                onClick={onCreateTask}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #87867f',
                  borderRadius: '12px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#141413',
                  cursor: 'pointer',
                }}
              >
                + Enqueue Directive
              </button>
            </div>

            {overdueTasks.length > 0 && (
              <div
                style={{
                  backgroundColor: '#f5e3c7', // Manilla warning tone
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cccbc8',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#141413',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} color="#d97757" />
                <span>
                  <strong>{overdueTasks.length} directive(s)</strong> have passed their scheduled target date.
                </span>
              </div>
            )}

            {todayTasks.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#87867f' }}>
                <p style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '18px', margin: 0 }}>
                  All scheduled directives are in order. No pending urgent items.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#f0eee6', // Ivory Medium
                      border: '1px solid #cccbc8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => handleToggleTask(t)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#141413' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: t.status === 'done' ? '#87867f' : '#141413',
                            textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#87867f', marginTop: '2px' }}>
                          {t.projectName && <span>{t.projectName} &bull; </span>}
                          {t.dueDate && <span>Due {formatDate(t.dueDate)}</span>}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cccbc8',
                        color: '#141413',
                      }}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cccbc8', textAlign: 'center' }}>
              <a
                href="#/tasks"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#141413',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                Inspect all {openTasks.length} queued directives &rarr;
              </a>
            </div>
          </div>

          {/* Right Column: AI Model Velocity & Pipeline Brief */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* AI Model Core */}
            <div
              style={{
                backgroundColor: '#faf9f5',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid #cccbc8',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderBottom: '1px solid #cccbc8',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#141413', margin: 0 }}>
                  Autonomous Model Engine
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: defaultProvider?.apiKey ? '#141413' : '#d97757',
                  }}
                >
                  {defaultProvider?.apiKey ? '● Engine Online' : '▲ Config Required'}
                </span>
              </div>

              <p
                style={{
                  fontFamily: "'Anthropic Serif', Georgia, serif",
                  fontSize: '16px',
                  color: '#141413',
                  lineHeight: 1.45,
                  margin: '0 0 16px',
                }}
              >
                Configured with <strong>{defaultProvider?.name || 'Local System'}</strong> running model{' '}
                <code style={{ fontSize: '13px', backgroundColor: '#f0eee6', padding: '2px 6px', borderRadius: '4px' }}>
                  {defaultProvider?.model || 'gpt-4o / claude-3-5-sonnet'}
                </code>
                . AI agents monitor financials, audit transaction reconciliation, and synthesize executive intelligence.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#e3dacc' }}>
                  <div style={{ fontSize: '11px', color: '#87867f', fontWeight: 600 }}>PRODUCT INITIATIVES</div>
                  <div style={{ fontWeight: 600, color: '#141413', marginTop: '2px' }}>
                    {inProgressFeatures.length} Active in progress
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#e3dacc' }}>
                  <div style={{ fontSize: '11px', color: '#87867f', fontWeight: 600 }}>CRITICAL INCIDENTS</div>
                  <div style={{ fontWeight: 600, color: criticalBugs.length > 0 ? '#d97757' : '#141413', marginTop: '2px' }}>
                    {criticalBugs.length} Unresolved bugs
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Snippet */}
            <div
              style={{
                backgroundColor: '#faf9f5',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid #cccbc8',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderBottom: '1px solid #cccbc8',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#141413', margin: 0 }}>
                  Pipeline Opportunities ({openDeals.length})
                </h3>
                <a href="#/sales" style={{ fontSize: '13px', color: '#141413', textDecoration: 'underline' }}>
                  Kanban &rarr;
                </a>
              </div>

              {openDeals.length === 0 ? (
                <div style={{ padding: '20px 0', color: '#87867f', fontSize: '14px' }}>
                  No active opportunities recorded in sales pipeline.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {openDeals.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#f0eee6',
                        border: '1px solid #cccbc8',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#141413' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: '#87867f' }}>{d.customerName || 'Inbound prospect'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#141413' }}>
                          {formatCurrency(d.value, currency)}
                        </div>
                        <span style={{ fontSize: '11px', color: '#87867f' }}>{d.stage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* OPERATIONAL ACTIVITY FEED (Scientific Journal Style)        */}
        {/* ========================================================== */}
        <section
          style={{
            backgroundColor: '#faf9f5', // Ivory Light
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid #cccbc8',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: '1px solid #cccbc8',
              paddingBottom: '12px',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#141413', margin: 0 }}>
                Chronicle of System Actions
              </h3>
              <span style={{ fontSize: '12px', color: '#87867f' }}>Chronological ledger of operational events</span>
            </div>
            <span style={{ fontSize: '12px', color: '#87867f' }}>Local IndexedDB Stream</span>
          </div>

          {activities.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#87867f' }}>
              <p style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '16px', margin: 0 }}>
                No historical events logged yet. Actions will populate here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f0eee6',
                    border: '1px solid #cccbc8',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#d97757', // Clay dot
                      }}
                    />
                    <span style={{ color: '#141413', fontWeight: 500 }}>{act.title}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#87867f', flexShrink: 0 }}>
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================== */}
        {/* CLOSING DARK FOOTER INVERSION BAND (#141413 Slate Dark)    */}
        {/* ========================================================== */}
        <footer
          style={{
            backgroundColor: '#141413', // Slate Dark
            color: '#faf9f5', // Ivory Light text
            borderRadius: '24px',
            padding: '40px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#b0aea5', textTransform: 'uppercase' }}>
              FounderOS &bull; Field Journal Edition
            </div>
            <div style={{ fontFamily: "'Anthropic Serif', Georgia, serif", fontSize: '20px', color: '#faf9f5', marginTop: '6px' }}>
              Autonomous operations, quiet intelligence, local privacy.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
            <a href="#/finance" style={{ color: '#faf9f5', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              Financial Ledgers
            </a>
            <a href="#/sales" style={{ color: '#faf9f5', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              Sales Pipeline
            </a>
            <a href="#/customers" style={{ color: '#faf9f5', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              Customers
            </a>
            <a href="#/tasks" style={{ color: '#faf9f5', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              Directives
            </a>
            <a href="#/settings" style={{ color: '#faf9f5', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
              Settings
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
