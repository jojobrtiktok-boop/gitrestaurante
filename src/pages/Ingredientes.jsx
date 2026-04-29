import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, FlaskConical, Search, AlertTriangle, AlertCircle, Info, PackagePlus, TrendingUp, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import TabelaVazia from '../components/ui/TabelaVazia.jsx'
import FiltroPeriodo from '../components/ui/FiltroPeriodo.jsx'
import { UNIDADES, UNIDADE_LABELS } from '../utils/unidades.js'
import { formatarMoeda, hoje } from '../utils/formatacao.js'

const FORM_VAZIO = { nome: '', preco: '', unidade: 'kg', quantidadeEstoque: '', estoqueMinimo: '', fatorCorrecao: '1', perecivel: false, percentualPerda: '0' }
const FORM_COMPRA_VAZIO = { ingredienteId: '', quantidade: '', precoUnitario: '', data: hoje() }

function EstoqueCell({ qtd, unidade }) {
  const negativo = qtd < 0
  const baixo = !negativo && (unidade === 'un' ? qtd < 3 : qtd < 1)
  return (
    <div className="flex items-center gap-1.5">
      {negativo && <AlertCircle size={13} className="text-red-500 shrink-0" />}
      {baixo && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
      <span style={{ color: negativo ? '#ef4444' : baixo ? '#f59e0b' : 'var(--text-primary)', fontWeight: negativo || baixo ? 600 : 400 }}>
        {Number(qtd).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {unidade}
      </span>
      {negativo && <span className="text-xs text-red-400">(déficit)</span>}
      {baixo && <span className="text-xs text-amber-400">(baixo)</span>}
    </div>
  )
}

/* ── Aba: Insumos ─────────────────────────────────── */
function AbaInsumos({ onRegisterOpen }) {
  const { ingredientes, adicionarIngrediente, editarIngrediente, removerIngrediente, configuracaoGeral } = useApp()
  const estoqueMinimoPadrao = configuracaoGeral?.estoqueMinimoPadrao ?? 0
  const [busca, setBusca] = useState('')
  const [subAba, setSubAba] = useState('geral')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [confirmar, setConfirmar] = useState(null)
  const [erroExclusao, setErroExclusao] = useState('')

  const porBusca = ingredientes.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
  const filtrados = subAba === 'estoque-baixo'
    ? porBusca.filter(i => i.quantidadeEstoque <= (i.estoqueMinimo !== null && i.estoqueMinimo !== undefined ? i.estoqueMinimo : estoqueMinimoPadrao))
    : porBusca
  const emDeficit = ingredientes.filter(i => i.quantidadeEstoque < 0)
  const estoqueBaixo = ingredientes.filter(i => i.quantidadeEstoque >= 0 && (i.unidade === 'un' ? i.quantidadeEstoque < 3 : i.quantidadeEstoque < 1))

  function abrirNovo() { setForm(FORM_VAZIO); setEditandoId(null); setErro(''); setModal(true) }
  useEffect(() => { onRegisterOpen?.(abrirNovo) }, [])
  function abrirEditar(ing) {
    setForm({
      nome: ing.nome, preco: String(ing.preco), unidade: ing.unidade,
      quantidadeEstoque: String(ing.quantidadeEstoque),
      estoqueMinimo: ing.estoqueMinimo !== null && ing.estoqueMinimo !== undefined ? String(ing.estoqueMinimo) : '',
      fatorCorrecao: String(ing.fatorCorrecao ?? 1),
      perecivel: !!ing.perecivel,
      percentualPerda: String(ing.percentualPerda ?? 0),
    })
    setEditandoId(ing.id); setErro(''); setModal(true)
  }

  async function salvar() {
    if (!form.nome.trim()) return setErro('Nome é obrigatório.')
    const perda = parseFloat(form.percentualPerda)
    if (isNaN(perda) || perda < 0 || perda > 100) return setErro('% de perda deve ser entre 0 e 100.')

    const dados = {
      nome: form.nome.trim(),
      preco: +form.preco || 0,
      unidade: form.unidade,
      quantidadeEstoque: +form.quantidadeEstoque || 0,
      estoqueMinimo: form.estoqueMinimo !== '' ? +form.estoqueMinimo : null,
      fatorCorrecao: 1,
      perecivel: form.perecivel,
      percentualPerda: perda,
    }
    if (editandoId) {
      const r = await editarIngrediente(editandoId, dados)
      if (r?.erro) return setErro('Erro ao salvar: ' + r.erro)
    } else {
      adicionarIngrediente(dados)
    }
    setModal(false)
  }

  function excluir(id) {
    const r = removerIngrediente(id)
    if (r?.erro) setErroExclusao(r.erro)
  }

  return (
    <>
      {emDeficit.length > 0 && (
        <div className="rounded-xl p-3 mb-3 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-600">Estoque em déficit</p>
            <p className="text-xs text-red-500 mt-0.5">{emDeficit.map(i => i.nome).join(', ')}</p>
          </div>
        </div>
      )}
      {estoqueBaixo.length > 0 && (
        <div className="rounded-xl p-3 mb-3 flex items-start gap-2.5" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600">Estoque baixo</p>
            <p className="text-xs text-amber-500 mt-0.5">{estoqueBaixo.map(i => `${i.nome} (${Number(i.quantidadeEstoque).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${i.unidade})`).join(', ')}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '0 12px', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px 0', fontSize: 14, color: 'var(--text-primary)' }}
            placeholder="Buscar insumo..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', borderRadius: 10, padding: 3 }}>
          {[{ id: 'geral', label: 'Geral' }, { id: 'estoque-baixo', label: 'Estoque Baixo' }].map(s => (
            <button key={s.id} onClick={() => setSubAba(s.id)}
              style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .12s',
                background: subAba === s.id ? 'var(--bg-card)' : 'transparent',
                color: subAba === s.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: subAba === s.id ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {filtrados.length === 0 ? (
          <TabelaVazia icone={FlaskConical}
            mensagem={subAba === 'estoque-baixo' ? 'Nenhum insumo com estoque baixo' : busca ? 'Nenhuma mercadoria encontrada' : 'Nenhuma mercadoria cadastrada'}
            submensagem={subAba === 'estoque-baixo' ? 'Todos os insumos estão acima do mínimo.' : !busca ? 'Adicione insumos para criar receitas e calcular custos.' : undefined}
            acao={subAba === 'geral' && !busca ? <button className="btn btn-secondary" onClick={abrirNovo}><Plus size={13} /> Adicionar</button> : undefined} />
        ) : (() => {
          const totalEstoque = filtrados.reduce((s, i) => s + (i.preco || 0) * (i.quantidadeEstoque || 0), 0)
          return (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Unidade</th>
                    <th>% Perda</th>
                    <th>Estoque</th>
                    <th>Preço</th>
                    <th>Valor R$</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(ing => {
                    const perda = ing.percentualPerda ?? 0
                    const minimo = ing.estoqueMinimo !== null && ing.estoqueMinimo !== undefined ? ing.estoqueMinimo : estoqueMinimoPadrao
                    const abaixoMinimo = ing.quantidadeEstoque <= minimo
                    const valorEstoque = (ing.preco || 0) * (ing.quantidadeEstoque || 0)
                    return (
                      <tr key={ing.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ing.nome}</span>
                            {ing.perecivel && <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Perecível</span>}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{ing.unidade}</td>
                        <td>
                          {perda > 0
                            ? <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{perda}%</span>
                            : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <EstoqueCell qtd={ing.quantidadeEstoque} unidade={ing.unidade} />
                            {abaixoMinimo && ing.quantidadeEstoque >= 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 10 }}>
                                ↓ min
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          {ing.preco ? `${formatarMoeda(ing.preco)}/${ing.unidade}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ color: valorEstoque > 0 ? '#3b82f6' : 'var(--text-muted)', fontWeight: 600 }}>
                          {valorEstoque > 0 ? formatarMoeda(valorEstoque) : '—'}
                        </td>
                        <td>
                          <div className="flex gap-1 justify-end">
                            <button className="btn btn-ghost p-1.5" onClick={() => abrirEditar(ing)}><Pencil size={13} /></button>
                            <button className="btn btn-ghost p-1.5" style={{ color: '#ef4444' }} onClick={() => setConfirmar(ing.id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {totalEstoque > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={5} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total em estoque</td>
                      <td style={{ color: '#3b82f6', fontWeight: 700 }}>{formatarMoeda(totalEstoque)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )
        })()}
      </div>

      <Modal aberto={modal} onFechar={() => setModal(false)} titulo={editandoId ? 'Editar Insumo' : 'Novo Insumo'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome *</label>
            <input className="input" placeholder="Ex: Calabresa, Queijo Mussarela..." value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Unidade *</label>
              <select className="input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u} value={u}>{UNIDADE_LABELS[u]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Estoque ({form.unidade})</label>
              <input className="input" type="number" min="0" step="any" placeholder="0" value={form.quantidadeEstoque} onChange={e => setForm(f => ({ ...f, quantidadeEstoque: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Preço por {form.unidade} (R$)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Estoque mínimo ({form.unidade})
            </label>
            <input className="input" type="number" min="0" step="any"
              placeholder={`Padrão: ${estoqueMinimoPadrao}`}
              value={form.estoqueMinimo}
              onChange={e => setForm(f => ({ ...f, estoqueMinimo: e.target.value }))} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Deixe vazio para usar o padrão global configurado em Configurações.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                % de Perda
                <span title="Percentual perdido no preparo. Ex: 10 = 10% do peso se perde ao limpar/cortar."><Info size={12} style={{ color: 'var(--text-muted)' }} /></span>
              </label>
              <input className="input" type="number" min="0" max="100" step="0.5" placeholder="0" value={form.percentualPerda} onChange={e => setForm(f => ({ ...f, percentualPerda: e.target.value }))} />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.perecivel} onChange={e => setForm(f => ({ ...f, perecivel: e.target.checked }))} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Perecível</span>
              </label>
            </div>
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar}>{editandoId ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog aberto={!!confirmar} onFechar={() => setConfirmar(null)} onConfirmar={() => excluir(confirmar)} titulo="Excluir insumo" mensagem="Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita." />
      <Modal aberto={!!erroExclusao} onFechar={() => setErroExclusao('')} titulo="Não foi possível excluir">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erroExclusao}</p>
        <div className="flex justify-end"><button className="btn btn-secondary" onClick={() => setErroExclusao('')}>Entendi</button></div>
      </Modal>
    </>
  )
}

/* ── Aba: Extrato de Insumos ──────────────────────── */
function AbaExtrato() {
  const { ingredientes, compras, registrarCompra, removerCompra, editarCompra } = useApp()
  const [periodo, setPeriodo] = useState({ dataInicio: hoje().slice(0, 7) + '-01', dataFim: hoje() })
  const [modalCompra, setModalCompra] = useState(false)
  const [formCompra, setFormCompra] = useState(FORM_COMPRA_VAZIO)
  const [erroCompra, setErroCompra] = useState('')
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [editandoCompra, setEditandoCompra] = useState(null)
  const [formEdit, setFormEdit] = useState(FORM_COMPRA_VAZIO)
  const [erroEdit, setErroEdit] = useState('')

  function abrirEditar(c) {
    setFormEdit({ ingredienteId: c.ingredienteId, quantidade: String(c.quantidade), precoUnitario: String(c.precoUnitario), data: c.data })
    setErroEdit('')
    setEditandoCompra(c.id)
  }

  function salvarEdicao() {
    const qtd = parseFloat(formEdit.quantidade)
    const preco = parseFloat(formEdit.precoUnitario)
    if (!qtd || qtd <= 0) return setErroEdit('Quantidade inválida.')
    if (!preco || preco < 0) return setErroEdit('Preço inválido.')
    editarCompra(editandoCompra, { quantidade: qtd, precoUnitario: preco, data: formEdit.data })
    setEditandoCompra(null)
    setErroEdit('')
  }

  const comprasFiltradas = compras.filter(c => c.data >= periodo.dataInicio && c.data <= periodo.dataFim)

  // Agrupado por ingrediente
  const resumoPorInsumo = ingredientes.map(ing => {
    const cs = comprasFiltradas.filter(c => c.ingredienteId === ing.id)
    const totalKg = cs.reduce((s, c) => s + c.quantidade, 0)
    const totalReais = cs.reduce((s, c) => s + c.quantidade * c.precoUnitario, 0)
    const precoMedio = totalKg > 0 ? totalReais / totalKg : 0
    return { ing, totalKg, totalReais, precoMedio, qtdCompras: cs.length }
  }).filter(r => r.qtdCompras > 0)

  const totalGasto = comprasFiltradas.reduce((s, c) => s + c.quantidade * c.precoUnitario, 0)

  function salvarCompra() {
    if (!formCompra.ingredienteId) return setErroCompra('Selecione um insumo.')
    const qtd = parseFloat(formCompra.quantidade)
    const preco = parseFloat(formCompra.precoUnitario)
    if (!qtd || qtd <= 0) return setErroCompra('Quantidade inválida.')
    if (!preco || preco < 0) return setErroCompra('Preço inválido.')
    registrarCompra(formCompra.ingredienteId, qtd, preco, formCompra.data)
    setModalCompra(false)
    setFormCompra(FORM_COMPRA_VAZIO)
    setErroCompra('')
  }

  return (
    <>
      <div id="extrato-print">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <FiltroPeriodo onChange={setPeriodo} defaultPeriodo="mes" />
        <div className="flex items-center gap-2 flex-wrap">
          {totalGasto > 0 && (
            <div className="card px-4 py-2 flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total gasto no período:</span>
              <span className="font-bold text-sm" style={{ color: '#ef4444' }}>{formatarMoeda(totalGasto)}</span>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ fontSize: 12 }}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {resumoPorInsumo.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Nenhuma compra no período</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Registre entradas de estoque para ver o extrato.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden mb-4">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Qtd. comprada</th>
                  <th>Nº compras</th>
                  <th>Preço médio</th>
                  <th>Total gasto</th>
                </tr>
              </thead>
              <tbody>
                {resumoPorInsumo.map(({ ing, totalKg, totalReais, precoMedio, qtdCompras }) => (
                  <tr key={ing.id}>
                    <td className="font-medium">
                      {ing.nome}
                      {ing.perecivel && <span className="ml-2 text-xs font-semibold" style={{ color: '#ef4444' }}>perecível</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {totalKg.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{qtdCompras}×</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(precoMedio)}/{ing.unidade}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatarMoeda(totalReais)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Histórico detalhado */}
      {comprasFiltradas.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Histórico detalhado</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Insumo</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...comprasFiltradas].sort((a, b) => b.data.localeCompare(a.data)).map(c => {
                  const ing = ingredientes.find(i => i.id === c.ingredienteId)
                  return (
                    <tr key={c.id}>
                      <td className="text-sm font-mono" style={{ color: 'var(--accent)' }}>{c.data}</td>
                      <td className="font-medium">{ing?.nome || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.quantidade} {ing?.unidade}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatarMoeda(c.precoUnitario)}/{ing?.unidade}</td>
                      <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatarMoeda(c.quantidade * c.precoUnitario)}</td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button className="btn btn-ghost p-1.5" onClick={() => abrirEditar(c)}><Pencil size={13} /></button>
                          <button className="btn btn-ghost p-1.5" style={{ color: '#ef4444' }} onClick={() => setConfirmarExcluir(c.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>{/* fim #extrato-print */}

      <ConfirmDialog aberto={!!confirmarExcluir} onFechar={() => setConfirmarExcluir(null)} onConfirmar={() => { removerCompra(confirmarExcluir); setConfirmarExcluir(null) }} titulo="Excluir entrada" mensagem="Tem certeza que deseja excluir esta entrada? O estoque será ajustado automaticamente." />

      <Modal aberto={!!editandoCompra} onFechar={() => { setEditandoCompra(null); setErroEdit('') }} titulo="Editar Entrada">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Quantidade</label>
              <input className="input" type="number" min="0" step="any" value={formEdit.quantidade} onChange={e => setFormEdit(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Preço unitário (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={formEdit.precoUnitario} onChange={e => setFormEdit(f => ({ ...f, precoUnitario: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Data</label>
            <input className="input" type="date" value={formEdit.data} onChange={e => setFormEdit(f => ({ ...f, data: e.target.value }))} />
          </div>
          {erroEdit && <p className="text-sm text-red-500">{erroEdit}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn btn-ghost" onClick={() => setEditandoCompra(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvarEdicao}>Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Modal compra */}
      <Modal aberto={modalCompra} onFechar={() => { setModalCompra(false); setErroCompra('') }} titulo="Registrar Entrada de Estoque">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Insumo *</label>
            <select className="input" value={formCompra.ingredienteId} onChange={e => setFormCompra(f => ({ ...f, ingredienteId: e.target.value }))}>
              <option value="">Selecionar insumo...</option>
              {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Quantidade {formCompra.ingredienteId && `(${ingredientes.find(i => i.id === formCompra.ingredienteId)?.unidade})`}
              </label>
              <input className="input" type="number" min="0" step="any" placeholder="0" value={formCompra.quantidade} onChange={e => setFormCompra(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Preço unitário (R$) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={formCompra.precoUnitario} onChange={e => setFormCompra(f => ({ ...f, precoUnitario: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Data da compra</label>
            <input className="input" type="date" value={formCompra.data} onChange={e => setFormCompra(f => ({ ...f, data: e.target.value }))} />
          </div>

          {/* Preview preço médio */}
          {formCompra.ingredienteId && formCompra.quantidade && formCompra.precoUnitario && (() => {
            const ing = ingredientes.find(i => i.id === formCompra.ingredienteId)
            if (!ing) return null
            const estoqueAtual = ing.quantidadeEstoque || 0
            const novoEstoque = estoqueAtual + +formCompra.quantidade
            const novoPreco = novoEstoque > 0
              ? ((estoqueAtual * ing.preco) + (+formCompra.quantidade * +formCompra.precoUnitario)) / novoEstoque
              : +formCompra.precoUnitario
            return (
              <div className="rounded-xl p-3 grid grid-cols-3 gap-3" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Estoque atual</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{estoqueAtual} {ing.unidade}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Novo estoque</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>{novoEstoque.toFixed(3)} {ing.unidade}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Preço médio</p>
                  <p className="font-semibold text-sm" style={{ color: '#d97706' }}>{formatarMoeda(novoPreco)}/{ing.unidade}</p>
                </div>
              </div>
            )
          })()}

          {erroCompra && <p className="text-sm text-red-500">{erroCompra}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn btn-ghost" onClick={() => { setModalCompra(false); setErroCompra('') }}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvarCompra}>Registrar Entrada</button>
          </div>
        </div>
      </Modal>

      {/* FAB para abrir modal de compra de qualquer aba */}
      <div style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 20 }}>
        <button className="btn btn-primary" onClick={() => setModalCompra(true)} style={{ borderRadius: 50, padding: '12px 20px', boxShadow: '0 4px 16px var(--accent-glow)' }}>
          <PackagePlus size={16} /> Adicionar Estoque
        </button>
      </div>
    </>
  )
}

/* ── Aba: Para Comprar ────────────────────────────── */
function AbaParaComprar({ onGerarLista }) {
  const { ingredientes, configuracaoGeral } = useApp()
  const minPadrao = configuracaoGeral?.estoqueMinimoPadrao ?? 0

  const paraComprar = ingredientes.filter(ing => {
    const min = ing.estoqueMinimo !== null && ing.estoqueMinimo !== undefined ? ing.estoqueMinimo : minPadrao
    return ing.quantidadeEstoque <= min
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {paraComprar.length} insumo{paraComprar.length !== 1 ? 's' : ''} abaixo do estoque mínimo
        </p>
        {paraComprar.length > 0 && (
          <button className="btn btn-primary" onClick={onGerarLista} style={{ fontSize: 13 }}>
            Gerar Lista de Compras
          </button>
        )}
      </div>

      {paraComprar.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Tudo em ordem!</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum insumo abaixo do estoque mínimo.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Unidade</th>
                  <th>Estoque atual</th>
                  <th>Mínimo</th>
                  <th>Déficit</th>
                </tr>
              </thead>
              <tbody>
                {paraComprar.map(ing => {
                  const min = ing.estoqueMinimo !== null && ing.estoqueMinimo !== undefined ? ing.estoqueMinimo : minPadrao
                  const deficit = Math.max(0, min - ing.quantidadeEstoque)
                  return (
                    <tr key={ing.id}>
                      <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{ing.nome}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{ing.unidade}</td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                          {Number(ing.quantidadeEstoque).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {Number(min).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}
                      </td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>
                          -{Number(deficit).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Aba: Lista de Compras ────────────────────────── */
function AbaListaCompras() {
  const { listaCompras, gerarListaComprasAutomatica, adicionarItemLista, toggleItemLista, editarItemLista, removerItemLista, ingredientes } = useApp()
  const [modalAdicionar, setModalAdicionar] = useState(false)
  const [novoItem, setNovoItem] = useState({ nome: '', quantidade: '1', unidade: 'un', observacao: '' })

  function handleGerar() {
    gerarListaComprasAutomatica()
  }

  function handleAdicionar() {
    if (!novoItem.nome.trim()) return
    adicionarItemLista({ nome: novoItem.nome.trim(), quantidade: +novoItem.quantidade || 1, unidade: novoItem.unidade, observacao: novoItem.observacao })
    setNovoItem({ nome: '', quantidade: '1', unidade: 'un', observacao: '' })
    setModalAdicionar(false)
  }

  function handleWhatsApp() {
    const texto = `🛒 Lista de Compras — ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      listaCompras.map(i => `${i.checked ? '✓' : '□'} ${i.nome} — ${i.quantidade} ${i.unidade}${i.observacao ? ` (${i.observacao})` : ''}`).join('\n')
    window.open('https://wa.me/?text=' + encodeURIComponent(texto))
  }

  return (
    <>
      <div id="lista-compras-print">
        {/* Botões — ocultos na impressão */}
        <div className="lista-no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleGerar} style={{ fontSize: 12 }}>
            Gerar automático
          </button>
          <button className="btn btn-primary" onClick={() => setModalAdicionar(true)} style={{ fontSize: 12 }}>
            <Plus size={13} /> Adicionar item
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ fontSize: 12 }}>
            <Printer size={13} /> Imprimir
          </button>
          <button className="btn btn-secondary" onClick={handleWhatsApp} style={{ fontSize: 12 }}>
            WhatsApp
          </button>
          {listaCompras.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
              {listaCompras.filter(i => i.checked).length}/{listaCompras.length} marcados
            </span>
          )}
        </div>

        {listaCompras.length === 0 ? (
          <div className="card text-center py-12 lista-no-print">
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Lista vazia</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Gere automaticamente ou adicione itens manualmente.</p>
          </div>
        ) : (
          <>
            {/* View normal — oculta na impressão */}
            <div className="card p-0 overflow-hidden lista-no-print">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {listaCompras.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: item.checked ? 'rgba(22,163,74,0.04)' : 'var(--bg-card)',
                    opacity: item.checked ? 0.65 : 1,
                    transition: 'opacity .15s',
                  }}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleItemLista(item.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.nome}
                    </span>
                    <input type="number" min="0.01" step="any"
                      value={item.quantidade}
                      onChange={e => editarItemLista(item.id, { quantidade: +e.target.value })}
                      style={{ width: 60, fontSize: 13, textAlign: 'center', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 6px', color: 'var(--text-primary)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28 }}>{item.unidade}</span>
                    <input
                      value={item.observacao || ''}
                      onChange={e => editarItemLista(item.id, { observacao: e.target.value })}
                      placeholder="obs..."
                      style={{ width: 100, fontSize: 12, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 8px', color: 'var(--text-secondary)' }} />
                    <button onClick={() => removerItemLista(item.id)} className="btn btn-ghost p-1.5" style={{ color: '#ef4444', flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* View impressão — aparece só ao imprimir */}
            <div className="lista-print-only" style={{ fontFamily: 'monospace', fontSize: 14, color: '#000', lineHeight: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, borderBottom: '2px solid #000', paddingBottom: 8 }}>
                Lista de Compras — {new Date().toLocaleDateString('pt-BR')}
              </p>
              {listaCompras.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 16, flexShrink: 0 }}>[ ]</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.nome}</span>
                  <span style={{ fontSize: 13, color: '#555', marginLeft: 4 }}>
                    — {item.quantidade} {item.unidade}{item.observacao ? ` (${item.observacao})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal adicionar item manual */}
      <Modal aberto={modalAdicionar} onFechar={() => setModalAdicionar(false)} titulo="Adicionar Item à Lista">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome do item *</label>
            <input className="input" autoFocus placeholder="Ex: Farinha de trigo"
              value={novoItem.nome} onChange={e => setNovoItem(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Quantidade</label>
              <input className="input" type="number" min="0.01" step="any" value={novoItem.quantidade}
                onChange={e => setNovoItem(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Unidade</label>
              <select className="input" value={novoItem.unidade} onChange={e => setNovoItem(f => ({ ...f, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u} value={u}>{UNIDADE_LABELS[u]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Observação</label>
            <input className="input" placeholder="Opcional..." value={novoItem.observacao}
              onChange={e => setNovoItem(f => ({ ...f, observacao: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={() => setModalAdicionar(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdicionar} disabled={!novoItem.nome.trim()}>Adicionar</button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ── Página principal ─────────────────────────────── */
export default function Mercadorias() {
  const { ingredientes, compras, registrarCompra, configuracaoGeral, listaCompras, gerarListaComprasAutomatica } = useApp()
  const [aba, setAba] = useState('insumos')
  const abrirNovoInsumoRef = useRef(null)
  const [modalCompra, setModalCompra] = useState(false)
  const [formCompra, setFormCompra] = useState(FORM_COMPRA_VAZIO)
  const [erroCompra, setErroCompra] = useState('')

  function salvarCompra() {
    if (!formCompra.ingredienteId) return setErroCompra('Selecione um insumo.')
    const qtd = parseFloat(formCompra.quantidade)
    const preco = parseFloat(formCompra.precoUnitario)
    if (!qtd || qtd <= 0) return setErroCompra('Quantidade inválida.')
    if (!preco || preco < 0) return setErroCompra('Preço inválido.')
    const ing = ingredientes.find(i => i.id === formCompra.ingredienteId)
    const estoqueAtual = ing?.quantidadeEstoque || 0
    const novoEstoque = estoqueAtual + qtd
    const novoPreco = novoEstoque > 0
      ? ((estoqueAtual * (ing?.preco || 0)) + (qtd * preco)) / novoEstoque
      : preco
    registrarCompra(formCompra.ingredienteId, qtd, preco, formCompra.data)
    setModalCompra(false)
    setFormCompra(FORM_COMPRA_VAZIO)
    setErroCompra('')
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mercadorias</h1>
          <p className="page-subtitle">{ingredientes.length} insumo{ingredientes.length !== 1 ? 's' : ''} cadastrado{ingredientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setModalCompra(true)}>
            <PackagePlus size={15} /> Adicionar Estoque
          </button>
          {aba === 'insumos' && (
            <button className="btn btn-primary" onClick={() => abrirNovoInsumoRef.current?.()}>
              <Plus size={15} /> Nova Mercadoria
            </button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 flex-wrap" style={{ background: 'var(--bg-hover)', width: 'fit-content' }}>
        {[
          { id: 'insumos', label: 'Insumos' },
          { id: 'para-comprar', label: 'Para Comprar', badge: ingredientes.filter(ing => ing.quantidadeEstoque <= (ing.estoqueMinimo !== null && ing.estoqueMinimo !== undefined ? ing.estoqueMinimo : 0)).length },
          { id: 'lista', label: 'Lista de Compras', badge: listaCompras.length || null },
          { id: 'extrato', label: 'Extrato de Insumos' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ display: 'flex', alignItems: 'center', gap: 5,
              background: aba === a.id ? 'var(--bg-card)' : 'transparent',
              color: aba === a.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: aba === a.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
            {a.label}
            {a.badge > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#ef4444', color: '#fff', borderRadius: 20, padding: '0 5px', minWidth: 16, textAlign: 'center' }}>
                {a.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'insumos' && <AbaInsumos onRegisterOpen={fn => { abrirNovoInsumoRef.current = fn }} />}
      {aba === 'para-comprar' && <AbaParaComprar onGerarLista={() => { gerarListaComprasAutomatica(); setAba('lista') }} />}
      {aba === 'lista' && <AbaListaCompras />}
      {aba === 'extrato' && <AbaExtrato />}

      {/* Modal Adicionar Estoque (acessível do header) */}
      <Modal aberto={modalCompra} onFechar={() => { setModalCompra(false); setErroCompra('') }} titulo="Registrar Entrada de Estoque">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Insumo *</label>
            <select className="input" value={formCompra.ingredienteId} onChange={e => setFormCompra(f => ({ ...f, ingredienteId: e.target.value }))}>
              <option value="">Selecionar insumo...</option>
              {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Quantidade {formCompra.ingredienteId && `(${ingredientes.find(i => i.id === formCompra.ingredienteId)?.unidade})`}
              </label>
              <input className="input" type="number" min="0" step="any" placeholder="0" value={formCompra.quantidade} onChange={e => setFormCompra(f => ({ ...f, quantidade: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Preço unitário (R$) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={formCompra.precoUnitario} onChange={e => setFormCompra(f => ({ ...f, precoUnitario: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Data da compra</label>
            <input className="input" type="date" value={formCompra.data} onChange={e => setFormCompra(f => ({ ...f, data: e.target.value }))} />
          </div>

          {formCompra.ingredienteId && formCompra.quantidade && formCompra.precoUnitario && (() => {
            const ing = ingredientes.find(i => i.id === formCompra.ingredienteId)
            if (!ing) return null
            const estoqueAtual = ing.quantidadeEstoque || 0
            const novoEstoque = estoqueAtual + +formCompra.quantidade
            const novoPreco = novoEstoque > 0
              ? ((estoqueAtual * ing.preco) + (+formCompra.quantidade * +formCompra.precoUnitario)) / novoEstoque
              : +formCompra.precoUnitario
            return (
              <div className="rounded-xl p-3 grid grid-cols-3 gap-3" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
                <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Estoque atual</p><p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{estoqueAtual} {ing.unidade}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Novo estoque</p><p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>{novoEstoque.toFixed(3)} {ing.unidade}</p></div>
                <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Preço médio</p><p className="font-semibold text-sm" style={{ color: '#d97706' }}>{formatarMoeda(novoPreco)}/{ing.unidade}</p></div>
              </div>
            )
          })()}

          {erroCompra && <p className="text-sm text-red-500">{erroCompra}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn btn-ghost" onClick={() => { setModalCompra(false); setErroCompra('') }}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvarCompra}>Registrar Entrada</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
