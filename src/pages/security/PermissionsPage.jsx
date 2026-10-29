import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ActionButton } from '../../components/ActionButton'
import { MethodBadge, StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { CrudToolbar } from '../../components/CrudToolbar'
import { DataTable } from '../../components/DataTable'
import { PermissionGate } from '../../components/PermissionGate'
import { MODULES, describePermission } from '../../constants/permissions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { permissionsService } from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../utils/format'
import { PermissionDetailPanel } from './PermissionDetailPanel'
import { PermissionFormModal } from './PermissionFormModal'

// HU-SE-05: gestionar permisos
export function PermissionsPage() {
  const { can, refreshSession } = useAuth()
  const toast = useToast()

  const loadPermissions = useCallback(() => permissionsService.list(), [])
  const { data: permissions, loading, error, reload } = useAsyncData(loadPermissions)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null) // null | { permission: null } | { permission }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(
    () =>
      (permissions ?? []).filter((p) => {
        const info = describePermission(p)
        return (
          matchesSearch(search, info.resourceLabel, info.operationLabel, p.url, p.method) &&
          matchesStatus(status, p.active) &&
          (moduleFilter === 'all' || info.moduleKey === moduleFilter)
        )
      }),
    [permissions, search, status, moduleFilter],
  )
  const selected = permissions?.find((p) => p.id === selectedId) ?? null

  const handleSaved = (saved) => {
    setForm(null)
    setSelectedId(saved.id)
    reload()
    refreshSession()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await permissionsService.remove(deleteTarget.id)
      toast.success('Permiso eliminado correctamente.')
      if (selectedId === deleteTarget.id) setSelectedId(null)
      reload()
      refreshSession()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el permiso.'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'resource',
      label: 'Recurso',
      sortable: true,
      render: (p) => <strong>{describePermission(p).resourceLabel}</strong>,
      sortValue: (p) => describePermission(p).resourceLabel,
    },
    {
      key: 'module',
      label: 'Módulo',
      sortable: true,
      render: (p) => describePermission(p).moduleLabel,
      sortValue: (p) => describePermission(p).moduleLabel,
    },
    {
      key: 'operation',
      label: 'Operación',
      sortable: true,
      render: (p) => describePermission(p).operationLabel,
    },
    { key: 'method', label: 'Método', sortable: true, render: (p) => <MethodBadge method={p.method} /> },
    { key: 'url', label: 'URL', sortable: true, render: (p) => <span className="mono">{p.url}</span> },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      render: (p) => <StatusBadge active={p.active} />,
      sortValue: (p) => (p.active ? 0 : 1),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'col-actions',
      render: (p) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => setSelectedId(p.id)} />
          {can('permisos', 'actualizar') && (
            <ActionButton
              icon={Pencil}
              label="Editar"
              variant="edit"
              onClick={() => setForm({ permission: p })}
            />
          )}
          {can('permisos', 'eliminar') && (
            <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(p)} />
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
        searchPlaceholder="Buscar por recurso, operación o URL"
        status={status}
        onStatusChange={setStatus}
      >
        <select
          className="input select-filter"
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
          aria-label="Filtrar por módulo"
        >
          <option value="all">Todos los módulos</option>
          {MODULES.map((module) => (
            <option key={module.key} value={module.key}>
              {module.label}
            </option>
          ))}
        </select>
        <PermissionGate resource="permisos" operation="crear">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setForm({ permission: null })}
          >
            <Plus size={18} /> Nuevo permiso
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
          emptyMessage="No hay permisos que coincidan con los filtros."
          onRowClick={(p) => setSelectedId(p.id)}
          selectedId={selectedId}
          pageSize={10}
        />
        {selected && (
          <PermissionDetailPanel
            key={selected.id}
            permission={selected}
            onClose={() => setSelectedId(null)}
            onEdit={() => setForm({ permission: selected })}
          />
        )}
      </div>

      {form && (
        <PermissionFormModal
          permission={form.permission}
          permissions={permissions ?? []}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar permiso"
          confirmLabel="Eliminar"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          message={
            <p>
              ¿Eliminar el permiso{' '}
              <strong>
                {describePermission(deleteTarget).operationLabel}{' '}
                {describePermission(deleteTarget).resourceLabel}
              </strong>
              ? Se retirará de los roles que lo tengan asignado, pero esos roles no se eliminan.
            </p>
          }
        />
      )}
    </div>
  )
}
