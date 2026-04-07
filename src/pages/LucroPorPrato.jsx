import { useState } from 'react'
import { TrendingUp, ChevronUp, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import TabelaVazia from '../components/ui/TabelaVazia.jsx'
import Badge, { margemCor, cmvCor } from '../components/ui/Badge.jsx'
import { custoPrato, lucroPrato, margemPrato, cmvPrato } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem } from '../utils/formatacao.js'

export default function Precificacao() {
  const { pratos, ingredientes } = useApp()
  const [sortCol, setSortCol] = useState('margem')
  const [sortDir, setSortDir] = useState('desc')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')

  const categorias = ['Todas', ...new Set(pratos.map(p => p.categoria).filter(Boolean))]

  const dados = pratos
    .filter(p => filtroCategoria === 'Todas' || p.categoria === filtroCategoria)
    .map(p => ({
      id: p.id, nome: p.nome,
      categoria: p.categoria || '',
      precoVenda: p.precoVenda,
      custo: custoPrato(p, ingredientes),
      lucro: lucroPrato(p, ingredientes),
      margem: margemPrato(p, ingredientes),
      cmv: cmvPrato(p, ingredientes),
    }))

  const sorted = [...dados].sort((a, b) => {
    const v = sortDir === 'asc' ? 1 : -1
    if (typeof a[sortCol] === 'string') return v * a[sortCol].localeCompare(b[sortCol])
    return v * (a[sortCol] - b[sortCol])
  })

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronUp size={11} style={{ opacity: 0.25 }} />
    return sortDir === 'asc' ? <ChevronUp size={11} style={{ color: 'var(--accent)' }} /> : <ChevronDown size={11} style={{ color: 'var(--accent)' }} />
  }

  const totalVenda = dados.reduce((s, d) => s + d.precoVenda, 0)
  const totalCusto = dados.reduce((s, d) => s + d.custo, 0)
  const totalLucro = dados.reduce((s, d) => s + d.lucro, 0)
  const margemMedia = totalVenda > 0 ? (totalLucro / totalVenda) * 100 : 0
  const cmvMedio = totalVenda > 0 ? (totalCusto / totalVenda) * 100 : 0
  const n = dados.length || 1

  const cols = [
    { col: 'nome',       label: 'Receita' },
    { col: 'categoria',  label: 'Categoria' },
    { col: 'precoVenda', label: 'Preço Venda' },
    { col: 'custo',      label: 'Custo' },
    { col: 'cmv',        label: 'CMV%' },
    { col: 'lucro',      label: 'Lucro' },
    { col: 'margem',     label: 'Margem' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Precificação</h1>
          <p className="page-subtitle">CMV e análise de lucratividade por receita</p>
        </div>
      </div>

      {/* KPI cards */}
      {dados.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Receitas', valor: pratos.length, cor: 'var(--text-primary)' },
            { label: 'Ticket Médio', valor: formatarMoeda(totalVenda / n), cor: 'var(--accent)' },
            { label: 'Custo Médio', valor: formatarMoeda(totalCusto / n), cor: '#ef4444' },
            { label: 'CMV Médio', valor: formatarPorcentagem(cmvMedio), cor: cmvMedio <= 35 ? 'var(--accent)' : '#f59e0b' },
            { label: 'Margem Média', valor: formatarPorcentagem(margemMedia), cor: margemMedia >= 30 ? 'var(--accent)' : '#f59e0b' },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="card text-center py-3 px-2">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-lg font-bold" style={{ color: cor }}>{valor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtro categoria */}
      {categorias.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filtroCategoria === cat
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {sorted.length === 0 ? (
          <TabelaVazia
            icone={TrendingUp}
            mensagem="Nenhuma receita cadastrada"
            submensagem="Crie receitas para ver a análise de precificação e CMV."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  {cols.map(({ col, label }) => (
                    <th key={col} onClick={() => toggleSort(col)}>
                      <span className="flex items-center gap-1">{label} <SortIcon col={col} /></span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, idx) => (
                  <tr key={d.id}>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td className="font-medium">{d.nome}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {d.categoria}
                      </span>
                    </td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(d.precoVenda)}</td>
                    <td style={{ color: '#ef4444' }}>{formatarMoeda(d.custo)}</td>
                    <td>
                      <Badge cor={cmvCor(d.cmv)}>CMV {formatarPorcentagem(d.cmv)}</Badge>
                    </td>
                    <td style={{ color: d.lucro >= 0 ? '#3b82f6' : '#ef4444' }}>{formatarMoeda(d.lucro)}</td>
                    <td>
                      <Badge cor={margemCor(d.margem)}>{formatarPorcentagem(d.margem)}</Badge>
                    </td>
                  </tr>
                ))}
                {/* Média row */}
                <tr style={{ background: 'var(--bg-hover)', borderTop: '1px solid var(--border)' }}>
                  <td />
                  <td className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Média</td>
                  <td />
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(totalVenda / n)}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatarMoeda(totalCusto / n)}</td>
                  <td><Badge cor={cmvCor(cmvMedio)}>CMV {formatarPorcentagem(cmvMedio)}</Badge></td>
                  <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatarMoeda(totalLucro / n)}</td>
                  <td><Badge cor={margemCor(margemMedia)}>{formatarPorcentagem(margemMedia)}</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
