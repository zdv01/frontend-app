import { Eye, Pencil, Plus, UserRoundCheck, UserRoundX } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ActionButton } from '../../components/ActionButton'
import { Avatar } from '../../components/Avatar'
import { StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CrudToolbar } from '../../components/CrudToolbar'
import { DataTable } from '../../components/DataTable'
import { PermissionGate } from '../../components/PermissionGate'
import { getProviderLabel } from '../../constants/auth'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { usersService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../utils/format'
import { UserDetailPanel } from './UserDetailPanel'
import { UserFormModal } from './UserFormModal'

// HU-SE-01: gestionar usuarios (listar, registrar, ver, editar, activar/desactivar)
export function UsersPage() {
  const { user: currentUser, can, updateUser } = useAuth()
  const toast = useToast()

  const loadUsers = useCallback(() => usersService.list(), [])
  const { data: users, loading, error, reload } = useAsyncData(loadUsers)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  // null = cerrado; { user: null } = nuevo; { user } = editar
  const [form, setForm] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)

  const filtered = useMemo(
    () =>
      (users ?? []).filter(
        (u) => matchesSearch(search, u.name, u.email) && matchesStatus(status, u.active),
      ),
    [users, search, status],
  )
  const selected = users?.find((u) => u.id === selectedId) ?? null

  const handleSaved = (saved) => {
    if (saved.id === currentUser.id) {
      updateUser({ name: saved.name, email: saved.email })
    }
    setForm(null)
    setSelectedId(saved.id)
    reload()
  }

  const handleToggleActive = async () => {
    setToggling(true)
    try {
      await usersService.setActive(toggleTarget.id, !toggleTarget.active)
      toast.success(
        toggleTarget.active ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.',
      )
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del usuario.'))
    } finally {
      setToggling(false)
      setToggleTarget(null)
    }
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
    {
      key: 'authProvider',
      label: 'Acceso',
      sortable: true,
      render: (u) => getProviderLabel(u.authProvider),
      sortValue: (u) => getProviderLabel(u.authProvider),
    },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      render: (u) => <StatusBadge active={u.active} />,
      sortValue: (u) => (u.active ? 0 : 1),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'col-actions',
      render: (u) => {
        const isSelf = u.id === currentUser.id
        return (
          <div className="actions">
            <ActionButton icon={Eye} label="Ver detalle" onClick={() => setSelectedId(u.id)} />
            {can('usuarios', 'actualizar') && (
              <ActionButton
                icon={Pencil}
                label="Editar"
                variant="edit"
                onClick={() => setForm({ user: u })}
              />
            )}
            {can('usuarios', 'eliminar') && (
              <ActionButton
                icon={u.active ? UserRoundX : UserRoundCheck}
                label={
                  isSelf ? 'No puedes desactivar tu propia cuenta' : u.active ? 'Desactivar' : 'Activar'
                }
                variant={u.active ? 'danger' : 'success'}
                disabled={isSelf}
                onClick={() => setToggleTarget(u)}
              />
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="page-stack">
      <CrudToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o correo"
        status={status}
        onStatusChange={setStatus}
      >
        <PermissionGate resource="usuarios" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ user: null })}>
            <Plus size={18} /> Nuevo usuario
          </button>
        </PermissionGate>
      </CrudToolbar>

      <div className={`crud-layout ${selected ? 'crud-layout-with-detail' : ''}`}>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyMessage="No hay usuarios que coincidan con la búsqueda."
          onRowClick={(u) => setSelectedId(u.id)}
          selectedId={selectedId}
        />
        {selected && (
          <UserDetailPanel
            key={selected.id}
            user={selected}
            onClose={() => setSelectedId(null)}
            onEdit={() => setForm({ user: selected })}
          />
        )}
      </div>

      {form && (
        <UserFormModal user={form.user} onClose={() => setForm(null)} onSaved={handleSaved} />
      )}

      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.active ? 'Desactivar usuario' : 'Activar usuario'}
          danger={toggleTarget.active}
          confirmLabel={toggleTarget.active ? 'Desactivar' : 'Activar'}
          loading={toggling}
          onConfirm={handleToggleActive}
          onCancel={() => setToggleTarget(null)}
          message={
            toggleTarget.active ? (
              <p>
                ¿Desactivar a <strong>{toggleTarget.name}</strong>? No podrá iniciar sesión. Sus
                roles y los permisos del sistema no se eliminan.
              </p>
            ) : (
              <p>
                ¿Activar de nuevo a <strong>{toggleTarget.name}</strong>? Podrá volver a iniciar
                sesión con sus roles actuales.
              </p>
            )
          }
        />
      )}
    </div>
  )
}
