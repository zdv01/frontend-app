import { getDb, nextId, saveDb } from './mockDb'
import { clone, conflict, delay, notFound } from './mockHttp'

function findRole(id) {
  const role = getDb().roles.find((r) => r.id === Number(id))
  if (!role) throw notFound('Rol no encontrado')
  return role
}

function ensureUniqueName(name, exceptId) {
  const normalized = name.trim().toLowerCase()
  const existing = getDb().roles.find((r) => r.name.toLowerCase() === normalized)
  if (existing && existing.id !== exceptId) {
    throw conflict('Ya existe un rol con ese nombre.')
  }
}

export async function list() {
  await delay()
  return clone(getDb().roles)
}

export async function get(id) {
  await delay()
  return clone(findRole(id))
}

export async function getWithPermissions(id) {
  await delay()
  const role = findRole(id)
  const db = getDb()
  const permissions = (db.rolePermissions || [])
    .filter((rp) => rp.roleId === role.id)
    .map((rp) => ({
      id: rp.id,
      roleId: rp.roleId,
      permission: db.permissions.find((p) => p.id === rp.permissionId),
    }))
    .filter((rp) => rp.permission)
  return { ...clone(role), permissions }
}

export async function create({ name, description, active = true }) {
  await delay()
  ensureUniqueName(name)
  const db = getDb()
  const role = { id: nextId(db.roles), name: name.trim(), description: description.trim(), active }
  db.roles.push(role)
  saveDb()
  return clone(role)
}

export async function update(id, { name, description, active }) {
  await delay()
  const role = findRole(id)
  ensureUniqueName(name, role.id)
  Object.assign(role, { name: name.trim(), description: description.trim(), active })
  saveDb()
  return clone(role)
}

// No se elimina si tiene usuarios. Al eliminarlo se retiran sus permisos asignados,
// pero los permisos y los usuarios del sistema se conservan.
export async function remove(id) {
  await delay()
  const db = getDb()
  const role = findRole(id)
  if (db.userRoles.some((ur) => ur.roleId === role.id)) {
    throw conflict(
      'No se puede eliminar el rol porque tiene usuarios asignados.',
      'INVALID_OPERATION',
    )
  }
  db.roles = db.roles.filter((r) => r.id !== role.id)
  db.rolePermissions = db.rolePermissions.filter((rp) => rp.roleId !== role.id)
  saveDb()
}
