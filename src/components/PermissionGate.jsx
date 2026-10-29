import { useCan } from '../hooks/useCan'

/*
 * Muestra su contenido solo si el usuario tiene el permiso.
 * Ejemplo:
 *   <PermissionGate resource="usuarios" operation="crear">
 *     <button>+ Nuevo usuario</button>
 *   </PermissionGate>
 */
export function PermissionGate({ resource, operation, children, fallback = null }) {
  const allowed = useCan(resource, operation)
  return allowed ? children : fallback
}
