import Modal from './Modal.jsx'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ aberto, onFechar, onConfirmar, titulo, mensagem, textoBotao = 'Excluir' }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} largura="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{mensagem}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => { onConfirmar(); onFechar() }}>
            {textoBotao}
          </button>
        </div>
      </div>
    </Modal>
  )
}
