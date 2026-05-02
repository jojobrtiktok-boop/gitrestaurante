import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import NotificationManager from './components/NotificationManager.jsx'
import { useApp } from './context/AppContext.jsx'

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

// ── Tela de plano bloqueado ────────────────────────────────────────────────
function TelaPlanoBloqueado({ motivo, auth, onLogout }) {
  const expirado = motivo === 'expirado'
  const dataFim  = auth.planoFim
    ? new Date(auth.planoFim + 'T00:00:00').toLocaleDateString('pt-BR')
    : null

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
        {/* Ícone */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: expirado ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>
          {expirado ? '🔒' : '⏳'}
        </div>

        {/* Título */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {expirado ? 'Plano expirado' : 'Sem plano ativo'}
        </h2>

        {/* Mensagem */}
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {expirado
            ? `Seu plano ${auth.planoAtivo ? `(${auth.planoAtivo})` : ''} venceu${dataFim ? ` em ${dataFim}` : ''}.`
            : 'Sua conta ainda não possui um plano ativo.'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Entre em contato com o suporte para renovar e voltar a usar o sistema.
        </p>

        {/* Botão WhatsApp */}
        <a
          href="https://wa.me/5500000000000?text=Olá, preciso renovar meu plano do Cheffya."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 15,
            padding: '13px 24px', borderRadius: 12, textDecoration: 'none',
            marginBottom: 12, transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          📲 Falar no WhatsApp
        </a>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 12,
            padding: '10px 24px', color: 'var(--text-muted)', fontSize: 13,
            cursor: 'pointer', width: '100%', fontWeight: 600,
          }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}

// ── Guard de plano ─────────────────────────────────────────────────────────
function GuardaPlano({ children }) {
  const { auth, logout } = useApp()

  // Admin sempre passa
  if (auth.isAdmin) return children

  // Aguardando carregar dados do plano do perfil
  if (auth.planoAtivo === undefined) return <PageLoader />

  // Sem plano atribuído
  if (!auth.planoAtivo) return <TelaPlanoBloqueado motivo="sem_plano" auth={auth} onLogout={logout} />

  // Plano expirado
  if (auth.planoFim && new Date(auth.planoFim + 'T23:59:59') < new Date()) {
    return <TelaPlanoBloqueado motivo="expirado" auth={auth} onLogout={logout} />
  }

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
