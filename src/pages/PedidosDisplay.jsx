import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'

const SUPABASE_URL = 'https://api.cheffya.com.br'

async function ifoodAction(ifoodOrderId, action, userId) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/ifood-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ifood_order_id: ifoodOrderId, action, user_id: userId }),
    })
  } catch (e) {
    console.warn('ifood-action falhou:', e.message)
  }
}

function IconWpp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const STATUS_DELIVERY = {
  novo:       { label: 'Aguardando',        cor: '#60a5fa', bg: 'rgba(59,130,246,0.15)',   borda: 'rgba(59,130,246,0.3)',   icone: '○' },
  preparando: { label: 'Preparando',         cor: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  borda: 'rgba(245,158,11,0.3)',   icone: '◎' },
  pronto:     { label: 'Pronto',             cor: '#4ade80', bg: 'rgba(74,222,128,0.15)',  borda: 'rgba(74,222,128,0.3)',   icone: '✓' },
  saindo:     { label: 'Saindo p/ entregar', cor: '#fb923c', bg: 'rgba(249,115,22,0.15)',  borda: 'rgba(249,115,22,0.3)',  icone: '→' },
  entregue:   { label: 'Entregue',           cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  borda: 'rgba(148,163,184,0.2)', icone: '✓' },
}

export default function PedidosDisplay() {
  const { token } = useParams()
  const { pedidos, clientes, mesas, kanbanConfig, cardapioConfig, authLoading, displayReady, atualizarStatusPedido, cancelarPedido, auth } = useApp()
  const [hora, setHora] = useState('')
  const [dataStr, setDataStr] = useState('')
  const [flashIds, setFlashIds] = useState(new Set())
  const prontosIdsRef = useRef([])
  const pendentesIdsRef = useRef([])
  const audioCtxRef = useRef(null)

  function tocarAlertaDelivery() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtxRef.current
      // 3 bipes curtos
      const bipes = [0, 0.18, 0.36]
      bipes.forEach(offset => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.15)
      })
    } catch { /* ignore */ }
  }

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

  // Alerta sonoro quando chega delivery pendente novo
  useEffect(() => {
    const h = hoje()
    const pendentesIds = pedidos
      .filter(p => p.data === h && p.canal === 'delivery' && p.status === 'pendente')
      .map(p => p.id)
    const novos = pendentesIds.filter(id => !pendentesIdsRef.current.includes(id))
    if (novos.length > 0) tocarAlertaDelivery()
    pendentesIdsRef.current = pendentesIds
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

  // Delivery pendente — aguardando confirmação do balcão
  const deliveryPendentes = pedidosHoje
    .filter(p => p.canal === 'delivery' && p.status === 'pendente')
    .sort((a, b) => (a.timestamps?.pendente || '').localeCompare(b.timestamps?.pendente || ''))

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

      {/* ── Faixa Pendentes Delivery ── */}
      {deliveryPendentes.length > 0 && (
        <div style={{
          flexShrink: 0,
          background: 'rgba(234,179,8,0.08)',
          borderBottom: '2px solid rgba(234,179,8,0.4)',
          padding: '10px 20px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#eab308', boxShadow: '0 0 8px #eab308',
              animation: 'pd-dot 0.8s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Delivery — Confirmar pedido ({deliveryPendentes.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {deliveryPendentes.map(p => (
              <div key={p.id} style={{
                flexShrink: 0, width: 280,
                background: 'rgba(234,179,8,0.1)',
                border: '1.5px solid rgba(234,179,8,0.4)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
                animation: 'pd-slide-up 0.3s ease',
              }}>
                {/* Nome + pedido */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {p.canal === 'ifood' && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20, background: '#ea1d2c', color: '#fff', letterSpacing: '0.04em', flexShrink: 0 }}>
                        iFood
                      </span>
                    )}
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fef08a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getNomeCliente(p)}
                    </p>
                  </div>
                  {p.ifoodShortId && (
                    <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(234,29,44,0.7)', fontFamily: 'monospace' }}>
                      #{p.ifoodShortId}
                    </p>
                  )}
                  {p.enderecoEntrega && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {p.enderecoEntrega}
                    </p>
                  )}
                  {p.itens?.length > 0 && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Botões */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* WhatsApp */}
                  {p.clienteTelefone && (
                    <a
                      href={`https://wa.me/55${p.clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${getNomeCliente(p)}! Recebemos seu pedido. Em breve confirmaremos.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: '#25d366', color: '#fff', textDecoration: 'none',
                      }}
                    >
                      <IconWpp size={16} />
                    </a>
                  )}
                  {/* Confirmar */}
                  <button
                    onClick={async () => {
                      atualizarStatusPedido(p.id, 'novo')
                      if (p.canal === 'ifood' && p.ifoodOrderId) {
                        await ifoodAction(p.ifoodOrderId, 'confirm', auth.userId)
                      }
                    }}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Confirmar
                  </button>
                  {/* Cancelar */}
                  <button
                    onClick={async () => {
                      cancelarPedido(p.id)
                      if (p.canal === 'ifood' && p.ifoodOrderId) {
                        await ifoodAction(p.ifoodOrderId, 'cancel', auth.userId)
                      }
                    }}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
