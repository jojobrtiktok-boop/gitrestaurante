import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  Eye, EyeOff, X, LogIn, UserPlus, Check, Mail, ChevronRight,
  BarChart2, Package, UtensilsCrossed, Smartphone, Layers, Users,
} from 'lucide-react'

// ── Paleta da identidade visual ──────────────────────────────────
const b = {
  bg:         '#101010',
  surface:    '#181818',
  surface2:   '#202020',
  border:     'rgba(255,255,255,0.07)',
  border2:    'rgba(255,255,255,0.14)',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.5)',
  subtle:     'rgba(255,255,255,0.28)',
  accent:     '#fd4b01',
  accentDim:  'rgba(253,75,1,0.12)',
  accentBdr:  'rgba(253,75,1,0.3)',
  accentHov:  '#e54200',
  shadow:     '0 24px 60px rgba(0,0,0,0.6)',
}

// ── Features ─────────────────────────────────────────────────────
const features = [
  {
    Icon: UtensilsCrossed,
    title: 'Cardápio Digital',
    desc: 'Monte seu cardápio com fotos, grupos e variações. Compartilhe via link ou QR Code.',
  },
  {
    Icon: Layers,
    title: 'Fluxo de Pedidos',
    desc: 'Kanban visual para organizar pedidos do recebimento à entrega. Zero papel.',
  },
  {
    Icon: Package,
    title: 'Controle de Estoque',
    desc: 'Insumos, compras, alertas de estoque mínimo e custo por prato calculado.',
  },
  {
    Icon: Smartphone,
    title: 'Delivery Integrado',
    desc: 'Receba pedidos online com rastreamento de motoboys em tempo real via GPS.',
  },
  {
    Icon: Users,
    title: 'Mesas e Comandas',
    desc: 'Gerencie mesas, sessões e comandas digitais integradas ao fluxo de pedidos.',
  },
  {
    Icon: BarChart2,
    title: 'Relatórios',
    desc: 'Faturamento, margem, custos e evolução. Tome decisões com dados reais.',
  },
]

// ── Planos ────────────────────────────────────────────────────────
const plans = [
  {
    id: 'mensal',
    label: 'Mensal',
    badge: null,
    price: null,
    desc: 'Cancele quando quiser',
    items: ['Todas as funcionalidades', 'Suporte por WhatsApp', 'Sem contrato'],
  },
  {
    id: 'trimestral',
    label: 'Trimestral',
    badge: 'Mais popular',
    price: null,
    desc: '3 meses com desconto',
    items: ['Todas as funcionalidades', 'Suporte prioritário', 'Relatórios avançados'],
  },
  {
    id: 'anual',
    label: 'Anual',
    badge: 'Melhor valor',
    price: null,
    desc: '12 meses — maior economia',
    items: ['Todas as funcionalidades', 'Suporte VIP', 'Relatórios avançados', 'Onboarding personalizado'],
  },
]

