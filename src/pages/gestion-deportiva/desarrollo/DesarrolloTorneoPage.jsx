import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  GitBranch,
  Layers,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Chip } from '../../../components/Badge'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { fasesService } from '../../../services/gestion/fasesService'
import { torneosService } from '../../../services/gestion/torneosService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDate, formatDateTime, getInitials } from '../../../utils/format'
import { CuadroLlaves } from '../fase-final/CuadroLlaves'
import { AnotacionesPartido } from '../partidos/AnotacionesPartido'
import { getTournamentStatusLabel } from '../torneos/tournamentStatus'
import { PartidoDesarrolloCard } from './PartidoDesarrolloCard'
import { TablaPosicionesCard } from './TablaPosicionesCard'
import './desarrollo.css'

const RONDA_LABELS = {
  DIECISEISAVOS: 'Dieciseisavos',
  OCTAVOS: 'Octavos de final',
  CUARTOS: 'Cuartos de final',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
  TERCER_PUESTO: 'Tercer puesto',
}

const ESTADO_TORNEO_TONE = {
  EN_CURSO: 'is-active',
  INSCRIPCIONES_ABIERTAS: 'is-info',
  INSCRIPCIONES_CERRADAS: 'is-warning',
  FINALIZADO: 'is-muted',
  CANCELADO: 'is-danger',
}

const ESTADO_PARTIDO_META = {
  FINALIZADO: { label: 'Finalizado', className: 'estado-finalizado' },
  EN_JUEGO: { label: 'En juego', className: 'estado-en-juego' },
  PROGRAMADO: { label: 'Programado', className: 'estado-programado' },
  CANCELADO: { label: 'Cancelado', className: 'estado-cancelado' },
}

const RING_RADIUS = 44
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function defaultUiState(torneoId) {
  return {
    torneoId,
    activeTab: null,
    selectedPhaseId: 'ALL',
    matchFilter: 'ALL',
    selectedMatchId: null,
  }
}

