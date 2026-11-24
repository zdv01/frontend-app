import { CalendarClock, Eye, Flag, MapPin, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '../../../components/ActionButton'
import { CrudToolbar } from '../../../components/CrudToolbar'
import { DataTable } from '../../../components/DataTable'
import { DetailPanel, DetailRow } from '../../../components/DetailPanel'
import { PermissionGate } from '../../../components/PermissionGate'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useAuth } from '../../../hooks/useAuth'
import { partidosService } from '../../../services/gestion/partidosService'
import { torneosService } from '../../../services/gestion/torneosService'
import { matchesSearch } from '../../../utils/format'
import { iconLabel } from '../jugadores/gdIcons'
import { CambioEstadoDialog, EliminarPartidoDialog } from './PartidoDialogs'
import { PartidoFormModal } from './PartidoFormModal'
import { Enfrentamiento, EstadoPartidoBadge } from './partidosUi'
import { ACCION_ESTADO, ESTADOS_PARTIDO, TRANSICIONES, estadoLabel, fechaHoraTexto, marcadorTexto, rondaTexto } from './partidosUtils'

// Columnas y panel compartidos con PartidosTorneo (lista dentro del detalle de un torneo)
export function PartidosList({ torneoId: torneoFijo }) {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const [torneoId, setTorneoId] = useState('')
  const [estado, setEstado] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [estadoTarget, setEstadoTarget] = useState(null) // { partido, estado }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const torneoFiltro = torneoFijo ?? torneoId
  // Con torneoFijo no se necesita el filtro de torneos: no se pide la lista
  const cargarTorneos = useCallback(() => (torneoFijo ? Promise.resolve([]) : torneosService.list()), [torneoFijo])
  const torneos = useAsyncData(cargarTorneos)
  const load = useCallback(() => partidosService.list({ torneoId: torneoFiltro || undefined, estado: estado || undefined }), [torneoFiltro, estado])
  const { data, loading, error, reload } = useAsyncData(load)

  // El buscador filtra en el navegador por nombre de equipo o escenario
  const partidos = (data ?? []).filter((p) => matchesSearch(search, p.equipoLocal.nombre, p.equipoVisitante.nombre, p.escenario?.nombre ?? ''))
  const selected = partidos.find((p) => p.id === selectedId) ?? null

  const columns = [
    { key: 'enfrentamiento', label: 'Partido', render: (p) => <Enfrentamiento partido={p} />, sortValue: (p) => p.equipoLocal.nombre },
    { key: 'fechaHora', label: 'Fecha y hora', sortable: true, render: (p) => fechaHoraTexto(p.fechaHora) },
    ...(torneoFijo ? [] : [{ key: 'torneo', label: 'Torneo', sortable: true, sortValue: (p) => p.torneo.nombre, render: (p) => p.torneo.nombre }]),
    { key: 'fase', label: 'Fase', render: (p) => p.fase.nombre },
    { key: 'marcador', label: 'Marcador', render: marcadorTexto },
    { key: 'estado', label: 'Estado', sortable: true, render: (p) => <EstadoPartidoBadge estado={p.estado} /> },
    {
      key: 'actions', label: 'Acciones', className: 'col-actions',
      render: (p) => (
        <div className="actions">
          <ActionButton icon={Eye} label="Ver detalle" onClick={() => navigate(`/partidos/${p.id}`)} />
          {p.estado === 'PROGRAMADO' && can('partidos', 'actualizar') && <ActionButton icon={Pencil} label="Editar" variant="edit" onClick={() => setForm({ partido: p })} />}
          {p.estado === 'PROGRAMADO' && can('partidos', 'eliminar') && <ActionButton icon={Trash2} label="Eliminar" variant="danger" onClick={() => setDeleteTarget(p)} />}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack gd-skin">
      <CrudToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por equipo o escenario">
        {!torneoFijo && (
          <select className="input select-filter" value={torneoId} onChange={(e) => setTorneoId(e.target.value)} aria-label="Filtrar por torneo">
            <option value="">Todos los torneos</option>
            {(torneos.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        )}
        <select className="input select-filter" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS_PARTIDO.map((e) => <option key={e} value={e}>{estadoLabel(e)}</option>)}
        </select>
        {/* POST /api/fases/{id}/partidos: el recurso es "fases" (10.4) */}
        <PermissionGate resource="fases" operation="crear">
          <button type="button" className="btn btn-primary" onClick={() => setForm({ partido: null })}><Plus size={18} /> Nuevo partido</button>
        </PermissionGate>
      </CrudToolbar>
      <div className={`crud-layout ${selected ? 'crud-layout-with-detail' : ''}`}>
        <DataTable columns={columns} rows={partidos} loading={loading} error={error} onRetry={reload} emptyMessage="No hay partidos que coincidan." selectedId={selectedId} onRowClick={(p) => setSelectedId(p.id)} />
        {selected && (
          <DetailPanel
            title="Detalle del partido"
            onClose={() => setSelectedId(null)}
            actions={(
              <>
                <button type="button" className="btn btn-outline-info" onClick={() => navigate(`/partidos/${selected.id}`)}><Eye size={16} /> Consultar</button>
                {selected.estado === 'PROGRAMADO' && can('partidos', 'actualizar') && <button type="button" className="btn btn-outline-info" onClick={() => setForm({ partido: selected })}><Pencil size={16} /> Editar</button>}
                {can('partidos', 'actualizar') && TRANSICIONES[selected.estado].map((destino) => (
                  <button key={destino} type="button" className={`btn ${ACCION_ESTADO[destino].variant}`} onClick={() => setEstadoTarget({ partido: selected, estado: destino })}>{ACCION_ESTADO[destino].label}</button>
                ))}
              </>
            )}
          >
            <div className="gd-hero">
              <div>
                <h3><Enfrentamiento partido={selected} /></h3>
                <EstadoPartidoBadge estado={selected.estado} />
              </div>
            </div>
            <dl className="gd-detail">
              <DetailRow label={iconLabel(Trophy, 'Torneo')}>{selected.torneo.nombre}</DetailRow>
              <DetailRow label={iconLabel(Flag, 'Fase')}>{selected.fase.nombre}</DetailRow>
              <DetailRow label={iconLabel(Flag, 'Ronda')}>{rondaTexto(selected)}</DetailRow>
              <DetailRow label={iconLabel(CalendarClock, 'Fecha y hora')}>{fechaHoraTexto(selected.fechaHora)}</DetailRow>
              <DetailRow label={iconLabel(MapPin, 'Escenario')}>{selected.escenario?.nombre ?? 'Sin escenario'}</DetailRow>
              <DetailRow label={iconLabel(Trophy, 'Marcador')}>{marcadorTexto(selected)}</DetailRow>
              <DetailRow label={iconLabel(Flag, 'Anotaciones')}>{selected.cantidadAnotaciones}</DetailRow>
            </dl>
          </DetailPanel>
        )}
      </div>
      {form && <PartidoFormModal partido={form.partido} torneoId={torneoFijo} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />}
      {estadoTarget && <CambioEstadoDialog partido={estadoTarget.partido} estado={estadoTarget.estado} onClose={() => setEstadoTarget(null)} onDone={reload} />}
      {deleteTarget && <EliminarPartidoDialog partido={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={() => { if (deleteTarget.id === selectedId) setSelectedId(null); reload() }} />}
    </div>
  )
}
