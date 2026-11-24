import { useCallback, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { catalogosService, equiposService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'

export function TeamSports({ teamId, teamActive = true }) {
  const toast = useToast()
  const canAssign = useCan('equipos', 'crear')
  const canRemove = useCan('equipos', 'eliminar')
  const canListSports = useCan('deportes', 'listar')

  const loadSports = useCallback(() => equiposService.getSports(teamId), [teamId])
  const loadCatalog = useCallback(
    () => (canAssign && canListSports ? catalogosService.getSports({ activo: true }) : Promise.resolve([])),
    [canAssign, canListSports],
  )
  const assignedState = useAsyncData(loadSports)
  const catalogState = useAsyncData(loadCatalog)
  const [deporteId, setDeporteId] = useState('')
  const [saving, setSaving] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  const assigned = assignedState.data ?? []
  const available = (catalogState.data ?? []).filter((sport) => !assigned.some((item) => item.id === sport.id))

  const assign = async () => {
    if (!deporteId || !teamActive) return
    setSaving(true)
    try {
      await equiposService.assignSport(teamId, Number(deporteId))
      toast.success('Deporte asociado correctamente.')
      setDeporteId('')
      assignedState.reload()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo asociar el deporte.'))
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await equiposService.removeSport(teamId, removeTarget.id)
      toast.success('Asociación retirada correctamente.')
      assignedState.reload()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo retirar el deporte.'))
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  return (
    <section className="panel team-section">
      <h3 className="section-title">Deportes asociados</h3>
      {!teamActive && (
        <Alert type="info">El equipo está inactivo; no se pueden asociar nuevos deportes.</Alert>
      )}
      {assignedState.error && (
        <Alert type="error">{getApiErrorMessage(assignedState.error, 'No se pudieron cargar los deportes.')}</Alert>
      )}
      {assignedState.loading ? (
        <Spinner label="Cargando..." />
      ) : (
        <div className="chip-list">
          {assigned.map((sport) => (
            <span className="chip chip-with-action" key={sport.id}>
              {sport.nombre}
              {canRemove && (
                <ActionButton
                  icon={X}
                  label={`Retirar ${sport.nombre}`}
                  variant="danger"
                  onClick={() => setRemoveTarget(sport)}
                />
              )}
            </span>
          ))}
          {assigned.length === 0 && <span className="text-muted">Sin deportes asociados.</span>}
        </div>
      )}
      {canAssign && teamActive && (
        <>
          {catalogState.error && (
            <Alert type="error">{getApiErrorMessage(catalogState.error, 'No se pudo cargar el catálogo de deportes.')}</Alert>
          )}
          <div className="inline-form">
            <select
              className="input"
              value={deporteId}
              onChange={(event) => setDeporteId(event.target.value)}
              aria-label="Deporte"
            >
              <option value="">Selecciona un deporte</option>
              {available.map((sport) => (
                <option value={sport.id} key={sport.id}>{sport.nombre}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={assign} disabled={!deporteId || saving}>
              {saving ? <Spinner size={16} /> : <Plus size={16} />} Asociar
            </button>
          </div>
        </>
      )}
      {removeTarget && (
        <ConfirmDialog
          title="Retirar deporte"
          confirmLabel="Retirar"
          danger
          loading={removing}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
          message={
            <p>
              ¿Retirar la asociación con <strong>{removeTarget.nombre}</strong>?
              El deporte seguirá existiendo en la plataforma.
            </p>
          }
        />
      )}
    </section>
  )
}
