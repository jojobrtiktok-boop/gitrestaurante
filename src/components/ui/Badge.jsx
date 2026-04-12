export default function Badge({ children, cor = 'green' }) {
  const cores = {
    orange: { bg: 'rgba(240,64,0,0.1)',     text: '#f04000',  border: 'rgba(240,64,0,0.25)' },
    green:  { bg: 'rgba(22,163,74,0.12)',   text: '#16a34a',  border: 'rgba(22,163,74,0.3)' },
    yellow: { bg: 'rgba(245,158,11,0.12)',  text: '#d97706',  border: 'rgba(245,158,11,0.3)' },
    red:    { bg: 'rgba(239,68,68,0.12)',   text: '#dc2626',  border: 'rgba(239,68,68,0.3)' },
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#2563eb',  border: 'rgba(59,130,246,0.3)' },
    purple: { bg: 'rgba(139,92,246,0.12)',  text: '#7c3aed',  border: 'rgba(139,92,246,0.3)' },
    slate:  { bg: 'rgba(100,116,139,0.1)',  text: '#64748b',  border: 'rgba(100,116,139,0.25)' },
  }
  const c = cores[cor] || cores.green
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {children}
    </span>
  )
}

export function margemCor(margem) {
  if (margem >= 60) return 'green'
  if (margem >= 30) return 'yellow'
  return 'red'
}

export function cmvCor(cmv) {
  if (cmv <= 30) return 'green'
  if (cmv <= 45) return 'yellow'
  return 'red'
}
