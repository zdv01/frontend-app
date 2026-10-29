import { getDb, nextId, saveDb } from './mockDb'
import { clone, conflict, delay, notFound } from './mockHttp'

function findPermission(id) {
  const permission = getDb().permissions.find((p) => p.id === Number(id))
  if (!permission) throw notFound('Permiso no encontrado')
  return permission
}

// No puede haber dos permisos con la misma operación sobre el mismo recurso
function ensureUnique({ resource, operation }, exceptId) {
  const existing = getDb().permissions.find(
    (p) => p.resource === resource && p.operation === operation,
  )
  if (existing && existing.id !== exceptId) {
    throw conflict('Ya existe un permiso para esa operación y recurso.')
  }
}

function normalize({ resource, operation, method, url, active = true }) {
  return { resource, operation, method: method.toUpperCase(), url: url.trim(), active }
}

export async function list() {
  await delay()
  return clone(getDb().permissions)
}

export async function create(data) {
  await delay()
  ensureUnique(data)
  const db = getDb()
  const permission = { id: nextId(db.permissions), ...normalize(data) }
  db.permissions.push(permission)
  saveDb()
  return clone(permission)
}

export async function update(id, data) {
  await delay()
  const permission = findPermission(id)
  ensureUnique(data, permission.id)
  Object.assign(permission, normalize(data))
  saveDb()
  return clone(permission)
}

// Al eliminar un permiso se retira de los roles, pero los roles no se eliminan
export async function remove(id) {
  await delay()
  const db = getDb()
  const permission = findPermission(id)
  db.permissions = db.permissions.filter((p) => p.id !== permission.id)
  db.rolePermissions = db.rolePermissions.filter((rp) => rp.permissionId !== permission.id)
  saveDb()
}
