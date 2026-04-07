import { useEffect, useMemo, useState } from 'react'
import { Users, TrendingUp, DollarSign, ChevronDown, ChevronUp, ShieldCheck, Calendar, Trash2, UserPlus, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'
import { lucroEntrada, receitaEntrada } from '../utils/calculos.js'
import { formatarMoeda, hoje } from '../utils/formatacao.js'

function lerLS(chave, padrao = []) {
  try { return JSON.parse(localStorage.getItem(chave) ?? 'null') ?? padrao }
  catch { return padrao }
}

function calcularStats(userId) {
  const prefixo = `rd_${userId.slice(0, 8)}_`
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
  const { auth, cadastrarUsuario } = useApp()
  const [expandido, setExpandido] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  // Form: novo usuário
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaS, setNovaS] = useState('')
  const [erroU, setErroU] = useState('')
  const [okU, setOkU] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, nome_exibicao, is_admin, created_at')
      .order('created_at', { ascending: true })
    if (!error && data) setUsuarios(data)
    setCarregando(false)
  }

  async function handleCadastrar() {
    setErroU('')
    if (!novoNome.trim()) return setErroU('Informe o nome de usuário.')
    if (!novoEmail.trim()) return setErroU('Informe o e-mail.')
    if (novaS.length < 6) return setErroU('Senha mínima: 6 caracteres.')
    setSalvando(true)
    const res = await cadastrarUsuario(novoEmail.trim(), novaS, novoNome.trim())
    setSalvando(false)
    if (res.erro === 'nome_em_uso') return setErroU('Este nome de usuário já está em uso.')
    if (res.erro === 'email_em_uso') return setErroU('Este e-mail já está cadastrado.')
    if (res.erro) return setErroU(res.erro)
    setNovoNome(''); setNovoEmail(''); setNovaS('')
    setOkU(true); setTimeout(() => setOkU(false), 2500)
    carregarUsuarios()
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
      .filter(u => !u.is_admin)
      .map(u => ({ ...u, stats: calcularStats(u.id) }))
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

      {/* Cards globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Restaurantes" valor={restaurantes.length} cor="var(--accent)" />
        <StatCard label={`Faturamento - ${mesAtual}`} valor={formatarMoeda(totalGlobalFatMes)} cor="#3b82f6" />
        <StatCard label="Faturamento Total" valor={formatarMoeda(totalGlobalFat)} cor="#7c3aed" />
        <StatCard label="Lucro Total Bruto" valor={formatarMoeda(totalGlobalLucro)} cor="#16a34a" />
      </div>

      {/* Lista de restaurantes */}
      {carregando ? (
        <div className="card text-center py-10">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      ) : restaurantes.length === 0 ? (
        <div className="card text-center py-10">
          <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum restaurante cadastrado ainda</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Quando um usuário se cadastrar, aparecerá aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {restaurantes.map((r, idx) => {
            const s = r.stats
            const aberto = expandido === r.id
            const margemMes = s.fatMes > 0 ? (s.lucroMes / s.fatMes * 100) : 0
            const margemTotal = s.fatTotal > 0 ? (s.lucroTotal / s.fatTotal * 100) : 0
            const criadoEm = r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'
            const ultimaVenda = s.ultimaVenda ? s.ultimaVenda.split('-').reverse().join('/') : 'Nenhuma'
            const nomeExibir = r.username || r.nome_exibicao || r.email || '?'

            return (
              <div key={r.id} className="card p-0 overflow-hidden">
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
                      {nomeExibir[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {nomeExibir}
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
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Margem: {margemMes.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={13} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lucro Bruto Total</p>
                        </div>
                        <p className="text-xl font-bold" style={{ color: '#16a34a' }}>{formatarMoeda(s.lucroTotal)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Margem: {margemTotal.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Total de unidades vendidas: <strong style={{ color: 'var(--text-primary)' }}>{s.vendasTotal}</strong></span>
                      <span>Ticket médio: <strong style={{ color: 'var(--text-primary)' }}>{s.totalEntradas > 0 ? formatarMoeda(s.fatTotal / s.totalEntradas) : '-'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Gerenciamento de Usuários */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: 10 }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <Users size={14} style={{ color: '#8b5cf6' }} />
          </div>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gerenciar Usuários</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
            {usuarios.length} conta(s)
          </span>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-2 mb-4">
          {usuarios.map(u => {
            const nome = u.username || u.nome_exibicao || u.email || '?'
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: u.is_admin ? '#8b5cf6' : 'var(--accent)', color: '#fff' }}>
                  {nome[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{nome}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {u.email && <span>{u.email} · </span>}
                    {u.is_admin ? '👑 Administrador' : 'Usuário'}
                    {u.created_at && ` · Criado em ${new Date(u.created_at).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Criar usuário */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Criar nova conta</p>
          <div className="flex gap-3 flex-wrap items-end">
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Usuário</label>
              <input className="input" placeholder="nome de usuário" value={novoNome}
                onChange={e => setNovoNome(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>E-mail</label>
              <input className="input" type="email" placeholder="email@exemplo.com" value={novoEmail}
                onChange={e => setNovoEmail(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Senha inicial</label>
              <input className="input" type="password" placeholder="Mín. 6 caracteres" value={novaS}
                onChange={e => setNovaS(e.target.value)} />
            </div>
            <button className="btn btn-primary shrink-0" onClick={handleCadastrar} disabled={salvando}>
              <UserPlus size={13} /> {salvando ? 'Criando...' : 'Criar conta'}
            </button>
          </div>
          {erroU && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{erroU}</p>}
          {okU && <p className="text-xs mt-2" style={{ color: '#22c55e' }}>Conta criada com sucesso!</p>}
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <KeyRound size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            O usuário pode alterar a senha em Configurações após o primeiro login.
          </p>
        </div>
      </div>
    </div>
  )
}
