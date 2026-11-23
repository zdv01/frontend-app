import { useCallback, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useToast } from '../../../hooks/useToast'
import { catalogosService, torneosService } from '../../../services'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors, validateMaxLength, validateRequired } from '../../../utils/validators'

function validate(form) {
  return {
    nombre: validateRequired(form.nombre, 'El nombre del torneo es obligatorio.') || validateMaxLength(form.nombre, 150),
    deporteId: validateRequired(form.deporteId, 'Selecciona un deporte.'),
    fechaInicio: validateRequired(form.fechaInicio, 'La fecha de inicio es obligatoria.'),
    fechaFin: validateRequired(form.fechaFin, 'La fecha de fin es obligatoria.'),
    fechaCierreInscripciones: validateRequired(form.fechaCierreInscripciones, 'La fecha de cierre es obligatoria.'),
  }
}

export function TournamentFormModal({ tournament, onClose, onSaved }) {
  const toast = useToast()
  const loadSports = useCallback(() => catalogosService.getSports({ activo: true }), [])
  const { data: sports } = useAsyncData(loadSports)
  const [form, setForm] = useState({
    nombre: tournament?.nombre ?? '',
    deporteId: tournament?.deporte?.id ?? '',
    descripcion: tournament?.descripcion ?? '',
    fechaInicio: tournament?.fechaInicio ?? '',
    fechaFin: tournament?.fechaFin ?? '',
    fechaCierreInscripciones: tournament?.fechaCierreInscripciones ?? '',
    maxEquipos: tournament?.maxEquipos ?? '',
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
      nombre: form.nombre.trim(),
      deporteId: Number(form.deporteId),
      descripcion: form.descripcion.trim() || null,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      fechaCierreInscripciones: form.fechaCierreInscripciones,
      maxEquipos: form.maxEquipos ? Number(form.maxEquipos) : null,
    }
    try {
      const saved = tournament ? await torneosService.update(tournament.id, payload) : await torneosService.create(payload)
      toast.success(tournament ? 'Torneo actualizado correctamente.' : 'Torneo registrado correctamente.')
      onSaved(saved)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else setFormError(getApiErrorMessage(error, 'No se pudo guardar el torneo.'))
      setSaving(false)
    }
  }

  return (
    <Modal title={tournament ? 'Editar torneo' : 'Registrar torneo'} onClose={onClose} size="lg">
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="form-grid">
            <FormField label="Nombre" htmlFor="tournament-name" required error={errors.nombre}>
              <input id="tournament-name" className="input" name="nombre" value={form.nombre} onChange={change} maxLength={150} autoFocus />
            </FormField>
            <FormField label="Deporte" htmlFor="tournament-sport" required error={errors.deporteId}>
              <select id="tournament-sport" className="input" name="deporteId" value={form.deporteId} onChange={change}>
                <option value="">Selecciona un deporte</option>
                {(sports ?? []).filter((sport) => sport.activo).map((sport) => <option value={sport.id} key={sport.id}>{sport.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Fecha de inicio" htmlFor="tournament-start" required error={errors.fechaInicio}>
              <input id="tournament-start" className="input" type="date" name="fechaInicio" value={form.fechaInicio} onChange={change} />
            </FormField>
            <FormField label="Fecha de fin" htmlFor="tournament-end" required error={errors.fechaFin}>
              <input id="tournament-end" className="input" type="date" name="fechaFin" value={form.fechaFin} onChange={change} />
            </FormField>
            <FormField label="Cierre de inscripciones" htmlFor="tournament-close" required error={errors.fechaCierreInscripciones}>
              <input id="tournament-close" className="input" type="date" name="fechaCierreInscripciones" value={form.fechaCierreInscripciones} onChange={change} />
            </FormField>
            <FormField label="Máximo de equipos" htmlFor="tournament-max" hint="Mínimo 2 equipos">
              <input id="tournament-max" className="input" type="number" min="2" name="maxEquipos" value={form.maxEquipos} onChange={change} />
            </FormField>
            <div className="field-full">
              <FormField label="Descripción" htmlFor="tournament-description" error={errors.descripcion}>
                <textarea id="tournament-description" className="input" name="descripcion" value={form.descripcion} onChange={change} rows={3} maxLength={500} />
              </FormField>
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
