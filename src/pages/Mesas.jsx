import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, X, Check, Zap, BookMarked, BarChart2, Clock, User } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { formatarMoeda, hoje, formatarHora } from '../utils/formatacao.js'
import SeletorCliente from '../components/ui/SeletorCliente.jsx'

function formatarDuracao(minutos) {
  if (!minutos || minutos < 1) return '< 1min'
  if (minutos < 60) return `${Math.round(minutos)}min`
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}

function ModalMesa({ mesa, onSalvar, onFechar }) {
  const [nome, setNome] = useState(mesa?.nome || '')
  const [capacidade, setCapacidade] = useState(String(mesa?.capacidade || '4'))

  function salvar() {
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), capacidade: Number(capacidade) || 4 })
    onFechar()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 18, width: '100%', maxWidth: 340, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>
            {mesa ? 'Editar Mesa' : 'Nova Mesa'}
          </p>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 8, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nome / Número
            </label>
            <input className="input" placeholder="Ex: Mesa 1, Varanda, VIP..." value={nome} autoFocus
              onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvar()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Cadeiras:
            </label>
            <input className="input" type="number" min="1" max="50" placeholder="Qtd"
              value={capacidade} onChange={e => setCapacidade(e.target.value)}
              style={{ width: 80, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onFechar} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={!nome.trim()}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: nome.trim() ? 'var(--accent)' : 'var(--bg-hover)', color: nome.trim() ? '#fff' : 'var(--text-muted)', fontWeight: 700, cursor: nome.trim() ? 'pointer' : 'not-allowed', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalOcupar({ mesaNome, onConfirmar, onFechar }) {
  const [clienteId, setClienteId] = useState(null)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 18, width: '100%', maxWidth: 320, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>Ocupar {mesaNome}</p>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
            <X size={15} />
          </button>
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Nome do cliente (opcional)
        </label>
        <SeletorCliente clienteId={clienteId} onChange={setClienteId} placeholder="Selecionar cliente (opcional)" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Deixe em branco se não quiser identificar.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={() => onConfirmar(clienteId)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Check size={14} /> Ocupar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Mesas() {
  const { mesas, adicionarMesa, editarMesa, removerMesa, setStatusMesa, pagarMesa, pedidos, pratos, sessoesMesas, clientes } = useApp()
  const [aba, setAba] = useState('mesas')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)
  const [ocuparInfo, setOcuparInfo] = useState(null)
  const [qtdRapida, setQtdRapida] = useState('')
  const [prefixo, setPrefixo] = useState('Mesa')
  const [capacidadeRapida, setCapacidadeRapida] = useState(4)
  const [relDataInicio, setRelDataInicio] = useState(hoje())
  const [relDataFim, setRelDataFim] = useState(hoje())

  const livres    = mesas.filter(m => m.status === 'livre').length
  const reservadas = mesas.filter(m => m.status === 'reservada').length
  const ocupadas  = mesas.filter(m => m.status === 'ocupada').length

  function totalMesa(mesa) {
    if (mesa.status !== 'ocupada' || !mesa.inicioSessao) return 0
    return pedidos
      .filter(p => p.mesaId === mesa.id && !p.cancelado && (p.timestamps?.novo || (p.data + 'T' + (p.hora || '00:00') + ':00-03:00')) >= mesa.inicioSessao)
      .reduce((s, p) => s + (p.itens || []).reduce((ss, item) => {
        const prato = pratos.find(x => x.id === item.pratoId)
        const extras = (item.opcoes || []).reduce((e, o) => e + o.precoExtra, 0)
        return ss + ((prato?.precoVenda || 0) + extras) * item.quantidade
      }, 0), 0)
  }

  function itensMesa(mesa) {
    if (mesa.status !== 'ocupada' || !mesa.inicioSessao) return 0
    return pedidos
      .filter(p => p.mesaId === mesa.id && !p.cancelado && (p.timestamps?.novo || (p.data + 'T' + (p.hora || '00:00') + ':00-03:00')) >= mesa.inicioSessao)
      .reduce((s, p) => s + (p.itens || []).reduce((ss, i) => ss + i.quantidade, 0), 0)
  }

  function fecharModal() { setModal(false); setEditando(null) }

  function salvar(dados) {
    if (editando) editarMesa(editando.id, dados)
    else adicionarMesa(dados.nome, dados.capacidade)
  }

  function criarRapido() {
    const n = parseInt(qtdRapida)
    if (!n || n < 1 || n > 50) return
    const existentes = mesas.map(m => m.nome)
    let criadas = 0
    for (let i = 1; criadas < n; i++) {
      const nome = `${prefixo.trim() || 'Mesa'} ${i}`
      if (!existentes.includes(nome)) { adicionarMesa(nome, capacidadeRapida); criadas++ }
    }
    setQtdRapida('')
  }

  // Relatório
  const sessoesRelatorio = sessoesMesas
    .filter(s => { const d = s.fim?.split('T')[0]; return d && d >= relDataInicio && d <= relDataFim })
    .sort((a, b) => b.fim.localeCompare(a.fim))

  const totalRelatorio = sessoesRelatorio.reduce((s, sess) => s + sess.total, 0)
  const duracaoMediaMins = sessoesRelatorio.length > 0
    ? sessoesRelatorio.reduce((s, sess) => s + Math.floor((new Date(sess.fim) - new Date(sess.inicio)) / 60000), 0) / sessoesRelatorio.length
    : 0

  function periodoLabel(sessao) {
    const d = sessao.fim?.split('T')[0]
    if (!d) return ''
    if (d === hoje()) return 'Hoje'
    return d.slice(5).replace('-', '/')
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">
            {mesas.length} mesa{mesas.length !== 1 ? 's' : ''}
            {mesas.length > 0 && ` · ${livres} livre${livres !== 1 ? 's' : ''} · ${reservadas} reservada${reservadas !== 1 ? 's' : ''} · ${ocupadas} ocupada${ocupadas !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModal(true) }}>
          <Plus size={15} /> Nova Mesa
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 20 }}>
        {[
          { id: 'mesas', label: 'Mesas', icon: <Users size={14} /> },
          { id: 'relatorio', label: 'Relatório', icon: <BarChart2 size={14} /> },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .12s',
              background: aba === a.id ? 'var(--bg-card)' : 'transparent',
              color: aba === a.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: aba === a.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
            {a.icon} {a.label}
            {a.id === 'relatorio' && sessoesMesas.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '0 6px', minWidth: 18, textAlign: 'center' }}>
                {sessoesMesas.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'mesas' && (
        <>
          {/* Criação rápida */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Criar em lote:</span>
            </div>
            <input className="input" placeholder="Prefixo" value={prefixo} onChange={e => setPrefixo(e.target.value)} style={{ width: 100 }} />
            <input className="input" type="number" min="1" max="50" placeholder="Qtd" value={qtdRapida}
              onChange={e => setQtdRapida(e.target.value)} onKeyDown={e => e.key === 'Enter' && criarRapido()} style={{ width: 64 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Cadeiras:</span>
              <input className="input" type="number" min="1" max="50" placeholder="Qtd"
                value={String(capacidadeRapida)}
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (!e.target.value) return setCapacidadeRapida(4)
                  if (v > 0) setCapacidadeRapida(v)
                }}
                style={{ width: 64, textAlign: 'center', fontSize: 12 }} />
            </div>
            <button className="btn btn-secondary" onClick={criarRapido} disabled={!qtdRapida || parseInt(qtdRapida) < 1} style={{ fontSize: 12 }}>
              Criar
            </button>
          </div>

          {/* Grid de mesas — quadradinhos */}
          {mesas.length === 0 ? (
            <div className="card text-center" style={{ padding: '48px 24px' }}>
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma mesa cadastrada</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Use a criação em lote acima ou clique em Nova Mesa.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
              {mesas.map(mesa => {
                const livre    = mesa.status === 'livre'
                const reservada = mesa.status === 'reservada'
                const ocupada  = mesa.status === 'ocupada'
                const borderColor = ocupada ? '#ef4444' : reservada ? '#f97316' : '#16a34a'
                const total = totalMesa(mesa)
                const itens = itensMesa(mesa)
                const durAtual = mesa.inicioSessao
                  ? Math.floor((Date.now() - new Date(mesa.inicioSessao)) / 60000)
                  : null

                return (
                  <div key={mesa.id} style={{
                    minHeight: 210,
                    background: 'var(--bg-card)',
                    border: `2.5px solid ${borderColor}`,
                    borderRadius: 16,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'border-color .15s',
                  }}>
                    {/* Topo: ações */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexShrink: 0 }}>
                      <button onClick={() => { setEditando(mesa); setModal(true) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 3, borderRadius: 5, display: 'flex' }}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => setConfirmarId(mesa.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3, borderRadius: 5, display: 'flex' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Centro: nome + status */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0, textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mesa.nome}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users size={9} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mesa.capacidade} lug.</span>
                      </div>

                      {/* Badge de status */}
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, marginTop: 2,
                        background: ocupada ? 'rgba(239,68,68,0.12)' : reservada ? 'rgba(249,115,22,0.12)' : 'rgba(22,163,74,0.12)',
                        color: ocupada ? '#ef4444' : reservada ? '#f97316' : '#16a34a',
                      }}>
                        {ocupada ? 'Ocupada' : reservada ? 'Reservada' : 'Livre'}
                      </span>

                      {/* Nome do cliente */}
                      {mesa.nomeCliente && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: '100%' }}>
                          <User size={9} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mesa.nomeCliente}
                          </span>
                        </div>
                      )}

                      {/* Consumo atual */}
                      {ocupada && (
                        <div style={{ textAlign: 'center', marginTop: 2 }}>
                          {itens > 0 && (
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 1px' }}>{itens} item{itens !== 1 ? 's' : ''}</p>
                          )}
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#3b82f6', margin: 0 }}>
                            {total > 0 ? formatarMoeda(total) : '—'}
                          </p>
                          {durAtual !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 1 }}>
                              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatarDuracao(durAtual)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões de status */}
                    <div style={{ flexShrink: 0 }}>
                      {livre && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setStatusMesa(mesa.id, 'reservada')}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <BookMarked size={9} /> Reservar
                          </button>
                          <button onClick={() => setOcuparInfo({ id: mesa.id, nome: mesa.nome })}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                            Ocupar
                          </button>
                        </div>
                      )}
                      {reservada && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setStatusMesa(mesa.id, 'livre')}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                            Cancelar
                          </button>
                          <button onClick={() => setOcuparInfo({ id: mesa.id, nome: mesa.nome })}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                            Ocupar
                          </button>
                        </div>
                      )}
                      {ocupada && (
                        <button onClick={() => pagarMesa(mesa.id)}
                          style={{ width: '100%', padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Check size={10} /> Pago
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {aba === 'relatorio' && (
        <div>
          {/* Filtro de período */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Hoje', fn: () => { setRelDataInicio(hoje()); setRelDataFim(hoje()) } },
                  { label: 'Esta semana', fn: () => { const d = new Date(); const dow = d.getDay(); const diff = d.getDate() - (dow === 0 ? 6 : dow - 1); d.setDate(diff); const ini = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; setRelDataInicio(ini); setRelDataFim(hoje()) } },
              { label: 'Este mês', fn: () => { const d = new Date(); setRelDataInicio(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`); setRelDataFim(hoje()) } },
            ].map(b => (
              <button key={b.label} onClick={b.fn} className="btn btn-secondary" style={{ fontSize: 12 }}>{b.label}</button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" className="input text-xs" value={relDataInicio} onChange={e => setRelDataInicio(e.target.value)} style={{ width: 140 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>até</span>
              <input type="date" className="input text-xs" value={relDataFim} onChange={e => setRelDataFim(e.target.value)} style={{ width: 140 }} />
            </div>
          </div>

          {/* Resumo */}
          {sessoesRelatorio.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Sessões', valor: sessoesRelatorio.length, cor: 'var(--text-primary)', fmt: v => v },
                { label: 'Receita total', valor: totalRelatorio, cor: '#3b82f6', fmt: formatarMoeda },
                { label: 'Duração média', valor: duracaoMediaMins, cor: '#f59e0b', fmt: formatarDuracao },
              ].map(({ label, valor, cor, fmt }) => (
                <div key={label} className="card p-4">
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: cor, margin: 0 }}>{fmt(valor)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabela de sessões */}
          <div className="card p-0 overflow-hidden">
            {sessoesRelatorio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <BarChart2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma sessão no período</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>As sessões aparecem aqui quando uma mesa é marcada como livre após ter sido ocupada.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mesa</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Duração</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessoesRelatorio.map(sess => {
                      const durMins = Math.floor((new Date(sess.fim) - new Date(sess.inicio)) / 60000)
                      return (
                        <tr key={sess.id}>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sess.mesaNome}</span>
                          </td>
                          <td>
                            {sess.nomeCliente ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <User size={11} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{sess.nomeCliente}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{periodoLabel(sess)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                              <span className="font-mono text-sm" style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatarHora(sess.inicio)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatarHora(sess.fim)}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{formatarDuracao(durMins)}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#3b82f6' }}>
                            {sess.total > 0 ? formatarMoeda(sess.total) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmarId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setConfirmarId(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 300, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Excluir mesa?</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmarId(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={() => { removerMesa(confirmarId); setConfirmarId(null) }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && <ModalMesa mesa={editando} onSalvar={salvar} onFechar={fecharModal} />}

      {ocuparInfo && (
        <ModalOcupar
          mesaNome={ocuparInfo.nome}
          onConfirmar={clienteId => {
            const cliente = clientes.find(c => c.id === clienteId)
            setStatusMesa(ocuparInfo.id, 'ocupada', cliente?.nome || null)
            setOcuparInfo(null)
          }}
          onFechar={() => setOcuparInfo(null)}
        />
      )}
    </div>
  )
}
