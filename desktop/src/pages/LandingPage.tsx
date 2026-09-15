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
 * Skill: apple-design (Department 2: Design) Implementation Matrix
 *
 * 1. RESPONSE — KILL LATENCY (Section 1):
 *    - Instant pointer-down feedback (:active scale(0.97) with 100ms ease-out).
 *    - Continuous 1:1 tactile feedback during range slider scrubbing.
 *
 * 2. MATERIALS & DEPTH (Section 12):
 *    - Translucent floating materials (backdrop-filter: blur(24px) saturate(180%)).
 *    - Specular highlights: bright top edge hairlines (border-top catching light).
 *    - Material weight hierarchy: heavier chassis for structure, lighter for controls.
 *
 * 3. TYPOGRAPHY — OPTICAL SIZING & TRACKING (Section 15):
 *    - Size-specific letter spacing: negative tracking on display headlines (-0.035em),
 *      neutral tracking on body text (-0.01em), positive tracking on micro-labels (+0.08em).
 *    - Inverse leading: tight leading on large headlines (1.02–1.08), loose on body (1.5).
 *    - Apple system font stack first with Plus Jakarta Sans and JetBrains Mono.
 *
 * 4. ACCESSIBILITY TRIAD (Section 14):
 *    - prefers-reduced-motion: cross-fades, static transitions without displacement.
 *    - prefers-reduced-transparency: frostier solid backgrounds, backdrop-filter removed.
 *    - prefers-contrast: more: high-contrast solid borders.
 *
 * 5. THE EIGHT DESIGN PRINCIPLES (Section 16):
 *    - Purpose, Agency, Responsibility (100% private, sovereign data), Familiarity,
 *      Flexibility, Simplicity (not minimalism — strip the unnecessary), Craft, Delight.
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

  // Interactive Executive Console State
  const [activeTab, setActiveTab] = useState<'telemetry' | 'briefing' | 'treasury' | 'boardroom'>('telemetry');
  const [monthlyBurnRate, setMonthlyBurnRate] = useState<number>(38200);
  const totalCashReserves = 1248000;

  // Interactive Accordion FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Direct manipulation dynamic runway calculation
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
      q: 'Where is my financial and cap table data stored?',
      a: '100% on your local device within encrypted browser IndexedDB storage. No corporate balance sheets, revenue numbers, payroll details, or investor cap table notes ever leave your hardware or touch external cloud servers.',
    },
    {
      q: 'Can I use FounderOS when I have no internet connection?',
      a: 'Yes. FounderOS is engineered offline-first from the ground up. You can manage tasks, model cash runway scenarios, review daily briefings, and track enterprise deal pipelines at 35,000 feet on an airplane with Wi-Fi disabled.',
    },
    {
      q: 'How does the AI Copilot function while maintaining complete privacy?',
      a: 'You supply your own private API keys (Google Gemini, Anthropic, OpenRouter, or local Ollama instances for 100% offline neural models). FounderOS acts strictly as an orchestration interface. Your keys and prompts remain encrypted locally on your drive.',
    },
    {
      q: 'Can I export or migrate my complete workspace at any time?',
      a: 'Yes. Under Settings → Backup, you can generate a cryptographically structured full JSON database export with one click, or restore previous backups with zero vendor lock-in.',
    },
  ];

  return (
    <div className="apple-page-root">
      {/* Ambient Depth Background Fields */}
      <div className="apple-glow glow-primary" />
      <div className="apple-glow glow-secondary" />

      {/* =====================================================================
          1. TRANSLUCENT FLOATING NAVIGATION BAR (Apple Glass & Specular Bevel)
         ===================================================================== */}
      <header className="apple-nav-header">
        <div className="apple-nav-capsule">
          {/* Brand Mark & Identity */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="apple-nav-brand"
            role="button"
            tabIndex={0}
          >
            <div className="apple-brand-frame">
              <img src={founderosLogo} alt="FounderOS" className="apple-brand-img" />
            </div>
            <div className="apple-brand-meta">
              <span className="apple-brand-name">FounderOS</span>
              <span className="apple-brand-edition">Executive Console</span>
            </div>
          </div>

          {/* Nav Quick Links (Size-specific tracking) */}
          <nav className="apple-nav-links">
            <a href="#console" className="apple-nav-anchor">Console</a>
            <a href="#dilemma" className="apple-nav-anchor">The Dilemma</a>
            <a href="#capabilities" className="apple-nav-anchor">Capabilities</a>
            <a href="#distribution" className="apple-nav-anchor">Distribution</a>
            <a href="#architecture" className="apple-nav-anchor">Architecture</a>
          </nav>

          {/* Navigation Action Buttons (Button-in-Button with 100ms press feedback) */}
          <div className="apple-nav-actions">
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              className="apple-btn-secondary"
              title="Download Windows Setup (.exe)"
            >
              <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Setup'}</span>
              <div className="apple-icon-circle circle-cyan">
                {downloadState === 'downloading' ? (
                  <RefreshCw size={11} className="apple-spin-icon" />
                ) : (
                  <Download size={11} strokeWidth={2.5} />
                )}
              </div>
            </button>

            <button
              onClick={onLaunchApp}
              className="apple-btn-primary"
              title="Launch Web Application"
            >
              <span>Launch App</span>
              <div className="apple-icon-circle circle-white">
                <ArrowRight size={11} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Surface */}
      <main className="apple-main-container">
        {/* =====================================================================
            2. HERO DISPLAY SECTION (Optical Sizing, Tight Leading & Negative Tracking)
           ===================================================================== */}
        <section className="apple-hero-section">
          {/* Eyebrow Pill Tag (+0.08em optical tracking) */}
          <div className="apple-eyebrow-pill">
            <span className="apple-eyebrow-pip" />
            <span className="apple-eyebrow-text">FOUNDEROS V1.0 • SOVEREIGN EXECUTIVE RUNTIME</span>
          </div>

          {/* Enormous Display Headline (-0.035em tight display tracking) */}
          <h1 className="apple-hero-display">
            Built for founders who run everything.
          </h1>

          {/* Subheadline: Clear, direct, zero buzzwords (-0.01em tracking, 1.5 leading) */}
          <p className="apple-hero-lead">
            The unified local-first operating system replacing 12 fragmented SaaS subscriptions.
            Executive cash telemetry, automated treasury vaults, AI scenario stress-testing, and
            high-conviction deal pipelines executed directly on your machine.
          </p>

          {/* Dual Action Triggers (100ms Press Response) */}
          <div className="apple-hero-cta-cluster">
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              className="apple-hero-cta-primary"
            >
              <span>
                {downloadState === 'downloading'
                  ? 'Initiating Setup Download...'
                  : 'Download Windows Setup (.exe)'}
              </span>
              <div className="apple-icon-circle circle-royal">
                {downloadState === 'downloading' ? (
                  <RefreshCw size={13} className="apple-spin-icon" />
                ) : (
                  <Download size={13} strokeWidth={2.5} />
                )}
              </div>
            </button>

            <button
              onClick={onLaunchApp}
              className="apple-hero-cta-secondary"
            >
              <span>Launch Web Command Center</span>
              <div className="apple-icon-circle circle-cyan">
                <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Hardware Proof Badges */}
          <div className="apple-proof-strip">
            {[
              { label: '100% Local-First IndexedDB', color: '#34c759' },
              { label: 'Zero Corporate Surveillance', color: '#0071e3' },
              { label: 'Sub-10ms Offline Flight Mode', color: '#af52de' },
              { label: '$0 Forever for Core', color: '#ff9f0a' },
            ].map((chip, idx) => (
              <div key={idx} className="apple-proof-tag">
                <span className="apple-proof-dot" style={{ backgroundColor: chip.color }} />
                <span>{chip.label}</span>
              </div>
            ))}
          </div>

          {/* Download Completion Banner */}
          {downloadState === 'completed' && (
            <div className="apple-download-alert">
              <CheckCircle2 size={16} color="#34c759" />
              <span>
                <strong>FounderOS-Setup.exe</strong> downloaded! Run the installer on Windows to start.
              </span>
            </div>
          )}
        </section>

        {/* =====================================================================
            3. HERO ANCHOR: THE EXECUTIVE CONSOLE WORKBENCH
            Apple double-bezel chassis, segmented tab controls, and direct slider
           ===================================================================== */}
        <section id="console" className="apple-console-section">
          {/* Double-Bezel Outer Enclosure with Specular Top Edge */}
          <div className="apple-chassis-outer">
            <div className="apple-chassis-inner">
              {/* Window Chrome Header Bar */}
              <div className="apple-window-bar">
                <div className="apple-traffic-lights">
                  <span className="apple-light light-red" />
                  <span className="apple-light light-yellow" />
                  <span className="apple-light light-green" />
                  <span className="apple-window-id">founderos.local // sovereign-runtime</span>
                </div>

                {/* Apple Segmented Control for Console Tabs */}
                <div className="apple-segmented-control" role="tablist">
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`apple-segment ${activeTab === 'telemetry' ? 'segment-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'telemetry'}
                  >
                    <TrendingUp size={13} />
                    <span>Executive Pulse</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('briefing')}
                    className={`apple-segment ${activeTab === 'briefing' ? 'segment-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'briefing'}
                  >
                    <Zap size={13} />
                    <span>Morning Intel</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('treasury')}
                    className={`apple-segment ${activeTab === 'treasury' ? 'segment-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'treasury'}
                  >
                    <Landmark size={13} />
                    <span>Treasury Vaults</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('boardroom')}
                    className={`apple-segment ${activeTab === 'boardroom' ? 'segment-active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'boardroom'}
                  >
                    <Bot size={13} />
                    <span>AI Boardroom</span>
                  </button>
                </div>

                <div className="apple-runtime-status">
                  <span className="apple-status-beacon" />
                  <span className="apple-status-text">LOCAL ENGINE VERIFIED</span>
                </div>
              </div>

              {/* Console Main Stage */}
              <div className="apple-console-stage">
                {/* TAB 1: EXECUTIVE TELEMETRY */}
                {activeTab === 'telemetry' && (
                  <div className="apple-console-panel apple-enter-active">
                    <div className="apple-metrics-grid">
                      <div className="apple-metric-card">
                        <div className="apple-metric-header">
                          <span className="apple-metric-label">TOTAL LIQUIDITY</span>
                          <span className="apple-badge badge-green">+12.4% MoM</span>
                        </div>
                        <div className="apple-metric-number">${totalCashReserves.toLocaleString()}</div>
                        <div className="apple-metric-subtext">Reconciled across 3 connected bank vaults</div>
                      </div>

                      <div className="apple-metric-card">
                        <div className="apple-metric-header">
                          <span className="apple-metric-label">CURRENT MONTHLY BURN</span>
                          <span className="apple-badge badge-amber">Controllable</span>
                        </div>
                        <div className="apple-metric-number">${monthlyBurnRate.toLocaleString()}/mo</div>
                        <div className="apple-metric-subtext">Net burn multiple: 0.94x (Top decile)</div>
                      </div>

                      <div className="apple-metric-card metric-spotlight">
                        <div className="apple-metric-header">
                          <span className="apple-metric-label">CALCULATED RUNWAY</span>
                          <span className="apple-badge badge-blue">Live Telemetry</span>
                        </div>
                        <div className="apple-metric-number text-accent-blue">{calculatedRunway} Months</div>
                        <div className="apple-metric-subtext">Zero debt obligations • Default alive</div>
                      </div>

                      <div className="apple-metric-card">
                        <div className="apple-metric-header">
                          <span className="apple-metric-label">ANNUAL RUN-RATE (ARR)</span>
                          <span className="apple-badge badge-green">148% NRR</span>
                        </div>
                        <div className="apple-metric-number">$1,710,000</div>
                        <div className="apple-metric-subtext">Gross margin: 88.4% • Payback: 4.2 mo</div>
                      </div>
                    </div>

                    {/* Direct Manipulation Range Slider */}
                    <div className="apple-slider-console">
                      <div className="apple-slider-header">
                        <div className="slider-header-caption">
                          <Sliders size={14} color="#0071e3" />
                          <span>Interactive Runway Stress-Test: Drag to Adjust Monthly Burn Rate</span>
                        </div>
                        <span className="apple-slider-pill">${monthlyBurnRate.toLocaleString()} / mo</span>
                      </div>
                      <input
                        type="range"
                        min="15000"
                        max="90000"
                        step="1000"
                        value={monthlyBurnRate}
                        onChange={(e) => setMonthlyBurnRate(Number(e.target.value))}
                        className="apple-range-input"
                        aria-label="Adjust Monthly Burn Rate"
                      />
                      <div className="apple-slider-markers">
                        <span>$15,000 (Lean: {(totalCashReserves / 15000).toFixed(1)} mo)</span>
                        <span>$50,000 (Growth: {(totalCashReserves / 50000).toFixed(1)} mo)</span>
                        <span>$90,000 (Expansion: {(totalCashReserves / 90000).toFixed(1)} mo)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MORNING INTELLIGENCE */}
                {activeTab === 'briefing' && (
                  <div className="apple-console-panel apple-enter-active">
                    <div className="apple-memo-card">
                      <div className="apple-memo-top">
                        <div className="apple-memo-stamp">
                          <Sparkles size={13} />
                          <span>DAILY EXECUTIVE BRIEFING • 07:00 AM UTC</span>
                        </div>
                        <span className="apple-memo-timestamp">Synthesized locally on your device in 12ms</span>
                      </div>

                      <h3 className="apple-memo-heading">
                        Founder Daily Priority Memo: 3 Critical Actions for Today
                      </h3>

                      <div className="apple-memo-items">
                        <div className="apple-memo-entry">
                          <span className="memo-entry-index">01</span>
                          <div className="memo-entry-details">
                            <div className="memo-entry-meta">
                              <span className="apple-pill-tag tag-amber">CASH ACCELERATION</span>
                              <span className="memo-metric-impact">Impact: +$45,000</span>
                            </div>
                            <p className="memo-entry-text">
                              <strong>Stripe Enterprise Renewal Due:</strong> Vertex Technologies contract
                              renewing in 48 hours. Early prepayment discount terms ready for 1-click execution.
                            </p>
                          </div>
                        </div>

                        <div className="apple-memo-entry">
                          <span className="memo-entry-index">02</span>
                          <div className="memo-entry-details">
                            <div className="memo-entry-meta">
                              <span className="apple-pill-tag tag-blue">DEAL VELOCITY</span>
                              <span className="memo-metric-impact">Pipeline: Stage 4</span>
                            </div>
                            <p className="memo-entry-text">
                              <strong>Apex Logistics Deal in Motion:</strong> Technical evaluation signed off.
                              Founder closing dialogue scheduled before quotation window closes.
                            </p>
                          </div>
                        </div>

                        <div className="apple-memo-entry">
                          <span className="memo-entry-index">03</span>
                          <div className="memo-entry-details">
                            <div className="memo-entry-meta">
                              <span className="apple-pill-tag tag-green">INFRASTRUCTURE AUDIT</span>
                              <span className="memo-metric-impact">Savings: $1,420/mo</span>
                            </div>
                            <p className="memo-entry-text">
                              <strong>Unused Cloud GPU Instances Flagged:</strong> 4 idle staging clusters discovered
                              in infrastructure scan. Automated shutdown sequence staged for 1-click approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TREASURY VAULTS */}
                {activeTab === 'treasury' && (
                  <div className="apple-console-panel apple-enter-active">
                    <div className="apple-vaults-grid">
                      <div className="apple-vault-tile">
                        <div className="vault-tile-header">
                          <div className="vault-icon-frame icon-green">
                            <Landmark size={18} />
                          </div>
                          <span className="vault-status-badge">PRIMARY OPERATING</span>
                        </div>
                        <div className="vault-tile-title">Silicon Valley Bank Checking</div>
                        <div className="vault-tile-balance">$428,500.00</div>
                        <div className="vault-tile-note">6.2 months operating buffer reserved</div>
                      </div>

                      <div className="apple-vault-tile">
                        <div className="vault-tile-header">
                          <div className="vault-icon-frame icon-blue">
                            <ShieldCheck size={18} />
                          </div>
                          <span className="vault-status-badge">5.2% APY TREASURY</span>
                        </div>
                        <div className="vault-tile-title">Brex High-Yield Liquidity Vault</div>
                        <div className="vault-tile-balance">$682,000.00</div>
                        <div className="vault-tile-note">Yielding ~$2,955/mo in passive cash</div>
                      </div>

                      <div className="apple-vault-tile">
                        <div className="vault-tile-header">
                          <div className="vault-icon-frame icon-purple">
                            <Layers size={18} />
                          </div>
                          <span className="vault-status-badge">TAX ESCROW</span>
                        </div>
                        <div className="vault-tile-title">Quarterly Tax & Payroll Reserve</div>
                        <div className="vault-tile-balance">$137,500.00</div>
                        <div className="vault-tile-note">Automated 25% net revenue set-aside</div>
                      </div>
                    </div>

                    <div className="apple-vault-footnote">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Zero bank credentials stored in the cloud. Balances managed strictly via local encrypted ledger.</span>
                    </div>
                  </div>
                )}

                {/* TAB 4: AI BOARDROOM */}
                {activeTab === 'boardroom' && (
                  <div className="apple-console-panel apple-enter-active">
                    <div className="apple-boardroom-card">
                      <div className="boardroom-header-row">
                        <div className="boardroom-docket-tag">
                          <Terminal size={14} color="#0071e3" />
                          <span>DELIBERATION: Q3 Engineering Capacity vs. 24-Month Runway Extension</span>
                        </div>
                        <span className="boardroom-verdict-pill">CONSENSUS REACHED</span>
                      </div>

                      <div className="boardroom-dialogue-stack">
                        <div className="boardroom-bubble">
                          <div className="boardroom-agent-badge avatar-cfo">CFO</div>
                          <div className="boardroom-bubble-body">
                            <div className="boardroom-agent-role">AI Chief Financial Officer</div>
                            <p className="boardroom-bubble-text">
                              "Adding two full-time engineers increases burn by $32k/mo, compressing runway from 32.6
                              to 21.4 months. I recommend engaging one specialized contractor until ARR clears $2.0M."
                            </p>
                          </div>
                        </div>

                        <div className="boardroom-bubble">
                          <div className="boardroom-agent-badge avatar-growth">VPG</div>
                          <div className="boardroom-bubble-body">
                            <div className="boardroom-agent-role">AI VP of Growth</div>
                            <p className="boardroom-bubble-text">
                              "Stage 4 enterprise deals require SOC2 Type II automation. If engineering slips by 3 months,
                              we risk postponing $380,000 in scheduled enterprise commitments."
                            </p>
                          </div>
                        </div>

                        <div className="boardroom-bubble bubble-consensus">
                          <div className="boardroom-agent-badge avatar-synthesis">SYN</div>
                          <div className="boardroom-bubble-body">
                            <div className="boardroom-agent-role">FounderOS Synthesis Council</div>
                            <p className="boardroom-bubble-text">
                              <strong>Recommended Action:</strong> Engage one dedicated security lead immediately.
                              Fund role exclusively from Brex treasury yield ($2,955/mo offset), preserving cash runway at 28.5 months.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Console Action Footer Bar */}
              <div className="apple-console-footer">
                <div className="console-footer-info">
                  <Cpu size={14} color="#0071e3" />
                  <span>Interactive Demonstration • Test live state changes in the actual desktop environment</span>
                </div>

                <button onClick={onLaunchApp} className="apple-console-enter-btn">
                  <span>Enter Full Workspace</span>
                  <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. THE DILEMMA & THE CURE (Asymmetrical Comparison Bento)
           ===================================================================== */}
        <section id="dilemma" className="apple-section">
          <div className="apple-section-shell">
            <div className="apple-section-inner">
              <div className="apple-eyebrow-pill pill-danger">
                <AlertTriangle size={13} />
                <span>ARCHITECTURAL DILEMMA & THE CURE</span>
              </div>

              <h2 className="apple-section-heading">
                No more chaos. Zero subscription sprawl.
              </h2>

              <p className="apple-section-lead">
                Founders lose an average of 9.4 hours every week copy-pasting numbers across 12 disconnected
                cloud tools, paying thousands in recurring seat fees, and leaking unencrypted financial telemetry
                to third-party ad networks. FounderOS cures this fragmentation with a single sovereign local runtime.
              </p>

              <div className="apple-comparison-grid">
                {/* Legacy SaaS Tax */}
                <div className="comparison-pane pane-legacy">
                  <div className="comparison-pane-head">
                    <span className="comparison-badge badge-legacy">THE 12-TAB CLOUD TAX</span>
                    <span className="comparison-cost">-$4,200/mo Recurring Tax</span>
                  </div>

                  <h3 className="comparison-pane-title">Fragmented, Slow & Leaky</h3>

                  <div className="comparison-items-list">
                    {[
                      'Stripe + QuickBooks + ChartMogul for simple revenue calculations',
                      'HubSpot + Notion + Spreadsheets with broken, stale deal synchronization',
                      'Confidential runway & cap table data stored on third-party cloud servers',
                      'Zero offline functionality; completely unusable on flights or spotty Wi-Fi',
                      'Endless password resets, SSO auth timeouts, and session expired errors',
                    ].map((item, i) => (
                      <div key={i} className="comparison-row row-danger">
                        <div className="apple-status-circle circle-danger">
                          <X size={11} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="comparison-footer-caption">
                    Outcome: Cognitive fatigue, fragmented team context, and compounding subscription creep.
                  </div>
                </div>

                {/* FounderOS Sovereign Runtime */}
                <div className="comparison-pane pane-founderos">
                  <div className="comparison-pane-head">
                    <span className="comparison-badge badge-founderos">THE FOUNDEROS RUNTIME</span>
                    <span className="comparison-cost text-green">$0/mo Core • Sovereign</span>
                  </div>

                  <h3 className="comparison-pane-title">Unified, Instantaneous & Sovereign</h3>

                  <div className="comparison-items-list">
                    {[
                      'Single unified executive cockpit: MRR, ARR, Burn Multiple, and Runway',
                      'Autonomous morning intelligence memo synthesized before your day starts',
                      '100% sovereign IndexedDB storage; zero telemetry sold or leaked',
                      'Operates 100% offline at 35,000 feet with instant sub-10ms queries',
                      'Zero login barriers, zero corporate trackers, immediate keyboard shortcuts',
                    ].map((item, i) => (
                      <div key={i} className="comparison-row row-success">
                        <div className="apple-status-circle circle-success">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="comparison-action-bar">
                    <button onClick={onLaunchApp} className="apple-btn-primary">
                      <span>Experience FounderOS</span>
                      <div className="apple-icon-circle circle-white">
                        <ArrowRight size={11} strokeWidth={2.5} />
                      </div>
                    </button>
                    <span className="comparison-guarantee-text">Free forever for personal & core use</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. THE SIX SOVEREIGN PILLARS (Bento Grid with Concentric Hardware Curves)
           ===================================================================== */}
        <section id="capabilities" className="apple-section">
          <div className="apple-section-header-block">
            <div className="apple-eyebrow-pill">
              <Layers size={13} color="#0071e3" />
              <span>CAPABILITIES MATRIX</span>
            </div>

            <h2 className="apple-section-heading">
              Everything an executive needs. Nothing you don't.
            </h2>

            <p className="apple-section-lead">
              Engineered with translucent hardware materials and powered by
              bulletproof local-first database logic.
            </p>
          </div>

          <div className="apple-bento-grid">
            {/* Pillar 1 (Wide): Executive Telemetry */}
            <div className="apple-bento-card bento-wide">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-cyan">
                      <TrendingUp size={22} />
                    </div>
                    <span className="bento-mono-tag">CORE TELEMETRY</span>
                  </div>

                  <h3 className="bento-heading">Executive Pulse & Cash Engine</h3>
                  <p className="bento-description">
                    Real-time financial telemetry tracking MRR, ARR, Net Burn Multiple, Gross Margins, and Customer Retention
                    reconciled directly from real local transactions and bank vaults.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Instant Net Burn & Runway countdown with dynamic sensitivity stress-testing</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Cohort Net Revenue Retention (NRR) and multi-tier customer health scoring</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Live reconciliation with real bank accounts stored in local IndexedDB</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
                    <span>Explore Executive Telemetry</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pillar 2: Morning Intelligence */}
            <div className="apple-bento-card">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-amber">
                      <Zap size={22} />
                    </div>
                    <span className="bento-mono-tag">DAILY SYNTHESIS</span>
                  </div>

                  <h3 className="bento-heading">Morning Intelligence</h3>
                  <p className="bento-description">
                    An automated briefing synthesized every morning at 7:00 AM so you know exactly where your capital,
                    pipeline, and operations stand before opening email.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#ff9f0a" />
                      <span>3 high-impact prioritized founder action items</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#ff9f0a" />
                      <span>Proactive runway fluctuation anomaly alerts</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
                    <span>Read Sample Memo</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pillar 3: Autonomous AI Copilot */}
            <div className="apple-bento-card">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-purple">
                      <Bot size={22} />
                    </div>
                    <span className="bento-mono-tag">STRATEGY MODELING</span>
                  </div>

                  <h3 className="bento-heading">Autonomous AI Copilot</h3>
                  <p className="bento-description">
                    Stress-test hiring roadmaps, simulate market downturns, and project cash burn across 24 months
                    with your private local AI advisor using OpenRouter, Ollama, or Gemini.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#af52de" />
                      <span>Multi-agent boardroom deliberation and voting</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#af52de" />
                      <span>Zero training on your proprietary corporate data</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
                    <span>Simulate Strategy</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pillar 4: Corporate Treasury */}
            <div className="apple-bento-card">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-green">
                      <Landmark size={22} />
                    </div>
                    <span className="bento-mono-tag">CAPITAL VAULTS</span>
                  </div>

                  <h3 className="bento-heading">Corporate Treasury</h3>
                  <p className="bento-description">
                    Monitor operating checking, tax escrow splits, and high-yield reserve allocations with
                    automated safety buffers and multi-bank aggregation.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Multi-entity liquidity aggregation</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Quarterly automated tax reserve calculator</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
                    <span>Inspect Vaults</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pillar 5: High-Conviction Deal CRM */}
            <div className="apple-bento-card">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-blue">
                      <Users size={22} />
                    </div>
                    <span className="bento-mono-tag">FOUNDER-LED SALES</span>
                  </div>

                  <h3 className="bento-heading">Deal Pipeline & CRM</h3>
                  <p className="bento-description">
                    A laser-focused relationship engine tailored for founder-led sales. Track enterprise negotiations,
                    closing milestones, and probability-weighted pipeline without CRM bloat.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#0071e3" />
                      <span>Kanban stages tailored for founder closing</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#0071e3" />
                      <span>Automated weighted revenue projections</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
                    <span>Open Deal Pipeline</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pillar 6 (Wide): Local-First Sovereign DB */}
            <div className="apple-bento-card bento-wide">
              <div className="bento-shell">
                <div className="bento-card-inner">
                  <div className="bento-card-top">
                    <div className="bento-icon-box icon-white">
                      <HardDrive size={22} />
                    </div>
                    <span className="bento-mono-tag">OFFLINE ARCHITECTURE</span>
                  </div>

                  <h3 className="bento-heading">100% Local-First Sovereign Database</h3>
                  <p className="bento-description">
                    Your balance sheets, cap table notes, client health scores, and pipeline stay encrypted inside your local
                    device IndexedDB. Operates seamlessly with zero external server dependencies.
                  </p>

                  <div className="bento-bullets-stack">
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Sub-10ms local query execution for instant, zero-lag page transitions</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>Full offline flight mode support; works at 35,000 feet without internet</span>
                    </div>
                    <div className="bento-bullet-line">
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>One-click full JSON database export and cryptographic restoration</span>
                    </div>
                  </div>

                  <button onClick={onLaunchApp} className="bento-link-trigger">
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
        <section id="distribution" className="apple-section">
          <div className="apple-section-header-block">
            <div className="apple-eyebrow-pill">
              <Download size={13} color="#0071e3" />
              <span>NATIVE HARDWARE & CLOUDLESS WEB</span>
            </div>

            <h2 className="apple-section-heading">
              Choose your execution surface.
            </h2>

            <p className="apple-section-lead">
              Whether you prefer an automated native Windows installer with system tray background daemon,
              a portable zero-install USB binary, or instant zero-setup web execution.
            </p>
          </div>

          <div className="apple-distribution-grid">
            {/* Target 1: Windows Setup Installer */}
            <div className="apple-dist-card card-featured">
              <div className="dist-card-shell">
                <div className="dist-card-inner">
                  <div className="dist-tag-strip">
                    <span className="dist-status-badge badge-primary">RECOMMENDED FOR WINDOWS</span>
                  </div>

                  <h3 className="dist-card-title">Windows Setup (.exe)</h3>
                  <p className="dist-card-lead">
                    Full native executable installer with automatic Start Menu shortcuts, system tray
                    daemon, and global hotkey <kbd className="apple-mono-kbd">Ctrl+Shift+O</kbd>.
                  </p>

                  <div className="dist-features-col">
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#34c759" />
                      <span>Version: 1.0.0 (Windows 64-bit)</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#34c759" />
                      <span>Package Size: ~73.6 MB (Self-contained)</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#34c759" />
                      <span>Built-in local auto-updater engine</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDownload('setup')}
                    disabled={downloadState === 'downloading'}
                    className="apple-dist-action action-white"
                  >
                    <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Windows Setup'}</span>
                    <div className="apple-icon-circle circle-royal">
                      <Download size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Target 2: Instant Web Command Center */}
            <div className="apple-dist-card">
              <div className="dist-card-shell">
                <div className="dist-card-inner">
                  <div className="dist-tag-strip">
                    <span className="dist-status-badge badge-cyan">ZERO INSTALL • RUNS EVERYWHERE</span>
                  </div>

                  <h3 className="dist-card-title">Connect Web App</h3>
                  <p className="dist-card-lead">
                    Launch the complete FounderOS Command Center immediately in any modern browser.
                    Zero accounts required; data is persisted securely in your local IndexedDB.
                  </p>

                  <div className="dist-features-col">
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#0071e3" />
                      <span>Chrome, Edge, Safari, Firefox compatible</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#0071e3" />
                      <span>Zero download or installation needed</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#0071e3" />
                      <span>Full offline Progressive Web App (PWA)</span>
                    </div>
                  </div>

                  <button
                    onClick={onLaunchApp}
                    className="apple-dist-action action-royal"
                  >
                    <span>Launch Web Application</span>
                    <div className="apple-icon-circle circle-white">
                      <ArrowRight size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Target 3: Standalone Portable Binary */}
            <div className="apple-dist-card">
              <div className="dist-card-shell">
                <div className="dist-card-inner">
                  <div className="dist-tag-strip">
                    <span className="dist-status-badge badge-neutral">STANDALONE PORTABLE</span>
                  </div>

                  <h3 className="dist-card-title">Windows Portable (.exe)</h3>
                  <p className="dist-card-lead">
                    Single standalone executable that runs without registry keys or admin rights.
                    Ideal for encrypted USB drives and strictly isolated corporate workstations.
                  </p>

                  <div className="dist-features-col">
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>No administrator permissions required</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>Zero background service residues left on host</span>
                    </div>
                    <div className="dist-feature-line">
                      <CheckCircle2 size={13} color="#94a3b8" />
                      <span>Encrypted workspace stored next to .exe</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDownload('portable')}
                    disabled={downloadState === 'downloading'}
                    className="apple-dist-action action-glass"
                  >
                    <span>Download Portable (.exe)</span>
                    <div className="apple-icon-circle circle-green">
                      <Download size={12} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. ARCHITECTURAL FAQ ACCORDION
           ===================================================================== */}
        <section id="architecture" className="apple-section">
          <div className="apple-section-shell">
            <div className="apple-section-inner">
              <div className="apple-eyebrow-pill">
                <ShieldCheck size={13} color="#34c759" />
                <span>ARCHITECTURAL GUARANTEES</span>
              </div>

              <h2 className="apple-section-heading">Questions founders ask before trusting us with their company.</h2>

              <div className="apple-faq-stack">
                {faqData.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="apple-faq-row" data-open={isOpen}>
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="apple-faq-trigger"
                        aria-expanded={isOpen}
                      >
                        <span className="apple-faq-question">{item.q}</span>
                        <div className={`apple-faq-chevron ${isOpen ? 'chevron-rotated' : ''}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      <div className="apple-faq-collapse" data-open={isOpen}>
                        <div className="apple-faq-inner">
                          <p className="apple-faq-answer">{item.a}</p>
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
          8. FOOTER (Systemic Clarity & Operational Telemetry)
         ===================================================================== */}
      <footer className="apple-footer">
        <div className="apple-footer-content">
          <div className="apple-footer-top">
            <div className="apple-footer-brand">
              <div className="apple-brand-frame frame-small">
                <img src={founderosLogo} alt="FounderOS" className="apple-brand-img" />
              </div>
              <div className="apple-footer-meta">
                <span className="footer-title">FounderOS</span>
                <span className="footer-tagline">The Sovereign Operating System for Modern Founders</span>
              </div>
            </div>

            <div className="apple-footer-ctas">
              <button onClick={() => triggerDownload('setup')} className="apple-footer-btn">
                <Download size={13} />
                <span>Windows Setup</span>
              </button>

              <button onClick={onLaunchApp} className="apple-footer-btn btn-highlight">
                <span>Launch Web Command Center</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="apple-footer-divider" />

          <div className="apple-footer-bottom">
            <div className="apple-footer-telemetry">
              <span className="telemetry-pill">
                <span className="beacon-green" />
                <span>Engine: Sub-10ms IndexedDB</span>
              </span>
              <span className="telemetry-pill">
                <span className="beacon-blue" />
                <span>Zero Cloud Dependencies</span>
              </span>
            </div>

            <div className="apple-footer-links">
              <a href="#console">Console</a>
              <a href="#dilemma">The Dilemma</a>
              <a href="#capabilities">Capabilities</a>
              <a href="#distribution">Distribution</a>
              <a href="#architecture">Architecture</a>
            </div>

            <div className="apple-footer-copy">
              © {new Date().getFullYear()} FounderOS. Sovereign local-first execution.
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          APPLE DESIGN SYSTEM CSS: Materials, Depth, Typography & Spring Curves
         ===================================================================== */}
      <style>{`
        /* =====================================================================
           APPLE DESIGN SYSTEM CORE TOKENS
           - Optical tracking: size-specific (-0.035em display, +0.08em eyebrows)
           - Inverse leading: 1.04 display, 1.5 body
           - Apple spring curve: cubic-bezier(0.16, 1, 0.3, 1) (damping 1.0, response 0.35)
           - Specular edge: 1px bright top hairline catching light
           ===================================================================== */
        :root {
          --apple-font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif;
          --apple-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          --apple-blue: #0071e3;
          --apple-blue-hover: #0077ed;
          --apple-royal: #0050FF;
          --apple-royal-hover: #1a62ff;
          --apple-green: #34c759;
          --apple-amber: #ff9f0a;
          --apple-purple: #af52de;
          --apple-red: #ff3b30;
          --apple-spring: cubic-bezier(0.16, 1, 0.3, 1);
        }

        .apple-page-root {
          min-height: 100vh;
          background-color: #030712;
          color: #f8fafc;
          font-family: var(--apple-font);
          position: relative;
          overflow-x: hidden;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Ambient Diffuse Glow Layers (Section 12) */
        .apple-glow {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .glow-primary {
          top: -12%;
          left: 15%;
          width: 720px;
          height: 720px;
          background: radial-gradient(circle, rgba(0, 80, 255, 0.12) 0%, rgba(3, 7, 18, 0) 70%);
          filter: blur(100px);
        }
        .glow-secondary {
          top: 45%;
          right: -10%;
          width: 660px;
          height: 660px;
          background: radial-gradient(circle, rgba(0, 113, 227, 0.08) 0%, rgba(3, 7, 18, 0) 70%);
          filter: blur(110px);
        }

        /* 1. Translucent Floating Navigation Bar */
        .apple-nav-header {
          position: sticky;
          top: 16px;
          z-index: 100;
          padding: 0 24px;
          max-width: 1200px;
          margin: 0 auto 24px auto;
        }
        .apple-nav-capsule {
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-radius: 980px;
          padding: 8px 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-top: 1px solid rgba(255, 255, 255, 0.25); /* Specular highlight */
          box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .apple-nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .apple-brand-frame {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background-color: #030712;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #0050FF;
          box-shadow: 0 0 14px rgba(0, 80, 255, 0.4);
        }
        .frame-small {
          width: 30px;
          height: 30px;
          border-radius: 9px;
        }
        .apple-brand-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .apple-brand-meta {
          display: flex;
          flex-direction: column;
        }
        .apple-brand-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f8fafc;
          line-height: 1.1;
        }
        .apple-brand-edition {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }
        .apple-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        @media (max-width: 860px) {
          .apple-nav-links {
            display: none;
          }
        }
        .apple-nav-anchor {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: -0.01em;
          transition: color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-nav-anchor:hover {
            color: #f8fafc;
          }
        }
        .apple-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Apple Tactile Button-in-Button Architecture (Section 1 & 12) */
        .apple-btn-secondary {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-top: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 980px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          transition: transform 100ms ease-out, background-color 140ms ease-out, border-color 140ms ease-out;
        }
        .apple-btn-secondary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.22);
          }
        }

        .apple-btn-primary {
          background: #0050FF;
          border: 1px solid #1a62ff;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 980px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 2px 14px rgba(0, 80, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: transform 100ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out;
        }
        .apple-btn-primary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-btn-primary:hover {
            background: #1a62ff;
            box-shadow: 0 4px 20px rgba(0, 80, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }

        .apple-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 160ms var(--apple-spring);
        }
        .circle-cyan { background-color: #38bdf8; color: #030712; }
        .circle-white { background-color: #ffffff; color: #0050FF; }
        .circle-royal { background-color: #0050FF; color: #ffffff; }
        .circle-green { background-color: #34c759; color: #030712; }

        @media (hover: hover) and (pointer: fine) {
          .apple-btn-primary:hover .apple-icon-circle,
          .apple-btn-secondary:hover .apple-icon-circle,
          .apple-hero-cta-primary:hover .apple-icon-circle,
          .apple-hero-cta-secondary:hover .apple-icon-circle,
          .apple-dist-action:hover .apple-icon-circle {
            transform: translate(2px, -1px);
          }
        }

        /* 2. Hero Section */
        .apple-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }
        .apple-hero-section {
          padding-top: 60px;
          padding-bottom: 48px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .apple-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 980px;
          background: rgba(0, 80, 255, 0.12);
          border: 1px solid rgba(0, 80, 255, 0.35);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em; /* Positive optical tracking for small labels */
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .apple-eyebrow-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #0050FF;
          box-shadow: 0 0 8px #0050FF;
        }
        .apple-hero-display {
          font-size: clamp(38px, 6.5vw, 98px);
          font-weight: 700;
          line-height: 1.02; /* Tight inverse leading */
          letter-spacing: -0.035em; /* Negative tracking for large display */
          color: #f8fafc;
          max-width: 1060px;
          margin: 0 auto 24px auto;
          text-wrap: balance;
        }
        .apple-hero-lead {
          font-size: clamp(16px, 1.8vw, 19px);
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.01em;
          color: #94a3b8;
          max-width: 800px;
          margin: 0 auto 36px auto;
        }
        .apple-hero-cta-cluster {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .apple-hero-cta-primary {
          background: #ffffff;
          color: #030712;
          border: none;
          border-radius: 980px;
          padding: 14px 26px;
          font-size: 15px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(255, 255, 255, 0.18);
          transition: transform 100ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out;
        }
        .apple-hero-cta-primary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-hero-cta-primary:hover {
            background-color: #f1f5f9;
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.28);
          }
        }

        .apple-hero-cta-secondary {
          background: #0050FF;
          color: #ffffff;
          border: 1px solid #1a62ff;
          border-top: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 980px;
          padding: 14px 26px;
          font-size: 15px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 80, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: transform 100ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out;
        }
        .apple-hero-cta-secondary:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-hero-cta-secondary:hover {
            background-color: #1a62ff;
            box-shadow: 0 10px 30px rgba(0, 80, 255, 0.6);
          }
        }

        .apple-proof-strip {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .apple-proof-tag {
          padding: 6px 14px;
          border-radius: 980px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .apple-proof-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .apple-download-alert {
          margin-top: 24px;
          padding: 12px 24px;
          border-radius: 980px;
          background: #0b0f19;
          border: 1.5px solid #34c759;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #f8fafc;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(52, 199, 89, 0.25);
        }

        /* 3. The Executive Console Workbench (Apple Double-Bezel Architecture) */
        .apple-console-section {
          margin: 24px auto 96px auto;
          max-width: 1140px;
        }
        .apple-chassis-outer {
          padding: 8px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.22); /* Machined aluminum highlight */
          box-shadow: 0 28px 70px -15px rgba(0, 0, 0, 0.75);
        }
        .apple-chassis-inner {
          border-radius: 18px;
          background-color: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .apple-window-bar {
          padding: 14px 20px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .apple-traffic-lights {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .apple-light {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .light-red { background-color: #ff3b30; }
        .light-yellow { background-color: #ff9f0a; }
        .light-green { background-color: #34c759; }
        .apple-window-id {
          font-family: var(--apple-mono);
          font-size: 11px;
          color: #64748b;
          margin-left: 8px;
        }

        /* Apple Segmented Control Recipe (Section 4 & 16) */
        .apple-segmented-control {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.4);
          padding: 3px;
          border-radius: 980px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          gap: 2px;
        }
        .apple-segment {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 980px;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 140ms ease-out, color 140ms ease-out, transform 100ms ease-out;
        }
        .apple-segment:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-segment:hover {
            color: #f8fafc;
          }
        }
        .segment-active {
          background: rgba(255, 255, 255, 0.12);
          color: #f8fafc;
          border-top: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .apple-runtime-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .apple-status-beacon {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #34c759;
          box-shadow: 0 0 8px #34c759;
        }
        .apple-status-text {
          font-family: var(--apple-mono);
          font-size: 11px;
          font-weight: 600;
          color: #34c759;
          letter-spacing: 0.05em;
        }

        .apple-console-stage {
          padding: 28px;
          min-height: 380px;
          background: radial-gradient(circle at 50% 0%, rgba(0, 80, 255, 0.05) 0%, rgba(11, 15, 25, 0) 60%);
        }

        /* Telemetry Cards */
        .apple-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .apple-metric-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 140ms ease-out, border-color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-metric-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.18);
          }
        }
        .metric-spotlight {
          background: rgba(0, 80, 255, 0.08);
          border-color: rgba(0, 80, 255, 0.3);
          border-top-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 24px rgba(0, 80, 255, 0.15);
        }
        .apple-metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .apple-metric-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }
        .apple-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 980px;
        }
        .badge-green { background-color: rgba(52, 199, 89, 0.15); color: #34c759; }
        .badge-amber { background-color: rgba(255, 159, 10, 0.15); color: #ff9f0a; }
        .badge-blue { background-color: rgba(0, 113, 227, 0.2); color: #38bdf8; }

        .apple-metric-number {
          font-family: var(--apple-font);
          font-size: 28px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }
        .text-accent-blue { color: #38bdf8; }
        .text-green { color: #34c759; }

        .apple-metric-subtext {
          font-size: 12px;
          color: #64748b;
        }

        /* Direct Manipulation Scrubbing Slider (Section 2) */
        .apple-slider-console {
          background: rgba(3, 7, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .apple-slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .slider-header-caption {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }
        .apple-slider-pill {
          font-family: var(--apple-mono);
          font-size: 13px;
          font-weight: 700;
          color: #38bdf8;
          padding: 3px 10px;
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.1);
        }
        .apple-range-input {
          width: 100%;
          cursor: pointer;
          accent-color: #0050FF;
        }
        .apple-slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
        }

        /* Morning Briefing */
        .apple-memo-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          padding: 24px;
        }
        .apple-memo-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .apple-memo-stamp {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #ff9f0a;
          letter-spacing: 0.08em;
        }
        .apple-memo-timestamp {
          font-family: var(--apple-mono);
          font-size: 11px;
          color: #64748b;
        }
        .apple-memo-heading {
          font-size: 20px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 18px;
          letter-spacing: -0.02em;
        }
        .apple-memo-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .apple-memo-entry {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(3, 7, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 140ms ease-out, border-color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-memo-entry:hover {
            transform: translateX(4px);
            border-color: rgba(255, 255, 255, 0.15);
          }
        }
        .memo-entry-index {
          font-family: var(--apple-mono);
          font-size: 14px;
          font-weight: 700;
          color: #0050FF;
          padding-top: 2px;
        }
        .memo-entry-details {
          flex: 1;
        }
        .memo-entry-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .apple-pill-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .tag-amber { background-color: rgba(255, 159, 10, 0.2); color: #ff9f0a; }
        .tag-blue { background-color: rgba(0, 113, 227, 0.2); color: #38bdf8; }
        .tag-green { background-color: rgba(52, 199, 89, 0.2); color: #34c759; }
        .memo-metric-impact {
          font-family: var(--apple-mono);
          font-size: 11px;
          color: #94a3b8;
        }
        .memo-entry-text {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.45;
        }

        /* Treasury Grid */
        .apple-vaults-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }
        .apple-vault-tile {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform 140ms ease-out, border-color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-vault-tile:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.18);
          }
        }
        .vault-tile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vault-icon-frame {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-green { background-color: rgba(52, 199, 89, 0.15); color: #34c759; }
        .icon-blue { background-color: rgba(0, 113, 227, 0.2); color: #38bdf8; }
        .icon-purple { background-color: rgba(175, 82, 222, 0.15); color: #af52de; }
        .icon-amber { background-color: rgba(255, 159, 10, 0.15); color: #ff9f0a; }
        .icon-cyan { background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; }
        .icon-white { background-color: rgba(255, 255, 255, 0.1); color: #f8fafc; }

        .vault-status-badge {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .vault-tile-title {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
        }
        .vault-tile-balance {
          font-family: var(--apple-mono);
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }
        .vault-tile-note {
          font-size: 12px;
          color: #64748b;
        }
        .apple-vault-footnote {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(3, 7, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: #94a3b8;
        }

        /* Boardroom Dialogue */
        .apple-boardroom-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          padding: 22px;
        }
        .boardroom-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .boardroom-docket-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
        }
        .boardroom-verdict-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          background-color: rgba(52, 199, 89, 0.15);
          color: #34c759;
        }
        .boardroom-dialogue-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .boardroom-bubble {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(3, 7, 18, 0.5);
          transition: transform 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .boardroom-bubble:hover {
            transform: translateX(4px);
          }
        }
        .bubble-consensus {
          background: rgba(0, 80, 255, 0.1);
          border: 1px solid rgba(0, 80, 255, 0.25);
          border-top: 1px solid rgba(56, 189, 248, 0.35);
        }
        .boardroom-agent-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-family: var(--apple-mono);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .avatar-cfo { background-color: rgba(255, 159, 10, 0.2); color: #ff9f0a; }
        .avatar-growth { background-color: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .avatar-synthesis { background-color: #0050FF; color: #ffffff; }
        .boardroom-bubble-body { flex: 1; }
        .boardroom-agent-role {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 2px;
        }
        .boardroom-bubble-text {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.45;
        }

        .apple-console-footer {
          padding: 14px 20px;
          background: rgba(15, 23, 42, 0.8);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .console-footer-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }
        .apple-console-enter-btn {
          background-color: #0050FF;
          color: #ffffff;
          border: none;
          border-radius: 980px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 100ms ease-out, background-color 140ms ease-out;
        }
        .apple-console-enter-btn:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-console-enter-btn:hover {
            background-color: #1a62ff;
          }
        }

        /* 4. Dilemma & Cure Section */
        .apple-section {
          margin-bottom: 96px;
        }
        .apple-section-shell {
          padding: 8px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
        }
        .apple-section-inner {
          border-radius: 20px;
          background: rgba(11, 15, 25, 0.88);
          backdrop-filter: blur(16px);
          padding: clamp(28px, 4vw, 44px);
        }
        .pill-danger {
          background-color: rgba(255, 59, 48, 0.12);
          border-color: rgba(255, 59, 48, 0.35);
          color: #ff3b30;
        }
        .apple-section-heading {
          font-size: clamp(28px, 3.8vw, 46px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: #f8fafc;
          margin-top: 14px;
          margin-bottom: 16px;
          max-width: 850px;
        }
        .apple-section-lead {
          font-size: 16px;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 800px;
          margin-bottom: 32px;
        }
        .apple-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        .comparison-pane {
          border-radius: 18px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .comparison-pane:hover {
            transform: translateY(-2px);
          }
        }
        .pane-legacy {
          background: rgba(15, 23, 42, 0.45);
          border: 1.5px solid rgba(255, 59, 48, 0.25);
        }
        .pane-founderos {
          background: rgba(11, 15, 25, 0.95);
          border: 2px solid #0050FF;
          border-top: 2px solid #38bdf8;
          box-shadow: 0 0 32px rgba(0, 80, 255, 0.2);
        }
        .comparison-pane-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .comparison-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .badge-legacy { background-color: rgba(255, 59, 48, 0.15); color: #ff3b30; }
        .badge-founderos { background-color: rgba(0, 80, 255, 0.2); color: #38bdf8; }
        .comparison-cost {
          font-family: var(--apple-mono);
          font-size: 12px;
          font-weight: 700;
          color: #ff3b30;
        }
        .comparison-pane-title {
          font-size: 21px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .comparison-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .comparison-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          line-height: 1.4;
        }
        .row-danger { color: #cbd5e1; }
        .row-success { color: #f8fafc; }
        .apple-status-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .circle-danger { background-color: #ff3b30; color: #ffffff; }
        .circle-success { background-color: #34c759; color: #030712; }
        .comparison-footer-caption {
          padding: 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          font-size: 12px;
          color: #94a3b8;
        }
        .comparison-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .comparison-guarantee-text {
          font-size: 12px;
          color: #34c759;
          font-weight: 600;
        }

        /* 5. Six Pillars Bento Grid */
        .apple-section-header-block {
          text-align: center;
          margin-bottom: 44px;
        }
        .apple-bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 20px;
        }
        .bento-wide {
          grid-column: span 2;
        }
        @media (max-width: 860px) {
          .bento-wide {
            grid-column: span 1;
          }
        }
        .apple-bento-card {
          display: flex;
          flex-direction: column;
        }
        .bento-shell {
          padding: 6px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          height: 100%;
          transition: transform 140ms ease-out, border-color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .bento-shell:hover {
            transform: translateY(-2px);
            border-color: rgba(0, 80, 255, 0.35);
          }
        }
        .bento-card-inner {
          border-radius: 16px;
          background: rgba(11, 15, 25, 0.88);
          padding: 26px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .bento-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .bento-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bento-mono-tag {
          font-family: var(--apple-mono);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 980px;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          letter-spacing: 0.05em;
        }
        .bento-heading {
          font-size: 22px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .bento-description {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .bento-bullets-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 22px;
        }
        .bento-bullet-line {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 500;
        }
        .bento-link-trigger {
          background: transparent;
          border: none;
          color: #0071e3;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 0;
          transition: color 140ms ease-out, transform 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .bento-link-trigger:hover {
            color: #38bdf8;
            transform: translateX(3px);
          }
        }

        /* 6. Distribution Hub */
        .apple-distribution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        .apple-dist-card {
          display: flex;
          flex-direction: column;
        }
        .dist-card-shell {
          padding: 6px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          height: 100%;
          transition: transform 140ms ease-out, border-color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .dist-card-shell:hover {
            transform: translateY(-2px);
          }
        }
        .card-featured .dist-card-shell {
          border-color: rgba(0, 80, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 80, 255, 0.2);
        }
        .dist-card-inner {
          border-radius: 16px;
          background: rgba(11, 15, 25, 0.9);
          padding: 28px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .dist-tag-strip {
          margin-bottom: 14px;
        }
        .dist-status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }
        .badge-primary { background-color: #0050FF; color: #ffffff; }
        .badge-cyan { background-color: #0071e3; color: #ffffff; }
        .badge-neutral { background-color: rgba(255, 255, 255, 0.08); color: #94a3b8; }

        .dist-card-title {
          font-size: 24px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .dist-card-lead {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .apple-mono-kbd {
          font-family: var(--apple-mono);
          background: rgba(255, 255, 255, 0.1);
          color: #38bdf8;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .dist-features-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 26px;
        }
        .dist-feature-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #cbd5e1;
        }
        .apple-dist-action {
          border: none;
          border-radius: 980px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 100ms ease-out, background-color 140ms ease-out;
        }
        .apple-dist-action:active {
          transform: scale(0.97);
        }
        .action-white {
          background-color: #ffffff;
          color: #030712;
          box-shadow: 0 4px 18px rgba(255, 255, 255, 0.15);
        }
        @media (hover: hover) and (pointer: fine) {
          .action-white:hover { background-color: #f1f5f9; }
        }

        .action-royal {
          background-color: #0050FF;
          color: #ffffff;
          box-shadow: 0 4px 18px rgba(0, 80, 255, 0.4);
        }
        @media (hover: hover) and (pointer: fine) {
          .action-royal:hover { background-color: #1a62ff; }
        }

        .action-glass {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f8fafc;
        }
        @media (hover: hover) and (pointer: fine) {
          .action-glass:hover { background: rgba(255, 255, 255, 0.12); }
        }

        /* 7. Architectural FAQ Accordion */
        .apple-faq-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .apple-faq-row {
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          overflow: hidden;
          transition: border-color 160ms ease-out, background-color 160ms ease-out;
        }
        .apple-faq-row[data-open="true"] {
          border-color: rgba(0, 80, 255, 0.35);
          background: rgba(15, 23, 42, 0.85);
        }
        .apple-faq-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          background: transparent;
          border: none;
          color: #f8fafc;
          font-size: 15px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          gap: 16px;
          transition: transform 100ms ease-out;
        }
        .apple-faq-trigger:active {
          transform: scale(0.99);
        }
        .apple-faq-question {
          flex: 1;
        }
        .apple-faq-chevron {
          color: #0071e3;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 180ms var(--apple-spring);
        }
        .chevron-rotated {
          transform: rotate(180deg);
        }
        .apple-faq-collapse {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 180ms var(--apple-spring), opacity 180ms ease-out;
          opacity: 0;
        }
        .apple-faq-collapse[data-open="true"] {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .apple-faq-inner {
          overflow: hidden;
        }
        .apple-faq-answer {
          padding: 0 22px 18px 22px;
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        /* 8. Footer */
        .apple-footer {
          background-color: #070a13;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 56px 24px 40px 24px;
          position: relative;
          z-index: 1;
        }
        .apple-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .apple-footer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .apple-footer-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .apple-footer-meta {
          display: flex;
          flex-direction: column;
        }
        .footer-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .footer-tagline {
          font-size: 12px;
          color: #94a3b8;
        }
        .apple-footer-ctas {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .apple-footer-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 980px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 140ms ease-out, transform 100ms ease-out;
        }
        .apple-footer-btn:active {
          transform: scale(0.97);
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-footer-btn:hover {
            background: rgba(255, 255, 255, 0.12);
          }
        }
        .btn-highlight {
          background-color: #0050FF;
          border-color: #1a62ff;
          color: #ffffff;
        }
        @media (hover: hover) and (pointer: fine) {
          .btn-highlight:hover {
            background-color: #1a62ff;
          }
        }
        .apple-footer-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.06);
        }
        .apple-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: #94a3b8;
        }
        .apple-footer-telemetry {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .telemetry-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--apple-mono);
          font-size: 11px;
        }
        .beacon-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #34c759;
          box-shadow: 0 0 6px #34c759;
        }
        .beacon-blue {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #0071e3;
          box-shadow: 0 0 6px #0071e3;
        }
        .apple-footer-links {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .apple-footer-links a {
          color: #94a3b8;
          transition: color 140ms ease-out;
        }
        @media (hover: hover) and (pointer: fine) {
          .apple-footer-links a:hover {
            color: #f8fafc;
          }
        }
        .apple-footer-copy {
          font-size: 12px;
          color: #64748b;
        }

        /* Fluid Material Enter (Section 12) */
        @keyframes appleEnter {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .apple-enter-active {
          animation: appleEnter 180ms var(--apple-spring) forwards;
        }

        @keyframes appleSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .apple-spin-icon {
          animation: appleSpin 1s linear infinite;
        }

        /* =====================================================================
           ACCESSIBILITY TRIAD (Section 14: Reduced Motion, Transparency, Contrast)
           ===================================================================== */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          .apple-enter-active {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .apple-faq-chevron {
            transition: none !important;
          }
        }

        @media (prefers-reduced-transparency: reduce) {
          .apple-nav-capsule,
          .apple-section-inner,
          .apple-window-bar,
          .apple-chassis-inner {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background-color: #0b0f19 !important;
          }
        }

        @media (prefers-contrast: more) {
          .apple-nav-capsule,
          .apple-chassis-outer,
          .apple-section-shell,
          .bento-shell,
          .dist-card-shell,
          .apple-faq-row {
            border: 2px solid #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
