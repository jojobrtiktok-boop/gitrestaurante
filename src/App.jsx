import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import LandingPage from './pages/LandingPage.jsx'
import VisaoGeral from './pages/VisaoGeral.jsx'
import Mercadorias from './pages/Ingredientes.jsx'
import Receitas from './pages/FichaTecnica.jsx'
import Cardapio from './pages/Cardapio.jsx'
import Vendas from './pages/Vendas.jsx'
import Kanban from './pages/Kanban.jsx'
import PDV from './pages/PDV.jsx'
import Mesas from './pages/Mesas.jsx'
import MenuPublico from './pages/MenuPublico.jsx'
import DeliveryPublico from './pages/DeliveryPublico.jsx'
import MotoboiPublico from './pages/MotoboiPublico.jsx'
import DeliveryGerenciar from './pages/DeliveryGerenciar.jsx'
import ComandaDigital from './pages/ComandaDigital.jsx'
import CozinhaDisplay from './pages/CozinhaDisplay.jsx'
import CaixaDisplay from './pages/CaixaDisplay.jsx'
import TelaoDisplay from './pages/TelaoDisplay.jsx'
import PedidosDisplay from './pages/PedidosDisplay.jsx'
import Configuracoes from './pages/Configuracoes.jsx'
import Displays from './pages/Displays.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Despesas from './pages/Despesas.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import EmailConfirmado from './pages/EmailConfirmado.jsx'
import NotificationManager from './components/NotificationManager.jsx'
import { useApp } from './context/AppContext.jsx'

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
    </>
  )
}
