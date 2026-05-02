import { useEffect, useMemo, useState } from 'react'
import {
  Users, TrendingUp, DollarSign, ChevronDown, ChevronUp, ShieldCheck,
  Calendar, Trash2, UserPlus, KeyRound, CreditCard, Package, Plus,
  CheckCircle2, Clock, XCircle, BarChart3, Pencil, X, Plug, Tag,
  AlertTriangle, Webhook,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'
import { formatarMoeda, hoje } from '../utils/formatacao.js'

// ── Helpers ────────────────────────────────────────────────────────────────
function lerLS(chave, padrao = []) {
  try { return JSON.parse(localStorage.getItem(chave) ?? 'null') ?? padrao }
  catch { return padrao }
}
function salvarLS(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)) } catch {}
}

// ── Helpers de data ────────────────────────────────────────────────────────
function isoDate(d) { return d.toISOString().slice(0, 10) }
function filtroPresets() {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  const inicioSemana = new Date(now); inicioSemana.setDate(now.getDate() - now.getDay())
  const fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate() + 6)
  const mesPassadoIni = new Date(y, m - 1, 1)
  const mesPassadoFim = new Date(y, m, 0)
  return [
    { label: 'Hoje',        de: isoDate(now),          ate: isoDate(now) },
    { label: 'Esta semana', de: isoDate(inicioSemana),  ate: isoDate(fimSemana) },
    { label: 'Este mês',    de: `${y}-${String(m+1).padStart(2,'0')}-01`, ate: isoDate(new Date(y, m+1, 0)) },
    { label: 'Mês passado', de: isoDate(mesPassadoIni), ate: isoDate(mesPassadoFim) },
    { label: 'Este ano',    de: `${y}-01-01`,           ate: `${y}-12-31` },
    { label: 'Tudo',        de: '',                     ate: '' },
  ]
}

