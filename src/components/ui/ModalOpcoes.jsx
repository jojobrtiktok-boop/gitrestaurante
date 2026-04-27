import { useState } from 'react'
import { X, Check, Plus, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { formatarMoeda } from '../../utils/formatacao.js'

export default function ModalOpcoes({ prato, onConfirmar, onFechar, corDestaque }) {
  const { ingredientes } = useApp()
  const cor = corDestaque || 'var(--accent)'
  const corStr = cor === 'var(--accent)' ? null : cor
  const accentCss = corStr || 'var(--accent)'

  const grupos = prato.grupos || []
  const temTamanhos = (prato.tamanhos || []).length > 0
  const gruposComplemento = grupos.filter(g => g.categoria !== 'adicional')
  const gruposAdicional = grupos.filter(g => g.categoria === 'adicional')

  // Tamanho selecionado (quando produto tem tamanhos)
  const [tamanhoSel, setTamanhoSel] = useState(null)

  // Deriva variacoes e maxSabores do tamanho selecionado ou do produto diretamente
  const variacoes = temTamanhos ? (tamanhoSel?.variacoes || []) : (prato.variacoes || [])
  const maxSabores = temTamanhos ? (tamanhoSel?.maxSabores || 1) : (prato.maxSabores || (prato.meiaAMeia ? 2 : 1))
  const temVariacoes = variacoes.length > 0

  const [selecoes, setSelecoes] = useState(() => {
    const init = {}
    for (const g of grupos) {
      init[g.id] = new Set()
      if (g.minimo > 0 && g.tipo === 'unico' && g.itens.length > 0) {
        const primeiro = g.itens.find(it => {
          if (!it.ingredienteId || !it.quantidadeUsada) return true
          const ing = ingredientes.find(i => i.id === it.ingredienteId)
          return !ing || ing.quantidadeEstoque >= it.quantidadeUsada
        })
        if (primeiro) init[g.id] = new Set([primeiro.id])
      }
    }
    return init
  })
  const [saboresSel, setSaboresSel] = useState([]) // array de variacao objects
  const [bordaSel, setBordaSel] = useState(null)   // borda selecionada ou null
  const [erro, setErro] = useState('')
  const [quantidade, setQuantidade] = useState(1)

  function semEstoque(item) {
    if (!item.ingredienteId || !item.quantidadeUsada) return false
    const ing = ingredientes.find(i => i.id === item.ingredienteId)
    return ing && ing.quantidadeEstoque < item.quantidadeUsada
  }

  function toggleSabor(v) {
    setErro('')
    setSaboresSel(prev => {
      const jaSel = prev.some(x => x.id === v.id)
      if (maxSabores === 1) return [v]
      if (jaSel) return prev.filter(x => x.id !== v.id)
      if (prev.length >= maxSabores) return prev
      return [...prev, v]
    })
  }

  function toggleItem(grupo, itemId) {
    setErro('')
    setSelecoes(prev => {
      const current = new Set(prev[grupo.id] || [])
      if (grupo.tipo === 'unico') {
        return { ...prev, [grupo.id]: new Set([itemId]) }
      }
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        if (next.size >= grupo.maximo) return prev
        next.add(itemId)
      }
      return { ...prev, [grupo.id]: next }
    })
  }

  const extrasTotal = gruposAdicional.reduce((s, grupo) => {
    return s + [...(selecoes[grupo.id] || [])].reduce((ss, itemId) => {
      const item = grupo.itens.find(i => i.id === itemId)
      return ss + (item?.precoExtra || 0)
    }, 0)
  }, 0)

  // Preço baseado em tamanho ou variações selecionadas
  const precoVariacao = (() => {
    if (temTamanhos) {
      // Com tamanhos: preço = tamanho selecionado (fixo)
      return tamanhoSel?.preco ?? prato.precoVenda ?? 0
    }
    if (!temVariacoes || saboresSel.length === 0) return prato.precoVenda || 0
    const precos = saboresSel.map(v => v.preco ?? prato.precoVenda ?? 0)
    if (prato.calcVariacao === 'media') return precos.reduce((s, p) => s + p, 0) / precos.length
    return Math.max(...precos)
  })()

  const precoUnitario = precoVariacao + extrasTotal + (bordaSel?.precoExtra || 0)
  const precoTotal = precoUnitario * quantidade

  function confirmar() {
    if (temTamanhos && !tamanhoSel) {
      setErro('Escolha um tamanho')
      return
    }
    if (temVariacoes && saboresSel.length < maxSabores) {
      setErro(`Escolha ${maxSabores === 2 ? '2 sabores (½+½)' : maxSabores === 3 ? '3 sabores (⅓+⅓+⅓)' : '1 opção'}`)
      return
    }
    for (const grupo of grupos) {
      const sel = selecoes[grupo.id]?.size || 0
      if (sel < grupo.minimo) {
        setErro(`Selecione pelo menos ${grupo.minimo} em "${grupo.nome}"`)
        return
      }
    }
    const opcoes = grupos.flatMap(grupo =>
      [...(selecoes[grupo.id] || [])].map(itemId => {
        const item = grupo.itens.find(i => i.id === itemId)
        return {
          grupoId: grupo.id, grupoNome: grupo.nome,
          categoria: grupo.categoria || 'complemento',
          itemId, nome: item.nome,
          precoExtra: item.precoExtra || 0,
          ingredienteId: item.ingredienteId || null,
          quantidadeUsada: item.quantidadeUsada || 0,
        }
      })
    )
    onConfirmar(opcoes, quantidade, temVariacoes ? saboresSel : null, bordaSel || null, tamanhoSel || null)
  }

  function renderGrupo(grupo) {
    const selQtd = selecoes[grupo.id]?.size || 0
    const noLimite = grupo.tipo === 'multiplo' && selQtd >= grupo.maximo
    const isAdicional = grupo.categoria === 'adicional'
    return (
      <div key={grupo.id}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{grupo.nome}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {grupo.minimo === 0
                ? grupo.tipo === 'unico' ? 'Opcional · escolha 1' : `Opcional · até ${grupo.maximo}`
                : grupo.tipo === 'unico' ? 'Obrigatório · escolha 1'
                  : grupo.minimo === grupo.maximo ? `Obrigatório · escolha ${grupo.maximo}`
                    : `Obrigatório · de ${grupo.minimo} a ${grupo.maximo}`
              }
            </p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: grupo.minimo > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)',
            color: grupo.minimo > 0 ? '#ef4444' : 'var(--text-muted)',
          }}>
            {grupo.minimo > 0 ? 'Obrigatório' : 'Opcional'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {grupo.itens.map(item => {
            const selected = selecoes[grupo.id]?.has(item.id)
            const bloqueado = semEstoque(item)
            const disabled = bloqueado || (!selected && noLimite)
            return (
              <button key={item.id} onClick={() => !disabled && toggleItem(grupo, item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12, border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  background: selected ? (corStr ? `${corStr}15` : 'var(--accent-bg)') : 'var(--bg-hover)',
                  outline: selected ? `1.5px solid ${accentCss}` : '1px solid transparent',
                  opacity: bloqueado ? 0.45 : disabled ? 0.5 : 1,
                  transition: 'all .12s', textAlign: 'left',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: grupo.tipo === 'unico' ? '50%' : 6, flexShrink: 0,
                  border: selected ? `2px solid ${accentCss}` : '2px solid var(--border)',
                  background: selected ? accentCss : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <Check size={11} color="#fff" />}
                </div>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: selected ? 600 : 400 }}>
                  {item.nome}
                </span>
                {bloqueado ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                    <AlertCircle size={11} /> Sem estoque
                  </span>
                ) : isAdicional && item.precoExtra > 0 ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>+{formatarMoeda(item.precoExtra)}</span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>incluso</span>
                )}
              </button>
            )
          })}
        </div>
        {grupo.tipo === 'multiplo' && grupo.maximo > 1 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, marginLeft: 2 }}>
            {selQtd}/{grupo.maximo} selecionado{selQtd !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    )
  }

  const accentBg = corStr ? `${corStr}15` : 'var(--accent-bg)'
  const accentBorder = corStr ? `${corStr}44` : 'var(--border-active)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>{prato.nome}</p>
            {prato.descricao && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{prato.descricao}</p>}
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 8, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Seleção de tamanho ── */}
          {temTamanhos && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tamanho</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Obrigatório</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(prato.tamanhos || []).map(t => {
                  const sel = tamanhoSel?.id === t.id
                  return (
                    <button key={t.id} onClick={() => { setTamanhoSel(t); setSaboresSel([]); setErro('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 12, border: 'none',
                        cursor: 'pointer',
                        background: sel ? (corStr ? `${corStr}15` : 'var(--accent-bg)') : 'var(--bg-hover)',
                        outline: sel ? `1.5px solid ${accentCss}` : '1px solid transparent',
                        transition: 'all .12s', textAlign: 'left', width: '100%',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: sel ? `2px solid ${accentCss}` : '2px solid var(--border)',
                        background: sel ? accentCss : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={11} color="#fff" />}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: sel ? 600 : 400 }}>{t.nome}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Seleção de sabores (½+½ ou ⅓+⅓+⅓) ── */}
          {temVariacoes && (!temTamanhos || tamanhoSel) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {prato.labelSabores || (maxSabores === 1 ? 'Escolha uma opção' : maxSabores === 2 ? '½+½ — Escolha 2 sabores' : '⅓+⅓+⅓ — Escolha 3 sabores')}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Obrigatório</p>
                </div>
                {maxSabores > 1 && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: saboresSel.length === maxSabores ? 'rgba(22,163,74,0.12)' : `${accentCss}18`,
                    color: saboresSel.length === maxSabores ? '#16a34a' : accentCss,
                    border: `1px solid ${saboresSel.length === maxSabores ? 'rgba(22,163,74,0.3)' : `${accentCss}44`}`,
                  }}>
                    {saboresSel.length}/{maxSabores}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {variacoes.map(v => {
                  const sel = saboresSel.some(x => x.id === v.id)
                  const bloqueado = !sel && saboresSel.length >= maxSabores
                  return (
                    <button key={v.id} onClick={() => toggleSabor(v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 12, border: 'none',
                        cursor: bloqueado ? 'not-allowed' : 'pointer',
                        background: sel ? (corStr ? `${corStr}15` : 'var(--accent-bg)') : 'var(--bg-hover)',
                        outline: sel ? `1.5px solid ${accentCss}` : '1px solid transparent',
                        opacity: bloqueado ? 0.4 : 1,
                        transition: 'all .12s', textAlign: 'left', width: '100%',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: maxSabores === 1 ? '50%' : 6, flexShrink: 0,
                        border: sel ? `2px solid ${accentCss}` : '2px solid var(--border)',
                        background: sel ? accentCss : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={11} color="#fff" />}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: sel ? 600 : 400 }}>
                        {v.nome}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: accentCss }}>
                        {formatarMoeda(v.preco ?? prato.precoVenda ?? 0)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Seleção de borda (opcional) ── */}
          {prato.bordas?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{prato.labelBordas || '🍕 Borda'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Opcional · escolha 1</p>
                </div>
                {bordaSel && (
                  <button onClick={() => setBordaSel(null)}
                    style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', cursor: 'pointer' }}>
                    Sem borda
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {prato.bordas.map(b => {
                  const sel = bordaSel?.id === b.id
                  return (
                    <button key={b.id} onClick={() => setBordaSel(sel ? null : b)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 12, border: 'none',
                        cursor: 'pointer',
                        background: sel ? (corStr ? `${corStr}15` : 'var(--accent-bg)') : 'var(--bg-hover)',
                        outline: sel ? `1.5px solid ${accentCss}` : '1px solid transparent',
                        transition: 'all .12s', textAlign: 'left', width: '100%',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: sel ? `2px solid ${accentCss}` : '2px solid var(--border)',
                        background: sel ? accentCss : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={11} color="#fff" />}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: sel ? 600 : 400 }}>{b.nome}</span>
                      {b.precoExtra > 0
                        ? <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>+{formatarMoeda(b.precoExtra)}</span>
                        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>inclusa</span>
                      }
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Separador */}
          {(temVariacoes || prato.bordas?.length > 0) && grupos.length > 0 && (
            <div style={{ height: 1, background: 'var(--border)' }} />
          )}

          {/* Grupos complemento */}
          {gruposComplemento.length > 0 && (
            <div>
              {gruposComplemento.length > 0 && gruposAdicional.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 10px', borderRadius: 20, background: 'var(--bg-hover)' }}>
                    Complementos inclusos
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {gruposComplemento.map(renderGrupo)}
              </div>
            </div>
          )}

          {/* Grupos adicionais */}
          {gruposAdicional.length > 0 && (
            <div>
              {gruposComplemento.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', padding: '2px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.1)' }}>
                    Adicionais (pagos)
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {gruposAdicional.map(renderGrupo)}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {extrasTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: accentBg, border: `1px solid ${accentBorder}` }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Adicionais: +{formatarMoeda(extrasTotal)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Unitário: {formatarMoeda(precoUnitario)}</span>
            </div>
          )}

          {erro && <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', margin: 0 }}>{erro}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Quantidade</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', minWidth: 20, textAlign: 'center' }}>{quantidade}</span>
              <button onClick={() => setQuantidade(q => q + 1)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          <button onClick={confirmar}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: corStr || 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Plus size={16} />
            Adicionar · {formatarMoeda(precoTotal)}
          </button>
        </div>
      </div>
    </div>
  )
}
