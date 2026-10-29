import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { PasswordChecklist, PasswordInput } from '../../components/PasswordInput'
import { Spinner } from '../../components/Spinner'
import { authService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { hasErrors, validatePassword, validatePasswordConfirmation } from '../../utils/validators'

// HU-SE-09 (paso 2): crear la nueva contraseña desde el enlace del correo (?token=...)
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = {
      password: validatePassword(form.password),
      confirmPassword: validatePasswordConfirmation(form.password, form.confirmPassword),
    }
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSubmitting(true)
    setFormError('')
    try {
      await authService.resetPassword(token, form.password)
      navigate('/login', {
        replace: true,
        state: { notice: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' },
      })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo cambiar la contraseña.'))
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-center">
        <h1 className="auth-title">Enlace no válido</h1>
        <Alert type="error">
          El enlace de recuperación está incompleto. Solicita uno nuevo desde «¿Olvidaste tu
          contraseña?».
        </Alert>
        <Link to="/forgot-password" className="btn">
          Solicitar un nuevo enlace
        </Link>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <h1 className="auth-title">Nueva contraseña</h1>
        <p className="auth-subtitle">Elige una contraseña segura para tu cuenta.</p>
      </div>

      {formError && (
        <Alert type="error">
          {formError} <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
        </Alert>
      )}

      <FormField label="Nueva contraseña" htmlFor="reset-password" required error={errors.password}>
        <PasswordInput
          id="reset-password"
          name="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
        />
        <PasswordChecklist password={form.password} />
      </FormField>

      <FormField
        label="Confirmar contraseña"
        htmlFor="reset-confirm"
        required
        error={errors.confirmPassword}
      >
        <PasswordInput
          id="reset-confirm"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
        />
      </FormField>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting && <Spinner size={18} />}
        Guardar contraseña
      </button>

      <p className="auth-footer-text">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </form>
  )
}
