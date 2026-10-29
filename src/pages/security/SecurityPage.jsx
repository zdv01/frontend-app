import { CircleCheck, CircleMinus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip } from '../../components/Badge'
import { DetailRow } from '../../components/DetailPanel'
import { getProviderLabel } from '../../constants/auth'
import { MODULES, OPERATIONS, permissionKey } from '../../constants/permissions'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/format'

/*
 * Seguridad de la cuenta: datos de la sesión actual y permisos efectivos.
 * Permisos efectivos = la suma de los permisos de todos los roles del usuario.
 */
export function SecurityPage() {
  const { user, expiresAt, permissions } = useAuth()
  const isLocal = user.authProvider === 'local'

  return (
    <div className="page-stack">
      <section className="panel">
        <h2 className="section-title">Sesión actual</h2>
        <dl className="security-list">
          <DetailRow label="Usuario">{user.email}</DetailRow>
          <DetailRow label="Método de acceso">{getProviderLabel(user.authProvider)}</DetailRow>
          <DetailRow label="La sesión vence">{formatDateTime(expiresAt)}</DetailRow>
          <DetailRow label="Verificación 2FA">
            {isLocal ? (
              <>
                {user.twoFactorEnabled ? 'Activada' : 'Desactivada'} ·{' '}
                <Link to="/profile">Cambiar en Mi perfil</Link>
              </>
            ) : (
              `No aplica: la gestiona ${getProviderLabel(user.authProvider)}`
            )}
          </DetailRow>
          <DetailRow label="Roles">
            {user.roles.length ? (
              <span className="chip-list">
                {user.roles.map((role) => (
                  <Chip key={role.id}>{role.name}</Chip>
                ))}
              </span>
            ) : (
              'Sin roles asignados'
            )}
          </DetailRow>
        </dl>
      </section>

      <section className="panel">
        <h2 className="section-title">Tus permisos efectivos</h2>
        <p className="text-muted">
          Puedes realizar una operación si al menos uno de tus roles tiene el permiso. Total:{' '}
          {permissions.length}.
        </p>
        <div className="table-scroll">
          <table className="data-table security-matrix">
            <thead>
              <tr>
                <th>Recurso</th>
                {OPERATIONS.map((op) => (
                  <th key={op.key}>{op.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.flatMap((module) =>
                module.resources.map((resource) => (
                  <tr key={resource.key}>
                    <td>
                      {resource.label} <span className="text-muted">· {module.label}</span>
                    </td>
                    {OPERATIONS.map((op) => {
                      const has = permissions.includes(permissionKey(resource.key, op.key))
                      return (
                        <td key={op.key} className={has ? 'perm-yes' : 'perm-no'}>
                          {has ? (
                            <CircleCheck size={18} aria-label="Sí" />
                          ) : (
                            <CircleMinus size={18} aria-label="No" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
