import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, UtensilsCrossed, Plus, Minus, X, ChevronDown, MapPin, Phone, CreditCard, Banknote, QrCode, MessageCircle, Clock, AlertCircle } from 'lucide-react'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function formatarMoeda(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ICONE_PGTO = { dinheiro: <Banknote size={14} />, pix: <QrCode size={14} />, cartao: <CreditCard size={14} /> }
const LABEL_PGTO = { dinheiro: 'Dinheiro', pix: 'PIX', cartao: 'Cartão' }

export default function DeliveryPublico() {
  const { slug } = useParams()

  const registro = loadFromStorage('rd_delivery_slugs', {})
  const prefixKey = slug ? registro[slug.toLowerCase()] : null
  const prefix = prefixKey ? `rd_${prefixKey}_` : null

  const pratos = useMemo(() => prefix ? loadFromStorage(prefix + 'pratos', []) : [], [prefix])
  const config = useMemo(() => prefix ? loadFromStorage(prefix + 'config_delivery', {}) : {}, [prefix])
  const cardapioConfig = useMemo(() => prefix ? loadFromStorage(prefix + 'cardapio_config', {}) : {}, [prefix])

  const [carrinho, setCarrinho] = useState([])
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [checkoutAberto, setCheckoutAberto] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  // Checkout form
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [endereco, setEndereco] = useState('')
  const [complemento, setComplemento] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [troco, setTroco] = useState('')
  const [obs, setObs] = useState('')
  const [erros, setErros] = useState({})

  if (!prefixKey || !config.ativo) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#f1f5f9', gap: 16, padding: 24,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <UtensilsCrossed size={48} color="#475569" />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Delivery não disponível</h1>
        <p style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          O endereço <strong style={{ color: '#f1f5f9' }}>/delivery/{slug}</strong> não está ativo ou não existe.
        </p>
      </div>
    )
  }

  const destaque = cardapioConfig.corDestaque || '#16a34a'
  const corHeader = cardapioConfig.corFundo || destaque
  const modoClaro = cardapioConfig.modoClaro !== false
  const fundo = modoClaro ? '#f8fafc' : '#0f172a'
  const cardBg = modoClaro ? '#ffffff' : '#1e293b'
  const corTexto = modoClaro ? '#111827' : '#f1f5f9'
  const corTextoSec = modoClaro ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
  const borda = modoClaro ? '#e5e7eb' : 'rgba(255,255,255,0.08)'

  const bairrosAtivos = (config.bairros || []).filter(b => b.ativo)
  const bairroSelecionado = bairrosAtivos.find(b => b.id === bairroId)
  const freteValor = bairroSelecionado?.frete || 0

  const categorias = ['Todas', ...new Set(pratos.map(p => p.categoria).filter(Boolean))]
  const pratosFiltrados = pratos
    .filter(p => p.disponivel !== false)
    .filter(p => filtro === 'Todas' || p.categoria === filtro)
    .filter(p => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()))

  const totalItens = carrinho.reduce((s, i) => s + i.qtd, 0)
  const subtotal = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0)
  const total = subtotal + freteValor

  function adicionarAoCarrinho(prato, variacao = null) {
    const chave = variacao ? `${prato.id}_${variacao.id}` : prato.id
    const preco = variacao ? variacao.preco : prato.preco
    const nome = variacao ? `${prato.nome} (${variacao.nome})` : prato.nome
    setCarrinho(prev => {
      const idx = prev.findIndex(i => i.chave === chave)
      if (idx >= 0) return prev.map((i, j) => j === idx ? { ...i, qtd: i.qtd + 1 } : i)
      return [...prev, { chave, pratoId: prato.id, nome, preco, qtd: 1, foto: prato.foto }]
    })
  }

  function alterarQtd(chave, delta) {
    setCarrinho(prev =>
      prev.map(i => i.chave === chave ? { ...i, qtd: i.qtd + delta } : i)
        .filter(i => i.qtd > 0)
    )
  }

  function qtdNoCarrinho(pratoId) {
    return carrinho.filter(i => i.pratoId === pratoId).reduce((s, i) => s + i.qtd, 0)
  }

  function validarCheckout() {
    const e = {}
    if (!nome.trim()) e.nome = 'Informe seu nome'
    if (!telefone.trim()) e.telefone = 'Informe seu telefone'
    if (!bairroId) e.bairro = 'Selecione o bairro'
    if (!endereco.trim()) e.endereco = 'Informe o endereço'
    if (!pagamento) e.pagamento = 'Selecione a forma de pagamento'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function enviarPedido() {
    if (!validarCheckout()) return

    const linhasItens = carrinho.map(i => `• ${i.qtd}x ${i.nome} — ${formatarMoeda(i.preco * i.qtd)}`).join('\n')
    const mensagem = [
      config.mensagemIntro || 'Olá! Gostaria de fazer um pedido:',
      '',
      '📋 *PEDIDO*',
      linhasItens,
      '',
      `Subtotal: ${formatarMoeda(subtotal)}`,
      `Frete (${bairroSelecionado?.nome}): ${freteValor > 0 ? formatarMoeda(freteValor) : 'Grátis'}`,
      `*Total: ${formatarMoeda(total)}*`,
      '',
      '📍 *ENTREGA*',
      `Bairro: ${bairroSelecionado?.nome}`,
      `Endereço: ${endereco}`,
      complemento ? `Complemento: ${complemento}` : null,
      '',
      '👤 *CLIENTE*',
      `Nome: ${nome}`,
      `Telefone: ${telefone}`,
      '',
      `💳 Pagamento: ${LABEL_PGTO[pagamento] || pagamento}`,
      pagamento === 'dinheiro' && troco ? `Troco para: ${troco}` : null,
      obs ? `\n📝 Observações: ${obs}` : null,
    ].filter(Boolean).join('\n')

    const tel = config.telefone?.replace(/\D/g, '')
    const url = `https://wa.me/${tel ? '55' + tel : ''}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
    setPedidoEnviado(true)
    setCheckoutAberto(false)
    setCarrinho([])
  }

  const nomeRestaurante = cardapioConfig.nomeRestaurante || 'Delivery'

  return (
    <div style={{ minHeight: '100vh', background: fundo, fontFamily: "'Segoe UI', system-ui, sans-serif", color: corTexto }}>
      {/* Header */}
      <div style={{ background: corHeader, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {cardapioConfig.logo && (
            <img src={cardapioConfig.logo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: '#fff', margin: 0 }}>{nomeRestaurante}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Clock size={12} color="rgba(255,255,255,0.75)" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{config.tempoEstimado || '30-45 min'}</span>
              {config.pedidoMinimo > 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>· Mín. {formatarMoeda(config.pedidoMinimo)}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setCarrinhoAberto(true)}
          style={{ position: 'relative', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShoppingCart size={18} />
          {totalItens > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -6, right: -6 }}>
              {totalItens}
            </span>
          )}
        </button>
      </div>

      {/* Busca + categorias */}
      <div style={{ padding: '12px 16px', background: cardBg, borderBottom: `1px solid ${borda}` }}>
        <input
          placeholder="Buscar no cardápio..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: `1px solid ${borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
        />
        {categorias.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setFiltro(cat)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: filtro === cat ? destaque : (modoClaro ? '#f1f5f9' : 'rgba(255,255,255,0.07)'),
                color: filtro === cat ? '#fff' : corTextoSec,
              }}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de pratos */}
      <div style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
        {pratosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: corTextoSec }}>
            <UtensilsCrossed size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p>Nenhum item encontrado</p>
          </div>
        ) : (
          pratosFiltrados.map(prato => {
            const qtd = qtdNoCarrinho(prato.id)
            const temVariacoes = prato.tipo === 'variacao' && prato.variacoes?.length > 0
            const preco = temVariacoes ? Math.min(...prato.variacoes.map(v => v.preco)) : prato.preco

            return (
              <div key={prato.id} style={{
                display: 'flex', gap: 12, padding: '14px 0',
                borderBottom: `1px solid ${borda}`,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: corTexto }}>{prato.nome}</p>
                  {prato.descricao && (
                    <p style={{ fontSize: 13, color: corTextoSec, margin: '0 0 8px', lineHeight: 1.4 }}>{prato.descricao}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: destaque }}>
                      {temVariacoes ? `A partir de ${formatarMoeda(preco)}` : formatarMoeda(preco)}
                    </span>
                    {!temVariacoes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {qtd > 0 ? (
                          <>
                            <button onClick={() => alterarQtd(prato.id, -1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qtd}</span>
                          </>
                        ) : null}
                        <button onClick={() => adicionarAoCarrinho(prato)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {temVariacoes && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {prato.variacoes.map(v => (
                        <button key={v.id} onClick={() => adicionarAoCarrinho(prato, v)} style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer',
                        }}>
                          {v.nome} — {formatarMoeda(v.preco)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {prato.foto && (
                  <img src={prato.foto} alt={prato.nome} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Barra de carrinho flutuante */}
      {totalItens > 0 && !carrinhoAberto && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 40, width: 'calc(100% - 32px)', maxWidth: 580 }}>
          <button
            onClick={() => setCarrinhoAberto(true)}
            style={{ width: '100%', background: destaque, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '2px 8px', fontSize: 13 }}>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
            <span>Ver carrinho</span>
            <span>{formatarMoeda(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Pedido enviado */}
      {pedidoEnviado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontWeight: 800, fontSize: 18, color: corTexto, margin: '0 0 8px' }}>Pedido enviado!</p>
            <p style={{ color: corTextoSec, fontSize: 14, margin: '0 0 20px' }}>O pedido foi enviado pelo WhatsApp. Aguarde a confirmação do estabelecimento.</p>
            <button onClick={() => setPedidoEnviado(false)} style={{ background: destaque, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Fazer novo pedido
            </button>
          </div>
        </div>
      )}

      {/* Modal carrinho */}
      {carrinhoAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: cardBg, borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: corTexto, margin: 0 }}>Seu carrinho</p>
              <button onClick={() => setCarrinhoAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: corTextoSec }}>
                <X size={20} />
              </button>
            </div>
            {carrinho.length === 0 ? (
              <p style={{ color: corTextoSec, textAlign: 'center', padding: '20px 0' }}>Carrinho vazio</p>
            ) : (
              <>
                {carrinho.map(item => (
                  <div key={item.chave} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${borda}` }}>
                    {item.foto && <img src={item.foto} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: corTexto }}>{item.nome}</p>
                      <p style={{ color: destaque, fontWeight: 700, fontSize: 13, margin: '2px 0 0' }}>{formatarMoeda(item.preco)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => alterarQtd(item.chave, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', color: corTexto }}>{item.qtd}</span>
                      <button onClick={() => alterarQtd(item.chave, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: corTextoSec, marginBottom: 6 }}>
                    <span>Subtotal</span><span>{formatarMoeda(subtotal)}</span>
                  </div>
                  {config.pedidoMinimo > 0 && subtotal < config.pedidoMinimo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', marginBottom: 10 }}>
                      <AlertCircle size={14} color="#ef4444" />
                      <span style={{ fontSize: 13, color: '#ef4444' }}>Pedido mínimo: {formatarMoeda(config.pedidoMinimo)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setCarrinhoAberto(false); setCheckoutAberto(true) }}
                    disabled={config.pedidoMinimo > 0 && subtotal < config.pedidoMinimo}
                    style={{ width: '100%', background: destaque, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, opacity: (config.pedidoMinimo > 0 && subtotal < config.pedidoMinimo) ? 0.5 : 1 }}
                  >
                    Fechar pedido → {formatarMoeda(subtotal)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal checkout */}
      {checkoutAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 0 40px' }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 24, width: 'calc(100% - 32px)', maxWidth: 480, margin: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: corTexto, margin: 0 }}>Finalizar pedido</p>
              <button onClick={() => setCheckoutAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: corTextoSec }}>
                <X size={20} />
              </button>
            </div>

            {/* Resumo */}
            <div style={{ background: modoClaro ? '#f8fafc' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 13 }}>
              {carrinho.map(i => (
                <div key={i.chave} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: corTexto }}>
                  <span>{i.qtd}x {i.nome}</span>
                  <span style={{ fontWeight: 600 }}>{formatarMoeda(i.preco * i.qtd)}</span>
                </div>
              ))}
            </div>

            {/* Dados pessoais */}
            <p style={{ fontWeight: 700, fontSize: 13, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Seus dados</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div>
                <input placeholder="Seu nome *" value={nome} onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${erros.nome ? '#ef4444' : borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                {erros.nome && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.nome}</p>}
              </div>
              <div>
                <input placeholder="Telefone/WhatsApp *" value={telefone} onChange={e => setTelefone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${erros.telefone ? '#ef4444' : borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                {erros.telefone && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.telefone}</p>}
              </div>
            </div>

            {/* Entrega */}
            <p style={{ fontWeight: 700, fontSize: 13, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Endereço de entrega</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <select value={bairroId} onChange={e => setBairroId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${erros.bairro ? '#ef4444' : borda}`, background: fundo, color: bairroId ? corTexto : corTextoSec, fontSize: 14, boxSizing: 'border-box', outline: 'none', appearance: 'none' }}>
                  <option value="">Selecione o bairro *</option>
                  {bairrosAtivos.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} — {b.frete > 0 ? formatarMoeda(b.frete) : 'Grátis'}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: corTextoSec, pointerEvents: 'none' }} />
                {erros.bairro && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.bairro}</p>}
              </div>
              <div>
                <input placeholder="Rua, número *" value={endereco} onChange={e => setEndereco(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${erros.endereco ? '#ef4444' : borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                {erros.endereco && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.endereco}</p>}
              </div>
              <input placeholder="Complemento (apto, bloco...)" value={complemento} onChange={e => setComplemento(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>

            {/* Pagamento */}
            <p style={{ fontWeight: 700, fontSize: 13, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Forma de pagamento</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: pagamento === 'dinheiro' ? 10 : 20 }}>
              {(config.formasPagamento || ['dinheiro', 'pix', 'cartao']).map(fp => (
                <button key={fp} onClick={() => setPagamento(fp)} style={{
                  flex: 1, minWidth: 90, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${pagamento === fp ? destaque : borda}`,
                  background: pagamento === fp ? `${destaque}18` : 'transparent',
                  color: pagamento === fp ? destaque : corTextoSec, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  {ICONE_PGTO[fp]}
                  {LABEL_PGTO[fp] || fp}
                </button>
              ))}
            </div>
            {erros.pagamento && <p style={{ color: '#ef4444', fontSize: 12, margin: '-14px 0 10px' }}>{erros.pagamento}</p>}
            {pagamento === 'dinheiro' && (
              <div style={{ marginBottom: 16 }}>
                <input placeholder="Troco para quanto? (opcional)" value={troco} onChange={e => setTroco(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            )}

            {/* Observações */}
            <textarea placeholder="Observações sobre o pedido (opcional)" value={obs} onChange={e => setObs(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borda}`, background: fundo, color: corTexto, fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', marginBottom: 20, fontFamily: 'inherit' }} />

            {/* Total */}
            <div style={{ borderTop: `1px solid ${borda}`, paddingTop: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: corTextoSec, marginBottom: 6 }}>
                <span>Subtotal</span><span>{formatarMoeda(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: corTextoSec, marginBottom: 10 }}>
                <span>Frete{bairroSelecionado ? ` (${bairroSelecionado.nome})` : ''}</span>
                <span>{freteValor > 0 ? formatarMoeda(freteValor) : bairroId ? 'Grátis' : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: corTexto }}>
                <span>Total</span><span style={{ color: destaque }}>{formatarMoeda(total)}</span>
              </div>
            </div>

            <button onClick={enviarPedido} style={{
              width: '100%', background: destaque, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <MessageCircle size={16} />
              Enviar pedido via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
