import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Award, ShoppingBag, TrendingDown, BarChart2, Wallet, Info, X, ChevronDown, ChevronUp, Clock, Trophy, Layers, UtensilsCrossed, Truck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import FiltroPeriodo from '../components/ui/FiltroPeriodo.jsx'
import { lucroPrato, margemPrato, custoPrato, custoEntrada, lucroEntrada, receitaEntrada, topVendidos as topV, precoPorBase, encontrarItemPedidoDaEntrada } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem, formatarData, hoje } from '../utils/formatacao.js'
import { fromBase, toBase } from '../utils/unidades.js'
import { Link } from 'react-router-dom'

const CORES_DARK  = ['#f04000', '#ff5a1f', '#ff7a47', '#ffa07a', '#ffc4a8']
const CORES_LIGHT = ['#f04000', '#d93800', '#b52e00', '#8f2500', '#6b1b00']

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="card py-2 px-3 text-xs">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{payload[0].payload.nome}</p>
        <p style={{ color: 'var(--accent)' }}>{payload[0].value} vendido{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    )
  }
  return null
}

function Tooltip2({ children, texto }) {
  const [vis, setVis] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVis(true)} onMouseLeave={() => setVis(false)}>
      {children}
      {vis && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#fff', fontSize: 11, padding: '5px 10px',
          borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>{texto}</span>
      )}
    </span>
  )
}

function ModalCaixaInicial({ data, valorAtual, onSalvar, onFechar }) {
  const [valor, setValor] = useState(valorAtual != null ? String(valorAtual) : '')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 360, padding: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={15} style={{ color: 'var(--accent)' }} /> Caixa Inicial</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>{data} · valor de abertura do caixa</p>
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={16} /></button>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Este valor representa o dinheiro que estava no caixa ao abrir — inclui troco e fundo de caixa. <strong>Não entra no faturamento.</strong>
        </p>
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Valor (R$)</label>
          <input className="input" type="number" min="0" step="0.01" placeholder="0,00"
            value={valor} onChange={e => setValor(e.target.value)} autoFocus />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSalvar(parseFloat(valor) || 0); onFechar() }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function Gauge({ valor, max = 100, corBoa, corMedia, corRuim, limBom, limMed }) {
  const pct = Math.min(100, Math.max(0, (valor / max) * 100))
  const cor = valor <= limBom ? corBoa : valor <= limMed ? corMedia : corRuim
  return (
    <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  )
}

function primeiroDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function primeiroDiaMesAnterior() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function ultimoDiaMesAnterior() {
  const d = new Date(); d.setDate(0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ResultadoGeral() {
  const { pratos, ingredientes, entradasVendas, despesas, pedidos } = useApp()
  const h = hoje()
  const [resInicio, setResInicio] = useState(primeiroDiaMes)
  const [resFim, setResFim] = useState(h)
  const [expandido, setExpandido] = useState(null)

  const entradas = useMemo(() =>
    entradasVendas.filter(e => e.data >= resInicio && e.data <= resFim),
    [entradasVendas, resInicio, resFim]
  )
  const despPeriodo = useMemo(() =>
    despesas.filter(d => d.data >= resInicio && d.data <= resFim),
    [despesas, resInicio, resFim]
  )
  const totalVendas = useMemo(() =>
    entradas.reduce((s, e) => {
      const p = pratos.find(x => x.id === e.pratoId)
      return p ? s + receitaEntrada(e, p) : s
    }, 0),
    [entradas, pratos]
  )
  const totalInsumos = useMemo(() =>
    entradas.reduce((s, e) => {
      const p = pratos.find(x => x.id === e.pratoId)
      return p ? s + custoEntrada(e, p, ingredientes, pedidos) : s
    }, 0),
    [entradas, pratos, ingredientes, pedidos]
  )
  const totalFuncionarios = useMemo(() =>
    despPeriodo.filter(d => d.categoria === 'funcionarios').reduce((s, d) => s + d.valor, 0),
    [despPeriodo]
  )
  const totalInvestimentos = useMemo(() =>
    despPeriodo.filter(d => d.categoria === 'investimentos').reduce((s, d) => s + d.valor, 0),
    [despPeriodo]
  )
  const totalOutros = useMemo(() =>
    despPeriodo.filter(d => d.categoria === 'outros').reduce((s, d) => s + d.valor, 0),
    [despPeriodo]
  )
  const lucroLiquido = totalVendas - totalInsumos - totalFuncionarios - totalInvestimentos - totalOutros

  const insumosPorIngrediente = useMemo(() => {
    const map = {}
    // Para extras com snapshot de preço, chave inclui o preço (agrupa por preço)
    // Para insumos da receita base (sem snapshot), agrupa só por ingrediente
    function adicionarUso(ingId, qtdDisplay, custo, custoUnitSnap) {
      if (!ingId || !(qtdDisplay > 0) || !(custo > 0)) return
      const key = custoUnitSnap !== undefined ? `${ingId}__${custoUnitSnap.toFixed(6)}` : ingId
      if (!map[key]) {
        const ing = ingredientes.find(i => i.id === ingId)
        if (!ing) return
        map[key] = { ingId, nome: ing.nome, unidade: ing.unidade, qtd: 0, custo: 0, custoUnitSnap: custoUnitSnap ?? null }
      }
      map[key].qtd += qtdDisplay
      map[key].custo += custo
    }
    for (const e of entradas) {
      const p = pratos.find(x => x.id === e.pratoId)
      if (!p) continue
      // Insumos da receita base
      if (p.ingredientes?.length) {
        for (const linha of p.ingredientes) {
          const ing = ingredientes.find(i => i.id === linha.ingredienteId)
          if (!ing) continue
          const qtdDisplay = fromBase(linha.quantidade * e.quantidade, ing.unidade)
          // Usa snapshot de custo salvo na entrada se disponível, senão usa preço atual
          const snapLine = e.ingredientesSnapshot?.find(s => s.ingredienteId === linha.ingredienteId)
          // precoUnitBase: custo por unidade base (g/ml/un) — usado para agrupar por preço
          const precoUnitBase = snapLine
            ? snapLine.custo / (linha.quantidade || 1)
            : precoPorBase(ing)
          const custo = precoUnitBase * linha.quantidade * e.quantidade
          // custoUnitSnap deve ser por unidade visível ao usuário (ex: por kg, por L)
          const custoUnitSnap = snapLine ? precoUnitBase * toBase(1, ing.unidade) : undefined
          adicionarUso(ing.id, qtdDisplay, custo, custoUnitSnap)
        }
      }
      // Insumos dos complementos/adicionais
      const pedidoItem = encontrarItemPedidoDaEntrada(e, pedidos)
      if (pedidoItem?.opcoes?.length) {
        for (const opcao of pedidoItem.opcoes) {
          if (!opcao.ingredienteId || !opcao.quantidadeUsada) continue
          const ing = ingredientes.find(i => i.id === opcao.ingredienteId)
          if (!ing) continue
          // Usa preço snapshot se disponível, senão usa preço atual
          const fator = ing.fatorCorrecao && ing.fatorCorrecao > 0 ? ing.fatorCorrecao : 1
          const custoUnitSnap = typeof opcao.custoUnitario === 'number' ? opcao.custoUnitario : (ing.preco || 0) * fator
          const qtdDisplay = opcao.quantidadeUsada * e.quantidade
          const custo = custoUnitSnap * qtdDisplay
          adicionarUso(ing.id, qtdDisplay, custo, custoUnitSnap)
        }
      }
    }
    const values = Object.values(map).map(item => ({
      ...item,
      custoUnit: item.custoUnitSnap !== null ? item.custoUnitSnap : (item.qtd > 0 ? item.custo / item.qtd : 0),
    })).sort((a, b) => b.custo - a.custo)
    // Marca ingredientes que aparecem em múltiplos preços para mostrar o preço no nome
    const ingCount = {}
    values.forEach(v => { ingCount[v.ingId] = (ingCount[v.ingId] || 0) + 1 })
    return values.map(v => ({ ...v, showPrice: ingCount[v.ingId] > 1 }))
  }, [entradas, pratos, ingredientes, pedidos])

  const vendasDetalhadas = useMemo(() =>
    [...entradas]
      .sort((a, b) => b.data.localeCompare(a.data) || (b.hora || '').localeCompare(a.hora || ''))
      .map(e => {
        const p = pratos.find(x => x.id === e.pratoId)
        return { ...e, nomePrato: p?.nome || 'Receita removida', receita: p ? receitaEntrada(e, p) : 0 }
      }),
    [entradas, pratos]
  )

  function toggle(key) { setExpandido(prev => prev === key ? null : key) }

  const rows = [
    { key: 'vendas',        label: 'Vendas (Faturamento)', valor: totalVendas,        red: false, sub: `${entradas.length} lançamento${entradas.length !== 1 ? 's' : ''} no período` },
    { key: 'insumos',       label: 'Insumos (CMV)',        valor: totalInsumos,       red: true,  sub: totalVendas > 0 ? `${((totalInsumos / totalVendas) * 100).toFixed(1)}% do faturamento` : '—' },
    { key: 'funcionarios',  label: 'Funcionários',         valor: totalFuncionarios,  red: true,  sub: `${despPeriodo.filter(d => d.categoria === 'funcionarios').length} registros` },
    { key: 'investimentos', label: 'Investimentos',        valor: totalInvestimentos, red: true,  sub: `${despPeriodo.filter(d => d.categoria === 'investimentos').length} registros` },
    { key: 'outros',        label: 'Outros',               valor: totalOutros,        red: true,  sub: `${despPeriodo.filter(d => d.categoria === 'outros').length} registros` },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resultado</h1>
          <p className="page-subtitle">DRE simplificado do período</p>
        </div>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>De</label>
            <input className="input" style={{ width: 140 }} type="date" value={resInicio} onChange={e => setResInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Até</label>
            <input className="input" style={{ width: 140 }} type="date" value={resFim} onChange={e => setResFim(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {[
              { label: 'Hoje',         fn: () => { const d = hoje(); setResInicio(d); setResFim(d) } },
              { label: 'Este mês',     fn: () => { setResInicio(primeiroDiaMes()); setResFim(hoje()) } },
              { label: 'Mês anterior', fn: () => { setResInicio(primeiroDiaMesAnterior()); setResFim(ultimoDiaMesAnterior()) } },
            ].map(s => (
              <button key={s.label} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={s.fn}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {rows.map(row => (
          <div key={row.key}>
            <div
              className="card cursor-pointer select-none"
              onClick={() => toggle(row.key)}
              style={{ padding: '14px 16px', transition: 'background .15s' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.sub}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: row.red ? '#ef4444' : '#22c55e' }}>
                  {row.red ? '− ' : ''}{formatarMoeda(row.valor)}
                </p>
                {expandido === row.key
                  ? <ChevronUp size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  : <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </div>
            </div>

            {expandido === row.key && (
              <div className="card p-0 overflow-hidden mt-1" style={{ borderStyle: 'dashed' }}>
                {row.key === 'vendas' && (
                  vendasDetalhadas.length === 0
                    ? <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma venda no período</p>
                    : <div className="table-wrapper"><table>
                        <thead><tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
                        <tbody>
                          {vendasDetalhadas.map(e => (
                            <tr key={e.id}>
                              <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatarData(e.data)}</td>
                              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{e.nomePrato}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{e.quantidade}</td>
                              <td style={{ color: '#22c55e', fontWeight: 600 }}>{formatarMoeda(e.receita)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr style={{ borderTop: '2px solid var(--border)' }}>
                          <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</td>
                          <td style={{ color: '#22c55e', fontWeight: 700 }}>{formatarMoeda(totalVendas)}</td>
                        </tr></tfoot>
                      </table></div>
                )}
                {row.key === 'insumos' && (
                  insumosPorIngrediente.length === 0
                    ? <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Nenhum insumo no período</p>
                    : <div className="table-wrapper"><table>
                        <thead><tr><th>Insumo</th><th>Qtd usada</th><th>Custo Unit.</th><th>Custo Total</th></tr></thead>
                        <tbody>
                          {insumosPorIngrediente.map((item, i) => (
                            <tr key={i}>
                              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {item.nome}
                                {item.showPrice && (
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>
                                    @ {formatarMoeda(item.custoUnit)}/{item.unidade}
                                  </span>
                                )}
                              </td>
                              <td style={{ color: 'var(--text-secondary)' }}>{item.qtd % 1 === 0 ? item.qtd : item.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {item.unidade}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{formatarMoeda(item.custoUnit)}/{item.unidade}</td>
                              <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatarMoeda(item.custo)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr style={{ borderTop: '2px solid var(--border)' }}>
                          <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</td>
                          <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(totalInsumos)}</td>
                        </tr></tfoot>
                      </table></div>
                )}
                {['funcionarios', 'investimentos', 'outros'].includes(row.key) && (() => {
                  const lista = despPeriodo.filter(d => d.categoria === row.key).sort((a, b) => b.data.localeCompare(a.data))
                  const total = lista.reduce((s, d) => s + d.valor, 0)
                  return lista.length === 0
                    ? <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Nenhum registro no período</p>
                    : <div className="table-wrapper"><table>
                        <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                        <tbody>
                          {lista.map(d => (
                            <tr key={d.id}>
                              <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatarData(d.data)}</td>
                              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{d.descricao}</td>
                              <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatarMoeda(d.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr style={{ borderTop: '2px solid var(--border)' }}>
                          <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</td>
                          <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(total)}</td>
                        </tr></tfoot>
                      </table></div>
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{
        border: `2px solid ${lucroLiquido >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        background: lucroLiquido >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Lucro Líquido</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vendas − Insumos − Funcionários − Investimentos − Outros</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: lucroLiquido >= 0 ? '#22c55e' : '#ef4444' }}>
            {lucroLiquido < 0 ? '− ' : ''}{formatarMoeda(Math.abs(lucroLiquido))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VisaoGeral() {
  const { pratos, ingredientes, registrosVendas, entradasVendas, pedidos, tema, registrarCaixaInicial, getCaixaInicial, getCaixaInicialPeriodo } = useApp()
  const h = hoje()
  const [periodo, setPeriodo] = useState({ dataInicio: h, dataFim: h })
  const [modalCaixa, setModalCaixa] = useState(false)
  const [aba, setAba] = useState('resumo')
  const [canalFiltro, setCanalFiltro] = useState('todos')

  const { dataInicio, dataFim } = periodo
  const CORES = tema === 'dark' ? CORES_DARK : CORES_LIGHT
  const semDados = pratos.length === 0
  const isPeriodoUnico = dataInicio === dataFim

  // ── Caixa inicial do período
  const caixaInicialValor = isPeriodoUnico
    ? (getCaixaInicial(dataInicio) ?? null)
    : getCaixaInicialPeriodo(dataInicio, dataFim)

  // ── Agrega dados do período (rankings, chart)
  let maisVendidoQtd = 0, maisVendido = null
  let maisLucrativoMargem = -Infinity, maisLucrativo = null
  let menosLucrativoMargem = Infinity, menosLucrativo = null
  const detalhesPorPrato = []

  if (!semDados) {
    for (const prato of pratos) {
      const qtd = canalFiltro === 'todos'
        ? registrosVendas
            .filter(r => r.pratoId === prato.id && r.data >= dataInicio && r.data <= dataFim)
            .reduce((s, r) => s + r.quantidade, 0)
        : entradasFiltradas
            .filter(e => e.pratoId === prato.id)
            .reduce((s, e) => s + e.quantidade, 0)
      const lucroUnit = lucroPrato(prato, ingredientes)
      const margemUnit = margemPrato(prato, ingredientes)
      const receitaPrato = qtd * prato.precoVenda
      const lucroPratoTotal = qtd * lucroUnit
      if (qtd > 0) detalhesPorPrato.push({ prato, qtd, receita: receitaPrato, lucro: lucroPratoTotal, margem: margemUnit })
      if (qtd > maisVendidoQtd) { maisVendidoQtd = qtd; maisVendido = prato }
      if (margemUnit > maisLucrativoMargem) { maisLucrativoMargem = margemUnit; maisLucrativo = prato }
      if (margemUnit < menosLucrativoMargem) { menosLucrativoMargem = margemUnit; menosLucrativo = prato }
    }
  }

  // ── Totais financeiros via entradasVendas (distingue pago vs pendente)
  const entradasPeriodo = entradasVendas.filter(e => e.data >= dataInicio && e.data <= dataFim)
  const entradasFiltradas = canalFiltro === 'todos' ? entradasPeriodo
    : canalFiltro === 'delivery' ? entradasPeriodo.filter(e => e.canal === 'delivery')
    : entradasPeriodo.filter(e => !e.canal || e.canal !== 'delivery')
  let receitaTotal = 0, lucroTotal = 0, receitaPendente = 0, lucroPendente = 0
  if (!semDados) {
    for (const entrada of entradasFiltradas) {
      const prato = pratos.find(p => p.id === entrada.pratoId)
      if (!prato) continue
      const r = receitaEntrada(entrada, prato)
      const l = lucroEntrada(entrada, prato, ingredientes, pedidos)
      receitaTotal += r
      lucroTotal += l
      const ped = pedidos.find(px =>
        px.data === entrada.data &&
        px.hora === entrada.hora &&
        px.itens?.some(i => i.pratoId === entrada.pratoId)
      )
      if (ped && !ped.pago && !ped.cancelado) {
        receitaPendente += r
        lucroPendente += l
      }
    }
  }

  const receitaPaga = receitaTotal - receitaPendente
  const lucroPago = lucroTotal - lucroPendente
  const custoTotal = receitaPaga - lucroPago
  const margemDia = receitaPaga > 0 ? (lucroPago / receitaPaga) * 100 : 0
  const cmvDia = receitaPaga > 0 ? (custoTotal / receitaPaga) * 100 : 0
  const totalEmCaixa = receitaPaga + (caixaInicialValor || 0)

  const top5 = semDados ? [] : canalFiltro === 'todos'
    ? topV(pratos, registrosVendas, dataInicio, dataFim, 5)
    : pratos.map(p => ({
        prato: p,
        quantidade: entradasFiltradas.filter(e => e.pratoId === p.id).reduce((s, e) => s + e.quantidade, 0),
      })).filter(t => t.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)
  const semVendas = receitaTotal === 0
  const chartData = top5.filter(t => t.quantidade > 0).map(t => ({
    nome: t.prato.nome.length > 14 ? t.prato.nome.slice(0, 14) + '…' : t.prato.nome,
    quantidade: t.quantidade,
  }))

  detalhesPorPrato.sort((a, b) => b.receita - a.receita)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex gap-1 mb-4 flex-wrap">
        {[
          { id: 'resumo', label: 'Resumo' },
          { id: 'resultado', label: 'Resultado' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            style={{
              padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: aba === tab.id ? 'var(--accent)' : 'var(--bg-hover)',
              color: aba === tab.id ? '#fff' : 'var(--text-secondary)',
              transition: 'all .15s',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {aba === 'resumo' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Relatório</h1>
              <p className="page-subtitle">Resumo financeiro do período</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn-secondary"
                onClick={() => setModalCaixa(true)}
                style={{ gap: 6 }}
              >
                <Wallet size={14} />
                {caixaInicialValor != null && caixaInicialValor > 0
                  ? `Caixa: ${formatarMoeda(caixaInicialValor)}`
                  : 'Caixa Inicial'}
              </button>

              {/* Filtro de canal */}
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                {[
                  { id: 'todos',       label: 'Todos',       Icon: Layers },
                  { id: 'restaurante', label: 'Restaurante', Icon: UtensilsCrossed },
                  { id: 'delivery',    label: 'Delivery',    Icon: Truck },
                ].map((op, i, arr) => (
                  <button
                    key={op.id}
                    onClick={() => setCanalFiltro(op.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      border: 'none', cursor: 'pointer', transition: 'all .15s',
                      background: canalFiltro === op.id ? 'var(--accent)' : 'var(--bg-hover)',
                      color: canalFiltro === op.id ? '#fff' : 'var(--text-secondary)',
                      borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <op.Icon size={12} />
                    {op.label}
                  </button>
                ))}
              </div>

              <FiltroPeriodo onChange={setPeriodo} />
            </div>
          </div>

          {semDados && (
            <div className="card flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
                <BarChart2 size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Bem-vindo ao Cheffya!</h2>
                <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cadastre seus insumos e crie as fichas de receitas para começar a acompanhar o CMV e a lucratividade.
                </p>
              </div>
              <div className="flex gap-3">
                <Link to="/mercadorias" className="btn btn-secondary">Cadastrar insumos</Link>
                <Link to="/receitas" className="btn btn-primary">Criar receitas</Link>
              </div>
            </div>
          )}

          {!semDados && (
            <>
          {/* ── Caixa inicial banner ── */}
          {caixaInicialValor != null && caixaInicialValor > 0 && (
            <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Wallet size={15} style={{ color: '#d97706', flexShrink: 0 }} />
              <div className="flex-1">
                <span className="text-sm font-semibold" style={{ color: '#d97706' }}>Caixa inicial: {formatarMoeda(caixaInicialValor)}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>— troco/fundo, não conta como faturamento</span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                Total em caixa: <span style={{ color: 'var(--text-primary)' }}>{formatarMoeda(totalEmCaixa)}</span>
              </span>
            </div>
          )}

          {/* ── KPIs principais ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {/* Faturamento */}
            <div className="card col-span-2 lg:col-span-1" style={{ border: '1.5px solid var(--border-active)', background: 'var(--accent-bg)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div style={{ padding: 7, borderRadius: 10, background: 'var(--accent)' }}><DollarSign size={15} color="#fff" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Faturamento</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Apenas vendas pagas</p>
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>{formatarMoeda(receitaPaga)}</p>
              {receitaPaga > 0 && (
                <div className="text-xs flex flex-col gap-0.5 mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>— Custo dos pratos: <strong style={{ color: '#ef4444' }}>{formatarMoeda(custoTotal)}</strong></span>
                  <span>— Lucro bruto: <strong style={{ color: 'var(--accent)' }}>{formatarMoeda(lucroPago)}</strong></span>
                </div>
              )}
            </div>

            {/* CMV */}
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>CMV</p>
                <Tooltip2 texto="Custo da Mercadoria Vendida — quanto dos seus produtos custou para fazer o que vendeu">
                  <Info size={12} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                </Tooltip2>
              </div>
              <p className="text-xl font-bold" style={{ color: cmvDia <= 35 ? 'var(--accent)' : cmvDia <= 45 ? '#f59e0b' : '#ef4444' }}>
                {semVendas ? '—' : formatarPorcentagem(cmvDia)}
              </p>
              <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                {!semVendas && <span className="status-dot" style={{ background: cmvDia <= 35 ? 'var(--accent)' : cmvDia <= 45 ? '#f59e0b' : '#ef4444' }} />}
                {semVendas ? 'Sem vendas' : cmvDia <= 35 ? 'Ótimo (ideal ≤ 35%)' : cmvDia <= 45 ? 'Atenção (35–45%)' : 'Alto demais (> 45%)'}
              </p>
              {!semVendas && <Gauge valor={cmvDia} max={70} corBoa="var(--accent)" corMedia="#f59e0b" corRuim="#ef4444" limBom={35} limMed={45} />}
            </div>

            {/* Margem */}
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Margem Bruta</p>
                <Tooltip2 texto="Percentual do faturamento que virou lucro após deduzir o custo dos ingredientes">
                  <Info size={12} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                </Tooltip2>
              </div>
              <p className="text-xl font-bold" style={{ color: margemDia >= 55 ? 'var(--accent)' : margemDia >= 30 ? '#f59e0b' : '#ef4444' }}>
                {semVendas ? '—' : formatarPorcentagem(margemDia)}
              </p>
              <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                {!semVendas && <span className="status-dot" style={{ background: margemDia >= 55 ? 'var(--accent)' : margemDia >= 30 ? '#f59e0b' : '#ef4444' }} />}
                {semVendas ? 'Sem vendas' : margemDia >= 55 ? 'Excelente (≥ 55%)' : margemDia >= 30 ? 'Razoável (30–55%)' : 'Baixa (< 30%)'}
              </p>
              {!semVendas && <Gauge valor={margemDia} max={90} corBoa="var(--accent)" corMedia="#f59e0b" corRuim="#ef4444" limBom={55} limMed={30} />}
            </div>

            {/* Lucro */}
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Lucro Bruto</p>
              <p className="text-xl font-bold" style={{ color: lucroPago > 0 ? '#3b82f6' : '#ef4444' }}>
                {formatarMoeda(lucroPago)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {semVendas ? 'Sem vendas' : `Sobre ${formatarMoeda(receitaPaga)} faturado`}
              </p>
            </div>

            {/* Aguardando Pagamento */}
            <div className="card" style={{ border: receitaPendente > 0 ? '1.5px solid rgba(249,115,22,0.4)' : '1px solid var(--border)', background: receitaPendente > 0 ? 'rgba(249,115,22,0.05)' : undefined }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: receitaPendente > 0 ? '#f97316' : 'var(--text-muted)' }}><Clock size={11} />Ag. Pagamento</p>
              <p className="text-xl font-bold" style={{ color: receitaPendente > 0 ? '#f97316' : 'var(--text-muted)' }}>
                {formatarMoeda(receitaPendente)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {receitaPendente === 0 ? 'Nenhum pendente' : `Lucro pend.: ${formatarMoeda(lucroPendente)}`}
              </p>
            </div>
          </div>

          {/* ── Destaques ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {maisVendido
              ? <MetricCard titulo="Mais Vendido" valor={maisVendido.nome} subtitulo={`${maisVendidoQtd} unidade${maisVendidoQtd !== 1 ? 's' : ''} no período`} icone={ShoppingBag} cor="blue" />
              : <MetricCard titulo="Mais Vendido" valor="—" subtitulo="Nenhuma venda registrada" icone={ShoppingBag} cor="blue" />
            }
            {maisLucrativo
              ? <MetricCard titulo="Maior Margem" valor={maisLucrativo.nome} subtitulo={`${formatarPorcentagem(maisLucrativoMargem)} de margem bruta`} icone={Award} cor="green" />
              : <MetricCard titulo="Maior Margem" valor="—" subtitulo="Nenhuma receita" icone={Award} cor="green" />
            }
            {menosLucrativo && menosLucrativo?.id !== maisLucrativo?.id
              ? <MetricCard titulo="Menor Margem" valor={menosLucrativo.nome} subtitulo={`${formatarPorcentagem(menosLucrativoMargem)} · revisar precificação`} icone={TrendingDown} cor="red" />
              : <MetricCard titulo="Menor Margem" valor="—" subtitulo="Apenas 1 receita cadastrada" icone={TrendingDown} cor="red" />
            }
          </div>

          {/* ── Gráfico + Ranking ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-title mb-1">
                <span className="card-title-icon"><Trophy size={14} /></span>
                Top 5 Mais Vendidos
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', paddingLeft: 36 }}>Receitas com mais unidades vendidas no período</p>
              {semVendas ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma venda no período.</p>
                  <Link to="/pdv" className="btn btn-secondary mt-3 text-xs py-1.5 px-3">Registrar venda</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {top5.filter(t => t.quantidade > 0).map((t, idx) => (
                    <div key={t.prato.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: idx === 0 ? 'var(--accent-bg)' : 'var(--bg-hover)', border: idx === 0 ? '1px solid var(--border-active)' : '1px solid transparent' }}>
                      <span className="rank-badge" style={{
                        background: idx === 0 ? 'var(--accent)' : idx === 1 ? 'rgba(240,64,0,0.35)' : idx === 2 ? 'rgba(240,64,0,0.2)' : 'var(--border)',
                        color: idx <= 2 ? '#fff' : 'var(--text-muted)',
                      }}>{idx + 1}</span>
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.prato.nome}</span>
                      <span className="font-bold text-sm" style={{ color: idx === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{t.quantidade}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>un</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title mb-1">
                <span className="card-title-icon"><BarChart2 size={14} /></span>
                Vendas por Receita
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', paddingLeft: 36 }}>Distribuição de unidades vendidas</p>
              {semVendas ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sem dados para exibir.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                    <XAxis dataKey="nome" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar dataKey="quantidade" radius={[5, 5, 0, 0]}>
                      {chartData.map((_, idx) => <Cell key={idx} fill={CORES[idx % CORES.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Detalhamento por prato ── */}
          {detalhesPorPrato.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="card-title-icon" style={{ width: 26, height: 26, borderRadius: 7 }}><TrendingUp size={13} /></span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Detalhamento por Receita</h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— por faturamento</span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Receita</th>
                      <th>Qtd vendida</th>
                      <th>
                        <span className="flex items-center gap-1">
                          Faturamento
                          <Tooltip2 texto="Receita × preço de venda">
                            <Info size={10} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                          </Tooltip2>
                        </span>
                      </th>
                      <th>
                        <span className="flex items-center gap-1">
                          Custo
                          <Tooltip2 texto="Custo dos ingredientes de todas as unidades vendidas">
                            <Info size={10} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                          </Tooltip2>
                        </span>
                      </th>
                      <th>
                        <span className="flex items-center gap-1">
                          Lucro
                          <Tooltip2 texto="Faturamento − Custo">
                            <Info size={10} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                          </Tooltip2>
                        </span>
                      </th>
                      <th>
                        <span className="flex items-center gap-1">
                          Margem
                          <Tooltip2 texto="Percentual de lucro sobre o preço de venda">
                            <Info size={10} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                          </Tooltip2>
                        </span>
                      </th>
                      <th>% do fat.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalhesPorPrato.map(({ prato, qtd, receita, lucro, margem }) => {
                      const custo = receita - lucro
                      const pctFat = receitaTotal > 0 ? (receita / receitaTotal) * 100 : 0
                      return (
                        <tr key={prato.id}>
                          <td className="font-medium">{prato.nome}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{qtd} un</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(receita)}</td>
                          <td style={{ color: '#ef4444' }}>{formatarMoeda(custo)}</td>
                          <td style={{ color: lucro >= 0 ? '#3b82f6' : '#ef4444', fontWeight: 600 }}>{formatarMoeda(lucro)}</td>
                          <td>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: margem >= 55 ? 'var(--accent-bg)' : margem >= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: margem >= 55 ? 'var(--accent)' : margem >= 30 ? '#d97706' : '#ef4444' }}>
                              {formatarPorcentagem(margem)}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, minWidth: 40 }}>
                                <div style={{ width: `${pctFat}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-muted)', minWidth: 30 }}>{pctFat.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {detalhesPorPrato.reduce((s, d) => s + d.qtd, 0)} un
                      </td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatarMoeda(receitaTotal)}</td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatarMoeda(custoTotal)}</td>
                      <td style={{ color: '#3b82f6', fontWeight: 700 }}>{formatarMoeda(lucroTotal)}</td>
                      <td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: margemDia >= 55 ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', color: margemDia >= 55 ? 'var(--accent)' : '#d97706' }}>
                          {formatarPorcentagem(margemDia)}
                        </span>
                      </td>
                      <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>100%</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}

      {aba === 'resultado' && <ResultadoGeral />}

      {modalCaixa && (
        <ModalCaixaInicial
          data={dataInicio}
          valorAtual={getCaixaInicial(dataInicio)}
          onSalvar={valor => registrarCaixaInicial(dataInicio, valor)}
          onFechar={() => setModalCaixa(false)}
        />
      )}
    </div>
  )
}
