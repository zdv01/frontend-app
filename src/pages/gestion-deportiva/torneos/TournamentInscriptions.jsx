import { useCallback, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { equiposService, torneosService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'

export function TournamentInscriptions({
  tournamentId,
  deporteId,
  inscripcionesAbiertas = true,
  onChanged,
}) {
  const toast = useToast()
  const canEnroll = useCan('torneos', 'crear')
  const canRemove = useCan('torneos', 'eliminar')
  const canListBySport = useCan('deportes', 'ver')
  const canListTeams = useCan('equipos', 'listar')

  const loadInscriptions = useCallback(() => torneosService.getInscriptions(tournamentId), [tournamentId])
  const loadTeams = useCallback(() => {
    if (!canEnroll) return Promise.resolve([])
    if (deporteId && canListBySport) return equiposService.getBySport(deporteId)
    if (canListTeams) return equiposService.list({ activo: true })
    return Promise.resolve([])
  }, [canEnroll, deporteId, canListBySport, canListTeams])

  const inscriptions = useAsyncData(loadInscriptions)
  const teamsState = useAsyncData(loadTeams)
  const [teamIds, setTeamIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  const enrolled = inscriptions.data ?? []
  const enrolledIds = new Set(enrolled.map((item) => item.equipo?.id).filter(Boolean))
  const available = (teamsState.data ?? []).filter((team) => team.activo && !enrolledIds.has(team.id))

  const toggleTeam = (id) =>
    setTeamIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const enroll = async () => {
    if (!teamIds.length || !inscripcionesAbiertas) return
    setSaving(true)
    try {
      await torneosService.enrollTeams(tournamentId, teamIds)
      toast.success('Inscripción realizada correctamente.')
      setTeamIds([])
      inscriptions.reload()
      onChanged?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron inscribir los equipos.'))
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await torneosService.removeEnrollment(tournamentId, removeTarget.equipo.id)
      toast.success('Equipo retirado del torneo.')
      inscriptions.reload()
      onChanged?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo retirar la inscripción.'))
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  return (
    <section className="panel team-section">
      <h3 className="section-title">Inscripciones de equipos</h3>
      {!inscripcionesAbiertas && (
        <Alert type="info">
          Las inscripciones de este torneo están cerradas; no se pueden inscribir ni retirar equipos.
        </Alert>
      )}
      {inscriptions.loading ? (
        <Spinner label="Cargando inscripciones..." />
      ) : inscriptions.error ? (
        <Alert type="error">{getApiErrorMessage(inscriptions.error, 'No se pudieron cargar las inscripciones.')}</Alert>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Fecha</th>
                {canRemove && inscripcionesAbiertas && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {enrolled.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.equipo?.nombre}</strong></td>
                  <td>{item.fechaInscripcion?.slice(0, 10) || '—'}</td>
                  {canRemove && inscripcionesAbiertas && (
                    <td>
                      <ActionButton
                        icon={X}
                        label={`Retirar ${item.equipo?.nombre}`}
                        variant="danger"
                        onClick={() => setRemoveTarget(item)}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {enrolled.length === 0 && (
                <tr>
                  <td colSpan={canRemove && inscripcionesAbiertas ? 3 : 2} className="table-message">
                    No hay equipos inscritos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canEnroll && inscripcionesAbiertas && (
        <>
          <h4 className="detail-section-title">Equipos disponibles del deporte</h4>
          {teamsState.error && (
            <Alert type="error">
              {getApiErrorMessage(teamsState.error, 'No se pudieron cargar los equipos disponibles.')}
            </Alert>
          )}
          <div className="select-list">
            {available.map((team) => (
              <label className="select-list-item" key={team.id}>
                <input
                  type="checkbox"
                  checked={teamIds.includes(team.id)}
                  onChange={() => toggleTeam(team.id)}
                />
                <span className="select-list-text">
                  <strong>{team.nombre}</strong>
                  {team.ciudad && <span className="text-muted">{team.ciudad}</span>}
                </span>
              </label>
            ))}
            {available.length === 0 && (
              <div className="select-list-item text-muted">
                No hay equipos activos del deporte disponibles para inscribir.
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={enroll}
            disabled={!teamIds.length || saving}
          >
            {saving ? <Spinner size={16} /> : <Plus size={16} />} Inscribir equipos
          </button>
        </>
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Retirar inscripción"
          confirmLabel="Retirar"
          danger
          loading={removing}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
          message={
            <p>
              ¿Retirar a <strong>{removeTarget.equipo?.nombre}</strong> de este torneo?
              Solo se permite si no está en grupos ni tiene partidos registrados.
            </p>
          }
        />
      )}
    </section>
  )
}
