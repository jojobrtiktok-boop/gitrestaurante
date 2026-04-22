import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingBag, Check, Clock, AlertTriangle, ChefHat, Plus, LayoutGrid, X, UserPlus, CreditCard, Banknote, QrCode } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import PDVPage from './PDV.jsx'
import { hoje } from '../utils/formatacao.js'

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
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: cor, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Clock size={11} />{formatarTempo(mins)}
    </span>
  )
}

// ── Card do caixa ─────────────────────────────────────────────────────────────
function CardCaixa({ pedido, coluna, pratos, garcons, mesas, onAvancar, onPagar, onAceitar, onCancelar, cfg, isNovo = false }) {
  const garcon = garcons.find(g => g.id === pedido.garconId)
  const mesa = mesas?.find(m => m.id === pedido.mesaId)
  const inicioEstagio = pedido.timestamps?.[coluna.id]

  const total = pedido.itens?.reduce((s, i) => {
    const p = pratos.find(x => x.id === i.pratoId)
    if (!p) return s
    const extras = (i.opcoes || []).reduce((ss, o) => ss + (Number(o.precoExtra) || 0), 0)
    return s + (p.precoVenda + extras) * i.quantidade
  }, 0) || 0

  const ts = pedido.timestamps || {}
  const tempoTotal = ts.novo && ts.completo ? Math.floor((new Date(ts.completo) - new Date(ts.novo)) / 60000) : null

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: isNovo ? '2px solid #16a34a' : '1px solid var(--border)',
      borderLeft: `3px solid ${coluna.cor}`,
      borderRadius: 12, padding: '11px 14px',
      display: 'flex', flexDirection: 'column', gap: 7,
      animation: isNovo ? 'pulseNovo 2s ease-in-out infinite' : undefined,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: coluna.cor }}>{pedido.hora}</span>
          {pedido.canal === 'delivery' ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f04000', background: 'rgba(240,64,0,0.12)', padding: '1px 7px', borderRadius: 20, border: '1px solid rgba(240,64,0,0.3)' }}>
              🛵 Delivery
            </span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 7px', borderRadius: 20 }}>
              {garcon ? garcon.nome : 'Caixa'}
            </span>
          )}
          {mesa && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '1px 7px', borderRadius: 20, border: '1px solid var(--border-active)' }}>
              {mesa.nome}
            </span>
          )}
          {pedido.clienteNome && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '1px 5px' }}>
              👤 {pedido.clienteNome}
            </span>
          )}
        </div>
        {coluna.proximoStatus !== null && inicioEstagio
          ? <TimerVivo isoInicio={inicioEstagio} limiteAmarelo={cfg.limiteAmareloMin} limiteVermelho={cfg.limiteVermelhoMin} />
          : tempoTotal !== null
            ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ {formatarTempo(tempoTotal)}</span>
            : null
        }
      </div>

      {/* Itens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {pedido.itens?.map(item => {
          const p = pratos.find(x => x.id === item.pratoId)
          if (!p) return null
          const extras = (item.opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
          return (
            <div key={item.uid || item.pratoId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>×{item.quantidade} {p.nome}</span>
                {cfg.caixaMostrarPrecos && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {((p.precoVenda + extras) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
              {item.opcoes?.length > 0 && (
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

      {pedido.obs && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>"{pedido.obs}"</p>
      )}

      {/* Endereço + WhatsApp (delivery) */}
      {pedido.canal === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pedido.enderecoEntrega && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>📍 {pedido.enderecoEntrega}</p>
          )}
          {pedido.clienteTelefone && (
            <a href={`https://wa.me/55${pedido.clienteTelefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '3px 9px', borderRadius: 8, border: '1px solid rgba(22,163,74,0.25)', textDecoration: 'none', width: 'fit-content' }}>
              📲 WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 7 }}>
        {cfg.caixaMostrarPrecos
          ? <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          : <span />
        }
        {/* Pedido pendente: Aceitar / Cancelar */}
        {pedido.status === 'pendente' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onCancelar && onCancelar(pedido.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 8, border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <X size={12} /> Cancelar
            </button>
            <button onClick={() => onAceitar && onAceitar(pedido.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Check size={12} /> Aceitar
            </button>
          </div>
        ) : !coluna.proximoStatus ? (
          <button onClick={() => onPagar && onPagar(pedido.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Check size={12} /> Pago
          </button>
        ) : (
          <>
            {cfg.caixaPodeAvancar && coluna.proximoStatus && (
              <button onClick={() => onAvancar(pedido.id, coluna.proximoStatus)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: 'none', background: coluna.cor, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {coluna.proximoStatus === 'preparando' ? <ChefHat size={12} /> : <Check size={12} />}
                {coluna.proximoLabel}
              </button>
            )}
            {!cfg.caixaPodeAvancar && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${coluna.cor}22`, color: coluna.cor, fontWeight: 600 }}>
                {coluna.label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Board de Mesas ────────────────────────────────────────────────────────────
function valorPedidoCalc(pedido, pratos) {
  return (pedido.itens || []).reduce((s, i) => {
    const p = pratos.find(x => x.id === i.pratoId)
    if (!p) return s
    const extras = (i.opcoes || []).reduce((e, o) => e + (Number(o.precoExtra) || 0), 0)
    return s + (p.precoVenda + extras) * i.quantidade
  }, 0)
}

function MesasBoard({ mesas, pedidos, pratos, hj, cfg, adicionarMesa, setStatusMesa, pagarMesa, adicionarCliente, clientes }) {
  const [adicionando, setAdicionando] = useState(false)
  const [novoNome, setNovoNome]       = useState('')
  const [novoCadeiras, setNovoCadeiras] = useState('4')
  const [acaoMesa, setAcaoMesa] = useState(null) // { id, acao:'ocupar'|'reservar', clienteId }
  const [criandoCliente, setCriandoCliente] = useState(false)
  const [novoNomeCliente, setNovoNomeCliente] = useState('')

  function handleConfirmarAcao() {
    if (!acaoMesa) return
    const { id, acao, clienteId } = acaoMesa
    let nomeFinal = clienteId ? ((clientes || []).find(c => c.id === clienteId)?.nome || null) : null
    if (criandoCliente && novoNomeCliente.trim()) {
      if (adicionarCliente) adicionarCliente(novoNomeCliente.trim())
      nomeFinal = novoNomeCliente.trim()
    }
    setStatusMesa(id, acao === 'reservar' ? 'reservada' : 'ocupada', nomeFinal)
    setAcaoMesa(null)
    setCriandoCliente(false)
    setNovoNomeCliente('')
  }

  const livres    = mesas.filter(m => m.status === 'livre').length
  const reservadas = mesas.filter(m => m.status === 'reservada').length
  const ocupadas  = mesas.filter(m => m.status === 'ocupada').length
  const faturadoHoje = pedidos.filter(p => p.data === hj && p.mesaId).reduce((s, p) => s + valorPedidoCalc(p, pratos), 0)

  function handleAdicionar() {
    if (!novoNome.trim()) return
    adicionarMesa(novoNome.trim(), parseInt(novoCadeiras) || 4)
    setNovoNome(''); setNovoCadeiras('4'); setAdicionando(false)
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Stats + botão adicionar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Total',      value: mesas.length, cor: 'var(--text-secondary)', bg: 'var(--bg-card)',            border: 'var(--border)' },
          { label: 'Livres',     value: livres,        cor: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: '#16a34a44' },
          { label: 'Reservadas', value: reservadas,    cor: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: '#f9731644' },
          { label: 'Ocupadas',   value: ocupadas,      cor: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: '#ef444444' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.cor }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
        {cfg.caixaMostrarPrecos && faturadoHoje > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>{faturadoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>hoje</span>
          </div>
        )}
        <button onClick={() => setAdicionando(v => !v)}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Plus size={12} /> Adicionar Mesa
        </button>
      </div>

      {/* Form adicionar mesa */}
      {adicionando && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome da mesa"
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
            style={{ flex: 1, minWidth: 120, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Cadeiras:</span>
            <input type="number" min="1" max="50" value={novoCadeiras} onChange={e => setNovoCadeiras(e.target.value)}
              style={{ width: 54, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center', outline: 'none' }} />
          </div>
          <button onClick={handleAdicionar} disabled={!novoNome.trim()}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: novoNome.trim() ? 'var(--accent)' : 'var(--bg-hover)', color: novoNome.trim() ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: novoNome.trim() ? 'pointer' : 'not-allowed' }}>
            Criar
          </button>
          <button onClick={() => { setAdicionando(false); setNovoNome('') }}
            style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      )}

      {/* Grid de mesas — altura fixa e uniforme */}
      {mesas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma mesa cadastrada</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
          {mesas.map(mesa => {
            const livre     = mesa.status === 'livre'
            const reservada = mesa.status === 'reservada'
            const ocupada   = mesa.status === 'ocupada'
            const cor = ocupada ? '#ef4444' : reservada ? '#f97316' : '#16a34a'
            const pedidosMesa = mesa.inicioSessao
              ? pedidos.filter(p => p.mesaId === mesa.id && (p.timestamps?.novo || '') >= mesa.inicioSessao)
              : []
            const ativos    = pedidosMesa.filter(p => !p.pago).length
            const totalMesa = pedidosMesa.reduce((s, p) => s + valorPedidoCalc(p, pratos), 0)
            const minutos   = ocupada && mesa.inicioSessao ? minutosDecorridos(mesa.inicioSessao) : null
            return (
              <div key={mesa.id} style={{
                background: 'var(--bg-card)', border: `2px solid ${cor}`,
                borderRadius: 12, minHeight: 185,
                padding: '11px 13px', display: 'flex', flexDirection: 'column',
              }}>
                {/* Topo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '62%' }}>{mesa.nome}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: `${cor}22`, color: cor, whiteSpace: 'nowrap' }}>
                    {ocupada ? 'Ocupada' : reservada ? 'Reservada' : 'Livre'}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{mesa.capacidade} cadeiras</span>

                {/* Corpo */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, overflow: 'hidden' }}>
                  {mesa.nomeCliente && <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👤 {mesa.nomeCliente}</span>}
                  {minutos !== null && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {formatarTempo(minutos)}
                    </span>
                  )}
                  {ocupada && cfg.caixaMostrarPrecos && totalMesa > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {totalMesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  {ocupada && ativos > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>{ativos} item{ativos > 1 ? 'ns' : ''} pendente{ativos > 1 ? 's' : ''}</span>}
                </div>

                {/* Botões de ação */}
                <div>
                  {livre && (
                    acaoMesa?.id === mesa.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select value={acaoMesa.clienteId || ''} onChange={e => setAcaoMesa(prev => ({ ...prev, clienteId: e.target.value || null }))}
                            style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
                            <option value="">Sem cliente</option>
                            {(clientes || []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                          <button onClick={() => { setCriandoCliente(v => !v); setNovoNomeCliente('') }}
                            style={{ padding: '3px 7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                              background: criandoCliente ? 'var(--bg-hover)' : 'rgba(59,130,246,0.1)', color: criandoCliente ? 'var(--text-muted)' : '#3b82f6' }}>
                            {criandoCliente ? <X size={10} /> : <><UserPlus size={10} /> Novo</>}
                          </button>
                        </div>
                        {criandoCliente && (
                          <input autoFocus value={novoNomeCliente} onChange={e => setNovoNomeCliente(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConfirmarAcao()}
                            placeholder="Nome do novo cliente"
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 11, outline: 'none', width: '100%' }} />
                        )}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={handleConfirmarAcao}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                              background: acaoMesa.acao === 'reservar' ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.12)',
                              color: acaoMesa.acao === 'reservar' ? '#f97316' : '#ef4444' }}>
                            {acaoMesa.acao === 'reservar' ? 'Reservar' : 'Ocupar'}
                          </button>
                          <button onClick={() => { setAcaoMesa(null); setCriandoCliente(false); setNovoNomeCliente('') }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 11 }}>
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setAcaoMesa({ id: mesa.id, acao: 'reservar', clienteId: null })}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                          Reservar
                        </button>
                        <button onClick={() => setAcaoMesa({ id: mesa.id, acao: 'ocupar', clienteId: null })}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                          Ocupar
                        </button>
                      </div>
                    )
                  )}
                  {reservada && (
                    acaoMesa?.id === mesa.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select value={acaoMesa.clienteId || ''} onChange={e => setAcaoMesa(prev => ({ ...prev, clienteId: e.target.value || null }))}
                            style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
                            <option value="">Sem cliente</option>
                            {(clientes || []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                          <button onClick={() => { setCriandoCliente(v => !v); setNovoNomeCliente('') }}
                            style={{ padding: '3px 7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                              background: criandoCliente ? 'var(--bg-hover)' : 'rgba(59,130,246,0.1)', color: criandoCliente ? 'var(--text-muted)' : '#3b82f6' }}>
                            {criandoCliente ? <X size={10} /> : <><UserPlus size={10} /> Novo</>}
                          </button>
                        </div>
                        {criandoCliente && (
                          <input autoFocus value={novoNomeCliente} onChange={e => setNovoNomeCliente(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConfirmarAcao()}
                            placeholder="Nome do novo cliente"
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 11, outline: 'none', width: '100%' }} />
                        )}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={handleConfirmarAcao}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                            Ocupar
                          </button>
                          <button onClick={() => { setAcaoMesa(null); setCriandoCliente(false); setNovoNomeCliente('') }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 11 }}>
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setStatusMesa(mesa.id, 'livre')}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                          Cancelar
                        </button>
                        <button onClick={() => setAcaoMesa({ id: mesa.id, acao: 'ocupar', clienteId: null })}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                          Ocupar
                        </button>
                      </div>
                    )
                  )}
                  {ocupada && (
                    <button onClick={() => pagarMesa(mesa.id)}
                      style={{ width: '100%', padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Check size={12} /> Pago
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
// ── Modal Forma de Pagamento ──────────────────────────────────────────────────
const FORMAS_LABEL = {
  dinheiro: { label: 'Dinheiro', icon: '💵' },
  pix: { label: 'Pix', icon: '📱' },
  cartao_credito: { label: 'Crédito', icon: '💳' },
  cartao_debito: { label: 'Débito', icon: '💳' },
}
function ModalPagamento({ total, cfg, pagamentosConfig, onConfirmar, onFechar }) {
  const formas = [
    pagamentosConfig?.dinheiro !== false && 'dinheiro',
    pagamentosConfig?.pix !== false && 'pix',
    pagamentosConfig?.cartaoCredito !== false && 'cartao_credito',
    pagamentosConfig?.cartaoDebito !== false && 'cartao_debito',
  ].filter(Boolean)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onFechar}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '24px 20px', maxWidth: 320, width: '90%', display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Forma de Pagamento</span>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        {cfg.caixaMostrarPrecos && (
          <div style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {formas.map(f => (
            <button key={f} onClick={() => onConfirmar(f)}
              style={{ padding: '14px 8px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .1s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = 'rgba(22,163,74,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}>
              <span style={{ fontSize: 22 }}>{FORMAS_LABEL[f]?.icon}</span>
              <span>{FORMAS_LABEL[f]?.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => onConfirmar(null)}
          style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
          Registrar sem forma de pagamento
        </button>
      </div>
    </div>
  )
}

export default function CaixaDisplay() {
  const { token } = useParams()
  const { pedidos, pratos, garcons, mesas, clientes, kanbanConfig, pagamentosConfig, atualizarStatusPedido, aceitarPedidoDelivery, atribuirMotoboy, marcarPedidoPago, pagarMesa, cancelarPedido, adicionarMesa, setStatusMesa, adicionarCliente, authLoading, displayReady, motoboys } = useApp()
  const cfg = kanbanConfig

  const [abaAtiva, setAbaAtiva] = useState('pedidos') // 'pedidos' | 'novo-pedido'
  const [expandidosPedido, setExpandidosPedido] = useState({})
  const [mesaAberSoPedidos, setMesaAberSoPedidos] = useState(null)
  const [pagarMesaConfirm, setPagarMesaConfirm] = useState(null) // { pedidoId, mesaId }
  const [modalPagamento, setModalPagamento] = useState(null) // { pedidoId, mesaId?, total }
  const [modalMotoboy, setModalMotoboy] = useState(null) // { pedidoId } — seletor de motoboy para delivery saindo

  function calcTotal(pedido) {
    return (pedido.itens || []).reduce((s, i) => {
      const pr = pratos.find(x => x.id === i.pratoId)
      if (!pr) return s
      const extras = (i.opcoes || []).reduce((ss, o) => ss + (Number(o.precoExtra) || 0), 0)
      return s + (pr.precoVenda + extras) * i.quantidade
    }, 0)
  }

  function abrirPagamento(pedidoId, mesaId) {
    const pedido = pedidos.find(p => p.id === pedidoId)
    const total = pedido ? calcTotal(pedido) : 0
    setModalPagamento({ pedidoId, mesaId: mesaId || null, total })
  }

  function confirmarPagamento(formaPagamento) {
    if (!modalPagamento) return
    const { pedidoId, mesaId } = modalPagamento
    if (mesaId) {
      pagarMesa(mesaId, formaPagamento)
      setPagarMesaConfirm({ pedidoId, mesaId })
    } else {
      marcarPedidoPago(pedidoId, formaPagamento)
    }
    setModalPagamento(null)
  }

  function imprimirPedido(pedido) {
    const mesa = mesas.find(m => m.id === pedido.mesaId)
    const garcon = garcons.find(g => g.id === pedido.garconId)
    const itensHtml = (pedido.itens || []).map(item => {
      const p = pratos.find(x => x.id === item.pratoId)
      if (!p) return ''
      const extras = (item.opcoes || []).map(o => `<div style="padding-left:12px;font-size:11px;color:#555">· ${o.nome}</div>`).join('')
      return `<div style="margin-bottom:6px"><strong>${item.quantidade}x ${p.nome}</strong>${extras}</div>`
    }).join('')
    const win = window.open('', '_blank', 'width=320,height=600')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pedido</title>
<style>body{font-family:monospace;font-size:13px;width:280px;margin:0 auto;padding:10px}hr{border:1px dashed #999;margin:8px 0}.titulo{text-align:center;font-size:15px;font-weight:bold;margin-bottom:4px}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px}@media print{@page{margin:0;size:80mm auto}}</style>
</head><body>
<div class="titulo">${cfg.caixaTitulo || 'Pedido'}</div>
<div class="sub">${pedido.data} ${pedido.hora}</div>
<hr>
${mesa ? `<div><strong>Mesa:</strong> ${mesa.nome}</div>` : ''}
${garcon ? `<div><strong>Garçom:</strong> ${garcon.nome}</div>` : ''}
<hr>
<div style="margin:8px 0">${itensHtml}</div>
${pedido.obs ? `<hr><div style="font-size:11px"><strong>Obs:</strong> ${pedido.obs}</div>` : ''}
<hr>
<div style="text-align:center;font-size:10px;margin-top:10px">— obrigado —</div>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  // Auto-refresh tick
  const [, setTick] = useState(0)
  useEffect(() => {
    const seg = Number(cfg.autoRefreshSeg) || 10
    const id = setInterval(() => setTick(t => t + 1), seg * 1000)
    return () => clearInterval(id)
  }, [cfg.autoRefreshSeg])

  if (authLoading || !displayReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
        Carregando...
      </div>
    )
  }

  // Token inválido
  if (!cfg.caixaToken || token !== cfg.caixaToken) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)', color: 'var(--text-primary)', gap: 16,
      }}>
        <AlertTriangle size={48} color="#ef4444" />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Link inválido</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          Este link de caixa é inválido ou foi regenerado. Peça ao administrador um novo link.
        </p>
      </div>
    )
  }

  const etapas = cfg.etapas && cfg.etapas.length >= 2 ? cfg.etapas : [
    { id: 'novo',       label: 'Aguardando',         cor: '#3b82f6' },
    { id: 'preparando', label: 'Preparando',          cor: '#f59e0b' },
    { id: 'pronto',     label: 'Pronto para Entrega', cor: '#22c55e' },
    { id: 'completo',   label: 'Entregue',            cor: '#16a34a' },
  ]
  const lastStageId = etapas[etapas.length - 1]?.id || 'completo'
  const colunasDef = etapas.map((e, i, arr) => ({
    id: e.id, label: e.label, cor: e.cor,
    bgCor: `${e.cor}1a`,
    proximoStatus: arr[i + 1]?.id || null,
    proximoLabel: arr[i + 1] ? `→ ${arr[i + 1].label}` : null,
  })).filter(c => {
    const visiveis = cfg.caixaColunasVisiveis || etapas.map(x => x.id)
    // garante que 'pronto' sempre aparece se existir nas etapas
    if (c.id === 'pronto') return true
    return visiveis.includes(c.id)
  })

  const h = hoje()
  const hUtc = new Date().toISOString().slice(0, 10)
  const pedidosHoje = pedidos.filter(p => p.data === h || p.data === hUtc)

  const stats = etapas.reduce((acc, e) => ({ ...acc, [e.id]: pedidosHoje.filter(p => p.status === e.id).length }), {})
  const totalHoje = pedidosHoje.reduce((s, p) => s + (p.itens || []).reduce((ss, i) => {
    const pr = pratos.find(x => x.id === i.pratoId)
    if (!pr) return ss
    const extras = (i.opcoes || []).reduce((e, o) => e + (Number(o.precoExtra) || 0), 0)
    return ss + (pr.precoVenda + extras) * i.quantidade
  }, 0), 0)

  // Intercepta avanço de delivery pronto→saindo para mostrar seletor de motoboy
  function handleAvancarDelivery(pedidoId, novoStatus) {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (pedido?.canal === 'delivery' && pedido?.status === 'pronto' && novoStatus === 'saindo') {
      setModalMotoboy({ pedidoId })
    } else {
      atualizarStatusPedido(pedidoId, novoStatus)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Modal seletor de motoboy */}
      {modalMotoboy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalMotoboy(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '24px 20px', maxWidth: 340, width: '90%', display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>🛵 Selecionar Entregador</span>
              <button onClick={() => setModalMotoboy(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
            </div>
            {motoboys.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Nenhum entregador cadastrado</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {motoboys.map(m => (
                  <button key={m.id} onClick={() => { atribuirMotoboy(modalMotoboy.pedidoId, m.id); setModalMotoboy(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', textAlign: 'left', transition: 'all .1s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = m.cor || '#8b5cf6'; e.currentTarget.style.background = `${m.cor || '#8b5cf6'}18` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.cor || '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{m.nome}</div>
                      {m.telefone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.telefone}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => { atualizarStatusPedido(modalMotoboy.pedidoId, 'saindo'); setModalMotoboy(null) }}
              style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              Prosseguir sem entregador
            </button>
          </div>
        </div>
      )}
      {modalPagamento && (
        <ModalPagamento
          total={modalPagamento.total}
          cfg={cfg}
          pagamentosConfig={pagamentosConfig}
          onConfirmar={confirmarPagamento}
          onFechar={() => setModalPagamento(null)}
        />
      )}
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cfg.cozinhaLogo
            ? <img src={cfg.cozinhaLogo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            : <ShoppingBag size={20} color="var(--accent)" />
          }
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
            {cfg.caixaTitulo || 'Painel do Balcão'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setAbaAtiva('pedidos')}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .15s',
                background: abaAtiva === 'pedidos' ? '#16a34a' : 'transparent',
                color: abaAtiva === 'pedidos' ? '#fff' : '#16a34a' }}>
              Fluxo de Pedidos
            </button>
            {cfg.caixaMesasAtivo && (
              <button onClick={() => setAbaAtiva('mesas')}
                style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 4,
                  background: abaAtiva === 'mesas' ? '#16a34a' : 'transparent',
                  color: abaAtiva === 'mesas' ? '#fff' : '#16a34a' }}>
                <LayoutGrid size={11} /> Mesas
              </button>
            )}
            <button onClick={() => setAbaAtiva('so-pedidos')}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .15s',
                background: abaAtiva === 'so-pedidos' ? '#16a34a' : 'transparent',
                color: abaAtiva === 'so-pedidos' ? '#fff' : '#16a34a' }}>
              Só Pedidos
            </button>
            {cfg.pdvAtivo && (
              <button onClick={() => setAbaAtiva('novo-pedido')}
                style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 4,
                  background: abaAtiva === 'novo-pedido' ? '#16a34a' : 'transparent',
                  color: abaAtiva === 'novo-pedido' ? '#fff' : '#16a34a' }}>
                <Plus size={11} /> Novo Pedido
              </button>
            )}
          </div>

          {etapas.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.cor }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: e.cor }}>{stats[e.id] || 0}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.label}</span>
            </div>
          ))}
          {cfg.caixaMostrarPrecos && (
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
              {totalHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} hoje
            </span>
          )}
        </div>
      </div>

      {/* Abas */}
      {abaAtiva === 'novo-pedido' ? (
        <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 58px)', overflow: 'auto' }}>
          <PDVPage />
        </div>
      ) : abaAtiva === 'mesas' ? (
        <MesasBoard mesas={mesas} pedidos={pedidos} pratos={pratos} hj={h} cfg={cfg} adicionarMesa={adicionarMesa} setStatusMesa={setStatusMesa} pagarMesa={pagarMesa} adicionarCliente={adicionarCliente} clientes={clientes} />
      ) : abaAtiva === 'so-pedidos' ? (() => {
        const pedidosLocal    = pedidosHoje.filter(p => p.canal !== 'delivery')
        const pedidosDelivery = pedidosHoje.filter(p => p.canal === 'delivery')
        function ListaPedidos({ lista }) {
          return lista.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum pedido</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...lista].sort((a, b) => b.hora.localeCompare(a.hora)).map(pedido => {
                  const mesa   = mesas.find(m => m.id === pedido.mesaId)
                  const garcon = garcons.find(g => g.id === pedido.garconId)
                  const total  = valorPedidoCalc(pedido, pratos)
                  const etapaSolida = etapas.find(e => e.id === pedido.status)
                  const sCor = pedido.cancelado ? '#ef4444' : pedido.pago ? '#16a34a' : etapaSolida?.cor || 'var(--text-muted)'
                  const sLabel = pedido.cancelado ? 'Cancelado' : pedido.pago ? 'Pago' : etapaSolida?.label || pedido.status
                  const totalQtd = (pedido.itens || []).reduce((s, i) => s + i.quantidade, 0)
                  const expandido = !!expandidosPedido[pedido.id]
                  return (
                    <div key={pedido.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${sCor}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        onClick={() => setExpandidosPedido(prev => ({ ...prev, [pedido.id]: !prev[pedido.id] }))}
                        style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{pedido.hora}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${sCor}22`, color: sCor }}>{sLabel}</span>
                          {mesa   && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{mesa.nome}</span>}
                          {garcon && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{garcon.nome}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalQtd} item{totalQtd !== 1 ? 's' : ''}</span>
                          {cfg.caixaMostrarPrecos && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                          {!pedido.pago && !pedido.cancelado && (
                            <button onClick={e => {
                              e.stopPropagation()
                              abrirPagamento(pedido.id, pedido.mesaId || null)
                            }} style={{ padding: '3px 10px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Check size={10} /> {pedido.mesaId ? 'Pagar Mesa' : 'Pago'}
                            </button>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{expandido ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {expandido && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-hover)' }}>
                          {pedido.itens?.map(item => {
                            const p = pratos.find(x => x.id === item.pratoId)
                            if (!p) return null
                            const extras = (item.opcoes || []).reduce((s, o) => s + (Number(o.precoExtra) || 0), 0)
                            return (
                              <div key={item.uid || item.pratoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>×{item.quantidade} {p.nome}</span>
                                  {item.opcoes?.map((o, i) => (
                                    <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', paddingLeft: 12 }}>· {o.nome}</span>
                                  ))}
                                </div>
                                {cfg.caixaMostrarPrecos && (
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {((p.precoVenda + extras) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          {pedido.obs && <p style={{ fontSize: 11, color: '#d97706', fontStyle: 'italic', margin: '4px 0 0' }}>"{pedido.obs}"</p>}
                          {/* Botões */}
                          {!pedido.cancelado && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                              {!pedido.pago && (
                                <button onClick={e => { e.stopPropagation(); cancelarPedido(pedido.id) }}
                                  style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                  Cancelar
                                </button>
                              )}
                              {!pedido.pago && pedido.status === lastStageId && (
                                <button onClick={e => { e.stopPropagation(); abrirPagamento(pedido.id, null) }}
                                  style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                  <Check size={11} style={{ display: 'inline', marginRight: 3 }} />Pago
                                </button>
                              )}
                              {!pedido.pago && cfg.caixaImpressaoAtivo && (
                                <button onClick={e => { e.stopPropagation(); imprimirPedido(pedido) }}
                                  style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                  🖨 Imprimir
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {pagarMesaConfirm?.pedidoId === pedido.id && mesa && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', background: 'rgba(22,163,74,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>✓ {mesa.nome} pago!</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Liberar a mesa?</span>
                          <button onClick={() => { setStatusMesa(mesa.id, 'livre'); setPagarMesaConfirm(null) }}
                            style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Deixar Livre
                          </button>
                          <button onClick={() => {
                            const temMais = pedidosHoje.some(p => p.mesaId === mesa.id && !p.pago && !p.cancelado)
                            if (!temMais) setStatusMesa(mesa.id, 'livre')
                            setPagarMesaConfirm(null)
                          }} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Manter Ocupada
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
        }
        return (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Local */}
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
                Local <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>({pedidosLocal.length})</span>
              </p>
              <ListaPedidos lista={pedidosLocal} />
            </div>
            {/* Delivery */}
            {pedidosDelivery.length > 0 && (
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
                  🛵 Delivery <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>({pedidosDelivery.length})</span>
                </p>
                <ListaPedidos lista={pedidosDelivery} />
              </div>
            )}
          {(pedidosHoje.some(p => !p.mesaId) || mesas.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Balcão */}
              {pedidosHoje.filter(p => !p.mesaId).length > 0 && (() => {
                const balcaoPedidos = pedidosHoje.filter(p => !p.mesaId)
                const naoPageos = balcaoPedidos.filter(p => !p.pago && !p.cancelado)
                const cor = naoPageos.length > 0 ? '#3b82f6' : '#16a34a'
                const sel = mesaAberSoPedidos === '__balcao__'
                return (
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
                      Balcão <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>({balcaoPedidos.length} pedido{balcaoPedidos.length !== 1 ? 's' : ''})</span>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div onClick={() => setMesaAberSoPedidos(sel ? null : '__balcao__')}
                          style={{ padding: '6px 13px', borderRadius: 10, width: 130, boxSizing: 'border-box', background: sel ? `${cor}25` : `${cor}15`, border: `1px solid ${cor}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Balcão</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{balcaoPedidos.length}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sel ? '▲' : '▼'}</span>
                        </div>
                        {sel && (
                          <div style={{ background: 'var(--bg-card)', border: `1px solid ${cor}33`, borderRadius: 10, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                            {[...balcaoPedidos].sort((a, b) => a.hora.localeCompare(b.hora)).map(pedido => {
                              const garconB = garcons.find(g => g.id === pedido.garconId)
                              const etapaSolida = etapas.find(e => e.id === pedido.status)
                              const sCor2 = pedido.cancelado ? '#ef4444' : pedido.pago ? '#16a34a' : etapaSolida?.cor || 'var(--text-muted)'
                              return (
                                <div key={pedido.id} style={{ borderLeft: `2px solid ${sCor2}`, paddingLeft: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{pedido.hora}</span>
                                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: `${sCor2}22`, color: sCor2, fontWeight: 700 }}>
                                      {pedido.cancelado ? 'Cancelado' : pedido.pago ? 'Pago' : etapaSolida?.label || pedido.status}
                                    </span>
                                    {garconB && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{garconB.nome}</span>}
                                  </div>
                                  {pedido.itens?.map(item => {
                                    const p = pratos.find(x => x.id === item.pratoId)
                                    if (!p) return null
                                    return <span key={item.uid || item.pratoId} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>×{item.quantidade} {p.nome}</span>
                                  })}
                                  {!pedido.cancelado && !pedido.pago && (
                                    <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                                      <button onClick={() => cancelarPedido(pedido.id)}
                                        style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                        Cancelar
                                      </button>
                                      <button onClick={() => abrirPagamento(pedido.id, null)}
                                        style={{ padding: '2px 8px', borderRadius: 5, border: 'none', background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                        Pago
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Mesas */}
              {mesas.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
                    Mesas <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>({mesas.length})</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {mesas.map(mesa => {
                      const cor = mesa.status === 'ocupada' ? '#ef4444' : mesa.status === 'reservada' ? '#f97316' : '#16a34a'
                      const selecionada = mesaAberSoPedidos === mesa.id
                      const pedidosMesa = pedidosHoje.filter(p => p.mesaId === mesa.id)
                      const naoPageosMesa = pedidosMesa.filter(p => !p.pago && !p.cancelado)
                      return (
                        <div key={mesa.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div onClick={() => setMesaAberSoPedidos(selecionada ? null : mesa.id)}
                            style={{ padding: '6px 13px', borderRadius: 10, width: 130, boxSizing: 'border-box', background: selecionada ? `${cor}25` : `${cor}15`, border: `1px solid ${cor}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>{mesa.nome}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: cor, flexShrink: 0 }}>{mesa.status === 'ocupada' ? 'Ocu.' : mesa.status === 'reservada' ? 'Res.' : 'Livre'}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{selecionada ? '▲' : '▼'}</span>
                          </div>
                          {selecionada && pedidosMesa.length > 0 && (
                            <div style={{ background: 'var(--bg-card)', border: `1px solid ${cor}33`, borderRadius: 10, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                              {naoPageosMesa.length > 0 && (
                                <button onClick={() => { pagarMesa(mesa.id); setPagarMesaConfirm({ pedidoId: '__mesa__' + mesa.id, mesaId: mesa.id }) }}
                                  style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={11} /> Pagar Tudo da Mesa
                                </button>
                              )}
                              {pagarMesaConfirm?.pedidoId === '__mesa__' + mesa.id && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '6px 8px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ Pago! Liberar mesa?</span>
                                  <button onClick={() => { setStatusMesa(mesa.id, 'livre'); setPagarMesaConfirm(null) }}
                                    style={{ padding: '2px 8px', borderRadius: 5, border: 'none', background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                    Deixar Livre
                                  </button>
                                  <button onClick={() => {
                                    const temMais = pedidosHoje.some(p => p.mesaId === mesa.id && !p.pago && !p.cancelado)
                                    if (!temMais) setStatusMesa(mesa.id, 'livre')
                                    setPagarMesaConfirm(null)
                                  }} style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                    Manter Ocupada
                                  </button>
                                </div>
                              )}
                              {[...pedidosMesa].sort((a, b) => a.hora.localeCompare(b.hora)).map(pedido => {
                                const etapaSolida = etapas.find(e => e.id === pedido.status)
                                const sCor2 = pedido.cancelado ? '#ef4444' : pedido.pago ? '#16a34a' : etapaSolida?.cor || 'var(--text-muted)'
                                return (
                                  <div key={pedido.id} style={{ borderLeft: `2px solid ${sCor2}`, paddingLeft: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{pedido.hora}</span>
                                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: `${sCor2}22`, color: sCor2, fontWeight: 700 }}>
                                        {pedido.cancelado ? 'Cancelado' : pedido.pago ? 'Pago' : etapaSolida?.label || pedido.status}
                                      </span>
                                    </div>
                                    {pedido.itens?.map(item => {
                                      const p = pratos.find(x => x.id === item.pratoId)
                                      if (!p) return null
                                      return <span key={item.uid || item.pratoId} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>×{item.quantidade} {p.nome}</span>
                                    })}
                                    {!pedido.cancelado && !pedido.pago && (
                                      <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                                        <button onClick={() => cancelarPedido(pedido.id)}
                                          style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                          Cancelar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {selecionada && pedidosMesa.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 13px' }}>Nenhum pedido para esta mesa hoje</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        )
      })() : (() => {
        /* Board de pedidos — Local + Delivery separados */
        const pedidosLocal    = pedidosHoje.filter(p => p.canal !== 'delivery')
        const pedidosDelivery = pedidosHoje.filter(p => p.canal === 'delivery')

        // Colunas de delivery: injeta "Saindo para Entregar" antes do último estágio
        const colunasDelivery = (() => {
          const base = [...colunasDef]
          const temSaindo = base.some(c => c.id === 'saindo')
          if (temSaindo) return base
          const lastIdx = base.length - 1
          const saindo = { id: 'saindo', label: 'Saindo para Entregar', cor: '#8b5cf6', bgCor: '#8b5cf61a', proximoStatus: base[lastIdx]?.id || null, proximoLabel: base[lastIdx] ? `→ ${base[lastIdx].label}` : null }
          const result = [...base.slice(0, lastIdx), saindo, base[lastIdx]]
          // Fix: atualiza a coluna anterior ao saindo (ex: 'pronto') para apontar para 'saindo'
          return result.map((c, i) => i === lastIdx - 1 ? { ...c, proximoStatus: 'saindo', proximoLabel: '→ Saindo para Entregar' } : c)
        })()

        function BoardColunas({ lista, titulo, icone, colunas, isDelivery }) {
          const cols = colunas || colunasDef
          return (
            <div style={{ marginBottom: 24 }}>
              {titulo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{icone} {titulo}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({lista.filter(p => !p.cancelado).length})</span>
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
                gap: 12,
                padding: '0 16px',
              }}>
                {cols.map(col => {
                  const isPrimeiro = col.id === cols[0]?.id
                  const isUltimo = col.id === cols[cols.length - 1]?.id
                  const cards = lista
                    .filter(p => {
                      const statusMatch = isPrimeiro
                        ? (p.status === col.id || p.status === 'pendente')
                        : p.status === col.id
                      return statusMatch && (!isUltimo || !p.pago)
                    })
                    .sort((a, b) => (a.timestamps?.[col.id] || a.timestamps?.novo || '').localeCompare(b.timestamps?.[col.id] || b.timestamps?.novo || ''))
                  return (
                    <div key={col.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 13px', borderRadius: '11px 11px 0 0',
                        background: col.bgCor, border: `1px solid ${col.cor}33`, borderBottom: 'none',
                      }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: col.cor }}>{col.label}</span>
                        <span style={{ minWidth: 24, height: 24, borderRadius: 20, background: col.cor, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px' }}>
                          {cards.length}
                        </span>
                      </div>
                      <div style={{
                        minHeight: 120, padding: 10,
                        background: 'var(--bg-hover)',
                        border: `1px solid ${col.cor}22`, borderTop: 'none',
                        borderRadius: '0 0 11px 11px',
                        display: 'flex', flexDirection: 'column', gap: 8,
                        maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
                      }}>
                        {cards.length === 0
                          ? <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>—</div>
                          : cards.map(pedido => {
                            const motoboy = motoboys?.find(m => m.id === pedido.motoboyId)
                            return (
                              <div key={pedido.id}>
                                <CardCaixa
                                  pedido={pedido}
                                  coluna={col}
                                  pratos={pratos}
                                  garcons={garcons}
                                  mesas={mesas}
                                  onAvancar={isDelivery ? handleAvancarDelivery : atualizarStatusPedido}
                                  onPagar={(id) => abrirPagamento(id, null)}
                                  onAceitar={(id) => isDelivery ? aceitarPedidoDelivery(id) : atualizarStatusPedido(id, 'preparando')}
                                  onCancelar={(id) => cancelarPedido(id)}
                                  cfg={cfg}
                                  isNovo={isPrimeiro && (Date.now() - new Date(pedido.timestamps?.novo || pedido.timestamps?.pendente).getTime()) < 300000}
                                />
                                {/* Entregador na coluna saindo */}
                                {col.id === 'saindo' && motoboy && (
                                  <div style={{ marginTop: -4, padding: '4px 10px', borderRadius: '0 0 10px 10px', background: `${motoboy.cor || '#8b5cf6'}18`, border: `1px solid ${motoboy.cor || '#8b5cf6'}33`, borderTop: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: motoboy.cor || '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 9, flexShrink: 0 }}>
                                      {motoboy.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: motoboy.cor || '#8b5cf6' }}>🛵 {motoboy.nome}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div style={{ paddingTop: 16 }}>
            <style>{`@keyframes pulseNovo { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)} 50%{box-shadow:0 0 0 8px rgba(22,163,74,0)} }`}</style>
            <BoardColunas lista={pedidosLocal} titulo="Local" icone="🍽️" />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 20px' }} />
            <BoardColunas lista={pedidosDelivery} titulo="Delivery" icone="🛵" colunas={colunasDelivery} isDelivery />
          </div>
        )
      })()}
    </div>
  )
}
