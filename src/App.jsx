import { lazy, Suspense, useState, useEffect } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import NotificationManager from './components/NotificationManager.jsx'
import { useApp } from './context/AppContext.jsx'
import { supabase } from './lib/supabase.js'

// Páginas carregadas sob demanda
const LandingPage      = lazy(() => import('./pages/LandingPage.jsx'))
const VisaoGeral       = lazy(() => import('./pages/VisaoGeral.jsx'))
const Mercadorias      = lazy(() => import('./pages/Ingredientes.jsx'))
const Receitas         = lazy(() => import('./pages/FichaTecnica.jsx'))
const Cardapio         = lazy(() => import('./pages/Cardapio.jsx'))
const Vendas           = lazy(() => import('./pages/Vendas.jsx'))
const Kanban           = lazy(() => import('./pages/Kanban.jsx'))
const PDV              = lazy(() => import('./pages/PDV.jsx'))
const Mesas            = lazy(() => import('./pages/Mesas.jsx'))
const MenuPublico      = lazy(() => import('./pages/MenuPublico.jsx'))
const DeliveryPublico  = lazy(() => import('./pages/DeliveryPublico.jsx'))
const MotoboiPublico   = lazy(() => import('./pages/MotoboiPublico.jsx'))
const DeliveryGerenciar = lazy(() => import('./pages/DeliveryGerenciar.jsx'))
const ComandaDigital   = lazy(() => import('./pages/ComandaDigital.jsx'))
const CozinhaDisplay   = lazy(() => import('./pages/CozinhaDisplay.jsx'))
const CaixaDisplay     = lazy(() => import('./pages/CaixaDisplay.jsx'))
const TelaoDisplay     = lazy(() => import('./pages/TelaoDisplay.jsx'))
const PedidosDisplay   = lazy(() => import('./pages/PedidosDisplay.jsx'))
const Configuracoes    = lazy(() => import('./pages/Configuracoes.jsx'))
const Displays         = lazy(() => import('./pages/Displays.jsx'))
const AdminPanel       = lazy(() => import('./pages/AdminPanel.jsx'))
const Despesas         = lazy(() => import('./pages/Despesas.jsx'))
const WhatsApp         = lazy(() => import('./pages/WhatsApp.jsx'))
const ResetPassword    = lazy(() => import('./pages/ResetPassword.jsx'))
const EmailConfirmado  = lazy(() => import('./pages/EmailConfirmado.jsx'))
const Trial            = lazy(() => import('./pages/Trial.jsx'))
const Presel           = lazy(() => import('./pages/Presel.jsx'))
const Integracoes      = lazy(() => import('./pages/Integracoes.jsx'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { auth, authLoading } = useApp()
  if (authLoading) return null
  if (!auth.logado) return <Navigate to="/" replace />
  return children
}

// ── WhatsApp SVG icon ─────────────────────────────────────────────────────
function IconWhatsApp({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.46 17.5 2 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.41 1.56 1.56 2.42 3.62 2.42 5.83 0 4.55-3.7 8.24-8.25 8.24-1.47 0-2.93-.4-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31A8.22 8.22 0 013.8 11.9c.01-4.55 3.71-8.24 8.24-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1.01 2.56.13.17 1.75 2.67 4.24 3.73.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.28-.25-.13-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.15.17-.29.19-.54.07-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.3-.01-.46-.01z" />
    </svg>
  )
}

// ── Tela de plano bloqueado ────────────────────────────────────────────────
function TelaPlanoBloqueado({ motivo, auth, onLogout, cfg = {} }) {
  const expirado        = motivo === 'expirado'
  const pagamentoFalhou = motivo === 'pagamento_falhou'
  const dataFim  = auth.planoFim
    ? new Date(auth.planoFim + 'T00:00:00').toLocaleDateString('pt-BR')
    : null
  const nomeSistema  = cfg.nomeSistema  || 'Cheffya'
  const waNumero     = (cfg.suporteWhatsapp || '').replace(/\D/g, '')
  const waMensagem   = cfg.suporteMensagem || `Olá, preciso renovar meu plano do ${nomeSistema}.`
  const suporteEmail = cfg.suporteEmail || ''
  const gateways     = cfg.gateways || []

  const iconeCor = pagamentoFalhou ? 'rgba(239,68,68,0.1)' : expirado ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
  const icone    = pagamentoFalhou ? '❌' : expirado ? '🔒' : '⏳'
  const titulo   = pagamentoFalhou ? 'Pagamento não aprovado' : expirado ? 'Plano expirado' : 'Sem plano ativo'
  const msg1     = pagamentoFalhou
    ? 'Seu pagamento não foi processado. Tente novamente pelo seu gateway de pagamento.'
    : expirado
      ? `Seu plano ${auth.planoAtivo && auth.planoAtivo !== 'ativo' ? `(${auth.planoAtivo})` : ''} venceu${dataFim ? ` em ${dataFim}` : ''}.`
      : 'Sua conta ainda não possui um plano ativo.'
  const msg2 = pagamentoFalhou
    ? 'Se o problema persistir, entre em contato com o suporte.'
    : 'Entre em contato com o suporte para renovar e voltar a usar o sistema.'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: '100%', textAlign: 'center',
        background: 'var(--bg-card)', borderRadius: 20,
        padding: '40px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <img src="/logo-light.png" alt={nomeSistema}
          style={{ height: 48, objectFit: 'contain', margin: '0 auto 24px', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />

        {/* Ícone */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: iconeCor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>
          {icone}
        </div>

        {/* Título */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {titulo}
        </h2>

        {/* Mensagens */}
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 4px' }}>{msg1}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>{msg2}</p>

        {/* Botões de gateway (pagamento falhou ou expirado) */}
        {(pagamentoFalhou || expirado) && gateways.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {gateways.map(gw => (
              <a key={gw.id} href={gw.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: gw.cor || '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15,
                  padding: '13px 24px', borderRadius: 12, textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {pagamentoFalhou ? '🔄 Tentar novamente' : '💳 Renovar'} — {gw.nome}
              </a>
            ))}
          </div>
        )}

        {/* Botão WhatsApp */}
        {waNumero && (
          <a
            href={`https://wa.me/${waNumero}?text=${encodeURIComponent(waMensagem)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 15,
              padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
              marginBottom: 8, transition: 'opacity 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            <IconWhatsApp size={18} color="#fff" /> Suporte pelo Whatsapp
          </a>
        )}

        {/* Email de suporte */}
        {suporteEmail && (
          <a href={`mailto:${suporteEmail}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: '#3b82f6', fontSize: 13, textDecoration: 'none', marginBottom: 16, fontWeight: 600,
            }}>
            ✉️ {suporteEmail}
          </a>
        )}

        {/* Separador */}
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />

        {/* Logout */}
        <button onClick={onLogout} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 12,
          padding: '10px 24px', color: 'var(--text-muted)', fontSize: 13,
          cursor: 'pointer', width: '100%', fontWeight: 600,
        }}>
          Sair da conta
        </button>
      </div>
    </div>
  )
}

// ── Tela de seleção de plano (após trial expirado) ────────────────────────
function TelaSelecionarPlano({ auth, onLogout, cfg = {} }) {
  const nomeSistema  = cfg.nomeSistema || 'Cheffya'
  const planos       = (cfg.planosUpgrade || []).filter(p => p.ativo !== false)
  const waNumero     = (cfg.suporteWhatsapp || '').replace(/\D/g, '')
  const waMensagem   = cfg.suporteMensagem || `Olá, quero assinar o ${nomeSistema}.`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Logo */}
      <img src="/logo-light.png" alt={nomeSistema}
        style={{ height: 40, objectFit: 'contain', marginBottom: 24 }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 500 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Seu período de teste encerrou!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Esperamos que tenha curtido. Escolha um plano para continuar usando o {nomeSistema}.
        </p>
      </div>

      {/* Cards de plano */}
      {planos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, width: '100%', maxWidth: 860, marginBottom: 32 }}>
          {planos.map(p => (
            <div key={p.id} style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px',
              border: p.destaque ? `2px solid ${p.cor || 'var(--accent)'}` : '1px solid var(--border)',
              boxShadow: p.destaque ? `0 4px 24px ${p.cor || 'var(--accent)'}30` : '0 2px 8px rgba(0,0,0,0.06)',
              position: 'relative', display: 'flex', flexDirection: 'column',
            }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.cor || 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                  ⭐ Mais popular
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>{p.nome}</h3>
                {p.descricao && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{p.descricao}</p>}
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: p.cor || 'var(--accent)' }}>
                  R$ {Number(p.preco || 0).toFixed(2).replace('.', ',')}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>/{p.periodo || 'mês'}</span>
              </div>
              {p.recursos && p.recursos.length > 0 && (
                <ul style={{ margin: '0 0 20px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {p.recursos.map((r, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ color: p.cor || '#16a34a', flexShrink: 0 }}>✓</span> {r}
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                {(p.gateways || []).map((gw, i) => (
                  <a key={i} href={gw.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: i === 0 ? (p.cor || 'var(--accent)') : 'var(--bg-hover)',
                      color: i === 0 ? '#fff' : 'var(--text-primary)',
                      border: i === 0 ? 'none' : '1px solid var(--border)',
                      borderRadius: 12, padding: '12px 16px', fontWeight: 700, fontSize: 14,
                      textDecoration: 'none', transition: 'opacity .15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                  >
                    💳 Assinar — {gw.nome}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '32px 28px', textAlign: 'center', marginBottom: 32, maxWidth: 400, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Nenhum plano disponível no momento. Entre em contato com o suporte.
          </p>
        </div>
      )}

      {/* Suporte */}
      {waNumero && (
        <a href={`https://wa.me/${waNumero}?text=${encodeURIComponent(waMensagem)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>
          <IconWhatsApp size={16} color="#22c55e" /> Falar com o suporte
        </a>
      )}

      <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginTop: 8, fontWeight: 600 }}>
        Sair da conta
      </button>
    </div>
  )
}

// ── Guard de plano ─────────────────────────────────────────────────────────
function GuardaPlano({ children }) {
  const { auth, logout } = useApp()
  const [saasConfig, setSaasConfig] = useState({})
  const [plano, setPlano] = useState({ carregando: true, ativo: null, fim: null })

  // Busca saas_config e plano do perfil direto do Supabase (sempre atualizado)
  useEffect(() => {
    if (!auth.logado || auth.isAdmin) return
    supabase.from('saas_config').select('config').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data?.config) setSaasConfig(data.config) })
    supabase.from('profiles').select('plano_ativo, plano_fim, pagamento_status').eq('id', auth.userId).maybeSingle()
      .then(({ data }) => {
        setPlano({
          carregando: false,
          ativo: data?.plano_ativo ?? null,
          fim: data?.plano_fim ?? null,
          pagamentoStatus: data?.pagamento_status ?? null,
        })
      })
  }, [auth.logado, auth.isAdmin, auth.userId])

  // Admin sempre passa
  if (auth.isAdmin) return children

  // Aguardando carregar
  if (plano.carregando) return <PageLoader />

  const authPlano = { ...auth, planoAtivo: plano.ativo, planoFim: plano.fim }

  // Pagamento falhou (admin marcou manualmente)
  if (plano.pagamentoStatus === 'falhou') {
    return <TelaPlanoBloqueado motivo="pagamento_falhou" auth={authPlano} onLogout={logout} cfg={saasConfig} />
  }

  // Tem data futura válida → libera
  const temDataValida = plano.fim && new Date(plano.fim + 'T23:59:59') >= new Date()
  if (temDataValida) return children

  // Trial expirado → tela de upgrade com planos
  const foiTrial = plano.ativo === 'trial'
  if (plano.fim && new Date(plano.fim + 'T23:59:59') < new Date() && foiTrial) {
    return <TelaSelecionarPlano auth={authPlano} onLogout={logout} cfg={saasConfig} />
  }

  // Plano pago expirado
  if (plano.fim && new Date(plano.fim + 'T23:59:59') < new Date()) {
    return <TelaPlanoBloqueado motivo="expirado" auth={authPlano} onLogout={logout} cfg={saasConfig} />
  }

  // Sem plano atribuído
  if (!plano.ativo) return <TelaPlanoBloqueado motivo="sem_plano" auth={authPlano} onLogout={logout} cfg={saasConfig} />

  return children
}

export default function App() {
  return (
    <>
      <NotificationManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-confirmado" element={<EmailConfirmado />} />
          <Route path="/trial/:slug" element={<Trial />} />
          <Route path="/presel" element={<Presel />} />
          <Route path="/menu/:slug" element={<MenuPublico />} />
          <Route path="/delivery/:slug" element={<DeliveryPublico />} />
          <Route path="/comanda/:token" element={<ComandaDigital />} />
          <Route path="/cozinha/:token" element={<CozinhaDisplay />} />
          <Route path="/caixa/:token" element={<CaixaDisplay />} />
          <Route path="/telao/:token" element={<TelaoDisplay />} />
          <Route path="/pedidos-display/:token" element={<PedidosDisplay />} />
          <Route path="/motoboy/:token" element={<MotoboiPublico />} />

          {/* App protegido */}
          <Route element={<ProtectedRoute><GuardaPlano><Layout /></GuardaPlano></ProtectedRoute>}>
            <Route path="/painel" element={<VisaoGeral />} />
            <Route path="/mercadorias" element={<Mercadorias />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/mesas" element={<Mesas />} />
            <Route path="/displays" element={<Displays />} />
            <Route path="/integracoes" element={<Integracoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/delivery" element={<DeliveryGerenciar />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
