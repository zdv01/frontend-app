import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ActionButton } from '../../../components/ActionButton'
import { Alert } from '../../../components/Alert'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { DataTable } from '../../../components/DataTable'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { partidosService } from '../../../services/gestion/partidosService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { formatDateTime } from '../../../utils/format'
import { hasErrors, validateMaxLength, validateRequired } from '../../../utils/validators'
import { PersonCell, WarningNote } from '../jugadores/gdUi'
import '../jugadores/gd.css'

// Solo se anota en partidos que ya empezaron
const puedeAnotar = (partido) => ['EN_JUEGO', 'FINALIZADO'].includes(partido?.estado)

function validate(form) {
  const minuto = form.minuto === '' ? '' : (Number.isInteger(Number(form.minuto)) && Number(form.minuto) >= 0 ? '' : 'El minuto debe ser un entero mayor o igual a 0.')
  const valor = form.valor === '' ? '' : (Number.isInteger(Number(form.valor)) && Number(form.valor) >= 1 ? '' : 'El valor debe ser un entero mayor o igual a 1.')
  return {
    jugadorId: validateRequired(form.jugadorId, 'Selecciona el jugador.'),
    minuto,
    valor,
    descripcion: validateMaxLength(form.descripcion, 255, 'Máximo 255 caracteres.'),
  }
}

// Modal crear/editar anotación. Los jugadores salen de los contratos activos de ambos equipos (9.8)
function AnotacionModal({ partido, anotacion, onClose, onSaved }) {
  const toast = useToast()
  const cargarJugadores = useCallback(async () => {
    const [local, visitante] = await Promise.all([
      jugadoresService.listContratosEquipo(partido.equipoLocal.id),
      jugadoresService.listContratosEquipo(partido.equipoVisitante.id),
    ])
    return [
      { equipo: partido.equipoLocal, contratos: local },
      { equipo: partido.equipoVisitante, contratos: visitante },
    ]
  }, [partido])
  const jugadores = useAsyncData(cargarJugadores)
  const jugadorActual = anotacion?.jugador
  const jugadorActualFaltante = jugadorActual && jugadores.data
    && !jugadores.data.some(({ contratos }) => contratos.some((c) => c.jugador.id === jugadorActual.id))
    ? jugadorActual : null
  const [form, setForm] = useState({
    jugadorId: String(anotacion?.jugador?.id ?? ''),
    minuto: String(anotacion?.minuto ?? ''),
    valor: String(anotacion?.valor ?? '1'),
    descripcion: anotacion?.descripcion ?? '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSaving(true)
    setFormError('')
    const payload = {
      jugadorId: Number(form.jugadorId),
      minuto: form.minuto === '' ? null : Number(form.minuto),
      valor: form.valor === '' ? null : Number(form.valor),
      descripcion: form.descripcion.trim() || null,
    }
    try {
      if (anotacion) await partidosService.updateAnotacion(anotacion.id, payload)
      else await partidosService.createAnotacion(partido.id, payload)
      toast.success(anotacion ? 'Anotación actualizada correctamente.' : 'Anotación registrada correctamente.')
      onSaved()
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else setFormError(getApiErrorMessage(error, 'No se pudo guardar la anotación.'))
      setSaving(false)
    }
  }

  return (
    <Modal title={anotacion ? 'Editar anotación' : 'Registrar anotación'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}
          {jugadores.error && <Alert type="error">No se pudieron cargar los jugadores de los equipos.</Alert>}
          <div className="form-grid">
            <FormField label="Jugador" htmlFor="an-jugador" required error={errors.jugadorId}>
              <select id="an-jugador" className="input" name="jugadorId" value={form.jugadorId} onChange={change} autoFocus>
                <option value="">{jugadores.loading ? 'Cargando...' : 'Selecciona un jugador'}</option>
                {(jugadores.data ?? []).map(({ equipo, contratos }) => (
                  <optgroup key={equipo.id} label={equipo.nombre}>
                    {contratos.map((c) => <option key={c.id} value={c.jugador.id}>{c.jugador.nombreCompleto}</option>)}
                  </optgroup>
                ))}
                {/* Jugador actual de la anotación sin contrato activo: se agrega para que el select no quede vacío */}
                {jugadorActualFaltante && <option value={jugadorActualFaltante.id}>{jugadorActualFaltante.nombreCompleto} (sin contrato activo)</option>}
              </select>
            </FormField>
            <FormField label="Minuto" htmlFor="an-minuto" error={errors.minuto} hint="Opcional">
              <input id="an-minuto" className="input" type="number" min="0" name="minuto" value={form.minuto} onChange={change} />
            </FormField>
            <FormField label="Valor" htmlFor="an-valor" error={errors.valor} hint="Goles o puntos (por defecto 1)">
              <input id="an-valor" className="input" type="number" min="1" name="valor" value={form.valor} onChange={change} />
            </FormField>
            <FormField label="Descripción" htmlFor="an-desc" error={errors.descripcion}>
              <input id="an-desc" className="input" name="descripcion" value={form.descripcion} onChange={change} maxLength={255} />
            </FormField>
            <div className="gd-form-note">
              <WarningNote>El jugador debe tener contrato activo con el equipo local o con el visitante.</WarningNote>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving && <Spinner size={16} />}Guardar</button>
        </div>
      </form>
    </Modal>
  )
}

