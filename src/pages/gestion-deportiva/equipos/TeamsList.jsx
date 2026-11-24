import { Eye, Pencil, Plus, Power, Trash2 } from 'lucide-react'
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
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { catalogosService, equiposService } from '../../../services'
import { getApiErrorMessage } from '../../../utils/apiError'
import { matchesSearch, matchesStatus } from '../../../utils/format'
import { TeamFormModal } from './TeamFormModal'

export function TeamsList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const canListSports = useCan('deportes', 'listar')
  const canViewSports = useCan('deportes', 'ver')
  const canFilterBySport = canListSports && canViewSports
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sportId, setSportId] = useState('')
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => equiposService.list(), [])
  const loadSports = useCallback(
    () => (canFilterBySport ? catalogosService.getSports() : Promise.resolve([])),
    [canFilterBySport],
  )
  const loadSportTeams = useCallback(
    () => (sportId ? equiposService.getBySport(Number(sportId)) : Promise.resolve(null)),
    [sportId],
  )

  const { data: teams, loading, error, reload } = useAsyncData(load)
  const sportsState = useAsyncData(loadSports)
  const sportTeamsState = useAsyncData(loadSportTeams)

  const filtered = useMemo(() => {
    const sportTeamIds = sportId
      ? new Set((sportTeamsState.data ?? []).map((item) => item.id))
      : null
    return (teams ?? []).filter(
      (team) =>
        matchesSearch(search, team.nombre, team.ciudad) &&
        matchesStatus(status, team.activo) &&
        (!sportTeamIds || sportTeamIds.has(team.id)),
    )
  }, [teams, search, status, sportId, sportTeamsState.data])

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
        {canFilterBySport && (
          <select
            className="input select-filter"
            value={sportId}
            onChange={(event) => setSportId(event.target.value)}
            aria-label="Filtrar por deporte"
          >
            <option value="">Todos los deportes</option>
            {(sportsState.data ?? []).map((sport) => (
              <option key={sport.id} value={sport.id}>{sport.nombre}</option>
            ))}
          </select>
        )}
        <PermissionGate resource="equipos" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ team: null })}><Plus size={18} /> Nuevo equipo</button>
        </PermissionGate>
      </CrudToolbar>
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading || (Boolean(sportId) && sportTeamsState.loading)}
        error={error || sportTeamsState.error}
        onRetry={() => { reload(); if (sportId) sportTeamsState.reload() }}
        emptyMessage="No hay equipos que coincidan."
        onRowClick={(team) => navigate(`/equipos/${team.id}`)}
      />
      {form && <TeamFormModal team={form.team} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {statusTarget && <ConfirmDialog title={statusTarget.activo ? 'Desactivar equipo' : 'Activar equipo'} danger={statusTarget.activo} confirmLabel={statusTarget.activo ? 'Desactivar' : 'Activar'} loading={saving} onConfirm={changeStatus} onCancel={() => setStatusTarget(null)} message={<p>¿{statusTarget.activo ? 'Desactivar' : 'Activar'} a <strong>{statusTarget.nombre}</strong>?</p>} />}
      {deleteTarget && <ConfirmDialog title="Eliminar equipo" confirmLabel="Eliminar" loading={saving} onConfirm={remove} onCancel={() => setDeleteTarget(null)} message={<p>¿Eliminar a <strong>{deleteTarget.nombre}</strong>? Solo se permite si no tiene datos asociados.</p>} />}
    </div>
  )
}
