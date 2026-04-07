import { useState, useRef, useEffect } from 'react'
import { BarChart2, TrendingUp, ShoppingCart, Plus, Check, BookOpen } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import TabelaVazia from '../components/ui/TabelaVazia.jsx'
import Badge, { margemCor, cmvCor } from '../components/ui/Badge.jsx'
import { rankingVendidos, rankingLucrativos, custoPrato, precoPorBase } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem, hoje } from '../utils/formatacao.js'

const MEDALHAS = ['🥇', '🥈', '🥉']

function ModalVenda({ prato, qtdAtual, onSalvar, onFechar }) {
  const [valor, setValor] = useState(String(qtdAtual || 0))
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  function confirmar() {
    const num = Number(valor)
    if (!isNaN(num) && num >= 0) { onSalvar(num); onFechar() }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box max-w-xs w-full">
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-bg)', border: '1px solid var(--border-active)' }}>
              <BookOpen size={17} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Registrar vendas de hoje</p>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{prato.nome}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Quantidade vendida</label>
            <input
              ref={inputRef}
              className="input text-center text-2xl font-bold py-3"
              type="number" min="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmar()}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={onFechar}>Cancelar</button>
            <button className="btn btn-primary flex-1" onClick={confirmar}><Check size={14} /> Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Relatorios() {
  const { pratos, ingredientes, registrosVendas, registrarVendas, buscarVendasDia, adicionarEntradaVenda } = useApp()
  const [aba, setAba] = useState('vendidos')
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dataFim, setDataFim] = useState(hoje())
  const [modalPrato, setModalPrato] = useState(null)
  const [salvos, setSalvos] = useState({})

  const rankV = rankingVendidos(pratos, ingredientes, registrosVendas, dataInicio, dataFim)
  const rankL = rankingLucrativos(pratos, ingredientes, registrosVendas, dataInicio, dataFim)

  function handleSalvar(pratoId, quantidade) {
    const qtdAnterior = buscarVendasDia(pratoId, hoje())
    const diff = quantidade - qtdAnterior
    registrarVendas(pratoId, hoje(), quantidade)
    if (diff > 0) {
      const prato = pratos.find(p => p.id === pratoId)
      const precoVendaUnit = prato ? (prato.precoVenda || 0) : 0
      const custoPratoUnit = prato ? custoPrato(prato, ingredientes) : 0
      const ingredientesSnapshot = prato?.ingredientes?.length
        ? prato.ingredientes.map(linha => {
            const ing = ingredientes.find(i => i.id === linha.ingredienteId)
            if (!ing) return null
            return { ingredienteId: linha.ingredienteId, custo: precoPorBase(ing) * linha.quantidade }
          }).filter(Boolean)
        : null
      adicionarEntradaVenda(pratoId, diff, null, 0, 0, custoPratoUnit, ingredientesSnapshot, precoVendaUnit)
    }
    setSalvos(prev => ({ ...prev, [pratoId]: true }))
    setTimeout(() => setSalvos(prev => ({ ...prev, [pratoId]: false })), 2000)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Vendas e lucratividade por período</p>
        </div>
      </div>

      {/* Lançar vendas */}
      {pratos.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lançar Vendas</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hoje().split('-').reverse().join('/')} · Clique em uma receita para lançar</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {pratos.length} receita{pratos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pratos.map(p => {
              const qtd = buscarVendasDia(p.id, hoje())
              const salvo = salvos[p.id]
              const temVenda = qtd > 0
              return (
                <button
                  key={p.id}
                  onClick={() => setModalPrato(p)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 group"
                  style={{
                    background: temVenda ? 'var(--accent-bg)' : 'var(--bg-hover)',
                    border: temVenda ? '1px solid var(--border-active)' : '1px solid var(--border)',
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: temVenda ? 'rgba(22,163,74,0.15)' : 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    {salvo
                      ? <Check size={14} className="text-green-500" />
                      : temVenda
                        ? <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{qtd}</span>
                        : <Plus size={14} style={{ color: 'var(--text-muted)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: temVenda ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {p.nome}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {temVenda ? `${qtd} unidade${qtd !== 1 ? 's' : ''} vendida${qtd !== 1 ? 's' : ''}` : 'Clique para lançar'}
                    </p>
                  </div>
                  {temVenda && (
                    <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                      {formatarMoeda(qtd * p.precoVenda)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtro período */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>De:</label>
          <input className="input w-36 py-1.5 text-sm" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Até:</label>
          <input className="input w-36 py-1.5 text-sm" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <button className="btn btn-ghost py-1.5 text-xs" onClick={() => { setDataInicio(hoje()); setDataFim(hoje()) }}>Hoje</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-hover)' }}>
        {[
          { id: 'vendidos',   label: 'Mais Vendidos',   icon: ShoppingCart },
          { id: 'lucrativos', label: 'Mais Lucrativos', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={aba === id
              ? { background: 'var(--accent)', color: '#fff' }
              : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Ranking Mais Vendidos */}
      {aba === 'vendidos' && (
        <div className="card p-0 overflow-hidden">
          {rankV.every(r => r.quantidade === 0) ? (
            <TabelaVazia icone={ShoppingCart} mensagem="Sem vendas no período" submensagem="Lance as vendas acima para ver o relatório." />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Receita</th><th>Qtd Vendida</th><th>Receita Total</th><th>Lucro Total</th><th>CMV%</th><th>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {rankV.map((r, idx) => (
                    <tr key={r.prato.id} style={r.quantidade === 0 ? { opacity: 0.35 } : {}}>
                      <td className="text-base">{MEDALHAS[idx] || `${idx + 1}º`}</td>
                      <td className="font-medium">{r.prato.nome}</td>
                      <td><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.quantidade}</span><span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>un</span></td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(r.receita)}</td>
                      <td style={{ color: '#3b82f6' }}>{formatarMoeda(r.lucroTotal)}</td>
                      <td><Badge cor={cmvCor(r.cmv)}>CMV {formatarPorcentagem(r.cmv)}</Badge></td>
                      <td><Badge cor={margemCor(r.margemPrato)}>{formatarPorcentagem(r.margemPrato)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ranking Mais Lucrativos */}
      {aba === 'lucrativos' && (
        <div className="card p-0 overflow-hidden">
          {rankL.length === 0 ? (
            <TabelaVazia icone={TrendingUp} mensagem="Nenhuma receita cadastrada" submensagem="Crie receitas para ver o ranking." />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Receita</th><th>Margem %</th><th>CMV%</th><th>Lucro/Un</th><th>Lucro Total</th><th>Qtd Vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {rankL.map((r, idx) => (
                    <tr key={r.prato.id}>
                      <td className="text-base">{MEDALHAS[idx] || `${idx + 1}º`}</td>
                      <td className="font-medium">{r.prato.nome}</td>
                      <td><Badge cor={margemCor(r.margemPrato)}>{formatarPorcentagem(r.margemPrato)}</Badge></td>
                      <td><Badge cor={cmvCor(r.cmv)}>CMV {formatarPorcentagem(r.cmv)}</Badge></td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatarMoeda(r.lucroPorUnidade)}</td>
                      <td style={{ color: '#3b82f6' }}>{formatarMoeda(r.lucroTotal)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.quantidade} un</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalPrato && (
        <ModalVenda
          prato={modalPrato}
          qtdAtual={buscarVendasDia(modalPrato.id, hoje())}
          onSalvar={qtd => handleSalvar(modalPrato.id, qtd)}
          onFechar={() => setModalPrato(null)}
        />
      )}
    </div>
  )
}
