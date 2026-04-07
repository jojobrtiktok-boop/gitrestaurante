import { useMemo, useState } from 'react'
import { Users, TrendingUp, DollarSign, ChevronDown, ChevronUp, ShieldCheck, Calendar, Trash2, UserPlus, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { lucroEntrada, receitaEntrada } from '../utils/calculos.js'
import { formatarMoeda, hoje } from '../utils/formatacao.js'

function lerLS(chave, padrao = []) {
  try { return JSON.parse(localStorage.getItem(chave) ?? 'null') ?? padrao }
  catch { return padrao }
}

function calcularStats(usuario) {
  const prefixo = `rd_${usuario}_`
  const entradas = lerLS(prefixo + 'entradas_vendas', [])
  const pedidos = lerLS(prefixo + 'pedidos', [])
  const pratos = lerLS(prefixo + 'pratos', [])
  const ingredientes = lerLS(prefixo + 'ingredientes', [])

  const mesAtual = hoje().slice(0, 7)

  let fatTotal = 0, fatMes = 0, lucroTotal = 0, lucroMes = 0, vendasTotal = 0, vendasMes = 0

  for (const e of entradas) {
    const prato = pratos.find(p => p.id === e.pratoId)
    if (!prato) continue
    const receita = receitaEntrada(e, prato)
    const lucro = lucroEntrada(e, prato, ingredientes, pedidos)
    fatTotal += receita
    lucroTotal += lucro
    vendasTotal += e.quantidade
    if (e.data?.startsWith(mesAtual)) {
      fatMes += receita
      lucroMes += lucro
      vendasMes += e.quantidade
    }
  }

  const ultimaVenda = entradas.length > 0
    ? entradas.reduce((max, e) => e.data > max ? e.data : max, '')
    : null

  return { fatTotal, fatMes, lucroTotal, lucroMes, vendasTotal, vendasMes, ultimaVenda, totalEntradas: entradas.length }
}

function StatCard({ label, valor, cor = '#3b82f6', sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: cor }}>{valor}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminPanel() {
  const { auth, usuarios, cadastrarUsuario, removerUsuario } = useApp()
  const [expandido, setExpandido] = useState(null)

  // Form: novo usuário
  const [novoU, setNovoU] = useState('')
  const [novaS, setNovaS] = useState('')
  const [erroU, setErroU] = useState('')
  const [okU, setOkU] = useState(false)

  function handleCadastrar() {
    setErroU('')
    if (!novoU.trim()) return setErroU('Informe o usuário.')
    if (novaS.length < 4) return setErroU('Senha mínima: 4 caracteres.')
    const res = cadastrarUsuario(novoU.trim(), novaS)
    if (res.erro) return setErroU(res.erro)
    setNovoU(''); setNovaS('')
    setOkU(true); setTimeout(() => setOkU(false), 2500)
  }

  if (!auth.isAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck size={40} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Acesso restrito</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Apenas o administrador pode acessar esta página.</p>
      </div>
    )
  }

  const restaurantes = useMemo(() => {
    return usuarios
      .filter(u => !u.isAdmin)
      .map(u => ({ ...u, stats: calcularStats(u.usuario) }))
      .sort((a, b) => b.stats.fatTotal - a.stats.fatTotal)
  }, [usuarios])

  const totalGlobalFat = restaurantes.reduce((s, r) => s + r.stats.fatTotal, 0)
  const totalGlobalFatMes = restaurantes.reduce((s, r) => s + r.stats.fatMes, 0)
  const totalGlobalLucro = restaurantes.reduce((s, r) => s + r.stats.lucroTotal, 0)

  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">Painel Admin</h1>
            <p className="page-subtitle">Visão geral de todos os restaurantes cadastrados</p>
          </div>
        </div>
      </div>

      {/* Limpar dados do admin */}
      <div className="card p-4 mb-5 flex items-center justify-between gap-4" style={{ borderStyle: 'dashed' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Seus dados ({auth.usuario})</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Apaga todos os pedidos, vendas e registros de venda do seu usuário</p>
        </div>
        <button
          className="btn text-xs flex items-center gap-2 shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          onClick={() => {
            if (!window.confirm(`Limpar TODOS os pedidos e vendas de "${auth.usuario}"? Esta ação não pode ser desfeita.`)) return
            const p = `rd_${auth.usuario}_`
            ;['pedidos', 'entradas_vendas', 'registros_vendas'].forEach(k => localStorage.setItem(p + k, '[]'))
            window.location.reload()
          }}
        >
          <Trash2 size={13} />
          Limpar pedidos e vendas
        </button>
      </div>

      {/* Cards globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Restaurantes" valor={restaurantes.length} cor="var(--accent)" />
        <StatCard label={`Faturamento - ${mesAtual}`} valor={formatarMoeda(totalGlobalFatMes)} cor="#3b82f6" />
        <StatCard label="Faturamento Total" valor={formatarMoeda(totalGlobalFat)} cor="#7c3aed" />
        <StatCard label="Lucro Total Bruto" valor={formatarMoeda(totalGlobalLucro)} cor="#16a34a" />
      </div>

      {/* Lista de restaurantes */}
      {restaurantes.length === 0 ? (
        <div className="card text-center py-10">
          <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum restaurante cadastrado ainda</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Quando um usuário se cadastrar, aparecerá aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {restaurantes.map((r, idx) => {
            const s = r.stats
            const aberto = expandido === r.id
            const margemMes = s.fatMes > 0 ? (s.lucroMes / s.fatMes * 100) : 0
            const margemTotal = s.fatTotal > 0 ? (s.lucroTotal / s.fatTotal * 100) : 0
            const criadoEm = r.criadoEm ? new Date(r.criadoEm).toLocaleDateString('pt-BR') : '-'
            const ultimaVenda = s.ultimaVenda ? s.ultimaVenda.split('-').reverse().join('/') : 'Nenhuma'

            return (
              <div key={r.id} className="card p-0 overflow-hidden">
                {/* Header do card - clicável */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{
                    background: aberto ? 'var(--accent-bg)' : 'var(--bg-hover)',
                    borderBottom: aberto ? '1px solid var(--border-active)' : '1px solid transparent',
                    cursor: 'pointer', border: 'none',
                  }}
                  onClick={() => setExpandido(aberto ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'var(--accent)', color: '#fff' }}>
                      {(r.usuario || '?')[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {r.usuario}
                        {idx === 0 && s.fatTotal > 0 && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04' }}>
                            🏆 Maior faturamento
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Cadastrado em {criadoEm} · Última venda: {ultimaVenda}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mês</p>
                      <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>{formatarMoeda(s.fatMes)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
                      <p className="font-bold text-sm" style={{ color: '#7c3aed' }}>{formatarMoeda(s.fatTotal)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lucro</p>
                      <p className="font-bold text-sm" style={{ color: '#16a34a' }}>{formatarMoeda(s.lucroTotal)}</p>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </button>

                {/* Detalhe expandido */}
                {aberto && (
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Faturamento Mês</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{formatarMoeda(s.fatMes)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.vendasMes} unid. vendidas</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign size={13} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Faturamento Total</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: '#7c3aed' }}>{formatarMoeda(s.fatTotal)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.totalEntradas} lançamentos</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={13} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lucro Bruto Mês</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: '#16a34a' }}>{formatarMoeda(s.lucroMes)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Margem: {margemMes.toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={13} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lucro Bruto Total</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: '#16a34a' }}>{formatarMoeda(s.lucroTotal)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Margem: {margemTotal.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Total de unidades vendidas: <strong style={{ color: 'var(--text-primary)' }}>{s.vendasTotal}</strong></span>
                      <span>Ticket médio: <strong style={{ color: 'var(--text-primary)' }}>{s.totalEntradas > 0 ? formatarMoeda(s.fatTotal / s.totalEntradas) : '-'}</strong></span>
                    </div>

                    <div className="mt-4 pt-4" style={{ borderTop: '1px dashed var(--border)' }}>
                      <button
                        className="btn text-xs flex items-center gap-2"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                        onClick={() => {
                          if (!window.confirm(`Limpar TODOS os pedidos e vendas de "${r.usuario}"? Esta ação não pode ser desfeita.`)) return
                          const p = `rd_${r.usuario}_`
                          ;['pedidos', 'entradas_vendas', 'registros_vendas'].forEach(k => localStorage.setItem(p + k, '[]'))
                          window.location.reload()
                        }}
                      >
                        <Trash2 size={13} />
                        Limpar pedidos e vendas de teste
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/*  Gerenciamento de Usuários  */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: 10 }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <Users size={14} style={{ color: '#8b5cf6' }} />
          </div>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gerenciar Usuários</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
            {usuarios.filter(u => !u.isAdmin).length} conta(s)
          </span>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-2 mb-4">
          {usuarios.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: u.isAdmin ? '#8b5cf6' : 'var(--accent)', color: '#fff' }}>
                {(u.usuario || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{u.usuario}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {u.isAdmin ? '👑 Administrador' : 'Usuário'}
                  {u.criadoEm && ` · Criado em ${new Date(u.criadoEm).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              {!u.isAdmin && (
                <button
                  className="btn btn-ghost shrink-0" style={{ color: '#ef4444', padding: '5px 8px' }}
                  title="Excluir conta"
                  onClick={() => {
                    if (!window.confirm(`Excluir a conta "${u.usuario}"? Esta ação não pode ser desfeita.`)) return
                    removerUsuario(u.id)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Criar usuário */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Criar nova conta</p>
          <div className="flex gap-3 flex-wrap items-end">
            <div style={{ flex: 1, minWidth: 130 }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Usuário</label>
              <input className="input" placeholder="nome do usuário" value={novoU}
                onChange={e => setNovoU(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCadastrar()} />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Senha inicial</label>
              <input className="input" type="password" placeholder="Mín. 4 caracteres" value={novaS}
                onChange={e => setNovaS(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCadastrar()} />
            </div>
            <button className="btn btn-primary shrink-0" onClick={handleCadastrar}>
              <UserPlus size={13} /> Criar conta
            </button>
          </div>
          {erroU && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{erroU}</p>}
          {okU  && <p className="text-xs mt-2" style={{ color: '#22c55e' }}> Conta criada com sucesso!</p>}
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <KeyRound size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Contas criadas aqui aparecem apenas no login padrão (não no admin). O usuário poderá alterar a senha em Configurações.
          </p>
        </div>
      </div>
    </div>
  )
}
