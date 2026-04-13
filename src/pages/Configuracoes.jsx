import { useState } from 'react'
import {
  User, Bell, Smartphone, Eye, EyeOff,
  Lock, CheckCircle, AlertCircle, ShoppingBasket,
  BellOff, BellRing, Chrome, Camera, Pencil,
  Wallet, Banknote, QrCode, CreditCard, ExternalLink,
  Headphones, MessageCircle, Mail, Clock,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

/* helpers */
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={!!disabled}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? 'var(--accent)' : 'var(--border-input)',
        opacity: disabled ? 0.45 : 1,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function Row({ label, sub, children, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, background: 'var(--bg-hover)', borderRadius: 10,
      padding: '10px 14px', border: '1px solid var(--border)', ...style,
    }}>
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function SecaoHeader({ icon: Icon, title, cor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      paddingBottom: 10, borderBottom: `2px solid ${cor || 'var(--border)'}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: cor ? `${cor}22` : 'var(--accent-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} style={{ color: cor || 'var(--accent)' }} />
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
    </div>
  )
}

function StepCard({ num, title, desc }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: 'var(--bg-hover)', borderRadius: 10, padding: '10px 14px',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
        color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        {num}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{desc}</p>}
      </div>
    </div>
  )
}

/* Aba Conta */
function AbaConta() {
  const { auth, alterarSenha, perfil, atualizarPerfil } = useApp()

  // Perfil
  const [nomeLocal,  setNomeLocal]  = useState(perfil?.nomeExibicao || '')
  const [fotoLocal,  setFotoLocal]  = useState(perfil?.foto || null)
  const [perfilOk,   setPerfilOk]   = useState(false)
  const [erroFoto,   setErroFoto]   = useState('')

  // Senha
  const [senhaAntiga, setSenhaAntiga] = useState('')
  const [senhaNova,   setSenhaNova]   = useState('')
  const [senhaConf,   setSenhaConf]   = useState('')
  const [mostrarA,    setMostrarA]    = useState(false)
  const [mostrarN,    setMostrarN]    = useState(false)
  const [erro,        setErro]        = useState('')
  const [ok,          setOk]          = useState(false)

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setErroFoto('')
    if (file.size > 3 * 1024 * 1024) {
      setErroFoto('A foto deve ter menos de 3 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => setFotoLocal(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleSalvarPerfil() {
    atualizarPerfil({ foto: fotoLocal, nomeExibicao: nomeLocal.trim() })
    setPerfilOk(true)
    setTimeout(() => setPerfilOk(false), 2500)
  }

  function handleSalvarSenha() {
    setErro(''); setOk(false)
    if (!senhaAntiga) return setErro('Informe a senha atual.')
    if (senhaNova.length < 4) return setErro('Nova senha deve ter pelo menos 4 caracteres.')
    if (senhaNova !== senhaConf) return setErro('As senhas não coincidem.')
    const res = alterarSenha(senhaAntiga, senhaNova)
    if (res.erro) return setErro(res.erro)
    setSenhaAntiga(''); setSenhaNova(''); setSenhaConf('')
    setOk(true); setTimeout(() => setOk(false), 3000)
  }

  const fotoId = 'upload-avatar-' + auth.usuario

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Perfil ── */}
      <div>
        <SecaoHeader icon={User} title="Perfil" cor="#3b82f6" />
        <div style={{
          padding: '20px', background: 'var(--bg-hover)', borderRadius: 12,
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar clicável */}
            <label htmlFor={fotoId} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: fotoLocal ? 'transparent' : 'var(--accent)',
                border: '2px solid var(--border-active)',
                overflow: 'hidden', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff',
              }}>
                {fotoLocal
                  ? <img src={fotoLocal} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (auth.usuario || '?')[0].toUpperCase()
                }
              </div>
              {/* Camera badge */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '2px solid var(--bg-card)',
              }}>
                <Camera size={11} color="#fff" />
              </div>
            </label>
            <input id={fotoId} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>{auth.usuario}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {auth.isAdmin ? '👑 Administrador' : 'Usuário'}
              </p>
            </div>
            {fotoLocal && (
              <button
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                onClick={() => setFotoLocal(null)}
              >
                Remover foto
              </button>
            )}
          </div>

          {erroFoto && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ef4444', fontSize: 12 }}>
              <AlertCircle size={13} /> {erroFoto}
            </div>
          )}

          {/* Nome de exibição */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Nome de exibição
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder={auth.usuario}
                value={nomeLocal}
                onChange={e => setNomeLocal(e.target.value)}
                style={{ paddingRight: 36 }}
              />
              <Pencil size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Aparece na barra lateral. Deixe vazio para usar o nome de login.
            </p>
          </div>

          {/* Botão salvar perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSalvarPerfil} style={{ alignSelf: 'flex-start' }}>
              <CheckCircle size={13} /> Salvar perfil
            </button>
            {perfilOk && (
              <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={13} /> Salvo!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Alterar Senha ── */}
      <div>
        <SecaoHeader icon={Lock} title="Alterar Senha" cor="#f59e0b" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Senha atual</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={mostrarA ? 'text' : 'password'}
                placeholder="Sua senha atual" value={senhaAntiga}
                onChange={e => setSenhaAntiga(e.target.value)} style={{ paddingRight: 40 }} />
              <button onClick={() => setMostrarA(v => !v)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
              }}>
                {mostrarA ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={mostrarN ? 'text' : 'password'}
                placeholder="Mínimo 4 caracteres" value={senhaNova}
                onChange={e => setSenhaNova(e.target.value)} style={{ paddingRight: 40 }} />
              <button onClick={() => setMostrarN(v => !v)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
              }}>
                {mostrarN ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Confirmar nova senha</label>
            <input className="input" type="password" placeholder="Repita a nova senha"
              value={senhaConf} onChange={e => setSenhaConf(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSalvarSenha()} />
          </div>
          {erro && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ef4444', fontSize: 12 }}>
              <AlertCircle size={13} /> {erro}
            </div>
          )}
          {ok && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#22c55e', fontSize: 12 }}>
              <CheckCircle size={13} /> Senha alterada com sucesso!
            </div>
          )}
          <button className="btn btn-primary" onClick={handleSalvarSenha} style={{ alignSelf: 'flex-start' }}>
            <Lock size={13} /> Salvar nova senha
          </button>
        </div>
      </div>
    </div>
  )
}
/* Aba Notificações */
function AbaNotificacoes() {
  const { notifConfig, atualizarNotifConfig } = useApp()

  const permissao = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  const suportado = typeof Notification !== 'undefined'

  async function ativarPush() {
    if (!suportado) return
    const perm = await Notification.requestPermission()
    atualizarNotifConfig({ pushAtivo: perm === 'granted' })
  }

  function handleTogglePush(val) {
    if (val && permissao !== 'granted') ativarPush()
    else atualizarNotifConfig({ pushAtivo: val })
  }

  const pushOn = notifConfig.pushAtivo && permissao === 'granted'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SecaoHeader icon={Bell} title="Notificações Push" cor="#8b5cf6" />
        {!suportado && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <BellOff size={14} /> Seu navegador não suporta notificações.
          </div>
        )}
        {suportado && permissao === 'denied' && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 12, color: '#ef4444',
          }}>
            Permissão negada. Vá em Configurações do navegador → Notificações e permita para este site.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row
            label="Ativar notificações"
            sub={
              permissao === 'granted' ? 'Permissão concedida ✅' :
              permissao === 'denied'  ? 'Permissão negada · libere nas configurações do navegador' :
              'Clique para solicitar permissão ao navegador'
            }
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              {permissao === 'default' && (
                <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 12px' }} onClick={ativarPush}>
                  Solicitar permissão
                </button>
              )}
              <Toggle value={pushOn} onChange={handleTogglePush} disabled={!suportado || permissao === 'denied'} />
            </div>
          </Row>
        </div>
      </div>

      <div>
        <SecaoHeader icon={BellRing} title="Tipos de Notificação" cor="#3b82f6" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row label="💰 Vendas" sub="Notificar quando um pedido for pago">
            <Toggle value={notifConfig.notifVendas} onChange={v => atualizarNotifConfig({ notifVendas: v })} disabled={!pushOn} />
          </Row>
          <Row label="📦 Insumos baixos" sub="Alertar quando um ingrediente atingir o estoque mínimo">
            <Toggle value={notifConfig.notifInsumos} onChange={v => atualizarNotifConfig({ notifInsumos: v })} disabled={!pushOn} />
          </Row>
          <Row
            label="🔴 Demora na cozinha"
            sub="Avisar quando pedidos estiverem esperando demais"
            style={{ borderColor: notifConfig.notifDemora && pushOn ? 'rgba(239,68,68,0.3)' : undefined }}
          >
            <Toggle value={notifConfig.notifDemora} onChange={v => atualizarNotifConfig({ notifDemora: v })} disabled={!pushOn} />
          </Row>
          {notifConfig.notifDemora && pushOn && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, background: 'var(--bg-hover)', borderRadius: 10,
              padding: '10px 14px', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Alertar após</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <input
                  type="number" className="input" min={5} max={120}
                  value={notifConfig.demoraMinutos}
                  onChange={e => atualizarNotifConfig({ demoraMinutos: Math.max(5, Math.min(120, +e.target.value)) })}
                  style={{ width: 72, textAlign: 'center' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>minutos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* Aba App */
function AbaApp() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{
        padding: '18px 22px', borderRadius: 14,
        background: 'linear-gradient(135deg, var(--accent-bg), var(--bg-hover))',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden',
          }}>
            <img src="/favicon.png" alt="Cheffya" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Cheffya
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                background: '#fff', color: 'var(--accent)', verticalAlign: 'middle',
                border: '1px solid rgba(240,64,0,0.2)',
              }}>PWA</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              App disponível para iPhone e Android via instalação direta no navegador (PWA)
            </p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Não precisa de loja de aplicativos. Basta acessar o link no celular e instalar direto pelo navegador.
          Após instalado funciona como aplicativo nativo, com ícone na tela inicial.
        </p>
      </div>

      {/* iOS */}
      <div>
        <SecaoHeader icon={({ size, style }) => (
          <svg viewBox="0 0 814 1000" width={size} height={size} style={style} fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 680 0 563.5 0 448.3c0-84.5 16.2-167.2 52.2-237.8 50.8-99.4 133.8-164.1 218.9-164.1 81.8 0 144.5 48.8 193.7 48.8 49.3 0 121.1-52.2 214-52.2zm-470-45.2C346 285.9 383.2 195.8 383.2 105.7c0-12.8-1.3-25.9-3.2-38.1C302 67 224 117.5 183.6 195.8c-34.6 67.9-40.8 136.8-39.5 191.2 8.3 0.6 35.8 5.1 55.5 5.1z"/>
          </svg>
        )} title="Instalar no iPhone (iOS)" cor="#1d1d1f" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StepCard num={1} title="Abra o Safari" desc="Acesse o link do sistema pelo Safari - no iOS só funciona via Safari." />
          <StepCard num={2} title='Toque em "Compartilhar" (ícone ↑)' desc="Botão de compartilhamento na barra inferior do Safari." />
          <StepCard num={3} title='"Adicionar à Tela de Início"' desc="Role para baixo no menu e toque nessa opção." />
          <StepCard num={4} title="Confirme o nome e toque em Adicionar" desc="O ícone do app aparecerá na tela inicial do iPhone." />
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginTop: 4,
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            fontSize: 12, color: 'var(--text-secondary)',
          }}>
            📱 No iOS 16.4+ as notificações push funcionam depois do app instalado na tela inicial.
          </div>
        </div>
      </div>

      {/* Android */}
      <div>
        <SecaoHeader icon={Chrome} title="Instalar no Android" cor="#22c55e" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StepCard num={1} title="Abra o Google Chrome" desc="Acesse o link do sistema pelo Chrome (padrão no Android)." />
          <StepCard num={2} title="Toque nos 3 pontos ⋮ (canto superior direito)" desc="Menu de opções do Chrome." />
          <StepCard num={3} title='"Adicionar à tela inicial"' desc="Selecione essa opção no menu." />
          <StepCard num={4} title="Confirme e instale" desc="O app aparecerá na tela inicial igual a um aplicativo nativo." />
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginTop: 4,
            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 12, color: 'var(--text-secondary)',
          }}>
            📱 No Android as notificações push funcionam mesmo com o app fechado, desde que o Chrome esteja ativo em segundo plano.
          </div>
        </div>
      </div>
    </div>
  )
}

/* Aba Formas de Pagamento */
function AbaFormasPagamento() {
  const { pagamentosConfig, atualizarPagamentosConfig, configuracaoGeral, atualizarConfiguracaoGeral } = useApp()
  const [mostrarToken, setMostrarToken] = useState(false)
  const [testando, setTestando] = useState(false)
  const [testeResultado, setTesteResultado] = useState(null)

  async function testarConexao() {
    if (!pagamentosConfig.mercadoPagoAccessToken) return
    setTestando(true)
    setTesteResultado(null)
    try {
      const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: { Authorization: `Bearer ${pagamentosConfig.mercadoPagoAccessToken}` },
      })
      if (res.ok) setTesteResultado({ ok: true, msg: 'Conexão bem-sucedida! Token válido.' })
      else setTesteResultado({ ok: false, msg: 'Token inválido ou sem permissão.' })
    } catch {
      setTesteResultado({ ok: false, msg: 'Erro de rede. Verifique sua conexão.' })
    } finally {
      setTestando(false)
    }
  }

  const formas = [
    { key: 'dinheiro',      label: 'Dinheiro',           sub: 'Pagamento em espécie',               Icon: Banknote },
    { key: 'pix',           label: 'PIX',                sub: 'Transferência instantânea',           Icon: QrCode },
    { key: 'cartaoCredito', label: 'Cartão de Crédito',  sub: 'Crédito à vista ou parcelado',        Icon: CreditCard },
    { key: 'cartaoDebito',  label: 'Cartão de Débito',   sub: 'Débito em conta',                     Icon: CreditCard },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Formas de pagamento aceitas ── */}
      <div>
        <SecaoHeader icon={Wallet} title="Formas de Pagamento Aceitas" cor="var(--accent)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {formas.map(({ key, label, sub, Icon }) => (
            <Row key={key} label={label} sub={sub}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: pagamentosConfig[key] ? 'var(--accent-bg)' : 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)',
                }}>
                  <Icon size={13} style={{ color: pagamentosConfig[key] ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                <Toggle value={!!pagamentosConfig[key]} onChange={v => atualizarPagamentosConfig({ [key]: v })} />
              </div>
            </Row>
          ))}
        </div>
      </div>

      {/* ── Mercado Pago ── */}
      <div>
        <SecaoHeader icon={({ size, style }) => (
          <svg viewBox="0 0 32 32" width={size} height={size} style={style} fill="currentColor">
            <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm6.5 10.5c0 .276-.224.5-.5.5h-1.5v1h1.5c.276 0 .5.224.5.5s-.224.5-.5.5h-1.5v2.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5V13h-2.5c-.276 0-.5-.224-.5-.5v-4c0-.276.224-.5.5-.5h5c.276 0 .5.224.5.5v4zm-10 4c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z"/>
          </svg>
        )} title="Mercado Pago" cor="#00b1ea" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row
            label="Ativar integração Mercado Pago"
            sub="Receba pagamentos via Pix, cartão e outros direto pelo sistema"
          >
            <Toggle value={!!pagamentosConfig.mercadoPagoAtivo} onChange={v => atualizarPagamentosConfig({ mercadoPagoAtivo: v })} />
          </Row>

          {pagamentosConfig.mercadoPagoAtivo && (
            <div style={{
              padding: '18px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--bg-hover)', display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Instrução */}
              <div style={{
                padding: '10px 14px', borderRadius: 9, fontSize: 12,
                background: 'rgba(0,177,234,0.07)', border: '1px solid rgba(0,177,234,0.2)',
                color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                Para obter suas credenciais, acesse o{' '}
                <a
                  href="https://www.mercadopago.com.br/developers/pt/docs/credentials"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00b1ea', textDecoration: 'none', fontWeight: 600 }}
                >
                  Painel de Desenvolvedores do Mercado Pago <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
                </a>
                {' '}e copie as chaves de produção.
              </div>

              {/* Access Token */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                  Access Token (Produção)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={mostrarToken ? 'text' : 'password'}
                    placeholder="APP_USR-0000000000000000-000000-..."
                    value={pagamentosConfig.mercadoPagoAccessToken}
                    onChange={e => atualizarPagamentosConfig({ mercadoPagoAccessToken: e.target.value })}
                    style={{ paddingRight: 40, fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <button
                    onClick={() => setMostrarToken(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                  >
                    {mostrarToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Public Key */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                  Public Key (Produção)
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
                  value={pagamentosConfig.mercadoPagoPublicKey}
                  onChange={e => atualizarPagamentosConfig({ mercadoPagoPublicKey: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Usada no frontend para gerar preferências de pagamento.
                </p>
              </div>

              {/* Botão testar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={testarConexao}
                  disabled={testando || !pagamentosConfig.mercadoPagoAccessToken}
                  style={{ alignSelf: 'flex-start', opacity: !pagamentosConfig.mercadoPagoAccessToken ? 0.45 : 1 }}
                >
                  {testando ? 'Testando...' : 'Testar conexão'}
                </button>
                {testeResultado && (
                  <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: testeResultado.ok ? '#22c55e' : '#ef4444' }}>
                    {testeResultado.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {testeResultado.msg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Estoque (movido do Sistema) ── */}
      <div>
        <SecaoHeader icon={ShoppingBasket} title="Mercadorias / Estoque" cor="#16a34a" />
        <Row label="Estoque mínimo padrão" sub="Aplicado a insumos sem valor individual configurado">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <input
              type="number" className="input" min={0}
              value={configuracaoGeral.estoqueMinimoPadrao}
              onChange={e => atualizarConfiguracaoGeral({ estoqueMinimoPadrao: Math.max(0, +e.target.value) })}
              style={{ width: 80, textAlign: 'center' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>unidades</span>
          </div>
        </Row>
      </div>

    </div>
  )
}

/* Aba Suporte */
function AbaSuporte() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Card principal */}
      <div style={{
        padding: '24px', borderRadius: 14,
        background: 'linear-gradient(135deg, var(--accent-bg), var(--bg-hover))',
        border: '1px solid var(--border)', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Headphones size={24} color="#fff" />
        </div>
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Suporte Cheffya
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
          Nossa equipe está disponível para te ajudar com dúvidas, problemas ou sugestões sobre o sistema.
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <Clock size={13} />
          Horário de atendimento: seg–sex, 9h–18h
        </div>
      </div>

      {/* Canais */}
      <div>
        <SecaoHeader icon={MessageCircle} title="Canais de Atendimento" cor="var(--accent)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* WhatsApp */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, background: 'var(--bg-hover)', borderRadius: 10,
            padding: '14px 16px', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'rgba(34,197,94,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="#22c55e">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>WhatsApp</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Atendimento rápido via chat</p>
              </div>
            </div>
            <a
              href="https://wa.me/5531999999999?text=Olá!%20Preciso%20de%20suporte%20com%20o%20Cheffya."
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                background: '#22c55e', color: '#fff', fontSize: 13, fontWeight: 600,
                flexShrink: 0, transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <MessageCircle size={13} /> Abrir chat
            </a>
          </div>

          {/* E-mail */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, background: 'var(--bg-hover)', borderRadius: 10,
            padding: '14px 16px', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'var(--accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>E-mail</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>suporte@cheffya.com.br</p>
              </div>
            </div>
            <a
              href="mailto:suporte@cheffya.com.br?subject=Suporte%20Cheffya"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
                flexShrink: 0, transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Mail size={13} /> Enviar e-mail
            </a>
          </div>

        </div>
      </div>

    </div>
  )
}

/* Página principal */
const TABS = [
  { id: 'conta',      label: 'Conta',               Icon: User,        cor: '#3b82f6' },
  { id: 'notif',      label: 'Notificações',        Icon: Bell,        cor: '#8b5cf6' },
  { id: 'app',        label: 'App',                 Icon: Smartphone,  cor: '#16a34a' },
  { id: 'pagamentos', label: 'Formas de Pagamento', Icon: Wallet,      cor: 'var(--accent)' },
  { id: 'suporte',    label: 'Suporte',             Icon: Headphones,  cor: '#22c55e' },
]

export default function Configuracoes() {
  const [aba, setAba] = useState('conta')
  const { notifConfig } = useApp()
  const notifBadge = !notifConfig.pushAtivo

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Preferências da sua conta</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--bg-hover)', borderRadius: 12, padding: 4,
        border: '1px solid var(--border)', flexWrap: 'wrap',
      }}>
        {TABS.map(t => {
          const ativo = aba === t.id
          return (
            <button key={t.id} onClick={() => setAba(t.id)} style={{
              flex: 1, minWidth: 100, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
              border: 'none', cursor: 'pointer', fontWeight: ativo ? 700 : 500, fontSize: 13,
              background: ativo ? 'var(--bg-card)' : 'transparent',
              color: ativo ? t.cor : 'var(--text-muted)',
              boxShadow: ativo ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s', position: 'relative',
            }}>
              <t.Icon size={14} />
              {t.label}
              {t.id === 'notif' && notifBadge && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#f59e0b',
                  position: 'absolute', top: 6, right: 8,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {aba === 'conta'      && <AbaConta />}
      {aba === 'notif'      && <AbaNotificacoes />}
      {aba === 'app'        && <AbaApp />}
      {aba === 'pagamentos' && <AbaFormasPagamento />}
      {aba === 'suporte'    && <AbaSuporte />}
    </div>
  )
}
