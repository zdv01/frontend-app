import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

// Mensaje fijo dentro de la pantalla (a diferencia del toast, no desaparece solo)
export function Alert({ type = 'info', children, onClose }) {
  const Icon = ICONS[type]
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={20} className="alert-icon" aria-hidden="true" />
      <div className="alert-content">{children}</div>
      {onClose && (
        <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Cerrar mensaje">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
