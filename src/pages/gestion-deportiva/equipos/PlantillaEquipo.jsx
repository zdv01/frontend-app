import { History, Plus, UserMinus, Users, Eye } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { formatDate } from '../../../utils/format'
import { hasErrors, validateRequired } from '../../../utils/validators'
import { JugadorCombobox } from '../jugadores/JugadorCombobox'
import { ActivoBadge, PersonCell, WarningNote } from '../jugadores/gdUi'
import '../jugadores/gd.css'

const EMPTY_FORM = { jugadorId: '', fechaInicio: '', fechaFin: '' }

// Modal "Asignar jugador al equipo": POST /api/equipos/{equipoId}/jugadores
function AsignarJugadorModal({ equipoId, actuales, onClose, onSaved }) {
  const toast = useToast()
  const loadJugadores = useCallback(() => jugadoresService.list({ activo: true }), [])
  const jugadoresState = useAsyncData(loadJugadores)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const idsEnPlantilla = useMemo(() => actuales.map((c) => c.jugador.id), [actuales])
  const yaEnPlantilla = form.jugadorId !== '' && idsEnPlantilla.includes(Number(form.jugadorId))

  const elegirJugador = (id) => {
    setForm((current) => ({ ...current, jugadorId: id }))
    setErrors((current) => ({ ...current, jugadorId: '' }))
  }

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {
      jugadorId: validateRequired(form.jugadorId, 'Selecciona un jugador.'),
      fechaInicio: validateRequired(form.fechaInicio, 'La fecha de inicio es obligatoria.'),
      fechaFin: validateRequired(form.fechaFin, 'La fecha de fin es obligatoria.'),
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSaving(true)
    try {
      await jugadoresService.asignar(equipoId, { jugadorId: Number(form.jugadorId), fechaInicio: form.fechaInicio, fechaFin: form.fechaFin })
      toast.success('Jugador asignado correctamente.')
      onSaved()
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else toast.error(getApiErrorMessage(error, 'No se pudo asignar el jugador.'))
      setSaving(false)
    }
  }

  return (
    <Modal title="Asignar jugador al equipo" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {jugadoresState.error && <Alert type="error">No se pudo cargar la lista de jugadores.</Alert>}
          <div className="form-grid">
            <FormField label="Seleccionar jugador" htmlFor="pe-jugador" required error={errors.jugadorId}>
              <JugadorCombobox id="pe-jugador" jugadores={jugadoresState.data ?? []} value={form.jugadorId} onChange={elegirJugador} excluirIds={idsEnPlantilla} error={errors.jugadorId} />
            </FormField>
            <FormField label="Fecha inicio del contrato" htmlFor="pe-inicio" required error={errors.fechaInicio}>
              <input id="pe-inicio" className="input" type="date" name="fechaInicio" value={form.fechaInicio} onChange={change} />
            </FormField>
            <FormField label="Fecha fin del contrato" htmlFor="pe-fin" required error={errors.fechaFin}>
              <input id="pe-fin" className="input" type="date" name="fechaFin" value={form.fechaFin} onChange={change} />
            </FormField>
            {yaEnPlantilla && <div className="gd-form-note"><WarningNote>Este jugador ya se encuentra asociado al equipo.</WarningNote></div>}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving && <Spinner size={16} />}Asignar</button>
        </div>
      </form>
    </Modal>
  )
}

