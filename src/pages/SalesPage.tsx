import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Award,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  Search,
  Filter,
  Zap,
  Target,
  Sparkles,
  Calendar,
  Layers,
  BarChart3,
} from 'lucide-react';
import { db } from '../db';
import { createDeal, updateDeal, deleteDeal } from '../db/services/dealService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Deal, DealStage } from '../types';

/* ------------------------------------------------------------------ */
/* Family Mascot Illustration Clusters (Flat SVG with #343433 Strokes) */
/* ------------------------------------------------------------------ */
const FamilyLeftMascotCluster: React.FC = () => (
  <svg
    width="160"
    height="140"
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* Confetti shapes */}
    <circle cx="20" cy="20" r="7" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />
    <path d="M125 18L129 28L139 29L131 36L133 46L125 41L117 46L119 36L111 29L121 28Z" fill="#ff58ae" stroke="#343433" strokeWidth="1.5" />
    <rect x="18" y="105" width="14" height="14" rx="3" transform="rotate(25 18 105)" fill="#64c6ff" stroke="#343433" strokeWidth="1.5" />

    {/* Green Smiling Blob Character */}
    <path
      d="M32 80C32 60 48 48 70 48C92 48 106 60 106 80C106 104 90 118 70 118C50 118 32 104 32 80Z"
      fill="#00c978"
      stroke="#343433"
      strokeWidth="2"
    />
    {/* Blob Eyes & Smile */}
    <circle cx="58" cy="74" r="3.5" fill="#343433" />
    <circle cx="82" cy="74" r="3.5" fill="#343433" />
    <path d="M64 88C67 92 73 92 76 88" stroke="#343433" strokeWidth="2" strokeLinecap="round" />
    {/* Tiny Stick Limbs */}
    <path d="M38 98L22 110" stroke="#343433" strokeWidth="2" strokeLinecap="round" />
    <path d="M100 98L116 110" stroke="#343433" strokeWidth="2" strokeLinecap="round" />

    {/* Flower Mascot with Square Face */}
    <g transform="translate(85, 20)">
      {/* Petals */}
      <circle cx="35" cy="18" r="14" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />
      <circle cx="52" cy="35" r="14" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />
      <circle cx="35" cy="52" r="14" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />
      <circle cx="18" cy="35" r="14" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />
      {/* Square Center Face */}
      <rect x="23" y="23" width="24" height="24" rx="6" fill="#fbfaf9" stroke="#343433" strokeWidth="2" />
      <circle cx="30" cy="33" r="2" fill="#343433" />
      <circle cx="40" cy="33" r="2" fill="#343433" />
      <path d="M32 39C34 41 36 41 38 39" stroke="#343433" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

