import { ImagePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../components/Avatar'
import { FormField } from '../../components/FormField'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../hooks/useToast'
import { profileService } from '../../services'
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/apiError'
import { hasErrors } from '../../utils/validators'

const MAX_PHOTO_BYTES = 1024 * 1024 // 1 MB
const TODAY = new Date().toISOString().slice(0, 10)

function validate(form) {
  const phone = form.phone.trim()
  return {
    phone: !phone
      ? 'El teléfono es obligatorio.'
      : /^\+?[\d\s-]{7,20}$/.test(phone)
        ? ''
        : 'Escribe un teléfono válido (solo números, espacios, guiones y "+").',
    birthDate: !form.birthDate
      ? 'La fecha de nacimiento es obligatoria.'
      : form.birthDate >= TODAY
        ? 'La fecha de nacimiento debe estar en el pasado.'
        : '',
  }
}

// Formulario del perfil: teléfono, fecha de nacimiento y fotografía.
// Recibe los datos iniciales por props; el padre lo monta solo cuando ya cargaron.
export function ProfileForm({ userId, personName, initial, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    phone: initial?.phone ?? '',
    birthDate: initial?.birthDate ?? '',
    photo: initial?.photo ?? null,
  })
  const [exists, setExists] = useState(Boolean(initial))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  // La imagen se convierte a texto (data URL) para poder guardarla y mostrarla
  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, photo: 'El archivo debe ser una imagen.' }))
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: 'La imagen no puede superar 1 MB.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, photo: reader.result }))
      setErrors((current) => ({ ...current, photo: '' }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSaving(true)
    try {
      const data = { phone: form.phone.trim(), birthDate: form.birthDate, photo: form.photo }
      const saved = await profileService.save(userId, data, exists)
      setExists(true)
      toast.success('Perfil actualizado correctamente.')
      onSaved(saved)
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err)
      if (hasErrors(fieldErrors)) setErrors(fieldErrors)
      else toast.error(getApiErrorMessage(err, 'No se pudo guardar el perfil.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel profile-form" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">Información del perfil</h2>
      {!exists && (
        <p className="text-muted">Todavía no hay un perfil registrado. Completa los datos y guárdalos.</p>
      )}

      <div className="profile-photo">
        <Avatar name={personName} photo={form.photo} size={72} />
        <div className="profile-photo-actions">
          <label className="btn" htmlFor="profile-photo-input">
            <ImagePlus size={18} /> {form.photo ? 'Cambiar foto' : 'Subir foto'}
          </label>
          <input
            id="profile-photo-input"
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={handlePhoto}
          />
          {form.photo && (
            <button
              type="button"
              className="btn"
              onClick={() => setForm((current) => ({ ...current, photo: null }))}
            >
              <Trash2 size={18} /> Quitar foto
            </button>
          )}
          <span className="field-hint">Imagen JPG, PNG o WebP de máximo 1 MB.</span>
          {errors.photo && <span className="field-error">{errors.photo}</span>}
        </div>
      </div>

      <div className="form-grid">
        <FormField label="Teléfono" htmlFor="profile-phone" required error={errors.phone}>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={handleChange}
            placeholder="300 123 4567"
            autoComplete="tel"
          />
        </FormField>
        <FormField label="Fecha de nacimiento" htmlFor="profile-birth" required error={errors.birthDate}>
          <input
            id="profile-birth"
            name="birthDate"
            type="date"
            className="input"
            value={form.birthDate}
            onChange={handleChange}
            max={TODAY}
          />
        </FormField>
      </div>

      <div className="profile-form-footer">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Spinner size={16} />}
          Guardar cambios
        </button>
      </div>
    </form>
  )
}