// Plantilla (contratos activos) e historial (retirados) de un equipo. Se incrusta en /equipos/:id.
export function PlantillaEquipo({ equipoId, equipoActivo = true }) {
  const navigate = useNavigate()
  const toast = useToast()
  // Las rutas son /api/equipos/{id}/jugadores...: el recurso es el primer segmento (ACUERDOS 10.4)
  const canAssign = useCan('equipos', 'crear')
  const canRetire = useCan('equipos', 'actualizar')
  const [asignando, setAsignando] = useState(false)
  const [retiroTarget, setRetiroTarget] = useState(null)
  const [retirando, setRetirando] = useState(false)
  // Siempre se pide con historial y se separa en activos / retirados
  const loadContratos = useCallback(() => jugadoresService.listContratosEquipo(equipoId, true), [equipoId])
  const { data, loading, error, reload } = useAsyncData(loadContratos)

  const contratos = data ?? []
  const actuales = contratos.filter((c) => c.activo)
  const historial = contratos.filter((c) => !c.activo)

  const retire = async () => {
    setRetirando(true)
    try {
      await jugadoresService.retirar(equipoId, retiroTarget.jugador.id)
      toast.success('Jugador retirado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo retirar al jugador.'))
    } finally {
      setRetirando(false)
      setRetiroTarget(null)
    }
  }

  return (
    <>
      <section className="panel team-section gd-skin">
        <div className="gd-panel-head">
          <h3 className="section-title gd-panel-title"><Users size={20} /> Jugadores actuales</h3>
          {canAssign && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setAsignando(true)}
              disabled={!equipoActivo}
              title={equipoActivo ? undefined : 'El equipo está inactivo'}
            >
              <Plus size={16} /> Asignar jugador
            </button>
          )}
        </div>
        {!equipoActivo && (
          <WarningNote>El equipo está inactivo; no se pueden asignar nuevos jugadores a la plantilla.</WarningNote>
        )}
        {error && <Alert type="error">{getApiErrorMessage(error, 'No se pudo cargar la plantilla.')} <button type="button" className="btn" onClick={reload}>Reintentar</button></Alert>}
        {loading && !data ? <Spinner label="Cargando..." /> : (
          <div className="table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Jugador</th><th>Fecha inicio</th><th>Fecha fin</th><th>Estado del contrato</th><th className="col-actions">Acciones</th></tr>
                </thead>
                <tbody>
                  {actuales.map((c) => (
                    <tr key={c.id}>
                      <td><PersonCell name={c.jugador.nombreCompleto} subtitle={`${c.jugador.tipoDocumento} ${c.jugador.numeroDocumento}`} /></td>
                      <td>{formatDate(c.fechaInicio)}</td>
                      <td>{formatDate(c.fechaFin)}</td>
                      <td><ActivoBadge active /></td>
                      <td className="col-actions">
                        <div className="actions">
                          <ActionButton icon={Eye} label={`Ver a ${c.jugador.nombreCompleto}`} onClick={() => navigate(`/jugadores/${c.jugador.id}`)} />
                          {canRetire && <ActionButton icon={UserMinus} label={`Retirar a ${c.jugador.nombreCompleto}`} variant="danger" onClick={() => setRetiroTarget(c)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {actuales.length === 0 && <tr><td colSpan="5" className="table-message">Sin jugadores en la plantilla.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span className="text-muted">Mostrando {actuales.length} jugador(es) en plantilla</span></footer>
          </div>
        )}
      </section>

      <section className="panel team-section gd-skin">
        <h3 className="section-title gd-panel-title"><History size={20} /> Historial de jugadores</h3>
        {loading && !data ? <Spinner label="Cargando..." /> : (
          <div className="table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Jugador</th><th>Período</th><th>Fecha de retiro</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {historial.map((c) => (
                    <tr key={c.id}>
                      <td><PersonCell name={c.jugador.nombreCompleto} subtitle={`${c.jugador.tipoDocumento} ${c.jugador.numeroDocumento}`} /></td>
                      <td>{formatDate(c.fechaInicio)} – {formatDate(c.fechaFin)}</td>
                      <td>{c.fechaRetiro ? formatDate(c.fechaRetiro) : '—'}</td>
                      <td><ActivoBadge active={false} inactiveLabel="Retirado" /></td>
                    </tr>
                  ))}
                  {historial.length === 0 && <tr><td colSpan="4" className="table-message">Aún no hay jugadores retirados.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span className="text-muted">Mostrando {historial.length} registro(s)</span></footer>
          </div>
        )}
      </section>

      {asignando && <AsignarJugadorModal equipoId={equipoId} actuales={actuales} onClose={() => setAsignando(false)} onSaved={() => { setAsignando(false); reload() }} />}
      {retiroTarget && (
        <ConfirmDialog
          title="Retirar jugador"
          confirmLabel="Retirar"
          danger={false}
          loading={retirando}
          onConfirm={retire}
          onCancel={() => setRetiroTarget(null)}
          message={(
            <div className="page-stack">
              <p>¿Retirar a <strong>{retiroTarget.jugador.nombreCompleto}</strong> de la plantilla?</p>
              <WarningNote>El jugador dejará de pertenecer a la plantilla actual, pero su vinculación permanecerá registrada en el historial.</WarningNote>
            </div>
          )}
        />
      )}
    </>
  )
}
