import { useState } from 'react'
import { ShoppingCart, Trash2, Clock, X, Check, Printer, FileText, Truck, MapPin, User, Timer, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import TabelaVazia from '../components/ui/TabelaVazia.jsx'
import FiltroPeriodo from '../components/ui/FiltroPeriodo.jsx'
import { formatarMoeda, hoje, formatarHora } from '../utils/formatacao.js'
import { lucroEntrada, receitaEntrada } from '../utils/calculos.js'

function formatarTempo(minutos) {
  if (minutos < 1) return '< 1min'
  if (minutos < 60) return `${minutos}min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}

function mins(a, b) {
  if (!a || !b) return null
  return Math.floor((new Date(b) - new Date(a)) / 60000)
}

function ModalPedido({ entrada, pedido, prato, garcon, onFechar }) {
  const ts = pedido?.timestamps || {}

  const etapas = [
    { id: 'novo',       label: '🆕 Recebido',   cor: '#3b82f6', iso: ts.novo },
    { id: 'preparando', label: '👨‍🍳 Em preparo',  cor: '#f59e0b', iso: ts.preparando },
    { id: 'completo',   label: '✅ Entregue',    cor: '#16a34a', iso: ts.completo },
  ]

  const tempoNovo        = mins(ts.novo, ts.preparando)
  const tempoPreparo     = mins(ts.preparando, ts.completo)
  const tempoTotal       = mins(ts.novo, ts.completo)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Detalhes do lançamento</h2>
          <button className="btn btn-ghost p-1" onClick={onFechar}><X size={15} /></button>
        </div>

        {/* Info básica */}
        <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
          <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{prato?.nome}</p>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{entrada.hora}</span>
            <span>×{entrada.quantidade} unid.</span>
            <span style={{ color: garcon ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
              {garcon ? garcon.nome : 'Balcão'}
            </span>
          </div>
        </div>

        {/* Timeline do Kanban */}
        {pedido ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Tempo no Kanban</p>
            <div className="flex flex-col gap-2">
              {etapas.map((etapa, idx) => {
                const feito = !!etapa.iso
                const hora = etapa.iso ? formatarHora(etapa.iso) : null
                const duracao = idx === 0 ? tempoNovo : idx === 1 ? tempoPreparo : null
                return (
                  <div key={etapa.id} className="flex items-center gap-3">
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: feito ? etapa.cor : 'var(--bg-hover)',
                      border: `2px solid ${feito ? etapa.cor : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {feito && <Check size={13} color="#fff" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: feito ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {etapa.label}
                      </p>
                      {hora && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hora}</p>}
                    </div>
                    {duracao !== null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: etapa.cor }}>
                        {formatarTempo(duracao)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {tempoTotal !== null && (
              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Tempo total</span>
                <span className="text-sm font-bold" style={{ color: '#16a34a' }}>{formatarTempo(tempoTotal)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Este lançamento foi feito direto pelo Balcão — sem pedido no Kanban.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Relatório de Tempo ────────────────────────────────────────────────────────
function RelatorioTempo({ pedidos, pratos, dataInicio, dataFim }) {
  const [canal, setCanal] = useState('restaurante') // 'restaurante' | 'delivery'
  const [expandido, setExpandido] = useState(null)

  const fmt = min => {
    if (min === null || min === undefined) return '—'
    if (min < 1) return '< 1min'
    if (min < 60) return `${Math.round(min)}min`
    return `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`
  }

  // Pedidos concluídos no período, pelo canal
  const pedidosFiltrados = pedidos.filter(p => {
    if (p.cancelado) return false
    if (p.data < dataInicio || p.data > dataFim) return false
    if (canal === 'delivery') return p.canal === 'delivery' && p.timestamps?.novo && (p.timestamps?.entregue || p.timestamps?.completo)
    return p.canal !== 'delivery' && p.timestamps?.novo && p.timestamps?.completo
  })

  // Agrupa tempos por prato
  const porPrato = {}
  pedidosFiltrados.forEach(p => {
    const ts = p.timestamps || {}
    // restaurante: novo→preparando→completo | delivery: novo→preparando→pronto→saindo→entregue
    const fim = canal === 'delivery' ? (ts.entregue || ts.completo) : ts.completo
    const tempoEspera  = ts.novo && ts.preparando ? (new Date(ts.preparando) - new Date(ts.novo)) / 60000 : null
    const tempoPreparo = ts.preparando && fim       ? (new Date(fim) - new Date(ts.preparando)) / 60000 : null
    const tempoTotal   = ts.novo && fim             ? (new Date(fim) - new Date(ts.novo)) / 60000 : null

    ;(p.itens || []).forEach(item => {
      if (!porPrato[item.pratoId]) porPrato[item.pratoId] = { somaEspera: 0, somaPreparo: 0, somaTotal: 0, nEspera: 0, nPreparo: 0, nTotal: 0, pedidos: [] }
      const r = porPrato[item.pratoId]
      if (tempoEspera  !== null) { r.somaEspera  += tempoEspera  * item.quantidade; r.nEspera  += item.quantidade }
      if (tempoPreparo !== null) { r.somaPreparo += tempoPreparo * item.quantidade; r.nPreparo += item.quantidade }
      if (tempoTotal   !== null) { r.somaTotal   += tempoTotal   * item.quantidade; r.nTotal   += item.quantidade }
      r.pedidos.push({ id: p.id, hora: p.hora, data: p.data, tempoEspera, tempoPreparo, tempoTotal, quantidade: item.quantidade })
    })
  })

  const ranking = Object.entries(porPrato).map(([pratoId, r]) => {
    const prato = pratos.find(x => x.id === pratoId)
    if (!prato) return null
    const mediaEspera  = r.nEspera  > 0 ? r.somaEspera  / r.nEspera  : null
    const mediaPreparo = r.nPreparo > 0 ? r.somaPreparo / r.nPreparo : null
    const mediaTotal   = r.nTotal   > 0 ? r.somaTotal   / r.nTotal   : null
    return { prato, mediaEspera, mediaPreparo, mediaTotal, amostras: r.nTotal, pedidos: r.pedidos }
  }).filter(Boolean).sort((a, b) => (b.mediaTotal || 0) - (a.mediaTotal || 0))

  const maxTotal = ranking[0]?.mediaTotal || 1

  if (pedidosFiltrados.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 gap-3">
        <Timer size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Nenhum pedido {canal === 'delivery' ? 'delivery' : 'do restaurante'} concluído no período
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Os dados aparecem quando pedidos passam por todo o fluxo do Kanban</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Canal toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[{ id: 'restaurante', label: 'Restaurante' }, { id: 'delivery', label: 'Delivery' }].map(op => (
            <button key={op.id} onClick={() => { setCanal(op.id); setExpandido(null) }} style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: canal === op.id ? 'var(--accent)' : 'var(--bg-hover)',
              color: canal === op.id ? '#fff' : 'var(--text-secondary)',
            }}>{op.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pedidosFiltrados.length} pedidos analisados · {ranking.length} pratos</span>
      </div>

      {/* Legenda etapas */}
      <div className="card p-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { cor: '#3b82f6', label: 'Espera (aguardando preparo)' },
          { cor: '#f59e0b', label: canal === 'delivery' ? 'Preparo + entrega' : 'Preparo (na cozinha)' },
          { cor: '#6b7280', label: 'Total (do pedido à entrega)' },
        ].map(({ cor, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: cor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Ranking */}
      {ranking.map(({ prato, mediaEspera, mediaPreparo, mediaTotal, amostras, pedidos: peds }) => {
        const isAlert = mediaTotal !== null && mediaTotal > 25
        const barW = mediaTotal ? (mediaTotal / maxTotal) * 100 : 0
        const open = expandido === prato.id

        return (
          <div key={prato.id} className="card p-0 overflow-hidden" style={{ border: isAlert ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
            <button
              onClick={() => setExpandido(open ? null : prato.id)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isAlert && <AlertTriangle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />}
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{prato.nome}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{amostras} pedido{amostras !== 1 ? 's' : ''} analisado{amostras !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#3b82f6', marginBottom: 2 }}>Espera</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{fmt(mediaEspera)}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#f59e0b', marginBottom: 2 }}>Preparo</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(mediaPreparo)}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Total</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: isAlert ? '#ef4444' : 'var(--text-primary)' }}>{fmt(mediaTotal)}</p>
                  </div>
                </div>
                {open ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </div>

              {/* Barra visual */}
              <div style={{ display: 'flex', gap: 3, height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-hover)' }}>
                {mediaEspera && <div style={{ width: `${(mediaEspera / (maxTotal || 1)) * 100}%`, background: '#3b82f6', transition: 'width .4s' }} />}
                {mediaPreparo && <div style={{ width: `${(mediaPreparo / (maxTotal || 1)) * 100}%`, background: '#f59e0b', transition: 'width .4s' }} />}
              </div>
            </button>

            {/* Detalhe pedido a pedido */}
            {open && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Histórico de pedidos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[...peds].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 20).map((ped, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: 50 }}>{ped.data?.split('-').reverse().join('/') || '--'}</span>
                      <span style={{ color: 'var(--text-muted)', minWidth: 40 }}>{ped.hora}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>×{ped.quantidade}</span>
                      <span style={{ color: '#3b82f6', minWidth: 60 }}>espera: {fmt(ped.tempoEspera)}</span>
                      <span style={{ color: '#f59e0b', minWidth: 70 }}>preparo: {fmt(ped.tempoPreparo)}</span>
                      <span style={{ fontWeight: 700, color: ped.tempoTotal > 25 ? '#ef4444' : '#16a34a' }}>total: {fmt(ped.tempoTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Vendas() {
  const { entradasVendas, removerEntradaVenda, pratos, ingredientes, garcons, pedidos, mesas, clientes, sessoesMesas, kanbanConfig, marcarPedidoPago, cardapioConfig, marcarEntregue } = useApp()
  const h = hoje()
  const [periodo, setPeriodo] = useState({ dataInicio: h, dataFim: h })
  const [entradaDetalhe, setEntradaDetalhe] = useState(null)
  const [aba, setAba] = useState('lancamentos')
  const [extratoInicio, setExtratoInicio] = useState(h)
  const [extratoFim, setExtratoFim] = useState(h)
  const [clienteExpandido, setClienteExpandido] = useState(null)

  const { dataInicio, dataFim } = periodo

  // Encontra o pedido do kanban vinculado a uma entrada (mesma data/hora/prato)
  function pedidoDeEntrada(entrada) {
    return pedidos.find(p =>
      p.data === entrada.data &&
      p.hora === entrada.hora &&
      p.itens?.some(i => i.pratoId === entrada.pratoId)
    ) || null
  }

  // Resolução de nome de cliente: via clienteId OU via sessoesMesas (para mesas com nomeCliente)
  function resolverCliente(entrada) {
    const ped = pedidoDeEntrada(entrada)
    if (!ped) return null
    if (ped.clienteId) {
      const c = clientes.find(c => c.id === ped.clienteId)
      if (c) return { id: ped.clienteId, nome: c.nome }
    }
    if (ped.mesaId && ped.timestamps?.novo) {
      const ts = ped.timestamps.novo
      const sessao = sessoesMesas.find(s =>
        s.mesaId === ped.mesaId && s.nomeCliente && s.inicio <= ts
      )
      if (sessao?.nomeCliente) return { id: `mesa:${sessao.mesaId}:${sessao.inicio}`, nome: sessao.nomeCliente }
    }
    return null
  }

  // Encontra garçon pelo pedido vinculado
  function garconDeEntrada(entrada) {
    const ped = pedidoDeEntrada(entrada)
    if (!ped) return null
    return garcons.find(g => g.id === ped.garconId) || null
  }

  // Encontra mesa pelo pedido vinculado
  function mesaDeEntrada(entrada) {
    const ped = pedidoDeEntrada(entrada)
    if (!ped?.mesaId) return null
    return mesas.find(m => m.id === ped.mesaId) || null
  }

  function receitaDaEntrada(entrada, prato) {
    return receitaEntrada(entrada, prato)
  }

  function lucroDaEntrada(entrada, prato) {
    return lucroEntrada(entrada, prato, ingredientes, pedidos)
  }

  const entradasDia = entradasVendas
    .filter(e => e.data >= dataInicio && e.data <= dataFim)
    .sort((a, b) => b.data !== a.data ? b.data.localeCompare(a.data) : b.hora.localeCompare(a.hora))

  const entradasPagas = entradasDia.filter(e => {
    const ped = pedidoDeEntrada(e)
    if (ped?.cancelado) return false
    return !ped || ped.pago === true
  })

  const entradasPendentes = entradasDia.filter(e => {
    const ped = pedidoDeEntrada(e)
    return ped && !ped.pago && !ped.cancelado
  })

  const totalReceita = entradasPagas.reduce((s, e) => {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) return s
    return s + receitaDaEntrada(e, prato)
  }, 0)
  const totalLucro = entradasPagas.reduce((s, e) => {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) return s
    return s + lucroDaEntrada(e, prato)
  }, 0)
  const totalCMV = totalReceita - totalLucro
  const margemBruta = totalReceita > 0 ? (totalLucro / totalReceita * 100) : 0

  // ── Extrato de Vendas Pagas ──
  const entradasExtrato = entradasVendas
    .filter(e => {
      if (e.data < extratoInicio || e.data > extratoFim) return false
      const ped = pedidoDeEntrada(e)
      if (ped?.cancelado) return false
      return !ped || ped.pago === true
    })
    .sort((a, b) => b.data !== a.data ? b.data.localeCompare(a.data) : b.hora.localeCompare(a.hora))

  const totalExtrato = entradasExtrato.reduce((s, e) => {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) return s
    return s + receitaDaEntrada(e, prato)
  }, 0)
  const totalLucroExtrato = entradasExtrato.reduce((s, e) => {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) return s
    return s + lucroDaEntrada(e, prato)
  }, 0)
  const qtdTotalExtrato = entradasExtrato.reduce((s, e) => s + e.quantidade, 0)

  function imprimirExtrato(formato) {
    const nomeEst = cardapioConfig?.nomeRestaurante || 'Estabelecimento'
    const fmtData = d => d.split('-').reverse().join('/')
    const periodo = extratoInicio === extratoFim
      ? fmtData(extratoInicio)
      : `${fmtData(extratoInicio)} até ${fmtData(extratoFim)}`
    const fmt = v => `R$ ${v.toFixed(2).replace('.', ',')}`

    const linhas = entradasExtrato.map(e => {
      const prato = pratos.find(p => p.id === e.pratoId)
      if (!prato) return null
      const extrasUnit = e.extrasUnit || 0
      const total = receitaDaEntrada(e, prato)
      const garcon = garconDeEntrada(e)
      const mesa = mesaDeEntrada(e)
      return {
        data: fmtData(e.data),
        hora: e.hora,
        produto: prato.nome,
        origem: garcon ? garcon.nome : 'Balcão',
        mesa: mesa?.nome || '',
        qtd: e.quantidade,
        unitario: (e.precoVendaUnit !== null && e.precoVendaUnit !== undefined ? Number(e.precoVendaUnit) : prato.precoVenda) + extrasUnit,
        total,
      }
    }).filter(Boolean)

    const totalGeral = linhas.reduce((s, l) => s + l.total, 0)
    const qtdTotal = linhas.reduce((s, l) => s + l.qtd, 0)
    const geradoEm = new Date().toLocaleString('pt-BR')

    let html = ''
    if (formato === 'a4') {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Extrato de Vendas</title><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Arial,sans-serif; font-size:12px; color:#111; padding:32px; }
h1 { font-size:22px; font-weight:bold; margin-bottom:4px; }
.sub { font-size:13px; color:#555; margin-bottom:24px; }
.header-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
.gen { font-size:11px; color:#888; }
table { width:100%; border-collapse:collapse; margin-top:12px; }
th { background:#f1f5f9; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; padding:8px 10px; border-bottom:2px solid #cbd5e1; text-align:left; }
td { padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:12px; }
tr:last-child td { border-bottom:2px solid #cbd5e1; }
.num { text-align:right; }
.tfoot td { font-weight:700; background:#f8fafc; font-size:13px; padding:10px; }
@media print { body { padding:16px; } .print-bar { display:none; } }
</style></head><body>
<div class="print-bar" style="background:#1d4ed8;color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;margin:-32px -32px 24px -32px;font-family:Arial,sans-serif;">
  <span style="font-size:13px;">&#128438; Extrato de Vendas Pagas &mdash; ${periodo}</span>
  <button onclick="window.print()" style="background:#fff;color:#1d4ed8;border:none;padding:6px 18px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">&#128424; Imprimir / PDF</button>
</div>
<div class="header-row"><h1>${nomeEst}</h1><span class="gen">Gerado em ${geradoEm}</span></div>
<div class="sub">Extrato de Vendas Pagas — ${periodo}</div>
<table><thead><tr>
  <th>Data</th><th>Hora</th><th>Produto</th><th>Origem</th>
  <th class="num">Qtd</th><th class="num">Unit.</th><th class="num">Total</th>
</tr></thead><tbody>
${linhas.map(l => `<tr>
  <td>${l.data}</td><td>${l.hora}</td><td>${l.produto}</td>
  <td>${l.origem}${l.mesa ? ' · ' + l.mesa : ''}</td>
  <td class="num">${l.qtd}</td><td class="num">${fmt(l.unitario)}</td><td class="num">${fmt(l.total)}</td>
</tr>`).join('')}
</tbody><tfoot><tr class="tfoot">
  <td colspan="4">TOTAL GERAL</td>
  <td class="num">${qtdTotal}</td><td></td><td class="num">${fmt(totalGeral)}</td>
</tr></tfoot></table>
<p style="margin-top:12px;font-size:11px;color:#888;text-align:right;">${linhas.length} lan\u00e7amento${linhas.length !== 1 ? 's' : ''}</p>
</body></html>`
    } else {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cupom Extrato</title><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Courier New',monospace; font-size:12px; color:#000; width:300px; padding:12px 8px; }
.center { text-align:center; }
.bold { font-weight:bold; }
.divider { border-bottom:1px dashed #000; margin:6px 0; }
.row { display:flex; justify-content:space-between; margin:2px 0; font-size:11px; }
.total-row { display:flex; justify-content:space-between; margin:4px 0; font-size:13px; font-weight:bold; }
.item { font-size:11px; margin-top:4px; }
.small { font-size:10px; color:#555; }
@media print { body { width:280px; } .print-bar { display:none; } }
</style></head><body>
<div class="print-bar" style="background:#1d4ed8;color:#fff;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-family:Arial,sans-serif;">
  <span style="font-size:11px;">Cupom &mdash; ${periodo}</span>
  <button onclick="window.print()" style="background:#fff;color:#1d4ed8;border:none;padding:4px 12px;border-radius:5px;font-weight:700;font-size:11px;cursor:pointer;">Imprimir</button>
</div>
<div class="center bold" style="font-size:15px;margin-bottom:2px;">${nomeEst}</div>
<div class="center small">Extrato de Vendas Pagas</div>
<div class="center small">${periodo}</div>
<div class="divider"></div>
${linhas.map(l => `<div class="item">${l.data} ${l.hora} — ${l.produto}</div><div class="row"><span class="small">${l.origem}${l.mesa ? ' · ' + l.mesa : ''} &times;${l.qtd}</span><span>${fmt(l.total)}</span></div>`).join('')}
<div class="divider"></div>
<div class="total-row"><span>TOTAL</span><span>${fmt(totalGeral)}</span></div>
<div class="row small"><span>${linhas.length} lançamento${linhas.length !== 1 ? 's' : ''}</span><span>${qtdTotal} unid.</span></div>
<div class="divider"></div>
<div class="center small" style="margin-top:8px;">Gerado em ${geradoEm}</div>
</body></html>`
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  // Vendas por funcionário — individual entries per section (Balcão + garçons com pedidos)
  const porFuncionario = (() => {
    const mapa = {}
    entradasDia.forEach(entrada => {
      const ped = pedidoDeEntrada(entrada)
      const garcon = ped ? garcons.find(g => g.id === ped.garconId) : null
      const chave = garcon ? garcon.id : '__balcao__'
      const nome = garcon ? garcon.nome : 'Balcão'
      const prato = pratos.find(p => p.id === entrada.pratoId)
      if (!prato) return
      const receita = receitaDaEntrada(entrada, prato)
      if (!mapa[chave]) mapa[chave] = { id: chave, nome, isGarcon: !!garcon, totalReceita: 0, totalUnidades: 0, entradas: [] }
      mapa[chave].totalReceita += receita
      mapa[chave].totalUnidades += entrada.quantidade
      mapa[chave].entradas.push({ entrada, prato, ped })
    })
    const arr = Object.values(mapa)
    const balcao = arr.filter(x => !x.isGarcon)
    const garcs = arr.filter(x => x.isGarcon).sort((a, b) => b.totalReceita - a.totalReceita)
    return [...balcao, ...garcs]
  })()

  // Histórico completo por cliente (clienteId) — todas as compras, sem filtro de período
  const porCliente = (() => {
    const mapa = {}
    entradasVendas.forEach(entrada => {
      const ped = pedidoDeEntrada(entrada)
      if (!ped?.clienteId) return
      const c = clientes.find(c => c.id === ped.clienteId)
      if (!c) return
      const prato = pratos.find(p => p.id === entrada.pratoId)
      if (!prato) return
      const receita = receitaDaEntrada(entrada, prato)
      if (!mapa[c.id]) mapa[c.id] = { id: c.id, nome: c.nome, totalReceita: 0, totalUnidades: 0, totalPedidos: 0, entradas: [] }
      mapa[c.id].totalReceita += receita
      mapa[c.id].totalUnidades += entrada.quantidade
      mapa[c.id].entradas.push({ entrada, prato, ped })
    })
    Object.values(mapa).forEach(cli => {
      const ids = new Set(cli.entradas.map(e => e.ped?.id).filter(Boolean))
      cli.totalPedidos = ids.size
    })
    return Object.values(mapa).sort((a, b) => b.totalReceita - a.totalReceita)
  })()

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">Histórico de lançamentos com horário</p>
        </div>
        <FiltroPeriodo onChange={setPeriodo} />
      </div>

      {entradasDia.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Faturamento', valor: totalReceita, cor: '#3b82f6', fmt: formatarMoeda },
            { label: 'Lucro Bruto', valor: totalLucro, cor: '#16a34a', fmt: formatarMoeda },
            { label: 'Margem Bruta', valor: margemBruta, cor: '#7c3aed', fmt: v => `${v.toFixed(1)}%` },
            { label: 'CMV', valor: totalCMV, cor: '#ef4444', fmt: formatarMoeda },
          ].map(({ label, valor, cor, fmt }) => (
            <div key={label} className="card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xl font-bold" style={{ color: cor }}>{fmt(valor)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ overflowX: 'auto', paddingBottom: 2, marginBottom: 16 }}>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-hover)', width: 'fit-content', display: 'flex', gap: 4 }}>
          {[{ id: 'lancamentos', label: 'Lançamentos' }, { id: 'funcionarios', label: 'Funcionários' }, { id: 'clientes', label: 'Clientes' }, { id: 'extrato', label: 'Extrato de Vendas' }, { id: 'delivery', label: 'Delivery' }, { id: 'tempo', label: '⏱ Tempo' }].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.id
                ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }
                : { color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {aba === 'funcionarios' ? (
        porFuncionario.length === 0 ? (
          <TabelaVazia icone={ShoppingCart} mensagem="Nenhuma venda no período" />
        ) : (
          <div className="flex flex-col gap-4">
            {porFuncionario.map(func => (
              <div key={func.id} className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: func.isGarcon ? 'var(--accent-bg)' : 'rgba(107,114,128,0.12)', color: func.isGarcon ? 'var(--accent)' : '#6b7280' }}>
                      {func.nome[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{func.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {func.totalUnidades} unid. · {func.entradas.length} lançamento{func.entradas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receita</p>
                    <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>{formatarMoeda(func.totalReceita)}</p>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Receita</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...func.entradas].sort((a, b) =>
                        b.entrada.data !== a.entrada.data
                          ? b.entrada.data.localeCompare(a.entrada.data)
                          : b.entrada.hora.localeCompare(a.entrada.hora)
                      ).map(({ entrada, prato, ped }, idx) => {
                        const receita = receitaDaEntrada(entrada, prato)
                        const lastId = kanbanConfig?.etapas?.[kanbanConfig.etapas.length - 1]?.id || 'completo'
                        return (
                          <tr key={entrada.id || idx}>
                            <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                              {entrada.data.slice(5).replace('-', '/')}
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>{entrada.hora}</span>
                              </div>
                            </td>
                            <td className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{prato.nome}</td>
                            <td><span className="font-bold" style={{ color: 'var(--text-primary)' }}>×{entrada.quantidade}</span></td>
                            <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatarMoeda(receita)}</td>
                            <td>{(() => {
                              if (!ped) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Balcão</span>
                              if (ped.cancelado) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Cancelado</span>
                              if (ped.pago) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>Pago</span>
                              if (ped.status === lastId) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>Ag. pgto.</span>
                              return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Em preparo</span>
                            })()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ) : aba === 'clientes' ? (
        porCliente.length === 0 ? (
          <TabelaVazia icone={ShoppingCart} mensagem="Nenhum cliente com pedido registrado"
            submensagem="Crie clientes ao registrar pedidos para vê-los aqui." />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Histórico completo · todas as compras de cada cliente</p>
            {porCliente.map(cli => (
              <div key={cli.id} className="card p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{
                    background: clienteExpandido === cli.id ? 'var(--accent-bg)' : 'var(--bg-hover)',
                    borderBottom: clienteExpandido === cli.id ? '1px solid var(--border-active)' : '1px solid var(--border)',
                    cursor: 'pointer', border: 'none', width: '100%'
                  }}
                  onClick={() => setClienteExpandido(clienteExpandido === cli.id ? null : cli.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {cli.nome[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{cli.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {cli.totalUnidades} unid. · {cli.totalPedidos} pedido{cli.totalPedidos !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total gasto</p>
                      <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>{formatarMoeda(cli.totalReceita)}</p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{clienteExpandido === cli.id ? '▲' : '▼'}</span>
                  </div>
                </button>
                {clienteExpandido === cli.id && (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Hora</th>
                          <th>Produto</th>
                          <th>Qtd</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...cli.entradas].sort((a, b) =>
                          b.entrada.data !== a.entrada.data
                            ? b.entrada.data.localeCompare(a.entrada.data)
                            : b.entrada.hora.localeCompare(a.entrada.hora)
                        ).map(({ entrada, prato, ped }, idx) => {
                          const total = receitaDaEntrada(entrada, prato)
                          const lastId = kanbanConfig?.etapas?.[kanbanConfig.etapas.length - 1]?.id || 'completo'
                          return (
                            <tr key={entrada.id || idx}>
                              <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                                {entrada.data.split('-').reverse().join('/')}
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>{entrada.hora}</span>
                                </div>
                              </td>
                              <td className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{prato.nome}</td>
                              <td><span className="font-bold" style={{ color: 'var(--text-primary)' }}>×{entrada.quantidade}</span></td>
                              <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatarMoeda(total)}</td>
                              <td>{(() => {
                                if (!ped) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Balcão</span>
                                if (ped.cancelado) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Cancelado</span>
                                if (ped.pago) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>Pago</span>
                                if (ped.status === lastId) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>Ag. pgto.</span>
                                return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Em preparo</span>
                              })()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : aba === 'extrato' ? (
        <div>
          {/* Filtro de período do extrato */}
          <div className="card mb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Período do Extrato</p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>De</label>
                    <input type="date" value={extratoInicio} onChange={e => setExtratoInicio(e.target.value)}
                      className="input" style={{ width: 150 }} />
                  </div>
                  <span className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>—</span>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Até</label>
                    <input type="date" value={extratoFim} onChange={e => setExtratoFim(e.target.value)}
                      className="input" style={{ width: 150 }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Imprimir</p>
                <div className="flex gap-2">
                  <button className="btn btn-secondary flex items-center gap-2 text-sm"
                    onClick={() => imprimirExtrato('a4')} disabled={entradasExtrato.length === 0}
                    title="Imprimir em A4">
                    <Printer size={14} />
                    <span>A4</span>
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2 text-sm"
                    onClick={() => imprimirExtrato('cupom')} disabled={entradasExtrato.length === 0}
                    title="Imprimir como cupom / nota fiscal">
                    <FileText size={14} />
                    <span>Cupom</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Totais do extrato */}
          {entradasExtrato.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card p-4">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Faturado</p>
                <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{formatarMoeda(totalExtrato)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Lucro Bruto</p>
                <p className="text-xl font-bold" style={{ color: '#16a34a' }}>{formatarMoeda(totalLucroExtrato)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Lançamentos</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{entradasExtrato.length} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({qtdTotalExtrato} unid.)</span></p>
              </div>
            </div>
          )}

          {/* Tabela do extrato */}
          <div className="card p-0 overflow-hidden">
            {entradasExtrato.length === 0 ? (
              <TabelaVazia icone={FileText} mensagem="Nenhuma venda paga no período" submensagem="Ajuste as datas acima para ver o extrato." />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th style={{ width: 75 }}>Hora</th>
                      <th>Produto</th>
                      <th>Origem</th>
                      <th>Qtd</th>
                      <th>Unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entradasExtrato.map(entrada => {
                      const prato = pratos.find(p => p.id === entrada.pratoId)
                      if (!prato) return null
                      const extrasUnit = entrada.extrasUnit || 0
                      const receita = receitaDaEntrada(entrada, prato)
                      const garcon = garconDeEntrada(entrada)
                      const mesa = mesaDeEntrada(entrada)
                      return (
                        <tr key={entrada.id}>
                          <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            {entrada.data.slice(5).replace('-', '/')}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                              <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                                {entrada.hora}
                              </span>
                            </div>
                          </td>
                          <td className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{prato.nome}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              {entrada.canal === 'delivery' ? (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border-active)', fontWeight: 700, letterSpacing: '0.04em' }}>
                                  Delivery
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: garcon ? 'var(--accent-bg)' : 'var(--bg-hover)',
                                    color: garcon ? 'var(--accent)' : 'var(--text-muted)',
                                    border: `1px solid ${garcon ? 'var(--border-active)' : 'var(--border)'}`,
                                  }}>
                                  {garcon ? garcon.nome : 'Balcão'}
                                </span>
                              )}
                              {mesa && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                                  {mesa.nome}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>×{entrada.quantidade}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                            {formatarMoeda((entrada.precoVendaUnit !== null && entrada.precoVendaUnit !== undefined ? Number(entrada.precoVendaUnit) : prato.precoVenda) + extrasUnit)}
                          </td>
                          <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatarMoeda(receita)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-hover)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: '10px', color: 'var(--text-primary)', fontSize: 13 }}>TOTAL GERAL</td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontSize: 13 }}>{qtdTotalExtrato}</td>
                      <td></td>
                      <td style={{ padding: '10px', color: '#3b82f6', fontSize: 13 }}>{formatarMoeda(totalExtrato)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
      <>
      <div className="card p-0 overflow-hidden">
        {entradasDia.length === 0 ? (
          <TabelaVazia
            icone={ShoppingCart}
            mensagem="Nenhuma venda lançada neste dia"
            submensagem="Registre vendas pelo Cardápio para elas aparecerem aqui."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {dataInicio !== dataFim && <th>Data</th>}
                  <th style={{ width: 75 }}>Horário</th>
                  <th>Produto</th>
                  <th>Origem</th>
                  <th>Qtd</th>
                  <th>Receita</th>
                  <th>Lucro</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasPagas.map(entrada => {
                  const prato = pratos.find(p => p.id === entrada.pratoId)
                  if (!prato) return null
                  const lucro = lucroDaEntrada(entrada, prato)
                  const receita = receitaDaEntrada(entrada, prato)
                  const garcon = garconDeEntrada(entrada)
                  const mesa = mesaDeEntrada(entrada)
                  const pedido = pedidoDeEntrada(entrada)
                  return (
                    <tr key={entrada.id}>
                      {dataInicio !== dataFim && (
                        <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {entrada.data.slice(5).replace('-', '/')}
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                            {entrada.hora}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="font-medium text-sm text-left hover:underline"
                          style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => setEntradaDetalhe({ entrada, prato, garcon, pedido })}
                        >
                          {prato.nome}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          {entrada.canal === 'delivery' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border-active)', fontWeight: 700, letterSpacing: '0.04em' }}>
                              Delivery
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: garcon ? 'var(--accent-bg)' : 'var(--bg-hover)',
                                color: garcon ? 'var(--accent)' : 'var(--text-muted)',
                                border: `1px solid ${garcon ? 'var(--border-active)' : 'var(--border)'}`,
                              }}>
                              {garcon ? garcon.nome : 'Balcão'}
                            </span>
                          )}
                          {mesa && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                              {mesa.nome}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>×{entrada.quantidade}</span>
                      </td>
                      <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatarMoeda(receita)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatarMoeda(lucro)}</td>
                      <td>
                        {(() => {
                          const etapas = kanbanConfig?.etapas
                          const lastId = etapas?.[etapas.length - 1]?.id || 'completo'
                          if (!pedido) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Balcão</span>
                          if (pedido?.cancelado) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Cancelado</span>
                          if (pedido?.pago) return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>Pago</span>
                          if (pedido?.status === lastId) return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>Entregue</span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>Pend. pagamento</span>
                            </div>
                          )
                          return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>Pendente</span>
                        })()}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button className="btn btn-ghost p-1.5" style={{ color: '#ef4444' }}
                            onClick={() => removerEntradaVenda(entrada.id)} title="Remover lançamento">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {entradasPendentes.length > 0 && (
        <div className="card p-0 overflow-hidden mt-4" style={{ border: '1px solid rgba(249,115,22,0.3)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.05)' }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: '#f97316' }}>⏳ Pagamentos Pendentes</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                {entradasPendentes.length}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pedidos entregues aguardando confirmação de pagamento</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {dataInicio !== dataFim && <th>Data</th>}
                  <th style={{ width: 75 }}>Horário</th>
                  <th>Produto</th>
                  <th>Origem</th>
                  <th>Qtd</th>
                  <th>Valor</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasPendentes.map(entrada => {
                  const prato = pratos.find(p => p.id === entrada.pratoId)
                  if (!prato) return null
                  const receita = receitaDaEntrada(entrada, prato)
                  const garcon = garconDeEntrada(entrada)
                  const mesa = mesaDeEntrada(entrada)
                  const pedido = pedidoDeEntrada(entrada)
                  return (
                    <tr key={entrada.id}>
                      {dataInicio !== dataFim && (
                        <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {entrada.data.slice(5).replace('-', '/')}
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="font-mono text-sm font-semibold" style={{ color: '#f97316' }}>
                            {entrada.hora}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{prato.nome}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          {entrada.canal === 'delivery' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border-active)', fontWeight: 700, letterSpacing: '0.04em' }}>
                              Delivery
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: garcon ? 'var(--accent-bg)' : 'var(--bg-hover)',
                                color: garcon ? 'var(--accent)' : 'var(--text-muted)',
                                border: `1px solid ${garcon ? 'var(--border-active)' : 'var(--border)'}`,
                              }}>
                              {garcon ? garcon.nome : 'Balcão'}
                            </span>
                          )}
                          {mesa && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                              {mesa.nome}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>×{entrada.quantidade}</span>
                      </td>
                      <td style={{ color: '#f97316', fontWeight: 600 }}>{formatarMoeda(receita)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button className="btn btn-ghost p-1.5" style={{ color: '#16a34a' }}
                            onClick={() => pedido && marcarPedidoPago(pedido.id)} title="Confirmar pagamento">
                            <Check size={13} />
                          </button>
                          <button className="btn btn-ghost p-1.5" style={{ color: '#ef4444' }}
                            onClick={() => removerEntradaVenda(entrada.id)} title="Remover lançamento">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>
      )} {/* fecha aba lancamentos */}

      {aba === 'tempo' && (
        <RelatorioTempo
          pedidos={pedidos}
          pratos={pratos}
          dataInicio={dataInicio}
          dataFim={dataFim}
        />
      )}

      {aba === 'delivery' && (() => {
        const pedidosDelivery = pedidos
          .filter(p => p.canal === 'delivery' && !p.cancelado && p.data >= dataInicio && p.data <= dataFim)
          .sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora))

        function printNotaDelivery(p) {
          const win = window.open('', '_blank', 'width=400,height=600')
          if (!win) return
          const itensHtml = (p.itens || []).map(i => {
            const prato = pratos.find(x => x.id === i.pratoId)
            return `<tr><td>×${i.quantidade} ${prato?.nome || i.pratoId}</td><td style="text-align:right">${((prato?.precoVenda || 0) * i.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>`
          }).join('')
          const total = (p.itens || []).reduce((s, i) => {
            const prato = pratos.find(x => x.id === i.pratoId)
            return s + (prato?.precoVenda || 0) * i.quantidade
          }, 0)
          win.document.write(`
            <html><head><title>Pedido Delivery</title>
            <style>body{font-family:monospace;padding:20px;max-width:320px;margin:0 auto}h2{text-align:center}table{width:100%;border-collapse:collapse}td{padding:4px 0}hr{border:1px dashed #ccc}.total{font-weight:bold;font-size:16px}</style>
            </head><body>
            <h2>Pedido Delivery</h2><hr/>
            <p><b>Cliente:</b> ${p.clienteNome || '—'}</p>
            <p><b>Endereço:</b> ${p.enderecoEntrega || '—'}</p>
            <p><b>Data:</b> ${p.data} às ${p.hora}</p>
            <hr/><table>${itensHtml}</table><hr/>
            ${p.obs ? `<p><i>Obs: ${p.obs}</i></p><hr/>` : ''}
            <p class="total">Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p style="text-align:center;font-size:11px">Status: ${p.status === 'entregue' ? 'Entregue ✓' : p.status === 'saindo' ? 'Saindo para entregar' : p.status === 'pronto' ? 'Pronto' : p.status}</p>
            <script>window.print();window.close()</script></body></html>`)
        }

        const statusLabel = { novo: 'Aguardando', preparando: 'Preparando', pronto: 'Pronto', saindo: 'Saindo', entregue: 'Entregue' }
        const statusCor = { novo: '#3b82f6', preparando: '#f59e0b', pronto: '#22c55e', saindo: '#f97316', entregue: '#16a34a' }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={16} color="var(--accent)" />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {pedidosDelivery.length} pedido{pedidosDelivery.length !== 1 ? 's' : ''} no período
              </span>
            </div>

            {pedidosDelivery.length === 0 ? (
              <TabelaVazia icone={Truck} mensagem="Nenhum pedido delivery no período" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pedidosDelivery.map(p => {
                  const total = (p.itens || []).reduce((s, i) => {
                    const prato = pratos.find(x => x.id === i.pratoId)
                    return s + (prato?.precoVenda || 0) * i.quantidade
                  }, 0)
                  const cor = statusCor[p.status] || '#a1a1aa'
                  return (
                    <div key={p.id} className="card" style={{ borderLeft: `3px solid ${cor}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.clienteNome || 'Cliente'}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: `${cor}1a`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${cor}44` }}>
                              {statusLabel[p.status] || p.status}
                            </span>
                          </div>
                          {p.enderecoEntrega && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MapPin size={11} color="var(--text-muted)" />
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.enderecoEntrega}</span>
                            </div>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.data} às {p.hora}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <button onClick={() => printNotaDelivery(p)}
                            className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Printer size={13} />Nota
                          </button>
                        </div>
                      </div>

                      {/* Itens */}
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {(p.itens || []).map((item, idx) => {
                          const prato = pratos.find(x => x.id === item.pratoId)
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>×{item.quantidade} {prato?.nome || item.pratoId}</span>
                              {prato && (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  {(prato.precoVenda * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {p.obs && <p style={{ fontSize: 12, color: '#d97706', fontStyle: 'italic', margin: '4px 0 0' }}>Obs: {p.obs}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {entradaDetalhe && (
        <ModalPedido
          entrada={entradaDetalhe.entrada}
          pedido={entradaDetalhe.pedido}
          prato={entradaDetalhe.prato}
          garcon={entradaDetalhe.garcon}
          onFechar={() => setEntradaDetalhe(null)}
        />
      )}
    </div>
  )
}
