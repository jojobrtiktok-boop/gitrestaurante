import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Copy, Check, RefreshCw, Camera, X, ShoppingBag, CreditCard, Tv, Play, Monitor } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { SONS_ALERTA, tocarSom } from '../utils/sons.js'

/* ─── Painel: Display da Cozinha (KDS) ──────────────── */
export function PainelCozinha() {  const { kanbanConfig, atualizarKanbanConfig, gerarTokenCozinha, gerarTokenPedidosDisplay } = useApp()
  const [copiado, setCopiado] = useState(false)
  const [copiadoPedidos, setCopiadoPedidos] = useState(false)
  const logoRef = useRef(null)

  const base = window.location.origin
  const urlCozinha = kanbanConfig.cozinhaToken ? `${base}/cozinha/${kanbanConfig.cozinhaToken}` : null
  const urlPedidos = kanbanConfig.pedidosDisplayToken ? `${base}/pedidos-display/${kanbanConfig.pedidosDisplayToken}` : null

  function copiar(texto) {
    navigator.clipboard.writeText(texto); setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  function copiarPedidos(texto) {
    navigator.clipboard.writeText(texto); setCopiadoPedidos(true)
    setTimeout(() => setCopiadoPedidos(false), 2000)
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Máx 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => atualizarKanbanConfig({ cozinhaLogo: ev.target.result })
    reader.readAsDataURL(file); e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Identidade */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Display da Cozinha (KDS)</h2>
        </div>

        {/* Logo compartilhada */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Logo do Restaurante</label>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Compartilhada com o Display do Caixa</p>
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden shrink-0"
              style={{ width: 64, height: 64, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kanbanConfig.cozinhaLogo
                ? <img src={kanbanConfig.cozinhaLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={22} style={{ color: 'var(--text-muted)' }} />
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <button className="btn btn-secondary text-xs py-1.5" onClick={() => logoRef.current?.click()}>
                <Camera size={12} /> {kanbanConfig.cozinhaLogo ? 'Alterar logo' : 'Enviar logo'}
              </button>
              {kanbanConfig.cozinhaLogo && (
                <button className="btn btn-ghost text-xs py-1 px-2" style={{ color: '#ef4444' }} onClick={() => atualizarKanbanConfig({ cozinhaLogo: null })}>
                  <X size={11} /> Remover
                </button>
              )}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG — máx 2 MB</span>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Título */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título do Display</label>
          <input className="input" placeholder="Cozinha" value={kanbanConfig.cozinhaTitulo || ''}
            onChange={e => atualizarKanbanConfig({ cozinhaTitulo: e.target.value })} />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Link da Cozinha</label>
          {urlCozinha && (
            <div className="flex gap-2 items-center p-2.5 rounded-xl mb-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlCozinha}</span>
              <button className="btn btn-primary py-1 px-2.5 text-xs shrink-0" onClick={() => copiar(urlCozinha)}>
                {copiado ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
              <a href={urlCozinha} target="_blank" rel="noreferrer" className="btn btn-secondary py-1 px-2.5 text-xs shrink-0">Abrir</a>
            </div>
          )}
          <button className="btn btn-secondary text-xs w-full" onClick={gerarTokenCozinha}>
            <RefreshCw size={12} /> {urlCozinha ? 'Gerar novo link' : 'Gerar link da cozinha'}
          </button>
        </div>

        {/* Link Display Pedidos */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Monitor size={13} style={{ color: '#8b5cf6' }} />
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Display de Pedidos (Painel Cliente)</label>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            TV voltada para os clientes — mostra pedidos em preparo e destaca prontos com nome do cliente, estilo fast-food.
          </p>
          {urlPedidos && (
            <div className="flex gap-2 items-center p-2.5 rounded-xl mb-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlPedidos}</span>
              <button className="btn py-1 px-2.5 text-xs shrink-0" style={{ background: '#8b5cf6', color: '#fff', border: 'none' }} onClick={() => copiarPedidos(urlPedidos)}>
                {copiadoPedidos ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
              <a href={urlPedidos} target="_blank" rel="noreferrer" className="btn btn-secondary py-1 px-2.5 text-xs shrink-0">Abrir</a>
            </div>
          )}
          <button className="btn btn-secondary text-xs w-full" onClick={gerarTokenPedidosDisplay}>
            <RefreshCw size={12} /> {urlPedidos ? 'Gerar novo link' : 'Gerar link do display'}
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações do Display</h2>
        <div className="flex flex-col gap-4">

          {/* Labels das colunas */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Nomes das Colunas</label>
            <div className="flex flex-col gap-2">
              {[
                { key: 'labelNovo',       label: 'Novos',      placeholder: 'Pedidos' },
                { key: 'labelPreparando', label: 'Preparando', placeholder: 'Preparando' },
                { key: 'labelCompleto',   label: 'Completo',   placeholder: 'Completo' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)', width: 72 }}>{label}</span>
                  <input className="input flex-1 text-sm py-1.5" placeholder={placeholder}
                    value={kanbanConfig[key] || ''} onChange={e => atualizarKanbanConfig({ [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          {/* Colunas visíveis na cozinha */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Colunas Visíveis na Cozinha</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'novo',       label: kanbanConfig.labelNovo || 'Pedidos' },
                { id: 'preparando', label: kanbanConfig.labelPreparando || 'Preparando' },
                { id: 'completo',   label: kanbanConfig.labelCompleto || 'Completo' },
              ].map(({ id, label }) => {
                const visivel = (kanbanConfig.colunasVisivelCozinha || ['novo', 'preparando', 'completo']).includes(id)
                return (
                  <button key={id} onClick={() => {
                    const atual = kanbanConfig.colunasVisivelCozinha || ['novo', 'preparando']
                    atualizarKanbanConfig({ colunasVisivelCozinha: visivel ? atual.filter(c => c !== id) : [...atual, id] })
                  }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={visivel
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Alertas de tempo */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Alertas de Tempo (minutos)</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#f59e0b' }}>Amarelo após</label>
                <input type="number" min="1" className="input text-sm" value={kanbanConfig.limiteAmareloMin || 10}
                  onChange={e => atualizarKanbanConfig({ limiteAmareloMin: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: '#ef4444' }}>Vermelho após</label>
                <input type="number" min="1" className="input text-sm" value={kanbanConfig.limiteVermelhoMin || 20}
                  onChange={e => atualizarKanbanConfig({ limiteVermelhoMin: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Auto-refresh */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Auto-refresh (segundos)</label>
            <input type="number" min="5" max="60" className="input text-sm" value={kanbanConfig.autoRefreshSeg || 10}
              onChange={e => atualizarKanbanConfig({ autoRefreshSeg: Number(e.target.value) })} />
          </div>

          {/* Opções de exibição */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Exibir na cozinha</label>
            {[
              { key: 'mostrarGarcom', label: 'Nome do garçom' },
              { key: 'mostrarMesa',   label: 'Número da mesa' },
              { key: 'mostrarObs',    label: 'Observações do pedido' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={kanbanConfig[key] !== false} onChange={e => atualizarKanbanConfig({ [key]: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
            {/* Som de alerta */}
            <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={kanbanConfig.somAlerta !== false} onChange={e => atualizarKanbanConfig({ somAlerta: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Som de alerta (novo pedido)</span>
              </label>
              {kanbanConfig.somAlerta !== false && (
                <div className="flex items-center gap-2" style={{ paddingLeft: 20 }}>
                  <select className="input text-xs py-1.5" style={{ flex: 1 }}
                    value={kanbanConfig.somAlertaTipo || 'duplo'}
                    onChange={e => atualizarKanbanConfig({ somAlertaTipo: e.target.value })}>
                    {SONS_ALERTA.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button className="btn btn-secondary py-1.5 px-3 text-xs shrink-0"
                    onClick={() => tocarSom(kanbanConfig.somAlertaTipo || 'duplo')}
                    title="Ouvir">
                    <Play size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Painel: Display do Caixa/Balcão ────────────────────── */
export function PainelCaixa() {
  const { kanbanConfig, atualizarKanbanConfig, gerarTokenCaixa } = useApp()
  const [copiado, setCopiado] = useState(false)
  const logoRef = useRef(null)

  const base = window.location.origin
  const urlCaixa = kanbanConfig.caixaToken ? `${base}/caixa/${kanbanConfig.caixaToken}` : null

  function copiar(texto) {
    navigator.clipboard.writeText(texto); setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Máx 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => atualizarKanbanConfig({ cozinhaLogo: ev.target.result })
    reader.readAsDataURL(file); e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Link */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Display do Balcão</h2>
        </div>

        {/* Logo compartilhada */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Logo do Restaurante</label>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Compartilhada com o Display da Cozinha</p>
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden shrink-0"
              style={{ width: 64, height: 64, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kanbanConfig.cozinhaLogo
                ? <img src={kanbanConfig.cozinhaLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Camera size={22} style={{ color: 'var(--text-muted)' }} />
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <button className="btn btn-secondary text-xs py-1.5" onClick={() => logoRef.current?.click()}>
                <Camera size={12} /> {kanbanConfig.cozinhaLogo ? 'Alterar logo' : 'Enviar logo'}
              </button>
              {kanbanConfig.cozinhaLogo && (
                <button className="btn btn-ghost text-xs py-1 px-2" style={{ color: '#ef4444' }} onClick={() => atualizarKanbanConfig({ cozinhaLogo: null })}>
                  <X size={11} /> Remover
                </button>
              )}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG — máx 2 MB</span>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Título */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título do Display</label>
          <input className="input" placeholder="Balcão" value={kanbanConfig.caixaTitulo || ''}
            onChange={e => atualizarKanbanConfig({ caixaTitulo: e.target.value })} />
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Link do Balcão</label>
          {urlCaixa && (
            <div className="flex gap-2 items-center p-2.5 rounded-xl mb-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlCaixa}</span>
              <button className="btn btn-primary py-1 px-2.5 text-xs shrink-0" style={{ background: 'var(--accent)' }} onClick={() => copiar(urlCaixa)}>
                {copiado ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
              <a href={urlCaixa} target="_blank" rel="noreferrer" className="btn btn-secondary py-1 px-2.5 text-xs shrink-0">Abrir</a>
            </div>
          )}
          <button className="btn btn-secondary text-xs w-full" onClick={gerarTokenCaixa}>
            <RefreshCw size={12} /> {urlCaixa ? 'Gerar novo link' : 'Gerar link do balcão'}
          </button>
        </div>
      </div>

      {/* Configurações do display */}
      <div className="card p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações do Display</h2>
        <div className="flex flex-col gap-4">

          {/* Colunas visíveis no caixa */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Colunas Visíveis no Balcão</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'novo',       label: kanbanConfig.labelNovo || 'Pedidos' },
                { id: 'preparando', label: kanbanConfig.labelPreparando || 'Preparando' },
                { id: 'completo',   label: kanbanConfig.labelCompleto || 'Completo' },
              ].map(({ id, label }) => {
                const visivel = (kanbanConfig.caixaColunasVisiveis || ['novo', 'preparando', 'completo']).includes(id)
                return (
                  <button key={id} onClick={() => {
                    const atual = kanbanConfig.caixaColunasVisiveis || ['novo', 'preparando', 'completo']
                    atualizarKanbanConfig({ caixaColunasVisiveis: visivel ? atual.filter(c => c !== id) : [...atual, id] })
                  }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={visivel
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opções de exibição do caixa */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Opções do Display</label>
            {[
              { key: 'caixaMostrarPrecos',   label: 'Exibir preços dos itens' },
              { key: 'caixaPodeAvancar',     label: 'Permitir avançar status pelo balcão' },
              { key: 'caixaMesasAtivo',      label: 'Ativar aba Mesas no Display do Balcão' },
              { key: 'pdvAtivo',             label: 'Ativar aba PDV no Display do Balcão' },
              { key: 'caixaImpressaoAtivo',  label: 'Ativar impressão de pedido (cupom fiscal estreito)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={kanbanConfig[key] !== false} onChange={e => atualizarKanbanConfig({ [key]: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

/* ─── Painel: Telão (Display Público) ───────────────────── */
export function PainelTelao() {
  const { kanbanConfig, atualizarKanbanConfig, gerarTokenTelao } = useApp()
  const [copiado, setCopiado] = useState(false)

  const base = window.location.origin
  const urlTelao = kanbanConfig.telaoToken ? `${base}/telao/${kanbanConfig.telaoToken}` : null

  function copiar(texto) {
    navigator.clipboard.writeText(texto); setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tv size={16} style={{ color: '#f59e0b' }} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Telão — Display para Cliente</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Painel público para colocar em um monitor voltado para os clientes — mostra o logo, nome do restaurante e os pedidos em aberto ordenados por chegada (do mais antigo para o mais recente).
        </p>

        {/* Título do telão */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título do Telão</label>
          <input className="input" placeholder="Pedidos" value={kanbanConfig.telaoTitulo || ''}
            onChange={e => atualizarKanbanConfig({ telaoTitulo: e.target.value })} />
        </div>

        {/* Auto-refresh */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Auto-refresh (segundos)</label>
          <input type="number" min="5" max="60" className="input text-sm" value={kanbanConfig.telaoRefreshSeg || 15}
            onChange={e => atualizarKanbanConfig({ telaoRefreshSeg: Number(e.target.value) })} />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Link do Telão</label>
          {urlTelao && (
            <div className="flex gap-2 items-center p-2.5 rounded-xl mb-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlTelao}</span>
              <button className="btn btn-primary py-1 px-2.5 text-xs shrink-0" style={{ background: '#f59e0b' }} onClick={() => copiar(urlTelao)}>
                {copiado ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
              <a href={urlTelao} target="_blank" rel="noreferrer" className="btn btn-secondary py-1 px-2.5 text-xs shrink-0">Abrir</a>
            </div>
          )}
          <button className="btn btn-secondary text-xs w-full" onClick={gerarTokenTelao}>
            <RefreshCw size={12} /> {urlTelao ? 'Gerar novo link' : 'Gerar link do telão'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Página principal ───────────────────────────────── */
export default function Displays() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Displays</h1>
          <p className="page-subtitle">Configure os displays da cozinha, balcão e telão</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>
        <PainelCozinha />
        <PainelCaixa />
        <PainelTelao />
      </div>
    </div>
  )
}
