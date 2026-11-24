import { CalendarClock, Target } from 'lucide-react'
import { formatDateTime, getInitials } from '../../../utils/format'

const RONDA_LABELS = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos',
  CUARTOS: 'Cuartos',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
  TERCER_PUESTO: 'Tercer puesto',
}

const ESTADO_META = {
  FINALIZADO: { label: 'Finalizado', className: 'estado-finalizado' },
  EN_JUEGO: { label: 'En juego', className: 'estado-en-juego' },
  PROGRAMADO: { label: 'Programado', className: 'estado-programado' },
  CANCELADO: { label: 'Cancelado', className: 'estado-cancelado' },
}

export function PartidoDesarrolloCard({ partido, faseNombre, selected = false, onSelect }) {
  const estadoInfo = ESTADO_META[partido.estado] ?? {
    label: partido.estado,
    className: 'estado-programado',
  }

  const contextLabel = partido.ronda
    ? `${RONDA_LABELS[partido.ronda] ?? partido.ronda}${partido.numeroLlave ? ` · Llave #${partido.numeroLlave}` : ''}`
    : faseNombre

  return (
    <button
      type="button"
      className={`dev-match-card ${partido.tieneResultado ? 'has-result' : 'is-pending'} ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect?.(partido)}
      aria-pressed={selected}
    >
      <div className="dev-match-card-top">
        <span className="dev-match-context">{contextLabel}</span>
        <span
          className={`bracket-result-tag ${partido.tieneResultado ? 'is-recorded' : 'is-waiting'}`}
        >
          {partido.tieneResultado ? 'Con resultado' : 'Pendiente'}
        </span>
      </div>

      <div className="dev-match-body">
        <div className="dev-match-team">
          <span className="dev-match-crest" aria-hidden="true">
            {getInitials(partido.equipoLocal?.nombre)}
          </span>
          <span className="dev-match-team-name">{partido.equipoLocal?.nombre ?? 'Por definir'}</span>
        </div>

        <div className="dev-match-center">
          {partido.tieneResultado ? (
            <span className="dev-match-score">
              {partido.marcadorLocal} <span>-</span> {partido.marcadorVisitante}
            </span>
          ) : (
            <span className="dev-match-vs">VS</span>
          )}
        </div>

        <div className="dev-match-team">
          <span className="dev-match-crest is-away" aria-hidden="true">
            {getInitials(partido.equipoVisitante?.nombre)}
          </span>
          <span className="dev-match-team-name">
            {partido.equipoVisitante?.nombre ?? 'Por definir'}
          </span>
        </div>
      </div>

      <div className="dev-match-card-footer">
        <span className={`bracket-estado-badge ${estadoInfo.className}`}>{estadoInfo.label}</span>
        <span className="dev-match-date">
          <CalendarClock size={12} aria-hidden="true" />
          {formatDateTime(partido.fechaHora)}
        </span>
        {selected && (
          <span className="dev-match-selected-pill">
            <Target size={11} aria-hidden="true" />
            Viendo anotaciones
          </span>
        )}
      </div>
    </button>
  )
}
