import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { PasswordChecklist, PasswordInput } from '../../components/PasswordInput'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { getApiErrorCase, getApiErrorMessage, getApiFieldErrors } from '../../utils/apiError'
import {
  hasErrors,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../../utils/validators'

function validate(form) {
  const name = form.name.trim()
  return {
    name: !name
      ? 'El nombre es obligatorio.'
      : name.length < 2 || name.length > 100
        ? 'El nombre debe tener entre 2 y 100 caracteres.'
        : '',
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: validatePasswordConfirmation(form.password, form.confirmPassword),
  }
}

// HU-SE-07: registrarse con nombre, correo y contraseña
export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
    const newErrors = validate(form)
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSubmitting(true)
    setFormError('')
    try {
      const result = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      if (result?.token) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/login', {
          replace: true,
          state: { notice: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' },
        })
      }
    } catch (err) {
      if (getApiErrorCase(err) === 'ALREADY_EXISTS') {
        setErrors({ email: 'El correo ya está registrado.' })
      } else if (hasErrors(getApiFieldErrors(err))) {
        setErrors(getApiFieldErrors(err))
      } else {
        setFormError(getApiErrorMessage(err, 'No se pudo crear la cuenta.'))
      }
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Regístrate con tu correo y una contraseña segura.</p>
      </div>

      {formError && <Alert type="error">{formError}</Alert>}

      <FormField label="Nombre completo" htmlFor="register-name" required error={errors.name}>
        <input
          id="register-name"
          name="name"
          className="input"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          maxLength={100}
          autoFocus
        />
      </FormField>

      <FormField label="Correo electrónico" htmlFor="register-email" required error={errors.email}>
        <input
          id="register-email"
          name="email"
          type="email"
          className="input"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
        />
      </FormField>

      <FormField label="Contraseña" htmlFor="register-password" required error={errors.password}>
        <PasswordInput
          id="register-password"
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
        htmlFor="register-confirm"
        required
        error={errors.confirmPassword}
      >
        <PasswordInput
          id="register-confirm"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
        />
      </FormField>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting && <Spinner size={18} />}
        Crear cuenta
      </button>

      <Alert type="info">
        Si ingresas con Google, GitHub o Microsoft no necesitas registrarte: tu cuenta se crea
        automáticamente la primera vez.
      </Alert>

      <p className="auth-footer-text">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  )
}
