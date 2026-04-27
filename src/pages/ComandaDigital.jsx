import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, Minus, ShoppingBag, X, Check, Clock, Bell } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ModalOpcoes from '../components/ui/ModalOpcoes.jsx'
import SeletorCliente from '../components/ui/SeletorCliente.jsx'
import { hoje } from '../utils/formatacao.js'

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
  const { garcons, pratos, cardapioConfig, adicionarPedido, atualizarStatusPedido, pedidos, mesas, authLoading, displayReady } = useApp()

  const garcon = garcons.find(g => g.token === token)

  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState([]) // [{ uid, pratoId, quantidade, opcoes }]
  const [obs, setObs] = useState('')
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)
  const [pratoOpcoes, setPratoOpcoes] = useState(null)
  const [mesaId, setMesaId] = useState(null)
  const [clienteId, setClienteId] = useState(null)
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Link inválido ou garçon removido.</p>
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
    return s + (p.precoVenda + extras) * i.quantidade
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
    adicionarPedido(garcon.id, carrinho, obs, mesaId, clienteId)
    setCarrinho([])
    setObs('')
    setMesaId(null)
    setClienteId(null)
    setCarrinhoAberto(false)
    setPedidoEnviado(true)
    setTimeout(() => setPedidoEnviado(false), 3000)
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
        {/* Feedback pedido enviado */}
        {pedidoEnviado && (
          <div style={{ background: '#16a34a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Pedido enviado com sucesso!</span>
          </div>
        )}

        {/* ── Prontos para Entregar ── */}
        {prontos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <Bell size={15} color="#16a34a" />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>
                Pronto para Entregar ({prontos.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prontos.map(ped => {
                const mesa = mesas.find(m => m.id === ped.mesaId)
                return (
                  <div key={ped.id} style={{
                    background: 'rgba(22,163,74,0.08)',
                    border: '2px solid #16a34a',
                    borderRadius: 14,
                    padding: '12px 14px',
                    animation: 'pulsarPronto 2s ease-in-out infinite',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>✅ Pronto!</span>
                        {mesa && (
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: '#16a34a22', color: '#16a34a' }}>
                            🪑 {mesa.nome}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: textoSecundario }}>{ped.hora}</span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      {ped.itens.map(item => {
                        const p = pratos.find(x => x.id === item.pratoId)
                        return p ? (
                          <p key={item.uid || item.pratoId} style={{ fontSize: 13, color: textoPrimario, margin: '2px 0', fontWeight: 500 }}>
                            • {p.nome} ×{item.quantidade}
                          </p>
                        ) : null
                      })}
                      {ped.obs && <p style={{ fontSize: 11, color: textoSecundario, fontStyle: 'italic', marginTop: 4 }}>"{ped.obs}"</p>}
                    </div>
                    <button
                      onClick={() => atualizarStatusPedido(ped.id, 'completo')}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                        background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <Check size={15} /> Entreguei
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

        {/* Lista de pratos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {pratosFiltrados.map(prato => {
            const qtd = qtdNoCarrinho(prato.id)
            return (
              <div key={prato.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: bgCard, border: `1px solid ${qtd > 0 ? destaque : border}`, borderRadius: 14, padding: 12, transition: 'border-color .15s' }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: bgHover }}>
                  {prato.foto && <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: textoPrimario, marginBottom: 2 }}>{prato.nome}</p>
                  {prato.descricao && <p style={{ fontSize: 11, color: textoSecundario, lineHeight: 1.4 }}>{prato.descricao}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  {config.mostrarPrecos && (
                    <span style={{ fontWeight: 800, fontSize: 14, color: destaque }}>
                      {prato.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

        {/* Pedidos do dia */}
        {pedidosHoje.length > 0 && (
          <div>
            <style>{`@keyframes pulsarPronto { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)} 50%{box-shadow:0 0 0 8px rgba(22,163,74,0)} }`}</style>
            <p style={{ fontWeight: 700, fontSize: 13, color: textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Pedidos de hoje</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pedidosHoje.filter(p => p.status !== 'pronto').map(ped => {
                const mesa = mesas.find(m => m.id === ped.mesaId)
                const statusMap = {
                  novo:       { label: '🆕 Novo',        bg: '#3b82f622', cor: '#3b82f6' },
                  preparando: { label: '⏳ Preparando',  bg: '#f59e0b22', cor: '#d97706' },
                  completo:   { label: '✓ Entregue',     bg: '#16a34a22', cor: '#16a34a' },
                  cancelado:  { label: '✕ Cancelado',    bg: '#ef444422', cor: '#ef4444' },
                }
                const s = ped.cancelado ? statusMap.cancelado : (statusMap[ped.status] || { label: ped.status, bg: '#3b82f622', cor: '#3b82f6' })
                return (
                  <div key={ped.id} style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} style={{ color: textoSecundario }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: destaque }}>{ped.hora}</span>
                        {mesa && <span style={{ fontSize: 11, fontWeight: 700, color: destaque }}>· {mesa.nome}</span>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.cor }}>
                        {s.label}
                      </span>
                    </div>
                    {ped.itens.map(item => {
                      const p = pratos.find(x => x.id === item.pratoId)
                      return p ? <p key={item.uid || item.pratoId} style={{ fontSize: 13, color: textoSecundario }}>• {p.nome} ×{item.quantidade}</p> : null
                    })}
                    {ped.obs && <p style={{ fontSize: 12, color: textoSecundario, fontStyle: 'italic', marginTop: 4 }}>"{ped.obs}"</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      {totalItens > 0 && !carrinhoAberto && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <button onClick={() => setCarrinhoAberto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: destaque, color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 700, fontSize: 15, boxShadow: `0 4px 20px ${destaque}88` }}>
            <ShoppingBag size={18} />
            Ver pedido ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
            <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 13 }}>
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
                const precoUnit = p.precoVenda + extras
                return (
                  <div key={item.uid} style={{ background: bgHover, borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: textoPrimario, margin: 0 }}>{p.nome}</p>
                        {config.mostrarPrecos && <p style={{ fontSize: 12, color: textoSecundario, margin: 0 }}>{precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => removerItemCarrinho(item.uid, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${destaque}`, background: 'transparent', color: destaque, cursor: 'pointer', fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 15, color: textoPrimario, minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                        <button onClick={() => p.grupos?.length ? adicionarComOpcoes(p) : removerItemCarrinho(item.uid, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: destaque, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                      {config.mostrarPrecos && (
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
    </div>
  )
}
