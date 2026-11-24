import { ArrowLeft, CalendarClock, Flag, MapPin, Pencil, Save, Trash2, Trophy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { DetailRow } from '../../../components/DetailPanel'
import { FormField } from '../../../components/FormField'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { partidosService } from '../../../services/gestion/partidosService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors } from '../../../utils/validators'
import { iconLabel } from '../jugadores/gdIcons'
import { PersonCell, WarningNote } from '../jugadores/gdUi'
import { AnotacionesPartido } from './AnotacionesPartido'
import { CambioEstadoDialog, EliminarPartidoDialog } from './PartidoDialogs'
import { PartidoFormModal } from './PartidoFormModal'
import { EstadoPartidoBadge } from './partidosUi'
import { ACCION_ESTADO, TRANSICIONES, fechaHoraTexto, rondaTexto } from './partidosUtils'

// Entero >= 0 (el 0 es válido: un 0 - 0 es un resultado)
const marcadorValido = (v) => v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0

// Formulario del resultado: PUT /partidos/{id}/resultado (solo EN_JUEGO o FINALIZADO)
function ResultadoForm({ partido, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ marcadorLocal: String(partido.marcadorLocal ?? ''), marcadorVisitante: String(partido.marcadorVisitante ?? '') })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {
      marcadorLocal: marcadorValido(form.marcadorLocal) ? '' : 'Entero mayor o igual a 0.',
      marcadorVisitante: marcadorValido(form.marcadorVisitante) ? '' : 'Entero mayor o igual a 0.',
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSaving(true)
    try {
      await partidosService.setResultado(partido.id, { marcadorLocal: Number(form.marcadorLocal), marcadorVisitante: Number(form.marcadorVisitante) })
      toast.success('Resultado registrado correctamente.')
      onSaved()
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else toast.error(getApiErrorMessage(error, 'No se pudo registrar el resultado.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="gd-result-form" onSubmit={submit} noValidate>
      <FormField label={partido.equipoLocal.nombre} htmlFor="rs-local" required error={errors.marcadorLocal}>
        <input id="rs-local" className="input" type="number" min="0" name="marcadorLocal" value={form.marcadorLocal} onChange={change} />
      </FormField>
      <FormField label={partido.equipoVisitante.nombre} htmlFor="rs-visitante" required error={errors.marcadorVisitante}>
        <input id="rs-visitante" className="input" type="number" min="0" name="marcadorVisitante" value={form.marcadorVisitante} onChange={change} />
      </FormField>
      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner size={16} /> : <Save size={16} />} Guardar resultado</button>
    </form>
  )
}

export function PartidoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const puedeActualizar = useCan('partidos', 'actualizar')
  const puedeEliminar = useCan('partidos', 'eliminar')
  const [editando, setEditando] = useState(false)
  const [estadoTarget, setEstadoTarget] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const load = useCallback(() => partidosService.get(id), [id])
  const { data: partido, loading, error, reload } = useAsyncData(load)

  if (loading && !partido) return <Spinner label="Cargando partido..." />
  if (error) return <Alert type="error">No se pudo cargar el partido. <button type="button" className="btn" onClick={reload}>Reintentar</button></Alert>
  if (!partido) return <Alert type="error">El partido no existe.</Alert>

  const aceptaResultado = ['EN_JUEGO', 'FINALIZADO'].includes(partido.estado)

  return (
    <div className="page-stack gd-skin">
      <button type="button" className="btn back-link" onClick={() => navigate('/partidos')}><ArrowLeft size={16} /> Volver a partidos</button>

      {/* Marcador */}
      <section className="gd-scoreboard" aria-label="Marcador del partido">
        <div className="gd-scoreboard-team"><PersonCell name={partido.equipoLocal.nombre} size={48} /><span className="text-muted">Local</span></div>
        <div className="gd-scoreboard-score">
          <span className="score">{partido.tieneResultado ? `${partido.marcadorLocal} - ${partido.marcadorVisitante}` : 'vs'}</span>
          <EstadoPartidoBadge estado={partido.estado} />
        </div>
        <div className="gd-scoreboard-team"><PersonCell name={partido.equipoVisitante.nombre} size={48} /><span className="text-muted">Visitante</span></div>
      </section>

      <div className="team-detail-grid">
        <section className="panel team-section gd-detail">
          <h2 className="section-title gd-panel-title"><Trophy size={20} /> Información del partido</h2>
          <dl>
            <DetailRow label={iconLabel(Trophy, 'Torneo')}>{partido.torneo.nombre}</DetailRow>
            <DetailRow label={iconLabel(Flag, 'Fase')}>{partido.fase.nombre}</DetailRow>
            <DetailRow label={iconLabel(Flag, 'Ronda')}>{rondaTexto(partido)}</DetailRow>
            <DetailRow label={iconLabel(CalendarClock, 'Fecha y hora')}>{fechaHoraTexto(partido.fechaHora)}</DetailRow>
            <DetailRow label={iconLabel(MapPin, 'Escenario')}>{partido.escenario?.nombre ?? 'Sin escenario'}</DetailRow>
          </dl>
          {puedeActualizar && (
            <div className="detail-actions">
              {partido.estado === 'PROGRAMADO' && <button type="button" className="btn btn-outline-info" onClick={() => setEditando(true)}><Pencil size={16} /> Editar</button>}
              {TRANSICIONES[partido.estado].map((destino) => (
                <button key={destino} type="button" className={`btn ${ACCION_ESTADO[destino].variant}`} onClick={() => setEstadoTarget(destino)}>{ACCION_ESTADO[destino].label}</button>
              ))}
              {puedeEliminar && partido.estado === 'PROGRAMADO' && <button type="button" className="btn btn-outline-danger" onClick={() => setEliminando(true)}><Trash2 size={16} /> Eliminar</button>}
            </div>
          )}
        </section>

        <div className="team-section-stack">
          <section className="panel team-section">
            <h2 className="section-title gd-panel-title"><Trophy size={20} /> Resultado</h2>
            {aceptaResultado && puedeActualizar && <ResultadoForm key={`${partido.marcadorLocal}-${partido.marcadorVisitante}`} partido={partido} onSaved={reload} />}
            {aceptaResultado && !puedeActualizar && <p>{partido.tieneResultado ? `Resultado: ${partido.marcadorLocal} - ${partido.marcadorVisitante}` : 'Aún no se registra el resultado.'}</p>}
            {!aceptaResultado && <WarningNote>El resultado solo se registra cuando el partido está En juego o Finalizado.</WarningNote>}
            {partido.estado === 'EN_JUEGO' && !partido.tieneResultado && <p className="gd-section-footer">Para finalizar el partido primero debes registrar el resultado.</p>}
          </section>
          <AnotacionesPartido partidoId={partido.id} partido={partido} onChange={reload} />
        </div>
      </div>

      {editando && <PartidoFormModal partido={partido} onClose={() => setEditando(false)} onSaved={() => { setEditando(false); reload() }} />}
      {estadoTarget && <CambioEstadoDialog partido={partido} estado={estadoTarget} onClose={() => setEstadoTarget(null)} onDone={reload} />}
      {eliminando && <EliminarPartidoDialog partido={partido} onClose={() => setEliminando(false)} onDone={() => navigate('/partidos')} />}
    </div>
  )
}
