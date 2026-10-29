import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { FormField } from '../../components/FormField'
import { Spinner } from '../../components/Spinner'
import { env } from '../../config/env'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { authService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'

/*
 * HU-SE-10: segundo paso del inicio de sesión.
 * Se llega aquí desde el login con { challengeId, email } en el "state" de la navegación.
 * Hasta que el código sea correcto NO hay sesión.
 */
export function TwoFactorPage() {
  const { verifyTwoFactor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const challenge = location.state

  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(challenge?.devCode)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  // Si se abre la URL directamente (sin pasar por el login), no hay nada que verificar
  if (!challenge?.challengeId) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Escribe el código de 6 dígitos.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await verifyTwoFactor(challenge.challengeId, code)
      navigate(challenge.from?.pathname ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo verificar el código.'))
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      const result = await authService.resendTwoFactor(challenge.challengeId)
      setDevCode(result.devCode)
      setCode('')
      toast.info('Te enviamos un código nuevo a tu correo.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo reenviar el código.'))
    } finally {
      setResending(false)
    }
  }

  // Cancelar: vuelve al login sin sesión
  const handleCancel = () => navigate('/login', { replace: true })

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <ShieldCheck size={40} className="auth-heading-icon" aria-hidden="true" />
        <h1 className="auth-title">Verificación en dos pasos</h1>
        <p className="auth-subtitle">
          Enviamos un código de 6 dígitos a <strong>{challenge.email}</strong>. Vence en 5 minutos.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <FormField label="Código de verificación" htmlFor="two-factor-code" required>
        <input
          id="two-factor-code"
          className="input code-input"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
        />
      </FormField>

      <button type="submit" className="btn btn-primary" disabled={submitting || code.length < 6}>
        {submitting && <Spinner size={18} />}
        Verificar
      </button>

      <div className="auth-actions">
        <button type="button" className="btn" onClick={handleCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="button" className="btn" onClick={handleResend} disabled={resending || submitting}>
          {resending && <Spinner size={16} />}
          Reenviar código
        </button>
      </div>

      {env.useMocks && devCode && (
        <div className="dev-hint">
          <strong>Modo de prueba.</strong> No se envían correos; tu código es <code>{devCode}</code>.
        </div>
      )}
    </form>
  )
}
