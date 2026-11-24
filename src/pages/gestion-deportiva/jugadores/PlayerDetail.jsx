import { Activity, ArrowLeft, Cake, IdCard, Mail, Phone, UserRound } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { DetailRow } from '../../../components/DetailPanel'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { formatDate, getInitials } from '../../../utils/format'
import { HabilidadesJugador } from '../perfil/HabilidadesJugador'
import { ActivoBadge } from './gdUi'
import { iconLabel } from './gdIcons'
import { HistorialEquiposJugador } from './HistorialEquiposJugador'

export function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const load = useCallback(() => jugadoresService.get(id), [id])
  const { data: player, loading, error, reload } = useAsyncData(load)

  if (loading) return <Spinner label="Cargando jugador..." />
  if (error) return <Alert type="error">No se pudo cargar el jugador. <button type="button" className="btn" onClick={reload}>Reintentar</button></Alert>
  if (!player) return <Alert type="error">El jugador no existe.</Alert>

  return (
    <div className="page-stack gd-skin">
      <button type="button" className="btn back-link" onClick={() => navigate('/jugadores')}><ArrowLeft size={16} /> Volver a jugadores</button>
      <div className="gd-player-layout">
      <div className="gd-player-grid">
        <section className="panel team-section gd-detail">
          <h2 className="section-title gd-panel-title"><UserRound size={20} /> Detalle del jugador</h2>
          <div className="gd-hero">
            <span className="gd-avatar-lg" aria-hidden="true">{getInitials(player.nombreCompleto)}</span>
            <div>
              <h3>{player.nombreCompleto}</h3>
              <ActivoBadge active={player.activo} />
            </div>
          </div>
          <dl>
            <DetailRow label={iconLabel(IdCard, 'Documento')}>{player.tipoDocumento} {player.numeroDocumento}</DetailRow>
            <DetailRow label={iconLabel(Cake, 'Edad')}>{player.edad} años</DetailRow>
            <DetailRow label={iconLabel(Cake, 'Nacimiento')}>{formatDate(player.fechaNacimiento)}</DetailRow>
            <DetailRow label={iconLabel(Mail, 'Correo')}>{player.email || '—'}</DetailRow>
            <DetailRow label={iconLabel(Phone, 'Teléfono')}>{player.telefono || '—'}</DetailRow>
            <DetailRow label={iconLabel(Activity, 'Estado')}><ActivoBadge active={player.activo} /></DetailRow>
          </dl>
          <div className="detail-actions">
            <Link className="btn btn-outline-info" to={`/jugadores/${player.id}/perfil`}>Ver perfil deportivo</Link>
          </div>
        </section>
        <HistorialEquiposJugador jugadorId={player.id} />
      </div>
      <div className="gd-player-skills">
        <HabilidadesJugador jugadorId={player.id} jugadorActivo={player.activo} />
      </div>
      </div>
    </div>
  )
}
