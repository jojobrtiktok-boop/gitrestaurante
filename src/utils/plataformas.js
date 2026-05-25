// ── Plataformas de delivery ───────────────────────────────────────────────────
// Centraliza cores, labels e helpers usados em Kanban, CaixaDisplay, CozinhaDisplay, etc.

export const PLATAFORMAS = {
  ifood:   { label: 'iFood',   cor: '#ea1d2c', bg: 'rgba(234,29,44,0.12)',  borda: 'rgba(234,29,44,0.35)'  },
  ifood2:  { label: 'iFood 2', cor: '#c41525', bg: 'rgba(196,21,37,0.12)',  borda: 'rgba(196,21,37,0.35)'  },
  '99food':{ label: '99food',  cor: '#b8860b', bg: 'rgba(255,205,0,0.28)',  borda: 'rgba(200,160,0,0.6)'   },
  keeta:   { label: 'Keeta',   cor: '#6c3fc5', bg: 'rgba(108,63,197,0.12)', borda: 'rgba(108,63,197,0.35)' },
  delivery:{ label: 'Delivery',cor: '#f04000', bg: 'rgba(240,64,0,0.12)',   borda: 'rgba(240,64,0,0.35)'   },
}

/** Retorna true para qualquer canal de delivery (manual ou plataforma) */
export function isDelivery(canal) {
  return ['delivery', 'ifood', 'ifood2', '99food', 'keeta'].includes(canal)
}

/** Retorna o objeto PLATAFORMAS para o canal, com fallback para 'delivery' */
export function getPlataf(canal) {
  return PLATAFORMAS[canal] || PLATAFORMAS.delivery
}
