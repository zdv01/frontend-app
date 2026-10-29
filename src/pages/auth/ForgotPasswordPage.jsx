import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { Spinner } from '../../components/Spinner'
import { env } from '../../config/env'
import { authService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { validateEmail } from '../../utils/validators'

// HU-SE-09 (paso 1): pedir el enlace de recuperación
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [devResetToken, setDevResetToken] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const emailError = validateEmail(email)
    setError(emailError)
    if (emailError) return

    setSubmitting(true)
    try {
      const result = await authService.forgotPassword(email.trim())
      setDevResetToken(result.devResetToken ?? null)
      setSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar la solicitud.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    // Mismo mensaje exista o no el correo, para no revelar qué cuentas existen
    return (
      <div className="auth-center">
        <MailCheck size={48} className="auth-heading-icon" aria-hidden="true" />
        <h1 className="auth-title">Revisa tu correo</h1>
        <p className="auth-subtitle">
          Si <strong>{email.trim()}</strong> está registrado con correo y contraseña, recibirás un
          enlace para crear una nueva contraseña. El enlace vence en 30 minutos y solo se puede
          usar una vez.
        </p>
        {env.useMocks && (
          <div className="dev-hint">
            <strong>Modo de prueba.</strong>{' '}
            {devResetToken ? (
              <Link to={`/reset-password?token=${devResetToken}`}>Abrir el enlace del correo</Link>
            ) : (
              'Ese correo no tiene cuenta local activa, así que no se generó enlace.'
            )}
          </div>
        )}
        <Link to="/login" className="btn">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <FormField label="Correo electrónico" htmlFor="forgot-email" required error={error}>
        <input
          id="forgot-email"
          type="email"
          className="input"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
          autoComplete="email"
          autoFocus
        />
      </FormField>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting && <Spinner size={18} />}
        Enviar enlace
      </button>

      <Alert type="info">
        Si ingresas con Google, GitHub o Microsoft, recupera el acceso directamente con ese
        proveedor.
      </Alert>

      <p className="auth-footer-text">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </form>
  )
}
