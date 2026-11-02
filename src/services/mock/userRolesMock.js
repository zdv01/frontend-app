import { getDb, saveDb } from './mockDb'
import { clone, conflict, delay, notFound } from './mockHttp'

export async function list() {
  await delay()
  return clone(getDb().userRoles)
}

export async function listRolesByUser(userId) {
  await delay()
  const db = getDb()
  const roleIds = db.userRoles.filter((ur) => ur.userId === Number(userId)).map((ur) => ur.roleId)
  return clone(db.roles.filter((role) => roleIds.includes(role.id)))
}

export async function listUsersByRole(roleId) {
  await delay()
  const db = getDb()
  const userIds = db.userRoles.filter((ur) => ur.roleId === Number(roleId)).map((ur) => ur.userId)
  return db.users
    .filter((user) => userIds.includes(user.id))
    .map(({ id, name, email, authProvider, twoFactorEnabled, active }) =>
      clone({ id, name, email, authProvider, twoFactorEnabled, active }),
    )
}

export async function listAvailableUsersByRole(roleId) {
  await delay()
  const db = getDb()
  const assignedUserIds = new Set(
    db.userRoles.filter((ur) => ur.roleId === Number(roleId)).map((ur) => ur.userId),
  )
  return db.users
    .filter((user) => !assignedUserIds.has(user.id))
    .map(({ id, name, email, authProvider, twoFactorEnabled, active }) =>
      clone({ id, name, email, authProvider, twoFactorEnabled, active }),
    )
}

export async function assign(userId, roleId) {
  await delay(200)
  const db = getDb()
  const user = db.users.find((u) => u.id === Number(userId))
  const role = db.roles.find((r) => r.id === Number(roleId))
  if (!user || !role) throw notFound('El usuario o el rol no existen.')
  if (db.userRoles.some((ur) => ur.userId === user.id && ur.roleId === role.id)) {
    throw conflict('El usuario ya tiene asignado este rol.')
  }
  db.userRoles.push({ userId: user.id, roleId: role.id })
  saveDb()
}

// Retirar el rol no elimina ni al usuario ni al rol
export async function remove(userId, roleId) {
  await delay(200)
  const db = getDb()
  db.userRoles = db.userRoles.filter(
    (ur) => !(ur.userId === Number(userId) && ur.roleId === Number(roleId)),
  )
  saveDb()
}
