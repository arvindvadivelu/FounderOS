import React from 'react';
import { Sparkles, ArrowLeft, Layers, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { SpotlightCard } from '../components/common/SpotlightCard';

interface V2ComingSoonPageProps {
  featureName: string;
  onNavigate: (route: string) => void;
}

export const V2ComingSoonPage: React.FC<V2ComingSoonPageProps> = ({ featureName, onNavigate }) => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
      <SpotlightCard
        style={{
          padding: '48px 36px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          borderRadius: '24px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          background: 'linear-gradient(180deg, rgba(20, 15, 38, 0.7) 0%, rgba(10, 15, 28, 0.95) 100%)',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(168, 85, 247, 0.18)',
        }}
      >
        {/* Glow Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(168, 85, 247, 0.14)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles size={13} />
          FounderOS V2 • Coming Soon
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.035em',
            margin: '4px 0 0 0',
          }}
        >
          {featureName} is Under Active Development
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            maxWidth: '600px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          This next-generation autonomous capability is planned for the upcoming FounderOS V2 release. All core features under the Command Center, Business &amp; Revenue, Execution, and Management modules remain fully active.
        </p>

        {/* Key Preview Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            width: '100%',
            marginTop: '12px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '6px' }}>
              <Clock size={16} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>In Active Development</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Engineered for seamless integration with user-owned local AI models and Dexie DB.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', marginBottom: '6px' }}>
              <Layers size={16} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>V2 Multi-Agent Architecture</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Autonomous orchestrations that connect boardrooms, operations, and intelligence streams.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '6px' }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Local-First Privacy</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              100% offline-ready and private to your personal device, with zero third-party telemetry.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '13px', borderRadius: '50px' }}
          >
            <ArrowLeft size={16} /> Back to Command Center
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/tasks')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', borderRadius: '50px' }}
          >
            Go to Tasks <ArrowRight size={14} />
          </button>
        </div>
      </SpotlightCard>
    </div>
  );
};
