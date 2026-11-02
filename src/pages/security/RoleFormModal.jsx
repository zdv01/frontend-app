import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../hooks/useToast'
import { rolesService } from '../../services'
import { getApiErrorCase, getApiErrorMessage, getApiFieldErrors } from '../../utils/apiError'
import { hasErrors, validateMaxLength, validateRequired } from '../../utils/validators'

function validate(form) {
  return {
    name:
      validateRequired(form.name, 'El nombre del rol es obligatorio.') ||
      validateMaxLength(form.name, 50, 'El nombre no puede superar 50 caracteres.'),
    description:
      validateRequired(form.description, 'La descripción es obligatoria.') ||
      validateMaxLength(form.description, 255, 'La descripción no puede superar 255 caracteres.'),
  }
}

// Modal "Registrar rol" / "Editar rol"
export function RoleFormModal({ role, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(role)
  const [form, setForm] = useState({
    name: role?.name ?? '',
    description: role?.description ?? '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const data = { name: form.name.trim(), description: form.description.trim() }
      const saved = isEdit ? await rolesService.update(role.id, data) : await rolesService.create(data)
      toast.success(isEdit ? 'Rol actualizado correctamente.' : 'Rol registrado correctamente.')
      onSaved(saved)
    } catch (err) {
      if (getApiErrorCase(err) === 'ALREADY_EXISTS') {
        setErrors({ name: getApiErrorMessage(err) })
      } else if (hasErrors(getApiFieldErrors(err))) {
        setErrors(getApiFieldErrors(err))
      } else {
        setFormError(getApiErrorMessage(err, 'No se pudo guardar el rol.'))
      }
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar rol' : 'Registrar rol'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}

          <FormField label="Nombre del rol" htmlFor="role-name" required error={errors.name}>
            <input
              id="role-name"
              name="name"
              className="input"
              value={form.name}
              onChange={handleChange}
              maxLength={50}
              autoFocus
            />
          </FormField>

          <FormField label="Descripción" htmlFor="role-description" required error={errors.description}>
            <textarea
              id="role-description"
              name="description"
              className="input"
              rows={3}
              value={form.description}
              onChange={handleChange}
              maxLength={255}
            />
          </FormField>

        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner size={16} />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
