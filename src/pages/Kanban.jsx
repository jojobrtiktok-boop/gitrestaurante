import { useState, useEffect, useRef } from 'react'
import { Clock, Check, ChefHat, Volume2, Settings, Plus, Trash2, Copy, ExternalLink, RefreshCw, Link2, Truck, Printer, Usb, Bluetooth } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'
import { buildComanda, conectarUSB, imprimirUSB, conectarSerial, imprimirSerial, suportaUSB, suportaSerial, usbConectado, serialConectado } from '../utils/escpos.js'

function IconMotoqueiro({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* cabeça */}
      <circle cx="15" cy="5" r="1.8" />
      {/* corpo inclinado para frente */}
      <path d="M15 6.8 L13 10 L10 10.5" />
      {/* braço no guidão */}
      <path d="M13.5 8.5 L11.5 7.5" />
      {/* guidão */}
      <path d="M11.5 7.5 L9.5 8" />
      {/* corpo da moto */}
      <path d="M7 14 Q9 10 13 10 L16 11 L18 14" />
      {/* roda traseira */}
      <circle cx="7" cy="16" r="2.5" />
      {/* roda dianteira */}
      <circle cx="18" cy="16" r="2.5" />
      {/* eixo */}
      <line x1="9.5" y1="14" x2="15.5" y2="14" />
    </svg>
  )
}

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
function inicioSemana() {
  const d = new Date(); const dia = d.getDay()
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function inicioMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function tocarBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2); gain2.connect(ctx.destination)
      osc2.frequency.value = 1100
      gain2.gain.setValueAtTime(0.25, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc2.start(); osc2.stop(ctx.currentTime + 0.3)
    }, 350)
  } catch {}
}

// ── Timer vivo ────────────────────────────────────────────────────────────────
function TimerVivo({ isoInicio, limiteAmarelo, limiteVermelho }) {
  const [mins, setMins] = useState(() => minutosDecorridos(isoInicio))
  useEffect(() => {
    const id = setInterval(() => setMins(minutosDecorridos(isoInicio)), 15000)
    return () => clearInterval(id)
  }, [isoInicio])
  const cor = mins < limiteAmarelo ? '#16a34a' : mins < limiteVermelho ? '#f59e0b' : '#ef4444'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cor, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Clock size={11} />{formatarTempo(mins)}
    </span>
  )
}

