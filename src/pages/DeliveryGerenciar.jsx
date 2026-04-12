import { useState, useEffect, useRef } from 'react'
import { Truck, MapPin, ToggleLeft, ToggleRight, Plus, Trash2, Check, Copy, Link2, Banknote, QrCode, CreditCard, ExternalLink, ChevronDown, Navigation, Wifi, WifiOff, UserRound, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

// ── Motoboys Tab ─────────────────────────────────────────────────────────────
function TabMotoboys() {
  const { motoboys, adicionarMotoboy, editarMotoboy, removerMotoboy } = useApp()
  const [novoNome, setNovoNome] = useState('')
  const [copiado, setCopiado] = useState(null)
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const markersRef = useRef({})
  const base = window.location.origin

  // Carregar Leaflet via CDN
  useEffect(() => {
    if (window.L) { leafletRef.current = window.L; initMap(); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => { leafletRef.current = window.L; initMap() }
    document.head.appendChild(script)

    return () => {
      if (leafletRef.current && mapRef.current?._leaflet_id) {
        try { mapRef.current.remove?.() } catch {}
      }
    }
  }, [])

  function initMap() {
    if (!leafletRef.current || !mapRef.current || mapRef.current._leaflet_id) return
    const L = leafletRef.current
    const map = L.map(mapRef.current, { zoomControl: true }).setView([-15.7801, -47.9292], 4)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current._mapInstance = map
  }

  // Atualizar marcadores quando motoboys mudam
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current?._mapInstance
    if (!L || !map) return

    const online = motoboys.filter(m => m.online && m.lat && m.lng)

    // remover marcadores antigos
    Object.keys(markersRef.current).forEach(id => {
      if (!online.find(m => m.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    online.forEach(m => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:#f04000;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      if (markersRef.current[m.id]) {
        markersRef.current[m.id].setLatLng([m.lat, m.lng])
      } else {
        markersRef.current[m.id] = L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${m.nome}</b><br>Online`)
      }
    })

    if (online.length === 1) {
      map.setView([online[0].lat, online[0].lng], 14)
    } else if (online.length > 1) {
      const group = L.featureGroup(Object.values(markersRef.current))
      map.fitBounds(group.getBounds().pad(0.3))
    }
  }, [motoboys, leafletRef.current])

  function copiar(token) {
    navigator.clipboard.writeText(`${base}/motoboy/${token}`)
    setCopiado(token)
    setTimeout(() => setCopiado(null), 2000)
  }

  function handleAdicionar() {
    if (!novoNome.trim()) return
    adicionarMotoboy({ nome: novoNome.trim() })
    setNovoNome('')
  }

  const online = motoboys.filter(m => m.online).length

  return (
    <div className="flex flex-col gap-5">
      {/* Mapa */}
      <div className="card p-0 overflow-hidden">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="card-title-icon"><Navigation size={14} /></div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Mapa em tempo real</span>
          {online > 0 && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f04000', fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f04000', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              {online} online
            </span>
          )}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <div ref={mapRef} style={{ height: 320, width: '100%', background: 'var(--bg-hover)' }} />
        {motoboys.filter(m => m.online && m.lat).length === 0 && (
          <div style={{ position: 'relative', marginTop: -320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: 20 }}>
              Nenhum motoboy online no momento
            </p>
          </div>
        )}
      </div>

      {/* Lista de motoboys */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="card-title-icon"><UserRound size={14} /></div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Motoboys cadastrados</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            {motoboys.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {motoboys.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Nenhum motoboy cadastrado ainda.</p>
          ) : motoboys.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: 'var(--bg-hover)',
              border: `1px solid ${m.online ? 'rgba(240,64,0,0.35)' : 'var(--border)'}`,
            }}>
              {/* Status dot */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: m.online ? '#f04000' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.online
                  ? <Wifi size={15} color="#fff" />
                  : <WifiOff size={15} color="var(--text-muted)" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{m.nome}</p>
                <p style={{ fontSize: 11, color: m.online ? '#f04000' : 'var(--text-muted)', margin: 0 }}>
                  {m.online ? 'Online · enviando localização' : 'Offline'}
                </p>
              </div>

              {/* toggle ativo */}
              <button onClick={() => editarMotoboy(m.id, { ativo: !m.ativo })}
                title={m.ativo ? 'Desativar link' : 'Ativar link'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}>
                {m.ativo ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>

              {/* copiar link */}
              <button onClick={() => copiar(m.token)} title="Copiar link do motoboy"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: copiado === m.token ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}>
                {copiado === m.token ? <Check size={15} /> : <Copy size={15} />}
              </button>

              {/* remover */}
              <button onClick={() => removerMotoboy(m.id)} title="Remover motoboy"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#ef4444', display: 'flex', opacity: 0.7 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input flex-1"
            placeholder="Nome do motoboy"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
          />
          <button className="btn btn-primary shrink-0" onClick={handleAdicionar}>
            <Plus size={15} /> Adicionar
          </button>
        </div>

        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Copie o link e envie para o motoboy. Ele abre no celular, ativa o rastreamento e aparece no mapa acima.
        </p>
      </div>
    </div>
  )
}

// ── Configurações Tab ─────────────────────────────────────────────────────────
function TabConfiguracoes() {
  const { configuracaoDelivery, atualizarConfiguracaoDelivery, definirSlugDelivery, adicionarBairro, editarBairro, removerBairro } = useApp()
  const cfg = configuracaoDelivery || {}
  const base = window.location.origin

  const [slugInput, setSlugInput] = useState(cfg.slugDelivery || '')
  const [erroSlug, setErroSlug] = useState('')
  const [okSlug, setOkSlug] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const [novoBairroNome, setNovoBairroNome] = useState('')
  const [novoBairroFrete, setNovoBairroFrete] = useState('')
  const [bairroNaoListadoAberto, setBairroNaoListadoAberto] = useState(false)

  const [estados, setEstados] = useState([])
  const [cidades, setCidades] = useState([])
  const [ufSelecionada, setUfSelecionada] = useState(cfg.uf || '')
  const [carregandoCidades, setCarregandoCidades] = useState(false)
  const [bairrosCidade, setBairrosCidade] = useState([])
  const [carregandoBairros, setCarregandoBairros] = useState(false)

  const urlDelivery = cfg.slugDelivery ? `${base}/delivery/${cfg.slugDelivery}` : null

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json()).then(data => setEstados(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!ufSelecionada) { setCidades([]); return }
    setCarregandoCidades(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSelecionada}/municipios?orderBy=nome`)
      .then(r => r.json()).then(data => { setCidades(data); setCarregandoCidades(false) })
      .catch(() => setCarregandoCidades(false))
  }, [ufSelecionada])

  useEffect(() => {
    if (!cfg.municipioId) { setBairrosCidade([]); return }
    setCarregandoBairros(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cfg.municipioId}/subdistritos`)
      .then(r => r.json())
      .then(data => { setBairrosCidade(Array.isArray(data) ? data : []); setCarregandoBairros(false) })
      .catch(() => { setBairrosCidade([]); setCarregandoBairros(false) })
  }, [cfg.municipioId])

  function handleUfChange(uf) {
    setUfSelecionada(uf)
    atualizarConfiguracaoDelivery({ uf, cidade: '', municipioId: null })
    setBairrosCidade([])
  }

  function handleCidadeChange(cidade, municipioId) {
    atualizarConfiguracaoDelivery({ cidade, municipioId: municipioId || null })
  }

  function salvarSlug() {
    const res = definirSlugDelivery(slugInput)
    if (res.erro) { setErroSlug(res.erro); return }
    setOkSlug(true); setTimeout(() => setOkSlug(false), 2500)
  }

  function copiar(texto) {
    navigator.clipboard.writeText(texto)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  function handleAdicionarBairro() {
    if (!novoBairroNome.trim()) return
    adicionarBairro({ nome: novoBairroNome.trim(), frete: Number(novoBairroFrete) || 0 })
    setNovoBairroNome(''); setNovoBairroFrete('')
  }

  const pgtoOpcoes = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={13} /> },
    { id: 'pix',      label: 'PIX',      icon: <QrCode size={13} /> },
    { id: 'cartao',   label: 'Cartão',   icon: <CreditCard size={13} /> },
  ]

  function togglePgto(id) {
    const atual = cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']
    const novo = atual.includes(id) ? atual.filter(f => f !== id) : [...atual, id]
    atualizarConfiguracaoDelivery({ formasPagamento: novo })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Ativar delivery */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Delivery ativo</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ativa o link público para pedidos</p>
        </div>
        <button onClick={() => atualizarConfiguracaoDelivery({ ativo: !cfg.ativo })}
          style={{ color: cfg.ativo ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {cfg.ativo ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
        </button>
      </div>

      {/* Modo iFood */}
      <div className="card p-5" style={{ border: cfg.modoIfood ? `2px solid ${cfg.corDestaqueIfood || '#ea1d2c'}` : undefined }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Modo Natural</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Visual idêntico ao app que as pessoas costumam usar em deliverys — fundo cinza, lista estilo app, cores adaptadas</p>
          </div>
          <button onClick={() => atualizarConfiguracaoDelivery({ modoIfood: !cfg.modoIfood })}
            style={{ color: cfg.modoIfood ? (cfg.corDestaqueIfood || '#ea1d2c') : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            {cfg.modoIfood ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
          </button>
        </div>

        {cfg.modoIfood && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Cor de destaque</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <input type="color" value={cfg.corDestaqueIfood || '#ea1d2c'}
                onChange={e => atualizarConfiguracaoDelivery({ corDestaqueIfood: e.target.value })}
                style={{ width: 38, height: 34, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2, background: 'none' }} />
              <div style={{ display: 'flex', gap: 7 }}>
                {['#ea1d2c', '#ff6b00', '#6c31f7', '#0f9d58', '#1a73e8', '#e91e8c'].map(cor => {
                  const ativa = (cfg.corDestaqueIfood || '#ea1d2c') === cor
                  return (
                    <button key={cor} onClick={() => atualizarConfiguracaoDelivery({ corDestaqueIfood: cor })}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: cor, border: 'none', cursor: 'pointer', outline: ativa ? `3px solid ${cor}` : 'none', outlineOffset: 2, boxShadow: ativa ? '0 0 0 2px #fff inset' : 'none' }} />
                  )
                })}
              </div>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Cor dos botões, categorias e carrinho</p>
          </div>
        )}
      </div>

      {/* Link */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={15} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Link do Cardápio Delivery</h2>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Endereço personalizado</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <span style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {base}/delivery/
            </span>
            <input className="input" style={{ flex: 1, border: 'none', borderRadius: 0, background: 'transparent', fontSize: 13, fontFamily: 'monospace' }}
              placeholder="meurestaurante"
              value={slugInput}
              onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setErroSlug('') }}
              onKeyDown={e => e.key === 'Enter' && salvarSlug()} />
            <button className="btn btn-primary" style={{ borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, fontSize: 12, padding: '8px 14px', flexShrink: 0 }} onClick={salvarSlug}>
              Salvar
            </button>
          </div>
          {erroSlug && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{erroSlug}</p>}
          {okSlug && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>✓ Link salvo!</p>}
        </div>

        {urlDelivery ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlDelivery}</span>
              <button className="btn btn-primary py-1.5 px-3 text-xs shrink-0" onClick={() => copiar(urlDelivery)}>
                {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
              </button>
            </div>
            <a href={urlDelivery} target="_blank" rel="noreferrer" className="btn btn-secondary text-xs w-fit">
              <ExternalLink size={12} /> Abrir delivery
            </a>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#d97706' }}>
            ⚠ Defina um endereço acima para ativar o link.
          </div>
        )}
      </div>

      {/* Configurações gerais */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações gerais</h2>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Estado</label>
              <div style={{ position: 'relative' }}>
                <select value={ufSelecionada} onChange={e => handleUfChange(e.target.value)} className="input" style={{ paddingRight: 28, appearance: 'none' }}>
                  <option value="">Selecione...</option>
                  {estados.map(e => <option key={e.id} value={e.sigla}>{e.sigla} — {e.nome}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Cidade</label>
              <div style={{ position: 'relative' }}>
                <select value={cfg.cidade || ''} onChange={e => { const sel = cidades.find(c => c.nome === e.target.value); handleCidadeChange(e.target.value, sel?.id) }}
                  className="input" style={{ paddingRight: 28, appearance: 'none' }} disabled={!ufSelecionada || carregandoCidades}>
                  <option value="">{carregandoCidades ? 'Carregando...' : ufSelecionada ? 'Selecione...' : 'Escolha o estado'}</option>
                  {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Pedido mínimo (R$)</label>
              <input className="input" type="number" min="0" placeholder="0,00" value={cfg.pedidoMinimo || ''}
                onChange={e => atualizarConfiguracaoDelivery({ pedidoMinimo: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Tempo estimado</label>
              <input className="input" placeholder="60-70 min" value={cfg.tempoEstimado || ''}
                onChange={e => atualizarConfiguracaoDelivery({ tempoEstimado: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de entrega (ex: Padrão, Expresso)</label>
            <input className="input" placeholder="Padrão" value={cfg.tipoEntrega || ''}
              onChange={e => atualizarConfiguracaoDelivery({ tipoEntrega: e.target.value })} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aparece como "Padrão • 60-70 min • R$ 9,00" abaixo das estrelas</p>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Telefone/WhatsApp (com DDD)</label>
            <input className="input" placeholder="11999999999" value={cfg.telefone || ''}
              onChange={e => atualizarConfiguracaoDelivery({ telefone: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Mensagem de introdução (WhatsApp)</label>
            <input className="input" placeholder="Olá! Gostaria de fazer um pedido:" value={cfg.mensagemIntro || ''}
              onChange={e => atualizarConfiguracaoDelivery({ mensagemIntro: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Formas de pagamento */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Formas de pagamento aceitas</h2>
        <div className="flex gap-3 flex-wrap">
          {pgtoOpcoes.map(op => {
            const ativo = (cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']).includes(op.id)
            return (
              <button key={op.id} onClick={() => togglePgto(op.id)} style={{
                flex: 1, minWidth: 90, padding: '9px 10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                background: ativo ? 'var(--accent-bg)' : 'transparent',
                color: ativo ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {op.icon}{op.label}
                {ativo && <Check size={12} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bairros */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={15} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Bairros de entrega</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
            {(cfg.bairros || []).filter(b => b.ativo).length} ativos
          </span>
        </div>

        {carregandoBairros ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Carregando bairros da cidade...</p>
        ) : bairrosCidade.length > 1 ? (
          <div className="flex flex-col gap-2 mb-3">
            {bairrosCidade.map(b => {
              const conf = (cfg.bairros || []).find(cb => cb.nome.toLowerCase() === b.nome.toLowerCase())
              const ativo = !!conf?.ativo
              return (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-hover)', border: `1px solid ${ativo ? 'var(--accent)' : 'var(--border)'}` }}>
                  <button onClick={() => { if (conf) editarBairro(conf.id, { ativo: !conf.ativo }); else adicionarBairro({ nome: b.nome, frete: 0 }) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                    {ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <span className="flex-1 text-sm font-medium" style={{ color: ativo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.nome}</span>
                  {ativo && conf && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                      <input type="number" min="0" value={conf.frete}
                        onChange={e => editarBairro(conf.id, { frete: Number(e.target.value) })}
                        style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                    </div>
                  )}
                </div>
              )
            })}
            {(cfg.bairros || []).filter(cb => !bairrosCidade.some(b => b.nome.toLowerCase() === cb.nome.toLowerCase())).map(b => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <button onClick={() => editarBairro(b.id, { ativo: !b.ativo })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                  {b.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <span className="flex-1 text-sm font-medium" style={{ color: b.ativo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.nome}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                  <input type="number" min="0" value={b.frete}
                    onChange={e => editarBairro(b.id, { frete: Number(e.target.value) })}
                    style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                </div>
                <button onClick={() => removerBairro(b.id)} className="btn btn-ghost p-1" style={{ color: '#ef4444', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {(cfg.bairros || []).length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>
                {cfg.cidade ? 'Nenhum bairro cadastrado.' : 'Selecione uma cidade para ver os bairros.'}
              </p>
            ) : (
              (cfg.bairros || []).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <button onClick={() => editarBairro(b.id, { ativo: !b.ativo })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                    {b.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <span className="flex-1 text-sm font-medium" style={{ color: b.ativo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.nome}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                    <input type="number" min="0" value={b.frete}
                      onChange={e => editarBairro(b.id, { frete: Number(e.target.value) })}
                      style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                  </div>
                  <button onClick={() => removerBairro(b.id)} className="btn btn-ghost p-1" style={{ color: '#ef4444', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {!bairroNaoListadoAberto ? (
          <button onClick={() => setBairroNaoListadoAberto(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'none', border: '2px dashed var(--border)', cursor: 'pointer', color: 'var(--accent)' }}>
            <Plus size={14} /> Bairro não listado
          </button>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Adicionar bairro manualmente</p>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Nome do bairro" value={novoBairroNome}
                onChange={e => setNovoBairroNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdicionarBairro()} />
              <div className="flex items-center gap-1" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px', background: 'var(--bg-card)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                <input type="number" min="0" placeholder="0" value={novoBairroFrete}
                  onChange={e => setNovoBairroFrete(e.target.value)}
                  style={{ width: 60, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, outline: 'none', padding: '6px 0' }} />
              </div>
              <button className="btn btn-primary shrink-0" onClick={() => { handleAdicionarBairro(); setBairroNaoListadoAberto(false) }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            <button onClick={() => { setBairroNaoListadoAberto(false); setNovoBairroNome(''); setNovoBairroFrete('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Cancelar
            </button>
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Frete 0 = entrega grátis nesse bairro.</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DeliveryGerenciar() {
  const [aba, setAba] = useState('configuracoes')

  const tabs = [
    { id: 'configuracoes', label: 'Configurações', icon: SlidersHorizontal },
    { id: 'motoboys',      label: 'Motoboys',      icon: Navigation },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Delivery</h1>
            <p className="page-subtitle">Cardápio online e rastreamento de motoboys</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-hover)', borderRadius: 12, padding: 4 }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
            background: aba === id ? 'var(--bg-card)' : 'transparent',
            color: aba === id ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: aba === id ? 'var(--shadow)' : 'none',
            transition: 'all .15s',
          }}>
            <Icon size={15} style={{ color: aba === id ? 'var(--accent)' : 'var(--text-muted)' }} />
            {label}
          </button>
        ))}
      </div>

      {aba === 'configuracoes' ? <TabConfiguracoes /> : <TabMotoboys />}
    </div>
  )
}
