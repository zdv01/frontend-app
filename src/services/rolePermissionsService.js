import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toRole } from './mappers'
import * as mock from './mock/rolePermissionsMock'

// Asignación de permisos a roles (HU-SE-06)
const api = {
  // GET /api/role-permissions/roles/{roleId} → [{ id, roleId, permission }]
  async listPermissionIds(roleId) {
    const { data } = await axiosClient.get(`/role-permissions/roles/${roleId}`)
    return data.map((rolePermission) => rolePermission.permission.id)
  },

  // GET /api/role-permissions/permissions/{permissionId} → [{ id, permissionId, role }]
  async listRolesByPermission(permissionId) {
    const { data } = await axiosClient.get(`/role-permissions/permissions/${permissionId}`)
    return data.map((permissionRole) => toRole(permissionRole.role))
  },

  // "Guardar cambios": el backend asigna y retira de a uno, así que se calcula la diferencia
  // POST /api/role-permissions { roleId, permissionId }
  // DELETE /api/role-permissions/{roleId}/{permissionId}
  async save(roleId, permissionIds) {
    const current = new Set(await api.listPermissionIds(roleId))
    const wanted = new Set(permissionIds)
    const toAdd = [...wanted].filter((id) => !current.has(id))
    const toRemove = [...current].filter((id) => !wanted.has(id))
    await Promise.all([
      ...toAdd.map((permissionId) => axiosClient.post('/role-permissions', { roleId, permissionId })),
      ...toRemove.map((permissionId) =>
        axiosClient.delete(`/role-permissions/${roleId}/${permissionId}`),
      ),
    ])
  },
}

export const rolePermissionsService = env.useMocks ? mock : api
