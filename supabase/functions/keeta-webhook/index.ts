// keeta-webhook: recebe pedidos da Keeta em tempo real
// Configure em: Painel Keeta → Configurações → Integrações → Webhook → URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function mapearItens(items: any[], mapeamento: Record<string, string>, pratos: any[]) {
  return (items || []).map((item: any) => {
    const nome = item.productName || item.name || item.description || ''
    const nomeLower = nome.toLowerCase()

    let pratoId = mapeamento[item.id] || mapeamento[item.productId] || mapeamento[nome] || null
    if (!pratoId) {
      const match = pratos.find(p =>
        p.nome.toLowerCase() === nomeLower ||
        nomeLower.includes(p.nome.toLowerCase()) ||
        p.nome.toLowerCase().includes(nomeLower)
      )
      pratoId = match?.id || null
    }

    const qtd   = item.qty || item.quantity || item.amount || 1
    const preco = item.price || item.unitPrice || item.value || 0

    return {
      uid: crypto.randomUUID(),
      pratoId,
      ifoodItemName: nome,
      ifoodItemCode: String(item.id || item.productId || ''),
      quantidade: qtd,
      precoUnit: preco,
      opcoes: (item.additionals || item.options || item.extras || []).map((add: any) => ({
        nome: add.name || add.description || '',
        precoExtra: add.price || add.value || 0,
      })),
    }
  })
}

function buildPedido(order: any, userId: string, mapeamento: Record<string, string>, pratos: any[]) {
  const agora = agoraISO()

  // Normaliza — Keeta usa estrutura ligeiramente diferente por versão
  const customer = order.customer || order.user || order.consumer || {}
  const address  = order.address || order.deliveryAddress || order.delivery?.address || {}
  const items    = order.products || order.items || order.orderItems || []
  const payment  = order.payment || order.payments?.[0] || {}
  const taxa     = order.deliveryFee || order.shippingFee || order.delivery?.fee || 0

  const enderecoStr = address.fullAddress
    || address.formattedAddress
    || [address.street, address.number, address.complement, address.district || address.neighborhood, address.city]
       .filter(Boolean).join(', ')

  const nomeCliente = customer.name || customer.fullName || ''
  const telCliente  = customer.phone || customer.phoneNumber || customer.cellphone || null
  const orderId     = String(order.orderId || order.id || order.orderCode || '')
  const shortId     = String(order.shortCode || order.shortId || order.displayId || orderId.slice(-6))
  const obs         = order.observation || order.notes || order.comment || ''
  const formaPag    = payment.method || payment.name || payment.type || null

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    data: hojeStr(),
    hora: horaStr(),
    status: 'pendente',
    canal: 'keeta',
    pago: false,
    cancelado: false,
    ifood_order_id: `keeta_${orderId}`,
    ifood_short_id: shortId,
    cliente_nome: nomeCliente,
    cliente_telefone: telCliente,
    endereco_entrega: enderecoStr,
    obs,
    itens: mapearItens(items, mapeamento, pratos),
    timestamps: { pendente: agora },
    forma_pagamento: formaPag,
    plataforma_taxa: taxa,
    garcon_id: null,
    mesa_id: null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('keeta-webhook ativo', { status: 200 })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Keeta pode enviar { type, order } ou { event, data } ou direto o order
  const event = payload.type || payload.event || payload.eventType || 'new_order'
  const order = payload.order || payload.data || payload

  if (!order) return new Response('OK', { status: 200 })

  // Identifica o restaurante pelo loja_id / store_id no payload
  const lojaId = String(
    order.storeId || order.lojaId || order.shopId || order.merchantId ||
    payload.storeId || payload.lojaId || payload.shopId || payload.merchantId || ''
  )

  if (!lojaId) {
    console.warn('keeta-webhook: loja_id não encontrado no payload')
    return new Response('OK', { status: 200 })
  }

  // Busca config em integracoes_config
  const { data: configs } = await sb.from('integracoes_config').select('user_id, config')
  const cfg = configs?.find(c => {
    const keeta = c.config?.keeta || {}
    return keeta.loja_id === lojaId || keeta.store_id === lojaId
  })

  if (!cfg) {
    console.warn('keeta-webhook: nenhuma config encontrada para loja_id', lojaId)
    return new Response('OK', { status: 200 })
  }

  const userId = cfg.user_id
  const keeta  = cfg.config.keeta || {}

  // Novos pedidos
  if (['new_order', 'ORDER_PLACED', 'order.created', 'order_placed'].includes(event)) {
    const orderId = String(order.orderId || order.id || order.orderCode || '')
    if (!orderId) return new Response('OK', { status: 200 })

    // Idempotência
    const { data: existing } = await sb.from('pedidos')
      .select('id').eq('ifood_order_id', `keeta_${orderId}`).maybeSingle()
    if (existing) return new Response('OK', { status: 200 })

    const { data: pratos } = await sb.from('pratos').select('id, nome').eq('user_id', userId)
    const mapeamento: Record<string, string> = keeta.mapeamento || {}

    const pedido = buildPedido(order, userId, mapeamento, pratos || [])

    const { error } = await sb.from('pedidos').insert(pedido)
    if (error) console.error('keeta-webhook: erro ao inserir pedido', error.message)
  }

  // Cancelamentos
  if (['order_cancelled', 'ORDER_CANCELLED', 'order.cancelled', 'cancel'].includes(event)) {
    const orderId = String(order.orderId || order.id || '')
    if (orderId) {
      await sb.from('pedidos')
        .update({ cancelado: true, status: 'cancelado' })
        .eq('ifood_order_id', `keeta_${orderId}`)
        .eq('user_id', userId)
    }
  }

  return new Response('OK', { status: 200 })
})
