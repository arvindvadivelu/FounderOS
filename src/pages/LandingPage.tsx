import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowRight,
  TrendingUp,
  Zap,
  Bot,
  Landmark,
  Users,
  HardDrive,
  CheckCircle2,
  Check,
  RefreshCw,
  X,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Terminal,
  ChevronDown,
  Sliders,
  Sparkles,
} from 'lucide-react';
import founderosLogo from '../assets/founderos-logo.jpg';

/**
 * ============================================================================
 * Skill: animate (Department 2: Design) Implementation
 *
 * 1. THE GATE RESULT:
 *    - Frequency Tier: Occasional to marketing interactive.
 *    - Purpose: Tactile response (:active scale), state indication (tab switching &
 *      interactive FAQ accordion collapse), and spatial consistency.
 *    - Zero Keyboard shortcut delays, zero 100+/day latency.
 *
 * 2. THE INGREDIENTS:
 *    - Tool: Pure CSS transitions and hardware-accelerated animations.
 *    - Properties: transform, opacity, and grid-template-rows (for accordion only).
 *    - Curve: Custom strong ease-out cubic-bezier(0.23, 1, 0.32, 1) and ease-in-out.
 *    - Durations: Button press 160ms, Tab change 220ms, Accordion 220ms.
 *
 * 3. STRICT ANTI-PATTERNS SATISFIED:
 *    - Zero "transition: all" (named properties on every rule).
 *    - Zero "scale(0)" (entrances start at scale(0.97–0.98) + opacity: 0).
 *    - Zero built-in sluggish ease-in on UI elements.
 *    - Hover transforms gated behind @media (hover: hover) and (pointer: fine).
 *    - Full @media (prefers-reduced-motion: reduce) compliance.
 * ============================================================================
 */

interface LandingPageProps {
  onLaunchApp: () => void;
  onDownloadSetup?: () => void;
  onDownloadPortable?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onDownloadSetup,
  onDownloadPortable,
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [downloadType, setDownloadType] = useState<'setup' | 'portable'>('setup');

  // Interactive Cockpit Simulator State
  const [activeTab, setActiveTab] = useState<'telemetry' | 'briefing' | 'treasury' | 'boardroom'>('telemetry');
  const [monthlyBurnRate, setMonthlyBurnRate] = useState<number>(38200);
  const totalCashReserves = 1248000;

  // Interactive Accordion FAQ State (Recipe from animate/RECIPES.md)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Live dynamic runway calculation for the simulator
  const calculatedRunway = useMemo(() => {
    if (monthlyBurnRate <= 0) return '∞';
    return (totalCashReserves / monthlyBurnRate).toFixed(1);
  }, [monthlyBurnRate, totalCashReserves]);

