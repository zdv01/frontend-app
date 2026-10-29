import { X } from 'lucide-react'
import { useEffect, useId } from 'react'

/*
 * Ventana emergente. Se cierra con la X, con Escape o haciendo clic fuera.
 * El contenido (formulario y botones) va en children; para los botones
 * de abajo usa <div className="modal-footer">.
 */
export function Modal({ title, onClose, children, size = 'md' }) {
  const titleId = useId()

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
