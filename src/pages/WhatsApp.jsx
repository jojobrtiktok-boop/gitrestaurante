export default function WhatsApp() {
  const features = [
    {
      icon: '🛒',
      title: 'Resgate de Pedidos Esquecidos',
      desc: 'O cliente começou a montar o pedido e parou no meio do caminho? Nosso sistema entra em contato pelo WhatsApp em poucos minutos, tira as dúvidas de forma natural e ajuda a fechar a venda.',
    },
    {
      icon: '💤',
      title: 'Trazendo os "Sumidos" de Volta',
      desc: 'Se o cliente pedia toda semana e já faz 20 dias que não aparece, o sistema percebe sozinho e manda uma mensagem amigável com um cupom especial para ele voltar a comprar.',
    },
    {
      icon: '📦',
      title: 'Controle de Estoque pelo WhatsApp',
      desc: 'Faltou um ingrediente no meio do movimento? É só mandar uma mensagem para a nossa IA (ex: "Acabou a muçarela" ou "Pausa o X-Bacon") e o cardápio é atualizado na mesma hora — sem abrir nenhum painel.',
    },
    {
      icon: '📊',
      title: 'Relatórios Inteligentes para Você',
      desc: 'No final do dia ou semana, a Inteligência Artificial analisa todo seu movimento e entrega um resumo fácil: o que vendeu mais, onde sobrou mais lucro e o que melhorar para o dia seguinte.',
    },
    {
      icon: '⭐',
      title: 'Pós-Venda Automático',
      desc: 'Logo após a entrega, o sistema pergunta automaticamente se o cliente gostou. Se elogiar, já agradece e programa um incentivo para ele pedir novamente na próxima semana.',
    },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 20, padding: '4px 12px', marginBottom: 20 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#25d366', boxShadow: '0 0 6px #25d366' }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#25d366' }}>Em Breve</span>
      </div>

      {/* Título */}
      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: 12 }}>
        Automação de WhatsApp e<br />Inteligência Artificial
      </h1>

      <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
        A tecnologia trabalhando pelo seu restaurante, sem você precisar apertar nenhum botão.
      </p>

      {/* Intro */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.75, marginBottom: 32 }}>
        <p>
          Sabe aquele cliente que adorava a sua comida e de repente sumiu? Ou aquele que começa a escolher os pratos no cardápio, mas desiste antes de pagar?
        </p>
        <p>
          Quando isso acontece, você perde dinheiro sem nem perceber. Mas vamos resolver isso de um jeito simples.
        </p>
        <p>
          Estamos construindo a nossa nova central de <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Automação e Inteligência Artificial</strong> — uma ferramenta que trabalha sozinha nos bastidores para garantir que você venda mais e tenha menos dor de cabeça.
        </p>
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* Features */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        O que está chegando na sua conta:
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 16, padding: '18px 20px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {f.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        marginTop: 32, padding: '24px 28px', borderRadius: 16, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(37,211,102,0.03) 100%)',
        border: '1px solid rgba(37,211,102,0.2)',
      }}>
        {/* Ícone WhatsApp grande */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="rgba(37,211,102,0.15)" />
            <path d="M24 9C16.268 9 10 15.268 10 23c0 2.637.717 5.108 1.965 7.232L10 39l9.014-1.94A14.94 14.94 0 0024 38c7.732 0 14-6.268 14-14S31.732 9 24 9z" fill="#25d366" />
            <path d="M30.5 26.41c-.378-.189-2.236-1.103-2.582-1.228-.346-.126-.598-.189-.85.189-.251.378-.974 1.228-1.194 1.48-.22.252-.44.283-.818.094-.378-.188-1.596-.588-3.04-1.876-1.124-1.003-1.882-2.241-2.102-2.619-.22-.378-.023-.582.165-.77.17-.169.378-.44.567-.66.189-.22.252-.378.378-.63.126-.252.063-.472-.031-.66-.094-.189-.85-2.047-1.165-2.803-.307-.735-.618-.636-.85-.648L19.5 16c-.22 0-.567.083-.864.41-.298.326-1.134 1.108-1.134 2.702s1.16 3.134 1.323 3.353c.163.22 2.285 3.49 5.54 4.893 3.255 1.403 3.255.935 3.842.876.588-.059 1.897-.775 2.165-1.524.267-.75.267-1.392.188-1.524-.079-.132-.299-.21-.678-.4z" fill="white" />
          </svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Foque na cozinha. Nós cuidamos das vendas.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
          Chega de perder dinheiro por falta de tempo para responder todo mundo. Esta atualização está na fase final de desenvolvimento e em breve será liberada aqui no seu painel.
        </p>
      </div>

    </div>
  )
}
