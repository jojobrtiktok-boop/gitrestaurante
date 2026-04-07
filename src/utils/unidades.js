export const UNIDADES = ['kg', 'g', 'L', 'ml', 'un']

export const UNIDADE_LABELS = {
  kg: 'Quilograma (kg)',
  g: 'Grama (g)',
  L: 'Litro (L)',
  ml: 'Mililitro (ml)',
  un: 'Unidade (un)',
}

/** Convert user-visible quantity to base unit (g, ml, or un) */
export function toBase(quantidade, unidade) {
  if (unidade === 'kg') return quantidade * 1000
  if (unidade === 'L') return quantidade * 1000
  return quantidade // g, ml, un already base
}

/** Convert base unit back to user-visible quantity */
export function fromBase(quantidadeBase, unidade) {
  if (unidade === 'kg') return quantidadeBase / 1000
  if (unidade === 'L') return quantidadeBase / 1000
  return quantidadeBase
}

/** Format quantity for display: "200 g", "1,5 kg", "300 ml", "2 un" */
export function formatarQuantidade(quantidadeBase, unidade) {
  const display = fromBase(quantidadeBase, unidade)
  const formatted = display % 1 === 0
    ? display.toString()
    : display.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
  return `${formatted} ${unidade}`
}

/** Get the base unit label for an ingredient's unit */
export function getBaseUnidade(unidade) {
  if (unidade === 'kg') return 'g'
  if (unidade === 'L') return 'ml'
  return unidade
}
