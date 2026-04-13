import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  Eye, EyeOff, X, LogIn, UserPlus, Check, Mail, ChevronRight,
  BarChart2, Package, UtensilsCrossed, Smartphone, Layers, Users,
} from 'lucide-react'

const b = {
  bg:        '#101010',
  surface:   '#181818',
  surface2:  '#202020',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.14)',
  text:      '#ffffff',
  muted:     'rgba(255,255,255,0.5)',
  subtle:    'rgba(255,255,255,0.28)',
  accent:    '#fd4b01',
  accentDim: 'rgba(253,75,1,0.12)',
  accentBdr: 'rgba(253,75,1,0.3)',
}

const features = [
  { Icon: UtensilsCrossed, title: 'Cardápio Digital',    desc: 'Monte seu cardápio com fotos, grupos e variações. Compartilhe via link ou QR Code.' },
  { Icon: Layers,          title: 'Fluxo de Pedidos',    desc: 'Kanban visual para organizar pedidos do recebimento à entrega. Zero papel.' },
  { Icon: Package,         title: 'Controle de Estoque', desc: 'Insumos, compras, alertas de estoque mínimo e custo por prato calculado.' },
  { Icon: Smartphone,      title: 'Delivery Integrado',  desc: 'Receba pedidos online com rastreamento de motoboys em tempo real via GPS.' },
  { Icon: Users,           title: 'Mesas e Comandas',    desc: 'Gerencie mesas, sessões e comandas digitais integradas ao fluxo de pedidos.' },
  { Icon: BarChart2,       title: 'Relatórios',          desc: 'Faturamento, margem, custos e evolução. Tome decisões com dados reais.' },
]

const plans = [
  {
    id: 'mensal',
    label: 'Mensal',
    badge: null,
    desc: 'Cancele quando quiser',
    items: ['Todas as funcionalidades', 'Suporte por WhatsApp', 'Sem contrato'],
    popular: false,
  },
  {
    id: 'trimestral',
    label: 'Trimestral',
    badge: 'Mais popular',
    desc: '3 meses com desconto',
    items: ['Todas as funcionalidades', 'Suporte prioritário', 'Relatórios avançados'],
    popular: true,
  },
  {
    id: 'anual',
    label: 'Anual',
    badge: 'Melhor valor',
    desc: '12 meses — maior economia',
    items: ['Todas as funcionalidades', 'Suporte VIP', 'Relatórios avançados', 'Onboarding personalizado'],
    popular: false,
  },
]

// ─── Botão primário ──────────────────────────────────────────────
function BtnPrimary({ children, loading, type = 'submit', onClick, className = '' }) {
  return (
    <button type={type} onClick={onClick} disabled={!!loading} className={className} style={{
      width: '100%', padding: '13px', borderRadius: 11, border: 'none',
      fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'all .15s', fontFamily: 'inherit',
      background: loading ? 'rgba(253,75,1,0.55)' : b.accent, color: '#fff',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(253,75,1,0.35)',
    }}>
      {loading
        ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'lp-spin .7s linear infinite', display: 'inline-block' }} />{loading}</>
        : children}
    </button>
  )
}

