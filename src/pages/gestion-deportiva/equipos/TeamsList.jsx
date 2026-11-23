import { Eye, Pencil, Plus, Trash2, Power } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '../../../components/ActionButton'
import { StatusBadge } from '../../../components/Badge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { CrudToolbar } from '../../../components/CrudToolbar'
import { DataTable } from '../../../components/DataTable'
import { PermissionGate } from '../../../components/PermissionGate'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { equiposService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../../utils/format'
import { TeamFormModal } from './TeamFormModal'

export function TeamsList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const load = useCallback(() => equiposService.list(), [])
  const { data: teams, loading, error, reload } = useAsyncData(load)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(
    () => (teams ?? []).filter((team) => matchesSearch(search, team.nombre, team.ciudad) && matchesStatus(status, team.activo)),
    [teams, search, status],
  )

  const changeStatus = async () => {
    setSaving(true)
    try {
      await equiposService.changeStatus(statusTarget.id, !statusTarget.activo)
      toast.success(statusTarget.activo ? 'Equipo desactivado correctamente.' : 'Equipo activado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del equipo.'))
    } finally {
      setSaving(false)
      setStatusTarget(null)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await equiposService.remove(deleteTarget.id)
      toast.success('Equipo eliminado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el equipo.'))
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'nombre', label: 'Nombre', sortable: true, render: (team) => <strong>{team.nombre}</strong> },
    { key: 'ciudad', label: 'Ciudad', sortable: true },
    { key: 'fechaFundacion', label: 'Fundación', sortable: true, render: (team) => team.fechaFundacion || '—' },
    { key: 'activo', label: 'Estado', sortable: true, render: (team) => <StatusBadge active={team.activo} /> },
    {
      key: 'actions', label: 'Acciones', className: 'col-actions',
      render: (team) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => navigate(`/equipos/${team.id}`)} />
          {can('equipos', 'actualizar') && <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ team })} />}
          {can('equipos', 'actualizar') && <ActionButton icon={Power} label={team.activo ? 'Desactivar' : 'Activar'} variant={team.activo ? 'danger' : 'success'} onClick={() => setStatusTarget(team)} />}
          {can('equipos', 'eliminar') && <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(team)} />}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <CrudToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre o ciudad" status={status} onStatusChange={setStatus}>
        <PermissionGate resource="equipos" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ team: null })}><Plus size={18} /> Nuevo equipo</button>
        </PermissionGate>
      </CrudToolbar>
      <DataTable columns={columns} rows={filtered} loading={loading} error={error} onRetry={reload} emptyMessage="No hay equipos que coincidan." onRowClick={(team) => navigate(`/equipos/${team.id}`)} />
      {form && <TeamFormModal team={form.team} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {statusTarget && <ConfirmDialog title={statusTarget.activo ? 'Desactivar equipo' : 'Activar equipo'} danger={statusTarget.activo} confirmLabel={statusTarget.activo ? 'Desactivar' : 'Activar'} loading={saving} onConfirm={changeStatus} onCancel={() => setStatusTarget(null)} message={<p>¿{statusTarget.activo ? 'Desactivar' : 'Activar'} a <strong>{statusTarget.nombre}</strong>?</p>} />}
      {deleteTarget && <ConfirmDialog title="Eliminar equipo" confirmLabel="Eliminar" loading={saving} onConfirm={remove} onCancel={() => setDeleteTarget(null)} message={<p>¿Eliminar a <strong>{deleteTarget.nombre}</strong>? Solo se permite si no tiene datos asociados.</p>} />}
    </div>
  )
}
