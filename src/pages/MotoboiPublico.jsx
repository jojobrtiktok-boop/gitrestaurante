import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { MapPin, WifiOff, Navigation, Truck, CheckCircle, Package, User, MapPinned, Clock, Download, Sun, Smartphone } from 'lucide-react'

const s = {
  page: { minHeight: '100dvh', background: '#0f0f13', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' },
  card: { background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 },
}

function tempoDecorrido(iso) {
  if (!iso) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return '< 1min'
  if (mins < 60) return `${mins}min`
  return `${Math.floor(mins / 60)}h ${mins % 60}min`
}

// Detecta iOS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
// Detecta se já está instalado como PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
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
  const [disponiveis, setDisponiveis] = useState([])
  const [marcando, setMarcando] = useState(null)
  const [aceitando, setAceitando] = useState(null)

  // Wake Lock
  const [wakeLockAtivo, setWakeLockAtivo] = useState(false)
  const [wakeLockSuportado] = useState('wakeLock' in navigator)
  const wakeLockRef = useRef(null)

  // PWA Install
  const [installPrompt, setInstallPrompt] = useState(null)
  const [mostrarInstall, setMostrarInstall] = useState(false)
  const [mostrarInstrucoesIOS, setMostrarInstrucoesIOS] = useState(false)
  const [appInstalado, setAppInstalado] = useState(false)

  const watchIdRef = useRef(null)
  const intervaloRef = useRef(null)
  const ativoRef = useRef(false)

  // ── Carrega dados do motoboy ──────────────────────────────────────────────
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

  // ── Pedidos em tempo real ─────────────────────────────────────────────────
  useEffect(() => {
    if (!motoboy?.id) return
    const hoje = new Date().toISOString().slice(0, 10)
    function carregar() {
      supabase.from('pedidos').select('*').eq('motoboy_id', motoboy.id).eq('status', 'saindo').eq('cancelado', false).gte('data', hoje)
        .then(({ data }) => { if (data) setPedidos(data) })
      supabase.from('pedidos').select('*').eq('user_id', motoboy.user_id).eq('canal', 'delivery').eq('status', 'pronto').eq('cancelado', false).is('motoboy_id', null).gte('data', hoje)
        .then(({ data }) => { if (data) setDisponiveis(data) })
    }
    carregar()
    const interval = setInterval(carregar, 5000)
    return () => clearInterval(interval)
  }, [motoboy?.id, motoboy?.user_id])

  // ── Offline: marca offline ao fechar ─────────────────────────────────────
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
      liberarWakeLock()
    }
  }, [token])

  // ── PWA Install prompt (Android Chrome) ──────────────────────────────────
  useEffect(() => {
    // Verifica se já instalado
    if (isPWA()) { setAppInstalado(true); return }

    const handler = e => {
      e.preventDefault()
      setInstallPrompt(e)
      setMostrarInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setAppInstalado(true); setMostrarInstall(false) })

    // iOS: não tem beforeinstallprompt, mostra instrução manual
    if (isIOS() && !isPWA()) setMostrarInstall(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ── Re-adquire Wake Lock quando app volta ao foco ─────────────────────────
  useEffect(() => {
    async function handleVisibility() {
      if (document.visibilityState === 'visible' && ativoRef.current) {
        await adquirirWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // ── Wake Lock ─────────────────────────────────────────────────────────────
  async function adquirirWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      if (wakeLockRef.current) return // já tem
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setWakeLockAtivo(true)
      wakeLockRef.current.addEventListener('release', () => {
        setWakeLockAtivo(false)
        wakeLockRef.current = null
        // Re-adquire automaticamente se ainda estiver ativo
        if (ativoRef.current) setTimeout(adquirirWakeLock, 1000)
      })
    } catch (e) {
      console.warn('[WakeLock]', e.message)
    }
  }

  function liberarWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
    setWakeLockAtivo(false)
  }

  // ── GPS ───────────────────────────────────────────────────────────────────
  async function enviarPosicao(lat, lng) {
    setPosicao({ lat, lng })
    await supabase.from('motoboys').update({ online: true, lat, lng, atualizado_em: new Date().toISOString() }).eq('token', token)
  }

  async function ativarRastreamento() {
    if (!navigator.geolocation) { setErro('Seu dispositivo não suporta geolocalização.'); return }
    setErro('')
    navigator.geolocation.getCurrentPosition(async pos => {
      await enviarPosicao(pos.coords.latitude, pos.coords.longitude)
      setAtivo(true)
      ativoRef.current = true
      // Wake Lock — mantém tela ligada
      await adquirirWakeLock()
      watchIdRef.current = navigator.geolocation.watchPosition(
        p => setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude }),
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
      intervaloRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(p => enviarPosicao(p.coords.latitude, p.coords.longitude))
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
    ativoRef.current = false
    liberarWakeLock()
    await supabase.from('motoboys').update({ online: false }).eq('token', token)
    setAtivo(false)
    setPosicao(null)
  }

  // ── PWA install ───────────────────────────────────────────────────────────
  async function instalarApp() {
    if (isIOS()) { setMostrarInstrucoesIOS(true); return }
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setMostrarInstall(false)
    setInstallPrompt(null)
  }

  // ── Ações de pedido ───────────────────────────────────────────────────────
  async function aceitarEntrega(pedido) {
    setAceitando(pedido.id)
    const agora = new Date().toISOString()
    const timestamps = { ...(pedido.timestamps || {}), saindo: agora }
    await supabase.from('pedidos').update({ motoboy_id: motoboy.id, status: 'saindo', timestamps }).eq('id', pedido.id)
    setDisponiveis(prev => prev.filter(p => p.id !== pedido.id))
    setAceitando(null)
  }

  async function marcarEntregue(pedido) {
    setMarcando(pedido.id)
    const agora = new Date().toISOString()
    const timestamps = { ...(pedido.timestamps || {}), completo: agora }
    await supabase.from('pedidos').update({ status: 'completo', pago: true, timestamps }).eq('id', pedido.id)
    setPedidos(prev => prev.filter(p => p.id !== pedido.id))
    setMarcando(null)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
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
        ? <img src={loja.logo} alt={loja.nome || 'Loja'} style={{ height: 52, maxWidth: 160, marginBottom: 8, objectFit: 'contain', borderRadius: 10 }} />
        : <img src="/logo-dark.png" alt="Cheffya" style={{ height: 28, marginBottom: 8, objectFit: 'contain' }} />
      }
      {loja?.nome && (
        <p style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600, margin: '0 0 20px', textAlign: 'center' }}>{loja.nome}</p>
      )}
      {!loja?.nome && <div style={{ marginBottom: 20 }} />}

      {/* Banner Instalar App */}
      {mostrarInstall && !appInstalado && (
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 12 }}>
          <button
            onClick={instalarApp}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, border: '1.5px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={20} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 700, margin: 0 }}>Instalar App</p>
              <p style={{ color: '#a1a1aa', fontSize: 12, margin: '2px 0 0' }}>
                {isIOS() ? 'Adicionar à tela inicial para melhor experiência' : 'Instale para usar como app nativo'}
              </p>
            </div>
            <Download size={16} color="#3b82f6" />
          </button>

          {/* Instruções iOS */}
          {mostrarInstrucoesIOS && (
            <div style={{ marginTop: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>Como instalar no iPhone:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['1. Toque no ícone de compartilhar ↑ (parte de baixo do Safari)', '2. Role e toque em "Adicionar à Tela de Início"', '3. Toque em "Adicionar" — pronto!'].map((t, i) => (
                  <p key={i} style={{ color: '#a1a1aa', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{t}</p>
                ))}
              </div>
              <button onClick={() => setMostrarInstrucoesIOS(false)}
                style={{ marginTop: 10, background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      )}

      {appInstalado && (
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 12, padding: '10px 16px', borderRadius: 12, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} color="#16a34a" />
          <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>App instalado ✓</span>
        </div>
      )}

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
            {/* Enviando localização */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 30, background: 'rgba(240,64,0,0.1)', border: '1px solid rgba(240,64,0,0.3)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f04000', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              <span style={{ color: '#f04000', fontSize: 13, fontWeight: 600 }}>Enviando localização</span>
            </div>

            {/* Wake Lock: tela acesa */}
            {wakeLockSuportado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 30,
                background: wakeLockAtivo ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${wakeLockAtivo ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <Sun size={13} color={wakeLockAtivo ? '#f59e0b' : '#52525b'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: wakeLockAtivo ? '#f59e0b' : '#52525b' }}>
                  {wakeLockAtivo ? 'Tela permanece acesa' : 'Tela pode apagar'}
                </span>
              </div>
            )}
          </div>
        )}

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, textAlign: 'center', width: '100%' }}>
            {erro}
          </div>
        )}

        {!ativo ? (
          <button onClick={ativarRastreamento} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#f04000', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MapPin size={18} /> Ativar Rastreamento
          </button>
        ) : (
          <button onClick={desativar} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <WifiOff size={18} /> Desativar
          </button>
        )}
      </div>

      {/* Pedidos disponíveis para aceitar */}
      {disponiveis.length > 0 && (
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Package size={14} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Disponíveis para aceitar
            </span>
            <span style={{ background: '#f59e0b', color: '#000', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '1px 8px' }}>
              {disponiveis.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disponiveis.map(pedido => (
              <div key={pedido.id} style={{ background: '#1e1e24', border: '1px solid rgba(245,158,11,0.3)', borderLeft: '3px solid #f59e0b', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedido.cliente_nome && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <User size={14} color="#a1a1aa" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>{pedido.cliente_nome}</span>
                  </div>
                )}
                {pedido.endereco_entrega && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <MapPinned size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>{pedido.endereco_entrega}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(pedido.itens || []).map((item, idx) => (
                    <span key={idx} style={{ fontSize: 13, color: '#d4d4d8' }}>×{item.quantidade} {item.nome || item.pratoId}</span>
                  ))}
                </div>
                <button onClick={() => aceitarEntrega(pedido)} disabled={aceitando === pedido.id}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: aceitando === pedido.id ? '#2a2a32' : '#f59e0b', color: aceitando === pedido.id ? '#52525b' : '#000', fontSize: 15, fontWeight: 700, cursor: aceitando === pedido.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Truck size={18} />
                  {aceitando === pedido.id ? 'Aceitando...' : '🛵 Aceitar Entrega'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entregas em andamento */}
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Truck size={14} color="#f04000" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f04000', textTransform: 'uppercase', letterSpacing: '.05em' }}>Em andamento</span>
          {pedidos.length > 0 && (
            <span style={{ background: '#f04000', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '1px 8px' }}>{pedidos.length}</span>
          )}
        </div>

        {pedidos.length === 0 ? (
          <div style={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 16px', textAlign: 'center' }}>
            <Package size={32} color="#3a3a44" style={{ marginBottom: 10 }} />
            <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>Nenhuma entrega em andamento</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pedidos.map(pedido => {
              const tempoSaindo = pedido.timestamps?.saindo ? tempoDecorrido(pedido.timestamps.saindo) : null
              return (
                <div key={pedido.id} style={{ background: '#1e1e24', border: '1px solid rgba(240,64,0,0.2)', borderLeft: '3px solid #f04000', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    {tempoSaindo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color="#f59e0b" />
                        <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Em rota há {tempoSaindo}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    {(pedido.itens || []).map((item, idx) => (
                      <span key={idx} style={{ fontSize: 13, color: '#d4d4d8' }}>×{item.quantidade} {item.nome || item.pratoId}</span>
                    ))}
                  </div>
                  {pedido.obs && (
                    <p style={{ fontSize: 12, color: '#d97706', fontStyle: 'italic', margin: 0, background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '6px 10px' }}>{pedido.obs}</p>
                  )}
                  <button onClick={() => marcarEntregue(pedido)} disabled={marcando === pedido.id}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: marcando === pedido.id ? '#2a2a32' : '#16a34a', color: marcando === pedido.id ? '#52525b' : '#fff', fontSize: 15, fontWeight: 700, cursor: marcando === pedido.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle size={18} />
                    {marcando === pedido.id ? 'Marcando...' : '✓ Marcar como Entregue'}
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
