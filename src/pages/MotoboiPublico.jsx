import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { MapPin, WifiOff, Navigation } from 'lucide-react'

export default function MotoboiPublico() {
  const { token } = useParams()
  const [motoboy, setMotoboy] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [ativo, setAtivo] = useState(false)
  const [posicao, setPosicao] = useState(null)
  const [erro, setErro] = useState('')
  const watchIdRef = useRef(null)
  const intervaloRef = useRef(null)

  useEffect(() => {
    supabase.from('motoboys').select('id, nome, ativo').eq('token', token).maybeSingle()
      .then(({ data }) => { setMotoboy(data); setCarregando(false) })
  }, [token])

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
      // Observa mudanças de posição continuamente
      watchIdRef.current = navigator.geolocation.watchPosition(
        p => setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude }),
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
      // Envia ao Supabase a cada 15s
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

  const s = {
    page: { minHeight: '100dvh', background: '#0f0f13', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' },
    card: { background: '#1e1e24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  }

  if (carregando) return (
    <div style={{ ...s.page }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #f04000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  if (!motoboy || !motoboy.ativo) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WifiOff size={28} color="#ef4444" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, margin: 0 }}>Link inválido ou inativo</p>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 6 }}>Solicite um novo link ao estabelecimento.</p>
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

      <img src="/logo-dark.png" alt="Cheffya" style={{ height: 32, marginBottom: 28, objectFit: 'contain' }} />

      <div style={s.card}>
        {/* Avatar */}
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: ativo ? '#f04000' : '#1a1a22',
          border: `3px solid ${ativo ? 'rgba(240,64,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .3s',
        }}>
          <Navigation size={32} color={ativo ? '#fff' : '#52525b'} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700, margin: 0 }}>{motoboy.nome}</p>
          <p style={{ color: ativo ? '#f04000' : '#a1a1aa', fontSize: 13, marginTop: 4, fontWeight: ativo ? 600 : 400 }}>
            {ativo ? 'Rastreamento ativo' : 'Rastreamento desativado'}
          </p>
        </div>

        {/* Indicador online */}
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

        {/* Botão principal */}
        {!ativo ? (
          <button onClick={ativarRastreamento} style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: '#f04000', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MapPin size={18} />
            Ativar Rastreamento
          </button>
        ) : (
          <button onClick={desativar} style={{ width: '100%', padding: '15px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <WifiOff size={18} />
            Desativar
          </button>
        )}

        <p style={{ color: '#3a3a44', fontSize: 11, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          Sua localização é compartilhada com o estabelecimento enquanto o rastreamento estiver ativo.
          Desative ao concluir as entregas.
        </p>
      </div>
    </div>
  )
}
