import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, LogIn, Mail, KeyRound, CheckCircle, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

// Paleta fixa light — login sempre no tema claro
const c = {
  bg:        '#f5f5f7',
  card:      '#ffffff',
  border:    '#e8e8ee',
  input:     '#f9f9fb',
  text:      '#111117',
  secondary: '#52525b',
  muted:     '#a1a1aa',
  accent:    '#f04000',
  accentHov: '#d93800',
  accentBg:  'rgba(240,64,0,0.07)',
  accentBdr: 'rgba(240,64,0,0.25)',
  error:     '#ef4444',
  errorBg:   'rgba(239,68,68,0.06)',
  shadow:    '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
}

function Label({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: 'block', marginBottom: 5 }}>
      {children}
    </label>
  )
}

function InputField({ label, error, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: c.error, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}

const inputStyle = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  background: c.input, border: `1.5px solid ${c.border}`,
  borderRadius: 10, color: c.text,
  padding: '11px 14px', fontSize: 14, outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
  fontFamily: 'inherit',
  ...extra,
})

function Btn({ children, loading, type = 'submit', onClick, variant = 'primary', style: s = {} }) {
  const base = {
    width: '100%', padding: '13px', borderRadius: 11, border: 'none',
    fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all .15s', fontFamily: 'inherit',
  }
  const styles = {
    primary: { background: loading ? '#f0836a' : c.accent, color: '#fff', boxShadow: loading ? 'none' : `0 4px 14px rgba(240,64,0,0.35)` },
    ghost:   { background: 'transparent', color: c.secondary, border: `1.5px solid ${c.border}` },
  }
  return (
    <button type={type} onClick={onClick} disabled={!!loading} style={{ ...base, ...styles[variant], ...s }}>
      {loading
        ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />{loading}</>
        : children}
    </button>
  )
}

