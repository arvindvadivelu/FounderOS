import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Bot,
  Landmark,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Laptop,
  Globe,
  RefreshCw,
  Check,
  LineChart,
  HardDrive,
  ChevronRight,
  Flame,
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
  const [activePreviewTab, setActivePreviewTab] = useState<'cockpit' | 'intelligence' | 'treasury' | 'ai'>('cockpit');

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
      setTimeout(() => setDownloadState('idle'), 4000);
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        lineHeight: 1.5,
      }}
    >
      {/* Background Chromatic Radial Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '20%',
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(0, 80, 255, 0.16) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '35%',
          right: '-12%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(3, 7, 18, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* =====================================================================
          1. FLOATING PILL NAVIGATION BAR (DESIGN.md: 50px radius, generous margins)
         ===================================================================== */}
      <div
        style={{
          position: 'sticky',
          top: '18px',
          zIndex: 100,
          padding: '0 20px',
          pointerEvents: 'none',
        }}
      >
        <header
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            height: '64px',
            backgroundColor: 'rgba(11, 15, 25, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '50px', // DESIGN.md: 50px radius on nav
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 80, 255, 0.15)',
            padding: '0 10px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'auto',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Brand Logo Container (DESIGN.md: Rounded square 10-20px) */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px', // DESIGN.md: 10-20px container
                backgroundColor: 'rgba(0, 80, 255, 0.2)',
                border: '1px solid rgba(0, 80, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 0 12px rgba(0, 80, 255, 0.35)',
              }}
            >
              <img
                src={founderosLogo}
                alt="FounderOS Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: '#ffffff',
                }}
              >
                FounderOS
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '50px', // DESIGN.md: 50px pill tag
                  backgroundColor: 'rgba(0, 80, 255, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid rgba(0, 80, 255, 0.35)',
                  letterSpacing: '0.4px',
                }}
              >
                v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links (DESIGN.md: 15px Inter 500 with generous padding) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#94a3b8',
            }}
            className="landing-nav-links"
          >
            <a
              href="#features"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              Features
            </a>
            <a
              href="#cockpit"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              Cockpit
            </a>
            <a
              href="#downloads"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              Downloads
            </a>
            <a
              href="#v2"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              V2 Platform
            </a>
          </nav>

          {/* Header Action Buttons (DESIGN.md: 50px pill buttons with circular icon dot) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Download Setup Pill */}
            <button
              type="button"
              onClick={() => triggerDownload('setup')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '50px', // DESIGN.md: 50px radius
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
              title="Download Windows Setup Installer (.exe)"
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%', // DESIGN.md: small chromatic circle icon
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={11} color="#38bdf8" />
              </div>
              <span>Download Setup</span>
            </button>

            {/* Connect Web App Pill (DESIGN.md: Primary action pill with circle icon indicator) */}
            <button
              type="button"
              onClick={onLaunchApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '50px', // DESIGN.md: 50px radius
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 80, 255, 0.5)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a62ff';
                e.currentTarget.style.boxShadow = '0 0 28px rgba(0, 80, 255, 0.7)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0050FF';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 80, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Connect Web Application"
            >
              <span>Connect Web App</span>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%', // DESIGN.md: embedded circle action dot
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={11} color="#ffffff" />
              </div>
            </button>
          </div>
        </header>
      </div>

      {/* =====================================================================
          2. HERO DISPLAY BLOCK (DESIGN.md: Giant display headline, tight tracking,
             0.95-1.05 line height, confident breathable layout)
         ===================================================================== */}
      <section
        style={{
          position: 'relative',
          padding: '90px 24px 80px 24px', // DESIGN.md: generous section spacing
          maxWidth: '1200px', // DESIGN.md: page max-width: 1200px
          margin: '0 auto',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {/* Soft Sticker Pill Badge (DESIGN.md: 50px radius, 10px tag style) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 18px',
            borderRadius: '50px', // DESIGN.md: 50px pill shape
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
            Production Release • 100% Local-First Autonomous Cockpit
          </span>
        </div>

        {/* Hero Display Headline (DESIGN.md: massive display scale, -0.06em tracking, 0.95 line height) */}
        <h1
          style={{
            fontSize: 'clamp(44px, 7.5vw, 96px)', // DESIGN.md: massive scale 81px-140px display scale
            fontWeight: 700,
            lineHeight: 0.98, // DESIGN.md: aggressive line-height compression 0.95-1.15
            letterSpacing: '-0.055em', // DESIGN.md: -0.06em tight tracking
            margin: '0 auto 28px auto',
            maxWidth: '1040px',
            color: '#ffffff',
          }}
        >
          The Autonomous Operating System for{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            High-Growth Founders
          </span>
        </h1>

        {/* Subtitle (DESIGN.md: 18px-20px Inter, line-height 1.5) */}
        <p
          style={{
            fontSize: 'clamp(17px, 2vw, 20px)', // DESIGN.md: 18-20px subheading
            color: '#94a3b8',
            maxWidth: '740px',
            margin: '0 auto 44px auto',
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Consolidate your financial runway, sales pipeline, executive KPIs, employee payroll,
          corporate vault, and daily AI CEO intelligence into one ultra-fast, private cockpit.
        </p>

        {/* MAIN CALL TO ACTIONS (DESIGN.md: 50px pill buttons with circular icon badges) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {/* PRIMARY BUTTON 1: DOWNLOAD SETUP FILE */}
          <button
            type="button"
            onClick={() => triggerDownload('setup')}
            disabled={downloadState === 'downloading'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 32px',
              borderRadius: '50px', // DESIGN.md: 50px radius buttons
              backgroundColor: '#ffffff',
              color: '#030712',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: downloadState === 'downloading' ? 'wait' : 'pointer',
              boxShadow: '0 10px 30px rgba(255, 255, 255, 0.18)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(255, 255, 255, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.18)';
            }}
          >
            {/* Embedded circular icon dot (DESIGN.md: small chromatic circle icon affordance) */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 80, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {downloadState === 'downloading' && downloadType === 'setup' ? (
                <RefreshCw size={16} className="animate-spin text-brand" />
              ) : downloadState === 'completed' && downloadType === 'setup' ? (
                <Check size={16} color="#10b981" />
              ) : (
                <Download size={16} color="#0050FF" />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ lineHeight: 1.2, fontWeight: 700 }}>Download Setup File</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                Windows x64 (.exe) • 73 MB
              </div>
            </div>
          </button>

          {/* PRIMARY BUTTON 2: CONNECT WEB APPLICATION */}
          <button
            type="button"
            onClick={onLaunchApp}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 32px',
              borderRadius: '50px', // DESIGN.md: 50px radius buttons
              backgroundColor: '#0050FF',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer',
              boxShadow: '0 10px 35px rgba(0, 80, 255, 0.5)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a62ff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 45px rgba(0, 80, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0050FF';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 35px rgba(0, 80, 255, 0.5)';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ lineHeight: 1.2, fontWeight: 700 }}>Connect Web Application</div>
              <div style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: 500 }}>
                Instant Browser Console • IndexedDB
              </div>
            </div>
            {/* Embedded circular icon dot (DESIGN.md: small chromatic circle icon affordance) */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={16} color="#ffffff" />
            </div>
          </button>
        </div>

        {/* Secondary options row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '13px', color: '#64748b' }}>
          <span>Compatible with Windows 10 & 11</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => triggerDownload('portable')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            Download Portable Edition (.exe)
          </button>
          <span>•</span>
          <span>Zero installation needed</span>
        </div>

        {/* Live System Metric Badges (DESIGN.md: 50px pill shape container chips) */}
        <div
          style={{
            marginTop: '60px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            maxWidth: '1100px',
            marginRight: 'auto',
            marginLeft: 'auto',
          }}
        >
          <div
            style={{
              padding: '16px 22px',
              borderRadius: '50px', // DESIGN.md: 50px pill radius
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>100% Local Privacy</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Local IndexedDB storage</div>
            </div>
          </div>

          <div
            style={{
              padding: '16px 22px',
              borderRadius: '50px', // DESIGN.md: 50px pill radius
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>&lt; 50ms Query Latency</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Zero network roundtrips</div>
            </div>
          </div>

          <div
            style={{
              padding: '16px 22px',
              borderRadius: '50px', // DESIGN.md: 50px pill radius
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0 }}>
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>Multi-Model BYOK AI</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>OpenRouter, OpenAI, Local</div>
            </div>
          </div>

          <div
            style={{
              padding: '16px 22px',
              borderRadius: '50px', // DESIGN.md: 50px pill radius
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
              <HardDrive size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>Desktop & Web Parity</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Shared local-first codebase</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. INTERACTIVE COCKPIT PREVIEW (DESIGN.md: 50px radius card,
             clean internal padding 21px+, pill switcher tabs)
         ===================================================================== */}
      <section
        id="cockpit"
        style={{
          padding: '40px 24px 100px 24px', // DESIGN.md: 80-120px section gap
          maxWidth: '1200px', // DESIGN.md: page max-width 1200px
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(11, 15, 25, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 30px 70px -10px rgba(0, 0, 0, 0.8), 0 0 45px rgba(0, 80, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Mock Window Titlebar */}
          <div
            style={{
              padding: '18px 28px',
              backgroundColor: '#02050d',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                FounderOS Command Cockpit — Live Interface
              </span>
            </div>

            {/* Interactive Preview Switcher Tabs (DESIGN.md: 50px pill shape tabs) */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActivePreviewTab('cockpit')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '50px', // DESIGN.md: 50px radius
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activePreviewTab === 'cockpit' ? 'rgba(0, 80, 255, 0.25)' : 'transparent',
                  color: activePreviewTab === 'cockpit' ? '#93c5fd' : '#64748b',
                  border: activePreviewTab === 'cockpit' ? '1px solid rgba(0, 80, 255, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Command Center
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('intelligence')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '50px', // DESIGN.md: 50px radius
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activePreviewTab === 'intelligence' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: activePreviewTab === 'intelligence' ? '#6ee7b7' : '#64748b',
                  border: activePreviewTab === 'intelligence' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Morning Intelligence
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('treasury')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '50px', // DESIGN.md: 50px radius
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activePreviewTab === 'treasury' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: activePreviewTab === 'treasury' ? '#fcd34d' : '#64748b',
                  border: activePreviewTab === 'treasury' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Cash & Treasury
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('ai')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '50px', // DESIGN.md: 50px radius
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activePreviewTab === 'ai' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  color: activePreviewTab === 'ai' ? '#d8b4fe' : '#64748b',
                  border: activePreviewTab === 'ai' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                AI CEO Copilot
              </button>
            </div>
          </div>

          {/* Mock Window Content */}
          <div style={{ padding: '36px', backgroundColor: '#090d16' }}>
            {activePreviewTab === 'cockpit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: '#ffffff', letterSpacing: '-0.5px' }}>
                      Executive Command Center
                    </h2>
                    <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                      Live company metrics calculated instantly from local IndexedDB ledgers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '50px', // DESIGN.md: 50px radius
                      backgroundColor: '#0050FF',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 80, 255, 0.3)',
                    }}
                  >
                    <span>Open Live View</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Annual Recurring Revenue</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-1px' }}>$1,240,000</div>
                    <div style={{ fontSize: '12px', color: '#34d399', marginTop: '6px' }}>+18.4% vs last quarter</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Net Cash Runway</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', letterSpacing: '-1px' }}>22.4 Months</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>$845,000 Cash in Vault</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Active Customers & Deals</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa', letterSpacing: '-1px' }}>$340k Weighted</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>14 qualified opportunities</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Monthly Net Burn</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', letterSpacing: '-1px' }}>-$37,500</div>
                    <div style={{ fontSize: '12px', color: '#34d399', marginTop: '6px' }}>Reduced by 12% via audit</div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'intelligence' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '50px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                    ● Synthesized Daily Briefing
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Generated on-device without cloud exposure</span>
                </div>
                <div style={{ padding: '28px', borderRadius: '28px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                    Key Strategic Observations for Today
                  </div>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                    1. <strong>Pipeline Acceleration:</strong> Three enterprise contracts in negotiation are scheduled to close within 14 days, extending runway by +3.2 months.
                    <br />
                    2. <strong>Treasury Optimization:</strong> Next month's payroll is fully secured in the primary operating account.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '50px', backgroundColor: 'rgba(0, 80, 255, 0.15)', color: '#60a5fa' }}>Finance Ledger Checked</span>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '50px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>CRM Pipeline Audited</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'treasury' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Cash & Treasury Accounts</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Operating Account</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '8px 0' }}>$485,200.00</div>
                    <div style={{ fontSize: '12px', color: '#10b981' }}>Active Liquidity • 0% Risk</div>
                  </div>
                  <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Treasury Vault (Short-term T-Bills)</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '8px 0' }}>$360,000.00</div>
                    <div style={{ fontSize: '12px', color: '#38bdf8' }}>5.1% APY Yield Generated</div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>AI CEO Strategic Co-Founder</h3>
                <div style={{ padding: '28px', borderRadius: '28px', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                  <div style={{ fontSize: '13.5px', color: '#c084fc', fontWeight: 600, marginBottom: '6px' }}>Founder Prompt:</div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '16px', fontStyle: 'italic' }}>
                    "What happens to our runway if we hire 2 senior engineers next month at $150k each?"
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>AI CEO Analysis:</div>
                  <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                    "Adding $25,000/mo in payroll will increase monthly burn from $37.5k to $62.5k. Your cash runway will adjust from <strong>22.4 months</strong> to <strong>13.5 months</strong> unless pipeline deals in Stage 3 convert by Q3."
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CORE CAPABILITIES (DESIGN.md: Content Cards with 50px border-radius,
             21px+ internal padding, comfortable density, tight headings)
         ===================================================================== */}
      <section
        id="features"
        style={{
          padding: '80px 24px 100px 24px', // DESIGN.md: 80-120px section gap
          maxWidth: '1200px', // DESIGN.md: page max-width 1200px
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            Built for Modern Founders
          </span>
          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 53px)', // DESIGN.md: 53px heading scale
              fontWeight: 700,
              lineHeight: 1.15, // DESIGN.md: 1.15 heading line-height
              letterSpacing: '-2.12px', // DESIGN.md: -2.12px heading tracking
              margin: '12px 0 16px 0',
              color: '#ffffff',
            }}
          >
            Everything you need to scale your company
          </h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Replace 8 disparate subscriptions with a single private operating system.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1: Executive KPI & Command Center */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <LineChart size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              Executive KPIs & Cash Runway
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Live visibility into ARR, monthly net burn, cash runway, and North Star milestones. Zero manual spreadsheets or disconnected dashboards.
            </p>
          </div>

          {/* Card 2: Morning Intelligence */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              Morning Intelligence Briefing
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Synthesizes daily situational awareness from your live financial ledgers, customer churn alerts, sales stages, and priority tasks before your day begins.
            </p>
          </div>

          {/* Card 3: AI CEO Copilot */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Bot size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              AI CEO Strategic Co-Founder
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Simulate strategic boardroom decisions, pricing adjustments, runway impacts, and investor updates with an AI that knows your actual company numbers.
            </p>
          </div>

          {/* Card 4: Management & Corporate Vault */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Landmark size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              Treasury, Payroll & Vault
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Manage bank accounts, assets & liabilities, employee directory, departments, and store sensitive cap table & corporate files in an encrypted local vault.
            </p>
          </div>

          {/* Card 5: CRM & Sales Pipeline */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              Customers & Deal Flow
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Track prospect lifecycles from lead to closed-won. Monitor customer retention, churn indicators, and contract renewal dates without CRM bloat.
            </p>
          </div>

          {/* Card 6: 100% Offline & Local Privacy */}
          <div
            style={{
              padding: '36px',
              borderRadius: '50px', // DESIGN.md: 50px border-radius on cards
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%', // DESIGN.md: circular icon container
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.3px' }}>
              Local-First IndexedDB Privacy
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Your financial ledgers, customer records, and notes are saved strictly on your local device. Works flawlessly offline on flights and trains.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. DEDICATED DOWNLOAD CENTER (DESIGN.md: 50px radius cards,
             pill action buttons with circular icon badges)
         ===================================================================== */}
      <section
        id="downloads"
        style={{
          padding: '100px 24px', // DESIGN.md: 80-120px section gap
          backgroundColor: '#02050e',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              Deployment Options
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 53px)', // DESIGN.md: 53px heading scale
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-2.12px',
                margin: '12px 0 16px 0',
                color: '#ffffff',
              }}
            >
              Choose how you want to run FounderOS
            </h2>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
              Run natively on Windows with system tray daemon, or launch instantly in your web browser.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              maxWidth: '1140px',
              margin: '0 auto',
            }}
          >
            {/* OPTION 1: WINDOWS SETUP INSTALLER (RECOMMENDED) */}
            <div
              style={{
                padding: '40px 32px',
                borderRadius: '50px', // DESIGN.md: 50px border-radius
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '2px solid rgba(0, 80, 255, 0.45)',
                boxShadow: '0 12px 35px rgba(0, 80, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '32px',
                  padding: '4px 14px',
                  borderRadius: '50px', // DESIGN.md: 50px pill badge
                  backgroundColor: '#0050FF',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 10px rgba(0, 80, 255, 0.5)',
                }}
              >
                RECOMMENDED
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 80, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Laptop size={20} color="#38bdf8" />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.4px' }}>
                    Windows Setup Installer
                  </h3>
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>
                  Complete native desktop experience with automated background updates and tray summon.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>One-click installation (`.exe`)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Global hotkey summon (`Ctrl+Shift+O`)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>System tray background daemon</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Isolated native IndexedDB storage</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => triggerDownload('setup')}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '50px', // DESIGN.md: 50px pill button
                    backgroundColor: '#0050FF',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(0, 80, 255, 0.45)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={13} color="#ffffff" />
                  </div>
                  <span>Download Setup (.exe)</span>
                </button>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                  FounderOS-Setup.exe • Windows 10/11 (64-bit)
                </div>
              </div>
            </div>

            {/* OPTION 2: CONNECT WEB APPLICATION (INSTANT BROWSER CONSOLE) */}
            <div
              style={{
                padding: '40px 32px',
                borderRadius: '50px', // DESIGN.md: 50px border-radius
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={20} color="#c084fc" />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.4px' }}>
                    Connect Web Application
                  </h3>
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>
                  Zero download required. Run instantly in your favorite browser with local IndexedDB storage.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Instant launch (Chrome, Edge, Firefox, Safari)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>100% feature parity with Desktop</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Browser-native IndexedDB persistence</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Works offline as a Progressive App</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onLaunchApp}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '50px', // DESIGN.md: 50px pill button
                    backgroundColor: '#ffffff',
                    color: '#030712',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0, 80, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={13} color="#0050FF" />
                  </div>
                  <span>Launch Web Console</span>
                  <ArrowRight size={14} color="#030712" />
                </button>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                  No installation required • Instant start
                </div>
              </div>
            </div>

            {/* OPTION 3: WINDOWS PORTABLE EDITION */}
            <div
              style={{
                padding: '40px 32px',
                borderRadius: '50px', // DESIGN.md: 50px border-radius
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HardDrive size={20} color="#fbbf24" />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.4px' }}>
                    Windows Portable Edition
                  </h3>
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>
                  Single executable file. Run from USB or any folder without installation or admin rights.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Zero installation / No admin rights required</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Ideal for secured corporate machines</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Stores data locally in your user profile</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Single `.exe` file (~73 MB)</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => triggerDownload('portable')}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '50px', // DESIGN.md: 50px pill button
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={13} color="#ffffff" />
                  </div>
                  <span>Download Portable (.exe)</span>
                </button>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748b', marginTop: '10px' }}>
                  FounderOS-Portable.exe • Standalone binary
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. V2 ROADMAP SNEAK PEEK (DESIGN.md: 50px card with pill tag)
         ===================================================================== */}
      <section
        id="v2"
        style={{
          padding: '80px 24px 90px 24px', // DESIGN.md: 80-120px section gap
          maxWidth: '1200px', // DESIGN.md: page max-width 1200px
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '50px 44px',
            borderRadius: '50px', // DESIGN.md: 50px border-radius
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(0, 80, 255, 0.14) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={18} color="#c084fc" />
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', textTransform: 'uppercase' }}>
                  FounderOS V2 • Next Generation
                </span>
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.6px' }}>
                Autonomous Routines & Executive Boardroom
              </h2>
              <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0, maxWidth: '680px', lineHeight: 1.6 }}>
                Coming soon: Multi-agent boardroom simulations, automatic treasury yield sweeps, and self-executing founder workflows that operate on your behalf.
              </p>
            </div>

            <button
              type="button"
              onClick={onLaunchApp}
              style={{
                padding: '12px 26px',
                borderRadius: '50px', // DESIGN.md: 50px pill button
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            >
              <span>Preview V2 in App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FOOTER (DESIGN.md: Breathable, clean pill actions)
         ===================================================================== */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#02050d',
          padding: '60px 24px 44px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: '1200px', // DESIGN.md: 1200px
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 80, 255, 0.2)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={founderosLogo}
                  alt="FounderOS"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>FounderOS</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Single-User AI Founder Operating System
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => triggerDownload('setup')}
                style={{
                  padding: '9px 20px',
                  borderRadius: '50px', // DESIGN.md: 50px pill button
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Download size={14} color="#38bdf8" />
                <span>Download Setup</span>
              </button>

              <button
                type="button"
                onClick={onLaunchApp}
                style={{
                  padding: '9px 22px',
                  borderRadius: '50px', // DESIGN.md: 50px pill button
                  backgroundColor: '#0050FF',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 80, 255, 0.4)',
                }}
              >
                <Sparkles size={14} />
                <span>Connect Web App</span>
              </button>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '12.5px',
              color: '#64748b',
            }}
          >
            <div>
              © {new Date().getFullYear()} FounderOS. Local-First Autonomous Startup Cockpit.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Offline-first engines operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