// ─── Modal login / cadastro ──────────────────────────────────────
function Modal({ tab, onClose }) {
  const { login, cadastrarUsuario, resetarSenha } = useApp()
  const navigate = useNavigate()
  const [tela, setTela] = useState(tab || 'entrar')
  const overlay = useRef(null)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterLogado, setManterLogado] = useState(true)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

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

  const [resetEmail, setResetEmail] = useState('')
  const [resetOk, setResetOk] = useState(false)
  const [erroReset, setErroReset] = useState('')
  const [carregandoReset, setCarregandoReset] = useState(false)

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  async function handleEntrar(e) {
    e.preventDefault(); setErro('')
    if (!email.trim()) return setErro('Informe o email ou usuário.')
    if (!senha) return setErro('Informe a senha.')
    setCarregando(true)
    const res = await login(email.trim(), senha, manterLogado)
    setCarregando(false)
    if (res.erro) { setErro(res.erro) } else {
      // Forçar tema claro ao entrar pelo LP (LP usa tema escuro)
      document.documentElement.classList.add('light')
      localStorage.setItem('rd_tema', JSON.stringify('light'))
      navigate('/painel')
    }
  }

  async function handleCadastro(e) {
    e.preventDefault(); setErroCadastro(''); setErroNome(''); setErroEmail('')
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
    e.preventDefault(); setErroReset('')
    if (!resetEmail.trim()) return setErroReset('Informe o email.')
    setCarregandoReset(true)
    const res = await resetarSenha(resetEmail.trim())
    setCarregandoReset(false)
    if (res.erro) return setErroReset(res.erro)
    setResetOk(true)
  }

  function trocarTela(id) {
    setTela(id); setErro(''); setErroCadastro(''); setErroNome(''); setErroEmail(''); setCadastroOk(false)
  }

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box',
    background: b.surface2, border: `1.5px solid ${b.border2}`,
    borderRadius: 10, color: b.text, padding: '11px 14px', fontSize: 14,
    outline: 'none', transition: 'border-color .15s, box-shadow .15s', fontFamily: 'inherit',
    ...extra,
  })

  return (
    <div ref={overlay} onClick={e => e.target === overlay.current && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'lp-fade .2s ease' }}>

      <div style={{ width: '100%', maxWidth: 420, background: b.surface, borderRadius: 20, border: `1px solid ${b.border2}`, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden', animation: 'lp-up .25s ease', maxHeight: '95dvh', overflowY: 'auto' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${b.accent}, #ff7040)` }} />
        <div style={{ padding: '22px 22px 20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <img src="/logo-dark.png" alt="Cheffya" style={{ height: 26, objectFit: 'contain' }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.muted, display: 'flex', padding: 6, borderRadius: 8 }}><X size={18} /></button>
          </div>

          {tela !== 'reset' && !cadastroOk && (
            <div style={{ display: 'flex', gap: 3, background: b.bg, padding: 3, borderRadius: 11, marginBottom: 18 }}>
              {[{ id: 'entrar', label: 'Entrar', Icon: LogIn }, { id: 'cadastro', label: 'Criar conta', Icon: UserPlus }].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => trocarTela(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, transition: 'all .15s', background: tela === id ? b.surface2 : 'transparent', color: tela === id ? b.text : b.muted, boxShadow: tela === id ? '0 1px 6px rgba(0,0,0,0.4)' : 'none', fontFamily: 'inherit' }}>
                  <Icon size={13} style={{ color: tela === id ? b.accent : b.muted }} />{label}
                </button>
              ))}
            </div>
          )}

          {tela === 'entrar' && (
            <form onSubmit={handleEntrar} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>Usuário ou E-mail</label>
                <input className="lp-inp" style={inp()} placeholder="usuario ou seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="username" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="lp-inp" style={inp({ paddingRight: 44 })} type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: b.muted, padding: 4, display: 'flex' }}>{mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setManterLogado(v => !v)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${manterLogado ? b.accent : b.border2}`, background: manterLogado ? b.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                  {manterLogado && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: b.text }}>Manter conectado por 60 dias</span>
              </label>
              {erro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erro}</div>}
              <BtnPrimary loading={carregando ? 'Entrando...' : null}><LogIn size={15} /> Entrar</BtnPrimary>
              <button type="button" onClick={() => { setTela('reset'); setResetEmail(email); setResetOk(false); setErroReset('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: b.accent, textAlign: 'center', fontFamily: 'inherit', padding: '2px 0' }}>Esqueci minha senha</button>
            </form>
          )}

          {tela === 'cadastro' && !cadastroOk && (
            <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>Nome de usuário *</label>
                <input className="lp-inp" style={inp({ borderColor: erroNome ? '#f87171' : undefined })} placeholder="seu usuario" value={novoNome} onChange={e => { setNovoNome(e.target.value); setErroNome('') }} autoFocus autoComplete="off" />
                {erroNome && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{erroNome}</p>}</div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>E-mail *</label>
                <input className="lp-inp" style={inp({ borderColor: erroEmail ? '#f87171' : undefined })} type="email" placeholder="seu@email.com" value={novoEmail} onChange={e => { setNovoEmail(e.target.value); setErroEmail('') }} autoComplete="email" />
                {erroEmail && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{erroEmail}</p>}</div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>Senha * (mín. 6 caracteres)</label>
                <div style={{ position: 'relative' }}>
                  <input className="lp-inp" style={inp({ paddingRight: 44 })} type={mostrarNovaSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} autoComplete="new-password" />
                  <button type="button" onClick={() => setMostrarNovaSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: b.muted, padding: 4, display: 'flex' }}>{mostrarNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>Confirmar senha *</label>
                <input className="lp-inp" style={inp()} type="password" placeholder="Repita a senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} autoComplete="new-password" /></div>
              {erroCadastro && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center' }}>{erroCadastro}</div>}
              <BtnPrimary loading={carregandoCadastro ? 'Criando conta...' : null}><UserPlus size={15} /> Criar conta</BtnPrimary>
            </form>
          )}

          {tela === 'cadastro' && cadastroOk && (
            <div style={{ textAlign: 'center', padding: '8px 0 8px', animation: 'lp-up .3s ease' }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Mail size={24} style={{ color: b.accent }} /></div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: b.text, marginBottom: 8 }}>Verifique seu e-mail</h3>
              <p style={{ fontSize: 13, color: b.muted, lineHeight: 1.6, marginBottom: 18 }}>Enviamos um link de confirmação para<br /><strong style={{ color: b.text }}>{novoEmail}</strong></p>
              <BtnPrimary type="button" onClick={() => trocarTela('entrar')}><LogIn size={15} /> Ir para o login</BtnPrimary>
            </div>
          )}

          {tela === 'reset' && (
            <div style={{ animation: 'lp-up .25s ease' }}>
              {!resetOk ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: b.text, marginBottom: 2 }}>Recuperar senha</p>
                    <p style={{ fontSize: 12, color: b.muted }}>Enviaremos um link por e-mail</p>
                  </div>
                  <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: b.text, display: 'block', marginBottom: 5 }}>E-mail da conta</label>
                      <input className="lp-inp" style={inp()} type="email" placeholder="seu@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus /></div>
                    {erroReset && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>{erroReset}</div>}
                    <BtnPrimary loading={carregandoReset ? 'Enviando...' : null}>Enviar link de recuperação</BtnPrimary>
                    <button type="button" onClick={() => trocarTela('entrar')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: b.muted, textAlign: 'center', fontFamily: 'inherit' }}>Voltar ao login</button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0 8px' }}>
                  <div style={{ width: 58, height: 58, borderRadius: 16, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Check size={24} style={{ color: b.accent }} /></div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: b.text, marginBottom: 8 }}>E-mail enviado!</h3>
                  <p style={{ fontSize: 13, color: b.muted, lineHeight: 1.6, marginBottom: 18 }}>Verifique sua caixa de entrada e clique no link para redefinir a senha.</p>
                  <BtnPrimary type="button" onClick={() => trocarTela('entrar')}><LogIn size={15} /> Voltar ao login</BtnPrimary>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────
export default function LandingPage() {
  const { auth } = useApp()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [navSolid, setNavSolid] = useState(false)

  useEffect(() => {
    if (auth.logado) navigate('/painel', { replace: true })
  }, [auth.logado, navigate])

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove('light')
  }, [])

  return (
    <div style={{ background: b.bg, color: b.text, minHeight: '100dvh', fontFamily: '"Inter", system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes lp-spin  { to { transform: rotate(360deg) } }
        @keyframes lp-up    { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lp-fade  { from { opacity:0 } to { opacity:1 } }
        @keyframes lp-hero  { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }

        /* inputs */
        .lp-inp:focus        { border-color: #fd4b01 !important; box-shadow: 0 0 0 3px rgba(253,75,1,0.15) !important; }
        .lp-inp::placeholder { color: rgba(255,255,255,0.28); }
        .lp-inp:-webkit-autofill, .lp-inp:-webkit-autofill:hover, .lp-inp:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px #202020 inset !important;
          -webkit-text-fill-color: #fff !important;
        }

        /* nav buttons */
        .lp-ghost:hover { background: rgba(255,255,255,0.08) !important; }

        /* feature cards */
        .lp-feat:hover { border-color: rgba(253,75,1,0.3) !important; background: rgba(253,75,1,0.03) !important; }

        /* plan cards */
        .lp-plan { transition: transform .2s ease; }
        .lp-plan:hover { transform: translateY(-4px); }

        /* hero */
        .lp-hero-content { animation: lp-hero .65s ease both; }

        /* ── RESPONSIVE ─────────────────────────────────────────── */

        /* Nav */
        .lp-nav-inner { max-width: 1100px; margin: 0 auto; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .lp-nav-logo  { height: 28px; object-fit: contain; }
        .lp-nav-btns  { display: flex; align-items: center; gap: 8px; }
        .lp-btn-ghost-nav { padding: 8px 16px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s; white-space: nowrap; }
        .lp-btn-accent-nav { padding: 8px 16px; border-radius: 9px; border: none; background: #fd4b01; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(253,75,1,0.35); white-space: nowrap; }

        /* Hero section */
        .lp-hero { min-height: 100dvh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 100px 20px 72px; position: relative; overflow: hidden; }
        .lp-hero-title { font-family: "Clash Display", "Inter", sans-serif; font-size: clamp(32px, 8vw, 72px); font-weight: 700; line-height: 1.08; letter-spacing: -0.03em; margin-bottom: 20px; }
        .lp-hero-sub { font-size: clamp(15px, 3vw, 19px); color: rgba(255,255,255,0.5); line-height: 1.65; max-width: 560px; margin: 0 auto 36px; }
        .lp-hero-ctas { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .lp-cta-primary { padding: 14px 28px; border-radius: 12px; border: none; background: #fd4b01; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 24px rgba(253,75,1,0.4); display: flex; align-items: center; gap: 7px; white-space: nowrap; }
        .lp-cta-secondary { padding: 14px 28px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .lp-cta-secondary:hover { background: rgba(255,255,255,0.07); }

        /* Sections */
        .lp-section { padding: 72px 20px 80px; }
        .lp-section-dark { padding: 72px 20px 80px; background: #181818; }
        .lp-inner { max-width: 1100px; margin: 0 auto; }
        .lp-inner-md { max-width: 960px; margin: 0 auto; }
        .lp-section-title { font-family: "Clash Display", "Inter", sans-serif; font-size: clamp(24px, 5vw, 42px); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
        .lp-section-sub { font-size: 16px; color: rgba(255,255,255,0.5); max-width: 460px; margin: 0 auto; }

        /* Feature grid */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 14px; margin-top: 48px; }

        /* Pricing grid */
        .lp-plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 14px; margin-top: 48px; align-items: start; }

        /* Footer */
        .lp-footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }

        /* Mobile overrides */
        @media (max-width: 480px) {
          .lp-nav-inner    { height: 56px; }
          .lp-nav-logo     { height: 24px; }
          .lp-btn-ghost-nav { padding: 7px 12px; font-size: 13px; }
          .lp-btn-accent-nav { padding: 7px 12px; font-size: 13px; }

          .lp-hero { padding: 88px 16px 60px; }
          .lp-hero-ctas { flex-direction: column; align-items: stretch; }
          .lp-cta-primary, .lp-cta-secondary { justify-content: center; padding: 14px 20px; }

          .lp-section, .lp-section-dark { padding: 56px 16px 60px; }
          .lp-section-title { text-align: center; }
          .lp-section-sub   { text-align: center; }

          .lp-footer-inner { justify-content: center; text-align: center; }
        }

        /* Tablet: 2 col features */
        @media (min-width: 640px) and (max-width: 1023px) {
          .lp-feat-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* Desktop: 3 col features, 3 col plans */
        @media (min-width: 1024px) {
          .lp-feat-grid  { grid-template-columns: repeat(3, 1fr); }
          .lp-plan-grid  { grid-template-columns: repeat(3, 1fr); }
          .lp-nav-inner  { height: 64px; }
        }

        ::selection { background: rgba(253,75,1,0.35); color: #fff; }
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 20px',
        transition: 'background .3s, backdrop-filter .3s',
        background: navSolid ? 'rgba(16,16,16,0.92)' : 'transparent',
        backdropFilter: navSolid ? 'blur(16px)' : 'none',
        borderBottom: navSolid ? `1px solid ${b.border}` : '1px solid transparent',
      }}>
        <div className="lp-nav-inner">
          <img src="/logo-dark.png" alt="Cheffya" className="lp-nav-logo" />
          <div className="lp-nav-btns">
            <button className="lp-btn-ghost-nav lp-ghost" onClick={() => setModal('entrar')}>Entrar</button>
            <button className="lp-btn-accent-nav" onClick={() => setModal('cadastro')}>Começar grátis</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Glow */}
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(600px, 100vw)', height: 'min(600px, 100vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,75,1,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="lp-hero-content" style={{ maxWidth: 780, width: '100%' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: b.accentDim, border: `1px solid ${b.accentBdr}`, fontSize: 12, fontWeight: 600, color: b.accent, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.accent, flexShrink: 0 }} />
            Sistema de gestão para restaurantes
          </div>

          <h1 className="lp-hero-title">
            Gerencie seu{' '}
            <span style={{ color: b.accent }}>restaurante</span>
            <br />com inteligência.
          </h1>

          <p className="lp-hero-sub">
            Cardápio, pedidos, estoque, delivery, mesas e relatórios — tudo em um só lugar. Simples, rápido e feito para o seu dia a dia.
          </p>

          <div className="lp-hero-ctas">
            <button className="lp-cta-primary" onClick={() => setModal('cadastro')}>
              Começar gratuitamente <ChevronRight size={17} />
            </button>
            <button className="lp-cta-secondary" onClick={() => setModal('entrar')}>
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <h2 className="lp-section-title">Tudo que seu restaurante precisa</h2>
            <p className="lp-section-sub">Do pedido ao caixa, do estoque ao delivery — uma plataforma completa.</p>
          </div>
          <div className="lp-feat-grid">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="lp-feat" style={{ background: b.surface, border: `1px solid ${b.border}`, borderRadius: 16, padding: '24px 20px', transition: 'border-color .2s, background .2s' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={19} style={{ color: b.accent }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 7, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: b.muted, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section className="lp-section-dark">
        <div className="lp-inner-md">
          <div style={{ textAlign: 'center' }}>
            <h2 className="lp-section-title">Planos simples e transparentes</h2>
            <p className="lp-section-sub">Sem surpresas. Cancele quando quiser.</p>
          </div>
          <div className="lp-plan-grid">
            {plans.map(({ id, label, badge, desc, items, popular }) => (
              <div key={id} className="lp-plan" style={{ background: popular ? 'linear-gradient(135deg, rgba(253,75,1,0.07), rgba(253,75,1,0.02))' : b.bg, border: `1.5px solid ${popular ? b.accentBdr : b.border}`, borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
                {badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: popular ? b.accent : b.surface2, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: popular ? '0 4px 12px rgba(253,75,1,0.4)' : 'none' }}>
                    {badge}
                  </div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: b.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</p>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: '"Clash Display", "Inter", sans-serif', color: b.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Em breve</div>
                <p style={{ fontSize: 13, color: b.muted, marginBottom: 24 }}>{desc}</p>
                <button onClick={() => setModal('cadastro')} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${popular ? b.accent : b.border2}`, background: popular ? b.accent : 'transparent', color: popular ? '#fff' : b.text, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 22, boxShadow: popular ? '0 4px 18px rgba(253,75,1,0.3)' : 'none' }}>
                  Começar agora
                </button>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: b.muted }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: b.accentDim, border: `1px solid ${b.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} style={{ color: b.accent }} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="lp-section" style={{ textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 className="lp-section-title">Pronto para transformar<br />seu restaurante?</h2>
          <p style={{ fontSize: 16, color: b.muted, marginBottom: 32, lineHeight: 1.6, marginTop: 12 }}>Comece hoje. Sem cartão de crédito. Sem complicação.</p>
          <button onClick={() => setModal('cadastro')} style={{ padding: '15px 36px', borderRadius: 13, border: 'none', background: b.accent, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(253,75,1,0.4)', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            Criar minha conta grátis <ChevronRight size={19} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${b.border}`, padding: '24px 20px' }}>
        <div className="lp-footer-inner">
          <img src="/logo-dark.png" alt="Cheffya" style={{ height: 22, objectFit: 'contain' }} />
          <p style={{ fontSize: 12, color: b.subtle }}>© {new Date().getFullYear()} Cheffya · Todos os direitos reservados</p>
        </div>
      </footer>

      {modal && <Modal tab={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
