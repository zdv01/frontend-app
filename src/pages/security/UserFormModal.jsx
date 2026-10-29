import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { PasswordChecklist, PasswordInput } from '../../components/PasswordInput'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../hooks/useToast'
import { usersService } from '../../services'
import { getApiErrorCase, getApiErrorMessage, getApiFieldErrors } from '../../utils/apiError'
import { hasErrors, validateEmail, validatePassword } from '../../utils/validators'

function validate(form, { isEdit, isOAuth }) {
  const name = form.name.trim()
  return {
    name: !name
      ? 'El nombre es obligatorio.'
      : name.length < 2 || name.length > 100
        ? 'El nombre debe tener entre 2 y 100 caracteres.'
        : '',
    email: isOAuth ? '' : validateEmail(form.email),
    // Al editar, la contraseña solo se valida si se escribió una nueva
    password: isOAuth || (isEdit && !form.password) ? '' : validatePassword(form.password),
  }
}

// Modal "Registrar usuario" / "Editar usuario"
export function UserFormModal({ user, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(user)
  // A los usuarios de Google/GitHub/Microsoft no se les cambia el correo ni la contraseña
  const isOAuth = isEdit && user.authProvider !== 'local'

  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', password: '' })
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
    const newErrors = validate(form, { isEdit, isOAuth })
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const data = { name: form.name.trim(), email: form.email.trim(), password: form.password }
      const saved = isEdit ? await usersService.update(user.id, data) : await usersService.create(data)
      toast.success(isEdit ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.')
      onSaved(saved)
    } catch (err) {
      if (getApiErrorCase(err) === 'ALREADY_EXISTS') {
        setErrors({ email: getApiErrorMessage(err) })
      } else if (hasErrors(getApiFieldErrors(err))) {
        setErrors(getApiFieldErrors(err))
      } else {
        setFormError(getApiErrorMessage(err, 'No se pudo guardar el usuario.'))
      }
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar usuario' : 'Registrar usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}

          <FormField label="Nombre completo" htmlFor="user-name" required error={errors.name}>
            <input
              id="user-name"
              name="name"
              className="input"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              autoFocus
            />
          </FormField>

          <FormField
            label="Correo electrónico"
            htmlFor="user-email"
            required
            error={errors.email}
            hint={isOAuth ? 'El correo lo administra el proveedor de inicio de sesión.' : undefined}
          >
            <input
              id="user-email"
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              disabled={isOAuth}
            />
          </FormField>

          {!isOAuth && (
            <FormField
              label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
              htmlFor="user-password"
              required={!isEdit}
              error={errors.password}
              hint={isEdit ? 'Déjala vacía para conservar la contraseña actual.' : undefined}
            >
              <PasswordInput
                id="user-password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
              />
              {(!isEdit || form.password) && <PasswordChecklist password={form.password} />}
            </FormField>
          )}
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
