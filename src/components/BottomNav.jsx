import { NavLink } from 'react-router-dom'
import { BarChart2, Package, LayoutGrid, TrendingUp, Columns2, Settings } from 'lucide-react'

const menu = [
  { path: '/painel',        label: 'Relatório',    icon: BarChart2 },
  { path: '/mercadorias',   label: 'Mercadorias',  icon: Package },
  { path: '/mesas',         label: 'Mesas',        icon: LayoutGrid },
  { path: '/vendas',        label: 'Vendas',       icon: TrendingUp },
  { path: '/kanban',        label: 'Fluxo',        icon: Columns2 },
  { path: '/configuracoes', label: 'Config',       icon: Settings },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border)',
        height: 58,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {menu.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-muted)' })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 24, height: 2, borderRadius: 2,
                  background: 'var(--accent)',
                }} />
              )}
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
