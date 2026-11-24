import { Shield } from 'lucide-react'
import { Chip } from '../../../components/Badge'
import { getInitials } from '../../../utils/format'

function formatDiff(value) {
  if (value > 0) return `+${value}`
  return String(value ?? 0)
}

export function TablaPosicionesCard({ fase }) {
  const tabla = fase?.tablaPosiciones ?? []
  const equipos = fase?.equipos ?? []
  const hasPlayed = tabla.some((row) => (row.jugados ?? 0) > 0)

  return (
    <article className="panel dev-group-card">
      <header className="dev-group-header">
        <div className="dev-group-title-wrap">
          <h4 className="dev-group-title">{fase.nombre}</h4>
          <span className="dev-group-order">Orden #{fase.orden}</span>
        </div>
        <Chip>{equipos.length} equipos</Chip>
      </header>

      {tabla.length === 0 ? (
        <div className="dev-empty-box">
          {equipos.length === 0 ? (
            'Este grupo aún no tiene equipos asignados.'
          ) : (
            <div className="dev-team-chips">
              {equipos.map((equipo) => (
                <span key={equipo.id} className="chip">
                  <Shield size={13} aria-hidden="true" />
                  {equipo.nombre}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="dev-standings-wrap">
          <table className="dev-standings-table">
            <thead>
              <tr>
                <th className="col-pos" title="Posición">Pos</th>
                <th className="col-team">Equipo</th>
                <th title="Partidos jugados">PJ</th>
                <th title="Partidos ganados">PG</th>
                <th title="Partidos empatados">PE</th>
                <th title="Partidos perdidos">PP</th>
                <th title="Goles o puntos a favor">GF</th>
                <th title="Goles o puntos en contra">GC</th>
                <th title="Diferencia">DG</th>
                <th className="col-pts" title="Puntos">PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => {
                const isTop = hasPlayed && fila.posicion <= 2
                const diffClass =
                  fila.diferencia > 0
                    ? 'is-positive'
                    : fila.diferencia < 0
                      ? 'is-negative'
                      : ''
                return (
                  <tr key={fila.equipo.id} className={isTop ? 'is-qualified' : ''}>
                    <td className="col-pos">
                      <span className={`dev-pos-badge ${isTop ? 'is-top' : ''}`}>
                        {fila.posicion}
                      </span>
                    </td>
                    <td className="col-team">
                      <div className="dev-team-cell">
                        <span className="dev-team-crest" aria-hidden="true">
                          {getInitials(fila.equipo.nombre)}
                        </span>
                        <span className="dev-team-name">{fila.equipo.nombre}</span>
                      </div>
                    </td>
                    <td>{fila.jugados}</td>
                    <td>{fila.ganados}</td>
                    <td>{fila.empatados}</td>
                    <td>{fila.perdidos}</td>
                    <td>{fila.aFavor}</td>
                    <td>{fila.enContra}</td>
                    <td className={`dev-diff-cell ${diffClass}`}>
                      {formatDiff(fila.diferencia)}
                    </td>
                    <td className="col-pts">{fila.puntos}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}
