import { KeyRound, Pencil, Users } from 'lucide-react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../../components/Badge'
import { DetailPanel, DetailRow } from '../../components/DetailPanel'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { rolePermissionsService, userRolesService } from '../../services'

// Panel derecho de Roles: resumen y accesos a "Usuarios del rol" y "Permisos del rol"
export function RoleDetailPanel({ role, onClose, onEdit }) {
  const { can } = useAuth()
  const navigate = useNavigate()

  const loader = useCallback(
    () =>
      Promise.all([
        userRolesService.listUsersByRole(role.id),
        rolePermissionsService.listPermissionIds(role.id),
      ]),
    [role.id],
  )
  const { data, loading } = useAsyncData(loader)
  const [users, permissionIds] = data ?? [[], []]

  return (
    <DetailPanel
      title="Detalle del rol"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={() => navigate(`/roles/${role.id}/users`)}>
            <Users size={18} /> Usuarios del rol
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/role-permissions?roleId=${role.id}`)}
          >
            <KeyRound size={18} /> Permisos del rol
          </button>
          {can('roles', 'actualizar') && (
            <button type="button" className="btn" onClick={onEdit}>
              <Pencil size={18} /> Editar rol
            </button>
          )}
        </>
      }
    >
      <div>
        <strong>{role.name}</strong>
        <p className="text-muted">{role.description}</p>
      </div>
      <dl>
        <DetailRow label="Estado">
          <StatusBadge active={role.active} />
        </DetailRow>
        <DetailRow label="Usuarios">{loading ? '…' : users.length}</DetailRow>
        <DetailRow label="Permisos">{loading ? '…' : permissionIds.length}</DetailRow>
      </dl>
    </DetailPanel>
  )
}
