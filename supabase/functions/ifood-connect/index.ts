// ifood-connect: testa credenciais e registra webhook no iFood
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IFOOD_API = 'https://merchant-api.ifood.com.br'
const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ifood-webhook`

async function getToken(clientId: string, clientSecret: string) {
  const res = await fetch(`${IFOOD_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grantType: 'client_credentials',
      clientId,
      clientSecret,
    }),
  })
  if (!res.ok) throw new Error(`Auth falhou: ${res.status} ${await res.text()}`)
  return res.json()
}

async function getMerchantInfo(token: string, merchantId: string) {
  const res = await fetch(`${IFOOD_API}/merchant/v2.0/merchants/${merchantId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Merchant não encontrado: ${res.status}`)
  return res.json()
}

async function registerWebhook(token: string, merchantId: string) {
  // Primeiro remove webhooks antigos
  await fetch(`${IFOOD_API}/webhook/v1.0/merchants/${merchantId}/webhooks`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})

  const res = await fetch(`${IFOOD_API}/webhook/v1.0/merchants/${merchantId}/webhooks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: ['PLACED', 'CANCELLED', 'CONSUMER_CANCELLATION_REQUESTED'],
      targetUrl: WEBHOOK_URL,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Webhook não registrado: ${res.status} ${txt}`)
  }
  return res.json().catch(() => ({ ok: true }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { client_id, client_secret, merchant_id, user_id, action } = await req.json()

    if (!client_id || !client_secret || !merchant_id || !user_id) {
      return Response.json({ erro: 'Campos obrigatórios: client_id, client_secret, merchant_id, user_id' }, { status: 400 })
    }

    // 1. Pega token
    const tokenData = await getToken(client_id, client_secret)
    const accessToken: string = tokenData.accessToken || tokenData.access_token
    const expiresAt = new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString()

    // 2. Valida merchant
    const merchantInfo = await getMerchantInfo(accessToken, merchant_id)

    // 3. Registra webhook se solicitado
    let webhookResult = null
    if (action === 'connect') {
      webhookResult = await registerWebhook(accessToken, merchant_id)
    }

    // 4. Salva no banco
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await sb.from('ifood_config').upsert({
      user_id,
      client_id,
      client_secret,
      merchant_id,
      ativo: action === 'connect',
      token_cache: { access_token: accessToken, expires_at: expiresAt },
    }, { onConflict: 'user_id' })

    return Response.json({
      ok: true,
      merchant_name: merchantInfo.name || merchantInfo.corporateName,
      webhook_registrado: !!webhookResult,
      webhook_url: WEBHOOK_URL,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return Response.json({ erro: e.message }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
})
