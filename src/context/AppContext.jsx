import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { fromBase } from '../utils/unidades.js'
import { hoje as hojeBrasilia, horaAtual, agoraBrasiliaISO } from '../utils/formatacao.js'
import { custoOpcoes, custoPrato, precoPorBase } from '../utils/calculos.js'

const AppContext = createContext(null)

const CONFIG_PADRAO = {
  nomeRestaurante: 'Meu Restaurante',
  descricao: '',
  corFundo: '#ffffff',
  corDestaque: '#f04000',
  corTexto: '#111827',
  mostrarPrecos: true,
  modoClaro: true,
  logo: null,
  ordemCategorias: [],
}

const NOTIF_CONFIG_PADRAO = {
  pushAtivo: false,
  notifVendas: true,
  notifVendasLocal: true,
  notifVendasDelivery: true,
  notifInsumos: true,
  notifDemora: true,
  demoraMinutos: 20,
}

const KANBAN_CONFIG_PADRAO = {
  cozinhaToken: null,
  caixaToken: null,
  autoRefreshSeg: 10,
  colunasVisivelCozinha: ['novo', 'preparando'],
  limiteAmareloMin: 10,
  limiteVermelhoMin: 20,
  somAlerta: false,
  mostrarPrecos: true,
  mostrarGarcom: true,
  mostrarMesa: true,
  mostrarObs: true,
  modoCompacto: false,
  ocultarCompletoAposMin: 0,
  labelNovo: 'Pedidos',
  labelPreparando: 'Preparando',
  labelCompleto: 'Completo',
  filtroPadrao: 'hoje',
  caixaColunasVisiveis: ['novo', 'preparando', 'pronto', 'completo'],
  caixaMostrarPrecos: true,
  caixaPodeAvancar: false,
  pdvAtivo: false,
  caixaMesasAtivo: false,
  caixaTitulo: '',
  caixaImpressaoAtivo: false,
  telaoToken: null,
  pedidosDisplayToken: null,
  etapas: [
    { id: 'novo',       label: 'Aguardando', cor: '#3b82f6' },
    { id: 'preparando', label: 'Preparando', cor: '#f59e0b' },
    { id: 'completo',   label: 'Entregue',   cor: '#16a34a' },
  ],
}

const PAGAMENTOS_CONFIG_PADRAO = {
  dinheiro: true,
  pix: true,
  cartaoCredito: true,
  cartaoDebito: true,
  mercadoPagoAtivo: false,
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
}

const DELIVERY_CONFIG_PADRAO = {
  ativo: false,
  slugDelivery: '',
  municipioId: '',
  uf: '',
  cidade: '',
  bairros: [],
  pedidoMinimo: 0,
  tempoEstimado: '30-45 min',
  tipoEntrega: 'Padrão',
  formasPagamento: ['dinheiro', 'pix', 'cartao'],
  telefone: '',
  mensagemIntro: 'Olá! Gostaria de fazer um pedido:',
  modoIfood: false,
  corDestaqueIfood: '#ea1d2c',
}

// ── Mappers JS ↔ Supabase ─────────────────────────────────────────────────

function ingToRow(ing, uid) {
  return {
    id: ing.id,
    user_id: uid,
    nome: ing.nome,
    unidade: ing.unidade || 'kg',
    preco: ing.preco || 0,
    quantidade_estoque: ing.quantidadeEstoque || 0,
    estoque_minimo: ing.estoqueMinimo ?? null,
    fator_correcao: ing.fatorCorrecao || 1,
    perecivel: !!ing.perecivel,
    percentual_perda: ing.percentualPerda ?? 0,
    criado_em: ing.criadoEm || new Date().toISOString(),
  }
}
function rowToIng(row) {
  return {
    id: row.id,
    nome: row.nome,
    unidade: row.unidade,
    preco: Number(row.preco || 0),
    quantidadeEstoque: Number(row.quantidade_estoque || 0),
    estoqueMinimo: row.estoque_minimo !== null && row.estoque_minimo !== undefined ? Number(row.estoque_minimo) : null,
    fatorCorrecao: Number(row.fator_correcao || 1),
    perecivel: !!row.perecivel,
    percentualPerda: Number(row.percentual_perda || 0),
    criadoEm: row.criado_em,
  }
}

function pratoToRow(p, uid) {
  return {
    id: p.id,
    user_id: uid,
    nome: p.nome,
    preco_venda: p.precoVenda || 0,
    categoria: p.categoria || '',
    em_destaque: p.emDestaque || false,
    mais_pedido: p.maisPedido || false,
    foto: p.foto || null,
    ingredientes: p.ingredientes || [],
    grupos: p.grupos || [],
    variacoes: p.variacoes || [],
    criado_em: p.criadoEm || new Date().toISOString(),
    tipo: p.tipo || 'normal',
    meia_a_meia: p.meiaAMeia || false,
    calc_variacao: p.calcVariacao || 'maior',
    max_sabores: p.maxSabores || (p.meiaAMeia ? 2 : 1),
    bordas: p.bordas || [],
    visivel_individual: p.visivelIndividual !== false,
  }
}
function rowToPrato(row) {
  return {
    id: row.id,
    nome: row.nome,
    precoVenda: Number(row.preco_venda || 0),
    categoria: row.categoria || '',
    emDestaque: row.em_destaque || false,
    maisPedido: row.mais_pedido || false,
    foto: row.foto || null,
    ingredientes: row.ingredientes || [],
    grupos: row.grupos || [],
    variacoes: row.variacoes || [],
    criadoEm: row.criado_em,
    tipo: row.tipo || ((row.variacoes?.length > 0) ? 'variacao' : 'normal'),
    meiaAMeia: row.meia_a_meia || false,
    calcVariacao: row.calc_variacao || 'maior',
    maxSabores: row.max_sabores || (row.meia_a_meia ? 2 : 1),
    bordas: row.bordas || [],
    visivelIndividual: row.visivel_individual !== false,
  }
}

function compraToRow(c, uid) {
  return {
    id: c.id,
    user_id: uid,
    ingrediente_id: c.ingredienteId,
    data: c.data,
    quantidade: c.quantidade,
    preco_unitario: c.precoUnitario,
    criado_em: c.criadoEm || new Date().toISOString(),
  }
}
function rowToCompra(row) {
  return {
    id: row.id,
    ingredienteId: row.ingrediente_id,
    data: row.data,
    quantidade: Number(row.quantidade),
    precoUnitario: Number(row.preco_unitario),
    criadoEm: row.criado_em,
  }
}

function despesaToRow(d, uid) {
  return {
    id: d.id,
    user_id: uid,
    descricao: d.descricao,
    categoria: d.categoria || '',
    valor: d.valor,
    data: d.data,
    criado_em: d.criadoEm || new Date().toISOString(),
  }
}
function rowToDespesa(row) {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria || '',
    valor: Number(row.valor),
    data: row.data,
    criadoEm: row.criado_em,
  }
}

function despesaFixaToRow(d, uid) {
  return {
    id: d.id,
    user_id: uid,
    descricao: d.descricao,
    categoria: d.categoria || '',
    valor: d.valor,
    criado_em: d.criadoEm || new Date().toISOString(),
  }
}
function rowToDespesaFixa(row) {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria || '',
    valor: Number(row.valor),
    criadoEm: row.criado_em,
  }
}

function impostoToRow(imp, uid) {
  return {
    id: imp.id,
    user_id: uid,
    nome: imp.nome,
    percentual: imp.percentual,
    base: imp.base || 'faturamento',
    criado_em: imp.criadoEm || new Date().toISOString(),
  }
}
function rowToImposto(row) {
  return {
    id: row.id,
    nome: row.nome,
    percentual: Number(row.percentual),
    base: row.base || 'faturamento',
    criadoEm: row.criado_em,
  }
}

function garconToRow(g, uid) {
  return { id: g.id, user_id: uid, nome: g.nome, token: g.token }
}
function rowToGarcon(row) {
  return { id: row.id, nome: row.nome, token: row.token }
}

function clienteToRow(c, uid) {
  return {
    id: c.id,
    user_id: uid,
    nome: c.nome,
    telefone: c.telefone || null,
    aniversario: c.aniversario || null,
    criado_em: c.criadoEm || new Date().toISOString(),
  }
}
function rowToCliente(row) {
  return { id: row.id, nome: row.nome, telefone: row.telefone || null, aniversario: row.aniversario || null, criadoEm: row.criado_em }
}

function mesaToRow(m, uid) {
  return {
    id: m.id,
    user_id: uid,
    nome: m.nome,
    capacidade: m.capacidade || 4,
    status: m.status || 'livre',
    inicio_sessao: m.inicioSessao || null,
    nome_cliente: m.nomeCliente || null,
  }
}
function rowToMesa(row) {
  return {
    id: row.id,
    nome: row.nome,
    capacidade: Number(row.capacidade || 4),
    status: row.status || 'livre',
    inicioSessao: row.inicio_sessao || null,
    nomeCliente: row.nome_cliente || null,
  }
}

function sessaoMesaToRow(s, uid) {
  return {
    id: s.id,
    user_id: uid,
    mesa_id: s.mesaId,
    mesa_nome: s.mesaNome,
    nome_cliente: s.nomeCliente || null,
    inicio: s.inicio,
    fim: s.fim,
    total: s.total || 0,
  }
}
function rowToSessaoMesa(row) {
  return {
    id: row.id,
    mesaId: row.mesa_id,
    mesaNome: row.mesa_nome,
    nomeCliente: row.nome_cliente || null,
    inicio: row.inicio,
    fim: row.fim,
    total: Number(row.total || 0),
  }
}

function pedidoToRow(p, uid) {
  return {
    id: p.id,
    user_id: uid,
    garcon_id: p.garconId || null,
    mesa_id: p.mesaId || null,
    cliente_id: p.clienteId || null,
    itens: p.itens || [],
    obs: p.obs || '',
    data: p.data,
    hora: p.hora || '',
    status: p.status || 'novo',
    pago: p.pago || false,
    cancelado: p.cancelado || false,
    timestamps: p.timestamps || {},
    canal: p.canal || 'local',
    cliente_nome: p.clienteNome || null,
    cliente_telefone: p.clienteTelefone || null,
    endereco_entrega: p.enderecoEntrega || null,
    motoboy_id: p.motoboyId || null,
    forma_pagamento: p.formaPagamento || null,
  }
}
function rowToPedido(row) {
  return {
    id: row.id,
    garconId: row.garcon_id,
    mesaId: row.mesa_id,
    clienteId: row.cliente_id,
    itens: row.itens || [],
    obs: row.obs || '',
    data: row.data,
    hora: row.hora || '',
    status: row.status || 'novo',
    pago: row.pago || false,
    cancelado: row.cancelado || false,
    timestamps: row.timestamps || {},
    canal: row.canal || 'local',
    clienteNome: row.cliente_nome || null,
    clienteTelefone: row.cliente_telefone || null,
    enderecoEntrega: row.endereco_entrega || null,
    motoboyId: row.motoboy_id || null,
    formaPagamento: row.forma_pagamento || null,
    ifoodOrderId: row.ifood_order_id || null,
    ifoodShortId: row.ifood_short_id || null,
  }
}

