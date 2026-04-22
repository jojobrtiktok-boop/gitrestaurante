import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart2, Banknote, Package, ChefHat, UtensilsCrossed,
  Smartphone, TrendingUp, Columns2, Settings,
  Sun, Moon, LogOut, ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

function IconWhatsApp({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.46 17.5 2 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.41 1.56 1.56 2.42 3.62 2.42 5.83 0 4.55-3.7 8.24-8.25 8.24-1.47 0-2.93-.4-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31A8.22 8.22 0 013.8 11.9c.01-4.55 3.71-8.24 8.24-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1.01 2.56.13.17 1.75 2.67 4.24 3.73.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.28-.25-.13-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.15.17-.29.19-.54.07-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.3-.01-.46-.01z" />
    </svg>
  )
}

function IconMesa({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* mesa (vista de cima) */}
      <rect x="5" y="6" width="14" height="12" rx="1.5" />
      {/* cadeira cima */}
      <rect x="9" y="2" width="6" height="3" rx="1.5" />
      {/* cadeira baixo */}
      <rect x="9" y="19" width="6" height="3" rx="1.5" />
      {/* cadeira esquerda */}
      <rect x="2" y="9" width="3" height="6" rx="1.5" />
      {/* cadeira direita */}
      <rect x="19" y="9" width="3" height="6" rx="1.5" />
    </svg>
  )
}

const menu = [
  { path: '/painel',        label: 'Relatório',     icon: BarChart2 },
  { path: '/despesas',      label: 'Despesas',      icon: Banknote },
  { path: '/mercadorias',   label: 'Mercadorias',   icon: Package },
  { path: '/receitas',      label: 'Receitas',      icon: ChefHat },
  { path: '/cardapio',      label: 'Cardápio',      icon: UtensilsCrossed },
  { path: '/delivery',      label: 'Delivery',      icon: Smartphone },
  { path: '/mesas',         label: 'Mesas',         icon: IconMesa },
  { path: '/whatsapp',      label: 'WhatsApp',      icon: IconWhatsApp },
  { path: '/vendas',        label: 'Vendas',        icon: TrendingUp },
  { path: '/kanban',        label: 'Fluxo',         icon: Columns2 },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

function NavItem({ path, label, Icon, danger = false }) {
  const accentColor = danger ? '#ef4444' : 'var(--accent)'
  const accentBg    = danger ? 'rgba(239,68,68,0.1)' : 'var(--accent-bg)'

  return (
    <NavLink
      to={path}
      end={path === '/painel'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 10,
        textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
        transition: 'all .15s',
        color: isActive ? 'var(--text-primary)' : danger ? accentColor : 'var(--text-secondary)',
        background: isActive ? accentBg : 'transparent',
        opacity: danger && !isActive ? 0.75 : 1,
      })}
      onMouseEnter={e => {
        const link = e.currentTarget
        if (!link.style.background || link.style.background === 'transparent') {
          link.style.background = danger ? 'rgba(239,68,68,0.07)' : 'var(--bg-hover)'
          if (danger) link.style.opacity = '1'
        }
      }}
      onMouseLeave={e => {
        const link = e.currentTarget
        if (link.getAttribute('aria-current') !== 'page') {
          link.style.background = 'transparent'
          if (danger) link.style.opacity = '0.75'
        }
      }}
    >
      {({ isActive }) => (
        <>
          <span style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? accentColor : 'var(--bg-hover)',
            transition: 'background .15s',
          }}>
            <Icon size={15} color={isActive ? '#fff' : danger ? accentColor : 'var(--text-secondary)'} />
          </span>
          <span style={{ lineHeight: 1.2 }}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { tema, alternarTema, auth, logout, perfil } = useApp()
  const navigate = useNavigate()

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0"
      style={{ height: '100dvh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', position: 'sticky', top: 0, flexShrink: 0 }}
    >
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
        <img
          src={tema === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="Cheffya"
          style={{ height: 30, objectFit: 'contain' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {menu.map(({ path, label, icon: Icon }) => (
          <NavItem key={path} path={path} label={label} Icon={Icon} />
        ))}

        {auth.isAdmin && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />
            <NavItem path="/admin" label="Admin" Icon={ShieldCheck} danger />
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Tema */}
        <button
          onClick={alternarTema}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 500,
            transition: 'all .15s',
          }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border)' }}>
            {tema === 'dark'
              ? <Sun size={15} style={{ color: '#f59e0b' }} />
              : <Moon size={15} style={{ color: 'var(--accent)' }} />}
          </span>
          {tema === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>

        {/* Usuário */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: perfil?.foto ? 'transparent' : 'var(--accent)',
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
            border: '1.5px solid var(--border)',
          }}>
            {perfil?.foto
              ? <img src={perfil.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (auth.usuario || '?')[0].toUpperCase()}
          </div>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {perfil?.nomeExibicao || auth.usuario}
          </span>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            title="Sair"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#ef4444', opacity: 0.7, transition: 'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
