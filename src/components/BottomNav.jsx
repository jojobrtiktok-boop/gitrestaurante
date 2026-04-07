import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Kanban as KanbanIcon, LayoutGrid, Settings, Monitor } from 'lucide-react'

const menu = [
  { path: '/',              label: 'Início',    icon: LayoutDashboard },
  { path: '/mesas',         label: 'Mesas',     icon: LayoutGrid },
  { path: '/kanban',        label: 'Fluxo',     icon: KanbanIcon },
  { path: '/configuracoes', label: 'Config',    icon: Settings },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{ background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)' }}
    >
      {menu.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-muted)' })}
        >
          <Icon size={19} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
