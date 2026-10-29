import { axiosClient } from '../api/axiosClient'
import { env } from '../config/env'
import { toRole, toUser } from './mappers'
import * as mock from './mock/userRolesMock'

// Asignación de roles a usuarios (HU-SE-04)
const api = {
  // GET /api/user-roles/users/{userId} → [{ id, userId, role }]
  async listRolesByUser(userId) {
    const { data } = await axiosClient.get(`/user-roles/users/${userId}`)
    return data.map((userRole) => toRole(userRole.role))
  },

  // GET /api/user-roles/roles/{roleId} → [{ id, roleId, user }]
  async listUsersByRole(roleId) {
    const { data } = await axiosClient.get(`/user-roles/roles/${roleId}`)
    return data.map((roleUser) => toUser(roleUser.user))
  },

  // POST /api/user-roles { userId, roleId }
  async assign(userId, roleId) {
    await axiosClient.post('/user-roles', { userId, roleId })
  },

  // DELETE /api/user-roles/{userId}/{roleId}
  async remove(userId, roleId) {
    await axiosClient.delete(`/user-roles/${userId}/${roleId}`)
  },
}

export const userRolesService = env.useMocks ? mock : api
