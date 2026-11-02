import { findUserByEmail, getDb, nextId, saveDb } from './mockDb'
import { clone, conflict, delay, notFound } from './mockHttp'

// Nunca se devuelve la contraseña
function toPublic(user) {
  const { id, name, email, authProvider, twoFactorEnabled, active } = user
  return clone({ id, name, email, authProvider, twoFactorEnabled, active })
}

function findUser(id) {
  const user = getDb().users.find((u) => u.id === Number(id))
  if (!user) throw notFound('Usuario no encontrado')
  return user
}

function ensureUniqueEmail(email, exceptId) {
  const existing = findUserByEmail(email)
  if (existing && existing.id !== exceptId) {
    throw conflict('El correo ya está registrado.')
  }
}

export async function list() {
  await delay()
  return getDb().users.map(toPublic)
}

export async function listAvailableForRole(roleId) {
  await delay()
  const db = getDb()
  const assignedIds = new Set(
    db.userRoles.filter((userRole) => userRole.roleId === Number(roleId)).map((userRole) => userRole.userId),
  )
  return db.users.filter((user) => user.active && !assignedIds.has(user.id)).map(toPublic)
}

export async function get(id) {
  await delay()
  return toPublic(findUser(id))
}

export async function create({ name, email, password }) {
  await delay()
  ensureUniqueEmail(email)
  const db = getDb()
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
  return toPublic(user)
}

export async function update(id, { name, email, password }) {
  await delay()
  const user = findUser(id)
  ensureUniqueEmail(email, user.id)
  user.name = name.trim()
  user.email = email.trim()
  if (password) user.password = password
  saveDb()
  return toPublic(user)
}

// Desactivar en lugar de borrar: los roles y permisos del sistema no se tocan
export async function setActive(id, active) {
  await delay()
  const db = getDb()
  const user = findUser(id)
  user.active = active
  if (!active) {
    db.sessions = db.sessions.filter((s) => s.userId !== user.id)
  }
  saveDb()
  return toPublic(user)
}
