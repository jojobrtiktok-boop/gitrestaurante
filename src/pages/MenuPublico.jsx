import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, UtensilsCrossed, Star, X, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

function FotoPlaceholder() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.06)' }}>
      <UtensilsCrossed size={22} style={{ opacity: 0.25 }} />
    </div>
  )
}

export default function MenuPublico() {
  const { slug } = useParams()
  const [pratos, setPratos] = useState([])
  const [config, setConfig] = useState({})
  const [userId, setUserId] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!slug) { setCarregando(false); return }
    async function carregar() {
      const { data: slugRow } = await supabase
        .from('menu_slugs')
        .select('user_id')
        .eq('slug', slug.toLowerCase())
        .maybeSingle()
      if (!slugRow) { setCarregando(false); return }
      setUserId(slugRow.user_id)
      const [{ data: prtsData }, { data: cfgData }] = await Promise.all([
        supabase.from('pratos').select('*').eq('user_id', slugRow.user_id),
        supabase.from('cardapio_config').select('config').eq('user_id', slugRow.user_id).maybeSingle(),
      ])
      if (prtsData) setPratos(prtsData.map(row => ({
        id: row.id,
        nome: row.nome,
        precoVenda: Number(row.preco_venda || 0),
        categoria: row.categoria || '',
        emDestaque: row.em_destaque || false,
        maisPedido: row.mais_pedido || false,
        foto: row.foto || null,
        ingredientes: row.ingredientes || [],
        grupos: row.grupos || [],
        variacoes: row.variacoes || [],
      })))
      if (cfgData?.config) setConfig(cfgData.config)
      setCarregando(false)
    }
    carregar()
  }, [slug])

  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [pratoDetalhe, setPratoDetalhe] = useState(null)
  const layoutGrade = config.layoutPadrao === 'grade'

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 16 }}>Carregando...</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#f1f5f9', gap: 16, padding: 24,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <UtensilsCrossed size={48} color="#475569" />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Cardapio nao encontrado</h1>
        <p style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', maxWidth: 360, margin: 0 }}>
          O endereco <strong style={{ color: '#f1f5f9' }}>/menu/{slug}</strong> nao esta associado a nenhum estabelecimento.
        </p>
      </div>
    )
  }

  const destaque = config.corDestaque || '#16a34a'
  const corEstrela = config.corEstrela || destaque
  const corPreco = config.corPreco || destaque
  const corHeader = config.corFundo || destaque
  const modoClaro = config.modoClaro !== false
  const fundo = modoClaro ? '#ffffff' : '#0f172a'
  const cardBg = modoClaro ? '#ffffff' : '#1e293b'
  const corTextoBase = modoClaro ? '#111827' : '#ffffff'
  const corTextoSec = modoClaro ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
  const bordaCard = modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.08)'

  const todasCats = [...new Set(pratos.map(p => p.categoria).filter(Boolean))]
  const ordemSalva = config.ordemCategorias || []
  const catsOrdenadas = [
    ...ordemSalva.filter(c => todasCats.includes(c)),
    ...todasCats.filter(c => !ordemSalva.includes(c)),
  ]
  const categorias = ['Todas', ...catsOrdenadas]

  const pratosFiltrados = pratos
    .filter(p => filtro === 'Todas' || p.categoria === filtro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const pratosPorCategoria = filtro === 'Todas'
    ? catsOrdenadas.map(cat => ({ cat, itens: pratosFiltrados.filter(p => p.categoria === cat) })).filter(g => g.itens.length > 0)
    : [{ cat: filtro, itens: pratosFiltrados }]

  const bannerH = config.bannerAltura || 200
  const overlapH = 56

  return (
    <div style={{ minHeight: '100vh', background: fundo, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Banner + Restaurant Card */}
      <div style={{ position: 'relative', marginBottom: 0 }}>
        {config.banner
          ? <div style={{ height: bannerH, overflow: 'hidden' }}>
              <img src={config.banner} alt="banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: config.bannerPos || '50% 50%', display: 'block' }} />
            </div>
          : <div style={{ height: bannerH, background: corHeader }} />
        }

        <div style={{
          background: fundo, borderRadius: '24px 24px 0 0', marginTop: -overlapH,
          position: 'relative', zIndex: 2, paddingTop: 54, paddingBottom: 20,
          textAlign: 'center', boxShadow: modoClaro ? '0 -4px 20px rgba(0,0,0,0.08)' : '0 -4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            position: 'absolute', top: -(overlapH / 2 + 20), left: '50%', transform: 'translateX(-50%)',
            width: 90, height: 90, borderRadius: '50%', border: '4px solid ' + fundo,
            overflow: 'hidden', background: config.logo ? 'transparent' : destaque,
            boxShadow: '0 4px 18px rgba(0,0,0,0.22)', zIndex: 3,
          }}>
            {config.logo
              ? <img src={config.logo} alt={config.nomeRestaurante} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UtensilsCrossed size={28} color="#fff" />
                </div>
            }
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: corTextoBase, margin: '0 0 4px', letterSpacing: '-0.4px', padding: '0 24px' }}>
            {config.nomeRestaurante || 'Cardapio'}
          </h1>
          {config.descricao && (
            <p style={{ fontSize: 13, color: corTextoSec, margin: '0 0 10px', padding: '0 24px' }}>{config.descricao}</p>
          )}
          {config.estrelasAtivas && (config.estrelaValor || config.estrelaQtd) && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: modoClaro ? '#f6f6f6' : 'rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '5px 14px',
            }}>
              <Star size={14} fill={corEstrela} color={corEstrela} />
              {config.estrelaValor && <span style={{ fontSize: 13, fontWeight: 700, color: corTextoBase }}>{Number(config.estrelaValor).toFixed(1)}</span>}
              {config.estrelaQtd && <span style={{ fontSize: 12, color: corTextoSec }}>({config.estrelaQtd} {config.estrelaQtd === 1 ? 'avaliacao' : 'avaliacoes'})</span>}
            </div>
          )}
        </div>
      </div>

      {/* Sticky search + categories */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: fundo, borderBottom: '1px solid ' + bordaCard }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '10px 14px 0' }}>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: corTextoSec }} />
            <input placeholder="O que voce quer comer hoje?" value={busca} onChange={e => setBusca(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
                background: modoClaro ? '#f4f4f4' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12,
                fontSize: 13, color: corTextoBase, outline: 'none',
              }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {categorias.map(cat => (
                <button key={cat} onClick={() => setFiltro(cat)} style={{
                  flexShrink: 0, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: filtro === cat ? 700 : 500,
                  color: filtro === cat ? destaque : corTextoSec,
                  borderBottom: filtro === cat ? '2px solid ' + destaque : '2px solid transparent',
                  transition: 'all .15s', whiteSpace: 'nowrap',
                }}>{cat}</button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 40px' }}>
        {pratos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 16px', color: corTextoSec }}>
            <UtensilsCrossed size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 15 }}>Nenhum item no cardapio</p>
          </div>
        ) : pratosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: corTextoSec }}>
            <p style={{ fontSize: 15 }}>Nenhum item encontrado</p>
          </div>
        ) : (
          pratosPorCategoria.map(({ cat, itens }) => (
            <div key={cat}>
              <div style={{ padding: '20px 16px 10px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: corTextoBase, margin: 0 }}>{cat}</h2>
              </div>
              {layoutGrade ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 12px' }}>
                  {itens.map(prato => (
                    <div key={prato.id} onClick={() => setPratoDetalhe(prato)} style={{ borderRadius: 12, overflow: 'hidden', background: cardBg, border: '1px solid ' + bordaCard, cursor: 'pointer' }}>
                      <div style={{ width: '100%', aspectRatio: '1', background: modoClaro ? '#f0f0f0' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        {prato.foto
                          ? <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <FotoPlaceholder />}
                      </div>
                      <div style={{ padding: '6px 8px 9px' }}>
                        <p style={{
                          fontWeight: 600, fontSize: 11, color: corTextoBase, margin: '0 0 3px', lineHeight: 1.35,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{prato.nome}</p>
                        {config.mostrarPrecos && (
                          <p style={{ fontWeight: 800, fontSize: 12, color: corPreco, margin: 0 }}>
                            {prato.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                itens.map(prato => (
                  <div key={prato.id} onClick={() => setPratoDetalhe(prato)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: '1px solid ' + bordaCard, gap: 12, cursor: 'pointer',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: corTextoBase, margin: '0 0 3px', lineHeight: 1.3 }}>{prato.nome}</p>
                      {prato.descricao && (
                        <p style={{
                          fontSize: 12, color: corTextoSec, margin: '0 0 6px', lineHeight: 1.45,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{prato.descricao}</p>
                      )}
                      {config.mostrarPrecos && (
                        <p style={{ fontWeight: 800, fontSize: 14, color: corPreco, margin: 0 }}>
                          {prato.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                    </div>
                    {prato.foto && (
                      <div style={{ width: 88, height: 88, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={prato.foto} alt={prato.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal detalhe do prato */}
      {pratoDetalhe && (() => {
        const p = pratoDetalhe
        const gruposComplemento = (p.grupos || []).filter(g => g.categoria !== 'adicional')
        const gruposAdicional = (p.grupos || []).filter(g => g.categoria === 'adicional')
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: fundo, overflowY: 'auto',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            WebkitOverflowScrolling: 'touch',
          }}>
            {/* Foto */}
            {p.foto ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                <img src={p.foto} alt={p.nome}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => setPratoDetalhe(null)} style={{
                  position: 'absolute', top: 14, left: 14, width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ChevronLeft size={22} color="#fff" />
                </button>
              </div>
            ) : (
              <div style={{ padding: '14px 16px 0' }}>
                <button onClick={() => setPratoDetalhe(null)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600,
                  color: destaque, padding: 0,
                }}>
                  <ChevronLeft size={20} /> Voltar
                </button>
              </div>
            )}

              {/* Conteúdo */}
              <div style={{ padding: '16px 20px 32px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: corTextoBase, margin: '0 0 6px', lineHeight: 1.25 }}>{p.nome}</h2>
                {config.mostrarPrecos && (
                  <p style={{ fontSize: 16, fontWeight: 700, color: corPreco, margin: '0 0 10px' }}>
                    {p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
                {p.descricao && (
                  <p style={{ fontSize: 14, color: corTextoSec, margin: '0 0 20px', lineHeight: 1.6 }}>{p.descricao}</p>
                )}

                {/* Complementos */}
                {gruposComplemento.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    {gruposComplemento.map(grupo => (
                      <div key={grupo.id} style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{grupo.nome}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {grupo.itens.map(item => (
                            <div key={item.id} style={{
                              padding: '8px 12px', borderRadius: 10,
                              background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)',
                              border: '1px solid ' + bordaCard,
                              fontSize: 14, color: corTextoBase,
                            }}>{item.nome}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionais */}
                {gruposAdicional.length > 0 && (
                  <div>
                    {gruposAdicional.map(grupo => (
                      <div key={grupo.id} style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: corTextoBase, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{grupo.nome}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {grupo.itens.map(item => (
                            <div key={item.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', borderRadius: 10,
                              background: modoClaro ? '#f8f8f8' : 'rgba(255,255,255,0.06)',
                              border: '1px solid ' + bordaCard,
                            }}>
                              <span style={{ fontSize: 14, color: corTextoBase }}>{item.nome}</span>
                              {item.precoExtra > 0 && (
                                <span style={{ fontSize: 13, fontWeight: 700, color: corPreco }}>
                                  +{item.precoExtra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        )
      })()}
    </div>
  )
}
