// Página de pré-seleção — /presel
// Botão pulsante central que leva ao formulário Google Forms

const b = {
  bg:        '#101010',
  surface:   '#181818',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.14)',
  text:      '#ffffff',
  muted:     'rgba(255,255,255,0.5)',
  subtle:    'rgba(255,255,255,0.28)',
  accent:    '#fd4b01',
  accentDim: 'rgba(253,75,1,0.12)',
  accentBdr: 'rgba(253,75,1,0.3)',
}

const FORM_URL = 'https://forms.gle/wkYhxuqQiiYbby2V6'

export default function Presel() {
  return (
    <div style={{
      background: b.bg,
      color: b.text,
      minHeight: '100dvh',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* Animações */
        @keyframes ps-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ps-ping {
          0%   { transform: scale(1);   opacity: .75; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ps-ping2 {
          0%   { transform: scale(1);   opacity: .5; }
          70%  { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes ps-pulse-btn {
          0%, 100% { box-shadow: 0 6px 32px rgba(253,75,1,0.45), 0 0 0 0 rgba(253,75,1,0.35); }
          50%       { box-shadow: 0 8px 48px rgba(253,75,1,0.65), 0 0 0 14px rgba(253,75,1,0); }
        }
        @keyframes ps-glow {
          0%, 100% { opacity: .55; }
          50%       { opacity: .85; }
        }
        @keyframes ps-badge {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }

        .ps-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px 48px;
          border-radius: 16px;
          border: none;
          background: #fd4b01;
          color: #fff;
          font-size: clamp(17px, 4vw, 22px);
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: -.01em;
          text-decoration: none;
          animation: ps-pulse-btn 2.2s ease-in-out infinite, ps-fade-up .7s .55s ease both;
          transition: transform .15s, filter .15s;
          position: relative;
        }
        .ps-btn:hover {
          transform: translateY(-3px) scale(1.025);
          filter: brightness(1.08);
        }
        .ps-btn:active {
          transform: translateY(0) scale(.98);
        }
        .ps-btn-ring {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: #fd4b01;
          animation: ps-ping 2.2s ease-out infinite;
          pointer-events: none;
        }
        .ps-btn-ring2 {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: #fd4b01;
          animation: ps-ping2 2.2s 1.1s ease-out infinite;
          pointer-events: none;
        }

        .ps-hero-title {
          font-family: "Clash Display", "Inter", sans-serif;
          font-size: clamp(28px, 7vw, 64px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin-bottom: 18px;
          animation: ps-fade-up .6s .1s ease both;
        }
        .ps-hero-sub {
          font-size: clamp(14px, 2.8vw, 18px);
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 44px;
          animation: ps-fade-up .6s .25s ease both;
        }
        .ps-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(253,75,1,0.12);
          border: 1px solid rgba(253,75,1,0.3);
          font-size: 12px;
          font-weight: 600;
          color: #fd4b01;
          margin-bottom: 28px;
          animation: ps-badge .5s ease both;
        }
        .ps-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fd4b01;
          position: relative;
          flex-shrink: 0;
          animation: ps-glow 1.8s ease-in-out infinite;
        }
        .ps-hint {
          margin-top: 18px;
          font-size: 12px;
          color: rgba(255,255,255,0.28);
          animation: ps-fade-up .6s .75s ease both;
          letter-spacing: .01em;
        }

        /* Features abaixo */
        .ps-features {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 56px;
          animation: ps-fade-up .6s .85s ease both;
        }
        .ps-feat-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 10px;
          background: #181818;
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
        }
        .ps-feat-chip span.dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fd4b01;
          flex-shrink: 0;
        }

        /* Glow radial */
        .ps-glow-bg {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(700px, 120vw);
          height: min(700px, 120vw);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(253,75,1,0.11) 0%, transparent 68%);
          pointer-events: none;
          animation: ps-glow 3s ease-in-out infinite;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .ps-btn { padding: 18px 36px; }
          .ps-features { gap: 8px; }
          .ps-feat-chip { font-size: 12px; padding: 8px 12px; }
        }

        ::selection { background: rgba(253,75,1,0.35); color: #fff; }
      `}</style>

      {/* ── NAV (só logo) ─────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(16,16,16,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${b.border}`,
      }}>
        <img src="/logo-dark.png" alt="Cheffya" style={{ height: 26, objectFit: 'contain' }} />
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 20px 72px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow de fundo */}
        <div className="ps-glow-bg" />

        {/* Badge */}
        <div className="ps-badge">
          <span className="ps-badge-dot" />
          Análise gratuita para o seu restaurante
        </div>

        {/* Título */}
        <h1 className="ps-hero-title">
          Descubra o potencial<br />
          do seu <span style={{ color: b.accent }}>restaurante</span>
        </h1>

        {/* Subtítulo */}
        <p className="ps-hero-sub">
          Responda algumas perguntas rápidas e receba uma análise personalizada para o seu negócio. Leva menos de 2 minutos.
        </p>

        {/* Botão pulsante */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <span className="ps-btn-ring" />
          <span className="ps-btn-ring2" />
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ps-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
            Faça sua Análise!
          </a>
        </div>

        <p className="ps-hint">✦ Gratuito &nbsp;·&nbsp; Sem compromisso &nbsp;·&nbsp; Resultado rápido</p>

        {/* Chips de features */}
        <div className="ps-features">
          {[
            'Cardápio Digital',
            'Fluxo de Pedidos',
            'Controle de Estoque',
            'Delivery',
            'Mesas & Comandas',
            'Relatórios',
          ].map(f => (
            <div key={f} className="ps-feat-chip">
              <span className="dot" />
              {f}
            </div>
          ))}
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        padding: '20px 24px',
        borderTop: `1px solid ${b.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 12, color: b.subtle }}>© 2025 Cheffya — Sistema de gestão para restaurantes</span>
      </footer>
    </div>
  )
}
