import { ArrowLeft, ShieldX, UserMinus, UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActionButton } from '../../components/ActionButton'
import { Avatar } from '../../components/Avatar'
import { StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CrudToolbar } from '../../components/CrudToolbar'
import { DataTable } from '../../components/DataTable'
import { PermissionGate } from '../../components/PermissionGate'
import { Spinner } from '../../components/Spinner'
import { getProviderLabel } from '../../constants/auth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { rolesService, userRolesService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../utils/format'
import { AddUsersModal } from './AddUsersModal'

// HU-SE-04: ver los usuarios de un rol, agregar nuevos y retirarlos
export function RoleUsersPage() {
  const { roleId } = useParams()
  const id = Number(roleId)
  const { user: currentUser, can, refreshSession } = useAuth()
  const toast = useToast()

  const loader = useCallback(
    () => Promise.all([rolesService.get(id), userRolesService.listUsersByRole(id)]),
    [id],
  )
  const { data, loading, error, reload } = useAsyncData(loader)
  const [role, users] = data ?? [null, null]

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  const filtered = useMemo(
    () =>
      (users ?? []).filter(
        (u) => matchesSearch(search, u.name, u.email) && matchesStatus(status, u.active),
      ),
    [users, search, status],
  )

  const afterChange = async (affectedIds) => {
    reload()
    if (affectedIds.includes(currentUser.id)) await refreshSession()
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await userRolesService.remove(removeTarget.id, id)
      toast.success(`${removeTarget.name} fue retirado del rol ${role.name}.`)
      await afterChange([removeTarget.id])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo retirar el usuario del rol.'))
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  if (error?.response?.status === 404) {
    return (
      <div className="empty-state">
        <ShieldX size={48} className="empty-state-icon" aria-hidden="true" />
        <h2 className="section-title">El rol no existe</h2>
        <Link to="/roles" className="btn">
          Volver a Roles
        </Link>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (u) => (
        <span className="user-cell">
          <Avatar name={u.name} size={32} />
          {u.name}
        </span>
      ),
    },
    { key: 'email', label: 'Correo', sortable: true },
    { key: 'authProvider', label: 'Acceso', render: (u) => getProviderLabel(u.authProvider) },
    { key: 'active', label: 'Estado', render: (u) => <StatusBadge active={u.active} /> },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'col-actions',
      render: (u) =>
        can('roles', 'actualizar') && (
          <ActionButton
            icon={UserMinus}
            label="Retirar del rol"
            variant="danger"
            onClick={() => setRemoveTarget(u)}
          />
        ),
    },
  ]

  return (
    <div className="page-stack">
      <Link to="/roles" className="back-link">
        <ArrowLeft size={16} /> Volver a Roles
      </Link>

      <div className="panel role-header">
        {role ? (
          <>
            <div>
              <h2 className="section-title">{role.name}</h2>
              <p className="text-muted">{role.description}</p>
            </div>
            <div className="role-header-meta">
              <StatusBadge active={role.active} />
              <span className="text-muted">
                {users?.length ?? 0} usuario{users?.length === 1 ? '' : 's'} con este rol
              </span>
            </div>
          </>
        ) : (
          <Spinner label="Cargando rol..." />
        )}
      </div>

      <CrudToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar usuario del rol"
        status={status}
        onStatusChange={setStatus}
      >
        <PermissionGate resource="roles" operation="actualizar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAdding(true)}
            disabled={!role}
          >
            <UserPlus size={18} /> Agregar usuarios
          </button>
        </PermissionGate>
      </CrudToolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyMessage="Este rol todavía no tiene usuarios asignados."
      />

      {adding && role && (
        <AddUsersModal
          role={role}
          assignedIds={(users ?? []).map((u) => u.id)}
          onClose={() => setAdding(false)}
          onAdded={async (addedIds) => {
            setAdding(false)
            await afterChange(addedIds)
          }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Retirar usuario del rol"
          confirmLabel="Retirar"
          loading={removing}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          message={
            <p>
              ¿Retirar a <strong>{removeTarget.name}</strong> del rol <strong>{role.name}</strong>?
              El usuario y el rol seguirán existiendo en el sistema; solo se elimina la asignación.
            </p>
          }
        />
      )}
    </div>
  )
}
