import { toBase } from './unidades.js'

/**
 * Custo real de um insumo por unidade base, já considerando o fator de correção.
 * fatorCorrecao > 1 significa perda no preparo (ex: 1.2 = compra 1.2kg pra ter 1kg limpo).
 */
export function precoPorBase(ing) {
  const fator = ing.fatorCorrecao && ing.fatorCorrecao > 0 ? ing.fatorCorrecao : 1
  return (ing.preco * fator) / toBase(1, ing.unidade)
}

/**
 * Custo de produção de uma receita (prato).
 */
export function custoPrato(prato, ingredientes) {
  if (!prato.ingredientes?.length) return 0
  return prato.ingredientes.reduce((acc, linha) => {
    const ing = ingredientes.find(i => i.id === linha.ingredienteId)
    if (!ing) return acc
    return acc + precoPorBase(ing) * linha.quantidade
  }, 0)
}

export function custoOpcoes(opcoes, ingredientes) {
  if (!opcoes?.length) return 0
  return opcoes.reduce((acc, opcao) => {
    if (!opcao.ingredienteId || !opcao.quantidadeUsada) return acc
    const ing = ingredientes.find(i => i.id === opcao.ingredienteId)
    if (!ing) return acc
    const fator = ing.fatorCorrecao && ing.fatorCorrecao > 0 ? ing.fatorCorrecao : 1
    return acc + (ing.preco || 0) * fator * opcao.quantidadeUsada
  }, 0)
}

function precoExtrasOpcoes(opcoes) {
  if (!opcoes?.length) return 0
  return opcoes.reduce((acc, opcao) => acc + (opcao.precoExtra || 0), 0)
}

export function encontrarItemPedidoDaEntrada(entrada, pedidos = []) {
  const pedido = pedidos.find(p =>
    p.data === entrada.data &&
    p.hora === entrada.hora &&
    p.itens?.some(item => item.pratoId === entrada.pratoId)
  )
  if (!pedido) return null

  const extrasUnit = Number(entrada.extrasUnit || 0)
  const candidatos = pedido.itens?.filter(item => item.pratoId === entrada.pratoId) || []

  return candidatos.find(item =>
    item.quantidade === entrada.quantidade &&
    Math.abs(precoExtrasOpcoes(item.opcoes) - extrasUnit) < 0.0001
  ) || candidatos.find(item =>
    Math.abs(precoExtrasOpcoes(item.opcoes) - extrasUnit) < 0.0001
  ) || null
}

export function custoExtraUnitEntrada(entrada, pedidos = [], ingredientes = []) {
  if (typeof entrada.extrasCustoUnit === 'number' && !Number.isNaN(entrada.extrasCustoUnit)) {
    return entrada.extrasCustoUnit
  }
  const item = encontrarItemPedidoDaEntrada(entrada, pedidos)
  if (!item) return 0
  return custoOpcoes(item.opcoes || [], ingredientes)
}

export function receitaEntrada(entrada, prato) {
  const precoBase = (entrada.precoVendaUnit !== null && entrada.precoVendaUnit !== undefined)
    ? Number(entrada.precoVendaUnit)
    : prato.precoVenda
  return (precoBase + (entrada.extrasUnit || 0)) * entrada.quantidade
}

export function custoEntrada(entrada, prato, ingredientes, pedidos = []) {
  let baseCost
  if (entrada.custoPratoUnit !== null && entrada.custoPratoUnit !== undefined) {
    baseCost = Number(entrada.custoPratoUnit)
  } else {
    baseCost = custoPrato(prato, ingredientes)
  }
  return (baseCost + custoExtraUnitEntrada(entrada, pedidos, ingredientes)) * entrada.quantidade
}

export function lucroEntrada(entrada, prato, ingredientes, pedidos = []) {
  return receitaEntrada(entrada, prato) - custoEntrada(entrada, prato, ingredientes, pedidos)
}

export function lucroPrato(prato, ingredientes) {
  return prato.precoVenda - custoPrato(prato, ingredientes)
}

export function margemPrato(prato, ingredientes) {
  if (!prato.precoVenda || prato.precoVenda === 0) return 0
  return (lucroPrato(prato, ingredientes) / prato.precoVenda) * 100
}

