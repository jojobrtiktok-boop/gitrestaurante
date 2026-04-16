import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

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
  error:     '#ef4444',
  errorBg:   'rgba(239,68,68,0.06)',
  shadow:    '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: c.input, border: `1.5px solid ${c.border}`,
  borderRadius: 10, color: c.text,
  padding: '11px 14px', fontSize: 14, outline: 'none',
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [sessaoOk, setSessaoOk] = useState(false)

  useEffect(() => {
    // Supabase injeta o token via hash na URL após clicar no link do e-mail
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessaoOk(true)
      }
    })
    // Verifica se já tem sessão ativa (token já processado)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setSessaoOk(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 4) return setErro('A senha deve ter pelo menos 4 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)

    if (error) return setErro('Erro ao redefinir senha. Tente solicitar um novo link.')
    setSucesso(true)
    setTimeout(() => navigate('/painel'), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: c.card, borderRadius: 20, padding: 36, boxShadow: c.shadow }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🍽️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: c.text, margin: 0 }}>Cheffya</h1>
          <p style={{ fontSize: 13, color: c.muted, margin: '4px 0 0' }}>Redefinir senha</p>
        </div>

        {sucesso ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 700, color: c.text, fontSize: 16, margin: '0 0 6px' }}>Senha redefinida!</p>
            <p style={{ color: c.muted, fontSize: 13 }}>Redirecionando para o painel...</p>
          </div>
        ) : !sessaoOk ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <KeyRound size={40} color={c.muted} style={{ marginBottom: 12 }} />
            <p style={{ color: c.secondary, fontSize: 14 }}>Link inválido ou expirado.</p>
            <button
              onClick={() => navigate('/login')}
              style={{ marginTop: 16, background: c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>Nova senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  required
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.muted }}>
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.text, display: 'block', marginBottom: 5 }}>Confirmar nova senha</label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                style={inputStyle}
                required
              />
            </div>

            {erro && (
              <div style={{ background: c.errorBg, border: `1px solid ${c.error}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: c.error }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? c.muted : c.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <button type="button" onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: c.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
