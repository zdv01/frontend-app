import { TriangleAlert } from 'lucide-react'
import { Avatar } from '../../../components/Avatar'
import './gd.css'

// Estado de un jugador: Activo (verde) / Inactivo (rojo), como en el mockup
export function ActivoBadge({ active, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

// Avatar con iniciales + nombre y una línea secundaria opcional
export function PersonCell({ name, subtitle, size = 36 }) {
  return (
    <div className="gd-person">
      <Avatar name={name} size={size} />
      <div className="gd-person-text">
        <strong>{name}</strong>
        {subtitle && <span className="text-muted">{subtitle}</span>}
      </div>
    </div>
  )
}

// Aviso naranja de advertencia
export function WarningNote({ children }) {
  return (
    <div className="gd-warning" role="status">
      <TriangleAlert size={20} aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
