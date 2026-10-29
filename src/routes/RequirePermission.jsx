import { ShieldX } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useCan } from '../hooks/useCan'

/*
 * Puerta por permiso: si ninguno de los roles del usuario tiene el permiso,
 * se muestra "Acceso denegado" en lugar de la pantalla (aunque se escriba la URL a mano).
 */
export function RequirePermission({ resource, operation }) {
  const allowed = useCan(resource, operation)
  if (allowed) return <Outlet />

  return (
    <div className="empty-state">
      <ShieldX size={48} className="empty-state-icon danger" aria-hidden="true" />
      <h2 className="section-title">Acceso denegado</h2>
      <p className="text-muted">
        Ninguno de tus roles tiene permiso para ver esta sección. Si crees que es un error,
        contacta al administrador.
      </p>
      <Link to="/dashboard" className="btn">
        Volver al inicio
      </Link>
    </div>
  )
}
