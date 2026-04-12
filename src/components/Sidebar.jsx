import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBasket, BookOpen, UtensilsCrossed, ShoppingCart, Kanban as KanbanIcon, Sun, Moon, LogOut, LayoutGrid, Settings, Monitor, ShieldCheck, Receipt, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const menu = [
  { path: '/',              label: 'Relatório',    icon: LayoutDashboard },
  { path: '/despesas',      label: 'Despesas',     icon: Receipt },
  { path: '/mercadorias',   label: 'Mercadorias',  icon: ShoppingBasket },
  { path: '/receitas',      label: 'Receitas',     icon: BookOpen },
  { path: '/cardapio',      label: 'Cardápio',     icon: UtensilsCrossed },
  { path: '/delivery',  label: 'Delivery',     icon: Truck },
  { path: '/mesas',         label: 'Mesas',        icon: LayoutGrid },
  { path: '/vendas',        label: 'Vendas',       icon: ShoppingCart },
  { path: '/kanban',        label: 'Fluxo',        icon: KanbanIcon },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const { tema, alternarTema, auth, logout, perfil } = useApp()
  const navigate = useNavigate()

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <img src={tema === 'dark' ? '/logo-branca.png' : '/logo.png'} alt="Cheffya" style={{ height: 36, objectFit: 'contain' }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {menu.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => isActive ? {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              background: 'var(--bg-active)', color: 'var(--accent)',
              border: '1px solid var(--border-active)',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            } : {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              color: 'var(--text-secondary)', border: '1px solid transparent',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('active')) e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { if (!e.currentTarget.style.color.includes('accent')) e.currentTarget.style.background = 'transparent' }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {auth.isAdmin && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />
            <NavLink
              to="/admin"
              style={({ isActive }) => isActive ? {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
              } : {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                color: '#ef4444', border: '1px solid transparent',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all .15s', opacity: 0.75,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.75' }}
            >
              <ShieldCheck size={17} />
              Admin
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={alternarTema}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          {tema === 'dark'
            ? <><Sun size={15} style={{ color: '#f59e0b' }} /><span>Modo Claro</span></>
            : <><Moon size={15} style={{ color: 'var(--accent)' }} /><span>Modo Escuro</span></>
          }
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: perfil?.foto ? 'transparent' : 'var(--accent)',
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff',
            flexShrink: 0, border: '1.5px solid var(--border)',
          }}>
            {perfil?.foto
              ? <img src={perfil.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (auth.usuario || '?')[0].toUpperCase()
            }
          </div>
          <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {perfil?.nomeExibicao || auth.usuario}
          </span>
          <button onClick={async () => { await logout(); navigate('/login') }} className="btn btn-ghost p-1" title="Sair" style={{ color: '#ef4444' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
