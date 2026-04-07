const BRASILIA_TIMEZONE = 'America/Sao_Paulo'

function partesBrasilia(valor = new Date()) {
  const data = valor instanceof Date ? valor : new Date(valor)
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRASILIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)

  return Object.fromEntries(
    partes
      .filter(parte => parte.type !== 'literal')
      .map(parte => [parte.type, parte.value])
  )
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

export function formatarPorcentagem(valor, casas = 1) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0%'
  return `${Number(valor).toFixed(casas).replace('.', ',')}%`
}

export function formatarNumero(valor, casas = 2) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

export function hoje() {
  const { year, month, day } = partesBrasilia()
  return `${year}-${month}-${day}`
}

export function horaAtual() {
  const { hour, minute } = partesBrasilia()
  return `${hour}:${minute}`
}

export function agoraBrasiliaISO() {
  const { year, month, day, hour, minute, second } = partesBrasilia()
  return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`
}

export function formatarData(dataStr) {
  if (!dataStr) return ''
  const [y, m, d] = dataStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatarHora(valor) {
  if (!valor) return ''
  if (/^\d{2}:\d{2}/.test(valor)) return valor.slice(0, 5)
  const { hour, minute } = partesBrasilia(valor)
  return `${hour}:${minute}`
}
