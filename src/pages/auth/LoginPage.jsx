import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { GitHubIcon, GoogleIcon, MicrosoftIcon } from '../../components/BrandIcons'
import { FormField } from '../../components/FormField'
import { PasswordInput } from '../../components/PasswordInput'
import { Spinner } from '../../components/Spinner'
import { env } from '../../config/env'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { hasErrors, validateEmail } from '../../utils/validators'

const OAUTH_BUTTONS = [
  { provider: 'google', label: 'Google', Icon: GoogleIcon },
  { provider: 'github', label: 'GitHub', Icon: GitHubIcon },
  { provider: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
]

// HU-SE-08: iniciar sesión con correo y contraseña o con un proveedor externo
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice

  const [form, setForm] = useState({ email: '', password: '' })
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
      email: validateEmail(form.email),
      password: form.password ? '' : 'La contraseña es obligatoria.',
    }
    setErrors(newErrors)
    if (hasErrors(newErrors)) return

    setSubmitting(true)
    setFormError('')
    try {
      const result = await login(form.email.trim(), form.password)
      if (result.requires2FA) {
        // La sesión NO se abre todavía: falta validar el código
        navigate('/verify-2fa', {
          state: {
            challengeId: result.challengeId,
            email: result.email,
            devCode: result.devCode,
            from: location.state?.from,
          },
        })
      }
      // Si no requiere 2FA, GuestRoute detecta la sesión y redirige solo
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo iniciar sesión.'))
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">Ingresa con tu cuenta para administrar la plataforma.</p>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {formError && <Alert type="error">{formError}</Alert>}

      <FormField label="Correo electrónico" htmlFor="login-email" required error={errors.email}>
        <input
          id="login-email"
          name="email"
          type="email"
          className="input"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          autoFocus
        />
      </FormField>

      <FormField label="Contraseña" htmlFor="login-password" required error={errors.password}>
        <PasswordInput
          id="login-password"
          name="password"
          value={form.password}
          onChange={handleChange}
          invalid={Boolean(errors.password)}
        />
      </FormField>

      <div className="auth-row">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? <Spinner size={18} /> : <LogIn size={18} />}
        Ingresar
      </button>

      <div className="auth-divider">o continúa con</div>

      <div className="oauth-buttons">
        {OAUTH_BUTTONS.map(({ provider, label, Icon }) => (
          <button
            key={provider}
            type="button"
            className="btn"
            disabled={submitting}
            onClick={() => window.location.assign(authService.getOAuthUrl(provider))}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      <p className="auth-footer-text">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>

      {env.useMocks && (
        <div className="dev-hint">
          <strong>Modo de prueba.</strong> Usa <code>admin@uc.edu.co</code> /{' '}
          <code>Admin123!</code>. Con <code>coordinador@uc.edu.co</code> se pide código 2FA y{' '}
          <code>consulta@uc.edu.co</code> tiene permisos limitados.
        </div>
      )}
    </form>
  )
}
