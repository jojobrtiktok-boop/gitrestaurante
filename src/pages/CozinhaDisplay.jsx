import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ChefHat, Check, Clock, AlertTriangle, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'
import { tocarSom } from '../utils/sons.js'

// ── Helpers ──────────────────────────────────────────────────────────────────
function minutosDecorridos(isoInicio) {
  if (!isoInicio) return 0
  return Math.floor((Date.now() - new Date(isoInicio).getTime()) / 60000)
}
function formatarTempo(minutos) {
  if (minutos < 1) return '< 1min'
  if (minutos < 60) return `${minutos}min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}
// ── Timer vivo ────────────────────────────────────────────────────────────────
function TimerVivo({ isoInicio, limiteAmarelo, limiteVermelho }) {
  const [mins, setMins] = useState(() => minutosDecorridos(isoInicio))
  useEffect(() => {
    const id = setInterval(() => setMins(minutosDecorridos(isoInicio)), 15000)
    return () => clearInterval(id)
  }, [isoInicio])
  const cor = mins < limiteAmarelo ? '#16a34a' : mins < limiteVermelho ? '#f59e0b' : '#ef4444'
  const bg  = mins < limiteAmarelo ? 'rgba(22,163,74,0.12)' : mins < limiteVermelho ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <span style={{ fontSize: 14, fontWeight: 800, color: cor, background: bg, padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Clock size={13} />{formatarTempo(mins)}
    </span>
  )
}

// ── Card de pedido da cozinha ─────────────────────────────────────────────────
function CardCozinha({ pedido, coluna, pratos, garcons, mesas, onAvancar, cfg }) {
  const garcon = garcons.find(g => g.id === pedido.garconId)
  const mesa = mesas?.find(m => m.id === pedido.mesaId)
  const inicioEstagio = pedido.timestamps?.[coluna.id]
  const [mins, setMins] = useState(() => minutosDecorridos(inicioEstagio))

  useEffect(() => {
    const id = setInterval(() => setMins(minutosDecorridos(inicioEstagio)), 15000)
    return () => clearInterval(id)
  }, [inicioEstagio])

  const urgencia = mins >= cfg.limiteVermelhoMin ? 'alta' : mins >= cfg.limiteAmareloMin ? 'media' : 'normal'
  const borderCor = urgencia === 'alta' ? '#ef4444' : urgencia === 'media' ? '#f59e0b' : coluna.cor
  const bgUrgencia = urgencia === 'alta' ? 'rgba(239,68,68,0.05)' : urgencia === 'media' ? 'rgba(245,158,11,0.05)' : '#ffffff'

  return (
    <div style={{
      background: bgUrgencia,
      border: `2px solid ${borderCor}`,
      borderRadius: 16,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.3s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: coluna.cor }}>{pedido.hora}</span>
            {mesa && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: coluna.cor, padding: '2px 10px', borderRadius: 20 }}>
                {mesa.nome}
              </span>
            )}
            <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>
              {garcon ? garcon.nome : 'Caixa'}
            </span>
            {pedido.canal === 'delivery' && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f04000', background: 'rgba(240,64,0,0.1)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(240,64,0,0.3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Truck size={10} />Delivery
              </span>
            )}
          </div>
        </div>
        {inicioEstagio && (
          <TimerVivo isoInicio={inicioEstagio} limiteAmarelo={cfg.limiteAmareloMin} limiteVermelho={cfg.limiteVermelhoMin} />
        )}
      </div>

      {pedido.cancelado && (
        <div style={{ background: '#ef444415', border: '1px solid #ef4444', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', letterSpacing: 2 }}>⛔ CANCELADO</span>
        </div>
      )}

      {/* Itens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pedido.itens?.map(item => {
          const p = pratos.find(x => x.id === item.pratoId)
          if (!p) return null
          return (
            <div key={item.uid || item.pratoId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 24, fontWeight: 900, color: coluna.cor,
                  background: `${coluna.cor}18`, width: 36, height: 36,
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>×{item.quantidade}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.nome}</span>
              </div>
              {item.opcoes?.length > 0 && (
                <div style={{ paddingLeft: 44, marginTop: 3 }}>
                  {item.opcoes.map((o, i) => (
                    <span key={i} style={{ fontSize: 12, color: '#64748b', display: 'block' }}>· {o.nome}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {pedido.canal === 'delivery' && (pedido.clienteNome || pedido.enderecoEntrega) && (
        <div style={{ background: 'rgba(240,64,0,0.06)', border: '1px solid rgba(240,64,0,0.2)', borderRadius: 8, padding: '6px 10px' }}>
          {pedido.clienteNome && <p style={{ fontSize: 13, fontWeight: 700, color: '#f04000', margin: 0 }}>{pedido.clienteNome}</p>}
          {pedido.enderecoEntrega && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', fontStyle: 'italic' }}>{pedido.enderecoEntrega}</p>}
        </div>
      )}
      {pedido.obs && (
        <div style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 10px' }}>
          <p style={{ fontSize: 13, color: '#d97706', margin: 0, fontStyle: 'italic' }}>⚠ {pedido.obs}</p>
        </div>
      )}

      {/* Botão avançar */}
      {coluna.proximoStatus && !pedido.cancelado && (
        <button onClick={() => onAvancar(pedido.id, coluna.proximoStatus)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 12, border: 'none',
            background: coluna.cor, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', marginTop: 4,
          }}>
          {coluna.proximoStatus === 'preparando' ? <ChefHat size={16} /> : <Check size={16} />}
          {coluna.proximoLabel}
        </button>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CozinhaDisplay() {
  const { token } = useParams()
  const { pedidos, pratos, garcons, mesas, kanbanConfig, atualizarStatusPedido, authLoading, displayReady } = useApp()
  const cfg = kanbanConfig

  // Auto-refresh tick
  const [, setTick] = useState(0)
  useEffect(() => {
    const seg = Number(cfg.autoRefreshSeg) || 10
    const id = setInterval(() => setTick(t => t + 1), seg * 1000)
    return () => clearInterval(id)
  }, [cfg.autoRefreshSeg])

  // Som para novos pedidos
  const prevNovosRef = useRef(null)
  useEffect(() => {
    if (!cfg.somAlerta) { prevNovosRef.current = null; return }
    const novosIds = pedidos.filter(p => p.status === 'novo').map(p => p.id).sort().join(',')
    if (prevNovosRef.current === null) { prevNovosRef.current = novosIds; return }
    if (novosIds !== prevNovosRef.current) {
      const prev = prevNovosRef.current.split(',').filter(Boolean)
      const cur  = novosIds.split(',').filter(Boolean)
      if (cur.some(id => !prev.includes(id))) tocarSom(cfg.somAlertaTipo || 'duplo')
      prevNovosRef.current = novosIds
    }
  }, [pedidos, cfg.somAlerta])

  // Aguarda dados
  if (authLoading || !displayReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
        Carregando...
      </div>
    )
  }

  // Token inválido
  if (!cfg.cozinhaToken || token !== cfg.cozinhaToken) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', color: '#0f172a', gap: 16,
      }}>
        <AlertTriangle size={48} color="#ef4444" />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Link inválido</h1>
        <p style={{ fontSize: 16, color: '#64748b', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          Este link de cozinha é inválido ou foi regenerado. Peça ao administrador um novo link.
        </p>
      </div>
    )
  }

  const etapas = cfg.etapas && cfg.etapas.length >= 2 ? cfg.etapas : [
    { id: 'novo',       label: 'Aguardando', cor: '#3b82f6' },
    { id: 'preparando', label: 'Preparando', cor: '#f59e0b' },
    { id: 'completo',   label: 'Entregue',   cor: '#16a34a' },
  ]
  const colunasDef = etapas.map((e, i, arr) => ({
    id: e.id, label: e.label, cor: e.cor,
    bgCor: `${e.cor}15`,
    proximoStatus: arr[i + 1]?.id || null,
    proximoLabel: arr[i + 1] ? `→ ${arr[i + 1].label}` : null,
  })).filter(c => (cfg.colunasVisivelCozinha || etapas.slice(0, -1).map(x => x.id)).includes(c.id))

  const h = hoje()
  const pedidosHoje = pedidos.filter(p => p.data === h)

  const totalNovos = pedidosHoje.filter(p => p.status === 'novo').length
  const totalPrep  = pedidosHoje.filter(p => p.status === 'preparando').length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cfg.cozinhaLogo
            ? <img src={cfg.cozinhaLogo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            : <ChefHat size={22} color="#f59e0b" />
          }
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{cfg.cozinhaTitulo || 'Cozinha'}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {totalNovos > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{totalNovos} novos</span>
            </div>
          )}
          {totalPrep > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{totalPrep} preparando</span>
            </div>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="cozinha-board" style={{ '--colunas': colunasDef.length, minHeight: 'calc(100vh - 58px)' }}>
        {colunasDef.map(col => {
          const cards = pedidosHoje
            .filter(p => p.status === col.id)
            .sort((a, b) => (a.timestamps?.novo || '').localeCompare(b.timestamps?.novo || ''))

          return (
            <div key={col.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Cabeçalho coluna */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '12px 12px 0 0',
                background: col.bgCor, border: `2px solid ${col.cor}44`, borderBottom: 'none',
              }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: col.cor }}>{col.label}</span>
                <span style={{
                  minWidth: 28, height: 28, borderRadius: 20, background: col.cor,
                  color: '#fff', fontWeight: 900, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px',
                }}>{cards.length}</span>
              </div>

              {/* Cards */}
              <div style={{
                flex: 1, padding: 10,
                background: '#f1f5f9',
                border: `2px solid ${col.cor}22`, borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                display: 'flex', flexDirection: 'column', gap: 10,
                overflowY: 'auto', maxHeight: 'calc(100vh - 120px)',
              }}>
                {cards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#cbd5e1', fontSize: 14 }}>
                    Nenhum pedido
                  </div>
                ) : (
                  cards.map(pedido => (
                    <CardCozinha
                      key={pedido.id}
                      pedido={pedido}
                      coluna={col}
                      pratos={pratos}
                      garcons={garcons}
                      mesas={mesas}
                      onAvancar={atualizarStatusPedido}
                      cfg={cfg}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
