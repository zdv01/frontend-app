import {
  Box,
  Building2,
  ChartColumn,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  RotateCcw,
  Save,
  Scale,
  Shield,
  ShieldCheck,
  ShieldX,
  Shirt,
  SquarePlus,
  Ticket,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
  Volleyball,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { StatusBadge } from '../../components/Badge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Spinner } from '../../components/Spinner'
import { MODULES, OPERATIONS, RESOURCES, permissionKey } from '../../constants/permissions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import {
  permissionsService,
  rolePermissionsService,
  rolesService,
  userRolesService,
} from '../../services'
import { getApiErrorMessage } from '../../utils/apiError'
import { RoleSelect } from './RoleSelect'
import './RolePermissionsPage.css'

const RESOURCE_ICONS = {
  usuarios: UserRound,
  roles: ShieldCheck,
  permisos: KeyRound,
  torneos: Trophy,
  equipos: Users,
  jugadores: Shirt,
  partidos: Volleyball,
  entradas: Ticket,
  escenarios: Building2,
  reportes: ChartColumn,
}

const ACCESS_RULES = [
  'Si al menos uno de los roles del usuario posee el permiso, la operación se permite.',
  'Si ninguno de sus roles posee el permiso requerido, el acceso se deniega.',
  'Los cambios aplican a todos los usuarios que tengan asignado este rol.',
]

function sameSet(a, b) {
  return a.size === b.size && [...a].every((id) => b.has(id))
}

// Módulos del catálogo + un grupo "Otros" para permisos con recursos desconocidos
function buildGroups(permissions) {
  const known = new Set(RESOURCES.map((r) => r.key))
  const unknown = [...new Set(permissions.map((p) => p.resource))].filter((key) => !known.has(key))
  if (!unknown.length) return MODULES
  return [
    ...MODULES,
    { key: 'otros', label: 'Otros', resources: unknown.map((key) => ({ key, label: key })) },
  ]
}

