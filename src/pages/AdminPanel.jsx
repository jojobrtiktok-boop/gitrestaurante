import { useEffect, useMemo, useState } from 'react'
import {
  Users, TrendingUp, DollarSign, ChevronDown, ChevronUp, ShieldCheck,
  Calendar, Trash2, UserPlus, KeyRound, CreditCard, Package, Plus,
  CheckCircle2, Clock, XCircle, BarChart3, Pencil, X, Plug,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'
import { lucroEntrada, receitaEntrada } from '../utils/calculos.js'
import { formatarMoeda, hoje } from '../utils/formatacao.js'

// ── Helpers ────────────────────────────────────────────────────────────────
function lerLS(chave, padrao = []) {
  try { return JSON.parse(localStorage.getItem(chave) ?? 'null') ?? padrao }
  catch { return padrao }
}
function salvarLS(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)) } catch {}
}

// ── Stats por restaurante ──────────────────────────────────────────────────
function calcularStats(userId) {
  const prefixo = `rd_${userId.slice(0, 8)}_`
  const entradas = lerLS(prefixo + 'entradas_vendas', [])
  const pedidos = lerLS(prefixo + 'pedidos', [])
  const pratos = lerLS(prefixo + 'pratos', [])
  const ingredientes = lerLS(prefixo + 'ingredientes', [])
  const mesAtual = hoje().slice(0, 7)
  let fatTotal = 0, fatMes = 0, lucroTotal = 0, lucroMes = 0, vendasTotal = 0, vendasMes = 0
  for (const e of entradas) {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) continue
    const receita = receitaEntrada(e, prato)
    const lucro = lucroEntrada(e, prato, ingredientes, pedidos)
    fatTotal += receita; lucroTotal += lucro; vendasTotal += e.quantidade
    if (e.data?.startsWith(mesAtual)) { fatMes += receita; lucroMes += lucro; vendasMes += e.quantidade }
  }
  const ultimaVenda = entradas.length > 0
    ? entradas.reduce((max, e) => e.data > max ? e.data : max, '') : null
  return { fatTotal, fatMes, lucroTotal, lucroMes, vendasTotal, vendasMes, ultimaVenda, totalEntradas: entradas.length }
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px',
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.cor,
    }}>
      <Icon size={10} /> {s.label}
    </span>
  )
}

// ── Planos padrão ──────────────────────────────────────────────────────────
const PLANOS_PADRAO = [
  { id: 'p1', nome: 'Básico',       preco: 49.90,  periodo: 'mensal', descricao: 'Até 50 pedidos/dia',   ativo: true },
  { id: 'p2', nome: 'Profissional', preco: 99.90,  periodo: 'mensal', descricao: 'Pedidos ilimitados',   ativo: true },
  { id: 'p3', nome: 'Anual',        preco: 899.90, periodo: 'anual',  descricao: 'Equivale a R$75/mês',  ativo: true },
]

