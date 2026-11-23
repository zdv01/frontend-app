import { useState } from 'react'
import { Alert } from '../../../components/Alert'
import { FormField } from '../../../components/FormField'
import { Modal } from '../../../components/Modal'
import { Spinner } from '../../../components/Spinner'
import { Switch } from '../../../components/Switch'
import { useToast } from '../../../hooks/useToast'
import { fasesService } from '../../../services/gestion/fasesService'
import { getApiErrorMessage, getApiFieldErrors } from '../../../utils/apiError'
import { hasErrors, validateMaxLength, validateRequired } from '../../../utils/validators'

const CANTIDADES_EQUIPOS = [2, 4, 8, 16, 32]

function validate(form) {
  const errors = {}

  const nombreError =
    validateRequired(form.nombre, 'El nombre de la fase final es obligatorio.') ||
    validateMaxLength(form.nombre, 100)
  if (nombreError) errors.nombre = nombreError

  const ordenNumero = Number(form.orden)
  if (form.orden === '' || !Number.isInteger(ordenNumero) || ordenNumero < 1) {
    errors.orden = 'El orden debe ser un número entero mayor o igual a 1.'
  }

  const cantidadNumero = Number(form.cantidadEquipos)
  if (!CANTIDADES_EQUIPOS.includes(cantidadNumero)) {
    errors.cantidadEquipos = 'Selecciona una cantidad válida de equipos (2, 4, 8, 16 o 32).'
  }

  return errors
}

export function FaseFinalFormModal({ torneoId, faseFinal = null, onClose, onSaved }) {
  const toast = useToast()
  const isEditing = Boolean(faseFinal)
  const lockCantidad = isEditing && (faseFinal?.cantidadPartidos ?? 0) > 0

  const [form, setForm] = useState({
    nombre: faseFinal?.nombre ?? 'Fase final',
    orden: faseFinal?.orden ?? 2,
    cantidadEquipos: faseFinal?.cantidadEquipos ?? 4,
    tercerPuesto: Boolean(faseFinal?.tercerPuesto ?? false),
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
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    setFormError('')

    const payload = {
      nombre: form.nombre.trim(),
      orden: Number(form.orden),
      cantidadEquipos: Number(form.cantidadEquipos),
      tercerPuesto: Boolean(form.tercerPuesto),
    }

    try {
      const saved = isEditing
        ? await fasesService.actualizarFaseFinal(faseFinal.id, payload)
        : await fasesService.crearFaseFinal(torneoId, payload)

      toast.success(
        isEditing
          ? 'Fase final actualizada correctamente.'
          : 'Fase final configurada correctamente.',
      )
      onSaved(saved)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (hasErrors(fieldErrors)) {
        setErrors(fieldErrors)
      } else {
        setFormError(getApiErrorMessage(error, 'No se pudo guardar la fase final.'))
      }
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar fase final' : 'Configurar fase final'}
      onClose={saving ? () => {} : onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="form-grid">
            <div className="field-full">
              <FormField label="Nombre" htmlFor="ff-nombre" required error={errors.nombre}>
                <input
                  id="ff-nombre"
                  name="nombre"
                  className="input"
                  value={form.nombre}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Ej. Fase final"
                  autoFocus
                />
              </FormField>
            </div>

            <FormField
              label="Orden"
              htmlFor="ff-orden"
              required
              error={errors.orden}
              hint="Debe ser mayor al orden de las fases de grupos."
            >
              <input
                id="ff-orden"
                name="orden"
                type="number"
                min={1}
                step={1}
                className="input"
                value={form.orden}
                onChange={handleChange}
              />
            </FormField>

            <FormField
              label="Cantidad de equipos"
              htmlFor="ff-cantidad"
              required
              error={errors.cantidadEquipos}
              hint={
                lockCantidad
                  ? 'No se puede modificar porque ya existen partidos en esta fase final.'
                  : 'Potencia de 2 para armar las llaves eliminatorias.'
              }
            >
              <select
                id="ff-cantidad"
                name="cantidadEquipos"
                className="input"
                value={form.cantidadEquipos}
                onChange={handleChange}
                disabled={lockCantidad}
              >
                {CANTIDADES_EQUIPOS.map((cantidad) => (
                  <option key={cantidad} value={cantidad}>
                    {cantidad} equipos
                  </option>
                ))}
              </select>
            </FormField>

            <div className="field-full">
              <Switch
                id="ff-tercer-puesto"
                checked={form.tercerPuesto}
                onChange={(checked) => setForm((current) => ({ ...current, tercerPuesto: checked }))}
                label="Incluir partido por el tercer puesto"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner size={16} />}
            {isEditing ? 'Guardar cambios' : 'Configurar fase final'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
