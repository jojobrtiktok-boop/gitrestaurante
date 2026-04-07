import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { fromBase } from '../utils/unidades.js'
import { hoje as hojeBrasilia, horaAtual, agoraBrasiliaISO } from '../utils/formatacao.js'
import { custoOpcoes, custoPrato, precoPorBase } from '../utils/calculos.js'

const AppContext = createContext(null)

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

// ── Prefixo de dados por usuário ─────────────────────
function getPrefix() {
  try {
    const a = JSON.parse(localStorage.getItem('rd_auth') || '{}')
    return a?.userId ? `rd_${a.userId.slice(0, 8)}_` : 'rd_'
  } catch { return 'rd_' }
}

const CONFIG_PADRAO = {
  nomeRestaurante: 'Meu Restaurante',
  descricao: '',
  corFundo: '#ffffff',
  corDestaque: '#16a34a',
  corTexto: '#111827',
  mostrarPrecos: true,
  modoClaro: true,
  logo: null,
  ordemCategorias: [],
}

const NOTIF_CONFIG_PADRAO = {
  pushAtivo: false,
  notifVendas: true,
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
  caixaColunasVisiveis: ['novo', 'preparando', 'completo'],
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

export function AppProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const saved = localStorage.getItem('rd_tema')
    if (saved) return JSON.parse(saved)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [auth, setAuth] = useState(() => loadFromStorage('rd_auth', { logado: false, usuario: '', isAdmin: false, userId: null }))

  // ── Dados por usuário (prefixo dinâmico) ──────────
  const [ingredientes, setIngredientes] = useState(() => loadFromStorage(getPrefix() + 'ingredientes', []))
  const [pratos, setPratos] = useState(() => loadFromStorage(getPrefix() + 'pratos', []))
  const [registrosVendas, setRegistrosVendas] = useState(() => loadFromStorage(getPrefix() + 'registros_vendas', []))
  const [entradasVendas, setEntradasVendas] = useState(() => loadFromStorage(getPrefix() + 'entradas_vendas', []))
  const [cardapioConfig, setCardapioConfig] = useState(() => loadFromStorage(getPrefix() + 'cardapio_config', CONFIG_PADRAO))
  const [garcons, setGarcons] = useState(() => loadFromStorage(getPrefix() + 'garcons', []))
  const [clientes, setClientes] = useState(() => loadFromStorage(getPrefix() + 'clientes', []))
  const [pedidos, setPedidos] = useState(() => loadFromStorage(getPrefix() + 'pedidos', []))
  const [compras, setCompras] = useState(() => loadFromStorage(getPrefix() + 'compras', []))
  const [caixaInicial, setCaixaInicialState] = useState(() => loadFromStorage(getPrefix() + 'caixa_inicial', []))
  const [mesas, setMesas] = useState(() => loadFromStorage(getPrefix() + 'mesas', []))
  const [sessoesMesas, setSessoesMesas] = useState(() => loadFromStorage(getPrefix() + 'sessoes_mesas', []))
  const [kanbanConfig, setKanbanConfig] = useState(() => {
    const saved = loadFromStorage(getPrefix() + 'kanban_config', {})
    return { ...KANBAN_CONFIG_PADRAO, ...saved }
  })
  const [configuracaoGeral, setConfiguracaoGeral] = useState(() =>
    loadFromStorage(getPrefix() + 'configuracao_geral', { estoqueMinimoPadrao: 0 })
  )
  const [listaCompras, setListaCompras] = useState(() =>
    loadFromStorage(getPrefix() + 'lista_compras', [])
  )
  const [despesas, setDespesas] = useState(() =>
    loadFromStorage(getPrefix() + 'despesas', [])
  )
  const [despesasFixas, setDespesasFixas] = useState(() =>
    loadFromStorage(getPrefix() + 'despesas_fixas', [])
  )
  const [impostosConfig, setImpostosConfig] = useState(() =>
    loadFromStorage(getPrefix() + 'impostos_config', [])
  )
  const [notifConfig, setNotifConfig] = useState(() =>
    loadFromStorage(getPrefix() + 'notif_config', NOTIF_CONFIG_PADRAO)
  )
  const [perfil, setPerfil] = useState(() =>
    loadFromStorage(getPrefix() + 'perfil', { foto: null, nomeExibicao: '' })
  )

  // Refs for notification callbacks (avoid stale closures)
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

  // ── Supabase Auth — sincroniza sessão ────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) _aplicarSessao(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) _aplicarSessao(session)
      else {
        const novoAuth = { logado: false, usuario: '', isAdmin: false, userId: null }
        setAuth(novoAuth)
        localStorage.setItem('rd_auth', JSON.stringify(novoAuth))
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  function _aplicarSessao(session) {
    const novoAuth = {
      logado: true,
      usuario: session.user.email,
      isAdmin: session.user.user_metadata?.is_admin || false,
      userId: session.user.id,
    }
    setAuth(novoAuth)
    localStorage.setItem('rd_auth', JSON.stringify(novoAuth))
  }

  // ── Migração one-time: rd_* → rd_admin_* ─────────
  useEffect(() => {
    if (localStorage.getItem('rd_migration_v2')) return
    const keys = ['ingredientes', 'pratos', 'registros_vendas', 'entradas_vendas',
      'cardapio_config', 'garcons', 'pedidos', 'compras', 'caixa_inicial',
      'mesas', 'sessoes_mesas', 'kanban_config']
    keys.forEach(k => {
      const old = localStorage.getItem(`rd_${k}`)
      if (old && !localStorage.getItem(`rd_admin_${k}`))
        localStorage.setItem(`rd_admin_${k}`, old)
    })
    localStorage.setItem('rd_migration_v2', '1')
  }, [])

  // ── Migração: congelar preços históricos em entradas antigas ──
  useEffect(() => {
    if (!auth.usuario || !pratos.length) return
    const flagKey = getPrefix() + 'migration_snapshots_v1'
    if (localStorage.getItem(flagKey)) return
    setEntradasVendas(prev => {
      const migrated = prev.map(e => {
        if (e.precoVendaUnit !== null && e.precoVendaUnit !== undefined &&
            e.custoPratoUnit !== null && e.custoPratoUnit !== undefined) return e
        const prato = pratos.find(p => p.id === e.pratoId)
        if (!prato) return e
        const updates = {}
        if (e.precoVendaUnit === null || e.precoVendaUnit === undefined)
          updates.precoVendaUnit = prato.precoVenda || 0
        if (e.custoPratoUnit === null || e.custoPratoUnit === undefined)
          updates.custoPratoUnit = custoPrato(prato, ingredientes)
        if (!e.ingredientesSnapshot && prato.ingredientes?.length) {
          updates.ingredientesSnapshot = prato.ingredientes.map(linha => {
            const ing = ingredientes.find(i => i.id === linha.ingredienteId)
            if (!ing) return null
            return { ingredienteId: linha.ingredienteId, custo: precoPorBase(ing) * linha.quantidade }
          }).filter(Boolean)
        }
        return Object.keys(updates).length ? { ...e, ...updates } : e
      })
      return migrated
    })
    localStorage.setItem(flagKey, '1')
  }, [auth.usuario, pratos, ingredientes])

  // ── Recarregar dados quando usuário muda ──────────
  useEffect(() => {
    if (!auth.usuario) return
    const p = getPrefix()
    setIngredientes(loadFromStorage(p + 'ingredientes', []))
    setPratos(loadFromStorage(p + 'pratos', []))
    setRegistrosVendas(loadFromStorage(p + 'registros_vendas', []))
    setEntradasVendas(loadFromStorage(p + 'entradas_vendas', []))
    setCardapioConfig(loadFromStorage(p + 'cardapio_config', CONFIG_PADRAO))
    setGarcons(loadFromStorage(p + 'garcons', []))
    setClientes(loadFromStorage(p + 'clientes', []))
    setPedidos(loadFromStorage(p + 'pedidos', []))
    setCompras(loadFromStorage(p + 'compras', []))
    setCaixaInicialState(loadFromStorage(p + 'caixa_inicial', []))
    setMesas(loadFromStorage(p + 'mesas', []))
    setSessoesMesas(loadFromStorage(p + 'sessoes_mesas', []))
    setKanbanConfig({ ...KANBAN_CONFIG_PADRAO, ...loadFromStorage(p + 'kanban_config', {}) })
    setConfiguracaoGeral(loadFromStorage(p + 'configuracao_geral', { estoqueMinimoPadrao: 0 }))
    setListaCompras(loadFromStorage(p + 'lista_compras', []))
    setDespesas(loadFromStorage(p + 'despesas', []))
    setDespesasFixas(loadFromStorage(p + 'despesas_fixas', []))
    setImpostosConfig(loadFromStorage(p + 'impostos_config', []))
    setNotifConfig(loadFromStorage(p + 'notif_config', NOTIF_CONFIG_PADRAO))
    setPerfil(loadFromStorage(p + 'perfil', { foto: null, nomeExibicao: '' }))
  }, [auth.usuario])

  // ── Tema ──────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement
    if (tema === 'light') html.classList.add('light')
    else html.classList.remove('light')
    localStorage.setItem('rd_tema', JSON.stringify(tema))
  }, [tema])

  // ── Persistência de auth + usuarios ──────────────
  useEffect(() => { localStorage.setItem('rd_auth', JSON.stringify(auth)) }, [auth])

  // ── Persistência por usuário ──────────────────────
  useEffect(() => { localStorage.setItem(getPrefix() + 'ingredientes', JSON.stringify(ingredientes)) }, [ingredientes, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'pratos', JSON.stringify(pratos)) }, [pratos, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'registros_vendas', JSON.stringify(registrosVendas)) }, [registrosVendas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'entradas_vendas', JSON.stringify(entradasVendas)) }, [entradasVendas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'cardapio_config', JSON.stringify(cardapioConfig)) }, [cardapioConfig, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'garcons', JSON.stringify(garcons)) }, [garcons, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'clientes', JSON.stringify(clientes)) }, [clientes, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'pedidos', JSON.stringify(pedidos)) }, [pedidos, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'compras', JSON.stringify(compras)) }, [compras, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'caixa_inicial', JSON.stringify(caixaInicial)) }, [caixaInicial, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'mesas', JSON.stringify(mesas)) }, [mesas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'sessoes_mesas', JSON.stringify(sessoesMesas)) }, [sessoesMesas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'kanban_config', JSON.stringify(kanbanConfig)) }, [kanbanConfig, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'configuracao_geral', JSON.stringify(configuracaoGeral)) }, [configuracaoGeral, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'lista_compras', JSON.stringify(listaCompras)) }, [listaCompras, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'despesas', JSON.stringify(despesas)) }, [despesas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'despesas_fixas', JSON.stringify(despesasFixas)) }, [despesasFixas, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'impostos_config', JSON.stringify(impostosConfig)) }, [impostosConfig, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'notif_config', JSON.stringify(notifConfig)) }, [notifConfig, auth.usuario])
  useEffect(() => { localStorage.setItem(getPrefix() + 'perfil', JSON.stringify(perfil)) }, [perfil, auth.usuario])

  // ── Sincronização entre abas (cross-tab) ──────────
  // O evento 'storage' só dispara nas OUTRAS abas quando uma aba grava no localStorage.
  // Isso faz o Kanban/Cozinha/Caixa/Vendas atualizarem em tempo real sem F5.
  useEffect(() => {
    function onStorage(e) {
      const p = getPrefix()
      if (!e.key) return
      if (e.key === p + 'pedidos')         setPedidos(loadFromStorage(p + 'pedidos', []))
      if (e.key === p + 'mesas')           setMesas(loadFromStorage(p + 'mesas', []))
      if (e.key === p + 'sessoes_mesas')   setSessoesMesas(loadFromStorage(p + 'sessoes_mesas', []))
      if (e.key === p + 'kanban_config')   setKanbanConfig({ ...KANBAN_CONFIG_PADRAO, ...loadFromStorage(p + 'kanban_config', {}) })
      if (e.key === p + 'registros_vendas') setRegistrosVendas(loadFromStorage(p + 'registros_vendas', []))
      if (e.key === p + 'entradas_vendas') setEntradasVendas(loadFromStorage(p + 'entradas_vendas', []))
      if (e.key === p + 'clientes')        setClientes(loadFromStorage(p + 'clientes', []))
      if (e.key === p + 'garcons')         setGarcons(loadFromStorage(p + 'garcons', []))
      if (e.key === p + 'pratos')          setPratos(loadFromStorage(p + 'pratos', []))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [auth.usuario])

  function alternarTema() { setTema(t => t === 'dark' ? 'light' : 'dark') }

  // ── Auth (Supabase) ───────────────────────────────
  async function login(emailOuUsuario, senha, manterLogado = true) {
    let email = emailOuUsuario.trim()

    // Se não tem @, é username → busca email na tabela profiles
    if (!email.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email.toLowerCase())
        .maybeSingle()
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
    await supabase.auth.signOut()
  }

  async function cadastrarUsuario(email, senha, username) {
    const nomeUsuario = username.trim().toLowerCase()

    // Verificar se username já existe
    const { data: existeUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', nomeUsuario)
      .maybeSingle()
    if (existeUser) return { erro: 'nome_em_uso' }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { username: nomeUsuario, nome_exibicao: username.trim() } },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered'))
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { erro: error.message }
    return { ok: true }
  }

  // Admin: remover usuário via service role (chama edge function ou API)
  function removerUsuario(id) {
    // Implementar via Supabase Admin API quando necessário
    return { ok: true }
  }

  function atualizarNotifConfig(updates) {
    setNotifConfig(prev => ({ ...prev, ...updates }))
  }

  function atualizarPerfil(updates) {
    setPerfil(prev => ({ ...prev, ...updates }))
  }

  // ── Insumos CRUD ──────────────────────────────────────────────
  function adicionarIngrediente(dados) {
    const novo = { ...dados, id: crypto.randomUUID(), criadoEm: agoraBrasiliaISO() }
    setIngredientes(prev => [...prev, novo])
    return novo
  }
  function editarIngrediente(id, dados) {
    setIngredientes(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i))
  }
  function removerIngrediente(id) {
    const emUso = pratos.some(p => p.ingredientes?.some(l => l.ingredienteId === id))
    if (emUso) return { erro: 'Insumo está em uso em uma ou mais receitas. Remova-o das receitas antes de excluir.' }
    setIngredientes(prev => prev.filter(i => i.id !== id))
    return { ok: true }
  }

  // ── Compras / Entrada de Estoque ──────────────────────────────
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

    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      const novoEstoque = estoqueAtual + Number(quantidade)
      const novoPreco = novoEstoque > 0
        ? ((estoqueAtual * precoAtual) + (Number(quantidade) * Number(precoUnitario))) / novoEstoque
        : Number(precoUnitario)
      return { ...ing, quantidadeEstoque: novoEstoque, preco: novoPreco }
    }))
    return compra
  }

  function removerCompra(id) {
    const compra = compras.find(c => c.id === id)
    if (!compra) return
    setCompras(prev => prev.filter(c => c.id !== id))
    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== compra.ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      const estoqueAntes = estoqueAtual - compra.quantidade
      const precoAntes = estoqueAntes > 0
        ? ((precoAtual * estoqueAtual) - (compra.quantidade * compra.precoUnitario)) / estoqueAntes
        : precoAtual
      return { ...ing, quantidadeEstoque: estoqueAntes, preco: Math.max(0, precoAntes) }
    }))
  }

  function editarCompra(id, novosDados) {
    const compraAntiga = compras.find(c => c.id === id)
    if (!compraAntiga) return
    // Reverse old, apply new
    setCompras(prev => prev.map(c => c.id === id ? { ...c, ...novosDados, quantidade: Number(novosDados.quantidade), precoUnitario: Number(novosDados.precoUnitario) } : c))
    setIngredientes(prev => prev.map(ing => {
      if (ing.id !== compraAntiga.ingredienteId) return ing
      const estoqueAtual = ing.quantidadeEstoque || 0
      const precoAtual = ing.preco || 0
      // reverse old
      const estoqueRevertido = estoqueAtual - compraAntiga.quantidade
      const precoRevertido = estoqueRevertido > 0
        ? ((precoAtual * estoqueAtual) - (compraAntiga.quantidade * compraAntiga.precoUnitario)) / estoqueRevertido
        : precoAtual
      // apply new
      const novaQtd = Number(novosDados.quantidade)
      const novoPrecoUnit = Number(novosDados.precoUnitario)
      const novoEstoque = estoqueRevertido + novaQtd
      const novoPreco = novoEstoque > 0
        ? ((Math.max(0, precoRevertido) * estoqueRevertido) + (novaQtd * novoPrecoUnit)) / novoEstoque
        : novoPrecoUnit
      return { ...ing, quantidadeEstoque: novoEstoque, preco: Math.max(0, novoPreco) }
    }))
  }

  // ── Receitas CRUD ─────────────────────────────────────────────
  function adicionarPrato(dados) {
    const novo = { ...dados, id: crypto.randomUUID(), criadoEm: agoraBrasiliaISO() }
    setPratos(prev => [...prev, novo])
    return novo
  }
  function editarPrato(id, dados) {
    setPratos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p))
  }
  function removerPrato(id) {
    setPratos(prev => prev.filter(p => p.id !== id))
    setRegistrosVendas(prev => prev.filter(r => r.pratoId !== id))
    setEntradasVendas(prev => prev.filter(e => e.pratoId !== id))
  }

  // ── Registros de Vendas ───────────────────────────────────────
  function registrarVendas(pratoId, data, quantidade) {
    const novaQtd = Number(quantidade)
    const existente = registrosVendas.find(r => r.pratoId === pratoId && r.data === data)
    const qtdAnterior = existente ? existente.quantidade : 0
    const diff = novaQtd - qtdAnterior
    if (diff === 0) return

    setRegistrosVendas(prev => {
      const ex = prev.find(r => r.pratoId === pratoId && r.data === data)
      if (ex) return prev.map(r => r.pratoId === pratoId && r.data === data ? { ...r, quantidade: novaQtd } : r)
      return [...prev, { id: crypto.randomUUID(), pratoId, data, quantidade: novaQtd }]
    })

    const prato = pratos.find(p => p.id === pratoId)
    if (!prato?.ingredientes?.length) return
    setIngredientes(prev => prev.map(ing => {
      const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
      if (!linha) return ing
      const ajuste = fromBase(linha.quantidade, ing.unidade) * diff
      return { ...ing, quantidadeEstoque: ing.quantidadeEstoque - ajuste }
    }))
  }

  function buscarVendasDia(pratoId, data) {
    const reg = registrosVendas.find(r => r.pratoId === pratoId && r.data === data)
    return reg ? reg.quantidade : 0
  }

  // ── Entradas de Vendas ────────────────────────────────────────
  function adicionarEntradaVenda(pratoId, quantidade, garconId, extrasUnit = 0, extrasCustoUnit = 0, custoPratoUnit = null, ingredientesSnapshot = null, precoVendaUnit = null) {
    const dataAtual = hojeBrasilia()
    const hora = horaAtual()
    setEntradasVendas(prev => [...prev, {
      id: crypto.randomUUID(), pratoId,
      data: dataAtual,
      hora,
      quantidade: Number(quantidade),
      garconId: garconId || null,
      extrasUnit: Number(extrasUnit) || 0,
      extrasCustoUnit: Number(extrasCustoUnit) || 0,
      custoPratoUnit: custoPratoUnit !== null ? Number(custoPratoUnit) : null,
      ingredientesSnapshot: ingredientesSnapshot || null,
      precoVendaUnit: precoVendaUnit !== null ? Number(precoVendaUnit) : null,
    }])
  }
  function removerEntradaVenda(id) {
    const entrada = entradasVendas.find(e => e.id === id)
    if (!entrada) return

    setEntradasVendas(prev => prev.filter(e => e.id !== id))

    const qtdAtual = buscarVendasDia(entrada.pratoId, entrada.data)
    const novaQtd = Math.max(0, qtdAtual - entrada.quantidade)
    if (novaQtd < qtdAtual) {
      registrarVendas(entrada.pratoId, entrada.data, novaQtd)
    }

    const pedidoVinculado = pedidos.find(p =>
      p.data === entrada.data &&
      p.hora === entrada.hora &&
      p.itens?.some(i => i.pratoId === entrada.pratoId)
    )
    if (pedidoVinculado) {
      setPedidos(prev => prev.filter(p => p.id !== pedidoVinculado.id))
      if (pedidoVinculado.mesaId) {
        setMesas(prev => prev.map(m =>
          m.id === pedidoVinculado.mesaId
            ? { ...m, status: 'livre', inicioSessao: null, nomeCliente: null }
            : m
        ))
      }
    }
  }

  // ── Cardápio Digital Config ───────────────────────────────────
  function atualizarCardapioConfig(cfg) {
    setCardapioConfig(prev => ({ ...prev, ...cfg }))
  }

  function definirSlugCardapio(novoSlug) {
    const slug = novoSlug.trim().toLowerCase()
    if (!slug) return { erro: 'O slug não pode ser vazio.' }
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug) && !/^[a-z0-9]{3,30}$/.test(slug))
      return { erro: 'Use apenas letras minúsculas, números e hífens (3–30 caracteres).' }

    // Verifica se já está em uso por outro usuário
    const registro = loadFromStorage('rd_menu_slugs', {})
    const dono = registro[slug]
    if (dono && dono !== auth.usuario) return { erro: `O slug "${slug}" já está em uso.` }

    // Remove slug antigo do registro
    const slugAtual = cardapioConfig.slugCardapio
    if (slugAtual && slugAtual !== slug) {
      delete registro[slugAtual]
    }
    // Registra novo slug
    registro[slug] = auth.usuario
    localStorage.setItem('rd_menu_slugs', JSON.stringify(registro))
    setCardapioConfig(prev => ({ ...prev, slugCardapio: slug }))
    return { ok: true }
  }

  // ── Kanban Config ─────────────────────────────────────────────
  function atualizarKanbanConfig(cfg) {
    setKanbanConfig(prev => ({ ...prev, ...cfg }))
  }
  function gerarTokenCozinha() {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    setKanbanConfig(prev => ({ ...prev, cozinhaToken: token }))
    return token
  }
  function gerarTokenCaixa() {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    setKanbanConfig(prev => ({ ...prev, caixaToken: token }))
    return token
  }
  function gerarTokenTelao() {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    setKanbanConfig(prev => ({ ...prev, telaoToken: token }))
    return token
  }
  function gerarTokenPedidosDisplay() {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    setKanbanConfig(prev => ({ ...prev, pedidosDisplayToken: token }))
    return token
  }

  // ── Configuração Geral ────────────────────────────────────────
  function atualizarConfiguracaoGeral(dados) {
    setConfiguracaoGeral(prev => ({ ...prev, ...dados }))
  }

  // ── Lista de Compras ──────────────────────────────────────────
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
    return novos
  }
  function adicionarItemLista(item) {
    setListaCompras(prev => [...prev, { ...item, id: crypto.randomUUID(), checked: false }])
  }
  function toggleItemLista(id) {
    setListaCompras(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }
  function editarItemLista(id, dados) {
    setListaCompras(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i))
  }
  function removerItemLista(id) {
    setListaCompras(prev => prev.filter(i => i.id !== id))
  }

  // ── Garçons ──────────────────────────────────────────────────
  function adicionarGarcon(nome) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), token: crypto.randomUUID().replace(/-/g, '').slice(0, 12) }
    setGarcons(prev => [...prev, novo])
    return novo
  }
  function removerGarcon(id) {
    setGarcons(prev => prev.filter(g => g.id !== id))
    setPedidos(prev => prev.filter(p => p.garconId !== id))
  }

  // ── Clientes ──────────────────────────────────────────────────
  function adicionarCliente(nome) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), criadoEm: agoraBrasiliaISO() }
    setClientes(prev => [...prev, novo])
    return novo
  }
  function removerCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  // ── Caixa Inicial / Troco ─────────────────────────────────────
  function registrarCaixaInicial(data, valor) {
    setCaixaInicialState(prev => {
      const ex = prev.find(c => c.data === data)
      if (ex) return prev.map(c => c.data === data ? { ...c, valor: Number(valor) } : c)
      return [...prev, { id: crypto.randomUUID(), data, valor: Number(valor) }]
    })
  }
  function getCaixaInicial(data) {
    return caixaInicial.find(c => c.data === data)?.valor ?? null
  }
  function getCaixaInicialPeriodo(dataInicio, dataFim) {
    // Caixa inicial é o valor de abertura do primeiro dia — não soma com os demais
    return getCaixaInicial(dataInicio) ?? 0
  }

  // ── Pedidos ───────────────────────────────────────────────────
  function adicionarPedido(garconId, itens, obs, mesaId = null, clienteId = null) {
    const dataAtual = hojeBrasilia()
    const hora = horaAtual()
    const agora = agoraBrasiliaISO()
    // Snapshot do preço de cada insumo no momento do pedido
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
      timestamps: { novo: agora, preparando: null, completo: null },
    }
    if (mesaId) setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, status: 'ocupada', inicioSessao: m.inicioSessao || agoraBrasiliaISO() } : m))
    setPedidos(prev => [...prev, pedido])
    const data = pedido.data
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
      const atual = registrosVendas.find(r => r.pratoId === pratoId && r.data === data)
      registrarVendas(pratoId, data, (atual?.quantidade || 0) + quantidade)
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
        return { ...ing, quantidadeEstoque: ing.quantidadeEstoque - total }
      }))
    })
    return pedido
  }

  // ── Mesas ─────────────────────────────────────────────────────
  function adicionarMesa(nome, capacidade) {
    const nova = { id: crypto.randomUUID(), nome: nome.trim(), capacidade: Number(capacidade) || 4, status: 'livre', inicioSessao: null, nomeCliente: null }
    setMesas(prev => [...prev, nova])
    return nova
  }
  function editarMesa(id, dados) {
    setMesas(prev => prev.map(m => m.id === id ? { ...m, ...dados } : m))
  }
  function removerMesa(id) {
    setMesas(prev => prev.filter(m => m.id !== id))
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
      setSessoesMesas(prev => [...prev, {
        id: crypto.randomUUID(),
        mesaId: id,
        mesaNome: mesa.nome,
        nomeCliente: mesa.nomeCliente || null,
        inicio: mesa.inicioSessao,
            fim: agoraBrasiliaISO(),
        total,
      }])
    }
    setMesas(prev => prev.map(m => m.id === id ? {
      ...m, status,
          inicioSessao: status === 'ocupada' ? agoraBrasiliaISO() : (status === 'livre' ? null : m.inicioSessao),
      nomeCliente: status === 'ocupada' ? (nomeCliente || null) : (status === 'livre' ? null : m.nomeCliente),
    } : m))
  }
  function alternarStatusMesa(id) {
    const mesa = mesas.find(m => m.id === id)
    if (!mesa) return
    setStatusMesa(id, mesa.status === 'livre' ? 'ocupada' : 'livre')
  }

  function atualizarStatusPedido(id, status) {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      return { ...p, status, timestamps: { ...p.timestamps, [status]: agoraBrasiliaISO() } }
    }))
  }

  function cancelarPedido(id) {
    const pedido = pedidos.find(p => p.id === id)
    if (!pedido || pedido.cancelado) return
    if (pedido.status === 'novo') {
      // Remove pedido e limpa entradas de venda vinculadas
      setPedidos(prev => prev.filter(p => p.id !== id))
      pedido.itens?.forEach(item => {
        const entrada = entradasVendas.find(e =>
          e.data === pedido.data && e.hora === pedido.hora && e.pratoId === item.pratoId
        )
        if (!entrada) return
        setEntradasVendas(prev => prev.filter(e => e.id !== entrada.id))
        setRegistrosVendas(prev => {
          const reg = prev.find(r => r.pratoId === item.pratoId && r.data === pedido.data)
          if (!reg) return prev
          const nova = Math.max(0, reg.quantidade - item.quantidade)
          return nova > 0
            ? prev.map(r => r.id === reg.id ? { ...r, quantidade: nova } : r)
            : prev.filter(r => r.id !== reg.id)
        })
        const prato = pratos.find(p => p.id === item.pratoId)
        if (prato?.ingredientes?.length) {
          setIngredientes(prev => prev.map(ing => {
            const linha = prato.ingredientes.find(l => l.ingredienteId === ing.id)
            if (!linha) return ing
            return { ...ing, quantidadeEstoque: ing.quantidadeEstoque + fromBase(linha.quantidade, ing.unidade) * item.quantidade }
          }))
        }
      })
    } else {
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, cancelado: true } : p))
    }
  }

  function marcarPedidoPago(id) {
    const pedido = pedidos.find(p => p.id === id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, pago: true } : p))
    // Se o pedido é de uma mesa, verifica se todos os outros pedidos da mesa já estão pagos
    if (pedido?.mesaId) {
      const outrosSemPagar = pedidos.filter(p =>
        p.mesaId === pedido.mesaId && p.id !== id && !p.pago && !p.cancelado
      )
      if (outrosSemPagar.length === 0) {
        setStatusMesa(pedido.mesaId, 'livre')
      }
    }
  }

  function pagarMesa(mesaId) {
    const mesa = mesas.find(m => m.id === mesaId)
    if (!mesa) return
    const h = hojeBrasilia()
    setPedidos(prev => prev.map(p =>
      p.mesaId === mesaId && p.data === h && !p.pago && !p.cancelado
        ? { ...p, pago: true }
        : p
    ))
    setStatusMesa(mesaId, 'livre')
  }

  // ── Despesas ──────────────────────────────────────────────────
  function adicionarDespesa({ descricao, categoria, valor, data }) {
    const novo = { id: crypto.randomUUID(), descricao: descricao.trim(), categoria, valor: Number(valor), data, criadoEm: agoraBrasiliaISO() }
    setDespesas(prev => [...prev, novo])
    return novo
  }
  function editarDespesa(id, dados) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d))
  }
  function removerDespesa(id) {
    setDespesas(prev => prev.filter(d => d.id !== id))
  }

  // ── Despesas Fixas Mensais ────────────────────────────────────
  function adicionarDespesaFixa({ descricao, categoria, valor }) {
    const novo = { id: crypto.randomUUID(), descricao: descricao.trim(), categoria, valor: Number(valor), criadoEm: agoraBrasiliaISO() }
    setDespesasFixas(prev => [...prev, novo])
  }
  function editarDespesaFixa(id, dados) {
    setDespesasFixas(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d))
  }
  function removerDespesaFixa(id) {
    setDespesasFixas(prev => prev.filter(d => d.id !== id))
  }

  // ── Impostos Config ───────────────────────────────────────────
  function adicionarImposto({ nome, percentual, base }) {
    const novo = { id: crypto.randomUUID(), nome: nome.trim(), percentual: Number(percentual), base: base || 'faturamento', criadoEm: agoraBrasiliaISO() }
    setImpostosConfig(prev => [...prev, novo])
  }
  function editarImposto(id, dados) {
    setImpostosConfig(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d))
  }
  function removerImposto(id) {
    setImpostosConfig(prev => prev.filter(d => d.id !== id))
  }

  const value = {
    tema, alternarTema,
    auth, login, logout, cadastrarUsuario, removerUsuario, resetarSenha,
    ingredientes, adicionarIngrediente, editarIngrediente, removerIngrediente,
    compras, registrarCompra, removerCompra, editarCompra,
    pratos, adicionarPrato, editarPrato, removerPrato,
    registrosVendas, registrarVendas, buscarVendasDia,
    entradasVendas, adicionarEntradaVenda, removerEntradaVenda,
    cardapioConfig, atualizarCardapioConfig, definirSlugCardapio,
    garcons, adicionarGarcon, removerGarcon,
    clientes, adicionarCliente, removerCliente,
    pedidos, adicionarPedido, atualizarStatusPedido, marcarPedidoPago, pagarMesa, cancelarPedido,
    caixaInicial, registrarCaixaInicial, getCaixaInicial, getCaixaInicialPeriodo,
    mesas, adicionarMesa, editarMesa, removerMesa, setStatusMesa, alternarStatusMesa,
    sessoesMesas,
    kanbanConfig, atualizarKanbanConfig, gerarTokenCozinha, gerarTokenCaixa, gerarTokenTelao, gerarTokenPedidosDisplay,
    configuracaoGeral, atualizarConfiguracaoGeral,
    listaCompras, gerarListaComprasAutomatica, adicionarItemLista, toggleItemLista, editarItemLista, removerItemLista,
    despesas, adicionarDespesa, editarDespesa, removerDespesa,
    despesasFixas, adicionarDespesaFixa, editarDespesaFixa, removerDespesaFixa,
    impostosConfig, adicionarImposto, editarImposto, removerImposto,
    notifConfig, atualizarNotifConfig,
    perfil, atualizarPerfil,
    alterarSenha,
    notifConfigRef, cardapioConfigRef, ingredientesRef, pedidosRef, configuracaoGeralRef,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
