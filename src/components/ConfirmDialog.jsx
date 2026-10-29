import { TriangleAlert } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

// Pregunta "¿Estás seguro?" antes de una acción delicada (eliminar, retirar, desactivar)
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onCancel} size="sm">
      <div className="modal-body confirm-body">
        {danger && <TriangleAlert size={28} className="confirm-icon" aria-hidden="true" />}
        <div>{message}</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <Spinner size={16} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
