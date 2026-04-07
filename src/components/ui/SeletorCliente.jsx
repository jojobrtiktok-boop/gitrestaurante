import { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function SeletorCliente({ clienteId, onChange, placeholder = 'Cliente (opcional)' }) {
  const { clientes, adicionarCliente } = useApp()
  const [criando, setCriando] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  function criarCliente() {
    if (!novoNome.trim()) return
    const novo = adicionarCliente(novoNome.trim())
    onChange(novo.id)
    setNovoNome('')
    setCriando(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          className="input flex-1 text-sm"
          value={clienteId || ''}
          onChange={e => onChange(e.target.value || null)}
        >
          <option value="">{placeholder}</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setCriando(v => !v); setNovoNome('') }}
          className="btn btn-secondary"
          style={{ padding: '0 10px', fontSize: 12, gap: 4, whiteSpace: 'nowrap' }}
          title="Novo cliente"
        >
          {criando ? <X size={13} /> : <><Plus size={13} /> Novo</>}
        </button>
      </div>
      {criando && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="input flex-1 text-sm"
            autoFocus
            placeholder="Nome do cliente"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && criarCliente()}
          />
          <button
            type="button"
            onClick={criarCliente}
            disabled={!novoNome.trim()}
            className="btn btn-primary"
            style={{ padding: '0 12px' }}
          >
            <Check size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
