import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { hoje } from '../../utils/formatacao.js'

function inicioSemana() {
  const d = new Date()
  const dia = d.getDay()
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1))
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const diaMes = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${diaMes}`
}

function inicioMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatarLabel(ini, fim) {
  if (!ini) return 'Período'
  const fmt = str => {
    const [, m, d] = str.split('-')
    return `${d}/${m}`
  }
  return ini === fim ? fmt(ini) : `${fmt(ini)} → ${fmt(fim)}`
}

const DIAS_SEM = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Calendario({ ini, fim, onSelect }) {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth())
  const [hover, setHover] = useState(null)
  // fase: 'inicio' = aguardando 1º clique, 'fim' = aguardando 2º clique
  const [fase, setFase] = useState('inicio')

  function navMes(delta) {
    let nm = mes + delta, na = ano
    if (nm < 0) { nm = 11; na-- }
    if (nm > 11) { nm = 0; na++ }
    setMes(nm); setAno(na)
  }

  function clicarDia(str) {
    if (fase === 'inicio') {
      onSelect(str, str, false) // terceiro arg = fechado?
      setFase('fim')
    } else {
      const [a, b] = str < ini ? [str, ini] : [ini, str]
      onSelect(a, b, true) // fecha popup
      setFase('inicio')
      setHover(null)
    }
  }

  // Calcula células
  const primeiroDia = new Date(ano, mes, 1)
  const pad = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= diasNoMes; d++) {
    cells.push(`${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  const h = hoje()
  const hoverFim = fase === 'fim' && hover ? hover : fim

  return (
    <div style={{ padding: '14px 16px', userSelect: 'none' }}>
      {/* Cabeçalho mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => navMes(-1)} style={btnNavStyle}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{MESES[mes]} {ano}</span>
        <button onClick={() => navMes(1)} style={btnNavStyle}><ChevronRight size={15} /></button>
      </div>

      {/* Dias da semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: 2, marginBottom: 4 }}>
        {DIAS_SEM.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Dias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: 2 }}>
        {cells.map((str, idx) => {
          if (!str) return <div key={`p${idx}`} style={{ height: 30 }} />

          const isIni = str === ini
          const isFim2 = str === hoverFim && str !== ini
          const selected = isIni || isFim2
          const inRange = (() => {
            if (!ini || !hoverFim) return false
            const [a, b] = ini <= hoverFim ? [ini, hoverFim] : [hoverFim, ini]
            return str > a && str < b
          })()
          const isHoje = str === h

          return (
            <button
              key={str}
              onClick={() => clicarDia(str)}
              onMouseEnter={() => fase === 'fim' && setHover(str)}
              onMouseLeave={() => fase === 'fim' && setHover(null)}
              style={{
                height: 30, width: 32,
                border: isHoje && !selected ? '1.5px solid var(--accent)' : 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: selected ? 700 : 400,
                background: selected ? 'var(--accent)' : inRange ? 'var(--accent-bg)' : 'transparent',
                color: selected ? '#fff' : isHoje ? 'var(--accent)' : 'var(--text-primary)',
                transition: 'background .1s',
              }}
            >
              {Number(str.split('-')[2])}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
        {fase === 'fim'
          ? 'Clique para definir o final do período'
          : 'Clique em um dia — ou dois para um intervalo'}
      </p>
    </div>
  )
}

const btnNavStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 4, borderRadius: 6, color: 'var(--text-secondary)',
  display: 'flex', alignItems: 'center',
}

const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'custom', label: 'Período' },
]

export default function FiltroPeriodo({ onChange, defaultPeriodo = 'hoje' }) {
  const [periodo, setPeriodo] = useState(defaultPeriodo)
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dataFim, setDataFim] = useState(hoje())
  const [aberto, setAberto] = useState(false)
  const wrapperRef = useRef(null)

  // Fecha ao clicar fora
  useEffect(() => {
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    const h = hoje()
    if (periodo === 'hoje')   notify(h, h)
    if (periodo === 'semana') notify(inicioSemana(), h)
    if (periodo === 'mes')    notify(inicioMes(), h)
  }, [periodo])

  function notify(ini, fim) {
    setDataInicio(ini); setDataFim(fim)
    onChange?.({ dataInicio: ini, dataFim: fim })
  }

  function handleBotao(id) {
    setPeriodo(id)
    if (id === 'custom') {
      setAberto(v => !v)
    } else {
      setAberto(false)
    }
  }

  function handleCalendario(ini, fim, fechar) {
    notify(ini, fim)
    if (fechar) setAberto(false)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Botões de período */}
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg-hover)', padding: 3, borderRadius: 10 }}>
        {PERIODOS.map(p => {
          const isAtivo = periodo === p.id
          const label = (p.id === 'custom' && isAtivo) ? formatarLabel(dataInicio, dataFim) : p.label
          return (
            <button key={p.id} onClick={() => handleBotao(p.id)}
              style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all .15s', whiteSpace: 'nowrap',
                background: isAtivo ? 'var(--accent)' : 'transparent',
                color: isAtivo ? '#fff' : 'var(--text-secondary)',
              }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Popup calendário */}
      {aberto && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 6,
          zIndex: 1000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          minWidth: 260,
        }}>
          <Calendario ini={dataInicio} fim={dataFim} onSelect={handleCalendario} />
        </div>
      )}
    </div>
  )
}