function registroVendaToRow(r, uid) {
  return {
    id: r.id,
    user_id: uid,
    prato_id: r.pratoId,
    data: r.data,
    quantidade: r.quantidade,
  }
}
function rowToRegistroVenda(row) {
  return {
    id: row.id,
    pratoId: row.prato_id,
    data: row.data,
    quantidade: Number(row.quantidade),
  }
}

function entradaVendaToRow(e, uid) {
  return {
    id: e.id,
    user_id: uid,
    prato_id: e.pratoId,
    data: e.data,
    hora: e.hora || '',
    quantidade: e.quantidade,
    garcon_id: e.garconId || null,
    extras_unit: e.extrasUnit || 0,
    extras_custo_unit: e.extrasCustoUnit || 0,
    custo_prato_unit: e.custoPratoUnit ?? null,
    ingredientes_snapshot: e.ingredientesSnapshot || null,
    preco_venda_unit: e.precoVendaUnit ?? null,
    canal: e.canal || 'local',
  }
}
function rowToEntradaVenda(row) {
  return {
    id: row.id,
    pratoId: row.prato_id,
    data: row.data,
    hora: row.hora || '',
    quantidade: Number(row.quantidade),
    garconId: row.garcon_id,
    extrasUnit: Number(row.extras_unit || 0),
    extrasCustoUnit: Number(row.extras_custo_unit || 0),
    custoPratoUnit: row.custo_prato_unit != null ? Number(row.custo_prato_unit) : null,
    ingredientesSnapshot: row.ingredientes_snapshot || null,
    precoVendaUnit: row.preco_venda_unit != null ? Number(row.preco_venda_unit) : null,
    canal: row.canal || 'local',
  }
}

function listaCompraToRow(item, uid) {
  return {
    id: item.id,
    user_id: uid,
    ingrediente_id: item.ingredienteId || null,
    nome: item.nome,
    unidade: item.unidade || '',
    quantidade: item.quantidade || 0,
    observacao: item.observacao || '',
    checked: item.checked || false,
  }
}
function rowToListaCompra(row) {
  return {
    id: row.id,
    ingredienteId: row.ingrediente_id,
    nome: row.nome,
    unidade: row.unidade || '',
    quantidade: Number(row.quantidade || 0),
    observacao: row.observacao || '',
    checked: row.checked || false,
  }
}

function caixaInicialToRow(c, uid) {
  return { id: c.id, user_id: uid, data: c.data, valor: c.valor }
}
function rowToCaixaInicial(row) {
  return { id: row.id, data: row.data, valor: Number(row.valor) }
}

function movimentoCaixaToRow(m, uid) {
  return { id: m.id, user_id: uid, data: m.data, hora: m.hora || null, tipo: m.tipo, valor: m.valor, descricao: m.descricao || '' }
}
function rowToMovimentoCaixa(row) {
  return { id: row.id, data: row.data, hora: row.hora || null, tipo: row.tipo, valor: Number(row.valor), descricao: row.descricao || '' }
}

function rowToCardapioConfig(row) {
  if (!row) return CONFIG_PADRAO
  return { ...CONFIG_PADRAO, ...(row.config || {}) }
}

function migrateKanbanConfig(cfg) {
  if (cfg.etapas && !cfg.etapas.find(e => e.id === 'pronto')) {
    const idx = cfg.etapas.findIndex(e => e.id === 'completo')
    if (idx >= 0) cfg = { ...cfg, etapas: [
      ...cfg.etapas.slice(0, idx),
      { id: 'pronto', label: 'Pronto para Entrega', cor: '#22c55e' },
      ...cfg.etapas.slice(idx),
    ]}
  }
  if (cfg.caixaColunasVisiveis && !cfg.caixaColunasVisiveis.includes('pronto')) {
    const idx = cfg.caixaColunasVisiveis.indexOf('completo')
    if (idx >= 0) cfg = { ...cfg, caixaColunasVisiveis: [
      ...cfg.caixaColunasVisiveis.slice(0, idx),
      'pronto',
      ...cfg.caixaColunasVisiveis.slice(idx),
    ]}
  }
  return cfg
}

function rowToKanbanConfig(row) {
  if (!row) return KANBAN_CONFIG_PADRAO
  return migrateKanbanConfig({ ...KANBAN_CONFIG_PADRAO, ...(row.config || {}) })
}

function rowToDeliveryConfig(row) {
  if (!row) return DELIVERY_CONFIG_PADRAO
  return {
    ativo: row.ativo || false,
    slugDelivery: row.slug_delivery || '',
    municipioId: row.municipio_id || '',
    uf: row.uf || '',
    cidade: row.cidade || '',
    bairros: row.bairros || [],
    pedidoMinimo: Number(row.pedido_minimo || 0),
    tempoEstimado: row.tempo_estimado || '30-45 min',
    tipoEntrega: row.tipo_entrega || 'Padrão',
    formasPagamento: row.formas_pagamento || ['dinheiro', 'pix', 'cartao'],
    telefone: row.telefone || '',
    mensagemIntro: row.mensagem_intro || 'Olá! Gostaria de fazer um pedido:',
    modoIfood: row.modo_ifood || false,
    corDestaqueIfood: row.cor_destaque_ifood || '#ea1d2c',
    cupons: row.cupons || [],
  }
}

function deliveryConfigToRow(cfg, uid) {
  return {
    user_id: uid,
    ativo: cfg.ativo || false,
    slug_delivery: cfg.slugDelivery || null,
    municipio_id: cfg.municipioId || '',
    uf: cfg.uf || '',
    cidade: cfg.cidade || '',
    bairros: cfg.bairros || [],
    pedido_minimo: cfg.pedidoMinimo || 0,
    tempo_estimado: cfg.tempoEstimado || '',
    tipo_entrega: cfg.tipoEntrega || 'Padrão',
    formas_pagamento: cfg.formasPagamento || ['dinheiro', 'pix', 'cartao'],
    telefone: cfg.telefone || '',
    mensagem_intro: cfg.mensagemIntro || '',
    modo_ifood: cfg.modoIfood || false,
    cor_destaque_ifood: cfg.corDestaqueIfood || '#ea1d2c',
    cupons: cfg.cupons || [],
  }
}

function motoboyToRow(m, uid) {
  return {
    id: m.id,
    user_id: uid,
    nome: m.nome,
    token: m.token,
    ativo: m.ativo !== false,
    cor: m.cor || '#f04000',
  }
}
function rowToMotoboy(row) {
  return {
    id: row.id,
    nome: row.nome,
    token: row.token,
    ativo: row.ativo !== false,
    online: row.online || false,
    lat: row.lat ? Number(row.lat) : null,
    lng: row.lng ? Number(row.lng) : null,
    atualizadoEm: row.atualizado_em || null,
    cor: row.cor || '#f04000',
  }
}

function rowToNotifConfig(row) {
  if (!row) return NOTIF_CONFIG_PADRAO
  return {
    pushAtivo: row.push_ativo || false,
    notifVendas: row.notif_vendas !== false,
    notifInsumos: row.notif_insumos !== false,
    notifDemora: row.notif_demora !== false,
    demoraMinutos: Number(row.demora_minutos || 20),
  }
}

function notifConfigToRow(cfg, uid) {
  return {
    user_id: uid,
    push_ativo: cfg.pushAtivo || false,
    notif_vendas: cfg.notifVendas !== false,
    notif_insumos: cfg.notifInsumos !== false,
    notif_demora: cfg.notifDemora !== false,
    demora_minutos: cfg.demoraMinutos || 20,
  }
}

// ── Helper Supabase fire-and-forget ───────────────────────────────────────
function sbWrite(promise) {
  promise.then(({ error }) => { if (error) console.error('[supabase]', error) })
}

