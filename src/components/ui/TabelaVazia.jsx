export default function TabelaVazia({ icone: Icone, mensagem, submensagem, acao }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {Icone && <Icone size={36} style={{ color: 'var(--text-muted)' }} />}
      <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{mensagem}</p>
      {submensagem && (
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>{submensagem}</p>
      )}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  )
}
