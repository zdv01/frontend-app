import { useCallback } from 'react'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { equiposService } from '../../../services'
import { Spinner } from '../../../components/Spinner'
import { Alert } from '../../../components/Alert'

export function TeamTournaments({ teamId }) {
  const load = useCallback(() => equiposService.getTournaments(teamId), [teamId])
  const { data, loading, error } = useAsyncData(load)
  return (
    <section className="panel team-section">
      <h3 className="section-title">Torneos inscritos</h3>
      {loading ? <Spinner label="Cargando..." /> : error ? <Alert type="error">No se pudieron cargar los torneos.</Alert> : (
        <div className="chip-list">
          {(data ?? []).map((item) => <span className="chip" key={item.id}>{item.torneo?.nombre}</span>)}
          {(data ?? []).length === 0 && <span className="text-muted">Este equipo no tiene inscripciones.</span>}
        </div>
      )}
    </section>
  )
}
