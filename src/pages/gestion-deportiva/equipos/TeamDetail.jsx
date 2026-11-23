import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { DetailRow } from '../../../components/DetailPanel'
import { StatusBadge } from '../../../components/Badge'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { equiposService } from '../../../services'
import { TeamSports } from './TeamSports'
import { TeamTournaments } from './TeamTournaments'
import { PlantillaEquipo } from './PlantillaEquipo'

export function TeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const load = useCallback(() => equiposService.get(id), [id])
  const { data: team, loading, error, reload } = useAsyncData(load)

  if (loading) return <Spinner label="Cargando equipo..." />
  if (error) return <Alert type="error">No se pudo cargar el equipo. <button type="button" className="btn" onClick={reload}>Reintentar</button></Alert>
  if (!team) return <Alert type="error">El equipo no existe.</Alert>

  return (
    <div className="page-stack">
      <button type="button" className="btn back-link" onClick={() => navigate('/equipos')}><ArrowLeft size={16} /> Volver a equipos</button>
      <div className="team-detail-grid">
        <section className="panel team-section">
          <h2 className="section-title">{team.nombre}</h2>
          <dl>
            <DetailRow label="Ciudad">{team.ciudad}</DetailRow>
            <DetailRow label="Fundación">{team.fechaFundacion || '—'}</DetailRow>
            <DetailRow label="Estado"><StatusBadge active={team.activo} /></DetailRow>
            <DetailRow label="Descripción">{team.descripcion || 'Sin descripción'}</DetailRow>
          </dl>
        </section>
        <div className="team-section-stack">
          <TeamSports teamId={Number(id)} />
          <TeamTournaments teamId={Number(id)} />
          <PlantillaEquipo equipoId={Number(id)} />
        </div>
      </div>
    </div>
  )
}
