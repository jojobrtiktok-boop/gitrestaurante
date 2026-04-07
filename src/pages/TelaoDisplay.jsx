import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { hoje, formatarHora, horaAtual } from '../utils/formatacao.js'

export default function TelaoDisplay() {
  const { token } = useParams()
  const { pedidos, mesas, pratos, kanbanConfig, cardapioConfig } = useApp()
  const cfg = kanbanConfig

  const [, setTick] = useState(0)
  useEffect(() => {
    const seg = Number(cfg.telaoRefreshSeg) || 15
    const id = setInterval(() => setTick(t => t + 1), seg * 1000)
    return () => clearInterval(id)
  }, [cfg.telaoRefreshSeg])

  if (!cfg.telaoToken || token !== cfg.telaoToken) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#f8fafc', gap: 16,
      }}>
        <AlertTriangle size={48} color="#ef4444" />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Link inválido</h1>
        <p style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          Este link é inválido ou foi regenerado. Peça ao administrador um novo link do Telão.
        </p>
      </div>
    )
  }

  const titulo = cfg.telaoTitulo || cardapioConfig?.nomeRestaurante || 'Pedidos'
  const logo = cardapioConfig?.logo || null

  const h = hoje()
  const pedidosAbertos = pedidos
    .filter(p => p.data === h && !p.pago && !p.cancelado)
    .sort((a, b) => (a.timestamps?.novo || '').localeCompare(b.timestamps?.novo || ''))

  const getMesaNome = (pedido) => {
    if (pedido.mesaId) {
      const mesa = mesas.find(m => m.id === pedido.mesaId)
      return mesa ? mesa.nome : null
    }
    return null
  }

  const getItensTexto = (pedido) => {
    if (!pedido.itens || pedido.itens.length === 0) return '—'
    return pedido.itens.map(item => {
      const prato = pratos.find(p => p.id === item.pratoId)
      const nome = prato ? prato.nome : item.nome || '?'
      return item.quantidade > 1 ? `${item.quantidade}× ${nome}` : nome
    }).join('  ·  ')
  }

  const getStatusLabel = (pedido) => {
    const etapas = cfg.etapas && cfg.etapas.length >= 2 ? cfg.etapas : [
      { id: 'novo', label: 'Aguardando' },
      { id: 'preparando', label: 'Preparando' },
      { id: 'completo', label: 'Pronto' },
    ]
    const etapa = etapas.find(e => e.id === pedido.status)
    return etapa ? etapa.label : pedido.status
  }

  const getStatusCor = (pedido) => {
    const etapas = cfg.etapas && cfg.etapas.length >= 2 ? cfg.etapas : [
      { id: 'novo', cor: '#3b82f6' },
      { id: 'preparando', cor: '#f59e0b' },
      { id: 'completo', cor: '#16a34a' },
    ]
    const etapa = etapas.find(e => e.id === pedido.status)
    return etapa?.cor || '#94a3b8'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '28px 40px 24px',
        borderBottom: '2px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
      }}>
        {logo && (
          <img src={logo} alt="logo" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{titulo}</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            {pedidosAbertos.length === 0
              ? 'Nenhum pedido em aberto'
              : `${pedidosAbertos.length} pedido${pedidosAbertos.length !== 1 ? 's' : ''} em aberto`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 40px' }}>
        {pedidosAbertos.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            gap: 16,
          }}>
            <span style={{ fontSize: 64 }}>🍽️</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#475569', margin: 0 }}>Sem pedidos em aberto</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 20,
          }}>
            {pedidosAbertos.map((pedido, idx) => {
              const mesaNome = getMesaNome(pedido)
              const itensTexto = getItensTexto(pedido)
              const statusLabel = getStatusLabel(pedido)
              const statusCor = getStatusCor(pedido)
              const horario = formatarHora(pedido.timestamps?.novo || pedido.hora)

              return (
                <div
                  key={pedido.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${statusCor}40`,
                    borderRadius: 20,
                    padding: '22px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  {/* Top row: number + mesa + horario */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${statusCor}20`,
                        border: `2px solid ${statusCor}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 18,
                        color: statusCor,
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 20, lineHeight: 1.2, color: '#f8fafc' }}>
                          {mesaNome || pedido.garconNome || 'Pedido'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{horario}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: `${statusCor}20`,
                      color: statusCor,
                      border: `1px solid ${statusCor}40`,
                      whiteSpace: 'nowrap',
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}>
                    {pedido.itens?.length > 0 ? pedido.itens.map((item, i) => {
                      const prato = pratos.find(p => p.id === item.pratoId)
                      const nome = prato ? prato.nome : item.nome || '?'
                      return (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: i > 0 ? '6px 0 0' : 0,
                          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}>
                          <span style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#94a3b8',
                            flexShrink: 0,
                          }}>
                            {item.quantidade}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{nome}</span>
                          {item.obs && (
                            <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                              {item.obs}
                            </span>
                          )}
                        </div>
                      )
                    }) : (
                      <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>{itensTexto}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 12,
        color: '#334155',
      }}>
        Atualizado às {horaAtual()} · Refresh a cada {cfg.telaoRefreshSeg || 15}s
      </div>
    </div>
  )
}