// ── Modal Login/Cadastro ──────────────────────────────────────────
function Modal({ tab, onClose }) {
  const { login, cadastrarUsuario, resetarSenha } = useApp()
  const navigate = useNavigate()
  const [tela, setTela] = useState(tab || 'entrar')
  const overlay = useRef(null)

  // Estados entrar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterLogado, setManterLogado] = useState(true)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Estados cadastro
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [erroNome, setErroNome] = useState('')
  const [erroEmail, setErroEmail] = useState('')
  const [carregandoCadastro, setCarregandoCadastro] = useState(false)
  const [cadastroOk, setCadastroOk] = useState(false)

  // Estados reset
  const [resetEmail, setResetEmail] = useState('')
  const [resetOk, setResetOk] = useState(false)
  const [erroReset, setErroReset] = useState('')
  const [carregandoReset, setCarregandoReset] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleEntrar(e) {
    e.preventDefault()
    setErro('')
    if (!email.trim()) return setErro('Informe o email ou usuário.')
    if (!senha) return setErro('Informe a senha.')
    setCarregando(true)
    const res = await login(email.trim(), senha, manterLogado)
    setCarregando(false)
    if (res.erro) setErro(res.erro)
    else navigate('/painel')
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErroCadastro(''); setErroNome(''); setErroEmail('')
    if (!novoNome.trim()) return setErroNome('Nome obrigatório.')
    if (!novoEmail.trim()) return setErroEmail('Email obrigatório.')
    if (novaSenha.length < 6) return setErroCadastro('Mínimo 6 caracteres.')
    if (novaSenha !== confirmarSenha) return setErroCadastro('As senhas não coincidem.')
    setCarregandoCadastro(true)
    const res = await cadastrarUsuario(novoEmail.trim(), novaSenha, novoNome.trim())
    setCarregandoCadastro(false)
    if (res.erro === 'nome_em_uso') return setErroNome('Usuário já em uso.')
    if (res.erro === 'email_em_uso') return setErroEmail('E-mail já cadastrado.')
    if (res.erro) return setErroCadastro(res.erro)
    setCadastroOk(true)
  }

  async function handleReset(e) {
    e.preventDefault()
    setErroReset('')
    if (!resetEmail.trim()) return setErroReset('Informe o email.')
    setCarregandoReset(true)
    const res = await resetarSenha(resetEmail.trim())
    setCarregandoReset(false)
    if (res.erro) return setErroReset(res.erro)
    setResetOk(true)
  }

  function trocarTela(id) {
    setTela(id)
    setErro(''); setErroCadastro(''); setErroNome(''); setErroEmail('')
    setCadastroOk(false)
  }

  const inputSt = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box',
    background: b.surface2, border: `1.5px solid ${b.border2}`,
    borderRadius: 10, color: b.text,
    padding: '11px 14px', fontSize: 14, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    fontFamily: 'inherit',
    ...extra,
  })

  return (
    <div
      ref={overlay}
      onClick={e => { if (e.target === overlay.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', animation: 'fadeIn .2s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .m-input:focus { border-color: ${b.accent} !important; box-shadow: 0 0 0 3px rgba(253,75,1,0.15) !important; }
        .m-input::placeholder { color: ${b.subtle}; }
        .m-input:-webkit-autofill, .m-input:-webkit-autofill:hover, .m-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px ${b.surface2} inset !important;
          -webkit-text-fill-color: ${b.text} !important;
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420,
        background: b.surface, borderRadius: 20,
        border: `1px solid ${b.border2}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        animation: 'slideUp .25s ease',
      }}>
        {/* Topo */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${b.accent}, #ff7040)` }} />

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <img src="/logo-dark.png" alt="Cheffya" style={{ height: 28, objectFit: 'contain' }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.muted, display: 'flex', padding: 4, borderRadius: 8 }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          {tela !== 'reset' && !cadastroOk && (
            <div style={{ display: 'flex', gap: 3, background: b.bg, padding: 3, borderRadius: 11, marginBottom: 20 }}>
              {[
                { id: 'entrar', label: 'Entrar', Icon: LogIn },
                { id: 'cadastro', label: 'Criar conta', Icon: UserPlus },
              ].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => trocarTela(id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 600, transition: 'all .15s',
                  background: tela === id ? b.surface2 : 'transparent',
                  color: tela === id ? b.text : b.muted,
                  boxShadow: tela === id ? '0 1px 6px rgba(0,0,0,0.4)' : 'none',
                  fontFamily: 'inherit',
                }}>
                  <Icon size={13} style={{ color: tela === id ? b.accent : b.muted }} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Entrar ── */}
          {tela === 'entrar' && (
            <form onSubmit={handleEntrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>Usuário ou E-mail</label>
                <input className="m-input" style={inputSt()} placeholder="usuario ou seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="username" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="m-input" style={inputSt({ paddingRight: 44 })}
                    type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••"
                    value={senha} onChange={e => setSenha(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: b.muted, padding: 4, display: 'flex' }}>
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setManterLogado(v => !v)} style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${manterLogado ? b.accent : b.border2}`,
                  background: manterLogado ? b.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}>
                  {manterLogado && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: b.muted }}>Manter conectado por 60 dias</span>
              </label>

              {erro && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>
                  {erro}
                </div>
              )}

              <BtnPrimary loading={carregando ? 'Entrando...' : null}>
                <LogIn size={15} /> Entrar
              </BtnPrimary>

              <button type="button" onClick={() => { setTela('reset'); setResetEmail(email); setResetOk(false); setErroReset('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: b.accent, textAlign: 'center', fontFamily: 'inherit', padding: '2px 0' }}>
                Esqueci minha senha
              </button>
            </form>
          )}

          {/* ── Criar conta ── */}
          {tela === 'cadastro' && !cadastroOk && (
            <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>Nome de usuário *</label>
                <input className="m-input" style={inputSt({ borderColor: erroNome ? '#f87171' : undefined })}
                  placeholder="seuusuario" value={novoNome}
                  onChange={e => { setNovoNome(e.target.value); setErroNome('') }} autoFocus autoComplete="off" />
                {erroNome && <p style={{ fontSize: 12, color: '#f87171', margin: '4px 0 0' }}>{erroNome}</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>E-mail *</label>
                <input className="m-input" style={inputSt({ borderColor: erroEmail ? '#f87171' : undefined })}
                  type="email" placeholder="seu@email.com" value={novoEmail}
                  onChange={e => { setNovoEmail(e.target.value); setErroEmail('') }} autoComplete="email" />
                {erroEmail && <p style={{ fontSize: 12, color: '#f87171', margin: '4px 0 0' }}>{erroEmail}</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>Senha * (mín. 6 caracteres)</label>
                <div style={{ position: 'relative' }}>
                  <input className="m-input" style={inputSt({ paddingRight: 44 })}
                    type={mostrarNovaSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                    value={novaSenha} onChange={e => setNovaSenha(e.target.value)} autoComplete="new-password" />
                  <button type="button" onClick={() => setMostrarNovaSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: b.muted, padding: 4, display: 'flex' }}>
                    {mostrarNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>Confirmar senha *</label>
                <input className="m-input" style={inputSt()}
                  type="password" placeholder="Repita a senha"
                  value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} autoComplete="new-password" />
              </div>

              {erroCadastro && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>
                  {erroCadastro}
                </div>
              )}

              <BtnPrimary loading={carregandoCadastro ? 'Criando conta...' : null}>
                <UserPlus size={15} /> Criar conta
              </BtnPrimary>
            </form>
          )}

          {/* ── Cadastro OK ── */}
          {tela === 'cadastro' && cadastroOk && (
            <div style={{ textAlign: 'center', padding: '8px 0 12px', animation: 'slideUp .3s ease' }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mail size={26} style={{ color: b.accent }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: b.text, margin: '0 0 8px' }}>Verifique seu e-mail</h3>
              <p style={{ fontSize: 13, color: b.muted, lineHeight: 1.6, margin: '0 0 20px' }}>
                Enviamos um link de confirmação para<br />
                <strong style={{ color: b.text }}>{novoEmail}</strong>
              </p>
              <BtnPrimary type="button" onClick={() => trocarTela('entrar')}>
                <LogIn size={15} /> Ir para o login
              </BtnPrimary>
            </div>
          )}

          {/* ── Reset ── */}
          {tela === 'reset' && (
            <div style={{ animation: 'slideUp .25s ease' }}>
              {!resetOk ? (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: b.text, margin: '0 0 2px' }}>Recuperar senha</p>
                    <p style={{ fontSize: 12, color: b.muted, margin: 0 }}>Enviaremos um link por e-mail</p>
                  </div>
                  <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: b.muted, display: 'block', marginBottom: 5 }}>E-mail da conta</label>
                      <input className="m-input" style={inputSt()} type="email" placeholder="seu@email.com"
                        value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus />
                    </div>
                    {erroReset && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                        {erroReset}
                      </div>
                    )}
                    <BtnPrimary loading={carregandoReset ? 'Enviando...' : null}>
                      Enviar link de recuperação
                    </BtnPrimary>
                    <button type="button" onClick={() => trocarTela('entrar')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: b.muted, textAlign: 'center', fontFamily: 'inherit' }}>
                      Voltar ao login
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={26} style={{ color: b.accent }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: b.text, margin: '0 0 8px' }}>E-mail enviado!</h3>
                  <p style={{ fontSize: 13, color: b.muted, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Verifique sua caixa de entrada e clique no link para redefinir a senha.
                  </p>
                  <BtnPrimary type="button" onClick={() => trocarTela('entrar')}>
                    <LogIn size={15} /> Voltar ao login
                  </BtnPrimary>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BtnPrimary({ children, loading, type = 'submit', onClick }) {
  return (
    <button type={type} onClick={onClick} disabled={!!loading} style={{
      width: '100%', padding: '13px', borderRadius: 11, border: 'none',
      fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'all .15s', fontFamily: 'inherit',
      background: loading ? 'rgba(253,75,1,0.6)' : b.accent,
      color: '#fff',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(253,75,1,0.35)',
    }}>
      {loading
        ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />{loading}</>
        : children}
    </button>
  )
}

// ── Landing Page ──────────────────────────────────────────────────
export default function LandingPage() {
  const { auth } = useApp()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // null | 'entrar' | 'cadastro'
  const [navSolid, setNavSolid] = useState(false)

  // Redireciona usuário já logado
  useEffect(() => {
    if (auth.logado) navigate('/painel', { replace: true })
  }, [auth.logado, navigate])

  // Nav fica sólida ao rolar
  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Forçar tema escuro no HTML enquanto está na LP
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light')
    return () => { /* não restaura — AppContext cuida disso */ }
  }, [])

  return (
    <div style={{ background: b.bg, color: b.text, minHeight: '100dvh', fontFamily: '"Inter", system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.08) !important; }
        .lp-feature:hover { border-color: rgba(253,75,1,0.3) !important; background: rgba(253,75,1,0.04) !important; }
        .lp-plan:hover { transform: translateY(-4px); }
        .lp-plan { transition: transform .2s ease, border-color .2s ease; }
        .lp-cta-sec:hover { background: rgba(255,255,255,0.08) !important; }
        ::selection { background: rgba(253,75,1,0.35); color: #fff; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        transition: 'background .3s, border-color .3s, backdrop-filter .3s',
        background: navSolid ? 'rgba(16,16,16,0.92)' : 'transparent',
        backdropFilter: navSolid ? 'blur(16px)' : 'none',
        borderBottom: navSolid ? `1px solid ${b.border}` : '1px solid transparent',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo-dark.png" alt="Cheffya" style={{ height: 30, objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="lp-btn-ghost" onClick={() => setModal('entrar')} style={{
              padding: '9px 20px', borderRadius: 10, border: `1px solid ${b.border2}`,
              background: 'transparent', color: b.text, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
            }}>
              Entrar
            </button>
            <button onClick={() => setModal('cadastro')} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: b.accent, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(253,75,1,0.35)',
            }}>
              Começar grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Glow de fundo */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,75,1,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 780, animation: 'fadeUp .6s ease both' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 100,
            background: b.accentDim, border: `1px solid ${b.accentBdr}`,
            fontSize: 13, fontWeight: 600, color: b.accent, marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.accent }} />
            Sistema de gestão para restaurantes
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: '"Clash Display", "Inter", sans-serif',
            fontSize: 'clamp(38px, 7vw, 72px)',
            fontWeight: 700, lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            Gerencie seu{' '}
            <span style={{ color: b.accent }}>restaurante</span>
            <br />com inteligência.
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: b.muted, lineHeight: 1.6, maxWidth: 580, margin: '0 auto 44px', fontWeight: 400 }}>
            Cardápio, pedidos, estoque, delivery, mesas e relatórios — tudo em um só lugar. Simples, rápido e feito para o seu dia a dia.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setModal('cadastro')} style={{
              padding: '15px 32px', borderRadius: 12, border: 'none',
              background: b.accent, color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(253,75,1,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Começar gratuitamente <ChevronRight size={18} />
            </button>
            <button className="lp-btn-ghost" onClick={() => setModal('entrar')} style={{
              padding: '15px 32px', borderRadius: 12,
              border: `1px solid ${b.border2}`,
              background: 'transparent', color: b.text, fontSize: 16, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontFamily: '"Clash Display", "Inter", sans-serif',
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
              letterSpacing: '-0.02em', marginBottom: 12,
            }}>
              Tudo que seu restaurante precisa
            </h2>
            <p style={{ fontSize: 16, color: b.muted, maxWidth: 480, margin: '0 auto' }}>
              Do pedido ao caixa, do estoque ao delivery — uma plataforma completa.
            </p>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="lp-feature" style={{
                background: b.surface, border: `1px solid ${b.border}`,
                borderRadius: 16, padding: '28px 24px',
                transition: 'border-color .2s, background .2s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: b.accentDim, border: `1px solid ${b.accentBdr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={20} style={{ color: b.accent }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: b.muted, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', background: b.surface }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontFamily: '"Clash Display", "Inter", sans-serif',
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
              letterSpacing: '-0.02em', marginBottom: 12,
            }}>
              Planos simples e transparentes
            </h2>
            <p style={{ fontSize: 16, color: b.muted }}>
              Sem surpresas. Cancele quando quiser.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
            {plans.map((plan) => {
              const isPopular = plan.id === 'trimestral'
              return (
                <div key={plan.id} className="lp-plan" style={{
                  background: isPopular ? `linear-gradient(135deg, rgba(253,75,1,0.08), rgba(253,75,1,0.02))` : b.bg,
                  border: `1.5px solid ${isPopular ? b.accentBdr : b.border}`,
                  borderRadius: 20, padding: '32px 28px',
                  position: 'relative',
                }}>
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: isPopular ? b.accent : b.surface2,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap',
                      boxShadow: isPopular ? '0 4px 12px rgba(253,75,1,0.4)' : 'none',
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  <p style={{ fontSize: 13, fontWeight: 600, color: b.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    {plan.label}
                  </p>

                  {/* Preço TBD */}
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, fontFamily: '"Clash Display", "Inter", sans-serif', color: b.text, letterSpacing: '-0.03em' }}>
                      Em breve
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: b.muted, marginBottom: 28 }}>{plan.desc}</p>

                  <button onClick={() => setModal('cadastro')} style={{
                    width: '100%', padding: '12px', borderRadius: 11, border: `1.5px solid ${isPopular ? b.accent : b.border2}`,
                    background: isPopular ? b.accent : 'transparent',
                    color: isPopular ? '#fff' : b.text, fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', marginBottom: 24,
                    boxShadow: isPopular ? '0 4px 20px rgba(253,75,1,0.3)' : 'none',
                  }}>
                    Começar agora
                  </button>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.items.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: b.muted }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: b.accentDim, border: `1px solid ${b.accentBdr}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={11} style={{ color: b.accent }} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: '"Clash Display", "Inter", sans-serif',
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
            letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1,
          }}>
            Pronto para transformar<br />seu restaurante?
          </h2>
          <p style={{ fontSize: 16, color: b.muted, marginBottom: 36, lineHeight: 1.6 }}>
            Comece hoje. Sem cartão de crédito. Sem complicação.
          </p>
          <button onClick={() => setModal('cadastro')} style={{
            padding: '16px 40px', borderRadius: 13, border: 'none',
            background: b.accent, color: '#fff', fontSize: 17, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 28px rgba(253,75,1,0.45)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            Criar minha conta grátis <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${b.border}`, padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <img src="/logo-dark.png" alt="Cheffya" style={{ height: 24, objectFit: 'contain' }} />
          <p style={{ fontSize: 13, color: b.subtle }}>
            © {new Date().getFullYear()} Cheffya · Todos os direitos reservados
          </p>
        </div>
      </footer>

      {/* ── MODAL ───────────────────────────────────────────────── */}
      {modal && <Modal tab={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
