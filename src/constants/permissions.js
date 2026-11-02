// Operaciones que puede autorizar un permiso (columnas de la matriz HU-SE-06)
export const OPERATIONS = [
  { key: 'ver', label: 'Ver' },
  { key: 'listar', label: 'Listar' },
  { key: 'crear', label: 'Crear' },
  { key: 'actualizar', label: 'Actualizar' },
  { key: 'eliminar', label: 'Eliminar' },
]

/*
 * Recursos agrupados por módulo, igual que en el mockup de la matriz.
 * - model: nombre del modelo en el backend (campo "model" de Permission)
 * - path:  URL base del recurso en el backend
 */
export const MODULES = [
  {
    key: 'administracion',
    label: 'Administración',
    resources: [
      { key: 'usuarios', label: 'Usuarios', model: 'User', path: '/api/users' },
      { key: 'roles', label: 'Roles', model: 'Role', path: '/api/roles' },
      { key: 'permisos', label: 'Permisos', model: 'Permission', path: '/api/permissions' },
      { key: 'asignacion-roles', label: 'Asignación de Roles', model: 'UserRole', path: '/api/user-roles' },
      { key: 'asignacion-permisos', label: 'Asignación de Permisos', model: 'RolePermission', path: '/api/role-permissions' },
    ],
  },
  {
    key: 'gestion-deportiva',
    label: 'Gestión Deportiva',
    resources: [
      { key: 'torneos', label: 'Torneos', model: 'Tournament', path: '/api/tournaments' },
      { key: 'equipos', label: 'Equipos', model: 'Team', path: '/api/teams' },
      { key: 'jugadores', label: 'Jugadores', model: 'Player', path: '/api/players' },
      { key: 'partidos', label: 'Partidos', model: 'Match', path: '/api/matches' },
    ],
  },
  {
    key: 'comercial',
    label: 'Comercial',
    resources: [{ key: 'entradas', label: 'Entradas', model: 'Ticket', path: '/api/tickets' }],
  },
  {
    key: 'infraestructura',
    label: 'Infraestructura',
    resources: [{ key: 'escenarios', label: 'Escenarios', model: 'Venue', path: '/api/venues' }],
  },
  {
    key: 'reportes',
    label: 'Reportes',
    resources: [{ key: 'reportes', label: 'Reportes', model: 'Report', path: '/api/reports' }],
  },
]

// Lista plana de recursos, cada uno con el módulo al que pertenece
export const RESOURCES = MODULES.flatMap((module) =>
  module.resources.map((resource) => ({
    ...resource,
    moduleKey: module.key,
    moduleLabel: module.label,
  })),
)

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// Un permiso se representa como texto "recurso:operacion", por ejemplo "usuarios:crear"
export function permissionKey(resource, operation) {
  return `${resource}:${operation}`
}

export function getResource(resourceKey) {
  return RESOURCES.find((resource) => resource.key === resourceKey)
}

export function getOperationLabel(operationKey) {
  return OPERATIONS.find((operation) => operation.key === operationKey)?.label ?? operationKey
}

// Nombres visibles de un permiso (si el recurso no está en el catálogo, va al grupo "Otros")
export function describePermission(permission) {
  const resource = getResource(permission.resource)
  return {
    resourceLabel: resource?.label ?? permission.resource,
    moduleLabel: resource?.moduleLabel ?? 'Otros',
    moduleKey: resource?.moduleKey ?? 'otros',
    operationLabel: getOperationLabel(permission.operation),
  }
}

// "User" → "usuarios". Si el modelo no se conoce, se usa tal cual en minúsculas.
export function resourceFromModel(model = '') {
  const found = RESOURCES.find((resource) => resource.model.toLowerCase() === model.toLowerCase())
  return found?.key ?? model.toLowerCase()
}

export function modelFromResource(resourceKey) {
  return getResource(resourceKey)?.model ?? resourceKey
}

// URL y método que normalmente corresponden a una operación sobre un recurso
export function suggestEndpoint(resourceKey, operationKey) {
  const base = getResource(resourceKey)?.path
  if (!base) return null
  const endpoints = {
    ver: { method: 'GET', url: `${base}/{id}` },
    listar: { method: 'GET', url: base },
    crear: { method: 'POST', url: base },
    actualizar: { method: 'PUT', url: `${base}/{id}` },
    eliminar: { method: 'DELETE', url: `${base}/{id}` },
  }
  return endpoints[operationKey] ?? null
}

// El backend no guarda la operación; se deduce del método y la URL
export function deriveOperation(method = '', url = '') {
  const upper = method.toUpperCase()
  if (upper === 'GET') return url.includes('{id}') ? 'ver' : 'listar'
  if (upper === 'POST') return 'crear'
  if (upper === 'PUT' || upper === 'PATCH') return 'actualizar'
  if (upper === 'DELETE') return 'eliminar'
  return 'ver'
}
