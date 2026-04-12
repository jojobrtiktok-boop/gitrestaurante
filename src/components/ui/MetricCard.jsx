export default function MetricCard({ titulo, valor, subtitulo, icone: Icone, cor = 'green', destaque = false }) {
  const cores = {
    orange: { icon: '#f04000', badge: 'rgba(240,64,0,0.1)',    badgeBorder: 'rgba(240,64,0,0.25)' },
    green:  { icon: '#16a34a', badge: 'rgba(22,163,74,0.12)',  badgeBorder: 'rgba(22,163,74,0.3)' },
    blue:   { icon: '#3b82f6', badge: 'rgba(59,130,246,0.12)', badgeBorder: 'rgba(59,130,246,0.3)' },
    amber:  { icon: '#f59e0b', badge: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.3)' },
    red:    { icon: '#ef4444', badge: 'rgba(239,68,68,0.12)',  badgeBorder: 'rgba(239,68,68,0.3)' },
    purple: { icon: '#8b5cf6', badge: 'rgba(139,92,246,0.12)', badgeBorder: 'rgba(139,92,246,0.3)' },
    slate:  { icon: '#64748b', badge: 'rgba(100,116,139,0.12)',badgeBorder: 'rgba(100,116,139,0.3)' },
  }
  const c = cores[cor] || cores.green

  return (
    <div
      className="card card-hover"
      style={destaque ? { borderColor: 'var(--border-active)' } : {}}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {titulo}
          </p>
          <p className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{valor}</p>
          {subtitulo && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{subtitulo}</p>
          )}
        </div>
        {Icone && (
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: c.badge, border: `1px solid ${c.badgeBorder}` }}>
            <Icone size={20} style={{ color: c.icon }} />
          </div>
        )}
      </div>
    </div>
  )
}
