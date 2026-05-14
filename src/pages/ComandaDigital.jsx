import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, Minus, ShoppingBag, X, Check, Clock, Bell } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ModalOpcoes from '../components/ui/ModalOpcoes.jsx'
import SeletorCliente from '../components/ui/SeletorCliente.jsx'
import { hoje } from '../utils/formatacao.js'
import { imgSrc } from '../utils/storage.js'

function tocarBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.18, 0.36].forEach(delay => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.15)
    })
  } catch {}
}

function pedirNotificacao() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function dispararNotificacao(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🍽️ Pedido Pronto!', { body: msg, icon: '/favicon.ico' })
  }
}

export default function ComandaDigital() {
  const { token } = useParams()
  const { garcons, pratos, clientes, cardapioConfig, adicionarPedido, atualizarStatusPedido, pedidos, mesas, pagarMesa, setStatusMesa, marcarPedidoPago, pagamentosConfig, kanbanConfig, authLoading, displayReady, registrarComissao, registrarCover } = useApp()

  const garcon = garcons.find(g => g.token === token)

  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState([]) // [{ uid, pratoId, quantidade, opcoes }]
  const [obs, setObs] = useState('')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  const pedidoEnviado = !!feedbackMsg
  function mostrarFeedback(msg = 'Pedido enviado com sucesso!') {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(null), 3000)
  }
  const [pratoOpcoes, setPratoOpcoes] = useState(null)
  const [mesaId, setMesaId] = useState(null)
  const [clienteId, setClienteId] = useState(null)
  const [fecharContaInfo, setFecharContaInfo] = useState(null) // { mesaId, mesa, pedidosMesa, total }
  const [comissaoFecharAtiva, setComissaoFecharAtiva] = useState(true)
  const [coverFecharAtivo, setCoverFecharAtivo] = useState(true)
  const [coverFecharQtd, setCoverFecharQtd] = useState(1)
  const prontoIdsRef = useRef(new Set())

  const pedidosHoje = pedidos.filter(p => p.garconId === garcon?.id && p.data === hoje())
    .sort((a, b) => b.hora.localeCompare(a.hora))
  const prontos = pedidosHoje.filter(p => p.status === 'pronto' && !p.pago && !p.cancelado)

  // Detecta novos prontos → som + notificação
  useEffect(() => {
    pedirNotificacao()
  }, [])
  useEffect(() => {
    if (!garcon) return
    prontos.forEach(p => {
      if (!prontoIdsRef.current.has(p.id)) {
        prontoIdsRef.current.add(p.id)
        tocarBeep()
        navigator.vibrate?.([200, 100, 200])
        const mesa = mesas.find(m => m.id === p.mesaId)
        dispararNotificacao(mesa ? `Mesa ${mesa.nome} — pronto para entregar!` : 'Pedido pronto para entregar!')
      }
    })
    // Remove ids que saíram de pronto (foram entregues)
    prontoIdsRef.current.forEach(id => {
      if (!prontos.find(p => p.id === id)) prontoIdsRef.current.delete(id)
    })
  }, [prontos.map(p => p.id).join(',')])

  if (authLoading || !displayReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Carregando...
      </div>
    )
  }

  if (!garcon && !authLoading && displayReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', gap: 12 }}>
        <span style={{ fontSize: 48 }}>❌</span>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Comanda não encontrada</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Link inválido ou garçom removido.</p>
      </div>
    )
  }

  if (!garcon) return null

  const config = cardapioConfig
  const destaque = config.corDestaque || '#16a34a'
  const corHeader = config.corFundo || destaque
  // Luminância do header para calcular cor do texto no header
  const headerLum = (() => { const h = corHeader.replace('#',''); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return (r*299+g*587+b*114)/1000 })()
  const headerTexto = headerLum > 128 ? '#111827' : '#ffffff'
  const headerTextoSec = headerLum > 128 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.65)'
  // Fundo da página fixado pelo modo claro/escuro (igual ao MenuPublico)
  const modoClaro = config.modoClaro !== false
  const fundo = modoClaro ? '#ffffff' : '#0f172a'
  const isEscuro = !modoClaro
  const textoPrimario = modoClaro ? '#111827' : '#ffffff'
  const textoSecundario = modoClaro ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
  const bgCard = modoClaro ? '#ffffff' : 'rgba(255,255,255,0.06)'
  const border = modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.1)'
  const bgHover = modoClaro ? '#f5f5f5' : 'rgba(255,255,255,0.04)'

  const todasCats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
  const ordemSalva = config.ordemCategorias || []
  const catsOrdenadas = [
    ...ordemSalva.filter(c => todasCats.includes(c)),
    ...todasCats.filter(c => !ordemSalva.includes(c)),
  ]
  const categorias = ['Todas', ...catsOrdenadas]

  const pratosFiltrados = pratos
    .filter(p => p.visivelIndividual !== false)
    .filter(p => filtro === 'Todas' || p.categoria === filtro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0)
  const totalPreco = carrinho.reduce((s, i) => {
    const p = pratos.find(x => x.id === i.pratoId)
    if (!p) return s
    const extras = (i.opcoes || []).reduce((ss, o) => ss + (o.precoExtra || 0), 0)
    return s + (i.precoUnit != null ? i.precoUnit : p.precoVenda + extras) * i.quantidade
  }, 0)

  function qtdNoCarrinho(pratoId) {
    return carrinho.filter(i => i.pratoId === pratoId).reduce((s, i) => s + i.quantidade, 0)
  }

  function adicionarPratoSimples(pratoId, delta) {
    setCarrinho(prev => {
      const ex = prev.find(i => i.pratoId === pratoId && !i.opcoes?.length)
      const novaQtd = (ex?.quantidade || 0) + delta
      if (novaQtd <= 0) return prev.filter(i => !(i.pratoId === pratoId && !i.opcoes?.length))
      if (ex) return prev.map(i => i.uid === ex.uid ? { ...i, quantidade: novaQtd } : i)
      return [...prev, { uid: crypto.randomUUID(), pratoId, quantidade: 1, opcoes: [] }]
    })
  }

  function adicionarComOpcoes(prato) {
    setPratoOpcoes(prato)
    setCarrinhoAberto(false)
  }

  function confirmarOpcoes(opcoes, quantidade, variacoes, borda, tamanho) {
    const prato = pratoOpcoes
    let precoUnit = prato.precoVenda || 0
    if (tamanho) {
      // Com tamanho: preço fixo do tamanho (sabores não têm preço próprio)
      precoUnit = tamanho.preco || prato.precoVenda || 0
    } else if (variacoes?.length) {
      const precos = variacoes.map(v => v.preco || prato.precoVenda || 0)
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

  function removerItemCarrinho(uid, delta) {
    setCarrinho(prev => {
      const item = prev.find(i => i.uid === uid)
      if (!item) return prev
      if (item.quantidade + delta <= 0) return prev.filter(i => i.uid !== uid)
      return prev.map(i => i.uid === uid ? { ...i, quantidade: i.quantidade + delta } : i)
    })
  }

  function enviarPedido() {
    if (!carrinho.length) return
    // Auto-propaga cliente da mesa ocupada (se garçom não escolheu cliente manualmente)
    let clienteIdFinal = clienteId
    if (mesaId && !clienteIdFinal) {
      const mesa = mesas.find(m => m.id === mesaId)
      if (mesa?.nomeCliente) {
        const c = clientes?.find(c => c.nome === mesa.nomeCliente)
        clienteIdFinal = c?.id || null
      }
    }
    adicionarPedido(garcon.id, carrinho, obs, mesaId, clienteIdFinal)
    setCarrinho([])
    setObs('')
    setMesaId(null)
    setClienteId(null)
    setCarrinhoAberto(false)
    mostrarFeedback('Pedido enviado com sucesso!')
  }

  return (
    <div style={{ minHeight: '100vh', background: fundo, fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>
      {/* Minimal sticky bar */}
      <div style={{ background: config.corFundo || destaque, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: 14, fontWeight: 800, color: headerTexto, margin: 0 }}>🧾 Comanda — {garcon.nome}</h1>
          <div style={{ fontSize: 12, color: headerTextoSec, flexShrink: 0 }}>
            {pedidosHoje.length} pedido{pedidosHoje.length !== 1 ? 's' : ''} hoje
          </div>
        </div>
      </div>

      {/* Banner + Restaurant Card (igual ao MenuPublico) */}
      <div style={{ position: 'relative' }}>
        {config.banner
          ? <div style={{ height: config.bannerAltura || 200, overflow: 'hidden' }}>
              <img src={config.banner} alt="banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: config.bannerPos || '50% 50%', display: 'block' }} />
            </div>
          : <div style={{ height: config.bannerAltura || 120, background: config.corFundo || destaque }} />
        }

        <div style={{
          background: fundo, borderRadius: '24px 24px 0 0', marginTop: -56,
          position: 'relative', zIndex: 2, paddingTop: 60, paddingBottom: 8,
          textAlign: 'center',
          boxShadow: modoClaro ? '0 -4px 20px rgba(0,0,0,0.08)' : '0 -4px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Logo circle */}
          <div style={{
            position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)',
            width: 76, height: 76, borderRadius: '50%', border: '4px solid ' + fundo,
            overflow: 'hidden', background: config.logo ? 'transparent' : (config.corFundo || destaque),
            boxShadow: '0 4px 18px rgba(0,0,0,0.22)', zIndex: 3,
          }}>
            {config.logo
              ? <img src={config.logo} alt={config.nomeRestaurante} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽️</div>
            }
          </div>
          <p style={{ fontWeight: 800, fontSize: 17, color: textoPrimario, margin: '0 0 2px' }}>{config.nomeRestaurante}</p>
          {config.descricao && <p style={{ fontSize: 13, color: textoSecundario, margin: '0 auto', maxWidth: 320, lineHeight: 1.4 }}>{config.descricao}</p>}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px' }}>
        {/* Feedback */}
        {feedbackMsg && (
          <div style={{ background: '#16a34a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{feedbackMsg}</span>
          </div>
        )}


        {/* ── Fechar Conta por Mesa / Cliente ── */}
        {(kanbanConfig?.garconPodeFecharConta || kanbanConfig?.comissaoGarconAtivo) && (() => {
          function calcTotalGrupo(peds) {
            return peds.reduce((s, p) => s + (p.itens || []).reduce((ss, item) => {
              const prato = pratos.find(x => x.id === item.pratoId)
              const extras = (item.opcoes || []).reduce((e, o) => e + (o.precoExtra || 0), 0)
              return ss + ((item.precoUnit != null ? item.precoUnit : (prato?.precoVenda || 0) + extras)) * item.quantidade
            }, 0), 0)
          }
          // Mesas com pedidos não pagos
          const mesasAbertas = mesas.filter(m =>
            pedidos.some(p => p.mesaId === m.id && p.garconId === garcon.id && !p.pago && !p.cancelado && p.data === hoje())
          )
          // Clientes sem mesa com pedidos não pagos (agrupa por clienteId ou clienteNome)
          const semMesaAtivosFechar = pedidos.filter(p => !p.mesaId && p.garconId === garcon.id && !p.pago && !p.cancelado && p.data === hoje())
          const gruposCliente = {}
          semMesaAtivosFechar.forEach(p => {
            const key = p.clienteId || p.clienteNome || p.id
            if (!gruposCliente[key]) gruposCliente[key] = []
            gruposCliente[key].push(p)
          })
          const clientesAbertos = Object.values(gruposCliente)

          if (mesasAbertas.length === 0 && clientesAbertos.length === 0) return null
          return (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                💳 Fechar Conta
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Mesas */}
                {mesasAbertas.map(m => {
                  const pedidosMesa = pedidos.filter(p =>
                    p.mesaId === m.id && p.garconId === garcon.id && !p.pago && !p.cancelado && p.data === hoje()
                  )
                  const totalMesa = calcTotalGrupo(pedidosMesa)
                  return (
                    <div key={m.id} style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: textoPrimario }}>🪑 {m.nome}</span>
                        <span style={{ fontSize: 11, color: textoSecundario, marginLeft: 6 }}>
                          {pedidosMesa.length} pedido{pedidosMesa.length !== 1 ? 's' : ''}
                          {config.mostrarPrecos ? ` · ${totalMesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                        </span>
                      </div>
                      <button onClick={() => setFecharContaInfo({ mesaId: m.id, mesa: m, pedidosMesa, total: totalMesa })}
                        style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: destaque, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        Fechar Conta
                      </button>
                    </div>
                  )
                })}
                {/* Clientes sem mesa */}
                {clientesAbertos.map(grupo => {
                  const p0 = grupo[0]
                  const nomeLabel = p0.clienteNome || clientes?.find(c => c.id === p0.clienteId)?.nome || 'Cliente'
                  const totalGrupo = calcTotalGrupo(grupo)
                  return (
                    <div key={p0.clienteId || p0.clienteNome || p0.id} style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: textoPrimario }}>👤 {nomeLabel}</span>
                        <span style={{ fontSize: 11, color: textoSecundario, marginLeft: 6 }}>
                          {grupo.length} pedido{grupo.length !== 1 ? 's' : ''}
                          {config.mostrarPrecos ? ` · ${totalGrupo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                        </span>
                      </div>
                      <button onClick={() => setFecharContaInfo({ mesaId: null, mesa: null, pedidosMesa: grupo, total: totalGrupo, nomeCliente: nomeLabel })}
                        style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: destaque, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        Fechar Conta
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: textoSecundario }} />
          <input placeholder="Buscar item..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: 16, paddingTop: 9, paddingBottom: 9, background: bgCard, border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, color: textoPrimario, outline: 'none' }}
          />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 20, scrollbarWidth: 'none' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)}
              style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filtro === cat ? destaque : bgCard, color: filtro === cat ? '#fff' : textoSecundario }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de pratos — agrupada por categoria em "Todas" */}
        {(() => {
          // Monta grupos: se filtro === 'Todas', agrupa por categoria; senão, um único grupo
          const grupos = filtro === 'Todas'
            ? catsOrdenadas
                .map(cat => ({ cat, itens: pratosFiltrados.filter(p => p.categoria === cat) }))
                .filter(g => g.itens.length > 0)
            : [{ cat: null, itens: pratosFiltrados }]

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 32 }}>
              {grupos.map(({ cat, itens }) => {
                // Subtotal do carrinho para esta categoria
                const subtotalCat = cat ? carrinho.reduce((s, ci) => {
                  const p = pratos.find(x => x.id === ci.pratoId)
                  if (!p || p.categoria !== cat) return s
                  const precoUnit = ci.precoUnit != null ? ci.precoUnit : p.precoVenda + (ci.opcoes || []).reduce((ss, o) => ss + (o.precoExtra || 0), 0)
                  return s + precoUnit * ci.quantidade
                }, 0) : 0
                const qtdCat = cat ? carrinho.filter(ci => {
                  const p = pratos.find(x => x.id === ci.pratoId)
                  return p?.categoria === cat
                }).reduce((s, ci) => s + ci.quantidade, 0) : 0

                return (
                  <div key={cat || 'all'} style={{ marginBottom: 20 }}>
                    {/* Header de categoria */}
                    {cat && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${destaque}22` }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: destaque, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          {cat}
                        </span>
                        {qtdCat > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: destaque, background: destaque + '18', borderRadius: 20, padding: '3px 10px' }}>
                            {qtdCat} {qtdCat === 1 ? 'item' : 'itens'}{config.mostrarPrecos && subtotalCat > 0 ? ' · ' + subtotalCat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Itens da categoria */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {itens.map(prato => {
                        const qtd = qtdNoCarrinho(prato.id)
                        return (
                          <div key={prato.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: bgCard, border: `1px solid ${qtd > 0 ? destaque : border}`, borderRadius: 14, padding: 12, transition: 'border-color .15s' }}>
                            <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: bgHover }}>
                              {prato.foto && <img src={imgSrc(prato.foto, 120)} alt={prato.nome} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 14, color: textoPrimario, marginBottom: 2 }}>{prato.nome}</p>
                              {prato.descricao && <p style={{ fontSize: 11, color: textoSecundario, lineHeight: 1.4 }}>{prato.descricao}</p>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                              {config.mostrarPrecos && (
                                <span style={{ fontWeight: 800, fontSize: 14, color: destaque }}>
                                  {prato.tamanhos?.length > 0 ? (() => {
                                    const ps = prato.tamanhos.flatMap(t => (t.variacoes || []).map(v => v.preco || 0)).filter(x => x > 0)
                                    return ps.length > 0 ? 'a partir de ' + Math.min(...ps).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''
                                  })() : prato.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {qtd > 0 && !prato.grupos?.length && !prato.variacoes?.length && !prato.tamanhos?.length && (
                                  <button onClick={() => adicionarPratoSimples(prato.id, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                                    <Minus size={13} />
                                  </button>
                                )}
                                {qtd > 0 && (
                                  <span style={{ fontWeight: 700, fontSize: 14, color: textoPrimario, minWidth: 20, textAlign: 'center' }}>{qtd}</span>
                                )}
                                <button
                                  onClick={() => (prato.grupos?.length || prato.variacoes?.length || prato.tamanhos?.length) ? adicionarComOpcoes(prato) : adicionarPratoSimples(prato.id, 1)}
                                  style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: destaque, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Pedidos do dia */}
        {pedidosHoje.length > 0 && (() => {
          const statusEntregue = kanbanConfig?.etapas?.[kanbanConfig.etapas.length - 1]?.id || 'completo'
          const statusMap = {
            novo:       { label: '🆕 Novo',               bg: '#3b82f622', cor: '#3b82f6' },
            preparando: { label: '⏳ Preparando',          bg: '#f59e0b22', cor: '#d97706' },
            pronto:     { label: '🔔 Pronto para buscar!', bg: '#22c55e22', cor: '#16a34a', pulsar: true },
            [statusEntregue]: { label: '✓ Entregue',      bg: '#16a34a22', cor: '#16a34a' },
            cancelado:  { label: '✕ Cancelado',            bg: '#ef444422', cor: '#ef4444' },
          }
          function getStatus(ped) {
            return ped.cancelado ? statusMap.cancelado : (statusMap[ped.status] || { label: ped.status, bg: '#3b82f622', cor: '#3b82f6' })
          }
          function nomeCliente(ped) {
            return ped.clienteNome || clientes?.find(c => c.id === ped.clienteId)?.nome || null
          }
          function tituloIdentificacao(mesa, nome) {
            if (mesa && nome) return `${mesa.nome} · ${nome}`
            if (mesa) return mesa.nome
            if (nome) return nome
            return null
          }
          function calcTotalPed(ped) {
            return (ped.itens || []).reduce((s, item) => {
              const prato = pratos.find(x => x.id === item.pratoId)
              const preco = (item.precoUnit != null && item.precoUnit > 0) ? item.precoUnit : (prato?.precoVenda || 0)
              return s + preco * item.quantidade
            }, 0)
          }

          // Separa ativos (não pagos, não cancelados) do histórico
          const ativos    = pedidosHoje.filter(p => !p.pago && !p.cancelado)
          const historico = pedidosHoje.filter(p => p.pago || p.cancelado)

          // Agrupa ativos por mesa; sem mesa fica individual
          const gruposMesaMap = {}
          const semMesaAtivos = []
          ativos.forEach(ped => {
            if (ped.mesaId) {
              if (!gruposMesaMap[ped.mesaId]) gruposMesaMap[ped.mesaId] = []
              gruposMesaMap[ped.mesaId].push(ped)
            } else {
              semMesaAtivos.push(ped)
            }
          })
          // Ordena grupos de mesa pelo pedido mais recente (primeiro do array = mais recente pois pedidosHoje já está desc)
          const gruposMesaOrdenados = Object.entries(gruposMesaMap)
            .sort(([,a],[,b]) => b[0].hora.localeCompare(a[0].hora))

          const podeFechar = !!kanbanConfig?.garconPodeFecharConta

          return (
            <div>
              <style>{`@keyframes pulsarPronto { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }`}</style>
              <p style={{ fontWeight: 700, fontSize: 13, color: textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Pedidos de hoje</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Grupos por mesa (só ativos) */}
                {gruposMesaOrdenados.map(([mId, pedsMesa]) => {
                  const mesa = mesas.find(m => m.id === mId)
                  const naoPageos = pedsMesa.filter(p => !p.pago && !p.cancelado)
                  const total = naoPageos.reduce((s, p) => s + calcTotalPed(p), 0)
                  const temPronto = pedsMesa.some(p => p.status === 'pronto' && !p.pago && !p.cancelado)
                  return (
                    <div key={mId} style={{ background: temPronto ? 'rgba(34,197,94,0.08)' : bgCard, border: `1.5px solid ${temPronto ? '#22c55e' : border}`, borderRadius: 14, padding: '12px 14px', animation: temPronto ? 'pulsarPronto 1.5s infinite' : 'none' }}>
                      {/* Cabeçalho da mesa */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {temPronto && <span style={{ fontSize: 14 }}>🔔</span>}
                          <span style={{ fontWeight: 800, fontSize: 14, color: temPronto ? '#16a34a' : destaque }}>{mesa?.nome || 'Mesa'}</span>
                          {(() => {
                            const nomes = [...new Set(pedsMesa.map(p => nomeCliente(p)).filter(Boolean))]
                            return nomes.length > 0 && (
                              <span style={{ fontSize: 12, fontWeight: 600, color: textoSecundario }}>· {nomes.join(', ')}</span>
                            )
                          })()}
                        </div>
                        {config.mostrarPrecos && naoPageos.length > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: textoPrimario }}>
                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                      {/* Pedidos da mesa */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: podeFechar && naoPageos.length > 0 ? 10 : 0 }}>
                        {pedsMesa.map((ped, idx) => {
                          const s = getStatus(ped)
                          const nome = nomeCliente(ped)
                          const isPronto = ped.status === 'pronto' && !ped.pago && !ped.cancelado
                          return (
                            <div key={ped.id} style={{ paddingBottom: idx < pedsMesa.length - 1 ? 8 : 0, borderBottom: idx < pedsMesa.length - 1 ? `1px solid ${border}` : 'none' }}>
                              {/* Header do pedido */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Clock size={11} style={{ color: textoSecundario }} />
                                  <span style={{ fontSize: 12, color: textoSecundario }}>{ped.hora}</span>
                                  {nome && <span style={{ fontSize: 12, fontWeight: 700, color: textoPrimario }}>· {nome}</span>}
                                </div>
                              </div>
                              {/* Itens */}
                              {ped.itens.map(item => {
                                const p = pratos.find(x => x.id === item.pratoId)
                                return p ? <p key={item.uid || item.pratoId} style={{ fontSize: 12, color: textoSecundario, margin: 0 }}>• {p.nome} ×{item.quantidade}</p> : null
                              })}
                              {ped.obs && <p style={{ fontSize: 11, color: textoSecundario, fontStyle: 'italic', margin: '2px 0 0' }}>"{ped.obs}"</p>}
                              {/* Status + botão entregar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.cor }}>{s.label}</span>
                                {isPronto && (
                                  <button
                                    onClick={() => atualizarStatusPedido(ped.id, statusEntregue)}
                                    style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}>
                                    ✓ Marcar como entregue
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {/* Botão Fechar Conta */}
                      {podeFechar && naoPageos.length > 0 && (
                        <button
                          onClick={() => setFecharContaInfo({ mesaId: mId, mesa: mesa || { nome: 'Mesa' }, pedidosMesa: naoPageos, total })}
                          style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none', background: destaque, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          💳 Fechar Conta
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Pedidos sem mesa ativos (individuais) */}
                {semMesaAtivos.map(ped => {
                  const s = getStatus(ped)
                  const nome = nomeCliente(ped)
                  const isPronto = ped.status === 'pronto'
                  return (
                    <div key={ped.id} style={{ background: s.pulsar ? 'rgba(34,197,94,0.08)' : bgCard, border: `1.5px solid ${s.pulsar ? '#22c55e' : border}`, borderRadius: 12, padding: '10px 14px', animation: s.pulsar ? 'pulsarPronto 1.5s infinite' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {s.pulsar && <span style={{ fontSize: 13 }}>🔔</span>}
                          {nome && <span style={{ fontSize: 13, fontWeight: 800, color: s.pulsar ? '#16a34a' : textoPrimario }}>{nome}</span>}
                          <span style={{ fontSize: 11, color: textoSecundario }}>{ped.hora}</span>
                        </div>
                      </div>
                      {ped.itens.map(item => {
                        const p = pratos.find(x => x.id === item.pratoId)
                        return p ? <p key={item.uid || item.pratoId} style={{ fontSize: 12, color: textoSecundario, margin: 0 }}>• {p.nome} ×{item.quantidade}</p> : null
                      })}
                      {ped.obs && <p style={{ fontSize: 12, color: textoSecundario, fontStyle: 'italic', margin: '4px 0 0' }}>"{ped.obs}"</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.cor }}>{s.label}</span>
                        {isPronto && (
                          <button onClick={() => atualizarStatusPedido(ped.id, statusEntregue)}
                            style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}>
                            ✓ Marcar como entregue
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Histórico do dia (pagos/cancelados) */}
                {historico.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4, marginBottom: 2 }}>Histórico de hoje</p>
                    {historico.map(ped => {
                      const s = getStatus(ped)
                      const nome = nomeCliente(ped)
                      const mesa = mesas.find(m => m.id === ped.mesaId)
                      return (
                        <div key={ped.id} style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 10, padding: '8px 12px', opacity: 0.6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            {mesa && <span style={{ fontSize: 12, fontWeight: 700, color: textoSecundario }}>{mesa.nome}</span>}
                            {nome && <span style={{ fontSize: 12, color: textoSecundario }}>· {nome}</span>}
                            <span style={{ fontSize: 11, color: textoSecundario }}>{ped.hora}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: s.bg, color: s.cor, marginLeft: 'auto' }}>{s.label}</span>
                          </div>
                          {ped.itens.map(item => {
                            const p = pratos.find(x => x.id === item.pratoId)
                            return p ? <p key={item.uid || item.pratoId} style={{ fontSize: 11, color: textoSecundario, margin: 0 }}>• {p.nome} ×{item.quantidade}</p> : null
                          })}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Botão flutuante do carrinho */}
      {totalItens > 0 && !carrinhoAberto && (
        <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 20, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setCarrinhoAberto(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', maxWidth: 480,
              padding: '13px 18px', background: destaque, color: '#fff', border: 'none',
              borderRadius: 16, cursor: 'pointer', fontWeight: 700, fontSize: 14,
              boxShadow: `0 4px 20px ${destaque}88`, gap: 8,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={17} />
              <span>Ver pedido</span>
              <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
                {totalItens}
              </span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14 }}>
              {totalPreco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </button>
        </div>
      )}

      {/* Modal de complementos */}
      {pratoOpcoes && (
        <ModalOpcoes
          prato={pratoOpcoes}
          onConfirmar={confirmarOpcoes}
          onFechar={() => setPratoOpcoes(null)}
          corDestaque={destaque}
        />
      )}

      {/* Modal carrinho */}
      {carrinhoAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', background: isEscuro ? '#1e293b' : '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 800, fontSize: 16, color: textoPrimario, margin: 0 }}>🛒 Pedido</h2>
              <button onClick={() => setCarrinhoAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textoSecundario }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {carrinho.map(item => {
                const p = pratos.find(x => x.id === item.pratoId)
                if (!p) return null
                const extras = (item.opcoes || []).reduce((s, o) => s + (o.precoExtra || 0), 0)
                const precoUnit = item.precoUnit != null ? item.precoUnit : p.precoVenda + extras
                const temTamanho = !!item.tamanho
                return (
                  <div key={item.uid} style={{ background: bgHover, borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: textoPrimario, margin: 0 }}>{p.nome}</p>
                        {config.mostrarPrecos && !temTamanho && <p style={{ fontSize: 12, color: textoSecundario, margin: 0 }}>{precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => removerItemCarrinho(item.uid, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer', fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 15, color: textoPrimario, minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                        <button onClick={() => p.grupos?.length ? adicionarComOpcoes(p) : removerItemCarrinho(item.uid, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: destaque, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                      {config.mostrarPrecos && !temTamanho && (
                        <span style={{ fontWeight: 700, color: destaque, width: 70, textAlign: 'right', fontSize: 14 }}>
                          {(precoUnit * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                    </div>
                    {item.opcoes?.length > 0 && (
                      <div style={{ marginTop: 4, paddingLeft: 4 }}>
                        {item.opcoes.map((o, i) => (
                          <p key={i} style={{ fontSize: 11, color: textoSecundario, margin: '1px 0' }}>
                            · {o.nome}{o.precoExtra > 0 ? ` (+${o.precoExtra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Seletor de mesa */}
            {mesas.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: textoSecundario, marginBottom: 8 }}>Mesa</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button onClick={() => setMesaId(null)}
                    style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mesaId === null ? destaque : bgHover, color: mesaId === null ? '#fff' : textoSecundario }}>
                    Sem mesa
                  </button>
                  {mesas.map(m => (
                    <button key={m.id} onClick={() => setMesaId(m.id)}
                      style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: mesaId === m.id ? destaque
                          : m.status === 'ocupada' ? (modoClaro ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.15)')
                          : m.status === 'reservada' ? (modoClaro ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.15)')
                          : bgHover,
                        color: mesaId === m.id ? '#fff'
                          : m.status === 'ocupada' ? '#16a34a'
                          : m.status === 'reservada' ? '#d97706'
                          : textoSecundario }}>
                      {m.nome}{m.status === 'ocupada' ? ' ●' : m.status === 'reservada' ? ' (res.)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Cliente */}
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: textoSecundario, marginBottom: 5 }}>Cliente</p>
              <SeletorCliente clienteId={clienteId} onChange={setClienteId} />
            </div>
            {/* Aviso: pedido vai para conta da mesa (não é conta separada) */}
            {mesaId && clienteId && (() => {
              const mesaSel = mesas.find(m => m.id === mesaId)
              return mesaSel ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '7px 10px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                  ⚠️ Este pedido entra na conta da <strong>{mesaSel.nome}</strong>. Para conta separada, selecione <strong>Sem mesa</strong>.
                </div>
              ) : null
            })()}
            <input placeholder="Observação (ex: sem cebola)..." value={obs} onChange={e => setObs(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: bgHover, border: `1px solid ${border}`, borderRadius: 10, fontSize: 13, color: textoPrimario, outline: 'none', marginBottom: 14 }}
            />

            {config.mostrarPrecos && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '10px 0', borderTop: `1px solid ${border}` }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: textoPrimario }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: destaque }}>
                  {totalPreco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}

            <button onClick={enviarPedido}
              style={{ width: '100%', padding: '14px', background: destaque, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
              ✓ Confirmar pedido
            </button>
          </div>
        </div>
      )}

      {/* Modal Fechar Conta */}
      {fecharContaInfo && (() => {
        const { mesa, pedidosMesa, total, nomeCliente: nomeClienteFechar } = fecharContaInfo
        const todosItens = pedidosMesa.flatMap(p => (p.itens || []).map(item => ({ ...item, _pedidoId: p.id })))
        const comissaoAtiva = kanbanConfig?.comissaoGarconAtivo
        const comissaoValor = comissaoAtiva && garcon.taxaComissao > 0 ? (total * garcon.taxaComissao) / 100 : 0
        const diaSemanaFechar = new Date().getDay()
        const coverHojeFechar = kanbanConfig?.coverAtivo && (kanbanConfig?.coverDias || []).includes(diaSemanaFechar) && (kanbanConfig?.coverValor || 0) > 0
        const formasPag = [
          pagamentosConfig?.dinheiro !== false && { id: 'dinheiro', label: '💵 Dinheiro' },
          pagamentosConfig?.pix !== false && { id: 'pix', label: '📱 Pix' },
          pagamentosConfig?.cartaoCredito !== false && { id: 'cartao_credito', label: '💳 Crédito' },
          pagamentosConfig?.cartaoDebito !== false && { id: 'cartao_debito', label: '💳 Débito' },
        ].filter(Boolean)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={e => e.target === e.currentTarget && setFecharContaInfo(null)}>
            <div style={{ width: '100%', maxWidth: 480, background: isEscuro ? '#1e293b' : '#fff', borderRadius: '20px 20px 0 0', padding: '20px 18px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: textoPrimario, margin: 0 }}>Fechar Conta</p>
                  <p style={{ fontSize: 12, color: textoSecundario, margin: '2px 0 0' }}>{mesa?.nome || nomeClienteFechar || 'Cliente'}</p>
                </div>
                <button onClick={() => setFecharContaInfo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textoSecundario }}>
                  <X size={18} />
                </button>
              </div>

              {/* Itens */}
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {todosItens.map((item, idx) => {
                  const prato = pratos.find(x => x.id === item.pratoId)
                  const nomeItem = prato?.nome || item.ifoodItemName || 'Item'
                  const precoUnit = item.precoUnit != null ? item.precoUnit : (prato?.precoVenda || 0)
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textoPrimario }}>
                      <span>{item.quantidade}× {nomeItem}</span>
                      {config.mostrarPrecos && (
                        <span style={{ color: textoSecundario }}>{(precoUnit * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              {config.mostrarPrecos && (
                <div style={{ paddingTop: 10, borderTop: `1px solid ${border}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: textoPrimario }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: destaque }}>
                      {comissaoAtiva && comissaoValor > 0
                        ? (total + comissaoValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  {comissaoAtiva && comissaoValor > 0 && (
                    <div style={{ fontSize: 11, color: textoSecundario, textAlign: 'right', marginTop: 2 }}>
                      {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} + comissão {comissaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = {(total + comissaoValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  )}
                </div>
              )}

              {/* Comissão */}
              {comissaoAtiva && comissaoValor > 0 && (
                <div style={{ background: comissaoFecharAtiva ? '#f0fdf4' : bgCard, border: `1px solid ${comissaoFecharAtiva ? '#86efac' : border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, color: comissaoFecharAtiva ? '#166534' : textoSecundario }}>
                        🤝 Sua comissão ({garcon.taxaComissao}%)
                      </span>
                      {comissaoFecharAtiva && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginTop: 2 }}>
                          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          {' + '}
                          <strong>{comissaoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      )}
                    </div>
                    {comissaoFecharAtiva ? (
                      <div onClick={() => setComissaoFecharAtiva(v => !v)}
                        style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 5,
                          border: '2px solid #16a34a', background: '#16a34a', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>
                      </div>
                    ) : (
                      <div onClick={() => setComissaoFecharAtiva(v => !v)}
                        style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 5,
                          border: '2px solid #9ca3af', background: 'transparent', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cover */}
              {coverHojeFechar && (
                <div style={{ background: coverFecharAtivo ? '#eff6ff' : bgHover,
                  border: `1px solid ${coverFecharAtivo ? '#bfdbfe' : border}`,
                  borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: coverFecharAtivo ? '#1d4ed8' : textoSecundario, fontWeight: 600 }}>
                      🎟️ Cover — {(kanbanConfig?.coverValor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} p/ pessoa
                    </span>
                    <div onClick={() => setCoverFecharAtivo(v => !v)}
                      style={{ width: 22, height: 22, borderRadius: 5,
                        border: `2px solid ${coverFecharAtivo ? '#3b82f6' : '#9ca3af'}`,
                        background: coverFecharAtivo ? '#3b82f6' : 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {coverFecharAtivo && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                  {coverFecharAtivo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: '#1d4ed8' }}>Pessoas:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setCoverFecharQtd(v => Math.max(1, v - 1))}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8', minWidth: 24, textAlign: 'center' }}>{coverFecharQtd}</span>
                        <button onClick={() => setCoverFecharQtd(v => v + 1)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginLeft: 4 }}>
                        = {((kanbanConfig?.coverValor || 0) * coverFecharQtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Formas de pagamento */}
              <p style={{ fontSize: 12, fontWeight: 700, color: textoSecundario, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Forma de Pagamento</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {formasPag.map(f => (
                  <button key={f.id}
                    onClick={() => {
                      if (fecharContaInfo.mesaId) {
                        pagarMesa(fecharContaInfo.mesaId, f.id)
                        setStatusMesa(fecharContaInfo.mesaId, 'livre')
                        mostrarFeedback(`✓ ${mesa.nome} — conta fechada!`)
                      } else {
                        pedidosMesa.forEach(p => marcarPedidoPago(p.id, f.id))
                        mostrarFeedback(`✓ ${nomeClienteFechar || 'Conta'} — fechada!`)
                      }
                      if (comissaoAtiva && comissaoValor > 0 && garcon) {
                        registrarComissao({
                          garconId: garcon.id,
                          garconNome: garcon.nome,
                          totalBase: fecharContaInfo.total,
                          comissaoValor,
                          taxa: garcon.taxaComissao,
                          mesaId: fecharContaInfo.mesaId || null,
                          mesaNome: fecharContaInfo.mesa?.nome || '',
                          formaPagamento: f.id,
                        })
                      }
                      if (coverHojeFechar && coverFecharAtivo && coverFecharQtd > 0) {
                        registrarCover({ valor: kanbanConfig.coverValor * coverFecharQtd, quantidade: coverFecharQtd, formaPagamento: f.id })
                      }
                      setFecharContaInfo(null)
                    }}
                    style={{ padding: '13px 8px', borderRadius: 12, border: `1.5px solid ${border}`, background: bgHover, color: textoPrimario, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={() => {
                if (fecharContaInfo.mesaId) {
                  pagarMesa(fecharContaInfo.mesaId, null)
                  setStatusMesa(fecharContaInfo.mesaId, 'livre')
                } else {
                  pedidosMesa.forEach(p => marcarPedidoPago(p.id, null))
                }
                if (comissaoAtiva && comissaoValor > 0 && garcon) {
                  registrarComissao({
                    garconId: garcon.id,
                    garconNome: garcon.nome,
                    totalBase: fecharContaInfo.total,
                    comissaoValor,
                    taxa: garcon.taxaComissao,
                    mesaId: fecharContaInfo.mesaId || null,
                    mesaNome: fecharContaInfo.mesa?.nome || '',
                    formaPagamento: null,
                  })
                }
                if (coverHojeFechar && coverFecharAtivo && coverFecharQtd > 0) {
                  registrarCover({ valor: kanbanConfig.coverValor * coverFecharQtd, quantidade: coverFecharQtd, formaPagamento: null })
                }
                setFecharContaInfo(null)
                mostrarFeedback('✓ Conta fechada!')
              }}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textoSecundario, fontSize: 12, cursor: 'pointer' }}>
                Registrar sem forma de pagamento
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
