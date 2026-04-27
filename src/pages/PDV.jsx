import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, Check, Search, ReceiptText, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { formatarMoeda } from '../utils/formatacao.js'
import ModalOpcoes from '../components/ui/ModalOpcoes.jsx'
import SeletorCliente from '../components/ui/SeletorCliente.jsx'

function CardProduto({ prato, qtd, comGrupos, onAdd, onRemove, onOpcoes }) {
  const selecionado = qtd > 0
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: selecionado ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'all .15s',
      boxShadow: selecionado ? '0 0 0 3px var(--accent-glow)' : 'none',
    }}>
      {prato.foto ? (
        <div style={{ height: 110, overflow: 'hidden', flexShrink: 0 }}>
          <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: 56, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🍽️</span>
        </div>
      )}

      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
          {prato.nome}
        </p>
        {comGrupos && (
          <p style={{ fontSize: 11, color: '#3b82f6', margin: 0 }}>
            {prato.grupos.length} grupo{prato.grupos.length > 1 ? 's' : ''} de opções
          </p>
        )}
        <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)', margin: 0, marginTop: 'auto', paddingTop: 4 }}>
          {prato.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>

        {comGrupos ? (
          <button
            style={{ marginTop: 6, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            onClick={() => onOpcoes(prato)}
          >
            <Plus size={13} />
            {qtd > 0 ? `Adicionar (${qtd} no carrinho)` : 'Personalizar'}
          </button>
        ) : qtd === 0 ? (
          <button
            style={{ marginTop: 6, padding: '7px 0', borderRadius: 8, border: '1.5px solid var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: 'transparent', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            onClick={() => onAdd(prato.id)}
          >
            <Plus size={13} /> Adicionar
          </button>
        ) : (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onRemove(prato.id)}>
              <Minus size={13} style={{ color: 'var(--text-primary)' }} />
            </button>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)', minWidth: 24, textAlign: 'center' }}>{qtd}</span>
            <button style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onAdd(prato.id)}>
              <Plus size={13} style={{ color: '#fff' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PDV() {
  const { pratos, adicionarPedido, mesas, cardapioConfig } = useApp()
  const [busca, setBusca] = useState('')
  const [catSelecionada, setCatSelecionada] = useState(null)
  const [carrinho, setCarrinho] = useState([])
  const [obs, setObs] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [pratoOpcoes, setPratoOpcoes] = useState(null)
  const [mesaId, setMesaId] = useState(null)
  const [clienteId, setClienteId] = useState(null)

  const todasCats = (() => {
    const ordemSalva = cardapioConfig?.ordemCategorias || []
    const cats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
    return [...ordemSalva.filter(c => cats.includes(c)), ...cats.filter(c => !ordemSalva.includes(c))]
  })()

  const pratosFiltrados = pratos.filter(p => {
    if (p.visivelIndividual === false) return false
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCat = !catSelecionada || (catSelecionada === '__sem__' ? !p.categoria : p.categoria === catSelecionada)
    return matchBusca && matchCat
  })

  useEffect(() => { if (busca) setCatSelecionada(null) }, [busca])

  function temModal(p) { return p.grupos?.length > 0 || p.variacoes?.length > 0 || p.tamanhos?.length > 0 }
  function qtdNoCarrinho(pratoId) {
    return carrinho.filter(c => c.pratoId === pratoId).reduce((s, c) => s + c.quantidade, 0)
  }

  function adicionarSimples(pratoId) {
    setCarrinho(prev => {
      const ex = prev.find(c => c.pratoId === pratoId && !c.opcoes?.length)
      if (ex) return prev.map(c => c.uid === ex.uid ? { ...c, quantidade: c.quantidade + 1 } : c)
      return [...prev, { uid: crypto.randomUUID(), pratoId, quantidade: 1, opcoes: [] }]
    })
  }
  function removerSimples(pratoId) {
    setCarrinho(prev => {
      const ex = [...prev].reverse().find(c => c.pratoId === pratoId && !c.opcoes?.length)
      if (!ex) return prev
      if (ex.quantidade <= 1) return prev.filter(c => c.uid !== ex.uid)
      return prev.map(c => c.uid === ex.uid ? { ...c, quantidade: c.quantidade - 1 } : c)
    })
  }
  function confirmarOpcoes(opcoes, quantidade, variacoes, borda, tamanho) {
    const prato = pratoOpcoes
    let precoUnit = prato.precoVenda || 0
    if (tamanho) {
      precoUnit = tamanho.preco ?? prato.precoVenda ?? 0
    } else if (variacoes?.length) {
      const precos = variacoes.map(v => v.preco ?? prato.precoVenda ?? 0)
      precoUnit = prato.calcVariacao === 'media'
        ? precos.reduce((s, p) => s + p, 0) / precos.length
        : Math.max(...precos)
    }
    precoUnit += (opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
    precoUnit += borda?.precoExtra || 0
    setCarrinho(prev => [...prev, {
      uid: crypto.randomUUID(), pratoId: prato.id, quantidade, opcoes,
      variacoes: variacoes || null, borda: borda || null, tamanho: tamanho || null, precoUnit,
    }])
    setPratoOpcoes(null)
  }
  function excluirItem(uid) { setCarrinho(prev => prev.filter(c => c.uid !== uid)) }
  function alterarQtd(uid, delta) {
    setCarrinho(prev => {
      const item = prev.find(c => c.uid === uid)
      if (!item) return prev
      if (item.quantidade + delta <= 0) return prev.filter(c => c.uid !== uid)
      return prev.map(c => c.uid === uid ? { ...c, quantidade: c.quantidade + delta } : c)
    })
  }

  function precoItem(item) {
    if (item.precoUnit != null) return item.precoUnit * item.quantidade
    const prato = pratos.find(x => x.id === item.pratoId)
    if (!prato) return 0
    const extras = (item.opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
    return (prato.precoVenda + extras) * item.quantidade
  }
  const total = carrinho.reduce((s, c) => s + precoItem(c), 0)
  const totalItens = carrinho.reduce((s, c) => s + c.quantidade, 0)

  function finalizarPedido() {
    if (carrinho.length === 0) return
    adicionarPedido(null, carrinho, obs, mesaId, clienteId)
    setCarrinho([]); setObs(''); setMesaId(null); setClienteId(null)
    setSucesso(true); setTimeout(() => setSucesso(false), 2500)
  }

  const pratosPorCat = (() => {
    const grupos = todasCats
      .map(cat => ({ cat, itens: pratos.filter(p => p.categoria === cat) }))
      .filter(g => g.itens.length > 0)
    const semCat = pratos.filter(p => !p.categoria)
    if (semCat.length > 0) grupos.push({ cat: null, itens: semCat })
    return grupos
  })()

  const modoFiltro = busca || catSelecionada

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Produtos */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra de busca + categorias */}
        <div style={{ padding: '10px 14px 0', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, paddingRight: busca ? 34 : 12, height: 36, fontSize: 13 }}
              placeholder="Buscar item..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button onClick={() => setBusca('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {todasCats.length > 0 && !busca && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
              <button
                onClick={() => setCatSelecionada(null)}
                style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s', background: catSelecionada === null ? 'var(--accent)' : 'var(--bg-hover)', color: catSelecionada === null ? '#fff' : 'var(--text-secondary)' }}
              >
                Todos
              </button>
              {todasCats.map(cat => (
                <button key={cat}
                  onClick={() => setCatSelecionada(catSelecionada === cat ? null : cat)}
                  style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s', background: catSelecionada === cat ? 'var(--accent)' : 'var(--bg-hover)', color: catSelecionada === cat ? '#fff' : 'var(--text-secondary)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grade */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '12px 14px' }}>
          {pratos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <ReceiptText size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma receita cadastrada</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastre receitas para usar o PDV.</p>
            </div>
          ) : pratosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <Search size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhum resultado</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tente outro termo ou categoria.</p>
            </div>
          ) : modoFiltro ? (
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))' }}>
              {pratosFiltrados.map(prato => (
                <CardProduto key={prato.id} prato={prato} qtd={qtdNoCarrinho(prato.id)}
                  comGrupos={temModal(prato)} onAdd={adicionarSimples} onRemove={removerSimples} onOpcoes={p => setPratoOpcoes(p)} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pratosPorCat.map(({ cat, itens }) => (
                <div key={cat || '__sem__'}>
                  {(cat || todasCats.length > 0) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: cat ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {cat || 'Outros'}
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))' }}>
                    {itens.map(prato => (
                      <CardProduto key={prato.id} prato={prato} qtd={qtdNoCarrinho(prato.id)}
                        comGrupos={temModal(prato)} onAdd={adicionarSimples} onRemove={removerSimples} onOpcoes={p => setPratoOpcoes(p)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrinho lateral */}
      <div className="hidden lg:flex flex-col shrink-0" style={{ width: 296, background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Pedido</span>
          {totalItens > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--accent)', color: '#fff' }}>
              {totalItens}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: 10 }}>
          {carrinho.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <ShoppingCart size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum item</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {carrinho.map(item => {
                const prato = pratos.find(x => x.id === item.pratoId)
                if (!prato) return null
                const extras = (item.opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
                const precoUnit = prato.precoVenda + extras
                return (
                  <div key={item.uid} style={{ borderRadius: 10, padding: '10px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{prato.nome}</p>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }} onClick={() => excluirItem(item.uid)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {item.opcoes?.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        {item.opcoes.map((o, i) => (
                          <p key={i} style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                            · {o.nome}{o.precoExtra > 0 ? ` (+${formatarMoeda(o.precoExtra)})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button style={{ padding: '3px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => alterarQtd(item.uid, -1)}><Minus size={11} /></button>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                      <button style={{ padding: '3px 9px', borderRadius: 7, border: 'none', background: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => alterarQtd(item.uid, 1)}><Plus size={11} color="#fff" /></button>
                      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatarMoeda(precoUnit * item.quantidade)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mesa</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <button onClick={() => setMesaId(null)}
                style={{ padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mesaId === null ? 'var(--accent)' : 'var(--bg-hover)', color: mesaId === null ? '#fff' : 'var(--text-secondary)', transition: 'all .1s' }}>
                Balcão
              </button>
              {mesas.map(m => (
                <button key={m.id} onClick={() => setMesaId(m.id)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .1s',
                    background: mesaId === m.id ? 'var(--accent)' : m.status === 'ocupada' ? 'rgba(22,163,74,0.12)' : m.status === 'reservada' ? 'rgba(245,158,11,0.12)' : 'var(--bg-hover)',
                    color: mesaId === m.id ? '#fff' : m.status === 'ocupada' ? '#16a34a' : m.status === 'reservada' ? '#d97706' : 'var(--text-secondary)',
                  }}>
                  {m.nome}{m.status === 'ocupada' ? ' ●' : m.status === 'reservada' ? ' (res.)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cliente</p>
            <SeletorCliente clienteId={clienteId} onChange={setClienteId} />
          </div>

          <textarea className="input text-sm" placeholder="Observação (opcional)..." rows={2} style={{ resize: 'none', fontSize: 12 }} value={obs} onChange={e => setObs(e.target.value)} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{formatarMoeda(total)}</span>
          </div>

          {sucesso ? (
            <div style={{ padding: '10px 0', borderRadius: 10, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={15} /> Pedido registrado!
            </div>
          ) : (
            <button
              disabled={carrinho.length === 0}
              onClick={finalizarPedido}
              style={{ padding: '11px 0', borderRadius: 10, border: 'none', cursor: carrinho.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, background: 'var(--accent)', color: '#fff', opacity: carrinho.length === 0 ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity .15s' }}
            >
              <Check size={15} /> Finalizar Pedido
            </button>
          )}
        </div>
      </div>

      {/* Bottom bar mobile */}
      {totalItens > 0 && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 mx-4 rounded-2xl px-5 py-3 flex items-center gap-3" style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)', zIndex: 50 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{totalItens} item{totalItens !== 1 ? 's' : ''}</span>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatarMoeda(total)}</span>
          <button style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 10, background: '#fff', color: 'var(--accent)', border: 'none', cursor: 'pointer' }} onClick={finalizarPedido}>Finalizar</button>
        </div>
      )}

      {pratoOpcoes && (
        <ModalOpcoes prato={pratoOpcoes} onConfirmar={confirmarOpcoes} onFechar={() => setPratoOpcoes(null)} />
      )}
    </div>
  )
}
