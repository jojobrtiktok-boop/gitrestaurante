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
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/painel" element={<VisaoGeral />} />
            <Route path="/mercadorias" element={<Mercadorias />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/cardapio" element={<Cardapio />} />
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
