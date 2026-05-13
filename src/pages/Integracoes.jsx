import { useState, useEffect } from 'react'
import { Link2, RefreshCw, Check } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useApp } from '../context/AppContext.jsx'

const SUPABASE_URL = 'https://api.cheffya.com.br'

// ── iFood ─────────────────────────────────────────────────────────────────────
function CardIfood() {
  const { auth, pratos } = useApp()
  const [clientId,     setClientId]     = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [merchantId,   setMerchantId]   = useState('')
  const [status,       setStatus]       = useState(null)
  const [mapeamento,   setMapeamento]   = useState({})
  const [salvandoMap,  setSalvandoMap]  = useState(false)

  useEffect(() => {
    if (!auth.userId) return
    supabase.from('ifood_config').select('*').eq('user_id', auth.userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setClientId(data.client_id || '')
          setClientSecret(data.client_secret || '')
          setMerchantId(data.merchant_id || '')
          setMapeamento(data.mapeamento || {})
          if (data.ativo) setStatus({ ok: true, merchant_name: data.merchant_name || 'Conectado' })
        }
      })
  }, [auth.userId])

  async function conectar() {
    if (!clientId || !clientSecret || !merchantId) {
      setStatus({ erro: 'Preencha todos os campos' }); return
    }
    setStatus('conectando')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ifood-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, merchant_id: merchantId, user_id: auth.userId, action: 'connect' }),
      })
      const data = await res.json()
      if (data.erro) { setStatus({ erro: data.erro }); return }
      setStatus({ ok: true, merchant_name: data.merchant_name })
      await supabase.from('ifood_config').upsert({ user_id: auth.userId, merchant_name: data.merchant_name }, { onConflict: 'user_id' })
    } catch (e) {
      setStatus({ erro: e.message })
    }
  }

  async function salvarCredenciais() {
    await supabase.from('ifood_config').upsert(
      { user_id: auth.userId, client_id: clientId, client_secret: clientSecret, merchant_id: merchantId },
      { onConflict: 'user_id' }
    )
  }

  async function salvarMapeamento() {
    setSalvandoMap(true)
    await supabase.from('ifood_config').upsert({ user_id: auth.userId, mapeamento }, { onConflict: 'user_id' })
    setSalvandoMap(false)
  }

  const conectado = status?.ok
  const cor = '#ea1d2c'

  return (
    <div className="card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <img src="/logo-ifood.png" alt="iFood" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>iFood</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Pedidos chegam automaticamente no Kanban em tempo real</p>
        </div>
        {conectado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Conectado</span>
          </div>
        )}
      </div>

      {/* Instrução */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <strong>Como obter as credenciais:</strong><br />
        1. Acesse o <strong>Portal do Parceiro iFood</strong> (portal.ifood.com.br)<br />
        2. Vá em <strong>Integrações → API</strong><br />
        3. Crie um acesso e copie o <strong>Client ID</strong>, <strong>Client Secret</strong> e <strong>Merchant ID</strong>
      </div>

      {/* Credenciais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Credenciais da API</p>
        {[
          { label: 'Client ID',     val: clientId,     set: setClientId,     ph: 'ex: abc123-def456...' },
          { label: 'Client Secret', val: clientSecret, set: setClientSecret, ph: 'ex: xyz789...' },
          { label: 'Merchant ID',   val: merchantId,   set: setMerchantId,   ph: 'ex: seu-restaurante-id' },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
            <input className="input" type="text" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={conectar} disabled={status === 'conectando'}
          style={{ gap: 6, background: cor, color: '#fff', border: 'none' }}>
          {status === 'conectando'
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Conectando...</>
            : <><Link2 size={14} /> {conectado ? 'Reconectar' : 'Conectar ao iFood'}</>}
        </button>
        <button className="btn btn-secondary" onClick={salvarCredenciais} style={{ gap: 6 }}>
          <Check size={14} /> Salvar credenciais
        </button>
        {status?.ok  && <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>✓ {status.merchant_name}</span>}
        {status?.erro && <span style={{ fontSize: 12, color: '#ef4444' }}>✗ {status.erro}</span>}
      </div>

      {/* Webhook info */}
      {conectado && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>WEBHOOK REGISTRADO</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
            {SUPABASE_URL}/functions/v1/ifood-webhook
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
            Pedidos chegam instantaneamente. Nenhuma outra configuração necessária.
          </p>
        </div>
      )}

      {/* Mapeamento de produtos */}
      {conectado && pratos.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Mapeamento de Produtos</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Preenchido automaticamente quando pedidos chegam.
              </p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={salvarMapeamento} disabled={salvandoMap}>
              {salvandoMap ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {Object.keys(mapeamento).length === 0 ? (
            <div className="card p-4" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              O mapeamento é preenchido automaticamente quando os primeiros pedidos iFood chegarem.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(mapeamento).map(([ifoodNome, pratoId]) => (
                <div key={ifoodNome} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>iFood</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{ifoodNome}</p>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Cheffya</p>
                    <select className="input" style={{ fontSize: 12, padding: '4px 8px' }} value={pratoId || ''}
                      onChange={e => setMapeamento(prev => ({ ...prev, [ifoodNome]: e.target.value || null }))}>
                      <option value="">— Não mapeado ⚠️</option>
                      {pratos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helper: salvar/carregar integracoes_config ─────────────────────────────────
async function carregarIntegracoes(userId) {
  const { data } = await supabase.from('integracoes_config')
    .select('config').eq('user_id', userId).maybeSingle()
  return data?.config || {}
}

async function salvarIntegracao(userId, chave, dados) {
  const cfg = await carregarIntegracoes(userId)
  await supabase.from('integracoes_config').upsert(
    { user_id: userId, config: { ...cfg, [chave]: dados } },
    { onConflict: 'user_id' }
  )
}

// ── 99food ────────────────────────────────────────────────────────────────────
function Card99() {
  const { auth } = useApp()
  const [apiKey,       setApiKey]       = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [salvando,     setSalvando]     = useState(false)
  const [salvo,        setSalvo]        = useState(false)

  useEffect(() => {
    if (!auth.userId) return
    carregarIntegracoes(auth.userId).then(cfg => {
      if (cfg.noventa_nove) {
        setApiKey(cfg.noventa_nove.api_key || '')
        setRestaurantId(cfg.noventa_nove.restaurant_id || '')
      }
    })
  }, [auth.userId])

  async function salvar() {
    setSalvando(true)
    await salvarIntegracao(auth.userId, 'noventa_nove', { api_key: apiKey, restaurant_id: restaurantId })
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  const cor = '#ffcd00'
  const corTexto = '#1a1a1a'

  return (
    <div className="card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <img src="/logo-99food.png" alt="99food" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>99food</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Receba pedidos da 99food diretamente no sistema</p>
        </div>
        {apiKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Configurado</span>
          </div>
        )}
      </div>

      {/* Instrução */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <strong>Como obter as credenciais:</strong><br />
        1. Acesse o <strong>Portal do Parceiro 99food</strong><br />
        2. Vá em <strong>Configurações → API / Integrações</strong><br />
        3. Copie sua <strong>API Key</strong> e o <strong>Restaurant ID</strong>
      </div>

      {/* Campos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>API Key</label>
          <input className="input" type="text" placeholder="ex: 99food_live_..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Restaurant ID</label>
          <input className="input" type="text" placeholder="ex: rest_123456" value={restaurantId} onChange={e => setRestaurantId(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ gap: 6 }}>
          {salvando ? 'Salvando...' : salvo ? <><Check size={14} /> Salvo!</> : <><Check size={14} /> Salvar credenciais</>}
        </button>
      </div>
    </div>
  )
}

// ── Ketta ─────────────────────────────────────────────────────────────────────
function CardKetta() {
  const { auth } = useApp()
  const [token,    setToken]    = useState('')
  const [lojaId,   setLojaId]   = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  useEffect(() => {
    if (!auth.userId) return
    carregarIntegracoes(auth.userId).then(cfg => {
      if (cfg.ketta) {
        setToken(cfg.ketta.token || '')
        setLojaId(cfg.ketta.loja_id || '')
      }
    })
  }, [auth.userId])

  async function salvar() {
    setSalvando(true)
    await salvarIntegracao(auth.userId, 'ketta', { token, loja_id: lojaId })
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  const cor = '#6c3fc5'

  return (
    <div className="card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <img src="/logo-ketta.png" alt="Ketta" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>Ketta</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Integre seus pedidos Ketta com o Cheffya</p>
        </div>
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>Configurado</span>
          </div>
        )}
      </div>

      {/* Instrução */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <strong>Como obter as credenciais:</strong><br />
        1. Acesse seu painel na <strong>Ketta</strong><br />
        2. Vá em <strong>Configurações → Integrações → API</strong><br />
        3. Copie seu <strong>Token</strong> e o <strong>ID da loja</strong>
      </div>

      {/* Campos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Token de acesso</label>
          <input className="input" type="text" placeholder="ex: ketta_tok_..." value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>ID da Loja</label>
          <input className="input" type="text" placeholder="ex: loja_789" value={lojaId} onChange={e => setLojaId(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ gap: 6 }}>
          {salvando ? 'Salvando...' : salvo ? <><Check size={14} /> Salvo!</> : <><Check size={14} /> Salvar credenciais</>}
        </button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Integracoes() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Integrações</h1>
          <p className="page-subtitle">Conecte o Cheffya com plataformas de delivery</p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <CardIfood />
        <Card99 />
        <CardKetta />
      </div>
    </div>
  )
}
