// 99food-webhook: recebe pedidos do 99food em tempo real
// O 99food envia um POST com o evento de novo pedido para essa URL.
// Configure em: Portal Parceiro 99food → Integrações → Webhook → URL
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

// Mapeia itens do 99food para pratos internos
// Estratégia: mapeamento manual → nome exato → nome parcial
function mapearItens(items: any[], mapeamento: Record<string, string>, pratos: any[]) {
  return (items || []).map((item: any) => {
    const nome = item.name || item.productName || item.title || ''
    const nomeLower = nome.toLowerCase()

    let pratoId = mapeamento[item.id] || mapeamento[nome] || null
    if (!pratoId) {
      const match = pratos.find(p =>
        p.nome.toLowerCase() === nomeLower ||
        nomeLower.includes(p.nome.toLowerCase()) ||
        p.nome.toLowerCase().includes(nomeLower)
      )
      pratoId = match?.id || null
    }

    const qtd = item.quantity || item.qty || item.amount || 1
    const preco = item.unitPrice || item.price || item.value || 0

    return {
      uid: crypto.randomUUID(),
      pratoId,
      ifoodItemName: nome, // reutilizamos o mesmo campo para o nome externo
      ifoodItemCode: String(item.id || ''),
      quantidade: qtd,
      precoUnit: preco,
      opcoes: (item.subItems || item.options || item.complements || []).map((sub: any) => ({
        nome: sub.name || sub.description || '',
        precoExtra: sub.price || sub.unitPrice || 0,
      })),
    }
  })
}

function buildPedido(order: any, userId: string, mapeamento: Record<string, string>, pratos: any[]) {
  const agora = agoraISO()

  // Normaliza campos — o 99food pode usar estruturas ligeiramente diferentes por versão de API
  const customer = order.customer || order.consumer || {}
  const address  = order.deliveryAddress || order.delivery?.address || {}
  const items    = order.items || order.products || order.orderItems || []
  const payment  = order.payments?.[0] || order.payment || {}
  const total    = order.total?.orderAmount || order.totalValue || order.amount || 0
  const taxa     = order.total?.deliveryFee || order.deliveryFee || order.shippingFee || 0

  const enderecoStr = address.formattedAddress
    || [address.street, address.number, address.complement, address.neighborhood, address.city]
       .filter(Boolean).join(', ')

  const nomeCliente  = customer.name || customer.fullName || ''
  const telCliente   = customer.phone || customer.phoneNumber || null
  const orderId      = String(order.id || order.orderId || order.code || '')
  const shortId      = String(order.shortId || order.displayId || order.shortReference || orderId.slice(-6))
  const obs          = order.notes || order.customerNote || order.observation || ''
  const formaPag     = payment.name || payment.method || payment.type || null

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    data: hojeStr(),
    hora: horaStr(),
    status: 'pendente',
    canal: '99food',
    pago: false,
    cancelado: false,
    // reutiliza colunas ifood_order_id/ifood_short_id para armazenar o ID externo
    ifood_order_id: `99food_${orderId}`,
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
  if (req.method === 'GET') return new Response('99food-webhook ativo', { status: 200 })
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

  // O 99food pode enviar envelope { event, order } ou direto o objeto order
  const event = payload.event || payload.type || payload.eventType || 'ORDER_PLACED'
  const order = payload.order || payload.data || payload

  if (!order) return new Response('OK', { status: 200 })

  // Identifica o restaurante pelo restaurant_id ou merchant_id
  const restaurantId = String(
    order.merchant?.id || order.restaurantId || order.merchantId ||
    payload.merchantId || payload.restaurantId || ''
  )

  if (!restaurantId) {
    console.warn('99food-webhook: restaurant_id não encontrado no payload')
    return new Response('OK', { status: 200 })
  }

  // Busca config do restaurante em integracoes_config
  const { data: configs } = await sb.from('integracoes_config').select('user_id, config')
  const cfg = configs?.find(c => {
    const noventa = c.config?.noventa_nove || {}
    return noventa.restaurant_id === restaurantId || noventa.merchant_id === restaurantId
  })

  if (!cfg) {
    console.warn('99food-webhook: nenhuma config encontrada para restaurant_id', restaurantId)
    return new Response('OK', { status: 200 })
  }

  const userId  = cfg.user_id
  const noventa = cfg.config.noventa_nove || {}

  // Novos pedidos
  if (['ORDER_PLACED', 'NEW_ORDER', 'order.placed', 'new_order'].includes(event)) {
    const orderId = String(order.id || order.orderId || order.code || '')
    if (!orderId) return new Response('OK', { status: 200 })

    // Idempotência
    const { data: existing } = await sb.from('pedidos')
      .select('id').eq('ifood_order_id', `99food_${orderId}`).maybeSingle()
    if (existing) return new Response('OK', { status: 200 })

    const { data: pratos } = await sb.from('pratos').select('id, nome').eq('user_id', userId)
    const mapeamento: Record<string, string> = noventa.mapeamento || {}

    const pedido = buildPedido(order, userId, mapeamento, pratos || [])

    const { error } = await sb.from('pedidos').insert(pedido)
    if (error) console.error('99food-webhook: erro ao inserir pedido', error.message)
  }

  // Cancelamentos
  if (['ORDER_CANCELLED', 'CANCELLED', 'order.cancelled', 'cancel_order'].includes(event)) {
    const orderId = String(order.id || order.orderId || '')
    if (orderId) {
      await sb.from('pedidos')
        .update({ cancelado: true, status: 'cancelado' })
        .eq('ifood_order_id', `99food_${orderId}`)
        .eq('user_id', userId)
    }
  }

  return new Response('OK', { status: 200 })
})
