import React, { useState } from 'react';
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
} from 'lucide-react';
import founderosLogo from '../assets/founderos-logo.jpg';

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
      setTimeout(() => setDownloadState('idle'), 4500);
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#030712', // --bg-page (matching http://localhost:5173/#/app)
        color: '#f8fafc', // --text-main
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        lineHeight: 1.5,
      }}
    >
      {/* Background Chromatic Radial Lighting (App Shell ambiance) */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '20%',
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(0, 80, 255, 0.14) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.10) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* =========================================================================
          1. FLOATING PILL NAVIGATION BAR
          - Matching app palette: #0b0f19 / rgba(15, 23, 42, 0.85)
          - 50px border-radius
          - Brand logo container (rounded square ~40px)
          - 15px Inter 500 links in #94a3b8 -> #f8fafc
          - Circular #0050FF blue menu toggle button (~40px)
          - Primary pill action buttons with embedded circular icon dots
         ========================================================================= */}
      <header
        style={{
          position: 'sticky',
          top: '20px',
          zIndex: 100,
          padding: '0 24px',
          maxWidth: '1240px',
          margin: '0 auto 20px auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(11, 15, 25, 0.85)', // --bg-surface with glass
            backdropFilter: 'blur(20px)',
            borderRadius: '50px', // --radius-full
            padding: '10px 18px',
            border: '1px solid rgba(255, 255, 255, 0.10)', // --border-subtle
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand Logo Container */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px', // rounded square 10-20px radius
                backgroundColor: '#030712',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0050FF', // Royal Blue brand stroke
                boxShadow: '0 0 14px rgba(0, 80, 255, 0.4)',
              }}
            >
              <img
                src={founderosLogo}
                alt="FounderOS Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: '#f8fafc',
                  lineHeight: 1.1,
                }}
              >
                FounderOS
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#94a3b8', // text-muted
                  letterSpacing: '0.02em',
                }}
              >
                Executive Command
              </span>
            </div>
          </div>

          {/* Nav Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Download Setup Pill Button (Dark glass pill with embedded Sky Pop dot) */}
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              }}
            >
              <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Setup'}</span>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8', // --accent-cyan
                  color: '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {downloadState === 'downloading' ? (
                  <RefreshCw size={11} className="spin-icon" />
                ) : (
                  <Download size={11} strokeWidth={2.5} />
                )}
              </div>
            </button>

            {/* Connect Web App Pill Button (Royal Blue #0050FF) */}
            <button
              onClick={onLaunchApp}
              style={{
                backgroundColor: '#0050FF', // --brand-accent
                border: '1px solid #1a62ff',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 80, 255, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a62ff';
                e.currentTarget.style.boxShadow = '0 0 28px rgba(0, 80, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0050FF';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 80, 255, 0.4)';
              }}
            >
              <span>Connect Web App</span>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#0050FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={11} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* =========================================================================
            2. HERO DISPLAY BLOCK (DESIGN.md specification + App Palette)
            - Headline at 140–144px Inter weight 500, #f8fafc
            - Letter-spacing -0.06em (-8.4px), line-height 0.96
            - Subheadline at 17–20px weight 400, #94a3b8
            - Dual pill action buttons with embedded circular icon dots
           ========================================================================= */}
        <section
          style={{
            paddingTop: '60px',
            paddingBottom: '60px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Tag Chip (10px radius, app palette) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '10px', // --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.12)', // --primary-blue-surface
              color: '#38bdf8', // --accent-cyan
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '28px',
              border: '1px solid rgba(0, 80, 255, 0.35)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0050FF', // Brand blue dot
                boxShadow: '0 0 8px #0050FF',
              }}
            />
            FOUNDEROS ENGINE V1.0 • SOVEREIGN EXECUTIVE EDITION
          </div>

          {/* Enormous 140px Display Headline */}
          <h1
            style={{
              fontSize: 'clamp(52px, 8.5vw, 136px)',
              fontWeight: 500,
              lineHeight: 0.96,
              letterSpacing: '-0.06em', // Signature tight display tracking
              color: '#f8fafc',
              maxWidth: '1120px',
              margin: '0 auto 28px auto',
              textWrap: 'balance',
            }}
          >
            Built for founders who run everything.
          </h1>

          {/* Subheadline (20px Inter) */}
          <p
            style={{
              fontSize: 'clamp(18px, 2.2vw, 21px)',
              fontWeight: 400,
              lineHeight: 1.45,
              color: '#94a3b8', // --text-muted
              maxWidth: '820px',
              margin: '0 auto 40px auto',
            }}
          >
            One local-first operating system replacing 12 fragmented SaaS subscriptions. Executive
            telemetry, automated cash vaults, AI CEO scenario stress-testing, and high-conviction
            deal flow on your own terms.
          </p>

          {/* Dual Pill CTA Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '36px',
            }}
          >
            {/* Primary Action Button (White high-contrast pill with embedded Blue dot) */}
            <button
              onClick={() => triggerDownload('setup')}
              disabled={downloadState === 'downloading'}
              style={{
                backgroundColor: '#ffffff',
                color: '#030712',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '17px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>
                {downloadState === 'downloading'
                  ? 'Initiating Setup Download...'
                  : 'Download Windows Setup (.exe)'}
              </span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#0050FF', // Royal Blue
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {downloadState === 'downloading' ? (
                  <RefreshCw size={14} className="spin-icon" />
                ) : (
                  <Download size={14} strokeWidth={2.5} />
                )}
              </div>
            </button>

            {/* Service Action Button (Royal Blue #0050FF filled pill) */}
            <button
              onClick={onLaunchApp}
              style={{
                backgroundColor: '#0050FF', // --brand-accent
                color: '#ffffff',
                border: '1px solid #1a62ff',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '17px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0, 80, 255, 0.45)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a62ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(0, 80, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0050FF';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 80, 255, 0.45)';
              }}
            >
              <span>Connect Web Application</span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8', // Cyan dot
                  color: '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Trust Chips (10px radius) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {[
              '100% Local-First IndexedDB',
              'Zero Cloud Lock-In',
              'Instant Sovereign Boot',
              'Offline-First Encryption',
            ].map((chip, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981', // Emerald
                  }}
                />
                {chip}
              </div>
            ))}
          </div>

          {/* Download Notification Banner */}
          {downloadState === 'completed' && (
            <div
              style={{
                marginTop: '24px',
                padding: '14px 24px',
                borderRadius: '50px',
                backgroundColor: '#0b0f19',
                border: '2px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                color: '#f8fafc',
                fontSize: '15px',
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <CheckCircle2 size={18} color="#10b981" />
              <span>
                <strong>FounderOS-Setup.exe</strong> downloaded! Run the installer on Windows to start.
              </span>
            </div>
          )}
        </section>

        {/* =========================================================================
            3. PAPER-CUT STORYBOOK ILLUSTRATION HERO PANEL (App Dark Palette)
            - Paper-cut style character art with dark cybernetic/editorial fills
            - Blue #0050FF, Cyan #38bdf8, Emerald #10b981, Amber #f59e0b, Rose #f43f5e
            - Container: 63.75px radius, #0b0f19 surface, border: rgba(255,255,255,0.12)
           ========================================================================= */}
        <section
          style={{
            margin: '40px auto 100px auto',
            maxWidth: '1100px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              borderRadius: '63.75px', // --radius-illustration-containers: 63.75px
              backgroundColor: 'rgba(15, 23, 42, 0.75)', // --bg-card
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              padding: '40px 30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Sticker Badges on the Illustration Surface */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '32px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: '#f59e0b', // Amber
                color: '#030712',
                fontSize: '13px',
                fontWeight: 700,
                border: '1.5px solid rgba(0,0,0,0.4)',
                transform: 'rotate(-2deg)',
              }}
            >
              ★ 100% PRIVATE • ZERO TRACKERS
            </div>

            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: '32px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: '#10b981', // Emerald
                color: '#030712',
                fontSize: '13px',
                fontWeight: 700,
                border: '1.5px solid rgba(0,0,0,0.4)',
                transform: 'rotate(2deg)',
              }}
            >
              ⚡ SOVEREIGN DESKTOP ENGINE
            </div>

            {/* The SVG Storybook Paper-Cut Artwork adapted to App Dark Palette */}
            <svg
              viewBox="0 0 1000 420"
              style={{ width: '100%', height: 'auto', maxHeight: '420px' }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Radial Backdrop Glow */}
              <circle cx="500" cy="210" r="170" fill="rgba(0, 80, 255, 0.08)" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" />
              <circle cx="500" cy="210" r="130" fill="rgba(15, 23, 42, 0.9)" />

              {/* Ground Shadow Line */}
              <rect x="180" y="360" width="640" height="12" rx="6" fill="#1e293b" />

              {/* Left Pillar: Executive Vault & Cash Chest */}
              <g transform="translate(140, 160)">
                <rect x="0" y="50" width="160" height="140" rx="28" fill="#10b981" stroke="#0b0f19" strokeWidth="3" />
                <rect x="20" y="30" width="120" height="36" rx="14" fill="#f59e0b" stroke="#0b0f19" strokeWidth="3" />
                <circle cx="80" cy="48" r="8" fill="#030712" />
                <rect x="25" y="85" width="110" height="24" rx="8" fill="#0b0f19" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <text x="80" y="101" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">
                  TREASURY: $1.2M
                </text>
                <circle cx="45" cy="140" r="16" fill="#0050FF" stroke="#0b0f19" strokeWidth="2" />
                <circle cx="115" cy="140" r="16" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />
                {/* Floating Coin */}
                <circle cx="80" cy="0" r="22" fill="#f59e0b" stroke="#0b0f19" strokeWidth="3" />
                <text x="80" y="6" fill="#030712" fontSize="18" fontWeight="bold" textAnchor="middle">
                  $
                </text>
              </g>

              {/* Center Figure: The Founder Orchestrator */}
              <g transform="translate(430, 90)">
                {/* Desk Base */}
                <rect x="-60" y="240" width="260" height="34" rx="17" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Founder Torso */}
                <path
                  d="M40 160 C10 160, -10 200, -10 240 L150 240 C150 200, 130 160, 100 160 Z"
                  fill="#0050FF"
                  stroke="#0b0f19"
                  strokeWidth="3"
                />
                {/* Collar */}
                <polygon points="55,160 70,185 85,160" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />

                {/* Founder Head */}
                <circle cx="70" cy="115" r="38" fill="#334155" stroke="#0b0f19" strokeWidth="3" />
                {/* Hair */}
                <path
                  d="M32 110 C32 70, 108 70, 108 110 C100 85, 45 85, 32 110 Z"
                  fill="#0f172a"
                />
                {/* Visor / Glasses (Cyan Glow) */}
                <rect x="48" y="106" width="18" height="12" rx="4" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />
                <rect x="74" y="106" width="18" height="12" rx="4" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />
                <line x1="66" y1="112" x2="74" y2="112" stroke="#0b0f19" strokeWidth="2" />
                {/* Smile */}
                <path d="M62 132 Q70 138 78 132" stroke="#f8fafc" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                {/* Laptop / Terminal */}
                <rect x="20" y="200" width="100" height="60" rx="8" fill="#0b0f19" stroke="#38bdf8" strokeWidth="2" />
                <rect x="30" y="210" width="80" height="40" rx="4" fill="#030712" />
                <polyline points="40,235 55,225 70,230 85,218 95,222" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="95" cy="222" r="3.5" fill="#f59e0b" />

                {/* Hands */}
                <circle cx="36" cy="236" r="10" fill="#334155" stroke="#0b0f19" strokeWidth="2" />
                <circle cx="104" cy="236" r="10" fill="#334155" stroke="#0b0f19" strokeWidth="2" />
              </g>

              {/* Right Pillar: Autonomous AI Agent & Radar */}
              <g transform="translate(700, 150)">
                {/* AI Robot Pod */}
                <rect x="0" y="60" width="150" height="130" rx="30" fill="#0050FF" stroke="#0b0f19" strokeWidth="3" />
                <rect x="25" y="85" width="100" height="45" rx="14" fill="#0b0f19" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                {/* Glowing Eyes */}
                <circle cx="55" cy="107" r="7" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />
                <circle cx="95" cy="107" r="7" fill="#38bdf8" stroke="#0b0f19" strokeWidth="2" />
                {/* Antenna */}
                <line x1="75" y1="60" x2="75" y2="35" stroke="#0050FF" strokeWidth="3" strokeLinecap="round" />
                <circle cx="75" cy="28" r="12" fill="#f43f5e" stroke="#0b0f19" strokeWidth="2.5" />
                {/* Status Bar */}
                <rect x="30" y="150" width="90" height="16" rx="8" fill="#10b981" stroke="#0b0f19" strokeWidth="2" />
                <text x="75" y="162" fill="#030712" fontSize="10" fontWeight="bold" textAnchor="middle">
                  AI CEO: SYNTHESIZING
                </text>
              </g>

              {/* Dynamic Connection Paths (Cyan dashed trails) */}
              <path
                d="M300 240 Q370 190 430 220"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
              />
              <path
                d="M570 220 Q640 190 700 230"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
              />

              {/* Floating Metric Stickers */}
              <g transform="translate(320, 110)">
                <rect x="0" y="0" width="95" height="34" rx="10" fill="#10b981" stroke="#0b0f19" strokeWidth="2" />
                <text x="47" y="22" fill="#030712" fontSize="13" fontWeight="bold" textAnchor="middle">
                  +142% NRR
                </text>
              </g>

              <g transform="translate(600, 80)">
                <rect x="0" y="0" width="105" height="34" rx="10" fill="#f59e0b" stroke="#0b0f19" strokeWidth="2" />
                <text x="52" y="22" fill="#030712" fontSize="13" fontWeight="bold" textAnchor="middle">
                  0 CLOUD LEAKS
                </text>
              </g>
            </svg>

            {/* Bottom Caption inside the Illustration Panel */}
            <div
              style={{
                marginTop: '16px',
                textAlign: 'center',
                maxWidth: '650px',
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  color: '#94a3b8',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Storybook clarity meets high-stakes executive execution. Every byte stored
                locally on your machine.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. "NO MORE CHAOS" CONTENT CARD (App Dark Palette)
            - Surface: rgba(15, 23, 42, 0.75) with 50px border-radius
            - Side-by-side comparison:
              - Left: Fragmented Chaos in recessed dark slate (#1e293b) with Rose (#f43f5e) accents
              - Right: FounderOS in dark glass with Royal Blue (#0050FF) & Emerald (#10b981) highlights
           ========================================================================= */}
        <section id="chaos" style={{ marginBottom: '120px' }}>
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)', // --bg-card
              backdropFilter: 'blur(16px)',
              borderRadius: '50px', // --radius-cards: 50px
              padding: 'clamp(28px, 5vw, 56px)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(244, 63, 94, 0.4)', // Rose outline accent
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <AlertTriangle size={14} />
              THE DILEMMA & THE CURE
            </div>

            {/* Heading (53px Inter) */}
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 53px)',
                fontWeight: 500,
                lineHeight: 1.12,
                letterSpacing: '-2.12px',
                color: '#f8fafc',
                marginBottom: '18px',
                maxWidth: '900px',
              }}
            >
              No more chaos. Zero subscription sprawl.
            </h2>

            {/* Body Text (17px Inter) */}
            <p
              style={{
                fontSize: '18px',
                color: '#94a3b8',
                lineHeight: 1.6,
                maxWidth: '850px',
                marginBottom: '40px',
              }}
            >
              Founders lose an average of 9.4 hours every week copy-pasting numbers between 12
              disconnected tools, paying thousands in recurring seat fees, and leaking corporate secrets
              to external cloud servers. FounderOS replaces this entire mess with one sovereign desktop and
              web application.
            </p>

            {/* Side-by-Side Comparison Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {/* Column 1: The Fragmented Chaos (Recessed Dark Slate #1e293b) */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)', // recessed slate
                  borderRadius: '28px',
                  padding: '30px',
                  border: '1.5px solid rgba(244, 63, 94, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      color: '#f43f5e',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    THE OLD DISCONNECTED WAY
                  </div>

                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      marginBottom: '14px',
                      lineHeight: 1.25,
                    }}
                  >
                    12 Open Tabs & $4,200/mo Cloud Tax
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      'Stripe + QuickBooks + ChartMogul for simple revenue numbers',
                      'HubSpot + Notion + Sheets for fragmented deal stages',
                      'Exposing confidential runway data to third-party ad networks',
                      'Zero offline capability; breaks when Wi-Fi drops on flights',
                      'Constant auth timeouts, password resets, and session expired errors',
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '15px',
                          color: '#cbd5e1',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#f43f5e',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <X size={12} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '28px',
                    padding: '14px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    fontSize: '13px',
                    color: '#94a3b8',
                    fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  Status: High Cognitive Fatigue & Subscription Creep
                </div>
              </div>

              {/* Column 2: The Unified FounderOS (Elevated Glass with Royal Blue Stroke) */}
              <div
                style={{
                  backgroundColor: 'rgba(11, 15, 25, 0.95)',
                  borderRadius: '28px',
                  padding: '30px',
                  border: '2px solid #0050FF', // Brand Blue stroke
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 0 30px rgba(0, 80, 255, 0.2)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 80, 255, 0.2)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      border: '1px solid rgba(0, 80, 255, 0.4)',
                    }}
                  >
                    THE FOUNDEROS WAY
                  </div>

                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      marginBottom: '14px',
                      lineHeight: 1.25,
                    }}
                  >
                    1 Cohesive Local-First Operating System
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      'Single unified executive cockpit: MRR, ARR, Burn, and Runway',
                      'Autonomous morning intelligence synthesized before morning coffee',
                      '100% sovereign IndexedDB storage; zero data sold or leaked',
                      'Operates 100% offline at 35,000 feet without internet connection',
                      'Instant launch with zero logins, accounts, or corporate surveillance',
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '15px',
                          color: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            color: '#030712',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <button
                    onClick={onLaunchApp}
                    style={{
                      backgroundColor: '#0050FF', // Brand Blue
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '11px 20px',
                      fontSize: '15px',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 16px rgba(0, 80, 255, 0.4)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
                  >
                    <span>Experience FounderOS</span>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        color: '#0050FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowRight size={10} strokeWidth={3} />
                    </div>
                  </button>

                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 500 }}>
                    $0 Forever for Core
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. SERVICE ACTION CARDS (App Dark Palette + 50px geometry)
            - Surface: rgba(15, 23, 42, 0.75) with 50px border-radius
            - Heading at 30px Inter weight 500 #f8fafc
            - Body text at 17px weight 400 #94a3b8
            - Action trigger: Sleek pill button (50px radius) with embedded circular dot
           ========================================================================= */}
        <section id="capabilities" style={{ marginBottom: '120px' }}>
          {/* Section Heading */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 80, 255, 0.1)',
                border: '1px solid rgba(0, 80, 255, 0.25)',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '16px',
              }}
            >
              <Layers size={14} color="#0050FF" />
              THE SIX SOVEREIGN PILLARS
            </div>

            <h2
              style={{
                fontSize: 'clamp(36px, 5.5vw, 68px)',
                fontWeight: 500,
                letterSpacing: '-0.05em',
                color: '#f8fafc',
                lineHeight: 1.05,
                margin: '0 auto 16px auto',
                maxWidth: '900px',
              }}
            >
              Everything an executive needs. Nothing you don't.
            </h2>

            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '650px', margin: '0 auto' }}>
              Each module is crafted with sticker-soft tactile interactions and backed by
              bulletproof local-first database logic.
            </p>
          </div>

          {/* The 6 Service Action Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
            }}
          >
            {[
              {
                title: 'Executive Pulse',
                badge: 'LIVE TELEMETRY',
                desc: 'Real-time telemetry tracking MRR, ARR, net burn multiple, gross margins, and customer retention without third-party trackers.',
                icon: <TrendingUp size={24} color="#38bdf8" />,
                accentColor: '#0050FF',
                bullets: ['Instant Net Burn & Runway countdown', 'Cohort Net Revenue Retention (NRR)', 'Real-time weighted deal pipeline'],
                buttonText: 'Open Command Pulse',
              },
              {
                title: 'Morning Intelligence',
                badge: 'DAILY SYNTHESIS',
                desc: 'An automated briefing synthesized every morning at 7:00 AM so you know exactly where your capital and team stand before touching email.',
                icon: <Zap size={24} color="#f59e0b" />,
                accentColor: '#f59e0b',
                bullets: ['3 high-impact prioritized action items', 'Anomaly detection on runway fluctuations', 'Clean print-ready executive memo format'],
                buttonText: 'Read Intelligence Sample',
              },
              {
                title: 'Autonomous AI CEO',
                badge: 'STRATEGIC MODELING',
                desc: 'Stress-test hiring plans, simulate market downturns, and project cash burn across 24 months with your own private local AI copilot.',
                icon: <Bot size={24} color="#a855f7" />,
                accentColor: '#a855f7',
                bullets: ['Runway sensitivity modeling under stress', 'Custom provider support (OpenRouter, Ollama)', 'Zero training on proprietary company secrets'],
                buttonText: 'Simulate Strategy',
              },
              {
                title: 'Corporate Treasury',
                badge: 'CAPITAL SOVEREIGNTY',
                desc: 'Monitor operating checking accounts, tax escrow splits, and high-yield reserve allocations with automated safety buffers.',
                icon: <Landmark size={24} color="#10b981" />,
                accentColor: '#10b981',
                bullets: ['Multi-entity liquidity aggregation', 'Automated quarterly tax reserve calculator', 'Zero bank-link credential storage'],
                buttonText: 'View Vault Allocation',
              },
              {
                title: 'Deal Flow & Pipeline',
                badge: 'HIGH-CONVICTION CRM',
                desc: 'A laser-focused relationship engine built for founder-led sales. Track enterprise negotiations without heavy CRM bloat.',
                icon: <Users size={24} color="#38bdf8" />,
                accentColor: '#38bdf8',
                bullets: ['Stages tailored for founder closing motions', 'Weighted probability revenue projections', 'One-click contract milestone checkoffs'],
                buttonText: 'Track Active Deals',
              },
              {
                title: '100% Local-First Engine',
                badge: 'OFFLINE INDEXEDDB',
                desc: 'Your financial balance sheets, cap table notes, and pipeline stay encrypted inside your local device storage. No external cloud reliance.',
                icon: <HardDrive size={24} color="#f8fafc" />,
                accentColor: '#0050FF',
                bullets: ['Instant sub-10ms query execution', 'Zero latency offline flight mode support', 'One-click full JSON database export/import'],
                buttonText: 'Inspect Architecture',
              },
            ].map((card, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)', // --bg-card
                  backdropFilter: 'blur(16px)',
                  borderRadius: '50px', // --radius-cards: 50px
                  padding: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 80, 255, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div>
                  {/* Top Row: Circular Icon Container + Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1.5px solid rgba(255, 255, 255, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8',
                        letterSpacing: '0.04em',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Heading (30px Inter weight 500) */}
                  <h3
                    style={{
                      fontSize: '28px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      lineHeight: 1.2,
                      marginBottom: '12px',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Body text (17px weight 400) */}
                  <p
                    style={{
                      fontSize: '16px',
                      color: '#94a3b8',
                      lineHeight: 1.5,
                      marginBottom: '24px',
                    }}
                  >
                    {card.desc}
                  </p>

                  {/* Bulleted Points with Emerald Green Checkmarks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {card.bullets.map((bullet, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          color: '#e2e8f0',
                          fontWeight: 500,
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981', // Emerald
                            color: '#030712',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Card Link: Sleek pill button (50px radius) */}
                <button
                  onClick={onLaunchApp}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50px', // --radius-buttons: 50px
                    padding: '11px 20px', // 11px vertical, 20px horizontal
                    fontSize: '15px', // 15px Inter 500
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0050FF';
                    e.currentTarget.style.borderColor = '#1a62ff';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  <span>{card.buttonText}</span>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight size={11} strokeWidth={3} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. DOWNLOAD & WEB DISTRIBUTION HUB (App Dark Palette)
            - 3 Glass cards (50px border-radius)
            - Windows Setup Installer (.exe) with direct trigger
            - Instant Web Command Center with onLaunchApp
            - Windows Portable Binary (.exe)
           ========================================================================= */}
        <section id="downloads" style={{ marginBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 80, 255, 0.1)',
                border: '1px solid rgba(0, 80, 255, 0.3)',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '16px',
              }}
            >
              <Download size={14} color="#38bdf8" />
              NATIVE HARDWARE & CLOUDLESS WEB
            </div>

            <h2
              style={{
                fontSize: 'clamp(34px, 5vw, 64px)',
                fontWeight: 500,
                letterSpacing: '-0.05em',
                color: '#f8fafc',
                lineHeight: 1.08,
                margin: '0 auto 16px auto',
                maxWidth: '850px',
              }}
            >
              Choose your execution surface.
            </h2>

            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '650px', margin: '0 auto' }}>
              Whether you prefer a native desktop installer with system tray background daemon or
              instant zero-install web execution, FounderOS is ready in seconds.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Download Card 1: Windows Setup Installer */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '50px',
                padding: '36px',
                border: '2px solid #0050FF',
                boxShadow: '0 0 30px rgba(0, 80, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0050FF',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  RECOMMENDED FOR WINDOWS
                </div>

                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: '#f8fafc',
                    marginBottom: '10px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Windows Setup (.exe)
                </h3>

                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                  Full native executable installer with automatic Start Menu shortcuts, system tray
                  daemon, and global hotkey <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+Shift+O</code>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {['Version: 1.0.0 (Windows 64-bit)', 'Package Size: ~73.6 MB', 'Self-updating auto-updater engine'].map((f, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => triggerDownload('setup')}
                disabled={downloadState === 'downloading'}
                style={{
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.15)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <span>{downloadState === 'downloading' ? 'Downloading...' : 'Download Setup File (.exe)'}</span>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#0050FF',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={12} strokeWidth={3} />
                </div>
              </button>
            </div>

            {/* Download Card 2: Instant Web Command Center */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '50px',
                padding: '36px',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#38bdf8',
                    color: '#030712',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  ZERO INSTALL • RUNS EVERYWHERE
                </div>

                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: '#f8fafc',
                    marginBottom: '10px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Connect Web App
                </h3>

                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                  Launch the complete FounderOS Command Center immediately inside any modern browser.
                  Zero account required; data is persisted in your browser's local IndexedDB.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {['Compatible with Chrome, Edge, Safari, Firefox', 'Zero download or file installation needed', 'Full offline Progressive Web capabilities'].map((f, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} color="#38bdf8" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                style={{
                  backgroundColor: '#0050FF',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 18px rgba(0, 80, 255, 0.4)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
              >
                <span>Launch Web Application</span>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    color: '#0050FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight size={12} strokeWidth={3} />
                </div>
              </button>
            </div>

            {/* Download Card 3: Windows Portable Binary */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderRadius: '50px',
                padding: '36px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  STANDALONE PORTABLE
                </div>

                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: '#f8fafc',
                    marginBottom: '10px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Windows Portable (.exe)
                </h3>

                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                  Single standalone executable that runs without registry entries or admin permissions.
                  Ideal for USB drives and strictly isolated corporate machines.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {['No administrator installation permissions required', 'Zero background service residues on host machine', 'Encrypted local workspace stored adjacent to .exe'].map((f, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} color="#94a3b8" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => triggerDownload('portable')}
                disabled={downloadState === 'downloading'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50px',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
              >
                <span>Download Portable (.exe)</span>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#030712',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={12} strokeWidth={3} />
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          7. FOOTER ACCENT BLOCK (App Dark Palette)
          - #0b0f19 dark surface with top border rgba(255, 255, 255, 0.1)
          - 50px+ padding
          - Crisp typography and glowing brand action pills
         ========================================================================= */}
      <footer
        style={{
          backgroundColor: '#0b0f19', // --bg-surface
          color: '#f8fafc', // --text-main
          padding: '64px 24px 48px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          {/* Top Row: Brand & Quick Action Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid #0050FF',
                  boxShadow: '0 0 16px rgba(0, 80, 255, 0.4)',
                }}
              >
                <img
                  src={founderosLogo}
                  alt="FounderOS"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  FounderOS
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginTop: '4px' }}>
                  The Sovereign Operating System for Modern Founders
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => triggerDownload('setup')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              >
                <Download size={14} />
                <span>Download Setup</span>
              </button>

              <button
                onClick={onLaunchApp}
                style={{
                  backgroundColor: '#0050FF',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(0, 80, 255, 0.4)',
                }}
              >
                <span>Launch Web Command Center</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Hairline Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Bottom Copyright & Guarantee */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#94a3b8',
            }}
          >
            <div>
              © 2026 FounderOS Corporation. 100% sovereign local-first software. No cloud tracking.
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <a
                href="#chaos"
                style={{ color: '#94a3b8', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                The Dilemma
              </a>
              <a
                href="#capabilities"
                style={{ color: '#94a3b8', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                Core Pillars
              </a>
              <a
                href="#downloads"
                style={{ color: '#94a3b8', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                Download Center
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Animation Style */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
