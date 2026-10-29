import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ActionButton } from '../../components/ActionButton'
import { StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CrudToolbar } from '../../components/CrudToolbar'
import { DataTable } from '../../components/DataTable'
import { PermissionGate } from '../../components/PermissionGate'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { rolesService, userRolesService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../utils/format'
import { RoleDetailPanel } from './RoleDetailPanel'
import { RoleFormModal } from './RoleFormModal'

const ROLE_IN_USE_MESSAGE = 'No se puede eliminar el rol porque tiene usuarios asignados.'

// HU-SE-03: gestionar roles
export function RolesPage() {
  const { can, refreshSession } = useAuth()
  const toast = useToast()

  const loadRoles = useCallback(() => rolesService.list(), [])
  const { data: roles, loading, error, reload } = useAsyncData(loadRoles)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null) // null | { role: null } | { role }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(
    () =>
      (roles ?? []).filter(
        (r) => matchesSearch(search, r.name, r.description) && matchesStatus(status, r.active),
      ),
    [roles, search, status],
  )
  const selected = roles?.find((r) => r.id === selectedId) ?? null

  const handleSaved = (saved) => {
    setForm(null)
    setSelectedId(saved.id)
    reload()
    // Activar o desactivar un rol cambia los permisos efectivos de sus usuarios
    refreshSession()
  }

  // Antes de pedir confirmación se valida que el rol no tenga usuarios (HU-SE-03)
  const requestDelete = async (role) => {
    try {
      const users = await userRolesService.listUsersByRole(role.id)
      if (users.length > 0) {
        toast.error(ROLE_IN_USE_MESSAGE)
        return
      }
      setDeleteTarget(role)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo verificar el rol.'))
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await rolesService.remove(deleteTarget.id)
      toast.success('Rol eliminado correctamente.')
      if (selectedId === deleteTarget.id) setSelectedId(null)
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el rol.'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Nombre', sortable: true, render: (r) => <strong>{r.name}</strong> },
    { key: 'description', label: 'Descripción', sortable: true },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      render: (r) => <StatusBadge active={r.active} />,
      sortValue: (r) => (r.active ? 0 : 1),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'col-actions',
      render: (r) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => setSelectedId(r.id)} />
          {can('roles', 'actualizar') && (
            <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ role: r })} />
          )}
          {can('roles', 'eliminar') && (
            <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => requestDelete(r)} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <CrudToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o descripción"
        status={status}
        onStatusChange={setStatus}
      >
        <PermissionGate resource="roles" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ role: null })}>
            <Plus size={18} /> Nuevo rol
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
          emptyMessage="No hay roles que coincidan con la búsqueda."
          onRowClick={(r) => setSelectedId(r.id)}
          selectedId={selectedId}
        />
        {selected && (
          <RoleDetailPanel
            key={selected.id}
            role={selected}
            onClose={() => setSelectedId(null)}
            onEdit={() => setForm({ role: selected })}
          />
        )}
      </div>

      {form && (
        <RoleFormModal role={form.role} onClose={() => setForm(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar rol"
          confirmLabel="Eliminar"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          message={
            <p>
              ¿Eliminar el rol <strong>{deleteTarget.name}</strong>? Se retirarán sus permisos
              asignados, pero los usuarios y los permisos del sistema no se eliminan.
            </p>
          }
        />
      )}
    </div>
  )
}
