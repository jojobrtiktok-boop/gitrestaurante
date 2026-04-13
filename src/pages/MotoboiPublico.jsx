import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { MapPin, WifiOff, Navigation, Truck, CheckCircle, Package, User, MapPinned } from 'lucide-react'

const s = {
  page: { minHeight: '100dvh', background: '#0f0f13', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' },
  card: { background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 },
}

export default function MotoboiPublico() {
  const { token } = useParams()
  const [motoboy, setMotoboy] = useState(null)
  const [loja, setLoja] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [ativo, setAtivo] = useState(false)
  const [posicao, setPosicao] = useState(null)
  const [erro, setErro] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [marcando, setMarcando] = useState(null)
  const watchIdRef = useRef(null)
  const intervaloRef = useRef(null)

  useEffect(() => {
    supabase.from('motoboys').select('id, nome, ativo, user_id').eq('token', token).maybeSingle()
      .then(async ({ data }) => {
        setMotoboy(data)
        if (data?.user_id) {
          const { data: cc } = await supabase.from('cardapio_config').select('config').eq('user_id', data.user_id).maybeSingle()
          if (cc?.config) setLoja({ nome: cc.config.nomeRestaurante, logo: cc.config.logo })
        }
        setCarregando(false)
      })
  }, [token])

  // Carrega pedidos atribuídos a este motoboy (status saindo)
  useEffect(() => {
    if (!motoboy?.id) return
    function carregar() {
      supabase.from('pedidos')
        .select('*')
        .eq('motoboy_id', motoboy.id)
        .eq('status', 'saindo')
        .eq('cancelado', false)
        .then(({ data }) => { if (data) setPedidos(data) })
    }
    carregar()
    const interval = setInterval(carregar, 15000)
    return () => clearInterval(interval)
  }, [motoboy?.id])

  // Desativar ao fechar/sair da página
  useEffect(() => {
    function handleUnload() {
      supabase.from('motoboys').update({ online: false }).eq('token', token)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      handleUnload()
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [token])

  async function enviarPosicao(lat, lng) {
    setPosicao({ lat, lng })
    await supabase.from('motoboys').update({
      online: true, lat, lng,
      atualizado_em: new Date().toISOString(),
    }).eq('token', token)
  }

  function ativarRastreamento() {
    if (!navigator.geolocation) { setErro('Seu dispositivo não suporta geolocalização.'); return }
    setErro('')
    navigator.geolocation.getCurrentPosition(async pos => {
      await enviarPosicao(pos.coords.latitude, pos.coords.longitude)
      setAtivo(true)
      watchIdRef.current = navigator.geolocation.watchPosition(
        p => setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude }),
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
      intervaloRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(p =>
          enviarPosicao(p.coords.latitude, p.coords.longitude)
        )
      }, 15000)
    }, () => {
      setErro('Permissão de localização negada. Habilite nas configurações do navegador.')
    }, { enableHighAccuracy: true })
  }

  async function desativar() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    watchIdRef.current = null
    intervaloRef.current = null
    await supabase.from('motoboys').update({ online: false }).eq('token', token)
    setAtivo(false)
    setPosicao(null)
  }

  async function marcarEntregue(pedido) {
    setMarcando(pedido.id)
    const agora = new Date().toISOString()
    const timestamps = { ...(pedido.timestamps || {}), entregue: agora }
    await supabase.from('pedidos').update({
      status: 'entregue',
      pago: true,
      timestamps,
    }).eq('id', pedido.id)
    setPedidos(prev => prev.filter(p => p.id !== pedido.id))
    setMarcando(null)
  }

  if (carregando) return (
    <div style={{ ...s.page, justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #f04000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  if (!motoboy || !motoboy.ativo) return (
    <div style={{ ...s.page, justifyContent: 'center' }}>
      <div style={s.card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WifiOff size={28} color="#ef4444" />
          </div>
          <p style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, margin: 0, textAlign: 'center' }}>Link inválido ou inativo</p>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 0, textAlign: 'center' }}>Solicite um novo link ao estabelecimento.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {loja?.logo
        ? <img src={loja.logo} alt={loja.nome || 'Loja'} style={{ height: 52, maxWidth: 160, marginBottom: 20, objectFit: 'contain', borderRadius: 10 }} />
        : loja?.nome
          ? <p style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 800, margin: '0 0 20px', textAlign: 'center' }}>{loja.nome}</p>
          : <img src="/logo-dark.png" alt="Cheffya" style={{ height: 28, marginBottom: 20, objectFit: 'contain' }} />
      }

      {/* Card rastreamento */}
      <div style={{ ...s.card, alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: ativo ? '#f04000' : '#1a1a22',
          border: `3px solid ${ativo ? 'rgba(240,64,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .3s',
        }}>
          <Navigation size={28} color={ativo ? '#fff' : '#52525b'} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, margin: 0 }}>{motoboy.nome}</p>
          <p style={{ color: ativo ? '#f04000' : '#a1a1aa', fontSize: 13, marginTop: 4, fontWeight: ativo ? 600 : 400 }}>
            {ativo ? 'Rastreamento ativo' : 'Rastreamento desativado'}
          </p>
        </div>

        {ativo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 30, background: 'rgba(240,64,0,0.1)', border: '1px solid rgba(240,64,0,0.3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f04000', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ color: '#f04000', fontSize: 13, fontWeight: 600 }}>Enviando localização</span>
          </div>
        )}

        {posicao && (
          <p style={{ color: '#52525b', fontSize: 11, margin: 0 }}>
            {posicao.lat.toFixed(5)}, {posicao.lng.toFixed(5)}
          </p>
        )}

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, textAlign: 'center', width: '100%' }}>
            {erro}
          </div>
        )}

        {!ativo ? (
          <button onClick={ativarRastreamento} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#f04000', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MapPin size={18} />
            Ativar Rastreamento
          </button>
        ) : (
          <button onClick={desativar} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <WifiOff size={18} />
            Desativar
          </button>
        )}
      </div>

      {/* Entregas pendentes */}
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Truck size={14} color="#f04000" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f04000', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Entregas pendentes
          </span>
          {pedidos.length > 0 && (
            <span style={{ background: '#f04000', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '1px 8px' }}>
              {pedidos.length}
            </span>
          )}
        </div>

        {pedidos.length === 0 ? (
          <div style={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 16px', textAlign: 'center' }}>
            <Package size={32} color="#3a3a44" style={{ marginBottom: 10 }} />
            <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>Nenhuma entrega pendente</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pedidos.map(pedido => {
              const total = (pedido.itens || []).reduce((s, i) => {
                return s + (i.precoVendaUnit || 0) * i.quantidade
              }, 0)
              return (
                <div key={pedido.id} style={{ background: '#1e1e24', border: '1px solid rgba(240,64,0,0.2)', borderLeft: '3px solid #f04000', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Cliente e endereço */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pedido.cliente_nome && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <User size={14} color="#a1a1aa" />
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>{pedido.cliente_nome}</span>
                      </div>
                    )}
                    {pedido.endereco_entrega && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <MapPinned size={14} color="#f04000" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>{pedido.endereco_entrega}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#52525b' }}>{pedido.hora}</span>
                    </div>
                  </div>

                  {/* Itens */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    {(pedido.itens || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#d4d4d8' }}>×{item.quantidade} {item.nome || item.pratoId}</span>
                      </div>
                    ))}
                  </div>

                  {pedido.obs && (
                    <p style={{ fontSize: 12, color: '#d97706', fontStyle: 'italic', margin: 0, background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '6px 10px' }}>
                      {pedido.obs}
                    </p>
                  )}

                  {/* Botão marcar entregue */}
                  <button
                    onClick={() => marcarEntregue(pedido)}
                    disabled={marcando === pedido.id}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                      background: marcando === pedido.id ? '#2a2a32' : '#16a34a',
                      color: marcando === pedido.id ? '#52525b' : '#fff',
                      fontSize: 15, fontWeight: 700, cursor: marcando === pedido.id ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <CheckCircle size={18} />
                    {marcando === pedido.id ? 'Marcando...' : 'Marcar como Entregue'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p style={{ color: '#3a3a44', fontSize: 11, textAlign: 'center', lineHeight: 1.6, margin: '20px 0 0' }}>
        Sua localização é compartilhada com o estabelecimento enquanto o rastreamento estiver ativo.
      </p>
    </div>
  )
}
