import { useCallback, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useToast } from '../../../hooks/useToast'
import { catalogosService } from '../../../services/gestion/catalogosService'
import { partidosService } from '../../../services/gestion/partidosService'
import { torneosService } from '../../../services/gestion/torneosService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors, validateRequired } from '../../../utils/validators'
import { RONDAS } from './partidosUtils'
import { WarningNote } from '../jugadores/gdUi'

// Orden de las rondas de eliminación: según cuántos equipos tenga la fase final se empieza más abajo
const RONDAS_ELIMINACION = ['DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL']
const INICIO_POR_EQUIPOS = { 32: 0, 16: 1, 8: 2, 4: 3, 2: 4 }

function rondasDeFase(fase) {
  const inicio = INICIO_POR_EQUIPOS[fase?.cantidadEquipos]
  if (inicio === undefined) return Object.keys(RONDAS)
  const rondas = RONDAS_ELIMINACION.slice(inicio)
  return fase.tercerPuesto ? [...rondas.slice(0, -1), 'TERCER_PUESTO', 'FINAL'] : rondas
}

// "2026-12-05T15:30:00" (API) -> "2026-12-05T15:30" (input datetime-local)
const aInput = (valor) => (valor ? valor.slice(0, 16) : '')

function validate(form, esFinal) {
  return {
    torneoId: validateRequired(form.torneoId, 'Selecciona el torneo.'),
    faseId: validateRequired(form.faseId, 'Selecciona la fase.'),
    equipoLocalId: validateRequired(form.equipoLocalId, 'Selecciona el equipo local.'),
    equipoVisitanteId:
      validateRequired(form.equipoVisitanteId, 'Selecciona el equipo visitante.')
      || (form.equipoVisitanteId === form.equipoLocalId ? 'Un equipo no puede jugar contra sí mismo.' : ''),
    fechaHora: validateRequired(form.fechaHora, 'La fecha y hora son obligatorias.'),
    ronda: esFinal ? validateRequired(form.ronda, 'Selecciona la ronda.') : '',
    numeroLlave: esFinal ? validateRequired(form.numeroLlave, 'Indica el número de llave.') : '',
  }
}

/*
 * Crear (partido = null) o editar un partido PROGRAMADO.
 * Cadena: torneo -> fase -> equipos. Si se pasa torneoId fijo (desde PartidosTorneo) no se elige el torneo.
 */