// ── AppProvider ───────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rd_tema')) || 'light' } catch { return 'light' }
  })
  const [auth, setAuth] = useState({ logado: false, usuario: '', isAdmin: false, userId: null })
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [displayReady, setDisplayReady] = useState(false)
  // userId para páginas de display (token-based, sem auth normal)
  const [displayUserId, setDisplayUserId] = useState(null)

  const [ingredientes, setIngredientes] = useState([])
  const [pratos, setPratos] = useState([])
  const [registrosVendas, setRegistrosVendas] = useState([])
  const [entradasVendas, setEntradasVendas] = useState([])
  const [cardapioConfig, setCardapioConfig] = useState(CONFIG_PADRAO)
  const [garcons, setGarcons] = useState([])
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [compras, setCompras] = useState([])
  const [caixaInicial, setCaixaInicialState] = useState([])
  const [mesas, setMesas] = useState([])
  const [sessoesMesas, setSessoesMesas] = useState([])
  const [kanbanConfig, setKanbanConfig] = useState(KANBAN_CONFIG_PADRAO)
  const [configuracaoGeral, setConfiguracaoGeral] = useState({ estoqueMinimoPadrao: 0 })
  const [configuracaoDelivery, setConfiguracaoDelivery] = useState(DELIVERY_CONFIG_PADRAO)
  const [listaCompras, setListaCompras] = useState([])
  const [despesas, setDespesas] = useState([])
  const [despesasFixas, setDespesasFixas] = useState([])
  const [impostosConfig, setImpostosConfig] = useState([])
  const [notifConfig, setNotifConfig] = useState(NOTIF_CONFIG_PADRAO)
  const [pagamentosConfig, setPagamentosConfig] = useState(PAGAMENTOS_CONFIG_PADRAO)
  const [perfil, setPerfil] = useState({ foto: null, nomeExibicao: '' })
  const [motoboys, setMotoboys] = useState([])
  const [movimentosCaixa, setMovimentosCaixa] = useState([])
  const [periodoCarregado, setPeriodoCarregado] = useState(null) // dataInicio mais antiga carregada

  const userIdRef = useRef(null)
  const notifConfigRef = useRef(notifConfig)
  const cardapioConfigRef = useRef(cardapioConfig)
  const ingredientesRef = useRef(ingredientes)
  const pedidosRef = useRef(pedidos)
  const configuracaoGeralRef = useRef(configuracaoGeral)
  useEffect(() => { notifConfigRef.current = notifConfig }, [notifConfig])
  useEffect(() => { cardapioConfigRef.current = cardapioConfig }, [cardapioConfig])
  useEffect(() => { ingredientesRef.current = ingredientes }, [ingredientes])
  useEffect(() => { pedidosRef.current = pedidos }, [pedidos])
  useEffect(() => { configuracaoGeralRef.current = configuracaoGeral }, [configuracaoGeral])

  // ── Display sem auth: carrega dados pelo token da URL ─────────────────
  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/^\/(cozinha|caixa|telao|pedidos-display)\/(.+)$/)
    if (!match) return
    const [, tipo, token] = match
    const campoToken = { cozinha: 'cozinhaToken', caixa: 'caixaToken', telao: 'telaoToken', 'pedidos-display': 'pedidosDisplayToken' }[tipo]
    if (!campoToken) return

    async function carregarPorToken() {
      setAuthLoading(false)
      const { data: kbcRow } = await supabase
        .from('kanban_config')
        .select('user_id, config')
        .eq(`config->>${campoToken}`, token)
        .maybeSingle()
      if (!kbcRow) { setDisplayReady(true); return }
      const uid = kbcRow.user_id
      setDisplayUserId(uid)
      const [{ data: prtsRaw }, { data: garsRaw }, { data: mssRaw }, { data: pdsRaw }, { data: ccsRaw }, { data: clisRaw }, { data: motoboysRaw }] = await Promise.all([
        supabase.from('pratos').select('*').eq('user_id', uid),
        supabase.from('garcons').select('*').eq('user_id', uid),
        supabase.from('mesas').select('*').eq('user_id', uid),
        supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', new Date(Date.now() - 86400000).toISOString().slice(0, 10)),
        supabase.from('cardapio_config').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('clientes').select('*').eq('user_id', uid),
        supabase.from('motoboys').select('*').eq('user_id', uid),
      ])
      setKanbanConfig(migrateKanbanConfig({ ...KANBAN_CONFIG_PADRAO, ...(kbcRow.config || {}) }))
      setPratos((prtsRaw || []).map(rowToPrato))
      setGarcons((garsRaw || []).map(rowToGarcon))
      setMesas((mssRaw || []).map(rowToMesa))
      setPedidos((pdsRaw || []).map(rowToPedido))
      setCardapioConfig(rowToCardapioConfig(ccsRaw))
      setClientes((clisRaw || []).map(rowToCliente))
      setMotoboys((motoboysRaw || []).map(rowToMotoboy))
      setDisplayReady(true)

      // Realtime + polling para pedidos e mesas
      const desde = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const fetchDisplay = () => {
        supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', desde())
          .then(({ data }) => data && setPedidos(data.map(rowToPedido)))
        supabase.from('mesas').select('*').eq('user_id', uid)
          .then(({ data }) => data && setMesas(data.map(rowToMesa)))
      }
      // Sem filter no channel — anon+RLS não suporta filter no realtime
      const ch = supabase.channel(`display-${token}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
          if (payload.new?.user_id === uid || payload.old?.user_id === uid) fetchDisplay()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, payload => {
          if (payload.new?.user_id === uid || payload.old?.user_id === uid) fetchDisplay()
        })
        .subscribe(status => {
          if (status === 'CHANNEL_ERROR') {
            setTimeout(() => ch.subscribe(), 3000)
          }
        })
      // Polling fallback a cada 3s
      const dpollId = setInterval(fetchDisplay, 3000)
      // Cleanup ao desmontar (se algum dia o componente desmontar)
      window._displayCleanup = () => { supabase.removeChannel(ch); clearInterval(dpollId) }
    }
    carregarPorToken()
  }, [])

  // ── Supabase Auth ─────────────────────────────────────────────────────
  useEffect(() => {
    // onAuthStateChange dispara imediatamente com INITIAL_SESSION (sem rede)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Resolve imediatamente com dados da sessão em cache (sem esperar rede)
        setAuth({
          logado: true,
          usuario: session.user.user_metadata?.username || session.user.email,
          isAdmin: session.user.user_metadata?.is_admin || false,
          userId: session.user.id,
        })
        setAuthLoading(false)
        // Enriquece com dados do perfil em background (não bloqueia)
        _aplicarSessao(session)
      } else {
        setAuth({ logado: false, usuario: '', isAdmin: false, userId: null })
        // Não limpa dados em páginas de display (carregadas por token, sem auth)
        const isDisplayPath = /^\/(cozinha|caixa|telao|pedidos-display)\//.test(window.location.pathname)
        if (!isDisplayPath) _limparDados()
        setAuthLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function _aplicarSessao(session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, username, nome_exibicao, foto')
      .eq('id', session.user.id)
      .maybeSingle()
    if (!profile) return
    setAuth(prev => ({
      ...prev,
      usuario: profile.username || prev.usuario,
      isAdmin: profile.is_admin || prev.isAdmin,
    }))
    setPerfil(prev => ({
      ...prev,
      ...(profile.nome_exibicao ? { nomeExibicao: profile.nome_exibicao } : {}),
      ...(profile.foto ? { foto: profile.foto } : {}),
    }))
  }

  function _limparDados() {
    userIdRef.current = null
    setIngredientes([])
    setPratos([])
    setRegistrosVendas([])
    setEntradasVendas([])
    setCardapioConfig(CONFIG_PADRAO)
    setGarcons([])
    setClientes([])
    setPedidos([])
    setCompras([])
    setCaixaInicialState([])
    setMesas([])
    setSessoesMesas([])
    setKanbanConfig(KANBAN_CONFIG_PADRAO)
    setConfiguracaoGeral({ estoqueMinimoPadrao: 0 })
    setConfiguracaoDelivery(DELIVERY_CONFIG_PADRAO)
    setListaCompras([])
    setDespesas([])
    setDespesasFixas([])
    setImpostosConfig([])
    setNotifConfig(NOTIF_CONFIG_PADRAO)
    setPagamentosConfig(PAGAMENTOS_CONFIG_PADRAO)
    setPerfil({ foto: null, nomeExibicao: '' })
    setMotoboys([])
    setMovimentosCaixa([])
  }

  // ── Carregar todos os dados quando userId muda ────────────────────────
  useEffect(() => {
    if (!auth.userId) return
    userIdRef.current = auth.userId
    _loadAllData(auth.userId)
  }, [auth.userId])

  function _cacheKey(uid) { return `rd_cache_${uid}` }
  function _saveCache(uid, d) {
    try { localStorage.setItem(_cacheKey(uid), JSON.stringify({ t: Date.now(), d })) } catch {}
  }
  function _loadCache(uid) {
    try {
      const raw = localStorage.getItem(_cacheKey(uid))
      if (!raw) return null
      const { t, d } = JSON.parse(raw)
      if (Date.now() - t > 15 * 60 * 1000) return null // 15 min TTL
      return d
    } catch { return null }
  }

  async function _loadAllData(uid) {
    setLoading(true)
    setDisplayReady(false)

    // ── Cache: mostra dados instantaneamente enquanto busca do Supabase ──
    const cached = _loadCache(uid)
    if (cached) {
      if (cached.kbc) setKanbanConfig(migrateKanbanConfig(cached.kbc))
      if (cached.prts) setPratos(cached.prts)
      if (cached.gars) setGarcons(cached.gars)
      if (cached.mss) setMesas(cached.mss)
      if (cached.clis) setClientes(cached.clis)
      if (cached.ccs) setCardapioConfig(cached.ccs)
      if (cached.pds) setPedidos(cached.pds)
      setDisplayReady(true)
    }

    // Carrega apenas hoje — histórico é buscado sob demanda via carregarPeriodo()
    const dataLimite = hojeBrasilia()

    try {
      // ── Estágio 1: dados críticos para exibição (parallel) ───────────
      const [
        { data: prtsRaw },
        { data: garsRaw },
        { data: mssRaw },
        { data: clisRaw },
        { data: pdsRaw },
        { data: kbcRaw },
        { data: ccsRaw },
      ] = await Promise.all([
        supabase.from('pratos').select('*').eq('user_id', uid),
        supabase.from('garcons').select('*').eq('user_id', uid),
        supabase.from('mesas').select('*').eq('user_id', uid),
        supabase.from('clientes').select('*').eq('user_id', uid),
        supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', dataLimite),
        supabase.from('kanban_config').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('cardapio_config').select('*').eq('user_id', uid).maybeSingle(),
      ])

      const kbc  = rowToKanbanConfig(kbcRaw)
      const prts = (prtsRaw || []).map(rowToPrato)
      const gars = (garsRaw || []).map(rowToGarcon)
      const mss  = (mssRaw  || []).map(rowToMesa)
      const clis = (clisRaw || []).map(rowToCliente)
      const ccs  = rowToCardapioConfig(ccsRaw)

      const pds = (pdsRaw || []).map(rowToPedido)
      setKanbanConfig(kbc)
      setPedidos(pds)
      setPratos(prts)
      setGarcons(gars)
      setMesas(mss)
      setClientes(clis)
      setCardapioConfig(ccs)
      setDisplayReady(true)
      // Cache só pedidos de hoje (evita estourar 5MB do localStorage)
      const hojeStr = new Date().toISOString().slice(0, 10)
      const pdsHoje = pds.filter(p => p.data >= hojeStr)
      _saveCache(uid, { kbc, prts, gars, mss, clis, ccs, pds: pdsHoje })

      // ── Estágio 2: dados de fundo (parallel) ─────────────────────────
      const [
        { data: ingsRaw },
        { data: rvsRaw },
        { data: evsRaw },
        { data: cosRaw },
        { data: cisRaw },
        { data: smsRaw },
        { data: cgRaw },
        { data: cdRaw },
        { data: lcsRaw },
        { data: desRaw },
        { data: dfsRaw },
        { data: icsRaw },
        { data: ncRaw },
        { data: profRaw },
        { data: mvsRaw },
      ] = await Promise.all([
        supabase.from('ingredientes').select('*').eq('user_id', uid),
        supabase.from('registros_vendas').select('*').eq('user_id', uid),
        supabase.from('entradas_vendas').select('*').eq('user_id', uid).gte('data', dataLimite),
        supabase.from('compras').select('*').eq('user_id', uid),
        supabase.from('caixa_inicial').select('*').eq('user_id', uid),
        supabase.from('sessoes_mesas').select('*').eq('user_id', uid),
        supabase.from('configuracao_geral').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('config_delivery').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('lista_compras').select('*').eq('user_id', uid),
        supabase.from('despesas').select('*').eq('user_id', uid),
        supabase.from('despesas_fixas').select('*').eq('user_id', uid),
        supabase.from('impostos_config').select('*').eq('user_id', uid),
        supabase.from('notif_config').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('movimentos_caixa').select('*').eq('user_id', uid).gte('data', dataLimite).then(r => r, () => ({ data: [] })),
      ])

      if (ingsRaw) setIngredientes(ingsRaw.map(rowToIng))
      if (rvsRaw)  setRegistrosVendas(rvsRaw.map(rowToRegistroVenda))
      if (evsRaw)  setEntradasVendas(evsRaw.map(rowToEntradaVenda))
      if (cosRaw)  setCompras(cosRaw.map(rowToCompra))
      if (cisRaw)  setCaixaInicialState(cisRaw.map(rowToCaixaInicial))
      if (smsRaw)  setSessoesMesas(smsRaw.map(rowToSessaoMesa))
      if (mvsRaw)  setMovimentosCaixa(mvsRaw.map(rowToMovimentoCaixa))
      setPeriodoCarregado(dataLimite) // marca que temos dados a partir de hoje
      setConfiguracaoGeral(cgRaw ? { estoqueMinimoPadrao: Number(cgRaw.estoque_minimo_padrao || 0) } : { estoqueMinimoPadrao: 0 })
      setConfiguracaoDelivery(rowToDeliveryConfig(cdRaw))
      if (lcsRaw)  setListaCompras(lcsRaw.map(rowToListaCompra))
      if (desRaw)  setDespesas(desRaw.map(rowToDespesa))
      if (dfsRaw)  setDespesasFixas(dfsRaw.map(rowToDespesaFixa))
      if (icsRaw)  setImpostosConfig(icsRaw.map(rowToImposto))
      setNotifConfig(rowToNotifConfig(ncRaw))
      if (profRaw?.nome_exibicao) setPerfil(prev => ({ ...prev, nomeExibicao: profRaw.nome_exibicao }))
      if (profRaw?.foto)          setPerfil(prev => ({ ...prev, foto: profRaw.foto }))

    } catch (e) {
      console.error('[loadAllData]', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Realtime: pedidos, mesas, entradas_vendas ────────────────────────
  useEffect(() => {
    if (!auth.userId) return
    const uid = auth.userId
    const dataLimiteRt = new Date(); dataLimiteRt.setDate(dataLimiteRt.getDate() - 60)
    const dataLimiteRtStr = dataLimiteRt.toISOString().slice(0, 10)
    const channel = supabase
      .channel(`rt-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `user_id=eq.${uid}` }, () => {
        supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', dataLimiteRtStr).then(({ data }) => {
          if (data) {
            const pds = data.map(rowToPedido)
            setPedidos(pds)
            // Atualiza cache com apenas pedidos de hoje
            try {
              const raw = localStorage.getItem(_cacheKey(uid))
              if (raw) {
                const { t, d } = JSON.parse(raw)
                const hojeStr = new Date().toISOString().slice(0, 10)
                const pdsHoje = pds.filter(p => p.data >= hojeStr)
                localStorage.setItem(_cacheKey(uid), JSON.stringify({ t, d: { ...d, pds: pdsHoje } }))
              }
            } catch {}
          }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas', filter: `user_id=eq.${uid}` }, () => {
        supabase.from('mesas').select('*').eq('user_id', uid).then(({ data }) => {
          if (data) setMesas(data.map(rowToMesa))
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas_vendas' }, payload => {
        // Verifica user_id manualmente pois filter pode falhar com inserções anon (display page)
        if (payload.new?.user_id === uid || payload.old?.user_id === uid) {
          supabase.from('entradas_vendas').select('*').eq('user_id', uid).then(({ data }) => {
            if (data) setEntradasVendas(data.map(rowToEntradaVenda))
          })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'motoboys', filter: `user_id=eq.${uid}` }, () => {
        supabase.from('motoboys').select('*').eq('user_id', uid).then(({ data }) => {
          if (data) setMotoboys(data.map(rowToMotoboy))
        })
      })
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => supabase.removeChannel(channel), 1000)
        }
      })

    // Polling fallback: busca pedidos e mesas a cada 3s caso realtime falhe
    // IMPORTANTE: usa hojeBrasilia() para evitar erro de fuso horário (UTC vs BRT)
    const getHojeStr = () => hojeBrasilia()
    const pollId = setInterval(() => {
      const hojeStr = getHojeStr()
      supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', hojeStr)
        .then(({ data }) => {
          if (data) {
            const pds = data.map(rowToPedido)
            setPedidos(prev => {
              if (prev.length !== pds.length) return pds
              const key = p => `${p.id}${p.status}${p.pago}${p.cancelado}`
              const prevIds = prev.map(key).join()
              const newIds  = pds.map(key).join()
              return prevIds === newIds ? prev : pds
            })
          }
        })
      supabase.from('mesas').select('*').eq('user_id', uid)
        .then(({ data }) => { if (data) setMesas(data.map(rowToMesa)) })
    }, 3000)

    // Polling de entradas_vendas a cada 30s (garante sync mesmo sem realtime)
    const entradsPollId = setInterval(() => {
      const hojeStr = getHojeStr()
      supabase.from('entradas_vendas').select('*').eq('user_id', uid).gte('data', hojeStr)
        .then(({ data }) => {
          if (!data) return
          setEntradasVendas(prev => {
            if (prev.length !== data.length) return data.map(rowToEntradaVenda)
            const ids = d => d.map(x => x.id).sort().join()
            return ids(prev) === ids(data) ? prev : data.map(rowToEntradaVenda)
          })
        })
    }, 30000)

    return () => { supabase.removeChannel(channel); clearInterval(pollId); clearInterval(entradsPollId) }
  }, [auth.userId])

  // ── Carregar período histórico sob demanda ────────────────────────────
  async function carregarPeriodo(dataInicio) {
    if (!auth.userId) return
    // Só busca se a data pedida for anterior ao que já temos
    if (periodoCarregado && dataInicio >= periodoCarregado) return
    const uid = auth.userId
    const [{ data: pdsRaw }, { data: evsRaw }, { data: mvsRaw }] = await Promise.all([
      supabase.from('pedidos').select('*').eq('user_id', uid).gte('data', dataInicio),
      supabase.from('entradas_vendas').select('*').eq('user_id', uid).gte('data', dataInicio),
      supabase.from('movimentos_caixa').select('*').eq('user_id', uid).gte('data', dataInicio).then(r => r, () => ({ data: [] })),
    ])
    if (pdsRaw) setPedidos(pdsRaw.map(rowToPedido))
    if (evsRaw) setEntradasVendas(evsRaw.map(rowToEntradaVenda))
    if (mvsRaw) setMovimentosCaixa(mvsRaw.map(rowToMovimentoCaixa))
    setPeriodoCarregado(dataInicio)
  }

  // ── Motoboys: carregar inicial ────────────────────────────────────────
  useEffect(() => {
    if (!auth.userId) return
    supabase.from('motoboys').select('*').eq('user_id', auth.userId)
      .then(({ data }) => { if (data) setMotoboys(data.map(rowToMotoboy)) })
  }, [auth.userId])

  // ── Pagamentos Config: carregar ───────────────────────────────────────
  useEffect(() => {
    if (!auth.userId) return
    supabase.from('pagamentos_config').select('config').eq('user_id', auth.userId).maybeSingle()
      .then(({ data }) => {
        if (data?.config) setPagamentosConfig(prev => ({ ...PAGAMENTOS_CONFIG_PADRAO, ...data.config }))
      })
      .catch(() => {}) // tabela pode não existir ainda
  }, [auth.userId])

  // ── Tema (mantido em localStorage — preferência de UI) ────────────────
  useEffect(() => {
    const html = document.documentElement
    if (tema === 'light') html.classList.add('light')
    else html.classList.remove('light')
    localStorage.setItem('rd_tema', JSON.stringify(tema))
  }, [tema])

  function alternarTema() { setTema(t => t === 'dark' ? 'light' : 'dark') }

  // ── Auth ──────────────────────────────────────────────────────────────
  async function login(emailOuUsuario, senha, manterLogado = true) {
    let email = emailOuUsuario.trim()
    if (!email.includes('@')) {
      const { data } = await supabase.from('profiles').select('email').eq('username', email.toLowerCase()).maybeSingle()
      if (!data?.email) return { erro: 'Usuário ou senha incorretos.' }
      email = data.email
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) return { erro: 'Usuário ou senha incorretos.' }
    if (!manterLogado) localStorage.setItem('rd_session_temp', '1')
    else localStorage.removeItem('rd_session_temp')
    return { ok: true }
  }

  async function logout() {
    if (auth.userId) try { localStorage.removeItem(_cacheKey(auth.userId)) } catch {}
    await supabase.auth.signOut()
  }

  async function cadastrarUsuario(email, senha, username) {
    const nomeUsuario = username.trim().toLowerCase()
    const { data: existeUser } = await supabase.from('profiles').select('id').eq('username', nomeUsuario).maybeSingle()
    if (existeUser) return { erro: 'nome_em_uso' }
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { username: nomeUsuario, nome_exibicao: username.trim() } },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered'))
        return { erro: 'email_em_uso' }
      return { erro: error.message }
    }
    return { ok: true }
  }

  async function alterarSenha(senhaAntiga, senhaNova) {
    const { error: reauth } = await supabase.auth.signInWithPassword({ email: auth.usuario, password: senhaAntiga })
    if (reauth) return { erro: 'Senha atual incorreta.' }
    if (senhaNova.length < 4) return { erro: 'Nova senha deve ter pelo menos 4 caracteres.' }
    const { error } = await supabase.auth.updateUser({ password: senhaNova })
    if (error) return { erro: error.message }
    return { ok: true }
  }

  async function resetarSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) return { erro: error.message }
    return { ok: true }
  }

  function removerUsuario() { return { ok: true } }

  // ── Perfil ────────────────────────────────────────────────────────────
  function atualizarPerfil(updates) {
    setPerfil(prev => ({ ...prev, ...updates }))
    if (!auth.userId) return
    const dbUp = {}
    if (updates.nomeExibicao !== undefined) dbUp.nome_exibicao = updates.nomeExibicao
    if (updates.foto !== undefined) dbUp.foto = updates.foto
    if (Object.keys(dbUp).length) {
      sbWrite(supabase.from('profiles').update(dbUp).eq('id', auth.userId))
    }
  }

  // ── Notif Config ──────────────────────────────────────────────────────
  function atualizarNotifConfig(updates) {
    setNotifConfig(prev => {
      const novo = { ...prev, ...updates }
      if (auth.userId) sbWrite(supabase.from('notif_config').upsert(notifConfigToRow(novo, auth.userId), { onConflict: 'user_id' }))
      return novo
    })
  }

  // ── Insumos CRUD ──────────────────────────────────────────────────────
  function adicionarIngrediente(dados) {
    const novo = { ...dados, id: crypto.randomUUID(), criadoEm: agoraBrasiliaISO() }
    setIngredientes(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('ingredientes').insert(ingToRow(novo, auth.userId)))
    return novo
  }

  function editarIngrediente(id, dados) {
    setIngredientes(prev => prev.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, ...dados }
      if (auth.userId) sbWrite(supabase.from('ingredientes').update(ingToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerIngrediente(id) {
    const emUso = pratos.some(p => p.ingredientes?.some(l => l.ingredienteId === id))
    if (emUso) return { erro: 'Insumo está em uso em uma ou mais receitas. Remova-o das receitas antes de excluir.' }
    setIngredientes(prev => prev.filter(i => i.id !== id))
    if (auth.userId) sbWrite(supabase.from('ingredientes').delete().eq('id', id).eq('user_id', auth.userId))
    return { ok: true }
  }

  // ── Compras / Entrada de Estoque ──────────────────────────────────────
  function registrarCompra(ingredienteId, quantidade, precoUnitario, data) {
    const now = data || hojeBrasilia()
    const compra = {
      id: crypto.randomUUID(),
      ingredienteId,
      data: now,
      quantidade: Number(quantidade),
      precoUnitario: Number(precoUnitario),
      criadoEm: agoraBrasiliaISO(),
    }
    setCompras(prev => [...prev, compra])
    if (auth.userId) sbWrite(supabase.from('compras').insert(compraToRow(compra, auth.userId)))

    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      const novoEstoque = estoqueAtual + Number(quantidade)
      const novoPreco = novoEstoque > 0
        ? ((estoqueAtual * precoAtual) + (Number(quantidade) * Number(precoUnitario))) / novoEstoque
        : Number(precoUnitario)
      const updated = { ...ing, quantidadeEstoque: novoEstoque, preco: novoPreco }
      if (auth.userId) sbWrite(supabase.from('ingredientes').update(ingToRow(updated, auth.userId)).eq('id', ing.id))
      return updated
    }))
    return compra
  }

  function removerCompra(id) {
    const compra = compras.find(c => c.id === id)
    if (!compra) return
    setCompras(prev => prev.filter(c => c.id !== id))
    if (auth.userId) sbWrite(supabase.from('compras').delete().eq('id', id).eq('user_id', auth.userId))

    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== compra.ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      const estoqueAntes = estoqueAtual - compra.quantidade
      const precoAntes = estoqueAntes > 0
        ? ((precoAtual * estoqueAtual) - (compra.quantidade * compra.precoUnitario)) / estoqueAntes
        : precoAtual
      const updated = { ...ing, quantidadeEstoque: estoqueAntes, preco: Math.max(0, precoAntes) }
      if (auth.userId) sbWrite(supabase.from('ingredientes').update(ingToRow(updated, auth.userId)).eq('id', ing.id))
      return updated
    }))
  }

  function editarCompra(id, novosDados) {
    const compraAntiga = compras.find(c => c.id === id)
    if (!compraAntiga) return
    const compraAtualizada = { ...compraAntiga, ...novosDados, quantidade: Number(novosDados.quantidade), precoUnitario: Number(novosDados.precoUnitario) }
    setCompras(prev => prev.map(c => c.id === id ? compraAtualizada : c))
    if (auth.userId) sbWrite(supabase.from('compras').update(compraToRow(compraAtualizada, auth.userId)).eq('id', id))

    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== compraAntiga.ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      const estoqueRevertido = estoqueAtual - compraAntiga.quantidade
      const precoRevertido = estoqueRevertido > 0
        ? ((precoAtual * estoqueAtual) - (compraAntiga.quantidade * compraAntiga.precoUnitario)) / estoqueRevertido
        : precoAtual
      const novaQtd = Number(novosDados.quantidade)
      const novoPrecoUnit = Number(novosDados.precoUnitario)
      const novoEstoque = estoqueRevertido + novaQtd
      const novoPreco = novoEstoque > 0
        ? ((Math.max(0, precoRevertido) * estoqueRevertido) + (novaQtd * novoPrecoUnit)) / novoEstoque
        : novoPrecoUnit
      const updated = { ...ing, quantidadeEstoque: novoEstoque, preco: Math.max(0, novoPreco) }
      if (auth.userId) sbWrite(supabase.from('ingredientes').update(ingToRow(updated, auth.userId)).eq('id', ing.id))
      return updated
    }))
  }

  // ── Receitas CRUD ─────────────────────────────────────────────────────
  function adicionarPrato(dados) {
    const novo = { ...dados, id: crypto.randomUUID(), criadoEm: agoraBrasiliaISO() }
    setPratos(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('pratos').insert(pratoToRow(novo, auth.userId)))
    return novo
  }

  function editarPrato(id, dados) {
    setPratos(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, ...dados }
      if (auth.userId) sbWrite(supabase.from('pratos').update(pratoToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerPrato(id) {
    setPratos(prev => prev.filter(p => p.id !== id))
    setRegistrosVendas(prev => prev.filter(r => r.pratoId !== id))
    setEntradasVendas(prev => prev.filter(e => e.pratoId !== id))
    if (auth.userId) {
      sbWrite(supabase.from('pratos').delete().eq('id', id).eq('user_id', auth.userId))
      sbWrite(supabase.from('registros_vendas').delete().eq('prato_id', id).eq('user_id', auth.userId))
      sbWrite(supabase.from('entradas_vendas').delete().eq('prato_id', id).eq('user_id', auth.userId))
    }
  }

  // ── Registros de Vendas ───────────────────────────────────────────────
  function registrarVendas(pratoId, data, quantidade) {
    const novaQtd = Number(quantidade)
    const existente = registrosVendas.find(r => r.pratoId === pratoId && r.data === data)
    const qtdAnterior = existente ? existente.quantidade : 0
    const diff = novaQtd - qtdAnterior
    if (diff === 0) return

    setRegistrosVendas(prev => {
      const ex = prev.find(r => r.pratoId === pratoId && r.data === data)
      if (ex) {
        const updated = { ...ex, quantidade: novaQtd }
        if (auth.userId) sbWrite(supabase.from('registros_vendas').update({ quantidade: novaQtd }).eq('id', ex.id))
        return prev.map(r => r.pratoId === pratoId && r.data === data ? updated : r)
      }
      const novo = { id: crypto.randomUUID(), pratoId, data, quantidade: novaQtd }
      if (auth.userId) sbWrite(supabase.from('registros_vendas').insert(registroVendaToRow(novo, auth.userId)))
      return [...prev, novo]
    })

    const prato = pratos.find(p => p.id === pratoId)
    if (!prato?.ingredientes?.length) return
    setIngredientes(prev => prev.map(ing => {
      const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
      if (!linha) return ing
      const ajuste = fromBase(linha.quantidade, ing.unidade) * diff
      const updated = { ...ing, quantidadeEstoque: ing.quantidadeEstoque - ajuste }
      if (auth.userId) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: updated.quantidadeEstoque }).eq('id', ing.id))
      return updated
    }))
  }

  function buscarVendasDia(pratoId, data) {
    const reg = registrosVendas.find(r => r.pratoId === pratoId && r.data === data)
    return reg ? reg.quantidade : 0
  }

  // ── Entradas de Vendas ────────────────────────────────────────────────
  function adicionarEntradaVenda(pratoId, quantidade, garconId, extrasUnit = 0, extrasCustoUnit = 0, custoPratoUnit = null, ingredientesSnapshot = null, precoVendaUnit = null) {
    const nova = {
      id: crypto.randomUUID(), pratoId,
      data: hojeBrasilia(),
      hora: horaAtual(),
      quantidade: Number(quantidade),
      garconId: garconId || null,
      extrasUnit: Number(extrasUnit) || 0,
      extrasCustoUnit: Number(extrasCustoUnit) || 0,
      custoPratoUnit: custoPratoUnit !== null ? Number(custoPratoUnit) : null,
      ingredientesSnapshot: ingredientesSnapshot || null,
      precoVendaUnit: precoVendaUnit !== null ? Number(precoVendaUnit) : null,
    }
    setEntradasVendas(prev => [...prev, nova])
    if (auth.userId) sbWrite(supabase.from('entradas_vendas').insert(entradaVendaToRow(nova, auth.userId)))
  }

  function removerEntradaVenda(id) {
    const entrada = entradasVendas.find(e => e.id === id)
    if (!entrada) return
    setEntradasVendas(prev => prev.filter(e => e.id !== id))
    if (auth.userId) sbWrite(supabase.from('entradas_vendas').delete().eq('id', id).eq('user_id', auth.userId))

    const qtdAtual = buscarVendasDia(entrada.pratoId, entrada.data)
    const novaQtd = Math.max(0, qtdAtual - entrada.quantidade)
    if (novaQtd < qtdAtual) registrarVendas(entrada.pratoId, entrada.data, novaQtd)

    const pedidoVinculado = pedidos.find(p =>
      p.data === entrada.data &&
      p.hora === entrada.hora &&
      p.itens?.some(i => i.pratoId === entrada.pratoId)
    )
    if (pedidoVinculado) {
      setPedidos(prev => prev.filter(p => p.id !== pedidoVinculado.id))
      if (auth.userId) sbWrite(supabase.from('pedidos').delete().eq('id', pedidoVinculado.id).eq('user_id', auth.userId))
      if (pedidoVinculado.mesaId) {
        setMesas(prev => prev.map(m => {
          if (m.id !== pedidoVinculado.mesaId) return m
          const updated = { ...m, status: 'livre', inicioSessao: null, nomeCliente: null }
          if (auth.userId) sbWrite(supabase.from('mesas').update(mesaToRow(updated, auth.userId)).eq('id', m.id))
          return updated
        }))
      }
    }
  }

  // ── Cardápio Digital Config ───────────────────────────────────────────
  function atualizarCardapioConfig(cfg) {
    setCardapioConfig(prev => {
      const novo = { ...prev, ...cfg }
      if (auth.userId) sbWrite(supabase.from('cardapio_config').upsert({ user_id: auth.userId, config: novo }, { onConflict: 'user_id' }))
      return novo
    })
  }

  async function definirSlugCardapio(novoSlug) {
    const slug = novoSlug.trim().toLowerCase()
    if (!slug) return { erro: 'O slug não pode ser vazio.' }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug) && !/^[a-z0-9]{3,30}$/.test(slug))
      return { erro: 'Use apenas letras minúsculas, números e hífens (3–30 caracteres).' }

    // Verifica se slug já existe para outro usuário
    const { data: existente } = await supabase.from('menu_slugs').select('user_id').eq('slug', slug).maybeSingle()
    if (existente && existente.user_id !== auth.userId) return { erro: `O slug "${slug}" já está em uso.` }

    // Remove slug antigo
    const slugAtual = cardapioConfig.slugCardapio
    if (slugAtual && slugAtual !== slug) {
      await supabase.from('menu_slugs').delete().eq('slug', slugAtual)
    }

    // Registra novo slug
    const { error } = await supabase.from('menu_slugs').upsert({ slug, user_id: auth.userId })
    if (error) return { erro: 'Erro ao salvar slug.' }

    setCardapioConfig(prev => {
      const novo = { ...prev, slugCardapio: slug }
      sbWrite(supabase.from('cardapio_config').upsert({ user_id: auth.userId, config: novo }, { onConflict: 'user_id' }))
      return novo
    })
    return { ok: true }
  }

  // ── Kanban Config ─────────────────────────────────────────────────────
  function atualizarKanbanConfig(cfg) {
    setKanbanConfig(prev => {
      const novo = { ...prev, ...cfg }
      if (auth.userId) sbWrite(supabase.from('kanban_config').upsert({ user_id: auth.userId, config: novo }, { onConflict: 'user_id' }))
      return novo
    })
  }

  function _gerarToken() { return crypto.randomUUID().replace(/-/g, '').slice(0, 16) }

  function gerarTokenCozinha() {
    const token = _gerarToken()
    atualizarKanbanConfig({ cozinhaToken: token })
    return token
  }
  function gerarTokenCaixa() {
    const token = _gerarToken()
    atualizarKanbanConfig({ caixaToken: token })
    return token
  }
  function gerarTokenTelao() {
    const token = _gerarToken()
    atualizarKanbanConfig({ telaoToken: token })
    return token
  }
  function gerarTokenPedidosDisplay() {
    const token = _gerarToken()
    atualizarKanbanConfig({ pedidosDisplayToken: token })
    return token
  }

  // ── Configuração Geral ────────────────────────────────────────────────
  function atualizarConfiguracaoGeral(dados) {
    setConfiguracaoGeral(prev => {
      const novo = { ...prev, ...dados }
      if (auth.userId) sbWrite(supabase.from('configuracao_geral').upsert({ user_id: auth.userId, estoque_minimo_padrao: novo.estoqueMinimoPadrao || 0 }, { onConflict: 'user_id' }))
      return novo
    })
  }

  // ── Pagamentos Config ─────────────────────────────────────────────────
  function atualizarPagamentosConfig(dados) {
    setPagamentosConfig(prev => {
      const novo = { ...prev, ...dados }
      if (auth.userId) sbWrite(supabase.from('pagamentos_config').upsert({ user_id: auth.userId, config: novo }, { onConflict: 'user_id' }))
      return novo
    })
  }

  // ── Delivery Config ───────────────────────────────────────────────────
  function atualizarConfiguracaoDelivery(dados) {
    setConfiguracaoDelivery(prev => {
      const novo = { ...prev, ...dados }
      if (auth.userId) sbWrite(supabase.from('config_delivery').upsert(deliveryConfigToRow(novo, auth.userId), { onConflict: 'user_id' }))
      return novo
    })
  }

  async function definirSlugDelivery(novoSlug) {
    const slug = novoSlug.trim().toLowerCase()
    if (!slug) return { erro: 'O slug não pode ser vazio.' }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug) && !/^[a-z0-9]{3,30}$/.test(slug))
      return { erro: 'Use apenas letras minúsculas, números e hífens (3–30 caracteres).' }

    const { data: existente } = await supabase.from('delivery_slugs').select('user_id').eq('slug', slug).maybeSingle()
    if (existente && existente.user_id !== auth.userId) return { erro: `O slug "${slug}" já está em uso.` }

    const slugAtual = configuracaoDelivery.slugDelivery
    if (slugAtual && slugAtual !== slug) {
      await supabase.from('delivery_slugs').delete().eq('slug', slugAtual)
    }

    const { error } = await supabase.from('delivery_slugs').upsert({ slug, user_id: auth.userId })
    if (error) return { erro: 'Erro ao salvar slug.' }

    setConfiguracaoDelivery(prev => {
      const novo = { ...prev, slugDelivery: slug }
      sbWrite(supabase.from('config_delivery').upsert(deliveryConfigToRow(novo, auth.userId), { onConflict: 'user_id' }))
      return novo
    })
    return { ok: true }
  }

  function adicionarBairro({ nome, frete }) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), frete: Number(frete) || 0, ativo: true }
    setConfiguracaoDelivery(prev => {
      const updated = { ...prev, bairros: [...(prev.bairros || []), novo] }
      if (auth.userId) sbWrite(supabase.from('config_delivery').upsert(deliveryConfigToRow(updated, auth.userId), { onConflict: 'user_id' }))
      return updated
    })
  }

  function editarBairro(id, dados) {
    setConfiguracaoDelivery(prev => {
      const updated = { ...prev, bairros: (prev.bairros || []).map(b => b.id === id ? { ...b, ...dados } : b) }
      if (auth.userId) sbWrite(supabase.from('config_delivery').upsert(deliveryConfigToRow(updated, auth.userId), { onConflict: 'user_id' }))
      return updated
    })
  }

  function removerBairro(id) {
    setConfiguracaoDelivery(prev => {
      const updated = { ...prev, bairros: (prev.bairros || []).filter(b => b.id !== id) }
      if (auth.userId) sbWrite(supabase.from('config_delivery').upsert(deliveryConfigToRow(updated, auth.userId), { onConflict: 'user_id' }))
      return updated
    })
  }

  // ── Lista de Compras ──────────────────────────────────────────────────
  function gerarListaComprasAutomatica() {
    const minPadrao = configuracaoGeral.estoqueMinimoPadrao || 0
    const novos = ingredientes
      .filter(ing => ing.quantidadeEstoque <= (ing.estoqueMinimo ?? minPadrao))
      .map(ing => ({
        id: crypto.randomUUID(),
        ingredienteId: ing.id,
        nome: ing.nome,
        unidade: ing.unidade,
        quantidade: Math.max(1, (ing.estoqueMinimo ?? minPadrao) - ing.quantidadeEstoque),
        observacao: '',
        checked: false,
      }))
    setListaCompras(novos)
    if (auth.userId) {
      sbWrite(supabase.from('lista_compras').delete().eq('user_id', auth.userId))
      if (novos.length) sbWrite(supabase.from('lista_compras').insert(novos.map(i => listaCompraToRow(i, auth.userId))))
    }
    return novos
  }

  function adicionarItemLista(item) {
    const novo = { ...item, id: crypto.randomUUID(), checked: false }
    setListaCompras(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('lista_compras').insert(listaCompraToRow(novo, auth.userId)))
  }

  function toggleItemLista(id) {
    setListaCompras(prev => prev.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, checked: !i.checked }
      if (auth.userId) sbWrite(supabase.from('lista_compras').update({ checked: updated.checked }).eq('id', id))
      return updated
    }))
  }

  function editarItemLista(id, dados) {
    setListaCompras(prev => prev.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, ...dados }
      if (auth.userId) sbWrite(supabase.from('lista_compras').update(listaCompraToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerItemLista(id) {
    setListaCompras(prev => prev.filter(i => i.id !== id))
    if (auth.userId) sbWrite(supabase.from('lista_compras').delete().eq('id', id).eq('user_id', auth.userId))
  }

  // ── Garçons ───────────────────────────────────────────────────────────
  function adicionarGarcon(nome) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), token: crypto.randomUUID().replace(/-/g, '').slice(0, 12) }
    setGarcons(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('garcons').insert(garconToRow(novo, auth.userId)))
    return novo
  }

  function removerGarcon(id) {
    setGarcons(prev => prev.filter(g => g.id !== id))
    setPedidos(prev => prev.filter(p => p.garconId !== id))
    if (auth.userId) sbWrite(supabase.from('garcons').delete().eq('id', id).eq('user_id', auth.userId))
  }

  // ── Clientes ──────────────────────────────────────────────────────────
  function adicionarCliente({ nome, telefone, aniversario } = {}) {
    // aceita também string legada: adicionarCliente('Nome')
    if (typeof arguments[0] === 'string') return adicionarCliente({ nome: arguments[0] })
    const uid = auth.userId || displayUserId
    const novo = { id: crypto.randomUUID(), nome: (nome || '').trim(), telefone: telefone?.trim() || null, aniversario: aniversario || null, criadoEm: agoraBrasiliaISO() }
    setClientes(prev => [...prev, novo])
    if (uid) sbWrite(supabase.from('clientes').insert(clienteToRow(novo, uid)))
    return novo
  }

  function editarCliente(id, updates) {
    const uid = auth.userId || displayUserId
    setClientes(prev => prev.map(c => {
      if (c.id !== id) return c
      const updated = { ...c, ...updates }
      if (uid) sbWrite(supabase.from('clientes').update(clienteToRow(updated, uid)).eq('id', id))
      return updated
    }))
  }

  function removerCliente(id) {
    const uid = auth.userId || displayUserId
    setClientes(prev => prev.filter(c => c.id !== id))
    if (uid) sbWrite(supabase.from('clientes').delete().eq('id', id).eq('user_id', uid))
  }

  // ── Caixa Inicial ─────────────────────────────────────────────────────
  function registrarCaixaInicial(data, valor) {
    setCaixaInicialState(prev => {
      const ex = prev.find(c => c.data === data)
      if (ex) {
        const updated = { ...ex, valor: Number(valor) }
        if (auth.userId) sbWrite(supabase.from('caixa_inicial').update({ valor: Number(valor) }).eq('id', ex.id))
        return prev.map(c => c.data === data ? updated : c)
      }
      const novo = { id: crypto.randomUUID(), data, valor: Number(valor) }
      if (auth.userId) sbWrite(supabase.from('caixa_inicial').insert(caixaInicialToRow(novo, auth.userId)))
      return [...prev, novo]
    })
  }

  function getCaixaInicial(data) {
    return caixaInicial.find(c => c.data === data)?.valor ?? null
  }

  function getCaixaInicialPeriodo(dataInicio) {
    return getCaixaInicial(dataInicio) ?? 0
  }

  // ── Movimentos de Caixa (Sangrias / Suprimentos) ──────────────────────
  function adicionarMovimentoCaixa(data, hora, tipo, valor, descricao) {
    const novo = { id: crypto.randomUUID(), data, hora: hora || null, tipo, valor: Number(valor), descricao: descricao || '' }
    setMovimentosCaixa(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('movimentos_caixa').insert(movimentoCaixaToRow(novo, auth.userId)))
    return novo
  }

  function removerMovimentoCaixa(id) {
    setMovimentosCaixa(prev => prev.filter(m => m.id !== id))
    if (auth.userId) sbWrite(supabase.from('movimentos_caixa').delete().eq('id', id).eq('user_id', auth.userId))
  }

  function getMovimentosCaixaDia(data) {
    return movimentosCaixa.filter(m => m.data === data)
  }

  // ── Pedidos ───────────────────────────────────────────────────────────
  function adicionarPedido(garconId, itens, obs, mesaId = null, clienteId = null) {
    const uid = auth.userId || displayUserId
    const dataAtual = hojeBrasilia()
    const hora = horaAtual()
    const agora = agoraBrasiliaISO()
    const itensComCusto = itens.map(item => ({
      ...item,
      opcoes: (item.opcoes || []).map(o => {
        if (!o.ingredienteId) return o
        const ing = ingredientes.find(i => i.id === o.ingredienteId)
        const fator = ing?.fatorCorrecao > 0 ? ing.fatorCorrecao : 1
        return { ...o, custoUnitario: ing ? (ing.preco || 0) * fator : 0 }
      })
    }))
    const pedido = {
      id: crypto.randomUUID(), garconId,
      itens: itensComCusto, obs: obs || '',
      mesaId: mesaId || null,
      clienteId: clienteId || null,
      data: dataAtual,
      hora,
      status: 'novo',
      pago: false,
      cancelado: false,
      timestamps: { novo: agora, preparando: null, completo: null },
    }
    if (mesaId) {
      setMesas(prev => prev.map(m => {
        if (m.id !== mesaId) return m
        const updated = { ...m, status: 'ocupada', inicioSessao: m.inicioSessao || agoraBrasiliaISO() }
        if (uid) sbWrite(supabase.from('mesas').update(mesaToRow(updated, uid)).eq('id', m.id))
        return updated
      }))
    }
    setPedidos(prev => [...prev, pedido])
    if (uid) sbWrite(supabase.from('pedidos').insert(pedidoToRow(pedido, uid)))

    itensComCusto.forEach(({ pratoId, quantidade, opcoes }) => {
      const extrasUnit = (opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
      const extrasCustoUnit = custoOpcoes(opcoes || [], ingredientes)
      const prato = pratos.find(p => p.id === pratoId)
      const custoPratoUnit = prato ? custoPrato(prato, ingredientes) : 0
      const ingredientesSnapshot = prato?.ingredientes?.length
        ? prato.ingredientes.map(linha => {
            const ing = ingredientes.find(i => i.id === linha.ingredienteId)
            if (!ing) return null
            return { ingredienteId: linha.ingredienteId, custo: precoPorBase(ing) * linha.quantidade }
          }).filter(Boolean)
        : null
      const atual = registrosVendas.find(r => r.pratoId === pratoId && r.data === dataAtual)
      registrarVendas(pratoId, dataAtual, (atual?.quantidade || 0) + quantidade)
      const precoVendaUnit = prato ? (prato.precoVenda || 0) : 0
      adicionarEntradaVenda(pratoId, quantidade, garconId, extrasUnit, extrasCustoUnit, custoPratoUnit, ingredientesSnapshot, precoVendaUnit)
    })

    itensComCusto.forEach(({ opcoes, quantidade }) => {
      if (!opcoes?.length) return
      setIngredientes(prev => prev.map(ing => {
        const total = opcoes.reduce((s, o) => {
          if (o.ingredienteId !== ing.id || !o.quantidadeUsada) return s
          return s + o.quantidadeUsada * quantidade
        }, 0)
        if (total === 0) return ing
        const updated = { ...ing, quantidadeEstoque: ing.quantidadeEstoque - total }
        if (auth.userId) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: updated.quantidadeEstoque }).eq('id', ing.id))
        return updated
      }))
    })

    // Baixar estoque proporcional para produtos com variação (½, ⅓)
    itensComCusto.forEach(({ pratoId, quantidade, variacoes }) => {
      if (!variacoes?.length) return
      const fator = 1 / variacoes.length // ½ para 2 sabores, ⅓ para 3
      variacoes.forEach(v => {
        const subPrato = pratos.find(p => p.id === v.pratoId)
        if (!subPrato?.ingredientes?.length) return
        setIngredientes(prev => prev.map(ing => {
          const linha = subPrato.ingredientes.find(l => l.ingredienteId === ing.id)
          if (!linha) return ing
          const deduct = fromBase(linha.quantidade, ing.unidade) * quantidade * fator
          const upd = { ...ing, quantidadeEstoque: ing.quantidadeEstoque - deduct }
          if (uid) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: upd.quantidadeEstoque }).eq('id', ing.id))
          return upd
        }))
      })
    })

    return pedido
  }

  // ── Mesas ─────────────────────────────────────────────────────────────
  function adicionarMesa(nome, capacidade) {
    const nova = { id: crypto.randomUUID(), nome: nome.trim(), capacidade: Number(capacidade) || 4, status: 'livre', inicioSessao: null, nomeCliente: null }
    setMesas(prev => [...prev, nova])
    if (auth.userId) sbWrite(supabase.from('mesas').insert(mesaToRow(nova, auth.userId)))
    return nova
  }

  function editarMesa(id, dados) {
    setMesas(prev => prev.map(m => {
      if (m.id !== id) return m
      const updated = { ...m, ...dados }
      if (auth.userId) sbWrite(supabase.from('mesas').update(mesaToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerMesa(id) {
    setMesas(prev => prev.filter(m => m.id !== id))
    if (auth.userId) sbWrite(supabase.from('mesas').delete().eq('id', id).eq('user_id', auth.userId))
  }

  function setStatusMesa(id, status, nomeCliente = null) {
    const mesa = mesas.find(m => m.id === id)
    if (mesa?.status === 'ocupada' && status === 'livre' && mesa.inicioSessao) {
      const total = pedidos
        .filter(p => p.mesaId === id && !p.cancelado && (p.timestamps?.novo || p.data + 'T' + (p.hora || '00:00') + ':00-03:00') >= mesa.inicioSessao)
        .reduce((s, p) => s + (p.itens || []).reduce((ss, item) => {
          const pr = pratos.find(x => x.id === item.pratoId)
          const extras = (item.opcoes || []).reduce((e, o) => e + (o.precoExtra || 0), 0)
          return ss + ((pr?.precoVenda || 0) + extras) * item.quantidade
        }, 0), 0)
      const sessao = {
        id: crypto.randomUUID(),
        mesaId: id,
        mesaNome: mesa.nome,
        nomeCliente: mesa.nomeCliente || null,
        inicio: mesa.inicioSessao,
        fim: agoraBrasiliaISO(),
        total,
      }
      setSessoesMesas(prev => [...prev, sessao])
      if (auth.userId) sbWrite(supabase.from('sessoes_mesas').insert(sessaoMesaToRow(sessao, auth.userId)))
    }
    setMesas(prev => prev.map(m => {
      if (m.id !== id) return m
      const updated = {
        ...m, status,
        inicioSessao: status === 'ocupada' ? agoraBrasiliaISO() : (status === 'livre' ? null : m.inicioSessao),
        nomeCliente: status === 'ocupada' ? (nomeCliente || null) : (status === 'livre' ? null : m.nomeCliente),
      }
      if (auth.userId) sbWrite(supabase.from('mesas').update(mesaToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function alternarStatusMesa(id) {
    const mesa = mesas.find(m => m.id === id)
    if (!mesa) return
    setStatusMesa(id, mesa.status === 'livre' ? 'ocupada' : 'livre')
  }

  function atualizarStatusPedido(id, status) {
    const uid = auth.userId || displayUserId
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, status, timestamps: { ...p.timestamps, [status]: agoraBrasiliaISO() } }
      if (uid) sbWrite(supabase.from('pedidos').update({ status: updated.status, timestamps: updated.timestamps }).eq('id', id))
      return updated
    }))
  }

  function atribuirMotoboy(pedidoId, motoboyId) {
    const uid = auth.userId || displayUserId
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const updated = { ...p, motoboyId, status: 'saindo', timestamps: { ...p.timestamps, saindo: agoraBrasiliaISO() } }
      if (uid) sbWrite(supabase.from('pedidos').update({ motoboy_id: motoboyId, status: 'saindo', timestamps: updated.timestamps }).eq('id', pedidoId))
      return updated
    }))
  }

  // ── Aceitar pedido delivery: avança para preparando + cria entradas + baixa estoque ──
  function aceitarPedidoDelivery(id) {
    const pedido = pedidos.find(p => p.id === id)
    if (!pedido) return
    // fallback para pedidos não-delivery
    if (pedido.canal !== 'delivery') { atualizarStatusPedido(id, 'preparando'); return }
    // guard: só aceita se ainda está em novo/pendente (evita duplicar entradas em double-click/polling)
    if (pedido.status !== 'novo' && pedido.status !== 'pendente') return

    const uid = auth.userId || displayUserId
    const agora = agoraBrasiliaISO()
    const updated = { ...pedido, status: 'preparando', timestamps: { ...pedido.timestamps, preparando: agora } }
    setPedidos(prev => prev.map(p => p.id === id ? updated : p))
    if (uid) sbWrite(supabase.from('pedidos').update({ status: 'preparando', timestamps: updated.timestamps }).eq('id', id))

    const pedData = pedido.data || hojeBrasilia()
    const pedHora = pedido.hora || horaAtual()

    ;(pedido.itens || []).forEach(item => {
      const prato = pratos.find(x => x.id === item.pratoId)
      if (!prato) return

      const extrasUnit = (item.opcoes || []).reduce((s, o) => s + (Number(o.precoExtra) || Number(o.preco) || 0), 0)
      const custoPratoUnit = custoPrato(prato, ingredientes)
      const precoVendaUnit = item.precoUnit || prato.precoVenda || 0

      const entrada = {
        id: crypto.randomUUID(),
        pratoId: item.pratoId,
        data: pedData,
        hora: pedHora,
        quantidade: item.quantidade,
        garconId: null,
        extrasUnit,
        extrasCustoUnit: 0,
        custoPratoUnit,
        ingredientesSnapshot: null,
        precoVendaUnit,
        canal: 'delivery',
      }
      setEntradasVendas(prev => [...prev, entrada])
      if (uid) sbWrite(supabase.from('entradas_vendas').insert(entradaVendaToRow(entrada, uid)))

      // Registros de vendas
      setRegistrosVendas(prev => {
        const atual = prev.find(r => r.pratoId === item.pratoId && r.data === pedData)
        if (atual) {
          const qtdNova = atual.quantidade + item.quantidade
          if (uid) sbWrite(supabase.from('registros_vendas').update({ quantidade: qtdNova }).eq('id', atual.id))
          return prev.map(r => r.id === atual.id ? { ...r, quantidade: qtdNova } : r)
        }
        const novo = { id: crypto.randomUUID(), pratoId: item.pratoId, data: pedData, quantidade: item.quantidade }
        if (uid) sbWrite(supabase.from('registros_vendas').insert(registroVendaToRow(novo, uid)))
        return [...prev, novo]
      })

      // Baixar estoque dos ingredientes do prato
      const variacoesDoPedido = item.variacoes || (item.variacao ? [item.variacao] : null)
      if (variacoesDoPedido?.length) {
        // Produto com variação (½+½ ou ⅓+⅓+⅓): deduz proporcional de cada sub-prato
        const fator = 1 / variacoesDoPedido.length
        variacoesDoPedido.forEach(vari => {
          const subPrato = pratos.find(p => p.id === vari.pratoId)
          if (!subPrato?.ingredientes?.length) return
          setIngredientes(prev => prev.map(ing => {
            const linha = subPrato.ingredientes.find(l => l.ingredienteId === ing.id)
            if (!linha) return ing
            const deduct = fromBase(linha.quantidade, ing.unidade) * item.quantidade * fator
            const upd = { ...ing, quantidadeEstoque: ing.quantidadeEstoque - deduct }
            if (uid) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: upd.quantidadeEstoque }).eq('id', ing.id))
            return upd
          }))
        })
      } else if (prato.ingredientes?.length) {
        // Produto simples: deduz ingredientes normalmente
        setIngredientes(prev => prev.map(ing => {
          const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
          if (!linha) return ing
          const deduct = fromBase(linha.quantidade, ing.unidade) * item.quantidade
          const upd = { ...ing, quantidadeEstoque: ing.quantidadeEstoque - deduct }
          if (uid) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: upd.quantidadeEstoque }).eq('id', ing.id))
          return upd
        }))
      }
    })
  }

  function marcarEntregue(pedidoId) {
    const uid = auth.userId || displayUserId
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const updated = { ...p, status: 'completo', pago: true, timestamps: { ...p.timestamps, completo: agoraBrasiliaISO() } }
      if (uid) sbWrite(supabase.from('pedidos').update({ status: 'completo', pago: true, timestamps: updated.timestamps }).eq('id', pedidoId))
      return updated
    }))
  }

  function adicionarPedidoDelivery(itens, obs, clienteNome, enderecoEntrega) {
    const dataAtual = hojeBrasilia()
    const hora = horaAtual()
    const agora = agoraBrasiliaISO()
    const itensComCusto = itens.map(item => ({
      ...item,
      opcoes: (item.opcoes || []).map(o => {
        if (!o.ingredienteId) return o
        const ing = ingredientes.find(i => i.id === o.ingredienteId)
        const fator = ing?.fatorCorrecao > 0 ? ing.fatorCorrecao : 1
        return { ...o, custoUnitario: ing ? (ing.preco || 0) * fator : 0 }
      })
    }))
    const pedido = {
      id: crypto.randomUUID(),
      garconId: null,
      itens: itensComCusto,
      obs: obs || '',
      mesaId: null,
      clienteId: null,
      data: dataAtual,
      hora,
      status: 'novo',
      pago: false,
      cancelado: false,
      timestamps: { novo: agora },
      canal: 'delivery',
      clienteNome: clienteNome || null,
      enderecoEntrega: enderecoEntrega || null,
      motoboyId: null,
    }
    setPedidos(prev => [...prev, pedido])
    if (auth.userId) sbWrite(supabase.from('pedidos').insert(pedidoToRow(pedido, auth.userId)))
    return pedido
  }

  function cancelarPedido(id) {
    const pedido = pedidos.find(p => p.id === id)
    if (!pedido || pedido.cancelado) return
    const uid = auth.userId || displayUserId
    if (pedido.status === 'novo') {
      setPedidos(prev => prev.filter(p => p.id !== id))
      if (uid) sbWrite(supabase.from('pedidos').delete().eq('id', id).eq('user_id', uid))

      pedido.itens?.forEach(item => {
        const entrada = entradasVendas.find(e =>
          e.data === pedido.data && e.hora === pedido.hora && e.pratoId === item.pratoId
        )
        if (!entrada) return
        setEntradasVendas(prev => prev.filter(e => e.id !== entrada.id))
        if (uid) sbWrite(supabase.from('entradas_vendas').delete().eq('id', entrada.id).eq('user_id', uid))

        setRegistrosVendas(prev => {
          const reg = prev.find(r => r.pratoId === item.pratoId && r.data === pedido.data)
          if (!reg) return prev
          const nova = Math.max(0, reg.quantidade - item.quantidade)
          if (nova > 0) {
            if (uid) sbWrite(supabase.from('registros_vendas').update({ quantidade: nova }).eq('id', reg.id))
            return prev.map(r => r.id === reg.id ? { ...r, quantidade: nova } : r)
          }
          if (uid) sbWrite(supabase.from('registros_vendas').delete().eq('id', reg.id).eq('user_id', uid))
          return prev.filter(r => r.id !== reg.id)
        })

        const prato = pratos.find(p => p.id === item.pratoId)
        if (prato?.ingredientes?.length) {
          setIngredientes(prev => prev.map(ing => {
            const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
            if (!linha) return ing
            const updated = { ...ing, quantidadeEstoque: ing.quantidadeEstoque + fromBase(linha.quantidade, ing.unidade) * item.quantidade }
            if (uid) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: updated.quantidadeEstoque }).eq('id', ing.id))
            return updated
          }))
        }
      })
    } else {
      setPedidos(prev => prev.map(p => {
        if (p.id !== id) return p
        const updated = { ...p, cancelado: true }
        if (uid) sbWrite(supabase.from('pedidos').update({ cancelado: true }).eq('id', id).eq('user_id', uid))
        return updated
      }))

      // Delivery aceito (preparando+): reverter entradas_vendas e estoque
      if (pedido.canal === 'delivery' && ['preparando', 'pronto', 'saindo'].includes(pedido.status)) {
        pedido.itens?.forEach(item => {
          const entrada = entradasVendas.find(e =>
            e.data === pedido.data && e.hora === pedido.hora && e.pratoId === item.pratoId && e.canal === 'delivery'
          )
          if (entrada) {
            setEntradasVendas(prev => prev.filter(e => e.id !== entrada.id))
            if (uid) sbWrite(supabase.from('entradas_vendas').delete().eq('id', entrada.id).eq('user_id', uid))
          }
          const prato = pratos.find(p => p.id === item.pratoId)
          if (prato?.ingredientes?.length) {
            setIngredientes(prev => prev.map(ing => {
              const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
              if (!linha) return ing
              const restored = { ...ing, quantidadeEstoque: ing.quantidadeEstoque + fromBase(linha.quantidade, ing.unidade) * item.quantidade }
              if (uid) sbWrite(supabase.from('ingredientes').update({ quantidade_estoque: restored.quantidadeEstoque }).eq('id', ing.id))
              return restored
            }))
          }
        })
      }
    }
  }

  function marcarPedidoPago(id, formaPagamento) {
    const uid = auth.userId || displayUserId
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, pago: true, formaPagamento: formaPagamento || null }
      if (uid) sbWrite(supabase.from('pedidos').update({ pago: true, forma_pagamento: formaPagamento || null }).eq('id', id).eq('user_id', uid))
      return updated
    }))
    const pedido = pedidos.find(p => p.id === id)
    if (pedido?.mesaId) {
      const outrosSemPagar = pedidos.filter(p => p.mesaId === pedido.mesaId && p.id !== id && !p.pago && !p.cancelado)
      if (outrosSemPagar.length === 0) setStatusMesa(pedido.mesaId, 'livre')
    }
  }

  function pagarMesa(mesaId, formaPagamento) {
    const uid = auth.userId || displayUserId
    const h = hojeBrasilia()
    setPedidos(prev => prev.map(p => {
      if (p.mesaId !== mesaId || p.data !== h || p.pago || p.cancelado) return p
      const updated = { ...p, pago: true, formaPagamento: formaPagamento || null }
      if (uid) sbWrite(supabase.from('pedidos').update({ pago: true, forma_pagamento: formaPagamento || null }).eq('id', p.id).eq('user_id', uid))
      return updated
    }))
    // NÃO libera a mesa aqui — o display decide com "Deixar Livre" / "Manter Ocupada"
  }

  // ── Despesas ──────────────────────────────────────────────────────────
  function adicionarDespesa({ descricao, categoria, valor, data }) {
    const novo = { id: crypto.randomUUID(), descricao: descricao.trim(), categoria, valor: Number(valor), data, criadoEm: agoraBrasiliaISO() }
    setDespesas(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('despesas').insert(despesaToRow(novo, auth.userId)))
    return novo
  }

  function editarDespesa(id, dados) {
    setDespesas(prev => prev.map(d => {
      if (d.id !== id) return d
      const updated = { ...d, ...dados }
      if (auth.userId) sbWrite(supabase.from('despesas').update(despesaToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerDespesa(id) {
    setDespesas(prev => prev.filter(d => d.id !== id))
    if (auth.userId) sbWrite(supabase.from('despesas').delete().eq('id', id).eq('user_id', auth.userId))
  }

  // ── Despesas Fixas ────────────────────────────────────────────────────
  function adicionarDespesaFixa({ descricao, categoria, valor }) {
    const novo = { id: crypto.randomUUID(), descricao: descricao.trim(), categoria, valor: Number(valor), criadoEm: agoraBrasiliaISO() }
    setDespesasFixas(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('despesas_fixas').insert(despesaFixaToRow(novo, auth.userId)))
  }

  function editarDespesaFixa(id, dados) {
    setDespesasFixas(prev => prev.map(d => {
      if (d.id !== id) return d
      const updated = { ...d, ...dados }
      if (auth.userId) sbWrite(supabase.from('despesas_fixas').update(despesaFixaToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerDespesaFixa(id) {
    setDespesasFixas(prev => prev.filter(d => d.id !== id))
    if (auth.userId) sbWrite(supabase.from('despesas_fixas').delete().eq('id', id).eq('user_id', auth.userId))
  }

  // ── Impostos Config ───────────────────────────────────────────────────
  function adicionarImposto({ nome, percentual, base }) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), percentual: Number(percentual), base: base || 'faturamento', criadoEm: agoraBrasiliaISO() }
    setImpostosConfig(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('impostos_config').insert(impostoToRow(novo, auth.userId)))
  }

  function editarImposto(id, dados) {
    setImpostosConfig(prev => prev.map(d => {
      if (d.id !== id) return d
      const updated = { ...d, ...dados }
      if (auth.userId) sbWrite(supabase.from('impostos_config').update(impostoToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerImposto(id) {
    setImpostosConfig(prev => prev.filter(d => d.id !== id))
    if (auth.userId) sbWrite(supabase.from('impostos_config').delete().eq('id', id).eq('user_id', auth.userId))
  }

  // ── Motoboys CRUD ─────────────────────────────────────────────────────
  function adicionarMotoboy({ nome }) {
    const novo = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      token: crypto.randomUUID().replace(/-/g, ''),
      cor: '#f04000',
      ativo: true,
      online: false,
      lat: null,
      lng: null,
      atualizadoEm: null,
    }
    setMotoboys(prev => [...prev, novo])
    if (auth.userId) sbWrite(supabase.from('motoboys').insert(motoboyToRow(novo, auth.userId)))
    return novo
  }

  function editarMotoboy(id, dados) {
    setMotoboys(prev => prev.map(m => {
      if (m.id !== id) return m
      const updated = { ...m, ...dados }
      if (auth.userId) sbWrite(supabase.from('motoboys').update(motoboyToRow(updated, auth.userId)).eq('id', id))
      return updated
    }))
  }

  function removerMotoboy(id) {
    setMotoboys(prev => prev.filter(m => m.id !== id))
    if (auth.userId) sbWrite(supabase.from('motoboys').delete().eq('id', id).eq('user_id', auth.userId))
  }

  const value = {
    tema, alternarTema,
    auth, authLoading, login, logout, cadastrarUsuario, removerUsuario, resetarSenha,
    loading, displayReady,
    ingredientes, adicionarIngrediente, editarIngrediente, removerIngrediente,
    compras, registrarCompra, removerCompra, editarCompra,
    pratos, adicionarPrato, editarPrato, removerPrato,
    registrosVendas, registrarVendas, buscarVendasDia,
    entradasVendas, adicionarEntradaVenda, removerEntradaVenda,
    cardapioConfig, atualizarCardapioConfig, definirSlugCardapio,
    garcons, adicionarGarcon, removerGarcon,
    clientes, adicionarCliente, editarCliente, removerCliente,
    pedidos, adicionarPedido, adicionarPedidoDelivery, atualizarStatusPedido, aceitarPedidoDelivery, atribuirMotoboy, marcarEntregue, marcarPedidoPago, pagarMesa, cancelarPedido,
    caixaInicial, registrarCaixaInicial, getCaixaInicial, getCaixaInicialPeriodo,
    movimentosCaixa, adicionarMovimentoCaixa, removerMovimentoCaixa, getMovimentosCaixaDia,
    mesas, adicionarMesa, editarMesa, removerMesa, setStatusMesa, alternarStatusMesa,
    sessoesMesas,
    kanbanConfig, atualizarKanbanConfig, gerarTokenCozinha, gerarTokenCaixa, gerarTokenTelao, gerarTokenPedidosDisplay,
    configuracaoGeral, atualizarConfiguracaoGeral,
    configuracaoDelivery, atualizarConfiguracaoDelivery, definirSlugDelivery, adicionarBairro, editarBairro, removerBairro,
    listaCompras, gerarListaComprasAutomatica, adicionarItemLista, toggleItemLista, editarItemLista, removerItemLista,
    despesas, adicionarDespesa, editarDespesa, removerDespesa,
    despesasFixas, adicionarDespesaFixa, editarDespesaFixa, removerDespesaFixa,
    impostosConfig, adicionarImposto, editarImposto, removerImposto,
    notifConfig, atualizarNotifConfig,
    pagamentosConfig, atualizarPagamentosConfig,
    perfil, atualizarPerfil,
    alterarSenha,
    motoboys, adicionarMotoboy, editarMotoboy, removerMotoboy,
    notifConfigRef, cardapioConfigRef, ingredientesRef, pedidosRef, configuracaoGeralRef,
    periodoCarregado, carregarPeriodo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
