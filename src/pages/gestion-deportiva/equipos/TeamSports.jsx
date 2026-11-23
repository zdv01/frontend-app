import { useCallback, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useToast } from '../../../hooks/useToast'
import { catalogosService, equiposService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'

export function TeamSports({ teamId }) {
  const toast = useToast()
  const loadSports = useCallback(() => equiposService.getSports(teamId), [teamId])
  const loadCatalog = useCallback(() => catalogosService.getSports({ activo: true }), [])
  const assignedState = useAsyncData(loadSports)
  const catalogState = useAsyncData(loadCatalog)
  const [deporteId, setDeporteId] = useState('')
  const [saving, setSaving] = useState(false)

  const assigned = assignedState.data ?? []
  const available = (catalogState.data ?? []).filter((sport) => !assigned.some((item) => item.id === sport.id))

  const assign = async () => {
    if (!deporteId) return
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

  const remove = async (sport) => {
    try {
      await equiposService.removeSport(teamId, sport.id)
      toast.success('Asociación retirada correctamente.')
      assignedState.reload()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo retirar el deporte.'))
    }
  }

  return (
    <section className="panel team-section">
      <h3 className="section-title">Deportes asociados</h3>
      {assignedState.error && <Alert type="error">No se pudieron cargar los deportes.</Alert>}
      {assignedState.loading ? <Spinner label="Cargando..." /> : (
        <div className="chip-list">
          {assigned.map((sport) => (
            <span className="chip chip-with-action" key={sport.id}>
              {sport.nombre}
              <ActionButton icon={X} label={`Retirar ${sport.nombre}`} variant="danger" onClick={() => remove(sport)} />
            </span>
          ))}
          {assigned.length === 0 && <span className="text-muted">Sin deportes asociados.</span>}
        </div>
      )}
      <div className="inline-form">
        <select className="input" value={deporteId} onChange={(event) => setDeporteId(event.target.value)} aria-label="Deporte">
          <option value="">Selecciona un deporte</option>
          {available.map((sport) => <option value={sport.id} key={sport.id}>{sport.nombre}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={assign} disabled={!deporteId || saving}>
          {saving ? <Spinner size={16} /> : <Plus size={16} />} Asociar
        </button>
      </div>
    </section>
  )
}
