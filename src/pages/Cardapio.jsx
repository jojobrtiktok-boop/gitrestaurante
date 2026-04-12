import { useState, useRef, useEffect } from 'react'
import { UtensilsCrossed, Camera, X, Search, Check, Smartphone, Copy, Settings, Plus, Trash2, Link2, Users, FileText, Monitor, RefreshCw, Star, LayoutGrid, List, Truck, MapPin, ToggleLeft, ToggleRight, Banknote, QrCode, CreditCard, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import Badge, { margemCor, cmvCor } from '../components/ui/Badge.jsx'
import { custoPrato, lucroPrato, margemPrato, cmvPrato } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem } from '../utils/formatacao.js'
import { fromBase } from '../utils/unidades.js'
import { Link } from 'react-router-dom'
import { PainelCozinha, PainelCaixa } from './Displays.jsx'

function FotoPlaceholder() {
  return (
    <div className="w-full h-full" style={{ background: 'var(--bg-hover)' }} />
  )
}

/* ─── Modal detalhe ───────────────────────────────── */
function ModalDetalhe({ prato, onFechar, onFotoChange }) {
  const { ingredientes } = useApp()
  const fileRef = useRef(null)

  const custo  = custoPrato(prato, ingredientes)
  const lucro  = lucroPrato(prato, ingredientes)
  const margem = margemPrato(prato, ingredientes)
  const cmv    = cmvPrato(prato, ingredientes)

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('Máx 4 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => onFotoChange(prato.id, ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box max-w-md w-full" style={{ padding: 0 }}>

        {/* ── Topo: foto pequena ao lado do nome ── */}
        <div className="flex items-start gap-4 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Foto miniatura quadrada */}
          <div className="relative shrink-0 rounded-2xl overflow-hidden"
            style={{ width: 88, height: 88, background: 'var(--bg-hover)' }}>
            {prato.foto
              ? <img src={prato.foto} alt={prato.nome} className="w-full h-full object-cover" />
              : <FotoPlaceholder />
            }
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              title="Alterar foto"
            >
              <Camera size={16} className="text-white" />
            </button>
          </div>

          {/* Nome + categoria + ações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>{prato.nome}</p>
                {prato.categoria && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{prato.categoria}</p>}
              </div>
              <button onClick={onFechar} className="btn btn-ghost p-1 shrink-0"><X size={15} /></button>
            </div>

            {prato.descricao && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{prato.descricao}</p>
            )}

            {/* Botão foto */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 mt-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <Camera size={12} /> {prato.foto ? 'Alterar foto' : 'Adicionar foto'}
            </button>
            {prato.foto && (
              <button
                onClick={() => onFotoChange(prato.id, null)}
                className="flex items-center gap-1 mt-1 text-xs"
                style={{ color: '#ef4444' }}
              >
                <X size={11} /> Remover foto
              </button>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {prato.tipo === 'variacao' ? (
            /* ── Produto com variação ── */
            <>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                  {prato.meiaAMeia ? '½+½ Meia a Meia' : 'Produto com Variação'}
                </span>
                {prato.meiaAMeia && (
                  <span style={{ fontSize: 11, color: '#7c3aed' }}>· preço pelo {prato.calcVariacao === 'maior' ? 'maior valor' : 'valor médio'}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Opções / Sabores ({prato.variacoes?.length || 0})
                </p>
                <div className="flex flex-col gap-1.5">
                  {(prato.variacoes || []).map((v, idx) => (
                    <div key={v.id || idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.nome}</p>
                        {v.descricao && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.descricao}</p>}
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: 'var(--accent)' }}>
                        {v.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ── Produto normal ── */
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Custo de Produção', valor: formatarMoeda(custo),           cor: '#ef4444' },
                  { label: 'Preço de Venda',    valor: formatarMoeda(prato.precoVenda), cor: 'var(--accent)' },
                  { label: 'Lucro por Unidade', valor: formatarMoeda(lucro),            cor: '#3b82f6' },
                ].map(({ label, valor, cor }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <p className="text-xs leading-tight mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="font-bold text-base" style={{ color: cor }}>{valor}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Badge cor={cmvCor(cmv)}>CMV {formatarPorcentagem(cmv)}</Badge>
                <Badge cor={margemCor(margem)}>Margem {formatarPorcentagem(margem)}</Badge>
              </div>
              {prato.ingredientes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>O que leva</p>
                  <div className="flex flex-col gap-1.5">
                    {prato.ingredientes.map((linha, idx) => {
                      const ing = ingredientes.find(i => i.id === linha.ingredienteId)
                      if (!ing) return null
                      const qtdDisplay = fromBase(linha.quantidade, ing.unidade)
                      const fator = ing.fatorCorrecao ?? 1
                      const precoPorBase = (ing.preco * fator) / (ing.unidade === 'kg' || ing.unidade === 'L' ? 1000 : 1)
                      const custoLinha = precoPorBase * linha.quantidade
                      return (
                        <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{idx + 1}</span>
                          <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ing.nome}</span>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {qtdDisplay % 1 === 0 ? qtdDisplay : qtdDisplay.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unidade}
                          </span>
                          <span className="text-sm font-semibold w-16 text-right" style={{ color: '#ef4444' }}>
                            {formatarMoeda(custoLinha)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  )
}

/* ─── Card clean — sem foto ───────────────────────── */
function CardReceita({ prato, ingredientes, onClick }) {
  if (prato.tipo === 'variacao') {
    const precos = prato.variacoes?.map(v => v.preco) || []
    const min = precos.length ? Math.min(...precos) : 0
    const max = precos.length ? Math.max(...precos) : 0
    return (
      <button onClick={onClick} className="group flex flex-col text-left w-full transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 16px 16px', cursor: 'pointer', outline: 'none', gap: 0 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
        <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: 'var(--bg-hover)', flexShrink: 0, position: 'relative' }}>
          {prato.foto && <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          {prato.meiaAMeia && (
            <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, fontWeight: 800, color: '#7c3aed', background: 'rgba(124,58,237,0.15)', padding: '2px 7px', borderRadius: 20 }}>½+½</span>
          )}
        </div>
        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 2, letterSpacing: '-0.3px' }}>{prato.nome}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>{prato.categoria || ''}</p>
        {(prato.variacoes || []).slice(0, 3).map(v => (
          <span key={v.id} style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', lineHeight: 1.7 }}>· {v.nome}</span>
        ))}
        {(prato.variacoes?.length || 0) > 3 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{prato.variacoes.length - 3} mais</span>
        )}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>A partir de</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>{min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          {min !== max && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Até</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
        </div>
      </button>
    )
  }

  const custo = custoPrato(prato, ingredientes)
  const lucro = lucroPrato(prato, ingredientes)
  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left w-full transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '18px 16px 16px',
        cursor: 'pointer',
        outline: 'none',
        gap: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-active)'
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Foto ou Emoji */}
      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: 'var(--bg-hover)', flexShrink: 0 }}>
        {prato.foto && <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      {/* Nome */}
      <p style={{
        fontWeight: 800,
        fontSize: 16,
        color: 'var(--text-primary)',
        lineHeight: 1.25,
        marginBottom: 4,
        letterSpacing: '-0.3px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {prato.nome}
      </p>

      {/* Categoria */}
      <p style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        fontWeight: 500,
        marginBottom: 14,
        letterSpacing: '0.2px',
      }}>
        {prato.categoria || ''}
      </p>

      {/* Financeiro */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderTop: '1px solid var(--border)',
        paddingTop: 12,
      }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Custo</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{formatarMoeda(custo)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Venda</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{formatarMoeda(prato.precoVenda)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lucro</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>{formatarMoeda(lucro)}</span>
        </div>
      </div>
    </button>
  )
}

/* ─── Modal Variação (Meia a Meia) ───────────────── */
function ModalVariacao({ pratoEdit, onFechar, onSalvar }) {
  const { pratos: todosPrecos } = useApp()
  // Receitas disponíveis (excluindo variações já criadas)
  const receitasDisponiveis = todosPrecos.filter(p => p.tipo !== 'variacao')

  const fotoRef = useRef(null)
  const [nome, setNome] = useState(pratoEdit?.nome || '')
  const [categoria, setCategoria] = useState(pratoEdit?.categoria || '')
  const [descricao, setDescricao] = useState(pratoEdit?.descricao || '')
  const [foto, setFoto] = useState(pratoEdit?.foto || null)
  const [meiaAMeia, setMeiaAMeia] = useState(pratoEdit?.meiaAMeia ?? true)
  const [calcVariacao, setCalcVariacao] = useState(pratoEdit?.calcVariacao || 'maior')
  const [variacoes, setVariacoes] = useState(pratoEdit?.variacoes || [])

  // Seleção de receita para adicionar
  const [pratoSelecionadoId, setPratoSelecionadoId] = useState('')
  const [busca, setBusca] = useState('')
  const [precoOverride, setPrecoOverride] = useState('')

  const receitasFiltradas = receitasDisponiveis.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) &&
    !variacoes.find(v => v.pratoId === p.id)
  )
  const pratoSelecionado = receitasDisponiveis.find(p => p.id === pratoSelecionadoId)

  function handleFoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('Máx 4 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target.result)
    reader.readAsDataURL(file); e.target.value = ''
  }

  function addVariacao() {
    if (!pratoSelecionado) return
    const preco = precoOverride !== '' ? Number(precoOverride) : pratoSelecionado.precoVenda
    setVariacoes(prev => [...prev, {
      id: crypto.randomUUID(),
      pratoId: pratoSelecionado.id,
      nome: pratoSelecionado.nome,
      descricao: pratoSelecionado.descricao || '',
      foto: pratoSelecionado.foto || null,
      preco,
    }])
    setPratoSelecionadoId('')
    setPrecoOverride('')
    setBusca('')
  }

  function salvar() {
    if (!nome.trim()) return alert('Informe o nome do produto.')
    if (variacoes.length < 2) return alert('Adicione pelo menos 2 receitas/sabores.')
    const precos = variacoes.map(v => v.preco)
    onSalvar({ nome: nome.trim(), categoria: categoria.trim(), descricao: descricao.trim(), foto, tipo: 'variacao', meiaAMeia, calcVariacao, variacoes, precoVenda: Math.min(...precos), ingredientes: [] })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box max-w-lg w-full" style={{ padding: 0, maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{pratoEdit ? 'Editar Produto com Variação' : 'Novo Produto com Variação'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ex: Pizza meia a meia, combinações de sabores</p>
          </div>
          <button onClick={onFechar} className="btn btn-ghost p-1"><X size={15} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Foto + nome */}
          <div className="flex gap-3">
            <div className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer"
              style={{ width: 72, height: 72, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
              onClick={() => fotoRef.current?.click()}>
              {foto
                ? <img src={foto} alt="foto" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Camera size={20} style={{ color: 'var(--text-muted)' }} /></div>
              }
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <input className="input" placeholder="Nome do produto (ex: Pizza)" value={nome} onChange={e => setNome(e.target.value)} />
              <input className="input" placeholder="Categoria (ex: Pizzas)" value={categoria} onChange={e => setCategoria(e.target.value)} />
            </div>
          </div>
          <input className="input" placeholder="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} />

          {/* Meia a meia */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={meiaAMeia} onChange={e => setMeiaAMeia(e.target.checked)} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Permite Meia a Meia</span>
            </label>
            {meiaAMeia && (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Critério de preço para meia a meia:</p>
                <div className="flex gap-2">
                  {[{ id: 'maior', label: 'Maior preço' }, { id: 'media', label: 'Média dos preços' }].map(op => (
                    <button key={op.id} onClick={() => setCalcVariacao(op.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={calcVariacao === op.id
                        ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                        : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opções / Sabores */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Receitas adicionadas como opção ({variacoes.length})
            </label>

            {variacoes.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-3">
                {variacoes.map((v, idx) => (
                  <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{idx + 1}</span>
                    {v.foto && <img src={v.foto} alt={v.nome} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.nome}</p>
                      {v.descricao && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{v.descricao}</p>}
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: 'var(--accent)' }}>
                      {v.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <button onClick={() => setVariacoes(prev => prev.filter(x => x.id !== v.id))}
                      className="btn btn-ghost p-1 shrink-0" style={{ color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selecionar receita */}
            {receitasDisponiveis.length === 0 ? (
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma receita cadastrada ainda.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Crie receitas em <strong>Receitas</strong> para usá-las aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Adicionar receita como sabor/opção</p>
                <input className="input text-sm" placeholder="Buscar receita..."
                  value={busca} onChange={e => { setBusca(e.target.value); setPratoSelecionadoId('') }} />

                {busca && receitasFiltradas.length > 0 && !pratoSelecionado && (
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    {receitasFiltradas.map(p => (
                      <button key={p.id} onClick={() => { setPratoSelecionadoId(p.id); setBusca(p.nome); setPrecoOverride('') }}
                        className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-opacity-80 transition-colors"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {p.foto && <img src={p.foto} alt={p.nome} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                        <span className="flex-1 font-medium">{p.nome}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                          {p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {pratoSelecionado && (
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
                    {pratoSelecionado.foto && <img src={pratoSelecionado.foto} alt={pratoSelecionado.nome} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pratoSelecionado.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Preço original: {pratoSelecionado.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="input text-sm" style={{ width: 90 }} type="number" min="0" step="0.01"
                        placeholder="R$ preço" value={precoOverride}
                        onChange={e => setPrecoOverride(e.target.value)} />
                      <button onClick={addVariacao} className="btn btn-primary text-sm px-3" style={{ gap: 4, whiteSpace: 'nowrap' }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {!busca && (
                  <select className="input text-sm" value={pratoSelecionadoId}
                    onChange={e => { setPratoSelecionadoId(e.target.value); if (e.target.value) setBusca(receitasDisponiveis.find(p => p.id === e.target.value)?.nome || '') }}>
                    <option value="">— selecionar receita —</option>
                    {receitasFiltradas.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onFechar} className="btn btn-secondary flex-1">Cancelar</button>
          <button onClick={salvar} className="btn btn-primary flex-1"><Check size={14} /> {pratoEdit ? 'Salvar' : 'Criar Produto'}</button>
        </div>
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
      </div>
    </div>
  )
}

/* ─── Painel KDS (Display da Cozinha) ────────────── */
function KDSConfig() {
  const { kanbanConfig, atualizarKanbanConfig, gerarTokenCozinha } = useApp()
  const [copiado, setCopiado] = useState(false)
  const logoRef = useRef(null)

  const base = window.location.origin
  const urlCozinha = kanbanConfig.cozinhaToken ? `${base}/cozinha/${kanbanConfig.cozinhaToken}` : null

  function copiar(texto) {
    navigator.clipboard.writeText(texto); setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Máx 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => atualizarKanbanConfig({ cozinhaLogo: ev.target.result })
    reader.readAsDataURL(file); e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Identidade */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Display da Cozinha (KDS)</h2>
        </div>

        {/* Logo */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Logo da Cozinha</label>
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden shrink-0"
              style={{ width: 64, height: 64, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kanbanConfig.cozinhaLogo
                ? <img src={kanbanConfig.cozinhaLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 24 }}>👨‍🍳</span>
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <button className="btn btn-secondary text-xs py-1.5" onClick={() => logoRef.current?.click()}>
                <Camera size={12} /> {kanbanConfig.cozinhaLogo ? 'Alterar logo' : 'Enviar logo'}
              </button>
              {kanbanConfig.cozinhaLogo && (
                <button className="btn btn-ghost text-xs py-1 px-2" style={{ color: '#ef4444' }} onClick={() => atualizarKanbanConfig({ cozinhaLogo: null })}>
                  <X size={11} /> Remover
                </button>
              )}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG — máx 2 MB</span>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Título */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título do Display</label>
          <input className="input" placeholder="Cozinha" value={kanbanConfig.cozinhaTitulo || ''}
            onChange={e => atualizarKanbanConfig({ cozinhaTitulo: e.target.value })} />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Link da Cozinha</label>
          {urlCozinha && (
            <div className="flex gap-2 items-center p-2.5 rounded-xl mb-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlCozinha}</span>
              <button className="btn btn-primary py-1 px-2.5 text-xs shrink-0" onClick={() => copiar(urlCozinha)}>
                {copiado ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
          )}
          <button className="btn btn-secondary text-xs w-full" onClick={gerarTokenCozinha}>
            <RefreshCw size={12} /> {urlCozinha ? 'Gerar novo link' : 'Gerar link da cozinha'}
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações do Display</h2>
        <div className="flex flex-col gap-4">

          {/* Labels das colunas */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Nomes das Colunas</label>
            <div className="flex flex-col gap-2">
              {[
                { key: 'labelNovo',       label: 'Novos',      placeholder: 'Pedidos' },
                { key: 'labelPreparando', label: 'Preparando', placeholder: 'Preparando' },
                { key: 'labelCompleto',   label: 'Completo',   placeholder: 'Completo' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)', width: 72 }}>{label}</span>
                  <input className="input flex-1 text-sm py-1.5" placeholder={placeholder}
                    value={kanbanConfig[key] || ''} onChange={e => atualizarKanbanConfig({ [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          {/* Colunas visíveis */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Colunas Visíveis na Cozinha</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'novo',       label: kanbanConfig.labelNovo || 'Pedidos' },
                { id: 'preparando', label: kanbanConfig.labelPreparando || 'Preparando' },
                { id: 'completo',   label: kanbanConfig.labelCompleto || 'Completo' },
              ].map(({ id, label }) => {
                const visivel = (kanbanConfig.colunasVisivelCozinha || ['novo', 'preparando']).includes(id)
                return (
                  <button key={id} onClick={() => {
                    const atual = kanbanConfig.colunasVisivelCozinha || ['novo', 'preparando']
                    atualizarKanbanConfig({ colunasVisivelCozinha: visivel ? atual.filter(c => c !== id) : [...atual, id] })
                  }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={visivel
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Alertas de tempo */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Alertas de Tempo (minutos)</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#f59e0b' }}>⚠ Amarelo após</label>
                <input type="number" min="1" className="input text-sm" value={kanbanConfig.limiteAmareloMin || 10}
                  onChange={e => atualizarKanbanConfig({ limiteAmareloMin: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#ef4444' }}>🔴 Vermelho após</label>
                <input type="number" min="1" className="input text-sm" value={kanbanConfig.limiteVermelhoMin || 20}
                  onChange={e => atualizarKanbanConfig({ limiteVermelhoMin: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Auto-refresh */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Auto-refresh (segundos)</label>
            <input type="number" min="5" max="60" className="input text-sm" value={kanbanConfig.autoRefreshSeg || 10}
              onChange={e => atualizarKanbanConfig({ autoRefreshSeg: Number(e.target.value) })} />
          </div>

          {/* Opções de exibição */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Exibir na cozinha</label>
            {[
              { key: 'mostrarGarcom', label: 'Nome do garçom' },
              { key: 'mostrarMesa',   label: 'Número da mesa' },
              { key: 'mostrarObs',    label: 'Observações do pedido' },
              { key: 'somAlerta',     label: 'Som de alerta (novo pedido)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!kanbanConfig[key]} onChange={e => atualizarKanbanConfig({ [key]: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Aba: Cardápio Digital Config ───────────────── */
function CardapioDigitalConfig() {
  const { cardapioConfig, atualizarCardapioConfig, definirSlugCardapio, garcons, adicionarGarcon, removerGarcon, pratos } = useApp()
  const [novoGarcon, setNovoGarcon] = useState('')
  const [copiado, setCopiado] = useState(null)
  const logoRef = useRef(null)
  const bannerRef = useRef(null)
  const bannerDragRef = useRef(null)
  const [bannerInfo, setBannerInfo] = useState(null)
  const [dragMode, setDragMode] = useState(false)
  const [configAberta, setConfigAberta] = useState(false)
  const [offsetY, setOffsetY] = useState(() => {
    const pos = cardapioConfig.bannerPos || ''
    const match = pos.match(/\S+\s+([\d.]+)%/)
    return match ? parseFloat(match[1]) : 50
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragBaseOffset, setDragBaseOffset] = useState(50)

  // Slug state
  const [slugInput, setSlugInput] = useState(cardapioConfig.slugCardapio || '')
  const [erroSlug, setErroSlug] = useState('')
  const [okSlug, setOkSlug] = useState(false)

  const base = window.location.origin
  const slugAtivo = cardapioConfig.slugCardapio
  const urlMenu = slugAtivo ? `${base}/menu/${slugAtivo}` : null

  function copiar(texto, key) {
    navigator.clipboard.writeText(texto)
    setCopiado(key)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function salvarSlug() {
    setErroSlug(''); setOkSlug(false)
    const res = await definirSlugCardapio(slugInput)
    if (res.erro) return setErroSlug(res.erro)
    setOkSlug(true)
    setTimeout(() => setOkSlug(false), 2500)
  }

  function addGarcon() {
    if (!novoGarcon.trim()) return
    adicionarGarcon(novoGarcon.trim())
    setNovoGarcon('')
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Máx 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => atualizarCardapioConfig({ logo: ev.target.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleBanner(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('Máx 4 MB para o banner.'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        setBannerInfo({ w: img.naturalWidth, h: img.naturalHeight })
        setOffsetY(50)
        setDragMode(true)
      }
      img.src = ev.target.result
      atualizarCardapioConfig({ banner: ev.target.result, bannerPos: '50% 50%', bannerAltura: cardapioConfig.bannerAltura || 180 })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Carrega dimensões do banner existente no mount
  useEffect(() => {
    if (!cardapioConfig.banner || bannerInfo) return
    const img = new Image()
    img.onload = () => setBannerInfo({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = cardapioConfig.banner
  }, [cardapioConfig.banner]) // eslint-disable-line

  function handleDragStart(e) {
    const clientY = e.touches?.[0]?.clientY ?? e.clientY
    setIsDragging(true)
    setDragStartY(clientY)
    setDragBaseOffset(offsetY)
    e.preventDefault()
  }

  function handleDragMove(e) {
    if (!isDragging || !bannerDragRef.current || !bannerInfo) return
    const clientY = e.touches?.[0]?.clientY ?? e.clientY
    const container = bannerDragRef.current
    const containerH = container.clientHeight
    const containerW = container.clientWidth
    const scale = Math.max(containerW / bannerInfo.w, containerH / bannerInfo.h)
    const displayH = bannerInfo.h * scale
    const overflowY = displayH - containerH
    if (overflowY <= 0) return
    const delta = clientY - dragStartY
    const newOffset = Math.max(0, Math.min(100, dragBaseOffset - (delta * 100 / overflowY)))
    setOffsetY(newOffset)
  }

  function handleDragEnd() { setIsDragging(false) }

  function confirmarPosicao() {
    atualizarCardapioConfig({ bannerPos: `50% ${offsetY.toFixed(1)}%` })
    setDragMode(false)
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 640 }}>
      {/* Link do cardápio */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Link do Cardápio Digital</h2>
        </div>

        {/* Slug personalizado */}
        <div style={{ marginBottom: 16 }}>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Endereço personalizado do seu cardápio
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <span style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {base}/menu/
            </span>
            <input
              className="input"
              style={{ flex: 1, border: 'none', borderRadius: 0, background: 'transparent', fontSize: 13, fontFamily: 'monospace' }}
              placeholder="meurestaurante"
              value={slugInput}
              onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setErroSlug('') }}
              onKeyDown={e => e.key === 'Enter' && salvarSlug()}
            />
            <button className="btn btn-primary" style={{ borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, fontSize: 12, padding: '8px 14px', flexShrink: 0 }}
              onClick={salvarSlug}>
              Salvar
            </button>
          </div>
          {erroSlug && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{erroSlug}</p>}
          {okSlug && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>✓ Link salvo com sucesso!</p>}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            Use apenas letras minúsculas, números e hífens (3–30 caracteres). Ex: <em>pizzaria-central</em>
          </p>
        </div>

        {/* Link ativo */}
        {urlMenu ? (
          <>
            <div className="flex gap-2 items-center p-3 rounded-xl mb-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlMenu}</span>
              <button className="btn btn-primary py-1.5 px-3 text-xs shrink-0" onClick={() => copiar(urlMenu, 'menu')}>
                {copiado === 'menu' ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
              </button>
            </div>
            <a href={urlMenu} target="_blank" rel="noreferrer" className="btn btn-secondary text-xs w-fit">
              <Smartphone size={12} /> Abrir cardápio
            </a>
          </>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#d97706' }}>
            ⚠ Defina um endereço personalizado acima para ativar o link do cardápio.
          </div>
        )}
      </div>

      {/* Comanda digital */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Comanda Digital por Garçon</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <input className="input flex-1" placeholder="Nome do garçon (ex: João)" value={novoGarcon}
            onChange={e => setNovoGarcon(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGarcon()} />
          <button className="btn btn-primary px-4" onClick={addGarcon}>
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {garcons.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Nenhum garçon cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {garcons.map(g => {
              const link = `${base}/comanda/${g.token}`
              return (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {g.nome[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{g.nome}</p>
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>/comanda/{g.token}</p>
                  </div>
                  <button className="btn btn-secondary py-1 px-2.5 text-xs shrink-0" onClick={() => copiar(link, g.id)}>
                    {copiado === g.id ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Link</>}
                  </button>
                  <a href={`/comanda/${g.token}`} target="_blank" className="btn btn-ghost p-1.5 shrink-0" title="Abrir comanda">
                    <Smartphone size={13} />
                  </a>
                  <button className="btn btn-ghost p-1.5 shrink-0" style={{ color: '#ef4444' }} onClick={() => removerGarcon(g.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Configurações visuais */}
      <div className="card p-5">
        <button onClick={() => setConfigAberta(a => !a)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: configAberta ? 16 : 0 }}>
          <Settings size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm flex-1 text-left" style={{ color: 'var(--text-primary)', margin: 0 }}>Configurações</h2>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1 }}>{configAberta ? '▲' : '▼'}</span>
        </button>
        {configAberta && <div className="flex flex-col gap-4">

          {/* Logo */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Logo do Estabelecimento</label>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl overflow-hidden shrink-0" style={{ width: 72, height: 72, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cardapioConfig.logo
                  ? <img src={cardapioConfig.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : null
                }
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="btn btn-secondary text-xs py-1.5" onClick={() => logoRef.current?.click()}>
                  <Camera size={12} /> {cardapioConfig.logo ? 'Alterar logo' : 'Enviar logo'}
                </button>
                {cardapioConfig.logo && (
                  <button className="btn btn-ghost text-xs py-1 px-2" style={{ color: '#ef4444' }} onClick={() => atualizarCardapioConfig({ logo: null })}>
                    <X size={11} /> Remover
                  </button>
                )}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG — máx 2 MB</span>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </div>

          {/* Banner */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Banner do Cardápio</label>
            {/* Preview arrastasível */}
            {cardapioConfig.banner && (
              <div
                ref={bannerDragRef}
                style={{
                  width: '100%', height: cardapioConfig.bannerAltura || 180,
                  borderRadius: 10, overflow: 'hidden', marginBottom: 10,
                  border: dragMode ? '2px solid var(--accent)' : '1px solid var(--border)',
                  position: 'relative',
                  cursor: dragMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                  userSelect: 'none', touchAction: dragMode ? 'none' : 'auto',
                }}
                onMouseDown={dragMode ? handleDragStart : undefined}
                onMouseMove={dragMode ? handleDragMove : undefined}
                onMouseUp={dragMode ? handleDragEnd : undefined}
                onMouseLeave={dragMode ? handleDragEnd : undefined}
                onTouchStart={dragMode ? handleDragStart : undefined}
                onTouchMove={dragMode ? handleDragMove : undefined}
                onTouchEnd={dragMode ? handleDragEnd : undefined}
                onClick={!dragMode ? () => setDragMode(true) : undefined}
                title={!dragMode ? 'Clique para ajustar posição' : undefined}
              >
                <img
                  src={cardapioConfig.banner}
                  alt="banner"
                  draggable={false}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: dragMode ? `50% ${offsetY}%` : (cardapioConfig.bannerPos || '50% 50%'),
                    pointerEvents: 'none', display: 'block',
                  }}
                />
                {dragMode && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.45))', pointerEvents: 'none' }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>↕ Arraste para ajustar a posição</span>
                  </div>
                )}
                {!dragMode && bannerInfo && (
                  <span style={{ position: 'absolute', top: 6, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, borderRadius: 6, padding: '2px 7px', fontFamily: 'monospace', pointerEvents: 'none' }}>
                    {bannerInfo.w} × {bannerInfo.h} px
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {dragMode ? (
                <div className="flex gap-2 items-center">
                  <button className="btn btn-primary text-xs py-1.5" onClick={confirmarPosicao}>
                    <Check size={12} /> Pronto
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Arraste o banner acima para escolher a área</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center flex-wrap">
                  <button className="btn btn-secondary text-xs py-1.5" onClick={() => bannerRef.current?.click()}>
                    <Camera size={12} /> {cardapioConfig.banner ? 'Alterar' : 'Enviar banner'}
                  </button>
                  {cardapioConfig.banner && (
                    <button className="btn btn-ghost text-xs py-1 px-2" style={{ color: '#ef4444' }}
                      onClick={() => { atualizarCardapioConfig({ banner: null }); setBannerInfo(null); setDragMode(false) }}>
                      <X size={11} /> Remover
                    </button>
                  )}
                  {!cardapioConfig.banner && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG — máx 4 MB</span>}
                </div>
              )}
              {cardapioConfig.banner && !dragMode && (
                <div className="flex items-center gap-2">
                  <label className="text-xs shrink-0" style={{ color: 'var(--text-muted)', minWidth: 60 }}>Altura (px)</label>
                  <input type="number" min="80" max="500" step="10"
                    className="input text-xs"
                    style={{ width: 90 }}
                    value={cardapioConfig.bannerAltura || 180}
                    onChange={e => atualizarCardapioConfig({ bannerAltura: Math.min(500, Math.max(80, Number(e.target.value) || 180)) })}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>px (80–500)</span>
                </div>
              )}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome do Restaurante</label>
            <input className="input" value={cardapioConfig.nomeRestaurante} onChange={e => atualizarCardapioConfig({ nomeRestaurante: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Descrição / Slogan</label>
            <input className="input" placeholder="Ex: Sabor artesanal desde 2010" value={cardapioConfig.descricao} onChange={e => atualizarCardapioConfig({ descricao: e.target.value })} />
          </div>

          {/* Modo claro / escuro */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Aparência</label>
            <div className="flex gap-2">
              {[{ id: false, label: '🌙 Escuro' }, { id: true, label: '☀️ Claro' }].map(op => (
                <button key={String(op.id)} onClick={() => atualizarCardapioConfig({ modoClaro: op.id })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={cardapioConfig.modoClaro === op.id
                    ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                    : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }>
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cor do Header */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Cor do Header</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {[
                { cor: '#ffffff', label: 'Branco' },
                { cor: '#f8fafc', label: 'Gelo' },
                { cor: '#fefce8', label: 'Creme' },
                { cor: '#f0fdf4', label: 'Menta' },
                { cor: '#fff7ed', label: 'Pêssego' },
                { cor: '#fdf2f8', label: 'Lavanda' },
                { cor: '#1e293b', label: 'Navy' },
                { cor: '#0f172a', label: 'Escuro' },
                { cor: '#18181b', label: 'Preto' },
                { cor: '#1a1a2e', label: 'Azul noite' },
                { cor: '#1c1007', label: 'Café' },
                { cor: '#0d1f12', label: 'Floresta' },
              ].map(({ cor, label }) => (
                <button key={cor} title={label} onClick={() => atualizarCardapioConfig({ corFundo: cor })}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: cardapioConfig.corFundo === cor ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: cor, cursor: 'pointer', flexShrink: 0,
                    boxShadow: cardapioConfig.corFundo === cor ? '0 0 0 3px var(--accent-bg)' : 'none',
                    outline: 'none', transition: 'all .1s',
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input type="color" value={cardapioConfig.corFundo} onChange={e => atualizarCardapioConfig({ corFundo: e.target.value })}
                className="rounded cursor-pointer border-0" style={{ width: 40, height: 36, padding: 2, background: 'var(--bg-hover)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{cardapioConfig.corFundo}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Cor de Destaque</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {['#f04000','#16a34a','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2','#db2777'].map(cor => (
                <button key={cor} onClick={() => atualizarCardapioConfig({ corDestaque: cor })}
                  style={{ width: 26, height: 26, borderRadius: 8, border: cardapioConfig.corDestaque === cor ? '2px solid var(--accent)' : '2px solid transparent', background: cor, cursor: 'pointer', outline: 'none', transition: 'all .1s',
                    boxShadow: cardapioConfig.corDestaque === cor ? '0 0 0 3px var(--accent-bg)' : 'none' }}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input type="color" value={cardapioConfig.corDestaque} onChange={e => atualizarCardapioConfig({ corDestaque: e.target.value })}
                className="rounded cursor-pointer border-0" style={{ width: 40, height: 36, padding: 2, background: 'var(--bg-hover)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{cardapioConfig.corDestaque}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cardapioConfig.mostrarPrecos} onChange={e => atualizarCardapioConfig({ mostrarPrecos: e.target.checked })} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mostrar preços no cardápio</span>
            </label>
            {cardapioConfig.mostrarPrecos && (
              <div className="flex items-center gap-1">
                <input type="color" value={cardapioConfig.corPreco || cardapioConfig.corDestaque || '#f04000'}
                  onChange={e => atualizarCardapioConfig({ corPreco: e.target.value })}
                  title="Cor dos preços"
                  className="rounded cursor-pointer border-0" style={{ width: 28, height: 28, padding: 2, background: 'var(--bg-hover)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cor do preço</span>
              </div>
            )}
          </div>

          {/* Estrelas / Avaliações */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={!!cardapioConfig.estrelasAtivas} onChange={e => atualizarCardapioConfig({ estrelasAtivas: e.target.checked })} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Exibir estrelas e avaliações</span>
            </label>
            {cardapioConfig.estrelasAtivas && (
              <div className="flex flex-col gap-2 pl-2" style={{ borderLeft: '2px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <input type="color" value={cardapioConfig.corEstrela || cardapioConfig.corDestaque || '#f04000'}
                    onChange={e => atualizarCardapioConfig({ corEstrela: e.target.value })}
                    title="Cor das estrelas"
                    className="rounded cursor-pointer border-0" style={{ width: 28, height: 28, padding: 2, background: 'var(--bg-hover)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cor das estrelas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={13} style={{ color: cardapioConfig.corEstrela || cardapioConfig.corDestaque || '#f04000', flexShrink: 0 }} />
                  <label className="text-xs shrink-0" style={{ color: 'var(--text-muted)', minWidth: 64 }}>Nota (1–5)</label>
                  <input type="number" min="0" max="5" step="0.1" className="input text-xs" style={{ width: 80 }}
                    value={cardapioConfig.estrelaValor || ''}
                    placeholder="4.6"
                    onChange={e => atualizarCardapioConfig({ estrelaValor: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <label className="text-xs shrink-0" style={{ color: 'var(--text-muted)', minWidth: 64 }}>Avaliações</label>
                  <input type="number" min="0" className="input text-xs" style={{ width: 80 }}
                    value={cardapioConfig.estrelaQtd || ''}
                    placeholder="142"
                    onChange={e => atualizarCardapioConfig({ estrelaQtd: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          {/* Layout padrão */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Layout padrão dos produtos</label>
            <div className="flex gap-2">
              {[{ id: 'lista', label: 'Lista', icon: <List size={14} /> }, { id: 'grade', label: 'Grade (3 colunas)', icon: <LayoutGrid size={14} /> }].map(op => (
                <button key={op.id} onClick={() => atualizarCardapioConfig({ layoutPadrao: op.id })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={(cardapioConfig.layoutPadrao || 'lista') === op.id
                    ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                    : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }>
                  {op.icon} {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>}
      </div>
      {(() => {
        const todasCats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
        const ordemSalva = cardapioConfig.ordemCategorias || []
        const ordenadas = [
          ...ordemSalva.filter(c => todasCats.includes(c)),
          ...todasCats.filter(c => !ordemSalva.includes(c)),
        ]
        if (todasCats.length === 0) return null
        function mover(idx, dir) {
          const nova = [...ordenadas]
          const troca = nova[idx + dir]
          nova[idx + dir] = nova[idx]
          nova[idx] = troca
          atualizarCardapioConfig({ ordemCategorias: nova })
        }
        return (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 16 }}>☰</span>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Ordem das Categorias</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Use as setas para definir a ordem. Aplicada no PDV, cardápio digital e comandas dos garçons.</p>
            <div className="flex flex-col gap-2">
              {ordenadas.map((cat, idx) => (
                <div key={cat} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                  <button disabled={idx === 0} onClick={() => mover(idx, -1)}
                    className="btn btn-ghost p-1" style={{ opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                  <button disabled={idx === ordenadas.length - 1} onClick={() => mover(idx, 1)}
                    className="btn btn-ghost p-1" style={{ opacity: idx === ordenadas.length - 1 ? 0.3 : 1 }}>▼</button>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

    </div>
  )
}

/* ─── Aba: PDF do Cardápio ───────────────────────── */
function loadPDFConfig() {
  try { return JSON.parse(localStorage.getItem('rd_pdf_config') || 'null') } catch { return null }
}
const PDF_PADRAO = {
  titulo: '',
  mostrarPrecos: true,
  mostrarDescricao: true,
  agruparCategoria: true,
  colunas: 2,
  orientacao: 'portrait',
  rodape: '',
  mostrarFoto: false,
  template: 'elegante',
}

function gerarHTMLPDF(pratos, cardapioConfig, cfg) {
  const t = cfg.template || 'elegante'
  const titulo = cfg.titulo || cardapioConfig.nomeRestaurante || 'Cardápio'
  const subtitulo = cardapioConfig.descricao || ''
  const logo = cardapioConfig.logo || null
  const gridCols = Math.max(1, Math.min(3, Number(cfg.colunas) || 2))
  const orientacao = cfg.orientacao || 'portrait'
  const rodape = cfg.rodape || ''
  const mostrarPrecos = cfg.mostrarPrecos !== false
  const mostrarDesc = cfg.mostrarDescricao !== false
  const mostrarFoto = !!cfg.mostrarFoto
  const agrupar = cfg.agruparCategoria !== false
  const fBase = 13

  const allCats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
  const pratosSemCat = pratos.filter(p => !p.categoria)
  const ordemSalva = cardapioConfig.ordemCategorias || []
  const catsOrdenadas = [...ordemSalva.filter(c => allCats.includes(c)), ...allCats.filter(c => !ordemSalva.includes(c))]

  const printBase = `*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}`
  const printMedia = `@media print{@page{size:A4 ${orientacao === 'landscape' ? 'landscape' : 'portrait'};margin:8mm;}.item{break-inside:avoid;}}`

  function itemsHTML(lista) {
    return lista.map(p =>
      `<div class="item">${mostrarFoto && p.foto ? `<img src="${p.foto}" class="item-foto" alt="">` : ''}<div class="item-body"><div class="item-topo"><span class="item-nome">${p.nome}</span>${mostrarPrecos ? `<span class="item-preco">${p.precoVenda.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>` : ''}</div>${mostrarDesc && p.descricao ? `<p class="item-desc">${p.descricao}</p>` : ''}</div></div>`
    ).join('')
  }

  function conteudoHTML(catHeaderFn) {
    if (!agrupar) return `<div class="grid" style="grid-template-columns:repeat(${gridCols},1fr)">${itemsHTML(pratos)}</div>`
    return catsOrdenadas.map(cat => {
      const lista = pratos.filter(p => p.categoria === cat)
      if (!lista.length) return ''
      return `${catHeaderFn(cat)}<div class="grid" style="grid-template-columns:repeat(${gridCols},1fr)">${itemsHTML(lista)}</div>`
    }).join('') + (pratosSemCat.length ? `<div class="grid" style="grid-template-columns:repeat(${gridCols},1fr)">${itemsHTML(pratosSemCat)}</div>` : '')
  }

  // ── ELEGANTE: fundo escuro, dourado, tipografia clássica ─────────────────────
  if (t === 'elegante') {
    const bg = '#0f0e13', bgCard = '#1a1820', gold = '#c9a851', txt = '#f0e6d3', muted = '#9a8a72'
    const catHTML = cat => `<div class="cat-header"><div class="cat-line"></div><span class="cat-nome">${cat}</span><div class="cat-line"></div></div>`
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<style>${printBase}${printMedia}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Lato',Georgia,serif;background:${bg};color:${txt}}
.page{max-width:210mm;margin:0 auto;padding:18mm 15mm 14mm;background:${bg}}
.header{text-align:center;margin-bottom:28px}
.logo{width:82px;height:82px;border-radius:50%;object-fit:cover;border:2.5px solid ${gold};margin:0 auto 14px;display:block}
.orn{display:flex;align-items:center;gap:10px;margin:12px 0}
.orn-l{flex:1;height:1px;background:linear-gradient(to right,transparent,${gold}99,transparent)}
.orn-d{color:${gold};font-size:11px;letter-spacing:6px;flex-shrink:0}
h1{font-family:'Playfair Display',serif;font-size:${fBase + 18}px;font-weight:900;color:${gold};letter-spacing:3px;text-transform:uppercase;line-height:1.1;margin:4px 0}
.sub{font-size:${fBase - 1}px;color:${muted};letter-spacing:2px;margin-top:8px;font-style:italic}
.cat-header{display:flex;align-items:center;gap:12px;margin:22px 0 10px}
.cat-line{flex:1;height:1px;background:${gold}44}
.cat-nome{font-family:'Playfair Display',serif;font-size:${fBase - 1}px;font-weight:700;color:${gold};letter-spacing:2.5px;text-transform:uppercase;white-space:nowrap}
.grid{display:grid;gap:8px}
.item{display:flex;gap:10px;padding:10px 12px;border-radius:5px;border:1px solid ${gold}22;background:${bgCard};page-break-inside:avoid}
.item-foto{width:62px;height:62px;object-fit:cover;border-radius:4px;flex-shrink:0;border:1px solid ${gold}33}
.item-body{flex:1;min-width:0}
.item-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.item-nome{font-family:'Playfair Display',serif;font-size:${fBase}px;font-weight:700;color:${txt};line-height:1.3}
.item-preco{font-size:${fBase}px;font-weight:700;color:${gold};white-space:nowrap;flex-shrink:0}
.item-desc{font-size:${fBase - 2}px;color:${muted};margin-top:3px;line-height:1.5}
.footer{text-align:center;margin-top:22px;padding-top:13px;border-top:1px solid ${gold}33;font-size:${fBase - 3}px;color:${muted};letter-spacing:1px}
@media print{body,html{background:${bg}!important}.page{padding:0;max-width:100%}}
</style></head>
<body><div class="page">
<div class="header">${logo ? `<img src="${logo}" class="logo" alt="">` : ''}<div class="orn"><div class="orn-l"></div><span class="orn-d">◆ ◆ ◆</span><div class="orn-l"></div></div><h1>${titulo}</h1>${subtitulo ? `<p class="sub">${subtitulo}</p>` : ''}<div class="orn"><div class="orn-l"></div><span class="orn-d">◆ ◆ ◆</span><div class="orn-l"></div></div></div>
${conteudoHTML(catHTML)}${rodape ? `<div class="footer">${rodape}</div>` : ''}
</div><script>window.onload=()=>window.print()</script></body></html>`
  }

  // ── BISTRÔ: pergaminho, rústico, tipografia clássica francesa ────────────────
  if (t === 'bistro') {
    const bg = '#fdf8f0', bgCard = '#faf3e6', acc = '#b5724a', dark = '#3d2b1f', muted = '#8b6f5a'
    const catHTML = cat => `<div class="cat-header"><span class="cat-nome">${cat}</span><div class="cat-rule"></div></div>`
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>${printBase}${printMedia}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Jost',Georgia,sans-serif;background:${bg};color:${dark}}
.page{max-width:210mm;margin:0 auto;padding:16mm 15mm 14mm;background:${bg}}
.header{text-align:center;margin-bottom:26px;padding-bottom:20px}
.logo{width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid ${acc};margin:0 auto 12px;display:block}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:${fBase + 20}px;font-weight:700;color:${dark};letter-spacing:1px;line-height:1.1}
.script{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:${fBase + 4}px;color:${acc};margin-top:4px;display:block}
.rule{display:flex;align-items:center;gap:10px;margin:13px 0}
.rule::before,.rule::after{content:'';flex:1;height:1px;background:${acc}66}
.rule span{color:${acc};font-size:18px;line-height:1}
.cat-header{margin:20px 0 8px;text-align:center}
.cat-nome{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:${fBase + 7}px;font-weight:600;color:${acc}}
.cat-rule{height:1px;background:${acc}44;margin-top:5px}
.grid{display:grid;gap:7px}
.item{display:flex;gap:10px;padding:9px 12px;border-radius:3px;background:${bgCard};border-left:3px solid ${acc}88;page-break-inside:avoid}
.item-foto{width:60px;height:60px;object-fit:cover;border-radius:3px;flex-shrink:0}
.item-body{flex:1;min-width:0}
.item-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.item-nome{font-family:'Cormorant Garamond',serif;font-size:${fBase + 1}px;font-weight:600;color:${dark};line-height:1.3}
.item-preco{font-size:${fBase}px;font-weight:700;color:${acc};white-space:nowrap;flex-shrink:0;font-family:'Jost',sans-serif}
.item-desc{font-size:${fBase - 2}px;color:${muted};margin-top:3px;line-height:1.5;font-style:italic}
.footer{text-align:center;margin-top:22px;padding-top:12px;border-top:1px solid ${acc}44;font-size:${fBase - 3}px;color:${muted};letter-spacing:0.5px;font-style:italic}
@media print{body{background:${bg}!important}.page{padding:0;max-width:100%}}
</style></head>
<body><div class="page">
<div class="header">${logo ? `<img src="${logo}" class="logo" alt="">` : ''}<div class="rule"><span>✦</span></div><h1>${titulo}</h1>${subtitulo ? `<span class="script">${subtitulo}</span>` : ''}<div class="rule"><span>✦</span></div></div>
${conteudoHTML(catHTML)}${rodape ? `<div class="footer">${rodape}</div>` : ''}
</div><script>window.onload=()=>window.print()</script></body></html>`
  }

  // ── MODERNO: limpo, contemporâneo, faixa colorida no topo ────────────────────
  const bg = '#ffffff', light = '#f3f4f6', acc = '#2563eb', dark = '#111827', muted = '#6b7280'
  const catHTML = cat => `<div class="cat-header"><span class="cat-nome">${cat}</span><div class="cat-line"></div></div>`
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>${printBase}${printMedia}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:${bg};color:${dark}}
.page{max-width:210mm;margin:0 auto;background:${bg}}
.header{background:${acc};padding:22px 16mm 26px;color:#fff;position:relative;overflow:hidden}
.header::after{content:'';position:absolute;right:-30px;top:-30px;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,0.08)}
.header::before{content:'';position:absolute;right:80px;bottom:-60px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,0.05)}
.hi{position:relative;z-index:1;display:flex;align-items:center;gap:18px}
.logo{width:74px;height:74px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.45);flex-shrink:0}
h1{font-size:${fBase + 16}px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.1}
.sub{font-size:${fBase - 2}px;color:rgba(255,255,255,0.75);margin-top:5px;font-weight:300}
.body{padding:14px 15mm 14mm}
.cat-header{display:flex;align-items:center;gap:10px;margin:18px 0 8px}
.cat-nome{font-size:${fBase - 1}px;font-weight:700;color:${acc};text-transform:uppercase;letter-spacing:1.5px;white-space:nowrap}
.cat-line{flex:1;height:2px;background:${acc}22}
.grid{display:grid;gap:6px}
.item{display:flex;gap:10px;padding:9px 12px 9px 14px;border-radius:8px;background:${light};border-left:3.5px solid ${acc};page-break-inside:avoid}
.item-foto{width:60px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0}
.item-body{flex:1;min-width:0}
.item-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.item-nome{font-size:${fBase}px;font-weight:600;color:${dark};line-height:1.3}
.item-preco{font-size:${fBase}px;font-weight:700;color:${acc};white-space:nowrap;flex-shrink:0}
.item-desc{font-size:${fBase - 2}px;color:${muted};margin-top:2px;line-height:1.45;font-weight:300}
.footer{text-align:center;margin:16px 0 0;padding:10px 0;border-top:1px solid #e5e7eb;font-size:${fBase - 3}px;color:${muted}}
@media print{body{background:${bg}!important}.page{max-width:100%}}
</style></head>
<body><div class="page">
<div class="header"><div class="hi">${logo ? `<img src="${logo}" class="logo" alt="">` : ''}<div><h1>${titulo}</h1>${subtitulo ? `<p class="sub">${subtitulo}</p>` : ''}</div></div></div>
<div class="body">${conteudoHTML(catHTML)}${rodape ? `<div class="footer">${rodape}</div>` : ''}</div>
</div><script>window.onload=()=>window.print()</script></body></html>`
}

function CardapioPDFConfig() {
  const { pratos, cardapioConfig } = useApp()
  const [cfg, setCfg] = useState(() => loadPDFConfig() || PDF_PADRAO)

  function set(key, val) {
    const novo = { ...cfg, [key]: val }
    setCfg(novo)
    localStorage.setItem('rd_pdf_config', JSON.stringify(novo))
  }

  function gerar() {
    if (pratos.length === 0) return
    const html = gerarHTMLPDF(pratos, cardapioConfig, cfg)
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  }

  const totalItens = pratos.length
  const cats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Prévia de stats */}
      <div className="card p-4 flex items-center gap-6 flex-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cardápio PDF</span>
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{totalItens} item{totalItens !== 1 ? 's' : ''}</span>
        {cats.length > 0 && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{cats.length} categoria{cats.length !== 1 ? 's' : ''}</span>}
        <button className="btn btn-primary ml-auto" onClick={gerar} disabled={pratos.length === 0} style={{ gap: 6 }}>
          <FileText size={14} /> Gerar PDF
        </button>
      </div>

      {/* Modelo */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Modelo do Cardápio</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'elegante', label: 'Elegante',  desc: 'Fundo escuro, dourado',     bg: '#0f0e13', accent: '#c9a851', text: '#f0e6d3' },
            { id: 'bistro',   label: 'Bistrô',    desc: 'Pergaminho, rústico',       bg: '#fdf8f0', accent: '#b5724a', text: '#3d2b1f' },
            { id: 'moderno',  label: 'Moderno',   desc: 'Limpo, contemporâneo',      bg: '#f3f4f6', accent: '#2563eb', text: '#111827' },
          ].map(tp => {
            const selected = (cfg.template || 'elegante') === tp.id
            return (
              <button key={tp.id} onClick={() => set('template', tp.id)} style={{
                border: selected ? '2px solid var(--accent)' : '2px solid var(--border)',
                borderRadius: 12, padding: 0, cursor: 'pointer', overflow: 'hidden',
                background: 'none', textAlign: 'left',
                boxShadow: selected ? '0 0 0 3px var(--accent-bg)' : 'none',
                transition: 'all .15s',
              }}>
                {/* mini preview */}
                <div style={{ height: 64, background: tp.id === 'moderno' ? tp.bg : tp.bg, borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                  {tp.id === 'moderno' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: tp.accent }} />
                  )}
                  <div style={{ position: 'absolute', top: tp.id === 'moderno' ? 32 : 10, left: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {tp.id !== 'moderno' && <div style={{ height: 3, width: '70%', background: tp.accent, borderRadius: 2, margin: '0 auto' }} />}
                    <div style={{ height: 2, width: '90%', background: tp.text + '33', borderRadius: 1 }} />
                    <div style={{ height: 2, width: '75%', background: tp.text + '22', borderRadius: 1 }} />
                  </div>
                </div>
                <div style={{ padding: '6px 9px 8px', background: 'var(--bg-card)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{tp.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '1px 0 0' }}>{tp.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Configurações */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações do PDF</h2>
        <div className="flex flex-col gap-4">

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título do Cardápio</label>
            <input className="input" placeholder={`Ex: ${cardapioConfig.nomeRestaurante || 'Cardápio'} — use em branco para o nome do restaurante`}
              value={cfg.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Orientação</label>
              <div className="flex gap-2">
                {[{ id: 'portrait', label: 'Retrato' }, { id: 'landscape', label: 'Paisagem' }].map(op => (
                  <button key={op.id} onClick={() => set('orientacao', op.id)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={cfg.orientacao === op.id
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Colunas</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => set('colunas', n)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={cfg.colunas === n
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Exibir no PDF</label>
            {[
              { key: 'mostrarPrecos',     label: 'Preços' },
              { key: 'mostrarDescricao',  label: 'Descrições dos itens' },
              { key: 'agruparCategoria',  label: 'Agrupar por categoria' },
              { key: 'mostrarFoto',       label: 'Fotos dos pratos' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!cfg[key]} onChange={e => set(key, e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Rodapé (opcional)</label>
            <input className="input" placeholder="Ex: Preços sujeitos a alteração sem aviso prévio." value={cfg.rodape} onChange={e => set('rodape', e.target.value)} />
          </div>

        </div>
      </div>

      <button className="btn btn-primary w-full" onClick={gerar} disabled={pratos.length === 0} style={{ fontSize: 15, padding: '12px 0', gap: 8 }}>
        <FileText size={16} /> Gerar e Abrir PDF
      </button>
      {pratos.length === 0 && (
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Adicione itens ao cardápio para gerar o PDF.</p>
      )}
    </div>
  )
}

/* ─── Aba: Delivery Config ───────────────────────── */
function DeliveryConfig() {
  const { configuracaoDelivery, atualizarConfiguracaoDelivery, definirSlugDelivery, adicionarBairro, editarBairro, removerBairro } = useApp()
  const cfg = configuracaoDelivery || {}
  const base = window.location.origin

  const [slugInput, setSlugInput] = useState(cfg.slugDelivery || '')
  const [erroSlug, setErroSlug] = useState('')
  const [okSlug, setOkSlug] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const [novoBairroNome, setNovoBairroNome] = useState('')
  const [novoBairroFrete, setNovoBairroFrete] = useState('')

  const urlDelivery = cfg.slugDelivery ? `${base}/delivery/${cfg.slugDelivery}` : null

  async function salvarSlug() {
    const res = await definirSlugDelivery(slugInput)
    if (res.erro) { setErroSlug(res.erro); return }
    setOkSlug(true); setTimeout(() => setOkSlug(false), 2500)
  }

  function copiar(texto) {
    navigator.clipboard.writeText(texto)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  function handleAdicionarBairro() {
    if (!novoBairroNome.trim()) return
    adicionarBairro({ nome: novoBairroNome.trim(), frete: Number(novoBairroFrete) || 0 })
    setNovoBairroNome(''); setNovoBairroFrete('')
  }

  const pgtoOpcoes = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={13} /> },
    { id: 'pix',      label: 'PIX',      icon: <QrCode size={13} /> },
    { id: 'cartao',   label: 'Cartão',   icon: <CreditCard size={13} /> },
  ]

  function togglePgto(id) {
    const atual = cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']
    const novo = atual.includes(id) ? atual.filter(f => f !== id) : [...atual, id]
    atualizarConfiguracaoDelivery({ formasPagamento: novo })
  }

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 640 }}>

      {/* Ativar delivery */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Delivery ativo</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ativa o link público para pedidos de delivery</p>
        </div>
        <button onClick={() => atualizarConfiguracaoDelivery({ ativo: !cfg.ativo })}
          style={{ color: cfg.ativo ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {cfg.ativo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
        </button>
      </div>

      {/* Link do delivery */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Truck size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Link do Cardápio Delivery</h2>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Endereço personalizado do delivery</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <span style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {base}/delivery/
            </span>
            <input className="input" style={{ flex: 1, border: 'none', borderRadius: 0, background: 'transparent', fontSize: 13, fontFamily: 'monospace' }}
              placeholder="meurestaurante"
              value={slugInput}
              onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setErroSlug('') }}
              onKeyDown={e => e.key === 'Enter' && salvarSlug()} />
            <button className="btn btn-primary" style={{ borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, fontSize: 12, padding: '8px 14px', flexShrink: 0 }} onClick={salvarSlug}>
              Salvar
            </button>
          </div>
          {erroSlug && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{erroSlug}</p>}
          {okSlug && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>✓ Link salvo!</p>}
        </div>

        {urlDelivery ? (
          <div className="flex gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlDelivery}</span>
            <button className="btn btn-primary py-1.5 px-3 text-xs shrink-0" onClick={() => copiar(urlDelivery)}>
              {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#d97706' }}>
            ⚠ Defina um endereço acima para ativar o link de delivery.
          </div>
        )}
      </div>

      {/* Configurações gerais */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações gerais</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Cidade</label>
            <input className="input" placeholder="Ex: São Paulo" value={cfg.cidade || ''}
              onChange={e => atualizarConfiguracaoDelivery({ cidade: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Pedido mínimo (R$)</label>
              <input className="input" type="number" min="0" placeholder="0,00" value={cfg.pedidoMinimo || ''}
                onChange={e => atualizarConfiguracaoDelivery({ pedidoMinimo: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Tempo estimado</label>
              <input className="input" placeholder="30-45 min" value={cfg.tempoEstimado || ''}
                onChange={e => atualizarConfiguracaoDelivery({ tempoEstimado: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Telefone/WhatsApp (com DDD)</label>
            <input className="input" placeholder="11999999999" value={cfg.telefone || ''}
              onChange={e => atualizarConfiguracaoDelivery({ telefone: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Mensagem de introdução (WhatsApp)</label>
            <input className="input" placeholder="Olá! Gostaria de fazer um pedido:" value={cfg.mensagemIntro || ''}
              onChange={e => atualizarConfiguracaoDelivery({ mensagemIntro: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Formas de pagamento */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Formas de pagamento aceitas</h2>
        <div className="flex gap-3 flex-wrap">
          {pgtoOpcoes.map(op => {
            const ativo = (cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']).includes(op.id)
            return (
              <button key={op.id} onClick={() => togglePgto(op.id)} style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                background: ativo ? 'var(--accent-bg)' : 'transparent',
                color: ativo ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {op.icon}{op.label}
                {ativo && <Check size={12} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bairros */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={15} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Bairros de entrega</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            {(cfg.bairros || []).filter(b => b.ativo).length} ativos
          </span>
        </div>

        {/* Lista de bairros */}
        <div className="flex flex-col gap-2 mb-4">
          {(cfg.bairros || []).length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Nenhum bairro cadastrado ainda.</p>
          ) : (
            (cfg.bairros || []).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <button onClick={() => editarBairro(b.id, { ativo: !b.ativo })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                  {b.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <span className="flex-1 text-sm font-medium" style={{ color: b.ativo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.nome}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                  <input type="number" min="0" value={b.frete}
                    onChange={e => editarBairro(b.id, { frete: Number(e.target.value) })}
                    style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                </div>
                <button onClick={() => removerBairro(b.id)} className="btn btn-ghost p-1" style={{ color: '#ef4444', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Adicionar bairro */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Adicionar bairro</p>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Nome do bairro" value={novoBairroNome}
              onChange={e => setNovoBairroNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdicionarBairro()} />
            <div className="flex items-center gap-1" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px', background: 'var(--bg-card)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
              <input type="number" min="0" placeholder="0" value={novoBairroFrete}
                onChange={e => setNovoBairroFrete(e.target.value)}
                style={{ width: 60, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, outline: 'none', padding: '6px 0' }} />
            </div>
            <button className="btn btn-primary shrink-0" onClick={handleAdicionarBairro}>
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Frete 0 = entrega grátis nesse bairro.</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Página principal ────────────────────────────── */
export default function Cardapio() {
  const { pratos, ingredientes, editarPrato, adicionarPrato, cardapioConfig, atualizarCardapioConfig } = useApp()
  const [aba, setAba] = useState('cardapio')
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [pratoSelecionado, setPratoSelecionado] = useState(null)
  const [modalVariacao, setModalVariacao] = useState(false)
  const [mostrarOrdem, setMostrarOrdem] = useState(false)

  const todasCats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
  const ordemSalva = cardapioConfig?.ordemCategorias || []
  const catsOrdenadas = [
    ...ordemSalva.filter(c => todasCats.includes(c)),
    ...todasCats.filter(c => !ordemSalva.includes(c)),
  ]
  const categorias = ['Todas', ...catsOrdenadas]

  const pratosFiltrados = pratos
    .filter(p => filtro === 'Todas' || p.categoria === filtro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  function handleFotoChange(pratoId, fotoBase64) {
    const prato = pratos.find(p => p.id === pratoId)
    editarPrato(pratoId, { ...prato, foto: fotoBase64 })
    if (pratoSelecionado?.id === pratoId)
      setPratoSelecionado(prev => ({ ...prev, foto: fotoBase64 }))
  }

  function salvarVariacao(dados) {
    adicionarPrato(dados)
    setModalVariacao(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cardápio</h1>
          <p className="page-subtitle">{pratos.length} receita{pratos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'var(--bg-hover)' }}>
        {[
          { id: 'cardapio',  label: 'Cardápio' },
          { id: 'digital',   label: 'Cardápio Digital' },
          { id: 'displays',  label: 'Displays' },
          { id: 'pdf',       label: 'PDF' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={aba === a.id
              ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 5 }
              : { color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {a.icon}{a.label}
          </button>
        ))}
      </div>

      {aba === 'digital' ? <CardapioDigitalConfig />
: aba === 'displays' ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}><PainelCozinha /><PainelCaixa /></div>
        : aba === 'pdf' ? <CardapioPDFConfig />
        : (
        <>
          {pratos.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 gap-4">
              <UtensilsCrossed size={40} style={{ color: 'var(--text-muted)' }} />
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Cardápio vazio</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crie receitas para montá-lo.</p>
              </div>
              <Link to="/receitas" className="btn btn-primary">Criar receitas</Link>
            </div>
          ) : (
            <>
              {/* Busca + filtros */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input className="input pl-9 text-sm" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <button onClick={() => setModalVariacao(true)}
                  className="btn btn-secondary text-xs shrink-0"
                  style={{ gap: 5, borderStyle: 'dashed', color: '#7c3aed', borderColor: '#7c3aed44', background: 'rgba(124,58,237,0.06)' }}>
                  <Plus size={13} /> Produto com Variação
                </button>
                <div className="flex gap-1.5 flex-wrap">
                  {categorias.map(cat => (
                    <button key={cat} onClick={() => setFiltro(cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                      style={filtro === cat
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                      }>
                      {cat}
                    </button>
                  ))}
                </div>
                {todasCats.length > 1 && (
                  <button
                    onClick={() => setMostrarOrdem(v => !v)}
                    className="btn btn-ghost text-xs shrink-0"
                    style={{ gap: 4, color: mostrarOrdem ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${mostrarOrdem ? 'var(--border-active)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 10px' }}>
                    ☰ Ordem
                  </button>
                )}
              </div>

              {mostrarOrdem && (
                <div className="card p-4 mb-4">
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Ordem das categorias no PDV, cardápio digital e comandas:</p>
                  <div className="flex flex-col gap-2">
                    {catsOrdenadas.map((cat, idx) => (
                      <div key={cat} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                        <button disabled={idx === 0} onClick={() => {
                          const nova = [...catsOrdenadas]; const tmp = nova[idx - 1]; nova[idx - 1] = nova[idx]; nova[idx] = tmp
                          atualizarCardapioConfig({ ordemCategorias: nova })
                        }} className="btn btn-ghost p-1" style={{ opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                        <button disabled={idx === catsOrdenadas.length - 1} onClick={() => {
                          const nova = [...catsOrdenadas]; const tmp = nova[idx + 1]; nova[idx + 1] = nova[idx]; nova[idx] = tmp
                          atualizarCardapioConfig({ ordemCategorias: nova })
                        }} className="btn btn-ghost p-1" style={{ opacity: idx === catsOrdenadas.length - 1 ? 0.3 : 1 }}>▼</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pratosFiltrados.length === 0 ? (
                <div className="card text-center py-12">
                  <p style={{ color: 'var(--text-muted)' }}>Nenhuma receita encontrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {pratosFiltrados.map(prato => (
                    <CardReceita key={prato.id} prato={prato} ingredientes={ingredientes} onClick={() => setPratoSelecionado(prato)} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {pratoSelecionado && (
        <ModalDetalhe prato={pratoSelecionado} onFechar={() => setPratoSelecionado(null)} onFotoChange={handleFotoChange} />
      )}
      {modalVariacao && (
        <ModalVariacao pratoEdit={null} onFechar={() => setModalVariacao(false)} onSalvar={salvarVariacao} />
      )}
    </div>
  )
}