  const triggerDownload = (type: 'setup' | 'portable') => {
    setDownloadType(type);
    setDownloadState('downloading');

    const fileName = type === 'setup' ? 'FounderOS-Setup.exe' : 'FounderOS-Portable.exe';
    const filePath = `/downloads/${fileName}`;

    if (type === 'setup' && onDownloadSetup) {
      onDownloadSetup();
    } else if (type === 'portable' && onDownloadPortable) {
      onDownloadPortable();
    } else {
      const link = document.createElement('a');
      link.href = filePath;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      setDownloadState('completed');
      setTimeout(() => setDownloadState('idle'), 5000);
    }, 1200);
  };

  const faqData = [
    {
      q: 'Where is my financial and deal data stored?',
      a: '100% on your own local device inside browser IndexedDB and encrypted local storage. No company balance sheets, revenue data, invoice records, or CRM opportunities ever leave your machine or touch external cloud servers.',
    },
    {
      q: 'Can I use FounderOS when I have no internet connection?',
      a: 'Yes. FounderOS is built offline-first from the ground up. You can manage tasks, model financial scenarios, update deal stages, and review daily briefing notes at 35,000 feet on an airplane with Wi-Fi turned off.',
    },
    {
      q: 'How does the AI Copilot work if data is local?',
      a: 'You supply your own private API keys (OpenRouter, Google Gemini, Anthropic, or Ollama for 100% local offline neural models). FounderOS acts strictly as a sovereign orchestration layer. Your keys and prompts are stored encrypted locally on your drive.',
    },
    {
      q: 'Can I export or migrate my database at any time?',
      a: 'Yes. Under Settings → Backup, you can generate a cryptographically structured full JSON database export with one click, or restore previous backups with zero vendor lock-in.',
    },
  ];

  return (
    <div className="founderos-landing-root">
      {/* Dynamic Background Noise & Ambient Atmospheric Glow */}
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-bottom" />

      {/* =====================================================================
          1. FLOATING PILL NAVIGATION BAR (Apple Glass & Button-in-Button)
         ===================================================================== */}
      <header className="nav-header">
        <div className="nav-shell">
          {/* Brand Mark & Identity */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="nav-brand"
          >
            <div className="brand-logo-frame">
              <img src={founderosLogo} alt="FounderOS" className="brand-logo-img" />
            </div>
            <div className="brand-text-col">
              <span className="brand-title">FounderOS</span>
              <span className="brand-subtitle">Executive Command</span>
            </div>
          </div>

          {/* Nav Quick Links (Smooth Scroll) */}
          <nav className="nav-links">
            <a href="#simulator" className="nav-link-item">Simulator</a>
            <a href="#dilemma" className="nav-link-item">The Dilemma</a>
            <a href="#pillars" className="nav-link-item">Pillars</a>
            <a href="#downloads" className="nav-link-item">Distribution</a>
            <a href="#faq" className="nav-link-item">Architecture</a>
          </nav>

          {/* Navigation Action Buttons (Button Press Feedback: scale(0.97)) */}
          <div className="nav-actions">
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              className="btn-nested-secondary"
              title="Download Windows Setup (.exe)"
            >
              <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Setup'}</span>
              <div className="btn-icon-pod pod-sky">
                {downloadState === 'downloading' ? (
                  <RefreshCw size={11} className="spin-icon" />
                ) : (
                  <Download size={11} strokeWidth={2.5} />
                )}
              </div>
            </button>

            <button
              onClick={onLaunchApp}
              className="btn-nested-primary"
              title="Launch Web Application"
            >
              <span>Launch App</span>
              <div className="btn-icon-pod pod-white">
                <ArrowRight size={11} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="landing-main-container">
        {/* =====================================================================
            2. HERO DISPLAY SECTION (High Macro-Whitespace & Microscopic Eyebrows)
           ===================================================================== */}
        <section className="hero-section">
          {/* Microscopic Eyebrow Badge */}
          <div className="eyebrow-badge">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">FounderOS Engine v1.0 • Sovereign Executive Edition</span>
          </div>

          {/* Enormous Headline with Tight Letter-Spacing */}
          <h1 className="hero-headline">
            Built for founders who run everything.
          </h1>

          {/* Subheadline: Clear, direct, zero AI buzzwords */}
          <p className="hero-subheadline">
            The unified local-first operating system replacing 12 fragmented SaaS subscriptions.
            Executive telemetry, automated treasury vaults, AI scenario stress-testing, and
            high-conviction deal flow directly on your machine.
          </p>

          {/* Dual Pill CTA Buttons (Nested Button-in-Button with 160ms Press Feedback) */}
          <div className="hero-cta-row">
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              className="hero-btn-primary"
            >
              <span>
                {downloadState === 'downloading'
                  ? 'Initiating Setup Download...'
                  : 'Download Windows Setup (.exe)'}
              </span>
              <div className="btn-icon-pod pod-royal">
                {downloadState === 'downloading' ? (
                  <RefreshCw size={13} className="spin-icon" />
                ) : (
                  <Download size={13} strokeWidth={2.5} />
                )}
              </div>
            </button>

            <button
              onClick={onLaunchApp}
              className="hero-btn-secondary"
            >
              <span>Launch Web Command Center</span>
              <div className="btn-icon-pod pod-cyan">
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Staggered Hardware & Trust Proof Chips */}
          <div className="hero-trust-chips">
            {[
              { label: '100% Local-First IndexedDB', color: '#10b981' },
              { label: 'Zero Cloud Surveillance', color: '#38bdf8' },
              { label: 'Sub-10ms Offline Flight Mode', color: '#a855f7' },
              { label: '$0 Forever for Core', color: '#f59e0b' },
            ].map((chip, idx) => (
              <div key={idx} className="trust-chip-item stagger-chip">
                <span className="trust-chip-dot" style={{ backgroundColor: chip.color }} />
                <span>{chip.label}</span>
              </div>
            ))}
          </div>

          {/* Download Completion Toast */}
          {downloadState === 'completed' && (
            <div className="download-complete-toast animate-fade-in">
              <CheckCircle2 size={18} color="#10b981" />
              <span>
                <strong>FounderOS-Setup.exe</strong> downloaded! Run installer on Windows to begin.
              </span>
            </div>
          )}
        </section>

        {/* =====================================================================
            3. HERO ANCHOR: INTERACTIVE EXECUTIVE COCKPIT SIMULATOR
            Smooth tab transition with hardware acceleration and live slider
           ===================================================================== */}
        <section id="simulator" className="simulator-section">
          {/* Outer Hardware Chassis (Double-Bezel) */}
          <div className="chassis-outer">
            <div className="chassis-inner">
              {/* Window Header Bar */}
              <div className="window-header">
                <div className="window-controls">
                  <span className="window-dot dot-close" />
                  <span className="window-dot dot-minimize" />
                  <span className="window-dot dot-expand" />
                  <span className="window-title-tag">founderos.internal // sovereign-session</span>
                </div>

                {/* Interactive Simulator Tab Switcher */}
                <div className="simulator-tabs">
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`tab-btn ${activeTab === 'telemetry' ? 'tab-btn-active' : ''}`}
                  >
                    <TrendingUp size={13} />
                    <span>Executive Pulse</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('briefing')}
                    className={`tab-btn ${activeTab === 'briefing' ? 'tab-btn-active' : ''}`}
                  >
                    <Zap size={13} />
                    <span>Morning Intel</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('treasury')}
                    className={`tab-btn ${activeTab === 'treasury' ? 'tab-btn-active' : ''}`}
                  >
                    <Landmark size={13} />
                    <span>Treasury Vaults</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('boardroom')}
                    className={`tab-btn ${activeTab === 'boardroom' ? 'tab-btn-active' : ''}`}
                  >
                    <Bot size={13} />
                    <span>AI Boardroom</span>
                  </button>
                </div>

                <div className="window-status">
                  <span className="status-live-indicator" />
                  <span className="status-live-label">LIVE LOCAL ENGINE</span>
                </div>
              </div>

              {/* Simulator Main Stage */}
              <div className="simulator-stage">
                {/* TAB 1: EXECUTIVE TELEMETRY */}
                {activeTab === 'telemetry' && (
                  <div className="sim-panel animate-tab-enter">
                    <div className="sim-metrics-grid">
                      <div className="sim-stat-card stagger-stat">
                        <div className="sim-stat-header">
                          <span className="sim-stat-label">TOTAL LIQUIDITY</span>
                          <span className="sim-stat-pill pill-emerald">+12.4% MoM</span>
                        </div>
                        <div className="sim-stat-val">${totalCashReserves.toLocaleString()}</div>
                        <div className="sim-stat-sub">Aggregated across 3 connected bank vaults</div>
                      </div>

                      <div className="sim-stat-card stagger-stat">
                        <div className="sim-stat-header">
                          <span className="sim-stat-label">CURRENT MONTHLY BURN</span>
                          <span className="sim-stat-pill pill-amber">Controllable</span>
                        </div>
                        <div className="sim-stat-val">${monthlyBurnRate.toLocaleString()}/mo</div>
                        <div className="sim-stat-sub">Net burn multiple: 0.94x (Top quartile)</div>
                      </div>

                      <div className="sim-stat-card highlight-card stagger-stat">
                        <div className="sim-stat-header">
                          <span className="sim-stat-label">CALCULATED RUNWAY</span>
                          <span className="sim-stat-pill pill-blue">Realtime Live</span>
                        </div>
                        <div className="sim-stat-val text-cyan">{calculatedRunway} Months</div>
                        <div className="sim-stat-sub">Zero debt obligations • Default alive</div>
                      </div>

                      <div className="sim-stat-card stagger-stat">
                        <div className="sim-stat-header">
                          <span className="sim-stat-label">ANNUAL RUN-RATE (ARR)</span>
                          <span className="sim-stat-pill pill-emerald">148% NRR</span>
                        </div>
                        <div className="sim-stat-val">$1,710,000</div>
                        <div className="sim-stat-sub">Gross margin: 88.4% • CAC payback 4.2 mo</div>
                      </div>
                    </div>

                    {/* Interactive Stress-Test Slider */}
                    <div className="interactive-burn-bar">
                      <div className="burn-slider-info">
                        <div className="burn-slider-title">
                          <Sliders size={14} color="#38bdf8" />
                          <span>Interactive Runway Stress-Test: Adjust Monthly Burn Rate</span>
                        </div>
                        <span className="burn-current-tag">${monthlyBurnRate.toLocaleString()} / mo</span>
                      </div>
                      <input
                        type="range"
                        min="15000"
                        max="90000"
                        step="1000"
                        value={monthlyBurnRate}
                        onChange={(e) => setMonthlyBurnRate(Number(e.target.value))}
                        className="burn-range-slider"
                      />
                      <div className="burn-slider-labels">
                        <span>$15k/mo (Lean Bootstrapped: {(totalCashReserves / 15000).toFixed(1)} mo)</span>
                        <span>$50k/mo (Growth: {(totalCashReserves / 50000).toFixed(1)} mo)</span>
                        <span>$90k/mo (Aggressive Expansion: {(totalCashReserves / 90000).toFixed(1)} mo)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MORNING INTELLIGENCE */}
                {activeTab === 'briefing' && (
                  <div className="sim-panel animate-tab-enter">
                    <div className="briefing-memo-card">
                      <div className="briefing-memo-header">
                        <div className="briefing-memo-badge">
                          <Sparkles size={12} />
                          <span>DAILY EXECUTIVE BRIEFING • 07:00 AM UTC</span>
                        </div>
                        <div className="briefing-date">Generated locally on your device in 12ms</div>
                      </div>

                      <h3 className="briefing-title">
                        Founder Daily Priority Memo: 3 Critical Actions for Today
                      </h3>

                      <div className="briefing-items-stack">
                        <div className="briefing-item stagger-item">
                          <div className="item-num">01</div>
                          <div className="item-content">
                            <div className="item-header">
                              <span className="item-tag tag-amber">CASH ACCELERATION</span>
                              <span className="item-time">Impact: +$45,000</span>
                            </div>
                            <p className="item-desc">
                              <strong>Stripe Enterprise Renewal Due:</strong> Vertex Technologies contract
                              renewing in 48 hours. Early payment discount agreement ready for 1-click execution.
                            </p>
                          </div>
                        </div>

                        <div className="briefing-item stagger-item">
                          <div className="item-num">02</div>
                          <div className="item-content">
                            <div className="item-header">
                              <span className="item-tag tag-blue">DEAL VELOCITY</span>
                              <span className="item-time">Pipeline: Stage 4</span>
                            </div>
                            <p className="item-desc">
                              <strong>Apex Logistics Deal In Flight:</strong> CTO approved technical review.
                              Schedule 15-minute Founder closing call before contract draft expires.
                            </p>
                          </div>
                        </div>

                        <div className="briefing-item stagger-item">
                          <div className="item-num">03</div>
                          <div className="item-content">
                            <div className="item-header">
                              <span className="item-tag tag-emerald">ANOMALY DETECTED</span>
                              <span className="item-time">Savings: $1,420/mo</span>
                            </div>
                            <p className="item-desc">
                              <strong>Unused Cloud Compute Flagged:</strong> 4 idle staging GPU clusters identified
                              in infrastructure audit. Automated shutdown task staged for approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TREASURY VAULTS */}
                {activeTab === 'treasury' && (
                  <div className="sim-panel animate-tab-enter">
                    <div className="treasury-grid">
                      <div className="vault-card stagger-stat">
                        <div className="vault-header">
                          <div className="vault-icon-circle icon-emerald">
                            <Landmark size={18} />
                          </div>
                          <span className="vault-badge">PRIMARY OPERATING</span>
                        </div>
                        <div className="vault-title">Silicon Valley Bank Checking</div>
                        <div className="vault-balance">$428,500.00</div>
                        <div className="vault-meta">6.2 months operating buffer reserved</div>
                      </div>

                      <div className="vault-card stagger-stat">
                        <div className="vault-header">
                          <div className="vault-icon-circle icon-blue">
                            <ShieldCheck size={18} />
                          </div>
                          <span className="vault-badge">5.2% APY TREASURY</span>
                        </div>
                        <div className="vault-title">Brex High-Yield Reserve Vault</div>
                        <div className="vault-balance">$682,000.00</div>
                        <div className="vault-meta">Yielding ~$2,955/mo in passive cash</div>
                      </div>

                      <div className="vault-card stagger-stat">
                        <div className="vault-header">
                          <div className="vault-icon-circle icon-purple">
                            <Layers size={18} />
                          </div>
                          <span className="vault-badge">TAX ESCROW</span>
                        </div>
                        <div className="vault-title">Quarterly Tax & Payroll Reserve</div>
                        <div className="vault-balance">$137,500.00</div>
                        <div className="vault-meta">Automated 25% net revenue set-aside</div>
                      </div>
                    </div>

                    <div className="treasury-footer-pill">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Zero bank credentials stored in the cloud. Balances managed through local encrypted ledger.</span>
                    </div>
                  </div>
                )}

                {/* TAB 4: AI BOARDROOM */}
                {activeTab === 'boardroom' && (
                  <div className="sim-panel animate-tab-enter">
                    <div className="boardroom-transcript-card">
                      <div className="boardroom-meta-header">
                        <div className="boardroom-topic">
                          <Terminal size={14} color="#38bdf8" />
                          <span>TOPIC: Q3 Engineering Hiring vs. 24-Month Runway Extension</span>
                        </div>
                        <span className="boardroom-status-badge">CONSENSUS REACHED</span>
                      </div>

                      <div className="boardroom-chat-log">
                        <div className="chat-entry stagger-item">
                          <div className="chat-avatar avatar-cfo">CFO</div>
                          <div className="chat-body">
                            <div className="chat-speaker">AI Chief Financial Officer</div>
                            <p className="chat-text">
                              "Adding 2 senior engineers increases burn by $32k/mo, pulling runway from 32.6 to 21.4 months.
                              I recommend hiring 1 contractor first and waiting until ARR hits $2.0M before committing full-time payroll."
                            </p>
                          </div>
                        </div>

                        <div className="chat-entry stagger-item">
                          <div className="chat-avatar avatar-growth">VPG</div>
                          <div className="chat-body">
                            <div className="chat-speaker">AI VP of Growth</div>
                            <p className="chat-text">
                              "Enterprise deals in pipeline #4 require SOC2 Type II automation. If we delay engineering by 3 months,
                              we risk slipping $380,000 in late Q3 closes."
                            </p>
                          </div>
                        </div>

                        <div className="chat-entry consensus-entry stagger-item">
                          <div className="chat-avatar avatar-system">SYN</div>
                          <div className="chat-body">
                            <div className="chat-speaker">FounderOS Strategy Synthesis</div>
                            <p className="chat-text">
                              <strong>Recommended Decision:</strong> Proceed with 1 dedicated security engineering lead immediately.
                              Fund role exclusively from Brex treasury yield ($2,955/mo offset), preserving runway at 28.5 months.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulator Action Footer */}
              <div className="simulator-footer-bar">
                <div className="footer-left-info">
                  <Cpu size={14} color="#38bdf8" />
                  <span>Interactive Demonstration • Experience live data manipulation in the actual software</span>
                </div>

                <button onClick={onLaunchApp} className="simulator-launch-btn">
                  <span>Enter Full Workspace</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. THE DILEMMA & THE CURE: ASYMMETRICAL BENTO COMPARISON
           ===================================================================== */}
        <section id="dilemma" className="dilemma-section">
          <div className="dilemma-shell">
            <div className="dilemma-inner">
              {/* Header Badge */}
              <div className="dilemma-header-pill">
                <AlertTriangle size={13} />
                <span>THE ARCHITECTURAL DILEMMA & THE CURE</span>
              </div>

              {/* Section Headline */}
              <h2 className="dilemma-title">
                No more chaos. Zero subscription sprawl.
              </h2>

              <p className="dilemma-desc">
                Founders lose an average of 9.4 hours every week copy-pasting numbers between 12
                disconnected SaaS silos, paying thousands in recurring seat taxes, and leaking
                unencrypted financial telemetry to third-party ad networks. FounderOS replaces
                this fragmented stack with one sovereign local-first runtime.
              </p>

              {/* Asymmetric Side-by-Side Comparison */}
              <div className="comparison-bento-grid">
                {/* Side 1: The SaaS Tax */}
                <div className="comparison-card card-dilemma-legacy">
                  <div className="card-top-marker">
                    <span className="marker-badge badge-legacy">THE 12-TAB CLOUD MESS</span>
                    <span className="marker-cost">-$4,200/mo Cloud Tax</span>
                  </div>

                  <h3 className="card-comp-heading">Fragmented, Slow & Leaky</h3>

                  <div className="comp-checklist">
                    {[
                      'Stripe + QuickBooks + ChartMogul for simple revenue calculations',
                      'HubSpot + Notion + Spreadsheets with broken, stale deal sync',
                      'Confidential runway & cap table data stored on third-party servers',
                      'Zero offline functionality; completely unusable on flights or flaky Wi-Fi',
                      'Endless password resets, SSO auth errors, and session timeouts',
                    ].map((item, i) => (
                      <div key={i} className="checklist-row row-danger">
                        <div className="check-icon-circle circle-danger">
                          <X size={11} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="legacy-footer-pill">
                    Outcome: Cognitive fatigue, fragmented team context, and compounding subscription creep.
                  </div>
                </div>

                {/* Side 2: The Sovereign FounderOS */}
                <div className="comparison-card card-dilemma-founderos">
                  <div className="card-top-marker">
                    <span className="marker-badge badge-founderos">THE FOUNDEROS RUNTIME</span>
                    <span className="marker-cost text-emerald">$0/mo Core • Zero Leaks</span>
                  </div>

                  <h3 className="card-comp-heading">Unified, Instantaneous & Sovereign</h3>

                  <div className="comp-checklist">
                    {[
                      'Single unified executive cockpit: MRR, ARR, Burn Multiple, and Runway',
                      'Autonomous morning intelligence memo synthesized before your day starts',
                      '100% sovereign IndexedDB storage; zero telemetry sold or leaked',
                      'Operates 100% offline at 35,000 feet with instant sub-10ms queries',
                      'Zero login barriers, zero corporate trackers, immediate keyboard shortcuts',
                    ].map((item, i) => (
                      <div key={i} className="checklist-row row-success">
                        <div className="check-icon-circle circle-success">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="founderos-action-bar">
                    <button onClick={onLaunchApp} className="founderos-cta-btn">
                      <span>Experience FounderOS</span>
                      <div className="btn-icon-pod pod-white">
                        <ArrowRight size={11} strokeWidth={2.5} />
                      </div>
                    </button>
                    <span className="action-subtext">Free forever for personal & core use</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. THE SIX SOVEREIGN PILLARS (Asymmetrical Bento Grid)
           ===================================================================== */}
        <section id="pillars" className="pillars-section">
          <div className="pillars-heading-block">
            <div className="eyebrow-badge">
              <Layers size={13} color="#0050FF" />
              <span>THE SOVEREIGN CAPABILITIES MATRIX</span>
            </div>

            <h2 className="pillars-title">
              Everything an executive needs. Nothing you don't.
            </h2>

            <p className="pillars-subtitle">
              Engineered with double-bezel tactile hardware surfaces and powered by
              bulletproof local-first database logic.
            </p>
          </div>

          {/* Asymmetrical Bento Grid */}
          <div className="pillars-bento-grid">
            {/* Card 1 (Wide Bento): Executive Telemetry */}
            <div className="bento-card bento-wide">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-cyan">
                      <TrendingUp size={22} />
                    </div>
                    <span className="bento-pill-tag">CORE TELEMETRY</span>
                  </div>

                  <h3 className="bento-card-title">Executive Pulse & Cash Engine</h3>
                  <p className="bento-card-desc">
                    Live financial telemetry tracking MRR, ARR, Net Burn Multiple, Gross Margins, and Customer Retention
                    reconciled directly from real local transactions and bank vaults.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Instant Net Burn & Runway countdown with dynamic sensitivity stress-testing</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Cohort Net Revenue Retention (NRR) and multi-tier customer health scoring</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Live reconciliation with real bank accounts stored in local IndexedDB</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Explore Executive Telemetry</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Morning Intelligence */}
            <div className="bento-card">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-amber">
                      <Zap size={22} />
                    </div>
                    <span className="bento-pill-tag">DAILY SYNTHESIS</span>
                  </div>

                  <h3 className="bento-card-title">Morning Intelligence</h3>
                  <p className="bento-card-desc">
                    An automated briefing synthesized every morning at 7:00 AM so you know exactly where your capital,
                    pipeline, and operations stand before touching email.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#f59e0b" />
                      <span>3 high-impact prioritized founder action items</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#f59e0b" />
                      <span>Proactive runway fluctuation anomaly alerts</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Read Sample Memo</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Autonomous AI CEO */}
            <div className="bento-card">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-purple">
                      <Bot size={22} />
                    </div>
                    <span className="bento-pill-tag">STRATEGY MODELING</span>
                  </div>

                  <h3 className="bento-card-title">Autonomous AI Copilot</h3>
                  <p className="bento-card-desc">
                    Stress-test hiring roadmaps, simulate market downturns, and project cash burn across 24 months
                    with your private local AI advisor using OpenRouter, Ollama, or Gemini.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#a855f7" />
                      <span>Multi-agent boardroom deliberation and voting</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#a855f7" />
                      <span>Zero training on your proprietary corporate data</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Simulate Strategy</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Corporate Treasury */}
            <div className="bento-card">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-emerald">
                      <Landmark size={22} />
                    </div>
                    <span className="bento-pill-tag">CAPITAL VAULTS</span>
                  </div>

                  <h3 className="bento-card-title">Corporate Treasury</h3>
                  <p className="bento-card-desc">
                    Monitor operating checking, tax escrow splits, and high-yield reserve allocations with
                    automated safety buffers and multi-bank aggregation.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Multi-entity liquidity aggregation</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Quarterly automated tax reserve calculator</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Inspect Vaults</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: High-Conviction Deal Flow */}
            <div className="bento-card">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-blue">
                      <Users size={22} />
                    </div>
                    <span className="bento-pill-tag">FOUNDER-LED SALES</span>
                  </div>

                  <h3 className="bento-card-title">Deal Pipeline & CRM</h3>
                  <p className="bento-card-desc">
                    A laser-focused relationship engine designed for founder-led sales. Track enterprise negotiations,
                    milestones, and probability-weighted pipeline without CRM bloat.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#38bdf8" />
                      <span>Kanban stages customized for founder closing</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#38bdf8" />
                      <span>Automated weighted revenue projection</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Open Deal Pipeline</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6 (Wide Bento): Local-First Engine */}
            <div className="bento-card bento-wide">
              <div className="bento-shell">
                <div className="bento-inner">
                  <div className="bento-card-header">
                    <div className="bento-icon-frame icon-white">
                      <HardDrive size={22} />
                    </div>
                    <span className="bento-pill-tag">OFFLINE ARCHITECTURE</span>
                  </div>

                  <h3 className="bento-card-title">100% Local-First Sovereign Database</h3>
                  <p className="bento-card-desc">
                    Your balance sheets, cap table notes, client health scores, and pipeline stay encrypted inside your local
                    device IndexedDB. Operates seamlessly with zero external server dependencies.
                  </p>

                  <div className="bento-bullets-col">
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Sub-10ms local query execution for instant, zero-lag page navigation</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Full offline flight mode support; works at 35,000 feet without internet</span>
                    </div>
                    <div className="bento-bullet-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>One-click full JSON database export and cryptographic restoration</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-action-link">
                    <span>Inspect Engine Specs</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. DOWNLOAD & WEB DISTRIBUTION HUB (Three Execution Surfaces)
           ===================================================================== */}
        <section id="downloads" className="downloads-section">
          <div className="downloads-heading-block">
            <div className="eyebrow-badge">
              <Download size={13} color="#38bdf8" />
              <span>NATIVE HARDWARE & CLOUDLESS WEB</span>
            </div>

            <h2 className="downloads-title">
              Choose your execution surface.
            </h2>

            <p className="downloads-subtitle">
              Whether you prefer an automated native Windows installer with system tray background daemon,
              a portable zero-install USB binary, or instant zero-setup web execution.
            </p>
          </div>

          <div className="distribution-grid">
            {/* Target 1: Windows Setup Installer */}
            <div className="dist-card card-featured">
              <div className="dist-shell">
                <div className="dist-inner">
                  <div className="dist-tag-row">
                    <span className="dist-badge badge-primary">RECOMMENDED FOR WINDOWS</span>
                  </div>

                  <h3 className="dist-heading">Windows Setup (.exe)</h3>
                  <p className="dist-desc">
                    Full native executable installer with automatic Start Menu shortcuts, system tray
                    daemon, and global hotkey <kbd className="mono-kbd">Ctrl+Shift+O</kbd>.
                  </p>

                  <div className="dist-specs-stack">
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Version: 1.0.0 (Windows 64-bit)</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Package Size: ~73.6 MB (Self-contained)</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Built-in local auto-updater engine</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDownload('setup')}
                    disabled={downloadState === 'downloading'}
                    className="dist-btn btn-white"
                  >
                    <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Windows Setup'}</span>
                    <div className="btn-icon-pod pod-royal">
                      <Download size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Target 2: Instant Web Command Center */}
            <div className="dist-card">
              <div className="dist-shell">
                <div className="dist-inner">
                  <div className="dist-tag-row">
                    <span className="dist-badge badge-cyan">ZERO INSTALL • RUNS EVERYWHERE</span>
                  </div>

                  <h3 className="dist-heading">Connect Web App</h3>
                  <p className="dist-desc">
                    Launch the complete FounderOS Command Center immediately in any modern browser.
                    Zero accounts required; data is persisted securely in your local IndexedDB.
                  </p>

                  <div className="dist-specs-stack">
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#38bdf8" />
                      <span>Chrome, Edge, Safari, Firefox compatible</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#38bdf8" />
                      <span>Zero download or installation needed</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#38bdf8" />
                      <span>Full offline Progressive Web App (PWA)</span>
                    </div>
                  </div>

                  <button
                    onClick={onLaunchApp}
                    className="dist-btn btn-royal"
                  >
                    <span>Launch Web Application</span>
                    <div className="btn-icon-pod pod-white">
                      <ArrowRight size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Target 3: Standalone Portable Binary */}
            <div className="dist-card">
              <div className="dist-shell">
                <div className="dist-inner">
                  <div className="dist-tag-row">
                    <span className="dist-badge badge-neutral">STANDALONE PORTABLE</span>
                  </div>

                  <h3 className="dist-heading">Windows Portable (.exe)</h3>
                  <p className="dist-desc">
                    Single standalone executable that runs without registry keys or admin rights.
                    Ideal for encrypted USB drives and strictly isolated corporate workstations.
                  </p>

                  <div className="dist-specs-stack">
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>No administrator permissions required</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>Zero background service residues left on host</span>
                    </div>
                    <div className="spec-row">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>Encrypted workspace stored next to .exe</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDownload('portable')}
                    disabled={downloadState === 'downloading'}
                    className="dist-btn btn-glass"
                  >
                    <span>Download Portable (.exe)</span>
                    <div className="btn-icon-pod pod-emerald">
                      <Download size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. ARCHITECTURAL FAQ ACCORDION (Recipe from animate/RECIPES.md)
           ===================================================================== */}
        <section id="faq" className="faq-section">
          <div className="faq-shell">
            <div className="faq-inner">
              <div className="eyebrow-badge">
                <ShieldCheck size={13} color="#10b981" />
                <span>ARCHITECTURAL GUARANTEES</span>
              </div>

              <h2 className="faq-title">Questions founders ask before trusting us with their company.</h2>

              <div className="faq-accordion-container">
                {faqData.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="faq-accordion-item" data-open={isOpen}>
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="faq-question-btn"
                        aria-expanded={isOpen}
                      >
                        <span className="faq-question-text">{item.q}</span>
                        <div className={`faq-chevron-wrapper ${isOpen ? 'chevron-rotated' : ''}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      {/* Smooth Grid-Template-Rows Collapse Recipe */}
                      <div className="faq-answer-collapse" data-open={isOpen}>
                        <div className="faq-answer-inner">
                          <p className="faq-answer-text">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          8. FOOTER (Minimalist Monospace & Status Indicators)
         ===================================================================== */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-top-row">
            <div className="footer-brand-cluster">
              <div className="brand-logo-frame logo-small">
                <img src={founderosLogo} alt="FounderOS" className="brand-logo-img" />
              </div>
              <div className="footer-brand-meta">
                <span className="footer-brand-title">FounderOS</span>
                <span className="footer-brand-tagline">The Sovereign Operating System for Modern Founders</span>
              </div>
            </div>

            <div className="footer-actions">
              <button onClick={() => triggerDownload('setup')} className="footer-pill-btn">
                <Download size={13} />
                <span>Windows Setup</span>
              </button>

              <button onClick={onLaunchApp} className="footer-pill-btn btn-royal-subtle">
                <span>Launch Web Command Center</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="footer-hairline" />

          <div className="footer-bottom-row">
            <div className="footer-status-pills">
              <span className="system-status-indicator">
                <span className="status-dot-emerald" />
                <span>Engine: Sub-10ms IndexedDB</span>
              </span>
              <span className="system-status-indicator">
                <span className="status-dot-blue" />
                <span>Zero Cloud Dependencies</span>
              </span>
            </div>

            <div className="footer-nav-links">
              <a href="#simulator">Simulator</a>
              <a href="#dilemma">The Dilemma</a>
              <a href="#pillars">Capabilities</a>
              <a href="#downloads">Distribution</a>
              <a href="#faq">Architecture</a>
            </div>

            <div className="footer-copy">
              © {new Date().getFullYear()} FounderOS. Sovereign local-first execution.
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          STRICT ANIMATE DIRECTIVES: Hardware-Accelerated Microinteractions
         ===================================================================== */}
      <style>{`
        /* Core animation tokens conforming strictly to animate/SKILL.md */
        :root {
          --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
          --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
          --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
        }

        .founderos-landing-root {
          min-height: 100vh;
          background-color: #030712;
          color: #f8fafc;
          font-family: var(--font-heading), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow-x: hidden;
          line-height: 1.5;
        }

        .ambient-glow {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .glow-top {
          top: -12%;
          left: 15%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(0, 80, 255, 0.12) 0%, rgba(3, 7, 18, 0) 70%);
          filter: blur(100px);
        }
        .glow-bottom {
          top: 45%;
          right: -10%;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(3, 7, 18, 0) 70%);
          filter: blur(110px);
        }

        /* 1. Floating Pill Navigation */
        .nav-header {
          position: sticky;
          top: 18px;
          z-index: 100;
          padding: 0 24px;
          max-width: 1200px;
          margin: 0 auto 24px auto;
        }
        .nav-shell {
          background-color: rgba(11, 15, 25, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 50px;
          padding: 8px 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .brand-logo-frame {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background-color: #030712;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0050FF;
          box-shadow: 0 0 16px rgba(0, 80, 255, 0.45);
        }
        .logo-small {
          width: 32px;
          height: 32px;
          border-radius: 10px;
        }
        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .brand-text-col {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #f8fafc;
          line-height: 1.1;
        }
        .brand-subtitle {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        @media (max-width: 860px) {
          .nav-links {
            display: none;
          }
        }
        .nav-link-item {
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          transition: color 150ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-link-item:hover {
            color: #f8fafc;
          }
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Button Press Feedback Recipe (160ms var(--ease-out), scale(0.97)) */
        .btn-nested-secondary {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 50px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), border-color 160ms var(--ease-out);
        }
        .btn-nested-secondary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-nested-secondary:hover {
            background-color: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.25);
          }
        }

        .btn-nested-primary {
          background-color: #0050FF;
          border: 1px solid #1a62ff;
          border-radius: 50px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 80, 255, 0.4);
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
        }
        .btn-nested-primary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-nested-primary:hover {
            background-color: #1a62ff;
            box-shadow: 0 0 28px rgba(0, 80, 255, 0.6);
          }
        }

        .btn-icon-pod {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 180ms var(--ease-out);
        }
        .pod-sky { background-color: #38bdf8; color: #030712; }
        .pod-white { background-color: #ffffff; color: #0050FF; }
        .pod-royal { background-color: #0050FF; color: #ffffff; }
        .pod-cyan { background-color: #38bdf8; color: #030712; }
        .pod-emerald { background-color: #10b981; color: #030712; }

        @media (hover: hover) and (pointer: fine) {
          .btn-nested-primary:hover .btn-icon-pod,
          .btn-nested-secondary:hover .btn-icon-pod,
          .hero-btn-primary:hover .btn-icon-pod,
          .hero-btn-secondary:hover .btn-icon-pod,
          .founderos-cta-btn:hover .btn-icon-pod,
          .dist-btn:hover .btn-icon-pod {
            transform: translate(2px, -1px);
          }
        }

        /* 2. Hero Section */
        .landing-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }
        .hero-section {
          padding-top: 64px;
          padding-bottom: 50px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .eyebrow-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background-color: rgba(0, 80, 255, 0.12);
          border: 1px solid rgba(0, 80, 255, 0.35);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #0050FF;
          box-shadow: 0 0 8px #0050FF;
        }
        .hero-headline {
          font-size: clamp(40px, 7vw, 108px);
          font-weight: 700;
          line-height: 0.98;
          letter-spacing: -0.05em;
          color: #f8fafc;
          max-width: 1080px;
          margin: 0 auto 24px auto;
          text-wrap: balance;
        }
        .hero-subheadline {
          font-size: clamp(16px, 2vw, 20px);
          font-weight: 400;
          line-height: 1.5;
          color: #94a3b8;
          max-width: 820px;
          margin: 0 auto 36px auto;
        }
        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .hero-btn-primary {
          background-color: #ffffff;
          color: #030712;
          border: none;
          border-radius: 50px;
          padding: 14px 26px;
          font-size: 16px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.18);
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
        }
        .hero-btn-primary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .hero-btn-primary:hover {
            background-color: #f1f5f9;
            box-shadow: 0 10px 36px rgba(255, 255, 255, 0.25);
          }
        }

        .hero-btn-secondary {
          background-color: #0050FF;
          color: #ffffff;
          border: 1px solid #1a62ff;
          border-radius: 50px;
          padding: 14px 26px;
          font-size: 16px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 80, 255, 0.45);
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
        }
        .hero-btn-secondary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .hero-btn-secondary:hover {
            background-color: #1a62ff;
            box-shadow: 0 12px 36px rgba(0, 80, 255, 0.6);
          }
        }

        /* Staggered Chips Entrance (animate/RECIPES.md) */
        .hero-trust-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .trust-chip-item {
          padding: 6px 14px;
          border-radius: 50px;
          background-color: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stagger-chip {
          opacity: 0;
          transform: translateY(8px);
          animation: itemFadeIn 280ms var(--ease-out) forwards;
        }
        .stagger-chip:nth-child(1) { animation-delay: 40ms; }
        .stagger-chip:nth-child(2) { animation-delay: 80ms; }
        .stagger-chip:nth-child(3) { animation-delay: 120ms; }
        .stagger-chip:nth-child(4) { animation-delay: 160ms; }

        .trust-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .download-complete-toast {
          margin-top: 24px;
          padding: 12px 24px;
          border-radius: 50px;
          background-color: #0b0f19;
          border: 1.5px solid #10b981;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #f8fafc;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }

        /* 3. Interactive Cockpit Simulator (Double-Bezel Hardware Architecture) */
        .simulator-section {
          margin: 30px auto 100px auto;
          max-width: 1140px;
        }
        .chassis-outer {
          padding: 8px;
          border-radius: 28px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.75);
        }
        .chassis-inner {
          border-radius: 20px;
          background-color: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .window-header {
          padding: 14px 20px;
          background-color: rgba(15, 23, 42, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .window-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .window-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .dot-close { background-color: #f43f5e; }
        .dot-minimize { background-color: #f59e0b; }
        .dot-expand { background-color: #10b981; }
        .window-title-tag {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          color: #64748b;
          margin-left: 8px;
        }
        .simulator-tabs {
          display: flex;
          align-items: center;
          background-color: rgba(3, 7, 18, 0.6);
          padding: 3px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          gap: 4px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 160ms var(--ease-out), color 160ms var(--ease-out), transform 160ms var(--ease-out);
        }
        .tab-btn:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .tab-btn:hover {
            color: #f8fafc;
          }
        }
        .tab-btn-active {
          background-color: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .window-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-live-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .status-live-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          letter-spacing: 0.05em;
        }

        .simulator-stage {
          padding: 28px;
          min-height: 380px;
          background: radial-gradient(circle at 50% 0%, rgba(0, 80, 255, 0.05) 0%, rgba(11, 15, 25, 0) 60%);
        }

        /* Simulator Tab 1: Telemetry Grid */
        .sim-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .sim-stat-card {
          background-color: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 180ms var(--ease-out), border-color 180ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .sim-stat-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.16);
          }
        }
        .highlight-card {
          background-color: rgba(0, 80, 255, 0.08);
          border-color: rgba(0, 80, 255, 0.3);
          box-shadow: 0 0 24px rgba(0, 80, 255, 0.15);
        }
        .sim-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sim-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }
        .sim-stat-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 50px;
        }
        .pill-emerald { background-color: rgba(16, 185, 129, 0.15); color: #10b981; }
        .pill-amber { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .pill-blue { background-color: rgba(0, 80, 255, 0.2); color: #38bdf8; }

        .sim-stat-val {
          font-family: var(--font-heading), sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }
        .text-cyan { color: #38bdf8; }
        .text-emerald { color: #10b981; }

        .sim-stat-sub {
          font-size: 12px;
          color: #64748b;
        }

        .interactive-burn-bar {
          background-color: rgba(3, 7, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .burn-slider-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .burn-slider-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }
        .burn-current-tag {
          font-family: var(--font-mono), monospace;
          font-size: 13px;
          font-weight: 700;
          color: #38bdf8;
          padding: 3px 10px;
          border-radius: 6px;
          background-color: rgba(56, 189, 248, 0.1);
        }
        .burn-range-slider {
          width: 100%;
          cursor: pointer;
          accent-color: #0050FF;
        }
        .burn-slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
        }

        /* Simulator Tab 2: Morning Briefing */
        .briefing-memo-card {
          background-color: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 24px;
        }
        .briefing-memo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .briefing-memo-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 0.08em;
        }
        .briefing-date {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          color: #64748b;
        }
        .briefing-title {
          font-size: 20px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 18px;
          letter-spacing: -0.02em;
        }
        .briefing-items-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .briefing-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          background-color: rgba(3, 7, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 160ms var(--ease-out), border-color 160ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .briefing-item:hover {
            transform: translateX(4px);
            border-color: rgba(255, 255, 255, 0.15);
          }
        }
        .item-num {
          font-family: var(--font-mono), monospace;
          font-size: 14px;
          font-weight: 700;
          color: #0050FF;
          padding-top: 2px;
        }
        .item-content {
          flex: 1;
        }
        .item-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .item-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .tag-amber { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .tag-blue { background-color: rgba(0, 80, 255, 0.2); color: #38bdf8; }
        .tag-emerald { background-color: rgba(16, 185, 129, 0.2); color: #10b981; }
        .item-time {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          color: #94a3b8;
        }
        .item-desc {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.4;
        }

        /* Simulator Tab 3: Treasury Grid */
        .treasury-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }
        .vault-card {
          background-color: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 180ms var(--ease-out), border-color 180ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .vault-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.16);
          }
        }
        .vault-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vault-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-emerald { background-color: rgba(16, 185, 129, 0.15); color: #10b981; }
        .icon-blue { background-color: rgba(0, 80, 255, 0.2); color: #38bdf8; }
        .icon-purple { background-color: rgba(168, 85, 247, 0.15); color: #a855f7; }
        .icon-amber { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .icon-cyan { background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; }
        .icon-white { background-color: rgba(255, 255, 255, 0.1); color: #f8fafc; }

        .vault-badge {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .vault-title {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
        }
        .vault-balance {
          font-family: var(--font-mono), monospace;
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }
        .vault-meta {
          font-size: 12px;
          color: #64748b;
        }
        .treasury-footer-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background-color: rgba(3, 7, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: #94a3b8;
        }

        /* Simulator Tab 4: AI Boardroom */
        .boardroom-transcript-card {
          background-color: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 22px;
        }
        .boardroom-meta-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .boardroom-topic {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }
        .boardroom-status-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .boardroom-chat-log {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-entry {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background-color: rgba(3, 7, 18, 0.5);
          transition: transform 160ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .chat-entry:hover {
            transform: translateX(4px);
          }
        }
        .consensus-entry {
          background-color: rgba(0, 80, 255, 0.1);
          border: 1px solid rgba(0, 80, 255, 0.25);
        }
        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .avatar-cfo { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .avatar-growth { background-color: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .avatar-system { background-color: #0050FF; color: #ffffff; }
        .chat-body { flex: 1; }
        .chat-speaker {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 2px;
        }
        .chat-text {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.45;
        }

        .simulator-footer-bar {
          padding: 14px 20px;
          background-color: rgba(15, 23, 42, 0.8);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-left-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }
        .simulator-launch-btn {
          background-color: #0050FF;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out);
        }
        .simulator-launch-btn:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .simulator-launch-btn:hover {
            background-color: #1a62ff;
          }
        }

        /* 4. Dilemma & Cure Section */
        .dilemma-section {
          margin-bottom: 120px;
        }
        .dilemma-shell {
          padding: 8px;
          border-radius: 36px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dilemma-inner {
          border-radius: 28px;
          background-color: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(16px);
          padding: clamp(28px, 5vw, 48px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dilemma-header-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 50px;
          background-color: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #f43f5e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .dilemma-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: #f8fafc;
          margin-bottom: 16px;
          max-width: 900px;
        }
        .dilemma-desc {
          font-size: 17px;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 850px;
          margin-bottom: 36px;
        }
        .comparison-bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .comparison-card {
          border-radius: 22px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .comparison-card:hover {
            transform: translateY(-2px);
          }
        }
        .card-dilemma-legacy {
          background-color: rgba(15, 23, 42, 0.45);
          border: 1.5px solid rgba(244, 63, 94, 0.25);
        }
        .card-dilemma-founderos {
          background-color: rgba(11, 15, 25, 0.95);
          border: 2px solid #0050FF;
          box-shadow: 0 0 32px rgba(0, 80, 255, 0.2);
        }
        .card-top-marker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .marker-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .badge-legacy { background-color: rgba(244, 63, 94, 0.15); color: #f43f5e; }
        .badge-founderos { background-color: rgba(0, 80, 255, 0.2); color: #38bdf8; }
        .marker-cost {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          color: #f43f5e;
        }
        .card-comp-heading {
          font-size: 22px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 18px;
          letter-spacing: -0.02em;
        }
        .comp-checklist {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .checklist-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          line-height: 1.4;
        }
        .row-danger { color: #cbd5e1; }
        .row-success { color: #f8fafc; }
        .check-icon-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .circle-danger { background-color: #f43f5e; color: #ffffff; }
        .circle-success { background-color: #10b981; color: #030712; }
        .legacy-footer-pill {
          padding: 12px;
          border-radius: 12px;
          background-color: rgba(0, 0, 0, 0.3);
          font-size: 12px;
          color: #94a3b8;
        }
        .founderos-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .founderos-cta-btn {
          background-color: #0050FF;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(0, 80, 255, 0.4);
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out);
        }
        .founderos-cta-btn:active { transform: scale(0.97); }
        @media (hover: hover) and (pointer: fine) {
          .founderos-cta-btn:hover { background-color: #1a62ff; }
        }
        .action-subtext {
          font-size: 12px;
          color: #10b981;
          font-weight: 600;
        }

        /* 5. Six Pillars Bento Grid */
        .pillars-section {
          margin-bottom: 120px;
        }
        .pillars-heading-block {
          text-align: center;
          margin-bottom: 48px;
        }
        .pillars-title {
          font-size: clamp(30px, 4.5vw, 56px);
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #f8fafc;
          line-height: 1.08;
          margin: 0 auto 16px auto;
          max-width: 850px;
        }
        .pillars-subtitle {
          font-size: 17px;
          color: #94a3b8;
          max-width: 680px;
          margin: 0 auto;
        }
        .pillars-bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 24px;
        }
        .bento-wide {
          grid-column: span 2;
        }
        @media (max-width: 860px) {
          .bento-wide {
            grid-column: span 1;
          }
        }
        .bento-card {
          display: flex;
          flex-direction: column;
        }
        .bento-shell {
          padding: 6px;
          border-radius: 28px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          height: 100%;
          transition: transform 200ms var(--ease-out), border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .bento-shell:hover {
            transform: translateY(-3px);
            border-color: rgba(0, 80, 255, 0.35);
            box-shadow: 0 16px 36px -10px rgba(0, 80, 255, 0.2);
          }
        }
        .bento-inner {
          border-radius: 22px;
          background-color: rgba(11, 15, 25, 0.88);
          padding: 28px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .bento-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .bento-icon-frame {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bento-pill-tag {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
          background-color: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          letter-spacing: 0.05em;
        }
        .bento-card-title {
          font-size: 24px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .bento-card-desc {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 22px;
        }
        .bento-bullets-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }
        .bento-bullet-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 500;
        }
        .bento-action-link {
          background: transparent;
          border: none;
          color: #38bdf8;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 0;
          transition: color 150ms var(--ease-out), transform 150ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .bento-action-link:hover {
            color: #f8fafc;
            transform: translateX(3px);
          }
        }

        /* 6. Distribution Hub */
        .downloads-section {
          margin-bottom: 120px;
        }
        .downloads-heading-block {
          text-align: center;
          margin-bottom: 48px;
        }
        .downloads-title {
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #f8fafc;
          line-height: 1.08;
          margin: 0 auto 16px auto;
          max-width: 850px;
        }
        .downloads-subtitle {
          font-size: 17px;
          color: #94a3b8;
          max-width: 680px;
          margin: 0 auto;
        }
        .distribution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .dist-card {
          display: flex;
          flex-direction: column;
        }
        .dist-shell {
          padding: 6px;
          border-radius: 28px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          height: 100%;
          transition: transform 200ms var(--ease-out), border-color 200ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .dist-shell:hover {
            transform: translateY(-2px);
          }
        }
        .card-featured .dist-shell {
          border-color: rgba(0, 80, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 80, 255, 0.2);
        }
        .dist-inner {
          border-radius: 22px;
          background-color: rgba(11, 15, 25, 0.9);
          padding: 32px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .dist-tag-row {
          margin-bottom: 16px;
        }
        .dist-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }
        .badge-primary { background-color: #0050FF; color: #ffffff; }
        .badge-cyan { background-color: #38bdf8; color: #030712; }
        .badge-neutral { background-color: rgba(255, 255, 255, 0.08); color: #94a3b8; }

        .dist-heading {
          font-size: 26px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .dist-desc {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 22px;
        }
        .mono-kbd {
          font-family: var(--font-mono), monospace;
          background-color: rgba(255, 255, 255, 0.1);
          color: #38bdf8;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .dist-specs-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 28px;
        }
        .spec-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #cbd5e1;
        }
        .dist-btn {
          border: none;
          border-radius: 50px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out);
        }
        .dist-btn:active {
          transform: scale(0.97);
        }
        .btn-white {
          background-color: #ffffff;
          color: #030712;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-white:hover { background-color: #f1f5f9; }
        }

        .btn-royal {
          background-color: #0050FF;
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 80, 255, 0.4);
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-royal:hover { background-color: #1a62ff; }
        }

        .btn-glass {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f8fafc;
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-glass:hover { background-color: rgba(255, 255, 255, 0.12); }
        }

        /* 7. Architecture FAQ Interactive Accordion (animate/RECIPES.md) */
        .faq-section {
          margin-bottom: 120px;
        }
        .faq-shell {
          padding: 8px;
          border-radius: 32px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .faq-inner {
          border-radius: 24px;
          background-color: rgba(11, 15, 25, 0.85);
          padding: clamp(28px, 5vw, 44px);
        }
        .faq-title {
          font-size: clamp(24px, 3.5vw, 40px);
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.03em;
          margin-top: 14px;
          margin-bottom: 32px;
          max-width: 800px;
        }
        .faq-accordion-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .faq-accordion-item {
          border-radius: 16px;
          background-color: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          transition: border-color 200ms var(--ease-out), background-color 200ms var(--ease-out);
        }
        .faq-accordion-item[data-open="true"] {
          border-color: rgba(0, 80, 255, 0.35);
          background-color: rgba(15, 23, 42, 0.85);
        }
        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: transparent;
          border: none;
          color: #f8fafc;
          font-size: 16px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          gap: 16px;
          transition: transform 160ms var(--ease-out);
        }
        .faq-question-btn:active {
          transform: scale(0.99);
        }
        .faq-question-text {
          flex: 1;
        }
        .faq-chevron-wrapper {
          color: #38bdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 220ms var(--ease-out);
        }
        .chevron-rotated {
          transform: rotate(180deg);
        }

        /* Sanctioned Accordion Recipe: grid-template-rows 0fr -> 1fr */
        .faq-answer-collapse {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 220ms var(--ease-out), opacity 220ms var(--ease-out);
          opacity: 0;
        }
        .faq-answer-collapse[data-open="true"] {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .faq-answer-inner {
          overflow: hidden;
        }
        .faq-answer-text {
          padding: 0 24px 20px 24px;
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        /* 8. Footer */
        .landing-footer {
          background-color: #070a13;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 60px 24px 44px 24px;
          position: relative;
          z-index: 1;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .footer-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-brand-cluster {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .footer-brand-meta {
          display: flex;
          flex-direction: column;
        }
        .footer-brand-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .footer-brand-tagline {
          font-size: 12px;
          color: #94a3b8;
        }
        .footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-pill-btn {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 160ms var(--ease-out), transform 160ms var(--ease-out);
        }
        .footer-pill-btn:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .footer-pill-btn:hover {
            background-color: rgba(255, 255, 255, 0.12);
          }
        }
        .btn-royal-subtle {
          background-color: #0050FF;
          border-color: #1a62ff;
          color: #ffffff;
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-royal-subtle:hover {
            background-color: #1a62ff;
          }
        }
        .footer-hairline {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.06);
        }
        .footer-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: #94a3b8;
        }
        .footer-status-pills {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
        }
        .status-dot-emerald {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
        .status-dot-blue {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }
        .footer-nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .footer-nav-links a {
          color: #94a3b8;
          transition: color 150ms var(--ease-out);
        }
        @media (hover: hover) and (pointer: fine) {
          .footer-nav-links a:hover {
            color: #f8fafc;
          }
        }
        .footer-copy {
          font-size: 12px;
          color: #64748b;
        }

        /* 9. Keyframe Animations (SKILL.md & RECIPES.md specifications) */
        @keyframes itemFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Tab Panel Entrance: scale(0.98) + opacity: 0 to scale(1) + opacity: 1 */
        @keyframes tabEnter {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-tab-enter {
          animation: tabEnter 220ms var(--ease-out) forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 200ms var(--ease-out) forwards;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }

        /* Staggered lists inside panels */
        .stagger-stat:nth-child(1) { animation: itemFadeIn 220ms var(--ease-out) 30ms forwards; }
        .stagger-stat:nth-child(2) { animation: itemFadeIn 220ms var(--ease-out) 60ms forwards; }
        .stagger-stat:nth-child(3) { animation: itemFadeIn 220ms var(--ease-out) 90ms forwards; }
        .stagger-stat:nth-child(4) { animation: itemFadeIn 220ms var(--ease-out) 120ms forwards; }

        .stagger-item:nth-child(1) { animation: itemFadeIn 200ms var(--ease-out) 40ms forwards; }
        .stagger-item:nth-child(2) { animation: itemFadeIn 200ms var(--ease-out) 80ms forwards; }
        .stagger-item:nth-child(3) { animation: itemFadeIn 200ms var(--ease-out) 120ms forwards; }

        /* 10. PREFERS-REDUCED-MOTION (Accessibility Compliance) */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          .animate-tab-enter,
          .animate-fade-in,
          .stagger-chip,
          .stagger-stat,
          .stagger-item {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .faq-chevron-wrapper {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
