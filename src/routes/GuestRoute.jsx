import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Lo contrario de ProtectedRoute: si YA hay sesión, no tiene sentido ver el login
// o el registro, así que se envía al usuario a la página que quería abrir (o al dashboard).
export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }
  return <Outlet />
}