// Filtro de datas reutilizável
function FiltroDatas({ value, onChange }) {
  const presets = filtroPresets()
  const ativoIdx = presets.findIndex(p => p.de === value.de && p.ate === value.ate)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Atalhos */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {presets.map((p, i) => (
          <button key={p.label} onClick={() => onChange({ de: p.de, ate: p.ate })}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 600,
              background: i === ativoIdx ? 'var(--accent)' : 'var(--bg-hover)',
              color: i === ativoIdx ? '#fff' : 'var(--text-muted)',
            }}>
            {p.label}
          </button>
        ))}
      </div>
      {/* Range customizado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
        <input type="date" className="input" style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
          value={value.de} onChange={e => onChange({ ...value, de: e.target.value })} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>até</span>
        <input type="date" className="input" style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
          value={value.ate} onChange={e => onChange({ ...value, ate: e.target.value })} />
        {(value.de || value.ate) && (
          <button onClick={() => onChange({ de: '', ate: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// Agrupa entradas_vendas por user_id e calcula faturamento com filtro de datas
function calcularStatsSupabase(todasVendas, userId, filtro = { de: '', ate: '' }) {
  const vendas = todasVendas.filter(v => {
    if (v.user_id !== userId) return false
    if (filtro.de && v.data < filtro.de) return false
    if (filtro.ate && v.data > filtro.ate) return false
    return true
  })
  const vendasTodas = todasVendas.filter(v => v.user_id === userId)
  let fatPeriodo = 0, fatTotal = 0, vendasPeriodo = 0, vendasTotal = 0
  for (const v of vendas) {
    const receita = ((v.preco_venda_unit || 0) + (v.extras_unit || 0)) * (v.quantidade || 0)
    fatPeriodo += receita; vendasPeriodo += Number(v.quantidade || 0)
  }
  for (const v of vendasTodas) {
    const receita = ((v.preco_venda_unit || 0) + (v.extras_unit || 0)) * (v.quantidade || 0)
    fatTotal += receita; vendasTotal += Number(v.quantidade || 0)
  }
  return { fatPeriodo, fatTotal, vendasPeriodo, vendasTotal }
}

// ── Status do plano ────────────────────────────────────────────────────────
function statusPlano(u) {
  if (!u.plano_ativo) return null
  if (!u.plano_fim) return { tipo: 'ativo', label: u.plano_ativo }
  const fim = new Date(u.plano_fim)
  const hoje2 = new Date()
  const diasRestantes = Math.ceil((fim - hoje2) / (1000 * 60 * 60 * 24))
  if (diasRestantes < 0)  return { tipo: 'expirado',  label: u.plano_ativo, diasRestantes }
  if (diasRestantes <= 7) return { tipo: 'expirando', label: u.plano_ativo, diasRestantes }
  return { tipo: 'ativo', label: u.plano_ativo, diasRestantes }
}

// ── Sub-componentes ────────────────────────────────────────────────────────
function StatCard({ label, valor, cor = '#3b82f6', sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: cor }}>{valor}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

const STATUS_MAP = {
  pago:      { label: 'Pago',      cor: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: CheckCircle2 },
  pendente:  { label: 'Pendente',  cor: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  cancelado: { label: 'Cancelado', cor: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
}

function BadgeStatus({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pendente
  const Icon = s.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.cor }}>
      <Icon size={10} /> {s.label}
    </span>
  )
}

function BadgePlano({ status }) {
  if (!status) return null
  const cores = {
    ativo:     { bg: 'rgba(34,197,94,0.12)',  cor: '#16a34a' },
    expirando: { bg: 'rgba(245,158,11,0.15)', cor: '#d97706' },
    expirado:  { bg: 'rgba(239,68,68,0.12)',  cor: '#ef4444' },
  }
  const { bg, cor } = cores[status.tipo] || cores.ativo
  const texto = status.tipo === 'ativo' && status.diasRestantes
    ? `${status.label} · ${status.diasRestantes}d`
    : status.tipo === 'expirando'
    ? `${status.label} · vence em ${status.diasRestantes}d`
    : status.tipo === 'expirado'
    ? `${status.label} · EXPIRADO`
    : status.label
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color: cor, fontWeight: 700 }}>{texto}</span>
}

const PLANOS_PADRAO = [
  { id: 'p1', nome: 'Básico',       preco: 49.90,  periodo: 'mensal',     descricao: 'Até 50 pedidos/dia',   ativo: true },
  { id: 'p2', nome: 'Profissional', preco: 99.90,  periodo: 'mensal',     descricao: 'Pedidos ilimitados',   ativo: true },
  { id: 'p3', nome: 'Trimestral',   preco: 269.90, periodo: 'trimestral', descricao: 'Equivale a R$90/mês',  ativo: true },
  { id: 'p4', nome: 'Anual',        preco: 899.90, periodo: 'anual',      descricao: 'Equivale a R$75/mês',  ativo: true },
]

function Modal({ titulo, onClose, children, largura = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: largura, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Modal: Configurar Plano do Usuário ────────────────────────────────────
function ModalPlanoUsuario({ usuario, planos, onClose, onSalvo }) {
  const planosAtivos = planos.filter(p => p.ativo)
  const [form, setForm] = useState({
    plano_ativo:  usuario.plano_ativo  || '',
    plano_inicio: usuario.plano_inicio || hoje(),
    plano_fim:    usuario.plano_fim    || '',
    desconto_pct: usuario.desconto_pct || 0,
    obs_admin:    usuario.obs_admin    || '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const nomeExibir = usuario.username || usuario.nome_exibicao || usuario.email || '?'

  function adicionarMeses(meses) {
    const base = form.plano_inicio ? new Date(form.plano_inicio) : new Date()
    base.setMonth(base.getMonth() + meses)
    setForm(f => ({ ...f, plano_fim: base.toISOString().slice(0, 10) }))
  }

  function precoComDesconto() {
    const plano = planosAtivos.find(p => p.nome === form.plano_ativo)
    if (!plano || !form.desconto_pct) return null
    const desc = plano.preco * (form.desconto_pct / 100)
    return plano.preco - desc
  }

  async function salvar() {
    setSalvando(true); setErro('')
    const { error } = await supabase.rpc('admin_update_user_plan', {
      target_user_id: usuario.id,
      p_plano_ativo:  form.plano_ativo  || null,
      p_plano_inicio: form.plano_inicio || null,
      p_plano_fim:    form.plano_fim    || null,
      p_desconto_pct: Number(form.desconto_pct) || 0,
      p_obs_admin:    form.obs_admin    || null,
    })
    setSalvando(false)
    if (error) return setErro('Erro ao salvar: ' + error.message)
    onSalvo()
    onClose()
  }

  const precoDiplay = precoComDesconto()

  return (
    <Modal titulo={`Plano — ${nomeExibir}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plano ativo</label>
          <select className="input" value={form.plano_ativo} onChange={e => setForm(f => ({ ...f, plano_ativo: e.target.value }))}>
            <option value="">Sem plano</option>
            {planosAtivos.map(p => (
              <option key={p.id} value={p.nome}>{p.nome} — {formatarMoeda(p.preco)}/{p.periodo}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Início</label>
            <input className="input" type="date" value={form.plano_inicio}
              onChange={e => setForm(f => ({ ...f, plano_inicio: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Vencimento</label>
            <input className="input" type="date" value={form.plano_fim}
              onChange={e => setForm(f => ({ ...f, plano_fim: e.target.value }))} />
          </div>
        </div>

        {/* Atalhos de prazo */}
        <div className="flex gap-2 flex-wrap">
          {[['+ 1 mês', 1], ['+ 3 meses', 3], ['+ 6 meses', 6], ['+ 1 ano', 12]].map(([label, m]) => (
            <button key={label} onClick={() => adicionarMeses(m)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', color: 'var(--text-primary)' }}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
            Desconto (%) {precoDiplay !== null && (
              <span style={{ color: '#16a34a', marginLeft: 8 }}>→ {formatarMoeda(precoDiplay)}</span>
            )}
          </label>
          <input className="input" type="number" min="0" max="100" placeholder="0"
            value={form.desconto_pct}
            onChange={e => setForm(f => ({ ...f, desconto_pct: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Observação (interna)</label>
          <input className="input" placeholder="Ex: cliente especial, parceiro, etc." value={form.obs_admin}
            onChange={e => setForm(f => ({ ...f, obs_admin: e.target.value }))} />
        </div>

        {erro && <p className="text-xs" style={{ color: '#ef4444' }}>{erro}</p>}
        <button className="btn btn-primary w-full mt-1" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar plano'}
        </button>
      </div>
    </Modal>
  )
}

// ── Aba Faturamento SaaS ───────────────────────────────────────────────────
function AbaFaturamento({ usuarios }) {
  const [pagamentos, setPagamentos] = useState(() => lerLS('saas_pagamentos', []))
  const [planos] = useState(() => lerLS('saas_planos', PLANOS_PADRAO))
  const [filtroFat, setFiltroFat] = useState(() => {
    const p = filtroPresets(); return p[2] // "Este mês" por padrão
  })
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const formVazio = { clienteId: '', clienteNome: '', plano: '', valor: '', desconto_pct: 0, valorFinal: '', data: hoje(), status: 'pago', plataforma: '', observacao: '' }
  const [form, setForm] = useState(formVazio)
  const [erroForm, setErroForm] = useState('')

  function calcValorFinal(valor, desconto) {
    const v = parseFloat(valor) || 0
    const d = parseFloat(desconto) || 0
    return v > 0 ? (v - v * d / 100).toFixed(2) : ''
  }

  function salvar() {
    if (!form.clienteNome.trim()) return setErroForm('Informe o cliente.')
    if (!form.plano.trim()) return setErroForm('Informe o plano.')
    if (!form.valorFinal || isNaN(+form.valorFinal) || +form.valorFinal <= 0) return setErroForm('Valor inválido.')
    const entrada = { ...form, id: editando?.id || crypto.randomUUID(), valor: +form.valorFinal }
    const next = editando
      ? pagamentos.map(p => p.id === editando.id ? entrada : p)
      : [entrada, ...pagamentos]
    setPagamentos(next); salvarLS('saas_pagamentos', next)
    setModalAberto(false); setEditando(null); setForm(formVazio); setErroForm('')
  }

  function excluir(id) {
    if (!window.confirm('Remover este pagamento?')) return
    const next = pagamentos.filter(p => p.id !== id)
    setPagamentos(next); salvarLS('saas_pagamentos', next)
  }

  function abrirEditar(p) {
    setEditando(p)
    setForm({ ...p, valor: String(p.valor), valorFinal: String(p.valor), desconto_pct: p.desconto_pct || 0 })
    setModalAberto(true)
  }

  const pagFiltrados = pagamentos.filter(p => {
    if (filtroFat.de && p.data < filtroFat.de) return false
    if (filtroFat.ate && p.data > filtroFat.ate) return false
    return true
  })
  const receitaPeriodo = pagFiltrados.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)
  const receitaTotal   = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)
  const pendentes      = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0)
  const clientesAtivos = [...new Set(pagFiltrados.filter(p => p.status === 'pago').map(p => p.clienteNome || p.clienteId))].length
  const labelFat = filtroFat.de && filtroFat.ate
    ? `${filtroFat.de.split('-').reverse().join('/')} – ${filtroFat.ate.split('-').reverse().join('/')}`
    : filtroFat.de ? `a partir de ${filtroFat.de.split('-').reverse().join('/')}` : 'Tudo'

  const grafico = useMemo(() => {
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const mes = d.toISOString().slice(0, 7)
      const label = d.toLocaleString('pt-BR', { month: 'short' })
      const valor = pagamentos.filter(p => p.status === 'pago' && p.data?.startsWith(mes)).reduce((s, p) => s + p.valor, 0)
      meses.push({ mes, label, valor })
    }
    return meses
  }, [pagamentos])
  const maxGrafico = Math.max(...grafico.map(m => m.valor), 1)
  const mesAtual = hoje().slice(0, 7)

  return (
    <div>
      {/* Filtro de datas */}
      <div className="card p-4 mb-4">
        <FiltroDatas value={filtroFat} onChange={setFiltroFat} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Receita do Período" valor={formatarMoeda(receitaPeriodo)} cor="#3b82f6" sub={labelFat} />
        <StatCard label="Receita Total" valor={formatarMoeda(receitaTotal)} cor="#7c3aed" sub="todos os tempos" />
        <StatCard label="Clientes Ativos" valor={clientesAtivos} cor="#16a34a" sub={`pagantes — ${labelFat}`} />
        <StatCard label="Aguardando" valor={formatarMoeda(pendentes)} cor="#f59e0b" sub="pagamentos pendentes" />
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={15} style={{ color: '#3b82f6' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Receita — últimos 6 meses</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
          {grafico.map(m => {
            const pct = maxGrafico > 0 ? (m.valor / maxGrafico) * 100 : 0
            const isCurrent = m.mes === mesAtual
            return (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {m.valor > 0 ? formatarMoeda(m.valor).replace('R$ ', '') : ''}
                </span>
                <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', borderRadius: '5px 5px 0 0', height: `${Math.max(pct, m.valor > 0 ? 6 : 2)}%`, background: isCurrent ? '#3b82f6' : 'var(--border)', transition: 'height 0.3s' }} />
                </div>
                <span style={{ fontSize: 10, color: isCurrent ? '#3b82f6' : 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400 }}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: '#7c3aed' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Histórico de Pagamentos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>{pagFiltrados.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { setEditando(null); setForm(formVazio); setModalAberto(true) }}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
        </div>

        {pagFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum pagamento registrado</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Adicione manualmente ou conecte uma plataforma de pagamento.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Cliente', 'Plano', 'Desconto', 'Valor', 'Status', 'Plataforma', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagFiltrados.sort((a, b) => (b.data || '').localeCompare(a.data || '')).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.data ? p.data.split('-').reverse().join('/') : '-'}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.clienteNome || p.clienteId || '-'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.plano || '-'}</td>
                    <td style={{ padding: '10px', color: '#f59e0b', fontSize: 12 }}>{p.desconto_pct > 0 ? `-${p.desconto_pct}%` : <span style={{ opacity: 0.3 }}>—</span>}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{formatarMoeda(p.valor)}</td>
                    <td style={{ padding: '10px' }}><BadgeStatus status={p.status} /></td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: 12 }}>{p.plataforma || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td style={{ padding: '10px' }}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Pencil size={13} /></button>
                        <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <Modal titulo={editando ? 'Editar Pagamento' : 'Registrar Pagamento'} onClose={() => { setModalAberto(false); setEditando(null); setErroForm('') }}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Cliente *</label>
              {usuarios.length > 0 && (
                <select className="input mb-2" value={form.clienteId}
                  onChange={e => {
                    const u = usuarios.find(x => x.id === e.target.value)
                    setForm(f => ({ ...f, clienteId: e.target.value, clienteNome: u?.username || u?.nome_exibicao || u?.email || '' }))
                  }}>
                  <option value="">Selecionar usuário...</option>
                  {usuarios.filter(u => !u.is_admin).map(u => (
                    <option key={u.id} value={u.id}>{u.username || u.nome_exibicao || u.email}</option>
                  ))}
                </select>
              )}
              <input className="input" placeholder="Nome manual" value={form.clienteNome}
                onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plano *</label>
                <select className="input" value={form.plano} onChange={e => {
                  const pl = planos.find(p => p.nome === e.target.value)
                  const novoValor = pl ? String(pl.preco) : form.valor
                  const final = calcValorFinal(novoValor, form.desconto_pct)
                  setForm(f => ({ ...f, plano: e.target.value, valor: novoValor, valorFinal: final }))
                }}>
                  <option value="">Selecionar...</option>
                  {planos.filter(p => p.ativo).map(p => (
                    <option key={p.id} value={p.nome}>{p.nome} — {formatarMoeda(p.preco)}</option>
                  ))}
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div style={{ width: 90 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Desconto %</label>
                <input className="input" type="number" min="0" max="100" placeholder="0" value={form.desconto_pct}
                  onChange={e => {
                    const desc = e.target.value
                    setForm(f => ({ ...f, desconto_pct: desc, valorFinal: calcValorFinal(f.valor, desc) }))
                  }} />
              </div>
              <div style={{ width: 110 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Valor final {form.desconto_pct > 0 && <span style={{ color: '#16a34a' }}>✓</span>}
                </label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.valorFinal}
                  onChange={e => setForm(f => ({ ...f, valorFinal: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Data</label>
                <input className="input" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plataforma</label>
              <select className="input" value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value }))}>
                <option value="">Não definida</option>
                <option value="Stripe">Stripe</option>
                <option value="Hotmart">Hotmart</option>
                <option value="Kiwify">Kiwify</option>
                <option value="CartPanda">CartPanda</option>
                <option value="Cakto">Cakto</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Observação</label>
              <input className="input" placeholder="Ex: renovação, desconto especial..." value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
            {erroForm && <p className="text-xs" style={{ color: '#ef4444' }}>{erroForm}</p>}
            <button className="btn btn-primary w-full mt-1" onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Registrar pagamento'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Aba Planos ─────────────────────────────────────────────────────────────
function AbaPlanos() {
  const [planos, setPlanos] = useState(() => lerLS('saas_planos', PLANOS_PADRAO))
  const [apiConfig, setApiConfig] = useState(() => lerLS('saas_api_config', { plataforma: '', webhook_secret: '', api_key: '', api_url: '' }))
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const formVazio = { nome: '', preco: '', periodo: 'mensal', descricao: '', plataforma: '', produto_id: '', ativo: true }
  const [form, setForm] = useState(formVazio)
  const [erroForm, setErroForm] = useState('')

  function salvar() {
    if (!form.nome.trim()) return setErroForm('Informe o nome.')
    if (!form.preco || isNaN(+form.preco) || +form.preco <= 0) return setErroForm('Valor inválido.')
    const entrada = { ...form, id: editando?.id || crypto.randomUUID(), preco: +form.preco }
    const next = editando ? planos.map(p => p.id === editando.id ? entrada : p) : [...planos, entrada]
    setPlanos(next); salvarLS('saas_planos', next)
    setModalAberto(false); setEditando(null); setForm(formVazio); setErroForm('')
  }

  function excluir(id) {
    if (!window.confirm('Excluir este plano?')) return
    const next = planos.filter(p => p.id !== id)
    setPlanos(next); salvarLS('saas_planos', next)
  }

  function toggleAtivo(id) {
    const next = planos.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p)
    setPlanos(next); salvarLS('saas_planos', next)
  }

  function salvarApi() {
    salvarLS('saas_api_config', apiConfig)
    alert('Configurações salvas!')
  }

  const instrucoes = {
    Stripe: {
      webhook: 'Dashboard Stripe → Developers → Webhooks → Add endpoint\nEvento: checkout.session.completed',
      link: 'https://dashboard.stripe.com/webhooks',
    },
    Hotmart: {
      webhook: 'Hotmart → Ferramentas → Webhooks → Novo webhook\nEvento: PURCHASE_APPROVED',
      link: 'https://app.hotmart.com/tools/webhooks',
    },
    Kiwify: {
      webhook: 'Kiwify → Configurações → Webhooks\nEvento: order_approved',
      link: 'https://dashboard.kiwify.com.br',
    },
    CartPanda: {
      webhook: 'CartPanda → Configurações → Notificações → Webhooks',
      link: 'https://app.cartpanda.com',
    },
    Cakto: {
      webhook: 'Cakto → Conta → Webhooks → Adicionar\nEvento: payment.approved',
      link: 'https://app.cakto.com.br',
    },
  }

  const instr = instrucoes[apiConfig.plataforma]

  return (
    <div>
      {/* Lista de Planos */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={15} style={{ color: '#7c3aed' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Planos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>{planos.length}</span>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { setEditando(null); setForm(formVazio); setModalAberto(true) }}>
            <Plus size={13} /> Novo Plano
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {planos.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', opacity: p.ativo ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.nome}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: p.periodo === 'anual' ? 'rgba(234,179,8,0.15)' : p.periodo === 'trimestral' ? 'rgba(168,85,247,0.12)' : 'rgba(59,130,246,0.12)',
                    color: p.periodo === 'anual' ? '#ca8a04' : p.periodo === 'trimestral' ? '#9333ea' : '#3b82f6',
                    fontWeight: 700,
                  }}>{p.periodo}</span>
                  {p.plataforma && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 600 }}>
                      {p.plataforma}
                    </span>
                  )}
                  {!p.ativo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Inativo</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.descricao && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.descricao}</p>}
                  {p.produto_id && <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {p.produto_id}</p>}
                </div>
              </div>
              <p className="font-bold text-base shrink-0" style={{ color: '#16a34a' }}>{formatarMoeda(p.preco)}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleAtivo(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} title={p.ativo ? 'Desativar' : 'Ativar'}>
                  {p.ativo ? <CheckCircle2 size={15} style={{ color: '#22c55e' }} /> : <XCircle size={15} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => { setEditando(p); setForm({ ...p, preco: String(p.preco) }); setModalAberto(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Pencil size={13} /></button>
                <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integração de pagamento */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plug size={15} style={{ color: '#f59e0b' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Integração de Pagamento</h3>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plataforma</label>
            <select className="input" value={apiConfig.plataforma}
              onChange={e => setApiConfig(c => ({ ...c, plataforma: e.target.value }))}>
              <option value="">Selecionar plataforma...</option>
              {['Stripe', 'Hotmart', 'Kiwify', 'CartPanda', 'Cakto'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {apiConfig.plataforma && (
            <>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>API Key / Token de acesso</label>
                <input className="input" type="password" placeholder="Cole sua chave aqui..." value={apiConfig.api_key}
                  onChange={e => setApiConfig(c => ({ ...c, api_key: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Webhook Secret</label>
                <input className="input" type="password" placeholder="Secret para validar assinatura do webhook" value={apiConfig.webhook_secret}
                  onChange={e => setApiConfig(c => ({ ...c, webhook_secret: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>URL do seu webhook (configure na plataforma)</label>
                <div className="flex gap-2">
                  <input className="input" readOnly value={`https://api.cheffya.com.br/webhook/${(apiConfig.plataforma || '').toLowerCase()}`}
                    style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }} />
                  <button className="btn" style={{ shrink: 0, whiteSpace: 'nowrap', fontSize: 12 }}
                    onClick={() => navigator.clipboard?.writeText(`https://api.cheffya.com.br/webhook/${(apiConfig.plataforma || '').toLowerCase()}`)}>
                    Copiar
                  </button>
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={salvarApi}>
            Salvar configurações
          </button>
        </div>

        {/* Instruções por plataforma */}
        {instr && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Webhook size={13} style={{ color: '#f59e0b' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Como configurar no {apiConfig.plataforma}</p>
            </div>
            <pre style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{instr.webhook}</pre>
            <a href={instr.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#3b82f6' }}>
              Abrir painel da {apiConfig.plataforma} →
            </a>
          </div>
        )}

        {!apiConfig.plataforma && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 4 }}>
            {['Stripe', 'Hotmart', 'Kiwify', 'CartPanda', 'Cakto'].map(pl => (
              <button key={pl} onClick={() => setApiConfig(c => ({ ...c, plataforma: pl }))}
                style={{ padding: '10px', borderRadius: 10, border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer', background: 'none' }}>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{pl}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Configurar</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <Modal titulo={editando ? 'Editar Plano' : 'Novo Plano'} onClose={() => { setModalAberto(false); setEditando(null); setErroForm('') }}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Nome *</label>
              <input className="input" placeholder="Ex: Profissional" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Preço (R$) *</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="99,90" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Período</label>
                <select className="input" value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                  <option value="unico">Pagamento único</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Descrição</label>
              <input className="input" placeholder="Ex: Pedidos ilimitados..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>

            {/* Plataforma + ID do produto */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Plataforma de pagamento</p>
              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plataforma</label>
                  <select className="input" value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value }))}>
                    <option value="">Nenhuma</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Hotmart">Hotmart</option>
                    <option value="Kiwify">Kiwify</option>
                    <option value="CartPanda">CartPanda</option>
                    <option value="Cakto">Cakto</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                    ID do produto na plataforma
                  </label>
                  <input className="input" placeholder={
                    form.plataforma === 'Stripe' ? 'price_1ABC...' :
                    form.plataforma === 'Hotmart' ? 'P12345' :
                    form.plataforma === 'Kiwify' ? 'prod_abc...' :
                    'ID do produto'
                  } value={form.produto_id} onChange={e => setForm(f => ({ ...f, produto_id: e.target.value }))} />
                </div>
              </div>
              {form.plataforma && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {form.plataforma === 'Stripe' && '📌 Stripe: Dashboard → Products → seu produto → copie o Price ID (price_...)'}
                  {form.plataforma === 'Hotmart' && '📌 Hotmart: Produtos → seu produto → a URL contém o ID (ex: /product/P12345)'}
                  {form.plataforma === 'Kiwify' && '📌 Kiwify: Produtos → seu produto → Configurações → copie o Product ID'}
                  {form.plataforma === 'CartPanda' && '📌 CartPanda: Produtos → seu produto → copie o ID da URL'}
                  {form.plataforma === 'Cakto' && '📌 Cakto: Produtos → seu produto → copie o ID do produto'}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Plano ativo</span>
            </label>
            {erroForm && <p className="text-xs" style={{ color: '#ef4444' }}>{erroForm}</p>}
            <button className="btn btn-primary w-full mt-1" onClick={salvar}>{editando ? 'Salvar' : 'Criar plano'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Modal de confirmação para apagar conta ────────────────────────────────
function ModalApagarUsuario({ usuario, onClose, onConfirmado }) {
  const [texto, setTexto] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState('')
  const nome = usuario.username || usuario.nome_exibicao || usuario.email || '?'
  const valido = texto.trim().toLowerCase() === 'confirmar'

  async function handleApagar() {
    if (!valido) return
    setApagando(true); setErro('')
    const res = await onConfirmado(usuario.id)
    setApagando(false)
    if (res?.erro) return setErro('Erro: ' + res.erro)
    onClose()
  }

  return (
    <Modal titulo="Apagar conta" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} style={{ color: '#ef4444' }} />
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>Ação irreversível</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Isso vai apagar permanentemente o perfil de <strong style={{ color: 'var(--text-primary)' }}>{nome}</strong> do banco de dados. Os dados do restaurante (cardápio, pedidos, etc.) vinculados a esta conta também serão removidos via RLS.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
            Digite <strong>confirmar</strong> para prosseguir
          </label>
          <input
            className="input"
            placeholder="confirmar"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            autoFocus
          />
        </div>
        {erro && <p className="text-xs" style={{ color: '#ef4444' }}>{erro}</p>}
        <button
          className="btn w-full"
          disabled={!valido || apagando}
          onClick={handleApagar}
          style={{
            background: valido ? '#ef4444' : 'var(--bg-hover)',
            color: valido ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: valido ? 'pointer' : 'not-allowed',
            fontWeight: 700, padding: '10px', borderRadius: 10, fontSize: 14,
            transition: 'all 0.15s',
          }}>
          {apagando ? 'Apagando...' : '🗑 Apagar conta permanentemente'}
        </button>
      </div>
    </Modal>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AdminPanel() {
  const { auth, authLoading, cadastrarUsuario, removerUsuario } = useApp()
  const [aba, setAba] = useState('restaurantes')
  const [expandido, setExpandido] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [todasVendas, setTodasVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalPlano, setModalPlano] = useState(null)
  const [modalApagar, setModalApagar] = useState(null) // usuario a apagar

  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaS, setNovaS] = useState('')
  const [erroU, setErroU] = useState('')
  const [okU, setOkU] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [planos] = useState(() => lerLS('saas_planos', PLANOS_PADRAO))

  // filtros de data
  const [filtroRest, setFiltroRest] = useState(() => {
    const p = filtroPresets(); return p[2] // "Este mês" por padrão
  })

  useEffect(() => { if (!authLoading && auth.isAdmin) carregarDados() }, [authLoading, auth.isAdmin])

  // ⚠️ useMemo DEVE ficar antes de qualquer early return (Rules of Hooks)
  const restaurantes = useMemo(() => {
    return usuarios
      .filter(u => !u.is_admin)
      .map(u => ({ ...u, stats: calcularStatsSupabase(todasVendas, u.id, filtroRest) }))
      .sort((a, b) => b.stats.fatTotal - a.stats.fatTotal)
  }, [usuarios, todasVendas, filtroRest])

  const totalGlobalFat     = restaurantes.reduce((s, r) => s + r.stats.fatTotal, 0)
  const totalGlobalPeriodo = restaurantes.reduce((s, r) => s + r.stats.fatPeriodo, 0)
  const labelPeriodo = filtroRest.de && filtroRest.ate
    ? `${filtroRest.de.split('-').reverse().join('/')} – ${filtroRest.ate.split('-').reverse().join('/')}`
    : filtroRest.de ? `a partir de ${filtroRest.de.split('-').reverse().join('/')}` : 'Tudo'

  async function carregarDados() {
    setCarregando(true)

    // select('*') pega todas as colunas que existem — funciona com ou sem colunas de plano
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('criado_em', { ascending: true })
    setUsuarios(profilesData || [])

    // Faturamento dos restaurantes (falha silenciosa se policy ainda não existe)
    const { data: vendasData } = await supabase
      .from('entradas_vendas')
      .select('user_id, quantidade, preco_venda_unit, extras_unit, data')
    if (vendasData) setTodasVendas(vendasData)

    setCarregando(false)
  }

  async function handleCadastrar() {
    setErroU('')
    if (!novoNome.trim()) return setErroU('Informe o nome de usuário.')
    if (!novoEmail.trim()) return setErroU('Informe o e-mail.')
    if (novaS.length < 6) return setErroU('Senha mínima: 6 caracteres.')
    setSalvando(true)
    const res = await cadastrarUsuario(novoEmail.trim(), novaS, novoNome.trim())
    setSalvando(false)
    if (res.erro === 'nome_em_uso') return setErroU('Este nome de usuário já está em uso.')
    if (res.erro === 'email_em_uso') return setErroU('Este e-mail já está cadastrado.')
    if (res.erro) return setErroU(res.erro)
    setNovoNome(''); setNovoEmail(''); setNovaS('')
    setOkU(true); setTimeout(() => setOkU(false), 2500)
    carregarDados()
  }

  if (authLoading) {
    return <div className="p-8 text-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p></div>
  }

  if (!auth.isAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck size={40} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Acesso restrito</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Apenas o administrador pode acessar esta página.</p>
      </div>
    )
  }

  const ABAS = [
    { id: 'restaurantes', label: 'Restaurantes',     icon: Users },
    { id: 'faturamento',  label: 'Faturamento SaaS', icon: CreditCard },
    { id: 'planos',       label: 'Planos',            icon: Package },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Painel Admin</h1>
            <p className="page-subtitle">Gestão completa do sistema Cheffya</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg-hover)', width: 'fit-content' }}>
        {ABAS.map(a => {
          const Icon = a.icon
          const ativo = aba === a.id
          return (
            <button key={a.id} onClick={() => setAba(a.id)} className="flex items-center gap-2"
              style={{ padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: ativo ? 'var(--bg-card)' : 'transparent', color: ativo ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: ativo ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s' }}>
              <Icon size={13} /> {a.label}
            </button>
          )
        })}
      </div>

      {/* ── ABA RESTAURANTES ── */}
      {aba === 'restaurantes' && (
        <>
          {/* Filtro de datas */}
          <div className="card p-4 mb-4">
            <FiltroDatas value={filtroRest} onChange={setFiltroRest} />
          </div>

          {/* KPIs globais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Restaurantes" valor={restaurantes.length} cor="var(--accent)" />
            <StatCard label="Fat. Período" valor={formatarMoeda(totalGlobalPeriodo)} cor="#3b82f6" sub={labelPeriodo} />
            <StatCard label="Fat. Total (tudo)" valor={formatarMoeda(totalGlobalFat)} cor="#7c3aed" />
            <StatCard label="Com plano ativo" valor={restaurantes.filter(r => r.plano_ativo && (!r.plano_fim || new Date(r.plano_fim) >= new Date())).length} cor="#16a34a" sub="assinantes" />
          </div>

          {carregando ? (
            <div className="card text-center py-10"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p></div>
          ) : restaurantes.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum restaurante cadastrado ainda</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {restaurantes.map((r, idx) => {
                const s = r.stats
                const aberto = expandido === r.id
                const criadoEm = r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '-'
                const nomeExibir = r.username || r.nome_exibicao || r.email || '?'
                const planoStatus = statusPlano(r)
                return (
                  <div key={r.id} className="card p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4"
                      style={{ background: aberto ? 'var(--accent-bg)' : 'var(--bg-hover)', borderBottom: aberto ? '1px solid var(--border-active)' : '1px solid transparent', cursor: 'pointer' }}
                      onClick={() => setExpandido(aberto ? null : r.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--accent)', color: '#fff' }}>
                          {nomeExibir[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {nomeExibir}
                              {idx === 0 && s.fatTotal > 0 && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04' }}>🏆 Top</span>
                              )}
                            </p>
                            <BadgePlano status={planoStatus} />
                            {planoStatus?.tipo === 'expirado' && <AlertTriangle size={13} style={{ color: '#ef4444' }} />}
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {r.email && <span>{r.email} · </span>}
                            Cadastrado {criadoEm}
                            {r.desconto_pct > 0 && <span style={{ color: '#f59e0b' }}> · Desconto {r.desconto_pct}%</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Período</p>
                          <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>{formatarMoeda(s.fatPeriodo)}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
                          <p className="font-bold text-sm" style={{ color: '#7c3aed' }}>{formatarMoeda(s.fatTotal)}</p>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>{aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </div>
                    </div>

                    {aberto && (
                      <div className="px-5 py-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          {[
                            { icon: Calendar,    label: 'Fat. Período', valor: formatarMoeda(s.fatPeriodo),    cor: '#3b82f6', sub: `${s.vendasPeriodo} unid.` },
                            { icon: DollarSign,  label: 'Fat. Total',   valor: formatarMoeda(s.fatTotal),     cor: '#7c3aed', sub: `${s.vendasTotal} unid. total` },
                            { icon: Tag,         label: 'Plano',        valor: r.plano_ativo || '—',        cor: '#16a34a', sub: r.plano_fim ? `Vence ${new Date(r.plano_fim).toLocaleDateString('pt-BR')}` : 'Sem vencimento' },
                            { icon: TrendingUp,  label: 'Desconto',     valor: r.desconto_pct > 0 ? `-${r.desconto_pct}%` : '—', cor: '#f59e0b', sub: r.obs_admin || ' ' },
                          ].map(({ icon: Icon, label, valor, cor, sub }) => (
                            <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                              </div>
                              <p className="text-xl font-bold" style={{ color: cor }}>{valor}</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <button className="btn btn-primary" style={{ fontSize: 12 }}
                            onClick={e => { e.stopPropagation(); setModalPlano(r) }}>
                            <Tag size={13} /> Configurar plano
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Gerenciar Usuários */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: 10 }}>
              <Users size={14} style={{ color: '#8b5cf6' }} />
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gerenciar Usuários</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{usuarios.length} conta(s)</span>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {usuarios.map(u => {
                const nome = u.username || u.nome_exibicao || u.email || '?'
                return (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: u.is_admin ? '#8b5cf6' : 'var(--accent)', color: '#fff' }}>
                      {nome[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.email && <span>{u.email} · </span>}
                        {u.is_admin ? '👑 Administrador' : 'Usuário'}
                        {u.criado_em && ` · ${new Date(u.criado_em).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    {!u.is_admin && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setModalPlano(u)}>
                          <Tag size={11} /> Plano
                        </button>
                        <button
                          onClick={() => setModalApagar(u)}
                          title="Apagar conta"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Criar nova conta</p>
              <div className="flex gap-3 flex-wrap items-end">
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Usuário</label>
                  <input className="input" placeholder="nome de usuário" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>E-mail</label>
                  <input className="input" type="email" placeholder="email@exemplo.com" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Senha inicial</label>
                  <input className="input" type="password" placeholder="Mín. 6 caracteres" value={novaS} onChange={e => setNovaS(e.target.value)} />
                </div>
                <button className="btn btn-primary shrink-0" onClick={handleCadastrar} disabled={salvando}>
                  <UserPlus size={13} /> {salvando ? 'Criando...' : 'Criar conta'}
                </button>
              </div>
              {erroU && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{erroU}</p>}
              {okU  && <p className="text-xs mt-2" style={{ color: '#22c55e' }}>Conta criada com sucesso!</p>}
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <KeyRound size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                O usuário pode alterar a senha em Configurações após o primeiro login.
              </p>
            </div>
          </div>
        </>
      )}

      {aba === 'faturamento' && <AbaFaturamento usuarios={usuarios} />}
      {aba === 'planos'      && <AbaPlanos />}

      {/* Modal configurar plano do usuário */}
      {modalPlano && (
        <ModalPlanoUsuario
          usuario={modalPlano}
          planos={lerLS('saas_planos', PLANOS_PADRAO)}
          onClose={() => setModalPlano(null)}
          onSalvo={() => carregarDados()}
        />
      )}

      {/* Modal apagar conta */}
      {modalApagar && (
        <ModalApagarUsuario
          usuario={modalApagar}
          onClose={() => setModalApagar(null)}
          onConfirmado={async (id) => {
            const res = await removerUsuario(id)
            if (res.ok) carregarDados()
            return res
          }}
        />
      )}
    </div>
  )
}
