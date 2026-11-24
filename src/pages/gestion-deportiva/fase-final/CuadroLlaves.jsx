import { Award, CalendarClock, Trophy } from 'lucide-react'
import { formatDateTime } from '../../../utils/format'
import './fase-final.css'

const RONDA_LABELS = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos de final',
  CUARTOS: 'Cuartos de final',
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

function LlaveCard({ llave, onSelectPartido }) {
  const { numeroLlave, partido, ganador } = llave
  const isClickable = Boolean(partido && onSelectPartido)
  const localWinner = Boolean(ganador && partido?.equipoLocal?.id === ganador.id)
  const visitanteWinner = Boolean(ganador && partido?.equipoVisitante?.id === ganador.id)
  const estadoInfo = partido
    ? ESTADO_META[partido.estado] ?? { label: partido.estado, className: 'estado-programado' }
    : { label: 'Por definir', className: 'estado-pendiente' }

  const Tag = isClickable ? 'button' : 'div'

  return (
    <Tag
      type={isClickable ? 'button' : undefined}
      className={`bracket-match ${partido ? 'has-match' : 'is-empty'} ${ganador ? 'has-winner' : ''} ${isClickable ? 'is-clickable' : ''}`}
      onClick={isClickable ? () => onSelectPartido(partido) : undefined}
    >
      <div className="bracket-match-top">
        <span className="bracket-llave-num">Llave #{numeroLlave}</span>
        {partido ? (
          <span
            className={`bracket-result-tag ${
              partido.estado === 'CANCELADO'
                ? 'is-undefined'
                : partido.tieneResultado
                  ? 'is-recorded'
                  : 'is-waiting'
            }`}
          >
            {partido.estado === 'CANCELADO'
              ? 'Cancelado'
              : partido.tieneResultado
                ? 'Con resultado'
                : 'Pendiente'}
          </span>
        ) : (
          <span className="bracket-result-tag is-undefined">Por definir</span>
        )}
      </div>

      <div className="bracket-teams">
        <div className={`bracket-team-row ${localWinner ? 'is-winner' : ''}`}>
          <span className="bracket-team-name">
            {partido?.equipoLocal?.nombre ?? 'Por definir'}
          </span>
          <span className="bracket-team-score">
            {partido?.marcadorLocal !== null && partido?.marcadorLocal !== undefined
              ? partido.marcadorLocal
              : '—'}
          </span>
        </div>

        <div className={`bracket-team-row ${visitanteWinner ? 'is-winner' : ''}`}>
          <span className="bracket-team-name">
            {partido?.equipoVisitante?.nombre ?? 'Por definir'}
          </span>
          <span className="bracket-team-score">
            {partido?.marcadorVisitante !== null && partido?.marcadorVisitante !== undefined
              ? partido.marcadorVisitante
              : '—'}
          </span>
        </div>
      </div>

      <div className="bracket-match-footer">
        <span className={`bracket-estado-badge ${estadoInfo.className}`}>{estadoInfo.label}</span>
        {partido?.fechaHora && (
          <span className="bracket-date">
            <CalendarClock size={12} aria-hidden="true" />
            {formatDateTime(partido.fechaHora)}
          </span>
        )}
      </div>
    </Tag>
  )
}

export function CuadroLlaves({ rondas = [], tercerPuesto = false, onSelectPartido }) {
  const rondasPrincipales = rondas.filter((item) => item.ronda !== 'TERCER_PUESTO')
  const rondaTercerPuesto = rondas.find((item) => item.ronda === 'TERCER_PUESTO')

  if (rondas.length === 0) {
    return (
      <div className="ff-empty-box">
        No hay rondas disponibles para mostrar en el cuadro eliminatorio.
      </div>
    )
  }

  return (
    <div className="bracket-wrapper">
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {rondasPrincipales.map((rondaObj, colIndex) => {
            const isFinal = rondaObj.ronda === 'FINAL'
            const hasNext = colIndex < rondasPrincipales.length - 1
            return (
              <div
                className={`bracket-round ${hasNext ? 'has-connector' : ''}`}
                key={rondaObj.ronda}
              >
                <div className={`bracket-round-header ${isFinal ? 'is-final' : ''}`}>
                  {isFinal && <Trophy size={15} aria-hidden="true" />}
                  <span>{RONDA_LABELS[rondaObj.ronda] ?? rondaObj.ronda}</span>
                </div>

                <div className="bracket-round-matches">
                  {(rondaObj.llaves ?? []).map((llave) => (
                    <div className="bracket-slot" key={`${rondaObj.ronda}-${llave.numeroLlave}`}>
                      <LlaveCard llave={llave} onSelectPartido={onSelectPartido} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(tercerPuesto || rondaTercerPuesto) && rondaTercerPuesto && (
        <div className="bracket-third-place">
          <div className="bracket-third-header">
            <Award size={16} aria-hidden="true" />
            <span>{RONDA_LABELS.TERCER_PUESTO}</span>
          </div>
          <div className="bracket-third-card-wrap">
            {(rondaTercerPuesto.llaves ?? []).map((llave) => (
              <LlaveCard
                key={`tercer-${llave.numeroLlave}`}
                llave={llave}
                onSelectPartido={onSelectPartido}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
