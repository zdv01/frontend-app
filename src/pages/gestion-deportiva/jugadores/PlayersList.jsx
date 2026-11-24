import { Cake, Eye, IdCard, Mail, Pencil, Phone, Plus, Power, ShieldCheck, Trash2, Activity } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '../../../components/ActionButton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { CrudToolbar } from '../../../components/CrudToolbar'
import { DataTable } from '../../../components/DataTable'
import { DetailPanel, DetailRow } from '../../../components/DetailPanel'
import { PermissionGate } from '../../../components/PermissionGate'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { jugadoresService } from '../../../services/gestion/jugadoresService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDate, getInitials } from '../../../utils/format'
import { ActivoBadge, PersonCell } from './gdUi'
import { iconLabel } from './gdIcons'
import { PlayerFormModal } from './PlayerFormModal'

// Equipo con contrato activo del jugador seleccionado (se consulta solo al abrir el panel)
function EquipoActual({ jugadorId }) {
  const load = useCallback(() => jugadoresService.listContratosJugador(jugadorId, false), [jugadorId])
  const { data, loading, error } = useAsyncData(load)
  if (loading) return <span className="text-muted">Cargando...</span>
  if (error) return <span className="text-muted">No disponible</span>
  const equipos = (data ?? []).map((contrato) => contrato.equipo.nombre)
  return equipos.length ? equipos.join(', ') : <span className="text-muted">Sin equipo</span>
}

export function PlayersList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Espera 300 ms tras escribir para no pedir al servidor en cada tecla
  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const activo = status === 'all' ? undefined : status === 'active'
  const load = useCallback(() => jugadoresService.list({ busqueda, activo }), [busqueda, activo])
  const { data: players, loading, error, reload } = useAsyncData(load)
  const selected = (players ?? []).find((player) => player.id === selectedId) ?? null

  const changeStatus = async () => {
    setSaving(true)
    try {
      await jugadoresService.changeStatus(statusTarget.id, !statusTarget.activo)
      toast.success(statusTarget.activo ? 'Jugador desactivado correctamente.' : 'Jugador activado correctamente.')
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del jugador.'))
    } finally {
      setSaving(false)
      setStatusTarget(null)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await jugadoresService.remove(deleteTarget.id)
      toast.success('Jugador eliminado correctamente.')
      if (deleteTarget.id === selectedId) setSelectedId(null)
      reload()
    } catch (err) {
      // 409 HAS_ASSOCIATIONS: se muestra el message del servidor
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar el jugador.'))
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'nombreCompleto', label: 'Jugador', sortable: true, render: (p) => <PersonCell name={p.nombreCompleto} subtitle={p.email} /> },
    { key: 'numeroDocumento', label: 'Documento', sortable: true, render: (p) => `${p.tipoDocumento} ${p.numeroDocumento}` },
    { key: 'edad', label: 'Edad', sortable: true },
    { key: 'telefono', label: 'Teléfono', render: (p) => p.telefono || '—' },
    { key: 'activo', label: 'Estado', sortable: true, render: (p) => <ActivoBadge active={p.activo} /> },
    {
      key: 'actions', label: 'Acciones', className: 'col-actions',
      render: (p) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => navigate(`/jugadores/${p.id}`)} />
          {can('jugadores', 'actualizar') && <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ player: p })} />}
          {can('jugadores', 'actualizar') && <ActionButton icon={Power} label={p.activo ? 'Desactivar' : 'Activar'} variant={p.activo ? 'danger' : 'success'} onClick={() => setStatusTarget(p)} />}
          {can('jugadores', 'eliminar') && <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(p)} />}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack gd-skin">
      <CrudToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre o documento" status={status} onStatusChange={setStatus}>
        <PermissionGate resource="jugadores" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ player: null })}><Plus size={18} /> Nuevo jugador</button>
        </PermissionGate>
      </CrudToolbar>
      <div className={`crud-layout ${selected ? 'crud-layout-with-detail' : ''}`}>
        <DataTable columns={columns} rows={players ?? []} loading={loading} error={error} onRetry={reload} emptyMessage="No hay jugadores que coincidan." selectedId={selectedId} onRowClick={(p) => setSelectedId(p.id)} />
        {selected && (
          <DetailPanel
            title="Detalle del jugador"
            onClose={() => setSelectedId(null)}
            actions={(
              <>
                <button type="button" className="btn btn-outline-info" onClick={() => navigate(`/jugadores/${selected.id}`)}><Eye size={16} /> Consultar</button>
                {can('jugadores', 'actualizar') && <button type="button" className="btn btn-outline-info" onClick={() => setForm({ player: selected })}><Pencil size={16} /> Editar</button>}
                {can('jugadores', 'actualizar') && <button type="button" className={`btn ${selected.activo ? 'btn-outline-danger' : 'btn-outline-primary'}`} onClick={() => setStatusTarget(selected)}><Power size={16} /> {selected.activo ? 'Desactivar' : 'Activar'}</button>}
              </>
            )}
          >
            <div className="gd-hero">
              <span className="gd-avatar-lg" aria-hidden="true">{getInitials(selected.nombreCompleto)}</span>
              <div>
                <h3>{selected.nombreCompleto}</h3>
                <span className="text-muted">{selected.tipoDocumento} {selected.numeroDocumento}</span>
              </div>
            </div>
            <dl className="gd-detail">
              <DetailRow label={iconLabel(Cake, 'Edad')}>{selected.edad} años</DetailRow>
              <DetailRow label={iconLabel(Cake, 'Nacimiento')}>{formatDate(selected.fechaNacimiento)}</DetailRow>
              <DetailRow label={iconLabel(IdCard, 'Documento')}>{selected.tipoDocumento} {selected.numeroDocumento}</DetailRow>
              <DetailRow label={iconLabel(Mail, 'Correo')}>{selected.email || '—'}</DetailRow>
              <DetailRow label={iconLabel(Phone, 'Teléfono')}>{selected.telefono || '—'}</DetailRow>
              <DetailRow label={iconLabel(Activity, 'Estado')}><ActivoBadge active={selected.activo} /></DetailRow>
              <DetailRow label={iconLabel(ShieldCheck, 'Equipo actual')}><EquipoActual jugadorId={selected.id} /></DetailRow>
            </dl>
          </DetailPanel>
        )}
      </div>
      {form && <PlayerFormModal player={form.player} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {statusTarget && <ConfirmDialog title={statusTarget.activo ? 'Desactivar jugador' : 'Activar jugador'} danger={statusTarget.activo} confirmLabel={statusTarget.activo ? 'Desactivar' : 'Activar'} loading={saving} onConfirm={changeStatus} onCancel={() => setStatusTarget(null)} message={<p>¿{statusTarget.activo ? 'Desactivar' : 'Activar'} a <strong>{statusTarget.nombreCompleto}</strong>?</p>} />}
      {deleteTarget && <ConfirmDialog title="Eliminar jugador" confirmLabel="Eliminar" loading={saving} onConfirm={remove} onCancel={() => setDeleteTarget(null)} message={<p>¿Eliminar a <strong>{deleteTarget.nombreCompleto}</strong>? Solo se permite si no tiene datos asociados.</p>} />}
    </div>
  )
}
