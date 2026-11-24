import { useState } from 'react'
import { Alert } from '../../../components/Alert'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { useToast } from '../../../hooks/useToast'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors, validateEmail, validateMaxLength, validateRequired } from '../../../utils/validators'

const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PASAPORTE']

function validate(form) {
  return {
    numeroDocumento: validateRequired(form.numeroDocumento, 'El número de documento es obligatorio.') || validateMaxLength(form.numeroDocumento, 20, 'Máximo 20 caracteres.'),
    nombres: validateRequired(form.nombres, 'Los nombres son obligatorios.') || validateMaxLength(form.nombres, 100, 'Máximo 100 caracteres.'),
    apellidos: validateRequired(form.apellidos, 'Los apellidos son obligatorios.') || validateMaxLength(form.apellidos, 100, 'Máximo 100 caracteres.'),
    fechaNacimiento: validateRequired(form.fechaNacimiento, 'La fecha de nacimiento es obligatoria.'),
    email: form.email.trim() ? validateEmail(form.email) : '',
    telefono: validateMaxLength(form.telefono, 20, 'Máximo 20 caracteres.'),
  }
}

export function PlayerFormModal({ player, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    tipoDocumento: player?.tipoDocumento ?? 'CC',
    numeroDocumento: player?.numeroDocumento ?? '',
    nombres: player?.nombres ?? '',
    apellidos: player?.apellidos ?? '',
    fechaNacimiento: player?.fechaNacimiento ?? '',
    email: player?.email ?? '',
    telefono: player?.telefono ?? '',
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
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      fechaNacimiento: form.fechaNacimiento,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
    }
    try {
      const saved = player ? await jugadoresService.update(player.id, payload) : await jugadoresService.create(payload)
      toast.success(player ? 'Jugador actualizado correctamente.' : 'Jugador registrado correctamente.')
      onSaved(saved)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else setFormError(getApiErrorMessage(error, 'No se pudo guardar el jugador.'))
      setSaving(false)
    }
  }

  return (
    <Modal title={player ? 'Editar jugador' : 'Registrar jugador'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="form-grid">
            <FormField label="Tipo de documento" htmlFor="pl-tipo" required error={errors.tipoDocumento}>
              <select id="pl-tipo" className="input" name="tipoDocumento" value={form.tipoDocumento} onChange={change}>
                {TIPOS_DOCUMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </FormField>
            <FormField label="Número de documento" htmlFor="pl-doc" required error={errors.numeroDocumento}>
              <input id="pl-doc" className="input" name="numeroDocumento" value={form.numeroDocumento} onChange={change} maxLength={20} autoFocus />
            </FormField>
            <FormField label="Nombres" htmlFor="pl-nombres" required error={errors.nombres}>
              <input id="pl-nombres" className="input" name="nombres" value={form.nombres} onChange={change} maxLength={100} />
            </FormField>
            <FormField label="Apellidos" htmlFor="pl-apellidos" required error={errors.apellidos}>
              <input id="pl-apellidos" className="input" name="apellidos" value={form.apellidos} onChange={change} maxLength={100} />
            </FormField>
            <FormField label="Fecha de nacimiento" htmlFor="pl-nac" required error={errors.fechaNacimiento}>
              <input id="pl-nac" className="input" type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={change} />
            </FormField>
            <FormField label="Correo" htmlFor="pl-email" error={errors.email}>
              <input id="pl-email" className="input" name="email" value={form.email} onChange={change} maxLength={150} />
            </FormField>
            <FormField label="Teléfono" htmlFor="pl-tel" error={errors.telefono}>
              <input id="pl-tel" className="input" name="telefono" value={form.telefono} onChange={change} maxLength={20} />
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