export function DesarrolloTorneoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canListTorneos = useCan('torneos', 'listar')
  const canVerPartidos = useCan('partidos', 'ver')
  const anotacionesRef = useRef(null)

  const [uiState, setUiState] = useState(() => defaultUiState(id))
  const currentUi = uiState.torneoId === id ? uiState : defaultUiState(id)

  const updateUi = useCallback(
    (patch) => {
      setUiState((prev) => {
        const base = prev.torneoId === id ? prev : defaultUiState(id)
        return { ...base, ...patch }
      })
    },
    [id],
  )

  const loadDesarrollo = useCallback(() => fasesService.obtenerDesarrollo(id), [id])
  const loadTorneos = useCallback(
    () => (canListTorneos ? torneosService.list() : Promise.resolve([])),
    [canListTorneos],
  )

  const { data: desarrollo, loading, error, reload } = useAsyncData(loadDesarrollo)
  const torneosState = useAsyncData(loadTorneos)

  const torneosDisponibles = useMemo(() => torneosState.data ?? [], [torneosState.data])
  const fases = useMemo(() => desarrollo?.fases ?? [], [desarrollo])
  const fasesGrupo = useMemo(() => fases.filter((f) => f.tipo === 'GRUPO'), [fases])
  const faseFinal = useMemo(() => fases.find((f) => f.tipo === 'FINAL') ?? null, [fases])

  const tabs = useMemo(() => {
    const items = []
    if (fasesGrupo.length > 0) {
      items.push({ key: 'GRUPOS', label: 'Fase de grupos', count: fasesGrupo.length })
    }
    if (faseFinal) {
      items.push({ key: 'FINAL', label: faseFinal.nombre || 'Fase final', count: faseFinal.llaves?.length ?? 0 })
    }
    if (fasesGrupo.length > 0 && faseFinal) {
      items.push({ key: 'ALL', label: 'Todas las fases', count: fases.length })
    }
    return items
  }, [fasesGrupo.length, faseFinal, fases.length])

  const effectiveTab = useMemo(() => {
    if (currentUi.activeTab && tabs.some((t) => t.key === currentUi.activeTab)) {
      return currentUi.activeTab
    }
    return tabs[0]?.key ?? 'ALL'
  }, [currentUi.activeTab, tabs])

  // Lista plana de todos los partidos del torneo con el nombre de su fase
  const allMatches = useMemo(() => {
    return fases.flatMap((fase) =>
      (fase.partidos ?? []).map((partido) => ({
        ...partido,
        faseId: fase.id,
        faseNombre: fase.nombre,
        faseTipo: fase.tipo,
      })),
    )
  }, [fases])

  // Fases visibles según pestaña y selector superior de fase
  const visibleFases = useMemo(() => {
    if (currentUi.selectedPhaseId !== 'ALL') {
      return fases.filter((f) => String(f.id) === String(currentUi.selectedPhaseId))
    }
    if (effectiveTab === 'GRUPOS') return fasesGrupo
    if (effectiveTab === 'FINAL') return faseFinal ? [faseFinal] : []
    return fases
  }, [fases, fasesGrupo, faseFinal, currentUi.selectedPhaseId, effectiveTab])

  const visibleGrupos = useMemo(
    () => visibleFases.filter((f) => f.tipo === 'GRUPO'),
    [visibleFases],
  )
  const visibleFaseFinal = useMemo(
    () => visibleFases.find((f) => f.tipo === 'FINAL') ?? null,
    [visibleFases],
  )

  const visibleMatches = useMemo(() => {
    const base = visibleFases.flatMap((fase) =>
      (fase.partidos ?? []).map((partido) => ({
        ...partido,
        faseId: fase.id,
        faseNombre: fase.nombre,
        faseTipo: fase.tipo,
      })),
    )
    if (currentUi.matchFilter === 'CON_RESULTADO') {
      return base.filter((p) => p.estado !== 'CANCELADO' && p.tieneResultado)
    }
    if (currentUi.matchFilter === 'PENDIENTES') {
      return base.filter((p) => p.estado !== 'CANCELADO' && !p.tieneResultado)
    }
    return base
  }, [visibleFases, currentUi.matchFilter])

  const selectedMatch = useMemo(() => {
    if (currentUi.selectedMatchId !== null) {
      const exact = allMatches.find((m) => m.id === currentUi.selectedMatchId)
      if (exact) return exact
    }
    return allMatches.find((m) => m.tieneResultado) ?? allMatches[0] ?? null
  }, [allMatches, currentUi.selectedMatchId])

  const progressPercent = useMemo(() => {
    const total = desarrollo?.resumen?.totalPartidos ?? 0
    const conResultado = desarrollo?.resumen?.conResultado ?? 0
    if (total === 0) return 0
    return Math.round((conResultado / total) * 100)
  }, [desarrollo])

  const ringOffset = RING_CIRCUMFERENCE - (progressPercent / 100) * RING_CIRCUMFERENCE

  const handleSelectTorneo = (event) => {
    const nextId = event.target.value
    if (nextId && String(nextId) !== String(id)) {
      navigate(`/torneos/${nextId}/desarrollo`)
    }
  }

  const handleSelectPhaseDropdown = (event) => {
    const nextPhaseId = event.target.value
    if (nextPhaseId === 'ALL') {
      updateUi({ selectedPhaseId: 'ALL' })
      return
    }
    const found = fases.find((f) => String(f.id) === String(nextPhaseId))
    updateUi({
      selectedPhaseId: nextPhaseId,
      activeTab: found?.tipo === 'FINAL' ? 'FINAL' : 'GRUPOS',
    })
  }

  const handleSelectTab = (tabKey) => {
    updateUi({ activeTab: tabKey, selectedPhaseId: 'ALL' })
  }

  const handleSelectMatch = (partido) => {
    if (!partido) return
    updateUi({ selectedMatchId: partido.id })
  }

  const scrollToAnotaciones = () => {
    anotacionesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isNotFound = error?.response?.status === 404

  if (loading && !desarrollo) {
    return (
      <div className="page-stack">
        <button
          type="button"
          className="btn back-link dev-back-btn"
          onClick={() => navigate(`/torneos/${id}`)}
        >
          <ArrowLeft size={16} /> Volver al torneo
        </button>
        <div className="panel dev-loading-box">
          <Spinner label="Cargando desarrollo del torneo..." />
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="page-stack">
        <button
          type="button"
          className="btn back-link dev-back-btn"
          onClick={() => navigate('/torneos')}
        >
          <ArrowLeft size={16} /> Volver a torneos
        </button>
        <div className="empty-state">
          <Trophy size={48} className="dev-empty-icon" aria-hidden="true" />
          <h2 className="section-title">Torneo no encontrado</h2>
          <p className="text-muted">
            {getApiErrorMessage(error, `No existe un torneo registrado con el identificador ${id}.`)}
          </p>
        </div>
      </div>
    )
  }

  if (error || !desarrollo) {
    return (
      <div className="page-stack">
        <button
          type="button"
          className="btn back-link dev-back-btn"
          onClick={() => navigate('/torneos')}
        >
          <ArrowLeft size={16} /> Volver a torneos
        </button>
        <Alert type="error">
          {getApiErrorMessage(error, 'No se pudo cargar el desarrollo del torneo.')}{' '}
          <button type="button" className="btn" onClick={reload}>
            Reintentar
          </button>
        </Alert>
      </div>
    )
  }

  const { torneo, resumen } = desarrollo
  const statusTone = ESTADO_TORNEO_TONE[torneo.estado] ?? 'is-muted'
  const selectedEstadoMeta = selectedMatch
    ? ESTADO_PARTIDO_META[selectedMatch.estado] ?? {
        label: selectedMatch.estado,
        className: 'estado-programado',
      }
    : null
  const finalHasTercerPuesto = Boolean(
    faseFinal?.llaves?.some((ronda) => ronda.ronda === 'TERCER_PUESTO'),
  )

  return (
    <div className="page-stack dev-page">
      {/* Barra superior: volver + selector de torneo + filtro de fase + estado */}
      <div className="dev-top-bar">
        <div className="dev-top-controls">
          <button
            type="button"
            className="btn back-link"
            onClick={() => navigate(`/torneos/${id}`)}
          >
            <ArrowLeft size={16} /> Volver al torneo
          </button>

          {canListTorneos && (
            <label className="dev-select-group" htmlFor="dev-torneo-select">
              <span className="dev-select-label">
                <Trophy size={14} aria-hidden="true" /> Seleccionar torneo
              </span>
              <select
                id="dev-torneo-select"
                className="input dev-select"
                value={String(torneo.id)}
                onChange={handleSelectTorneo}
                disabled={torneosState.loading && torneosDisponibles.length === 0}
              >
                {!torneosDisponibles.some((item) => String(item.id) === String(torneo.id)) && (
                  <option value={String(torneo.id)}>{torneo.nombre}</option>
                )}
                {torneosDisponibles.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {fases.length > 0 && (
            <label className="dev-select-group" htmlFor="dev-fase-select">
              <span className="dev-select-label">
                <Layers size={14} aria-hidden="true" /> Fase
              </span>
              <select
                id="dev-fase-select"
                className="input dev-select"
                value={currentUi.selectedPhaseId}
                onChange={handleSelectPhaseDropdown}
              >
                <option value="ALL">Todas las fases</option>
                {fases.map((fase) => (
                  <option key={fase.id} value={String(fase.id)}>
                    {fase.nombre} ({fase.tipo === 'FINAL' ? 'Eliminatoria' : 'Grupo'})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <span className={`dev-status-pill ${statusTone}`}>
          <span className="dev-status-dot" aria-hidden="true" />
          {getTournamentStatusLabel(torneo)}
        </span>
      </div>

      {/* Layout principal de 2 columnas (inspirado en HU-GC-08.png) */}
      <div className="dev-main-grid">
        {/* Columna principal izquierda */}
        <div className="dev-primary-col">
          {/* Tarjeta Hero del torneo + 4 bloques KPI */}
          <section className="panel dev-hero-card">
            <div className="dev-hero-left">
              <div className="dev-hero-crest" aria-hidden="true">
                <Trophy size={30} />
              </div>
              <div className="dev-hero-info">
                <h2 className="dev-hero-title">{torneo.nombre}</h2>
                <div className="dev-hero-meta">
                  <span>
                    <Flag size={14} aria-hidden="true" />
                    Deporte: <strong>{torneo.deporte?.nombre ?? '—'}</strong>
                  </span>
                  <span>
                    <Calendar size={14} aria-hidden="true" />
                    Inicio: <strong>{formatDate(torneo.fechaInicio)}</strong>
                  </span>
                  <span>
                    <Calendar size={14} aria-hidden="true" />
                    Fin: <strong>{formatDate(torneo.fechaFin)}</strong>
                  </span>
                  <span>
                    <Layers size={14} aria-hidden="true" />
                    Fases: <strong>{fases.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="dev-hero-kpis">
              <div className="dev-kpi-tile tone-primary">
                <Users size={18} aria-hidden="true" />
                <strong className="dev-kpi-num">{torneo.cantidadInscritos ?? 0}</strong>
                <span className="dev-kpi-label">Inscritos</span>
              </div>
              <div className="dev-kpi-tile tone-info">
                <Layers size={18} aria-hidden="true" />
                <strong className="dev-kpi-num">{resumen.totalPartidos ?? 0}</strong>
                <span className="dev-kpi-label">Partidos</span>
              </div>
              <div className="dev-kpi-tile tone-accent">
                <CheckCircle2 size={18} aria-hidden="true" />
                <strong className="dev-kpi-num">{resumen.conResultado ?? 0}</strong>
                <span className="dev-kpi-label">Con resultado</span>
              </div>
              <div className="dev-kpi-tile tone-warning">
                <Clock size={18} aria-hidden="true" />
                <strong className="dev-kpi-num">{resumen.pendientes ?? 0}</strong>
                <span className="dev-kpi-label">Pendientes</span>
              </div>
            </div>
          </section>

          {fases.length === 0 ? (
            <section className="empty-state dev-empty-tournament">
              <Layers size={44} className="dev-empty-icon" aria-hidden="true" />
              <h3 className="section-title">Este torneo aún no tiene fases configuradas</h3>
              <p className="text-muted">
                Cuando se registren grupos o una fase final para {torneo.nombre}, aquí aparecerán
                las tablas de posiciones, las llaves eliminatorias y el seguimiento de partidos.
              </p>
              <Link className="btn btn-primary" to={`/torneos/${torneo.id}/fase-final`}>
                Ir a fase final
              </Link>
            </section>
          ) : (
            <>
              {/* Pestañas de fases */}
              {tabs.length > 0 && (
                <div className="dev-phase-tabs" role="tablist" aria-label="Fases del torneo">
                  {tabs.map((tab) => {
                    const isActive =
                      currentUi.selectedPhaseId === 'ALL' && effectiveTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`dev-phase-tab ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectTab(tab.key)}
                      >
                        {tab.key === 'FINAL' ? (
                          <Trophy size={15} aria-hidden="true" />
                        ) : (
                          <Layers size={15} aria-hidden="true" />
                        )}
                        <span>{tab.label}</span>
                        <span className="dev-tab-count">{tab.count}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Tablas de posiciones (Fases tipo GRUPO) */}
              {visibleGrupos.length > 0 && (
                <section className="dev-section">
                  <header className="dev-section-head">
                    <h3 className="section-title">Tablas de posiciones</h3>
                    <span className="text-muted dev-section-hint">
                      Calculadas automáticamente con partidos finalizados (3 pts victoria · 1 empate)
                    </span>
                  </header>
                  <div className="dev-groups-grid">
                    {visibleGrupos.map((grupo) => (
                      <TablaPosicionesCard key={grupo.id} fase={grupo} />
                    ))}
                  </div>
                </section>
              )}

              {/* Cuadro eliminatorio (Fase tipo FINAL) */}
              {visibleFaseFinal && (
                <section className="panel dev-bracket-section">
                  <header className="dev-section-head">
                    <div className="dev-section-title-group">
                      <GitBranch size={18} className="dev-accent-icon" aria-hidden="true" />
                      <h3 className="section-title">
                        {visibleFaseFinal.nombre} · Cuadro de llaves
                      </h3>
                    </div>
                    <Chip>{visibleFaseFinal.llaves?.length ?? 0} rondas</Chip>
                  </header>
                  <CuadroLlaves
                    rondas={visibleFaseFinal.llaves ?? []}
                    tercerPuesto={finalHasTercerPuesto}
                    onSelectPartido={handleSelectMatch}
                  />
                </section>
              )}

              {/* Partidos de la fase */}
              <section className="panel dev-matches-section">
                <header className="dev-matches-head">
                  <div>
                    <h3 className="section-title">Partidos de la fase</h3>
                    <p className="text-muted dev-section-hint">
                      Selecciona un partido para ver su marcador detallado y consultar sus
                      anotaciones.
                    </p>
                  </div>

                  <div className="dev-filter-pills" role="group" aria-label="Filtrar partidos">
                    {[
                      { key: 'ALL', label: 'Todos' },
                      { key: 'CON_RESULTADO', label: 'Con resultado' },
                      { key: 'PENDIENTES', label: 'Pendientes' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`dev-filter-pill ${currentUi.matchFilter === opt.key ? 'is-active' : ''}`}
                        onClick={() => updateUi({ matchFilter: opt.key })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </header>

                {visibleMatches.length === 0 ? (
                  <div className="dev-empty-box">
                    No hay partidos que coincidan con el filtro seleccionado en esta fase.
                  </div>
                ) : (
                  <div className="dev-matches-grid">
                    {visibleMatches.map((partido) => (
                      <PartidoDesarrolloCard
                        key={partido.id}
                        partido={partido}
                        faseNombre={partido.faseNombre}
                        selected={selectedMatch?.id === partido.id}
                        onSelect={handleSelectMatch}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Columna derecha (Rail de estado, detalle del partido y acceso a eliminatoria) */}
        <aside className="dev-side-col">
          {/* 1. Estado de la competencia */}
          <section className="panel dev-side-card">
            <header className="dev-side-card-head">
              <h3 className="section-title">Estado de la competencia</h3>
            </header>

            <div className="dev-progress-wrap">
              <div className="dev-ring-box" aria-label={`${progressPercent}% de partidos con resultado`}>
                <svg className="dev-ring-svg" viewBox="0 0 112 112" aria-hidden="true">
                  <circle className="dev-ring-track" cx="56" cy="56" r={RING_RADIUS} />
                  <circle
                    className="dev-ring-fill"
                    cx="56"
                    cy="56"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="dev-ring-label">
                  <strong>{progressPercent}%</strong>
                  <span>con resultado</span>
                </div>
              </div>

              <dl className="dev-progress-list">
                <div>
                  <dt>Fases registradas</dt>
                  <dd>{fases.length}</dd>
                </div>
                <div>
                  <dt>Equipos inscritos</dt>
                  <dd>{torneo.cantidadInscritos ?? 0}</dd>
                </div>
                <div>
                  <dt>Partidos totales</dt>
                  <dd>{resumen.totalPartidos ?? 0}</dd>
                </div>
                <div>
                  <dt>Con resultado</dt>
                  <dd className="is-primary">{resumen.conResultado ?? 0}</dd>
                </div>
                <div>
                  <dt>Pendientes</dt>
                  <dd className="is-warning">{resumen.pendientes ?? 0}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* 2. Detalle del Partido seleccionado */}
          <section className="panel dev-side-card">
            <header className="dev-side-card-head">
              <h3 className="section-title">Detalle del Partido</h3>
              {selectedMatch && (
                <span
                  className={`bracket-result-tag ${
                    selectedMatch.estado === 'CANCELADO'
                      ? 'is-undefined'
                      : selectedMatch.tieneResultado
                        ? 'is-recorded'
                        : 'is-waiting'
                  }`}
                >
                  {selectedMatch.estado === 'CANCELADO'
                    ? 'Cancelado'
                    : selectedMatch.tieneResultado
                      ? 'Con resultado'
                      : 'Pendiente'}
                </span>
              )}
            </header>

            {!selectedMatch ? (
              <div className="dev-empty-box">
                Selecciona un partido para consultar su marcador y sus anotaciones.
              </div>
            ) : (
              <div className="dev-selected-match">
                <div className="dev-scoreboard">
                  <div className="dev-scoreboard-team">
                    <span className="dev-scoreboard-crest" aria-hidden="true">
                      {getInitials(selectedMatch.equipoLocal?.nombre)}
                    </span>
                    <strong>{selectedMatch.equipoLocal?.nombre ?? 'Por definir'}</strong>
                  </div>

                  <div className="dev-scoreboard-center">
                    {selectedMatch.tieneResultado ? (
                      <span className="dev-scoreboard-score">
                        {selectedMatch.marcadorLocal} - {selectedMatch.marcadorVisitante}
                      </span>
                    ) : (
                      <span className="dev-scoreboard-vs">VS</span>
                    )}
                    {selectedEstadoMeta && (
                      <span className={`bracket-estado-badge ${selectedEstadoMeta.className}`}>
                        {selectedEstadoMeta.label}
                      </span>
                    )}
                  </div>

                  <div className="dev-scoreboard-team">
                    <span className="dev-scoreboard-crest is-away" aria-hidden="true">
                      {getInitials(selectedMatch.equipoVisitante?.nombre)}
                    </span>
                    <strong>{selectedMatch.equipoVisitante?.nombre ?? 'Por definir'}</strong>
                  </div>
                </div>

                <dl className="dev-match-meta-list">
                  <div>
                    <dt>
                      <CalendarClock size={13} aria-hidden="true" /> Fecha y hora
                    </dt>
                    <dd>{formatDateTime(selectedMatch.fechaHora)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Layers size={13} aria-hidden="true" /> Fase
                    </dt>
                    <dd>{selectedMatch.faseNombre}</dd>
                  </div>
                  {selectedMatch.ronda && (
                    <div>
                      <dt>
                        <Trophy size={13} aria-hidden="true" /> Ronda
                      </dt>
                      <dd>
                        {RONDA_LABELS[selectedMatch.ronda] ?? selectedMatch.ronda}
                        {selectedMatch.numeroLlave ? ` · Llave #${selectedMatch.numeroLlave}` : ''}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="dev-selected-actions">
                  <button
                    type="button"
                    className="btn btn-primary dev-full-btn"
                    onClick={scrollToAnotaciones}
                  >
                    <Target size={15} /> Ver anotaciones del partido
                  </button>
                  {canVerPartidos && (
                    <Link
                      to={`/partidos/${selectedMatch.id}`}
                      className="btn dev-full-btn"
                    >
                      <ExternalLink size={15} /> Ver detalle del partido
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 3. Vista eliminatoria (resumen y acceso directo) */}
          <section className="panel dev-side-card">
            <header className="dev-side-card-head">
              <h3 className="section-title">Vista eliminatoria</h3>
              {faseFinal && <Chip>{faseFinal.llaves?.length ?? 0} rondas</Chip>}
            </header>

            {!faseFinal ? (
              <div className="dev-empty-box">
                <p>Este torneo aún no tiene fase final configurada.</p>
                <Link className="btn dev-mt-2" to={`/torneos/${torneo.id}/fase-final`}>
                  Configurar fase final
                </Link>
              </div>
            ) : (
              <div className="dev-elim-summary">
                <div className="dev-elim-rounds">
                  {(faseFinal.llaves ?? []).map((rondaObj) => {
                    const totalLlaves = rondaObj.llaves?.length ?? 0
                    const definidas = (rondaObj.llaves ?? []).filter((l) => l.partido).length
                    return (
                      <div className="dev-elim-round-row" key={rondaObj.ronda}>
                        <span className="dev-elim-round-name">
                          {RONDA_LABELS[rondaObj.ronda] ?? rondaObj.ronda}
                        </span>
                        <span className="dev-elim-round-stat">
                          {definidas} / {totalLlaves} llaves
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="dev-selected-actions">
                  {effectiveTab !== 'FINAL' && (
                    <button
                      type="button"
                      className="btn dev-full-btn"
                      onClick={() => handleSelectTab('FINAL')}
                    >
                      <GitBranch size={15} /> Ver cuadro de llaves
                    </button>
                  )}
                  <Link
                    to={`/torneos/${torneo.id}/fase-final`}
                    className="btn dev-full-btn"
                  >
                    <Trophy size={15} /> Gestionar fase final
                  </Link>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Panel ancho dedicado para <AnotacionesPartido soloLectura /> (Persona B) */}
      {selectedMatch && (
        <section className="dev-annotations-block" ref={anotacionesRef}>
          <div className="dev-annotations-context">
            <span className="dev-annotations-title">
              Anotaciones de:{' '}
              <strong>
                {selectedMatch.equipoLocal?.nombre} vs {selectedMatch.equipoVisitante?.nombre}
              </strong>
            </span>
            <span className="text-muted dev-section-hint">
              {selectedMatch.faseNombre} · Modo solo lectura
            </span>
          </div>

          {canVerPartidos ? (
            <AnotacionesPartido key={selectedMatch.id} partidoId={selectedMatch.id} soloLectura />
          ) : (
            <Alert type="info">
              No tienes permiso para consultar las anotaciones de los partidos.
            </Alert>
          )}
        </section>
      )}
    </div>
  )
}
