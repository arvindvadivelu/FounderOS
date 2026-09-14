import React, { useState, useMemo } from 'react';
import founderosLogo from '../assets/founderos-logo.jpg';

/**
 * ============================================================================
 * Skill: minimalist-ui (Department 2: Design) Protocol Implementation
 *
 * 1. PALETTE (Section 4):
 *    - Canvas: Warm bone off-white (#FBFBFA) and pure white (#FFFFFF).
 *    - Structural Borders: Ultra-light gray (#EAEAEA, 1px solid).
 *    - Typography: Off-black charcoal (#111111), secondary text (#555555), muted (#787774).
 *    - Muted Pastels (Accents only):
 *      - Green: #EDF3EC (text: #346538)
 *      - Blue: #E1F3FE (text: #1F6C9F)
 *      - Yellow/Amber: #FBF3DB (text: #956400)
 *      - Red: #FDEBEC (text: #9F2F2D)
 *
 * 2. TYPOGRAPHIC CONTRAST (Section 3):
 *    - Editorial Serif for Hero & Headings: Newsreader, Playfair Display, Georgia, serif.
 *      Tight tracking (-0.03em) and tight line-height (1.08).
 *    - Primary Sans-Serif for UI & Body: SF Pro Display, Geist Sans, -apple-system, sans-serif.
 *      Comfortable line-height (1.6) for reading.
 *    - Monospace for code, metrics, and keystrokes: JetBrains Mono, SF Mono, monospace.
 *
 * 3. COMPONENT DIRECTIVES (Section 5):
 *    - Bento box cards: 1px solid #EAEAEA, border-radius 8px-12px, generous whitespace.
 *    - Primary CTA buttons: Solid #111111, white text, 6px radius, no box shadow, :active scale(0.98).
 *    - Secondary buttons: Pure white #FFFFFF, 1px solid #EAEAEA, #111111 text, 6px radius.
 *    - Status Badges: Pill-shaped (9999px), text-xs, uppercase, wide tracking, pastel backgrounds.
 *    - Faux-OS Window Chrome: Minimalist container with 3 gray window control dots (#D8D8D8).
 *    - Accordion FAQ: Stripped container boxes, separated solely by 1px solid #EAEAEA, clean +/− glyphs.
 *    - Keystroke Micro-UIs: Physical <kbd> elements with #EAEAEA border and #F7F6F3 background.
 *
 * 4. ABSOLUTE NEGATIVE CONSTRAINTS (Section 2):
 *    - NO Inter, Roboto, or Open Sans.
 *    - NO Lucide/Feather thin-line icons. Clean custom geometric SVG primitives used.
 *    - NO heavy drop shadows. Default shadow is none; hover shadow is ultra-subtle 0 2px 8px rgba(0,0,0,0.04).
 *    - NO gradients or neon colors.
 *    - NO rounded-full for cards or primary buttons.
 *    - NO emojis anywhere.
 *    - NO AI copywriting clichés ("elevate", "seamless", "next-gen", "game-changer").
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
  // Download URLs for Windows distributions
  const setupExecutableUrl = '/downloads/FounderOS-Setup.exe';
  const portableExecutableUrl = '/downloads/FounderOS-Portable.exe';

  // Interactive Cockpit State
  const [activeTab, setActiveTab] = useState<'telemetry' | 'briefing' | 'treasury' | 'boardroom'>('telemetry');
  
  // Direct Manipulation Runway Simulator
  const [monthlyBurn, setMonthlyBurn] = useState<number>(41200);
  const cashReserve = 925000;
  const calculatedRunway = useMemo(() => {
    return (cashReserve / monthlyBurn).toFixed(1);
  }, [monthlyBurn, cashReserve]);

  // Accordion FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Download Dialog State
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    type: 'setup' | 'portable';
    title: string;
    filename: string;
    url: string;
  }>({
    isOpen: false,
    type: 'setup',
    title: '',
    filename: '',
    url: '',
  });

  const handleDownload = (type: 'setup' | 'portable') => {
    const isSetup = type === 'setup';
    const filename = isSetup ? 'FounderOS-Setup-1.0.0.exe' : 'FounderOS-Portable-1.0.0.exe';
    const url = isSetup ? setupExecutableUrl : portableExecutableUrl;
    const title = isSetup ? 'Windows Desktop Installer' : 'Windows Portable Executable';

    setDownloadModal({
      isOpen: true,
      type,
      title,
      filename,
      url,
    });

    if (isSetup && onDownloadSetup) {
      onDownloadSetup();
    } else if (!isSetup && onDownloadPortable) {
      onDownloadPortable();
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const faqItems = [
    {
      question: 'How does FounderOS operate without a cloud server or external database?',
      answer:
        'FounderOS embeds its relational store directly on your operating system using encrypted IndexedDB and client-side SQLite. Queries execute locally in under 4 milliseconds with zero round trips to external servers. Your financial balances, board deliberations, and customer records never leave your physical device.',
    },
    {
      question: 'Can FounderOS run in complete offline isolation (Flight Mode)?',
      answer:
        'Yes. FounderOS was engineered from the ground up for sovereign offline execution. You can review executive metrics, adjust cap tables, review local documents, and model scenario stress-tests mid-flight or during connectivity outages. Local state persists indefinitely without internet verification.',
    },
    {
      question: 'What is the architectural difference between the Installer and Portable versions?',
      answer:
        'The Windows Installer (.exe) installs FounderOS into your Windows Program Files directory, configures start menu shortcuts, and registers file associations. The Windows Portable (.exe) runs entirely self-contained without installation or administrator privileges, writing state to its local folder — ideal for encrypted USB drives or restricted corporate laptops.',
    },
    {
      question: 'How are sensitive API keys and banking credentials protected?',
      answer:
        'All API credentials (such as local LLM endpoints or payment gateways) are stored strictly on your local machine using standard AES-GCM client-side encryption. No telemetry, usage analytics, or token keys are ever dispatched to FounderOS maintainers or third-party advertising trackers.',
    },
    {
      question: 'Can I export or migrate my workspace data at any time?',
      answer:
        'Yes. FounderOS provides one-click export into standard JSON, SQLite dump, and CSV formats. You maintain unconditional ownership of your startup records without vendor lock-in or migration fees.',
    },
  ];

  return (
    <div className="min-page">
      {/* =====================================================================
          TOP NAVIGATION BAR (Editorial Document Header)
          ===================================================================== */}
      <header className="min-nav">
        <div className="min-nav-container">
          <div className="min-brand" onClick={onLaunchApp} role="button" tabIndex={0}>
            <img src={founderosLogo} alt="FounderOS Logo" className="min-brand-img" />
            <span className="min-brand-name">FounderOS</span>
            <span className="min-badge min-badge-subtle">2026.4</span>
          </div>

          <nav className="min-nav-links">
            <a href="#overview" className="min-nav-link">Overview</a>
            <a href="#cockpit" className="min-nav-link">Workspace</a>
            <a href="#architecture" className="min-nav-link">Architecture</a>
            <a href="#distribution" className="min-nav-link">Releases</a>
            <a href="#faq" className="min-nav-link">FAQ</a>
          </nav>

          <div className="min-nav-actions">
            <button
              onClick={onLaunchApp}
              className="min-btn min-btn-secondary min-btn-sm"
              title="Launch browser application"
            >
              Web App
            </button>
            <button
              onClick={() => handleDownload('setup')}
              className="min-btn min-btn-primary min-btn-sm"
            >
              <span>Download .exe</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION (Editorial Serif + Macro-Whitespace)
          ===================================================================== */}
      <section id="overview" className="min-section min-hero-section">
        <div className="min-container">
          <div className="min-hero-eyebrow">
            <span className="min-badge min-badge-green">LOCAL-FIRST EXECUTIVE RUNTIME</span>
            <span className="min-hero-build">VERSION 1.0.4 • 64-BIT BINARY</span>
          </div>

          <h1 className="min-hero-title">
            The operating system for founders who run lean, sovereign companies.
          </h1>

          <p className="min-hero-lead">
            FounderOS unifies cash runway modeling, real-time burn telemetry, automated morning memos, 
            and multi-agent scenario deliberations into an offline-first desktop executable. Zero monthly seat taxes. 
            Zero cloud telemetry. Your company data remains entirely on your machine.
          </p>

          <div className="min-hero-cta-group">
            <button
              onClick={() => handleDownload('setup')}
              className="min-btn min-btn-primary min-btn-lg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download for Windows (Installer)</span>
            </button>

            <button
              onClick={onLaunchApp}
              className="min-btn min-btn-secondary min-btn-lg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Launch Web Command Center</span>
            </button>
          </div>

          <div className="min-hero-meta">
            <span className="min-meta-item">
              <span className="min-dot min-dot-green"></span>
              Sub-4ms IndexedDB local queries
            </span>
            <span className="min-meta-sep">/</span>
            <span className="min-meta-item">
              <span className="min-dot min-dot-blue"></span>
              100% Offline Flight Mode
            </span>
            <span className="min-meta-sep">/</span>
            <span className="min-meta-item">
              <span className="min-dot min-dot-charcoal"></span>
              AES-GCM client-side encryption
            </span>
          </div>

          <div className="min-keystroke-hints">
            <span className="min-kbd-label">Quick access:</span>
            <span className="min-kbd-unit"><kbd className="min-kbd">Tab</kbd> Switch View</span>
            <span className="min-kbd-unit"><kbd className="min-kbd">Ctrl</kbd> + <kbd className="min-kbd">K</kbd> Command Palette</span>
            <span className="min-kbd-unit"><kbd className="min-kbd">Ctrl</kbd> + <kbd className="min-kbd">B</kbd> Boardroom</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FAUX-OS WINDOW CHROME (Interactive Workspace Cockpit)
          ===================================================================== */}
      <section id="cockpit" className="min-section min-section-cockpit">
        <div className="min-container">
          <div className="min-section-header">
            <span className="min-badge min-badge-subtle">INTERACTIVE WORKSPACE PREVIEW</span>
            <h2 className="min-section-title">Test-drive the executive runtime.</h2>
            <p className="min-section-desc">
              Interact directly with the local dashboard modules below. Everything executes client-side without network requests.
            </p>
          </div>

          {/* Faux-OS Window Chrome */}
          <div className="min-window">
            {/* Top Bar with 3 light-gray macOS dots */}
            <div className="min-window-topbar">
              <div className="min-window-dots">
                <span className="min-dot-window min-dot-close" />
                <span className="min-dot-window min-dot-min" />
                <span className="min-dot-window min-dot-max" />
              </div>
              <div className="min-window-title">
                FounderOS — Sovereign Workspace (Local Runtime)
              </div>
              <div className="min-window-status">
                <span className="min-pulse-dot" />
                <span>DB: 3.2ms</span>
              </div>
            </div>

            {/* Document Tabs Bar */}
            <div className="min-window-tabs">
              <button
                className={`min-tab-btn ${activeTab === 'telemetry' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('telemetry')}
              >
                <span className="min-tab-num">01</span>
                <span>Executive Pulse</span>
              </button>
              <button
                className={`min-tab-btn ${activeTab === 'briefing' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('briefing')}
              >
                <span className="min-tab-num">02</span>
                <span>Morning Memo</span>
              </button>
              <button
                className={`min-tab-btn ${activeTab === 'treasury' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('treasury')}
              >
                <span className="min-tab-num">03</span>
                <span>Treasury Vaults</span>
              </button>
              <button
                className={`min-tab-btn ${activeTab === 'boardroom' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('boardroom')}
              >
                <span className="min-tab-num">04</span>
                <span>AI Boardroom</span>
              </button>
            </div>

            {/* Window Content Body */}
            <div className="min-window-body">
              {/* TAB 1: EXECUTIVE PULSE & DIRECT RUNWAY SIMULATOR */}
              {activeTab === 'telemetry' && (
                <div className="min-tab-pane">
                  {/* Top Stats Cards */}
                  <div className="min-stats-grid">
                    <div className="min-stat-card">
                      <div className="min-stat-label">Monthly Recurring Revenue</div>
                      <div className="min-stat-val">$142,500</div>
                      <div className="min-stat-foot">
                        <span className="min-badge min-badge-green">+18.4% MoM</span>
                        <span className="min-stat-sub">94 enterprise seats</span>
                      </div>
                    </div>

                    <div className="min-stat-card">
                      <div className="min-stat-label">Total Liquid Cash</div>
                      <div className="min-stat-val">${cashReserve.toLocaleString()}</div>
                      <div className="min-stat-foot">
                        <span className="min-badge min-badge-blue">Mercury + SVB</span>
                        <span className="min-stat-sub">5.12% Treasury yield</span>
                      </div>
                    </div>

                    <div className="min-stat-card">
                      <div className="min-stat-label">Simulated Net Burn</div>
                      <div className="min-stat-val min-mono-num">${monthlyBurn.toLocaleString()}/mo</div>
                      <div className="min-stat-foot">
                        <span className="min-badge min-badge-yellow">Controlled</span>
                        <span className="min-stat-sub">Payroll + Cloud</span>
                      </div>
                    </div>

                    <div className="min-stat-card">
                      <div className="min-stat-label">Projected Runway</div>
                      <div className="min-stat-val min-mono-num">{calculatedRunway} mo</div>
                      <div className="min-stat-foot">
                        <span className={`min-badge ${parseFloat(calculatedRunway) >= 18 ? 'min-badge-green' : parseFloat(calculatedRunway) >= 12 ? 'min-badge-yellow' : 'min-badge-red'}`}>
                          {parseFloat(calculatedRunway) >= 18 ? 'Strong Reserve' : parseFloat(calculatedRunway) >= 12 ? 'Adequate' : 'Review Required'}
                        </span>
                        <span className="min-stat-sub">Zero debt covenants</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Manipulation Runway Simulator */}
                  <div className="min-simulator-panel">
                    <div className="min-sim-header">
                      <div>
                        <div className="min-sim-title">Direct Runway Stress-Test</div>
                        <div className="min-sim-sub">
                          Drag the burn throttle to simulate hiring or contraction scenarios in real time.
                        </div>
                      </div>
                      <div className="min-sim-readout">
                        <span className="min-sim-burn-label">Monthly Burn:</span>
                        <span className="min-sim-burn-val">${monthlyBurn.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="min-slider-wrapper">
                      <input
                        type="range"
                        min="15000"
                        max="95000"
                        step="1000"
                        value={monthlyBurn}
                        onChange={(e) => setMonthlyBurn(Number(e.target.value))}
                        className="min-range-slider"
                      />
                      <div className="min-slider-markers">
                        <span>$15k (Lean)</span>
                        <span>$41.2k (Current)</span>
                        <span>$65k (+2 Hires)</span>
                        <span>$95k (Aggressive)</span>
                      </div>
                    </div>

                    <div className="min-sim-summary">
                      <div className="min-sim-bullet">
                        <span className="min-bullet-dot" />
                        <span>
                          At <strong>${monthlyBurn.toLocaleString()}</strong> net monthly burn, your cash buffer of <strong>${cashReserve.toLocaleString()}</strong> sustains operations until <strong>{calculatedRunway} months</strong> out.
                        </span>
                      </div>
                      <button
                        onClick={onLaunchApp}
                        className="min-btn min-btn-secondary min-btn-sm"
                      >
                        Model in Full Workspace
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MORNING MEMO */}
              {activeTab === 'briefing' && (
                <div className="min-tab-pane">
                  <div className="min-memo-document">
                    <div className="min-memo-header">
                      <div className="min-memo-meta-col">
                        <span className="min-memo-meta-key">MEMO DATE:</span>
                        <span className="min-memo-meta-val">Monday, September 14, 2026 — 07:00 EST</span>
                      </div>
                      <div className="min-memo-meta-col">
                        <span className="min-memo-meta-key">AUDIENCE:</span>
                        <span className="min-memo-meta-val">Chief Executive Officer</span>
                      </div>
                      <div className="min-memo-meta-col">
                        <span className="min-memo-meta-key">SYNTHESIS:</span>
                        <span className="min-badge min-badge-green">ALL SYSTEMS NORMAL</span>
                      </div>
                    </div>

                    <div className="min-memo-body">
                      <h3 className="min-memo-heading">Executive Action Items for Today</h3>
                      
                      <div className="min-action-list">
                        <div className="min-action-item">
                          <div className="min-action-num">01</div>
                          <div className="min-action-text">
                            <strong>Enterprise Contract Review:</strong> HyperScale Inc. approved the $48k ARR annual agreement. Redlines are resolved; countersignature required before 17:00 EST.
                          </div>
                          <span className="min-badge min-badge-yellow">URGENT</span>
                        </div>

                        <div className="min-action-item">
                          <div className="min-action-num">02</div>
                          <div className="min-action-text">
                            <strong>Infrastructure Audit:</strong> Staging GPU compute clusters logged $1,420 in idle runtime over the weekend. Automated shutdown script recommended.
                          </div>
                          <span className="min-badge min-badge-blue">INFRA</span>
                        </div>

                        <div className="min-action-item">
                          <div className="min-action-num">03</div>
                          <div className="min-action-text">
                            <strong>Series A Follow-Up:</strong> Benchmark and Sequoia partners requested updated cohort retention metrics following last Thursday’s partner briefings.
                          </div>
                          <span className="min-badge min-badge-green">INVESTOR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TREASURY VAULTS */}
              {activeTab === 'treasury' && (
                <div className="min-tab-pane">
                  <div className="min-treasury-table-wrap">
                    <table className="min-table">
                      <thead>
                        <tr>
                          <th>Institution & Vault</th>
                          <th>Account Type</th>
                          <th>Routing / ID</th>
                          <th>Yield / APY</th>
                          <th style={{ textAlign: 'right' }}>Current Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Mercury Corporate Checking</strong>
                            <div className="min-subtext">Operating payroll & vendor clearing</div>
                          </td>
                          <td><span className="min-badge min-badge-subtle">CHECKING</span></td>
                          <td className="min-mono-num">****-8492</td>
                          <td className="min-mono-num">0.00%</td>
                          <td style={{ textAlign: 'right' }} className="min-mono-num"><strong>$312,450.00</strong></td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Mercury Treasury (US T-Bills)</strong>
                            <div className="min-subtext">3-month rolling government paper</div>
                          </td>
                          <td><span className="min-badge min-badge-green">YIELD</span></td>
                          <td className="min-mono-num">****-3310</td>
                          <td className="min-mono-num">5.12%</td>
                          <td style={{ textAlign: 'right' }} className="min-mono-num"><strong>$524,800.00</strong></td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Stripe Working Capital Reserve</strong>
                            <div className="min-subtext">Dispute & chargeback buffer</div>
                          </td>
                          <td><span className="min-badge min-badge-blue">CLEARING</span></td>
                          <td className="min-mono-num">****-1029</td>
                          <td className="min-mono-num">3.40%</td>
                          <td style={{ textAlign: 'right' }} className="min-mono-num"><strong>$87,750.00</strong></td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4}><strong>Total Combined Liquid Treasury Reserves</strong></td>
                          <td style={{ textAlign: 'right' }} className="min-mono-num"><strong>$925,000.00</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: AI BOARDROOM */}
              {activeTab === 'boardroom' && (
                <div className="min-tab-pane">
                  <div className="min-boardroom-feed">
                    <div className="min-feed-item">
                      <div className="min-feed-avatar">CFO</div>
                      <div className="min-feed-content">
                        <div className="min-feed-header">
                          <span className="min-feed-name">Autonomous CFO Agent</span>
                          <span className="min-feed-time">08:14 AM</span>
                          <span className="min-badge min-badge-blue">FINANCIAL ANALYSIS</span>
                        </div>
                        <p className="min-feed-p">
                          "At our current $41.2k/month net burn rate, our $925k reserve provides 22.4 months of runway. 
                          If we authorize the two senior engineering offers at $175k base each, our monthly burn expands to $68.5k, 
                          compressing runway to 13.5 months unless revenue scales by at least $18k MRR over the next quarter."
                        </p>
                      </div>
                    </div>

                    <div className="min-feed-item">
                      <div className="min-feed-avatar">GRO</div>
                      <div className="min-feed-content">
                        <div className="min-feed-header">
                          <span className="min-feed-name">Growth Strategist Agent</span>
                          <span className="min-feed-time">08:16 AM</span>
                          <span className="min-badge min-badge-green">PIPELINE AUDIT</span>
                        </div>
                        <p className="min-feed-p">
                          "Enterprise qualified leads grew 34% this past month. 4 pilots with average contract value of $42k ARR 
                          are scheduled to convert before the end of Q3. Payback period on the engineering hires is projected at 5.8 months."
                        </p>
                      </div>
                    </div>

                    <div className="min-feed-item">
                      <div className="min-feed-avatar">RSK</div>
                      <div className="min-feed-content">
                        <div className="min-feed-header">
                          <span className="min-feed-name">Risk & Compliance Officer</span>
                          <span className="min-feed-time">08:19 AM</span>
                          <span className="min-badge min-badge-yellow">COVENANT WARNING</span>
                        </div>
                        <p className="min-feed-p">
                          "Maintain a strict minimum floor of 16 months runway ($660k). Stagger the second hiring requisition until 
                          at least two of the four enterprise pilots formally execute their annual contracts."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ASYMMETRICAL BENTO GRID (The 6 Pillars of Sovereign Operation)
          ===================================================================== */}
      <section id="architecture" className="min-section min-section-bento">
        <div className="min-container">
          <div className="min-section-header">
            <span className="min-badge min-badge-subtle">FOUNDATION PILLARS</span>
            <h2 className="min-section-title">Engineered for executive clarity.</h2>
            <p className="min-section-desc">
              Six deliberate architectural decisions that make FounderOS significantly faster and more dependable than cloud SaaS tools.
            </p>
          </div>

          <div className="min-bento-grid">
            {/* Bento Card 1 (Large 2-col) */}
            <div className="min-bento-card min-bento-span-2">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-green">LOCAL-FIRST PERSISTENCE</span>
              </div>
              <h3 className="min-bento-title">Zero telemetry exfiltration. Zero cloud vendor lock-in.</h3>
              <p className="min-bento-desc">
                Cloud enterprise tools index your financial records, pipeline conversations, and strategic plans on remote servers. 
                FounderOS writes exclusively to your physical local disk using encrypted IndexedDB and SQLite storage. 
                Queries run in 3.2 milliseconds without internet latency or third-party tracking.
              </p>
              <div className="min-code-preview">
                <div className="min-code-line"><span className="min-syntax-kw">const</span> db = <span className="min-syntax-fn">openLocalEncryptedStore</span>({'{'} engine: <span className="min-syntax-str">'sqlite-indexeddb'</span>, aes: <span className="min-syntax-num">256</span> {'}'});</div>
                <div className="min-code-line"><span className="min-syntax-kw">await</span> db.query(<span className="min-syntax-str">'SELECT * FROM corporate_ledger WHERE burn_rate &gt; 0'</span>); <span className="min-syntax-comment">// 2.8ms</span></div>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="min-bento-card">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-blue">INTELLIGENCE</span>
              </div>
              <h3 className="min-bento-title">7:00 AM Automated Briefing Engine</h3>
              <p className="min-bento-desc">
                Synthesizes incoming revenue events, pending contract redlines, team capacity, and liquidity shifts into a single page before you begin your day.
              </p>
              <div className="min-bento-metric">
                <span className="min-mono-large">07:00</span>
                <span className="min-subtext">Daily Executive Synthesis</span>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="min-bento-card">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-yellow">SCENARIO MODELING</span>
              </div>
              <h3 className="min-bento-title">Direct Runway Stress-Testing</h3>
              <p className="min-bento-desc">
                Instant numerical recalculation of cash runway across hiring schedules, capital expenditures, and revenue seasonality without broken spreadsheet formulas.
              </p>
              <div className="min-bento-metric">
                <span className="min-mono-large">100%</span>
                <span className="min-subtext">Dynamic formula synchronization</span>
              </div>
            </div>

            {/* Bento Card 4 (Large 2-col) */}
            <div className="min-bento-card min-bento-span-2">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-subtle">MULTI-AGENT DELIBERATION</span>
              </div>
              <h3 className="min-bento-title">Autonomous AI Boardroom Advisory</h3>
              <p className="min-bento-desc">
                Simulate executive debates between specialized financial, operational, and growth agents. 
                Test hiring plans against harsh cash covenant scenarios before committing company capital.
              </p>
              <div className="min-tag-row">
                <span className="min-tag-item">CFO Agent</span>
                <span className="min-tag-item">Growth Strategist</span>
                <span className="min-tag-item">Risk Officer</span>
                <span className="min-tag-item">Cap Table Auditor</span>
              </div>
            </div>

            {/* Bento Card 5 */}
            <div className="min-bento-card">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-green">TREASURY</span>
              </div>
              <h3 className="min-bento-title">Institutional Account Auditing</h3>
              <p className="min-bento-desc">
                Aggregate operating payroll, merchant clearing, and treasury yield accounts into one clear ledger with automated tax buffer projections.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="min-bento-card">
              <div className="min-bento-tag">
                <span className="min-badge min-badge-blue">SOVEREIGNTY</span>
              </div>
              <h3 className="min-bento-title">100% Offline Flight Mode</h3>
              <p className="min-bento-desc">
                Board a cross-country flight, disconnect Wi-Fi, and review complete financial records and cap table models with zero interruptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          DISTRIBUTION HUB (Three Deployment Targets)
          ===================================================================== */}
      <section id="distribution" className="min-section min-section-dist">
        <div className="min-container">
          <div className="min-section-header">
            <span className="min-badge min-badge-subtle">DISTRIBUTION TARGETS</span>
            <h2 className="min-section-title">Choose your preferred execution target.</h2>
            <p className="min-section-desc">
              FounderOS distributes as a standard desktop installer, a zero-install portable executable, or a web command center.
            </p>
          </div>

          <div className="min-dist-grid">
            {/* Card 1: Windows Setup */}
            <div className="min-dist-card">
              <div className="min-dist-head">
                <span className="min-badge min-badge-green">RECOMMENDED FOR DESKTOP</span>
                <h3 className="min-dist-title">Windows Installer</h3>
                <div className="min-dist-file">FounderOS-Setup.exe</div>
              </div>
              <p className="min-dist-desc">
                Standard Windows 64-bit installer with automatic desktop shortcut, file association, and local persistence directory.
              </p>
              <ul className="min-dist-features">
                <li>Instant Windows Start Menu integration</li>
                <li>Isolated client storage in %APPDATA%</li>
                <li>Windows 10 & 11 (64-bit) certified</li>
              </ul>
              <button
                onClick={() => handleDownload('setup')}
                className="min-btn min-btn-primary min-btn-block"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Installer (.exe)</span>
              </button>
            </div>

            {/* Card 2: Web Command Center */}
            <div className="min-dist-card">
              <div className="min-dist-head">
                <span className="min-badge min-badge-blue">ZERO INSTALLATION</span>
                <h3 className="min-dist-title">Web Command Center</h3>
                <div className="min-dist-file">Browser Direct Runtime</div>
              </div>
              <p className="min-dist-desc">
                Launch directly inside your current web browser. Stores data locally in your browser's encrypted IndexedDB sandbox.
              </p>
              <ul className="min-dist-features">
                <li>Zero download or installation required</li>
                <li>Works across macOS, Linux, and Windows</li>
                <li>Instant workspace initialization</li>
              </ul>
              <button
                onClick={onLaunchApp}
                className="min-btn min-btn-secondary min-btn-block"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>Launch Web Application</span>
              </button>
            </div>

            {/* Card 3: Windows Portable */}
            <div className="min-dist-card">
              <div className="min-dist-head">
                <span className="min-badge min-badge-subtle">STANDALONE BINARY</span>
                <h3 className="min-dist-title">Windows Portable</h3>
                <div className="min-dist-file">FounderOS-Portable.exe</div>
              </div>
              <p className="min-dist-desc">
                Self-contained executable requiring no administrative permissions. Ideal for encrypted USB drives or locked enterprise machines.
              </p>
              <ul className="min-dist-features">
                <li>No installation or admin rights required</li>
                <li>Stores data in current executable directory</li>
                <li>Zero Windows registry residue</li>
              </ul>
              <button
                onClick={() => handleDownload('portable')}
                className="min-btn min-btn-secondary min-btn-block"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Portable (.exe)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ACCORDION FAQ (Editorial Clean - Stripped Containers, 1px Dividers)
          ===================================================================== */}
      <section id="faq" className="min-section min-section-faq">
        <div className="min-container min-container-narrow">
          <div className="min-section-header">
            <span className="min-badge min-badge-subtle">QUESTIONS & ANSWERS</span>
            <h2 className="min-section-title">Frequently addressed details.</h2>
            <p className="min-section-desc">
              Clear, transparent explanations regarding security, data retention, and system design.
            </p>
          </div>

          <div className="min-faq-list">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="min-faq-row">
                  <button
                    className="min-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="min-faq-q">{item.question}</span>
                    <span className="min-faq-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="min-faq-body">
                      <p className="min-faq-a">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER (Minimalist Editorial Document Ending)
          ===================================================================== */}
      <footer className="min-footer">
        <div className="min-container">
          <div className="min-footer-top">
            <div className="min-footer-brand">
              <div className="min-brand" onClick={onLaunchApp}>
                <img src={founderosLogo} alt="FounderOS Logo" className="min-brand-img" />
                <span className="min-brand-name">FounderOS</span>
              </div>
              <p className="min-footer-motto">
                Sovereign executive runtime for high-velocity founders.
              </p>
            </div>

            <div className="min-footer-links-col">
              <div className="min-footer-col-title">Product</div>
              <a href="#overview" className="min-footer-link">Overview</a>
              <a href="#cockpit" className="min-footer-link">Workspace Cockpit</a>
              <a href="#architecture" className="min-footer-link">Local Architecture</a>
              <a href="#distribution" className="min-footer-link">Distribution Targets</a>
            </div>

            <div className="min-footer-links-col">
              <div className="min-footer-col-title">Sovereignty</div>
              <a href="#faq" className="min-footer-link">Data Isolation</a>
              <a href="#faq" className="min-footer-link">Offline Flight Mode</a>
              <a href="#faq" className="min-footer-link">Zero Cloud Exfiltration</a>
            </div>

            <div className="min-footer-links-col">
              <div className="min-footer-col-title">Execution</div>
              <button onClick={() => handleDownload('setup')} className="min-footer-btn-link">Windows Installer</button>
              <button onClick={() => handleDownload('portable')} className="min-footer-btn-link">Windows Portable</button>
              <button onClick={onLaunchApp} className="min-footer-btn-link">Web Application</button>
            </div>
          </div>

          <div className="min-footer-bottom">
            <div className="min-footer-copy">
              © {new Date().getFullYear()} FounderOS Systems. Local-first software. All rights reserved.
            </div>
            <div className="min-footer-status">
              <span className="min-dot min-dot-green" />
              <span>All systems operational • Build 2026.4.1</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          DOWNLOAD DIALOG MODAL (Clean Minimalist)
          ===================================================================== */}
      {downloadModal.isOpen && (
        <div className="min-modal-backdrop" onClick={() => setDownloadModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="min-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="min-modal-header">
              <div>
                <span className="min-badge min-badge-green">DOWNLOAD INITIATED</span>
                <h3 className="min-modal-title">{downloadModal.title}</h3>
              </div>
              <button
                className="min-modal-close"
                onClick={() => setDownloadModal(prev => ({ ...prev, isOpen: false }))}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="min-modal-content">
              <p className="min-modal-desc">
                Your download for <strong>{downloadModal.filename}</strong> has been initiated. If your browser does not start automatically, use the direct link below.
              </p>

              <div className="min-checksum-box">
                <div className="min-checksum-label">SHA-256 VERIFIED CHECKSUM</div>
                <div className="min-checksum-val">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
              </div>

              <div className="min-modal-actions">
                <a
                  href={downloadModal.url}
                  download={downloadModal.filename}
                  className="min-btn min-btn-primary"
                >
                  Download Again
                </a>
                <button
                  onClick={onLaunchApp}
                  className="min-btn min-btn-secondary"
                >
                  Open Web App Meanwhile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STYLES (Strictly Minimalist-UI Protocol)
          ===================================================================== */}
      <style>{`
        /* =====================================================================
           MINIMALIST-UI DESIGN TOKENS & SYSTEM VARIABLES
           ===================================================================== */
        :root {
          --min-canvas: #FBFBFA;
          --min-surface: #FFFFFF;
          --min-surface-subtle: #F7F6F3;
          --min-border: #EAEAEA;
          --min-border-subtle: rgba(0, 0, 0, 0.06);
          --min-text-primary: #111111;
          --min-text-secondary: #555555;
          --min-text-muted: #787774;

          /* Pastels */
          --min-pastel-green: #EDF3EC;
          --min-pastel-green-text: #346538;
          --min-pastel-blue: #E1F3FE;
          --min-pastel-blue-text: #1F6C9F;
          --min-pastel-yellow: #FBF3DB;
          --min-pastel-yellow-text: #956400;
          --min-pastel-red: #FDEBEC;
          --min-pastel-red-text: #9F2F2D;

          /* Fonts */
          --min-font-serif: 'Newsreader', 'Playfair Display', 'Instrument Serif', Georgia, serif;
          --min-font-sans: 'SF Pro Display', 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --min-font-mono: 'JetBrains Mono', 'SF Mono', 'Geist Mono', Menlo, Consolas, monospace;

          /* Springs & Motion */
          --min-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Base Reset & Layout */
        .min-page {
          background-color: var(--min-canvas);
          color: var(--min-text-primary);
          font-family: var(--min-font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
          line-height: 1.6;
        }

        .min-container {
          max-width: 1024px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .min-container-narrow {
          max-width: 800px;
        }

        /* Macro-whitespace */
        .min-section {
          padding: 96px 0;
          border-bottom: 1px solid var(--min-border);
        }

        .min-section-header {
          margin-bottom: 48px;
        }

        .min-section-title {
          font-family: var(--min-font-serif);
          font-size: 36px;
          line-height: 1.15;
          letter-spacing: -0.025em;
          color: var(--min-text-primary);
          margin: 12px 0 10px 0;
          font-weight: 500;
        }

        .min-section-desc {
          font-size: 16px;
          color: var(--min-text-secondary);
          max-width: 640px;
          margin: 0;
          line-height: 1.6;
        }

        /* Typography & Badges */
        .min-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .min-badge-green {
          background-color: var(--min-pastel-green);
          color: var(--min-pastel-green-text);
        }

        .min-badge-blue {
          background-color: var(--min-pastel-blue);
          color: var(--min-pastel-blue-text);
        }

        .min-badge-yellow {
          background-color: var(--min-pastel-yellow);
          color: var(--min-pastel-yellow-text);
        }

        .min-badge-red {
          background-color: var(--min-pastel-red);
          color: var(--min-pastel-red-text);
        }

        .min-badge-subtle {
          background-color: var(--min-surface-subtle);
          color: var(--min-text-secondary);
          border: 1px solid var(--min-border);
        }

        /* Buttons */
        .min-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--min-font-sans);
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 150ms ease, transform 100ms var(--min-ease-spring);
          text-decoration: none;
          white-space: nowrap;
        }

        .min-btn:active {
          transform: scale(0.98);
        }

        .min-btn-primary {
          background-color: #111111;
          color: #FFFFFF;
          border: 1px solid #111111;
          padding: 10px 18px;
        }

        .min-btn-primary:hover {
          background-color: #2A2A2A;
          border-color: #2A2A2A;
        }

        .min-btn-secondary {
          background-color: #FFFFFF;
          color: #111111;
          border: 1px solid var(--min-border);
          padding: 10px 18px;
        }

        .min-btn-secondary:hover {
          background-color: #F7F6F3;
          border-color: #D8D8D8;
        }

        .min-btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .min-btn-lg {
          padding: 12px 24px;
          font-size: 15px;
        }

        .min-btn-block {
          width: 100%;
        }

        /* Navigation */
        .min-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: #FFFFFF;
          border-bottom: 1px solid var(--min-border);
        }

        .min-nav-container {
          max-width: 1024px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .min-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .min-brand-img {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--min-border);
        }

        .min-brand-name {
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: var(--min-text-primary);
        }

        .min-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .min-nav-link {
          font-size: 14px;
          color: var(--min-text-muted);
          text-decoration: none;
          transition: color 150ms ease;
        }

        .min-nav-link:hover {
          color: var(--min-text-primary);
        }

        .min-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Hero */
        .min-hero-section {
          padding: 100px 0 80px 0;
        }

        .min-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .min-hero-build {
          font-family: var(--min-font-mono);
          font-size: 12px;
          color: var(--min-text-muted);
          letter-spacing: 0.04em;
        }

        .min-hero-title {
          font-family: var(--min-font-serif);
          font-size: 54px;
          line-height: 1.08;
          letter-spacing: -0.03em;
          font-weight: 400;
          color: var(--min-text-primary);
          margin: 0 0 24px 0;
          max-width: 860px;
        }

        .min-hero-lead {
          font-size: 18px;
          line-height: 1.65;
          color: var(--min-text-secondary);
          max-width: 760px;
          margin: 0 0 36px 0;
        }

        .min-hero-cta-group {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .min-hero-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--min-text-muted);
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .min-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .min-meta-sep {
          color: #D8D8D8;
        }

        .min-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .min-dot-green { background-color: #346538; }
        .min-dot-blue { background-color: #1F6C9F; }
        .min-dot-charcoal { background-color: #111111; }

        .min-keystroke-hints {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          color: var(--min-text-muted);
          padding-top: 16px;
          border-top: 1px solid var(--min-border);
          flex-wrap: wrap;
        }

        .min-kbd-label {
          font-weight: 500;
        }

        .min-kbd-unit {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .min-kbd {
          font-family: var(--min-font-mono);
          font-size: 11px;
          padding: 2px 6px;
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 4px;
          color: var(--min-text-primary);
        }

        /* Faux-OS Window Chrome */
        .min-window {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .min-window-topbar {
          background-color: var(--min-surface-subtle);
          border-bottom: 1px solid var(--min-border);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .min-window-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .min-dot-window {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #D8D8D8;
          display: inline-block;
        }

        .min-window-title {
          font-family: var(--min-font-mono);
          font-size: 12px;
          color: var(--min-text-muted);
        }

        .min-window-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--min-font-mono);
          font-size: 11px;
          color: var(--min-text-muted);
        }

        .min-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #346538;
        }

        /* Document Tabs Bar */
        .min-window-tabs {
          display: flex;
          align-items: center;
          background-color: var(--min-surface);
          border-bottom: 1px solid var(--min-border);
          overflow-x: auto;
        }

        .min-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          font-family: var(--min-font-sans);
          font-size: 13px;
          font-weight: 500;
          color: var(--min-text-secondary);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 150ms ease, border-color 150ms ease;
          white-space: nowrap;
        }

        .min-tab-btn:hover {
          color: var(--min-text-primary);
        }

        .min-tab-btn.is-active {
          color: var(--min-text-primary);
          border-bottom-color: #111111;
          font-weight: 600;
        }

        .min-tab-num {
          font-family: var(--min-font-mono);
          font-size: 11px;
          color: var(--min-text-muted);
        }

        /* Window Body */
        .min-window-body {
          padding: 32px;
        }

        .min-tab-pane {
          animation: minFadeIn 200ms var(--min-ease-spring);
        }

        @keyframes minFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Stats Grid */
        .min-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .min-stat-card {
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 6px;
          padding: 18px;
        }

        .min-stat-label {
          font-size: 12px;
          color: var(--min-text-muted);
          margin-bottom: 6px;
        }

        .min-stat-val {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--min-text-primary);
          margin-bottom: 12px;
        }

        .min-mono-num {
          font-family: var(--min-font-mono);
        }

        .min-stat-foot {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .min-stat-sub {
          color: var(--min-text-muted);
        }

        /* Simulator Panel */
        .min-simulator-panel {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 6px;
          padding: 24px;
        }

        .min-sim-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .min-sim-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--min-text-primary);
          margin-bottom: 4px;
        }

        .min-sim-sub {
          font-size: 13px;
          color: var(--min-text-secondary);
        }

        .min-sim-readout {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .min-sim-burn-label {
          font-size: 12px;
          color: var(--min-text-muted);
        }

        .min-sim-burn-val {
          font-family: var(--min-font-mono);
          font-size: 20px;
          font-weight: 600;
          color: var(--min-text-primary);
        }

        .min-slider-wrapper {
          margin-bottom: 24px;
        }

        .min-range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #EAEAEA;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .min-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111111;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          cursor: grab;
          transition: transform 100ms ease;
        }

        .min-range-slider::-webkit-slider-thumb:active {
          transform: scale(1.15);
          cursor: grabbing;
        }

        .min-slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--min-text-muted);
          font-family: var(--min-font-mono);
          margin-top: 8px;
        }

        .min-sim-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 18px;
          border-top: 1px solid var(--min-border);
          font-size: 13px;
          color: var(--min-text-secondary);
        }

        .min-sim-bullet {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .min-bullet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #111111;
        }

        /* Memo Pane */
        .min-memo-document {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 6px;
          padding: 28px;
        }

        .min-memo-header {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--min-border);
          margin-bottom: 24px;
        }

        .min-memo-meta-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .min-memo-meta-key {
          font-family: var(--min-font-mono);
          font-size: 10px;
          color: var(--min-text-muted);
          letter-spacing: 0.05em;
        }

        .min-memo-meta-val {
          font-size: 13px;
          font-weight: 500;
          color: var(--min-text-primary);
        }

        .min-memo-heading {
          font-family: var(--min-font-serif);
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 16px 0;
          color: var(--min-text-primary);
        }

        .min-action-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .min-action-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 6px;
        }

        .min-action-num {
          font-family: var(--min-font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--min-text-muted);
        }

        .min-action-text {
          flex: 1;
          font-size: 13px;
          color: var(--min-text-secondary);
        }

        .min-action-text strong {
          color: var(--min-text-primary);
        }

        /* Treasury Table */
        .min-treasury-table-wrap {
          border: 1px solid var(--min-border);
          border-radius: 6px;
          overflow: hidden;
        }

        .min-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .min-table th {
          background-color: var(--min-surface-subtle);
          padding: 12px 16px;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--min-text-muted);
          border-bottom: 1px solid var(--min-border);
        }

        .min-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--min-border);
          color: var(--min-text-secondary);
        }

        .min-table td strong {
          color: var(--min-text-primary);
        }

        .min-table tfoot td {
          background-color: var(--min-surface-subtle);
          font-weight: 600;
          border-bottom: none;
          color: var(--min-text-primary);
        }

        .min-subtext {
          font-size: 11px;
          color: var(--min-text-muted);
        }

        /* Boardroom Feed */
        .min-boardroom-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .min-feed-item {
          display: flex;
          gap: 16px;
          padding: 18px;
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 6px;
        }

        .min-feed-avatar {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background-color: #111111;
          color: #FFFFFF;
          font-family: var(--min-font-mono);
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .min-feed-content {
          flex: 1;
        }

        .min-feed-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .min-feed-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--min-text-primary);
        }

        .min-feed-time {
          font-family: var(--min-font-mono);
          font-size: 11px;
          color: var(--min-text-muted);
        }

        .min-feed-p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--min-text-secondary);
        }

        /* Bento Grid */
        .min-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .min-bento-card {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 8px;
          padding: 28px;
          transition: box-shadow 200ms ease, transform 200ms var(--min-ease-spring);
        }

        .min-bento-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .min-bento-span-2 {
          grid-column: span 2;
        }

        .min-bento-tag {
          margin-bottom: 16px;
        }

        .min-bento-title {
          font-family: var(--min-font-serif);
          font-size: 22px;
          font-weight: 500;
          line-height: 1.25;
          color: var(--min-text-primary);
          margin: 0 0 12px 0;
        }

        .min-bento-desc {
          font-size: 14px;
          line-height: 1.65;
          color: var(--min-text-secondary);
          margin: 0 0 20px 0;
        }

        .min-code-preview {
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 6px;
          padding: 14px 18px;
          font-family: var(--min-font-mono);
          font-size: 12px;
          line-height: 1.7;
        }

        .min-code-line {
          white-space: nowrap;
          overflow-x: auto;
        }

        .min-syntax-kw { color: #8F2D56; font-weight: 600; }
        .min-syntax-fn { color: #1F6C9F; }
        .min-syntax-str { color: #346538; }
        .min-syntax-num { color: #956400; }
        .min-syntax-comment { color: var(--min-text-muted); font-style: italic; }

        .min-bento-metric {
          padding-top: 14px;
          border-top: 1px solid var(--min-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .min-mono-large {
          font-family: var(--min-font-mono);
          font-size: 28px;
          font-weight: 600;
          color: var(--min-text-primary);
        }

        .min-tag-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .min-tag-item {
          font-family: var(--min-font-mono);
          font-size: 11px;
          padding: 4px 10px;
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 4px;
          color: var(--min-text-primary);
        }

        /* Distribution Hub */
        .min-dist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .min-dist-card {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 8px;
          padding: 28px;
          display: flex;
          flex-direction: column;
        }

        .min-dist-head {
          margin-bottom: 16px;
        }

        .min-dist-title {
          font-family: var(--min-font-serif);
          font-size: 22px;
          font-weight: 500;
          color: var(--min-text-primary);
          margin: 10px 0 4px 0;
        }

        .min-dist-file {
          font-family: var(--min-font-mono);
          font-size: 11px;
          color: var(--min-text-muted);
        }

        .min-dist-desc {
          font-size: 13px;
          color: var(--min-text-secondary);
          line-height: 1.6;
          margin: 0 0 20px 0;
          flex: 1;
        }

        .min-dist-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          border-top: 1px solid var(--min-border);
          padding-top: 16px;
        }

        .min-dist-features li {
          font-size: 12px;
          color: var(--min-text-muted);
          margin-bottom: 8px;
          position: relative;
          padding-left: 14px;
        }

        .min-dist-features li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #111111;
        }

        /* Accordion FAQ */
        .min-faq-list {
          border-top: 1px solid var(--min-border);
        }

        .min-faq-row {
          border-bottom: 1px solid var(--min-border);
        }

        .min-faq-trigger {
          width: 100%;
          background: none;
          border: none;
          padding: 24px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          cursor: pointer;
          font-family: var(--min-font-sans);
          transition: color 150ms ease;
        }

        .min-faq-trigger:hover .min-faq-q {
          color: #111111;
        }

        .min-faq-q {
          font-size: 16px;
          font-weight: 500;
          color: var(--min-text-primary);
          padding-right: 24px;
        }

        .min-faq-icon {
          font-family: var(--min-font-mono);
          font-size: 18px;
          font-weight: 500;
          color: var(--min-text-muted);
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .min-faq-body {
          padding-bottom: 24px;
          animation: minFadeIn 150ms ease;
        }

        .min-faq-a {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--min-text-secondary);
        }

        /* Footer */
        .min-footer {
          background-color: var(--min-surface);
          border-top: 1px solid var(--min-border);
          padding: 80px 0 40px 0;
        }

        .min-footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 60px;
          border-bottom: 1px solid var(--min-border);
          margin-bottom: 32px;
        }

        .min-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .min-footer-motto {
          font-size: 13px;
          color: var(--min-text-muted);
          margin: 0;
          max-width: 280px;
        }

        .min-footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .min-footer-col-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--min-text-primary);
          margin-bottom: 4px;
        }

        .min-footer-link {
          font-size: 13px;
          color: var(--min-text-secondary);
          text-decoration: none;
          transition: color 150ms ease;
        }

        .min-footer-link:hover {
          color: var(--min-text-primary);
        }

        .min-footer-btn-link {
          background: none;
          border: none;
          padding: 0;
          font-family: var(--min-font-sans);
          font-size: 13px;
          color: var(--min-text-secondary);
          text-align: left;
          cursor: pointer;
          transition: color 150ms ease;
        }

        .min-footer-btn-link:hover {
          color: var(--min-text-primary);
        }

        .min-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--min-text-muted);
          flex-wrap: wrap;
          gap: 16px;
        }

        .min-footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Modal Dialog */
        .min-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(17, 17, 17, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
        }

        .min-modal-card {
          background-color: var(--min-surface);
          border: 1px solid var(--min-border);
          border-radius: 8px;
          max-width: 520px;
          width: 100%;
          padding: 28px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          animation: minFadeIn 150ms var(--min-ease-spring);
        }

        .min-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .min-modal-title {
          font-family: var(--min-font-serif);
          font-size: 22px;
          font-weight: 500;
          color: var(--min-text-primary);
          margin: 6px 0 0 0;
        }

        .min-modal-close {
          background: none;
          border: none;
          font-size: 16px;
          color: var(--min-text-muted);
          cursor: pointer;
          padding: 4px;
        }

        .min-modal-close:hover {
          color: var(--min-text-primary);
        }

        .min-modal-desc {
          font-size: 13px;
          color: var(--min-text-secondary);
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .min-checksum-box {
          background-color: var(--min-surface-subtle);
          border: 1px solid var(--min-border);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 24px;
        }

        .min-checksum-label {
          font-family: var(--min-font-mono);
          font-size: 10px;
          color: var(--min-text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .min-checksum-val {
          font-family: var(--min-font-mono);
          font-size: 11px;
          color: var(--min-text-primary);
          word-break: break-all;
        }

        .min-modal-actions {
          display: flex;
          gap: 12px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 960px) {
          .min-hero-title {
            font-size: 42px;
          }
          .min-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .min-bento-grid {
            grid-template-columns: 1fr;
          }
          .min-bento-span-2 {
            grid-column: span 1;
          }
          .min-dist-grid {
            grid-template-columns: 1fr;
          }
          .min-footer-top {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .min-nav-links {
            display: none;
          }
          .min-hero-title {
            font-size: 32px;
          }
          .min-hero-lead {
            font-size: 16px;
          }
          .min-stats-grid {
            grid-template-columns: 1fr;
          }
          .min-memo-header {
            grid-template-columns: 1fr;
          }
          .min-footer-top {
            grid-template-columns: 1fr;
          }
          .min-window-body {
            padding: 20px;
          }
        }

        /* Accessibility Triad */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
