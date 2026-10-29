import { useState } from 'react'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { Spinner } from '../../components/Spinner'
import { Switch } from '../../components/Switch'
import { HTTP_METHODS, MODULES, OPERATIONS, suggestEndpoint } from '../../constants/permissions'
import { useToast } from '../../hooks/useToast'
import { permissionsService } from '../../services'
import { getApiErrorCase, getApiErrorMessage, getApiFieldErrors } from '../../utils/apiError'
import { hasErrors, validateMaxLength, validateRequired } from '../../utils/validators'

const DUPLICATE_MESSAGE = 'Ya existe un permiso para esta operación y recurso.'

function validate(form, permissions, currentId) {
  const duplicated = permissions.some(
    (p) => p.id !== currentId && p.resource === form.resource && p.operation === form.operation,
  )
  const url = form.url.trim()
  return {
    resource: validateRequired(form.resource, 'Selecciona el recurso.'),
    operation:
      validateRequired(form.operation, 'Selecciona la operación.') ||
      (duplicated ? DUPLICATE_MESSAGE : ''),
    method: validateRequired(form.method, 'Selecciona el método HTTP.'),
    url:
      validateRequired(url, 'La URL es obligatoria.') ||
      (url.startsWith('/') ? '' : 'La URL debe empezar con "/".') ||
      validateMaxLength(url, 255, 'La URL no debe superar 255 caracteres.'),
  }
}

// Modal "Registrar permiso" / "Editar permiso"
export function PermissionFormModal({ permission, permissions, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(permission)
  const [form, setForm] = useState({
    resource: permission?.resource ?? '',
    operation: permission?.operation ?? '',
    method: permission?.method ?? '',
    url: permission?.url ?? '',
    active: permission?.active ?? true,
  })
  // Mientras el usuario no edite la URL o el método a mano, se sugieren solos
  const [endpointTouched, setEndpointTouched] = useState(isEdit)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setErrors((current) => ({ ...current, [name]: '' }))
    if (name === 'url' || name === 'method') setEndpointTouched(true)

    setForm((current) => {
      const next = { ...current, [name]: value }
      const isKeyField = name === 'resource' || name === 'operation'
      const suggestion = suggestEndpoint(next.resource, next.operation)
      if (isKeyField && !endpointTouched && suggestion) {
        next.method = suggestion.method
        next.url = suggestion.url
      }
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validate(form, permissions, permission?.id)
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const saved = isEdit
        ? await permissionsService.update(permission.id, form)
        : await permissionsService.create(form)
      toast.success(isEdit ? 'Permiso actualizado correctamente.' : 'Permiso registrado correctamente.')
      onSaved(saved)
    } catch (err) {
      if (getApiErrorCase(err) === 'ALREADY_EXISTS') {
        setErrors({ operation: getApiErrorMessage(err) })
      } else if (hasErrors(getApiFieldErrors(err))) {
        setErrors(getApiFieldErrors(err))
      } else {
        setFormError(getApiErrorMessage(err, 'No se pudo guardar el permiso.'))
      }
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar permiso' : 'Registrar permiso'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="form-grid">
            <FormField label="Recurso / módulo" htmlFor="perm-resource" required error={errors.resource}>
              <select
                id="perm-resource"
                name="resource"
                className="input"
                value={form.resource}
                onChange={handleChange}
                autoFocus
              >
                <option value="">Selecciona...</option>
                {MODULES.map((module) => (
                  <optgroup key={module.key} label={module.label}>
                    {module.resources.map((resource) => (
                      <option key={resource.key} value={resource.key}>
                        {resource.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </FormField>

            <FormField label="Operación" htmlFor="perm-operation" required error={errors.operation}>
              <select
                id="perm-operation"
                name="operation"
                className="input"
                value={form.operation}
                onChange={handleChange}
              >
                <option value="">Selecciona...</option>
                {OPERATIONS.map((operation) => (
                  <option key={operation.key} value={operation.key}>
                    {operation.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Método HTTP" htmlFor="perm-method" required error={errors.method}>
              <select
                id="perm-method"
                name="method"
                className="input"
                value={form.method}
                onChange={handleChange}
              >
                <option value="">Selecciona...</option>
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="URL"
              htmlFor="perm-url"
              required
              error={errors.url}
              hint="Usa {id} para la parte variable, ej. /api/users/{id}"
            >
              <input
                id="perm-url"
                name="url"
                className="input mono"
                value={form.url}
                onChange={handleChange}
                placeholder="/api/..."
                maxLength={255}
              />
            </FormField>
          </div>

          <Switch
            id="perm-active"
            checked={form.active}
            onChange={(active) => setForm((current) => ({ ...current, active }))}
            label={form.active ? 'Permiso activo' : 'Permiso inactivo (no se puede asignar)'}
          />
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
