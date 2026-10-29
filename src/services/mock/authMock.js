import { permissionKey } from '../../constants/permissions'
import { findUserByEmail, getDb, nextId, saveDb } from './mockDb'
import { conflict, delay, httpError } from './mockHttp'

const TOKEN_MINUTES = 15 // igual que el backend (JwtService.TOKEN_DURATION)
const CODE_MINUTES = 5
const RESET_MINUTES = 30

const minutesFromNow = (minutes) => Date.now() + minutes * 60 * 1000

// Usuario, roles y permisos efectivos (= unión de los permisos de sus roles activos)
function buildSessionData(db, user) {
  const roleIds = db.userRoles.filter((ur) => ur.userId === user.id).map((ur) => ur.roleId)
  const roles = db.roles.filter((role) => roleIds.includes(role.id) && role.active)
  const permissionIds = new Set(
    db.rolePermissions
      .filter((rp) => roles.some((role) => role.id === rp.roleId))
      .map((rp) => rp.permissionId),
  )
  const permissions = db.permissions
    .filter((p) => permissionIds.has(p.id) && p.active)
    .map((p) => permissionKey(p.resource, p.operation))
  const profile = db.profiles.find((p) => p.userId === user.id)

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      twoFactorEnabled: user.twoFactorEnabled,
      photo: profile?.photo ?? null,
      roles: roles.map(({ id, name, description }) => ({ id, name, description })),
    },
    permissions: [...new Set(permissions)],
  }
}

function createSession(db, user) {
  const token = `mock-${crypto.randomUUID()}`
  const expiresAt = new Date(minutesFromNow(TOKEN_MINUTES)).toISOString()
  db.sessions.push({ token, userId: user.id, expiresAt })
  saveDb()
  return { token, expiresAt, ...buildSessionData(db, user) }
}

function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function login(email, password) {
  await delay()
  const db = getDb()
  const user = findUserByEmail(email)
  if (!user || user.authProvider !== 'local' || user.password !== password) {
    throw httpError(401, 'UNAUTHORIZED', 'Credenciales incorrectas')
  }
  if (!user.active) {
    throw httpError(403, 'UNAUTHORIZED', 'El usuario está deshabilitado. Contacta al administrador.')
  }

  if (user.twoFactorEnabled) {
    // No se crea la sesión todavía: primero hay que validar el código
    const challenge = {
      id: crypto.randomUUID(),
      userId: user.id,
      code: newCode(),
      expiresAt: minutesFromNow(CODE_MINUTES),
      used: false,
    }
    db.twoFactorChallenges.push(challenge)
    saveDb()
    return { requires2FA: true, challengeId: challenge.id, email: user.email, devCode: challenge.code }
  }

  return createSession(db, user)
}

export async function verifyTwoFactor(challengeId, code) {
  await delay()
  const db = getDb()
  const challenge = db.twoFactorChallenges.find((c) => c.id === challengeId)
  if (!challenge || challenge.used || challenge.code !== code.trim()) {
    throw httpError(401, 'UNAUTHORIZED', 'El código de verificación es incorrecto.')
  }
  if (challenge.expiresAt < Date.now()) {
    throw httpError(401, 'UNAUTHORIZED', 'El código expiró. Solicita uno nuevo.')
  }
  challenge.used = true
  const user = db.users.find((u) => u.id === challenge.userId)
  return createSession(db, user)
}

export async function resendTwoFactor(challengeId) {
  await delay()
  const db = getDb()
  const challenge = db.twoFactorChallenges.find((c) => c.id === challengeId && !c.used)
  if (!challenge) {
    throw httpError(401, 'UNAUTHORIZED', 'El proceso de inicio de sesión ya no es válido.')
  }
  challenge.code = newCode()
  challenge.expiresAt = minutesFromNow(CODE_MINUTES)
  saveDb()
  return { devCode: challenge.code }
}

