import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Chip } from '../../../components/Badge'
import { DetailRow } from '../../../components/DetailPanel'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { torneosService } from '../../../services'
import { TournamentInscriptions } from './TournamentInscriptions'

export function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const load = useCallback(() => torneosService.get(id), [id])
  const { data: tournament, loading, error, reload } = useAsyncData(load)
  if (loading) return <Spinner label="Cargando torneo..." />
  if (error) return <Alert type="error">No se pudo cargar el torneo. <button type="button" className="btn" onClick={reload}>Reintentar</button></Alert>
  if (!tournament) return <Alert type="error">El torneo no existe.</Alert>

  return (
    <div className="page-stack">
      <button type="button" className="btn back-link" onClick={() => navigate('/torneos')}><ArrowLeft size={16} /> Volver a torneos</button>
      <div className="team-detail-grid">
        <section className="panel team-section">
          <h2 className="section-title">{tournament.nombre}</h2>
          <dl>
            <DetailRow label="Deporte">{tournament.deporte?.nombre}</DetailRow>
            <DetailRow label="Estado"><Chip>{tournament.estado}</Chip></DetailRow>
            <DetailRow label="Inicio">{tournament.fechaInicio}</DetailRow>
            <DetailRow label="Fin">{tournament.fechaFin}</DetailRow>
            <DetailRow label="Cierre">{tournament.fechaCierreInscripciones}</DetailRow>
            <DetailRow label="Máximo">{tournament.maxEquipos ?? 'Sin límite'}</DetailRow>
            <DetailRow label="Inscritos">{tournament.cantidadInscritos ?? 0}</DetailRow>
            <DetailRow label="Descripción">{tournament.descripcion || 'Sin descripción'}</DetailRow>
          </dl>
          <div className="detail-actions">
            <button type="button" className="btn" onClick={() => navigate(`/torneos/${id}/fase-final`)}>Fase final</button>
            <button type="button" className="btn" onClick={() => navigate(`/torneos/${id}/desarrollo`)}>Desarrollo del torneo</button>
          </div>
        </section>
        <div className="team-section-stack">
          <TournamentInscriptions tournamentId={Number(id)} />
          <section className="panel team-section"><h3 className="section-title">Partidos del torneo</h3><p className="text-muted">Pendiente: gestión de partidos (persona B).</p></section>
        </div>
      </div>
    </div>
  )
}