const FamilyRightMascotCluster: React.FC = () => (
  <svg
    width="160"
    height="140"
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* Confetti shapes */}
    <circle cx="140" cy="30" r="8" fill="#64c6ff" stroke="#343433" strokeWidth="1.5" />
    <rect x="20" y="24" width="12" height="12" rx="3" fill="#ff3e00" stroke="#343433" strokeWidth="1.5" />
    <circle cx="130" cy="115" r="6" fill="#ffcd6c" stroke="#343433" strokeWidth="1.5" />

    {/* Yellow Triangle Mascot */}
    <path
      d="M75 35L118 108C121 113 117 120 110 120H40C33 120 29 113 32 108L75 35Z"
      fill="#ffcd6c"
      stroke="#343433"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Eyes & Smile */}
    <circle cx="67" cy="82" r="3.5" fill="#343433" />
    <circle cx="83" cy="82" r="3.5" fill="#343433" />
    <path d="M71 96C73 99 77 99 79 96" stroke="#343433" strokeWidth="2" strokeLinecap="round" />
    {/* Rosy Cheeks */}
    <circle cx="61" cy="88" r="3" fill="#ff58ae" />
    <circle cx="89" cy="88" r="3" fill="#ff58ae" />

    {/* Small Blue Companion with Ears */}
    <g transform="translate(100, 75)">
      <circle cx="22" cy="28" r="18" fill="#64c6ff" stroke="#343433" strokeWidth="2" />
      {/* Ears */}
      <path d="M10 16L14 7L20 12" fill="#64c6ff" stroke="#343433" strokeWidth="2" />
      <path d="M24 12L30 7L34 16" fill="#64c6ff" stroke="#343433" strokeWidth="2" />
      <circle cx="17" cy="27" r="2.5" fill="#343433" />
      <circle cx="27" cy="27" r="2.5" fill="#343433" />
      <path d="M20 33C22 35 24 35 26 33" stroke="#343433" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const SalesPage: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [value, setValue] = useState<number>(10000);
  const [stage, setStage] = useState<DealStage>('Lead');
  const [probability, setProbability] = useState<number>(50);
  const [customerId, setCustomerId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [source, setSource] = useState('Inbound');
  const [notes, setNotes] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];

  const currency = company?.currency || 'USD';

  const stages: DealStage[] = ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  // Metrics
  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedRevenue = Math.round(
    openDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0)) / 100, 0)
  );

  const wonDeals = deals.filter((d) => d.stage === 'Won');
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  const openAddModal = () => {
    setEditingDeal(null);
    setName('');
    setValue(24000);
    setStage('Lead');
    setProbability(30);
    setCustomerId('');
    setExpectedCloseDate('');
    setSource('Inbound');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Deal) => {
    setEditingDeal(d);
    setName(d.name);
    setValue(d.value);
    setStage(d.stage);
    setProbability(d.probability);
    setCustomerId(d.customerId || '');
    setExpectedCloseDate(d.expectedCloseDate || '');
    setSource(d.source || '');
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    const defaultProbabilities: Record<DealStage, number> = {
      Lead: 20,
      Qualified: 40,
      Demo: 50,
      Proposal: 70,
      Negotiation: 85,
      Won: 100,
      Lost: 0,
    };

    await updateDeal(dealId, {
      stage: newStage,
      probability: defaultProbabilities[newStage],
    });

    if (newStage === 'Won') {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#00c978', '#64c6ff', '#ffcd6c', '#ff3e00', '#ff58ae'],
      });
      showToast('success', 'Deal Closed Won!', 'Congratulations! Deal moved to Won.');
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || value <= 0) return;

    const cust = customers.find((c) => c.id === customerId);

    if (editingDeal) {
      await updateDeal(editingDeal.id, {
        name,
        value: Number(value),
        currency,
        stage,
        probability: Number(probability),
        customerId: customerId || undefined,
        customerName: cust?.companyName || undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        source,
        notes,
      });
      showToast('success', 'Deal Updated', `Sales deal "${name}" updated successfully.`);
    } else {
      await createDeal({
        name,
        value: Number(value),
        currency,
        stage,
        probability: Number(probability),
        customerId: customerId || undefined,
        customerName: cust?.companyName || undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        source,
        notes,
      });

      if (stage === 'Won') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00c978', '#64c6ff', '#ffcd6c', '#ff3e00', '#ff58ae'],
        });
      }
      showToast('success', 'Deal Created', `Sales deal "${name}" added to pipeline.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm('Delete this sales deal?')) {
      await deleteDeal(id);
      showToast('info', 'Deal Removed', 'Sales deal removed from pipeline.');
    }
  };

  // Filter deals
  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.customerName && d.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = selectedStageFilter === 'all' || d.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div
      style={{
        backgroundColor: '#fbfaf9', // Cream Canvas
        margin: '-24px',
        padding: '36px 36px 80px',
        minHeight: '100vh',
        color: '#343433',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* ========================================================== */}
        {/* HERO SECTION WITH FLANKING MASCOT CLUSTERS                */}
        {/* ========================================================== */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            padding: '24px 0 10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Mascot */}
          <div style={{ display: 'none', lg: 'block' } as any}>
            <FamilyLeftMascotCluster />
          </div>

          {/* Centered Hero Content */}
          <div style={{ flex: 1, textAlign: 'center', minWidth: '280px', padding: '0 12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#f2f0ed', // Stone surface
                border: '1px solid #e5d5c3',
                fontSize: '12px',
                fontWeight: 600,
                color: '#343433',
                letterSpacing: '-0.01px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00c978', // Grass green
                }}
              />
              STORYBOOK PIPELINE & DEAL FLOW
            </div>

            <h1
              style={{
                fontSize: '44px',
                fontWeight: 500,
                color: '#121212', // Ink Black
                lineHeight: 1.1,
                letterSpacing: '-0.020em',
                margin: '0 0 14px',
              }}
            >
              Closing Deals, Beautifully
            </h1>

            <p
              style={{
                fontSize: '17px',
                color: '#474645', // Body brown
                lineHeight: 1.5,
                letterSpacing: '-0.016em',
                maxWidth: '560px',
                margin: '0 auto 24px',
              }}
            >
              From qualified lead to handshakes and confetti. Track probability-weighted revenue on warm parchment.
            </p>

            {/* Hero CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Primary Dark Pill */}
              <button
                type="button"
                onClick={openAddModal}
                style={{
                  backgroundColor: '#121212', // Ink Black
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '32px',
                  padding: '11px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Plus size={16} strokeWidth={2.5} /> + Create New Deal
              </button>

              {/* Secondary Sand Pill */}
              <button
                type="button"
                onClick={() => {
                  const qualifiedDeals = deals.filter((d) => d.stage === 'Qualified');
                  if (qualifiedDeals.length > 0) {
                    showToast('info', 'Sales Demo Pipeline', `${qualifiedDeals.length} deals waiting for demo.`);
                  } else {
                    showToast('info', 'Sales Demo Pipeline', 'No demo deals currently scheduled.');
                  }
                }}
                style={{
                  backgroundColor: '#f6f4ef', // Sand Pill Button
                  color: '#121212',
                  border: '1px solid #e5d5c3',
                  borderRadius: '32px',
                  padding: '11px 22px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f0ed')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f6f4ef')}
              >
                <Sparkles size={16} color="#d48f00" /> Demo Highlights
              </button>
            </div>
          </div>

          {/* Right Mascot */}
          <div style={{ display: 'none', lg: 'block' } as any}>
            <FamilyRightMascotCluster />
          </div>
        </section>

        {/* ========================================================== */}
        {/* TOP SECTION: 3 FEATURE CARDS + 1 SIGNATURE DARK CARD      */}
        {/* ========================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1: Active Pipeline */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              padding: '28px',
              boxShadow: 'inset 0 0 0 1px #f2f0ed', // 1px inset hairline
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7e7e7d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Pipeline
                </span>
                <span
                  style={{
                    backgroundColor: '#e5d5c3',
                    color: '#343433',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {openDeals.length} DEALS
                </span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: '#121212', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatCurrency(totalPipelineValue, currency)}
              </div>
              <div style={{ fontSize: '14px', color: '#474645', marginTop: '8px' }}>
                Total potential value across open stages
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f2f0ed' }}>
              <a
                href="#/sales"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedStageFilter('Proposal');
                }}
                style={{
                  color: '#ff3e00', // Signature Ember Orange demo link
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Review proposals ({deals.filter((d) => d.stage === 'Proposal').length}) →
              </a>
            </div>
          </div>

          {/* Card 2: Weighted Forecast */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              padding: '28px',
              boxShadow: 'inset 0 0 0 1px #f2f0ed',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7e7e7d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Weighted Forecast
                </span>
                <span
                  style={{
                    backgroundColor: '#ffbb26', // Honey
                    color: '#121212',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  EXPECTED
                </span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: '#121212', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatCurrency(weightedRevenue, currency)}
              </div>
              <div style={{ fontSize: '14px', color: '#474645', marginTop: '8px' }}>
                Probability-adjusted expected closing cash
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f2f0ed' }}>
              <a
                href="#/sales"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedStageFilter('Negotiation');
                }}
                style={{
                  color: '#ff3e00', // Ember Orange
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                In negotiation ({deals.filter((d) => d.stage === 'Negotiation').length}) →
              </a>
            </div>
          </div>

          {/* Card 3: Total Won Revenue */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              padding: '28px',
              boxShadow: 'inset 0 0 0 1px #f2f0ed',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7e7e7d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Closed Won
                </span>
                <span
                  style={{
                    backgroundColor: '#00ca48', // Mint
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {winRate}% WIN RATE
                </span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 600, color: '#121212', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatCurrency(totalWonValue, currency)}
              </div>
              <div style={{ fontSize: '14px', color: '#474645', marginTop: '8px' }}>
                {wonDeals.length} deals successfully converted
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f2f0ed' }}>
              <a
                href="#/sales"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedStageFilter('Won');
                }}
                style={{
                  color: '#ff3e00', // Ember Orange
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View won contracts ({wonDeals.length}) →
              </a>
            </div>
          </div>

          {/* Card 4: Signature Dark Feature Card (#000000 with 24px radius and colorful circular icons) */}
          <div
            style={{
              backgroundColor: '#000000',
              borderRadius: '24px',
              padding: '22px 20px',
              boxShadow: '0 0 24px 0 rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#ffffff',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  Pipeline Commands
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00c978' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Row 1: Add Deal */}
                <button
                  type="button"
                  onClick={openAddModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#0086fc', // Link Blue
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Create New Deal</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Add deal to active flow</div>
                  </div>
                </button>

                {/* Row 2: Inbound Source */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#9f4fff', // Plum Violet
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Inbound Velocity</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      {deals.filter((d) => d.source === 'Inbound').length} inbound sources
                    </div>
                  </div>
                </div>

                {/* Row 3: Outbound */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#ff58ae', // Coral Pink
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Target size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Outbound Campaigns</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                      {deals.filter((d) => d.source === 'Outbound').length} outbound accounts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              Total Records: {deals.length} deals in Dexie store
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SEARCH, FILTER & STAGE BAR (Stone Surface)                 */}
        {/* ========================================================== */}
        <div
          style={{
            backgroundColor: '#f2f0ed', // Stone Surface
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            border: '1px solid #e5d5c3',
          }}
        >
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#7e7e7d" />
            <input
              type="text"
              placeholder="Search deals by name, client, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                border: '1px solid #e5d5c3',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#121212',
                outline: 'none',
              }}
            />
          </div>

          {/* Stage Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#7e7e7d', marginRight: '4px' }}>Filter:</span>
            <button
              type="button"
              onClick={() => setSelectedStageFilter('all')}
              style={{
                backgroundColor: selectedStageFilter === 'all' ? '#121212' : '#ffffff',
                color: selectedStageFilter === 'all' ? '#ffffff' : '#343433',
                border: '1px solid #e5d5c3',
                borderRadius: '9999px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All ({deals.length})
            </button>
            {stages.map((stg) => {
              const count = deals.filter((d) => d.stage === stg).length;
              const isActive = selectedStageFilter === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedStageFilter(stg)}
                  style={{
                    backgroundColor: isActive ? '#121212' : '#ffffff',
                    color: isActive ? '#ffffff' : '#343433',
                    border: '1px solid #e5d5c3',
                    borderRadius: '9999px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {stg} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================== */}
        {/* KANBAN PIPELINE BOARD                                      */}
        {/* ========================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {stages.map((stg) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stg);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            // Stage color mapping based on Family Tokens
            const stageBadgeColors: Record<DealStage, { bg: string; text: string }> = {
              Lead: { bg: '#64c6ff', text: '#121212' }, // Sky Blue
              Qualified: { bg: '#00b2ff', text: '#ffffff' }, // Alt Blue
              Demo: { bg: '#ffcd6c', text: '#121212' }, // Sun Yellow
              Proposal: { bg: '#d48f00', text: '#ffffff' }, // Gold
              Negotiation: { bg: '#ff3e00', text: '#ffffff' }, // Ember Orange
              Won: { bg: '#00c978', text: '#ffffff' }, // Grass Green
              Lost: { bg: '#e5d5c3', text: '#7e7e7d' }, // Stone Border
            };

            const colors = stageBadgeColors[stg] || { bg: '#f2f0ed', text: '#121212' };

            return (
              <div
                key={stg}
                style={{
                  backgroundColor: '#f2f0ed', // Stone Surface
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: 'inset 0 0 0 1px #e5d5c3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '380px',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {stageDeals.length}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#121212', margin: 0 }}>{stg}</h3>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#343433' }}>
                    {formatCurrency(stageTotal, currency)}
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {stageDeals.length === 0 ? (
                    <div
                      style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        color: '#7e7e7d',
                        fontSize: '13px',
                        border: '1px dashed #e5d5c3',
                        borderRadius: '8px',
                        backgroundColor: '#faf9f8',
                      }}
                    >
                      No deals in {stg}
                    </div>
                  ) : (
                    stageDeals.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          backgroundColor: '#ffffff', // Pure White Feature Card
                          borderRadius: '10px',
                          padding: '16px',
                          boxShadow: 'inset 0 0 0 1px #f2f0ed',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        {/* Title & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#121212', lineHeight: 1.3 }}>
                              {d.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7e7e7d', marginTop: '2px' }}>
                              {d.customerName || 'Direct Inbound'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(d)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#7e7e7d',
                              }}
                              title="Edit Deal"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeal(d.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#ff2b3a', // Alert Red
                              }}
                              title="Delete Deal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Value & Probability */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#121212' }}>
                            {formatCurrency(d.value, currency)}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: d.probability >= 70 ? '#00ca48' : d.probability >= 40 ? '#ffbb26' : '#e5d5c3',
                              color: d.probability >= 70 ? '#ffffff' : '#121212',
                            }}
                          >
                            {d.probability}% Prob
                          </span>
                        </div>

                        {/* Dates & Source */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#7e7e7d' }}>
                          <span>{d.source || 'Inbound'}</span>
                          {d.expectedCloseDate && <span>Close: {formatDate(d.expectedCloseDate)}</span>}
                        </div>

                        {/* Quick Advance / Move Stage Menu */}
                        <div style={{ paddingTop: '8px', borderTop: '1px solid #f2f0ed', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {stages
                            .filter((s) => s !== d.stage)
                            .slice(0, 3)
                            .map((targetStage) => (
                              <button
                                key={targetStage}
                                type="button"
                                onClick={() => handleStageChange(d.id, targetStage)}
                                style={{
                                  backgroundColor: '#f6f4ef',
                                  color: '#343433',
                                  border: '1px solid #e5d5c3',
                                  borderRadius: '6px',
                                  padding: '3px 7px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                → {targetStage}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================== */}
        {/* ADD / EDIT DEAL MODAL (Warm Cream Parchment Overlay)        */}
        {/* ========================================================== */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(18, 18, 18, 0.45)', // Soft warm backdrop
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#fbfaf9', // Cream Canvas
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
                border: '1px solid #e5d5c3',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid #f2f0ed',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#121212', margin: 0 }}>
                    {editingDeal ? 'Update Sales Deal' : 'Add Deal to Pipeline'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#7e7e7d', margin: '4px 0 0' }}>
                    Capture deal value, expected close date, and win probability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#7e7e7d',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveDeal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp Enterprise Pilot"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5d5c3',
                      fontSize: '14px',
                      color: '#121212',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Deal Value ({currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5d5c3',
                        fontSize: '14px',
                        color: '#121212',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as DealStage)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5d5c3',
                        fontSize: '14px',
                        color: '#121212',
                        outline: 'none',
                      }}
                    >
                      {stages.map((stg) => (
                        <option key={stg} value={stg}>
                          {stg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Win Probability ({probability}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={probability}
                      onChange={(e) => setProbability(Number(e.target.value))}
                      style={{ width: '100%', marginTop: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Target Close Date
                    </label>
                    <input
                      type="date"
                      value={expectedCloseDate}
                      onChange={(e) => setExpectedCloseDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5d5c3',
                        fontSize: '14px',
                        color: '#121212',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Linked Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5d5c3',
                        fontSize: '14px',
                        color: '#121212',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- None / Prospect --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || c.contactName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                      Lead Source
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5d5c3',
                        fontSize: '14px',
                        color: '#121212',
                        outline: 'none',
                      }}
                    >
                      <option value="Inbound">Inbound</option>
                      <option value="Outbound">Outbound</option>
                      <option value="Referral">Referral</option>
                      <option value="Event">Event</option>
                      <option value="Partner">Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#343433', marginBottom: '6px' }}>
                    Notes & Discussion
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key decision makers, budget requirements, next steps..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5d5c3',
                      fontSize: '14px',
                      color: '#121212',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      backgroundColor: '#f6f4ef', // Sand Pill
                      color: '#121212',
                      border: '1px solid #e5d5c3',
                      borderRadius: '32px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#121212', // Ink Black
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '32px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {editingDeal ? 'Update Deal' : 'Save Deal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
