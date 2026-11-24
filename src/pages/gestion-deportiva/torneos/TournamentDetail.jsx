import { ArrowLeft, Power } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Chip } from '../../../components/Badge'
import { DetailRow } from '../../../components/DetailPanel'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useAuth } from '../../../hooks/useAuth'
import { torneosService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'
import { PartidosTorneo } from '../partidos/PartidosTorneo'
import { TournamentInscriptions } from './TournamentInscriptions'
import { TournamentStatusModal } from './TournamentStatusModal'
import { getTournamentStatusLabel, tournamentStatusTransitions } from './tournamentStatus'

export function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const [statusTarget, setStatusTarget] = useState(null)
  const load = useCallback(() => torneosService.get(id), [id])
  const { data: tournament, loading, error, reload } = useAsyncData(load)
  if (loading && !tournament) return <Spinner label="Cargando torneo..." />
  if (error) {
    return (
      <Alert type="error">
        {getApiErrorMessage(error, 'No se pudo cargar el torneo.')}{' '}
        <button type="button" className="btn" onClick={reload}>Reintentar</button>
      </Alert>
    )
  }
  if (!tournament) return <Alert type="error">El torneo no existe.</Alert>

  return (
    <div className="page-stack">
      <button type="button" className="btn back-link" onClick={() => navigate('/torneos')}>
        <ArrowLeft size={16} /> Volver a torneos
      </button>
      <div className="team-detail-grid">
        <section className="panel team-section">
          <h2 className="section-title">{tournament.nombre}</h2>
          <dl>
            <DetailRow label="Deporte">{tournament.deporte?.nombre}</DetailRow>
            <DetailRow label="Estado"><Chip>{getTournamentStatusLabel(tournament)}</Chip></DetailRow>
            <DetailRow label="Inicio">{tournament.fechaInicio}</DetailRow>
            <DetailRow label="Fin">{tournament.fechaFin}</DetailRow>
            <DetailRow label="Cierre">{tournament.fechaCierreInscripciones}</DetailRow>
            <DetailRow label="Máximo">{tournament.maxEquipos ?? 'Sin límite'}</DetailRow>
            <DetailRow label="Inscritos">{tournament.cantidadInscritos ?? 0}</DetailRow>
            <DetailRow label="Descripción">{tournament.descripcion || 'Sin descripción'}</DetailRow>
          </dl>
          <div className="detail-actions">
            {can('torneos', 'actualizar') && (tournamentStatusTransitions[tournament.estado] ?? []).length > 0 && (
              <button type="button" className="btn" onClick={() => setStatusTarget(tournament)}>
                <Power size={16} /> Cambiar estado
              </button>
            )}
            <button type="button" className="btn" onClick={() => navigate(`/torneos/${id}/fase-final`)}>Fase final</button>
            <button type="button" className="btn" onClick={() => navigate(`/torneos/${id}/desarrollo`)}>Desarrollo del torneo</button>
          </div>
          {statusTarget && (
            <TournamentStatusModal
              tournament={statusTarget}
              onClose={() => setStatusTarget(null)}
              onChanged={() => { setStatusTarget(null); reload() }}
            />
          )}
        </section>
        <div className="team-section-stack">
          <TournamentInscriptions
            tournamentId={Number(id)}
            deporteId={tournament.deporte?.id}
            inscripcionesAbiertas={tournament.inscripcionesAbiertas}
            onChanged={reload}
          />
        </div>
      </div>

      <section className="panel team-section">
        <h3 className="section-title">Partidos del torneo</h3>
        <PartidosTorneo torneoId={Number(id)} />
      </section>
    </div>
  )
}
