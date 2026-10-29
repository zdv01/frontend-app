import { getDb, saveDb } from './mockDb'
import { clone, delay, notFound } from './mockHttp'

export async function listPermissionIds(roleId) {
  await delay()
  return getDb()
    .rolePermissions.filter((rp) => rp.roleId === Number(roleId))
    .map((rp) => rp.permissionId)
}

export async function listRolesByPermission(permissionId) {
  await delay()
  const db = getDb()
  const roleIds = db.rolePermissions
    .filter((rp) => rp.permissionId === Number(permissionId))
    .map((rp) => rp.roleId)
  return clone(db.roles.filter((role) => roleIds.includes(role.id)))
}

// Reemplaza los permisos del rol por la lista recibida (acción "Guardar cambios")
export async function save(roleId, permissionIds) {
  await delay()
  const db = getDb()
  const id = Number(roleId)
  if (!db.roles.some((role) => role.id === id)) throw notFound('Rol no encontrado')
  const uniqueIds = [...new Set(permissionIds)]
  db.rolePermissions = [
    ...db.rolePermissions.filter((rp) => rp.roleId !== id),
    ...uniqueIds.map((permissionId) => ({ roleId: id, permissionId })),
  ]
  saveDb()
}
