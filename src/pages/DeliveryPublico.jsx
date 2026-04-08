import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'

// ─── helpers ────────────────────────────────────────────────────────────────

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function formatarMoeda(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function gerarChave() {
  return Math.random().toString(36).slice(2) + Date.now()
}

// ─── icons (inline SVG — no lucide import needed) ───────────────────────────

function IcoSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IcoStar({ fill = 'none', color = 'currentColor' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IcoUtensils() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  )
}
function IcoUtensilsBig() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#475569' }}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  )
}
function IcoChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function IcoX({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function IcoPlus({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IcoMinus({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IcoBanknote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
function IcoQr() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h.01M17 14h.01" />
    </svg>
  )
}
function IcoCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )
}
function IcoWhatsapp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}
function IcoChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const ICONE_PGTO = { dinheiro: <IcoBanknote />, pix: <IcoQr />, cartao: <IcoCard /> }
const LABEL_PGTO = { dinheiro: 'Dinheiro', pix: 'PIX', cartao: 'Cartão' }

// ─── sub-components ──────────────────────────────────────────────────────────

function FotoPlaceholder() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.06)' }}>
      <IcoUtensils />
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DeliveryPublico() {
  const { slug } = useParams()

  const registro = loadFromStorage('rd_delivery_slugs', {})
  const dono = slug ? registro[slug.toLowerCase()] : null
  const prefix = dono ? `rd_${dono}_` : null

  const pratos = useMemo(() => prefix ? loadFromStorage(prefix + 'pratos', []) : [], [prefix])
  const config = useMemo(() => prefix ? loadFromStorage(prefix + 'cardapio_config', {}) : {}, [prefix])
  const configDelivery = useMemo(() => prefix ? loadFromStorage(prefix + 'config_delivery', {}) : {}, [prefix])

  // ── visual config ──────────────────────────────────────────────────────────
  const modoIfood = !!configDelivery.modoIfood
  const destaque = modoIfood ? '#ea1d2c' : (config.corDestaque || '#16a34a')
  const corEstrela = modoIfood ? '#f59e0b' : (config.corEstrela || destaque)
  const corPreco = modoIfood ? '#3d3d3d' : (config.corPreco || destaque)
  const corHeader = config.corFundo || destaque
  const modoClaro = modoIfood ? true : config.modoClaro !== false
  const fundo = modoIfood ? '#f5f5f5' : (modoClaro ? '#ffffff' : '#0f172a')
  const cardBg = modoClaro ? '#ffffff' : '#1e293b'
  const corTextoBase = modoClaro ? '#111827' : '#ffffff'
  const corTextoSec = modoClaro ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
  const bordaCard = modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.08)'
  const layoutGrade = modoIfood ? false : config.layoutPadrao === 'grade'
  const bannerH = config.bannerAltura || 200
  const overlapH = 56

  // frete mínimo dos bairros ativos
  const bairrosParaFrete = (configDelivery.bairros || []).filter(b => b.ativo)
  const freteMin = bairrosParaFrete.length > 0 ? Math.min(...bairrosParaFrete.map(b => b.frete || 0)) : null
  const freteMinLabel = freteMin === null ? null : freteMin === 0 ? 'Grátis' : formatarMoeda(freteMin)

  // ── catalog state ──────────────────────────────────────────────────────────
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')

  // ── modal produto ──────────────────────────────────────────────────────────
  const [pratoDetalhe, setPratoDetalhe] = useState(null)
  const [modalVariacao, setModalVariacao] = useState(null)   // variacao selecionada
  const [modalAdicionais, setModalAdicionais] = useState({}) // { itemId: qty }
  const [modalQtd, setModalQtd] = useState(1)

  // ── carrinho ───────────────────────────────────────────────────────────────
  const [carrinho, setCarrinho] = useState([])

  // ── checkout ───────────────────────────────────────────────────────────────
  const [checkoutAberto, setCheckoutAberto] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1) // 1 = pedido, 2 = entrega/pgto
  const [tipoEntrega, setTipoEntrega] = useState('entrega') // 'entrega' | 'retirar'
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [endereco, setEndereco] = useState('')
  const [complemento, setComplemento] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [troco, setTroco] = useState('')
  const [obs, setObs] = useState('')
  const [erros, setErros] = useState({})
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  // ── guard: slug não encontrado ou delivery inativo ─────────────────────────
  if (!dono || !configDelivery.ativo) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#f1f5f9', gap: 16, padding: 24,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <IcoUtensilsBig />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Delivery não disponível</h1>
        <p style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          O endereço <strong style={{ color: '#f1f5f9' }}>/delivery/{slug}</strong> não está ativo ou não existe.
        </p>
      </div>
    )
  }

  // ── derived catalog data ───────────────────────────────────────────────────
  const todasCats = [...new Set(pratos.filter(p => p.disponivel !== false).map(p => p.categoria).filter(Boolean))]
  const ordemSalva = config.ordemCategorias || []
  const catsOrdenadas = [
    ...ordemSalva.filter(c => todasCats.includes(c)),
    ...todasCats.filter(c => !ordemSalva.includes(c)),
  ]
  const categorias = ['Todas', ...catsOrdenadas]

  const pratosFiltrados = pratos
    .filter(p => p.disponivel !== false)
    .filter(p => filtro === 'Todas' || p.categoria === filtro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const pratosPorCategoria = filtro === 'Todas'
    ? catsOrdenadas.map(cat => ({ cat, itens: pratosFiltrados.filter(p => p.categoria === cat) })).filter(g => g.itens.length > 0)
    : [{ cat: filtro, itens: pratosFiltrados }]

  // ── derived cart data ──────────────────────────────────────────────────────
  const bairrosAtivos = (configDelivery.bairros || []).filter(b => b.ativo)
  const bairroSelecionado = bairrosAtivos.find(b => b.id === bairroId)
  const freteValor = (tipoEntrega === 'entrega' && bairroSelecionado) ? (bairroSelecionado.frete || 0) : 0

  const totalItens = carrinho.reduce((s, i) => s + i.qtd, 0)
  const subtotal = carrinho.reduce((s, i) => {
    const adExtra = (i.adicionaisEscolhidos || []).reduce((a, ad) => a + ad.precoExtra * ad.qtd, 0)
    return s + (i.preco + adExtra) * i.qtd
  }, 0)
  const total = subtotal + freteValor

  // ── modal helpers ──────────────────────────────────────────────────────────
  function abrirModal(prato) {
    setPratoDetalhe(prato)
    setModalVariacao(null)
    setModalAdicionais({})
    setModalQtd(1)
  }

  function fecharModal() {
    setPratoDetalhe(null)
  }

  function calcularTotalModal() {
    if (!pratoDetalhe) return 0
    const precoBase = modalVariacao
      ? (modalVariacao.preco ?? pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)
      : (pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)
    const extraAdicionais = Object.entries(modalAdicionais).reduce((sum, [itemId, qty]) => {
      if (qty <= 0) return sum
      // find item across all adicional groups
      for (const g of (pratoDetalhe.grupos || [])) {
        if (g.categoria === 'adicional') {
          const item = (g.itens || []).find(it => it.id === itemId)
          if (item) return sum + (item.precoExtra || 0) * qty
        }
      }
      return sum
    }, 0)
    return (precoBase + extraAdicionais) * modalQtd
  }

  function adicionarAoCarrinho() {
    if (!pratoDetalhe) return
    const temVariacoes = (pratoDetalhe.variacoes || []).length > 0
    if (temVariacoes && !modalVariacao) return // must pick one

    const preco = modalVariacao
      ? (modalVariacao.preco ?? pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)
      : (pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)

    const adicionaisEscolhidos = []
    for (const g of (pratoDetalhe.grupos || [])) {
      if (g.categoria !== 'adicional') continue
      for (const item of (g.itens || [])) {
        const qty = modalAdicionais[item.id] || 0
        if (qty > 0) {
          adicionaisEscolhidos.push({
            id: item.id,
            nome: item.nome,
            grupoNome: g.nome,
            precoExtra: item.precoExtra || 0,
            qtd: qty,
          })
        }
      }
    }

    const novoItem = {
      chave: gerarChave(),
      pratoId: pratoDetalhe.id,
      nome: modalVariacao ? `${pratoDetalhe.nome} (${modalVariacao.nome})` : pratoDetalhe.nome,
      preco,
      qtd: modalQtd,
      foto: pratoDetalhe.foto || null,
      variacao: modalVariacao || null,
      adicionaisEscolhidos,
      obs: '',
    }

    setCarrinho(prev => [...prev, novoItem])
    fecharModal()
  }

  function alterarQtdCarrinho(chave, delta) {
    setCarrinho(prev =>
      prev.map(i => i.chave === chave ? { ...i, qtd: i.qtd + delta } : i)
        .filter(i => i.qtd > 0)
    )
  }

  // ── checkout ───────────────────────────────────────────────────────────────
  function abrirCheckout() {
    setCheckoutStep(1)
    setCheckoutAberto(true)
  }

  function validarStep2() {
    const e = {}
    if (!nome.trim()) e.nome = 'Informe seu nome'
    if (!telefone.trim()) e.telefone = 'Informe seu telefone'
    if (tipoEntrega === 'entrega') {
      if (!bairroId) e.bairro = 'Selecione o bairro'
      if (!endereco.trim()) e.endereco = 'Informe o endereço'
    }
    if (!pagamento) e.pagamento = 'Selecione a forma de pagamento'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function enviarPedido() {
    if (!validarStep2()) return

    const linhasItens = carrinho.map(i => {
      const adExtra = (i.adicionaisEscolhidos || []).reduce((a, ad) => a + ad.precoExtra * ad.qtd, 0)
      const precoTotal = (i.preco + adExtra) * i.qtd
      let linha = `• ${i.qtd}x ${i.nome} — ${formatarMoeda(precoTotal)}`
      if (i.adicionaisEscolhidos && i.adicionaisEscolhidos.length > 0) {
        const ads = i.adicionaisEscolhidos.map(a => `  + ${a.nome}${a.qtd > 1 ? ` x${a.qtd}` : ''}`).join('\n')
        linha += '\n' + ads
      }
      return linha
    }).join('\n')

    const partes = [
      configDelivery.mensagemIntro || 'Olá! Gostaria de fazer um pedido:',
      '',
      '📋 *PEDIDO*',
      linhasItens,
      '',
      `Subtotal: ${formatarMoeda(subtotal)}`,
    ]

    if (tipoEntrega === 'entrega') {
      partes.push(`Frete (${bairroSelecionado?.nome || ''}): ${freteValor > 0 ? formatarMoeda(freteValor) : 'Grátis'}`)
    }

    partes.push(`*Total: ${formatarMoeda(total)}*`)
    partes.push('')

    if (tipoEntrega === 'entrega') {
      partes.push('📍 *ENTREGA*')
      partes.push(`Bairro: ${bairroSelecionado?.nome || ''}`)
      partes.push(`Endereço: ${endereco}`)
      if (complemento) partes.push(`Complemento: ${complemento}`)
    } else {
      partes.push('🏪 *RETIRADA NO LOCAL*')
    }

    partes.push('')
    partes.push('👤 *CLIENTE*')
    partes.push(`Nome: ${nome}`)
    partes.push(`Telefone: ${telefone}`)
    partes.push('')
    partes.push(`💳 Pagamento: ${LABEL_PGTO[pagamento] || pagamento}`)

    if (pagamento === 'dinheiro' && troco) {
      partes.push(`Troco para: ${troco}`)
    }
    if (obs) {
      partes.push(`\n📝 Obs: ${obs}`)
    }

    const mensagem = partes.filter(l => l !== null && l !== undefined).join('\n')
    const tel = configDelivery.telefone?.replace(/\D/g, '')
    const url = `https://wa.me/${tel ? '55' + tel : ''}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')

    setPedidoEnviado(true)
    setCheckoutAberto(false)
    setCarrinho([])
    // reset form
    setNome(''); setTelefone(''); setBairroId(''); setEndereco(''); setComplemento('')
    setPagamento(''); setTroco(''); setObs(''); setErros({})
    setCheckoutStep(1); setTipoEntrega('entrega')
  }

  function resetarPedido() {
    setPedidoEnviado(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // ── modal produto ──────────────────────────────────────────────────────────
  const gruposComplemento = pratoDetalhe ? (pratoDetalhe.grupos || []).filter(g => g.categoria !== 'adicional') : []
  const gruposAdicional = pratoDetalhe ? (pratoDetalhe.grupos || []).filter(g => g.categoria === 'adicional') : []
  const temVariacoesModal = pratoDetalhe && (pratoDetalhe.variacoes || []).length > 0
  const podeConcluirModal = !temVariacoesModal || modalVariacao !== null
  const totalModal = calcularTotalModal()

  return (
    <div style={{ minHeight: '100vh', background: fundo, fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: totalItens > 0 ? 80 : 0 }}>

      {/* ── Banner + Restaurant card (identical to MenuPublico) ── */}
      <div style={{ position: 'relative', marginBottom: 0 }}>
        {config.banner
          ? <div style={{ height: bannerH, overflow: 'hidden' }}>
              <img src={config.banner} alt="banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: config.bannerPos || '50% 50%', display: 'block' }} />
            </div>
          : <div style={{ height: bannerH, background: corHeader }} />
        }

        <div style={{
          background: '#fff', borderRadius: '24px 24px 0 0', marginTop: -overlapH,
          position: 'relative', zIndex: 2,
          paddingTop: modoIfood ? 60 : 54,
          paddingBottom: modoIfood ? 0 : 20,
          textAlign: modoIfood ? 'left' : 'center',
          boxShadow: modoClaro ? '0 -4px 20px rgba(0,0,0,0.08)' : '0 -4px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Logo */}
          <div style={{
            position: 'absolute', top: -(overlapH / 2 + 20), left: '50%', transform: 'translateX(-50%)',
            width: 90, height: 90, borderRadius: '50%', border: '4px solid #fff',
            overflow: 'hidden', background: config.logo ? 'transparent' : destaque,
            boxShadow: '0 4px 18px rgba(0,0,0,0.22)', zIndex: 3,
          }}>
            {config.logo
              ? <img src={config.logo} alt={config.nomeRestaurante} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IcoUtensils />
                </div>
            }
          </div>

          {modoIfood ? (
            /* ── iFood card: left-aligned, dark text, dividers ── */
            <div style={{ padding: '0 20px 16px' }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
                {config.nomeRestaurante || 'Delivery'}
              </p>
              {config.descricao && (
                <p style={{ fontSize: 13, color: '#717171', margin: '0 0 12px' }}>{config.descricao}</p>
              )}

              {config.estrelasAtivas && (config.estrelaValor || config.estrelaQtd) && (
                <>
                  <div style={{ height: 1, background: '#ebebeb', margin: '12px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcoStar fill="#f59e0b" color="#f59e0b" />
                    {config.estrelaValor && <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{Number(config.estrelaValor).toFixed(1)}</span>}
                    {config.estrelaQtd && <span style={{ fontSize: 13, color: '#717171' }}>({config.estrelaQtd} {config.estrelaQtd === 1 ? 'avaliação' : 'avaliações'})</span>}
                  </div>
                </>
              )}

              {(configDelivery.tempoEstimado || freteMinLabel || configDelivery.tipoEntrega) && (
                <>
                  <div style={{ height: 1, background: '#ebebeb', margin: '12px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1a1a1a' }}>
                    {configDelivery.tipoEntrega && <span style={{ fontWeight: 700 }}>{configDelivery.tipoEntrega}</span>}
                    {configDelivery.tipoEntrega && configDelivery.tempoEstimado && <span style={{ color: '#717171' }}>•</span>}
                    {configDelivery.tempoEstimado && <span>{configDelivery.tempoEstimado}</span>}
                    {freteMinLabel && <span style={{ color: '#717171' }}>•</span>}
                    {freteMinLabel && <span style={{ fontWeight: 600 }}>{freteMinLabel}</span>}
                  </div>
                </>
              )}
              <div style={{ height: 1, background: '#ebebeb', margin: '12px 0 0' }} />
            </div>
          ) : (
            /* ── Modo normal: centered ── */
            <>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: corTextoBase, margin: '0 0 4px', letterSpacing: '-0.4px', padding: '0 24px' }}>
                {config.nomeRestaurante || 'Delivery'}
              </h1>
              {config.descricao && (
                <p style={{ fontSize: 13, color: corTextoSec, margin: '0 0 10px', padding: '0 24px' }}>{config.descricao}</p>
              )}
              {config.estrelasAtivas && (config.estrelaValor || config.estrelaQtd) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: modoClaro ? '#f6f6f6' : 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 14px' }}>
                  <IcoStar fill={corEstrela} color={corEstrela} />
                  {config.estrelaValor && <span style={{ fontSize: 13, fontWeight: 700, color: corTextoBase }}>{Number(config.estrelaValor).toFixed(1)}</span>}
                  {config.estrelaQtd && <span style={{ fontSize: 12, color: corTextoSec }}>({config.estrelaQtd} {config.estrelaQtd === 1 ? 'avaliação' : 'avaliações'})</span>}
                </div>
              )}
              {(configDelivery.tempoEstimado || freteMinLabel || configDelivery.tipoEntrega) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', padding: '6px 20px 2px', fontSize: 13, color: corTextoSec }}>
                  {configDelivery.tipoEntrega && <span style={{ fontWeight: 700, color: corTextoBase }}>{configDelivery.tipoEntrega}</span>}
                  {configDelivery.tipoEntrega && configDelivery.tempoEstimado && <span>•</span>}
                  {configDelivery.tempoEstimado && <span>{configDelivery.tempoEstimado}</span>}
                  {freteMinLabel && <span>•</span>}
                  {freteMinLabel && <span style={{ fontWeight: 600, color: corTextoBase }}>{freteMinLabel}</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sticky search + category tabs (identical to MenuPublico) ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: fundo, borderBottom: '1px solid ' + bordaCard }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '10px 14px 0' }}>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: corTextoSec, display: 'flex' }}>
              <IcoSearch />
            </span>
            <input
              placeholder={modoIfood ? `Buscar em ${config.nomeRestaurante || 'Delivery'}` : 'O que você quer comer hoje?'}
              value={busca} onChange={e => setBusca(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
                background: modoIfood ? '#f0f0f0' : (modoClaro ? '#f4f4f4' : 'rgba(255,255,255,0.08)'),
                border: 'none', borderRadius: modoIfood ? 20 : 12,
                fontSize: 13, color: corTextoBase, outline: 'none',
              }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {categorias.map(cat => (
                <button key={cat} onClick={() => setFiltro(cat)} style={{
                  flexShrink: 0, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: filtro === cat ? 700 : 500,
                  color: filtro === cat ? destaque : corTextoSec,
                  borderBottom: filtro === cat ? '2px solid ' + destaque : '2px solid transparent',
                  transition: 'all .15s', whiteSpace: 'nowrap',
                }}>{cat}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product list ── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 40px' }}>
        {pratos.filter(p => p.disponivel !== false).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 16px', color: corTextoSec }}>
            <div style={{ margin: '0 auto 12px', width: 40 }}><IcoUtensils /></div>
            <p style={{ fontSize: 15 }}>Nenhum item no cardápio</p>
          </div>
        ) : pratosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: corTextoSec }}>
            <p style={{ fontSize: 15 }}>Nenhum item encontrado</p>
          </div>
        ) : (
          pratosPorCategoria.map(({ cat, itens }) => (
            <div key={cat} style={modoIfood ? { background: '#fff', marginBottom: 8 } : {}}>
              {/* Category header */}
              <div style={modoIfood
                ? { padding: '18px 16px 10px' }
                : { padding: '20px 16px 10px' }}>
                <h2 style={modoIfood
                  ? { fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }
                  : { fontSize: 15, fontWeight: 800, color: corTextoBase, margin: 0 }}>
                  {cat}
                </h2>
              </div>

              {layoutGrade ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 12px' }}>
                  {itens.map(prato => {
                    const preco = prato.precoVenda ?? prato.preco ?? 0
                    return (
                      <div key={prato.id} onClick={() => abrirModal(prato)}
                        style={{ borderRadius: 12, overflow: 'hidden', background: cardBg, border: '1px solid ' + bordaCard, cursor: 'pointer' }}>
                        <div style={{ width: '100%', aspectRatio: '1', background: modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          {prato.foto
                            ? <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <FotoPlaceholder />}
                        </div>
                        <div style={{ padding: '6px 8px 9px' }}>
                          <p style={{
                            fontWeight: 600, fontSize: 11, color: corTextoBase, margin: '0 0 3px', lineHeight: 1.35,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{prato.nome}</p>
                          <p style={{ fontWeight: 800, fontSize: 12, color: corPreco, margin: 0 }}>{formatarMoeda(preco)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : modoIfood ? (
                /* ── Modo iFood: lista estilo iFood ── */
                itens.map((prato, idx) => {
                  const preco = prato.precoVenda ?? prato.preco ?? 0
                  return (
                    <div key={prato.id} onClick={() => abrirModal(prato)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 16px', gap: 16, cursor: 'pointer', background: '#fff',
                      borderTop: idx === 0 ? 'none' : '1px solid #f0f0f0',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', margin: '0 0 4px', lineHeight: 1.3 }}>{prato.nome}</p>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#3d3d3d', margin: 0 }}>{formatarMoeda(preco)}</p>
                      </div>
                      {prato.foto
                        ? <div style={{ width: 88, height: 88, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        : <div style={{ width: 88, height: 88, borderRadius: 8, background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IcoUtensils />
                          </div>
                      }
                    </div>
                  )
                })
              ) : (
                /* ── Modo normal: lista padrão ── */
                itens.map(prato => {
                  const preco = prato.precoVenda ?? prato.preco ?? 0
                  return (
                    <div key={prato.id} onClick={() => abrirModal(prato)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderBottom: '1px solid ' + bordaCard, gap: 12, cursor: 'pointer',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: corTextoBase, margin: '0 0 3px', lineHeight: 1.3 }}>{prato.nome}</p>
                        {prato.descricao && (
                          <p style={{
                            fontSize: 12, color: corTextoSec, margin: '0 0 6px', lineHeight: 1.45,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{prato.descricao}</p>
                        )}
                        <p style={{ fontWeight: 800, fontSize: 14, color: corPreco, margin: 0 }}>{formatarMoeda(preco)}</p>
                      </div>
                      {prato.foto && (
                        <div style={{ width: 88, height: 88, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Cart bar (fixed bottom, iFood style) ── */}
      {totalItens > 0 && !checkoutAberto && !pratoDetalhe && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: destaque, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' }}>
          <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
          <button onClick={abrirCheckout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#fff', padding: 0 }}>
            Ver carrinho
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{formatarMoeda(subtotal)}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Detalhe do prato (full screen)
      ═══════════════════════════════════════════════════════════════════════ */}
      {pratoDetalhe && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: fundo, overflowY: 'auto',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 90,
        }}>
          {/* Foto 16/9 */}
          {pratoDetalhe.foto ? (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
              <img src={pratoDetalhe.foto} alt={pratoDetalhe.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={fecharModal} style={{
                position: 'absolute', top: 14, left: 14, width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <IcoChevronLeft />
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 16px 0' }}>
              <button onClick={fecharModal} style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600,
                color: destaque, padding: 0,
              }}>
                <IcoChevronLeft /> Voltar
              </button>
            </div>
          )}

          {/* Conteúdo */}
          <div style={{ padding: '16px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: corTextoBase, margin: '0 0 6px', lineHeight: 1.25 }}>
              {pratoDetalhe.nome}
            </h2>
            <p style={{ fontSize: 16, fontWeight: 700, color: corPreco, margin: '0 0 10px' }}>
              {formatarMoeda(pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)}
            </p>
            {pratoDetalhe.descricao && (
              <p style={{ fontSize: 14, color: corTextoSec, margin: '0 0 20px', lineHeight: 1.6 }}>
                {pratoDetalhe.descricao}
              </p>
            )}

            {/* Variações */}
            {temVariacoesModal && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Escolha uma opção <span style={{ color: '#ef4444' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pratoDetalhe.variacoes.map(v => {
                    const sel = modalVariacao?.id === v.id
                    return (
                      <label key={v.id} onClick={() => setModalVariacao(v)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                        border: '2px solid ' + (sel ? destaque : bordaCard),
                        background: sel ? (modoClaro ? `${destaque}12` : `${destaque}22`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)'),
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (sel ? destaque : corTextoSec),
                            background: sel ? destaque : 'transparent', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>{v.nome}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: corPreco }}>
                          {formatarMoeda(v.preco ?? pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Grupos informativos (não adicionais) */}
            {gruposComplemento.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {gruposComplemento.map(grupo => (
                  <div key={grupo.id} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{grupo.nome}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(grupo.itens || []).map(item => (
                        <div key={item.id} style={{
                          padding: '8px 12px', borderRadius: 10,
                          background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)',
                          border: '1px solid ' + bordaCard,
                          fontSize: 14, color: corTextoBase,
                        }}>{item.nome}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grupos adicionais (com +/- qty e precoExtra) */}
            {gruposAdicional.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {gruposAdicional.map(grupo => (
                  <div key={grupo.id} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{grupo.nome}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(grupo.itens || []).map(item => {
                        const qty = modalAdicionais[item.id] || 0
                        return (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 12,
                            background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)',
                            border: '1px solid ' + (qty > 0 ? destaque : bordaCard),
                          }}>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>{item.nome}</span>
                              {item.precoExtra > 0 && (
                                <span style={{ fontSize: 13, color: corPreco, marginLeft: 8, fontWeight: 700 }}>
                                  +{formatarMoeda(item.precoExtra)}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {qty > 0 && (
                                <>
                                  <button onClick={() => setModalAdicionais(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                    style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid ' + destaque, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IcoMinus />
                                  </button>
                                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', color: corTextoBase, fontSize: 14 }}>{qty}</span>
                                </>
                              )}
                              <button onClick={() => setModalAdicionais(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IcoPlus />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantidade */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
              <button onClick={() => setModalQtd(q => Math.max(1, q - 1))}
                style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid ' + destaque, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcoMinus size={16} />
              </button>
              <span style={{ fontSize: 20, fontWeight: 800, color: corTextoBase, minWidth: 28, textAlign: 'center' }}>{modalQtd}</span>
              <button onClick={() => setModalQtd(q => q + 1)}
                style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IcoPlus size={16} />
              </button>
            </div>
          </div>

          {/* Fixed "Adicionar ao carrinho" button */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1010, padding: '12px 20px', background: fundo, borderTop: '1px solid ' + bordaCard }}>
            <button onClick={adicionarAoCarrinho} disabled={!podeConcluirModal} style={{
              width: '100%', background: podeConcluirModal ? destaque : '#ccc', color: '#fff', border: 'none', borderRadius: 14,
              padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: podeConcluirModal ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20,
              maxWidth: 640, margin: '0 auto', boxSizing: 'border-box',
            }}>
              <span>Adicionar ao carrinho</span>
              <span>{formatarMoeda(totalModal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CHECKOUT — full screen overlay
      ═══════════════════════════════════════════════════════════════════════ */}
      {checkoutAberto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: fundo, overflowY: 'auto',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          WebkitOverflowScrolling: 'touch',
        }}>

          {/* ── Step 1: Seu pedido ── */}
          {checkoutStep === 1 && (
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 100px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid ' + bordaCard, position: 'sticky', top: 0, background: fundo, zIndex: 10 }}>
                <button onClick={() => setCheckoutAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: corTextoBase, display: 'flex', padding: 4 }}>
                  <IcoX size={22} />
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: corTextoBase, margin: 0 }}>Seu pedido</h2>
              </div>

              {/* Items */}
              <div style={{ padding: '0 20px' }}>
                {carrinho.map(item => {
                  const adExtra = (item.adicionaisEscolhidos || []).reduce((a, ad) => a + ad.precoExtra * ad.qtd, 0)
                  const subtotalItem = (item.preco + adExtra) * item.qtd
                  return (
                    <div key={item.chave} style={{ padding: '14px 0', borderBottom: '1px solid ' + bordaCard }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {item.foto && (
                          <img src={item.foto} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: corTextoBase, margin: '0 0 3px' }}>{item.nome}</p>
                          {(item.adicionaisEscolhidos || []).length > 0 && (
                            <div style={{ marginBottom: 4 }}>
                              {item.adicionaisEscolhidos.map(a => (
                                <p key={a.id} style={{ fontSize: 12, color: corTextoSec, margin: '1px 0' }}>
                                  + {a.nome}{a.qtd > 1 ? ` x${a.qtd}` : ''}{a.precoExtra > 0 ? ` (${formatarMoeda(a.precoExtra * a.qtd)})` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => alterarQtdCarrinho(item.chave, -1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid ' + destaque, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IcoMinus />
                              </button>
                              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', color: corTextoBase }}>{item.qtd}</span>
                              <button onClick={() => alterarQtdCarrinho(item.chave, 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IcoPlus />
                              </button>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: corTextoBase }}>{formatarMoeda(subtotalItem)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Subtotal */}
                <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', fontSize: 15, color: corTextoSec }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700, color: corTextoBase }}>{formatarMoeda(subtotal)}</span>
                </div>
              </div>

              {/* Fixed bottom "Continuar" */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: fundo, borderTop: '1px solid ' + bordaCard, zIndex: 10 }}>
                <button onClick={() => setCheckoutStep(2)} style={{
                  width: '100%', background: destaque, color: '#fff', border: 'none', borderRadius: 14,
                  padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  maxWidth: 640, display: 'block', margin: '0 auto',
                }}>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Entrega e pagamento ── */}
          {checkoutStep === 2 && (
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 120px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid ' + bordaCard, position: 'sticky', top: 0, background: fundo, zIndex: 10 }}>
                <button onClick={() => setCheckoutStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: corTextoBase, display: 'flex', padding: 4 }}>
                  <IcoChevronLeft />
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: corTextoBase, margin: 0 }}>Entrega e pagamento</h2>
              </div>

              <div style={{ padding: '20px 20px 0' }}>
                {/* Toggle entrega / retirar */}
                <div style={{ display: 'flex', background: modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.08)', borderRadius: 30, padding: 4, marginBottom: 24 }}>
                  {['entrega', 'retirar'].map(tipo => (
                    <button key={tipo} onClick={() => setTipoEntrega(tipo)} style={{
                      flex: 1, padding: '9px 0', borderRadius: 26, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                      background: tipoEntrega === tipo ? destaque : 'transparent',
                      color: tipoEntrega === tipo ? '#fff' : corTextoSec,
                      transition: 'all .2s',
                    }}>
                      {tipo === 'entrega' ? 'Entrega' : 'Retirar'}
                    </button>
                  ))}
                </div>

                {/* Endereço (apenas se entrega) */}
                {tipoEntrega === 'entrega' && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, margin: '0 0 10px' }}>Endereço de entrega</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <select value={bairroId} onChange={e => setBairroId(e.target.value)} style={{
                          width: '100%', padding: '11px 36px 11px 12px', borderRadius: 12,
                          border: '1.5px solid ' + (erros.bairro ? '#ef4444' : bordaCard),
                          background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: bairroId ? corTextoBase : corTextoSec,
                          fontSize: 14, boxSizing: 'border-box', outline: 'none', appearance: 'none',
                        }}>
                          <option value="">Selecione o bairro *</option>
                          {bairrosAtivos.map(b => (
                            <option key={b.id} value={b.id}>{b.nome} — {b.frete > 0 ? formatarMoeda(b.frete) : 'Grátis'}</option>
                          ))}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: corTextoSec, pointerEvents: 'none', display: 'flex' }}>
                          <IcoChevronDown />
                        </span>
                        {erros.bairro && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.bairro}</p>}
                      </div>
                      <div>
                        <input placeholder="Rua, número *" value={endereco} onChange={e => setEndereco(e.target.value)} style={{
                          width: '100%', padding: '11px 12px', borderRadius: 12,
                          border: '1.5px solid ' + (erros.endereco ? '#ef4444' : bordaCard),
                          background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                          fontSize: 14, boxSizing: 'border-box', outline: 'none',
                        }} />
                        {erros.endereco && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.endereco}</p>}
                      </div>
                      <input placeholder="Complemento (apto, bloco...)" value={complemento} onChange={e => setComplemento(e.target.value)} style={{
                        width: '100%', padding: '11px 12px', borderRadius: 12,
                        border: '1px solid ' + bordaCard, background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                        fontSize: 14, boxSizing: 'border-box', outline: 'none',
                      }} />
                    </div>
                  </div>
                )}

                {/* Dados do cliente */}
                <p style={{ fontSize: 13, fontWeight: 700, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Seus dados</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div>
                    <input placeholder="Nome completo *" value={nome} onChange={e => setNome(e.target.value)} style={{
                      width: '100%', padding: '11px 12px', borderRadius: 12,
                      border: '1.5px solid ' + (erros.nome ? '#ef4444' : bordaCard),
                      background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                      fontSize: 14, boxSizing: 'border-box', outline: 'none',
                    }} />
                    {erros.nome && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.nome}</p>}
                  </div>
                  <div>
                    <input placeholder="Telefone / WhatsApp *" value={telefone} onChange={e => setTelefone(e.target.value)} type="tel" style={{
                      width: '100%', padding: '11px 12px', borderRadius: 12,
                      border: '1.5px solid ' + (erros.telefone ? '#ef4444' : bordaCard),
                      background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                      fontSize: 14, boxSizing: 'border-box', outline: 'none',
                    }} />
                    {erros.telefone && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{erros.telefone}</p>}
                  </div>
                </div>

                {/* Formas de pagamento */}
                <p style={{ fontSize: 13, fontWeight: 700, color: corTextoSec, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Forma de pagamento</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(configDelivery.formasPagamento || ['dinheiro', 'pix', 'cartao']).map(fp => (
                    <button key={fp} onClick={() => setPagamento(fp)} style={{
                      flex: 1, minWidth: 90, padding: '11px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      border: '2px solid ' + (pagamento === fp ? destaque : bordaCard),
                      background: pagamento === fp ? (modoClaro ? `${destaque}14` : `${destaque}28`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.05)'),
                      color: pagamento === fp ? destaque : corTextoSec, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    }}>
                      {ICONE_PGTO[fp] || null}
                      {LABEL_PGTO[fp] || fp}
                    </button>
                  ))}
                </div>
                {erros.pagamento && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px' }}>{erros.pagamento}</p>}

                {/* Troco */}
                {pagamento === 'dinheiro' && (
                  <div style={{ marginBottom: 16 }}>
                    <input placeholder="Troco para quanto? (opcional)" value={troco} onChange={e => setTroco(e.target.value)} style={{
                      width: '100%', padding: '11px 12px', borderRadius: 12,
                      border: '1px solid ' + bordaCard, background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                      fontSize: 14, boxSizing: 'border-box', outline: 'none',
                    }} />
                  </div>
                )}

                {/* Observações */}
                <textarea placeholder="Observações sobre o pedido (opcional)" value={obs} onChange={e => setObs(e.target.value)} rows={2}
                  style={{
                    width: '100%', padding: '11px 12px', borderRadius: 12, marginBottom: 20,
                    border: '1px solid ' + bordaCard, background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase,
                    fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  }} />

                {/* Resumo total */}
                <div style={{ borderTop: '1px solid ' + bordaCard, paddingTop: 14, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: corTextoSec, marginBottom: 6 }}>
                    <span>Subtotal</span><span>{formatarMoeda(subtotal)}</span>
                  </div>
                  {tipoEntrega === 'entrega' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: corTextoSec, marginBottom: 10 }}>
                      <span>Frete{bairroSelecionado ? ` (${bairroSelecionado.nome})` : ''}</span>
                      <span>{freteValor > 0 ? formatarMoeda(freteValor) : (bairroId ? 'Grátis' : '—')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: corTextoBase }}>
                    <span>Total</span>
                    <span style={{ color: destaque }}>{formatarMoeda(total)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed bottom "Enviar via WhatsApp" */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: fundo, borderTop: '1px solid ' + bordaCard, zIndex: 10 }}>
                <button onClick={enviarPedido} style={{
                  width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 14,
                  padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  maxWidth: 640, margin: '0 auto', boxSizing: 'border-box',
                }}>
                  <IcoWhatsapp />
                  Enviar pedido via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUCCESS SCREEN
      ═══════════════════════════════════════════════════════════════════════ */}
      {pedidoEnviado && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100, background: fundo,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, fontFamily: "'Segoe UI', system-ui, sans-serif", textAlign: 'center',
        }}>
          <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: corTextoBase, margin: '0 0 12px' }}>Pedido enviado!</h2>
          <p style={{ fontSize: 15, color: corTextoSec, maxWidth: 320, margin: '0 0 32px', lineHeight: 1.6 }}>
            Seu pedido foi enviado pelo WhatsApp. Aguarde a confirmação do estabelecimento.
          </p>
          <button onClick={resetarPedido} style={{
            background: destaque, color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 32px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}>
            Fazer novo pedido
          </button>
        </div>
      )}
    </div>
  )
}
