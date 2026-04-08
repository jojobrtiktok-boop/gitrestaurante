import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'

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
      .filter(p => p.data === h && p.status === 'completo' && !p.cancelado && !p.pago)
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
  const pedidosHoje = pedidos.filter(p => p.data === h && !p.cancelado && !p.pago)

  const emPreparo = pedidosHoje
    .filter(p => p.status === 'novo' || p.status === 'preparando')
    .sort((a, b) => (a.timestamps?.novo || '').localeCompare(b.timestamps?.novo || ''))

  const prontos = pedidosHoje
    .filter(p => p.status === 'completo')
    .sort((a, b) => (b.timestamps?.completo || '').localeCompare(a.timestamps?.completo || ''))

  function getNomeCliente(pedido) {
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
  const accentColor = cardapioConfig?.corDestaque || '#f59e0b'

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
            : <div style={{ width: 42, height: 42, borderRadius: 12, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>
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

      {/* ── Colunas ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0, gap: 0 }}>

        {/* Esquerda: Em Preparo */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {/* Coluna header */}
          <div style={{
            padding: '20px 36px 16px',
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
              minWidth: 40, height: 40, borderRadius: 12,
              background: emPreparo.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: emPreparo.length > 0 ? '#fbbf24' : '#374151',
            }}>
              {emPreparo.length}
            </div>
          </div>

          {/* Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {emPreparo.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.25, marginTop: 60 }}>
                <span style={{ fontSize: 48 }}>⏳</span>
                <p style={{ color: '#6b7280', fontSize: 15, margin: 0, fontWeight: 600 }}>Nenhum pedido em preparo</p>
              </div>
            ) : (
              emPreparo.map((p, i) => {
                const isPreparando = p.status === 'preparando'
                return (
                  <div key={p.id} style={{
                    background: isPreparando ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isPreparando ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 16, padding: '16px 22px',
                    display: 'flex', alignItems: 'center', gap: 18,
                    animation: 'pd-slide-in 0.35s ease',
                  }}>
                    {/* Número na fila */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: isPreparando ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 900,
                      color: isPreparando ? '#fbbf24' : '#60a5fa',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 3px', fontSize: 24, fontWeight: 900, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                        {getNomeCliente(p)}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                        Pedido #{getNumPedido(p)}
                      </p>
                    </div>

                    <div style={{
                      flexShrink: 0, padding: '5px 13px', borderRadius: 8,
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
          {/* Coluna header */}
          <div style={{
            padding: '20px 36px 16px',
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
              minWidth: 40, height: 40, borderRadius: 12,
              background: prontos.length > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: prontos.length > 0 ? '#4ade80' : '#374151',
            }}>
              {prontos.length}
            </div>
          </div>

          {/* Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prontos.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.2, marginTop: 60 }}>
                <span style={{ fontSize: 48 }}>✅</span>
                <p style={{ color: '#6b7280', fontSize: 15, margin: 0, fontWeight: 600 }}>Nenhum pedido pronto</p>
              </div>
            ) : (
              prontos.map(p => {
                const isNew = flashIds.has(p.id)
                return (
                  <div key={p.id} style={{
                    background: isNew ? 'rgba(74,222,128,0.18)' : 'rgba(74,222,128,0.09)',
                    border: `2px solid ${isNew ? 'rgba(74,222,128,0.7)' : 'rgba(74,222,128,0.25)'}`,
                    borderRadius: 18, padding: '20px 26px',
                    display: 'flex', alignItems: 'center', gap: 20,
                    animation: isNew ? 'pd-pulse 1s ease-in-out infinite, pd-slide-in 0.35s ease' : 'pd-slide-in 0.35s ease',
                    transition: 'all 0.5s ease',
                  }}>
                    {/* Check badge */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                      background: isNew ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, border: '2px solid rgba(74,222,128,0.4)',
                    }}>
                      ✓
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 4px', fontWeight: 900, letterSpacing: '-0.5px',
                        fontSize: 30, color: '#4ade80',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        textShadow: isNew ? '0 0 20px rgba(74,222,128,0.6)' : 'none',
                        animation: isNew ? 'pd-shine 1s ease-in-out infinite' : 'none',
                      }}>
                        {getNomeCliente(p)}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(74,222,128,0.5)', letterSpacing: '0.05em' }}>
                        Pedido #{getNumPedido(p)} · Retire no balcão
                      </p>
                    </div>

                    {isNew && (
                      <div style={{
                        flexShrink: 0, padding: '6px 14px', borderRadius: 10,
                        fontSize: 12, fontWeight: 900,
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

      {/* ── Footer strip ── */}
      <div style={{
        height: 36, flexShrink: 0,
        background: 'rgba(255,255,255,0.025)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pd-dot 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Atualizando automaticamente
        </span>
      </div>
    </div>
  )
}
