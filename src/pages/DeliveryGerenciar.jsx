import { useState, useEffect } from 'react'
import { Truck, MapPin, ToggleLeft, ToggleRight, Plus, Trash2, Check, Copy, Link2, Banknote, QrCode, CreditCard, ExternalLink, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function DeliveryGerenciar() {
  const { configuracaoDelivery, atualizarConfiguracaoDelivery, definirSlugDelivery, adicionarBairro, editarBairro, removerBairro } = useApp()
  const cfg = configuracaoDelivery || {}
  const base = window.location.origin

  const [slugInput, setSlugInput] = useState(cfg.slugDelivery || '')
  const [erroSlug, setErroSlug] = useState('')
  const [okSlug, setOkSlug] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const [novoBairroNome, setNovoBairroNome] = useState('')
  const [novoBairroFrete, setNovoBairroFrete] = useState('')

  // IBGE
  const [estados, setEstados] = useState([])
  const [cidades, setCidades] = useState([])
  const [ufSelecionada, setUfSelecionada] = useState(cfg.uf || '')
  const [carregandoCidades, setCarregandoCidades] = useState(false)

  const urlDelivery = cfg.slugDelivery ? `${base}/delivery/${cfg.slugDelivery}` : null

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r => r.json())
      .then(data => setEstados(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!ufSelecionada) { setCidades([]); return }
    setCarregandoCidades(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSelecionada}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(data => { setCidades(data); setCarregandoCidades(false) })
      .catch(() => setCarregandoCidades(false))
  }, [ufSelecionada])

  function handleUfChange(uf) {
    setUfSelecionada(uf)
    atualizarConfiguracaoDelivery({ uf, cidade: '' })
  }

  function handleCidadeChange(cidade) {
    atualizarConfiguracaoDelivery({ cidade })
  }

  function salvarSlug() {
    const res = definirSlugDelivery(slugInput)
    if (res.erro) { setErroSlug(res.erro); return }
    setOkSlug(true); setTimeout(() => setOkSlug(false), 2500)
  }

  function copiar(texto) {
    navigator.clipboard.writeText(texto)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  function handleAdicionarBairro() {
    if (!novoBairroNome.trim()) return
    adicionarBairro({ nome: novoBairroNome.trim(), frete: Number(novoBairroFrete) || 0 })
    setNovoBairroNome(''); setNovoBairroFrete('')
  }

  const pgtoOpcoes = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={13} /> },
    { id: 'pix',      label: 'PIX',      icon: <QrCode size={13} /> },
    { id: 'cartao',   label: 'Cartão',   icon: <CreditCard size={13} /> },
  ]

  function togglePgto(id) {
    const atual = cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']
    const novo = atual.includes(id) ? atual.filter(f => f !== id) : [...atual, id]
    atualizarConfiguracaoDelivery({ formasPagamento: novo })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Delivery</h1>
            <p className="page-subtitle">Configurações do cardápio de delivery</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* Ativar delivery */}
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Delivery ativo</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ativa o link público para pedidos</p>
          </div>
          <button onClick={() => atualizarConfiguracaoDelivery({ ativo: !cfg.ativo })}
            style={{ color: cfg.ativo ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {cfg.ativo ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
          </button>
        </div>

        {/* Link */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={15} style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Link do Cardápio Delivery</h2>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Endereço personalizado</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <span style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {base}/delivery/
              </span>
              <input className="input" style={{ flex: 1, border: 'none', borderRadius: 0, background: 'transparent', fontSize: 13, fontFamily: 'monospace' }}
                placeholder="meurestaurante"
                value={slugInput}
                onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setErroSlug('') }}
                onKeyDown={e => e.key === 'Enter' && salvarSlug()} />
              <button className="btn btn-primary" style={{ borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, fontSize: 12, padding: '8px 14px', flexShrink: 0 }} onClick={salvarSlug}>
                Salvar
              </button>
            </div>
            {erroSlug && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{erroSlug}</p>}
            {okSlug && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>✓ Link salvo!</p>}
          </div>

          {urlDelivery ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center p-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--text-secondary)' }}>{urlDelivery}</span>
                <button className="btn btn-primary py-1.5 px-3 text-xs shrink-0" onClick={() => copiar(urlDelivery)}>
                  {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                </button>
              </div>
              <a href={urlDelivery} target="_blank" rel="noreferrer" className="btn btn-secondary text-xs w-fit">
                <ExternalLink size={12} /> Abrir delivery
              </a>
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#d97706' }}>
              ⚠ Defina um endereço acima para ativar o link.
            </div>
          )}
        </div>

        {/* Configurações gerais */}
        <div className="card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Configurações gerais</h2>
          <div className="flex flex-col gap-3">

            {/* Estado + Cidade via IBGE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Estado</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={ufSelecionada}
                    onChange={e => handleUfChange(e.target.value)}
                    className="input"
                    style={{ paddingRight: 28, appearance: 'none' }}
                  >
                    <option value="">Selecione...</option>
                    {estados.map(e => (
                      <option key={e.id} value={e.sigla}>{e.sigla} — {e.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Cidade</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={cfg.cidade || ''}
                    onChange={e => handleCidadeChange(e.target.value)}
                    className="input"
                    style={{ paddingRight: 28, appearance: 'none' }}
                    disabled={!ufSelecionada || carregandoCidades}
                  >
                    <option value="">{carregandoCidades ? 'Carregando...' : ufSelecionada ? 'Selecione...' : 'Escolha o estado'}</option>
                    {cidades.map(c => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Pedido mínimo (R$)</label>
                <input className="input" type="number" min="0" placeholder="0,00" value={cfg.pedidoMinimo || ''}
                  onChange={e => atualizarConfiguracaoDelivery({ pedidoMinimo: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Tempo estimado</label>
                <input className="input" placeholder="30-45 min" value={cfg.tempoEstimado || ''}
                  onChange={e => atualizarConfiguracaoDelivery({ tempoEstimado: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Telefone/WhatsApp (com DDD)</label>
              <input className="input" placeholder="11999999999" value={cfg.telefone || ''}
                onChange={e => atualizarConfiguracaoDelivery({ telefone: e.target.value.replace(/\D/g, '') })} />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Mensagem de introdução (WhatsApp)</label>
              <input className="input" placeholder="Olá! Gostaria de fazer um pedido:" value={cfg.mensagemIntro || ''}
                onChange={e => atualizarConfiguracaoDelivery({ mensagemIntro: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Formas de pagamento */}
        <div className="card p-5">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Formas de pagamento aceitas</h2>
          <div className="flex gap-3 flex-wrap">
            {pgtoOpcoes.map(op => {
              const ativo = (cfg.formasPagamento || ['dinheiro', 'pix', 'cartao']).includes(op.id)
              return (
                <button key={op.id} onClick={() => togglePgto(op.id)} style={{
                  flex: 1, minWidth: 90, padding: '9px 10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                  background: ativo ? 'var(--accent-bg)' : 'transparent',
                  color: ativo ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {op.icon}{op.label}
                  {ativo && <Check size={12} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bairros */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} style={{ color: 'var(--accent)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Bairros de entrega</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              {(cfg.bairros || []).filter(b => b.ativo).length} ativos
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {(cfg.bairros || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Nenhum bairro cadastrado.</p>
            ) : (
              (cfg.bairros || []).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <button onClick={() => editarBairro(b.id, { ativo: !b.ativo })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.ativo ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                    {b.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <span className="flex-1 text-sm font-medium" style={{ color: b.ativo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.nome}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                    <input type="number" min="0" value={b.frete}
                      onChange={e => editarBairro(b.id, { frete: Number(e.target.value) })}
                      style={{ width: 64, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                  </div>
                  <button onClick={() => removerBairro(b.id)} className="btn btn-ghost p-1" style={{ color: '#ef4444', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Adicionar bairro</p>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Nome do bairro" value={novoBairroNome}
                onChange={e => setNovoBairroNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdicionarBairro()} />
              <div className="flex items-center gap-1" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px', background: 'var(--bg-card)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>R$</span>
                <input type="number" min="0" placeholder="0" value={novoBairroFrete}
                  onChange={e => setNovoBairroFrete(e.target.value)}
                  style={{ width: 60, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, outline: 'none', padding: '6px 0' }} />
              </div>
              <button className="btn btn-primary shrink-0" onClick={handleAdicionarBairro}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Frete 0 = entrega grátis nesse bairro.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