// ── Card de Pedido ────────────────────────────────────────────────────────────
function CardPedido({ pedido, coluna, pratos, garcons, mesas, onAvancar, cfg }) {
  const garcon = garcons.find(g => g.id === pedido.garconId)
  const mesa = mesas?.find(m => m.id === pedido.mesaId)
  const total = pedido.itens?.reduce((s, i) => {
    const p = pratos.find(x => x.id === i.pratoId)
    if (!p) return s
    const extras = (i.opcoes || []).reduce((ss, o) => ss + o.precoExtra, 0)
    return s + (p.precoVenda + extras) * i.quantidade
  }, 0) || 0

  const inicioEstagio = pedido.timestamps?.[coluna.id]
  const ts = pedido.timestamps || {}
  const tempoNovo    = ts.novo && ts.preparando ? Math.floor((new Date(ts.preparando) - new Date(ts.novo)) / 60000) : null
  const tempoPreparo = ts.preparando && ts.completo ? Math.floor((new Date(ts.completo) - new Date(ts.preparando)) / 60000) : null
  const tempoTotal   = ts.novo && ts.completo ? Math.floor((new Date(ts.completo) - new Date(ts.novo)) / 60000) : null

  const compact = cfg.modoCompacto
  const pad = compact ? '8px 10px' : '12px 14px'
  const gap = compact ? 5 : 8

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${coluna.cor}`, borderRadius: 14, padding: pad,
      display: 'flex', flexDirection: 'column', gap,
    }}>
      {/* Hora + garçon + timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: coluna.cor }}>{pedido.hora}</span>
          {cfg.mostrarGarcom !== false && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 7px', borderRadius: 20 }}>
              {garcon ? garcon.nome : 'Caixa'}
            </span>
          )}
          {cfg.mostrarMesa !== false && mesa && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '1px 7px', borderRadius: 20, border: '1px solid var(--border-active)' }}>
              {mesa.nome}
            </span>
          )}
          {pedido.canal === 'delivery' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f04000', background: 'rgba(240,64,0,0.12)', padding: '1px 7px', borderRadius: 20, border: '1px solid rgba(240,64,0,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Truck size={9} />Delivery
            </span>
          )}
        </div>
        {coluna.proximoStatus !== null && inicioEstagio
          ? <TimerVivo isoInicio={inicioEstagio} limiteAmarelo={cfg.limiteAmareloMin || 10} limiteVermelho={cfg.limiteVermelhoMin || 20} />
          : tempoTotal !== null
            ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ {formatarTempo(tempoTotal)}</span>
            : null
        }
      </div>

      {/* Itens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3 }}>
        {pedido.itens?.map(item => {
          const p = pratos.find(x => x.id === item.pratoId)
          if (!p) return null
          const extras = (item.opcoes || []).reduce((s, o) => s + o.precoExtra, 0)
          return (
            <div key={item.uid || item.pratoId} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: compact ? 12 : 13, color: 'var(--text-primary)', fontWeight: 500 }}>×{item.quantidade} {p.nome}</span>
                {cfg.mostrarPrecos !== false && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {((p.precoVenda + extras) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
              {!compact && item.opcoes?.length > 0 && (
                <div style={{ paddingLeft: 12 }}>
                  {item.opcoes.map((o, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                      · {o.nome}{o.precoExtra > 0 ? ` +${o.precoExtra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {cfg.mostrarObs !== false && pedido.obs && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>"{pedido.obs}"</p>
      )}

      {/* Timeline completo */}
      {!compact && !coluna.proximoStatus && (tempoNovo !== null || tempoPreparo !== null) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tempoNovo !== null && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontWeight: 700 }}>
              Aguardou {formatarTempo(tempoNovo)}
            </span>
          )}
          {tempoPreparo !== null && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#d97706', fontWeight: 700 }}>
              Preparou {formatarTempo(tempoPreparo)}
            </span>
          )}
        </div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: compact ? 5 : 8, gap: 6 }}>
        {cfg.mostrarPrecos !== false
          ? <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          : <span />
        }
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {cfg.escposAtivo && (
            <button
              title="Imprimir comanda (ESC/POS)"
              onClick={async () => {
                const dados = buildComanda(pedido, pratos, cfg.nomeRestaurante || 'Restaurante')
                const modo = cfg.escposModo || 'usb'
                const r = modo === 'usb' ? await imprimirUSB(dados) : await imprimirSerial(dados)
                if (!r.ok) alert(`Impressão falhou: ${r.erro}\nConecte a impressora em Configurações → Impressora`)
              }}
              style={{ display: 'flex', alignItems: 'center', padding: compact ? '3px 7px' : '4px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 11, gap: 4, cursor: 'pointer' }}>
              <Printer size={11} />
            </button>
          )}
          {coluna.proximoStatus && (
            <button onClick={() => onAvancar(pedido.id, coluna.proximoStatus)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: compact ? '4px 10px' : '5px 12px', borderRadius: 8, border: 'none', background: coluna.cor, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {coluna.proximoStatus === 'preparando' ? <ChefHat size={12} /> : <Check size={12} />}
              {coluna.proximoLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Default etapas ──────────────────────────────────────────────────────────
const DEFAULT_ETAPAS = [
  { id: 'novo',       label: 'Aguardando',         cor: '#3b82f6' },
  { id: 'preparando', label: 'Preparando',          cor: '#f59e0b' },
  { id: 'pronto',     label: 'Pronto para Entrega', cor: '#22c55e' },
  { id: 'completo',   label: 'Entregue',            cor: '#16a34a' },
]

// ── Colunas fixas do fluxo delivery ─────────────────────────────────────────
const DELIVERY_COLUNAS = [
  { id: 'novo',       label: 'Aguardando',          cor: '#3b82f6', bgCor: '#3b82f61a', proximoStatus: 'preparando', proximoLabel: '→ Preparando' },
  { id: 'preparando', label: 'Preparando',           cor: '#f59e0b', bgCor: '#f59e0b1a', proximoStatus: 'pronto',     proximoLabel: '→ Pronto' },
  { id: 'pronto',     label: 'Pronto p/ Entregar',   cor: '#22c55e', bgCor: '#22c55e1a', proximoStatus: 'saindo',     proximoLabel: '→ Saindo' },
  { id: 'saindo',     label: 'Saindo para Entregar', cor: '#8b5cf6', bgCor: '#8b5cf61a', proximoStatus: 'completo',   proximoLabel: '→ Entregue' },
  { id: 'completo',   label: 'Entregue',             cor: '#16a34a', bgCor: '#16a34a1a', proximoStatus: null,         proximoLabel: null },
]

function tocarBeepPreview() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

// ── Config helpers ────────────────────────────────────────────────────────────
function CfgToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 38, height: 21, borderRadius: 11, border: 'none', cursor: 'pointer', background: value ? 'var(--accent)' : 'rgba(128,128,128,0.25)', position: 'relative', transition: 'background .2s', flexShrink: 0, outline: 'none' }}>
      <span style={{ position: 'absolute', top: 2.5, left: value ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

function CfgRow({ label, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--bg-hover)', borderRadius: 10, padding: '9px 13px', border: '1px solid var(--border)' }}>
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function LinkDisplay({ titulo, token, onGerar, rotaBase }) {
  const [copiado, setCopiado] = useState(false)
  const url = token ? `${window.location.origin}${rotaBase}/${token}` : null
  function copiar() {
    if (!url) return
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{titulo}</span>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={onGerar} title={token ? 'Gerar novo link' : 'Gerar link'}>
          {token ? <RefreshCw size={11} /> : <Link2 size={11} />} {token ? 'Novo' : 'Gerar link'}
        </button>
      </div>
      {url && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <code style={{ flex: 1, fontSize: 10, background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</code>
          <button className="btn btn-secondary" style={{ padding: '3px 9px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }} onClick={copiar}><Copy size={10} />{copiado ? 'Copiado' : 'Copiar'}</button>
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '3px 7px', fontSize: 11, display: 'flex', alignItems: 'center' }}><ExternalLink size={11} /></a>
        </div>
      )}
    </div>
  )
}

// ── Períodos ──────────────────────────────────────────────────────────────────
const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'custom', label: 'Período' },
]

export default function Kanban() {
  const { pedidos, pratos, garcons, mesas, atualizarStatusPedido, kanbanConfig,
          atualizarKanbanConfig, gerarTokenCozinha, gerarTokenCaixa } = useApp()
  const cfg = kanbanConfig

  const [aba, setAba] = useState('fluxo')

  const etapas = cfg.etapas && cfg.etapas.length >= 2 ? cfg.etapas : DEFAULT_ETAPAS

  function updateEtapa(idx, updates) {
    const next = etapas.map((e, i) => i === idx ? { ...e, ...updates } : e)
    atualizarKanbanConfig({ etapas: next })
  }
  function adicionarEtapa() {
    const nova = { id: crypto.randomUUID().replace(/-/g,'').slice(0,8), label: 'Nova Etapa', cor: '#8b5cf6' }
    const next = [...etapas.slice(0, -1), nova, etapas[etapas.length - 1]]
    atualizarKanbanConfig({ etapas: next })
  }
  function removerEtapa(idx) {
    if (idx === 0 || idx === etapas.length - 1) return
    atualizarKanbanConfig({ etapas: etapas.filter((_, i) => i !== idx) })
  }

  const [periodo, setPeriodo] = useState(() => cfg.filtroPadrao || 'hoje')
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dataFim, setDataFim] = useState(hoje())

  useEffect(() => {
    const h = hoje()
    if (periodo === 'hoje')   { setDataInicio(h);             setDataFim(h) }
    if (periodo === 'semana') { setDataInicio(inicioSemana()); setDataFim(h) }
    if (periodo === 'mes')    { setDataInicio(inicioMes());    setDataFim(h) }
  }, [periodo])

  // Auto-refresh de timers
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000)
    return () => clearInterval(id)
  }, [])

  // Som ao chegar novo pedido
  const prevNovosRef = useRef(null)
  useEffect(() => {
    if (!cfg.somAlerta) { prevNovosRef.current = null; return }
    const novosIds = pedidos.filter(p => p.status === 'novo').map(p => p.id).sort().join(',')
    if (prevNovosRef.current === null) { prevNovosRef.current = novosIds; return }
    if (novosIds !== prevNovosRef.current) {
      const prev = prevNovosRef.current.split(',').filter(Boolean)
      const cur  = novosIds.split(',').filter(Boolean)
      if (cur.some(id => !prev.includes(id))) tocarBeep()
      prevNovosRef.current = novosIds
    }
  }, [pedidos, cfg.somAlerta])

  // Colunas derivadas de cfg.etapas
  const COLUNAS = etapas.map((e, i, arr) => ({
    id: e.id, label: e.label, cor: e.cor,
    bgCor: `${e.cor}1a`,
    proximoStatus: arr[i + 1]?.id || null,
    proximoLabel: arr[i + 1] ? `→ ${arr[i + 1].label}` : null,
  }))

  const lastStageId = etapas[etapas.length - 1]?.id || 'completo'

  const pedidosFiltrados = pedidos.filter(p => {
    if (p.data < dataInicio || p.data > dataFim) return false
    if (p.status === lastStageId && cfg.ocultarCompletoAposMin > 0) {
      const ts = p.timestamps?.[lastStageId]
      if (ts && minutosDecorridos(ts) > cfg.ocultarCompletoAposMin) return false
    }
    return true
  })

  const totalPorColuna = (status) => pedidosFiltrados.filter(p => p.status === status).length

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 24px)', maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fluxo de Pedidos</h1>
          <p className="page-subtitle">
            {etapas.map(e => `${totalPorColuna(e.id)} ${e.label.toLowerCase()}`).join(' · ')}
            {cfg.somAlerta && <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: 12 }}>🔔</span>}
          </p>
        </div>

        {/* Filtro de período — só no modo fluxo */}
        {aba === 'fluxo' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 4, borderRadius: 10 }}>
              {PERIODOS.map(p => (
                <button key={p.id} onClick={() => setPeriodo(p.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={periodo === p.id
                    ? { background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
                    : { background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
            {periodo === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" className="input text-xs" value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)} style={{ width: 140 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>até</span>
                <input type="date" className="input text-xs" value={dataFim}
                  onChange={e => setDataFim(e.target.value)} style={{ width: 140 }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-hover)', padding: 3, borderRadius: 12, width: 'fit-content', marginBottom: 16 }}>
        {[{ id: 'fluxo', label: 'Fluxo', icon: null }, { id: 'config', label: 'Configurações', icon: Settings }].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .12s',
              background: aba === a.id ? 'var(--bg-card)' : 'transparent',
              color: aba === a.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: aba === a.id ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}>
            {a.icon && <a.icon size={13} />} {a.label}
          </button>
        ))}
      </div>

      {aba === 'fluxo' ? (
      /* Board */
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── Fluxo Local ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>Fluxo Local</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUNAS.length}, minmax(200px, 1fr))`, gap: 12, minWidth: `${COLUNAS.length * 210}px` }}>
            {COLUNAS.map(col => {
              const cards = pedidosFiltrados
                .filter(p => p.status === col.id && p.canal !== 'delivery')
                .sort((a, b) => (a.timestamps?.[col.id] || '').localeCompare(b.timestamps?.[col.id] || ''))
              return (
                <div key={col.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '12px 12px 0 0',
                    background: col.bgCor, border: `1px solid ${col.cor}33`, borderBottom: 'none',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: col.cor }}>{col.label}</span>
                    <span style={{ minWidth: 24, height: 24, borderRadius: 20, background: col.cor, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px' }}>
                      {cards.length}
                    </span>
                  </div>
                  <div style={{
                    minHeight: 200, padding: 10, background: 'var(--bg-hover)',
                    border: `1px solid ${col.cor}22`, borderRadius: '0 0 12px 12px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    maxHeight: 'calc(100vh - 300px)', overflowY: 'auto',
                  }}>
                    {cards.length === 0
                      ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum pedido</div>
                      : cards.map(pedido => (
                        <CardPedido key={pedido.id} pedido={pedido} coluna={col} pratos={pratos} garcons={garcons} mesas={mesas} onAvancar={atualizarStatusPedido} cfg={cfg} />
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>

        {/* ── Fluxo Delivery ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Truck size={13} color="#f04000" />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#f04000' }}>Delivery</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,64,0,0.25)' }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${DELIVERY_COLUNAS.length}, minmax(200px, 1fr))`, gap: 12, minWidth: `${DELIVERY_COLUNAS.length * 210}px` }}>
            {DELIVERY_COLUNAS.map((col, colIdx) => {
              const isPrimeiro = colIdx === 0
              const cards = pedidosFiltrados
                .filter(p => {
                  if (p.canal !== 'delivery') return false
                  // primeira coluna: aceita 'novo' e 'pendente'
                  if (isPrimeiro) return p.status === col.id || p.status === 'pendente'
                  return p.status === col.id
                })
                .sort((a, b) => (a.timestamps?.[col.id] || a.timestamps?.novo || '').localeCompare(b.timestamps?.[col.id] || b.timestamps?.novo || ''))
              return (
                <div key={col.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '12px 12px 0 0',
                    background: col.bgCor, border: `1px solid ${col.cor}33`, borderBottom: 'none',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: col.cor, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {col.id === 'saindo' && <IconMotoqueiro size={18} color={col.cor} />}
                      {col.label}
                    </span>
                    <span style={{ minWidth: 24, height: 24, borderRadius: 20, background: col.cor, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px' }}>
                      {cards.length}
                    </span>
                  </div>
                  <div style={{
                    minHeight: 200, padding: 10, background: col.id === 'saindo' ? 'rgba(249,115,22,0.03)' : 'rgba(240,64,0,0.03)',
                    border: `1px solid ${col.cor}22`, borderRadius: '0 0 12px 12px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    maxHeight: 'calc(100vh - 300px)', overflowY: 'auto',
                  }}>
                    {cards.length === 0
                      ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum pedido</div>
                      : cards.map(pedido => (
                        <CardPedido key={pedido.id} pedido={pedido} coluna={col} pratos={pratos} garcons={garcons} mesas={mesas} onAvancar={atualizarStatusPedido} cfg={cfg} />
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      </div>
      ) : (
      /* ── Configurações ───────────────────────────────────────────────── */
      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

        {/* Etapas */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Etapas do Fluxo</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Alterar nomes e cores aqui aplica a Cozinha, Balcão e este painel.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {etapas.map((etapa, idx) => {
              const locked = idx === 0 || idx === etapas.length - 1
              return (
                <div key={etapa.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${etapa.cor}`, borderRadius: 10, padding: '8px 12px' }}>
                  <input type="color" value={etapa.cor}
                    onChange={e => updateEtapa(idx, { cor: e.target.value })}
                    style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }} />
                  <input value={etapa.label}
                    onChange={e => updateEtapa(idx, { label: e.target.value })}
                    style={{ flex: 1, padding: '5px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 46, textAlign: 'right' }}>
                    {locked ? (idx === 0 ? 'Entrada' : 'Saída') : `Etapa ${idx + 1}`}
                  </span>
                  {!locked
                    ? <button onClick={() => removerEtapa(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', borderRadius: 6 }}>
                        <Trash2 size={13} />
                      </button>
                    : <div style={{ width: 21 }} />
                  }
                </div>
              )
            })}
          </div>
          {etapas.length < 8 && (
            <button onClick={adicionarEtapa}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px 0', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
              <Plus size={13} /> Adicionar etapa intermediária
            </button>
          )}
        </div>

        {/* Timer */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Alertas de Tempo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CfgRow label="Verde → Amarelo após" sub="Minutos no estágio atual">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" className="input" value={cfg.limiteAmareloMin} min={1} max={120}
                  onChange={e => atualizarKanbanConfig({ limiteAmareloMin: Math.max(1, +e.target.value) })}
                  style={{ width: 65, textAlign: 'center' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
              </div>
            </CfgRow>
            <CfgRow label="Amarelo → Vermelho após" sub="Minutos no estágio atual">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" className="input" value={cfg.limiteVermelhoMin} min={1} max={120}
                  onChange={e => atualizarKanbanConfig({ limiteVermelhoMin: Math.max(1, +e.target.value) })}
                  style={{ width: 65, textAlign: 'center' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
              </div>
            </CfgRow>
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Links de Acesso</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px' }}>Cozinha</p>
              <LinkDisplay titulo="Display da Cozinha" token={cfg.cozinhaToken} onGerar={gerarTokenCozinha} rotaBase="/cozinha" />
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <CfgRow label="Atualização auto.">
                  <select className="input" value={cfg.autoRefreshSeg}
                    onChange={e => atualizarKanbanConfig({ autoRefreshSeg: Number(e.target.value) })}
                    style={{ width: 'auto', fontSize: 12 }}>
                    <option value={5}>5 seg</option><option value={10}>10 seg</option>
                    <option value={30}>30 seg</option><option value={60}>1 min</option>
                  </select>
                </CfgRow>
                <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '9px 13px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 600 }}>Colunas visíveis</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {etapas.map(e => {
                      const def = etapas.slice(0,-1).map(x=>x.id)
                      const vis = cfg.colunasVisivelCozinha || def
                      return (
                        <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                          <input type="checkbox"
                            checked={vis.includes(e.id)}
                            onChange={ev => atualizarKanbanConfig({ colunasVisivelCozinha: ev.target.checked ? [...vis, e.id] : vis.filter(x => x !== e.id) })}
                            style={{ accentColor: e.cor }} />
                          <span style={{ color: e.cor }}>●</span> {e.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px' }}>Balcão</p>
              <LinkDisplay titulo="Display do Balcão" token={cfg.caixaToken} onGerar={gerarTokenCaixa} rotaBase="/caixa" />
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '9px 13px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 600 }}>Colunas visíveis</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {etapas.map(e => {
                      const vis = cfg.caixaColunasVisiveis || etapas.map(x=>x.id)
                      return (
                        <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                          <input type="checkbox"
                            checked={vis.includes(e.id)}
                            onChange={ev => atualizarKanbanConfig({ caixaColunasVisiveis: ev.target.checked ? [...vis, e.id] : vis.filter(x => x !== e.id) })}
                            style={{ accentColor: e.cor }} />
                          <span style={{ color: e.cor }}>●</span> {e.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <CfgRow label="Mostrar preços">
                  <CfgToggle value={cfg.caixaMostrarPrecos} onChange={v => atualizarKanbanConfig({ caixaMostrarPrecos: v })} />
                </CfgRow>
                <CfgRow label="Pode avançar status">
                  <CfgToggle value={cfg.caixaPodeAvancar} onChange={v => atualizarKanbanConfig({ caixaPodeAvancar: v })} />
                </CfgRow>
                <CfgRow label="PDV (Novo Pedido)">
                  <CfgToggle value={cfg.pdvAtivo} onChange={v => atualizarKanbanConfig({ pdvAtivo: v })} />
                </CfgRow>
                <CfgRow label="Aba Mesas">
                  <CfgToggle value={cfg.caixaMesasAtivo} onChange={v => atualizarKanbanConfig({ caixaMesasAtivo: v })} />
                </CfgRow>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Exibição nos Cards</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'mostrarPrecos', label: 'Mostrar preços' },
              { key: 'mostrarGarcom', label: 'Mostrar garçom' },
              { key: 'mostrarMesa',   label: 'Mostrar mesa' },
              { key: 'mostrarObs',    label: 'Mostrar observações' },
              { key: 'modoCompacto',  label: 'Modo compacto (cards menores)' },
            ].map(({ key, label }) => (
              <CfgRow key={key} label={label}>
                <CfgToggle value={cfg[key]} onChange={v => atualizarKanbanConfig({ [key]: v })} />
              </CfgRow>
            ))}
          </div>
        </div>

        {/* Comportamento */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Comportamento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CfgRow label="Auto-ocultar completos após" sub="0 = nunca ocultar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" className="input" value={cfg.ocultarCompletoAposMin} min={0} max={999}
                  onChange={e => atualizarKanbanConfig({ ocultarCompletoAposMin: Math.max(0, +e.target.value) })}
                  style={{ width: 65, textAlign: 'center' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
              </div>
            </CfgRow>
            <CfgRow label="Filtro padrão ao abrir">
              <select className="input" value={cfg.filtroPadrao}
                onChange={e => atualizarKanbanConfig({ filtroPadrao: e.target.value })}
                style={{ width: 'auto', fontSize: 12 }}>
                <option value="hoje">Hoje</option>
                <option value="semana">Semana</option>
                <option value="mes">Mês</option>
              </select>
            </CfgRow>
            <CfgRow label="Som ao chegar novo pedido">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={tocarBeepPreview}>
                  <Volume2 size={13} /> Testar
                </button>
                <CfgToggle value={cfg.somAlerta} onChange={v => atualizarKanbanConfig({ somAlerta: v })} />
              </div>
            </CfgRow>
          </div>
        </div>

        {/* ── Impressora Térmica ── */}
        <ImpressoraSection />

      </div>
      )}
    </div>
  )
}

function ImpressoraSection() {
  const { kanbanConfig, atualizarKanbanConfig, cardapioConfig, pratos } = useApp()
  const [statusUSB,    setStatusUSB]    = useState('')
  const [statusSerial, setStatusSerial] = useState('')
  const [testando,     setTestando]     = useState(false)

  const escAtivo = kanbanConfig.escposAtivo || false
  const modo     = kanbanConfig.escposModo  || 'usb'

  async function conectar() {
    if (modo === 'usb') {
      setStatusUSB('Conectando...')
      const r = await conectarUSB()
      setStatusUSB(r.ok ? '✓ Conectada!' : `Erro: ${r.erro}`)
    } else {
      setStatusSerial('Conectando...')
      const r = await conectarSerial()
      setStatusSerial(r.ok ? '✓ Conectada!' : `Erro: ${r.erro}`)
    }
  }

  async function testar() {
    setTestando(true)
    const pedidoTeste = {
      id: crypto.randomUUID(),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      itens: [{ pratoId: pratos[0]?.id || 'x', quantidade: 1, opcoes: [] }],
      obs: 'Teste de impressão',
    }
    const dados = buildComanda(pedidoTeste, pratos, cardapioConfig?.nomeRestaurante || 'Restaurante')
    const r = modo === 'usb' ? await imprimirUSB(dados) : await imprimirSerial(dados)
    setTestando(false)
    if (!r.ok) alert(`Erro ao imprimir: ${r.erro}`)
  }

  const conectado = modo === 'usb' ? usbConectado() : serialConectado()

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Printer size={16} style={{ color: 'var(--accent)' }} /> Impressora Térmica (ESC/POS)
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Conecte via USB ou Serial/Bluetooth para imprimir comandas sem abrir janela do navegador. Funciona no Chrome 89+ e Edge (desktop).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CfgRow label="Ativar impressão ESC/POS" sub="O botão de imprimir no Fluxo usará a impressora térmica">
          <CfgToggle value={escAtivo} onChange={v => atualizarKanbanConfig({ escposAtivo: v })} />
        </CfgRow>

        {escAtivo && (
          <>
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
              {[
                { id: 'usb',    label: 'USB',       Icon: Usb,       suporta: suportaUSB() },
                { id: 'serial', label: 'Serial/BT', Icon: Bluetooth, suporta: suportaSerial() },
              ].map(op => (
                <button key={op.id} onClick={() => atualizarKanbanConfig({ escposModo: op.id })}
                  disabled={!op.suporta}
                  style={{
                    padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', cursor: op.suporta ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: modo === op.id ? 'var(--accent)' : 'var(--bg-hover)',
                    color: modo === op.id ? '#fff' : op.suporta ? 'var(--text-secondary)' : 'var(--text-muted)',
                    opacity: op.suporta ? 1 : 0.4,
                  }}>
                  <op.Icon size={14} /> {op.label}
                  {!op.suporta && <span style={{ fontSize: 10 }}>(não suportado)</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={conectar} style={{ gap: 6 }}>
                <Printer size={14} />
                {conectado ? 'Reconectar impressora' : 'Conectar impressora'}
              </button>
              {conectado && (
                <button className="btn btn-secondary" onClick={testar} disabled={testando} style={{ gap: 6 }}>
                  {testando ? 'Imprimindo...' : 'Imprimir teste'}
                </button>
              )}
              {(statusUSB || statusSerial) && (
                <span style={{ fontSize: 12, color: (statusUSB || statusSerial).startsWith('✓') ? '#22c55e' : '#ef4444' }}>
                  {statusUSB || statusSerial}
                </span>
              )}
            </div>

            {conectado && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 12, color: '#16a34a' }}>
                ✓ Impressora conectada via {modo === 'usb' ? 'USB' : 'Serial/Bluetooth'}.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