/** CMV% = custo / precoVenda × 100 */
export function cmvPrato(prato, ingredientes) {
  if (!prato.precoVenda || prato.precoVenda === 0) return 0
  return (custoPrato(prato, ingredientes) / prato.precoVenda) * 100
}

/** Preço sugerido dado um CMV% desejado. Ex: cmvDesejado=35 → custo/0.35 */
export function precoSugeridoCMV(custo, cmvDesejado) {
  if (!cmvDesejado || cmvDesejado <= 0 || cmvDesejado >= 100) return 0
  return custo / (cmvDesejado / 100)
}

/** Preço sugerido dado uma margem de lucro desejada. Ex: margem=65 → custo/(1-0.65) */
export function precoSugeridoMargem(custo, margemDesejada) {
  if (!margemDesejada || margemDesejada <= 0 || margemDesejada >= 100) return 0
  return custo / (1 - margemDesejada / 100)
}

export function totalVendidoPeriodo(pratoId, dataInicio, dataFim, registros) {
  return registros
    .filter(r => r.pratoId === pratoId && r.data >= dataInicio && r.data <= dataFim)
    .reduce((acc, r) => acc + r.quantidade, 0)
}

export function totalVendidoDia(pratoId, data, registros) {
  return totalVendidoPeriodo(pratoId, data, data, registros)
}

export function resumoDia(data, pratos, ingredientes, registros) {
  let receitaTotal = 0, lucroTotal = 0
  let maisVendidoQtd = 0, maisVendido = null
  let maisLucrativoMargem = -Infinity, maisLucrativo = null
  let menosLucrativoMargem = Infinity, menosLucrativo = null

  for (const prato of pratos) {
    const qtd = totalVendidoDia(prato.id, data, registros)
    const lucro = lucroPrato(prato, ingredientes)
    const margem = margemPrato(prato, ingredientes)
    receitaTotal += qtd * prato.precoVenda
    lucroTotal += qtd * lucro
    if (qtd > maisVendidoQtd) { maisVendidoQtd = qtd; maisVendido = prato }
    if (margem > maisLucrativoMargem) { maisLucrativoMargem = margem; maisLucrativo = prato }
    if (margem < menosLucrativoMargem) { menosLucrativoMargem = margem; menosLucrativo = prato }
  }

  const margemDia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0
  const cmvDia = receitaTotal > 0 ? ((receitaTotal - lucroTotal) / receitaTotal) * 100 : 0

  return { lucroTotal, receitaTotal, margemDia, cmvDia, maisVendido, maisVendidoQtd, maisLucrativo, maisLucrativoMargem, menosLucrativo, menosLucrativoMargem }
}

export function topVendidos(pratos, registros, dataInicio, dataFim, limit = 5) {
  return pratos
    .map(p => ({ prato: p, quantidade: totalVendidoPeriodo(p.id, dataInicio, dataFim, registros) }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limit)
}

export function rankingVendidos(pratos, ingredientes, registros, dataInicio, dataFim) {
  return pratos
    .map(p => {
      const quantidade = totalVendidoPeriodo(p.id, dataInicio, dataFim, registros)
      const custo = custoPrato(p, ingredientes)
      const lucro = lucroPrato(p, ingredientes)
      return {
        prato: p,
        quantidade,
        receita: quantidade * p.precoVenda,
        lucroTotal: quantidade * lucro,
        custoTotal: quantidade * custo,
        margemPrato: margemPrato(p, ingredientes),
        cmv: cmvPrato(p, ingredientes),
      }
    })
    .sort((a, b) => b.quantidade - a.quantidade)
}

export function rankingLucrativos(pratos, ingredientes, registros, dataInicio, dataFim) {
  return pratos
    .map(p => {
      const quantidade = totalVendidoPeriodo(p.id, dataInicio, dataFim, registros)
      const custo = custoPrato(p, ingredientes)
      const lucro = lucroPrato(p, ingredientes)
      const margem = margemPrato(p, ingredientes)
      return {
        prato: p,
        quantidade,
        receita: quantidade * p.precoVenda,
        lucroTotal: quantidade * lucro,
        custoTotal: quantidade * custo,
        margemPrato: margem,
        lucroPorUnidade: lucro,
        cmv: cmvPrato(p, ingredientes),
      }
    })
    .sort((a, b) => b.margemPrato - a.margemPrato)
}
