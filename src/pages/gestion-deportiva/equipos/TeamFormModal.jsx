import { useState } from 'react'
import { Alert } from '../../../components/Alert'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { equiposService } from '../../../services'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors, validateMaxLength, validateRequired } from '../../../utils/validators'

function validate(form) {
  return {
    nombre: validateRequired(form.nombre, 'El nombre del equipo es obligatorio.') || validateMaxLength(form.nombre, 100),
    ciudad: validateRequired(form.ciudad, 'La ciudad es obligatoria.') || validateMaxLength(form.ciudad, 100),
  }
}

export function TeamFormModal({ team, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    nombre: team?.nombre ?? '',
    ciudad: team?.ciudad ?? '',
    fechaFundacion: team?.fechaFundacion ?? '',
    descripcion: team?.descripcion ?? '',
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
      ciudad: form.ciudad.trim(),
      fechaFundacion: form.fechaFundacion || null,
      descripcion: form.descripcion.trim() || null,
    }
    try {
      const saved = team ? await equiposService.update(team.id, payload) : await equiposService.create(payload)
      toast.success(team ? 'Equipo actualizado correctamente.' : 'Equipo registrado correctamente.')
      onSaved(saved)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else setFormError(getApiErrorMessage(error, 'No se pudo guardar el equipo.'))
      setSaving(false)
    }
  }

  return (
    <Modal title={team ? 'Editar equipo' : 'Registrar equipo'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="form-grid">
            <FormField label="Nombre" htmlFor="team-name" required error={errors.nombre}>
              <input id="team-name" className="input" name="nombre" value={form.nombre} onChange={change} maxLength={100} autoFocus />
            </FormField>
            <FormField label="Ciudad" htmlFor="team-city" required error={errors.ciudad}>
              <input id="team-city" className="input" name="ciudad" value={form.ciudad} onChange={change} maxLength={100} />
            </FormField>
            <FormField label="Fecha de fundación" htmlFor="team-foundation" error={errors.fechaFundacion}>
              <input id="team-foundation" className="input" type="date" name="fechaFundacion" value={form.fechaFundacion ?? ''} onChange={change} />
            </FormField>
            <FormField label="Descripción" htmlFor="team-description" error={errors.descripcion}>
              <textarea id="team-description" className="input" name="descripcion" value={form.descripcion} onChange={change} rows={3} maxLength={500} />
            </FormField>
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