export default function Login() {
  const { login, cadastrarUsuario, resetarSenha, tema } = useApp()
  const navigate = useNavigate()
  const [tela, setTela] = useState('entrar')

  // Forçar tema claro — reaplica toda vez que AppContext mudar o tema
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('light')
    return () => {
      // ao sair do login, restaura o tema salvo
      try {
        const saved = JSON.parse(localStorage.getItem('rd_tema'))
        if (saved !== 'light') root.classList.remove('light')
      } catch { /* noop */ }
    }
  }, [tema])

  // Entrar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterLogado, setManterLogado] = useState(true)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Cadastro
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

  // Reset
  const [resetEmail, setResetEmail] = useState('')
  const [resetOk, setResetOk] = useState(false)
  const [erroReset, setErroReset] = useState('')
  const [carregandoReset, setCarregandoReset] = useState(false)

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
    if (!novoNome.trim()) return setErroNome('Nome de usuário obrigatório.')
    if (!novoEmail.trim()) return setErroEmail('Email obrigatório.')
    if (novaSenha.length < 6) return setErroCadastro('Senha deve ter pelo menos 6 caracteres.')
    if (novaSenha !== confirmarSenha) return setErroCadastro('As senhas não coincidem.')
    setCarregandoCadastro(true)
    const res = await cadastrarUsuario(novoEmail.trim(), novaSenha, novoNome.trim())
    setCarregandoCadastro(false)
    if (res.erro === 'nome_em_uso') return setErroNome('Este nome de usuário já está em uso.')
    if (res.erro === 'email_em_uso') return setErroEmail('Este e-mail já está cadastrado.')
    if (res.erro) return setErroCadastro(res.erro)
    setCadastroOk(true) // Confirmação de email ativada — não faz login direto
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

  return (
    <div style={{ minHeight: '100dvh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .login-input:focus { border-color: ${c.accent} !important; box-shadow: 0 0 0 3px rgba(240,64,0,0.12) !important; }
        .login-input::placeholder { color: ${c.muted}; }
        .login-btn-ghost:hover { background: ${c.accentBg} !important; border-color: ${c.accentBdr} !important; color: ${c.accent} !important; }
        .login-tab-active { background: #fff !important; color: ${c.text} !important; box-shadow: 0 1px 6px rgba(0,0,0,0.1) !important; }
        /* Neutralizar autofill do Chrome (que fica verde/amarelo) */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px ${c.input} inset !important;
          -webkit-text-fill-color: ${c.text} !important;
          caret-color: ${c.text};
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp .35s ease-out' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo-light.png" alt="Cheffya" style={{ height: 38, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>

        {/* Card */}
        <div style={{ background: c.card, borderRadius: 20, boxShadow: c.shadow, border: `1px solid ${c.border}`, overflow: 'hidden' }}>

          {/* Linha laranja no topo */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${c.accent}, #ff6b3d)` }} />

          <div style={{ padding: '28px 28px 24px' }}>

            {/* Tabs Entrar / Criar conta */}
            {tela !== 'reset' && !cadastroOk && (
              <div style={{ display: 'flex', gap: 3, background: c.bg, padding: 3, borderRadius: 11, marginBottom: 24 }}>
                {[
                  { id: 'entrar',   label: 'Entrar',      Icon: LogIn },
                  { id: 'cadastro', label: 'Criar conta', Icon: UserPlus },
                ].map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => trocarTela(id)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13.5, fontWeight: 600, transition: 'all .15s',
                    background: tela === id ? '#fff' : 'transparent',
                    color: tela === id ? c.text : c.muted,
                    boxShadow: tela === id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                  }}>
                    <Icon size={13} style={{ color: tela === id ? c.accent : c.muted }} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Entrar ── */}
            {tela === 'entrar' && (
              <form onSubmit={handleEntrar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InputField label="Usuário ou E-mail">
                  <input className="login-input" style={inputStyle()} placeholder="usuario ou seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="username" />
                </InputField>

                <InputField label="Senha">
                  <div style={{ position: 'relative' }}>
                    <input className="login-input" style={inputStyle({ paddingRight: 44 })}
                      type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••"
                      value={senha} onChange={e => setSenha(e.target.value)} autoComplete="current-password" />
                    <button type="button" onClick={() => setMostrarSenha(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: 4, display: 'flex' }}>
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </InputField>

                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                  <div onClick={() => setManterLogado(v => !v)} style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${manterLogado ? c.accent : c.border}`,
                    background: manterLogado ? c.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                  }}>
                    {manterLogado && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: c.secondary }}>Manter conectado por 60 dias</span>
                </label>

                {erro && (
                  <div style={{ background: c.errorBg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: c.error, textAlign: 'center' }}>
                    {erro}
                  </div>
                )}

                <Btn loading={carregando ? 'Entrando...' : null}>
                  <LogIn size={16} /> Entrar
                </Btn>

                <button type="button" onClick={() => { setTela('reset'); setResetEmail(email); setResetOk(false); setErroReset('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: c.accent, textAlign: 'center', fontFamily: 'inherit', padding: '2px 0' }}>
                  Esqueci minha senha
                </button>
              </form>
            )}

            {/* ── Criar conta ── */}
            {tela === 'cadastro' && !cadastroOk && (
              <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InputField label="Nome de usuário *" error={erroNome}>
                  <input className="login-input" style={inputStyle({ borderColor: erroNome ? c.error : undefined })}
                    placeholder="seuusuario" value={novoNome}
                    onChange={e => { setNovoNome(e.target.value); setErroNome('') }}
                    autoFocus autoComplete="off" />
                </InputField>

                <InputField label="E-mail *" error={erroEmail}>
                  <input className="login-input" style={inputStyle({ borderColor: erroEmail ? c.error : undefined })}
                    type="email" placeholder="seu@email.com" value={novoEmail}
                    onChange={e => { setNovoEmail(e.target.value); setErroEmail('') }}
                    autoComplete="email" />
                </InputField>

                <InputField label="Senha * (mín. 6 caracteres)">
                  <div style={{ position: 'relative' }}>
                    <input className="login-input" style={inputStyle({ paddingRight: 44 })}
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres" value={novaSenha}
                      onChange={e => setNovaSenha(e.target.value)} autoComplete="new-password" />
                    <button type="button" onClick={() => setMostrarNovaSenha(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: 4, display: 'flex' }}>
                      {mostrarNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </InputField>

                <InputField label="Confirmar senha *">
                  <input className="login-input" style={inputStyle()}
                    type="password" placeholder="Repita a senha"
                    value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password" />
                </InputField>

                {erroCadastro && (
                  <div style={{ background: c.errorBg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: c.error, textAlign: 'center' }}>
                    {erroCadastro}
                  </div>
                )}

                <Btn loading={carregandoCadastro ? 'Criando conta...' : null}>
                  <UserPlus size={16} /> Criar conta
                </Btn>

                <p style={{ fontSize: 12, color: c.muted, textAlign: 'center', margin: 0 }}>
                  Cada conta tem dados completamente separados.
                </p>
              </form>
            )}

            {/* ── Cadastro OK — verificar email ── */}
            {tela === 'cadastro' && cadastroOk && (
              <div style={{ textAlign: 'center', padding: '8px 0 12px', animation: 'fadeUp .3s ease-out' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: c.accentBg, border: `1px solid ${c.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mail size={28} style={{ color: c.accent }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 8px' }}>Verifique seu e-mail</h2>
                <p style={{ fontSize: 13.5, color: c.secondary, lineHeight: 1.6, margin: '0 0 20px' }}>
                  Enviamos um link de confirmação para<br />
                  <strong style={{ color: c.text }}>{novoEmail}</strong>
                </p>
                <p style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Clique no link do e-mail para ativar sua conta e depois faça o login abaixo.
                </p>
                <Btn type="button" onClick={() => trocarTela('entrar')}>
                  <LogIn size={16} /> Ir para o login <ChevronRight size={15} />
                </Btn>
              </div>
            )}

            {/* ── Resetar senha ── */}
            {tela === 'reset' && (
              <div style={{ animation: 'fadeUp .3s ease-out' }}>
                {!resetOk ? (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: c.text, margin: '0 0 2px' }}>Recuperar senha</p>
                      <p style={{ fontSize: 12, color: c.muted, margin: 0 }}>Enviaremos um link por e-mail</p>
                    </div>

                    <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <InputField label="E-mail da conta">
                        <input className="login-input" style={inputStyle()} type="email" placeholder="seu@email.com"
                          value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus />
                      </InputField>
                      {erroReset && (
                        <div style={{ background: c.errorBg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: c.error }}>
                          {erroReset}
                        </div>
                      )}
                      <Btn loading={carregandoReset ? 'Enviando...' : null}>
                        Enviar link de recuperação
                      </Btn>
                      <button type="button" onClick={() => trocarTela('entrar')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: c.muted, textAlign: 'center', fontFamily: 'inherit' }}>
                        Voltar ao login
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: c.accentBg, border: `1px solid ${c.accentBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle size={28} style={{ color: c.accent }} />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 8px' }}>E-mail enviado!</h2>
                    <p style={{ fontSize: 13.5, color: c.secondary, lineHeight: 1.6, margin: '0 0 24px' }}>
                      Verifique sua caixa de entrada e clique no link para redefinir a senha.
                    </p>
                    <Btn type="button" onClick={() => trocarTela('entrar')}>
                      <LogIn size={16} /> Voltar ao login
                    </Btn>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 20 }}>
          © {new Date().getFullYear()} Cheffya · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
