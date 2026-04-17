import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Receipt, CalendarCheck, Percent, TrendingDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { formatarMoeda, formatarData, hoje } from '../utils/formatacao.js'

function primeiroDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function labelMes(yyyymm) {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const CATEGORIAS = [
  { id: 'funcionarios',  label: 'Funcionários',  cor: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'investimentos', label: 'Investimentos', cor: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'impostos',      label: 'Impostos',      cor: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { id: 'outros',        label: 'Outros',        cor: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
]

/* ─── Modal genérico ────────────────────────────── */
function ModalBase({ titulo, onFechar, children, acaoPrincipal, labelAcao, corAcao, desabilitado }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 420, padding: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>{titulo}</p>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn" style={{ background: corAcao || 'var(--accent)', color: '#fff', border: 'none', opacity: desabilitado ? 0.5 : 1 }}
            onClick={acaoPrincipal} disabled={desabilitado}>{labelAcao}</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ texto, onConfirm, onFechar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>Excluir?</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{texto || 'Esta ação não pode ser desfeita.'}</p>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal lançamento (despesa avulsa ou de fixas) ─ */
function ModalDespesa({ despesa, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    descricao: despesa?.descricao || '',
    categoria: despesa?.categoria || 'funcionarios',
    valor: despesa?.valor != null ? String(despesa.valor) : '',
    data: despesa?.data || hoje(),
  })
  const cat = CATEGORIAS.find(c => c.id === form.categoria)
  const ok = form.descricao.trim() && form.valor && !isNaN(parseFloat(form.valor))
  return (
    <ModalBase titulo={despesa ? 'Editar Despesa' : 'Nova Despesa'} onFechar={onFechar}
      acaoPrincipal={() => ok && onSalvar({ ...form, valor: parseFloat(form.valor) })}
      labelAcao="Salvar" corAcao={cat?.cor} desabilitado={!ok}>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Data</label>
        <input className="input" type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Descrição</label>
        <input className="input" type="text" autoFocus placeholder="Ex: Aluguel, Salário, Conta de luz…"
          value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Categoria</label>
        <select className="input" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
          {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Valor (R$)</label>
        <input className="input" type="number" min="0" step="0.01" placeholder="0,00"
          value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
      </div>
    </ModalBase>
  )
}

/* ─── Aba: Lançamentos ──────────────────────────── */
function AbaLancamentos() {
  const { despesas, adicionarDespesa, editarDespesa, removerDespesa } = useApp()
  const [inicio, setInicio] = useState(primeiroDiaMes)
  const [fim, setFim] = useState(hoje)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [modal, setModal] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(null)

  const periodoFiltrado = useMemo(() =>
    despesas.filter(d => d.data >= inicio && d.data <= fim),
    [despesas, inicio, fim])

  const exibidas = useMemo(() => {
    const base = filtroCategoria === 'todas' ? periodoFiltrado : periodoFiltrado.filter(d => d.categoria === filtroCategoria)
    return [...base].sort((a, b) => b.data.localeCompare(a.data) || (b.criadoEm || '').localeCompare(a.criadoEm || ''))
  }, [periodoFiltrado, filtroCategoria])

  const totais = useMemo(() => {
    const t = { todas: 0 }
    CATEGORIAS.forEach(c => { t[c.id] = 0 })
    periodoFiltrado.forEach(d => { t[d.categoria] = (t[d.categoria] || 0) + d.valor; t.todas += d.valor })
    return t
  }, [periodoFiltrado])

  function salvarModal(dados) {
    if (modal?.id) editarDespesa(modal.id, dados)
    else adicionarDespesa(dados)
    setModal(null)
  }

  return (
    <>
      {/* Filtro período */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>De</label>
            <input className="input" style={{ width: 140 }} type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Até</label>
            <input className="input" style={{ width: 140 }} type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {[
              { label: 'Hoje', fn: () => { const h = hoje(); setInicio(h); setFim(h) } },
              { label: 'Este mês', fn: () => { setInicio(primeiroDiaMes()); setFim(hoje()) } },
              { label: 'Último mês', fn: () => {
                const d = new Date(); d.setMonth(d.getMonth() - 1)
                const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
                setInicio(`${y}-${m}-01`); setFim(`${y}-${m}-${new Date(y, d.getMonth() + 1, 0).getDate()}`)
              }},
            ].map(s => <button key={s.label} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={s.fn}>{s.label}</button>)}
          </div>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="card col-span-2 lg:col-span-1" style={{ borderColor: totais.todas > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)', background: totais.todas > 0 ? 'rgba(239,68,68,0.04)' : undefined }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total</p>
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{formatarMoeda(totais.todas)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{periodoFiltrado.length} registro{periodoFiltrado.length !== 1 ? 's' : ''}</p>
        </div>
        {CATEGORIAS.map(cat => (
          <div key={cat.id} className="card" style={{ borderColor: totais[cat.id] > 0 ? cat.cor + '40' : 'var(--border)', background: totais[cat.id] > 0 ? cat.bg : undefined }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: totais[cat.id] > 0 ? cat.cor : 'var(--text-muted)' }}>{cat.label}</p>
            <p className="text-xl font-bold" style={{ color: totais[cat.id] > 0 ? cat.cor : 'var(--text-secondary)' }}>{formatarMoeda(totais[cat.id])}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{totais.todas > 0 ? `${((totais[cat.id] / totais.todas) * 100).toFixed(0)}%` : '—'}</p>
          </div>
        ))}
      </div>

      {/* Filtro categoria + botão adicionar */}
      <div className="flex gap-1 mb-3 flex-wrap items-center">
        {[{ id: 'todas', label: 'Todas' }, ...CATEGORIAS].map(cat => (
          <button key={cat.id} onClick={() => setFiltroCategoria(cat.id)}
            style={{ padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: filtroCategoria === cat.id ? (cat.cor || 'var(--accent)') : 'var(--bg-hover)',
              color: filtroCategoria === cat.id ? '#fff' : 'var(--text-secondary)', transition: 'all .15s' }}>
            {cat.label}
          </button>
        ))}
        <button className="btn btn-primary text-xs ml-auto" style={{ gap: 5 }} onClick={() => setModal('nova')}>
          <Plus size={13} /> Nova despesa
        </button>
      </div>

      {/* Tabela */}
      {exibidas.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 gap-3">
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-hover)' }}><Receipt size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhuma despesa no período</p>
          <button className="btn btn-secondary text-xs" onClick={() => setModal('nova')}>+ Adicionar despesa</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {exibidas.map(d => {
                  const cat = CATEGORIAS.find(c => c.id === d.categoria)
                  return (
                    <tr key={d.id}>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatarData(d.data)}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {d.descricao}
                        {d.fixaId && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>mensal</span>}
                      </td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6, background: cat?.bg, color: cat?.cor }}>{cat?.label || d.categoria}</span></td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(d.valor)}</td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setModal(d)} style={{ padding: '4px 6px', borderRadius: 6, background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Pencil size={13} /></button>
                          <button onClick={() => setConfirmExcluir(d.id)} style={{ padding: '4px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={3} className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {filtroCategoria === 'todas' ? 'Total' : `Total ${CATEGORIAS.find(c => c.id === filtroCategoria)?.label}`}
                  </td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(exibidas.reduce((s, d) => s + d.valor, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {modal && <ModalDespesa despesa={modal === 'nova' ? null : modal} onSalvar={salvarModal} onFechar={() => setModal(null)} />}
      {confirmExcluir && <ConfirmDelete texto="Esta ação não pode ser desfeita." onConfirm={() => { removerDespesa(confirmExcluir); setConfirmExcluir(null) }} onFechar={() => setConfirmExcluir(null)} />}
    </>
  )
}

/* ─── Aba: Fixas Mensais ────────────────────────── */
function AbaFixasMensais() {
  const { despesasFixas, adicionarDespesaFixa, editarDespesaFixa, removerDespesaFixa, adicionarDespesa } = useApp()
  const [modal, setModal] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(null)
  const [mesLancar, setMesLancar] = useState(mesAtual)
  const [lancarModal, setLancarModal] = useState(false)
  const [lancarOk, setLancarOk] = useState(false)

  function salvarFixa(dados) {
    const { data: _d, ...rest } = dados
    if (modal?.id) editarDespesaFixa(modal.id, rest)
    else adicionarDespesaFixa(rest)
    setModal(null)
  }

  function lancarMes() {
    const [y, m] = mesLancar.split('-')
    const data = `${y}-${m}-01`
    despesasFixas.forEach(f => adicionarDespesa({ descricao: f.descricao, categoria: f.categoria, valor: f.valor, data, fixaId: f.id }))
    setLancarModal(false)
    setLancarOk(true)
    setTimeout(() => setLancarOk(false), 3000)
  }

  const totalFixo = despesasFixas.reduce((s, f) => s + f.valor, 0)

  return (
    <>
      {/* Header da aba */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Total mensal fixo</p>
            <p className="text-2xl font-bold" style={{ color: despesasFixas.length > 0 ? '#ef4444' : 'var(--text-muted)' }}>{formatarMoeda(totalFixo)}</p>
          </div>
          <p className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>{despesasFixas.length} item{despesasFixas.length !== 1 ? 's' : ''} recorrente{despesasFixas.length !== 1 ? 's' : ''}</p>
          <div className="ml-auto flex gap-2 flex-wrap items-center">
            {lancarOk && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Lançado!</span>}
            <button className="btn btn-secondary" style={{ gap: 5 }} disabled={despesasFixas.length === 0} onClick={() => setLancarModal(true)}>
              <CalendarCheck size={14} /> Lançar mês
            </button>
            <button className="btn btn-primary" style={{ gap: 5 }} onClick={() => setModal('novo')}>
              <Plus size={14} /> Nova fixa
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {despesasFixas.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 gap-3">
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-hover)' }}><CalendarCheck size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhuma despesa fixa cadastrada</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cadastre despesas recorrentes e lance todas de uma vez por mês</p>
          <button className="btn btn-secondary text-xs" onClick={() => setModal('novo')}>+ Cadastrar fixa</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor/mês</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {despesasFixas.map(f => {
                  const cat = CATEGORIAS.find(c => c.id === f.categoria)
                  return (
                    <tr key={f.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.descricao}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6, background: cat?.bg, color: cat?.cor }}>{cat?.label || f.categoria}</span></td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(f.valor)}</td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setModal(f)} style={{ padding: '4px 6px', borderRadius: 6, background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Pencil size={13} /></button>
                          <button onClick={() => setConfirmExcluir(f.id)} style={{ padding: '4px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={2} className="font-bold" style={{ color: 'var(--text-primary)' }}>Total mensal</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(totalFixo)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal add/edit fixa */}
      {modal && (
        <ModalDespesa
          despesa={modal === 'novo' ? null : modal}
          onSalvar={salvarFixa}
          onFechar={() => setModal(null)}
        />
      )}

      {/* Modal lançar mês */}
      {lancarModal && (
        <ModalBase titulo="Lançar despesas fixas" onFechar={() => setLancarModal(false)}
          acaoPrincipal={lancarMes} labelAcao={`Lançar ${despesasFixas.length} despesa${despesasFixas.length !== 1 ? 's' : ''}`} corAcao="#16a34a" desabilitado={false}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Serão criados {despesasFixas.length} lançamento{despesasFixas.length !== 1 ? 's' : ''} na aba <b>Lançamentos</b> com a data do 1º dia do mês escolhido.
          </p>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Mês / Ano</label>
            <input className="input" type="month" value={mesLancar} onChange={e => setMesLancar(e.target.value)} />
          </div>
          <div className="card p-3" style={{ background: 'var(--bg-hover)', border: 'none' }}>
            {despesasFixas.map(f => {
              const cat = CATEGORIAS.find(c => c.id === f.categoria)
              return (
                <div key={f.id} className="flex justify-between items-center py-1">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.descricao}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: cat?.bg, color: cat?.cor }}>{cat?.label}</span>
                    <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{formatarMoeda(f.valor)}</span>
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{formatarMoeda(totalFixo)}</span>
            </div>
          </div>
        </ModalBase>
      )}

      {confirmExcluir && <ConfirmDelete texto="Esta despesa fixa será removida (lançamentos já feitos permanecem)." onConfirm={() => { removerDespesaFixa(confirmExcluir); setConfirmExcluir(null) }} onFechar={() => setConfirmExcluir(null)} />}
    </>
  )
}

/* ─── Aba: Impostos & Taxas ─────────────────────── */
function AbaImpostos() {
  const { impostosConfig, adicionarImposto, editarImposto, removerImposto, adicionarDespesa, registrosVendas } = useApp()
  const [modal, setModal] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(null)
  const [mes, setMes] = useState(mesAtual)
  const [faturamentoManual, setFaturamentoManual] = useState('')

  const faturamentoMes = useMemo(() => {
    if (!registrosVendas) return 0
    const [y, m] = mes.split('-')
    const ini = `${y}-${m}-01`, fim = `${y}-${m}-31`
    return registrosVendas
      .filter(r => r.data >= ini && r.data <= fim)
      .reduce((s, r) => s + (r.total || 0), 0)
  }, [registrosVendas, mes])

  const baseCalculo = faturamentoManual ? parseFloat(faturamentoManual) || 0 : faturamentoMes

  const [modalImposto, setModalImposto] = useState(null)
  const [formIm, setFormIm] = useState({ nome: '', percentual: '', base: 'faturamento' })

  function abrirModal(imp) {
    setModalImposto(imp || 'novo')
    setFormIm(imp ? { nome: imp.nome, percentual: String(imp.percentual), base: imp.base || 'faturamento' } : { nome: '', percentual: '', base: 'faturamento' })
  }

  function salvarImposto() {
    const ok = formIm.nome.trim() && formIm.percentual && !isNaN(parseFloat(formIm.percentual))
    if (!ok) return
    if (modalImposto?.id) editarImposto(modalImposto.id, { nome: formIm.nome.trim(), percentual: parseFloat(formIm.percentual), base: formIm.base })
    else adicionarImposto({ nome: formIm.nome.trim(), percentual: parseFloat(formIm.percentual), base: formIm.base })
    setModalImposto(null)
  }

  function valorImposto(imp) {
    return baseCalculo * (imp.percentual / 100)
  }

  function lancarComoDesp(imp) {
    const [y, m] = mes.split('-')
    adicionarDespesa({ descricao: `${imp.nome} (${imp.percentual}%)`, categoria: 'impostos', valor: valorImposto(imp), data: `${y}-${m}-01` })
  }

  const totalImpostos = impostosConfig.reduce((s, imp) => s + valorImposto(imp), 0)

  return (
    <>
      {/* Painel de cálculo */}
      <div className="card mb-4 p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Simulação de Impostos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Mês de referência</label>
            <input className="input" type="month" value={mes} onChange={e => setMes(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Faturamento do mês (automático)</label>
            <div className="input" style={{ pointerEvents: 'none', color: faturamentoMes > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: faturamentoMes > 0 ? 600 : 400 }}>
              {faturamentoMes > 0 ? formatarMoeda(faturamentoMes) : 'Sem vendas registradas'}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Ou informe manualmente (R$)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={faturamentoManual}
              onChange={e => setFaturamentoManual(e.target.value)} />
          </div>
        </div>
        {baseCalculo > 0 && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Base de cálculo:</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatarMoeda(baseCalculo)}</span>
            {impostosConfig.length > 0 && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total impostos estimado:</span>
                <span className="text-sm font-bold" style={{ color: '#f97316' }}>{formatarMoeda(totalImpostos)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Botão add */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {impostosConfig.length} imposto{impostosConfig.length !== 1 ? 's' : ''} configurado{impostosConfig.length !== 1 ? 's' : ''}
        </p>
        <button className="btn btn-primary" style={{ gap: 5 }} onClick={() => abrirModal(null)}>
          <Plus size={14} /> Novo imposto
        </button>
      </div>

      {/* Lista */}
      {impostosConfig.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 gap-3">
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-hover)' }}><Percent size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Nenhum imposto configurado</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cadastre ISS, Simples Nacional, ICMS e outros</p>
          <button className="btn btn-secondary text-xs" onClick={() => abrirModal(null)}>+ Cadastrar imposto</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Imposto / Taxa</th>
                  <th>Base</th>
                  <th>%</th>
                  <th>Valor estimado</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {impostosConfig.map(imp => (
                  <tr key={imp.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{imp.nome}</td>
                    <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 600 }}>{imp.base === 'lucro' ? 'Lucro' : 'Faturamento'}</span></td>
                    <td style={{ fontWeight: 700, color: '#f97316' }}>{imp.percentual}%</td>
                    <td style={{ fontWeight: 700, color: baseCalculo > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                      {baseCalculo > 0 ? formatarMoeda(valorImposto(imp)) : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        {baseCalculo > 0 && (
                          <button onClick={() => lancarComoDesp(imp)}
                            style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(249,115,22,0.1)', border: 'none', cursor: 'pointer', color: '#f97316', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Lançar
                          </button>
                        )}
                        <button onClick={() => abrirModal(imp)} style={{ padding: '4px 6px', borderRadius: 6, background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Pencil size={13} /></button>
                        <button onClick={() => setConfirmExcluir(imp.id)} style={{ padding: '4px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {impostosConfig.length > 1 && baseCalculo > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={3} className="font-bold" style={{ color: 'var(--text-primary)' }}>Total impostos</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(totalImpostos)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Modal imposto */}
      {modalImposto && (
        <ModalBase titulo={modalImposto === 'novo' ? 'Novo Imposto' : 'Editar Imposto'} onFechar={() => setModalImposto(null)}
          acaoPrincipal={salvarImposto} labelAcao="Salvar" corAcao="#f97316"
          desabilitado={!formIm.nome.trim() || !formIm.percentual || isNaN(parseFloat(formIm.percentual))}>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome</label>
            <input className="input" autoFocus placeholder="Ex: Simples Nacional, ISS, ICMS, IRPJ…"
              value={formIm.nome} onChange={e => setFormIm(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Alíquota (%)</label>
            <input className="input" type="number" min="0" max="100" step="0.01" placeholder="Ex: 6 para 6%"
              value={formIm.percentual} onChange={e => setFormIm(p => ({ ...p, percentual: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Calcular sobre</label>
            <div className="flex gap-2">
              {[{ id: 'faturamento', label: 'Faturamento bruto' }, { id: 'lucro', label: 'Lucro' }].map(op => (
                <button key={op.id} onClick={() => setFormIm(p => ({ ...p, base: op.id }))}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={formIm.base === op.id
                    ? { background: '#f97316', color: '#fff', border: '1px solid #f97316' }
                    : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </ModalBase>
      )}

      {confirmExcluir && <ConfirmDelete onConfirm={() => { removerImposto(confirmExcluir); setConfirmExcluir(null) }} onFechar={() => setConfirmExcluir(null)} />}
    </>
  )
}

/* ─── Página principal ──────────────────────────── */
export default function Despesas() {
  const [aba, setAba] = useState('lancamentos')

  const TABS = [
    { id: 'lancamentos', label: 'Lançamentos',     icon: TrendingDown },
    { id: 'fixas',       label: 'Fixas Mensais',   icon: CalendarCheck },
    { id: 'impostos',    label: 'Impostos & Taxas', icon: Percent },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Despesas</h1>
          <p className="page-subtitle">Custos, mensalidades fixas e impostos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          const active = aba === t.id
          return (
            <button key={t.id} onClick={() => setAba(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s',
                background: active ? 'var(--accent)' : 'var(--bg-hover)',
                color: active ? '#fff' : 'var(--text-secondary)' }}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {aba === 'lancamentos' && <AbaLancamentos />}
      {aba === 'fixas'       && <AbaFixasMensais />}
      {aba === 'impostos'    && <AbaImpostos />}
    </div>
  )
}
