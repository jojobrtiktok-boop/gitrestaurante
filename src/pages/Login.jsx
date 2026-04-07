import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { login, usuarios, cadastrarUsuario } = useApp()
  const navigate = useNavigate()

  // Tela: 'entrar' | 'cadastro'
  const [tela, setTela] = useState('entrar')

  // Entrar
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Cadastro
  const [novoUsuario, setNovoUsuario] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [carregandoCadastro, setCarregandoCadastro] = useState(false)

  async function handleEntrar(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    await new Promise(r => setTimeout(r, 300))
    const resultado = login(usuario.trim(), senha)
    setCarregando(false)
    if (resultado.erro) setErro(resultado.erro)
    else navigate('/')
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErroCadastro('')
    if (!novoUsuario.trim()) return setErroCadastro('Nome de usuário é obrigatório.')
    if (novaSenha.length < 4) return setErroCadastro('Senha deve ter pelo menos 4 caracteres.')
    if (novaSenha !== confirmarSenha) return setErroCadastro('As senhas não coincidem.')
    setCarregandoCadastro(true)
    await new Promise(r => setTimeout(r, 300))
    const res = cadastrarUsuario(novoUsuario.trim(), novaSenha)
    if (res.erro) { setCarregandoCadastro(false); return setErroCadastro(res.erro) }
    // Auto-login após cadastro
    const loginRes = login(novoUsuario.trim(), novaSenha)
    setCarregandoCadastro(false)
    if (loginRes.ok) navigate('/')
  }

  function selecionarUsuario(nome) {
    setUsuario(nome)
    setSenha('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 20px var(--accent-glow)',
          }}>
            <ChefHat size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Menu Control</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Gestão de Receitas</p>
        </div>

        {/* Toggle de telas */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 4, borderRadius: 12, marginBottom: 16 }}>
          {[
            { id: 'entrar', label: 'Entrar', icon: <LogIn size={13} /> },
            { id: 'cadastro', label: 'Criar conta', icon: <UserPlus size={13} /> },
          ].map(t => (
            <button key={t.id} onClick={() => { setTela(t.id); setErro(''); setErroCadastro('') }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .12s',
                background: tela === t.id ? 'var(--bg-card)' : 'transparent',
                color: tela === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tela === t.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Card Entrar */}
        {tela === 'entrar' && (
          <div className="card p-6">
            {/* Atalhos de usuário */}
            {usuarios.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selecionar conta
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {usuarios.map(u => (
                    <button key={u.id} onClick={() => selecionarUsuario(u.usuario)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)',
                        background: usuario === u.usuario ? 'var(--accent)' : 'var(--bg-hover)',
                        color: usuario === u.usuario ? '#fff' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                      }}>
                      {u.usuario}{u.isAdmin && ' 👑'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleEntrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Usuário</label>
                <input
                  className="input"
                  placeholder="admin"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {erro && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: 0 }}>{erro}</p>}

              <button type="submit" className="btn btn-primary" disabled={carregando}
                style={{ marginTop: 4, width: '100%', justifyContent: 'center', opacity: carregando ? 0.7 : 1 }}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

        {/* Card Criar Conta */}
        {tela === 'cadastro' && (
          <div className="card p-6">
            <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nome de usuário *</label>
                <input
                  className="input"
                  placeholder="lanchonete2"
                  value={novoUsuario}
                  onChange={e => setNovoUsuario(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    placeholder="Mínimo 4 caracteres"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setMostrarNovaSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {mostrarNovaSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Confirmar senha *</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                />
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
      </div>
    </div>
  )
}