export function PartidoFormModal({ partido, torneoId, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    torneoId: String(partido?.torneo.id ?? torneoId ?? ''),
    faseId: String(partido?.fase.id ?? ''),
    equipoLocalId: String(partido?.equipoLocal.id ?? ''),
    equipoVisitanteId: String(partido?.equipoVisitante.id ?? ''),
    fechaHora: aInput(partido?.fechaHora),
    escenarioId: String(partido?.escenario?.id ?? ''),
    ronda: partido?.ronda ?? '',
    numeroLlave: String(partido?.numeroLlave ?? ''),
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const cargarTorneos = useCallback(() => torneosService.list(), [])
  const cargarEscenarios = useCallback(() => catalogosService.getVenues(), [])
  const cargarFases = useCallback(() => (form.torneoId ? partidosService.listFases(form.torneoId) : Promise.resolve([])), [form.torneoId])
  const torneos = useAsyncData(cargarTorneos)
  const escenarios = useAsyncData(cargarEscenarios)
  const fases = useAsyncData(cargarFases)
  const fase = (fases.data ?? []).find((f) => String(f.id) === form.faseId) ?? null
  const esFinal = (fase?.tipo ?? partido?.fase?.tipo) === 'FINAL'
  const catalogError = torneos.error || escenarios.error || fases.error || equipos.error
  const cargandoDependencias = fases.loading || equipos.loading

  // Equipos candidatos: los del grupo si la fase es GRUPO; los inscritos al torneo si es FINAL
  const cargarEquipos = useCallback(() => {
    if (!fase) return Promise.resolve([])
    if (fase.tipo === 'GRUPO') return partidosService.listEquiposGrupo(fase.id)
    return torneosService.getInscriptions(form.torneoId).then((inscripciones) => inscripciones.map((i) => i.equipo))
  }, [fase, form.torneoId])
  const equipos = useAsyncData(cargarEquipos)

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      // Al cambiar el torneo o la fase se limpian los campos que dependen de ellos
      if (name === 'torneoId') Object.assign(next, { faseId: '', equipoLocalId: '', equipoVisitanteId: '', ronda: '', numeroLlave: '' })
      if (name === 'faseId') Object.assign(next, { equipoLocalId: '', equipoVisitanteId: '', ronda: '', numeroLlave: '' })
      return next
    })
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form, esFinal)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSaving(true)
    setFormError('')
    const payload = {
      equipoLocalId: Number(form.equipoLocalId),
      equipoVisitanteId: Number(form.equipoVisitanteId),
      fechaHora: `${form.fechaHora}:00`,
      escenarioId: form.escenarioId ? Number(form.escenarioId) : null,
      ronda: esFinal ? form.ronda : null,
      numeroLlave: esFinal ? Number(form.numeroLlave) : null,
    }
    try {
      const saved = partido ? await partidosService.update(partido.id, payload) : await partidosService.create(Number(form.faseId), payload)
      toast.success(partido ? 'Partido actualizado correctamente.' : 'Partido programado correctamente.')
      onSaved(saved)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else setFormError(getApiErrorMessage(error, 'No se pudo guardar el partido.'))
      setSaving(false)
    }
  }

  const listaEquipos = equipos.data ?? []
  return (
    <Modal title={partido ? 'Editar partido' : 'Programar partido'} onClose={onClose} size="lg">
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}
          {catalogError && (
            <Alert type="error">
              {getApiErrorMessage(catalogError, 'No se pudieron cargar todos los catálogos del formulario.')}
            </Alert>
          )}
          <div className="form-grid">
            <FormField label="Torneo" htmlFor="pt-torneo" required error={errors.torneoId}>
              <select id="pt-torneo" className="input" name="torneoId" value={form.torneoId} onChange={change} disabled={Boolean(partido || torneoId)}>
                <option value="">Selecciona un torneo</option>
                {(torneos.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Fase" htmlFor="pt-fase" required error={errors.faseId}>
              <select id="pt-fase" className="input" name="faseId" value={form.faseId} onChange={change} disabled={Boolean(partido) || !form.torneoId}>
                <option value="">{fases.loading ? 'Cargando...' : 'Selecciona una fase'}</option>
                {(fases.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Equipo local" htmlFor="pt-local" required error={errors.equipoLocalId}>
              <select id="pt-local" className="input" name="equipoLocalId" value={form.equipoLocalId} onChange={change} disabled={!fase}>
                <option value="">{equipos.loading && fase ? 'Cargando...' : 'Selecciona el equipo'}</option>
                {listaEquipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Equipo visitante" htmlFor="pt-visitante" required error={errors.equipoVisitanteId}>
              <select id="pt-visitante" className="input" name="equipoVisitanteId" value={form.equipoVisitanteId} onChange={change} disabled={!fase}>
                <option value="">{equipos.loading && fase ? 'Cargando...' : 'Selecciona el equipo'}</option>
                {listaEquipos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Fecha y hora" htmlFor="pt-fecha" required error={errors.fechaHora}>
              <input id="pt-fecha" className="input" type="datetime-local" name="fechaHora" value={form.fechaHora} onChange={change} />
            </FormField>
            <FormField label="Escenario" htmlFor="pt-escenario" error={errors.escenarioId}>
              <select id="pt-escenario" className="input" name="escenarioId" value={form.escenarioId} onChange={change}>
                <option value="">Sin escenario</option>
                {(escenarios.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </FormField>
            {esFinal && (
              <>
                <FormField label="Ronda" htmlFor="pt-ronda" required error={errors.ronda}>
                  <select id="pt-ronda" className="input" name="ronda" value={form.ronda} onChange={change}>
                    <option value="">Selecciona la ronda</option>
                    {rondasDeFase(fase).map((r) => <option key={r} value={r}>{RONDAS[r]}</option>)}
                  </select>
                </FormField>
                <FormField label="Número de llave" htmlFor="pt-llave" required error={errors.numeroLlave}>
                  <input id="pt-llave" className="input" type="number" min="1" name="numeroLlave" value={form.numeroLlave} onChange={change} />
                </FormField>
              </>
            )}
            <div className="gd-form-note">
              <WarningNote>Solo se pueden editar los partidos en estado Programado. Los equipos deben estar habilitados en la fase elegida.</WarningNote>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || cargandoDependencias}>{saving && <Spinner size={16} />}Guardar</button>
        </div>
      </form>
    </Modal>
  )
}
