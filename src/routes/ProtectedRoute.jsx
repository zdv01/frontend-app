import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Puerta de las rutas privadas: sin sesión → al login.
// Se guarda en "state" la página que se quería abrir para volver a ella después
// (salvo que el usuario haya cerrado sesión a propósito).
export function ProtectedRoute() {
  const { isAuthenticated, loggedOut } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location }} />
  }
  return <Outlet />
}
