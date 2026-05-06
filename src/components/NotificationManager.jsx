import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { hoje } from '../utils/formatacao.js'

// Fires Web Notifications based on app events.
// Returns null — no visual output.
export default function NotificationManager() {
  const {
    notifConfig, pedidos, ingredientes, configuracaoGeral, cardapioConfig, auth
  } = useApp()

  const prevPedidosRef  = useRef(null) // null = primeira carga, não dispara notif
  const lastDemoraRef   = useRef(0)
  const lastInsumosRef  = useRef(0)

  function dispararNotif(titulo, corpo, urgente = false) {
    if (!notifConfig.pushAtivo) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
      const icon = cardapioConfig?.logo || undefined
      const appNome = cardapioConfig?.nomeRestaurante || 'RestauranteApp'
      new Notification(`${appNome} — ${titulo}`, {
        body: corpo,
        icon,
        badge: icon,
        requireInteraction: !!urgente,
      })
    } catch { /* ignore */ }
  }

  /* pedido pago → notif venda */
  useEffect(() => {
    if (!notifConfig.pushAtivo || !notifConfig.notifVendas) {
      prevPedidosRef.current = pedidos
      return
    }
    const prev = prevPedidosRef.current
    // Primeira carga (login): só grava o estado atual, sem disparar notificações
    if (prev === null) {
      prevPedidosRef.current = pedidos
      return
    }
    const novosPagos = pedidos.filter(
      p => p.pago && !prev.find(pp => pp.id === p.id && pp.pago)
    )
    for (const p of novosPagos) {
      dispararNotif(
        '💰 Venda realizada!',
        `Pedido #${p.id.slice(-4).toUpperCase()} foi pago com sucesso.`
      )
    }
    prevPedidosRef.current = pedidos
  }, [pedidos]) // eslint-disable-line react-hooks/exhaustive-deps

  /* intervalo: insumos + demora */
  useEffect(() => {
    if (!notifConfig.pushAtivo || !auth.usuario) return

    const id = setInterval(() => {
      const now = Date.now()

      /* insumos: no máximo uma vez a cada 10 min */
      if (notifConfig.notifInsumos && now - lastInsumosRef.current > 10 * 60_000) {
        const minPadrao = configuracaoGeral.estoqueMinimoPadrao || 0
        const abaixo = ingredientes.filter(ing => {
          const min = ing.estoqueMinimo != null ? ing.estoqueMinimo : minPadrao
          return min > 0 && (ing.quantidadeEstoque || 0) <= min
        })
        if (abaixo.length > 0) {
          for (const ing of abaixo.slice(0, 2)) {
            dispararNotif(
              `⚠️ ${ing.nome} está acabando!`,
              `Somente ${ing.quantidadeEstoque || 0} ${ing.unidade || 'un'} restantes. Compre agora!`
            )
          }
          lastInsumosRef.current = now
        }
      }

      /* demora: no máximo uma vez a cada 5 min */
      if (notifConfig.notifDemora && now - lastDemoraRef.current > 5 * 60_000) {
        const limite = (notifConfig.demoraMinutos || 20) * 60_000
        const h = hoje()
        const atrasados = pedidos.filter(
          p =>
            p.data === h && !p.pago && !p.cancelado &&
            (p.status === 'novo' || p.status === 'preparando') &&
            p.timestamps?.novo &&
            now - new Date(p.timestamps.novo).getTime() > limite
        )
        if (atrasados.length > 0) {
          dispararNotif(
            '⏰ Cozinha com demora!',
            `${atrasados.length} pedido(s) aguardando há mais de ${notifConfig.demoraMinutos || 20} min.`,
            true
          )
          lastDemoraRef.current = now
        }
      }
    }, 60_000)

    return () => clearInterval(id)
  }, [notifConfig, auth.usuario, pedidos, ingredientes, configuracaoGeral]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
