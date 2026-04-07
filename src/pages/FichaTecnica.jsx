import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, BookOpen, X, Calculator, ListChecks, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import TabelaVazia from '../components/ui/TabelaVazia.jsx'
import Badge, { margemCor } from '../components/ui/Badge.jsx'
import { toBase, fromBase } from '../utils/unidades.js'
import { custoPrato, lucroPrato, margemPrato, cmvPrato, precoSugeridoCMV, precoSugeridoMargem } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem } from '../utils/formatacao.js'

const FORM_VAZIO = { nome: '', descricao: '', precoVenda: '', categoria: '', ingredientes: [], grupos: [] }

function novoGrupo(categoria = 'complemento') {
  return { id: crypto.randomUUID(), nome: '', tipo: 'multiplo', minimo: 0, maximo: 3, categoria, itens: [] }
}
function novoItem() {
  return { id: crypto.randomUUID(), nome: '', precoExtra: '', ingredienteId: '', quantidadeUsada: '' }
}

export default function Receitas() {
  const { pratos, ingredientes, adicionarPrato, editarPrato, removerPrato } = useApp()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [confirmar, setConfirmar] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [tabPreco, setTabPreco] = useState('margem') // 'margem' | 'cmv'
  const [metaValor, setMetaValor] = useState('65')
  const [adicionandoCategoria, setAdicionandoCategoria] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')

  const todasCategorias = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]

  const categoriasFiltro = ['Todas', ...todasCategorias.filter(c => pratos.some(p => p.categoria === c))]
  const pratosFiltrados = filtroCategoria === 'Todas' ? pratos : pratos.filter(p => p.categoria === filtroCategoria)

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, ingredientes: [{ ingredienteId: '', quantidade: '' }] })
    setEditandoId(null); setErro(''); setModal(true)
  }

  function abrirEditar(prato) {
    const linhas = prato.ingredientes.map(l => {
      const ing = ingredientes.find(i => i.id === l.ingredienteId)
      return { ingredienteId: l.ingredienteId, quantidade: String(ing ? fromBase(l.quantidade, ing.unidade) : l.quantidade) }
    })
    setForm({
      nome: prato.nome, descricao: prato.descricao || '',
      precoVenda: String(prato.precoVenda), categoria: prato.categoria || '',
      ingredientes: linhas,
      grupos: (prato.grupos || []).map(g => ({
        ...g,
        categoria: g.categoria || 'complemento',
        itens: g.itens.map(it => ({
          ...it,
          precoExtra: String(it.precoExtra ?? ''),
          ingredienteId: it.ingredienteId || '',
          quantidadeUsada: String(it.quantidadeUsada ?? ''),
        }))
      })),
    })
    setEditandoId(prato.id); setErro(''); setModal(true)
  }

  // Live cost preview
  const pratoPreview = useMemo(() => {
    const linhas = form.ingredientes
      .filter(l => l.ingredienteId && l.quantidade !== '')
      .map(l => {
        const ing = ingredientes.find(i => i.id === l.ingredienteId)
        if (!ing) return null
        return { ingredienteId: l.ingredienteId, quantidade: toBase(+l.quantidade, ing.unidade) }
      }).filter(Boolean)
    return { precoVenda: +form.precoVenda || 0, ingredientes: linhas }
  }, [form, ingredientes])

  const custoPreview = custoPrato(pratoPreview, ingredientes)
  const lucroPreview = lucroPrato(pratoPreview, ingredientes)
  const margemPreview = margemPrato(pratoPreview, ingredientes)
  const cmvPreview = cmvPrato(pratoPreview, ingredientes)

  const metaNum = parseFloat(metaValor) || 0
  const precoSugerido = tabPreco === 'margem'
    ? precoSugeridoMargem(custoPreview, metaNum)
    : precoSugeridoCMV(custoPreview, metaNum)

  function salvar() {
    if (!form.nome.trim()) return setErro('Nome da receita é obrigatório.')
    if (!form.precoVenda || +form.precoVenda <= 0) return setErro('Preço de venda inválido.')
    const linhas = form.ingredientes.filter(l => l.ingredienteId && l.quantidade !== '')
    if (!linhas.length) return setErro('Adicione pelo menos um insumo.')
    if (linhas.some(l => isNaN(+l.quantidade) || +l.quantidade <= 0)) return setErro('Quantidade inválida em um ou mais insumos.')

    const ingredientesConvertidos = linhas.map(l => {
      const ing = ingredientes.find(i => i.id === l.ingredienteId)
      return { ingredienteId: l.ingredienteId, quantidade: toBase(+l.quantidade, ing.unidade), unidadeDisplay: ing.unidade }
    })
    // Valida e converte grupos
    for (const g of form.grupos) {
      if (!g.nome.trim()) return setErro('Nome do grupo de complementos é obrigatório.')
      if (g.itens.length === 0) return setErro(`Adicione pelo menos 1 item no grupo "${g.nome}".`)
      for (const it of g.itens) {
        if (!it.nome.trim()) return setErro(`Item sem nome no grupo "${g.nome}".`)
      }
    }
    const gruposConvertidos = form.grupos.map(g => ({
      ...g,
      nome: g.nome.trim(),
      minimo: Number(g.minimo),
      maximo: Number(g.maximo),
      itens: g.itens.map(it => ({
        ...it,
        nome: it.nome.trim(),
        precoExtra: g.categoria === 'adicional' ? (parseFloat(it.precoExtra) || 0) : 0,
        ingredienteId: it.ingredienteId || null,
        quantidadeUsada: it.ingredienteId ? (parseFloat(it.quantidadeUsada) || 0) : 0,
      })),
    }))

    const dados = { nome: form.nome.trim(), descricao: form.descricao.trim(), precoVenda: +form.precoVenda, categoria: form.categoria, ingredientes: ingredientesConvertidos, grupos: gruposConvertidos }
    if (editandoId) editarPrato(editandoId, dados)
    else adicionarPrato(dados)
    setModal(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Receitas</h1>
          <p className="page-subtitle">{pratos.length} receita{pratos.length !== 1 ? 's' : ''} cadastrada{pratos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo} disabled={!ingredientes.length}>
          <Plus size={15} /> Nova Receita
        </button>
      </div>

      {!ingredientes.length && (
        <div className="rounded-xl p-3 mb-4 flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span className="text-sm text-amber-600">Cadastre insumos primeiro antes de criar receitas.</span>
        </div>
      )}

      {/* Filtro por categoria */}
      {pratos.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {categoriasFiltro.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filtroCategoria === cat
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {cat}
              {cat !== 'Todas' && (
                <span className="ml-1 opacity-60">{pratos.filter(p => p.categoria === cat).length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {pratosFiltrados.length === 0 ? (
          <TabelaVazia
            icone={BookOpen}
            mensagem={filtroCategoria !== 'Todas' ? `Nenhuma receita em "${filtroCategoria}"` : 'Nenhuma receita cadastrada'}
            submensagem={filtroCategoria === 'Todas' ? 'Crie receitas e vincule insumos para calcular custos automaticamente.' : undefined}
            acao={filtroCategoria === 'Todas' && ingredientes.length ? <button className="btn btn-secondary" onClick={abrirNovo}><Plus size={13} /> Criar receita</button> : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Receita</th>
                  <th>Categoria</th>
                  <th>Preço Venda</th>
                  <th>Custo</th>
                  <th>CMV%</th>
                  <th>Lucro</th>
                  <th>Margem</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pratosFiltrados.map(prato => {
                  const custo = custoPrato(prato, ingredientes)
                  const lucro = lucroPrato(prato, ingredientes)
                  const margem = margemPrato(prato, ingredientes)
                  const cmv = cmvPrato(prato, ingredientes)
                  return (
                    <tr key={prato.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prato.nome}</span>
                          {prato.grupos?.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                              <ListChecks size={10} style={{ display: 'inline', marginRight: 3 }} />{prato.grupos.length} grupo{prato.grupos.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {prato.categoria || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(prato.precoVenda)}</td>
                      <td style={{ color: '#ef4444' }}>{formatarMoeda(custo)}</td>
                      <td>
                        <Badge cor={cmv <= 30 ? 'green' : cmv <= 45 ? 'yellow' : 'red'}>
                          CMV {formatarPorcentagem(cmv)}
                        </Badge>
                      </td>
                      <td style={{ color: '#3b82f6' }}>{formatarMoeda(lucro)}</td>
                      <td><Badge cor={margemCor(margem)}>{formatarPorcentagem(margem)}</Badge></td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button className="btn btn-ghost p-1.5" onClick={() => abrirEditar(prato)}><Pencil size={13} /></button>
                          <button className="btn btn-ghost p-1.5" style={{ color: '#ef4444' }} onClick={() => setConfirmar(prato.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal aberto={modal} onFechar={() => setModal(false)} titulo={editandoId ? 'Editar Receita' : 'Nova Receita'} largura="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome da receita *</label>
              <input className="input" placeholder="Ex: Pizza Calabresa" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Categoria</label>
              {adicionandoCategoria ? (
                <div className="flex gap-1">
                  <input
                    className="input flex-1"
                    placeholder="Nome da categoria..."
                    value={novaCategoriaNome}
                    autoFocus
                    onChange={e => setNovaCategoriaNome(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && novaCategoriaNome.trim()) {
                        setForm(f => ({ ...f, categoria: novaCategoriaNome.trim() }))
                        setAdicionandoCategoria(false)
                      }
                      if (e.key === 'Escape') setAdicionandoCategoria(false)
                    }}
                  />
                  <button className="btn btn-primary px-3" onClick={() => {
                    if (novaCategoriaNome.trim()) {
                      setForm(f => ({ ...f, categoria: novaCategoriaNome.trim() }))
                    }
                    setAdicionandoCategoria(false)
                  }}>OK</button>
                  <button className="btn btn-ghost p-2" onClick={() => setAdicionandoCategoria(false)}><X size={13} /></button>
                </div>
              ) : (
                <select className="input" value={form.categoria} onChange={e => {
                  if (e.target.value === '__nova__') {
                    setAdicionandoCategoria(true)
                    setNovaCategoriaNome('')
                  } else {
                    setForm(f => ({ ...f, categoria: e.target.value }))
                  }
                }}>
                  {!form.categoria && <option value="">Selecionar categoria...</option>}
                  {[...new Set([...todasCategorias, form.categoria].filter(Boolean))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__nova__">+ Criar categoria</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Descrição <span style={{ fontWeight: 400 }}>(aparece no cardápio)</span></label>
            <input className="input" placeholder="Ex: Massa artesanal, calabresa defumada e queijo mussarela..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          {/* Insumos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Insumos</label>
              <button className="btn btn-secondary py-1 px-2 text-xs" onClick={() => setForm(f => ({ ...f, ingredientes: [...f.ingredientes, { ingredienteId: '', quantidade: '' }] }))}>
                <Plus size={11} /> Adicionar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {form.ingredientes.map((linha, idx) => {
                const ingSel = ingredientes.find(i => i.id === linha.ingredienteId)
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="input flex-1"
                      value={linha.ingredienteId}
                      onChange={e => setForm(f => ({ ...f, ingredientes: f.ingredientes.map((l, i) => i === idx ? { ...l, ingredienteId: e.target.value } : l) }))}
                    >
                      <option value="">Selecionar insumo...</option>
                      {ingredientes.map(ing => <option key={ing.id} value={ing.id}>{ing.nome}</option>)}
                    </select>
                    <div className="flex items-center gap-1 w-32">
                      <input
                        className="input"
                        type="number" min="0" step="any" placeholder="Qtd"
                        value={linha.quantidade}
                        onChange={e => setForm(f => ({ ...f, ingredientes: f.ingredientes.map((l, i) => i === idx ? { ...l, quantidade: e.target.value } : l) }))}
                      />
                      {ingSel && <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{ingSel.unidade}</span>}
                    </div>
                    <button
                      className="btn btn-ghost p-1.5 shrink-0" style={{ color: '#ef4444' }}
                      onClick={() => setForm(f => ({ ...f, ingredientes: f.ingredientes.filter((_, i) => i !== idx) }))}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Calculadora de Preço */}
          {custoPreview > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                <Calculator size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Calculadora de Preço Sugerido</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-hover)' }}>
                  {[{ id: 'margem', label: 'Por Margem %' }, { id: 'cmv', label: 'Por CMV %' }].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTabPreco(tab.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={tabPreco === tab.id
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { color: 'var(--text-secondary)' }
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
                      {tabPreco === 'margem' ? 'Margem desejada (%)' : 'CMV desejado (%)'}
                    </label>
                    <input
                      className="input"
                      type="number" min="1" max="99" step="1"
                      value={metaValor}
                      onChange={e => setMetaValor(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Preço sugerido</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                      {precoSugerido > 0 ? formatarMoeda(precoSugerido) : '—'}
                    </p>
                  </div>
                  {precoSugerido > 0 && (
                    <button
                      className="btn btn-secondary mt-4"
                      onClick={() => setForm(f => ({ ...f, precoVenda: precoSugerido.toFixed(2) }))}
                    >
                      Usar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preço de venda */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Preço de Venda (R$) *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.precoVenda} onChange={e => setForm(f => ({ ...f, precoVenda: e.target.value }))} />
          </div>

          {/* Live preview */}
          {form.precoVenda && custoPreview > 0 && (
            <div className="rounded-xl p-3 grid grid-cols-4 gap-3 text-sm"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
              {[
                { label: 'Custo', valor: formatarMoeda(custoPreview), cor: '#ef4444' },
                { label: 'CMV%', valor: formatarPorcentagem(cmvPreview), cor: cmvPreview <= 35 ? 'var(--accent)' : '#f59e0b' },
                { label: 'Lucro', valor: formatarMoeda(lucroPreview), cor: lucroPreview >= 0 ? '#3b82f6' : '#ef4444' },
                { label: 'Margem', valor: formatarPorcentagem(margemPreview), cor: margemPreview >= 30 ? 'var(--accent)' : '#f59e0b' },
              ].map(({ label, valor, cor }) => (
                <div key={label}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="font-semibold" style={{ color: cor }}>{valor}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Grupos de Complementos/Adicionais ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ListChecks size={14} style={{ color: 'var(--accent)' }} />
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Complementos e Adicionais</label>
              </div>
              <div className="flex gap-1.5">
                <button className="btn btn-secondary py-1 px-2 text-xs" style={{ color: 'var(--accent)' }}
                  onClick={() => setForm(f => ({ ...f, grupos: [...f.grupos, novoGrupo('complemento')] }))}>
                  <Plus size={11} /> 🎁 Complemento
                </button>
                <button className="btn btn-secondary py-1 px-2 text-xs" style={{ color: '#16a34a' }}
                  onClick={() => setForm(f => ({ ...f, grupos: [...f.grupos, novoGrupo('adicional')] }))}>
                  <Plus size={11} /> 💰 Adicional
                </button>
              </div>
            </div>

            {form.grupos.length === 0 && (
              <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                <strong>Complemento:</strong> opções grátis incluídas (ex: frutas do açaí). &nbsp;
                <strong>Adicional:</strong> itens pagos a mais (ex: granola extra +R$2).
              </p>
            )}

            <div className="flex flex-col gap-3">
              {form.grupos.map((grupo, gi) => {
                const isAdicional = grupo.categoria === 'adicional'
                function setGrupo(fn) {
                  setForm(f => ({ ...f, grupos: f.grupos.map((g, i) => i === gi ? fn(g) : g) }))
                }
                function setItem(ii, fn) {
                  setGrupo(g => ({ ...g, itens: g.itens.map((it, j) => j === ii ? fn(it) : it) }))
                }
                return (
                  <div key={grupo.id} className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: 'var(--bg-hover)', border: `1px solid ${isAdicional ? 'rgba(22,163,74,0.3)' : 'var(--border)'}` }}>
                    {/* Header do grupo: badge tipo + nome + remover */}
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: isAdicional ? 'rgba(22,163,74,0.12)' : 'var(--accent-bg)', color: isAdicional ? '#16a34a' : 'var(--accent)' }}>
                        {isAdicional ? '💰 Adicional' : '🎁 Complemento'}
                      </span>
                      <input className="input flex-1 text-sm" placeholder="Nome do grupo (ex: Frutas, Granola, Queijo extra...)"
                        value={grupo.nome} onChange={e => setGrupo(g => ({ ...g, nome: e.target.value }))} />
                      <button className="btn btn-ghost p-1.5 shrink-0" style={{ color: '#ef4444' }}
                        onClick={() => setForm(f => ({ ...f, grupos: f.grupos.filter((_, i) => i !== gi) }))}>
                        <X size={13} />
                      </button>
                    </div>

                    {/* Tipo + min + max */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Seleção</label>
                        <select className="input text-xs" value={grupo.tipo}
                          onChange={e => setGrupo(g => ({ ...g, tipo: e.target.value, maximo: e.target.value === 'unico' ? 1 : g.maximo }))}>
                          <option value="unico">Escolha 1</option>
                          <option value="multiplo">Múltipla escolha</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Mínimo</label>
                        <input className="input text-xs" type="number" min="0" value={grupo.minimo}
                          onChange={e => setGrupo(g => ({ ...g, minimo: Math.max(0, +e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Máximo</label>
                        <input className="input text-xs" type="number" min="1" value={grupo.maximo} disabled={grupo.tipo === 'unico'}
                          onChange={e => setGrupo(g => ({ ...g, maximo: Math.max(1, +e.target.value) }))} />
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="flex flex-col gap-2 mt-1">
                      {grupo.itens.map((item, ii) => {
                        const ingVinc = ingredientes.find(i => i.id === item.ingredienteId)
                        return (
                          <div key={item.id} className="rounded-lg p-2 flex flex-col gap-1.5"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="flex gap-2 items-center">
                              <input className="input flex-1 text-sm" placeholder={isAdicional ? 'Ex: Granola Extra, Leite Ninho...' : 'Ex: Morango, Banana, Kiwi...'}
                                value={item.nome} onChange={e => setItem(ii, it => ({ ...it, nome: e.target.value }))} />
                              {isAdicional && (
                                <div className="flex items-center gap-1 w-28 shrink-0">
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+R$</span>
                                  <input className="input text-sm" type="number" min="0" step="0.01" placeholder="0,00"
                                    value={item.precoExtra} onChange={e => setItem(ii, it => ({ ...it, precoExtra: e.target.value }))} />
                                </div>
                              )}
                              <button className="btn btn-ghost p-1 shrink-0" style={{ color: '#ef4444' }}
                                onClick={() => setGrupo(g => ({ ...g, itens: g.itens.filter((_, j) => j !== ii) }))}>
                                <X size={12} />
                              </button>
                            </div>
                            {/* Vínculo com insumo */}
                            <div className="flex gap-2 items-center">
                              <select className="input text-xs flex-1"
                                value={item.ingredienteId}
                                onChange={e => setItem(ii, it => ({ ...it, ingredienteId: e.target.value, quantidadeUsada: '' }))}>
                                <option value="">🔗 Vincular insumo (opcional — controla estoque)</option>
                                {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                              </select>
                              {item.ingredienteId && (
                                <div className="flex items-center gap-1 w-28 shrink-0">
                                  <input className="input text-xs" type="number" min="0" step="any" placeholder="Qtd"
                                    value={item.quantidadeUsada} onChange={e => setItem(ii, it => ({ ...it, quantidadeUsada: e.target.value }))} />
                                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{ingVinc?.unidade}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <button className="btn btn-ghost text-xs py-1" style={{ alignSelf: 'flex-start', color: 'var(--accent)' }}
                        onClick={() => setGrupo(g => ({ ...g, itens: [...g.itens, novoItem()] }))}>
                        <Plus size={11} /> Adicionar item
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar}>{editandoId ? 'Salvar' : 'Criar receita'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        aberto={!!confirmar} onFechar={() => setConfirmar(null)}
        onConfirmar={() => removerPrato(confirmar)}
        titulo="Excluir receita"
        mensagem="Tem certeza? Os registros de vendas desta receita também serão removidos."
      />
    </div>
  )
}
