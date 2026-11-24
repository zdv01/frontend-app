import { CheckCircle2, Info, Plus, Search, Trash2, Users } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Avatar } from '../../../components/Avatar'
import { StatusBadge } from '../../../components/Badge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Modal } from '../../../components/Modal'
import { PermissionGate } from '../../../components/PermissionGate'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { habilidadJugadorService } from '../../../services/gestion/habilidadJugadorService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { normalizeText } from '../../../utils/format'
import { getSkillCategoryMeta, SKILL_CATEGORY_LIST } from './skillMeta'
import './perfil.css'

export function HabilidadesJugador({ jugadorId, jugadorActivo = true, onChanged }) {
  const toast = useToast()
  const canListCatalog = useCan('habilidades', 'listar')
  const canViewPlayersBySkill = useCan('habilidades', 'ver')

  const loadAssigned = useCallback(
    () => habilidadJugadorService.listarPorJugador(jugadorId),
    [jugadorId],
  )
  const loadCatalog = useCallback(
    () => (canListCatalog ? habilidadJugadorService.listarCatalogoHabilidades() : Promise.resolve([])),
    [canListCatalog],
  )

  const assignedState = useAsyncData(loadAssigned)
  const catalogState = useAsyncData(loadCatalog)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [busySkillId, setBusySkillId] = useState(null)
  const [skillToRemove, setSkillToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)

  const [inspectSkill, setInspectSkill] = useState(null)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [inspectError, setInspectError] = useState('')
  const [inspectPlayers, setInspectPlayers] = useState([])

  const assigned = useMemo(() => assignedState.data ?? [], [assignedState.data])
  const catalog = useMemo(() => catalogState.data ?? [], [catalogState.data])

  const assignedIds = useMemo(() => new Set(assigned.map((item) => item.id)), [assigned])

  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog],
  )

  const filteredCatalog = useMemo(() => {
    const term = normalizeText(search.trim())
    return catalog.filter((item) => {
      const matchCategory = !categoryFilter || item.categoria === categoryFilter
      const matchTerm =
        !term ||
        normalizeText(item.nombre).includes(term) ||
        normalizeText(item.descripcion ?? '').includes(term)
      return matchCategory && matchTerm
    })
  }, [catalog, search, categoryFilter])

  const availableCount = useMemo(
    () => catalog.filter((item) => !assignedIds.has(item.id)).length,
    [catalog, assignedIds],
  )

  const categoryBreakdown = useMemo(() => {
    return SKILL_CATEGORY_LIST.map((cat) => {
      const assignedInCat = assigned.filter((item) => item.categoria === cat.key).length
      const catalogInCat = catalog.filter((item) => item.categoria === cat.key).length
      const denominator = catalogInCat > 0 ? catalogInCat : Math.max(assigned.length, 1)
      return {
        ...cat,
        assignedCount: assignedInCat,
        catalogCount: catalogInCat,
        percent: Math.round((assignedInCat / denominator) * 100),
      }
    })
  }, [assigned, catalog])

  const coveredCategories = useMemo(
    () => categoryBreakdown.filter((item) => item.assignedCount > 0).length,
    [categoryBreakdown],
  )

  const handleAssign = async (habilidad) => {
    if (!jugadorActivo) return
    setBusySkillId(habilidad.id)
    try {
      await habilidadJugadorService.asignar(jugadorId, habilidad.id)
      toast.success('Habilidad asignada correctamente.')
      assignedState.reload()
      onChanged?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo asignar la habilidad.'))
    } finally {
      setBusySkillId(null)
    }
  }

  const handleConfirmRemove = async () => {
    if (!skillToRemove) return
    setRemoving(true)
    try {
      await habilidadJugadorService.retirar(jugadorId, skillToRemove.id)
      toast.success('Habilidad retirada del jugador correctamente.')
      setSkillToRemove(null)
      assignedState.reload()
      onChanged?.()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo retirar la habilidad.'))
    } finally {
      setRemoving(false)
    }
  }

  const handleInspectSkill = async (habilidad) => {
    if (!canViewPlayersBySkill) return
    setInspectSkill(habilidad)
    setInspectLoading(true)
    setInspectError('')
    setInspectPlayers([])
    try {
      const jugadores = await habilidadJugadorService.listarJugadoresPorHabilidad(habilidad.id)
      setInspectPlayers(jugadores ?? [])
    } catch (error) {
      setInspectError(
        getApiErrorMessage(error, 'No se pudieron consultar los jugadores con esta habilidad.'),
      )
    } finally {
      setInspectLoading(false)
    }
  }

  return (
    <section className="skills-manager" aria-label="Gestión de habilidades del jugador">
      {!jugadorActivo && (
        <Alert type="info">
          Este jugador se encuentra inactivo. No se pueden asignar nuevas habilidades mientras
          permanezca en estado inactivo.
        </Alert>
      )}

      <div className="skills-manager-grid">
        {/* Columna izquierda: catálogo de habilidades disponibles */}
        <div className="panel skills-panel">
          <header className="skills-panel-header">
            <div>
              <h3 className="section-title">Habilidades disponibles</h3>
              <p className="text-muted skills-panel-subtitle">
                Catálogo de capacidades deportivas registradas en el sistema.
              </p>
            </div>
            <span className="skills-count-pill">{catalog.length} habilidades</span>
          </header>

          {!canListCatalog ? (
            <Alert type="info">
              No tienes permiso para consultar el catálogo de habilidades disponibles.
            </Alert>
          ) : (
            <>
              <div className="skills-filters">
                <div className="search-box skills-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filtrar habilidad..."
                    aria-label="Filtrar habilidad"
                  />
                </div>
                <select
                  className="input select-filter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filtrar por categoría"
                >
                  <option value="">Todas las categorías</option>
                  {SKILL_CATEGORY_LIST.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {catalogState.error && (
                <Alert type="error">
                  {getApiErrorMessage(
                    catalogState.error,
                    'No se pudo cargar el catálogo de habilidades.',
                  )}{' '}
                  <button type="button" className="btn" onClick={catalogState.reload}>
                    Reintentar
                  </button>
                </Alert>
              )}

              {catalogState.loading ? (
                <div className="skills-center-state">
                  <Spinner label="Cargando catálogo de habilidades..." />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="skills-empty-box">
                  No se encontraron habilidades que coincidan con el filtro aplicado.
                </div>
              ) : (
                <div className="skills-card-grid">
                  {filteredCatalog.map((habilidad) => {
                    const meta = getSkillCategoryMeta(habilidad.categoria)
                    const Icon = meta.icon
                    const isAssigned = assignedIds.has(habilidad.id)
                    const isBusy = busySkillId === habilidad.id

                    return (
                      <article className="skill-card" key={habilidad.id}>
                        <div className={`skill-icon-ring tone-${meta.tone}`}>
                          <Icon size={22} aria-hidden="true" />
                        </div>
                        <h4 className="skill-card-title">{habilidad.nombre}</h4>
                        <span className={`skill-cat-pill tone-${meta.tone}`}>{meta.label}</span>
                        <p className="skill-card-desc">
                          {habilidad.descripcion || 'Sin descripción registrada.'}
                        </p>

                        <div className="skill-card-actions">
                          {isAssigned ? (
                            <div className="skill-assigned-note">
                              <CheckCircle2 size={14} aria-hidden="true" />
                              <span>Ya asignada al jugador</span>
                            </div>
                          ) : (
                            <PermissionGate resource="jugadores" operation="crear">
                              <button
                                type="button"
                                className="btn btn-primary skill-full-btn"
                                disabled={!jugadorActivo || isBusy}
                                onClick={() => handleAssign(habilidad)}
                              >
                                {isBusy ? <Spinner size={15} /> : <Plus size={15} />}
                                Asignar
                              </button>
                            </PermissionGate>
                          )}

                          {canViewPlayersBySkill && (
                            <button
                              type="button"
                              className="btn skill-secondary-btn"
                              onClick={() => handleInspectSkill(habilidad)}
                            >
                              <Users size={14} aria-hidden="true" />
                              Ver jugadores
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              <div className="skills-info-bar">
                <Info size={16} aria-hidden="true" />
                <span>Selecciona una habilidad para asignarla al jugador.</span>
              </div>
            </>
          )}
        </div>

        {/* Columna derecha: habilidades asignadas + resumen real por categoría */}
        <div className="panel skills-panel">
          <header className="skills-panel-header">
            <div>
              <h3 className="section-title">Habilidades del jugador</h3>
              <p className="text-muted skills-panel-subtitle">
                Capacidades deportivas actualmente asociadas al jugador.
              </p>
            </div>
            <span className="skills-count-pill skills-count-pill-primary">
              {assigned.length} asignadas
            </span>
          </header>

          {assignedState.error && (
            <Alert type="error">
              {getApiErrorMessage(
                assignedState.error,
                'No se pudieron cargar las habilidades del jugador.',
              )}{' '}
              <button type="button" className="btn" onClick={assignedState.reload}>
                Reintentar
              </button>
            </Alert>
          )}

          {assignedState.loading ? (
            <div className="skills-center-state">
              <Spinner label="Cargando habilidades asignadas..." />
            </div>
          ) : assigned.length === 0 ? (
            <div className="skills-empty-box">
              El jugador aún no tiene habilidades asignadas. Selecciona una del catálogo para
              comenzar.
            </div>
          ) : (
            <div className="skills-assigned-grid">
              {assigned.map((habilidad) => {
                const meta = getSkillCategoryMeta(habilidad.categoria)
                const Icon = meta.icon
                const fullSkill = catalogById.get(habilidad.id)

                return (
                  <article className="skill-card skill-card-assigned" key={habilidad.id}>
                    <div className={`skill-icon-ring tone-${meta.tone}`}>
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h4 className="skill-card-title">{habilidad.nombre}</h4>
                    <span className={`skill-cat-pill tone-${meta.tone}`}>{meta.label}</span>
                    {fullSkill?.descripcion && (
                      <p className="skill-card-desc">{fullSkill.descripcion}</p>
                    )}

                    <div className="skill-card-actions">
                      {canViewPlayersBySkill && (
                        <button
                          type="button"
                          className="btn skill-secondary-btn"
                          onClick={() => handleInspectSkill(habilidad)}
                        >
                          <Users size={14} aria-hidden="true" />
                          Ver jugadores
                        </button>
                      )}
                      <PermissionGate resource="jugadores" operation="eliminar">
                        <button
                          type="button"
                          className="btn btn-danger-outline skill-full-btn"
                          onClick={() => setSkillToRemove(habilidad)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Retirar
                        </button>
                      </PermissionGate>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <div className="skills-info-bar">
            <Info size={16} aria-hidden="true" />
            <span>
              Retirar una habilidad <strong>solo elimina la asociación del jugador</strong> con la
              habilidad. La habilidad seguirá disponible en el catálogo para otros jugadores.
            </span>
          </div>

          <div className="skills-summary-box">
            <h4 className="skills-summary-title">Distribución real por categoría</h4>
            <div className="category-bars">
              {categoryBreakdown.map((cat) => {
                const Icon = cat.icon
                return (
                  <div className="category-bar-row" key={cat.key}>
                    <div className="category-bar-label">
                      <Icon size={15} className={`tone-text-${cat.tone}`} aria-hidden="true" />
                      <span>{cat.label}</span>
                    </div>
                    <div className="category-bar-track" aria-hidden="true">
                      <div
                        className={`category-bar-fill tone-fill-${cat.tone}`}
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                    <span className="category-bar-value">
                      {cat.assignedCount}
                      {cat.catalogCount > 0 ? ` / ${cat.catalogCount}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="skills-kpi-strip">
            <div className="skills-kpi-item">
              <span className="skills-kpi-value">{assigned.length}</span>
              <span className="skills-kpi-label">Habilidades asignadas</span>
            </div>
            <div className="skills-kpi-item">
              <span className="skills-kpi-value">{availableCount}</span>
              <span className="skills-kpi-label">Habilidades disponibles</span>
            </div>
            <div className="skills-kpi-item">
              <span className="skills-kpi-value">{coveredCategories} / 4</span>
              <span className="skills-kpi-label">Categorías cubiertas</span>
            </div>
          </div>
        </div>
      </div>

      {skillToRemove && (
        <ConfirmDialog
          title="Retirar habilidad"
          message={`¿Seguro que deseas retirar "${skillToRemove.nombre}" de este jugador? Retirar una habilidad de un jugador no elimina la habilidad del sistema.`}
          confirmLabel="Retirar"
          loading={removing}
          onConfirm={handleConfirmRemove}
          onCancel={() => setSkillToRemove(null)}
        />
      )}

      {inspectSkill && (
        <Modal
          title={`Jugadores con "${inspectSkill.nombre}"`}
          onClose={() => setInspectSkill(null)}
          size="md"
        >
          <div className="modal-body">
            {inspectLoading ? (
              <Spinner label="Consultando jugadores..." />
            ) : inspectError ? (
              <Alert type="error">{inspectError}</Alert>
            ) : inspectPlayers.length === 0 ? (
              <div className="skills-empty-box">
                Ningún jugador tiene asignada esta habilidad actualmente.
              </div>
            ) : (
              <div className="select-list">
                {inspectPlayers.map((jugador) => (
                  <div className="select-list-item" key={jugador.id}>
                    <Avatar name={jugador.nombreCompleto} size={36} online={jugador.activo} />
                    <div className="select-list-text">
                      <strong>{jugador.nombreCompleto}</strong>
                      <span className="text-muted">
                        {jugador.tipoDocumento} {jugador.numeroDocumento}
                      </span>
                    </div>
                    <StatusBadge active={jugador.activo} />
                    <Link
                      to={`/jugadores/${jugador.id}/perfil`}
                      className="btn"
                      onClick={() => setInspectSkill(null)}
                    >
                      Ver perfil
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={() => setInspectSkill(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
