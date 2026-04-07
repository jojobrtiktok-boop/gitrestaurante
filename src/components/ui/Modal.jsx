import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ aberto, onFechar, titulo, children, largura = 'max-w-lg' }) {
  useEffect(() => {
    if (!aberto) return
    const onKey = e => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className={`modal-box ${largura} w-full`}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}</h2>
          <button onClick={onFechar} className="btn btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
