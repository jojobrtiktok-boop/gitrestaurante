import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

const c = {
  bg:     '#f5f5f7',
  card:   '#ffffff',
  text:   '#111117',
  muted:  '#a1a1aa',
  accent: '#f04000',
  shadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
}

export default function EmailConfirmado() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: c.card, borderRadius: 20, padding: 40, boxShadow: c.shadow, textAlign: 'center' }}>

        {/* Logo */}
        <img src="/logo-light.png" alt="Cheffya" style={{ height: 38, objectFit: 'contain', display: 'block', margin: '0 auto 32px' }} />

        {/* Ícone */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ background: 'rgba(22,163,74,0.1)', borderRadius: '50%', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={52} color="#16a34a" strokeWidth={2} />
          </div>
        </div>

        {/* Texto */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: c.text, margin: '0 0 10px' }}>
          E-mail confirmado!
        </h1>
        <p style={{ fontSize: 14, color: c.muted, margin: '0 0 32px', lineHeight: 1.6 }}>
          Sua conta foi verificada com sucesso.<br />
          Agora é só fazer login para começar.
        </p>

        {/* Botão */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            background: c.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}>
          Fazer login
        </button>

      </div>
    </div>
  )
}
