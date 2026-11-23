import { useCallback, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useToast } from '../../../hooks/useToast'
import { equiposService, torneosService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'

export function TournamentInscriptions({ tournamentId }) {
  const toast = useToast()
  const loadInscriptions = useCallback(() => torneosService.getInscriptions(tournamentId), [tournamentId])
  const loadTeams = useCallback(() => equiposService.list({ activo: true }), [])
  const inscriptions = useAsyncData(loadInscriptions)
  const teamsState = useAsyncData(loadTeams)
  const [teamIds, setTeamIds] = useState([])
  const [saving, setSaving] = useState(false)

  const enrolled = inscriptions.data ?? []
  const enrolledIds = new Set(enrolled.map((item) => item.equipo?.id).filter(Boolean))
  const available = (teamsState.data ?? []).filter((team) => team.activo && !enrolledIds.has(team.id))

  const toggleTeam = (id) => setTeamIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const enroll = async () => {
    if (!teamIds.length) return
    setSaving(true)
    try {
      await torneosService.enrollTeams(tournamentId, teamIds)
      toast.success('Inscripción realizada correctamente.')
      setTeamIds([])
      inscriptions.reload()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron inscribir los equipos.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    try {
      await torneosService.removeEnrollment(tournamentId, item.equipo.id)
      toast.success('Equipo retirado del torneo.')
      inscriptions.reload()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo retirar la inscripción.'))
    }
  }

  return (
    <section className="panel team-section">
      <h3 className="section-title">Inscripciones de equipos</h3>
      {inscriptions.loading ? <Spinner label="Cargando inscripciones..." /> : inscriptions.error ? <Alert type="error">No se pudieron cargar las inscripciones.</Alert> : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Equipo</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {enrolled.map((item) => <tr key={item.id}><td><strong>{item.equipo?.nombre}</strong></td><td>{item.fechaInscripcion?.slice(0, 10) || '—'}</td><td><ActionButton icon={X} label="Retirar equipo" variant="danger" onClick={() => remove(item)} /></td></tr>)}
              {enrolled.length === 0 && <tr><td colSpan="3" className="table-message">No hay equipos inscritos.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <h4 className="detail-section-title">Equipos disponibles</h4>
      <div className="select-list">
        {available.map((team) => (
          <label className="select-list-item" key={team.id}>
            <input type="checkbox" checked={teamIds.includes(team.id)} onChange={() => toggleTeam(team.id)} />
            <span className="select-list-text"><strong>{team.nombre}</strong><span className="text-muted">{team.ciudad}</span></span>
          </label>
        ))}
        {available.length === 0 && <div className="select-list-item text-muted">No hay equipos disponibles.</div>}
      </div>
      <button type="button" className="btn btn-primary" onClick={enroll} disabled={!teamIds.length || saving}>
        {saving ? <Spinner size={16} /> : <Plus size={16} />} Inscribir equipos
      </button>
    </section>
  )
}