// ── Modal genérico ─────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Aba Faturamento SaaS ───────────────────────────────────────────────────
function AbaFaturamento({ usuarios }) {
  const [pagamentos, setPagamentos] = useState(() => lerLS('saas_pagamentos', []))
  const [planos] = useState(() => lerLS('saas_planos', PLANOS_PADRAO))
  const [filtroMes, setFiltroMes] = useState('')      // '' = todos
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const mesAtual = hoje().slice(0, 7)

  // Form de pagamento
  const formVazio = { clienteId: '', clienteNome: '', plano: '', valor: '', data: hoje(), status: 'pago', plataforma: '', observacao: '' }
  const [form, setForm] = useState(formVazio)
  const [erroForm, setErroForm] = useState('')

  function salvar() {
    if (!form.clienteNome.trim()) return setErroForm('Informe o cliente.')
    if (!form.plano.trim()) return setErroForm('Informe o plano.')
    if (!form.valor || isNaN(+form.valor) || +form.valor <= 0) return setErroForm('Valor inválido.')
    const entrada = { ...form, id: editando?.id || crypto.randomUUID(), valor: +form.valor }
    const next = editando
      ? pagamentos.map(p => p.id === editando.id ? entrada : p)
      : [entrada, ...pagamentos]
    setPagamentos(next)
    salvarLS('saas_pagamentos', next)
    setModalAberto(false)
    setEditando(null)
    setForm(formVazio)
    setErroForm('')
  }

  function excluir(id) {
    if (!window.confirm('Remover este pagamento?')) return
    const next = pagamentos.filter(p => p.id !== id)
    setPagamentos(next); salvarLS('saas_pagamentos', next)
  }

  function abrirEditar(p) {
    setEditando(p)
    setForm({ ...p, valor: String(p.valor) })
    setModalAberto(true)
  }

  function abrirNovo() {
    setEditando(null); setForm(formVazio); setModalAberto(true)
  }

  // Filtro
  const pagFiltrados = filtroMes
    ? pagamentos.filter(p => p.data?.startsWith(filtroMes))
    : pagamentos

  // KPIs
  const receitaMes   = pagamentos.filter(p => p.status === 'pago' && p.data?.startsWith(mesAtual)).reduce((s, p) => s + p.valor, 0)
  const receitaTotal = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0)
  const pendentes    = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0)
  const clientesAtivos = [...new Set(pagamentos.filter(p => p.status === 'pago' && p.data?.startsWith(mesAtual)).map(p => p.clienteNome || p.clienteId))].length

  // Gráfico últimos 6 meses
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

  // Meses disponíveis para filtro
  const mesesDisponiveis = [...new Set(pagamentos.map(p => p.data?.slice(0, 7)).filter(Boolean))].sort().reverse()

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Receita do Mês" valor={formatarMoeda(receitaMes)} cor="#3b82f6"
          sub={`${new Date().toLocaleString('pt-BR', { month: 'long' })}`} />
        <StatCard label="Receita Total" valor={formatarMoeda(receitaTotal)} cor="#7c3aed" sub="todos os tempos" />
        <StatCard label="Clientes Ativos" valor={clientesAtivos} cor="#16a34a" sub="pagantes este mês" />
        <StatCard label="Aguardando" valor={formatarMoeda(pendentes)} cor="#f59e0b" sub="pagamentos pendentes" />
      </div>

      {/* Gráfico de barras */}
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
                  {m.valor > 0 ? formatarMoeda(m.valor).replace('R$ ', '') : ''}
                </span>
                <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: '5px 5px 0 0',
                    height: `${Math.max(pct, m.valor > 0 ? 6 : 2)}%`,
                    background: isCurrent ? '#3b82f6' : 'var(--border)',
                    transition: 'height 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: isCurrent ? '#3b82f6' : 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400 }}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela de pagamentos */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: '#7c3aed' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Histórico de Pagamentos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
              {pagFiltrados.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input text-xs"
              style={{ width: 'auto', padding: '5px 10px' }}
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
            >
              <option value="">Todos os meses</option>
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>{new Date(m + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={abrirNovo}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
        </div>

        {pagFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum pagamento registrado</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Adicione manualmente ou conecte uma plataforma de pagamento.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Cliente', 'Plano', 'Valor', 'Status', 'Plataforma', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagFiltrados.sort((a, b) => b.data?.localeCompare(a.data)).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {p.data ? p.data.split('-').reverse().join('/') : '-'}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.clienteNome || p.clienteId || '-'}
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{p.plano || '-'}</td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                      {formatarMoeda(p.valor)}
                    </td>
                    <td style={{ padding: '10px 10px' }}><BadgeStatus status={p.status} /></td>
                    <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {p.plataforma || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal adicionar/editar pagamento */}
      {modalAberto && (
        <Modal titulo={editando ? 'Editar Pagamento' : 'Registrar Pagamento'} onClose={() => { setModalAberto(false); setEditando(null); setErroForm('') }}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Cliente *</label>
              {usuarios.length > 0 ? (
                <select className="input" value={form.clienteId}
                  onChange={e => {
                    const u = usuarios.find(x => x.id === e.target.value)
                    setForm(f => ({ ...f, clienteId: e.target.value, clienteNome: u?.username || u?.nome_exibicao || u?.email || '' }))
                  }}>
                  <option value="">Selecionar usuário...</option>
                  {usuarios.filter(u => !u.is_admin).map(u => (
                    <option key={u.id} value={u.id}>{u.username || u.nome_exibicao || u.email}</option>
                  ))}
                </select>
              ) : null}
              <input className="input mt-2" placeholder="Nome do cliente (manual)" value={form.clienteNome}
                onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Plano *</label>
                <select className="input" value={form.plano} onChange={e => {
                  const pl = planos.find(p => p.nome === e.target.value)
                  setForm(f => ({ ...f, plano: e.target.value, valor: pl ? String(pl.preco) : f.valor }))
                }}>
                  <option value="">Selecionar...</option>
                  {planos.filter(p => p.ativo).map(p => (
                    <option key={p.id} value={p.nome}>{p.nome} — {formatarMoeda(p.preco)}</option>
                  ))}
                  <option value="__outro">Outro</option>
                </select>
              </div>
              <div style={{ width: 110 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Valor (R$) *</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0,00"
                  value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Data</label>
                <input className="input" type="date" value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
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
              <input className="input" placeholder="Ex: renovação, desconto, etc." value={form.observacao}
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
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const formVazio = { nome: '', preco: '', periodo: 'mensal', descricao: '', ativo: true }
  const [form, setForm] = useState(formVazio)
  const [erroForm, setErroForm] = useState('')

  function salvar() {
    if (!form.nome.trim()) return setErroForm('Informe o nome do plano.')
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

  function abrirEditar(p) { setEditando(p); setForm({ ...p, preco: String(p.preco) }); setModalAberto(true) }
  function abrirNovo() { setEditando(null); setForm(formVazio); setModalAberto(true) }

  return (
    <div>
      {/* Planos */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={15} style={{ color: '#7c3aed' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Planos Configurados</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>{planos.length}</span>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={abrirNovo}>
            <Plus size={13} /> Novo Plano
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {planos.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', opacity: p.ativo ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.nome}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: p.periodo === 'anual' ? 'rgba(234,179,8,0.15)' : 'rgba(59,130,246,0.12)',
                    color: p.periodo === 'anual' ? '#ca8a04' : '#3b82f6',
                    fontWeight: 700,
                  }}>{p.periodo}</span>
                  {!p.ativo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Inativo</span>}
                </div>
                {p.descricao && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.descricao}</p>}
              </div>
              <p className="font-bold text-base shrink-0" style={{ color: '#16a34a' }}>{formatarMoeda(p.preco)}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleAtivo(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  title={p.ativo ? 'Desativar' : 'Ativar'}>
                  {p.ativo ? <CheckCircle2 size={15} style={{ color: '#22c55e' }} /> : <XCircle size={15} />}
                </button>
                <button onClick={() => abrirEditar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => excluir(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integração API — placeholder para futuro */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Plug size={15} style={{ color: '#f59e0b' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Integração de Pagamento</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}>Em breve</span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Quando você decidir a plataforma, a integração via webhook/API será configurada aqui para sincronizar os pagamentos automaticamente.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {['Stripe', 'Hotmart', 'Kiwify', 'CartPanda', 'Cakto'].map(pl => (
            <div key={pl} style={{
              padding: '12px 14px', borderRadius: 10, border: '2px dashed var(--border)',
              textAlign: 'center', opacity: 0.6,
            }}>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{pl}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Não conectado</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Como vai funcionar</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <li>Configure o webhook da plataforma apontando para sua API</li>
            <li>Pagamentos confirmados entram automaticamente no histórico</li>
            <li>Status de clientes atualiza em tempo real</li>
          </ul>
        </div>
      </div>

      {/* Modal plano */}
      {modalAberto && (
        <Modal titulo={editando ? 'Editar Plano' : 'Novo Plano'} onClose={() => { setModalAberto(false); setEditando(null); setErroForm('') }}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Nome do plano *</label>
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
                  <option value="anual">Anual</option>
                  <option value="unico">Pagamento único</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Descrição</label>
              <input className="input" placeholder="Ex: Pedidos ilimitados, suporte prioritário..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Plano ativo (visível para seleção)</span>
            </label>
            {erroForm && <p className="text-xs" style={{ color: '#ef4444' }}>{erroForm}</p>}
            <button className="btn btn-primary w-full mt-1" onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AdminPanel() {
  const { auth, cadastrarUsuario } = useApp()
  const [aba, setAba] = useState('restaurantes')
  const [expandido, setExpandido] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaS, setNovaS] = useState('')
  const [erroU, setErroU] = useState('')
  const [okU, setOkU] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregarUsuarios() }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, nome_exibicao, is_admin, created_at')
      .order('created_at', { ascending: true })
    if (!error && data) setUsuarios(data)
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
    carregarUsuarios()
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

  const restaurantes = useMemo(() => {
    return usuarios
      .filter(u => !u.is_admin)
      .map(u => ({ ...u, stats: calcularStats(u.id) }))
      .sort((a, b) => b.stats.fatTotal - a.stats.fatTotal)
  }, [usuarios])

  const totalGlobalFat    = restaurantes.reduce((s, r) => s + r.stats.fatTotal, 0)
  const totalGlobalFatMes = restaurantes.reduce((s, r) => s + r.stats.fatMes, 0)
  const totalGlobalLucro  = restaurantes.reduce((s, r) => s + r.stats.lucroTotal, 0)
  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  const ABAS = [
    { id: 'restaurantes',  label: 'Restaurantes',     icon: Users },
    { id: 'faturamento',   label: 'Faturamento SaaS', icon: CreditCard },
    { id: 'planos',        label: 'Planos',            icon: Package },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
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
            <button key={a.id} onClick={() => setAba(a.id)}
              className="flex items-center gap-2"
              style={{
                padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: ativo ? 'var(--bg-card)' : 'transparent',
                color: ativo ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: ativo ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s',
              }}>
              <Icon size={13} />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* ── ABA: Restaurantes ── */}
      {aba === 'restaurantes' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Restaurantes" valor={restaurantes.length} cor="var(--accent)" />
            <StatCard label={`Faturamento — ${mesAtual}`} valor={formatarMoeda(totalGlobalFatMes)} cor="#3b82f6" />
            <StatCard label="Faturamento Total" valor={formatarMoeda(totalGlobalFat)} cor="#7c3aed" />
            <StatCard label="Lucro Total Bruto" valor={formatarMoeda(totalGlobalLucro)} cor="#16a34a" />
          </div>

          {carregando ? (
            <div className="card text-center py-10">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
            </div>
          ) : restaurantes.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum restaurante cadastrado ainda</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Quando um usuário se cadastrar, aparecerá aqui.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-6">
              {restaurantes.map((r, idx) => {
                const s = r.stats
                const aberto = expandido === r.id
                const margemMes   = s.fatMes   > 0 ? (s.lucroMes   / s.fatMes   * 100) : 0
                const margemTotal = s.fatTotal > 0 ? (s.lucroTotal / s.fatTotal * 100) : 0
                const criadoEm = r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'
                const ultimaVenda = s.ultimaVenda ? s.ultimaVenda.split('-').reverse().join('/') : 'Nenhuma'
                const nomeExibir = r.username || r.nome_exibicao || r.email || '?'
                return (
                  <div key={r.id} className="card p-0 overflow-hidden">
                    <button className="w-full flex items-center justify-between px-5 py-4 text-left"
                      style={{ background: aberto ? 'var(--accent-bg)' : 'var(--bg-hover)', borderBottom: aberto ? '1px solid var(--border-active)' : '1px solid transparent', cursor: 'pointer', border: 'none' }}
                      onClick={() => setExpandido(aberto ? null : r.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'var(--accent)', color: '#fff' }}>
                          {nomeExibir[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {nomeExibir}
                            {idx === 0 && s.fatTotal > 0 && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04' }}>🏆 Maior faturamento</span>
                            )}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Cadastrado em {criadoEm} · Última venda: {ultimaVenda}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mês</p>
                          <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>{formatarMoeda(s.fatMes)}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
                          <p className="font-bold text-sm" style={{ color: '#7c3aed' }}>{formatarMoeda(s.fatTotal)}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lucro</p>
                          <p className="font-bold text-sm" style={{ color: '#16a34a' }}>{formatarMoeda(s.lucroTotal)}</p>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>{aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </div>
                    </button>
                    {aberto && (
                      <div className="px-5 py-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          {[
                            { icon: Calendar, label: 'Faturamento Mês',  valor: formatarMoeda(s.fatMes),    cor: '#3b82f6', sub: `${s.vendasMes} unid. vendidas` },
                            { icon: DollarSign, label: 'Faturamento Total', valor: formatarMoeda(s.fatTotal),  cor: '#7c3aed', sub: `${s.totalEntradas} lançamentos` },
                            { icon: TrendingUp, label: 'Lucro Bruto Mês',  valor: formatarMoeda(s.lucroMes),  cor: '#16a34a', sub: `Margem: ${margemMes.toFixed(1)}%` },
                            { icon: TrendingUp, label: 'Lucro Bruto Total', valor: formatarMoeda(s.lucroTotal), cor: '#16a34a', sub: `Margem: ${margemTotal.toFixed(1)}%` },
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
                        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>Total unidades: <strong style={{ color: 'var(--text-primary)' }}>{s.vendasTotal}</strong></span>
                          <span>Ticket médio: <strong style={{ color: 'var(--text-primary)' }}>{s.totalEntradas > 0 ? formatarMoeda(s.fatTotal / s.totalEntradas) : '-'}</strong></span>
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
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Users size={14} style={{ color: '#8b5cf6' }} />
              </div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gerenciar Usuários</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{usuarios.length} conta(s)</span>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {usuarios.map(u => {
                const nome = u.username || u.nome_exibicao || u.email || '?'
                return (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: u.is_admin ? '#8b5cf6' : 'var(--accent)', color: '#fff' }}>
                      {nome[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.email && <span>{u.email} · </span>}
                        {u.is_admin ? '👑 Administrador' : 'Usuário'}
                        {u.created_at && ` · Criado em ${new Date(u.created_at).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
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
              {okU && <p className="text-xs mt-2" style={{ color: '#22c55e' }}>Conta criada com sucesso!</p>}
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <KeyRound size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                O usuário pode alterar a senha em Configurações após o primeiro login.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── ABA: Faturamento SaaS ── */}
      {aba === 'faturamento' && <AbaFaturamento usuarios={usuarios} />}

      {/* ── ABA: Planos ── */}
      {aba === 'planos' && <AbaPlanos />}
    </div>
  )
}
