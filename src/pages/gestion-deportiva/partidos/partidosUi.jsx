import { ESTADOS } from './partidosUtils'
import '../jugadores/gd.css'

export function EstadoPartidoBadge({ estado }) {
  const info = ESTADOS[estado]
  return (
    <span className={`badge ${info?.badge ?? ''}`}>
      <span className="badge-dot" aria-hidden="true" />
      {info?.label ?? estado}
    </span>
  )
}

// "Local vs Visitante" en una sola celda
export function Enfrentamiento({ partido }) {
  return (
    <span className="gd-versus">
      <strong>{partido.equipoLocal.nombre}</strong>
      <span className="vs">vs</span>
      <strong>{partido.equipoVisitante.nombre}</strong>
    </span>
  )
}
