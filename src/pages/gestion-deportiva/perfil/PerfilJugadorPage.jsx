import {
  ArrowLeft,
  Calendar,
  History,
  IdCard,
  Mail,
  Phone,
  Search,
  Shield,
  Star,
  UserX,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Avatar } from '../../../components/Avatar'
import { StatusBadge } from '../../../components/Badge'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { perfilService } from '../../../services/gestion/perfilService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDate } from '../../../utils/format'
import { getSkillCategoryMeta, SKILL_CATEGORY_LIST } from './skillMeta'
import './perfil.css'

export function PerfilJugadorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canSearchPlayers = useCan('jugadores', 'listar')

  const loadPerfil = useCallback(() => perfilService.obtenerPerfil(id), [id])
  const { data: perfil, loading, error, reload } = useAsyncData(loadPerfil)

  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const searchBoxRef = useRef(null)

  useEffect(() => {
    if (!canSearchPlayers || !dropdownOpen) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const list = await perfilService.buscarJugadores(query)
        if (!cancelled) {
          setSearchResults(list ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(getApiErrorMessage(err, 'No se pudo buscar jugadores.'))
        }
      } finally {
        if (!cancelled) {
          setSearching(false)
        }
      }
    }, 280)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, dropdownOpen, canSearchPlayers])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlayer = (jugador) => {
    setDropdownOpen(false)
    setQuery('')
    if (String(jugador.id) !== String(id)) {
      navigate(`/jugadores/${jugador.id}/perfil`)
    }
  }

  const categoryDistribution = useMemo(() => {
    const habilidades = perfil?.habilidades ?? []
    const total = Math.max(habilidades.length, 1)
    return SKILL_CATEGORY_LIST.map((cat) => {
      const count = habilidades.filter((item) => item.categoria === cat.key).length
      return {
        ...cat,
        count,
        percent: habilidades.length > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
  }, [perfil])

  const isNotFound = error?.response?.status === 404

  return (
    <div className="page-stack perfil-page">
      <button
        type="button"
        className="btn back-link"
        onClick={() => navigate(`/jugadores/${id}`)}
        style={{ alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={16} /> Volver al jugador
      </button>

      {/* Buscador superior de jugadores */}
      {canSearchPlayers && (
        <div className="perfil-search-bar" ref={searchBoxRef}>
          <label className="perfil-search-label" htmlFor="perfil-player-search">
            Buscar jugador
          </label>
          <div className="perfil-search-wrap">
            <div className="search-box perfil-search-input">
              <Search size={16} aria-hidden="true" />
              <input
                id="perfil-player-search"
                type="search"
                value={query}
                onFocus={() => setDropdownOpen(true)}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setDropdownOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setDropdownOpen(false)
                }}
                placeholder={
                  perfil?.jugador?.nombreCompleto
                    ? `Actual: ${perfil.jugador.nombreCompleto} — busca otro jugador por nombre o documento`
                    : 'Buscar jugador por nombre o documento...'
                }
                autoComplete="off"
              />
            </div>

            {dropdownOpen && (
              <div className="perfil-search-dropdown" role="listbox" aria-label="Resultados de jugadores">
                {searching ? (
                  <div className="perfil-search-status">
                    <Spinner size={16} label="Buscando jugadores..." />
                  </div>
                ) : searchError ? (
                  <div className="perfil-search-status perfil-search-error">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="perfil-search-status">No se encontraron jugadores registrados.</div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`perfil-search-option ${String(item.id) === String(id) ? 'is-current' : ''}`}
                      onClick={() => handleSelectPlayer(item)}
                    >
                      <Avatar name={item.nombreCompleto} size={32} online={item.activo} />
                      <div className="perfil-search-option-text">
                        <strong>{item.nombreCompleto}</strong>
                        <span className="text-muted">
                          {item.tipoDocumento} {item.numeroDocumento}
                        </span>
                      </div>
                      <StatusBadge active={item.activo} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="panel perfil-loading-box">
          <Spinner label="Cargando perfil deportivo..." />
        </div>
      )}

      {!loading && isNotFound && (
        <div className="empty-state">
          <UserX size={48} className="empty-state-icon danger" aria-hidden="true" />
          <h2 className="section-title">Jugador no encontrado</h2>
          <p className="text-muted">
            {getApiErrorMessage(error, `No existe un jugador registrado con el identificador ${id}.`)}
          </p>
        </div>
      )}

      {!loading && error && !isNotFound && (
        <Alert type="error">
          {getApiErrorMessage(error, 'No se pudo cargar el perfil deportivo del jugador.')}{' '}
          <button type="button" className="btn" onClick={reload}>
            Reintentar
          </button>
        </Alert>
      )}

      {!loading && perfil && (
        <>
          {perfil.mensajes?.length > 0 && (
            <div className="perfil-alerts">
              {perfil.mensajes.map((mensaje) => (
                <Alert key={mensaje} type="info">
                  {mensaje}
                </Alert>
              ))}
            </div>
          )}

          {/* Grilla principal de 3 bloques inspirada en HU-GD-08 */}
          <div className="perfil-main-grid">
            {/* 1. Tarjeta principal del jugador */}
            <section className="panel perfil-hero-card">
              <div className="perfil-hero-top">
                <div className="perfil-hero-avatar-glow">
                  <Avatar
                    name={perfil.jugador.nombreCompleto}
                    size={96}
                    online={perfil.jugador.activo}
                  />
                </div>
                <span className="perfil-doc-tag mono">
                  {perfil.jugador.tipoDocumento} · {perfil.jugador.numeroDocumento}
                </span>
                <h2 className="perfil-hero-name">{perfil.jugador.nombreCompleto}</h2>
                <StatusBadge active={perfil.jugador.activo} />
              </div>

              <div className="perfil-hero-metrics">
                <div className="perfil-hero-metric">
                  <span className="perfil-hero-metric-value">{perfil.jugador.edad ?? '—'}</span>
                  <span className="perfil-hero-metric-label">Edad</span>
                </div>
                <div className="perfil-hero-metric">
                  <span className="perfil-hero-metric-value">
                    {perfil.equiposActuales?.length ?? 0}
                  </span>
                  <span className="perfil-hero-metric-label">Equipos activos</span>
                </div>
                <div className="perfil-hero-metric">
                  <span className="perfil-hero-metric-value">
                    {perfil.habilidades?.length ?? 0}
                  </span>
                  <span className="perfil-hero-metric-label">Habilidades</span>
                </div>
              </div>
            </section>

            {/* 2. Resumen deportivo real (conteos + distribución real por categoría) */}
            <section className="panel perfil-summary-card">
              <header className="perfil-card-header">
                <h3 className="section-title">Resumen deportivo</h3>
                <span className="chip">Datos verificados</span>
              </header>

              <div className="perfil-summary-kpis">
                <div className="perfil-mini-kpi">
                  <span className="perfil-mini-kpi-value">
                    {perfil.equiposActuales?.length ?? 0}
                  </span>
                  <span className="perfil-mini-kpi-label">Equipos vigentes</span>
                </div>
                <div className="perfil-mini-kpi">
                  <span className="perfil-mini-kpi-value">
                    {perfil.historialEquipos?.length ?? 0}
                  </span>
                  <span className="perfil-mini-kpi-label">Traspasos previos</span>
                </div>
                <div className="perfil-mini-kpi">
                  <span className="perfil-mini-kpi-value">
                    {perfil.habilidades?.length ?? 0}
                  </span>
                  <span className="perfil-mini-kpi-label">Habilidades</span>
                </div>
              </div>

              <div className="perfil-category-section">
                <p className="detail-section-title">Distribución de habilidades por categoría</p>
                {!perfil.tieneHabilidades ? (
                  <p className="text-muted perfil-muted-note">
                    El jugador no tiene habilidades registradas para mostrar distribución por
                    categoría.
                  </p>
                ) : (
                  <div className="category-bars">
                    {categoryDistribution.map((cat) => {
                      const Icon = cat.icon
                      return (
                        <div className="category-bar-row" key={cat.key}>
                          <div className="category-bar-label">
                            <Icon
                              size={15}
                              className={`tone-text-${cat.tone}`}
                              aria-hidden="true"
                            />
                            <span>{cat.label}</span>
                          </div>
                          <div className="category-bar-track" aria-hidden="true">
                            <div
                              className={`category-bar-fill tone-fill-${cat.tone}`}
                              style={{ width: `${cat.percent}%` }}
                            />
                          </div>
                          <span className="category-bar-value">{cat.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* 3. Columna derecha: Equipos asociados (timeline) + Habilidades */}
            <div className="perfil-right-stack">
              <section className="panel perfil-card">
                <header className="perfil-card-header">
                  <div className="perfil-card-title-group">
                    <History size={18} className="perfil-accent-icon" aria-hidden="true" />
                    <h3 className="section-title">Equipos asociados</h3>
                  </div>
                  <span className="chip">
                    {(perfil.equiposActuales?.length ?? 0) + (perfil.historialEquipos?.length ?? 0)}{' '}
                    registros
                  </span>
                </header>

                {!perfil.tieneEquipos && (perfil.historialEquipos?.length ?? 0) === 0 ? (
                  <div className="skills-empty-box">El jugador no tiene equipos asociados.</div>
                ) : (
                  <div className="team-timeline">
                    {!perfil.tieneEquipos && (
                      <p className="text-muted perfil-muted-note">
                        Sin equipos activos actualmente.
                      </p>
                    )}

                    {(perfil.equiposActuales ?? []).map((item, idx) => (
                      <div
                        className="timeline-item"
                        key={`actual-${item.equipo?.id ?? idx}-${item.fechaInicio}`}
                      >
                        <span className="timeline-dot timeline-dot-active" aria-hidden="true" />
                        <div className="timeline-card timeline-card-active">
                          <div className="timeline-card-top">
                            <div className="timeline-team-title">
                              <Shield size={16} className="tone-text-fisica" aria-hidden="true" />
                              <strong>{item.equipo?.nombre ?? 'Equipo sin nombre'}</strong>
                            </div>
                            <div className="timeline-badges">
                              <span className="badge badge-success">Actual</span>
                              {item.equipo && <StatusBadge active={item.equipo.activo} />}
                            </div>
                          </div>
                          <p className="timeline-dates">
                            Contrato: {formatDate(item.fechaInicio)} – {formatDate(item.fechaFin)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(perfil.historialEquipos ?? []).map((item, idx) => (
                      <div
                        className="timeline-item"
                        key={`hist-${item.equipo?.id ?? idx}-${item.fechaInicio}-${item.fechaRetiro ?? ''}`}
                      >
                        <span className="timeline-dot" aria-hidden="true" />
                        <div className="timeline-card">
                          <div className="timeline-card-top">
                            <div className="timeline-team-title">
                              <Shield size={16} className="text-muted" aria-hidden="true" />
                              <strong>{item.equipo?.nombre ?? 'Equipo sin nombre'}</strong>
                            </div>
                            <span className="badge badge-muted">Historial</span>
                          </div>
                          <p className="timeline-dates">
                            Contrato: {formatDate(item.fechaInicio)} – {formatDate(item.fechaFin)}
                          </p>
                          {item.fechaRetiro && (
                            <p className="timeline-retiro">
                              Fecha de retiro: {formatDate(item.fechaRetiro)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel perfil-card">
                <header className="perfil-card-header">
                  <div className="perfil-card-title-group">
                    <Star size={18} className="perfil-accent-icon" aria-hidden="true" />
                    <h3 className="section-title">Habilidades</h3>
                  </div>
                  <span className="chip">{perfil.habilidades?.length ?? 0}</span>
                </header>

                {!perfil.tieneHabilidades ? (
                  <div className="skills-empty-box">El jugador no tiene habilidades registradas.</div>
                ) : (
                  <div className="perfil-skills-grid">
                    {perfil.habilidades.map((habilidad) => {
                      const meta = getSkillCategoryMeta(habilidad.categoria)
                      const Icon = meta.icon
                      return (
                        <div className="perfil-skill-pill" key={habilidad.id}>
                          <span className={`perfil-skill-icon tone-${meta.tone}`}>
                            <Icon size={16} aria-hidden="true" />
                          </span>
                          <div className="perfil-skill-info">
                            <strong>{habilidad.nombre}</strong>
                            <span className={`tone-text-${meta.tone}`}>{meta.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Barra inferior de Información básica (inspirada en HU-GD-08) */}
          <section className="panel perfil-basic-card">
            <header className="perfil-basic-header">
              <IdCard size={18} className="perfil-accent-icon" aria-hidden="true" />
              <h3 className="section-title">Información básica</h3>
            </header>
            <div className="perfil-basic-grid">
              <div className="perfil-basic-item">
                <span className="perfil-basic-icon tone-fisica">
                  <IdCard size={18} aria-hidden="true" />
                </span>
                <div>
                  <span className="perfil-basic-label">Documento</span>
                  <strong className="perfil-basic-value">
                    {perfil.jugador.tipoDocumento} {perfil.jugador.numeroDocumento}
                  </strong>
                </div>
              </div>

              <div className="perfil-basic-item">
                <span className="perfil-basic-icon tone-tactica">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <div>
                  <span className="perfil-basic-label">Email</span>
                  <strong className="perfil-basic-value">
                    {perfil.jugador.email || 'No registrado'}
                  </strong>
                </div>
              </div>

              <div className="perfil-basic-item">
                <span className="perfil-basic-icon tone-tecnica">
                  <Phone size={18} aria-hidden="true" />
                </span>
                <div>
                  <span className="perfil-basic-label">Teléfono</span>
                  <strong className="perfil-basic-value">
                    {perfil.jugador.telefono || 'No registrado'}
                  </strong>
                </div>
              </div>

              <div className="perfil-basic-item">
                <span className="perfil-basic-icon tone-mental">
                  <Calendar size={18} aria-hidden="true" />
                </span>
                <div>
                  <span className="perfil-basic-label">Fecha de nacimiento</span>
                  <strong className="perfil-basic-value">
                    {formatDate(perfil.jugador.fechaNacimiento)} ({perfil.jugador.edad} años)
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
