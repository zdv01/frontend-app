import { MODULES, OPERATIONS, permissionKey, suggestEndpoint } from '../../constants/permissions'

export const MOCK_NOTIFICATIONS_COUNT = 3

// Contraseña de todos los usuarios locales de prueba
export const MOCK_PASSWORD = 'Admin123!'

// Permisos que NO se crean, para que la matriz muestre celdas "no registradas"
const MISSING_PERMISSIONS = ['reportes:crear', 'reportes:eliminar']

function buildPermissions() {
  const permissions = []
  for (const module of MODULES) {
    for (const resource of module.resources) {
      for (const operation of OPERATIONS) {
        const key = permissionKey(resource.key, operation.key)
        if (MISSING_PERMISSIONS.includes(key)) continue
        const endpoint = suggestEndpoint(resource.key, operation.key)
        permissions.push({
          id: permissions.length + 1,
          resource: resource.key,
          operation: operation.key,
          method: endpoint.method,
          url: endpoint.url,
          active: true,
        })
      }
    }
  }
  return permissions
}

const ROLES = [
  { id: 1, name: 'Administrador', description: 'Administrador del sistema', active: true },
  { id: 2, name: 'Coordinador', description: 'Coordina torneos, equipos y partidos', active: true },
  { id: 3, name: 'Operador', description: 'Opera la venta de entradas', active: true },
  { id: 4, name: 'Consulta', description: 'Solo consulta de usuarios', active: true },
  { id: 5, name: 'Juez Deportivo', description: 'Registra resultados de partidos', active: true },
  { id: 6, name: 'Auditor', description: 'Revisión de actividad (sin usar)', active: false },
]

// Qué permisos tiene cada rol: true = todos, o una lista de "recurso:operacion"
const ROLE_PERMISSIONS = {
  1: true,
  2: [
    'usuarios:ver',
    'usuarios:listar',
    ...['torneos', 'equipos', 'jugadores', 'partidos'].flatMap((resource) =>
      OPERATIONS.map((operation) => permissionKey(resource, operation.key)),
    ),
  ],
  3: [
    ...OPERATIONS.map((operation) => permissionKey('entradas', operation.key)),
    'escenarios:ver',
    'escenarios:listar',
  ],
  4: ['usuarios:ver', 'usuarios:listar'],
  5: ['partidos:ver', 'partidos:listar', 'partidos:actualizar', 'jugadores:ver', 'jugadores:listar'],
}

const USERS = [
  { name: 'Carlos Admin', email: 'admin@uc.edu.co', roles: [1] },
  { name: 'Laura Consulta', email: 'consulta@uc.edu.co', roles: [4] },
  { name: 'Andrés Coordinador', email: 'coordinador@uc.edu.co', roles: [2], twoFactorEnabled: true },
  { name: 'María Operadora', email: 'operador@uc.edu.co', roles: [3] },
  { name: 'Jorge Juez', email: 'juez@uc.edu.co', roles: [5] },
  { name: 'Sofía Ramírez', email: 'sofia.ramirez@gmail.com', roles: [4], authProvider: 'google' },
  { name: 'Felipe Castro', email: 'felipe.castro@github.dev', roles: [3], authProvider: 'github' },
  { name: 'Natalia Ríos', email: 'natalia.rios@outlook.com', roles: [4], authProvider: 'microsoft' },
  { name: 'Valentina Gómez', email: 'valentina.gomez@uc.edu.co', roles: [4], active: false },
  { name: 'Daniel Torres', email: 'daniel.torres@uc.edu.co', roles: [2] },
  { name: 'Camila Herrera', email: 'camila.herrera@uc.edu.co', roles: [5] },
  { name: 'Juan Pérez', email: 'juan.perez@uc.edu.co', roles: [] },
]

// Construye la "base de datos" inicial del modo de prueba
export function buildSeed() {
  const permissions = buildPermissions()

  const users = USERS.map((user, index) => ({
    id: index + 1,
    name: user.name,
    email: user.email,
    // Solo es un mock: en el backend real la contraseña se guarda cifrada con BCrypt
    password: (user.authProvider ?? 'local') === 'local' ? MOCK_PASSWORD : null,
    authProvider: user.authProvider ?? 'local',
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    active: user.active ?? true,
  }))

  const userRoles = USERS.flatMap((user, index) =>
    user.roles.map((roleId) => ({ userId: index + 1, roleId })),
  )

  const rolePermissions = Object.entries(ROLE_PERMISSIONS).flatMap(([roleId, keys]) =>
    permissions
      .filter((p) => keys === true || keys.includes(permissionKey(p.resource, p.operation)))
      .map((p) => ({ roleId: Number(roleId), permissionId: p.id })),
  )

  return {
    users,
    roles: ROLES.map((role) => ({ ...role })),
    permissions,
    userRoles,
    rolePermissions,
    profiles: [{ userId: 1, phone: '3001234567', birthDate: '1990-05-12', photo: null }],
    sessions: [],
    twoFactorChallenges: [],
    resetTokens: [],
  }
}
