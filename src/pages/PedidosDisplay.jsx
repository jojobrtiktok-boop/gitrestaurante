import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'

const STATUS_DELIVERY = {
  novo:       { label: 'Aguardando',        cor: '#60a5fa', bg: 'rgba(59,130,246,0.15)',   borda: 'rgba(59,130,246,0.3)',   icone: '○' },
  preparando: { label: 'Preparando',         cor: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  borda: 'rgba(245,158,11,0.3)',   icone: '◎' },
  pronto:     { label: 'Pronto',             cor: '#4ade80', bg: 'rgba(74,222,128,0.15)',  borda: 'rgba(74,222,128,0.3)',   icone: '✓' },
  saindo:     { label: 'Saindo p/ entregar', cor: '#c084fc', bg: 'rgba(192,132,252,0.15)', borda: 'rgba(192,132,252,0.3)', icone: '→' },
  entregue:   { label: 'Entregue',           cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  borda: 'rgba(148,163,184,0.2)', icone: '✓' },
}

export default function PedidosDisplay() {
  const { token } = useParams()
  const { pedidos, clientes, mesas, kanbanConfig, cardapioConfig, authLoading, displayReady } = useApp()
  const [hora, setHora] = useState('')
  const [dataStr, setDataStr] = useState('')
  const [flashIds, setFlashIds] = useState(new Set())
  const prontosIdsRef = useRef([])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setHora(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setDataStr(now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }))
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const h = hoje()
    const novosIds = pedidos
      .filter(p => p.data === h && p.status === 'completo' && !p.cancelado && !p.pago && p.canal !== 'delivery')
      .map(p => p.id)
    const chegaram = novosIds.filter(id => !prontosIdsRef.current.includes(id))
    if (chegaram.length > 0) {
      setFlashIds(prev => { const next = new Set(prev); chegaram.forEach(id => next.add(id)); return next })
      setTimeout(() => setFlashIds(prev => { const next = new Set(prev); chegaram.forEach(id => next.delete(id)); return next }), 4000)
    }
    prontosIdsRef.current = novosIds
  }, [pedidos])

  if (authLoading || !displayReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 18 }}>
        Carregando...
      </div>
    )
  }

  if (!kanbanConfig.pedidosDisplayToken || token !== kanbanConfig.pedidosDisplayToken) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'system-ui, sans-serif', gap: 12 }}>
        <span style={{ fontSize: 48, opacity: 0.3 }}>📺</span>
        <p style={{ color: '#6b7280', fontSize: 18, margin: 0 }}>Link inválido ou expirado.</p>
      </div>
    )
  }

  const h = hoje()
  const pedidosHoje = pedidos.filter(p => p.data === h && !p.cancelado)

  // Local: exclui delivery
  const locaisAtivos = pedidosHoje.filter(p => p.canal !== 'delivery' && !p.pago)
  const emPreparo = locaisAtivos
    .filter(p => p.status === 'novo' || p.status === 'preparando')
    .sort((a, b) => (a.timestamps?.novo || '').localeCompare(b.timestamps?.novo || ''))
  const prontos = locaisAtivos
    .filter(p => p.status === 'completo')
    .sort((a, b) => (b.timestamps?.completo || '').localeCompare(a.timestamps?.completo || ''))

  // Delivery: todos exceto entregues pagos antigos (mostra entregue por uns minutos)
  const deliveryAtivos = pedidosHoje
    .filter(p => p.canal === 'delivery' && p.status !== 'entregue')
    .sort((a, b) => (a.timestamps?.novo || '').localeCompare(b.timestamps?.novo || ''))

  const deliveryEntregues = pedidosHoje
    .filter(p => p.canal === 'delivery' && p.status === 'entregue')
    .sort((a, b) => (b.timestamps?.entregue || b.timestamps?.completo || '').localeCompare(a.timestamps?.entregue || a.timestamps?.completo || ''))
    .slice(0, 5) // só os 5 últimos entregues

  const deliveryTodos = [...deliveryAtivos, ...deliveryEntregues]

  function getNomeCliente(pedido) {
    if (pedido.clienteNome) return pedido.clienteNome
    if (pedido.clienteId) {
      const c = clientes.find(x => x.id === pedido.clienteId)
      if (c?.nome) return c.nome
    }
    if (pedido.mesaId) {
      const m = mesas.find(x => x.id === pedido.mesaId)
      if (m?.nomeCliente) return m.nomeCliente
      if (m?.nome) return m.nome
    }
    return `#${pedido.id.slice(-4).toUpperCase()}`
  }

  function getNumPedido(p) { return p.id.slice(-4).toUpperCase() }

  const logo = cardapioConfig?.logo
  const nomeRestaurante = cardapioConfig?.nomeRestaurante || 'Pedidos'

  const temDelivery = deliveryTodos.length > 0

  return (
    <div style={{
      minHeight: '100vh', height: '100vh',
      background: 'linear-gradient(160deg, #09090f 0%, #0f0d16 60%, #0a0f12 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      <style>{`
        @keyframes pd-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6), 0 0 40px 10px rgba(74,222,128,0.15); }
          50%  { box-shadow: 0 0 0 18px rgba(74,222,128,0), 0 0 60px 20px rgba(74,222,128,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0), 0 0 40px 10px rgba(74,222,128,0.15); }
        }
        @keyframes pd-shine {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.85; transform: scale(1.012); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pd-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes pd-slide-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pd-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pd-moto {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(4px); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 40px',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {logo
            ? <img src={logo} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
            : <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>
          }
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', color: '#f1f5f9' }}>{nomeRestaurante}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Painel de Pedidos</p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', color: '#f1f5f9', lineHeight: 1.1 }}>{hora}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{dataStr}</p>
        </div>
      </div>

      {/* ── Colunas locais ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0, gap: 0 }}>

        {/* Esquerda: Em Preparo */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            padding: '16px 36px 12px',
            background: 'rgba(245,158,11,0.06)',
            borderBottom: '2px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: '#f59e0b', boxShadow: '0 0 10px #f59e0b',
              animation: 'pd-dot 1.4s ease-in-out infinite',
            }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.18em', textTransform: 'uppercase', flex: 1 }}>
              Em Preparo
            </h2>
            <div style={{
              minWidth: 36, height: 36, borderRadius: 10,
              background: emPreparo.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: emPreparo.length > 0 ? '#fbbf24' : '#374151',
            }}>
              {emPreparo.length}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {emPreparo.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.25, marginTop: 40 }}>
                <span style={{ fontSize: 40 }}>⏳</span>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0, fontWeight: 600 }}>Nenhum pedido em preparo</p>
              </div>
            ) : (
              emPreparo.map((p, i) => {
                const isPreparando = p.status === 'preparando'
                return (
                  <div key={p.id} style={{
                    background: isPreparando ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isPreparando ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    animation: 'pd-slide-in 0.35s ease',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: isPreparando ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 900,
                      color: isPreparando ? '#fbbf24' : '#60a5fa',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 900, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                        {getNomeCliente(p)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                        Pedido #{getNumPedido(p)}
                      </p>
                    </div>

                    <div style={{
                      flexShrink: 0, padding: '4px 11px', borderRadius: 7,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                      background: isPreparando ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)',
                      color: isPreparando ? '#fbbf24' : '#93c5fd',
                      border: `1px solid ${isPreparando ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.2)'}`,
                    }}>
                      {isPreparando ? '🔥 Preparando' : '🆕 Aguardando'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Direita: Pronto para Retirar */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: prontos.length > 0 ? 'rgba(22,163,74,0.03)' : undefined }}>
          <div style={{
            padding: '16px 36px 12px',
            background: 'rgba(74,222,128,0.07)',
            borderBottom: '2px solid rgba(74,222,128,0.25)',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: '#4ade80', boxShadow: '0 0 12px #4ade80',
              animation: prontos.length > 0 ? 'pd-dot 1s ease-in-out infinite' : 'none',
            }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#4ade80', letterSpacing: '0.18em', textTransform: 'uppercase', flex: 1 }}>
              ✓ Pronto — Retirar
            </h2>
            <div style={{
              minWidth: 36, height: 36, borderRadius: 10,
              background: prontos.length > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: prontos.length > 0 ? '#4ade80' : '#374151',
            }}>
              {prontos.length}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prontos.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.2, marginTop: 40 }}>
                <span style={{ fontSize: 40 }}>✅</span>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0, fontWeight: 600 }}>Nenhum pedido pronto</p>
              </div>
            ) : (
              prontos.map(p => {
                const isNew = flashIds.has(p.id)
                return (
                  <div key={p.id} style={{
                    background: isNew ? 'rgba(74,222,128,0.18)' : 'rgba(74,222,128,0.09)',
                    border: `2px solid ${isNew ? 'rgba(74,222,128,0.7)' : 'rgba(74,222,128,0.25)'}`,
                    borderRadius: 16, padding: '18px 22px',
                    display: 'flex', alignItems: 'center', gap: 18,
                    animation: isNew ? 'pd-pulse 1s ease-in-out infinite, pd-slide-in 0.35s ease' : 'pd-slide-in 0.35s ease',
                    transition: 'all 0.5s ease',
                  }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                      background: isNew ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, border: '2px solid rgba(74,222,128,0.4)',
                    }}>
                      ✓
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 3px', fontWeight: 900, letterSpacing: '-0.5px',
                        fontSize: 26, color: '#4ade80',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        textShadow: isNew ? '0 0 20px rgba(74,222,128,0.6)' : 'none',
                        animation: isNew ? 'pd-shine 1s ease-in-out infinite' : 'none',
                      }}>
                        {getNomeCliente(p)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(74,222,128,0.5)', letterSpacing: '0.05em' }}>
                        Pedido #{getNumPedido(p)} · Retire no balcão
                      </p>
                    </div>

                    {isNew && (
                      <div style={{
                        flexShrink: 0, padding: '5px 12px', borderRadius: 8,
                        fontSize: 11, fontWeight: 900,
                        background: '#4ade80', color: '#052e16',
                        letterSpacing: '0.04em',
                      }}>
                        NOVO
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Faixa Delivery ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '2px solid rgba(240,100,0,0.3)',
        background: 'rgba(240,100,0,0.04)',
        display: 'flex', flexDirection: 'column',
        maxHeight: temDelivery ? 220 : 52,
        transition: 'max-height 0.4s ease',
        overflow: 'hidden',
      }}>
        {/* Header da faixa */}
        <div style={{
          padding: '10px 28px',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          borderBottom: temDelivery ? '1px solid rgba(240,100,0,0.15)' : 'none',
        }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: '#f97316', boxShadow: '0 0 8px #f97316',
            animation: temDelivery ? 'pd-dot 1.2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fb923c', letterSpacing: '0.18em', textTransform: 'uppercase', flex: 1 }}>
            🛵 Delivery
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: temDelivery ? '#fb923c' : '#374151',
            background: temDelivery ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
            padding: '3px 10px', borderRadius: 6,
            border: `1px solid ${temDelivery ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}`,
          }}>
            {deliveryTodos.length} {deliveryTodos.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {/* Cards delivery em linha horizontal */}
        {temDelivery && (
          <div style={{
            flex: 1,
            overflowX: 'auto', overflowY: 'hidden',
            display: 'flex', alignItems: 'stretch', gap: 10,
            padding: '12px 20px',
          }}>
            {deliveryTodos.map(p => {
              const st = STATUS_DELIVERY[p.status] || STATUS_DELIVERY.novo
              const isEntregue = p.status === 'entregue'
              return (
                <div key={p.id} style={{
                  flexShrink: 0,
                  width: 210,
                  background: st.bg,
                  border: `1.5px solid ${st.borda}`,
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  opacity: isEntregue ? 0.5 : 1,
                  animation: 'pd-slide-up 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                      color: st.cor, display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{
                        display: 'inline-block',
                        animation: p.status === 'saindo' ? 'pd-moto 0.7s ease-in-out infinite' : 'none',
                      }}>{st.icone}</span>
                      {st.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                      #{getNumPedido(p)}
                    </span>
                  </div>

                  {/* Nome cliente */}
                  <p style={{
                    margin: 0, fontSize: 16, fontWeight: 900,
                    color: isEntregue ? 'rgba(255,255,255,0.4)' : '#f1f5f9',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    letterSpacing: '-0.3px',
                  }}>
                    {getNomeCliente(p)}
                  </p>

                  {/* Endereço */}
                  {p.enderecoEntrega && (
                    <p style={{
                      margin: 0, fontSize: 11,
                      color: isEntregue ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                    }}>
                      📍 {p.enderecoEntrega}
                    </p>
                  )}

                  {/* Linha de progresso no rodapé */}
                  <div style={{ marginTop: 'auto', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: st.cor,
                      width: p.status === 'novo' ? '20%' : p.status === 'preparando' ? '40%' : p.status === 'pronto' ? '60%' : p.status === 'saindo' ? '80%' : '100%',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer strip ── */}
      <div style={{
        height: 34, flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pd-dot 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Atualizando automaticamente
        </span>
      </div>
    </div>
  )
}
