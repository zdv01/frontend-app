import { X } from 'lucide-react'

// Panel lateral derecho que muestra el detalle del registro seleccionado en la tabla
export function DetailPanel({ title, onClose, children, actions }) {
  return (
    <aside className="detail-panel panel" aria-label={title}>
      <header className="detail-header">
        <h2 className="section-title">{title}</h2>
        <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Cerrar detalle">
          <X size={18} />
        </button>
      </header>
      <div className="detail-body">{children}</div>
      {actions && <footer className="detail-actions">{actions}</footer>}
    </aside>
  )
}

// Una fila "Etiqueta: valor" dentro del panel
export function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
