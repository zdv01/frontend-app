import { ArrowLeft, Info, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Chip } from '../../../components/Badge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { PermissionGate } from '../../../components/PermissionGate'
import { Spinner } from '../../../components/Spinner'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useCan } from '../../../hooks/useCan'
import { useToast } from '../../../hooks/useToast'
import { fasesService } from '../../../services/gestion/fasesService'
import { torneosService } from '../../../services/gestion/torneosService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { CuadroLlaves } from './CuadroLlaves'
import { FaseFinalFormModal } from './FaseFinalFormModal'
import './fase-final.css'

const ESTADOS_TORNEO_CERRADO = ['FINALIZADO', 'CANCELADO']

export function FaseFinalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const canVerLlaves = useCan('fases', 'ver')

  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    const torneo = await torneosService.get(id)
    if (!torneo) {
      const err = new Error('El torneo no existe.')
      err.response = { status: 404, data: { errorCase: 'NOT_FOUND', message: 'El torneo no existe.' } }
      throw err
    }

    let faseFinal = null
    try {
      faseFinal = await fasesService.obtenerFaseFinal(id)
    } catch (error) {
      if (error?.response?.status !== 404) {
        throw error
      }
    }

    let llaves = null
    let llavesError = ''
    if (faseFinal && canVerLlaves) {
      try {
        llaves = await fasesService.obtenerLlaves(faseFinal.id)
      } catch (error) {
        llavesError = getApiErrorMessage(error, 'No se pudo cargar el cuadro de llaves.')
      }
    }

    return { torneo, faseFinal, llaves, llavesError }
  }, [id, canVerLlaves])

  const { data, loading, error, reload } = useAsyncData(loadData)

  const torneo = data?.torneo ?? null
  const faseFinal = data?.faseFinal ?? null
  const llaves = data?.llaves ?? null
  const llavesError = data?.llavesError ?? ''

  const torneoCerrado = ESTADOS_TORNEO_CERRADO.includes(torneo?.estado)

  const handleSaved = () => {
    setShowFormModal(false)
    reload()
  }

  const handleDelete = async () => {
    if (!faseFinal) return
    setDeleting(true)
    try {
      await fasesService.eliminarFaseFinal(faseFinal.id)
      toast.success('Fase final eliminada correctamente.')
      setShowDeleteConfirm(false)
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar la fase final.'))
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="page-stack">
        <button type="button" className="btn back-link ff-back-btn" onClick={() => navigate(`/torneos/${id}`)}>
          <ArrowLeft size={16} /> Volver al torneo
        </button>
        <div className="panel ff-loading-box">
          <Spinner label="Cargando fase final..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-stack">
        <button type="button" className="btn back-link ff-back-btn" onClick={() => navigate('/torneos')}>
          <ArrowLeft size={16} /> Volver a torneos
        </button>
        <Alert type="error">
          {getApiErrorMessage(error, 'No se pudo cargar la información de la fase final.')}{' '}
          <button type="button" className="btn" onClick={reload}>
            Reintentar
          </button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="page-stack ff-page">
      <div className="ff-top-bar">
        <button
          type="button"
          className="btn back-link"
          onClick={() => navigate(`/torneos/${id}`)}
        >
          <ArrowLeft size={16} /> Volver al torneo
        </button>

        {torneo && (
          <div className="ff-tournament-context">
            <span className="ff-tournament-name">{torneo.nombre}</span>
            {torneo.deporte?.nombre && <Chip>{torneo.deporte.nombre}</Chip>}
            <span
              className={`badge ${torneoCerrado ? 'badge-muted' : 'badge-success'}`}
            >
              <span className="badge-dot" aria-hidden="true" />
              {torneo.estado?.replaceAll('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {torneoCerrado && (
        <Alert type="info">
          Este torneo se encuentra en estado <strong>{torneo.estado}</strong>. La fase final no
          permite creación, edición ni eliminación en este estado.
        </Alert>
      )}

      {!faseFinal ? (
        <section className="empty-state ff-empty-card">
          <Trophy size={48} className="ff-empty-icon" aria-hidden="true" />
          <h2 className="section-title">Este torneo aún no tiene fase final configurada</h2>
          <p className="text-muted">
            Define el nombre, el orden de ejecución, la cantidad de equipos clasificados y si se
            disputará partido por el tercer puesto para generar el cuadro de llaves.
          </p>
          <PermissionGate resource="torneos" operation="crear">
            <button
              type="button"
              className="btn btn-primary"
              disabled={torneoCerrado}
              onClick={() => setShowFormModal(true)}
            >
              <Plus size={16} /> Configurar fase final
            </button>
          </PermissionGate>
        </section>
      ) : (
        <>
          {/* Resumen de configuración y acciones */}
          <section className="panel ff-config-panel">
            <div className="ff-config-header">
              <div className="ff-config-title-wrap">
                <span className="ff-trophy-badge" aria-hidden="true">
                  <Trophy size={22} />
                </span>
                <div>
                  <h2 className="section-title">{faseFinal.nombre}</h2>
                  <p className="text-muted ff-config-subtitle">
                    Etapa eliminatoria oficial del torneo {torneo?.nombre ?? ''}.
                  </p>
                </div>
              </div>

              {!torneoCerrado && (
                <div className="ff-config-actions">
                  <PermissionGate resource="fases" operation="actualizar">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowFormModal(true)}
                    >
                      <Pencil size={15} /> Editar
                    </button>
                  </PermissionGate>

                  <PermissionGate resource="fases" operation="eliminar">
                    <button
                      type="button"
                      className="btn ff-btn-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={15} /> Eliminar
                    </button>
                  </PermissionGate>
                </div>
              )}
            </div>

            <div className="ff-metrics-grid">
              <div className="ff-metric-card">
                <span className="ff-metric-label">Orden</span>
                <strong className="ff-metric-value">#{faseFinal.orden}</strong>
              </div>
              <div className="ff-metric-card">
                <span className="ff-metric-label">Equipos clasificados</span>
                <strong className="ff-metric-value">{faseFinal.cantidadEquipos}</strong>
              </div>
              <div className="ff-metric-card">
                <span className="ff-metric-label">Tercer puesto</span>
                <strong className="ff-metric-value">
                  {faseFinal.tercerPuesto ? 'Incluido' : 'No incluido'}
                </strong>
              </div>
              <div className="ff-metric-card">
                <span className="ff-metric-label">Partidos asociados</span>
                <strong className="ff-metric-value">{faseFinal.cantidadPartidos ?? 0}</strong>
              </div>
            </div>
          </section>

          {/* Cuadro eliminatorio */}
          <section className="panel ff-bracket-panel">
            <header className="ff-bracket-header">
              <div>
                <h3 className="section-title">Vista eliminatoria · Cuadro de llaves</h3>
                <p className="text-muted ff-config-subtitle">
                  Seguimiento de enfrentamientos, marcadores y clasificados por ronda.
                </p>
              </div>
              {llaves && <Chip>{llaves.rondas?.length ?? 0} rondas</Chip>}
            </header>

            {!canVerLlaves ? (
              <Alert type="info">
                No tienes permiso para consultar el detalle de las llaves eliminatorias.
              </Alert>
            ) : llavesError ? (
              <Alert type="error">
                {llavesError}{' '}
                <button type="button" className="btn" onClick={reload}>
                  Reintentar
                </button>
              </Alert>
            ) : llaves ? (
              <CuadroLlaves
                rondas={llaves.rondas}
                tercerPuesto={llaves.tercerPuesto}
              />
            ) : (
              <Spinner label="Cargando cuadro de llaves..." />
            )}

            <div className="ff-info-note">
              <Info size={16} aria-hidden="true" />
              <span>
                La programación de partidos, el registro de resultados y el avance de los ganadores
                hacia la siguiente ronda se realizan desde Gestión de Partidos.
              </span>
            </div>
          </section>
        </>
      )}

      {showFormModal && (
        <FaseFinalFormModal
          torneoId={Number(id)}
          faseFinal={faseFinal}
          onClose={() => setShowFormModal(false)}
          onSaved={handleSaved}
        />
      )}

      {showDeleteConfirm && faseFinal && (
        <ConfirmDialog
          title="Eliminar fase final"
          message={
            (faseFinal.cantidadPartidos ?? 0) > 0
              ? `Esta fase final tiene ${faseFinal.cantidadPartidos} partidos asociados y el sistema impedirá su eliminación mientras existan encuentros vinculados. ¿Deseas intentar eliminarla de todos modos?`
              : `¿Seguro que deseas eliminar "${faseFinal.nombre}"? Esta acción no afectará las demás fases ni los equipos inscritos del torneo.`
          }
          confirmLabel="Eliminar"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
