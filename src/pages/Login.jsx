import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Eye, EyeOff, UserPlus, LogIn, Mail, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { login, cadastrarUsuario, resetarSenha } = useApp()
  const navigate = useNavigate()

  const [tela, setTela] = useState('entrar')

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

  // Reset
  const [resetEmail, setResetEmail] = useState('')
  const [resetOk, setResetOk] = useState(false)
  const [erroReset, setErroReset] = useState('')
  const [carregandoReset, setCarregandoReset] = useState(false)

  async function handleEntrar(e) {
    e.preventDefault()
    setErro('')
    if (!email.trim()) return setErro('Informe o email.')
    if (!senha) return setErro('Informe a senha.')
    setCarregando(true)
    const resultado = await login(email.trim(), senha, manterLogado)
    setCarregando(false)
    if (resultado.erro) setErro(resultado.erro)
    else navigate('/')
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErroCadastro(''); setErroNome(''); setErroEmail('')
    if (!novoNome.trim()) return setErroNome('Nome de usuário é obrigatório.')
    if (!novoEmail.trim()) return setErroEmail('Email é obrigatório.')
    if (novaSenha.length < 6) return setErroCadastro('Senha deve ter pelo menos 6 caracteres.')
    if (novaSenha !== confirmarSenha) return setErroCadastro('As senhas não coincidem.')
    setCarregandoCadastro(true)
    const res = await cadastrarUsuario(novoEmail.trim(), novaSenha, novoNome.trim())
    setCarregandoCadastro(false)
    if (res.erro === 'nome_em_uso') return setErroNome('Este nome de usuário já está em uso.')
    if (res.erro === 'email_em_uso') return setErroEmail('Este e-mail já está cadastrado.')
    if (res.erro) return setErroCadastro(res.erro)
    const loginRes = await login(novoEmail.trim(), novaSenha, true)
    if (loginRes.ok) navigate('/')
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

  const TABS = [
    { id: 'entrar',   label: 'Entrar',      icon: <LogIn size={13} /> },
    { id: 'cadastro', label: 'Criar conta', icon: <UserPlus size={13} /> },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-page)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 4px 20px var(--accent-glow)',
          }}>
            <ChefHat size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Menu Control</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Gestão de Restaurantes</p>
        </div>

        {/* Tabs */}
        {tela !== 'reset' && (
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 4, borderRadius: 12, marginBottom: 16 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTela(t.id); setErro(''); setErroCadastro('') }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, transition: 'all .12s',
                  background: tela === t.id ? 'var(--bg-card)' : 'transparent',
                  color: tela === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tela === t.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Entrar ── */}
        {tela === 'entrar' && (
          <div className="card p-6">
            <form onSubmit={handleEntrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Usuário ou E-mail</label>
                <input className="input" placeholder="usuario ou seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="username" />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••" value={senha} onChange={e => setSenha(e.target.value)}
                    autoComplete="current-password" style={{ paddingRight: 42 }} />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Manter logado */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setManterLogado(v => !v)} style={{
                  width: 18, height: 18, borderRadius: 5, border: '2px solid',
                  borderColor: manterLogado ? 'var(--accent)' : 'var(--border)',
                  background: manterLogado ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s', flexShrink: 0,
                }}>
                  {manterLogado && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manter conectado por 60 dias</span>
              </label>

              {erro && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: 0 }}>{erro}</p>}

              <button type="submit" className="btn btn-primary" disabled={carregando}
                style={{ marginTop: 4, width: '100%', justifyContent: 'center', opacity: carregando ? 0.7 : 1 }}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>

              <button type="button" onClick={() => { setTela('reset'); setResetEmail(email); setResetOk(false); setErroReset('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', textAlign: 'center' }}>
                Esqueci minha senha
              </button>
            </form>
          </div>
        )}

        {/* ── Criar conta ── */}
        {tela === 'cadastro' && (
          <div className="card p-6">
            <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Nome de usuário *</label>
                <input className="input" placeholder="Usuário"
                  value={novoNome} onChange={e => { setNovoNome(e.target.value); setErroNome('') }}
                  autoFocus autoComplete="off"
                  style={{ borderColor: erroNome ? '#ef4444' : undefined }} />
                {erroNome && <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>{erroNome}</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>E-mail *</label>
                <input className="input" type="email" placeholder="seu@email.com"
                  value={novoEmail} onChange={e => { setNovoEmail(e.target.value); setErroEmail('') }}
                  autoComplete="email"
                  style={{ borderColor: erroEmail ? '#ef4444' : undefined }} />
                {erroEmail && <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>{erroEmail}</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Senha * (mín. 6 caracteres)</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={mostrarNovaSenha ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                    autoComplete="new-password" style={{ paddingRight: 42 }} />
                  <button type="button" onClick={() => setMostrarNovaSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {mostrarNovaSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Confirmar senha *</label>
                <input className="input" type="password" placeholder="Repita a senha"
                  value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} autoComplete="new-password" />
              </div>

              {erroCadastro && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: 0 }}>{erroCadastro}</p>}

              <button type="submit" className="btn btn-primary" disabled={carregandoCadastro}
                style={{ marginTop: 4, width: '100%', justifyContent: 'center', opacity: carregandoCadastro ? 0.7 : 1 }}>
                <UserPlus size={14} />
                {carregandoCadastro ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
              Cada conta tem dados completamente separados.
            </p>
          </div>
        )}

        {/* ── Resetar senha ── */}
        {tela === 'reset' && (
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Recuperar senha</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Enviaremos um link por email</p>
              </div>
            </div>

            {resetOk ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Mail size={36} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>Email enviado!</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verifique sua caixa de entrada e clique no link para redefinir a senha.</p>
                <button onClick={() => setTela('entrar')} className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>Email da conta</label>
                  <input className="input" type="email" placeholder="seu@email.com"
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus />
                </div>
                {erroReset && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{erroReset}</p>}
                <button type="submit" className="btn btn-primary" disabled={carregandoReset}
                  style={{ width: '100%', justifyContent: 'center', opacity: carregandoReset ? 0.7 : 1 }}>
                  {carregandoReset ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
                <button type="button" onClick={() => setTela('entrar')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Voltar ao login
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
