import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, LogIn, Mail, CheckCircle, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

// Paleta fixa light
const c = {
  bg: '#f5f5f7', card: '#ffffff', border: '#e8e8ee', input: '#f9f9fb',
  text: '#111117', secondary: '#52525b', muted: '#a1a1aa',
  accent: '#f04000', accentHov: '#d93800', accentBg: 'rgba(240,64,0,0.07)',
  accentBdr: 'rgba(240,64,0,0.25)', error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.06)', shadow: '0 4px 24px rgba(0,0,0,0.08)',
  green: '#16a34a', greenBg: 'rgba(22,163,74,0.08)',
}

const inputStyle = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box', background: c.input,
  border: `1.5px solid ${c.border}`, borderRadius: 10, color: c.text,
  padding: '11px 14px', fontSize: 14, outline: 'none',
  transition: 'border-color .15s, box-shadow .15s', fontFamily: 'inherit', ...extra,
})

function Btn({ children, loading, onClick, style: s = {} }) {
  return (
    <button type="submit" onClick={onClick} disabled={!!loading} style={{
      width: '100%', padding: '13px', borderRadius: 11, border: 'none',
      fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: loading ? '#f0836a' : c.accent, color: '#fff',
      boxShadow: loading ? 'none' : '0 4px 14px rgba(240,64,0,0.35)',
      fontFamily: 'inherit', transition: 'all .15s', ...s,
    }}>
      {loading
        ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />{loading}</>
        : children}
    </button>
  )
}

