// ifood-action: confirmar, cancelar, despachar pedidos no iFood
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IFOOD_API = 'https://merchant-api.ifood.com.br'

async function getValidToken(sb: ReturnType<typeof createClient>, userId: string) {
  const { data: cfg } = await sb.from('ifood_config').select('*').eq('user_id', userId).maybeSingle()
  if (!cfg) throw new Error('Configuração iFood não encontrada')

  if (cfg.token_cache?.access_token && cfg.token_cache?.expires_at) {
    if (Date.now() < new Date(cfg.token_cache.expires_at).getTime() - 60000) {
      return cfg.token_cache.access_token
    }
  }

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

const ACTION_MAP: Record<string, string> = {
  confirm:  'confirm',
  cancel:   'cancel',
  dispatch: 'dispatch',
  deliver:  'delivered',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { ifood_order_id, action, user_id, cancel_reason } = await req.json()

    if (!ifood_order_id || !action || !user_id) {
      return Response.json({ erro: 'Campos obrigatórios: ifood_order_id, action, user_id' }, { status: 400 })
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = await getValidToken(sb, user_id)
    const endpoint = ACTION_MAP[action]
    if (!endpoint) return Response.json({ erro: `Ação inválida: ${action}` }, { status: 400 })

    const body = action === 'cancel' && cancel_reason
      ? JSON.stringify({ cancellationCode: cancel_reason || '501', description: 'Cancelado pelo restaurante' })
      : null

    const res = await fetch(`${IFOOD_API}/order/v1.0/orders/${ifood_order_id}/statuses/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body } : {}),
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`iFood API erro: ${res.status} ${txt}`)
    }

    return Response.json({ ok: true }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return Response.json({ erro: e.message }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
})
