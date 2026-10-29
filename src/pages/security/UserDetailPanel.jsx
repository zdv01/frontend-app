import { CircleUserRound, Pencil, ShieldCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { Chip, StatusBadge } from '../../components/Badge'
import { DetailPanel, DetailRow } from '../../components/DetailPanel'
import { Spinner } from '../../components/Spinner'
import { getProviderLabel } from '../../constants/auth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { profileService, userRolesService } from '../../services'
import { UserRolesModal } from './UserRolesModal'

// Panel derecho de Usuarios: datos, roles y perfil, con accesos a "Gestionar roles" y "Ver perfil"
export function UserDetailPanel({ user, onClose, onEdit }) {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [rolesOpen, setRolesOpen] = useState(false)

  const loader = useCallback(
    () =>
      Promise.all([
        userRolesService.listRolesByUser(user.id),
        profileService.get(user.id).catch(() => null),
      ]),
    [user.id],
  )
  const { data, loading, reload } = useAsyncData(loader)
  const [roles, profile] = data ?? [[], null]

  return (
    <DetailPanel
      title="Detalle del usuario"
      onClose={onClose}
      actions={
        <>
          {can('usuarios', 'actualizar') && (
            <button type="button" className="btn" onClick={() => setRolesOpen(true)}>
              <ShieldCheck size={18} /> Gestionar roles
            </button>
          )}
          {can('usuarios', 'ver') && (
            <button type="button" className="btn" onClick={() => navigate(`/users/${user.id}/profile`)}>
              <CircleUserRound size={18} /> Ver perfil
            </button>
          )}
          {can('usuarios', 'actualizar') && (
            <button type="button" className="btn" onClick={onEdit}>
              <Pencil size={18} /> Editar usuario
            </button>
          )}
        </>
      }
    >
      <div className="user-cell">
        <Avatar name={user.name} photo={profile?.photo} size={48} />
        <div>
          <strong>{user.name}</strong>
          <p className="text-muted">{user.email}</p>
        </div>
      </div>

      <dl>
        <DetailRow label="Estado">
          <StatusBadge active={user.active} />
        </DetailRow>
        <DetailRow label="Acceso">{getProviderLabel(user.authProvider)}</DetailRow>
        <DetailRow label="Verificación 2FA">
          {user.authProvider !== 'local' ? 'No aplica' : user.twoFactorEnabled ? 'Activada' : 'Desactivada'}
        </DetailRow>
        <DetailRow label="Teléfono">{loading ? '…' : profile?.phone || 'Sin registrar'}</DetailRow>
      </dl>

      <div>
        <p className="detail-section-title">Roles asignados</p>
        {loading ? (
          <Spinner size={16} />
        ) : roles.length ? (
          <div className="chip-list">
            {roles.map((role) => (
              <Chip key={role.id}>{role.name}</Chip>
            ))}
          </div>
        ) : (
          <p className="text-muted">Este usuario no tiene roles asignados.</p>
        )}
      </div>

      {rolesOpen && (
        <UserRolesModal user={user} onClose={() => setRolesOpen(false)} onChanged={reload} />
      )}
    </DetailPanel>
  )
}
