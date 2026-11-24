import { Eye, Pencil, Plus, Trash2, Power } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '../../../components/ActionButton'
import { Chip } from '../../../components/Badge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { CrudToolbar } from '../../../components/CrudToolbar'
import { DataTable } from '../../../components/DataTable'
import { PermissionGate } from '../../../components/PermissionGate'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { torneosService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'
import { matchesSearch } from '../../../utils/format'
import { TournamentFormModal } from './TournamentFormModal'

const statusLabels = {
  INSCRIPCIONES_ABIERTAS: 'Inscripciones abiertas',
  INSCRIPCIONES_CERRADAS: 'Inscripciones cerradas',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

export function TournamentsList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const load = useCallback(() => torneosService.list(), [])
  const { data: tournaments, loading, error, reload } = useAsyncData(load)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(
    () => (tournaments ?? []).filter((item) =>
      matchesSearch(search, item.nombre, item.deporte?.nombre) &&
      (status === 'all' || item.estado === status),
    ),
    [tournaments, search, status],
  )

  const cancelTournament = async () => {
    setSaving(true)
    try {
      await torneosService.changeStatus(cancelTarget.id, 'CANCELADO')
      toast.success('Torneo cancelado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cancelar el torneo.'))
    } finally {
      setSaving(false)
      setCancelTarget(null)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await torneosService.remove(deleteTarget.id)
      toast.success('Torneo eliminado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el torneo.'))
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'nombre', label: 'Nombre', sortable: true, render: (item) => <strong>{item.nombre}</strong> },
    { key: 'deporte', label: 'Deporte', sortable: true, render: (item) => item.deporte?.nombre ?? '—' },
    { key: 'fechaInicio', label: 'Inicio', sortable: true },
    { key: 'fechaFin', label: 'Fin', sortable: true },
    {
      key: 'estado', label: 'Estado', sortable: true,
      // Si el estado sigue ABIERTAS pero ya pasó la fecha de cierre, el backend manda inscripcionesAbiertas = false
      render: (item) => (
        <Chip>
          {item.estado === 'INSCRIPCIONES_ABIERTAS' && item.inscripcionesAbiertas === false
            ? 'Inscripciones cerradas (vencidas)'
            : statusLabels[item.estado] ?? item.estado}
        </Chip>
      ),
    },
    {
      key: 'actions', label: 'Acciones', className: 'col-actions',
      render: (item) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => navigate(`/torneos/${item.id}`)} />
          {can('torneos', 'actualizar') && item.estado !== 'FINALIZADO' && item.estado !== 'CANCELADO' && <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ tournament: item })} />}
          {can('torneos', 'actualizar') && item.estado !== 'FINALIZADO' && item.estado !== 'CANCELADO' && <ActionButton icon={Power} label="Cancelar torneo" variant="danger" onClick={() => setCancelTarget(item)} />}
          {can('torneos', 'eliminar') && <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(item)} />}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <CrudToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre o deporte">
        <select className="input select-filter" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <PermissionGate resource="torneos" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ tournament: null })}><Plus size={18} /> Nuevo torneo</button>
        </PermissionGate>
      </CrudToolbar>
      <DataTable columns={columns} rows={filtered} loading={loading} error={error} onRetry={reload} emptyMessage="No hay torneos que coincidan." onRowClick={(item) => navigate(`/torneos/${item.id}`)} />
      {form && <TournamentFormModal tournament={form.tournament} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {cancelTarget && <ConfirmDialog title="Cancelar torneo" danger confirmLabel="Cancelar torneo" loading={saving} onConfirm={cancelTournament} onCancel={() => setCancelTarget(null)} message={<p>¿Cancelar <strong>{cancelTarget.nombre}</strong>? Esta transición no se puede revertir.</p>} />}
      {deleteTarget && <ConfirmDialog title="Eliminar torneo" confirmLabel="Eliminar" loading={saving} onConfirm={remove} onCancel={() => setDeleteTarget(null)} message={<p>¿Eliminar <strong>{deleteTarget.nombre}</strong>? Solo se permite si no tiene fases ni inscripciones.</p>} />}
    </div>
  )
}
