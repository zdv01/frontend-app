import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { Spinner } from '../../components/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { getApiErrorMessage } from '../../utils/apiError'

/*
 * Regreso desde Google/GitHub/Microsoft (HU-SE-08).
 * El backend redirige aquí con ?token=...&expiresAt=... (o ?error=...).
 * Con eso se abre la sesión interna, igual que con el login normal.
 */
export function OAuthCallbackPage() {
  const { completeOAuth } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    completeOAuth(Object.fromEntries(searchParams))
      .then(() => active && navigate('/dashboard', { replace: true }))
      .catch((err) => active && setError(getApiErrorMessage(err, 'No se pudo iniciar sesión.')))
    return () => {
      active = false
    }
  }, [completeOAuth, navigate, searchParams])

  return (
    <div className="auth-center">
      <h1 className="auth-title">Inicio de sesión externo</h1>
      {error ? (
        <>
          <Alert type="error">{error}</Alert>
          <Link to="/login" className="btn">
            Volver al inicio de sesión
          </Link>
        </>
      ) : (
        <Spinner label="Completando el inicio de sesión..." />
      )}
    </div>
  )
}