export async function register({ name, email, password }) {
  await delay()
  const db = getDb()
  if (findUserByEmail(email)) {
    throw conflict('El correo ya está registrado.')
  }
  const user = {
    id: nextId(db.users),
    name: name.trim(),
    email: email.trim(),
    password,
    authProvider: 'local',
    twoFactorEnabled: false,
    active: true,
  }
  db.users.push(user)
  saveDb()
  return { id: user.id, name: user.name, email: user.email }
}

export async function forgotPassword(email) {
  await delay()
  const db = getDb()
  const user = findUserByEmail(email)
  // Solo usuarios con correo y contraseña. La respuesta es la misma exista o no el correo.
  if (!user || user.authProvider !== 'local' || !user.active) {
    return {}
  }
  const token = crypto.randomUUID()
  db.resetTokens.push({ token, userId: user.id, expiresAt: minutesFromNow(RESET_MINUTES), used: false })
  saveDb()
  return { devResetToken: token }
}

export async function resetPassword(token, password) {
  await delay()
  const db = getDb()
  const reset = db.resetTokens.find((r) => r.token === token)
  if (!reset) {
    throw httpError(400, 'INVALID_OPERATION', 'El enlace de recuperación no es válido.')
  }
  if (reset.used) {
    throw httpError(400, 'INVALID_OPERATION', 'Este enlace ya fue utilizado. Solicita uno nuevo.')
  }
  if (reset.expiresAt < Date.now()) {
    throw httpError(400, 'INVALID_OPERATION', 'El enlace de recuperación expiró. Solicita uno nuevo.')
  }
  reset.used = true
  db.users.find((u) => u.id === reset.userId).password = password
  // Se cierran las sesiones anteriores del usuario
  db.sessions = db.sessions.filter((s) => s.userId !== reset.userId)
  saveDb()
}

export async function logout(token) {
  await delay(150)
  const db = getDb()
  db.sessions = db.sessions.filter((s) => s.token !== token)
  saveDb()
}

// En modo prueba no hay proveedor real: se simula el regreso al callback
export function getOAuthUrl(provider) {
  return `/auth/callback?mockProvider=${provider}`
}

/*
 * Identidades simuladas de cada proveedor:
 * - google:    Sofía ya existe con Google → se identifica (no se duplica)
 * - github:    correo nuevo → se crea el usuario automáticamente
 * - microsoft: correo que ya usa una cuenta con contraseña → se rechaza
 */
const MOCK_OAUTH_PROFILES = {
  google: { name: 'Sofía Ramírez', email: 'sofia.ramirez@gmail.com' },
  github: { name: 'Mateo Vargas', email: 'mateo.vargas@github.dev' },
  microsoft: { name: 'Laura Consulta', email: 'consulta@uc.edu.co' },
}

export async function completeOAuth(params) {
  await delay()
  const provider = params.mockProvider
  const profile = MOCK_OAUTH_PROFILES[provider]
  if (!profile) {
    throw httpError(400, 'INVALID_OPERATION', 'Proveedor de autenticación no válido.')
  }
  const db = getDb()
  let user = findUserByEmail(profile.email)

  if (user && user.authProvider !== provider) {
    throw conflict(
      'Este correo ya está registrado con otro método de acceso. Inicia sesión con ese método.',
      'INVALID_OPERATION',
    )
  }
  if (user && !user.active) {
    throw httpError(403, 'UNAUTHORIZED', 'El usuario está deshabilitado. Contacta al administrador.')
  }
  if (!user) {
    user = {
      id: nextId(db.users),
      name: profile.name,
      email: profile.email,
      password: null,
      authProvider: provider,
      twoFactorEnabled: false,
      active: true,
    }
    db.users.push(user)
  }
  return createSession(db, user)
}

// Vuelve a leer roles y permisos del usuario (por ejemplo, tras cambiar la matriz)
export async function refreshSession(session) {
  await delay(100)
  const db = getDb()
  const user = db.users.find((u) => u.id === session.user.id)
  if (!user || !user.active) {
    throw httpError(401, 'UNAUTHORIZED', 'La sesión ya no es válida.')
  }
  return { ...session, ...buildSessionData(db, user) }
}
