// ifood-webhook: recebe eventos do iFood em tempo real
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IFOOD_API = 'https://merchant-api.ifood.com.br'

function hojeStr() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-')
}
function horaStr() {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
}
function agoraISO() {
  return new Date(new Date().toLocaleString('en', { timeZone: 'America/Sao_Paulo' })).toISOString()
}

async function getValidToken(sb: ReturnType<typeof createClient>, userId: string, cfg: any) {
  // Verifica se token ainda válido
  if (cfg.token_cache?.access_token && cfg.token_cache?.expires_at) {
    const expira = new Date(cfg.token_cache.expires_at).getTime()
    if (Date.now() < expira - 60000) return cfg.token_cache.access_token
  }
  // Renova token
  const res = await fetch(`${IFOOD_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grantType: 'client_credentials',
      clientId: cfg.client_id,
      clientSecret: cfg.client_secret,
    }),
  })
  if (!res.ok) throw new Error('Token refresh falhou')
  const data = await res.json()
  const token = data.accessToken || data.access_token
  const expiresAt = new Date(Date.now() + (data.expiresIn || 3600) * 1000).toISOString()
  await sb.from('ifood_config').update({ token_cache: { access_token: token, expires_at: expiresAt } }).eq('user_id', userId)
  return token
}

async function getOrderDetails(token: string, orderId: string) {
  const res = await fetch(`${IFOOD_API}/order/v1.0/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Order ${orderId} não encontrado: ${res.status}`)
  return res.json()
}

function buildPedido(order: any, userId: string, mapeamento: Record<string, string>, pratos: any[]) {
  const agora = agoraISO()
  const itens = (order.items || []).map((item: any) => {
    // Tenta mapear pelo mapeamento manual, depois por nome similar
    let pratoId = mapeamento[item.externalCode] || mapeamento[item.name]
    if (!pratoId) {
      const nomeLower = (item.name || '').toLowerCase()
      const match = pratos.find(p => p.nome.toLowerCase() === nomeLower || nomeLower.includes(p.nome.toLowerCase()))
      pratoId = match?.id || null
    }
    return {
      uid: crypto.randomUUID(),
      pratoId,
      ifoodItemName: item.name,
      ifoodItemCode: item.externalCode,
      quantidade: item.quantity,
      precoUnit: item.price,
      opcoes: (item.subItems || []).map((sub: any) => ({
        nome: sub.name,
        precoExtra: sub.price || 0,
      })),
    }
  })

  const endereco = order.delivery?.deliveryAddress
  const enderecoStr = endereco
    ? `${endereco.streetName}, ${endereco.streetNumber}${endereco.complement ? ' ' + endereco.complement : ''} - ${endereco.neighborhood}, ${endereco.city}`
    : ''

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    data: hojeStr(),
    hora: horaStr(),
    status: 'pendente',
    canal: 'ifood',
    pago: false,
    cancelado: false,
    ifood_order_id: order.id,
    ifood_short_id: order.displayId || order.shortReference || '',
    cliente_nome: order.customer?.name || '',
    cliente_telefone: order.customer?.phone?.number || null,
    endereco_entrega: enderecoStr,
    obs: order.customer?.orderNote || '',
    itens,
    timestamps: { pendente: agora },
    garcon_id: null,
    mesa_id: null,
  }
}

Deno.serve(async (req) => {
  // iFood envia POST com o evento
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // iFood pode enviar array ou objeto único
  const eventos = Array.isArray(payload) ? payload : [payload]

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  for (const evento of eventos) {
    const { code, orderId, merchantId } = evento

    if (!merchantId || !orderId) continue

    // Busca config do restaurante pelo merchant_id
    const { data: cfg } = await sb
      .from('ifood_config')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('ativo', true)
      .maybeSingle()

    if (!cfg) continue

    const userId = cfg.user_id

    if (code === 'PLACED') {
      // Verifica se já existe (idempotência)
      const { data: existing } = await sb.from('pedidos')
        .select('id').eq('ifood_order_id', orderId).maybeSingle()
      if (existing) continue

      try {
        const token = await getValidToken(sb, userId, cfg)
        const order = await getOrderDetails(token, orderId)

        // Busca pratos e mapeamento do restaurante
        const { data: pratos } = await sb.from('pratos').select('id, nome').eq('user_id', userId)
        const { data: cfgFull } = await sb.from('ifood_config').select('mapeamento').eq('user_id', userId).maybeSingle()
        const mapeamento = cfgFull?.mapeamento || {}

        const pedido = buildPedido(order, userId, mapeamento, pratos || [])
        await sb.from('pedidos').insert(pedido)

      } catch (e) {
        console.error('Erro ao processar pedido iFood:', orderId, e.message)
      }
    }

    if (code === 'CANCELLED' || code === 'CONSUMER_CANCELLATION_REQUESTED') {
      await sb.from('pedidos')
        .update({ cancelado: true, status: 'cancelado' })
        .eq('ifood_order_id', orderId)
        .eq('user_id', userId)
    }
  }

  return new Response('OK', { status: 200 })
})
