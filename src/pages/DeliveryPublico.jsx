import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// ─── helpers ────────────────────────────────────────────────────────────────

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
  const [pratos, setPratos] = useState([])
  const [config, setConfig] = useState({})
  const [configDelivery, setConfigDelivery] = useState({})
  const [pagamentosConfig, setPagamentosConfig] = useState({})
  const [userId, setUserId] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!slug) { setCarregando(false); return }

    // Cache instantâneo
    try {
      const raw = localStorage.getItem(`delivery_cache_${slug}`)
      if (raw) {
        const { t, uid, prts, cfg, cd, pgto } = JSON.parse(raw)
        if (Date.now() - t < 10 * 60 * 1000) {
          setUserId(uid); setPratos(prts); setConfig(cfg); setConfigDelivery(cd); if (pgto) setPagamentosConfig(pgto); setCarregando(false)
        }
      }
    } catch {}

    async function carregar() {
      try {
        const { data: slugRow, error: errSlug } = await supabase
          .from('delivery_slugs')
          .select('user_id')
          .eq('slug', slug.toLowerCase())
          .maybeSingle()
        if (errSlug) throw errSlug
        if (!slugRow) { setCarregando(false); return }
        setUserId(slugRow.user_id)
        const [{ data: prtsData }, { data: cfgData }, { data: cdData }, { data: pgtoData }] = await Promise.all([
          supabase.from('pratos').select('*').eq('user_id', slugRow.user_id),
          supabase.from('cardapio_config').select('config').eq('user_id', slugRow.user_id).maybeSingle(),
          supabase.from('config_delivery').select('*').eq('user_id', slugRow.user_id).maybeSingle(),
          supabase.from('pagamentos_config').select('config').eq('user_id', slugRow.user_id).maybeSingle().then(r => r, () => ({ data: null })),
        ])
        const prts = prtsData ? prtsData.map(row => ({
          id: row.id, nome: row.nome,
          precoVenda: Number(row.preco_venda || 0),
          categoria: row.categoria || '',
          emDestaque: row.em_destaque || false,
          maisPedido: row.mais_pedido || false,
          foto: row.foto || null,
          ingredientes: row.ingredientes || [],
          grupos: row.grupos || [],
          variacoes: row.variacoes || [],
          tipo: row.tipo || ((row.variacoes?.length > 0) ? 'variacao' : 'normal'),
          meiaAMeia: row.meia_a_meia || false,
          calcVariacao: row.calc_variacao || 'maior',
          maxSabores: row.max_sabores || (row.meia_a_meia ? 2 : 1),
          bordas: row.bordas || [],
          tamanhos: row.tamanhos || [],
          labelSabores: row.label_sabores || null,
          labelBordas: row.label_bordas || null,
          visivelIndividual: row.visivel_individual !== false,
          disponivel: row.disponivel !== false,
        })) : []
        const cfg = cfgData?.config || {}
        const cd = cdData ? {
          ativo: cdData.ativo || false,
          slugDelivery: cdData.slug_delivery || '',
          cidade: cdData.cidade || '',
          bairros: cdData.bairros || [],
          pedidoMinimo: Number(cdData.pedido_minimo || 0),
          tempoEstimado: cdData.tempo_estimado || '',
          tipoEntrega: cdData.tipo_entrega || 'Padrão',
          formasPagamento: cdData.formas_pagamento || ['dinheiro', 'pix', 'cartao'],
          telefone: cdData.telefone || '',
          mensagemIntro: cdData.mensagem_intro || '',
          modoIfood: cdData.modo_ifood || false,
          corDestaqueIfood: cdData.cor_destaque_ifood || '#ea1d2c',
          cupons: cdData.cupons || [],
          produtosSugeridos: cdData.produtos_sugeridos || [],
        } : {}
        const pgto = pgtoData?.config || {}
        setPratos(prts); setConfig(cfg); setConfigDelivery(cd); setPagamentosConfig(pgto)
        try { localStorage.setItem(`delivery_cache_${slug}`, JSON.stringify({ t: Date.now(), uid: slugRow.user_id, prts, cfg, cd, pgto })) } catch {}
      } catch (e) {
        console.error('[DeliveryPublico] erro ao carregar:', e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [slug])

  // ── visual config ──────────────────────────────────────────────────────────
  const modoIfood = !!configDelivery.modoIfood
  const destaque = modoIfood ? (configDelivery.corDestaqueIfood || '#ea1d2c') : (config.corDestaque || '#16a34a')
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

  // ── formas de pagamento ativas (baseadas em pagamentosConfig) ─────────────
  const FORMAS_DEF = [
    { key: 'dinheiro',    label: 'Dinheiro',          icone: <IcoBanknote /> },
    { key: 'pix',         label: 'PIX',               icone: <IcoQr /> },
    { key: 'pixWhatsapp', label: 'PIX via WhatsApp',  icone: <IcoWhatsapp /> },
    { key: 'cartaoCredito', label: 'Crédito',         icone: <IcoCard /> },
    { key: 'cartaoDebito',  label: 'Débito',          icone: <IcoCard /> },
  ]
  function isFormaAtiva(key) {
    const cfg = pagamentosConfig
    if (!cfg[key]) return false
    if (key === 'pix') {
      const temMP      = cfg.mercadoPagoAtivo && !!cfg.mercadoPagoAccessToken
      const temEfi     = cfg.efiAtivo && !!cfg.efiClientId && !!cfg.efiClientSecret
      const temOpenPix = cfg.openPixAtivo && !!cfg.openPixAppId && !!cfg.openPixChave
      return !!(temMP || temEfi || temOpenPix)
    }
    if (key === 'pixWhatsapp') return !!(cfg.pixWhatsapp && cfg.pixWhatsappNumero)
    return true
  }
  // Se pagamentosConfig ainda não carregou (vazio), cai no fallback antigo
  const temNovoPagamento = Object.keys(pagamentosConfig).length > 0
  const formasAtivasRaw = temNovoPagamento
    ? FORMAS_DEF.filter(f => isFormaAtiva(f.key))
    : (configDelivery.formasPagamento || ['dinheiro', 'pix', 'cartao']).map(k => ({
        key: k,
        label: { dinheiro: 'Dinheiro', pix: 'PIX', cartao: 'Cartão' }[k] || k,
        icone: { dinheiro: <IcoBanknote />, pix: <IcoQr />, cartao: <IcoCard /> }[k] || null,
      }))
  // Agrupa cartaoCredito + cartaoDebito em um único botão "Cartão"
  const temCredito = formasAtivasRaw.some(f => f.key === 'cartaoCredito')
  const temDebito  = formasAtivasRaw.some(f => f.key === 'cartaoDebito')
  const formasAtivas = [
    ...formasAtivasRaw.filter(f => f.key !== 'cartaoCredito' && f.key !== 'cartaoDebito'),
    ...(temCredito || temDebito ? [{ key: 'cartao', label: 'Cartão', icone: <IcoCard /> }] : []),
  ]

  // frete mínimo dos bairros ativos
  const bairrosParaFrete = (configDelivery.bairros || []).filter(b => b.ativo)
  const freteMin = bairrosParaFrete.length > 0 ? Math.min(...bairrosParaFrete.map(b => b.frete || 0)) : null
  const freteMinLabel = freteMin === null ? null : freteMin === 0 ? 'Grátis' : formatarMoeda(freteMin)

  // ── catalog state ──────────────────────────────────────────────────────────
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')

  // ── modal produto ──────────────────────────────────────────────────────────
  const [pratoDetalhe, setPratoDetalhe] = useState(null)
  const [modalTamanho, setModalTamanho] = useState(null)     // tamanho selecionado (quando tem tamanhos)
  const [modalVariacoes, setModalVariacoes] = useState([])   // variacoes selecionadas (array)
  const [modalBorda, setModalBorda] = useState(null)         // borda selecionada ou null
  const [modalAdicionais, setModalAdicionais] = useState({}) // { itemId: qty }
  const [modalComplementos, setModalComplementos] = useState({}) // { groupId: itemId }
  const [modalQtd, setModalQtd] = useState(1)

  // ── carrinho ───────────────────────────────────────────────────────────────
  const [carrinho, setCarrinho] = useState([])

  // ── cupom ──────────────────────────────────────────────────────────────────
  const [cupomInput, setCupomInput] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState(null) // { codigo, tipo, valor }
  const [cupomErro, setCupomErro] = useState('')

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
  const [bandeira, setBandeira] = useState('')
  const [troco, setTroco] = useState('')
  const [obs, setObs] = useState('')
  const [erros, setErros] = useState({})
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  // ── guard: carregando / slug não encontrado / delivery inativo ───────────────
  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 16 }}>Carregando...</div>
      </div>
    )
  }

  if (!userId || !configDelivery.ativo) {
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
  const todasCats = [...new Set(pratos.filter(p => p.disponivel !== false && p.visivelIndividual !== false).map(p => p.categoria).filter(Boolean))]
  const ordemSalva = config.ordemCategorias || []
  const catsOrdenadas = [
    ...ordemSalva.filter(c => todasCats.includes(c)),
    ...todasCats.filter(c => !ordemSalva.includes(c)),
  ]
  const categorias = ['Todas', ...catsOrdenadas]

  const pratosFiltrados = pratos
    .filter(p => p.disponivel !== false && p.visivelIndividual !== false)
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

  // cupom desconto
  const descontoCupom = cupomAplicado
    ? cupomAplicado.tipo === 'percent'
      ? subtotal * (cupomAplicado.valor / 100)
      : Math.min(cupomAplicado.valor, subtotal)
    : 0
  const total = subtotal - descontoCupom + freteValor

  // produtos sugeridos (configDelivery.produtosSugeridos = array de pratoIds)
  const sugeridos = (configDelivery.produtosSugeridos || [])
    .map(id => pratos.find(p => p.id === id && p.disponivel !== false && p.visivelIndividual !== false))
    .filter(Boolean)

  // ── modal helpers ──────────────────────────────────────────────────────────
  function abrirModal(prato) {
    setPratoDetalhe(prato)
    setModalTamanho(null)
    setModalVariacoes([])
    setModalBorda(null)
    setModalAdicionais({})
    setModalComplementos({})
    setModalQtd(1)
  }

  function fecharModal() {
    setPratoDetalhe(null)
    setModalTamanho(null)
    setModalBorda(null)
  }

  function calcularTotalModal() {
    if (!pratoDetalhe) return 0
    let precoBase
    const temTamanhos = (pratoDetalhe.tamanhos || []).length > 0
    if (temTamanhos) {
      // Com tamanhos: preço é fixo pelo tamanho
      precoBase = modalTamanho?.preco ?? pratoDetalhe.precoVenda ?? 0
    } else if (modalVariacoes.length > 0) {
      const precos = modalVariacoes.map(v => v.preco ?? pratoDetalhe.precoVenda ?? 0)
      precoBase = pratoDetalhe.calcVariacao === 'media'
        ? precos.reduce((a, b) => a + b, 0) / precos.length
        : Math.max(...precos)
    } else {
      precoBase = pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0
    }
    const extraAdicionais = Object.entries(modalAdicionais).reduce((sum, [itemId, qty]) => {
      if (qty <= 0) return sum
      for (const g of (pratoDetalhe.grupos || [])) {
        if (g.categoria === 'adicional') {
          const item = (g.itens || []).find(it => it.id === itemId)
          if (item) return sum + (item.precoExtra || 0) * qty
        }
      }
      return sum
    }, 0)
    return (precoBase + extraAdicionais + (modalBorda?.precoExtra || 0)) * modalQtd
  }

  function adicionarAoCarrinho() {
    if (!pratoDetalhe) return
    const temTamanhos = (pratoDetalhe.tamanhos || []).length > 0
    if (temTamanhos && !modalTamanho) return // tamanho obrigatório

    // variacoes e maxSabores dependem do tamanho (se tiver)
    const variacoesDisponiveis = temTamanhos ? (modalTamanho?.variacoes || []) : (pratoDetalhe.variacoes || [])
    const maxSabores = temTamanhos ? (modalTamanho?.maxSabores || 1) : (pratoDetalhe.maxSabores || (pratoDetalhe.meiaAMeia ? 2 : 1))
    const temVariacoes = variacoesDisponiveis.length > 0
    if (temVariacoes && modalVariacoes.length < maxSabores) return

    let preco
    if (temTamanhos) {
      preco = modalTamanho?.preco ?? pratoDetalhe.precoVenda ?? 0
    } else if (modalVariacoes.length > 0) {
      const precos = modalVariacoes.map(v => v.preco ?? pratoDetalhe.precoVenda ?? 0)
      preco = pratoDetalhe.calcVariacao === 'media'
        ? precos.reduce((a, b) => a + b, 0) / precos.length
        : Math.max(...precos)
    } else {
      preco = pratoDetalhe.precoVenda ?? pratoDetalhe.preco ?? 0
    }

    const adicionaisEscolhidos = []
    for (const g of (pratoDetalhe.grupos || [])) {
      for (const item of (g.itens || [])) {
        const qty = modalAdicionais[item.id] || 0
        if (qty > 0) {
          adicionaisEscolhidos.push({
            id: item.id,
            nome: item.nome,
            grupoNome: g.nome,
            precoExtra: g.categoria === 'adicional' ? (item.precoExtra || 0) : 0,
            qtd: qty,
          })
        }
      }
    }

    const partesSabores = modalVariacoes.length > 0 ? `${modalVariacoes.map(v => v.nome).join(' + ')}` : ''
    const parteTamanho = modalTamanho ? modalTamanho.nome : ''
    const sufixo = [parteTamanho, partesSabores].filter(Boolean).join(' · ')
    const nomeCompleto = sufixo ? `${pratoDetalhe.nome} (${sufixo})` : pratoDetalhe.nome

    const novoItem = {
      chave: gerarChave(),
      pratoId: pratoDetalhe.id,
      nome: nomeCompleto,
      preco: preco + (modalBorda?.precoExtra || 0),
      qtd: modalQtd,
      foto: pratoDetalhe.foto || null,
      tamanho: modalTamanho || null,
      variacoes: modalVariacoes.length > 0 ? modalVariacoes : null,
      borda: modalBorda || null,
      adicionaisEscolhidos,
      obs: '',
    }

    setCarrinho(prev => [...prev, novoItem])
    fecharModal()
  }

  function alterarQtdCarrinho(chave, delta) {
    setCarrinho(prev => {
      const novo = prev.map(i => i.chave === chave ? { ...i, qtd: Math.max(0, i.qtd + delta) } : i)
        .filter(i => i.qtd > 0)
      return novo
    })
  }

  function aplicarCupom() {
    const cupons = configDelivery.cupons || []
    const code = cupomInput.trim().toUpperCase()
    const cupom = cupons.find(c => c.codigo.toUpperCase() === code)
    if (!cupom) { setCupomErro('Cupom inválido'); return }
    if (cupom.minimoCompra && subtotal < cupom.minimoCompra) {
      setCupomErro(`Mínimo ${formatarMoeda(cupom.minimoCompra)} para usar este cupom`); return
    }
    setCupomAplicado(cupom)
    setCupomErro('')
  }

  // ── checkout ───────────────────────────────────────────────────────────────
  function abrirCheckout() {
    setCheckoutStep(1)
    setCheckoutAberto(true)
    setCupomInput('')
    setCupomAplicado(null)
    setCupomErro('')
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

  async function enviarPedido() {
    if (!validarStep2()) return

    const linhasItens = carrinho.map(i => {
      const adExtra = (i.adicionaisEscolhidos || []).reduce((a, ad) => a + ad.precoExtra * ad.qtd, 0)
      const precoTotal = (i.preco + adExtra) * i.qtd
      let linha = `• ${i.qtd}x ${i.nome} — ${formatarMoeda(precoTotal)}`
      if (i.adicionaisEscolhidos && i.adicionaisEscolhidos.length > 0) {
        const ads = i.adicionaisEscolhidos.map(a => {
          let txt = `  + ${a.nome}${a.qtd > 1 ? ` x${a.qtd}` : ''}`
          if (a.precoExtra > 0) txt += ` (+${formatarMoeda(a.precoExtra * a.qtd)})`
          return txt
        }).join('\n')
        linha += '\n' + ads
      }
      return linha
    }).join('\n')

    const labelPgto = { dinheiro: 'Dinheiro', pix: 'PIX', pixWhatsapp: 'PIX via WhatsApp', cartaoCredito: 'Cartão de Crédito', cartaoDebito: 'Cartão de Débito', cartao: 'Cartão' }
    const labelBandeira = bandeira ? ` (${bandeira})` : ''
    const labelPagamento = `${labelPgto[pagamento] || pagamento}${labelBandeira}`

    const partes = [
      configDelivery.mensagemIntro || 'Olá! Gostaria de fazer um pedido:',
      '',
      `👤 *${nome}*`,
      `📞 ${telefone}`,
      '',
      '📋 *ITENS DO PEDIDO*',
      linhasItens,
      '',
    ]

    if (tipoEntrega === 'entrega') {
      partes.push('📍 *LOCAL DE ENTREGA*')
      if (bairroSelecionado?.nome) partes.push(`Bairro: ${bairroSelecionado.nome}`)
      partes.push(`Endereço: ${endereco}`)
      if (complemento) partes.push(`Complemento: ${complemento}`)
    } else {
      partes.push('🏪 *RETIRADA NO LOCAL*')
    }

    partes.push('')
    partes.push(`💳 *Pagamento:* ${labelPagamento}`)
    if (pagamento === 'dinheiro' && troco) {
      partes.push(`   Troco para: ${troco}`)
    }
    partes.push('')

    if (subtotal !== total || descontoCupom > 0 || freteValor > 0) {
      partes.push(`Subtotal: ${formatarMoeda(subtotal)}`)
      if (descontoCupom > 0) partes.push(`Cupom (${cupomAplicado.codigo}): -${formatarMoeda(descontoCupom)}`)
      if (tipoEntrega === 'entrega') partes.push(`Frete: ${freteValor > 0 ? formatarMoeda(freteValor) : 'Grátis'}`)
    }
    partes.push(`💰 *Total: ${formatarMoeda(total)}*`)

    if (obs) {
      partes.push(`\n📝 Obs: ${obs}`)
    }

    const mensagem = partes.filter(l => l !== null && l !== undefined).join('\n')

    // ── Registrar pedido no banco ──────────────────────────────────────────
    if (userId) {
      try {
        const agora = new Date().toISOString()
        const agoraBr = new Date()
        const dataHoje = agoraBr.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-')
        const horaAgora = agoraBr.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false })
        const enderecoEntrega = tipoEntrega === 'entrega'
          ? `${bairroSelecionado?.nome ? bairroSelecionado.nome + ' - ' : ''}${endereco}${complemento ? ', ' + complemento : ''}`
          : 'Retirada no local'
        const itensPedido = carrinho.map(i => ({
          pratoId: i.pratoId,
          nome: i.nome,
          quantidade: i.qtd,
          precoUnit: i.preco,
          opcoes: (i.adicionaisEscolhidos || []).map(a => ({ nome: a.nome, precoExtra: a.precoExtra || 0, qtd: a.qtd })),
          variacoes: i.variacoes || null,
        }))
        const statusInicial = ['dinheiro', 'cartao', 'maquininha'].includes(pagamento) ? 'novo' : 'pendente'
        await supabase.from('pedidos').insert({
          user_id: userId,
          data: dataHoje,
          hora: horaAgora,
          itens: itensPedido,
          obs: obs || null,
          status: statusInicial,
          pago: false,
          cancelado: false,
          canal: 'delivery',
          forma_pagamento: pagamento || null,
          cliente_nome: nome,
          cliente_telefone: telefone,
          endereco_entrega: enderecoEntrega,
          // sempre inclui 'novo' para timer funcionar no caixa/cozinha
          timestamps: { novo: agora, [statusInicial]: agora },
        })
      } catch (e) {
        console.error('[DeliveryPublico] erro ao registrar pedido:', e)
      }
    }

    // ── Abrir WhatsApp ─────────────────────────────────────────────────────
    const tel = configDelivery.telefone?.replace(/\D/g, '')
    window.open(`https://wa.me/${tel ? '55' + tel : ''}?text=${encodeURIComponent(mensagem)}`, '_blank')

    // Se PIX WhatsApp: abre segundo zap com mensagem de pagamento
    if (pagamento === 'pixWhatsapp' && pagamentosConfig.pixWhatsappNumero) {
      const msgPix = pagamentosConfig.pixWhatsappMensagem || 'Olá! Quero pagar meu pedido via PIX.'
      const numPix = pagamentosConfig.pixWhatsappNumero.replace(/\D/g, '')
      setTimeout(() => {
        window.open(`https://wa.me/55${numPix}?text=${encodeURIComponent(msgPix)}`, '_blank')
      }, 800)
    }

    setPedidoEnviado(true)
    setCheckoutAberto(false)
    setCarrinho([])
    // reset form
    setNome(''); setTelefone(''); setBairroId(''); setEndereco(''); setComplemento('')
    setPagamento(''); setBandeira(''); setTroco(''); setObs(''); setErros({})
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
  const temTamanhosModal = pratoDetalhe && (pratoDetalhe.tamanhos || []).length > 0
  // variacoes e maxSabores dependem do tamanho selecionado (se tiver) ou do produto
  const variacoesDoModal = temTamanhosModal ? (modalTamanho?.variacoes || []) : (pratoDetalhe?.variacoes || [])
  const temVariacoesModal = variacoesDoModal.length > 0
  const maxSaboresModal = temTamanhosModal
    ? (modalTamanho?.maxSabores || 1)
    : (pratoDetalhe?.maxSabores || (pratoDetalhe?.meiaAMeia ? 2 : 1))
  const podeConcluirModal =
    (!temTamanhosModal || modalTamanho) &&
    (!temVariacoesModal || (maxSaboresModal === 1 ? modalVariacoes.length >= 1 : modalVariacoes.length === maxSaboresModal))
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
              <p style={{ fontSize: 13, color: '#717171', margin: '8px 0 4px' }}>Mais opções disponíveis na sacola</p>
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

      {/* ── Destaques (iFood mode only — categoria "Destaques" ou itens com emDestaque) ── */}
      {modoIfood && (() => {
        const catNome = catsOrdenadas.find(c => c.toLowerCase() === 'destaques')
        const itensDestaques = catNome
          ? pratos.filter(p => p.disponivel !== false && p.visivelIndividual !== false && p.categoria === catNome && p.nome.toLowerCase().includes(busca.toLowerCase()))
          : pratos.filter(p => p.disponivel !== false && p.visivelIndividual !== false && p.emDestaque && p.nome.toLowerCase().includes(busca.toLowerCase()))
        if (itensDestaques.length === 0) return null
        return (
          <div style={{ background: '#fff', marginBottom: 8, maxWidth: 640, margin: '0 auto 8px' }}>
            <div style={{ padding: '18px 16px 10px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Destaques</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 12px 16px' }}>
              {itensDestaques.map(prato => {
                const preco = prato.precoVenda ?? prato.preco ?? 0
                return (
                  <div key={prato.id} onClick={() => abrirModal(prato)} style={{ cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#f0f0f0' }}>
                      {prato.foto
                        ? <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <FotoPlaceholder />}
                      {prato.maisPedido && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.62)', padding: '4px 7px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Mais pedido</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 13, color: '#1a1a1a', margin: '6px 0 1px' }}>{formatarMoeda(preco)}</p>
                    <p style={{ fontSize: 11, color: '#717171', margin: 0, lineHeight: 1.3 }}>{prato.nome}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Product list ── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 40px' }}>
        {pratos.filter(p => p.disponivel !== false && p.visivelIndividual !== false).length === 0 ? (
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
                        <p style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', margin: '0 0 4px', lineHeight: 1.3 }}>{prato.nome}</p>
                        {prato.descricao && (
                          <p style={{ fontSize: 12, color: '#717171', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prato.descricao}</p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>{formatarMoeda(preco)}</p>
                          {prato.maisPedido && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: destaque, borderRadius: 4, padding: '2px 6px' }}>Mais pedido</span>
                          )}
                        </div>
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

            {/* Tamanhos */}
            {temTamanhosModal && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Tamanho <span style={{ color: '#ef4444' }}>*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(pratoDetalhe.tamanhos || []).map(t => {
                    const sel = modalTamanho?.id === t.id
                    return (
                      <label key={t.id} onClick={() => { setModalTamanho(t); setModalVariacoes([]) }} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                        border: '2px solid ' + (sel ? destaque : bordaCard),
                        background: sel ? (modoClaro ? `${destaque}12` : `${destaque}22`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)'),
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (sel ? destaque : corTextoSec), background: sel ? destaque : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>{t.nome}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: corPreco }}>{formatarMoeda(t.preco || 0)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Variações / Sabores */}
            {temVariacoesModal && (!temTamanhosModal || modalTamanho) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {pratoDetalhe.labelSabores || (maxSaboresModal === 1 ? 'Escolha uma opção' : maxSaboresModal === 2 ? 'Escolha 2 sabores (½+½)' : 'Escolha 3 sabores (⅓+⅓+⅓)')}
                    <span style={{ color: '#ef4444' }}> *</span>
                  </p>
                  {maxSaboresModal > 1 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: modalVariacoes.length === maxSaboresModal ? '#16a34a' : destaque, background: modalVariacoes.length === maxSaboresModal ? 'rgba(22,163,74,0.1)' : `${destaque}18`, padding: '2px 8px', borderRadius: 20 }}>
                      {modalVariacoes.length}/{maxSaboresModal}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {variacoesDoModal.map(v => {
                    const sel = modalVariacoes.some(x => x.id === v.id)
                    const bloqueado = !sel && modalVariacoes.length >= maxSaboresModal
                    return (
                      <label key={v.id} onClick={() => {
                        if (maxSaboresModal === 1) {
                          setModalVariacoes([v])
                        } else if (sel) {
                          setModalVariacoes(prev => prev.filter(x => x.id !== v.id))
                        } else if (!bloqueado) {
                          setModalVariacoes(prev => [...prev, v])
                        }
                      }} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12,
                        cursor: bloqueado ? 'not-allowed' : 'pointer',
                        border: '2px solid ' + (sel ? destaque : bordaCard),
                        background: sel ? (modoClaro ? `${destaque}12` : `${destaque}22`) : bloqueado ? (modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.03)') : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)'),
                        opacity: bloqueado ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 18, height: 18,
                            borderRadius: maxSaboresModal === 1 ? '50%' : 4,
                            border: '2px solid ' + (sel ? destaque : corTextoSec),
                            background: sel ? destaque : 'transparent', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {sel && (maxSaboresModal === 1
                              ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                              : <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
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

            {/* Borda (só aparece em produtos variação que têm bordas cadastradas) */}
            {temVariacoesModal && (pratoDetalhe.bordas || []).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {pratoDetalhe.labelBordas || '🍕 Borda'} <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'none', color: corTextoSec }}>(opcional)</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Opção "Sem borda" */}
                  <label onClick={() => setModalBorda(null)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    border: '2px solid ' + (modalBorda === null ? destaque : bordaCard),
                    background: modalBorda === null ? (modoClaro ? `${destaque}12` : `${destaque}22`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)'),
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: '2px solid ' + (modalBorda === null ? destaque : corTextoSec),
                        background: modalBorda === null ? destaque : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {modalBorda === null && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>Sem borda</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: corTextoSec }}>—</span>
                  </label>
                  {(pratoDetalhe.bordas || []).map((b, i) => {
                    const sel = modalBorda?.nome === b.nome
                    return (
                      <label key={i} onClick={() => setModalBorda(b)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                        border: '2px solid ' + (sel ? destaque : bordaCard),
                        background: sel ? (modoClaro ? `${destaque}12` : `${destaque}22`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)'),
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: '2px solid ' + (sel ? destaque : corTextoSec),
                            background: sel ? destaque : 'transparent', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>{b.nome}</span>
                        </div>
                        {b.precoExtra > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: corPreco }}>+{formatarMoeda(b.precoExtra)}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Grupos de complemento — com +/- igual adicionais */}
            {gruposComplemento.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {gruposComplemento.map(grupo => (
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
                            <span style={{ fontSize: 14, fontWeight: 600, color: corTextoBase }}>{item.nome}</span>
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

          {/* ── Step 1: Sacola ── */}
          {checkoutStep === 1 && (
            <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 100 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid ' + bordaCard, position: 'sticky', top: 0, background: fundo, zIndex: 10 }}>
                <button onClick={() => setCheckoutAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: corTextoBase, display: 'flex', padding: 4 }}>
                  <IcoChevronLeft size={22} />
                </button>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: corTextoBase, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Sacola</h2>
                <button onClick={() => { setCarrinho([]); setCheckoutAberto(false) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: destaque, padding: 4 }}>
                  Limpar
                </button>
              </div>

              {/* Restaurante + itens */}
              <div style={{ padding: '12px 0' }}>
                {/* Nome do restaurante */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 20px 10px' }}>
                  {config.logo
                    ? <img src={config.logo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 34, height: 34, borderRadius: '50%', background: destaque, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>{(config.nomeRestaurante || 'R')[0]}</div>
                  }
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: corTextoBase, margin: 0 }}>{config.nomeRestaurante || 'Restaurante'}</p>
                    <button onClick={() => setCheckoutAberto(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: destaque, padding: 0 }}>
                      Adicionar mais itens
                    </button>
                  </div>
                </div>

                {/* Items */}
                {carrinho.map(item => {
                  const adExtra = (item.adicionaisEscolhidos || []).reduce((a, ad) => a + ad.precoExtra * ad.qtd, 0)
                  const subtotalItem = (item.preco + adExtra) * item.qtd
                  return (
                    <div key={item.chave} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid ' + bordaCard }}>
                      {/* Foto ou placeholder */}
                      {item.foto
                        ? <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={item.foto} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                            <button onClick={() => abrirModal(pratos.find(p => p.id === item.pratoId) || { id: item.pratoId, nome: item.nome, foto: item.foto, precoVenda: item.preco })}
                              style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: destaque, border: '2px solid ' + fundo, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                              ✏
                            </button>
                          </div>
                        : null
                      }
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: corTextoBase, margin: '0 0 1px' }}>{item.nome}</p>
                        {(item.adicionaisEscolhidos || []).length > 0 && (
                          <p style={{ fontSize: 11, color: corTextoSec, margin: '0 0 3px' }}>
                            {item.adicionaisEscolhidos.map(a => a.nome + (a.qtd > 1 ? ` x${a.qtd}` : '')).join(', ')}
                          </p>
                        )}
                        <p style={{ fontSize: 13, fontWeight: 700, color: corPreco, margin: 0 }}>{formatarMoeda(subtotalItem)}</p>
                      </div>
                      {/* Qtd + lixeira */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {item.qtd > 1 && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: corTextoSec, background: modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 7px' }}>{item.qtd}x</span>
                        )}
                        <button onClick={() => alterarQtdCarrinho(item.chave, -item.qtd)}
                          style={{ width: 30, height: 30, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Adicionar mais itens link */}
                <button onClick={() => setCheckoutAberto(false)}
                  style={{ display: 'block', width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: destaque, textAlign: 'center', borderBottom: '1px solid ' + bordaCard }}>
                  + Adicionar mais itens
                </button>
              </div>

              {/* Peça também */}
              {sugeridos.length > 0 && (
                <div style={{ padding: '16px 0' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: corTextoBase, margin: '0 0 12px', paddingLeft: 20 }}>Peça também</p>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 4, scrollbarWidth: 'none' }}>
                    {sugeridos.map(prato => {
                      const preco = prato.precoVenda ?? prato.preco ?? 0
                      return (
                        <div key={prato.id} onClick={() => { setCheckoutAberto(false); setTimeout(() => abrirModal(prato), 100) }}
                          style={{ flexShrink: 0, width: 130, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                            background: modoClaro ? '#fff' : 'rgba(255,255,255,0.07)', border: '1px solid ' + bordaCard,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                          {prato.foto
                            ? <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: 80, background: modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽</div>
                          }
                          <div style={{ padding: '8px 10px' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: corTextoBase, margin: '0 0 3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{prato.nome}</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: corPreco, margin: 0 }}>{formatarMoeda(preco)}</p>
                            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: destaque, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <IcoPlus size={13} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cupom */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid ' + bordaCard, borderBottom: '1px solid ' + bordaCard }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cupomAplicado ? 8 : 0 }}>
                  <span style={{ fontSize: 18 }}>🎟</span>
                  <div style={{ flex: 1 }}>
                    {cupomAplicado ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>Cupom aplicado: {cupomAplicado.codigo}</p>
                          <p style={{ fontSize: 12, color: corTextoSec, margin: 0 }}>
                            -{cupomAplicado.tipo === 'percent' ? `${cupomAplicado.valor}%` : formatarMoeda(cupomAplicado.valor)} de desconto
                          </p>
                        </div>
                        <button onClick={() => { setCupomAplicado(null); setCupomInput('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Remover</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={cupomInput}
                          onChange={e => { setCupomInput(e.target.value.toUpperCase()); setCupomErro('') }}
                          onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
                          placeholder="Adicionar cupom"
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid ' + (cupomErro ? '#ef4444' : bordaCard), background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)', color: corTextoBase, fontSize: 13, outline: 'none' }} />
                        <button onClick={aplicarCupom}
                          style={{ padding: '8px 14px', background: destaque, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Aplicar
                        </button>
                      </div>
                    )}
                    {cupomErro && <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>{cupomErro}</p>}
                  </div>
                </div>
              </div>

              {/* Resumo de valores */}
              <div style={{ padding: '14px 20px' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: corTextoBase, margin: '0 0 10px' }}>Resumo de valores</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: corTextoSec }}>
                    <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
                    <span>{formatarMoeda(subtotal)}</span>
                  </div>
                  {descontoCupom > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                      <span>Desconto ({cupomAplicado.codigo})</span>
                      <span>-{formatarMoeda(descontoCupom)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: corTextoSec }}>
                    <span>Entrega</span>
                    <span style={{ color: corTextoSec }}>—</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: corTextoBase, paddingTop: 8, borderTop: '1px solid ' + bordaCard }}>
                    <span>Total com a entrega</span>
                    <span style={{ color: destaque }}>{formatarMoeda(subtotal - descontoCupom)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed bottom "Continuar" */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: fundo, borderTop: '1px solid ' + bordaCard, zIndex: 10 }}>
                <button onClick={() => setCheckoutStep(2)} style={{
                  width: '100%', background: destaque, color: '#fff', border: 'none', borderRadius: 14,
                  padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  maxWidth: 640, margin: '0 auto', boxSizing: 'border-box',
                }}>
                  <span>Continuar</span>
                  <span>{formatarMoeda(subtotal - descontoCupom)}</span>
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
                  {formasAtivas.map(({ key, label, icone }) => {
                    const selecionado = key === 'cartao'
                      ? (pagamento === 'cartaoCredito' || pagamento === 'cartaoDebito')
                      : pagamento === key
                    return (
                      <button key={key} onClick={() => { setPagamento(key); setBandeira('') }} style={{
                        flex: 1, minWidth: 90, padding: '11px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        border: '2px solid ' + (selecionado ? destaque : bordaCard),
                        background: selecionado ? (modoClaro ? `${destaque}14` : `${destaque}28`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.05)'),
                        color: selecionado ? destaque : corTextoSec, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      }}>
                        {icone}
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Sub-seleção Crédito / Débito */}
                {pagamento === 'cartao' && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: corTextoSec, margin: '0 0 8px' }}>Crédito ou Débito?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        ...(temCredito ? [{ key: 'cartaoCredito', label: 'Crédito' }] : []),
                        ...(temDebito  ? [{ key: 'cartaoDebito',  label: 'Débito'  }] : []),
                      ].map(({ key, label }) => (
                        <button key={key} onClick={() => setPagamento(key)} style={{
                          flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: '2px solid ' + (pagamento === key ? destaque : bordaCard),
                          background: pagamento === key ? (modoClaro ? `${destaque}14` : `${destaque}28`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.05)'),
                          color: pagamento === key ? destaque : corTextoSec,
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}

                {erros.pagamento && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px' }}>{erros.pagamento}</p>}

                {/* Bandeira do cartão */}
                {(pagamento === 'cartaoCredito' || pagamento === 'cartaoDebito') && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: corTextoSec, margin: '0 0 8px' }}>Qual a bandeira do cartão?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Visa', 'Mastercard', 'Elo', 'Outro'].map(b => (
                        <button key={b} onClick={() => setBandeira(b)} style={{
                          flex: 1, padding: '9px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                          border: '2px solid ' + (bandeira === b ? destaque : bordaCard),
                          background: bandeira === b ? (modoClaro ? `${destaque}14` : `${destaque}28`) : (modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.05)'),
                          color: bandeira === b ? destaque : corTextoSec, cursor: 'pointer',
                        }}>{b}</button>
                      ))}
                    </div>
                  </div>
                )}

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
