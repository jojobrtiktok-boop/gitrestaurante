import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart2, Banknote, Package, ChefHat, UtensilsCrossed,
  Smartphone, TrendingUp, Columns2, Settings,
  Sun, Moon, LogOut, ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

function IconWhatsApp({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.82.49 3.53 1.35 5L2 22l5.15-1.32A9.97 9.97 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      <path d="M9 9c0-.55.45-1 1-1h.5c.28 0 .5.22.5.5v.5c0 .83.34 1.58.88 2.12l.12.12c.54.54 1.29.88 2.12.88h.38c.28 0 .5.22.5.5V13c0 .55-.45 1-1 1-.83 0-1.63-.17-2.36-.48a7.03 7.03 0 01-2.16-1.5A7.03 7.03 0 017.98 9.86 5.97 5.97 0 017.5 7.5C7.5 6.95 7.95 6.5 8.5 6.5h.5" />
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