// HU-SE-06: matriz para asignar y retirar permisos a un rol (réplica del mockup)
export function RolePermissionsPage() {
  const { can, refreshSession } = useAuth()
  const toast = useToast()
  const canEdit = can('roles', 'actualizar')
  const [searchParams, setSearchParams] = useSearchParams()

  // Catálogo: todos los roles y todos los permisos del sistema
  const loadCatalog = useCallback(
    () => Promise.all([rolesService.list(), permissionsService.list()]),
    [],
  )
  const catalog = useAsyncData(loadCatalog)
  const [roles, permissions] = catalog.data ?? [[], []]

  const role = roles.find((r) => r.id === Number(searchParams.get('roleId'))) ?? roles[0] ?? null
  const roleId = role?.id ?? null

  // Lo guardado del rol seleccionado: sus permisos y sus usuarios
  const loadAssignments = useCallback(
    () =>
      roleId === null
        ? Promise.resolve(null)
        : Promise.all([
            rolePermissionsService.listPermissionIds(roleId),
            userRolesService.listUsersByRole(roleId),
          ]),
    [roleId],
  )
  const assignments = useAsyncData(loadAssignments)
  const savedData = assignments.data

  // Borrador: los cambios marcados en la matriz que aún no se guardan.
  // "base" recuerda sobre qué datos guardados se hicieron los cambios.
  const [draft, setDraft] = useState({ base: null, ids: null })
  const savedIds = useMemo(() => new Set(savedData?.[0] ?? []), [savedData])
  const checkedIds = draft.base !== null && draft.base === savedData ? draft.ids : savedIds
  const isDirty = !sameSet(savedIds, checkedIds)

  const [collapsed, setCollapsed] = useState(() => new Set())
  const [savedNotice, setSavedNotice] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'role', roleId } | { type: 'reload' }

  const groups = useMemo(() => buildGroups(permissions), [permissions])
  const permissionByKey = useMemo(
    () => new Map(permissions.map((p) => [permissionKey(p.resource, p.operation), p])),
    [permissions],
  )

  // Resumen del panel derecho (se recalcula en vivo con el borrador)
  const activePermissions = permissions.filter((p) => p.active)
  const assignedCount = activePermissions.filter((p) => checkedIds.has(p.id)).length
  const modulesWithAccess = groups.filter((group) =>
    group.resources.some((resource) =>
      OPERATIONS.some((op) => {
        const p = permissionByKey.get(permissionKey(resource.key, op.key))
        return p && checkedIds.has(p.id)
      }),
    ),
  ).length
  const usersCount = savedData?.[1]?.length ?? 0

  const busy = saving || assignments.loading

  const toggle = (permissionId) => {
    const next = new Set(checkedIds)
    if (next.has(permissionId)) next.delete(permissionId)
    else next.add(permissionId)
    setDraft({ base: savedData, ids: next })
    setSavedNotice(false)
  }

  const toggleGroup = (groupKey) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const runAction = (action) => {
    setDraft({ base: null, ids: null })
    setSavedNotice(false)
    if (action.type === 'role') {
      setSearchParams({ roleId: String(action.roleId) })
    } else {
      catalog.reload()
      assignments.reload()
    }
  }

  // Si hay cambios sin guardar, se pide confirmación antes de descartarlos
  const requestAction = (action) => {
    if (isDirty) setPendingAction(action)
    else runAction(action)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await rolePermissionsService.save(roleId, [...checkedIds])
      setSavedNotice(true)
      assignments.reload()
      // Si el usuario actual tiene este rol, sus permisos efectivos cambian al instante
      await refreshSession()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudieron guardar los permisos.'))
    } finally {
      setSaving(false)
    }
  }

  if (catalog.loading && !catalog.data) {
    return <Spinner label="Cargando roles y permisos..." />
  }
  if (catalog.error) {
    return <Alert type="error">{getApiErrorMessage(catalog.error, 'No se pudo cargar la información.')}</Alert>
  }
  if (!role) {
    return (
      <div className="empty-state">
        <ShieldX size={48} className="empty-state-icon" aria-hidden="true" />
        <h2 className="section-title">No hay roles registrados</h2>
        <p className="text-muted">Crea un rol para poder asignarle permisos.</p>
      </div>
    )
  }

  return (
    <div className="rp-layout">
      <div className="rp-main">
        <section className="panel rp-toolbar">
          <div className="rp-role-field">
            <span className="rp-label">Rol seleccionado</span>
            <RoleSelect
              roles={roles}
              value={roleId}
              onChange={(id) => id !== roleId && requestAction({ type: 'role', roleId: id })}
              disabled={saving}
            />
          </div>
          <div className="rp-buttons">
            <button
              type="button"
              className="btn"
              onClick={() => requestAction({ type: 'reload' })}
              disabled={saving}
            >
              <SquarePlus size={18} /> Cargar permisos
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!isDirty || busy}
                >
                  {saving ? <Spinner size={18} /> : <Save size={18} />} Guardar cambios
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDraft({ base: null, ids: null })}
                  disabled={!isDirty || busy}
                >
                  <RotateCcw size={18} /> Restablecer
                </button>
              </>
            )}
          </div>
        </section>

        <div className="rp-notices">
          {savedNotice && (
            <Alert type="success" onClose={() => setSavedNotice(false)}>
              Permisos actualizados correctamente.
            </Alert>
          )}
          {isDirty && !busy && (
            <Alert type="info">Tienes cambios sin guardar. Presiona «Guardar cambios» para aplicarlos.</Alert>
          )}
          <Alert type="info">
            Los permisos seleccionados se conservarán después de cerrar e iniciar sesión nuevamente.
          </Alert>
        </div>

        <section className="panel rp-matrix-panel">
          <h2 className="section-title">Matriz de permisos del rol</h2>
          {!canEdit && (
            <p className="text-muted">Solo lectura: no tienes permiso para modificar los roles.</p>
          )}
          <div className="table-scroll">
            <table className="rp-matrix">
              <thead>
                <tr>
                  <th scope="col">Recurso</th>
                  {OPERATIONS.map((op) => (
                    <th key={op.key} scope="col">
                      {op.label}
                    </th>
                  ))}
                </tr>
              </thead>
              {groups.map((group) => {
                const isCollapsed = collapsed.has(group.key)
                return (
                  <tbody key={group.key}>
                    <tr className="rp-group-row">
                      <th colSpan={OPERATIONS.length + 1} scope="rowgroup">
                        <button
                          type="button"
                          className="rp-group-toggle"
                          onClick={() => toggleGroup(group.key)}
                          aria-expanded={!isCollapsed}
                        >
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          {group.label}
                        </button>
                      </th>
                    </tr>
                    {!isCollapsed &&
                      group.resources.map((resource) => {
                        const Icon = RESOURCE_ICONS[resource.key] ?? Box
                        return (
                          <tr key={resource.key}>
                            <th scope="row" className="rp-resource">
                              <span className="rp-resource-label">
                                <Icon size={18} aria-hidden="true" />
                                {resource.label}
                              </span>
                            </th>
                            {OPERATIONS.map((op) => {
                              const permission = permissionByKey.get(permissionKey(resource.key, op.key))
                              if (!permission) {
                                return (
                                  <td key={op.key} className="rp-cell">
                                    <span
                                      className="rp-missing"
                                      title="Este permiso no está registrado en el sistema"
                                    >
                                      —
                                    </span>
                                  </td>
                                )
                              }
                              return (
                                <td key={op.key} className="rp-cell">
                                  <input
                                    type="checkbox"
                                    className="rp-check"
                                    checked={checkedIds.has(permission.id)}
                                    onChange={() => toggle(permission.id)}
                                    disabled={!canEdit || busy || !permission.active}
                                    title={permission.active ? undefined : 'Permiso inactivo'}
                                    aria-label={`${op.label} ${resource.label}`}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                  </tbody>
                )
              })}
            </table>
          </div>
        </section>
      </div>

      <aside className="rp-side">
        <section className="panel rp-summary">
          <h2 className="rp-side-title">
            <CircleUserRound size={22} aria-hidden="true" /> Resumen del rol
          </h2>
          <dl className="rp-summary-list">
            <div>
              <dt>Nombre del rol:</dt>
              <dd>
                <strong>{role.name}</strong>
              </dd>
            </div>
            <div>
              <dt>Estado:</dt>
              <dd>
                <StatusBadge active={role.active} />
              </dd>
            </div>
          </dl>
          <dl className="rp-summary-list rp-summary-counts">
            <div>
              <dt>
                <Users size={18} aria-hidden="true" /> Usuarios asociados:
              </dt>
              <dd>{assignments.loading && !savedData ? '…' : usersCount}</dd>
            </div>
            <div>
              <dt>
                <KeyRound size={18} aria-hidden="true" /> Total permisos asignados:
              </dt>
              <dd>{assignedCount}</dd>
            </div>
            <div>
              <dt>
                <Box size={18} aria-hidden="true" /> Módulos con acceso:
              </dt>
              <dd>{modulesWithAccess}</dd>
            </div>
          </dl>
          <div className="rp-cards">
            <div className="rp-card">
              <Shield size={26} aria-hidden="true" />
              <span>Total permisos disponibles</span>
              <strong className="rp-card-value accent">{activePermissions.length}</strong>
            </div>
            <div className="rp-card">
              <ShieldCheck size={26} className="primary" aria-hidden="true" />
              <span className="primary">Asignados</span>
              <strong className="rp-card-value primary">{assignedCount}</strong>
            </div>
            <div className="rp-card">
              <ShieldX size={26} aria-hidden="true" />
              <span>No asignados</span>
              <strong className="rp-card-value">{activePermissions.length - assignedCount}</strong>
            </div>
          </div>
        </section>

        <section className="panel rp-legend">
          <h2 className="rp-side-subtitle">Leyenda</h2>
          <p>
            <input type="checkbox" className="rp-check" checked readOnly tabIndex={-1} aria-hidden="true" />
            Permiso asignado
          </p>
          <p>
            <input type="checkbox" className="rp-check" checked={false} readOnly tabIndex={-1} aria-hidden="true" />
            Permiso no asignado
          </p>
          <p>
            <span className="rp-missing">—</span> Permiso no registrado en el sistema
          </p>
        </section>

        <section className="panel rp-rules">
          <h2 className="rp-side-subtitle">
            <Scale size={20} aria-hidden="true" /> Reglas de acceso
          </h2>
          <ul>
            {ACCESS_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <div className="rp-warning" role="note">
          <TriangleAlert size={22} aria-hidden="true" />
          Retirar un permiso del rol no elimina el permiso del sistema.
        </div>
      </aside>

      {pendingAction && (
        <ConfirmDialog
          title="Descartar cambios"
          confirmLabel="Descartar"
          onConfirm={() => {
            runAction(pendingAction)
            setPendingAction(null)
          }}
          onCancel={() => setPendingAction(null)}
          message={<p>Tienes cambios sin guardar en la matriz. ¿Quieres descartarlos?</p>}
        />
      )}
    </div>
  )
}