/*
 * Lista (y CRUD) de anotaciones de un partido. Componente reutilizable:
 *   <AnotacionesPartido partidoId={id} />                   en /partidos/:id (B)
 *   <AnotacionesPartido partidoId={id} soloLectura />       en /torneos/:id/desarrollo (C)
 * Con soloLectura solo pide las anotaciones (no el partido) y no muestra botones.
 * onChange(): se llama tras crear, editar o eliminar, para que la pantalla padre recargue el marcador.
 */
export function AnotacionesPartido({ partidoId, partido: partidoProp, soloLectura = false, onChange }) {
  const toast = useToast()
  // Rutas /api/anotaciones y /api/partidos/{id}/anotaciones: el recurso es "partidos" (10.4)
  const puedeCrear = useCan('partidos', 'crear') && !soloLectura
  const puedeActualizar = useCan('partidos', 'actualizar') && !soloLectura
  const puedeEliminar = useCan('partidos', 'eliminar') && !soloLectura
  const [form, setForm] = useState(null) // { anotacion } al abrir el modal
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Si el padre pasa `partido` no se vuelve a pedir; si no (uso de C), se carga aquí
  const cargarPartido = useCallback(() => (soloLectura || partidoProp ? Promise.resolve(null) : partidosService.get(partidoId)), [partidoId, soloLectura, partidoProp])
  const cargarAnotaciones = useCallback(() => partidosService.listAnotaciones(partidoId), [partidoId])
  const partidoState = useAsyncData(cargarPartido)
  const { data: anotaciones, loading, error, reload } = useAsyncData(cargarAnotaciones)
  const partido = partidoProp ?? partidoState.data

  const recargar = () => {
    reload()
    if (!partidoProp) partidoState.reload()
    onChange?.()
  }

  const remove = async () => {
    setSaving(true)
    try {
      await partidosService.removeAnotacion(deleteTarget.id)
      toast.success('Anotación eliminada correctamente.')
      recargar()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar la anotación.'))
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'minuto', label: 'Minuto', sortable: true, sortValue: (a) => a.minuto ?? 999, render: (a) => (a.minuto === null ? '—' : `${a.minuto}'`) },
    { key: 'jugador', label: 'Jugador', render: (a) => (a.jugador ? <PersonCell name={a.jugador.nombreCompleto} subtitle={`${a.jugador.tipoDocumento} ${a.jugador.numeroDocumento}`} /> : '—') },
    { key: 'equipo', label: 'Equipo', render: (a) => a.equipo?.nombre ?? '—' },
    { key: 'valor', label: 'Valor', sortable: true },
    { key: 'descripcion', label: 'Descripción', render: (a) => a.descripcion || '—' },
    { key: 'fechaRegistro', label: 'Registrada', render: (a) => formatDateTime(a.fechaRegistro) },
  ]
  if (puedeActualizar || puedeEliminar) {
    columns.push({
      key: 'actions', label: 'Acciones', className: 'col-actions',
      render: (a) => (
        <div className="actions">
          {puedeActualizar && <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ anotacion: a })} />}
          {puedeEliminar && <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(a)} />}
        </div>
      ),
    })
  }

  return (
    <section className="panel team-section gd-skin">
      <div className="gd-panel-head">
        <h2 className="section-title gd-panel-title"><Target size={20} /> Anotaciones</h2>
        {puedeCrear && (
          <button type="button" className="btn btn-primary" disabled={!puedeAnotar(partido)} onClick={() => setForm({ anotacion: null })}>
            <Plus size={18} /> Nueva anotación
          </button>
        )}
      </div>
      {puedeCrear && partido && !puedeAnotar(partido) && (
        <WarningNote>Las anotaciones solo se registran cuando el partido está En juego o Finalizado.</WarningNote>
      )}
      <DataTable columns={columns} rows={anotaciones ?? []} loading={loading} error={error} onRetry={reload} emptyMessage="Este partido no tiene anotaciones." pageSize={6} />
      {form && partido && <AnotacionModal partido={partido} anotacion={form.anotacion} onClose={() => setForm(null)} onSaved={() => { setForm(null); recargar() }} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar anotación"
          confirmLabel="Eliminar"
          loading={saving}
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
          message={<p>¿Eliminar la anotación de <strong>{deleteTarget.jugador?.nombreCompleto ?? 'este jugador'}</strong>?</p>}
        />
      )}
    </section>
  )
}
