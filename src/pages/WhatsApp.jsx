import { MessageCircle, ShoppingCart, UserCheck, Package, BarChart2, Star } from 'lucide-react'

const features = [
  {
    Icon: ShoppingCart,
    title: 'Resgate de Pedidos Esquecidos',
    desc: 'O cliente começou a montar o pedido e parou no meio do caminho? Nosso sistema entra em contato pelo WhatsApp em poucos minutos, tira as dúvidas de forma natural e ajuda a fechar a venda.',
  },
  {
    Icon: UserCheck,
    title: 'Trazendo os "Sumidos" de Volta',
    desc: 'Se o cliente pedia toda semana e já faz 20 dias que não aparece, o sistema percebe sozinho e manda uma mensagem amigável com um cupom especial para ele voltar a comprar.',
  },
  {
    Icon: Package,
    title: 'Controle de Estoque pelo WhatsApp',
    desc: 'Faltou um ingrediente no meio do movimento? É só mandar uma mensagem para a nossa IA (ex: "Acabou a muçarela" ou "Pausa o X-Bacon") e o cardápio é atualizado na mesma hora — sem abrir nenhum painel.',
  },
  {
    Icon: BarChart2,
    title: 'Relatórios Inteligentes para Você',
    desc: 'No final do dia ou semana, a Inteligência Artificial analisa todo seu movimento e entrega um resumo fácil: o que vendeu mais, onde sobrou mais lucro e o que melhorar para o dia seguinte.',
  },
  {
    Icon: Star,
    title: 'Pós-Venda Automático',
    desc: 'Logo após a entrega, o sistema pergunta automaticamente se o cliente gostou. Se elogiar, já agradece e programa um incentivo para ele pedir novamente na próxima semana.',
  },
]

export default function WhatsApp() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
        borderRadius: 20, padding: '4px 12px', marginBottom: 20,
        opacity: 0.9,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Em Breve</span>
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
          Estamos construindo a nossa nova central de{' '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Automação e Inteligência Artificial</strong>
          {' '}— uma ferramenta que trabalha sozinha nos bastidores para garantir que você venda mais e tenha menos dor de cabeça.
        </p>
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* Features */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        O que está chegando na sua conta:
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map(({ Icon, title, desc }, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 16, padding: '16px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28, padding: '24px 28px', borderRadius: 14, textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={26} color="var(--accent)" />
          </div>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Foque na cozinha. Nós cuidamos das vendas.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
          Chega de perder dinheiro por falta de tempo para responder todo mundo. Esta atualização está na fase final de desenvolvimento e em breve será liberada aqui no seu painel.
        </p>
      </div>

    </div>
  )
}