export default function Trial() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [trialLink, setTrialLink] = useState(null)  // config do link
  const [nomeSistema, setNomeSistema] = useState('Cheffya')
  const [carregandoConfig, setCarregandoConfig] = useState(true)
  const [linkInvalido, setLinkInvalido] = useState(false)

  // Form
  const [nome, setNome]             = useState('')
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro]             = useState('')
  const [carregando, setCarregando] = useState(false)
  const [cadastroOk, setCadastroOk] = useState(false)

  // Carrega config do trial link via saas_config
  useEffect(() => {
    supabase.from('saas_config').select('config').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        const cfg = data?.config || {}
        setNomeSistema(cfg.nomeSistema || 'Cheffya')
        const links = cfg.trialLinks || []
        const link = links.find(l => l.slug === slug && l.ativo)
        if (!link) setLinkInvalido(true)
        else setTrialLink(link)
        setCarregandoConfig(false)
      })
  }, [slug])

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!email.trim()) return setErro('Informe o e-mail.')
    if (senha.length < 6) return setErro('Senha deve ter pelo menos 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')

    setCarregando(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          username: nome.trim(),
          trial_slug: slug,
          trial_dias: trialLink.dias,
        },
      },
    })
    setCarregando(false)

    if (error) {
      if (error.message?.includes('already registered')) return setErro('Este e-mail já está cadastrado. Faça login.')
      return setErro(error.message || 'Erro ao criar conta.')
    }
    setCadastroOk(true)
  }

  // Loading
  if (carregandoConfig) {
    return (
      <div style={{ minHeight: '100dvh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: c.accent, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Link inválido / desativado
  if (linkInvalido) {
    return (
      <div style={{ minHeight: '100dvh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', background: c.card, borderRadius: 20, padding: '40px 28px', boxShadow: c.shadow, border: `1px solid ${c.border}` }}>
          <img src="/logo-light.png" alt={nomeSistema} style={{ height: 38, objectFit: 'contain', display: 'block', margin: '0 auto 24px' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 8px' }}>Link inválido</h2>
          <p style={{ fontSize: 14, color: c.secondary, lineHeight: 1.6, margin: '0 0 24px' }}>
            Este link de teste não existe ou foi desativado. Entre em contato para mais informações.
          </p>
          <button onClick={() => navigate('/login')} style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 11, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .trial-input:focus { border-color: ${c.accent} !important; box-shadow: 0 0 0 3px rgba(240,64,0,0.12) !important; }
        .trial-input::placeholder { color: ${c.muted}; }
        .trial-input:-webkit-autofill, .trial-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px ${c.input} inset !important;
          -webkit-text-fill-color: ${c.text} !important;
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp .35s ease-out' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/logo-light.png" alt={nomeSistema} style={{ height: 38, objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        </div>

        {/* Badge de oferta */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.greenBg, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: 100, padding: '8px 18px' }}>
            <Gift size={15} style={{ color: c.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: c.green }}>
              {trialLink.dias} dias grátis — {trialLink.nome}
            </span>
          </div>
          {trialLink.descricao && (
            <p style={{ fontSize: 13, color: c.muted, marginTop: 8, marginBottom: 0 }}>{trialLink.descricao}</p>
          )}
        </div>

        {/* Card */}
        <div style={{ background: c.card, borderRadius: 20, boxShadow: c.shadow, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${c.green}, #22c55e)` }} />

          <div style={{ padding: '28px 28px 24px' }}>

            {!cadastroOk ? (
              <>
                <div style={{ marginBottom: 22 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>Criar conta grátis</h1>
                  <p style={{ fontSize: 13, color: c.muted, margin: 0 }}>
                    Sem cartão. Cancele quando quiser.
                  </p>
                </div>

                <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>Nome do restaurante / usuário *</label>
                    <input className="trial-input" style={inputStyle()} placeholder="Ex: Lanchonete do João"
                      value={nome} onChange={e => setNome(e.target.value)} autoFocus autoComplete="off" />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>E-mail *</label>
                    <input className="trial-input" style={inputStyle()} type="email" placeholder="seu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>Senha * (mín. 6 caracteres)</label>
                    <div style={{ position: 'relative' }}>
                      <input className="trial-input" style={inputStyle({ paddingRight: 44 })}
                        type={mostrarSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                        value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" />
                      <button type="button" onClick={() => setMostrarSenha(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: 4, display: 'flex' }}>
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>Confirmar senha *</label>
                    <input className="trial-input" style={inputStyle()} type="password" placeholder="Repita a senha"
                      value={confirmar} onChange={e => setConfirmar(e.target.value)} autoComplete="new-password" />
                  </div>

                  {erro && (
                    <div style={{ background: c.errorBg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: c.error, textAlign: 'center' }}>
                      {erro}
                    </div>
                  )}

                  <Btn loading={carregando ? 'Criando conta...' : null}>
                    <UserPlus size={16} /> Começar {trialLink.dias} dias grátis
                  </Btn>
                </form>

                <p style={{ fontSize: 12, color: c.muted, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
                  Já tem conta?{' '}
                  <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: c.accent, fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>
                    Fazer login
                  </button>
                </p>
              </>
            ) : (
              /* Cadastro OK */
              <div style={{ textAlign: 'center', padding: '8px 0 12px', animation: 'fadeUp .3s ease-out' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: c.greenBg, border: `1px solid rgba(22,163,74,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mail size={28} style={{ color: c.green }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 8px' }}>Verifique seu e-mail!</h2>
                <p style={{ fontSize: 13.5, color: c.secondary, lineHeight: 1.6, margin: '0 0 8px' }}>
                  Enviamos um link de confirmação para<br />
                  <strong style={{ color: c.text }}>{email}</strong>
                </p>
                <p style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, margin: '0 0 6px' }}>
                  Clique no link para ativar sua conta.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.greenBg, border: `1px solid rgba(22,163,74,0.2)`, borderRadius: 8, padding: '6px 14px', marginBottom: 20 }}>
                  <CheckCircle size={13} style={{ color: c.green }} />
                  <span style={{ fontSize: 12, color: c.green, fontWeight: 600 }}>
                    Seus {trialLink.dias} dias grátis começam ao confirmar o e-mail
                  </span>
                </div>
                <button onClick={() => navigate('/login')} style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 11, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <LogIn size={16} /> Ir para o login
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 20 }}>
          © {new Date().getFullYear()} {nomeSistema} · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
